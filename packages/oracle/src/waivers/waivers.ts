/**
 * T060 — the waiver file, its matching and its two failures (F141-FR-022).
 *
 * "Waivers MUST live in one file, each keyed by fixture, surface and register row,
 * and each naming the difference it accepts. A waiver MUST be accepted only when
 * its register row exists and its oracle handling says 'waiver'. A waiver that
 * matches no difference MUST fail the suite. A waiver MUST never accept a
 * difference in another fixture or surface than its own."
 *
 * The ONE file is `packages/oracle/waivers.json`, held to
 * `data/schemas/waivers.schema.json`. The two failures are:
 *
 * 1. a waiver whose register row does not exist, or whose row's oracle handling is
 *    not "waiver" — REFUSED, at load time, before any comparison;
 * 2. a waiver that matched no difference over the whole suite — the suite FAILS
 *    and names the waiver (§O.5 rule 3, F141-SC-010).
 *
 * The third sentence is the one the key enforces: a waiver names its fixture and
 * its surface, and `matches` compares both, so a waiver can never reach another
 * fixture or another surface. `DV-112` has one more condition of its own — a waiver
 * for it is written only for a scenario in which the prime stub is called — and
 * `DV-023` one more still; both are checked here.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ORACLE_ROOT } from "../index.ts";
import { registerMap, schemaOf } from "../catalogue/data.ts";
import { check, violationsAsText } from "../catalogue/schema.ts";

/** The one waiver file (F141-FR-022). */
export const WAIVER_FILE = join(ORACLE_ROOT, "waivers.json");

/** The handling of a register row that a waiver needs (F141-FR-022). */
export const HANDLING_THAT_ALLOWS_A_WAIVER = "waiver" as const;

/**
 * The rows of the register the waivers of Wave 1 are written for (F141-FR-022).
 * The list is the requirement's own; a waiver for a row outside it is refused by
 * the register map anyway, and this list makes the refusal legible.
 */
export const WAVE_1_WAIVER_ROWS: readonly string[] = Object.freeze([
  "DV-004",
  "DV-009",
  "DV-022",
  "DV-024",
  "DV-029",
  "DV-032",
  "DV-058",
  "DV-060",
  "DV-073",
  "DV-075",
  "DV-107",
  "DV-112",
]);

/** A waiver for DV-112 is written only for a scenario in which the prime stub is called. */
export const DV_112_NEEDS_THE_PRIME_STUB = "DV-112" as const;

/**
 * Whether the prime stub is CALLED in a scenario, read off its declaration: the
 * harness of a role is the value of the as-is variable that names it, and the prime
 * stub is started exactly when one of the two names prime (bare or with a variant).
 * DV-112 is a waiver only for such a scenario — "in the prime scenarios of FX-18 the
 * pass fails before the harness starts, so a waiver there would match nothing" — and
 * a scenario that names a missing executable of prime starts no process either.
 */
export function primeStubIsCalledBy(declaration: Readonly<Record<string, unknown>>): boolean {
  const environment = (declaration["environment"] ?? {}) as Record<string, string>;
  const roles = ["SPECSTRIDE_PROPOSER", "SPECSTRIDE_CRITIC"];
  const namesPrime = roles.some((role) => /^prime(:|$)/.test(environment[role] ?? ""));
  if (!namesPrime) return false;
  // An executable that does not exist is never started: the arm ends with 127 before
  // the stub is reached.
  const bins = ["SPECSTRIDE_PRIME_AGENT_BIN", "SPECSTRIDE_PRIME_FLEET_BIN", "SPECSTRIDE_PRIME_BIN"];
  const named = bins.map((name) => environment[name]).filter((value) => value !== undefined);
  return named.every(
    (value) => value === "prime" || value === "prime-agent" || value === "stub-harness",
  );
}

/** A waiver for DV-023 is written only together with a fixture that tests that layer. */
export const DV_023_NEEDS_THE_INSTALL_ROOT_LAYER = "DV-023" as const;

/** A waiver the oracle refuses. */
export class WaiverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WaiverError";
  }
}

/** The difference one waiver accepts. */
export type WaivedDifference = {
  readonly selector: string;
  readonly reference: unknown;
  readonly port: unknown;
};

/** One waiver: keyed by fixture, surface and register row. */
export type Waiver = {
  readonly fixture: string;
  readonly surface: string;
  readonly row: string;
  readonly difference: WaivedDifference;
  readonly os?: readonly string[];
};

/** The one waiver file, as it is on disk. */
export type WaiverFile = { readonly schema: string; readonly waivers: readonly Waiver[] };

/** Read and check the one waiver file. */
export function readWaiverFile(file: string = WAIVER_FILE): WaiverFile {
  const parsed = JSON.parse(readFileSync(file, "utf8")) as unknown;
  const violations = check(schemaOf("waivers.schema.json"), parsed);
  if (violations.length > 0) {
    throw new WaiverError(`${file}: ${violationsAsText(violations)}`);
  }
  return parsed as WaiverFile;
}

/**
 * The first failure: a waiver is accepted only when its register row exists and
 * the row's oracle handling says "waiver" (F141-FR-022). Every waiver of the file
 * goes through this before any comparison.
 */
export function assertWaiverIsAllowed(
  waiver: Waiver,
  options: {
    readonly primeStubIsCalled?: boolean;
    readonly testsTheInstallRootLayer?: boolean;
  } = {},
): void {
  const row = registerMap().rows.find((r) => r.row === waiver.row);
  if (row === undefined) {
    throw new WaiverError(
      `the waiver for ${waiver.fixture} / ${waiver.surface} names the register row ${waiver.row}, ` +
        `which the register does not hold. A waiver is accepted only with a row of the divergence ` +
        `register (F141-FR-022, §O.5 rule 5)`,
    );
  }
  if (!row.handling.includes(HANDLING_THAT_ALLOWS_A_WAIVER)) {
    throw new WaiverError(
      `the waiver for ${waiver.fixture} / ${waiver.surface} names ${waiver.row}, whose oracle ` +
        `handling is "${row.handling.join(", ")}" and does not say ` +
        `"${HANDLING_THAT_ALLOWS_A_WAIVER}". A waiver is ` +
        `added only with a row whose oracle handling says waiver (F141-FR-022, §O.5 rule 5)`,
    );
  }
  if (waiver.row === DV_112_NEEDS_THE_PRIME_STUB && options.primeStubIsCalled !== true) {
    throw new WaiverError(
      `the waiver for ${waiver.fixture} / ${waiver.surface} names ${DV_112_NEEDS_THE_PRIME_STUB}, ` +
        `and a waiver for that row is written only for a scenario in which the prime stub is ` +
        `called (F141-FR-022)`,
    );
  }
  if (
    waiver.row === DV_023_NEEDS_THE_INSTALL_ROOT_LAYER &&
    options.testsTheInstallRootLayer !== true
  ) {
    throw new WaiverError(
      `the waiver for ${waiver.fixture} / ${waiver.surface} names ` +
        `${DV_023_NEEDS_THE_INSTALL_ROOT_LAYER}, and a waiver for that row is written only ` +
        `together with a fixture that tests that layer (F141-FR-022)`,
    );
  }
}

/** One difference the comparator found, which a waiver may or may not accept. */
export type Difference = {
  readonly fixture: string;
  readonly surface: string;
  readonly selector: string;
  readonly reference: unknown;
  readonly port: unknown;
};

/**
 * Whether a waiver accepts one difference. The fixture AND the surface must be the
 * waiver's own — that is the whole of "a waiver MUST never accept a difference in
 * another fixture or surface than its own" — and the selector and the two values
 * must be the ones the waiver names.
 */
export function matches(
  waiver: Waiver,
  difference: Difference,
  os = process.platform === "darwin" ? "macos" : "linux",
): boolean {
  if (waiver.fixture !== difference.fixture) return false;
  if (waiver.surface !== difference.surface) return false;
  if (waiver.os !== undefined && !waiver.os.includes(os)) return false;
  if (waiver.difference.selector !== difference.selector) return false;
  return (
    JSON.stringify(waiver.difference.reference) === JSON.stringify(difference.reference) &&
    JSON.stringify(waiver.difference.port) === JSON.stringify(difference.port)
  );
}

/** The waiver that accepts one difference, where one does. */
export function waiverFor(waivers: readonly Waiver[], difference: Difference): Waiver | undefined {
  return waivers.find((waiver) => matches(waiver, difference));
}

/** What a run of the suite recorded about the waivers. */
export type WaiverUse = {
  readonly waiver: Waiver;
  readonly matched: number;
};

/** A key for a waiver, for the report. */
export function keyOf(waiver: Waiver): string {
  return `${waiver.fixture} / ${waiver.surface} / ${waiver.row} / ${waiver.difference.selector}`;
}

/** Count how often each waiver matched a difference of a suite. */
export function useOfWaivers(
  waivers: readonly Waiver[],
  differences: readonly Difference[],
): readonly WaiverUse[] {
  return Object.freeze(
    waivers.map((waiver) => ({
      waiver,
      matched: differences.filter((difference) => matches(waiver, difference)).length,
    })),
  );
}

/**
 * The second failure: a waiver that matched no difference over the whole suite
 * fails the suite and is named (§O.5 rule 3, F141-SC-010, quickstart scenario 8).
 */
export function assertEveryWaiverMatchedSomething(uses: readonly WaiverUse[]): void {
  const idle = uses.filter((use) => use.matched === 0);
  if (idle.length === 0) return;
  throw new WaiverError(
    `${String(idle.length)} waiver(s) matched no difference in any fixture of the suite and the ` +
      `suite therefore fails (§O.5 rule 3, F141-FR-022): ` +
      `${idle.map((use) => keyOf(use.waiver)).join("; ")}`,
  );
}
