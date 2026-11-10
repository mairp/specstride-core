/**
 * CT-152-21 — the switch of the commit backpressure (F152-FR-021, row 134 of
 * annex X §X.7).
 *
 * The key `commit.backpressure` defaults ON: the gate is the fail-closed side.
 * Under the `parity` profile the row of the switch holds it OFF, as row 134 of
 * `packages/contracts/data/parity-profile.json` gives it, so the oracle run
 * sees the as-is behaviour with no block.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyProfile } from "@specstride/contracts/profile/parity";
import { commitBackpressureIsOn } from "../src/post-approval/commit-gate.ts";

test("the switch is off under parity", () => {
  // The default profile: the key is not held, and the default is on.
  assert.equal(commitBackpressureIsOn({}), true);
  assert.equal(commitBackpressureIsOn({ "commit.backpressure": true }), true);

  // Under `parity`, the row sets the key to its value under parity: off.
  const parity = applyProfile({}).config;
  assert.match(String(parity["commit.backpressure"]), /^off[:)]/);
  assert.equal(commitBackpressureIsOn(parity), false);
});
