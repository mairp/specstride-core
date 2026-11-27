/**
 * T019 — the guard over the proposed refusal reason `group-check`
 * (F154-FR-059, CQ-154-09; `src/parallel/audits.ts`): the closed set of row
 * 63 is unchanged — `DELTA_REFUSAL_REASONS` stays the eight reasons, the
 * guard refuses `group-check`, the drift against the annex is empty — and
 * only a reader of `loop.parallel.groupCheck` turned on admits it. With the
 * switch off (the default, and the whole state under `parity`) the list in
 * force is exactly row 63.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  DELTA_REFUSAL_REASONS,
  isADeltaRefusalReason,
  deltaRefusalReasonsOf,
  isADeltaRefusalReasonOf,
  refusalReasonDrift,
} from "../src/parallel/audits.ts";

test("T019 row 63 is unchanged: group-check is outside the closed set", () => {
  assert.deepEqual(
    [...DELTA_REFUSAL_REASONS],
    [
      "scope",
      "protected",
      "overlap",
      "path-leak",
      "checkpoint",
      "yield",
      "tree-changed-after-end",
      "workspace-changed",
    ],
  );
  assert.equal(isADeltaRefusalReason("group-check"), false);
  assert.deepEqual(refusalReasonDrift(), [], "no drift against the annex");
});

test("T019 with the switch off the reasons in force are exactly row 63", () => {
  assert.deepEqual(
    deltaRefusalReasonsOf(() => false),
    [...DELTA_REFUSAL_REASONS],
  );
  assert.equal(
    isADeltaRefusalReasonOf("group-check", () => false),
    false,
  );
});

test("T019 with the switch on group-check joins, and only behind its switch", () => {
  assert.deepEqual(deltaRefusalReasonsOf((name) => name === "loop.parallel.groupCheck").slice(-1), [
    "group-check",
  ]);
  assert.equal(
    isADeltaRefusalReasonOf("group-check", (name) => name === "loop.parallel.groupCheck"),
    true,
  );
  // Another switch on does not add it.
  assert.equal(
    isADeltaRefusalReasonOf("group-check", (name) => name === "loop.speculate"),
    false,
  );
});
