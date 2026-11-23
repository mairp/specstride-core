/**
 * T339 — the pure red-gate budget of a phase (feature 153, F153-FR-020…-023;
 * CQ-153-05 answered A — budget A — on 2026-11-13).
 *
 * The rule table `red-gate-budget`
 * (`specs/153-loop-feedback-speed/contracts/red-gate-budget-table.json`,
 * rows RGB-1 to RGB-3 of plan.md) decides what one red gate — a verification
 * gate that failed (code 10) or could not run (code 3) — costs the phase:
 *
 *  - RGB-1: the switch `verification.redGate.ownBudget` is off, or the
 *    profile is `parity`, the gate costs a critic rejection, exactly as it
 *    did before this feature (F105-FR-005, the as-is behaviour);
 *  - RGB-2: the red gates of the phase since the counts were reset, this one
 *    included, have reached `verification.redGate.limit`, the run halts —
 *    stop reason `max_rejects` and exit code 2 per CQ-153-05 A, cause
 *    `verification-failed`, non-transient (F153-FR-022);
 *  - RGB-3: otherwise the gate spends one unit of the red-gate budget and
 *    none of the reject limit (F153-FR-020).
 *
 * ## What "the budget is spent" pins down
 *
 * The budget's size is the number of red gates the phase may absorb. The red
 * gate that REACHES the limit is the one the table halts — with the default
 * limit 3 the run halts at the third red gate of the phase, which is what
 * CT-153-20 to CT-153-23 (T343, T346) pin: `budgetSpent` is
 * `count >= limit`, the count being the red gates since the counts were
 * reset, this one included. `RGB_2_HALT` carries the rule id of the row that
 * fires.
 *
 * ## The count is derived, never held (F153-FR-021)
 *
 * `redGateCountOf` counts the gate result records it is handed — the number
 * of records whose code is not 0, a code 3 counting like a code 10
 * (F153-FR-023, F105-FR-005). The engine derives the count from the records
 * the control plane holds at the moment of the decision, never from a counter
 * held in memory, so a resume and a relaunch read the same count; and where a
 * reset of the ledger set the records aside, the count over what is left is 0.
 *
 * ## No setting unbounds the budget (F153-FR-021, Principle XV)
 *
 * `redGateBudgetLimit` DOES NOT READ `SPECSTRIDE_LIMITS`: limits-off lifts
 * the time and count limits of F101, but the red-gate budget is the bound of
 * a different loop, and no setting makes it unbounded. A value that is not a
 * finite integer ≥ 1 falls to the default of CQ-153-05 budget A, 3 — so the
 * limit the table counts against is always finite.
 *
 * Pure: no I/O, no clock, no randomness, no model. The table is evaluated
 * through `evaluateTable` of `@specstride/kernel`, so the decision is the
 * table's, never a branch of this module.
 */
import { evaluateTable, loadTable, type LoadedTable } from "@specstride/kernel";

/** The id of the table, recorded with every decision (F100-FR-204). */
export const RED_GATE_BUDGET_TABLE_ID = "red-gate-budget" as const;

/** The version of the table, recorded with every decision (F100-FR-204). */
export const RED_GATE_BUDGET_TABLE_VERSION = "1.0.0" as const;

/** The one decision point of the table. */
export const RED_GATE_BUDGET_POINT = "red-gate-budget" as const;

/** The rule id of the as-is row: the switch off, or the profile `parity`. */
export const RGB_1_COUNT_AS_REJECTION = "RGB-1-count-as-rejection" as const;
/** The rule id of the halt row: the budget spent (F153-FR-022). */
export const RGB_2_HALT = "RGB-2-halt" as const;
/** The rule id of the default row: the gate spends its own budget. */
export const RGB_3_SPEND = "RGB-3-spend" as const;

/** The rule ids of the table, in row order. */
export const RED_GATE_BUDGET_RULES = Object.freeze([
  RGB_1_COUNT_AS_REJECTION,
  RGB_2_HALT,
  RGB_3_SPEND,
]);

/** The choices of the table, in the order of the contract file. */
export const RED_GATE_BUDGET_CHOICES = Object.freeze(["count-as-rejection", "spend", "halt"]);

/** The default of `verification.redGate.limit` (CQ-153-05 budget A). */
export const RED_GATE_BUDGET_LIMIT_DEFAULT = 3 as const;

/** What the caller tells the table about one red gate. */
export type RedGateBudgetInput = {
  /** The switch `verification.redGate.ownBudget`, as configuration holds it. */
  readonly switchOn: boolean;
  /** The red gates of the phase since the counts were reset, this one included. */
  readonly count: number;
  /** The budget's size, `verification.redGate.limit`. */
  readonly limit: number;
  /** True under the `parity` profile, where the switch reads off (row 139). */
  readonly profileParity?: boolean | undefined;
};

/** What the table decided: the choice, and the rule that decided it. */
export type RedGateBudgetDecision = {
  readonly decision: "count-as-rejection" | "spend" | "halt";
  /** The rule id of the row that fired. */
  readonly ruleId: string;
  /** The id of the table, recorded with the decision (F100-FR-204). */
  readonly tableId: typeof RED_GATE_BUDGET_TABLE_ID;
  /** The version of the table, recorded with the decision (F100-FR-204). */
  readonly tableVersion: typeof RED_GATE_BUDGET_TABLE_VERSION;
};

/**
 * A leaf or a combinator of a predicate, in the form the contract file and
 * the load check of the kernel both read (annex X §X.3).
 */
type BudgetPredicate = {
  readonly op: string;
  readonly signal?: string;
  readonly value?: unknown;
  readonly of?: readonly BudgetPredicate[];
};

/** One row of the table: the rule id, the predicate (absent in the default), the choice. */
type BudgetTableRow = {
  readonly ruleId: string;
  readonly when?: BudgetPredicate;
  readonly choice: string;
};

/** The table, in the shape `specstride.table/1` gives. */
export type RedGateBudgetTable = {
  readonly schema: string;
  readonly id: string;
  readonly version: string;
  readonly points: {
    readonly "red-gate-budget": {
      readonly signals: Readonly<Record<string, string>>;
      readonly choices: readonly string[];
    };
  };
  readonly rows: {
    readonly "red-gate-budget": readonly BudgetTableRow[];
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
 * The rule table of the red-gate budget, frozen through and through. Equal to
 * `specs/153-loop-feedback-speed/contracts/red-gate-budget-table.json`
 * (rows RGB-1 to RGB-3 of plan.md); `ct-153-8-153.test.ts` compares the two
 * byte for byte, so the contract and the decision cannot drift apart.
 */
export const RED_GATE_BUDGET_TABLE: RedGateBudgetTable = deepFreeze({
  schema: "specstride.table/1",
  id: RED_GATE_BUDGET_TABLE_ID,
  version: RED_GATE_BUDGET_TABLE_VERSION,
  points: {
    "red-gate-budget": {
      signals: {
        switchOn: "boolean",
        profileParity: "boolean",
        budgetSpent: "boolean",
      },
      choices: [...RED_GATE_BUDGET_CHOICES],
    },
  },
  rows: {
    "red-gate-budget": [
      {
        ruleId: RGB_1_COUNT_AS_REJECTION,
        when: {
          op: "or",
          of: [
            { op: "equal", signal: "switchOn", value: false },
            { op: "equal", signal: "profileParity", value: true },
          ],
        },
        choice: "count-as-rejection",
      },
      {
        ruleId: RGB_2_HALT,
        when: {
          op: "and",
          of: [
            { op: "equal", signal: "switchOn", value: true },
            { op: "equal", signal: "profileParity", value: false },
            { op: "equal", signal: "budgetSpent", value: true },
          ],
        },
        choice: "halt",
      },
      // The default row (F100-FR-204): the gate spends its own budget, and
      // none of the reject limit (F153-FR-020).
      { ruleId: RGB_3_SPEND, choice: "spend" },
    ],
  },
} satisfies RedGateBudgetTable);

/**
 * Load the table through the LOAD CHECK of the table evaluator of the kernel,
 * the way the end-cause table and the commit-gate halt table are loaded. A
 * table that does not pass the check is invalid at load, never mid-run.
 */
export function loadTheRedGateBudgetTable(
  table: RedGateBudgetTable = RED_GATE_BUDGET_TABLE,
): LoadedTable {
  return loadTable(table as never);
}

/**
 * True when the red gates counted so far — this one included — have reached
 * the budget's size, which is the RGB-2 row of the table (see "What the
 * budget is spent pins down" above).
 */
export function theRedGateBudgetIsSpent(count: number, limit: number): boolean {
  return count >= limit;
}

/**
 * The pure decision of the table for one red gate. `redGateCountOf` gives the
 * count the caller hands in, derived from the durable gate result records of
 * the phase (F153-FR-021), never from a counter held in memory. Pure: no I/O,
 * no clock, no randomness, no model.
 */
export function redGateBudgetOf(input: RedGateBudgetInput): RedGateBudgetDecision {
  const limit = redGateBudgetLimit(input.limit);
  const decision = evaluateTable(loadTheRedGateBudgetTable(), RED_GATE_BUDGET_POINT, {
    switchOn: input.switchOn === true,
    profileParity: input.profileParity === true,
    budgetSpent: theRedGateBudgetIsSpent(input.count, limit),
  });
  return Object.freeze({
    decision: decision.choice as RedGateBudgetDecision["decision"],
    ruleId: decision.ruleId,
    tableId: RED_GATE_BUDGET_TABLE_ID,
    tableVersion: RED_GATE_BUDGET_TABLE_VERSION,
  });
}

/**
 * A gate result record as the count reads it: the code the gate answered —
 * 0 passed, 10 failed, 3 could not run. The engine derives `{code}` from the
 * gate result record of the attempt (and the gate's own result code where the
 * record folds the codes); this module reads no record of its own.
 */
export type GateResultRecordForTheCount = {
  readonly code: number;
};

/**
 * F153-FR-021 and F153-FR-023 — the red gates of the phase since the counts
 * were reset: the number of records handed in whose code is not 0, a code 3
 * (could not run) counting exactly like a code 10 (failed), as F105-FR-005
 * counts both a failed gate. Pure and total: records without a finite code
 * are not red gates and add nothing.
 */
export function redGateCountOf(records: readonly GateResultRecordForTheCount[]): number {
  let count = 0;
  for (const record of records) {
    if (typeof record?.code === "number" && Number.isFinite(record.code) && record.code !== 0) {
      count += 1;
    }
  }
  return count;
}

/**
 * F153-FR-021 — the limit the budget counts against: a finite integer ≥ 1,
 * the configuration value where it is one, the default of CQ-153-05 budget A
 * (3) where it is not. This function READS NO ENVIRONMENT: `SPECSTRIDE_LIMITS`
 * lifts the limits of F101, never this budget (Principle XV), so the value
 * that comes back is finite whatever the launch set.
 */
export function redGateBudgetLimit(limit: number | undefined): number {
  return typeof limit === "number" && Number.isSafeInteger(limit) && limit >= 1
    ? limit
    : RED_GATE_BUDGET_LIMIT_DEFAULT;
}
