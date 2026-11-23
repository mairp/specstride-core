// Feature 153, phase 27 (US5) — the derive-time task-group slicer
// (F153-FR-054, F153-FR-055; plan.md P5b; rules TG-1 to TG-3 of
// `specs/153-loop-feedback-speed/contracts/task-group-slicer-table.json`).
//
// The slicer is PURE: it reads only its input — the tasks of one phase of the
// canonical model, in their canonical order, the task→paths map of the
// composition root (T204, `pathsNamedByTheTextOfATask` applied to each task's
// text), and the declared commands — and imports neither the file system nor
// the carry modules, the way `per-task.ts` does (core imports neither).
//
// The groups follow task order and never split a task (CQ-153-15 A, rules
// TG-2 and TG-3); a group carries the write scope `writeScopeOf` gives for its
// tasks' paths (source `task-text`, never the proposer, F142-FR-009) and the
// declared acceptance check of fixed argv resolved from the declarations
// (F105-FR-015) or the record `unchecked` — never rejected, never passed
// (F153-FR-055). The slicing hash is the canonical record hash over the
// groups: equal sources give equal bytes, and changing a source (a task's
// text included) changes the hash (F153-FR-054). Rule TG-1 (switch off or the
// `parity` profile) is the caller's decision, not the table's: the caller
// passes no slicing request at all where TG-1 holds.

import { canonicalRecordHash } from "@specstride/kernel/hasher";
import { writeScopeOf } from "../../../layer-parallel/src/scope.ts";

/** The schema marker of one frozen task group. */
export const TASK_GROUP_SCHEMA = "specstride.task-group/1" as const;

/** The default size the owner ruled (CQ-153-15 A). */
export const TASK_GROUP_SIZE_DEFAULT = 5 as const;

/** A declared command of fixed argv an acceptance check may resolve to. */
export interface DeclaredCheckCommand {
  /** The declared id of the command (F105-FR-015). */
  readonly id: string;
  /** The fixed argument list, run without a shell. */
  readonly argv: readonly string[];
  /** The task ids the command checks; a group resolves to it only when it declares every task of the group. */
  readonly forTaskIds: readonly string[];
}

/** One task of the canonical model, as the slicer consumes it. */
export interface SliceTask {
  readonly id: string;
  readonly text: string;
}

/** The input: everything comes from the canonical model or the composition root. */
export interface SliceThePhaseInput {
  /** The phase the groups belong to. */
  readonly phase: number;
  /** The ruled size: at most this many tasks per group (TG-2, TG-3). */
  readonly size?: number;
  /** The tasks of the phase, in canonical order. */
  readonly tasks: readonly SliceTask[];
  /** The task→paths map of the composition root (T204). */
  readonly pathsOfTask: (taskId: string) => readonly string[];
  /** The declared commands the acceptance checks resolve from. */
  readonly declaredCommands?: readonly DeclaredCheckCommand[];
}

/** The write scope of a group, the form `writeScopeOf` returns. */
export interface GroupWriteScope {
  readonly prefixes: readonly string[];
  readonly source: "task-text";
  readonly caseFolded?: boolean;
}

/** The resolved acceptance check of a group, or `unchecked`. */
export type GroupAcceptanceCheck =
  | { readonly kind: "declared"; readonly id: string; readonly argv: readonly string[] }
  | { readonly kind: "unchecked" };

/** One task group (data-model.md D9; `contracts/schemas/task-group.schema.json`). */
export interface TaskGroup {
  readonly schema: typeof TASK_GROUP_SCHEMA;
  readonly groupId: string;
  readonly phase: number;
  readonly taskIds: readonly string[];
  readonly writeScope: GroupWriteScope;
  readonly acceptanceCheck: GroupAcceptanceCheck;
  readonly sizeRuleId: "TG-2" | "TG-3";
}

/** The result: the groups in task order and the hash that freezes them. */
export interface SliceOfThePhase {
  readonly schema: "specstride.task-groups/1";
  readonly phase: number;
  readonly size: number;
  readonly groups: readonly TaskGroup[];
  /** The canonical record hash over the groups (F153-FR-054). */
  readonly hash: string;
}

/**
 * The acceptance check of one group: the declared command that names every
 * task of the group (the first such command in declaration order), or the
 * record `unchecked` — a group without a resolvable check is never rejected
 * and never passed (F153-FR-055).
 */
function acceptanceCheckOf(
  taskIds: readonly string[],
  declaredCommands: readonly DeclaredCheckCommand[],
): GroupAcceptanceCheck {
  const covers = declaredCommands.find((command) =>
    taskIds.every((taskId) => command.forTaskIds.includes(taskId)),
  );
  if (covers === undefined) return Object.freeze({ kind: "unchecked" as const });
  return Object.freeze({
    kind: "declared" as const,
    id: covers.id,
    argv: Object.freeze([...covers.argv]),
  });
}

/**
 * Slice one phase into task groups (rules TG-2 and TG-3; TG-1 is the
 * caller's decision not to call). Pure over its input: equal inputs give the
 * equal groups and the equal hash, and a changed source — one task's text
 * included — changes the hash.
 */
export function sliceThePhase(input: SliceThePhaseInput): SliceOfThePhase {
  const size =
    input.size !== undefined && input.size >= 1 ? Math.floor(input.size) : TASK_GROUP_SIZE_DEFAULT;
  const declaredCommands = input.declaredCommands ?? [];
  const groups: TaskGroup[] = [];
  // Groups of at most `size` tasks, in task order, never split, the last one
  // shorter (TG-3); fewer tasks than the size make one group (TG-2).
  for (let at = 0; at < input.tasks.length; at += size) {
    const slice = input.tasks.slice(at, at + size);
    const ordinal = Math.floor(at / size) + 1;
    const prefixes = [...new Set(slice.flatMap((task) => input.pathsOfTask(task.id)))];
    const scope = writeScopeOf(prefixes, "task-text");
    const writeScope =
      "refused" in scope
        ? // A scope that cannot be read is never read half way: the group
          // records no prefixes rather than a refused one, which means the
          // whole tree to `scopesOverlap` — the safe reading.
          { prefixes: [], source: "task-text" as const }
        : {
            prefixes: scope.prefixes,
            source: "task-text" as const,
            // `writeScopeOf` narrows over a union one member of which omits
            // the flag: `in` reads it without widening the group's type.
            ...(("caseFolded" in scope ? scope.caseFolded : undefined) === true
              ? { caseFolded: true }
              : {}),
          };
    groups.push(
      Object.freeze({
        schema: TASK_GROUP_SCHEMA,
        groupId: `phase${String(input.phase)}-g${String(ordinal)}`,
        phase: input.phase,
        taskIds: Object.freeze(slice.map((task) => task.id)),
        writeScope: Object.freeze(writeScope),
        acceptanceCheck: acceptanceCheckOf(
          slice.map((task) => task.id),
          declaredCommands,
        ),
        // TG-2: the phase has fewer tasks than the size — one group holding
        // all of them. TG-3: groups of at most the size in task order.
        sizeRuleId: input.tasks.length <= size ? ("TG-2" as const) : ("TG-3" as const),
      }),
    );
  }
  const frozen = Object.freeze(groups);
  return Object.freeze({
    schema: "specstride.task-groups/1" as const,
    phase: input.phase,
    size,
    groups: frozen,
    // F153-FR-054 — the hash binds the SOURCES, not only the groups: the
    // text of each task rides in, so changing one task's text changes the
    // hash even where the groups themselves are equal.
    hash: canonicalRecordHash({
      phase: input.phase,
      size,
      sources: input.tasks.map((task) => ({ id: task.id, text: task.text })),
      groups: frozen,
    }),
  });
}
