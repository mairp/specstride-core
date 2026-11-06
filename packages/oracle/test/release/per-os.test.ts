/**
 * CT-141-135 — the per-OS expectations (T066, T072; F141-FR-035).
 *
 * Three readings of the criterion:
 *
 * 1. **the data** — the expectations are `packages/oracle/data/per-os-expectations.json`
 *    and nothing of this module's own: every subject F141-FR-035 names in prose has a
 *    row, the data is read back off disk and compared with the reader, and the six
 *    readings the requirement names (the form of the lock and the refusal of a second
 *    engine start, the detached job by behaviour, the temporary directory resolved to
 *    its real path, no name that differs only in case, the signals and their exit
 *    codes) are each read out of it;
 * 2. **on macOS the port is compared with the Linux capture** — the Specstride
 *    reference is authoritative on Linux only and the mixture-of-loops reference runs
 *    live on both, so `referenceHalfOn` gives a driven run for one and the Linux
 *    capture for the other, and the store only gives that capture for a live run that
 *    passed on the same build;
 * 3. **every expectation is `inferred`** — the mark is on the file, it says `inferred`,
 *    and `assertEveryExpectationIsInferred` refuses a table without it.
 *
 * **Status of the criterion**: `unverified` until the platform job has run on macOS
 * (`tasks.md` T066). What runs here is the hermetic half on Linux: that the
 * expectations are data, that every subject of the requirement has a row, that the
 * reader of them agrees with the file, that the macOS half of a comparison is the
 * confirmed Linux capture, and that every row is marked `inferred`. Whether each
 * expectation HOLDS on macOS is what the macOS runner decides, and no run has decided
 * it — see `tests/release/141/macos-first-run.md`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  BASELINE_THAT_RUNS_ON_BOTH_SYSTEMS,
  EXPECTATION_STATUS,
  PerOsError,
  SUBJECTS_F141_FR_035,
  SYSTEMS,
  SYSTEM_THE_SPECSTRIDE_REFERENCE_IS_AUTHORITATIVE_ON,
  UNVERIFIED,
  assertEveryExpectationIsInferred,
  assertEverySubjectOfTheRequirementHasARow,
  assertNoNameDiffersOnlyInCase,
  everyExpectationIsInferred,
  expectation,
  expectations,
  expectedOn,
  macosReadings,
  macosStatementsAreUnverified,
  macosUnverifiedStatement,
  namesThatDifferOnlyInCase,
  readMacosRunRecord,
  referenceHalfOn,
  statusOfTheData,
  theReferenceRunsLiveOn,
  type MacosRunRecord,
} from "../../src/release/per-os.ts";
import {
  GoldenStoreError,
  fixturesWithAGoldenCapture,
  goldenCaptureForThePlatformTier,
  readGoldenCapture,
} from "../../src/golden/store.ts";
import { oracleDataFile } from "../../src/index.ts";

const PACKAGE = resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));

/** The data file, read back off disk by this test and not through the reader. */
const DATA = JSON.parse(readFileSync(oracleDataFile("per-os-expectations.json"), "utf8")) as {
  readonly status: string;
  readonly expectations: readonly { subject: string; linux: string; macos: string }[];
};

// ---------------------------------------------------------------------------
// 1. the data
// ---------------------------------------------------------------------------

test("CT-141-135: the expectations are the data file, and the reader holds no table of its own", () => {
  assert.equal(expectations().length, DATA.expectations.length);
  assert.deepEqual(
    expectations().map((row) => [row.subject, row.linux, row.macos]),
    DATA.expectations.map((row) => [row.subject, row.linux, row.macos]),
    "every row of the reader is a row of packages/oracle/data/per-os-expectations.json",
  );
  assert.equal(statusOfTheData(), DATA.status);
  assert.deepEqual([...SYSTEMS], ["linux", "macos"]);
  // A subject the file does not hold is refused and the refusal names the subjects.
  assert.throws(
    () => expectation("the phase of the moon"),
    (error: unknown) =>
      error instanceof PerOsError && /is no subject of packages\/oracle\/data/.test(error.message),
  );
});

test("CT-141-135: every subject F141-FR-035 names in prose has a row", () => {
  assert.doesNotThrow(() => assertEverySubjectOfTheRequirementHasARow());
  for (const subject of SUBJECTS_F141_FR_035) {
    const row = expectation(subject);
    assert.ok(row.linux.length > 0, `${subject}: what Linux expects`);
    assert.ok(row.macos.length > 0, `${subject}: what macOS expects`);
    assert.equal(expectedOn(subject, "linux"), row.linux);
    assert.equal(expectedOn(subject, "macos"), row.macos);
  }
  assert.equal(SUBJECTS_F141_FR_035.length, 9);
});

test("CT-141-135: the six readings F141-FR-035 names are each in the data", () => {
  // the form of the lock differs, and the refusal of a second run is compared
  assert.match(expectedOn("workspace lock", "macos"), /the form differs/);
  assert.match(expectedOn("workspace lock", "macos"), /refusal of a second run is compared/);
  // a detached job is compared by behaviour
  assert.match(expectedOn("detached job", "macos"), /compared by behaviour/);
  // the temporary directory is resolved to its real path
  assert.match(expectedOn("temporary directory", "macos"), /real path/);
  // fixtures use no names that differ only in case
  assert.match(expectedOn("file system", "macos"), /no names that differ only in case/);
  // signals and their exit codes are compared
  assert.match(expectedOn("signals and exit 128+N", "macos"), /compared/);
  // and the whole set, as the module reads it
  assert.deepEqual(
    macosReadings().map((reading) => reading.subject),
    [
      "workspace lock",
      "detached job",
      "event time",
      "temporary directory",
      "file system",
      "signals and exit 128+N",
    ],
  );
  for (const reading of macosReadings()) {
    assert.equal(reading.compared, expectedOn(reading.subject, "macos"));
  }
});

test("CT-141-135: no fixture uses two names that differ only in case", () => {
  assert.deepEqual([...namesThatDifferOnlyInCase()], []);
  assert.doesNotThrow(() => assertNoNameDiffersOnlyInCase());
  // And the check is not vacuous: two such names in a tree are found.
  const root = mkdtempSync(join(tmpdir(), "oracle-case-"));
  writeFileSync(join(root, "README.md"), "a");
  writeFileSync(join(root, "readme.md"), "b");
  const found = namesThatDifferOnlyInCase(root);
  assert.equal(found.length, 1);
  assert.deepEqual([...(found[0] as { names: readonly string[] }).names].sort(), [
    "README.md",
    "readme.md",
  ]);
  assert.throws(
    () => assertNoNameDiffersOnlyInCase(root),
    (error: unknown) => error instanceof PerOsError && /differ only in case/.test(error.message),
  );
});

// ---------------------------------------------------------------------------
// 2. on macOS the port is compared with the Linux capture
// ---------------------------------------------------------------------------

test("CT-141-135: the Specstride reference is authoritative on Linux only; mixture-of-loops runs live on both", () => {
  assert.equal(SYSTEM_THE_SPECSTRIDE_REFERENCE_IS_AUTHORITATIVE_ON, "linux");
  assert.equal(BASELINE_THAT_RUNS_ON_BOTH_SYSTEMS, "mixture-of-loops");
  assert.match(expectedOn("Specstride reference", "linux"), /runs live; authoritative/);
  assert.match(expectedOn("Specstride reference", "macos"), /does not run/);
  assert.match(expectedOn("mixture-of-loops reference", "macos"), /runs live/);

  assert.ok(theReferenceRunsLiveOn("linux", "specstride"));
  assert.ok(!theReferenceRunsLiveOn("macos", "specstride"));
  assert.ok(theReferenceRunsLiveOn("macos", "mixture-of-loops"));
});

test("CT-141-135: on macOS the port is compared with the Linux capture of the reference", () => {
  const onLinux = referenceHalfOn("linux", "specstride");
  assert.equal(onLinux.how, "driven live");

  const onMacos = referenceHalfOn("macos", "specstride");
  assert.equal(onMacos.how, "the Linux capture");
  assert.match((onMacos as { why: string }).why, /does not run on macos/);
  assert.match((onMacos as { why: string }).why, /the live run confirmed on the same build/);

  // The mixture-of-loops reference is driven on macOS too.
  assert.equal(referenceHalfOn("macos", "mixture-of-loops").how, "driven live");

  // And the capture the platform tier gets is the one the live run on Linux
  // confirmed, on the same build, and nothing else.
  const fixture = fixturesWithAGoldenCapture()[0] as string;
  const build = "b".repeat(40);
  const confirmation = {
    schema: "urn:specstride:schema:internal:141:oracle-live-run/1" as const,
    build,
    platform: "linux" as const,
    confirmed: [fixture],
    passed: true,
  };
  assert.deepEqual(
    goldenCaptureForThePlatformTier({ fixture, build, confirmation }),
    readGoldenCapture(fixture),
  );
  assert.throws(
    () => goldenCaptureForThePlatformTier({ fixture, build, confirmation: undefined }),
    GoldenStoreError,
    "no live run on Linux, no capture for macOS",
  );
});

// ---------------------------------------------------------------------------
// 3. every expectation is `inferred`
// ---------------------------------------------------------------------------

test("CT-141-135: every expectation is marked `inferred` until a macOS runner has confirmed it", () => {
  assert.equal(EXPECTATION_STATUS, "inferred");
  assert.ok(everyExpectationIsInferred(), statusOfTheData());
  assert.doesNotThrow(() => assertEveryExpectationIsInferred());
  assert.match(statusOfTheData(), /\binferred\b/);
  assert.match(statusOfTheData(), /unverified until a macOS runner has passed the oracle/);
  // The file's own words, not the reader's.
  assert.match(DATA.status, /\binferred\b/);
});

test("CT-141-135: while no macOS runner has passed, every statement about macOS stays `unverified`", () => {
  assert.equal(UNVERIFIED, "unverified");
  // There is no record of a macOS run in this repository.
  assert.equal(readMacosRunRecord(), undefined);
  assert.ok(macosStatementsAreUnverified(undefined));
  const statement = macosUnverifiedStatement(undefined);
  assert.match(statement, /no runner has passed the parity oracle/);
  assert.match(statement, /stays `unverified`/);
  assert.match(statement, /stays `inferred`/);
  assert.match(statement, /tests\/release\/141\/macos-first-run\.md/);

  // A record of a run that did NOT pass changes nothing.
  const failed: MacosRunRecord = {
    task: "T067",
    requirement: "F141-FR-036",
    build: "c".repeat(40),
    runner: "macos-14 arm64",
    expectationsThatHeld: [],
    expectationsThatDidNot: ["workspace lock"],
    passed: false,
  };
  assert.ok(macosStatementsAreUnverified(failed));

  // A record of a run that passed says which expectations held.
  const passed: MacosRunRecord = {
    ...failed,
    expectationsThatHeld: [...SUBJECTS_F141_FR_035],
    expectationsThatDidNot: [],
    passed: true,
  };
  assert.ok(!macosStatementsAreUnverified(passed));
  assert.match(macosUnverifiedStatement(passed), /a runner passed the oracle on build/);
  assert.match(macosUnverifiedStatement(passed), /workspace lock/);

  // The record is read off disk, and a file that is not there is not a result.
  const file = join(mkdtempSync(join(tmpdir(), "oracle-macos-")), "macos-verified.json");
  assert.equal(readMacosRunRecord(file), undefined);
  writeFileSync(file, `${JSON.stringify(passed)}\n`);
  assert.equal(readMacosRunRecord(file)?.build, passed.build);
  assert.ok(PACKAGE.endsWith(join("packages", "oracle")));
});
