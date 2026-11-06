/**
 * T057 — the report of counts, and the rule that a rule which replaces nothing
 * fails the suite (F141-FR-020, §O.5 rule 2).
 *
 * "It MUST report, per fixture, how many values each rule replaced. A rule that
 * replaces nothing in any fixture MUST fail the suite."
 *
 * Two different things, and the second is the one that is easy to get wrong:
 * "nothing in ANY fixture" is the SUM over every fixture of the suite, not a count
 * per fixture. A rule may replace nothing in one scenario and a hundred values in
 * another and still have earned its place; a rule whose total over the whole suite
 * is 0 has not, and the suite fails and NAMES it (quickstart, scenario 9).
 *
 * The count of a rule means what F141-FR-020 says it means, which `countKindOf`
 * of `types.ts` decides: values replaced, subjects left out, or values the rule
 * was applied to. In all three cases "replaces nothing" is a count of 0.
 */
import { countKindOf, ruleIds, NormalizationError, type CountKind } from "./types.ts";

/** The counts of one normalized capture: per rule, how many values. */
export type ReplacementCounts = Readonly<Record<string, number>>;

/** The report of one fixture. */
export type FixtureReport = {
  readonly scenario: string;
  readonly side: "reference" | "port";
  readonly counts: ReplacementCounts;
};

/** One row of the report of a suite. */
export type RuleRow = {
  readonly id: string;
  readonly countKind: CountKind;
  /** The total over every fixture of the suite. */
  readonly total: number;
  /** The fixtures in which the rule counted more than nothing. */
  readonly fixtures: readonly string[];
};

/** The report of a suite: one row per rule, and what replaced nothing. */
export type SuiteReport = {
  readonly rows: readonly RuleRow[];
  /** The rules whose total over the whole suite is 0; the suite fails on any. */
  readonly replacedNothing: readonly string[];
  readonly fixtures: readonly string[];
};

/** Add up the counts of every fixture of a suite, one row per rule of feature 100. */
export function suiteReport(reports: readonly FixtureReport[]): SuiteReport {
  const ids = ruleIds();
  const rows: RuleRow[] = ids.map((id) => {
    let total = 0;
    const fixtures: string[] = [];
    for (const report of reports) {
      const count = report.counts[id] ?? 0;
      total += count;
      if (count > 0) fixtures.push(`${report.scenario} (${report.side})`);
    }
    return Object.freeze({
      id,
      countKind: countKindOf(id),
      total,
      fixtures: Object.freeze(fixtures),
    });
  });
  return Object.freeze({
    rows: Object.freeze(rows),
    replacedNothing: Object.freeze(rows.filter((row) => row.total === 0).map((row) => row.id)),
    fixtures: Object.freeze(reports.map((r) => `${r.scenario} (${r.side})`)),
  });
}

/**
 * The suite fails when a rule replaced nothing in any fixture, and the failure
 * NAMES the rule (§O.5 rule 2, F141-SC-010).
 */
export function assertEveryRuleEarnedItsPlace(report: SuiteReport): void {
  if (report.replacedNothing.length === 0) return;
  throw new NormalizationError(
    `${String(report.replacedNothing.length)} normalization rule(s) replaced nothing in any ` +
      `fixture of the suite and the suite therefore fails (§O.5 rule 2, F141-FR-020): ` +
      `${report.replacedNothing
        .map((id) => `${id} (counts what it ${countKindOf(id)})`)
        .join(", ")}. The suite ran ${String(report.fixtures.length)} capture(s): ` +
      `${report.fixtures.join(", ")}`,
  );
}

/** The report as text, one line per rule, for the reader of a run. */
export function reportAsText(report: SuiteReport): string {
  const lines = [
    `normalization: ${String(report.rows.length)} rules over ${String(report.fixtures.length)} captures`,
  ];
  for (const row of report.rows) {
    lines.push(
      `  ${row.id}  ${String(row.total).padStart(6)}  ${row.countKind.padEnd(10)}  ` +
        `${row.total === 0 ? "REPLACED NOTHING" : `in ${String(row.fixtures.length)} capture(s)`}`,
    );
  }
  if (report.replacedNothing.length > 0) {
    lines.push(`  the suite fails: ${report.replacedNothing.join(", ")} replaced nothing`);
  }
  return `${lines.join("\n")}\n`;
}
