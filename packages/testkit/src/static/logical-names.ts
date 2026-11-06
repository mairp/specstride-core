/**
 * T261 — the static test "Logical names" (annex X, §X.10; annex B, §B.5;
 * F100-FR-225, F100-FR-051; quickstart.md scenario 3, the row "Logical
 * names").
 *
 * Every logical name has a path, a root and exactly one writer, and every
 * root is one of `user`, `control`, `workspace`, `worker-root` or one of the
 * three places `temp`, `package`, `harness-home` that are not roots of state.
 */
import { logicalNameRows } from "@specstride/contracts/ids/logical-names";
import { ROOT_NAMES, STATE_ROOTS, NON_STATE_PLACES } from "@specstride/contracts/ids/roots";
import { oneWriter, writersOf } from "@specstride/contracts/records/rules";
import {
  ROOT,
  contractsData,
  finding,
  type CheckOptions,
  type Finding,
  type StaticCheck,
} from "./kit.ts";

/** The data file of the table of §B.5. */
export const LAYOUT_FILE = "packages/contracts/data/layout.json";

/** The four roots of state and the three places that are not (annex B, §B.5). */
export const ROOTS: readonly string[] = ROOT_NAMES;

type Layout = {
  logicalNames: { logicalName: string; root: string; writer: string; path: string }[];
};

/** F100-FR-225, F100-FR-051 — the table of logical names. */
export function checkLogicalNames(options: CheckOptions = {}): readonly Finding[] {
  const root = options.root ?? ROOT;
  const findings: Finding[] = [];
  const raw = contractsData<Layout>("layout.json", root).logicalNames;

  const seen = new Set<string>();
  for (const row of raw) {
    if (seen.has(row.logicalName)) {
      findings.push(
        finding(
          LAYOUT_FILE,
          0,
          `the logical name \`${row.logicalName}\` has two rows in annex B §B.5 ` + `(F100-FR-053)`,
          row.logicalName,
        ),
      );
    }
    seen.add(row.logicalName);
    if (String(row.path ?? "").trim() === "") {
      findings.push(
        finding(
          LAYOUT_FILE,
          0,
          `the logical name \`${row.logicalName}\` has no path (F100-FR-225)`,
          row.logicalName,
        ),
      );
    }
    const first = String(row.root ?? "")
      .replace(/`/g, "")
      .trim()
      .split(/[\s(]/, 1)[0];
    if (!ROOTS.includes(first ?? "")) {
      findings.push(
        finding(
          LAYOUT_FILE,
          0,
          `the logical name \`${row.logicalName}\` names the root "${row.root}", which ` +
            `is none of ${STATE_ROOTS.join(", ")} nor one of the three places ` +
            `${NON_STATE_PLACES.join(", ")} (F100-FR-225)`,
          String(row.root),
        ),
      );
    }
    // The `Writer` cell is never empty. It names the consumer for a file the
    // consumer keeps, and it starts with `—` for a name that resolves to
    // another name (`workspace:current:events`), which has no writer of its
    // own. `writersOf` then gives no writing process, which is correct.
    const cell = String(row.writer ?? "").trim();
    if (cell === "") {
      findings.push(
        finding(
          LAYOUT_FILE,
          0,
          `the logical name \`${row.logicalName}\` names no writer (F100-FR-051)`,
          row.logicalName,
        ),
      );
    }
    void writersOf(cell);
  }

  // Exactly one writing process per name (F100-FR-051).
  for (const conflict of oneWriter(raw)) {
    findings.push(finding(LAYOUT_FILE, 0, conflict.message, conflict.logicalName));
  }

  // The rows the package exports agree with the data file.
  if (logicalNameRows.length !== raw.length) {
    findings.push(
      finding(
        "packages/contracts/src/ids/logical-names.ts",
        0,
        `the package exports ${logicalNameRows.length} logical names and the data file ` +
          `holds ${raw.length} (F100-FR-053)`,
      ),
    );
  }
  return Object.freeze(findings);
}

/** The check the runner of T264 registers. */
export const logicalNamesCheck: StaticCheck = {
  name: "Logical names",
  covers: ["F100-FR-051", "F100-FR-053", "F100-FR-225"],
  run: checkLogicalNames,
};

export default logicalNamesCheck;
