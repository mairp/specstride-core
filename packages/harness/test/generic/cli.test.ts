/**
 * T044 — CT-109-16: the generic harness adapter for the kind `cli`
 * (F109-FR-016).
 *
 * Observed with the fake binary of the test kit, which records the
 * argument list, the standard input, the environment, the working directory
 * and the process group of every start:
 *
 * - the argument list is the descriptor's and nothing is added; no flag is
 *   guessed;
 * - the prompt goes by standard input, by a file, or as a bounded
 *   argument, and a prompt above the descriptor's limit is refused BEFORE
 *   the harness starts;
 * - the files the descriptor names are written before the call and removed
 *   after it;
 * - a critic of the first form runs in an empty temporary directory, which
 *   is removed after the call.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildCliInvocation,
  cleanupCliInvocation,
  materialiseFirstFormDirectory,
  readRecordedCalls,
  runCliInvocation,
  writeCliFiles,
} from "../../src/generic/cli.ts";
import { buildCallEnvironment } from "../../src/environment/allow-list.ts";

const FAKE_BINARY = join(
  dirnameOfImport(),
  "..",
  "..",
  "..",
  "testkit",
  "conformance",
  "EP-02",
  "fake-binary.mjs",
);

import { fileURLToPath } from "node:url";
function dirnameOfImport(): string {
  return join(fileURLToPath(new URL(".", import.meta.url)));
}

const KIND_CLI_DESCRIPTOR = {
  descriptorVersion: 1,
  id: "ct-16-cli",
  kind: "cli",
  detect: { executable: "fake-binary" },
  models: { default: "model-ct-16" },
  roles: {
    proposer: { supported: true },
    critic: { supported: true },
  },
  invoke: {
    proposer: {
      permission: "none",
      prompt: "stdin",
      args: ["--model", "{model}", "--prompt-stdin", "--session", "{sessionId}"],
    },
    critic: {
      permission: "none",
      prompt: "stdin",
      args: ["--model", "{model}", "--prompt-stdin"],
    },
  },
  continuation: { supported: false },
  failures: {},
  cost: { class: "local" },
  memory: { native: false },
} as const;

function environmentFor(recordDir: string, script: unknown): Record<string, string> {
  return {
    ...buildCallEnvironment({ role: "proposer", processEnv: process.env }),
    FAKE_BINARY_RECORD_DIR: recordDir,
    FAKE_BINARY_SCRIPT: JSON.stringify(script),
  };
}

function freshRecordDir(): string {
  return mkdtempSync(join(tmpdir(), "ct-16-record-"));
}

test("CT-109-16: the argument list is the descriptor's and nothing is added", async () => {
  const recordDir = freshRecordDir();
  const workdir = mkdtempSync(join(tmpdir(), "ct-16-work-"));
  const built = buildCliInvocation(KIND_CLI_DESCRIPTOR, FAKE_BINARY, {
    role: "proposer",
    prompt: "the prompt text",
    workdir,
    model: "model-ct-16",
    sessionId: "sess-1",
  });
  assert.ok(built.ok, JSON.stringify(built));
  // Nothing added: the list is exactly the descriptor's, substituted.
  assert.deepEqual(built.args, ["--model", "model-ct-16", "--prompt-stdin", "--session", "sess-1"]);
  await writeCliFiles(built);
  const run = await runCliInvocation(built, environmentFor(recordDir, []));
  assert.equal(run.exitCode, 0, run.stderr);
  const calls = await readRecordedCalls(recordDir);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0]?.argv, built.args);
  // No guessed flag: no flag that suppresses permission prompts appears.
  const argvText = calls[0]!.argv.join(" ");
  for (const guessed of [
    "--dangerously-skip-permissions",
    "--yolo",
    "--yes",
    "--force",
    "--no-verify",
    "--approval-mode",
  ]) {
    assert.ok(!argvText.includes(guessed), `the adapter guessed ${guessed}`);
  }
});

test("CT-109-16: no permission mechanism declared refuses the proposer before any start", () => {
  const undeclared = {
    ...KIND_CLI_DESCRIPTOR,
    id: "ct-16-undeclared",
    invoke: {
      proposer: {
        prompt: "stdin",
        args: ["--model", "{model}"],
      },
      critic: { prompt: "stdin", args: ["--model", "{model}"] },
    },
  };
  const built = buildCliInvocation(undeclared, "fake-binary", {
    role: "proposer",
    prompt: "p",
    workdir: tmpdir(),
  });
  assert.equal(built.ok, false);
  assert.ok(!built.ok && built.reason === "permission-undeclared");
  // No guessed flag: the refusal text names it and no flag is proposed.
  assert.ok(!built.ok && !built.message.includes("--"));
});

test("CT-109-16: the prompt goes by standard input where the descriptor allows it", async () => {
  const recordDir = freshRecordDir();
  const workdir = mkdtempSync(join(tmpdir(), "ct-16-work-"));
  const built = buildCliInvocation(KIND_CLI_DESCRIPTOR, FAKE_BINARY, {
    role: "critic",
    prompt: "critic prompt by stdin",
    workdir,
  });
  assert.ok(built.ok);
  assert.equal(built.stdin, "critic prompt by stdin");
  await writeCliFiles(built);
  const run = await runCliInvocation(built, environmentFor(recordDir, []));
  assert.equal(run.exitCode, 0, run.stderr);
  const calls = await readRecordedCalls(recordDir);
  assert.equal(calls[0]?.stdin, "critic prompt by stdin");
  assert.equal(calls[0]!.argv.includes("critic prompt by stdin"), false);
});

test("CT-109-16: the prompt goes by a file where the descriptor says file", async () => {
  const recordDir = freshRecordDir();
  const workdir = mkdtempSync(join(tmpdir(), "ct-16-work-"));
  const filePromptDescriptor = {
    descriptorVersion: 1,
    id: "ct-16-file",
    kind: "cli",
    detect: {},
    models: {},
    roles: { critic: { supported: true } },
    invoke: {
      critic: {
        permission: "none",
        prompt: "file",
        args: ["--prompt-file", "{promptFile}"],
      },
    },
    continuation: {},
    failures: {},
    cost: {},
    memory: {},
  };
  const built = buildCliInvocation(filePromptDescriptor, FAKE_BINARY, {
    role: "critic",
    prompt: "the prompt in a file",
    workdir,
  });
  assert.ok(built.ok);
  await writeCliFiles(built);
  const promptPath = built.args[1]!;
  assert.ok(existsSync(promptPath), "the prompt file is written before the call");
  const run = await runCliInvocation(built, environmentFor(recordDir, [{ read: promptPath }]));
  assert.equal(run.exitCode, 0, run.stderr);
  assert.match(run.stdout, /"ok"/); // the fake binary could read the prompt file
  await cleanupCliInvocation(built);
  assert.equal(existsSync(promptPath), false, "the prompt file is removed after the call");
  const calls = await readRecordedCalls(recordDir);
  assert.equal(calls[0]?.stdin, "");
});

test("CT-109-16: the prompt goes as a bounded argument, and a larger one is refused first", async () => {
  const argDescriptor = {
    descriptorVersion: 1,
    id: "ct-16-arg",
    kind: "cli",
    detect: {},
    models: {},
    roles: { critic: { supported: true } },
    invoke: {
      critic: {
        permission: "none",
        prompt: "arg",
        promptLimitBytes: 16,
        args: ["--prompt", "{prompt}"],
      },
    },
    continuation: {},
    failures: {},
    cost: {},
    memory: {},
  };
  const small = buildCliInvocation(argDescriptor, FAKE_BINARY, {
    role: "critic",
    prompt: "short",
    workdir: tmpdir(),
  });
  assert.ok(small.ok);
  assert.deepEqual([...small.args], ["--prompt", "short"]);

  const recordDir = freshRecordDir();
  const tooLarge = buildCliInvocation(argDescriptor, FAKE_BINARY, {
    role: "critic",
    prompt: "a prompt that is far above the sixteen bytes the descriptor allows",
    workdir: tmpdir(),
  });
  assert.equal(tooLarge.ok, false);
  assert.ok(!tooLarge.ok && tooLarge.reason === "prompt-too-large");
  // Refused BEFORE the harness starts: nothing was recorded.
  assert.deepEqual(await readRecordedCalls(recordDir), []);
});

test("CT-109-16: the files the descriptor names are written and removed", async () => {
  const recordDir = freshRecordDir();
  const workdir = mkdtempSync(join(tmpdir(), "ct-16-work-"));
  const filesDescriptor = {
    ...KIND_CLI_DESCRIPTOR,
    id: "ct-16-files",
    invoke: {
      ...KIND_CLI_DESCRIPTOR.invoke,
      critic: {
        permission: "none",
        prompt: "stdin",
        args: ["--prompt-stdin"],
        files: { "harness.json": '{"kind":"ct-16"}' },
      },
    },
  };
  const built = buildCliInvocation(filesDescriptor, FAKE_BINARY, {
    role: "critic",
    prompt: "p",
    workdir,
  });
  assert.ok(built.ok);
  const filePath = join(workdir, "harness.json");
  assert.equal(existsSync(filePath), false);
  await writeCliFiles(built);
  assert.ok(existsSync(filePath), "written before the call");
  const run = await runCliInvocation(built, environmentFor(recordDir, [{ read: filePath }]));
  assert.equal(run.exitCode, 0, run.stderr);
  assert.match(run.stdout, /"ok"/);
  await cleanupCliInvocation(built);
  assert.equal(existsSync(filePath), false, "removed after the call");
});

test("CT-109-16: a critic of the first form runs in an empty temporary directory, removed after", async () => {
  const recordDir = freshRecordDir();
  const workdir = mkdtempSync(join(tmpdir(), "ct-16-work-"));
  const built = await materialiseFirstFormDirectory(
    buildCliInvocation(KIND_CLI_DESCRIPTOR, FAKE_BINARY, {
      role: "critic",
      prompt: "first-form critic",
      workdir,
      firstFormCritic: true,
    }),
  );
  assert.ok(built.ok);
  assert.notEqual(built.cwd, workdir);
  assert.ok(built.cwd.startsWith(tmpdir()), "the directory is a temporary one");
  await writeCliFiles(built);
  const run = await runCliInvocation(
    built,
    environmentFor(recordDir, [
      // The critic writes something of its own; the sweep must take it too.
      { write: { path: "leftover.txt", content: "x" } },
    ]),
  );
  assert.equal(run.exitCode, 0, run.stderr);
  const calls = await readRecordedCalls(recordDir);
  assert.equal(calls[0]?.cwd, built.cwd);
  // The directory was empty when the harness started: the descriptor's own
  // prompt went by stdin and no file of the workdir followed it.
  assert.equal(existsSync(join(built.cwd, "harness.json")), false);
  await cleanupCliInvocation(built);
  assert.equal(existsSync(built.cwd), false, "the temporary directory is removed after the call");
});
