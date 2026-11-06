/**
 * CT-141-140 — the layer allowlist of the second suite (T137, T142;
 * F141-FR-040).
 *
 * What the test proves, mostly against the REAL file and the REAL register map:
 *
 * - **generated and checked**: the allowlist generates from the rows of the
 *   register that carry the handling `layer field`, and every such row is an
 *   entry, a `notReachable` row with its reason, or a switch the `parity`
 *   profile holds off; a row that is none of these throws with the row named;
 * - **`run:<runId>:task-list` is NO entry** (CQ-084): the engine writes it at
 *   launch in every run, so captures A and B both hold it and compare it;
 * - **where every value comes from**: the event catalogue of feature 111, the
 *   logical names of feature 100 annex B §B.5, or the text of the register row;
 *   a value from nowhere throws;
 * - **matching**: an entry matches by its values — event type, logical name
 *   with its `<N>` counter, the announcement of DV-053 in its fixture class;
 * - **the comparison**: a difference outside the allowlist is a breach reported
 *   with "possible breach of gate integrity"; and on a build whose layer
 *   changes one counter or writes one unnamed field, the suite fails with the
 *   same words;
 * - **an entry that matched nothing in any fixture fails the suite**.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { layerAllowlist, registerMap } from "../../src/catalogue/data.ts";
import {
  BREACH_MESSAGE,
  LAYER_FIELD_HANDLING,
  TASK_LIST_AT_LAUNCH,
  assertEveryEntryMatchesSomething,
  assertTaskListAtLaunchIsNoEntry,
  checkValueSources,
  compareWithAllowlist,
  entryMatches,
  eventTypesOfFeature111,
  failuresOfVerdict,
  generateLayerAllowlist,
  layerFieldRows,
  logicalNamesOfAnnexB,
  sourceOfValue,
  eventTypeOf,
  AllowlistError,
  type Difference,
  type EntryObservation,
} from "../../src/suite2/allowlist.ts";
import {
  countersOfPhase,
  countersVerdict,
  failuresOfCountersVerdict,
} from "../../src/suite2/counters.ts";
import type { NormalizedCapture } from "../../src/normalize/index.ts";

function captureWith(surfaces: Record<string, unknown>): NormalizedCapture {
  return { surfaces } as unknown as NormalizedCapture;
}

test("the allowlist generates from the register map and holds up as it stands", () => {
  const map = registerMap();
  const rows = layerFieldRows(map);
  const handling = rows.map((row) => row.handling);
  // Every row of the generation is a row of the handling `layer field`.
  assert.ok(rows.length >= 6);
  assert.ok(handling.every((h) => h.includes(LAYER_FIELD_HANDLING)));
  // The REAL file generates without a problem: every layer-field row of the
  // register is an entry, not reachable, or held off by the profile.
  const generated = generateLayerAllowlist();
  assert.ok(generated.entries.length >= 5);
  assert.ok(generated.notReachable.every((row) => row.reason.trim() !== ""));
});

test("a layer-field row that is neither entry, nor unreachable, nor off, throws with the row named", () => {
  const map = registerMap();
  const withAStowaway = {
    ...map,
    rows: [
      ...map.rows,
      {
        ...map.rows[0],
        row: "DV-900",
        registerText: "the micro loop writes a field of its own into the run record",
        handling: [LAYER_FIELD_HANDLING],
      },
    ],
  };
  assert.throws(() => generateLayerAllowlist(withAStowaway), /DV-900.*F141-FR-040/);
  // And the row that carries `off` is explained by the profile: DV-088 names a
  // switch the `parity` profile holds off, so it needs no entry.
  const off = layerFieldRows(map).find((row) => row.row === "DV-088");
  assert.notEqual(off, undefined);
  assert.doesNotThrow(() =>
    generateLayerAllowlist({
      ...map,
      rows: map.rows.filter((row) => row.row !== "DV-088"),
    }),
  );
});

test("run:<runId>:task-list is no entry (CQ-084)", () => {
  assertTaskListAtLaunchIsNoEntry();
  const file = layerAllowlist();
  assert.equal(
    file.entries.some((entry) => entry.values.includes(TASK_LIST_AT_LAUNCH)),
    false,
  );
  // And the not-reachable row of DV-052 says WHY: the engine writes it at
  // launch in every run.
  const row = file.notReachable.find(
    (candidate) => candidate.reason.includes("at launch") && candidate.reason.includes("every run"),
  );
  assert.notEqual(row, undefined);
  // A file that grew an entry for it anyway is refused.
  assert.throws(
    () =>
      assertTaskListAtLaunchIsNoEntry({
        ...file,
        entries: [
          ...file.entries,
          {
            row: "DV-052",
            surface: "control-records",
            values: [TASK_LIST_AT_LAUNCH],
            match: "logical name",
          },
        ],
      }),
    AllowlistError,
  );
});

test("every value of every entry comes from one of the three authorities", () => {
  checkValueSources();
  const events = eventTypesOfFeature111();
  for (const type of [
    "strategy.selected",
    "microloop.inert",
    "prompt.block_dropped",
    "prompt.block_protected",
  ]) {
    assert.ok(events.has(type), `${type} of the catalogue of feature 111`);
  }
  const names = logicalNamesOfAnnexB();
  for (const name of ["run:<runId>:task-list", "phase:<N>:manifest"]) {
    assert.ok(names.has(name), name);
  }
  assert.equal(sourceOfValue("strategy.selected", "DV-016"), "the event catalogue of feature 111");
  assert.equal(
    sourceOfValue("phase:<N>:manifest", "DV-052"),
    "the logical name of feature 100, annex B §B.5",
  );
  // A value from nowhere is a failure, not a silent entry.
  assert.equal(sourceOfValue("no.such.value.anywhere", "DV-016"), "nowhere");
});

test("an entry matches by its values", () => {
  const file = layerAllowlist();
  const event = file.entries.find((entry) => entry.row === "DV-016") as {
    surface: string;
    values: readonly string[];
  };
  const eventDifference: Difference = {
    surface: "events-primary",
    where: "microloop.inert",
    a: "null",
    b: "{}",
  };
  assert.equal(entryMatches(event as never, eventDifference), true);
  assert.equal(entryMatches(event as never, { ...eventDifference, where: "run.started" }), false);
  // A logical name with its phase counter.
  const phase = file.entries.find((entry) => entry.row === "DV-052") as never;
  assert.equal(
    entryMatches(phase, { surface: "control-records", where: "phase:2:manifest", a: "1", b: "2" }),
    true,
  );
  assert.equal(
    entryMatches(phase, { surface: "control-records", where: "phase:x:manifest", a: "1", b: "2" }),
    false,
  );
});

test("the announcement entry of DV-053 matches only in its fixture class", () => {
  const file = layerAllowlist();
  const entry = file.entries.find((candidate) => candidate.row === "DV-053") as never;
  const announcement: Difference = {
    surface: "events-primary",
    where: "strategy.selected",
    a: "null",
    b: JSON.stringify({ type: "strategy.selected", fallbackReason: "gate-not-executing" }),
  };
  const wrongReason: Difference = {
    surface: "events-primary",
    where: "strategy.selected",
    a: "null",
    b: JSON.stringify({ type: "strategy.selected", fallbackReason: "reject-limit" }),
  };
  assert.equal(entryMatches(entry, announcement, { verificationMode: "plan" }), true);
  assert.equal(entryMatches(entry, announcement, { verificationMode: "off" }), true);
  assert.equal(entryMatches(entry, wrongReason, { verificationMode: "plan" }), false);
  assert.equal(entryMatches(entry, announcement, { verificationMode: "prompt" }), false);
  // And in the form N-13 keeps (ordered pairs), the same.
  const inPairs: Difference = {
    surface: "events-primary",
    where: "strategy.selected",
    a: "null",
    b: JSON.stringify({
      pairs: [
        { key: "type", value: "strategy.selected" },
        { key: "fallbackReason", value: "gate-not-executing" },
      ],
    }),
  };
  assert.equal(entryMatches(entry, inPairs, { verificationMode: "off" }), true);
});

test("an inert build gives an empty verdict; a breach carries the message", () => {
  const a = captureWith({
    "events-primary": {
      records: [
        {
          pairs: [
            { key: "type", value: "run.started" },
            { key: "stream", value: "primary" },
          ],
        },
      ],
    },
    "control-records": {
      entries: [
        { name: "run:<runId>:task-list", value: ["a", "b"] },
        { name: "workspace:record", value: { loop: "off" } },
      ],
    },
  });
  const same = captureWith({
    "events-primary": {
      records: [
        {
          pairs: [
            { key: "type", value: "run.started" },
            { key: "stream", value: "primary" },
          ],
        },
      ],
    },
    "control-records": {
      entries: [
        { name: "run:<runId>:task-list", value: ["a", "b"] },
        { name: "workspace:record", value: { loop: "off" } },
      ],
    },
  });
  const inert = compareWithAllowlist(
    "FX-01/defaults",
    a as never,
    same as never,
    layerAllowlist(),
    { verificationMode: "prompt" },
  );
  assert.equal(inert.allowed.length, 0);
  assert.equal(inert.breaches.length, 0);
  assert.deepEqual(failuresOfVerdict(inert), []);

  // One unnamed field written by the layer: the suite fails, and it says what
  // the gate says about it.
  const breach = compareWithAllowlist(
    "FX-01/defaults",
    a as never,
    captureWith({
      "events-primary": {
        records: [
          {
            pairs: [
              { key: "type", value: "run.started" },
              { key: "stream", value: "primary" },
            ],
          },
        ],
      },
      "control-records": {
        entries: [
          { name: "run:<runId>:task-list", value: ["a", "b"] },
          { name: "workspace:record", value: { loop: "off", microloopWroteThis: 1 } },
        ],
      },
    }) as never,
    layerAllowlist(),
    { verificationMode: "prompt" },
  );
  assert.equal(breach.breaches.length, 1);
  const failures = failuresOfVerdict(breach);
  assert.equal(failures.length, 1);
  assert.match(failures[0] as string, new RegExp(BREACH_MESSAGE));
  assert.match(failures[0] as string, /F141-FR-040/);
  // And the message is exactly the words the gate names.
  assert.equal(BREACH_MESSAGE, "possible breach of gate integrity");
});

test("the announcement is allowed where it belongs, and a counter change is a breach", () => {
  const file = layerAllowlist();
  const a = captureWith({ "events-primary": { records: [] }, "control-records": { entries: [] } });
  const bWithAnnouncement = captureWith({
    "events-primary": {
      records: [
        {
          pairs: [
            { key: "type", value: "strategy.selected" },
            { key: "strategy", value: "classic" },
            { key: "fallbackReason", value: "gate-not-executing" },
          ],
        },
      ],
    },
    "control-records": { entries: [] },
  });
  const verdict = compareWithAllowlist(
    "FX-11/plan-mode",
    a as never,
    bWithAnnouncement as never,
    file,
    { verificationMode: "plan" },
  );
  assert.equal(verdict.breaches.length, 0);
  assert.equal(verdict.allowed.length, 1);
  // The comparison removes it with the FIRST entry that names the event —
  // DV-016 names the type, DV-053 names type and reason — and either removal
  // is the allowlist working; DV-053 alone is what T144's expectation checks.
  assert.ok(
    verdict.allowed[0]?.entry.row === "DV-016" || verdict.allowed[0]?.entry.row === "DV-053",
  );

  // One counter changed on the surface S-16, which the counters assertion
  // holds: the suite fails there too, with the words the gate names.
  const countersA = {
    perPhase: [countersOfPhase(1, { passesUsed: 2 })],
    exitCodes: [0],
    stopReasons: ["phase-gate"],
    runStates: ["finished"],
  };
  const countersB = {
    perPhase: [countersOfPhase(1, { passesUsed: 3 })],
    exitCodes: [0],
    stopReasons: ["phase-gate"],
    runStates: ["finished"],
  };
  const breached = countersVerdict("FX-01/defaults", countersA as never, countersB as never);
  assert.equal(breached.differences.length, 1);
  assert.match(failuresOfCountersVerdict(breached)[0] as string, new RegExp(BREACH_MESSAGE));
});

test("an entry that matched nothing in any fixture fails the suite", () => {
  const file = layerAllowlist();
  const observations: EntryObservation[] = file.entries.map((entry) => ({
    row: entry.row,
    surface: entry.surface,
    match: entry.match,
    matchedInFixtures: ["FX-01/defaults"],
  }));
  assert.doesNotThrow(() => assertEveryEntryMatchesSomething(observations));
  assert.throws(
    () =>
      assertEveryEntryMatchesSomething([
        ...observations,
        {
          row: "DV-016",
          surface: "events-primary",
          match: "event type",
          matchedInFixtures: [],
        },
      ]),
    /matched nothing in any fixture/,
  );
});

test("the type of an event record is read from the pairs the capture keeps", () => {
  assert.equal(
    eventTypeOf({
      pairs: [
        { key: "type", value: "microloop.inert" },
        { key: "loop", value: "micro" },
      ],
    }),
    "microloop.inert",
  );
  assert.equal(eventTypeOf({ pairs: [{ key: "run.started", value: true }] }), "run.started");
  assert.equal(eventTypeOf({}), "unknown");
});
