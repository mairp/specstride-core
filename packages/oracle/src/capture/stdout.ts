/**
 * T048 — the surface `stdout` (S-02, F141-FR-019).
 *
 * "Standard output as bytes." Captured APART from standard error: the two streams
 * are two surfaces of §O.4, and a side that printed a line on the wrong one is a
 * difference the oracle must see, which merging them would hide.
 *
 * The bytes are kept as bytes until the normalizer runs. The rules of §O.4 for
 * this surface are N-01 to N-08, N-15 and N-18 to N-21; none of them is applied
 * here — the capture is the input of the normalizer, not its output.
 */
import { assertTheRunHasEnded, type CaptureContext, type SurfaceCapture } from "./types.ts";

/** The value of a stream surface: the bytes, per command and joined. */
export type StreamCapture = {
  readonly bytes: Uint8Array;
  readonly text: string;
  readonly perCommand: readonly string[];
};

/** Join the bytes of every command of the run, in order. */
export function joinStream(parts: readonly Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const all = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    all.set(part, at);
    at += part.length;
  }
  return all;
}

/** Capture the surface `stdout`, as bytes, apart from standard error. */
export function captureStdout(
  context: CaptureContext,
): SurfaceCapture & { readonly value: StreamCapture } {
  assertTheRunHasEnded(context, "stdout");
  const parts = context.commands.map((c) => c.stdout);
  const bytes = joinStream(parts);
  return {
    surface: "stdout",
    id: "S-02",
    value: {
      bytes,
      text: Buffer.from(bytes).toString("utf8"),
      perCommand: Object.freeze(parts.map((p) => Buffer.from(p).toString("utf8"))),
    },
  };
}
