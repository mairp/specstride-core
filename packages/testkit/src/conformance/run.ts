#!/usr/bin/env node
/**
 * T277 — the run of a conformance suite and its report (annex A, §A.4;
 * F100-FR-017, F100-FR-020).
 *
 * `runSuite(pointId, implementation, cases)` runs the cases of the point —
 * the contract-level cases of feature 100 and the behaviour cases the content
 * owner adds in the same folder — and reports per case with the point, the
 * implementation, the class and the major. EP-18 is marked as an internal
 * seam in the report (F100-FR-020).
 *
 * The module is also the script `conformance` of the package, with an
 * optional point argument:
 *
 *   npm run conformance --workspace @specstride/testkit
 *   npm run conformance --workspace @specstride/testkit -- EP-08
 *
 * Without an argument it registers the samples of the test tree and runs
 * every suite of every point of `contracts/extension-points/index.json`
 * (F100-FR-222, T158); with one it runs that point only.
 *
 * Exit codes: 0 every case passed, 1 a case failed, 2 usage error.
 */
import process from "node:process";
import test from "node:test";
import assert from "node:assert/strict";
import { INTERNAL_SEAM_POINT, standingOf } from "@specstride/contracts/ep/extension-point";
import type { ExtensionPointStanding } from "@specstride/contracts/ep/extension-point";
import {
  EXTENSION_POINT_COUNT,
  loadExtensionPointIndex,
  registryOf,
  type Implementation,
  type ResolvedRecord,
} from "./frame.ts";

/** The level of a case: the contract level of feature 100, or behaviour. */
export const CASE_LEVELS = ["contract", "behaviour"] as const;
export type CaseLevel = (typeof CASE_LEVELS)[number];

/** One case of the conformance suite of a point. */
export type ConformanceCase = {
  /** The contract-test id, `CT-100-176`, or the content owner's own id. */
  readonly id: string;
  /** What the case checks, in one sentence. */
  readonly title: string;
  /** `contract` for the cases of feature 100; `behaviour` for the owner's. */
  readonly level: CaseLevel;
  /** The requirements the case proves. */
  readonly proves: readonly string[];
  /** Run the case; it throws on a failure, as `node:assert` does. */
  run(implementation: Implementation): void | Promise<void>;
};

/** The report of one case. */
export type CaseReport = {
  readonly caseId: string;
  readonly title: string;
  readonly level: CaseLevel;
  readonly proves: readonly string[];
  readonly passed: boolean;
  readonly message?: string;
  readonly durationMs: number;
};

/** The report of one suite: the point, the implementation, the class, the major. */
export type SuiteReport = {
  readonly ep: string;
  readonly pointId: string;
  readonly implementationId: string;
  readonly implementationClass: string;
  readonly major: number;
  /** F100-FR-020 — `public-contract`, or `internal-seam` for EP-18. */
  readonly standing: ExtensionPointStanding;
  /** True for EP-18 only (F100-FR-020). */
  readonly internalSeam: boolean;
  readonly cases: readonly CaseReport[];
  readonly passed: boolean;
};

/** A suite asked to run on an implementation the registry did not accept. */
export class ImplementationNotRegisteredError extends Error {
  constructor(ep: string, id: string, reason: string) {
    super(
      `the suite of ${ep} cannot run on \`${id}\`: the registry did not accept it ` +
        `(${reason}) (F100-FR-017)`,
    );
    this.name = "ImplementationNotRegisteredError";
  }
}

/**
 * F100-FR-017 — run the cases of the point on a registered implementation and
 * report per case. The implementation is registered here where the caller has
 * not registered it yet, so that a consumer can run the suite on a data
 * implementation on request.
 */
export async function runSuite(
  pointId: string,
  implementation: Implementation,
  cases: readonly ConformanceCase[],
): Promise<SuiteReport> {
  const registry = registryOf(pointId);
  let record = registry.resolved().find((r) => r.implementationId === implementation.id);
  if (record === undefined) {
    const outcome = registry.register(implementation);
    if (!outcome.accepted) {
      throw new ImplementationNotRegisteredError(registry.ep, implementation.id, outcome.message);
    }
    record = outcome.record;
  }
  const reports: CaseReport[] = [];
  for (const one of cases) {
    const started = performance.now();
    try {
      await one.run(implementation);
      reports.push({
        caseId: one.id,
        title: one.title,
        level: one.level,
        proves: one.proves,
        passed: true,
        durationMs: performance.now() - started,
      });
    } catch (error) {
      reports.push({
        caseId: one.id,
        title: one.title,
        level: one.level,
        proves: one.proves,
        passed: false,
        message: error instanceof Error ? error.message : String(error),
        durationMs: performance.now() - started,
      });
    }
  }
  return Object.freeze({
    ep: registry.ep,
    pointId: record.pointId,
    implementationId: record.implementationId,
    implementationClass: record.implementationClass,
    major: record.major,
    standing: standingOf(registry.ep),
    internalSeam: registry.ep === INTERNAL_SEAM_POINT,
    cases: Object.freeze(reports),
    passed: reports.every((r) => r.passed),
  });
}

/** One line of the report of a suite, for the script. */
export function lineOf(report: SuiteReport): string {
  const seam = report.internalSeam ? " [internal seam]" : "";
  const failed = report.cases.filter((c) => !c.passed).length;
  return (
    `${report.ep} ${report.pointId} major ${report.major} ` +
    `impl=${report.implementationId} class=${report.implementationClass}${seam}: ` +
    `${report.cases.length - failed}/${report.cases.length} cases passed`
  );
}

/** The report of a whole run of the script. */
export type RunReport = {
  readonly suites: readonly SuiteReport[];
  /** The points the report names (F100-FR-222: nineteen without an argument). */
  readonly points: readonly string[];
  readonly passed: boolean;
};

/**
 * The cases and the implementation of one point, as the folder of the point
 * offers them. `src/conformance/EP-nn/` holds the contract-level cases of
 * this feature and the behaviour cases the content owner adds in the same
 * folder; a module of the folder exports `cases`.
 */
export type PointSuite = {
  readonly ep: string;
  readonly cases: readonly ConformanceCase[];
};

/** Set while the script runs, so that a case module registers no node:test. */
export const REPORT_MODE_VARIABLE = "SPECSTRIDE_CONFORMANCE_REPORT" as const;

/** True while the script of this module is producing the report. */
export function inReportMode(): boolean {
  return process.env[REPORT_MODE_VARIABLE] === "1";
}

/**
 * Register the cases of a point as tests of `node:test`, unless the script of
 * this module is producing the report. A case module of
 * `src/conformance/EP-nn/` calls this at load, so that the same cases run
 * under `node --test` and under the script `conformance`.
 */
export async function casesAsTests(
  pointId: string,
  implementation: Implementation,
  cases: readonly ConformanceCase[],
): Promise<void> {
  if (inReportMode()) return;
  const report = await runSuite(pointId, implementation, cases);
  for (const one of report.cases) {
    test(`${one.caseId}: ${one.title}`, () => {
      assert.equal(one.passed, true, one.message ?? "the case failed");
    });
  }
  test(`${report.ep}: the report names the point, the implementation, the class and the major`, () => {
    assert.equal(report.pointId, pointId);
    assert.equal(report.implementationId, implementation.id);
    assert.equal(report.implementationClass, implementation.implementationClass);
    assert.equal(report.major, 1);
    assert.equal(report.internalSeam, report.ep === INTERNAL_SEAM_POINT);
  });
}

/** Import the suite module of one point and return its cases. */
async function suiteOf(ep: string): Promise<{
  readonly cases: readonly ConformanceCase[];
  readonly implementation: Implementation;
}> {
  const module = (await import(`./${ep}/contract.test.ts`)) as {
    cases?: readonly ConformanceCase[];
    implementation?: Implementation;
  };
  if (module.cases === undefined || module.implementation === undefined) {
    throw new Error(
      `the suite of ${ep} must export \`cases\` and \`implementation\` ` +
        `(src/conformance/${ep}/contract.test.ts)`,
    );
  }
  return { cases: module.cases, implementation: module.implementation };
}

/**
 * Run every suite, or the suite of one point. `registerSamples()` runs first,
 * so that every point has its sample from the test tree (F100-FR-018).
 */
export async function runEverySuite(only?: string): Promise<RunReport> {
  process.env[REPORT_MODE_VARIABLE] = "1";
  const { registerSamples } = await import("./register-samples.ts");
  const registered: readonly ResolvedRecord[] = await registerSamples();
  const index = loadExtensionPointIndex();
  const points = only === undefined ? index.map((e) => e.ep) : [only];
  if (only !== undefined && !index.some((e) => e.ep === only)) {
    throw new Error(
      `no extension point \`${only}\`: the index holds ` +
        `${index.map((e) => e.ep).join(", ")} (annex A, §A.4)`,
    );
  }
  const suites: SuiteReport[] = [];
  for (const ep of points) {
    const { cases, implementation } = await suiteOf(ep);
    const sample = registered.find((r) => r.ep === ep);
    if (sample === undefined) {
      throw new Error(`the test tree holds no sample of ${ep} (F100-FR-018)`);
    }
    suites.push(await runSuite(implementation.pointId, implementation, cases));
  }
  return Object.freeze({
    suites: Object.freeze(suites),
    points: Object.freeze(points),
    passed: suites.every((s) => s.passed),
  });
}

/** The script `conformance` of the package. */
export async function main(argv: readonly string[]): Promise<number> {
  const args = argv.filter((a) => a !== "");
  if (args.length > 1) {
    process.stderr.write(
      "usage: node src/conformance/run.ts [EP-nn]   (no argument: every point)\n",
    );
    return 2;
  }
  let report: RunReport;
  try {
    report = await runEverySuite(args[0]);
  } catch (error) {
    process.stderr.write(
      `conformance: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return 2;
  }
  for (const suite of report.suites) {
    process.stdout.write(`${lineOf(suite)}\n`);
    for (const one of suite.cases) {
      if (!one.passed) {
        process.stdout.write(`    FAILED ${one.caseId}: ${one.title} — ${one.message}\n`);
      }
    }
  }
  const cases = report.suites.reduce((n, s) => n + s.cases.length, 0);
  const failed = report.suites.reduce((n, s) => n + s.cases.filter((c) => !c.passed).length, 0);
  process.stdout.write(
    `conformance: ${report.points.length} point(s) of ${EXTENSION_POINT_COUNT}, ` +
      `${cases} case(s), ${failed} failure(s)\n`,
  );
  return report.passed ? 0 : 1;
}

/**
 * The script of the package. No top-level `await` here: a suite module of
 * `src/conformance/EP-nn/` imports this module, so a pending top-level await
 * in it would deadlock that import.
 */
const invokedDirectly =
  process.argv[1] !== undefined && process.argv[1].endsWith("/conformance/run.ts");
if (invokedDirectly) {
  void main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
