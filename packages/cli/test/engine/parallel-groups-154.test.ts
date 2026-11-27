/**
 * THE GROUPS LOOP, TESTED (T045, feature 154 / US2, F154-FR-020).
 *
 * A phase works EVERY group of its plan, one after the other in plan order,
 * each at its own clean boundary — not only the plan's first group. The plan
 * here is the one of `tests/fixtures/154/groups`: three groups, one task in
 * each (T001, T002, T003), nothing serial.
 *
 * The independent fact the tests pin:
 *
 *  - one start of the wiring starts all three groups, in plan order (1, 2,
 *    3), each only after the tasks that precede it are worked — group 2 may
 *    start because group 1's integration ticked T001 on the task list
 *    (F143-FR-021);
 *  - a group the reading of F142-FR-018 leaves with fewer than
 *    `GROUP_MIN_TASKS` tasks (a task of it was worked — here the task list
 *    ticks it before the start) is CANCELLED: it closes no group, its tasks
 *    stay on the main line, and the NEXT group of the plan still starts.
 */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import type { ClosedGroup, ParallelPlan } from "../../../layer-parallel/src/index.ts";
import {
  parallelWiringOfTheAttempt,
  type ParallelWiringInput,
} from "../../src/engine/parallel-wiring.ts";

import { fixtureOf, wiringOf } from "./parallel-wiring.test.ts";

const TASK_LIST = "tasks.md";

/** The plan of the fixture of 154: three groups, one task each, in order. */
function planOfThreeGroups(serial: readonly string[] = []): ParallelPlan {
  const scope = { prefixes: ["src"], source: "task-text" as const };
  const all = ["T001", "T002", "T003"];
  return {
    schema: "specstride.parallel-plan/1",
    runId: "run-wiring",
    hash: "plan-hash-groups-154",
    workers: 3 - serial.length,
    fallback: undefined,
    phases: [
      {
        phase: 2,
        groups: all
          .map((taskId, index) => ({
            ordinal: index + 1,
            phase: 2,
            tasks: serial.includes(taskId) ? [] : [taskId],
          }))
          .filter((group) => group.tasks.length > 0),
        tasks: all.map((id) => ({ id, scope, checks: [] })),
        serial: [...serial],
        ceiling: 3 - serial.length,
      },
    ],
  };
}

function inputOfThreeGroups(
  overrides: {
    readonly plan?: ParallelPlan;
    readonly tickBefore?: boolean;
    readonly onClosed?: (closed: ClosedGroup) => void;
  } = {},
): { readonly input: ParallelWiringInput; readonly cleanup: () => void } {
  const fixture = fixtureOf("groups-154");
  const base = wiringOf(fixture, { plan: overrides.plan ?? planOfThreeGroups() });
  return {
    input: {
      ...base.input,
      keptUnitsOf: () => [],
      ...(overrides.onClosed === undefined
        ? {}
        : { onClosed: (closed: ClosedGroup) => overrides.onClosed?.(closed) }),
    },
    cleanup: fixture.cleanup,
  };
}

test("a phase with three groups starts all three, in plan order, each at its clean boundary", async () => {
  const closedInOrder: string[] = [];
  const said: string[] = [];
  const { input, cleanup } = inputOfThreeGroups({
    onClosed: (closed) => closedInOrder.push(closed.groupId),
  });
  try {
    const wiring = parallelWiringOfTheAttempt({ ...input, say: (line) => said.push(line) });
    // One start of the wiring carries the WHOLE plan, not one group.
    assert.equal(await wiring.startIfTheBoundaryIsClean(), true);
    // The groups closed in PLAN ORDER: g-2-1, then g-2-2, then g-2-3.
    assert.deepEqual(closedInOrder, ["g-2-1", "g-2-2", "g-2-3"]);
    // Each group started in order: the say lines record three starts, and
    // never an unclean-boundary refusal.
    const started = said.filter((line) => line.includes("of phase 2 started"));
    assert.equal(started.length, 3);
    assert.ok(
      !said.some((line) => line.includes("the group does not start yet")),
      `an unclean boundary in ${JSON.stringify(said)}`,
    );
    // Every task of the phase is ticked on the task list after its group.
    const tasks = readFileSync(join(input.workspace, TASK_LIST), "utf8");
    assert.match(tasks, /- \[x\] T001 /);
    assert.match(tasks, /- \[x\] T002 /);
    assert.match(tasks, /- \[x\] T003 /);
    // The plan is worked out: no reserved block stands any more.
    assert.equal(wiring.reservedBlock(), "");
  } finally {
    cleanup();
  }
});

test("a group left with fewer than two tasks after a tick is cancelled, and the next group still starts", async () => {
  const closedIds: string[] = [];
  const said: string[] = [];
  const { input, cleanup } = inputOfThreeGroups({
    // The SECOND group loses its only task, T002, to the task list before
    // the start: no task is left, fewer than GROUP_MIN_TASKS — cancelled.
    plan: planOfThreeGroups(),
    onClosed: (closed) => closedIds.push(closed.groupId),
  });
  try {
    writeFileSync(
      join(input.workspace, TASK_LIST),
      "## Phase 2: the wiring work\n- [ ] T001 the first task\n- [x] T002 the second task\n- [ ] T003 the third\n",
    );
    const wiring = parallelWiringOfTheAttempt({ ...input, say: (line) => said.push(line) });
    assert.equal(await wiring.startIfTheBoundaryIsClean(), true);
    // Group 1 ran; group 2 is cancelled (F154-FR-020, F142-FR-018) and group 3
    // — the NEXT group of the plan — still starts at its own boundary.
    assert.deepEqual(closedIds, ["g-2-1", "g-2-3"]);
    assert.ok(
      said.some((line) => line.includes("group 2 is cancelled")),
      `no cancellation line in ${JSON.stringify(said)}`,
    );
    assert.ok(
      said.some((line) => line.includes("fewer than 2")),
      `no fewer-than-two line in ${JSON.stringify(said)}`,
    );
    // The cancelled group's task was never worked by a worker of the group:
    // its tick stands (the pre-start one) but its tree got no worker write,
    // while group 3's task is ticked by its own group's integration.
    const tasks = readFileSync(join(input.workspace, TASK_LIST), "utf8");
    assert.match(tasks, /- \[x\] T001 /);
    assert.match(tasks, /- \[x\] T002 /); // the pre-start tick stands
    assert.match(tasks, /- \[x\] T003 /);
    assert.ok(
      !readFileSync(join(input.workspace, "src", "002.ts"), "utf8").includes("T002 was here"),
      "a worker of the cancelled group wrote the tree",
    );
  } finally {
    cleanup();
  }
});
