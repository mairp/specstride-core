/**
 * T042 — the engine stub (F141-FR-009).
 *
 * "The oracle MUST offer the engine stub … with exactly the verbs of its table
 * of §O.3. The engine stub MUST leave the exit code and the stop reason that its
 * script names, in the form the reference and the port each read."
 *
 * The engine stub stands in for the engine under the launcher, the pipeline
 * runtime and the supervisor. The form is read off the reference: the launcher
 * of mixture-of-loops reads the end of a run from an event record
 * `{"event": "run_stop", "reason": …}` in the event file of the feature, and
 * from the exit code of the command. The port reads the same end from its own
 * event stream, which the driver reaches through the surface `events`; the
 * record this stub writes carries the logical shape both sides read, so the
 * comparator sees one end and not two forms of one.
 *
 * | Verb | Exit code | Stop reason |
 * |---|---|---|
 * | `succeed` | 0 | `completed`, with the records of a finished run |
 * | `transient` | the code the script names (4) | the transient reason the script names (`wall_budget`) |
 * | `fail` | the code the script names (3) | the reason the script names, which is not transient |
 * | `stop` | 6 | `user_stop` |
 * | `sleep` | 0 after the ticks, or 128+N on a signal | `completed`, or `user_stop` on a signal |
 * | `crash` | the code the script names (70) | NONE: a crash writes no stop reason |
 *
 * The stub is named through the switch of row 41 of the `parity` profile
 * (`engine.executable`) and through the search path (F141-FR-004): the oracle
 * never adds a switch of its own for it.
 */
import { appendFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";

import { verbsOf, type ScriptStep } from "./script.ts";

/** The six verbs of the engine stub (`kinds.engine` of the data form of §O.3). */
export const ENGINE_VERBS: readonly string[] = verbsOf("engine") ?? [];

/** The switch of the `parity` profile through which the engine stub is named (row 41). */
export const ENGINE_SWITCH_KEY = "engine.executable" as const;

/** The row of the `parity` profile that names it. */
export const ENGINE_SWITCH_ROW = 41 as const;

/** The exit codes the verbs of §O.3 end with where the script names none. */
export const ENGINE_EXIT_CODES = Object.freeze({
  succeed: 0,
  transient: 4,
  fail: 3,
  stop: 6,
  sleep: 0,
  crash: 70,
});

/** The stop reasons the verbs leave where the script names none. */
export const ENGINE_STOP_REASONS = Object.freeze({
  succeed: "completed",
  transient: "wall_budget",
  fail: "postcondition_failed",
  stop: "user_stop",
  sleep: "completed",
});

/** A call of the engine stub outside the vocabulary of §O.3. */
export class EngineStubError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngineStubError";
  }
}

/** What one call of the engine stub was given. */
export type EngineContext = {
  /** The working directory of the run. */
  readonly workdir: string;
  /** The feature slug under which the run leaves its records. */
  readonly feature: string;
  /** The event file the end of the run is recorded in, relative to the working directory. */
  readonly eventFile?: string;
  /** The attempt of this call, from the invocation counter outside the working directory. */
  readonly attempt: number;
  /** One tick in milliseconds. */
  readonly tickMilliseconds: number;
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
};

/** What one call of the engine stub left behind. */
export type EngineOutcome = {
  readonly exitCode: number;
  /** The stop reason recorded, or `undefined` where the verb wrote none (`crash`). */
  readonly stopReason?: string;
  /** The event file the record went into. */
  readonly eventFile: string;
};

/** The event file of a feature, in the form the reference reads. */
export function engineEventFile(context: EngineContext): string {
  return join(
    context.workdir,
    context.eventFile ?? join(".specstride", "features", context.feature, "events.jsonl"),
  );
}

/**
 * Record the end of a run, in the form the reference and the port each read: one
 * line, the event `run_stop`, the reason, the feature and the attempt.
 */
export function recordStopReason(context: EngineContext, reason: string): string {
  const file = engineEventFile(context);
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(
    file,
    `${JSON.stringify({
      event: "run_stop",
      reason,
      feature: context.feature,
      attempt: context.attempt,
    })}\n`,
    "utf8",
  );
  return file;
}

/** The records a finished run leaves. */
function leaveTheRecordsOfAFinishedRun(context: EngineContext): void {
  const stateDir = join(context.workdir, ".specstride", "features", context.feature);
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(
    join(stateDir, "PROGRESS.md"),
    `# ${context.feature}\n\nAll phases complete on attempt ${String(context.attempt)}.\n`,
    "utf8",
  );
}

/** Wait a number of ticks without reading a clock. */
function waitTicks(ticks: number, tickMilliseconds: number): void {
  const milliseconds = Math.max(0, Math.trunc(ticks * tickMilliseconds));
  if (milliseconds > 0) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
  }
}

/**
 * Carry out one step of an engine script. Exactly one verb per step: the end of
 * a run is one end.
 */
export function carryOutEngineStep(step: ScriptStep, context: EngineContext): EngineOutcome {
  if (step.verbs.length !== 1) {
    throw new EngineStubError(
      `a step of the engine stub names one verb; this one names ${String(step.verbs.length)} ` +
        `(${step.verbs.join(", ")}): a run has one end`,
    );
  }
  const verb = step.verbs[0] as string;
  if (!ENGINE_VERBS.includes(verb)) {
    throw new EngineStubError(
      `${verb} is no verb of the engine stub; §O.3 names ${ENGINE_VERBS.join(", ")}`,
    );
  }
  const args = (step.args ?? {}) as Record<string, unknown>;
  const out = context.stdout ?? ((t: string): void => void process.stdout.write(t));
  const err = context.stderr ?? ((t: string): void => void process.stderr.write(t));

  switch (verb) {
    case "succeed": {
      leaveTheRecordsOfAFinishedRun(context);
      out(`the engine stub finished ${context.feature} on attempt ${String(context.attempt)}\n`);
      return {
        exitCode: ENGINE_EXIT_CODES.succeed,
        stopReason: ENGINE_STOP_REASONS.succeed,
        eventFile: recordStopReason(context, ENGINE_STOP_REASONS.succeed),
      };
    }
    case "transient": {
      const failTimes = Math.trunc(Number(args["failTimes"] ?? 2));
      if (context.attempt > failTimes) {
        leaveTheRecordsOfAFinishedRun(context);
        out(`the engine stub finished on attempt ${String(context.attempt)}\n`);
        return {
          exitCode: ENGINE_EXIT_CODES.succeed,
          stopReason: ENGINE_STOP_REASONS.succeed,
          eventFile: recordStopReason(context, ENGINE_STOP_REASONS.succeed),
        };
      }
      const reason = String(args["reason"] ?? ENGINE_STOP_REASONS.transient);
      err(`the engine stub stops, reason=${reason}, and the reason is transient\n`);
      return {
        exitCode: Math.trunc(Number(args["code"] ?? ENGINE_EXIT_CODES.transient)),
        stopReason: reason,
        eventFile: recordStopReason(context, reason),
      };
    }
    case "fail": {
      const reason = String(args["reason"] ?? ENGINE_STOP_REASONS.fail);
      err(`the engine stub stops, reason=${reason}, and the reason is not transient\n`);
      return {
        exitCode: Math.trunc(Number(args["code"] ?? ENGINE_EXIT_CODES.fail)),
        stopReason: reason,
        eventFile: recordStopReason(context, reason),
      };
    }
    case "stop": {
      err("the engine stub ends as a stopped run\n");
      return {
        exitCode: ENGINE_EXIT_CODES.stop,
        stopReason: ENGINE_STOP_REASONS.stop,
        eventFile: recordStopReason(context, ENGINE_STOP_REASONS.stop),
      };
    }
    case "sleep": {
      // Stay running, so a supervisor sees a live run and a signal can land.
      const marker = join(context.workdir, ".specstride", "features", context.feature, "started");
      mkdirSync(dirname(marker), { recursive: true });
      writeFileSync(marker, `${String(process.pid)}\n`, "utf8");
      out(`the engine stub is running on attempt ${String(context.attempt)}\n`);
      waitTicks(Number(args["ticks"] ?? 1), context.tickMilliseconds);
      leaveTheRecordsOfAFinishedRun(context);
      return {
        exitCode: ENGINE_EXIT_CODES.sleep,
        stopReason: ENGINE_STOP_REASONS.sleep,
        eventFile: recordStopReason(context, ENGINE_STOP_REASONS.sleep),
      };
    }
    case "crash": {
      // A crash writes NO stop reason: that is the behaviour the supervisor and
      // the pipeline runtime are compared on.
      err("the engine stub crashed\n");
      return {
        exitCode: Math.trunc(Number(args["code"] ?? ENGINE_EXIT_CODES.crash)),
        eventFile: engineEventFile(context),
      };
    }
    default:
      throw new EngineStubError(`${verb} is in the vocabulary and this module does not do it`);
  }
}

/**
 * The attempt of this call, kept outside the working directory like every other
 * counter of a stub (§O.3, rule 1).
 */
export function engineAttempt(stateDir: string): number {
  const file = join(stateDir, "engine.attempts");
  mkdirSync(stateDir, { recursive: true });
  const previous = existsSync(file) ? Number.parseInt(readFileSync(file, "utf8").trim(), 10) : 0;
  const attempt = (Number.isInteger(previous) ? previous : 0) + 1;
  writeFileSync(file, `${String(attempt)}\n`, "utf8");
  return attempt;
}
