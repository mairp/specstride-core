/**
 * `specstride unlock --stale` — the safe recovery of the bug of
 * 2026-11-08: a stale lock is moved into the backups, a live or foreign
 * lock is refused, and a free workspace has nothing to clear.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { unlockCommand } from "../../src/commands/unlock.ts";
import type { WorkspaceLockState } from "../../pipeline/src/launch-checks/lock-state.ts";

/** A workspace on disk: a control root with a lock shape in it. */
function workspace(lock: "directory" | "file" | null): string {
  const root = mkdtempSync(join(tmpdir(), "specstride-unlock-"));
  const controlRoot = join(root, ".specstride");
  mkdirSync(controlRoot, { recursive: true });
  if (lock === "directory") {
    mkdirSync(join(controlRoot, "lock"));
    writeFileSync(join(controlRoot, "lock", "owner.json"), "{}\n");
  } else if (lock === "file") {
    writeFileSync(join(controlRoot, "lock"), "run-1 2026-11-06T23:20:38+04:00\n");
  }
  return controlRoot;
}

test("without --stale the verb clears nothing (exit 2)", async () => {
  const lines: string[] = [];
  const result = await unlockCommand([], {
    print: (line) => lines.push(line),
    controlRoot: workspace(null),
  });
  assert.equal(result.exit, 2);
  assert.match(lines[0] ?? "", /action=unlock reason=usage/);
});

test("a free workspace has nothing to clear (exit 0)", async () => {
  const lines: string[] = [];
  const controlRoot = workspace(null);
  const result = await unlockCommand(["--stale"], {
    print: (line) => lines.push(line),
    controlRoot,
    lockState: async () => ({ state: "free" }) as WorkspaceLockState,
  });
  assert.equal(result.exit, 0);
  assert.match(lines[0] ?? "", /nothing to clear/);
});

test("a live lock is refused and kept (exit 24)", async () => {
  const lines: string[] = [];
  const controlRoot = workspace("directory");
  const result = await unlockCommand(["--stale"], {
    print: (line) => lines.push(line),
    controlRoot,
    lockState: async () =>
      ({ state: "held", owner: "directory-lock", pid: 1 }) as WorkspaceLockState,
  });
  assert.equal(result.exit, 24);
  assert.match(lines[0] ?? "", /reason=lock-held/);
  assert.ok(existsSync(join(controlRoot, "lock")), "a live lock is never touched");
});

test("a foreign lock is refused with the manual fix, and kept (exit 24)", async () => {
  const lines: string[] = [];
  const controlRoot = workspace("file");
  const result = await unlockCommand(["--stale"], {
    print: (line) => lines.push(line),
    controlRoot,
    lockState: async () =>
      ({ state: "foreign", owner: "orchestrator", runId: "run-1" }) as WorkspaceLockState,
  });
  assert.equal(result.exit, 24);
  assert.match(lines[0] ?? "", /reason=foreign-lock/);
  assert.match(lines[0] ?? "", /by hand/);
  assert.ok(existsSync(join(controlRoot, "lock")), "a foreign lock is never reclaimed");
});

test("a stale lock is MOVED into the backups, never deleted, and the workspace reads free", async () => {
  const lines: string[] = [];
  const controlRoot = workspace("directory");
  let first = true;
  const result = await unlockCommand(["--stale"], {
    print: (line) => lines.push(line),
    controlRoot,
    // The first read sees the stale owner; after the move the workspace is free.
    lockState: async () =>
      first
        ? ((first = false),
          {
            state: "stale",
            owner: "directory-lock",
            runId: "20261106-232038-3905018",
          } as WorkspaceLockState)
        : ({ state: "free" } as WorkspaceLockState),
  });
  assert.equal(result.exit, 0);
  assert.ok(
    lines.some((line) => line.startsWith("[SPECSTRIDE-UNLOCK] moved=")),
    "the move is reported",
  );
  assert.equal(existsSync(join(controlRoot, "lock")), false, "the lock is gone from the workspace");
  const backups = join(controlRoot, "backups");
  assert.ok(existsSync(backups), "the backups directory exists");
  const moved = [...(await import("node:fs")).readdirSync(backups)].filter((name) =>
    name.startsWith("lock-"),
  );
  assert.equal(moved.length, 1, "exactly one backup was written");
  assert.ok(
    existsSync(join(backups, moved[0] ?? "", "owner.json")),
    "the moved lock keeps its contents",
  );
});

test("a move that leaves the workspace locked is reported as a refusal, not a success", async () => {
  const lines: string[] = [];
  const result = await unlockCommand(["--stale"], {
    print: (line) => lines.push(line),
    controlRoot: workspace("directory"),
    lockState: async () => ({ state: "stale" }) as WorkspaceLockState,
  });
  assert.equal(result.exit, 24);
  assert.match(lines[0] ?? "", /reason=still-locked/);
});
