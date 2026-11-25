/**
 * Whether the commit an approval produced still stands in the history of the
 * workspace: as itself, as a patch-equivalent commit a rebase or a
 * cherry-pick wrote in its place, or not at all.
 *
 * The approval binds the commit it produced, so that a `git reset` past that
 * commit voids the approval: the workspace no longer holds the tree that was
 * approved. A rebase is not a reset, though. Landing the feature branch after
 * a rebase rewrote the approval commit of 152-commit-backpressure phase 1
 * (`6ddedbe` became `173bc704`, the same patch-id) and every later run began
 * again at phase 1, whose work was long merged, with nothing left to find
 * (2026-11-11). The check therefore asks for the CHANGE, not for the object
 * name: the change is still in HEAD's history where a commit there carries
 * the same stable patch-id.
 */
import { spawnSync } from "node:child_process";

/**
 * How many commits of HEAD's history, newest first, the search for a
 * patch-equivalent commit reads at most. A rebase moves the approval commit
 * by the commits of its new base; a history that grew further past it than
 * this is not searched and counts as gone, which is the behaviour before.
 */
export const EQUIVALENT_SEARCH_LIMIT = 2000;

/** Where the approval commit stands in the history of the workspace. */
export type ApprovalCommitStanding =
  | { readonly standing: "ancestor" }
  | { readonly standing: "rebased"; readonly equivalent: string }
  | { readonly standing: "gone" };

function git(
  workdir: string,
  argv: readonly string[],
  input?: string,
): { exit: number; out: string } {
  const result = spawnSync("git", ["-C", workdir, ...argv], {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    ...(input === undefined ? {} : { input }),
  });
  return { exit: result.status ?? 1, out: result.stdout ?? "" };
}

/** The `patch-id commit` pairs of a `git log -p` / `git show` text. */
function patchIdsOf(workdir: string, patches: string): readonly [string, string][] {
  if (patches === "") return [];
  const reply = git(workdir, ["patch-id", "--stable"], patches);
  if (reply.exit !== 0) return [];
  const pairs: [string, string][] = [];
  for (const line of reply.out.split("\n")) {
    const [patchId, commit] = line.trim().split(/\s+/u);
    if (patchId !== undefined && commit !== undefined && patchId !== "" && commit !== "") {
      pairs.push([patchId, commit]);
    }
  }
  return pairs;
}

/**
 * Where `commit` stands against HEAD. An ancestor stands as itself. Else a
 * commit of HEAD's history that is not in the history of `commit`, with the
 * same stable patch-id, stands for it (a rebase, a cherry-pick). A commit the
 * object store no longer holds (a `git gc` after the rewrite), a commit whose
 * change is empty, and a commit with no equivalent are gone: the reset guard.
 */
export function approvalCommitStanding(workdir: string, commit: string): ApprovalCommitStanding {
  if (git(workdir, ["merge-base", "--is-ancestor", commit, "HEAD"]).exit === 0) {
    return Object.freeze({ standing: "ancestor" as const });
  }
  // The search below reads up to EQUIVALENT_SEARCH_LIMIT patches, and the
  // approval is read many times in one run. Its answer is a pure function of
  // the commit and of HEAD, so it is kept for that pair: a new HEAD is a new
  // key, and nothing stale is ever returned.
  const head = git(workdir, ["rev-parse", "--verify", "HEAD"]);
  const key = head.exit === 0 ? `${workdir}\0${commit}\0${head.out.trim()}` : undefined;
  const known = key === undefined ? undefined : standingsOfRewrittenCommits.get(key);
  if (known !== undefined) return known;
  const found = searchForTheSameChange(workdir, commit);
  if (key !== undefined) standingsOfRewrittenCommits.set(key, found);
  return found;
}

/** Answers of the search, per working directory, commit and HEAD. */
const standingsOfRewrittenCommits = new Map<string, ApprovalCommitStanding>();

function searchForTheSameChange(workdir: string, commit: string): ApprovalCommitStanding {
  const gone = Object.freeze({ standing: "gone" as const });
  if (git(workdir, ["cat-file", "-e", `${commit}^{commit}`]).exit !== 0) return gone;
  const own = patchIdsOf(
    workdir,
    git(workdir, ["show", "--no-color", "--no-ext-diff", "--format=commit %H", commit]).out,
  )[0]?.[0];
  if (own === undefined) return gone;
  const history = git(workdir, [
    "log",
    "-p",
    "--no-color",
    "--no-ext-diff",
    "--no-merges",
    "--format=commit %H",
    `--max-count=${String(EQUIVALENT_SEARCH_LIMIT)}`,
    "HEAD",
    "--not",
    commit,
  ]);
  if (history.exit !== 0) return gone;
  const match = patchIdsOf(workdir, history.out).find(([patchId]) => patchId === own);
  return match === undefined
    ? gone
    : Object.freeze({ standing: "rebased" as const, equivalent: match[1] });
}
