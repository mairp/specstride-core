/**
 * CT-141-102 — the reference trees (T008, F141-FR-002).
 *
 * What the test proves, each against a real git repository built in a temporary
 * directory and driven through the real code path of
 * `src/reference/fetch.ts` with a pin of that repository:
 *
 * - the tree is obtained by an archive of the pinned commit, unpacked into a
 *   scratch directory outside every source repository;
 * - the tree is verified against the pinned tree hash, and a wrong pin fails;
 * - the tree is read-only;
 * - the tree is checked after every run, and a changed tree fails the run;
 * - a clone on another branch with uncommitted changes stays exactly as it was:
 *   the checked-out branch, `HEAD`, the status and the bytes of the working
 *   tree are the same after the fetch as before it;
 * - no cache of the interpreter lands in the tree;
 * - a fixture that tests the install-root layer gets a copy of the tree with
 *   its own file, and the reference tree itself still holds none.
 *
 * Nothing here calls a model, opens a socket or needs a credential (F141-FR-038).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  FORBIDDEN_GIT_VERBS,
  INTERPRETER_CACHE_NAMES,
  INSTALL_ROOT_FILE,
  NO_BYTECODE_VARIABLE,
  ReferenceTreeError,
  assertNoInterpreterCache,
  assertReadOnlyGitArgv,
  checkTreeUnchanged,
  copyTreeWithInstallRoot,
  fetchReferenceTree,
  isTreeReadOnly,
  scratchTreeRoot,
  treeFingerprint,
} from "../../src/reference/fetch.ts";
import {
  REFERENCE_EDIT_VERBS,
  ReferenceEditError,
  editedReferenceTree,
  referenceEditsOf,
} from "../../src/reference/edits.ts";

/** Every temporary directory this file made, removed at the end. */
const made: string[] = [];

function temp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), `oracle-${prefix}-`));
  made.push(dir);
  return dir;
}

process.on("exit", () => {
  for (const dir of made) {
    try {
      // The read-only trees of the fetch have to be made writable again first.
      execFileSync("chmod", ["-R", "u+w", dir], { stdio: "ignore" });
    } catch {
      // nothing to do: the removal below reports what is left
    }
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // nothing to do
    }
  }
});

function git(cwd: string, ...argv: string[]): string {
  return execFileSync("git", argv, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_SYSTEM: "/dev/null",
      GIT_AUTHOR_NAME: "oracle",
      GIT_AUTHOR_EMAIL: "oracle@example.invalid",
      GIT_COMMITTER_NAME: "oracle",
      GIT_COMMITTER_EMAIL: "oracle@example.invalid",
      GIT_AUTHOR_DATE: "2026-01-01T00:00:00Z",
      GIT_COMMITTER_DATE: "2026-01-01T00:00:00Z",
    },
  }).trim();
}

/**
 * A stand-in for a local clone of a baseline: a real git repository with a
 * commit whose tree hash is read back out of git, so the pin the test uses is
 * a true pin of a true commit.
 */
function clone(): { dir: string; commit: string; tree: string } {
  const dir = temp("clone");
  git(dir, "init", "-q", "-b", "trunk");
  mkdirSync(join(dir, "lib"));
  writeFileSync(join(dir, "proposer.sh"), "#!/usr/bin/env bash\necho proposer\n");
  writeFileSync(join(dir, "lib/critic.py"), "print('critic')\n");
  writeFileSync(join(dir, "README.md"), "the baseline\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "the pinned commit");
  return {
    dir,
    commit: git(dir, "rev-parse", "HEAD"),
    tree: git(dir, "rev-parse", "HEAD^{tree}"),
  };
}

/**
 * Everything about a clone that a write would change. The git commands run
 * first and the walk over the bytes last: `git status` refreshes the index,
 * which is a write this helper makes and the fetch does not, so it must not
 * land between two walks.
 */
function cloneState(dir: string): Record<string, string> {
  const facts = {
    head: git(dir, "rev-parse", "HEAD"),
    branch: git(dir, "rev-parse", "--abbrev-ref", "HEAD"),
    status: git(dir, "status", "--porcelain"),
    refs: git(dir, "show-ref"),
    stash: git(dir, "stash", "list"),
    config: git(dir, "config", "--local", "--list"),
  };
  const listing: string[] = [];
  const walk = (p: string, rel: string): void => {
    for (const entry of readdirSync(p, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : 1,
    )) {
      const next = join(p, entry.name);
      const nextRel = rel === "" ? entry.name : `${rel}/${entry.name}`;
      if (entry.isDirectory()) {
        listing.push(`d ${nextRel}`);
        walk(next, nextRel);
      } else {
        listing.push(
          `f ${nextRel} ${createHash("sha256").update(readFileSync(next)).digest("hex")}`,
        );
      }
    }
  };
  walk(dir, "");
  return { ...facts, worktree: createHash("sha256").update(listing.join("\n")).digest("hex") };
}

// ---------------------------------------------------------------------------
// Archive into scratch, the tree hash, read-only
// ---------------------------------------------------------------------------

test("CT-141-102: the fetch archives the pinned commit into scratch and verifies the tree hash", () => {
  const source = clone();
  const scratch = temp("scratch");

  const tree = fetchReferenceTree({
    pin: { system: "specstride", commit: source.commit, tree: source.tree },
    cloneDir: source.dir,
    scratchRoot: scratch,
  });

  // The tree is in the scratch directory, outside every source repository.
  assert.equal(tree.root, scratchTreeRoot(scratch, "specstride"));
  assert.equal(resolve(tree.root).startsWith(resolve(scratch)), true);
  assert.equal(resolve(tree.root).startsWith(resolve(source.dir)), false);
  assert.equal(tree.system, "specstride");
  assert.equal(tree.commit, source.commit);
  assert.equal(tree.tree, source.tree);
  assert.equal(tree.verified, true);

  // The content of the commit is there, read back from disk.
  assert.equal(readFileSync(join(tree.root, "README.md"), "utf8"), "the baseline\n");
  assert.equal(readFileSync(join(tree.root, "lib/critic.py"), "utf8"), "print('critic')\n");
  // ... and no git directory came with it: it is an archive, not a clone.
  assert.equal(existsSync(join(tree.root, ".git")), false);

  // The archive holds no install-root file by construction (F141-FR-002).
  assert.equal(existsSync(join(tree.root, INSTALL_ROOT_FILE)), false);
  assert.equal(tree.holdsInstallRoot, false);

  // Read-only, witnessed through the mode bits on disk.
  assert.equal(isTreeReadOnly(tree.root), true);
  assert.equal(tree.readOnly, true);
  for (const relative of ["README.md", "proposer.sh", "lib/critic.py", "lib"]) {
    const mode = statSync(join(tree.root, relative)).mode & 0o222;
    assert.equal(mode, 0, `${relative} has no write bit`);
  }
  // The mode bits above are the witness on every host. A refused write can be
  // witnessed only as a user the mode bits apply to: the effective user id 0
  // ignores them, and the reference tier runs `FX-26/root-sandbox-assertion`
  // with it on purpose (F141-FR-037).
  if (process.getuid !== undefined && process.getuid() !== 0) {
    assert.throws(
      () => writeFileSync(join(tree.root, "README.md"), "changed\n"),
      /EACCES|EPERM/,
      "a write into the reference tree fails",
    );
  } else {
    // The check after every run is what fails the run in that case, and the
    // test below witnesses it.
    assert.equal(checkTreeUnchanged(tree).unchanged, true);
  }

  // The fingerprint is a durable identity of the tree that could not exist
  // before the fetch.
  assert.match(tree.hashAfterFetch, /^[0-9a-f]{64}$/);
  assert.equal(tree.hashAfterFetch, treeFingerprint(tree.root));
});

test("CT-141-102: a tree that does not match the pinned tree hash fails the fetch", () => {
  const source = clone();
  const scratch = temp("scratch-bad");

  assert.throws(
    () =>
      fetchReferenceTree({
        pin: { system: "specstride", commit: source.commit, tree: "0".repeat(40) },
        cloneDir: source.dir,
        scratchRoot: scratch,
      }),
    (error: unknown) =>
      error instanceof ReferenceTreeError && /tree hash/.test((error as Error).message),
    "the verification against the pinned tree hash fails",
  );
});

// ---------------------------------------------------------------------------
// The check after every run
// ---------------------------------------------------------------------------

test("CT-141-102: the tree is unchanged after a run, and a changed tree fails the run", () => {
  const source = clone();
  const scratch = temp("scratch-run");
  const tree = fetchReferenceTree({
    pin: { system: "specstride", commit: source.commit, tree: source.tree },
    cloneDir: source.dir,
    scratchRoot: scratch,
  });

  // After a run that wrote nothing into the tree, the check passes.
  const after = checkTreeUnchanged(tree);
  assert.equal(after.unchanged, true);
  assert.equal(after.hash, tree.hashAfterFetch);

  // A changed tree fails the run. The change needs the write bit back, which
  // is itself the proof that the read-only tree stood in the way.
  execFileSync("chmod", ["-R", "u+w", tree.root]);
  writeFileSync(join(tree.root, "README.md"), "the reference wrote here\n");
  assert.throws(
    () => checkTreeUnchanged(tree),
    (error: unknown) =>
      error instanceof ReferenceTreeError && /unchanged|changed/.test((error as Error).message),
    "a changed tree fails the run",
  );
  // The non-throwing form reports the same thing with the new hash.
  const report = checkTreeUnchanged(tree, { throwOnChange: false });
  assert.equal(report.unchanged, false);
  assert.notEqual(report.hash, tree.hashAfterFetch);
});

// ---------------------------------------------------------------------------
// The clone stays as it was
// ---------------------------------------------------------------------------

test("CT-141-102: a clone on another branch with uncommitted changes stays as it was", () => {
  const source = clone();

  // Put the clone in the state the quickstart allows: another branch, checked
  // out, with uncommitted changes and an untracked file.
  git(source.dir, "checkout", "-q", "-b", "work-in-progress");
  writeFileSync(join(source.dir, "README.md"), "a local edit that is not committed\n");
  writeFileSync(join(source.dir, "scratch.txt"), "untracked\n");
  git(source.dir, "add", "scratch.txt");
  git(source.dir, "commit", "-q", "-m", "a commit the pin does not name");
  writeFileSync(join(source.dir, "lib/critic.py"), "print('edited')\n");

  const before = cloneState(source.dir);
  assert.deepEqual(cloneState(source.dir), before, "the record of the clone is stable on its own");
  assert.equal(before.branch, "work-in-progress");
  assert.notEqual(before.head, source.commit, "HEAD is not the pinned commit");
  assert.notEqual(before.status, "", "the clone has uncommitted changes");

  const scratch = temp("scratch-dirty");
  const tree = fetchReferenceTree({
    pin: { system: "specstride", commit: source.commit, tree: source.tree },
    cloneDir: source.dir,
    scratchRoot: scratch,
  });

  // Only the pinned commit counts: the tree is the pinned one, not what is
  // checked out (F141-FR-001, F141-FR-002).
  assert.equal(tree.tree, source.tree);
  assert.equal(readFileSync(join(tree.root, "README.md"), "utf8"), "the baseline\n");
  assert.equal(readFileSync(join(tree.root, "lib/critic.py"), "utf8"), "print('critic')\n");
  assert.equal(existsSync(join(tree.root, "scratch.txt")), false);

  // And the clone is exactly as it was: branch, HEAD, status, refs, stash,
  // local configuration and every byte of the working tree.
  assert.deepEqual(cloneState(source.dir), before);
});

test("CT-141-102: the fetch runs no git command that writes to a source repository", () => {
  for (const verb of FORBIDDEN_GIT_VERBS) {
    assert.throws(
      () => assertReadOnlyGitArgv([verb, "whatever"]),
      (error: unknown) =>
        error instanceof ReferenceTreeError &&
        // Refused as a verb that WRITES, and not merely as a verb the fetch
        // does not happen to use: the two refusals say different things, and
        // F141-FR-002 is about the first.
        new RegExp(`^git ${verb} writes to a source repository`).test((error as Error).message),
      `git ${verb} is refused as a verb that writes to a source repository`,
    );
  }
  // A read-only verb the fetch does not use is refused too, with the other
  // message. So the list above is doing the work, not this one.
  assert.throws(
    () => assertReadOnlyGitArgv(["log", "--oneline"]),
    (error: unknown) =>
      error instanceof ReferenceTreeError &&
      /is not one of the read-only verbs/.test((error as Error).message),
  );
  for (const verb of [
    "checkout",
    "branch",
    "worktree",
    "stash",
    "config",
    "reset",
    "add",
    "commit",
  ]) {
    assert.ok(FORBIDDEN_GIT_VERBS.includes(verb), `${verb} is on the forbidden list`);
  }
  // The two commands the fetch needs are allowed.
  assert.doesNotThrow(() => assertReadOnlyGitArgv(["rev-parse", "HEAD^{tree}"]));
  assert.doesNotThrow(() => assertReadOnlyGitArgv(["archive", "--format=tar", "abc"]));
});

// ---------------------------------------------------------------------------
// No cache of the interpreter
// ---------------------------------------------------------------------------

test("CT-141-102: no cache of the interpreter is in the tree, and one that appears fails the check", () => {
  const source = clone();
  const scratch = temp("scratch-cache");
  const tree = fetchReferenceTree({
    pin: { system: "specstride", commit: source.commit, tree: source.tree },
    cloneDir: source.dir,
    scratchRoot: scratch,
  });

  // The run sets the variable that keeps the interpreter from writing one.
  assert.equal(NO_BYTECODE_VARIABLE, "PYTHONDONTWRITEBYTECODE");
  assert.equal(tree.noBytecode[NO_BYTECODE_VARIABLE], "1");
  assert.ok(INTERPRETER_CACHE_NAMES.includes("__pycache__"));

  // Nothing of the kind is in the fetched tree.
  assert.deepEqual(assertNoInterpreterCache(tree.root), []);

  // One that appears fails the check, named with its path.
  execFileSync("chmod", ["-R", "u+w", tree.root]);
  mkdirSync(join(tree.root, "lib/__pycache__"));
  writeFileSync(join(tree.root, "lib/__pycache__/critic.cpython-311.pyc"), "\x00");
  assert.throws(
    () => assertNoInterpreterCache(tree.root, { throwOnFound: true }),
    (error: unknown) =>
      error instanceof ReferenceTreeError && /__pycache__/.test((error as Error).message),
    "a cache of the interpreter in the tree fails",
  );
  assert.deepEqual(assertNoInterpreterCache(tree.root), ["lib/__pycache__"]);
});

// ---------------------------------------------------------------------------
// The copy for a fixture with its own install-root file
// ---------------------------------------------------------------------------

test("CT-141-102: a fixture that tests the install-root layer gets a copy with its own file", () => {
  const source = clone();
  const scratch = temp("scratch-copy");
  const tree = fetchReferenceTree({
    pin: { system: "specstride", commit: source.commit, tree: source.tree },
    cloneDir: source.dir,
    scratchRoot: scratch,
  });

  const copyRoot = join(temp("copy"), "impl");
  const copy = copyTreeWithInstallRoot(tree, {
    destination: copyRoot,
    content: "SPECSTRIDE_MAX_ITER=2\n",
  });

  // The copy is a tree of its own, outside the reference tree, with the file.
  assert.equal(copy.root, copyRoot);
  assert.equal(resolve(copy.root).startsWith(resolve(tree.root)), false);
  assert.equal(copy.holdsInstallRoot, true);
  assert.equal(readFileSync(join(copy.root, INSTALL_ROOT_FILE), "utf8"), "SPECSTRIDE_MAX_ITER=2\n");
  // The content of the reference came with it.
  assert.equal(readFileSync(join(copy.root, "README.md"), "utf8"), "the baseline\n");
  assert.equal(readFileSync(join(copy.root, "lib/critic.py"), "utf8"), "print('critic')\n");
  // The copy is the fixture's own, so it is writable: the fixture adds the file.
  assert.equal(copy.readOnly, false);

  // The reference tree itself is untouched and still holds no install-root file.
  assert.equal(existsSync(join(tree.root, INSTALL_ROOT_FILE)), false);
  assert.equal(checkTreeUnchanged(tree).unchanged, true);
  assert.equal(isTreeReadOnly(tree.root), true);
});

// ---------------------------------------------------------------------------
// The copy with the as-is edits of a fixture (T131)
// ---------------------------------------------------------------------------

test("CT-141-102: a fixture's as-is edits run on a copy; the pinned tree is only read", () => {
  const source = clone();
  const scratch = temp("scratch-edits");
  const tree = fetchReferenceTree({
    pin: { system: "specstride", commit: source.commit, tree: source.tree },
    cloneDir: source.dir,
    scratchRoot: scratch,
  });
  const assets = temp("assets");
  mkdirSync(join(assets, "streams"), { recursive: true });
  writeFileSync(join(assets, "streams", "adapter.py"), "class A:\n    pass\n", "utf8");

  const edited = editedReferenceTree({
    referenceRoot: tree.root,
    destination: join(temp("edited"), "impl"),
    assetsDirectory: assets,
    edits: [
      {
        edit: "copy-asset",
        file: "lib/adapter.py",
        asset: "streams/adapter.py",
        why: "the adapter module the route names",
      },
      {
        edit: "insert-before",
        file: "lib/critic.py",
        marker: "print('critic')",
        text: "import adapter\n",
        why: "one import inside the seam block",
      },
      {
        edit: "replace",
        file: "README.md",
        find: "the baseline",
        text: "the baseline, routed",
        why: "the route of the registry entry",
      },
    ],
  });

  // The four edits landed, each exactly where the fixture named it.
  assert.equal(readFileSync(join(edited.root, "lib/adapter.py"), "utf8"), "class A:\n    pass\n");
  assert.equal(
    readFileSync(join(edited.root, "lib/critic.py"), "utf8"),
    "import adapter\nprint('critic')\n",
  );
  assert.equal(readFileSync(join(edited.root, "README.md"), "utf8"), "the baseline, routed\n");
  assert.equal(edited.applied.length, 3);

  // And the PINNED tree is byte for byte what it was, and still read-only
  // (F141-FR-002): the edits never reach it.
  assert.equal(readFileSync(join(tree.root, "README.md"), "utf8"), "the baseline\n");
  assert.equal(readFileSync(join(tree.root, "lib/critic.py"), "utf8"), "print('critic')\n");
  assert.equal(existsSync(join(tree.root, "lib/adapter.py")), false);
  assert.equal(checkTreeUnchanged(tree).unchanged, true);
  assert.equal(isTreeReadOnly(tree.root), true);
});

test("CT-141-102: an edit that matches nothing, twice, or leaves the tree is refused", () => {
  const source = clone();
  const scratch = temp("scratch-edits-refused");
  const tree = fetchReferenceTree({
    pin: { system: "specstride", commit: source.commit, tree: source.tree },
    cloneDir: source.dir,
    scratchRoot: scratch,
  });
  const assets = temp("assets-refused");
  mkdirSync(assets, { recursive: true });

  let n = 0;
  const refused = (
    edits: { edit: string; file: string; why: string; [key: string]: unknown }[],
    message: RegExp,
  ): void => {
    n += 1;
    assert.throws(
      () =>
        editedReferenceTree({
          referenceRoot: tree.root,
          destination: join(temp(`refused-${String(n)}`), "impl"),
          assetsDirectory: assets,
          edits: edits as never,
        }),
      (error: unknown) =>
        error instanceof ReferenceEditError && message.test((error as Error).message),
      `edit ${String(n)}`,
    );
  };

  // An edit that matches nothing would capture the UNEDITED behaviour, which is
  // the one failure a golden capture could not be told from a real one.
  refused(
    [{ edit: "replace", file: "README.md", find: "no such text", text: "x", why: "w" }],
    /occurs 0 times and must occur exactly once/,
  );
  // An edit that matches twice would depend on which occurrence came first.
  refused(
    [{ edit: "replace", file: "lib/critic.py", find: "t", text: "x", why: "w" }],
    /must occur exactly once/,
  );
  // No edit leaves the tree, and no edit names an absolute path.
  refused(
    [{ edit: "remove", file: "../outside", why: "w" }],
    /is no relative path inside the tree/,
  );
  refused([{ edit: "remove", file: "/etc/passwd", why: "w" }], /is no relative path/);
  // A file that is not there cannot be removed: removing it would change nothing.
  refused([{ edit: "remove", file: "lib/not-there.py", why: "w" }], /is not in the reference tree/);
  // A copied file is an IMPORTED ASSET with its licence notice, never a file the
  // fixture invents (F141-FR-012).
  refused(
    [{ edit: "copy-asset", file: "lib/x.py", asset: "not-imported.py", why: "w" }],
    /is not under fixtures\/assets\//,
  );
  // An unknown verb, and a verb that names no text.
  refused([{ edit: "rewrite", file: "README.md", why: "w" }], /is no edit of the reference tree/);
  refused([{ edit: "insert-before", file: "README.md", why: "w" }], /names no marker text/);
  assert.equal(n, 8);

  // Nothing of the eight reached the pinned tree.
  assert.equal(checkTreeUnchanged(tree).unchanged, true);
  assert.equal(isTreeReadOnly(tree.root), true);
});

test("CT-141-102: the copy of the edits never lies inside the reference tree", () => {
  const source = clone();
  const scratch = temp("scratch-edits-inside");
  const tree = fetchReferenceTree({
    pin: { system: "specstride", commit: source.commit, tree: source.tree },
    cloneDir: source.dir,
    scratchRoot: scratch,
  });
  assert.throws(
    () =>
      editedReferenceTree({
        referenceRoot: tree.root,
        destination: join(tree.root, "copy"),
        assetsDirectory: temp("assets-inside"),
        edits: [{ edit: "remove", file: "README.md", why: "w" }],
      }),
    (error: unknown) =>
      error instanceof ReferenceEditError &&
      /a fixture never changes the reference tree \(F141-FR-002\)/.test((error as Error).message),
  );
  assert.equal(checkTreeUnchanged(tree).unchanged, true);
});

test("CT-141-102: `referenceEdits` is read off the declaration, and only the reference takes it", () => {
  assert.deepEqual([...referenceEditsOf({})], []);
  assert.deepEqual([...REFERENCE_EDIT_VERBS], ["insert-before", "replace", "copy-asset", "remove"]);
  const one = referenceEditsOf({
    referenceEdits: [{ edit: "remove", file: "lib/agent_stream.py", why: "the tap is gone" }],
  });
  assert.equal(one.length, 1);
  assert.equal(one[0]?.edit, "remove");
  // A declared field that holds no edit is a mistake, not an empty list.
  for (const bad of [[], "x", {}]) {
    assert.throws(
      () => referenceEditsOf({ referenceEdits: bad }),
      (error: unknown) =>
        error instanceof ReferenceEditError && /no non-empty list/.test((error as Error).message),
    );
  }
});
