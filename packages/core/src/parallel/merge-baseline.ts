/**
 * T065 — the merge baseline comparison (F154-FR-028; rules MG-1…MG-3).
 *
 * WHAT THIS MODULE IS. A pure decision over `MERGE_CHECK_OUTCOME_TABLE`
 * (the byte-identical copy of spec 154's contract, imported by
 * `tables.ts`-style data of this package's consumers): given the result the
 * merge check produced and the latest result of the inner check set whose
 * recorded tree fingerprint equals the group's base snapshot's, it says
 * whether the merge check failed only on commands that had already failed on
 * the base result with the same failure signature (F115-FR-019 — the ordered
 * ids and exit codes). In 153 every merge check failed on a suite that was
 * red before the group: MG-2 charges no repair and fails no group, and the
 * unit is not kept (F154-FR-028). MG-1 is the empty application, MG-3 leaves
 * F142-FR-061 unchanged.
 *
 * This module decides; the engine records the comparison with its rule id
 * (the record `specstride.merge-baseline/1`, written at the wiring of the
 * group attempt). The comparison is a rule of feature 154, not a new state of
 * a check result: no condition is added to any result, and the verification
 * gate is not touched.
 *
 * The module is pure: it imports nothing, reads no file, starts no process,
 * holds no state and mutates nothing it is given.
 */
import { MERGE_CHECK_OUTCOME_TABLE } from "../../../layer-parallel/src/tables.ts";

/** The id of the table this comparison reads (F154-FR-003). */
export const MERGE_BASELINE_TABLE_ID = MERGE_CHECK_OUTCOME_TABLE.id as string;

/** The record schema the engine writes the comparison with (F154-FR-028). */
export const MERGE_BASELINE_RECORD = "specstride.merge-baseline/1" as const;

/** The rule ids of the outcome table, in table order. */
export const MERGE_OUTCOME_RULE_IDS = ["MG-1", "MG-2", "MG-3"] as const;

/** One command of a check result, as the failure signature reads it (F115-FR-019). */
export type SignatureCommand = {
  readonly id: string;
  readonly exitCode: number;
};

/** What the merge check hands the comparison: the signals the table reads. */
export type MergeCheckResultForBaseline = {
  /** How many paths the group's application changed (MG-1's signal). */
  readonly appliedPathCount: number;
  /** True where the merge check did not pass (a failure or a condition). */
  readonly mergeCheckFailed: boolean;
  /** Every command the merge check ran, in the order it ran them. */
  readonly commands: readonly SignatureCommand[];
};

/**
 * The latest inner-set result whose recorded tree fingerprint equals the
 * group's base snapshot's, or `null` where no such result exists (F116-FR-005
 * names the fingerprint; F154-FR-028 the lookup). The commands carry the
 * signature the comparison matches.
 */
export type BaseResultOfTheInnerSet = {
  readonly commands: readonly SignatureCommand[];
} | null;

/** The comparison of the merge check against the base result (F154-FR-028). */
export type BaselineComparison = {
  readonly ruleId: (typeof MERGE_OUTCOME_RULE_IDS)[number];
  /** The choice the table's row carries for that rule id. */
  readonly choice: "no-check" | "no-charge" | "f142-fr-061";
  /** Why, in the words the record carries. */
  readonly detail: string;
};

/**
 * The failure signature of one command (F115-FR-019): its id and its exit
 * code, in the order the check ran them.
 */
function signatureOf(commands: readonly SignatureCommand[]): string {
  return commands.map((command) => `${command.id} exit ${String(command.exitCode)}`).join("; ");
}

/**
 * The baseline comparison (T065, F154-FR-028) over
 * `MERGE_CHECK_OUTCOME_TABLE`.
 *
 * MG-1 — the application changed 0 paths: no merge check at all
 * (`no-check`). The engine reads this signal BEFORE it runs the check; the
 * comparison still answers it, so a caller that asks late gets the same rule
 * id the early path recorded.
 *
 * MG-2 — the merge check failed, a base result exists, there is at least one
 * failing command, and EVERY failing command failed on the base result with
 * the same failure signature (F115-FR-019): no charge, no failed group, and
 * the unit is NOT kept (`no-charge`). A failing command with no counterpart
 * on the base, or a different exit code on the counterpart, is a new failure
 * and breaks the match. A failure carried by a condition alone — no failing
 * command at all — is not a baseline match: there is no command whose
 * redness the base explains.
 *
 * MG-3 — otherwise: F142-FR-061 applies unchanged (`f142-fr-061`).
 */
export function baselineComparisonOf(
  mergeCheckResult: MergeCheckResultForBaseline,
  baseResult: BaseResultOfTheInnerSet,
): BaselineComparison {
  const rows =
    MERGE_CHECK_OUTCOME_TABLE.rows["parallel.merge-check-outcome"] ?? [];
  const ruleIdOf = (id: string) => rows.find((row) => row.ruleId === id)?.choice;
  // MG-1 — the empty application.
  if (mergeCheckResult.appliedPathCount === 0) {
    const choice = ruleIdOf("MG-1") ?? "no-check";
    return Object.freeze({
      ruleId: "MG-1",
      choice: choice as BaselineComparison["choice"],
      detail:
        "the application changed 0 paths — no merge check runs, nothing is charged, the group is not failed (MG-1, F154-FR-027)",
    });
  }
  if (mergeCheckResult.mergeCheckFailed && baseResult !== null) {
    const failing = mergeCheckResult.commands.filter((command) => command.exitCode !== 0);
    const onBase = new Map(baseResult.commands.map((command) => [command.id, command.exitCode]));
    const allOnBaseWithSameSignature =
      failing.length > 0 &&
      failing.every((command) => onBase.get(command.id) === command.exitCode);
    if (allOnBaseWithSameSignature) {
      const choice = ruleIdOf("MG-2") ?? "no-charge";
      return Object.freeze({
        ruleId: "MG-2",
        choice: choice as BaselineComparison["choice"],
        detail: `every failing command failed on the base result with the same failure signature (${signatureOf(failing)}) — no repair is charged, the group is not failed, the unit is not kept (MG-2, F154-FR-028; F115-FR-019)`,
      });
    }
  }
  const choice = ruleIdOf("MG-3") ?? "f142-fr-061";
  return Object.freeze({
    ruleId: "MG-3",
    choice: choice as BaselineComparison["choice"],
    detail:
      "the merge check failed on a command the base result does not explain — F142-FR-061 applies unchanged (MG-3, F154-FR-028)",
  });
}
