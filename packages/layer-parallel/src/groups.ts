/**
 * T073 — A FROZEN TASK GROUP AS ONE CANDIDATE OF THE PLANNER (F154-FR-031;
 * CQ-154-02 C).
 *
 * WHAT THIS MODULE IS. The mapping `plannedGroupOf(taskGroup)`: one frozen
 * task group of the launch record (`slicer.ts` `TaskGroup`, frozen as
 * `specstride.task-groups-frozen/1`) becomes ONE `PlannedGroup` of the plan —
 * the group AS A UNIT, whose scope is the group's write scope, not the union
 * of per-task scopes. With `loop.parallel.groupUnits` on, the planner takes
 * its candidates for the phase from this mapping instead of slicing the
 * `[P]` tasks; the `[P]` groups of feature 142 stay as they are (CQ-154-02
 * C, answer B's branch).
 *
 * One worker runs one group (F154-FR-031), so the planned group carries the
 * whole group's task list and the wiring reads its worker count as 1 — the
 * group is the unit, the tasks keep their order inside the worker.
 *
 * The module is pure: it reads no file and mutates nothing. The same frozen
 * group gives the same planned group (F154-SC-002), and the ordinal comes
 * from the group id the engine freezes (`g-<phase>-<ordinal>`), falling back
 * to the caller's ordinal where the id carries none.
 */
import type { PlannedGroup } from "./types.ts";
import type { WriteScope } from "./types.ts";

/**
 * The shape of one frozen task group the layer reads (the members of
 * `slicer.ts` `TaskGroup` the mapping needs; the layer holds no import from
 * core — the graph forbids it — so the shape is structural).
 */
export type FrozenTaskGroupShape = {
  readonly groupId: string;
  readonly phase: number;
  readonly taskIds: readonly string[];
  readonly writeScope: {
    readonly prefixes: readonly string[];
    readonly caseFolded?: boolean;
  };
};

/**
 * One planned group that came from a frozen task group: the planned group
 * itself, plus the id and the write scope the independence decision and the
 * wiring read (F154-FR-031, -032).
 */
export type PlannedGroupOfATaskGroup = PlannedGroup & {
  readonly groupId: string;
  readonly writeScope: WriteScope;
  readonly fromTaskGroup: true;
};

/** The ordinal of a group id `g-<phase>-<ordinal>`, or `null` where it carries none. */
export function ordinalOfTheGroupId(groupId: string): number | null {
  const parts = groupId.split("-");
  const last = parts[parts.length - 1];
  const parsed = Number.parseInt(last ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * One frozen task group as one planned group (T073, F154-FR-031): the
 * group's tasks in the frozen task order, the group's phase, and the
 * ordinal from the group id (or `fallbackOrdinal` where the id carries
 * none). The scope of the planned group is the GROUP's write scope, so the
 * independence decision reads the group as one unit and not as a union of
 * per-task scopes.
 */
export function plannedGroupOf(
  taskGroup: FrozenTaskGroupShape,
  fallbackOrdinal?: number,
): PlannedGroupOfATaskGroup {
  const ordinal = ordinalOfTheGroupId(taskGroup.groupId) ?? fallbackOrdinal ?? 1;
  return Object.freeze({
    ordinal,
    phase: taskGroup.phase,
    tasks: Object.freeze([...taskGroup.taskIds]),
    groupId: taskGroup.groupId,
    writeScope: Object.freeze({
      prefixes: Object.freeze([...taskGroup.writeScope.prefixes]),
      ...(taskGroup.writeScope.caseFolded === true ? { caseFolded: true } : {}),
      source: "task-text",
    }) as WriteScope,
    fromTaskGroup: true as const,
  });
}

/** `groupIdOfTheAttempt`'s own form, stated so the layer builds no engine import. */
export function groupIdOfThePlannedGroup(group: PlannedGroup): string {
  return `g-${String(group.phase)}-${String(group.ordinal)}`;
}
