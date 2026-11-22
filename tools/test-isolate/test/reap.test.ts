/**
 * The stale mkdtemp fixture reaping of tests/isolate.ts.
 *
 * Every suite invocation goes through tests/isolate.ts. When a suite crashes —
 * or ends while a child still holds its fixture directory — the directory is
 * leaked forever: nothing else sweeps tmp, and the leaks accumulate (2026-11-17
 * 01:23–01:31Z: ~2234 stale `specstride-*` directories pushed /tmp inodes
 * toward ENOSPC and stalled the running engine's own fixture creation). The
 * wrapper reaps entries that match the repository's mkdtemp shapes AND are
 * older than the age floor; the floor keeps every live suite's directories.
 *
 * The reaped directory is injectable (SPECSTRIDE_TEST_REAP_DIR) so this test
 * builds its own container under /tmp instead of racing the host's real tmp.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..", "..");
const isolate = join(repoRoot, "tests", "isolate.ts");
const PAST = Date.now() - 40 * 60 * 1000; // 40 minutes ago: over the 30-minute floor
const STALE = "OldStu";
const FRESH = "nEwFre";

const makeContainer = () => {
  const container = mkdtempSync(join(tmpdir(), "reaptest-"));
  const backdate = (path) => utimesSync(path, new Date(PAST), new Date(PAST));
  // Reaped: repository mkdtemp shapes, over the age floor.
  mkdirSync(join(container, `specstride-loop-speed-${STALE}`));
  backdate(join(container, `specstride-loop-speed-${STALE}`));
  mkdirSync(join(container, `par-tail-state-4-moved-${STALE}`));
  backdate(join(container, `par-tail-state-4-moved-${STALE}`));
  mkdirSync(join(container, `par4-stop-mount-${STALE}`));
  backdate(join(container, `par4-stop-mount-${STALE}`));
  mkdirSync(join(container, `specstride-gate-batch-${STALE}`));
  backdate(join(container, `specstride-gate-batch-${STALE}`));
  // Kept: fresh directories of the same shapes — a live suite's fixtures.
  mkdirSync(join(container, `specstride-loop-speed-${FRESH}`));
  mkdirSync(join(container, `par-counters-door-${FRESH}`));
  // Kept: wrong family, wrong shape, wrong type.
  mkdirSync(join(container, `dsh-subprocess-${STALE}`));
  backdate(join(container, `dsh-subprocess-${STALE}`));
  mkdirSync(join(container, `not-a-fixture-${STALE}`));
  backdate(join(container, `not-a-fixture-${STALE}`));
  mkdirSync(join(container, `specstride-fingerprint-OldStu1x`));
  backdate(join(container, `specstride-fingerprint-OldStu1x`));
  writeFileSync(join(container, `specstride-reading-${STALE}`), "a file, not a directory");
  backdate(join(container, `specstride-reading-${STALE}`));
  const guarded = mkdtempSync(join(tmpdir(), "reapguarded-"));
  symlinkSync(guarded, join(container, `specstride-micro-${STALE}`));
  return { container, guarded };
};

const runIsolate = (container) =>
  spawnSync("node", [isolate, "node", "-e", "process.exit(0)"], {
    env: {
      ...process.env,
      SPECSTRIDE_TEST_REAP_DIR: container,
      SPECSTRIDE_TEST_NO_ISOLATE: "1", // the sweep runs before isolation; nesting is irrelevant here
    },
    encoding: "utf8",
  });

test("stale repository-shaped fixture directories are reaped; everything else is kept", () => {
  const { container, guarded } = makeContainer();
  try {
    const result = runIsolate(container);
    assert.equal(result.status, 0, `isolate failed: ${result.stderr}`);
    // Reaped.
    assert.equal(existsSync(join(container, `specstride-loop-speed-${STALE}`)), false);
    assert.equal(existsSync(join(container, `par-tail-state-4-moved-${STALE}`)), false);
    assert.equal(existsSync(join(container, `par4-stop-mount-${STALE}`)), false);
    assert.equal(existsSync(join(container, `specstride-gate-batch-${STALE}`)), false);
    // Kept: fresh — the age floor protects live suites.
    assert.equal(existsSync(join(container, `specstride-loop-speed-${FRESH}`)), true);
    assert.equal(existsSync(join(container, `par-counters-door-${FRESH}`)), true);
    // Kept: outside the repository's fixture families and shapes.
    assert.equal(existsSync(join(container, `dsh-subprocess-${STALE}`)), true);
    assert.equal(existsSync(join(container, `not-a-fixture-${STALE}`)), true);
    assert.equal(existsSync(join(container, `specstride-fingerprint-OldStu1x`)), true);
    // Kept: not a directory.
    assert.equal(existsSync(join(container, `specstride-reading-${STALE}`)), true);
    // Kept: a symlink is not recursed, and its target survives untouched.
    assert.equal(existsSync(join(container, `specstride-micro-${STALE}`)), true);
    assert.equal(existsSync(guarded), true);
    // The reaping is announced, so an operator can audit what was removed.
    assert.match(result.stderr, /reaped stale fixture/);
  } finally {
    rmSync(container, { recursive: true, force: true });
    rmSync(guarded, { recursive: true, force: true });
  }
});

test("a fresh container is left alone entirely", () => {
  const { container } = makeContainer();
  // Backdate nothing extra: undo the backdating to simulate a live suite.
  for (const name of [
    `specstride-loop-speed-${STALE}`,
    `par-tail-state-4-moved-${STALE}`,
    `par4-stop-mount-${STALE}`,
    `specstride-gate-batch-${STALE}`,
  ]) {
    utimesSync(join(container, name), new Date(), new Date());
  }
  try {
    const result = runIsolate(container);
    assert.equal(result.status, 0);
    assert.doesNotMatch(result.stderr, /reaped stale fixture/);
    assert.equal(existsSync(join(container, `specstride-loop-speed-${STALE}`)), true);
    assert.equal(existsSync(join(container, `par-tail-state-4-moved-${STALE}`)), true);
    assert.equal(existsSync(join(container, `par4-stop-mount-${STALE}`)), true);
    assert.equal(existsSync(join(container, `specstride-gate-batch-${STALE}`)), true);
  } finally {
    rmSync(container, { recursive: true, force: true });
  }
});

test("the reaper never leaves the tmp subtree", () => {
  // SPECSTRIDE_TEST_REAP_DIR outside /tmp is refused: the sweep must be
  // impossible to point at arbitrary host locations.
  const outside = mkdtempSync(join(repoRoot, "reap-outside-"));
  try {
    const result = spawnSync("node", [isolate, "node", "-e", "process.exit(0)"], {
      env: {
        ...process.env,
        SPECSTRIDE_TEST_REAP_DIR: outside,
        SPECSTRIDE_TEST_NO_ISOLATE: "1",
      },
      encoding: "utf8",
    });
    assert.equal(result.status, 0);
    assert.doesNotMatch(result.stderr, /reaped stale fixture/);
    assert.equal(existsSync(outside), true);
  } finally {
    rmSync(outside, { recursive: true, force: true });
  }
});
