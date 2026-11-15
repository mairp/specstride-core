/**
 * Phase 7 of feature 153 — the check-runner service under the enforced time
 * limit (T084, T086, T087; F153-FR-029). The object the engine registers as
 * the service `check-runner` — built by the exported `checkRunnerServiceOf` —
 * runs one command through the one check runner of feature 148: the command
 * runs as the leader of its own process group, is ended — the whole group,
 * SIGTERM then SIGKILL after the runner's grace — at the service's declared
 * limit, and the call resolves with a failed result within the limit plus
 * the grace. With the switch off, the baseline `spawnSync` runs exactly as
 * before the feature.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { checkRunnerServiceOf } from "../../src/engine/run-feature.ts";

const REPO_ROOT = fileURLToPath(new URL("../../../..", import.meta.url));
const FAKE = join(REPO_ROOT, "packages/cli/test/fixtures/loop-speed/bin/hang-with-grandchild.mjs");

/** Process groups are available (the kill tests skip with their reason otherwise, F153-FR-032). */
const GROUPS_AVAILABLE = process.platform !== "win32" && (() => {
  try {
    process.kill(-1, 0);
    return true;
  } catch (thrown) {
    return (thrown as NodeJS.ErrnoException).code !== "ENOSYS";
  }
})();

/** Poll until a pid is gone (the kill is asynchronous at the boundary). */
async function pidIsGone(pid: number): Promise<boolean> {
  for (let waited = 0; waited < 5_000; waited += 100) {
    try {
      process.kill(pid, 0);
    } catch {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

test("CT-153-29 the service is ended at its limit", { skip: !GROUPS_AVAILABLE && "process groups are unavailable (F153-FR-032)" }, async () => {
  const root = join(REPO_ROOT, "packages/cli/test/fixtures/loop-speed");
  const pidFile = join(root, "service-pids.txt");
  // Start from a clean PID file: a leftover from an earlier run would break
  // the two-pids assertion below.
  if (existsSync(pidFile)) rmSync(pidFile, { force: true });
  try {
    // The service's limit as this test shrinks it: 1 s, plus the runner's
    // grace of 2 s — the call resolves within limit + grace + 1 s.
    const service = checkRunnerServiceOf({
      workdir: root,
      profile: "default",
      timeLimitEnforced: true,
      timeLimitSec: 1,
    });
    const started = Date.now();
    const run = await service.run({
      argv: [process.execPath, FAKE, pidFile],
    });
    const elapsed = Date.now() - started;
    assert.ok(elapsed < (1 + 2 + 1) * 1_000, `the service resolved in ${String(elapsed)} ms`);
    assert.notEqual(run.status, 0, "the timed-out command is not a pass");
    assert.ok(run.stderr.includes("command timed out"));
    // Neither the fake nor its SIGTERM-ignoring grandchild stays behind.
    const pids = existsSync(pidFile)
      ? readFileSync(pidFile, "utf8")
          .split("\n")
          .filter((line) => line.trim() !== "")
          .map((line) => Number(line))
      : [];
    assert.equal(pids.length, 2, "the fake recorded two pids");
    for (const pid of pids) {
      assert.ok(await pidIsGone(pid), `pid ${String(pid)} is still alive`);
    }
  } finally {
    try {
      if (existsSync(pidFile)) for (const pid of readFileSync(pidFile, "utf8").split("\n").filter((l) => l.trim() !== "").map(Number)) {
        try { process.kill(-pid, "SIGKILL"); } catch { try { process.kill(pid, "SIGKILL"); } catch {} }
      }
    } catch {}
    // Leave no artifact behind in the fixture tree.
    rmSync(pidFile, { force: true });
  }
});

test("CT-153-5 switch off is today: the baseline spawnSync runs", async () => {
  const service = checkRunnerServiceOf({
    workdir: REPO_ROOT,
    profile: "default",
    timeLimitEnforced: false,
    timeLimitSec: 300,
  });
  const run = await service.run({ argv: [process.execPath, "-e", "process.exit(3)"] });
  assert.equal(run.status, 3);
  assert.equal(run.signal, null);
});
