/**
 * T098, T099, T100 — the pure end cause of a phase attempt (feature 153,
 * F153-FR-037, F153-FR-038; annex X §X.6 row 272).
 *
 * Every `attempt.started` gets exactly one `attempt.ended`, and every
 * `attempt.ended` carries an `endCause` that is a member of row 272 — the
 * cause is DECIDED by the rule table `attempt-end-cause`
 * (`specs/153-loop-feedback-speed/contracts/attempt-end-cause-table.json`),
 * never guessed at the call site. The table is rows EC-1 to EC-12 of
 * plan.md ("Rule-id sets fixed by this plan"), in that order; the first row
 * that matches decides.
 *
 * ## Why the constant carries the kernel's leaf form
 *
 * As with the bump table (`../ep18/bump-table.ts`), the contract file writes
 * a leaf predicate as one pair `{"<op>": [<signal>, <value>]}` and the load
 * check of the kernel reads `{op, signal, value}`; the translation is total
 * and reversible on this table. The constant is loaded through `loadTable`
 * of `@specstride/kernel` on every decision, so a table that fails the load
 * fails at load, never mid-run.
 *
 * ## The default row, and why it throws
 *
 * The load refuses a decision point without a default row (F100-FR-204), so
 * row EC-12 stands without a `when` and its choice is a member of row 272 —
 * the closed set allows no other value. The choice of EC-12 is never
 * returned: `endCauseOf` throws `UnknownAttemptEndError` when EC-12 fires.
 * No cause is ever guessed for an end the table does not know (plan.md
 * EC-12: "no event is written and the case is a test failure").
 *
 * ## What the table does not choose
 *
 * The member `budget` is chosen by no rule of this feature (plan.md, after
 * the rule table): it stays with whatever end already owns it.
 */
import { evaluateTable, loadTable, type LoadedTable } from "@specstride/kernel";

/**
 * How a phase attempt ended, as the engine reports it to the table: the
 * outcome of the attempt's record, and whether the red gate's own budget
 * (P1c) halted the run — the one signal that tells EC-2 and EC-3 apart.
 */
export type AttemptEnd153 = {
  readonly outcome:
    | "approved"
    | "gate-failed"
    | "commit-blocked"
    | "malformed"
    | "rejected"
    | "no-evidence"
    | "stopped"
    | "blocked"
    | "error"
    | "died";
  /** True only where the red-gate budget halted the run (EC-3). */
  readonly redGateHalt?: boolean | undefined;
};

/** What the table decided: the end cause, and the rule that decided it. */
export type AttemptEndCause153 = {
  /** A member of row 272 (`ATTEMPT_END_CAUSES` of the observability catalogue). */
  readonly endCause: string;
  /** The rule id of the row that fired. */
  readonly ruleId: string;
  /** True only for EC-11: the closer is synthesised by the next writer. */
  readonly synthesized: boolean;
};

/** The id of the table, recorded with every decision (F100-FR-204). */
export const ATTEMPT_END_CAUSE_TABLE_ID = "attempt-end-cause" as const;

/** The version of the table, recorded with every decision (F100-FR-204). */
export const ATTEMPT_END_CAUSE_TABLE_VERSION = "1.0.0" as const;

/** The one decision point of the table. */
export const ATTEMPT_END_CAUSE_POINT = "attempt-end-cause" as const;

/** The rule id of the row for an approved attempt (EC-1). */
export const EC_1 = "EC-1-approved" as const;
/** The rule id of the row for a failed or unrunnable gate (EC-2). */
export const EC_2 = "EC-2-gate-failed" as const;
/** The rule id of the row for a red-gate budget halt (EC-3). */
export const EC_3 = "EC-3-red-gate-budget" as const;
/** The rule id of the row for a commit-gate block (EC-4). */
export const EC_4 = "EC-4-commit-blocked" as const;
/** The rule id of the row for a MALFORMED verdict (EC-5). */
export const EC_5 = "EC-5-malformed" as const;
/** The rule id of the row for a REJECTED verdict (EC-6). */
export const EC_6 = "EC-6-rejected" as const;
/** The rule id of the row for an end with no phase evidence (EC-7). */
export const EC_7 = "EC-7-no-evidence" as const;
/** The rule id of the row for a stop request (EC-8). */
export const EC_8 = "EC-8-stopped" as const;
/** The rule id of the row for a blocked halt (EC-9). */
export const EC_9 = "EC-9-blocked" as const;
/** The rule id of the row for a configuration error or a throw (EC-10). */
export const EC_10 = "EC-10-error" as const;
/** The rule id of the row for a process that died mid-attempt (EC-11). */
export const EC_11 = "EC-11-died" as const;
/** The rule id of the default row: an end the table does not know (EC-12). */
export const EC_12 = "EC-12-none" as const;

/** The rule ids of the table, in row order. */
export const ATTEMPT_END_CAUSE_RULES = Object.freeze([
  EC_1,
  EC_2,
  EC_3,
  EC_4,
  EC_5,
  EC_6,
  EC_7,
  EC_8,
  EC_9,
  EC_10,
  EC_11,
  EC_12,
]);

/** A leaf or a combinator of a predicate, in the leaf form of annex X §X.3. */
export type EndCausePredicate = {
  readonly op: string;
  readonly signal?: string;
  readonly value?: unknown;
  readonly of?: readonly EndCausePredicate[];
};

/** One row of the table: the rule id, the predicate (absent in the default row), the choice. */
export type EndCauseTableRow = {
  readonly ruleId: string;
  readonly when?: EndCausePredicate;
  readonly choice: string;
};

/** The table, in the shape `specstride.table/1` gives (annex X §X.3). */
export type AttemptEndCauseTable = {
  readonly schema: string;
  readonly id: string;
  readonly version: string;
  readonly points: {
    readonly "attempt-end-cause": {
      readonly signals: Readonly<Record<string, string>>;
      readonly choices: readonly string[];
    };
  };
  readonly rows: {
    readonly "attempt-end-cause": readonly EndCauseTableRow[];
  };
};

/** Freeze a value and everything it holds, so that no reader can change the table. */
function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  for (const key of Object.getOwnPropertyNames(value)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}

/**
 * The rule table of the end cause of a phase attempt, frozen through and
 * through. Equal to
 * `specs/153-loop-feedback-speed/contracts/attempt-end-cause-table.json`,
 * with the leaf form of annex X §X.3 that the load check of the kernel reads.
 */
export const ATTEMPT_END_CAUSE_TABLE: AttemptEndCauseTable = deepFreeze({
  schema: "specstride.table/1",
  id: ATTEMPT_END_CAUSE_TABLE_ID,
  version: ATTEMPT_END_CAUSE_TABLE_VERSION,
  points: {
    "attempt-end-cause": {
      signals: { outcome: "string", redGateHalt: "boolean" },
      // The ten members of row 272, as `ATTEMPT_END_CAUSES` holds them; no
      // member is added (F153-FR-038).
      choices: [
        "approved",
        "rejected",
        "malformed",
        "verification-failed",
        "no-evidence",
        "budget",
        "blocked",
        "stopped",
        "error",
        "crash",
      ],
    },
  },
  rows: {
    "attempt-end-cause": [
      {
        ruleId: EC_1,
        when: { op: "equal", signal: "outcome", value: "approved" },
        choice: "approved",
      },
      {
        ruleId: EC_2,
        when: {
          op: "and",
          of: [
            { op: "equal", signal: "outcome", value: "gate-failed" },
            { op: "equal", signal: "redGateHalt", value: false },
          ],
        },
        choice: "verification-failed",
      },
      {
        ruleId: EC_3,
        when: {
          op: "and",
          of: [
            { op: "equal", signal: "outcome", value: "gate-failed" },
            { op: "equal", signal: "redGateHalt", value: true },
          ],
        },
        choice: "verification-failed",
      },
      {
        ruleId: EC_4,
        when: { op: "equal", signal: "outcome", value: "commit-blocked" },
        choice: "rejected",
      },
      {
        ruleId: EC_5,
        when: { op: "equal", signal: "outcome", value: "malformed" },
        choice: "malformed",
      },
      {
        ruleId: EC_6,
        when: { op: "equal", signal: "outcome", value: "rejected" },
        choice: "rejected",
      },
      {
        ruleId: EC_7,
        when: { op: "equal", signal: "outcome", value: "no-evidence" },
        choice: "no-evidence",
      },
      {
        ruleId: EC_8,
        when: { op: "equal", signal: "outcome", value: "stopped" },
        choice: "stopped",
      },
      {
        ruleId: EC_9,
        when: { op: "equal", signal: "outcome", value: "blocked" },
        choice: "blocked",
      },
      {
        ruleId: EC_10,
        when: { op: "equal", signal: "outcome", value: "error" },
        choice: "error",
      },
      {
        ruleId: EC_11,
        when: { op: "equal", signal: "outcome", value: "died" },
        choice: "crash",
      },
      // The default row (F100-FR-204): an end the table does not know. Its
      // choice is a member of row 272 because the closed set allows no other
      // value; `endCauseOf` throws before the choice can leave this module.
      { ruleId: EC_12, choice: "error" },
    ],
  },
} satisfies AttemptEndCauseTable);

/**
 * Load the table through the LOAD CHECK of the table evaluator of the kernel
 * (annex X §X.3), the way the bump table and the commit-gate halt table are
 * loaded. A table that does not pass the check is invalid at load, never
 * mid-run.
 */
export function loadTheAttemptEndCauseTable(
  table: AttemptEndCauseTable = ATTEMPT_END_CAUSE_TABLE,
): LoadedTable {
  return loadTable(table as never);
}

/**
 * The error of an end the table does not know (EC-12). No cause is guessed:
 * the caller sees this error instead of an `attempt.ended`.
 */
export class UnknownAttemptEndError extends Error {
  /** The outcome the caller offered, which no row of the table knows. */
  readonly outcome: string;

  constructor(outcome: string) {
    super(
      `no rule of the ${ATTEMPT_END_CAUSE_TABLE_ID} table decides the end ` +
        `${JSON.stringify(outcome)}: no attempt.ended is written for an end ` +
        `the table does not know (EC-12)`,
    );
    this.name = "UnknownAttemptEndError";
    this.outcome = outcome;
  }
}

/**
 * T100 — the pure decision of the end cause of one phase attempt.
 *
 * The table decides; this function only reads its decision. On the default
 * row (EC-12) it throws `UnknownAttemptEndError` — an end the table does not
 * know gets no cause and no event. Pure: no I/O, no clock, no randomness,
 * no model.
 */
export function endCauseOf(end: AttemptEnd153): AttemptEndCause153 {
  const decision = evaluateTable(loadTheAttemptEndCauseTable(), ATTEMPT_END_CAUSE_POINT, {
    outcome: end.outcome,
    redGateHalt: end.redGateHalt ?? false,
  });
  if (decision.ruleId === EC_12) throw new UnknownAttemptEndError(end.outcome);
  return Object.freeze({
    endCause: decision.choice,
    ruleId: decision.ruleId,
    synthesized: decision.ruleId === EC_11,
  });
}
