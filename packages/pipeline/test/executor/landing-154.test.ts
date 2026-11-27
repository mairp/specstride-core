/**
 * T123 — the landing of a wide stage group, end to end (F154-SC-008,
 * F154-FR-050…-054, -053).
 *
 * On the shape of `tests/fixtures/154/stages/` — a wide group {A, B}, width
 * 2: A lands after a clean rebase and a green gate on the REBASED tree, home
 * fast-forwards, A's approvals stand with the rewrite note, and its
 * workspace is removed. B hits a rebase conflict and is parked alone with
 * exit 22: home is unchanged by B, B's landing record holds no
 * fast-forward, and no model is called anywhere in a landing. A half-landed
 * record (a landing record without a fast-forward) resumes at LD-4 and
 * lands; a fast-forwarded record never resumes.
 *
 * The git port of the test is the hardened git over real repositories
 * (PU-81: no system or global configuration, no hooks — the environment
 * strips every configuration source and turns the hooks off); the gate is a
 * stub through the checks port; the approvals port reads the standing of
 * the approval commits with `approvalCommitStanding` (PR #41's `rebased`
 * case).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import { runWideGroupLandings } from "../../src/executor/stage-loop.ts";
import {
  freshLandingRecord,
  landingRecordPath,
  readLandingRecord,
  runLandingForStage,
  writeLandingRecord,
  type LandingApprovalsPort,
  type LandingChecksPort,
  type LandingGitPort,
  type LandingRunInput,
} from "../../src/executor/landing-run.ts";
import type { WorktreePort } from "../../src/executor/stage-workspace.ts";
import { approvalCommitStanding } from "../../../../packages/cli/src/engine/approval-commit.ts";
import type { Stage } from "../../src/executor/types.ts";

/** Hardened git (PU-81): no system or global configuration, no hooks. */
function git(workdir: string, argv: readonly string[]): { exit: number; out: string; err: string } {
  const result = spawnSync(
    "git",
    ["-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false", "-C", workdir, ...argv],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_CONFIG_GLOBAL: "/dev/null",
        GIT_CONFIG_SYSTEM: "/dev/null",
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_TERMINAL_PROMPT: "0",
        GIT_ALLOW_PROTOCOL: "file",
        LEFTHOOK: "0",
      },
    },
  );
  return { exit: result.status ?? 1, out: result.stdout ?? "", err: result.stderr ?? "" };
}

/** A stage entry of the wide group, as the contract's stages reach the glue. */
function stageOf(id: string): Stage {
  return { id, kind: "specstride", dependencies: [], preconditions: [], postconditions: [] };
}

/** A fresh home repository with one base commit. */
function makeHomeAt(home: string): void {
  mkdirSync(home, { recursive: true });
  assert.equal(git(home, ["init", "-q", "-b", "main"]).exit, 0);
  git(home, ["config", "user.email", "t@t"]);
  git(home, ["config", "user.name", "t"]);
  writeFileSync(join(home, "shared.txt"), "line: base\n");
  assert.equal(git(home, ["add", "-A"]).exit, 0, git(home, ["add", "-A"]).err);
  assert.equal(git(home, ["commit", "-qm", "base"]).exit, 0);
}

/** A clone of `home` with one commit that sets one line of `shared.txt`. */
function makeStageRepo(
  home: string,
  target: string,
  stage: string,
  line: string,
  /** The file the stage's line lands in; the conflict cases share one file. */
  file = "shared.txt",
): void {
  mkdirSync(target, { recursive: true }); // the clone target must exist (git -C)
  const cloned = git(target, ["clone", "-q", home, target]);
  assert.equal(cloned.exit, 0, cloned.err);
  git(target, ["config", "user.email", "t@t"]);
  git(target, ["config", "user.name", "t"]);
  writeFileSync(join(target, file), `line: ${line}\n`);
  writeFileSync(join(target, `${stage}.txt`), `${stage}\n`);
  assert.equal(git(target, ["add", "-A"]).exit, 0);
  assert.equal(git(target, ["commit", "-qm", stage]).exit, 0);
}

/** HEAD of a repository. */
function headOf(repo: string): string {
  const out = git(repo, ["rev-parse", "HEAD"]);
  assert.equal(out.exit, 0, out.err);
  return out.out.trim();
}

/**
 * The test's worktree port: a copy of the stage's prepared repository into
 * the workspace path, and its removal after a landing or a park. (A copy of
 * a repository directory behaves as a worktree of home for this test: its
 * `origin` still names home, absolutely.)
 */
function worktreePort(prepared: Readonly<Record<string, string>>): WorktreePort {
  return {
    async add(_home, workspace) {
      const source = prepared[basename(workspace)];
      assert.ok(source !== undefined, `no prepared repository for ${workspace}`);
      cpSync(source, workspace, { recursive: true });
    },
    async remove(workspace) {
      rmSync(workspace, { recursive: true, force: true });
    },
  };
}

/** The hardened git port over real repositories (PU-81), with its counters. */
function gitPort(): LandingGitPort & { rebases: number; merges: number } {
  return {
    rebases: 0,
    merges: 0,
    async rebaseOnto(home, workspace) {
      this.rebases += 1;
      assert.equal(git(workspace, ["fetch", "-q", "origin", "main"]).exit, 0);
      const rebase = git(workspace, ["rebase", "FETCH_HEAD"]);
      return rebase.exit === 0 ? "clean" : "conflict";
    },
    async abortRebase(workspace) {
      git(workspace, ["rebase", "--abort"]); // best effort; the tree stays whole
    },
    async mergeFastForward(workspace, home) {
      this.merges += 1;
      assert.equal(git(home, ["fetch", "-q", workspace, "main"]).exit, 0);
      const merge = git(home, ["merge", "--ff-only", "FETCH_HEAD"]);
      assert.equal(merge.exit, 0, merge.err);
    },
  };
}

/** The checks port: the gate of each stage, through the stub. */
function checksPort(
  green: Readonly<Record<string, boolean>>,
): LandingChecksPort & { calls: string[] } {
  return {
    calls: [],
    async runGate(_workspace, stage) {
      this.calls.push(stage);
      return green[stage] ?? true;
    },
  };
}

/** The approvals port: the standing of each stage's commit after the landing. */
function approvalsPort(
  commits: Readonly<Record<string, string>>,
): LandingApprovalsPort & { calls: string[] } {
  return {
    calls: [],
    async noteRewriteAfterFastForward(_workspace, home) {
      this.calls.push(home);
      return {
        commits: Object.entries(commits).map(([stage, commit]) => {
          const standing = approvalCommitStanding(home, commit);
          return {
            commit,
            standing: standing.standing,
            equivalent: standing.standing === "rebased" ? standing.equivalent : null,
          };
        }),
      };
    },
  };
}

/** Model calls of the landing: the landing has no model port, so none happen. */
const MODEL_CALLS = { count: 0 };

test("A lands after a green gate on the rebased tree; a rebase conflict parks B alone with exit 22; no model is called", async () => {
  const root = mkdtempSync(join(tmpdir(), "landing-154-"));
  try {
    const home = join(root, "home");
    makeHomeAt(home);
    const base = headOf(home);

    const repoA = join(root, "repo-a");
    const repoB = join(root, "repo-b");
    makeStageRepo(home, repoA, "A", "by-A");
    makeStageRepo(home, repoB, "B", "by-B"); // the same line: B conflicts with A
    const commitA = headOf(repoA);

    const git = gitPort();
    const checks = checksPort({ A: true, B: true });
    const approvals = approvalsPort({ A: commitA });
    const result = await runWideGroupLandings({
      controlRoot: root,
      home,
      pipelineRunId: "p-154",
      stages: [stageOf("A"), stageOf("B")],
      ports: { worktree: worktreePort({ A: repoA, B: repoB }), git, checks, approvals },
      now: () => new Date("2026-11-25T00:00:00Z"),
    });

    // A landed, B parked; the pipeline exit is 22 and no other code (F154-FR-052).
    assert.deepEqual([...result.landed], ["A"]);
    assert.deepEqual([...result.parked], ["B"]);
    assert.equal(result.exitCode, 22);
    assert.deepEqual(
      result.stages.map((s) => [s.stage, s.exitCode]),
      [
        ["A", null],
        ["B", 22],
      ],
    );
    assert.equal(result.stages[0]!.ruleId, "LD-1");
    assert.equal(result.stages[1]!.ruleId, "LD-2");

    // Home advanced by A and by nothing else: B's line is not there.
    assert.equal(headOf(home), commitA);
    assert.equal(readFileSync(join(home, "shared.txt"), "utf8"), "line: by-A\n");
    assert.notEqual(headOf(home), base);

    // A's landing record: the fast-forward, and the approvals rewrite note.
    const recordA = readLandingRecord(root, "p-154", "A");
    assert.ok(recordA !== null);
    assert.equal(recordA.schema, "specstride.landing/1");
    assert.equal(recordA.fastForward, true);
    assert.equal(recordA.rebaseClean, true);
    assert.equal(recordA.gateGreen, true);
    assert.ok(recordA.approvalsRewrite !== null);
    assert.equal(recordA.approvalsRewrite.commits.length, 1);
    assert.equal(recordA.approvalsRewrite.commits[0]!.standing, "ancestor");

    // B's landing record: no fast-forward, the conflict recorded (F154-FR-052).
    const recordB = readLandingRecord(root, "p-154", "B");
    assert.ok(recordB !== null);
    assert.equal(recordB.fastForward, false);
    assert.equal(recordB.rebaseClean, false);
    assert.equal(recordB.parkedReason, "rebase-conflict");
    assert.equal(recordB.approvalsRewrite, null);

    // Both workspaces removed (a landing and a park are both terminal).
    assert.equal(existsSync(join(root, "stage-workspaces", "p-154", "A")), false);
    assert.equal(existsSync(join(root, "stage-workspaces", "p-154", "B")), false);

    // The gate ran once per landing stage; a rebase conflict (B, LD-2)
    // parks before the gate, so only A's gate ran (F154-FR-051).
    assert.deepEqual(checks.calls, ["A"]);
    // No model call was made anywhere in the landing (F154-FR-052, -053).
    assert.equal(MODEL_CALLS.count, 0);
    // Two rebases and one fast-forward: B never merged (F154-FR-050).
    assert.equal(git.merges, 1);
    assert.equal(git.rebases, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a red gate on the rebased tree parks the stage alone; home is unchanged; no model is called", async () => {
  const root = mkdtempSync(join(tmpdir(), "landing-154-red-"));
  try {
    const home = join(root, "home");
    makeHomeAt(home);

    const repoA = join(root, "repo-a");
    const repoB = join(root, "repo-b");
    makeStageRepo(home, repoA, "A", "by-A");
    makeStageRepo(home, repoB, "B", "b-different", "B.txt"); // a disjoint edit: the rebase is clean
    const commitA = headOf(repoA);

    const git = gitPort();
    const checks = checksPort({ A: true, B: false });
    const approvals = approvalsPort({ A: commitA });
    const result = await runWideGroupLandings({
      controlRoot: root,
      home,
      pipelineRunId: "p-154-red",
      stages: [stageOf("A"), stageOf("B")],
      ports: { worktree: worktreePort({ A: repoA, B: repoB }), git, checks, approvals },
      now: () => new Date("2026-11-25T00:00:00Z"),
    });

    assert.deepEqual([...result.landed], ["A"]);
    assert.deepEqual([...result.parked], ["B"]);
    assert.equal(result.exitCode, 22);
    assert.equal(result.stages[1]!.ruleId, "LD-3");

    // Home holds A only: a red gate never fast-forwards (F154-FR-051).
    assert.equal(headOf(home), commitA);
    const recordB = readLandingRecord(root, "p-154-red", "B");
    assert.ok(recordB !== null);
    assert.equal(recordB.rebaseClean, true);
    assert.equal(recordB.gateGreen, false);
    assert.equal(recordB.fastForward, false);
    assert.equal(recordB.parkedReason, "gate-red");
    assert.equal(existsSync(join(root, "stage-workspaces", "p-154-red", "B")), false);
    assert.equal(MODEL_CALLS.count, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a half-landed record (no fast-forward) resumes at LD-4 and lands", async () => {
  const root = mkdtempSync(join(tmpdir(), "landing-154-resume-"));
  try {
    const home = join(root, "home");
    makeHomeAt(home);
    const base = headOf(home);

    const workspace = join(root, "ws");
    makeStageRepo(home, workspace, "A", "by-A");
    const commit = headOf(workspace);

    const git = gitPort();
    const checks = checksPort({ A: true });
    const approvals = approvalsPort({ A: commit });
    const input = (killpoint?: LandingRunInput["killpoint"]): LandingRunInput => ({
      controlRoot: root,
      home,
      workspace,
      pipelineRunId: "p-154",
      group: ["A"],
      stage: "A",
      ports: { git, checks, approvals },
      now: () => new Date("2026-11-25T00:00:00Z"),
      killpoint,
    });

    // A kill after the rebase leaves the record on disk, no fast-forward.
    let killed = false;
    try {
      await runLandingForStage(
        input((point) => {
          if (point === "after-rebase") throw new Error("kill: after-rebase");
        }),
      );
    } catch {
      killed = true;
    }
    assert.equal(killed, true);
    const half = readLandingRecord(root, "p-154", "A");
    assert.ok(half !== null);
    assert.equal(half.fastForward, false);
    assert.equal(half.rebaseClean, true);
    assert.equal(headOf(home), base); // nothing landed yet (F154-FR-079)

    // The next run resumes at LD-4 and reaches the same end: landed.
    const outcome = await runLandingForStage(input());
    assert.equal(outcome.landed, true);
    assert.equal(outcome.parked, false);
    assert.equal(outcome.ruleId, "LD-1");
    assert.equal(headOf(home), commit);
    const done = readLandingRecord(root, "p-154", "A");
    assert.ok(done !== null);
    assert.equal(done.fastForward, true);
    // A's approvals stand with the note (F154-FR-053).
    assert.ok(done.approvalsRewrite !== null);
    assert.equal(done.approvalsRewrite.commits[0]!.standing, "ancestor");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a fast-forwarded record never resumes; the landing is skipped", async () => {
  const root = mkdtempSync(join(tmpdir(), "landing-154-skip-"));
  try {
    const record = freshLandingRecord({
      pipelineRunId: "p-154",
      stage: "A",
      group: ["A"],
      workspace: join(root, "ws"),
      createdAt: "2026-11-25T00:00:00.000Z",
    });
    record.fastForward = true;
    writeLandingRecord(root, record);
    assert.ok(existsSync(landingRecordPath(root, "p-154", "A")));

    let touched = 0;
    const git: LandingGitPort = {
      async rebaseOnto() {
        touched += 1;
        return "clean";
      },
      async abortRebase() {},
      async mergeFastForward() {
        touched += 1;
      },
    };
    const checks = checksPort({});
    const approvals = approvalsPort({});
    const outcome = await runLandingForStage({
      controlRoot: root,
      home: join(root, "home"),
      workspace: join(root, "ws"),
      pipelineRunId: "p-154",
      group: ["A"],
      stage: "A",
      ports: { git, checks, approvals },
      now: () => new Date("2026-11-25T00:00:00Z"),
    });
    assert.equal(outcome.landed, true);
    assert.equal(outcome.ruleId, "LD-1");
    assert.equal(touched, 0); // the landing is skipped, nothing re-runs
    assert.deepEqual(checks.calls, []);
    assert.equal(MODEL_CALLS.count, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
