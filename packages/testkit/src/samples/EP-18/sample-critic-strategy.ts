/**
 * T029 of feature 149 — the SAMPLE CRITIC STRATEGY of the seam
 * `specstride.critic-strategy/1`, which makes TWO calls
 * (`specs/149-attempt-planner-and-seams/contracts/ep18-seams.md`, the row
 * "Strategy with two calls" of the conformance suite; F149-FR-010).
 *
 * Why a second sample beside `index.ts` of this directory: `index.ts` is
 * feature 100's T137 sample, written against feature 100's `CriticCall`, which
 * hands the strategy the HASH OF THE NONCE of every call. This seam forbids
 * that (`ep18-seams.md`, "The call function": "A strategy cannot make a call in
 * any other way and never sees a nonce"; research.md D3), and the guard
 * `isCriticCallOutcome` of `@specstride/contracts/ep/ep18-values` refuses an
 * outcome that carries `nonce` or `nonceHash`. So the sample of THIS seam is
 * written against the call function of the seam, and feature 100's sample is
 * left exactly as it is.
 *
 * What an author reads off this file: a strategy is a function of its input and
 * of the call function it is handed, and nothing else. It mints no nonce, opens
 * no session, reaches no harness, holds no state between calls, writes no
 * record and never approves on a MALFORMED reply. Everything else of a critic
 * call — the nonce, the fresh session, the tools, the proof of the form, the
 * parse of the reply — belongs to the engine's call function.
 */
import type { GateInput, Verdict } from "@specstride/contracts/ep/critic-strategy";
import { VERDICTS, VERDICT_WHEN_UNKNOWN } from "@specstride/contracts/ep/critic-strategy";
import type { CriticCallOutcome } from "@specstride/contracts/ep/ep18-values";
import type { Implementation } from "../../conformance/frame.ts";

/** The id the sample registers under at the point of the critic strategy. */
export const SAMPLE_CRITIC_STRATEGY_ID = "sample-two-calls" as const;

/** The id of the point this sample implements (`ep18-seams.md`). */
export const CRITIC_STRATEGY_POINT_ID = "specstride.critic-strategy/1" as const;

/** How many calls the sample makes per phase gate. Exactly two. */
export const CALLS_OF_THE_SAMPLE_STRATEGY = 2 as const;

/**
 * The call function of this seam, as the engine hands it to a strategy: one
 * demand for a verdict in, the outcome of one critic call out. No nonce and no
 * hash of a nonce is in either direction.
 */
export type SampleCriticCall = (demand: string) => Promise<CriticCallOutcome>;

/** What the sample returns from `judge`; the engine builds the record from it. */
export type SampleStrategyVerdict = {
  readonly verdict: Verdict;
  readonly unmetCriteria: readonly string[];
};

/**
 * The two demands the sample puts to the critic, both built from the input of
 * the phase gate alone. The first asks for the verdict; the second asks the
 * same question of the grounding snapshot on its own, which is what makes the
 * sample a two-call strategy rather than one call written twice.
 */
export function demandsOfTheSampleStrategy(input: GateInput): readonly string[] {
  return Object.freeze([
    `Judge the phase evidence \`${input.phaseEvidence.logicalName}\` against the criteria ` +
      `of the phase, from the grounding snapshot \`${input.groundingSnapshot.logicalName}\` alone.`,
    `Name every criterion of the phase that the grounding snapshot ` +
      `\`${input.groundingSnapshot.logicalName}\` does not support, and nothing else.`,
  ]);
}

/**
 * The verdict of the sample over the verdicts of its two calls:
 *
 *  - any call MALFORMED gives MALFORMED, so the strategy NEVER approves when a
 *    call was MALFORMED (`ep18-seams.md`, "Guarantees of a strategy");
 *  - both APPROVED gives APPROVED;
 *  - anything else gives REJECTED.
 *
 * A value outside the closed set of row 8 of annex X §X.6 is MALFORMED, which
 * is the unknown-value rule of the seam.
 */
export function verdictOfTheTwoCalls(verdicts: readonly string[]): Verdict {
  const known = verdicts.map((v) =>
    (VERDICTS as readonly string[]).includes(v) ? (v as Verdict) : VERDICT_WHEN_UNKNOWN,
  );
  if (known.length !== CALLS_OF_THE_SAMPLE_STRATEGY) return VERDICT_WHEN_UNKNOWN;
  if (known.includes("MALFORMED")) return VERDICT_WHEN_UNKNOWN;
  return known.every((v) => v === "APPROVED") ? "APPROVED" : "REJECTED";
}

/**
 * The sample critic strategy. It makes exactly two calls through the call
 * function it is handed, in order, and returns ONE verdict built from the two
 * outcomes. It holds no state outside its input: the two outcomes are local to
 * the call of `judge`.
 */
export const sampleCriticStrategy = Object.freeze({
  async judge(input: GateInput, call: SampleCriticCall): Promise<SampleStrategyVerdict> {
    const demands = demandsOfTheSampleStrategy(input);
    const outcomes: CriticCallOutcome[] = [];
    for (const demand of demands) {
      outcomes.push(await call(demand));
    }
    const verdict = verdictOfTheTwoCalls(outcomes.map((o) => o.verdict));
    return Object.freeze({
      verdict,
      unmetCriteria: Object.freeze(
        verdict === "APPROVED" ? [] : ["the criterion the sample strategy names"],
      ),
    });
  },
});

/**
 * The sample as the registry of the frame takes it (F100-FR-018): the class
 * `first-party`, the major 1, the rank `default`. The operation of this point
 * is `judge`; the operation `next` belongs to the other point of EP-18 and is
 * the sample planner's, in `sample-attempt-planner.ts`.
 */
export const implementation: Implementation = Object.freeze({
  ep: "EP-18",
  pointId: CRITIC_STRATEGY_POINT_ID,
  id: SAMPLE_CRITIC_STRATEGY_ID,
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations: Object.freeze({ judge: sampleCriticStrategy.judge }),
});
