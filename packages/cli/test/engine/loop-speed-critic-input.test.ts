/**
 * The input of the critic prompt (feature 153, user story 4, F153-FR-050):
 * no critic-class input carries the output the engine's own check produced,
 * in any captured shape — the block `# The check the engine ran itself` is
 * gone from the prompt (T181), the variable that captured the output is gone
 * (T182), and the prompt is stable across runs that reached the same tree by
 * different gate histories (F153-SC-010). The guards hold: the fact block of
 * the micro layer still reaches the critic, and the corrective block of the
 * commit gate never does.
 *
 * CT-153-50, F153-SC-010, CT-153-28.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { runFeature } from "../../src/engine/run-feature.ts";
import { fixture } from "./loop-speed-helpers.ts";

/** The heading the removed block carried (T181). */
const CHECK_HEADING = "# The check the engine ran itself";

/** A critic prompt of `prompts.jsonl`, as the stub `claude` records it. */
type Prompt = { role: string; prompt: string };

const criticPromptsOf = (dir: string): Prompt[] =>
  readFileSync(join(dir, "prompts.jsonl"), "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as Prompt)
    .filter((entry) => entry.role === "critic");

/**
 * The declared check of a workspace, as one `node -e` line: the engine's
 * gate runs `npm test`, which runs this.
 */
const testScript = (code: string): string =>
  JSON.stringify({ scripts: { test: `node -e ${JSON.stringify(code)}` } });

/**
 * F153-SC-010 — strip what may differ between two honest runs: the nonce of
 * the call (F100-FR-139), the boundary token of the framing, and the pin
 * block of the verdicts a previous attempt pinned. Everything else must be
 * byte-identical.
 */
const normalisedCriticPrompt = (prompt: string): string =>
  prompt
    .replace(/VERDICT [0-9a-f]+:/g, "VERDICT <nonce>:")
    .replace(/SPECSTRIDE-OUTSIDE-[0-9a-f]+/g, "<boundary>")
    .replace(/attempt:(\d+):\d+:grounding/g, "attempt:$1:<ordinal>:grounding")
    // The pin block stands between the change section and the end marker.
    .replace(/\nPREVIOUSLY CONFIRMED \(W9 verdict pins\)[\s\S]*?(?=\n# End of the data)/, "");

test("CT-153-50 no check output reaches any critic prompt (T177)", async () => {
  const fx = fixture({
    verdicts: "APPROVED",
    files: {
      "package.json": testScript("console.log('MARKER-OUTPUT-153');"),
    },
  });
  const off = process.env.SPECSTRIDE_DIAGNOSTICIAN;
  process.env.SPECSTRIDE_DIAGNOSTICIAN = "off";
  try {
    assert.equal(await runFeature({ argv: [], workdir: fx.dir }), 0);
    const critics = criticPromptsOf(fx.dir);
    assert.ok(critics.length >= 1, "the critic was called");
    for (const entry of critics) {
      assert.ok(
        !entry.prompt.includes("MARKER-OUTPUT-153"),
        "no critic prompt quotes the output of the check",
      );
      assert.ok(
        !entry.prompt.includes(CHECK_HEADING),
        "no critic prompt carries the removed check-output heading",
      );
    }
  } finally {
    if (off === undefined) delete process.env.SPECSTRIDE_DIAGNOSTICIAN;
    else process.env.SPECSTRIDE_DIAGNOSTICIAN = off;
    fx.restore();
  }
});

test("F153-SC-010 the same tree gives the same critic prompt (T178)", async () => {
  // Both runs reach the same final tree: the stub proposer writes the same
  // files, and each declared check leaves the same `.gate-marker` behind —
  // one run green on attempt 1, the other red on attempt 1 (a different
  // check output, a rejection) and green on attempt 2.
  const GREEN =
    "const fs=require('fs');fs.writeFileSync('.gate-marker','x');console.log('MARKER-OUTPUT-GREEN');process.exit(0);";
  const RED_THEN_GREEN =
    "const fs=require('fs');" +
    "if(fs.existsSync('.gate-marker')){console.log('MARKER-OUTPUT-GREEN');process.exit(0);}" +
    "fs.writeFileSync('.gate-marker','x');console.log('MARKER-OUTPUT-RED');process.exit(1);";
  // The stub's own traces (`seen-by-critic.txt`, `critic-calls.txt`) sit in
  // the working directory: ignored, so they are no part of the change block
  // either run's critic prompt quotes (the trace of an earlier call carries
  // an earlier nonce, which would poison the run that follows a rejection).
  const ignore = { ".gitignore": "seen-by-critic.txt\ncritic-calls.txt\nprompts.jsonl\n" };
  const off = process.env.SPECSTRIDE_DIAGNOSTICIAN;
  process.env.SPECSTRIDE_DIAGNOSTICIAN = "off";
  // One fixture at a time: a fixture puts its stub `claude` first on `PATH`
  // and its HOME in the environment, so two live fixtures would answer each
  // other's runs with the wrong stub.
  let green: Prompt[] = [];
  let red: Prompt[] = [];
  try {
    const greenFx = fixture({
      verdicts: "APPROVED",
      files: { ...ignore, "package.json": testScript(GREEN) },
    });
    try {
      assert.equal(await runFeature({ argv: [], workdir: greenFx.dir }), 0);
      green = criticPromptsOf(greenFx.dir);
    } finally {
      greenFx.restore();
    }
    const redFx = fixture({
      verdicts: ["REJECTED", "APPROVED"],
      files: { ...ignore, "package.json": testScript(RED_THEN_GREEN) },
    });
    try {
      assert.equal(await runFeature({ argv: [], workdir: redFx.dir }), 0);
      red = criticPromptsOf(redFx.dir);
    } finally {
      redFx.restore();
    }
    assert.equal(green.length, 1, "the green run called the critic once");
    assert.ok(red.length >= 2, "the red run called the critic on both attempts");
    const left = normalisedCriticPrompt(green[0]!.prompt);
    const right = normalisedCriticPrompt(red[1]!.prompt);
    assert.equal(left, right, "the prompts agree but for nonce, boundary token and pins");
  } finally {
    if (off === undefined) delete process.env.SPECSTRIDE_DIAGNOSTICIAN;
    else process.env.SPECSTRIDE_DIAGNOSTICIAN = off;
  }
});

test("the units the runtime checked still reach the critic as facts (T179)", async () => {
  const fx = microFixture(
    // Pass 1: one checked unit of work. Pass 2: the phase evidence.
    `if (passes === 1) {
    ${CHECKPOINT("u1", "T001")}
    fs.writeFileSync("made-1.txt", "one\\n");
    console.log(JSON.stringify({ type: "result", result: "unit one" }));
  } else {
    ${WRITE_EVIDENCE}
  }`,
  );
  try {
    assert.equal(await runFeature({ argv: [], workdir: fx.dir }), 0);
    const prompt = readFileSync(join(fx.dir, "seen-by-critic.txt"), "utf8");
    assert.ok(
      prompt.includes("# The units of work the runtime checked (facts, not claims)"),
      "the fact block is in the critic prompt",
    );
    assert.ok(!prompt.includes(CHECK_HEADING));
    assert.ok(!prompt.includes("MARKER-OUTPUT-153"));
  } finally {
    fx.restore();
  }
});

test("CT-153-28 no pre-critic result either", async () => {
  // T180 named the commit-time scan; T359 extends the same guard to the
  // pre-critic scan of F153-FR-024: after a pre-critic block, no critic
  // prompt of a later attempt holds a rule id, a path of a hit, or the
  // corrective block (F153-FR-028).
  const fx = commitGateFixture("secret-removed-on-retry");
  try {
    assert.equal(await runFeature({ argv: [], workdir: fx.dir }), 0);
    const criticFiles = readdirSync(fx.scratch).filter((name) =>
      name.startsWith("seen-by-critic-"),
    );
    // F153-FR-024: the pre-critic scan blocks attempt 1 with ZERO critic
    // calls, so only the later attempt reaches the critic (T180, T359).
    assert.ok(
      criticFiles.length >= 1,
      "the attempt after the pre-critic block reached the critic",
    );
    // The corrective block's nonce, from the block record of attempt 1
    // (the same record CT-152-9 reads): part of the corrective block, so
    // absent from every critic prompt too.
    const blockRecord = JSON.parse(
      readFileSync(fx.control("commit-gate", "phase1.1.block.json"), "utf8"),
    ) as { nonce: string };
    assert.ok(blockRecord.nonce.length >= 8, "the block record carries a nonce");
    for (const name of criticFiles) {
      const prompt = readFileSync(join(fx.scratch, name), "utf8");
      assert.ok(!/cg-[a-z0-9-]+/.test(prompt), `${name} holds no cg- rule id`);
      // The path of the hit: the fixture plants the credential in
      // `creds.txt` on attempt 1 (the file the pre-critic scan blocks on),
      // so no critic prompt may name it (F153-FR-028).
      assert.ok(!prompt.includes("creds.txt"), `${name} holds no path of a hit`);
      assert.ok(
        !prompt.includes(blockRecord.nonce),
        `${name} holds no nonce of the corrective block`,
      );
      assert.ok(
        !prompt.includes(
          "# Phase 1 — attempt 1 was not approved: the commit gate blocked the approval commit",
        ),
        `${name} holds no corrective block`,
      );
    }
  } finally {
    fx.restore();
  }
});

/** The checkpoint a proposer pass writes (feature 115's outbox contract). */
const CHECKPOINT = (unitId: string, taskId: string): string =>
  `const outbox = ".specstride/features/001-one/outbox";` +
  `  fs.mkdirSync(outbox, { recursive: true });` +
  `  fs.writeFileSync(path.join(outbox, "${unitId}.checkpoint.json"),` +
  `    JSON.stringify({ schema: "specstride.checkpoint/1", tasks: ["${taskId}"] }));`;

const WRITE_EVIDENCE = `const evidence = /write (\\.specstride\\S+?):/.exec(prompt)[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  const tasks = "specs/001-one/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replace("[ ]", "[x]"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));`;

/** A micro-layer workspace whose stub `claude` follows the pass script. */
function microFixture(passScript: string): {
  readonly dir: string;
  readonly restore: () => void;
} {
  const dir = mkdtempSync(join(tmpdir(), "specstride-critic-input-"));
  const bin = join(dir, "bin");
  const work = join(dir, "work");
  mkdirSync(bin);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  const stub = `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (critic) {
  fs.writeFileSync("seen-by-critic.txt", prompt);
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  const passes = Number(fs.existsSync("pass-count.txt") ? fs.readFileSync("pass-count.txt", "utf8") : "0") + 1;
  fs.writeFileSync("pass-count.txt", String(passes));
  ${passScript}
}
`;
  writeFileSync(join(bin, "claude"), stub);
  chmodSync(join(bin, "claude"), 0o755);
  writeFileSync(
    join(work, "specs", "001-one", "tasks.md"),
    "# Tasks\n\n## Phase 1: One\n\n- [ ] T001 Do it\n",
  );
  writeFileSync(join(work, "package.json"), JSON.stringify({ scripts: { test: "node test.js" } }));
  writeFileSync(join(work, "test.js"), "process.exit(0);\n");
  for (const argv of [
    ["init", "-q"],
    ["config", "user.email", "t@t"],
    ["config", "user.name", "t"],
    ["add", "-A"],
    ["commit", "-qm", "init"],
  ]) {
    spawnSync("git", ["-C", work, ...argv]);
  }
  const before = { HOME: process.env.HOME, PATH: process.env.PATH, FEATURE: process.env.SPECSTRIDE_FEATURE };
  process.env.HOME = dir;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  delete process.env.SPECSTRIDE_FEATURE;
  return {
    dir: work,
    restore: () => {
      process.env.HOME = before.HOME;
      process.env.PATH = before.PATH;
      if (before.FEATURE === undefined) delete process.env.SPECSTRIDE_FEATURE;
      else process.env.SPECSTRIDE_FEATURE = before.FEATURE;
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/**
 * A commit-gate workspace: the tasks.md of the fixture, its stub `claude` on
 * `PATH`, a git repository with one init commit (commit-gate-retry.test.ts's
 * `fixture`, trimmed to what the critic-prompt guard reads).
 */
function commitGateFixture(name: string): {
  readonly dir: string;
  readonly scratch: string;
  readonly control: (...parts: string[]) => string;
  readonly restore: () => void;
} {
  const source = join(import.meta.dirname, "..", "fixtures", "commit-gate", name);
  const dir = mkdtempSync(join(tmpdir(), "specstride-critic-input-cg-"));
  const bin = join(dir, "bin");
  const work = join(dir, "work");
  const scratch = join(dir, "scratch");
  mkdirSync(bin);
  mkdirSync(scratch);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  copyFileSync(join(source, "tasks.md"), join(work, "specs", "001-one", "tasks.md"));
  writeFileSync(join(work, "package.json"), JSON.stringify({ scripts: { test: 'node -e ""' } }));
  copyFileSync(join(source, "stub-claude"), join(bin, "claude"));
  chmodSync(join(bin, "claude"), 0o755);
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
    SECRET: process.env.STUB_SECRET,
    PROPOSER: process.env.SPECSTRIDE_PROPOSER,
    CRITIC: process.env.SPECSTRIDE_CRITIC,
    PAUSE: process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC,
    STUB_DIR: process.env.STUB_DIR,
  };
  process.env.HOME = dir;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  process.env.SPECSTRIDE_FEATURE = "001-one";
  process.env.STUB_SECRET = `ghp_${"a1b2c3d4e5f6".repeat(3)}`;
  process.env.SPECSTRIDE_PROPOSER = "claude";
  process.env.SPECSTRIDE_CRITIC = "claude";
  process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = "0";
  process.env.STUB_DIR = scratch;
  // The workspace's control plane lives under HOME, keyed by the hash of the
  // workdir (commit-gate-retry.test.ts's layout).
  const controlRoot = join(
    dir,
    ".specstride",
    "workspaces",
    createHash("sha256").update(work).digest("hex").slice(0, 16),
  );
  return {
    dir: work,
    scratch,
    control: (...parts: string[]): string => join(controlRoot, ...parts),
    restore: () => {
      process.env.HOME = before.HOME;
      process.env.PATH = before.PATH;
      if (before.FEATURE === undefined) delete process.env.SPECSTRIDE_FEATURE;
      else process.env.SPECSTRIDE_FEATURE = before.FEATURE;
      if (before.SECRET === undefined) delete process.env.STUB_SECRET;
      else process.env.STUB_SECRET = before.SECRET;
      if (before.PROPOSER === undefined) delete process.env.SPECSTRIDE_PROPOSER;
      else process.env.SPECSTRIDE_PROPOSER = before.PROPOSER;
      if (before.CRITIC === undefined) delete process.env.SPECSTRIDE_CRITIC;
      else process.env.SPECSTRIDE_CRITIC = before.CRITIC;
      if (before.PAUSE === undefined) delete process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC;
      else process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = before.PAUSE;
      if (before.STUB_DIR === undefined) delete process.env.STUB_DIR;
      else process.env.STUB_DIR = before.STUB_DIR;
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
