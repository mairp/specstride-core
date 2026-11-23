/**
 * Phase 3 of feature 153 — the ONE adapter from an engine command to the
 * check runner of feature 148 (plan.md, seam S3; F153-FR-011, F153-FR-029).
 *
 * Every engine path that runs a check command — the verification gate
 * (`runVerificationGate`), the micro-loop layer (`runCheckCommand` of
 * `micro-layer.ts`) and the check-runner service handler — goes through
 * `runEngineCheck` here, and through nothing else: this module imports no
 * spawning module of its own (T041). The process group, the time
 * limit, the SIGTERM → SIGKILL escalation and the `TIMEOUT` result are the
 * runner's own (`kind-command.ts`); this module adds no behaviour, it names
 * the boundary.
 *
 * The engine paths are written against `spawnSync`; `spawnSyncShapeOf` reads
 * the four fields of a `spawnSync` result out of the runner's result so the
 * callers keep their shape while the execution moves behind the runner.
 */
import type { ManifestEntry } from "@specstride/contracts/ep/check-runner";
import { pinACommand, PinRefusedError } from "../../../check-runner/src/registry/runner.ts";
import { runCommand, type CommandRun } from "../../../check-runner/src/command/kind-command.ts";
import { cannotStartResult } from "../../../check-runner/src/result/errors.ts";
import type { RunnerResult } from "../../../check-runner/src/result/result.ts";

/** One command of an engine path, as the engine holds it today. */
export type EngineCommand = {
  readonly id: string;
  readonly argv: readonly string[];
  readonly cwd: string;
  readonly timeLimitMs: number;
  readonly phase: number;
};

/**
 * The `CommandRun` of the check runner for one engine command: the manifest
 * entry of the kind `command`, the identity `pinACommand` gives for that
 * entry, the working directory, the time limit, the profile, and the
 * containment fields as `start` receives them (the level is an input and is
 * never chosen here; `containment.ts`).
 *
 * Named `engineCommandRunOf` — not `commandRunOf`, which is
 * `batch/isolation.ts`'s — so the two are never taken for each other.
 */
export function engineCommandRunOf(command: EngineCommand, profile: string): CommandRun {
  const entry: ManifestEntry = Object.freeze({
    id: command.id,
    kind: "command" as const,
    argv: Object.freeze([...command.argv]),
    phase: command.phase,
    timeLimitMs: command.timeLimitMs,
  });
  const identity = pinACommand(entry);
  return Object.freeze({
    entry,
    identity,
    workingDirectory: command.cwd,
    timeLimitMs: command.timeLimitMs,
    profile,
  });
}

/**
 * Run one engine command to its end through the check runner. The result is
 * the runner's, unchanged. A command whose argument list cannot be pinned —
 * a one-string argument list that only a shell could run (F153-FR-011,
 * FIXED_SPAWN_OPTIONS.shell is false) — gives the runner's `cannot-start`
 * result, never a pass and never a shell.
 */
export async function runEngineCheck(
  command: EngineCommand,
  profile: string,
): Promise<RunnerResult> {
  let run: CommandRun;
  try {
    run = engineCommandRunOf(command, profile);
  } catch (thrown) {
    if (thrown instanceof PinRefusedError) {
      return cannotStartResult(
        {
          commandId: command.id,
          executable: command.argv[0] ?? "",
          args: Object.freeze([...command.argv]),
          cwd: command.cwd,
          durationMs: 0,
        },
        thrown,
      );
    }
    throw thrown;
  }
  return await runCommand(run);
}

/**
 * The declared time limit of a command in milliseconds, or the fallback in
 * milliseconds where the declaration gives none (F153-FR-029). It never
 * returns 0 — 0 would mean "no timer" to the runner — and it never reads
 * `SPECSTRIDE_LIMITS`: under limits-off the caller passes the declared limit
 * unchanged (CQ-153-04 answered A on 2026-11-13) and the run records that
 * limits are off; the branch lives in the callers, not here.
 */
export function timeLimitMsOf(declaredSec: number | undefined, fallbackSec: number): number {
  const fromDeclared = declaredSec === undefined ? NaN : Math.round(declaredSec * 1_000);
  if (Number.isFinite(fromDeclared) && fromDeclared > 0) return fromDeclared;
  const fromFallback = Math.round(fallbackSec * 1_000);
  return fromFallback > 0 ? fromFallback : 1;
}

/**
 * The four fields of a `spawnSync` result, read out of the runner's result,
 * so that a caller written against `spawnSync` keeps its shape.
 */
export function spawnSyncShapeOf(result: RunnerResult): {
  status: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
} {
  return {
    status: result.exitCode,
    signal: result.signal,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
