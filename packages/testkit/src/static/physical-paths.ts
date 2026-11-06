/**
 * T262 — the static test "Physical paths" (annex X, §X.10; F100-FR-225,
 * F100-FR-038; quickstart.md scenario 3, the row "Physical paths").
 *
 * No file under the feature directories of `specs` names a path template of
 * `layout.json` outside `plan.md` and `contracts/`. Specifications, the parity
 * oracle, the doctor and messages to the consumer name state by logical name
 * (annex B, §B.2, SL-4). The test reads the specifications line by line and
 * names the file and the line.
 */
import {
  ROOT,
  contractsData,
  finding,
  linesOf,
  rel,
  specFiles,
  type CheckOptions,
  type Finding,
  type StaticCheck,
} from "./kit.ts";

/** The two places a path template may appear (quickstart.md scenario 3). */
export const EXEMPT = ["plan.md", "contracts/"] as const;

type Layout = { logicalNames: { logicalName: string; path: string }[] };

/** True for a file the rule exempts: `plan.md` and anything under `contracts/`. */
export function isExempt(path: string): boolean {
  return /(^|\/)plan\.md$/.test(path) || path.includes("/contracts/");
}

/** Every path template of `data/layout.json`, longest first. */
export function pathTemplates(root: string = ROOT): readonly string[] {
  const layout = contractsData<Layout>("layout.json", root);
  return Object.freeze(
    [...new Set(layout.logicalNames.map((n) => n.path).filter((p) => p !== ""))].sort(
      (a, b) => b.length - a.length,
    ),
  );
}

/** F100-FR-225, F100-FR-038 — no specification names state by a physical path. */
export function checkPhysicalPaths(options: CheckOptions = {}): readonly Finding[] {
  const root = options.root ?? ROOT;
  const templates = pathTemplates(root);
  const findings: Finding[] = [];
  for (const file of specFiles(options)) {
    const path = rel(file, root);
    if (isExempt(path)) continue;
    const lines = linesOf(file);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] as string;
      for (const template of templates) {
        if (!line.includes(template)) continue;
        findings.push(
          finding(
            path,
            i + 1,
            `the file names the path template "${template}" of \`layout.json\`; a ` +
              `specification names state by logical name, and the path template ` +
              `stands in \`plan.md\` and under \`contracts/\` only ` +
              `(F100-FR-038, F100-FR-225)`,
            template,
          ),
        );
        break; // the longest template that matches is the finding
      }
    }
  }
  return Object.freeze(findings);
}

/** The check the runner of T264 registers. */
export const physicalPathsCheck: StaticCheck = {
  name: "Physical paths",
  covers: ["F100-FR-038", "F100-FR-225"],
  run: checkPhysicalPaths,
};

export default physicalPathsCheck;
