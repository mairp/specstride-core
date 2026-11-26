/**
 * T059 — THE NO-REPEAT VERDICT AT THE LAYER (F154-FR-026; rules RP-1, RP-2).
 *
 * `repeatVerdictOf` over `REPEAT_TABLE`: a group whose task set failed in an
 * earlier attempt of the same phase is refused with the check `repeat` while
 * the fingerprint of its named paths is unchanged (RP-1), and admitted once a
 * named path changed or where no earlier failure of the group stands (RP-2).
 * The fingerprint comparison is the seam `fingerprintOfNamedPaths`, stubbed
 * here — the layer holds no tree store.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { REPEAT_TABLE } from "../src/tables.ts";
import { REPEAT_RULE_IDS, repeatVerdictOf } from "../src/repeat.ts";
import type { PlannedGroup } from "../src/types.ts";

/** The group of the 153 replay case: g-23-1, phase 23, ordinal 1. */
function groupOfPhase23(): PlannedGroup {
  return { ordinal: 1, phase: 23, tasks: ["T-23-a", "T-23-b"] };
}

/** The earlier failure the ledger of 153 holds for that group. */
function earlierFailure(): { groupId: string; phase: number; tasks: readonly string[] } {
  return { groupId: "g-23-1", phase: 23, tasks: ["T-23-a", "T-23-b"] };
}

test("the repeat table is the rule source the verdict reads", () => {
  assert.equal(REPEAT_TABLE.id, "parallel.no-repeat");
  const rows = REPEAT_TABLE.rows["parallel.no-repeat"] ?? [];
  assert.deepEqual(
    rows.map((row) => row.ruleId),
    [...REPEAT_RULE_IDS],
  );
  assert.equal(rows[0]?.choice, "refuse");
  assert.equal(rows[1]?.choice, "admit");
});

test("RP-1 — refused with the check repeat while the fingerprint is unchanged", () => {
  const group = groupOfPhase23();
  const verdict = repeatVerdictOf(
    group,
    [earlierFailure()],
    // The stub: the named paths' fingerprint is unchanged against the
    // earlier failed attempt's base.
    () => true,
  );
  assert.deepEqual(
    { check: verdict.check, passed: verdict.passed, ruleId: verdict.ruleId },
    { check: "repeat", passed: false, ruleId: "RP-1" },
  );
  assert.match(verdict.detail, /unchanged/);
  assert.match(verdict.detail, /RP-1/);
});

test("RP-2 — admitted once a named path changed against the earlier attempt", () => {
  const group = groupOfPhase23();
  const verdict = repeatVerdictOf(
    group,
    [earlierFailure()],
    // The stub: a named path changed since the earlier attempt's base.
    () => false,
  );
  assert.deepEqual(
    { check: verdict.check, passed: verdict.passed, ruleId: verdict.ruleId },
    { check: "repeat", passed: true, ruleId: "RP-2" },
  );
  assert.match(verdict.detail, /changed/);
});

test("RP-2 — admitted where no earlier failure of the group stands", () => {
  const verdict = repeatVerdictOf(
    groupOfPhase23(),
    [], // No earlier failure of the phase on the ledger.
    () => true,
  );
  assert.deepEqual(
    { check: verdict.check, passed: verdict.passed, ruleId: verdict.ruleId },
    { check: "repeat", passed: true, ruleId: "RP-2" },
  );
  assert.match(verdict.detail, /no earlier failure/);
});

test("an earlier failure of another phase never refuses this group", () => {
  const verdict = repeatVerdictOf(
    groupOfPhase23(),
    [{ groupId: "g-21-1", phase: 21, tasks: ["T-23-a", "T-23-b"] }],
    () => true,
  );
  assert.equal(verdict.passed, true);
  assert.equal(verdict.ruleId, "RP-2");
});

test("an earlier failure of another task set never refuses this group", () => {
  const verdict = repeatVerdictOf(
    groupOfPhase23(),
    [{ groupId: "g-23-2", phase: 23, tasks: ["T-23-c"] }],
    () => true,
  );
  assert.equal(verdict.passed, true);
  assert.equal(verdict.ruleId, "RP-2");
});

test("the verdict matches the group by its id where the record names no tasks", () => {
  const verdict = repeatVerdictOf(
    groupOfPhase23(),
    [{ groupId: "g-23-1", phase: 23 }],
    () => true,
  );
  assert.equal(verdict.passed, false);
  assert.equal(verdict.ruleId, "RP-1");
});

test("the verdict is pure: the same inputs give the same verdict", () => {
  const one = repeatVerdictOf(groupOfPhase23(), [earlierFailure()], () => true);
  const two = repeatVerdictOf(groupOfPhase23(), [earlierFailure()], () => true);
  assert.deepEqual(one, two);
});
