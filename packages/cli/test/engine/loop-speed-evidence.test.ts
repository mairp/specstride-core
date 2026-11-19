/**
 * The per-task critic evidence of feature 153, user story 4, phase 15 —
 * with `critic.evidence.perTask` on (the default), the block
 * `# The change in the working tree` of the critic prompt holds one section
 * per task of the phase with the content of the files the task's text names
 * (F153-FR-051, CT-153-51), a new file the budget would hide is shown as
 * head and tail and never missing (F153-SC-012, F153-FR-052), the checkpoint
 * note of the micro layer stays out of every critic prompt (F153-FR-053),
 * and with the switch off — as the `parity` profile stands it down — the
 * block is today's capped whole diff (F153-FR-005, Principle XVIII).
 *
 * CT-153-51, F153-SC-012, CT-153-5, CT-153-53, on the fixture
 * `critic-rejects-then-approves` (T162). No paid or external model API is
 * called (F153-FR-060).
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { runFeature } from "../../src/engine/run-feature.ts";
import { fixture } from "./loop-speed-helpers.ts";

const FIXTURE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "loop-speed",
  "critic-rejects-then-approves",
);

type Prompt = { readonly role: string; readonly prompt: string };

const promptsOf = (dir: string): Prompt[] =>
  readFileSync(join(dir, "prompts.jsonl"), "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as Prompt);

const criticPromptsOf = (dir: string): readonly string[] =>
  promptsOf(dir)
    .filter((entry) => entry.role === "critic")
    .map((entry) => entry.prompt);

/**
 * Strips what may differ between two honest runs, so the change block can be
 * compared across runs (the nonce F100-FR-139, the boundary token of the
 * framing, the grounding ordinal, and the pin block of the verdicts a
 * previous attempt pinned).
 */
const normalised = (prompt: string): string =>
  prompt
    .replace(/VERDICT [0-9a-f]+:/g, "VERDICT <nonce>:")
    .replace(/SPECSTRIDE-OUTSIDE-[0-9a-f]+/g, "<boundary>")
    .replace(/attempt:(\d+):\d+:grounding/g, "attempt:$1:<ordinal>:grounding")
    .replace(/\nPREVIOUSLY CONFIRMED \(W9 verdict pins\)[\s\S]*?(?=\n# End of the data)/, "");

/** The `# The change in the working tree` block of a critic prompt. */
const changeBlockOf = (prompt: string): string => {
  const start = prompt.indexOf("# The change in the working tree");
  const end = prompt.indexOf("# End of the data");
  assert.ok(start >= 0, "the prompt holds the change block");
  assert.ok(end > start, "the prompt holds the end marker");
  return prompt.slice(start, end);
};

/**
 * Runs the T162 fixture to its end: the stub critic rejects attempt 1 naming
 * only T004 as unmet and approves attempt 2, both attempts inside ONE
 * `runFeature` call. `config` is written as the user configuration before the
 * run.
 */
async function runPinsFixture(config?: string) {
  const { dir, restore } = fixture({ verdicts: "APPROVED" });
  const home = join(dir, "..");
  process.env.SPECSTRIDE_DIAGNOSTICIAN = "off";
  delete process.env.STUB_ATTEMPT2;
  mkdirSync(join(dir, "specs", "001-one"), { recursive: true });
  copyFileSync(join(FIXTURE, "tasks.md"), join(dir, "specs", "001-one", "tasks.md"));
  copyFileSync(join(FIXTURE, "..", "bin", "stub-critic-pins.mjs"), join(home, "bin", "claude"));
  chmodSync(join(home, "bin", "claude"), 0o755);
  if (config !== undefined) {
    mkdirSync(join(home, ".config", "specstride"), { recursive: true });
    writeFileSync(join(home, ".config", "specstride", "config.yaml"), config);
  }
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
  }
  return { dir, exit, critics: criticPromptsOf(dir), restore };
}

test("CT-153-51 the critic sees each task's files (T200)", async () => {
  const r = await runPinsFixture();
  try {
    assert.equal(r.exit, 0);
    assert.ok(r.critics.length >= 1, "the critic was called");
    const prompt = r.critics[0]!;
    for (const id of ["T001", "T002", "T004"]) {
      assert.ok(prompt.includes(`## Task ${id}`), `the prompt holds a section for ${id}`);
    }
    for (const [path, text] of [
      ["src/a.ts", "export const a = 1;"],
      ["src/b.ts", "export const b = 1;"],
      ["src/c.ts", "export const c = 1;"],
    ] as const) {
      assert.ok(prompt.includes(`### ${path}`), `the prompt names ${path}`);
      assert.ok(prompt.includes(text), `the prompt holds the content of ${path}`);
    }
    assert.ok(
      !prompt.includes("diff --git"),
      "the per-task evidence replaces the whole diff",
    );
  } finally {
    r.restore();
  }
});

test("F153-SC-012 a big new file is not hidden (T201)", async () => {
  // A 70,000-byte new file named by T001 is above NEW_FILE_CAP_BYTES; a
  // 30,000-token critic window scales the per-file cap to the 65,536-byte
  // floor (`MIN_SCALED_BUDGET_BYTES`), so the file stands above the cap and
  // is rendered as head, a left-out count and tail. `newdir/inside.txt` is a
  // new file no task names: it stays visible under the outside-every-task
  // section.
  const big = `${"A".repeat(39_000)}MIDDLE${"Z".repeat(30_981)}TAIL-END-153\n`;
  assert.ok(Buffer.byteLength(big) === 70_000);
  const fx = fixture({
    verdicts: "APPROVED",
    files: {
      "specs/001-one/tasks.md":
        "# Tasks\n\n## Phase 1: One\n\n- [ ] T001 Write made.txt\n",
    },
  });
  const beforeWindow = process.env.SPECSTRIDE_CRITIC_WINDOW;
  const beforeNewFile = process.env.STUB_NEW_FILE;
  process.env.SPECSTRIDE_CRITIC_WINDOW = "30000";
  process.env.STUB_NEW_FILE = big;
  try {
    assert.equal(await runFeature({ argv: [], workdir: fx.dir }), 0);
    const critics = criticPromptsOf(fx.dir);
    assert.ok(critics.length >= 1, "the critic was called");
    const prompt = critics[0]!;
    assert.ok(prompt.includes("## Task T001"), "the prompt holds the section for T001");
    assert.ok(prompt.includes("### made.txt"), "the prompt names the big new file");
    assert.ok(prompt.includes("A".repeat(200)), "the head of the big file is shown");
    assert.ok(prompt.includes("TAIL-END-153"), "the tail of the big file is shown");
    // The elision really happened: the head-tail excerpt names the bytes it
    // left out, and the middle of the file is not in the prompt.
    assert.ok(prompt.includes("bytes left out"), "the excerpt names the left-out bytes");
    assert.ok(!prompt.includes("MIDDLE"), "the middle of the big file is elided");
    assert.ok(
      !prompt.includes("not shown\n"),
      "the big file is not declared hidden as the capped diff did",
    );
    assert.ok(
      !/##\s*NOT-SHOWN[^]*?- made\.txt/m.test(prompt),
      "the big file is not hidden under NOT-SHOWN",
    );
    assert.ok(
      prompt.includes("## Changes outside every task"),
      "the outside-every-task section is present",
    );
    assert.ok(
      prompt.includes("### newdir/inside.txt") && prompt.includes("nested"),
      "a new file no task names is shown there",
    );
  } finally {
    if (beforeWindow === undefined) delete process.env.SPECSTRIDE_CRITIC_WINDOW;
    else process.env.SPECSTRIDE_CRITIC_WINDOW = beforeWindow;
    if (beforeNewFile === undefined) delete process.env.STUB_NEW_FILE;
    else process.env.STUB_NEW_FILE = beforeNewFile;
    fx.restore();
  }
});

test("CT-153-5 switch off is the capped diff (T202)", async () => {
  // Under `profile: parity` the switch is off, so the block is today's
  // `changeOf` output; the same block comes out when the switch is turned
  // off by configuration alone.
  const parity = await runPinsFixture("schema: 1\nprofile: parity\n");
  try {
    assert.equal(parity.exit, 0);
    const block = changeBlockOf(normalised(parity.critics[0]!));
    assert.ok(block.includes("diff --git"), "the capped whole diff is there");
    assert.ok(block.includes("--- new file src/a.ts"), "the new files' content is there");
    assert.ok(!block.includes("## Task T001"), "no per-task sections with the switch off");

    const off = await runPinsFixture("schema: 1\ncritic:\n  evidence:\n    perTask: false\n");
    try {
      assert.equal(off.exit, 0);
      assert.equal(
        changeBlockOf(normalised(off.critics[0]!)),
        block,
        "switch off by configuration is byte-identical to the parity block",
      );
    } finally {
      off.restore();
    }
  } finally {
    parity.restore();
  }
});

/**
 * A micro-layer workspace whose stub `claude` writes the evidence, ticks the
 * task and writes a checkpoint whose note holds `NOTE-153` (feature 115's
 * outbox contract, note cap 512 bytes).
 */
function microFixture(): { readonly dir: string; readonly restore: () => void } {
  const root = mkdtempSync(join(tmpdir(), "specstride-evidence-micro-"));
  const bin = join(root, "bin");
  const work = join(root, "work");
  mkdirSync(bin);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  const stub = `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns");
fs.appendFileSync("prompts.jsonl", JSON.stringify({ role: critic ? "critic" : "proposer", prompt }) + "\\n");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (critic) {
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  const evidence = /write (\\.specstride\\S+?):/i.exec(prompt)[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  const outbox = ".specstride/features/001-one/outbox";
  fs.mkdirSync(outbox, { recursive: true });
  fs.writeFileSync(
    path.join(outbox, "u1.checkpoint.json"),
    JSON.stringify({ schema: "specstride.checkpoint/1", tasks: ["T001"], note: "NOTE-153 the engine's own note for the next pass" }),
  );
  const tasks = "specs/001-one/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replace("[ ]", "[x]"));
  fs.writeFileSync("made.txt", "work\\n");
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;
  writeFileSync(join(bin, "claude"), stub);
  chmodSync(join(bin, "claude"), 0o755);
  writeFileSync(
    join(work, "specs", "001-one", "tasks.md"),
    "# Tasks\n\n## Phase 1: One\n\n- [ ] T001 Do it\n",
  );
  writeFileSync(join(work, "package.json"), JSON.stringify({ scripts: { test: "node -e ''" } }));
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
    DIAG: process.env.SPECSTRIDE_DIAGNOSTICIAN,
  };
  process.env.HOME = root;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  delete process.env.SPECSTRIDE_FEATURE;
  process.env.SPECSTRIDE_PROPOSER = "claude";
  process.env.SPECSTRIDE_CRITIC = "claude";
  process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = "0";
  process.env.SPECSTRIDE_LIMITS = "on";
  process.env.SPECSTRIDE_DIAGNOSTICIAN = "off";
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
      if (before.DIAG === undefined) delete process.env.SPECSTRIDE_DIAGNOSTICIAN;
      else process.env.SPECSTRIDE_DIAGNOSTICIAN = before.DIAG;
      rmSync(root, { recursive: true, force: true });
    },
  };
}

test("CT-153-53 the checkpoint note stays out (T203)", async () => {
  const fx = microFixture();
  try {
    assert.equal(await runFeature({ argv: [], workdir: fx.dir }), 0);
    const critics = criticPromptsOf(fx.dir);
    assert.ok(critics.length >= 1, "the critic was called");
    for (const prompt of critics) {
      assert.ok(
        !prompt.includes("NOTE-153"),
        "no critic prompt holds the checkpoint note",
      );
    }
  } finally {
    fx.restore();
  }
});
