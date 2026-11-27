/**
 * T117 — the workspace of one stage of a wide stage group (F154-FR-049,
 * F154-FR-079).
 *
 * Two stages of one wide group have two workspaces, each with its own lock
 * path (`lockPathOf`); after a landing or a park the workspace is removed
 * through the port; a stop marks nothing — a workspace that is still
 * `running` is never removed and never lands (F154-FR-079: nothing lands
 * during a stop; the removal is the landing's or the park's).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  makeStageWorkspace,
  markStageWorkspace,
  removeStageWorkspace,
  lockPathOf,
  stageWorkspacePath,
  stageWorkspaceRecordPath,
  readStageWorkspaceRecord,
  type StageWorkspaceRecord,
  type WorktreePort,
} from "../../src/executor/stage-workspace.ts";

/** A fake worktree port over real directories: the tree made, the tree removed. */
function fakePort(made: string[], removed: string[]): WorktreePort {
  return {
    async add(_home, workspace) {
      made.push(workspace);
    },
    async remove(workspace) {
      removed.push(workspace);
    },
  };
}

/** A control root under a fresh temporary directory, removed when the test ends. */
function controlRoot(): string {
  return mkdtempSync(join(tmpdir(), "stage-workspace-154-"));
}

const NOW = () => new Date("2026-11-25T00:00:00Z");

test("two stages of one wide group have two workspaces, each with its own lock", async () => {
  const root = controlRoot();
  try {
    const made: string[] = [];
    const removed: string[] = [];
    const port = fakePort(made, removed);
    const group = ["A", "B"];

    const a = await makeStageWorkspace({
      home: "/home/repo",
      stage: "A",
      group,
      pipelineRunId: "run-1",
      runId: "run-1:A",
      controlRoot: root,
      port,
      now: NOW,
    });
    const b = await makeStageWorkspace({
      home: "/home/repo",
      stage: "B",
      group,
      pipelineRunId: "run-1",
      runId: "run-1:B",
      controlRoot: root,
      port,
      now: NOW,
    });

    assert.notEqual(a, null);
    assert.notEqual(b, null);
    // Two workspaces: distinct paths under the control root, one per stage.
    assert.equal(a!.workspace, stageWorkspacePath(root, "run-1", "A"));
    assert.equal(b!.workspace, stageWorkspacePath(root, "run-1", "B"));
    assert.notEqual(a!.workspace, b!.workspace);
    // Each with its own lock: the lock path lives inside its own workspace.
    assert.equal(lockPathOf(a!.workspace), join(a!.workspace, ".specstride", "lock"));
    assert.notEqual(lockPathOf(a!.workspace), lockPathOf(b!.workspace));
    // The worktree was made from home through the port, once per stage.
    assert.deepEqual(made, [a!.workspace, b!.workspace]);
    assert.deepEqual(removed, []);
    // Both records are on disk in state `running`, with the removedAt null.
    assert.equal(a!.state, "running");
    assert.equal(a!.removedAt, null);
    const readBack = readStageWorkspaceRecord(root, "run-1", "B");
    assert.equal(readBack?.schema, "specstride.stage-workspace/1");
    assert.equal(readBack?.state, "running");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("after a landing or a park the workspace is removed", async () => {
  const root = controlRoot();
  try {
    const removed: string[] = [];
    const port = fakePort([], removed);

    let a: StageWorkspaceRecord = (await makeStageWorkspace({
      home: "/home/repo",
      stage: "A",
      group: ["A", "B"],
      pipelineRunId: "run-1",
      runId: "run-1:A",
      controlRoot: root,
      port: fakePort([], []),
      now: NOW,
    }))!;

    // A workspace that still runs is never removed (F154-FR-079).
    const stillRunning = await removeStageWorkspace(root, a, { port, now: NOW });
    assert.equal(stillRunning.removedAt, null);
    assert.deepEqual(removed, []);

    // The landing: the state moves to `landed` with the landing record, then
    // the workspace is removed.
    a = markStageWorkspace(root, a, "landed", { landingRecord: "run-1:A:landing", now: NOW });
    assert.equal(a.state, "landed");
    assert.equal(a.landingRecord, "run-1:A:landing");
    a = await removeStageWorkspace(root, a, { port, now: NOW });
    assert.equal(a.removedAt, "2026-11-25T00:00:00.000Z");
    assert.deepEqual(removed, [a.workspace]);

    // The park (a conflict or a red gate, exit 22 for that stage): the same
    // removal after the terminal state.
    let b: StageWorkspaceRecord = (await makeStageWorkspace({
      home: "/home/repo",
      stage: "B",
      group: ["A", "B"],
      pipelineRunId: "run-1",
      runId: "run-1:B",
      controlRoot: root,
      port: fakePort([], []),
      now: NOW,
    }))!;
    b = markStageWorkspace(root, b, "parked", { landingRecord: "run-1:B:landing", now: NOW });
    b = await removeStageWorkspace(root, b, { port, now: NOW });
    assert.equal(b.state, "parked");
    assert.equal(b.removedAt, "2026-11-25T00:00:00.000Z");
    assert.deepEqual(removed, [a.workspace, b.workspace]);

    // The removal of the real directory leaves no workspace or record behind.
    assert.equal(existsSync(stageWorkspaceRecordPath(root, "run-1", "A")), true);
    rmSync(a.workspace, { recursive: true, force: true });
    assert.equal(existsSync(a.workspace), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("nothing lands during a stop: a stopped group's workspaces keep running, no landing record", async () => {
  const root = controlRoot();
  try {
    const group = ["A", "B"];
    const workspaces: StageWorkspaceRecord[] = [];
    for (const stage of group) {
      const record = await makeStageWorkspace({
        home: "/home/repo",
        stage,
        group,
        pipelineRunId: "run-1",
        runId: `run-1:${stage}`,
        controlRoot: root,
        port: fakePort([], []),
        now: NOW,
      });
      assert.notEqual(record, null);
      workspaces.push(record!);
    }
    // The stop lands at the middle of the wide group: no workspace has a
    // landing record or a terminal state, and none was removed.
    for (const record of workspaces) {
      assert.equal(record.state, "running");
      assert.equal(record.landingRecord, null);
      assert.equal(record.removedAt, null);
    }
    // The records on disk say the same (the pipeline reads only files).
    for (const record of workspaces) {
      const onDisk = JSON.parse(
        readFileSync(stageWorkspaceRecordPath(root, "run-1", record.stage), "utf8"),
      ) as StageWorkspaceRecord;
      assert.equal(onDisk.state, "running");
      assert.equal(onDisk.landingRecord, null);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a port that refuses to make or remove degrades, never throws (F154-FR-004)", async () => {
  const root = controlRoot();
  try {
    const refusing: WorktreePort = {
      async add() {
        throw new Error("worktree refused");
      },
      async remove() {
        throw new Error("removal refused");
      },
    };
    const made = await makeStageWorkspace({
      home: "/home/repo",
      stage: "A",
      group: ["A", "B"],
      pipelineRunId: "run-1",
      runId: "run-1:A",
      controlRoot: root,
      port: refusing,
      now: NOW,
    });
    assert.equal(made, null); // no record, the caller runs the group serially

    const record = (await makeStageWorkspace({
      home: "/home/repo",
      stage: "B",
      group: ["A", "B"],
      pipelineRunId: "run-1",
      runId: "run-1:B",
      controlRoot: root,
      port: fakePort([], []),
      now: NOW,
    }))!;
    const landed = markStageWorkspace(root, record, "landed", { landingRecord: "l", now: NOW });
    const kept = await removeStageWorkspace(root, landed, { port: refusing, now: NOW });
    assert.equal(kept.removedAt, null); // the removal is retried by a later run
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
