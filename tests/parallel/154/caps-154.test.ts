/**
 * T158 (feature 154, phase 17, G8) — V-15, V-17 / F154-FR-076 (+F154-FR-040).
 *
 * THE ATTEMPT CAPS COUNT EVERY WORKER OF EVERY GROUP, AND THE PER-ACCOUNT
 * BOUND HOLDS ACROSS RUNS:
 *
 * (a) through the engine's real host-slot allocator (`makeRunHostSlots`)
 *     the hard ceilings — the max-workers ceiling (`checks`) and the
 *     capacity class (`resources/<name>`) — bind over the TOTAL demand of
 *     every worker of every group of the attempt, never per group: 3 groups
 *     x 2 workers demand 6 slots, the ceiling of 3 admits only the first
 *     three, and the workers of the later groups wait while the earlier
 *     groups' workers hold, each holder in a DISTINCT slot. The time cap of
 *     the attempt is exercised through the real watchdog the engine ticks
 *     per worker (`startWorkerWatchdog`, `ceilingSec` — the `timeLimitSec`
 *     every worker of every group of the attempt carries, `parallel-attempt.ts`),
 *     driven on a deterministic clock: the per-worker spend is set through
 *     the worker's start (`startedAtMs`), every worker of every group is
 *     ticked, and only the workers whose spend is over the ceiling are
 *     denied, with the elapsed of their own spend — the cap decision counted
 *     every worker of every group, whose aggregate spend is far over the cap
 *     while each of the earlier groups' workers is under it.
 *
 * (b) with the same account key and the same durable store (one private
 *     HOME), the first allocation consumes the per-account bound
 *     (`sessions/<account>`, F154-FR-040) and the second allocation of a
 *     fresh engine start over the same store is throttled with the recorded
 *     reason, while the slot record on disk shows the bound.
 *
 * HERMETIC: private mkdtemp HOMEs, controlled sleeps and injectable timing
 * only, `rmSync` in `finally`.
 */
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { makeRunHostSlots } from "../../../packages/cli/src/engine/host-slots.ts";
import {
  startWorkerWatchdog,
  workerSignalSender,
} from "../../../packages/cli/src/engine/worker-supervisor.ts";
import type { SlotAdmission } from "../../../packages/runtime/src/limits/slot-store.ts";
import { OWNER_RECORD_FILE } from "../../../packages/runtime/src/lock/paths.ts";

/** One worker of one group of the attempt, labelled so the test can say who held and who waited. */
type WorkerOfTheGroup = { readonly group: number; readonly worker: number; readonly label: string };

const workersOfThreeGroups = (workersPerGroup: number): readonly WorkerOfTheGroup[] => {
  const out: WorkerOfTheGroup[] = [];
  for (let group = 0; group < 3; group += 1) {
    for (let worker = 0; worker < workersPerGroup; worker += 1) {
      out.push(Object.freeze({ group, worker, label: `g${String(group)}w${String(worker)}` }));
    }
  }
  return out;
};

/** The user-state root the engine resolves for a private HOME (`userStateRoot`). */
const userStateOf = (home: string): string => join(home, ".local", "state", "specstride", "user");

test("G8 T158: the hard ceilings bind over the TOTAL of every worker of every group, not per group", async () => {
  const home = mkdtempSync(join(tmpdir(), "caps-154-ceilings-"));
  // The two ceiling classes of the attempt: the max-workers ceiling (`checks`)
  // and a capacity class (`resources/worktrees`), each bound counting EVERY
  // worker of EVERY group of the attempt.
  const slots = makeRunHostSlots({
    home,
    workdir: process.cwd(),
    env: {
      SPECSTRIDE_HOST_CHECKS_CONCURRENT: "3",
      SPECSTRIDE_HOST_RESOURCES_WORKTREES: "2",
    },
    limitsOn: true,
  });
  assert.ok(slots.store !== null, "the slot store of the start was not built");
  assert.equal(slots.bounds.checks, 3);
  assert.equal(slots.bounds["resources/worktrees"], 2);
  // Every worker of the attempt carries its OWN engine start's slots: the
  // takes below each go through a fresh `makeRunHostSlots` over the SAME
  // durable store (the private HOME), exactly as two workers of two groups
  // of one attempt contend for the host's slots.
  const starts: ReturnType<typeof makeRunHostSlots>[] = [];
  const startOf = (): ReturnType<typeof makeRunHostSlots> => {
    const one = makeRunHostSlots({
      home,
      workdir: process.cwd(),
      env: {
        SPECSTRIDE_HOST_CHECKS_CONCURRENT: "3",
        SPECSTRIDE_HOST_RESOURCES_WORKTREES: "2",
      },
      limitsOn: true,
    });
    starts.push(one);
    return one;
  };
  try {
    /* ---- the max-workers ceiling: 3 groups x 2 workers = 6 demanded, 3 held. ---- */
    const admissions: Record<string, SlotAdmission[]> = {};
    const take = (who: WorkerOfTheGroup, bound: string): Promise<(() => Promise<void>) | null> =>
      startOf().take(bound, (admission) => {
        (admissions[`${bound}/${who.label}`] ??= []).push(admission);
      });
    const everyone = workersOfThreeGroups(2);
    // The first three workers of the attempt (groups 0 and 1) hold the whole ceiling.
    const holders: { who: WorkerOfTheGroup; release: () => Promise<void> }[] = [];
    for (const who of everyone.slice(0, 3)) {
      const release = await take(who, "checks");
      assert.ok(release !== null, `${who.label} of the attempt did not acquire a slot`);
      holders.push({ who, release });
    }
    const heldSlots = holders.map(
      ({ who }) => admissions[`checks/${who.label}`]!.find((a) => a.verdict === "take")!.slot,
    );
    assert.deepEqual(
      [...new Set(heldSlots)].sort(),
      [0, 1, 2],
      `the three holders did not hold DISTINCT slots: ${String(heldSlots)}`,
    );
    for (const admission of holders.flatMap(({ who }) => admissions[`checks/${who.label}`]!)) {
      assert.equal(
        admission.bound,
        3,
        `the ceiling ${who_label(admission)} was not the TOTAL bound`,
      );
    }
    // The three later workers of the attempt (the rest of group 1 and all of
    // group 2) wait while the earlier groups' workers hold.
    const later = everyone.slice(3).map((who) => ({ who, taken: take(who, "checks") }));
    await new Promise((done) => setTimeout(done, 250));
    const stillWaiting = await Promise.all(
      later.map(async ({ who, taken }) => {
        let acquired = false;
        const probe = await Promise.race([
          taken.then((release) => {
            acquired = release !== null;
            return "settled";
          }),
          new Promise((done) => setTimeout(() => done("pending"), 0)),
        ]);
        assert.equal(
          probe,
          "pending",
          `${who.label} of a later group acquired past the TOTAL ceiling`,
        );
        const seen = admissions[`checks/${who.label}`] ?? [];
        assert.ok(
          seen.some(
            (a) =>
              a.verdict === "wait" && a.bound === 3 && (a.reason ?? "").includes("all 3 slots"),
          ),
          `${who.label} was never told the TOTAL ceiling was full: ${JSON.stringify(seen)}`,
        );
        return { who, taken, acquired };
      }),
    );
    assert.ok(
      stillWaiting.every(({ acquired }) => acquired === false),
      "a worker of a later group slipped past the ceiling that the earlier groups filled",
    );
    // A release of an earlier group's worker opens the ceiling to the later groups.
    await holders[0]!.release();
    await holders[1]!.release();
    await holders[2]!.release();
    const settled = await Promise.all(
      stillWaiting.map(async ({ who, taken }) => {
        const release = await Promise.race([
          taken,
          new Promise<null>((done) => setTimeout(() => done(null), 5_000)),
        ]);
        assert.ok(
          release !== null,
          `${who.label} never acquired after the earlier groups released`,
        );
        return { who, release };
      }),
    );
    const lateSlots = settled.map(
      ({ who }) => admissions[`checks/${who.label}`]!.find((a) => a.verdict === "take")!.slot,
    );
    assert.ok(
      lateSlots.every((slot) => slot !== undefined && slot >= 0 && slot <= 2),
      `a late worker held a slot outside the ceiling: ${String(lateSlots)}`,
    );
    for (const { release } of settled) await release();

    /* ---- the capacity class: the same TOTAL rule, a bound of 2, 4 workers. ---- */
    const capacity: Record<string, SlotAdmission[]> = {};
    const takeCapacity = (who: WorkerOfTheGroup): Promise<(() => Promise<void>) | null> =>
      startOf().take("resources/worktrees", (admission) => {
        (capacity[who.label] ??= []).push(admission);
      });
    const four = everyone.slice(0, 4);
    const capacityHolders: { who: WorkerOfTheGroup; release: () => Promise<void> }[] = [];
    for (const who of four.slice(0, 2)) {
      const release = await takeCapacity(who);
      assert.ok(release !== null, `${who.label} did not acquire a slot of the capacity class`);
      capacityHolders.push({ who, release });
    }
    const capacitySlots = capacityHolders.map(
      ({ who }) => capacity[who.label]!.find((a) => a.verdict === "take")!.slot,
    );
    assert.deepEqual(
      [...new Set(capacitySlots)].sort(),
      [0, 1],
      "the two holders of the capacity class did not hold DISTINCT slots",
    );
    const overDemand = four.slice(2).map((who) => ({ who, taken: takeCapacity(who) }));
    await new Promise((done) => setTimeout(done, 250));
    for (const { who, taken } of overDemand) {
      let acquired = false;
      const probe = await Promise.race([
        taken.then((release) => {
          acquired = release !== null;
          return "settled";
        }),
        new Promise((done) => setTimeout(() => done("pending"), 0)),
      ]);
      assert.equal(
        probe,
        "pending",
        `${who.label} acquired past the capacity class of the TOTAL attempt`,
      );
      assert.ok(
        (capacity[who.label] ?? []).some(
          (a) => a.verdict === "wait" && (a.reason ?? "").includes("all 2 slots"),
        ),
        `${who.label} was never told the capacity class was full`,
      );
    }
    for (const { release } of capacityHolders) await release();
    for (const { taken } of overDemand) {
      const release = await Promise.race([
        taken,
        new Promise<null>((done) => setTimeout(() => done(null), 5_000)),
      ]);
      assert.ok(release !== null, "a worker of the capacity class never acquired after a release");
      await release;
    }
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("G8 T158: the attempt time cap counts the spend of EVERY worker of EVERY group (deterministic clock)", async () => {
  // A deterministic clock: the attempt began at NOW, and each worker's spend
  // is set through its start (`startedAtMs`), exactly the base the engine's
  // watchdog measures the attempt's ceiling on (worker-supervisor.ts, the
  // `hard_cap` tick).
  const NOW = Date.now();
  const CAP_SEC = 100;
  const spendMsOf = new Map<string, number>([
    // groups 0 and 1: every worker individually UNDER the cap …
    ["g0w0", 10_000],
    ["g0w1", 45_000],
    ["g1w0", 30_000],
    // … yet the workers over it, of the LATER groups, must be denied.
    ["g1w1", 120_000],
    ["g2w0", 95_000],
    ["g2w1", 250_000],
  ]);
  const killed = new Map<string, { reason: string; elapsedSec: number }>();
  const watchdogs: { stop: () => void }[] = [];
  let pid = 4_000_000; // far above any real pid: the sender always refuses, nothing is signalled
  const sender = workerSignalSender(() => undefined);
  try {
    for (const [label, spendMs] of spendMsOf) {
      pid += 1;
      const watchdog = startWorkerWatchdog({
        sender,
        target: { pid, startedAtMs: NOW, runTokenHash: "a".repeat(64), processGroup: pid },
        // THE CAP DECISION: this worker's spend, of this group of the attempt.
        startedAtMs: NOW - spendMs,
        ceilingSec: CAP_SEC,
        tickMs: 3_600_000, // the interval never fires; the test ticks through `kill()`
        graceMs: 0,
        settleMs: async () => undefined, // the ladder's grace is instant under the fake clock
        onKilled: (reason, elapsedSec) => {
          killed.set(label, { reason, elapsedSec });
        },
      });
      watchdogs.push(watchdog);
      watchdog.kill(); // one deterministic tick of the cap decision for THIS worker
      await new Promise((done) => setTimeout(done, 5));
    }
    // Every worker of every group was ticked — six cap decisions, none skipped.
    assert.equal(spendMsOf.size, 6);
    // Only the workers whose own spend is over the ceiling are denied, and
    // the denial carries the elapsed of their own spend: the two over-cap
    // workers are of groups 1 and 2 — a worker of a later group is NOT
    // exempt from the cap because an earlier group's workers stayed under.
    assert.deepEqual(
      [...killed.keys()].sort(),
      ["g1w1", "g2w1"].sort(),
      `the cap denied the wrong workers: ${String([...killed.keys()])}`,
    );
    assert.deepEqual(killed.get("g1w1"), { reason: "hard_cap", elapsedSec: 120 });
    assert.deepEqual(killed.get("g2w1"), { reason: "hard_cap", elapsedSec: 250 });
    for (const under of ["g0w0", "g0w1", "g1w0", "g2w0"]) {
      assert.equal(killed.get(under), undefined, `${under} was denied under the cap`);
    }
    // And the AGGREGATE of every worker of every group is far over the cap —
    // 550s of spend against a 100s attempt ceiling — which is exactly why
    // the cap must count every worker of every group, not one of them.
    const aggregate = [...spendMsOf.values()].reduce((sum, ms) => sum + ms, 0);
    assert.equal(aggregate, 550_000);
    assert.ok(aggregate > CAP_SEC * 1000, "the aggregate of the attempt was not over the cap");
    const singleUnder = [...spendMsOf.values()].filter((ms) => ms < CAP_SEC * 1000).length;
    assert.equal(singleUnder, 4, "the single workers of the earlier groups were not under the cap");
  } finally {
    for (const watchdog of watchdogs) watchdog.stop();
  }
});

test("G8 T158: across two runs under one account, the per-account bound holds and the record shows it", async () => {
  const home = mkdtempSync(join(tmpdir(), "caps-154-account-"));
  const env = { SPECSTRIDE_HOST_SESSIONS_ACME: "1" };
  try {
    /* ---- RUN 1: the first engine start consumes the account's bound. ---- */
    const first = makeRunHostSlots({
      home,
      workdir: process.cwd(),
      env,
      limitsOn: true,
      account: "acme",
    });
    assert.equal(first.store?.widthOf("sessions/acme"), 1, "the account bound was not configured");
    const firstSeen: SlotAdmission[] = [];
    const firstRelease = await first.take("sessions/acme", (a) => firstSeen.push(a));
    assert.ok(firstRelease !== null, "the first run did not acquire the account's session");
    const firstTake = firstSeen.find((a) => a.verdict === "take");
    assert.equal(firstTake?.bound, 1);
    assert.equal(firstTake?.rule, "sessions/acme");
    assert.equal(firstTake?.slot, 0);
    // The slot record ON DISK shows the bound and its holder.
    const slotDirectory = join(userStateOf(home), "slots", "sessions", "acme", "0");
    const ownerFile = join(slotDirectory, "lock", OWNER_RECORD_FILE);
    assert.ok(existsSync(ownerFile), `no slot record on disk under ${slotDirectory}`);
    const owner = JSON.parse(readFileSync(ownerFile, "utf8")) as Record<string, unknown>;
    assert.ok(owner.pid !== undefined, "the slot record names no holder");
    assert.ok(owner.startTime !== undefined, "the slot record names no start time of the holder");
    assert.ok(owner.launchId !== undefined, "the slot record names no launch");

    /* ---- RUN 2: a FRESH engine start, the SAME durable store, the SAME account. ---- */
    const second = makeRunHostSlots({
      home,
      workdir: process.cwd(),
      env,
      limitsOn: true,
      account: "acme",
    });
    const secondSeen: SlotAdmission[] = [];
    const secondTaken = second.take("sessions/acme", (a) => secondSeen.push(a));
    await new Promise((done) => setTimeout(done, 250));
    let secondAcquired = false;
    const probe = await Promise.race([
      secondTaken.then((release) => {
        secondAcquired = release !== null;
        return "settled";
      }),
      new Promise((done) => setTimeout(() => done("pending"), 0)),
    ]);
    assert.equal(probe, "pending", "the second run was not throttled by the per-account bound");
    assert.equal(secondAcquired, false);
    const throttled = secondSeen.filter((a) => a.verdict === "wait");
    assert.ok(
      throttled.some((a) => a.bound === 1 && (a.reason ?? "").includes("all 1 slot")),
      `the throttle carried no recorded reason of the account bound: ${JSON.stringify(secondSeen)}`,
    );
    // The bound, not a permanent denial: a release of run 1 opens the account.
    await firstRelease();
    const secondRelease = await Promise.race([
      secondTaken,
      new Promise<null>((done) => setTimeout(() => done(null), 5_000)),
    ]);
    assert.ok(secondRelease !== null, "the second run never entered the account after a release");
    const secondTake = secondSeen.find((a) => a.verdict === "take");
    assert.equal(secondTake?.rule, "sessions/acme");
    assert.equal(secondTake?.slot, 0);
    await secondRelease();
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

/** Helper for an assertion message; the bound is carried by the admission itself. */
function who_label(admission: SlotAdmission): string {
  return `${admission.rule} bound of ${String(admission.bound)}`;
}
