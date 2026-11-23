/**
 * T024 — the hermetic (unpaid) part of experiment X0, on Linux.
 *
 * The live part of X0 — 20 live passes on a real harness, 5 of them killed on
 * purpose, pass mark 100 per cent of passes accounted for and totals within
 * 2 per cent (F126-SC-001) — is PAID and is never run here (owner ruling of
 * 2026-09-30); it is recorded as `unverified` in
 * specs/126-stream-seam-and-invocation/verification-x0.md.
 *
 * This script is the stub-agent form of the same experiment: 20 stub passes,
 * 5 of them killed mid-pass, replayed through the usage accountant, with the
 * same pass mark. The harness's own session total is the ground truth each
 * pass is generated from, so the totals of the accountant are checked against
 * it exactly as the live run would check them (within 2 per cent).
 *
 * Run: node tests/isolate.ts node specs/126-stream-seam-and-invocation/scripts/x0-hermetic.ts
 */
import assert from "node:assert/strict";
import { UsageAccountant } from "../../../packages/harness/src/stream/usage.ts";
import { accountedShare, type PassUsageOutcome } from "../../../packages/harness/src/invocation/accounting.ts";
import type { UsageRecord } from "../../../packages/harness/src/stream/records.ts";

/** A deterministic pseudo-random generator (no Math.random: repeatable). */
function generator(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

/** One stub pass: its ground-truth session total and the records it emits. */
function stubPass(index: number, killed: boolean): {
  groundTruth: number;
  records: UsageRecord[];
} {
  const next = generator(1000 + index * 7919);
  const calls = 3 + Math.floor(next() * 5);
  const records: UsageRecord[] = [];
  let total = 0;
  for (let c = 0; c < calls; c += 1) {
    const inputTokens = 100 + Math.floor(next() * 4000);
    total += inputTokens;
    records.push({
      kind: "usage",
      inputTokens,
      outputTokens: Math.floor(next() * 500),
      cacheReadTokens: null,
      cacheWriteTokens: null,
      reasoningTokens: null,
      cost: null,
      scope: null,
      cumulative: false,
      usageId: `x0-${index}-${c}`,
      sessionId: `sess-x0-${index}`,
      synthesized: false,
    });
  }
  if (killed) records.splice(Math.floor(records.length / 2)); // killed mid-pass
  return { groundTruth: killed ? records.reduce((s, r) => s + (r.inputTokens ?? 0), 0) : total, records };
}

const PASSES = 20;
const KILLED = 5;
const outcomes: PassUsageOutcome[] = [];
let reportedTotal = 0;
let groundTruthTotal = 0;

for (let i = 0; i < PASSES; i += 1) {
  const killed = i < KILLED;
  const pass = stubPass(i, killed);
  const accountant = new UsageAccountant({ usageSource: "stream" });
  for (const record of pass.records) accountant.push(record);
  if (killed) accountant.kill();
  else accountant.finish();
  const facts = accountant.facts();
  const passReported = facts.totalInputTokens ?? 0;
  // Pass mark, per pass: the increment sum is within 2 per cent of the
  // harness's own session total, and every pass is accounted for.
  assert.ok(
    Math.abs(passReported - pass.groundTruth) <= 0.02 * pass.groundTruth,
    `pass ${i}: ${passReported} within 2 per cent of ${pass.groundTruth}`,
  );
  reportedTotal += passReported;
  groundTruthTotal += pass.groundTruth;
  outcomes.push(
    !killed && facts.usageComplete
      ? "complete"
      : killed && facts.usageComplete === false && facts.lastUsage !== null
        ? "killed-partial"
        : "unaccounted",
  );
}

const share = accountedShare(outcomes);
assert.equal(share.total, PASSES);
assert.equal(share.accounted, PASSES, "100 per cent of the passes are accounted for");
assert.equal(share.share, 1);
const drift = Math.abs(reportedTotal - groundTruthTotal) / groundTruthTotal;
assert.ok(drift <= 0.02, `the run total is within 2 per cent (${drift})`);
console.log(
  `X0-hermetic: passes=${PASSES} killed=${KILLED} accounted=${share.accounted}/${share.total} ` +
    `share=100% reported_total=${reportedTotal} ground_truth_total=${groundTruthTotal} drift=${(drift * 100).toFixed(4)}% PASS`,
);
