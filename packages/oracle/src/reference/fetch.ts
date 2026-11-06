/**
 * T009 — the fetch of a reference tree, its verification, the read-only tree,
 * the check after every run and the copy for a fixture with its own
 * install-root file (F141-FR-002).
 *
 * What the fetch does, in the order R18 O-1 gives:
 *
 * 1. `git archive <commit>` from the local clone, unpacked with `tar` into a
 *    scratch directory outside every source repository. An archive and not a
 *    clone: no `.git` comes with it, so nothing in the scratch tree can reach
 *    the source repository.
 * 2. `git rev-parse <commit>^{tree}` in the clone is compared with the pinned
 *    tree hash. A tree that does not match fails the fetch.
 * 3. `chmod -R a-w` makes the tree read-only, so the reference cannot write
 *    into its own tree during a run.
 * 4. `treeFingerprint` is taken, and `checkTreeUnchanged` after every run
 *    compares it again. A changed tree fails the run.
 * 5. The archive holds no install-root file by construction, and every run
 *    sets `PYTHONDONTWRITEBYTECODE=1` so the interpreter writes no cache into
 *    the tree. A fixture that tests the install-root layer gets a copy of the
 *    tree with its own file (`copyTreeWithInstallRoot`).
 *
 * Only two git commands are ever run against a source repository, both of them
 * read-only. `assertReadOnlyGitArgv` is the guard: every git command of this
 * module goes through it, and every verb that could write to a source
 * repository — a checkout, a branch, a worktree, a stash, a change of index or
 * configuration — is refused with the verb named. So no command of the oracle
 * can change the branch a clone has checked out, its index, its configuration
 * or its working tree.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";

import type { Pin } from "./pins.ts";

/** The install-root file of the reference; the archive holds none. */
export const INSTALL_ROOT_FILE = ".env" as const;

/** The variable every run sets so the interpreter writes no cache (R18 F-21). */
export const NO_BYTECODE_VARIABLE = "PYTHONDONTWRITEBYTECODE" as const;

/** The directory names a cache of an interpreter takes. */
export const INTERPRETER_CACHE_NAMES: readonly string[] = [
  "__pycache__",
  ".pytest_cache",
  ".mypy_cache",
  ".ruff_cache",
];

/** The file suffixes a cache of an interpreter takes. */
export const INTERPRETER_CACHE_SUFFIXES = [".pyc", ".pyo"] as const;

/**
 * Every git verb that could write to a source repository. F141-FR-002: the
 * oracle runs no checkout, no branch, no worktree, no stash, no change of
 * index or configuration.
 */
export const FORBIDDEN_GIT_VERBS: readonly string[] = [
  "checkout",
  "switch",
  "branch",
  "worktree",
  "stash",
  "config",
  "reset",
  "restore",
  "clean",
  "add",
  "rm",
  "mv",
  "commit",
  "merge",
  "rebase",
  "cherry-pick",
  "am",
  "apply",
  "pull",
  "push",
  "fetch",
  "remote",
  "tag",
  "update-ref",
  "symbolic-ref",
  "gc",
  "prune",
  "repack",
  "update-index",
  "write-tree",
  "init",
  "clone",
  "submodule",
  "notes",
  "replace",
  "bisect",
  "filter-branch",
  "maintenance",
  "sparse-checkout",
];

/** The two read-only verbs the fetch needs, and nothing else. */
export const ALLOWED_GIT_VERBS: readonly string[] = ["archive", "rev-parse"];

/** Something about a reference tree that fails the fetch or the run. */
export class ReferenceTreeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReferenceTreeError";
  }
}

/**
 * Refuse a git command that is not one of the two read-only verbs the fetch
 * needs. Every git command of this module goes through it.
 */
export function assertReadOnlyGitArgv(argv: readonly string[]): void {
  const verb = argv.find((a) => !a.startsWith("-"));
  if (verb === undefined) {
    throw new ReferenceTreeError("a git command of the oracle names a verb");
  }
  if (FORBIDDEN_GIT_VERBS.includes(verb)) {
    throw new ReferenceTreeError(
      `git ${verb} writes to a source repository, which the oracle never does (F141-FR-002). ` +
        `The oracle runs only git ${ALLOWED_GIT_VERBS.join(" and git ")}`,
    );
  }
  if (!ALLOWED_GIT_VERBS.includes(verb)) {
    throw new ReferenceTreeError(
      `git ${verb} is not one of the read-only verbs the fetch uses (${ALLOWED_GIT_VERBS.join(", ")}) (F141-FR-002)`,
    );
  }
}

/**
 * The environment of every git command the oracle runs against a clone: an
 * empty global and system configuration, so nothing of the machine takes part
 * and nothing is written back.
 */
function gitEnvironment(): Record<string, string> {
  return {
    PATH: process.env["PATH"] ?? "/usr/bin:/bin",
    HOME: "/nonexistent",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_SYSTEM: "/dev/null",
    GIT_TERMINAL_PROMPT: "0",
    GIT_OPTIONAL_LOCKS: "0",
    LC_ALL: "C",
    TZ: "UTC",
  };
}

/** One read-only git command in a clone, with the guard in front of it. */
function git(cloneDir: string, argv: readonly string[]): Buffer {
  assertReadOnlyGitArgv(argv);
  return execFileSync("git", [...argv], {
    cwd: cloneDir,
    env: gitEnvironment(),
    maxBuffer: 512 * 1024 * 1024,
  });
}

/** Where the tree of a system goes under a scratch directory. */
export function scratchTreeRoot(scratchRoot: string, system: string): string {
  return join(resolve(scratchRoot), "ref", system);
}

/**
 * A hash over every path, type, mode, link target and byte under a directory.
 * The durable identity of a reference tree: it is taken after the fetch and
 * again after every run, and a difference is a changed tree.
 */
export function treeFingerprint(root: string): string {
  const lines: string[] = [];
  const walk = (dir: string, rel: string): void => {
    const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : 1,
    );
    for (const entry of entries) {
      const path = join(dir, entry.name);
      const next = rel === "" ? entry.name : `${rel}/${entry.name}`;
      if (entry.isSymbolicLink()) {
        lines.push(`l ${next}`);
      } else if (entry.isDirectory()) {
        lines.push(`d ${next}`);
        walk(path, next);
      } else {
        lines.push(`f ${next} ${createHash("sha256").update(readFileSync(path)).digest("hex")}`);
      }
    }
  };
  walk(resolve(root), "");
  return createHash("sha256").update(lines.join("\n")).digest("hex");
}

/** Whether every file and directory under a root has no write bit at all. */
export function isTreeReadOnly(root: string): boolean {
  let readOnly = true;
  const walk = (dir: string): void => {
    if ((statSync(dir).mode & 0o222) !== 0) readOnly = false;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) walk(path);
      else if ((statSync(path).mode & 0o222) !== 0) readOnly = false;
    }
  };
  walk(resolve(root));
  return readOnly;
}

/**
 * Every cache of an interpreter under a root, as paths relative to it. The
 * reference runs without writing one (`NO_BYTECODE_VARIABLE`); one that
 * appears is reported, and with `throwOnFound` it fails.
 */
export function assertNoInterpreterCache(
  root: string,
  options: { throwOnFound?: boolean } = {},
): string[] {
  const found: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (INTERPRETER_CACHE_NAMES.includes(entry.name)) {
        found.push(relative(resolve(root), path));
        continue;
      }
      if (INTERPRETER_CACHE_SUFFIXES.some((suffix) => entry.name.endsWith(suffix))) {
        found.push(relative(resolve(root), path));
        continue;
      }
      if (entry.isDirectory() && !entry.isSymbolicLink()) walk(path);
    }
  };
  walk(resolve(root));
  found.sort();
  if (options.throwOnFound === true && found.length > 0) {
    throw new ReferenceTreeError(
      `the reference tree ${root} holds a cache of the interpreter: ${found.join(", ")}. ` +
        `Every run sets ${NO_BYTECODE_VARIABLE}=1 and the tree is read-only (F141-FR-002)`,
    );
  }
  return found;
}

/** A reference tree in scratch, as `data-model.md` names it. */
export type ReferenceTree = {
  readonly system: string;
  readonly root: string;
  readonly commit: string;
  readonly tree: string;
  readonly readOnly: boolean;
  readonly verified: boolean;
  /** The fingerprint taken right after the fetch: the identity to check against. */
  readonly hashAfterFetch: string;
  /** Whether the tree holds an install-root file. The archive holds none. */
  readonly holdsInstallRoot: boolean;
  /** The variables a run adds so no cache of the interpreter lands in the tree. */
  readonly noBytecode: Readonly<Record<string, string>>;
};

export type FetchOptions = {
  /** The pin of the system: only the pinned commit counts. */
  readonly pin: Pin;
  /** The local clone the archive is taken from. Never written to. */
  readonly cloneDir: string;
  /** The scratch directory, outside every source repository. */
  readonly scratchRoot: string;
};

/**
 * Produce the reference tree of a pinned commit: archive into scratch, verify
 * against the pinned tree hash, make it read-only, take its fingerprint.
 *
 * The clone may be on any branch and in any state. Nothing here reads its
 * working tree, its index or its configuration, and nothing writes to it: the
 * two commands are `git rev-parse <commit>^{tree}` and `git archive <commit>`,
 * both read-only and both through `assertReadOnlyGitArgv`.
 */
export function fetchReferenceTree(options: FetchOptions): ReferenceTree {
  const { pin, cloneDir, scratchRoot } = options;
  const root = scratchTreeRoot(scratchRoot, pin.system);

  if (resolve(root).startsWith(`${resolve(cloneDir)}/`) || resolve(root) === resolve(cloneDir)) {
    throw new ReferenceTreeError(
      `the scratch directory ${root} is inside the source repository ${cloneDir}; the tree is ` +
        `unpacked outside every source repository (F141-FR-002)`,
    );
  }
  if (existsSync(root) && readdirSync(root).length > 0) {
    throw new ReferenceTreeError(`the scratch directory ${root} is not empty`);
  }

  // 2. Verify the tree hash of the pinned commit, read out of the clone.
  const found = git(cloneDir, ["rev-parse", `${pin.commit}^{tree}`])
    .toString("utf8")
    .trim();
  if (found !== pin.tree) {
    throw new ReferenceTreeError(
      `${pin.system}: the commit ${pin.commit} has the tree hash ${found}, and the pin says ` +
        `${pin.tree}. The tree hash must equal the pin (F141-FR-001, F141-FR-002)`,
    );
  }

  // 1. Archive the pinned commit and unpack it into scratch.
  mkdirSync(root, { recursive: true });
  const archive = git(cloneDir, ["archive", "--format=tar", pin.commit]);
  execFileSync("tar", ["-x", "-f", "-", "-C", root], {
    input: archive,
    maxBuffer: 512 * 1024 * 1024,
  });

  // An archive and not a clone: nothing in the tree reaches the source.
  if (existsSync(join(root, ".git"))) {
    throw new ReferenceTreeError(`${root} holds a .git directory; the tree comes from an archive`);
  }
  // 5a. The archive holds no install-root file by construction.
  const holdsInstallRoot = existsSync(join(root, INSTALL_ROOT_FILE));
  if (holdsInstallRoot) {
    throw new ReferenceTreeError(
      `the archive of ${pin.commit} holds ${INSTALL_ROOT_FILE}; the reference tree holds no ` +
        `install-root file, and a fixture that tests that layer uses a copy with its own ` +
        `file (F141-FR-002)`,
    );
  }
  // 5b. Nor a cache of an interpreter.
  assertNoInterpreterCache(root, { throwOnFound: true });

  // 3. Read-only, so the reference cannot write into its own tree.
  execFileSync("chmod", ["-R", "a-w", root]);
  const readOnly = isTreeReadOnly(root);
  if (!readOnly) {
    throw new ReferenceTreeError(`${root} could not be made read-only (F141-FR-002)`);
  }

  // 4. The identity to check after every run.
  return Object.freeze({
    system: pin.system,
    root,
    commit: pin.commit,
    tree: pin.tree,
    readOnly,
    verified: true,
    hashAfterFetch: treeFingerprint(root),
    holdsInstallRoot: false,
    noBytecode: Object.freeze({ [NO_BYTECODE_VARIABLE]: "1" }),
  });
}

/** What the check after a run found. */
export type TreeCheck = {
  readonly system: string;
  readonly root: string;
  readonly unchanged: boolean;
  /** The fingerprint now. */
  readonly hash: string;
  /** Any cache of the interpreter that appeared during the run. */
  readonly interpreterCaches: readonly string[];
};

/**
 * The check after every run (F141-FR-002): the tree is still the tree that was
 * fetched. A changed tree fails the run — which is how the case "the reference
 * writes into its own tree during a run" ends, and the case of a run that left
 * a cache of the interpreter behind.
 */
export function checkTreeUnchanged(
  tree: ReferenceTree,
  options: { throwOnChange?: boolean } = {},
): TreeCheck {
  const hash = treeFingerprint(tree.root);
  const interpreterCaches = assertNoInterpreterCache(tree.root);
  const unchanged = hash === tree.hashAfterFetch && interpreterCaches.length === 0;
  const report: TreeCheck = Object.freeze({
    system: tree.system,
    root: tree.root,
    unchanged,
    hash,
    interpreterCaches: Object.freeze(interpreterCaches),
  });
  if (!unchanged && options.throwOnChange !== false) {
    throw new ReferenceTreeError(
      `the reference tree of ${tree.system} at ${tree.root} is not unchanged after the run: ` +
        `the fingerprint is ${hash} and the fetch left ${tree.hashAfterFetch}` +
        (interpreterCaches.length > 0
          ? `; a cache of the interpreter appeared: ${interpreterCaches.join(", ")}`
          : "") +
        `. A changed tree fails the run (F141-FR-002)`,
    );
  }
  return report;
}

/**
 * The copy for a fixture with its own install-root file (F141-FR-002). The
 * reference tree holds no install-root file, so a fixture that tests that
 * layer cannot use the tree itself: it gets a writable copy of the tree with
 * its own file, outside the reference tree, and the reference tree stays
 * read-only and unchanged.
 */
export function copyTreeWithInstallRoot(
  tree: ReferenceTree,
  options: { readonly destination: string; readonly content: string },
): ReferenceTree {
  const destination = resolve(options.destination);
  if (destination.startsWith(`${resolve(tree.root)}/`) || destination === resolve(tree.root)) {
    throw new ReferenceTreeError(
      `the copy ${destination} would lie inside the reference tree ${tree.root}; a fixture never ` +
        `changes the reference tree (F141-FR-002)`,
    );
  }
  if (existsSync(destination)) {
    throw new ReferenceTreeError(`the copy ${destination} already exists`);
  }

  mkdirSync(destination, { recursive: true });
  cpSync(tree.root, destination, { recursive: true, dereference: false });
  // The copy is the fixture's own, so the fixture can add its file to it.
  execFileSync("chmod", ["-R", "u+w", destination]);
  writeFileSync(join(destination, INSTALL_ROOT_FILE), options.content, "utf8");

  return Object.freeze({
    system: tree.system,
    root: destination,
    commit: tree.commit,
    tree: tree.tree,
    readOnly: false,
    verified: tree.verified,
    hashAfterFetch: treeFingerprint(destination),
    holdsInstallRoot: true,
    noBytecode: tree.noBytecode,
  });
}
