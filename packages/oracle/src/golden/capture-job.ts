/**
 * T070 — the capture job (F141-FR-025).
 *
 * > "A capture job MUST fail when a committed golden capture differs from a fresh
 * > capture of the reference."
 *
 * It is the job `capture` of `.github/workflows/oracle.yml`, and it does three
 * things, in this order, for every scenario the store holds a capture of:
 *
 *  1. **a fresh capture of the reference** — the reference is driven again, in the
 *     hermetic environment, against the scripted stubs, and the capture is
 *     normalized by the rules of feature 100 (`freshCaptureOfTheReference`);
 *  2. **the comparison with the committed golden capture** — surface by surface,
 *     through `differencesFromGolden`. One difference fails the job and names the
 *     scenario, the surface and the selector;
 *  3. **the scan for a path, an account or a name of the machine** — of the FRESH
 *     capture, not only of the committed one. A rule of feature 100 that stopped
 *     firing would otherwise be found only at the next commit of a capture, and the
 *     job is what keeps the store committable.
 *
 * A scenario whose prerequisite is missing — no clone of its baseline, no tree in
 * scratch — is a **skip with its reason and never a pass** (F141-FR-037). The job
 * itself then fails only if it was asked to meet every prerequisite, which is what
 * the release run asks (`requireEveryPrerequisite`), because at the release check a
 * skip blocks (F141-FR-026).
 */
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { differencesFromGolden, readGoldenCapture, writeGoldenCapture } from "../capture/golden.ts";
import { endDifferencesFromCatalogue } from "./ends.ts";
import type { GoldenCapture } from "../capture/golden.ts";
import { normalize, type NormalizedCapture } from "../normalize/index.ts";
import {
  driveSide,
  implementationFilesOf,
  sideIsAvailable,
  stepsOf,
  type DriveResult,
} from "../run/driver.ts";
import { contextOfRun } from "../run/self.ts";
import type { FixtureDeclaration } from "../catalogue/fixture.ts";
import type { Difference } from "../waivers/waivers.ts";
import {
  GoldenStoreError,
  fixturesWithAGoldenCapture,
  committedPathsOfTheScenario,
  machineIdentity,
  machineTracesIn,
  type MachineIdentity,
  type MachineTrace,
} from "./store.ts";

/** A fault of the capture job. */
export class CaptureJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CaptureJobError";
  }
}

/** What one scenario's fresh capture of the reference is, or why there is none. */
export type FreshCapture =
  | {
      readonly fixture: string;
      readonly normalized: NormalizedCapture;
      readonly system: string;
      readonly commit: string;
    }
  | { readonly fixture: string; readonly skipped: string };

/** True where a fresh capture is a skip with its reason. */
export function isSkipped(
  fresh: FreshCapture,
): fresh is { readonly fixture: string; readonly skipped: string } {
  return "skipped" in fresh;
}

/** What the job found for one scenario. */
export type CaptureJobEntry = {
  readonly fixture: string;
  readonly outcome: "equal" | "different" | "skipped";
  readonly reason?: string;
  readonly differences: readonly Difference[];
  /** Traces of the machine in the FRESH capture (F141-FR-025). */
  readonly traces: readonly MachineTrace[];
};

/** What the whole job found. */
export type CaptureJobReport = {
  readonly entries: readonly CaptureJobEntry[];
  readonly failed: readonly string[];
  readonly skipped: readonly string[];
  readonly passed: boolean;
};

/** What the job was asked to do. */
export type CaptureJobOptions = {
  /** The scenarios to capture again; by default every one the store holds. */
  readonly fixtures?: readonly string[];
  /** How a fresh capture of the reference is made. */
  readonly captureFresh: (fixture: string) => FreshCapture;
  /** The committed capture of one scenario; by default the file on disk. */
  readonly golden?: (fixture: string) => GoldenCapture;
  /** The release run asks for every prerequisite: a skip then fails the job. */
  readonly requireEveryPrerequisite?: boolean;
  readonly identity?: MachineIdentity;
};

/**
 * Run the capture job. It never writes a golden capture: a committed capture that
 * differs from a fresh one is a FAILURE to report, not a file to overwrite —
 * overwriting it would hide the very regression the job exists to find. Writing a
 * capture again is `refreshGoldenCapture`, which a person runs on purpose.
 */
export function captureJob(options: CaptureJobOptions): CaptureJobReport {
  const fixtures = options.fixtures ?? fixturesWithAGoldenCapture();
  const golden = options.golden ?? ((fixture: string) => readGoldenCapture(fixture));
  const entries: CaptureJobEntry[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];

  for (const fixture of fixtures) {
    const fresh = options.captureFresh(fixture);
    if (isSkipped(fresh)) {
      entries.push({
        fixture,
        outcome: "skipped",
        reason: fresh.skipped,
        differences: Object.freeze([]),
        traces: Object.freeze([]),
      });
      skipped.push(fixture);
      if (options.requireEveryPrerequisite === true) failed.push(fixture);
      continue;
    }
    const committed = golden(fixture);
    // T161 (F141-FR-013): the end the capture shows must be the end the
    // catalogue states — the exit code and the stop reason. One difference
    // fails the job and names the scenario.
    const differences = [
      ...differencesFromGolden(fresh.normalized, committed),
      ...endDifferencesFromCatalogue(fixture, fresh.normalized),
    ];
    const traces = machineTracesIn(
      fresh.normalized.surfaces,
      options.identity,
      "",
      committedPathsOfTheScenario(fixture),
    );
    const outcome = differences.length === 0 && traces.length === 0 ? "equal" : "different";
    entries.push({
      fixture,
      outcome,
      differences,
      traces,
      ...(outcome === "different"
        ? {
            reason:
              differences.length > 0
                ? `the committed golden capture differs from a fresh capture of the reference on ` +
                  `${[...new Set(differences.map((d) => d.surface))].join(", ")}`
                : `the fresh capture of the reference holds ${traces.length} trace(s) of the ` +
                  `machine that made it`,
          }
        : {}),
    });
    if (outcome === "different") failed.push(fixture);
  }

  return Object.freeze({
    entries: Object.freeze(entries),
    failed: Object.freeze(failed),
    skipped: Object.freeze(skipped),
    passed: failed.length === 0,
  });
}

/** The lines the job prints: one per scenario, then the summary. */
export function captureJobLines(report: CaptureJobReport): readonly string[] {
  const lines = report.entries.map((entry) => {
    const head = `${entry.fixture}: ${entry.outcome}`;
    return entry.reason === undefined ? head : `${head} — ${entry.reason}`;
  });
  for (const entry of report.entries) {
    for (const difference of entry.differences.slice(0, 5)) {
      lines.push(`  ${entry.fixture} / ${difference.surface} / ${difference.selector}`);
    }
    for (const trace of entry.traces.slice(0, 5)) {
      lines.push(`  ${entry.fixture}: ${trace.kind} \`${trace.found}\` at ${trace.at}`);
    }
  }
  lines.push(
    `capture job: ${report.entries.length} scenario(s), ${report.failed.length} failed, ` +
      `${report.skipped.length} skipped — ${report.passed ? "passed" : "FAILED"}`,
  );
  return Object.freeze(lines);
}

/** 0 when the job passed, 1 when a committed capture differs from a fresh one. */
export function exitCodeOfCaptureJob(report: CaptureJobReport): number {
  return report.passed ? 0 : 1;
}

/** F141-FR-025 — the job fails when a committed capture differs from a fresh one. */
export function assertTheCaptureJobPassed(report: CaptureJobReport): void {
  if (report.passed) return;
  throw new CaptureJobError(
    `the capture job failed on ${report.failed.length} scenario(s): ` +
      report.entries
        .filter((entry) => entry.outcome !== "equal")
        .map((entry) => `${entry.fixture} (${entry.outcome}: ${entry.reason ?? ""})`)
        .join("; "),
  );
}

// ---------------------------------------------------------------------------
// The fresh capture of the reference
// ---------------------------------------------------------------------------

/** What a fresh capture of the reference needs. */
export type FreshCaptureOptions = {
  readonly fixture: string;
  readonly fixtureDir: string;
  readonly runRoot: string;
  readonly declaration: FixtureDeclaration & Readonly<Record<string, unknown>>;
  /** The read-only reference tree in scratch; `undefined` where there is none. */
  readonly referenceRoot: string | undefined;
  readonly criticStubAddress: string;
  readonly slug?: string;
  readonly engineStub?: string;
  readonly system: string;
  readonly commit: string;
};

/**
 * Drive the reference once and give back its NORMALIZED capture — the value the
 * committed golden capture is compared with.
 *
 * Where the reference tree is not in scratch, or the scenario's entry point is not
 * in it, the result is a skip with its reason: `sideIsAvailable` is the single
 * reading of availability the driver, the tier runner and the parity tests all
 * use, so the job can never judge a side available and drive it anyway.
 */
export function freshCaptureOfTheReference(options: FreshCaptureOptions): FreshCapture {
  const slug = options.slug ?? "default";
  if (options.referenceRoot === undefined) {
    return {
      fixture: options.fixture,
      skipped:
        `prerequisite missing: no clone of the ${options.system} baseline was found, so the ` +
        `reference tree at ${options.commit} is not in scratch and no fresh capture can be made. ` +
        `This is a SKIP with its reason and never a pass (F141-FR-037); at the release check a ` +
        `skip blocks (F141-FR-026)`,
    };
  }
  const referenceRoot = resolve(options.referenceRoot);
  const entryPoint = String(
    (options.declaration["entryPoint"] as Record<string, string> | undefined)?.["reference"] ?? "",
  );
  const steps = stepsOf({
    scenario: options.fixture,
    side: "reference",
    fixtureDir: options.fixtureDir,
    runRoot: options.runRoot,
    fixture: options.declaration,
    implementationRoot: referenceRoot,
    criticStubAddress: options.criticStubAddress,
  });
  const unavailable = sideIsAvailable(
    "reference",
    referenceRoot,
    entryPoint,
    implementationFilesOf(steps, options.system),
  );
  if (unavailable !== undefined) {
    return { fixture: options.fixture, skipped: unavailable.reason };
  }
  const runRoot = join(resolve(options.runRoot), "fresh");
  mkdirSync(runRoot, { recursive: true });
  const result: DriveResult = driveSide({
    scenario: options.fixture,
    side: "reference",
    fixtureDir: options.fixtureDir,
    runRoot,
    fixture: options.declaration,
    implementationRoot: referenceRoot,
    criticStubAddress: options.criticStubAddress,
    slug,
    ...(options.engineStub === undefined ? {} : { engineStub: options.engineStub }),
  });
  const context = contextOfRun(
    result,
    { referenceRoot, slug, fixture: options.fixture },
    options.declaration,
  );
  return {
    fixture: options.fixture,
    normalized: normalize(result.capture, context),
    system: options.system,
    commit: options.commit,
  };
}

/**
 * Write the golden capture of one scenario again, from a fresh capture of the
 * reference. A person runs this on purpose, after reading why the capture changed;
 * the job never does it by itself (see `captureJob`).
 */
export function refreshGoldenCapture(fresh: FreshCapture): string {
  if (isSkipped(fresh)) {
    throw new CaptureJobError(
      `${fresh.fixture}: no fresh capture of the reference was made (${fresh.skipped}), so no ` +
        `golden capture is written. A capture without a run behind it is an expectation nobody ` +
        `captured`,
    );
  }
  const traces = machineTracesIn(
    fresh.normalized.surfaces,
    machineIdentity(),
    "",
    committedPathsOfTheScenario(fresh.fixture),
  );
  if (traces.length > 0) {
    throw new GoldenStoreError(
      `${fresh.fixture}: the fresh capture holds ${traces.length} trace(s) of the machine ` +
        `(${traces.map((t) => `${t.kind} \`${t.found}\``).join("; ")}), which F141-FR-025 forbids ` +
        `a committed golden capture to hold`,
    );
  }
  return writeGoldenCapture(fresh.normalized, {
    fixture: fresh.fixture,
    system: fresh.system,
    commit: fresh.commit,
  });
}
