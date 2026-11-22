// Feature 153, phase 27 (US5) — CT-153-57, "approval and commit stay per
// phase" (T378).
//
// The groups are DATA and nothing else: a group record carries no approval
// field, no commit field and no verdict of any kind — the approval record and
// the approval commit of the loop are written by the phase gate alone (one
// approval record and one commit per approved phase, F101-FR-019), and the
// derive-time slicer cannot mint either. The slicing hash binds the group's
// task texts alone (F153-FR-054), so a group can never stand in for the
// phase's own evidence: a changed task text re-freezes the groups, and no
// group state survives into the approval record of the phase.
import assert from "node:assert/strict";
import test from "node:test";

import {
  sliceThePhase,
  TASK_GROUP_SCHEMA,
  TASK_GROUP_SIZE_DEFAULT,
  type SliceThePhaseInput,
} from "../src/spec-groups/slicer.ts";

const TASKS = [
  { id: "T001", text: "Add src/a.ts" },
  { id: "T002", text: "Add src/b.ts" },
  { id: "T003", text: "Add src/c.ts" },
];

function inputOf(tasks: readonly { id: string; text: string }[]): SliceThePhaseInput {
  return { phase: 1, size: TASK_GROUP_SIZE_DEFAULT, tasks, pathsOfTask: () => [] };
}

test("CT-153-57 a group record carries no approval or commit field", () => {
  const slice = sliceThePhase(inputOf(TASKS));
  assert.equal(slice.groups.length, 1, "three tasks under the default size 5: one group (TG-2)");
  const group = slice.groups[0];
  assert.equal(group?.schema, TASK_GROUP_SCHEMA);
  // The closed key set of a group: no verdict, no approval, no commit.
  assert.deepEqual(
    Object.keys(group ?? {}).sort(),
    ["acceptanceCheck", "groupId", "phase", "schema", "sizeRuleId", "taskIds", "writeScope"],
  );
  // The acceptance check is a check record, never an outcome: `unchecked` or
  // a declared argv — never `passed`, never `approved`.
  for (const key of ["passed", "approved", "rejected", "verdict", "commit"] as const) {
    assert.ok(!(key in (group ?? {})), `a group carries no ${key} key`);
  }
  // And the whole frozen document is the same: the only kinds it names are
  // groups, a phase and a size.
  assert.deepEqual(Object.keys(slice).sort(), ["groups", "hash", "phase", "schema", "size"]);
});

test("CT-153-57 the group hash binds the task texts, not any approval state", () => {
  const first = sliceThePhase(inputOf(TASKS));
  const same = sliceThePhase(inputOf(TASKS));
  assert.equal(first.hash, same.hash, "equal sources give equal bytes (F153-FR-054)");
  // One task's text changes → the hash changes: the groups re-freeze, so no
  // group-derived record can outlive the tasks it was sliced from.
  const changed = sliceThePhase(
    inputOf([{ id: "T001", text: "Add src/a.ts and src/a2.ts" }, ...TASKS.slice(1)]),
  );
  assert.notEqual(first.hash, changed.hash);
  // The hash binds the TEXTS, not just the ids: same ids, different text.
  assert.notEqual(first.hash, changed.hash, "the text of a task is a source");
  // And the groups of a changed phase still carry no approval state: the
  // re-freeze mints data again, not an approval.
  assert.ok(
    (changed.groups[0]?.taskIds ?? []).every((id) => ["T001", "T002", "T003"].includes(id)),
  );
});

test("CT-153-57 two groups of a phase stay two groups: no merging record exists", () => {
  // Six tasks under size 3: two groups, in task order, never split (TG-3).
  const slice = sliceThePhase({
    phase: 3,
    size: 3,
    tasks: [...TASKS, { id: "T004", text: "Add src/d.ts" }, { id: "T005", text: "Add src/e.ts" }, { id: "T006", text: "Add src/f.ts" }],
    pathsOfTask: () => [],
  });
  assert.equal(slice.groups.length, 2);
  assert.deepEqual(slice.groups.map((group) => group.groupId), ["phase3-g1", "phase3-g2"]);
  assert.deepEqual(slice.groups[0]?.taskIds, ["T001", "T002", "T003"]);
  assert.deepEqual(slice.groups[1]?.taskIds, ["T004", "T005", "T006"]);
  // Each group still carries only its own tasks: no group spans the phase,
  // so no group review can approve the phase.
  const all = slice.groups.flatMap((group) => [...group.taskIds]).sort();
  assert.deepEqual(all, ["T001", "T002", "T003", "T004", "T005", "T006"]);
});
