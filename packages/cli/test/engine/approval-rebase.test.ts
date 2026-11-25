/**
 * The tree check of an approval across a rewrite of the history, with a stub
 * of the `claude` executable: an approval whose commit a rebase rewrote (the
 * same change under another name) still stands and is noted with both names;
 * a `git reset` past the approval commit still voids it (`failed: "tree"`);
 * an approval commit that is an ancestor of HEAD stands as before.
 *
 * REGRESSION — 152-commit-backpressure, 2026-11-11: the feature branch was
 * landed after a rebase that rewrote the approval commit of phase 1
 * (`6ddedbe` → `173bc704`, the same patch-id). Every later run found the
 * bound commit "gone from the history of the workspace" and began again at
 * phase 1, whose work was merged; with the limits off it never ended.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { approvalCommitStanding } from "../../src/engine/approval-commit.ts";
import { runFeature } from "../../src/engine/run-feature.ts";
import { controlRootOfWorkspace } from "../../src/engine/workspace-control-root.ts";

const STUB = `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (critic) {
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  const evidence = /write (\\.specstride\\S+?):/i.exec(prompt)[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  fs.writeFileSync("made.txt", "work\\n");
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;

function fixture(): { readonly dir: string; readonly restore: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "specstride-rebase-"));
  const bin = join(dir, "bin");
  const work = join(dir, "work");
  mkdirSync(bin);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  writeFileSync(join(bin, "claude"), STUB);
  chmodSync(join(bin, "claude"), 0o755);
  writeFileSync(
    join(work, "specs", "001-one", "tasks.md"),
    "# Tasks\n\n## Phase 1: One\n\n- [ ] T001 Do it\n",
  );
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
  };
  process.env.HOME = dir;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  delete process.env.SPECSTRIDE_FEATURE;
  process.env.SPECSTRIDE_PROPOSER = "claude";
  process.env.SPECSTRIDE_CRITIC = "claude";
  process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = "0";
  return {
    dir: work,
    restore: () => {
      process.env.HOME = before.HOME;
      process.env.PATH = before.PATH;
      if (before.FEATURE === undefined) delete process.env.SPECSTRIDE_FEATURE;
      else process.env.SPECSTRIDE_FEATURE = before.FEATURE;
      if (before.PROPOSER === undefined) delete process.env.SPECSTRIDE_PROPOSER;
      else process.env.SPECSTRIDE_PROPOSER = before.PROPOSER;
      if (before.CRITIC === undefined) delete process.env.SPECSTRIDE_CRITIC;
      else process.env.SPECSTRIDE_CRITIC = before.CRITIC;
      if (before.PAUSE === undefined) delete process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC;
      else process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = before.PAUSE;
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

const git = (dir: string, ...argv: string[]): string =>
  spawnSync("git", ["-C", dir, ...argv], { encoding: "utf8" }).stdout.trim();

const commits = (dir: string): number => Number(git(dir, "rev-list", "--count", "HEAD"));

const runsOf = (dir: string): string[] => {
  const runs = join(controlRootOfWorkspace(dir), "runs");
  return existsSync(runs) ? readdirSync(runs) : [];
};

/** The `integrity.noted` data of the runs that are not in `before`. */
function integrityNotesSince(dir: string, before: readonly string[]): Record<string, unknown>[] {
  const notes: Record<string, unknown>[] = [];
  for (const run of runsOf(dir).filter((name) => !before.includes(name))) {
    const events = join(controlRootOfWorkspace(dir), "runs", run, "events.jsonl");
    if (!existsSync(events)) continue;
    for (const line of readFileSync(events, "utf8").split("\n")) {
      if (line.trim() === "") continue;
      const event = JSON.parse(line) as { type: string; data: Record<string, unknown> };
      if (event.type === "integrity.noted") notes.push(event.data);
    }
  }
  return notes;
}

test("an approval whose commit a rebase rewrote still stands, noted with both names", async () => {
  const { dir, restore } = fixture();
  try {
    assert.equal(await runFeature({ argv: [], workdir: dir }), 0);
    assert.equal(commits(dir), 2);
    const approvalCommit = git(dir, "rev-parse", "HEAD");
    // The rebase: the approval commit is put on a new base, the same change
    // under another name; the original is no ancestor of HEAD any more.
    git(dir, "reset", "-q", "--hard", "HEAD~1");
    writeFileSync(join(dir, "base.txt"), "a commit of the new base\n");
    git(dir, "add", "base.txt");
    git(dir, "commit", "-qm", "the new base");
    git(dir, "cherry-pick", approvalCommit);
    const rewritten = git(dir, "rev-parse", "HEAD");
    assert.notEqual(rewritten, approvalCommit);
    assert.deepEqual(approvalCommitStanding(dir, approvalCommit), {
      standing: "rebased",
      equivalent: rewritten,
    });

    const before = runsOf(dir);
    assert.equal(await runFeature({ argv: [], workdir: dir }), 0);
    assert.equal(commits(dir), 3, "the phase counts as approved: nothing is redone");
    const notes = integrityNotesSince(dir, before);
    assert.equal(notes.filter((note) => note.kind === "approval-invalid").length, 0);
    const rebased = notes.filter((note) => note.kind === "approval-rebased");
    assert.equal(rebased.length, 1, "noted once per phase and run");
    assert.equal(rebased[0]?.phase, 1);
    assert.equal(rebased[0]?.commit, approvalCommit);
    assert.equal(rebased[0]?.equivalent, rewritten);
  } finally {
    restore();
  }
});

test("a git reset past the approval commit still voids the approval (failed: tree)", async () => {
  const { dir, restore } = fixture();
  try {
    assert.equal(await runFeature({ argv: [], workdir: dir }), 0);
    const approvalCommit = git(dir, "rev-parse", "HEAD");
    git(dir, "reset", "-q", "--hard", "HEAD~1");
    assert.deepEqual(approvalCommitStanding(dir, approvalCommit), { standing: "gone" });

    const before = runsOf(dir);
    assert.equal(await runFeature({ argv: [], workdir: dir }), 0);
    const notes = integrityNotesSince(dir, before);
    const invalid = notes.filter((note) => note.kind === "approval-invalid");
    assert.equal(invalid.length >= 1, true, "the reset is noted as an invalid approval");
    assert.equal(invalid[0]?.phase, 1);
    assert.equal(invalid[0]?.failed, "tree");
    assert.match(String(invalid[0]?.detail), /is gone from the history of the workspace/);
    assert.equal(notes.filter((note) => note.kind === "approval-rebased").length, 0);
    // The phase ran again and committed again (the stub's change is the same,
    // so within the same second the commit can even get the same name).
    assert.equal(commits(dir), 2, "the phase ran again and committed again");
  } finally {
    restore();
  }
});

test("an approval commit that is an ancestor of HEAD stands as before, with no note", async () => {
  const { dir, restore } = fixture();
  try {
    assert.equal(await runFeature({ argv: [], workdir: dir }), 0);
    const approvalCommit = git(dir, "rev-parse", "HEAD");
    writeFileSync(join(dir, "later.txt"), "a later commit\n");
    git(dir, "add", "later.txt");
    git(dir, "commit", "-qm", "later work");
    assert.deepEqual(approvalCommitStanding(dir, approvalCommit), { standing: "ancestor" });

    const before = runsOf(dir);
    assert.equal(await runFeature({ argv: [], workdir: dir }), 0);
    assert.equal(commits(dir), 3, "nothing is redone");
    const notes = integrityNotesSince(dir, before);
    assert.equal(notes.filter((note) => note.kind === "approval-invalid").length, 0);
    assert.equal(notes.filter((note) => note.kind === "approval-rebased").length, 0);
  } finally {
    restore();
  }
});

test("a bound commit the object store no longer holds is gone", () => {
  const { dir, restore } = fixture();
  try {
    assert.deepEqual(approvalCommitStanding(dir, "0".repeat(39) + "1"), { standing: "gone" });
  } finally {
    restore();
  }
});
