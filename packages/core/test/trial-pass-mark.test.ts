/**
 * T014 (trial, unnumbered task) — the pass mark of a trial (F154-FR-018,
 * -019; CQ-154-15 A), over `TRIAL_PASS_MARK_TABLE`
 * (`src/trial/tables.ts`): TRI-1…TRI-3 each fail the trial alone; only all
 * three holding passes it. The failing rule id is named.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { TRIAL_PASS_MARK_TABLE } from "../src/trial/tables.ts";
import { passMarkOf } from "../src/trial/pass-mark.ts";

const SIGNALS = ["noBreachInvariantFails", "everyRuleTestPasses", "closedSetsAreSubsets"] as const;

type Signals = Record<(typeof SIGNALS)[number], boolean>;

test("TRI-pass exists in the table beside TRI-1…TRI-3", () => {
  const rows = Object.values((TRIAL_PASS_MARK_TABLE as any).rows as Record<string, any[]>).flat();
  const ids = rows.map((row) => row.ruleId);
  assert.deepEqual(ids, ["TRI-1", "TRI-2", "TRI-3", "TRI-pass"]);
});

for (const failing of SIGNALS) {
  test(`TRI: ${failing} false fails the trial alone, naming the rule`, () => {
    const signals = Object.fromEntries(SIGNALS.map((signal) => [signal, true])) as Signals;
    signals[failing] = false;
    const mark = passMarkOf(signals);
    assert.equal(mark.choice, "fail");
    assert.equal(
      mark.ruleId,
      failing === "noBreachInvariantFails"
        ? "TRI-1"
        : failing === "everyRuleTestPasses"
          ? "TRI-2"
          : "TRI-3",
    );
  });
}

test("all three hold: the trial passes (TRI-pass)", () => {
  const mark = passMarkOf({
    noBreachInvariantFails: true,
    everyRuleTestPasses: true,
    closedSetsAreSubsets: true,
  });
  assert.equal(mark.choice, "pass");
  assert.equal(mark.ruleId, "TRI-pass");
});
