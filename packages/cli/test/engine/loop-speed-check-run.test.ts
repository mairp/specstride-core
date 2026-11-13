/**
 * Phase 3 of feature 153 — the one adapter to the check runner
 * (`packages/cli/src/engine/check-run.ts`, seam S3 of plan.md).
 *
 * The cases:
 *  - T029 a passing command resolves with `passed: true`, exit code 0, no signal;
 *  - T030 a failing command keeps its exit code and both captured streams;
 *  - T031 no shell: a one-string argument list is never run through a shell —
 *    the runner's `cannot-start` result, never a pass (F153-FR-011);
 *  - T032 CT-153-29 — the enforced time limit gives the signal `TIMEOUT`,
 *    no exit code and `command timed out` on standard error (F153-FR-029);
 *  - T033 CT-153-30 — the whole process group is gone: both pids of the fake
 *    are dead, within the limit plus `GRACE_MS` plus slack (F153-FR-030,
 *    F153-SC-006);
 *  - T034 CT-153-30 — nothing outside the group is signalled: an unrelated
 *    child started before the run is still alive after it;
 *  - T035 the group cases skip on `win32` and are marked unverified on
 *    `darwin` (F153-FR-032, Principle XVII);
 *  - T041 the adapter is the only spawn of a check: it imports nothing from
 *    `node:child_process` (F153-FR-008).
 *
 * No paid or external model API is called (F153-FR-060): the commands are
 * `process.execPath` and the fake binaries of `test/fixtures/loop-speed/bin/`.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath } from "node:url";

/** The directory of this test file (Node 18/20 safe: no `import.meta.dirname`). */
const HERE = fileURLToPath(new URL(".", import.meta.url));

import { GRACE_MS } from "../../../check-runner/src/command/kind-command.ts";
import { EXEC_ERROR_SIGNAL } from "../../../check-runner/src/result/errors.ts";
import {
  runEngineCheck,
  spawnSyncShapeOf,
  timeLimitMsOf,
  type EngineCommand,
} from "../../src/engine/check-run.ts";

/** The state T032 leaves for T033 to assert on. */
let keepForGroupCases: {
  readonly dir: string;
  readonly pidFile: string;
  readonly durationMs: number;
} | undefined;

const FIXTURE_HANG = join(
  HERE,
  "../fixtures/loop-speed/bin/hang-with-grandchild.mjs",
);

/** A work directory for the commands of one case. */
function workDir(): string {
  return mkdtempSync(join(tmpdir(), "specstride-check-run-"));
}

function commandOf(
  argv: readonly string[],
  cwd: string,
  timeLimitMs = 30_000,
): EngineCommand {
  return { id: "check", argv, cwd, timeLimitMs, phase: 1 };
}

const PROFILE = "parity";

test("a passing command", async () => {
  const dir = workDir();
  try {
    const result = await runEngineCheck(
      commandOf([process.execPath, "-e", "process.exit(0)"], dir),
      PROFILE,
    );
    assert.equal(result.passed, true);
    assert.equal(result.exitCode, 0);
    assert.equal(result.signal, null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a failing command keeps its code and streams", async () => {
  const dir = workDir();
  try {
    const result = await runEngineCheck(
      commandOf(
        [
          process.execPath,
          "-e",
          "console.log('out'); console.error('err'); process.exit(3);",
        ],
        dir,
      ),
      PROFILE,
    );
    assert.equal(result.exitCode, 3);
    assert.equal(result.passed, false);
    assert.match(result.stdout, /out/);
    assert.match(result.stderr, /err/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("no shell", async () => {
  const dir = workDir();
  try {
    // One string that only a shell could split: the runner must refuse it,
    // not hand it to a shell (F153-FR-011, FIXED_SPAWN_OPTIONS.shell false).
    const result = await runEngineCheck(
      commandOf(["sh -c 'exit 0'"], dir),
      PROFILE,
    );
    assert.equal(result.passed, false);
    assert.equal(result.exitCode, null);
    assert.equal(result.signal, EXEC_ERROR_SIGNAL);
    assert.equal(result.error, "cannot-start");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// T035 — the group cases need process groups: skip on win32, unverified on
// darwin until a group kill is observed there (F153-FR-032, Principle XVII).
const GROUPS_UNAVAILABLE = "process groups are not available on this host";
const groupSkip =
  process.platform === "win32" ? { skip: GROUPS_UNAVAILABLE } : {};
const groupName =
  process.platform === "darwin"
    ? "CT-153-29 the limit gives TIMEOUT (unverified on darwin)"
    : "CT-153-29 the limit gives TIMEOUT";

test(groupName, groupSkip, async () => {
  const dir = workDir();
  const pidFile = join(dir, "pids.txt");
  try {
    // Under `npm test` the workspace's test files run in parallel, so the
    // fake's Node startup can itself exceed the 300 ms limit: it is then
    // timed out before it wrote its pids, which says nothing about the
    // group kill this case is about. Retry until the fake got far enough
    // to write its pids; every attempt still enforces the 300 ms limit,
    // and the limit itself is never widened. The retry budget is generous
    // because a loaded host can stall one Node startup for seconds, and
    // startup latency is not what this case measures.
    let result;
    const attempts = 24;
    for (let attempt = 1; ; attempt += 1) {
      rmSync(pidFile, { force: true });
      result = await runEngineCheck(
        commandOf([process.execPath, FIXTURE_HANG, pidFile], dir, 300),
        PROFILE,
      );
      if (existsSync(pidFile)) break;
      assert.equal(result.exitCode, null);
      assert.equal(result.signal, "TIMEOUT");
      assert.ok(
        attempt < attempts,
        `the fake never survived to write its pids in ${String(attempts)} attempts`,
      );
    }
    assert.equal(result.exitCode, null);
    assert.equal(result.signal, "TIMEOUT");
    assert.match(
      result.stderr,
      /command timed out[\s.]*$/,
      `standard error ends with the time-limit text, got: ${JSON.stringify(result.stderr)}`,
    );
    assert.ok(readFileSync(pidFile, "utf8").length > 0, "the fake wrote its pids");
    // The run's own duration, measured inside the runner from the spawn to
    // the settle — not the test harness's wall clock, which also holds the
    // scheduler's wait for a free core (F153-FR-029, F153-SC-006).
    keepForGroupCases = { dir, pidFile, durationMs: result.durationMs };
  } catch (thrown) {
    rmSync(dir, { recursive: true, force: true });
    throw thrown;
  }
});

test(
  process.platform === "darwin"
    ? "CT-153-30 the whole group is gone (unverified on darwin)"
    : "CT-153-30 the whole group is gone",
  { skip: process.platform === "win32" ? GROUPS_UNAVAILABLE : false },
  async () => {
  assert.ok(keepForGroupCases, "the TIMEOUT case has run");
  const pids = readFileSync(keepForGroupCases.pidFile, "utf8")
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => Number(line));
  assert.equal(pids.length, 2, "the fake wrote its pid and the grandchild's pid");
  for (const pid of pids) {
    assert.throws(
      () => process.kill(pid, 0),
      /ESRCH/,
      `pid ${String(pid)} of the group is still alive`,
    );
  }
  const bound = 300 + GRACE_MS + 1_000;
  assert.ok(
    keepForGroupCases.durationMs < bound,
    `the run took ${String(keepForGroupCases.durationMs)} ms, expected under ${String(bound)} ms`,
  );
  rmSync(keepForGroupCases.dir, { recursive: true, force: true });
});

test(
  process.platform === "darwin"
    ? "CT-153-30 nothing outside the group is signalled (unverified on darwin)"
    : "CT-153-30 nothing outside the group is signalled",
  { skip: process.platform === "win32" ? GROUPS_UNAVAILABLE : false },
  async () => {
    const dir = workDir();
    const bystander = spawn(
      process.execPath,
      ["-e", "setInterval(() => {}, 1_000);"],
      { stdio: "ignore" },
    );
    try {
      assert.ok(bystander.pid !== undefined, "the bystander started");
      const pidFile = join(dir, "pids.txt");
      await runEngineCheck(
        commandOf([process.execPath, FIXTURE_HANG, pidFile], dir, 300),
        PROFILE,
      );
      let alive = true;
      try {
        process.kill(bystander.pid, 0);
      } catch {
        alive = false;
      }
      assert.equal(alive, true, "the unrelated child was signalled");
    } finally {
      bystander.kill("SIGKILL");
      rmSync(dir, { recursive: true, force: true });
    }
  },
);

test("timeLimitMsOf", () => {
  assert.equal(timeLimitMsOf(300, 1_800_000), 300_000);
  assert.equal(timeLimitMsOf(undefined, 1_800), 1_800_000);
  // It never returns 0: a declaration of none or of zero falls back.
  assert.equal(timeLimitMsOf(0, 2), 2_000);
  assert.equal(timeLimitMsOf(undefined, 0), 1);
  // It never reads SPECSTRIDE_LIMITS: the same call gives the same number.
  const before = process.env.SPECSTRIDE_LIMITS;
  process.env.SPECSTRIDE_LIMITS = "off";
  try {
    assert.equal(timeLimitMsOf(5, 9), 5_000);
  } finally {
    if (before === undefined) delete process.env.SPECSTRIDE_LIMITS;
    else process.env.SPECSTRIDE_LIMITS = before;
  }
});

test("spawnSyncShapeOf", async () => {
  const dir = workDir();
  try {
    const result = await runEngineCheck(
      commandOf(
        [process.execPath, "-e", "console.log('out'); process.exit(3);"],
        dir,
      ),
      PROFILE,
    );
    const shape = spawnSyncShapeOf(result);
    assert.deepEqual(Object.keys(shape).sort(), [
      "signal",
      "status",
      "stderr",
      "stdout",
    ]);
    assert.equal(shape.status, 3);
    assert.equal(shape.signal, null);
    assert.match(shape.stdout, /out/);
    assert.equal(shape.stderr, "");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the adapter is the only spawn of a check", () => {
  // The adapter reads the engine command and calls the check runner; the
  // spawn itself is the runner's (F153-FR-008: logic behind typed units,
  // the CLI as wiring).
  const source = readFileSync(
    join(HERE, "../../src/engine/check-run.ts"),
    "utf8",
  );
  assert.doesNotMatch(source, /node:child_process/);
  assert.doesNotMatch(source, /\bspawnSync\s*\(/);
  assert.match(source, /runCommand\s*\(/);
});
