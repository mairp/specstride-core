/**
 * T049 — the surface `repository` (S-11, F141-FR-019).
 *
 * "The commits of the project's repository: message, tree content, the absence of
 * a push." The checkpoint of a run is a commit in the project's own repository
 * inside the working directory. What is compared is the MESSAGE and the content
 * of the TREE, never the commit hash, which N-22 replaces by a numbered
 * placeholder. "The absence of a push" is part of the surface: a run that pushed
 * would have reached a network, and a run of the oracle never does (F141-SC-006).
 *
 * The repository read here is the project's, inside the working directory of the
 * run — never a source repository of a baseline, which the oracle only ever
 * archives from (F141-FR-002). Reading it still goes through a guard: every git
 * command of this module names a verb of `READ_ONLY_REPOSITORY_VERBS` and is
 * checked against `FORBIDDEN_GIT_VERBS` of `src/reference/fetch.ts`, which is the
 * one list of verbs that write. The guard of the fetch itself is left as it is:
 * it allows the two verbs the FETCH needs and nothing more.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { FORBIDDEN_GIT_VERBS } from "../reference/fetch.ts";
import {
  assertTheRunHasEnded,
  CaptureError,
  type CaptureContext,
  type SurfaceCapture,
} from "./types.ts";

/** The read-only verbs this surface reads a project repository with, and no other. */
export const READ_ONLY_REPOSITORY_VERBS: readonly string[] = Object.freeze([
  "rev-list",
  "cat-file",
  "ls-tree",
  "remote",
  "rev-parse",
]);

/** Refuse a git command that is not one of the read-only verbs of this surface. */
/** The sub-verbs of `git remote` that WRITE; bare `git remote` only lists them. */
export const REMOTE_SUB_VERBS_THAT_WRITE: readonly string[] = Object.freeze([
  "add",
  "remove",
  "rm",
  "rename",
  "set-url",
  "set-head",
  "set-branches",
  "prune",
  "update",
]);

export function assertReadOnlyRepositoryGitArgv(argv: readonly string[]): void {
  const words = argv.filter((a) => !a.startsWith("-"));
  const verb = words[0];
  if (verb === undefined) throw new CaptureError("a git command of the capture names a verb");
  // `remote` is BOTH a read-only verb (bare, it lists the remotes, which is what
  // "nothing was pushed" is read from) and the gateway to sub-verbs that write.
  // The sub-verb is what decides, so the allow-list is consulted first for it.
  if (verb === "remote") {
    const sub = words[1];
    if (sub !== undefined && REMOTE_SUB_VERBS_THAT_WRITE.includes(sub)) {
      throw new CaptureError(
        `git remote ${sub} writes, and the capture of the surface repository only reads ` +
          `(${READ_ONLY_REPOSITORY_VERBS.join(", ")})`,
      );
    }
    return;
  }
  if (FORBIDDEN_GIT_VERBS.includes(verb)) {
    throw new CaptureError(
      `git ${verb} writes, and the capture of the surface repository only reads ` +
        `(${READ_ONLY_REPOSITORY_VERBS.join(", ")})`,
    );
  }
  if (!READ_ONLY_REPOSITORY_VERBS.includes(verb)) {
    throw new CaptureError(
      `git ${verb} is not one of the read-only verbs the surface repository reads with ` +
        `(${READ_ONLY_REPOSITORY_VERBS.join(", ")})`,
    );
  }
}

/** One commit of the project's repository. */
export type CommitRecord = {
  /** The message, in full. */
  readonly message: string;
  /** The content of the tree of the commit: every path, sorted. */
  readonly tree: readonly string[];
};

/** The value of the surface `repository`. */
export type RepositoryCapture = {
  readonly commits: readonly CommitRecord[];
  /** The remote-tracking references the repository has; a run of the oracle makes none. */
  readonly remotes: readonly string[];
  /** The absence of a push, which the surface asserts. */
  readonly nothingWasPushed: boolean;
  readonly noRepository?: true;
};

/** One read-only git command in the project's repository, with the guard in front. */
function git(root: string, argv: readonly string[]): string {
  assertReadOnlyRepositoryGitArgv(argv);
  const result = spawnSync("git", ["-C", root, ...argv], {
    encoding: "utf8",
    env: {
      PATH: process.env["PATH"] ?? "/usr/bin:/bin",
      HOME: "/nonexistent",
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_SYSTEM: "/dev/null",
      GIT_TERMINAL_PROMPT: "0",
      GIT_OPTIONAL_LOCKS: "0",
      LC_ALL: "C",
      TZ: "UTC",
    },
    maxBuffer: 64 * 1024 * 1024,
  });
  return result.status === 0 ? result.stdout : "";
}

/** The message of one commit, from its object. */
export function commitMessage(root: string, id: string): string {
  const text = git(root, ["cat-file", "commit", id]);
  const blank = text.indexOf("\n\n");
  return blank < 0 ? "" : text.slice(blank + 2);
}

/** The content of the tree of one commit: every path, sorted. */
export function commitTree(root: string, id: string): readonly string[] {
  return Object.freeze(
    git(root, ["ls-tree", "-r", "--name-only", id])
      .split("\n")
      .filter((l) => l !== "")
      .sort(),
  );
}

/** Capture the surface `repository`. */
export function captureRepository(
  context: CaptureContext,
): SurfaceCapture & { readonly value: RepositoryCapture } {
  assertTheRunHasEnded(context, "repository");
  const root = context.repositoryRoot ?? context.workdir;
  if (!existsSync(join(root, ".git"))) {
    return {
      surface: "repository",
      id: "S-11",
      value: { commits: [], remotes: [], nothingWasPushed: true, noRepository: true },
    };
  }
  // Oldest first, so the order of the capture is the order the run made them in.
  const ids = git(root, ["rev-list", "--all", "--reverse"])
    .split("\n")
    .filter((l) => l !== "");
  const commits = ids.map((id) => ({
    message: commitMessage(root, id),
    tree: commitTree(root, id),
  }));
  const remotes = git(root, ["remote"])
    .split("\n")
    .filter((l) => l !== "")
    .sort();
  return {
    surface: "repository",
    id: "S-11",
    value: {
      commits: Object.freeze(commits),
      remotes: Object.freeze(remotes),
      nothingWasPushed: remotes.length === 0,
    },
  };
}
