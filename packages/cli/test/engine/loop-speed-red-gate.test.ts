/**
 * Phase 24 of feature 153, US1c — a red gate spends its own budget
 * (F153-FR-020 to F153-FR-023; CQ-153-05 answered A — budget A, stop A,
 * block A — on 2026-11-13), on the fixture of T043: a workspace whose
 * declared check fails, so every attempt the engine makes leaves a red gate.
 *
 * The cases (tasks T343 to T347):
 *  - T343 F153-SC-009 the gate fails every attempt: with the switch on the
 *    run halts after exactly 3 red gates with the stop reason and exit code
 *    of CQ-153-05 (`max_rejects`, exit 2), the reject count of the ledger
 *    stays 0, and the supervisor's classification of the stop is not
 *    transient (the `reject-limit` row of the gate-halts contract is
 *    `retryable: false`);
 *  - T344 red gates and critic rejections interleaved: the reject count
 *    rises only with critic REJECTED and MALFORMED verdicts — F153-SC-009;
 *  - T345 two critic rejections first: the red gates that follow spend
 *    their own budget, never the reject limit, and the run is bounded by
 *    reject limit + red-gate limit (F153-FR-021);
 *  - T346 a kill between the red gates and a resume: the count is DERIVED
 *    from the gate result records of the control plane (F153-FR-021,
 *    never an in-memory counter), so the resumed run still halts at the
 *    third red gate of the phase with the reject count at 0;
 *  - T347 CT-153-5 the guard: with `verification.redGate.ownBudget: off`
 *    (and under the `parity` profile) a red gate costs a critic rejection
 *    exactly as before (RGB-1, F105-FR-005).
 *
 * No paid or external model API is called (F153-FR-060): the proposer and
 * the critic are the stub `claude` of `loop-speed-helpers.ts`, the gate is
 * a `node` script beside the workspace.
 */
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { gateHalt } from "@specstride/contracts/engine/gate-halts";

import { runFeature } from "../../src/engine/run-feature.ts";
import { workspaceIdOfWorkspace } from "../../src/engine/workspace-control-root.ts";
import { loopConfigurationOf } from "../../src/engine/loop-config.ts";
import { fixture, type Verdicts } from "./loop-speed-helpers.ts";

/** The control root the engine of this fixture's workspace writes. */
function controlRootOf(work: string): string {
  return join(process.env.HOME ?? "", ".specstride", "workspaces", workspaceIdOfWorkspace(work));
}

/** The engine's records of the phase, `features/<slug>/…` under the control root. */
function controlOf(work: string, ...parts: string[]): string {
  return join(controlRootOf(work), "features", "001-one", ...parts);
}

/** The counts the ledger of the phase holds. */
function ledgerOf(work: string): Record<string, { rejectCount: number; phaseAttemptOrdinal: number }> {
  const file = controlOf(work, "ledger.json");
  return existsSync(file)
    ? (JSON.parse(readFileSync(file, "utf8")) as Record<
        string,
        { rejectCount: number; phaseAttemptOrdinal: number }
      >)
    : {};
}

/** How many prompts of the given role the stub saw (one proposer call per attempt). */
function promptsOfRole(work: string, role: string): number {
  const file = join(work, "prompts.jsonl");
  if (!existsSync(file)) return 0;
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .filter((line) => (JSON.parse(line) as { role: string }).role === role)
    .length;
}

/** The gate result records the phase holds, with the code each folds. */
function verificationRecords(work: string): readonly { file: string; code: number }[] {
  const out: { file: string; code: number }[] = [];
  for (let k = 1; k <= 16; k += 1) {
    const file = controlOf(work, "verification", `phase1.${String(k)}.json`);
    if (!existsSync(file)) continue;
    out.push({
      file,
      code: Number((JSON.parse(readFileSync(file, "utf8")) as { exit_code?: unknown }).exit_code),
    });
  }
  return out;
}

/** How many gate result records of the phase fold a red gate (code not 0). */
function redGatesOf(work: string): number {
  return verificationRecords(work).filter((record) => record.code !== 0).length;
}

/** The one `[DIGEST]` line the run printed. */
function digestOf(lines: readonly string[]): string {
  return lines.find((line) => line.includes("DIGEST")) ?? "";
}

/** Swaps standard output for a buffer; the restore puts it back and returns nothing. */
function captureStdout(): { lines: () => readonly string[]; restore: () => void } {
  const chunks: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: unknown): boolean => {
    if (typeof chunk === "string") chunks.push(chunk);
    return originalWrite(chunk as string);
  }) as typeof process.stdout.write;
  return {
    lines: () => chunks.join("").split("\n"),
    restore: () => {
      process.stdout.write = originalWrite;
      for (const chunk of chunks) originalWrite(chunk);
    },
  };
}

/**
 * The T043 fixture: the declared check of the workspace fails on the phase
 * attempts named in `failsOnAttempts` and passes otherwise. The attempt
 * number is DERIVED, never counted: the gate script reads the gate result
 * records the control plane already holds (`verification/phase1.<k>.json`)
 * and fails when the attempt it is running in — one past the records — is
 * named, so extra executions inside one attempt (a scoped inner check, a
 * probe) see the same verdict and the fixture never drifts. With
 * `switchOff` a project file holds `verification.redGate.ownBudget: false`
 * (T347).
 */
function redGateFixture(input: {
  readonly verdicts: Verdicts;
  readonly failsOnAttempts: "always" | readonly number[];
  readonly switchOff?: boolean;
}): { readonly work: string; readonly restore: () => void } {
  const { dir, restore } = fixture({ verdicts: input.verdicts });
  process.env.SPECSTRIDE_DIAGNOSTICIAN = "off";
  const root = join(dir, "..");
  mkdirSync(join(root, "bin"), { recursive: true });
  const always = input.failsOnAttempts === "always";
  const failAlways = always ? "true" : "false";
  const failList = always ? "[]" : JSON.stringify(input.failsOnAttempts);
  // The gate result records the engine holds for this workspace: the gate
  // script counts them to know which attempt it is running in (F153-FR-021
  // reads the same place — the count is derived from the records, never
  // from a counter in memory).
  const recordsDir = join(
    root,
    ".specstride",
    "workspaces",
    workspaceIdOfWorkspace(dir),
    "features",
    "001-one",
    "verification",
  );
  const fake = join(root, "bin", "red-gate.cjs");
  writeFileSync(
    fake,
    `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const DIR = ${JSON.stringify(recordsDir)};
let seen = 0;
try { seen = fs.readdirSync(DIR).filter((f) => /^phase1\\.\\d+\\.json$/.test(f)).length; } catch {}
const attempt = seen + 1;
fs.appendFileSync(${JSON.stringify(join(root, "gate-log.txt"))}, "attempt=" + attempt + "\\n");
const fails = ${failAlways} || ${failList}.includes(attempt);
if (fails) {
  console.log("FAILED test_alpha - expected 1");
  console.log("FAILED test_beta - expected 2");
  process.exit(1);
}
process.exit(0);
`,
  );
  chmodSync(fake, 0o755);
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify(
      { name: "x", private: true, scripts: { test: "node ../bin/red-gate.cjs" } },
      null,
      2,
    ),
  );
  if (input.switchOff) {
    writeFileSync(
      join(dir, "specstride.yaml"),
      "schema: 1\nverification:\n  redGate:\n    ownBudget: false\n",
    );
  }
  return { work: dir, restore };
}

test("T343 F153-SC-009 the gate fails every attempt: the run halts at the third red gate", async () => {
  const fx = redGateFixture({ verdicts: "APPROVED", failsOnAttempts: "always" });
  const out = captureStdout();
  try {
    const exit = await runFeature({ argv: [], workdir: fx.work });
    // The stop of CQ-153-05 A: exit 2, stop reason `max_rejects` …
    assert.equal(exit, 2);
    assert.match(digestOf(out.lines()), /DIGEST exit=2 stop=max_rejects /);
    // … after exactly three red gates: three attempts, three gate result
    // records, each folding a non-zero code (F153-FR-023).
    assert.equal(promptsOfRole(fx.work, "proposer"), 3, "exactly three attempts ran");
    const records = verificationRecords(fx.work);
    assert.equal(records.length, 3, "three gate result records of the phase");
    for (const record of records) assert.notEqual(record.code, 0, "each record folds a red gate");
    // … and the reject count of the ledger NEVER moved (F153-FR-020): the
    // red gates spent their own budget, not the reject limit.
    const counts = ledgerOf(fx.work)["1"];
    assert.ok(counts !== undefined, "the ledger holds the counts of the phase");
    assert.equal(counts.rejectCount, 0, "a red gate never spends the reject limit");
    assert.equal(counts.phaseAttemptOrdinal, 3);
    assert.equal(promptsOfRole(fx.work, "critic"), 0, "no critic was ever reached");
    // The supervisor's classification is not transient: the `reject-limit`
    // row of the gate-halts contract is exit 2, `max_rejects`, not retryable.
    const row = gateHalt("reject-limit");
    assert.ok(row !== undefined);
    assert.equal(row?.stopReason, "max_rejects");
    assert.equal(row?.exitCode, 2);
    assert.equal(row?.retryable, false, "F153-FR-022: the stop is non-transient");
  } finally {
    out.restore();
    fx.restore();
  }
});

test("T344 red gates and critic rejections interleaved: only critic verdicts raise the reject count", async () => {
  // The gate fails on runs 1, 3 and 4 and passes on run 2, where the critic
  // rejects: attempt 1 a red gate, attempt 2 a critic rejection, attempts 3
  // and 4 red gates again — the budget, not the reject limit, ends the run.
  const fx = redGateFixture({
    verdicts: ["REJECTED", "REJECTED"],
    failsOnAttempts: [1, 3, 4],
  });
  const out = captureStdout();
  try {
    const exit = await runFeature({ argv: [], workdir: fx.work });
    assert.equal(exit, 2);
    assert.match(digestOf(out.lines()), /DIGEST exit=2 stop=max_rejects /);
    assert.equal(promptsOfRole(fx.work, "proposer"), 4, "four attempts: gate, critic, gate, gate");
    assert.equal(promptsOfRole(fx.work, "critic"), 1, "one critic call, on attempt 2");
    // F153-SC-009 — the reject count of the ledger is exactly the count of
    // critic REJECTED and MALFORMED verdicts of the phase: 1 here, never the
    // three red gates.
    const counts = ledgerOf(fx.work)["1"];
    assert.ok(counts !== undefined);
    assert.equal(counts.rejectCount, 1, "the red gates did not spend the reject limit");
    assert.equal(counts.phaseAttemptOrdinal, 4);
    // Every attempt left a gate result record; exactly three fold a red gate.
    assert.equal(verificationRecords(fx.work).length, 4, "one record per attempt");
    assert.equal(redGatesOf(fx.work), 3, "three red gates of the phase");
  } finally {
    out.restore();
    fx.restore();
  }
});

test("T345 two critic rejections first: the red gates after them spend their own budget", async () => {
  // The gate passes on runs 1 and 2 (the critic rejects both), then fails on
  // every later run. Reject limit + red-gate limit bound the phase: the run
  // goes past ordinal 3 — where the reject limit alone would have halted —
  // and the budget halts it at its own third red gate (F153-FR-021).
  const fx = redGateFixture({
    verdicts: ["REJECTED", "REJECTED"],
    failsOnAttempts: [3, 4, 5],
  });
  const out = captureStdout();
  try {
    const exit = await runFeature({ argv: [], workdir: fx.work });
    assert.equal(exit, 2);
    assert.match(digestOf(out.lines()), /DIGEST exit=2 stop=max_rejects /);
    assert.equal(promptsOfRole(fx.work, "proposer"), 5, "five attempts: reject, reject, three red gates");
    assert.equal(promptsOfRole(fx.work, "critic"), 2);
    const counts = ledgerOf(fx.work)["1"];
    assert.ok(counts !== undefined);
    // Two critic rejections raised the count; the three red gates did not —
    // with the switch on, the reject limit is not even consulted (F153-FR-022).
    assert.equal(counts.rejectCount, 2);
    assert.equal(counts.phaseAttemptOrdinal, 5, "the run went past the reject limit of 3");
    assert.equal(verificationRecords(fx.work).length, 5, "one record per attempt");
    assert.equal(redGatesOf(fx.work), 3, "exactly three red gates, then the halt");
  } finally {
    out.restore();
    fx.restore();
  }
});

test("T346 a kill between the red gates and a resume still halts at the third red gate", async () => {
  const fx = redGateFixture({ verdicts: "APPROVED", failsOnAttempts: "always" });
  const out = captureStdout();
  const child: ChildProcess = spawn(
    process.execPath,
    [
      join(import.meta.dirname, "loop-speed-red-gate-child.ts"),
      join(import.meta.dirname, "..", "..", "src", "engine", "run-feature.ts"),
      fx.work,
    ],
    { stdio: "ignore" },
  );
  try {
    // The first red gate settles on the control plane: its gate result
    // record is written and the ledger holds the ordinal of attempt 1.
    const deadline = Date.now() + 60_000;
    for (;;) {
      const counts = ledgerOf(fx.work)["1"];
      if (
        verificationRecords(fx.work).length >= 1 &&
        counts !== undefined &&
        counts.phaseAttemptOrdinal >= 1
      ) {
        break;
      }
      if (Date.now() > deadline) assert.fail("the killed run never reached its first red gate");
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    child.kill("SIGKILL");
    await new Promise((resolve) => child.once("exit", resolve));
    // The resume is a fresh launch: no approval record of the phase exists,
    // so the engine goes on where the killed run left it (F102-FR-022). The
    // count of red gates is DERIVED from the records the control plane holds
    // (F153-FR-021) — never an in-memory counter, which the kill destroyed.
    const exit = await runFeature({ argv: [], workdir: fx.work });
    assert.equal(exit, 2, "the resumed run halts when the budget is spent");
    assert.match(digestOf(out.lines()), /DIGEST exit=2 stop=max_rejects /);
    // Exactly three red gates over BOTH runs, and the reject count still 0.
    const records = verificationRecords(fx.work);
    assert.equal(records.length, 3, "the resumed run read the records of the killed run");
    for (const record of records) assert.notEqual(record.code, 0);
    const counts = ledgerOf(fx.work)["1"];
    assert.ok(counts !== undefined);
    assert.equal(counts.rejectCount, 0, "the budget survived the kill; the reject count never moved");
    assert.equal(promptsOfRole(fx.work, "critic"), 0);
  } finally {
    if (child.exitCode === null && !child.killed) child.kill("SIGKILL");
    out.restore();
    fx.restore();
  }
});

test("T347 CT-153-5 the switch off: a red gate costs a critic rejection, as before", async () => {
  const fx = redGateFixture({
    verdicts: ["REJECTED", "REJECTED", "REJECTED"],
    failsOnAttempts: "always",
    switchOff: true,
  });
  const out = captureStdout();
  try {
    // Row RGB-1 — the switch off, the as-is behaviour of F105-FR-005: the
    // reject limit of 3 bounds the run, and every red gate raised the count.
    const exit = await runFeature({ argv: [], workdir: fx.work });
    assert.equal(exit, 2);
    assert.match(digestOf(out.lines()), /DIGEST exit=2 stop=max_rejects /);
    assert.equal(promptsOfRole(fx.work, "proposer"), 3, "the reject limit halted the run");
    const counts = ledgerOf(fx.work)["1"];
    assert.ok(counts !== undefined);
    assert.equal(counts.rejectCount, 3, "each red gate counted as a critic rejection");
    // And under the `parity` profile the switch is off too (row 139), with
    // the budget limit still a finite 3 — never unbounded (F153-FR-021).
    const parity = fixture({ verdicts: "APPROVED" });
    try {
      const home = process.env.HOME ?? "";
      const userConfig = join(home, ".config", "specstride");
      mkdirSync(userConfig, { recursive: true });
      writeFileSync(join(userConfig, "config.yaml"), "schema: 1\nprofile: parity\n");
      const loop = loopConfigurationOf({
        home,
        workdir: parity.dir,
        environment: { PATH: process.env.PATH ?? "" },
      });
      assert.equal(loop.redGateOwnBudget, false, "parity keeps the switch off");
      assert.equal(loop.redGateLimit, 3, "no setting unbounds the budget");
    } finally {
      parity.restore();
    }
  } finally {
    out.restore();
    fx.restore();
  }
});
