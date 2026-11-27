/**
 * THE UNIT OF THE APPROVAL AND THE COMMIT (feature 154, T087; F154-FR-037;
 * CQ-153-07 A): the group — whether the micro layer's task group or the
 * parallel unit of feature 154 — is the unit of a PASS, never of an APPROVAL
 * and never of a COMMIT.
 *
 *  - OVER THE PARALLEL UNIT: after a group attempt that kept the group, the
 *    git history of the workspace stands as it was (no commit was added), no
 *    approval record exists for the feature under the control plane, and the
 *    parallel ledger of the run holds no approval and no commit kind — the
 *    closed vocabulary of F142-FR-066 never had one to hold;
 *  - OVER THE ENGINE, GROUPS AS UNITS: a full `runFeature` phase with
 *    `taskGroups` on (and the group check on) still ends with EXACTLY ONE
 *    approval record — the gate's, for the phase — and EXACTLY ONE commit,
 *    the gate's `specstride: phase 1 approved` commit: none was added per
 *    group (the F153-SC-015 finding, held under the 154 switch).
 */
import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { tmpdir } from "node:os";
import test from "node:test";

import type { CheckRunner, ManifestEntry } from "@specstride/contracts/ep/check-runner";
import type { RegistryAccess, RegistryEntry } from "../../../core/src/pass-supervision/ports.ts";
import { PARALLEL_LEDGER_KINDS } from "../../../core/src/parallel/ledger-kinds.ts";
import { releaseTheWriter } from "../../../core/src/parallel/integrate.ts";
import { sliceThePhase } from "../../../core/src/spec-groups/slicer.ts";
import { startTimeOf } from "@specstride/kernel";
import { runFeature } from "../../src/engine/run-feature.ts";
import { workspaceIdOfWorkspace } from "../../src/engine/workspace-control-root.ts";
import { writeWorkerGuardScript } from "../../src/engine/worker-supervisor.ts";
import { runTheGroupOfTheAttempt } from "../../src/engine/parallel-attempt.ts";
import { fixture, type Verdicts } from "./loop-speed-helpers.ts";

const hash = (text: string): string => createHash("sha256").update(text).digest("hex");

/* ================================================================== *
 * Part 1 — the parallel unit approves and commits nothing.
 * ================================================================== */

const SLUG = "approval-unit-154";
const RUN_ID = "run-approval-unit-154";
const TASK_LIST = "tasks.md";

type Bench = {
  readonly root: string;
  readonly workspace: string;
  readonly controlRoot: string;
  readonly home: string;
  cleanup: () => void;
};

function benchOf(): Bench {
  const root = mkdtempSync(join(tmpdir(), "approval-unit-154-"));
  const workspace = join(root, "workspace");
  mkdirSync(join(workspace, "src"), { recursive: true });
  for (const argv of [
    ["init", "--quiet", "."],
    ["config", "user.email", "t@t"],
    ["config", "user.name", "t"],
  ]) {
    spawnSync("git", argv, { cwd: workspace });
  }
  writeFileSync(join(workspace, ".gitignore"), ".specstride/\n");
  writeFileSync(join(workspace, "src", "a.ts"), "export const a = 1;\n");
  writeFileSync(join(workspace, TASK_LIST), "- [ ] 2-a the first task\n");
  spawnSync("git", ["add", "--", "."], { cwd: workspace });
  spawnSync("git", ["commit", "-q", "-m", "the approval bench"], { cwd: workspace });
  const controlRoot = join(root, "control");
  const home = join(root, "home");
  mkdirSync(home, { recursive: true });
  mkdirSync(join(controlRoot, "runs", RUN_ID), { recursive: true });
  const guardScriptPath = join(root, "worker-guard.mjs");
  writeWorkerGuardScript(guardScriptPath);
  return {
    root,
    workspace,
    controlRoot,
    home,
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

/** A REAL check runner (the harness of `parallel-attempt.test.ts`). */
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

const STUB_SCRIPT = `
const fs = require("node:fs");
const path = require("node:path");
const [outbox, taskId, treePath, target, addition] = process.argv.slice(1);
fs.mkdirSync(outbox, { recursive: true });
fs.writeFileSync(path.join(outbox, taskId + ".checkpoint.json"), JSON.stringify({ task: taskId }));
const at = path.join(treePath, target);
fs.writeFileSync(at, fs.readFileSync(at, "utf8") + addition);
`;

/** The start door over the WORKSPACE paths (the workers edit `src/a.ts`). */
function stubStartDoorOf(workspace: string) {
  return {
    start: async (worker: { outboxPath: string; taskId: string; tree: string }) => {
      const child = spawn(
        process.execPath,
        ["-e", STUB_SCRIPT, worker.outboxPath, worker.taskId, worker.tree, "src/a.ts", "\n// x\n"],
        { detached: true, stdio: "ignore" },
      ) as ChildProcess & { pid: number };
      const pid = child.pid as number;
      child.unref();
      const ended = new Promise<"ended" | "killed">((done) => {
        child.once("exit", (code) => done(code === 0 ? "ended" : "killed"));
      });
      void workspace;
      return {
        workerId: worker.workerId,
        pid,
        startTime: new Date().toISOString(),
        processGroup: pid,
        runTokenHash: hash("run-token-approval"),
        ended,
      };
    },
  };
}

test("a parallel group that keeps its work adds no commit and no approval", async () => {
  const bench = benchOf();
  try {
    const headCount = () =>
      spawnSync("git", ["-C", bench.workspace, "rev-list", "--count", "HEAD"])
        .stdout.toString()
        .trim();
    assert.equal(headCount(), "1");
    const attempt = await runTheGroupOfTheAttempt({
      controlRoot: bench.controlRoot,
      runId: RUN_ID,
      home: bench.home,
      plan: {
        schema: "specstride.parallel-plan/1",
        runId: RUN_ID,
        hash: "plan-hash-approval",
        workers: 1,
        fallback: undefined,
        phases: [
          {
            phase: 2,
            groups: [{ ordinal: 1, phase: 2, tasks: ["2-a"] }],
            tasks: [
              { id: "2-a", scope: { prefixes: ["src"], source: "task-text" as const }, checks: [] },
            ],
            serial: [],
            ceiling: 1,
          },
        ],
      },
      phase: 2,
      groupOrdinal: 1,
      workspace: bench.workspace,
      slug: SLUG,
      taskListPath: TASK_LIST,
      model: "stub",
      modelTierOrEffort: "stub",
      containment: "C2",
      runToken: "run-token-approval",
      timeLimitSec: 120,
      promptOf: (worker) => `the prompt of ${worker.taskId}`,
      outputRootOf: (worker) => join(bench.root, "outputs", worker.workerId),
      startDoor: stubStartDoorOf(bench.workspace).start,
      enginePid: process.pid,
      engineStartedAtMs: startTimeOf(process.pid) ?? 0,
      workersAtATime: 1,
      guardScriptPath: join(bench.root, "worker-guard.mjs"),
      registry: registryAccessOf(join(bench.root, "procs.json")),
      taskTextAtLaunch: "- [ ] 2-a the first task\n",
      secretsOf: (_workerId, workerToken) => ({
        workerRoot: join(bench.home, ".specstride", "worker-roots", RUN_ID),
        treeStore: join(bench.controlRoot, "tree-store"),
        controlPlane: bench.controlRoot,
        workerToken,
      }),
      singleWriter: {
        taskList: join(bench.workspace, TASK_LIST),
        phaseEvidence: [],
        notebook: join(bench.controlRoot, "notebook.md"),
        handoff: join(bench.home, ".specstride", "worker-roots", RUN_ID, "handoff.json"),
        workspacePart: join(bench.workspace, ".specstride"),
      },
      tick: async (taskIds) => {
        const path = join(bench.workspace, TASK_LIST);
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
      },
      runner: spawnRunner(),
      innerCheckSet: [
        {
          id: "the-gate-probe",
          kind: "command",
          argv: [process.execPath, "-e", "process.exit(0)"],
          phase: 2,
          timeLimitMs: 30_000,
        },
      ] as readonly ManifestEntry[],
      hash,
      emit: () => {},
      say: () => {},
    });
    assert.equal(attempt.ok, true, attempt.ok ? "" : attempt.message);
    if (!attempt.ok) return;
    assert.equal(attempt.outcome, "kept");
    // F154-FR-037 (CQ-153-07 A) — the group is the unit of a PASS, never of
    // a COMMIT: the git history stands as it was.
    assert.equal(headCount(), "1", "a parallel group must not commit");
    // ... and never of an APPROVAL: no approval record exists for the feature.
    const approvalsDir = join(bench.controlRoot, "features", SLUG, "approvals");
    assert.ok(
      !existsSync(approvalsDir) || readdirSync(approvalsDir).length === 0,
      "a parallel group must not write an approval record",
    );
    // The parallel ledger of the run holds no approval and no commit kind.
    const ledger = readFileSync(
      join(bench.controlRoot, "runs", RUN_ID, "parallel-ledger.jsonl"),
      "utf8",
    );
    const kinds = ledger
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => (JSON.parse(line) as { kind?: string }).kind);
    for (const kind of kinds) {
      assert.ok(
        !/approv|commit/i.test(String(kind)),
        `no approval or commit kind, saw ${String(kind)}`,
      );
    }
    // The closed vocabulary of F142-FR-066 has no approval and no commit kind
    // for a parallel group to use even if it wanted to.
    for (const kind of PARALLEL_LEDGER_KINDS) {
      assert.ok(!/approv|commit/i.test(kind), `the closed set holds ${kind}`);
    }
  } finally {
    releaseTheWriter(`${RUN_ID}:ledger`);
    bench.cleanup();
  }
});

/* ================================================================== *
 * Part 2 — the engine with groups as units keeps one approval, one commit.
 * (The harness of `loop-speed-groups.test.ts`, CT-153-57, with the 154
 * switch on as well.)
 * ================================================================== */

/** The control root the engine of this fixture's workspace writes. */
function controlOf(work: string): string {
  return join(process.env.HOME ?? "", ".specstride", "workspaces", workspaceIdOfWorkspace(work));
}

/** The `bin` directory beside the workspace, where the check scripts live. */
const binOf = (work: string): string => join(work, "..", "bin");

/** The check: appends one line to the file its argument names and exits 0. */
const COUNTER = `const fs = require("node:fs");
const [file] = process.argv.slice(2);
fs.appendFileSync(file, "counted\\n");
`;

/** One declared command of the verification-commands document, shell-free. */
const declared = (work: string): Record<string, unknown> => ({
  id: "verify-group-one",
  phase: 1,
  executable: "node",
  args: [join(binOf(work), "count-and-pass.cjs"), join(work, "checks.txt")],
  cwd: work,
  timeoutSec: 30,
});

/** The stub `claude` of the loop-speed groups bench. */
const groupsStub = (verdicts: Verdicts): string => `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC");
const role = prompt.includes("Diagnostician") ? "diagnostician" : (critic ? "critic" : "proposer");
const VERDICTS = ${JSON.stringify(Array.isArray(verdicts) ? verdicts : [verdicts])};
const log = path.join(process.env.HOME, "prompts.jsonl");
fs.appendFileSync(log, JSON.stringify({ role, prompt, session }) + "\\n");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (role === "diagnostician") {
  console.log(JSON.stringify({ type: "result", result: "CASE: GROUNDING\\nName the missing test of T001." }));
} else if (critic) {
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  const n = fs.existsSync(log + ".calls") ? Number(fs.readFileSync(log + ".calls", "utf8")) : 0;
  fs.writeFileSync(log + ".calls", String(n + 1));
  const verdict = VERDICTS[Math.min(n, VERDICTS.length - 1)];
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": " + verdict }));
} else {
  const evidence = (/Write your evidence to (\\.specstride\\S+?) \\(/i.exec(prompt) ?? /write (\\.specstride\\S+?):/i.exec(prompt))[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  fs.writeFileSync("made.txt", "work\\n");
  fs.mkdirSync(".specstride/features/001-one/outbox", { recursive: true });
  fs.writeFileSync(
    ".specstride/features/001-one/outbox/u1.checkpoint.json",
    JSON.stringify({ schema: "specstride.checkpoint/1", tasks: ["T001", "T002", "T003"] }),
  );
  const tasks = "specs/001-one/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replaceAll("[ ]", "[x]"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;

function groupsFixture(verdicts: Verdicts): {
  readonly work: string;
  readonly control: string;
  readonly events: () => readonly { type: string; data: Record<string, unknown> }[];
  readonly restore: () => void;
} {
  const f = fixture({ verdicts });
  const work = f.dir;
  writeFileSync(
    join(work, "specs", "001-one", "tasks.md"),
    "# Tasks\n\n## Phase 1: One\n\n- [ ] T001 Do it\n- [ ] T002 Do more\n- [ ] T003 Do the rest\n",
  );
  writeFileSync(join(binOf(work), "claude"), groupsStub(verdicts));
  chmodSync(join(binOf(work), "claude"), 0o755);
  writeFileSync(
    join(work, "package.json"),
    JSON.stringify({ scripts: { test: "node bin/noop.cjs" } }),
  );
  mkdirSync(join(work, "bin"), { recursive: true });
  writeFileSync(join(work, "bin", "noop.cjs"), "process.exit(0);\n");
  // The groups switch on, AND the 154 group-check switch on with it, in the
  // USER file (rows 142 and 149): groups as units, checked as they close.
  const userDir = join(process.env.HOME ?? "", ".config", "specstride");
  mkdirSync(userDir, { recursive: true });
  writeFileSync(
    join(userDir, "config.yaml"),
    "schema: 1\nloop:\n  taskGroups: true\n  parallel:\n    groupCheck: true\n",
  );
  writeFileSync(join(binOf(work), "count-and-pass.cjs"), COUNTER);
  chmodSync(join(binOf(work), "count-and-pass.cjs"), 0o755);
  const control = controlOf(work);
  mkdirSync(join(control, "features", "001-one", "verification"), { recursive: true });
  writeFileSync(
    join(control, "features", "001-one", "verification", "verification-commands.json"),
    JSON.stringify({
      schema_version: "specstride.verification-commands/1",
      discovery: "none",
      commands: [declared(work)],
    }),
  );
  process.env.SPECSTRIDE_LAUNCH_ID = "L1";
  const sliced = sliceThePhase({
    phase: 1,
    tasks: [
      { id: "T001", text: "Do it" },
      { id: "T002", text: "Do more" },
      { id: "T003", text: "Do the rest" },
    ],
    pathsOfTask: () => [],
    declaredCommands: [
      {
        id: "verify-group-one",
        argv: ["node", join(binOf(work), "count-and-pass.cjs"), join(work, "checks.txt")],
        forTaskIds: ["T001", "T002", "T003"],
      },
    ],
  });
  const recordPath = join(control, "launches", "L1", "launch.json");
  mkdirSync(dirname(recordPath), { recursive: true });
  writeFileSync(
    recordPath,
    JSON.stringify({
      schema: "specstride.launch/1",
      configuration: {
        taskGroups: {
          schema: "specstride.task-groups-frozen/1",
          hashes: { phase1: sliced.hash },
          groups: sliced.groups,
        },
      },
    }),
  );
  return {
    work,
    control,
    events: () => {
      const runs = join(controlOf(work), "runs");
      const all: { type: string; data: Record<string, unknown> }[] = [];
      for (const run of existsSync(runs) ? readdirSync(runs).sort() : []) {
        const file = join(runs, run, "events.jsonl");
        if (!existsSync(file)) continue;
        for (const line of readFileSync(file, "utf8").split("\n")) {
          if (line.trim() === "") continue;
          all.push(JSON.parse(line) as { type: string; data: Record<string, unknown> });
        }
      }
      return all;
    },
    restore: () => {
      delete process.env.SPECSTRIDE_LAUNCH_ID;
      f.restore();
    },
  };
}

/** The approval records of the control plane. */
function approvalRecords(control: string): readonly string[] {
  const dir = join(control, "features", "001-one", "approvals");
  return existsSync(dir) ? readdirSync(dir) : [];
}

test("with groups as units, the phase still ends with one approval and one commit", async () => {
  const g = groupsFixture(["APPROVED", "APPROVED"]);
  try {
    const head = () =>
      spawnSync("git", ["-C", g.work, "rev-list", "--count", "HEAD"]).stdout.toString().trim();
    const subjects = () =>
      spawnSync("git", ["-C", g.work, "log", "--format=%s", "--reverse", "HEAD"])
        .stdout.toString()
        .split("\n")
        .filter((line) => line !== "");
    assert.equal(head(), "1", "the fixture starts at exactly the initial commit");
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0);
    const events = g.events();
    // F154-FR-037 — EXACTLY ONE approval record, the gate's, for the PHASE:
    // the group and the group check added none.
    assert.deepEqual(approvalRecords(g.control), ["phase-1.json"]);
    // EXACTLY ONE commit event and one commit in history: the gate's.
    const commitEvents = events.filter((event) => event.type === "commit.made");
    assert.equal(commitEvents.length, 1, "exactly one commit event: the gate's");
    assert.equal(commitEvents[0]?.data.phase, 1);
    assert.equal(head(), "2", "exactly one commit was added after the initial one");
    assert.match(subjects()[1] ?? "", /^specstride: phase 1 approved/);
    // The group checked and passed, and the group check record exists — the
    // 154 switch ran — yet the approval and commit counts stand.
    // With the 154 switch on, the micro layer runs no in-tree group check
    // (the check belongs to the worker tree, F154-FR-034) — so no
    // `group.checked` event stands here either; and no per-group approval or
    // commit event exists in any case.
    assert.ok(
      !events.some((event) => event.type === "group.checked"),
      "no group.checked event: the check belongs to the worker tree",
    );
  } finally {
    g.restore();
  }
});
