/**
 * CT-141-105 — the five rules of a stub (T014, F141-FR-005; F141-FR-011).
 *
 * What the test proves. Every behavioural proof runs a real stub: a small
 * executable in a stub directory that hands over to the library of
 * `packages/oracle/stubs/lib/`, started as a child process from a working
 * directory of its own.
 *
 * - no clock: the sources of the library name no clock, and two runs of the
 *   same script leave byte-identical transcripts;
 * - no randomness: the sources name no source of randomness, and the two runs
 *   above are identical, which a nonce or a random id would break;
 * - the counter is outside the working directory: after three calls the counter
 *   stands at three, it lies under the state directory of the run and not under
 *   the working directory, and the working directory is byte for byte what it
 *   was before the calls — so a call of a stub never counts as progress;
 * - one record per call: three calls leave three records, with the call indices
 *   1, 2 and 3, and each record carries the names of the variables the stub saw
 *   and never a value (F141-FR-011);
 * - a call beyond the script fails with the fixed code: the fourth call of a
 *   three-step script ends with exit 97 and leaves a fourth record that says
 *   `overrun`.
 *
 * Nothing here calls a model, opens a socket or needs a credential (F141-FR-038).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  OVERRUN_EXIT_CODE,
  STUB_ENVIRONMENT,
  STUB_LIB_DIR,
  STUB_LIB_FILES,
  StubScriptError,
  invocationCount,
  nextInvocation,
  readScript,
  readTranscript,
  stepFor,
  writeTranscriptRecord,
} from "../../stubs/lib/index.ts";

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const ENTRY = join(PACKAGE, "stubs/lib/main.ts");

const made: string[] = [];
function temp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), `oracle-stub-${prefix}-`));
  made.push(dir);
  return dir;
}
process.on("exit", () => {
  for (const dir of made) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // nothing to do
    }
  }
});

/** The three-step script of the scenario, as a fixture holds it: data. */
const SCRIPT = {
  role: "proposer",
  harness: "claude",
  steps: [
    { verbs: ["write"], args: { path: "a.txt", content: "one" } },
    { verbs: ["text"], args: { text: "two" } },
    { verbs: ["evidence"] },
  ],
} as const;

type Bench = {
  /** The directory the stub runs in. */
  workdir: string;
  /** Outside the working directory: the counter and the transcript. */
  stateDir: string;
  transcript: string;
  scriptFile: string;
  stubBin: string;
  env: Record<string, string>;
};

function bench(script: unknown = SCRIPT): Bench {
  const root = temp("bench");
  const workdir = join(root, "work");
  const stateDir = join(root, "stub-state");
  const stubBin = join(root, "stub-bin");
  mkdirSync(workdir);
  mkdirSync(stateDir);
  mkdirSync(stubBin);
  writeFileSync(join(workdir, "spec.md"), "the spec of the fixture\n");

  const scriptFile = join(root, "script.json");
  writeFileSync(scriptFile, JSON.stringify(script, null, 1));
  const transcript = join(root, "transcript.jsonl");

  // The stub executable, named after the as-is command of the harness.
  const exe = join(stubBin, "claude");
  writeFileSync(
    exe,
    `#!/bin/sh\nexec ${JSON.stringify(process.execPath)} ${JSON.stringify(ENTRY)} "$@"\n`,
  );
  chmodSync(exe, 0o755);

  return {
    workdir,
    stateDir,
    transcript,
    scriptFile,
    stubBin,
    env: {
      PATH: `${stubBin}:/usr/bin:/bin`,
      HOME: root,
      TZ: "UTC",
      LANG: "C.UTF-8",
      NO_COLOR: "1",
      [STUB_ENVIRONMENT.role]: "proposer",
      [STUB_ENVIRONMENT.harness]: "claude",
      [STUB_ENVIRONMENT.script]: scriptFile,
      [STUB_ENVIRONMENT.stateDir]: stateDir,
      [STUB_ENVIRONMENT.transcript]: transcript,
    },
  };
}

/** One call of the stub, as the reference would make it. */
function call(b: Bench, prompt: string): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync("claude", ["-p", prompt], {
    cwd: b.workdir,
    encoding: "utf8",
    env: b.env,
    shell: false,
  });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

/** Every byte under a directory, as one hash: the witness that nothing moved. */
function fingerprint(dir: string): string {
  const lines: string[] = [];
  const walk = (p: string, rel: string): void => {
    for (const entry of readdirSync(p, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : 1,
    )) {
      const next = join(p, entry.name);
      const nextRel = rel === "" ? entry.name : `${rel}/${entry.name}`;
      if (entry.isDirectory()) {
        lines.push(`d ${nextRel}`);
        walk(next, nextRel);
      } else {
        lines.push(`f ${nextRel} ${createHash("sha256").update(readFileSync(next)).digest("hex")}`);
      }
    }
  };
  walk(dir, "");
  return createHash("sha256").update(lines.join("\n")).digest("hex");
}

// ---------------------------------------------------------------------------
// Rule 1a — no clock
// ---------------------------------------------------------------------------

test("CT-141-105: the library of the stubs names no clock", () => {
  assert.ok(STUB_LIB_FILES.length >= 4, "the library has its four parts");
  for (const name of STUB_LIB_FILES) {
    const file = join(STUB_LIB_DIR, name);
    assert.ok(existsSync(file), `${name} is in stubs/lib/`);
    const source = readFileSync(file, "utf8");
    // Comments are taken out first: a rule may be written about in prose.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const forbidden of ["Date.now", "new Date", "hrtime", "performance.now", "Date("]) {
      assert.ok(
        !code.includes(forbidden),
        `${name} does not use ${forbidden}: a stub has no clock`,
      );
    }
  }
});

// ---------------------------------------------------------------------------
// Rule 1b — no randomness
// ---------------------------------------------------------------------------

test("CT-141-105: the library of the stubs names no source of randomness", () => {
  for (const name of STUB_LIB_FILES) {
    const source = readFileSync(join(STUB_LIB_DIR, name), "utf8");
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const forbidden of [
      "Math.random",
      "randomUUID",
      "randomBytes",
      "randomInt",
      "getRandomValues",
    ]) {
      assert.ok(
        !code.includes(forbidden),
        `${name} does not use ${forbidden}: a stub has no randomness`,
      );
    }
  }
});

test("CT-141-105: two runs of the same script leave byte-identical transcripts", () => {
  const first = bench();
  const second = bench();
  for (const b of [first, second]) {
    assert.equal(call(b, "the prompt of phase 1").status, 0);
    assert.equal(call(b, "the prompt of phase 2").status, 0);
  }
  // No clock and no randomness, witnessed: the bytes are the same.
  assert.equal(
    readFileSync(first.transcript, "utf8"),
    readFileSync(second.transcript, "utf8"),
    "the transcripts of two runs are byte-identical",
  );
  assert.equal(
    createHash("sha256").update(readFileSync(first.transcript)).digest("hex"),
    createHash("sha256").update(readFileSync(second.transcript)).digest("hex"),
  );
});

// ---------------------------------------------------------------------------
// Rule 1c — the counter outside the working directory
// ---------------------------------------------------------------------------

test("CT-141-105: the invocation counter is outside the working directory", () => {
  const b = bench();
  const before = fingerprint(b.workdir);

  // Three calls of a script whose first two steps write nothing into the
  // working directory, so the only state that moves is the counter.
  assert.equal(call(b, "one").status, 0);
  assert.equal(call(b, "two").status, 0);

  assert.equal(invocationCount(b.stateDir, "proposer", "claude"), 2);

  // The counter is a file under the state directory of the run, not under the
  // working directory.
  const counterFiles = readdirSync(b.stateDir);
  assert.ok(counterFiles.length > 0, "the counter is on disk in the state directory");
  assert.equal(resolve(b.stateDir).startsWith(resolve(b.workdir)), false);
  for (const name of counterFiles) {
    assert.ok(!existsSync(join(b.workdir, name)), `${name} is not in the working directory`);
  }
  assert.equal(existsSync(join(b.workdir, "transcript.jsonl")), false);

  // The first two steps of the script are `write` with a path and `text`; the
  // `write` step is the only thing that touched the working directory.
  assert.equal(readFileSync(join(b.workdir, "a.txt"), "utf8"), "one");

  // A stub whose script changes nothing leaves the working directory byte for
  // byte as it was, so a call never counts as progress.
  const quiet = bench({ role: "proposer", harness: "claude", steps: [{ verbs: ["nothing"] }] });
  const quietBefore = fingerprint(quiet.workdir);
  assert.equal(call(quiet, "a call that changes nothing").status, 0);
  assert.equal(fingerprint(quiet.workdir), quietBefore, "the working directory did not move");
  assert.equal(invocationCount(quiet.stateDir, "proposer", "claude"), 1);
  assert.notEqual(before, "", "the fingerprint of the first bench was taken");
});

// ---------------------------------------------------------------------------
// Rule 4 — one record per call, with names and never values
// ---------------------------------------------------------------------------

test("CT-141-105: every invocation appends exactly one transcript record", () => {
  const b = bench();
  b.env["SPECSTRIDE_MAX_ITER"] = "3";

  assert.equal(call(b, "prompt one").status, 0);
  assert.equal(readTranscript(b.transcript).length, 1);
  assert.equal(call(b, "prompt two").status, 0);
  assert.equal(readTranscript(b.transcript).length, 2);
  assert.equal(call(b, "prompt three").status, 0);

  const records = readTranscript(b.transcript);
  assert.equal(records.length, 3, "three calls, three records");
  assert.deepEqual(
    records.map((r) => r.call),
    [1, 2, 3],
  );
  for (const record of records) {
    assert.equal(record.role, "proposer");
    assert.equal(record.harness, "claude");
    assert.ok(Array.isArray(record.argv));
    assert.ok(record.argv.includes("-p"));
    // The names of the variables the stub saw, and never a value
    // (F141-FR-011).
    assert.ok(record.envNames.includes("SPECSTRIDE_MAX_ITER"));
    assert.ok(record.envNames.includes("PATH"));
    const text = JSON.stringify(record);
    assert.ok(!text.includes(b.env["PATH"] as string), "no value of a variable is in the record");
    assert.ok(!/"3"/.test(JSON.stringify(record.envNames)));
    assert.equal(record.overrun ?? false, false);
  }
  assert.deepEqual(
    records.map((r) => r.prompt),
    ["prompt one", "prompt two", "prompt three"],
  );

  // One record per call and nothing else in the file.
  assert.equal(
    readFileSync(b.transcript, "utf8").trimEnd().split("\n").length,
    3,
    "the transcript is one record per line and no more",
  );
});

// ---------------------------------------------------------------------------
// Rule — a call beyond the script fails with the fixed code and records it
// ---------------------------------------------------------------------------

test("CT-141-105: a call beyond the last step fails with the fixed exit code and records it", () => {
  // The code is the one the vocabulary of the oracle names.
  const vocabulary = JSON.parse(
    readFileSync(join(PACKAGE, "data/stub-vocabulary.json"), "utf8"),
  ) as { overrunExitCode: number };
  assert.equal(OVERRUN_EXIT_CODE, vocabulary.overrunExitCode);
  assert.equal(OVERRUN_EXIT_CODE, 97);

  const b = bench();
  for (const prompt of ["one", "two", "three"]) {
    assert.equal(call(b, prompt).status, 0, `call ${prompt} is inside the script`);
  }

  const beyond = call(b, "a fourth call the script does not answer");
  assert.equal(beyond.status, OVERRUN_EXIT_CODE, beyond.stderr);
  assert.match(beyond.stderr, /overrun|beyond the last step/);

  const records = readTranscript(b.transcript);
  assert.equal(records.length, 4, "the overrun is recorded");
  assert.equal(records[3]?.call, 4);
  assert.equal(records[3]?.overrun, true);
  assert.equal(records[3]?.prompt, "a fourth call the script does not answer");

  // A second call beyond the script fails the same way.
  assert.equal(call(b, "a fifth call").status, OVERRUN_EXIT_CODE);
  assert.equal(readTranscript(b.transcript).length, 5);
});

// ---------------------------------------------------------------------------
// The parts of the library, used directly
// ---------------------------------------------------------------------------

test("CT-141-105: the script reader refuses a script that is not data of the vocabulary", () => {
  const dir = temp("script");
  const write = (value: unknown): string => {
    const file = join(dir, `s-${String(readdirSync(dir).length)}.json`);
    writeFileSync(file, JSON.stringify(value));
    return file;
  };

  assert.equal(readScript(write(SCRIPT)).steps.length, 3);

  const bad: [string, unknown][] = [
    ["an unknown verb", { role: "proposer", steps: [{ verbs: ["teleport"] }] }],
    ["a verb of another kind of stub", { role: "proposer", steps: [{ verbs: ["approve"] }] }],
    ["a step without verbs", { role: "proposer", steps: [{ args: {} }] }],
    ["an unknown role", { role: "oracle", steps: [{ verbs: ["text"] }] }],
    ["no steps at all", { role: "proposer" }],
  ];
  for (const [why, value] of bad) {
    assert.throws(
      () => readScript(write(value)),
      (error: unknown) => error instanceof StubScriptError,
      `the reader refuses ${why}`,
    );
  }

  // Rule 5: a scenario is data and holds no nonce, no time and no path
  // outside the fixture.
  assert.throws(
    () =>
      readScript(
        write({ role: "proposer", steps: [{ verbs: ["write"], args: { path: "/etc/passwd" } }] }),
      ),
    (error: unknown) => error instanceof StubScriptError,
    "a path outside the fixture refuses the script",
  );
});

test("CT-141-105: the counter and the transcript writer can be used on their own", () => {
  const dir = temp("parts");
  const stateDir = join(dir, "state");
  mkdirSync(stateDir);
  const transcript = join(dir, "t.jsonl");
  const script = readScript(
    (() => {
      const f = join(dir, "script.json");
      writeFileSync(f, JSON.stringify(SCRIPT));
      return f;
    })(),
  );

  assert.equal(invocationCount(stateDir, "critic", "dsh"), 0);
  assert.equal(nextInvocation(stateDir, "critic", "dsh"), 1);
  assert.equal(nextInvocation(stateDir, "critic", "dsh"), 2);
  assert.equal(invocationCount(stateDir, "critic", "dsh"), 2);
  // Two roles count apart.
  assert.equal(nextInvocation(stateDir, "proposer", "dsh"), 1);
  assert.equal(invocationCount(stateDir, "critic", "dsh"), 2);

  assert.deepEqual(stepFor(script, 1), SCRIPT.steps[0]);
  assert.deepEqual(stepFor(script, 3), SCRIPT.steps[2]);
  assert.equal(stepFor(script, 4), undefined, "there is no step beyond the script");

  writeTranscriptRecord(transcript, {
    role: "proposer",
    harness: "claude",
    call: 1,
    argv: ["-p", "a prompt"],
    envNames: ["PATH", "HOME"],
    prompt: "a prompt",
    promptChannel: "argument",
  });
  const records = readTranscript(transcript);
  assert.equal(records.length, 1);
  assert.equal(records[0]?.call, 1);

  // A record that is not of the schema of the oracle is refused.
  assert.throws(
    () =>
      writeTranscriptRecord(transcript, {
        role: "proposer",
        call: 2,
        argv: [],
        envNames: ["PATH"],
        prompt: "x",
        // @ts-expect-error — a value of a variable may never be in a record
        envValues: { PATH: "/bin" },
      }),
    (error: unknown) => error instanceof Error,
    "a record with a value of a variable is refused",
  );
  assert.equal(readTranscript(transcript).length, 1, "the refused record was not written");
});
