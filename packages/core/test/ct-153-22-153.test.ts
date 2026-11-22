/**
 * CT-153-22 — a spent budget halts (F153-FR-022; CQ-153-05 answered A).
 *
 * The red gate that exceeds the limit gives `halt` with rule RGB-2, the stop
 * reason `max_rejects`, exit code 2, and the cause `verification-failed` in
 * the terminal record — and the stop is not in the transient classes a
 * supervisor relaunches.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { NO_COUNTS, afterARejection, type LedgerCounts } from "../src/gate/limits.ts";
import { haltOf } from "../src/gate/halts.ts";
import { endCauseOf } from "../src/gate/end-cause.ts";
import { redGateBudgetOf, RGB_2_HALT } from "../src/gate/red-gate-budget.ts";
import { isTransient } from "@specstride/contracts/codes/stop-reasons";
import { stageReasonIsTransient } from "@specstride/contracts/codes/stop-reason-literals";

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

test('CT-153-22 "a spent budget halts"', async (t) => {
  await t.test("the table halts a spent budget with rule RGB-2", () => {
    const decision = redGateBudgetOf({ switchOn: true, count: 3, limit: 3 });
    assert.equal(decision.decision, "halt");
    assert.equal(decision.ruleId, RGB_2_HALT);
    assert.ok(decision.ruleId.startsWith("RGB-2"), `the rule id: ${decision.ruleId}`);
    // The gate under the limit spends, and does not halt.
    const under = redGateBudgetOf({ switchOn: true, count: 2, limit: 3 });
    assert.equal(under.decision, "spend");
    assert.ok(under.ruleId.startsWith("RGB-3"));
  });

  await t.test("afterARejection halts with max_rejects and exit code 2", async () => {
    const outcome = await afterARejection(
      {
        phase: 3,
        ordinal: 3,
        kind: "gate-failed",
        feedbackRecords: [],
        redGate: { switchOn: true, count: 3, limit: 3 },
      } as never,
      { counts: ledger(), attemptPlanner: planner } as never,
    );
    assert.equal(outcome.go, "halt");
    assert.equal(outcome.stopReason, "max_rejects");
    assert.equal(outcome.exitCode, 2);
    assert.equal((outcome.stopFields as Record<string, unknown>).ruleId, RGB_2_HALT);
    assert.equal(outcome.printTheHaltBanner, true, "the halt banner of F101-FR-014");
    // The reject count did not move on the way into the halt.
    assert.equal(outcome.counts.rejectCount, 0);
  });

  await t.test("the terminal record carries the cause verification-failed", () => {
    // The gate-failed attempt whose halt the budget decided ends through the
    // EC-3 row of the end-cause table — `verification-failed`, not `rejected`.
    const cause = endCauseOf({ outcome: "gate-failed", redGateHalt: true });
    assert.equal(cause.endCause, "verification-failed");
    assert.equal(cause.ruleId, "EC-3-red-gate-budget");
    // And the gate failure without the budget halt keeps the same cause
    // through EC-2: no new end cause was added.
    assert.equal(endCauseOf({ outcome: "gate-failed" }).endCause, "verification-failed");
  });

  await t.test("the stop is not in the transient classes a supervisor relaunches", () => {
    const halt = haltOf("reject-limit");
    assert.equal(halt.stopReason, "max_rejects");
    assert.equal(halt.exitCode, 2);
    // The row of the table of halts is not retryable.
    assert.equal(halt.retryable, false);
    // Neither stop-reason attribute nor stage-reason class is transient.
    assert.equal(isTransient("max_rejects"), false);
    assert.equal(stageReasonIsTransient("max_rejects"), false);
  });
});
