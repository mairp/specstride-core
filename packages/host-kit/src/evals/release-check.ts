/**
 * The release check of a host's trigger suite. Moved once out of
 * `packages/host-claude-code/src/evals/release-check.ts` (the split of the
 * monorepo, U-1 and U-2 of `specs/120-host-dsh`), which keeps the old path and
 * builds this check over its own rules.
 *
 * The suite is a release check and NO check of a change: a release MUST NOT be
 * made unless the log holds a run on the skill texts of that release, matched
 * by their hash, in which every skill reached the host's threshold over the
 * host's number of runs without ablation. The release check READS the log and
 * calls NO model.
 *
 * A HOST SUPPLIES ITS RULES; THE KIT RUNS THE CHECK. The task whose log a
 * release reads, the threshold, the number of runs and the requirement id the
 * reasons name are facts of ONE host — its requirement's own numbers — and
 * travel in one required `ReleaseCheckRules` input of `releaseCheckOf`, with
 * no default anywhere, as in `describe`, `render` and `doctor`: a check that
 * forgot its rules cannot compile into a second host by accident. What the kit
 * fixes is the machinery that must not drift: the reading of the log through
 * the record guard of `./log.ts`, the hash match, the per-skill holding, the
 * refusal of an ablation, and the verdict shape.
 */
import type { PaidRunRecord, SkillResult } from "./log.ts";
import { isPaidRunRecord } from "./log.ts";

/**
 * The release rules of one host: its requirement's own numbers, as its reasons
 * name them. The kit takes no default of any of them and holds each at build
 * time (`releaseCheckOf` refuses a task outside the host's paid tasks, a
 * threshold outside 0 to 1, and a number of runs under one).
 */
export type ReleaseCheckRules = {
  /** The paid task names of the host, as the record guard of `./log.ts` reads them. */
  readonly paidTaskNames: readonly string[];
  /** The paid task whose log a release reads. */
  readonly task: string;
  /** The score every skill must reach in the recorded run. */
  readonly threshold: number;
  /** The number of runs the host's rule pins per skill. */
  readonly requiredRuns: number;
  /** The id of the host requirement the check serves, as its reasons name it. */
  readonly requirementId: string;
};

/** The verdict of the release check. */
export type ReleaseVerdict = {
  readonly passed: boolean;
  readonly reason: string;
};

/** True where a recorded run was made WITH an ablation, which never passes. */
export function runUsedAblation(record: PaidRunRecord): boolean {
  // No ablation exists in a suite of the port; a record that carries
  // `ablation: true` records one, and the check fails it. Anything else is
  // without ablation.
  return (record as { ablation?: unknown }).ablation === true;
}

/**
 * The release check of ONE host, built over its rules and holding them at
 * build time. `skillTextsHash` is the hash of the skill texts of the release
 * that asks; it is matched against `skillTextsHash` of each recorded run.
 * Reads records only — it makes no call of any kind.
 */
export function releaseCheckOf(
  rules: ReleaseCheckRules,
): (log: readonly unknown[], options: { readonly skillTextsHash: string }) => ReleaseVerdict {
  if (!rules.paidTaskNames.includes(rules.task)) {
    throw new Error(
      `releaseCheckOf: the task \`${rules.task}\` a release reads is not one of the host's ` +
        `paid tasks (${rules.paidTaskNames.join(", ")})`,
    );
  }
  if (!(rules.threshold > 0 && rules.threshold <= 1)) {
    throw new Error(
      `releaseCheckOf: the threshold ${rules.threshold} is not a score between 0 and 1`,
    );
  }
  if (!Number.isInteger(rules.requiredRuns) || rules.requiredRuns < 1) {
    throw new Error(
      `releaseCheckOf: the number of runs ${rules.requiredRuns} is not a positive whole number`,
    );
  }
  const { task, threshold, requiredRuns, requirementId } = rules;

  const skillScores = (
    results: readonly SkillResult[],
  ): readonly { skill: string; low: boolean }[] =>
    results
      .filter((result) => result.scored)
      .map((result) => ({
        skill: result.skill,
        low:
          result.scores.length < requiredRuns || result.scores.some((score) => score < threshold),
      }));

  return (
    log: readonly unknown[],
    options: { readonly skillTextsHash: string },
  ): ReleaseVerdict => {
    const records = log
      .filter((record) => isPaidRunRecord(record, rules.paidTaskNames))
      // The trigger suite is the task a release reads: the RULES name its id.
      .filter((record): record is PaidRunRecord => record.task === task);
    const matching = records.filter((record) => record.skillTextsHash === options.skillTextsHash);
    if (records.length === 0) {
      return {
        passed: false,
        // The phrase names the port's own concept — the suite a release reads
        // — not the host's task id, which is a field of the rules.
        reason: `the log holds no run of the trigger suite: no release (${requirementId})`,
      };
    }
    if (matching.length === 0) {
      return {
        passed: false,
        reason:
          "the log holds no run on the skill texts of this release: no hash in the log matches " +
          `${options.skillTextsHash} (${requirementId})`,
      };
    }
    for (const record of matching) {
      if (runUsedAblation(record)) {
        return {
          passed: false,
          reason: `the run of ${record.date} used an ablation (${requirementId})`,
        };
      }
      const low = skillScores(record.resultPerSkill).filter((entry) => entry.low);
      if (low.length > 0) {
        return {
          passed: false,
          reason:
            `the run of ${record.date} does not reach the threshold ${threshold} over ` +
            `${requiredRuns} runs for: ${low.map((entry) => entry.skill).join(", ")} ` +
            `(${requirementId})`,
        };
      }
    }
    return {
      passed: true,
      reason:
        `the log holds ${matching.length} run(s) on this release's skill texts, every skill at ` +
        `the threshold ${threshold} over ${requiredRuns} runs, without ablation`,
    };
  };
}

/** True where the release check would call a model: never. */
export function releaseCheckCallsAModel(): boolean {
  return false;
}
