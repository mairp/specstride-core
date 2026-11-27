/**
 * T102 — `host_slot` as the class of the pause a run enters while it waits for
 * a host slot or a hold (F154-FR-045; CQ-154-09, CQ-154-14 A).
 *
 * The class is a PROPOSAL of spec 154: it is a member of §C.13 in force only
 * while `host.limits` reads on, and `A_QUOTA_CLASS_SPENDS` says it spends
 * nothing — a wait for a slot is a pause, and a pause spends no budget of any
 * kind (principle XVI). With every switch off — the default, and the whole
 * state under the `parity` profile — the closed sets are exactly the annex's
 * (F154-FR-001).
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  A_HOST_SLOT_SPENDS,
  A_QUOTA_CLASS_SPENDS,
  CLASSES,
  PROPOSED_QUOTA_CLASS_154,
  PROPOSED_QUOTA_CLASSES_154,
  quotaClassesOf,
} from "@specstride/contracts/ep/quota-classifier";
import {
  ACTION_ROW_HOST_SLOT_154,
  actionRowHostSlotOf,
  CLASSES_OF_Q1,
} from "../../src/quota/actions.ts";
import { readQuotaClass } from "../../src/quota/classify.ts";

test("T102: the annex holds nine classes and `host_slot` is not one of them", () => {
  assert.equal(CLASSES.length, 9);
  assert.ok(!(CLASSES as readonly string[]).includes("host_slot"));
  assert.equal(CLASSES_OF_Q1.length, 9);
});

test("T102: `host_slot` joins the classes in force only while `host.limits` is on", () => {
  // Off — the default, and `parity`: exactly the annex.
  assert.deepEqual(
    quotaClassesOf(() => false),
    [...CLASSES],
  );
  assert.deepEqual(
    quotaClassesOf((name) => name === "other.switch"),
    [...CLASSES],
  );
  // On: the ten classes, `host_slot` at the end.
  const on = quotaClassesOf((name) => name === "host.limits");
  assert.equal(on.length, 10);
  assert.equal(on[9], "host_slot");
  // The proposal names exactly one member and one switch.
  assert.equal(PROPOSED_QUOTA_CLASSES_154.length, 1);
  assert.equal(PROPOSED_QUOTA_CLASS_154, "host_slot");
  assert.equal(PROPOSED_QUOTA_CLASSES_154[0].switch, "host.limits");
});

test("T102: with the switch off the unknown-value rule reads `host_slot` as `provider_other`", () => {
  // `readQuotaClass` reads the closed set of the annex, never the proposal:
  // no caller can act on the class while the switch is off (F154-FR-001).
  assert.equal(readQuotaClass("host_slot"), "provider_other");
});

test("T102: `A_QUOTA_CLASS_SPENDS` says `host_slot` spends nothing", () => {
  for (const [what, spends] of Object.entries(A_QUOTA_CLASS_SPENDS)) {
    assert.equal(spends, false, `a quota class must not spend ${what}`);
  }
  assert.equal(A_HOST_SLOT_SPENDS, A_QUOTA_CLASS_SPENDS);
  for (const [what, spends] of Object.entries(A_HOST_SLOT_SPENDS)) {
    assert.equal(spends, false, `host_slot must not spend ${what}`);
  }
});

test("T102: the `host_slot` row of §Q.1 pauses and spends nothing, only while the switch is on", () => {
  const row = actionRowHostSlotOf((name) => name === "host.limits");
  assert.ok(row, "with `host.limits` on the row exists");
  assert.equal(row.quotaClass, "host_slot");
  assert.equal(row.action, "pause-role");
  assert.equal(row.countsAs, "neither");
  assert.equal(row.spends, "no");
  assert.equal(row.retryable, true);
  assert.equal(row.blockedReason, null);
  // Off: no row, so no caller can act on the class (F154-FR-001).
  assert.equal(
    actionRowHostSlotOf(() => false),
    null,
  );
  assert.equal(ACTION_ROW_HOST_SLOT_154.spends, "no");
});
