/**
 * T063 — the self-proof of the oracle (F141-FR-044).
 *
 * Before the oracle may say anything about the port it has to say something true
 * about itself. Three commands do that, and nothing else in the oracle may stand
 * in for them:
 *
 * - `--sides reference,reference` — the reference compared WITH ITSELF. Every
 *   surface the scenario names must read `equal`. A rule that deletes a real
 *   difference, a capture that is not taken after the run ended, a comparator
 *   that compares nothing: each of them shows up here as a surface that is not
 *   `equal`, or as a comparison with no surface at all.
 * - `--seed-difference <surface>` — the same run with ONE byte put into ONE
 *   surface of the capture. That surface must read `different` and no other
 *   surface may move (F141-SC-004). The seed is applied to the CAPTURE, never to
 *   a run: a run of the reference is never altered to make a check pass.
 * - `probe` — the feasibility probe. The Specstride reference runs three phases
 *   with one rejection against the stubs, ends with exit 0, and leaves the same
 *   tree twice. It is the cheapest proof that the reference side works at all.
 *
 * Determinism is proved by the same shape: the same fixture run twice on the
 * same side gives the same normalized capture (F141-SC-005).
 *
 * Every function here is split in two: a part that drives a side, and a part
 * that judges captures. The judging part takes captures and nothing else, so the
 * self-proof can be checked without a reference tree in scratch, and a missing
 * reference tree is a SKIP WITH ITS REASON and never a pass (F141-FR-026).
 */
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { type Capture } from "../capture/index.ts";
import { ORACLE_ROOT } from "../index.ts";
import {
  compare,
  nothingIsDifferent,
  resultOf,
  type Comparison,
  type ResultReport,
} from "../compare/comparator.ts";
import { type FixtureDeclaration } from "../catalogue/fixture.ts";
import { normalize, type NormalizedCapture } from "../normalize/index.ts";
import { type NormalizeContext } from "../normalize/types.ts";
import {
  driveSide,
  implementationFilesOf,
  seedADifference,
  sideIsAvailable,
  stepsOf,
  type DriveResult,
} from "./driver.ts";

/** The two sides of the self-proof, in the form the command line names them. */
export const SELF_PROOF_SIDES = "reference,reference" as const;

/** The three commands of the self-proof, exactly as the quickstart names them. */
export const SELF_PROOF_COMMANDS = [
  "--sides reference,reference",
  "--seed-difference <surface>",
  "probe",
] as const;

/** The scenario the feasibility probe runs: three phases with one rejection. */
export const PROBE_SCENARIO = "FX-02/reject-approve" as const;

/** The system the feasibility probe exercises. */
export const PROBE_SYSTEM = "specstride" as const;

/** What the probe demands of the reference. */
export const PROBE_EXPECTED_EXIT = 0 as const;
export const PROBE_EXPECTED_PHASES = 3 as const;
export const PROBE_EXPECTED_REJECTIONS = 1 as const;

/** A self-proof that did not hold up. */
export class SelfProofError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SelfProofError";
  }
}

/** The two sides a run was asked for; only the self-proof names the same side twice. */
export type Sides = readonly ["reference" | "port", "reference" | "port"];

/**
 * `--sides reference,reference` as the command line writes it. Exactly two sides,
 * each `reference` or `port`; anything else is refused rather than guessed at.
 */
export function parseSides(value: string): Sides {
  const parts = value.split(",").map((p) => p.trim());
  if (parts.length !== 2) {
    throw new SelfProofError(
      `--sides takes two sides separated by a comma, as in --sides ${SELF_PROOF_SIDES}; ` +
        `it was given "${value}"`,
    );
  }
  for (const part of parts) {
    if (part !== "reference" && part !== "port") {
      throw new SelfProofError(
        `a side is "reference" or "port"; "${part}" is neither (--sides ${value})`,
      );
    }
  }
  return Object.freeze([parts[0], parts[1]] as ["reference" | "port", "reference" | "port"]);
}

/** True when both sides name the reference: the self-proof of F141-FR-044. */
export function isTheSelfProof(sides: Sides): boolean {
  return sides[0] === "reference" && sides[1] === "reference";
}

/** What one side of the self-proof was captured with. */
export type SideOfTheSelfProof = {
  readonly capture: Capture;
  readonly context: NormalizeContext;
};

/** What the self-proof found. */
export type SelfProofOutcome = {
  readonly fixture: string;
  readonly sides: Sides;
  readonly comparison: Comparison;
  readonly report: ResultReport;
  /** The surfaces that read `equal`, and those that did not. */
  readonly equal: readonly string[];
  readonly notEqual: readonly string[];
  /** The surface a difference was seeded in, where one was. */
  readonly seeded?: string;
  /** Set where a side could not be run at all; the outcome is then a skip. */
  readonly skipped?: { readonly reason: string };
  /**
   * The two captures that were judged. A seeded difference is a value added to a
   * CAPTURE, so a caller that has already run the reference twice can judge the same
   * pair again, once per surface, through `selfProofOfCaptures` — which is the whole
   * of `--seed-difference` once the runs are done.
   */
  readonly captures?: readonly [SideOfTheSelfProof, SideOfTheSelfProof];
};

/**
 * Judge two captures of the SAME side against each other. This is the whole of
 * `--sides reference,reference` and of `--seed-difference` once the runs are
 * done, and it takes captures and nothing else.
 */
export function selfProofOfCaptures(
  first: SideOfTheSelfProof,
  second: SideOfTheSelfProof,
  options: {
    readonly fixture: string;
    readonly sides?: Sides;
    readonly seedDifference?: string;
    readonly suite?: "first" | "second";
    readonly tier?: "hermetic" | "reference" | "platform";
  },
): SelfProofOutcome {
  const sides = options.sides ?? (Object.freeze(["reference", "reference"]) as Sides);
  const secondCapture =
    options.seedDifference === undefined
      ? second.capture
      : seedADifference(second.capture, options.seedDifference);
  const comparison = compare(first.capture, secondCapture, {
    fixture: options.fixture,
    ...(options.suite === undefined ? {} : { suite: options.suite }),
    ...(options.tier === undefined ? {} : { tier: options.tier }),
    referenceContext: first.context,
    portContext: second.context,
  });
  const names = Object.keys(comparison.report.results);
  if (names.length === 0) {
    throw new SelfProofError(
      `the self-proof of ${options.fixture} compared NO surface; a comparison with no surface is ` +
        `never a pass (F141-FR-044)`,
    );
  }
  const equal = names.filter((s) => resultOf(comparison.report, s) === "equal");
  const notEqual = names.filter((s) => resultOf(comparison.report, s) !== "equal");
  return Object.freeze({
    fixture: options.fixture,
    sides,
    comparison,
    report: comparison.report,
    equal: Object.freeze(equal),
    notEqual: Object.freeze(notEqual),
    captures: Object.freeze([first, second]) as readonly [SideOfTheSelfProof, SideOfTheSelfProof],
    ...(options.seedDifference === undefined ? {} : { seeded: options.seedDifference }),
  });
}

/**
 * The reference against itself is `equal` on EVERY surface the scenario names.
 * Anything else is a defect of the oracle, not of the port (F141-FR-044).
 */
export function assertTheReferenceEqualsItself(outcome: SelfProofOutcome): void {
  if (outcome.skipped !== undefined) {
    throw new SelfProofError(
      `the self-proof of ${outcome.fixture} did not run: ${outcome.skipped.reason}. A skip is a ` +
        `skip with its reason and never the proof that the reference equals itself (F141-FR-026, ` +
        `F141-FR-044)`,
    );
  }
  if (outcome.equal.length === 0 && outcome.notEqual.length === 0) {
    throw new SelfProofError(
      `the self-proof of ${outcome.fixture} judged NO surface; a comparison with no surface is ` +
        `never a pass (F141-FR-044)`,
    );
  }
  if (outcome.seeded !== undefined) {
    throw new SelfProofError(
      `the outcome of ${outcome.fixture} had a difference seeded in ${outcome.seeded}; it cannot ` +
        `also be the proof that the reference equals itself`,
    );
  }
  if (outcome.notEqual.length > 0) {
    throw new SelfProofError(
      `the reference compared with itself must be equal on every surface of ${outcome.fixture}; ` +
        `${outcome.notEqual.join(", ")} ${outcome.notEqual.length === 1 ? "is" : "are"} not ` +
        `(F141-FR-044)`,
    );
  }
}

/**
 * A seeded difference shows up on THAT surface and on no other (F141-SC-004).
 * One byte is enough: if the surface still reads `equal`, a rule or the
 * comparator is deleting a real difference.
 */
export function assertTheSeededDifferenceIsSeen(outcome: SelfProofOutcome): void {
  if (outcome.skipped !== undefined) {
    throw new SelfProofError(
      `the seeded difference of ${outcome.fixture} was never run: ${outcome.skipped.reason}. A ` +
        `skip is never the proof that a seeded difference is seen (F141-FR-044)`,
    );
  }
  const surface = outcome.seeded;
  if (surface === undefined) {
    throw new SelfProofError(
      `the outcome of ${outcome.fixture} had no difference seeded in it, so there is nothing to see`,
    );
  }
  if (resultOf(outcome.report, surface) !== "different") {
    throw new SelfProofError(
      `a difference was seeded in ${surface} of ${outcome.fixture} and the comparator called it ` +
        `${resultOf(outcome.report, surface)}; a seeded difference is always different ` +
        `(F141-FR-044, F141-SC-004)`,
    );
  }
  const moved = outcome.notEqual.filter((s) => s !== surface);
  if (moved.length > 0) {
    throw new SelfProofError(
      `a difference was seeded in ${surface} alone; ${moved.join(", ")} moved as well, so the ` +
        `surfaces are not kept apart (F141-SC-004)`,
    );
  }
}

/** The surfaces on which two normalized captures of the same side disagree. */
export function surfacesThatDiffer(
  first: NormalizedCapture,
  second: NormalizedCapture,
): readonly string[] {
  const names = [
    ...new Set([...Object.keys(first.surfaces), ...Object.keys(second.surfaces)]),
  ].sort();
  return Object.freeze(
    names.filter(
      (name) =>
        JSON.stringify(first.surfaces[name] ?? null) !==
        JSON.stringify(second.surfaces[name] ?? null),
    ),
  );
}

/**
 * The same fixture twice gives the same normalized capture (F141-SC-005). The
 * two captures are normalized with the context of their own run, so a run root
 * that changes between the runs is not what is being compared.
 */
export function assertTheSameFixtureTwiceIsTheSameCapture(
  first: SideOfTheSelfProof,
  second: SideOfTheSelfProof,
  fixture: string,
): void {
  const a = normalize(first.capture, first.context);
  const b = normalize(second.capture, second.context);
  const differ = surfacesThatDiffer(a, b);
  if (differ.length > 0) {
    throw new SelfProofError(
      `${fixture} run twice on the same side gave a different normalized capture on ` +
        `${differ.join(", ")}; the oracle is not deterministic (F141-SC-005)`,
    );
  }
}

/** What the self-proof needs in order to run the reference twice. */
export type SelfProofRunOptions = {
  readonly fixture: string;
  readonly fixtureDir: string;
  readonly runRoot: string;
  readonly declaration: FixtureDeclaration & Readonly<Record<string, unknown>>;
  /** The read-only reference tree in scratch. */
  readonly referenceRoot: string;
  readonly criticStubAddress: string;
  readonly slug?: string;
  readonly engineStub?: string;
  readonly seedDifference?: string;
  readonly sides?: Sides;
};

/** The roots of one run, as N-01 needs them. */
export function rootsOfRun(
  result: DriveResult,
  referenceRoot: string,
  engineRoot?: string,
): NormalizeContext["roots"] {
  return Object.freeze([
    { placeholder: "<WORK>", path: result.workdir },
    { placeholder: "<RUN>", path: result.runRoot },
    { placeholder: "<IMPL>", path: resolve(referenceRoot) },
    // The SECOND reference tree of a `@full-stack` scenario of FX-35 or FX-36: the
    // real engine the mixture-of-loops baseline drives (F141-FR-016). The baseline
    // resolves the real path of the command it ran before it writes it down, so the
    // scratch path of that tree reaches the capture even though no command of the
    // scenario names it: the stub directory links the as-is engine command at it.
    ...(engineRoot === undefined ? [] : [{ placeholder: "<ENGINE>", path: resolve(engineRoot) }]),
    { placeholder: "<HOME>", path: result.env["HOME"] as string },
    { placeholder: "<TMP>", path: result.env["TMPDIR"] as string },
    // The root of the FIXTURE and the root of the ORACLE itself. A command of a
    // scenario is reached through a stub that the run links into its own `stub-bin`,
    // and the reference RESOLVES the real path of what it ran before it writes the
    // name down (`os.path.realpath` of `_command`, the verification planner at the
    // pinned commit), so the capture carries the path of this checkout —
    // `<ORACLE>/stubs/bin/stub-harness` — which is a path of the machine
    // (`MACHINE_PATH_ROOTS` holds `/root`) and differs between two checkouts.
    // Found live on `FX-15/release-verification-passes`, whose plan names the
    // verification command it ran. `<FIXTURE>` is under `<ORACLE>`, and
    // `rootsLongestFirst` is what keeps the longer of the two first.
    { placeholder: "<FIXTURE>", path: result.fixtureDir },
    { placeholder: "<ORACLE>", path: ORACLE_ROOT },
  ]);
}

/** The normalize context of one driven side. */
export function contextOfRun(
  result: DriveResult,
  options: {
    readonly referenceRoot: string;
    readonly slug: string;
    readonly fixture: string;
    /** The tree of the real engine, for a `@full-stack` scenario (F141-FR-016). */
    readonly engineRoot?: string;
  },
  declaration: Readonly<Record<string, unknown>>,
): NormalizeContext {
  return Object.freeze({
    scenario: options.fixture,
    side: "reference" as const,
    roots: rootsOfRun(result, options.referenceRoot, options.engineRoot),
    statePaths: result.statePaths,
    durationsUnderTest: Object.freeze([
      ...((declaration["durationsUnderTest"] as string[] | undefined) ?? []),
    ]),
    ...(fixtureTestsColour(declaration) ? { testsColour: true as const } : {}),
    slug: options.slug,
  });
}

/**
 * Whether a scenario TESTS colour, which is what N-21 needs to know: a capture
 * that holds an escape sequence is a finding unless the fixture is about colour,
 * and then the sequences are compared as written (F141-FR-020, rule N-21).
 *
 * It is read off the declaration and is no field of its own: a scenario tests
 * colour exactly when it declares the as-is variable that switches the depth on
 * (`SPECSTRIDE_COLOR`, `lib/theme.py:98` at `9cab15d`, which overrides every
 * other signal) with a depth other than `none`. Every other scenario runs with
 * colour off, as the allow-list of the empty environment sets it.
 */
export function fixtureTestsColour(declaration: Readonly<Record<string, unknown>>): boolean {
  const environment = (declaration["environment"] ?? {}) as Record<string, unknown>;
  const declared = environment["SPECSTRIDE_COLOR"];
  if (declared === undefined) return false;
  return String(declared).toLowerCase() !== "none";
}

/**
 * Run the reference twice and judge the two captures: the whole of
 * `--sides reference,reference` and of `--seed-difference <surface>`. Where the
 * reference tree is not in scratch the outcome is a SKIP with its reason.
 */
export function selfProof(options: SelfProofRunOptions): SelfProofOutcome {
  const sides = options.sides ?? (Object.freeze(["reference", "reference"]) as Sides);
  if (!isTheSelfProof(sides)) {
    throw new SelfProofError(
      `the self-proof names the reference on both sides (--sides ${SELF_PROOF_SIDES}); it was ` +
        `asked for ${sides.join(",")}`,
    );
  }
  const slug = options.slug ?? "default";
  const entryPoint = String(
    (options.declaration["entryPoint"] as Record<string, string> | undefined)?.["reference"] ?? "",
  );
  const steps = stepsOf({
    scenario: options.fixture,
    side: "reference",
    fixtureDir: options.fixtureDir,
    runRoot: options.runRoot,
    fixture: options.declaration,
    implementationRoot: options.referenceRoot,
    criticStubAddress: options.criticStubAddress,
  });
  const unavailable = sideIsAvailable(
    "reference",
    options.referenceRoot,
    entryPoint,
    implementationFilesOf(steps, String(options.declaration["system"] ?? "specstride")),
  );
  if (unavailable !== undefined) {
    const skipped = { reason: unavailable.reason };
    const context: NormalizeContext = {
      scenario: options.fixture,
      side: "reference",
      roots: [],
      statePaths: {},
      durationsUnderTest: [],
      slug,
    };
    const empty: Capture = Object.freeze({
      scenario: options.fixture,
      side: "reference" as const,
      suite: "first" as const,
      layer: "off" as const,
      surfaces: Object.freeze({}),
      missing: Object.freeze({}),
    }) as unknown as Capture;
    return Object.freeze({
      fixture: options.fixture,
      sides,
      comparison: compare(empty, empty, {
        fixture: options.fixture,
        referenceContext: context,
        portContext: context,
        skipped,
      }),
      report: {
        schema: "urn:specstride:schema:internal:141:oracle-result/1",
        suite: "first",
        fixture: options.fixture,
        skipped,
        results: {},
        replacements: {},
      } as ResultReport,
      equal: Object.freeze([]),
      notEqual: Object.freeze([]),
      ...(options.seedDifference === undefined ? {} : { seeded: options.seedDifference }),
      skipped,
    });
  }
  const runs = (["a", "b"] as const).map((which) => {
    const runRoot = join(resolve(options.runRoot), which);
    mkdirSync(runRoot, { recursive: true });
    const result = driveSide({
      scenario: options.fixture,
      side: "reference",
      fixtureDir: options.fixtureDir,
      runRoot,
      fixture: options.declaration,
      implementationRoot: options.referenceRoot,
      criticStubAddress: options.criticStubAddress,
      slug,
      ...(options.engineStub === undefined ? {} : { engineStub: options.engineStub }),
    });
    return {
      capture: result.capture,
      context: contextOfRun(
        result,
        { referenceRoot: options.referenceRoot, slug, fixture: options.fixture },
        options.declaration,
      ),
    };
  });
  return selfProofOfCaptures(runs[0] as SideOfTheSelfProof, runs[1] as SideOfTheSelfProof, {
    fixture: options.fixture,
    sides,
    ...(options.seedDifference === undefined ? {} : { seedDifference: options.seedDifference }),
  });
}

/** What the feasibility probe found. */
export type ProbeOutcome = {
  readonly scenario: string;
  readonly system: string;
  readonly ran: boolean;
  readonly exitCode?: number;
  readonly phases?: number;
  readonly rejections?: number;
  /** The tree fingerprint of each of the two runs; the probe wants them equal. */
  readonly trees?: readonly [string, string];
  readonly sameTreeTwice?: boolean;
  readonly skipped?: { readonly reason: string };
};

/** How many phases a capture of the reference shows, and how many rejections. */
export function phasesAndRejectionsOf(capture: Capture): {
  readonly phases: number;
  readonly rejections: number;
} {
  const text = JSON.stringify(capture.surfaces ?? {});
  const phases = new Set(
    [...text.matchAll(/"?phase"?\s*[:=]?\s*"?(\d+)/g)].map((m) => m[1] as string),
  );
  // ONE rejection is one rejected ATTEMPT, which the reference announces once:
  // `----- phase 1 REJECTED on attempt 1/3 -----`. Counting every occurrence of
  // the word instead would count the verdict line, the feedback file and the
  // diagnostician prompt that quotes them, and would report dozens for one.
  const rejections = new Set(
    [...text.matchAll(/phase (\d+) REJECTED on attempt (\d+)/g)].map(
      (m) => `${m[1] as string}/${m[2] as string}`,
    ),
  ).size;
  return { phases: phases.size, rejections };
}

/** The tree of a capture, as the probe compares it between two runs. */
export function treeOfCapture(capture: Capture): string {
  return JSON.stringify((capture.surfaces as Record<string, unknown>)["tree"] ?? null);
}

/**
 * `probe` — the feasibility probe (F141-FR-044). The Specstride reference runs
 * three phases with one rejection against the stubs, ends with exit 0 and leaves
 * the same tree twice. Where the reference tree is not in scratch the probe is a
 * skip with its reason and never a pass.
 */
export function probe(options: SelfProofRunOptions): ProbeOutcome {
  const outcome = selfProof({ ...options, fixture: options.fixture });
  if (outcome.skipped !== undefined) {
    return Object.freeze({
      scenario: options.fixture,
      system: PROBE_SYSTEM,
      ran: false,
      skipped: outcome.skipped,
    });
  }
  const first = outcome.comparison.normalized.reference;
  const second = outcome.comparison.normalized.port;
  const exitSurface = (first.surfaces as Record<string, unknown>)["exit"] as
    { readonly exitCode?: number } | undefined;
  const counted = phasesAndRejectionsOf({
    scenario: options.fixture,
    side: "reference",
    suite: "first",
    surfaces: first.surfaces,
  } as unknown as Capture);
  const trees = Object.freeze([
    JSON.stringify((first.surfaces as Record<string, unknown>)["tree"] ?? null),
    JSON.stringify((second.surfaces as Record<string, unknown>)["tree"] ?? null),
  ]) as readonly [string, string];
  return Object.freeze({
    scenario: options.fixture,
    system: PROBE_SYSTEM,
    ran: true,
    exitCode: exitSurface?.exitCode ?? -1,
    phases: counted.phases,
    rejections: counted.rejections,
    trees,
    sameTreeTwice: trees[0] === trees[1] && nothingIsDifferent(outcome.report),
  });
}

/** The probe held up: exit 0, three phases, one rejection, the same tree twice. */
export function assertTheProbeHeldUp(outcome: ProbeOutcome): void {
  if (!outcome.ran) {
    throw new SelfProofError(
      `the feasibility probe did not run: ${outcome.skipped?.reason ?? "no reason recorded"}. ` +
        `A probe that did not run is a skip with its reason and never a pass`,
    );
  }
  if (outcome.exitCode !== PROBE_EXPECTED_EXIT) {
    throw new SelfProofError(
      `the feasibility probe wants exit ${String(PROBE_EXPECTED_EXIT)} from the reference; it ` +
        `ended with ${String(outcome.exitCode)}`,
    );
  }
  if ((outcome.phases ?? 0) < PROBE_EXPECTED_PHASES) {
    throw new SelfProofError(
      `the feasibility probe wants ${String(PROBE_EXPECTED_PHASES)} phases from the reference; the ` +
        `capture shows ${String(outcome.phases)}`,
    );
  }
  if (outcome.rejections !== PROBE_EXPECTED_REJECTIONS) {
    throw new SelfProofError(
      `the feasibility probe wants ${String(PROBE_EXPECTED_REJECTIONS)} rejection from the ` +
        `reference; the capture shows ${String(outcome.rejections)}`,
    );
  }
  if (outcome.sameTreeTwice !== true) {
    throw new SelfProofError(
      `the feasibility probe wants the same tree twice from ${outcome.scenario}; the two runs ` +
        `left different trees`,
    );
  }
}
