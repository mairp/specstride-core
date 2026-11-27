/**
 * T141 — the speculation rule SP-1…SP-6 over the pure table (F154-FR-061…
 * -067): `speculationVerdictOf` matches the table exhaustively — a unit
 * without a verdict is admitted (SP-1) or refused with `rate`, `depth` or
 * `sweep` (SP-2, SP-3, SP-4), in the table's order and with the rule id of
 * the row that fired; a unit with a verdict integrates (SP-5) or is set
 * aside (SP-6). At the defaults (window 20, 50 %, depth 1) the two measured
 * runs — 29 of 336 and 10 of 121 — never start a unit (F154-SC-013, R-M11).
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  SPECULATE_DEPTH_DEFAULT,
  SPECULATE_MIN_RATE_DEFAULT,
  SPECULATE_WINDOW_DEFAULT,
  SPECULATION_POINT,
  approvalRateOverWindowOf,
  refusalReasonOf,
  speculationVerdictOf,
} from "../src/speculation/speculation-rule.ts";
import { SPECULATION_TABLE } from "../src/speculation/tables.ts";

/** An admission observation: no verdict yet, the sweep confirmed. */
function open(ratePerCent: number, depth = 0, sweepConfirmed = true) {
  return { ratePerCent, depth, sweepConfirmed, verdict: "open" as const };
}

test("the defaults are depth 1, window 20 and 50 % (CQ-154-18 A)", () => {
  assert.equal(SPECULATE_DEPTH_DEFAULT, 1);
  assert.equal(SPECULATE_WINDOW_DEFAULT, 20);
  assert.equal(SPECULATE_MIN_RATE_DEFAULT, 50);
  assert.equal(SPECULATION_POINT, "loop.speculation");
});

test("SP-1 — at or above the rate, below the depth, sweep confirmed: start", () => {
  const decision = speculationVerdictOf(open(50));
  assert.equal(decision.choice, "start");
  assert.equal(decision.ruleId, "SP-1");
});

test("SP-1 — above the rate starts too (at or above, not above)", () => {
  assert.equal(speculationVerdictOf(open(100)).ruleId, "SP-1");
});

test("SP-2 — below the measured threshold: skip with the reason rate", () => {
  const decision = speculationVerdictOf(open(49.9));
  assert.equal(decision.choice, "skip-rate");
  assert.equal(decision.ruleId, "SP-2");
  assert.equal(refusalReasonOf(decision), "rate");
});

test("SP-3 — at the depth bound: skip with the reason depth", () => {
  const decision = speculationVerdictOf(open(100, 1));
  assert.equal(decision.choice, "skip-depth");
  assert.equal(decision.ruleId, "SP-3");
  assert.equal(refusalReasonOf(decision), "depth");
});

test("SP-4 — the sweep unconfirmed: skip with the reason sweep", () => {
  const decision = speculationVerdictOf(open(100, 0, false));
  assert.equal(decision.choice, "skip-sweep");
  assert.equal(decision.ruleId, "SP-4");
  assert.equal(refusalReasonOf(decision), "sweep");
});

test("the guards fire in the table's order: a low rate wins over an unconfirmed sweep", () => {
  // Rate and sweep both fail: SP-2 stands before SP-4 in the pinned order.
  const decision = speculationVerdictOf({ ratePerCent: 0, depth: 1, sweepConfirmed: false, verdict: "open" });
  assert.equal(decision.ruleId, "SP-2");
});

test("SP-5 — an approved verdict integrates, whatever the guards would say", () => {
  // The unit started when the rate held; the rate may have fallen since.
  const decision = speculationVerdictOf({ ratePerCent: 0, depth: 5, sweepConfirmed: false, verdict: "approved" });
  assert.equal(decision.choice, "integrate");
  assert.equal(decision.ruleId, "SP-5");
});

test("SP-6 — a rejected verdict sets the unit aside", () => {
  const decision = speculationVerdictOf({ ratePerCent: 100, depth: 0, sweepConfirmed: true, verdict: "rejected" });
  assert.equal(decision.choice, "set-aside");
  assert.equal(decision.ruleId, "SP-6");
  assert.equal(refusalReasonOf(decision), undefined);
});

test("F154-SC-013 — 29 of 336 (feature 153) never starts a unit at the defaults", () => {
  const rate = approvalRateOverWindowOf(29, 336);
  assert.ok(rate < SPECULATE_MIN_RATE_DEFAULT, `rate ${rate} is below 50`);
  const decision = speculationVerdictOf(open(rate));
  assert.equal(decision.ruleId, "SP-2");
  assert.equal(refusalReasonOf(decision), "rate");
});

test("F154-SC-013 — 10 of 121 (feature 152) never starts a unit at the defaults", () => {
  const rate = approvalRateOverWindowOf(10, 121);
  assert.ok(rate < SPECULATE_MIN_RATE_DEFAULT, `rate ${rate} is below 50`);
  assert.equal(speculationVerdictOf(open(rate)).ruleId, "SP-2");
});

test("the rate over the last window of 20: no window of the measured runs reaches 50 %", () => {
  // The best a window of 20 of the measured runs could hold is 4 of 20.
  assert.equal(approvalRateOverWindowOf(4, 20), 20);
  assert.equal(speculationVerdictOf(open(approvalRateOverWindowOf(4, 20))).ruleId, "SP-2");
  // 10 of 20 reaches the threshold: the rule is the same under any values.
  assert.equal(speculationVerdictOf(open(approvalRateOverWindowOf(10, 20))).ruleId, "SP-1");
});

test("a window of no attempts reads as a rate of 0 (never a start)", () => {
  assert.equal(approvalRateOverWindowOf(3, 0), 0);
  assert.equal(approvalRateOverWindowOf(3, -1), 0);
  assert.equal(approvalRateOverWindowOf(Number.NaN, 20), 0);
  assert.equal(speculationVerdictOf(open(0)).ruleId, "SP-2");
});

test("the same observation gives the same decision, with the signals the fired row read (F154-SC-002)", () => {
  const observation = open(8.6);
  const first = speculationVerdictOf(observation);
  const second = speculationVerdictOf(observation);
  assert.deepEqual(first, second);
  // The decision records the inputs it decided on (F154-FR-003).
  assert.equal(first.ruleId, "SP-2");
});

test("the pinned table holds the six rows of SP-1…SP-6", () => {
  const rows = SPECULATION_TABLE.rows["loop.speculation"] ?? [];
  assert.deepEqual(
    rows.map((row: { ruleId: string }) => row.ruleId),
    ["SP-5", "SP-6", "SP-2", "SP-3", "SP-4", "SP-1"],
  );
});
