/**
 * Feature 153, T064 — the red-gate notice is OPTIONAL at the phase gate.
 *
 * The gate-failed branch of `runPhaseGate` writes the notice the ENGINE hands
 * in through `feedbackOfAFailedGate` where the engine hands it in, and
 * feature 101's own text from `feedbackOfTheVerificationGate` — byte for
 * byte, unchanged — where it does not. The port is a choice of the
 * composition root; nothing else about the gate-failed path moves.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { runPhaseGate, type PhaseGateDependencies } from "../src/gate/phase-gate.ts";
import { feedbackOfTheVerificationGate } from "../src/gate/feedback.ts";

const INPUTS = {
  phase: 1,
  ordinal: 1,
  passLoopHasEnded: true,
  phaseEvidenceExists: true,
  mode: "required" as const,
  criticCallInputs: {} as never, // never used: the critic is not called on this path
};

const FAILED = {
  exit_code: 10,
  mode: "required" as const,
  roster: [{ name: "npm test", status: "failed" }],
  hash: "deadbeef",
};

function depsWithout(): PhaseGateDependencies {
  return {
    runVerificationGate: async () => FAILED,
    callTheCritic: async () => {
      throw new Error("the critic must not be called");
    },
    writeFeedback: () => {},
  };
}

test("without the port the gate-failed text is today's, byte for byte", async () => {
  const written: string[] = [];
  const outcome = await runPhaseGate(INPUTS, {
    ...depsWithout(),
    writeFeedback: (text: string) => written.push(text),
  });
  assert.equal(outcome.outcome, "gate-failed");
  assert.equal(outcome.criticWasCalled, false);
  assert.deepEqual(written, [
    feedbackOfTheVerificationGate({ phase: 1, mode: "required", roster: FAILED.roster }),
  ]);
  assert.equal(outcome.feedbackWrittenByTheEngine, written[0]);
});

test("with the port the gate writes the engine's notice", async () => {
  const written: string[] = [];
  const outcome = await runPhaseGate(INPUTS, {
    ...depsWithout(),
    writeFeedback: (text: string) => written.push(text),
    feedbackOfAFailedGate: (verification) =>
      `# Phase 1 deterministic verification gate rejected\n${verification.hash}\n`,
  });
  assert.equal(outcome.outcome, "gate-failed");
  assert.equal(outcome.criticWasCalled, false);
  assert.deepEqual(written, [
    `# Phase 1 deterministic verification gate rejected\n${FAILED.hash}\n`,
  ]);
  assert.equal(outcome.feedbackWrittenByTheEngine, written[0]);
});
