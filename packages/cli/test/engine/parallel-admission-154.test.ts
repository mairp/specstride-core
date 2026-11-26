/**
 * T058 — THE ADMISSION EVENT WIRED AT THE GATE (F154-FR-024, F142-FR-011,
 * -025; F154-SC-006): `startIfTheBoundaryIsClean` emits one
 * `parallel.admission` event per task of the group and one for the group
 * itself at each admission decision, admitted or refused, each with the
 * verdict of every check and its detail.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  groupGate,
  type ParallelPlan,
} from "../../../layer-parallel/src/index.ts";
import {
  parallelWiringOfTheAttempt,
  type ParallelWiringInput,
} from "../../src/engine/parallel-wiring.ts";

import { fixtureOf, wiringOf } from "./parallel-wiring.test.ts";

/** The plan of the fixture of 154: three groups, one task each, in order. */
function planOfThreeGroups(): ParallelPlan {
  const scope = { prefixes: ["src"], source: "task-text" as const };
  const all = ["T001", "T002", "T003"];
  return {
    schema: "specstride.parallel-plan/1",
    runId: "run-wiring",
    hash: "plan-hash-admission-154",
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

type AdmissionData = {
  taskId?: string;
  groupId?: string;
  ordinal?: number;
  phase?: number;
  admitted?: boolean;
  reason?: string;
  verdicts?: readonly { check: string; verdict: string; detail: string }[];
};

test("every admission decision emits one event per task and one per group, refused ones included", async () => {
  const said: string[] = [];
  const events: { type: string; data: Record<string, unknown> }[] = [];
  const fixture = fixtureOf("admission-154");
  const base = wiringOf(fixture, { plan: planOfThreeGroups() });
  const input: ParallelWiringInput = {
    ...base.input,
    keptUnitsOf: () => [],
    say: (line) => said.push(line),
    emit: (type, data) => events.push({ type, data }),
    /* No cycles remain: the REAL gate refuses every group of the attempt. */
    remainingCyclesOfTheAttempt: () => 0,
    groupGateOfTheAttempt: (inputs) => groupGate(inputs),
  };
  try {
    const wiring = parallelWiringOfTheAttempt(input);
    assert.equal(await wiring.startIfTheBoundaryIsClean(), false);
    // Every group was refused at the gate (the say lines prove the path ran).
    assert.equal(said.filter((line) => line.includes("is not admitted")).length, 3);
    // The admission events: one per task (3) and one per group (3), no more.
    const admissions = events.filter((event) => event.type === "parallel.admission");
    const ofTasks = admissions.filter((event) => (event.data as AdmissionData).taskId !== undefined);
    const ofGroups = admissions.filter((event) => (event.data as AdmissionData).groupId !== undefined);
    assert.equal(ofTasks.length, 3);
    assert.equal(ofGroups.length, 3);
    assert.deepEqual(
      ofTasks.map((event) => (event.data as AdmissionData).taskId),
      ["T001", "T002", "T003"],
    );
    assert.deepEqual(
      ofGroups.map((event) => (event.data as AdmissionData).groupId),
      ["g-2-1", "g-2-2", "g-2-3"],
    );
    // EVERY group event carries the verdict of every check and its refusal.
    for (const event of ofGroups) {
      const data = event.data as AdmissionData;
      assert.equal(data.admitted, false);
      assert.equal(data.reason, "headroom");
      const checks = (data.verdicts ?? []).map((verdict) => verdict.check);
      assert.deepEqual(checks, ["resource", "headroom", "headroom", "check", "links", "jobs"]);
      assert.equal(
        (data.verdicts ?? []).every((verdict) => verdict.detail.length > 0),
        true,
      );
    }
  } finally {
    fixture.cleanup();
  }
});

test("an admitted group emits the same events with every check passed", async () => {
  const events: { type: string; data: Record<string, unknown> }[] = [];
  const fixture = fixtureOf("admission-154");
  const base = wiringOf(fixture, { plan: planOfThreeGroups() });
  const input: ParallelWiringInput = {
    ...base.input,
    keptUnitsOf: () => [],
    emit: (type, data) => events.push({ type, data }),
    groupGateOfTheAttempt: (inputs) => groupGate(inputs),
  };
  try {
    const wiring = parallelWiringOfTheAttempt(input);
    await wiring.startIfTheBoundaryIsClean();
    const ofGroups = events.filter(
      (event) =>
        event.type === "parallel.admission" &&
        (event.data as AdmissionData).groupId === "g-2-1",
    );
    assert.equal(ofGroups.length, 1);
    const data = ofGroups[0]?.data as AdmissionData;
    assert.equal(data.admitted, true);
    assert.equal(data.reason, undefined);
    assert.equal(
      (data.verdicts ?? []).every((verdict) => verdict.verdict === "passed"),
      true,
    );
  } finally {
    fixture.cleanup();
  }
});
