/**
 * T104 — the conformance suite at contract level for EP-05, the check runner
 * (annex C, §C.8): CT-100-197, CT-100-198, CT-100-199, CT-100-200.
 *
 * Before the named cases the suite checks the five things every suite at
 * contract level checks (annex A, §A.4). The behaviour of EP-05 belongs to
 * feature 148, with 105 as its consumer; its behaviour cases go in this
 * folder beside this file.
 */
import assert from "node:assert/strict";
import {
  CONDITIONS,
  CONDITION_OF_A_CHANGED_PROTECTED_SET,
  CONDITION_WHEN_UNKNOWN,
  OPERATIONS,
  PARALLELISM_CEILING,
  PARALLELISM_DEFAULT,
  PARALLELISM_KEY,
  POINT_ID,
  RESUMED_STEPS_COUNT_AS_EVIDENCE,
  STEP_RUNNER_DEFAULT_ON,
  STEP_RUNNER_KEY,
  mayRunBeside,
  type ManifestEntry,
} from "@specstride/contracts/ep/check-runner";
import { implementation } from "../../samples/EP-05/index.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-05" as const;

const entry = (id: string, more: Partial<ManifestEntry> = {}): ManifestEntry =>
  Object.freeze({
    id,
    kind: "command" as const,
    argv: ["/sample/bin/check"],
    phase: 1,
    timeLimitMs: 1000,
    ...more,
  }) as ManifestEntry;

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-197",
    title:
      "the runner is handle-based with the six operations and returns each condition in a field of its own (F100-FR-097)",
    level: "contract",
    proves: ["F100-FR-097"],
    async run(impl) {
      assert.deepEqual(
        [...OPERATIONS],
        ["pin", "start", "poll", "result", "cancel", "environment"],
      );
      const identity = await (operationOf(impl, "pin") as (e: unknown) => Promise<unknown>)(
        entry("pass"),
      );
      const handle = await (operationOf(impl, "start") as (i: unknown) => Promise<{ id: string }>)({
        identity,
        workingDirectory: "/tmp",
        environmentAllowList: ["PATH"],
        timeLimitMs: 1000,
        containment: "C1",
      });
      assert.equal(typeof handle.id, "string");
      const result = (await (
        operationOf(impl, "result") as (h: unknown) => Promise<Record<string, unknown>>
      )(handle)) as Record<string, unknown>;
      for (const condition of CONDITIONS) {
        assert.equal(typeof result[condition], "boolean", `${condition} is no field of its own`);
      }
    },
  },
  {
    id: "CT-100-198",
    title:
      "a result obtained against a changed protected set carries the condition `tainted` and never halts the run (F100-FR-098)",
    level: "contract",
    proves: ["F100-FR-098"],
    run() {
      assert.equal(CONDITION_OF_A_CHANGED_PROTECTED_SET, "tainted");
      assert.ok(CONDITIONS.includes("tainted"));
    },
  },
  {
    id: "CT-100-199",
    title:
      "`verification.parallelism` has the default 1 and the ceiling 4, and an undeclared command runs alone (F100-FR-099)",
    level: "contract",
    proves: ["F100-FR-099"],
    run() {
      assert.equal(PARALLELISM_KEY, "verification.parallelism");
      assert.equal(PARALLELISM_DEFAULT, 1);
      assert.equal(PARALLELISM_CEILING, 4);
      const declaredA = entry("a", { reads: ["src"], writes: ["out-a"] });
      const declaredB = entry("b", { reads: ["src"], writes: ["out-b"] });
      const conflicting = entry("c", { reads: ["out-a"], writes: ["out-c"] });
      const undeclared = entry("d");
      assert.equal(mayRunBeside(declaredA, declaredB), true);
      assert.equal(mayRunBeside(declaredA, conflicting), false);
      assert.equal(mayRunBeside(declaredA, undeclared), false);
    },
  },
  {
    id: "CT-100-200",
    title:
      "the step runner is an option that is off by default, and a resumed run of steps never counts as evidence of a pass (F100-FR-100)",
    level: "contract",
    proves: ["F100-FR-100"],
    run() {
      assert.equal(STEP_RUNNER_KEY, "verification.step_runner");
      assert.equal(STEP_RUNNER_DEFAULT_ON, false);
      assert.equal(RESUMED_STEPS_COUNT_AS_EVIDENCE, false);
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-05/operations-exist",
      "EP-05/closed-result-sets",
      "EP-05/degradation",
      "EP-05/unknown-value-rule",
      "EP-05/behaviour-cases",
    ],
    {
      resultSets: [
        {
          operation: "poll",
          members: [(v: unknown) => ["running", "ended"].includes((v as { state: string }).state)],
          calls: [[{ id: "handle-1" }]],
        },
        {
          operation: "result",
          members: [
            (v: unknown) =>
              CONDITIONS.every((c) => typeof (v as Record<string, unknown>)[c] === "boolean"),
          ],
          calls: [[{ id: "handle-1" }]],
        },
      ],
      throwingOperation: "start",
    },
  ),
  ...named,
]);

/** An unknown condition in a result makes the result `unchecked` (§C.8). */
export const CONDITION_FOR_AN_UNKNOWN = CONDITION_WHEN_UNKNOWN;

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
