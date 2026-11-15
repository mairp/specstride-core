/**
 * Feature 153, CT-153-40 — the rows of the report (US2, F153-FR-040).
 *
 * The unit is `reportRowsOf` (`../src/report/rows.ts`), a pure projection of
 * a list of events into the rows F153-FR-040 names: the attempts (T127), the
 * phases approved (T128), the in-pass checks (T129), the end causes and the
 * commit-gate blocks (T130), the passes ended by `hard_cap` and the
 * diagnostician calls (T131), the gate, critic and commit-scan times where
 * the pairs of Phase 9 exist and the marking `not-in-events` where they do
 * not (T132), the three rows the events cannot hold, the tasks-per-phase row
 * and the unclosed `null` (T133), and the dropped events (T134).
 *
 * The input is a small hand-written fixture
 * (`fixtures/153/events-small.jsonl`, T126): no file is written, no clock is
 * read, no duration is imputed.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import {
  NOT_IN_EVENTS,
  pairAttempts,
  reportRowsOf,
  median,
  type ReportEvent,
  type ReportRow,
} from "../src/report/rows.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(HERE, "fixtures/153/events-small.jsonl");
const RUN_ID = "run-153-sm";

function eventsOfFixture(): ReportEvent[] {
  return readFileSync(FIXTURE, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as ReportEvent);
}

function rowOf(rows: readonly ReportRow[], name: string): ReportRow {
  const found = rows.filter((row) => row.row === name);
  assert.equal(found.length, 1, `exactly one row named "${name}"`);
  return found[0]!;
}

/** The event list, cut back to a world where the timing pairs never ran. */
function eventsWithoutPairs(events: readonly ReportEvent[]): ReportEvent[] {
  const PAIRS = new Set([
    "verification.started",
    "verification.ended",
    "critic.started",
    "critic.call",
    "commit_gate.started",
    "commit_gate.ended",
  ]);
  return events.filter((event) => !PAIRS.has(event.type));
}

test("attempts: started, closed, unclosed, total and median (T127)", () => {
  const report = reportRowsOf(eventsOfFixture(), RUN_ID);
  assert.equal(report.schema, "specstride.report-rows/1");
  assert.equal(report.runId, RUN_ID);
  assert.equal(rowOf(report.rows, "attempts started").value, 5);
  assert.equal(rowOf(report.rows, "attempts closed").value, 3);
  assert.equal(rowOf(report.rows, "attempts unclosed").value, 2);
  // The closed attempts ran 60 s, 90 s and 120 s: total 270 s, median 90 s.
  assert.equal(rowOf(report.rows, "attempt duration total").value, 270);
  assert.equal(rowOf(report.rows, "attempt duration total").unit, "s");
  assert.equal(rowOf(report.rows, "attempt duration median").value, 90);
  assert.equal(rowOf(report.rows, "attempt duration median").unit, "s");
  // The pairing itself is on (run, phase, attempt), and the unclosed carry
  // no duration — never an imputed one.
  const paired = pairAttempts(eventsOfFixture());
  assert.equal(paired.closed.length, 3);
  assert.equal(paired.unclosed.length, 2);
  for (const unclosed of paired.unclosed) {
    assert.equal(unclosed.durationMs, null);
  }
  const durations = paired.closed
    .map((attempt) => attempt.durationMs)
    .filter((value): value is number => value !== null);
  assert.deepEqual(durations.sort((a, b) => a - b), [60000, 90000, 120000]);
  const keys = paired.closed.map((a) => `${a.runId}|${a.phase}|${a.attempt}`);
  assert.deepEqual(keys.sort(), ["null|1|1", "null|2|1", "null|2|2"]);
});

test("phases approved, with the attempt ordinal (T128)", () => {
  const report = reportRowsOf(eventsOfFixture(), RUN_ID);
  const row = rowOf(report.rows, "phases approved");
  assert.deepEqual(row.value, { "1": 1 });
});

test("checks: count, failed, median, total, minimum, maximum, concurrent (T129)", () => {
  const report = reportRowsOf(eventsOfFixture(), RUN_ID);
  assert.equal(rowOf(report.rows, "in-pass checks").value, 4);
  assert.equal(rowOf(report.rows, "checks failed").value, 2);
  assert.equal(rowOf(report.rows, "check duration median").value, 25);
  assert.equal(rowOf(report.rows, "check duration median").unit, "s");
  assert.equal(rowOf(report.rows, "check duration total").value, 100);
  assert.equal(rowOf(report.rows, "check duration minimum").value, 10);
  assert.equal(rowOf(report.rows, "check duration maximum").value, 40);
  // Each duration keeps its own `concurrent` flag, never averaged away.
  const flags = rowOf(report.rows, "check durations concurrent").value;
  assert.deepEqual(flags, { "10": 1, "20": 0, "30": 1, "40": 0 });
});

test("end causes and commit-gate blocks (T130)", () => {
  const report = reportRowsOf(eventsOfFixture(), RUN_ID);
  assert.deepEqual(rowOf(report.rows, "attempts by endCause").value, {
    approved: 1,
    rejected: 1,
    "verification-failed": 1,
  });
  assert.deepEqual(rowOf(report.rows, "commit-gate blocks by rule").value, {
    "cg-sk-prefix": 1,
  });
  // The block is told apart from a critic rejection by the
  // `commit_gate.blocked` of the same phase and attempt.
  assert.equal(rowOf(report.rows, "rejections from a commit-gate block").value, 1);
});

test("passes ended by hard_cap, and diagnostician calls (T131)", () => {
  const report = reportRowsOf(eventsOfFixture(), RUN_ID);
  assert.equal(rowOf(report.rows, "passes ended by hard_cap").value, 1);
  assert.equal(rowOf(report.rows, "hard_cap pass time total").value, 2700);
  assert.equal(rowOf(report.rows, "hard_cap pass time total").unit, "s");
  assert.equal(rowOf(report.rows, "diagnostician calls").value, 2);
  // The two diagnoses ran 54 s and 30 s: the median is 42 s.
  assert.equal(rowOf(report.rows, "diagnostician duration median").value, 42);
  assert.equal(rowOf(report.rows, "diagnostician duration median").unit, "s");
});

test("gate, critic and scan times where the pairs exist (T132)", () => {
  const events = eventsOfFixture();
  const report = reportRowsOf(events, RUN_ID);
  // The gate pair of the fixture ran 30 s.
  assert.equal(rowOf(report.rows, "gate time total").value, 30);
  assert.equal(rowOf(report.rows, "gate time median").value, 30);
  assert.equal(rowOf(report.rows, "gate time median").unit, "s");
  // The critic call carries latencyMs 42 s.
  assert.equal(rowOf(report.rows, "critic time total").value, 42);
  assert.equal(rowOf(report.rows, "critic time median").value, 42);
  // The commit-scan pair of the fixture ran 5 s.
  assert.equal(rowOf(report.rows, "commit-scan time total").value, 5);
  assert.equal(rowOf(report.rows, "commit-scan time median").value, 5);

  // Without the pairs each row is the marking, never an estimate.
  const bare = reportRowsOf(eventsWithoutPairs(events), RUN_ID);
  for (const name of [
    "gate time total",
    "gate time median",
    "critic time total",
    "critic time median",
    "commit-scan time total",
    "commit-scan time median",
  ]) {
    assert.equal(rowOf(bare.rows, name).value, NOT_IN_EVENTS, name);
  }
});

test("what the events cannot hold (T133)", () => {
  const report = reportRowsOf(eventsOfFixture(), RUN_ID);
  for (const name of [
    "critic split (missing or wrong / no evidence)",
    "verdict MET and UNMET counts",
    "pass-limit banners of a log",
  ]) {
    assert.equal(rowOf(report.rows, name).value, NOT_IN_EVENTS, name);
  }
  // Tasks per phase come from `phase.started`; the fixture carries them.
  assert.deepEqual(rowOf(report.rows, "tasks per phase").value, { "1": 8, "2": 13 });
  const bare = reportRowsOf(
    eventsOfFixture().filter((event) => event.type !== "phase.started"),
    RUN_ID,
  );
  assert.equal(rowOf(bare.rows, "tasks per phase").value, NOT_IN_EVENTS);
  // No row imputes a duration for an unclosed attempt: the pairing gives
  // `null`, and the median rows count the closed attempts only.
  const paired = pairAttempts(eventsOfFixture());
  assert.ok(paired.unclosed.every((attempt) => attempt.durationMs === null));
  assert.equal(rowOf(report.rows, "attempt duration median").value, 90);
});

test("dropped events are shown (T134)", () => {
  const report = reportRowsOf(eventsOfFixture(), RUN_ID);
  assert.equal(rowOf(report.rows, "events dropped").value, 3);
});

test("median of the pure helper", () => {
  assert.equal(median([]), null);
  assert.equal(median([7]), 7);
  assert.equal(median([3, 4]), 3.5);
  assert.equal(median([40, 10, 20, 30]), 25);
});
