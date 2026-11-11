/**
 * SPECSTRIDE_LIMITS=off keeps the no-progress breaker: the switch lifts time
 * ceilings and cap breakers, not the only defense against a pass that
 * produces nothing. 152 phase 1, 2026-11-11: with the switch off, every pass
 * was cut by an external backend wall at exactly 45 minutes, produced no
 * evidence and changed no file, and the loop retried the doomed pass twelve
 * times because `maxNoProgress` was wired to 0 (disabled) under the switch.
 * The wiring now keeps `MAX_NO_PROGRESS_DEFAULT` (3) — a productive campaign
 * never trips it; a doomed one halts with the result-8 detail.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { MAX_NO_PROGRESS_DEFAULT } from "../../../core/src/pass-loop/accounting.ts";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "..", "..", "src", "engine", "run-feature.ts"), "utf8");

test("under SPECSTRIDE_LIMITS=off the no-progress breaker stays at its default", () => {
  // The limits-off arm of the wiring keeps the no-progress breaker instead
  // of disabling it: the switch must not leave a run that cannot stop when
  // every pass produces nothing.
  const arm = source.slice(source.indexOf("limitsAreOff()"));
  const armEnd = arm.indexOf(": DEFAULT_LIMITS");
  const offArm = arm.slice(0, armEnd);
  assert.match(
    offArm,
    /maxNoProgress:\s*MAX_NO_PROGRESS_DEFAULT/,
    "the limits-off arm must keep maxNoProgress at MAX_NO_PROGRESS_DEFAULT",
  );
  assert.doesNotMatch(
    offArm,
    /maxNoProgress:\s*0\b/,
    "the limits-off arm must not disable the no-progress breaker",
  );
  assert.equal(MAX_NO_PROGRESS_DEFAULT, 3);
});
