/**
 * T015 — the script reader of a stub (F141-FR-005, rules 1 and 5).
 *
 * A script is a list of steps, one per invocation index of the stub. A step
 * names one or more verbs of the kind of stub it belongs to (`spec.md` §O.3,
 * which `packages/oracle/data/stub-vocabulary.json` holds). The reader refuses
 * anything else, so a script that would make a stub do something §O.3 does not
 * name never runs.
 *
 * Rule 5: a scenario is data, and it holds no nonce, no time and no path
 * outside the fixture. The reader is where that is enforced: a step whose
 * argument names an absolute path, a parent directory, a time or a nonce
 * refuses the script. The critic stub takes the nonce from the prompt it
 * receives and never from the script.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** `packages/oracle/data/stub-vocabulary.json`, the data form of §O.3. */
const VOCABULARY_FILE = join(
  resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url))))),
  "data/stub-vocabulary.json",
);

type Vocabulary = {
  rules: string[];
  overrunExitCode: number;
  kinds: Record<string, { verbs: string[] }>;
  harnessStubs: { harness: string; roles: Record<string, string> }[];
};

const vocabulary = JSON.parse(readFileSync(VOCABULARY_FILE, "utf8")) as Vocabulary;

/** The five rules of §O.3, as the data file states them. */
export const STUB_RULES: readonly string[] = Object.freeze([...vocabulary.rules]);

/**
 * The fixed exit code of a call beyond the last step of a script
 * (F141-FR-005). It is data of the oracle, not a number of this module.
 */
export const OVERRUN_EXIT_CODE: number = vocabulary.overrunExitCode;

/** The kinds of stub §O.3 names, with their verbs. */
export const STUB_KINDS: readonly string[] = Object.freeze(Object.keys(vocabulary.kinds));

/** The verbs of a kind of stub, or of the role a harness stub plays. */
export function verbsOf(kind: string): readonly string[] | undefined {
  const direct = vocabulary.kinds[kind];
  if (direct !== undefined) return Object.freeze([...direct.verbs]);
  return undefined;
}

/** A script that is not data of the vocabulary of §O.3. */
export class StubScriptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StubScriptError";
  }
}

/** One step of a script: the verbs of one invocation, and their arguments. */
export type ScriptStep = {
  readonly verbs: readonly string[];
  readonly args?: Readonly<Record<string, unknown>>;
};

/** The script of one stub of one scenario. */
export type StubScript = {
  /** The kind of stub, which is also the role the transcript records. */
  readonly role: string;
  /** The harness, where the stub is a harness stub. */
  readonly harness: string;
  readonly steps: readonly ScriptStep[];
};

/** What a scenario may never hold (rule 5). */
const FORBIDDEN_IN_A_SCENARIO: readonly [RegExp, string][] = [
  [/^\//, "an absolute path, which is a path outside the fixture"],
  [/(^|\/)\.\.(\/|$)/, "a parent directory, which is a path outside the fixture"],
  [/^~/, "the home directory, which is a path outside the fixture"],
  [/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "a time, and a stub has no clock"],
  [/\bnonce\b/i, "a nonce, which a stub takes from the prompt it receives"],
];

function assertData(value: unknown, at: string): void {
  if (typeof value === "string") {
    for (const [expression, why] of FORBIDDEN_IN_A_SCENARIO) {
      if (expression.test(value)) {
        throw new StubScriptError(`${at}: ${JSON.stringify(value)} holds ${why} (§O.3, rule 5)`);
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, i) => assertData(entry, `${at}/${String(i)}`));
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [name, entry] of Object.entries(value as Record<string, unknown>)) {
      assertData(name, `${at} (the name ${name})`);
      assertData(entry, `${at}/${name}`);
    }
  }
}

/**
 * Read and check the script of one stub. `value` is the parsed script where it
 * is given; otherwise `file` is read.
 */
export function readScript(file: string, value?: unknown): StubScript {
  const raw = (value === undefined ? JSON.parse(readFileSync(file, "utf8")) : value) as {
    role?: unknown;
    harness?: unknown;
    steps?: unknown;
  };
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new StubScriptError(`${file}: a script is an object`);
  }

  const role = raw.role;
  if (typeof role !== "string") throw new StubScriptError(`${file}: the script names no role`);
  const verbs = verbsOf(role);
  if (verbs === undefined) {
    throw new StubScriptError(
      `${file}: ${role} is no kind of stub of §O.3 (${STUB_KINDS.join(", ")})`,
    );
  }

  const harness = raw.harness ?? "";
  if (typeof harness !== "string") throw new StubScriptError(`${file}: the harness is no name`);
  if (harness !== "" && !vocabulary.harnessStubs.some((h) => h.harness === harness)) {
    throw new StubScriptError(`${file}: ${harness} is no harness stub of §O.3`);
  }

  const steps = raw.steps;
  if (!Array.isArray(steps)) {
    throw new StubScriptError(`${file}: a script is a list of steps, one per invocation index`);
  }

  const checked: ScriptStep[] = steps.map((entry, i) => {
    const at = `${file}: step ${String(i + 1)}`;
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      throw new StubScriptError(`${at} is an object`);
    }
    const step = entry as { verbs?: unknown; args?: unknown };
    if (!Array.isArray(step.verbs) || step.verbs.length === 0) {
      throw new StubScriptError(`${at} names no verb`);
    }
    for (const verb of step.verbs) {
      if (typeof verb !== "string" || !verbs.includes(verb)) {
        throw new StubScriptError(
          `${at}: ${JSON.stringify(verb)} is no verb of ${role} (${verbs.join(", ")})`,
        );
      }
    }
    if (step.args !== undefined) {
      if (step.args === null || typeof step.args !== "object" || Array.isArray(step.args)) {
        throw new StubScriptError(`${at}: the arguments of a step are an object`);
      }
      assertData(step.args, `${at}/args`);
    }
    return Object.freeze({
      verbs: Object.freeze([...(step.verbs as string[])]),
      ...(step.args === undefined
        ? {}
        : { args: Object.freeze({ ...(step.args as Record<string, unknown>) }) }),
    });
  });

  return Object.freeze({ role, harness, steps: Object.freeze(checked) });
}

/**
 * The step that answers an invocation index, or `undefined` when the call is
 * beyond the last step of the script — which is the overrun.
 */
export function stepFor(script: StubScript, call: number): ScriptStep | undefined {
  if (!Number.isInteger(call) || call < 1) {
    throw new StubScriptError(`${String(call)} is no invocation index; the first call is 1`);
  }
  return script.steps[call - 1];
}
