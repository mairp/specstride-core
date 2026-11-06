/**
 * T119 — the conformance suite at contract level for EP-12, the quota
 * classifier (annex C, §C.13): CT-100-209.
 *
 * Before the named case the suite checks the five things every suite at
 * contract level checks (annex A, §A.4). The behaviour of EP-12 belongs to
 * feature 127, with each harness adapter supplying its classifier entries;
 * its behaviour cases go in this folder beside this file.
 */
import assert from "node:assert/strict";
import {
  ALERT_LEVELS,
  CLASSES,
  CLASSES_THAT_BLOCK_ON_A_HUMAN,
  CLASSES_THAT_COUNT_AS_A_CONSECUTIVE_ERROR,
  CLASS_THAT_COUNTS_AFTER_ITS_CAP,
  CLASS_WHEN_UNKNOWN,
  CONFIDENCES,
  CONFIDENCES_THAT_NEED_A_PROBE,
  CONFIDENCE_WHEN_UNKNOWN,
  IS_PURE,
  NO_ENTRY_MATCHES,
  OPERATIONS,
  POINT_ID,
  A_QUOTA_CLASS_SPENDS,
  countsAsAConsecutiveError,
} from "@specstride/contracts/ep/quota-classifier";
import { FAILURES, implementation } from "../../samples/EP-12/index.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";
// T038 of feature 127, the CONTENT OWNER of this point: the behaviour cases of
// EP-12 (annex A §A.4, "the behaviour cases the content owner adds in the same
// folder"). They are appended to `cases` below, so that `node --test` and the
// script `conformance` run the same suite.
import { cases as behaviourOf127 } from "./behaviour-127.ts";

const EP = "EP-12" as const;

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-209",
    title:
      "the classifier offers `classify` and `observe` with the closed sets of §C.13; a quota pause spends no budget of any kind, and `proposer_consecutive_errors` counts only `agent_failure`, `provider_other` or `overload` after its cap (F100-FR-109)",
    level: "contract",
    proves: ["F100-FR-109"],
    run(impl) {
      assert.deepEqual([...OPERATIONS], ["classify", "observe"]);
      assert.equal(CLASSES.length, 9);
      assert.deepEqual([...CONFIDENCES], ["structured", "status", "text", "stall", "host"]);
      const classify = operationOf(impl, "classify") as (s: unknown) => {
        quotaClass: string;
        confidence: string;
        resetsAt: string | null;
        retryable: boolean;
      };
      assert.equal(classify({ status: { code: 429, headers: {} } }).quotaClass, FAILURES[429]);
      assert.equal(classify({ status: { code: 401, headers: {} } }).quotaClass, "auth");
      assert.equal(classify({}).quotaClass, NO_ENTRY_MATCHES.quotaClass);
      assert.equal(classify({}).confidence, NO_ENTRY_MATCHES.confidence);
      assert.equal(CLASS_WHEN_UNKNOWN, "provider_other");
      assert.equal(CONFIDENCE_WHEN_UNKNOWN, "text");
      // A quota class spends nothing.
      for (const [what, spends] of Object.entries(A_QUOTA_CLASS_SPENDS)) {
        assert.equal(spends, false, `a quota class must not spend ${what}`);
      }
      assert.deepEqual(
        [...CLASSES_THAT_COUNT_AS_A_CONSECUTIVE_ERROR],
        ["agent_failure", "provider_other"],
      );
      assert.equal(CLASS_THAT_COUNTS_AFTER_ITS_CAP, "overload");
      assert.equal(countsAsAConsecutiveError("agent_failure"), true);
      assert.equal(countsAsAConsecutiveError("provider_other"), true);
      assert.equal(countsAsAConsecutiveError("overload"), false);
      assert.equal(countsAsAConsecutiveError("overload", true), true);
      assert.equal(countsAsAConsecutiveError("quota_window"), false);
      assert.deepEqual([...CLASSES_THAT_BLOCK_ON_A_HUMAN], ["quota_credit", "auth", "budget_cap"]);
      assert.deepEqual([...CONFIDENCES_THAT_NEED_A_PROBE], ["text", "stall", "host"]);
      assert.equal(IS_PURE, true);
      const observe = operationOf(impl, "observe") as (o: unknown) => string | undefined;
      assert.equal(observe({ kind: "gauge", remaining: 0, of: "window" }), "critical");
      assert.equal(observe({ kind: "gauge", remaining: 100, of: "window" }), undefined);
      assert.ok(ALERT_LEVELS.includes(observe({ kind: "host-fact", fact: "x" }) as never));
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-12/operations-exist",
      "EP-12/closed-result-sets",
      "EP-12/degradation",
      "EP-12/unknown-value-rule",
      "EP-12/behaviour-cases",
    ],
    {
      resultSets: [
        {
          operation: "classify",
          members: [
            (v: unknown) =>
              CLASSES.includes((v as { quotaClass: string }).quotaClass as never) &&
              CONFIDENCES.includes((v as { confidence: string }).confidence as never),
          ],
          calls: [
            [{ status: { code: 429, headers: {} } }],
            [{ errorText: "the context window is full" }],
            [{}],
            [{ streamRecord: { type: "unknown" } }],
          ],
        },
      ],
      throwingOperation: "classify",
    },
  ),
  ...named,
  ...behaviourOf127,
]);

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
