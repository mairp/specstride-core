/**
 * T151 (feature 154, Phase 17, G8) — THE VOCABULARY TEST of F142-FR-066
 * over the fixtures of `tests/fixtures/154/` (F154-FR-068, V-01).
 *
 * For each fixture the stub engine runs TWICE against the same stub
 * `claude` (a critic-class call is one with `--max-turns` in argv or a
 * prompt that starts with `You are the CRITIC`):
 *
 *  1. THE BASELINE SERIAL RUN — every parallel/speculation switch of spec
 *     154 off (they are off by default; the environment names are deleted
 *     so an outer run cannot leak one in).
 *  2. THE SWITCHES-ON RUN — `SPECSTRIDE_LOOP_PHASES_PARALLEL=on`,
 *     `SPECSTRIDE_LOOP_SPECULATE=on`,
 *     `SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS=on` and
 *     `SPECSTRIDE_LOOP_PARALLEL_GROUP_CHECK=on`, the derived environment
 *     names of §K.2 rule 3 (`SPECSTRIDE_` + the key path upper-cased) for
 *     the keys `loop.phases.parallel`, `loop.speculate`,
 *     `loop.parallel.groupUnits` and `loop.parallel.groupCheck` read by
 *     `loopConfigurationOf` of `packages/cli/src/engine/loop-config.ts`.
 *
 * The baseline vocabulary is the set of whitespace-separated words over
 * every baseline critic prompt; the assertion of F142-FR-066 (V-01) is
 * that the switches-on run introduces ZERO new words: every word of every
 * switches-on critic prompt is present in the baseline vocabulary. Both
 * runs must exit 0.
 *
 * Fixtures in the loop: `phases` and `spec` always; `plan`, `groups`,
 * `slots` and `stages` as far as they exit 0 with the stub — a fixture
 * whose switches-on run does not exit 0 is dropped from the loop, with the
 * reason in the comment at its entry below.
 *
 * Run from the repository root:
 *     node --experimental-strip-types --test tests/parallel/154/vocabulary-154.test.ts
 */
import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { runFeature } from "../../../packages/cli/src/engine/run-feature.ts";
import { pinEngineEnv } from "../../../packages/cli/test/engine/helpers/fixture.ts";

/** The four derived environment names of the spec-154 switches (§K.2 rule 3). */
const SWITCHES_ON: Readonly<Record<string, string>> = Object.freeze({
  SPECSTRIDE_LOOP_PHASES_PARALLEL: "on",
  SPECSTRIDE_LOOP_SPECULATE: "on",
  SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS: "on",
  SPECSTRIDE_LOOP_PARALLEL_GROUP_CHECK: "on",
});

/**
 * The fixtures of the loop. `note` carries the reason wherever a fixture
 * dropped out of the loop (kept out of the run list, never silently):
 * none dropped — every fixture below ran both runs to exit 0 with the stub.
 */
const FIXTURES: readonly { readonly name: string; readonly note?: string }[] = Object.freeze([
  { name: "phases" },
  { name: "spec" },
  // T151 iteration note: `plan`, `groups`, `slots` and `stages` all ran the
  // switches-on run to exit 0 with the stub, so they stay in the loop.
  { name: "plan" },
  { name: "groups" },
  { name: "slots" },
  { name: "stages" },
]);

/** The task list of one fixture of `tests/fixtures/154/`, read off disk. */
function tasksOfFixture(name: string): string {
  return readFileSync(
    join(import.meta.dirname, "../../fixtures/154", name, "tasks.md"),
    "utf8",
  );
}

/**
 * The stub `claude` of the inertness helper (`tests/inertness/154/helpers.ts`),
 * recording every prompt it answers to `prompts.jsonl` under the private
 * HOME: the proposer writes its evidence, ticks the fixture's tasks and
 * writes a checkpoint; the critic echoes the VERDICT nonce APPROVED; the
 * diagnostician answers the grounding case.
 */
function stubClaude(tasksPath: string, feature: string): string {
  return `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC");
const role = prompt.includes("Diagnostician") ? "diagnostician" : (critic ? "critic" : "proposer");
const log = path.join(process.env.HOME, "prompts.jsonl");
fs.appendFileSync(log, JSON.stringify({ role, prompt, session }) + "\\n");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (role === "diagnostician") {
  console.log(JSON.stringify({ type: "result", result: "CASE: GROUNDING\\nName the missing test of T001." }));
} else if (critic) {
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  const evidence = (/Write your evidence to (\\.specstride\\S+?) \\(/i.exec(prompt) ?? /write (\\.specstride\\S+?):/i.exec(prompt))[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  fs.mkdirSync(".specstride/features/${feature}/outbox", { recursive: true });
  fs.writeFileSync(
    ".specstride/features/${feature}/outbox/u1.checkpoint.json",
    JSON.stringify({ schema: "specstride.checkpoint/1", tasks: ["T001"] }),
  );
  fs.writeFileSync(tasksPath, fs.readFileSync(tasksPath, "utf8").replace(/- \\[ \\] (T00\\d)/g, "- [x] $1"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;
}

/** One run of one fixture: a fresh workspace, a private HOME, the stub on PATH. */
function harnessOfFixture(
  name: string,
  switchesOn: boolean,
): {
  readonly work: string;
  readonly home: string;
  readonly criticPrompts: () => readonly string[];
  readonly restore: () => void;
} {
  const root = mkdtempSync(join(tmpdir(), `specstride-g8-t151-${name}-`));
  const bin = join(root, "bin");
  const home = join(root, "home");
  const work = join(root, "work");
  const feature = `154-${name}`;
  const tasksPath = `specs/${feature}/tasks.md`;
  mkdirSync(bin);
  mkdirSync(home);
  mkdirSync(join(work, "specs", feature), { recursive: true });
  writeFileSync(join(bin, "claude"), stubClaude(tasksPath, feature));
  chmodSync(join(bin, "claude"), 0o755);
  writeFileSync(join(work, tasksPath), tasksOfFixture(name));
  for (const argv of [
    ["init", "-q"],
    ["config", "user.email", "t@t"],
    ["config", "user.name", "t"],
    ["add", "-A"],
    ["commit", "-qm", "init"],
  ]) {
    spawnSync("git", ["-C", work, ...argv]);
  }
  const switchNames = Object.keys(SWITCHES_ON);
  const before = {
    HOME: process.env.HOME,
    PATH: process.env.PATH,
    switches: switchNames.map((n) => process.env[n]),
  };
  process.env.HOME = home;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  for (const [n, value] of Object.entries(SWITCHES_ON)) {
    if (switchesOn) process.env[n] = value;
    else delete process.env[n];
  }
  const restoreEnv = pinEngineEnv({ feature });
  return {
    work,
    home,
    criticPrompts: () => {
      const file = join(home, "prompts.jsonl");
      if (!existsSync(file)) return [];
      return readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => JSON.parse(line) as { role: string; prompt: string })
        .filter((one) => one.role === "critic")
        .map((one) => one.prompt);
    },
    restore: () => {
      restoreEnv();
      process.env.HOME = before.HOME;
      process.env.PATH = before.PATH;
      switchNames.forEach((n, i) => {
        const old = before.switches[i];
        if (old === undefined) delete process.env[n];
        else process.env[n] = old;
      });
      rmSync(root, { recursive: true, force: true });
    },
  };
}

/**
 * The vocabulary: the set of whitespace-separated words over the texts.
 *
 * Opaque RUN tokens are normalised before the words are taken (every run
 * of hex length 12 or more becomes `#`): the tree ids and tree-path names
 * of the parallel machinery are `sha256(<random runId>:…)` slices and the
 * critic nonces are per-attempt randoms, so they differ between ANY two
 * runs — baseline and switches-on alike — and are tokens of the run, not
 * words the feature writes (the same exemption F142-FR-066 makes for the
 * opaque tokens). Every other word of the prompt takes part in the test.
 */
function vocabularyOf(prompts: readonly string[]): ReadonlySet<string> {
  const words = new Set<string>();
  for (const prompt of prompts) {
    for (const word of prompt.replace(/[0-9a-f]{12,}/g, "#").split(/\s+/)) {
      if (word !== "") words.add(word);
    }
  }
  return words;
}

/**
 * One fixture, both runs, in order: the baseline serial run (every switch
 * of spec 154 off), then the switches-on run over a FRESH workspace of the
 * same fixture — no leftover state of the baseline can stand in it, and the
 * test is clean when it runs twice in a row (every run makes its own
 * tempdir and restores the environment in `finally`). The baseline critic
 * prompts are captured while the baseline workspace stands; the vocabulary
 * computed over them must cover every word of every switches-on critic
 * prompt (F142-FR-066, V-01: 0 new words), and both runs must exit 0.
 */
async function runFixturePair(name: string): Promise<void> {
  const baseline = harnessOfFixture(name, false);
  let baselineExit: number;
  let baselineVocabulary: ReadonlySet<string>;
  try {
    baselineExit = await runFeature({ argv: [], workdir: baseline.work });
    const prompts = baseline.criticPrompts();
    baselineVocabulary = vocabularyOf(prompts);
    assert.ok(prompts.length > 0, `${name}: the baseline run recorded no critic prompt`);
  } finally {
    baseline.restore();
  }
  assert.equal(baselineExit, 0, `${name}: the baseline run did not exit 0`);

  const on = harnessOfFixture(name, true);
  try {
    const onExit = await runFeature({ argv: [], workdir: on.work });
    assert.equal(onExit, 0, `${name}: the switches-on run did not exit 0`);
    const onPrompts = on.criticPrompts();
    assert.ok(onPrompts.length > 0, `${name}: the switches-on run recorded no critic prompt`);
    const newWords = [...vocabularyOf(onPrompts)].filter(
      (word) => !baselineVocabulary.has(word),
    );
    assert.deepEqual(
      newWords,
      [],
      `${name}: the switches-on run introduced ${newWords.length} new word(s) outside ` +
        `the baseline critic vocabulary: ${JSON.stringify(newWords.slice(0, 20))}`,
    );
  } finally {
    on.restore();
  }
}

test("G8 T151: the switches-on run of every 154 fixture introduces 0 new critic words (F142-FR-066, F154-FR-068 V-01)", async () => {
  for (const { name, note } of FIXTURES) {
    // `note` marks a fixture dropped from the loop with its reason; every
    // fixture of this list runs, so it must be absent here.
    assert.equal(note, undefined, `${name}: a noted fixture must not stay in the loop`);
    await runFixturePair(name);
  }
});
