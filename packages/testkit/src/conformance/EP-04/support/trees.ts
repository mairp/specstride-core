/**
 * T009 — the scripted trees for the tree-store conformance (CT-143-129,
 * F143-FR-001; R29 PU-19, "Service conformance with scripted trees").
 *
 * WHAT A SCRIPTED TREE IS. A tree written down as data — paths, bytes, modes,
 * links, ignore rules, attributes — so that the conformance of the tree-store
 * service is run over a workspace WHOSE EVERY BYTE IS KNOWN IN ADVANCE. The
 * cases are not a sample of a real project; each one is in the catalogue
 * because a requirement of feature 143 is about it:
 *
 *  - `plain`           the ordinary case: nested paths, an executable bit,
 *                      a symbolic link, bytes with no final newline.
 *  - `hostile-filters` AN ATTRIBUTES FILE THAT NAMES A FILTER AND A
 *                      CONVERSION OF LINE ENDS (F143-FR-004): the tree whose
 *                      snapshot must start no process and give equal bytes.
 *  - `ignored-and-seeded` ignored paths and seed paths, which a delta never
 *                      holds (F143-FR-007).
 *  - `workspace-part`  a workspace part, which a snapshot never covers
 *                      (F143-FR-003), and a task list, which is in every
 *                      snapshot and in no delta (F143-FR-008).
 *  - `awkward-names`   a space, a quotation mark, an accent and bytes that
 *                      are not text, so that no operation may depend on a
 *                      path being a tidy word.
 *
 * WHAT ELSE IS HERE. A tree store built over the scripted trees,
 * `scriptedTreeStore()`. The conformance suite is a statement about ANY
 * implementation of `specstride.tree-store/1`, and it needs at least one
 * that really moves bytes, or the rule "no operation writes a workspace path
 * outside `apply`" would pass on an implementation that writes nothing at
 * all. This one runs the real `git` executable through the ONE PLACE THAT
 * STARTS IT, `packages/tree-store/src/git.ts` (T007), so the conformance
 * drives the product's hardened door and not a second copy of it. The
 * product's own service registers in the same suite at T027.
 */
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { runGit, tryGit, FIXED_COMMIT } from "@specstride/tree-store/git";
import { firstOverlap, COMPOSE_REFUSAL_REASON } from "@specstride/contracts/ep/tree-store";
import type {
  AuditedDelta,
  ChangeKind,
  ChangedPath,
  ComposeResult,
  TreeId,
  TreeStoreService,
  WorkerTree,
} from "@specstride/contracts/ep/tree-store";

/* ------------------------------------------------------------------ *
 * The scripted trees.
 * ------------------------------------------------------------------ */

/** The workspace part (annex B, §B.2). A snapshot never covers it. */
export const WORKSPACE_PART = ".specstride" as const;

/** One entry of a scripted tree. */
export type ScriptedEntry = {
  readonly path: string;
  /** The bytes, written exactly as given. */
  readonly bytes: string;
  /** `true` where the file is executable. */
  readonly executable?: boolean;
  /** When set, the entry is a symbolic link to this target and `bytes` is unused. */
  readonly symlinkTo?: string;
  /** `true` where the path is ignored by the rules of the tree. */
  readonly ignored?: boolean;
  /** `true` where the path is a seed path, copied in and never in a delta. */
  readonly seed?: boolean;
  /** `true` where the path is committed; otherwise it is left uncommitted. */
  readonly committed?: boolean;
};

/** One scripted tree. */
export type ScriptedTree = {
  readonly name: string;
  /** Why the case is in the catalogue. */
  readonly why: string;
  readonly entries: readonly ScriptedEntry[];
  /** The lines of the ignore file of the tree, if it has one. */
  readonly ignoreRules?: readonly string[];
  /** The lines of the attributes file of the tree, if it has one. */
  readonly attributes?: readonly string[];
};

const NOT_TEXT = "\u0000\u0001ÿ binary \u0000 bytes\n";

/** The catalogue. Every case is named by the requirement it serves. */
export const SCRIPTED_TREES: readonly ScriptedTree[] = Object.freeze([
  Object.freeze({
    name: "plain",
    why: "the ordinary case: nested paths, an executable bit, a link, no final newline",
    entries: Object.freeze([
      Object.freeze({ path: "README.md", bytes: "# a project\n", committed: true }),
      Object.freeze({ path: "src/one.ts", bytes: "export const one = 1;\n", committed: true }),
      Object.freeze({ path: "src/deep/two.ts", bytes: "export const two = 2;", committed: true }),
      Object.freeze({
        path: "bin/run.sh",
        bytes: "#!/bin/sh\nexit 0\n",
        executable: true,
        committed: true,
      }),
      Object.freeze({ path: "link-to-readme", bytes: "", symlinkTo: "README.md", committed: true }),
      Object.freeze({ path: "notes/uncommitted.md", bytes: "not committed yet\n" }),
    ]),
  }),
  Object.freeze({
    name: "hostile-filters",
    why: "F143-FR-004: an attributes file that names a filter and a conversion of line ends",
    attributes: Object.freeze(["* filter=mangle", "*.txt text eol=crlf", "*.bin -text binary"]),
    entries: Object.freeze([
      Object.freeze({ path: "crlf.txt", bytes: "one\r\ntwo\r\n", committed: true }),
      Object.freeze({ path: "lf.txt", bytes: "one\ntwo\n", committed: true }),
      Object.freeze({ path: "aaa.txt", bytes: "aaa\n", committed: true }),
      Object.freeze({ path: "raw.bin", bytes: NOT_TEXT, committed: true }),
    ]),
  }),
  Object.freeze({
    name: "ignored-and-seeded",
    why: "F143-FR-007: seed paths are copied in and ignored paths stay absent; neither is in a delta",
    ignoreRules: Object.freeze(["build/", "*.log", ".env"]),
    entries: Object.freeze([
      Object.freeze({ path: "src/app.ts", bytes: "export const app = 1;\n", committed: true }),
      Object.freeze({ path: "build/out.js", bytes: "// built\n", ignored: true }),
      Object.freeze({ path: "debug.log", bytes: "noise\n", ignored: true }),
      Object.freeze({ path: ".env", bytes: "SECRET=never-in-a-tree\n", ignored: true }),
      Object.freeze({ path: "node_modules_stub/dep.js", bytes: "// a seed\n", seed: true }),
    ]),
  }),
  Object.freeze({
    name: "workspace-part",
    why: "F143-FR-003 and F143-FR-008: the workspace part is outside a snapshot; the task list is in it",
    entries: Object.freeze([
      Object.freeze({ path: "src/kept.ts", bytes: "export const kept = 1;\n", committed: true }),
      Object.freeze({ path: "tasks.md", bytes: "- [ ] T100\n- [ ] T101\n", committed: true }),
      Object.freeze({
        path: `${WORKSPACE_PART}/features/143/handoff.json`,
        bytes: '{"task":"T100"}\n',
      }),
      Object.freeze({ path: `${WORKSPACE_PART}/run/ledger.jsonl`, bytes: "{}\n" }),
    ]),
  }),
  Object.freeze({
    name: "awkward-names",
    why: "no operation may depend on a path being a tidy word",
    entries: Object.freeze([
      Object.freeze({ path: "a file with spaces.md", bytes: "spaces\n", committed: true }),
      Object.freeze({ path: 'quote"inside.md', bytes: "quote\n", committed: true }),
      Object.freeze({ path: "accentué/café.md", bytes: "café\n", committed: true }),
      Object.freeze({ path: "data/raw.bin", bytes: NOT_TEXT, committed: true }),
    ]),
  }),
]);

/** One scripted tree by name. */
export function scriptedTree(name: string): ScriptedTree {
  const found = SCRIPTED_TREES.find((t) => t.name === name);
  if (found === undefined) throw new Error(`no scripted tree \`${name}\``);
  return found;
}

/** The paths of a scripted tree a delta may ever hold (F143-FR-007). */
export function deltaPathsOf(tree: ScriptedTree): readonly string[] {
  return Object.freeze(
    tree.entries
      .filter((e) => e.ignored !== true && e.seed !== true)
      .map((e) => e.path)
      .filter((p) => p !== WORKSPACE_PART && !p.startsWith(`${WORKSPACE_PART}/`))
      .sort(),
  );
}

/**
 * Write a scripted tree into `directory` as a WORKSPACE: a repository with
 * the committed entries committed, the rest left as they are, and the
 * ignored ones really ignored. Returns the paths written.
 */
export function writeScriptedTree(directory: string, tree: ScriptedTree): readonly string[] {
  mkdirSync(directory, { recursive: true });
  runGit({ argv: ["init", "--quiet", "."], cwd: directory });
  if (tree.ignoreRules !== undefined) {
    writeFileSync(join(directory, ".gitignore"), tree.ignoreRules.join("\n") + "\n");
  }
  if (tree.attributes !== undefined) {
    writeFileSync(join(directory, ".gitattributes"), tree.attributes.join("\n") + "\n");
  }
  const written: string[] = [];
  for (const entry of tree.entries) {
    const full = join(directory, entry.path);
    mkdirSync(dirname(full), { recursive: true });
    if (entry.symlinkTo !== undefined) {
      if (!existsSync(full)) symlinkSync(entry.symlinkTo, full);
    } else {
      writeFileSync(full, Buffer.from(entry.bytes, "binary"));
      if (entry.executable === true) chmodSync(full, 0o755);
    }
    written.push(entry.path);
  }
  const committed = tree.entries.filter((e) => e.committed === true).map((e) => e.path);
  if (tree.ignoreRules !== undefined) committed.push(".gitignore");
  if (tree.attributes !== undefined) committed.push(".gitattributes");
  if (committed.length > 0) {
    runGit({ argv: ["add", "--", ...committed], cwd: directory });
    runGit({ argv: ["commit", "-q", "-m", "the scripted tree"], cwd: directory });
  }
  return Object.freeze(written.sort());
}

/* ------------------------------------------------------------------ *
 * Reading a directory back.
 * ------------------------------------------------------------------ */

export function sha256(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** One entry of a digest: the content and the mode, and nothing of the clock. */
export type DigestEntry = { readonly sha256: string; readonly mode: string };

/**
 * The hash and the mode of every file under a directory, by path relative to
 * it. NO MODIFICATION TIME IS READ, so two digests that differ mean a byte or
 * a mode really changed. A link is recorded by its target.
 */
export function digestOfDirectory(
  directory: string,
  skip: (relativePath: string) => boolean = () => false,
): Record<string, DigestEntry> {
  const out: Record<string, DigestEntry> = {};
  if (!existsSync(directory)) return out;
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : 1,
    )) {
      const full = join(dir, entry.name);
      const rel = relative(directory, full).split(sep).join("/");
      if (skip(rel)) continue;
      if (entry.isDirectory()) walk(full);
      else if (entry.isSymbolicLink())
        out[rel] = { sha256: sha256(readlinkSync(full)), mode: "120000" };
      else if (entry.isFile()) {
        const stat = lstatSync(full);
        out[rel] = {
          sha256: sha256(readFileSync(full)),
          mode: (stat.mode & 0o111) !== 0 ? "100755" : "100644",
        };
      }
    }
  };
  walk(directory);
  return out;
}

/** True where the path is under the repository directory of a workspace. */
export function isRepositoryPath(relativePath: string): boolean {
  return relativePath === ".git" || relativePath.startsWith(".git/");
}

/** The digest of a workspace, less its repository directory. */
export function digestOfWorkspace(directory: string): Record<string, DigestEntry> {
  return digestOfDirectory(directory, isRepositoryPath);
}

/** The digest of the repository directory of a workspace, on its own. */
export function digestOfRepository(directory: string): Record<string, DigestEntry> {
  return digestOfDirectory(join(directory, ".git"));
}

/* ------------------------------------------------------------------ *
 * A tree store over the scripted trees.
 * ------------------------------------------------------------------ */

/** The places a scripted store keeps things. */
export type ScriptedStorePlaces = {
  /** The root of everything the store owns. */
  readonly root: string;
  /** The store: a repository of the runtime, outside the project's. */
  readonly store: string;
  /** The worker root, under which worker trees are made. */
  readonly workerRoot: string;
  /** The control plane, which holds the temporary index files. */
  readonly control: string;
};

/** Make the places of a store, under a fresh temporary root. */
export function scriptedStorePlaces(prefix = "specstride-143-ct129-"): ScriptedStorePlaces {
  const root = mkdtempSync(join(tmpdir(), prefix));
  const places: ScriptedStorePlaces = {
    root,
    store: join(root, "tree-store"),
    workerRoot: join(root, "worker-root"),
    control: join(root, "control"),
  };
  mkdirSync(places.workerRoot, { recursive: true });
  mkdirSync(places.control, { recursive: true });
  mkdirSync(places.store, { recursive: true });
  runGit({ argv: ["init", "--bare", "--quiet", places.store], cwd: root });
  return places;
}

type TreeEntry = { readonly mode: string; readonly oid: string; readonly path: string };

/**
 * A tree store over the scripted trees: the seven operations of annex D
 * §D.2 and no other, over real objects of a real repository, driven through
 * the one place that starts git.
 */
export function scriptedTreeStore(places: ScriptedStorePlaces): TreeStoreService {
  let indexOrdinal = 0;
  const workerTrees = new Map<string, WorkerTree>();

  const inStore = (argv: readonly string[], extra: { stdin?: Uint8Array | string } = {}) =>
    runGit({ argv, cwd: places.store, gitDir: places.store, ...extra });

  const withIndex = (argv: readonly string[], indexFile: string, stdin?: Uint8Array | string) =>
    runGit({ argv, cwd: places.store, gitDir: places.store, indexFile, stdin });

  const freshIndex = (): string => join(places.control, `index-${String(++indexOrdinal)}`);

  /** The blobs of a tree, recursively. */
  const listTree = (treeId: TreeId): readonly TreeEntry[] =>
    inStore(["ls-tree", "-r", "-z", "--full-tree", treeId])
      .stdout.split("\0")
      .filter((line) => line !== "")
      .map((line) => {
        const tab = line.indexOf("\t");
        const [mode, , oid] = line.slice(0, tab).split(" ");
        return { mode: String(mode), oid: String(oid), path: line.slice(tab + 1) };
      });

  /** Read one blob of the store as bytes. */
  const readBlob = (oid: string): Buffer =>
    Buffer.from(inStore(["cat-file", "blob", oid]).stdoutBytes);

  /**
   * The fingerprint scope: tracked files with their uncommitted changes and
   * untracked files that are not ignored, less the workspace part
   * (F143-FR-003). `ls-files` is a pure read of the project's index.
   */
  const fingerprintScope = (workspace: string): readonly string[] => {
    const out = runGit({
      argv: ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
      cwd: workspace,
    }).stdout;
    return [...new Set(out.split("\0").filter((p) => p !== ""))]
      .filter((p) => p !== WORKSPACE_PART && !p.startsWith(`${WORKSPACE_PART}/`))
      .sort();
  };

  /** The bytes on disk, stored with no filter and no conversion. */
  const storeBytes = (bytes: Uint8Array): string =>
    inStore(["hash-object", "-w", "--no-filters", "--stdin"], { stdin: bytes }).stdout.trim();

  const writeTreeFrom = (lines: readonly string[]): TreeId => {
    const indexFile = freshIndex();
    withIndex(
      ["update-index", "--index-info"],
      indexFile,
      lines.length === 0 ? "" : lines.join("\n") + "\n",
    );
    return withIndex(["write-tree"], indexFile).stdout.trim();
  };

  return {
    /** 1 `snapshot(directory) → treeId`. Writes the store and nothing else. */
    snapshot(directory: string): Promise<TreeId> {
      const lines: string[] = [];
      for (const path of fingerprintScope(directory)) {
        const full = join(directory, path);
        const stat = lstatSync(full);
        if (stat.isSymbolicLink()) {
          lines.push(`120000 ${storeBytes(Buffer.from(readlinkSync(full)))}\t${path}`);
          continue;
        }
        const mode = (stat.mode & 0o111) !== 0 ? "100755" : "100644";
        lines.push(`${mode} ${storeBytes(readFileSync(full))}\t${path}`);
      }
      const treeId = writeTreeFrom(lines);
      // The store commit: fixed author, date and message (F143-FR-003).
      inStore(["commit-tree", treeId, "-m", FIXED_COMMIT.message]);
      return Promise.resolve(treeId);
    },

    /** 2 `materialize(treeId, workerId) → worker tree`. Writes the worker root. */
    materialize(treeId: TreeId, workerId: string): Promise<WorkerTree> {
      // Every object of the tree is present before a tree is made
      // (F143-FR-003); a missing one refuses rather than makes half a tree.
      for (const entry of listTree(treeId)) {
        if (
          tryGit({ argv: ["cat-file", "-e", entry.oid], cwd: places.store, gitDir: places.store })
            .status !== 0
        ) {
          return Promise.reject(new Error(`the object ${entry.oid} of ${treeId} is missing`));
        }
      }
      const opaque = sha256(`${workerId}:${treeId}:${String(workerTrees.size)}`).slice(0, 32);
      const path = join(places.workerRoot, opaque, "tree");
      mkdirSync(path, { recursive: true, mode: 0o700 });
      mkdirSync(join(places.workerRoot, opaque, "tmp"), { recursive: true, mode: 0o700 });
      for (const entry of listTree(treeId)) {
        const target = join(path, entry.path);
        mkdirSync(dirname(target), { recursive: true });
        const bytes = readBlob(entry.oid);
        if (entry.mode === "120000") {
          if (!existsSync(target)) symlinkSync(bytes.toString("utf8"), target);
          continue;
        }
        // By temporary name and rename: no checkout, so no attribute of the
        // tree can start a filter (research.md D-4).
        const temporary = `${target}.tree-store-tmp`;
        writeFileSync(temporary, bytes, { mode: entry.mode === "100755" ? 0o755 : 0o644 });
        renameSync(temporary, target);
      }
      // A repository of the tree's own, borrowing the store read-only.
      runGit({ argv: ["init", "--quiet", path], cwd: places.workerRoot });
      const info = join(path, ".git", "objects", "info");
      mkdirSync(info, { recursive: true });
      writeFileSync(join(info, "alternates"), join(places.store, "objects") + "\n");
      const tree: WorkerTree = Object.freeze({ workerId, path, treeId });
      workerTrees.set(workerId, tree);
      return Promise.resolve(tree);
    },

    /** 3 `changed(base, tree) → paths with kind`. Writes nothing. */
    changed(baseTreeId: TreeId, treeId: TreeId): Promise<readonly ChangedPath[]> {
      const raw = inStore([
        "diff-tree",
        "-r",
        "-z",
        "--raw",
        "--no-renames",
        baseTreeId,
        treeId,
      ]).stdout;
      const fields = raw.split("\0").filter((f) => f !== "");
      const out: ChangedPath[] = [];
      for (let i = 0; i + 1 < fields.length; i += 2) {
        // `:<oldmode> <newmode> <oldoid> <newoid> <status>`
        const head = String(fields[i]).replace(/^:/, "").split(" ");
        const [oldMode, newMode, oldOid, newOid, status] = head;
        const path = String(fields[i + 1]);
        let kind: ChangeKind;
        if (status === "A") kind = "added";
        else if (status === "D") kind = "deleted";
        else if (oldOid === newOid && oldMode !== newMode) kind = "mode changed";
        else kind = "changed";
        out.push(Object.freeze({ path, kind }));
      }
      return Promise.resolve(Object.freeze(out.sort((a, b) => (a.path < b.path ? -1 : 1))));
    },

    /** 4 `compose(base, deltas) → treeId or `overlap``. Writes the store. */
    compose(baseTreeId: TreeId, deltas: readonly AuditedDelta[]): Promise<ComposeResult> {
      const overlap = firstOverlap(deltas);
      if (overlap !== undefined) {
        return Promise.resolve(
          Object.freeze({
            composed: false as const,
            reason: COMPOSE_REFUSAL_REASON,
            paths: overlap.paths,
            workerId: overlap.workerId,
          }),
        );
      }
      // Composition and never a merge: the entries of the base are REPLACED
      // by the entries of each delta, in the order of the tasks at launch.
      const entries = new Map<string, TreeEntry>();
      for (const entry of listTree(baseTreeId)) entries.set(entry.path, entry);
      for (const delta of deltas) {
        const theirs = new Map(listTree(delta.treeId).map((e) => [e.path, e]));
        for (const path of delta.paths) {
          const entry = theirs.get(path);
          if (entry === undefined) entries.delete(path);
          else entries.set(path, entry);
        }
      }
      const lines = [...entries.values()]
        .sort((a, b) => (a.path < b.path ? -1 : 1))
        .map((e) => `${e.mode} ${e.oid}\t${e.path}`);
      return Promise.resolve(
        Object.freeze({ composed: true as const, treeId: writeTreeFrom(lines) }),
      );
    },

    /** 5 `apply(base, composed, workspace) → paths`. THE ONE THAT WRITES IT. */
    apply(baseTreeId: TreeId, composed: TreeId, workspace: string): Promise<readonly string[]> {
      const base = new Map(listTree(baseTreeId).map((e) => [e.path, e]));
      const now = new Map(listTree(composed).map((e) => [e.path, e]));
      const written: string[] = [];
      for (const [path, entry] of now) {
        const was = base.get(path);
        if (was !== undefined && was.oid === entry.oid && was.mode === entry.mode) continue;
        const target = join(workspace, path);
        mkdirSync(dirname(target), { recursive: true });
        const bytes = readBlob(entry.oid);
        if (entry.mode === "120000") {
          rmSync(target, { force: true });
          symlinkSync(bytes.toString("utf8"), target);
        } else {
          const temporary = `${target}.tree-store-tmp`;
          writeFileSync(temporary, bytes, { mode: entry.mode === "100755" ? 0o755 : 0o644 });
          renameSync(temporary, target);
        }
        written.push(path);
      }
      for (const path of base.keys()) {
        if (now.has(path)) continue;
        rmSync(join(workspace, path), { force: true });
        written.push(path);
      }
      return Promise.resolve(Object.freeze(written.sort()));
    },

    /** 6 `release(worker tree)`. Writes the worker root only. */
    release(tree: WorkerTree): Promise<void> {
      // The tree AND its temporary directory, which lies beside it
      // (F143-FR-027, F143-FR-009). The store keeps the snapshot.
      rmSync(dirname(tree.path), { recursive: true, force: true });
      workerTrees.delete(tree.workerId);
      return Promise.resolve();
    },

    /** 7 `sweep() → the trees removed`. Writes the worker root only. */
    sweep(): Promise<readonly TreeId[]> {
      const removed: TreeId[] = [];
      for (const name of readdirSync(places.workerRoot)) {
        const live = [...workerTrees.values()].some(
          (t) => t.path === join(places.workerRoot, name, "tree"),
        );
        if (live) continue;
        removed.push(name);
        rmSync(join(places.workerRoot, name), { recursive: true, force: true });
      }
      return Promise.resolve(Object.freeze(removed.sort()));
    },
  };
}

/** Remove everything a scripted store made. */
export function removeScriptedStore(places: ScriptedStorePlaces): void {
  rmSync(places.root, { recursive: true, force: true });
}
