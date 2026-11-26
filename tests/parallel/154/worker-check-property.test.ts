/**
 * T085 (feature 154, US3) — THE INDEPENDENT-GROUPS PROPERTY of the worker
 * check (F154-FR-036, F154-SC-003's engine twin):
 *
 * Two INDEPENDENT groups of one phase run CONCURRENTLY, each through its own
 * `runTheGroupOfTheAttempt` (the ledger's one-writer queue is per run, so the
 * two runs never contend). Exactly ONE of the two has an acceptance check
 * that FAILS in its worker tree (`loop.parallel.groupCheck` on). Whatever the
 * ORDER the two groups complete in — varied here by declared sleeps in the
 * checks themselves — ONLY the failing group's delta is withheld: the passing
 * group integrates, its task is ticked, the failing group's tasks return to
 * the main line with the directive `none`, and the workspace ends with
 * EXACTLY THE BYTES the serial run of the passing group alone ends with.
 *
 * Run from the repository root:
 *     node --experimental-strip-types --test tests/parallel/154/worker-check-property.test.ts
 */
import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import type { CheckRunner } from "../../../packages/contracts/src/ep/check-runner.ts";
import type { RegistryAccess, RegistryEntry } from "../../../packages/core/src/pass-supervision/ports.ts";
import { releaseTheWriter } from "../../../packages/core/src/parallel/integrate.ts";
import type { ParallelPlan } from "../../../packages/layer-parallel/src/index.ts";
import { writeWorkerGuardScript } from "../../../packages/cli/src/engine/worker-supervisor.ts";
import { startTimeOf } from "../../../packages/kernel/src/index.ts";
import { runTheGroupOfTheAttempt } from "../../../packages/cli/src/engine/parallel-attempt.ts";
import type { GroupAcceptanceCheck } from "../../../packages/core/src/spec-groups/slicer.ts";

const TASK_LIST = "tasks.md";
const SLUG = "worker-check-property";
const RUN_PASS = "run-property-pass";
const RUN_FAIL = "run-property-fail";

const hash = (text: string): string => createHash("sha256").update(text).digest("hex");

function git(cwd: string, ...argv: readonly string[]): void {
  const done = spawnSync("git", argv, { cwd, encoding: "utf8" });
  assert.equal(done.status, 0, `git ${argv.join(" ")} failed: ${done.stderr}`);
}

type Fixture = {
  readonly root: string;
  readonly workspace: string;
  readonly controlRoot: string;
  readonly home: string;
  readonly guardScriptPath: string;
  cleanup: () => void;
};

function fixtureOf(name: string): Fixture {
  const root = mkdtempSync(join(tmpdir(), `wcp-154-${name}-`));
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
  git(workspace, "commit", "-q", "-m", "the property bench");
  const controlRoot = join(root, "control");
  const home = join(root, "home");
  mkdirSync(home, { recursive: true });
  mkdirSync(join(controlRoot, "runs", RUN_PASS), { recursive: true });
  mkdirSync(join(controlRoot, "runs", RUN_FAIL), { recursive: true });
  const guardScriptPath = join(root, "worker-guard.mjs");
  writeWorkerGuardScript(guardScriptPath);
  return {
    root,
    workspace,
    controlRoot,
    home,
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

/** The plan of the phase: TWO groups of one task each, disjoint paths. */
function planOfTwoGroups(fixture: Fixture): ParallelPlan {
  const scopeOf = (taskId: string) => ({
    prefixes: ["src"],
    source: "task-text" as const,
  });
  return {
    schema: "specstride.parallel-plan/1",
    runId: "the-property-run",
    hash: "plan-hash-property",
    workers: 2,
    fallback: undefined,
    phases: [
      {
        phase: 2,
        groups: [
          { ordinal: 1, phase: 2, tasks: ["2-a"] },
          { ordinal: 2, phase: 2, tasks: ["2-b"] },
        ],
        tasks: [
          { id: "2-a", scope: scopeOf("2-a"), checks: [] },
          { id: "2-b", scope: scopeOf("2-b"), checks: [] },
        ],
        serial: [],
        ceiling: 2,
      },
    ],
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

const STUB_SCRIPT = `
const fs = require("node:fs");
const path = require("node:path");
const [outbox, taskId, treePath, target, addition] = process.argv.slice(1);
fs.mkdirSync(outbox, { recursive: true });
fs.writeFileSync(path.join(outbox, taskId + ".checkpoint.json"), JSON.stringify({ task: taskId }));
const at = path.join(treePath, target);
fs.writeFileSync(at, fs.readFileSync(at, "utf8") + addition);
`;

function stubStartDoor(fixture: Fixture): {
  readonly start: (worker: { outboxPath: string; taskId: string; tree: string }) => Promise<{
    workerId: string;
    pid: number;
    startTime: string;
    processGroup: number;
    runTokenHash: string;
    ended: Promise<"ended" | "killed">;
  }>;
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
        runTokenHash: hash("run-token-property"),
        ended,
      };
    },
  };
}

type AttemptInput = Parameters<typeof runTheGroupOfTheAttempt>[0];

/** The input of ONE group's attempt over the fixture, runId and ordinal given. */
function inputOf(
  fixture: Fixture,
  runId: string,
  groupOrdinal: number,
  acceptanceCheck: GroupAcceptanceCheck | undefined,
): AttemptInput {
  const registryPath = join(fixture.root, `procs-${runId}.json`);
  return {
    controlRoot: fixture.controlRoot,
    runId,
    home: fixture.home,
    plan: planOfTwoGroups(fixture),
    phase: 2,
    groupOrdinal,
    workspace: fixture.workspace,
    slug: SLUG,
    taskListPath: TASK_LIST,
    model: "stub",
    modelTierOrEffort: "stub",
    containment: "C2",
    runToken: "run-token-property",
    timeLimitSec: 120,
    promptOf: (worker) => `the prompt of ${worker.taskId}`,
    outputRootOf: (worker) => join(fixture.root, "outputs", runId, worker.workerId),
    startDoor: stubStartDoor(fixture).start,
    enginePid: process.pid,
    engineStartedAtMs: startTimeOf(process.pid) ?? 0,
    workersAtATime: 1,
    guardScriptPath: fixture.guardScriptPath,
    registry: registryAccessOf(registryPath),
    taskTextAtLaunch: "- [ ] 2-a the first task\n- [ ] 2-b the second task\n",
    secretsOf: (workerId, workerToken) => ({
      workerRoot: join(fixture.home, ".specstride", "worker-roots", runId),
      treeStore: join(fixture.controlRoot, "tree-store"),
      controlPlane: fixture.controlRoot,
      workerToken,
    }),
    singleWriter: {
      taskList: join(fixture.workspace, TASK_LIST),
      phaseEvidence: [],
      notebook: join(fixture.controlRoot, "notebook.md"),
      handoff: join(fixture.home, ".specstride", "worker-roots", runId, "handoff.json"),
      workspacePart: join(fixture.workspace, ".specstride"),
    },
    tick: (taskIds) => tickOfTheTaskList(fixture.workspace, taskIds),
    runner: spawnRunner(),
    // The merge probe of the passing group: after its apply, the workspace
    // holds its mark. The failing group never reaches a merge check.
    innerCheckSet: [
      {
        id: "the-property-probe",
        kind: "command",
        argv: [
          process.execPath,
          "-e",
          'const fs=require("node:fs");' +
            'const one=(p,m)=>{try{return fs.readFileSync(p,"utf8").includes(m)}catch{return false}};' +
            'process.exit(one("src/a.ts","2-a was here")?0:1)',
          join(fixture.workspace, "src", "a.ts"),
          "2-a was here",
        ],
        phase: 2,
        timeLimitMs: 30_000,
      },
    ],
    hash,
    emit: () => {},
    say: () => {},
    ...(acceptanceCheck === undefined ? {} : { workerCheck: { on: true, acceptanceCheck } }),
  };
}

/** The check that sleeps `ms` then exits `code`, per worker tree. */
const checkOf = (ms: number, code: number): GroupAcceptanceCheck => ({
  kind: "declared",
  id: `verify-property-${String(code)}`,
  argv: [
    process.execPath,
    "-e",
    `setTimeout(()=>{},${String(ms)});process.exit(${String(code)})`,
  ],
  timeLimitMs: 20_000,
});

/** One hash over EVERY byte of the workspace the engine may change. */
function fingerprintOf(workspace: string): string {
  const out: string[] = [];
  const walk = (dir: string, prefix: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === ".specstride") continue;
      const path = join(dir, entry.name);
      const rel = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) walk(path, rel);
      else out.push(`${rel}:${createHash("sha256").update(readFileSync(path)).digest("hex")}`);
    }
  };
  walk(workspace, "");
  return createHash("sha256").update(out.sort().join("\n")).digest("hex");
}

async function runOne(fixture: Fixture, runId: string, groupOrdinal: 1 | 2, delayMs: number, exitCode: number) {
  const attempt = await runTheGroupOfTheAttempt(
    inputOf(fixture, runId, groupOrdinal, checkOf(delayMs, exitCode)),
  );
  return attempt;
}

for (const scenario of [
  { name: "the failing group finishes FIRST", failDelay: 0, passDelay: 700 },
  { name: "the failing group finishes LAST", failDelay: 700, passDelay: 0 },
] as const) {
  test(`two independent groups, ${scenario.name}: only the failing delta is withheld`, async () => {
    const fixture = fixtureOf(scenario.failDelay === 0 ? "concurrent-first" : "concurrent-last");
    try {
      const [passing, failing] = await Promise.all([
        runOne(fixture, RUN_PASS, 1, scenario.passDelay, 0),
        runOne(fixture, RUN_FAIL, 2, scenario.failDelay, 1),
      ]);
      // The passing group is kept; the failing one returns its task.
      assert.equal(passing.ok, true, passing.ok ? "" : passing.message);
      if (!passing.ok) return;
      assert.equal(failing.ok, true, failing.ok ? "" : failing.message);
      if (!failing.ok) return;
      console.error("DBG-PASS", passing.outcome, JSON.stringify(passing.audit.refused), JSON.stringify(passing.barrier.perWorker), JSON.stringify(passing.integration?.integrated), JSON.stringify(passing.integration));
      try { console.error("DBG-REC", readFileSync(join(fixture.controlRoot, "features", SLUG, "runs", RUN_PASS, "parallel", "phase2", "groups", "g-2-1", "worker-check.json"), "utf8")); } catch {}
      assert.equal(passing.outcome, "kept");
      assert.equal(passing.groupId, "g-2-1");
      assert.equal(failing.outcome, "failed");
      assert.equal(failing.groupId, "g-2-2");
      assert.equal(failing.directive, "none");
      assert.deepEqual(failing.tasksOnTheMainLine, ["2-b"]);
      // The order of completion had no effect on which delta was withheld:
      // only the failing group's work is missing from the workspace.
      const a = readFileSync(join(fixture.workspace, "src", "a.ts"), "utf8");
      const b = readFileSync(join(fixture.workspace, "src", "b.ts"), "utf8");
      assert.ok(a.includes("2-a was here"), "the passing group's work must integrate");
      assert.ok(!b.includes("2-b was here"), "the failing group's work must be withheld");
      const list = readFileSync(join(fixture.workspace, TASK_LIST), "utf8");
      assert.ok(list.includes("- [x] 2-a "), "the passing task is ticked");
      assert.ok(!list.includes("- [x] 2-b "), "the failing task is not ticked");
      // THE SERIAL EQUALITY: run the passing group alone over a fresh bench
      // and compare every byte the engine may change.
      const serial = fixtureOf(`${fixture.root.slice(-6)}-serial`);
      try {
        const serialAttempt = await runTheGroupOfTheAttempt(
          inputOf(serial, `${RUN_PASS}-serial`, 1, checkOf(scenario.passDelay, 0)),
        );
        assert.equal(serialAttempt.ok, true, serialAttempt.ok ? "" : serialAttempt.message);
        if (!serialAttempt.ok) return;
        assert.equal(serialAttempt.outcome, "kept");
        assert.equal(
          fingerprintOf(fixture.workspace),
          fingerprintOf(serial.workspace),
          "the concurrent end state differs from the serial run's",
        );
      } finally {
        releaseTheWriter(`${RUN_PASS}-serial:ledger`);
        serial.cleanup();
      }
    } finally {
      releaseTheWriter(`${RUN_PASS}:ledger`);
      releaseTheWriter(`${RUN_FAIL}:ledger`);
      fixture.cleanup();
    }
  });
}

