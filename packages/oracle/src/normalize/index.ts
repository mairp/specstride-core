/**
 * T052 to T057 — the normalizer (F141-FR-020).
 *
 * "The normalizer MUST implement the rules N-01 to N-29 of feature 100, annex X
 * §X.8, and no other rule."
 *
 * `RULES` is the list of implementations, and `assertTheRulesAreThoseOfFeature100`
 * holds it to `normalization.json` in BOTH directions: a rule of feature 100 with
 * no implementation here fails, and an implementation whose id feature 100 does not
 * hold fails too. The rules run in the order of the annex, which matters: N-08
 * replaces a generated name inside a path that N-01 has already turned into a
 * placeholder, N-10 and N-11 replace hashes whose inputs N-01 and N-02 have already
 * normalized, and N-23 and N-24 are defined as "after N-01 to N-08".
 */
import { N01 } from "./paths.ts";
import { N02 } from "./state-layout.ts";
import { N03 } from "./run-id.ts";
import { N04 } from "./timestamps.ts";
import { N05 } from "./durations.ts";
import { N06 } from "./nonce.ts";
import { N07 } from "./process-ids.ts";
import { N08 } from "./temporary-names.ts";
import { N09, N10, N11 } from "./hashes.ts";
import { N12, N13, N14 } from "./events.ts";
import { N15, N16, N17, N18, N19, N20 } from "./text.ts";
import { N21, N22, N23, N24, N25, N26, N27, N28, N29 } from "./rest.ts";
import { suiteReport, type FixtureReport, type ReplacementCounts } from "./report.ts";
import {
  NormalizationError,
  ruleIds,
  rulesOfFeature100,
  type MutableCapture,
  type NormalizeContext,
  type Rule,
} from "./types.ts";

export * from "./types.ts";
export * from "./report.ts";
export { N01, rootsLongestFirst, replaceRoots } from "./paths.ts";
export { N02, logicalNamesByPath, replaceStatePaths } from "./state-layout.ts";
export { N03, RUN_ID_PATTERNS } from "./run-id.ts";
export { N04, TIME_PATTERNS, TIME_PLACEHOLDER, timeValuesOf } from "./timestamps.ts";
export { N05, DURATION_PATTERNS, DURATION_PLACEHOLDER } from "./durations.ts";
export { N06, NONCE_PATTERN, noncesOf, boundNoncesOf } from "./nonce.ts";
export { N07, PROCESS_ID_PATTERNS } from "./process-ids.ts";
export { N08, GENERATED_BUNDLE_DIRECTORY, TEMPORARY_NAME_PLACEHOLDER } from "./temporary-names.ts";
export {
  N09,
  N10,
  N11,
  HASH_CLASSES,
  sha256,
  hashSubjectsOf,
  pathClassMismatches,
  implementationClassInconsistencies,
} from "./hashes.ts";
export { N12, N13, N14, WRITER_CLASSES, writerClassOf } from "./events.ts";
export {
  N15,
  N16,
  N17,
  N18,
  N19,
  N20,
  componentTable,
  componentFiles,
  lineClassOf,
  OLD_LANGUAGE_LITERALS,
  OUTPUT_LABELS,
} from "./text.ts";
export {
  N21,
  N22,
  N23,
  N24,
  N25,
  N26,
  N27,
  N28,
  N29,
  RULES_ON_THE_PORT_ALONE,
  REVERSE_INVENTORY_SCHEMA_FIELD,
  REVERSE_INVENTORY_SCHEMA_ID,
} from "./rest.ts";
export { mapStrings, countStrings, collect, numberer, replaceInSurfaces } from "./walk.ts";
export {
  NotCarriedEntryError,
  REGISTRY_SOURCE,
  SURFACES_A_LISTING_REACHES,
  assertNoFileOfTheOracleNamesAnEntry,
  entriesOfTheReferenceRegistry,
  entriesTheProductCarries,
  filesOfTheOracleThatNameAnEntry,
  mentionsOfAnEntry,
  namesAnEntry,
  notCarriedEntries,
  spellingsOfAnEntry,
  takeOutNotCarried,
  withoutAnEntry,
  type NameInAFileOfTheOracle,
} from "./not-carried-entry.ts";

/** The rules of the normalizer, in the order of annex X §X.8. */
export const RULES: readonly Rule[] = Object.freeze([
  N01,
  N02,
  N03,
  N04,
  N05,
  N06,
  N07,
  N08,
  N09,
  N10,
  N11,
  N12,
  N13,
  N14,
  N15,
  N16,
  N17,
  N18,
  N19,
  N20,
  N21,
  N22,
  N23,
  N24,
  N25,
  N26,
  N27,
  N28,
  N29,
]);

/**
 * The rules here are exactly those of feature 100, in its order, and no other
 * (F141-FR-020). Checked in both directions.
 */
export function assertTheRulesAreThoseOfFeature100(rules: readonly Rule[] = RULES): void {
  const theirs = ruleIds();
  const ours = rules.map((r) => r.id);
  const missing = theirs.filter((id) => !ours.includes(id));
  const extra = ours.filter((id) => !theirs.includes(id));
  if (missing.length > 0 || extra.length > 0) {
    throw new NormalizationError(
      `the normalizer must implement the rules of feature 100, annex X §X.8, and no other rule ` +
        `(F141-FR-020). Missing: ${missing.join(", ") || "none"}. Not a rule of feature 100: ` +
        `${extra.join(", ") || "none"}`,
    );
  }
  for (let i = 0; i < theirs.length; i += 1) {
    if (ours[i] !== theirs[i]) {
      throw new NormalizationError(
        `the rules run in the order of the annex; rule ${String(i + 1)} is ${String(ours[i])} here ` +
          `and ${String(theirs[i])} in feature 100`,
      );
    }
  }
  // The subject of every rule is the subject feature 100 states.
  for (const rule of rules) {
    const theirRule = rulesOfFeature100().find((r) => r.id === rule.id);
    if (theirRule !== undefined && theirRule.subject !== rule.subject) {
      throw new NormalizationError(
        `${rule.id} is "${rule.subject}" here and "${theirRule.subject}" in feature 100`,
      );
    }
  }
}

/** A capture after the rules, with the count of each rule. */
export type NormalizedCapture = {
  readonly scenario: string;
  readonly side: "reference" | "port";
  readonly suite: "first" | "second";
  readonly layer: "off" | "on";
  readonly surfaces: Readonly<Record<string, unknown>>;
  readonly missing: Readonly<Record<string, string>>;
  readonly counts: ReplacementCounts;
  /** What a rule noticed that the comparator must know (a cache inside the workdir). */
  readonly findings: readonly string[];
};

/** What `normalize` is given: a capture of one side. */
export type CaptureToNormalize = {
  readonly scenario: string;
  readonly side: "reference" | "port";
  readonly suite?: "first" | "second";
  readonly layer?: "off" | "on";
  readonly surfaces: Readonly<Record<string, unknown>>;
  readonly missing?: Readonly<Record<string, string>>;
};

/**
 * Normalize one capture: every rule of feature 100, in its order, with the count
 * of each. The capture that goes in is not changed; what comes out is a new value.
 */
export function normalize(
  capture: CaptureToNormalize,
  context: NormalizeContext,
  rules: readonly Rule[] = RULES,
): NormalizedCapture {
  assertTheRulesAreThoseOfFeature100(rules);
  const working: MutableCapture = {
    scenario: capture.scenario,
    side: capture.side,
    surfaces: JSON.parse(JSON.stringify(capture.surfaces, replacer)) as Record<string, unknown>,
    findings: [],
  };
  const counts: Record<string, number> = {};
  for (const rule of rules) {
    counts[rule.id] = rule.apply(working, context);
  }
  return Object.freeze({
    scenario: capture.scenario,
    side: capture.side,
    suite: capture.suite ?? "first",
    layer: capture.layer ?? "off",
    surfaces: Object.freeze(working.surfaces),
    missing: Object.freeze({ ...(capture.missing ?? {}) }),
    counts: Object.freeze(counts),
    findings: Object.freeze(working.findings),
  });
}

/** Bytes of a capture become base64 text, so a capture can be stored and compared. */
function replacer(_key: string, value: unknown): unknown {
  if (value instanceof Uint8Array) return Buffer.from(value).toString("base64");
  if (
    value !== null &&
    typeof value === "object" &&
    (value as { type?: string }).type === "Buffer" &&
    Array.isArray((value as { data?: unknown }).data)
  ) {
    return Buffer.from((value as { data: number[] }).data).toString("base64");
  }
  return value;
}

/** The report of a suite from the normalized captures of its fixtures. */
export function reportOf(captures: readonly NormalizedCapture[]): ReturnType<typeof suiteReport> {
  const reports: FixtureReport[] = captures.map((capture) => ({
    scenario: capture.scenario,
    side: capture.side,
    counts: capture.counts,
  }));
  return suiteReport(reports);
}
