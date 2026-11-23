/**
 * Feature 153, CT-153-37 — the pure end cause of a phase attempt (US2, every
 * attempt closes): one row per cause (T094), a commit-gate block is a
 * rejection (T095), and an unknown end is never guessed (T096).
 *
 * The unit is `endCauseOf` (`../src/gate/end-cause.ts`), the pure decision of
 * the rule table `attempt-end-cause` (T093's contract file, T099's frozen
 * constant). No member of row 272 is added (F153-FR-038), and no cause is
 * ever guessed for an end the table does not know (plan.md EC-12).
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  ATTEMPT_END_CAUSE_TABLE,
  EC_1,
  EC_2,
  EC_4,
  EC_5,
  EC_6,
  EC_7,
  EC_8,
  EC_9,
  EC_10,
  EC_11,
  EC_12,
  endCauseOf,
  loadTheAttemptEndCauseTable,
  UnknownAttemptEndError,
} from "../src/gate/end-cause.ts";

test("one row per cause", () => {
  // EC-1 — the attempt was approved.
  assert.deepEqual(endCauseOf({ outcome: "approved" }), {
    endCause: "approved",
    ruleId: EC_1,
    synthesized: false,
  });
  // EC-2 — the gate failed, could not run, or a gate command was ended at
  // its limit: three situations, one outcome of the attempt's record.
  for (const situation of [
    "a failed gate",
    "a gate that could not run",
    "a gate command ended at its limit",
  ] as const) {
    const decision = endCauseOf({ outcome: "gate-failed" });
    assert.equal(decision.endCause, "verification-failed", situation);
    assert.equal(decision.ruleId, EC_2, situation);
    assert.equal(decision.synthesized, false, situation);
  }
  // EC-5 — the critic's verdict was MALFORMED.
  assert.deepEqual(endCauseOf({ outcome: "malformed" }), {
    endCause: "malformed",
    ruleId: EC_5,
    synthesized: false,
  });
  // EC-6 — the critic's verdict was REJECTED.
  assert.deepEqual(endCauseOf({ outcome: "rejected" }), {
    endCause: "rejected",
    ruleId: EC_6,
    synthesized: false,
  });
  // EC-7 — the pass loop ended and no phase evidence exists.
  assert.deepEqual(endCauseOf({ outcome: "no-evidence" }), {
    endCause: "no-evidence",
    ruleId: EC_7,
    synthesized: false,
  });
  // EC-8 — a stop request ended the attempt.
  assert.deepEqual(endCauseOf({ outcome: "stopped" }), {
    endCause: "stopped",
    ruleId: EC_8,
    synthesized: false,
  });
  // EC-9 — a blocked halt ended the attempt.
  assert.deepEqual(endCauseOf({ outcome: "blocked" }), {
    endCause: "blocked",
    ruleId: EC_9,
    synthesized: false,
  });
  // EC-10 — a configuration error or a throw inside the attempt ended it.
  assert.deepEqual(endCauseOf({ outcome: "error" }), {
    endCause: "error",
    ruleId: EC_10,
    synthesized: false,
  });
  // EC-11 — the process died mid-attempt; the closer is synthesised.
  assert.deepEqual(endCauseOf({ outcome: "died" }), {
    endCause: "crash",
    ruleId: EC_11,
    synthesized: true,
  });
});

test("the red-gate budget halt is EC-3, not EC-2", () => {
  const decision = endCauseOf({ outcome: "gate-failed", redGateHalt: true });
  assert.equal(decision.endCause, "verification-failed");
  assert.equal(decision.ruleId, "EC-3-red-gate-budget");
  assert.equal(decision.synthesized, false);
});

test("a commit-gate block is a rejection", () => {
  const decision = endCauseOf({ outcome: "commit-blocked" });
  assert.equal(decision.endCause, "rejected");
  assert.equal(decision.ruleId, EC_4);
  assert.equal(decision.synthesized, false);
});

test("an unknown end is never guessed", () => {
  // The constant loads cleanly (the default row EC-12 stands last).
  const loaded = loadTheAttemptEndCauseTable();
  const rows = loaded.rows["attempt-end-cause"];
  assert.equal(rows[rows.length - 1]?.ruleId, EC_12, "EC-12 is the default row");
  assert.equal(rows[rows.length - 1]?.when, undefined, "the default row has no predicate");
  // The same constant, as the table evaluates it: an input that matches no
  // row of the table reaches the default row EC-12 and no other.
  const unknown = "banana" as never;
  assert.throws(() => endCauseOf({ outcome: unknown }), UnknownAttemptEndError);
  try {
    endCauseOf({ outcome: unknown });
    assert.fail("endCauseOf threw for an unknown end");
  } catch (thrown) {
    assert.ok(thrown instanceof UnknownAttemptEndError);
    assert.equal((thrown as UnknownAttemptEndError).outcome, "banana");
    // The error carries the rule EC-12 and NO cause: nothing is guessed.
    assert.equal((thrown as unknown as { ruleId?: string }).ruleId, undefined);
    assert.ok((thrown as Error).message.includes("EC-12"), "the error names the rule EC-12");
    const decision = { cause: (thrown as unknown as { endCause?: string }).endCause };
    assert.equal(decision.cause, undefined, "no cause is attached");
  }
  // The frozen constant the decision comes from is the table of T093.
  assert.equal(ATTEMPT_END_CAUSE_TABLE.id, "attempt-end-cause");
});
