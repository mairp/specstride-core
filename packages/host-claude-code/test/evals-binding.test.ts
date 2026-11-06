/**
 * The binding of the eval log, release check, static check, driver and stub to
 * THIS host (`src/evals/log.ts`, `release-check.ts`, `static-check.ts`,
 * `eval-driver.ts`, `stub-runner.ts`). The modules moved to
 * `@specstride/host-kit/evals` (the split of the monorepo, U-1); this file
 * holds that the old paths still export every name they exported, that the
 * kit's machinery is built over exactly THIS host's paid tasks, rules and
 * record, and that the kit namespace exports no fact of this host.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as kitEvals from "@specstride/host-kit/evals";
import {
  INTERRUPTED_EXIT_CODES,
  type PaidRunRecord,
  PAID_TASK_NAMES,
  RunRefusedError,
  USAGE_LIMIT_MARKER,
  appendRunRecord,
  howARunEnded,
  isPaidRunRecord,
  modelIdsFromConfiguration,
  readRunLog,
  skillTextsHashOf,
} from "../src/evals/log.ts";
import {
  RELEASE_THRESHOLD,
  REQUIRED_RUNS,
  releaseCheck,
  releaseCheckCallsAModel,
  runUsedAblation,
} from "../src/evals/release-check.ts";
import {
  CONFUSABLE_PAIR,
  type BuildJob,
  MIN_NEGATIVE_CASES_PER_SKILL,
  MIN_POSITIVE_CASES_PER_SKILL,
  MODEL_ID_KEYS,
  SUITE_RUNNER_MARKERS,
  SuiteRunnerInBuildError,
  assertNoJobStartsTheSuiteRunner,
  checkOneSuite,
  checkSuiteFiles,
  containsModelId,
  jobsThatStartTheSuiteRunner,
  staticCheckCallsAModel,
  staticCheckPasses,
} from "../src/evals/static-check.ts";
import { evalDriverCallsAModel, evalDriverRun } from "../src/evals/eval-driver.ts";
import type { TriggerCase, TriggerSuiteFile } from "../src/evals/suite-file.ts";
import {
  RECORDED_INTERRUPTED_EXIT_CODE,
  RECORDED_STUB_RESULTS,
  RECORDED_USAGE_LIMIT_MARKER,
  stubSuiteRunner,
} from "../src/evals/stub-runner.ts";

/** A recorded run of this host's trigger suite, on the given scores. */
function scoredRun(overrides?: { readonly scores?: readonly number[] }): PaidRunRecord {
  return {
    date: "2026-11-07",
    task: "trigger-suite",
    modelIds: [["model", "of", "the", "run"].join("-")],
    calls: 12,
    cost: "1.04",
    skillTextsHash: "c".repeat(64),
    resultPerSkill: [
      { skill: "specstride-run", scores: overrides?.scores ?? [0.9, 0.9, 0.9], scored: true },
    ],
    runsNotScored: [],
  };
}

test("T035: the old paths keep every name, and the machinery is the kit's", () => {
  assert.deepEqual(
    [...PAID_TASK_NAMES],
    ["trigger-suite", "behaviour-smoke", "with-and-without-report"],
  );
  assert.equal(RELEASE_THRESHOLD, 0.8);
  assert.equal(REQUIRED_RUNS, 3);
  assert.equal(USAGE_LIMIT_MARKER, "usage-limit");
  assert.deepEqual([...INTERRUPTED_EXIT_CODES], [130, 143]);
  assert.equal(releaseCheckCallsAModel(), false);
  // The classification, the hash, the writer, the refusal and the model ids
  // are the kit's own functions and values, reached through the binding.
  assert.equal(howARunEnded, kitEvals.howARunEnded);
  assert.equal(skillTextsHashOf, kitEvals.skillTextsHashOf);
  assert.equal(appendRunRecord, kitEvals.appendRunRecord);
  assert.equal(RunRefusedError, kitEvals.RunRefusedError);
  assert.equal(modelIdsFromConfiguration, kitEvals.modelIdsFromConfiguration);
  assert.equal(runUsedAblation, kitEvals.runUsedAblation);
  assert.equal(releaseCheckCallsAModel, kitEvals.releaseCheckCallsAModel);
});

test("T035: the kit machinery is built over exactly this host's paid tasks and rules", () => {
  // The guard refuses a task that is not one of the three paid tasks.
  assert.equal(isPaidRunRecord(scoredRun()), true);
  assert.equal(isPaidRunRecord({ ...scoredRun(), task: "a-nightly-job" }), false);
  // The release check is the kit's check built over THESE rules: rebuilt from
  // the kit over the same rules, it gives the same verdicts.
  const rebuilt = kitEvals.releaseCheckOf({
    paidTaskNames: PAID_TASK_NAMES,
    task: "trigger-suite",
    threshold: RELEASE_THRESHOLD,
    requiredRuns: REQUIRED_RUNS,
    requirementId: "F113-FR-038",
  });
  const log = [scoredRun()];
  assert.deepEqual(
    rebuilt(log, { skillTextsHash: "c".repeat(64) }),
    releaseCheck(log, { skillTextsHash: "c".repeat(64) }),
  );
  // The verdicts read as this host's requirement words them, byte for byte.
  const noRun = releaseCheck([], { skillTextsHash: "c".repeat(64) });
  assert.equal(noRun.passed, false);
  assert.equal(noRun.reason, "the log holds no run of the trigger suite: no release (F113-FR-038)");
  const pass = releaseCheck(log, { skillTextsHash: "c".repeat(64) });
  assert.equal(pass.passed, true);
  assert.match(pass.reason, /threshold 0\.8 over 3 runs/);
  const under = releaseCheck([scoredRun({ scores: [0.7, 0.9, 0.9] })], {
    skillTextsHash: "c".repeat(64),
  });
  assert.equal(under.passed, false);
  assert.equal(
    under.reason,
    "the run of 2026-11-07 does not reach the threshold 0.8 over 3 runs for: " +
      "specstride-run (F113-FR-038)",
  );
  // The refusal of a run whose configuration names no model is thrown before
  // any call, with the kit's message.
  assert.throws(() => modelIdsFromConfiguration({ modelIds: [] }), RunRefusedError);
  try {
    modelIdsFromConfiguration({ modelIds: [] });
    assert.fail("the run was not refused");
  } catch (error) {
    assert.match((error as Error).message, /^refused before any call/);
  }
});

test("T033: the static check binding keeps every old name, and the machinery is the kit's", () => {
  assert.equal(MIN_POSITIVE_CASES_PER_SKILL, 6);
  assert.equal(MIN_NEGATIVE_CASES_PER_SKILL, 6);
  assert.equal(CONFUSABLE_PAIR, "run-reverse");
  assert.equal(SUITE_RUNNER_MARKERS.length, 3, "this host's three suite-runner markers");
  assert.equal(staticCheckCallsAModel(), false);
  // The walks and the aggregations are the kit's own functions and values,
  // reached through the binding; the built check is the kit's over THESE rules.
  assert.equal(containsModelId, kitEvals.containsModelId);
  assert.equal(staticCheckPasses, kitEvals.staticCheckPasses);
  assert.equal(staticCheckCallsAModel, kitEvals.staticCheckCallsAModel);
  assert.equal(SuiteRunnerInBuildError, kitEvals.SuiteRunnerInBuildError);
  assert.deepEqual([...MODEL_ID_KEYS], [...kitEvals.MODEL_ID_KEYS]);
});

test("T033: the bound check is the kit's check rebuilt over exactly this host's rules", () => {
  const rebuilt = kitEvals.staticCheckOf({
    positiveCasesPerSkill: MIN_POSITIVE_CASES_PER_SKILL,
    negativeCasesPerSkill: MIN_NEGATIVE_CASES_PER_SKILL,
    confusablePair: CONFUSABLE_PAIR,
    suiteRunnerMarkers: SUITE_RUNNER_MARKERS,
    requirementIds: {
      suiteCases: "F113-FR-038",
      noModelId: "F113-FR-039",
      buildNoSuiteRunner: "F113-FR-041",
    },
  });
  const five: TriggerSuiteFile = {
    skill: "specstride-run",
    cases: Array.from({ length: 5 }, (_, index): TriggerCase => ({
      id: `probe-${index + 1}`,
      kind: index % 2 === 0 ? "positive" : "negative",
      prompt: `a probe prompt ${index + 1}`,
      expected: "specstride-run",
    })),
  };
  assert.deepEqual(checkOneSuite(five), rebuilt.checkOneSuite(five));
  assert.deepEqual(
    checkSuiteFiles([five], { toolRestriction: { allowedTools: [], launchImpossible: true } }),
    rebuilt.checkSuiteFiles([five], {
      toolRestriction: { allowedTools: [], launchImpossible: true },
    }),
  );
  const positive = checkOneSuite(five).find((finding) => finding.check === "case-counts-positive");
  assert.equal(positive?.ok, false);
  assert.equal(
    positive?.detail,
    "specstride-run holds 3 positive cases; F113-FR-038 needs at least 6",
  );
  // A build job that starts THIS host's suite runner fails with THIS host's id.
  const offender: BuildJob = {
    declaredIn: `package.json script "eval"`,
    command: `node evals/trigger-suite.ts out.jsonl`,
  };
  assert.deepEqual([...jobsThatStartTheSuiteRunner([offender])], [offender]);
  assert.throws(() => assertNoJobStartsTheSuiteRunner([offender]), SuiteRunnerInBuildError);
  try {
    assertNoJobStartsTheSuiteRunner([offender]);
    assert.fail("the build did not fail");
  } catch (error) {
    assert.ok(error instanceof SuiteRunnerInBuildError);
    assert.match(error.message, /F113-FR-041/);
    assert.deepEqual([...error.offenders], [offender]);
  }
});

test("T033: the driver binding is the kit's driver, and the stub record is this host's", () => {
  assert.equal(evalDriverRun, kitEvals.evalDriverRun);
  assert.equal(evalDriverCallsAModel, kitEvals.evalDriverCallsAModel);
  // The recorded figures of THIS record are this record's face of the kit's
  // run mechanics.
  assert.equal(RECORDED_INTERRUPTED_EXIT_CODE, 130);
  assert.equal(RECORDED_INTERRUPTED_EXIT_CODE, kitEvals.INTERRUPTED_EXIT_CODES[0]);
  assert.equal(RECORDED_USAGE_LIMIT_MARKER, "usage-limit");
  assert.equal(RECORDED_USAGE_LIMIT_MARKER, kitEvals.USAGE_LIMIT_MARKER);
  assert.equal(Object.keys(RECORDED_STUB_RESULTS).length, 36, "one record per case of the suites");
  const runner = stubSuiteRunner();
  assert.equal(runner.kind, "stub");
  assert.equal(
    runner.runCase({ id: "run-pos-3", kind: "positive", prompt: "p", expected: "x" }).exitCode,
    130,
  );
  // The kit's replay takes a record: this host's is bound, not the kit's.
  assert.equal(Object.keys(kitEvals).includes("RECORDED_STUB_RESULTS"), false);
});

test("T035: the reader and the writer round-trip through the binding", () => {
  const directory = mkdtempSync(join(tmpdir(), "host-claude-code-evals-binding-"));
  try {
    const path = join(directory, "paid-runs.jsonl");
    appendRunRecord(path, scoredRun());
    writeFileSync(
      path,
      `${readFileSync(path, "utf8")}${JSON.stringify({ date: "2026-11-07", task: "a-nightly-job" })}\n`,
      "utf8",
    );
    const log = readRunLog(path);
    assert.equal(log.length, 1, "a line that is not a record of this host is skipped");
    assert.equal(log[0]?.task, "trigger-suite");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("T035: the kit namespace exports no fact of this host", () => {
  const exports = Object.keys(kitEvals);
  for (const foreign of [
    "PAID_TASK_NAMES",
    "PaidTaskName",
    "RELEASE_THRESHOLD",
    "REQUIRED_RUNS",
    "releaseCheck",
    "RECORDED_STUB_RESULTS",
    "SUITE_RUNNER_MARKERS",
    "MIN_POSITIVE_CASES_PER_SKILL",
    "CONFUSABLE_PAIR",
  ]) {
    assert.equal(exports.includes(foreign), false, `the kit namespace must not hold ${foreign}`);
  }
  for (const foreign of ["trigger-suite", "behaviour-smoke", "with-and-without-report"]) {
    assert.equal(
      exports.some((name) => name.toLowerCase().includes(foreign)),
      false,
      `the kit namespace names no paid task of this host (${foreign})`,
    );
  }
});
