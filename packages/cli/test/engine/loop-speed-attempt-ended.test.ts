/**
 * Phase 8 of feature 153, US2 — every attempt closes (T102–T105, T109,
 * T110; F153-FR-037, F153-SC-005). Every `attempt.started` the engine writes
 * gets exactly one `attempt.ended`, whose `endCause` the rule table
 * (`core/src/gate/end-cause.ts`) decides:
 *
 *  - T102 an approved attempt closes with `approved`;
 *  - T103 on the red-gate fixture of T043 every attempt closes, the red one
 *    as `verification-failed`;
 *  - T104 a rejection still closes once, at the same place in the event
 *    order as before this feature (Principle XVIII);
 *  - T105 a stop request during the pass closes with `stopped`;
 *  - T109 a run a dead process left open is closed by the next writer with
 *    `endCause: "crash"` and `synthesized: true` (F111-FR-004), once;
 *  - T110 an engine killed (SIGKILL) at each point of an attempt — during
 *    the pass, during the gate, during the critic call, after the verdict
 *    and before the approval record — leaves, after the next start, no
 *    `attempt.started` without exactly one `attempt.ended`.
 *
 * No paid or external model API is called (F153-FR-060): the stub agents are
 * the helpers of `loop-speed-helpers.ts` (T109/T110 add marker files and one
 * sleep to widen a kill window, nothing else).
 */
import { spawn } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";
import assert from "node:assert/strict";
import test from "node:test";

import { runFeature } from "../../src/engine/run-feature.ts";
import { workspaceIdOfWorkspace } from "../../src/engine/workspace-control-root.ts";
import { fixture, type Fixture } from "./loop-speed-helpers.ts";

/** The control root the engine of this fixture's workspace writes. */
function controlRoot(work: string): string {
  return join(process.env.HOME ?? "", ".specstride", "workspaces", workspaceIdOfWorkspace(work));
}

type EngineEvent = { readonly type: string; readonly data: Record<string, unknown> };

/** The parsed events of one events file. */
function eventsOf(file: string): readonly EngineEvent[] {
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as EngineEvent);
}

/** Every events file of the control root, oldest first. */
function eventsFilesOf(control: string): readonly string[] {
  const runs = join(control, "runs");
  if (!existsSync(runs)) return [];
  return readdirSync(runs)
    .map((name) => join(runs, name, "events.jsonl"))
    .filter((file) => existsSync(file))
    .sort((a, b) => (statSync(a).mtimeMs ?? 0) - (statSync(b).mtimeMs ?? 0));
}

/** The events of the NEWEST run of the control root. */
function theNewestRun(control: string): readonly EngineEvent[] {
  const files = eventsFilesOf(control);
  assert.ok(files.length >= 1, "the run wrote an events file");
  return eventsOf(files[files.length - 1]);
}

/** The attempts that started, and the attempts that ended, over ALL runs. */
function attemptsOf(control: string): {
  readonly started: readonly string[];
  readonly ended: readonly string[];
} {
  const started: string[] = [];
  const ended: string[] = [];
  for (const file of eventsFilesOf(control)) {
    for (const event of eventsOf(file)) {
      if (event.type === "attempt.started") {
        started.push(`${String(event.data.phase)}.${String(event.data.attempt)}`);
      }
      if (event.type === "attempt.ended") {
        ended.push(`${String(event.data.phase)}.${String(event.data.attempt)}`);
      }
    }
  }
  return { started, ended };
}

/** Guard of F153-FR-037: every attempt that started ended exactly once. */
function everyAttemptClosed(control: string): void {
  const { started, ended } = attemptsOf(control);
  const starts = new Map<string, number>();
  for (const key of started) starts.set(key, (starts.get(key) ?? 0) + 1);
  const ends = new Map<string, number>();
  for (const key of ended) ends.set(key, (ends.get(key) ?? 0) + 1);
  assert.equal(ended.length, started.length, "as many attempt.ended as attempt.started");
  for (const [key, count] of starts) {
    assert.equal(ends.get(key), count, `attempt ${key} started ${String(count)} time(s) and ended exactly as often`);
  }
  for (const [key, count] of ends) {
    assert.ok(starts.has(key), `attempt.ended ${key} closes an attempt that started`);
    void count;
  }
}

/** Poll until the predicate holds. */
async function until(what: () => boolean, ms: number, label: string): Promise<void> {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (what()) return;
    await new Promise((done) => setTimeout(done, 25));
  }
  assert.fail(`timed out waiting for ${label}`);
}

/* ------------------------------------------------------------------ *
 * T102, T103, T104 — the ends the engine writes itself.
 * ------------------------------------------------------------------ */

test("CT-153-37 an approved attempt closes", async () => {
  const fx: Fixture = fixture({ verdicts: "APPROVED" });
  const control = controlRoot(fx.dir);
  try {
    const exit = await runFeature({ argv: [], workdir: fx.dir });
    assert.equal(exit, 0);
    const events = theNewestRun(control);
    const starts = events.filter((event) => event.type === "attempt.started");
    const ends = events.filter((event) => event.type === "attempt.ended");
    assert.equal(starts.length, 1, "one attempt ran");
    assert.equal(starts[0]?.data.phase, 1);
    assert.equal(starts[0]?.data.attempt, 1);
    assert.equal(ends.length, 1, "exactly one attempt.ended for phase 1 attempt 1");
    assert.deepEqual(ends[0]?.data, { phase: 1, attempt: 1, endCause: "approved", synthesized: false });
    everyAttemptClosed(control);
  } finally {
    fx.restore();
  }
});

/**
 * The T043 fixture: the declared check fails the gate on the first run of
 * THIS process only (the counter lives beside the workspace), so attempt 1
 * closes as a failed gate and attempt 2 is approved.
 */
function gateFailsOnce(): Fixture & { readonly control: string } {
  const fx = fixture({ verdicts: "APPROVED" });
  process.env.SPECSTRIDE_DIAGNOSTICIAN = "off";
  const root = join(fx.dir, "..");
  const counter = join(root, "gate-runs.txt");
  mkdirSync(join(root, "bin"), { recursive: true });
  const fake = join(root, "bin", "fail-once.cjs");
  writeFileSync(
    fake,
    `#!/usr/bin/env node
const fs = require("node:fs");
const C = ${JSON.stringify(counter)};
let n = 0; try { n = Number(fs.readFileSync(C, "utf8")); } catch {}
fs.writeFileSync(C, String(n + 1));
if (n < 1) { console.log("FAILED test_alpha - expected 1"); process.exit(1); }
process.exit(0);
`,
  );
  chmodSync(fake, 0o755);
  writeFileSync(
    join(fx.dir, "package.json"),
    JSON.stringify({ name: "x", private: true, scripts: { test: `node ${JSON.stringify(fake)}` } }, null, 2),
  );
  return { ...fx, control: controlRoot(fx.dir) };
}

test("CT-153-37 a red gate closes as verification-failed", async () => {
  const fx = gateFailsOnce();
  try {
    const exit = await runFeature({ argv: [], workdir: fx.dir });
    assert.equal(exit, 0, "attempt 2 passes the gate and the phase is approved");
    const events = theNewestRun(fx.control);
    const ends = events.filter((event) => event.type === "attempt.ended");
    assert.equal(ends.length, 2, "every attempt has exactly one attempt.ended");
    assert.deepEqual(ends[0]?.data, {
      phase: 1,
      attempt: 1,
      endCause: "verification-failed",
      synthesized: false,
    });
    assert.deepEqual(ends[1]?.data, {
      phase: 1,
      attempt: 2,
      endCause: "approved",
      synthesized: false,
    });
    everyAttemptClosed(fx.control);
  } finally {
    fx.restore();
  }
});

test("a rejection still closes once", async () => {
  const fx: Fixture = fixture({ verdicts: "REJECTED" });
  const control = controlRoot(fx.dir);
  try {
    await runFeature({ argv: [], workdir: fx.dir });
    const events = theNewestRun(control);
    const indexOf = (event: EngineEvent): number => events.indexOf(event);
    const started = events.filter((event) => event.type === "attempt.started");
    const ended = events.filter((event) => event.type === "attempt.ended");
    assert.ok(started.length >= 1, "at least one attempt ran to a rejection");
    for (const end of ended) {
      assert.ok(
        end.data.endCause === "rejected" || end.data.endCause === "malformed",
        `attempt ${String(end.data.attempt)} closed as its rejection kind, not ${String(end.data.endCause)}`,
      );
    }
    // ONE closure per attempt (the wrapper of T108 reaches a void).
    assert.equal(ended.length, started.length, "exactly one attempt.ended per attempt.started");
    // The SAME PLACE as before this feature: the rejection path closes the
    // attempt where `emitReject` always stood — after the attempt opened and
    // before anything of the recovery order or the next attempt is written.
    const firstEnd = indexOf(ended[0] as EngineEvent);
    assert.ok(
      firstEnd > indexOf(started[0] as EngineEvent),
      "the closure comes after the attempt started",
    );
    const firstRecovery = events.findIndex((event) => event.type.startsWith("recovery."));
    const nextStart = indexOf(started[1] as EngineEvent);
    assert.ok(
      firstEnd < (nextStart === -1 ? Number.MAX_SAFE_INTEGER : nextStart),
      "the closure comes before the next attempt starts",
    );
    if (firstRecovery !== -1) {
      assert.ok(firstEnd < firstRecovery, "the closure comes before the recovery order");
    }
    everyAttemptClosed(control);
  } finally {
    fx.restore();
  }
});

/* ------------------------------------------------------------------ *
 * T105 — a stop request during the pass.
 * ------------------------------------------------------------------ */

test("CT-153-37 a stopped attempt closes", async () => {
  // The gate fails ONCE, so a second attempt starts: its attempt-top poll is
  // where the stop request the stub wrote during the first pass is taken.
  const fx = gateFailsOnce();
  const control = fx.control;
  // The stub of the fixture, with ONE added line: the proposer writes the
  // stop request into the inbox of the control root MID-PASS.
  const stub = join(fx.dir, "..", "bin", "claude");
  const stopLine =
    "try { fs.mkdirSync(path.join(process.env.SPECSTRIDE_TEST_CONTROL, 'inbox'), { recursive: true });" +
    " fs.writeFileSync(path.join(process.env.SPECSTRIDE_TEST_CONTROL, 'inbox', 'stop.request'), 'now'); } catch {}";
  const source = readFileSync(stub, "utf8").replace(
    'fs.appendFileSync("prompts.jsonl", JSON.stringify({ role, prompt }) + "\\n");',
    `fs.appendFileSync("prompts.jsonl", JSON.stringify({ role, prompt }) + "\\n");\n${stopLine}`,
  );
  assert.notEqual(source, readFileSync(stub, "utf8"), "the stub carries the stop write");
  writeFileSync(stub, source);
  chmodSync(stub, 0o755);
  const before = process.env.SPECSTRIDE_TEST_CONTROL;
  process.env.SPECSTRIDE_TEST_CONTROL = control;
  try {
    const exit = await runFeature({ argv: [], workdir: fx.dir });
    assert.equal(exit, 6, "the run ends on the stop request");
    const events = theNewestRun(control);
    const ends = events.filter((event) => event.type === "attempt.ended");
    assert.equal(ends.length, 2, "exactly one attempt.ended per attempt");
    assert.equal(ends[0]?.data.endCause, "verification-failed", "the red gate closed first");
    assert.deepEqual(ends[1]?.data, {
      phase: 1,
      attempt: 2,
      endCause: "stopped",
      synthesized: false,
    });
    everyAttemptClosed(control);
  } finally {
    if (before === undefined) delete process.env.SPECSTRIDE_TEST_CONTROL;
    else process.env.SPECSTRIDE_TEST_CONTROL = before;
    fx.restore();
  }
});

/* ------------------------------------------------------------------ *
 * T109 — a dead process's open attempt, closed by the next writer.
 * ------------------------------------------------------------------ */

test("CT-153-37 a dead process is closed by the next writer", async () => {
  const fx: Fixture = fixture({ verdicts: "APPROVED" });
  const control = controlRoot(fx.dir);
  try {
    // The events file of a run whose process died mid-attempt: the opener is
    // there, its closer is not (the process died before it wrote one).
    const dead = join(control, "runs", "run-dead-of-f153");
    mkdirSync(dead, { recursive: true });
    const at = "2026-11-14T09:00:00.000Z";
    writeFileSync(
      join(dead, "events.jsonl"),
      `${JSON.stringify({ type: "run.started", at, data: {} })}\n` +
        `${JSON.stringify({ type: "attempt.started", at, data: { phase: 1, attempt: 1, strategy: "classic" } })}\n`,
    );
    // THE NEXT WRITER: the first lines of the next run's own events file are
    // the closers of the spans the dead run left open (F111-FR-004).
    const exit = await runFeature({ argv: [], workdir: fx.dir });
    assert.equal(exit, 0);
    const events = theNewestRun(control);
    const synthesized = events.filter(
      (event) => event.type === "attempt.ended" && event.data.synthesized === true,
    );
    assert.equal(synthesized.length, 1, "exactly one synthesized attempt.ended");
    assert.deepEqual(synthesized[0]?.data, {
      phase: 1,
      attempt: 1,
      endCause: "crash",
      synthesized: true,
    });
    const firstOwnStart = events.findIndex((event) => event.type === "attempt.started" && event.data.synthesized !== true);
    const firstOwnStartOr = firstOwnStart === -1 ? events.length : firstOwnStart;
    assert.ok(
      events.indexOf(synthesized[0] as EngineEvent) < firstOwnStartOr,
      "the closer stands before any new event of the next writer",
    );
    // Running AGAIN adds none: the dead run was closed once.
    assert.equal(await runFeature({ argv: [], workdir: fx.dir }), 0);
    const thirdRun = theNewestRun(control);
    assert.equal(
      thirdRun.filter(
        (event) => event.type === "attempt.ended" && event.data.synthesized === true,
      ).length,
      0,
      "the next writer adds no closer the second time",
    );
    // The dead run's opener is closed ONCE: the closer the second run wrote
    // (the synthesized one), not another.
    const all = attemptsOf(control);
    assert.equal(all.started.filter((key) => key === "1.1").length, 2, "the dead opener and the rerun");
    assert.equal(all.ended.filter((key) => key === "1.1").length, 2, "one synthesized closer, one rerun end");
  } finally {
    fx.restore();
  }
});

/* ------------------------------------------------------------------ *
 * T110 — SIGKILL at each point of an attempt (F153-SC-005).
 * ------------------------------------------------------------------ */

/** The engine, as a process of its own, so the test can SIGKILL it. */
const RUN_FEATURE_RUNNER = /* js */ `
const [moduleUrl, work] = process.argv.slice(1);
const mod = await import(moduleUrl);
process.exitCode = await mod.runFeature({ argv: [], workdir: work });
`;

/**
 * A stub that MARKS each point of an attempt with a file beside the
 * workspace, and holds the critic's reply 400 ms after each marker, so the
 * test can kill the engine inside the window the marker names. Everything
 * else it does is what the helper's stub does.
 */
function stubWithMarkers(): string {
  return `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns");
const role = prompt.includes("Diagnostician") ? "diagnostician" : (critic ? "critic" : "proposer");
const MARK = process.env.SPECSTRIDE_TEST_MARK || "";
const mark = (name) => { try { fs.writeFileSync(path.join(MARK, name), "now"); } catch {} };
const hold = (ms) => { const end = Date.now() + ms; while (Date.now() < end) {} };
fs.appendFileSync("prompts.jsonl", JSON.stringify({ role, prompt }) + "\\n");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (role === "diagnostician") {
  fs.writeFileSync("seen-by-diagnostician.txt", prompt);
  console.log(JSON.stringify({ type: "result", result: "CASE: GROUNDING\\nName the missing test of T001." }));
} else if (critic) {
  mark("mark-critic");
  hold(400);
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  mark("mark-verdict");
  hold(400);
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  mark("mark-pass");
  hold(400);
  const evidence = /write (\\.specstride\\S+?):/i.exec(prompt)[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  fs.writeFileSync("made.txt", process.env.STUB_NEW_FILE ?? "work\\n");
  fs.mkdirSync("newdir", { recursive: true });
  fs.writeFileSync("newdir/inside.txt", "nested\\n");
  const tasks = "specs/001-one/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replace("[ ]", "[x]"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;
}

/**
 * Kill the engine at the named point of the attempt and start the same
 * feature again: every attempt that started ends exactly once (the dead
 * run's open attempt is closed by the next writer, F111-FR-004).
 */
async function killedAt(marker: string, gate?: string): Promise<void> {
  const fx = fixture({ verdicts: "APPROVED" });
  const control = controlRoot(fx.dir);
  const root = join(fx.dir, "..");
  const marks = join(root, "marks");
  mkdirSync(marks, { recursive: true });
  process.env.SPECSTRIDE_TEST_MARK = marks;
  writeFileSync(join(root, "bin", "claude"), stubWithMarkers());
  chmodSync(join(root, "bin", "claude"), 0o755);
  if (gate !== undefined) {
    // The declared check MARKS the gate, then holds 400 ms inside it.
    const fake = join(root, "bin", "gate-mark.cjs");
    writeFileSync(
      fake,
      `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
fs.writeFileSync(path.join(${JSON.stringify(marks)}, ${JSON.stringify(marker)}), "now");
const end = Date.now() + 400;
while (Date.now() < end) {}
`,
    );
    chmodSync(fake, 0o755);
    writeFileSync(
      join(fx.dir, "package.json"),
      JSON.stringify(
        { name: "x", private: true, scripts: { test: `node ${JSON.stringify(fake)}` } },
        null,
        2,
      ),
    );
  }
  const moduleUrl = pathToFileURL(
    join(import.meta.dirname, "../../src/engine/run-feature.ts"),
  ).href;
  const engine = spawn(
    process.execPath,
    ["--input-type=module", "-e", RUN_FEATURE_RUNNER, moduleUrl, fx.dir],
    { cwd: fx.dir, stdio: ["ignore", "pipe", "pipe"] },
  );
  let engineOutput = "";
  engine.stdout?.on("data", (chunk: Buffer) => {
    engineOutput += String(chunk);
  });
  engine.stderr?.on("data", (chunk: Buffer) => {
    engineOutput += String(chunk);
  });
  try {
    await until(
      () => existsSync(join(marks, marker)) || engine.exitCode !== null || engine.signalCode !== null,
      20_000,
      `the marker ${marker} (engine exit ${String(engine.exitCode)} signal ${String(engine.signalCode)})`,
    );
    if (engine.exitCode !== null || engine.signalCode !== null) {
      assert.fail(
        `the engine left early (exit ${String(engine.exitCode)} signal ${String(engine.signalCode)}) before ${marker}\n${engineOutput.slice(-2000)}`,
      );
    }
    engine.kill("SIGKILL");
    await until(
      () => engine.exitCode !== null || engine.signalCode !== null,
      10_000,
      "the engine died",
    );
    assert.equal(engine.signalCode, "SIGKILL", "the engine died by the SIGKILL");
    // THE NEXT START closes what the killed run left open.
    await runFeature({ argv: [], workdir: fx.dir });
    everyAttemptClosed(control);
  } finally {
    delete process.env.SPECSTRIDE_TEST_MARK;
    fx.restore();
  }
}

test("F153-SC-005 killed during the pass: the next start closes the attempt", async () => {
  await killedAt("mark-pass");
});

test("F153-SC-005 killed during the gate: the next start closes the attempt", async () => {
  await killedAt("mark-gate", "gate");
});

test("F153-SC-005 killed during the critic call: the next start closes the attempt", async () => {
  await killedAt("mark-critic");
});

test("F153-SC-005 killed after the verdict, before the approval record: the next start closes", async () => {
  await killedAt("mark-verdict");
});
