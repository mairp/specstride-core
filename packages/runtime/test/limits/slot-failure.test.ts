/**
 * T093 (feature 154, US4) — FAILURE MODES OF THE SLOT STORE
 * (F154-FR-004, F154-FR-044). Nothing here throws because the store said
 * no; every failed precondition is an answer with its reason:
 *
 * - a holder that dies is reclaimed by a contender;
 * - a clock that jumps (the lease's `validUntil` long past against the
 *   holder's boot id and start time) never frees a LIVE owner's slot — the
 *   lock's probe decides by liveness and boot identity, never by the wall
 *   clock, and a slot whose owner lives is never removed;
 * - a home seen by two hosts answers `held-foreign` and counts as held;
 * - an unreadable store (a file where the bound's directory must be made,
 *   as a full disk leaves it) answers `unbounded` on acquire, admit and
 *   probe, and the caller proceeds without the bound.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  createSlotStore,
  slotsRootOf,
  slotControlRootOf,
  type HostSlots,
  type SlotStoreOptions,
} from "../../src/limits/slot-store.ts";
import { OWNER_RECORD_FILE } from "../../src/lock/paths.ts";

function roots(): { userStateRoot: string; workspace: string; runtime: string; tidy(): void } {
  const userStateRoot = mkdtempSync(join(tmpdir(), "specstride-fail-state-"));
  const workspace = mkdtempSync(join(tmpdir(), "specstride-fail-ws-"));
  const runtime = mkdtempSync(join(tmpdir(), "specstride-fail-runtime-"));
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

function storeOf(
  r: { userStateRoot: string; workspace: string; runtime: string },
  bounds: Readonly<Record<string, number>> = { checks: 1 },
  now?: () => Date,
): HostSlots {
  const options: SlotStoreOptions = {
    userStateRoot: r.userStateRoot,
    workspaceRealPath: r.workspace,
    bounds,
    runtimeDirectory: r.runtime,
    ...(now === undefined ? {} : { now }),
  };
  return createSlotStore(options);
}

test("a holder that dies is reclaimed by a contender", async () => {
  const r = roots();
  try {
    const a = storeOf(r);
    const taken = await a.acquire("checks", { runId: "run-a", launchId: "launch-a" });
    assert.equal(taken.acquired, true);
    if (!taken.acquired) return;
    // The boot of the holder is gone: the probe reads stale-owner-dead.
    const recordPath = join(
      slotControlRootOf(r.userStateRoot, "checks", 0),
      "lock",
      OWNER_RECORD_FILE,
    );
    writeFileSync(
      recordPath,
      JSON.stringify({
        ...JSON.parse(readFileSync(recordPath, "utf8") as string),
        bootId: "boot-gone",
      }),
    );
    const admission = await a.admit("checks");
    assert.deepEqual(
      { verdict: admission.verdict, slot: admission.slot },
      { verdict: "reclaim", slot: 0 },
    );
    const b = storeOf(r);
    const reclaimed = await b.reclaim("checks", 0, { runId: "run-b", launchId: "launch-b" });
    assert.equal(reclaimed.acquired, true);
    if (reclaimed.acquired) assert.equal(reclaimed.verdict, "reclaim");
  } finally {
    r.tidy();
  }
});

test("a clock that jumps never frees a live owner's slot", async () => {
  const r = roots();
  try {
    const atLaunch = new Date("2026-11-25T00:00:00Z");
    const a = storeOf(r, { checks: 1 }, () => atLaunch);
    const taken = await a.acquire("checks", { runId: "run-a", launchId: "launch-a" });
    assert.equal(taken.acquired, true);
    if (!taken.acquired) return;
    // The clock of the contender jumps far past the lease's `validUntil`
    // — days, against a lease of seconds. The holder's boot id and start
    // time are unchanged and its liveness answers, so the probe decides
    // `held-live` whatever the clock says (F122-FR-013, F154-FR-044: a
    // slot whose owner lives is never removed).
    const b = storeOf(r, { checks: 1 }, () => new Date("2026-12-25T00:00:00Z"));
    const probe = await b.probe("checks");
    assert.equal(probe.readable, true);
    if (!probe.readable) return;
    assert.equal(probe.probes[0]!.status, "held-live");
    const admission = await b.admit("checks");
    assert.equal(admission.verdict, "wait");
    const refused = await b.reclaim("checks", 0, { runId: "run-b", launchId: "launch-b" });
    assert.equal(refused.acquired, false);
    if (!refused.acquired) assert.match(refused.reason, /not reclaimable: held-live/);
  } finally {
    r.tidy();
  }
});

test("a home seen by two hosts answers held-foreign and counts as held", async () => {
  const r = roots();
  try {
    const a = storeOf(r);
    const taken = await a.acquire("checks", { runId: "run-a", launchId: "launch-a" });
    assert.equal(taken.acquired, true);
    if (!taken.acquired) return;
    // Another host reads the same home: its record names a host that is
    // not the reader's (row P3).
    const recordPath = join(
      slotControlRootOf(r.userStateRoot, "checks", 0),
      "lock",
      OWNER_RECORD_FILE,
    );
    writeFileSync(
      recordPath,
      JSON.stringify({
        ...JSON.parse(readFileSync(recordPath, "utf8") as string),
        hostName: "other-host.test",
      }),
    );
    const probe = await a.probe("checks");
    assert.equal(probe.readable, true);
    if (!probe.readable) return;
    assert.equal(probe.probes[0]!.status, "held-foreign");
    const admission = await a.admit("checks");
    assert.equal(admission.verdict, "wait");
    assert.ok((admission.reason ?? "").includes("held"), "the wait names the hold");
  } finally {
    r.tidy();
  }
});

test("an unreadable store answers unbounded and never throws", async () => {
  const r = roots();
  try {
    // A full disk (or any other failure) leaves the bound's directory
    // unmakeable: a regular file stands where `slots/checks/` must be.
    mkdirSync(join(r.userStateRoot, "slots"), { recursive: true });
    writeFileSync(join(slotsRootOf(r.userStateRoot, "checks")), "not a directory");
    const a = storeOf(r);
    const acquired = await a.acquire("checks", { runId: "run-a" });
    assert.deepEqual(
      {
        acquired: acquired.acquired,
        verdict: acquired.acquired ? acquired.verdict : acquired.verdict,
      },
      { acquired: false, verdict: "unbounded" },
    );
    if (acquired.acquired) return;
    assert.match(acquired.reason, /could not be read or made/);
    const admission = await a.admit("checks");
    assert.equal(admission.verdict, "unbounded");
    assert.ok((admission.reason ?? "").length > 0, "the unbounded verdict carries its reason");
    const probe = await a.probe("checks");
    assert.deepEqual(
      { readable: probe.readable, reason: probe.readable ? "" : probe.reason.length > 0 },
      { readable: false, reason: true },
    );
    // Release of what was never held is a quiet no-op, never an error.
    await a.release("checks");
  } finally {
    r.tidy();
  }
});
