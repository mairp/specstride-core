/**
 * T060 — the no-repeat verdict of one group (F154-FR-026; rule set RP).
 *
 * WHAT THIS MODULE IS. A pure decision over `REPEAT_TABLE`
 * (`data/repeat-table.json`, the byte-identical copy of spec 154's contract):
 * a group whose task set failed in an earlier attempt of the same phase is
 * **refused** while the fingerprint of its named paths is unchanged against
 * that attempt (RP-1), and **admitted** once a named path changed or where no
 * earlier failure of the group stands (RP-2). The 21 restarts of `g-23-1` in
 * feature 153's live record, every one of them over unchanged paths, are what
 * this rule stops.
 *
 * THE CHECK NAME. `repeat` is the check spec 154 PROPOSES for row 61
 * (`loop.parallel.noRepeat`; `types.ts` `PROPOSED_ADMISSION_CHECKS_154`). It is
 * NOT a member of the closed set `ADMISSION_CHECKS`: row 61 stays as feature
 * 142 fixed it, `groupGateVerdicts` carries the row 61 checks only, and the
 * repeat verdict travels beside them, typed on its own. A PROPOSAL becomes a
 * member of row 61 only when the owner copies it into the annex.
 *
 * The module is pure: it reads no file, starts no process, holds no state and
 * mutates nothing it is given. The fingerprint comparison arrives as a
 * function: the composition root computes it through the tree store's
 * `changed` against the earlier attempt's base snapshot, because only the
 * engine holds that store.
 */
import { REPEAT_TABLE } from "./tables.ts";
import type { PlannedGroup } from "./types.ts";

/** The id of the table this verdict reads (T003; F154-FR-003). */
export const REPEAT_TABLE_ID = REPEAT_TABLE.id as string;

/** The check name the repeat verdict carries: the proposed check of row 61. */
export const REPEAT_CHECK = "repeat" as const;

/** The rule ids of `REPEAT_TABLE`, in table order. */
export const REPEAT_RULE_IDS = ["RP-1", "RP-2"] as const;

/** The verdict of the no-repeat check of one group (F154-FR-026). */
export type RepeatVerdict = {
  /** The proposed check of row 61 this verdict belongs to. */
  readonly check: typeof REPEAT_CHECK;
  readonly passed: boolean;
  /** Whether the fingerprint matched the earlier failed attempt, or changed. */
  readonly ruleId: (typeof REPEAT_RULE_IDS)[number];
  /** Why, in the words the wiring prints. */
  readonly detail: string;
};

/**
 * One failure of a group in an earlier attempt of a phase, as the ledger of
 * the run holds it: the group's id, the phase, and the tasks of the group
 * where the record names them. The fingerprint of the earlier attempt's base
 * is NOT here — the comparison of the current fingerprint against it is the
 * seam's business (the tree store holds both trees), so this record only
 * says THAT the group failed.
 */
export type EarlierFailureOfAGroup = {
  readonly groupId: string;
  readonly phase: number;
  readonly tasks?: readonly string[];
};

/** True where an earlier failure names the same task set of the same phase. */
export function isTheSameTaskSetFailedEarlier(
  group: PlannedGroup,
  earlierFailures: readonly EarlierFailureOfAGroup[],
): boolean {
  // The group id the engine builds (`g-<phase>-<ordinal>`), stated here so
  // the layer holds no import from the engine (the graph forbids it).
  const groupId = `g-${String(group.phase)}-${String(group.ordinal)}`;
  return earlierFailures.some(
    (failure) =>
      failure.phase === group.phase &&
      (failure.groupId === groupId ||
        (failure.tasks !== undefined &&
          failure.tasks.length === group.tasks.length &&
          failure.tasks.every((task, index) => task === group.tasks[index]))),
  );
}

/**
 * The no-repeat verdict of one group over `REPEAT_TABLE` (T060,
 * F154-FR-026).
 *
 * RP-1 — the group's task set failed in an earlier attempt of this phase AND
 * the fingerprint of its named paths is unchanged against that attempt: the
 * group is refused with the check `repeat`. Restarting it would run the same
 * work over the same tree and fail the same way, as 153's live record shows.
 *
 * RP-2 — a named path changed, or the group has no earlier failure in this
 * phase: the group is admitted. The detail says which of the two holds, so a
 * reader of the verdict tells a first start from a restart over changed
 * paths.
 *
 * `fingerprintOfNamedPaths` answers for the group: TRUE where the fingerprint
 * of the group's named paths is unchanged against the earlier failed attempt's
 * base. The engine computes it through the tree store's `changed` (the layer
 * holds no store); the tests hand a stub, which is exactly the seam this
 * function reads.
 */
export function repeatVerdictOf(
  group: PlannedGroup,
  earlierFailures: readonly EarlierFailureOfAGroup[],
  fingerprintOfNamedPaths: (group: PlannedGroup) => boolean,
): RepeatVerdict {
  const sameTaskSetFailedEarlier = isTheSameTaskSetFailedEarlier(group, earlierFailures);
  const namedPathsFingerprintUnchanged = fingerprintOfNamedPaths(group);
  const rows = REPEAT_TABLE.rows["parallel.no-repeat"] ?? [];
  const refused = rows.some(
    (row) =>
      row.ruleId === "RP-1" &&
      row.choice === "refuse" &&
      sameTaskSetFailedEarlier &&
      namedPathsFingerprintUnchanged,
  );
  if (refused) {
    return Object.freeze({
      check: REPEAT_CHECK,
      passed: false,
      ruleId: "RP-1",
      detail:
        "the same task set failed in an earlier attempt of this phase and the fingerprint of its named paths is unchanged — the group is not restarted over unchanged paths (RP-1, F154-FR-026)",
    });
  }
  if (!sameTaskSetFailedEarlier) {
    return Object.freeze({
      check: REPEAT_CHECK,
      passed: true,
      ruleId: "RP-2",
      detail:
        "no earlier failure of this task set stands in this phase — the group is admitted (RP-2, F154-FR-026)",
    });
  }
  return Object.freeze({
    check: REPEAT_CHECK,
    passed: true,
    ruleId: "RP-2",
    detail:
      "the fingerprint of the named paths changed against the earlier failed attempt — the group is admitted over the changed paths (RP-2, F154-FR-026)",
  });
}
