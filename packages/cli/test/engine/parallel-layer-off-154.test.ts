/**
 * THE BOUND OF F142-FR-023 OVER THE GROUPS LOOP, TESTED (T048, feature 154,
 * F154-FR-025, CQ-154-13 A).
 *
 * After TWO failed groups of one phase attempt, `layerOffDecision` of the
 * layer hands its `group-failures` decision, the loop layer is off for the
 * phase attempt, and NO THIRD GROUP starts — even though the plan still
 * holds one and its boundary would be clean. The same bound is read from
 * the ledger seam before every group (F154-FR-025): where the ledger already
 * counts the bound, the loop stops before ANY group starts.
 *
 * The plan is the one of `tests/fixtures/154/groups`: three groups, one task
 * each (T001, T002, T003). The workers of every group run and end WITHOUT a
 * checkpoint (`STUB_NO_CHECKPOINT=1`), so each group integrates nothing and
 * closes as ONE FAILED group (F142-FR-023's group_failed cause
 * `merge-check-failed`).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import type { ClosedGroup, ParallelPlan } from "../../../layer-parallel/src/index.ts";
import {
  parallelWiringOfTheAttempt,
  type ParallelWiringInput,
} from "../../src/engine/parallel-wiring.ts";

import { fixtureOf, wiringOf } from "./parallel-wiring.test.ts";

const TASK_LIST = "tasks.md";

/** The plan of the fixture of 154: three groups, one task each, in order. */
function planOfThreeGroups(): ParallelPlan {
  const scope = { prefixes: ["src"], source: "task-text" as const };
  const all = ["T001", "T002", "T003"];
  return {
    schema: "specstride.parallel-plan/1",
    runId: "run-wiring",
    hash: "plan-hash-layer-off-154",
    workers: 3,
    fallback: undefined,
    phases: [
      {
        phase: 2,
        groups: all.map((taskId, index) => ({ ordinal: index + 1, phase: 2, tasks: [taskId] })),
        tasks: all.map((id) => ({ id, scope, checks: [] })),
        serial: [],
        ceiling: 3,
      },
    ],
  };
}

/** The wiring input over a fresh fixture, with the collectors the test reads. */
function inputOf(
  overrides: {
    readonly failedGroupsBeforeOfTheLedger?: (phase: number) => number;
  } = {},
): {
  readonly input: ParallelWiringInput;
  readonly closed: () => readonly string[];
  readonly cleanup: () => void;
} {
  const fixture = fixtureOf("layer-off-154");
  const closedIds: string[] = [];
  const base = wiringOf(fixture, { plan: planOfThreeGroups() });
  const input: ParallelWiringInput = {
    ...base.input,
    keptUnitsOf: () => [],
    onClosed: (closed: ClosedGroup) => closedIds.push(closed.groupId),
    ...(overrides.failedGroupsBeforeOfTheLedger === undefined
      ? {}
      : { failedGroupsBeforeOfTheLedger: overrides.failedGroupsBeforeOfTheLedger }),
  };
  return { input, closed: () => closedIds, cleanup: fixture.cleanup };
}

test("two failed groups of the attempt switch the layer off, and no third group starts", async () => {
  const before = process.env.STUB_NO_CHECKPOINT;
  process.env.STUB_NO_CHECKPOINT = "1";
  const said: string[] = [];
  const emitted: { type: string; data: Record<string, unknown> }[] = [];
  const { input, closed, cleanup } = inputOf();
  try {
    const wiring = parallelWiringOfTheAttempt({
      ...input,
      say: (line) => said.push(line),
      emit: (type, data) => emitted.push({ type, data }),
    });
    // The loop runs the groups until the bound: two failed groups later it
    // stops, with the layer off FOR THE PHASE ATTEMPT.
    const ran = await wiring.startIfTheBoundaryIsClean();
    assert.deepEqual(closed(), ["g-2-1", "g-2-2"], `the groups closed: ${JSON.stringify(said)}`);
    assert.equal(wiring.layerOffForTheAttempt(), true);
    // The decision of the layer, carried out: the group-failures event.
    const decision = emitted.find((event) => event.data.reason === "group-failures");
    assert.ok(decision !== undefined, `no layer-off event in ${JSON.stringify(emitted)}`);
    assert.equal(decision.type, "parallel.group.ended");
    assert.equal(decision.data.reason, "group-failures");
    assert.equal(decision.data.scope, "attempt");
    assert.ok(said.some((line) => line.includes("group-failures")));
    assert.ok(
      said.some((line) => line.includes("2 groups of this phase attempt failed")),
      `no bound line in ${JSON.stringify(said)}`,
    );
    // The third group NEVER started — the two failed groups handed their
    // tasks back unticked (no checkpoint, nothing integrated), and T003's
    // tree got no worker write either.
    const tasks = readFileSync(join(input.workspace, TASK_LIST), "utf8");
    assert.match(tasks, /- \[ \] T001 /);
    assert.match(tasks, /- \[ \] T002 /);
    assert.match(tasks, /- \[ \] T003 /);
    assert.ok(
      !readFileSync(join(input.workspace, "src", "002.ts"), "utf8").includes("T002 was here"),
      "the failed group's work reached the workspace",
    );
    assert.ok(
      !readFileSync(join(input.workspace, "src", "003.ts"), "utf8").includes("T003 was here"),
      "a worker of the third group wrote the tree",
    );
    assert.equal(ran, true, "a third start must not run a group with the layer off");
    const again = await wiring.startIfTheBoundaryIsClean();
    assert.equal(again, false);
    assert.deepEqual(closed(), ["g-2-1", "g-2-2"]);
  } finally {
    if (before === undefined) delete process.env.STUB_NO_CHECKPOINT;
    else process.env.STUB_NO_CHECKPOINT = before;
    cleanup();
  }
});

test("the ledger's failed count read before every group stops the loop at the bound", async () => {
  const said: string[] = [];
  const reads: number[] = [];
  const { input, closed, cleanup } = inputOf({
    // THE LEDGER of the composition root (run-feature): the failed groups of
    // this phase attempt stand in the ledger before the loop begins.
    failedGroupsBeforeOfTheLedger: (phase) => {
      reads.push(phase);
      return 2;
    },
  });
  const wiring = parallelWiringOfTheAttempt({ ...input, say: (line) => said.push(line) });
  assert.equal(await wiring.startIfTheBoundaryIsClean(), false);
  // The bound was read before the FIRST group and stopped the loop there.
  assert.equal(reads.length, 1);
  assert.equal(reads[0], 2);
  assert.deepEqual(closed(), []);
  assert.ok(
    said.some((line) => line.includes("no further group starts")),
    `no bound line in ${JSON.stringify(said)}`,
  );
  // Nothing was worked: the whole plan stands on the main line.
  const tasks = readFileSync(join(input.workspace, TASK_LIST), "utf8");
  assert.match(tasks, /- \[ \] T001 /);
  assert.match(tasks, /- \[ \] T002 /);
  assert.match(tasks, /- \[ \] T003 /);
  cleanup();
});
