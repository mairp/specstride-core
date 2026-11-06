/**
 * T048 to T050 — the capture of one run: the surfaces of §O.4 the fixture names
 * (F141-FR-019).
 *
 * One module per surface, and this file collects them. `captureSurfaces` takes a
 * finished run and the list of surfaces the fixture declares, and gives back one
 * value per surface; a surface the fixture does not name is not captured, and a
 * surface of the port alone (S-14 to S-16) is captured on the port only.
 */
import { captureEvents } from "./events.ts";
import { captureExit } from "./exit.ts";
import { captureHome } from "./home.ts";
import { captureLauncher } from "./launcher.ts";
import { capturePipeline } from "./pipeline.ts";
import { captureControlRecords, captureCounters, captureEventsPrimary } from "./port-only.ts";
import { captureProcesses } from "./processes.ts";
import { captureRepository } from "./repository.ts";
import { captureState } from "./state.ts";
import { captureStderr } from "./stderr.ts";
import { captureStdout } from "./stdout.ts";
import { captureTelemetry } from "./telemetry.ts";
import { captureTranscript } from "./transcript.ts";
import { captureTree } from "./tree.ts";
import {
  ALL_SURFACES,
  CaptureError,
  PORT_ONLY_SURFACES,
  RUN_SET,
  assertTheRunHasEnded,
  surfaceId,
  type CaptureContext,
  type SurfaceCapture,
} from "./types.ts";

export * from "./types.ts";
export { captureExit, mappedResumeExitCode } from "./exit.ts";
export { captureStdout, joinStream } from "./stdout.ts";
export { captureStderr } from "./stderr.ts";
export { captureTree, walkTree } from "./tree.ts";
export { captureState, captureStateFile } from "./state.ts";
export { captureEvents, readEventFile, pairsOfLine, topLevelKeys } from "./events.ts";
export { captureProcesses } from "./processes.ts";
export { captureHome } from "./home.ts";
export { capturePipeline, PIPELINE_LOGS, PIPELINE_RECORDS } from "./pipeline.ts";
export { captureTelemetry, readTelemetryStore } from "./telemetry.ts";
export { captureRepository, assertReadOnlyRepositoryGitArgv } from "./repository.ts";
export { captureLauncher, bodyHash } from "./launcher.ts";
export {
  captureEventsPrimary,
  captureControlRecords,
  captureCounters,
  COUNTER_NAMES,
} from "./port-only.ts";
export {
  captureTranscript,
  transportNeutralTranscript,
  transportNeutralRecord,
  assertNoSessionWasContinued,
  recordsOfRole,
} from "./transcript.ts";

/** What a capture of one run of one side is. */
export type Capture = {
  readonly scenario: string;
  readonly side: "reference" | "port";
  readonly suite: "first" | "second";
  readonly layer: "off" | "on";
  readonly surfaces: Readonly<Record<string, unknown>>;
  /** A surface the fixture named that could not be captured, with the reason. */
  readonly missing: Readonly<Record<string, string>>;
};

/** Options the surfaces of a few scenarios need. */
export type CaptureOptions = {
  readonly resumeCause?: string;
  readonly launcher?: string;
  readonly bundle?: string;
  /**
   * Where the surface `pipeline` reads its files, as the scenario names them
   * (`capturePipeline`): the as-is names differ per baseline, and the state
   * record and the launch record of the supervisor of mixture-of-loops are not
   * beside the launcher but under `runs/<pipeline>` of the artifact directory.
   */
  readonly pipeline?: {
    readonly root?: string;
    readonly records?: readonly string[];
    readonly logs?: readonly string[];
  };
  readonly primaryEventFile?: string;
  readonly controlPaths?: Readonly<Record<string, string>>;
  readonly countersFile?: string;
  readonly layer?: "off" | "on";
};

/**
 * Capture the surfaces the fixture names. A surface whose capture throws is
 * recorded as MISSING with its reason and not as an empty value: a capture that
 * is missing or unreadable gives `different` (F141-FR-021), and an empty value
 * could compare equal to another empty value.
 */
export function captureSurfaces(
  context: CaptureContext,
  declared: readonly string[],
  options: CaptureOptions = {},
): Capture {
  const surfaces: Record<string, unknown> = {};
  const missing: Record<string, string> = {};

  for (const name of declared) {
    const base = name.split(".")[0] as string;
    if (!ALL_SURFACES.includes(base)) {
      missing[name] = `${name} is no surface of §O.4 (${ALL_SURFACES.join(", ")})`;
      continue;
    }
    if (PORT_ONLY_SURFACES.includes(base) && context.side !== "port") continue;
    try {
      surfaces[name] = one(name, base, context, options).value;
    } catch (error) {
      missing[name] = error instanceof Error ? error.message : String(error);
    }
  }
  return Object.freeze({
    scenario: context.scenario,
    side: context.side,
    suite: context.suite,
    layer: options.layer ?? "off",
    surfaces: Object.freeze(surfaces),
    missing: Object.freeze(missing),
  });
}

function one(
  name: string,
  base: string,
  context: CaptureContext,
  options: CaptureOptions,
): SurfaceCapture {
  switch (base) {
    case "exit":
      return captureExit(context, options.resumeCause);
    case "stdout":
      return captureStdout(context);
    case "stderr":
      return captureStderr(context);
    case "tree":
      return captureTree(context);
    case "state":
      return captureState(context);
    case "events":
      return captureEvents(context);
    case "transcript": {
      // Every capture is taken after the run has ended (F141-FR-019), the
      // transcript among them: a transcript read from a live run would be missing
      // the records of the calls still to come.
      assertTheRunHasEnded(context, name);
      const captured = captureTranscript(context.transcriptFile);
      const role = name.includes(".") ? (name.split(".")[1] as string) : undefined;
      return {
        surface: name,
        id: surfaceId("transcript") ?? "S-07",
        value:
          role === undefined ? captured.neutral : captured.neutral.filter((r) => r.role === role),
      };
    }
    case "processes":
      return captureProcesses(context);
    case "pipeline":
      return capturePipeline(context, options.pipeline ?? {});
    case "telemetry":
      return captureTelemetry(context);
    case "repository":
      return captureRepository(context);
    case "launcher":
      return captureLauncher(context, {
        ...(options.launcher === undefined ? {} : { launcher: options.launcher }),
        ...(options.bundle === undefined ? {} : { bundle: options.bundle }),
      });
    case "home":
      return captureHome(context);
    case "events-primary": {
      if (options.primaryEventFile === undefined) {
        throw new CaptureError(
          "the surface events-primary needs the primary event file of the port, which the driver names",
        );
      }
      return captureEventsPrimary(context, options.primaryEventFile);
    }
    case "control-records":
      return captureControlRecords(context, options.controlPaths ?? {});
    case "counters": {
      if (options.countersFile === undefined) {
        throw new CaptureError(
          "the surface counters needs the counter record of the port, which the driver names",
        );
      }
      return captureCounters(context, options.countersFile);
    }
    default:
      throw new CaptureError(`${base} is no surface this module captures`);
  }
}

/** Every surface of the run set, which a fixture that names none compares. */
export { RUN_SET };
