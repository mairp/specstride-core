/**
 * CT-153-23 — a gate that could not run spends the budget too
 * (F153-FR-023; CQ-153-05 answered A; F105-FR-005, -013).
 *
 * A gate result with code 3 (the gate could not run) is counted like one with
 * code 10 (a command failed): both are red gates, both spend the red-gate
 * budget, and a code 3 is the red gate that exhausts the budget as surely as
 * a code 10 is.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { redGateCountOf, redGateBudgetOf } from "../src/gate/red-gate-budget.ts";
import { NO_COUNTS, afterARejection, type LedgerCounts } from "../src/gate/limits.ts";

function ledger(): LedgerCounts {
  let counts: { rejectCount: number; phaseAttemptOrdinal: number; malformedStreak: number } = {
    ...NO_COUNTS,
  };
  return {
    read: () => ({ ...counts }),
    write: (next) => {
      counts = { ...next };
    },
  };
}

const planner = { next: () => "plain" as const };

test('CT-153-23 "a gate that could not run spends the budget too"', async (t) => {
  await t.test("a code 3 is counted like a code 10", () => {
    assert.equal(redGateCountOf([{ code: 3 }]), 1);
    assert.equal(redGateCountOf([{ code: 3 }]), redGateCountOf([{ code: 10 }]));
    // A green gate is not a red gate.
    assert.equal(redGateCountOf([{ code: 0 }]), 0);
  });

  await t.test("a code 3 reaches the budget and halts like a code 10", async () => {
    // Two failed gates (code 10) spent two units; the gate that could not run
    // (code 3) is the third red gate, and the budget decides.
    const spent = redGateCountOf([{ code: 10 }, { code: 10 }, { code: 3 }]);
    assert.equal(spent, 3);
    const decision = redGateBudgetOf({ switchOn: true, count: spent, limit: 3 });
    assert.equal(decision.decision, "halt");
    assert.ok(decision.ruleId.startsWith("RGB-2"));
    // The same path through the rejection handler: the halt fires on a count
    // a code 3 record completed.
    const outcome = await afterARejection(
      {
        phase: 1,
        ordinal: 3,
        kind: "gate-failed",
        feedbackRecords: [],
        redGate: { switchOn: true, count: spent, limit: 3 },
      } as never,
      { counts: ledger(), attemptPlanner: planner } as never,
    );
    assert.equal(outcome.go, "halt");
    assert.equal(outcome.counts.rejectCount, 0);
  });

  await t.test("a code 3 under the limit spends, and no rejection is spent", async () => {
    const outcome = await afterARejection(
      {
        phase: 1,
        ordinal: 1,
        kind: "gate-failed",
        feedbackRecords: [],
        redGate: { switchOn: true, count: redGateCountOf([{ code: 3 }]), limit: 3 },
      } as never,
      { counts: ledger(), attemptPlanner: planner } as never,
    );
    assert.equal(outcome.go, "next-attempt");
    assert.equal(outcome.counts.rejectCount, 0);
  });
});
