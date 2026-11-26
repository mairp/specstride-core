/**
 * T064 — THE MERGE BASELINE COMPARISON (F154-FR-028; rules MG-1…MG-3;
 * F115-FR-019).
 *
 * `baselineComparisonOf(mergeCheckResult, baseResult)` over
 * `MERGE_CHECK_OUTCOME_TABLE`: MG-1 on an empty application, MG-2 where every
 * failing command failed on the base result with the same failure signature
 * (the ordered ids and exit codes), MG-3 otherwise.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { MERGE_CHECK_OUTCOME_TABLE } from "../../layer-parallel/src/tables.ts";
import {
  MERGE_BASELINE_RECORD,
  MERGE_BASELINE_TABLE_ID,
  baselineComparisonOf,
} from "../src/parallel/merge-baseline.ts";
import type {
  BaseResultOfTheInnerSet,
  MergeCheckResultForBaseline,
} from "../src/parallel/merge-baseline.ts";

/** A merge check that failed on two commands. */
function failedResult(): MergeCheckResultForBaseline {
  return {
    appliedPathCount: 2,
    mergeCheckFailed: true,
    commands: [
      { id: "lint", exitCode: 1 },
      { id: "tests", exitCode: 2 },
    ],
  };
}

/** The base result the commands were already red on, same signatures. */
function baseWithSameSignatures(): BaseResultOfTheInnerSet {
  return {
    commands: [
      { id: "lint", exitCode: 1 },
      { id: "tests", exitCode: 2 },
    ],
  };
}

test("the outcome table is the rule source the comparison reads", () => {
  assert.equal(MERGE_CHECK_OUTCOME_TABLE.id, "parallel.merge-check-outcome");
  assert.equal(MERGE_BASELINE_TABLE_ID, "parallel.merge-check-outcome");
  const rows = MERGE_CHECK_OUTCOME_TABLE.rows["parallel.merge-check-outcome"] ?? [];
  assert.deepEqual(
    rows.map((row) => row.ruleId),
    ["MG-1", "MG-2", "MG-3"],
  );
  assert.deepEqual(
    rows.map((row) => row.choice),
    ["no-check", "no-charge", "f142-fr-061"],
  );
});

test("MG-1 — an application of 0 paths is no check", () => {
  const comparison = baselineComparisonOf(
    { appliedPathCount: 0, mergeCheckFailed: false, commands: [] },
    baseWithSameSignatures(),
  );
  assert.deepEqual(
    { ruleId: comparison.ruleId, choice: comparison.choice },
    { ruleId: "MG-1", choice: "no-check" },
  );
  assert.match(comparison.detail, /0 paths/);
  assert.match(comparison.detail, /MG-1/);
});

test("MG-2 — every failing command failed on the base with the same signature", () => {
  const comparison = baselineComparisonOf(failedResult(), baseWithSameSignatures());
  assert.deepEqual(
    { ruleId: comparison.ruleId, choice: comparison.choice },
    { ruleId: "MG-2", choice: "no-charge" },
  );
  assert.match(comparison.detail, /MG-2/);
  assert.match(comparison.detail, /same failure signature/);
});

test("MG-3 — a failing command the base does not explain is a new failure", () => {
  const base: BaseResultOfTheInnerSet = {
    commands: [{ id: "lint", exitCode: 1 }],
  };
  // `tests` failed with an exit code the base never saw: the signature differs.
  const comparison = baselineComparisonOf(failedResult(), base);
  assert.deepEqual(
    { ruleId: comparison.ruleId, choice: comparison.choice },
    { ruleId: "MG-3", choice: "f142-fr-061" },
  );
  assert.match(comparison.detail, /MG-3/);
});

test("MG-3 — a failing command that did not fail on the base at all", () => {
  const base: BaseResultOfTheInnerSet = {
    commands: [
      { id: "lint", exitCode: 1 },
      { id: "types", exitCode: 3 },
    ],
  };
  const comparison = baselineComparisonOf(failedResult(), base);
  assert.equal(comparison.ruleId, "MG-3");
});

test("MG-3 — a base result that does not exist leaves F142-FR-061 unchanged", () => {
  const comparison = baselineComparisonOf(failedResult(), null);
  assert.deepEqual(
    { ruleId: comparison.ruleId, choice: comparison.choice },
    { ruleId: "MG-3", choice: "f142-fr-061" },
  );
});

test("MG-3 — a failure carried by a condition alone is no baseline match", () => {
  const comparison = baselineComparisonOf(
    { appliedPathCount: 2, mergeCheckFailed: true, commands: [{ id: "lint", exitCode: 0 }] },
    baseWithSameSignatures(),
  );
  assert.equal(comparison.ruleId, "MG-3");
});

test("a passing merge check never compares — MG-3 does not disturb a keep", () => {
  const comparison = baselineComparisonOf(
    { appliedPathCount: 2, mergeCheckFailed: false, commands: [{ id: "lint", exitCode: 0 }] },
    baseWithSameSignatures(),
  );
  assert.equal(comparison.ruleId, "MG-3");
  assert.equal(comparison.choice, "f142-fr-061");
});

test("the comparison names the record schema the engine writes", () => {
  assert.equal(MERGE_BASELINE_RECORD, "specstride.merge-baseline/1");
});

test("the comparison is pure: the same inputs give the same answer", () => {
  assert.deepEqual(
    baselineComparisonOf(failedResult(), baseWithSameSignatures()),
    baselineComparisonOf(failedResult(), baseWithSameSignatures()),
  );
});
