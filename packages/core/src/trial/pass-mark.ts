/**
 * The pass mark of a trial (F154-FR-018, -019; CQ-154-15 A): a pure
 * evaluation of `TRIAL_PASS_MARK_TABLE` (`tables.ts`), the rules TRI-1…TRI-3
 * and the catch TRI-pass. No I/O, no clock, no network: the signals come in,
 * the choice and the rule that made it come out.
 */
import { TRIAL_PASS_MARK_TABLE } from "./tables.ts";

/** The three signals the table reads (the `signals` cell of its point). */
export type TrialSignals = {
  readonly noBreachInvariantFails: boolean;
  readonly everyRuleTestPasses: boolean;
  readonly closedSetsAreSubsets: boolean;
};

/** The mark the table returns: the choice, and the rule that chose. */
export type TrialPassMark = {
  readonly choice: "pass" | "fail";
  readonly ruleId: string;
};

/** The rows of the table, flattened over its points. */
const ROWS: readonly {
  ruleId: string;
  when?: { op: string; signal: keyof TrialSignals; value: boolean };
  choice: "pass" | "fail";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the parity rows of spec 154 are read as written
}[] = Object.values((TRIAL_PASS_MARK_TABLE as any).rows as Record<string, any[]>).flat();

/**
 * The pass mark of a trial: the first row whose `when` holds chooses its
 * choice; `TRI-pass` has no `when` and holds only when every failing rule
 * before it did not.
 */
export function passMarkOf(signals: TrialSignals): TrialPassMark {
  for (const row of ROWS) {
    if (row.when === undefined) return { choice: row.choice, ruleId: row.ruleId };
    if (signals[row.when.signal] === row.when.value) {
      return { choice: row.choice, ruleId: row.ruleId };
    }
  }
  // Unreachable while the table ends with TRI-pass.
  throw new Error("the trial pass-mark table has no catch-all row");
}
