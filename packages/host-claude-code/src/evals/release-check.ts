/**
 * T035 — the release check of the trigger suite, F113-FR-038 (implemented
 * together with T028, which first exercised it).
 *
 * The suite is a release check and NO check of a change: a release MUST NOT be
 * made unless the log holds a run on the skill texts of that release, matched
 * by their hash, in which every skill reached the threshold 0.8 over three
 * runs without ablation. The release check READS the log and calls NO model.
 *
 * The threshold of 0.8 and the three runs are the requirement's own numbers;
 * no ablation exists anywhere in this feature.
 *
 * The CHECK moved to `@specstride/host-kit` (`src/evals/release-check.ts`
 * there, the split of the monorepo, U-1): the reading of the log through the
 * record guard, the hash match, the per-skill holding, the refusal of an
 * ablation and the verdict shape are the kit's, built over one required
 * `ReleaseCheckRules` input. THIS module holds what is a fact of this host and
 * cannot be the kit's — the task whose log a release reads, the two numbers of
 * F113-FR-038, and the requirement id the reasons name — and binds the kit to
 * them, so every import path of this module keeps its shape and every verdict
 * reads exactly as before the move.
 */
import {
  type ReleaseCheckRules,
  type ReleaseVerdict,
  releaseCheckCallsAModel,
  releaseCheckOf,
  runUsedAblation,
} from "@specstride/host-kit/evals";
import { PAID_TASK_NAMES } from "./log.ts";

/** The threshold of F113-FR-038. */
export const RELEASE_THRESHOLD = 0.8 as const;

/** The number of runs the requirement pins. */
export const REQUIRED_RUNS = 3 as const;

/** The rules of THIS host's release check, as F113-FR-038 states them. */
const RULES: ReleaseCheckRules = {
  paidTaskNames: PAID_TASK_NAMES,
  task: "trigger-suite",
  threshold: RELEASE_THRESHOLD,
  requiredRuns: REQUIRED_RUNS,
  requirementId: "F113-FR-038",
};

/**
 * The release check of this host: the kit's check built over `RULES`.
 * `skillTextsHash` is the hash of the skill texts of the release that asks; it
 * is matched against `skillTextsHash` of each recorded run. Reads records
 * only — it makes no call of any kind.
 */
export const releaseCheck = releaseCheckOf(RULES);

export {
  /** True where a recorded run was made WITH an ablation, which never passes. */
  runUsedAblation,
  /** True where the release check would call a model: never. */
  releaseCheckCallsAModel,
};

export type { ReleaseVerdict };
