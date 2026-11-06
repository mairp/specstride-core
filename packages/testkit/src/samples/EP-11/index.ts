/**
 * T117 — the sample implementation of EP-11, the terms-gate data, outside the
 * core, registered from the test tree (annex A, §A.4, F100-FR-018; annex X,
 * §X.10, F100-FR-222).
 *
 * A row for a fictional provider in a test overlay, which §C.12 "Proving
 * test" names: it changes the decision with no code change. The point is a
 * pure table with the one function `evaluate`; the sample holds the rows as
 * data and reads them.
 */
import { STATUS_WHEN_UNKNOWN, noRowOutcome } from "@specstride/contracts/ep/terms";
import type { AuthTier, TermsDecision, TermsQuery, TermsRow } from "@specstride/contracts/ep/terms";
import type { Implementation } from "../../conformance/frame.ts";

/** The provider of the test overlay; it is no provider of the shipped file. */
export const PROVIDER = "sample-provider" as const;

/** The rows of the test overlay, as data. */
export const ROWS: readonly TermsRow[] = Object.freeze([
  Object.freeze({
    provider: PROVIDER,
    authTier: 1 as AuthTier,
    audience: "personal" as const,
    status: "allowed" as const,
    source: "the sample overlay of the test tree",
    accessDate: "2026-10-01",
    quotedSentence: "The sample provider allows personal use at auth tier 1.",
    verifiedOn: null,
  }),
  Object.freeze({
    provider: PROVIDER,
    authTier: 1 as AuthTier,
    audience: "distributed" as const,
    status: "personal-only" as const,
    source: "the sample overlay of the test tree",
    accessDate: "2026-10-01",
    quotedSentence: "The sample provider confirms auth tier 1 for personal use only.",
    verifiedOn: null,
  }),
  Object.freeze({
    provider: PROVIDER,
    authTier: 2 as AuthTier,
    audience: "distributed" as const,
    status: "allowed" as const,
    source: "the sample overlay of the test tree",
    accessDate: "2026-10-01",
    quotedSentence: "The sample provider allows auth tier 2 for a distributed audience.",
    verifiedOn: null,
  }),
]);

export const operations = Object.freeze({
  evaluate(query: TermsQuery): TermsDecision {
    const row = ROWS.find(
      (r) =>
        r.provider === query.provider &&
        r.authTier === query.authTier &&
        r.audience === query.audience,
    );
    if (row === undefined) return noRowOutcome(query.authTier);
    const status = (["allowed", "conditional", "personal-only", "refused"] as const).includes(
      row.status,
    )
      ? row.status
      : STATUS_WHEN_UNKNOWN;
    if (status === "allowed") {
      return Object.freeze({
        decision: "allowed" as const,
        row,
        explanation: row.quotedSentence,
      });
    }
    if (status === "conditional") {
      const acknowledged = query.acknowledgements.includes(`${row.provider}:${row.authTier}`);
      return Object.freeze({
        decision: acknowledged ? ("allowed" as const) : ("refused" as const),
        row,
        explanation: row.quotedSentence,
      });
    }
    return Object.freeze({
      decision: "refused" as const,
      row,
      explanation: row.quotedSentence,
    });
  },
});

export const implementation: Implementation = Object.freeze({
  ep: "EP-11",
  pointId: "specstride.terms/1",
  id: "sample-terms-overlay",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
