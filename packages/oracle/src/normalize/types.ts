/**
 * T052 to T057 — what a normalization rule is (F141-FR-020).
 *
 * "The normalizer MUST implement the rules N-01 to N-29 of feature 100, annex X
 * §X.8, and no other rule. It MUST read the layout tables, the environment alias
 * table, the component-name table and the further maps from the data of feature
 * 100 and MUST hold no table of its own. It MUST report, per fixture, how many
 * values each rule replaced. A rule that replaces nothing in any fixture MUST
 * fail the suite."
 *
 * So a rule is a value with an id, a subject and a function, and the LIST of
 * rules is the list of feature 100: `rulesOfFeature100()` reads
 * `normalization.json` through `@specstride/contracts` and the normalizer refuses
 * to run when a rule of that list has no implementation here, or when a rule is
 * implemented that the list does not hold ("and no other rule").
 *
 * What a count means is F141-FR-020's own definition:
 *
 * | Kind of rule | What the count is |
 * |---|---|
 * | replaces a value by its own text | the number of values replaced |
 * | marks a subject as not compared (N-25, N-28) | the number of subjects left out |
 * | asserts, reads or compares as written (N-09, N-12 to N-14, N-19 to N-21, N-24, N-27) | the number of values it was applied to |
 *
 * In every case "replaces nothing" means a count of 0.
 */
import { rules as normalizationRules } from "@specstride/contracts/profile/normalization";

/** One rule of annex X §X.8, as the data of feature 100 states it. */
export type RuleOfFeature100 = {
  readonly id: string;
  readonly subject: string;
  readonly rule: string;
};

/** The rules of feature 100, in the order of the annex. The oracle adds none. */
export function rulesOfFeature100(): readonly RuleOfFeature100[] {
  return Object.freeze(
    normalizationRules.map((row) =>
      Object.freeze({ id: row.id, subject: row.subject, rule: row.rule }),
    ),
  );
}

/** The ids of the rules, N-01 to N-29. */
export function ruleIds(): readonly string[] {
  return Object.freeze(rulesOfFeature100().map((r) => r.id));
}

/** What a rule's count means (F141-FR-020). */
export const COUNT_KINDS = ["replaced", "left out", "applied to"] as const;
export type CountKind = (typeof COUNT_KINDS)[number];

/**
 * The rules that leave a subject out and count what they left out, and the rules
 * that replace no value by their own text and count the values they were applied
 * to. Both lists are F141-FR-020's own, named there and not invented here.
 */
export const RULES_THAT_LEAVE_OUT: readonly string[] = Object.freeze(["N-25", "N-28"]);
export const RULES_THAT_COMPARE_AS_WRITTEN: readonly string[] = Object.freeze([
  "N-09",
  "N-12",
  "N-13",
  "N-14",
  "N-19",
  "N-20",
  "N-21",
  "N-24",
  "N-27",
]);

/** What the count of a rule means. */
export function countKindOf(id: string): CountKind {
  if (RULES_THAT_LEAVE_OUT.includes(id)) return "left out";
  if (RULES_THAT_COMPARE_AS_WRITTEN.includes(id)) return "applied to";
  return "replaced";
}

/** A capture while it is being normalized: the surfaces, by name. */
export type MutableCapture = {
  readonly scenario: string;
  readonly side: "reference" | "port";
  surfaces: Record<string, unknown>;
  /** What a rule noticed and the comparator must know: a cache inside the workdir. */
  readonly findings: string[];
};

/** What every rule is given besides the capture. */
export type NormalizeContext = {
  readonly scenario: string;
  readonly side: "reference" | "port";
  /** The roots of this side, longest first, as N-01 needs them. */
  readonly roots: readonly { readonly placeholder: string; readonly path: string }[];
  /** The files of state of this side, by logical name, as N-02 needs them. */
  readonly statePaths: Readonly<Record<string, string>>;
  /** The durations the fixture declares as the behaviour under test (N-05). */
  readonly durationsUnderTest: readonly string[];
  /** True where the fixture tests colour, so N-21 compares the escapes as written. */
  readonly testsColour?: boolean;
  /** The feature slug of the run. */
  readonly slug: string;
};

/** One rule of the normalizer. */
export type Rule = {
  readonly id: string;
  readonly subject: string;
  /** The surfaces of §O.4 the rule acts on; empty means every surface. */
  readonly surfaces: readonly string[];
  /** Apply the rule and give back the count, as `countKindOf` defines it. */
  apply: (capture: MutableCapture, context: NormalizeContext) => number;
};

/** A rule that is not one of feature 100, or a rule of feature 100 with no rule here. */
export class NormalizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NormalizationError";
  }
}
