/**
 * What the launch check `run-directory-free` and `specstride unlock` read
 * about the workspace lock: is it free, held by a live owner, stale, or not
 * a lock of this provider at all (F123-FR-021, F123-FR-022; EP-13).
 *
 * WHY NOT `existsSync`. A path named `lock` under the control plane is not
 * evidence of a live run. The shipped provider writes a DIRECTORY holding
 * `owner.json` and `lease.json`, and its probe (F122-FR-013) tells a live
 * owner from a dead one. The bash orchestrator that predates the engine also
 * writes `<control>/lock`, as a FILE of one line `<run-id> <iso-time>`, and
 * leaves it behind when it ends. Read as "held", either one blocks every
 * launch of the workspace with `already-running` and a `next=` that watches a
 * run that does not exist.
 *
 * So this module classifies the lock in four states and never guesses:
 *
 * - `free`    — no lock (probe row P1).
 * - `held`    — the probe counts the lock as held by a live owner of this
 *               machine (rows P4, P5): the launch attaches.
 * - `stale`   — the probe found the owner dead and nothing of its group alive
 *               (row P6): a launch is refused with `stale-lock`, and
 *               `unlock --stale` may move it aside.
 * - `foreign` — anything else named `lock`: a file (the orchestrator's
 *               format), a lock of another host or pid namespace (row P3), or a
 *               directory whose owner record cannot be read (row P2). Refused
 *               with `foreign-lock`; `unlock --stale` moves it only when it can
 *               prove the writer is gone.
 *
 * Reading changes nothing: no file is opened for writing and no endpoint is
 * created (C-255, B-2760).
 */
import { lstatSync, mkdirSync, openSync, readSync, closeSync, renameSync } from "node:fs";
import { join } from "node:path";
import { lockPathsOf, type LockPlace } from "./paths.ts";
import { ACQUIRED_AT_FIELD, probeLock, type ProbeDependencies } from "./probe.ts";

/** The four states of the workspace lock, as the launch check reads them. */
export const WORKSPACE_LOCK_STATES = ["free", "held", "stale", "foreign"] as const;
export type WorkspaceLockState = (typeof WORKSPACE_LOCK_STATES)[number];

/** What an inspection found. */
export type WorkspaceLockInspection = {
  readonly state: WorkspaceLockState;
  /** The path of the lock. */
  readonly path: string;
  /** Who wrote it: `specstride`, `orchestrator`, `other-host` or `unknown`. */
  readonly owner?: string;
  /** The run the lock names, when it names one. */
  readonly run?: string;
  /** The process id the lock names, when it names one. */
  readonly pid?: number;
  /** How long ago the lock was taken, in seconds, when it says. */
  readonly ageSeconds?: number;
  /** The probe row or the reading that decided, for a refusal line. */
  readonly because: string;
};

/** The as-is orchestrator's lock line: `<yyyymmdd-hhmmss-pid> <iso-time>`. */
export const ORCHESTRATOR_LOCK_LINE = /^(\d{8}-\d{6}-(\d+))\s+(\S+)\s*$/;

/** The most of a foreign lock file that is read; the orchestrator's is one short line. */
const FOREIGN_READ_LIMIT = 4096;

/** The dependencies of an inspection; the real ones by default. */
export type InspectDependencies = {
  readonly probe?: ProbeDependencies;
  /** The present time, in milliseconds. */
  readonly now?: () => number;
  /** Whether a process id lives on this machine; `kill(pid, 0)` by default. */
  readonly pidAlive?: (pid: number) => boolean;
};

/** `kill(pid, 0)`: `EPERM` means the process exists and belongs to someone else. */
export function pidAliveByKill(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

function ageOf(iso: unknown, now: number): number | undefined {
  if (typeof iso !== "string" || iso === "") return undefined;
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return undefined;
  return Math.max(0, Math.trunc((now - at) / 1000));
}

function readHead(path: string): string {
  const fd = openSync(path, "r");
  try {
    const buffer = Buffer.alloc(FOREIGN_READ_LIMIT);
    const read = readSync(fd, buffer, 0, FOREIGN_READ_LIMIT, 0);
    return buffer.subarray(0, read).toString("utf8");
  } finally {
    closeSync(fd);
  }
}

/** Classify the workspace lock without changing anything. */
export async function inspectWorkspaceLock(
  place: LockPlace,
  dependencies: InspectDependencies = {},
): Promise<WorkspaceLockInspection> {
  const path = lockPathsOf(place).lockDirectory;
  const now = (dependencies.now ?? Date.now)();
  let kind: "missing" | "directory" | "other";
  try {
    kind = lstatSync(path).isDirectory() ? "directory" : "other";
  } catch {
    kind = "missing";
  }
  if (kind === "missing") {
    return Object.freeze({ state: "free" as const, path, because: "no lock exists" });
  }

  if (kind === "other") {
    // Not the shipped provider's lock: it is always a directory.
    let line = "";
    try {
      line = readHead(path).split("\n")[0] ?? "";
    } catch {
      /* unreadable: still foreign, with nothing more to say */
    }
    const match = ORCHESTRATOR_LOCK_LINE.exec(line);
    if (match !== null) {
      const ageSeconds = ageOf(match[3], now);
      return Object.freeze({
        state: "foreign" as const,
        path,
        owner: "orchestrator",
        run: match[1],
        pid: Number(match[2]),
        ...(ageSeconds === undefined ? {} : { ageSeconds }),
        because: "a file in the orchestrator's one-line format, not a lock of this provider",
      });
    }
    return Object.freeze({
      state: "foreign" as const,
      path,
      owner: "unknown",
      because: "a file, not a lock of this provider",
    });
  }

  const outcome = await probeLock(place, dependencies.probe ?? {});
  const owner = outcome.reading.owner;
  const run = typeof owner?.runId === "string" ? owner.runId : undefined;
  const pid = typeof owner?.pid === "number" ? owner.pid : undefined;
  const ageSeconds = ageOf(owner?.[ACQUIRED_AT_FIELD], now);
  const facts = {
    path,
    ...(run === undefined ? {} : { run }),
    ...(pid === undefined ? {} : { pid }),
    ...(ageSeconds === undefined ? {} : { ageSeconds }),
    because: `probe row ${outcome.row}: ${outcome.because}`,
  };
  switch (outcome.result) {
    case "free":
      return Object.freeze({ state: "free" as const, ...facts });
    case "held-live":
    case "owner-dead-group-alive":
      return Object.freeze({ state: "held" as const, owner: "specstride", ...facts });
    case "stale-owner-dead":
      return Object.freeze({ state: "stale" as const, owner: "specstride", ...facts });
    case "held-foreign":
      return Object.freeze({ state: "foreign" as const, owner: "other-host", ...facts });
    default:
      return Object.freeze({
        state: "foreign" as const,
        owner: "unknown",
        ...facts,
        ...(outcome.reading.refusal === null ? {} : { because: outcome.reading.refusal }),
      });
  }
}

/** `2d`, `5h`, `12m`, `40s`: the age as a refusal line shows it. */
export function shortAge(seconds: number | undefined): string {
  if (seconds === undefined) return "unknown";
  if (seconds >= 86_400) return `${Math.trunc(seconds / 86_400)}d`;
  if (seconds >= 3_600) return `${Math.trunc(seconds / 3_600)}h`;
  if (seconds >= 60) return `${Math.trunc(seconds / 60)}m`;
  return `${seconds}s`;
}

/** The `key=value` detail of a lock, for a refusal line. */
export function lockDetail(inspection: WorkspaceLockInspection): string {
  return [
    `owner=${inspection.owner ?? "unknown"}`,
    ...(inspection.run === undefined ? [] : [`run=${inspection.run}`]),
    ...(inspection.pid === undefined ? [] : [`pid=${inspection.pid}`]),
    `age=${shortAge(inspection.ageSeconds)}`,
  ].join(" ");
}

/** What `unlockStale` did. */
export type UnlockOutcome =
  | {
      readonly moved: true;
      readonly from: string;
      readonly to: string;
      readonly inspection: WorkspaceLockInspection;
    }
  | {
      readonly moved: false;
      readonly reason: string;
      readonly inspection: WorkspaceLockInspection;
    };

/**
 * Move a lock aside, ONLY when its owner is provably gone: a `stale` lock of
 * this provider, or an orchestrator lock whose process id no longer lives.
 * The lock is renamed into `<control>/backups/` and never deleted, so a wrong
 * call loses nothing. A `held` lock, a lock of another host, and a lock whose
 * writer cannot be named are refused.
 */
export async function unlockStale(
  place: LockPlace,
  dependencies: InspectDependencies = {},
): Promise<UnlockOutcome> {
  const inspection = await inspectWorkspaceLock(place, dependencies);
  const refuse = (reason: string): UnlockOutcome =>
    Object.freeze({ moved: false as const, reason, inspection });
  if (inspection.state === "free") return refuse("no-lock");
  if (inspection.state === "held") return refuse("lock-held");
  if (inspection.state === "foreign") {
    if (inspection.owner !== "orchestrator" || inspection.pid === undefined) {
      return refuse("owner-unprovable");
    }
    if ((dependencies.pidAlive ?? pidAliveByKill)(inspection.pid)) return refuse("owner-alive");
  }
  const now = (dependencies.now ?? Date.now)();
  const backups = join(place.controlRoot, "backups");
  mkdirSync(backups, { recursive: true });
  const stamp = new Date(now)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "Z");
  const to = join(backups, `lock-${stamp}-${process.pid}`);
  renameSync(inspection.path, to);
  return Object.freeze({ moved: true as const, from: inspection.path, to, inspection });
}
