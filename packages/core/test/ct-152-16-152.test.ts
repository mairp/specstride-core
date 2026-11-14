/**
 * CT-152-16 (T133) — a malformed project file refuses the launch
 * (F152-FR-016).
 *
 * The rule data of the commit gate is validated at every file boundary. A
 * `specstride.commit-gate.json` that does not parse refuses the LAUNCH with
 * exit 3, and the refusal names the project file. T009–T025 hold the schema
 * and the engine-file cases (kernel tests); this file holds the launch.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  commitGateRulesForTheLaunch,
  projectFileOf,
} from "../src/post-approval/commit-gate-launch.ts";
import { runFeature } from "../../cli/src/engine/run-feature.ts";

test("a malformed project file refuses the launch (the loader names the file)", () => {
  const root = mkdtempSync(join(tmpdir(), "ct-152-16-"));
  try {
    writeFileSync(projectFileOf(root), "{", "utf8");
    const refusal = commitGateRulesForTheLaunch(root, (path) => {
      try {
        return readFileSync(path, "utf8");
      } catch {
        return undefined;
      }
    });
    assert.equal(refusal.ok, false);
    if (refusal.ok) return;
    assert.equal(refusal.exitCode, 3);
    assert.match(refusal.file, /specstride\.commit-gate\.json$/);
    assert.match(refusal.message, /specstride\.commit-gate\.json/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a launch with a malformed project file exits 3 and says so", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ct-152-16-run-"));
  const bin = join(dir, "bin");
  const work = join(dir, "work");
  const scratch = join(dir, "scratch");
  mkdirSync(bin);
  mkdirSync(scratch);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  copyFileSync(
    join(import.meta.dirname, "../../cli/test/fixtures/commit-gate/ordinary-code/tasks.md"),
    join(work, "specs", "001-one", "tasks.md"),
  );
  writeFileSync(join(work, "package.json"), JSON.stringify({ scripts: { test: 'node -e ""' } }));
  // The malformed project file, at the root of the work tree.
  writeFileSync(join(work, "specstride.commit-gate.json"), "{", "utf8");
  copyFileSync(
    join(import.meta.dirname, "../../cli/test/fixtures/commit-gate/ordinary-code/stub-claude"),
    join(bin, "claude"),
  );
  chmodSync(join(bin, "claude"), 0o755);
  for (const argv of [
    ["init", "-q"],
    ["config", "user.email", "t@t"],
    ["config", "user.name", "t"],
    ["add", "-A"],
    ["commit", "-qm", "init"],
  ]) {
    spawnSync("git", ["-C", work, ...argv]);
  }
  const before = {
    HOME: process.env.HOME,
    PATH: process.env.PATH,
    FEATURE: process.env.SPECSTRIDE_FEATURE,
    PROPOSER: process.env.SPECSTRIDE_PROPOSER,
    CRITIC: process.env.SPECSTRIDE_CRITIC,
    STUB_DIR: process.env.STUB_DIR,
    PAUSE: process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC,
    LIMITS: process.env.SPECSTRIDE_LIMITS,
  };
  try {
    process.env.HOME = dir;
    process.env.PATH = `${bin}:${before.PATH ?? ""}`;
    process.env.SPECSTRIDE_FEATURE = "001-one";
    process.env.SPECSTRIDE_PROPOSER = "claude";
    process.env.SPECSTRIDE_CRITIC = "claude";
    process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = "0";
    delete process.env.SPECSTRIDE_LIMITS;
    process.env.STUB_DIR = scratch;
    const exit = await runFeature({ argv: [], workdir: work });
    assert.equal(exit, 3, "the launch is refused with exit 3");
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete (process.env as Record<string, unknown>)[key];
      else (process.env as Record<string, unknown>)[key] = value;
    }
  }
});
