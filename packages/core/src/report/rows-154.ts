/**
 * T017 — the report rows spec 154 adds (F154-FR-012, -014, -015, -017;
 * data-model.md D2), as types read from
 * `@specstride/contracts/schemas/154/report-rows-154.schema.json` — the
 * schema is the source, the types fold to it. Every share is computed only
 * from timed events; a row whose events are missing is `"not in the
 * events"`. No forecast, no file written.
 */
import schema from "@specstride/contracts/schemas/154/report-rows-154.schema.json" with { type: "json" };

/** The id of the record, `const` of the schema. */
export const REPORT_ROWS_154_SCHEMA: "specstride.report-rows-154/1" = (schema as any).properties.schema.const;

/** A share in per cent, or `"not in the events"` where the events lack it. */
export type ShareOrMissing = number | "not in the events";

/** Milliseconds (M10), or `"not in the events"` where the events lack it. */
export type MillisecondsOrMissing = number | "not in the events";

/** The outcome of a group's merge check, `enum` of the schema. */
export type MergeCheckResult = "pass" | "fail" | "unchecked" | "not-run";

/** One `groups` item of the schema. */
export type GroupReportRow = {
  readonly phase: number;
  readonly outcome: string;
  readonly appliedPathCount: number;
  readonly mergeCheckResult: MergeCheckResult | null;
  readonly wallTimeMs: number;
};

/** The window shares of the report: per cent of the run's wall time. */
export type WindowShares = {
  readonly proposerPasses: ShareOrMissing;
  readonly inPassChecks: ShareOrMissing;
  readonly gateAndCriticOutsideChecks: ShareOrMissing;
  readonly rest: ShareOrMissing;
};

/** The record the report prints, exactly the schema's required fields. */
export type ReportRows154 = {
  readonly schema: typeof REPORT_ROWS_154_SCHEMA;
  readonly feature: string;
  readonly windowShares: WindowShares;
  readonly inPassCheckTimeOutsidePasses: MillisecondsOrMissing;
  readonly groups: readonly GroupReportRow[];
};
