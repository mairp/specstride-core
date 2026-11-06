/**
 * CT-141-141 — the counters of capture A and capture B (T138, T143;
 * F141-FR-041).
 *
 * What the test proves:
 *
 * - **equal per phase**: the five named counters — passes used, reject count,
 *   MALFORMED streak, numbers of phase attempts, yield count — are equal for
 *   every phase in capture A and capture B, and a phase on one side alone is
 *   itself a difference;
 * - **subsets**: the exit codes, stop reasons and run states seen in capture B
 *   are subsets of those seen in capture A; a value only B shows is reported
 *   with the set it stands in;
 * - **the names are the names of the capture**: `counterNameList` is the list
 *   the capture module keeps, and nothing else;
 * - **a changed counter fails with the words the gate names**: a counter the
 *   layer changed is a possible breach of gate integrity.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  assertCountersEqual,
  assertSubsets,
  counterNameList,
  countersEqual,
  countersOfPhase,
  countersVerdict,
  failuresOfCountersVerdict,
  subsetsOfA,
  CountersError,
} from "../../src/suite2/counters.ts";
import { COUNTER_NAMES } from "../../src/capture/port-only.ts";
import { BREACH_MESSAGE } from "../../src/suite2/allowlist.ts";

const A = {
  perPhase: [
    countersOfPhase(1, {
      passesUsed: 2,
      rejectCount: 1,
      malformedStreak: 0,
      phaseAttempts: 1,
      yieldCount: 0,
    }),
    countersOfPhase(2, {
      passesUsed: 4,
      rejectCount: 2,
      malformedStreak: 1,
      phaseAttempts: 2,
      yieldCount: 1,
    }),
  ],
  exitCodes: [0, 3],
  stopReasons: ["phase-gate", "reject-limit"],
  runStates: ["finished", "stopped"],
};

test("the names are the names of the capture, and nothing else", () => {
  assert.deepEqual(counterNameList(), COUNTER_NAMES);
  assert.ok(COUNTER_NAMES.includes("passesUsed"));
  assert.ok(COUNTER_NAMES.includes("rejectCount"));
  assert.ok(COUNTER_NAMES.includes("malformedStreak"));
  assert.ok(COUNTER_NAMES.includes("phaseAttempts"));
  assert.ok(COUNTER_NAMES.includes("yieldCount"));
  assert.equal(counterNameList().length, 5);
});

test("equal counters per phase give an empty verdict", () => {
  const b = structuredClone(A) as typeof A;
  assert.deepEqual(countersEqual("FX-01/defaults", A, b), []);
  const verdict = countersVerdict("FX-01/defaults", A, b);
  assert.equal(verdict.differences.length, 0);
  assert.deepEqual(failuresOfCountersVerdict(verdict), []);
  assert.doesNotThrow(() => assertCountersEqual("FX-01/defaults", A, b));
});

test("every counter of every phase is asserted", () => {
  const b = structuredClone(A) as typeof A;
  b.perPhase[0] = countersOfPhase(1, {
    passesUsed: 3,
    rejectCount: 1,
    malformedStreak: 2,
    phaseAttempts: 1,
    yieldCount: 1,
  });
  const differences = countersEqual("FX-01/defaults", A, b);
  assert.deepEqual(
    differences.map((d) => d.counter),
    ["passesUsed", "malformedStreak", "yieldCount"],
  );
  const first = differences[0] as { phase: number; a: number; b: number };
  assert.equal(first.phase, 1);
  assert.equal(first.a, 2);
  assert.equal(first.b, 3);
  assert.throws(() => assertCountersEqual("FX-01/defaults", A, b), CountersError);
  assert.match(
    failuresOfCountersVerdict(countersVerdict("FX-01/defaults", A, b))[0] as string,
    /F141-FR-041/,
  );
});

test("a phase that only one capture holds is itself a difference", () => {
  const b = structuredClone(A) as typeof A;
  b.perPhase = [...A.perPhase, countersOfPhase(3, { passesUsed: 1 })];
  const differences = countersEqual("FX-01/defaults", A, b);
  assert.equal(differences.length, 1);
  assert.equal((differences[0] as { phase: number }).phase, 3);
  // And so is a phase the layer REMOVED.
  const withoutPhase2 = structuredClone(A) as typeof A;
  withoutPhase2.perPhase = [A.perPhase[0] as never];
  const removed = countersEqual("FX-01/defaults", withoutPhase2, A);
  assert.equal((removed[0] as { phase: number }).phase, 2);
});

test("the sets of capture B are subsets of those of capture A", () => {
  const b = structuredClone(A) as typeof A;
  assert.deepEqual(subsetsOfA(A, b), []);
  assert.doesNotThrow(() => assertSubsets(A, b));
  // A value only capture B shows, in each of the three sets.
  b.exitCodes = [0, 3, 7];
  b.stopReasons = ["phase-gate", "quota-pause"];
  b.runStates = ["finished", "relaunched"];
  const violations = subsetsOfA(A, b);
  assert.deepEqual(
    violations.map((v) => v.set),
    ["exitCodes", "stopReasons", "runStates"],
  );
  assert.deepEqual((violations[0] as { onlyInB: readonly string[] }).onlyInB, ["7"]);
  assert.throws(() => assertSubsets(A, b), CountersError);
  const lines = failuresOfCountersVerdict(countersVerdict("FX-01/defaults", A, b));
  assert.match(lines.join("\n"), /quota-pause/);
});

test("a counter the layer changed is reported as a possible breach of gate integrity", () => {
  const b = structuredClone(A) as typeof A;
  b.perPhase[1] = countersOfPhase(2, { passesUsed: 5 });
  const lines = failuresOfCountersVerdict(countersVerdict("FX-01/defaults", A, b));
  assert.match(lines[0] as string, new RegExp(BREACH_MESSAGE));
});
