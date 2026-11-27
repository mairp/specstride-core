/**
 * T112 — the admission of a stage into a wide stage group (F154-FR-048,
 * F154-FR-003).
 *
 * A pure table over `STAGE_ADMISSION_TABLE` (`data/stage-admission-table.json`,
 * pinned by `test/tables-154.test.ts`): the same inputs give the same decision,
 * every decision carries its rule id, and nothing here touches a file or a
 * process (the composition root wires it, `graph.ts`).
 *
 * Rule set SG (plan.md, "Rule-id sets fixed by this plan"):
 *  - SG-1  a cycle, an unknown stage or a `never_together` across groups
 *          → refused at validation (exit 20, `validateContract`).
 *  - SG-2  dependencies all in earlier groups or the same group, and no
 *          `never_together` with a member → the same group.
 *  - SG-3  the group is at `width` → a new group, in declared order.
 *  - SG-4  otherwise → its own group.
 */
import { STAGE_ADMISSION_TABLE } from "./tables.ts";
import type { Stage } from "./types.ts";

/** One `never_together` pair of the declaration, with its one-line reason. */
export type NeverTogether = {
  stages: [string, string] | string[];
  why: string;
};

/** The stage-group declaration of the launch contract (`configuration.stageGroups`). */
export type StageGroupDeclaration = {
  width: number;
  never_together: NeverTogether[];
};

/** The six signals of the table's `signals` block. */
export type StageAdmissionSignals = {
  cycle: boolean;
  unknownStage: boolean;
  neverTogetherAcrossGroups: boolean;
  neverTogetherWithAMember: boolean;
  dependenciesInEarlierOrSameGroup: boolean;
  groupAtWidth: boolean;
};

/** The choices of the table: refuse, same-group, new-group, own-group. */
export type StageAdmissionChoice = "refuse" | "same-group" | "new-group" | "own-group";

/** One recorded decision: the rule id, the choice and the signals that gave it. */
export type StageAdmissionDecision = {
  stageId: string;
  ruleId: string;
  choice: StageAdmissionChoice;
  signals: StageAdmissionSignals;
};

type TableRow = {
  ruleId: string;
  when: unknown;
  choice: StageAdmissionChoice;
};

/**
 * One group being built: the stages admitted to it so far. The admission runs
 * over the groups in declared order and always considers the group being
 * built (the last of `groupsSoFar`).
 */
export type StageGroupSoFar = {
  index: number;
  stages: Stage[];
};

/** The signals of the declaration-level facts the table names (SG-1). */
function declarationSignals(
  stages: readonly Stage[],
  declaration: StageGroupDeclaration,
): Pick<StageAdmissionSignals, "cycle" | "unknownStage" | "neverTogetherAcrossGroups"> {
  const known = new Set(stages.map((stage) => stage.id));
  const unknownStage = stages.some((stage) =>
    stage.dependencies.some((dependency) => !known.has(dependency)),
  );
  const cycle = hasDependencyCycle(stages);
  const neverTogetherAcrossGroups = declaration.never_together.some((pair) =>
    pair.stages.some((id) => !known.has(id)),
  );
  return { cycle, unknownStage, neverTogetherAcrossGroups };
}

/** A cycle in the per-stage `depends_on` graph (F107 as amended; SG-1). */
function hasDependencyCycle(stages: readonly Stage[]): boolean {
  const byId = new Map(stages.map((stage) => [stage.id, stage.dependencies]));
  const state = new Map<string, "visiting" | "done">();
  const visit = (id: string): boolean => {
    const at = state.get(id);
    if (at === "visiting") return true;
    if (at === "done") return false;
    state.set(id, "visiting");
    for (const dependency of byId.get(id) ?? []) {
      if (visit(dependency)) return true;
    }
    state.set(id, "done");
    return false;
  };
  return stages.some((stage) => visit(stage.id));
}

/** The signals of one candidate stage against the groups built so far. */
function signalsOf(
  stage: Stage,
  declaration: StageGroupDeclaration,
  groupsSoFar: readonly StageGroupSoFar[],
  declarationLevel: Pick<
    StageAdmissionSignals,
    "cycle" | "unknownStage" | "neverTogetherAcrossGroups"
  >,
): StageAdmissionSignals {
  const current = groupsSoFar[groupsSoFar.length - 1];
  const memberIds = new Set(current?.stages.map((member) => member.id) ?? []);
  const neverTogetherWithAMember = declaration.never_together.some(
    (pair) => pair.stages.includes(stage.id) && pair.stages.some((id) => memberIds.has(id)),
  );
  const placed = new Set(groupsSoFar.flatMap((group) => group.stages.map((m) => m.id)));
  const dependenciesInEarlierOrSameGroup = stage.dependencies.every(
    (dependency) => placed.has(dependency) || memberIds.has(dependency),
  );
  const groupAtWidth = (current?.stages.length ?? 0) >= declaration.width;
  return {
    ...declarationLevel,
    neverTogetherWithAMember,
    dependenciesInEarlierOrSameGroup,
    groupAtWidth,
  };
}

/** Evaluate one row's `when` over the signals (an `and` of `equal` leaves). */
function rowMatches(row: TableRow, signals: StageAdmissionSignals): boolean {
  const when = row.when as
    | {
        op: string;
        of?: { op: string; signal: string; value: boolean }[];
        signal?: string;
        value?: boolean;
      }
    | undefined;
  if (when === undefined) return true; // SG-4: the fallback row holds no condition.
  if (when.op === "equal") {
    return signals[when.signal as keyof StageAdmissionSignals] === when.value;
  }
  if (when.op !== "and") return false;
  return (when.of ?? []).every(
    (leaf) => signals[leaf.signal as keyof StageAdmissionSignals] === leaf.value,
  );
}

/**
 * Admit one stage of a declared wide group (F154-FR-048): a pure table with a
 * rule id, recorded with its reason before it takes effect (F154-FR-003).
 * The caller emits one `pipeline.stage.admission` event per decision.
 */
export function admitStage(
  stage: Stage,
  declaration: StageGroupDeclaration,
  groupsSoFar: readonly StageGroupSoFar[],
  allStages: readonly Stage[] = groupsSoFar.flatMap((group) => group.stages).concat(stage),
): StageAdmissionDecision {
  const signals = signalsOf(
    stage,
    declaration,
    groupsSoFar,
    declarationSignals(allStages, declaration),
  );
  const rows = Object.values(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the parity rows of spec 154 are read as written
    (STAGE_ADMISSION_TABLE as any).rows as Record<string, TableRow[]>,
  ).flat();
  for (const row of rows) {
    if (rowMatches(row, signals)) {
      return { stageId: stage.id, ruleId: row.ruleId, choice: row.choice, signals };
    }
  }
  // Unreachable over the pinned table (SG-4 is the unconditional fallback);
  // a table without a fallback refuses, never guesses (F154-FR-004).
  return { stageId: stage.id, ruleId: "SG-1", choice: "refuse", signals };
}
