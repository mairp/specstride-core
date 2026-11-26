/**
 * T055 — THE HALVING WIRED IN THE GROUPS LOOP (F154-FR-022, F142-FR-019).
 *
 * Before EVERY group of the attempt the wiring reads
 * `workersForTheRestOfTheAttempt` (`plan.ts:202`) over the groups of the
 * attempt that each ended with two rate limits classified as transient:
 *
 *  - the first group runs at the plan's count, no halving said;
 *  - after one group that ended with two transient limits, the NEXT group
 *    runs at half the count (2 -> 1), and the say line records it with its
 *    reason;
 *  - the count the gate of the admission reads (`groupGate`'s `workers`) is
 *    the halved one, so a halved attempt also narrows what the check
 *    `headroom` admits against.
 *
 * The transient counts come through the seam `transientRateLimitsOfTheGroup`
 * of `ParallelWiringInput`; the default (no seam) never halves, which the
 * phase-5 groups test pins by running green with no halving said.
 */
import assert from "node:assert/strict";
import test from "node:test";

import type { AdmissionInputs, ClosedGroup } from "../../../layer-parallel/src/index.ts";
import {
  parallelWiringOfTheAttempt,
  type ParallelWiringInput,
} from "../../src/engine/parallel-wiring.ts";

import { fixtureOf, wiringOf } from "./parallel-wiring.test.ts";

import type { ParallelPlan } from "../../../layer-parallel/src/index.ts";

/** The plan of the fixture of 154: three groups, one task each, in order. */
function planOfThreeGroups(): ParallelPlan {
  const scope = { prefixes: ["src"], source: "task-text" as const };
  const all = ["T001", "T002", "T003"];
  return {
    schema: "specstride.parallel-plan/1",
    runId: "run-wiring",
    hash: "plan-hash-halving-154",
    workers: 3,
    fallback: undefined,
    phases: [
      {
        phase: 2,
        groups: all.map((taskId, index) => ({
          ordinal: index + 1,
          phase: 2,
          tasks: [taskId],
        })),
        tasks: all.map((id) => ({ id, scope, checks: [] })),
        serial: [],
        ceiling: 3,
      },
    ],
  };
}

test("after a group ended with two transient rate limits the next group runs at half the workers", async () => {
  const said: string[] = [];
  const workersAtTheGate: number[] = [];
  const fixture = fixtureOf("groups-154");
  const base = wiringOf(fixture, { plan: planOfThreeGroups() });
  const input: ParallelWiringInput = {
    ...base.input,
    keptUnitsOf: () => [],
    say: (line) => said.push(line),
    /* Every group of this attempt "saw" two transient rate limits. */
    transientRateLimitsOfTheGroup: () => 2,
    /* The gate is wired, so the test can read the count it was given. */
    groupGateOfTheAttempt: (inputs: AdmissionInputs) => {
      workersAtTheGate.push(inputs.workers);
      return { admitted: true, reason: null, detail: "test admits" };
    },
  };
  try {
    const wiring = parallelWiringOfTheAttempt(input);
    assert.equal(await wiring.startIfTheBoundaryIsClean(), true);
    // The first group ran at the plan's count, not halved.
    assert.equal(workersAtTheGate[0], 2);
    // The second and third groups ran at the halved count: 2 -> 1.
    assert.equal(workersAtTheGate[1], 1);
    assert.equal(workersAtTheGate[2], 1);
    // The halving is said, with its reason, once per group after the first.
    const halved = said.filter((line) => line.includes("halved after"));
    assert.equal(halved.length, 2);
    assert.match(halved[0] ?? "", /group 2 runs 1 worker\(s\)/);
    assert.match(halved[0] ?? "", /transient rate limit/);
  } finally {
    fixture.cleanup();
  }
});

test("with no transient rate limits seen no group is halved and nothing is said", async () => {
  const said: string[] = [];
  const workersAtTheGate: number[] = [];
  const closedGroups: ClosedGroup[] = [];
  const fixture = fixtureOf("groups-154");
  const base = wiringOf(fixture, { plan: planOfThreeGroups() });
  const input: ParallelWiringInput = {
    ...base.input,
    keptUnitsOf: () => [],
    say: (line) => said.push(line),
    transientRateLimitsOfTheGroup: () => 1, // fewer than two: no halving
    onClosed: (closed) => closedGroups.push(closed),
    groupGateOfTheAttempt: (inputs: AdmissionInputs) => {
      workersAtTheGate.push(inputs.workers);
      return { admitted: true, reason: null, detail: "test admits" };
    },
  };
  try {
    const wiring = parallelWiringOfTheAttempt(input);
    assert.equal(await wiring.startIfTheBoundaryIsClean(), true);
    assert.equal(closedGroups.length, 3);
    assert.deepEqual(workersAtTheGate, [2, 2, 2]);
    assert.equal(said.filter((line) => line.includes("halved after")).length, 0);
  } finally {
    fixture.cleanup();
  }
});
