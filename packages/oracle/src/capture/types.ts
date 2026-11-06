/**
 * T048 to T050 — what a capture of one run is (F141-FR-019, §O.4).
 *
 * "The oracle MUST capture, per run, the surfaces S-01 to S-13 of §O.4 that the
 * fixture names, and on the port also S-14 to S-16. Standard output and standard
 * error MUST be captured apart, as bytes. State MUST be captured by logical name
 * through the layout tables of feature 100. A capture MUST be taken after the run
 * has ended and after the processes it left behind were listed."
 *
 * So a capture is a value, not a side effect: every module of `src/capture/`
 * takes the record the driver made of a finished run and gives back the one
 * surface it owns. The driver is the only thing that runs a command; nothing
 * here does, which is how "taken after the run has ended" is true by
 * construction — there is no run left to read from.
 */
import { surfaces as surfacesData } from "../catalogue/data.ts";

/** Which side a capture is of. */
export type Side = "reference" | "port";

/** Which suite a capture belongs to; S-14 to S-16 are of the second suite. */
export type Suite = "first" | "second";

/** The surfaces of the run set (§O.4), which a fixture names a subset of. */
export const RUN_SET: readonly string[] = surfacesData().runSet;

/** The surfaces of the port only, which the second suite compares (S-14 to S-16). */
export const PORT_ONLY_SURFACES: readonly string[] = Object.freeze(
  surfacesData()
    .surfaces.filter((s) => s.suites === "second suite")
    .map((s) => s.name),
);

/** Every surface name of §O.4, S-01 to S-16. */
export const ALL_SURFACES: readonly string[] = Object.freeze(
  surfacesData().surfaces.map((s) => s.name),
);

/** The id of a surface by its name (`exit` → `S-01`). */
export function surfaceId(name: string): string | undefined {
  return surfacesData().surfaces.find((s) => s.name === name)?.id;
}

/** A capture that could not be made or read; the comparator gives `different` for it. */
export class CaptureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CaptureError";
  }
}

/** One command of the run, as the driver recorded it after it ended. */
export type CommandRecord = {
  readonly argv: readonly string[];
  readonly exitCode: number;
  /** The signal the command died of, where it died of one. */
  readonly signal?: string;
  /** Standard output as bytes, apart from standard error. */
  readonly stdout: Uint8Array;
  /** Standard error as bytes, apart from standard output. */
  readonly stderr: Uint8Array;
};

/** What every module of `src/capture/` is given: a run that has ended. */
export type CaptureContext = {
  readonly scenario: string;
  readonly side: Side;
  readonly suite: Suite;
  /** The commands of the scenario, in order; the last one gives the exit code. */
  readonly commands: readonly CommandRecord[];
  readonly workdir: string;
  readonly home: string;
  readonly temporaryDirectory: string;
  /** The files of state of this side, by logical name (F141-FR-019). */
  readonly statePaths: Readonly<Record<string, string>>;
  /** The event files of this side; on the port the compatibility projection. */
  readonly eventFiles: readonly string[];
  /** The transcript of every stub of this run. */
  readonly transcriptFile: string;
  /** The processes the run left behind, listed before the capture was taken. */
  readonly processesLeftBehind: readonly ProcessLeftBehind[];
  /** The payloads the telemetry sink stub stored. */
  readonly telemetryStore?: string;
  /** The root of the launcher and the launch bundle, where the scenario has one. */
  readonly launcherRoot?: string;
  /** The root of the project repository, where the scenario has one. */
  readonly repositoryRoot?: string;
  /** True when the run had ended before the capture was taken. The driver sets it. */
  readonly runHasEnded: boolean;
};

/** One process the run left behind (§O.4, S-08). */
export type ProcessLeftBehind = {
  readonly pid: number;
  readonly processGroup: number;
  readonly command: readonly string[];
};

/** The capture of one surface. */
export type SurfaceCapture = {
  readonly surface: string;
  readonly id: string;
  readonly value: unknown;
};

/**
 * Every capture is taken after the run has ended (F141-FR-019). A module that is
 * handed a context whose run has not ended refuses, so a capture can never be
 * read from a live run.
 */
export function assertTheRunHasEnded(context: CaptureContext, surface: string): void {
  if (!context.runHasEnded) {
    throw new CaptureError(
      `the surface ${surface} of ${context.scenario} (${context.side}) was asked for before the ` +
        `run ended; a capture is taken after the run has ended and after the processes it left ` +
        `behind were listed (F141-FR-019)`,
    );
  }
}
