/**
 * The switch `commit.backpressure` and the safety net (feature 152,
 * F152-FR-022, CQ-152-05 A):
 *
 * - T146 — with the switch off, the behaviour is today's: on the fixture
 *   `secret-every-attempt` the run goes on past the block, exits 1 by the
 *   owner ruling of 2026-11-04 with `commits_blocked=N` in the digest, and
 *   the commit gate is never entered (no block record, no corrective
 *   feedback, one attempt only).
 * - T147 — with the switch on, the safety net never fires over the fixtures
 *   of the user stories: no run ends with the warning line of the end-of-run
 *   rule, because a block the backpressure turned into a new attempt leaves
 *   nothing behind (F152-SC-001). The halt fixture `secret-every-attempt` is
 *   excepted: it halts on purpose (T090), not through the net.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { runFeature } from "../../src/engine/run-feature.ts";
import { controlRootOfWorkspace } from "../../src/engine/workspace-control-root.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, "..", "fixtures", "commit-gate");

/** The planted secret: `ghp_` + 36 characters, a `github-prefix` hit. */
const SECRET = `ghp_${"a1b2c3d4e5f6".repeat(3)}`;

/** The safety-net warning line of `run-feature.ts` (F152-FR-022). */
const SAFETY_NET_LINE = /commit\(s\) were blocked by the secret gate/;

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
 * tasks.md of the fixture, its stub `claude` on `PATH`, a git repository with
 * one init commit. When `backpressure` is given, the switch
 * `commit.backpressure` is set through `SPECSTRIDE_COMMIT_BACKPRESSURE`; the
 * switch is left at its default (on) otherwise.
 */
function fixture(name: string, backpressure?: "on" | "off"): Fixture {
  const source = join(FIXTURES, name);
  const dir = mkdtempSync(join(tmpdir(), "specstride-commit-gate-switch-"));
  const bin = join(dir, "bin");
  const work = join(dir, "work");
  const scratch = join(dir, "scratch");
  mkdirSync(bin);
  mkdirSync(scratch);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  copyFileSync(join(source, "tasks.md"), join(work, "specs", "001-one", "tasks.md"));
  writeFileSync(join(work, "package.json"), JSON.stringify({ scripts: { test: 'node -e ""' } }));
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
    LIMITS: process.env.SPECSTRIDE_LIMITS,
    STUB_DIR: process.env.STUB_DIR,
    BP: process.env.SPECSTRIDE_COMMIT_BACKPRESSURE,
  };
  process.env.HOME = dir;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  process.env.SPECSTRIDE_FEATURE = "001-one";
  process.env.STUB_SECRET = SECRET;
  process.env.SPECSTRIDE_PROPOSER = "claude";
  process.env.SPECSTRIDE_CRITIC = "claude";
  process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = "0";
  // The engine's own bounds (the reject limit of 3 in particular), so the
  // differing-signature fixture reaches `max_rejects` and not past it.
  delete process.env.SPECSTRIDE_LIMITS;
  // The switch is set through the environment variable the composition root
  // reads, as `commit-gate-reset-records.test.ts` does.
  if (backpressure === undefined) delete process.env.SPECSTRIDE_COMMIT_BACKPRESSURE;
  else process.env.SPECSTRIDE_COMMIT_BACKPRESSURE = backpressure;
  process.env.STUB_DIR = scratch;
  const chunks: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: unknown): boolean => {
    if (typeof chunk === "string") chunks.push(chunk);
    return originalWrite(chunk as string);
  }) as typeof process.stdout.write;
  // The engine's own derivation (`workspace-control-root.ts`), so the paths
  // the test inspects are the paths the run actually wrote.
  const controlRoot = controlRootOfWorkspace(work);
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
      if (before.LIMITS === undefined) delete process.env.SPECSTRIDE_LIMITS;
      else process.env.SPECSTRIDE_LIMITS = before.LIMITS;
      if (before.STUB_DIR === undefined) delete process.env.STUB_DIR;
      else process.env.STUB_DIR = before.STUB_DIR;
      if (before.BP === undefined) delete process.env.SPECSTRIDE_COMMIT_BACKPRESSURE;
      else process.env.SPECSTRIDE_COMMIT_BACKPRESSURE = before.BP;
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** The digest line the run printed (`DIGEST exit=… commits_blocked=…`). */
const digestLine = (fx: Fixture): string =>
  fx.out().split("\n").find((line) => line.includes("DIGEST")) ?? "";

/** The proposer attempts the stub saw (it writes one file per attempt). */
const attemptsOf = (fx: Fixture): number[] =>
  readdirSync(fx.scratch)
    .filter((name) => /^seen-by-proposer-\d+\.txt$/.test(name))
    .map((name) => Number(/-(\d+)\.txt$/.exec(name)?.[1]))
    .sort((a, b) => a - b);

test("T146 with the switch off the run is today's: it goes on, exits 1, and the commit gate is never entered", async () => {
  const fx = fixture("secret-every-attempt", "off");
  try {
    const exit = await runFeature({ argv: [], workdir: fx.dir });
    // Today's behaviour (F152-FR-022, as-is): the phase stays approved, the
    // run goes on and ends, and the owner ruling of 2026-11-04 makes it exit
    // 1, not 0.
    assert.equal(exit, 1);
    // Exactly one attempt: no retry, no corrective block, no halt.
    assert.deepEqual(attemptsOf(fx), [1]);
    // The digest counts the block and the run is not `done`.
    assert.match(digestLine(fx), /DIGEST exit=1 .*commits_blocked=1 /);
    assert.match(fx.out(), /commit\(s\) were blocked by the secret gate/);
    // The commit gate was never called: no block record, no void marker, no
    // pre-tick copy anywhere in the control plane. (The generic feature
    // feedback folder is NOT asserted here: a critic feedback file may
    // legitimately exist on a run that never entered the gate.)
    assert.equal(existsSync(fx.control("commit-gate")), false);
    assert.equal(existsSync(fx.control("commit-gate", "blocks")), false);
    assert.equal(existsSync(fx.control("commit-gate", "void")), false);
    assert.equal(existsSync(fx.control("approvals", "phase-1.json")), true);
  } finally {
    fx.restore();
  }
});

for (const name of [
  "secret-removed-on-retry",
  "ordinary-code",
  "instruction-in-a-file-name",
  "secret-moves-files",
] as const) {
  test(`T147 with the switch on the safety net never fires on ${name}`, async () => {
    const fx = fixture(name, "on");
    try {
      const exit = await runFeature({ argv: [], workdir: fx.dir });
      // F152-SC-001: the warning line of the end-of-run rule never appears —
      // a block the backpressure turned into a new attempt left nothing
      // behind, and the other fixtures never block with the switch on.
      assert.equal(SAFETY_NET_LINE.test(fx.out()), false);
      // A run that ends 0 ends 0 (no exit-1 net), and the run's own exit is
      // kept: the two fixtures that exhaust the reject limit end 2, the rest
      // 0.
      assert.equal(exit, name === "secret-moves-files" ? 2 : 0);
      if (exit === 0) {
        assert.equal(
          existsSync(fx.control("approvals", "phase-1.json")),
          true,
          "the phase is approved and committed",
        );
      }
    } finally {
      fx.restore();
    }
  });
}
