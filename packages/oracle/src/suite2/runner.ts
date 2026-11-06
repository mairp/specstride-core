/**
 * T141 — the runner of the second suite (F141-FR-039).
 *
 * "The second suite MUST run every fixture of the first suite, unchanged, on
 * the port with the `parity` profile and row 1 of the profile set to `micro`,
 * and nothing else changed. The stubs MUST behave exactly as in the first
 * suite and MUST never declare a unit of work. Its two captures are capture A,
 * the port with the layer off, which the first suite produced, and capture B,
 * the port with the layer on. Both MUST include the surfaces S-14 to S-16."
 *
 * So the runner is the first suite's driver with ONE change: the configuration
 * it gives the port is the configuration the first suite gave, with row 1 of
 * the `parity` profile (`loop.strategy`, the loop strategy switch) set to
 * `micro`. `secondSuiteConfiguration` makes that configuration and REFUSES
 * anything else: it compares what it was given with what it gives back and
 * fails when a key other than row 1's changed, when a key went away, or when a
 * key was added. Capture A is the first suite's own capture of the fixture —
 * the runner never runs the layer-off side again, so the two suites can never
 * drift apart on what "off" was.
 *
 * Every fixture runs UNCHANGED: `assertFixturesUnchanged` holds a declaration
 * before and after and fails on any difference, which is how "every fixture
 * unchanged" is a property of the run and not a promise in a comment. And
 * `assertStubsDeclareNoUnitOfWork` reads the transcript of capture B: no
 * proposer invocation may carry a verb that declares a unit of work or writes
 * a checkpoint, because the micro-loop layer is exactly that unit of work, and
 * a stub that declared one would be driving the layer instead of testing it
 * (F141-FR-007, F141-FR-039).
 */
import {
  ENGINE_SWITCH_ROW,
  portConfiguration,
  type DriveOptions,
  type DriveResult,
  type Step,
} from "../run/driver.ts";
import { profileRow } from "@specstride/contracts/profile/parity";
import { VERBS_A_PROPOSER_STUB_NEVER_HAS } from "../../stubs/lib/proposer.ts";
import type { NeutralTranscriptRecord } from "../capture/transcript.ts";
import type { Capture } from "../capture/index.ts";

/** The row of the `parity` profile the second suite changes: the loop strategy. */
export const SECOND_SUITE_LAYER_ROW = 1 as const;

/** The value row 1 is set to: the micro loop, which capture B runs. */
export const SECOND_SUITE_LAYER_VALUE = "micro" as const;

/** The key row 1 names. */
export function secondSuiteLayerKeys(): readonly string[] {
  const row = profileRow(SECOND_SUITE_LAYER_ROW);
  if (row === undefined) {
    throw new Error(`row ${String(SECOND_SUITE_LAYER_ROW)} of the parity profile does not exist`);
  }
  return row.keys;
}

/** The configuration the second suite refuses: anything but row 1. */
export class SecondSuiteConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecondSuiteConfigError";
  }
}

/**
 * The configuration of capture B: the configuration of the first suite, with
 * row 1 of the `parity` profile set to `micro`, and nothing else changed.
 */
export function secondSuiteConfiguration(
  firstSuite: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const keys = secondSuiteLayerKeys();
  const changed: Record<string, unknown> = { ...firstSuite };
  for (const key of keys) {
    changed[key] = SECOND_SUITE_LAYER_VALUE;
    if (firstSuite[key] === SECOND_SUITE_LAYER_VALUE) {
      throw new SecondSuiteConfigError(
        `the first suite already set ${key} to ${SECOND_SUITE_LAYER_VALUE}; capture A would not ` +
          `be the port with the layer off (F141-FR-039)`,
      );
    }
  }
  // Nothing else changed: every key of the first suite is still there, no key
  // was added, and every value but row 1's is the same.
  for (const key of Object.keys(firstSuite)) {
    if (keys.includes(key)) continue;
    if (firstSuite[key] !== changed[key]) {
      throw new SecondSuiteConfigError(
        `the second suite would change ${key}, which is not row ` +
          `${String(SECOND_SUITE_LAYER_ROW)} of the parity profile; it changes row 1 and nothing ` +
          `else (F141-FR-039)`,
      );
    }
  }
  for (const key of Object.keys(changed)) {
    if (Object.prototype.hasOwnProperty.call(firstSuite, key)) continue;
    if (!keys.includes(key)) {
      throw new SecondSuiteConfigError(
        `the second suite would add ${key}; it changes row 1 of the parity profile and nothing ` +
          `else (F141-FR-039)`,
      );
    }
  }
  return Object.freeze(changed);
}

/**
 * The configurations of the two suites of one fixture, as the driver builds
 * them: capture A under the `parity` profile as the first suite selects it,
 * capture B with row 1 set to `micro`. The engine stub of the fixture — where
 * it names one, row 41 — and every key the fixture declares are the same on
 * both sides.
 */
export function configurationsOfFixture(options: {
  readonly engineStub?: string;
  readonly declaredKeys?: Readonly<Record<string, string>>;
}): {
  readonly a: Readonly<Record<string, unknown>>;
  readonly b: Readonly<Record<string, unknown>>;
} {
  const a = portConfiguration({
    engineStub: options.engineStub,
    declaredKeys: options.declaredKeys,
  });
  const b = secondSuiteConfiguration(a);
  return { a, b };
}

/** A fixture that changed under the second suite. */
export class FixtureChangedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FixtureChangedError";
  }
}

/**
 * The fixture the second suite ran is the fixture the first suite ran. A deep
 * comparison of the two declarations: the second suite owns no edit, no
 * default and no rewrite of a fixture (F141-FR-039).
 */
export function assertFixturesUnchanged(fixture: string, before: unknown, after: unknown): void {
  const left = JSON.stringify(before, null, 2);
  const right = JSON.stringify(after, null, 2);
  if (left !== right) {
    throw new FixtureChangedError(
      `${fixture}: the second suite changed the fixture; every fixture of the first suite runs ` +
        `unchanged (F141-FR-039)`,
    );
  }
}

/**
 * No proposer invocation of capture B declares a unit of work or writes a
 * checkpoint. The words a stub must never carry are the words
 * `stubs/lib/proposer.ts` refuses in a script; here the same set is read off
 * the TRANSCRIPT, so a stub binary that took a verb the script reader refuses
 * is still caught.
 */
export function assertStubsDeclareNoUnitOfWork(
  fixture: string,
  transcript: readonly NeutralTranscriptRecord[],
): void {
  const found: string[] = [];
  for (const record of transcript) {
    if (record.role !== "proposer") continue;
    const spoken = [...(record.argv ?? []), ...Object.keys(record.given ?? {}), record.prompt].join(
      " ",
    );
    for (const word of VERBS_A_PROPOSER_STUB_NEVER_HAS) {
      if (spoken.includes(word)) found.push(`call ${String(record.call)}: ${word}`);
    }
  }
  if (found.length > 0) {
    throw new FixtureChangedError(
      `${fixture}: the transcript of capture B carries a unit of work (${found.join(", ")}); the ` +
        `stubs never declare a unit of work (F141-FR-007, F141-FR-039)`,
    );
  }
}

/** The surfaces the second suite compares: S-14 to S-16, the port's alone. */
export const SECOND_SUITE_SURFACES: readonly string[] = Object.freeze([
  "events-primary",
  "control-records",
  "counters",
]);

/** One capture of the second suite is missing a surface of S-14 to S-16. */
export class MissingPortSurfaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingPortSurfaceError";
  }
}

/**
 * Both captures carry S-14 to S-16 (F141-FR-039). Capture A is the first
 * suite's capture: on the port the driver took the three port-only surfaces
 * for it, and the runner refuses a first-suite capture that holds none — a
 * capture A without them would make every assertion of the suite pass on
 * nothing.
 */
export function assertSurfacesOfTheSecondSuite(
  fixture: string,
  capture: Capture,
  which: "A" | "B",
): void {
  const names = new Set(Object.keys(capture.surfaces ?? {}));
  const missing = SECOND_SUITE_SURFACES.filter((surface) => !names.has(surface));
  if (missing.length > 0) {
    throw new MissingPortSurfaceError(
      `${fixture}: capture ${which} does not hold ${missing.join(", ")}; both captures of the ` +
        `second suite include the surfaces S-14 to S-16 (F141-FR-039)`,
    );
  }
}

/** One fixture's run of the second suite, before the comparisons. */
export type SecondSuiteRun = {
  readonly fixture: string;
  /** Capture A: the port with the layer off, as the first suite took it. */
  readonly a: DriveResult;
  /** Capture B: the port with the layer on (row 1 set to `micro`). */
  readonly b: DriveResult;
  /** The two configurations, for the report and for the tests of CT-141-139. */
  readonly configurationA: Readonly<Record<string, unknown>>;
  readonly configurationB: Readonly<Record<string, unknown>>;
};

/**
 * The steps of capture B: the fixture's own steps, unchanged, with the owner
 * decisions applied (`applyOwnerDecisions` of `run/decisions.ts`, which is
 * what the FIRST suite does too, so the two suites drive the same commands).
 */
export function stepsOfCaptureB(steps: readonly Step[]): readonly Step[] {
  return steps;
}

/**
 * The options of capture B, from the options of capture A. Everything is the
 * drive the first suite made — the same fixture object, the same root, the
 * same stub scripts — except the suite and the configuration overlay, which
 * the driver applies to the port's configuration and to nothing else.
 */
export function captureBOptions(a: DriveOptions): DriveOptions {
  return {
    ...a,
    suite: "second",
    configurationOverlay: secondSuiteLayerKeys().reduce<Record<string, string>>(
      (overlay, key) => ({ ...overlay, [key]: SECOND_SUITE_LAYER_VALUE }),
      {},
    ),
  };
}

/** The name the second suite is reported under. */
export const SECOND_SUITE = "second" as const;

/** One line of the runner's own report, for `--tier reference` and the release check. */
export function reportLine(run: SecondSuiteRun): string {
  const strategy = String(run.configurationB["loop.strategy"] ?? "");
  return (
    `${run.fixture}: suite=${SECOND_SUITE} layer=${strategy} ` +
    `surfaces=${SECOND_SUITE_SURFACES.join("+")}`
  );
}

/**
 * The engine stub row the runner must not touch: row 41 names the engine stub,
 * row 1 names the layer, and the second suite changes row 1 and nothing else —
 * this assertion is what keeps a future edit of the runner honest.
 */
export function assertRowUnderTheSecondSuiteIsRowOne(): void {
  const engine = profileRow(ENGINE_SWITCH_ROW);
  if (engine === undefined) {
    throw new SecondSuiteConfigError("row 41 of the parity profile, the engine stub row, is gone");
  }
  if (engine.keys.some((key) => secondSuiteLayerKeys().includes(key))) {
    throw new SecondSuiteConfigError(
      "the engine stub row and the layer row name the same key; the second suite changes row 1 " +
        "and nothing else (F141-FR-039)",
    );
  }
}
