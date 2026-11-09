/**
 * The harness call of a pass gets the pass ceiling the watchdog enforces, so
 * SPECSTRIDE_PROPOSER_TIMEOUT_SEC above 45 minutes takes effect (152 phase 3,
 * 2026-11-09: every pass was cut at 45 minutes under a 4-hour ceiling).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { proposerLimitMsOf } from "../../src/engine/run-feature.ts";

const MIN45 = 45 * 60 * 1000;

test("a ceiling above 45 minutes is the limit, with the kill grace on top", () => {
  assert.equal(proposerLimitMsOf(14_400, 5_000), 14_400_000 + 5_000);
});

test("the default ceiling (30 minutes) and nonsense keep the fixed 45 minutes", () => {
  assert.equal(proposerLimitMsOf(1_800, 5_000), MIN45);
  assert.equal(proposerLimitMsOf(Number.NaN, 5_000), MIN45);
  assert.equal(proposerLimitMsOf(0, 5_000), MIN45);
});
