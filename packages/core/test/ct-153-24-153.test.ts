/**
 * CT-153-24 — the commit scan before the critic is one step of the phase
 * gate (feature 153, F153-FR-024, F153-FR-026; CQ-153-06 answered A on
 * 2026-11-13).
 *
 * The phase gate owns the ORDER: the optional `scanBeforeTheCritic` port is
 * asked AFTER a passed verification gate and BEFORE the critic call. Where
 * the port answers `blocked`, the gate returns `commit-blocked` — the kind
 * feature 152 already gave a blocked approval commit (F152-FR-001) — with
 * `criticWasCalled: false`: the candidate never reaches the critic
 * (F153-SC-003). Where the port answers clear, or is absent, the gate runs
 * as today, byte for byte.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  runPhaseGate,
  ORDER_AT_THE_PHASE_GATE,
  type PhaseGateDependencies,
} from "../src/gate/phase-gate.ts";
import type { CriticCallOutcomeOfTheEngine } from "../src/gate/critic-call.ts";

const PASSED = {
  exit_code: 0,
  mode: "required" as const,
  roster: [{ name: "npm test", status: "passed" }],
  hash: "cafebeef",
};

const APPROVED: CriticCallOutcomeOfTheEngine = {
  halted: false,
  judgment: {} as never,
  verdict: "APPROVED",
  result: { exit_code: 0 },
  invocation: {} as never,
  inputs: {} as never,
} as unknown as CriticCallOutcomeOfTheEngine;

/** A deps object that also counts critic calls, for the SC-003 assertions. */
function depsThatCount(
  overrides: Partial<PhaseGateDependencies> = {},
): PhaseGateDependencies & { criticCallCount: () => number } {
  let criticCalls = 0;
  const base: PhaseGateDependencies = {
    runVerificationGate: async () => PASSED,
    callTheCritic: async () => {
      criticCalls += 1;
      return APPROVED;
    },
    writeFeedback: () => {},
    ...overrides,
  };
  return Object.assign(base, { criticCallCount: () => criticCalls });
}

test("a blocking port returns commit-blocked and never calls the critic", async () => {
  const deps = depsThatCount({
    scanBeforeTheCritic: async () => ({ blocked: true }),
  });
  const outcome = await runPhaseGate(
    {
      phase: 1,
      ordinal: 1,
      passLoopHasEnded: true,
      phaseEvidenceExists: true,
      mode: "required",
      criticCallInputs: {} as never,
    },
    deps,
  );
  assert.equal(outcome.outcome, "commit-blocked");
  assert.equal(outcome.criticWasCalled, false);
  assert.equal(outcome.verdictExists, false);
  assert.equal(deps.criticCallCount(), 0);
  // The step is not a member of the FIXED order (F153-FR-024: the order at
  // the phase gate is unchanged); the record shows the gate stopped after
  // the verification gate.
  assert.deepEqual([...outcome.stepsRun], ORDER_AT_THE_PHASE_GATE.slice(0, 2));
  assert.equal(outcome.verification?.exit_code, 0);
});

test("a clear port lets the gate go on to the critic as today", async () => {
  const deps = depsThatCount({
    scanBeforeTheCritic: async () => ({ blocked: false }),
  });
  const outcome = await runPhaseGate(
    {
      phase: 1,
      ordinal: 1,
      passLoopHasEnded: true,
      phaseEvidenceExists: true,
      mode: "required",
      criticCallInputs: {} as never,
    },
    deps,
  );
  assert.equal(outcome.outcome, "approved");
  assert.equal(outcome.criticWasCalled, true);
  assert.equal(deps.criticCallCount(), 1);
  assert.deepEqual([...outcome.stepsRun], ORDER_AT_THE_PHASE_GATE);
});

test("without the port the gate runs exactly as today", async () => {
  const deps = depsThatCount();
  const outcome = await runPhaseGate(
    {
      phase: 1,
      ordinal: 1,
      passLoopHasEnded: true,
      phaseEvidenceExists: true,
      mode: "required",
      criticCallInputs: {} as never,
    },
    deps,
  );
  assert.equal(outcome.outcome, "approved");
  assert.equal(outcome.criticWasCalled, true);
  assert.equal(deps.criticCallCount(), 1);
  assert.deepEqual([...outcome.stepsRun], ORDER_AT_THE_PHASE_GATE);
});

test("in mode off the port is still asked before the critic", async () => {
  const deps = depsThatCount({
    scanBeforeTheCritic: async () => ({ blocked: true }),
  });
  const outcome = await runPhaseGate(
    {
      phase: 1,
      ordinal: 1,
      passLoopHasEnded: true,
      phaseEvidenceExists: true,
      mode: "off",
      criticCallInputs: {} as never,
    },
    deps,
  );
  assert.equal(outcome.outcome, "commit-blocked");
  assert.equal(outcome.criticWasCalled, false);
  assert.equal(deps.criticCallCount(), 0);
});
