/**
 * Phase 9 of feature 153, US2 — the timed events of the gate, the critic and
 * the diagnosis (T112–T118; F153-FR-033 to F153-FR-035):
 *
 *  - T112 an approved gate emits `verification.started` and closes it with
 *    `verification.ended` (`result: "passed"`, `rc: 0`);
 *  - T113 on the red-gate fixture of T043 the closer is `result: "failed"`,
 *    `rc: 10`;
 *  - T114 the critic's call emits `critic.started` and closes it with
 *    `critic.call` carrying the outcome and a non-negative `latencyMs`;
 *  - T115 a critic executable that exits non-zero still closes the pair, and
 *    the outcome says the call failed (the safe failure of F101-FR-010);
 *  - T116 every diagnosis that is due opens `recovery.diagnosis_started` and
 *    closes it with exactly one `recovery.diagnosis_done` or
 *    `recovery.diagnosis_failed`;
 *  - T117 every event of those types carries only the fields the catalogue
 *    row lists, and no event carries an excerpt of a secret the check wrote;
 *  - T118 an events file that cannot be written mid-run changes no decision:
 *    the run ends with the same outcome and exit code as a writable one.
 *
 * No paid or external model API is called (F153-FR-060): the agents are stub
 * executables, and the check is a script this file writes.
 */
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import process from "node:process";
import assert from "node:assert/strict";
import test from "node:test";

import { runFeature } from "../../src/engine/run-feature.ts";
import { workspaceIdOfWorkspace } from "../../src/engine/workspace-control-root.ts";
import { stubClaude, fixture, type Fixture } from "./loop-speed-helpers.ts";

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

/** The catalogue field lists of the five timed types (event-catalogue.tsv). */
const CATALOGUE_FIELDS: Readonly<Record<string, readonly string[]>> = {
  "verification.started": ["phase", "attempt", "planRef"],
  "verification.ended": ["phase", "attempt", "result", "rc", "evidenceRef", "synthesized"],
  "critic.started": ["phase", "attempt", "provider"],
  "critic.call": [
    "promptRef",
    "form",
    "outcome",
    "latencyMs",
    "usage",
    "diversity",
    "sameModelWarning",
    "synthesized",
  ],
  "recovery.diagnosis_started": ["phase", "attempt", "provider"],
  "recovery.diagnosis_done": ["phase", "attempt", "bytes", "case", "synthesized"],
  "recovery.diagnosis_failed": ["phase", "attempt", "error", "synthesized"],
};

/** Every opener of a pair meets exactly one closer, and in order (F111-FR-004). */
function everyPairClosed(events: readonly EngineEvent[], opener: string, closers: readonly string[]): void {
  let open = false;
  let closersSeen = 0;
  for (const event of events) {
    if (event.type === opener) {
      assert.equal(open, false, `a new ${opener} while one is open`);
      open = true;
      closersSeen = 0;
    } else if (closers.includes(event.type)) {
      if (open) {
        closersSeen += 1;
        assert.equal(closersSeen, 1, `exactly one closer for one ${opener}`);
        open = false;
      }
    }
  }
  assert.equal(open, false, `no ${opener} is left open`);
}

/* ------------------------------------------------------------------ *
 * The red-gate fixture of T043, with a planted secret in its output.
 * ------------------------------------------------------------------ */

const SECRET = "s3cr3t-HUNTER-9f2AbC";

function gateFailsOnce(): Fixture & { readonly control: string } {
  const fx = fixture({ verdicts: "APPROVED" });
  // No diagnosis on the red gate here: these tests are about the gate's and
  // the critic's own pairs (T116 owns the diagnosis pair).
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
if (n < 1) {
  console.log("token ${SECRET} in the log of the check");
  console.log("FAILED test_alpha - expected 1");
  process.exit(1);
}
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

/* ------------------------------------------------------------------ *
 * T112, T114 — the pairs of an approved gate and its critic call.
 * ------------------------------------------------------------------ */

/** A declared check that passes, so the gate executes at all. */
function checkThatPasses(dir: string): void {
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify(
      { name: "x", private: true, scripts: { test: 'node -e "process.exit(0)"' } },
      null,
      2,
    ),
  );
}

test("CT-153-45 an approved gate and its critic call open and close in order", async () => {
  const fx: Fixture = fixture({ verdicts: "APPROVED" });
  checkThatPasses(fx.dir);
  const control = controlRoot(fx.dir);
  try {
    const exit = await runFeature({ argv: [], workdir: fx.dir });
    assert.equal(exit, 0);
    const events = theNewestRun(control);
    // T112 — the gate's pair: opener first, closer with the green result.
    const gateOpens = events.filter((event) => event.type === "verification.started");
    const gateCloses = events.filter((event) => event.type === "verification.ended");
    assert.equal(gateOpens.length, 1, "one verification.started");
    assert.equal(gateCloses.length, 1, "one verification.ended");
    // Phase 17 — `planRef` names the PLAN now (its id), not the literal
    // `npm test` (F153-FR-015).
    assert.equal(gateOpens[0]?.data.phase, 1);
    assert.equal(gateOpens[0]?.data.attempt, 1);
    assert.equal(typeof gateOpens[0]?.data.planRef, "string");
    assert.ok(
      (gateOpens[0]?.data.planRef as string).length > 0,
      "the opener names the plan",
    );
    assert.deepEqual(gateCloses[0]?.data, {
      phase: 1,
      attempt: 1,
      result: "passed",
      rc: 0,
      evidenceRef: "attempt:1:1:1:verification",
      synthesized: false,
    });
    // Phase 17 (T233) — `evidenceRef` is the logical name the gate result
    // record (T231) was written under, and the record EXISTS at the path
    // that name resolves to (`<control>/features/<slug>/runs/<runId>/
    // phases/<N>/attempts/e<k>-a<n>/gate/verification.json`, layout §B.5).
    const eventsFile = eventsFilesOf(control).at(-1) as string;
    const runId = basename(dirname(eventsFile));
    const gateRecordPath = join(
      control,
      "features",
      "001-one",
      "runs",
      runId,
      "phases",
      "1",
      "attempts",
      "e1-a1",
      "gate",
      "verification.json",
    );
    assert.ok(existsSync(gateRecordPath), `the gate record exists: ${gateRecordPath}`);
    const gateRecord = JSON.parse(readFileSync(gateRecordPath, "utf8")) as {
      readonly planId: string;
      readonly passed: boolean;
    };
    assert.equal(gateRecord.passed, true, "the record holds the gate's outcome");
    assert.ok(gateRecord.planId.length > 0, "the record names the plan it ran");
    assert.ok(
      events.indexOf(gateOpens[0] as EngineEvent) < events.indexOf(gateCloses[0] as EngineEvent),
      "the closer comes after the opener",
    );
    // T114 — the critic's pair, in the same order.
    const criticOpens = events.filter((event) => event.type === "critic.started");
    const criticCalls = events.filter((event) => event.type === "critic.call");
    assert.equal(criticOpens.length, 1, "one critic.started");
    assert.equal(criticCalls.length, 1, "one critic.call");
    assert.deepEqual(criticOpens[0]?.data, { phase: 1, attempt: 1, provider: "claude" });
    const call = criticCalls[0]?.data ?? {};
    assert.equal(call.outcome, "APPROVED");
    assert.equal(typeof call.latencyMs, "number");
    assert.ok((call.latencyMs as number) >= 0, "a non-negative latency");
    assert.ok(Number.isInteger(call.latencyMs), "a whole number of milliseconds");
    assert.ok(
      events.indexOf(criticOpens[0] as EngineEvent) < events.indexOf(criticCalls[0] as EngineEvent),
      "the critic closer comes after its opener",
    );
    everyPairClosed(events, "verification.started", ["verification.ended"]);
    everyPairClosed(events, "critic.started", ["critic.call"]);
  } finally {
    delete process.env.SPECSTRIDE_DIAGNOSTICIAN;
    fx.restore();
  }
});

/* ------------------------------------------------------------------ *
 * T113 — a red gate closes with `result: "failed"`, `rc: 10`.
 * ------------------------------------------------------------------ */

test("CT-153-45 a red gate closes as failed with rc 10", async () => {
  const fx = gateFailsOnce();
  try {
    const exit = await runFeature({ argv: [], workdir: fx.dir });
    assert.equal(exit, 0, "attempt 2 passes the gate and the phase is approved");
    const events = theNewestRun(fx.control);
    const closes = events.filter((event) => event.type === "verification.ended");
    assert.equal(closes.length, 2, "one pair per attempt");
    assert.deepEqual(closes[0]?.data, {
      phase: 1,
      attempt: 1,
      result: "failed",
      rc: 10,
      evidenceRef: "attempt:1:1:1:verification",
      synthesized: false,
    });
    assert.deepEqual(closes[1]?.data, {
      phase: 1,
      attempt: 2,
      result: "passed",
      rc: 0,
      evidenceRef: "attempt:1:1:2:verification",
      synthesized: false,
    });
    everyPairClosed(events, "verification.started", ["verification.ended"]);
  } finally {
    delete process.env.SPECSTRIDE_DIAGNOSTICIAN;
    fx.restore();
  }
});

/* ------------------------------------------------------------------ *
 * T115 — a critic executable that exits non-zero.
 * ------------------------------------------------------------------ */

/** The helper's stub, with TWO changed lines: the first critic call dies,
 * and the nonce is taken from the LAST demand of the prompt (a later
 * attempt's prompt quotes the demands of the earlier ones). */
function stubWhoseCriticDiesOnce(): string {
  const source = stubClaude("APPROVED");
  const anchor = 'fs.writeFileSync("critic-calls.txt", String(n + 1));';
  assert.ok(source.includes(anchor), "the stub anchor of the critic call count");
  const nonceAnchor = 'const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];';
  assert.ok(source.includes(nonceAnchor), "the stub anchor of the nonce");
  return source
    .replace(anchor, `${anchor}\n  if (n < 1) { process.exit(1); }`)
    .replace(
      nonceAnchor,
      'const nonce = [...prompt.matchAll(/VERDICT ([0-9a-f]+): APPROVED/g)].pop()?.[1];',
    );
}

test("CT-153-45 a critic that exits non-zero still closes its pair", async () => {
  const fx = fixture({ verdicts: "APPROVED" });
  checkThatPasses(fx.dir);
  const root = join(fx.dir, "..");
  writeFileSync(join(root, "bin", "claude"), stubWhoseCriticDiesOnce());
  chmodSync(join(root, "bin", "claude"), 0o755);
  process.env.SPECSTRIDE_DIAGNOSTICIAN = "off";
  const control = controlRoot(fx.dir);
  try {
    const exit = await runFeature({ argv: [], workdir: fx.dir });
    assert.equal(exit, 0, "the run recovers and a later call is approved");
    const events = theNewestRun(control);
    const opens = events.filter((event) => event.type === "critic.started");
    const calls = events.filter((event) => event.type === "critic.call");
    assert.ok(calls.length >= 1, "the failed call is on the record");
    assert.equal(opens.length, calls.length, "one opener per call, failed or not");
    // The safe failure of F101-FR-010: a call that failed is scored MALFORMED,
    // never APPROVED — the outcome says the call failed.
    assert.notEqual(calls[0]?.data.outcome, "APPROVED");
    assert.equal(calls[0]?.data.outcome, "MALFORMED");
    assert.equal(typeof calls[0]?.data.latencyMs, "number");
    assert.ok((calls[0]?.data.latencyMs as number) >= 0);
    const approved = calls.find((event) => event.data.outcome === "APPROVED");
    assert.ok(approved !== undefined, "a later call is approved");
    everyPairClosed(events, "critic.started", ["critic.call"]);
  } finally {
    delete process.env.SPECSTRIDE_DIAGNOSTICIAN;
    fx.restore();
  }
});

/* ------------------------------------------------------------------ *
 * T116 — the diagnosis pair, once per due diagnosis.
 * ------------------------------------------------------------------ */

const TASKS_OF_TWO =
  "# Tasks\n\n## Phase 1: One\n\n- [ ] T001 Do it\n- [ ] T002 Also do it\n";

/**
 * A stub whose critic rejects with a CHANGING unmet signature (first T001,
 * then T002), so two diagnoses are due; the diagnostician answers a case and
 * a hint. Everything else it does is what the helper's stub does.
 */
function stubWithChangingUnmet(): string {
  return `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns");
const role = prompt.startsWith("# Diagnostician") ? "diagnostician" : (critic ? "critic" : "proposer");
fs.appendFileSync("prompts.jsonl", JSON.stringify({ role, prompt }) + "\\n");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (role === "diagnostician") {
  fs.appendFileSync("diag-calls.txt", "call\\n");
  fs.writeFileSync("seen-by-diagnostician.txt", prompt);
  console.log(JSON.stringify({ type: "result", result: "CASE: GROUNDING\\nWrite the missing test before the code." }));
} else if (critic) {
  const nonce = [...prompt.matchAll(/VERDICT ([0-9a-f]+): APPROVED/g)].pop()?.[1];
  const n = fs.existsSync("critic-calls.txt") ? Number(fs.readFileSync("critic-calls.txt", "utf8")) : 0;
  fs.writeFileSync("critic-calls.txt", String(n + 1));
  let report;
  if (n === 0) report = "T001: UNMET the test was not run.\\nT002: MET\\n";
  else if (n === 1) report = "T001: MET\\nT002: UNMET the assertion differed.\\n";
  else report = "T001: MET\\nT002: MET\\n";
  const verdict = n <= 1 ? "REJECTED" : "APPROVED";
  console.log(JSON.stringify({ type: "result", result: report + "VERDICT " + nonce + ": " + verdict }));
} else {
  const evidence = /write (\\.specstride\\S+?):/i.exec(prompt)[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  fs.writeFileSync("made.txt", "work\\n");
  const tasks = "specs/001-one/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replace("[ ]", "[x]"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;
}

test("CT-153-45 every due diagnosis opens and closes once", async () => {
  const fx = fixture({ verdicts: ["REJECTED", "REJECTED", "APPROVED"], files: { "specs/001-one/tasks.md": TASKS_OF_TWO } });
  checkThatPasses(fx.dir);
  const root = join(fx.dir, "..");
  writeFileSync(join(root, "bin", "claude"), stubWithChangingUnmet());
  chmodSync(join(root, "bin", "claude"), 0o755);
  const control = controlRoot(fx.dir);
  try {
    const exit = await runFeature({ argv: [], workdir: fx.dir });
    assert.equal(exit, 0, "the phase is approved after the two rejections");
    const events = theNewestRun(control);
    const opens = events.filter((event) => event.type === "recovery.diagnosis_started");
    const done = events.filter((event) => event.type === "recovery.diagnosis_done");
    const failed = events.filter((event) => event.type === "recovery.diagnosis_failed");
    assert.equal(
      done.length + failed.length,
      opens.length,
      "as many closers as openers",
    );
    assert.ok(opens.length >= 2, "both diagnoses of the changing signature are on the record");
    assert.equal(failed.length, 0, "the stub's diagnosis succeeds");
    for (const open of opens) {
      assert.deepEqual(open.data.phase, 1);
      assert.equal(typeof open.data.provider, "string");
    }
    everyPairClosed(events, "recovery.diagnosis_started", [
      "recovery.diagnosis_done",
      "recovery.diagnosis_failed",
    ]);
  } finally {
    delete process.env.SPECSTRIDE_DIAGNOSTICIAN;
    fx.restore();
  }
});

/* ------------------------------------------------------------------ *
 * T117 — only the catalogue's fields, and no excerpt of the secret.
 * ------------------------------------------------------------------ */

test("CT-153-45 the timed events hold only catalogue fields and no content", async () => {
  const fx = gateFailsOnce();
  try {
    const exit = await runFeature({ argv: [], workdir: fx.dir });
    assert.equal(exit, 0);
    const events = theNewestRun(fx.control);
    const timed = events.filter((event) => event.type in CATALOGUE_FIELDS);
    assert.ok(timed.length >= 4, "the gate and the critic pairs are all on the record");
    for (const event of timed) {
      const allowed = CATALOGUE_FIELDS[event.type] ?? [];
      for (const field of Object.keys(event.data)) {
        assert.ok(
          allowed.includes(field),
          `${event.type} carries only catalogue fields, not ${field}`,
        );
      }
    }
    // F153-SC-002 — no event carries an excerpt of length >= 8 of the secret
    // the failing check wrote to its stdout.
    const serialized = timed
      .map((event) => JSON.stringify(event))
      .join("\n");
    for (let i = 0; i + 8 <= SECRET.length; i += 1) {
      const excerpt = SECRET.slice(i, i + 8);
      assert.ok(
        !serialized.includes(excerpt),
        `no event carries the excerpt ${excerpt} of the secret`,
      );
    }
  } finally {
    delete process.env.SPECSTRIDE_DIAGNOSTICIAN;
    fx.restore();
  }
});

/* ------------------------------------------------------------------ *
 * T118 — an events file that cannot be written mid-run.
 * ------------------------------------------------------------------ */

test("CT-153-45 an unwritable events file changes no decision", async () => {
  const fx = gateFailsOnce();
  const control = fx.control;
  // The stub of the fixture, with ONE added line: the proposer makes the
  // events file of the run unwritable MID-PASS.
  const stub = join(fx.dir, "..", "bin", "claude");
  const lockLine =
    "try { const runs = path.join(process.env.SPECSTRIDE_TEST_CONTROL, 'runs');" +
    " const id = fs.readdirSync(runs).sort().pop();" +
    " fs.chmodSync(path.join(runs, id, 'events.jsonl'), 0o444); } catch {}";
  const source = readFileSync(stub, "utf8").replace(
    'fs.appendFileSync("prompts.jsonl", JSON.stringify({ role, prompt }) + "\\n");',
    `fs.appendFileSync("prompts.jsonl", JSON.stringify({ role, prompt }) + "\\n");\n${lockLine}`,
  );
  assert.notEqual(source, readFileSync(stub, "utf8"), "the stub carries the lock write");
  writeFileSync(stub, source);
  chmodSync(stub, 0o755);
  const before = process.env.SPECSTRIDE_TEST_CONTROL;
  process.env.SPECSTRIDE_TEST_CONTROL = control;
  try {
    const exit = await runFeature({ argv: [], workdir: fx.dir });
    // The SAME outcome and exit code as the writable twin of T113: attempt 2
    // passes the gate and the phase is approved.
    assert.equal(exit, 0);
    const events = theNewestRun(control);
    const ends = events.filter((event) => event.type === "attempt.ended");
    assert.equal(ends.length, 2, "both attempts closed, the events file notwithstanding");
    assert.equal(ends[1]?.data.endCause, "approved");
  } finally {
    if (before === undefined) delete process.env.SPECSTRIDE_TEST_CONTROL;
    else process.env.SPECSTRIDE_TEST_CONTROL = before;
    for (const file of eventsFilesOf(control)) chmodSync(file, 0o644);
    fx.restore();
  }
});
