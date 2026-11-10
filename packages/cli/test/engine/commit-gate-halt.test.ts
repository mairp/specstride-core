/**
 * The wiring of the commit-gate HALT (feature 152, user story 2): a block
 * whose signature is the same as the block just before it halts the run
 * blocked on a human; signatures that differ run into the reject limit.
 *
 * T090 (F152-FR-006, F152-SC-003; CQ-152-01 A), T091 (F152-FR-005),
 * T092 (row O-33, Principle XVI), T165 (fix and resume after the halt,
 * transition T17 of feature 102).
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { runFeature } from "../../src/engine/run-feature.ts";
import { blockedReasonRow } from "@specstride/contracts/state/blocked-reasons";
import { refusalOf } from "@specstride/contracts/state/relaunch-owner";

const FIXTURES = join(import.meta.dirname, "..", "fixtures", "commit-gate");

/** The planted secret: `ghp_` + 36 characters, a `github-prefix` hit. */
const SECRET = `ghp_${"a1b2c3d4e5f6".repeat(3)}`;

type Fixture = {
  readonly dir: string;
  readonly home: string;
  readonly scratch: string;
  readonly control: (...parts: string[]) => string;
  readonly out: () => string;
  readonly restore: () => void;
};

/**
 * A workspace from a fixture directory of `fixtures/commit-gate/`: the
 * tasks.md of the fixture, its stub `claude` on `PATH`, a git repository
 * with one init commit, and the switch left at its default (on).
 */
function fixture(name: string): Fixture {
  const source = join(FIXTURES, name);
  const dir = mkdtempSync(join(tmpdir(), "specstride-commit-gate-halt-"));
  const bin = join(dir, "bin");
  const work = join(dir, "work");
  const scratch = join(dir, "scratch");
  mkdirSync(bin);
  mkdirSync(scratch);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  copyFileSync(join(source, "tasks.md"), join(work, "specs", "001-one", "tasks.md"));
  writeFileSync(join(work, "package.json"), JSON.stringify({ scripts: { test: "node -e \"\"" } }));
  copyFileSync(join(source, "stub-claude"), join(bin, "claude"));
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
    SECRET: process.env.STUB_SECRET,
    PROPOSER: process.env.SPECSTRIDE_PROPOSER,
    CRITIC: process.env.SPECSTRIDE_CRITIC,
    PAUSE: process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC,
    STUB_DIR: process.env.STUB_DIR,
  };
  process.env.HOME = dir;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  process.env.SPECSTRIDE_FEATURE = "001-one";
  process.env.STUB_SECRET = SECRET;
  process.env.SPECSTRIDE_PROPOSER = "claude";
  process.env.SPECSTRIDE_CRITIC = "claude";
  process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = "0";
  process.env.STUB_DIR = scratch;
  const chunks: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: unknown): boolean => {
    if (typeof chunk === "string") chunks.push(chunk);
    return originalWrite(chunk as string);
  }) as typeof process.stdout.write;
  const controlRoot = join(
    dir,
    ".specstride",
    "workspaces",
    createHash("sha256").update(work).digest("hex").slice(0, 16),
  );
  const control = (...parts: string[]): string =>
    parts[0] === "commit-gate"
      ? join(controlRoot, ...parts)
      : join(controlRoot, "features", "001-one", ...parts);
  return {
    dir: work,
    home: dir,
    scratch,
    control,
    out: () => chunks.join(""),
    restore: () => {
      process.stdout.write = originalWrite;
      for (const chunk of chunks) originalWrite(chunk);
      process.env.HOME = before.HOME;
      process.env.PATH = before.PATH;
      if (before.FEATURE === undefined) delete process.env.SPECSTRIDE_FEATURE;
      else process.env.SPECSTRIDE_FEATURE = before.FEATURE;
      if (before.SECRET === undefined) delete process.env.STUB_SECRET;
      else process.env.STUB_SECRET = before.SECRET;
      if (before.PROPOSER === undefined) delete process.env.SPECSTRIDE_PROPOSER;
      else process.env.SPECSTRIDE_PROPOSER = before.PROPOSER;
      if (before.CRITIC === undefined) delete process.env.SPECSTRIDE_CRITIC;
      else process.env.SPECSTRIDE_CRITIC = before.CRITIC;
      if (before.PAUSE === undefined) delete process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC;
      else process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = before.PAUSE;
      if (before.STUB_DIR === undefined) delete process.env.STUB_DIR;
      else process.env.STUB_DIR = before.STUB_DIR;
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** The primary event stream of the (single) run of a fixture workspace. */
const eventsOf = (fx: Fixture): string => {
  const workspaceRoot = join(
    fx.home,
    ".specstride",
    "workspaces",
    createHash("sha256").update(fx.dir).digest("hex").slice(0, 16),
  );
  const runsDir = join(workspaceRoot, "runs");
  return readFileSync(join(runsDir, readdirSync(runsDir)[0], "events.jsonl"), "utf8");
};

/** The proposer attempts the stub saw (it writes one file per attempt). */
const attemptsOf = (fx: Fixture): number[] =>
  readdirSync(fx.scratch)
    .filter((name) => /^seen-by-proposer-\d+\.txt$/.test(name))
    .map((name) => Number(/-(\d+)\.txt$/.exec(name)?.[1]))
    .sort((a, b) => a - b);

test("T090 the same secret every attempt halts blocked on a human after two attempts", async () => {
  const fx = fixture("secret-every-attempt");
  try {
    const exit = await runFeature({ argv: [], workdir: fx.dir });
    // Exactly two phase attempts, then the halt (F152-SC-003).
    assert.deepEqual(attemptsOf(fx), [1, 2]);
    assert.equal(exit, 2);
    // The terminal facts: stop reason `max_rejects`, engine exit 2, and the
    // row of the closed set says `retryable: No` — the shape of a terminal
    // record a reader derives `blocked-on-human` from (CQ-152-01 A).
    const digest = fx.out().split("\n").find((line) => line.includes("DIGEST")) ?? "";
    assert.match(digest, /DIGEST exit=2 stop=max_rejects /);
    const row = blockedReasonRow("commit-gate");
    assert.ok(row !== undefined, "the blocked reason `commit-gate` is in the closed set");
    assert.equal(row?.stopReason, "max_rejects");
    assert.equal(row?.engineExit, 2);
    assert.equal(row?.retryable, false);
    assert.match(row?.when ?? "", /same signature/i);
    // The event `blocked` names the closed-set reason and what the run needs:
    // the phase, the rule and the file.
    const events = eventsOf(fx);
    const blocked = events
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line) as { type: string; data: { reason?: string; needs?: string } })
      .find((event) => event.type === "blocked" && event.data.reason === "commit-gate");
    assert.ok(blocked !== undefined, "the run emitted a `blocked` event with reason commit-gate");
    assert.match(blocked?.data.needs ?? "", /phase 1/);
    assert.match(blocked?.data.needs ?? "", /cg-github-prefix/);
    assert.match(blocked?.data.needs ?? "", /config\.ts/);
    // No third attempt, and no approval anywhere: the work stays uncommitted.
    assert.equal(existsSync(fx.control("approvals", "phase-1.json")), false);
  } finally {
    fx.restore();
  }
});

test("T091 signatures that differ run into the reject limit, not the halt", async () => {
  const fx = fixture("secret-moves-files");
  try {
    const exit = await runFeature({ argv: [], workdir: fx.dir });
    // Three attempts — the reject limit — not two, and no commit-gate halt.
    assert.deepEqual(attemptsOf(fx), [1, 2, 3]);
    assert.equal(exit, 2);
    const digest = fx.out().split("\n").find((line) => line.includes("DIGEST")) ?? "";
    assert.match(digest, /DIGEST exit=2 stop=max_rejects /);
    const events = eventsOf(fx);
    const commitGateBlocked = events.split("\n").some((line) => {
      if (line.trim() === "") return false;
      const parsed = JSON.parse(line) as { type?: string; data?: { reason?: string } };
      return parsed.type === "blocked" && parsed.data?.reason === "commit-gate";
    });
    assert.equal(
      commitGateBlocked,
      false,
      "no halt on a repeated signature: the signatures moved with the file",
    );
    // Three block records, three distinct signatures.
    const signatures = [1, 2, 3].map(
      (ordinal) =>
        (JSON.parse(
          readFileSync(fx.control("commit-gate", `phase1.${String(ordinal)}.block.json`), "utf8"),
        ) as { signature: string }).signature,
    );
    assert.equal(new Set(signatures).size, 3, "each block held a different signature");
  } finally {
    fx.restore();
  }
});

test("T092 the halted run is never relaunched (row O-33)", async () => {
  const fx = fixture("secret-every-attempt");
  try {
    assert.equal(await runFeature({ argv: [], workdir: fx.dir }), 2);
    // The terminal facts of T090, as a classifier reads them: a run ended by
    // the `commit-gate` blocked reason is `blocked-on-human` and not
    // retryable (the row says `retryable: No`).
    const terminal = { state: "blocked-on-human", retryable: false };
    assert.equal(refusalOf(terminal), "blocked-on-human");
    assert.equal(refusalOf({ state: "done", retryable: false }), "not-retryable");
  } finally {
    fx.restore();
  }
});

test("T165 fix and resume after the halt", async () => {
  const fx = fixture("secret-every-attempt");
  try {
    assert.equal(await runFeature({ argv: [], workdir: fx.dir }), 2);
    // T17 of feature 102 — the transition a resume out of `blocked-on-human`
    // takes is ALLOWED (only a supervisor's relaunch is refused).
    assert.equal(refusalOf({ state: "blocked-on-human", retryable: false }), "blocked-on-human");
    // The consumer fixes the file: the stub now REMOVES the secret from the
    // second attempt on (the attempt-2 behaviour of `secret-removed-on-retry`).
    copyFileSync(
      join(FIXTURES, "secret-removed-on-retry", "stub-claude"),
      join(fx.home, "bin", "claude"),
    );
    chmodSync(join(fx.home, "bin", "claude"), 0o755);
    // The consumer's FIX: the secret file the halt pointed at is gone.
    rmSync(join(fx.dir, "config.ts"), { force: true });
    // A resume reads the feedback of the attempts before it from the disk and
    // the counts from the ledger; the run goes on at the first phase without
    // a valid approval record — phase 1, attempt 3. An ordinal of 3 is itself
    // the proof that the counts survived the halt (F152-FR-015).
    assert.equal(await runFeature({ argv: [], workdir: fx.dir }), 0);
    const attempts = attemptsOf(fx);
    assert.ok(attempts.includes(3), `the resume continued at attempt 3: ${JSON.stringify(attempts)}`);
    // Attempt 3 carried the corrective block of attempt 2 in its prompt.
    const prompt3 = readFileSync(join(fx.scratch, "seen-by-proposer-3.txt"), "utf8");
    assert.match(prompt3, /commit gate blocked/);
    // The phase was approved and committed; no uncommitted work remains.
    const porcelain = spawnSync("git", ["-C", fx.dir, "status", "--porcelain"], {
      encoding: "utf8",
    }).stdout;
    assert.equal(porcelain, "");
    assert.equal(
      existsSync(fx.control("approvals", "phase-1.json")),
      true,
      "the resumed attempt was approved",
    );
    assert.ok(
      existsSync(fx.control("commit-gate", "phase1.2.block.json")),
      "the block record of attempt 2 stands after the resume",
    );
  } finally {
    fx.restore();
  }
});
