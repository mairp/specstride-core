/**
 * T054 — THE HALVING (F142-FR-019, F154-FR-022).
 *
 * After a group of the phase attempt ended with two rate limits classified as
 * transient, the worker count falls — to no less than 1 — and stays there for
 * the rest of the attempt: each further such group halves the count once more.
 * Fewer than two transient limits in a group leave the count as it was.
 *
 * What the test covers:
 * - `halvedAfterTransientRateLimits` (`plan.ts:189`), the halving of one
 *   group's end;
 * - `workersForTheRestOfTheAttempt` (`plan.ts:202`), the count the wiring
 *   reads BEFORE EACH GROUP of the attempt (T055,
 *   `parallel-wiring.ts` `startIfTheBoundaryIsClean`);
 * - `aGroupMayStartAt`, the floor the count never crosses;
 * - the constants the rule is fixed by (`TRANSIENT_RATE_LIMITS_THAT_HALVE`
 *   = 2, `WORKERS_LEAST_AFTER_HALVING` = 1).
 *
 * No test calls a model (XII): every input is a number.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  halvedAfterTransientRateLimits,
  workersForTheRestOfTheAttempt,
  aGroupMayStartAt,
  TRANSIENT_RATE_LIMITS_THAT_HALVE,
  WORKERS_LEAST_AFTER_HALVING,
} from "../src/plan.ts";

test("the constants the halving is fixed by (F142-FR-019)", () => {
  assert.equal(TRANSIENT_RATE_LIMITS_THAT_HALVE, 2);
  assert.equal(WORKERS_LEAST_AFTER_HALVING, 1);
});

test("two transient rate limits in one group halve the worker count", () => {
  assert.equal(halvedAfterTransientRateLimits(4, 2), 2);
  assert.equal(halvedAfterTransientRateLimits(3, 2), 1);
  assert.equal(halvedAfterTransientRateLimits(8, 2), 4);
});

test("the count never falls below one, whatever it was", () => {
  assert.equal(halvedAfterTransientRateLimits(2, 2), 1);
  assert.equal(halvedAfterTransientRateLimits(1, 2), 1);
});

test("fewer than two transient rate limits leave the count as it was", () => {
  assert.equal(halvedAfterTransientRateLimits(4, 0), 4);
  assert.equal(halvedAfterTransientRateLimits(4, 1), 4);
});

test("each group that ended with two transient limits halves once more, for the rest of the attempt", () => {
  // No such group yet: the count the attempt started with stands.
  assert.equal(workersForTheRestOfTheAttempt(4, 0), 4);
  // One group ended with two transient limits: 4 -> 2.
  assert.equal(workersForTheRestOfTheAttempt(4, 1), 2);
  // Two such groups: 4 -> 2 -> 1.
  assert.equal(workersForTheRestOfTheAttempt(4, 2), 1);
  // Three such groups: the floor holds at 1, it never crosses it.
  assert.equal(workersForTheRestOfTheAttempt(4, 3), 1);
});

test("a group may start while the count is above the floor, and not at it", () => {
  assert.equal(aGroupMayStartAt(2), true);
  assert.equal(aGroupMayStartAt(1), false);
});
