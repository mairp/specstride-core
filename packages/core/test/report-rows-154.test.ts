/**
 * T038 — the failing-first test of the feature-154 report rows
 * (F154-FR-012, -014, -015) over synthetic events.
 *
 * - `windowSharesOf` computes the four shares as a union: no time counts
 *   twice, the categories partition the window, and a share the events
 *   cannot hold is `not in the events`, never estimated (Principle XI).
 * - `inPassCheckTimeOutsidePasses` (ledger M10) is the check time that ran
 *   while no proposer pass ran.
 * - `groupRowsOf` pairs one row per group: phase, outcome, applied path
 *   count, merge-check result, wall time.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  NOT_IN_EVENTS_154,
  windowSharesOf,
  inPassCheckTimeOutsidePasses,
  groupRowsOf,
  groupSummaryOf,
  reportRows154Of,
  type ReportEvent,
} from "../src/report/rows.ts";

const line = (type: string, at: number, data: Record<string, unknown> = {}): ReportEvent => ({
  type,
  at,
  data,
});

/** The synthetic stream of the shares: window 0..140000 ms. */
function sharesStream(): readonly ReportEvent[] {
  return [
    // Proposer pass 0–100000.
    line("pass.started", 0, { phase: 1, attempt: 1 }),
    line("pass.ended", 100000, { phase: 1, attempt: 1 }),
    // A check inside the pass (20000–40000).
    line("check.started", 20000, { checkId: "c1" }),
    line("check.ended", 40000, { checkId: "c1", durationMs: 20000 }),
    // A gate overlapping the pass and that check (30000–60000).
    line("verification.started", 30000, { phase: 1, attempt: 1 }),
    line("verification.ended", 60000, { phase: 1, attempt: 1 }),
    // A critic after the pass ended (110000–116000).
    line("critic.started", 110000, { phase: 1, attempt: 1 }),
    line("critic.call", 116000, { phase: 1, attempt: 1, latencyMs: 6000 }),
    // A check outside any pass (120000–140000).
    line("check.started", 120000, { checkId: "c2" }),
    line("check.ended", 140000, { checkId: "c2", durationMs: 20000 }),
  ];
}

test("F154-FR-012 the four shares are a union: no time counts twice", () => {
  const shares = windowSharesOf(sharesStream());
  // Window 140000 ms. Pass credited 0–100000 (the check and the gate inside
  // it started later, so the pass keeps the slices). Check credited
  // 120000–140000. Gate credited 110000–116000. The rest is uncovered time.
  assert.equal(shares.proposerPasses, Math.round((100000 / 140000) * 100 * 100) / 100);
  assert.equal(shares.inPassChecks, Math.round((20000 / 140000) * 100 * 100) / 100);
  assert.equal(shares.gateAndCriticOutsideChecks, Math.round((6000 / 140000) * 100 * 100) / 100);
  // The three shares and the rest partition the window: nothing counted twice.
  const total =
    (shares.proposerPasses as number) +
    (shares.inPassChecks as number) +
    (shares.gateAndCriticOutsideChecks as number) +
    (shares.rest as number);
  assert.ok(Math.abs(total - 100) <= 0.05, `the shares and the rest sum to 100, saw ${total}`);
});

test("F154-FR-012 a share the events cannot hold is `not in the events`", () => {
  const shares = windowSharesOf([
    line("check.started", 0, { checkId: "c1" }),
    line("check.ended", 1000, { checkId: "c1", durationMs: 1000 }),
  ]);
  assert.equal(shares.proposerPasses, NOT_IN_EVENTS_154);
  assert.equal(shares.gateAndCriticOutsideChecks, NOT_IN_EVENTS_154);
  assert.equal(shares.inPassChecks, 100);
});

test("F154-FR-012 with no events at all every share is `not in the events`", () => {
  const shares = windowSharesOf([]);
  assert.deepEqual(Object.values(shares), [
    NOT_IN_EVENTS_154,
    NOT_IN_EVENTS_154,
    NOT_IN_EVENTS_154,
    NOT_IN_EVENTS_154,
  ]);
});

test("F154-FR-014 the check time outside passes is the check union minus its pass overlap", () => {
  // Checks ran 40000 ms in total; 20000 of that inside the pass.
  assert.equal(inPassCheckTimeOutsidePasses(sharesStream()), 20000);
  // No pass at all: the whole check union counts.
  assert.equal(
    inPassCheckTimeOutsidePasses([
      line("check.started", 0, { checkId: "c1" }),
      line("check.ended", 5000, { checkId: "c1", durationMs: 5000 }),
    ]),
    5000,
  );
  // No timed check: the marking, never 0 masquerading as a measurement.
  assert.equal(
    inPassCheckTimeOutsidePasses([line("pass.started", 0), line("pass.ended", 1000)]),
    NOT_IN_EVENTS_154,
  );
});

test("F154-FR-015 one row per group: outcome, applied paths, merge check, wall time", () => {
  const rows = groupRowsOf([
    line("parallel.group.started", 0, { groupId: "g-1", phase: 23 }),
    line("parallel.worker.started", 1, { groupId: "g-1", workerId: "w-1" }),
    line("parallel.integration", 5000, { groupId: "g-1", step: "audit", pathCount: 2 }),
    line("parallel.integration", 6000, { groupId: "g-1", step: "apply", pathCount: 3 }),
    line("parallel.group.ended", 65000, { groupId: "g-1", outcome: "repair", mergeCheck: "fail" }),
    // A group whose application changed no path (F154-FR-027).
    line("parallel.group.started", 70000, { groupId: "g-2", phase: 23 }),
    line("parallel.group.ended", 80000, { groupId: "g-2", outcome: "repair" }),
  ]);
  assert.deepEqual(rows, [
    {
      phase: 23,
      outcome: "repair",
      appliedPathCount: 5,
      mergeCheckResult: "fail",
      wallTimeMs: 65000,
    },
    {
      phase: 23,
      outcome: "repair",
      appliedPathCount: 0,
      mergeCheckResult: null,
      wallTimeMs: 10000,
    },
  ]);
});

test("F154-FR-015 the counts over groups, workers, refusals and concurrent checks", () => {
  const summary = groupSummaryOf([
    line("parallel.group.ended", 1, { groupId: "g-1", outcome: "repair" }),
    line("parallel.group.ended", 2, { groupId: "g-2", outcome: "integrated" }),
    line("parallel.worker.ended", 3, { workerId: "w-1", outcome: "integrated" }),
    line("parallel.worker.ended", 4, { workerId: "w-2", outcome: "refused", reason: "group-check" }),
    line("check.ended", 5, { checkId: "c1", durationMs: 7000, concurrent: true }),
    line("check.ended", 6, { checkId: "c2", durationMs: 1000, concurrent: false }),
  ]);
  assert.deepEqual(summary.groupsByOutcome, { repair: 1, integrated: 1 });
  assert.deepEqual(summary.workersByOutcome, { integrated: 1, refused: 1 });
  assert.deepEqual(summary.workerRefusalsByReason, { "group-check": 1 });
  assert.equal(summary.concurrentCheckTimeMs, 7000);
});

test("F154-FR-012, -017 the whole row set: no forecast, the marking where events lack it", () => {
  const rows = reportRows154Of(sharesStream(), "154-concurrency-and-parallelism");
  assert.equal(rows.schema, "specstride.report-rows-154/1");
  assert.equal(rows.feature, "154-concurrency-and-parallelism");
  assert.equal(typeof rows.windowShares.proposerPasses, "number");
  assert.equal(rows.inPassCheckTimeOutsidePasses, 20000);
  assert.deepEqual(rows.groups, []);
});
