/**
 * T059 — the comparator and the report of results (F141-FR-021, F141-FR-024).
 *
 * "The comparator MUST give, per fixture and surface, exactly one of `equal`,
 * `waived (<register row>)` and `different`, as §O.5 defines them. A capture that
 * is missing or unreadable MUST give `different`."
 *
 * In order:
 *
 * 1. the assertions before normalization (`assertions.ts`). A failed assertion
 *    gives `different` on the surface it names, and on every surface where it names
 *    none;
 * 2. a surface that one side could not capture gives `different` — never `equal`,
 *    which is why `captureSurfaces` records a missing surface with its reason
 *    instead of an empty value;
 * 3. both captures through the rules N-01 to N-29;
 * 4. the differences of each surface. No difference is `equal`. Every difference
 *    matched by a waiver of this fixture and this surface is `waived (<row>)`.
 *    Anything else is `different`;
 * 5. a line that only the port prints is a `different` that NOTHING removes
 *    (F141-FR-024, DV-034): `portOnlyLines` finds them before the waivers are
 *    consulted, and `waiverFor` is never asked about them.
 *
 * The report is `data/schemas/result.schema.json`, and `resultReport` builds a
 * value that the schema accepts.
 */
import {
  normalize,
  reportOf,
  type NormalizeContext,
  type NormalizedCapture,
} from "../normalize/index.ts";
import {
  assertBeforeNormalization,
  type AssertionFailure,
  type CaptureForAssertions,
} from "./assertions.ts";
import {
  assertEveryWaiverMatchedSomething,
  useOfWaivers,
  waiverFor,
  type Difference,
  type Waiver,
} from "../waivers/waivers.ts";
import { applyLaunchContractKeyMap, type KeyNameMapping } from "./key-names.ts";
import { applyNotCompared, NOT_COMPARED_ROWS, type NotComparedDrop } from "./not-compared.ts";

/** The three results of §O.5, which annex X §X.6 holds as a closed set (row 86). */
export const RESULTS = ["equal", "waived", "different"] as const;
export type Result = (typeof RESULTS)[number];

/** The unknown value of the set: anything the comparator cannot place is `different`. */
export const UNKNOWN_RESULT: Result = "different";

/** The result of one surface. */
export type SurfaceResult = {
  readonly result: Result;
  /** The register row, where the result is `waived`. */
  readonly row?: string;
  /** The assertions that failed on this surface. */
  readonly assertions?: readonly string[];
  /** The differences the comparator found. */
  readonly differences?: readonly Difference[];
};

/** The report of one comparison (`data/schemas/result.schema.json`). */
export type ResultReport = {
  readonly schema: string;
  readonly suite: "first" | "second";
  readonly tier?: "hermetic" | "reference" | "platform";
  readonly fixture: string;
  readonly skipped?: { readonly reason: string };
  readonly results: Readonly<Record<string, SurfaceResult>>;
  readonly replacements: Readonly<Record<string, number>>;
  readonly counters?: Readonly<Record<string, unknown>>;
};

/** The id of the schema of a report. */
export const RESULT_SCHEMA_ID = "urn:specstride:schema:internal:141:oracle-result/1" as const;

/** A capture of one side, as the driver made it. */
export type CaptureOfASide = {
  readonly scenario: string;
  readonly side: "reference" | "port";
  readonly suite?: "first" | "second";
  readonly layer?: "off" | "on";
  readonly surfaces: Readonly<Record<string, unknown>>;
  readonly missing?: Readonly<Record<string, string>>;
};

/**
 * Every difference between two normalized values of one surface, as selectors into
 * the value. A selector is a path such as `entries/3/content`, which is what a
 * waiver names.
 */
export function differencesOf(
  fixture: string,
  surface: string,
  reference: unknown,
  port: unknown,
): readonly Difference[] {
  const found: Difference[] = [];
  const walk = (left: unknown, right: unknown, at: string): void => {
    if (JSON.stringify(left) === JSON.stringify(right)) return;
    if (
      left !== null &&
      right !== null &&
      typeof left === "object" &&
      typeof right === "object" &&
      Array.isArray(left) === Array.isArray(right)
    ) {
      const keys = [
        ...new Set([
          ...Object.keys(left as Record<string, unknown>),
          ...Object.keys(right as Record<string, unknown>),
        ]),
      ];
      for (const key of keys) {
        walk(
          (left as Record<string, unknown>)[key],
          (right as Record<string, unknown>)[key],
          at === "" ? key : `${at}/${key}`,
        );
      }
      return;
    }
    found.push({
      fixture,
      surface,
      selector: at === "" ? surface : at,
      reference: left,
      port: right,
    });
  };
  walk(reference, port, "");
  return Object.freeze(found);
}

/**
 * The lines a compared stream of the port prints that the reference has no
 * equivalent for (F141-FR-024, DV-034). Nothing removes them: they are found here,
 * before the waivers are consulted, and the result of the surface is `different`.
 */
export function portOnlyLines(reference: unknown, port: unknown): readonly string[] {
  const linesOf = (value: unknown): string[] => {
    const text = (value as { text?: unknown } | undefined)?.text;
    if (typeof text !== "string") return [];
    return text.split("\n").filter((line) => line.trim() !== "");
  };
  const theirs = new Set(linesOf(reference));
  return Object.freeze(linesOf(port).filter((line) => !theirs.has(line)));
}

/** The streams on which a line that only the port prints is looked for. */
export const COMPARED_STREAMS: readonly string[] = Object.freeze(["stdout", "stderr"]);

/** What the comparator was asked to compare. */
export type CompareOptions = {
  readonly fixture: string;
  readonly suite?: "first" | "second";
  readonly tier?: "hermetic" | "reference" | "platform";
  readonly waivers?: readonly Waiver[];
  /** The context each side is normalized with; the roots differ per side. */
  readonly referenceContext: NormalizeContext;
  readonly portContext: NormalizeContext;
  /** A side that could not be run at all makes the comparison a skip with its reason. */
  readonly skipped?: { readonly reason: string };
};

/** What one comparison gives back. */
export type Comparison = {
  readonly report: ResultReport;
  readonly normalized: {
    readonly reference: NormalizedCapture;
    readonly port: NormalizedCapture;
  };
  readonly assertions: readonly AssertionFailure[];
  readonly differences: readonly Difference[];
  /**
   * The key-name map of the launch contract, as it was applied to the port's
   * capture: how many names it replaced and the rows of the register it is the
   * handling of (DV-055, DV-120). It is not a normalization rule and is therefore
   * not in `report.replacements`, which counts N-01 to N-29 only.
   */
  readonly keyNames: KeyNameMapping;
  /**
   * The members of a launch contract that the register does **not** compare, as
   * they were dropped from the two captures: how many members went and the rows of
   * the register it is the handling of (DV-061, DV-097). Like `keyNames` it is the
   * handling of a register row and not a normalization rule, so it is not in
   * `report.replacements` either.
   */
  readonly notCompared: NotComparedDrop;
};

/** Compare two captures of one scenario, surface by surface. */
export function compare(
  referenceAsCaptured: CaptureOfASide,
  portAsCaptured: CaptureOfASide,
  options: CompareOptions,
): Comparison {
  // The key-name map of the launch contract, before anything else reads the port's
  // capture: two members of the contract are named differently on the two sides and
  // the register handles both as "mapped" (DV-055, DV-120, F141-FR-023). The
  // reference's capture is never touched.
  const { capture: mappedPort, mapping: keyNames } = applyLaunchContractKeyMap(portAsCaptured);
  // Then the members the register takes out of the comparison altogether, on BOTH
  // sides: the five configuration keys of the baseline with no reader (DV-061) and
  // the two members only the product writes (DV-097). Both rows read "not compared"
  // in `consolidation.md` section 6.
  const droppedReference = applyNotCompared(referenceAsCaptured);
  const droppedPort = applyNotCompared(mappedPort);
  const reference = droppedReference.capture;
  const port = droppedPort.capture;
  const notCompared: NotComparedDrop = {
    dropped: droppedReference.drop.dropped + droppedPort.drop.dropped,
    rows:
      droppedReference.drop.dropped + droppedPort.drop.dropped === 0
        ? Object.freeze([])
        : NOT_COMPARED_ROWS,
  };
  if (options.skipped !== undefined) {
    return {
      report: {
        schema: RESULT_SCHEMA_ID,
        suite: options.suite ?? "first",
        ...(options.tier === undefined ? {} : { tier: options.tier }),
        fixture: options.fixture,
        skipped: options.skipped,
        results: {},
        replacements: {},
      },
      normalized: {
        reference: normalize(reference, options.referenceContext),
        port: normalize(port, options.portContext),
      },
      assertions: [],
      differences: [],
      keyNames,
      notCompared,
    };
  }

  // 1. the assertions, on the captures as they were captured.
  const forAssertions: CaptureForAssertions[] = [reference, port];
  const assertions = assertBeforeNormalization(
    forAssertions[0] as CaptureForAssertions,
    forAssertions[1] as CaptureForAssertions,
  );

  // 2 and 3. the rules.
  const normalizedReference = normalize(reference, options.referenceContext);
  const normalizedPort = normalize(port, options.portContext);

  const surfaces = [
    ...new Set([
      ...Object.keys(normalizedReference.surfaces),
      ...Object.keys(normalizedPort.surfaces),
      ...Object.keys(normalizedReference.missing),
      ...Object.keys(normalizedPort.missing),
    ]),
  ].sort();

  const results: Record<string, SurfaceResult> = {};
  const everyDifference: Difference[] = [];

  for (const surface of surfaces) {
    const failed = assertions.filter((a) => a.surface === undefined || a.surface === surface);
    const missing =
      normalizedReference.missing[surface] ?? normalizedPort.missing[surface] ?? undefined;

    if (missing !== undefined) {
      // A capture that is missing or unreadable gives `different` (F141-FR-021).
      results[surface] = {
        result: "different",
        differences: [
          {
            fixture: options.fixture,
            surface,
            selector: surface,
            reference: `missing: ${missing}`,
            port: `missing: ${missing}`,
          },
        ],
        ...(failed.length === 0 ? {} : { assertions: failed.map((a) => a.detail) }),
      };
      continue;
    }

    // A line that only the port prints: nothing removes it (F141-FR-024).
    const onlyPort = COMPARED_STREAMS.includes(surface)
      ? portOnlyLines(normalizedReference.surfaces[surface], normalizedPort.surfaces[surface])
      : [];

    const differences = differencesOf(
      options.fixture,
      surface,
      normalizedReference.surfaces[surface],
      normalizedPort.surfaces[surface],
    );
    everyDifference.push(...differences);

    if (failed.length > 0) {
      // A failed assertion gives `different` (F141-FR-021).
      results[surface] = {
        result: "different",
        assertions: failed.map((a) => a.detail),
        ...(differences.length === 0 ? {} : { differences }),
      };
      continue;
    }
    if (onlyPort.length > 0) {
      results[surface] = {
        result: "different",
        differences: [
          ...differences,
          ...onlyPort.map((line) => ({
            fixture: options.fixture,
            surface,
            selector: "a line that only the port prints",
            reference: null,
            port: line,
          })),
        ],
      };
      continue;
    }
    if (differences.length === 0) {
      results[surface] = { result: "equal" };
      continue;
    }
    // Every difference matched by a waiver of THIS fixture and THIS surface.
    const waivers = options.waivers ?? [];
    const matched = differences.map((difference) => waiverFor(waivers, difference));
    if (matched.every((waiver) => waiver !== undefined)) {
      const rows = [...new Set(matched.map((waiver) => (waiver as Waiver).row))];
      results[surface] = {
        result: "waived",
        row: rows[0] as string,
        differences,
      };
      continue;
    }
    results[surface] = { result: "different", differences };
  }

  // The findings of the rules that report one (a cache inside the working
  // directory, an escape sequence where colour is off) are differences of their
  // own: a capture that holds one is not `equal`.
  for (const finding of [...normalizedReference.findings, ...normalizedPort.findings]) {
    const surface = finding.startsWith("N-25") ? "tree" : "stdout";
    if (results[surface] !== undefined) {
      results[surface] = {
        result: "different",
        assertions: [...(results[surface]?.assertions ?? []), finding],
        ...(results[surface]?.differences === undefined
          ? {}
          : { differences: results[surface]?.differences }),
      };
    }
  }

  const replacements: Record<string, number> = {};
  for (const [id, count] of Object.entries(normalizedReference.counts)) {
    replacements[id] = count + (normalizedPort.counts[id] ?? 0);
  }

  return {
    report: {
      schema: RESULT_SCHEMA_ID,
      suite: options.suite ?? "first",
      ...(options.tier === undefined ? {} : { tier: options.tier }),
      fixture: options.fixture,
      results: Object.freeze(results),
      replacements: Object.freeze(replacements),
    },
    normalized: { reference: normalizedReference, port: normalizedPort },
    assertions,
    differences: Object.freeze(everyDifference),
    keyNames,
    notCompared,
  };
}

/** The result of one surface of a report, or `different` where the report has none. */
export function resultOf(report: ResultReport, surface: string): Result {
  return report.results[surface]?.result ?? UNKNOWN_RESULT;
}

/** True when no surface of a report reads `different`. */
export function nothingIsDifferent(report: ResultReport): boolean {
  return Object.values(report.results).every((r) => r.result !== "different");
}

/** The report of a suite: the counts per rule and the waivers that matched nothing. */
export function suiteOutcome(
  comparisons: readonly Comparison[],
  waivers: readonly Waiver[],
): {
  readonly normalization: ReturnType<typeof reportOf>;
  readonly waiverUse: ReturnType<typeof useOfWaivers>;
  readonly different: readonly string[];
} {
  const normalized = comparisons.flatMap((c) => [c.normalized.reference, c.normalized.port]);
  const differences = comparisons.flatMap((c) => c.differences);
  const different: string[] = [];
  for (const comparison of comparisons) {
    for (const [surface, result] of Object.entries(comparison.report.results)) {
      if (result.result === "different")
        different.push(`${comparison.report.fixture} / ${surface}`);
    }
  }
  return {
    normalization: reportOf(normalized),
    waiverUse: useOfWaivers(waivers, differences),
    different: Object.freeze(different),
  };
}

export { assertEveryWaiverMatchedSomething };
