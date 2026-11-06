/**
 * T048 — the surface `tree` (S-04, F141-FR-019).
 *
 * "The working directory after the run, without state: path, type, mode, link
 * target, content." Four fields of every entry and the content of every file, so
 * a mode bit, a symbolic link and a byte of content are each a difference the
 * oracle sees.
 *
 * "Without state": the files of state are the surface `state`, captured by
 * logical name, so they are left out here — a state file lies at a different
 * physical path on each side and comparing it as a path of the tree would
 * compare the layout and not the behaviour. The counter files of the stubs are
 * outside the working directory already (§O.3, rule 1), and N-23 leaves them out
 * of the tree wherever one is found.
 */
import { lstatSync, readFileSync, readdirSync, readlinkSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

import { assertTheRunHasEnded, type CaptureContext, type SurfaceCapture } from "./types.ts";

/** One entry of a captured tree. */
export type TreeEntry = {
  readonly path: string;
  readonly type: "file" | "directory" | "symlink" | "other";
  /** The permission bits, as four octal digits. */
  readonly mode: string;
  readonly linkTarget?: string;
  /** The content of a file, as text where it is text and as base64 where it is not. */
  readonly content?: string;
  readonly contentEncoding?: "utf8" | "base64";
  readonly size?: number;
};

/** The value of a tree surface. */
export type TreeCapture = {
  readonly root: string;
  readonly entries: readonly TreeEntry[];
};

/** Names never walked into: they are no behaviour of either side. */
export const NEVER_WALKED: readonly string[] = Object.freeze([".git", "node_modules"]);

/** The type of one entry. */
function typeOf(stat: {
  isFile: () => boolean;
  isDirectory: () => boolean;
  isSymbolicLink: () => boolean;
}): TreeEntry["type"] {
  if (stat.isSymbolicLink()) return "symlink";
  if (stat.isDirectory()) return "directory";
  if (stat.isFile()) return "file";
  return "other";
}

/** Is this byte sequence text? */
function isText(bytes: Uint8Array): boolean {
  if (bytes.includes(0)) return false;
  const text = Buffer.from(bytes).toString("utf8");
  return !text.includes("�");
}

/**
 * Walk a directory into entries, sorted by path, leaving out everything `omit`
 * says to leave out. The order is the sorted path and not the order of the
 * file system, so two runs of one side agree (F141-SC-005).
 */
export function walkTree(
  root: string,
  options: {
    readonly omit?: readonly string[];
    readonly withContent?: boolean;
  } = {},
): readonly TreeEntry[] {
  const absoluteRoot = resolve(root);
  const omit = new Set((options.omit ?? []).map((p) => resolve(p)));
  const withContent = options.withContent !== false;
  const entries: TreeEntry[] = [];

  const walk = (dir: string): void => {
    let names: string[];
    try {
      names = readdirSync(dir).sort();
    } catch {
      return;
    }
    for (const name of names) {
      if (NEVER_WALKED.includes(name)) continue;
      const path = join(dir, name);
      if (omit.has(resolve(path))) continue;
      let stat;
      try {
        stat = lstatSync(path);
      } catch {
        continue;
      }
      const type = typeOf(stat);
      const entry: TreeEntry = {
        path: relative(absoluteRoot, path).split(sep).join("/"),
        type,
        mode: (stat.mode & 0o7777).toString(8).padStart(4, "0"),
        ...(type === "symlink" ? { linkTarget: readlinkSync(path) } : {}),
        ...(type === "file" ? { size: stat.size } : {}),
      };
      if (type === "file" && withContent) {
        const bytes = readFileSync(path);
        // The CONTENT is the comparison, so the byte count is left out beside it.
        // The content holds run ids, times and paths, which the rules of feature
        // 100 replace; a byte count of the bytes BEFORE those replacements is the
        // length of the values that were replaced and compares two runs of ONE side
        // as different (F141-SC-005). A file whose content is not captured keeps its
        // size, because then the size is all there is.
        const { size: _size, ...withoutSize } = entry;
        entries.push({
          ...withoutSize,
          ...(isText(bytes)
            ? { content: bytes.toString("utf8"), contentEncoding: "utf8" as const }
            : { content: bytes.toString("base64"), contentEncoding: "base64" as const }),
        });
      } else {
        entries.push(entry);
      }
      if (type === "directory") walk(path);
    }
  };
  walk(absoluteRoot);
  return Object.freeze(entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)));
}

/** Capture the surface `tree`: the working directory after the run, without state. */
export function captureTree(
  context: CaptureContext,
): SurfaceCapture & { readonly value: TreeCapture } {
  assertTheRunHasEnded(context, "tree");
  // Without state: every file of state of this side is left out, because the
  // surface `state` compares it by its logical name instead.
  const stateFiles = Object.values(context.statePaths);
  return {
    surface: "tree",
    id: "S-04",
    value: {
      root: context.workdir,
      entries: walkTree(context.workdir, { omit: stateFiles }),
    },
  };
}
