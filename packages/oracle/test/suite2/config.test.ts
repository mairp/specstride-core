/**
 * CT-141-139 — the second suite runs every fixture of the first suite
 * unchanged, on the `parity` profile with row 1 set to `micro` and nothing
 * else, the stubs never declaring a unit of work, and both captures holding
 * S-14 to S-16 (T136, T141; F141-FR-039).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  SECOND_SUITE,
  SECOND_SUITE_LAYER_ROW,
  SECOND_SUITE_LAYER_VALUE,
  SECOND_SUITE_SURFACES,
  assertFixturesUnchanged,
  assertRowUnderTheSecondSuiteIsRowOne,
  assertStubsDeclareNoUnitOfWork,
  assertSurfacesOfTheSecondSuite,
  captureBOptions,
  configurationsOfFixture,
  reportLine,
  secondSuiteConfiguration,
  secondSuiteLayerKeys,
  FixtureChangedError,
} from "../../src/suite2/runner.ts";
import { profileRow, profileRows } from "@specstride/contracts/profile/parity";
import type { NeutralTranscriptRecord } from "../../src/capture/transcript.ts";

test("row 1 of the parity profile is the only row the second suite changes", () => {
  const keys = secondSuiteLayerKeys();
  assert.deepEqual([...keys], ["loop.strategy"]);
  const row = profileRow(SECOND_SUITE_LAYER_ROW);
  assert.notEqual(row, undefined);
  assert.deepEqual([...(row as { keys: readonly string[] }).keys], [...keys]);
  // Every OTHER row is untouched: no other key of the profile may stand in the
  // overlay, which `secondSuiteConfiguration` refuses.
  const otherKeys = profileRows.flatMap((r) => r.keys).filter((k) => !keys.includes(k));
  assert.ok(otherKeys.length > 0);
  const configuration = secondSuiteConfiguration(
    Object.fromEntries(otherKeys.map((k) => [k, "as-in-the-first-suite"])),
  );
  for (const key of otherKeys) {
    assert.equal(configuration[key], "as-in-the-first-suite");
  }
  assert.equal(configuration["loop.strategy"], SECOND_SUITE_LAYER_VALUE);
  assert.equal(SECOND_SUITE_LAYER_VALUE, "micro");
});

test("a key other than row 1 keeps its first-suite value", () => {
  // Nothing else changed: a key of the first suite is carried over as it was,
  // even one no row of the profile names.
  const changed = secondSuiteConfiguration({
    "loop.strategy": "classic",
    "some.other.key": "value",
  });
  assert.equal(changed["some.other.key"], "value");
  assert.equal(changed["loop.strategy"], "micro");
  // And a mutation that LOST a key of the first suite would be a change the
  // suite refuses: the function carries every key over, which the deep
  // comparison below makes the contract rather than a hope.
  const carried = Object.keys(changed).sort();
  assert.deepEqual(carried, ["loop.strategy", "some.other.key"]);
  // The overlay itself never adds a key outside the profile.
  const overlay = captureBOptions({
    side: "port",
    scenario: "s",
    fixture: {},
    workdir: "/tmp",
    fixtureDir: "/tmp/fx",
    runRoot: "/tmp/run",
    implementationRoot: "/tmp/impl",
    criticStubAddress: "http://127.0.0.1:1",
  } as unknown as Parameters<typeof captureBOptions>[0]).configurationOverlay;
  assert.notEqual(overlay, undefined);
  assert.deepEqual(Object.keys(overlay as object), ["loop.strategy"]);
  assert.equal((overlay as Record<string, string>)["loop.strategy"], "micro");
});

test("the first suite must not have set row 1 itself", () => {
  assert.throws(
    () => secondSuiteConfiguration({ "loop.strategy": "micro" }),
    /capture A would not be the port with the layer off/,
  );
});

test("every fixture runs unchanged: a declaration that moved is refused", () => {
  const before = {
    id: "FX-13/resume-after-reject-limit",
    steps: [{ argv: ["specstride", "run"] }],
  };
  assert.doesNotThrow(() => assertFixturesUnchanged("FX-13/x", before, structuredClone(before)));
  assert.throws(
    () => assertFixturesUnchanged("FX-13/x", before, { ...before, steps: [] }),
    FixtureChangedError,
  );
});

test("the stubs never declare a unit of work, on the transcript of capture B", () => {
  const records: readonly NeutralTranscriptRecord[] = [
    {
      role: "proposer",
      harness: "stub",
      call: 1,
      prompt: "propose the next step",
      argv: ["step"],
      envNames: [],
    },
    { role: "critic", harness: "stub", call: 2, prompt: "review", argv: ["review"], envNames: [] },
  ];
  assert.doesNotThrow(() => assertStubsDeclareNoUnitOfWork("FX-01/x", records));
  for (const verb of ["unit-of-work", "checkpoint"] as const) {
    const withAUnitOfWork: readonly NeutralTranscriptRecord[] = [
      { role: "proposer", harness: "stub", call: 3, prompt: "propose", argv: [verb], envNames: [] },
    ];
    assert.throws(
      () => assertStubsDeclareNoUnitOfWork("FX-01/x", withAUnitOfWork),
      /never declare a unit of work/,
    );
  }
});

test("both captures hold S-14 to S-16", () => {
  assert.deepEqual([...SECOND_SUITE_SURFACES], ["events-primary", "control-records", "counters"]);
  const capture = {
    scenario: "s",
    side: "port",
    suite: SECOND_SUITE,
    layer: "on",
    surfaces: {
      "events-primary": { records: [] },
      "control-records": { entries: [] },
      counters: { perPhase: {} },
    },
    missing: {},
  };
  assert.doesNotThrow(() => assertSurfacesOfTheSecondSuite("FX-01/x", capture as never, "A"));
  assert.doesNotThrow(() => assertSurfacesOfTheSecondSuite("FX-01/x", capture as never, "B"));
  const withoutCounters = {
    ...capture,
    surfaces: { "events-primary": { records: [] }, "control-records": { entries: [] } },
  };
  assert.throws(
    () => assertSurfacesOfTheSecondSuite("FX-01/x", withoutCounters as never, "B"),
    /S-14 to S-16/,
  );
});

test("the two configurations of one fixture differ in row 1 alone", () => {
  assertRowUnderTheSecondSuiteIsRowOne();
  const { a, b } = configurationsOfFixture({ declaredKeys: { "loop.strategy": "classic" } });
  assert.equal(b["loop.strategy"], "micro");
  assert.equal(a["loop.strategy"], "classic");
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (key === "loop.strategy") continue;
    assert.deepEqual(a[key], b[key]);
  }
  assert.match(
    reportLine({
      fixture: "FX-01/x",
      a: {} as never,
      b: {} as never,
      configurationA: a,
      configurationB: b,
    }),
    /suite=second layer=micro/,
  );
});
