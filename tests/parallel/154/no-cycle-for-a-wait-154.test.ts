/**
 * T159 (feature 154, phase 17, G8) — V-16 / F154-FR-077 (+F154-FR-045).
 *
 * THE REQUIREMENT: a worker that WAITS for a slot is charged NO cycle, and the
 * `[LOOP]` line gains NO extra field for the wait.
 *
 * F154-FR-045 (T105) makes the slot wait a PAUSE: a take whose verdict is
 * `wait` enters `paused-quota (host_slot)` and emits one `host.slot.admission`
 * with the verdict `queued` (and a `run.paused` / `run.resumed` pair). Nothing
 * of the wait is a record of the parallel namespace, so the cycle counter of
 * the layer (`cyclesSpentIn`, IR-50 (a): a cycle is spent from the SECOND
 * interruption of the same step on) must not see it: a start/end wait pair
 * charges nothing, and the totals the `[LOOP]` line renders carry no field the
 * wait could name.
 *
 * HERMETIC: the test drives the real exported functions with in-memory
 * records only; where a scratch directory stands for a run's home it lives in
 * the system temporary area and is removed in `finally`. No model, no network.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  cyclesSpentIn,
  countersFromTheLedger,
  INTERRUPTIONS_BEFORE_A_CYCLE_IS_SPENT,
  recordsOfTheLayer,
  type CountedRecord,
} from "../../../packages/core/src/parallel/counters.ts";
import { PARALLEL_LEDGER_KINDS } from "../../../packages/core/src/parallel/ledger-kinds.ts";
import { parallelLoopLineField } from "../../../packages/cli/src/engine/parallel-wiring.ts";

/* ------------------------------------------------------------------ *
 * Fixtures — one closed group of the ledger, in the order of the
 * state sequence (annex X §X.6, the thirteen kinds).
 * ------------------------------------------------------------------ */

let seq = 0;

/** A record of the parallel namespace with the envelope fields a count reads. */
function record(kind: string, extra: Partial<CountedRecord> = {}): CountedRecord {
  seq += 1;
  return {
    ns: "parallel",
    kind,
    attemptId: "attempt-1",
    ...extra,
  };
}

/** The slot-wait events of F154-FR-045 (T105), OUTSIDE the ledger. */
const SLOT_WAIT_EVENTS: readonly CountedRecord[] = Object.freeze([
  { ns: "policy", kind: "run.paused", attemptId: "attempt-1", data: { class: "host_slot" } },
  {
    ns: "policy",
    kind: "host.slot.admission",
    attemptId: "attempt-1",
    data: { rule: "sessions/account", verdict: "queued", slotVerdict: "wait" },
  },
  { ns: "policy", kind: "run.resumed", attemptId: "attempt-1", data: { resumedBy: "probe-succeeded" } },
]);

/**
 * The records of one group where WORKER w2 WAITS for a slot before it starts:
 * the full thirteen kinds of the state sequence, with the slot-wait event pair
 * interleaved at the point of the wait, and no interruption anywhere — every
 * kind of the group appears exactly once.
 */
function ledgerWhereAWorkerWaitsForASlot(): readonly CountedRecord[] {
  return [
    record("group_planned", { groupId: "g1", data: { groupId: "g1", tasks: ["t1"], planHash: "h" } }),
    record("group_started", { groupId: "g1", data: { baseTree: "b", workspaceFingerprint: "f0" } }),
    record("worker_started", { groupId: "g1", workerId: "w1", data: { task: "t1", passId: "p1", passOrdinal: [1, 1, 0], treeFingerprint: "f1", pid: 1, startTime: 0 } }),
    record("worker_ended", { groupId: "g1", workerId: "w1", data: { endCause: "done", treeId: "t", treeFingerprint: "f2", usage: "unknown" } }),
    // THE WAIT: worker w2 holds no slot yet; the pause opens and closes.
    ...SLOT_WAIT_EVENTS,
    record("worker_started", { groupId: "g1", workerId: "w2", data: { task: "t1", passId: "p2", passOrdinal: [1, 2, 0], treeFingerprint: "f3", pid: 2, startTime: 5 } }),
    record("worker_ended", { groupId: "g1", workerId: "w2", data: { endCause: "done", treeId: "t", treeFingerprint: "f4", usage: "unknown" } }),
    record("group_barrier", { groupId: "g1", data: { workspaceFingerprint: "f5", workerFingerprints: { w1: "f2", w2: "f4" } } }),
    record("audit_done", { groupId: "g1", data: { audits: { w1: "accepted", w2: "accepted" } } }),
    record("merge_done", { groupId: "g1", data: { composedTreeId: "c", acceptedWorkers: ["w1", "w2"] } }),
    record("apply_started", { groupId: "g1", data: { paths: [] } }),
    record("applied", { groupId: "g1", data: { workspaceFingerprint: "f6" } }),
    record("ticks_applied", { groupId: "g1", data: { taskIds: ["t1"] } }),
    record("merge_check_started", { groupId: "g1", data: { fingerprint: "f6", checkManifestHash: "m" } }),
    record("merge_check_finished", { groupId: "g1", data: { fingerprint: "f6", results: [], conditions: [] } }),
    record("group_closed", { groupId: "g1", data: { outcome: "closed", workerOutcomes: { w1: "accepted", w2: "accepted" }, treesRemoved: [] } }),
  ];
}

/** The same ledger, but the group's merge check was interrupted ONCE: its record repeats. */
function ledgerWithOneInterruptionOfTheGroup(): readonly CountedRecord[] {
  return [
    ...ledgerWhereAWorkerWaitsForASlot(),
    record("merge_check_started", { groupId: "g1", data: { fingerprint: "f6", checkManifestHash: "m" } }),
  ];
}

test("G8 T159 — a worker that waits for a slot is charged NO cycle (F154-FR-077)", () => {
  const scratch = mkdtempSync(join(tmpdir(), "specstride-t159-"));
  try {
    const waitLedger = ledgerWhereAWorkerWaitsForASlot();

    // The slot-wait pair of F154-FR-045 is present in what the run saw.
    const waits = waitLedger.filter((r) => r.kind === "host.slot.admission" && r.data?.["slotVerdict"] === "wait");
    assert.equal(waits.length, 1, "the fixture must carry one slot wait");

    // IR-50 (a): a cycle is spent from the second interruption on — so a
    // ledger with NO interruption can spend no cycle, however long it waited.
    assert.equal(INTERRUPTIONS_BEFORE_A_CYCLE_IS_SPENT, 1);
    assert.equal(cyclesSpentIn(waitLedger), 0, "a start/end wait pair charges nothing");

    // The real counter-update path answers the same: the wait is not a record
    // of the parallel namespace, so the layer's counters never see it.
    const counters = countersFromTheLedger(waitLedger);
    assert.equal(counters.cyclesSpent, 0, "the wait enters no cycle of the layer");

    // CONTROL, proving the counter is live: the same ledger with ONE
    // interruption of the group's merge check spends one cycle.
    const interrupted = ledgerWithOneInterruptionOfTheGroup();
    assert.ok(cyclesSpentIn(interrupted) >= 1, "a repeated record charges a cycle");
    assert.equal(countersFromTheLedger(interrupted).cyclesSpent, 1);

    // And the wait events themselves are filtered out of the layer's records.
    const ofTheLayer = recordsOfTheLayer([...waitLedger, ...SLOT_WAIT_EVENTS]);
    for (const known of ofTheLayer) {
      assert.ok(
        (PARALLEL_LEDGER_KINDS as readonly string[]).includes(String(known.kind)),
        "the layer reads only the thirteen kinds",
      );
    }
    assert.equal(
      ofTheLayer.filter((r) => String(r.kind).startsWith("run.") || r.kind === "host.slot.admission")
        .length,
      0,
      "no slot-wait event of F154-FR-045 is a record of the layer",
    );
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------------ *
 * Part (b) — the `[LOOP]` line gains NO extra field for the wait.
 * ------------------------------------------------------------------ */

const EXPECTED_PARALLEL_FIELD_NAMES = [
  "parallel",
  "workers",
  "groups",
  "group-failures",
  "refused",
  "worker-caches",
  "wall-hours",
  "agent-hours",
] as const;

/** The names of the `key=value` pairs of one rendered `parallel=` field. */
function fieldNames(parallelField: string): readonly string[] {
  return parallelField
    .split(" ")
    .filter((pair) => pair.includes("="))
    .map((pair) => pair.slice(0, pair.indexOf("=")));
}

test("G8 T159 — the [LOOP] line carries the same fields with a wait as without (F154-FR-077)", () => {
  const scratch = mkdtempSync(join(tmpdir(), "specstride-t159-"));
  try {
    // A run WITH a slot wait: the same groups, but the wall clock includes
    // the milliseconds the worker spent waiting for the slot.
    const totalsOfARunWithAWait = {
      units: "on" as const,
      workers: 2,
      groups: 3,
      groupFailures: 0,
      refused: 0,
      wallMs: 5_400,
      agentMs: 3_600,
    };
    // The same run WITHOUT a wait.
    const totalsOfARunWithoutAWait = { ...totalsOfARunWithAWait, wallMs: 3_600 };

    const withWait = parallelLoopLineField({ totals: totalsOfARunWithAWait, fallback: null });
    const withoutWait = parallelLoopLineField({ totals: totalsOfARunWithoutAWait, fallback: null });

    // Both render, and neither is empty nor the layer-off form.
    assert.ok(withWait.startsWith("parallel=on "), `with a wait: ${withWait}`);
    assert.ok(withoutWait.startsWith("parallel=on "), `without a wait: ${withoutWait}`);

    // THE FIELD NAME SETS ARE IDENTICAL — the wait names no field of its own.
    const namesWithWait = [...fieldNames(withWait)].sort();
    const namesWithoutWait = [...fieldNames(withoutWait)].sort();
    assert.deepEqual(namesWithWait, namesWithoutWait);

    // And that set is the pre-existing set: the eight keys of F142-FR-022,
    // with no new field for the wait and none for a cycle delta.
    assert.deepEqual(namesWithWait, [...EXPECTED_PARALLEL_FIELD_NAMES].sort());
    for (const name of namesWithWait) {
      assert.ok(!/wait/i.test(name), `no field names the wait: ${name}`);
      assert.ok(!/delta/i.test(name), `no field names a delta: ${name}`);
    }

    // The wait shows only in the value of the field it already belongs to.
    assert.notEqual(withWait, withoutWait, "the wall time of the wait is still rendered");
    assert.match(withWait, /wall-hours=/);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
