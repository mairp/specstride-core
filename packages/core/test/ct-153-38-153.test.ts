/**
 * Feature 153, CT-153-38 — the guard of the end-cause table (T097): every
 * choice of the table of T093 is a member of `ATTEMPT_END_CAUSES`
 * (packages/observability/src/catalogue/end-causes.ts:89), and that set
 * still holds exactly the ten literals of row 272 of
 * `packages/contracts/data/closed-sets.json` (F153-FR-038: the row is
 * closed; a new member only under CQ-153-09 B).
 */
import assert from "node:assert/strict";
import test from "node:test";

import { ATTEMPT_END_CAUSES } from "../../observability/src/catalogue/end-causes.ts";
import { ATTEMPT_END_CAUSE_TABLE } from "../src/gate/end-cause.ts";

test("no member was added", () => {
  // Row 272 still holds exactly the ten literals of the closed set.
  assert.deepEqual(
    [...ATTEMPT_END_CAUSES],
    [
      "approved",
      "rejected",
      "malformed",
      "verification-failed",
      "no-evidence",
      "budget",
      "blocked",
      "stopped",
      "error",
      "crash",
    ],
  );
  // Every choice of the table is a member of that set — the choice set of
  // the point and every choice a row carries.
  const point = ATTEMPT_END_CAUSE_TABLE.points["attempt-end-cause"];
  for (const choice of point.choices) {
    assert.ok(
      ATTEMPT_END_CAUSES.includes(choice),
      `the choice ${choice} of the table is a member of row 272`,
    );
  }
  for (const row of ATTEMPT_END_CAUSE_TABLE.rows["attempt-end-cause"]) {
    assert.ok(
      ATTEMPT_END_CAUSES.includes(row.choice),
      `the choice of ${row.ruleId} is a member of row 272`,
    );
  }
  // The closed set is not grown by the table either: no member of the set is
  // missing from the choice set of the point.
  for (const member of ATTEMPT_END_CAUSES) {
    assert.ok(point.choices.includes(member), `the member ${member} is a choice of the table`);
  }
});
