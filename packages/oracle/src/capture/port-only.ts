/**
 * T050 — the three surfaces of the port alone: `events-primary`,
 * `control-records` and `counters` (S-14 to S-16, F141-FR-019).
 *
 * "The oracle MUST capture, per run, the surfaces S-01 to S-13 of §O.4 that the
 * fixture names, and on the port also S-14 to S-16." The three have no side on
 * the reference at all — the reference has no primary event stream, no control
 * plane and no counters of its own — so they are never compared between the
 * sides. They are the two captures of the SECOND suite: capture A, the port with
 * the layer off, and capture B, the port with the layer on (F141-FR-039).
 *
 * | Surface | What it is | How it is compared |
 * |---|---|---|
 * | S-14 `events-primary` | the primary event file of the port | N-03, N-04, N-05, N-07 |
 * | S-15 `control-records` | the records of the control plane, by logical name | N-02 and the rules of `state` |
 * | S-16 `counters` | per phase: passes used, reject count, MALFORMED streak, numbers of phase attempts, yield count | none; asserted EQUAL, not compared as text |
 *
 * A capture of one of them on the reference side is refused: it would be a
 * comparison of the port with nothing.
 */
import { existsSync, readFileSync } from "node:fs";

import { captureStateFile, type StateEntry } from "./state.ts";
import { readEventFile, type EventRecord } from "./events.ts";
import {
  CaptureError,
  PORT_ONLY_SURFACES,
  assertTheRunHasEnded,
  type CaptureContext,
  type SurfaceCapture,
} from "./types.ts";

/** The counters of one phase that the second suite asserts equal (F141-FR-041). */
export const COUNTER_NAMES = [
  "passesUsed",
  "rejectCount",
  "malformedStreak",
  "phaseAttempts",
  "yieldCount",
] as const;
export type CounterName = (typeof COUNTER_NAMES)[number];

/** The counters of one phase. */
export type PhaseCounters = Readonly<Record<CounterName, number>> & { readonly phase: number };

/** The value of the surface `counters`. */
export type CountersCapture = {
  readonly perPhase: readonly PhaseCounters[];
  /** The sets the second suite asserts are subsets of capture A's (F141-FR-041). */
  readonly exitCodes: readonly number[];
  readonly stopReasons: readonly string[];
  readonly runStates: readonly string[];
};

/** A surface of the port alone, asked for on the reference side. */
function assertPort(context: CaptureContext, surface: string): void {
  if (context.side !== "port") {
    throw new CaptureError(
      `the surface ${surface} exists on the port only (§O.4, S-14 to S-16); it was asked for on ` +
        `the ${context.side} side of ${context.scenario}`,
    );
  }
  if (!PORT_ONLY_SURFACES.includes(surface)) {
    throw new CaptureError(`${surface} is no surface of the port alone`);
  }
  assertTheRunHasEnded(context, surface);
}

/**
 * Capture S-14 `events-primary`: the primary event file of the port, which the
 * compatibility projection of the surface `events` is derived from (N-12).
 */
export function captureEventsPrimary(
  context: CaptureContext,
  primaryFile: string,
): SurfaceCapture & { readonly value: { readonly records: readonly EventRecord[] } } {
  assertPort(context, "events-primary");
  return {
    surface: "events-primary",
    id: "S-14",
    value: { records: readEventFile(primaryFile) },
  };
}

/**
 * Capture S-15 `control-records`: the records of the control plane of the port,
 * by logical name. The map of logical name to path is the one the driver made
 * from the layout tables of feature 100; this module holds no table.
 */
export function captureControlRecords(
  context: CaptureContext,
  controlPaths: Readonly<Record<string, string>>,
): SurfaceCapture & { readonly value: { readonly entries: readonly StateEntry[] } } {
  assertPort(context, "control-records");
  const names = Object.keys(controlPaths).sort();
  return {
    surface: "control-records",
    id: "S-15",
    value: {
      entries: Object.freeze(names.map((n) => captureStateFile(n, controlPaths[n] as string))),
    },
  };
}

/**
 * Capture S-16 `counters`. The counters are read from the record the port writes
 * per phase; a missing file gives no phase and not a zero, so the assertion of
 * F141-FR-041 cannot pass on an absent capture.
 */
export function captureCounters(
  context: CaptureContext,
  countersFile: string,
): SurfaceCapture & { readonly value: CountersCapture } {
  assertPort(context, "counters");
  if (!existsSync(countersFile)) {
    return {
      surface: "counters",
      id: "S-16",
      value: { perPhase: [], exitCodes: [], stopReasons: [], runStates: [] },
    };
  }
  const parsed = JSON.parse(readFileSync(countersFile, "utf8")) as {
    phases?: Record<string, Partial<Record<CounterName, number>>>;
    exitCodes?: number[];
    stopReasons?: string[];
    runStates?: string[];
  };
  const perPhase: PhaseCounters[] = Object.entries(parsed.phases ?? {})
    .map(([phase, counters]) => {
      const row = { phase: Number(phase) } as Record<string, number>;
      for (const name of COUNTER_NAMES) row[name] = counters[name] ?? 0;
      return row as unknown as PhaseCounters;
    })
    .sort((a, b) => a.phase - b.phase);
  return {
    surface: "counters",
    id: "S-16",
    value: {
      perPhase: Object.freeze(perPhase),
      exitCodes: Object.freeze([...(parsed.exitCodes ?? [])].sort((a, b) => a - b)),
      stopReasons: Object.freeze([...(parsed.stopReasons ?? [])].sort()),
      runStates: Object.freeze([...(parsed.runStates ?? [])].sort()),
    },
  };
}
