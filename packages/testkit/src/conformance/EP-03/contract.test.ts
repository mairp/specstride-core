/**
 * T100 — the conformance suite at contract level for EP-03, the spec-format
 * adapter (annex C, §C.7): CT-100-195, CT-100-196.
 *
 * Before the named cases the suite checks the five things every suite at
 * contract level checks (annex A, §A.4). The behaviour of EP-03 belongs to
 * feature 104; its behaviour cases go in this folder beside this file.
 */
import assert from "node:assert/strict";
import {
  BUILT_IN_FORMATS_WIN,
  DETECTION_ORDER,
  FORMAT_ALIASES,
  FORMAT_NAMES,
  OPERATIONS,
  POINT_ID,
  resolveFormatName,
} from "@specstride/contracts/ep/spec-format";
import {
  isCanonicalSpecModel,
  PHASE_VIEW_FIELDS,
  phaseViews,
} from "@specstride/contracts/records/canonical-spec-model";
import { implementation, sampleModel } from "../../samples/EP-03/index.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-03" as const;

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-195",
    title:
      "the port offers `detect`, `parse`, `validate`, `tick` and `inputs` and produces the canonical spec model with structured tasks (F100-FR-095)",
    level: "contract",
    proves: ["F100-FR-095"],
    run(impl) {
      assert.deepEqual([...OPERATIONS], ["detect", "parse", "validate", "tick", "inputs"]);
      const model = (operationOf(impl, "parse") as (f: readonly string[]) => unknown)([
        "spec.md",
        "tasks.md",
      ]);
      assert.equal(isCanonicalSpecModel(model), true);
      assert.deepEqual(model, sampleModel);
      const views = phaseViews(sampleModel);
      assert.equal(views.length, 1);
      assert.deepEqual(Object.keys(views[0] as object).sort(), [...PHASE_VIEW_FIELDS].sort());
      // Structured tasks, not text.
      assert.equal(sampleModel.phases[0]?.tasks[0]?.id, "T001");
      assert.equal(sampleModel.phases[0]?.tasks[0]?.ticked, false);
      // `parse` is a pure function of the files it is handed.
      assert.deepEqual(
        (operationOf(impl, "parse") as (f: readonly string[]) => unknown)(["spec.md", "tasks.md"]),
        model,
      );
    },
  },
  {
    id: "CT-100-196",
    title:
      "the format names and the detection order are the baseline's, and `openspec` is accepted as `openspec-change` (F100-FR-096)",
    level: "contract",
    proves: ["F100-FR-096"],
    run() {
      assert.deepEqual([...FORMAT_NAMES], ["native", "speckit-tasks", "openspec-change"]);
      assert.deepEqual([...DETECTION_ORDER], ["explicit override", "file name", "content"]);
      assert.equal(FORMAT_ALIASES["openspec"], "openspec-change");
      assert.equal(resolveFormatName("openspec"), "openspec-change");
      assert.equal(resolveFormatName("native"), "native");
      assert.equal(resolveFormatName("no-such-format"), undefined);
      assert.equal(BUILT_IN_FORMATS_WIN, true);
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-03/operations-exist",
      "EP-03/closed-result-sets",
      "EP-03/degradation",
      "EP-03/unknown-value-rule",
      "EP-03/behaviour-cases",
    ],
    {
      resultSets: [
        {
          operation: "validate",
          members: [
            (v: unknown) =>
              Array.isArray(v) &&
              v.every((f) => ["warn", "fail"].includes((f as { severity: string }).severity)),
          ],
          calls: [[sampleModel], [{ ...sampleModel, format: "no-such-format" }]],
        },
        {
          operation: "detect",
          members: [(v: unknown) => typeof (v as { claims: boolean }).claims === "boolean"],
          calls: [[{ path: "a.sample.md", head: "" }], [{ path: "a.md", head: "" }]],
        },
      ],
      throwingOperation: "parse",
    },
  ),
  ...named,
]);

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
