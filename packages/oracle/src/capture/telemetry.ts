/**
 * T049 — the surface `telemetry` (S-10, F141-FR-019).
 *
 * "The payloads at the telemetry sink stub." The sink stub stores every payload
 * it was handed, in the order it was handed them, with the path it arrived on and
 * nothing of its own (`stubs/sink/server.ts`). This module reads that store.
 *
 * The rule of §O.4 for this surface is N-26: the payloads are compared after
 * N-03, N-04 and N-07 — the run id, the timestamps and the process ids. The
 * oracle consumes `specstride.event-sink/1` (EP-08) and ships nothing.
 */
import { existsSync, readFileSync } from "node:fs";

import { assertTheRunHasEnded, type CaptureContext, type SurfaceCapture } from "./types.ts";

/** One payload at the sink. */
export type TelemetryPayload = {
  readonly path: string;
  readonly body: unknown;
  /** The body as text where it is no JSON document. */
  readonly raw?: string;
};

/** The value of the surface `telemetry`. */
export type TelemetryCapture = {
  readonly count: number;
  readonly payloads: readonly TelemetryPayload[];
  /** Set where the scenario named no sink; the surface is then empty and not missing. */
  readonly noSink?: true;
};

/** Read the store of the telemetry sink stub. */
export function readTelemetryStore(file: string): readonly TelemetryPayload[] {
  if (!existsSync(file)) return [];
  const text = readFileSync(file, "utf8");
  if (text.trim() === "") return [];
  return Object.freeze(
    text
      .replace(/\n$/, "")
      .split("\n")
      .map((line) => {
        const stored = JSON.parse(line) as { path?: string; body?: string };
        const path = stored.path ?? "/";
        try {
          return { path, body: JSON.parse(stored.body ?? "null") as unknown };
        } catch {
          return { path, body: null, raw: stored.body ?? "" };
        }
      }),
  );
}

/** Capture the surface `telemetry`. */
export function captureTelemetry(
  context: CaptureContext,
): SurfaceCapture & { readonly value: TelemetryCapture } {
  assertTheRunHasEnded(context, "telemetry");
  if (context.telemetryStore === undefined) {
    return { surface: "telemetry", id: "S-10", value: { count: 0, payloads: [], noSink: true } };
  }
  const payloads = readTelemetryStore(context.telemetryStore);
  return {
    surface: "telemetry",
    id: "S-10",
    value: { count: payloads.length, payloads },
  };
}
