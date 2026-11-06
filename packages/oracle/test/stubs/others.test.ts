/**
 * CT-141-109 — the engine stub, the verification command stubs, the plugin
 * installer stub and the telemetry sink stub: the verbs of each (T029, T042,
 * T043; F141-FR-009).
 *
 * What the test proves. For each of the four kinds of stub, the set of verbs is
 * exactly the set `packages/oracle/data/stub-vocabulary.json` declares — read
 * back off disk here — a verb outside it FAILS the call by name, and every verb
 * does the thing §O.3 says it does, witnessed through an independent read path:
 * the file the verb wrote, the exit code it returned, the stop reason it
 * recorded, or the status the sink answered with.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ENGINE_EXIT_CODES,
  ENGINE_STOP_REASONS,
  ENGINE_VERBS,
  EngineStubError,
  carryOutEngineStep,
  engineAttempt,
  engineEventFile,
  recordStopReason,
} from "../../stubs/lib/engine.ts";
import {
  INSTALLER_VERBS,
  VERIFICATION_VERBS,
  VerificationStubError,
  carryOutInstallerStep,
  carryOutVerificationStep,
} from "../../stubs/lib/verification.ts";
import {
  ACCEPTED_STATUS,
  DEFAULT_REFUSED_STATUS,
  SINK_VERBS,
  SinkStubError,
  startTelemetrySinkStub,
} from "../../stubs/sink/server.ts";

const PACKAGE = resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
const VOCABULARY = JSON.parse(readFileSync(join(PACKAGE, "data/stub-vocabulary.json"), "utf8")) as {
  kinds: Record<string, { verbs: string[] }>;
};

const engineContext = (workdir: string, attempt = 1) => ({
  workdir,
  feature: "001-greeting",
  attempt,
  tickMilliseconds: 1,
  stdout: (): void => undefined,
  stderr: (): void => undefined,
});

test("CT-141-109: the verbs of each kind of stub are exactly those of the vocabulary", () => {
  assert.deepEqual([...ENGINE_VERBS], VOCABULARY.kinds["engine"]?.verbs);
  assert.deepEqual([...ENGINE_VERBS], ["succeed", "transient", "fail", "stop", "sleep", "crash"]);
  assert.deepEqual([...VERIFICATION_VERBS], VOCABULARY.kinds["verification-command"]?.verbs);
  assert.deepEqual([...VERIFICATION_VERBS], ["pass", "fail", "slow", "write-result"]);
  assert.deepEqual([...INSTALLER_VERBS], VOCABULARY.kinds["plugin-installer"]?.verbs);
  assert.deepEqual([...INSTALLER_VERBS], ["install", "fail", "hang"]);
  assert.deepEqual([...SINK_VERBS], VOCABULARY.kinds["telemetry-sink"]?.verbs);
  assert.deepEqual([...SINK_VERBS], ["accept", "refuse", "down"]);
});

test("CT-141-109: a verb outside the vocabulary fails each kind of stub by name", () => {
  const workdir = mkdtempSync(join(tmpdir(), "oracle-engine-"));
  assert.throws(
    () => carryOutEngineStep({ verbs: ["approve"] }, engineContext(workdir)),
    (error: unknown) =>
      error instanceof EngineStubError &&
      /approve is no verb of the engine stub/.test(error.message),
  );
  assert.throws(
    () => carryOutVerificationStep({ verbs: ["succeed"] }, { workdir, tickMilliseconds: 1 }),
    (error: unknown) =>
      error instanceof VerificationStubError &&
      /succeed is no verb of a verification command stub/.test(error.message),
  );
  assert.throws(
    () =>
      carryOutInstallerStep(
        { verbs: ["pass"] },
        { home: workdir, fixtureDir: workdir, tickMilliseconds: 1 },
      ),
    (error: unknown) =>
      error instanceof VerificationStubError &&
      /pass is no verb of the plugin installer stub/.test(error.message),
  );
});

test("CT-141-109: the engine stub names one verb per step, because a run has one end", () => {
  const workdir = mkdtempSync(join(tmpdir(), "oracle-engine-"));
  assert.throws(
    () => carryOutEngineStep({ verbs: ["succeed", "fail"] }, engineContext(workdir)),
    (error: unknown) => error instanceof EngineStubError && /a run has one end/.test(error.message),
  );
});

test("CT-141-109: the engine verb `succeed` leaves the records of a finished run", () => {
  const workdir = mkdtempSync(join(tmpdir(), "oracle-engine-"));
  const outcome = carryOutEngineStep({ verbs: ["succeed"] }, engineContext(workdir));
  assert.equal(outcome.exitCode, ENGINE_EXIT_CODES.succeed);
  assert.equal(outcome.stopReason, ENGINE_STOP_REASONS.succeed);
  // Read back independently: the event line and the progress file on disk.
  const events = readFileSync(outcome.eventFile as string, "utf8")
    .trim()
    .split("\n");
  const last = JSON.parse(events[events.length - 1] as string) as Record<string, unknown>;
  assert.equal(last["event"], "run_stop");
  assert.equal(last["reason"], ENGINE_STOP_REASONS.succeed);
  assert.equal(last["feature"], "001-greeting");
  assert.equal(last["attempt"], 1);
  assert.ok(
    readFileSync(
      join(workdir, ".specstride", "features", "001-greeting", "PROGRESS.md"),
      "utf8",
    ).includes("All phases complete on attempt 1"),
  );
});

test("CT-141-109: the engine verb `transient` fails while the attempt is low and then succeeds", () => {
  const workdir = mkdtempSync(join(tmpdir(), "oracle-engine-"));
  const step = { verbs: ["transient"], args: { failTimes: 2 } };
  const first = carryOutEngineStep(step, engineContext(workdir, 1));
  const second = carryOutEngineStep(step, engineContext(workdir, 2));
  const third = carryOutEngineStep(step, engineContext(workdir, 3));
  assert.equal(first.exitCode, ENGINE_EXIT_CODES.transient);
  assert.equal(second.exitCode, ENGINE_EXIT_CODES.transient);
  assert.equal(third.exitCode, ENGINE_EXIT_CODES.succeed);
  assert.equal(third.stopReason, ENGINE_STOP_REASONS.succeed);
  const reasons = readFileSync(third.eventFile as string, "utf8")
    .trim()
    .split("\n")
    .map((line) => (JSON.parse(line) as { reason?: string }).reason);
  assert.deepEqual(reasons, [
    ENGINE_STOP_REASONS.transient,
    ENGINE_STOP_REASONS.transient,
    ENGINE_STOP_REASONS.succeed,
  ]);
});

test("CT-141-109: `fail` and `stop` record their reason; `crash` records none", () => {
  const workdir = mkdtempSync(join(tmpdir(), "oracle-engine-"));
  const failed = carryOutEngineStep({ verbs: ["fail"] }, engineContext(workdir));
  assert.equal(failed.exitCode, ENGINE_EXIT_CODES.fail);
  assert.equal(failed.stopReason, ENGINE_STOP_REASONS.fail);

  const stopped = carryOutEngineStep({ verbs: ["stop"] }, engineContext(workdir));
  assert.equal(stopped.exitCode, ENGINE_EXIT_CODES.stop);
  assert.equal(stopped.stopReason, ENGINE_STOP_REASONS.stop);

  const crashWorkdir = mkdtempSync(join(tmpdir(), "oracle-engine-crash-"));
  const crashed = carryOutEngineStep({ verbs: ["crash"] }, engineContext(crashWorkdir));
  assert.equal(crashed.exitCode, ENGINE_EXIT_CODES.crash);
  assert.equal(crashed.stopReason, undefined);
  // A crash writes NO stop reason: the event file was never written.
  assert.equal(existsSync(crashed.eventFile as string), false);
  assert.equal(crashed.eventFile, engineEventFile(engineContext(crashWorkdir)));
});

test("CT-141-109: the engine verb `sleep` stays alive and leaves a marker", () => {
  const workdir = mkdtempSync(join(tmpdir(), "oracle-engine-"));
  const outcome = carryOutEngineStep(
    { verbs: ["sleep"], args: { ticks: 1 } },
    engineContext(workdir),
  );
  assert.equal(outcome.exitCode, ENGINE_EXIT_CODES.sleep);
  assert.equal(outcome.stopReason, ENGINE_STOP_REASONS.sleep);
  assert.ok(existsSync(join(workdir, ".specstride", "features", "001-greeting", "started")));
});

test("CT-141-109: the attempt of the engine stub is counted outside the working directory", () => {
  const stateDir = mkdtempSync(join(tmpdir(), "oracle-engine-state-"));
  assert.equal(engineAttempt(stateDir), 1);
  assert.equal(engineAttempt(stateDir), 2);
  assert.equal(engineAttempt(stateDir), 3);
  assert.equal(readFileSync(join(stateDir, "engine.attempts"), "utf8").trim(), "3");
});

test("CT-141-109: `recordStopReason` writes one line per end of a run", () => {
  const workdir = mkdtempSync(join(tmpdir(), "oracle-engine-"));
  const file = recordStopReason(engineContext(workdir), "stage-precondition");
  assert.equal(dirname(file).endsWith(join("features", "001-greeting")), true);
  const line = JSON.parse(readFileSync(file, "utf8").trim()) as Record<string, unknown>;
  assert.deepEqual(line, {
    event: "run_stop",
    reason: "stage-precondition",
    feature: "001-greeting",
    attempt: 1,
  });
});

test("CT-141-109: the verbs of a verification command stub", () => {
  const workdir = mkdtempSync(join(tmpdir(), "oracle-verify-"));
  const said: string[] = [];
  const context = {
    workdir,
    tickMilliseconds: 1,
    stdout: (t: string): void => void said.push(`out:${t}`),
    stderr: (t: string): void => void said.push(`err:${t}`),
  };
  assert.equal(carryOutVerificationStep({ verbs: ["pass"] }, context), 0);
  assert.equal(
    carryOutVerificationStep({ verbs: ["fail"], args: { code: 3, step: 2 } }, context),
    3,
  );
  assert.equal(carryOutVerificationStep({ verbs: ["slow"], args: { ticks: 1 } }, context), 0);
  assert.equal(
    carryOutVerificationStep(
      { verbs: ["slow"], args: { ticks: 1, then: "fail", code: 9 } },
      context,
    ),
    9,
  );
  assert.equal(
    carryOutVerificationStep(
      { verbs: ["write-result"], args: { path: "verification/result.json" } },
      context,
    ),
    0,
  );
  // Read back independently.
  assert.deepEqual(JSON.parse(readFileSync(join(workdir, "verification", "result.json"), "utf8")), {
    result: "passed",
  });
  assert.ok(said.some((s) => s.startsWith("err:") && s.includes("failed at step 2")));
  // A path outside the fixture is refused (§O.3, rule 5).
  assert.throws(
    () =>
      carryOutVerificationStep({ verbs: ["write-result"], args: { path: "/etc/passwd" } }, context),
    VerificationStubError,
  );
});

test("CT-141-109: the verbs of the plugin installer stub", () => {
  const home = mkdtempSync(join(tmpdir(), "oracle-home-"));
  const said: string[] = [];
  const context = {
    home,
    fixtureDir: home,
    tickMilliseconds: 1,
    stdout: (t: string): void => void said.push(t),
    stderr: (t: string): void => void said.push(t),
  };
  assert.equal(carryOutInstallerStep({ verbs: ["install"] }, context), 0);
  // The profile entry is in the HERMETIC home, read back off disk.
  assert.deepEqual(JSON.parse(readFileSync(join(home, ".dsh", "profile.json"), "utf8")), {
    plugin: "installed",
  });
  assert.equal(carryOutInstallerStep({ verbs: ["fail"] }, context), 7);
  assert.equal(carryOutInstallerStep({ verbs: ["fail"], args: { code: 4 } }, context), 4);
  // `hang` is the installer timeout and is never called here: calling it would
  // never return. Its presence in the vocabulary is what the fixture declares.
  assert.ok(INSTALLER_VERBS.includes("hang"));
});

test("CT-141-109: the verbs of the telemetry sink stub", async () => {
  const store = join(mkdtempSync(join(tmpdir(), "oracle-sink-")), "payloads.jsonl");

  const accepting = await startTelemetrySinkStub({ verb: "accept", store });
  const accepted = await fetch(`${accepting.address}/loki/api/v1/push`, {
    method: "POST",
    body: JSON.stringify({ streams: [] }),
  });
  assert.equal(accepted.status, ACCEPTED_STATUS);
  await accepting.close();
  // Read the store back off disk: the payload is there, with the path it came in on.
  const stored = readFileSync(store, "utf8")
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l) as Record<string, unknown>);
  assert.equal(stored.length, 1);
  assert.equal(stored[0]?.["path"], "/loki/api/v1/push");
  assert.equal(stored[0]?.["body"], JSON.stringify({ streams: [] }));

  const refusing = await startTelemetrySinkStub({ verb: "refuse" });
  const refused = await fetch(`${refusing.address}/v1/traces`, { method: "POST", body: "{}" });
  assert.equal(refused.status, DEFAULT_REFUSED_STATUS);
  assert.deepEqual([...refusing.payloads], []);
  await refusing.close();

  // `down` listens on nothing: the address is given and the connection is refused.
  const down = await startTelemetrySinkStub({ verb: "down", port: 1 });
  assert.equal(down.server, undefined);
  assert.equal(down.address, "http://127.0.0.1:1");
  await down.close();

  await assert.rejects(
    () => startTelemetrySinkStub({ verb: "accept-everything" }),
    (error: unknown) =>
      error instanceof SinkStubError && /is no verb of the telemetry sink stub/.test(error.message),
  );
});
