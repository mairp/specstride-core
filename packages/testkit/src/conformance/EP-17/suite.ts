/**
 * T035 — the conformance suite of EP-17 at BEHAVIOUR level: CT-122-2 and
 * CT-122-3 (F122-FR-001, F122-FR-002, F122-FR-003).
 *
 * `contract.test.ts` beside this file holds the contract-level case of feature
 * 100 (CT-100-265), which asks whether the three operations and the closed sets
 * are there. This file holds what feature 122 asks of the BEHAVIOUR behind
 * them, and §F.6 "Proving test" names it exactly:
 *
 *   *start; end the parent; confirm that the child lives and that the lease is
 *   valid; then the same with the parent killed by a signal. A sample strategy
 *   is registered from the test tree.*
 *
 * So there are two cases that end a parent, one per way of ending it, and they
 * are the whole point of F122-FR-001: *the runtime root MUST be started so that
 * it outlives the process that started it.*
 *
 * WHAT IS REALLY DONE, AND WHAT IS READ. Nothing here is simulated. A real
 * parent process (`../../samples/EP-17/sample-parent.ts`) calls `start` of the
 * real sample strategy, which really spawns a real stand-in root
 * (`../../samples/EP-17/sample-root.ts`). The suite then ENDS that parent — by
 * letting it exit, or by `SIGKILL` — waits until the platform agrees it is
 * gone, and only then reads two things:
 *
 *   1. **the child lives**: asked of the platform with a signal of zero, which
 *      delivers no signal, and asked a second way — the stand-in's log, which
 *      exists only because the child ran;
 *   2. **the lease is valid**: the record on disk validates against
 *      `specstride.lease/1`, carries THIS launch's nonce, and its `validUntil`
 *      lies in the future (annex B, §B.8).
 *
 * The sample is the subject on purpose (F122-FR-002: *a sample strategy outside
 * the core MUST pass the conformance suite with no core file changed*). It
 * imports nothing of `@specstride/runtime`: were these cases driven by the
 * shipped strategy they would prove the shipped strategy, not the contract.
 *
 * HOST SAFETY. Every signal this suite sends names ONE process id, checked to be
 * an integer above one; no group signal is sent anywhere (the owner's ruling of
 * 2026-10-02).
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { POINT_ID, SURVIVES_A_REBOOT_IN_WAVE_1 } from "@specstride/contracts/ep/detach";
import { isLease, statusLineIsStale } from "@specstride/contracts/records/lease";
import type { Lease } from "@specstride/contracts/records/lease";
import {
  SAMPLE_STRATEGY_ID,
  SAMPLE_SURVIVES,
  implementation,
  useContext,
} from "../../samples/EP-17/sample-strategy.ts";
import { SAMPLE_PARENT_ENTRY, STARTED_KIND } from "../../samples/EP-17/sample-parent.ts";
import type { StartedRecord } from "../../samples/EP-17/sample-parent.ts";
import { operationOf } from "../common.ts";
import type { ConformanceCase } from "../run.ts";

export { POINT_ID, implementation };

/** The case ids of F122-FR-001 to F122-FR-003. */
export const CASE_IDS = ["CT-122-2", "CT-122-3"] as const;

/** How the parent is ended, one way per case. */
export const WAYS_THE_PARENT_ENDS = ["exit", "signal"] as const;
export type WayTheParentEnds = (typeof WAYS_THE_PARENT_ENDS)[number];

/** The signal that ends a parent without warning. */
export const WITHOUT_WARNING = "SIGKILL" as const;

/** How long the suite waits for a process or a file; generous, and bounded. */
export const WAIT_MS = 15_000 as const;

/* ------------------------------------------------------------------ *
 * Reading the platform, never assuming it.
 * ------------------------------------------------------------------ */

/** The smallest id this suite will ever name in a signal of zero. */
export const SMALLEST_ID = 2 as const;

/** Refuse an id that is not a single process above `init` (ruling 2026-10-02). */
export function assertOneProcess(pid: number): void {
  if (!Number.isInteger(pid) || pid < SMALLEST_ID) {
    throw new Error(
      `the conformance suite of EP-17 refuses to name the process id ${String(pid)}: only an ` +
        `integer of ${SMALLEST_ID} or more is a single process it may ask about`,
    );
  }
}

/**
 * The state letter of a process that exited and was not yet collected by its
 * parent (F122-FR-042). It still answers a signal of zero, so it must be read
 * BEFORE the platform is asked — and in this suite it matters for a reason that
 * is not academic: the started root's parent ENDS, which is the whole point of
 * the two cases, so the root is reparented to whatever leads the namespace the
 * tests run in. A leader that does not collect its adopted children leaves a
 * process that is finished and still answers. Were the state not read, "the
 * child lives" would be true of a child that had already died, and so would
 * "the child ended" after the suite killed it.
 */
export const ZOMBIE = "Z" as const;

/**
 * The process session of a process, READ from the process table. Linux only;
 * elsewhere the reading is `null` and the case falls back to what the strategy
 * claimed, with that stated.
 *
 * F122-FR-001 asks the started process to be *the leader of a process session of
 * its own*, and a strategy's own `sessionLeader` is a CLAIM. This is the reading
 * that can contradict it.
 */
export function sessionOf(pid: number): number | null {
  if (process.platform !== "linux") return null;
  let stat: string;
  try {
    stat = readFileSync(`/proc/${String(pid)}/stat`, "utf8");
  } catch {
    return null;
  }
  // `pid (comm) state ppid pgrp session …` — the name may hold spaces.
  const after = stat
    .slice(stat.lastIndexOf(")") + 1)
    .trim()
    .split(/\s+/);
  const session = after[3];
  return session === undefined ? null : Number(session);
}

/** True where a process has exited and was not yet collected. */
export function hasNotBeenCollected(pid: number): boolean {
  if (process.platform !== "linux") return false;
  let stat: string;
  try {
    stat = readFileSync(`/proc/${String(pid)}/stat`, "utf8");
  } catch {
    return false;
  }
  // `pid (comm) S …` — the name may hold spaces and brackets, so the state is
  // read after the LAST closing bracket.
  const after = stat.slice(stat.lastIndexOf(")") + 1).trim();
  return after.split(/\s+/)[0] === ZOMBIE;
}

/**
 * Whether a process is there, asked with a signal of ZERO, which delivers no
 * signal. `EPERM` counts as alive: it means the process exists and this user
 * may not signal it (F122-FR-042). A process that exited and was not collected
 * is NOT there, whatever the signal says.
 */
export function isThere(pid: number): boolean {
  assertOneProcess(pid);
  if (hasNotBeenCollected(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

async function until(
  what: () => boolean,
  because: string,
  limitMs: number = WAIT_MS,
): Promise<void> {
  const deadline = Date.now() + limitMs;
  for (;;) {
    if (what()) return;
    if (Date.now() > deadline) throw new Error(`${because} did not happen inside ${limitMs} ms`);
    await new Promise((done) => setTimeout(done, 10));
  }
}

/* ------------------------------------------------------------------ *
 * One launch of the two cases.
 * ------------------------------------------------------------------ */

/** The scratch of one case: a control root of its own, and nothing shared. */
export type Launch = {
  readonly directory: string;
  readonly leaseFile: string;
  readonly logFile: string;
  readonly startedFile: string;
  readonly runId: string;
  readonly launchId: string;
  readonly launchNonce: string;
  dispose(): void;
};

/** Make the scratch of one case. */
export function aLaunch(label: string): Launch {
  const directory = mkdtempSync(join(tmpdir(), `ep17-${label}-`));
  return {
    directory,
    leaseFile: join(directory, "lease.json"),
    logFile: join(directory, "runtime.log"),
    startedFile: join(directory, "started.json"),
    runId: `run-${label}`,
    launchId: `launch-${label}`,
    launchNonce: `nonce-${label}-${String(process.pid)}`,
    dispose(): void {
      rmSync(directory, { recursive: true, force: true });
    },
  };
}

/** The record the parent wrote, read back. */
export function startedRecordOf(launch: Launch): StartedRecord {
  const record = JSON.parse(readFileSync(launch.startedFile, "utf8")) as StartedRecord;
  assert.equal(record.kind, STARTED_KIND, "the parent wrote its own record");
  return record;
}

/** The lease on disk, or `null`. */
export function leaseOf(launch: Launch): Lease | null {
  if (!existsSync(launch.leaseFile)) return null;
  try {
    return JSON.parse(readFileSync(launch.leaseFile, "utf8")) as Lease;
  } catch {
    return null;
  }
}

/**
 * §B.8 — the lease is VALID: it validates against the schema, it carries this
 * launch's nonce, and `validUntil` has not passed.
 */
export function assertTheLeaseIsValid(launch: Launch, lease: Lease | null): void {
  assert.notEqual(lease, null, "the started root wrote the lease");
  if (lease === null) return;
  assert.equal(isLease(lease), true, "the lease validates against `specstride.lease/1`");
  assert.equal(
    String(lease.launchNonce),
    launch.launchNonce,
    "the lease carries the launch nonce of this launch (F100-FR-160)",
  );
  assert.equal(
    statusLineIsStale(lease, new Date()),
    false,
    "`validUntil` of the lease has not passed (annex B, §B.8)",
  );
  assert.equal(
    Number((lease.owner as Record<string, unknown>).pid),
    startedRecordOf(launch).childPid,
    "the owner record of the lease names the process the strategy started",
  );
}

/**
 * Start the parent, let it start the root through the strategy under test, and
 * wait until it has reported what it started.
 */
export async function startThroughAParent(
  launch: Launch,
  way: WayTheParentEnds,
): Promise<StartedRecord> {
  const parent = spawn(
    process.execPath,
    [
      SAMPLE_PARENT_ENTRY,
      "--started",
      launch.startedFile,
      "--lease",
      launch.leaseFile,
      "--log",
      launch.logFile,
      "--run",
      launch.runId,
      "--launch",
      launch.launchId,
      "--nonce",
      launch.launchNonce,
      "--then",
      way === "exit" ? "exit" : "wait",
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  await until(() => existsSync(launch.startedFile), "the parent reported what it started");
  const record = startedRecordOf(launch);
  assert.equal(record.parentPid, parent.pid, "the record names the parent that wrote it");
  assert.equal(
    record.sessionLeader,
    true,
    "the started process is the leader of a process session of its own (F122-FR-001)",
  );
  if (way === "signal") {
    // Killed without warning: nothing of the parent runs, by construction.
    assertOneProcess(record.parentPid);
    process.kill(record.parentPid, WITHOUT_WARNING);
  }
  await until(() => !isThere(record.parentPid), "the parent ended");
  return record;
}

/** End the root the case started. A case leaves no process behind. */
export async function endTheChild(childPid: number): Promise<void> {
  // A case whose START threw reaches this with the initial `0`; there is no
  // process to end, and naming that id here would replace the real failure with
  // the refusal of the guard. Nothing of a start that did not happen is left
  // behind by construction: the strategy either spawned a process or threw.
  if (!Number.isInteger(childPid) || childPid < SMALLEST_ID) return;
  if (!isThere(childPid)) return;
  assertOneProcess(childPid);
  try {
    process.kill(childPid, WITHOUT_WARNING);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
  }
  await until(() => !isThere(childPid), `the started root ${String(childPid)} ended`);
}

/* ------------------------------------------------------------------ *
 * The cases.
 * ------------------------------------------------------------------ */

/** One of the two cases; they differ only in how the parent ends. */
function survivalCase(id: string, way: WayTheParentEnds, how: string): ConformanceCase {
  return Object.freeze({
    id,
    title:
      `EP-17: start through a parent, ${how}, and the started root lives on with a valid ` +
      `lease (F122-FR-001, F122-FR-002)`,
    level: "behaviour" as const,
    proves: Object.freeze(["F122-FR-001", "F122-FR-002"]),
    async run(impl): Promise<void> {
      const launch = aLaunch(way);
      let childPid = 0;
      try {
        // The implementation under test is reached through the registry's own
        // `operations`, so the case drives whatever was registered.
        useContext({
          leaseFile: launch.leaseFile,
          logFile: launch.logFile,
          runId: launch.runId,
          launchId: launch.launchId,
        });
        const described = (operationOf(impl, "describe") as () => { id: string })();
        assert.equal(typeof described.id, "string", "the strategy describes itself");

        const started = await startThroughAParent(launch, way);
        childPid = started.childPid;

        // 1 — the child lives, asked of the platform.
        assert.equal(
          isThere(childPid),
          true,
          `the started root ${String(childPid)} lives after its parent ${how}`,
        );
        // And it leads a process session of ITS OWN — read from the process
        // table, which is the one reading that can contradict the strategy's
        // claim (F122-FR-001).
        const session = sessionOf(childPid);
        if (session === null) {
          assert.equal(
            process.platform,
            "linux",
            "the process table is read on Linux; elsewhere the session is unverified",
          );
        } else {
          assert.equal(
            session,
            childPid,
            `the started root leads its own process session (F122-FR-001); the strategy ` +
              `claimed \`sessionLeader: ${String(started.sessionLeader)}\``,
          );
          assert.notEqual(
            session,
            sessionOf(process.pid),
            "and that session is not the session of the suite that asked for it",
          );
        }
        // And asked a second way: the log exists only because the child ran.
        await until(
          () => existsSync(launch.logFile) && readFileSync(launch.logFile, "utf8").length > 0,
          "the started root wrote to the runtime log (F122-FR-001)",
        );
        assert.match(
          readFileSync(launch.logFile, "utf8"),
          /the lease of/,
          "both outputs of the started root are appended to the runtime log",
        );

        // 2 — the lease is valid.
        await until(() => leaseOf(launch) !== null, "the started root wrote its lease");
        assertTheLeaseIsValid(launch, leaseOf(launch));
      } finally {
        await endTheChild(childPid);
        launch.dispose();
      }
    },
  });
}

/** F122-FR-003 — `describe` and what a Wave 1 strategy may claim. */
const describeCase: ConformanceCase = Object.freeze({
  id: "CT-122-2.describe",
  title:
    "EP-17: `describe` gives the id of the strategy and what it survives, as a subset of " +
    "`parent-end`, `session-end`, `reboot`, and claims no reboot (F122-FR-003)",
  level: "behaviour" as const,
  proves: Object.freeze(["F122-FR-003"]),
  run(impl): void {
    const described = (
      operationOf(impl, "describe") as () => {
        id: string;
        survives: { endOfTheParent: boolean; endOfTheHostSession: boolean; reboot: boolean };
      }
    )();
    assert.equal(described.id, SAMPLE_STRATEGY_ID);
    assert.deepEqual(described.survives, SAMPLE_SURVIVES);
    assert.equal(
      described.survives.reboot,
      SURVIVES_A_REBOOT_IN_WAVE_1,
      "no Wave 1 strategy claims a reboot (F122-FR-003)",
    );
    const available = (
      operationOf(impl, "available") as () => { available: boolean; reason: string }
    )();
    assert.equal(available.available, true);
    assert.equal(typeof available.reason, "string");
  },
});

/** The behaviour cases of EP-17, in the order §F.6 names them. */
export const behaviourCases: readonly ConformanceCase[] = Object.freeze([
  survivalCase("CT-122-2", "exit", "ended of its own accord"),
  survivalCase("CT-122-3", "signal", `was killed with ${WITHOUT_WARNING}`),
  describeCase,
]);
