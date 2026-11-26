/**
 * T062 — THE EMPTY MERGE CHECK (F154-FR-027, F154-SC-011; rule MG-1).
 *
 * A group whose application changed 0 paths runs NO merge check: no command
 * starts, no `merge_check_started`/`merge_check_finished` record is written,
 * no repair is charged, and the group is not failed (`theMergeCheckOfTheGroup`
 * answers `not-run` through the `appliedPathCountOf` seam).
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import type { CheckRunner } from "@specstride/contracts/ep/check-runner";
import { releaseTheWriter } from "../../../core/src/parallel/integrate.ts";
import { readAppendedRecords } from "../../../core/src/parallel/queue.ts";
import type { StorePlaces, TreeStoreService } from "../../../tree-store/src/index.ts";
import { initStore, treeStore } from "../../../tree-store/src/index.ts";
import {
  openTheLedgerOfTheRun,
  parallelLedgerPathOf,
  theMergeCheckOfTheGroup,
} from "../../src/engine/parallel-drive.ts";

const hash = (text: string): string => createHash("sha256").update(text).digest("hex");

type Bench = {
  readonly root: string;
  readonly workspace: string;
  readonly places: StorePlaces;
  readonly store: TreeStoreService;
  readonly controlRoot: string;
  readonly runId: string;
};

function git(cwd: string, ...argv: readonly string[]): void {
  const done = spawnSync("git", argv, { cwd, encoding: "utf8" });
  assert.equal(done.status, 0, `git ${argv.join(" ")} failed: ${done.stderr}`);
}

function benchOf(): Bench {
  const root = mkdtempSync(join(tmpdir(), "specstride-empty-merge-"));
  const workspace = join(root, "workspace");
  mkdirSync(join(workspace, "src"), { recursive: true });
  git(workspace, "init", "--quiet", ".");
  git(workspace, "config", "user.email", "t@t");
  git(workspace, "config", "user.name", "t");
  writeFileSync(join(workspace, ".gitignore"), ".specstride/\n");
  writeFileSync(join(workspace, "src", "a.ts"), "export const a = 1;\n");
  writeFileSync(join(workspace, "tasks.md"), "- [ ] 2-a the task\n");
  git(workspace, "add", "--", ".");
  git(workspace, "commit", "-q", "-m", "the empty-merge bench");
  const places: StorePlaces = {
    store: join(root, "control", "tree-store"),
    workerRoot: join(root, "worker-root"),
    control: join(root, "control"),
  };
  initStore(places);
  const store = treeStore(places, { runId: "run-empty-merge", groupId: "g-2-1" });
  return {
    root,
    workspace,
    places,
    store,
    controlRoot: join(root, "control"),
    runId: "run-empty-merge",
  };
}

function ledgerOf(bench: Bench): readonly string[] {
  const file = parallelLedgerPathOf(bench.controlRoot, bench.runId);
  if (!existsSync(file)) return [];
  return readAppendedRecords(readFileSync(file, "utf8")).records.map((record) => record.kind);
}

/** A runner that FAILS THE TEST where a command would start. */
function runnerThatMustNotStart(): CheckRunner {
  return {
    pin: async (entry) => ({
      kind: "command",
      executable: entry.argv[0] ?? "node",
      argv: entry.argv.slice(1),
    }),
    start: async () => {
      assert.fail("a command of the inner check set started over an empty application");
    },
  } as unknown as CheckRunner;
}

/** A real runner over `spawnSync`, as the drive bench's is. */
function spawnRunner(): CheckRunner {
  const results = new Map<string, { exitCode: number; durationMs: number }>();
  let next = 0;
  return {
    pin: async (entry) => ({
      kind: "command",
      executable: entry.argv[0] ?? "node",
      argv: entry.argv.slice(1),
    }),
    start: async (input) => {
      const id = `h${String(++next)}`;
      const began = Date.now();
      const done = spawnSync(input.identity.executable ?? "node", input.identity.argv ?? [], {
        cwd: input.workingDirectory,
        encoding: "utf8",
        timeout: input.timeLimitMs,
      });
      results.set(id, { exitCode: done.status ?? 1, durationMs: Date.now() - began });
      return { id };
    },
    poll: async () => ({ state: "ended" as const }),
    result: async (handle) => {
      const one = results.get(handle.id);
      assert.ok(one !== undefined, `no result for the handle ${handle.id}`);
      return {
        exitCode: one.exitCode,
        durationMs: one.durationMs,
        output: { logicalName: "out", hash: hash("out"), size: 0 },
        tainted: false,
        cached: false,
        flaky: false,
        interrupted: false,
        unchecked: false,
      };
    },
    cancel: async () => {},
    environment: () => ({}),
  } as unknown as CheckRunner;
}

test("a group whose application changed 0 paths runs no merge check and is not failed", async () => {
  const bench = benchOf();
  try {
    const ledger = openTheLedgerOfTheRun({
      controlRoot: bench.controlRoot,
      runId: bench.runId,
      groupId: "g-2-1",
    });
    // The appliedPathCountOf seam answers 0 for the group: the application
    // changed no path.
    const check = await theMergeCheckOfTheGroup({
      store: bench.store,
      writer: ledger.writer,
      runner: runnerThatMustNotStart(),
      innerCheckSet: [
        {
          id: "the-gate",
          kind: "command",
          argv: ["node", "-e", "process.exit(1)"],
          phase: 2,
          timeLimitMs: 30_000,
        },
      ],
      workspace: bench.workspace,
      tasks: ["2-a"],
      hash,
      appliedPathCountOfTheGroup: () => 0,
    });
    // The merge check answers `not-run` with MG-1.
    assert.equal(check.outcome.directive, "not-run");
    if (check.outcome.directive === "not-run") {
      assert.equal(check.outcome.ruleId, "MG-1");
      assert.equal(check.outcome.kept, false);
      assert.deepEqual(check.outcome.repairsCharged, []);
    }
    // Not failed: neither the repair path nor the layer-off path.
    assert.notEqual(check.outcome.directive, "repair");
    assert.notEqual(check.outcome.directive, "layerOffForAttempt");
    // No merge check ran: the ledger holds no merge_check record at all, so
    // no repair bookkeeping happened either.
    ledger.queue.drainNow();
    assert.deepEqual(ledgerOf(bench), []);
  } finally {
    releaseTheWriter(`${bench.runId}:ledger`);
    rmSync(bench.root, { recursive: true, force: true });
  }
});

test("without a zero reading the merge check runs as before (MG-3's F142-FR-061)", async () => {
  const bench = benchOf();
  try {
    const ledger = openTheLedgerOfTheRun({
      controlRoot: bench.controlRoot,
      runId: bench.runId,
      groupId: "g-2-1",
    });
    const check = await theMergeCheckOfTheGroup({
      store: bench.store,
      writer: ledger.writer,
      runner: spawnRunner(),
      innerCheckSet: [
        {
          id: "the-gate",
          kind: "command",
          argv: ["node", "-e", "process.exit(1)"],
          phase: 2,
          timeLimitMs: 30_000,
        },
      ],
      workspace: bench.workspace,
      tasks: ["2-a"],
      hash,
      appliedPathCountOfTheGroup: () => undefined,
    });
    // The seam's not-reading leaves the standing behaviour: the check ran,
    // it failed, one repair is charged per task.
    assert.equal(check.outcome.directive, "repair");
    ledger.queue.drainNow();
    assert.deepEqual(ledgerOf(bench), ["merge_check_started", "merge_check_finished"]);
  } finally {
    releaseTheWriter(`${bench.runId}:ledger`);
    rmSync(bench.root, { recursive: true, force: true });
  }
});
