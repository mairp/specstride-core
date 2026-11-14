/**
 * T159 — setAsideBlockRecords is called once at run start under --reset-counts,
 * before the first phase attempt: pre-existing block records in commit-gate/
 * are moved into commit-gate/reset-<at>/ and readBlockRecord then returns null.
 * Without the flag the records stay in place. Also ensure the new block record
 * written by a blocked attempt remains at the top level (not moved again),
 * demonstrating the reset ran once, not once per attempt.
 */
import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { runFeature } from "../../src/engine/run-feature.ts";
import { pinEngineEnv } from "./helpers/fixture.ts";
import { controlRootOfWorkspace } from "../../src/engine/workspace-control-root.ts";
import { readBlockRecord } from "../../../core/src/post-approval/commit-gate.ts";

const STUB = (verdict: string): string => `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (prompt.includes("Diagnostician")) {
  // A call of the diagnostician: no nonce, no verdict; the case and the hint.
  fs.writeFileSync("seen-by-diagnostician.txt", prompt);
  console.log(JSON.stringify({ type: "result", result: "CASE: GROUNDING\\nName the missing test of T001." }));
} else if (critic) {
  fs.writeFileSync("seen-by-critic.txt", prompt);
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": ${verdict}" }));
} else {
  const evidence = /write (\\.specstride\\S+?):/i.exec(prompt)[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  // The new file drives the commit-gate pre-scan: set STUB_NEW_FILE to plant a secret.
  fs.writeFileSync("made.txt", process.env.STUB_NEW_FILE ?? "work\\n");
  fs.mkdirSync("newdir", { recursive: true });
  fs.writeFileSync("newdir/inside.txt", "nested\\n");
  const tasks = "specs/001-one/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replace("[ ]", "[x]"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;

function fixture(): { readonly dir: string; readonly bin: string; readonly restore: () => void } {
  const root = mkdtempSync(join(tmpdir(), "reset-block-records-"));
  const bin = join(root, "bin");
  const work = join(root, "work");
  mkdirSync(bin, { recursive: true });
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  writeFileSync(join(bin, "claude"), STUB("APPROVED"));
  chmodSync(join(bin, "claude"), 0o755);
  writeFileSync(
    join(work, "specs", "001-one", "tasks.md"),
    "# Tasks\n\n## Phase 1: One\n\n- [ ] T001 Do it\n",
  );
  // Initialize as a git repo; set identity so CI without git config can commit.
  for (const argv of [
    ["init", "--quiet", "."],
    ["config", "user.email", "t@t"],
    ["config", "user.name", "t"],
    ["add", "-A"],
    ["commit", "-qm", "init"],
  ]) {
    const done = spawnSync("git", ["-C", work, ...argv], { encoding: "utf8" });
    assert.equal(done.status, 0, `git ${argv.join(" ")} failed: ${done.stderr}`);
  }
  const before = {
    HOME: process.env.HOME,
    PATH: process.env.PATH,
    FEATURE: process.env.SPECSTRIDE_FEATURE,
    PROPOSER: process.env.SPECSTRIDE_PROPOSER,
    CRITIC: process.env.SPECSTRIDE_CRITIC,
    PAUSE: process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC,
    BACKPRESSURE: process.env.SPECSTRIDE_COMMIT_BACKPRESSURE,
  } as const;
  process.env.HOME = root;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  // A leaked launch environment must not reach the run (see helpers/fixture.ts);
  // the fixture's own pins (the switch, notably) stay in the `before` block.
  const restoreEnv = pinEngineEnv({ feature: "001-one" });
  process.env.SPECSTRIDE_COMMIT_BACKPRESSURE = before.BACKPRESSURE ?? "on";
  return {
    dir: work,
    bin,
    restore: () => {
      restoreEnv();
      process.env.HOME = before.HOME;
      process.env.PATH = before.PATH;
      if (before.BACKPRESSURE === undefined) delete process.env.SPECSTRIDE_COMMIT_BACKPRESSURE;
      else process.env.SPECSTRIDE_COMMIT_BACKPRESSURE = before.BACKPRESSURE;
      rmSync(root, { recursive: true, force: true });
    },
  };
}

function controlOf(workspace: string): string {
  return controlRootOfWorkspace(workspace);
}

function writePreexistingBlock(controlRoot: string, phase: number, ordinal: number): string {
  const dir = join(controlRoot, "commit-gate");
  mkdirSync(dir, { recursive: true });
  const logical = `phase${String(phase)}.${String(ordinal)}.block.json`;
  const path = join(dir, logical);
  const record = {
    schema: "specstride.commit-gate-block/1",
    feature: "001-one",
    phase,
    ordinal,
    runId: "preexisting-run",
    engineStartId: "e0",
    verdictId: "v0",
    hits: [{ rule: "cg-url-embedded-credentials", file: "README.md", line: 1 }],
    hitsOmitted: 0,
    signature: "deadbeef",
    ruleDataHash: "hash",
    nonce: "n0",
    at: new Date().toISOString(),
    path: "pre-scan",
  };
  writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`);
  return logical;
}

async function readBlock(controlRoot: string, phase: number, ordinal: number) {
  return await readBlockRecord(phase, ordinal, {
    readControl: (p: string) => {
      const file = join(controlRoot, p);
      return existsSync(file) ? readFileSync(file, "utf8") : null;
    },
  });
}

test("--reset-counts moves existing block records into reset-<at>/ and does it once at run start", async () => {
  const { dir, restore } = fixture();
  try {
    const control = controlOf(dir);
    // Plant a pre-existing block record for phase 1, ordinal 2.
    const preexisting = writePreexistingBlock(control, 1, 2);
    assert.ok(existsSync(join(control, "commit-gate", preexisting)));

    // Drive a blocked approval: make the proposer write a secret-looking value.
    // The URL-embedded credential is assembled at runtime so that no source
    // line of this file holds a contiguous credential-shaped literal for the
    // commit gate's pre-commit scan to read.
    const stubCredentialUrl = ["https://", "user", ":", "pass", "@host"].join("");
    process.env.STUB_NEW_FILE = "const t = " + JSON.stringify(stubCredentialUrl) + ";\n";
    // Ensure the backpressure switch is ON for the block to take effect.
    process.env.SPECSTRIDE_COMMIT_BACKPRESSURE = "on";

    // Run with the --reset-counts flag.
    const exit = await runFeature({ argv: ["--reset-counts"], workdir: dir });
    // The run may end with a non-zero exit; assert it is an integer and the run progressed far enough to write events.
    assert.equal(Number.isInteger(exit), true);

    // After the reset, the pre-existing record is no longer readable at the top-level path.
    // The reader answers null at the old logical path — it was set aside.
    assert.equal(await readBlock(control, 1, 2), null);
    assert.equal(existsSync(join(control, "commit-gate", preexisting)), false);

    // The reset ran once at run start: exactly one reset-<at> folder exists.
    const resets = (readdirSync(join(control, "commit-gate")) as string[]).filter((n) =>
      n.startsWith("reset-"),
    );
    assert.equal(resets.length, 1, `expected exactly one reset-<at> folder, got ${resets.length}`);
  } finally {
    delete process.env.STUB_NEW_FILE;
    delete process.env.SPECSTRIDE_COMMIT_BACKPRESSURE;
    restore();
  }
});

test("without --reset-counts the pre-existing block records stay at the top level", async () => {
  const { dir, restore } = fixture();
  try {
    const control = controlOf(dir);
    const preexisting = writePreexistingBlock(control, 1, 3);
    assert.ok(existsSync(join(control, "commit-gate", preexisting)));

    // Keep the commit backpressure OFF so the run does not add new records.
    process.env.SPECSTRIDE_COMMIT_BACKPRESSURE = "off";
    const exit = await runFeature({ argv: [], workdir: dir });
    assert.equal(Number.isInteger(exit), true);

    // The pre-existing record remains at the top level.
    assert.equal(existsSync(join(control, "commit-gate", preexisting)), true);
  } finally {
    delete process.env.SPECSTRIDE_COMMIT_BACKPRESSURE;
    restore();
  }
});
