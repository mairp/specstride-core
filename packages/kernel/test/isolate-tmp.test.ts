/**
 * The private /tmp of an isolated run (the ENOSPC of 2026-11-17: the suites'
 * mkdtemp fixtures accumulated into the millions across an unattended
 * campaign and the host's tmpfs ran out of inodes). The namespace's tmpfs
 * makes each run hermetic: what one run leaves behind, no other run — and
 * no process outside — can see, and the space is freed with the namespace.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const isolate = join(
  dirname(dirname(dirname(fileURLToPath(import.meta.url)))),
  "..",
  "tests",
  "isolate.ts",
);

/** Whether the conditions hold under which isolate.ts builds the namespace. */
function isolationApplies(): boolean {
  return (
    process.platform === "linux" &&
    typeof process.getuid === "function" &&
    process.getuid() === 0 &&
    process.env.SPECSTRIDE_TEST_NO_ISOLATE === undefined &&
    process.env.SPECSTRIDE_TEST_ISOLATED === undefined
  );
}

test(
  "a private /tmp: what one isolated run leaves, the next isolated run cannot see",
  (t) => {
    if (!isolationApplies()) {
      t.skip("isolation does not apply here (not root, already nested, or opted out)");
      return;
    }
    const marker = `isolate-tmp-probe-${String(process.pid)}-${String(Date.now())}`;
    // The first run writes a marker into what it believes is /tmp...
    const first = spawnSync(
      process.execPath,
      [isolate, "/bin/sh", "-c", `echo seeded > "/tmp/${marker}.txt"`],
      { encoding: "utf8" },
    );
    assertFirst(first, marker);
    // ...and the second run, a WHOLE new namespace with a whole new tmpfs,
    // finds nothing of it: the first run's leftovers are gone with it.
    const second = spawnSync(
      process.execPath,
      [isolate, "/bin/sh", "-c", `test ! -e "/tmp/${marker}.txt"`],
      { encoding: "utf8" },
    );
    assert.strictEqual(second.status, 0, `the marker leaked across runs: ${second.stderr}`);
  },
  { timeout: 60_000 },
);

/** The first probe step: the marker was written into the run's own /tmp. */
function assertFirst(result: ReturnType<typeof spawnSync>, marker: string): void {
  assert.strictEqual(
    result.status,
    0,
    `the run could not use its own /tmp for the marker ${marker}: ${result.stderr}`,
  );
}
