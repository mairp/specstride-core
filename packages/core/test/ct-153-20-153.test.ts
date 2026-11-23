/**
 * CT-153-20 — a red gate spends the budget, not the reject limit
 * (F153-FR-020; CQ-153-05 answered A — budget A — on 2026-11-13).
 *
 * With the switch `verification.redGate.ownBudget` on, `afterARejection` for
 * the kind `gate-failed`:
 *
 *  1. leaves `rejectCount` unchanged — the gate spends one unit of the
 *     red-gate budget and none of the reject limit;
 *  2. still raises the phase-attempt ordinal (the attempt is consumed);
 *  3. still runs the post-rejection order of F101-FR-017, all five places,
 *     the diagnostician included;
 *  4. stays outside K of the model-tier bump (F149-FR-004) — a failed gate
 *     is no verdict REJECTED of the critic.
 *
 * The guard row: with the switch off, the same rejection raises the reject
 * count exactly as before (F105-FR-005).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { NO_COUNTS, afterARejection, type LedgerCounts } from "../src/gate/limits.ts";
import { rejectionCountsTowardsK } from "../src/ep18/planner-tier-bump.ts";

/** The smallest ledger port over an in-memory cell. */
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

async function run(inputs: Record<string, unknown>) {
  const counts = ledger();
  const outcome = await afterARejection(
    {
      phase: 2,
      ordinal: 1,
      kind: "gate-failed",
      feedbackRecords: [],
      ...inputs,
    } as never,
    { counts, attemptPlanner: planner } as never,
  );
  return { outcome, counts };
}

test('CT-153-20 "a red gate spends the budget, not the reject limit"', async (t) => {
  await t.test("the reject count is unchanged, the ordinal is raised", async () => {
    const { outcome, counts } = await run({
      ordinal: 2,
      redGate: { switchOn: true, count: 1, limit: 3 },
    });
    assert.equal(outcome.go, "next-attempt");
    assert.equal(outcome.counts.rejectCount, 0, "no unit of the reject limit is spent");
    assert.equal(outcome.counts.phaseAttemptOrdinal, 2, "the ordinal is still consumed");
    assert.equal(outcome.counts.malformedStreak, 0, "a gate leaves no verdict (B-0328)");
    assert.equal(counts.read().rejectCount, 0, "the ledger holds the unchanged count");
    assert.equal(counts.read().phaseAttemptOrdinal, 2);
  });

  await t.test("the post-rejection order still runs, to the last place", async () => {
    const { outcome } = await run({
      ordinal: 1,
      redGate: { switchOn: true, count: 1, limit: 3 },
    });
    assert.equal(outcome.go, "next-attempt");
    assert.deepEqual(
      [...outcome.stepsRun],
      [
        "the MALFORMED limit",
        "the diagnostician",
        "the oscillation halt",
        "the reject limit",
        "the archive and the next phase attempt",
      ],
    );
  });

  await t.test("the rejection stays outside K of the model-tier bump", async () => {
    // F149-FR-004 — only a verdict REJECTED of the critic counts towards K;
    // a failed verification gate has no verdict, whatever budget spends it.
    assert.equal(rejectionCountsTowardsK({ verificationGatePassed: false, verdict: null }), false);
  });

  await t.test("a spent budget halts before the reject limit is consulted", async () => {
    const { outcome } = await run({
      ordinal: 2,
      redGate: { switchOn: true, count: 3, limit: 3 },
    });
    assert.equal(outcome.go, "halt");
    assert.ok(
      !outcome.stepsRun.includes("the reject limit"),
      "the reject-limit place is not consulted for a red gate",
    );
  });

  await t.test("the guard: the switch off raises the reject count as before", async () => {
    const { outcome, counts } = await run({
      ordinal: 2,
      redGate: { switchOn: false, count: 1, limit: 3 },
    });
    assert.equal(outcome.go, "next-attempt");
    assert.equal(outcome.counts.rejectCount, 1, "F105-FR-005 — today's behaviour");
    assert.equal(counts.read().rejectCount, 1);
  });

  await t.test("the guard: the input absent is today's behaviour", async () => {
    const { outcome } = await run({ ordinal: 2 });
    assert.equal(outcome.go, "next-attempt");
    assert.equal(outcome.counts.rejectCount, 1);
  });
});
