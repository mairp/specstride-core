/**
 * T048 — the surface `stderr` (S-03, F141-FR-019).
 *
 * "Standard error as bytes, apart from `stdout`." The same rules as `stdout`
 * (§O.4), and the same reason for being its own surface: the stream a message
 * went to is a behaviour both sides are compared on.
 */
import { joinStream, type StreamCapture } from "./stdout.ts";
import { assertTheRunHasEnded, type CaptureContext, type SurfaceCapture } from "./types.ts";

/** Capture the surface `stderr`, as bytes, apart from standard output. */
export function captureStderr(
  context: CaptureContext,
): SurfaceCapture & { readonly value: StreamCapture } {
  assertTheRunHasEnded(context, "stderr");
  const parts = context.commands.map((c) => c.stderr);
  const bytes = joinStream(parts);
  return {
    surface: "stderr",
    id: "S-03",
    value: {
      bytes,
      text: Buffer.from(bytes).toString("utf8"),
      perCommand: Object.freeze(parts.map((p) => Buffer.from(p).toString("utf8"))),
    },
  };
}
