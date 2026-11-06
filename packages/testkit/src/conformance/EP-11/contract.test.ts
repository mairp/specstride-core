/**
 * T116 — the conformance suite at contract level for EP-11, the terms-gate
 * data (annex C, §C.12): CT-100-208.
 *
 * Before the named case the suite checks the five things every suite at
 * contract level checks (annex A, §A.4). The behaviour of EP-11 belongs to
 * feature 147, with the harness adapters supplying the facts of their rows;
 * its behaviour cases go in this folder beside this file.
 */
import assert from "node:assert/strict";
import {
  AUDIENCES,
  AUTH_TIER_3_SHIPS,
  AUTH_TIER_3_WITHOUT_AN_ALLOWED_ROW,
  IS_DATA,
  NOTHING_BYPASSES_IT,
  OPERATIONS,
  POINT_ID,
  STALE_AFTER_DAYS,
  STATUSES,
  STATUS_WHEN_UNKNOWN,
  A_FRONT_HARNESS_IS_GATED_BY_ITS_BACK_END,
  noRowOutcome,
} from "@specstride/contracts/ep/terms";
import { PROVIDER, ROWS, implementation } from "../../samples/EP-11/index.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-11" as const;

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-208",
    title:
      "the terms gate is a pure table with the one function `evaluate`; auth tier 3 ships refused for every provider, and for the audience `distributed` auth tier 2 is the default where auth tier 1 is confirmed for personal use only (F100-FR-108)",
    level: "contract",
    proves: ["F100-FR-108"],
    run(impl) {
      assert.deepEqual([...OPERATIONS], ["evaluate"]);
      assert.equal(IS_DATA, true);
      assert.deepEqual([...AUDIENCES], ["personal", "distributed"]);
      assert.deepEqual([...STATUSES], ["allowed", "conditional", "personal-only", "refused"]);
      const evaluate = operationOf(impl, "evaluate") as (q: unknown) => {
        decision: string;
        row: unknown;
      };
      // The row of the test overlay changes the decision with no code change.
      assert.equal(
        evaluate({ provider: PROVIDER, authTier: 1, audience: "personal", acknowledgements: [] })
          .decision,
        "allowed",
      );
      // Auth tier 1 for a distributed audience is `personal-only`, so refused;
      // auth tier 2 is the default for such a provider.
      assert.equal(
        evaluate({ provider: PROVIDER, authTier: 1, audience: "distributed", acknowledgements: [] })
          .decision,
        "refused",
      );
      assert.equal(
        evaluate({ provider: PROVIDER, authTier: 2, audience: "distributed", acknowledgements: [] })
          .decision,
        "allowed",
      );
      // Auth tier 3 ships refused for every provider: the overlay holds no row.
      assert.equal(AUTH_TIER_3_SHIPS, "refused");
      assert.equal(AUTH_TIER_3_WITHOUT_AN_ALLOWED_ROW, "refused");
      assert.equal(
        evaluate({ provider: PROVIDER, authTier: 3, audience: "personal", acknowledgements: [] })
          .decision,
        "refused",
      );
      assert.equal(
        ROWS.every((r) => r.authTier !== 3),
        true,
      );
      assert.equal(STATUS_WHEN_UNKNOWN, "refused");
      assert.equal(STALE_AFTER_DAYS, 30);
      assert.deepEqual([...NOTHING_BYPASSES_IT], ["comment", "flag", "mode", "project key"]);
      assert.equal(A_FRONT_HARNESS_IS_GATED_BY_ITS_BACK_END, true);
      // No row: auth tiers 1 and 2 are allowed with a warning.
      assert.equal(noRowOutcome(1).decision, "allowed-with-warning");
      assert.equal(noRowOutcome(3).decision, "refused");
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-11/operations-exist",
      "EP-11/closed-result-sets",
      "EP-11/degradation",
      "EP-11/unknown-value-rule",
      "EP-11/behaviour-cases",
    ],
    {
      resultSets: [
        {
          operation: "evaluate",
          members: [
            (v: unknown) =>
              ["allowed", "refused", "allowed-with-warning"].includes(
                (v as { decision: string }).decision,
              ),
          ],
          calls: [
            [{ provider: PROVIDER, authTier: 1, audience: "personal", acknowledgements: [] }],
            [
              {
                provider: "no-such-provider",
                authTier: 2,
                audience: "personal",
                acknowledgements: [],
              },
            ],
            [{ provider: PROVIDER, authTier: 3, audience: "distributed", acknowledgements: [] }],
          ],
        },
      ],
      throwingOperation: "evaluate",
    },
  ),
  ...named,
]);

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
