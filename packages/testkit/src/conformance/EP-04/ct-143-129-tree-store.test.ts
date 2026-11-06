/**
 * T010 — CT-143-129, THE CONFORMANCE OF THE TREE-STORE SERVICE WITH SCRIPTED
 * TREES (F143-FR-001; R29 PU-19).
 *
 * Two things are proved, and they are different in kind:
 *
 *  A THE INTERFACE. A service of the point `specstride.tree-store/1` offers
 *    EXACTLY THE SEVEN OPERATIONS `snapshot`, `materialize`, `changed`,
 *    `compose`, `apply`, `release` and `sweep` and no other — no restore, no
 *    reset, no checkout — and of the seven only `apply` is declared to write
 *    a path of the workspace. This holds of every implementation and is
 *    checked over each one registered below.
 *
 *  B THE BEHAVIOUR. Over the scripted trees of
 *    `support/trees.ts`, every one of the seven operations is really run, and
 *    AROUND EVERY CALL THE WHOLE WORKSPACE IS DIGESTED, before and after. Six
 *    of the seven must leave every byte of it as it was; only `apply` may
 *    change it, and then only on the paths it returns. The digest is content
 *    and mode and reads no clock, so a difference means a byte really moved.
 *
 * Part B needs an implementation THAT REALLY MOVES BYTES, or the rule would
 * pass on one that writes nothing at all; `scriptedTreeStore()` is that
 * implementation, and it drives the real git executable through the one
 * place of the product that starts it. The in-memory sample of feature 100
 * takes part in A. The product's own service joins both at T027.
 *
 * The suite is exported, so an implementation added later is registered and
 * not re-written: `treeStoreInterfaceConformance` and
 * `treeStoreBehaviourConformance`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import {
  OPERATIONS_THE_STORE_DOES_NOT_OFFER,
  OPERATION_THAT_MAY_WRITE_THE_WORKSPACE,
  TREE_STORE_OPERATIONS,
  mayWriteTheWorkspace,
  offersExactlyTheSevenOperations,
  treeStoreOperationRows,
} from "@specstride/contracts/ep/tree-store";
import type { TreeStoreService } from "@specstride/contracts/ep/tree-store";
import { sampleTreeStore } from "../../samples/EP-04/index.ts";
import { treeStore as productTreeStore } from "@specstride/tree-store";
import {
  SCRIPTED_TREES,
  WORKSPACE_PART,
  deltaPathsOf,
  digestOfRepository,
  digestOfWorkspace,
  removeScriptedStore,
  scriptedStorePlaces,
  scriptedTree,
  scriptedTreeStore,
  sha256,
  writeScriptedTree,
  type ScriptedStorePlaces,
} from "./support/trees.ts";

/* ------------------------------------------------------------------ *
 * A — the interface. Every implementation.
 * ------------------------------------------------------------------ */

/** The seven operations and no other, over one implementation. */
export function treeStoreInterfaceConformance(label: string, make: () => TreeStoreService): void {
  test(`CT-143-129 [${label}] the service offers exactly the seven operations and only \`apply\` writes the workspace (F143-FR-001)`, () => {
    const store = make();
    assert.equal(offersExactlyTheSevenOperations(store), true);
    const offered = Object.keys(store).filter(
      (k) => typeof (store as unknown as Record<string, unknown>)[k] === "function",
    );
    assert.deepEqual(offered.sort(), [...TREE_STORE_OPERATIONS].sort());
    assert.equal(offered.length, 7);
    for (const absent of OPERATIONS_THE_STORE_DOES_NOT_OFFER) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(store, absent),
        false,
        `the store must not offer \`${absent}\``,
      );
    }
    // Of the seven, one writes the workspace, and the table of §D.2 agrees.
    assert.equal(OPERATION_THAT_MAY_WRITE_THE_WORKSPACE, "apply");
    for (const row of treeStoreOperationRows) {
      assert.equal(
        /workspace/i.test(row.writes),
        mayWriteTheWorkspace(row.operation),
        `${row.operation} writes ${row.writes}`,
      );
    }
    // And a wider interface is a different interface.
    assert.equal(offersExactlyTheSevenOperations({ ...store, restore: () => undefined }), false);
  });
}

/* ------------------------------------------------------------------ *
 * B — the behaviour, over the scripted trees.
 * ------------------------------------------------------------------ */

/** A workspace with a scripted tree in it, and the places of a store. */
type Bench = {
  readonly places: ScriptedStorePlaces;
  readonly workspace: string;
  readonly store: TreeStoreService;
};

/**
 * How an implementation of the point is built over the places of a store.
 * The suite is parameterized by it so that a second implementation is
 * REGISTERED and not written again: the scripted store of `support/trees.ts`
 * is the test kit's oracle, and the product's own service joins at T027.
 */
export type MakeOverPlaces = (places: ScriptedStorePlaces) => TreeStoreService;

function bench(treeName: string, make: MakeOverPlaces = scriptedTreeStore): Bench {
  const places = scriptedStorePlaces();
  const workspace = join(places.root, "workspace");
  writeScriptedTree(workspace, scriptedTree(treeName));
  return { places, workspace, store: make(places) };
}

function closeBench(b: Bench): void {
  removeScriptedStore(b.places);
}

/**
 * THE WATCHDOG. Run one operation with the whole workspace digested on
 * either side of the call, and report whether it changed. Nothing of the
 * operation is trusted: the answer comes from the file system.
 */
async function watching<T>(
  b: Bench,
  operation: string,
  run: () => Promise<T>,
): Promise<{
  readonly value: T;
  readonly changed: readonly string[];
  readonly repositoryChanged: boolean;
}> {
  const before = digestOfWorkspace(b.workspace);
  const repositoryBefore = digestOfRepository(b.workspace);
  const value = await run();
  const after = digestOfWorkspace(b.workspace);
  const repositoryAfter = digestOfRepository(b.workspace);
  const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((p) => JSON.stringify(before[p]) !== JSON.stringify(after[p]))
    .sort();
  assert.ok(operation.length > 0);
  return {
    value,
    changed,
    repositoryChanged: JSON.stringify(repositoryBefore) !== JSON.stringify(repositoryAfter),
  };
}

/** The seven operations over the scripted trees, with the watchdog. */
export function treeStoreBehaviourConformance(
  label: string,
  treeName: string,
  make: MakeOverPlaces = scriptedTreeStore,
): void {
  test(`CT-143-129 [${label}] the seven operations run over the scripted tree \`${treeName}\`, and no operation writes a workspace path outside \`apply\` (F143-FR-001)`, async () => {
    const b = bench(treeName, make);
    const ran = new Set<string>();
    try {
      /* 1 snapshot — writes the store. */
      const base = await watching(b, "snapshot", () => b.store.snapshot(b.workspace));
      ran.add("snapshot");
      assert.match(base.value, /^[0-9a-f]{40}$/, "a tree id of the store");
      assert.deepEqual(base.changed, [], "`snapshot` writes no path of the workspace");
      assert.equal(base.repositoryChanged, false, "and nothing under its repository directory");

      /* 2 materialize — writes the worker root. */
      const first = await watching(b, "materialize", () => b.store.materialize(base.value, "w-1"));
      ran.add("materialize");
      assert.deepEqual(first.changed, [], "`materialize` writes no path of the workspace");
      assert.equal(first.repositoryChanged, false);
      assert.ok(
        first.value.path.startsWith(b.places.workerRoot + "/"),
        "the tree lies under the worker root",
      );
      assert.equal(existsSync(join(first.value.path, ".git")), true, "a repository of its own");
      assert.match(
        readFileSync(join(first.value.path, ".git", "objects", "info", "alternates"), "utf8"),
        new RegExp(`^${b.places.store}/objects`),
        "which borrows the objects of the store",
      );

      // The worker works: one edit, by a path of this tree.
      const paths = deltaPathsOf(scriptedTree(treeName));
      const edited = String(paths[0]);
      writeFileSync(join(first.value.path, edited), "changed by w-1\n");
      const addedPath = "new/by-w-1.txt";
      mkdirSync(join(first.value.path, "new"), { recursive: true });
      writeFileSync(join(first.value.path, addedPath), "added by w-1\n");
      const final = await watching(b, "snapshot(final)", () => b.store.snapshot(first.value.path));
      assert.deepEqual(final.changed, [], "a final snapshot writes no path of the workspace");

      /* 3 changed — writes nothing. */
      const delta = await watching(b, "changed", () => b.store.changed(base.value, final.value));
      ran.add("changed");
      assert.deepEqual(delta.changed, [], "`changed` writes no path of the workspace");
      const byPath = new Map(delta.value.map((c) => [c.path, c.kind]));
      assert.equal(byPath.get(edited), "changed", `${edited} is changed`);
      assert.equal(byPath.get(addedPath), "added", `${addedPath} is added`);
      // The workspace part is in no snapshot, so it is in no delta either.
      for (const c of delta.value) {
        assert.equal(
          c.path === WORKSPACE_PART || c.path.startsWith(`${WORKSPACE_PART}/`),
          false,
          `${c.path} is the workspace part and belongs in no delta`,
        );
      }

      /* 4 compose — writes the store. */
      const composed = await watching(b, "compose", () =>
        b.store.compose(base.value, [
          { workerId: "w-1", treeId: final.value, paths: [edited, addedPath] },
        ]),
      );
      ran.add("compose");
      assert.deepEqual(composed.changed, [], "`compose` writes no path of the workspace");
      assert.equal(composed.value.composed, true);
      const composedTree = composed.value.composed ? composed.value.treeId : "";

      // And a second delta that shares a path is refused with `overlap`.
      const overlapping = await b.store.compose(base.value, [
        { workerId: "w-1", treeId: final.value, paths: [edited] },
        { workerId: "w-2", treeId: final.value, paths: [edited] },
      ]);
      assert.equal(overlapping.composed, false);
      if (!overlapping.composed) {
        assert.equal(overlapping.reason, "overlap");
        assert.equal(overlapping.workerId, "w-2");
        assert.deepEqual([...overlapping.paths], [edited]);
      }

      /* 5 apply — THE ONE OPERATION THAT MAY WRITE THE WORKSPACE. */
      const applied = await watching(b, "apply", () =>
        b.store.apply(base.value, composedTree, b.workspace),
      );
      ran.add("apply");
      assert.deepEqual([...applied.value].sort(), [addedPath, edited].sort());
      assert.deepEqual(
        applied.changed,
        [...applied.value].sort(),
        "`apply` changed exactly the paths it returned, and no other",
      );
      assert.equal(
        applied.repositoryChanged,
        false,
        "and still nothing under the project's repository directory (F143-FR-002)",
      );
      assert.equal(readFileSync(join(b.workspace, edited), "utf8"), "changed by w-1\n");
      assert.equal(readFileSync(join(b.workspace, addedPath), "utf8"), "added by w-1\n");

      /* 6 release — writes the worker root only. */
      const released = await watching(b, "release", () => b.store.release(first.value));
      ran.add("release");
      assert.deepEqual(released.changed, [], "`release` writes no path of the workspace");
      assert.equal(existsSync(first.value.path), false, "the tree is gone");
      assert.equal(existsSync(dirname(first.value.path)), false, "and its temporary directory");
      // A snapshot leaves the store with `sweep` and never with `release`.
      const stillThere = spawnSync("git", ["cat-file", "-t", base.value], {
        cwd: b.places.store,
        env: { ...process.env, GIT_DIR: b.places.store },
        encoding: "utf8",
      });
      assert.equal(stillThere.stdout.trim(), "tree", "`release` leaves the snapshot in the store");

      /* 7 sweep — writes the worker root only. */
      const second = await b.store.materialize(base.value, "w-2");
      // An orphan: a tree whose worker the store no longer knows.
      mkdirSync(join(b.places.workerRoot, "orphan", "tree"), { recursive: true });
      const swept = await watching(b, "sweep", () => b.store.sweep());
      ran.add("sweep");
      assert.deepEqual(swept.changed, [], "`sweep` writes no path of the workspace");
      assert.ok([...swept.value].includes("orphan"), "the orphan is swept");
      assert.equal(existsSync(join(b.places.workerRoot, "orphan")), false);
      assert.equal(existsSync(second.path), true, "a live tree is not swept");

      /* Every one of the seven really ran. */
      assert.deepEqual([...ran].sort(), [...TREE_STORE_OPERATIONS].sort());
    } finally {
      closeBench(b);
    }
  });
}

/* ------------------------------------------------------------------ *
 * The registrations.
 * ------------------------------------------------------------------ */

treeStoreInterfaceConformance("the sample of feature 100", () => sampleTreeStore());
treeStoreInterfaceConformance("the scripted store", () => {
  const places = scriptedStorePlaces("specstride-143-ct129-iface-");
  const store = scriptedTreeStore(places);
  removeScriptedStore(places);
  return store;
});

for (const tree of SCRIPTED_TREES) {
  treeStoreBehaviourConformance("the scripted store", tree.name);
}

/*
 * T027 — THE PRODUCT'S OWN SERVICE, `treeStore()` of `@specstride/tree-store`.
 * It joins both parts of the suite by registration, which is what the suite
 * was parameterized for: the interface rule of part A and the watchdog of
 * part B run over it unchanged, over every scripted tree.
 */
treeStoreInterfaceConformance("the product's service", () => {
  const places = scriptedStorePlaces("specstride-143-ct129-product-iface-");
  const store = productTreeStore(places);
  removeScriptedStore(places);
  return store;
});

for (const tree of SCRIPTED_TREES) {
  treeStoreBehaviourConformance("the product's service", tree.name, (places) =>
    productTreeStore(places),
  );
}

/* ------------------------------------------------------------------ *
 * The hostile tree, with its control (F143-FR-004).
 * ------------------------------------------------------------------ */

test("CT-143-129 a tree whose attributes file names a filter starts no process, and the bytes are equal (F143-FR-004)", async () => {
  const b = bench("hostile-filters");
  const marker = join(b.places.root, "FILTER-RAN");
  try {
    // The filter is DEFINED IN THE WORKSPACE'S OWN REPOSITORY — the one
    // source of configuration that removing the system and the global
    // configuration cannot reach — and it writes a marker when it runs.
    const filter = join(b.places.root, "mangle.sh");
    writeFileSync(filter, `#!/bin/sh\necho ran > ${marker}\nsed s/a/Z/g\n`);
    chmodSync(filter, 0o755);
    spawnSync("git", ["config", "filter.mangle.clean", filter], { cwd: b.workspace });

    const bytes = readFileSync(join(b.workspace, "aaa.txt"));
    assert.equal(bytes.toString("utf8"), "aaa\n");

    // THE CONTROL: a plain git in that workspace runs the filter.
    const control = spawnSync("git", ["hash-object", "--path", "aaa.txt", "aaa.txt"], {
      cwd: b.workspace,
      encoding: "utf8",
    });
    assert.equal(control.status, 0, control.stderr);
    assert.equal(existsSync(marker), true, "the control shows the filter was there to run");
    rmSync(marker, { force: true });

    // The store: a snapshot starts no process of the filter...
    const treeId = await b.store.snapshot(b.workspace);
    assert.equal(existsSync(marker), false, "a snapshot starts no process (F143-FR-004)");

    // ...and the bytes it stored are the bytes on disk, every file of them.
    const materialized = await b.store.materialize(treeId, "w-1");
    assert.equal(existsSync(marker), false, "and neither does `materialize`");
    for (const entry of scriptedTree("hostile-filters").entries) {
      const fromTheTree = readFileSync(join(materialized.path, entry.path));
      const fromTheWorkspace = readFileSync(join(b.workspace, entry.path));
      assert.equal(
        sha256(fromTheTree),
        sha256(fromTheWorkspace),
        `${entry.path}: equal bytes, with no conversion of line ends`,
      );
    }
    // The CRLF file still holds its carriage returns, and the LF file none.
    assert.equal(readFileSync(join(materialized.path, "crlf.txt"), "utf8"), "one\r\ntwo\r\n");
    assert.equal(readFileSync(join(materialized.path, "lf.txt"), "utf8"), "one\ntwo\n");

    // And the application writes the stored bytes back, still unfiltered.
    writeFileSync(join(materialized.path, "aaa.txt"), "aaa aaa\n");
    const final = await b.store.snapshot(materialized.path);
    const composed = await b.store.compose(treeId, [
      { workerId: "w-1", treeId: final, paths: ["aaa.txt"] },
    ]);
    assert.equal(composed.composed, true);
    if (composed.composed) await b.store.apply(treeId, composed.treeId, b.workspace);
    assert.equal(existsSync(marker), false, "`apply` starts no process either");
    assert.equal(readFileSync(join(b.workspace, "aaa.txt"), "utf8"), "aaa aaa\n");
  } finally {
    closeBench(b);
  }
});

/* ------------------------------------------------------------------ *
 * What a snapshot covers (F143-FR-003, F143-FR-007, F143-FR-008).
 * ------------------------------------------------------------------ */

test("CT-143-129 a snapshot covers the fingerprint scope less the workspace part, and an ignored path is in no tree", async () => {
  for (const name of ["workspace-part", "ignored-and-seeded"]) {
    const b = bench(name);
    try {
      const treeId = await b.store.snapshot(b.workspace);
      const tree = await b.store.materialize(treeId, "w-1");
      const inTheTree = new Set(
        Object.keys(digestOfWorkspace(tree.path)).filter((p) => !p.startsWith(".git/")),
      );
      for (const entry of scriptedTree(name).entries) {
        const isWorkspacePart =
          entry.path === WORKSPACE_PART || entry.path.startsWith(`${WORKSPACE_PART}/`);
        if (isWorkspacePart) {
          assert.equal(inTheTree.has(entry.path), false, `${entry.path}: the workspace part`);
        } else if (entry.ignored === true) {
          assert.equal(inTheTree.has(entry.path), false, `${entry.path}: ignored`);
        } else {
          assert.equal(inTheTree.has(entry.path), true, `${entry.path}: in the snapshot`);
        }
      }
      // The task list is in the snapshot (F143-FR-008).
      if (name === "workspace-part") assert.equal(inTheTree.has("tasks.md"), true);
    } finally {
      closeBench(b);
    }
  }
});

/* ------------------------------------------------------------------ *
 * The kinds of a changed path (annex D, §D.2).
 * ------------------------------------------------------------------ */

test("CT-143-129 `changed` names every kind of change and detects no rename", async () => {
  const b = bench("plain");
  try {
    const base = await b.store.snapshot(b.workspace);
    const tree = await b.store.materialize(base, "w-1");
    writeFileSync(join(tree.path, "src/one.ts"), "export const one = 11;\n");
    writeFileSync(join(tree.path, "added.ts"), "export const added = 1;\n");
    rmSync(join(tree.path, "README.md"), { force: true });
    chmodSync(join(tree.path, "src/deep/two.ts"), 0o755);
    // A rename: the same bytes under a new name, the old one gone.
    const moved = readFileSync(join(tree.path, "notes/uncommitted.md"));
    writeFileSync(join(tree.path, "notes/moved.md"), moved);
    rmSync(join(tree.path, "notes/uncommitted.md"), { force: true });

    const final = await b.store.snapshot(tree.path);
    const delta = await b.store.changed(base, final);
    const byPath = new Map(delta.map((c) => [c.path, c.kind]));
    assert.equal(byPath.get("src/one.ts"), "changed");
    assert.equal(byPath.get("added.ts"), "added");
    assert.equal(byPath.get("README.md"), "deleted");
    assert.equal(byPath.get("src/deep/two.ts"), "mode changed");
    assert.equal(lstatSync(join(tree.path, "src/deep/two.ts")).mode & 0o111 ? "x" : "-", "x");
    // No rename is detected: the move is an addition and a deletion.
    assert.equal(byPath.get("notes/moved.md"), "added");
    assert.equal(byPath.get("notes/uncommitted.md"), "deleted");
    assert.equal(
      delta.every((c) => !("from" in c)),
      true,
      "no kind of a rename exists",
    );
  } finally {
    closeBench(b);
  }
});

/* ------------------------------------------------------------------ *
 * The worker root (F143-FR-005).
 * ------------------------------------------------------------------ */

test("CT-143-129 a worker tree lies under the worker root behind one opaque component, owner only", async () => {
  const b = bench("plain");
  try {
    const base = await b.store.snapshot(b.workspace);
    const one = await b.store.materialize(base, "w-1");
    const two = await b.store.materialize(base, "w-2");
    const opaque = (path: string): string =>
      path.slice(b.places.workerRoot.length + 1).split("/")[0] as string;
    assert.notEqual(opaque(one.path), opaque(two.path), "one opaque component per worker");
    for (const path of [one.path, two.path]) {
      const name = opaque(path);
      assert.match(name, /^[0-9a-f]{32}$/, "the component names no worker and no task");
      assert.equal(name.includes("w-1") || name.includes("w-2"), false);
      assert.equal(statSync(dirname(path)).mode & 0o077, 0, "owner only");
    }
    // Both trees hold the same content, and neither can see the other.
    assert.deepEqual(
      Object.keys(digestOfWorkspace(one.path)).sort(),
      Object.keys(digestOfWorkspace(two.path)).sort(),
    );
    assert.equal(readdirSync(b.places.workerRoot).length, 2);
  } finally {
    closeBench(b);
  }
});
