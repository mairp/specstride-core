/**
 * CT-141-125 — the golden captures (T064, T069, T070; F141-FR-025).
 *
 * The four readings of the criterion, each decided here:
 *
 * 1. **stored in normalized form without a path, account or name of a machine** —
 *    every one of the committed captures under `packages/oracle/golden/` is read
 *    back off disk and scanned (`checkTheStore`), and the scan is shown to FIND all
 *    three kinds in a capture that carries them, so a clean store is a result and
 *    not an empty check;
 * 2. **the capture job fails when a golden capture differs from a fresh one** —
 *    hermetically with a fresh capture the test supplies, and LIVE: the
 *    mixture-of-loops reference at `9c88f86` is driven again through the oracle's
 *    own driver and its normalized capture is held against the committed one;
 * 3. **no reference tree in the repository** — the repository is walked, and a tree
 *    that IS a copy of a baseline is built in scratch and found;
 * 4. **on macOS the confirmed Linux captures are used** — the platform tier gets a
 *    capture only from a live run on Linux that passed, on the same build, and that
 *    named the scenario; each of the four refusals is exercised.
 *
 * Where no clone of a baseline is found the live half is a SKIP WITH ITS REASON and
 * never a pass (`test/reference-tree.ts`).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  GoldenStoreError,
  IDENTITY_KEYS,
  MACHINE_PATH_ROOTS,
  REFERENCE_TREE_MARKER_COUNT,
  assertEveryGoldenCaptureIsNormalized,
  assertNoMachineTrace,
  assertNoReferenceTreeInTheRepository,
  checkTheStore,
  comparePortWithGolden,
  fixturesWithAGoldenCapture,
  goldenCaptureForThePlatformTier,
  goldenStoreEntries,
  identifiesIn,
  machineIdentity,
  machinePathsIn,
  committedPathsOfTheScenario,
  machineTracesIn,
  markersUnder,
  readGoldenCapture,
  readLiveRunConfirmation,
  referenceTreeCopiesIn,
  referenceTreeMarkers,
  type GoldenCapture,
  type LiveRunConfirmation,
} from "../../src/golden/store.ts";
import {
  CaptureJobError,
  assertTheCaptureJobPassed,
  captureJob,
  captureJobLines,
  exitCodeOfCaptureJob,
  freshCaptureOfTheReference,
  isSkipped,
  refreshGoldenCapture,
  type FreshCapture,
} from "../../src/golden/capture-job.ts";
import { resultOf } from "../../src/compare/comparator.ts";
import { activeFamilies } from "../../src/catalogue/data.ts";
import { declarationOf, pinOf, referenceTreeOf, skipReasonFor } from "../reference-tree.ts";

const PACKAGE = resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
const REPOSITORY = resolve(dirname(dirname(PACKAGE)));

/** The scenario the live half uses: no stub, and seconds to run. */
const LIVE_SCENARIO = "FX-32/greeting-ready";
const LIVE_SYSTEM = "mixture-of-loops";
const LIVE_DIR = join(PACKAGE, "fixtures", LIVE_SCENARIO);

/** A scratch root of its own per run. */
const scratch = (name: string): string => mkdtempSync(join(tmpdir(), `oracle-${name}-`));

/** A neutral context: the capture that goes in is already normalized. */
const neutralContext = (scenario: string) =>
  ({
    scenario,
    side: "port" as const,
    roots: [],
    statePaths: {},
    durationsUnderTest: [],
    slug: "001-greeting",
  }) as never;

/** What the live half needs, or the reason it cannot run. */
const liveHalf = (): { skip: string | false } =>
  referenceTreeOf(LIVE_SYSTEM) === undefined
    ? { skip: skipReasonFor(LIVE_SYSTEM) }
    : { skip: false };

// ---------------------------------------------------------------------------
// 1. stored in normalized form, with no path, account or name of a machine
// ---------------------------------------------------------------------------

test("CT-141-125: every committed golden capture is normalized and holds no path, account or name of a machine", () => {
  const entries = goldenStoreEntries();
  assert.ok(entries.length > 0, "the store holds at least one committed golden capture");
  assert.deepEqual(
    checkTheStore(),
    [],
    "F141-FR-025: no committed capture is unnormalized or holds a trace of a machine",
  );
  // The store is of the reference, by scenario, and each file is the capture it says it is.
  for (const entry of entries) {
    const golden = readGoldenCapture(entry.fixture, entry.side);
    assert.equal(golden.fixture, entry.fixture);
    assert.equal(golden.side, entry.side);
    assert.ok(Object.keys(golden.counts).length > 0, `${entry.fixture}: the rules ran`);
  }
  assert.deepEqual(
    [...fixturesWithAGoldenCapture()],
    entries.filter((e) => e.side === "reference").map((e) => e.fixture),
  );
});

test("CT-141-125: the scan finds all three kinds of trace, and leaves content of the run alone", () => {
  const identity = {
    home: "/home/alice",
    temporaryDirectory: "/tmp",
    account: "alice",
    machine: "buildbox",
  };
  // A path of the machine, an account and a name of the machine.
  const found = (text: string): readonly string[] =>
    machineTracesIn({ stdout: text }, identity).map((trace) => `${trace.kind}:${trace.found}`);
  assert.deepEqual(found("/home/alice/work/x.txt"), ["path:/home", "account:alice"]);
  assert.deepEqual(found("/tmp/oracle-abc/work"), ["path:/tmp"]);
  assert.deepEqual(found("/var/folders/zz/T/x"), ["path:/var/folders"]);
  assert.deepEqual(found("sent to alice@buildbox"), ["account:alice", "machine:buildbox"]);
  assert.deepEqual(found("http://buildbox:8080/x"), ["machine:buildbox"]);
  assert.deepEqual(found("buildbox.local"), ["machine:buildbox"]);
  // An identity key names an account or a machine wherever it stands.
  assert.deepEqual(
    machineTracesIn({ state: { user: "alice", hostname: "buildbox" } }, identity).map(
      (t) => `${t.kind}:${t.at}`,
    ),
    ["account:state.user", "machine:state.hostname"],
  );
  assert.ok(IDENTITY_KEYS.includes("user") && IDENTITY_KEYS.includes("hostname"));

  // Content of the run that is the same on every machine is NOT a trace: the word
  // `root` of ordinary English, and a shebang or a path of the system.
  for (const benign of [
    "run from the repository root",
    "#!/usr/bin/env python3",
    '{"argv": ["/usr/bin/make", "live"]}',
    "the alice in wonderland",
    "/etc/hosts",
  ]) {
    assert.deepEqual(found(benign), [], benign);
  }
  // The placeholders the rules of feature 100 put in their place are allowed.
  assert.deepEqual(machineTracesIn({ state: { HOME: "<HOME>", host: "127.0.0.1" } }, identity), []);

  // The two readings the scan is built on, on their own.
  assert.deepEqual([...machinePathsIn("<local-path>")], ["/root"]);
  assert.deepEqual([...machinePathsIn("/rootless/x")], []);
  assert.ok(identifiesIn("/home/alice/x", "alice"));
  assert.ok(!identifiesIn("alice went to town", "alice"));
  assert.ok(MACHINE_PATH_ROOTS.includes("/home") && !MACHINE_PATH_ROOTS.includes("/usr"));
});

test("CT-141-125: a path the scenario's own committed input carries is content, not a trace", () => {
  const identity = {
    home: "/home/alice",
    temporaryDirectory: "/tmp",
    account: "alice",
    machine: "buildbox",
  };
  // The as-is stream of the Specstride baseline that `FX-26/claude-evidence-event`
  // replays records a `Write` whose target is `/tmp/stream-golden/GATE2-EVIDENCE.md`,
  // so the capture holds the target the STREAM named. The literal is committed with
  // the fixture and is the same on every machine.
  const carried = committedPathsOfTheScenario("FX-26/claude-evidence-event");
  assert.ok(
    carried.includes("/tmp/stream-golden/GATE2-EVIDENCE.md"),
    `the fixture of FX-26/claude-evidence-event carries the path of its own stream: ${carried.join(", ")}`,
  );
  const line = "  \u2192 Write /tmp/stream-golden/GATE2-EVIDENCE.md\n";
  // Without the allowance the same line reads as a trace, which is what made the
  // two FX-26 members fail CT-141-125 when they were first captured.
  assert.deepEqual(
    machineTracesIn({ stdout: line }, identity).map((trace) => `${trace.kind}:${trace.found}`),
    ["path:/tmp"],
  );
  assert.deepEqual(machineTracesIn({ stdout: line }, identity, "", carried), []);
  // And the allowance hides nothing else: another path under the same root is still
  // a trace when the scenario's input does not carry it.
  assert.deepEqual(
    machineTracesIn({ stdout: `${line}/tmp/oracle-golden-xyz/work\n` }, identity, "", carried).map(
      (trace) => `${trace.kind}:${trace.found}`,
    ),
    ["path:/tmp"],
  );
  // A scenario whose input carries no such path gets no allowance at all.
  assert.deepEqual([...committedPathsOfTheScenario("FX-01/three-phases")], []);
  assert.deepEqual([...committedPathsOfTheScenario("FX-99/none")], []);
});

test("CT-141-125: a golden capture that holds a trace, or that the rules never ran on, is refused", () => {
  const identity = machineIdentity();
  const base: GoldenCapture = {
    schema: "urn:specstride:schema:internal:141:oracle-golden/1",
    fixture: "FX-01/three-phases",
    side: "reference",
    suite: "first",
    layer: "off",
    system: "specstride",
    commit: "9cab15d",
    surfaces: { stdout: "clean" },
    missing: {},
    counts: { "N-01": 3 },
  };
  assert.doesNotThrow(() => assertNoMachineTrace(base, identity));
  assert.doesNotThrow(() => assertEveryGoldenCaptureIsNormalized(base));

  for (const [what, surfaces] of [
    ["a path of the machine", { stdout: `${identity.temporaryDirectory}/oracle-x/work` }],
    ["an account", { state: { user: identity.account } }],
    ["a name of the machine", { stdout: `http://${identity.machine}:9/x` }],
  ] as const) {
    assert.throws(
      () => assertNoMachineTrace({ ...base, surfaces }, identity),
      (error: unknown) =>
        error instanceof GoldenStoreError && /trace\(s\) of the machine/.test(error.message),
      what,
    );
  }
  // A capture with no count of any rule was hand-written, not captured.
  assert.throws(
    () => assertEveryGoldenCaptureIsNormalized({ ...base, counts: {} }),
    (error: unknown) =>
      error instanceof GoldenStoreError && /not stored in normalized form/.test(error.message),
  );
});

// ---------------------------------------------------------------------------
// 2. the capture job fails when a golden capture differs from a fresh one
// ---------------------------------------------------------------------------

/** A fresh capture built from the committed one, with `change` applied. */
function freshFrom(
  fixture: string,
  change: (surfaces: Record<string, unknown>) => void = () => undefined,
): FreshCapture {
  const golden = readGoldenCapture(fixture);
  const surfaces = JSON.parse(JSON.stringify(golden.surfaces)) as Record<string, unknown>;
  change(surfaces);
  return {
    fixture,
    system: golden.system,
    commit: golden.commit,
    normalized: {
      scenario: fixture,
      side: "reference",
      suite: "first",
      layer: "off",
      surfaces,
      missing: {},
      counts: golden.counts,
      findings: [],
    },
  };
}

test("CT-141-125: the capture job passes on a fresh capture equal to the committed one", () => {
  const report = captureJob({
    fixtures: [...fixturesWithAGoldenCapture()],
    captureFresh: (fixture) => freshFrom(fixture),
  });
  assert.equal(report.passed, true, captureJobLines(report).join("\n"));
  assert.deepEqual([...report.failed], []);
  assert.deepEqual([...report.skipped], []);
  assert.equal(exitCodeOfCaptureJob(report), 0);
  assert.doesNotThrow(() => assertTheCaptureJobPassed(report));
  assert.ok(report.entries.every((entry) => entry.outcome === "equal"));
});

test("CT-141-125: the capture job FAILS when a committed golden capture differs from a fresh one", () => {
  const fixture = "FX-32/greeting-ready";
  const report = captureJob({
    fixtures: [fixture],
    captureFresh: (held) =>
      freshFrom(held, (surfaces) => {
        surfaces["exit"] = 123;
      }),
  });
  assert.equal(report.passed, false);
  assert.deepEqual([...report.failed], [fixture]);
  assert.equal(exitCodeOfCaptureJob(report), 1);
  const entry = report.entries[0];
  assert.equal(entry?.outcome, "different");
  assert.ok(entry?.differences.some((difference) => difference.surface === "exit"));
  assert.match(String(entry?.reason), /differs from a fresh capture of the reference on exit/);
  assert.throws(() => assertTheCaptureJobPassed(report), CaptureJobError);
  assert.ok(captureJobLines(report).some((line) => /FAILED/.test(line)));
});

test("CT-141-125: the capture job fails when a FRESH capture holds a trace of the machine", () => {
  const identity = machineIdentity();
  const fixture = "FX-32/greeting-ready";
  const report = captureJob({
    fixtures: [fixture],
    identity,
    captureFresh: (held) => freshFrom(held),
    golden: (held) => {
      const golden = readGoldenCapture(held);
      return golden;
    },
  });
  assert.equal(report.passed, true, "the committed capture carries no trace");

  const traced = captureJob({
    fixtures: [fixture],
    identity,
    // The fresh capture is equal to the committed one AND holds a trace, so the
    // only thing that can fail the job is the scan.
    captureFresh: (held) => freshFrom(held),
    golden: (held) => {
      const golden = readGoldenCapture(held);
      return {
        ...golden,
        surfaces: { ...golden.surfaces, stdout: `http://${identity.machine}:9/x` },
      };
    },
  });
  assert.equal(traced.passed, false, "a difference against the altered committed capture is seen");

  // And directly: a fresh capture that carries a trace is never written as a golden one.
  assert.throws(
    () =>
      refreshGoldenCapture(
        freshFrom(fixture, (surfaces) => {
          surfaces["stdout"] = `${identity.temporaryDirectory}/oracle-x/work/one.txt`;
        }),
      ),
    (error: unknown) =>
      error instanceof GoldenStoreError && /trace\(s\) of the machine/.test(error.message),
  );
});

test("CT-141-125: a scenario whose prerequisite is missing is a skip with its reason, and the release run refuses it", () => {
  const fixture = "FX-32/greeting-ready";
  const reason = "prerequisite missing: no clone of the mixture-of-loops baseline was found";
  const report = captureJob({
    fixtures: [fixture],
    captureFresh: () => ({ fixture, skipped: reason }),
  });
  assert.deepEqual([...report.skipped], [fixture]);
  assert.equal(report.entries[0]?.outcome, "skipped");
  assert.equal(report.entries[0]?.reason, reason);
  assert.equal(report.passed, true, "a skip alone does not fail the capture job");

  const release = captureJob({
    fixtures: [fixture],
    requireEveryPrerequisite: true,
    captureFresh: () => ({ fixture, skipped: reason }),
  });
  assert.equal(release.passed, false, "the release run meets every prerequisite (F141-FR-037)");
  assert.deepEqual([...release.failed], [fixture]);

  // And nothing is ever written from a capture that was not made.
  assert.throws(
    () => refreshGoldenCapture({ fixture, skipped: reason }),
    (error: unknown) =>
      error instanceof CaptureJobError &&
      /no fresh capture of the reference was made/.test(error.message),
  );
  assert.ok(isSkipped({ fixture, skipped: reason }));
});

test("CT-141-125: LIVE — a fresh capture of the reference equals the committed golden capture, and one seeded value fails the job", () => {
  const live = liveHalf();
  if (live.skip !== false) {
    // A missing prerequisite is a skip with its reason and never a pass.
    assert.ok(/prerequisite missing/.test(live.skip), live.skip);
    return;
  }
  const tree = referenceTreeOf(LIVE_SYSTEM);
  assert.ok(tree !== undefined);
  const fresh = freshCaptureOfTheReference({
    fixture: LIVE_SCENARIO,
    fixtureDir: LIVE_DIR,
    runRoot: scratch("capture-job"),
    declaration: declarationOf(LIVE_DIR) as never,
    referenceRoot: tree.root,
    criticStubAddress: "http://127.0.0.1:1",
    slug: "001-greeting",
    system: LIVE_SYSTEM,
    commit: pinOf(LIVE_SYSTEM).commit,
  });
  assert.ok(!isSkipped(fresh), isSkipped(fresh) ? fresh.skipped : "");
  // The run really happened: the capture holds the surfaces the scenario names.
  for (const surface of ["exit", "stdout", "stderr", "tree", "state"]) {
    assert.ok(surface in fresh.normalized.surfaces, `the fresh capture holds ${surface}`);
  }
  const report = captureJob({ fixtures: [LIVE_SCENARIO], captureFresh: () => fresh });
  assert.equal(
    report.passed,
    true,
    `the committed golden capture of ${LIVE_SCENARIO} differs from a fresh capture of the ` +
      `reference: ${captureJobLines(report).join(" | ")}`,
  );

  // The same fresh capture with one value changed fails the job: the comparison is
  // not vacuous.
  const seeded: FreshCapture = {
    ...fresh,
    normalized: {
      ...fresh.normalized,
      surfaces: { ...fresh.normalized.surfaces, exit: 42 },
    },
  };
  const failed = captureJob({ fixtures: [LIVE_SCENARIO], captureFresh: () => seeded });
  assert.equal(failed.passed, false);
  assert.ok(failed.entries[0]?.differences.some((d) => d.surface === "exit"));
});

test("CT-141-125: a fresh capture is a skip with its reason where the reference tree is not in scratch", () => {
  const withoutATree = freshCaptureOfTheReference({
    fixture: LIVE_SCENARIO,
    fixtureDir: LIVE_DIR,
    runRoot: scratch("no-tree"),
    declaration: declarationOf(LIVE_DIR) as never,
    referenceRoot: undefined,
    criticStubAddress: "http://127.0.0.1:1",
    system: LIVE_SYSTEM,
    commit: pinOf(LIVE_SYSTEM).commit,
  });
  assert.ok(isSkipped(withoutATree));
  assert.match(withoutATree.skipped, /prerequisite missing/);
  assert.match(withoutATree.skipped, /SKIP with its reason and never a pass/);

  const emptyTree = freshCaptureOfTheReference({
    fixture: LIVE_SCENARIO,
    fixtureDir: LIVE_DIR,
    runRoot: scratch("empty-tree"),
    declaration: declarationOf(LIVE_DIR) as never,
    referenceRoot: scratch("not-a-tree"),
    criticStubAddress: "http://127.0.0.1:1",
    system: LIVE_SYSTEM,
    commit: pinOf(LIVE_SYSTEM).commit,
  });
  assert.ok(isSkipped(emptyTree), "a directory that is no reference tree is a skip, not a run");
});

// ---------------------------------------------------------------------------
// 3. no reference tree in the repository
// ---------------------------------------------------------------------------

test("CT-141-125: the repository of the product holds no copy of a reference tree", () => {
  assert.deepEqual(
    referenceTreeCopiesIn(REPOSITORY).map((copy) => copy.directory),
    [],
    "F141-FR-025: a reference tree is produced at run time into scratch from a local clone",
  );
  assert.doesNotThrow(() => assertNoReferenceTreeInTheRepository(REPOSITORY));
});

test("CT-141-125: a directory that IS a copy of a baseline is found, and one file is not enough", () => {
  const markers = referenceTreeMarkers("specstride");
  assert.ok(markers.length >= REFERENCE_TREE_MARKER_COUNT, "the baseline has marker files");
  const root = scratch("fake-repository");
  const copy = join(root, "vendor", "baseline");
  mkdirSync(copy, { recursive: true });

  // One file of the baseline is an imported asset or a coincidence of names.
  const first = (markers[0] as readonly string[])[0] as string;
  mkdirSync(dirname(join(copy, first)), { recursive: true });
  writeFileSync(join(copy, first), "# one file\n");
  assert.equal(markersUnder(copy, "specstride").length, 1);
  assert.deepEqual(
    referenceTreeCopiesIn(root).map((c) => c.directory),
    [],
  );
  assert.doesNotThrow(() => assertNoReferenceTreeInTheRepository(root));

  // Three of them together are the baseline.
  for (const row of markers.slice(1, REFERENCE_TREE_MARKER_COUNT)) {
    const file = (row as readonly string[])[0] as string;
    mkdirSync(dirname(join(copy, file)), { recursive: true });
    writeFileSync(join(copy, file), "# another file\n");
  }
  assert.equal(markersUnder(copy, "specstride").length, REFERENCE_TREE_MARKER_COUNT);
  const found = referenceTreeCopiesIn(root);
  assert.deepEqual(
    found.map((c) => c.directory),
    [copy],
  );
  assert.equal(found[0]?.system, "specstride");
  assert.throws(
    () => assertNoReferenceTreeInTheRepository(root),
    (error: unknown) =>
      error instanceof GoldenStoreError && /copy\(ies\) of a reference tree/.test(error.message),
  );
});

// ---------------------------------------------------------------------------
// 4. on macOS the confirmed Linux captures are used
// ---------------------------------------------------------------------------

const BUILD = "0123456789abcdef0123456789abcdef01234567";

const confirmation = (over: Partial<LiveRunConfirmation> = {}): LiveRunConfirmation => ({
  schema: "urn:specstride:schema:internal:141:oracle-live-run/1",
  build: BUILD,
  platform: "linux",
  confirmed: [...fixturesWithAGoldenCapture()],
  passed: true,
  ...over,
});

test("CT-141-125: on macOS the platform tier uses the golden captures the live run on Linux confirmed on the same build", () => {
  const fixture = "FX-32/greeting-ready";
  const used = goldenCaptureForThePlatformTier({
    fixture,
    build: BUILD,
    confirmation: confirmation(),
  });
  assert.equal(used.fixture, fixture);
  assert.equal(used.side, "reference");
  // It is the committed capture itself, not a copy with something added.
  assert.deepEqual(used, readGoldenCapture(fixture));
});

/**
 * A scenario of the catalogue that the store holds no golden capture of. It is
 * DERIVED and never written out: the order of construction (F141-FR-045) builds
 * the fixtures family by family, so a scenario that has no capture today has one
 * tomorrow, and a name in this test would go stale the moment its family is
 * built.
 */
function aScenarioWithNoGoldenCapture(): string {
  const captured = new Set(fixturesWithAGoldenCapture());
  for (const entry of activeFamilies()) {
    for (const scenario of entry.scenarios) {
      if (scenario.pattern === true) continue;
      const id = `${entry.id}/${scenario.name}`;
      if (!captured.has(id)) return id;
    }
  }
  throw new Error("every scenario of the catalogue has a golden capture");
}

test("CT-141-125: the platform tier refuses a capture no live run on Linux confirmed", () => {
  const fixture = "FX-32/greeting-ready";
  const refusals: readonly [
    string,
    Parameters<typeof goldenCaptureForThePlatformTier>[0],
    RegExp,
  ][] = [
    [
      "no confirmation at all",
      { fixture, build: BUILD, confirmation: undefined },
      /no live differential run on Linux has confirmed/,
    ],
    [
      "a live run that did not pass",
      { fixture, build: BUILD, confirmation: confirmation({ passed: false }) },
      /did not pass/,
    ],
    [
      "another build",
      { fixture, build: BUILD, confirmation: confirmation({ build: "f".repeat(40) }) },
      /SAME build/,
    ],
    [
      "a scenario the live run did not confirm",
      { fixture, build: BUILD, confirmation: confirmation({ confirmed: [] }) },
      /did not confirm this scenario/,
    ],
    [
      "a scenario the store holds no capture of",
      { fixture: aScenarioWithNoGoldenCapture(), build: BUILD, confirmation: confirmation() },
      /the store holds no golden capture of the reference/,
    ],
  ];
  for (const [what, options, pattern] of refusals) {
    assert.throws(
      () => goldenCaptureForThePlatformTier(options),
      (error: unknown) => error instanceof GoldenStoreError && pattern.test(error.message),
      what,
    );
  }
});

test("CT-141-125: the confirmation of a live run is read off disk, and its absence is no result", () => {
  const file = join(scratch("confirmation"), "live-run.json");
  assert.equal(readLiveRunConfirmation(file), undefined, "no file is no confirmation");
  writeFileSync(file, `${JSON.stringify(confirmation())}\n`);
  assert.equal(readLiveRunConfirmation(file)?.build, BUILD);
  writeFileSync(file, `${JSON.stringify({ ...confirmation(), schema: "something-else" })}\n`);
  assert.throws(() => readLiveRunConfirmation(file), GoldenStoreError);
});

// ---------------------------------------------------------------------------
// T069 — the comparison of the port with the store
// ---------------------------------------------------------------------------

test("CT-141-125: the port against a committed golden capture reads `equal`, `different` and `waived`", () => {
  const fixture = "FX-32/greeting-ready";
  const golden = readGoldenCapture(fixture);
  const asThePort = (surfaces: Readonly<Record<string, unknown>>) => ({
    scenario: fixture,
    side: "port" as const,
    suite: "first" as const,
    layer: "off" as const,
    surfaces,
    missing: {},
  });

  const equal = comparePortWithGolden(asThePort(golden.surfaces), {
    fixture,
    golden,
    portContext: neutralContext(fixture),
  });
  assert.equal(equal.report.tier, "hermetic");
  assert.deepEqual([...equal.differences], []);
  for (const surface of Object.keys(golden.surfaces)) {
    assert.equal(resultOf(equal.report, surface), "equal", surface);
  }

  // One value of one surface, and that surface alone reads `different`.
  const changed = comparePortWithGolden(asThePort({ ...golden.surfaces, exit: 7 }), {
    fixture,
    golden,
    portContext: neutralContext(fixture),
  });
  assert.equal(resultOf(changed.report, "exit"), "different");
  assert.equal(resultOf(changed.report, "tree"), "equal");
  assert.ok(changed.differences.some((difference) => difference.surface === "exit"));

  // A waiver of THIS fixture and THIS surface makes it `waived`.
  const difference = changed.differences.find((held) => held.surface === "exit");
  assert.ok(difference !== undefined);
  const waived = comparePortWithGolden(asThePort({ ...golden.surfaces, exit: 7 }), {
    fixture,
    golden,
    portContext: neutralContext(fixture),
    waivers: [
      {
        fixture,
        surface: "exit",
        row: "DV-001",
        difference: {
          selector: difference.selector,
          reference: difference.reference,
          port: difference.port,
        },
      } as never,
    ],
  });
  assert.equal(resultOf(waived.report, "exit"), "waived");
  assert.equal(waived.report.results["exit"]?.row, "DV-001");

  // A surface the port did not capture is `different` and never `equal`.
  const missing = comparePortWithGolden(
    { ...asThePort(golden.surfaces), missing: { tree: "the capture was unreadable" } },
    { fixture, golden, portContext: neutralContext(fixture) },
  );
  assert.equal(resultOf(missing.report, "tree"), "different");

  // A skip with its reason compares nothing and is never a pass.
  const skipped = comparePortWithGolden(asThePort(golden.surfaces), {
    fixture,
    golden,
    portContext: neutralContext(fixture),
    skipped: { reason: "prerequisite missing: the product has no such command" },
  });
  assert.deepEqual(skipped.report.results, {});
  assert.match(String(skipped.report.skipped?.reason), /prerequisite missing/);
});
