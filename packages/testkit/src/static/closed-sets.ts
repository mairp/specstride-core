/**
 * T076 — the static test "Closed sets" over the `contracts` package (annex X,
 * §X.10; F100-FR-225, F100-FR-209; F100-SC-003, F100-SC-007;
 * quickstart.md scenario 3, the row "Closed sets").
 *
 * Every set the package exports has a row of `closed-sets.json` and the
 * reverse, and the members of a row with literals equal the export.
 */
import { closedSets } from "@specstride/contracts/enums/all-sets";
import { closedSetRows } from "@specstride/contracts/enums";
import { finding, type CheckOptions, type Finding, type StaticCheck } from "./kit.ts";

/** The data file the table of §X.6 lives in. */
export const CLOSED_SETS_FILE = "packages/contracts/data/closed-sets.json";

/** The package that exports the sets. */
export const EXPORTING_MODULE = "packages/contracts/src/enums/all-sets.ts";

/** F100-FR-209 — every set of the package has a row, and every row a set. */
export function checkClosedSets(_options: CheckOptions = {}): readonly Finding[] {
  const findings: Finding[] = [];
  const rows = closedSetRows;
  const numbers = new Set(rows.map((r) => r.number));

  for (const row of rows) {
    if (!closedSets.has(row.number)) {
      findings.push(
        finding(
          EXPORTING_MODULE,
          0,
          `row ${row.number} ("${row.name}") of annex X §X.6 has no closed set in the ` +
            `\`contracts\` package (F100-FR-209)`,
          String(row.number),
        ),
      );
    }
  }
  for (const [number, set] of closedSets) {
    if (!numbers.has(number)) {
      findings.push(
        finding(
          CLOSED_SETS_FILE,
          0,
          `the \`contracts\` package exports the closed set "${set.name}" (${number}), ` +
            `which has no row in annex X §X.6 (F100-FR-209)`,
          String(number),
        ),
      );
    }
  }
  // The members of a row with literals equal the export.
  for (const row of rows) {
    const set = closedSets.get(row.number);
    if (set === undefined) continue;
    if (set.name !== row.name) {
      findings.push(
        finding(
          EXPORTING_MODULE,
          0,
          `the closed set ${row.number} is exported as "${set.name}"; its row of annex X ` +
            `§X.6 is "${row.name}" (F100-FR-209)`,
          set.name,
        ),
      );
    }
    if (row.literals.length === 0) continue;
    const exported = [...set.members];
    const missing = row.literals.filter((m) => !exported.includes(m));
    const extra = exported.filter((m) => !row.literals.includes(m));
    if (missing.length > 0) {
      findings.push(
        finding(
          EXPORTING_MODULE,
          0,
          `the closed set "${row.name}" (${row.number}) does not hold the members ` +
            `${missing.join(", ")} that its row of annex X §X.6 names (F100-FR-209)`,
          missing.join(", "),
        ),
      );
    }
    if (extra.length > 0) {
      findings.push(
        finding(
          CLOSED_SETS_FILE,
          0,
          `the closed set "${row.name}" (${row.number}) holds the members ` +
            `${extra.join(", ")}, which its row of annex X §X.6 does not name ` +
            `(F100-FR-209)`,
          extra.join(", "),
        ),
      );
    }
  }
  // Every row states its owner, how it is closed and what a reader does with
  // an unknown value (F100-FR-208).
  for (const row of rows) {
    for (const [field, value] of [
      ["owner", row.owner],
      ["closedBy", row.closedBy],
      ["unknownValue", row.unknownValue],
      ["name", row.name],
    ] as const) {
      if (String(value).trim() === "") {
        findings.push(
          finding(
            CLOSED_SETS_FILE,
            0,
            `row ${row.number} of annex X §X.6 states no \`${field}\` (F100-FR-208)`,
            field,
          ),
        );
      }
    }
  }
  return Object.freeze(findings);
}

/** The check the runner of T264 registers. */
export const closedSetsCheck: StaticCheck = {
  name: "Closed sets",
  covers: ["F100-FR-208", "F100-FR-209", "F100-FR-225", "F100-SC-003", "F100-SC-007"],
  run: checkClosedSets,
};

export default closedSetsCheck;
