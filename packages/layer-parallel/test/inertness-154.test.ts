/**
 * T013 — inertness of the plan over the fixtures of T011 (F154-SC-012,
 * F154-FR-001): for every fixture of `tests/fixtures/154/` that holds a task
 * list, `planAtLaunch` with every switch off — the layer's fallback reason
 * `classic`, the first precondition of row 60 — returns a plan with no
 * groups, and the fallback is recorded on the plan. Nothing of spec 154
 * changes a plan computed with the switches off.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { planAtLaunch, groupsInThePlan } from "../src/plan.ts";
import type { TaskAsReadAtLaunch } from "../src/admission.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, "../../../tests/fixtures/154");

/** The task list of a fixture, read the way the launch reads it. */
function tasksOf(dir: string): readonly TaskAsReadAtLaunch[] {
  const text = readFileSync(join(dir, "tasks.md"), "utf8");
  const tasks: TaskAsReadAtLaunch[] = [];
  let phase = 1;
  for (const line of text.split("\n")) {
    if (/^## /.test(line)) phase += 1;
    const item = /^- \[( |x)\] (\S+) (.+)$/.exec(line);
    if (item === null) continue;
    tasks.push({
      id: item[2] as string,
      phase,
      marked: item[3].includes("[P]"),
      text: item[3],
      ticked: item[1] === "x",
    });
  }
  return tasks;
}

const directories = readdirSync(FIXTURES, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => name !== "parity-baseline")
  .filter((name) => existsSync(join(FIXTURES, name, "tasks.md")))
  .sort();

test("T013 every fixture of T011 is present", () => {
  assert.deepEqual(directories, [
    "door",
    "groups",
    "phases",
    "plan",
    "slots",
    "spec",
    "stages",
  ]);
});

for (const name of directories) {
  test(`T013 ${name}: with every switch off the plan holds no groups and the fallback is recorded`, () => {
    const dir = join(FIXTURES, name);
    const launch = JSON.parse(readFileSync(join(dir, "launch.json"), "utf8")) as {
      configuration: Record<string, unknown>;
    };
    // Every switch at its default, off.
    for (const value of Object.values(launch.configuration)) {
      assert.equal(value, false, `${name}: every switch of the stub launch is off`);
    }
    const plan = planAtLaunch(
      {
        runId: `fx-154-${name}`,
        tasks: tasksOf(dir),
        // The layer with the switches off: the precondition `classic` holds
        // the option off, and the plan the launch stores records it.
        fallback: "classic",
      },
      {
        canonicalRecordText: (record) => JSON.stringify(record),
        canonicalRecordHash: (record) => JSON.stringify(record),
      },
    );
    assert.equal(plan.fallback, "classic");
    assert.equal(
      groupsInThePlan(plan),
      0,
      `${name}: no group with the switches off`,
    );
    for (const phase of plan.phases) {
      assert.equal(phase.groups.length, 0);
    }
  });
}

test("T018 the proposed admission checks stay outside row 61 with the switches off", async () => {
  const { ADMISSION_CHECKS, PROPOSED_ADMISSION_CHECKS_154, admissionChecksOf, isAdmissionCheck } =
    await import("../src/types.ts");
  for (const entry of PROPOSED_ADMISSION_CHECKS_154) {
    assert.equal(
      [...ADMISSION_CHECKS].includes(entry.check as never),
      false,
      `${entry.check} is a proposal and not a member of row 61`,
    );
    assert.equal(isAdmissionCheck(entry.check), false, entry.check);
  }
  // With every switch off the checks in force are exactly row 61.
  assert.deepEqual(admissionChecksOf(() => false), [...ADMISSION_CHECKS]);
  // A switch on adds only its own check, and only behind its switch.
  assert.deepEqual(
    admissionChecksOf((name) => name === "loop.parallel.noRepeat").slice(-1),
    ["repeat"],
  );
  assert.deepEqual(
    admissionChecksOf((name) => name === "loop.parallel.groupUnits").slice(-1),
    ["dependency"],
  );
  assert.equal(admissionChecksOf(() => false).length, 8);
});
