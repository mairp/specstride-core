/**
 * T052 — rule N-01, absolute paths (F141-FR-020).
 *
 * "The working directory, the root of the fixture, the root of the reference, the
 * root of the port, the home and the temporary directory become named
 * placeholders; the longest prefix first; real paths are resolved first."
 *
 * Three things the rule text asks for and that are easy to get wrong:
 *
 * - **named** placeholders, not numbered ones: `<workdir>` and `<home>` say which
 *   root a path was under, so a file that moved from the home to the working
 *   directory is still a difference;
 * - **the longest prefix first**: the temporary directory of a run lies under its
 *   run root, so replacing the shorter prefix first would leave `<run>/tmp` and
 *   `<temp>` as two names for one directory;
 * - **real paths resolved first**: on a machine where the temporary directory is a
 *   symbolic link, one side prints the link and the other the target. Both are
 *   resolved before the replacement, so both become one placeholder.
 */
import { realpathSync } from "node:fs";

import { replaceInSurfaces } from "./walk.ts";
import type { MutableCapture, NormalizeContext, Rule } from "./types.ts";

/** The roots of one side, as named placeholders. */
export type Root = { readonly placeholder: string; readonly path: string };

/** The real path of a root, where it can be resolved; the path itself otherwise. */
export function realRoot(path: string): string {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
}

/**
 * The roots of one side, with their real paths resolved and sorted so that the
 * LONGEST prefix is replaced first.
 */
export function rootsLongestFirst(roots: readonly Root[]): readonly Root[] {
  const both: Root[] = [];
  for (const root of roots) {
    both.push(root);
    const real = realRoot(root.path);
    if (real !== root.path) both.push({ placeholder: root.placeholder, path: real });
  }
  return Object.freeze(both.sort((a, b) => b.path.length - a.path.length));
}

/** Replace every root of this side by its named placeholder. */
export function replaceRoots(value: string, roots: readonly Root[]): string {
  let text = value;
  for (const root of roots) {
    if (root.path === "" || root.path === "/") continue;
    text = text.split(root.path).join(root.placeholder);
  }
  return text;
}

/** N-01. */
export const N01: Rule = {
  id: "N-01",
  subject: "Absolute paths",
  surfaces: [],
  apply(capture: MutableCapture, context: NormalizeContext): number {
    const roots = rootsLongestFirst(context.roots);
    return replaceInSurfaces(capture.surfaces, [], (value) => replaceRoots(value, roots));
  },
};
