/**
 * T019 — the stage graph (F123-FR-019); T113 — the wide mode (F154-FR-048,
 * F154-FR-003).
 *
 * With `pipeline.stageGroups` off the graph is serial as it always was: every
 * group holds exactly one stage, in the order of the launch contract, so the
 * resume predicate is defined over groups and a relaunch always resumes from
 * the one stage that stopped. With the switch on, the groups come from the
 * table of T112 (`admitStage` over `configuration.stageGroups`), in declared
 * order; every decision — admitted or refused — emits ONE
 * `pipeline.stage.admission` event with its rule id before it takes effect
 * (F154-FR-003). No parallel unit is declared here; feature 142 composes its
 * own graph above this one.
 */
import { admitStage } from "./stage-admission.ts";
import type {
  StageAdmissionSignals,
  StageGroupDeclaration,
  StageGroupSoFar,
} from "./stage-admission.ts";
import type { Stage } from "./types.ts";

/** One group of the graph: the stages that run together. Serial: exactly one. */
export type StageGroup = {
  index: number;
  stages: Stage[];
};

/** The declared graph of a contract: `serial` (the switch off) or `wide`. */
export type StageGraph = {
  mode: "serial" | "wide";
  groups: StageGroup[];
};

/** The one `pipeline.stage.admission` event of one admission decision. */
export type StageAdmissionEvent = {
  name: "pipeline.stage.admission";
  time: number;
  fields: {
    stageId: string;
    ruleId: string;
    choice: string;
    signals: StageAdmissionSignals;
  };
};

/** The admission event port of the wide declaration. */
export type StageAdmissionEventPort = {
  write(event: StageAdmissionEvent): void;
};

/** The inputs of the wide declaration (F154-FR-048). */
export type WideStageGraphInput = {
  /** The switch of the user configuration (`pipeline.stageGroups`). */
  readonly pipeline?: { readonly stageGroups?: boolean };
  /** The declaration `configuration.stageGroups` of the launch contract. */
  readonly declaration?: StageGroupDeclaration;
  /** Where each admission event goes; absent, the events are simply not written. */
  readonly events?: StageAdmissionEventPort;
  /** The clock of the event stamps; the tests hand a fixed one in. */
  readonly now?: () => number;
};

/** Declare the graph of the ordered stages: serial, or wide over the table. */
export function declareStageGraph(
  stages: readonly Stage[],
  input?: WideStageGraphInput,
): StageGraph {
  // The switch off (or no declaration): the serial graph of today.
  if (input?.pipeline?.stageGroups !== true || input.declaration === undefined) {
    return {
      mode: "serial",
      groups: stages.map((stage, index) => ({ index, stages: [stage] })),
    };
  }
  // The switch on: admit every declared stage, in declared order, over the
  // pure table of T112 (F154-FR-048); the events are written here, by the
  // composition root — never inside the table itself.
  const declaration = input.declaration;
  const write = input.events?.write;
  const now = input.now ?? Date.now;
  const groupsSoFar: StageGroupSoFar[] = [];
  for (const stage of stages) {
    const decision = admitStage(stage, declaration, groupsSoFar, stages);
    write?.({
      name: "pipeline.stage.admission",
      time: now(),
      fields: {
        stageId: decision.stageId,
        ruleId: decision.ruleId,
        choice: decision.choice,
        signals: decision.signals,
      },
    });
    if (decision.choice === "refuse") continue; // SG-1: the stage is not placed.
    const current = groupsSoFar[groupsSoFar.length - 1];
    if (decision.choice === "same-group") {
      if (current === undefined) {
        // The first stage of the run: the group it opens is the group it joins.
        groupsSoFar.push({ index: 0, stages: [stage] });
      } else {
        current.stages.push(stage);
      }
    } else {
      // `new-group` and `own-group` both open a new group, in declared order;
      // `own-group` opens one that holds only this stage.
      groupsSoFar.push({ index: groupsSoFar.length, stages: [stage] });
    }
  }
  return {
    mode: "wide",
    groups: groupsSoFar.map((group, index) => ({ index, stages: group.stages })),
  };
}

/** The resume predicate over groups: the first group that is not complete. */
export function resumeGroup(
  graph: StageGraph,
  completedStageIds: ReadonlySet<string>,
): StageGroup | null {
  for (const group of graph.groups) {
    if (!group.stages.every((stage) => completedStageIds.has(stage.id))) return group;
  }
  return null;
}
