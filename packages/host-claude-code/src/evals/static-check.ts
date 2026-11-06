/**
 * T033 — the static check of the suite files and of the build configuration
 * (F113-FR-041). The per-change build MUST call no model and no paid or
 * external API; for the evals it checks what can be checked WITHOUT a model
 * call:
 *
 *   (a) the suite files: the case counts of F113-FR-038 (at least six positive
 *       and six negative cases per skill), the confusable pair run and reverse,
 *       the restriction of tools so that no run can launch, and that no file
 *       holds a model id (F113-FR-039: the model comes from the configuration
 *       of the run);
 *   (b) the build configuration: no job of the build starts the host's suite
 *       runner — the build fails when one would (F113-FR-041, last sentence).
 *
 * Part (c), the token budget of each host skill, is the static size check of
 * T025 (`tests/ci-checks/checks.ts`) and the budget check of `src/render/`;
 * this module does not restate it. Part (b) of F113-FR-041, the eval driver on
 * the stub of the host's suite runner, is `./eval-driver.ts` and
 * `./stub-runner.ts`.
 *
 * The CHECK moved to `@specstride/host-kit` (`src/evals/static-check.ts`
 * there, the split of the monorepo, U-1): the walk that finds a model id, the
 * findings shape, the reading of a graders file and the aggregation are the
 * kit's, built over one required `StaticCheckRules` input. THIS module holds
 * what is a fact of this host and cannot be the kit's — the case minimums of
 * F113-FR-038, the confusable pair of its suites, the three markers that name
 * a suite-runner command of THIS host (its CLI with its eval command, and its
 * person-run runner), and the requirement ids the failing reasons name — and
 * binds the kit to them, so every import path of this module keeps its shape
 * and every finding reads exactly as before the move.
 */
import {
  type BuildJob,
  type StaticCheckRules,
  MODEL_ID_KEYS,
  containsModelId,
  staticCheckCallsAModel,
  staticCheckOf,
  staticCheckPasses,
} from "@specstride/host-kit/evals";

/** The case counts of F113-FR-038: at least six positive and six negative. */
export const MIN_POSITIVE_CASES_PER_SKILL = 6 as const;
export const MIN_NEGATIVE_CASES_PER_SKILL = 6 as const;

/** The confusable pair of F113-FR-038, as the suite files name it. */
export const CONFUSABLE_PAIR = "run-reverse" as const;

/**
 * What marks a command of the build as one that would start the host's suite
 * runner: the host CLI with its eval command, or the person-run runner of this
 * feature (F113-FR-041: the build fails when one of its jobs would).
 */
export const SUITE_RUNNER_MARKERS: readonly RegExp[] = Object.freeze([
  /\bclaude\b[^|;&]*\bplugin\s+eval\b/,
  /\bplugin\s+eval\b/,
  /evals[\\/]trigger-suite\.ts/,
]);

/** The static rules of THIS host, as F113-FR-038, F113-FR-039 and F113-FR-041 state them. */
const RULES: StaticCheckRules = {
  positiveCasesPerSkill: MIN_POSITIVE_CASES_PER_SKILL,
  negativeCasesPerSkill: MIN_NEGATIVE_CASES_PER_SKILL,
  confusablePair: CONFUSABLE_PAIR,
  suiteRunnerMarkers: SUITE_RUNNER_MARKERS,
  requirementIds: {
    suiteCases: "F113-FR-038",
    noModelId: "F113-FR-039",
    buildNoSuiteRunner: "F113-FR-041",
  },
};

/** The static check of this host: the kit's check built over `RULES`. */
const CHECK = staticCheckOf(RULES);

export {
  /** The keys a model id would hide behind (F113-FR-039: there is none). */
  MODEL_ID_KEYS,
  /** True where a parsed value hides a model id behind one of the keys. */
  containsModelId,
  /** True where every finding of a static check passed. */
  staticCheckPasses,
  /** True where the whole static check would call a model: never. */
  staticCheckCallsAModel,
};

export type { BuildJob };

export const checkOneSuite = CHECK.checkOneSuite;
export const checkGraders = CHECK.checkGraders;
export const checkSuiteFiles = CHECK.checkSuiteFiles;
export const jobsThatStartTheSuiteRunner = CHECK.jobsThatStartTheSuiteRunner;
export const assertNoJobStartsTheSuiteRunner = CHECK.assertNoJobStartsTheSuiteRunner;

/** The error the build fails with (F113-FR-041, last sentence). */
export { SuiteRunnerInBuildError } from "@specstride/host-kit/evals";
