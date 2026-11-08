/**
 * The workspace lock read THROUGH the lock provider of EP-13, for the launch
 * check `run-directory-free` (F123-FR-021, F123-FR-022) and for
 * `specstride unlock --stale`.
 *
 * The check it feeds must never answer from a bare `existsSync` again: the
 * bug of 2026-11-08 (docs/bugs/2026-11-08-launch-stale-lock.md) was a
 * two-day-old lock of the bash orchestrator — a plain FILE, not this
 * engine's directory — refusing a launch with `already-running` while
 * nothing ran. This module maps the outcome of the provider's probe
 * (`packages/runtime/src/lock/probe.ts`, decision table D-5) onto four
 * states a launch check and a recovery command can act on:
 *
 * - `free`    — no lock; a launch may take it.
 * - `held`    — an owner that counts as held (§F.5): live, on another host,
 *   with surviving group members, or unknown, which counts as held.
 * - `stale`   — `stale-owner-dead`: the owner record is ours and the
 *   kernel says the owner is gone. Reclaimable; `specstride unlock --stale`
 *   moves it to the backups.
 * - `foreign` — a lock EXISTS whose owner record this engine cannot read.
 *   The shipped provider guarantees *a lock never exists without its owner
 *   record* (F122-FR-014), so a lock with no readable record of ours is
 *   another engine's format — never `already-running`, never reclaimed
 *   automatically (a foreign owner is never reclaimed, §F.5).
 */
import { readFileSync, statSync } from "node:fs";
import { lockPathsOf, type LockPlace } from "../../../runtime/src/lock/paths.ts";
import {
  probeLock,
  ACQUIRED_AT_FIELD,
  type ProbeOutcome,
} from "../../../runtime/src/lock/probe.ts";

/** The four states a reader of the workspace lock acts on. */
export type LockStateName = "held" | "stale" | "foreign" | "free";

/** The structured state of the workspace lock, as the launch check reads it. */
export type WorkspaceLockState = {
  readonly state: LockStateName;
  /** The id of the owner, where one can be named (`orchestrator`, `directory-lock`). */
  readonly owner?: string;
  /** The process id of the owner, where the record gives one. */
  readonly pid?: number;
  /** The run the lock belongs to, where the record or the file names one. */
  readonly runId?: string;
  /** How long the lock has been held, in seconds, where a taken time can be read. */
  readonly ageSeconds?: number;
  /** Why the state is what it is, for a refusal detail. */
  readonly detail?: string;
};

/** The orchestrator's lock line: `<run id> <iso-8601 date>`, one line, nothing else. */
const ORCHESTRATOR_LOCK_LINE =
  /^(\S+)[ \t]+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[+-]\d{2}:\d{2}|Z))(?:\s*)$/;

/**
 * The state a probe outcome maps to. `unknown` from a FAILED read of a lock
 * that exists is `foreign` (another engine's format); every other unknown is
 * held, because unknown counts as held (§F.5).
 */
export function lockStateOfProbe(
  outcome: ProbeOutcome,
  lockPath?: string | undefined,
): WorkspaceLockState {
  const { result, reading } = outcome;
  if (result === "free") return Object.freeze({ state: "free" as const });
  if (result === "stale-owner-dead") {
    return Object.freeze({
      state: "stale" as const,
      ...identityOf(reading.owner, outcome),
      detail: `the owner is dead (${outcome.because})`,
    });
  }
  if (!reading.ownerRecordReadable && reading.lockExists) {
    return Object.freeze({
      state: "foreign" as const,
      ...foreignIdentityOf(outcome, lockPath),
    });
  }
  return Object.freeze({
    state: "held" as const,
    ...identityOf(reading.owner, outcome),
    detail: outcome.because,
  });
}

/** Probe the workspace lock through the provider of EP-13 and map the answer. */
export async function workspaceLockState(place: LockPlace): Promise<WorkspaceLockState> {
  const lockPath = lockPathsOf(place).lockDirectory;
  return lockStateOfProbe(await probeLock(place), lockPath);
}

/** The one-line description a refusal detail carries. */
export function describeLockState(lock: WorkspaceLockState): string {
  const parts: string[] = [`state=${lock.state}`];
  if (lock.owner !== undefined) parts.push(`owner=${lock.owner}`);
  if (lock.pid !== undefined) parts.push(`pid=${String(lock.pid)}`);
  if (lock.runId !== undefined) parts.push(`run=${lock.runId}`);
  if (lock.ageSeconds !== undefined) parts.push(`age=${describeAge(lock.ageSeconds)}`);
  if (lock.detail !== undefined) parts.push(lock.detail);
  return parts.join(" ");
}

/** The fix a stale or foreign lock names in its `next=`. */
export function nextForLockState(lock: WorkspaceLockState): string | undefined {
  if (lock.state === "stale")
    return "run `specstride unlock --stale` to move the dead owner's lock aside";
  if (lock.state === "foreign") {
    return "the lock is another engine's format; move it aside by hand (mv into the backups directory)";
  }
  return undefined;
}

/** Seconds as a human age (`2d`, `3h`, `5m`, `12s`). */
function describeAge(seconds: number): string {
  if (seconds >= 86_400) return `${Math.floor(seconds / 86_400)}d`;
  if (seconds >= 3_600) return `${Math.floor(seconds / 3_600)}h`;
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds)}s`;
}

/** Owner, pid, run and age out of our own owner record. */
function identityOf(
  owner: ProbeOutcome["reading"]["owner"],
  outcome: ProbeOutcome,
): Partial<WorkspaceLockState> {
  if (owner === null) return {};
  const parts: Partial<WorkspaceLockState> = {
    owner: "directory-lock",
    pid: typeof owner.pid === "number" ? owner.pid : undefined,
    ...(typeof owner.runId === "string" ? { runId: owner.runId } : {}),
  };
  const takenAt = owner[ACQUIRED_AT_FIELD];
  const age = ageSince(takenAt, outcome);
  return Object.freeze({ ...parts, ...(age === undefined ? {} : { ageSeconds: age }) });
}

/** Owner, run and age out of the orchestrator's one-line lock file, where it is one. */
function foreignIdentityOf(
  outcome: ProbeOutcome,
  lockPath: string | undefined,
): Partial<WorkspaceLockState> & { detail: string } {
  const raw = rawLockText(lockPath);
  const match = raw === null ? null : ORCHESTRATOR_LOCK_LINE.exec(raw.split("\n")[0] ?? "");
  if (match === null) {
    return Object.freeze({
      detail:
        outcome.reading.refusal ??
        "the lock holds no owner record this engine can read (a foreign lock format)",
    });
  }
  const age = ageSince(match[2], outcome);
  return Object.freeze({
    owner: "orchestrator",
    runId: match[1],
    ...(age === undefined ? {} : { ageSeconds: age }),
    detail: "a foreign lock format (the bash orchestrator's one-line lock file)",
  });
}

/** The raw text of the lock, where the lock is a readable FILE. */
function rawLockText(lockPath: string | undefined): string | null {
  if (lockPath === undefined) return null;
  try {
    // A DIRECTORY of ours is never parsed as a foreign lock line.
    const stat = statSync(lockPath, { throwIfNoEntry: false });
    if (stat === undefined || !stat.isFile()) return null;
    return readFileSync(lockPath, "utf8");
  } catch {
    return null;
  }
}

/** Age in seconds since an iso-8601 instant, where one can be parsed. */
function ageSince(takenAt: string | undefined, _outcome: ProbeOutcome): number | undefined {
  if (typeof takenAt !== "string" || takenAt === "") return undefined;
  const at = Date.parse(takenAt);
  if (!Number.isFinite(at)) return undefined;
  return Math.max(0, Math.trunc((Date.now() - at) / 1_000));
}
