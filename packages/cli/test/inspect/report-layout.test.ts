import test from "node:test";
import assert from "node:assert/strict";
import { VERBS } from "../../src/router/verbs.ts";
import { INSPECT_VERBS } from "../../src/inspect/index.ts";

// T157 [US2] — the verb is read-only: place this test in layout.test.ts or beside it.
test("the verb is read-only", () => {
  const row = VERBS.find((entry) => entry.verb === "report");
  assert.notEqual(row, undefined, "the verb row of report exists");
  assert.equal(row?.readOnly, true);
  assert.equal(row?.inspect, true);
  assert.equal(row?.owner, "153");
  assert.deepEqual(row?.exitCodes, [0, 1]);
  assert.ok((INSPECT_VERBS as readonly string[]).includes("report"), "report is an inspect verb");
});
