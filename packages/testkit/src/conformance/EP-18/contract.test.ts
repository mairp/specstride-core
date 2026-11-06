/**
 * T136 — the conformance suite at contract level for EP-18, the critic
 * strategy and the attempt planner (annex E, §E.1): CT-100-238, CT-100-239,
 * CT-100-240.
 *
 * EP-18 is the one INTERNAL SEAM of the nineteen points (F100-FR-020): it is
 * versioned and tested in the same way, with this conformance suite and the
 * sample of T137, and carries no promise to implementers outside the
 * product's repository in Wave 1. Before the named cases the suite checks the
 * five things every suite at contract level checks (annex A, §A.4). The
 * behaviour belongs to feature 149, with 101 as its consumer; its behaviour
 * cases go in this folder beside this file.
 */
import assert from "node:assert/strict";
import {
  ATTEMPT_KINDS,
  ATTEMPT_KIND_WHEN_UNKNOWN,
  ATTEMPT_PLANNER_ID,
  BUMP_AND_ESCALATION_SHARE_A_COUNT,
  COUNTS_TOWARDS_K,
  CRITIC_CONFIG_EXIT_CODE,
  CRITIC_CONFIG_STOP_REASON,
  CRITIC_STRATEGY_ID,
  DIVERSITY_RESULTS_THAT_WARN,
  EVERYTHING_ELSE_IS,
  IS_AN_INTERNAL_SEAM,
  NONCE_BITS,
  NONCE_WRITTEN_BEFORE_THE_CALL_RETURNS,
  OPERATIONS,
  PLACES_THAT_HOLD_ONLY_THE_HASH,
  PLACES_THAT_MAY_HOLD_THE_NONCE_IN_CLEAR,
  POINT_IDS,
  PROMISE_OUTSIDE_THE_REPOSITORY_IN_WAVE_1,
  STANDING,
  THE_STRATEGY_WRITES_THE_APPROVAL_RECORD,
  TIER_BUMP_DEFAULT_ON,
  TRANSPORT_ERROR_IS_SCORED_AS,
  VERDICTS,
  VERDICT_IS_PARSED_AS,
  VERDICT_WHEN_UNKNOWN,
  WARNING_NAME,
} from "@specstride/contracts/ep/critic-strategy";
import { CALLS_PER_GATE, implementation, parseVerdict } from "../../samples/EP-18/index.ts";
import { registryOf } from "../frame.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-18" as const;

const gateInput = Object.freeze({
  phaseEvidence: Object.freeze({
    logicalName: "attempt:1:1:1:evidence",
    hash: "a".repeat(64),
    size: 10,
  }),
  groundingSnapshot: Object.freeze({
    logicalName: "attempt:1:1:1:grounding",
    hash: "b".repeat(64),
    size: 10,
  }),
  verificationResult: Object.freeze({ passed: true }),
  factBlock: Object.freeze([]),
  rolePlan: Object.freeze({}),
});

const history = Object.freeze({
  verdicts: Object.freeze(["REJECTED" as const]),
  unmetCriteriaSignatures: Object.freeze(["sig-1"]),
  countsFromTheLedger: Object.freeze({}),
  diagnosisWasMadeForTheNewestSignature: false,
  anAcceleratedPhaseAttemptIsDue: false,
});

/** A call function of the engine: one `completion` call with a nonce of its own. */
function engineCall(reply: string): (prompt: string) => Promise<{
  reply: string;
  proof: {
    tools: readonly string[];
    sessionId: string;
    sandboxMode: string | null;
    networkState: string | null;
  };
  nonceHash: string;
}> {
  let calls = 0;
  return (_prompt: string) => {
    calls += 1;
    return Promise.resolve({
      reply,
      proof: { tools: [], sessionId: `fresh-${calls}`, sandboxMode: "none", networkState: "off" },
      nonceHash: `hash-of-nonce-${calls}`,
    });
  };
}

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-238",
    title:
      "the engine judges every phase gate through `judge` and plans every phase attempt through `next`, and Wave 1 ships one critic (F100-FR-138)",
    level: "contract",
    proves: ["F100-FR-138"],
    async run(impl) {
      assert.deepEqual([...OPERATIONS], ["judge", "next"]);
      assert.deepEqual([...POINT_IDS], [CRITIC_STRATEGY_ID, ATTEMPT_PLANNER_ID]);
      assert.deepEqual([...VERDICTS], ["APPROVED", "REJECTED", "MALFORMED"]);
      assert.deepEqual([...ATTEMPT_KINDS], ["plain", "diagnosed", "accelerated", "bumped"]);
      const record = await (
        operationOf(impl, "judge") as (
          i: unknown,
          c: unknown,
        ) => Promise<{ verdict: string; nonceHash: string }>
      )(gateInput, engineCall("VERDICT: APPROVED"));
      assert.equal(record.verdict, "APPROVED");
      // The sample makes two calls; each is a fresh session of its own.
      assert.equal(record.nonceHash, `hash-of-nonce-${CALLS_PER_GATE}`);
      assert.equal(THE_STRATEGY_WRITES_THE_APPROVAL_RECORD, false);
      // A strategy never approves on a MALFORMED reply of any of its calls.
      const malformed = await (
        operationOf(impl, "judge") as (i: unknown, c: unknown) => Promise<{ verdict: string }>
      )(gateInput, engineCall("nothing that parses"));
      assert.equal(malformed.verdict, "MALFORMED");
      assert.equal(VERDICT_IS_PARSED_AS, "a full line, with exactly one match");
      assert.equal(EVERYTHING_ELSE_IS, "MALFORMED");
      assert.equal(parseVerdict("VERDICT: REJECTED"), "REJECTED");
      assert.equal(parseVerdict("VERDICT: APPROVED\nVERDICT: APPROVED"), VERDICT_WHEN_UNKNOWN);
      assert.equal(parseVerdict("the reply says VERDICT: APPROVED inline"), VERDICT_WHEN_UNKNOWN);
      const kind = (operationOf(impl, "next") as (h: unknown) => string)(history);
      assert.ok(ATTEMPT_KINDS.includes(kind as never));
      assert.equal(kind, "diagnosed");
      assert.equal(
        (operationOf(impl, "next") as (h: unknown) => string)({ ...history, verdicts: [] }),
        ATTEMPT_KIND_WHEN_UNKNOWN,
      );
      assert.equal(CRITIC_CONFIG_EXIT_CODE, 3);
      assert.equal(CRITIC_CONFIG_STOP_REASON, "critic_config");
      assert.equal(TRANSPORT_ERROR_IS_SCORED_AS, "MALFORMED");
    },
  },
  {
    id: "CT-100-239",
    title:
      "every critic call carries a nonce of 64 bits of its own, the nonce is never written before the call returns, and afterwards only its hash is recorded in events, spans, the ledger and the approval record (F100-FR-139)",
    level: "contract",
    proves: ["F100-FR-139"],
    async run(impl) {
      assert.equal(NONCE_BITS, 64);
      assert.equal(NONCE_WRITTEN_BEFORE_THE_CALL_RETURNS, false);
      assert.deepEqual(
        [...PLACES_THAT_HOLD_ONLY_THE_HASH],
        ["events", "spans", "the ledger", "the approval record"],
      );
      assert.deepEqual(
        [...PLACES_THAT_MAY_HOLD_THE_NONCE_IN_CLEAR],
        ["the verdict record", "the feedback of the phase attempt"],
      );
      const record = (await (
        operationOf(impl, "judge") as (i: unknown, c: unknown) => Promise<Record<string, unknown>>
      )(gateInput, engineCall("VERDICT: REJECTED"))) as Record<string, unknown>;
      assert.equal(typeof record["nonceHash"], "string");
      // The sample records the hash; the nonce in clear is optional.
      assert.ok(!("nonce" in record) || typeof record["nonce"] === "string");
    },
  },
  {
    id: "CT-100-240",
    title:
      "the model-tier bump is an option off by default; a failed verification gate and a MALFORMED reply do not count towards K, and the bump and the escalation are separate rules with separate counts (F100-FR-140)",
    level: "contract",
    proves: ["F100-FR-140"],
    run() {
      assert.equal(TIER_BUMP_DEFAULT_ON, false);
      assert.equal(COUNTS_TOWARDS_K["rejection by the critic"], true);
      assert.equal(COUNTS_TOWARDS_K["a failed verification gate"], false);
      assert.equal(COUNTS_TOWARDS_K["a MALFORMED reply"], false);
      assert.equal(BUMP_AND_ESCALATION_SHARE_A_COUNT, false);
      assert.deepEqual([...DIVERSITY_RESULTS_THAT_WARN], ["same-model", "unverified"]);
      assert.equal(WARNING_NAME, "critic-diversity warning");
      assert.ok(ATTEMPT_KINDS.includes("bumped"));
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-18/operations-exist",
      "EP-18/closed-result-sets",
      "EP-18/degradation",
      "EP-18/unknown-value-rule",
      "EP-18/behaviour-cases",
    ],
    {
      resultSets: [
        {
          operation: "next",
          members: [...ATTEMPT_KINDS],
          calls: [
            [history],
            [{ ...history, anAcceleratedPhaseAttemptIsDue: true }],
            [{ ...history, verdicts: [] }],
          ],
        },
        {
          operation: "judge",
          members: [(v: unknown) => VERDICTS.includes((v as { verdict: string }).verdict as never)],
          calls: [
            [gateInput, engineCall("VERDICT: APPROVED")],
            [gateInput, engineCall("VERDICT: REJECTED")],
            [gateInput, engineCall("no verdict here")],
          ],
        },
      ],
      throwingOperation: "judge",
    },
  ),
  ...named,
  {
    id: "EP-18/internal-seam",
    title:
      "EP-18 is an internal seam: it is marked as one in the report of its suite, and it carries no promise outside the product's repository in Wave 1 (F100-FR-020)",
    level: "contract",
    proves: ["F100-FR-020"],
    run() {
      assert.equal(IS_AN_INTERNAL_SEAM, true);
      assert.equal(STANDING, "internal-seam");
      assert.equal(PROMISE_OUTSIDE_THE_REPOSITORY_IN_WAVE_1, false);
      assert.equal(registryOf(EP).standing, "internal-seam");
    },
  },
]);

export { implementation };
await casesAsTests(CRITIC_STRATEGY_ID, implementation, cases);
