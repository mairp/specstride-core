/**
 * Check 6 against a REAL lock owner (F123-FR-021, F123-FR-022): a process of
 * its own takes the lock through the shipped provider, so `held` is read from
 * a live endpoint and `stale` from the kernel dropping it when the owner is
 * killed without warning — no stub of the probe. Also: the orchestrator's
 * one-line lock names its pid, which `unlock --stale` checks.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { workspaceLockState } from "../src/launch-checks/lock-state.ts";
import { checkRunDirectoryFree, type LaunchCheckContext } from "../src/launch-checks/checks.ts";
import { spawnLockOwner } from "../../runtime/test/helpers/lock-owner.ts";

function scratch(): {
  controlRoot: string;
  workspaceRealPath: string;
  runtimeDirectory: string;
  dispose(): void;
} {
  const controlRoot = mkdtempSync(join(tmpdir(), "c6-live-c-"));
  const workspaceRealPath = mkdtempSync(join(tmpdir(), "c6-live-w-"));
  const runtimeDirectory = mkdtempSync(join(tmpdir(), "c6-live-r-"));
  return {
    controlRoot,
    workspaceRealPath,
    runtimeDirectory,
    dispose(): void {
      for (const p of [controlRoot, workspaceRealPath, runtimeDirectory])
        rmSync(p, { recursive: true, force: true });
    },
  };
}

const reasonOf = (lock: Awaited<ReturnType<typeof workspaceLockState>>): string => {
  const outcome = checkRunDirectoryFree({ lock } as unknown as LaunchCheckContext);
  return outcome.status === "pass" ? "pass" : String(outcome.reason);
};

test("a live owner process is held (attach); once killed its lock is stale", async () => {
  const s = scratch();
  const owner = await spawnLockOwner({ ...s, runId: "run-live" });
  try {
    assert.equal(owner.ready.acquired, true, owner.ready.detail);
    const place = { controlRoot: s.controlRoot, workspaceRealPath: s.workspaceRealPath };
    const live = await workspaceLockState(place);
    assert.equal(live.state, "held", live.detail);
    assert.equal(live.runId, "run-live");
    assert.equal(reasonOf(live), "already-running");

    await owner.kill();
    const dead = await workspaceLockState(place);
    assert.equal(dead.state, "stale", dead.detail);
    assert.equal(reasonOf(dead), "stale-lock");
  } finally {
    await owner.kill().catch(() => undefined);
    s.dispose();
  }
});

test("the orchestrator's one-line lock is foreign and names the pid that wrote it", async () => {
  const s = scratch();
  try {
    writeFileSync(
      join(s.controlRoot, "lock"),
      "20261106-232038-3905018 2026-11-06T23:20:38+04:00\n",
    );
    const lock = await workspaceLockState({
      controlRoot: s.controlRoot,
      workspaceRealPath: s.workspaceRealPath,
    });
    assert.equal(lock.state, "foreign");
    assert.equal(lock.owner, "orchestrator");
    assert.equal(lock.pid, 3905018);
    assert.equal(reasonOf(lock), "foreign-lock");
  } finally {
    s.dispose();
  }
});
