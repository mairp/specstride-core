// Feature 153, phase 27 (US5) — CT-153-54, "the slicing is deterministic and
// hashed" (F153-FR-054, T372, T375).
//
//  - T372: `sliceThePhase` on the same tasks gives the same groups and the
//    same hash; the groups follow task order and never split a task; changing
//    the text of one task changes the hash.
//  - T375: the slicing is FROZEN into the launch contract under
//    `configuration` (CQ-153-07 A — no new top-level key), at the place
//    `buildDraft` of `packages/pipeline/src/contract/draft/build.ts` holds,
//    and changing the sources changes the hash the contract freezes.
import assert from "node:assert/strict";
import test from "node:test";

import {
  TASK_GROUP_SIZE_DEFAULT,
  sliceThePhase,
  type SliceThePhaseInput,
} from "../../../packages/core/src/spec-groups/slicer.ts";
import { buildDraft } from "../../../packages/pipeline/src/contract/draft/build.ts";

const TASKS = [
  { id: "T001", text: "Add src/a.ts and read src/a.ts" },
  { id: "T002", text: "Add src/b.ts" },
  { id: "T003", text: "Add src/c.ts" },
  { id: "T004", text: "Add src/d.ts" },
  { id: "T005", text: "Add src/e.ts" },
  { id: "T006", text: "Add src/f.ts" },
  { id: "T007", text: "Add src/g.ts" },
];

function inputOf(tasks: readonly { id: string; text: string }[]): SliceThePhaseInput {
  return {
    phase: 1,
    tasks,
    pathsOfTask: (taskId) => [`src/${taskId.slice(1).toLowerCase()}.ts`],
  };
}

test("CT-153-54 the same tasks give the same groups and the same hash", () => {
  const first = sliceThePhase(inputOf(TASKS));
  const second = sliceThePhase(inputOf(TASKS));
  assert.deepEqual(second.groups, first.groups);
  assert.equal(second.hash, first.hash, "equal sources give the equal hash (F153-FR-054)");
  assert.notEqual(first.hash, "");
});

test("CT-153-54 the groups follow task order and never split a task", () => {
  const slice = sliceThePhase(inputOf(TASKS));
  // Groups of at most the ruled size (TG-3), in task order, the last one
  // shorter, no task in two groups and no task left out.
  assert.equal(slice.size, TASK_GROUP_SIZE_DEFAULT);
  assert.equal(slice.groups.length, 2);
  const seen: string[] = [];
  for (const group of slice.groups) {
    assert.ok(group.taskIds.length <= TASK_GROUP_SIZE_DEFAULT);
    for (const taskId of group.taskIds) {
      assert.ok(!seen.includes(taskId), `task ${taskId} is split across groups`);
      seen.push(taskId);
    }
  }
  assert.deepEqual(seen, TASKS.map((task) => task.id), "task order is kept whole");
  assert.deepEqual(
    slice.groups[0]?.taskIds,
    TASKS.slice(0, TASK_GROUP_SIZE_DEFAULT).map((task) => task.id),
  );
  assert.deepEqual(
    slice.groups[1]?.taskIds,
    TASKS.slice(TASK_GROUP_SIZE_DEFAULT).map((task) => task.id),
    "the last group is the shorter one",
  );
});

test("CT-153-54 fewer tasks than the size make one group (TG-2)", () => {
  const slice = sliceThePhase(inputOf(TASKS.slice(0, 3)));
  assert.equal(slice.groups.length, 1);
  assert.equal(slice.groups[0]?.sizeRuleId, "TG-2");
  assert.deepEqual(slice.groups[0]?.taskIds, ["T001", "T002", "T003"]);
});

test("CT-153-54 changing the text of one task changes the hash", () => {
  const changed = TASKS.map((task) =>
    task.id === "T004" ? { ...task, text: `${task.text} (revised)` } : task,
  );
  const before = sliceThePhase(inputOf(TASKS));
  const after = sliceThePhase(inputOf(changed));
  assert.notEqual(after.hash, before.hash, "a changed source changes the hash (F153-FR-054)");
});

test("T375 the slicing is frozen in the launch contract under configuration", () => {
  const slice = sliceThePhase(inputOf(TASKS));
  const base = {
    root: "/tmp/specstride-freeze",
    featureDirs: ["specs/001-one"],
    features: [],
    sources: [],
    facts: {
      commit: "0".repeat(40),
      branch: "main",
      clean: true,
    } as never,
    prerequisites: [],
    shellCandidates: [],
    verificationDocuments: [],
    tasks: [],
    counts: { sourceDeclarations: 0, normalizedCommands: 0, phaseMappings: 0 } as never,
    verificationMode: "off" as const,
    verificationReason: "test",
  };
  // CQ-153-07 A: the groups sit under `configuration`, never a new top-level
  // key, at the place `buildDraft` derives them.
  const frozen = buildDraft({ ...base, taskGroups: { schema: "specstride.task-groups-frozen/1", hashes: { phase1: slice.hash }, groups: slice.groups } });
  const read = (frozen.configuration as Record<string, unknown>).taskGroups as {
    hashes: Record<string, string>;
    groups: unknown[];
  };
  assert.equal(read.hashes["phase1"], slice.hash);
  assert.deepEqual(read.groups, slice.groups);
  const unfrozen = buildDraft(base);
  assert.equal((unfrozen.configuration as Record<string, unknown>).taskGroups, undefined);

  // Changing the sources changes the hash the contract freezes: the contract
  // that derives from the changed task text freezes a different hash.
  const changed = TASKS.map((task) =>
    task.id === "T004" ? { ...task, text: `${task.text} (revised)` } : task,
  );
  const after = sliceThePhase(inputOf(changed));
  const frozenAfter = buildDraft({ ...base, taskGroups: { schema: "specstride.task-groups-frozen/1", hashes: { phase1: after.hash }, groups: after.groups } });
  const readAfter = (frozenAfter.configuration as Record<string, unknown>).taskGroups as {
    hashes: Record<string, string>;
  };
  assert.notEqual(
    readAfter.hashes["phase1"],
    read.hashes["phase1"],
    "changing the sources changes the contract hash (F153-FR-054)",
  );
});
