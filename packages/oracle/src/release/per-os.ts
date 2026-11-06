/**
 * T072 — the per-OS expectations, from `per-os-expectations.json` (F141-FR-035).
 *
 * > "The Specstride reference MUST be authoritative on Linux only. On macOS the
 * > port MUST be compared with the Linux capture of the reference and with the
 * > per-OS expectations: the form of the lock differs and the refusal of a second
 * > engine start is compared; a detached job is compared by behaviour; the
 * > temporary directory is resolved to its real path; fixtures use no names that
 * > differ only in case; signals and their exit codes are compared. The
 * > mixture-of-loops reference MUST run live on both systems. Every per-OS
 * > expectation MUST be marked `inferred` until a macOS runner has confirmed it."
 *
 * The expectations are DATA (`packages/oracle/data/per-os-expectations.json`,
 * hand-written and checked against `spec.md` by
 * `contracts/tools/generate.py --check`); this module is the reading of them. It
 * holds no expectation of its own: `expectations()` is the file, and the six
 * subjects F141-FR-035 names in prose are looked up in it by name, so a row that
 * is dropped from the data makes the check fail rather than quietly changing what
 * the oracle expects.
 *
 * `inferred` is not a comment. Until a macOS runner has passed the oracle, the
 * status of every row is `inferred` and the release check says that every statement
 * about macOS is `unverified` (F141-FR-036). `everyExpectationIsInferred` is the
 * reading of the one, `macosStatementsAreUnverified` of the other.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { perOsExpectations } from "../catalogue/data.ts";
import { ORACLE_ROOT } from "../index.ts";

/** A fault of the per-OS expectations. */
export class PerOsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PerOsError";
  }
}

/** The two systems the product is first-class on. */
export const SYSTEMS = ["linux", "macos"] as const;
export type System = (typeof SYSTEMS)[number];

/** One row of `per-os-expectations.json`. */
export type PerOsExpectation = {
  readonly subject: string;
  readonly linux: string;
  readonly macos: string;
};

/** The status every row carries until a macOS runner has confirmed it. */
export const EXPECTATION_STATUS = "inferred" as const;

/** The rows of `per-os-expectations.json`, in the order of the file. */
export function expectations(): readonly PerOsExpectation[] {
  const data = perOsExpectations() as {
    readonly status?: string;
    readonly expectations?: readonly PerOsExpectation[];
  };
  return Object.freeze([...(data.expectations ?? [])]);
}

/** The status line of the data file. */
export function statusOfTheData(): string {
  return String((perOsExpectations() as { readonly status?: string }).status ?? "");
}

/** One expectation by its subject. */
export function expectation(subject: string): PerOsExpectation {
  const found = expectations().find((row) => row.subject === subject);
  if (found === undefined) {
    throw new PerOsError(
      `\`${subject}\` is no subject of packages/oracle/data/per-os-expectations.json; its subjects ` +
        `are ${expectations()
          .map((row) => `\`${row.subject}\``)
          .join(", ")}`,
    );
  }
  return found;
}

/** What one system expects of one subject. */
export function expectedOn(subject: string, system: System): string {
  const row = expectation(subject);
  return system === "linux" ? row.linux : row.macos;
}

/**
 * The subjects F141-FR-035 names in prose, each of which must have a row. The list
 * is the requirement's own order: the two references, then the lock, the detached
 * job, the liveness of a process id, the event time, the temporary directory, the
 * file system and the signals.
 */
export const SUBJECTS_F141_FR_035: readonly string[] = Object.freeze([
  "Specstride reference",
  "mixture-of-loops reference",
  "workspace lock",
  "detached job",
  "liveness of a process id",
  "event time",
  "temporary directory",
  "file system",
  "signals and exit 128+N",
]);

/** F141-FR-035 — every subject the requirement names has a row in the data. */
export function assertEverySubjectOfTheRequirementHasARow(): void {
  const missing = SUBJECTS_F141_FR_035.filter(
    (subject) => !expectations().some((row) => row.subject === subject),
  );
  if (missing.length > 0) {
    throw new PerOsError(
      `packages/oracle/data/per-os-expectations.json has no row for ` +
        `${missing.map((s) => `\`${s}\``).join(", ")}, which F141-FR-035 names`,
    );
  }
}

/**
 * F141-FR-035 — "Every per-OS expectation MUST be marked `inferred` until a macOS
 * runner has confirmed it."
 *
 * The mark is on the FILE and not on each row: one `status` for the whole table,
 * because one macOS run confirms them together — it is the run that is missing, not
 * the confirmation of a single row. What this asserts is that the mark is there and
 * says `inferred`.
 */
export function everyExpectationIsInferred(): boolean {
  return new RegExp(`\\b${EXPECTATION_STATUS}\\b`).test(statusOfTheData());
}

/** F141-FR-035 — the mark is there, and it says `inferred`. */
export function assertEveryExpectationIsInferred(): void {
  if (everyExpectationIsInferred()) return;
  throw new PerOsError(
    `packages/oracle/data/per-os-expectations.json must mark every expectation ` +
      `\`${EXPECTATION_STATUS}\` until a macOS runner has confirmed it (F141-FR-035); its status ` +
      `reads "${statusOfTheData()}"`,
  );
}

// ---------------------------------------------------------------------------
// On macOS the port is compared with the Linux capture
// ---------------------------------------------------------------------------

/** The system the Specstride reference is authoritative on (F141-FR-035). */
export const SYSTEM_THE_SPECSTRIDE_REFERENCE_IS_AUTHORITATIVE_ON: System = "linux";

/** The baseline that runs live on both systems (F141-FR-035). */
export const BASELINE_THAT_RUNS_ON_BOTH_SYSTEMS = "mixture-of-loops" as const;

/** Whether one baseline's reference runs live on one system. */
export function theReferenceRunsLiveOn(system: System, baseline: string): boolean {
  if (baseline === BASELINE_THAT_RUNS_ON_BOTH_SYSTEMS) return true;
  return system === SYSTEM_THE_SPECSTRIDE_REFERENCE_IS_AUTHORITATIVE_ON;
}

/** What one side of one comparison is on one system. */
export type SideOfTheComparison =
  { readonly how: "driven live" } | { readonly how: "the Linux capture"; readonly why: string };

/**
 * How the reference half of a comparison is obtained on one system
 * (F141-FR-035, F141-FR-025).
 *
 * On Linux the reference is driven. On macOS the Specstride reference does not
 * run, so the half is the committed Linux capture that the live run confirmed —
 * which is what `goldenCaptureForThePlatformTier` of the store then produces, and
 * only for a capture the live run confirmed on the same build.
 */
export function referenceHalfOn(system: System, baseline: string): SideOfTheComparison {
  if (theReferenceRunsLiveOn(system, baseline)) return Object.freeze({ how: "driven live" });
  return Object.freeze({
    how: "the Linux capture",
    why:
      `the ${baseline} reference does not run on ${system} (${expectedOn(
        "Specstride reference",
        system,
      )}), so the port is compared with the Linux capture of the reference that the live run ` +
      `confirmed on the same build (F141-FR-025, F141-FR-035)`,
  });
}

/** The five readings of F141-FR-035 that act on a comparison on macOS. */
export type MacosReading = {
  readonly subject: string;
  /** What is compared on macOS instead of what Linux compares. */
  readonly compared: string;
};

/** What macOS compares instead, per subject, read from the data. */
export function macosReadings(): readonly MacosReading[] {
  return Object.freeze(
    [
      "workspace lock",
      "detached job",
      "event time",
      "temporary directory",
      "file system",
      "signals and exit 128+N",
    ].map((subject) => Object.freeze({ subject, compared: expectedOn(subject, "macos") })),
  );
}

// ---------------------------------------------------------------------------
// "fixtures use no names that differ only in case"
// ---------------------------------------------------------------------------

/** Two files of one directory whose names differ only in case. */
export type CaseOnlyPair = {
  readonly directory: string;
  readonly names: readonly [string, string];
};

/** The directories the walk never enters. */
const NEVER_WALKED: readonly string[] = Object.freeze([".git", "node_modules"]);

/**
 * F141-FR-035 — "fixtures use no names that differ only in case". On a
 * case-insensitive file system two such names are one file, so a fixture that held
 * both would lay out a different tree on macOS than on Linux and the comparison
 * would read `different` for a reason that is not the product's.
 */
export function namesThatDifferOnlyInCase(
  root: string = join(ORACLE_ROOT, "fixtures"),
): readonly CaseOnlyPair[] {
  const found: CaseOnlyPair[] = [];
  const walk = (directory: string): void => {
    let children: string[];
    try {
      children = readdirSync(directory);
    } catch {
      return;
    }
    const byLowerCase = new Map<string, string>();
    for (const child of children) {
      const key = child.toLowerCase();
      const held = byLowerCase.get(key);
      if (held !== undefined && held !== child) {
        found.push(Object.freeze({ directory, names: Object.freeze([held, child] as const) }));
      } else {
        byLowerCase.set(key, child);
      }
    }
    for (const child of children) {
      if (NEVER_WALKED.includes(child)) continue;
      const path = join(directory, child);
      try {
        if (statSync(path).isDirectory()) walk(path);
      } catch {
        /* a dangling link is not a name that differs only in case */
      }
    }
  };
  if (existsSync(root)) walk(root);
  return Object.freeze(found);
}

/** F141-FR-035 — no fixture uses two names that differ only in case. */
export function assertNoNameDiffersOnlyInCase(root?: string): void {
  const found = namesThatDifferOnlyInCase(root);
  if (found.length === 0) return;
  throw new PerOsError(
    `the fixtures use ${found.length} pair(s) of names that differ only in case, which ` +
      `F141-FR-035 forbids because macOS would make them one file: ` +
      found.map((pair) => `${pair.directory}: ${pair.names.join(" / ")}`).join("; "),
  );
}

// ---------------------------------------------------------------------------
// "unverified until a macOS runner has confirmed it"
// ---------------------------------------------------------------------------

/** The word every statement about macOS carries until the platform job has passed. */
export const UNVERIFIED = "unverified" as const;

/** Where a passing macOS run of the oracle is recorded. */
export const MACOS_RUN_RECORD_FILE = resolve(
  ORACLE_ROOT,
  "..",
  "..",
  "tests",
  "release",
  "141",
  "macos-verified.json",
);

/** The record of a macOS run of the oracle, as the platform job would write it. */
export type MacosRunRecord = {
  readonly task: "T067";
  readonly requirement: "F141-FR-036";
  readonly build: string;
  readonly runner: string;
  /** Which per-OS expectation held, by subject. */
  readonly expectationsThatHeld: readonly string[];
  readonly expectationsThatDidNot: readonly string[];
  readonly passed: boolean;
};

/** The record of a macOS run, or `undefined` while no runner has passed. */
export function readMacosRunRecord(
  file: string = MACOS_RUN_RECORD_FILE,
): MacosRunRecord | undefined {
  if (!existsSync(file)) return undefined;
  return JSON.parse(readFileSync(file, "utf8")) as MacosRunRecord;
}

/**
 * F141-FR-036 — "Until it has, every statement of any specification about macOS
 * MUST stay `unverified`, and the release check MUST say so."
 */
export function macosStatementsAreUnverified(record: MacosRunRecord | undefined): boolean {
  return record === undefined || !record.passed;
}

/** What the release check says about macOS while no runner has passed. */
export function macosUnverifiedStatement(record: MacosRunRecord | undefined): string {
  if (!macosStatementsAreUnverified(record)) {
    return (
      `macOS: a runner passed the oracle on build ${(record as MacosRunRecord).build}; the ` +
      `per-OS expectations it confirmed are ` +
      `${(record as MacosRunRecord).expectationsThatHeld.join(", ")}`
    );
  }
  return (
    `macOS: no runner has passed the parity oracle, so every statement of every specification ` +
    `about macOS stays \`${UNVERIFIED}\` and every per-OS expectation of ` +
    `packages/oracle/data/per-os-expectations.json stays \`${EXPECTATION_STATUS}\` ` +
    `(F141-FR-035, F141-FR-036). The first run is reported as a research result: ` +
    `tests/release/141/macos-first-run.md`
  );
}
