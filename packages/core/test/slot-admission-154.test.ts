/**
 * T027 — the admission to one host slot over the pure table (F154-FR-039,
 * -044): every rule SL-1 to SL-5 fires from its probe outcome, a slot held
 * by a foreign host (P3) and one whose owner record is unreadable (P2)
 * count as HELD — the run waits, it never takes — and an unreadable slot
 * store decides SL-5: the run proceeds unbounded, never an error
 * (F154-FR-004).
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  slotAdmissionOf,
  SLOT_ADMISSION_POINT,
  type SlotAdmissionObservation,
} from "../src/host-limits/slot-admission.ts";
import { SLOT_ADMISSION_TABLE } from "../src/host-limits/tables.ts";

const observed = (
  storeReadable: boolean,
  probeRow: SlotAdmissionObservation["probeRow"],
): SlotAdmissionObservation => ({ storeReadable, probeRow });

test("SL-1 — a free slot (P1) is taken", () => {
  const decision = slotAdmissionOf(observed(true, "P1"));
  assert.equal(decision.choice, "take");
  assert.equal(decision.ruleId, "SL-1");
});

test("SL-2 — a slot held by a live owner (P4) is waited on", () => {
  const decision = slotAdmissionOf(observed(true, "P4"));
  assert.equal(decision.choice, "wait");
  assert.equal(decision.ruleId, "SL-2");
});

test("SL-3 — a slot whose owner is dead is reclaimed, from P5 and from P6", () => {
  for (const probeRow of ["P5", "P6"] as const) {
    const decision = slotAdmissionOf(observed(true, probeRow));
    assert.equal(decision.choice, "reclaim", `probe row ${probeRow}`);
    assert.equal(decision.ruleId, "SL-3", `probe row ${probeRow}`);
  }
});

test("held-foreign (P3) and unknown (P2) count as held — the run waits", () => {
  for (const probeRow of ["P3", "P2"] as const) {
    const decision = slotAdmissionOf(observed(true, probeRow));
    assert.equal(decision.choice, "wait", `probe row ${probeRow}`);
    assert.equal(decision.ruleId, "SL-4", `probe row ${probeRow}`);
  }
});

test("SL-5 — an unreadable slot store is unbounded, whatever the probe said", () => {
  for (const probeRow of ["P1", "P2", "P3", "P4", "P5", "P6"] as const) {
    const decision = slotAdmissionOf(observed(false, probeRow));
    assert.equal(decision.choice, "unbounded", `probe row ${probeRow}`);
    assert.equal(decision.ruleId, "SL-5", `probe row ${probeRow}`);
  }
});

test("the decision is the table's own: point id, rule ids, and the pure reading", () => {
  assert.equal(SLOT_ADMISSION_POINT, "host.slot-admission");
  const ruleIds = SLOT_ADMISSION_TABLE.rows[SLOT_ADMISSION_POINT].map((row) => row.ruleId);
  assert.deepEqual(ruleIds, ["SL-5", "SL-1", "SL-3", "SL-2", "SL-4"]);
  // Pure: the same observation gives the same decision.
  const one = slotAdmissionOf(observed(true, "P1"));
  const two = slotAdmissionOf(observed(true, "P1"));
  assert.deepEqual(one, two);
});
