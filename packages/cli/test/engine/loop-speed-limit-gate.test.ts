/**
 * Phase 7 of feature 153, slice P1e, REWORKED in phase 17 (T235) — the
 * enforced time limit on the verification gate is the DECLARED one now
 * (F153-FR-029): every command of the verification plan carries its own
 * `timeoutSec`, and the gate of feature 105 ends the command — the whole
 * process group — at that limit. The fixture declares one command whose
 * fake (T004) hangs forever with a grandchild that ignores SIGTERM. The
 * attempt ends on the failed gate, the timed-out gate is a FAILED gate
 * (`exit_code` 10, the limit named in the notice) and is never a transient
 * stop — the run goes on to the next attempt, whose command passes. Under
 * `SPECSTRIDE_LIMITS=off` the declared limit still applies (CQ-153-04 A,
 * CT-153-31): no setting lifts a budget (governance principle XV).
 *
 * The test-only override the engine used to export
 * (`GATE_TIME_LIMIT_SEC_FOR_TESTS`) is GONE: the tests shrink the limit in
 * the document, the way a consumer declares it.
 */
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { runFeature } from "../../src/engine/run-feature.ts";
import { workspaceIdOfWorkspace } from "../../src/engine/workspace-control-root.ts";
import { fixture } from "./loop-speed-helpers.ts";

const REPO_ROOT = fileURLToPath(new URL("../../../..", import.meta.url));
const FAKE = join(REPO_ROOT, "packages/cli/test/fixtures/loop-speed/bin/hang-with-grandchild.mjs");

/**
 * The engine writes its lines with `process.stdout.write` directly, whose
 * raw writes interleave with the test runner's own stream and garble it. One
 * pass-through capture, installed once for the whole file: every write still
 * reaches standard output through the ORIGINAL method (so the runner's
 * stream stays intact and ordered), and the lines that are the ENGINE's —
 * neither the runner's TAP framing nor its summary — are recorded here.
 */
const engineLines: string[] = [];
const originalWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = ((
  chunk: unknown,
  encoding?: BufferEncoding | ((err?: Error) => void),
  callback?: (err?: Error) => void,
): boolean => {
  const text = String(chunk);
  if (!/^(\s*# Subtest |ok \d|not ok \d|# [a-z])/.test(text)) {
    for (const line of text.split("\n")) if (line.trim() !== "") engineLines.push(line);
  }
  return typeof encoding === "function"
    ? originalWrite(chunk, encoding)
    : originalWrite(chunk, encoding, callback);
}) as typeof process.stdout.write;

/** Process groups are available (the kill tests skip with their reason otherwise, F153-FR-032). */
const GROUPS_AVAILABLE = process.platform !== "win32" && (() => {
  try {
    process.kill(-1, 0);
    return true;
  } catch (thrown) {
    return (thrown as NodeJS.ErrnoException).code !== "ENOSYS";
  }
})();

/** The control root the engine of this fixture's workspace writes. */
function controlRoot(work: string): string {
  return join(process.env.HOME ?? "", ".specstride", "workspaces", workspaceIdOfWorkspace(work));
}

type GateRun = {
  readonly work: string;
  readonly control: string;
  readonly pids: () => number[];
  readonly restore: () => void;
};

/**
 * The gate fixture: a workspace whose DECLARED gate command (the document
 * with `discovery: "none"`, so no `npm test` joins the gate) runs the fake of
 * T004 — a hang with a SIGTERM-ignoring grandchild — on the first run of
 * THIS process only (the counter lives beside the workspace, never inside
 * it), so the run can end on the attempt whose command passes. The pid file
 * lives beside the workspace too: the engine's tree handling must never
 * reach it. `SPECSTRIDE_LIMITS` is pinned off the environment the test
 * inherited, so the reject limit of the loop stands.
 *
 * The command's declared limit is `LIMIT_SEC`; the grandchild writes to the
 * inherited pipes and dies of the broken pipe once the ended command's pipes
 * close.
 */
function gateHangsOnce(): GateRun {
  const { dir, restore } = fixture({ verdicts: "APPROVED" });
  const previousLimits = process.env.SPECSTRIDE_LIMITS;
  delete process.env.SPECSTRIDE_LIMITS;
  process.env.SPECSTRIDE_DIAGNOSTICIAN = "off";
  const root = join(dir, "..");
  const pidFile = join(root, "gate-pids.txt");
  const counter = join(root, "gate-runs.txt");
  const runner = join(root, "bin", "gate-check.cjs");
  writeFileSync(
    runner,
    `#!/usr/bin/env node
const fs = require("node:fs");
const C = ${JSON.stringify(counter)};
let n = 0; try { n = Number(fs.readFileSync(C, "utf8")); } catch {}
fs.writeFileSync(C, String(n + 1));
if (n < 1) {
  const child = require("node:child_process").spawn(
    process.execPath, [${JSON.stringify(FAKE)}, ${JSON.stringify(pidFile)}], { stdio: ["ignore", "inherit", "inherit"] });
  child.unref();
  setInterval(() => {}, 1_000); // hang forever; the pipes stay open
}
process.exit(0);
`,
  );
  const control = controlRoot(dir);
  mkdirSync(join(control, "features", "001-one", "verification"), { recursive: true });
  writeFileSync(
    join(control, "features", "001-one", "verification", "verification-commands.json"),
    JSON.stringify({
      schema_version: "specstride.verification-commands/1",
      discovery: "none",
      commands: [
        {
          id: "verify-hang",
          phase: 1,
          executable: "node",
          args: [runner],
          cwd: dir,
          timeoutSec: LIMIT_SEC,
        },
      ],
    }),
  );
  return {
    work: dir,
    control,
    pids: () =>
      existsSync(pidFile)
        ? readFileSync(pidFile, "utf8")
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map((line) => Number(line))
        : [],
    restore: () => {
      if (previousLimits === undefined) delete process.env.SPECSTRIDE_LIMITS;
      else process.env.SPECSTRIDE_LIMITS = previousLimits;
      restore();
    },
  };
}

/** Poll until a pid is gone (the kill is asynchronous at the boundary). */
async function pidIsGone(pid: number): Promise<boolean> {
  for (let waited = 0; waited < 5_000; waited += 100) {
    try {
      process.kill(pid, 0);
    } catch {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

/** Every file of the feature's control directory, as full paths. */
function filesOf(directory: string): string[] {
  const found: string[] = [];
  if (!existsSync(directory)) return found;
  for (const name of readdirSync(directory, { recursive: true })) {
    const path = join(directory, String(name));
    if (statSync(path, { throwIfNoEntry: false })?.isFile()) found.push(path);
  }
  return found;
}

const SKIP = !GROUPS_AVAILABLE && "process groups are unavailable (F153-FR-032)";
// The DECLARED limit of the gate command, and the runner's grace of 2 s: one
// gate attempt ends within limit + grace + 2 s (F153-FR-030). The limit is
// 5 s, not 1 s: attempt 2's command must still pass UNDER LOAD (the whole
// workspace suite runs its files concurrently, and a bare `node` startup
// has been observed past 1 s there), or the run rejects twice and the
// `exit 0` assertion flakes for a reason the phase never owned.
const LIMIT_SEC = 5;
const ONE_ATTEMPT_MS = (LIMIT_SEC + 2 + 2) * 1_000;

test("CT-153-29 the gate is ended at its declared limit", { skip: SKIP }, async () => {
  const run = gateHangsOnce();
  try {
    const started = Date.now();
    const exit = await runFeature({ argv: [], workdir: run.work });
    const elapsed = Date.now() - started;
    assert.equal(exit, 0, "attempt 1 fails the gate at its limit; attempt 2 passes");
    assert.ok(
      elapsed < ONE_ATTEMPT_MS + 15_000,
      `the run with the timed-out attempt ended in ${String(elapsed)} ms`,
    );
    const pids = run.pids();
    assert.equal(pids.length, 2, "the fake recorded two pids");
    for (const pid of pids) {
      assert.ok(await pidIsGone(pid), `pid ${String(pid)} is still alive`);
    }
  } finally {
    // The fake is spawned detached from the ended command's process group,
    // so it would hang forever if a kill missed it: reap it here so no run
    // of these tests leaves stray processes behind.
    for (const pid of run.pids()) {
      try { process.kill(-pid, "SIGKILL"); } catch { try { process.kill(pid, "SIGKILL"); } catch {} }
    }
    run.restore();
  }
});

test("CT-153-29 a timed-out gate is a failed gate", { skip: SKIP }, async () => {
  const run = gateHangsOnce();
  try {
    await runFeature({ argv: [], workdir: run.work });
    const record = JSON.parse(
      readFileSync(
        join(run.control, "features", "001-one", "verification", "phase1.1.json"),
        "utf8",
      ),
    ) as { exit_code: number; roster: readonly { name: string; status: string }[] };
    assert.equal(record.exit_code, 10, "the timed-out command counts as failed");
    assert.ok(
      record.roster.every((entry) => entry.status !== "0"),
      `no roster status is the passing one: ${JSON.stringify(record.roster)}`,
    );
    // Attempt 2 is approved, so the notice of attempt 1 was set aside with
    // the rest of the phase's feedback.
    const notice = readFileSync(
      join(run.control, "features", "001-one", "set-aside", "phase1", "phase1.1.md"),
      "utf8",
    );
    assert.ok(
      notice.includes("ran past its time limit"),
      "the notice holds the runner's timeout text",
    );
    assert.ok(
      notice.includes(`${LIMIT_SEC * 1_000} ms`),
      `the notice names the declared limit: ${notice.slice(0, 600)}`,
    );
  } finally {
    for (const pid of run.pids()) {
      try { process.kill(-pid, "SIGKILL"); } catch { try { process.kill(pid, "SIGKILL"); } catch {} }
    }
    run.restore();
  }
});

test("CT-153-32 a timed-out gate is not a transient stop", { skip: SKIP }, async () => {
  const run = gateHangsOnce();
  try {
    const exit = await runFeature({ argv: [], workdir: run.work });
    assert.equal(exit, 0, "the run went on and ended with the phase approved");
    // The run went on: attempt 2 of the phase ran its own proposer pass.
    const prompts = readFileSync(join(run.work, "prompts.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { role: string })
      .filter((entry) => entry.role === "proposer");
    assert.ok(prompts.length >= 2, "the engine ran a second proposer attempt");
    // No record of the run names a kill reason of F118-FR-007 and no result
    // carries the condition `interrupted`: a time limit is a FAILED gate.
    for (const path of filesOf(join(run.control, "features", "001-one"))) {
      const text = readFileSync(path, "utf8");
      assert.ok(!text.includes('"interrupted"'), `${path} carries the condition interrupted`);
    }
    // The run's terminal record names no kill reason of F118-FR-007: the
    // ended gate is a FAILED gate, not a stop request.
    const runIds = readdirSync(join(run.control, "runs"));
    assert.equal(runIds.length, 1, "exactly one run-id for this test run");
    const eventsText = readFileSync(join(run.control, "runs", runIds[0], "events.jsonl"), "utf8");
    for (const killReason of ["cancel", "stop-request"]) {
      assert.ok(
        !eventsText.includes(`"killReason":"${killReason}"`),
        `the run events name the kill reason ${killReason}`,
      );
    }
  } finally {
    for (const pid of run.pids()) {
      try { process.kill(-pid, "SIGKILL"); } catch { try { process.kill(pid, "SIGKILL"); } catch {} }
    }
    run.restore();
  }
});

test("CT-153-31 limits off does not lift the declared limit", { skip: SKIP }, async () => {
  const run = gateHangsOnce();
  process.env.SPECSTRIDE_LIMITS = "off";
  const linesBefore = engineLines.length;
  try {
    const started = Date.now();
    const exit = await runFeature({ argv: [], workdir: run.work });
    const elapsed = Date.now() - started;
    assert.equal(exit, 0, "the gate was still ended at its limit; attempt 2 passed");
    assert.ok(
      elapsed < ONE_ATTEMPT_MS + 15_000,
      `the gate was still ended at its limit (run: ${String(elapsed)} ms)`,
    );
    // The run says the fact once, and the loop record holds it.
    const said = engineLines
      .slice(linesBefore)
      .filter((line) => line.includes("SPECSTRIDE_LIMITS"));
    assert.equal(said.length, 1, `exactly one limits-off line: ${JSON.stringify(said)}`);
    assert.ok(said[0].includes("limits are off"));
    assert.ok(said[0].includes("time limit"));
    const loopRecord = JSON.parse(
      readFileSync(join(run.control, "features", "001-one", "loop.json"), "utf8"),
    ) as { limitsOff?: { checksStillBounded?: boolean } };
    assert.equal(loopRecord.limitsOff?.checksStillBounded, true);
  } finally {
    for (const pid of run.pids()) {
      try { process.kill(-pid, "SIGKILL"); } catch { try { process.kill(pid, "SIGKILL"); } catch {} }
    }
    run.restore();
  }
});
