/**
 * T039 — the proposer stub and its eleven verbs (F141-FR-007).
 *
 * "The proposer stub MUST offer exactly the verbs of the proposer table of
 * §O.3, scripted per invocation index. It MUST offer no verb that declares a
 * unit of work or writes a checkpoint."
 *
 * The eleven verbs are data of the oracle: `kinds.proposer.verbs` of
 * `packages/oracle/data/stub-vocabulary.json`, which `script.ts` reads. This
 * module carries them out and offers nothing else — `carryOutProposerStep`
 * refuses a verb outside `PROPOSER_VERBS`, so the set in the data file and the
 * set the stub can do are one set.
 *
 * | Verb | What this module does |
 * |---|---|
 * | `write` | writes a file of the working directory from the fixture; with the argument `state: <logical name>` the file of state of that name, at the path `state-paths.ts` resolves for the side |
 * | `evidence` | writes the phase evidence the prompt names, by a temporary name and a rename |
 * | `stream` | prints a recorded stream file of the fixture, in the format of the harness |
 * | `text` | prints plain text |
 * | `sleep` | waits a number of watchdog ticks |
 * | `exit` | ends with a given exit code |
 * | `yield` | writes a yield artifact from the fixture |
 * | `silent` | prints nothing and stays alive, for the idle watchdog |
 * | `repeat` | prints the same output again and again, for the repetition watchdog |
 * | `nothing` | changes no file, for the no-progress breaker |
 * | `plugin-request` | writes a plugin request file from the fixture |
 *
 * No verb declares a unit of work and no verb writes a checkpoint
 * (F141-FR-039). `VERBS_A_PROPOSER_STUB_NEVER_HAS` names what such a verb
 * would be called, and `assertNoUnitOfWorkVerb` holds the vocabulary and this
 * module to it.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import process from "node:process";

import { verbsOf, type ScriptStep } from "./script.ts";
import {
  STATE_PATH_VARIABLE,
  readStatePathMap,
  resolveStateFile,
  type StatePathMap,
} from "./state-paths.ts";

/** The eleven verbs of the proposer stub, as the data form of §O.3 holds them. */
export const PROPOSER_VERBS: readonly string[] = verbsOf("proposer") ?? [];

/** How many verbs the proposer stub has: eleven (§O.3, "Closed sets"). */
export const PROPOSER_VERB_COUNT = 11 as const;

/**
 * What a verb that declares a unit of work or writes a checkpoint would be
 * called. The proposer stub has none of them: the micro-loop layer is off in
 * the first suite, and in the second suite "the stubs MUST behave exactly as in
 * the first suite and MUST never declare a unit of work" (F141-FR-039). A stub
 * that could declare one would make the second suite prove nothing.
 */
export const VERBS_A_PROPOSER_STUB_NEVER_HAS: readonly string[] = Object.freeze([
  "unit",
  "units",
  "declare-unit",
  "declare-units",
  "unit-of-work",
  "checkpoint",
  "write-checkpoint",
  "commit",
  "micro",
  "micro-loop",
  "closing-check",
]);

/** A call of the proposer stub that the vocabulary of §O.3 does not allow. */
export class ProposerStubError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProposerStubError";
  }
}

/**
 * The vocabulary offers exactly the eleven verbs, and none of them declares a
 * unit of work or writes a checkpoint (F141-FR-007, F141-FR-039).
 */
export function assertNoUnitOfWorkVerb(verbs: readonly string[] = PROPOSER_VERBS): void {
  if (verbs.length !== PROPOSER_VERB_COUNT) {
    throw new ProposerStubError(
      `the proposer stub offers ${String(verbs.length)} verbs; §O.3 names ` +
        `${String(PROPOSER_VERB_COUNT)} (${verbs.join(", ")})`,
    );
  }
  for (const verb of verbs) {
    if (VERBS_A_PROPOSER_STUB_NEVER_HAS.includes(verb)) {
      throw new ProposerStubError(
        `the verb ${verb} declares a unit of work or writes a checkpoint; the proposer stub has ` +
          `no such verb (F141-FR-007, F141-FR-039)`,
      );
    }
  }
}

/** What one call of the proposer stub was given. */
export type ProposerContext = {
  /** The working directory of the run; every path of a verb is inside it. */
  readonly workdir: string;
  /** The directory of the scenario, from which recorded files are read. */
  readonly fixtureDir: string;
  /** The prompt of this call: the evidence path of the phase is in it. */
  readonly prompt: string;
  /** The map of the files of state of this side (`state-paths.ts`). */
  readonly statePaths: StatePathMap;
  /** One watchdog tick in milliseconds; the fixture's tick variable, times 1000. */
  readonly tickMilliseconds: number;
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
};

/** A path of a verb is relative and stays inside the directory it is resolved against. */
function inside(root: string, path: string, verb: string): string {
  if (isAbsolute(path)) {
    throw new ProposerStubError(
      `${verb}: ${path} is an absolute path; a scenario is data and holds no path outside the ` +
        `fixture (§O.3, rule 5)`,
    );
  }
  const target = resolve(join(root, path));
  if (target !== resolve(root) && !target.startsWith(`${resolve(root)}/`)) {
    throw new ProposerStubError(`${verb}: ${path} leaves ${root}`);
  }
  return target;
}

/** Write a file, making the directories above it. */
function put(target: string, content: string): void {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, "utf8");
}

/** Write a file by a temporary name and a rename, as the evidence contract asks. */
function putAtomically(target: string, content: string): void {
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.tmp`;
  writeFileSync(temporary, content, "utf8");
  renameSync(temporary, target);
}

/**
 * A path the prompt names that is an ARCHIVE of a previous attempt's evidence and
 * not the file this pass is to write. The engine archives a rejected attempt under
 * `attempts/phase<N>/attempt<M>.<stamp>/`, and the accelerator prompt names that
 * copy first, to be read and spliced. A pass that wrote its evidence there would
 * leave the gate file missing, which is what the engine tests for.
 */
const AN_ARCHIVED_ATTEMPT = /(^|\/)attempts\//;

/**
 * The evidence file this pass is to write, as the prompt of the pass names it.
 * The prompt is the only place it is said — the stub has no state of the run —
 * so the stub reads it from there, which is what the agent it stands in for
 * does. A prompt names the file more than once, and not every mention is the file
 * to write: the accelerator prompt names the ARCHIVED evidence of the rejected
 * attempt first, to be read and spliced, and the quoted critic feedback can carry
 * the BARE file name with no directory. So the archived copies are dropped, a
 * mention that carries a directory is preferred over a bare name, and the FIRST
 * of what is left is taken.
 */
export function evidencePathFromPrompt(prompt: string, workdir?: string): string | undefined {
  const named = [...prompt.matchAll(/([\w./-]*GATE\d+-EVIDENCE\.md)/g)]
    .map((match) => match[1] as string)
    .filter((path) => !AN_ARCHIVED_ATTEMPT.test(path));
  const withADirectory = named.filter((path) => path.includes("/"));
  const found = (withADirectory.length > 0 ? withADirectory : named)[0];
  if (found === undefined) return undefined;
  // The reference names the file by its ABSOLUTE path in the prompt. A verb of a
  // stub writes inside the working directory and nowhere else, so the path is
  // taken relative to it; a path that is absolute and lies outside it is no
  // evidence of this run and is refused by `inside`.
  if (workdir !== undefined && isAbsolute(found)) {
    const root = resolve(workdir);
    if (found === root) return ".";
    if (found.startsWith(`${root}/`)) return found.slice(root.length + 1);
  }
  return found;
}

/**
 * The artifact of a yield this pass is to write, as the prompt of the pass names it
 * (a path that ends in `yield/phase<N>-attempt<M>-<run id>.json`, under the directory
 * the run keeps for its feature; F100-FR-026 keeps that directory's own name out of
 * every file of a package, so it is not written here). The run id is in the
 * name and the stub has no state of the run, so the prompt is the only place it is
 * said — which is where the agent it stands in for reads it too.
 */
export function yieldPathFromPrompt(prompt: string, workdir?: string): string | undefined {
  const match = /([\w./-]*\/yield\/phase\d+-attempt\d+-[\w.-]+\.json)/.exec(prompt);
  const found = match?.[1];
  if (found === undefined) return undefined;
  if (workdir !== undefined && isAbsolute(found)) {
    const root = resolve(workdir);
    if (found.startsWith(`${root}/`)) return found.slice(root.length + 1);
  }
  return found;
}

/** Wait a number of watchdog ticks. A stub has no clock: nothing is read, only waited. */
function waitTicks(ticks: number, tickMilliseconds: number): void {
  const milliseconds = Math.max(0, Math.trunc(ticks * tickMilliseconds));
  if (milliseconds === 0) return;
  // `Atomics.wait` blocks this thread for a span without reading a clock.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

/**
 * Carry out the verbs of one step of a proposer script. Returns the exit code
 * the step gives; a verb outside the eleven fails the call.
 */
export function carryOutProposerStep(step: ScriptStep, context: ProposerContext): number {
  const args = (step.args ?? {}) as Record<string, unknown>;
  const out = context.stdout ?? ((text: string): void => void process.stdout.write(text));
  const err = context.stderr ?? ((text: string): void => void process.stderr.write(text));
  let code = 0;

  for (const verb of step.verbs) {
    if (!PROPOSER_VERBS.includes(verb)) {
      throw new ProposerStubError(
        `${verb} is no verb of the proposer stub; §O.3 names ${PROPOSER_VERBS.join(", ")}`,
      );
    }
    switch (verb) {
      case "write": {
        const content = String(args["content"] ?? "written by the proposer stub\n");
        const logical = args["state"];
        if (logical !== undefined) {
          // The argument `state` of `write`: the script holds the logical name,
          // the oracle resolved the path for this side (F141-FR-012).
          const target = resolveStateFile(String(logical), context.statePaths);
          put(target, content);
          break;
        }
        put(inside(context.workdir, String(args["path"] ?? "proposer.txt"), verb), content);
        break;
      }
      case "evidence": {
        // The explicit path of the evidence file is its OWN argument, `evidence`,
        // never `path`: the verbs of one step share one map of arguments, so a
        // step that is `write` and then `evidence` would otherwise write the
        // evidence over the file `write` just made.
        const named = args["evidence"] === undefined ? undefined : String(args["evidence"]);
        const path = named ?? evidencePathFromPrompt(context.prompt, context.workdir);
        if (path === undefined) {
          throw new ProposerStubError(
            `evidence: the prompt of this call names no GATE<N>-EVIDENCE.md and the step names no ` +
              `path, so the stub does not know what evidence to write`,
          );
        }
        putAtomically(
          inside(context.workdir, path, verb),
          String(
            args["evidenceContent"] ?? "the evidence of the phase, written by the proposer stub\n",
          ),
        );
        break;
      }
      case "stream": {
        // A recorded stream file of the fixture, in the format of the harness.
        const file = inside(context.fixtureDir, String(args["file"] ?? "stream.jsonl"), verb);
        out(readFileSync(file, "utf8"));
        break;
      }
      case "text":
        out(String(args["text"] ?? ""));
        break;
      case "sleep":
        waitTicks(Number(args["ticks"] ?? 1), context.tickMilliseconds);
        break;
      case "exit":
        code = Number(args["code"] ?? 0);
        break;
      case "yield": {
        const file = inside(context.fixtureDir, String(args["file"] ?? "yield.json"), verb);
        // The artifact of a yield is named by the RUN of the pass (a path ending in
        // `yield/phase<N>-attempt<M>-<run id>.json`), which a stub
        // cannot know: it has no state of the run. The prompt of the pass names it,
        // exactly as it names the evidence file, so the stub reads it from there —
        // and a step may still name a path of its own with `into`.
        const named = args["into"] === undefined ? undefined : String(args["into"]);
        const path = named ?? yieldPathFromPrompt(context.prompt, context.workdir);
        if (path === undefined) {
          throw new ProposerStubError(
            `yield: the prompt of this call names no artifact of a yield and the step names no ` +
              `path with \`into\`, so the stub does not know where to declare the yield`,
          );
        }
        putAtomically(inside(context.workdir, path, verb), readFileSync(file, "utf8"));
        break;
      }
      case "silent":
        // Print nothing and stay alive, for the idle watchdog.
        waitTicks(Number(args["ticks"] ?? 1), context.tickMilliseconds);
        break;
      case "repeat": {
        const text = String(args["text"] ?? "still working\n");
        const times = Math.max(1, Math.trunc(Number(args["times"] ?? 3)));
        for (let i = 0; i < times; i += 1) out(text);
        break;
      }
      case "nothing":
        // Change no file, for the no-progress breaker.
        break;
      case "plugin-request": {
        const file = inside(
          context.fixtureDir,
          String(args["file"] ?? "plugin-request.json"),
          verb,
        );
        const target = inside(context.workdir, String(args["into"] ?? "plugin-request.json"), verb);
        putAtomically(target, readFileSync(file, "utf8"));
        break;
      }
      default:
        // Unreachable: the eleven cases above are PROPOSER_VERBS, and a verb
        // outside it was refused at the top of the loop.
        throw new ProposerStubError(`${verb} is in the vocabulary and this module does not do it`);
    }
  }
  if (code !== 0) err(`the proposer stub ends with ${String(code)}, as its step says\n`);
  return code;
}

/** The context of one call, from the environment of the run. */
export function proposerContext(
  env: Readonly<Record<string, string | undefined>>,
  prompt: string,
  workdir: string,
  fixtureDir: string,
): ProposerContext {
  const mapFile = env[STATE_PATH_VARIABLE];
  return Object.freeze({
    workdir,
    fixtureDir,
    prompt,
    statePaths: mapFile === undefined || mapFile === "" ? {} : readStatePathMap(mapFile),
    tickMilliseconds: Math.max(1, Number(env["SPECSTRIDE_WATCHDOG_TICK"] ?? 1)) * 1000,
  });
}
