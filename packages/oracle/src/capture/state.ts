/**
 * T048 — the surface `state` (S-05, F141-FR-019).
 *
 * "The files of state, by logical name: existence and content." A file of state
 * lies at the as-is path on the reference and, on the port, at the path the
 * layout tables of feature 100 give its logical name. So the surface is keyed by
 * the LOGICAL NAME on both sides and never by a path: that is what makes the two
 * sides comparable at all, and it is why a fixture may hold no physical path of
 * the port's state (F141-FR-012).
 *
 * The map of logical name to path of one side is made by the driver
 * (`src/run/driver.ts`) from the layout tables, and handed here. This module
 * reads and holds no table.
 */
import { existsSync, readFileSync, lstatSync } from "node:fs";

import { assertTheRunHasEnded, type CaptureContext, type SurfaceCapture } from "./types.ts";

/** One file of state, by its logical name. */
export type StateEntry = {
  readonly logicalName: string;
  readonly exists: boolean;
  readonly type?: "file" | "directory" | "symlink" | "other";
  readonly mode?: string;
  readonly content?: string;
  readonly contentEncoding?: "utf8" | "base64";
};

/** The value of the surface `state`. */
export type StateCapture = {
  readonly entries: readonly StateEntry[];
};

/** Read one file of state by its logical name. */
export function captureStateFile(logicalName: string, path: string): StateEntry {
  if (!existsSync(path)) return { logicalName, exists: false };
  const stat = lstatSync(path);
  const type = stat.isSymbolicLink()
    ? ("symlink" as const)
    : stat.isDirectory()
      ? ("directory" as const)
      : stat.isFile()
        ? ("file" as const)
        : ("other" as const);
  const base = {
    logicalName,
    exists: true,
    type,
    mode: (stat.mode & 0o7777).toString(8).padStart(4, "0"),
  };
  if (type !== "file") return base;
  const bytes = readFileSync(path);
  const text = bytes.toString("utf8");
  return text.includes("�")
    ? { ...base, content: bytes.toString("base64"), contentEncoding: "base64" }
    : { ...base, content: text, contentEncoding: "utf8" };
}

/**
 * Capture the surface `state`: every file of state the scenario laid out, by its
 * logical name, in the order of the names.
 */
export function captureState(
  context: CaptureContext,
): SurfaceCapture & { readonly value: StateCapture } {
  assertTheRunHasEnded(context, "state");
  const names = Object.keys(context.statePaths).sort();
  return {
    surface: "state",
    id: "S-05",
    value: {
      entries: Object.freeze(
        names.map((name) => captureStateFile(name, context.statePaths[name] as string)),
      ),
    },
  };
}
