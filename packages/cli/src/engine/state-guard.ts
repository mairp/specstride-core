/**
 * The guard of the engine's state in the workspace (`<workdir>/.specstride/`).
 *
 * A proposer pass runs with full access to the working tree, and the engine's
 * own records live inside it: the workspace identity, the lock and the active
 * launch, the launch records, the feature state. On 2026-11-09 a proposer that
 * had written a stray backup under `.specstride/backups/` "cleaned up" with
 * `rm -rf .specstride` — three times — and took the lock, the active launch
 * and every launch record with it, while its run was live.
 *
 * The guard takes a bounded snapshot of the small files under `.specstride/`
 * right before a pass starts, and after the pass exits it puts back every
 * snapshotted file that is gone. It never overwrites a file that exists (the
 * engine and its supervisor keep writing their own records during a pass), and
 * a file the pass was asked to write (the evidence, a checkpoint) is not in
 * the snapshot: the engine removes those before the pass starts.
 */
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";

/** A file above this size is not snapshotted (logs grow; records stay small). */
export const STATE_FILE_LIMIT_BYTES = 256 * 1024;
/** The snapshot stops collecting once it holds this many bytes. */
export const STATE_TOTAL_LIMIT_BYTES = 16 * 1024 * 1024;

export type StateSnapshot = {
  readonly root: string;
  readonly files: ReadonlyMap<string, Buffer>;
};

/** The small regular files under `root`, by path relative to it; empty when `root` is absent. */
export function snapshotWorkspaceState(
  root: string,
  limits: {
    readonly fileBytes?: number;
    readonly totalBytes?: number;
    /** Relative paths (prefixes, `/`-separated) a pass may legitimately rewrite or remove. */
    readonly exclude?: readonly string[];
  } = {},
): StateSnapshot {
  const exclude = limits.exclude ?? [];
  const excluded = (rel: string): boolean =>
    exclude.some(
      (prefix) => rel === prefix || rel.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`),
    );
  const fileBytes = limits.fileBytes ?? STATE_FILE_LIMIT_BYTES;
  const totalBytes = limits.totalBytes ?? STATE_TOTAL_LIMIT_BYTES;
  const files = new Map<string, Buffer>();
  let total = 0;
  const walk = (dir: string): void => {
    let names: string[];
    try {
      names = readdirSync(dir).sort();
    } catch {
      return;
    }
    for (const name of names) {
      if (total >= totalBytes) return;
      const path = join(dir, name);
      let stat;
      try {
        stat = lstatSync(path);
      } catch {
        continue;
      }
      if (stat.isSymbolicLink()) continue;
      const rel = relative(root, path).split(sep).join("/");
      if (excluded(rel)) continue;
      if (stat.isDirectory()) {
        walk(path);
        continue;
      }
      if (!stat.isFile() || stat.size > fileBytes || total + stat.size > totalBytes) continue;
      try {
        files.set(rel, readFileSync(path));
        total += stat.size;
      } catch {
        // a file that vanished between the listing and the read is not state to keep
      }
    }
  };
  if (existsSync(root)) walk(root);
  return { root, files };
}

/**
 * Put back every snapshotted file that no longer exists; return their
 * relative paths, sorted. A file that exists is left as it is.
 */
export function restoreMissingState(snapshot: StateSnapshot): string[] {
  const restored: string[] = [];
  for (const [rel, bytes] of snapshot.files) {
    const path = join(snapshot.root, ...rel.split("/"));
    if (existsSync(path)) continue;
    try {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, bytes, { flag: "wx" });
      restored.push(rel);
    } catch {
      // a path whose parent is now a file, or a race with the engine's own
      // write: the engine's record wins, nothing is forced
    }
  }
  return restored.sort();
}

/** The block the next pass's prompt carries after a restore. */
export function stateRestoredNote(restored: readonly string[]): string {
  const shown = restored.slice(0, 8).map((rel) => `.specstride/${rel}`);
  const more =
    restored.length > shown.length ? ` and ${String(restored.length - shown.length)} more` : "";
  return (
    `# The last pass deleted the engine's own state\n` +
    `It removed ${String(restored.length)} file(s) under .specstride/ (${shown.join(", ")}${more}); ` +
    `the engine has put them back. .specstride/ belongs to the engine: never delete, move or ` +
    `rewrite anything under it. Write there only the files this prompt names (the evidence, the ` +
    `checkpoint). To undo a stray write of your own, remove exactly that path — never a directory ` +
    `of .specstride/.`
  );
}
