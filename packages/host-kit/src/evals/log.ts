/**
 * The log record of a PAID task of a host, and the reader of that log. Moved
 * once out of `packages/host-claude-code/src/evals/log.ts` (the split of the
 * monorepo, U-1 and U-2 of `specs/120-host-dsh`), which keeps the old path and
 * binds these functions to its own paid tasks.
 *
 * A paid task (a trigger suite, a behaviour smoke, a with-and-without report)
 * is started by a PERSON and is logged. The fields of the record are the row
 * "Log record of a paid task" of the port's data model, in their order:
 *
 * | date | task | model ids (from the configuration of the run) | number of
 * calls | cost | hash of the skill texts | result per skill | runs not scored |
 *
 * A HOST SUPPLIES ITS PAID TASKS; THE KIT HOLDS THE RECORD. No name of any
 * host's paid tasks is a constant here: the names travel in the required
 * `paidTaskNames` input of `isPaidRunRecord` and `readRunLog`, and the task
 * whose log a release check reads is one required field of the
 * `ReleaseCheckRules` of `./release-check.ts`. No module here calls a model.
 * The log is written by the person's run and read by that release check, which
 * calls no model.
 */
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";

/**
 * The exit codes of an interrupted run: 130 and 143, the interruptions a
 * POSIX runner reports. An interrupted run and a run ended by a usage limit
 * are NOT a score failure; the suite reports them as not scored.
 */
export const INTERRUPTED_EXIT_CODES: readonly number[] = Object.freeze([130, 143]);

/** The marker a run carries when the host ended it on its usage limit. */
export const USAGE_LIMIT_MARKER = "usage-limit" as const;

/** Why a run was not scored. */
export type NotScoredReason = "interrupted" | "usage-limit" | "not-started";

/** The result of one skill inside one recorded run. */
export type SkillResult = {
  /** The logical id of the skill (row 144 of annex X §X.6). */
  readonly skill: string;
  /** The score of each completed run of the suite, between 0 and 1. */
  readonly scores: readonly number[];
  /** False where the run was interrupted or ended by a usage limit. */
  readonly scored: boolean;
  /** Why the run is not scored, where it is not. */
  readonly notScoredReason?: NotScoredReason;
  /** The exit code of an interrupted run, where there was one. */
  readonly interruptedExitCode?: number;
};

/**
 * One record of the log of a paid task — the row of the port's data model,
 * field for field, in its order. The kit narrows `task` to no host's names:
 * the names are the `paidTaskNames` input of the guard and the reader, and a
 * host re-narrows the field over its own constant at its binding.
 */
export type PaidRunRecord = {
  /** The date of the run (ISO-8601). */
  readonly date: string;
  /** Which paid task ran: one of the host's own paid task names. */
  readonly task: string;
  /** The model ids, from the CONFIGURATION of the run, never from a file. */
  readonly modelIds: readonly string[];
  /** The number of model calls the run made. */
  readonly calls: number;
  /** The cost of the run, in the currency of the credential. */
  readonly cost: string;
  /** The hash of the skill texts the run measured (sha256, hex). */
  readonly skillTextsHash: string;
  /** The result per skill. */
  readonly resultPerSkill: readonly SkillResult[];
  /** The runs that were not scored, with their reason. */
  readonly runsNotScored: readonly { readonly skill: string; readonly reason: NotScoredReason }[];
};

/**
 * True where the record is well formed enough for a release check to read, and
 * its `task` is one of the GIVEN host's paid task names. The names are a
 * required input: the kit holds no table of a host's paid tasks, so the same
 * record is a record of the host that names its task and unknown to another.
 */
export function isPaidRunRecord(
  value: unknown,
  paidTaskNames: readonly string[],
): value is PaidRunRecord {
  const record = value as PaidRunRecord;
  return (
    typeof record === "object" &&
    record !== null &&
    typeof record.date === "string" &&
    paidTaskNames.includes(record.task) &&
    Array.isArray(record.modelIds) &&
    typeof record.calls === "number" &&
    typeof record.cost === "string" &&
    typeof record.skillTextsHash === "string" &&
    Array.isArray(record.resultPerSkill) &&
    Array.isArray(record.runsNotScored)
  );
}

/**
 * Classifies how a run ended, from its exit code and its marker. An
 * interrupted run (exit 130 or 143) and a run ended by a usage limit are not
 * scored.
 */
export function howARunEnded(exitCode: number | null, marker?: string): NotScoredReason | "scored" {
  if (marker === USAGE_LIMIT_MARKER) return "usage-limit";
  if (exitCode !== null && INTERRUPTED_EXIT_CODES.includes(exitCode)) return "interrupted";
  return "scored";
}

/**
 * The hash of the skill texts a run measured: the sha256 of the rendered
 * skills, joined in the order of row 144. The writer of the record computes
 * it; the release check matches it (`./release-check.ts`).
 */
export function skillTextsHashOf(texts: readonly string[]): string {
  return createHash("sha256").update(texts.join("\u0000"), "utf8").digest("hex");
}

/**
 * Appends one record to the log at `logPath` (JSON lines, one record a line),
 * and returns what was written. The person's run calls this; nothing of the
 * build does.
 */
export function appendRunRecord(logPath: string, record: PaidRunRecord): string {
  const line = `${JSON.stringify(record)}\n`;
  appendFileSync(logPath, line, "utf8");
  return line;
}

/**
 * Reads the log back, skipping lines that are not well-formed records OF THE
 * GIVEN host's paid tasks. The names are the same required input the guard
 * takes, so the reader of one host drops what another would read.
 */
export function readRunLog(
  logPath: string,
  paidTaskNames: readonly string[],
): readonly PaidRunRecord[] {
  const content = existsSync(logPath) ? readFileSync(logPath, "utf8") : "";
  return Object.freeze(
    content
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as unknown)
      .filter((record) => isPaidRunRecord(record, paidTaskNames)),
  );
}

/**
 * A run for which the configuration names no model is refused BEFORE ANY
 * CALL. The refusal is this error; the caller throws it before it starts the
 * host's suite runner, so no call is made.
 */
export class RunRefusedError extends Error {
  override readonly name = "RunRefusedError";
  constructor(detail: string) {
    super(`refused before any call: ${detail}`);
  }
}

/**
 * The model of a suite run, and of the judge where a grader uses one, comes
 * from the CONFIGURATION of the run, given by the person who starts it. A
 * configuration that names no model is refused here, before any call.
 */
export function modelIdsFromConfiguration(config: {
  readonly modelIds?: readonly string[];
  readonly judgeModelIds?: readonly string[];
}): readonly string[] {
  const modelIds = config.modelIds ?? [];
  if (modelIds.length === 0) {
    throw new RunRefusedError("the configuration of the run names no model");
  }
  return Object.freeze([...modelIds]);
}
