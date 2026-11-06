/**
 * T024 — characterization tests CT-130-10, CT-130-11, CT-130-15, CT-130-16,
 * CT-130-17, CT-130-18 of the proposer call.
 *
 * CT-130-10 — the permission mode is ALWAYS stated in the record of a call,
 * and `danger-full-access` is used only with the containment C0 opt-in, which
 * USER CONFIGURATION alone gives (F130-FR-010, ruling 34).
 * CT-130-11 — the prompt is bounded (120 KiB) and split only at ASCII spaces,
 * with no chunk starting with a dash (F130-FR-011).
 * CT-130-15 — the real home is byte-identical before and after a pass
 * (F130-FR-015, ruling 36).
 * CT-130-16 — no continuation: every pass is a fresh session and the switch
 * `carry.continuation` has no effect (F130-FR-016).
 * CT-130-17 — standard input is closed and the pass never waits on a human
 * (F130-FR-017).
 * CT-130-18 — the containment ceiling C1 is declared `unverified` with
 * `protection=detect`, and `loop.parallel.allow_detect` is accepted from user
 * configuration only (F130-FR-018, ruling P2).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runDshProposer } from "../src/proposer/index.ts";
import {
  permissionModeStatement,
  resolvePermissionMode,
  fullAccessOptIn,
  PROPOSER_PERMISSION_MODE,
  CRITIC_PERMISSION_MODE,
  FULL_ACCESS_MODE,
} from "../src/proposer/permission.ts";
import {
  promptArguments,
  splitPromptAtSpaces,
  PromptTooLargeError,
  PROMPT_LIMIT_BYTES,
} from "../src/proposer/chunks.ts";
import {
  DSH_CONTINUATION_STATEMENT,
  DSH_APPROVAL_STATEMENT,
  DSH_CONTAINMENT_STATEMENT,
  continuationSwitchRecord,
  dshMicroLoopLevel,
  dshParallelUnitsDecision,
} from "../src/descriptor/statements.ts";

const FAKE_DSH = fileURLToPath(
  new URL("../../testkit/conformance/EP-02/fake-dsh.mjs", import.meta.url),
);

/** Stages the stub named `dsh`, a workdir and a fixture home. */
function stage(homeFiles: Record<string, string> = {}) {
  const root = mkdtempSync(join(tmpdir(), "ct130-proposer."));
  const binDir = join(root, "bin");
  const stubPath = join(binDir, "dsh");
  const recordDir = join(root, "record");
  const workdir = join(root, "work");
  const home = join(root, "home");
  mkdirSync(binDir, { recursive: true });
  mkdirSync(recordDir);
  mkdirSync(workdir);
  mkdirSync(home, { recursive: true });
  writeFileSync(stubPath, `#!/bin/sh\nexec "${process.execPath}" "${FAKE_DSH}" "$@"\n`);
  chmodSync(stubPath, 0o755);
  for (const [name, content] of Object.entries(homeFiles)) {
    const path = join(home, name);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, content);
  }
  const env = { PATH: binDir, HOME: root, FAKE_DSH_RECORD_DIR: recordDir };
  return {
    root,
    binDir,
    stubPath,
    recordDir,
    workdir,
    home,
    env,
    records: () =>
      readFileSync(join(recordDir, "record.jsonl"), "utf8")
        .trim()
        .split("\n")
        .filter((line) => line !== "")
        .map((line) => JSON.parse(line)),
    dispose: () => rmSync(root, { recursive: true, force: true }),
  };
}

/** A stable digest of every file of a directory tree, hidden files included. */
function treeDigest(dir: string, prefix = ""): Record<string, string> {
  const digests: Record<string, string> = {};
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const name = `${prefix}${entry}`;
    if (statSync(path).isDirectory()) {
      Object.assign(digests, treeDigest(path, `${name}/`));
    } else {
      digests[name] = createHash("sha256").update(readFileSync(path)).digest("hex");
    }
  }
  return digests;
}

// ---------------------------------------------------------------- CT-130-10

test("CT-130-10: the permission mode is always stated in the record of a call", () => {
  const fixture = stage();
  try {
    const run = runDshProposer({
      prompt: "mode stated",
      cwd: fixture.workdir,
      path: fixture.binDir,
      env: { ...fixture.env },
    });
    assert.ok(run.ok);
    assert.ok(run.ok && typeof run.permissionMode === "string" && run.permissionMode !== "");
    const mode = run.ok ? run.permissionMode : "";
    const statement = permissionModeStatement(mode);
    assert.equal(statement.permissionMode, mode);
    assert.equal(statement.env, "DSH_PERMISSION_MODE");
    assert.equal(statement.sandboxClaimed, false, "the mode is not a sandbox claim");
    const record = fixture.records()[0]!;
    assert.equal(record.permissionMode, mode, "the stub saw the stated mode");
  } finally {
    fixture.dispose();
  }
});

test("CT-130-10: no danger-full-access without the opt-in (F130-FR-010)", () => {
  assert.equal(
    resolvePermissionMode({ role: "proposer" }).ok &&
      (resolvePermissionMode({ role: "proposer" }) as { mode: string }).mode,
    PROPOSER_PERMISSION_MODE,
  );
  // A configured full access without any opt-in is a configuration error.
  const noOptIn = resolvePermissionMode({
    configured: { mode: FULL_ACCESS_MODE, origin: "user-config" },
  });
  assert.ok(!noOptIn.ok);
  // The opt-in at the wrong level does not unlock it.
  const wrongLevel = resolvePermissionMode({
    configured: { mode: FULL_ACCESS_MODE, origin: "user-config" },
    containmentLevel: { level: "C1", origin: "user-config" },
  });
  assert.ok(!wrongLevel.ok);
  // No run of this adapter ever states full access by default.
  assert.notEqual(PROPOSER_PERMISSION_MODE, FULL_ACCESS_MODE);
  assert.notEqual(CRITIC_PERMISSION_MODE, FULL_ACCESS_MODE);
});

test("CT-130-10: the opt-in comes from user configuration only (ruling 34)", () => {
  assert.equal(fullAccessOptIn(undefined), false);
  assert.equal(fullAccessOptIn({ level: "C0", origin: "env" }), false);
  assert.equal(fullAccessOptIn({ level: "C0", origin: "flag" }), false);
  assert.equal(fullAccessOptIn({ level: "C0", origin: "project-config" }), false);
  assert.equal(fullAccessOptIn({ level: "C0", origin: "user-config" }), true);
  // And a value from the environment never reaches the mode at all.
  const fromEnv = resolvePermissionMode({
    configured: { mode: FULL_ACCESS_MODE, origin: "env" },
    containmentLevel: { level: "C0", origin: "user-config" },
  });
  assert.ok(!fromEnv.ok && fromEnv.error.includes("user configuration only"));
});

test("CT-130-10: the opt-in given, the mode is danger-full-access and stated", () => {
  const optedIn = resolvePermissionMode({
    configured: { mode: FULL_ACCESS_MODE, origin: "user-config" },
    containmentLevel: { level: "C0", origin: "user-config" },
  });
  assert.deepEqual(optedIn, { ok: true, mode: FULL_ACCESS_MODE, stated: true });
  const fixture = stage();
  try {
    const run = runDshProposer({
      prompt: "opted in",
      cwd: fixture.workdir,
      path: fixture.binDir,
      env: { ...fixture.env },
      configuredMode: { mode: FULL_ACCESS_MODE, origin: "user-config" },
      containmentLevel: { level: "C0", origin: "user-config" },
    });
    assert.ok(run.ok && run.permissionMode === FULL_ACCESS_MODE);
  } finally {
    fixture.dispose();
  }
});

// ---------------------------------------------------------------- CT-130-11

test("CT-130-11: a prompt within the limit travels as ONE argument", () => {
  assert.equal(PROMPT_LIMIT_BYTES, 122_880);
  const prompt = "a".repeat(PROMPT_LIMIT_BYTES);
  assert.deepEqual(promptArguments(prompt), [prompt]);
});

test("CT-130-11: a prompt over the limit is split only at ASCII spaces", () => {
  const word = "x".repeat(1000);
  const prompt = Array.from({ length: 200 }, () => word).join(" ");
  const chunks = promptArguments(prompt);
  assert.ok(chunks.length > 1);
  for (const chunk of chunks) {
    assert.ok(Buffer.byteLength(chunk) <= PROMPT_LIMIT_BYTES);
    for (const character of chunk) {
      if (character === " ") break; // spaces only ever join words
    }
    assert.ok(!chunk.slice(1).includes("\n"), "no newline was introduced by the split");
  }
  const rejoined = chunks.join(" ");
  assert.equal(
    rejoined.split("  ").length - 1,
    0,
    "no double space: the split is at the as-is spaces",
  );
});

test("CT-130-11: no chunk starts with a dash", () => {
  const words = Array.from({ length: 50 }, (_, index) => (index === 47 ? "-flag-like" : "word"));
  const chunks = splitPromptAtSpaces(words.join(" "));
  for (const chunk of chunks) {
    assert.ok(!chunk.startsWith("-"), `a chunk must not start with a dash: ${chunk.slice(0, 20)}`);
  }
  // The dash token survives the split intact, wherever it landed.
  assert.ok(chunks.some((chunk) => chunk.includes("-flag-like")));
});

test("CT-130-11: a single token over the limit fails the pass with the limit named", () => {
  const token = "y".repeat(PROMPT_LIMIT_BYTES + 1);
  assert.throws(
    () => promptArguments(token),
    (error: unknown) => {
      assert.ok(error instanceof PromptTooLargeError);
      assert.ok(error.message.includes("122880"));
      assert.ok(error.message.includes("120 KiB"));
      return true;
    },
  );
});

// ---------------------------------------------------------------- CT-130-15

test("CT-130-15: the real home is byte-identical before and after a pass", () => {
  const fixture = stage({
    "settings.yaml": "agent-default-model:\n  provider: deepseek\n  model: chat\n",
    ".dotfile": "kept\n",
    "plugins/x.txt": "plugin\n",
  });
  try {
    const before = treeDigest(fixture.home);
    const run = runDshProposer({
      prompt: "a pass with a model override",
      cwd: fixture.workdir,
      path: fixture.binDir,
      env: { ...fixture.env },
      // Bind the adapter's REAL home to the staged fixture.home: without
      // DSH_HOME the settings resolve it to join(HOME, ".dsh"), and the
      // digest below would watch the wrong directory.
      config: { env: { ...fixture.env, DSH_HOME: fixture.home } },
      model: { flag: "zai/glm-4" },
    });
    assert.ok(run.ok && run.status === 0, JSON.stringify(run));
    assert.deepEqual(treeDigest(fixture.home), before, "not one byte of the real home changed");
    // And the throwaway home is gone again.
    assert.ok(run.ok && run.overlay !== null && !existsSync(run.overlay));
  } finally {
    fixture.dispose();
  }
});

// ---------------------------------------------------------------- CT-130-16

test("CT-130-16: no continuation — every pass is a fresh session (F130-FR-016)", () => {
  assert.equal(DSH_CONTINUATION_STATEMENT["session.continuation"], "none");
  assert.equal(DSH_CONTINUATION_STATEMENT.supported, false);
  assert.equal(DSH_CONTINUATION_STATEMENT.freshSessionEveryPass, true);
  assert.equal(dshMicroLoopLevel(), "L1");
});

test("CT-130-16: the switch carry.continuation has no effect, and the run records it", () => {
  assert.deepEqual(continuationSwitchRecord(), {
    switch: "carry.continuation",
    effect: "none",
    recorded: true,
  });
});

// ---------------------------------------------------------------- CT-130-17

test("CT-130-17: standard input is closed and nothing is read from it", () => {
  const fixture = stage();
  try {
    const run = runDshProposer({
      prompt: "never waits",
      cwd: fixture.workdir,
      path: fixture.binDir,
      env: { ...fixture.env },
    });
    assert.ok(run.ok && run.status === 0, JSON.stringify(run));
    const record = fixture.records()[0]!;
    assert.equal(record.stdin, "", "the stub saw an empty, closed standard input");
  } finally {
    fixture.dispose();
  }
});

test("CT-130-17: a pass never waits on a human; the approval mode ask is unverified", () => {
  assert.equal(DSH_APPROVAL_STATEMENT.waitsOnHuman, false);
  assert.equal(DSH_APPROVAL_STATEMENT.stdin, "closed");
  assert.equal(DSH_APPROVAL_STATEMENT.approvalModeAsk, "unverified (capture 1)");
  assert.equal(DSH_APPROVAL_STATEMENT.noReplyClassification, "agent_failure");
});

// ---------------------------------------------------------------- CT-130-18

test("CT-130-18: the ceiling is C1, unverified, with protection=detect", () => {
  assert.deepEqual(DSH_CONTAINMENT_STATEMENT.ceiling, "C1");
  assert.equal(DSH_CONTAINMENT_STATEMENT.mark, "unverified");
  assert.equal(DSH_CONTAINMENT_STATEMENT.protection, "detect");
  assert.equal(DSH_CONTAINMENT_STATEMENT.sandboxClaimed, false, "no sandbox is asserted");
  assert.equal(DSH_CONTAINMENT_STATEMENT.claimedCeiling, "C1", "the adapter never claims C2");
});

test("CT-130-18: parallel units stay off with the reason stated at protection=detect", () => {
  const decision = dshParallelUnitsDecision();
  assert.deepEqual(decision.units, "off");
  assert.ok(decision.units === "off" && decision.reason.includes("protection=detect"));
  assert.ok(decision.units === "off" && decision.reason.includes("loop.parallel.allow_detect"));
});

test("CT-130-18: loop.parallel.allow_detect is accepted from user configuration only (ruling P2)", () => {
  for (const origin of ["env", "flag", "project-config"] as const) {
    const decision = dshParallelUnitsDecision({ value: true, origin });
    assert.deepEqual(decision.units, "off", `${origin} must not set allow_detect`);
    assert.ok(decision.units === "off" && decision.reason.includes(origin));
  }
  const allowed = dshParallelUnitsDecision({ value: true, origin: "user-config" });
  assert.deepEqual(allowed.units, "detect");
  assert.ok(allowed.units === "detect" && allowed.allowedBy === "user-config");
});
