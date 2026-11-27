/**
 * T056 — THE CYCLES WIRED IN THE ADMISSION AND THE CHARGE (F154-FR-023,
 * F142-FR-021 rule PU-87). Over the REAL seams, the REAL `groupGate` and the
 * REAL groups loop of the wiring:
 *
 *  - the cycles verdict of the group comes from `cyclesSufficeForTheGroup`
 *    (`decide.ts`) over the remaining cycles of the attempt and the group's
 *    tasks, and is fed into `groupGate` as the inner check `cycles`; a group
 *    whose remaining cycles do not cover its tasks is NOT admitted, the say
 *    line names the reason, and no worker of that group starts;
 *  - the charge of one cycle per admitted task happens at the worker's FIRST
 *    start, once per task of the attempt: the second and third groups see the
 *    reduced budget, and with a budget of two a third group of the attempt is
 *    refused with the reason `cycles`;
 *  - a task charged already charges nothing again — the per-attempt charged
 *    set answers for it, so the gate's verdict never double counts.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  groupGate,
  chargeCyclesPerAdmittedTask,
  type AdmissionInputs,
  type CycleCharge,
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
    hash: "plan-hash-cycles-154",
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

test("a group whose remaining cycles do not cover its tasks is not admitted, and no worker starts", async () => {
  const said: string[] = [];
  const verdictsAtTheGate: unknown[] = [];
  const fixture = fixtureOf("cycles-154");
  const base = wiringOf(fixture, { plan: planOfThreeGroups() });
  const input: ParallelWiringInput = {
    ...base.input,
    keptUnitsOf: () => [],
    say: (line) => said.push(line),
    /* No cycles remain in the attempt at all. */
    remainingCyclesOfTheAttempt: () => 0,
    /* The REAL gate of the composition root, so the cycles check runs. */
    groupGateOfTheAttempt: (inputs: AdmissionInputs) => {
      verdictsAtTheGate.push(inputs.cycles?.sufficesForTheGroup);
      return groupGate(inputs);
    },
  };
  try {
    const wiring = parallelWiringOfTheAttempt(input);
    // No group ran: every group of the attempt is refused at the gate, so
    // the boundary run admits nothing and answers false.
    assert.equal(await wiring.startIfTheBoundaryIsClean(), false);
    // The gate was handed the cycles verdict of the first group, and it
    // refuses: 0 remain, a group of 1 task charges 1.
    const verdict = verdictsAtTheGate[0] as
      { admissible: boolean; needed: number; detail: string } | undefined;
    assert.equal(verdict?.admissible, false);
    assert.equal(verdict?.needed, 1);
    assert.match(verdict?.detail ?? "", /0 cycle\(s\) remain and a group of 1 task\(s\) charges 1/);
    // Every group of the attempt is refused, the first with its ordinal.
    const refused = said.filter((line) => line.includes("is not admitted"));
    assert.equal(refused.length, 3);
    assert.match(
      refused[0] ?? "",
      /group 1 is not admitted — headroom: cycles: 0 cycle\(s\) remain/,
    );
    // No group started: no group-started line was said.
    assert.equal(
      said.filter((line) => line.includes("[LOOP] parallel group")).length,
      0,
      `expected no group to start, said: ${JSON.stringify(said)}`,
    );
  } finally {
    fixture.cleanup();
  }
});

test("each admitted task charges one cycle at its first start, once, and the next group sees the reduced budget", async () => {
  const said: string[] = [];
  const charges: { workerId: string; taskId: string; charge: CycleCharge }[] = [];
  const fixture = fixtureOf("cycles-154");
  const base = wiringOf(fixture, { plan: planOfThreeGroups() });
  const input: ParallelWiringInput = {
    ...base.input,
    keptUnitsOf: () => [],
    say: (line) => said.push(line),
    /* The attempt holds a budget of TWO cycles. */
    remainingCyclesOfTheAttempt: () => 2,
    /* The charge is spied, then answered by the layer's own charge. */
    chargeCyclesOfTheAdmittedTasks: (workerId, taskId, admittedTasks) => {
      const charge = chargeCyclesPerAdmittedTask([{ workerId, taskId }], admittedTasks);
      charges.push({ workerId, taskId, charge });
      return charge;
    },
    groupGateOfTheAttempt: (inputs: AdmissionInputs) => groupGate(inputs),
  };
  try {
    const wiring = parallelWiringOfTheAttempt(input);
    assert.equal(await wiring.startIfTheBoundaryIsClean(), true);
    // Exactly one charge per admitted task, at its first start: the two
    // groups that ran charged their tasks once each — no double charge.
    assert.deepEqual(
      charges.map((one) => one.taskId),
      ["T001", "T002"],
    );
    for (const one of charges) {
      assert.equal(one.charge.charged, 1);
      assert.equal(one.charge.perTask[one.taskId], 1);
    }
    // The gate saw the budget shrink as the charges landed: group 1 saw 2,
    // group 2 saw 1, and the third group — 0 remaining against 1 needed —
    // was refused with the reason `cycles` and never started.
    const refused = said.filter((line) => line.includes("is not admitted"));
    assert.equal(refused.length, 1);
    assert.match(
      refused[0] ?? "",
      /group 3 is not admitted — headroom: cycles: 0 cycle\(s\) remain/,
    );
    assert.equal(
      said.filter((line) => line.includes("[LOOP] parallel group") && line.includes("started"))
        .length,
      2,
      `expected exactly two groups to start, said: ${JSON.stringify(said)}`,
    );
  } finally {
    fixture.cleanup();
  }
});
