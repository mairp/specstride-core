/**
 * CT-141-144 — the self-proof (T037, T063; F141-FR-044).
 *
 * What the test proves. The live half RUNS the reference twice, through the
 * oracle's own driver, in the hermetic environment, against the scripted stubs.
 *
 * - **the reference against itself is `equal` on every surface**: FX-32
 *   `greeting-ready` on the mixture-of-loops baseline at `9c88f86` is run twice
 *   and every surface the scenario names reads `equal`; a surface that did not is
 *   a defect of the oracle and the assertion names it;
 * - **a seeded difference is `different`**: one value the other side does not have,
 *   seeded into one surface, makes THAT surface `different` and no other;
 * - **the same fixture twice gives the same normalized capture**: the two runs'
 *   normalized captures are equal, surface by surface, and a single value that
 *   differs is found and named;
 * - **the feasibility probe**: FX-02 `reject-approve` on the Specstride baseline at
 *   `9cab15d` runs three phases with one rejection, ends with exit 0 and leaves the
 *   same tree twice.
 *
 * Where no clone of a baseline is found the live half is a SKIP WITH ITS REASON
 * and never a pass (`test/reference-tree.ts`).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PROBE_EXPECTED_EXIT,
  PROBE_EXPECTED_PHASES,
  PROBE_EXPECTED_REJECTIONS,
  PROBE_SCENARIO,
  PROBE_SYSTEM,
  SELF_PROOF_COMMANDS,
  SELF_PROOF_SIDES,
  SelfProofError,
  assertTheProbeHeldUp,
  assertTheReferenceEqualsItself,
  assertTheSameFixtureTwiceIsTheSameCapture,
  assertTheSeededDifferenceIsSeen,
  contextOfRun,
  isTheSelfProof,
  parseSides,
  phasesAndRejectionsOf,
  probe,
  rootsOfRun,
  selfProof,
  selfProofOfCaptures,
  surfacesThatDiffer,
  treeOfCapture,
} from "../../src/run/self.ts";
import { resultOf } from "../../src/compare/comparator.ts";
import { seedADifference } from "../../src/run/driver.ts";
import { declarationOf, referenceTreeOf, skipReasonFor } from "../reference-tree.ts";

const PACKAGE = resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));

/** The scenario the live half of the self-proof uses: no stub, and seconds to run. */
const SELF_PROOF_FIXTURE = "FX-32/greeting-ready";
const SELF_PROOF_DIR = join(PACKAGE, "fixtures", SELF_PROOF_FIXTURE);

/** A scratch run root of its own for every run. */
const runRoot = (name: string): string => mkdtempSync(join(tmpdir(), `oracle-${name}-`));

/** What the live half needs, or the reason it cannot run. */
function liveHalf(system: string): { skip: string | false } {
  return referenceTreeOf(system) === undefined ? { skip: skipReasonFor(system) } : { skip: false };
}

const CONTEXT = {
  scenario: "FX-01/three-phases",
  side: "reference" as const,
  roots: [],
  statePaths: {},
  durationsUnderTest: [],
  slug: "three-phases",
};

const captureOf = (surfaces: Record<string, unknown>) => ({
  scenario: "FX-01/three-phases",
  side: "reference" as const,
  suite: "first" as const,
  layer: "off" as const,
  surfaces,
  missing: {},
});

test("CT-141-144: the three self-proof commands, and the sides they take", () => {
  assert.deepEqual(
    [...SELF_PROOF_COMMANDS],
    [`--sides ${SELF_PROOF_SIDES}`, "--seed-difference <surface>", "probe"],
  );
  assert.equal(SELF_PROOF_SIDES, "reference,reference");
  assert.deepEqual([...parseSides("reference,reference")], ["reference", "reference"]);
  assert.deepEqual([...parseSides("reference,port")], ["reference", "port"]);
  assert.ok(isTheSelfProof(parseSides("reference,reference")));
  assert.ok(!isTheSelfProof(parseSides("reference,port")));
  // A side that is neither is refused, and so is a list of the wrong length.
  for (const bad of ["reference", "reference,reference,reference", "reference,baseline"]) {
    assert.throws(() => parseSides(bad), SelfProofError, bad);
  }
});

test("CT-141-144: the self-proof refuses to run on anything but the reference twice", () => {
  assert.throws(
    () =>
      selfProof({
        fixture: SELF_PROOF_FIXTURE,
        fixtureDir: SELF_PROOF_DIR,
        runRoot: runRoot("sides"),
        declaration: declarationOf(SELF_PROOF_DIR) as never,
        referenceRoot: "/nonexistent",
        criticStubAddress: "http://127.0.0.1:1",
        sides: ["reference", "port"],
      }),
    (error: unknown) =>
      error instanceof SelfProofError && /names the reference on both sides/.test(error.message),
  );
});

test("CT-141-144: a comparison of no surface is never a pass", () => {
  const empty = { capture: captureOf({}), context: CONTEXT };
  assert.throws(
    () => selfProofOfCaptures(empty, empty, { fixture: "FX-01/three-phases" }),
    (error: unknown) =>
      error instanceof SelfProofError && /compared NO surface/.test(error.message),
  );
});

test("CT-141-144: the two assertions judge captures, and each refuses the other's outcome", () => {
  const side = { capture: captureOf({ exit: { exitCode: 0 } }), context: CONTEXT };
  const plain = selfProofOfCaptures(side, side, { fixture: "FX-01/three-phases" });
  assert.deepEqual([...plain.equal], ["exit"]);
  assertTheReferenceEqualsItself(plain);
  // An outcome with a seeded difference is not the proof that the reference equals
  // itself, and the proof that the reference equals itself is not a seeded one.
  const seeded = selfProofOfCaptures(side, side, {
    fixture: "FX-01/three-phases",
    seedDifference: "exit",
  });
  assert.equal(resultOf(seeded.report, "exit"), "different");
  assertTheSeededDifferenceIsSeen(seeded);
  assert.throws(() => assertTheReferenceEqualsItself(seeded), SelfProofError);
  assert.throws(() => assertTheSeededDifferenceIsSeen(plain), SelfProofError);
  // A SKIP is neither.
  const skipped = { ...plain, skipped: { reason: "the reference tree is not in scratch" } };
  assert.throws(
    () => assertTheReferenceEqualsItself(skipped),
    (error: unknown) => error instanceof SelfProofError && /never the proof/.test(error.message),
  );
  assert.throws(
    () => assertTheSeededDifferenceIsSeen({ ...skipped, seeded: "exit" }),
    SelfProofError,
  );
});

test("CT-141-144: a surface that moved with the seeded one fails the assertion", () => {
  const first = {
    capture: captureOf({ exit: { exitCode: 0 }, stdout: { text: "a" } }),
    context: CONTEXT,
  };
  const second = {
    capture: captureOf({ exit: { exitCode: 0 }, stdout: { text: "b" } }),
    context: CONTEXT,
  };
  const outcome = selfProofOfCaptures(first, second, {
    fixture: "FX-01/three-phases",
    seedDifference: "exit",
  });
  assert.throws(
    () => assertTheSeededDifferenceIsSeen(outcome),
    (error: unknown) =>
      error instanceof SelfProofError && /stdout moved as well/.test(error.message),
  );
  // And the seed is one value the other side does not have, in that surface alone.
  const seededCapture = seedADifference(captureOf({ exit: { exitCode: 0 } }) as never, "exit");
  assert.ok(
    JSON.stringify((seededCapture.surfaces as Record<string, unknown>)["exit"]).includes(
      "seededDifference",
    ),
  );
  assert.throws(() => seedADifference(captureOf({}) as never, "exit"), /holds no surface exit/);
});

test("CT-141-144: the same fixture twice gives the same normalized capture", () => {
  const side = { capture: captureOf({ exit: { exitCode: 0 } }), context: CONTEXT };
  assertTheSameFixtureTwiceIsTheSameCapture(side, side, "FX-01/three-phases");
  const other = { capture: captureOf({ exit: { exitCode: 1 } }), context: CONTEXT };
  assert.throws(
    () => assertTheSameFixtureTwiceIsTheSameCapture(side, other, "FX-01/three-phases"),
    (error: unknown) =>
      error instanceof SelfProofError &&
      /gave a different normalized capture on exit/.test(error.message) &&
      /not deterministic \(F141-SC-005\)/.test(error.message),
  );
  assert.deepEqual(
    [
      ...surfacesThatDiffer(
        { surfaces: { a: 1, b: 2 } } as never,
        { surfaces: { a: 1, b: 3 } } as never,
      ),
    ],
    ["b"],
  );
});

test("CT-141-144: what the feasibility probe wants of the reference", () => {
  assert.equal(PROBE_SCENARIO, "FX-02/reject-approve");
  assert.equal(PROBE_SYSTEM, "specstride");
  assert.equal(PROBE_EXPECTED_EXIT, 0);
  assert.equal(PROBE_EXPECTED_PHASES, 3);
  assert.equal(PROBE_EXPECTED_REJECTIONS, 1);
  // ONE rejection is one rejected ATTEMPT, which the reference announces once.
  const counted = phasesAndRejectionsOf(
    captureOf({
      stdout: {
        text: [
          "  resume   : phase 1",
          "----- proposer: phase 1 attempt 1/3 (dsh) -----",
          "----- phase 1 REJECTED on attempt 1/3 -----",
          "These are not met: T001.",
          "VERDICT 0123456789abcdef: REJECTED",
          "----- critic: phase 2 attempt 1 (claude) -----",
          "----- critic: phase 3 attempt 1 (claude) -----",
        ].join("\n"),
      },
    }) as never,
  );
  assert.equal(counted.phases, 3);
  assert.equal(counted.rejections, 1);
  // A probe that did not run is a skip with its reason and never a pass.
  assert.throws(
    () =>
      assertTheProbeHeldUp({
        scenario: PROBE_SCENARIO,
        system: PROBE_SYSTEM,
        ran: false,
        skipped: { reason: "no clone of the Specstride baseline" },
      }),
    (error: unknown) => error instanceof SelfProofError && /never a pass/.test(error.message),
  );
  assert.equal(treeOfCapture(captureOf({ tree: { entries: [] } }) as never), '{"entries":[]}');
});

// ---------------------------------------------------------------------------
// The live half: the reference, twice
// ---------------------------------------------------------------------------

test(
  "CT-141-144: the reference against itself is `equal` on every surface (live)",
  liveHalf("mixture-of-loops"),
  () => {
    const tree = referenceTreeOf("mixture-of-loops");
    assert.ok(tree !== undefined);
    const declaration = declarationOf(SELF_PROOF_DIR);
    const base = {
      fixture: SELF_PROOF_FIXTURE,
      fixtureDir: SELF_PROOF_DIR,
      declaration: declaration as never,
      referenceRoot: tree.root,
      criticStubAddress: "http://127.0.0.1:1",
      slug: "001-greeting",
    };
    const outcome = selfProof({ ...base, runRoot: runRoot("self") });
    assertTheReferenceEqualsItself(outcome);
    // Every surface the scenario names was compared, and every one reads `equal`.
    assert.deepEqual([...outcome.equal].sort(), [...(declaration["surfaces"] as string[])].sort());
    assert.deepEqual([...outcome.notEqual], []);
    assert.equal(outcome.skipped, undefined);

    // One seeded value makes THAT surface `different` and no other. The two captures
    // of the run above are what each of the five is judged from.
    const judged = outcome.captures;
    assert.ok(judged !== undefined);
    for (const surface of declaration["surfaces"] as string[]) {
      const seeded = selfProofOfCaptures(judged[0], judged[1], {
        fixture: SELF_PROOF_FIXTURE,
        seedDifference: surface,
      });
      assertTheSeededDifferenceIsSeen(seeded);
      assert.deepEqual([...seeded.notEqual], [surface]);
    }
    // And `--seed-difference` as the COMMAND — which re-drives the reference — is
    // shown to give the same answer on one surface, so the two paths agree.
    const asTheCommandRunsIt = selfProof({
      ...base,
      runRoot: runRoot("seed"),
      seedDifference: "stdout",
    });
    assertTheSeededDifferenceIsSeen(asTheCommandRunsIt);
    assert.deepEqual([...asTheCommandRunsIt.notEqual], ["stdout"]);
  },
);

test(
  "CT-141-144: FX-01 `three-phases` — the reference on both sides, every surface (live)",
  liveHalf("specstride"),
  () => {
    // The independent test of this phase: FX-01 `three-phases` with the REFERENCE on
    // both sides is `equal` on every surface, and one seeded value gives `different`
    // on that surface. The scenario drives the whole loop of the Specstride baseline
    // at `9cab15d` — three phases, the proposer stub over the dsh command line and
    // the critic stub over HTTP — so this is the oracle end to end.
    const tree = referenceTreeOf("specstride");
    assert.ok(tree !== undefined);
    const fixture = "FX-01/three-phases";
    const dir = join(PACKAGE, "fixtures", fixture);
    const declaration = declarationOf(dir);
    const base = {
      fixture,
      fixtureDir: dir,
      declaration: declaration as never,
      referenceRoot: tree.root,
      criticStubAddress: "http://127.0.0.1:1",
      slug: "three-phases",
    };
    const outcome = selfProof({ ...base, runRoot: runRoot("fx01") });
    assertTheReferenceEqualsItself(outcome);
    assert.deepEqual([...outcome.equal].sort(), [...(declaration["surfaces"] as string[])].sort());
    assert.equal(outcome.equal.length, 9);
    // The run really ran the loop: exit 0 and three approved phases.
    const exit = outcome.comparison.normalized.reference.surfaces["exit"] as {
      exitCode: number;
    };
    assert.equal(exit.exitCode, declaration["expectedExit"]);
    const counted = phasesAndRejectionsOf({
      scenario: fixture,
      side: "reference",
      suite: "first",
      surfaces: outcome.comparison.normalized.reference.surfaces,
    } as never);
    assert.equal(counted.phases, 3);
    assert.equal(counted.rejections, 0);

    // One seeded value, on each of the nine surfaces in turn: `different` on that
    // surface and `equal` on the other eight. The seed is a value added to a
    // CAPTURE, so the two captures of the run above are what every one of the nine is
    // judged from: `selfProofOfCaptures` is the whole of `--seed-difference` once the
    // runs are done, and re-driving the reference eighteen more times would compare
    // the same bytes again at ten times the cost.
    const judged = outcome.captures;
    assert.ok(judged !== undefined, "the outcome carries the two captures it judged");
    for (const surface of declaration["surfaces"] as string[]) {
      const seeded = selfProofOfCaptures(judged[0], judged[1], {
        fixture,
        seedDifference: surface,
      });
      assertTheSeededDifferenceIsSeen(seeded);
      assert.deepEqual([...seeded.notEqual], [surface]);
      assert.equal(seeded.equal.length, 8);
    }
  },
);

test(
  "CT-141-144: the same fixture twice gives the same normalized capture (live)",
  liveHalf("mixture-of-loops"),
  () => {
    const tree = referenceTreeOf("mixture-of-loops");
    assert.ok(tree !== undefined);
    const outcome = selfProof({
      fixture: SELF_PROOF_FIXTURE,
      fixtureDir: SELF_PROOF_DIR,
      declaration: declarationOf(SELF_PROOF_DIR) as never,
      referenceRoot: tree.root,
      criticStubAddress: "http://127.0.0.1:1",
      slug: "001-greeting",
      runRoot: runRoot("twice"),
    });
    // The two runs of the self-proof ARE the same fixture twice: the comparison is
    // of their normalized captures, and the roots of each run are its own.
    assert.deepEqual(
      [
        ...surfacesThatDiffer(
          outcome.comparison.normalized.reference,
          outcome.comparison.normalized.port,
        ),
      ],
      [],
    );
    assert.deepEqual([...outcome.notEqual], []);
  },
);

test("CT-141-144: the feasibility probe (live)", liveHalf("specstride"), () => {
  const tree = referenceTreeOf("specstride");
  assert.ok(tree !== undefined);
  const dir = join(PACKAGE, "fixtures", PROBE_SCENARIO);
  const outcome = probe({
    fixture: PROBE_SCENARIO,
    fixtureDir: dir,
    declaration: declarationOf(dir) as never,
    referenceRoot: tree.root,
    criticStubAddress: "http://127.0.0.1:1",
    slug: "reject-approve",
    runRoot: runRoot("probe"),
  });
  assertTheProbeHeldUp(outcome);
  assert.equal(outcome.ran, true);
  assert.equal(outcome.exitCode, PROBE_EXPECTED_EXIT);
  assert.equal(outcome.phases, PROBE_EXPECTED_PHASES);
  assert.equal(outcome.rejections, PROBE_EXPECTED_REJECTIONS);
  assert.equal(outcome.sameTreeTwice, true);
  assert.equal(outcome.trees?.[0], outcome.trees?.[1]);
});

test("CT-141-144: the roots and the context of one run come from the run itself", () => {
  const result = {
    workdir: "/tmp/run/work",
    runRoot: "/tmp/run",
    env: { HOME: "/tmp/run/home", TMPDIR: "/tmp/run/tmp" },
    statePaths: { "<a>": "/tmp/run/state/a" },
    fixtureDir: "/tmp/fixtures/FX-01/three-phases",
  };
  const roots = rootsOfRun(result as never, "/tmp/ref");
  // Seven roots, in this order. `<FIXTURE>` and `<ORACLE>` were added in phase 6:
  // the reference resolves the real path of a verification command it ran before it
  // writes the name down, so the capture carries the path of this checkout. The
  // order matters, and `rootsLongestFirst` keeps the longer of two nested roots
  // first (`<FIXTURE>` lies under `<ORACLE>`).
  assert.deepEqual(
    roots.map((r) => r.placeholder),
    ["<WORK>", "<RUN>", "<IMPL>", "<HOME>", "<TMP>", "<FIXTURE>", "<ORACLE>"],
  );
  // Every root carries the path the run itself gave, and none is empty.
  assert.equal(roots.find((r) => r.placeholder === "<FIXTURE>")?.path, result.fixtureDir);
  for (const root of roots) assert.ok((root.path?.length ?? 0) > 0, root.placeholder);
  const context = contextOfRun(
    result as never,
    { referenceRoot: "/tmp/ref", slug: "s", fixture: "FX-01/three-phases" },
    { durationsUnderTest: ["1800s"] },
  );
  assert.equal(context.scenario, "FX-01/three-phases");
  assert.deepEqual([...context.durationsUnderTest], ["1800s"]);
  assert.deepEqual(context.statePaths, result.statePaths);
});
