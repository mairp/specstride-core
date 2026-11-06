/**
 * T048 — the surface `exit` (S-01, F141-FR-019).
 *
 * "The exit code of the driven command", with "the exit-code map of `resume`
 * where it applies". A scenario of several commands has one exit code per
 * command and the exit code of the LAST one is the exit of the run: that is what
 * the reference's caller sees.
 *
 * The exit-code map of `resume` is a table of feature 100 (annex X §X.8,
 * `resumeExitCodeMap`): the as-is `resume` gives exit 1 both for a held lock and
 * for nothing to resume, and the port gives 5 and 3. The map is applied to the
 * REFERENCE side, with the cause the scenario names, so the two sides compare as
 * one value; the oracle holds no table of its own (F141-FR-020).
 */
import { resumeExitCodeMap } from "@specstride/contracts/profile/normalization";

import { assertTheRunHasEnded, type CaptureContext, type SurfaceCapture } from "./types.ts";

/** The causes the exit-code map of `resume` distinguishes. */
export const RESUME_CAUSES: readonly string[] = Object.freeze(
  resumeExitCodeMap.map((row) => row.cause),
);

/** The exit code the map gives for one as-is code and cause, or the code itself. */
export function mappedResumeExitCode(asIs: number, cause: string | undefined): number {
  if (cause === undefined) return asIs;
  const row = resumeExitCodeMap.find((r) => r.asIs === asIs && r.cause === cause);
  return row === undefined ? asIs : row.next;
}

/** The value of the surface `exit`. */
export type ExitCapture = {
  /** The exit code of the run: the last command's. */
  readonly exitCode: number;
  /** The exit code of every command, in order. */
  readonly perCommand: readonly number[];
  /** The signal of every command, where one died of a signal. */
  readonly signals: readonly (string | undefined)[];
  /** Set where the exit-code map of `resume` was applied, with the cause. */
  readonly mappedBy?: { readonly table: string; readonly cause: string };
};

/**
 * Capture the surface `exit`. `resumeCause` is what the scenario declares when it
 * drives `resume`; it names the row of the map that applies.
 */
export function captureExit(
  context: CaptureContext,
  resumeCause?: string,
): SurfaceCapture & { readonly value: ExitCapture } {
  assertTheRunHasEnded(context, "exit");
  const perCommand = context.commands.map((c) =>
    context.side === "reference" ? mappedResumeExitCode(c.exitCode, resumeCause) : c.exitCode,
  );
  const last = perCommand[perCommand.length - 1];
  const value: ExitCapture = {
    exitCode: last ?? 0,
    perCommand: Object.freeze(perCommand),
    signals: Object.freeze(context.commands.map((c) => c.signal)),
    ...(resumeCause === undefined || context.side !== "reference"
      ? {}
      : { mappedBy: { table: "resumeExitCodeMap", cause: resumeCause } }),
  };
  return { surface: "exit", id: "S-01", value };
}
