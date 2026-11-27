/**
 * THE WORKER CHECK OF ONE GROUP (feature 154, T079; F154-FR-034, -035, -036):
 * with `loop.parallel.groupCheck` on (the attempt's `workerCheck` input), the
 * group's frozen acceptance check runs IN ITS WORKER TREE at the barrier,
 * through the real check runner, and its verdict is written as the record
 * `specstride.worker-check/1` under the control plane:
 *
 *  - (a) THE CWD IS THE WORKER TREE: a check that reads the work of its own
 *    tree passes, though the workspace still holds none of it;
 *  - (b) THE DECLARED LIMIT IS HONOURED: a check that runs past its declared
 *    `timeLimitMs` fails at (about) the limit, never at the fixed 300 s;
 *  - (c) A FAILING CHECK REFUSES THE GROUP: the delta of every worker is
 *    refused with `group-check`, ONE repair is charged per task of the group
 *    (F154-FR-036; CQ-154-04 A, the exception to F143-FR-012), the directive
 *    is `none` and the tasks return to the main line;
 *  - (d) A CHECK THAT WRITES A TRACKED PATH TAINTS THE GROUP: the verdict is
 *    `tainted`, the delta is withheld, and the workspace holds none of the
 *    group's work;
 *  - (e) A GROUP WITH NO RESOLVABLE CHECK IS `unchecked` AND GOES ON: the
 *    group merges as it would have without the switch (F154-FR-036).
 *
 * No event of the worker check exists (F142-FR-066's vocabulary is
 * unchanged): the record is the only surface.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import type { CheckRunner, ManifestEntry } from "@specstride/contracts/ep/check-runner";
import type { RegistryAccess, RegistryEntry } from "../../../core/src/pass-supervision/ports.ts";
import { releaseTheWriter } from "../../../core/src/parallel/integrate.ts";
import type { ParallelPlan } from "../../../layer-parallel/src/index.ts";
import { writeWorkerGuardScript } from "../../src/engine/worker-supervisor.ts";
import { startTimeOf } from "@specstride/kernel";
import { runTheGroupOfTheAttempt } from "../../src/engine/parallel-attempt.ts";
import {
  readTheWorkerCheckRecord,
  workerCheckRecordPathOf,
  WORKER_CHECK_RECORD_SCHEMA,
  type WorkerCheckRecord,
  type PreparedWorker,
} from "../../src/engine/parallel-group.ts";
import type { GroupAcceptanceCheck } from "../../../core/src/spec-groups/slicer.ts";

/* ------------------------------------------------------------------ *
 * The fixture (the harness of `parallel-attempt.test.ts`, narrowed).
 * ------------------------------------------------------------------ */

const TASK_LIST = "tasks.md";
const SLUG = "worker-check-154";
const RUN_ID = "run-worker-check-154";

const hash = (text: string): string => createHash("sha256").update(text).digest("hex");

type Fixture = {
  readonly root: string;
  readonly workspace: string;
  readonly controlRoot: string;
  readonly home: string;
  readonly registry: RegistryAccess;
  readonly guardScriptPath: string;
  cleanup: () => void;
};

function git(cwd: string, ...argv: readonly string[]): void {
  const done = spawnSync("git", argv, { cwd, encoding: "utf8" });
  assert.equal(done.status, 0, `git ${argv.join(" ")} failed: ${done.stderr}`);
}

function fixtureOf(name: string): Fixture {
  const root = mkdtempSync(join(tmpdir(), `worker-check-154-${name}-`));
  const workspace = join(root, "workspace");
  mkdirSync(join(workspace, "src"), { recursive: true });
  git(workspace, "init", "--quiet", ".");
  git(workspace, "config", "user.email", "t@t");
  git(workspace, "config", "user.name", "t");
  writeFileSync(join(workspace, ".gitignore"), ".specstride/\n");
  writeFileSync(join(workspace, "src", "a.ts"), "export const a = 1;\n");
  writeFileSync(join(workspace, "src", "b.ts"), "export const b = 2;\n");
  writeFileSync(
    join(workspace, TASK_LIST),
    "- [ ] 2-a the first task\n- [ ] 2-b the second task\n",
  );
  git(workspace, "add", "--", ".");
  git(workspace, "commit", "-q", "-m", "the worker-check bench");
  const controlRoot = join(root, "control");
  const home = join(root, "home");
  mkdirSync(home, { recursive: true });
  mkdirSync(join(controlRoot, "runs", RUN_ID), { recursive: true });
  const registryPath = join(root, "procs.json");
  const guardScriptPath = join(root, "worker-guard.mjs");
  writeWorkerGuardScript(guardScriptPath);
  return {
    root,
    workspace,
    controlRoot,
    home,
    registry: registryAccessOf(registryPath),
    guardScriptPath,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

function registryAccessOf(path: string): RegistryAccess {
  const readAll = (): Record<string, RegistryEntry> => {
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Record<string, RegistryEntry>;
    } catch {
      return {};
    }
  };
  const writeAll = (entries: Record<string, RegistryEntry>): void => {
    writeFileSync(path, JSON.stringify(entries, null, 2));
  };
  return {
    get: (logicalName) => readAll()[logicalName],
    put: (entry) => {
      const all = readAll();
      all[entry.logicalName] = entry;
      writeAll(all);
    },
    remove: (logicalName) => {
      const all = readAll();
      if (all[logicalName] === undefined) return;
      delete all[logicalName];
      writeAll(all);
    },
    adoptable: () =>
      Object.values(readAll()).filter((entry) => entry.registryClass === "adoptable"),
  };
}

function planOfGroup(): ParallelPlan {
  const scope = { prefixes: ["src"], source: "task-text" as const };
  return {
    schema: "specstride.parallel-plan/1",
    runId: RUN_ID,
    hash: "plan-hash-worker-check",
    workers: 2,
    fallback: undefined,
    phases: [
      {
        phase: 2,
        groups: [{ ordinal: 1, phase: 2, tasks: ["2-a", "2-b"] }],
        tasks: [
          { id: "2-a", scope, checks: [] },
          { id: "2-b", scope, checks: [] },
        ],
        serial: [],
        ceiling: 2,
      },
    ],
  };
}

/** A REAL check runner: the command runs as a process with its real exit. */
function spawnRunner(): CheckRunner {
  const results = new Map<string, { exitCode: number; durationMs: number }>();
  let next = 0;
  return {
    pin: async (entry) => ({
      kind: "command",
      executable: entry.argv[0] ?? "node",
      argv: entry.argv.slice(1),
    }),
    start: async (probe) => {
      const id = `h${String(++next)}`;
      const began = Date.now();
      const done = spawnSync(probe.identity.executable ?? "node", probe.identity.argv ?? [], {
        cwd: probe.workingDirectory,
        encoding: "utf8",
        timeout: probe.timeLimitMs,
      });
      results.set(id, { exitCode: done.status ?? 1, durationMs: Date.now() - began });
      return { id };
    },
    poll: async () => ({ state: "ended" as const }),
    result: async (handle) => {
      const one = results.get(handle.id);
      assert.ok(one !== undefined, `no result for the handle ${handle.id}`);
      return {
        exitCode: one.exitCode,
        durationMs: one.durationMs,
        output: { logicalName: "out", hash: hash("out"), size: 0 },
        tainted: false,
        cached: false,
        flaky: false,
        interrupted: false,
        unchecked: false,
      };
    },
    cancel: async () => {},
    environment: () => ({}),
  };
}

async function tickOfTheTaskList(
  workspace: string,
  taskIds: readonly string[],
): Promise<{ readonly ticked: readonly { readonly taskId: string; readonly line: number }[] }> {
  const path = join(workspace, TASK_LIST);
  const lines = readFileSync(path, "utf8").split("\n");
  const ticked: { taskId: string; line: number }[] = [];
  for (const taskId of taskIds) {
    const at = lines.findIndex((line) => line.startsWith(`- [ ] ${taskId} `));
    if (at === -1) continue;
    lines[at] = lines[at]!.replace("- [ ] ", "- [x] ");
    ticked.push({ taskId, line: at + 1 });
  }
  writeFileSync(path, lines.join("\n"));
  return { ticked };
}

/* ------------------------------------------------------------------ *
 * The stub door and the attempt input.
 * ------------------------------------------------------------------ */

const STUB_SCRIPT = `
const fs = require("node:fs");
const path = require("node:path");
const [outbox, taskId, treePath, target, addition] = process.argv.slice(1);
fs.mkdirSync(outbox, { recursive: true });
fs.writeFileSync(path.join(outbox, taskId + ".checkpoint.json"), JSON.stringify({ task: taskId }));
const at = path.join(treePath, target);
fs.writeFileSync(at, fs.readFileSync(at, "utf8") + addition);
`;

function stubStartDoor(): {
  readonly start: (worker: PreparedWorker) => Promise<StartedWorkerPassStub>;
} {
  return {
    start: async (worker) => {
      const child = spawn(
        process.execPath,
        [
          "-e",
          STUB_SCRIPT,
          worker.outboxPath,
          worker.taskId,
          worker.tree,
          `src/${worker.taskId.slice(2)}.ts`,
          `\n// ${worker.taskId} was here\n`,
        ],
        { detached: true, stdio: "ignore" },
      ) as ChildProcess & { pid: number };
      const pid = child.pid as number;
      child.unref();
      const ended = new Promise<"ended" | "killed">((done) => {
        child.once("exit", (code) => done(code === 0 ? "ended" : "killed"));
      });
      return {
        workerId: worker.workerId,
        pid,
        startTime: new Date().toISOString(),
        processGroup: pid,
        runTokenHash: hash("run-token-worker-check"),
        ended,
      };
    },
  };
}
type StartedWorkerPassStub = {
  readonly workerId: string;
  readonly pid: number;
  readonly startTime?: string | undefined;
  readonly processGroup?: number | undefined;
  readonly runTokenHash: string;
  readonly ended: Promise<"ended" | "killed">;
};

type AttemptInput = Parameters<typeof runTheGroupOfTheAttempt>[0];

function inputOf(fixture: Fixture): AttemptInput {
  return {
    controlRoot: fixture.controlRoot,
    runId: RUN_ID,
    home: fixture.home,
    plan: planOfGroup(),
    phase: 2,
    groupOrdinal: 1,
    workspace: fixture.workspace,
    slug: SLUG,
    taskListPath: TASK_LIST,
    model: "stub",
    modelTierOrEffort: "stub",
    containment: "C2",
    runToken: "run-token-worker-check",
    timeLimitSec: 120,
    promptOf: (worker) => `the prompt of ${worker.taskId}`,
    outputRootOf: (worker) => join(fixture.root, "outputs", worker.workerId),
    startDoor: stubStartDoor().start,
    enginePid: process.pid,
    engineStartedAtMs: startTimeOf(process.pid) ?? 0,
    workersAtATime: 2,
    guardScriptPath: fixture.guardScriptPath,
    registry: fixture.registry,
    taskTextAtLaunch: "- [ ] 2-a the first task\n- [ ] 2-b the second task\n",
    secretsOf: (workerId, workerToken) => ({
      workerRoot: join(fixture.home, ".specstride", "worker-roots", RUN_ID),
      treeStore: join(fixture.controlRoot, "tree-store"),
      controlPlane: fixture.controlRoot,
      workerToken,
    }),
    singleWriter: {
      taskList: join(fixture.workspace, TASK_LIST),
      phaseEvidence: [],
      notebook: join(fixture.controlRoot, "notebook.md"),
      handoff: join(fixture.home, ".specstride", "worker-roots", RUN_ID, "handoff.json"),
      workspacePart: join(fixture.workspace, ".specstride"),
    },
    tick: (taskIds) => tickOfTheTaskList(fixture.workspace, taskIds),
    runner: spawnRunner(),
    innerCheckSet: [],
    hash,
    emit: () => {},
    say: () => {},
  };
}

/** The merge probe: the workspace holds the first worker's mark. */
function probeOf(fixture: Fixture): ManifestEntry {
  return {
    id: "the-probe",
    kind: "command",
    argv: [
      "node",
      "-e",
      `const fs=require("node:fs");process.exit(fs.readFileSync(process.argv[1],"utf8").includes(process.argv[2])?0:1)`,
      join(fixture.workspace, "src", "a.ts"),
      "2-a was here",
    ],
    phase: 2,
    timeLimitMs: 30_000,
  };
}

function recordOf(fixture: Fixture): WorkerCheckRecord {
  const path = workerCheckRecordPathOf({
    controlRoot: fixture.controlRoot,
    slug: SLUG,
    runId: RUN_ID,
    phase: 2,
    groupId: "g-2-1",
  });
  const record = readTheWorkerCheckRecord(path);
  assert.ok(record !== undefined, `no worker-check record at ${path}`);
  return record;
}

/* ------------------------------------------------------------------ *
 * The tests.
 * ------------------------------------------------------------------ */

test("(a) the acceptance check runs in the worker tree, not the workspace", async () => {
  const fixture = fixtureOf("cwd");
  try {
    const acceptanceCheck: GroupAcceptanceCheck = {
      kind: "declared",
      id: "verify-cwd",
      // Reads the mark of ITS OWN tree, relatively: only a cwd of the worker
      // tree can see it — the workspace still holds none of the group's work.
      // The group's check passes in a tree that holds EITHER member's mark:
      // each worker tree holds its own task's work.
      argv: [
        process.execPath,
        "-e",
        'const fs=require("node:fs");' +
          'const one=(p,m)=>{try{return fs.readFileSync(p,"utf8").includes(m)}catch{return false}};' +
          'process.exit(one("src/a.ts","2-a was here")||one("src/b.ts","2-b was here")?0:1)',
      ],
      timeLimitMs: 30_000,
    };
    const attempt = await runTheGroupOfTheAttempt({
      ...inputOf(fixture),
      innerCheckSet: [probeOf(fixture)],
      workerCheck: { on: true, acceptanceCheck },
    });
    assert.equal(attempt.ok, true, attempt.ok ? "" : attempt.message);
    if (!attempt.ok) return;
    assert.equal(attempt.outcome, "kept");
    // The record binds the run, the phase, the group and the declared check.
    const record = recordOf(fixture);
    assert.equal(record.schema, WORKER_CHECK_RECORD_SCHEMA);
    assert.equal(record.runId, RUN_ID);
    assert.equal(record.phase, 2);
    assert.equal(record.groupId, "g-2-1");
    assert.deepEqual(record.check, {
      kind: "declared",
      id: "verify-cwd",
      argv: acceptanceCheck.argv,
      timeLimitMs: 30_000,
    });
    assert.equal(record.result, "passed");
    assert.equal(record.exitCode, 0);
    // Both trees were checked, per worker, and each passed.
    assert.deepEqual(Object.keys(record.workers ?? {}).sort(), ["w-1", "w-2"]);
    for (const worker of Object.values(record.workers ?? {})) {
      assert.equal(worker.result, "passed");
    }
    // The record is the ONLY surface: no event of the worker check exists.
    const file = join(fixture.controlRoot, "runs", RUN_ID, "parallel-ledger.jsonl");
    const ledger = readFileSync(file, "utf8");
    assert.ok(
      !ledger.includes("specstride.worker-check"),
      "the worker check left no trace in the ledger",
    );
  } finally {
    releaseTheWriter(`${RUN_ID}:ledger`);
    fixture.cleanup();
  }
});

test("(b) the declared time limit is honoured, not the fixed 300 s", async () => {
  const fixture = fixtureOf("limit");
  try {
    const began = Date.now();
    const attempt = await runTheGroupOfTheAttempt({
      ...inputOf(fixture),
      workerCheck: {
        on: true,
        acceptanceCheck: {
          kind: "declared",
          id: "verify-slow",
          argv: [process.execPath, "-e", "setTimeout(() => {}, 60000)"],
          timeLimitMs: 400,
        },
      },
    });
    const elapsed = Date.now() - began;
    assert.equal(attempt.ok, true, attempt.ok ? "" : attempt.message);
    if (!attempt.ok) return;
    const record = recordOf(fixture);
    assert.equal(record.result, "failed", "a check past its limit must fail the group");
    assert.notEqual(record.exitCode, 0);
    assert.ok(
      (record.durationMs ?? 0) < 5_000,
      `the check ran ${String(record.durationMs)} ms, far past its declared 400 ms`,
    );
    assert.ok(
      elapsed < 30_000,
      `the attempt took ${String(elapsed)} ms — the limit was not the fixed 300 s`,
    );
  } finally {
    releaseTheWriter(`${RUN_ID}:ledger`);
    fixture.cleanup();
  }
});

test("(c) a failing check refuses the group and charges one repair per task", async () => {
  const fixture = fixtureOf("failing");
  try {
    const attempt = await runTheGroupOfTheAttempt({
      ...inputOf(fixture),
      workerCheck: {
        on: true,
        acceptanceCheck: {
          kind: "declared",
          id: "verify-fail",
          argv: [process.execPath, "-e", "process.exit(1)"],
          timeLimitMs: 30_000,
        },
      },
    });
    assert.equal(attempt.ok, true, attempt.ok ? "" : attempt.message);
    if (!attempt.ok) return;
    assert.equal(attempt.outcome, "failed");
    assert.equal(attempt.directive, "none");
    assert.deepEqual(attempt.tasksOnTheMainLine, ["2-a", "2-b"]);
    assert.deepEqual(attempt.keptUnits, []);
    // EVERY worker's delta is refused, with the group-check reason.
    assert.equal(attempt.audit.refused.length, 2);
    for (const refusal of attempt.audit.refused) {
      assert.equal(refusal.reason, "group-check");
    }
    // F154-FR-036 (CQ-154-04 A) — ONE repair per task of the group.
    assert.deepEqual(attempt.repairsCharged, [
      { groupId: "g-2-1", taskId: "2-a", repairs: 1 },
      { groupId: "g-2-1", taskId: "2-b", repairs: 1 },
    ]);
    const record = recordOf(fixture);
    assert.equal(record.result, "failed");
    // Nothing of the group reached the workspace, and no task is ticked.
    assert.ok(
      !readFileSync(join(fixture.workspace, "src", "a.ts"), "utf8").includes("2-a was here"),
      "a refused group must not integrate",
    );
    const list = readFileSync(join(fixture.workspace, TASK_LIST), "utf8");
    assert.ok(!list.includes("- [x] 2-a "), "a refused task must not be ticked");
    assert.ok(!list.includes("- [x] 2-b "), "a refused task must not be ticked");
    // The refusal is recorded, but NO EVENT and no new ledger kind exists.
    const kinds = readFileSync(
      join(fixture.controlRoot, "runs", RUN_ID, "parallel-ledger.jsonl"),
      "utf8",
    )
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => (JSON.parse(line) as { kind?: string }).kind);
    assert.ok(!kinds.includes("group_check_refused"), "no new ledger kind");
    assert.ok(kinds.includes("group_closed"), "the group still closed");
  } finally {
    releaseTheWriter(`${RUN_ID}:ledger`);
    fixture.cleanup();
  }
});

test("(d) a check that writes a tracked path taints the group", async () => {
  const fixture = fixtureOf("tainted");
  try {
    const attempt = await runTheGroupOfTheAttempt({
      ...inputOf(fixture),
      workerCheck: {
        on: true,
        acceptanceCheck: {
          kind: "declared",
          id: "verify-tainting",
          // The check EXITS 0 — but it wrote into its tree while it ran:
          // F154-FR-035 refuses the group all the same.
          argv: [process.execPath, "-e", `require("node:fs").appendFileSync("src/a.ts", "x")`],
          timeLimitMs: 30_000,
        },
      },
    });
    assert.equal(attempt.ok, true, attempt.ok ? "" : attempt.message);
    if (!attempt.ok) return;
    const record = recordOf(fixture);
    assert.equal(record.result, "tainted", "a check that wrote must taint, whatever its exit");
    assert.notEqual(record.snapshotBefore, record.snapshotAfter);
    assert.equal(attempt.outcome, "failed");
    assert.equal(attempt.directive, "none");
    assert.deepEqual(attempt.tasksOnTheMainLine, ["2-a", "2-b"]);
    // The delta is withheld: the workspace holds none of the group's work.
    assert.ok(
      !readFileSync(join(fixture.workspace, "src", "a.ts"), "utf8").includes("2-a was here"),
    );
    assert.ok(
      !readFileSync(join(fixture.workspace, "src", "b.ts"), "utf8").includes("2-b was here"),
    );
    // The taint charged its repairs like a failure does (F154-FR-036).
    assert.equal(attempt.repairsCharged?.length, 2);
  } finally {
    releaseTheWriter(`${RUN_ID}:ledger`);
    fixture.cleanup();
  }
});

test("(e) a group with no resolvable check is unchecked and goes on", async () => {
  const fixture = fixtureOf("unchecked");
  try {
    const attempt = await runTheGroupOfTheAttempt({
      ...inputOf(fixture),
      innerCheckSet: [probeOf(fixture)],
      workerCheck: { on: true, acceptanceCheck: { kind: "unchecked" } },
    });
    assert.equal(attempt.ok, true, attempt.ok ? "" : attempt.message);
    if (!attempt.ok) return;
    assert.equal(attempt.outcome, "kept");
    assert.deepEqual(attempt.keptUnits, [["2-a", "2-b"]]);
    const record = recordOf(fixture);
    assert.equal(record.result, "unchecked");
    assert.deepEqual(record.check, { kind: "unchecked" });
    // No command ran: no exit code, no duration.
    assert.equal(record.exitCode, undefined);
    assert.equal(record.durationMs, undefined);
    // The group merged as it would have without the switch.
    assert.ok(
      readFileSync(join(fixture.workspace, "src", "a.ts"), "utf8").includes("2-a was here"),
    );
    assert.ok(readFileSync(join(fixture.workspace, TASK_LIST), "utf8").includes("- [x] 2-a "));
  } finally {
    releaseTheWriter(`${RUN_ID}:ledger`);
    fixture.cleanup();
  }
});

test("(f) with the worker check off, no record is written and nothing changes", async () => {
  const fixture = fixtureOf("off");
  try {
    const attempt = await runTheGroupOfTheAttempt({
      ...inputOf(fixture),
      innerCheckSet: [probeOf(fixture)],
    });
    assert.equal(attempt.ok, true, attempt.ok ? "" : attempt.message);
    if (!attempt.ok) return;
    assert.equal(attempt.outcome, "kept");
    assert.equal(attempt.repairsCharged, undefined);
    const path = workerCheckRecordPathOf({
      controlRoot: fixture.controlRoot,
      slug: SLUG,
      runId: RUN_ID,
      phase: 2,
      groupId: "g-2-1",
    });
    assert.equal(existsSync(path), false, "no record where the check is off");
    assert.deepEqual(attempt.audit.refused, []);
  } finally {
    releaseTheWriter(`${RUN_ID}:ledger`);
    fixture.cleanup();
  }
});
