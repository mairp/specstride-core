/**
 * CT-141-107 — the proposer stub (T027, T039; F141-FR-007).
 *
 * What the test proves. The behavioural half runs the REAL stub executable
 * `packages/oracle/stubs/bin/dsh` as a child process, with the environment of a
 * run and a script that is data, and reads the effect back off disk through a path
 * the stub never touched.
 *
 * - **exactly the eleven verbs**: the set is the eleven of
 *   `packages/oracle/data/stub-vocabulary.json`, read back off disk here, and a
 *   twelfth is refused by the script reader before the stub does anything;
 * - **no verb declares a unit of work or writes a checkpoint**: the two things a
 *   proposer of the product does and the stub must not — a declaration of a unit of
 *   work and a checkpoint — are named, and none of them is a verb;
 * - **the argument `state` of `write` changes a file of state by its LOGICAL
 *   name**: the same script, run with the map of the reference and with the map of
 *   the port, changes two DIFFERENT physical files — the as-is path on the
 *   reference, the path of the layout tables on the port — and the content is
 *   identical. The effect is witnessed by reading each file off disk and hashing
 *   it; neither path is in the script.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PROPOSER_VERBS,
  PROPOSER_VERB_COUNT,
  ProposerStubError,
  VERBS_A_PROPOSER_STUB_NEVER_HAS,
  assertNoUnitOfWorkVerb,
  carryOutProposerStep,
  evidencePathFromPrompt,
  proposerContext,
} from "../../stubs/lib/proposer.ts";
import { HARNESS_ENVIRONMENT } from "../../stubs/lib/harness.ts";
import {
  STATE_PATH_VARIABLE,
  resolveStateFile,
  StatePathError,
} from "../../stubs/lib/state-paths.ts";
import { StubScriptError, readScript } from "../../stubs/lib/script.ts";
import { readTranscript } from "../../stubs/lib/transcript.ts";
import { STUB_BIN_DIR } from "../../stubs/lib/bin-files.ts";

const PACKAGE = resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
const VOCABULARY = JSON.parse(readFileSync(join(PACKAGE, "data/stub-vocabulary.json"), "utf8")) as {
  kinds: Record<string, { verbs: string[]; arguments?: Record<string, Record<string, unknown>> }>;
};

/** The logical name of the file of state the script changes. */
const LOGICAL = "<workspace-part>/features/<slug>/PROGRESS.md";

/** Where that file lies on each side: the as-is path, and the path of feature 100. */
const PHYSICAL = {
  reference: join(".specstride", "features", "001-greeting", "PROGRESS.md"),
  port: join(".specstride", "workspace", "features", "001-greeting", "progress.md"),
};

/** Drive the real `dsh` stub once, for one side, and give back what it left. */
function driveTheStub(side: "reference" | "port"): {
  readonly exitCode: number;
  readonly stateFile: string;
  readonly workdir: string;
  readonly transcript: string;
} {
  const root = mkdtempSync(join(tmpdir(), `oracle-proposer-${side}-`));
  const workdir = join(root, "work");
  const stateDir = join(root, "stub-state");
  const scriptDir = join(root, "stub-scripts");
  for (const dir of [workdir, stateDir, scriptDir]) mkdirSync(dir, { recursive: true });

  // The script is DATA and holds the logical name, never a path.
  writeFileSync(
    join(scriptDir, "proposer.json"),
    JSON.stringify({
      steps: [
        {
          verbs: ["write", "evidence"],
          args: {
            state: LOGICAL,
            content: "the notes of the pass\n",
            evidence: "gates/GATE1-EVIDENCE.md",
          },
        },
      ],
    }),
    "utf8",
  );
  assert.ok(!readFileSync(join(scriptDir, "proposer.json"), "utf8").includes(workdir));

  // The map the oracle resolved for THIS side.
  const stateFile = join(workdir, PHYSICAL[side]);
  const mapFile = join(root, "state-paths.json");
  writeFileSync(mapFile, JSON.stringify({ [LOGICAL]: stateFile }), "utf8");

  const transcript = join(root, "transcript.jsonl");
  const result = spawnSync(join(STUB_BIN_DIR, "dsh"), ["--profile", "headless", "the prompt"], {
    cwd: workdir,
    encoding: "utf8",
    env: {
      PATH: `${STUB_BIN_DIR}:/usr/bin:/bin`,
      HOME: root,
      [HARNESS_ENVIRONMENT.scriptDir]: scriptDir,
      [HARNESS_ENVIRONMENT.stateDir]: stateDir,
      [HARNESS_ENVIRONMENT.transcript]: transcript,
      [HARNESS_ENVIRONMENT.fixtureDir]: root,
      [STATE_PATH_VARIABLE]: mapFile,
    },
  });
  assert.equal(
    result.status,
    0,
    `the dsh stub ended with ${String(result.status)}: ${result.stderr}`,
  );
  return { exitCode: result.status ?? 1, stateFile, workdir, transcript };
}

test("CT-141-107: exactly the eleven verbs of §O.3", () => {
  assert.equal(PROPOSER_VERB_COUNT, 11);
  assert.equal(PROPOSER_VERBS.length, 11);
  assert.deepEqual([...PROPOSER_VERBS], VOCABULARY.kinds["proposer"]?.verbs);
  assert.deepEqual(
    [...PROPOSER_VERBS],
    [
      "write",
      "evidence",
      "stream",
      "text",
      "sleep",
      "exit",
      "yield",
      "silent",
      "repeat",
      "nothing",
      "plugin-request",
    ],
  );
});

test("CT-141-107: a twelfth verb is refused before the stub does anything", () => {
  const file = join(mkdtempSync(join(tmpdir(), "oracle-script-")), "proposer.json");
  writeFileSync(
    file,
    JSON.stringify({ role: "proposer", steps: [{ verbs: ["checkpoint"] }] }),
    "utf8",
  );
  assert.throws(
    () => readScript(file),
    (error: unknown) =>
      error instanceof StubScriptError && /"checkpoint" is no verb of proposer/.test(error.message),
  );
  // And the step itself refuses it, so neither path can let one through.
  assert.throws(
    () =>
      carryOutProposerStep(
        { verbs: ["checkpoint"] },
        {
          workdir: "/tmp",
          fixtureDir: "/tmp",
          prompt: "",
          statePaths: {},
          tickMilliseconds: 1,
          stdout: (): void => undefined,
          stderr: (): void => undefined,
        },
      ),
    (error: unknown) =>
      error instanceof ProposerStubError &&
      /checkpoint is no verb of the proposer stub/.test(error.message),
  );
});

test("CT-141-107: no verb declares a unit of work and no verb writes a checkpoint", () => {
  assert.ok(VERBS_A_PROPOSER_STUB_NEVER_HAS.length > 0);
  for (const never of VERBS_A_PROPOSER_STUB_NEVER_HAS) {
    assert.ok(!PROPOSER_VERBS.includes(never), `${never} is not a verb of the proposer stub`);
  }
  // The two the requirement names by hand.
  for (const name of ["unit", "checkpoint"]) {
    assert.ok(
      VERBS_A_PROPOSER_STUB_NEVER_HAS.some((v) => v.includes(name)),
      `the list names the ${name} a proposer of the product would write`,
    );
  }
  assertNoUnitOfWorkVerb();
  assert.throws(
    () => assertNoUnitOfWorkVerb([...PROPOSER_VERBS, VERBS_A_PROPOSER_STUB_NEVER_HAS[0] as string]),
    ProposerStubError,
  );
});

test("CT-141-107: the argument `state` of `write` is the one §O.3 declares", () => {
  assert.deepEqual(Object.keys(VOCABULARY.kinds["proposer"]?.arguments ?? {}), ["write"]);
  assert.equal(VOCABULARY.kinds["proposer"]?.arguments?.["write"]?.["state"], "<logical name>");
  // The map is how a logical name becomes a path; a name the map does not hold is
  // refused, so a script can never reach a file the oracle did not lay out.
  assert.equal(resolveStateFile("<a>", { "<a>": "/tmp/a" }), "/tmp/a");
  assert.throws(() => resolveStateFile("<b>", { "<a>": "/tmp/a" }), StatePathError);
});

test("CT-141-107: `write` with `state` changes the file of state of EACH side", () => {
  const reference = driveTheStub("reference");
  const port = driveTheStub("port");

  // Two different physical paths, neither of them in the script.
  assert.ok(reference.stateFile.endsWith(PHYSICAL.reference));
  assert.ok(port.stateFile.endsWith(PHYSICAL.port));
  assert.notEqual(
    reference.stateFile.slice(reference.workdir.length),
    port.stateFile.slice(port.workdir.length),
  );

  // The effect, read back off disk through a path the stub never touched.
  const hashOf = (file: string): string =>
    createHash("sha256").update(readFileSync(file)).digest("hex");
  for (const side of [reference, port]) {
    assert.ok(existsSync(side.stateFile), `${side.stateFile} was written`);
    assert.equal(readFileSync(side.stateFile, "utf8"), "the notes of the pass\n");
  }
  // The same content on both sides: the logical name is what the script named.
  assert.equal(hashOf(reference.stateFile), hashOf(port.stateFile));
  assert.equal(
    hashOf(reference.stateFile),
    createHash("sha256").update("the notes of the pass\n").digest("hex"),
  );

  // One record per call, and the record names the verbs of the step.
  for (const side of [reference, port]) {
    const records = readTranscript(side.transcript);
    assert.equal(records.length, 1);
    assert.equal(records[0]?.role, "proposer");
    assert.equal(records[0]?.harness, "dsh");
    assert.deepEqual(records[0]?.step?.["verbs"], ["write", "evidence"]);
  }
});

test("CT-141-107: `evidence` writes the file the PROMPT names, atomically", () => {
  const workdir = mkdtempSync(join(tmpdir(), "oracle-evidence-"));
  const context = {
    workdir,
    fixtureDir: workdir,
    prompt:
      "Write your evidence to .specstride/features/x/gates/GATE2-EVIDENCE.md (path relative to the\nworkdir)",
    statePaths: {},
    tickMilliseconds: 1,
    stdout: (): void => undefined,
    stderr: (): void => undefined,
  };
  assert.equal(
    evidencePathFromPrompt(context.prompt),
    ".specstride/features/x/gates/GATE2-EVIDENCE.md",
  );
  assert.equal(carryOutProposerStep({ verbs: ["evidence"] }, context), 0);
  assert.ok(existsSync(join(workdir, ".specstride/features/x/gates/GATE2-EVIDENCE.md")));
  // The temporary name is gone: the write was a write and a rename.
  assert.ok(!existsSync(join(workdir, ".specstride/features/x/gates/GATE2-EVIDENCE.md.tmp")));
  // An ABSOLUTE path in the prompt is taken relative to the working directory, so
  // the evidence of a run always lands inside it.
  assert.equal(
    evidencePathFromPrompt(`${workdir}/.specstride/features/x/gates/GATE3-EVIDENCE.md`, workdir),
    ".specstride/features/x/gates/GATE3-EVIDENCE.md",
  );
  // A prompt that names no evidence file and a step that names none is a failure,
  // not a silent pass.
  assert.throws(
    () => carryOutProposerStep({ verbs: ["evidence"] }, { ...context, prompt: "no file here" }),
    (error: unknown) =>
      error instanceof ProposerStubError && /names no GATE<N>-EVIDENCE\.md/.test(error.message),
  );
});

test("CT-141-107: `write` and `evidence` in one step do not write over each other", () => {
  const workdir = mkdtempSync(join(tmpdir(), "oracle-two-verbs-"));
  const code = carryOutProposerStep(
    {
      verbs: ["write", "evidence"],
      args: { path: "one.txt", content: "one\n", evidence: "gates/GATE1-EVIDENCE.md" },
    },
    {
      workdir,
      fixtureDir: workdir,
      prompt: "",
      statePaths: {},
      tickMilliseconds: 1,
      stdout: (): void => undefined,
      stderr: (): void => undefined,
    },
  );
  assert.equal(code, 0);
  // The two verbs of one step share one map of arguments; the file of `write` is
  // still the file of `write`.
  assert.equal(readFileSync(join(workdir, "one.txt"), "utf8"), "one\n");
  assert.ok(existsSync(join(workdir, "gates", "GATE1-EVIDENCE.md")));
});

test("CT-141-107: a path of a verb never leaves the working directory", () => {
  const workdir = mkdtempSync(join(tmpdir(), "oracle-escape-"));
  const context = {
    workdir,
    fixtureDir: workdir,
    prompt: "",
    statePaths: {},
    tickMilliseconds: 1,
    stdout: (): void => undefined,
    stderr: (): void => undefined,
  };
  for (const path of ["/etc/passwd", "../outside.txt"]) {
    assert.throws(
      () => carryOutProposerStep({ verbs: ["write"], args: { path } }, context),
      ProposerStubError,
      path,
    );
  }
});

test("CT-141-107: the context of a call is built from the environment of the run", () => {
  const root = mkdtempSync(join(tmpdir(), "oracle-context-"));
  const mapFile = join(root, "state-paths.json");
  writeFileSync(mapFile, JSON.stringify({ "<a>": join(root, "a") }), "utf8");
  const context = proposerContext(
    { [STATE_PATH_VARIABLE]: mapFile, SPECSTRIDE_WATCHDOG_TICK: "2" },
    "the prompt",
    root,
    root,
  );
  assert.deepEqual(context.statePaths, { "<a>": join(root, "a") });
  assert.equal(context.tickMilliseconds, 2000);
  // No map named: no file of state is reachable, and nothing of the machine is read.
  assert.deepEqual(proposerContext({}, "p", root, root).statePaths, {});
});
