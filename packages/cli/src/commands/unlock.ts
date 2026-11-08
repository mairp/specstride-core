/**
 * `specstride unlock --stale` — the safe recovery of the bug of
 * 2026-11-08: the launch was refused with `already-running` by a stale
 * lock and the product offered no way out. This verb reads the workspace
 * lock through the lock provider of EP-13 and moves a lock aside ONLY when
 * its owner is provably dead:
 *
 * - `free`    — there is nothing to clear; exit 0.
 * - `held`    — a live owner owns the lock; never touched; exit 24 with the
 *   `next:` that names `specstride wait --until-change`.
 * - `foreign` — another engine's lock format (the bash orchestrator's
 *   one-line file); a foreign owner is never reclaimed automatically
 *   (§F.5); exit 24 with the manual `next:`.
 * - `stale`   — `stale-owner-dead`: the lock is MOVED, not deleted, into
 *   `<controlRoot>/backups/lock-<timestamp>`; a probe after the move must
 *   say `free`, or the verb reports the failure and exits 24.
 */
import { mkdirSync, renameSync } from "node:fs";
import { join } from "node:path";
import { controlPlaneOf } from "../router/guards.ts";
import { lockPathsOf } from "../../../runtime/src/lock/paths.ts";
import {
  describeLockState,
  nextForLockState,
  workspaceLockState,
} from "../../../pipeline/src/launch-checks/lock-state.ts";

/** The result of one invocation of the verb: the printed lines and the exit. */
export type UnlockResult = {
  readonly lines: readonly string[];
  readonly exit: number;
};

/** The dependencies of the verb; every one is injected, so a test runs it on a stub. */
export type UnlockCommandDeps = {
  print?(line: string): void;
  /** Where the control plane of the workspace is. */
  controlRoot?: string;
  /** The real path of the workspace. */
  workspaceRealPath?: string;
  /**
   * The lock state itself; the provider of EP-13 by default. A test hands
   * its own in, so the verb's decision table runs without a live lock on
   * disk; the real probe still answers the post-move check through the same
   * port.
   */
  /** Whether a pid lives on this machine; `kill(pid, 0)` by default. */
  pidAlive?(pid: number): boolean;
  lockState?(place: {
    controlRoot: string;
    workspaceRealPath: string;
  }): Promise<ReturnType<typeof workspaceLockState>>;
};

/** `kill(pid, 0)`: `EPERM` means the process exists and belongs to someone else. */
function pidAliveByKill(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** The refusal line of the verb: `[SPECSTRIDE-REFUSE] action=unlock ...`. */
function refuseLine(reason: string, next: string): string {
  return `[SPECSTRIDE-REFUSE] action=unlock reason=${reason} next=${JSON.stringify(next)}`;
}

/**
 * Run the command `unlock` on the arguments that follow its word; the exit
 * code is the result.
 */
export async function unlockCommand(
  argv: readonly string[],
  deps: UnlockCommandDeps = {},
): Promise<UnlockResult> {
  const print = deps.print ?? ((line: string): void => void process.stdout.write(line + "\n"));
  if (!argv.includes("--stale")) {
    // Without `--stale` the verb clears nothing: the only recovery it offers
    // is the one whose owner is PROVABLY dead.
    const line = refuseLine("usage", "pass --stale to move a lock whose owner is provably dead");
    print(line);
    return { lines: [line], exit: 2 };
  }
  const root = deps.workspaceRealPath ?? process.cwd();
  const controlRoot = deps.controlRoot ?? controlPlaneOf(root).stateDir;
  const probe = deps.lockState ?? workspaceLockState;
  const lock = await probe({ controlRoot, workspaceRealPath: root });
  if (lock.state === "free") {
    const line = "unlock: the workspace lock is free; there is nothing to clear";
    print(line);
    return { lines: [line], exit: 0 };
  }
  if (lock.state === "held") {
    const line = refuseLine(
      "lock-held",
      "a live owner holds the lock; `specstride wait --until-change` watches it",
    );
    print(line);
    return { lines: [line], exit: 24 };
  }
  // The bash orchestrator's lock names the pid that wrote it: once that pid is
  // dead the lock is provably stale, and it is moved aside like ours. Any
  // other foreign lock, or one whose pid still lives, is left where it is.
  const orchestratorGone =
    lock.state === "foreign" &&
    lock.owner === "orchestrator" &&
    lock.pid !== undefined &&
    !(deps.pidAlive ?? pidAliveByKill)(lock.pid);
  if (lock.state === "foreign" && !orchestratorGone) {
    if (lock.owner === "orchestrator" && lock.pid !== undefined) {
      const line = refuseLine(
        "owner-alive",
        `the orchestrator process ${String(lock.pid)} that wrote the lock still lives; stop it first`,
      );
      print(line);
      return { lines: [line], exit: 24 };
    }
    const line = refuseLine(
      "foreign-lock",
      nextForLockState(lock) ?? "move the lock aside by hand",
    );
    print(line);
    return { lines: [line], exit: 24 };
  }
  // Stale, or an orchestrator lock whose pid is dead: move the lock into the
  // backups, never delete it.
  const paths = lockPathsOf({ controlRoot, workspaceRealPath: root });
  const backups = join(controlRoot, "backups");
  const moved = join(backups, `lock-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  try {
    mkdirSync(backups, { recursive: true });
    renameSync(paths.lockDirectory, moved);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const line = refuseLine("unlock-failed", `the lock could not be moved: ${detail}`);
    print(line);
    return { lines: [line], exit: 24 };
  }
  // The move must leave the workspace FREE, or the verb has not done what it
  // said; the honest answer is a refusal, not a silent success.
  const after = await probe({ controlRoot, workspaceRealPath: root });
  if (after.state !== "free") {
    const line = refuseLine(
      "still-locked",
      "the lock was moved but the workspace still reads as locked; run the doctor",
    );
    print(line);
    return { lines: [line], exit: 24 };
  }
  const lines = [
    `[SPECSTRIDE-UNLOCK] moved=${moved}`,
    `[SPECSTRIDE-UNLOCK] detail=${describeLockState(lock)}`,
    "unlock: the workspace lock is free",
  ];
  for (const line of lines) print(line);
  return { lines, exit: 0 };
}
