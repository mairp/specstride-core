/**
 * CT-127-7 (T017) — the characterization test that a failure of NO QUOTA CLASS
 * still counts as a consecutive error, and still ends with engine exit 4 and
 * the stop reason `proposer_consecutive_errors` (F127-FR-005).
 *
 * Fixture: FX-18 (`consecutive-errors-legacy`, `consecutive-errors-structured`
 * of feature 141). No stub emits a quota signal in a fixture of a family
 * (F141-FR-043), so this test does what feature 141's refusal of T004 asks
 * for: it drives the as-is path with the classes that take it, and it reads
 * FX-18's own catalogue entry for the end state it compares against, so the
 * two cannot drift. The scenario itself is run by T081 under the `parity`
 * profile; here the rule is characterized at the level of the classifier and
 * the counter.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CLASSES } from "@specstride/contracts/ep/quota-classifier";
import { STOP_REASONS } from "@specstride/contracts/codes/stop-reasons";
import {
  AS_IS_ERROR_PATH,
  CLASSES_THAT_COUNT,
  CLASS_THAT_COUNTS_AFTER_ITS_CAP_ONLY,
  CLASSES_THAT_SPEND_NOTHING,
  THE_SIX_COUNTS,
  actionFor,
  applyToConsecutiveErrors,
  countsAsAConsecutiveError,
} from "../src/quota/actions.ts";
import { classify } from "../src/quota/classify.ts";
import { testPorts } from "./support/index.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const CATALOGUE = resolve(ROOT, "specs/141-parity-oracle/contracts/fixture-catalogue.json");

type Scenario = { name: string; endOnReference?: { stopReason?: string } };
type Family = { id: string; scenarios?: Scenario[] };

/** The family FX-18 of feature 141's catalogue, read fresh. */
function familyFX18(): Family {
  const data = JSON.parse(readFileSync(CATALOGUE, "utf8")) as { families: Family[] };
  const family = data.families.find((candidate) => candidate.id === "FX-18");
  assert.ok(family !== undefined, "the family FX-18 exists in feature 141's catalogue");
  return family as Family;
}

test("CT-127-7: FX-18's two scenarios end with `proposer_consecutive_errors`", () => {
  const family = familyFX18();
  const named = ["consecutive-errors-legacy", "consecutive-errors-structured"];
  for (const name of named) {
    const scenario = (family.scenarios ?? []).find((candidate) => candidate.name === name);
    assert.ok(scenario !== undefined, `FX-18 holds the scenario ${name}`);
    assert.equal(
      (scenario as Scenario).endOnReference?.stopReason?.replace(/`/g, ""),
      "proposer_consecutive_errors",
      `${name} ends with the as-is stop reason`,
    );
  }
});

test("CT-127-7: the as-is path is the pass loop's result 7, engine exit 4, `proposer_consecutive_errors`", () => {
  assert.equal(AS_IS_ERROR_PATH.passLoopResult, 7);
  assert.equal(AS_IS_ERROR_PATH.exitCode, 4);
  assert.equal(AS_IS_ERROR_PATH.stopReason, "proposer_consecutive_errors");
  assert.ok(
    (STOP_REASONS as readonly string[]).includes(AS_IS_ERROR_PATH.stopReason),
    "the stop reason is a member of the closed set of annex E §E.3",
  );
});

test("CT-127-7: a failure of no quota class counts as a consecutive error", () => {
  // The classes F127-FR-005 names, and `overload` after its cap.
  assert.deepEqual([...CLASSES_THAT_COUNT], ["agent_failure", "provider_other"]);
  assert.equal(CLASS_THAT_COUNTS_AFTER_ITS_CAP_ONLY, "overload");
  assert.equal(countsAsAConsecutiveError("agent_failure"), true);
  assert.equal(countsAsAConsecutiveError("provider_other"), true);
  assert.equal(countsAsAConsecutiveError("overload"), false, "not before its cap");
  assert.equal(countsAsAConsecutiveError("overload", true), true, "after its cap");
});

test("CT-127-7: an unclassifiable harness failure walks the counter to the as-is stop", () => {
  // The failure FX-18 drives: a pass that failed with nothing a classifier
  // can name. The classifier gives `provider_other`, which counts.
  const failure = classify({ exitCode: 1, errorText: "the harness exited 1 with no output" });
  assert.equal(failure.quotaClass, "provider_other", "the class of an input that matches nothing");

  const limit = 2; // FX-18 ends after two such passes
  let counter = 0;
  let counted = 0;
  for (let pass = 0; pass < limit; pass += 1) {
    const decision = actionFor(failure.quotaClass);
    assert.equal(decision.action, "error-path");
    const applied = applyToConsecutiveErrors(counter, decision);
    counter = applied.counter;
    if (applied.counted) counted += 1;
  }
  assert.equal(counter, limit, "each failure added one");
  assert.equal(counted, limit);

  // At the limit the as-is path is taken, unchanged by this feature.
  assert.equal(AS_IS_ERROR_PATH.passLoopResult, 7);
  assert.equal(AS_IS_ERROR_PATH.exitCode, 4);
  assert.equal(AS_IS_ERROR_PATH.stopReason, "proposer_consecutive_errors");
});

test("CT-127-7: a quota class never moves the counter", () => {
  const counter = 7;
  for (const quotaClass of CLASSES) {
    if (CLASSES_THAT_COUNT.includes(quotaClass)) continue;
    if (quotaClass === "overload") continue;
    const decision = actionFor(quotaClass);
    const applied = applyToConsecutiveErrors(counter, decision);
    assert.equal(applied.counter, 7, `${quotaClass} leaves the counter where it was`);
    assert.equal(applied.counted, false);
  }
  assert.equal(counter, 7, "and the caller's own figure is untouched");
});

test("CT-127-7: no quota class spends any of the six counts", () => {
  assert.deepEqual(
    [...THE_SIX_COUNTS],
    ["reject", "pass", "malformedCount", "errorCount", "wallClockBudget", "relaunchBudget"],
  );
  for (const quotaClass of CLASSES_THAT_SPEND_NOTHING) {
    const decision = actionFor(quotaClass);
    assert.equal(decision.spendsNothing, true, `${quotaClass} spends none of the six`);
  }
  // And the five classes of §Q.1 whose column reads "No" are exactly these.
  assert.deepEqual(
    [...CLASSES_THAT_SPEND_NOTHING],
    ["quota_window", "quota_credit", "rate_limit_transient", "auth"],
  );
});

test("CT-127-7: `overload` past its cap takes the as-is path, as §Q.1 says", () => {
  const past = actionFor("overload", { retries: 3 });
  assert.equal(past.quotaClass, "provider_other");
  assert.equal(past.action, "error-path");
  const applied = applyToConsecutiveErrors(0, past);
  assert.equal(applied.counter, 1, "it counts after the cap");
  assert.equal(past.retryable, true, "and the stop is retryable (annex E §E.3)");
});

test("CT-127-7 (checkpoint): the counting rule reads no clock and writes nothing", () => {
  const ports = testPorts();
  const before = ports.clock.nowMs();
  applyToConsecutiveErrors(0, actionFor("provider_other"));
  assert.equal(ports.clock.nowMs(), before);
  assert.deepEqual(ports.eventWriter.types(), []);
  assert.deepEqual(ports.fileWriter.writes, []);
});
