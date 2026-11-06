/**
 * T278 — the degradation of a failing implementation (annex A, §A.4;
 * F100-FR-019, F100-FR-021).
 *
 * A wrapper that catches a throw, a time limit and a result outside the
 * closed result set of the point. It takes the plainer path that the point's
 * contract file documents under "Failure of an implementation", records the
 * degradation as an event of the envelope of annex X §X.1, and never returns
 * a verdict, an exit code or a stop reason. The default unknown-value rule of
 * F100-FR-021 is the fallback of every point: where the sub-heading
 * "Unknown-value rule" of a point states nothing more specific, the three
 * cases of F100-FR-021 apply.
 *
 * `contracts/extension-points/EP-08.event-sink.json` is the sample the task
 * names: its "Failure of an implementation" is "a slow, failing or dead sink
 * is skipped for the event, its failure is recorded, and the outcome of the
 * run and the primary event file are unchanged", and its "Unknown-value rule"
 * states something more specific than the default.
 */
import {
  DEFAULT_UNKNOWN_VALUE_RULE,
  FIELDS_A_DEGRADATION_NEVER_CARRIES,
  UNKNOWN_VALUE_CASES,
  type UnknownValueCase,
} from "@specstride/contracts/ep/extension-point";
import {
  MAJOR as EVENT_MAJOR,
  SCHEMA as EVENT_SCHEMA,
  isEventEnvelope,
} from "@specstride/contracts/envelope/event";
import type { EventEnvelope } from "@specstride/contracts/envelope/event";
import { ROOT, sectionOf } from "./frame.ts";

export { DEFAULT_UNKNOWN_VALUE_RULE, UNKNOWN_VALUE_CASES, type UnknownValueCase };

/** The three ways an implementation fails (F100-FR-019). */
export const DEGRADATION_CAUSES = ["threw", "time-limit", "outside-result-set"] as const;
export type DegradationCause = (typeof DEGRADATION_CAUSES)[number];

/** The sub-heading of a point's contract file that names the plainer path. */
export const FAILURE_SUB_HEADING = "Failure of an implementation" as const;

/** The sub-heading that states an unknown-value rule of the point. */
export const UNKNOWN_VALUE_SUB_HEADING = "Unknown-value rule" as const;

/**
 * The plainer path the point documents under "Failure of an implementation"
 * (F100-FR-019). The frame reads it from the point's contract file, so that
 * the annex stays the authority.
 */
export function plainerPathOf(ep: string, root: string = ROOT): string {
  return sectionOf(ep, FAILURE_SUB_HEADING, root);
}

/**
 * F100-FR-021 — the unknown-value rule in force for a point: what the point
 * states, and the default rule as the fallback of every point.
 */
export type UnknownValueRuleInForce = {
  readonly ep: string;
  /** What the sub-heading "Unknown-value rule" of the point states. */
  readonly stated: string;
  /** True where the point states nothing more specific than the default. */
  readonly statesNothingMoreSpecific: boolean;
  /** The default rule of F100-FR-021, the fallback of every point. */
  readonly fallback: Readonly<Record<UnknownValueCase, string>>;
};

export function unknownValueRuleInForce(ep: string, root: string = ROOT): UnknownValueRuleInForce {
  const stated = sectionOf(ep, UNKNOWN_VALUE_SUB_HEADING, root).trim();
  return Object.freeze({
    ep,
    stated,
    statesNothingMoreSpecific: stated === "",
    fallback: DEFAULT_UNKNOWN_VALUE_RULE,
  });
}

/** What the default rule of F100-FR-021 says about one value. */
export type UnknownValueOutcome = {
  readonly case: UnknownValueCase;
  readonly rule: string;
  /** For `unknown-field`: the reader ignores it and a copying writer keeps it. */
  readonly ignoredByAReader?: boolean;
  readonly keptByACopyingWriter?: boolean;
  /** For `unknown-closed-member`: the record is refused with this message. */
  readonly refused?: boolean;
  readonly message?: string;
  /** For `unknown-open-member`: refused only if no entry of the registry matches. */
  readonly resolvedThroughTheRegistry?: boolean;
};

/**
 * F100-FR-021 — apply the default rule, which is the fallback of every point.
 * `setName` names the closed or open set the value was read against.
 */
export function applyDefaultUnknownValueRule(
  kind: UnknownValueCase,
  value: string,
  setName: string,
  registryHasAMatchingEntry = false,
): UnknownValueOutcome {
  if (kind === "unknown-field") {
    return Object.freeze({
      case: kind,
      rule: DEFAULT_UNKNOWN_VALUE_RULE["unknown-field"],
      ignoredByAReader: true,
      keptByACopyingWriter: true,
    });
  }
  if (kind === "unknown-closed-member") {
    return Object.freeze({
      case: kind,
      rule: DEFAULT_UNKNOWN_VALUE_RULE["unknown-closed-member"],
      refused: true,
      message:
        `refused: "${value}" is not a member of the closed set "${setName}" ` + `(F100-FR-021)`,
    });
  }
  return Object.freeze({
    case: kind,
    rule: DEFAULT_UNKNOWN_VALUE_RULE["unknown-open-member"],
    resolvedThroughTheRegistry: true,
    refused: !registryHasAMatchingEntry,
    message: registryHasAMatchingEntry
      ? undefined
      : `refused: no entry of the registry of "${setName}" matches "${value}" (F100-FR-021)`,
  });
}

/* ------------------------------------------------------------------ *
 * The wrapper.
 * ------------------------------------------------------------------ */

/** The identifiers an event of the envelope needs (annex X, §X.1). */
export type EventContext = {
  readonly seq: number;
  readonly ts: string;
  readonly runId: string;
  readonly launchId: string;
  readonly engineStartId?: string;
};

/**
 * The event type the frame gives a degradation. Feature 100 owns the envelope
 * of annex X §X.1; feature 111 owns the catalogue of event types, and
 * confirms this name as it confirms the ids the harness adapters propose for
 * the doctor (annex G, §G.7).
 */
export const DEGRADATION_EVENT_TYPE = "extension.degraded" as const;

/** What the wrapper did with one call. */
export type Degradation = {
  readonly degraded: true;
  readonly ep: string;
  readonly implementationId: string;
  readonly operation: string;
  readonly cause: DegradationCause;
  /** The plainer path the point's contract file documents. */
  readonly plainerPath: string;
  /** The degradation as an event of the envelope of annex X §X.1. */
  readonly event: EventEnvelope;
  readonly detail: string;
};

export type GuardedOutcome<T> = { readonly degraded: false; readonly value: T } | Degradation;

/** What the wrapper needs to guard one call (F100-FR-019). */
export type GuardOptions<T> = {
  readonly ep: string;
  readonly implementationId: string;
  readonly operation: string;
  /** The time limit of the call, in milliseconds. */
  readonly timeLimitMs?: number;
  /** The closed result set of the point; a result outside it degrades. */
  readonly resultSet?: readonly T[];
  /** A predicate where the result set is not a list of literals. */
  readonly inResultSet?: (value: unknown) => boolean;
  readonly event: EventContext;
  readonly root?: string;
};

/**
 * F100-FR-019 — a call of an implementation, guarded. A throw, a run over the
 * time limit and a result outside the closed result set of the point each
 * degrade to the plainer path the point documents, with an event, and produce
 * no verdict, no exit code and no stop reason.
 */
export async function guardedCall<T>(
  call: () => T | Promise<T>,
  options: GuardOptions<T>,
): Promise<GuardedOutcome<T>> {
  const root = options.root ?? ROOT;
  let value: T;
  try {
    value =
      options.timeLimitMs === undefined
        ? await call()
        : await withTimeLimit(call, options.timeLimitMs);
  } catch (error) {
    const cause: DegradationCause = error instanceof TimeLimitExceeded ? "time-limit" : "threw";
    return degradation(options, cause, messageOf(error), root);
  }
  if (!inSet(value, options)) {
    return degradation(
      options,
      "outside-result-set",
      `the result ${JSON.stringify(value)} is outside the closed result set of ` +
        `${options.ep}.${options.operation}`,
      root,
    );
  }
  return { degraded: false, value };
}

/** A call that ran over its time limit (F100-FR-019). */
export class TimeLimitExceeded extends Error {
  constructor(limitMs: number) {
    super(`the call ran over its time limit of ${limitMs} ms (F100-FR-019)`);
    this.name = "TimeLimitExceeded";
  }
}

async function withTimeLimit<T>(call: () => T | Promise<T>, limitMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(call),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new TimeLimitExceeded(limitMs)), limitMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function inSet<T>(value: T, options: GuardOptions<T>): boolean {
  if (options.inResultSet !== undefined) return options.inResultSet(value);
  if (options.resultSet === undefined) return true;
  return (options.resultSet as readonly unknown[]).includes(value);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function degradation<T>(
  options: GuardOptions<T>,
  cause: DegradationCause,
  detail: string,
  root: string,
): Degradation {
  const plainerPath = plainerPathOf(options.ep, root);
  const event: EventEnvelope = {
    schema: EVENT_SCHEMA,
    v: EVENT_MAJOR,
    seq: options.event.seq,
    ts: options.event.ts,
    type: DEGRADATION_EVENT_TYPE,
    runId: options.event.runId,
    launchId: options.event.launchId,
    ...(options.event.engineStartId === undefined
      ? {}
      : { engineStartId: options.event.engineStartId }),
    data: {
      ep: options.ep,
      implementation: options.implementationId,
      operation: options.operation,
      cause,
      plainerPath,
      detail,
    },
  };
  return Object.freeze({
    degraded: true,
    ep: options.ep,
    implementationId: options.implementationId,
    operation: options.operation,
    cause,
    plainerPath,
    event: Object.freeze(event),
    detail,
  });
}

/**
 * F100-FR-019 — a failing implementation produces no verdict, no exit code
 * and no stop reason of its own. The check holds over the degradation record
 * and over the `data` of its event.
 */
export function holdsNoVerdictExitCodeOrStopReason(degraded: Degradation): boolean {
  const surfaces: readonly Readonly<Record<string, unknown>>[] = [
    degraded as unknown as Readonly<Record<string, unknown>>,
    degraded.event as unknown as Readonly<Record<string, unknown>>,
    degraded.event.data,
  ];
  return surfaces.every((surface) =>
    FIELDS_A_DEGRADATION_NEVER_CARRIES.every((field) => !(field in surface)),
  );
}

/** The degradation's event is a valid envelope of annex X §X.1. */
export function eventIsAnEnvelope(degraded: Degradation): boolean {
  return isEventEnvelope(degraded.event);
}

export { FIELDS_A_DEGRADATION_NEVER_CARRIES };
