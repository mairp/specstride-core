/**
 * T028 (feature 154, US1) — `printThePlan` prints the plan of a task list with
 * two `[P]` runs: the groups, every serial task with its reason, and the
 * ceiling statement; terse by default, the serial list behind the verbose
 * flag (F154-FR-009, F154-FR-010, F154-FR-011).
 *
 * The plan is the one `planAtLaunch` derives over the tasks of the fixture
 * `tests/fixtures/154/plan/` (two runs of consecutive `[P]` tasks naming
 * disjoint paths, and one task left serial). No file is read and no file is
 * written: the test is pure, as the printed plan must be (F154-FR-010).
 */
import test from "node:test";
import assert from "node:assert/strict";

import { planAtLaunch, printThePlan, expectedSavingStatement } from "../../../packages/layer-parallel/src/plan.ts";
import { ALONE } from "../../../packages/layer-parallel/src/admission.ts";
import { scopesOf } from "../../../packages/layer-parallel/src/index.ts";
import type { AdmissionInputs, TaskAsReadAtLaunch } from "../../../packages/layer-parallel/src/index.ts";

/* The tasks of FX-154-PLAN (tests/fixtures/154/plan/tasks.md). */
const TASKS: readonly TaskAsReadAtLaunch[] = Object.freeze([
  Object.freeze({ id: "T001", phase: 1, marked: true, text: "Do it in packages/a/" }),
  Object.freeze({ id: "T002", phase: 1, marked: true, text: "Do more in packages/b/" }),
  Object.freeze({ id: "T003", phase: 1, marked: true, text: "Touch c in packages/c/" }),
  Object.freeze({ id: "T004", phase: 1, marked: true, text: "Touch d in packages/d/" }),
  Object.freeze({ id: "T005", phase: 1, marked: false, text: "Serial tail" }),
]);

const ADMISSION: AdmissionInputs = Object.freeze({
  workers: 2,
  scopes: scopesOf(TASKS.map((task) => ({ id: task.id, text: task.text }))),
  innerCheckSet: Object.freeze(["typecheck", "test"]),
  adoptableJobsAlive: 0,
  containment: "C2" as const,
});

const hasher = Object.freeze({
  canonicalRecordText: (record: unknown) => JSON.stringify(record),
  canonicalRecordHash: (record: unknown) => `h-${JSON.stringify(record).length}`,
});

/** The option on: the plan is printed (F154-FR-009). */
const ON = Object.freeze({ userConfiguration: "on" });
/** The option off: nothing is printed (F154-FR-005, F154-FR-009). */
const OFF = Object.freeze({});

test("plan-print: with the option on, the groups, the serial tasks and the ceiling statement are printed", () => {
  const plan = planAtLaunch({ runId: "run-154-plan", tasks: TASKS, admission: ADMISSION }, hasher);
  const lines = printThePlan(plan, ON, "launch --dry-run", { verbose: true });

  const text = lines.join("\n");
  // The two `[P]` runs of the fixture are two groups of the plan.
  assert.ok(text.includes("group 1"), "the first group is named");
  assert.ok(text.includes("group 2"), "the second group is named");
  // Every serial task is printed with its reason.
  const serialLines = lines.filter((line) => line.includes("serial T005"));
  assert.equal(serialLines.length, 1, "the serial tail is printed exactly once");
  assert.match(serialLines[0] ?? "", /reason=/, "the serial task carries its reason");
  // The ceiling, and the statement that it is a ceiling (F154-FR-008, -011).
  assert.match(text, /ceiling=/, "the ceiling of the phase is printed");
  for (const statement of expectedSavingStatement()) {
    assert.ok(lines.includes(statement), `the ceiling statement line is printed: ${statement}`);
  }
});

test("plan-print: with the option on and no verbose flag, the print is terse — no serial list", () => {
  const plan = planAtLaunch({ runId: "run-154-plan", tasks: TASKS, admission: ADMISSION }, hasher);
  const terse = printThePlan(plan, ON, "launch --dry-run");
  const verbose = printThePlan(plan, ON, "launch --dry-run", { verbose: true });

  assert.ok(terse.length > 0, "the terse print is not empty");
  assert.ok(
    terse.every((line) => !line.includes("serial T")),
    "no serial task line is printed by default (F154-FR-010)",
  );
  assert.ok(
    verbose.some((line) => line.includes("serial T005")),
    "the serial list is behind the verbose flag (F154-FR-010)",
  );
});

test("plan-print: with the option off, nothing is printed, with or without the flag", () => {
  const plan = planAtLaunch({ runId: "run-154-plan", tasks: TASKS, admission: ADMISSION }, hasher);
  assert.deepEqual(printThePlan(plan, OFF, "launch --dry-run"), []);
  assert.deepEqual(printThePlan(plan, OFF, "launch --dry-run", { verbose: true }), []);
});

test("plan-print: the serial reason is stated for a task left alone in its run", () => {
  const plan = planAtLaunch({ runId: "run-154-plan", tasks: TASKS, admission: ADMISSION }, hasher);
  const verbose = printThePlan(plan, ON, "doctor", { verbose: true });
  const serialLine = verbose.find((line) => line.includes("serial T005"));
  assert.ok(serialLine, "the serial task is printed");
  // The reason is a stated reason: either the `ALONE` wording with the
  // minimum, or a failed admission check — never an empty reason.
  assert.ok(
    serialLine.includes(`reason=${ALONE}`) || /reason=[a-z]/.test(serialLine),
    `the reason is stated: ${serialLine}`,
  );
});
