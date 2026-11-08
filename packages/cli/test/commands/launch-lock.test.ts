/**
 * The launch verb over the provider-read lock (the bug of 2026-11-08):
 * a held lock attaches, a stale or foreign lock refuses with its own
 * reason, and the dry run agrees with the run — a dry run that passes means
 * the launch passes.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { launchCommand } from "../../src/commands/launch.ts";
import type { WorkspaceLockState } from "../../../pipeline/src/launch-checks/lock-state.ts";

/**
 * A workspace with a promoted contract and a launcher on disk, so the mode
 * `run` reaches the launch checks.
 */
function workspaceWithContract(): { root: string; controlRoot: string; launcher: string } {
  const root = mkdtempSync(join(tmpdir(), "specstride-launch-lock-"));
  const controlRoot = join(root, ".specstride");
  mkdirSync(join(controlRoot, "state", "pipeline", "p"), { recursive: true });
  writeFileSync(join(controlRoot, "state", "pipeline", "p", "contract"), "{}\n");
  const launcher = join(root, "launcher");
  writeFileSync(launcher, "// launcher\n");
  return { root, controlRoot, launcher };
}

/** A launch-check context whose checks 1 to 5 pass and whose lock is pinned. */
function context(lock: WorkspaceLockState, launcherPath: string) {
  return {
    launcherPath,
    contractValidation: { status: "validated", errorText: "" },
    repoRoot: "/",
    authorizedRoots: ["/"],
    syntaxProbe: () => ({ ok: true as const }),
    dryRun: () => ({ exitCode: 0, output: "" }),
    flags: {},
    lock,
  };
}

test("mode run attaches on a held lock: exit 0, the run named, no handshake", async () => {
  const lines: string[] = [];
  const ws = workspaceWithContract();
  try {
    const result = await launchCommand(["--mode", "run", "--launcher", ws.launcher], {
      print: (line) => lines.push(line),
      controlRoot: ws.controlRoot,
      workspaceRealPath: ws.root,
      launchCheckContext: context(
        { state: "held", owner: "directory-lock", pid: 7, runId: "run-live" },
        ws.launcher,
      ),
      dryRun: () => ({ exit: 0, lines: [] }),
    });
    assert.equal(result.exit, 0);
    assert.equal(result.handshakeCalled, false);
    assert.ok(
      lines.some((line) => line.startsWith("[SPECSTRIDE-ATTACH] action=launch run=run-live")),
    );
  } finally {
    rmSync(ws.root, { recursive: true, force: true });
  }
});

test("mode run refuses a stale lock with `stale-lock` and names `unlock --stale` (exit 24)", async () => {
  const lines: string[] = [];
  const ws = workspaceWithContract();
  try {
    const result = await launchCommand(["--mode", "run", "--launcher", ws.launcher], {
      print: (line) => lines.push(line),
      controlRoot: ws.controlRoot,
      workspaceRealPath: ws.root,
      launchCheckContext: context(
        { state: "stale", owner: "directory-lock", runId: "20261106-232038-3905018" },
        ws.launcher,
      ),
    });
    assert.equal(result.exit, 24);
    assert.match(lines[0] ?? "", /reason=stale-lock/);
    assert.match(lines[0] ?? "", /unlock --stale/);
  } finally {
    rmSync(ws.root, { recursive: true, force: true });
  }
});

test("mode run refuses a foreign lock with `foreign-lock`, never `already-running`", async () => {
  const lines: string[] = [];
  const ws = workspaceWithContract();
  try {
    const result = await launchCommand(["--mode", "run", "--launcher", ws.launcher], {
      print: (line) => lines.push(line),
      controlRoot: ws.controlRoot,
      workspaceRealPath: ws.root,
      launchCheckContext: context(
        { state: "foreign", owner: "orchestrator", runId: "20261106-232038-3905018" },
        ws.launcher,
      ),
    });
    assert.equal(result.exit, 24);
    assert.match(lines[0] ?? "", /reason=foreign-lock/);
    assert.doesNotMatch(lines.join("\n"), /already-running/);
  } finally {
    rmSync(ws.root, { recursive: true, force: true });
  }
});

test("mode dry-run agrees with mode run on a stale lock: the same refusal, exit 24", async () => {
  const lines: string[] = [];
  const result = await launchCommand(["--mode", "dry-run"], {
    print: (line) => lines.push(line),
    launchCheckContext: context(
      { state: "stale", owner: "directory-lock", runId: "run-s" },
      "/unused-launcher",
    ),
    dryRun: () => ({ exit: 0, lines: ["[SPECSTRIDE-DRY-RUN] report"] }),
    dryRunInput: { contractFile: "/unused", root: "/" },
  });
  assert.equal(result.exit, 24);
  assert.match(lines.join("\n"), /reason=stale-lock/);
});

test("mode dry-run agrees with mode run on a held lock: attach, exit 0", async () => {
  const lines: string[] = [];
  const result = await launchCommand(["--mode", "dry-run"], {
    print: (line) => lines.push(line),
    launchCheckContext: context(
      { state: "held", owner: "directory-lock", pid: 7, runId: "run-live" },
      "/unused-launcher",
    ),
    dryRun: () => ({ exit: 0, lines: ["[SPECSTRIDE-DRY-RUN] report"] }),
    dryRunInput: { contractFile: "/unused", root: "/" },
  });
  assert.equal(result.exit, 0);
  assert.match(lines.join("\n"), /\[SPECSTRIDE-ATTACH\]/);
});
