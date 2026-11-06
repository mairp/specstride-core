/**
 * T015 — the library of the stubs of the parity oracle (F141-FR-005,
 * F141-FR-011).
 *
 * The four parts T015 names, and the entry point every stub executable of a
 * fixture hands over to:
 *
 * | Part | File | What it is |
 * |---|---|---|
 * | script reader | `script.ts` | a script is a list of steps, one per invocation index; the verbs are those of `spec.md` §O.3 |
 * | invocation counter | `counter.ts` | the only state of a stub, kept outside the working directory |
 * | transcript writer | `transcript.ts` | one record per invocation: role, call, argument list, the names of the variables, the prompt |
 * | overrun | `overrun.ts` | a call beyond the last step fails with the fixed code and is recorded |
 * | entry point | `main.ts` | the guards, one call, the exit code |
 *
 * The library is `dev` code of the oracle. It is never part of the product
 * package (F141-FR-045).
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** `packages/oracle/stubs/lib/`. */
export const STUB_LIB_DIR = resolve(dirname(fileURLToPath(import.meta.url)));

/** The files of the library: the four parts of T015 and the entry point. */
export const STUB_LIB_FILES = [
  "script.ts",
  "counter.ts",
  "transcript.ts",
  "overrun.ts",
  "main.ts",
] as const;

export {
  OVERRUN_EXIT_CODE,
  STUB_KINDS,
  STUB_RULES,
  StubScriptError,
  readScript,
  stepFor,
  verbsOf,
  type ScriptStep,
  type StubScript,
} from "./script.ts";

export { counterFile, invocationCount, nextInvocation } from "./counter.ts";

export {
  TRANSCRIPT_RECORD_SCHEMA,
  TRANSCRIPT_ROLES,
  TranscriptError,
  environmentNames,
  readTranscript,
  recordAsLine,
  transportNeutral,
  writeTranscriptRecord,
  type TranscriptRecord,
} from "./transcript.ts";

export { StubOverrunError, failWithOverrun, overrunRecord } from "./overrun.ts";

export {
  STUB_ENVIRONMENT,
  UNIMPLEMENTED_VERB_EXIT_CODE,
  StubStartError,
  carryOut,
  promptOf,
  runStub,
  stubMain,
  type StubCallResult,
} from "./main.ts";
