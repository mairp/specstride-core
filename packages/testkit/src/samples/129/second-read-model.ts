/**
 * T009 of feature 129 — a SECOND IMPLEMENTATION of the read model, registered
 * from the test tree (F129-FR-036).
 *
 * It is written against the interface and NOT against `@specstride/view`: it
 * shares no line of code with the product implementation, so that passing the
 * same suite says something. Its `project` is literally a fold of its own
 * `reduce` over the events, which is the property of F129-FR-002, and it reads
 * no clock, opens no file and uses no randomness (F129-FR-001).
 *
 * It is deliberately a SMALL read model: it holds the fields of the view that
 * the conformance suite of EP-09 asks about and says `null` for the rest
 * (F129-FR-010). What it must not do is derive anything a renderer could not
 * see, or open a file.
 */
import { SUPPORTED_MAJORS, majorIsSupported } from "@specstride/contracts/envelope/event";
import type { EventEnvelope } from "@specstride/contracts/envelope/event";
import { RUN_STATES } from "@specstride/contracts/state/run-state";
import { LANES, SCHEMA_ID } from "@specstride/contracts/records/run-view";
import type { Implementation } from "../../conformance/frame.ts";

/** The id this implementation registers under. */
export const IMPLEMENTATION_ID = "second-view-read-model-129" as const;

type Inputs = {
  readonly events: { readonly events: readonly EventEnvelope[] };
  readonly stateFiles: { readonly runRecord: Readonly<Record<string, unknown>> | null };
  readonly observations: { readonly lease: { readonly probe: string } | null };
  readonly now: string;
};

const DEAD_PROBES = ["free", "stale-owner-dead", "owner-dead-group-alive"] as const;

function stateOf(runRecord: Readonly<Record<string, unknown>> | null): string {
  if (runRecord === null) return "none";
  const written = runRecord["state"];
  if (typeof written === "string" && (RUN_STATES as readonly string[]).includes(written)) {
    return written;
  }
  return "unknown";
}

/** The second implementation's own small view. */
export type SecondView = {
  readonly schema: typeof SCHEMA_ID;
  readonly now: string;
  readonly state: string;
  readonly display: string;
  readonly liveness: string;
  readonly dead: boolean;
  readonly phase: number | null;
  readonly phases: number | null;
  readonly rejects: number;
  readonly approved: number;
  readonly lanes: readonly string[];
  /** The reason the view is `stale`, where one holds (annex G §G.6). */
  readonly staleReason: string | null;
  readonly cursor: {
    readonly file: string | null;
    readonly offset: number;
    readonly lastSeq: number;
  };
};

function base(inputs: Inputs): SecondView {
  const state = stateOf(inputs.stateFiles.runRecord);
  const probe = inputs.observations.lease?.probe ?? "unknown";
  const live = ["starting", "running", "paused-quota", "relaunching", "stopping"].includes(state);
  const dead = live && (DEAD_PROBES as readonly string[]).includes(probe);
  return Object.freeze({
    schema: SCHEMA_ID,
    now: inputs.now,
    state,
    display: dead ? "dead" : state,
    liveness: live
      ? dead
        ? "dead"
        : probe === "held-live"
          ? "alive"
          : "unknown"
      : "not-applicable",
    dead,
    phase: null,
    phases: null,
    rejects: 0,
    approved: 0,
    lanes: Object.freeze([...LANES]),
    staleReason: null,
    cursor: Object.freeze({ file: null, offset: 0, lastSeq: 0 }),
  });
}

function reduceOne(view: SecondView, event: EventEnvelope): SecondView {
  // An event whose major lies outside the range the reader declares is NOT
  // folded, and the view is `stale` with the reason (annex G §G.6; the constant
  // `MAJOR_OUTSIDE_THE_RANGE_MARKS` of the point).
  if (!majorIsSupported(event.v, SUPPORTED_MAJORS)) {
    return Object.freeze({
      ...view,
      display: view.dead ? "dead" : "stale",
      staleReason: "event-major-out-of-range",
      cursor: Object.freeze({ ...view.cursor, lastSeq: Math.max(view.cursor.lastSeq, event.seq) }),
    });
  }
  const data = (
    typeof event.data === "object" && event.data !== null
      ? (event.data as Record<string, unknown>)
      : {}
  ) as Record<string, unknown>;
  let { phase, phases, rejects, approved } = view;
  if (event.type === "run.started") {
    // F129-FR-010: the number of phases the run declared, stated by
    // `run.started` (the field the real grammar binds).
    const declared = data["phases"];
    if (typeof declared === "number") phases = declared;
  }
  if (event.type === "phase.started") {
    const number = data["phase"];
    if (typeof number === "number") phase = number;
    const total = data["total"] ?? data["phases"];
    if (typeof total === "number") phases = total;
  }
  if (event.type === "phase.ended" && data["outcome"] === "approved") approved += 1;
  if (
    event.type === "verdict.recorded" &&
    String(data["result"] ?? data["verdict"] ?? "").toUpperCase() === "REJECTED"
  )
    rejects += 1;
  return Object.freeze({
    ...view,
    phase,
    phases,
    rejects,
    approved,
    display: view.staleReason !== null && !view.dead ? "stale" : view.display,
    cursor: Object.freeze({ ...view.cursor, lastSeq: Math.max(view.cursor.lastSeq, event.seq) }),
  });
}

/** The two operations of EP-09, with `project` a fold of `reduce`. */
export const operations = Object.freeze({
  project(inputs: Inputs): SecondView {
    return inputs.events.events.reduce(
      (view, event) => operations.reduce(view, event),
      base(inputs),
    );
  },
  reduce(view: SecondView, event: EventEnvelope): SecondView {
    return reduceOne(view, event);
  },
});

/** The record the test tree registers with the registry of EP-09. */
export const implementation: Implementation = Object.freeze({
  ep: "EP-09",
  pointId: "specstride.view/1",
  id: IMPLEMENTATION_ID,
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});

/**
 * The fields a reader of the product view and of this one must agree on. It
 * takes any record of a view, because the two implementations have two types.
 */
export function comparable(view: object): Readonly<Record<string, unknown>> {
  const record = view as Record<string, unknown>;
  const progress = (record["progress"] ?? {}) as Record<string, unknown>;
  const phases = record["phases"];
  return Object.freeze({
    state: record["state"],
    display: record["display"],
    liveness: record["liveness"],
    phase: record["phase"] ?? progress["phase"] ?? null,
    phases: typeof record["phases"] === "number" ? record["phases"] : (progress["phases"] ?? null),
    rejects: record["rejects"] ?? progress["rejects"] ?? 0,
    approved:
      typeof record["approved"] === "number"
        ? record["approved"]
        : Array.isArray(phases)
          ? (phases as { approved?: unknown }[]).filter((p) => p.approved === true).length
          : 0,
  });
}
