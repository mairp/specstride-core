/**
 * T015 — the entry point of the library of the stubs (F141-FR-005, F141-FR-011).
 *
 * Every stub executable of a fixture's `stub-bin` is a one-line wrapper that
 * hands over to `stubMain`, so "the same stub, unchanged, serves the reference
 * and the port" (§O.3, rule 3) is true by construction: there is one
 * implementation and the two sides differ only in the environment they start
 * it with.
 *
 * What one call does, in this order:
 *
 * 1. the guards of F141-FR-038: a credential of the machine ends the run
 *    before anything else happens, and from here on a connection beyond
 *    loopback ends it too;
 * 2. the script is read and checked (`script.ts`);
 * 3. the invocation index is taken from the counter outside the working
 *    directory (`counter.ts`);
 * 4. the step of that index is looked up. There is none for a call beyond the
 *    last step: the overrun is recorded and the call fails with the fixed code
 *    (`overrun.ts`);
 * 5. one record is appended to the transcript (`transcript.ts`);
 * 6. the verbs of the step are carried out.
 *
 * The verbs this phase carries out are the ones the rules of a stub can be
 * witnessed with: `write`, `text`, `evidence`, `nothing`, `exit`. The rest of
 * the vocabulary of §O.3 belongs to the stub executables of the later phases;
 * `UNIMPLEMENTED_VERB_EXIT_CODE` is what a verb that is not built yet gives,
 * so a fixture can never take silence for a pass.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { installGuards } from "../../src/env/guard.ts";
import { nextInvocation } from "./counter.ts";
import { failWithOverrun } from "./overrun.ts";
import { readScript, stepFor, type ScriptStep, type StubScript } from "./script.ts";
import { environmentNames, writeTranscriptRecord } from "./transcript.ts";

/** The variables through which a stub finds its script, its counter and its transcript. */
export const STUB_ENVIRONMENT = {
  role: "ORACLE_STUB_ROLE",
  harness: "ORACLE_STUB_HARNESS",
  script: "ORACLE_STUB_SCRIPT",
  stateDir: "ORACLE_STUB_STATE_DIR",
  transcript: "ORACLE_STUB_TRANSCRIPT",
} as const;

/** The exit code of a verb of §O.3 that this phase does not carry out yet. */
export const UNIMPLEMENTED_VERB_EXIT_CODE = 94 as const;

/** Something the stub was started without. */
export class StubStartError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StubStartError";
  }
}

function required(env: Readonly<Record<string, string | undefined>>, name: string): string {
  const value = env[name];
  if (value === undefined || value === "") {
    throw new StubStartError(
      `${name} is not set; the hermetic environment of the run sets it (F141-FR-003)`,
    );
  }
  return value;
}

/** The prompt of a call, and the channel it arrived on. */
export function promptOf(
  argv: readonly string[],
  stdin: string,
): {
  prompt: string;
  promptChannel: "stdin" | "argument";
} {
  if (stdin !== "") return { prompt: stdin, promptChannel: "stdin" };
  const flag = argv.findIndex((a) => a === "-p" || a === "--prompt");
  if (flag >= 0 && argv[flag + 1] !== undefined) {
    return { prompt: argv[flag + 1] as string, promptChannel: "argument" };
  }
  const positional = argv.find((a) => !a.startsWith("-"));
  return { prompt: positional ?? "", promptChannel: "argument" };
}

/** Carry out the verbs of one step in the working directory. */
export function carryOut(step: ScriptStep, workdir: string): number {
  const args = (step.args ?? {}) as Record<string, unknown>;
  let code = 0;
  for (const verb of step.verbs) {
    switch (verb) {
      case "write": {
        const path = String(args["path"] ?? "written-by-the-stub.txt");
        if (isAbsolute(path))
          throw new StubStartError(`write: ${path} is outside the working directory`);
        const target = join(workdir, path);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, String(args["content"] ?? ""), "utf8");
        break;
      }
      case "evidence": {
        // The phase evidence, by a temporary name and a rename, as §O.3 says.
        const path = String(args["path"] ?? "evidence.md");
        if (isAbsolute(path))
          throw new StubStartError(`evidence: ${path} is outside the working directory`);
        const target = join(workdir, path);
        mkdirSync(dirname(target), { recursive: true });
        const temporary = `${target}.tmp`;
        writeFileSync(temporary, String(args["content"] ?? "the evidence of the phase\n"), "utf8");
        renameSync(temporary, target);
        break;
      }
      case "text":
        process.stdout.write(String(args["text"] ?? ""));
        break;
      case "nothing":
        // Change no file, for the no-progress breaker.
        break;
      case "exit":
        code = Number(args["code"] ?? 0);
        break;
      default:
        process.stderr.write(
          `the verb ${verb} of §O.3 is in the vocabulary and the stub executables of the later ` +
            `phases carry it out; this library does not (F141-FR-005)\n`,
        );
        return UNIMPLEMENTED_VERB_EXIT_CODE;
    }
  }
  return code;
}

export type StubCallResult = {
  readonly call: number;
  readonly script: StubScript;
  readonly step: ScriptStep;
  readonly exitCode: number;
};

/**
 * One call of a stub. Returns what the call did; a call beyond the last step
 * of the script does not return — it records the overrun and ends the process
 * with the fixed code.
 */
export function runStub(options: {
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly argv?: readonly string[];
  readonly stdin?: string;
  readonly workdir?: string;
}): StubCallResult {
  const env = options.env ?? process.env;
  const argv = options.argv ?? process.argv.slice(2);
  const workdir = options.workdir ?? process.cwd();

  const role = required(env, STUB_ENVIRONMENT.role);
  const harness = env[STUB_ENVIRONMENT.harness] ?? "";
  const scriptFile = required(env, STUB_ENVIRONMENT.script);
  const stateDir = required(env, STUB_ENVIRONMENT.stateDir);
  const transcriptFile = required(env, STUB_ENVIRONMENT.transcript);

  if (
    resolve(stateDir).startsWith(`${resolve(workdir)}/`) ||
    resolve(stateDir) === resolve(workdir)
  ) {
    throw new StubStartError(
      `the state directory ${stateDir} is inside the working directory ${workdir}; the only state ` +
        `of a stub is an invocation counter outside the working directory (§O.3, rule 1)`,
    );
  }
  if (resolve(transcriptFile).startsWith(`${resolve(workdir)}/`)) {
    throw new StubStartError(
      `the transcript ${transcriptFile} is inside the working directory ${workdir}; a stub writes ` +
        `its transcript outside it (F141-FR-011)`,
    );
  }

  const script = readScript(scriptFile);
  const call = nextInvocation(stateDir, role, harness);
  const { prompt, promptChannel } = promptOf(argv, options.stdin ?? "");
  const base = {
    role,
    ...(harness === "" ? {} : { harness }),
    call,
    argv: [...argv],
    envNames: [...environmentNames(env)],
    prompt,
    promptChannel,
  } as const;

  const step = stepFor(script, call);
  if (step === undefined) failWithOverrun(transcriptFile, base, script.steps.length);

  // One record per invocation (§O.3, rule 4).
  writeTranscriptRecord(transcriptFile, { ...base, step: { verbs: [...step.verbs] } });

  return { call, script, step, exitCode: carryOut(step, workdir) };
}

/** Read standard input to the end, where there is one; no clock, so no timeout. */
function readStdin(): string {
  if (process.stdin.isTTY === true) return "";
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

/**
 * The stub as a process: the guards, one call, and the exit code the step
 * gives. Every stub executable of a fixture calls this.
 */
export function stubMain(): never {
  installGuards();
  const stdin = readStdin();
  const result = runStub({ stdin });
  process.exit(result.exitCode);
}

/**
 * A stub executable of a fixture's `stub-bin` is a wrapper that runs this file,
 * so this file is the stub when it is the program being run. Imported as a
 * module — by the tests and by `index.ts` — it only defines the functions
 * above and runs nothing.
 */
if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  stubMain();
}
