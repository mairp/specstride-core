/**
 * T044, T120 — the one stub every executable of `stubs/bin/` hands over to, and
 * the registry of the calling conventions (F141-FR-006, F141-FR-010,
 * F141-FR-011).
 *
 * A harness stub is "the proposer stub, the critic stub or both under the name
 * and the calling convention of one harness". There is therefore ONE
 * implementation and the executables differ only in the name they were called
 * by: `harnessMain("claude")`, `harnessMain("dsh")`, … and
 * `harnessMain("stub-harness")` for the descriptor-driven generic harness. That
 * is what makes §O.3 rule 3 — "the same stub, unchanged, serves the reference
 * and the port" — true by construction.
 *
 * Which ROLE a call plays is read off the call and never off a switch of the
 * oracle: the critic prompt of the reference carries the nonce-bound verdict
 * contract, the diagnostician's carries no nonce (F141-FR-008), the installer is
 * the dsh stub called with the installer's arguments (§O.3, `dsh-installer.ts`),
 * and everything else is a proposer pass. So one executable answers every role
 * its harness has without the fixture having to say which call is which.
 *
 * The calling convention per harness is the module of that harness in this
 * directory, built on the data of `stub-vocabulary.json`: the `prompt` field says
 * where the prompt arrives, the `records` field says what the stub records, and a
 * harness the data adds and no module names is served by `conventionFromEntry`
 * alone — a name, a calling convention and a stream format, with no change to the
 * comparator or the normalizer (F141-FR-010).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

import { installGuards } from "../../../src/env/guard.ts";
import { stubVocabulary } from "../../../src/catalogue/data.ts";
import { nextInvocation } from "../counter.ts";
import { carryOutEngineStep, engineAttempt, type EngineContext } from "../engine.ts";
import { carryOutProposerStep, proposerContext } from "../proposer.ts";
import { answerAsCli, isDiagnosticianCall, roleOfPrompt } from "../critic-cli.ts";
import { failWithOverrun } from "../overrun.ts";
import { readScript, stepFor, type StubScript } from "../script.ts";
import { carryOutInstallerStep, carryOutVerificationStep } from "../verification.ts";
import { environmentNames, writeTranscriptRecord } from "../transcript.ts";
import { harnessOfExecutable } from "../names.ts";
import {
  HarnessConventionError,
  conventionFromEntry,
  harnessStubEntries,
  harnessStubEntry,
  promptChannelOfEntry,
  promptFromTheCall,
  type HarnessCall,
  type HarnessConvention,
  type HarnessStubEntry,
  type PromptOfCall,
} from "./conventions.ts";
import { claudeConvention } from "./claude.ts";
import { codexConvention } from "./codex.ts";
import { dshConvention } from "./dsh.ts";
import { genericConvention } from "./generic.ts";
import { piConvention } from "./pi.ts";
import { primeConvention } from "./prime.ts";
import { isInstallerCall } from "./dsh-installer.ts";

export {
  HarnessConventionError,
  conventionFromEntry,
  conventionOfKnownHarness,
  harnessStubEntries,
  harnessStubEntry,
  promptChannelOfEntry,
  promptFromTheCall,
  positionalArguments,
  type HarnessCall,
  type HarnessConvention,
  type HarnessStubEntry,
  type PromptOfCall,
} from "./conventions.ts";
export { claudeConvention } from "./claude.ts";
export { codexConvention } from "./codex.ts";
export { dshConvention, recordsOfDshCall, promptOfDshCall } from "./dsh.ts";
export { genericConvention } from "./generic.ts";
export { piConvention, PI_HAS_NO_REFERENCE } from "./pi.ts";
export { primeConvention, modeOfPrimeCall, variantOfPrimeCall } from "./prime.ts";
export {
  INSTALLER_SUBCOMMAND,
  INSTALLER_VERB,
  installerCallOf,
  isInstallerCall,
  recordsOfInstallerCall,
} from "./dsh-installer.ts";

/** Where a harness stub finds the scripts of its roles, and the scenario. */
export const HARNESS_ENVIRONMENT = {
  scriptDir: "ORACLE_STUB_SCRIPT_DIR",
  fixtureDir: "ORACLE_FIXTURE_DIR",
  stateDir: "ORACLE_STUB_STATE_DIR",
  transcript: "ORACLE_STUB_TRANSCRIPT",
} as const;

/** The roles a harness stub can play. */
export const HARNESS_ROLES = [
  "proposer",
  "critic",
  "diagnostician",
  "installer",
  "engine",
  "verification",
] as const;
export type HarnessRole = (typeof HARNESS_ROLES)[number];

/**
 * The first word of the argument list with which a scenario's verification-commands
 * document calls the generic stub. A verification command has no prompt, so nothing
 * of the prompt can name its role: the argument list does (F141-FR-009).
 */
export const VERIFICATION_SUBCOMMAND = "verify" as const;

/** A call of a harness stub the oracle cannot answer. */
export class HarnessStubError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HarnessStubError";
  }
}

/**
 * The conventions the oracle holds a module for, by harness. A harness that is in
 * the data and in no module is served by `conventionFromEntry`, which is the
 * whole of "a further harness stub is added by data" (F141-FR-010).
 */
export const CONVENTION_MODULES: Readonly<Record<string, () => HarnessConvention>> = Object.freeze({
  claude: claudeConvention,
  dsh: dshConvention,
  codex: codexConvention,
  prime: primeConvention,
  pi: piConvention,
  generic: genericConvention,
});

/** The calling convention of one harness, from its module or from the data alone. */
export function conventionOf(
  harness: string,
  entries: readonly HarnessStubEntry[] = harnessStubEntries(),
): HarnessConvention {
  const entry = harnessStubEntry(harness, entries);
  if (entry === undefined) {
    throw new HarnessConventionError(
      `${harness} is no entry of harnessStubs of stub-vocabulary.json; a harness stub is added by ` +
        `data: a name, a calling convention and a stream format (F141-FR-010)`,
    );
  }
  const module = CONVENTION_MODULES[harness];
  // The module of a harness reads its own entry of the data; where the caller
  // passes entries of its own (a harness added by data in a test), the convention
  // is built from THAT entry, so nothing of the installed data leaks into it.
  if (module !== undefined && entries === harnessStubEntries()) return module();
  return conventionFromEntry(entry);
}

/** Every convention the data holds, in the order of the data. */
export function conventions(
  entries: readonly HarnessStubEntry[] = harnessStubEntries(),
): readonly HarnessConvention[] {
  return Object.freeze(entries.map((entry) => conventionOf(entry.harness, entries)));
}

/** Where the prompt of a harness arrives, as the vocabulary states it. */
export function promptChannelOfHarness(harness: string): "stdin" | "argument" {
  return promptChannelOfEntry(harnessStubEntry(harness));
}

/** The prompt of this call, and the channel it arrived on. */
export function promptOfHarnessCall(
  harness: string,
  argv: readonly string[],
  stdin: string,
  env: Readonly<Record<string, string | undefined>> = {},
  executable = "",
): PromptOfCall {
  const call: HarnessCall = { executable, argv, stdin, env };
  try {
    return conventionOf(harness).prompt(call);
  } catch (error) {
    if (error instanceof HarnessConventionError) {
      return promptFromTheCall(call, "stdin");
    }
    throw error;
  }
}

/**
 * The role of this call. The installer is the dsh stub called with the
 * installer's arguments; a prompt with the verdict contract is the critic; a
 * prompt without a nonce where a critic was asked is the diagnostician; anything
 * else is a proposer pass.
 */
export function roleOfInvocation(options: {
  readonly executable: string;
  readonly argv: readonly string[];
  readonly prompt: string;
}): HarnessRole {
  if (options.executable === stubVocabulary().engineExecutable) return "engine";
  // The controller builds the installer's argument list itself and never a shell:
  // `dsh plugin --profile <profile> add --save-exact <spec>…` (`isInstallerCall`).
  if (isInstallerCall(options.argv)) return "installer";
  // A verification command is not a call of a model: the gate of a phase runs it with
  // the fixed argument list the verification-commands document of the scenario names,
  // and it carries no prompt at all. The document names the generic stub with the
  // subcommand below, which is the one thing that tells this call from a pass.
  if (options.argv[0] === VERIFICATION_SUBCOMMAND) return "verification";
  // The prompt decides. A diagnostician prompt QUOTES the verdict line of the
  // rejection it is asked about, and an accelerator prompt carries the archived
  // evidence and the critic feedback, so the presence of the word VERDICT is not
  // what tells the roles apart: the role the prompt NAMES is (F141-FR-008).
  if (options.argv.includes("--diagnose") && isDiagnosticianCall(options.prompt)) {
    return "diagnostician";
  }
  return roleOfPrompt(options.prompt);
}

/** The script of one role of one harness, where the scenario has one. */
export function scriptOfRole(
  scriptDir: string,
  role: HarnessRole,
  harness: string,
): StubScript | undefined {
  const kind =
    role === "critic"
      ? harness === "claude" || harness === "codex"
        ? "critic-http"
        : "critic-cli"
      : role === "verification"
        ? "verification-command"
        : role === "installer"
          ? "plugin-installer"
          : role;
  for (const name of [`${kind}.${harness}.json`, `${kind}.json`]) {
    const file = join(scriptDir, name);
    if (existsSync(file)) {
      const raw = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
      // The role is the KIND of the file the driver wrote, whatever the file says:
      // a script of a fixture holds the steps and nothing about which role reads it.
      return readScript(file, { harness, ...raw, role: kind });
    }
  }
  return undefined;
}

/** One call of a harness stub, from its executable name. */
export function runHarnessStub(options: {
  readonly executable: string;
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly argv: readonly string[];
  readonly stdin: string;
  readonly workdir: string;
}): number {
  const { env, argv, workdir } = options;
  const harness = harnessOfExecutable(options.executable) ?? "generic";
  const scriptDir = env[HARNESS_ENVIRONMENT.scriptDir];
  const fixtureDir = env[HARNESS_ENVIRONMENT.fixtureDir] ?? workdir;
  const stateDir = env[HARNESS_ENVIRONMENT.stateDir];
  const transcript = env[HARNESS_ENVIRONMENT.transcript];
  if (scriptDir === undefined || stateDir === undefined || transcript === undefined) {
    throw new HarnessStubError(
      `${HARNESS_ENVIRONMENT.scriptDir}, ${HARNESS_ENVIRONMENT.stateDir} and ` +
        `${HARNESS_ENVIRONMENT.transcript} are set by the hermetic environment of the run`,
    );
  }

  const call: HarnessCall = { executable: options.executable, argv, stdin: options.stdin, env };
  // The engine stub is no harness, so it has no convention: its call is read by
  // the argument list alone.
  const convention =
    harness === "generic" && options.executable === stubVocabulary().engineExecutable
      ? undefined
      : conventionOf(harness);
  const { prompt, promptChannel } =
    convention === undefined ? promptFromTheCall(call, "stdin") : convention.prompt(call);
  const role = roleOfInvocation({ executable: options.executable, argv, prompt });
  const script = scriptOfRole(scriptDir, role, harness);
  if (script === undefined) {
    throw new HarnessStubError(
      `the scenario has no script for the ${role} role of the ${harness} stub, and the stub was ` +
        `called in it (${scriptDir})`,
    );
  }

  const given = convention?.records(call);
  const callIndex = nextInvocation(stateDir, role, harness);
  const base = {
    role,
    harness,
    call: callIndex,
    argv: [...argv],
    envNames: [...environmentNames(env)],
    prompt,
    promptChannel,
    ...(given === undefined ? {} : { given }),
  } as const;
  const step = stepFor(script, callIndex);
  if (step === undefined) failWithOverrun(transcript, base, script.steps.length);

  // One record per invocation (§O.3, rule 4; F141-FR-011).
  writeTranscriptRecord(transcript, { ...base, step: { verbs: [...step.verbs] } });

  switch (role) {
    case "proposer":
      return carryOutProposerStep(step, proposerContext(env, prompt, workdir, fixtureDir));
    case "critic":
    case "diagnostician":
      return answerAsCli([...step.verbs], prompt, step.args ?? {});
    case "installer":
      return carryOutInstallerStep(step, {
        home: env["HOME"] ?? workdir,
        fixtureDir,
        tickMilliseconds: Math.max(1, Number(env["SPECSTRIDE_WATCHDOG_TICK"] ?? 1)) * 1000,
      });
    case "verification":
      return carryOutVerificationStep(step, {
        workdir,
        tickMilliseconds: Math.max(1, Number(env["SPECSTRIDE_WATCHDOG_TICK"] ?? 1)) * 1000,
      });
    case "engine": {
      const context: EngineContext = {
        workdir,
        feature: env["ORACLE_ENGINE_FEATURE"] ?? "001-greeting",
        attempt: engineAttempt(stateDir),
        tickMilliseconds: Math.max(1, Number(env["SPECSTRIDE_WATCHDOG_TICK"] ?? 1)) * 1000,
      };
      return carryOutEngineStep(step, context).exitCode;
    }
    default:
      throw new HarnessStubError(`${String(role)} is no role of a harness stub`);
  }
}

/** Read standard input to the end where there is one; no clock, so no timeout. */
function readStdin(): string {
  if (process.stdin.isTTY === true) return "";
  const file = process.env["SPECSTRIDE_STDIN_FILE"];
  try {
    return file !== undefined && file !== "" && existsSync(file)
      ? readFileSync(file, "utf8")
      : readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

/**
 * The stub as a process. Every file of `stubs/bin/` is a node-shebang wrapper
 * whose only line of its own is the name it was called by.
 */
export function harnessMain(executable: string): never {
  installGuards();
  const code = runHarnessStub({
    executable,
    env: process.env,
    argv: process.argv.slice(2),
    stdin: readStdin(),
    workdir: process.cwd(),
  });
  process.exit(code);
}
