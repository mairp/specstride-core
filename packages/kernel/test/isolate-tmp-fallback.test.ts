/**
 * The mount-refused fallback of the private /tmp — the twin pin of
 * isolate-tmp.test.ts. The private mount is best effort: where the tmpfs
 * cannot be mounted the run falls back to the shared /tmp exactly as
 * before the private mount existed, and the RUN still works. Here the
 * mount cannot be had because no `mount` executable is on the PATH the
 * isolated run inherits — the same code path an environment without the
 * privilege takes — so the run must complete and its writes must land in
 * the shared /tmp, where the parent can see them.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
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
  "no mount on the PATH: the isolated run falls back to the shared /tmp and still works",
  (t) => {
    if (!isolationApplies()) {
      t.skip("isolation does not apply here (not root, already nested, or opted out)");
      return;
    }
    const unshare = spawnSync("sh", ["-c", "command -v unshare"], {
      encoding: "utf8",
    }).stdout?.trim();
    if (unshare === undefined || unshare === "") {
      t.skip("no unshare(1) to arm the namespace with");
      return;
    }
    // A PATH whose only entry can arm the namespace but cannot mount: the
    // namespace comes up, the tmpfs does not, and the fallback engages.
    const stubBin = mkdtempSync(join(tmpdir(), "isolate-fallback-path-"));
    symlinkSync(unshare, join(stubBin, "unshare"));
    const marker = `isolate-fallback-probe-${String(process.pid)}-${String(Date.now())}`;
    try {
      const run = spawnSync(
        process.execPath,
        [isolate, "/bin/sh", "-c", `echo seeded > "/tmp/${marker}.txt"`],
        { encoding: "utf8", env: { ...process.env, PATH: stubBin } },
      );
      assert.equal(
        run.status,
        0,
        `the run must work without the private mount, not fail: ${run.stderr}`,
      );
      assert.ok(
        existsSync(`/tmp/${marker}.txt`),
        "the fallback is the shared /tmp: the parent sees what the run wrote",
      );
    } finally {
      rmSync(`/tmp/${marker}.txt`, { force: true });
      rmSync(stubBin, { recursive: true, force: true });
    }
  },
  { timeout: 60_000 },
);
