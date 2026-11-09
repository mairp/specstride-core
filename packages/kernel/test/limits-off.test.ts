/**
 * SPECSTRIDE_LIMITS=off lifts every time and count limit of a run (the
 * owner's ruling of 2026-11-09); absent, every limit holds as before.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { countLimit, limitsAreOff, timeLimitMs } from "../src/limits/index.ts";

test("off lifts the limits; absent or another value keeps them", () => {
  assert.equal(limitsAreOff({ SPECSTRIDE_LIMITS: "off" }), true);
  assert.equal(limitsAreOff({ SPECSTRIDE_LIMITS: " OFF " }), true);
  assert.equal(limitsAreOff({}), false);
  assert.equal(limitsAreOff({ SPECSTRIDE_LIMITS: "on" }), false);
});

test("a count limit is unbounded and a time limit has no timer when off", () => {
  const off = { SPECSTRIDE_LIMITS: "off" };
  assert.equal(countLimit(3, off), Number.MAX_SAFE_INTEGER);
  assert.equal(countLimit(3, {}), 3);
  assert.equal(timeLimitMs(300_000, off), undefined);
  assert.equal(timeLimitMs(300_000, {}), 300_000);
});
