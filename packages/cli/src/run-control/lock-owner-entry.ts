/**
 * The lock-owner entry of `stop --now` (B-1550, the no-op stop of a live
 * pass).
 *
 * WHAT WENT WRONG. `stop --now` ends the owned processes of the pass in
 * flight from ONE source: the supervision registry the engine writes
 * (`<controlRoot>/procs.json`). The registry of a resumed run can hold a
 * pass pid of an EARLIER launch — the engine records a pass at its start
 * and the next launch writes no entry until its own first pass — so the
 * command read a dead pid, printed `recorded pass (pid …) is not running —
 * nothing to kill`, and left the LIVE pass running. Observed 2026-11-14:
 * the registry named pid 2789847 while the engine of the live launch was
 * pid 3505444, and the check of the pass in flight hung for hours with no
 * way to end it through the verb.
 *
 * THE FIX. The workspace lock the engine holds while it runs
 * (`workspace:lock`, `<controlRoot>/lock/owner.json`, annex B §B.9) carries
 * the SAME identity facets the registry entry carries — pid, process group,
 * start time, the hash of the run token — because the engine's own runtime
 * checks them (F122-FR-013, F122-FR-025). This module maps that owner
 * record into the entry shape the identity check of `signal-owned.ts`
 * reads, so `stop --now` consults BOTH records of a live run: the registry
 * first (the exact record of the pass), the lock owner second (the live
 * holder of the workspace). Every guard stays: the identity check of
 * F102-FR-007 runs over the mapped entry exactly as over a registry entry,
 * the group-must-be-the-runtime's guard of F122-FR-025 included, and a
 * record that does not validate maps to NO entry at all.
 *
 * THE ONE FORMAT DIFFERENCE. §B.9 writes `startTime` as the decimal text of
 * epoch milliseconds; §B.10 writes it as an ISO instant. The mapping
 * converts, and refuses a `startTime` it cannot convert (`unknown`, the
 * text §B.9 writes for a reading the platform would not give) — an entry
 * the identity check cannot judge must never reach it.
 */
import { readFileSync } from "node:fs";

import { isOwnerRecord } from "@specstride/contracts/records/owner-record";
import {
  isProcessRegistry,
  type ProcessRegistry,
} from "@specstride/contracts/records/process-registry";
import { MINIMUM_PID } from "./signal-owned.ts";

/** The requirements this module carries out (with F102-FR-006/-007). */
export const LOCK_OWNER_ENTRY_REQUIREMENTS = ["F102-FR-006", "F102-FR-007", "F122-FR-013"] as const;

/** The schema id the mapped entry carries (`specstride.procs/1`). */
export const LOCK_OWNER_ENTRY_SCHEMA = "specstride.procs/1" as const;

/** The proc id the mapped entry carries, where the owner record names no launch. */
export const LOCK_OWNER_PROC_ID = "lock:owner" as const;

/**
 * True when the text is the decimal of epoch milliseconds — the only
 * `startTime` §B.9 writes that an identity check can judge. The text
 * `unknown` (a reading the platform would not give) is not.
 */
export function isEpochMillisText(text: unknown): text is string {
  return typeof text === "string" && /^[0-9]+$/.test(text);
}

/**
 * The owner record of the workspace lock as an entry of the process
 * registry (F102-FR-006), or `null` where the record is not an owner
 * record at all, or where its start time cannot be judged. The mapped
 * entry validates against `specstride.procs/1` — the same bar the reader
 * of the registry holds every entry to — so the identity check sees no
 * difference in kind between the two sources.
 */
export function lockOwnerEntryOf(record: unknown): ProcessRegistry | null {
  if (!isOwnerRecord(record)) return null;
  if (!isEpochMillisText(record.startTime)) return null;
  const startedAtMs = Number(record.startTime);
  if (!Number.isFinite(startedAtMs)) return null;
  const entry = {
    schema: LOCK_OWNER_ENTRY_SCHEMA,
    procId: LOCK_OWNER_PROC_ID,
    class: "owned" as const,
    // The holder of the workspace lock while a run lives is the engine.
    kind: "engine" as const,
    pid: record.pid,
    processGroup: record.processGroup,
    // §B.9 records no session; the group is the nearest truth the record
    // holds, and the identity check reads no session facet.
    processSession: record.processGroup,
    startTime: new Date(startedAtMs).toISOString(),
    runTokenHash: record.runTokenHash,
    runId: record.launchId,
    engineStartId: "",
  };
  return isProcessRegistry(entry) ? entry : null;
}

/**
 * The raw owner record of the workspace lock at `path`
 * (`<controlRoot>/lock/owner.json`), as `stopHandler` reads it for `--now`:
 * a file that is absent, unreadable or not an object names no holder and
 * answers `null`. The record is passed RAW — the mapping and every check
 * over it belong to `lockOwnerEntryOf` and the identity check, not to the
 * reader.
 */
export function ownerRecordOfTheLock(path: string): unknown {
  let file: unknown;
  try {
    file = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
  return typeof file === "object" && file !== null && !Array.isArray(file) ? file : null;
}

/**
 * The entries `stop --now` considers: the registry's entries, with the
 * lock owner's entry appended where the record maps to one and its pid is
 * not already among the entries (a fresh registry already names the live
 * holder; signalling one group twice says nothing the first signal does
 * not). A pid already covered answers through the registry entry, which
 * carries the pass's own proc id.
 */
export function entriesWithTheLockOwner(
  entries: readonly ProcessRegistry[],
  lockOwnerRecord: unknown,
): readonly ProcessRegistry[] {
  const ownerEntry = lockOwnerEntryOf(lockOwnerRecord);
  if (ownerEntry === null) return entries;
  const covered = new Set(entries.map((entry) => entry.pid));
  if (covered.has(ownerEntry.pid)) return entries;
  if ((ownerEntry.pid as number) < MINIMUM_PID) return entries;
  return [...entries, ownerEntry];
}
