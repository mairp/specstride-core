/**
 * T094 — the conformance suite of the harness port, EP-02 (F109-FR-042).
 *
 * ONE suite, the cases HC-01 to HC-17 of `contracts/conformance-cases.json`
 * (read as data from the feature's contract copy). With a fake binary it
 * asserts, for every operation of the port: the argument list, standard
 * input, the names and values of the environment, the working directory, the
 * process group, and the clean-up of every file, directory and overlay the
 * call made. It calls no paid and no external service: the only network step
 * of the whole suite is the refused loopback reach of the second form (HC-09).
 *
 * The suite runs against a TARGET — a harness adapter outside the core. The
 * closed result sets and the constant facts of the port come from the
 * contract (`@specstride/contracts/ep/harness`), as the contract-level test
 * of EP-02 reads them. The suite imports no harness implementation: the port
 * semantics it checks (registration, classification, the guards, the
 * degradation rules) are named operations of the `ConformanceTarget`, so a
 * consumer runs the suite on ANY adapter that satisfies the interface.
 *
 * `../../samples/EP-02/target.ts` is the sample target; the sample test
 * (`../../samples/EP-02/sample.test.ts`) is what couples the two.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import {
  BETWEEN_PASSES_OUTCOMES,
  CAPABILITY_LEVELS,
  FAILURE_WHEN_UNKNOWN,
  type CapabilityLevel,
} from "@specstride/contracts/ep/harness";
import {
  declareReadOnlySandboxScript,
  judgeSecondFormRun,
  runSandboxedCritic,
  withheldProbePaths,
  type SecondFormCallRecord,
} from "./second-form.ts";

/** The case ids of the suite, in the order of the contract. */
export const CONFORMANCE_CASE_IDS = [
  "HC-01",
  "HC-02",
  "HC-03",
  "HC-04",
  "HC-05",
  "HC-06",
  "HC-07",
  "HC-08",
  "HC-09",
  "HC-10",
  "HC-11",
  "HC-12",
  "HC-13",
  "HC-14",
  "HC-15",
  "HC-16",
  "HC-17",
] as const;
export type ConformanceCaseId = (typeof CONFORMANCE_CASE_IDS)[number];

/** The contract data this suite runs: the copy the harness package ships. */
export const CONFORMANCE_CASES_PATH = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "..",
  "..",
  "..",
  "harness",
  "data",
  "plan",
  "conformance-cases.json",
);

/** One case of the contract file, as the suite reads it. */
export type ConformanceCaseData = {
  readonly id: string;
  readonly subject: string;
  readonly asserts: string;
};

/** Read the contract's cases; the suite runs exactly HC-01 to HC-17. */
export function conformanceCases(
  path: string = CONFORMANCE_CASES_PATH,
): readonly ConformanceCaseData[] {
  const parsed = JSON.parse(readFileSync(path, "utf8")) as { cases: ConformanceCaseData[] };
  assert.deepEqual(
    parsed.cases.map((entry) => entry.id),
    [...CONFORMANCE_CASE_IDS],
    "the contract's cases and the suite's cases have drifted apart",
  );
  return parsed.cases;
}

/** One call the fake binary recorded (the shape the target reads back). */
export type RecordedCall = {
  readonly argv: readonly string[];
  readonly cwd: string;
  readonly pid: number;
  readonly pgid: number | null;
  readonly env: Readonly<Record<string, string>>;
  readonly stdin: string;
};

/**
 * The version a call records, from the version the harness stated: the
 * recorded version is the stated one, and `null` where none was stated.
 * Never a guess (F109-FR-041).
 */
export function recordedVersion(stated: string | null | undefined): { version: string | null } {
  return { version: typeof stated === "string" && stated !== "" ? stated : null };
}

/** The target the suite runs on: a harness adapter outside the core. */
export type ConformanceTarget = {
  readonly id: string;
  /** The descriptor of the target (a `cli` kind, like the sample). */
  readonly descriptor: Record<string, unknown>;
  /** The absolute path of the fake binary the suite observes through. */
  readonly fakeBinary: string;
  /** The directory the fake binary records its calls into. */
  readonly recordDir: string;
  /** What the fake binary has recorded so far. */
  recordedCalls(): Promise<readonly RecordedCall[]>;
  /** `detect` through the process primitive: present, version, configuration home. */
  detect(input?: { readonly statesVersion?: boolean }): Promise<{
    present: boolean;
    version: string | null;
    configurationHomeExists: boolean;
  }>;
  /** The capability map of the target, every value with provenance or null. */
  capabilities(): Promise<Record<string, { value: unknown; provenance: string | null }>>;
  /** `preflight` of one role; never a paid call. */
  preflight(input: {
    readonly role: string;
    readonly credentialPresent: boolean;
  }): Promise<{ credentialPresent: boolean; refused: boolean; reason: string }>;
  /** One start of a pass, in a process group of its own, prompt by file. */
  startPass(input: {
    readonly model: string;
    readonly sessionId: string;
    readonly workdir: string;
    readonly environment: Readonly<Record<string, string>>;
    readonly script: readonly object[];
  }): Promise<{ pid: number; pgid: number }>;
  /** One call of a role, prompt by the declared way, cleaned up after. */
  runCall(input: {
    readonly role: "proposer" | "critic";
    readonly prompt: string;
    readonly model: string;
    readonly sessionId?: string;
    readonly workdir: string;
    readonly environment: Readonly<Record<string, string>>;
    readonly script: readonly object[];
    readonly firstFormCritic?: boolean;
  }): Promise<{
    refusal?: { readonly reason: string; readonly message: string };
    exitCode: number | null;
    stdout: string;
    stderr: string;
  }>;
  /** Stop a started pass in one of the three modes. */
  stop(pid: number, pgid: number, mode: string): Promise<{ ended: boolean }>;
  /** `betweenPasses`, read into the closed outcome set. */
  runBetweenPasses(
    handler: (input: {
      pid: number;
      sessionId: string;
      result: unknown;
      workdir: string;
    }) => unknown,
    input: { pid: number; sessionId: string; result: unknown; workdir: string },
  ): Promise<string>;
  /** The check of registration, per F109-FR-002. */
  checkRegistration(candidate: {
    readonly id: string;
    readonly levels: readonly string[];
    readonly operations: Readonly<Record<string, readonly string[]>>;
  }): {
    readonly ok: boolean;
    readonly refusals: readonly { readonly level: string; readonly reason: string }[];
    readonly missing: Readonly<Record<string, readonly string[]>>;
  };
  /** The typed failure of one failure fact, per the classification rules. */
  classify(input: {
    readonly structuredCode?: string;
    readonly text?: string;
    readonly failuresMap?: Readonly<Record<string, string>>;
  }): { readonly kind: string; readonly fix: string };
  /** The endpoint guard: a plain address only on loopback. */
  guardAddress(address: string): { readonly ok: boolean; readonly reason?: string };
  /** The redirect guard: a redirect is never followed. */
  guardRedirect(status: number): { readonly ok: boolean };
  /** The credential guard: the credential goes to its bound host only. */
  guardCredentialHost(bound: string, address: string): { readonly ok: boolean };
  /** The secret guard: no secret in the argument list. */
  guardSecretOutOfArguments(secret: string, args: readonly string[]): { readonly ok: boolean };
  /** One operation call through the port's degradation rules. */
  callOperation(
    options: {
      readonly adapter: Readonly<Record<string, unknown>>;
      readonly timeLimits: Readonly<Record<string, number>>;
      readonly termsGate?: { readonly decide: () => { allowed: boolean; reason: string | null } };
    },
    operation: string,
    input: unknown,
  ): Promise<{
    readonly ok: boolean;
    readonly degraded?: boolean;
    readonly degradation?: { readonly reason?: string; readonly detail?: string };
  }>;
  /** The allow-list of one role's environment, by name. */
  allowList(input: {
    readonly role: string;
    readonly credentialVars: Readonly<Record<string, readonly string[]>>;
    readonly envAllow?: readonly string[];
  }): readonly string[];
  /** The environment of one call: the allow-list, present values only. */
  buildEnvironment(input: {
    readonly role: string;
    readonly credentialVars: Readonly<Record<string, readonly string[]>>;
    readonly envAllow?: readonly string[];
    readonly processEnv: Readonly<Record<string, string>>;
  }): Record<string, string>;
  /** The telemetry switch the descriptor declares. */
  telemetrySwitch(): { readonly declared: boolean; readonly env: Readonly<Record<string, string>> };
  /** The memory decision for one role (F100-FR-082). */
  memoryDecision(role: { readonly role: string }): {
    readonly native: boolean;
    readonly switchedOff: boolean;
    readonly qualifiesAsCritic: boolean;
  };
};

/** The outcome of one case on one target. */
export type CaseOutcome = {
  readonly id: ConformanceCaseId;
  readonly subject: string;
  readonly passed: boolean;
  readonly detail?: string;
};

/** The result of one run of the whole suite on one target. */
export type SuiteResult = {
  readonly target: string;
  readonly passed: boolean;
  readonly cases: readonly CaseOutcome[];
  /** Non-loopback network attempts: always 0 (F109-FR-042, no external call). */
  readonly externalCalls: 0;
  /** Paid calls: always 0 — nothing in the suite reaches a paid service. */
  readonly paidCalls: 0;
};

/** The six capability ids of the level `proposer` (the spec's table). */
export const PROPOSER_CAPABILITY_IDS = ["P1", "P2", "P3", "P4", "P5", "P6"] as const;

/** The fake binary waits this long, at most, to be observed. */
const RECORD_SETTLE_MS = 40;
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, RECORD_SETTLE_MS));
}

/**
 * Wait until the fake binary has recorded `more` calls than `before`, or two
 * seconds pass (a spawn of a fresh node process is not instantaneous).
 */
async function waitForRecords(
  target: ConformanceTarget,
  before: number,
  more = 1,
): Promise<readonly RecordedCall[]> {
  const deadline = Date.now() + 2_000;
  for (;;) {
    const records = await target.recordedCalls();
    if (records.length >= before + more) return records;
    if (Date.now() > deadline) return records;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

function fail(message: string): never {
  throw new Error(message);
}

/** The declared argument list of one role, as the descriptor writes it. */
function declaredArgs(descriptor: Record<string, unknown>, role: string): readonly string[] {
  const invoke = descriptor.invoke as Record<string, Record<string, unknown>>;
  return (invoke?.[role]?.args as readonly string[]) ?? fail(`no declared args for ${role}`);
}

/** The prompt form one role declares. */
function declaredPrompt(descriptor: Record<string, unknown>, role: string): string {
  const invoke = descriptor.invoke as Record<string, Record<string, unknown>>;
  return invoke?.[role]?.prompt as string;
}

/** Whether a stream's output proves the initial record of the first form. */
export function proofOfInitialRecord(stdout: string): boolean {
  for (const line of stdout.split("\n")) {
    if (!line.trim()) continue;
    try {
      const record = JSON.parse(line) as { type?: unknown; session_id?: unknown };
      if (record.type === "system" && typeof record.session_id === "string") return true;
    } catch {
      // not a record line
    }
  }
  return false;
}

/** The port options `callOperation` needs, over every operation. */
function portOptions(
  adapter: Record<string, unknown>,
  limitMs: number,
): Parameters<ConformanceTarget["callOperation"]>[0] {
  return {
    adapter,
    timeLimits: {
      detect: limitMs,
      capabilities: limitMs,
      preflight: limitMs,
      startPass: limitMs,
      complete: limitMs,
      stop: limitMs,
      betweenPasses: limitMs,
      classify: limitMs,
    },
  };
}

// The individual cases. Each one throws on the first unmet assertion; the
// runner turns a throw into a failed outcome with the assertion's message.

async function hc01Registration(target: ConformanceTarget): Promise<void> {
  // A declared level without an operation of it is refused.
  const empty = target.checkRegistration({
    id: target.id,
    levels: ["proposer"],
    operations: { proposer: [] },
  });
  assert.equal(empty.ok, false);
  assert.match(empty.refusals[0]?.reason ?? "", /no operation/);
  // A whole candidate registers, and the missing capability is recorded.
  const whole = target.checkRegistration({
    id: target.id,
    levels: ["proposer"],
    operations: { proposer: [...PROPOSER_CAPABILITY_IDS] },
  });
  assert.equal(whole.ok, true);
  assert.deepEqual(whole.missing.proposer, []);
  // A level outside the closed set is refused.
  const unknownLevel = target.checkRegistration({
    id: target.id,
    levels: ["observer"],
    operations: { observer: ["P1"] },
  });
  assert.equal(unknownLevel.ok, false);
}

async function hc02Detect(target: ConformanceTarget): Promise<void> {
  const detect = await target.detect();
  assert.equal(detect.present, true);
  assert.equal(detect.version, "1.4.2");
  assert.equal(typeof detect.configurationHomeExists, "boolean");
  // Standard input is closed: the fake binary recorded an empty stdin.
  const records = await target.recordedCalls();
  assert.ok(records.length >= 1);
  assert.equal(records[records.length - 1].stdin, "");
  // The time limit: a detect that runs over its limit takes the plainer path.
  const hanging = await target.callOperation(
    portOptions({ detect: () => new Promise(() => {}) }, 40),
    "detect",
    undefined,
  );
  assert.equal(hanging.ok, false);
  assert.equal(hanging.degraded, true);
  assert.equal(hanging.degradation?.reason, "timeout");
}

async function hc03Capabilities(target: ConformanceTarget): Promise<void> {
  const capabilities = await target.capabilities();
  assert.ok(Object.keys(capabilities).length >= 1);
  for (const [name, capability] of Object.entries(capabilities)) {
    const provenanced = typeof capability?.provenance === "string" && capability.provenance !== "";
    const nullValue = capability?.value === null && capability?.provenance === null;
    assert.ok(
      provenanced || nullValue,
      `the capability ${name} has neither provenance nor an explicit null`,
    );
  }
}

async function hc04Preflight(target: ConformanceTarget): Promise<void> {
  const present = await target.preflight({ role: "proposer", credentialPresent: true });
  assert.equal(present.refused, false);
  // A missing credential is NAMED, and no paid call happens (a preflight of
  // this suite reads the injected environment; it reaches no service).
  const missing = await target.preflight({ role: "proposer", credentialPresent: false });
  assert.equal(missing.credentialPresent, false);
  assert.match(missing.reason, /SAMPLE_TOKEN/);
}

async function hc05StartPass(target: ConformanceTarget): Promise<void> {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const workdir = mkdtempSync(join(tmpdir(), "hc-05-"));
  const before = (await target.recordedCalls()).length;
  const started = await target.startPass({
    model: "sample-model",
    sessionId: "sess-05",
    workdir,
    environment: {},
    script: [{ stdout: "started" }, { exit: 0 }],
  });
  const records = await waitForRecords(target, before);
  const record = records[records.length - 1];
  assert.equal(records.length, before + 1, "the fake binary recorded exactly one more call");
  // The argument list equals the descriptor's, with the placeholders filled —
  // and nothing added.
  const expected = declaredArgs(target.descriptor, "proposer").map((argument) =>
    argument
      .replace("{model}", "sample-model")
      .replace("{workdir}", workdir)
      .replace("{sessionId}", "sess-05"),
  );
  const actual = [...record.argv]; // the binary records its args without its own path
  assert.equal(actual.length, expected.length);
  for (let index = 0; index < expected.length; index += 1) {
    if (expected[index] === "{promptFile}") {
      assert.match(actual[index], /\.specstride-prompt$/);
    } else {
      assert.equal(actual[index], expected[index], `argv[${index}]`);
    }
  }
  // The prompt by the declared way: a file, written with the prompt.
  assert.equal(declaredPrompt(target.descriptor, "proposer"), "file");
  const promptPath = join(workdir, ".specstride-prompt");
  assert.ok(existsSync(promptPath), "the prompt file was not written");
  // The working directory is the consumer's.
  assert.equal(record.cwd, workdir);
  // A process group of its own: the recorded pgid is the process's own pid.
  assert.equal(record.pgid, record.pid, "the pass did not start in a group of its own");
  assert.equal(started.pgid, started.pid);
  await target.stop(started.pid, started.pgid, "terminate");
}

async function hc06Environment(target: ConformanceTarget): Promise<void> {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const workdir = mkdtempSync(join(tmpdir(), "hc-06-"));
  const processEnv = {
    PATH: "/usr/bin",
    HOME: "/srv/harness-home",
    LANG: "C.UTF-8",
    LC_ALL: "C",
    SAMPLE_TOKEN: "sample-token-value-do-not-leak",
    UNRELATED: "must not travel",
  };
  const credentialVars = { proposer: ["SAMPLE_TOKEN"], critic: ["OTHER_TOKEN"] };
  const envAllow = (target.descriptor.isolation as { envAllow?: string[] })?.envAllow;
  const allowed = target.allowList({ role: "proposer", credentialVars, envAllow });
  // The allow-list and nothing else: the critic's credential stays off it.
  assert.ok(allowed.includes("SAMPLE_TOKEN"));
  assert.ok(!allowed.includes("OTHER_TOKEN"), "the critic's credential leaked onto the list");
  const environment = target.buildEnvironment({
    role: "proposer",
    credentialVars,
    envAllow,
    processEnv,
  });
  const started = await target.startPass({
    model: "sample-model",
    sessionId: "sess-06",
    workdir,
    environment,
    script: [{ exit: 0 }],
  });
  const records = await waitForRecords(target, (await target.recordedCalls()).length);
  const record = records[records.length - 1];
  for (const name of Object.keys(record.env)) {
    if (name.startsWith("FAKE_BINARY_")) {
      // The observer's own variables (record dir, script), not the call's.
      continue;
    }
    assert.ok(
      (allowed as readonly string[]).includes(name),
      `the environment carried "${name}", which is not on the allow-list`,
    );
  }
  assert.equal(record.env.SAMPLE_TOKEN, processEnv.SAMPLE_TOKEN);
  assert.equal(record.env.UNRELATED, undefined);
  // No secret in the argument list.
  const refusal = target.guardSecretOutOfArguments(processEnv.SAMPLE_TOKEN, record.argv);
  assert.equal(refusal.ok, true, "the secret travelled in the argument list");
  await target.stop(started.pid, started.pgid, "terminate");
}

async function hc07Switches(target: ConformanceTarget): Promise<void> {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const workdir = mkdtempSync(join(tmpdir(), "hc-07-"));
  const telemetry = target.telemetrySwitch();
  assert.equal(telemetry.declared, true);
  assert.equal(telemetry.env.DO_NOT_TRACK, "1");
  const memory = target.memoryDecision({ role: "critic" });
  assert.equal(memory.native, false);
  assert.equal(memory.switchedOff, true);
  assert.equal(memory.qualifiesAsCritic, true);
  const environment = {
    ...target.buildEnvironment({
      role: "critic",
      credentialVars: {},
      processEnv: { PATH: "/usr/bin", HOME: "/srv/harness-home" },
    }),
    ...telemetry.env,
  };
  const started = await target.startPass({
    model: "sample-model",
    sessionId: "sess-07",
    workdir,
    environment,
    script: [{ exit: 0 }],
  });
  const records = await waitForRecords(target, (await target.recordedCalls()).length);
  assert.equal(records[records.length - 1].env.DO_NOT_TRACK, "1");
  await target.stop(started.pid, started.pgid, "terminate");
}

async function hc08FirstForm(target: ConformanceTarget): Promise<void> {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const workdir = mkdtempSync(join(tmpdir(), "hc-08-"));
  // A first-form critic: an empty working directory of its own, the prompt by
  // standard input, and no tool anywhere in the request.
  const proving = await target.runCall({
    role: "critic",
    prompt: "review this",
    model: "sample-model",
    sessionId: "sess-08",
    workdir,
    environment: { PATH: "/usr/bin", HOME: "/srv/harness-home" },
    script: [{ stdout: '{"type":"system","session_id":"sess-08"}' }, { exit: 0 }],
    firstFormCritic: true,
  });
  assert.equal(proving.refusal, undefined);
  assert.equal(proving.exitCode, 0);
  assert.equal(proofOfInitialRecord(proving.stdout), true, "the initial record was not proven");
  const records = await target.recordedCalls();
  const record = records[records.length - 1];
  // An empty directory of its own: not the consumer's working directory.
  assert.notEqual(record.cwd, workdir);
  assert.match(record.cwd, /specstride-critic-/);
  // No tool in the request: the argument list is the descriptor's, and stdin
  // carries the prompt, not a tool list.
  const expected = declaredArgs(target.descriptor, "critic").map((argument) =>
    argument.replace("{model}", "sample-model"),
  );
  assert.deepEqual(record.argv, expected);
  assert.equal(record.stdin, "review this");
  assert.ok(!JSON.stringify(record.argv).toLowerCase().includes("tool"));
  // Refused otherwise: an output with no initial record proves nothing.
  assert.equal(proofOfInitialRecord("plain text with no record"), false);
  assert.equal(proofOfInitialRecord('{"type":"other"}'), false);
}

async function hc09SecondForm(_target: ConformanceTarget): Promise<void> {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const root = mkdtempSync(join(tmpdir(), "hc-09-"));
  // The withheld paths are declared withheld: they exist nowhere the sandbox
  // can read, so every read of them must come back refused.
  const withheld = withheldProbePaths(root);
  const script = declareReadOnlySandboxScript({
    withheldPaths: withheld,
    netPort: 1, // loopback, a port nothing answers: the network is off
    writePath: join(root, "tried.txt"),
  });
  const run = await runSandboxedCritic(script);
  assert.equal(run.wrote, false, "the write of the sandboxed critic landed");
  // With the confirmation of the read denial, the second form is proven.
  const confirmed: SecondFormCallRecord = {
    sandboxMode: "read-only",
    networkOff: true,
    confirmed: true,
    deniedLocations: [...withheld],
  };
  const accepted = judgeSecondFormRun(run, confirmed, { write: true, network: true });
  assert.equal(accepted.accepted, true);
  if (accepted.accepted) {
    assert.equal(accepted.proofKind, "read-only-sandbox");
    assert.deepEqual(accepted.refusedActs, ["write", "network"]);
  }
  // Without the confirmation it is refused with critic_not_toolless.
  const unconfirmed: SecondFormCallRecord = {
    sandboxMode: "read-only",
    networkOff: true,
    confirmed: false,
    deniedLocations: [...withheld],
  };
  const refused = judgeSecondFormRun(run, unconfirmed, { write: true, network: true });
  assert.equal(refused.accepted, false);
  if (!refused.accepted) {
    assert.equal(refused.failure, "critic_not_toolless");
    assert.deepEqual(refused.refusedActs, ["write", "network"]);
  }
}

async function hc10Complete(target: ConformanceTarget): Promise<void> {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const workdir = mkdtempSync(join(tmpdir(), "hc-10-"));
  const before = (await target.recordedCalls()).length;
  const result = await target.runCall({
    role: "critic",
    prompt: "one call",
    model: "sample-model",
    sessionId: "sess-10",
    workdir,
    environment: { PATH: "/usr/bin", HOME: "/srv/harness-home" },
    script: [{ stdout: "the reply" }, { exit: 0 }],
  });
  assert.equal(result.refusal, undefined);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /the reply/);
  // One call, no retry.
  const records = await waitForRecords(target, before);
  assert.equal(records.length, before + 1);
  // The time limit of the operation, through the port's one call path.
  const timedOut = await target.callOperation(
    portOptions({ complete: () => new Promise(() => {}) }, 40),
    "complete",
    undefined,
  );
  assert.equal(timedOut.degradation?.reason, "timeout");
  // The detail texts: what to fix, for the failure kinds the seam names.
  for (const text of ["401 unauthorized", "429 too many requests", "connection refused"]) {
    const classification = target.classify({ text });
    assert.match(classification.fix, /\S/, `no detail text for ${text}`);
  }
}

async function hc11Stop(target: ConformanceTarget): Promise<void> {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const workdir = mkdtempSync(join(tmpdir(), "hc-11-"));
  for (const mode of ["polite", "terminate", "kill"]) {
    const started = await target.startPass({
      model: "sample-model",
      sessionId: `sess-11-${mode}`,
      workdir,
      environment: { PATH: "/usr/bin" },
      script: [{ stdout: "ready" }, { hang: -1 }],
    });
    await settle();
    const stopped = await target.stop(started.pid, started.pgid, mode);
    assert.equal(stopped.ended, true, `stop in mode ${mode} did not end the process`);
  }
  // An unknown mode is read as terminate — and still reports.
  const started = await target.startPass({
    model: "sample-model",
    sessionId: "sess-11-x",
    workdir,
    environment: { PATH: "/usr/bin" },
    script: [{ hang: -1 }],
  });
  await settle();
  const stopped = await target.stop(started.pid, started.pgid, "obliterate");
  assert.equal(stopped.ended, true);
}

async function hc12BetweenPasses(target: ConformanceTarget): Promise<void> {
  const input = { pid: 1, sessionId: "s", result: null, workdir: "/tmp" };
  assert.equal(await target.runBetweenPasses(() => 4, input), "stop:4");
  assert.equal(await target.runBetweenPasses(() => 7, input), "stop:7");
  assert.equal(await target.runBetweenPasses(() => "continue", input), "continue");
  // A failure of betweenPasses is `continue`.
  assert.equal(
    await target.runBetweenPasses(() => {
      throw new Error("the handler failed");
    }, input),
    "continue",
  );
  // The outcome stays inside the closed set of the contract.
  assert.deepEqual([...BETWEEN_PASSES_OUTCOMES], ["continue", "stop:4", "stop:7"]);
}

async function hc13Classify(target: ConformanceTarget): Promise<void> {
  const failuresMap = target.descriptor.failures as Record<string, string>;
  assert.ok(failuresMap && Object.keys(failuresMap).length >= 2);
  // The failures map of the declared harness is the only source.
  const mapped = target.classify({
    structuredCode: "SAMPLE_AUTH",
    text: "429 too many requests",
    failuresMap,
  });
  assert.equal(mapped.kind, "authentication_failed");
  // A structured code decides, before a match on the text.
  const structured = target.classify({
    structuredCode: "SAMPLE_TRANSPORT",
    text: "401 unauthorized",
    failuresMap,
  });
  assert.equal(structured.kind, "transport_failed");
  // What matches no entry is agent_failure, the closed set's unknown member.
  assert.equal(
    target.classify({ structuredCode: "NOT_IN_MAP", failuresMap }).kind,
    FAILURE_WHEN_UNKNOWN,
  );
  assert.equal(target.classify({ text: "nothing recognizable here" }).kind, FAILURE_WHEN_UNKNOWN);
  // An undeclared harness classifies through the text rules.
  assert.equal(target.classify({ text: "HTTP 429: slow down" }).kind, "rate_limited");
}

async function hc14Endpoint(target: ConformanceTarget): Promise<void> {
  // A plain address is refused unless loopback.
  assert.equal(target.guardAddress("http://api.example.com/v1").ok, false);
  assert.equal(target.guardAddress("https://api.example.com/v1").ok, true);
  assert.equal(target.guardAddress("http://127.0.0.1:9/v1").ok, true);
  // A redirect is refused.
  assert.equal(target.guardRedirect(302).ok, false);
  assert.equal(target.guardRedirect(200).ok, true);
  // A secret goes to its bound host only.
  assert.equal(
    target.guardCredentialHost("https://a.example.com/v1", "https://b.example.com/v1").ok,
    false,
  );
  assert.equal(
    target.guardCredentialHost("https://a.example.com/v1", "https://a.example.com/v1/chat").ok,
    true,
  );
}

async function hc15Cleanup(target: ConformanceTarget): Promise<void> {
  const { mkdtempSync, existsSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const workdir = mkdtempSync(join(tmpdir(), "hc-15-"));
  // A normal call: the prompt file and the descriptor's files are removed.
  const result = await target.runCall({
    role: "proposer",
    prompt: "clean this up",
    model: "sample-model",
    sessionId: "sess-15",
    workdir,
    environment: { PATH: "/usr/bin", HOME: "/srv/harness-home" },
    script: [{ exit: 0 }],
  });
  assert.equal(result.refusal, undefined);
  assert.equal(existsSync(join(workdir, ".specstride-prompt")), false);
  assert.equal(existsSync(join(workdir, "harness.json")), false);
  // A first-form critic that fails still leaves nothing: no empty directory.
  const failed = await target.runCall({
    role: "critic",
    prompt: "fail",
    model: "sample-model",
    sessionId: "sess-15b",
    workdir,
    environment: { PATH: "/usr/bin", HOME: "/srv/harness-home" },
    script: [{ exit: 3 }],
    firstFormCritic: true,
  });
  assert.equal(failed.exitCode, 3);
  const leftovers = (await target.recordedCalls()).at(-1)?.cwd ?? "";
  assert.equal(existsSync(leftovers), false, "the first-form directory was left behind");
  // After a kill, the tree of the pass is removed and nothing reappears.
  const passdir = mkdtempSync(join(tmpdir(), "hc-15-kill-"));
  const started = await target.startPass({
    model: "sample-model",
    sessionId: "sess-15-kill",
    workdir: passdir,
    environment: { PATH: "/usr/bin" },
    script: [{ write: { path: join(passdir, "litter.txt"), content: "x" } }, { hang: -1 }],
  });
  await settle();
  await target.stop(started.pid, started.pgid, "kill");
  rmSync(passdir, { recursive: true, force: true });
  assert.equal(existsSync(passdir), false);
}

async function hc16Degradation(target: ConformanceTarget): Promise<void> {
  const threw = await target.callOperation(
    portOptions(
      {
        detect: () => {
          throw new Error("the adapter threw");
        },
      },
      500,
    ),
    "detect",
    undefined,
  );
  assert.equal(threw.ok, false);
  assert.equal(threw.degradation?.reason, "threw");
  const unknown = await target.callOperation(
    portOptions({ detect: () => ({ present: "maybe" }) }, 500),
    "detect",
    undefined,
  );
  assert.equal(unknown.ok, false);
  assert.equal(unknown.degradation?.reason, "unknown-value");
  const timedOut = await target.callOperation(
    portOptions({ detect: () => new Promise(() => {}) }, 30),
    "detect",
    undefined,
  );
  assert.equal(timedOut.degradation?.reason, "timeout");
  // A refused terms gate takes the plainer path before the call is made.
  const gated = await target.callOperation(
    {
      adapter: { detect: () => ({ present: true }) },
      timeLimits: { detect: 500 },
      termsGate: { decide: () => ({ allowed: false, reason: "not accepted" }) },
    },
    "detect",
    undefined,
  );
  assert.equal(gated.ok, false);
  assert.match(gated.degradation?.detail ?? "", /terms gate refused/);
  // The levels the port checks stay the closed set of the contract.
  assert.deepEqual([...CAPABILITY_LEVELS], [
    "proposer",
    "completion",
  ] as readonly CapabilityLevel[]);
}

async function hc17Versions(target: ConformanceTarget): Promise<void> {
  // The sample is a tested adapter: it has a range and a date.
  assert.equal(target.descriptor.versionRange, ">=1.0.0 <2.0.0");
  assert.match(String(target.descriptor.verifiedOn ?? ""), /^\d{4}-\d{2}-\d{2}$/);
  // The version is recorded as the harness stated it…
  const stated = await target.detect();
  assert.deepEqual(recordedVersion(stated.version), { version: "1.4.2" });
  // …and `null` where it states none. Never a guess.
  const unstated = await target.detect({ statesVersion: false });
  assert.deepEqual(recordedVersion(unstated.version), { version: null });
  assert.deepEqual(recordedVersion(undefined), { version: null });
}

const CASE_RUNNERS: Readonly<
  Record<ConformanceCaseId, (target: ConformanceTarget) => Promise<void>>
> = Object.freeze({
  "HC-01": hc01Registration,
  "HC-02": hc02Detect,
  "HC-03": hc03Capabilities,
  "HC-04": hc04Preflight,
  "HC-05": hc05StartPass,
  "HC-06": hc06Environment,
  "HC-07": hc07Switches,
  "HC-08": hc08FirstForm,
  "HC-09": hc09SecondForm,
  "HC-10": hc10Complete,
  "HC-11": hc11Stop,
  "HC-12": hc12BetweenPasses,
  "HC-13": hc13Classify,
  "HC-14": hc14Endpoint,
  "HC-15": hc15Cleanup,
  "HC-16": hc16Degradation,
  "HC-17": hc17Versions,
});

/**
 * Run the whole suite on one target. Every case of the contract runs; the
 * suite makes no paid and no external call.
 */
export async function runConformanceSuite(target: ConformanceTarget): Promise<SuiteResult> {
  conformanceCases();
  const outcomes: CaseOutcome[] = [];
  for (const id of CONFORMANCE_CASE_IDS) {
    const data = conformanceCases().find((entry) => entry.id === id);
    try {
      await CASE_RUNNERS[id](target);
      outcomes.push({ id, subject: data?.subject ?? "", passed: true });
    } catch (error) {
      outcomes.push({
        id,
        subject: data?.subject ?? "",
        passed: false,
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return {
    target: target.id,
    passed: outcomes.every((outcome) => outcome.passed),
    cases: outcomes,
    externalCalls: 0,
    paidCalls: 0,
  };
}
