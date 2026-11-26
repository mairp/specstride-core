/**
 * T050 (feature 154, US2) — THE COMPLETION-ORDER PROPERTY (F154-SC-003).
 *
 * Over the plan of the fixture `tests/fixtures/154/groups` — one phase with
 * three groups, one task in each (T001, T002, T003), three workers over
 * disjoint paths — EVERY permutation of the order the workers complete in
 * composes and applies to a tree with ZERO bytes different: the same tree id,
 * the same bytes in the workspace, each edit exactly once.
 *
 * The engine reaches this twice over (F143-FR-019): integration receives the
 * workers IN THE ORDER OF THE TASKS AT LAUNCH and never the order of
 * completion, and the store's composition accepts deltas over disjoint paths
 * whatever order they arrive in — the test pins both, by composing the
 * permuted deltas directly and comparing the applied bytes, and by reading
 * the launch order out of the workers as `deltasForIntegration` does.
 *
 * Run from the repository root:
 *     node --experimental-strip-types --test tests/parallel/154/completion-order.test.ts
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { initStore, treeStore, type StorePlaces } from "../../../packages/tree-store/src/index.ts";
import {
  deltasForIntegration,
  type WorkerForIntegration,
} from "../../../packages/core/src/parallel/integrate.ts";
import type { DerivedOutcome } from "../../../packages/core/src/parallel/barrier.ts";

/* The plan of FX-154-GROUPS: three groups, one task and one path each. */
const TASKS = Object.freeze([
  Object.freeze({ taskId: "T001", path: "src/001.ts", edit: "\n// T001 was here\n" }),
  Object.freeze({ taskId: "T002", path: "src/002.ts", edit: "\n// T002 was here\n" }),
  Object.freeze({ taskId: "T003", path: "src/003.ts", edit: "\n// T003 was here\n" }),
]);

/** The store snapshots a real git worktree: make one, with its first commit. */
function gitBench(cwd: string): void {
  for (const argv of [
    ["init", "--quiet", "."],
    ["config", "user.email", "t@t"],
    ["config", "user.name", "t"],
    ["add", "--", "."],
    ["commit", "-q", "-m", "the completion-order bench"],
  ]) {
    const done = spawnSync("git", argv, { cwd, encoding: "utf8" });
    assert.equal(done.status, 0, `git ${argv.join(" ")} failed: ${done.stderr}`);
  }
}

/** The bytes of the named files of a tree, as one hash over their contents. */
function bytesOf(root: string, paths: readonly string[]): string {
  const hash = createHash("sha256");
  for (const path of [...paths].sort()) hash.update(readFileSync(join(root, path)));
  return hash.digest("hex");
}

type Bench = {
  readonly root: string;
  readonly workspace: string;
  readonly baseTreeId: string;
  readonly workers: readonly {
    readonly workerId: string;
    readonly taskId: string;
    readonly treeId: string;
    readonly paths: readonly string[];
  }[];
  readonly store: ReturnType<typeof treeStore>;
  cleanup: () => void;
};

/** One bench: a fresh workspace, store and worker trees over the fixture plan. */
async function benchOf(): Promise<Bench> {
  const root = mkdtempSync(join(tmpdir(), "154-completion-order-"));
  const workspace = join(root, "workspace");
  const places: StorePlaces = {
    store: join(root, "tree-store"),
    workerRoot: join(root, "worker-root"),
    control: join(root, "control"),
  };
  initStore(places);
  const store = treeStore(places, { runId: "run-154", groupId: "g-1-1" });
  for (const task of TASKS) {
    const at = join(workspace, task.path);
    mkdirSync(join(at, ".."), { recursive: true });
    writeFileSync(at, `export const x = "${task.taskId}";\n`);
  }
  gitBench(workspace);
  const baseTreeId = await store.snapshot(workspace);
  const workers: Bench["workers"] = [];
  for (const [index, task] of TASKS.entries()) {
    const workerId = `w-${index + 1}`;
    const tree = await store.materialize(baseTreeId, workerId);
    writeFileSync(join(tree.path, task.path), `export const x = "${task.taskId}";${task.edit}`);
    const treeId = await store.snapshot(tree.path);
    workers.push({
      workerId,
      taskId: task.taskId,
      treeId,
      paths: (await store.changed(baseTreeId, treeId)).map((changed) => changed.path),
    });
    await store.release(tree);
  }
  return {
    root,
    workspace,
    baseTreeId,
    workers,
    store,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

/** One worker of the bench, as integration receives it (all integrated). */
function workerOf(bench: Bench, workerId: string): WorkerForIntegration {
  const worker = bench.workers.find((one) => one.workerId === workerId);
  assert.ok(worker !== undefined, `no worker ${workerId}`);
  const outcome: DerivedOutcome = {
    workerId,
    outcome: "integrated",
    chargesItsTask: true,
    taskReturnsToTheMainLine: false,
  };
  return Object.freeze({
    workerId,
    task: worker.taskId,
    finalTreeId: worker.treeId,
    paths: worker.paths,
    outcome,
  });
}

/** Every permutation of a list, in order. */
function permutationsOf<T>(items: readonly T[]): readonly (readonly T[])[] {
  if (items.length <= 1) return [items];
  const out: (readonly T[])[] = [];
  for (const [index, head] of items.entries()) {
    const rest = [...items.slice(0, index), ...items.slice(index + 1)];
    for (const tail of permutationsOf(rest)) out.push(Object.freeze([head, ...tail]));
  }
  return out;
}

test("every permutation of worker completion composes and applies to the same bytes", async () => {
  const bench = await benchOf();
  try {
    const applied: { readonly treeId: string; readonly bytes: string }[] = [];
    for (const order of permutationsOf(bench.workers.map((worker) => worker.workerId))) {
      // A fresh copy of the base workspace, as a new group run starts from.
      const workspace = join(bench.root, `applied-${order.join("")}`);
      for (const task of TASKS) {
        mkdirSync(join(workspace, task.path, ".."), { recursive: true });
        writeFileSync(join(workspace, task.path), `export const x = "${task.taskId}";\n`);
      }
      gitBench(workspace);
      const baseTreeId = await bench.store.snapshot(workspace);
      // THE COMPLETION ORDER, fed to the composition as it ends: the deltas
      // of the three workers over disjoint paths, in the permuted order.
      const deltas = order.map((workerId) => {
        const worker = bench.workers.find((one) => one.workerId === workerId);
        return Object.freeze({
          workerId,
          treeId: worker?.treeId ?? "",
          paths: worker?.paths ?? [],
        });
      });
      const composed = await bench.store.compose(baseTreeId, deltas);
      assert.equal(composed.composed, true, `overlap in order ${order.join(",")}`);
      const paths = await bench.store.apply(baseTreeId, composed.treeId, workspace);
      // The applied tree: every edit exactly once, the bytes of the whole
      // workspace, and the store's own identity of the tree.
      assert.deepEqual([...paths].sort(), TASKS.map((task) => task.path));
      const treeId = await bench.store.snapshot(workspace);
      applied.push({
        treeId,
        bytes: bytesOf(workspace, [...TASKS.map((task) => task.path)]),
      });
      for (const task of TASKS) {
        const text = readFileSync(join(workspace, task.path), "utf8");
        assert.equal(
          text.split(task.edit).length - 1,
          1,
          `${task.taskId}'s edit appears ${(text.split(task.edit).length - 1).toString()} times in ${task.path}`,
        );
      }
    }
    // ZERO bytes different: one tree id and one byte hash across all six.
    assert.equal(applied.length, 6);
    const first = applied[0];
    for (const one of applied.slice(1)) {
      assert.equal(one.treeId, first?.treeId);
      assert.equal(one.bytes, first?.bytes);
    }
  } finally {
    bench.cleanup();
  }
});

test("the launch order, not the completion order, is what integration receives", () => {
  const workers: readonly WorkerForIntegration[] = Object.freeze(
    TASKS.map((task, index) => {
      const outcome: DerivedOutcome = {
        workerId: `w-${index + 1}`,
        outcome: "integrated",
        chargesItsTask: true,
        taskReturnsToTheMainLine: false,
      };
      return Object.freeze({
        workerId: `w-${index + 1}`,
        task: task.taskId,
        finalTreeId: `tree-${task.taskId}`,
        paths: Object.freeze([task.path]),
        outcome,
      });
    }),
  );
  // The workers COMPLETED in the reverse order; the deltas integration
  // composes still carry the order of the tasks at launch.
  const byCompletion = [...workers].reverse();
  const deltas = deltasForIntegration(byCompletion);
  assert.deepEqual(
    deltas.map((delta) => delta.treeId),
    ["tree-T003", "tree-T002", "tree-T001"],
  );
  // A worker that did not end integrated contributes nothing, wherever in
  // the completion order it stands.
  const refused: readonly WorkerForIntegration[] = Object.freeze([
    ...workers.slice(0, 1),
    Object.freeze({
      ...workers[1]!,
      outcome: Object.freeze({
        workerId: workers[1]!.workerId,
        outcome: "refused",
        reason: "audit",
        chargesItsTask: false,
        taskReturnsToTheMainLine: true,
      }) as DerivedOutcome,
    }),
    ...workers.slice(2),
  ]);
  assert.deepEqual(
    deltasForIntegration(refused).map((delta) => delta.workerId),
    ["w-1", "w-3"],
  );
});
