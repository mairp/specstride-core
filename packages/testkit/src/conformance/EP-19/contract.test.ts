/**
 * T145 — the conformance suite at contract level for EP-19, the stage kind
 * and the precondition check (annex F, §F.7): CT-100-266, CT-100-267.
 *
 * Before the named cases the suite checks the five things every suite at
 * contract level checks (annex A, §A.4). The behaviour of EP-19 belongs to
 * feature 123; its behaviour cases go in this folder beside this file.
 */
import assert from "node:assert/strict";
import {
  AS_IS_LEGACY_SPELLING_IS_ACCEPTED,
  BUILT_IN_PRECONDITION_CHECKS,
  BUILT_IN_STAGE_KINDS,
  CHECK_OUTCOME_ON_A_THROW,
  CHECK_TIMINGS,
  CHILD_EXIT_THAT_ENDS_THE_PIPELINE,
  CORE_GUARANTEES,
  EVALUATE_OUTCOMES,
  IMPLEMENTATION_GUARANTEES,
  INVALID_LAUNCH_CONTRACT_PIPELINE_CODE,
  OPERATIONS,
  PINNED_KEYS_SUBJECTS,
  PIPELINE_CODE_WHEN_A_CHILD_EXITS_6,
  PIPELINE_STATE_WHEN_A_CHILD_EXITS_6,
  POINT_ID,
  REGISTRIES,
  STAGE_REASON_ON_A_THROW,
  THE_VALUE_FROM_THE_SHELL_IS_STRIPPED,
  unknownKindMessage,
} from "@specstride/contracts/ep/stage-kind";
import { PRECONDITION_CHECK, STAGE_KIND, implementation } from "../../samples/EP-19/index.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-19" as const;

const stage = Object.freeze({ name: "the sample stage", kind: STAGE_KIND });
const flags = Object.freeze({ implement: true, smoke: false });

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-266",
    title:
      "stage kinds and precondition checks are registries with the five and the six built-in entries, and the schema of the launch contract names a kind by id and holds no closed list (F100-FR-166)",
    level: "contract",
    proves: ["F100-FR-166"],
    async run(impl) {
      assert.deepEqual([...REGISTRIES], ["stage-kinds", "precondition-checks"]);
      assert.deepEqual(
        [...BUILT_IN_STAGE_KINDS],
        ["setup", "decision", "command", "specstride", "smoke"],
      );
      assert.deepEqual(
        [...BUILT_IN_PRECONDITION_CHECKS],
        [
          "file_exists",
          "dir_exists",
          "env_set",
          "command_available",
          "command_success",
          "json_field_equals",
        ],
      );
      assert.deepEqual([...OPERATIONS], ["validate", "run", "evaluate"]);
      assert.deepEqual([...CHECK_TIMINGS], ["preflight", "stage"]);
      assert.deepEqual([...EVALUATE_OUTCOMES], ["pass", "fail", "deferred"]);
      // A sample kind and a sample check that the built-in lists do not hold
      // are validated, shown by the dry run and executed, with no change to
      // the schema of the launch contract or to the stage executor.
      assert.equal((BUILT_IN_STAGE_KINDS as readonly string[]).includes(STAGE_KIND), false);
      assert.equal(
        (BUILT_IN_PRECONDITION_CHECKS as readonly string[]).includes(PRECONDITION_CHECK),
        false,
      );
      const validate = operationOf(impl, "validate") as (s: unknown) => readonly unknown[];
      assert.deepEqual([...validate(stage)], []);
      assert.equal(validate({ kind: "no-such-kind" }).length, 2);
      const result = await (
        operationOf(impl, "run") as (
          s: unknown,
          f: unknown,
          e: unknown,
          t: number,
        ) => Promise<Record<string, unknown>>
      )(stage, flags, { PATH: "/usr/bin" }, 1000);
      assert.equal(result["exitCode"], 0);
      assert.equal(typeof result["stageReason"], "string");
      assert.equal(typeof result["digestEvidencePath"], "string");
      const evaluate = operationOf(impl, "evaluate") as (
        d: unknown,
        t: string,
        dry: boolean,
      ) => Promise<string>;
      assert.equal(await evaluate({ passes: true }, "preflight", false), "pass");
      assert.equal(await evaluate({ passes: false }, "stage", false), "fail");
      // In a dry run the check executes nothing and reports `deferred`.
      assert.equal(await evaluate({ needsExecution: true }, "stage", true), "deferred");
      // A kind the registries do not hold makes the launch contract invalid.
      assert.equal(INVALID_LAUNCH_CONTRACT_PIPELINE_CODE, 20);
      assert.match(unknownKindMessage("stage-kinds", "nope"), /pipeline code 20/);
      assert.equal(AS_IS_LEGACY_SPELLING_IS_ACCEPTED, false);
      // A stage kind that throws ends the stage with `exec-error:` and detail.
      const thrown = await (
        operationOf(impl, "run") as (
          s: unknown,
          f: unknown,
          e: unknown,
          t: number,
        ) => Promise<Record<string, unknown>>
      )({ ...stage, throws: true }, flags, {}, 1000);
      assert.match(String(thrown["stageReason"]), new RegExp(`^${STAGE_REASON_ON_A_THROW}`));
      assert.equal(await evaluate({ throws: true }, "stage", false), CHECK_OUTCOME_ON_A_THROW);
      assert.equal(CHILD_EXIT_THAT_ENDS_THE_PIPELINE, 6);
      assert.equal(PIPELINE_CODE_WHEN_A_CHILD_EXITS_6, 22);
      assert.equal(PIPELINE_STATE_WHEN_A_CHILD_EXITS_6, "stopped");
      assert.equal(CORE_GUARANTEES.length, 4);
      assert.equal(IMPLEMENTATION_GUARANTEES.length, 3);
    },
  },
  {
    id: "CT-100-267",
    title:
      "a key the launch contract pins takes its value in every child of the runtime root, the value from the shell is stripped, and this holds for those keys and no other (F100-FR-167)",
    level: "contract",
    proves: ["F100-FR-167"],
    run() {
      assert.equal(THE_VALUE_FROM_THE_SHELL_IS_STRIPPED, true);
      assert.deepEqual(
        [...PINNED_KEYS_SUBJECTS],
        [
          "the learning mode",
          "the bound of learning decisions",
          "live output in a run without a terminal",
        ],
      );
      assert.ok(CORE_GUARANTEES.some((g) => g.includes("strips the pinned keys")));
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-19/operations-exist",
      "EP-19/closed-result-sets",
      "EP-19/degradation",
      "EP-19/unknown-value-rule",
      "EP-19/behaviour-cases",
    ],
    {
      resultSets: [
        {
          operation: "evaluate",
          members: [...EVALUATE_OUTCOMES],
          calls: [
            [{ passes: true }, "preflight", false],
            [{ passes: false }, "stage", false],
            [{ needsExecution: true }, "stage", true],
            [{ throws: true }, "stage", false],
          ],
        },
      ],
      throwingOperation: "run",
    },
  ),
  ...named,
]);

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
