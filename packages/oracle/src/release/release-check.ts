/**
 * T073 — the release check (F141-FR-026, F141-FR-036).
 *
 * > "A release MUST be blocked while any fixture surface reads `different`, while
 * > any self-check of the oracle fails, while any parity test of any feature fails
 * > or is skipped, while the second suite fails, or while the live differential run
 * > has not passed on the build to be released. The fixtures of dsh, Codex and
 * > prime MUST be inside this condition. No behaviour item MUST be left out because
 * > its harness was planned for a later wave."
 *
 * One check says whether a release may go out, and when it says `blocked` it NAMES
 * the cause. It runs no fixture and no test: it READS the reports the five sources
 * leave behind —
 *
 * | Source | What is read |
 * |---|---|
 * | the first suite | one `ResultReport` per scenario: the three results per surface, and a skip with its reason |
 * | the second suite | its outcome and its counters (F141-FR-039 to F141-FR-042) |
 * | the parity tests of every feature | pass, fail or skip per test |
 * | the live differential run | the build it ran on, and whether it passed (F141-FR-025) |
 * | the platform run | the record of a macOS runner, or its absence (F141-FR-036) |
 *
 * — and that separation is the point: a check that ran the suites itself could not
 * be the condition of a release built elsewhere, and the workflow of feature 100
 * reads this one (`tests/release/100/release-conditions.ts`, condition 1).
 *
 * A **skip counts as a failure** everywhere in this module. That is F141-FR-026's
 * "fails or is skipped" and F141-FR-037's "at the release check a skip blocks", and
 * it is the one clause that keeps a release from passing on a tree where the oracle
 * never ran.
 */
import { nothingIsDifferent, type ResultReport } from "../compare/comparator.ts";
import { scenarioEntriesOf } from "../catalogue/catalogue.ts";
import { activeFamilies } from "../catalogue/data.ts";
import {
  macosStatementsAreUnverified,
  macosUnverifiedStatement,
  type MacosRunRecord,
} from "./per-os.ts";

/** A fault of the release check itself: an input it cannot read. */
export class ReleaseCheckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReleaseCheckError";
  }
}

// ---------------------------------------------------------------------------
// What the check reads
// ---------------------------------------------------------------------------

/** The five sources F141-FR-026 and F141-FR-036 name. */
export const RELEASE_INPUTS = [
  "the first suite",
  "the second suite",
  "the parity tests of every feature",
  "the live differential run",
  "the platform run",
] as const;

/** The report of the second suite (F141-FR-039 to F141-FR-042). */
export type SecondSuiteReport = {
  readonly passed: boolean;
  /** Differences outside the layer allowlist; any of them fails the suite. */
  readonly outsideTheAllowlist: readonly string[];
  /** Allowlist entries that matched nothing; any of them fails the suite. */
  readonly entriesThatMatchedNothing: readonly string[];
  /** The counter assertion of F141-FR-041: the counters of A and B. */
  readonly countersAreEqual: boolean;
  readonly reason?: string;
};

/** One parity test of one feature, as its run reported it. */
export type ParityTestReport = {
  readonly name: string;
  readonly feature: string;
  readonly outcome: "passed" | "failed" | "skipped";
  readonly reason?: string;
};

/** One self-check of the oracle (F141-FR-044). */
export type SelfCheckReport = {
  readonly name: string;
  readonly passed: boolean;
  readonly reason?: string;
};

/** The record the live differential run on Linux leaves (F141-FR-025). */
export type LiveRunReport = {
  readonly build: string;
  readonly platform: "linux";
  readonly passed: boolean;
  /** The scenarios it confirmed against a fresh capture of the reference. */
  readonly confirmed: readonly string[];
  readonly reason?: string;
};

/** Everything the release check reads. */
export type ReleaseInputs = {
  /** The build to be released: the commit the suites must have run on. */
  readonly build: string;
  readonly firstSuite: readonly ResultReport[];
  readonly secondSuite: SecondSuiteReport | undefined;
  readonly parityTests: readonly ParityTestReport[];
  readonly selfChecks: readonly SelfCheckReport[];
  readonly liveRun: LiveRunReport | undefined;
  readonly platformRun: MacosRunRecord | undefined;
};

// ---------------------------------------------------------------------------
// The causes
// ---------------------------------------------------------------------------

/** The kinds of cause the check can name. */
export const CAUSES = [
  "a surface reads different",
  "a surface is a skip",
  "a self-check of the oracle failed",
  "a parity test of a feature failed",
  "a parity test of a feature is a skip",
  "the second suite failed",
  "the live differential run has not passed on this build",
  "no macOS runner has passed the oracle",
  "a fixture of dsh, Codex or prime is not in the condition",
] as const;
export type Cause = (typeof CAUSES)[number];

/** One cause of a block, with what it is about. */
export type BlockingCause = {
  readonly cause: Cause;
  readonly requirement: string;
  /** What it is about: a scenario and a surface, a test, a suite. */
  readonly subject: string;
  readonly detail: string;
};

/** What the release check decided. */
export type ReleaseDecision = {
  readonly blocked: boolean;
  readonly causes: readonly BlockingCause[];
  readonly macos: string;
  readonly lines: readonly string[];
};

// ---------------------------------------------------------------------------
// "The fixtures of dsh, Codex and prime MUST be inside this condition"
// ---------------------------------------------------------------------------

/** The three harnesses whose fixtures F141-FR-026 names. */
export const HARNESSES_INSIDE_THE_CONDITION = ["dsh", "codex", "prime"] as const;
export type HarnessInsideTheCondition = (typeof HARNESSES_INSIDE_THE_CONDITION)[number];

/**
 * Every scenario of the catalogue that belongs to dsh, Codex or prime, read from
 * the catalogue and never listed here.
 *
 * Two things make a scenario one of theirs: its NAME carries the harness (the
 * stream-format scenarios `dsh-text`, `codex-text`, the `prime-v3-…` members), and
 * its family names a harness stub of that harness in `stubs`. Both are read, because
 * a family whose subject IS the harness (FX-38, the dsh plugin request protocol) has
 * scenario names that do not carry it.
 */
export function fixturesOfTheThreeHarnesses(): Readonly<
  Record<HarnessInsideTheCondition, readonly string[]>
> {
  const found: Record<string, string[]> = { dsh: [], codex: [], prime: [] };
  for (const family of activeFamilies()) {
    const stubs = (family.stubs as readonly string[] | undefined) ?? [];
    const exercises = `${family.name} ${String((family as { exercises?: unknown }).exercises ?? "")}`;
    for (const entry of scenarioEntriesOf(family.id)) {
      const names = [
        entry.name,
        ...(((entry as { members?: readonly string[] }).members ?? []) as readonly string[]),
      ];
      for (const harness of HARNESSES_INSIDE_THE_CONDITION) {
        const byName = names.filter((name) => name.toLowerCase().startsWith(`${harness}-`));
        const byStub = stubs.some((stub) => stub.toLowerCase().includes(harness));
        const byFamily = new RegExp(`\\b${harness}\\b`, "i").test(exercises);
        if (byName.length > 0) {
          for (const name of byName) (found[harness] as string[]).push(`${family.id}/${name}`);
        } else if (byStub || byFamily) {
          (found[harness] as string[]).push(`${family.id}/${entry.name}`);
        }
      }
    }
  }
  return Object.freeze({
    dsh: Object.freeze([...new Set(found["dsh"] as string[])].sort()),
    codex: Object.freeze([...new Set(found["codex"] as string[])].sort()),
    prime: Object.freeze([...new Set(found["prime"] as string[])].sort()),
  });
}

/**
 * F141-FR-026 — the fixtures of dsh, Codex and prime are INSIDE the condition: a
 * release check that did not read a report of any of them is not the condition the
 * requirement states, and "No behaviour item MUST be left out because its harness
 * was planned for a later wave" is exactly the omission this catches.
 */
export function harnessesNotInTheCondition(
  firstSuite: readonly ResultReport[],
): readonly BlockingCause[] {
  const read = new Set(firstSuite.map((report) => report.fixture));
  const causes: BlockingCause[] = [];
  const byHarness = fixturesOfTheThreeHarnesses();
  for (const harness of HARNESSES_INSIDE_THE_CONDITION) {
    const theirs = byHarness[harness];
    if (theirs.length === 0) {
      throw new ReleaseCheckError(
        `the catalogue holds no scenario of ${harness}, and F141-FR-026 puts its fixtures inside ` +
          `the release condition`,
      );
    }
    if (!theirs.some((fixture) => read.has(fixture))) {
      causes.push({
        cause: "a fixture of dsh, Codex or prime is not in the condition",
        requirement: "F141-FR-026",
        subject: harness,
        detail:
          `the first suite reports no scenario of ${harness}, and F141-FR-026 puts its fixtures ` +
          `inside the release condition. No behaviour item is left out because its harness was ` +
          `planned for a later wave. The catalogue holds ${theirs.length}: ` +
          `${theirs.slice(0, 4).join(", ")}${theirs.length > 4 ? ", …" : ""}`,
      });
    }
  }
  return Object.freeze(causes);
}

// ---------------------------------------------------------------------------
// The check
// ---------------------------------------------------------------------------

/** Read the reports and say whether a release may go out. */
export function releaseCheck(inputs: ReleaseInputs): ReleaseDecision {
  const causes: BlockingCause[] = [];

  // 1. any fixture surface that reads `different`, and any scenario that is a skip.
  for (const report of inputs.firstSuite) {
    if (report.skipped !== undefined) {
      causes.push({
        cause: "a surface is a skip",
        requirement: "F141-FR-037",
        subject: report.fixture,
        detail:
          `the scenario is a skip with its reason — ${report.skipped.reason} — and at the release ` +
          `check a skip blocks`,
      });
      continue;
    }
    if (Object.keys(report.results).length === 0) {
      causes.push({
        cause: "a surface is a skip",
        requirement: "F141-FR-037",
        subject: report.fixture,
        detail:
          `the report holds no result for any surface and no reason for a skip, so nothing was ` +
          `compared; at the release check that blocks`,
      });
      continue;
    }
    if (nothingIsDifferent(report)) continue;
    for (const [surface, result] of Object.entries(report.results)) {
      if (result.result !== "different") continue;
      causes.push({
        cause: "a surface reads different",
        requirement: "F141-FR-026",
        subject: `${report.fixture} / ${surface}`,
        detail:
          `the surface reads \`different\`` +
          (result.differences === undefined || result.differences.length === 0
            ? ""
            : ` at ${result.differences
                .slice(0, 3)
                .map((difference) => difference.selector)
                .join(", ")}`) +
          (result.assertions === undefined || result.assertions.length === 0
            ? ""
            : `; ${result.assertions.join("; ")}`),
      });
    }
  }

  // 2. any self-check of the oracle that fails (F141-FR-044).
  for (const check of inputs.selfChecks) {
    if (check.passed) continue;
    causes.push({
      cause: "a self-check of the oracle failed",
      requirement: "F141-FR-026",
      subject: check.name,
      detail: check.reason ?? "the self-check of the oracle failed",
    });
  }

  // 3. any parity test of any feature that fails OR is skipped.
  for (const test of inputs.parityTests) {
    if (test.outcome === "passed") continue;
    causes.push({
      cause:
        test.outcome === "failed"
          ? "a parity test of a feature failed"
          : "a parity test of a feature is a skip",
      requirement: "F141-FR-026",
      subject: `${test.name} (feature ${test.feature})`,
      detail:
        test.outcome === "failed"
          ? (test.reason ?? "the parity test failed")
          : `the parity test is a skip — ${test.reason ?? "no reason given"} — and a skipped ` +
            `parity test counts as a failure`,
    });
  }

  // 4. the second suite (F141-FR-039 to F141-FR-042).
  if (inputs.secondSuite === undefined) {
    causes.push({
      cause: "the second suite failed",
      requirement: "F141-FR-026",
      subject: "the second suite",
      detail: "the second suite left no report on this build, so it did not pass",
    });
  } else {
    const suite = inputs.secondSuite;
    if (!suite.passed || !suite.countersAreEqual) {
      causes.push({
        cause: "the second suite failed",
        requirement: "F141-FR-026",
        subject: "the second suite",
        detail:
          suite.reason ??
          [
            suite.outsideTheAllowlist.length > 0
              ? `${suite.outsideTheAllowlist.length} difference(s) outside the layer allowlist ` +
                `(${suite.outsideTheAllowlist.slice(0, 3).join(", ")}), a possible breach of gate ` +
                `integrity`
              : "",
            suite.entriesThatMatchedNothing.length > 0
              ? `${suite.entriesThatMatchedNothing.length} allowlist entry(ies) matched nothing ` +
                `(${suite.entriesThatMatchedNothing.slice(0, 3).join(", ")})`
              : "",
            suite.countersAreEqual ? "" : "the counters of capture A and capture B differ",
          ]
            .filter((part) => part !== "")
            .join("; "),
      });
    }
  }

  // 5. the live differential run, on the build to be released (F141-FR-025).
  if (inputs.liveRun === undefined) {
    causes.push({
      cause: "the live differential run has not passed on this build",
      requirement: "F141-FR-026",
      subject: `build ${inputs.build}`,
      detail:
        `no live differential run on Linux left a report for this build. The live run is the ` +
        `\`reference\` test tier; until it has passed on the build to be released, the release is ` +
        `blocked`,
    });
  } else if (!inputs.liveRun.passed) {
    causes.push({
      cause: "the live differential run has not passed on this build",
      requirement: "F141-FR-026",
      subject: `build ${inputs.liveRun.build}`,
      detail: inputs.liveRun.reason ?? "the live differential run on Linux did not pass",
    });
  } else if (inputs.liveRun.build !== inputs.build) {
    causes.push({
      cause: "the live differential run has not passed on this build",
      requirement: "F141-FR-026",
      subject: `build ${inputs.build}`,
      detail:
        `the live differential run passed on build ${inputs.liveRun.build}, and the release is of ` +
        `build ${inputs.build}. F141-FR-026 asks for the live run on the build TO BE RELEASED`,
    });
  }

  // 6. the platform run: a macOS runner (F141-FR-036).
  if (macosStatementsAreUnverified(inputs.platformRun)) {
    causes.push({
      cause: "no macOS runner has passed the oracle",
      requirement: "F141-FR-036",
      subject: "the platform run",
      detail: macosUnverifiedStatement(inputs.platformRun),
    });
  } else if ((inputs.platformRun as MacosRunRecord).build !== inputs.build) {
    causes.push({
      cause: "no macOS runner has passed the oracle",
      requirement: "F141-FR-036",
      subject: "the platform run",
      detail:
        `a macOS runner passed the oracle on build ` +
        `${(inputs.platformRun as MacosRunRecord).build}, and the release is of build ` +
        `${inputs.build}. F141-FR-036 asks for a macOS runner that passes before the release of ` +
        `THIS build`,
    });
  }

  // 7. the fixtures of dsh, Codex and prime are inside the condition.
  causes.push(...harnessesNotInTheCondition(inputs.firstSuite));

  const macos = macosUnverifiedStatement(inputs.platformRun);
  const blocked = causes.length > 0;
  return Object.freeze({
    blocked,
    causes: Object.freeze(causes),
    macos,
    lines: Object.freeze([
      blocked
        ? `release check: BLOCKED — ${causes.length} cause(s)`
        : `release check: the release may go out`,
      ...causes.map(
        (cause) => `  ${cause.cause} [${cause.requirement}] ${cause.subject}: ${cause.detail}`,
      ),
      `  ${macos}`,
    ]),
  });
}

/** 0 when the release may go out, 1 when it is blocked. */
export function exitCodeOfReleaseCheck(decision: ReleaseDecision): number {
  return decision.blocked ? 1 : 0;
}

/** The causes of one kind, for a caller that wants one reading. */
export function causesOfKind(decision: ReleaseDecision, cause: Cause): readonly BlockingCause[] {
  return Object.freeze(decision.causes.filter((held) => held.cause === cause));
}

/** True where the decision names this cause. */
export function namesTheCause(decision: ReleaseDecision, cause: Cause): boolean {
  return decision.causes.some((held) => held.cause === cause);
}
