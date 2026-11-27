/**
 * T089 — the slot store of feature 154 (F154-FR-044): a store over a bound
 * of width N makes N lock directories under `<user-state>/slots/<bound>/`,
 * each through `createDirectoryLock` (`../lock/directory-lock.ts` :266),
 * takes a free one, names its owner with `ownerRecordFor`
 * (`../lock/directory-lock.ts` :514), answers `probe` per slot, and releases
 * what it holds. Every test is hermetic: a temporary user-state root, a
 * temporary workspace and a temporary runtime directory per test.
 */
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  createSlotStore,
  slotAdmissionOf,
  slotsRootOf,
  slotControlRootOf,
  type HostSlots,
  type SlotStoreOptions,
} from "../../src/limits/slot-store.ts";
import { ACQUIRED_AT_FIELD, ENDPOINT_FIELD } from "../../src/lock/probe.ts";
import { OWNER_RECORD_FILE } from "../../src/lock/paths.ts";

/** One hermetic environment per test. */
function environment(bounds: Readonly<Record<string, number>>): {
  store: HostSlots;
  userStateRoot: string;
  slots: string;
  tidy(): void;
} {
  const userStateRoot = mkdtempSync(join(tmpdir(), "specstride-slots-state-"));
  const workspaceRealPath = mkdtempSync(join(tmpdir(), "specstride-slots-ws-"));
  const runtimeDirectory = mkdtempSync(join(tmpdir(), "specstride-slots-runtime-"));
  const options: SlotStoreOptions = {
    userStateRoot,
    workspaceRealPath,
    bounds,
    runtimeDirectory,
  };
  return {
    store: createSlotStore(options),
    userStateRoot,
    slots: slotsRootOf(userStateRoot, "checks"),
    tidy(): void {
      rmSync(userStateRoot, { recursive: true, force: true });
      rmSync(workspaceRealPath, { recursive: true, force: true });
      rmSync(runtimeDirectory, { recursive: true, force: true });
    },
  };
}

test("the store makes N lock directories per bound and takes a free slot", async () => {
  const env = environment({ checks: 2 });
  try {
    const result = await env.store.acquire("checks", {
      runId: "run-a",
      launchId: "launch-a",
      launchNonce: "nonce-a",
    });
    assert.equal(
      result.acquired,
      true,
      `the acquire did not take a slot: ${JSON.stringify(result)}`,
    );
    if (!result.acquired) return; // narrowed for the type checker
    assert.ok(result.slot === 0 || result.slot === 1, `slot ${result.slot} is outside 0..1`);
    assert.equal(result.verdict, "take");
    assert.equal(result.owner.runId, "run-a", "the owner record does not carry the run");

    // The layout: exactly N entries under <user-state>/slots/<bound>/, and
    // the taken slot's lock directory exists under its own control root.
    const names = readdirSync(env.slots).sort();
    assert.deepEqual(names, ["0", "1"], `the bound holds ${names.join(", ")}, not slots 0 and 1`);
    const lockDirectory = join(slotControlRootOf(env.userStateRoot, "checks", result.slot), "lock");
    assert.ok(existsSync(lockDirectory), `the lock directory ${lockDirectory} does not exist`);

    // The owner record of the taken slot, as `ownerRecordFor` wrote it.
    const record = JSON.parse(
      readFileSync(join(lockDirectory, OWNER_RECORD_FILE), "utf8"),
    ) as Record<string, unknown>;
    assert.equal(record.pid, process.pid, "the owner record does not name this process");
    assert.equal(record.runId, "run-a");
    assert.equal(
      typeof record[ENDPOINT_FIELD],
      "string",
      "the record carries no liveness endpoint",
    );
    assert.equal(typeof record[ACQUIRED_AT_FIELD], "string", "the record carries no acquired time");
  } finally {
    env.tidy();
  }
});

test("a probe answers held-live for the taken slot and free for the others", async () => {
  const env = environment({ checks: 3 });
  try {
    const result = await env.store.acquire("checks");
    assert.equal(result.acquired, true);
    if (!result.acquired) return;
    const probe = await env.store.probe("checks");
    assert.equal(probe.readable, true, "the store of a configured bound must be readable");
    if (!probe.readable) return;
    assert.equal(probe.width, 3);
    assert.equal(probe.probes.length, 3, "one status per slot");
    for (const slot of probe.probes) {
      if (slot.slot === result.slot) {
        assert.equal(
          slot.status,
          "held-live",
          `slot ${slot.slot} is ${slot.status}, not held-live`,
        );
      } else {
        assert.equal(slot.status, "free", `slot ${slot.slot} is ${slot.status}, not free`);
      }
    }
  } finally {
    env.tidy();
  }
});

test("a second acquire takes another free slot, not the held one", async () => {
  const env = environment({ checks: 2 });
  try {
    const one = await env.store.acquire("checks", { runId: "run-1" });
    const two = await env.store.acquire("checks", { runId: "run-2" });
    assert.equal(one.acquired, true);
    assert.equal(two.acquired, true);
    if (!one.acquired || !two.acquired) return;
    assert.notEqual(one.slot, two.slot, "both acquires took the same slot");
  } finally {
    env.tidy();
  }
});

test("release frees the held slot and is idempotent", async () => {
  const env = environment({ checks: 1 });
  try {
    const result = await env.store.acquire("checks");
    assert.equal(result.acquired, true);
    if (!result.acquired) return;
    await env.store.release("checks");
    const probe = await env.store.probe("checks");
    assert.equal(probe.readable, true);
    if (!probe.readable) return;
    assert.equal(probe.probes[result.slot].status, "free", "the released slot is not free");
    await assert.doesNotReject(
      () => env.store.release("checks"),
      "a second release must be silence",
    );
  } finally {
    env.tidy();
  }
});

test("a bound that is not configured is unbounded, never an error", async () => {
  const env = environment({ checks: 1 });
  try {
    const result = await env.store.acquire("nope");
    assert.deepEqual(
      { acquired: result.acquired, verdict: result.verdict },
      { acquired: false, verdict: "unbounded" },
    );
    if (result.acquired) return;
    assert.match(result.reason, /no bound is configured/);
    const probe = await env.store.probe("nope");
    assert.equal(probe.readable, false, "an unconfigured bound is not readable");
    if (probe.readable) return;
    assert.match(probe.reason, /no bound is configured/);
    const admission = await env.store.admit("nope");
    assert.equal(admission.verdict, "unbounded");
    assert.ok(admission.reason !== undefined, "the unbounded admission carries its reason");
  } finally {
    env.tidy();
  }
});

test("slotAdmissionOf decides take, reclaim and wait over the probes", () => {
  const probes = [
    { slot: 0, status: "held-live" as const, row: "P4" },
    { slot: 1, status: "free" as const, row: "P1" },
  ];
  assert.deepEqual(
    {
      verdict: slotAdmissionOf("checks", 2, probes).verdict,
      slot: slotAdmissionOf("checks", 2, probes).slot,
    },
    { verdict: "take", slot: 1 },
  );
  const stale = [
    { slot: 0, status: "stale-owner-dead" as const, row: "P6" },
    { slot: 1, status: "held-foreign" as const, row: "P3" },
  ];
  assert.deepEqual(
    {
      verdict: slotAdmissionOf("checks", 2, stale).verdict,
      slot: slotAdmissionOf("checks", 2, stale).slot,
    },
    { verdict: "reclaim", slot: 0 },
  );
  const held = [
    { slot: 0, status: "held-live" as const, row: "P4" },
    { slot: 1, status: "unknown" as const, row: "P2" },
  ];
  const waiting = slotAdmissionOf("checks", 2, held);
  assert.equal(waiting.verdict, "wait");
  assert.ok(waiting.reason !== undefined);
  const unreadable = slotAdmissionOf("checks", 1, null, "the store could not be read");
  assert.equal(unreadable.verdict, "unbounded");
  assert.equal(unreadable.reason, "the store could not be read");
});

test("admit decides over the live probes of the store", async () => {
  const env = environment({ checks: 1 });
  try {
    mkdirSync(env.slots, { recursive: true });
    const before = await env.store.admit("checks");
    assert.deepEqual(
      { verdict: before.verdict, slot: before.slot, bound: before.bound },
      {
        verdict: "take",
        slot: 0,
        bound: 1,
      },
    );
    assert.equal(before.rule, "checks");
    const result = await env.store.acquire("checks");
    assert.equal(result.acquired, true);
    const after = await env.store.admit("checks");
    assert.equal(after.verdict, "wait", `a full bound must answer wait, not ${after.verdict}`);
  } finally {
    env.tidy();
  }
});
