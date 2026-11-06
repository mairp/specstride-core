/**
 * T052 — rule N-02, state layout (F141-FR-020).
 *
 * "Both sides map physical paths to logical names through the layout tables. It
 * applies to captured trees and to the text of messages that name state."
 *
 * The layout tables are data of feature 100 — `layout.json` for the port and
 * `layout-old-side.json` for the reference — and the map of logical name to path
 * of THIS side is the one the driver made from them (`src/run/driver.ts`). The
 * normalizer holds no table (F141-FR-020): it is handed the map and reverses it.
 *
 * "It applies to captured trees AND to the text of messages that name state": so
 * the rule runs over every surface and not only over `state` and `tree`. A message
 * on standard error that names the as-is state directory of the reference and the
 * same message on the port name one logical thing, and only this rule makes them
 * one value.
 */
import { replaceInSurfaces } from "./walk.ts";
import type { MutableCapture, NormalizeContext, Rule } from "./types.ts";

/** The map of path to logical name, longest path first. */
export function logicalNamesByPath(
  statePaths: Readonly<Record<string, string>>,
): readonly { readonly path: string; readonly logicalName: string }[] {
  return Object.freeze(
    Object.entries(statePaths)
      .map(([logicalName, path]) => ({ path, logicalName }))
      .sort((a, b) => b.path.length - a.path.length),
  );
}

/** Replace every physical path of a file of state by its logical name. */
export function replaceStatePaths(
  value: string,
  byPath: readonly { readonly path: string; readonly logicalName: string }[],
): string {
  let text = value;
  for (const row of byPath) {
    if (row.path === "") continue;
    text = text.split(row.path).join(`<state:${row.logicalName}>`);
  }
  return text;
}

/** N-02. */
export const N02: Rule = {
  id: "N-02",
  subject: "State layout",
  surfaces: [],
  apply(capture: MutableCapture, context: NormalizeContext): number {
    const byPath = logicalNamesByPath(context.statePaths);
    if (byPath.length === 0) return 0;
    return replaceInSurfaces(capture.surfaces, [], (value) => replaceStatePaths(value, byPath));
  },
};
