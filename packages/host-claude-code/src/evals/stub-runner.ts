/**
 * T033 — the STUB of the host's suite runner, with RECORDED results
 * (F113-FR-041 (b)). The host's own suite runner is a full child of the host
 * on the consumer's credential: each of its runs calls a model, so the build
 * never starts it (a job of the build that would is refused by the static
 * check, `./static-check.ts`). The stub replays the recorded results instead,
 * among them an INTERRUPTED run (exit 130) and a run ended by the USAGE LIMIT,
 * which the driver reports as not scored (F113-FR-039).
 *
 * The STUB moved to `@specstride/host-kit` (`src/evals/stub-runner.ts` there,
 * the split of the monorepo, U-1): the replay over a GIVEN record is the
 * kit's. THIS module holds what is a fact of this host and cannot be the
 * kit's — the recorded results themselves, keyed by the case ids of
 * `evals/trigger-suites.json` and naming the skills this host invokes, and the
 * two figures of THIS record (the interrupted exit code, the usage-limit
 * marker) — and binds the kit to them, so every import path of this module
 * keeps its shape and replays exactly the same record as before the move.
 *
 * The stub holds no model id and makes no call of any kind: it is a table.
 */
import {
  type RecordedCaseResult,
  type SuiteRunner,
  USAGE_LIMIT_MARKER,
  stubSuiteRunner as kitStubSuiteRunner,
} from "@specstride/host-kit/evals";

/** The exit code of the recorded interrupted run (research R3v C7). */
export const RECORDED_INTERRUPTED_EXIT_CODE = 130 as const;

/** The marker of the recorded run the host ended on its usage limit. */
export const RECORDED_USAGE_LIMIT_MARKER = USAGE_LIMIT_MARKER;

/**
 * The recorded results of the stub, keyed by the case id of
 * `evals/trigger-suites.json`. Two entries are deliberately not scored: the
 * interrupted run (`run-pos-3`, exit 130) and the usage-limit run
 * (`doc-pos-2`).
 */
export const RECORDED_STUB_RESULTS: Readonly<Record<string, RecordedCaseResult>> = Object.freeze({
  "run-pos-1": Object.freeze({ invokedSkill: "specstride-run", toolCalls: Object.freeze([]) }),
  "run-pos-2": Object.freeze({ invokedSkill: "specstride-run", toolCalls: Object.freeze([]) }),
  // The recorded INTERRUPTED run: exit 130, reported as not scored.
  "run-pos-3": Object.freeze({
    invokedSkill: "specstride-run",
    toolCalls: Object.freeze([]),
    exitCode: RECORDED_INTERRUPTED_EXIT_CODE,
  }),
  "run-pos-4": Object.freeze({ invokedSkill: "specstride-run", toolCalls: Object.freeze([]) }),
  "run-pos-5": Object.freeze({ invokedSkill: "specstride-run", toolCalls: Object.freeze([]) }),
  "run-pos-6": Object.freeze({ invokedSkill: "specstride-run", toolCalls: Object.freeze([]) }),
  "run-neg-1": Object.freeze({
    invokedSkill: "specstride-reverse",
    toolCalls: Object.freeze([]),
  }),
  "run-neg-2": Object.freeze({
    invokedSkill: "specstride-reverse",
    toolCalls: Object.freeze([]),
  }),
  "run-neg-3": Object.freeze({
    invokedSkill: "specstride-reverse",
    toolCalls: Object.freeze([]),
  }),
  "run-neg-4": Object.freeze({ invokedSkill: null, toolCalls: Object.freeze([]) }),
  "run-neg-5": Object.freeze({ invokedSkill: null, toolCalls: Object.freeze([]) }),
  "run-neg-6": Object.freeze({ invokedSkill: null, toolCalls: Object.freeze([]) }),
  "rev-pos-1": Object.freeze({
    invokedSkill: "specstride-reverse",
    toolCalls: Object.freeze([]),
  }),
  "rev-pos-2": Object.freeze({
    invokedSkill: "specstride-reverse",
    toolCalls: Object.freeze([]),
  }),
  "rev-pos-3": Object.freeze({
    invokedSkill: "specstride-reverse",
    toolCalls: Object.freeze([]),
  }),
  "rev-pos-4": Object.freeze({
    invokedSkill: "specstride-reverse",
    toolCalls: Object.freeze([]),
  }),
  "rev-pos-5": Object.freeze({
    invokedSkill: "specstride-reverse",
    toolCalls: Object.freeze([]),
  }),
  "rev-pos-6": Object.freeze({
    invokedSkill: "specstride-reverse",
    toolCalls: Object.freeze([]),
  }),
  "rev-neg-1": Object.freeze({ invokedSkill: "specstride-run", toolCalls: Object.freeze([]) }),
  "rev-neg-2": Object.freeze({ invokedSkill: "specstride-run", toolCalls: Object.freeze([]) }),
  "rev-neg-3": Object.freeze({ invokedSkill: "specstride-run", toolCalls: Object.freeze([]) }),
  "rev-neg-4": Object.freeze({ invokedSkill: null, toolCalls: Object.freeze([]) }),
  "rev-neg-5": Object.freeze({ invokedSkill: null, toolCalls: Object.freeze([]) }),
  "rev-neg-6": Object.freeze({ invokedSkill: null, toolCalls: Object.freeze([]) }),
  "doc-pos-1": Object.freeze({ invokedSkill: "doctor", toolCalls: Object.freeze([]) }),
  // The recorded run the host ended on its USAGE LIMIT: not scored.
  "doc-pos-2": Object.freeze({
    invokedSkill: "doctor",
    toolCalls: Object.freeze([]),
    marker: RECORDED_USAGE_LIMIT_MARKER,
  }),
  "doc-pos-3": Object.freeze({ invokedSkill: "doctor", toolCalls: Object.freeze([]) }),
  "doc-pos-4": Object.freeze({ invokedSkill: "doctor", toolCalls: Object.freeze([]) }),
  "doc-pos-5": Object.freeze({ invokedSkill: "doctor", toolCalls: Object.freeze([]) }),
  "doc-pos-6": Object.freeze({ invokedSkill: "doctor", toolCalls: Object.freeze([]) }),
  "doc-neg-1": Object.freeze({ invokedSkill: "specstride-run", toolCalls: Object.freeze([]) }),
  "doc-neg-2": Object.freeze({ invokedSkill: null, toolCalls: Object.freeze([]) }),
  "doc-neg-3": Object.freeze({
    invokedSkill: "specstride-reverse",
    toolCalls: Object.freeze([]),
  }),
  "doc-neg-4": Object.freeze({ invokedSkill: null, toolCalls: Object.freeze([]) }),
  "doc-neg-5": Object.freeze({ invokedSkill: null, toolCalls: Object.freeze([]) }),
  "doc-neg-6": Object.freeze({ invokedSkill: null, toolCalls: Object.freeze([]) }),
});

// The recorded figures above are this record's face of the kit's run
// mechanics: the interrupted exit code 130 is the first interruption a POSIX
// runner reports (the kit's `INTERRUPTED_EXIT_CODES`), and the marker is the
// kit's usage-limit marker, imported above. The binding test holds both ties.

/** The stub of the host's suite runner: it replays the record and calls nothing. */
export function stubSuiteRunner(): SuiteRunner {
  return kitStubSuiteRunner(RECORDED_STUB_RESULTS);
}
