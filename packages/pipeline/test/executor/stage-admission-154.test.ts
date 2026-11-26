/**
 * T111 — SG-1 to SG-4 over `stage-admission-table.json` (F154-FR-048,
 * F154-FR-003): a pure table, the same inputs give the same decision, and
 * every decision names the rule id that gave it. No file and no process is
 * touched by a decision (Principle XIII, XX).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { STAGE_ADMISSION_TABLE } from "../../src/executor/tables.ts";
import {
  admitStage,
  type StageAdmissionDecision,
} from "../../src/executor/stage-admission.ts";
import type { Stage, StageGroup } from "../../src/executor/types.ts";

/** A minimal stage: id and dependencies only; admission reads nothing else. */
function stageOf(id: string, dependencies: string[] = []): Stage {
  return {
    id,
    kind: "command",
    dependencies,
    preconditions: [],
    postconditions: [],
  };
}

const WIDTH_2 = { width: 2, never_together: [] };

function groupsOf(
  ...stages: Stage[][]
): { index: number; stages: Stage[] }[] {
  return stages.map((stages, index) => ({ index, stages }));
}

test("SG-2: a stage whose dependencies are all placed joins the group being built", () => {
  const a = stageOf("A");
  const b = stageOf("B", ["A"]);
  const decision = admitStage(b, WIDTH_2, groupsOf([a]), [a, b]);
  assert.equal(decision.ruleId, "SG-2");
  assert.equal(decision.choice, "same-group");
  assert.equal(decision.signals.dependenciesInEarlierOrSameGroup, true);
  assert.equal(decision.signals.groupAtWidth, false);
});

test("SG-3: the group at width opens a new group", () => {
  const a = stageOf("A");
  const b = stageOf("B", ["A"]);
  const c = stageOf("C", ["B"]);
  const decision = admitStage(c, WIDTH_2, groupsOf([a, b]), [a, b, c]);
  assert.equal(decision.ruleId, "SG-3");
  assert.equal(decision.choice, "new-group");
  assert.equal(decision.signals.groupAtWidth, true);
});

test("SG-4: a stage with an unmet dependency takes a group of its own", () => {
  const a = stageOf("A");
  const later = stageOf("later", ["not-yet-placed"]);
  const decision = admitStage(later, WIDTH_2, groupsOf([a]), [a, later]);
  assert.equal(decision.ruleId, "SG-4");
  assert.equal(decision.choice, "own-group");
  assert.equal(decision.signals.dependenciesInEarlierOrSameGroup, false);
});

test("SG-2 refuses to join a group that holds a never_together member", () => {
  const a = stageOf("A");
  const b = stageOf("B", ["A"]);
  const declaration = {
    width: 2,
    never_together: [{ stages: ["A", "B"], why: "one lock" }],
  };
  const decision = admitStage(b, declaration, groupsOf([a]), [a, b]);
  assert.notEqual(decision.choice, "same-group");
  assert.equal(decision.signals.neverTogetherWithAMember, true);
  // The group is at width 1 of 2, and the dependency is placed, so the
  // table's next matching row decides: SG-4, its own group.
  assert.equal(decision.ruleId, "SG-4");
  assert.equal(decision.choice, "own-group");
});

test("every decision carries the rule id of the pinned table, deterministically", () => {
  const a = stageOf("A");
  const b = stageOf("B", ["A"]);
  const first: StageAdmissionDecision = admitStage(b, WIDTH_2, groupsOf([a]), [a, b]);
  const second: StageAdmissionDecision = admitStage(b, WIDTH_2, groupsOf([a]), [a, b]);
  assert.deepEqual(first, second);
  const ids = Object.values((STAGE_ADMISSION_TABLE as any).rows as Record<any, any[]>)
    .flat()
    .map((row: any) => row.ruleId);
  assert.ok(ids.includes(first.ruleId), "the rule id must be a row of the table");
});

test("SG-1 signals: a cycle and an unknown stage are read from the declaration facts", () => {
  const a = stageOf("A", ["B"]);
  const b = stageOf("B", ["A"]);
  const decision = admitStage(b, WIDTH_2, [], [a, b]);
  assert.equal(decision.signals.cycle, true);
  const unknown = stageOf("C", ["missing"]);
  assert.equal(admitStage(unknown, WIDTH_2, [], [unknown]).signals.unknownStage, true);
});
