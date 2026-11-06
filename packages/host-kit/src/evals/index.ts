/**
 * The eval utilities of a host: the log record of a paid task and its reader,
 * the release check over a host's rules, the types of the suite files, the
 * static check of them and of the build configuration, the eval driver, and
 * the stub of a suite runner over a host's record.
 *
 * This module is reached through the SUBPATH `@specstride/host-kit/evals`, not
 * through the package root, as the shim is: the types of the evals name shapes
 * of their own, and the root index already re-exports the port's own value of
 * one of those names (`TriggerCase` of annex H §H.1 has no `kind` and cannot
 * expect no skill; the evals' case of a suite file has both).
 */

/**
 * The log record of a paid task and the reader of the log. A HOST SUPPLIES ITS
 * PAID TASKS; THE KIT HOLDS THE RECORD — the names travel in the required
 * `paidTaskNames` input of the guard and the reader, and the refusal of a run
 * whose configuration names no model is thrown before any call.
 */
export {
  type NotScoredReason,
  type SkillResult,
  type PaidRunRecord,
  INTERRUPTED_EXIT_CODES,
  USAGE_LIMIT_MARKER,
  isPaidRunRecord,
  howARunEnded,
  skillTextsHashOf,
  appendRunRecord,
  readRunLog,
  RunRefusedError,
  modelIdsFromConfiguration,
} from "./log.ts";

/**
 * The release check of a host's trigger suite. A HOST SUPPLIES ITS RULES; THE
 * KIT RUNS THE CHECK — the task whose log a release reads, the threshold, the
 * number of runs and the requirement id the reasons name are one required
 * `ReleaseCheckRules` input of `releaseCheckOf`, held at build time, and the
 * check reads records only.
 */
export {
  type ReleaseCheckRules,
  type ReleaseVerdict,
  runUsedAblation,
  releaseCheckOf,
  releaseCheckCallsAModel,
} from "./release-check.ts";

/**
 * The types of the suite files of a host's trigger suite. The files are the
 * host's own data; the check below takes the parsed values.
 */
export {
  type TriggerCase,
  type TriggerSuiteFile,
  type FreeGrader,
  type ToolRestriction,
  type FreeGraderFile,
} from "./suite-file.ts";

/**
 * The static check of a host's suite files and of its build configuration. A
 * HOST SUPPLIES ITS RULES; THE KIT RUNS THE CHECK — the case minimums, the
 * confusable pair, the markers that name a suite-runner command in a build
 * job, and the requirement ids the failing reasons name travel in one
 * required `StaticCheckRules` input of `staticCheckOf`. The walk that finds a
 * model id and the findings shape are the kit's.
 */
export {
  type StaticCheckRules,
  type StaticFinding,
  type BuildJob,
  MODEL_ID_KEYS,
  containsModelId,
  staticCheckPasses,
  staticCheckOf,
  staticCheckCallsAModel,
  SuiteRunnerInBuildError,
} from "./static-check.ts";

/**
 * The eval driver, as the build runs it: one result per case, on a stub. The
 * driver holds no fact of any host — the suite and the runner are its inputs,
 * and an interrupted run or a run ended by a usage limit is not scored.
 */
export {
  type RecordedCaseResult,
  type SuiteRunner,
  type CaseReport,
  evalDriverRun,
  evalDriverCallsAModel,
} from "./eval-driver.ts";

/**
 * The stub of a host's suite runner. A HOST SUPPLIES ITS RECORD; THE KIT
 * REPLAYS IT — the recorded results are keyed by the host's own case ids and
 * travel in the required `results` input of `stubSuiteRunner`.
 */
export { stubSuiteRunner } from "./stub-runner.ts";
