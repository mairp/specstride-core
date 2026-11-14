/**
 * The composition root of `specstride run`, with a stub of the `claude`
 * executable: an honest phase is approved, signed, ticked and committed; a
 * rejected phase ends at the reject limit with no approval and no commit; a
 * second run over approved phases does nothing.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
import test from "node:test";

import { runFeature } from "../../src/engine/run-feature.ts";
import { controlRootOfWorkspace } from "../../src/engine/workspace-control-root.ts";
import { pinEngineEnv } from "./helpers/fixture.ts";

const STUB = (verdict: string): string => `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (prompt.includes("Diagnostician")) {
  // A call of the diagnostician: no nonce, no verdict; the case and the hint.
  fs.writeFileSync("seen-by-diagnostician.txt", prompt);
  console.log(JSON.stringify({ type: "result", result: "CASE: GROUNDING\\nName the missing test of T001." }));
} else if (critic) {
  fs.writeFileSync("seen-by-critic.txt", prompt);
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": ${verdict}" }));
} else {
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

function fixture(verdict: string): { readonly dir: string; readonly restore: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "specstride-run-"));
  const bin = join(dir, "bin");
  const work = join(dir, "work");
  mkdirSync(bin);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  writeFileSync(join(bin, "claude"), STUB(verdict));
  chmodSync(join(bin, "claude"), 0o755);
  writeFileSync(
    join(work, "specs", "001-one", "tasks.md"),
    "# Tasks\n\n## Phase 1: One\n\n- [ ] T001 Do it\n",
  );
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
  };
  process.env.HOME = dir;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  // A leaked launch environment (SPECSTRIDE_FEATURE, a dsh: proposer or
  // critic of the engine's own run, `SPECSTRIDE_LIMITS=off`, `STUB_DIR`)
  // would point the run away from this fixture's stub or its bounds, so the
  // shared helper pins and restores all of it.
  const restoreEnv = pinEngineEnv({ feature: "001-one" });
  return {
    dir: work,
    restore: () => {
      restoreEnv();
      process.env.HOME = before.HOME;
      process.env.PATH = before.PATH;
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

const commits = (dir: string): number =>
  Number(spawnSync("git", ["-C", dir, "rev-list", "--count", "HEAD"], { encoding: "utf8" }).stdout);

test("an approved phase is ticked and committed, and a second run does nothing", async () => {
  const { dir, restore } = fixture("APPROVED");
  try {
    assert.equal(await runFeature({ argv: [], workdir: dir }), 0);
    assert.equal(commits(dir), 2);
    assert.match(readFileSync(join(dir, "specs", "001-one", "tasks.md"), "utf8"), /- \[x\] T001/);
    assert.equal(await runFeature({ argv: [], workdir: dir }), 0);
    assert.equal(commits(dir), 2);
  } finally {
    restore();
  }
});

test("a rejected phase ends at the reject limit with no approval and no commit", async () => {
  const { dir, restore } = fixture("REJECTED");
  try {
    assert.equal(await runFeature({ argv: [], workdir: dir }), 2);
    assert.equal(commits(dir), 1);
    assert.equal(existsSync(join(dir, "made.txt")), true);
    // The stub pass ticked the file; only an approval may, so the engine put it back.
    assert.match(readFileSync(join(dir, "specs", "001-one", "tasks.md"), "utf8"), /- \[ \] T001/);
  } finally {
    restore();
  }
});

test("the state directory is not committed", async () => {
  const { dir, restore } = fixture("APPROVED");
  try {
    assert.equal(await runFeature({ argv: [], workdir: dir }), 0);
    const files = spawnSync("git", ["-C", dir, "show", "--name-only", "--format=", "HEAD"], {
      encoding: "utf8",
    }).stdout;
    assert.match(files, /made\.txt/);
    assert.match(files, /newdir\/inside\.txt/);
    assert.doesNotMatch(files, /\.specstride/);
    assert.equal(
      spawnSync("git", ["-C", dir, "status", "--porcelain"], { encoding: "utf8" }).stdout,
      "",
    );
  } finally {
    restore();
  }
});

test("a run with a blocked commit exits 1 and says so on the digest and the console", async () => {
  const { dir, restore } = fixture("APPROVED");
  // A hit the gate never excuses: an address with embedded credentials, which
  // the narrowed url-embedded-credentials pattern still matches. The stub text
  // is assembled at runtime so THIS file's own diff carries no contiguous
  // credential address: the commit gate of the campaign that runs this suite
  // would otherwise hold the approval commit itself back
  // (cg-url-embedded-credentials). The stub file still receives the exact
  // bytes the inner gate is meant to trip on.
  process.env.STUB_NEW_FILE = ['const u = "https', '://user:pass@host";'].join("");
  // The as-is behaviour this test pins (the exit-1 rule of 2026-11-04, part A
  // item 2) is now the switch-off behaviour of feature 152 (F152-FR-022,
  // CQ-152-05 A): with the switch off the run goes on and exits 1,
  // byte-identically. The switch-on halt is CT-152-6's, in
  // commit-gate-halt.test.ts.
  process.env.SPECSTRIDE_COMMIT_BACKPRESSURE = "off";
  const chunks: string[] = [];
  const originalWrite = process.stdout.write;
  // The collector passes every chunk through to the real stdout as well: the
  // test runner reports results on the same stream, and a silent interception
  // would swallow the result line of the test before this one, so the runner
  // would count one test fewer.
  process.stdout.write = ((chunk: unknown): boolean => {
    if (typeof chunk === "string") chunks.push(chunk);
    return originalWrite.call(process.stdout, chunk);
  }) as typeof process.stdout.write;
  try {
    assert.equal(await runFeature({ argv: [], workdir: dir }), 1);
    const out = chunks.join("");
    assert.equal(commits(dir), 1, "the init commit only: the blocked commit is not made");
    // The console says so plainly, in one line, with the exit it ended on.
    assert.match(
      out,
      /1 commit\(s\) were blocked by the secret gate; the work of those phases stays uncommitted — the run exits 1, not 0/,
    );
    // And the digest carries the non-zero exit beside the count.
    assert.match(out, /DIGEST exit=1 stop=none cost_usd=\d+\.\d+ commits_blocked=1 run=run-/);
  } finally {
    process.stdout.write = originalWrite;
    delete process.env.STUB_NEW_FILE;
    delete process.env.SPECSTRIDE_COMMIT_BACKPRESSURE;
    restore();
  }
});

// REGRESSION — `specstride stop` on a SEQUENTIAL run. The inbox request was
// read by the parallel group only, so a classic run never stopped: it went
// on to the critic and to the next phase as if nothing had been asked.
test("a stop request ends a sequential run exit 6 before any pass, and is consumed", async () => {
  const { dir, restore } = fixture("APPROVED");
  try {
    const inbox = join(controlRootOfWorkspace(dir), "inbox");
    mkdirSync(inbox, { recursive: true });
    const request = join(inbox, "stop.request");
    writeFileSync(
      request,
      JSON.stringify({ schema: "specstride.inbox/1", type: "stop", at: new Date().toISOString() }),
    );
    assert.equal(await runFeature({ argv: [], workdir: dir }), 6);
    assert.equal(existsSync(request), false, "the request is removed first, so a rerun goes on");
    assert.equal(existsSync(join(dir, "made.txt")), false, "no pass ran");
    assert.equal(commits(dir), 1);
    assert.equal(await runFeature({ argv: [], workdir: dir }), 0);
    assert.equal(commits(dir), 2);
  } finally {
    restore();
  }
});

test("a secret in the change blocks the commit and is not shown to the critic", async () => {
  const { dir, restore } = fixture("APPROVED");
  const secret = `ghp_${"a1B2c3D4e5".repeat(4)}`;
  process.env.STUB_NEW_FILE = `token=${secret}\\n`;
  // The stub plants the secret on every attempt, so with the switch on the
  // gate would block every attempt and the run would end at the reject limit.
  // This test pins the switch-off behaviour (F152-FR-022), so it runs with the
  // switch off, like the sibling test below.
  const beforeSwitch = process.env.SPECSTRIDE_COMMIT_BACKPRESSURE;
  process.env.SPECSTRIDE_COMMIT_BACKPRESSURE = "off";
  try {
    // The run still approves the phase, and its commit stays blocked — so the
    // run no longer exits 0: its work sits uncommitted. Owner ruling
    // 2026-11-04 (commit-gate false positive), part A item 2; this test is the
    // pin of exit 0 with a blocked commit that the ruling replaces.
    assert.equal(await runFeature({ argv: [], workdir: dir }), 1);
    assert.equal(commits(dir), 1);
    assert.doesNotMatch(readFileSync(join(dir, "seen-by-critic.txt"), "utf8"), new RegExp(secret));
    assert.match(readFileSync(join(dir, "seen-by-critic.txt"), "utf8"), /--- new file made\.txt/);
  } finally {
    delete process.env.STUB_NEW_FILE;
    if (beforeSwitch === undefined) delete process.env.SPECSTRIDE_COMMIT_BACKPRESSURE;
    else process.env.SPECSTRIDE_COMMIT_BACKPRESSURE = beforeSwitch;
    restore();
  }
});

// REGRESSION — the diff a critic prompt is grounded on is source. The
// key-name-then-value rule of the baseline cannot tell a type annotation
// (`token: string`) from a secret assignment, so the served diff reached the
// critic as placeholder marks and broken signatures, and the critic rejected
// work the gate had passed ("placeholders and invalid function signatures",
// a real campaign, 2026-11-13). The prompt's diff section now runs the source
// scope: the shaped secrets still go, identifiers survive.
test("a type annotation in the change reaches the critic unmangled, a shaped secret does not", async () => {
  const { dir, restore } = fixture("APPROVED");
  const secret = `ghp_${"a1B2c3D4e5".repeat(4)}`;
  process.env.STUB_NEW_FILE = [
    "export function cursorToken(cursor: unknown, token: string): string {",
    '  const token = read(view).cursorTokens[0] ?? "";',
    "  return token;",
    "}",
    `const leaked = "${secret}";`,
  ].join("\n");
  // The planted shaped secret keeps the scan before a commit on (the backstop
  // of the sibling test), so the run approves the phase and its commit stays
  // blocked: exit 1, one commit — the pin of this test is the PROMPT.
  const beforeSwitch = process.env.SPECSTRIDE_COMMIT_BACKPRESSURE;
  process.env.SPECSTRIDE_COMMIT_BACKPRESSURE = "off";
  try {
    assert.equal(await runFeature({ argv: [], workdir: dir }), 1);
    assert.equal(commits(dir), 1);
    const seen = readFileSync(join(dir, "seen-by-critic.txt"), "utf8");
    // The grounding survives verbatim: the annotation, the assignment, the
    // signature the critic has to judge.
    assert.match(seen, /cursorToken\(cursor: unknown, token: string\): string/);
    assert.match(seen, /const token = read\(view\)\.cursorTokens\[0\]/);
    // The shaped secret does not: the source scope is not an open door.
    assert.doesNotMatch(seen, new RegExp(secret));
  } finally {
    delete process.env.STUB_NEW_FILE;
    if (beforeSwitch === undefined) delete process.env.SPECSTRIDE_COMMIT_BACKPRESSURE;
    else process.env.SPECSTRIDE_COMMIT_BACKPRESSURE = beforeSwitch;
    restore();
  }
});

// REGRESSION — one claude session per PASS. The stub refuses a session id it
// has seen, as `claude --session-id` does ("Session ID … is already in use"),
// and writes the phase evidence only on its SECOND proposer pass. With one id
// per attempt, pass 2 failed at once, the error breaker ended the loop and
// the phase halted with no evidence (mairp.ai, 2026-11-10).
test("every proposer pass gets its own claude session id", async () => {
  const { dir, restore } = fixture("APPROVED");
  try {
    const stub = join(dir, "..", "bin", "claude");
    const original = readFileSync(stub, "utf8");
    writeFileSync(
      stub,
      original.replace(
        'const critic = argv.includes("--max-turns");',
        `const critic = argv.includes("--max-turns");
const seenFile = path.join(${JSON.stringify(join(dir, ".."))}, "sessions-seen.txt");
const seen = fs.existsSync(seenFile) ? fs.readFileSync(seenFile, "utf8").split("\\n") : [];
if (seen.includes(session)) { console.error("Error: Session ID " + session + " is already in use."); process.exit(1); }
fs.appendFileSync(seenFile, session + "\\n");
const passFile = path.join(${JSON.stringify(join(dir, ".."))}, "proposer-passes.txt");
if (!critic && !prompt.includes("Diagnostician")) {
  const n = (fs.existsSync(passFile) ? Number(fs.readFileSync(passFile, "utf8")) : 0) + 1;
  fs.writeFileSync(passFile, String(n));
  if (n === 1) { console.log(JSON.stringify({ type: "result", result: "not done yet" })); process.exit(0); }
}`,
      ),
    );
    assert.equal(await runFeature({ argv: [], workdir: dir }), 0);
    assert.equal(readFileSync(join(dir, "..", "proposer-passes.txt"), "utf8"), "2");
    assert.equal(commits(dir), 2);
  } finally {
    restore();
  }
});
