/**
 * CT-152-17 (T134, T135) — the rule data is pinned and watched
 * (F152-FR-017; CQ-152-06 A).
 *
 * T134: the run record of a launched run holds `commitGateRulesHash`, equal to
 * the canonical hash of the engine's rule data and of the project's file —
 * the same value `hashOfCommitGateRules` answers.
 *
 * T135: a change of the rule data BETWEEN TWO PASS STARTS halts the run with
 * the blocked reason `source-changed`, exit 3, before the second pass starts.
 * The engine data a run reads is a copy the test points the run at (the seam
 * `SPECSTRIDE_COMMIT_GATE_RULES_ENGINE`), so no shipped file is touched.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildSnapshotRecord } from "../../cli/src/run-control/snapshot-writer.ts";
import { runFeature } from "../../cli/src/engine/run-feature.ts";
import {
  ENGINE_COMMIT_GATE_RULES_FILE,
  hashOfCommitGateRules,
  loadEngineCommitGateRules,
  parseCommitGateRules,
} from "@specstride/kernel/redactor/commit-gate-rules";

test("the hash is pinned", () => {
  const dir = mkdtempSync(join(tmpdir(), "ct-152-17-"));
  try {
    // The project adds one rule, so the hash covers both files.
    writeFileSync(
      join(dir, "specstride.commit-gate.json"),
      JSON.stringify({
        schema: "specstride.commit-gate-rules/1",
        version: "1.0.0",
        rules: [
          {
            rule: "proj-bearer",
            owner: "314",
            requirement: "F314-FR-001",
            reason: "a value of the shape of the credential pattern bearer must not be committed",
            effect: "block",
            match: { pattern: "bearer" },
          },
        ],
      }),
      "utf8",
    );
    const engine = loadEngineCommitGateRules();
    const project = parseCommitGateRules(
      readFileSync(join(dir, "specstride.commit-gate.json"), "utf8"),
      "project",
    );
    const hash = hashOfCommitGateRules(engine, project);
    // The run record of a launched run pins the hash beside the source hashes.
    const record = buildSnapshotRecord({
      runId: "run-1",
      createdAt: "2026-11-09T00:00:00Z",
      keys: [],
      sourceHashes: {},
      commitGateRulesHash: hash,
    });
    assert.equal(record.commitGateRulesHash, hash);
    assert.equal(
      record.commitGateRulesHash,
      hashOfCommitGateRules(loadEngineCommitGateRules(), project),
    );
    // Without a project file the hash is the engine's alone.
    const engineOnly = hashOfCommitGateRules(engine, null);
    assert.notEqual(engineOnly, hash);
    assert.equal(
      typeof ENGINE_COMMIT_GATE_RULES_FILE === "string" && ENGINE_COMMIT_GATE_RULES_FILE.length > 0,
      true,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the hash is pinned in the run record of a launched run", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ct-152-17-pin-"));
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
  // The project adds one rule, so the hash covers both files.
  const projectRules = {
    schema: "specstride.commit-gate-rules/1",
    version: "1.0.0",
    rules: [
      {
        rule: "proj-bearer",
        owner: "314",
        requirement: "F314-FR-001",
        reason: "a value of the shape of the credential pattern bearer must not be committed",
        effect: "block",
        match: { pattern: "bearer" },
      },
    ],
  };
  writeFileSync(join(work, "specstride.commit-gate.json"), JSON.stringify(projectRules), "utf8");
  writeFileSync(
    join(bin, "claude"),
    `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const out = process.env.STUB_DIR || ".";
const write_ = (name, text) => fs.writeFileSync(path.join(out, name), text);
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (critic) {
  const nonce = (prompt.match(/VERDICT ([0-9a-f]+)/g) || []).slice(-1)[0]?.split(" ")[1] || "0".repeat(16);
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  const evidence = /write (\\.\\S*?specstride\\S+?):/i.exec(prompt)[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`,
    "utf8",
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
    PAUSE: process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC,
    STUB_DIR: process.env.STUB_DIR,
  };
  try {
    process.env.HOME = dir;
    process.env.PATH = `${bin}:${before.PATH ?? ""}`;
    process.env.SPECSTRIDE_FEATURE = "001-one";
    process.env.SPECSTRIDE_PROPOSER = "claude";
    process.env.SPECSTRIDE_CRITIC = "claude";
    process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = "0";
    process.env.STUB_DIR = scratch;
    const exit = await runFeature({ argv: [], workdir: work });
    assert.equal(exit, 0, "the run of the ordinary-code fixture exits 0");
    // The control plane of the workspace (workspace-control-root.ts).
    const controlRoot = join(
      dir,
      ".specstride",
      "workspaces",
      createHash("sha256").update(work).digest("hex").slice(0, 16),
    );
    const runDirs = readdirSync(join(controlRoot, "runs")).filter((name) =>
      name.startsWith("run-"),
    );
    assert.equal(runDirs.length, 1, "one run dir holds the record");
    const snapshotPath = join(controlRoot, "runs", runDirs[0]!, "snapshot.json");
    const record = JSON.parse(readFileSync(snapshotPath, "utf8")) as {
      schema: string;
      commitGateRulesHash?: string;
    };
    assert.equal(record.schema, "specstride.snapshot/1");
    const engine = loadEngineCommitGateRules();
    const project = parseCommitGateRules(
      readFileSync(join(work, "specstride.commit-gate.json"), "utf8"),
      "project",
    );
    assert.equal(
      record.commitGateRulesHash,
      hashOfCommitGateRules(engine, project),
      "the run record pins the hash of the rule data in force",
    );
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete (process.env as Record<string, unknown>)[key];
      else (process.env as Record<string, unknown>)[key] = value;
    }
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a change mid-run halts with source-changed, exit 3", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ct-152-17-run-"));
  const bin = join(dir, "bin");
  const work = join(dir, "work");
  const scratch = join(dir, "scratch");
  const engineCopy = join(dir, "engine-v1.json");
  mkdirSync(bin);
  mkdirSync(scratch);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  copyFileSync(
    join(import.meta.dirname, "../../cli/test/fixtures/commit-gate/ordinary-code/tasks.md"),
    join(work, "specs", "001-one", "tasks.md"),
  );
  writeFileSync(join(work, "package.json"), JSON.stringify({ scripts: { test: 'node -e ""' } }));
  copyFileSync(ENGINE_COMMIT_GATE_RULES_FILE, engineCopy);
  // The stub: the proposer's FIRST pass changes the engine rule data (a rule
  // is added) and writes no phase evidence, so the loop starts a second pass;
  // the check BEFORE the second pass reads the changed hash and halts. The
  // critic approves, every time.
  writeFileSync(
    join(bin, "claude"),
    `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const out = process.env.STUB_DIR || ".";
const write_ = (name, text) => fs.writeFileSync(path.join(out, name), text);
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (critic) {
  const nonce = (prompt.match(/VERDICT ([0-9a-f]+)/g) || []).slice(-1)[0]?.split(" ")[1] || "0".repeat(16);
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  const passes = Number(fs.existsSync(path.join(out, "proposer-count")) ? fs.readFileSync(path.join(out, "proposer-count"), "utf8") : "0", 10) + 1;
  write_("proposer-count", String(passes));
  write_("seen-by-proposer-" + String(passes) + ".txt", prompt);
  if (passes === 1) {
    // THE CHANGE OF THE RULE DATA, between pass 1 and pass 2.
    const file = process.env.STUB_RULES_FILE;
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    data.rules.push({ rule: "proj-late", owner: "314", requirement: "F314-FR-002", reason: "added while the run was working", effect: "block", match: { pattern: "bearer" } });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }
  if (passes >= 2) {
    const evidence = /write (\\.\\S*?specstride\\S+?):/i.exec(prompt)[1];
    fs.mkdirSync(path.dirname(evidence), { recursive: true });
    fs.writeFileSync(evidence, "T001 done\\n");
  }
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`,
    "utf8",
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
    RULES: process.env.SPECSTRIDE_COMMIT_GATE_RULES_ENGINE,
    STUB_RULES: process.env.STUB_RULES_FILE,
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
    process.env.STUB_RULES_FILE = engineCopy;
    process.env.SPECSTRIDE_COMMIT_GATE_RULES_ENGINE = engineCopy;
    const exit = await runFeature({ argv: [], workdir: work });
    assert.equal(exit, 3, "the run halts with exit 3");
    // The second pass never started: one proposer pass only, no evidence, and
    // the phase is not approved.
    assert.equal(readFileSync(join(scratch, "proposer-count"), "utf8"), "1");
    assert.equal(
      existsJoin(work, ".specstride", "evidence"),
      false,
      "no phase evidence was written",
    );
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete (process.env as Record<string, unknown>)[key];
      else (process.env as Record<string, unknown>)[key] = value;
    }
    rmSync(dir, { recursive: true, force: true });
  }
});

import { existsSync } from "node:fs";
function existsJoin(...parts: string[]): boolean {
  return existsSync(join(...parts));
}
