/**
 * THE LEAK GUARD OF THE WORKER CHECK (feature 154, T084; F154-FR-015,
 * F142-FR-066, F142-FR-057): with the group's acceptance check FAILED in its
 * worker tree — the strongest case, a refusal the run knows about —
 *
 *  - NO EVENT carries the refusal (`group-check` appears in no event the
 *    attempt emitted): the record `specstride.worker-check/1` is the only
 *    surface, and the event vocabulary of F142-FR-066 is unchanged;
 *  - NO CRITIC-CLASS TEXT carries it: the before-critic input (the handoff)
 *    of the group names no refusal reason and no worker tree;
 *  - NO WORKER TREE appears anywhere: neither the worker root (F143-SC-001)
 *    nor any materialized tree path of a worker reaches an event or the
 *    handoff (the path-leak threat of F142-FR-057, now also for the check);
 *  - THE GATE'S MANIFEST stays the caller's: the inner check set the caller
 *    handed in is what the merge check sees, and the worker check adds no
 *    entry to it;
 *  - IN THE CONTROL PLANE, the only file that holds the record schema
 *    `specstride.worker-check/1` is the worker-check record itself: no gate
 *    manifest, no ledger record, no pins or approval file repeats it.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
  lstatSync,
} from "node:fs";
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
import type { GroupAcceptanceCheck } from "../../../core/src/spec-groups/slicer.ts";

const TASK_LIST = "tasks.md";
const SLUG = "worker-check-leak-154";
const RUN_ID = "run-leak-154";

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
  cleanup: () => void;
};

function fixtureOf(): Fixture {
  const root = mkdtempSync(join(tmpdir(), "worker-check-leak-154-"));
  const workspace = join(root, "workspace");
  mkdirSync(join(workspace, "src"), { recursive: true });
  git(workspace, "init", "--quiet", ".");
  git(workspace, "config", "user.email", "t@t");
  git(workspace, "config", "user.name", "t");
  writeFileSync(join(workspace, ".gitignore"), ".specstride/\n");
  writeFileSync(join(workspace, "src", "a.ts"), "export const a = 1;\n");
  writeFileSync(
    join(workspace, TASK_LIST),
    "- [ ] 2-a the first task\n- [ ] 2-b the second task\n",
  );
  git(workspace, "add", "--", ".");
  git(workspace, "commit", "-q", "-m", "the leak bench");
  const controlRoot = join(root, "control");
  const home = join(root, "home");
  mkdirSync(home, { recursive: true });
  mkdirSync(join(controlRoot, "runs", RUN_ID), { recursive: true });
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

function planOfGroup(): ParallelPlan {
  const scope = { prefixes: ["src"], source: "task-text" as const };
  return {
    schema: "specstride.parallel-plan/1",
    runId: RUN_ID,
    hash: "plan-hash-leak",
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

const guardScriptOf = (root: string): string => {
  const path = join(root, "worker-guard.mjs");
  writeWorkerGuardScript(path);
  return path;
};

test("a refused group check leaks no refusal string, no worker tree, no manifest entry", async () => {
  const fixture = fixtureOf();
  try {
    const events: { type: string; data: unknown }[] = [];
    const acceptanceCheck: GroupAcceptanceCheck = {
      kind: "declared",
      id: "verify-leak",
      argv: [process.execPath, "-e", "process.exit(1)"],
      timeLimitMs: 30_000,
    };
    const gateManifest: ManifestEntry[] = [
      {
        id: "the-gate-probe",
        kind: "command",
        argv: [process.execPath, "-e", "process.exit(0)"],
        phase: 2,
        timeLimitMs: 30_000,
      },
    ];
    const attempt = await runTheGroupOfTheAttempt({
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
      runToken: "run-token-leak",
      timeLimitSec: 120,
      promptOf: (worker) => `the prompt of ${worker.taskId}`,
      outputRootOf: (worker) => join(fixture.root, "outputs", worker.workerId),
      startDoor: async (worker) => {
        const child = spawn(
          process.execPath,
          [
            "-e",
            STUB_SCRIPT,
            worker.outboxPath,
            worker.taskId,
            worker.tree,
            `src/a.ts`,
            "\n// x\n",
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
          runTokenHash: hash("run-token-leak"),
          ended,
        };
      },
      enginePid: process.pid,
      engineStartedAtMs: startTimeOf(process.pid) ?? 0,
      workersAtATime: 2,
      guardScriptPath: guardScriptOf(fixture.root),
      registry: registryAccessOf(join(fixture.root, "procs.json")),
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
      innerCheckSet: gateManifest,
      hash,
      emit: (event) => {
        events.push({ type: event.type, data: event.data });
      },
      say: () => {},
      workerCheck: { on: true, acceptanceCheck },
    });
    // The refusal happened: the group failed on the group-check refusal.
    assert.equal(attempt.ok, true, attempt.ok ? "" : attempt.message);
    if (!attempt.ok) return;
    assert.equal(attempt.outcome, "failed");
    assert.equal(attempt.directive, "none");
    assert.equal(attempt.audit.refused.length, 2);

    // 1. NO EVENT carries the refusal: not the type, not the data.
    const eventText = JSON.stringify(events);
    assert.ok(!eventText.includes("group-check"), "no event names the group-check refusal");
    assert.ok(
      !events.some((event) => String(event.type).includes("worker-check")),
      "no event kind of the worker check exists (F142-FR-066's vocabulary is unchanged)",
    );

    // 2. The before-critic input carries neither the refusal nor any tree.
    assert.equal(attempt.handoff, "", "a failed group has no before-critic input");

    // 3. NO WORKER TREE PATH anywhere: neither the worker root nor any
    //    materialized tree of a worker reaches an event or the handoff.
    const workerRoot = join(fixture.home, ".specstride", "worker-roots", RUN_ID);
    assert.ok(!eventText.includes(workerRoot), "the worker root must not reach the events");
    const workersDir = join(fixture.controlRoot, "runs", RUN_ID, "workers");
    const handoffText = attempt.handoff;
    for (const name of exists(workersDir) ? readdirSync(workersDir) : []) {
      assert.ok(!eventText.includes(name), `the worker tree ${name} must not reach the events`);
      assert.ok(!handoffText.includes(name), `the worker tree ${name} must not reach the handoff`);
    }

    // 4. The gate's manifest is the caller's: what the merge check saw is
    //    exactly what was handed in, no worker-check entry added.
    const mergeCommands = attempt.merge?.run.commands ?? [];
    for (const command of mergeCommands) {
      assert.ok(
        !String(command.id).includes("worker-check"),
        "the merge check saw no entry of the worker check",
      );
    }
    assert.deepEqual(
      gateManifest.map((entry) => entry.id),
      ["the-gate-probe"],
      "the caller's manifest is unchanged",
    );

    // 5. In the control plane, the ONLY file holding the record schema is the
    //    worker-check record itself.
    const holders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(path);
          continue;
        }
        if (!lstatSync(path).isFile()) continue;
        try {
          if (readFileSync(path, "utf8").includes("specstride.worker-check/1")) holders.push(path);
        } catch {
          // A binary file holds no schema string.
        }
      }
    };
    walk(fixture.controlRoot);
    assert.deepEqual(
      holders.map((path) => path.slice(fixture.controlRoot.length)),
      [
        "/" +
          join(
            "features",
            SLUG,
            "runs",
            RUN_ID,
            "parallel",
            "phase2",
            "groups",
            "g-2-1",
            "worker-check.json",
          ),
      ],
      "only the worker-check record holds the schema, in the control plane",
    );
    // And the record stays OUT of the ledger file entirely.
    const ledger = readFileSync(
      join(fixture.controlRoot, "runs", RUN_ID, "parallel-ledger.jsonl"),
      "utf8",
    );
    assert.ok(!ledger.includes("specstride.worker-check"), "the ledger holds no worker check");
  } finally {
    releaseTheWriter(`${RUN_ID}:ledger`);
    fixture.cleanup();
  }
});

function exists(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}
