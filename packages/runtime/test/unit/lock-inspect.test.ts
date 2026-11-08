/**
 * The workspace lock as the launch check reads it (F123-FR-021, F123-FR-022;
 * EP-13): a live owner is `held`, a dead owner is `stale`, the bash
 * orchestrator's one-line file is `foreign`, and `unlockStale` moves only a
 * lock whose owner is provably gone — into `backups/`, never deleting it.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectWorkspaceLock, lockDetail, shortAge, unlockStale } from "../../src/lock/inspect.ts";
import { spawnLockOwner } from "../helpers/lock-owner.ts";

type Scratch = {
  readonly place: { controlRoot: string; workspaceRealPath: string };
  readonly runtimeDirectory: string;
  dispose(): void;
};

function scratch(label: string): Scratch {
  const controlRoot = mkdtempSync(join(tmpdir(), `li-${label}-c-`));
  const workspaceRealPath = mkdtempSync(join(tmpdir(), `li-${label}-w-`));
  const runtimeDirectory = mkdtempSync(join(tmpdir(), `li-${label}-r-`));
  return {
    place: { controlRoot, workspaceRealPath },
    runtimeDirectory,
    dispose(): void {
      for (const path of [controlRoot, workspaceRealPath, runtimeDirectory]) {
        rmSync(path, { recursive: true, force: true });
      }
    },
  };
}

const ORCHESTRATOR_LINE = "20261106-232038-3905018 2026-11-06T23:20:38+04:00\n";
const TWO_DAYS_LATER = Date.parse("2026-11-08T23:20:38+04:00");

test("no lock is free", async () => {
  const s = scratch("free");
  try {
    const found = await inspectWorkspaceLock(s.place);
    assert.equal(found.state, "free");
  } finally {
    s.dispose();
  }
});

test("the orchestrator's one-line lock file is foreign, with its run, pid and age", async () => {
  const s = scratch("orch");
  try {
    writeFileSync(join(s.place.controlRoot, "lock"), ORCHESTRATOR_LINE);
    const found = await inspectWorkspaceLock(s.place, { now: () => TWO_DAYS_LATER });
    assert.equal(found.state, "foreign");
    assert.equal(found.owner, "orchestrator");
    assert.equal(found.run, "20261106-232038-3905018");
    assert.equal(found.pid, 3905018);
    assert.equal(shortAge(found.ageSeconds), "2d");
    assert.equal(
      lockDetail(found),
      "owner=orchestrator run=20261106-232038-3905018 pid=3905018 age=2d",
    );
  } finally {
    s.dispose();
  }
});

test("a file of no known format is foreign with an unknown owner, and unlock refuses it", async () => {
  const s = scratch("junk");
  try {
    writeFileSync(join(s.place.controlRoot, "lock"), "whatever\n");
    const found = await inspectWorkspaceLock(s.place);
    assert.equal(found.state, "foreign");
    assert.equal(found.owner, "unknown");
    const outcome = await unlockStale(s.place);
    assert.equal(outcome.moved, false);
    assert.equal(outcome.moved ? "" : outcome.reason, "owner-unprovable");
    assert.ok(existsSync(join(s.place.controlRoot, "lock")));
  } finally {
    s.dispose();
  }
});

test("an orchestrator lock is moved to backups only when its pid is dead", async () => {
  const s = scratch("orch-unlock");
  try {
    const lock = join(s.place.controlRoot, "lock");
    writeFileSync(lock, ORCHESTRATOR_LINE);
    const alive = await unlockStale(s.place, { pidAlive: () => true });
    assert.equal(alive.moved, false);
    assert.equal(alive.moved ? "" : alive.reason, "owner-alive");
    assert.ok(existsSync(lock));

    const dead = await unlockStale(s.place, { pidAlive: () => false });
    assert.equal(dead.moved, true);
    assert.ok(!existsSync(lock));
    const backups = readdirSync(join(s.place.controlRoot, "backups"));
    assert.equal(backups.length, 1);
    assert.equal(
      readFileSync(join(s.place.controlRoot, "backups", backups[0] ?? ""), "utf8"),
      ORCHESTRATOR_LINE,
    );
  } finally {
    s.dispose();
  }
});

test("a live owner's lock is held and unlock refuses it; once the owner is killed it is stale and unlock moves it", async () => {
  const s = scratch("live");
  const owner = await spawnLockOwner({
    controlRoot: s.place.controlRoot,
    workspaceRealPath: s.place.workspaceRealPath,
    runtimeDirectory: s.runtimeDirectory,
    runId: "run-live",
  });
  try {
    assert.equal(owner.ready.acquired, true, owner.ready.detail);
    const live = await inspectWorkspaceLock(s.place);
    assert.equal(live.state, "held", live.because);
    assert.equal(live.owner, "specstride");
    assert.equal(live.run, "run-live");

    const refused = await unlockStale(s.place);
    assert.equal(refused.moved, false);
    assert.equal(refused.moved ? "" : refused.reason, "lock-held");
    assert.ok(existsSync(join(s.place.controlRoot, "lock", "owner.json")));

    await owner.kill();
    const dead = await inspectWorkspaceLock(s.place);
    assert.equal(dead.state, "stale", dead.because);

    const moved = await unlockStale(s.place);
    assert.equal(moved.moved, true);
    assert.ok(!existsSync(join(s.place.controlRoot, "lock")));
    assert.ok(
      moved.moved && existsSync(join(moved.to, "owner.json")),
      "the lock is kept in backups",
    );
    assert.equal((await inspectWorkspaceLock(s.place)).state, "free");
  } finally {
    await owner.kill().catch(() => undefined);
    s.dispose();
  }
});

test("a lock directory without a readable owner record is foreign, never held-and-silent", async () => {
  const s = scratch("unreadable");
  try {
    mkdirSync(join(s.place.controlRoot, "lock"));
    writeFileSync(join(s.place.controlRoot, "lock", "owner.json"), "{not json");
    const found = await inspectWorkspaceLock(s.place);
    assert.equal(found.state, "foreign");
    assert.equal(found.owner, "unknown");
  } finally {
    s.dispose();
  }
});
