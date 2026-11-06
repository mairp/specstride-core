/**
 * T018 — the static checks of the vocabulary and of the open registry
 * (annex A, §A.5; F100-FR-022, F100-FR-023; F100-SC-004).
 *
 * F100-FR-022: a term the glossary marks "never bare" is written in its
 * qualified form, and the old use of "micro-loop" for diagnosis and
 * acceleration is written "recovery cycle".
 *
 * F100-FR-023: a requirement of any feature does not assume a closed list of
 * harnesses. Anything that enumerates harnesses reads the resolved registry.
 *
 * What each rule checks, exactly:
 *
 * - NB-1 every never-bare term appears in its qualified spelling in the
 *   specification corpus, so that the glossary spelling is the one in use;
 * - NB-2 no run-together spelling of a never-bare term appears in prose;
 * - NB-3 no heading of a `spec.md` or an annex is the bare head of a
 *   never-bare term;
 * - NB-4 "micro-loop" is not used for diagnosis or acceleration.
 * - OR-1 no requirement holds two or more harness names as literals: a closed
 *   list of harnesses is written as literals, and the registry is read instead.
 *
 * The heads of these terms ("check", "contract", "gate", "adapter") are
 * ordinary words of the domain — a doctor check, an interface contract, the
 * terms gate — so the checks bind the spelling of the term, not every use of
 * its head noun.
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import {
  ROOT,
  finding,
  linesOf,
  prose,
  rel,
  requirementOf,
  referenceSpecificationFiles,
  specFiles,
  specificationFiles,
  type CheckOptions,
  type Finding,
  type StaticCheck,
} from "./kit.ts";

/** The never-bare terms, as annex A §A.5 lists them (F100-FR-022). */
export const NEVER_BARE_TERMS = [
  "phase gate",
  "launch check",
  "verification gate",
  "phase attempt",
  "stage attempt",
  "launch contract",
  "launch bundle",
  "spec bundle",
  "engine hook",
  "host hook",
  "harness adapter",
  "auth tier",
  "model tier",
] as const;

/** The bare heads of the never-bare terms. */
export const NEVER_BARE_HEADS: readonly string[] = Object.freeze([
  ...new Set(NEVER_BARE_TERMS.map((t) => t.split(" ")[1] as string)),
]);

/** The old use of "micro-loop" is written this way (F100-FR-022). */
export const RECOVERY_CYCLE = "recovery cycle" as const;

/** The subjects for which "micro-loop" is the old use (F100-FR-022). */
const DIAGNOSIS_OR_ACCELERATION = /\b(diagnos\w*|accelerat\w*)\b/i;

/** The proper name of the layer keeps "micro-loop"; only the old use is bound. */
const MICRO_LOOP_AS_THE_LAYER = /micro-loops?\s+(layer|layers)\b/i;

const normaliseLabel = (s: string): string =>
  s
    .trim()
    .replace(/[`*_#]/g, "")
    .replace(/s$/i, "")
    .toLowerCase();

/** The harness names the product has an adapter feature for. */
export function harnessNames(root: string = ROOT): readonly string[] {
  let names: string[];
  try {
    names = readdirSync(join(root, "specs"));
  } catch {
    return [];
  }
  return Object.freeze(
    names
      .filter((n) => /^\d+-adapter-/.test(n))
      .map((n) => n.replace(/^\d+-adapter-/, ""))
      .sort(),
  );
}

/** NB-1 to NB-4 of F100-FR-022. */
export function checkNeverBareTerms(options: CheckOptions = {}): readonly Finding[] {
  const root = options.root ?? ROOT;
  const findings: Finding[] = [];
  const files = specificationFiles(options);
  // T305 — NB-1 asks whether a term is written SOMEWHERE in the product, so it
  // reads every folder of `specs/1*` as reference; a scoped run does not narrow
  // it, or a term another feature owns would look unwritten. NB-2, NB-3 and
  // NB-4 are per-file and take the scoped subject.
  const corpus = referenceSpecificationFiles(options)
    .map((f) => linesOf(f).join("\n"))
    .join("\n")
    .toLowerCase();

  // NB-1: the qualified spelling of every term is the one in use.
  for (const term of NEVER_BARE_TERMS) {
    if (!corpus.includes(term)) {
      findings.push(
        finding(
          "specs",
          0,
          `the never-bare term "${term}" is written in no specification in its ` +
            `qualified form; annex A §A.5 requires the qualified form (F100-FR-022)`,
          term,
        ),
      );
    }
  }

  for (const file of files) {
    const path = rel(file, root);
    const lines = linesOf(file);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] as string;
      const text = prose(line);

      // NB-2: no run-together spelling of a never-bare term.
      for (const term of NEVER_BARE_TERMS) {
        const run = term.replace(" ", "");
        if (new RegExp(`\\b${run}s?\\b`, "i").test(text)) {
          findings.push(
            finding(
              path,
              i + 1,
              `"${run}" is a run-together spelling of the never-bare term "${term}"; ` +
                `it is written in its qualified form (F100-FR-022)`,
              run,
            ),
          );
        }
      }

      // NB-3: no heading is the bare head of a never-bare term.
      const heading = /^#{1,6}\s+(.*)$/.exec(line);
      if (heading !== null && NEVER_BARE_HEADS.includes(normaliseLabel(heading[1] as string))) {
        findings.push(
          finding(
            path,
            i + 1,
            `the heading "${(heading[1] as string).trim()}" is the bare head of a ` +
              `never-bare term; annex A §A.5 requires the qualified form (F100-FR-022)`,
            (heading[1] as string).trim(),
          ),
        );
      }
    }
  }

  // NB-4: "micro-loop" is not the name of diagnosis and acceleration.
  for (const file of specFiles(options)) {
    const path = rel(file, root);
    const lines = linesOf(file);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] as string;
      // A requirement may name what it forbids: the line that states
      // F100-FR-022 quotes the old use in order to rule it out. The generated
      // mirror of the requirement under `contracts/` carries the same text.
      if (line.includes("F100-FR-022") || /never bare/i.test(line)) continue;
      const text = prose(line).replace(MICRO_LOOP_AS_THE_LAYER, " ");
      if (!/micro-loop/i.test(text)) continue;
      if (!DIAGNOSIS_OR_ACCELERATION.test(text)) continue;
      findings.push(
        finding(
          path,
          i + 1,
          `"micro-loop" names diagnosis or acceleration here; the old use is ` +
            `written "${RECOVERY_CYCLE}" (F100-FR-022)`,
          "micro-loop",
        ),
      );
    }
  }
  return Object.freeze(findings);
}

/** OR-1 of F100-FR-023: no requirement assumes a closed list of harnesses. */
export function checkOpenHarnessRegistry(options: CheckOptions = {}): readonly Finding[] {
  const root = options.root ?? ROOT;
  const names = harnessNames(root);
  if (names.length === 0) return Object.freeze([]);
  const findings: Finding[] = [];
  for (const file of specFiles(options)) {
    const path = rel(file, root);
    const lines = linesOf(file);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] as string;
      if (requirementOf(line) === undefined) continue;
      const literals = new Set<string>();
      for (const m of line.matchAll(/`([a-z][a-z0-9-]*)`/g)) {
        if (names.includes(m[1] as string)) literals.add(m[1] as string);
      }
      if (literals.size >= 2) {
        findings.push(
          finding(
            path,
            i + 1,
            `the requirement lists the harnesses ${[...literals].join(", ")} as a ` +
              `closed set; anything that enumerates harnesses reads the resolved ` +
              `registry (F100-FR-023)`,
            [...literals].join(", "),
          ),
        );
      }
    }
  }
  return Object.freeze(findings);
}

/** The check the runner of T264 registers (quickstart.md scenario 3). */
export const vocabularyAndRegistryCheck: StaticCheck = {
  name: "Product-wide rules: vocabulary and the open registry",
  covers: ["F100-FR-022", "F100-FR-023", "F100-SC-004"],
  run(options: CheckOptions = {}) {
    return Object.freeze([...checkNeverBareTerms(options), ...checkOpenHarnessRegistry(options)]);
  },
};

export default vocabularyAndRegistryCheck;
