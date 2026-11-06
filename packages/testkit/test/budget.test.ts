/**
 * T193 — contract tests CT-100-287 for the token budgets of host-facing output
 * (annex G, §G.5; F100-FR-187), over the key `budgets` of
 * `data/cli-protocol.json`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import cliProtocol from "@specstride/contracts/data/cli-protocol.json" with { type: "json" };
import {
  ANNEX_SECTION,
  BYTES_PER_TOKEN,
  DATA_KEY,
  MEASURE_ROW,
  SUBJECTS,
  UNCHANGED_CYCLE_TOKENS,
  WHOLE_RUN_BUDGET_HOLDS_WITH,
  assertInsideBudget,
  budgetRow,
  budgetRows,
  byteBudget,
  bytesOf,
  loadBudgets,
  measure,
  tokenBudget,
  wholeRunBudgetIsPromised,
} from "../src/static/budget.ts";

test("CT-100-287: the seven rows of §G.5 and the byte measure of the build", () => {
  assert.equal(ANNEX_SECTION, "annex G, §G.5");
  assert.equal(DATA_KEY, "budgets");
  const raw = (cliProtocol as { budgets: unknown[] }).budgets;
  assert.equal(budgetRows.length, raw.length);
  assert.equal(budgetRows.length, 7, "six budgets and the row of the measure");
  assert.deepEqual(loadBudgets(), budgetRows);

  // The measure in the build: bytes, at 2.8 bytes per token.
  assert.equal(BYTES_PER_TOKEN, 2.8);
  assert.equal(MEASURE_ROW, "Measure in the build");
  const measureRow = budgetRow(MEASURE_ROW);
  assert.notEqual(measureRow, undefined);
  assert.equal(measureRow?.tokens, null, "the row of the measure carries no budget");
  assert.match(measureRow?.cell ?? "", /2\.8 bytes per token/);
  assert.equal(bytesOf(1000), 2800);
  assert.equal(bytesOf(3000), 8400);
});

test("CT-100-287: the six budgets of §G.5, in tokens and in bytes", () => {
  const expected: readonly (readonly [string, number])[] = [
    [SUBJECTS.hostSkillRun, 8000],
    [SUBJECTS.hostSkillReverse, 7000],
    [SUBJECTS.doctorSkill, 1500],
    [SUBJECTS.supervisionCycle, 150],
    [SUBJECTS.supervisionOfAWholeRun, 3000],
    [SUBJECTS.judgmentBatch, 3000],
  ];
  for (const [subject, tokens] of expected) {
    assert.equal(tokenBudget(subject), tokens, subject);
    assert.equal(byteBudget(subject), bytesOf(tokens), subject);
  }
  // An unchanged supervision cycle costs 0 tokens.
  assert.equal(budgetRow(SUBJECTS.supervisionCycle)?.unchangedTokens, 0);
  assert.equal(UNCHANGED_CYCLE_TOKENS, 0);
  // Every row of the table states its subject and its cell.
  for (const row of budgetRows) {
    assert.notEqual(row.subject, "");
    assert.notEqual(row.cell, "");
  }
});

test("CT-100-287: the helper measures bytes and fails on a breach (F100-FR-187)", () => {
  const allowed = byteBudget(SUBJECTS.doctorSkill) ?? 0;
  assert.equal(allowed, 4200);

  // Inside the budget: the measurement passes.
  const inside = measure(SUBJECTS.doctorSkill, "x".repeat(allowed));
  assert.equal(inside.inside, true);
  assert.equal(inside.bytes, allowed);
  assert.equal(inside.allowed, allowed);
  assert.equal(inside.message, undefined);
  assert.doesNotThrow(() => assertInsideBudget(SUBJECTS.doctorSkill, "x".repeat(allowed)));

  // One byte over: the measurement fails, with a message that names the budget.
  const over = measure(SUBJECTS.doctorSkill, "x".repeat(allowed + 1));
  assert.equal(over.inside, false);
  assert.match(String(over.message), /1500 tokens/);
  assert.match(String(over.message), /4200 bytes/);
  assert.match(String(over.message), /F100-FR-187/);
  assert.throws(
    () => assertInsideBudget(SUBJECTS.doctorSkill, "x".repeat(allowed + 1)),
    /F100-FR-187/,
  );

  // The measure is BYTES of UTF-8, not characters: a multi-byte character
  // counts for what it costs.
  const multi = "é".repeat(allowed);
  assert.equal(Buffer.byteLength(multi, "utf8"), allowed * 2);
  assert.equal(measure(SUBJECTS.doctorSkill, multi).inside, false);

  // A subject annex G §G.5 does not hold is an error, and the message names the
  // subjects it does hold.
  assert.throws(() => measure("A subject the annex does not hold", ""), /annex G §G.5/);
  assert.throws(() => measure(MEASURE_ROW, ""), /holds no budget/);
});

test("CT-100-287: the budget of a whole run holds with `relaunch.owner: root`", () => {
  assert.deepEqual([...WHOLE_RUN_BUDGET_HOLDS_WITH], ["root"]);
  assert.equal(wholeRunBudgetIsPromised("root"), true);
  assert.equal(
    wholeRunBudgetIsPromised("supervise"),
    false,
    "with `supervise` the host watches for the whole run and the budget is not promised",
  );
});
