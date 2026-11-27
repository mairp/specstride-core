/**
 * T150 (feature 154, US7) — THE COST OF A SET-ASIDE UNIT, FROM ITS RECORD
 * AND IN THE REPORT (F154-FR-064, -065; F154-FR-002; F153-FR-039).
 *
 * A rejecting critic (SP-6) sets the speculative unit aside: the record
 * `specstride.set-aside/1` carries the unit's cost — its tokens, its wall
 * time and its cycles, and NOTHING else (in particular NO attempt kind and
 * NO stop reason, F154-FR-002) — the report's rows are the pure projection
 * of the events that name the same cost, and the printed lines carry it:
 *
 *     speculation units set aside: 1
 *     speculation set-aside cost: tokens=900 wallTimeMs=1500 cycles=3
 *
 * Run from the repository root:
 *     node --experimental-strip-types --test tests/parallel/154/speculation-cost.test.ts
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  promptCarriesNoVerdictWord,
  speculativePromptAppendix,
  speculationCoordinatorOf,
  SPECULATION_ADMISSION_EVENT,
  SPECULATION_SET_ASIDE_EVENT,
} from "../../../packages/cli/src/engine/speculation.ts";
import {
  NOT_IN_EVENTS,
  reportRowsOf,
  speculationRowsOf,
  type ReportEvent,
} from "../../../packages/core/src/report/rows.ts";
import { rows154Lines } from "../../../packages/cli/src/inspect/report.ts";
import { SET_ASIDE_SCHEMA } from "../../../packages/core/src/speculation/set-aside.ts";

/** A rejecting coordinator over one temporary control plane. */
function rejectingHarnessOf(): {
  readonly coordinator: NonNullable<ReturnType<typeof speculationCoordinatorOf>>;
  readonly events: { type: string; data: Record<string, unknown> }[];
  readonly controlRoot: string;
  readonly setAsidePath: string;
  readonly restore: () => void;
} {
  const base = mkdtempSync(join(tmpdir(), "specstride-spec-cost-"));
  const controlRoot = join(base, "control");
  const home = join(base, "home");
  const work = join(base, "work");
  const eventsPath = join(controlRoot, "runs", "r154", "events.jsonl");
  mkdirSync(controlRoot, { recursive: true });
  mkdirSync(home, { recursive: true });
  mkdirSync(work, { recursive: true });
  writeFileSync(join(work, "spec.md"), "# the feature\n");
  for (const argv of [
    ["init", "-q"],
    ["config", "user.email", "t@t"],
    ["config", "user.name", "t"],
    ["add", "-A"],
    ["commit", "-qm", "init"],
  ]) {
    spawnSync("git", ["-C", work, ...argv]);
  }
  mkdirSync(eventsPath.slice(0, eventsPath.lastIndexOf("/")), { recursive: true });
  writeFileSync(
    eventsPath,
    `${JSON.stringify({
      type: "attempt.ended",
      at: 1,
      data: { run: "r154", phase: 1, attempt: 1, endCause: "approved" },
    })}\n`,
  );
  const seen: { type: string; data: Record<string, unknown> }[] = [];
  const coordinator = speculationCoordinatorOf({
    on: true,
    depth: 1,
    window: 20,
    minRatePerCent: 50,
    feature: "154-concurrency-and-parallelism",
    runId: "r154",
    controlRoot,
    workspace: work,
    taskListPath: "specs/154/tasks.md",
    eventsPath,
    home,
    emit: (type, data) => seen.push({ type, data: { ...data } }),
    costOf: () => ({ tokens: 900, wallTimeMs: 1500, cycles: 3 }),
    nowMs: () => 42,
  })!;
  return {
    coordinator,
    events: seen,
    controlRoot,
    setAsidePath: join(
      controlRoot,
      "features",
      "154-concurrency-and-parallelism",
      "runs",
      "r154",
      "speculation",
      "phase2",
      "set-aside.json",
    ),
    restore: () => rmSync(base, { recursive: true, force: true }),
  };
}

test("T150: a rejecting verdict writes the set-aside record with the cost and nothing else (F154-FR-064, -002)", async () => {
  const harness = rejectingHarnessOf();
  try {
    assert.deepEqual(await harness.coordinator.verdictAtTheGate(1), { start: true });
    const setAside = await harness.coordinator.resolveOnRejection(1);
    assert.equal(setAside, true);
    const record = JSON.parse(readFileSync(harness.setAsidePath, "utf8")) as Record<
      string,
      unknown
    >;
    assert.equal(record["schema"], SET_ASIDE_SCHEMA);
    assert.equal(record["phase"], 1);
    assert.equal(record["unitPhase"], 2);
    assert.deepEqual(record["cost"], { tokens: 900, wallTimeMs: 1500, cycles: 3 });
    // F154-FR-002 — NO attempt kind and NO stop reason, whatever happened.
    for (const key of ["attemptKind", "stopReason", "endCause", "exitCode", "runState"]) {
      assert.equal(key in record, false, key);
    }
    // The cost lands in the events too, once (F154-FR-064).
    const events = harness.events.filter((one) => one.type === SPECULATION_SET_ASIDE_EVENT);
    assert.equal(events.length, 1);
    assert.equal(events[0].data["tokens"], 900);
    assert.equal(events[0].data["wallTimeMs"], 1500);
    assert.equal(events[0].data["cycles"], 3);
    const admissions = harness.events.filter((one) => one.type === SPECULATION_ADMISSION_EVENT);
    assert.equal(admissions.length, 1);
  } finally {
    harness.restore();
  }
});

test("T150: the report's speculation rows are the pure projection of the set-aside events (F153-FR-039)", () => {
  const event = (type: string, data: Record<string, unknown>): ReportEvent => ({
    type,
    at: 1,
    data: data as unknown as Record<never, never>,
  });
  const events: ReportEvent[] = [
    event(SPECULATION_ADMISSION_EVENT, {
      decision: "skip",
      reason: "rate",
      ruleId: "SP-2",
      phase: 1,
      unitPhase: 2,
      ratePerCent: 25,
      window: 20,
      minRatePerCent: 50,
      depth: 0,
      maxDepth: 1,
    }),
    event(SPECULATION_ADMISSION_EVENT, {
      decision: "start",
      ruleId: "SP-1",
      phase: 2,
      unitPhase: 3,
      ratePerCent: 80,
      window: 20,
      minRatePerCent: 50,
      depth: 0,
      maxDepth: 1,
    }),
    event(SPECULATION_SET_ASIDE_EVENT, {
      phase: 2,
      unitPhase: 3,
      ruleId: "SP-6",
      tokens: 900,
      wallTimeMs: 1500,
      cycles: 3,
    }),
  ];
  const rows = speculationRowsOf(events);
  assert.equal(rows.started, 1);
  assert.deepEqual(rows.refusalsByReason, { rate: 1 });
  assert.equal(rows.setAside, 1);
  assert.deepEqual(rows.setAsideCost, { tokens: 900, wallTimeMs: 1500, cycles: 3 });
  // And the full projection carries the rows of this feature.
  const projection = reportRowsOf(events, "154-concurrency-and-parallelism");
  const values = new Map(projection.rows.map((one) => [one.row, one.value]));
  assert.equal(values.get("speculation units started"), 1);
  assert.equal(values.get("speculation units set aside"), 1);
  assert.deepEqual(values.get("speculation set-aside cost"), {
    tokens: 900,
    wallTimeMs: 1500,
    cycles: 3,
  });
});

test("T150: the printed lines carry the set-aside cost (F154-FR-064)", () => {
  const event = (type: string, data: Record<string, unknown>): ReportEvent => ({
    type,
    at: 1,
    data: data as unknown as Record<never, never>,
  });
  const events: ReportEvent[] = [
    event(SPECULATION_ADMISSION_EVENT, {
      decision: "start",
      ruleId: "SP-1",
      phase: 1,
      unitPhase: 2,
      ratePerCent: 100,
      window: 20,
      minRatePerCent: 50,
      depth: 0,
      maxDepth: 1,
    }),
    event(SPECULATION_SET_ASIDE_EVENT, {
      phase: 1,
      unitPhase: 2,
      ruleId: "SP-6",
      tokens: 900,
      wallTimeMs: 1500,
      cycles: 3,
    }),
  ];
  const lines = rows154Lines(events, "154-concurrency-and-parallelism");
  const speculation = lines.filter((one) => one.startsWith("speculation"));
  assert.deepEqual(speculation, [
    "speculation units started: 1",
    "speculation units integrated: 0",
    "speculation units set aside: 1",
    "speculation set-aside cost: tokens=900 wallTimeMs=1500 cycles=3",
  ]);
});

test("T150: with `loop.speculate` off no row and no line exist (F154-FR-001)", () => {
  const rows = speculationRowsOf([
    { type: "phase.started", at: 1, data: {} } as unknown as ReportEvent,
  ]);
  assert.equal(rows.started, NOT_IN_EVENTS);
  assert.equal(rows.setAside, NOT_IN_EVENTS);
  assert.equal(rows.setAsideCost, NOT_IN_EVENTS);
  assert.equal(
    rows154Lines(
      [{ type: "phase.started", at: 1, data: {} } as unknown as ReportEvent],
      "154-concurrency-and-parallelism",
    ).some((one) => one.startsWith("speculation")),
    false,
  );
});

test("T150: the speculative prompt the record belongs to carries no word of the verdict (F154-FR-080)", () => {
  assert.equal(promptCarriesNoVerdictWord(speculativePromptAppendix()), true);
});
