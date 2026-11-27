/**
 * THE ADMISSION TO ONE HOST SLOT (T026; F154-FR-039, -044), decided over the
 * PURE TABLE `host.slot-admission` (`SLOT_ADMISSION_TABLE` of `tables.ts`,
 * the byte-pinned copy of the spec's rule table; F154-FR-003: the decision
 * is a table with a rule id, living in core — the composition root only
 * wires it).
 *
 * The observation carries the outcome of the lock probe — one row P1 to P6
 * of `packages/runtime/src/lock/probe.ts:120-128` (the default predicate P7
 * is never a slot verdict) — and whether the slot store itself was readable.
 * The probe rows read onto the table's signals:
 *
 *   P1 the lock is free            -> `freeSlot`
 *   P2 the owner record is unreadable -> `foreignOrUnknown` (unknown counts as held)
 *   P3 the holder is on another host  -> `foreignOrUnknown` (held-foreign counts as held)
 *   P4 the holder is live on this boot -> `ownerLive`
 *   P5/P6 the owner is dead           -> `ownerDead`
 *
 * Pure: no I/O, no clock, no randomness, no model. The same observation
 * gives the same decision, with its rule id (F154-SC-002, -006).
 */

import { evaluateTable, type LoadedTable } from "@specstride/kernel";
import { SLOT_ADMISSION_TABLE } from "./tables.ts";

/** The decision point of the slot-admission table. */
export const SLOT_ADMISSION_POINT = "host.slot-admission";

/** One probe row of the lock probe that is a slot verdict (P1 to P6). */
export type SlotProbeRow = "P1" | "P2" | "P3" | "P4" | "P5" | "P6";

/** What the composition root observed about one slot of the host. */
export type SlotAdmissionObservation = {
  /** Whether the slot store answered a read at all (SL-5). */
  readonly storeReadable: boolean;
  /** The probe row the lock probe fired for the bound (P1 to P6). */
  readonly probeRow: SlotProbeRow;
};

/** The admission to the slot, with the rule id that decided it. */
export type SlotAdmission = {
  readonly choice: "take" | "reclaim" | "wait" | "unbounded";
  readonly ruleId: string;
};

/** The signals of the table, from one probe row. */
function signalsOfTheProbe(observation: SlotAdmissionObservation): Record<string, unknown> {
  return {
    storeReadable: observation.storeReadable === true,
    // P1 — the lock is free.
    freeSlot: observation.probeRow === "P1",
    // P5 and P6 — the owner is dead (the two readings of "dead" the probe
    // holds: the identity check passed, or it did not).
    ownerDead: observation.probeRow === "P5" || observation.probeRow === "P6",
    // P4 — the holder lives on this boot.
    ownerLive: observation.probeRow === "P4",
    // P2 (unknown owner) and P3 (held-foreign) count as HELD (F154-FR-044):
    // a slot whose holder cannot be proven dead is never taken.
    foreignOrUnknown: observation.probeRow === "P2" || observation.probeRow === "P3",
  };
}

/**
 * The admission decision for one slot observation. Rows fire in the table's
 * order, so the unreadable store (SL-5) decides before anything else and a
 * broken store NEVER stops a run: the run proceeds unbounded with the rule
 * recorded (F154-FR-004, -044).
 */
export function slotAdmissionOf(observation: SlotAdmissionObservation): SlotAdmission {
  const decision = evaluateTable(
    SLOT_ADMISSION_TABLE as unknown as LoadedTable,
    SLOT_ADMISSION_POINT,
    signalsOfTheProbe(observation),
  );
  return Object.freeze({
    choice: decision.choice as SlotAdmission["choice"],
    ruleId: decision.ruleId,
  });
}
