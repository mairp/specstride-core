/**
 * THE VALIDATION QUEUE OF THE PHASES (T134; F154-FR-056, -058, -059), decided
 * over the PURE TABLE `loop.phase-queue` (`VALIDATION_QUEUE_TABLE` of
 * `tables.ts`, the byte-pinned copy of the spec's rule table; F154-FR-003:
 * the decision is a table with a rule id, living in core — the composition
 * root only wires it).
 *
 * The effective dependencies of a phase (PQ-3): the DECLARED list when the
 * source declared a non-empty one; otherwise the implicit dependency on the
 * phase before it (phase N depends on phase N-1) for every phase after the
 * first; the first phase is READY BY DEFAULT (no dependency at all). A phase
 * whose section carries no specstride line declares the EMPTY list, which is
 * no declaration: the implicit rule applies to it exactly as to a missing
 * field.
 *
 * THE PENDING CASE. The pinned table's rows are PQ-3 (nothing declared ->
 * head), PQ-2 (a dependency rejected -> wait) and PQ-1 (every dependency
 * approved -> head). A phase whose dependencies are declared, none rejected
 * and NOT all approved — dependencies still in validation — matches NO row,
 * and the table's fallback row (the LAST row, PQ-1) would answer `head`
 * wrongly. The queue never consults the fallback: it answers `wait` with the
 * rule id `PQ-pending` — the safe side, the phase stays out of the head
 * until every dependency has an outcome — and says so, so no decision of
 * this module ever rests on a row the table did not name.
 *
 * Pure: no I/O, no clock, no randomness, no model. The same observation gives
 * the same decision, with its rule id (F154-SC-002, -006).
 */

import { evaluateTable, type LoadedTable } from "@specstride/kernel";
import { VALIDATION_QUEUE_TABLE } from "./tables.ts";

/** The decision point of the validation-queue table. */
export const PHASE_QUEUE_POINT = "loop.phase-queue";

/** The rule id of the pending case no pinned row names (see the module note). */
export const PQ_PENDING_RULE_ID = "PQ-pending";

/** One entry of the queue, as the engine holds it: a phase and its declared dependencies. */
export type QueueEntryLike = {
  /** The phase number, ascending in validation order. */
  readonly phase: number;
  /** The DECLARED dependencies (the EMPTY list when the source declared none). */
  readonly dependsOn?: readonly number[];
  /** Whether the phase carries a declared write scope (informational; not a queue signal). */
  readonly writeScope?: readonly string[];
};

/** What the engine has observed of the phases around the entry. */
export type QueueObservation = {
  /** The phases whose validation APPROVED (the gate passed, the phase landed). */
  readonly approved: ReadonlySet<number>;
  /** The phases whose validation REJECTED (the gate failed, repair is due). */
  readonly rejected: ReadonlySet<number>;
};

/** The verdict of the queue for one phase, with the rule id that decided it. */
export type QueueVerdict = {
  readonly choice: "head" | "wait";
  readonly ruleId: string;
};

/** The declared dependencies of an entry, as a plain ordered list. */
function declaredOf(entry: QueueEntryLike): readonly number[] {
  return entry.dependsOn ?? [];
}

/**
 * The EFFECTIVE dependencies of a phase (PQ-3): the declared list when it is
 * non-empty; otherwise the implicit dependency on the phase before it for
 * every phase after the first; the EMPTY list for the first phase, ready by
 * default.
 */
export function effectiveDependenciesOf(entry: QueueEntryLike): readonly number[] {
  const declared = declaredOf(entry);
  if (declared.length > 0) return declared;
  if (entry.phase > 1) return [entry.phase - 1];
  return [];
}

/** True when the source declared a NON-EMPTY dependency list for the phase. */
export function dependenciesDeclaredOf(entry: QueueEntryLike): boolean {
  return declaredOf(entry).length > 0;
}

/** The signals of the table, from one entry and one observation. */
function signalsOf(entry: QueueEntryLike, observation: QueueObservation): Record<string, unknown> {
  const effective = effectiveDependenciesOf(entry);
  return {
    dependenciesDeclared: dependenciesDeclaredOf(entry),
    everyDependencyApproved: effective.every((dependency) => observation.approved.has(dependency)),
    aDependencyRejected: effective.some((dependency) => observation.rejected.has(dependency)),
  };
}

/**
 * The queue verdict for ONE phase. Rows fire in the table's order; the
 * pending case (declared, none rejected, not all approved) is answered
 * BEFORE the table, with `PQ-pending` -> `wait`, so the fallback row (PQ-1)
 * is never the decision a pending phase runs on.
 */
export function admissionOf(entry: QueueEntryLike, observation: QueueObservation): QueueVerdict {
  const signals = signalsOf(entry, observation);
  const pending =
    signals.dependenciesDeclared === true &&
    signals.aDependencyRejected !== true &&
    signals.everyDependencyApproved !== true;
  if (pending) {
    return Object.freeze({ choice: "wait", ruleId: PQ_PENDING_RULE_ID });
  }
  const decision = evaluateTable(
    VALIDATION_QUEUE_TABLE as unknown as LoadedTable,
    PHASE_QUEUE_POINT,
    signals,
  );
  return Object.freeze({
    choice: decision.choice as QueueVerdict["choice"],
    ruleId: decision.ruleId,
  });
}

/**
 * THE HEAD OF THE QUEUE: the FIRST phase, in phase (validation) order, whose
 * verdict is `head`. A phase whose validation has ALREADY APPROVED is no
 * candidate any more: it left the queue when it landed. The order of
 * `entries` IS the validation order; the queue never re-sorts it. No entry
 * is ready — every phase waits — gives NO head (`undefined`), never a wrong
 * one.
 */
export function headOf(
  entries: readonly QueueEntryLike[],
  observation: QueueObservation,
): number | undefined {
  for (const entry of entries) {
    if (observation.approved.has(entry.phase)) continue;
    if (admissionOf(entry, observation).choice === "head") return entry.phase;
  }
  return undefined;
}

/**
 * The admission of one phase against the queue: `admit` answers the same
 * verdict `headOf` would, for the phase asked about — the composition root
 * calls it before it opens a phase's validation, and the rule id travels
 * into the run's record.
 */
export function admit(entry: QueueEntryLike, observation: QueueObservation): QueueVerdict {
  return admissionOf(entry, observation);
}
