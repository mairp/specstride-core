/**
 * T048 — the surface `processes` (S-08, F141-FR-019).
 *
 * "The processes the run left behind." A run that leaks a watchdog, a detached
 * long job or an agent process is a difference between the sides, and the only
 * moment at which it can be seen is between the end of the run and the capture:
 * "A capture MUST be taken after the run has ended and after the processes it
 * left behind were listed" (F141-FR-019). The driver lists them and hands the
 * list here; this module never looks at the machine, so the capture cannot
 * change under it.
 *
 * The process ids themselves are replaced by numbered placeholders (N-07), so
 * what is compared is how many processes of which command were left, and not
 * which numbers the kernel handed out.
 */
import { assertTheRunHasEnded, type CaptureContext, type SurfaceCapture } from "./types.ts";

/** The value of the surface `processes`. */
export type ProcessesCapture = {
  readonly count: number;
  readonly entries: readonly {
    readonly pid: number;
    readonly processGroup: number;
    readonly command: readonly string[];
  }[];
};

/** Capture the surface `processes`, from the list the driver made. */
export function captureProcesses(
  context: CaptureContext,
): SurfaceCapture & { readonly value: ProcessesCapture } {
  assertTheRunHasEnded(context, "processes");
  const entries = [...context.processesLeftBehind].sort((a, b) =>
    a.command.join(" ") < b.command.join(" ")
      ? -1
      : a.command.join(" ") > b.command.join(" ")
        ? 1
        : a.pid - b.pid,
  );
  return {
    surface: "processes",
    id: "S-08",
    value: { count: entries.length, entries: Object.freeze(entries) },
  };
}
