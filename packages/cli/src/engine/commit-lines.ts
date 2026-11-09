/**
 * The lines an approval commit adds, per file, so that the secret gate judges
 * what the commit brings and not what HEAD already holds.
 *
 * The scan reads whole files. A pass that edits a file whose fixture already
 * holds a credential-shaped string (`sk-the-secret-itself` in a test of the
 * redactor) would otherwise be blocked by a line git committed long ago, and
 * the work of the phase would stay uncommitted (152-commit-backpressure
 * phase 2, 2026-11-09). A file HEAD does not track is new: every line of it is
 * added.
 */
import { spawnSync } from "node:child_process";

/** The added line numbers (1-based) of each tracked file; absent: the whole file is new. */
export type AddedLines = ReadonlyMap<string, ReadonlySet<number>>;

/** The added line numbers of a `git diff -U0` text, from its hunk headers. */
export function addedLinesOfDiff(diff: string): ReadonlySet<number> {
  const lines = new Set<number>();
  for (const match of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gmu)) {
    const start = Number(match[1]);
    const count = match[2] === undefined ? 1 : Number(match[2]);
    for (let line = start; line < start + count; line += 1) lines.add(line);
  }
  return lines;
}

function git(workdir: string, argv: readonly string[]): { exit: number; out: string } {
  const result = spawnSync("git", ["-C", workdir, ...argv], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return { exit: result.status ?? 1, out: result.stdout ?? "" };
}

/**
 * The lines each file adds against HEAD (working tree, which is what the
 * commit stages and the scan reads). A file HEAD does not hold is left out:
 * the caller scans it whole. With no HEAD (no commit yet) or no repository,
 * nothing is known and every file is scanned whole.
 */
export function addedLinesAgainstHead(workdir: string, files: readonly string[]): AddedLines {
  const known = new Map<string, ReadonlySet<number>>();
  if (git(workdir, ["rev-parse", "--verify", "--quiet", "HEAD"]).exit !== 0) return known;
  for (const file of files) {
    if (git(workdir, ["cat-file", "-e", `HEAD:${file}`]).exit !== 0) continue;
    const diff = git(workdir, [
      "diff",
      "--no-color",
      "--no-ext-diff",
      "--no-textconv",
      "-U0",
      "HEAD",
      "--",
      file,
    ]);
    if (diff.exit !== 0) continue;
    known.set(file, addedLinesOfDiff(diff.out));
  }
  return known;
}

/**
 * Whether a hit of the scan is on a line the commit adds. A hit with no line
 * (an unreadable file, line 0) always counts: the gate fails closed.
 */
export function isAddedLine(
  added: AddedLines,
  hit: { readonly file: string; readonly line: number },
): boolean {
  if (hit.line <= 0) return true;
  const lines = added.get(hit.file);
  return lines === undefined || lines.has(hit.line);
}
