/**
 * T056 — CT-109-22: the native-memory decision (F109-FR-022).
 *
 * A critic is always started with native memory switched off. A proposer is
 * started with it switched off too, unless the user has opted in. A harness
 * that cannot switch native memory off does not qualify as a critic. Every
 * start records the decision for that run.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { memoryDecision, type MemoryRole } from "../../src/generic/memory.ts";
import {
  buildCliInvocation,
  cleanupCliInvocation,
  readRecordedCalls,
  runCliInvocation,
  writeCliFiles,
} from "../../src/generic/cli.ts";

const FAKE_BINARY = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "..",
  "..",
  "testkit",
  "conformance",
  "EP-02",
  "fake-binary.mjs",
);

const SWITCHABLE = {
  descriptorVersion: 1,
  id: "ct-22-harness",
  kind: "cli",
  detect: {},
  models: {},
  roles: { proposer: { supported: true }, critic: { supported: true } },
  invoke: {
    proposer: { permission: "none", prompt: "stdin", args: ["--model", "{model}"] },
    critic: { permission: "none", prompt: "stdin", args: ["--model", "{model}"] },
  },
  continuation: {},
  failures: {},
  cost: {},
  memory: {
    native: true,
    off: {
      env: { SPECSTRIDE_MEMORY_OFF: "true" },
      flags: ["--no-native-memory"],
    },
  },
};

test("CT-109-22: a critic is started with native memory switched off, always", () => {
  const decision = memoryDecision(SWITCHABLE, { role: "critic" });
  assert.equal(decision.switchedOff, true);
  assert.equal(decision.reason, "critic-always");
  assert.equal(decision.qualifiesAsCritic, true);
  assert.deepEqual(decision.env, { SPECSTRIDE_MEMORY_OFF: "true" });
});

test("CT-109-22: a proposer is switched off without an opt-in of the user", () => {
  const decision = memoryDecision(SWITCHABLE, { role: "proposer" });
  assert.equal(decision.switchedOff, true);
  assert.equal(decision.reason, "no-opt-in");
});

test("CT-109-22: a proposer with the user's opt-in keeps native memory", () => {
  const decision = memoryDecision(SWITCHABLE, { role: "proposer", userOptIn: true });
  assert.equal(decision.switchedOff, false);
  assert.equal(decision.reason, "opt-in");
});

test("CT-109-22: a harness that cannot switch native memory off does not qualify as a critic", () => {
  const stuckOn = {
    ...SWITCHABLE,
    memory: { native: true },
  };
  const critic = memoryDecision(stuckOn, { role: "critic" });
  assert.equal(critic.switchedOff, false);
  assert.equal(critic.reason, "cannot-switch-off");
  assert.equal(critic.qualifiesAsCritic, false, "no switch to off, no critic");
  assert.deepEqual(critic.env, {}, "and nothing is invented to switch it off");
});

test("CT-109-22: a harness without native memory needs no switch", () => {
  const decision = memoryDecision({ ...SWITCHABLE, memory: { native: false } }, { role: "critic" });
  assert.equal(decision.switchedOff, true);
  assert.equal(decision.reason, "no-native-memory");
  assert.equal(decision.qualifiesAsCritic, true);
});

test("CT-109-22: the decision is recorded per start", async () => {
  for (const role of ["proposer", "critic"] as const) {
    const recordDir = mkdtempSync(join(tmpdir(), "ct-22-record-"));
    const workdir = mkdtempSync(join(tmpdir(), "ct-22-work-"));
    const decision = memoryDecision(SWITCHABLE, { role, userOptIn: false });
    const built = buildCliInvocation(SWITCHABLE, FAKE_BINARY, {
      role,
      prompt: "p",
      workdir,
      model: "m",
    });
    assert.ok(built.ok, JSON.stringify(built));
    await writeCliFiles(built);
    const run = await runCliInvocation(built, {
      // The seam starts the call with the decision's variables applied.
      ...decision.env,
      FAKE_BINARY_RECORD_DIR: recordDir,
      FAKE_BINARY_SCRIPT: "[]",
    });
    assert.equal(run.exitCode, 0, run.stderr);
    await cleanupCliInvocation(built);
    const calls = await readRecordedCalls(recordDir);
    assert.equal(calls.length, 1);
    // The record for the run: the switch is in the environment of the start.
    assert.equal(calls[0]!.env.SPECSTRIDE_MEMORY_OFF, "true");
    // The argument list is the descriptor's: the switch rides the
    // environment alone, and the adapter added no flag of its own.
    assert.deepEqual(calls[0]!.argv, ["--model", "m"]);
    // The record for the run is the decision itself: role, harness, why.
    assert.equal(decision.role satisfies MemoryRole, role);
    assert.equal(decision.harness, "ct-22-harness");
    assert.equal(decision.source, "descriptor");
  }
});
