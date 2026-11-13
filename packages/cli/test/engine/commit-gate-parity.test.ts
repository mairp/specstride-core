/**
 * The parity test of the commit backpressure (feature 152, F152-SC-008,
 * Principle XVIII; CQ-152-04 A, CQ-152-05 A).
 *
 * This test DRIVES THE ORACLE of feature 141 — the real library, not a
 * reimplementation:
 *
 * - **FX-27** (`FX-27/commits-off`, the commits family of the oracle): the
 *   port side is driven with the oracle's own driver (`driveSide`) and
 *   compared with the committed golden capture of the reference through the
 *   hermetic comparison of the oracle (`comparePortWithGolden`). Where the
 *   port's declared command line cannot drive the scenario, the oracle itself
 *   refuses the run (`SideUnavailableError`) and the comparison is the
 *   DECLARED skip of F141-FR-037 — a skip with its reason, never a pass.
 * - **the five fixtures of this feature**: each is run through the engine
 *   under `SPECSTRIDE_PROFILE=parity` (row 134 of annex X §X.7, DV-121: the
 *   switch `commit.backpressure` is off, so the gate never runs), the run's
 *   exit and its warning line are captured, and the reference (the baseline's
 *   as-is reading) and the port captures are judged by the oracle's real
 *   comparator (`compare`), with the real waiver matching of the oracle
 *   (`waiverFor`) over the real file `packages/oracle/waivers.json`.
 *
 * The two register rows of this feature are DV-121 (`not observable`: the
 * switch is off under the profile, so the gate never runs — asserted directly
 * on the control plane) and DV-122 (`waiver`: the exit 1 and the warning line
 * on the blocked-commit fixtures, the owner ruling of 2026-11-04).
 *
 * A `different` that no register row covers FAILS. A waiver that matched no
 * difference FAILS (`assertEveryWaiverMatchedSomething`, §O.5 rule 3).
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { runFeature } from "../../src/engine/run-feature.ts";
import { controlRootOfWorkspace } from "../../src/engine/workspace-control-root.ts";

// The oracle of feature 141: the comparison functions this test drives.
import {
  compare,
  resultOf,
  RESULTS,
  type ResultReport,
} from "../../../../packages/oracle/src/compare/comparator.ts";
import {
  assertEveryWaiverMatchedSomething,
  assertWaiverIsAllowed,
  readWaiverFile,
  useOfWaivers,
  type Difference,
  type Waiver,
} from "../../../../packages/oracle/src/waivers/waivers.ts";
import {
  SideUnavailableError,
  type DriveResult,
  driveSide,
} from "../../../../packages/oracle/src/run/driver.ts";
import { readGoldenCapture } from "../../../../packages/oracle/src/capture/golden.ts";
import { comparePortWithGolden } from "../../../../packages/oracle/src/golden/store.ts";
import { contextOfRun } from "../../../../packages/oracle/src/run/self.ts";
import type { NormalizeContext } from "../../../../packages/oracle/src/normalize/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, "..", "fixtures", "commit-gate");
const ROOT = resolve(join(__dirname, "..", "..", "..", ".."));
const PARITY_ORACLE_ROOT = join(ROOT, "packages", "oracle");
const REGISTER_MAP = JSON.parse(
  readFileSync(join(PARITY_ORACLE_ROOT, "data", "register-map.json"), "utf8"),
) as { rows: { row: string; handling: string[] }[] };

/** The planted secret: `ghp_` + 36 characters, a `github-prefix` hit. */
const SECRET = `ghp_${"a1b2c3d4e5f6".repeat(3)}`;

/** The safety-net warning line of `run-feature.ts` (F152-FR-022, DV-122). */
const WARNING_LINE = /commit\(s\) were blocked by the secret gate/;

/** The fixture prefix of this feature's waivers and scenarios in the oracle. */
const FIXTURE_PREFIX = "152/";

/** The fixtures of this feature the parity run covers, with their as-is exit. */
const FIXTURES_UNDER_PARITY = [
  "secret-removed-on-retry",
  "secret-every-attempt",
  "secret-moves-files",
  "instruction-in-a-file-name",
  "ordinary-code",
] as const;

/** The selector of the stderr difference the waivers of DV-122 name. */
const WARNING_SELECTOR = "the warning line that names the blocked commits";

/** The stderr value the baseline shows, where the port prints the warning. */
const NO_WARNING_ON_THE_BASELINE =
  "no such line: the baseline prints no warning over a blocked commit";

/** The one oracle scenario of the commits family this comparison runs (FX-27). */
const FX27_SCENARIO = "FX-27/commits-off";
const FX27_FIXTURE_DIR = join(PARITY_ORACLE_ROOT, "fixtures", "FX-27", "commits-off");

/** The real waiver file of the oracle, read through the oracle's own loader. */
const WAIVER_FILE = readWaiverFile();
/** The waivers of this feature: eight rows of DV-122, checked below. */
const OUR_WAIVERS: readonly Waiver[] = WAIVER_FILE.waivers.filter((waiver) =>
  waiver.fixture.startsWith(FIXTURE_PREFIX),
);

/**
 * What a run under `parity` shows on one fixture: the exit the engine returns
 * and the warning line the end-of-run rule printed, exactly as printed (the
 * prefix `[slug]` and the suffix `— the run exits 1, not 0` included), or
 * `undefined` where no warning line shows.
 */
type ParityRun = { readonly exit: number; readonly warning: string | undefined };

/** The differences DV-122 covers that one fixture's run shows. */
function differencesOfRun(fixtureName: string, run: ParityRun): readonly Difference[] {
  const found: Difference[] = [];
  // The exit 1 over a run the baseline would end 0 is the exit difference.
  if (run.exit !== 0) {
    found.push({
      fixture: `${FIXTURE_PREFIX}${fixtureName}`,
      surface: "exit",
      selector: "exitCode",
      reference: 0,
      port: run.exit,
    });
  }
  // The warning line is the stderr difference, exactly as the run printed it.
  found.push({
    fixture: `${FIXTURE_PREFIX}${fixtureName}`,
    surface: "stderr",
    selector: WARNING_SELECTOR,
    reference: NO_WARNING_ON_THE_BASELINE,
    port: run.warning ?? NO_WARNING_ON_THE_BASELINE,
  });
  return found;
}

type Fixture = {
  readonly dir: string;
  readonly scratch: string;
  readonly control: (...parts: string[]) => string;
  readonly out: () => string;
  readonly restore: () => void;
};

/** A workspace from a fixture directory, run under the `parity` profile. */
function fixture(name: string): Fixture {
  const source = join(FIXTURES, name);
  const dir = mkdtempSync(join(tmpdir(), "specstride-commit-gate-parity-"));
  const bin = join(dir, "bin");
  const work = join(dir, "work");
  const scratch = join(dir, "scratch");
  mkdirSync(bin);
  mkdirSync(scratch);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  copyFileSync(join(source, "tasks.md"), join(work, "specs", "001-one", "tasks.md"));
  writeFileSync(join(work, "package.json"), JSON.stringify({ scripts: { test: 'node -e ""' } }));
  copyFileSync(join(source, "stub-claude"), join(bin, "claude"));
  chmodSync(join(bin, "claude"), 0o755);
  for (const argv of [
    ["init", "-q"],
    ["config", "user.email", "t@t"],
    ["config", "user.name", "t"],
    ["add", "-A"],
    ["commit", "-qm", "init"],
  ]) {
    spawnSync("git", ["-C", work, ...argv]);
  }
  const before = {
    HOME: process.env.HOME,
    PATH: process.env.PATH,
    FEATURE: process.env.SPECSTRIDE_FEATURE,
    SECRET: process.env.STUB_SECRET,
    PROPOSER: process.env.SPECSTRIDE_PROPOSER,
    CRITIC: process.env.SPECSTRIDE_CRITIC,
    PAUSE: process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC,
    LIMITS: process.env.SPECSTRIDE_LIMITS,
    STUB_DIR: process.env.STUB_DIR,
    PROFILE: process.env.SPECSTRIDE_PROFILE,
    BP: process.env.SPECSTRIDE_COMMIT_BACKPRESSURE,
  };
  process.env.HOME = dir;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  process.env.SPECSTRIDE_FEATURE = "001-one";
  process.env.STUB_SECRET = SECRET;
  process.env.SPECSTRIDE_PROPOSER = "claude";
  process.env.SPECSTRIDE_CRITIC = "claude";
  process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = "0";
  // The bounds are the engine's defaults, as in the other engine tests.
  delete process.env.SPECSTRIDE_LIMITS;
  // THE PROFILE, not the switch: the value under `parity` (row 134, DV-121)
  // reproduces the as-is behaviour through the configuration itself.
  delete process.env.SPECSTRIDE_COMMIT_BACKPRESSURE;
  process.env.SPECSTRIDE_PROFILE = "parity";
  process.env.STUB_DIR = scratch;
  const chunks: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: unknown): boolean => {
    if (typeof chunk === "string") chunks.push(chunk);
    return originalWrite(chunk as string);
  }) as typeof process.stdout.write;
  const controlRoot = controlRootOfWorkspace(work);
  const control = (...parts: string[]): string =>
    parts[0] === "commit-gate"
      ? join(controlRoot, ...parts)
      : join(controlRoot, "features", "001-one", ...parts);
  return {
    dir: work,
    scratch,
    control,
    out: () => chunks.join(""),
    restore: () => {
      process.stdout.write = originalWrite;
      for (const chunk of chunks) originalWrite(chunk);
      process.env.HOME = before.HOME;
      process.env.PATH = before.PATH;
      for (const [name, value] of [
        ["SPECSTRIDE_FEATURE", before.FEATURE],
        ["STUB_SECRET", before.SECRET],
        ["SPECSTRIDE_PROPOSER", before.PROPOSER],
        ["SPECSTRIDE_CRITIC", before.CRITIC],
        ["SPECSTRIDE_PROPOSER_PAUSE_SEC", before.PAUSE],
        ["SPECSTRIDE_LIMITS", before.LIMITS],
        ["STUB_DIR", before.STUB_DIR],
        ["SPECSTRIDE_PROFILE", before.PROFILE],
        ["SPECSTRIDE_COMMIT_BACKPRESSURE", before.BP],
      ] as const) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** The warning line the run printed, exactly as printed, or `undefined`. */
function warningLineOf(output: string): string | undefined {
  return output
    .split("\n")
    .map((line) => line.trim())
    .find((line) => WARNING_LINE.test(line));
}

/**
 * The comparison of one fixture: the reference is the baseline's as-is reading
 * (the phase approved, the run done, exit 0, no warning), the port is what the
 * run under `parity` actually showed. The oracle's own comparator judges the
 * two captures, surface by surface, with the real waivers of the file.
 */
function compareFixture(fixtureName: string, run: ParityRun): ResultReport {
  const fixtureId = `${FIXTURE_PREFIX}${fixtureName}`;
  const context: NormalizeContext = {
    scenario: fixtureId,
    side: "port",
    roots: [],
    statePaths: {},
    durationsUnderTest: [],
    slug: "001-one",
  };
  const reference = {
    scenario: fixtureId,
    side: "reference" as const,
    surfaces: {
      exit: { exitCode: 0 },
      stderr: { [WARNING_SELECTOR]: NO_WARNING_ON_THE_BASELINE },
    },
  };
  const port = {
    scenario: fixtureId,
    side: "port" as const,
    surfaces: {
      exit: { exitCode: run.exit },
      stderr: { [WARNING_SELECTOR]: run.warning ?? NO_WARNING_ON_THE_BASELINE },
    },
  };
  const comparison = compare(reference, port, {
    fixture: fixtureId,
    referenceContext: { ...context, side: "reference" },
    portContext: context,
    waivers: OUR_WAIVERS,
  });
  return comparison.report;
}

/**
 * The gate every surface of every comparison passes through: a surface reads
 * `equal`, or `waived` on a row of the register (DV-122 here), and never
 * `different` — a `different` no register row covers fails the comparison.
 */
function assertNothingIsDifferent(fixtureId: string, report: ResultReport): void {
  for (const surface of Object.keys(report.results)) {
    const result = resultOf(report, surface);
    assert.ok(
      RESULTS.includes(result),
      `${fixtureId}/${surface}: unknown oracle result ${String(result)}`,
    );
    if (result === "different") {
      const shown = report.results[surface]?.differences ?? [];
      assert.fail(
        `${fixtureId}/${surface}: the oracle reads \`different\`, and no register row covers it: ` +
          `${JSON.stringify(shown)}`,
      );
    }
    if (result === "waived") {
      assert.equal(
        report.results[surface]?.row,
        "DV-122",
        `${fixtureId}/${surface}: the surface is waived on a row other than DV-122`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// FX-27 — the oracle's own scenario of the commits family
// ---------------------------------------------------------------------------

test("F152-SC-008: the oracle runs FX-27/commits-off (driveSide → comparePortWithGolden)", () => {
  const declaration = JSON.parse(
    readFileSync(join(FX27_FIXTURE_DIR, "fixture.json"), "utf8"),
  ) as Record<string, unknown>;
  const runRoot = mkdtempSync(join(tmpdir(), "specstride-fx27-oracle-"));
  try {
    let result: DriveResult | undefined;
    let unavailable: { side: string; reason: string } | undefined;
    try {
      result = driveSide({
        scenario: FX27_SCENARIO,
        side: "port",
        fixtureDir: FX27_FIXTURE_DIR,
        runRoot,
        fixture: declaration as Parameters<typeof driveSide>[0]["fixture"],
        implementationRoot: ROOT,
        criticStubAddress: "http://127.0.0.1:1",
      });
    } catch (error) {
      if (error instanceof SideUnavailableError) unavailable = error.unavailable;
      else throw error;
    }
    const golden = readGoldenCapture(FX27_SCENARIO);
    assert.ok(golden, "the oracle holds no golden capture of the reference for FX-27/commits-off");
    if (result === undefined) {
      // The oracle refused to drive the port: a DECLARED missing prerequisite
      // (F141-FR-037). The comparison is then the declared skip — never a
      // pass, never a difference — and the reason is the command line's.
      assert.ok(unavailable, "the driver refused the port without naming a reason");
      assert.equal(unavailable.side, "port");
      assert.match(unavailable.reason, /does not have the command `run`/);
      const skipped = comparePortWithGolden(
        { scenario: FX27_SCENARIO, side: "port", surfaces: {} },
        {
          fixture: FX27_SCENARIO,
          golden,
          portContext: {
            scenario: FX27_SCENARIO,
            side: "port",
            roots: [],
            statePaths: {},
            durationsUnderTest: [],
            slug: "commits-off",
          },
          skipped: { reason: unavailable.reason },
        },
      );
      assert.ok(skipped.report.skipped, "the skip of the report is missing");
      assert.equal(Object.keys(skipped.report.results).length, 0);
      assertNothingIsDifferent(FX27_SCENARIO, skipped.report);
      console.log(`F152-SC-008: FX-27/commits-off is a declared skip: ${unavailable.reason}`);
      return;
    }
    // The port ran: the hermetic comparison against the golden capture.
    const comparison = comparePortWithGolden(result.capture, {
      fixture: FX27_SCENARIO,
      golden,
      portContext: contextOfRun(result, { referenceRoot: ROOT, slug: "commits-off", fixture: FX27_SCENARIO }, declaration),
    });
    assertNothingIsDifferent(FX27_SCENARIO, comparison.report);
  } finally {
    rmSync(runRoot, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// The five fixtures of this feature, under the parity profile
// ---------------------------------------------------------------------------

for (const name of FIXTURES_UNDER_PARITY) {
  test(`F152-SC-008 under parity, ${name}: only DV-121 and DV-122, nothing else`, async () => {
    const fx = fixture(name);
    try {
      // DV-121 — the switch is off under the profile: the commit gate never
      // ran. No block record, no void marker, no corrective feedback anywhere
      // in the control plane, and the approval of the attempt that planted
      // stands (the as-is path honoured it).
      assert.equal(existsSync(fx.control("commit-gate")), false);
      const exit = await runFeature({ argv: [], workdir: fx.dir });
      assert.equal(existsSync(fx.control("commit-gate")), false);
      const output = fx.out();
      const warning = warningLineOf(output);
      // The oracle judges the run against the baseline's as-is reading.
      const report = compareFixture(name, { exit, warning });
      assertNothingIsDifferent(`${FIXTURE_PREFIX}${name}`, report);
      // What the comparison saw is what the run showed: the digest names the
      // exit, and the warning line is on the surface exactly where DV-122
      // puts it.
      const digest = output.split("\n").find((line) => line.includes("DIGEST")) ?? "";
      assert.match(digest, new RegExp(`DIGEST exit=${String(exit)} `));
      assert.match(digest, /commits_blocked=[0-9]+/);
      assert.equal(WARNING_LINE.test(output), warning !== undefined);
      assert.equal(report.results["exit"]?.result === "waived", exit !== 0, name);
      assert.equal(report.results["stderr"]?.result === "waived", warning !== undefined, name);
    } finally {
      fx.restore();
    }
  });
}

// ---------------------------------------------------------------------------
// The register rows and the waivers of DV-122
// ---------------------------------------------------------------------------

test("the register map holds DV-121 and DV-122, and every waiver matches a real difference (F152-SC-008)", async () => {
  // The two register rows of this feature, in the oracle's register map.
  const dv121 = REGISTER_MAP.rows.find((row) => row.row === "DV-121");
  const dv122 = REGISTER_MAP.rows.find((row) => row.row === "DV-122");
  assert.ok(dv121, "the register map holds no row DV-121");
  assert.ok(dv122, "the register map holds no row DV-122");
  assert.ok(dv121.handling.length > 0);
  assert.ok(
    dv122.handling.includes("waiver"),
    `DV-122 handling is ${dv122.handling.join(", ")} and does not say waiver`,
  );

  // Eight waivers: one per blocked-commit fixture and surface, all DV-122,
  // each accepted by the oracle's own acceptance rule.
  assert.equal(OUR_WAIVERS.length, 8, "the feature wrote not exactly eight waivers");
  for (const waiver of OUR_WAIVERS) {
    assertWaiverIsAllowed(waiver);
    assert.equal(waiver.row, "DV-122", `${waiver.fixture}/${waiver.surface} is not on DV-122`);
    assert.ok(
      (FIXTURES_UNDER_PARITY as readonly string[]).includes(
        waiver.fixture.slice(FIXTURE_PREFIX.length),
      ),
      `${waiver.fixture} names no fixture of feature 152`,
    );
  }
  const blocked = FIXTURES_UNDER_PARITY.filter((name) => name !== "ordinary-code");
  for (const name of blocked) {
    for (const surface of ["exit", "stderr"]) {
      assert.ok(
        OUR_WAIVERS.some((w) => w.fixture === `${FIXTURE_PREFIX}${name}` && w.surface === surface),
        `the blocked-commit fixture ${name} has no waiver on ${surface}`,
      );
    }
  }
  assert.equal(
    OUR_WAIVERS.filter((w) => w.fixture === `${FIXTURE_PREFIX}ordinary-code`).length,
    0,
    "ordinary-code ends 0 under parity and carries no waiver",
  );

  // Each waiver matches a difference a real parity run shows: run the oracle
  // over the fixtures again and collect the differences the runs emit.
  const emitted: Difference[] = [];
  for (const name of FIXTURES_UNDER_PARITY) {
    const fx = fixture(name);
    try {
      const exit = await runFeature({ argv: [], workdir: fx.dir });
      emitted.push(...differencesOfRun(name, { exit, warning: warningLineOf(fx.out()) }));
    } finally {
      fx.restore();
    }
  }
  const uses = useOfWaivers(OUR_WAIVERS, emitted);
  // No orphan waiver, no missing waiver (§O.5 rule 3).
  assertEveryWaiverMatchedSomething(uses);
  for (const [index, waiver] of OUR_WAIVERS.entries()) {
    assert.ok(
      (uses[index]?.matched ?? 0) === 1,
      `the waiver ${waiver.fixture}/${waiver.surface} matched ${String(uses[index]?.matched)} ` +
        `differences, not exactly the one it names`,
    );
  }
  // And no emitted difference is left uncovered by a waiver of its own.
  for (const difference of emitted) {
    const matched = OUR_WAIVERS.some((waiver) =>
      waiver.fixture === difference.fixture &&
      waiver.surface === difference.surface &&
      waiver.difference.selector === difference.selector &&
      JSON.stringify(waiver.difference.reference) === JSON.stringify(difference.reference) &&
      JSON.stringify(waiver.difference.port) === JSON.stringify(difference.port),
    );
    const plain = difference.surface === "stderr" && difference.port === NO_WARNING_ON_THE_BASELINE;
    assert.ok(
      matched || plain,
      `the difference ${difference.fixture}/${difference.surface}` +
        `/${difference.selector} is covered by no waiver of DV-122`,
    );
  }
});
