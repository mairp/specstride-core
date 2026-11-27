/**
 * T074 — THE INDEPENDENCE OF TWO GROUPS OF ONE PHASE (F154-FR-032; rules
 * PG-0 to PG-3; CQ-154-02 C with (iii)).
 *
 * WHAT THIS MODULE IS. A pure decision over `INDEPENDENCE_TABLE`
 * (`data-154/independence-table.json`, the byte-identical copy of spec 154's
 * contract): two groups of one phase are worked AT ONCE only when a recorded
 * rule finds them independent, and otherwise one after the other with the
 * admission check `dependency` and its detail recorded. The rules, in table
 * order:
 *
 * - PG-2 — a declared `dependsOn` of the later group naming the earlier
 *   group: DEPENDENT. The declaration decides the other way and overrides
 *   the marker rule.
 * - PG-3 — a declared `independentWith` naming the other group, on either
 *   side: INDEPENDENT. A task group of 153 carries no `[P]` marker, so this
 *   declaration is the only way two task groups are independent without the
 *   marker rule.
 * - PG-1 — THE MARKER RULE: the write scopes of the two groups are disjoint
 *   (`scopesAreDisjoint`, F142-FR-009), EVERY task of both groups carries
 *   the `[P]` marker, and no task of the later group names a path inside the
 *   earlier group's write scope (`pathsNamedByTheTextOfATask`,
 *   `pathIsInsideScope`): INDEPENDENT. Where independence rests on this rule
 *   alone no declaration is read.
 * - PG-0 — otherwise: DEPENDENT. Two task groups without any declaration are
 *   dependent, because neither carries the marker.
 *
 * THE CHECK NAME. `dependency` is the check spec 154 PROPOSES for row 61
 * (`loop.parallel.groupUnits`; `types.ts`
 * `PROPOSED_ADMISSION_CHECKS_154`). It is NOT a member of the closed set
 * `ADMISSION_CHECKS`; it reaches the event stream only while the switch is
 * on, as the value the wiring records beside the row 61 checks.
 *
 * The module is pure: it reads no file, starts no process, holds no state
 * and mutates nothing it is given. The same inputs give the same verdict
 * (F154-FR-003); the composition root records the verdict before it acts on
 * it (F154-SC-006). Whether the two groups may ALSO run at once is the
 * wiring's business: F154-FR-032 requires the write scopes to be pairwise
 * disjoint IN ADDITION to independence, and the wiring checks that beside
 * this verdict (`SCOPES_DISJOINT_REQUIRED`).
 */
import { INDEPENDENCE_TABLE } from "./tables.ts";
import { MARKER } from "./admission.ts";
import { pathsNamedByTheTextOfATask, pathIsInsideScope, scopesAreDisjoint } from "./scope.ts";
import type { PlannedGroup, WriteScope } from "./types.ts";

/** The id of the table this verdict reads (T003; F154-FR-003). */
export const INDEPENDENCE_TABLE_ID = INDEPENDENCE_TABLE.id as string;

/** The admission check the verdict of a DEPENDENT pair is recorded under. */
export const DEPENDENCY_CHECK = "dependency" as const;

/** The rule ids of `INDEPENDENCE_TABLE`, in table order. */
export const INDEPENDENCE_RULE_IDS = ["PG-2", "PG-3", "PG-1", "PG-0"] as const;

/**
 * F154-FR-032 — the scope condition the wiring checks BESIDE the verdict:
 * two groups are worked at once only when their write scopes are pairwise
 * disjoint, whatever the declaration says. A declaration overrides the
 * marker rule of PG-1, never F142-FR-009.
 */
export const SCOPES_DISJOINT_REQUIRED = true as const;

/** One group of the phase, as the independence decision reads it. */
export type GroupUnit = {
  /** The group id the engine builds (`g-<phase>-<ordinal>`). */
  readonly groupId: string;
  /** The planned group: the ordinal, the phase and the tasks in order. */
  readonly group: PlannedGroup;
  /** The write scope of the group (F142-FR-009). */
  readonly writeScope: WriteScope;
  /** The text of every task of the group, in the group's task order. */
  readonly taskTexts: readonly string[];
};

/**
 * The declarations the frozen task-group record may carry per group
 * (F154-FR-032; the amendment row of `specstride.task-groups-frozen/1`):
 * per group id, the groups it declares a relation to. An absent map, or a
 * group the maps do not name, declares nothing.
 */
export type GroupIndependenceDeclaration = {
  readonly dependsOn?: Readonly<Record<string, readonly string[]>>;
  readonly independentWith?: Readonly<Record<string, readonly string[]>>;
};

/** The independence verdict of one pair of groups (F154-FR-032). */
export type IndependenceVerdict = {
  /** The proposed check a DEPENDENT verdict is recorded under. */
  readonly check: typeof DEPENDENCY_CHECK;
  /** True where a recorded rule finds the two groups independent. */
  readonly independent: boolean;
  readonly ruleId: (typeof INDEPENDENCE_RULE_IDS)[number];
  /** Why, in the words the wiring records (F154-SC-006). */
  readonly detail: string;
};

/** The five signals the table's rows read, in the table's own naming. */
type IndependenceSignals = {
  readonly scopesDisjoint: boolean;
  readonly everyTaskMarked: boolean;
  readonly laterNamesEarlierPath: boolean;
  readonly dependsOnDeclared: boolean;
  readonly independentWithDeclared: boolean;
};

/** True where the text of a task carries the `[P]` marker. */
function isMarked(text: string): boolean {
  return text.includes(MARKER);
}

/** True where a task of the later group names a path in the earlier scope. */
function theLaterNamesAPathOfTheEarlier(earlier: GroupUnit, later: GroupUnit): boolean {
  return later.taskTexts.some((text) =>
    pathsNamedByTheTextOfATask(text).some((path) => pathIsInsideScope(path, earlier.writeScope)),
  );
}

/** The declared relations of one group id, or the empty list. */
function declaredOf(
  map: Readonly<Record<string, readonly string[]>> | undefined,
  groupId: string,
): readonly string[] {
  return map?.[groupId] ?? [];
}

/** The five signals of one pair, computed once and in one order. */
function signalsOf(
  earlier: GroupUnit,
  later: GroupUnit,
  declaration: GroupIndependenceDeclaration,
): IndependenceSignals {
  return Object.freeze({
    scopesDisjoint: scopesAreDisjoint([earlier.writeScope, later.writeScope]),
    everyTaskMarked:
      [...earlier.taskTexts, ...later.taskTexts].every(isMarked) &&
      earlier.taskTexts.length > 0 &&
      later.taskTexts.length > 0,
    laterNamesEarlierPath: theLaterNamesAPathOfTheEarlier(earlier, later),
    dependsOnDeclared: declaredOf(declaration.dependsOn, later.groupId).includes(earlier.groupId),
    independentWithDeclared:
      declaredOf(declaration.independentWith, earlier.groupId).includes(later.groupId) ||
      declaredOf(declaration.independentWith, later.groupId).includes(earlier.groupId),
  });
}

/** True where a row's `when` condition holds over the signals. */
function rowHolds(
  when: {
    readonly op: string;
    readonly signal?: string;
    readonly value?: unknown;
    readonly of?: readonly unknown[];
  },
  signals: IndependenceSignals,
): boolean {
  if (when.op === "and") {
    return (when.of ?? []).every((inner) => rowHolds(inner as typeof when, signals));
  }
  if (when.op === "equal") {
    return signals[when.signal as keyof IndependenceSignals] === when.value;
  }
  return false;
}

const DETAIL_OF: Readonly<Record<string, string>> = Object.freeze({
  "PG-2":
    "the later group declares dependsOn over the earlier one — the declaration decides and overrides the marker rule (PG-2, F154-FR-032)",
  "PG-3":
    "a declared independentWith names the other group — independent without the marker rule, which a task group of 153 without markers can only reach this way (PG-3, F154-FR-032)",
  "PG-1":
    "the scopes are disjoint, every task of both groups carries [P], and the later group names no path of the earlier scope — the marker rule, no declaration read (PG-1, F154-FR-032)",
  "PG-0":
    "no rule finds the two groups independent — they run one after the other, the later under the check dependency (PG-0, F154-FR-032)",
});

/**
 * The independence verdict of one pair over `INDEPENDENCE_TABLE` (T074,
 * F154-FR-032). `earlier` is the group that comes first in plan order,
 * `later` the one that follows it. The FIRST matching row in table order
 * decides: PG-2, then PG-3, then PG-1, then PG-0.
 */
export function independenceOf(
  earlier: GroupUnit,
  later: GroupUnit,
  declaration: GroupIndependenceDeclaration,
): IndependenceVerdict {
  const signals = signalsOf(earlier, later, declaration);
  type RowShape = {
    readonly ruleId: string;
    readonly choice: string;
    readonly when?: {
      readonly op: string;
      readonly signal?: string;
      readonly value?: unknown;
      readonly of?: readonly unknown[];
    };
  };
  const rows =
    (INDEPENDENCE_TABLE.rows as Readonly<Record<string, readonly RowShape[]>>)[
      INDEPENDENCE_TABLE_ID
    ] ?? [];
  for (const row of rows) {
    const ruleId = row.ruleId as (typeof INDEPENDENCE_RULE_IDS)[number];
    const holds = row.when === undefined ? true : rowHolds(row.when, signals);
    if (!holds) continue;
    const independent = row.choice === "independent";
    return Object.freeze({
      check: DEPENDENCY_CHECK,
      independent,
      ruleId,
      detail: DETAIL_OF[ruleId] ?? row.choice,
    });
  }
  // The table's last row is PG-0, which holds unconditionally, so this line
  // is reached only where the table is broken — and then the pair is
  // DEPENDENT, never at once (the safe side of the table, F154-FR-004).
  return Object.freeze({
    check: DEPENDENCY_CHECK,
    independent: false,
    ruleId: "PG-0",
    detail: DETAIL_OF["PG-0"] as string,
  });
}
