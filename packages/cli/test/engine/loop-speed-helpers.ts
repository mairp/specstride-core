/**
 * Test helpers for the loop-speed engine tests of feature 153, modelled on
 * `STUB` and `fixture` of `run-feature.test.ts` (which this file does not
 * edit). `stubClaude` writes a stub of the `claude` executable whose critic
 * verdicts come from `verdicts` and which appends every prompt it receives,
 * with the role it was called in (proposer, critic or diagnostician), to
 * `prompts.jsonl` in the working directory — the evidence the tests use to
 * count critic calls and to assert what a prompt holds.
 */
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export type Fixture = { readonly dir: string; readonly restore: () => void };
export type Verdicts = string | readonly string[];

/**
 * The stub `claude` executable. `verdicts` is one verdict (used for every
 * critic call) or a list consumed in order, the last one repeated; every
 * other part of the behaviour follows `STUB` of `run-feature.test.ts`.
 */
export function stubClaude(verdicts: Verdicts, proposerExtra = ""): string {
  const list = Array.isArray(verdicts) ? verdicts : [verdicts];
  return `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC"); // the parity profile argv carries no --max-turns (F125-FR-009)
const role = prompt.includes("Diagnostician") ? "diagnostician" : (critic ? "critic" : "proposer");
const VERDICTS = ${JSON.stringify(list)};
fs.appendFileSync("prompts.jsonl", JSON.stringify({ role, prompt }) + "\\n");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (role === "diagnostician") {
  fs.writeFileSync("seen-by-diagnostician.txt", prompt);
  console.log(JSON.stringify({ type: "result", result: "CASE: GROUNDING\\nName the missing test of T001." }));
} else if (critic) {
  fs.writeFileSync("seen-by-critic.txt", prompt);
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  const n = fs.existsSync("critic-calls.txt") ? Number(fs.readFileSync("critic-calls.txt", "utf8")) : 0;
  fs.writeFileSync("critic-calls.txt", String(n + 1));
  const verdict = VERDICTS[Math.min(n, VERDICTS.length - 1)];
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": " + verdict }));
} else {
  const evidence = (/Write your evidence to (\\.specstride\\S+?) \\(/i.exec(prompt) ?? /write (\\.specstride\\S+?):/i.exec(prompt))[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  fs.writeFileSync("made.txt", process.env.STUB_NEW_FILE ?? "work\\n");
  fs.mkdirSync("newdir", { recursive: true });
  fs.writeFileSync("newdir/inside.txt", "nested\\n");
  ${proposerExtra}
  const tasks = "specs/001-one/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replace("[ ]", "[x]"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;
}

export type FixtureOptions = {
  /** Critic verdict(s): one for every call, or a list consumed in order. */
  readonly verdicts: Verdicts;
  /** Extra files written into the working directory before the run. */
  readonly files?: Readonly<Record<string, string>>;
  /** Extra statements injected into the proposer branch of the stub. */
  readonly proposerExtra?: string;
};

/**
 * A fixture working directory with a git history, the stub on `PATH`, and the
 * environment pinned and restored exactly as `fixture` of
 * `run-feature.test.ts` does.
 */
export function fixture(options: FixtureOptions): Fixture {
  const root = mkdtempSync(join(tmpdir(), "specstride-loop-speed-"));
  const bin = join(root, "bin");
  const work = join(root, "work");
  mkdirSync(bin);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  writeFileSync(join(bin, "claude"), stubClaude(options.verdicts, options.proposerExtra ?? ""));
  chmodSync(join(bin, "claude"), 0o755);
  writeFileSync(
    join(work, "specs", "001-one", "tasks.md"),
    "# Tasks\n\n## Phase 1: One\n\n- [ ] T001 Do it\n",
  );
  for (const [name, content] of Object.entries(options.files ?? {})) {
    const target = join(work, name);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
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
    PROPOSER: process.env.SPECSTRIDE_PROPOSER,
    CRITIC: process.env.SPECSTRIDE_CRITIC,
    PAUSE: process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC,
    LIMITS: process.env.SPECSTRIDE_LIMITS,
  };
  process.env.HOME = root;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  delete process.env.SPECSTRIDE_FEATURE;
  process.env.SPECSTRIDE_PROPOSER = "claude";
  process.env.SPECSTRIDE_CRITIC = "claude";
  process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = "0";
  // The engine loop's own count limits hold in the tests: a campaign shell
  // may run with SPECSTRIDE_LIMITS=off (the owner's no-ceiling ruling), under
  // which a rejection test has no reject limit to reach and loops forever.
  process.env.SPECSTRIDE_LIMITS = "on";
  return {
    dir: work,
    restore: () => {
      process.env.HOME = before.HOME;
      process.env.PATH = before.PATH;
      if (before.FEATURE === undefined) delete process.env.SPECSTRIDE_FEATURE;
      else process.env.SPECSTRIDE_FEATURE = before.FEATURE;
      if (before.PROPOSER === undefined) delete process.env.SPECSTRIDE_PROPOSER;
      else process.env.SPECSTRIDE_PROPOSER = before.PROPOSER;
      if (before.CRITIC === undefined) delete process.env.SPECSTRIDE_CRITIC;
      else process.env.SPECSTRIDE_CRITIC = before.CRITIC;
      if (before.PAUSE === undefined) delete process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC;
      else process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = before.PAUSE;
      if (before.LIMITS === undefined) delete process.env.SPECSTRIDE_LIMITS;
      else process.env.SPECSTRIDE_LIMITS = before.LIMITS;
      rmSync(root, { recursive: true, force: true });
    },
  };
}
