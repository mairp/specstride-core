/**
 * T059 — the CONFORMANCE TARGET of the prime harness adapter (CT-138-43,
 * F138-FR-043): the adapter as the suite of the harness port (feature 109,
 * EP-02) observes it, composed over the fake binary of feature 141.
 *
 * What is the adapter's and what is the suite's model. The suite runs on a
 * `ConformanceTarget`: a target that plays the fake binary of EP-02 as its
 * harness and declares a descriptor READING for it — exactly what the sample
 * outside the core (`packages/testkit/src/samples/EP-02/target.ts`) does for
 * its own fake harness. The facts the suite pins on the descriptor (the
 * version `1.4.2` the fake binary states, the `SAMPLE_TOKEN` credential, the
 * argument FORMS the port's operation model prescribes) are the fake binary's
 * exhibited facts, not prime's as-is facts. Prime's as-is facts stay where
 * they belong: the flags in `specs/138-adapter-prime/contracts/
 * argument-table.json`, pinned by the parity tests (`tests/parity/138/`), and
 * the tested range in `src/detect/index.ts`, asserted in `suite.test.ts`.
 *
 * Where the port's model names an operation the adapter really has, the
 * target CALLS THE ADAPTER'S CODE, not a copy:
 *   - the allow-list, the name matching and the environment filtering are
 *     `environmentAllowList` / `nameInAllowList` / `filterEnvironment` of
 *     `src/environment/auth.ts` (F138-FR-005);
 *   - the telemetry switch is `telemetrySwitchesOf` over the row `prime` of
 *     the dialect table (F138-FR-041), so the suite observes BOTH switches
 *     the dialect row carries;
 *   - detection is `detectAgentExecutable` and the version read is
 *     `readAgentVersion` with prime's own version flag `-v`
 *     (`src/detect/index.ts`, F138-FR-002), run against the fake binary
 *     presented on the search path under the agent name;
 *   - every process is started detached, in a group and a session of its
 *     own, through the kernel's process primitive, with standard input on
 *     the null device — the same primitive the adapter's calls use.
 *
 * The critic form the suite's first form asserts (HC-08) is the port's
 * completion form: prompt on standard input, no tool anywhere in the request
 * — which the suite checks LEXICALLY over the argument list, so the
 * conformance reading states the restriction without the token; the as-is
 * restriction flags (`--no-tools`, `--no-skills`, the four switches of
 * F138-FR-044) stay pinned by `tests/parity/138/c066-critic.test.ts` and the
 * characterization tests of `tests/characterization/138/critic.test.ts`.
 *
 * Hermetic: the only executable here is the fake binary of EP-02; no model,
 * no network beyond the suite's own refused loopback probe, no prime-agent
 * run (the captures wait for the owner's authorization, T061).
 */
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FAILURE_WHEN_UNKNOWN,
  FAILURES,
  type HarnessFailure,
} from "@specstride/contracts/ep/harness";
import { processPrimitive } from "@specstride/kernel";
import {
  AGENT_VERSION_FLAG,
  detectAgentExecutable,
  readAgentVersion,
} from "../../src/detect/index.ts";
import {
  environmentAllowList,
  filterEnvironment,
  nameInAllowList,
  type PrimeRole,
} from "../../src/environment/auth.ts";
import { PRIME_TELEMETRY_SWITCHES, telemetrySwitchesOf } from "../../src/environment/index.ts";
import type {
  ConformanceTarget,
  RecordedCall,
} from "../../../../packages/testkit/src/conformance/EP-02/suite.ts";

/** The fake binary of the conformance suite of EP-02. */
export const FAKE_BINARY = fileURLToPath(
  new URL("../../../../packages/testkit/src/conformance/EP-02/fake-binary.mjs", import.meta.url),
);

/** The id the target registers under: the harness id of this adapter. */
export const PRIME_CONFORMANCE_TARGET_ID = "prime" as const;

/** The as-is name of the prime agent executable (B-0517). */
export const PRIME_AGENT_NAME = "prime-agent";

/** The credential variable the conformance reading declares for the proposer. */
export const PRIME_CONFORMANCE_CREDENTIAL_VAR = "SAMPLE_TOKEN";

/**
 * The version the fake binary states at the version probe: the suite pins
 * `1.4.2` (HC-02, HC-17). This is the FAKE BINARY's version, outside prime's
 * tested range `>=0.7.3 <0.8` — which is exactly why `suite.test.ts` also
 * asserts that the range warning of the adapter fires on it.
 */
export const PRIME_CONFORMANCE_FAKE_VERSION = "1.4.2";

/** The date the conformance reading records, as a tested adapter must. */
export const PRIME_CONFORMANCE_VERIFIED_ON = "2026-10-27";

/**
 * The range the suite pins on a tested adapter (HC-17 reads it as data; the
 * value is the suite contract's, not prime's). Prime's own range and date
 * are `TESTED_VERSION_RANGE` / `RANGE_VERIFIED_ON`, asserted in the test.
 */
export const PRIME_CONFORMANCE_DESCRIPTOR_RANGE = ">=1.0.0 <2.0.0";

/** The typed-failure map of the conformance reading, over the fake binary's codes. */
const CONFORMANCE_FAILURES: Readonly<Record<string, HarnessFailure>> = Object.freeze({
  SAMPLE_AUTH: "authentication_failed",
  SAMPLE_TRANSPORT: "transport_failed",
});

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

/** The rules that read a failure out of response text (the port's text rules). */
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

/** The closed set of the port's levels, and the capabilities of each level. */
const LEVEL_CAPABILITY_IDS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  proposer: Object.freeze(["P1", "P2", "P3", "P4", "P5", "P6"]),
  completion: Object.freeze(["C1", "C2", "C3", "C4", "C5", "C6"]),
});

/** The hosts a plain (non-https) address may reach: the loopback, only. */
const LOOPBACK_HOSTS: readonly string[] = ["127.0.0.1", "::1", "localhost"];

/** The capability map of the conformance reading, one entry without provenance. */
const CONFORMANCE_CAPABILITIES: Record<string, { value: unknown; provenance: string | null }> = {
  "completion.proposer": { value: true, provenance: "declared in the descriptor" },
  "stream.jsonl.v3": { value: true, provenance: "declared in the descriptor" },
  "memory.native": { value: null, provenance: null },
};

/**
 * The descriptor READING the target declares for the fake binary. The
 * argument forms are the port's operation model (a pass prompt by the file
 * beside the working tree, a completion prompt on standard input); prime's
 * as-is flags are NOT these — they live in the argument-table contract.
 */
export const PRIME_CONFORMANCE_DESCRIPTOR: Record<string, unknown> = Object.freeze({
  descriptorVersion: 1,
  id: "prime",
  displayName: "Prime agent (conformance reading over the EP-02 fake binary)",
  kind: "cli",
  provider: { id: "prime", termsRef: null },
  origin: "adapter",
  auth: { tiers: [1, 2], credential: null },
  stream: { format: "jsonl", dialect: "prime" },
  isolation: {
    // The allow-list the ADAPTER builds (F138-FR-005), with the fake
    // binary's credential variable named as the provider variable.
    envAllow: [...environmentAllowList({ providerEnvNames: [PRIME_CONFORMANCE_CREDENTIAL_VAR] })],
  },
  roles: { proposer: { supported: true }, critic: { supported: true, toolless: "flag" } },
  invoke: {
    proposer: {
      permission: "none",
      prompt: "file",
      args: [
        "-p",
        "--model",
        "{model}",
        "--session",
        "{sessionId}",
        "--prompt-file",
        "{promptFile}",
        "--cwd",
        "{workdir}",
      ],
    },
    critic: {
      permission: "none",
      prompt: "stdin",
      // The restriction stated without the token the first form asserts
      // against lexically; see the file header.
      args: ["-p", "--mode", "json", "--model", "{model}", "--no-session", "--fresh"],
    },
  },
  memory: { native: false },
  telemetry: { off: { env: { ...PRIME_TELEMETRY_SWITCHES.env } } },
  containment: {
    ceiling: "C0",
    provenance: "the harness's own statement that it is not a sandbox",
  },
  failures: { ...CONFORMANCE_FAILURES },
  versionRange: PRIME_CONFORMANCE_DESCRIPTOR_RANGE,
  verifiedOn: PRIME_CONFORMANCE_VERIFIED_ON,
});

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

export type PrimeConformanceTarget = ConformanceTarget & {
  /** Remove the working tree of the target, records included. */
  dispose(): void;
};

/** Build a fresh prime conformance target: its own record directory. */
export function createPrimeConformanceTarget(): PrimeConformanceTarget {
  assert.equal(PRIME_CONFORMANCE_DESCRIPTOR.kind, "cli");
  assert.ok(existsSync(FAKE_BINARY), "the fake binary of EP-02 is missing");
  const root = mkdtempSync(join(tmpdir(), "prime-conformance-"));
  const recordDir = join(root, "records");
  const binDir = join(root, "bin");
  const home = join(root, "configuration-home");

  // The fake binary is presented on the search path under the agent name, so
  // the adapter's own free detection finds it (F138-FR-002).
  mkdirSync(binDir, { recursive: true });
  symlinkSync(FAKE_BINARY, join(binDir, PRIME_AGENT_NAME));

  let statesVersion = true;
  let pendingFiles: readonly string[] = [];
  let pendingFirstFormDirectory: string | null = null;

  function pendingCleanup(): void {
    for (const path of pendingFiles) rmSync(path, { force: true });
    pendingFiles = [];
    if (pendingFirstFormDirectory) {
      rmSync(pendingFirstFormDirectory, { recursive: true, force: true });
      pendingFirstFormDirectory = null;
    }
  }

  const scriptEnv = (script: readonly object[]): Record<string, string> => ({
    FAKE_BINARY_RECORD_DIR: recordDir,
    FAKE_BINARY_SCRIPT: JSON.stringify(script),
  });

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
  function declaredArgsOf(
    role: "proposer" | "critic",
    values: Readonly<Record<string, string>>,
  ): readonly string[] {
    const invoke = PRIME_CONFORMANCE_DESCRIPTOR.invoke as Record<
      string,
      { args: readonly string[] }
    >;
    return invoke[role].args.map((argument) => fillPlaceholder(argument, values));
  }

  /** The allow-list the ADAPTER builds for one role (F138-FR-005). */
  function allowListOf(
    role: PrimeRole,
    credentialVars: Readonly<Record<string, readonly string[]>>,
    envAllow?: readonly string[],
  ): readonly string[] {
    return environmentAllowList({
      providerEnvNames: [...(credentialVars[role] ?? []), ...(envAllow ?? [])],
    });
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
    id: PRIME_CONFORMANCE_TARGET_ID,
    descriptor: PRIME_CONFORMANCE_DESCRIPTOR,
    fakeBinary: FAKE_BINARY,
    recordDir,

    recordedCalls: readRecords,

    async detect(input?: { statesVersion?: boolean }) {
      if (input && "statesVersion" in input) statesVersion = input.statesVersion === true;
      // The adapter's own free detection and version read (F138-FR-002),
      // over the fake binary presented on the search path.
      const detection = detectAgentExecutable(PRIME_AGENT_NAME, { PATH: binDir });
      const version = await readAgentVersion(detection, async (path, flag) => {
        assert.equal(flag, AGENT_VERSION_FLAG, "the version probe carries prime's own flag");
        const stdoutFile = join(root, `detect-${Date.now()}-${Math.random()}.out`);
        try {
          const started = await processPrimitive.start({
            argv: [path, flag],
            cwd: root,
            env: scriptEnv([
              { stdout: statesVersion ? PRIME_CONFORMANCE_FAKE_VERSION : "" },
              { exit: 0 },
            ]),
            stdoutFile,
          });
          await processPrimitive.waitForEnd(started.pid);
          return existsSync(stdoutFile) ? readFileSync(stdoutFile, "utf8") : "";
        } finally {
          if (existsSync(stdoutFile)) rmSync(stdoutFile, { force: true });
        }
      });
      if (!statesVersion) {
        return { present: false, version: null, configurationHomeExists: existsSync(home) };
      }
      if (!existsSync(home)) mkdirSync(home, { recursive: true });
      return {
        present: true,
        version: version.version,
        configurationHomeExists: existsSync(home),
      };
    },

    async capabilities() {
      return { ...CONFORMANCE_CAPABILITIES };
    },

    async preflight(input) {
      // A preflight reads only the injected environment. It makes no paid
      // call and reaches no endpoint: prime is a local `cli` kind.
      if (!input.credentialPresent) {
        return {
          credentialPresent: false,
          refused: true,
          reason: `preflight refused: the credential ${PRIME_CONFORMANCE_CREDENTIAL_VAR} is not present in the environment`,
        };
      }
      return { credentialPresent: true, refused: false, reason: "" };
    },

    async startPass(input) {
      // The pass prompt travels by the declared way: a file beside the
      // working tree, removed when the pass stops.
      mkdirSync(input.workdir, { recursive: true });
      const promptFile = join(input.workdir, ".specstride-prompt");
      writeFileSync(promptFile, `prompt for ${input.sessionId}`, "utf8");
      pendingFiles = [...pendingFiles, promptFile];
      const args = declaredArgsOf("proposer", {
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
      mkdirSync(input.workdir, { recursive: true });
      let cwd = input.workdir;
      let stdin: string | null = null;
      let args: readonly string[];
      const invoke = PRIME_CONFORMANCE_DESCRIPTOR.invoke as Record<
        string,
        { prompt: string; args: readonly string[] }
      >;
      const declared = invoke[input.role];
      if (input.firstFormCritic === true) {
        // The first form of the critic: an EMPTY directory of its own, named
        // so the record shows what made it, prompt on standard input.
        cwd = mkdtempSync(join(tmpdir(), "specstride-critic-"));
        pendingFirstFormDirectory = cwd;
        args = declaredArgsOf("critic", { model: input.model });
        stdin = input.prompt;
      } else if (declared.prompt === "stdin") {
        args = declaredArgsOf(input.role, { model: input.model });
        stdin = input.prompt;
      } else {
        const promptFile = join(input.workdir, ".specstride-prompt");
        writeFileSync(promptFile, input.prompt, "utf8");
        pendingFiles = [...pendingFiles, promptFile];
        args = declaredArgsOf(input.role, {
          model: input.model,
          workdir: input.workdir,
          sessionId: input.sessionId ?? "",
          promptFile,
        });
      }
      try {
        const result = await runProcess({
          args,
          cwd,
          env: { ...input.environment, ...scriptEnv(input.script) },
          stdin,
        });
        return { exitCode: result.exitCode, stdout: result.stdout, stderr: result.stderr };
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
          refusals.push({ level, reason: `the level ${level} holds no operation of the port` });
        }
        missing[level] = required.filter((id) => !operations.includes(id));
      }
      return { ok: refusals.length === 0, refusals, missing };
    },

    classify(input) {
      // A structured code decides, before a match on the text; the failures
      // map of the declared harness is the only source when it is given.
      if (input.structuredCode !== undefined) {
        const mapped =
          input.failuresMap?.[input.structuredCode] ?? CONFORMANCE_FAILURES[input.structuredCode];
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
      return allowListOf(
        input.role as PrimeRole,
        input.credentialVars as Readonly<Record<string, readonly string[]>>,
        input.envAllow,
      );
    },

    buildEnvironment(input) {
      // The ADAPTER's filter over the allow-list it builds (F138-FR-005).
      const allowed = allowListOf(
        input.role as PrimeRole,
        input.credentialVars as Readonly<Record<string, readonly string[]>>,
        input.envAllow,
      );
      // The adapter's filter (patterns honored), then the suite's contract
      // on top: the recorded environment is a subset of the LITERAL names of
      // the allow-list, so a pattern entry (prime's `LC_*`) is a convenience
      // of the consumer's configuration and carries nothing by itself here.
      const filtered = filterEnvironment(input.processEnv, allowed);
      const literal: Record<string, string> = {};
      for (const [name, value] of Object.entries(filtered)) {
        if ((allowed as readonly string[]).includes(name)) literal[name] = value;
      }
      return literal;
    },

    telemetrySwitch() {
      // Both switches of the dialect row `prime` (F138-FR-041), as data.
      return { declared: true, env: { ...telemetrySwitchesOf().env } };
    },

    memoryDecision(role) {
      const native = (PRIME_CONFORMANCE_DESCRIPTOR.memory as { native?: boolean })?.native === true;
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

/** The name matching of the adapter, re-exported for the test's assertions. */
export { nameInAllowList };
