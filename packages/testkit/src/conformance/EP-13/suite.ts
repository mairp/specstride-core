/**
 * T017 — the conformance suite of EP-13 at BEHAVIOUR level: CT-122-10
 * (F122-FR-010, F122-FR-013, F122-FR-016, F122-FR-017).
 *
 * `contract.test.ts` beside this file holds the contract-level case of
 * feature 100 (CT-100-264), which asks whether the seven operations and the
 * closed sets are there. This file holds what feature 122 asks of the
 * BEHAVIOUR behind them, and §F.5 "Proving test" names the five cases:
 *
 *   1. one winner per round;
 *   2. the owner killed without warning;
 *   3. the owner dead with a live child;
 *   4. a reused pid after a changed boot identity;
 *   5. a foreign host name.
 *
 * They run against the SAMPLE provider in memory
 * (`../../samples/EP-13/memory-provider.ts`), which is the point F122-FR-010
 * makes: *a sample provider outside the core that keeps locks in memory MUST
 * pass the conformance suite with no core file changed*. Nothing of the
 * shipped directory-lock provider is imported here, and nothing of the core
 * names the sample; the sample reaches the registry through
 * `registerSamples()`, which reads the directory.
 *
 * `suite.test.ts` beside this file is what registers these cases with
 * `node:test`; the cases themselves live here so that the script
 * `conformance` and `node --test` run the same ones.
 */
import assert from "node:assert/strict";
import {
  PROBE_RESULTS,
  POINT_ID,
  UNKNOWN_COUNTS_AS_HELD,
  A_FOREIGN_OWNER_IS_RECLAIMED_AUTOMATICALLY,
  type ProbeResult,
} from "@specstride/contracts/ep/lock";
import type { OwnerRecord } from "@specstride/contracts/records/owner-record";
import {
  FIRST_BOOT,
  HOST,
  addOwnedChild,
  changeBootIdentity,
  currentBoot,
  endOwnedChildren,
  holderOf,
  implementation,
  killOwner,
  ownerIn,
  reset,
  survivorsOf,
} from "../../samples/EP-13/memory-provider.ts";
import { operationOf } from "../common.ts";
import type { ConformanceCase } from "../run.ts";

/** The case id of F122-FR-010. */
export const CASE_ID = "CT-122-10" as const;

/** How many contenders and how many rounds the first case runs. */
export const CONTENDERS = 8 as const;
export const ROUNDS = 300 as const;

const scope = Object.freeze({ workspaceId: "ws-122", path: "/tmp/ws-122" });

/** The owner record a case acquires with, in the boot the provider is in. */
function owner(launchId: string, pid = 4242): OwnerRecord {
  return ownerIn({
    schema: "specstride.lease/1:owner",
    pid,
    startTime: "2026-10-02T00:00:00.000Z",
    host: HOST,
    launchId,
    runToken: `token-${launchId}`,
  } as unknown as OwnerRecord);
}

type Operations = {
  acquire: (s: unknown, o: unknown) => Promise<Record<string, unknown>>;
  probe: (s: unknown) => Promise<ProbeResult>;
  reclaim: (s: unknown) => Promise<Record<string, unknown>>;
  release: (l: unknown) => Promise<void>;
};

function operations(impl: Parameters<ConformanceCase["run"]>[0]): Operations {
  return {
    acquire: operationOf(impl, "acquire") as Operations["acquire"],
    probe: operationOf(impl, "probe") as Operations["probe"],
    reclaim: operationOf(impl, "reclaim") as Operations["reclaim"],
    release: operationOf(impl, "release") as Operations["release"],
  };
}

/** The five behaviour cases of EP-13 that feature 122 owns. */
export const behaviourCases: readonly ConformanceCase[] = Object.freeze([
  {
    id: `${CASE_ID}/one-winner-per-round`,
    title:
      `of ${CONTENDERS} contenders for one free lock, over ${ROUNDS} rounds, exactly one ` +
      `receives the lease and every other receives a conflict that names the holder`,
    level: "behaviour",
    proves: ["F122-FR-010", "F122-FR-011"],
    async run(impl) {
      const { acquire, release, probe } = operations(impl);
      let roundsWithOneWinner = 0;
      for (let round = 0; round < ROUNDS; round++) {
        reset();
        assert.equal(await probe(scope), "free", `round ${round}`);
        const results = [];
        for (let i = 0; i < CONTENDERS; i++) {
          results.push(await acquire(scope, owner(`launch-${round}-${i}`, 4000 + i)));
        }
        const winners = results.filter((r) => r["acquired"] === true);
        if (winners.length === 1) roundsWithOneWinner++;
        assert.equal(winners.length, 1, `round ${round} had ${winners.length} winners`);
        // Every loser is told WHO holds it, and the holder named is the one
        // the provider itself reports (F122-FR-011).
        const holder = holderOf(scope);
        for (const loser of results.filter((r) => r["acquired"] === false)) {
          assert.equal(loser["conflict"], "conflict", `round ${round}`);
          assert.deepEqual(loser["holder"], holder, `round ${round}: the holder is named`);
        }
        const won = winners[0] as Record<string, unknown>;
        await release(won["lease"]);
      }
      assert.equal(roundsWithOneWinner, ROUNDS);
      reset();
    },
  },
  {
    id: `${CASE_ID}/owner-killed-without-warning`,
    title:
      "the owner killed without warning leaves a lock whose probe is `stale-owner-dead`, " +
      "which a reclaim may take; the lease of the winner is new",
    level: "behaviour",
    proves: ["F122-FR-013", "F122-FR-015"],
    async run(impl) {
      const { acquire, probe, reclaim, release } = operations(impl);
      reset();
      const first = await acquire(scope, owner("launch-killed"));
      assert.equal(first["acquired"], true);
      assert.equal(await probe(scope), "held-live");
      // Killed without warning: nothing of the owner ran, and the liveness
      // the kernel backs is what noticed (F122-FR-014).
      killOwner(scope);
      assert.equal(await probe(scope), "stale-owner-dead");
      const reclaimed = await reclaim(scope);
      assert.equal(reclaimed["reclaimed"], true);
      assert.notEqual(reclaimed["lease"], first["lease"]);
      assert.equal(await probe(scope), "held-live");
      await release(reclaimed["lease"]);
      assert.equal(await probe(scope), "free");
      reset();
    },
  },
  {
    id: `${CASE_ID}/owner-dead-with-a-live-child`,
    title:
      "the owner dead with a live entry of class `owned` probes " +
      "`owner-dead-group-alive`, is never reclaimed, and names the survivor; once the " +
      "survivor is gone the probe is `stale-owner-dead`",
    level: "behaviour",
    proves: ["F122-FR-013", "F122-FR-017"],
    async run(impl) {
      const { acquire, probe, reclaim, release } = operations(impl);
      reset();
      const first = await acquire(scope, owner("launch-group"));
      assert.equal(first["acquired"], true);
      addOwnedChild(scope, { procId: "proc-1", pid: 5151 });
      killOwner(scope);
      assert.equal(await probe(scope), "owner-dead-group-alive");
      // F122-FR-017 — the refusal names every surviving process.
      assert.deepEqual(
        survivorsOf(scope).map((c) => c.pid),
        [5151],
      );
      // A lock with a live survivor is not reclaimed (F122-FR-015: only
      // `stale-owner-dead`).
      const refused = await reclaim(scope);
      assert.equal(refused["reclaimed"], false);
      assert.equal(refused["reason"], "lost-race");
      // Once the survivor has ended, the lock is stale and may be reclaimed.
      endOwnedChildren(scope);
      assert.equal(await probe(scope), "stale-owner-dead");
      const taken = await reclaim(scope);
      assert.equal(taken["reclaimed"], true);
      await release(taken["lease"]);
      reset();
    },
  },
  {
    id: `${CASE_ID}/reused-pid-after-a-changed-boot-identity`,
    title:
      "an owner whose boot identity differs from the present boot counts as dead, whatever " +
      "process now has its pid",
    level: "behaviour",
    proves: ["F122-FR-013"],
    async run(impl) {
      const { acquire, probe, reclaim, release } = operations(impl);
      reset();
      assert.equal(currentBoot(), FIRST_BOOT);
      const first = await acquire(scope, owner("launch-reboot", 777));
      assert.equal(first["acquired"], true);
      assert.equal(await probe(scope), "held-live");
      // The machine rebooted and a process of the old owner's pid is alive:
      // the sample leaves `alive` true on purpose, so that nothing but the
      // boot identity can be what decides.
      changeBootIdentity("boot-after-the-reboot");
      assert.equal(await probe(scope), "stale-owner-dead");
      const reclaimed = await reclaim(scope);
      assert.equal(reclaimed["reclaimed"], true);
      // The reclaimed lock is live again, in THIS boot.
      assert.equal(await probe(scope), "held-live");
      await release(reclaimed["lease"]);
      reset();
    },
  },
  {
    id: `${CASE_ID}/a-foreign-host-name`,
    title:
      "an owner record made on another host probes `held-foreign`, is never reclaimed " +
      "automatically, and counts as held",
    level: "behaviour",
    proves: ["F122-FR-013", "F122-FR-016"],
    async run(impl) {
      const { acquire, probe, reclaim } = operations(impl);
      reset();
      const elsewhere = Object.freeze({
        ...(owner("launch-elsewhere") as unknown as Record<string, unknown>),
        host: "another-host",
      }) as unknown as OwnerRecord;
      const first = await acquire(scope, elsewhere);
      assert.equal(first["acquired"], true);
      assert.equal(await probe(scope), "held-foreign");
      const refused = await reclaim(scope);
      assert.equal(refused["reclaimed"], false);
      assert.equal(refused["reason"], "foreign-owner");
      assert.equal(A_FOREIGN_OWNER_IS_RECLAIMED_AUTOMATICALLY, false);
      // It is still there, and it still counts as held.
      assert.equal(await probe(scope), "held-foreign");
      assert.equal(countsAsHeld("held-foreign"), true);
      reset();
    },
  },
]);

/**
 * F122-FR-013 — every result but `free` and `stale-owner-dead` counts as
 * held. The two are named here and the rest is derived, so that a result
 * added to EP-13 is held until someone says otherwise, which is the
 * conservative direction.
 */
export const RESULTS_THAT_ARE_NOT_HELD: readonly ProbeResult[] = Object.freeze([
  "free",
  "stale-owner-dead",
]);

export function countsAsHeld(result: ProbeResult): boolean {
  if (!(PROBE_RESULTS as readonly string[]).includes(result)) return UNKNOWN_COUNTS_AS_HELD;
  return !RESULTS_THAT_ARE_NOT_HELD.includes(result);
}

export { implementation, POINT_ID };
