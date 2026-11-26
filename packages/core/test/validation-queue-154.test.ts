/**
 * T133 — the head of the validation queue over the pure table (feature 154,
 * US6; F154-FR-056, -058, -059): PQ-3, PQ-2, PQ-1 fire from the declared and
 * observed state; the head is the FIRST ready phase in phase order; a phase
 * with a REJECTED dependency waits and never leads; the pending case no
 * pinned row names is answered `PQ-pending` -> wait, never the fallback row.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  PQ_PENDING_RULE_ID,
  PHASE_QUEUE_POINT,
  admissionOf,
  admit,
  effectiveDependenciesOf,
  headOf,
  type QueueEntryLike,
  type QueueObservation,
} from "../src/phase-queue/validation-queue.ts";
import { VALIDATION_QUEUE_TABLE } from "../src/phase-queue/tables.ts";

const observationOf = (
  approved: readonly number[] = [],
  rejected: readonly number[] = [],
): QueueObservation => ({
  approved: new Set(approved),
  rejected: new Set(rejected),
});

/* ------------------------------------------------------------------ *
 * The effective dependencies (PQ-3).
 * ------------------------------------------------------------------ */

test("PQ-3 — a declared non-empty list is the effective list", () => {
  const entry: QueueEntryLike = { phase: 4, dependsOn: [2, 5] };
  assert.deepEqual(effectiveDependenciesOf(entry), [2, 5]);
});

test("PQ-3 — a phase after the first with no declared list depends on the phase before it", () => {
  assert.deepEqual(effectiveDependenciesOf({ phase: 3 }), [2]);
  // The EMPTY declared list is no declaration: the implicit rule applies.
  assert.deepEqual(effectiveDependenciesOf({ phase: 3, dependsOn: [] }), [2]);
});

test("PQ-3 — the first phase is ready by default (no dependency at all)", () => {
  assert.deepEqual(effectiveDependenciesOf({ phase: 1 }), []);
  assert.deepEqual(effectiveDependenciesOf({ phase: 1, dependsOn: [] }), []);
});

/* ------------------------------------------------------------------ *
 * The rows, one verdict each.
 * ------------------------------------------------------------------ */

test("PQ-3 — a phase that declared nothing leads (first phase, ready by default)", () => {
  const verdict = admit({ phase: 1 }, observationOf());
  assert.equal(verdict.choice, "head");
  assert.equal(verdict.ruleId, "PQ-3");
});

test("PQ-2 — a phase with a rejected dependency waits", () => {
  const entry: QueueEntryLike = { phase: 2, dependsOn: [1] };
  const verdict = admit(entry, observationOf([], [1]));
  assert.equal(verdict.choice, "wait");
  assert.equal(verdict.ruleId, "PQ-2");
});

test("PQ-1 — a phase with every dependency approved leads", () => {
  const entry: QueueEntryLike = { phase: 2, dependsOn: [1] };
  const verdict = admit(entry, observationOf([1]));
  assert.equal(verdict.choice, "head");
  assert.equal(verdict.ruleId, "PQ-1");
});

test("the pending case — declared, none rejected, not all approved — waits, rule PQ-pending", () => {
  const entry: QueueEntryLike = { phase: 3, dependsOn: [1, 2] };
  const verdict = admit(entry, observationOf([1]));
  assert.equal(verdict.choice, "wait");
  assert.equal(verdict.ruleId, PQ_PENDING_RULE_ID);
  // And the fallback row of the pinned table would have said PQ-1: the
  // module never lets a pending phase rest on it.
  assert.notEqual(verdict.ruleId, "PQ-1");
});

/* ------------------------------------------------------------------ *
 * The head, in phase order.
 * ------------------------------------------------------------------ */

const QUEUE: readonly QueueEntryLike[] = [
  { phase: 1, dependsOn: [] },
  { phase: 2, dependsOn: [1] },
  { phase: 3, dependsOn: [1] },
];

test("the head is the first ready phase in phase order", () => {
  assert.equal(headOf(QUEUE, observationOf()), 1);
  assert.equal(headOf(QUEUE, observationOf([1])), 2);
  assert.equal(headOf(QUEUE, observationOf([1, 2])), 3);
});

test("a rejected phase stays the head for repair; a held dependent never jumps it", () => {
  // Phase 1 approved, phase 2 rejected: phase 2's dependency (1) is approved,
  // so the head stays 2 — the repair attempt, T138. A dependent held on 2
  // (here, a phase 4 declared on [2]) never jumps the repair.
  const withDependent: readonly QueueEntryLike[] = [...QUEUE, { phase: 4, dependsOn: [2] }];
  assert.equal(headOf(QUEUE, observationOf([1], [2])), 2);
  assert.equal(headOf(withDependent, observationOf([1], [2])), 2);
});

test("every phase waiting gives no head at all", () => {
  const waiting: readonly QueueEntryLike[] = [
    { phase: 1, dependsOn: [9] },
    { phase: 2, dependsOn: [1] },
  ];
  // Phase 1 waits on the pending 9; phase 2 waits on 1. Nothing is ready.
  assert.equal(headOf(waiting, observationOf()), undefined);
});

test("the table and its decision point travel with the module", () => {
  assert.equal(VALIDATION_QUEUE_TABLE.id, "loop.phase-queue");
  assert.equal(PHASE_QUEUE_POINT, "loop.phase-queue");
  const verdict = admissionOf({ phase: 1 }, observationOf());
  assert.equal(verdict.ruleId, "PQ-3");
});
