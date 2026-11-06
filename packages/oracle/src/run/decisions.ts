/**
 * T145 — the owner decisions and the known tensions, as the runner applies
 * them (F141-FR-043).
 *
 * "Micro-loops: off in the first suite, the second suite as above" — that is
 * the profile of feature 100, and `suite2/runner.ts` owns it. What THIS module
 * owns is the part of the decisions that changes how a command is driven:
 *
 * - **Counts that survive a resume (DV-011, DV-044)**: the resume scenarios of
 *   FX-13 pass the reset flag on the port. The port takes `--reset-counts` on
 *   `resume` from the command line only (F100-FR-045); the reference resets
 *   its counts in the resume path itself. So the oracle appends the flag to
 *   the port's resume step and to nothing else, and the counters the two sides
 *   compare start from the same place.
 * - **Launch by default (DV-009)**: the oracle drives commands and never a
 *   host skill. The modes of FX-36 are driven through the MODE MAP of feature
 *   100 (`@specstride/contracts`, `modeMap`), never re-implemented here. The
 *   one case the map does not cover — `mode-no-execution-phrasing`, where the
 *   reference reads `generate` and the port `run` — is the DV-009 waiver, and
 *   `modeThroughTheModeMap` reports it instead of inventing a mapping.
 *
 * The treatments that change no command are recorded here as the checks a test
 * reads, so that F141-FR-043 is one place and not a folklore:
 *
 * - **Session continuation (DV-010)**: off, and the comparator asserts from the
 *   stub transcripts that no invocation carried a continuation argument
 *   (`sessionContinuations` of `capture/transcript.ts`).
 * - **Default proposer and critic (DV-004)**: every fixture names both roles;
 *   the one fixture that names none (`FX-01/defaults-no-role-named`) is waived.
 * - **Quota pause (DV-005)**: no stub emits a quota signal — no verb of the
 *   stub vocabulary emits one, so consecutive errors take the old path.
 * - **Staleness (DV-082)**: checked where the reference checks it — the check
 *   happens at critic start, which is where the `parity` profile leaves it.
 * - **Glob expansion (DV-019)**: compared as it is, with no waiver — FX-25
 *   compares the wildcard line itself.
 */
import { modeMap } from "@specstride/contracts/profile/normalization";

/** One step of a scenario, in the shape the driver builds and the fixture declares. */
export type DecisionStep = {
  readonly argv: readonly string[];
  readonly resumeCause?: string;
  readonly boundedSeconds?: number;
};

/** The family whose resume scenarios pass the reset flag on the port (DV-011). */
export const RESUME_FIXTURE_FAMILY = "FX-13" as const;

/** The reset flag of the port's `resume` (F100-FR-045). */
export const RESET_COUNTS_FLAG = "--reset-counts" as const;

/** The family whose modes are driven through the mode map (DV-009). */
export const MODE_MAP_FAMILY = "FX-36" as const;

/** The one case of the mode map that is a waiver, not a mapping (DV-009). */
export const MODE_MAP_WAIVED_CASE = "mode-no-execution-phrasing" as const;

/** The register row of that waiver. */
export const MODE_MAP_WAIVER_ROW = "DV-009" as const;

/** The mode value in an FX-36 port command line, with where it stood. */
export type ModeUsage = {
  readonly kind: "flag" | "token";
  /** The value the command line carries, as the reference spells it. */
  readonly asIs: string;
  /** What the mode map makes of it. */
  readonly mapped: string;
};

/**
 * The mode value an FX-36 command line carries, and what the map makes of it.
 * The supervisor of the baseline spells a token mode as `--token=<mode>` and a
 * plain mode as `--<mode>`; both readings are here, and the map — the one copy
 * feature 100 keeps — is the only table this module consults.
 */
export function modeUsageOf(argv: readonly string[]): ModeUsage | undefined {
  for (const argument of argv) {
    const token = /^--token=(.+)$/.exec(argument);
    if (token !== null) {
      const asIs = token[1] as string;
      return { kind: "token", asIs, mapped: modeThroughTheModeMap(asIs) };
    }
    const plain = /^--([a-z][a-z-]+)$/.exec(argument);
    if (plain !== null) {
      const asIs = plain[1] as string;
      if (modeMap[asIs] !== undefined) {
        return { kind: "flag", asIs, mapped: modeThroughTheModeMap(asIs) };
      }
    }
  }
  return undefined;
}

/** One value of a mode, through the mode map of feature 100. */
export function modeThroughTheModeMap(asIs: string): string {
  const mapped = modeMap[asIs];
  return mapped ?? asIs;
}

/**
 * The owner decisions applied to the steps of one side of one fixture. The
 * reference side is never touched: the reference runs the fixture exactly as
 * the first suite ran it, and every decision here exists to make the PORT
 * comparable with it.
 */
export function applyOwnerDecisions(
  steps: readonly DecisionStep[],
  options: { readonly side: "reference" | "port"; readonly fixtureId?: string },
): readonly DecisionStep[] {
  if (options.side !== "port") return steps;
  const id = options.fixtureId ?? "";
  return Object.freeze(
    steps.map((step) => {
      // DV-011, DV-044: a resume step of FX-13 passes the reset flag on the
      // port. A resume step is one the fixture marks with its cause.
      if (id.startsWith(`${RESUME_FIXTURE_FAMILY}/`) && step.resumeCause !== undefined) {
        if (!step.argv.includes(RESET_COUNTS_FLAG)) {
          return { ...step, argv: Object.freeze([...step.argv, RESET_COUNTS_FLAG]) };
        }
      }
      return step;
    }),
  );
}

/**
 * The waiver the mode map needs for one fixture of FX-36: the one case whose
 * reference mode and port mode disagree with no row of the map to stand on.
 * Every other case maps, and needs no waiver.
 */
export function modeMapWaiverFor(
  fixtureId: string,
): { readonly row: string; readonly case: string } | undefined {
  if (!fixtureId.startsWith(`${MODE_MAP_FAMILY}/`)) return undefined;
  const member = fixtureId.slice(MODE_MAP_FAMILY.length + 1).split("@")[0] as string;
  if (member === MODE_MAP_WAIVED_CASE) {
    return { row: MODE_MAP_WAIVER_ROW, case: MODE_MAP_WAIVED_CASE };
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// The treatments that change no command, as the checks the tests read
// ---------------------------------------------------------------------------

/** The register row of session continuation, off with its assertion (DV-010). */
export const CONTINUATION_ROW = "DV-010" as const;
/** The register row of the default proposer and critic (DV-004). */
export const DEFAULT_ROLES_ROW = "DV-004" as const;
/** The fixture that names neither role, which is the one waiver of DV-004. */
export const DEFAULT_ROLES_WAIVED_FIXTURE = "FX-01/defaults-no-role-named" as const;
/** The register row of quota pause (DV-005). */
export const QUOTA_ROW = "DV-005" as const;
/** The register row of staleness (DV-082). */
export const STALENESS_ROW = "DV-082" as const;
/** The register row of glob expansion (DV-019). */
export const GLOB_ROW = "DV-019" as const;
/** The reset-flag rows: DV-011 with DV-044, which stands or falls with it. */
export const RESET_FLAG_ROWS: readonly string[] = Object.freeze(["DV-011", "DV-044"]);
/** The register row of the mode map (DV-009, with its one waiver). */
export const MODE_MAP_ROW = "DV-009" as const;
