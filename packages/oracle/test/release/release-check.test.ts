/**
 * CT-141-126 — the release condition (T065, T073; F141-FR-026, F141-FR-036).
 *
 * One check says whether a release may go out, and when it says `blocked` it NAMES
 * the cause. Every clause of F141-FR-026 is exercised on its own, against a set of
 * inputs that otherwise lets the release through, so each test shows that ONE fact
 * blocks and which cause the check names for it:
 *
 * | Clause | Cause named |
 * |---|---|
 * | any fixture surface reads `different` | `a surface reads different` |
 * | any self-check of the oracle fails | `a self-check of the oracle failed` |
 * | any parity test of any feature fails | `a parity test of a feature failed` |
 * | … or is skipped | `a parity test of a feature is a skip` |
 * | the second suite fails | `the second suite failed` |
 * | the live differential run has not passed on the build | `the live differential run has not passed on this build` |
 * | no macOS runner has passed (F141-FR-036) | `no macOS runner has passed the oracle` |
 * | the fixtures of dsh, Codex and prime are inside the condition | `a fixture of dsh, Codex or prime is not in the condition` |
 *
 * The fixtures of the three harnesses are read from the CATALOGUE, so "No behaviour
 * item MUST be left out because its harness was planned for a later wave" is checked
 * against the forty families and not against a list in this test.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CAUSES,
  HARNESSES_INSIDE_THE_CONDITION,
  RELEASE_INPUTS,
  ReleaseCheckError,
  causesOfKind,
  exitCodeOfReleaseCheck,
  fixturesOfTheThreeHarnesses,
  harnessesNotInTheCondition,
  namesTheCause,
  releaseCheck,
  type Cause,
  type ReleaseInputs,
} from "../../src/release/release-check.ts";
import { RESULT_SCHEMA_ID, type ResultReport } from "../../src/compare/comparator.ts";
import { activeFamilyIds } from "../../src/catalogue/catalogue.ts";
import type { MacosRunRecord } from "../../src/release/per-os.ts";

const BUILD = "d".repeat(40);

/** A report of one scenario in which every surface reads `equal`. */
const equalReport = (
  fixture: string,
  surfaces: readonly string[] = ["exit", "stdout"],
): ResultReport => ({
  schema: RESULT_SCHEMA_ID,
  suite: "first",
  tier: "reference",
  fixture,
  results: Object.fromEntries(surfaces.map((surface) => [surface, { result: "equal" as const }])),
  replacements: { "N-01": 1 },
});

/** The record of a macOS runner that passed on this build. */
const platformRun: MacosRunRecord = {
  task: "T067",
  requirement: "F141-FR-036",
  build: BUILD,
  runner: "macos-14 arm64",
  expectationsThatHeld: ["workspace lock"],
  expectationsThatDidNot: [],
  passed: true,
};

/**
 * Inputs that let a release through: one scenario of each of dsh, Codex and prime
 * (so the condition has them inside), a second suite that passed, a live run on this
 * build and a macOS runner that passed.
 */
function inputsThatPass(over: Partial<ReleaseInputs> = {}): ReleaseInputs {
  const byHarness = fixturesOfTheThreeHarnesses();
  const firstSuite = [
    equalReport("FX-01/three-phases"),
    ...HARNESSES_INSIDE_THE_CONDITION.map((harness) =>
      equalReport(byHarness[harness][0] as string),
    ),
  ];
  return {
    build: BUILD,
    firstSuite,
    secondSuite: {
      passed: true,
      outsideTheAllowlist: [],
      entriesThatMatchedNothing: [],
      countersAreEqual: true,
    },
    parityTests: [{ name: "PT-141-011SC008-greeting-fixtures", feature: "141", outcome: "passed" }],
    selfChecks: [{ name: "the reference against itself", passed: true }],
    liveRun: { build: BUILD, platform: "linux", passed: true, confirmed: ["FX-01/three-phases"] },
    platformRun,
    ...over,
  };
}

/** The one cause a set of inputs blocks on, asserted to be the only one. */
function blocksOnlyOn(inputs: ReleaseInputs, cause: Cause): void {
  const decision = releaseCheck(inputs);
  assert.equal(decision.blocked, true, decision.lines.join("\n"));
  assert.equal(exitCodeOfReleaseCheck(decision), 1);
  assert.deepEqual(
    [...new Set(decision.causes.map((held) => held.cause))],
    [cause],
    decision.lines.join("\n"),
  );
  assert.ok(namesTheCause(decision, cause));
  assert.ok(causesOfKind(decision, cause).length > 0);
  // The cause names its requirement and what it is about.
  for (const held of causesOfKind(decision, cause)) {
    assert.ok(/^F141-FR-0\d\d$/.test(held.requirement), held.requirement);
    assert.ok(held.subject.length > 0);
    assert.ok(held.detail.length > 0);
  }
}

test("CT-141-126: the five sources the release check reads", () => {
  assert.deepEqual(
    [...RELEASE_INPUTS],
    [
      "the first suite",
      "the second suite",
      "the parity tests of every feature",
      "the live differential run",
      "the platform run",
    ],
  );
  assert.equal(CAUSES.length, 9);
});

test("CT-141-126: with every source passing, the release may go out", () => {
  const decision = releaseCheck(inputsThatPass());
  assert.equal(decision.blocked, false, decision.lines.join("\n"));
  assert.deepEqual([...decision.causes], []);
  assert.equal(exitCodeOfReleaseCheck(decision), 0);
  assert.match(decision.lines[0] as string, /the release may go out/);
});

test("CT-141-126: blocked while any fixture surface reads `different`", () => {
  const byHarness = fixturesOfTheThreeHarnesses();
  const different: ResultReport = {
    ...equalReport("FX-01/three-phases"),
    results: {
      exit: { result: "equal" },
      stdout: {
        result: "different",
        differences: [
          {
            fixture: "FX-01/three-phases",
            surface: "stdout",
            selector: "line 4",
            reference: "a",
            port: "b",
          },
        ],
      },
    },
  };
  const inputs = inputsThatPass({
    firstSuite: [
      different,
      ...HARNESSES_INSIDE_THE_CONDITION.map((harness) =>
        equalReport(byHarness[harness][0] as string),
      ),
    ],
  });
  blocksOnlyOn(inputs, "a surface reads different");
  const decision = releaseCheck(inputs);
  const cause = causesOfKind(decision, "a surface reads different")[0];
  assert.equal(cause?.subject, "FX-01/three-phases / stdout");
  assert.match(String(cause?.detail), /line 4/);
  // A `waived` surface does not block: that is what a waiver is for.
  const waived = inputsThatPass({
    firstSuite: [
      {
        ...equalReport("FX-01/three-phases"),
        results: { exit: { result: "waived", row: "DV-001" } },
      },
      ...HARNESSES_INSIDE_THE_CONDITION.map((harness) =>
        equalReport(byHarness[harness][0] as string),
      ),
    ],
  });
  assert.equal(releaseCheck(waived).blocked, false);
});

test("CT-141-126: blocked while a scenario of the suite is a skip, or compared nothing", () => {
  const byHarness = fixturesOfTheThreeHarnesses();
  const others = HARNESSES_INSIDE_THE_CONDITION.map((harness) =>
    equalReport(byHarness[harness][0] as string),
  );
  const skipped = inputsThatPass({
    firstSuite: [
      {
        ...equalReport("FX-01/three-phases"),
        results: {},
        skipped: { reason: "prerequisite missing: the product has no such command" },
      },
      ...others,
    ],
  });
  blocksOnlyOn(skipped, "a surface is a skip");
  assert.match(
    String(causesOfKind(releaseCheck(skipped), "a surface is a skip")[0]?.detail),
    /at the release check a skip blocks/,
  );
  // A report with no result and no reason compared nothing, and that blocks too.
  const nothing = inputsThatPass({
    firstSuite: [{ ...equalReport("FX-01/three-phases"), results: {} }, ...others],
  });
  blocksOnlyOn(nothing, "a surface is a skip");
  assert.match(
    String(causesOfKind(releaseCheck(nothing), "a surface is a skip")[0]?.detail),
    /holds no result for any surface/,
  );
});

test("CT-141-126: blocked while a self-check of the oracle fails", () => {
  blocksOnlyOn(
    inputsThatPass({
      selfChecks: [
        { name: "the reference against itself", passed: true },
        { name: "a seeded difference is seen", passed: false, reason: "stdout read `equal`" },
      ],
    }),
    "a self-check of the oracle failed",
  );
  const decision = releaseCheck(
    inputsThatPass({
      selfChecks: [{ name: "the feasibility probe", passed: false, reason: "exit 1" }],
    }),
  );
  assert.equal(
    causesOfKind(decision, "a self-check of the oracle failed")[0]?.subject,
    "the feasibility probe",
  );
});

test("CT-141-126: blocked while a parity test of any feature FAILS", () => {
  blocksOnlyOn(
    inputsThatPass({
      parityTests: [
        { name: "PT-141-011SC008-greeting-fixtures", feature: "141", outcome: "passed" },
        {
          name: "PT-130-014SC003-plugin-request",
          feature: "130",
          outcome: "failed",
          reason: "the surface `state` read `different`",
        },
      ],
    }),
    "a parity test of a feature failed",
  );
});

test("CT-141-126: blocked while a parity test of any feature is SKIPPED", () => {
  const inputs = inputsThatPass({
    parityTests: [
      {
        name: "PT-131-002SC001-codex-stream",
        feature: "131",
        outcome: "skipped",
        reason: "no clone of the baseline was found",
      },
    ],
  });
  blocksOnlyOn(inputs, "a parity test of a feature is a skip");
  assert.match(
    String(causesOfKind(releaseCheck(inputs), "a parity test of a feature is a skip")[0]?.detail),
    /a skipped parity test counts as a failure/,
  );
});

test("CT-141-126: blocked while the second suite fails, and while it left no report", () => {
  blocksOnlyOn(
    inputsThatPass({
      secondSuite: {
        passed: false,
        outsideTheAllowlist: ["FX-01/three-phases / events-primary / loop.extra"],
        entriesThatMatchedNothing: [],
        countersAreEqual: true,
      },
    }),
    "the second suite failed",
  );
  const decision = releaseCheck(
    inputsThatPass({
      secondSuite: {
        passed: false,
        outsideTheAllowlist: ["FX-01/three-phases / events-primary / loop.extra"],
        entriesThatMatchedNothing: [],
        countersAreEqual: true,
      },
    }),
  );
  assert.match(
    String(causesOfKind(decision, "the second suite failed")[0]?.detail),
    /possible breach of gate integrity/,
  );
  // An allowlist entry that matched nothing fails the suite (F141-FR-040).
  assert.match(
    String(
      causesOfKind(
        releaseCheck(
          inputsThatPass({
            secondSuite: {
              passed: false,
              outsideTheAllowlist: [],
              entriesThatMatchedNothing: ["DV-016 / events-primary / strategy.selected"],
              countersAreEqual: true,
            },
          }),
        ),
        "the second suite failed",
      )[0]?.detail,
    ),
    /matched nothing/,
  );
  // The counter assertion of F141-FR-041.
  blocksOnlyOn(
    inputsThatPass({
      secondSuite: {
        passed: true,
        outsideTheAllowlist: [],
        entriesThatMatchedNothing: [],
        countersAreEqual: false,
      },
    }),
    "the second suite failed",
  );
  // No report at all is not a pass.
  blocksOnlyOn(inputsThatPass({ secondSuite: undefined }), "the second suite failed");
});

test("CT-141-126: blocked while the live differential run has not passed on the build to be released", () => {
  // No report of a live run.
  blocksOnlyOn(
    inputsThatPass({ liveRun: undefined }),
    "the live differential run has not passed on this build",
  );
  // A live run that failed.
  blocksOnlyOn(
    inputsThatPass({
      liveRun: {
        build: BUILD,
        platform: "linux",
        passed: false,
        confirmed: [],
        reason: "FX-01/three-phases / tree read `different`",
      },
    }),
    "the live differential run has not passed on this build",
  );
  // A live run of ANOTHER build.
  const otherBuild = inputsThatPass({
    liveRun: { build: "e".repeat(40), platform: "linux", passed: true, confirmed: [] },
  });
  const decision = releaseCheck(otherBuild);
  assert.ok(namesTheCause(decision, "the live differential run has not passed on this build"));
  assert.match(
    String(
      causesOfKind(decision, "the live differential run has not passed on this build")[0]?.detail,
    ),
    /the build TO BE RELEASED/,
  );
});

test("CT-141-126: blocked while no macOS runner has passed the oracle, and it says macOS is `unverified`", () => {
  const inputs = inputsThatPass({ platformRun: undefined });
  blocksOnlyOn(inputs, "no macOS runner has passed the oracle");
  const decision = releaseCheck(inputs);
  assert.match(decision.macos, /no runner has passed the parity oracle/);
  assert.match(decision.macos, /stays `unverified`/);
  assert.ok(decision.lines.some((line) => /unverified/.test(line)));
  // A macOS run of another build does not satisfy it either.
  blocksOnlyOn(
    inputsThatPass({ platformRun: { ...platformRun, build: "f".repeat(40) } }),
    "no macOS runner has passed the oracle",
  );
  // A macOS run that did not pass does not satisfy it.
  blocksOnlyOn(
    inputsThatPass({ platformRun: { ...platformRun, passed: false } }),
    "no macOS runner has passed the oracle",
  );
});

test("CT-141-126: the fixtures of dsh, Codex and prime are inside the condition", () => {
  const byHarness = fixturesOfTheThreeHarnesses();
  for (const harness of HARNESSES_INSIDE_THE_CONDITION) {
    assert.ok(byHarness[harness].length > 0, `the catalogue holds scenarios of ${harness}`);
    // Every one of them names a family of the catalogue.
    for (const fixture of byHarness[harness]) {
      assert.ok(activeFamilyIds().includes(fixture.split("/")[0] as string), fixture);
    }
  }
  // A suite that reports nothing of one harness blocks, and the cause names it.
  for (const harness of HARNESSES_INSIDE_THE_CONDITION) {
    const withoutIt = inputsThatPass({
      firstSuite: [
        equalReport("FX-01/three-phases"),
        ...HARNESSES_INSIDE_THE_CONDITION.filter((held) => held !== harness).map((held) =>
          equalReport(byHarness[held][0] as string),
        ),
      ],
    });
    const decision = releaseCheck(withoutIt);
    assert.ok(decision.blocked, harness);
    const causes = causesOfKind(
      decision,
      "a fixture of dsh, Codex or prime is not in the condition",
    );
    assert.deepEqual(
      causes.map((cause) => cause.subject),
      [harness],
      `only ${harness} is reported missing`,
    );
    assert.match(
      String(causes[0]?.detail),
      /No behaviour item is left out because its harness was planned for a later wave/,
    );
  }
  // And read on its own.
  assert.deepEqual(
    harnessesNotInTheCondition([]).map((cause) => cause.subject),
    [...HARNESSES_INSIDE_THE_CONDITION],
  );
  assert.equal(harnessesNotInTheCondition(inputsThatPass().firstSuite).length, 0);
  assert.ok(ReleaseCheckError.prototype instanceof Error);
});

test("CT-141-126: every cause the check can name is reachable, and the lines name all of them at once", () => {
  const everything = releaseCheck({
    build: BUILD,
    firstSuite: [
      {
        ...equalReport("FX-01/three-phases"),
        results: { stdout: { result: "different" } },
      },
      { ...equalReport("FX-02/reject-approve"), results: {}, skipped: { reason: "no clone" } },
    ],
    secondSuite: undefined,
    parityTests: [
      { name: "PT-A", feature: "100", outcome: "failed" },
      { name: "PT-B", feature: "108", outcome: "skipped" },
    ],
    selfChecks: [{ name: "the probe", passed: false }],
    liveRun: undefined,
    platformRun: undefined,
  });
  assert.ok(everything.blocked);
  const named = new Set(everything.causes.map((cause) => cause.cause));
  for (const cause of CAUSES) {
    assert.ok(named.has(cause), `the check can name \`${cause}\``);
  }
  // Every cause is on a line of its own, and the summary counts them.
  assert.match(
    everything.lines[0] as string,
    new RegExp(`BLOCKED — ${everything.causes.length} cause`),
  );
  assert.equal(everything.lines.length, everything.causes.length + 2);
});
