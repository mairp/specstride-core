/**
 * CT-115-37 (T104, F115-FR-037) — every recordable fact of the layer is an
 * event of the type that the table "Events of the layer" names, and no type
 * is written that the catalogue of feature 111 does not hold; an event holds
 * no output of a command and no note of a checkpoint; a pass that an inner
 * time cap ended is marked as ended by a time limit.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  LAYER_EVENT_TYPES,
  LAYER_OFF_CAUSES,
  FORBIDDEN_EVENT_FIELDS,
  isLayerEventType,
  layerEvent,
  strategySelected,
  attemptStarted,
  microloopInert,
  checkpointAccepted,
  checkpointRefused,
  checkpointRemoved,
  checkStarted,
  checkEnded,
  microloopUnit,
  checkExcluded,
  routeDecided,
  escalationSkipped,
  integrityNoted,
  tripwireRaised,
  tripwireCleared,
  markKilledByInnerTimeCap,
} from "../../src/report/events.ts";

/** The catalogue of feature 111, read from its contract file. */
const catalogue = readFileSync(
  new URL(
    "../../../../specs/111-event-schema-and-projection/contracts/event-catalogue.tsv",
    import.meta.url,
  ),
  "utf8",
)
  .split("\n")
  .slice(1)
  .filter((line) => line.trim().length > 0)
  .map((line) => line.split("\t")[0]);

test("CT-115-37: every type of the table 'Events of the layer' is in the catalogue of feature 111", () => {
  assert.ok(LAYER_EVENT_TYPES.length >= 15);
  for (const type of LAYER_EVENT_TYPES) {
    assert.ok(
      catalogue.includes(type),
      `type ${type} of the table is not in the event catalogue of feature 111`,
    );
  }
});

test("CT-115-37: the layer writes no type the catalogue does not hold", () => {
  assert.equal(isLayerEventType("strategy.selected"), true);
  assert.equal(isLayerEventType("microloop.unit"), true);
  for (const invented of ["microloop.secret", "loop.private", "note.written", "pass.said"]) {
    assert.equal(isLayerEventType(invented), false);
    assert.throws(() => layerEvent(invented as never), /not in the table/);
  }
});

/** One event of every factory of the module: the recordable facts of the layer. */
const oneOfEach = (): { type: string; fields: Record<string, unknown> }[] => [
  strategySelected({
    strategy: "micro",
    level: "L1",
    manifestHashes: ["h1"],
    fallbackReason: "harness",
  }),
  attemptStarted({ phase: 2, attempt: 1, strategy: "micro" }),
  microloopInert({ phase: 2, attempt: 1 }),
  checkpointAccepted({ unitId: "u1", taskIds: ["T1"], checkpointRef: "unit:u1:checkpoint" }),
  checkpointRefused({ reason: "stale", bytes: 12 }),
  checkpointRemoved({ bytes: 12 }),
  checkStarted({ checkId: "c1", unitId: "u1", runner: "runtime" }),
  checkEnded({ checkId: "c1", result: "pass", unitId: "u1", durationMs: 5, runner: "runtime" }),
  microloopUnit({ unitId: "u1", check: "c1", result: "kept" }),
  microloopUnit({
    unitId: "u1",
    check: "c1",
    result: "kept",
    layerOff: "caps",
    fallbackReason: "no-check",
  }),
  checkExcluded({
    checkId: "c1",
    reason: "slow",
    scope: "inner",
    durationMs: 90000,
    ruleId: "IR-08",
  }),
  routeDecided({
    tableId: "router-table-115",
    tableVersion: "1",
    point: "tools",
    ruleId: "r1",
    choice: "run",
  }),
  escalationSkipped({ reason: "cap" }),
  integrityNoted({ kind: "manifest-mismatch", detail: "paths: 1" }),
  tripwireRaised({ kind: "outer-counter-changed", ruleId: "IR-28" }),
  tripwireCleared({ clearedAt: "2026-10-06T00:00:00.000Z" }),
];

test("CT-115-37: every recordable fact is an event whose type the table names", () => {
  const events = oneOfEach();
  assert.equal(events.length, 16);
  for (const event of events) {
    assert.ok(
      (LAYER_EVENT_TYPES as readonly string[]).includes(event.type),
      `${event.type} is not a type of the table`,
    );
  }
});

test("CT-115-37: no event holds the output of a command or the note of a checkpoint", () => {
  for (const event of oneOfEach()) {
    for (const forbidden of FORBIDDEN_EVENT_FIELDS) {
      assert.ok(
        !(forbidden in event.fields),
        `${event.type} carries the forbidden field ${forbidden}`,
      );
    }
  }
  // And a factory that tries is refused, not trimmed.
  assert.throws(
    () => layerEvent("integrity.noted", { kind: "k", detail: "d", output: "…" }),
    /no output/,
  );
  assert.throws(
    () =>
      checkpointAccepted({
        unitId: "u",
        taskIds: ["T"],
        checkpointRef: "r",
        note: "secret",
      } as never),
    /no note/,
  );
});

test("CT-115-37: the layer going off carries the cause of the record disengaged and the fallback reason", () => {
  const event = microloopUnit({
    unitId: "u1",
    check: "c1",
    result: "kept",
    layerOff: "breach",
    fallbackReason: "tripwire",
  });
  assert.equal(event.fields["layerOff"], "breach");
  assert.equal(event.fields["fallbackReason"], "tripwire");
  assert.deepEqual(
    [...LAYER_OFF_CAUSES],
    ["caps", "integrity", "check-error", "no-check", "single-unit", "layer-error", "breach"],
  );
  assert.throws(
    () => microloopUnit({ unitId: "u", check: "c", result: "kept", layerOff: "because" as never }),
    /disengaged/,
  );
  assert.throws(
    () =>
      microloopUnit({
        unitId: "u",
        check: "c",
        result: "kept",
        fallbackReason: "because" as never,
      }),
    /fallback reason/,
  );
});

test("CT-115-37: a pass an inner time cap ended is marked as ended by a time limit", () => {
  assert.deepEqual(markKilledByInnerTimeCap(), {
    endCause: "time-limit",
    killClass: "inner-cap",
    killed: true,
  });
});
