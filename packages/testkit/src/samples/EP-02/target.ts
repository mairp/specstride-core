/**
 * T094 — the SAMPLE TARGET of the conformance suite, EP-02 (F109-FR-042).
 *
 * A harness adapter that lives OUTSIDE the core, in the source tree of the
 * testkit package. It composes only what a consumer composes: the process
 * primitive of the kernel (stdin closed, a group and a session of its own),
 * the closed sets of the contract (`@specstride/contracts/ep/harness`) and
 * its own reading of the descriptor. It imports NO harness implementation —
 * the engine reaches a harness only through its declared port, and this file
 * is the proof that an adapter outside the core needs nothing else. It plays
 * the fake binary of `../../conformance/EP-02/fake-binary.mjs` as its harness.
 *
 * The suite in `../../conformance/EP-02/suite.ts` imports none of this file;
 * it runs on ANY target that satisfies `ConformanceTarget`. The sample test
 * (`./sample.test.ts`) is what couples the two.
 */
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FAILURE_WHEN_UNKNOWN,
  FAILURES,
  type HarnessFailure,
} from "@specstride/contracts/ep/harness";
import { processPrimitive } from "@specstride/kernel";
import type { ConformanceTarget, RecordedCall } from "../../conformance/EP-02/suite.ts";

/** The fake binary the sample harness runs. */
const FAKE_BINARY = fileURLToPath(
  new URL("../../conformance/EP-02/fake-binary.mjs", import.meta.url),
);

/** The credential the sample declares for the proposer role. */
export const SAMPLE_CREDENTIAL_VAR = "SAMPLE_TOKEN";

/**
 * The descriptor of the sample harness: a `cli` kind, proposer prompt by
 * file, critic prompt by standard input, telemetry switched off through the
 * environment, a declared range and date (a tested adapter), and a failures
 * map with two entries.
 */
export const SAMPLE_DESCRIPTOR: Record<string, unknown> = Object.freeze({
  descriptorVersion: 1,
  id: "ep02-sample",
  displayName: "EP-02 conformance sample",
  kind: "cli",
  provider: { id: "ep02", termsRef: null },
  auth: { tiers: [1], credential: null },
  stream: { format: "text" },
  isolation: { envAllow: ["SAMPLE_EXTRA_VAR"] },
  roles: { proposer: { supported: true }, critic: { supported: true } },
  invoke: {
    proposer: {
      permission: "none",
      prompt: "file",
      args: [
        "--model",
        "{model}",
        "--workdir",
        "{workdir}",
        "--session",
        "{sessionId}",
        "--prompt-file",
        "{promptFile}",
      ],
      files: { "harness.json": "harness: ep02-sample" },
    },
    critic: {
      permission: "none",
      prompt: "stdin",
      args: ["--model", "{model}", "--prompt-stdin"],
    },
  },
  memory: { native: false },
  telemetry: { off: { env: { DO_NOT_TRACK: "1" } } },
  containment: { ceiling: "C1" },
  failures: {
    SAMPLE_AUTH: "authentication_failed",
    SAMPLE_TRANSPORT: "transport_failed",
  },
  versionRange: ">=1.0.0 <2.0.0",
  verifiedOn: "2026-10-01",
});

/** The closed set of the port's levels, and the capabilities of each level. */
const LEVEL_CAPABILITY_IDS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  proposer: Object.freeze(["P1", "P2", "P3", "P4", "P5", "P6"]),
  completion: Object.freeze(["C1", "C2", "C3", "C4", "C5", "C6"]),
});

/** The names of the environment every call may carry, before the roles'. */
const BASE_ENVIRONMENT_NAMES: readonly string[] = ["PATH", "LANG", "LC_ALL", "HOME"];

/** The hosts a plain (non-https) address may reach: the loopback, only. */
const LOOPBACK_HOSTS: readonly string[] = ["127.0.0.1", "::1", "localhost"];

/** The capability map of the sample, one entry without provenance. */
const SAMPLE_CAPABILITIES: Record<string, { value: unknown; provenance: string | null }> = {
  "completion.proposer": { value: true, provenance: "declared in the descriptor" },
  "stream.text": { value: true, provenance: "declared in the descriptor" },
  "memory.native": { value: null, provenance: null },
};

/** The detail text of each typed failure: what the consumer fixes. */
const FAILURE_FIXES: Readonly<Record<HarnessFailure, string>> = Object.freeze({
  authentication_failed: "check the credential of the harness and its expiry",
  rate_limited: "back off and retry the call later",
  quota_exhausted: "raise the quota of the account or change the account",
  context_window_exceeded: "shorten the prompt or the context in force",
  transport_failed: "check the network and the address of the endpoint",
  agent_failure: "inspect the failure output of the harness itself",
  capability_absent: "decline the operation the harness cannot serve",
  critic_not_toolless: "run the critic through the tool-less first form",
});

/** The rules that read a failure out of the response text of a harness. */
const TEXT_FAILURE_RULES: readonly { readonly pattern: RegExp; readonly kind: HarnessFailure }[] =
  Object.freeze([
    { pattern: /\b401\b|unauthorized|api[ _-]?key/i, kind: "authentication_failed" },
    { pattern: /\b429\b|rate[ _-]?limit|quota/i, kind: "rate_limited" },
    {
      pattern: /connection refused|econn(refused|reset)|socket hang up|network/i,
      kind: "transport_failed",
    },
    {
      pattern: /context (length|window)|too many tokens|maximum context/i,
      kind: "context_window_exceeded",
    },
  ]);

export type SampleTarget = ConformanceTarget & {
  /** Remove the working tree of the sample, records included. */
  dispose(): void;
};

/** Substitute the placeholders of one declared argument. */
function fillPlaceholder(argument: string, values: Readonly<Record<string, string>>): string {
  return argument.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in values ? values[name] : whole,
  );
}

/** The sentinel a call that ran over its time limit resolves to. */
const RAN_OVER_THE_LIMIT = Symbol("ran over the time limit");

/** The closed result set of one operation, as the adapter checks it. */
function valueIsInsideTheClosedSet(operation: string, value: unknown): boolean {
  if (operation === "detect") {
    return (
      typeof value === "object" &&
      value !== null &&
      typeof (value as { present?: unknown }).present === "boolean"
    );
  }
  if (operation === "complete") {
    return (
      typeof value === "object" &&
      value !== null &&
      typeof (value as { reply?: unknown }).reply === "string"
    );
  }
  if (operation === "preflight") {
    return (
      typeof value === "object" &&
      value !== null &&
      typeof (value as { credentialPresent?: unknown }).credentialPresent === "boolean"
    );
  }
  return typeof value === "object" && value !== null;
}

/** Build a fresh sample target: its own record directory, nothing shared. */
export function createSampleTarget(): SampleTarget {
  // The descriptor of the sample is well formed: the fields the adapter
  // reads are there, and the two roles it serves are declared.
  assert.equal(SAMPLE_DESCRIPTOR.kind, "cli");
  assert.ok(existsSync(FAKE_BINARY), "the fake binary of the sample is missing");
  assert.ok(
    typeof SAMPLE_DESCRIPTOR.versionRange === "string" &&
      typeof SAMPLE_DESCRIPTOR.verifiedOn === "string",
    "a tested adapter declares its range and its date",
  );
  const root = mkdtempSync(join(tmpdir(), "ep02-sample-"));
  const recordDir = join(root, "records");

  // The working files a started pass owns: the prompt file, the descriptor's
  // own files and, for a first-form critic, its empty directory. All of them
  // go when the pass stops or the call ends.
  let pendingFiles: readonly string[] = [];
  let pendingFirstFormDirectory: string | null = null;
  let statesVersion = true;

  function pendingCleanup(): void {
    for (const path of pendingFiles) rmSync(path, { force: true });
    pendingFiles = [];
    if (pendingFirstFormDirectory) {
      rmSync(pendingFirstFormDirectory, { recursive: true, force: true });
      pendingFirstFormDirectory = null;
    }
  }

  // The observation plumbing of the fake binary: where it records, and the
  // script it plays. These are the observer's variables, not the call's.
  const scriptEnv = (script: readonly object[]): Record<string, string> => ({
    FAKE_BINARY_RECORD_DIR: recordDir,
    FAKE_BINARY_SCRIPT: JSON.stringify(script),
  });

  /** Read what the fake binary has recorded so far. */
  async function readRecords(): Promise<readonly RecordedCall[]> {
    const file = join(recordDir, "record.jsonl");
    if (!existsSync(file)) return [];
    const records: RecordedCall[] = [];
    for (const line of readFileSync(file, "utf8").split("\n")) {
      if (!line.trim()) continue;
      records.push(JSON.parse(line) as RecordedCall);
    }
    return records;
  }

  /** The declared arguments of one role, filled with the call's values. */
  function buildArgs(role: string, values: Readonly<Record<string, string>>): readonly string[] {
    const invoke = SAMPLE_DESCRIPTOR.invoke as Record<
      string,
      { args: readonly string[]; prompt: string }
    >;
    return invoke[role].args.map((argument) => fillPlaceholder(argument, values));
  }

  /** Write the prompt by the declared way and the descriptor's own files. */
  function prepareCall(input: {
    role: string;
    prompt: string;
    model: string;
    sessionId?: string;
    workdir: string;
    firstFormCritic?: boolean;
  }): { cwd: string; args: readonly string[]; stdin: string | null } {
    mkdirSync(input.workdir, { recursive: true });
    let cwd = input.workdir;
    if (input.firstFormCritic) {
      // The first form of the critic: an EMPTY directory of its own, named
      // so the record shows what made it.
      cwd = mkdtempSync(join(tmpdir(), "specstride-critic-"));
      pendingFirstFormDirectory = cwd;
    }
    const invoke = SAMPLE_DESCRIPTOR.invoke as Record<
      string,
      { args: readonly string[]; prompt: string; files?: Record<string, string> }
    >;
    const declared = invoke[input.role];
    let stdin: string | null = null;
    let args = buildArgs(input.role, {
      model: input.model,
      workdir: cwd,
      sessionId: input.sessionId ?? "",
      promptFile: "",
    });
    if (declared.prompt === "file") {
      const promptFile = join(input.workdir, ".specstride-prompt");
      writeFileSync(promptFile, input.prompt, "utf8");
      pendingFiles = [...pendingFiles, promptFile];
      args = args.map((argument) => (argument === "{promptFile}" ? promptFile : argument));
      return { cwd, args, stdin };
    }
    if (declared.prompt === "stdin") {
      stdin = input.prompt;
      return { cwd, args, stdin };
    }
    args = args.map((argument) => (argument === "{prompt}" ? input.prompt : argument));
    return { cwd, args, stdin };
  }

  /** Write the descriptor's own files beside the call. */
  function writeDeclaredFiles(role: string, cwd: string): void {
    const invoke = SAMPLE_DESCRIPTOR.invoke as Record<string, { files?: Record<string, string> }>;
    for (const [name, content] of Object.entries(invoke[role].files ?? {})) {
      const path = join(cwd, name);
      writeFileSync(path, content, "utf8");
      pendingFiles = [...pendingFiles, path];
    }
  }

  /** Run one call to its end, the prompt by the declared way. */
  function runProcess(input: {
    args: readonly string[];
    cwd: string;
    env: Readonly<Record<string, string>>;
    stdin: string | null;
  }): Promise<{ exitCode: number | null; stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(FAKE_BINARY, [...input.args], {
        cwd: input.cwd,
        env: { ...input.env },
        detached: true, // a group of its own, as every call of the port
        stdio: ["pipe", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout?.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });
      child.stderr?.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8");
      });
      child.on("error", reject);
      child.on("close", (exitCode) => {
        resolve({ exitCode, stdout, stderr });
      });
      if (input.stdin !== null) child.stdin?.end(input.stdin, "utf8");
      else child.stdin?.end();
    });
  }

  /** Stop a process group in one of the port's three modes. */
  async function stopGroup(pid: number, pgid: number, mode: string): Promise<boolean> {
    // An unknown mode is read as terminate (F100-FR-085).
    const kind = mode === "polite" || mode === "terminate" || mode === "kill" ? mode : "terminate";
    const signal: NodeJS.Signals = kind === "kill" ? "SIGKILL" : "SIGTERM";
    try {
      if (kind === "polite") process.kill(pid, signal);
      else process.kill(-pgid, signal);
    } catch {
      // already gone: the end is what the port asks for
    }
    const deadline = Date.now() + 2_000;
    for (;;) {
      let alive = false;
      try {
        process.kill(pid, 0);
        alive = true;
      } catch {
        alive = false;
      }
      if (!alive) return true;
      if (Date.now() > deadline) return false;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  return {
    id: "ep02-sample",
    descriptor: SAMPLE_DESCRIPTOR,
    fakeBinary: FAKE_BINARY,
    recordDir,

    recordedCalls: readRecords,

    async detect(input?: { statesVersion?: boolean }) {
      if (input && "statesVersion" in input) statesVersion = input.statesVersion === true;
      const stdoutFile = join(root, `detect-${Date.now()}-${Math.random()}.out`);
      const home = join(root, "configuration-home");
      if (!existsSync(home)) mkdirSync(home, { recursive: true });
      const started = await processPrimitive.start({
        argv: [FAKE_BINARY, "--version"],
        cwd: root,
        env: scriptEnv([{ stdout: statesVersion ? "1.4.2" : "" }, { exit: 0 }]),
        stdoutFile,
      });
      try {
        await processPrimitive.waitForEnd(started.pid);
        return {
          present: statesVersion,
          version: statesVersion ? "1.4.2" : null,
          configurationHomeExists: existsSync(home),
        };
      } finally {
        if (existsSync(stdoutFile)) rmSync(stdoutFile, { force: true });
      }
    },

    async capabilities() {
      return { ...SAMPLE_CAPABILITIES };
    },

    async preflight(input) {
      // A preflight reads only the injected environment. It makes no paid
      // call and reaches no endpoint: the sample is a local `cli` kind.
      if (!input.credentialPresent) {
        return {
          credentialPresent: false,
          refused: true,
          reason: `preflight refused: the credential ${SAMPLE_CREDENTIAL_VAR} is not present in the environment`,
        };
      }
      return { credentialPresent: true, refused: false, reason: "" };
    },

    async startPass(input) {
      // The prompt of a pass travels by the declared way: a file beside the
      // working tree, removed when the pass stops.
      const promptFile = join(input.workdir, ".specstride-prompt");
      mkdirSync(input.workdir, { recursive: true });
      writeFileSync(promptFile, `prompt for ${input.sessionId}`, "utf8");
      pendingFiles = [...pendingFiles, promptFile];
      writeDeclaredFiles("proposer", input.workdir);
      const args = buildArgs("proposer", {
        model: input.model,
        workdir: input.workdir,
        sessionId: input.sessionId,
        promptFile,
      });
      const started = await processPrimitive.start({
        argv: [FAKE_BINARY, ...args],
        cwd: input.workdir,
        env: { ...input.environment, ...scriptEnv(input.script) },
        stdoutFile: join(input.workdir, "pass.out"),
      });
      return { pid: started.pid, pgid: started.pgid };
    },

    async runCall(input) {
      const prepared = prepareCall({
        role: input.role,
        prompt: input.prompt,
        model: input.model,
        sessionId: input.sessionId,
        workdir: input.workdir,
        firstFormCritic: input.firstFormCritic,
      });
      writeDeclaredFiles(input.role, prepared.cwd);
      try {
        const result = await runProcess({
          args: prepared.args,
          cwd: prepared.cwd,
          env: { ...input.environment, ...scriptEnv(input.script) },
          stdin: prepared.stdin,
        });
        return {
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
        };
      } finally {
        pendingCleanup();
      }
    },

    async stop(pid, pgid, mode) {
      const ended = await stopGroup(pid, pgid, mode);
      pendingCleanup();
      return { ended };
    },

    async runBetweenPasses(handler, input) {
      // `betweenPasses`: what the handler decides, read into the closed set;
      // a failure of the handler is `continue` — the run goes on.
      try {
        const decided = handler(input);
        if (decided === 4) return "stop:4";
        if (decided === 7) return "stop:7";
        return "continue";
      } catch {
        return "continue";
      }
    },

    checkRegistration(candidate) {
      const refusals: { level: string; reason: string }[] = [];
      const missing: Record<string, readonly string[]> = {};
      for (const level of candidate.levels) {
        const required = LEVEL_CAPABILITY_IDS[level];
        if (required === undefined) {
          refusals.push({
            level,
            reason: `the level ${level} is outside the closed set of the port's levels`,
          });
          continue;
        }
        const operations = candidate.operations[level] ?? [];
        if (operations.length === 0) {
          refusals.push({
            level,
            reason: `the level ${level} holds no operation of the port`,
          });
        }
        missing[level] = required.filter((id) => !operations.includes(id));
      }
      return { ok: refusals.length === 0, refusals, missing };
    },

    classify(input) {
      // The failures map of the declared harness is the only source when it
      // is given; a structured code decides before a match on the text.
      if (input.structuredCode !== undefined) {
        const mapped = input.failuresMap?.[input.structuredCode];
        const known =
          typeof mapped === "string" && (FAILURES as readonly string[]).includes(mapped);
        const kind: HarnessFailure = known ? (mapped as HarnessFailure) : FAILURE_WHEN_UNKNOWN;
        return { kind, fix: FAILURE_FIXES[kind] };
      }
      if (input.text !== undefined) {
        for (const rule of TEXT_FAILURE_RULES) {
          if (rule.pattern.test(input.text)) {
            return { kind: rule.kind, fix: FAILURE_FIXES[rule.kind] };
          }
        }
      }
      return { kind: FAILURE_WHEN_UNKNOWN, fix: FAILURE_FIXES[FAILURE_WHEN_UNKNOWN] };
    },

    guardAddress(address) {
      let parsed: URL;
      try {
        parsed = new URL(address);
      } catch {
        return { ok: false, reason: `the address ${address} is not a URL` };
      }
      if (parsed.protocol === "https:") return { ok: true };
      if (parsed.protocol === "http:" && LOOPBACK_HOSTS.includes(parsed.hostname)) {
        return { ok: true };
      }
      return {
        ok: false,
        reason: `a plain address is refused unless it is the loopback: ${address}`,
      };
    },

    guardRedirect(status) {
      return { ok: !(status >= 300 && status < 400) };
    },

    guardCredentialHost(bound, address) {
      try {
        return { ok: new URL(bound).host === new URL(address).host };
      } catch {
        return { ok: false };
      }
    },

    guardSecretOutOfArguments(secret, args) {
      return { ok: !args.some((argument) => argument.includes(secret)) };
    },

    async callOperation(options, operation, input) {
      // A refused terms gate takes the plainer path before the call is made.
      const gate = options.termsGate?.decide?.() ?? { allowed: true, reason: null };
      if (!gate.allowed) {
        return {
          ok: false,
          degraded: true,
          degradation: {
            reason: "refused",
            detail: `the terms gate refused the call of ${operation}: ${gate.reason}`,
          },
        };
      }
      const limit = options.timeLimits[operation] ?? 1_000;
      let value: unknown;
      try {
        value = await Promise.race([
          Promise.resolve(
            (options.adapter[operation] as ((i: unknown) => unknown) | undefined)?.(input),
          ),
          new Promise((done) => setTimeout(() => done(RAN_OVER_THE_LIMIT), limit)),
        ]);
      } catch (error) {
        return {
          ok: false,
          degraded: true,
          degradation: {
            reason: "threw",
            detail: error instanceof Error ? error.message : String(error),
          },
        };
      }
      if (value === RAN_OVER_THE_LIMIT) {
        return {
          ok: false,
          degraded: true,
          degradation: {
            reason: "timeout",
            detail: `the operation ${operation} ran over its limit of ${limit} ms`,
          },
        };
      }
      if (!valueIsInsideTheClosedSet(operation, value)) {
        return {
          ok: false,
          degraded: true,
          degradation: {
            reason: "unknown-value",
            detail: `the value of ${operation} is outside the closed result set`,
          },
        };
      }
      return { ok: true };
    },

    allowList(input) {
      const names = [...BASE_ENVIRONMENT_NAMES];
      for (const variable of input.credentialVars[input.role] ?? []) {
        if (!names.includes(variable)) names.push(variable);
      }
      for (const variable of input.envAllow ?? []) {
        if (!names.includes(variable)) names.push(variable);
      }
      return names;
    },

    buildEnvironment(input) {
      const allowed = this.allowList(input);
      const environment: Record<string, string> = {};
      for (const [name, value] of Object.entries(input.processEnv)) {
        if ((allowed as readonly string[]).includes(name)) environment[name] = value;
      }
      return environment;
    },

    telemetrySwitch() {
      const env = (SAMPLE_DESCRIPTOR.telemetry as { off?: { env?: Record<string, string> } })?.off
        ?.env;
      if (!env || Object.keys(env).length === 0) return { declared: false, env: {} };
      return { declared: true, env: { ...env } };
    },

    memoryDecision(role) {
      const native = (SAMPLE_DESCRIPTOR.memory as { native?: boolean })?.native === true;
      return {
        native,
        switchedOff: !native,
        qualifiesAsCritic: role.role === "critic",
      };
    },

    dispose() {
      pendingCleanup();
      rmSync(root, { recursive: true, force: true });
    },
  };
}

/**
 * The environment of a sample call: the allow-list, then the telemetry switch
 * over it — the same composition the seam prescribes (F109-FR-021, FR-022).
 */
export function sampleEnvironment(
  processEnv: Readonly<Record<string, string>>,
  role: "proposer" | "critic",
  credentialVars: Readonly<Record<string, readonly string[]>> = {
    proposer: [SAMPLE_CREDENTIAL_VAR],
  },
): Record<string, string> {
  const target = createSampleTarget();
  try {
    const environment = target.buildEnvironment({
      role,
      credentialVars,
      processEnv,
    });
    return { ...environment, ...target.telemetrySwitch().env };
  } finally {
    target.dispose();
  }
}
