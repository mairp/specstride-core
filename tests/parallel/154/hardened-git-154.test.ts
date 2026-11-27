/**
 * G8 T154 — PU-81 / F154-FR-071: the landing rebase runs under HARDENED git.
 *
 * The landing's `rebaseOnto` is the one step of the pipeline that can rewrite
 * a repository's history, so every git process it starts — directly and
 * through the machinery rebase itself runs underneath — must carry the
 * hardening of the one place that starts git (`packages/tree-store/src/git.ts`):
 * no system configuration, no global configuration, no hooks, no filter.
 *
 * HOW IT IS OBSERVED. A FAKE `git` executable is generated into a temporary
 * stub directory that is prepended to `PATH`, so every process the store's
 * real git port starts by the name `git` reaches the fake first. The fake
 * appends one JSONL line per invocation — the full argv it was handed and the
 * environment it would hand a child, i.e. the hardened environment the
 * caller built — and then delegates to the REAL git binary of the machine
 * (found before the PATH override is installed, so the delegation cannot
 * recurse) with the same argv and the same environment. The rebase therefore
 * actually proceeds; only its observation is intercepted.
 *
 * WHAT IS ASSERTED. Every logged invocation: `GIT_CONFIG_NOSYSTEM=1`,
 * `GIT_CONFIG_GLOBAL` and `GIT_CONFIG_SYSTEM` neutralised at `/dev/null`, no
 * `GIT_CONFIG`, no hostile `GIT_CONFIG_COUNT` (absent, zero, and no
 * `GIT_CONFIG_KEY_*` entries); the fixed `-c` prefix carrying
 * `core.hooksPath=/dev/null` and `core.attributesFile=/dev/null`; no
 * `filter.*` setting anywhere in argv or environment. Two belts over the
 * braces: a hostile hook planted in the repository is never run, and the
 * landing itself completes (`landed === true`), which proves the hardened
 * environment is not merely quiet but SUFFICIENT.
 *
 * HERMETIC: a private HOME under `mkdtemp`, the stub git dir prepended to
 * `PATH` of the test process only, real git underneath, everything removed in
 * `finally`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

import { runLandingForStage } from "../../../packages/pipeline/src/executor/landing-run.ts";
import { runGit, type GitResult } from "../../../packages/tree-store/src/git.ts";

/* ------------------------------------------------------------------ *
 * The real git binary, resolved BEFORE the PATH override exists.
 * ------------------------------------------------------------------ */

/** The real git the fake delegates to (resolved before PATH is changed). */
function theRealGit(): string {
  for (const candidate of ["/usr/bin/git", "/bin/git", "/usr/local/bin/git"]) {
    if (existsSync(candidate)) return candidate;
  }
  const fromPath = spawnSync("git", ["--version"], { encoding: "utf8" });
  assert.equal(fromPath.status, 0, "a real git must exist for the fake to delegate to");
  return "git";
}

/* ------------------------------------------------------------------ *
 * The fake git: log argv + env, then delegate to the real binary.
 * ------------------------------------------------------------------ */

type ObservedInvocation = {
  readonly argv: readonly string[];
  readonly env: Readonly<Record<string, string>>;
  /** The number of `GIT_CONFIG_KEY_*` entries the env carried. */
  readonly configCountEntries: number;
};

/**
 * The FAKE `git` executable. The log path and the real binary are baked in
 * literally: the hardened environment the fake receives is built from
 * nothing by the store, so it cannot carry a message to the fake through a
 * variable — the log path has to travel inside the script itself.
 */
function fakeGitScript(logPath: string, realGit: string): string {
  return `#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const { appendFileSync } = require("node:fs");
const argv = process.argv.slice(2);
const keys = [
  "GIT_CONFIG_NOSYSTEM", "GIT_CONFIG_GLOBAL", "GIT_CONFIG_SYSTEM",
  "GIT_CONFIG_COUNT", "GIT_CONFIG", "XDG_CONFIG_HOME",
  "GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "HOME", "PATH",
];
const env = {};
for (const key of keys) if (process.env[key] !== undefined) env[key] = process.env[key];
let entries = 0;
for (const key of Object.keys(process.env)) {
  if (/^GIT_CONFIG_KEY_\\d+$/.test(key)) entries += 1;
}
try {
  appendFileSync(${JSON.stringify(logPath)}, JSON.stringify({ argv, env, configCountEntries: entries }) + "\\n");
} catch {}
const child = spawnSync(${JSON.stringify(realGit)}, argv, { stdio: "inherit" });
process.exit(child.status === null ? 1 : child.status);
`;
}

/* ------------------------------------------------------------------ *
 * Reading the log back.
 * ------------------------------------------------------------------ */

function readLog(logPath: string): readonly ObservedInvocation[] {
  return readFileSync(logPath, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as ObservedInvocation);
}

/** The `-c key=value` settings an argv carries, in order. */
function configPairsOf(argv: readonly string[]): readonly string[] {
  const pairs: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "-c") pairs.push(argv[i + 1] ?? "");
  }
  return pairs;
}

/** The first non-option argument of the argv: git's command. */
function commandOf(argv: readonly string[]): string {
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--no-optional-locks") continue;
    if (argv[i] === "-c") {
      i += 1; // the value of the pair belongs to the settings, not the command
      continue;
    }
    if (argv[i].startsWith("-")) continue;
    return argv[i];
  }
  return "";
}

/* ------------------------------------------------------------------ *
 * The real git port of the landing: every call through the store's one
 * door (`runGit`), which names `git` on PATH — the fake.
 * ------------------------------------------------------------------ */

function realGitPort(): {
  rebaseOnto(home: string, workspace: string): Promise<"clean" | "conflict">;
  abortRebase(workspace: string): Promise<void>;
  mergeFastForward(workspace: string, home: string): Promise<void>;
} {
  const call = (argv: readonly string[], cwd: string): GitResult =>
    runGit({ argv, cwd, allowFailure: true });
  return {
    async rebaseOnto(home, workspace) {
      const tip = call(["rev-parse", "HEAD"], home);
      assert.equal(tip.status, 0, `home tip: ${tip.stderr}`);
      const rebase = call(["rebase", tip.stdout.trim()], workspace);
      return rebase.status === 0 ? "clean" : "conflict";
    },
    async abortRebase(workspace) {
      call(["rebase", "--abort"], workspace);
    },
    async mergeFastForward(workspace, home) {
      const tip = call(["rev-parse", "HEAD"], workspace);
      assert.equal(tip.status, 0, `workspace tip: ${tip.stderr}`);
      const merge = call(["merge", "--ff-only", tip.stdout.trim()], home);
      assert.equal(merge.status, 0, `fast-forward: ${merge.stderr}`);
    },
  };
}

/* ------------------------------------------------------------------ *
 * The test.
 * ------------------------------------------------------------------ */

test("G8 T154: the landing rebase runs every git invocation hardened (PU-81, F154-FR-071)", async () => {
  const root = mkdtempSync(join(tmpdir(), "hardened-git-154-"));
  const stubDir = join(root, "stub-git");
  const logPath = join(root, "git-invocations.jsonl");
  writeFileSync(logPath, "");
  mkdirSync(stubDir, { recursive: true });
  writeFileSync(join(stubDir, "git"), fakeGitScript(logPath, theRealGit()));
  chmodSync(join(stubDir, "git"), 0o755);

  // The original PATH, so the real binary is found before the override and
  // the environment of the test process itself is restored in `finally`.
  const originalPath = process.env["PATH"] ?? "";
  const originalHome = process.env["HOME"] ?? "";
  const home = join(root, "home");
  const repo = join(root, "repo");
  const workspace = join(root, "workspace");

  let landed = false;
  try {
    process.env["PATH"] = `${stubDir}:${originalPath}`;
    process.env["HOME"] = home; // private, empty: no global git configuration exists
    process.env["GIT_CONFIG_NOSYSTEM"] = "1"; // even the test's own process refuses the system config

    /* -- the repository: home and stage diverge from one commit -------- */
    const git = (argv: readonly string[], cwd: string): GitResult => {
      const result = runGit({ argv, cwd });
      assert.equal(result.status, 0, `git ${argv.join(" ")}: ${result.stderr}`);
      return result;
    };
    git(["init", "-b", "home", repo], root);
    writeFileSync(join(repo, "a.txt"), "a\n");
    git(["add", "a.txt"], repo);
    git(["commit", "-m", "base"], repo);
    git(["checkout", "-b", "stage"], repo);
    writeFileSync(join(repo, "b.txt"), "b\n");
    git(["add", "b.txt"], repo);
    git(["commit", "-m", "stage work"], repo);
    git(["checkout", "home"], repo);
    writeFileSync(join(repo, "c.txt"), "c\n");
    git(["add", "c.txt"], repo);
    git(["commit", "-m", "home moved on"], repo);
    git(["worktree", "add", workspace, "stage"], repo);

    // A HOSTILE HOOK planted where git looks by default: if hooks were not
    // disabled, the rebase would run it and leave the sentinel behind.
    const hooks = join(repo, ".git", "hooks");
    writeFileSync(
      join(hooks, "pre-rebase"),
      `#!/bin/sh\ntouch ${join(root, "HOOK-RAN")}\nexit 1\n`,
    );
    chmodSync(join(hooks, "pre-rebase"), 0o755);

    /* -- the landing: a real rebase through the real git port ---------- */
    const outcome = await runLandingForStage({
      controlRoot: join(root, "control"),
      home: repo,
      workspace,
      pipelineRunId: "p-154-g8",
      group: ["A"],
      stage: "A",
      ports: {
        git: realGitPort(),
        checks: {
          async runGate() {
            return true;
          },
        },
        approvals: {
          async noteRewriteAfterFastForward() {
            return { commits: [] };
          },
        },
      },
      now: () => new Date("2026-11-25T00:00:00Z"),
    });

    /* -- the landing completes: hardening is sufficient --------------- */
    landed = outcome.landed;
    assert.equal(outcome.landed, true, `landing parked: ${outcome.record.parkedReason}`);
    assert.equal(outcome.parked, false);
    assert.equal(outcome.ruleId, "LD-1");
    assert.equal(outcome.record.rebaseClean, true);
    assert.equal(outcome.record.gateGreen, true);
    assert.equal(outcome.record.fastForward, true);
    // home really moved: the fast-forwarded tip is the rebased stage tip.
    assert.equal(
      git(["rev-parse", "HEAD"], repo).stdout.trim(),
      git(["rev-parse", "HEAD"], workspace).stdout.trim(),
    );

    /* -- EVERY logged invocation is hardened -------------------------- */
    const log = readLog(logPath);
    assert.ok(log.length > 0, "the fake git must have observed the invocations");
    const commands = log.map((entry) => commandOf(entry.argv));
    assert.ok(
      commands.some((command) => command === "rebase"),
      `a rebase must have run through the fake; saw: ${commands.join(", ")}`,
    );

    for (const entry of log) {
      const label = `git ${entry.argv.slice(-3).join(" ")}`;

      // No system configuration.
      assert.equal(entry.env["GIT_CONFIG_NOSYSTEM"], "1", `${label}: GIT_CONFIG_NOSYSTEM`);

      // No global and no system configuration file.
      assert.equal(entry.env["GIT_CONFIG_GLOBAL"], "/dev/null", `${label}: GIT_CONFIG_GLOBAL`);
      assert.equal(entry.env["GIT_CONFIG_SYSTEM"], "/dev/null", `${label}: GIT_CONFIG_SYSTEM`);

      // No command-line configuration of the parent sneaking through.
      assert.equal("GIT_CONFIG" in entry.env, false, `${label}: GIT_CONFIG must be absent`);

      // No hostile include entries: GIT_CONFIG_COUNT absent or 0, and no
      // GIT_CONFIG_KEY_* entry behind it.
      const count = entry.env["GIT_CONFIG_COUNT"];
      if (count !== undefined) assert.equal(count, "0", `${label}: GIT_CONFIG_COUNT`);
      assert.equal(entry.configCountEntries, 0, `${label}: GIT_CONFIG_KEY_* entries`);

      // The global configuration is removed twice over: the home of the
      // process is a directory that does not exist.
      assert.equal(entry.env["HOME"], "/nonexistent/specstride-tree-store", `${label}: HOME`);
      assert.equal(
        entry.env["XDG_CONFIG_HOME"],
        "/nonexistent/specstride-tree-store/xdg",
        `${label}: XDG_CONFIG_HOME`,
      );

      // Hooks off, and no attributes file outside a tree can name a filter.
      const pairs = configPairsOf(entry.argv);
      if (pairs.length > 0) {
        assert.ok(pairs.includes("core.hooksPath=/dev/null"), `${label}: core.hooksPath`);
        assert.ok(pairs.includes("core.attributesFile=/dev/null"), `${label}: core.attributesFile`);
      }

      // No filter anywhere: no `-c` pair, no environment variable.
      for (const pair of pairs) {
        assert.equal(pair.startsWith("filter."), false, `${label}: filter config ${pair}`);
        assert.equal(
          pair.startsWith("core.attributesFile=") && pair !== "core.attributesFile=/dev/null",
          false,
          `${label}: attributes file`,
        );
      }
      for (const key of Object.keys(entry.env)) {
        assert.equal(key.startsWith("GIT_CONFIG_KEY_"), false, `${label}: ${key}`);
      }
      for (const argument of entry.argv) {
        assert.equal(argument.startsWith("filter."), false, `${label}: filter argv ${argument}`);
      }
    }

    // The belt: the hostile hook never ran.
    assert.equal(existsSync(join(root, "HOOK-RAN")), false, "the hostile hook must never run");
  } finally {
    process.env["PATH"] = originalPath;
    process.env["HOME"] = originalHome;
    delete process.env["GIT_CONFIG_NOSYSTEM"];
    rmSync(root, { recursive: true, force: true });
  }
  assert.equal(landed, true);
});
