/**
 * T083 (feature 154, US3) — THE NARROWED GUARD of F142-FR-059 (F154-FR-034).
 *
 * The blanket "no check runs in a worker tree" is amended: what still never
 * runs in a worker tree is the MERGE CHECK — `runMergeCheck` refuses a
 * request whose workspace is a worker tree with `CHECK_IN_A_WORKER_TREE`
 * before any command starts — while the group's ACCEPTANCE check now runs in
 * its worker tree (`parallel-group.ts`, the record `specstride.worker-check/1`).
 * The three constants state the narrowed rule, and the refusal is the narrow
 * one: a request whose workspace is NOT a worker tree runs, whatever worker
 * trees exist beside it.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import type { CheckRunner, ManifestEntry } from "../../contracts/src/ep/check-runner.ts";
import {
  CHECK_IN_A_WORKER_TREE,
  NO_CHECK_RUNS_IN_A_WORKER_TREE,
  NO_MERGE_CHECK_RUNS_IN_A_WORKER_TREE,
  THE_ACCEPTANCE_CHECK_RUNS_IN_A_WORKER_TREE,
  runMergeCheck,
  type MergeCheckRequest,
} from "../../core/src/parallel/merge-check.ts";

test("the guard is narrowed to the merge check, stated by the three constants", () => {
  // The blanket statement is AMENDED: a check MAY run in a worker tree.
  assert.equal(NO_CHECK_RUNS_IN_A_WORKER_TREE, false);
  // The merge check still never does.
  assert.equal(NO_MERGE_CHECK_RUNS_IN_A_WORKER_TREE, true);
  // The acceptance check is the check that now runs in a worker tree.
  assert.equal(THE_ACCEPTANCE_CHECK_RUNS_IN_A_WORKER_TREE, true);
});

test("runMergeCheck refuses a request whose workspace is a worker tree", async () => {
  const root = mkdtempSync(join(tmpdir(), "merge-guard-154-"));
  try {
    const workspace = join(root, "workspace");
    const workerTree = join(root, "worker-roots", "run", "w-1");
    const request = requestOf({
      root,
      workspace,
      workerTrees: [workerTree, join(root, "worker-roots", "run", "w-2")],
    });
    // The refusal is exact: the workspace ASKED FOR is a worker tree.
    const insideWorkerTree: MergeCheckRequest = {
      ...request,
      workspace: workerTree,
    };
    await assert.rejects(
      () => runMergeCheck(insideWorkerTree),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, CHECK_IN_A_WORKER_TREE);
        return true;
      },
    );
    // And NO command ran: the refusal came before the first pin.
    assert.deepEqual(pinned, [], "the refused request pinned no command");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a workspace that is no worker tree runs, whatever worker trees exist beside it", async () => {
  const root = mkdtempSync(join(tmpdir(), "merge-guard-154-run-"));
  try {
    const workspace = join(root, "workspace");
    const done = await runMergeCheck(
      requestOf({
        root,
        workspace,
        workerTrees: [join(root, "worker-roots", "run", "w-1")],
      }),
    );
    // The one command of the inner set ran IN THE WORKSPACE and passed.
    assert.equal(done.unchecked, false);
    assert.equal(done.passed, true);
    assert.deepEqual(
      done.commands.map((command) => [command.id, command.exitCode, command.workingDirectory]),
      [["the-probe", 0, workspace]],
    );
    assert.equal(done.ranOn, workspace);
    assert.equal(done.fingerprintBefore, "fp");
    assert.equal(done.fingerprintAfter, "fp");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("an empty inner set stays the unchecked case of F142-FR-060, outside the guard", async () => {
  const root = mkdtempSync(join(tmpdir(), "merge-guard-154-empty-"));
  try {
    const workspace = join(root, "workspace");
    const done = await runMergeCheck(
      requestOf({
        root,
        workspace,
        workerTrees: [join(root, "worker-roots", "run", "w-1")],
        entries: [],
      }),
    );
    assert.equal(done.unchecked, true);
    assert.deepEqual(done.commands, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------------ *
 * The stub runner, and the request builder.
 * ------------------------------------------------------------------ */

let pinned: string[] = [];

function requestOf(input: {
  readonly root: string;
  readonly workspace: string;
  readonly workerTrees?: readonly string[];
  readonly entries?: readonly ManifestEntry[];
}): MergeCheckRequest {
  pinned = [];
  const entries: readonly ManifestEntry[] = input.entries ?? [
    { id: "the-probe", kind: "command", argv: ["/bin/true"], phase: 1, timeLimitMs: 30_000 },
  ];
  const runner: CheckRunner = {
    pin: async (entry) => {
      pinned.push(entry.id);
      return { kind: "command", executable: entry.argv[0] ?? "", argv: entry.argv.slice(1) };
    },
    start: async () => ({ id: "handle" }),
    poll: async () => ({ state: "ended" as const }),
    result: async () => ({
      exitCode: 0,
      durationMs: 1,
      output: { logicalName: "out", hash: "h", size: 0 },
      tainted: false,
      cached: false,
      flaky: false,
      interrupted: false,
      unchecked: false,
    }),
    cancel: async () => {},
    environment: () => ({}),
  };
  return {
    runner,
    innerCheckSet: entries,
    workspace: input.workspace,
    ...(input.workerTrees === undefined ? {} : { workerTrees: [...input.workerTrees] }),
    fingerprintOfTheWorkspace: async () => "fp",
  };
}
