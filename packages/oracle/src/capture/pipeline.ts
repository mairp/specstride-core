/**
 * T049 — the surface `pipeline` (S-09, F141-FR-019).
 *
 * "For the pipeline: the state record, the launch record of the supervisor and
 * the three logs." Read off the reference: the pipeline runtime of
 * mixture-of-loops keeps its state record and the supervisor's launch record
 * beside the launcher, and writes three logs — the run log, the supervisor log
 * and the stage log. The three names are data of the scenario where it names
 * them, and the defaults below are the as-is names.
 *
 * The rules of §O.4 for this surface are N-02, N-04, N-05, N-07, N-16, N-19 and
 * N-20: the layout, the timestamps, the durations, the process ids, the
 * generated-by field, the literals of the old language and the output labels.
 * None of them is applied here.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { assertTheRunHasEnded, type CaptureContext, type SurfaceCapture } from "./types.ts";

/** The three logs of the pipeline, by their as-is names. */
export const PIPELINE_LOGS: readonly string[] = Object.freeze([
  "run.log",
  "supervisor.log",
  "stage.log",
]);

/** The state record and the launch record of the supervisor, by their as-is names. */
export const PIPELINE_RECORDS: readonly string[] = Object.freeze(["state.json", "supervisor.json"]);

/** One file of the pipeline, read or absent. */
export type PipelineFile = {
  readonly name: string;
  readonly exists: boolean;
  readonly content?: string;
};

/** The value of the surface `pipeline`. */
export type PipelineCapture = {
  readonly root: string;
  readonly records: readonly PipelineFile[];
  readonly logs: readonly PipelineFile[];
};

function read(root: string, name: string): PipelineFile {
  const file = join(root, name);
  if (!existsSync(file)) return { name, exists: false };
  return { name, exists: true, content: readFileSync(file, "utf8") };
}

/** Capture the surface `pipeline`. */
export function capturePipeline(
  context: CaptureContext,
  options: {
    readonly root?: string;
    readonly records?: readonly string[];
    readonly logs?: readonly string[];
  } = {},
): SurfaceCapture & { readonly value: PipelineCapture } {
  assertTheRunHasEnded(context, "pipeline");
  const root = options.root ?? context.launcherRoot ?? context.workdir;
  return {
    surface: "pipeline",
    id: "S-09",
    value: {
      root,
      records: Object.freeze((options.records ?? PIPELINE_RECORDS).map((n) => read(root, n))),
      logs: Object.freeze((options.logs ?? PIPELINE_LOGS).map((n) => read(root, n))),
    },
  };
}
