/**
 * T122 — the registry entry that the port does not carry (F141-FR-029, §O.7,
 * CQ-029, DV-064).
 *
 * The backend registry of the Specstride baseline holds one entry whose harness
 * the product does not carry: it is a local shell function of the machine the
 * baseline was developed on, and §O.7 settles it as "no fixture, no stub name, no
 * imported asset". But the reference PRINTS its registry — the display line of
 * `lib/backends.py` joins the spelling of every entry with " | ", and the unknown
 * backend message of the pass loop and the registry queries of FX-26 both carry
 * that line. So the name reaches a capture of the reference whether the oracle
 * names it or not.
 *
 * Three obligations of F141-FR-029 are met here, and the first is what makes the
 * other two possible:
 *
 * 1. **Found at run time, never held in a file.** `notCarriedEntries` reads the
 *    registry of the reference out of the read-only tree at the pinned commit and
 *    subtracts the entries with as-is behaviour that the product carries. No
 *    module, no data file and no fixture of the oracle holds the name — which is
 *    why this module is a few lines of set arithmetic and not a list.
 * 2. **Taken out before anything is stored or compared.** `takeOutNotCarried`
 *    removes the entry's spelling from the text of a capture, with the separator
 *    that joined it to its neighbours, so the list of the reference reads as the
 *    list of the port and the name is in no golden capture, report or log. CQ-029
 *    settles that this is the handling of N-15, so the rule calls it and counts
 *    its replacements as its own.
 * 3. **A check that fails when the name appears in a file of the oracle.**
 *    `filesOfTheOracleThatNameAnEntry` scans the package, golden captures
 *    included, for a name found in this way.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { harnessesOfTheRegistry, REGISTRY_SOURCE } from "../../stubs/lib/names.ts";
import { stubVocabulary } from "../catalogue/data.ts";
import { replaceInSurfaces } from "./walk.ts";
import type { MutableCapture, NormalizeContext } from "./types.ts";

/**
 * `packages/oracle/`. Computed here rather than imported from `src/index.ts`,
 * which re-exports the normalizer: a rule of the normalizer that imported the
 * barrel would close a cycle around its own module.
 */
const ORACLE_ROOT = resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));

/** Where the registry of each side is read from (the source is data of `names.ts`). */
export { REGISTRY_SOURCE };

/** A reading of the two registries that cannot be made. */
export class NotCarriedEntryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotCarriedEntryError";
  }
}

/**
 * The entries with as-is behaviour that the product carries. The registry of the
 * port is read where the product has one; until the product exists, the harnesses
 * whose stub entry of §O.3 says it serves BOTH sides are what the product carries
 * by construction — an entry of `harnessStubs` with as-is behaviour on the
 * reference and on the port. Neither reading names the entry that is missing: the
 * subtraction does.
 */
export function entriesTheProductCarries(portRoot?: string): readonly string[] {
  if (portRoot !== undefined) {
    const reading = harnessesOfTheRegistry("port", portRoot);
    if (reading.unread === undefined && reading.entries.length > 0) {
      return Object.freeze([...reading.entries]);
    }
  }
  return Object.freeze(
    stubVocabulary()
      .harnessStubs.filter((entry) => entry.sides === "both")
      .map((entry) => entry.harness),
  );
}

/** The entries of the registry of the reference, read out of its tree. */
export function entriesOfTheReferenceRegistry(referenceRoot: string): readonly string[] {
  return harnessesOfTheRegistry("reference", referenceRoot).entries;
}

/**
 * The entries of the reference registry that the product does not carry, found at
 * run time (F141-FR-029). On a reference tree with no registry — the
 * mixture-of-loops baseline has none — the answer is empty and nothing is taken
 * out of anything.
 */
export function notCarriedEntries(options: {
  readonly referenceRoot: string;
  readonly portRoot?: string;
}): readonly string[] {
  const carried = new Set(entriesTheProductCarries(options.portRoot));
  return Object.freeze(
    entriesOfTheReferenceRegistry(options.referenceRoot).filter((name) => !carried.has(name)),
  );
}

/** A name as a part of a pattern. */
function quoted(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * The spellings one entry has in a listing: the bare name, and the name with the
 * qualifier that `spelling()` of the baseline writes for a role — `name[:label]`
 * for an optional qualifier and `name:label` for a required one.
 */
export function spellingsOfAnEntry(name: string): RegExp {
  return new RegExp(`(?<![\\w-])${quoted(name)}(\\[:[^\\]]*\\]|:[A-Za-z0-9._/-]+)?(?![\\w-])`, "g");
}

/** How many times the entry stands in a text, with or without its qualifier. */
export function mentionsOfAnEntry(text: string, name: string): number {
  return [...text.matchAll(spellingsOfAnEntry(name))].length;
}

/**
 * Whether a text holds the name at all, inside a word included. The SCAN uses
 * this and the removal does not: a file name of the baseline carries the name
 * between underscores (`…__test_golden_<name>_matches_…`), which is no mention of
 * the registry entry in a listing but is exactly what F141-FR-029 forbids a file
 * of the oracle to hold. The reading matches `assertAssetIsNotOfTheEntryNotCarried`
 * of `src/catalogue/fixture.ts`, which refuses an asset by the same containment.
 */
export function namesAnEntry(text: string, name: string): boolean {
  return text.toLowerCase().includes(name.toLowerCase());
}

/**
 * The text with the entry taken out: the spelling and the separator that joined it
 * to its neighbours — " | " of the display line of the registry, or the comma of a
 * list — so what is left reads as the list of a side that never held the entry. A
 * line that says nothing but the entry is dropped whole.
 */
export function withoutAnEntry(text: string, name: string): string {
  const spelling = spellingsOfAnEntry(name).source;
  const lines = text.split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    if (mentionsOfAnEntry(line, name) === 0) {
      kept.push(line);
      continue;
    }
    // A line that is nothing but the entry (and separators) carries no other
    // behaviour, so it goes with the entry.
    const withoutIt = line.replace(new RegExp(spelling, "g"), "");
    if (/^[\s|,"'[\]]*$/.test(withoutIt) && line.trim() !== "") continue;
    let value = line;
    // The separator BEFORE the entry, then the separator after it, then the bare
    // spelling: a list of three entries loses exactly one separator per entry.
    value = value.replace(new RegExp(`\\s*\\|\\s*${spelling}`, "g"), "");
    value = value.replace(new RegExp(`${spelling}\\s*\\|\\s*`, "g"), "");
    value = value.replace(new RegExp(`"${spelling}"\\s*,\\s*`, "g"), "");
    value = value.replace(new RegExp(`\\s*,\\s*"${spelling}"`, "g"), "");
    value = value.replace(new RegExp(`${spelling}\\s*,\\s*`, "g"), "");
    value = value.replace(new RegExp(`\\s*,\\s*${spelling}`, "g"), "");
    value = value.replace(new RegExp(spelling, "g"), "");
    kept.push(value);
  }
  return kept.join("\n");
}

/** The surfaces a listing of the registry can reach. */
export const SURFACES_A_LISTING_REACHES: readonly string[] = Object.freeze([
  "stdout",
  "stderr",
  "transcript",
  "events",
  "tree",
  "state",
  "home",
  "pipeline",
  "launcher",
]);

/**
 * Take every not-carried entry out of a capture, and give back how many mentions
 * were removed. The entries are found from the roots of the side being
 * normalized: `<IMPL>` is the read-only reference tree of this run on the
 * reference side and the repository of the product on the port side.
 */
export function takeOutNotCarried(capture: MutableCapture, context: NormalizeContext): number {
  const implementation = context.roots.find((root) => root.placeholder === "<IMPL>")?.path;
  if (implementation === undefined) return 0;
  const entries =
    context.side === "reference"
      ? notCarriedEntries({ referenceRoot: implementation })
      : // The port carries no entry the reference does not: what the port has and
        // the reference lacks is a NEW harness, which is a difference and never
        // something to take out (F141-FR-024).
        [];
  if (entries.length === 0) return 0;
  let removed = 0;
  replaceInSurfaces(capture.surfaces, SURFACES_A_LISTING_REACHES, (value) => {
    let text = value;
    for (const name of entries) {
      const mentions = mentionsOfAnEntry(text, name);
      if (mentions === 0) continue;
      removed += mentions;
      text = withoutAnEntry(text, name);
    }
    return text;
  });
  return removed;
}

/** One place a file of the oracle names an entry the port does not carry. */
export type NameInAFileOfTheOracle = {
  readonly file: string;
  readonly line: number;
  readonly name: string;
};

/** Directories of the package that hold no file of the oracle's own making. */
const NOT_SCANNED: readonly string[] = Object.freeze(["node_modules", ".git"]);

/** Every file under a root, in a stable order. */
function filesUnder(root: string): readonly string[] {
  const found: string[] = [];
  const walk = (directory: string): void => {
    for (const name of readdirSync(directory).sort()) {
      if (NOT_SCANNED.includes(name)) continue;
      const path = join(directory, name);
      const stats = statSync(path);
      if (stats.isDirectory()) walk(path);
      else if (stats.isFile()) found.push(path);
    }
  };
  walk(root);
  return Object.freeze(found);
}

/**
 * The files of the oracle that name an entry found at run time — golden captures
 * included, which is where a name would land if the handling above were missing.
 * The scan reads the names it looks for from the registry of the reference and
 * holds none of its own.
 */
export function filesOfTheOracleThatNameAnEntry(options: {
  readonly referenceRoot: string;
  readonly oracleRoot?: string;
  readonly portRoot?: string;
}): readonly NameInAFileOfTheOracle[] {
  const root = resolve(options.oracleRoot ?? ORACLE_ROOT);
  const entries = notCarriedEntries({
    referenceRoot: options.referenceRoot,
    ...(options.portRoot === undefined ? {} : { portRoot: options.portRoot }),
  });
  if (entries.length === 0) return Object.freeze([]);
  const findings: NameInAFileOfTheOracle[] = [];
  for (const file of filesUnder(root)) {
    let text: string;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const lines = text.split("\n");
    for (const name of entries) {
      // The path of the file counts too: an imported asset of that entry would be
      // found by its NAME and not by its content.
      if (namesAnEntry(relative(root, file), name)) {
        findings.push({ file: relative(root, file), line: 0, name });
      }
      for (let i = 0; i < lines.length; i += 1) {
        if (namesAnEntry(lines[i] as string, name)) {
          findings.push({ file: relative(root, file), line: i + 1, name });
        }
      }
    }
  }
  return Object.freeze(findings);
}

/**
 * The check F141-FR-029 asks for: a name found at run time that appears in a file
 * of the oracle fails. The message names the file and the line and NOT the name:
 * the failure is read beside the tree, and the report of the oracle is one of the
 * places the name may not reach.
 */
export function assertNoFileOfTheOracleNamesAnEntry(options: {
  readonly referenceRoot: string;
  readonly oracleRoot?: string;
  readonly portRoot?: string;
}): void {
  const findings = filesOfTheOracleThatNameAnEntry(options);
  if (findings.length === 0) return;
  throw new NotCarriedEntryError(
    `${String(findings.length)} place(s) in the files of the oracle name an entry of the reference ` +
      `registry that the product does not carry; §O.7 gives it no fixture, no stub name and no ` +
      `imported asset, and F141-FR-029 forbids its name in any file of the oracle: ` +
      findings.map((f) => `${f.file}:${String(f.line)}`).join(", "),
  );
}
