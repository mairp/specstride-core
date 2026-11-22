/**
 * Phase 22 of feature 153, US5 — the pass handoff (F103-FR-041 through the
 * engine): at the START of every pass the engine writes the handoff with the
 * ONE writer of feature 103 (`writeHandoffForAPass`), before the prompt of
 * the pass is read. The switch is `carry.ledger_handoff`, on by default and
 * always off under `profile: parity` (F153-FR-059 — every pass is fresh).
 *
 * The cases (tasks T300 to T306):
 *  - T300 CT-153-58 — a handoff stands before the prompt of EVERY pass; the
 *    file is REGENERATED, never appended, so its size does not grow with the
 *    pass count;
 *  - T301 — a 300-task phase still fits the 6,144-byte default and says it
 *    was cut;
 *  - T302 — the content list: phase, phase attempt, the counters, the
 *    remaining units as canonical-model task ids, the feedback pointers by
 *    logical name, the tree fingerprint and the tree-wins line;
 *  - T303 — after a red gate (a planted secret blocks the approval commit,
 *    feature 152's rule), the next attempt's first handoff names that
 *    feedback among its pointers and holds NO failing line (CQ-153-14 A);
 *  - T304 — a checkpoint claim of the micro layer that names a task id the
 *    phase does not have reaches no handoff;
 *  - T305 F153-SC-014 — no critic prompt holds a handoff line, and the
 *    critic's request is identical whether the handoff file stands or is
 *    deleted;
 *  - T306 — under `profile: parity` with `carry.ledger_handoff` off, no
 *    handoff is written anywhere, and `EVERY_PASS_IS_FRESH_UNDER_PARITY`
 *    still holds.
 *
 * No paid or external model API is called (F153-FR-060): the stub `claude`
 * this file writes over the fixture's `bin/claude` answers every role.
 */
import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { runFeature } from "../../src/engine/run-feature.ts";
import { loopConfigurationOf } from "../../src/engine/loop-config.ts";
import { fixture } from "./loop-speed-helpers.ts";
import { HEADING, THE_TREE_WINS, TRUNCATION_MARKER } from "../../../core/src/carry/handoff.ts";
import { EVERY_PASS_IS_FRESH_UNDER_PARITY } from "../../../core/src/pass-loop/loop.ts";

/** The planted secret: `ghp_` + 36 characters, a `github-prefix` hit. */
const SECRET = `ghp_${"a".repeat(36)}`;

/**
 * The stub `claude` of the handoff tests. The proposer counts its passes in
 * `pass-count.txt` and copies the handoff the engine wrote for THIS pass (it
 * stands before the prompt arrives, so the copy is the proof) to
 * `$HOME/handoff-at-pass-<n>.md`. Where `STUB_HANDOFF_PASSES` is 2, the first
 * pass writes no phase evidence, so the loop runs a second pass. Where
 * `STUB_BOGUS_CHECKPOINT` is 1, the first pass also writes a checkpoint of
 * the micro layer whose `tasks` array names a task id the phase has not.
 * Where `STUB_SECRET_ATTEMPT1` is 1, the first phase attempt plants the
 * secret in a new file (the commit gate blocks its approval commit, and the
 * engine opens attempt 2, where the secret is gone). The critic approves.
 */
function stubHandoffClaude(): string {
  return `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns");
const role = prompt.includes("Diagnostician") ? "diagnostician" : (critic ? "critic" : "proposer");
fs.appendFileSync("prompts.jsonl", JSON.stringify({ role, prompt }) + "\\n");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (role === "diagnostician") {
  console.log(JSON.stringify({ type: "result", result: "CASE: GROUNDING\\nName the missing test of T001." }));
} else if (critic) {
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  const counter = path.join(process.env.HOME, "critic-calls.txt");
  const n = fs.existsSync(counter) ? Number(fs.readFileSync(counter, "utf8")) : 0;
  fs.writeFileSync(counter, String(n + 1));
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  const home = process.env.HOME;
  const passes = (fs.existsSync("pass-count.txt") ? Number(fs.readFileSync("pass-count.txt", "utf8")) : 0) + 1;
  fs.writeFileSync("pass-count.txt", String(passes));
  const find = (dir) => {
    let es; try { es = fs.readdirSync(dir, { withFileTypes: true }); } catch { return undefined; }
    for (const e of es) {
      const p = path.join(dir, e.name);
      if (e.isFile() && e.name === "handoff.md" && dir.includes(path.join(".specstride", "workspaces"))) return p;
      if (e.isDirectory()) { const r = find(p); if (r) return r; }
    }
    return undefined;
  };
  const handoff = find(path.join(home, ".specstride"));
  if (handoff) {
    fs.copyFileSync(handoff, path.join(home, "handoff-at-pass-" + passes + ".md"));
    if (process.env.STUB_DELETE_HANDOFF === "1") fs.rmSync(handoff, { force: true });
  }
  if (process.env.STUB_BOGUS_CHECKPOINT === "1" && passes === 1) {
    const m = / to (\\S*checkpoint\\S*) with the schema/.exec(prompt);
    if (m) {
      fs.mkdirSync(path.dirname(m[1]), { recursive: true });
      fs.writeFileSync(m[1], JSON.stringify({ schema: "specstride.checkpoint/1", unit: "u1", tasks: ["T999"] }));
    }
  }
  fs.writeFileSync("made.txt", "work of pass " + passes + "\\n");
  const counter = path.join(home, "critic-calls.txt");
  const firstAttempt = !(fs.existsSync(counter) && Number(fs.readFileSync(counter, "utf8")) >= 1);
  if (process.env.STUB_SECRET_ATTEMPT1 === "1" && firstAttempt) {
    fs.writeFileSync("planted.txt", process.env.STUB_SECRET + "\\n");
  } else {
    fs.rmSync("planted.txt", { force: true });
  }
  const skipEvidence = process.env.STUB_HANDOFF_PASSES === "2" && passes === 1;
  if (!skipEvidence) {
    const evidence = (/Write your evidence to (\\.specstride\\S+?) \\(/i.exec(prompt) ?? /write (\\.specstride\\S+?):/i.exec(prompt))[1];
    fs.mkdirSync(path.dirname(evidence), { recursive: true });
    fs.writeFileSync(evidence, "T001 done\\n");
    const tasks = "specs/001-one/tasks.md";
    fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replace("[ ]", "[x]"));
  }
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;
}

type Prompt = { readonly role: string; readonly prompt: string };
type CopiedHandoff = { readonly pass: number; readonly path: string; readonly text: string; readonly bytes: number };

/**
 * Run the loop-speed fixture with the handoff stub over its `claude`, capture
 * stderr, and return the copied handoffs (one per proposer pass), the prompts
 * and the run's exit code.
 */
async function run(options: {
  readonly passes?: 1 | 2;
  readonly bogusCheckpoint?: boolean;
  readonly secretAttempt1?: boolean;
  readonly files?: Readonly<Record<string, string>>;
  readonly parity?: boolean;
} = {}): Promise<{
  readonly dir: string;
  readonly home: string;
  readonly exit: number;
  readonly stderr: string;
  readonly handoffs: readonly CopiedHandoff[];
  readonly prompts: readonly Prompt[];
  readonly restore: () => void;
}> {
  const { dir, restore } = fixture({ verdicts: "APPROVED", files: options.files });
  const home = join(dir, "..");
  process.env.SPECSTRIDE_DIAGNOSTICIAN = "off";
  process.env.SPECSTRIDE_LIMITS = "on";
  delete process.env.STUB_HANDOFF_PASSES;
  delete process.env.STUB_BOGUS_CHECKPOINT;
  delete process.env.STUB_SECRET_ATTEMPT1;
  if (options.passes === 2) process.env.STUB_HANDOFF_PASSES = "2";
  if (options.bogusCheckpoint) process.env.STUB_BOGUS_CHECKPOINT = "1";
  if (options.secretAttempt1) {
    process.env.STUB_SECRET_ATTEMPT1 = "1";
    process.env.STUB_SECRET = SECRET;
  }
  if (options.parity === true) {
    const userConfig = join(home, ".config", "specstride");
    mkdirSync(userConfig, { recursive: true });
    writeFileSync(join(userConfig, "config.yaml"), "schema: 1\nprofile: parity\n");
  }
  writeFileSync(join(home, "bin", "claude"), stubHandoffClaude());
  chmodSync(join(home, "bin", "claude"), 0o755);
  rmSync(join(dir, "pass-count.txt"), { force: true });
  const stderr: string[] = [];
  const original = process.stderr.write.bind(process.stderr);
  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderr.push(String(chunk));
    return true;
  }) as typeof process.stderr.write;
  let exit: number;
  try {
    exit = await runFeature({ argv: [], workdir: dir });
  } finally {
    process.stderr.write = original;
    delete process.env.STUB_HANDOFF_PASSES;
    delete process.env.STUB_BOGUS_CHECKPOINT;
    delete process.env.STUB_SECRET_ATTEMPT1;
    delete process.env.STUB_SECRET;
    delete process.env.SPECSTRIDE_DIAGNOSTICIAN;
  }
  const handoffs: CopiedHandoff[] = readdirSync(home)
    .filter((name) => /^handoff-at-pass-\d+\.md$/.test(name))
    .sort((left, right) => Number(left.match(/\d+/)?.[0]) - Number(right.match(/\d+/)?.[0]))
    .map((name) => {
      const path = join(home, name);
      return {
        pass: Number(name.match(/\d+/)?.[0]),
        path,
        text: readFileSync(path, "utf8"),
        bytes: statSync(path).size,
      };
    });
  const prompts: Prompt[] = readFileSync(join(dir, "prompts.jsonl"), "utf8")
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => JSON.parse(line) as Prompt);
  return { dir, home, exit, stderr: stderr.join(""), handoffs, prompts, restore };
}

/** The control root of a fixture workspace (the layout of the engine). */
function controlRootOf(dir: string, home: string): string {
  return join(home, ".specstride", "workspaces", createHash("sha256").update(dir).digest("hex").slice(0, 16));
}

/* ------------------------------------------------------------------ *
 * T300 — CT-153-58: written at every pass start, regenerated, size stable.
 * ------------------------------------------------------------------ */

test("CT-153-58 the handoff stands before the prompt of every pass and is regenerated, never appended", async () => {
  const run1 = await run({ passes: 2 });
  try {
    assert.equal(run1.exit, 0, `the run ended 0 (stderr: ${run1.stderr.slice(-400)})`);
    const proposers = run1.prompts.filter((p) => p.role === "proposer").length;
    assert.ok(proposers >= 2, `two passes ran (${String(proposers)} proposer prompts)`);
    assert.equal(run1.handoffs.length, proposers, "one copied handoff per proposer pass");
    for (const handoff of run1.handoffs) {
      assert.ok(handoff.bytes > 0, `pass ${String(handoff.pass)}: the handoff stood before the prompt`);
      assert.ok(handoff.text.startsWith(`${HEADING}\n`), `pass ${String(handoff.pass)}: it starts with the heading`);
      // REGENERATED, never appended: exactly one heading, whatever the pass.
      assert.equal(
        (handoff.text.match(/^# Handoff$/gm) ?? []).length,
        1,
        `pass ${String(handoff.pass)}: one heading only`,
      );
      assert.ok(handoff.bytes <= 6144, `pass ${String(handoff.pass)}: within the default cap`);
    }
    const [first, second] = run1.handoffs;
    assert.notEqual(first.text, second.text, "the tree fingerprint changed between the passes");
    assert.ok(
      Math.abs(second.bytes - first.bytes) < 200,
      `the size does not grow with the pass count (${String(first.bytes)} -> ${String(second.bytes)})`,
    );
  } finally {
    run1.restore();
  }
});

/* ------------------------------------------------------------------ *
 * T301 — a 300-task phase fits the 6,144-byte default and says it was cut.
 * ------------------------------------------------------------------ */

test("T301 a 300-task phase is cut to at most 6 KiB and says it was cut", async () => {
  const tasks = ["# Tasks", "", "## Phase 1: Many", ""];
  for (let n = 1; n <= 300; n += 1) {
    tasks.push(
      `- [ ] T${String(n).padStart(3, "0")} Do the work of task ${String(n)} with a long title that fills the handoff quickly`,
    );
  }
  const run1 = await run({ files: { "specs/001-one/tasks.md": `${tasks.join("\n")}\n` } });
  try {
    assert.equal(run1.exit, 0, `the run ended 0 (stderr: ${run1.stderr.slice(-400)})`);
    assert.ok(run1.handoffs.length >= 1, "a handoff was written");
    const handoff = run1.handoffs[0];
    assert.ok(handoff.bytes <= 6144, `${String(handoff.bytes)} bytes, within the 6,144 default`);
    assert.ok(handoff.text.includes(TRUNCATION_MARKER), "it says it was cut");
    assert.ok(handoff.text.includes(THE_TREE_WINS), "the tree-wins line survives the cut");
  } finally {
    run1.restore();
  }
});

/* ------------------------------------------------------------------ *
 * T302 — the content list.
 * ------------------------------------------------------------------ */

test("T302 the handoff holds the phase, the attempt, the counters, the units, the fingerprint and the tree-wins line", async () => {
  const run1 = await run({ passes: 2 });
  try {
    assert.equal(run1.exit, 0, `the run ended 0 (stderr: ${run1.stderr.slice(-400)})`);
    const handoff = run1.handoffs[0];
    assert.match(handoff.text, /^phase: 1$/m, "the phase");
    assert.match(handoff.text, /^phase attempt: 1$/m, "the phase attempt number");
    assert.match(handoff.text, /^tree fingerprint: [0-9a-f]{40,64}$/m, "the tree fingerprint");
    assert.ok(handoff.text.includes(THE_TREE_WINS), "the tree-wins line");
    assert.match(handoff.text, /## Counters\n- passIndex: \d+/m, "the counters");
    assert.match(handoff.text, /## Ledger, last lines\n- \(none\)/, "no ledger tail (CQ-153-19 B: records is empty)");
    assert.match(handoff.text, /## Remaining units of work/, "the remaining units heading");
    assert.match(handoff.text, /^- T001 — /m, "a remaining unit as a canonical-model task id");
    assert.match(handoff.text, /## Feedback files\n- \(none\)/, "no feedback yet, said as none");
  } finally {
    run1.restore();
  }
});

/* ------------------------------------------------------------------ *
 * T303 — after a red gate the next attempt's first handoff names the
 * feedback among its pointers and holds no failing line (CQ-153-14 A).
 * ------------------------------------------------------------------ */

test("T303 after the commit gate blocks attempt 1, attempt 2's first handoff names the feedback and holds no failing line", async () => {
  const run1 = await run({ secretAttempt1: true });
  try {
    assert.equal(run1.exit, 0, `the run ended 0 (stderr: ${run1.stderr.slice(-400)})`);
    const root = controlRootOf(run1.dir, run1.home);
    const featureRoot = join(root, "features", "001-one");
    // Attempt 1 was blocked and its corrective feedback written; attempt 2
    // was approved (the stub removes the secret there).
    const feedbackPath = existsSync(join(featureRoot, "feedback", "phase1.1.md"))
      ? join(featureRoot, "feedback", "phase1.1.md")
      : join(featureRoot, "set-aside", "phase1", "phase1.1.md");
    assert.ok(existsSync(feedbackPath), "attempt 1's corrective feedback stands");
    assert.match(readFileSync(feedbackPath, "utf8"), /commit gate blocked/, "the feedback is the red gate's");
    // Attempt 2's FIRST pass copied the handoff written at its start — after
    // attempt 1's feedback existed.
    const laterHandoff = run1.handoffs.find((handoff) => handoff.text.includes("attempt attempt 2") || handoff.text.includes("phase attempt: 2"));
    assert.ok(laterHandoff !== undefined, `a handoff of attempt 2 was copied (${String(run1.handoffs.length)} copied)`);
    assert.match(
      laterHandoff.text,
      /## Feedback files\n- attempt:1:1:1:feedback/m,
      "the feedback is named by its logical name, oldest first",
    );
    // CQ-153-14 A — the pointer, never the text: no failing line survives.
    assert.ok(!laterHandoff.text.includes("ghp_"), "no byte of the secret");
    assert.ok(!laterHandoff.text.includes("commit gate blocked"), "no line of the feedback text");
    assert.ok(!laterHandoff.text.includes("planted.txt"), "no path the feedback named");
  } finally {
    run1.restore();
  }
});

/* ------------------------------------------------------------------ *
 * T304 — a checkpoint claim that names a task id the phase does not have
 * reaches no handoff.
 * ------------------------------------------------------------------ */

test("T304 a checkpoint claim naming a nonexistent task id reaches no handoff", async () => {
  const run1 = await run({ passes: 2, bogusCheckpoint: true });
  try {
    assert.equal(run1.exit, 0, `the run ended 0 (stderr: ${run1.stderr.slice(-400)})`);
    assert.ok(run1.handoffs.length >= 2, "both passes wrote a handoff");
    for (const handoff of run1.handoffs) {
      assert.ok(!handoff.text.includes("T999"), `pass ${String(handoff.pass)}: no T999 in the handoff`);
    }
  } finally {
    run1.restore();
  }
});

/* ------------------------------------------------------------------ *
 * T305 — F153-SC-014: no critic prompt holds a handoff line, and the
 * critic's request is identical with the handoff file present or deleted.
 * ------------------------------------------------------------------ */

test("T305 no critic prompt holds a handoff line; the critic request is identical with the handoff present or deleted", async () => {
  const withHandoff = await run({ passes: 2 });
  try {
    assert.equal(withHandoff.exit, 0, "the run ended 0");
    const critics = withHandoff.prompts.filter((p) => p.role === "critic").map((p) => p.prompt);
    assert.ok(critics.length >= 1, "the critic was called");
    for (const prompt of critics) {
      assert.ok(!prompt.includes(HEADING), "no handoff heading in a critic prompt");
      assert.ok(!prompt.includes("tree fingerprint"), "no fingerprint line in a critic prompt");
      assert.ok(!prompt.includes(THE_TREE_WINS), "no tree-wins line in a critic prompt");
    }
    // The same fixture, but the handoff file DELETED at the first pass's
    // start (the stub removes the engine's handoff.md right after proving it
    // stood): the critic's request must come out identical, because no
    // critic prompt ever named the handoff.
    process.env.STUB_DELETE_HANDOFF = "1";
    const withoutHandoff = await run({ passes: 2 });
    delete process.env.STUB_DELETE_HANDOFF;
    try {
      assert.equal(withoutHandoff.exit, 0, "the second run ended 0");
      assert.ok(withoutHandoff.handoffs.length >= 1, "the first handoff stood before it was deleted");
      const critics2 = withoutHandoff.prompts.filter((p) => p.role === "critic").map((p) => p.prompt);
      for (const prompt of critics2) {
        assert.ok(!prompt.includes(HEADING), "no handoff heading in a critic prompt of the deleted run");
      }
      assert.deepEqual(
        critics2.map((prompt) => prompt.replace(/[0-9a-f]{16,}/g, "")),
        critics.map((prompt) => prompt.replace(/[0-9a-f]{16,}/g, "")),
        "the critic request is identical, handoff or no handoff",
      );
    } finally {
      withoutHandoff.restore();
    }
  } finally {
    withHandoff.restore();
  }
});

/* ------------------------------------------------------------------ *
 * T306 — under parity no handoff is written, and freshness still holds.
 * ------------------------------------------------------------------ */

test("CT-153-59 T306 under profile parity with carry.ledger_handoff off, no handoff is written and every pass stays fresh", async () => {
  assert.equal(EVERY_PASS_IS_FRESH_UNDER_PARITY, true, "the parity constant still holds");
  // The configuration reading first, through the real merge.
  const root = mkdtempSync(join(tmpdir(), "specstride-handoff-parity-"));
  const home = join(root, "home");
  const dir = join(root, "work");
  mkdirSync(home, { recursive: true });
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(home, ".config", "specstride"), { recursive: true });
  writeFileSync(join(home, ".config", "specstride", "config.yaml"), "schema: 1\nprofile: parity\n");
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: { PATH: process.env.PATH ?? "" } });
    assert.equal(loop.ledgerHandoff, false, "row 8 of annex E §E.2: off under parity");
    assert.equal(loop.handoffMaxBytes, 6144, "the byte cap defaults to the writer's");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  // End to end: a parity run writes no handoff anywhere under the control
  // root, though the passes ran.
  const run1 = await run({ parity: true, passes: 2 });
  try {
    assert.equal(run1.exit, 0, `the run ended 0 (stderr: ${run1.stderr.slice(-400)})`);
    assert.ok(run1.prompts.filter((p) => p.role === "proposer").length >= 2, "the passes ran");
    assert.equal(run1.handoffs.length, 0, "no handoff stood before any pass");
    const root = controlRootOf(run1.dir, run1.home);
    assert.ok(!existsSync(join(root, "features", "001-one", "handoff.md")), "no handoff.md under the feature");
  } finally {
    run1.restore();
  }
});

/* ------------------------------------------------------------------ *
 * T308 — the two configuration fields, as loopConfigurationOf reads them.
 * ------------------------------------------------------------------ */

test("T308 carry.ledger_handoff and carry.handoffMaxBytes are read through the real configuration", async () => {
  const make = (config: string | undefined) => {
    const root = mkdtempSync(join(tmpdir(), "specstride-handoff-config-"));
    const home = join(root, "home");
    const dir = join(root, "work");
    mkdirSync(home, { recursive: true });
    mkdirSync(dir, { recursive: true });
    if (config !== undefined) {
      mkdirSync(join(home, ".config", "specstride"), { recursive: true });
      writeFileSync(join(home, ".config", "specstride", "config.yaml"), config);
    }
    return {
      read: () => loopConfigurationOf({ home, workdir: dir, environment: { PATH: process.env.PATH ?? "" } }),
      done: () => rmSync(root, { recursive: true, force: true }),
    };
  };
  const defaults = make(undefined);
  try {
    const loop = defaults.read();
    assert.equal(loop.ledgerHandoff, true, "on by default");
    assert.equal(loop.handoffMaxBytes, 6144, "the cap defaults to MAX_BYTES_DEFAULT");
  } finally {
    defaults.done();
  }
  const off = make("schema: 1\ncarry:\n  ledger_handoff: false\n");
  try {
    assert.equal(off.read().ledgerHandoff, false, "the off value switches it off");
  } finally {
    off.done();
  }
  const capped = make("schema: 1\ncarry:\n  handoffMaxBytes: 2048\n");
  try {
    assert.equal(capped.read().handoffMaxBytes, 2048, "a configured cap is read");
  } finally {
    capped.done();
  }
});
