/**
 * T070 of feature 154, phase 8 — the second worker door at the layer
 * (F154-FR-029, F154-FR-030; F154-SC-014 stands in the adapter's own test).
 *
 * `concurrentSessionsOf` refuses a group to an adapter whose registry entry
 * carries `concurrentSessions` but no `testedUnder` fact naming the three
 * proofs of F154-FR-030 (the fake-binary test, the recorded live check, the
 * pin): the capability is then untested for concurrent sessions, the layer
 * is off for the run with the reason `harness`, and a fallback is never an
 * error. The guard test holds the other side of F142-FR-020: an adapter in
 * state `declared` that declares no concurrency capability at all — the
 * shape of the other engine path today — never runs a group, and no rule
 * names a harness.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  CONCURRENT_SESSIONS_PROOFS,
  concurrentSessionsOf,
  evaluatePreconditions,
  harnessReading,
} from "../src/preconditions.ts";

/** The dsh-shaped entry: tested, three sessions, all three proofs recorded. */
function entryWithTheProofs() {
  return {
    state: "tested",
    concurrentSessions: { value: 3, provenance: "adapter" },
    containmentCeiling: "C2",
    spendLimitDeclared: false,
    testedUnder: ["fake-binary", "live-check", "pin"],
  } as const;
}

/** The same entry with the value but NO `testedUnder` fact. */
function entryWithoutTheProofs() {
  return {
    state: "tested",
    concurrentSessions: { value: 3, provenance: "adapter" },
    containmentCeiling: "C2",
    spendLimitDeclared: false,
  } as const;
}

test("the three proofs of F154-FR-030 are the closed list the fact is read against", () => {
  assert.deepEqual([...CONCURRENT_SESSIONS_PROOFS], ["fake-binary", "live-check", "pin"]);
});

test("a tested adapter with the testedUnder fact declares concurrent sessions", () => {
  const reading = concurrentSessionsOf(entryWithTheProofs());
  assert.equal(reading.declared, true);
  assert.equal(reading.value, 3);
  assert.match(reading.detail, /F154-FR-030/);
  assert.equal(harnessReading(entryWithTheProofs()).mayRunAGroup, true);
});

test("a tested adapter without the testedUnder fact is refused with `harness` (F154-FR-029)", () => {
  const reading = concurrentSessionsOf(entryWithoutTheProofs());
  assert.equal(reading.declared, false);
  assert.match(reading.detail, /testedUnder/);
  assert.match(reading.detail, /fake-binary/);
  const verdict = harnessReading(entryWithoutTheProofs());
  assert.equal(verdict.mayRunAGroup, false);
  const outcome = evaluatePreconditions({
    loopStrategy: "micro",
    gateExecutes: true,
    insideAGitWorkTree: true,
    submodules: false,
    gitVersion: { major: 2, minor: 47 },
    harness: entryWithoutTheProofs(),
    containment: "C2",
    groupsInThePlan: 2,
  });
  assert.equal(outcome.reason, "harness");
  assert.equal(outcome.on, false);
  assert.equal(outcome.isAnError, false, "a fallback is never an error (F154-FR-004)");
});

test("a partial fact is refused: every one of the three proofs is needed", () => {
  const reading = concurrentSessionsOf({
    ...entryWithTheProofs(),
    testedUnder: ["fake-binary", "pin"],
  });
  assert.equal(reading.declared, false);
  assert.match(reading.detail, /missing from `testedUnder`: live-check/);
});

test("guard: an adapter in state `declared` with no concurrency capability runs no group (F142-FR-020)", () => {
  // The shape `parallelEntryOfTheRun` builds for the engine path whose
  // adapter declares `concurrentSessions: null` until its capture B.
  const claudeShaped = { state: "declared" } as const;
  const reading = concurrentSessionsOf(claudeShaped);
  assert.equal(reading.declared, false);
  const verdict = harnessReading(claudeShaped);
  assert.equal(verdict.mayRunAGroup, false);
  assert.equal(verdict.state, "declared");
  assert.match(verdict.detail, /declared/);
  const outcome = evaluatePreconditions({
    loopStrategy: "micro",
    gateExecutes: true,
    insideAGitWorkTree: true,
    submodules: false,
    gitVersion: { major: 2, minor: 47 },
    harness: claudeShaped,
    containment: "C1",
    groupsInThePlan: 2,
  });
  assert.equal(outcome.reason, "harness");
});

test("no rule of the layer names a harness: the reading carries the state, never a name", () => {
  const verdict = harnessReading(entryWithoutTheProofs());
  assert.doesNotMatch(verdict.detail, /dsh|claude/i);
  assert.doesNotMatch(concurrentSessionsOf(entryWithoutTheProofs()).detail, /dsh|claude/i);
});
