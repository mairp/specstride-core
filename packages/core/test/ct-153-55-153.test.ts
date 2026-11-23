// Feature 153, phase 27 (US5) — CT-153-55, "a scope and a check, or
// unchecked" (F153-FR-055, T373).
//
// Each group carries the write scope `writeScopeOf` gives for its tasks (the
// union of the paths the tasks' texts name, source `task-text`, never the
// proposer) and an acceptance check that is a declared fixed argument list
// resolved from the declarations (F105-FR-015); a group for which no declared
// check resolves is `unchecked` — never rejected, never passed.
import assert from "node:assert/strict";
import test from "node:test";

import {
  sliceThePhase,
  type DeclaredCheckCommand,
  type SliceThePhaseInput,
} from "../../../packages/core/src/spec-groups/slicer.ts";

const TASKS = [
  { id: "T001", text: "Add src/a.ts" },
  { id: "T002", text: "Add src/b.ts" },
  { id: "T003", text: "Add src/c.ts" },
  { id: "T004", text: "Add src/d.ts" },
  { id: "T005", text: "Add src/e.ts" },
  { id: "T006", text: "Add src/f.ts" },
];

function inputOf(
  tasks: readonly { id: string; text: string }[],
  declaredCommands?: readonly DeclaredCheckCommand[],
): SliceThePhaseInput {
  return {
    phase: 2,
    size: 3,
    tasks,
    pathsOfTask: (taskId) => [`src/${taskId.slice(1).toLowerCase()}.ts`],
    declaredCommands,
  };
}

test("CT-153-55 each group carries the write scope of its tasks", () => {
  const slice = sliceThePhase(inputOf(TASKS));
  assert.equal(slice.groups.length, 2);
  const [first, second] = slice.groups;
  // `writeScopeOf` of the union of the paths the tasks' texts name: the
  // source is `task-text`, never the proposer, and the prefixes are the
  // union, de-duplicated, in first-seen order.
  assert.deepEqual(first?.writeScope.prefixes, ["src/001.ts", "src/002.ts", "src/003.ts"]);
  assert.equal(first?.writeScope.source, "task-text");
  assert.deepEqual(second?.writeScope.prefixes, ["src/004.ts", "src/005.ts", "src/006.ts"]);
  assert.equal(second?.writeScope.source, "task-text");
});

test("CT-153-55 a resolved acceptance check is a declared fixed argument list", () => {
  const declared: DeclaredCheckCommand[] = [
    { id: "unit.a.b.c", argv: ["npm", "test", "--", "a/b"], forTaskIds: ["T001", "T002"] },
    {
      id: "unit.first-group",
      argv: ["node", "bin/check.js", "--group", "1"],
      forTaskIds: ["T001", "T002", "T003"],
    },
  ];
  const slice = sliceThePhase(inputOf(TASKS, declared));
  const check = slice.groups[0]?.acceptanceCheck;
  assert.equal(check?.kind, "declared");
  assert.ok(check?.kind === "declared");
  // Fixed argv, taken from the declarations (F105-FR-015): never a shell
  // string, never a command the declarations do not hold.
  assert.equal(check.id, "unit.first-group");
  assert.deepEqual(check.argv, ["node", "bin/check.js", "--group", "1"]);
});

test("CT-153-55 a group with no resolvable check is unchecked — never rejected, never passed", () => {
  // No declared command names the tasks of the second group: it resolves to
  // `unchecked`, which is a record, not a verdict.
  const slice = sliceThePhase(inputOf(TASKS));
  assert.deepEqual(slice.groups[1]?.acceptanceCheck, { kind: "unchecked" });
  // And a phase with no declarations at all leaves every group unchecked.
  const bare = sliceThePhase(inputOf(TASKS, []));
  for (const group of bare.groups) {
    assert.deepEqual(group.acceptanceCheck, { kind: "unchecked" });
  }
});
