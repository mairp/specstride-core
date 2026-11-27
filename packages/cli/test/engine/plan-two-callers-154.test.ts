/**
 * T033 (feature 154, US1) — the doctor and `launch --dry-run` render the plan
 * of the fixture `tests/fixtures/154/plan/` through the ONE renderer
 * `printThePlan`, so the plan lines are the same bytes (F154-SC-002); with the
 * option off and no verbose flag neither prints a plan, and under the
 * `parity` profile neither does (F154-SC-012).
 *
 * The test captures exactly the lines the two call paths forward from
 * `printThePlan` — the lines the doctor writes through its `io`, and the
 * `[PLAN]` texts of the dry-run plan — so no other logging is conflated with
 * the plan. No slot, record or worker is created and nothing is written.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { doctorHandler } from "../../src/engine/handlers.ts";
import { planDryRun, type DryRunLine } from "../../../pipeline/src/entry/dry-run.ts";
import { planAtLaunch } from "../../../layer-parallel/src/plan.ts";
import { scopesOf } from "../../../layer-parallel/src/index.ts";
import type { AdmissionInputs, TaskAsReadAtLaunch } from "../../../layer-parallel/src/index.ts";
import type { Stage } from "../../../pipeline/src/executor/types.ts";
import type { EvaluationContext } from "../../../pipeline/src/kinds/registry.ts";

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

const PLAN = planAtLaunch(
  { runId: "run-154-two-callers", tasks: TASKS, admission: ADMISSION },
  hasher,
);

const ON = Object.freeze({ userConfiguration: "on" } as const);
const OFF = Object.freeze({} as const);
const PARITY = Object.freeze({ profile: "parity", flag: "on" } as const);

const doctorLines = (parallel?: Parameters<typeof doctorHandler>[2]): readonly string[] => {
  const out: string[] = [];
  doctorHandler("/tmp/does-not-matter", { out: (t) => out.push(t), err: () => {} }, parallel);
  // Only the plan lines: the doctor's own findings go to the same stream, and
  // the trailing newline of `io.out` is transport, not plan bytes.
  return out
    .filter((line) => !/^(ok|warn|fail) /.test(line))
    .map((line) => (line.endsWith("\n") ? line.slice(0, -1) : line));
};

const dryRunPlanLines = async (input: {
  units?: string;
  profile?: string;
  verbose?: boolean;
}): Promise<readonly string[]> => {
  const stage = (id: string): Stage => ({
    id,
    kind: "command",
    dependencies: [],
    cwd: undefined,
    action: { argv: ["true"], env: [] },
    preconditions: [],
    postconditions: [],
    recovery: undefined,
  });
  const context: EvaluationContext = { env: {}, cwd: "/tmp", implement: false };
  const plan = await planDryRun({
    contractId: "run-154-two-callers",
    stages: [stage("s1"), stage("s2"), stage("s3"), stage("s4"), stage("s5")],
    implement: false,
    smoke: false,
    checks: { unknown: () => "fail" } as never,
    context,
    shell: {},
    parallel: {
      ...(input.units === undefined ? {} : { units: input.units }),
      ...(input.profile === undefined ? {} : { profile: input.profile }),
      storedPlan: PLAN,
    },
    ...(input.verbose === undefined ? {} : { verbose: input.verbose }),
  });
  // The [PLAN] lines of the dry run also carry the per-stage plan lines; the
  // parallel plan is the trailing block that `printThePlan` forwarded — it
  // opens with the header, or with the one-line label of the option-off
  // branch, and runs to the end of the plan.
  const texts = plan.lines
    .filter((line: DryRunLine) => line.label === "[PLAN]")
    .map((line: DryRunLine) => line.text);
  const start = texts.findIndex((text) =>
    /^(parallel plan:|plan the option would produce)/.test(text),
  );
  return start === -1 ? [] : texts.slice(start);
};

test("plan-two-callers: with the option on, doctor and dry run print the same bytes", async () => {
  for (const verbose of [false, true]) {
    const fromDoctor = doctorLines({ configuration: ON, plan: PLAN, verbose });
    const fromDryRun = await dryRunPlanLines({ units: "on", verbose });
    assert.ok(fromDoctor.length > 0, "the doctor prints the plan with the option on");
    assert.deepEqual(
      [...fromDryRun],
      [...fromDoctor],
      `the plan lines are the same bytes (verbose=${String(verbose)})`,
    );
  }
});

test("plan-two-callers: with the option off and no verbose flag, neither prints a plan", async () => {
  assert.deepEqual(doctorLines({ configuration: OFF, plan: PLAN, verbose: false }), []);
  assert.deepEqual(await dryRunPlanLines({ units: "off", verbose: false }), []);
  // The default too: no flag at all.
  assert.deepEqual(doctorLines({ configuration: OFF, plan: PLAN }), []);
  assert.deepEqual(await dryRunPlanLines({ units: "off" }), []);
});

test("plan-two-callers: under parity neither prints a plan, even verbose (F154-SC-012)", async () => {
  assert.deepEqual(doctorLines({ configuration: PARITY, plan: PLAN, verbose: true }), []);
  assert.deepEqual(await dryRunPlanLines({ units: "on", profile: "parity", verbose: true }), []);
});

test("plan-two-callers: option off + verbose — one identical label, then identical bytes", async () => {
  const fromDoctor = doctorLines({ configuration: OFF, plan: PLAN, verbose: true });
  const fromDryRun = await dryRunPlanLines({ units: "off", verbose: true });
  assert.ok(fromDoctor[0] === "plan the option would produce", "the doctor labels the plan");
  assert.deepEqual([...fromDryRun], [...fromDoctor]);
  assert.deepEqual(
    fromDoctor.filter((line) => line === "plan the option would produce").length,
    1,
    "exactly one label line",
  );
});
