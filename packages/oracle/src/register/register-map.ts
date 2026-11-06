/**
 * T061 — the register map, its check against the register, and the mapping tables
 * it uses (F141-FR-023).
 *
 * "The oracle MUST hold a register map with one entry for every row of the
 * divergence register … that gives the handling of the row in the oracle: a
 * normalization rule, a switch of the `parity` profile that is off, a mapping
 * table, a waiver, a layer field, not observable, none needed, or no differential
 * test. The suite MUST fail when a register row has no entry, when an entry names a
 * rule, a switch, a table or a waiver that does not exist, or when an entry
 * disagrees with the column 'Oracle handling' of the register."
 *
 * Three failures, and all three are checks against the REGISTER ITSELF, which is
 * `docs/ecosystem/consolidation.md` section 6 — the single copy. The map
 * (`packages/oracle/data/register-map.json`) was generated from it once and
 * corrected by hand, so the check is what keeps the two together.
 *
 * "The mapping tables are those of feature 100: the mode map, the exit-code map of
 * `resume`, the key-name map of the launch contract, and the argument table of each
 * harness adapter, which the harness adapter owns." The first three are read from
 * `@specstride/contracts`; the fourth is owned by each adapter, and
 * `argumentTablesOfHarnessAdapters` reports which of them exist — an entry that
 * names an adapter's table while the adapter has none is reported with that reason
 * and not silently accepted.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  launchContractKeyMap,
  modeMap,
  resumeExitCodeMap,
} from "@specstride/contracts/profile/normalization";
import { profileRows } from "@specstride/contracts/profile/parity";

import { registerMap, type RegisterMapRow } from "../catalogue/data.ts";
import { ruleIds } from "../normalize/types.ts";
import { DV_023_NEEDS_THE_INSTALL_ROOT_LAYER, WAVE_1_WAIVER_ROWS } from "../waivers/waivers.ts";

/** The root of the repository, two levels above `packages/oracle/`. */
const REPOSITORY_ROOT = resolve(
  dirname(dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))))),
);

/** The single copy of the divergence register (F141-FR-023). */
export const REGISTER_FILE = join(REPOSITORY_ROOT, "docs", "ecosystem", "consolidation.md");

/** The section of the register the map is checked against. */
export const REGISTER_SECTION = "6" as const;

/**
 * The count of rows the specification states, and the date it states it on. The
 * register is the authority: a row added after that date must have an entry too,
 * and `checkRegisterMap` compares the map with the register and not with this
 * number. The number is kept so that a reader can see which day the statement of
 * F141-FR-023 was true on.
 */
export const ROWS_ON_2026_09_30 = 119 as const;
export const THE_DATE_OF_THAT_COUNT = "2026-09-30" as const;

/** The eight handlings of a row the oracle knows (§"Closed sets"). */
export const HANDLINGS = [
  "normalization rule",
  "off",
  "mapped",
  "waiver",
  "layer field",
  "not observable",
  "none needed",
  "no differential test",
] as const;
export type Handling = (typeof HANDLINGS)[number];

/** The mapping tables of feature 100 the oracle uses (F141-FR-023). */
export const MAPPING_TABLES = [
  "modeMap",
  "resumeExitCodeMap",
  "launchContractKeyMap",
  "harnessAdapterArgumentTable",
] as const;
export type MappingTable = (typeof MAPPING_TABLES)[number];

/** A register map the suite refuses. */
export class RegisterMapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegisterMapError";
  }
}

/** One row of the register as it stands in section 6. */
export type RegisterRow = {
  readonly row: string;
  /** The cell "Oracle handling", as the register writes it. */
  readonly oracleHandling: string;
};

/**
 * The rows of the divergence register, read from section 6 of the register itself.
 * Every row of the section is a table row whose first cell is `DV-nnn`; the cell
 * "Oracle handling" is the one before the last ("Owner's ruling").
 */
export function readRegister(file: string = REGISTER_FILE): readonly RegisterRow[] {
  if (!existsSync(file)) {
    throw new RegisterMapError(
      `${file} does not exist; the divergence register is the single copy and the register map is ` +
        `checked against it (F141-FR-023)`,
    );
  }
  const rows: RegisterRow[] = [];
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!/^\|\s*DV-\d{3}\s*\|/.test(line)) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    const row = (cells[0] ?? "").trim();
    // The last cell is "Owner's ruling"; the one before it is "Oracle handling".
    const oracleHandling = cells[cells.length - 2] ?? "";
    rows.push({ row, oracleHandling });
  }
  return Object.freeze(rows);
}

/**
 * Which handlings the cell of the register names. The register writes them in
 * prose and in bold ("**Not observable** as a difference: …"), which is why the
 * cell is read for the WORDS of the closed set and not parsed as a value.
 */
export function handlingsOfCell(cell: string): readonly Handling[] {
  const text = cell.toLowerCase();
  const found: Handling[] = [];
  const says: readonly [Handling, readonly string[]][] = [
    // A rule is named by its id (`N-24`) or by the words of the closed set.
    [
      "normalization rule",
      ["normalization rule", "normalized", "normalization", "n-0", "n-1", "n-2"],
    ],
    // The register writes a switch that is off as "**Off.**", "off in the oracle"
    // or by naming the row of the `parity` profile.
    [
      "off",
      ["**off", "off.", "off:", "off in the oracle", "switch", "profile row", "parity profile"],
    ],
    ["mapped", ["mapped", "mapping table", "the mode map", "exit-code map", "key-name map"]],
    ["waiver", ["waiver", "waived"]],
    // "layer field" is the handling of the SECOND suite; the plugin allowlist of
    // DV-091 is another allowlist and is not one.
    ["layer field", ["layer field", "layer allowlist"]],
    ["not observable", ["not observable"]],
    ["none needed", ["none needed", "no handling needed"]],
    // A row with no reference has no differential test; the register says so in
    // those words or by sending the behaviour to the feature's own tests.
    [
      "no differential test",
      ["no differential test", "no parity test", "no reference", "own tests"],
    ],
  ];
  for (const [handling, markers] of says) {
    if (markers.some((marker) => text.includes(marker))) found.push(handling);
  }
  return Object.freeze(found);
}

/** What exists in the oracle that an entry of the map may name. */
export function whatExists(): {
  readonly rules: readonly string[];
  readonly switches: readonly string[];
  readonly tables: readonly string[];
  readonly waiverRows: readonly string[];
} {
  return Object.freeze({
    rules: ruleIds(),
    switches: Object.freeze(profileRows.flatMap((row) => [...row.keys])),
    tables: Object.freeze([...MAPPING_TABLES]),
    waiverRows: WAVE_1_WAIVER_ROWS,
  });
}

/** One finding of the check of the register map. */
export type RegisterFinding = {
  readonly row: string;
  readonly kind:
    "no entry" | "names what does not exist" | "disagrees with the register" | "no row";
  readonly detail: string;
};

/**
 * The three failures of F141-FR-023. Returns the findings; the suite fails on any
 * of them, and `assertRegisterMapHoldsUp` is what fails it.
 */
export function checkRegisterMap(
  options: { readonly registerFile?: string } = {},
): readonly RegisterFinding[] {
  const register = readRegister(options.registerFile ?? REGISTER_FILE);
  const map = registerMap().rows;
  const exists = whatExists();
  const findings: RegisterFinding[] = [];

  // 1. a register row with no entry.
  for (const row of register) {
    if (!map.some((entry) => entry.row === row.row)) {
      findings.push({
        row: row.row,
        kind: "no entry",
        detail: `the register holds ${row.row} and the register map has no entry for it`,
      });
    }
  }
  // An entry for a row the register does not hold is the same defect seen from the
  // other side: the map would carry a handling for nothing.
  for (const entry of map) {
    if (!register.some((row) => row.row === entry.row)) {
      findings.push({
        row: entry.row,
        kind: "no row",
        detail: `the register map holds an entry for ${entry.row} and the register has no such row`,
      });
    }
  }

  for (const entry of map) {
    const row = register.find((r) => r.row === entry.row);
    if (row === undefined) continue;

    // 2. an entry that names a rule, a switch, a table or a waiver that does not exist.
    for (const rule of entry.rules) {
      if (
        !exists.rules.includes(rule) &&
        !exists.switches.includes(rule) &&
        !exists.tables.includes(rule)
      ) {
        findings.push({
          row: entry.row,
          kind: "names what does not exist",
          detail: `${entry.row} names ${rule}, which is no rule of feature 100, no switch of the parity profile and no mapping table of the oracle`,
        });
      }
    }
    if (
      entry.handling.includes("waiver") &&
      !exists.waiverRows.includes(entry.row) &&
      entry.row !== DV_023_NEEDS_THE_INSTALL_ROOT_LAYER
    ) {
      findings.push({
        row: entry.row,
        kind: "names what does not exist",
        detail:
          `${entry.row} is handled by a waiver, and no waiver of Wave 1 is written for it ` +
          `(F141-FR-022). ${DV_023_NEEDS_THE_INSTALL_ROOT_LAYER} is the one row outside that list ` +
          `which may carry one: its waiver is written only together with a fixture that tests the ` +
          `install-root layer`,
      });
    }
    for (const handling of entry.handling) {
      if (!(HANDLINGS as readonly string[]).includes(handling)) {
        findings.push({
          row: entry.row,
          kind: "names what does not exist",
          detail: `${entry.row} is handled as "${handling}", which is no handling of the closed set (${HANDLINGS.join(", ")})`,
        });
      }
    }

    // 3. an entry that disagrees with the column "Oracle handling" of the register.
    const said = handlingsOfCell(row.oracleHandling);
    if (
      said.length > 0 &&
      !entry.handling.some((handling) => said.includes(handling as Handling))
    ) {
      findings.push({
        row: entry.row,
        kind: "disagrees with the register",
        detail:
          `${entry.row} is handled as "${entry.handling.join(", ")}" in the register map and the ` +
          `register says "${said.join(", ")}" (${row.oracleHandling.slice(0, 120)})`,
      });
    }
  }
  return Object.freeze(findings);
}

/** The suite fails when the register map does not hold up (F141-FR-023). */
export function assertRegisterMapHoldsUp(options: { readonly registerFile?: string } = {}): void {
  const findings = checkRegisterMap(options);
  if (findings.length === 0) return;
  throw new RegisterMapError(
    `the register map does not hold up and the suite therefore fails (F141-FR-023): ` +
      `${findings.map((f) => `${f.row} [${f.kind}] ${f.detail}`).join("; ")}`,
  );
}

/** The entry of one row of the register. */
export function entryOf(row: string): RegisterMapRow | undefined {
  return registerMap().rows.find((entry) => entry.row === row);
}

/** The rows of the register handled by each handling. */
export function rowsByHandling(): Readonly<Record<string, readonly string[]>> {
  const by: Record<string, string[]> = {};
  for (const entry of registerMap().rows) {
    for (const handling of entry.handling) (by[handling] ??= []).push(entry.row);
  }
  return Object.freeze(by);
}

// ---------------------------------------------------------------------------
// The mapping tables of feature 100 (F141-FR-023)
// ---------------------------------------------------------------------------

/** The mode map of feature 100: the as-is mode and the mode of the product. */
export function theModeMap(): Readonly<Record<string, string>> {
  return modeMap;
}

/** The exit-code map of `resume`: the as-is code, its cause and the code of the product. */
export function theResumeExitCodeMap(): typeof resumeExitCodeMap {
  return resumeExitCodeMap;
}

/** The key-name map of the launch contract. */
export function theLaunchContractKeyMap(): Readonly<Record<string, string>> {
  return launchContractKeyMap;
}

/** Where the argument table of one harness adapter lives, and whether it is built. */
export type ArgumentTableReading = {
  readonly harness: string;
  readonly package: string;
  readonly built: boolean;
  readonly reason?: string;
};

/** The harnesses with a Wave 1 harness adapter, each of which owns its argument table. */
export const HARNESSES_WITH_AN_ADAPTER = ["claude", "dsh", "codex", "prime", "pi"] as const;

/**
 * The argument table of each harness adapter. The adapter OWNS the table
 * (F141-FR-023), so the oracle reads where it is and reports an adapter that is
 * still a skeleton of the campaign scaffolding with that reason. An entry of the
 * register map that is handled by such a table while the adapter has none is
 * therefore visible, and not silently accepted.
 */
export function argumentTablesOfHarnessAdapters(
  root: string = REPOSITORY_ROOT,
): readonly ArgumentTableReading[] {
  return Object.freeze(
    HARNESSES_WITH_AN_ADAPTER.map((harness) => {
      const packageName = `@specstride/adapter-${harness}`;
      const manifest = join(root, "packages", `adapter-${harness}`, "package.json");
      if (!existsSync(manifest)) {
        return {
          harness,
          package: packageName,
          built: false,
          reason: `${manifest} does not exist`,
        };
      }
      const parsed = JSON.parse(readFileSync(manifest, "utf8")) as {
        specstride?: { skeleton?: unknown };
      };
      if (parsed.specstride?.skeleton === true) {
        return {
          harness,
          package: packageName,
          built: false,
          reason:
            `${packageName} is still a skeleton of the campaign scaffolding; the argument table of ` +
            `the ${harness} adapter is owned by that feature and is not built yet`,
        };
      }
      return { harness, package: packageName, built: true };
    }),
  );
}
