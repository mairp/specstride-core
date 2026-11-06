/**
 * T085 — the correction list for the orchestrator (F141-FR-033).
 *
 * > "The oracle MUST report every behaviour item with a kept disposition that no
 * > fixture executed, with the families that the traceability files name for it,
 * > and every item whose named family did not execute it while another family
 * > did. The report is the correction list for the orchestrator. An item that no
 * > fixture can execute MUST be proposed for a characterization test or a
 * > register row. The oracle MUST never write the traceability files."
 *
 * Two kinds of row, and they are not the same finding:
 *
 * - `unreached` — a kept item that NO scenario of the exercise map executed. The
 *   row carries the families the `proof` column of the traceability files names
 *   for it, and a proposal: a new scenario where a family is named and could
 *   reach it, a characterization test or a register row where no fixture can.
 * - `wrong-family` — a kept item that the map shows WAS executed, but by a family
 *   other than the one the traceability files name. The row carries both.
 *
 * The last sentence of F141-FR-033 is a rule about this module itself, and it is
 * enforced rather than promised: `TRACEABILITY_FILES` is the list of the files
 * the oracle may never write, `assertNotATraceabilityFile` refuses a destination
 * inside it, and `writeCorrectionList` runs that check before it opens anything.
 * The correction list goes to `packages/oracle/exercise-map/corrections.tsv`,
 * which is a file of the oracle; the orchestrator reads it and decides.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

import { oracleDirectory } from "../index.ts";

import { type ItemRow, isKept } from "./claims.ts";
import { type ExerciseMap, familyOfScenario, scenariosThatExecuted } from "./map.ts";

/** A fault of the correction list. */
export class CorrectionListError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CorrectionListError";
  }
}

/** Where the correction list is written. */
export const CORRECTION_LIST_FILE = join(
  oracleDirectory("exercise-map"),
  "corrections.tsv",
) as string;

/**
 * The traceability files. The oracle never writes one of them: the correction
 * list is a proposal to the orchestrator, and the orchestrator edits them
 * (F141-FR-033).
 */
export const TRACEABILITY_FILES = [
  "traceability.md",
  "traceability-frs.tsv",
  "traceability-items.tsv",
  "R18-behaviour-inventory.tsv",
  "proof-column-changes.tsv",
] as const;

/** Refuse a destination that is a traceability file (F141-FR-033). */
export function assertNotATraceabilityFile(file: string): void {
  const name = basename(resolve(file));
  if ((TRACEABILITY_FILES as readonly string[]).includes(name)) {
    throw new CorrectionListError(
      `the oracle never writes ${name}: the correction list is a proposal to the orchestrator, ` +
        `and the orchestrator edits the traceability files (F141-FR-033)`,
    );
  }
}

/** What a row of the correction list proposes. */
export const PROPOSALS = [
  "another family",
  "a new scenario",
  "a characterization test",
  "a register row",
] as const;
export type Proposal = (typeof PROPOSALS)[number];

/** One row of the correction list. */
export type Correction = {
  readonly kind: "unreached" | "wrong-family";
  readonly item: string;
  readonly cluster: string;
  readonly feature: string;
  readonly evidence: string;
  /** The families the `proof` column of the traceability files names for the item. */
  readonly familiesNamed: readonly string[];
  /** The families of the map that did execute the item; empty for `unreached`. */
  readonly executedBy: readonly string[];
  readonly proposal: Proposal;
  readonly why: string;
};

/** Every `FX-nn` the `proof` column of a row names. */
export function familiesNamedBy(proof: string): readonly string[] {
  return [...new Set([...proof.matchAll(/FX-\d{2}/g)].map((m) => m[0]))].sort();
}

/**
 * An item whose evidence line is in a part of the reference that only runs when
 * a file of the reference is missing or cannot be written is reached by no
 * fixture: the reference tree is read-only (F141-FR-002), so no fixture can
 * delete or lock a file of it. Such an item goes to the correction list with a
 * proposal of a characterization test or a register row (assumption CQ-193).
 */
export type Reachability = {
  /** Items that no fixture CAN execute, by id, with the reason. */
  readonly cannotBeReached: Readonly<Record<string, string>>;
};

/** Build the correction list (F141-FR-033). */
export function buildCorrectionList(options: {
  readonly map: ExerciseMap;
  readonly rows: readonly ItemRow[];
  /** The `proof` column per item, which names the families. */
  readonly proofs: Readonly<Record<string, string>>;
  readonly reachability?: Reachability;
}): readonly Correction[] {
  const cannot = options.reachability?.cannotBeReached ?? {};
  const out: Correction[] = [];
  for (const row of options.rows) {
    if (!isKept(row.disposition)) continue;
    const familiesNamed = familiesNamedBy(options.proofs[row.item] ?? "");
    const scenarios = scenariosThatExecuted(options.map, row.evidence);
    const families = [...new Set(scenarios.map((s) => familyOfScenario(s)))].sort();
    if (families.length === 0) {
      const why = cannot[row.item];
      out.push({
        kind: "unreached",
        item: row.item,
        cluster: row.cluster,
        feature: row.feature,
        evidence: row.evidence,
        familiesNamed,
        executedBy: [],
        proposal:
          why !== undefined
            ? "a characterization test"
            : familiesNamed.length > 0
              ? "a new scenario"
              : "a register row",
        why:
          why ??
          (familiesNamed.length > 0
            ? `no scenario of the exercise map executed ${row.evidence}; the traceability files ` +
              `name ${familiesNamed.join(", ")} for it, so a scenario of one of them is missing`
            : `no scenario of the exercise map executed ${row.evidence} and the traceability ` +
              `files name no family for it`),
      });
      continue;
    }
    const named = familiesNamed.filter((f) => families.includes(f));
    if (familiesNamed.length > 0 && named.length === 0) {
      out.push({
        kind: "wrong-family",
        item: row.item,
        cluster: row.cluster,
        feature: row.feature,
        evidence: row.evidence,
        familiesNamed,
        executedBy: families,
        proposal: "another family",
        why:
          `the traceability files name ${familiesNamed.join(", ")} for ${row.item}, and ` +
          `${families.join(", ")} executed ${row.evidence} while the named family did not`,
      });
    }
  }
  return Object.freeze(out);
}

/** The header of `corrections.tsv`. */
export const CORRECTION_LIST_COLUMNS = [
  "kind",
  "b_item",
  "cluster",
  "feature",
  "evidence",
  "families_named",
  "executed_by",
  "proposal",
  "why",
] as const;

/** The correction list as the text of the file. */
export function correctionListText(corrections: readonly Correction[]): string {
  const lines = [CORRECTION_LIST_COLUMNS.join("\t")];
  for (const row of corrections) {
    lines.push(
      [
        row.kind,
        row.item,
        row.cluster,
        row.feature,
        row.evidence,
        row.familiesNamed.join(" "),
        row.executedBy.join(" "),
        row.proposal,
        row.why.replace(/[\t\n]+/g, " "),
      ].join("\t"),
    );
  }
  return `${lines.join("\n")}\n`;
}

/**
 * Write the correction list. The destination is checked against
 * `TRACEABILITY_FILES` first: the oracle never writes one of them
 * (F141-FR-033).
 */
export function writeCorrectionList(
  corrections: readonly Correction[],
  file: string = CORRECTION_LIST_FILE,
): string {
  assertNotATraceabilityFile(file);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, correctionListText(corrections), "utf8");
  return file;
}

/** The lines of the report, for the orchestrator and the release check. */
export function correctionListLines(corrections: readonly Correction[]): readonly string[] {
  const unreached = corrections.filter((c) => c.kind === "unreached");
  const wrong = corrections.filter((c) => c.kind === "wrong-family");
  return [
    `correction list: ${unreached.length} item(s) no fixture executed, ` +
      `${wrong.length} item(s) executed by another family than the one named`,
    ...corrections.map((c) => `  ${c.kind} ${c.item} ${c.evidence} -> ${c.proposal}`),
  ];
}
