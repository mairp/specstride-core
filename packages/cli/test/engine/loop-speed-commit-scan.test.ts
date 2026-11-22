/**
 * The commit-time scan of feature 153, user story 1d (T353, T356, T357,
 * T358):
 *
 * - CT-153-25 (T353) — the commit-time scan is unchanged: with
 *   `commit.gate.beforeCritic` off the block happens at the approval commit
 *   only, the approval is voided as F152-FR-001 says, and every case of the
 *   feature-152 suites still passes;
 * - F153-SC-003 (T357) — with both switches on the critic is not spent on a
 *   blocked candidate: 0 critic calls for the blocked attempt, the corrective
 *   block of F152 in the next proposer prompt, and the attempt ends
 *   `rejected` with its own `commit_gate.blocked` (step `pre-critic`);
 * - CT-153-5 (T358) — either switch off is today: the scan runs at the
 *   approval commit only, so the critic IS called for attempt 1 and no
 *   `commit_gate.blocked` event carries the step `pre-critic`.
 *
 * The workspace follows `fixture` of `loop-speed-helpers.ts`; the stub
 * `claude` follows its `stubClaude`, with the traces it writes held OUTSIDE
 * the work tree (as the fixtures of `fixtures/commit-gate/` do), so no trace
 * of a prompt quoting the planted credential re-blocks the retry.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { runFeature } from "../../src/engine/run-feature.ts";
import { fixture } from "./loop-speed-helpers.ts";

/** The planted credential: `ghp_` + 36 characters, a `github-prefix` hit. */
const SECRET = `ghp_${"a1b2c3d4e5f6".repeat(3)}`;
/** The corrective block's E3 heading (F152-FR-012), whatever step blocked. */
const E3_HEADING =
  "# Phase 1 — attempt 1 was not approved: the commit gate blocked the approval commit";

type Run = {
  readonly dir: string;
  readonly traces: string;
  readonly restore: () => void;
};

/**
 * The stub `claude` of the scenario: the critic approves with the nonce echo,
 * the proposer writes the phase evidence, ticks the task list and plants the
 * credential ON ATTEMPT 1 ONLY — into `creds.txt` (`plantCreds`) or into the
 * ticked task list itself (`plantTasks`). The prompts it sees are appended to
 * `prompts.jsonl` in the traces directory, outside the work tree.
 */
function stubClaude(plant: "creds" | "tasks"): string {
  const plantCode =
    plant === "creds"
      ? `if (!fs.existsSync("planted.txt")) {
  fs.writeFileSync("planted.txt", "1");
  fs.writeFileSync("creds.txt", "token = " + (process.env.STUB_SECRET ?? "") + "\\n");
} else {
  fs.rmSync("creds.txt", { force: true });
}`
      : `const tasks = "specs/001-one/tasks.md";
let kept = fs.readFileSync(tasks, "utf8").split("\\n").filter((line) => !line.includes(process.env.STUB_SECRET ?? ""));
if (!fs.existsSync("planted.txt")) {
  fs.writeFileSync("planted.txt", "1");
  kept.push("marker: " + (process.env.STUB_SECRET ?? ""));
}
fs.writeFileSync(tasks, kept.join("\\n").replace("[ ]", "[x]"));`;
  return `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC");
const role = prompt.includes("Diagnostician") ? "diagnostician" : (critic ? "critic" : "proposer");
const out = process.env.STUB_TRACE_DIR;
fs.mkdirSync(out, { recursive: true });
fs.appendFileSync(path.join(out, "prompts.jsonl"), JSON.stringify({ role, prompt }) + "\\n");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (role === "diagnostician") {
  console.log(JSON.stringify({ type: "result", result: "CASE: GROUNDING\\nName the missing test of T001." }));
} else if (critic) {
  const call = (fs.existsSync(path.join(out, "critic-calls"))
    ? Number(fs.readFileSync(path.join(out, "critic-calls"), "utf8"))
    : 0) + 1;
  fs.writeFileSync(path.join(out, "critic-calls"), String(call));
  fs.writeFileSync(path.join(out, "seen-by-critic-" + call + ".txt"), prompt);
  const all = [...prompt.matchAll(/VERDICT ([0-9a-f]+)/g)];
  const nonce = all.length > 0 ? all[all.length - 1][1] : "0".repeat(16);
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  const attempt = Number(/This is attempt (\\d+)/.exec(prompt)?.[1] ?? "1");
  fs.writeFileSync(path.join(out, "seen-by-proposer-" + attempt + ".txt"), prompt);
  const evidence = (/Write your evidence to (\\.specstride\\S+?) \\(/i.exec(prompt) ??
    /write (\\.specstride\\S+?):/i.exec(prompt))[1];
  fs.mkdirSync(path.join(process.cwd(), path.dirname(evidence)), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  fs.writeFileSync("made.txt", "work\\n");
  fs.mkdirSync("newdir", { recursive: true });
  fs.writeFileSync("newdir/inside.txt", "nested\\n");
  ${plantCode}
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;
}

/**
 * The fixture workspace of the scenario: the layout `fixture` of
 * `loop-speed-helpers.ts` builds, with this file's stub `claude` on `PATH`
 * (it replaces the helper's stub, whose traces sit inside the work tree).
 */
function scenarioFixture(plant: "creds" | "tasks"): Run {
  const fx = fixture({ verdicts: "APPROVED" });
  const bin = join(fx.dir, "..", "bin");
  const traces = join(fx.dir, "..", "traces");
  mkdirSync(traces, { recursive: true });
  writeFileSync(join(bin, "claude"), stubClaude(plant));
  chmodSync(join(bin, "claude"), 0o755);
  process.env.STUB_TRACE_DIR = traces;
  return {
    dir: fx.dir,
    traces,
    restore: () => {
      delete process.env.STUB_TRACE_DIR;
      fx.restore();
    },
  };
}

/** The role-ordered prompts the stub of a run saw. */
const promptsOf = (run: Run): readonly { role: string; prompt: string }[] =>
  readFileSync(join(run.traces, "prompts.jsonl"), "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as { role: string; prompt: string });

type Event = { type: string; data: Record<string, unknown> };

const workspaceRootOf = (dir: string): string =>
  // The control root: `~/.specstride/workspaces/<sha256(workdir)[:16]>`, with
  // HOME pinned to the fixture root by `fixture`.
  join(
    homedir(),
    ".specstride",
    "workspaces",
    createHash("sha256").update(dir).digest("hex").slice(0, 16),
  );

/** The raw event stream of the (single) run of a fixture workspace. Under
 * `parity` the run follows the layout table
 * (`features/<slug>/runs/<runId>/events.jsonl`), otherwise the engine's own
 * shorter `runs/<runId>/events.jsonl`. */
const eventsTextOf = (dir: string): string => {
  const root = workspaceRootOf(dir);
  // The control roots the run writes: the workspace hash of the engine, and —
  // under `parity` — the as-is state directory of the layout table.
  const candidates = [
    join(root, "runs"),
    join(root, "features", "001-one", "runs"),
    join(root, "..", "..", "..", ".local", "state", "specstride", "workspaces", "001-one", "runs"),
    join(
      root,
      "..",
      "..",
      "..",
      ".local",
      "state",
      "specstride",
      "workspaces",
      "001-one",
      "features",
      "001-one",
      "runs",
    ),
  ];
  for (const runsDir of candidates) {
    if (!existsSync(runsDir)) continue;
    return readFileSync(join(runsDir, readdirSync(runsDir)[0], "events.jsonl"), "utf8");
  }
  throw new Error(`no run found under ${root}`);
};

const events = (dir: string): readonly Event[] =>
  eventsTextOf(dir)
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as Event);

test("CT-153-25 the commit-time scan is unchanged (T353)", async () => {
  // The scan runs at the approval commit ONLY: the pre-critic switch is off.
  process.env.SPECSTRIDE_COMMIT_GATE_BEFORE_CRITIC = "off";
  const fx = scenarioFixture("tasks");
  process.env.STUB_SECRET = SECRET;
  const chunks: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: unknown): boolean => {
    if (typeof chunk === "string") chunks.push(chunk);
    return originalWrite(chunk as string);
  }) as typeof process.stdout.write;
  try {
    // Attempt 1 is blocked at the APPROVAL commit (after the critic), and the
    // retry commits: F152-SC-002.
    assert.equal(await runFeature({ argv: [], workdir: fx.dir }), 0);
    const out = chunks.join("");
    assert.match(out, /commits_blocked=1/, "the digest counts the block");
    // The approval is voided (F152-FR-001): no approval record carries the
    // blocked attempt's verdict, and the block record stands.
    const workspaceRoot = workspaceRootOf(fx.dir);
    const blockRecord = JSON.parse(
      readFileSync(join(workspaceRoot, "commit-gate", "phase1.1.block.json"), "utf8"),
    ) as { verdictId: string };
    const approvalPath = join(workspaceRoot, "features", "001-one", "approvals", "phase-1.json");
    assert.equal(existsSync(approvalPath), true, "attempt 2 was approved");
    const approval = JSON.parse(readFileSync(approvalPath, "utf8")) as { verdictId: string };
    assert.notEqual(
      approval.verdictId,
      blockRecord.verdictId,
      "the only approval record of the phase is attempt 2's, never the blocked attempt's",
    );
    // The scan covers the TICKED task list: the block of attempt 1 was the
    // credential the stub planted into the ticked tasks.md.
    const stream = eventsTextOf(fx.dir);
    assert.ok(stream.includes('"commit_gate.blocked"'), "the block event is on the stream");
    assert.ok(!stream.includes('"pre-critic"'), "no pre-critic block: the switch is off");
    assert.ok(stream.includes('"step":"commit"'), "the block names the commit step");
  } finally {
    process.stdout.write = originalWrite;
    delete process.env.STUB_SECRET;
    delete process.env.SPECSTRIDE_COMMIT_GATE_BEFORE_CRITIC;
    fx.restore();
  }

  // The guard of the guard: every existing case of the two feature-152 suites
  // still passes after T352. The suites run in their own processes, with the
  // switches of this file removed from their environment so each case reads
  // the default it was written for.
  const root = join(import.meta.dirname, "..", "..", "..", "..");
  const cliDir = join(root, "packages", "cli");
  const isolate = join(root, "tests", "isolate.ts");
  const cleanEnv: NodeJS.ProcessEnv = { ...process.env };
  delete cleanEnv.SPECSTRIDE_COMMIT_GATE_BEFORE_CRITIC;
  delete cleanEnv.SPECSTRIDE_COMMIT_BACKPRESSURE;
  delete cleanEnv.SPECSTRIDE_PROFILE;
  for (const file of [
    "test/engine/commit-gate-retry.test.ts",
    "test/engine/commit-gate-halt.test.ts",
  ]) {
    const run = spawnSync(process.execPath, [isolate, process.execPath, "--test", file], {
      cwd: cliDir,
      env: cleanEnv,
      encoding: "utf8",
      maxBuffer: 1 << 30,
    });
    assert.equal(
      run.status,
      0,
      `${file} still passes:\n${run.stdout.split("\n").filter((l) => /^not ok/.test(l)).join("\n")}`,
    );
  }
});

test("F153-SC-003 the critic is not spent on a blocked candidate (T357)", async () => {
  // Both switches on — the default — with the credential in a test fixture.
  delete process.env.SPECSTRIDE_COMMIT_GATE_BEFORE_CRITIC;
  delete process.env.SPECSTRIDE_COMMIT_BACKPRESSURE;
  const fx = scenarioFixture("creds");
  process.env.STUB_SECRET = SECRET;
  try {
    assert.equal(await runFeature({ argv: [], workdir: fx.dir }), 0);
    const prompts = promptsOf(fx);
    const proposerIndexes = prompts
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => entry.role === "proposer")
      .map(({ index }) => index);
    const criticIndexes = prompts
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => entry.role === "critic")
      .map(({ index }) => index);
    assert.ok(proposerIndexes.length >= 2, "attempt 2 ran");
    assert.ok(criticIndexes.length >= 1, "the retry was judged");
    // Attempt 1 made ZERO critic calls: the first critic call stands after
    // the second proposer call, not between the two attempts.
    assert.ok(
      criticIndexes[0]! > proposerIndexes[1]!,
      "no critic call for the blocked attempt 1",
    );
    // Attempt 2's proposer prompt carries the corrective block of F152.
    assert.ok(
      prompts[proposerIndexes[1]!]!.prompt.includes(E3_HEADING),
      "the corrective block heads attempt 2's prompt",
    );
    // The attempt's own closing and the block share the attempt: the
    // `commit_gate.blocked` event carries the step `pre-critic`, and the
    // `attempt.ended` of the SAME (phase, attempt) is `rejected` (EC-4).
    const stream = events(fx.dir);
    const blocked = stream.filter((event) => event.type === "commit_gate.blocked");
    assert.equal(blocked.length, 1, "one commit gate block");
    assert.equal(blocked[0]!.data.step, "pre-critic", "the block happened before the critic");
    const ended = stream.filter((event) => event.type === "attempt.ended");
    const sameAttempt = ended.find(
      (event) =>
        event.data.phase === blocked[0]!.data.phase &&
        event.data.attempt === blocked[0]!.data.attempt,
    );
    assert.ok(sameAttempt !== undefined, "the blocked attempt is closed");
    assert.equal(sameAttempt!.data.endCause, "rejected");
  } finally {
    delete process.env.STUB_SECRET;
    fx.restore();
  }
});

test("CT-153-5 either switch off is today (T358)", async () => {
  const cases: readonly { readonly name: string; readonly set: () => void }[] = [
    {
      name: "commit.gate.beforeCritic off",
      set: () => {
        process.env.SPECSTRIDE_COMMIT_GATE_BEFORE_CRITIC = "off";
      },
    },
    {
      name: "commit.backpressure off",
      set: () => {
        delete process.env.SPECSTRIDE_COMMIT_GATE_BEFORE_CRITIC;
        process.env.SPECSTRIDE_COMMIT_BACKPRESSURE = "off";
      },
    },
    {
      name: "profile parity",
      set: () => {
        delete process.env.SPECSTRIDE_COMMIT_GATE_BEFORE_CRITIC;
        delete process.env.SPECSTRIDE_COMMIT_BACKPRESSURE;
        process.env.SPECSTRIDE_PROFILE = "parity";
      },
    },
  ];
  for (const item of cases) {
    const name = item.name;
    delete process.env.SPECSTRIDE_COMMIT_GATE_BEFORE_CRITIC;
    delete process.env.SPECSTRIDE_COMMIT_BACKPRESSURE;
    delete process.env.SPECSTRIDE_PROFILE;
    item.set();
    const fx = scenarioFixture("creds");
    process.env.STUB_SECRET = SECRET;
    try {
      await runFeature({ argv: [], workdir: fx.dir });
      const prompts = promptsOf(fx);
      const firstCritic = prompts.findIndex((entry) => entry.role === "critic");
      const proposerIndexes = prompts
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => entry.role === "proposer")
        .map(({ index }) => index);
      assert.notEqual(firstCritic, -1, `${name}: the critic was called for attempt 1`);
      assert.ok(
        proposerIndexes.length < 2 || firstCritic < proposerIndexes[1]!,
        `${name}: the critic call stands before any retry — the scan did not run before the critic`,
      );
      const preCritic = events(fx.dir).filter(
        (event) => event.type === "commit_gate.blocked" && event.data.step === "pre-critic",
      );
      assert.equal(preCritic.length, 0, `${name}: no pre-critic block`);
    } finally {
      delete process.env.STUB_SECRET;
      fx.restore();
    }
  }
  delete process.env.SPECSTRIDE_COMMIT_GATE_BEFORE_CRITIC;
  delete process.env.SPECSTRIDE_COMMIT_BACKPRESSURE;
  delete process.env.SPECSTRIDE_PROFILE;
});
