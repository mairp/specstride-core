/**
 * CT-152-6 — the halt on a repeated block, and the bounds around it
 * (F152-FR-006, F152-FR-005; CQ-152-01 A; research D4; data-model.md E6).
 *
 * The decision is a PURE TABLE (`commit-gate.halt`, the table evaluator of
 * the kernel): CGH-1 halts on two consecutive blocked attempts of one phase
 * with the same signature; CGH-2 goes on, and the reject limit alone bounds
 * the retries. The table step runs BEFORE the reject-limit step of the order
 * after a rejection, so a repeated block on the last allowed attempt ends
 * `commit-gate`, never `max_rejects`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  COMMIT_GATE_HALT_TABLE,
  COMMIT_GATE_HALT_TABLE_ID,
  COMMIT_GATE_HALT_TABLE_VERSION,
  decideAfterABlock,
  HALT_RULE,
  GO_RULE,
} from "../src/gate/commit-gate-halt-table.ts";
import { NO_COUNTS, afterARejection, type LedgerCounts } from "../src/gate/limits.ts";

test("CGH-1: the same signature twice halts, recorded with its rule id", () => {
  const decision = decideAfterABlock({ sameSignature: true });
  assert.equal(decision.decision, "halt-commit-gate");
  assert.equal(decision.ruleId, HALT_RULE);
  assert.ok(decision.ruleId.startsWith("CGH-1"), `the rule id of the halt row: ${decision.ruleId}`);
  assert.equal(decision.tableId, COMMIT_GATE_HALT_TABLE_ID);
  assert.equal(decision.tableVersion, COMMIT_GATE_HALT_TABLE_VERSION);
});

test("CGH-2: a signature that differs (or no previous block) goes on", () => {
  for (const sameSignature of [false]) {
    const decision = decideAfterABlock({ sameSignature });
    assert.equal(decision.decision, "go");
    assert.equal(decision.ruleId, GO_RULE);
    assert.ok(
      decision.ruleId.startsWith("CGH-2"),
      `the rule id of the default row: ${decision.ruleId}`,
    );
  }
});

test("the table equals its contract (T166)", () => {
  const contract = JSON.parse(
    readFileSync(
      join(
        import.meta.dirname,
        "../../../specs/152-commit-backpressure/contracts/commit-gate-halt-table.json",
      ),
      "utf8",
    ),
  );
  assert.deepEqual(JSON.parse(JSON.stringify(COMMIT_GATE_HALT_TABLE)), contract);
});

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
  return afterARejection(
    {
      phase: 1,
      ordinal: 1,
      kind: "commit-blocked",
      feedbackRecords: [],
      ...inputs,
    } as never,
    { counts: ledger(), attemptPlanner: planner } as never,
  );
}

test("the reject limit still bounds a block with a new signature (T084)", async () => {
  const outcome = await run({
    ordinal: 3,
    previousBlockSignature: null,
    blockSignature: "s-3",
  });
  assert.equal(outcome.go, "halt");
  assert.equal(outcome.stopReason, "max_rejects");
  assert.equal(outcome.exitCode, 2);
  // Decided by the existing reject-limit step, NOT by the halt table: no
  // blocked reason rides it.
  assert.equal(outcome.blocked, undefined);
});

test("a repeated block on the last allowed attempt halts from the table on `max_rejects` (T085)", async () => {
  const outcome = await run({
    ordinal: 3,
    previousBlockSignature: "same",
    blockSignature: "same",
  });
  assert.equal(outcome.go, "halt");
  // The halt comes from the commit-gate halt table (the blocked reason and the
  // recorded rule id prove the table step ran before the reject limit), and it
  // maps to the existing stop reason `max_rejects` (CQ-152-01).
  assert.equal(outcome.blocked?.reason, "commit-gate");
  assert.match(String(outcome.stopFields?.ruleId ?? ""), /CGH-1/);
  assert.equal(outcome.stopReason, "max_rejects");
  assert.equal(outcome.exitCode, 2);
});

test("afterARejection halts on a repeated block, with the needs text (T086)", async () => {
  const outcome = await run({
    ordinal: 2,
    previousBlockSignature: "sig-S",
    blockSignature: "sig-S",
    blockRuleIds: ["cg-github-prefix"],
    blockFiles: ["config.ts"],
  });
  assert.equal(outcome.go, "halt");
  assert.equal(outcome.blocked?.reason, "commit-gate");
  assert.match(outcome.blocked?.needs ?? "", /phase 1/);
  assert.match(outcome.blocked?.needs ?? "", /cg-github-prefix/);
  assert.match(outcome.blocked?.needs ?? "", /config\.ts/);
});

test("only the attempt just before counts (T087)", async () => {
  // Attempt k−1 was rejected by the CRITIC: it has no block record, so
  // `previousBlockSignature` is null even though attempt k−2 was blocked with
  // the same signature. No halt from the table; the reject limit decides.
  const outcome = await run({
    ordinal: 3,
    previousBlockSignature: null,
    blockSignature: "sig-S",
  });
  assert.equal(outcome.go, "halt");
  assert.equal(outcome.blocked, undefined);
  assert.equal(outcome.stopReason, "max_rejects");
});

test("a repeated block under the reject limit halts without reaching it", async () => {
  const outcome = await run({
    ordinal: 2,
    previousBlockSignature: "sig-S",
    blockSignature: "sig-S",
  });
  assert.equal(outcome.go, "halt");
  assert.equal(outcome.blocked?.reason, "commit-gate");
});
