/**
 * T362 to T366, T368 — the tests of the read-only verb `specstride scan`,
 * the in-pass commit scan command (feature 153, F153-FR-027, F153-FR-026;
 * CQ-153-17 answered A on 2026-11-13: the name is `scan`, the codes are
 * 0 no hit, 2 at least one hit, 1 no state, 3 usage).
 *
 * Every case drives the real router (`route`) over a throwaway git
 * workspace, and the agreement case (CT-153-26) compares the command's hits
 * with the hits `commitScanOf` of core gives the engine on the same tree —
 * one typed unit, never a second scan. The command is advice: it writes no
 * file, and the prompt names it only with the switch on (F153-FR-027).
 *
 * Fixture values are built at runtime so no source line holds a contiguous
 * credential-shaped literal (the commit gate blocks the attempt otherwise).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { route } from "../../src/router/route.ts";
import { commitScanOf } from "../../../core/src/commit-scan/scan.ts";
import { quotedPath } from "../../../core/src/gate/feedback.ts";
import {
  blockingRuleOf,
  hashOfCommitGateRules,
  loadEngineCommitGateRules,
} from "../../../kernel/src/redactor/commit-gate-rules.ts";
import { createIngress } from "../../../observability/src/ingress/ingress.ts";
import { addedLinesAgainstHead, isAddedLine } from "../../src/engine/commit-lines.ts";
import { theInPassScanLine } from "../../src/engine/run-feature.ts";
import { loopConfigurationOf } from "../../src/engine/loop-config.ts";
import { runFeature } from "../../src/engine/run-feature.ts";
import { fixture } from "../engine/loop-speed-helpers.ts";

/** A credential-shaped value, built at runtime (never a source literal). */
const PLANTED = ["sk", "abcdef123456"].join("-");

/** One throwaway git workspace, with the state dir the guards require. */
type Workspace = {
  readonly root: string;
  readonly stateDir: string;
};

function git(root: string, argv: readonly string[]): void {
  const result = spawnSync("git", ["-C", root, ...argv], { encoding: "utf8" });
  assert.equal(result.status, 0, `git ${argv.join(" ")} failed: ${result.stderr}`);
}

/** A workspace: a git work tree with one commit, and `.specstride` state. */
function makeWorkspace(name: string, seedFiles: Readonly<Record<string, string>> = {}): Workspace {
  const root = mkdtemp(join(tmpdir(), "specstride-scan-"), name);
  git(root, ["init", "-q"]);
  git(root, ["config", "user.email", "test@example.test"]);
  git(root, ["config", "user.name", "test"]);
  if (!existsSync(join(root, "README.md"))) {
    writeFileSync(join(root, "README.md"), "seed\n");
  }
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "-m", "seed"]);
  // The seeded files stand AFTER the seed commit: they are the candidate
  // change the command scans (files HEAD holds are not the commit's to
  // answer for, commit-lines.ts).
  for (const [file, text] of Object.entries(seedFiles)) {
    writeFileSync(join(root, file), text);
  }
  mkdirSync(join(root, ".specstride", "features", "default"), { recursive: true });
  return { root, stateDir: join(root, ".specstride") };
}

let unique = 0;
function mkdtemp(parent: string, name: string): string {
  const root = join(parent, `${name}-${String(process.pid)}-${String((unique += 1))}`);
  mkdirSync(root, { recursive: true });
  return root;
}

function removeWorkspace(ws: Workspace): void {
  rmSync(ws.root, { recursive: true, force: true });
}

/** Run `scan` through the real router over one workspace. */
async function runScan(
  ws: Workspace,
  extra: readonly string[] = [],
): Promise<{ exit: number; out: string; err: string }> {
  let out = "";
  let err = "";
  const exit = await route(["scan", ...extra], {
    stateDir: ws.stateDir,
    cwd: ws.root,
    io: { out: (text) => (out += text), err: (text) => (err += text) },
    mode: "default",
  });
  return { exit, out, err };
}

/** One hit line of the command's output, parsed back into its fields. */
type PrintedHit = { readonly rule: string; readonly reason: string; readonly file: string; readonly line: string };

function printedHitsOf(out: string): readonly PrintedHit[] {
  const hits: PrintedHit[] = [];
  for (const line of out.split("\n")) {
    const match = /^(cg-[a-z0-9-]+) \(([^)]*)\) (.*) line (unknown|\d+)$/.exec(line);
    if (match !== null) {
      hits.push({
        rule: match[1] as string,
        reason: match[2] as string,
        file: JSON.parse(match[3] as string) as string,
        line: match[4] as string,
      });
    }
  }
  return hits;
}

/** The engine's own hits on the tree: `commitScanOf`, then the rule mapping. */
function engineHitsOf(root: string): readonly { rule: string; file: string; line: number }[] {
  const rules = loadEngineCommitGateRules();
  const changed = [
    ...spawnSync("git", ["-C", root, "diff", "--name-only", "-z", "HEAD"], { encoding: "utf8" }).stdout.split("\0"),
    ...spawnSync("git", ["-C", root, "ls-files", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).stdout.split("\0"),
  ].filter((name) => name !== "");
  const scan = commitScanOf(
    { files: changed },
    {
      exists: (file) => existsSync(join(root, file)),
      scan: (present) => createIngress().scanCommit(present, root),
      addedLines: (present) => addedLinesAgainstHead(root, present),
      lineIsAdded: isAddedLine,
    },
  );
  return scan.hits.flatMap((hit) => {
    const matched =
      hit.unreadable === true || hit.line === 0
        ? ("unreadable" as const)
        : hit.registeredSecret === true
          ? ("registered-secret" as const)
          : ("pattern" as const);
    const rule = blockingRuleOf(
      matched === "pattern" ? { matched, pattern: hit.pattern ?? "" } : { matched },
      rules,
    );
    return rule === null ? [] : [{ rule, file: hit.file, line: hit.line }];
  });
}

/** Every 8-character window of `value`, for the no-match-text assertion. */
function windowsOf8(value: string): readonly string[] {
  const windows: string[] = [];
  for (let at = 0; at + 8 <= value.length; at += 1) {
    windows.push(value.slice(at, at + 8));
  }
  return windows;
}

/** A deterministic little PRNG, so the 50 seeded trees are the same each run. */
function rngOf(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash every file of a tree, relative path to sha256, so a stray write shows. */
function treeFingerprint(root: string, excludeGit = false): string {
  const rows: string[] = [];
  const walk = (dir: string, base: string): void => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        // The git metadata of a fresh fixture holds the per-run commit ids
        // and times; the run comparison answers for the work files only.
        if (excludeGit && entry === ".git") continue;
        walk(path, base);
      } else {
        const rel = path.slice(base.length);
        const hash = createHash("sha256").update(readFileSync(path)).digest("hex");
        rows.push(`${rel} ${hash}`);
      }
    }
  };
  walk(root, root);
  return createHash("sha256").update(rows.sort().join("\n")).digest("hex");
}

/**
 * The engine's control root for one fixture workspace: the shape
 * `loop-speed-commit-scan.test.ts` reads — `~/.specstride/workspaces/<sha256
 * of the workdir, first 16 hex>`, with HOME pinned to the fixture root.
 */
function controlRootOf(workdir: string): string {
  return join(
    homedir(),
    ".specstride",
    "workspaces",
    createHash("sha256").update(workdir).digest("hex").slice(0, 16),
  );
}

/**
 * What varies legitimately from one run to the next: the run id and every
 * other long hex id, the timestamps (ISO and epoch milliseconds), process
 * ids, the temp paths of the fixture, and durations. Everything else — the
 * event kinds, the block records, the ledger counts, the feedback — must be
 * equal for two runs to count as the same run.
 */
function normalizePerRun(text: string, fixtureRoot: string, workdir: string): string {
  return text
    .split(`${fixtureRoot}`).join("FIXTURE")
    .split(`${workdir}`).join("WORK")
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/g, "TS")
    .replace(/\b1[6-9]\d{11}\b/g, "TS")
    .replace(/"(?:pid|ppid|groupId|sessionId|startedAtMs|endedAtMs|durationMs|elapsedMs|latencyMs)":\s*-?\d+/g, 'PID')
    .replace(/\b[0-9A-Z]{26}\b/g, "BUNDLE") // the source bundle id, minted per run
    .replace(/run-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, "RUNID")
    .replace(/\b[0-9a-f]{16,64}\b/g, "ID");
}

/** The normalized fingerprint of a control plane: relative path + content hash. */
function controlFingerprint(root: string, fixtureRoot: string, workdir: string): string {
  const rows: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else {
        const rel = normalizePerRun(path.slice(root.length), fixtureRoot, workdir);
        const body = normalizePerRun(readFileSync(path, "utf8"), fixtureRoot, workdir);
        rows.push(`${rel} ${createHash("sha256").update(body).digest("hex")}`);
      }
    }
  };
  walk(root);
  return createHash("sha256").update(rows.sort().join("\n")).digest("hex");
}

test('CT-153-27 "what a hit prints" (T362)', async (t) => {
  const ws = makeWorkspace("hit", { "planted.txt": `filler line\n${PLANTED}\n` });
  try {
    await t.test("the command prints rule id, reason, quoted file and line, and no match text", async () => {
      const { exit, out } = await runScan(ws);
      assert.equal(exit, 2);
      const hits = printedHitsOf(out);
      assert.equal(hits.length, 1);
      const hit = hits[0] as PrintedHit;
      assert.equal(hit.rule, "cg-sk-prefix");
      assert.equal(
        hit.reason,
        "a value of the shape of the credential pattern sk-prefix must not be committed",
      );
      assert.equal(hit.file, "planted.txt");
      assert.equal(hit.line, "2");
      // The file is rendered as quoted, escaped data of at most 160 characters.
      assert.ok(out.includes(quotedPath("planted.txt")));
      assert.ok(quotedPath("planted.txt").length <= 162); // the JSON quotes included
      // No substring of length >= 8 of the planted value appears anywhere.
      for (const window of windowsOf8(PLANTED)) {
        assert.equal(out.includes(window), false, `the output leaked ${window}`);
      }
    });
  } finally {
    removeWorkspace(ws);
  }
});

test('CT-153-27 "exit codes" (T363)', async (t) => {
  const clean = makeWorkspace("clean");
  const hit = makeWorkspace("hit2", { "leak.txt": `${PLANTED}\n` });
  const noStateRoot = join(tmpdir(), `specstride-scan-nostate-${Date.now()}`);
  mkdirSync(noStateRoot, { recursive: true });
  try {
    await t.test("0 with no hit", async () => {
      const { exit, out } = await runScan(clean);
      assert.equal(exit, 0);
      assert.match(out, /rules [0-9a-f]{64}/);
    });
    await t.test("2 with at least one hit", async () => {
      assert.equal((await runScan(hit)).exit, 2);
    });
    await t.test("1 with no state", async () => {
      let out = "";
      const exit = await route(["scan"], {
        cwd: noStateRoot,
        io: { out: (text) => (out += text), err: () => undefined },
        mode: "default",
      });
      assert.equal(exit, 1);
      assert.match(out, /reason="no-state"/);
    });
    await t.test("3 on a usage error", async () => {
      assert.equal((await runScan(hit, ["--rules", "other-rules.json"])).exit, 3);
      assert.equal((await runScan(hit, ["some/patterns.json"])).exit, 3);
    });
  } finally {
    removeWorkspace(clean);
    removeWorkspace(hit);
    rmSync(noStateRoot, { recursive: true, force: true });
  }
});

test('CT-153-27 "no other rule set" (T364)', async (t) => {
  const ws = makeWorkspace("rules", { "leak.txt": `${PLANTED}\n` });
  try {
    await t.test("every argument that names a rule file or a path to one is a usage error", async () => {
      for (const extra of [
        ["--rules", "secret-patterns.json"],
        ["--rules=secret-patterns.json"],
        ["engine-v1.json"],
        [join(ws.root, "whatever.json")],
      ]) {
        const call = await runScan(ws, extra);
        assert.equal(call.exit, 3, `expected 3 for ${extra.join(" ")}`);
        assert.match(call.err, /rule data pinned at launch/);
      }
    });
    await t.test("the rules used are the ones whose hash the launch recorded", async () => {
      const { out } = await runScan(ws);
      const expected = hashOfCommitGateRules(loadEngineCommitGateRules(), null);
      assert.match(out, new RegExp(`rules ${expected} \\(pinned at launch\\)`));
    });
  } finally {
    removeWorkspace(ws);
  }
});

test('CT-153-26 "it agrees with the engine" (T365)', async (t) => {
  const random = rngOf(0x5eed153);
  const workspaces: Workspace[] = [];
  try {
    for (let index = 0; index < 50; index += 1) {
      // Seed the tree by the draw: a tracked base file, a tracked file the
      // candidate appends a line to (added line), an untracked new file,
      // a secret HEAD already holds on an untouched line (dropped), and a
      // key-name-then-value line (ordinary code, dropped).
      const base = `base ${index}\nline\nline\n`;
      const tracked = `nothing here yet\nline ${index}\n`;
      const draw = (chance: number): boolean => random() < chance;
      const ws = makeWorkspace(`agree-${String(index)}`, { "base.txt": base });
      workspaces.push(ws);
      writeFileSync(join(ws.root, "tracked.txt"), tracked);
      if (draw(0.7)) {
        writeFileSync(join(ws.root, "tracked.txt"), `${tracked}${PLANTED}\n`);
      }
      if (draw(0.7)) {
        writeFileSync(join(ws.root, "new.txt"), `new file\n${PLANTED}\n`);
      }
      if (draw(0.4)) {
        // A secret HEAD already holds, on a line the candidate does not add.
        writeFileSync(join(ws.root, "old.txt"), `${PLANTED}\n`);
        git(ws.root, ["add", "old.txt"]);
        git(ws.root, ["commit", "-q", "-m", "old secret"]);
        writeFileSync(join(ws.root, "old.txt"), `${PLANTED}\nmore\n`);
      }
      if (draw(0.5)) {
        writeFileSync(join(ws.root, "ordinary.txt"), `password = hunter2222abc\n`);
      }
      git(ws.root, ["add", "-A"]);
      // The command's hits on the tree ...
      const { exit, out } = await runScan(ws);
      const printed = printedHitsOf(out).map((hit) => ({
        rule: hit.rule,
        file: hit.file,
        line: hit.line === "unknown" ? 0 : Number(hit.line),
      }));
      // ... equal the hits `commitScanOf` gives the engine on the same tree.
      assert.deepEqual(printed, engineHitsOf(ws.root), `tree ${String(index)} disagrees`);
      assert.equal(exit, printed.length > 0 ? 2 : 0);
    }
  } finally {
    for (const ws of workspaces) removeWorkspace(ws);
  }
});

test('CT-153-27 "it is advice" (T366)', async (t) => {
  const ws = makeWorkspace("advice", { "leak.txt": `${PLANTED}\n` });
  try {
    await t.test("the command writes no file", async () => {
      const before = treeFingerprint(ws.root);
      const first = await runScan(ws);
      assert.equal(treeFingerprint(ws.root), before);
      // And a second call answers exactly what the first answered: no
      // record, count or memory sits behind it.
      const second = await runScan(ws);
      assert.equal(second.exit, first.exit);
      assert.equal(second.out, first.out);
      assert.equal(treeFingerprint(ws.root), before);
    });
    await t.test("a failure changes nothing in the loop", async () => {
      // A usage failure over the same tree leaves the tree identical, too.
      await runScan(ws, ["--rules", "nope.json"]);
      assert.ok(existsSync(join(ws.root, "leak.txt")));
    });
  } finally {
    removeWorkspace(ws);
  }
});

/**
 * The stub `claude` of the run-level case: the critic always approves; the
 * proposer writes the phase evidence, plants the credential ON ATTEMPT 1
 * ONLY (the retry removes it, F152-SC-002), and — with `STUB_SCAN_MODE` set
 * — runs `specstride scan` over the run's workdir mid-pass (`run`), runs it
 * into a usage failure (`fail`), or never runs it (`skip`). It appends every
 * prompt, with its role, and each scan's exit and output to the traces
 * directory, OUTSIDE the work tree. It follows `stubClaude` of
 * `loop-speed-commit-scan.test.ts`.
 */
function runStubClaude(): string {
  return `#!/usr/bin/env node
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
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
  fs.writeFileSync(path.join(out, "seen-by-critic.txt"), prompt);
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  const n = fs.existsSync(path.join(out, "critic-calls")) ? Number(fs.readFileSync(path.join(out, "critic-calls"), "utf8")) : 0;
  fs.writeFileSync(path.join(out, "critic-calls"), String(n + 1));
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  const attempt = /This is attempt (\\d+)/.exec(prompt)?.[1] ?? "1";
  fs.writeFileSync(path.join(out, "seen-by-proposer-" + attempt + ".txt"), prompt);
  const evidence = (/Write your evidence to (\\.specstride\\S+?) \\(/i.exec(prompt) ?? /write (\\.specstride\\S+?):/i.exec(prompt))[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  fs.writeFileSync("made.txt", "work\\n");
  fs.mkdirSync("newdir", { recursive: true });
  fs.writeFileSync("newdir/inside.txt", "nested\\n");
  if (!fs.existsSync("planted.txt")) {
    fs.writeFileSync("planted.txt", "1");
    fs.writeFileSync("creds.txt", "token = " + (process.env.STUB_SECRET ?? "") + "\\n");
  } else {
    fs.rmSync("creds.txt", { force: true });
  }
  const mode = process.env.STUB_SCAN_MODE ?? "";
  if (mode !== "") {
    const attempt = /This is attempt (\\d+)/.exec(prompt)?.[1] ?? "1";
    const scanArgv = [process.execPath, "--experimental-strip-types", process.env.STUB_CLI_ENTRY, "scan"];
    if (mode === "fail") scanArgv.push("--rules", "other.json");
    const scan = spawnSync(scanArgv[0], scanArgv.slice(1), { cwd: process.cwd(), encoding: "utf8" });
    fs.writeFileSync(
      path.join(out, "scan-" + mode + "-" + attempt + ".json"),
      JSON.stringify({ exit: scan.status, stdout: scan.stdout, stderr: scan.stderr }),
    );
  }
  const tasks = "specs/001-one/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replace("[ ]", "[x]"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;
}

test('CT-153-27 "a run is the same whether the proposer runs, skips or fails the scan" (T366)', async (t) => {
  // The planted credential: `ghp_` + 36 characters, a `github-prefix` hit the
  // scan really sees on attempt 1 — the run must behave identically whether
  // or not the proposer read that hit.
  const SECRET = `ghp_${"a1b2c3d4e5f6".repeat(3)}`;
  const cliEntry = join(import.meta.dirname, "..", "..", "bin", "specstride");
  await t.test("the records, counts and outcome of the three runs are deep-equal", async () => {
    type Observed = {
      readonly mode: string;
      readonly runExit: number;
      readonly scanExit: number | null;
      readonly scanOut: string;
      readonly ruleDataHash: string | null;
      readonly proposerPrompt1: string;
      readonly tree: string;
      readonly control: string;
    };
    const observed: Observed[] = [];
    for (const mode of ["run", "skip", "fail"] as const) {
      const fx = fixture({ verdicts: "APPROVED" });
      const traces = join(fx.dir, "..", "traces");
      mkdirSync(traces, { recursive: true });
      // Replace the helper's stub with this file's run stub; keep the
      // fixture's environment pinning (HOME, PATH, the switches).
      writeFileSync(join(fx.dir, "..", "bin", "claude"), runStubClaude());
      chmodSync(join(fx.dir, "..", "bin", "claude"), 0o755);
      process.env.STUB_TRACE_DIR = traces;
      process.env.STUB_SECRET = SECRET;
      process.env.STUB_SCAN_MODE = mode;
      process.env.STUB_CLI_ENTRY = cliEntry;
      try {
        const runExit = await runFeature({ argv: [], workdir: fx.dir });
        // Attempt 1 is the pass where the credential stands planted: that is
        // the scan the advice-vs-no-advice question is about.
        const scanFile = mode === "skip" ? null : JSON.parse(
          readFileSync(join(traces, `scan-${mode}-1.json`), "utf8"),
        ) as { exit: number | null; stdout: string };
        // The launch records the hash of the pinned rule data on the block
        // record (run-feature.ts `ruleDataHash`): read it before the fixture
        // is restored, and answer the printed hash against it below.
        const blockPath = join(controlRootOf(fx.dir), "commit-gate", "phase1.1.block.json");
        const block = existsSync(blockPath)
          ? (JSON.parse(readFileSync(blockPath, "utf8")) as { ruleDataHash?: string })
          : {};
        observed.push({
          mode,
          runExit,
          scanExit: scanFile === null ? null : scanFile.exit,
          scanOut: scanFile === null ? "" : scanFile.stdout,
          ruleDataHash: block.ruleDataHash ?? null,
          proposerPrompt1: readFileSync(join(traces, "seen-by-proposer-1.txt"), "utf8"),
          tree: treeFingerprint(fx.dir, true),
          control: controlFingerprint(controlRootOf(fx.dir), join(fx.dir, ".."), fx.dir),
        });
      } finally {
        delete process.env.STUB_TRACE_DIR;
        delete process.env.STUB_SECRET;
        delete process.env.STUB_SCAN_MODE;
        delete process.env.STUB_CLI_ENTRY;
        fx.restore();
      }
    }
    // The proposer really ran the command, and really saw the hit.
    assert.equal(observed[0]!.scanExit, 2);
    assert.match(observed[0]!.scanOut, /cg-github-prefix/);
    assert.match(observed[0]!.scanOut, /"creds\.txt"/);
    assert.equal(observed[2]!.scanExit, 3, "the failed variant failed as a usage error");
    assert.equal(observed[1]!.scanExit, null, "the skipping proposer never ran it");
    // The rules the command used are the ones whose hash the LAUNCH recorded
    // on the block record — not merely the hash of a fresh load (T364).
    const printed = /rules ([0-9a-f]{64}) \(pinned at launch\)/.exec(observed[0]!.scanOut)?.[1];
    assert.ok(printed !== undefined, "the scan printed the pinned rules hash");
    assert.equal(printed, observed[0]!.ruleDataHash);
    assert.equal(observed[1]!.ruleDataHash, observed[0]!.ruleDataHash);
    // The REAL prompt the proposer saw names the command with the switch on
    // (T368, end to end through the run seam, not the helper alone).
    assert.match(observed[0]!.proposerPrompt1, /specstride scan/);
    assert.match(observed[0]!.proposerPrompt1, /advice only/);
    // The run outcome is the same in all three: the engine's exit, the tree
    // it left, and the whole control plane (events, block records, ledger
    // counts, feedback), normalized only for what is unique per run.
    assert.equal(observed[0]!.runExit, observed[1]!.runExit);
    assert.equal(observed[0]!.runExit, observed[2]!.runExit);
    assert.equal(observed[0]!.tree, observed[1]!.tree);
    assert.equal(observed[0]!.tree, observed[2]!.tree);
    assert.equal(observed[0]!.control, observed[1]!.control, "run vs skip: the control plane differs");
    assert.equal(observed[0]!.control, observed[2]!.control, "run vs fail: the control plane differs");
  });

  await t.test("under `parity` the prompt never names the command", async () => {
    // Row 141: under the parity profile no such command is named to the
    // proposer — read on the real prompt of a real parity run.
    const fx = fixture({ verdicts: "APPROVED" });
    const traces = join(fx.dir, "..", "traces");
    mkdirSync(traces, { recursive: true });
    writeFileSync(join(fx.dir, "..", "bin", "claude"), runStubClaude());
    chmodSync(join(fx.dir, "..", "bin", "claude"), 0o755);
    process.env.STUB_TRACE_DIR = traces;
    process.env.STUB_SECRET = SECRET;
    process.env.STUB_SCAN_MODE = "";
    process.env.STUB_CLI_ENTRY = cliEntry;
    process.env.SPECSTRIDE_PROFILE = "parity";
    try {
      await runFeature({ argv: [], workdir: fx.dir });
      const prompt = readFileSync(join(traces, "seen-by-proposer-1.txt"), "utf8");
      assert.equal(prompt.includes("specstride scan"), false, "the parity prompt names the scan");
    } finally {
      delete process.env.STUB_TRACE_DIR;
      delete process.env.STUB_SECRET;
      delete process.env.STUB_SCAN_MODE;
      delete process.env.STUB_CLI_ENTRY;
      delete process.env.SPECSTRIDE_PROFILE;
      fx.restore();
    }
  });
});

test('CT-153-27 "the prompt names it only with the switch on" (T368)', async (t) => {
  const home = mkdtemp(join(tmpdir(), "specstride-scan-home-"), "home");
  const workdir = mkdtemp(join(tmpdir(), "specstride-scan-work-"), "work");
  try {
    await t.test("the prompt line is the empty string with the switch off", () => {
      assert.equal(theInPassScanLine(false), "");
    });
    await t.test("the switch reads on by default and off under `parity`", () => {
      const byDefault = loopConfigurationOf({ home, workdir, environment: {} });
      assert.equal(byDefault.commitScanInPass, true);
      const underParity = loopConfigurationOf({
        home,
        workdir,
        environment: { SPECSTRIDE_PROFILE: "parity" },
      });
      assert.equal(underParity.commitScanInPass, false);
    });
    await t.test("the line names the command and says it is advice", () => {
      const line = theInPassScanLine(true);
      assert.match(line, /specstride scan/);
      assert.match(line, /advice only/);
    });
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(workdir, { recursive: true, force: true });
  }
});
