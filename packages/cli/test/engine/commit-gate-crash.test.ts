/**
 * The crash-safety of the commit backpressure (feature 152, user story 3):
 * a kill between the writes of a block loses nothing, and a resume gives the
 * same phase state and counts as an uninterrupted run (F152-FR-013,
 * F152-SC-006).
 *
 * T106 — case "kill after the block record": SIGKILL after `writeBlockRecord`
 * and before the corrective feedback is written. On resume the feedback of
 * the attempt exists and is byte-identical to `feedbackOfTheCommitGate`
 * rendered from the block record of the attempt (its hits and its stored
 * nonce; the nonce of an uninterrupted run is drawn separately and is never
 * compared).
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
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
import { feedbackOfTheCommitGate, quotedPath } from "../../../core/src/gate/feedback.ts";
import { loadEngineCommitGateRules } from "@specstride/kernel/redactor/commit-gate-rules";
import { REJECT_LIMIT_DEFAULT } from "../../../core/src/gate/limits.ts";

const FIXTURES = join(import.meta.dirname, "..", "fixtures", "commit-gate");
const CLI_BIN = join(import.meta.dirname, "..", "..", "bin", "specstride");

/** The planted secret: `ghp_` + 36 characters, a `github-prefix` hit. */
const SECRET = `ghp_${"a1b2c3d4e5f6".repeat(3)}`;
const E3_HEADING =
  "# Phase 1 — attempt 1 was not approved: the commit gate blocked the approval commit";

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
 * one init commit, and the switch left at its default (on). The env is set in
 * THIS process, so a resume can run `runFeature` in place; a child engine run
 * inherits the same env (plus what the caller adds).
 */
function fixture(name: string): Fixture {
  const source = join(FIXTURES, name);
  const dir = mkdtempSync(join(tmpdir(), "specstride-commit-gate-crash-"));
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
  };
  process.env.HOME = dir;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  process.env.SPECSTRIDE_FEATURE = "001-one";
  process.env.STUB_SECRET = SECRET;
  // The stub `claude` of the fixture is both the proposer and the critic; the
  // harness env of an outer Specstride run must not leak in (CT-152-2).
  process.env.SPECSTRIDE_PROPOSER = "claude";
  process.env.SPECSTRIDE_CRITIC = "claude";
  process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = "0";
  // The bounds of the run are the engine's defaults (CT-152-4's lesson): an
  // outer Specstride run may run with `SPECSTRIDE_LIMITS=off`.
  delete process.env.SPECSTRIDE_LIMITS;
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
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/**
 * One child ENGINE run of the workspace: the real CLI in its own process, so
 * the test can SIGKILL it at a point of the engine's own write order without
 * killing the test runner. Resolves with how it ended. The extra env keys are
 * the crash seam only; the resume runs WITHOUT them.
 */
function childRun(
  fx: Fixture,
  extraEnv: Readonly<Record<string, string>>,
): Promise<{ code: number | null; signal: NodeJS.Signals | null; out: string }> {
  return new Promise((done) => {
    const child = spawn(process.execPath, [CLI_BIN, "run"], {
      cwd: fx.dir,
      env: { ...process.env, ...extraEnv },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const out: string[] = [];
    child.stdout.on("data", (chunk: Buffer) => void out.push(chunk.toString("utf8")));
    child.stderr.on("data", (chunk: Buffer) => void out.push(chunk.toString("utf8")));
    const guard = setTimeout(() => child.kill("SIGKILL"), 120_000);
    child.on("close", (code, signal) => {
      clearTimeout(guard);
      done({ code, signal, out: out.join("") });
    });
  });
}

const ledgerOf = (fx: Fixture): Record<string, unknown> =>
  JSON.parse(readFileSync(fx.control("ledger.json"), "utf8")) as Record<string, unknown>;

const blockRecordNames = (fx: Fixture): readonly string[] =>
  existsSync(fx.control("commit-gate"))
    ? readdirSync(fx.control("commit-gate")).filter((name) => name.endsWith(".block.json"))
    : [];

const porcelain = (dir: string): string =>
  spawnSync("git", ["-C", dir, "status", "--porcelain"], { encoding: "utf8" }).stdout;

test("T107 kill after the feedback, before the counts: the resume writes the counts once", async () => {
  const fx = fixture("secret-removed-on-retry");
  try {
    // Attempt 1 in its own process, killed after the corrective feedback was
    // written and before the counts went to the ledger (the second seam).
    const first = await childRun(fx, { SPECSTRIDE_CRASH_AFTER_FEEDBACK: "1" });
    assert.equal(first.signal, "SIGKILL", `the child died by SIGKILL, got ${String(first.signal)}`);
    assert.equal(
      existsSync(fx.control("commit-gate", "phase1.1.block.json")),
      true,
      "the block record survived the kill",
    );
    assert.equal(
      existsSync(fx.control("feedback", "phase1.1.md")),
      true,
      "the feedback was written before the kill",
    );
    // The counts of the phase were not written before the kill: the ledger's
    // entry for phase 1 (which the pass loop's counters may have written)
    // holds no rejection and no ordinal yet.
    const ledgerBefore = existsSync(fx.control("ledger.json"))
      ? (JSON.parse(readFileSync(fx.control("ledger.json"), "utf8")) as Record<
          string,
          { rejectCount?: number; phaseAttemptOrdinal?: number }
        >)
      : {};
    const before1 = ledgerBefore["1"] ?? {};
    assert.equal(before1.rejectCount ?? 0, 0, "the rejection was not counted before the kill");
    assert.equal(
      before1.phaseAttemptOrdinal ?? 0,
      0,
      "the ordinal of the block was not written before the kill",
    );

    // The resume runs in place, with no crash seam.
    assert.equal(await runFeature({ argv: [], workdir: fx.dir }), 0);

    // The counts were written ONCE, not twice: `rejectCount` is 1, and the
    // next ordinal — attempt 2 — is the one that ran after the resume
    // (F152-FR-013, F152-FR-015). The ledger's `phaseAttemptOrdinal` stays at
    // the ordinal of the rejected attempt (1), exactly as in the
    // uninterrupted run, where no approval ever raises it.
    const counts = ledgerOf(fx)["1"] as { rejectCount: number; phaseAttemptOrdinal: number };
    assert.equal(counts.rejectCount, 1, "rejectCount is 1 — the block was counted once");
    assert.equal(counts.phaseAttemptOrdinal, 1, "the rejected attempt stays ordinal 1");
    assert.equal(
      existsSync(join(fx.scratch, "seen-by-proposer-2.txt")),
      true,
      "the next ordinal, attempt 2, ran after the resume",
    );
    assert.equal(blockRecordNames(fx).length, 1, "exactly one block record");
    assert.match(fx.out(), /DIGEST exit=0 stop=none cost_usd=\d+\.\d+ commits_blocked=1/);

    // Attempt 2 carried the corrective block and committed the phase.
    const prompt2 = readFileSync(join(fx.scratch, "seen-by-proposer-2.txt"), "utf8");
    assert.ok(prompt2.includes(E3_HEADING), "attempt 2 received the corrective block");
    assert.equal(porcelain(fx.dir), "", "no uncommitted work is left in the tree");
  } finally {
    fx.restore();
  }
});

test("T106 kill after the block record: the resume rebuilds the feedback and finishes the retry", async () => {
  // The uninterrupted run of the same fixture, for the state the crash must
  // reproduce (its nonce was drawn separately and is never compared).
  const baseFx = fixture("secret-removed-on-retry");
  let baselineLedger!: Record<string, unknown>;
  let baselineTasks!: string;
  try {
    assert.equal(await runFeature({ argv: [], workdir: baseFx.dir }), 0);
    baselineLedger = ledgerOf(baseFx);
    baselineTasks = readFileSync(join(baseFx.dir, "specs", "001-one", "tasks.md"), "utf8");
  } finally {
    baseFx.restore();
  }

  const fx = fixture("secret-removed-on-retry");
  try {
    // Attempt 1 in its own process, killed after the block record was written
    // and before the corrective feedback (the seam of run-feature.ts).
    const first = await childRun(fx, { SPECSTRIDE_CRASH_AFTER_BLOCK_RECORD: "1" });
    assert.equal(first.signal, "SIGKILL", `the child died by SIGKILL, got ${String(first.signal)}`);
    assert.equal(
      existsSync(fx.control("commit-gate", "phase1.1.block.json")),
      true,
      "the block record survived the kill",
    );
    assert.equal(
      existsSync(fx.control("feedback", "phase1.1.md")),
      false,
      "the feedback was not written before the kill",
    );

    // The resume runs in place, with no crash seam.
    assert.equal(await runFeature({ argv: [], workdir: fx.dir }), 0);

    // One block record exists, and the run exited 0 with its digest line.
    assert.equal(blockRecordNames(fx).length, 1, "exactly one block record");
    assert.match(fx.out(), /DIGEST exit=0 stop=none cost_usd=\d+\.\d+ commits_blocked=1/);

    // The feedback of the attempt exists and is byte-identical to the
    // rendering of the block record's own fields (its hits and its nonce).
    // WHERE it is: the order after an approval (F101-FR-033, step 1) sets the
    // feedback of the phase aside when the NEXT attempt of the phase is
    // approved — attempt 2 here, exactly as in the uninterrupted run — so the
    // set-aside copy is where the attempt's feedback lives after the run.
    const feedbackLocation = ((): string => {
      const live = fx.control("feedback", "phase1.1.md");
      if (existsSync(live)) return live;
      const aside = fx.control("set-aside", "phase1", "phase1.1.md");
      assert.equal(
        existsSync(aside),
        true,
        "the feedback of the attempt exists (live or set aside)",
      );
      return aside;
    })();
    const record = JSON.parse(
      readFileSync(fx.control("commit-gate", "phase1.1.block.json"), "utf8"),
    ) as {
      phase: number;
      ordinal: number;
      nonce: string;
      hits: readonly { rule: string; file: string; line: number }[];
      hitsOmitted: number;
    };
    assert.equal(record.ordinal, 1);
    const rules = loadEngineCommitGateRules();
    const reasonOf = (id: string): string =>
      rules.rules.find((candidate) => candidate.rule === id)?.reason ?? "";
    const feedback = readFileSync(feedbackLocation, "utf8");
    const expected = feedbackOfTheCommitGate({
      phase: record.phase,
      ordinal: record.ordinal,
      nonce: record.nonce,
      rejectCount: 1,
      rejectLimit: REJECT_LIMIT_DEFAULT,
      hits: record.hits.map((hit) => ({
        rule: hit.rule,
        reason: reasonOf(hit.rule),
        file: quotedPath(hit.file),
        line: hit.line,
      })),
      hitsOmitted: record.hitsOmitted,
    });
    assert.equal(feedback, expected, "the resumed feedback is the record's own rendering");

    // The phase state and the counts equal the uninterrupted run's (the
    // nonce and the verdict ids are per-run and are not compared).
    const counts = ledgerOf(fx)["1"] as { rejectCount: number; phaseAttemptOrdinal: number };
    const baseCounts = baselineLedger["1"] as {
      rejectCount: number;
      phaseAttemptOrdinal: number;
    };
    assert.equal(counts.rejectCount, 1, "rejectCount is 1");
    assert.deepEqual(counts, baseCounts);
    assert.equal(
      readFileSync(join(fx.dir, "specs", "001-one", "tasks.md"), "utf8"),
      baselineTasks,
      "the phase state (the ticked tasks.md) equals the uninterrupted run's",
    );

    // The next attempt carried the corrective block and committed the phase.
    const prompt2 = readFileSync(join(fx.scratch, "seen-by-proposer-2.txt"), "utf8");
    assert.ok(prompt2.includes(E3_HEADING), "attempt 2 received the corrective block");
    assert.equal(porcelain(fx.dir), "", "no uncommitted work is left in the tree");
  } finally {
    fx.restore();
  }
});

/* ------------------------------------------------------------------ *
 * T108 to T112 — the rest of user story 3.
 * ------------------------------------------------------------------ */

import { readBlockRecord } from "../../../core/src/post-approval/commit-gate.ts";
import { approvalRecordPath } from "../../../core/src/approval/record.ts";

const controlRootOf = (fx: Fixture): string =>
  join(
    fx.home,
    ".specstride",
    "workspaces",
    createHash("sha256").update(fx.dir).digest("hex").slice(0, 16),
  );

const eventsOf = (fx: Fixture): { type: string; data: Record<string, unknown> }[] => {
  const runs = join(controlRootOf(fx), "runs");
  const out: { type: string; data: Record<string, unknown> }[] = [];
  for (const run of existsSync(runs) ? readdirSync(runs) : []) {
    const path = join(runs, run, "events.jsonl");
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      if (line.trim() === "") continue;
      const parsed = JSON.parse(line) as { type: string; data: Record<string, unknown> };
      out.push({ type: parsed.type, data: parsed.data });
    }
  }
  return out;
};

const approvalRecordOf = (fx: Fixture): Record<string, unknown> | undefined => {
  const path = fx.control("approvals", `phase-1.json`);
  if (!existsSync(path)) {
    const alt = join(controlRootOf(fx), approvalRecordPath("001-one", 1));
    return existsSync(alt)
      ? (JSON.parse(readFileSync(alt, "utf8")) as Record<string, unknown>)
      : undefined;
  }
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
};

test("T108 kill before the block record: the resume runs attempt 1 again from its start", async () => {
  const fx = fixture("secret-removed-on-retry");
  try {
    const first = await childRun(fx, { SPECSTRIDE_CRASH_BEFORE_BLOCK_RECORD: "1" });
    assert.equal(first.signal, "SIGKILL", `the child died by SIGKILL, got ${String(first.signal)}`);
    assert.equal(blockRecordNames(fx).length, 0, "no block record existed when the child died");
    assert.equal(
      existsSync(fx.control("feedback", "phase1.1.md")),
      false,
      "no feedback existed when the child died",
    );

    // The resume: attempt 1 runs again from its start, and its end state is
    // the uninterrupted run's.
    assert.equal(await runFeature({ argv: [], workdir: fx.dir }), 0);
    assert.equal(blockRecordNames(fx).length, 1, "the re-run wrote its block record");
    const counts = ledgerOf(fx)["1"] as { rejectCount: number; phaseAttemptOrdinal: number };
    assert.equal(counts.rejectCount, 1);
    assert.equal(counts.phaseAttemptOrdinal, 1);
    assert.equal(existsSync(join(fx.scratch, "seen-by-proposer-2.txt")), true, "attempt 2 ran");
    const prompt2 = readFileSync(join(fx.scratch, "seen-by-proposer-2.txt"), "utf8");
    assert.ok(prompt2.includes(E3_HEADING), "attempt 2 received the corrective block");
    assert.match(fx.out(), /DIGEST exit=0 stop=none cost_usd=\d+\.\d+ commits_blocked=1/);
    assert.equal(porcelain(fx.dir), "", "no uncommitted work is left in the tree");
  } finally {
    fx.restore();
  }
});

/**
 * The state of T109/T110/T111 after the first child run: attempt 1 is blocked
 * by the secret it planted, the retry removes the secret and is approved, and
 * the child dies at the tick of the approval — between the approval record
 * and the commit. What the tree holds: the approval record (verifying), the
 * bound record with NO commit, the ticks of the attempt, the pre-tick copy,
 * and the block record of attempt 1.
 */
async function killedAtTheTick(fx: Fixture): Promise<string> {
  const first = await childRun(fx, { SPECSTRIDE_CRASH_AFTER_TICK: "1" });
  assert.equal(first.signal, "SIGKILL", `the child died by SIGKILL, got ${String(first.signal)}`);
  const record = approvalRecordOf(fx) as { verdictId: string } | undefined;
  assert.ok(record !== undefined, "the approval record survived the kill");
  assert.equal(
    existsSync(fx.control("commit-gate", "phase1.pretick.md")),
    true,
    "the pre-tick copy was saved before the tick",
  );
  const blockRecord = readFileSync(fx.control("commit-gate", "phase1.1.block.json"), "utf8");
  assert.ok(blockRecord.includes('"path": "pre-scan"'), "the block of attempt 1 stands");
  return record.verdictId;
}

/** The stub's traces before/after a resume, so "no attempt ran" is measurable. */
const scratchFingerprint = (fx: Fixture): string =>
  readdirSync(fx.scratch)
    .sort()
    .map(
      (name) =>
        `${name}:${createHash("sha256")
          .update(readFileSync(join(fx.scratch, name), "utf8"))
          .digest("hex")
          .slice(0, 12)}`,
    )
    .join("|");

test("T109 the resume re-scan voids: the approval never counts, the ticks go back, the run goes on", async () => {
  const fx = fixture("secret-removed-on-retry");
  try {
    const voidedVerdictId = await killedAtTheTick(fx);
    // A secret in a file the tree already holds changed: what the re-scan
    // must catch.
    writeFileSync(join(fx.dir, "creds.txt"), `token = ${SECRET}\n`);

    assert.equal(await runFeature({ argv: [], workdir: fx.dir }), 0);

    // The void marker stood at the top level of `commit-gate/` while the
    // phase ran again; when the re-run was approved it was set aside with the
    // phase's other records.
    const markerFile = fx.control("set-aside", "phase1", "phase1.void.json");
    assert.equal(existsSync(markerFile), true, "the void marker was written (and set aside)");
    const marker = JSON.parse(readFileSync(markerFile, "utf8")) as { verdictId?: string };
    assert.equal(
      marker.verdictId,
      voidedVerdictId,
      "the void marker carries the verdictId of the record it voided",
    );
    const noted = eventsOf(fx).find(
      (event) =>
        event.type === "integrity.noted" &&
        (event.data as { kind?: string; failed?: string }).kind === "approval-invalid" &&
        (event.data as { failed?: string }).failed === "voided",
    );
    assert.ok(noted !== undefined, "the integrity note of the void was raised");

    // The phase ran again after the void, the retry removed the secret, and
    // the run committed the phase — no uncommitted work is left.
    assert.equal(
      existsSync(join(fx.scratch, "seen-by-proposer-3.txt")),
      true,
      "a third attempt ran",
    );
    const prompt3 = readFileSync(join(fx.scratch, "seen-by-proposer-3.txt"), "utf8");
    assert.ok(prompt3.includes(E3_HEADING), "the attempt after the void carries the block");
    assert.equal(porcelain(fx.dir), "", "no uncommitted work is left in the tree");
    assert.match(fx.out(), /DIGEST exit=0/);
  } finally {
    fx.restore();
  }
});

test("T110 the resume re-scan passes: the approval is honoured, as at the baseline", async () => {
  const fx = fixture("secret-removed-on-retry");
  try {
    await killedAtTheTick(fx);
    // The pending tree is clean: the retry removed the secret it had planted.
    assert.equal(existsSync(join(fx.dir, "creds.txt")), false, "no secret is pending");
    const tracesBefore = scratchFingerprint(fx);

    assert.equal(await runFeature({ argv: [], workdir: fx.dir }), 0);

    assert.equal(
      existsSync(fx.control("commit-gate", "phase1.void.json")),
      false,
      "no void marker: the approval stands",
    );
    assert.equal(blockRecordNames(fx).length, 1, "only the block of attempt 1 stands");
    const counts = ledgerOf(fx)["1"] as { rejectCount: number } | undefined;
    assert.equal(counts?.rejectCount ?? 0, 1, "no rejection beyond attempt 1 was counted");
    assert.equal(
      scratchFingerprint(fx),
      tracesBefore,
      "no phase attempt ran again: the approval was honoured",
    );
    assert.match(fx.out(), /DIGEST exit=0/);
  } finally {
    fx.restore();
  }
});

test("T111 the restore never overwrites a human edit: the run halts blocked on a human", async () => {
  const fx = fixture("secret-removed-on-retry");
  try {
    await killedAtTheTick(fx);
    // The human edit: a NON-checkbox line of tasks.md, plus the secret that
    // makes the re-scan block at all.
    const tasksPathOf = join(fx.dir, "specs", "001-one", "tasks.md");
    writeFileSync(tasksPathOf, readFileSync(tasksPathOf, "utf8").replace("Do it", "Do it NOW"));
    writeFileSync(join(fx.dir, "creds.txt"), `token = ${SECRET}\n`);
    const humanTasks = readFileSync(tasksPathOf, "utf8");
    const tracesBefore = scratchFingerprint(fx);

    const exit = await runFeature({ argv: [], workdir: fx.dir });
    assert.equal(exit, 2, "the run ends blocked on a human (engineExit of `commit-gate`)");

    assert.ok(
      fx
        .out()
        .includes("phase 1: tasks.md changed beyond the ticks; restore it or confirm by hand"),
      "the blocked reason names the file and what the run needs",
    );
    assert.ok(
      fx.out().includes("commit(s) were blocked by the secret gate"),
      "the end-of-run warning about uncommitted work is printed (T160)",
    );
    assert.equal(readFileSync(tasksPathOf, "utf8"), humanTasks, "tasks.md keeps the human edit");
    assert.equal(scratchFingerprint(fx), tracesBefore, "no phase attempt started after the halt");
    assert.equal(
      existsSync(fx.control("commit-gate", "phase1.void.json")),
      false,
      "no void marker: a human edit is never voided by the engine",
    );
    assert.match(fx.out(), /DIGEST exit=2/);
  } finally {
    fx.restore();
  }
});

test("T112 counters survive a relaunch", async () => {
  const fx = fixture("secret-removed-on-retry");
  try {
    const first = await childRun(fx, { SPECSTRIDE_CRASH_AFTER_BLOCK_RECORD: "1" });
    assert.equal(first.signal, "SIGKILL");
    assert.equal(
      await runFeature({ argv: [], workdir: fx.dir }),
      0,
      "the resume finished the retry",
    );

    const countsAfterResume = ledgerOf(fx)["1"] as { rejectCount: number };
    const blocksAfterResume = blockRecordNames(fx);
    const recordAfterResume = await readBlockRecord(1, 1, {
      readControl: (p) =>
        (existsSync(fx.control(p)) ? readFileSync(fx.control(p), "utf8") : null) as never,
    });

    // One more relaunch of the finished run changes nothing.
    assert.equal(await runFeature({ argv: [], workdir: fx.dir }), 0);
    const countsAfterRelaunch = ledgerOf(fx)["1"] as { rejectCount: number };
    assert.equal(countsAfterRelaunch.rejectCount, countsAfterResume.rejectCount);
    assert.deepEqual(blockRecordNames(fx), blocksAfterResume);
    const recordAfterRelaunch = await readBlockRecord(1, 1, {
      readControl: (p) =>
        (existsSync(fx.control(p)) ? readFileSync(fx.control(p), "utf8") : null) as never,
    });
    assert.equal(recordAfterRelaunch?.signature, recordAfterResume?.signature);
  } finally {
    fx.restore();
  }
});
