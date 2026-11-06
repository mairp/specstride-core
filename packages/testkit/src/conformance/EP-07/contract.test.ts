/**
 * T107 — the conformance suite at contract level for EP-07, the
 * verification-plan source (annex C, §C.9): CT-100-201, CT-100-202,
 * CT-100-203.
 *
 * Before the named cases the suite checks the five things every suite at
 * contract level checks (annex A, §A.4). The behaviour of EP-07 belongs to
 * feature 105, with 107 for the inventory of the launch contract; its
 * behaviour cases go in this folder beside this file.
 */
import assert from "node:assert/strict";
import {
  A_SOURCE_WRITES,
  OPERATIONS,
  PLAN_IS_FROZEN_AT_LAUNCH,
  POINT_ID,
  PROVENANCES_THAT_COUNT_AS_DECLARED,
  STORED_MANIFEST_APPLIES_ON_A_DIFFERENCE,
  UNKNOWN_MODE_EXIT_CODE,
  VERIFICATION_MODES,
  VERIFICATION_MODE_DEFAULT,
} from "@specstride/contracts/ep/verification-source";
import { DECLARED, implementation } from "../../samples/EP-07/index.ts";
import { sampleModel } from "../../samples/EP-03/index.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-07" as const;

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-201",
    title:
      "the source offers `discover`, `obligations` and `conflicts`, each command carries its provenance, and the plan is frozen at launch (F100-FR-101)",
    level: "contract",
    proves: ["F100-FR-101"],
    async run(impl) {
      assert.deepEqual([...OPERATIONS], ["discover", "obligations", "conflicts"]);
      const commands = await (
        operationOf(impl, "discover") as (w: string, m: unknown) => Promise<readonly unknown[]>
      )("/tmp/workspace", sampleModel);
      assert.equal(commands.length, 1);
      const one = commands[0] as typeof DECLARED;
      assert.equal(one.provenance.file, "verification-commands.md");
      assert.equal(one.provenance.line, 12);
      assert.ok(Array.isArray(one.argv), "a command is a fixed argument list");
      const obligations = await (
        operationOf(impl, "obligations") as (m: unknown) => Promise<readonly unknown[]>
      )(sampleModel);
      // One verification obligation per task line.
      assert.equal(obligations.length, sampleModel.phases[0]?.tasks.length);
      assert.equal(PLAN_IS_FROZEN_AT_LAUNCH, true);
      assert.equal(A_SOURCE_WRITES, false);
    },
  },
  {
    id: "CT-100-202",
    title:
      "the verification modes are the closed set `required`, `plan`, `off` with the default `required` (F100-FR-102)",
    level: "contract",
    proves: ["F100-FR-102"],
    run() {
      assert.deepEqual([...VERIFICATION_MODES], ["required", "plan", "off"]);
      assert.equal(VERIFICATION_MODE_DEFAULT, "required");
      assert.equal(UNKNOWN_MODE_EXIT_CODE, 3);
    },
  },
  {
    id: "CT-100-203",
    title:
      "a manifest derived on a relaunch is compared with the stored one, and the stored one applies (F100-FR-103)",
    level: "contract",
    proves: ["F100-FR-103"],
    async run(impl) {
      assert.equal(STORED_MANIFEST_APPLIES_ON_A_DIFFERENCE, true);
      const disagreeing = { ...DECLARED, argv: Object.freeze(["/sample/bin/check", "--some"]) };
      const blockers = (
        operationOf(impl, "conflicts") as (r: readonly (readonly unknown[])[]) => readonly unknown[]
      )([[DECLARED], [disagreeing]]);
      assert.equal(blockers.length, 1);
      assert.equal((blockers[0] as { reason: string }).reason, "declarations-disagree");
      assert.equal(PROVENANCES_THAT_COUNT_AS_DECLARED.length, 3);
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-07/operations-exist",
      "EP-07/closed-result-sets",
      "EP-07/degradation",
      "EP-07/unknown-value-rule",
      "EP-07/behaviour-cases",
    ],
    {
      resultSets: [
        {
          operation: "conflicts",
          members: [
            (v: unknown) =>
              Array.isArray(v) &&
              v.every((b) =>
                ["not-a-fixed-argument-list", "declarations-disagree"].includes(
                  (b as { reason: string }).reason,
                ),
              ),
          ],
          calls: [[[[DECLARED]]], [[[DECLARED], [{ ...DECLARED, argv: ["x"] }]]]],
        },
      ],
      throwingOperation: "discover",
    },
  ),
  ...named,
]);

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
