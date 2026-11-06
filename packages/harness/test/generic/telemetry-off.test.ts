/**
 * T054 — CT-109-21: the telemetry switch (F109-FR-021).
 *
 * Where the descriptor names the switch for the harness's own telemetry,
 * every process the seam starts for that harness is started with the
 * telemetry switched off — and the argument list is still the descriptor's,
 * with nothing added.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyTelemetrySwitch,
  reconcileTelemetryFlags,
  telemetrySwitch,
} from "../../src/generic/switches.ts";
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

const TELEMETRY_DESCRIPTOR = {
  descriptorVersion: 1,
  id: "ct-21-harness",
  kind: "cli",
  detect: {},
  models: {},
  roles: { proposer: { supported: true } },
  invoke: {
    proposer: {
      permission: "none",
      prompt: "stdin",
      args: ["--model", "{model}", "--no-telemetry"],
    },
  },
  stream: undefined,
  continuation: {},
  failures: {},
  cost: {},
  memory: {},
  telemetry: {
    off: {
      env: { DO_NOT_TRACK: "1", SPECSTRIDE_TELEMETRY_OFF: "true" },
      flags: ["--no-telemetry"],
    },
  },
};

test("CT-109-21: the switch named by the descriptor is read", () => {
  const telemetry = telemetrySwitch(TELEMETRY_DESCRIPTOR);
  assert.equal(telemetry.declared, true);
  assert.deepEqual(telemetry.env, {
    DO_NOT_TRACK: "1",
    SPECSTRIDE_TELEMETRY_OFF: "true",
  });
  assert.deepEqual(telemetry.flags, ["--no-telemetry"]);
});

test("CT-109-21: a descriptor that names no switch records exactly that", () => {
  const telemetry = telemetrySwitch({ ...TELEMETRY_DESCRIPTOR, telemetry: undefined });
  assert.equal(telemetry.declared, false);
  assert.deepEqual(telemetry.env, {});
  assert.deepEqual(telemetry.flags, []);
});

test("CT-109-21: every started process carries the switch in its environment", async () => {
  const recordDir = mkdtempSync(join(tmpdir(), "ct-21-record-"));
  const workdir = mkdtempSync(join(tmpdir(), "ct-21-work-"));
  const built = buildCliInvocation(TELEMETRY_DESCRIPTOR, FAKE_BINARY, {
    role: "proposer",
    prompt: "p",
    workdir,
    model: "m",
  });
  assert.ok(built.ok, JSON.stringify(built));
  const environment = applyTelemetrySwitch(
    { PATH: process.env.PATH ?? "", HOME: workdir },
    telemetrySwitch(TELEMETRY_DESCRIPTOR),
  );
  await writeCliFiles(built);
  const run = await runCliInvocation(built, {
    ...environment,
    FAKE_BINARY_RECORD_DIR: recordDir,
    FAKE_BINARY_SCRIPT: "[]",
  });
  assert.equal(run.exitCode, 0, run.stderr);
  await cleanupCliInvocation(built);
  const calls = await readRecordedCalls(recordDir);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.env.DO_NOT_TRACK, "1");
  assert.equal(calls[0]!.env.SPECSTRIDE_TELEMETRY_OFF, "true");
});

test("CT-109-21: the argument list is still the descriptor's, nothing added", async () => {
  const recordDir = mkdtempSync(join(tmpdir(), "ct-21-record-"));
  const workdir = mkdtempSync(join(tmpdir(), "ct-21-work-"));
  const built = buildCliInvocation(TELEMETRY_DESCRIPTOR, FAKE_BINARY, {
    role: "proposer",
    prompt: "p",
    workdir,
    model: "m",
  });
  assert.ok(built.ok);
  await writeCliFiles(built);
  await runCliInvocation(built, {
    FAKE_BINARY_RECORD_DIR: recordDir,
    FAKE_BINARY_SCRIPT: "[]",
  });
  await cleanupCliInvocation(built);
  const calls = await readRecordedCalls(recordDir);
  // The flag form of the switch is the descriptor's own argument, already
  // in its list; the adapter added nothing.
  assert.deepEqual(calls[0]!.argv, ["--model", "m", "--no-telemetry"]);
  const telemetry = telemetrySwitch(TELEMETRY_DESCRIPTOR);
  assert.deepEqual(reconcileTelemetryFlags(telemetry, calls[0]!.argv).unappliedFlags, []);
});

test("CT-109-21: a flag the descriptor names but does not declare is recorded as unapplied", () => {
  const telemetry = {
    ...telemetrySwitch(TELEMETRY_DESCRIPTOR),
    flags: ["--no-telemetry", "--never-reported"],
  };
  const reconciled = reconcileTelemetryFlags(telemetry, ["--model", "m", "--no-telemetry"]);
  assert.deepEqual(reconciled.unappliedFlags, ["--never-reported"]);
  // And the adapter did not add it to the argument list either.
  assert.deepEqual(
    reconciled.flags.filter((f) => !telemetry.flags.includes(f)),
    [],
  );
});
