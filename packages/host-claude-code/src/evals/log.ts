/**
 * T035 — the log record of a paid task and the reader of the log, F113-FR-038
 * and F113-FR-039 (implemented together with T028, which first exercised it).
 *
 * A paid task (the trigger suite, the behaviour smoke, the with-and-without
 * report) is started by a PERSON and is logged. The fields of the record are
 * the row "Log record of a paid task" of data-model.md, in its order:
 *
 * | date | task | model ids (from the configuration of the run) | number of
 * calls | cost | hash of the skill texts | result per skill | runs not scored |
 *
 * No module here calls a model. The log is written by the person's run and
 * read by the release check (`./release-check.ts`), which calls no model.
 *
 * The RECORD moved to `@specstride/host-kit` (`src/evals/log.ts` there, the
 * split of the monorepo, U-1): the record shape, the guard, the reader and
 * writer, the classification of how a run ended, the hash and the refusal of a
 * run whose configuration names no model are the kit's, taken over the
 * required `paidTaskNames` input. THIS module holds what is a fact of the host
 * and cannot be the kit's — the three names of THIS host's paid tasks
 * (F113-FR-038, F113-FR-040) — and binds the kit to them, so every import path
 * of this module keeps its shape and every consumer reads the same values as
 * before the move.
 */
import {
  type PaidRunRecord as KitPaidRunRecord,
  INTERRUPTED_EXIT_CODES,
  RunRefusedError,
  USAGE_LIMIT_MARKER,
  appendRunRecord,
  howARunEnded,
  isPaidRunRecord as kitIsPaidRunRecord,
  modelIdsFromConfiguration,
  readRunLog as kitReadRunLog,
  skillTextsHashOf,
} from "@specstride/host-kit/evals";

/** The paid tasks of this host (F113-FR-038, F113-FR-040). */
export const PAID_TASK_NAMES = [
  "trigger-suite",
  "behaviour-smoke",
  "with-and-without-report",
] as const;
export type PaidTaskName = (typeof PAID_TASK_NAMES)[number];

/**
 * The record of this host's paid tasks: the kit's record with `task` narrowed
 * to the three names above, which is what every reader of the old path holds.
 */
export type PaidRunRecord = Omit<KitPaidRunRecord, "task"> & { readonly task: PaidTaskName };

export {
  /** F113-FR-039 — exit 130 and 143 are interruptions, not score failures. */
  INTERRUPTED_EXIT_CODES,
  /** The marker a run carries when this host ended it on its usage limit. */
  USAGE_LIMIT_MARKER,
  /** F113-FR-039 — an interrupted run and a usage-limit run are not scored. */
  howARunEnded,
  /** The hash of the skill texts a run measured, in the order of row 144. */
  skillTextsHashOf,
  /** Appends one record to the log; the person's run calls it, nothing of the build. */
  appendRunRecord,
  /** F113-FR-039 — the error thrown before any call, and the model ids of the configuration. */
  RunRefusedError,
  modelIdsFromConfiguration,
};

/**
 * F113-FR-038 and F113-FR-039 — true where the record is well formed enough
 * for the release check to read and its task is one of THIS host's paid tasks.
 * The kit's guard takes the names as its input; this binding fixes them.
 */
export function isPaidRunRecord(value: unknown): value is PaidRunRecord {
  return kitIsPaidRunRecord(value, PAID_TASK_NAMES);
}

/** Reads the log back, skipping lines that are not records of this host's paid tasks. */
export function readRunLog(logPath: string): readonly PaidRunRecord[] {
  return kitReadRunLog(logPath, PAID_TASK_NAMES) as readonly PaidRunRecord[];
}
