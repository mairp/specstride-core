/**
 * T139 — the conformance suite at contract level for EP-13, the lock and
 * liveness provider (annex F, §F.5): CT-100-264.
 *
 * Before the named case the suite checks the five things every suite at
 * contract level checks (annex A, §A.4). The behaviour of EP-13 belongs to
 * feature 122; its behaviour cases go in this folder beside this file.
 */
import assert from "node:assert/strict";
import {
  CONFLICT_ENGINE_CODE,
  CONFLICT_PIPELINE_CODE,
  CORE_GUARANTEES,
  ERRORS,
  IMPLEMENTATION_GUARANTEES,
  OPERATIONS,
  OWNER_RECORD_REQUIRED_FIELD_MISSING,
  OWNER_RECORD_UNKNOWN_FIELD_IS_ACCEPTED,
  POINT_ID,
  PROBE_RESULTS,
  PROBE_RESULT_WHEN_UNKNOWN,
  THE_AS_IS_LOCK_FALLBACK_IS_CARRIED,
  UNKNOWN_COUNTS_AS_HELD,
  A_FOREIGN_OWNER_IS_RECLAIMED_AUTOMATICALLY,
} from "@specstride/contracts/ep/lock";
import { HOST, implementation, killOwner, reset } from "../../samples/EP-13/index.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-13" as const;

const scope = Object.freeze({ workspaceId: "ws-1", path: "/tmp/ws-1" });
const owner = Object.freeze({
  schema: "specstride.lease/1:owner",
  pid: 4242,
  startTime: "2026-10-01T00:00:00.000Z",
  host: HOST,
  runToken: "token-1",
});
const foreign = Object.freeze({ ...owner, host: "another-host" });

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-264",
    title:
      "the provider offers `acquire`, `heartbeat`, `release`, `probe`, `reclaim`, `handDown` and `verify` with the results and errors of §F.5; a foreign owner is never reclaimed automatically, and the as-is lock fallback is not carried (F100-FR-164)",
    level: "contract",
    proves: ["F100-FR-164"],
    async run(impl) {
      reset();
      assert.deepEqual(
        [...OPERATIONS],
        ["acquire", "heartbeat", "release", "probe", "reclaim", "handDown", "verify"],
      );
      assert.deepEqual(
        [...PROBE_RESULTS],
        [
          "free",
          "held-live",
          "held-foreign",
          "stale-owner-dead",
          "owner-dead-group-alive",
          "unknown",
        ],
      );
      assert.deepEqual([...ERRORS], ["conflict", "foreign-owner", "unknown"]);
      assert.equal(CONFLICT_ENGINE_CODE, 5);
      assert.equal(CONFLICT_PIPELINE_CODE, 24);
      assert.equal(UNKNOWN_COUNTS_AS_HELD, true);

      const acquire = operationOf(impl, "acquire") as (
        s: unknown,
        o: unknown,
      ) => Promise<Record<string, unknown>>;
      const probe = operationOf(impl, "probe") as (s: unknown) => Promise<string>;
      const reclaim = operationOf(impl, "reclaim") as (
        s: unknown,
      ) => Promise<Record<string, unknown>>;
      const handDown = operationOf(impl, "handDown") as (l: unknown) => string;
      const verify = operationOf(impl, "verify") as (t: string) => Promise<boolean>;
      const release = operationOf(impl, "release") as (l: unknown) => Promise<void>;

      assert.equal(await probe(scope), "free");
      const first = await acquire(scope, owner);
      assert.equal(first["acquired"], true);
      assert.equal(await probe(scope), "held-live");
      // Exactly one winner: a second contender gets the conflict with the holder.
      const second = await acquire(scope, owner);
      assert.equal(second["acquired"], false);
      assert.equal(second["conflict"], "conflict");
      assert.deepEqual(second["holder"], owner);
      // A lease is handed down, so a child never takes a second lock.
      const token = handDown(first["lease"]);
      assert.equal(await verify(token), true);
      // The owner killed without warning: the lock is stale, and reclaim is
      // atomic — the entry is replaced, never removed and created again.
      killOwner(scope);
      assert.equal(await probe(scope), "stale-owner-dead");
      const reclaimed = await reclaim(scope);
      assert.equal(reclaimed["reclaimed"], true);
      await release(reclaimed["lease"]);

      // A foreign owner is never reclaimed automatically.
      reset();
      await acquire(scope, foreign);
      assert.equal(await probe(scope), "held-foreign");
      const refused = await reclaim(scope);
      assert.equal(refused["reclaimed"], false);
      assert.equal(refused["reason"], "foreign-owner");
      assert.equal(A_FOREIGN_OWNER_IS_RECLAIMED_AUTOMATICALLY, false);
      assert.equal(THE_AS_IS_LOCK_FALLBACK_IS_CARRIED, false);
      assert.equal(PROBE_RESULT_WHEN_UNKNOWN, "unknown");
      assert.equal(OWNER_RECORD_REQUIRED_FIELD_MISSING, "unknown");
      assert.equal(OWNER_RECORD_UNKNOWN_FIELD_IS_ACCEPTED, true);
      assert.equal(CORE_GUARANTEES.length, 7);
      assert.equal(IMPLEMENTATION_GUARANTEES.length, 6);
      reset();
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-13/operations-exist",
      "EP-13/closed-result-sets",
      "EP-13/degradation",
      "EP-13/unknown-value-rule",
      "EP-13/behaviour-cases",
    ],
    {
      resultSets: [{ operation: "probe", members: [...PROBE_RESULTS], calls: [[scope]] }],
      throwingOperation: "acquire",
    },
  ),
  ...named,
]);

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
