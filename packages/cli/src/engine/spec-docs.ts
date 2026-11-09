/**
 * The feature's spec documents inside a phase attempt.
 *
 * Two things the engine did made a task that edits the feature's own documents
 * impossible to approve. On 2026-11-09, phase 10 of 150-host-hermes was
 * rejected three times on T074 ("record a deviation note in tasks.md") and T075
 * ("record the re-check in plan.md"):
 *
 *  - after every pass the engine wrote the task list back as it was before the
 *    attempt, to undo a pass's ticks — and so also erased every note the pass
 *    had written into it. Only the TICKS are the engine's: they are restored,
 *    the rest of the text the pass wrote is kept;
 *  - the critic reads the change as `git diff HEAD` plus the new untracked
 *    files, and a repository that keeps its spec corpus out of git
 *    (`specs/` ignored) shows the critic no edit of it at all. The change the
 *    critic reads now carries, for an ignored feature directory, the diff of
 *    its documents against their state at the start of the attempt.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { phasesOf } from "../../../spec-formats/src/adapters/speckit-tasks.ts";

/** A spec document above this size is not snapshotted. */
export const SPEC_DOC_CAP_BYTES = 512 * 1024;

/** Every task of a task list, by id, with its tick — read by the one grammar (F104-SC-001). */
function ticksOf(text: string): Map<string, { ticked: boolean; line: number }> {
  const out = new Map<string, { ticked: boolean; line: number }>();
  for (const phase of phasesOf(text, "tasks.md")) {
    for (const task of phase.tasks) out.set(task.id, { ticked: task.ticked, line: task.line });
  }
  return out;
}

/**
 * The text of `current` with the tick of every task put back to its state in
 * `before`: a task line keeps whatever the pass wrote, but its checkbox is the
 * one `before` had (a task `before` did not have keeps its own). Every other
 * line of `current` is kept as it is. The task lines are found by the
 * spec-format package; this only flips the box on the line it names.
 */
export function keepTicksOf(current: string, before: string): string {
  const wanted = ticksOf(before);
  const lines = current.split("\n");
  for (const [id, now] of ticksOf(current)) {
    const want = wanted.get(id);
    if (want === undefined || want.ticked === now.ticked) continue;
    const index = now.line - 1;
    const line = lines[index];
    if (line === undefined) continue;
    const boxes = want.ticked ? ["[ ]"] : ["[x]", "[X]"];
    const at = boxes
      .map((box) => line.indexOf(box))
      .filter((i) => i >= 0)
      .sort((x, y) => x - y)[0];
    if (at === undefined) continue;
    lines[index] = `${line.slice(0, at)}${want.ticked ? "[x]" : "[ ]"}${line.slice(at + 3)}`;
  }
  return lines.join("\n");
}

/** True when git ignores the directory (its documents never reach `git diff`). */
export function isIgnored(workdir: string, directory: string): boolean {
  const probe = spawnSync("git", ["check-ignore", "-q", directory], { cwd: workdir });
  return probe.status === 0;
}

/** The text of every small `.md` document directly in `directory`, by name. */
export function snapshotSpecDocs(directory: string): Map<string, string> {
  const out = new Map<string, string>();
  let names: string[] = [];
  try {
    names = readdirSync(directory).sort();
  } catch {
    return out;
  }
  for (const name of names) {
    if (!name.endsWith(".md")) continue;
    const path = join(directory, name);
    try {
      const stat = statSync(path);
      if (!stat.isFile() || stat.size > SPEC_DOC_CAP_BYTES) continue;
      out.set(name, readFileSync(path, "utf8"));
    } catch {
      // a document that vanished is simply not in the snapshot
    }
  }
  return out;
}

/**
 * The unified diff of the documents of `directory` against `before`, labelled
 * with `label/<name>` (the path a reader knows them by); "" when nothing
 * changed. A document created during the attempt diffs against empty.
 */
export function specDocsChange(
  directory: string,
  before: ReadonlyMap<string, string>,
  label: string,
): string {
  const now = snapshotSpecDocs(directory);
  const names = [...new Set([...before.keys(), ...now.keys()])].sort();
  const scratch = mkdtempSync(join(tmpdir(), "specstride-spec-docs-"));
  const parts: string[] = [];
  try {
    for (const name of names) {
      const a = before.get(name) ?? "";
      const b = now.get(name) ?? "";
      if (a === b) continue;
      const left = join(scratch, "a");
      const right = join(scratch, "b");
      writeFileSync(left, a);
      writeFileSync(right, b);
      const diff = spawnSync(
        "git",
        ["diff", "--no-index", "--no-color", `--src-prefix=`, `--dst-prefix=`, left, right],
        { encoding: "utf8" },
      ).stdout;
      const body = diff
        .split("\n")
        .filter((line) => !line.startsWith("diff --git") && !line.startsWith("index "))
        .map((line) =>
          line.startsWith("--- ")
            ? `--- ${label}/${name}${before.has(name) ? "" : " (new)"}`
            : line.startsWith("+++ ")
              ? `+++ ${label}/${name}${now.has(name) ? "" : " (deleted)"}`
              : line,
        )
        .join("\n");
      parts.push(body.trimEnd());
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
  return parts.join("\n");
}

/** The block the critic reads after the git change, for an ignored feature directory. */
export function specDocsBlock(change: string, label: string): string {
  if (change === "") return "";
  return (
    `\n--- the feature's documents (${label}/ is ignored by git, so the diff above does not show them;` +
    ` their change in this attempt):\n${change}\n`
  );
}
