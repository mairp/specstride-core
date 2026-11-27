/**
 * T160 (feature 154, phase 17, G8) — THE HARNESS ERROR OF A WORKER SWITCHES
 * THE LAYER OFF (V-18; F154-FR-078 under F142-FR-023).
 *
 * A HARNESS ERROR in any worker of any group — including the worker that runs
 * a group's frozen acceptance check — is one of the causes that switch the
 * parallel micro-loop layer OFF for the rest of the phase attempt:
 *
 *  - THE PURE SEAM (`decide.ts`): the decision the layer table makes when a
 *    worker pass ends with a harness error — a worker of an ordinary group
 *    and, identically, the worker of a GROUP CHECK (whose group carries
 *    `mergeCheckPassed: null`, because nothing was integrated) — carries the
 *    rule id `harness-error`, reaches only the phase attempt
 *    (`layerOffForAttempt`), closes the group at the barrier, sends the
 *    worker's task to the main line, does NOT stop the run, and is carried by
 *    the event vocabulary (`parallel.group.ended`) with
 *    `{reason: "harness-error", scope: "attempt", outcome: "failed"}`.
 *    Precedence is pinned too: a failed group before the harness error
 *    decides first (row 185 order), and no harness error means no layer-off
 *    decision at all.
 *  - THE ENGINE RUN: a hermetic parallel run over `tests/fixtures/154/groups`
 *    (private HOME, stub proposer on PATH, every parallel switch on: phases
 *    parallel, group units and group check) where the stub `dsh` returns an
 *    INVALID (non-JSON) body and exit 7 for exactly the worker passes of
 *    T001 and T002. The run shows the harness errors as they happen
 *    (`parallel.worker.ended` with outcome `refused`, reason
 *    `the harness failed`), closes the group, sends the broken tasks back to
 *    the main line — and still reaches its NORMAL end: exit 0 and
 *    `phase.ended` approved. The graceful revert is the observable half of
 *    the rule in the engine; the layer-off record with its rule id is pinned
 *    at the pure seam above, where the decision is a table.
 *
 * Run from the repository root:
 *     node --experimental-strip-types --test tests/parallel/154/harness-error-154.test.ts
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import test from "node:test";

import {
  FAILED_GROUPS_THAT_SWITCH_THE_LAYER_OFF,
  EVENT_OF_A_LAYER_OFF_REASON,
  layerOffDecision,
  layerOffFor,
  onAHarnessError,
} from "../../../packages/layer-parallel/src/decide.ts";

import { workspaceIdOfWorkspace } from "../../../packages/cli/src/engine/workspace-control-root.ts";
import { runFeature } from "../../../packages/cli/src/engine/run-feature.ts";
import { pinEngineEnv } from "../../../packages/cli/test/engine/helpers/fixture.ts";
import { sliceThePhase } from "../../../packages/core/src/spec-groups/slicer.ts";

/** The task list of `tests/fixtures/154/groups/` (three tasks, one phase). */
const TASKS_MD = readFileSync(
  join(import.meta.dirname, "../../fixtures/154/groups/tasks.md"),
  "utf8",
);

/* ------------------------------------------------------------------ *
 * Part A — the pure seam of the harness error (V-18, F154-FR-078).
 * ------------------------------------------------------------------ */

/** A group closed at the barrier: no refusal, no kill. `mergeCheckPassed`
 * is `null` where nothing was integrated — the shape of a group whose only
 * worker, the GROUP-CHECK worker, broke. */
function cleanClosedGroup(groupId: string): {
  readonly groupId: string;
  readonly refused: readonly string[];
  readonly killed: readonly string[];
  readonly mergeCheckPassed: null;
} {
  return { groupId, refused: Object.freeze([]), killed: Object.freeze([]), mergeCheckPassed: null };
}

test("G8 T160: a worker's harness error switches the layer off for the phase attempt with its rule id (V-18, F154-FR-078)", () => {
  // THE OBSERVED FACT: the pass of worker w-2 (task T002) ended with a
  // harness error; its group g-1-1 closed at the barrier with nothing
  // refused and nothing killed.
  const decision = layerOffDecision({
    closedGroups: [cleanClosedGroup("g-1-1")],
    failedGroupsBefore: 0,
    report: { harnessError: [{ workerId: "w-2", taskId: "T002" }] },
  });

  assert.notEqual(decision, null, "no layer-off decision for a harness error");
  // THE RULE ID (PU-89) and how far the switch reaches (F142-FR-023).
  assert.equal(decision?.reason, "harness-error");
  assert.equal(decision?.scope, "attempt");
  assert.deepEqual(decision?.directive, { directive: "layerOffForAttempt" });
  assert.equal(decision?.stopsTheRun, false, "a harness error stops the run");
  // THE DETAIL names the worker and carries the rule id.
  assert.ok(decision?.detail.includes("w-2"), `the detail lacks the worker: ${decision?.detail}`);
  assert.ok(
    decision?.detail.includes("(harness-error)"),
    `the detail lacks the rule id: ${decision?.detail}`,
  );
  // WHAT CARRIES ON: the layer does not; the work goes on serially.
  assert.ok(decision?.carriesOn.includes("serially"), `carriesOn: ${decision?.carriesOn}`);

  // THE EVENT of the decision: the vocabulary of row 74 carries the reason
  // of row 185 — `parallel.group.ended`, named by the group, scoped to the
  // attempt, outcome failed.
  assert.equal(EVENT_OF_A_LAYER_OFF_REASON["harness-error"], "parallel.group.ended");
  assert.deepEqual(decision?.event, {
    type: "parallel.group.ended",
    data: { groupId: "g-1-1", reason: "harness-error", scope: "attempt", outcome: "failed" },
  });
});

test("G8 T160: the same rule for the GROUP-CHECK worker's harness error, and what the error does to the group (V-18, F154-FR-078, PU-89)", () => {
  // The group's frozen acceptance check runs in its own worker; its pass
  // ends with a harness error. The decision is the SAME rule for the same
  // end — the check worker is a worker like any other (F154-FR-078).
  const checkWorker = { workerId: "w-check-1", taskId: "T001" };
  const decision = layerOffDecision({
    closedGroups: [cleanClosedGroup("g-1-1")],
    failedGroupsBefore: 0,
    report: { harnessError: [checkWorker] },
  });
  assert.notEqual(decision, null, "no layer-off decision for a group-check harness error");
  assert.equal(decision?.reason, "harness-error");
  assert.equal(decision?.scope, "attempt");
  assert.equal(decision?.stopsTheRun, false);
  assert.ok(decision?.detail.includes("w-check-1"), `detail: ${decision?.detail}`);

  // The same decision, driven through `layerOffFor` directly.
  const direct = layerOffFor("harness-error", { groupId: "g-1-1" });
  assert.equal(direct.reason, "harness-error");
  assert.deepEqual(direct.directive, { directive: "layerOffForAttempt" });
  assert.deepEqual(direct.event.data, {
    groupId: "g-1-1",
    reason: "harness-error",
    scope: "attempt",
    outcome: "failed",
  });

  // WHAT THE ERROR DOES TO THE GROUP (PU-89): the group closes at the
  // barrier, the task goes to the main line, the breakers count there as
  // they always do, and the end is none of checkpoint, kill, quota signal.
  const harness = onAHarnessError({ groupId: "g-1-1", workers: [checkWorker] });
  assert.equal(harness.closesTheGroupAtTheBarrier, true);
  assert.deepEqual(harness.tasksToTheMainLine, ["T001"]);
  assert.equal(harness.breakersCountOnTheMainLine, true);
  assert.equal(harness.notACheckpointNotAKillNotAQuotaSignal, true);
  assert.equal(harness.layerOff.reason, "harness-error");
  assert.equal(harness.layerOff.scope, "attempt");
  assert.ok(harness.detail.includes("g-1-1"), `detail: ${harness.detail}`);
  assert.ok(harness.detail.includes("T001"), `detail: ${harness.detail}`);
});

test("G8 T160: the order of the reasons — a failed group before the harness error decides first, and no harness error decides nothing (F142-FR-023)", () => {
  // The threshold of failed groups after which the layer is off.
  assert.ok(FAILED_GROUPS_THAT_SWITCH_THE_LAYER_OFF >= 2);
  // One failed group BEFORE the attempt (row 185 order: group-failures is
  // read before harness-error) — its reason wins and names the group.
  const withFailedBefore = layerOffDecision({
    closedGroups: [cleanClosedGroup("g-1-2")],
    failedGroupsBefore: 1,
    report: { harnessError: [{ workerId: "w-2", taskId: "T002" }] },
  });
  assert.equal(withFailedBefore?.reason, "group-failures");
  assert.equal(withFailedBefore?.scope, "attempt");
  // AND the harness error is still reported in the same decision's reach —
  // the layer is off either way, scoped to the attempt, not stopping.
  assert.equal(withFailedBefore?.stopsTheRun, false);

  // THE CONTROL: a clean group and a clean report — the layer carries on.
  assert.equal(
    layerOffDecision({
      closedGroups: [cleanClosedGroup("g-1-1")],
      failedGroupsBefore: 0,
      report: {},
    }),
    null,
    "the layer went off without a cause",
  );
  // A harness error OUTWEIGHS a clean group even where the group passed its
  // merge check: the error is read on its own (F154-FR-078).
  const withIntegrated = layerOffDecision({
    closedGroups: [{ groupId: "g-1-1", refused: [], killed: [], mergeCheckPassed: true }],
    failedGroupsBefore: 0,
    report: { harnessError: [{ workerId: "w-1", taskId: "T001" }] },
  });
  assert.equal(withIntegrated?.reason, "harness-error");
});

/* ------------------------------------------------------------------ *
 * Part B — the engine run: the harness errors happen, the run still
 * reaches its normal end (V-18, graceful revert, F142-FR-023).
 * ------------------------------------------------------------------ */

/** The stub `dsh`: the door of the parallel layer's workers AND the run's
 * proposer. For a WORKER pass of T001 or T002 it writes its own checkpoint
 * and then ends with a HARNESS ERROR — an invalid (non-JSON) body and exit
 * 7. Every other call (the `--version` probe, the main line, the worker of
 * T003) does the pass's ordinary work and exits 0. */
function stubDsh(): string {
  return `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = argv.filter((a) => !a.startsWith("--") && a !== "headless").join(" ");
if (prompt === "" || prompt.startsWith("--")) {
  console.log("dsh 1.0.0 (stub)");
  process.exit(0);
}
const worker = process.env.SPECSTRIDE_WORKER_TOKEN !== undefined;
const checkpoint = /writing the file (\\S+?\\.checkpoint\\.json) with the exact content \\{"task\\":\\"(T\\d+)\\"\\}/.exec(prompt);
const writeCheckpoint = () => {
  if (checkpoint === null) return;
  fs.mkdirSync(path.dirname(checkpoint[1]), { recursive: true });
  fs.writeFileSync(checkpoint[1], JSON.stringify({ task: checkpoint[2] }));
};
const evidence = (/Write your evidence to (\\.specstride\\S+?) \\(/i.exec(prompt) ?? /write (\\.specstride\\S+?):/i.exec(prompt));
if (worker && /T00[12]/.test(prompt)) {
  writeCheckpoint();
  console.log("this is not json at all <<<invalid>>>");
  process.exit(7);
}
if (evidence !== null) {
  fs.mkdirSync(path.dirname(evidence[1]), { recursive: true });
  fs.writeFileSync(evidence[1], "T001 done\\n");
  const tasks = "specs/001-one/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replaceAll("[ ]", "[x]"));
}
writeCheckpoint();
process.exit(0);
`;
}

/** The stub `claude`: proposer ticks and critic approvals over the JSON
 * protocol (`tests/inertness/154/helpers.ts`), for the main line's gate. */
function stubClaude(): string {
  return `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC");
const role = prompt.includes("Diagnostician") ? "diagnostician" : (critic ? "critic" : "proposer");
if (role === "diagnostician") {
  console.log(JSON.stringify({ type: "system", subtype: "init", tools: [], session_id: session }));
  console.log(JSON.stringify({ type: "result", result: "CASE: GROUNDING\\nName the missing test of T001." }));
  process.exit(0);
}
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (critic) {
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;
}

type RunEvent = { readonly type: string; readonly data: Record<string, unknown> };

type Fixture = {
  readonly run: () => Promise<number>;
  /** Every event of the run's control plane, in file order. */
  readonly events: () => readonly RunEvent[];
  readonly restore: () => void;
};

/** The hermetic fixture: a workspace over FX-154-GROUPS, a private HOME,
 * the stubs on PATH, every parallel switch of spec 154 ON — and the frozen
 * groups of the launch record, one worker per task of the one group. */
function fixture154HarnessError(): Fixture {
  const root = mkdtempSync(join(tmpdir(), "specstride-t160-154-"));
  const bin = join(root, "bin");
  const home = join(root, "home");
  const work = join(root, "work");
  mkdirSync(bin);
  mkdirSync(home);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  writeFileSync(join(bin, "claude"), stubClaude());
  chmodSync(join(bin, "claude"), 0o755);
  writeFileSync(join(bin, "dsh"), stubDsh());
  chmodSync(join(bin, "dsh"), 0o755);
  writeFileSync(join(work, "specs", "001-one", "tasks.md"), TASKS_MD);
  writeFileSync(
    join(work, "package.json"),
    JSON.stringify({ scripts: { test: "node bin/noop.cjs" } }),
  );
  mkdirSync(join(work, "bin"), { recursive: true });
  writeFileSync(join(work, "bin", "noop.cjs"), "process.exit(0);\n");
  for (const argv of [
    ["init", "-q"],
    ["config", "user.email", "t@t"],
    ["config", "user.name", "t"],
    ["add", "-A"],
    ["commit", "-qm", "init"],
  ]) {
    spawnSync("git", ["-C", work, ...argv]);
  }
  const before = {
    HOME: process.env.HOME,
    PATH: process.env.PATH,
    PHASES: process.env.SPECSTRIDE_LOOP_PHASES_PARALLEL,
    UNITS: process.env.SPECSTRIDE_LOOP_PARALLEL_UNITS,
    GUNITS: process.env.SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS,
    CHECK: process.env.SPECSTRIDE_LOOP_PARALLEL_GROUP_CHECK,
    LIMITS: process.env.SPECSTRIDE_HOST_LIMITS,
    LAUNCH: process.env.SPECSTRIDE_LAUNCH_ID,
  };
  process.env.HOME = home;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  // THE PARALLEL SWITCHES (the rank-4 environment aliases of
  // `loop.phases.parallel`, `loop.parallel.groupUnits` and
  // `loop.parallel.groupCheck`).
  process.env.SPECSTRIDE_LOOP_PHASES_PARALLEL = "on";
  process.env.SPECSTRIDE_LOOP_PARALLEL_UNITS = "on";
  process.env.SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS = "on";
  process.env.SPECSTRIDE_LOOP_PARALLEL_GROUP_CHECK = "on";
  const restoreEngineEnv = pinEngineEnv({ feature: "001-one" });
  // AFTER the pin: the implementer of the passes is the dsh harness (the
  // only adapter the harness registry holds as `tested` for concurrent
  // sessions); the critic stays the stub `claude`.
  process.env.SPECSTRIDE_PROPOSER = "dsh:zai/glm-5.3-flash";
  process.env.SPECSTRIDE_HOST_LIMITS = "on";
  process.env.SPECSTRIDE_LAUNCH_ID = "L1";

  const userDir = join(home, ".config", "specstride");
  mkdirSync(userDir, { recursive: true });
  writeFileSync(
    join(userDir, "config.yaml"),
    "schema: 1\nloop:\n  taskGroups: true\n  parallel:\n    allow_detect: true\n",
  );
  const control = join(home, ".specstride", "workspaces", workspaceIdOfWorkspace(work));
  mkdirSync(join(control, "features", "001-one", "verification"), { recursive: true });
  writeFileSync(
    join(control, "features", "001-one", "verification", "verification-commands.json"),
    JSON.stringify({
      schema_version: "specstride.verification-commands/1",
      discovery: "none",
      commands: [
        {
          id: "verify-group-one",
          phase: 1,
          executable: "node",
          args: [join(work, "bin", "noop.cjs"), join(work, "checks.txt")],
          cwd: work,
          timeoutSec: 30,
        },
      ],
    }),
  );
  // THE FROZEN GROUPS of the launch record: the pure table slices the one
  // phase; the record freezes what the engine reads under `groupUnits`.
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
        argv: ["node", join(work, "bin", "noop.cjs"), join(work, "checks.txt")],
        forTaskIds: ["T001", "T002", "T003"],
      },
    ],
  });
  const recordPath = join(control, "launches", "L1", "launch.json");
  mkdirSync(join(recordPath, ".."), { recursive: true });
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

  const readEvents = (): readonly RunEvent[] => {
    const base = join(home, ".specstride", "workspaces", workspaceIdOfWorkspace(work));
    const all: RunEvent[] = [];
    for (const root of [
      base,
      join(home, ".local", "state", "specstride", "workspaces", "001-one"),
    ]) {
      for (const runs of [join(root, "runs"), join(root, "features", "001-one", "runs")]) {
        for (const run of existsSync(runs) ? readdirSync(runs).sort() : []) {
          const file = join(runs, run, "events.jsonl");
          if (!existsSync(file)) continue;
          for (const line of readFileSync(file, "utf8").split("\n")) {
            if (line.trim() === "") continue;
            const parsed = JSON.parse(line) as { type: string; data?: Record<string, unknown> };
            all.push({ type: parsed.type, data: parsed.data ?? {} });
          }
        }
      }
    }
    return all;
  };

  return {
    run: () => runFeature({ argv: [], workdir: work }),
    events: readEvents,
    restore: () => {
      restoreEngineEnv();
      process.env.HOME = before.HOME;
      process.env.PATH = before.PATH;
      const put = (name: string, was: string | undefined): void => {
        if (was === undefined) delete process.env[name];
        else process.env[name] = was;
      };
      put("SPECSTRIDE_LOOP_PHASES_PARALLEL", before.PHASES);
      put("SPECSTRIDE_LOOP_PARALLEL_UNITS", before.UNITS);
      put("SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS", before.GUNITS);
      put("SPECSTRIDE_LOOP_PARALLEL_GROUP_CHECK", before.CHECK);
      put("SPECSTRIDE_HOST_LIMITS", before.LIMITS);
      put("SPECSTRIDE_LAUNCH_ID", before.LAUNCH);
      rmSync(root, { recursive: true, force: true });
    },
  };
}

test("G8 T160: a run whose worker passes end with harness errors closes the group and still reaches its normal end, on the main line (V-18, F142-FR-023)", async () => {
  const fixture = fixture154HarnessError();
  try {
    const exit = await fixture.run();
    const events = fixture.events();
    const of = (type: string): readonly RunEvent[] => events.filter((one) => one.type === type);

    // THE RUN REACHED ITS NORMAL END — a harness error stops no run
    // (F142-FR-023: no reason of row 185 stops a run).
    assert.equal(exit, 0, `the run ended ${String(exit)}`);

    // THE GROUP REALLY RAN PARALLEL: the layer planned and admitted it.
    assert.ok(of("parallel.plan").length > 0, "no parallel.plan — the layer never ran");
    assert.ok(of("parallel.group.started").length > 0, "no parallel.group.started");
    assert.ok(
      of("parallel.worker.started").length >= 2,
      "no parallel.worker.started — no worker pass ran",
    );

    // THE HARNESS ERRORS, AS THEY HAPPENED: the worker passes of T001 and
    // T002 ended and were refused because their pass ended with a harness
    // error (the invalid body and exit 7 the stub returned).
    const ended = of("parallel.worker.ended");
    const harnessFailed = ended.filter((one) => one.data["reason"] === "the harness failed");
    assert.ok(
      harnessFailed.length >= 2,
      `the harness errors are missing: ${JSON.stringify(ended.map((one) => one.data))}`,
    );
    for (const one of harnessFailed) {
      assert.equal(one.data["outcome"], "refused");
      assert.equal(typeof one.data["workerId"], "string");
    }

    // THE GROUP CLOSED — the harness error closes the group at the barrier.
    const groupEnded = of("parallel.group.ended");
    assert.ok(groupEnded.length > 0, "no parallel.group.ended — the group never closed");

    // THE GRACEFUL REVERT: the phase attempt carried on to its normal end —
    // approved — after the harness errors (the main line finished what the
    // group left).
    const phaseEnded = of("phase.ended");
    assert.ok(phaseEnded.length > 0, "no phase.ended — the run never finished the phase");
    assert.equal(phaseEnded[0]?.data["outcome"], "approved");
    assert.equal(phaseEnded[0]?.data["phase"], 1);
    assert.ok(phaseEnded[0]?.data["attempt"] !== undefined, "no attempt on phase.ended");

    // AND the run left no phase hanging: the phase began exactly once.
    assert.equal(of("phase.started").length, 1);
  } finally {
    fixture.restore();
  }
});
