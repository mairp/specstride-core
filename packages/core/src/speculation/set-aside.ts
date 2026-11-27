/**
 * T147 — THE SET-ASIDE RECORD `specstride.set-aside/1` (feature 154, US7;
 * F154-FR-064, -065; F154-FR-007: every new record has a schema).
 *
 * One record per set-aside unit (SP-6): a speculative unit whose phase was
 * REJECTED is discarded — its tree is removed, no outer counter and no count
 * moves (F154-FR-064) — and this record holds what the unit COST: its tokens,
 * its wall time and its cycles. Nothing else. In particular the record names
 * NO attempt kind and NO stop reason (F154-FR-002: no behaviour of this
 * feature adds an exit code, a stop reason or a run state), and the grain is
 * the phase (F154-FR-065).
 *
 * Pure: data only, no I/O, no clock (the caller carries the set-aside time).
 * The composition root writes the record; this module decides its shape.
 */

/** The schema id of the set-aside record (F154-FR-007). */
export const SET_ASIDE_SCHEMA = "specstride.set-aside/1" as const;

/** What one set-aside unit cost (F154-FR-064): tokens, wall time, cycles. */
export type SetAsideCost = {
  /** The tokens the unit's passes spent, as the usage records hold them. */
  readonly tokens: number;
  /** The wall time of the unit, from its start to its discard, in ms. */
  readonly wallTimeMs: number;
  /** The micro-loop cycles the unit's admitted tasks charged (F142-FR-021). */
  readonly cycles: number;
};

/** The set-aside record, as it is written (one per rejection, F154-FR-064). */
export type SetAsideRecord = {
  readonly schema: typeof SET_ASIDE_SCHEMA;
  readonly feature: string;
  readonly runId: string;
  /** The phase whose verdict set the unit aside (the grain, F154-FR-065). */
  readonly phase: number;
  /** The speculative unit's own phase — the phase that was worked ahead. */
  readonly unitPhase: number;
  /** The rule id that decided the set-aside (SP-6; F154-FR-003). */
  readonly ruleId: string;
  readonly cost: SetAsideCost;
  /** Epoch milliseconds of the discard, carried in by the caller. */
  readonly setAsideAt: number;
};

/** A cost whose every member is a finite number of at least 0. */
function costOf(value: unknown): SetAsideCost {
  const source = (value ?? {}) as Record<string, unknown>;
  const member = (name: string): number => {
    const raw = Number(source[name]);
    return Number.isFinite(raw) && raw >= 0 ? raw : 0;
  };
  return Object.freeze({
    tokens: member("tokens"),
    wallTimeMs: member("wallTimeMs"),
    cycles: member("cycles"),
  });
}

/**
 * The set-aside record of ONE discarded unit (SP-6). The cost is clamped to
 * finite non-negative numbers — a cost a caller could not read is recorded
 * as 0 of that member, never invented (Principle XI).
 */
export function setAsideRecordOf(input: {
  readonly feature: string;
  readonly runId: string;
  readonly phase: number;
  readonly unitPhase: number;
  readonly ruleId: string;
  readonly cost: unknown;
  readonly setAsideAt: number;
}): SetAsideRecord {
  return Object.freeze({
    schema: SET_ASIDE_SCHEMA,
    feature: input.feature,
    runId: input.runId,
    phase: input.phase,
    unitPhase: input.unitPhase,
    ruleId: input.ruleId,
    cost: costOf(input.cost),
    setAsideAt: input.setAsideAt,
  });
}

/**
 * F154-FR-002 — the record carries NO attempt kind and NO stop reason. True
 * where the record's own keys hold neither (the keys `attemptKind`,
 * `stopReason`, `endCause`, `exitCode`, `runState` and `attempt` never
 * appear), and where every cost member is a finite number of at least 0.
 */
export function recordCarriesNoKindOrStopReason(record: SetAsideRecord): boolean {
  const forbidden = ["attemptKind", "stopReason", "endCause", "exitCode", "runState", "attempt"];
  const keys = Object.keys(record as unknown as Record<string, unknown>);
  if (keys.some((key) => forbidden.includes(key))) return false;
  return (
    Number.isFinite(record.cost.tokens) &&
    Number.isFinite(record.cost.wallTimeMs) &&
    Number.isFinite(record.cost.cycles) &&
    record.cost.tokens >= 0 &&
    record.cost.wallTimeMs >= 0 &&
    record.cost.cycles >= 0
  );
}
