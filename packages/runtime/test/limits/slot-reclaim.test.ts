/**
 * T091 (feature 154, US4) — RECLAIM AND THE LIVE OWNER (F154-FR-044).
 *
 * - a slot whose owner is proven dead (`stale-owner-dead`, the liveness
 *   endpoint gone) IS reclaimed, by the one atomic rename of
 *   `../lock/reclaim.ts`, and the tombstone stands (F122-FR-015, -016);
 * - a LIVE owner's slot is NEVER removed: a contender's reclaim answers
 *   `wait`, and the lock directory and its owner record still name the
 *   first owner;
 * - `held-foreign` and `unknown` count as HELD: `slotAdmissionOf` and
 *   `admit` answer `wait` for them, and a reclaim of them is refused.
 *
 * Every test is hermetic: a temporary user-state root, workspace and
 * runtime directory per test.
 */
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  createSlotStore,
  slotAdmissionOf,
  slotsRootOf,
  slotControlRootOf,
  type HostSlots,
} from "../../src/limits/slot-store.ts";
import { ENDPOINT_FIELD } from "../../src/lock/probe.ts";
import { OWNER_RECORD_FILE, TOMBSTONE_PREFIX } from "../../src/lock/paths.ts";

/** One hermetic store over a bound of the given width. */
function storeOf(
  bounds: Readonly<Record<string, number>>,
  roots: { userStateRoot: string; workspace: string; runtime: string },
  over?: { now?: () => Date },
): HostSlots {
  return createSlotStore({
    userStateRoot: roots.userStateRoot,
    workspaceRealPath: roots.workspace,
    bounds,
    runtimeDirectory: roots.runtime,
    ...(over?.now === undefined ? {} : { now: over.now }),
  });
}

function roots(): { userStateRoot: string; workspace: string; runtime: string; tidy(): void } {
  const userStateRoot = mkdtempSync(join(tmpdir(), "specstride-reclaim-state-"));
  const workspace = mkdtempSync(join(tmpdir(), "specstride-reclaim-ws-"));
  const runtime = mkdtempSync(join(tmpdir(), "specstride-reclaim-runtime-"));
  return {
    userStateRoot,
    workspace,
    runtime,
    tidy(): void {
      rmSync(userStateRoot, { recursive: true, force: true });
      rmSync(workspace, { recursive: true, force: true });
      rmSync(runtime, { recursive: true, force: true });
    },
  };
}

/** The owner record of the lock of one slot, read off the disk. */
function ownerOf(
  roots: { userStateRoot: string },
  bound: string,
  slot: number,
): Record<string, unknown> {
  return JSON.parse(
    readFileSync(
      join(slotControlRootOf(roots.userStateRoot, bound, slot), "lock", OWNER_RECORD_FILE),
      "utf8",
    ),
  ) as Record<string, unknown>;
}

test("a dead owner's slot is reclaimed by one atomic rename, tombstone kept", async () => {
  const r = roots();
  try {
    const a = storeOf({ checks: 1 }, r);
    const taken = await a.acquire("checks", { runId: "run-a", launchId: "launch-a" });
    assert.equal(taken.acquired, true);
    if (!taken.acquired) return;
    const endpoint = String(ownerOf(r, "checks", taken.slot)[ENDPOINT_FIELD]);
    assert.ok(endpoint.length > 0);

    // The holder dies: its boot identity is gone (the machine rebooted), so
    // the probe reads `stale-owner-dead` through rows P5/P6 — a record of
    // another boot counts as dead whatever process now has its pid
    // (F122-FR-013).
    const recordPath = join(
      slotControlRootOf(r.userStateRoot, "checks", taken.slot),
      "lock",
      OWNER_RECORD_FILE,
    );
    writeFileSync(
      recordPath,
      JSON.stringify({ ...ownerOf(r, "checks", taken.slot), bootId: "boot-that-is-gone" }),
    );
    const probe = await a.probe("checks");
    assert.equal(probe.readable, true);
    if (!probe.readable) return;
    assert.equal(probe.probes[0]!.status, "stale-owner-dead");

    // A contender reclaims: acquired, verdict `reclaim`, and the lock now
    // names the contender's launch.
    const b = storeOf({ checks: 1 }, r);
    const reclaimed = await b.reclaim("checks", 0, { runId: "run-b", launchId: "launch-b" });
    assert.deepEqual(
      { acquired: reclaimed.acquired, verdict: reclaimed.acquired ? reclaimed.verdict : null },
      { acquired: true, verdict: "reclaim" },
    );
    if (!reclaimed.acquired) return;
    assert.equal(reclaimed.slot, 0);
    assert.equal(
      ownerOf(r, "checks", 0).launchId,
      "launch-b",
      "the reclaimed lock does not name the contender",
    );

    // The tombstone of the stale owner stands (F122-FR-015, -016): a
    // sibling of the lock directory, derived from the stale record.
    const siblings = readdirSync(slotControlRootOf(r.userStateRoot, "checks", 0));
    assert.ok(
      siblings.some((name) => name.startsWith(TOMBSTONE_PREFIX)),
      `no tombstone beside the reclaimed lock: ${siblings.join(", ")}`,
    );
    assert.equal(await a.release("checks"), undefined);
  } finally {
    r.tidy();
  }
});

test("a live owner's slot is never removed by a contender's reclaim", async () => {
  const r = roots();
  try {
    const a = storeOf({ checks: 1 }, r);
    const taken = await a.acquire("checks", { runId: "run-a", launchId: "launch-a" });
    assert.equal(taken.acquired, true);
    if (!taken.acquired) return;

    const b = storeOf({ checks: 1 }, r);
    const refused = await b.reclaim("checks", 0, { runId: "run-b", launchId: "launch-b" });
    assert.deepEqual(
      { acquired: refused.acquired, verdict: refused.acquired ? refused.verdict : refused.verdict },
      { acquired: false, verdict: "wait" },
    );
    if (refused.acquired) return;
    assert.match(refused.reason, /not reclaimable: held-live/);
    // The lock and its record still belong to A.
    const record = ownerOf(r, "checks", 0);
    assert.equal(record.launchId, "launch-a");
    assert.equal(record.runId, "run-a");
    assert.ok(existsSync(join(slotControlRootOf(r.userStateRoot, "checks", 0), "lock")));
  } finally {
    r.tidy();
  }
});

test("held-foreign and unknown count as held: admit waits, reclaim refuses", async () => {
  const r = roots();
  try {
    const a = storeOf({ checks: 1 }, r);
    const taken = await a.acquire("checks", { runId: "run-a", launchId: "launch-a" });
    assert.equal(taken.acquired, true);
    if (!taken.acquired) return;
    const recordPath = join(
      slotControlRootOf(r.userStateRoot, "checks", 0),
      "lock",
      OWNER_RECORD_FILE,
    );
    const record = JSON.parse(readFileSync(recordPath, "utf8")) as Record<string, unknown>;

    // held-foreign: the record names ANOTHER host (row P3).
    writeFileSync(recordPath, JSON.stringify({ ...record, hostName: "some-other-host.test" }));
    const foreignProbe = await a.probe("checks");
    assert.equal(foreignProbe.readable, true);
    if (!foreignProbe.readable) return;
    assert.equal(foreignProbe.probes[0]!.status, "held-foreign");
    const foreignAdmission = await a.admit("checks");
    assert.equal(foreignAdmission.verdict, "wait");
    assert.ok((foreignAdmission.reason ?? "").includes("held"), "the wait names the holds");
    assert.equal(slotAdmissionOf("checks", 1, foreignProbe.probes).verdict, "wait");
    const b = storeOf({ checks: 1 }, r);
    const foreignReclaim = await b.reclaim("checks", 0, { launchId: "launch-b" });
    assert.equal(foreignReclaim.acquired, false);
    if (!foreignReclaim.acquired) assert.equal(foreignReclaim.verdict, "wait");

    // unknown: the owner record is unreadable (row P2), which counts as held.
    writeFileSync(recordPath, "{ not json");
    const unknownProbe = await a.probe("checks");
    assert.equal(unknownProbe.readable, true);
    if (!unknownProbe.readable) return;
    assert.equal(unknownProbe.probes[0]!.status, "unknown");
    assert.equal(slotAdmissionOf("checks", 1, unknownProbe.probes).verdict, "wait");
    const unknownAdmission = await a.admit("checks");
    assert.equal(unknownAdmission.verdict, "wait");
  } finally {
    r.tidy();
  }
});

test("the slot layout of a bound exists under <user-state>/slots/<bound>/", async () => {
  const r = roots();
  try {
    const a = storeOf({ checks: 2 }, r);
    await a.acquire("checks", { runId: "run-a" });
    const names = readdirSync(slotsRootOf(r.userStateRoot, "checks")).sort();
    assert.deepEqual(names, ["0", "1"]);
  } finally {
    r.tidy();
  }
});
