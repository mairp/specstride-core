/**
 * T051 of feature 103 — CONFORMANCE TEST CT-103-123, THE INERTNESS SUITE
 * (F103-FR-023, F103-SC-007; annex D §D.1, "Proving test" (i) and (ii)).
 *
 * ## What "inert" is measured against
 *
 * F103-FR-023 is a statement about OUTPUT: with the built-in layer `none`, and
 * with a layer that is ON and never engages because no unit of work is
 * declared, the output is identical to the classic loop apart from the fields
 * the divergence register names. So the suite does not inspect the layer — it
 * runs THE WHOLE ORACLE twice, once with no layer and once with the sample
 * layer `noop` registered and wired at every call point, and compares what the
 * two runs produced: the exit code, the pass number reached, every counter,
 * every line of compatibility output and every as-is event, in order.
 *
 * ## The whole oracle: which families, and which scenarios of them
 *
 * `ORACLE_FAMILIES` below IS the oracle this suite runs, taken from the two
 * registers that state it and from nowhere else:
 *
 *  - the fixture families of feature 141 that cover the pass loop —
 *    `FX-17` (the iteration limit), `FX-18` (consecutive errors, both paths),
 *    `FX-19` (no progress, both paths), `FX-20` (the hard-cap kills) and
 *    `FX-24` (the short-pass nudge) — with the scenario names of the family
 *    table of `specs/141-parity-oracle/spec.md` §O.5;
 *  - the nine scenarios named `103-<name>` that this feature registers inside
 *    the scope of those same families in
 *    `specs/103-proposer-pass/contracts/scenarios.json`.
 *
 * That is twenty-nine scenarios in five families, and
 * `theWholeOracleIsCovered` asserts that `ORACLE_FIXTURES` holds one fixture
 * for EVERY one of them and for nothing else: the suite cannot silently run
 * part of the oracle and still report a pass.
 *
 * Each scenario is driven at the level this feature owns — the pass loop of
 * `packages/core/src/pass-loop/loop.ts` and the request record of
 * `packages/core/src/pass-loop/request.ts` — through the breaker, the counter
 * and the result the family table states for it. `subject` records which of
 * the two a scenario is about: a usage failure of `FX-17` and `FX-18` ends
 * before any pass starts, so its subject is the request record, and the layer
 * is never reachable in it at all. The baseline capture verb of the family
 * table (`run`, or `read` where feature 141 records that no baseline capture
 * reproduced the scenario) is carried on each fixture as `baselineVerb`, so
 * nothing here reads as a capture that was never taken.
 *
 * Both halves of "Proving test" (i) and (ii) are run over that set: the
 * built-in layer `none` of `packages/core/src/layers/none.ts`, and the sample
 * layer `noop` of `packages/testkit/src/samples/EP-04/noop.ts`, which is in
 * the test tree. The second suite — the one with the layer — must show EQUAL
 * COUNTERS on 100 per cent of the scenarios (F103-SC-007).
 */
import test from "node:test";
import assert from "node:assert/strict";
import type { PassHandle } from "@specstride/contracts/ep/harness";
import { CALL_POINTS } from "@specstride/contracts/ep/loop-layer";
import {
  CLASSIC_STRATEGY,
  INERTNESS_EXCEPTIONS,
  STRATEGY_KEY,
  STRATEGY_UNDER_PARITY,
  TIME_LIMITS_AND_COMMANDS_DIFFER_BEFORE_ENGAGEMENT,
  countersAreEqual,
  layerNone,
  offBecauseTheGateDoesNotExecute,
} from "../../../../core/src/layers/none.ts";
import { INVOKE_AT, LoopLayerStack, isNone } from "../../../../core/src/layers/call-points.ts";
import { LoopLayerRegistry } from "../../../../core/src/layers/registry.ts";
import { phaseAttemptView } from "../../../../core/src/layers/attempt-view.ts";
import {
  DEFAULT_LIMITS,
  ZERO_COUNTERS,
  type AccountingPath,
  type Counters,
  type Limits,
} from "../../../../core/src/pass-loop/accounting.ts";
import {
  normalizeRequest,
  type PassLoopRequestInput,
  type RequestIo,
} from "../../../../core/src/pass-loop/request.ts";
import { runPassLoop, type LoopServices } from "../../../../core/src/pass-loop/loop.ts";
import { noopLayer, NOOP_DECLARES_A_UNIT_OF_WORK } from "../../samples/EP-04/noop.ts";
import { PHASE_ATTEMPT_FACTS } from "./layer-probe.ts";

/* ------------------------------------------------------------------ *
 * THE WHOLE ORACLE: the families and their scenario names.
 * ------------------------------------------------------------------ */

/** The fixture families of the oracle that cover the pass loop. */
export const ORACLE_FAMILY_IDS = ["FX-17", "FX-18", "FX-19", "FX-20", "FX-24"] as const;
export type OracleFamilyId = (typeof ORACLE_FAMILY_IDS)[number];

/**
 * THE ORACLE, family by family and scenario by scenario.
 *
 * `scenarios` of each family is the family's row of the scenario table of
 * `specs/141-parity-oracle/spec.md` §O.5, followed by the scenarios named
 * `103-<name>` that `specs/103-proposer-pass/contracts/scenarios.json`
 * registers inside the scope of that family.
 */
export const ORACLE_FAMILIES = Object.freeze([
  Object.freeze({
    id: "FX-17" as const,
    name: "Iteration limit",
    result: "pass-loop exit 4 to engine exit 4",
    scenarios: Object.freeze([
      "iteration-limit",
      "iteration-returned-by-yield",
      "103-usage-workdir-missing",
      "103-usage-workdir-unenterable",
      "103-usage-evidence-missing",
      "103-usage-prompt-missing",
      "103-usage-flag-without-value",
    ]),
  }),
  Object.freeze({
    id: "FX-18" as const,
    name: "Consecutive errors",
    result: "pass-loop exit 7; on the plain-output path the no-progress breaker ends it with 8",
    scenarios: Object.freeze([
      "consecutive-errors-legacy",
      "consecutive-errors-structured",
      "harness-missing-dsh",
      "harness-missing-prime",
      "harness-missing-prime-launcher",
      "dsh-model-and-qualifier",
      "dsh-no-provider",
      "prime-variant-with-model",
      "dsh-overlay-cannot-build",
      "unknown-harness-name",
      "prime-empty-variant",
      "103-usage-unknown-arg",
      "103-usage-text",
    ]),
  }),
  Object.freeze({
    id: "FX-19" as const,
    name: "No progress",
    result: "pass-loop exit 8 on the plain-output path; no evaluation on the structured path",
    scenarios: Object.freeze([
      "no-progress-legacy",
      "no-progress-structured-not-evaluated",
      "103-empty-prompt",
      "103-evidence-present",
    ]),
  }),
  Object.freeze({
    id: "FX-20" as const,
    name: "Hard cap kills",
    result: "pass-loop exit 10, kill notes",
    scenarios: Object.freeze([
      "cap-exhausted-legacy",
      "cap-exhausted-structured",
      "kill-note-carried",
    ]),
  }),
  Object.freeze({
    id: "FX-24" as const,
    name: "Short-pass nudge",
    result: "the prompt block and its event",
    scenarios: Object.freeze(["short-pass-nudge", "yield-leaves-counter"]),
  }),
]);

/** Every scenario of the oracle, as `FAMILY/scenario`. */
export function oracleScenarioKeys(): readonly string[] {
  return Object.freeze(
    ORACLE_FAMILIES.flatMap((family) => family.scenarios.map((name) => `${family.id}/${name}`)),
  );
}

/* ------------------------------------------------------------------ *
 * One fixture of the oracle, as this feature drives it.
 * ------------------------------------------------------------------ */

/** One scenario of the oracle, with what drives it at the level of this feature. */
type OracleFixture = {
  readonly family: OracleFamilyId;
  readonly scenario: string;
  /** Which of the two surfaces of this feature the scenario is about. */
  readonly subject: "the pass loop" | "the request record";
  /** The capture verb of the family table of feature 141 (`run` or `read`). */
  readonly baselineVerb: "run" | "read";
  /** The result the family table states for the scenario. */
  readonly expectedExit: number;

  /* The pass loop. */
  readonly passLimit?: number;
  readonly limits?: Limits;
  readonly noProgressStructured?: boolean;
  readonly path?: AccountingPath;
  /** Phase evidence appears after this pass; absent means never. */
  readonly evidenceAfter?: number;
  /** Phase evidence is already there before the first pass. */
  readonly evidencePresentAtStart?: boolean;
  /** The standing prompt is white space alone. */
  readonly emptyPrompt?: boolean;
  readonly isError?: boolean;
  readonly madeProgress?: boolean;
  readonly killReason?: string;
  /** Where present, the kill reason applies to THIS pass alone. */
  readonly killOnPass?: number;
  /** The yield check of step 3 hands the pass back at this pass. */
  readonly yieldAt?: number;
  /** The short-pass counter of step 7 is wired. */
  readonly shortPassWired?: boolean;

  /* The request record. */
  readonly input?: PassLoopRequestInput;
  readonly io?: Partial<RequestIo>;
  readonly expectedFailure?: string;
};

/** The cap breaker is off by default; these fixtures are the ones that arm it. */
const CAP_AT_2: Limits = Object.freeze({ ...DEFAULT_LIMITS, maxCapKills: 2 });
const CAP_AT_3: Limits = Object.freeze({ ...DEFAULT_LIMITS, maxCapKills: 3 });

/**
 * One fixture per scenario of `ORACLE_FAMILIES`, in the same order.
 * `theWholeOracleIsCovered` holds the two in step.
 */
const ORACLE_FIXTURES: readonly OracleFixture[] = Object.freeze([
  /* FX-17 — the iteration limit. */
  {
    family: "FX-17",
    scenario: "iteration-limit",
    subject: "the pass loop",
    baselineVerb: "run",
    expectedExit: 4,
    passLimit: 3,
    path: "legacy",
  },
  {
    family: "FX-17",
    scenario: "iteration-returned-by-yield",
    subject: "the pass loop",
    baselineVerb: "run",
    // The limit is NOT reached: the pass that yielded and the pass that
    // resumed are one logical pass, and the phase is approved.
    expectedExit: 0,
    passLimit: 3,
    path: "legacy",
    evidenceAfter: 2,
  },
  {
    family: "FX-17",
    scenario: "103-usage-workdir-missing",
    subject: "the request record",
    baselineVerb: "run",
    expectedExit: 1,
    input: { workdir: "", evidence: "/w/evidence.md", standingPrompt: "p", harness: "stub" },
    expectedFailure: "workdir",
  },
  {
    family: "FX-17",
    scenario: "103-usage-workdir-unenterable",
    subject: "the request record",
    baselineVerb: "run",
    expectedExit: 1,
    input: { workdir: "/w", evidence: "/w/evidence.md", standingPrompt: "p", harness: "stub" },
    io: { canonical: () => undefined },
    expectedFailure: "cannot-enter",
  },
  {
    family: "FX-17",
    scenario: "103-usage-evidence-missing",
    subject: "the request record",
    baselineVerb: "run",
    expectedExit: 1,
    input: { workdir: "/w", evidence: "", standingPrompt: "p", harness: "stub" },
    expectedFailure: "evidence",
  },
  {
    family: "FX-17",
    scenario: "103-usage-prompt-missing",
    subject: "the request record",
    baselineVerb: "run",
    expectedExit: 1,
    input: {
      workdir: "/w",
      evidence: "/w/evidence.md",
      promptFile: "/w/absent.md",
      harness: "stub",
    },
    io: { isRegularFile: () => false },
    expectedFailure: "prompt-file",
  },
  {
    family: "FX-17",
    scenario: "103-usage-flag-without-value",
    subject: "the request record",
    baselineVerb: "run",
    expectedExit: 1,
    input: { workdir: undefined, evidence: "/w/evidence.md", standingPrompt: "p" },
    expectedFailure: "missing-value",
  },

  /* FX-18 — consecutive errors, on both paths. */
  {
    family: "FX-18",
    scenario: "consecutive-errors-legacy",
    subject: "the pass loop",
    baselineVerb: "run",
    expectedExit: 7,
    passLimit: 5,
    path: "legacy",
    // On the plain-output path a non-zero exit is no error; a kill by a
    // watchdog is, and `idle_timeout` is a kill of class hang.
    killReason: "idle_timeout",
  },
  {
    family: "FX-18",
    scenario: "consecutive-errors-structured",
    subject: "the pass loop",
    baselineVerb: "run",
    expectedExit: 7,
    passLimit: 5,
    path: "structured",
    isError: true,
  },
  {
    family: "FX-18",
    scenario: "harness-missing-dsh",
    subject: "the pass loop",
    baselineVerb: "run",
    // Every pass returns 127 and is not counted as an error, so the
    // no-progress breaker is what ends the loop.
    expectedExit: 8,
    passLimit: 6,
    path: "legacy",
    madeProgress: false,
  },
  {
    family: "FX-18",
    scenario: "harness-missing-prime",
    subject: "the pass loop",
    baselineVerb: "run",
    expectedExit: 7,
    passLimit: 5,
    path: "legacy",
    killReason: "launch_failed",
  },
  {
    family: "FX-18",
    scenario: "harness-missing-prime-launcher",
    subject: "the pass loop",
    baselineVerb: "run",
    expectedExit: 7,
    passLimit: 5,
    path: "legacy",
    killReason: "launch_failed",
  },
  {
    family: "FX-18",
    scenario: "dsh-model-and-qualifier",
    subject: "the pass loop",
    baselineVerb: "run",
    expectedExit: 8,
    passLimit: 6,
    path: "legacy",
    madeProgress: false,
  },
  {
    family: "FX-18",
    scenario: "dsh-no-provider",
    subject: "the pass loop",
    baselineVerb: "run",
    expectedExit: 8,
    passLimit: 6,
    path: "legacy",
    madeProgress: false,
  },
  {
    family: "FX-18",
    scenario: "prime-variant-with-model",
    subject: "the pass loop",
    baselineVerb: "run",
    expectedExit: 7,
    passLimit: 5,
    path: "legacy",
    killReason: "producer_nonzero",
  },
  {
    family: "FX-18",
    scenario: "dsh-overlay-cannot-build",
    subject: "the pass loop",
    // Feature 141 records that no baseline capture reproduced this one.
    baselineVerb: "read",
    expectedExit: 8,
    passLimit: 6,
    path: "legacy",
    madeProgress: false,
  },
  {
    family: "FX-18",
    scenario: "unknown-harness-name",
    subject: "the pass loop",
    baselineVerb: "run",
    expectedExit: 8,
    passLimit: 6,
    path: "legacy",
    madeProgress: false,
  },
  {
    family: "FX-18",
    scenario: "prime-empty-variant",
    subject: "the pass loop",
    baselineVerb: "run",
    expectedExit: 7,
    passLimit: 5,
    path: "legacy",
    killReason: "producer_nonzero",
  },
  {
    family: "FX-18",
    scenario: "103-usage-unknown-arg",
    subject: "the request record",
    baselineVerb: "run",
    expectedExit: 1,
    input: {
      notAFlagOfTheLoop: "x",
      workdir: "/w",
      evidence: "/w/evidence.md",
      standingPrompt: "p",
      harness: "stub",
    },
    expectedFailure: "unknown-arg",
  },
  {
    family: "FX-18",
    scenario: "103-usage-text",
    subject: "the request record",
    baselineVerb: "run",
    expectedExit: 0,
    input: { help: true },
  },

  /* FX-19 — no progress, on both paths. */
  {
    family: "FX-19",
    scenario: "no-progress-legacy",
    subject: "the pass loop",
    baselineVerb: "run",
    expectedExit: 8,
    passLimit: 6,
    path: "legacy",
    madeProgress: false,
  },
  {
    family: "FX-19",
    scenario: "no-progress-structured-not-evaluated",
    subject: "the pass loop",
    baselineVerb: "read",
    // The breaker is not reached: the structured path goes to the next pass,
    // which is the defect D-44 the `parity` profile preserves.
    expectedExit: 4,
    passLimit: 3,
    path: "structured",
    noProgressStructured: false,
    madeProgress: false,
  },
  {
    family: "FX-19",
    scenario: "103-empty-prompt",
    subject: "the pass loop",
    baselineVerb: "run",
    expectedExit: 1,
    passLimit: 3,
    path: "legacy",
    emptyPrompt: true,
  },
  {
    family: "FX-19",
    scenario: "103-evidence-present",
    subject: "the pass loop",
    baselineVerb: "run",
    expectedExit: 0,
    passLimit: 3,
    path: "legacy",
    evidencePresentAtStart: true,
  },

  /* FX-20 — the hard-cap kills. */
  {
    family: "FX-20",
    scenario: "cap-exhausted-legacy",
    subject: "the pass loop",
    baselineVerb: "read",
    expectedExit: 10,
    passLimit: 6,
    path: "legacy",
    limits: CAP_AT_2,
    killReason: "hard_cap",
  },
  {
    family: "FX-20",
    scenario: "cap-exhausted-structured",
    subject: "the pass loop",
    baselineVerb: "read",
    expectedExit: 10,
    passLimit: 6,
    path: "structured",
    limits: CAP_AT_2,
    killReason: "hard_cap",
  },
  {
    family: "FX-20",
    scenario: "kill-note-carried",
    subject: "the pass loop",
    baselineVerb: "run",
    // The cap is NOT exhausted: the first pass is killed and counted 1 of 3,
    // the next pass writes the evidence and the phase is approved.
    expectedExit: 0,
    passLimit: 6,
    path: "legacy",
    limits: CAP_AT_3,
    killReason: "hard_cap",
    killOnPass: 1,
    evidenceAfter: 2,
  },

  /* FX-24 — the short-pass nudge. */
  {
    family: "FX-24",
    scenario: "short-pass-nudge",
    subject: "the pass loop",
    baselineVerb: "run",
    expectedExit: 4,
    passLimit: 3,
    path: "legacy",
    shortPassWired: true,
  },
  {
    family: "FX-24",
    scenario: "yield-leaves-counter",
    subject: "the pass loop",
    baselineVerb: "run",
    expectedExit: 0,
    passLimit: 6,
    path: "legacy",
    madeProgress: false,
    yieldAt: 2,
  },
]);

/** `FAMILY/scenario` of one fixture. */
function keyOf(fixture: OracleFixture): string {
  return `${fixture.family}/${fixture.scenario}`;
}

/* ------------------------------------------------------------------ *
 * Running one fixture, with the layer and without it.
 * ------------------------------------------------------------------ */

const NO_STREAM: AsyncIterable<string> = {
  async *[Symbol.asyncIterator]() {
    // A pass of this suite produces no stream record.
  },
};

const HANDLE: PassHandle = Object.freeze({
  pid: 4242,
  startTime: "1970-01-01T00:00:00.000Z",
  stream: NO_STREAM,
  sessionId: "session-1",
});

/** One run of the loop, or of the request record, as the comparison reads it. */
type Run = {
  readonly exit_code: number;
  readonly passReached: number | undefined;
  readonly counters: Counters | undefined;
  readonly lines: readonly string[];
  readonly events: readonly string[];
  readonly blocked: unknown;
  /** How many times step 7 was reached, where it is wired. */
  readonly shortPasses: number;
  /** The failure kind of a request record that was refused. */
  readonly failure?: string;
};

const OK_IO: RequestIo = Object.freeze({
  isDirectory: () => true,
  isRegularFile: () => true,
  canonical: (path: string) => path,
  makeDirectory: () => undefined,
  readText: () => "a standing prompt",
});

function requestOf(fixture: OracleFixture) {
  const normalized = normalizeRequest(
    {
      workdir: "/w",
      evidence: "/w/evidence.md",
      standingPrompt: fixture.emptyPrompt === true ? "   \t  " : "a standing prompt",
      harness: "stub",
      role: "proposer",
      passLimit: fixture.passLimit ?? 3,
      pauseSec: 0,
    },
    OK_IO,
  );
  assert.equal(normalized.ok, true, keyOf(fixture));
  if (!normalized.ok) throw new Error("unreachable");
  return normalized.request;
}

/**
 * A scenario whose subject is the request record ends BEFORE any pass starts,
 * so no call point of a layer is reachable in it. That is what the run reports,
 * and the comparison is of the refusal the two runs produced.
 */
function runRequestRecord(fixture: OracleFixture): Run {
  const io: RequestIo = Object.freeze({ ...OK_IO, ...(fixture.io ?? {}) });
  const normalized = normalizeRequest(fixture.input ?? {}, io);
  assert.equal(normalized.ok, false, `${keyOf(fixture)}: the request must be refused`);
  if (normalized.ok) throw new Error("unreachable");
  const result = normalized.result;
  return Object.freeze({
    exit_code: result.exit_code,
    passReached: undefined,
    counters: undefined,
    lines: Object.freeze([result.message ?? "", result.usage ?? ""]),
    events: Object.freeze([]),
    blocked: undefined,
    shortPasses: 0,
    ...(result.failure !== undefined ? { failure: result.failure } : {}),
  });
}

/**
 * Run one fixture of the oracle. `stack` is absent for the classic loop and
 * present for the run with the sample layer; when it is present every call
 * point of the layer is reached, so a layer that did anything at any of the
 * eight would show up in the comparison.
 */
async function runFixture(fixture: OracleFixture, stack?: LoopLayerStack): Promise<Run> {
  if (fixture.subject === "the request record") return runRequestRecord(fixture);

  const lines: string[] = [];
  const events: string[] = [];
  let delivered = fixture.evidencePresentAtStart === true;
  let shortPasses = 0;
  const view = phaseAttemptView(PHASE_ATTEMPT_FACTS);
  const stopFlag = { requested: false };

  const services: LoopServices = {
    port: {
      startPass: async () => HANDLE,
      betweenPasses: async () => {
        // The layer is asked between passes, where no session is open.
        stack?.call("betweenPasses", { view });
        stack?.call("nextPassBlock", { view });
        return { outcome: "continue" } as never;
      },
    },
    evidenceExists: () => delivered,
    runPass: async (pass: number, passId: string) => {
      const after = fixture.evidenceAfter ?? 0;
      if (after > 0 && pass >= after) delivered = true;
      // The prompt of the pass: the layer contributes its blocks here.
      stack?.call("contributePrompt", { view });
      const killsThisPass =
        fixture.killReason !== undefined &&
        (fixture.killOnPass === undefined || fixture.killOnPass === pass);
      return {
        handle: HANDLE,
        result: { pass, passId },
        outcome: {
          path: fixture.path ?? "legacy",
          madeProgress: fixture.madeProgress ?? true,
          ...(fixture.isError === true ? { agentResult: { is_error: true } } : {}),
          ...(killsThisPass ? { killReason: fixture.killReason as string } : {}),
        },
      };
    },
    now: () => "1970-01-01T00:00:00Z",
    pause: async () => undefined,
    print: (line: string) => lines.push(line),
    emit: (announcement: unknown) => {
      const named = announcement as { asIsName?: string };
      events.push(named.asIsName ?? "?");
    },
    counters: ZERO_COUNTERS,
    ...(fixture.limits !== undefined ? { limits: fixture.limits } : {}),
    ...(fixture.noProgressStructured !== undefined
      ? { noProgressStructured: fixture.noProgressStructured }
      : {}),
    hooks: {
      afterPass: () => {
        // Step 4 of the fixed order: the layer at `afterPass`.
        stack?.call("afterPass", { view, checkpoint: { pass: 1 } });
        stack?.call("onEvidence", { view });
      },
      ...(fixture.yieldAt !== undefined
        ? {
            yieldCheck: (pass: number) =>
              pass >= (fixture.yieldAt as number) ? { exit_code: 0 } : undefined,
          }
        : {}),
      ...(fixture.shortPassWired === true
        ? {
            shortPass: () => {
              shortPasses += 1;
            },
          }
        : {}),
      stopRequested: () => stopFlag.requested,
    },
  };

  const result = await runPassLoop(requestOf(fixture), services);
  // The report of the run: the layer's `[LOOP]` fields and, on a resume, `resume`.
  stack?.call("resume", { view, ledger: Object.freeze([]) });
  stack?.call("contributeCriticInput", { view });
  stack?.call("report", { view });
  return Object.freeze({
    exit_code: result.exit_code,
    passReached: result.passReached,
    counters: result.counters,
    lines: Object.freeze([...lines]),
    events: Object.freeze([...events]),
    blocked: result.blocked,
    shortPasses,
  });
}

/** The sample layer `noop`, registered and stacked, as the second suite runs it. */
function stackWithNoop(where: string): LoopLayerStack {
  const registry = new LoopLayerRegistry();
  const registered = registry.register(noopLayer, { layerClass: "first-party" });
  assert.equal(registered.accepted, true, where);
  return new LoopLayerStack(registry);
}

/* ------------------------------------------------------------------ *
 * The layer `none`.
 * ------------------------------------------------------------------ */

test("CT-103-123 (F103-FR-023): the classic loop is the engine with the built-in layer `none`, which returns `none` at every one of the eight call points", () => {
  assert.equal(STRATEGY_KEY, "loop.strategy");
  assert.equal(CLASSIC_STRATEGY, "classic");
  assert.equal(STRATEGY_UNDER_PARITY, "classic");
  assert.equal(TIME_LIMITS_AND_COMMANDS_DIFFER_BEFORE_ENGAGEMENT, false);
  assert.equal(layerNone.registration.id, "none");
  assert.deepEqual([...layerNone.registration.directives], []);
  assert.deepEqual([...layerNone.registration.services], []);

  const view = phaseAttemptView(PHASE_ATTEMPT_FACTS);
  for (const point of CALL_POINTS) {
    const returned = INVOKE_AT[point](layerNone, { view, checkpoint: {}, ledger: [] });
    if (point === "report") {
      // The one point whose `none` is a record: the inert fields of the
      // `[LOOP]` line, which the divergence register names.
      assert.deepEqual(returned, { layer: "none", strategy: "classic", engaged: false, units: 0 });
      continue;
    }
    assert.equal(isNone(returned), true, `the layer \`none\` must return \`none\` at ${point}`);
  }
});

test("CT-103-123 (F103-FR-023): the only output a layer that never engages may add is what the divergence register names, and the layer is off where the verification gate does not execute", () => {
  assert.deepEqual(
    [...INERTNESS_EXCEPTIONS],
    [
      "the layer fields of the run record",
      "the layer fields of the `[LOOP]` line",
      "the protocol block of the registered layer (F103-FR-038)",
      "the ledger records of the layer's namespace (F103-FR-039)",
    ],
  );
  for (const mode of ["plan", "off"]) {
    const off = offBecauseTheGateDoesNotExecute(mode);
    assert.equal(off?.off, true, mode);
    assert.equal(off?.reason, "gate-not-executing", mode);
  }
  for (const mode of ["full", "inner", "", "gate"]) {
    assert.equal(offBecauseTheGateDoesNotExecute(mode), undefined, mode);
  }
});

/* ------------------------------------------------------------------ *
 * THE WHOLE ORACLE is what the suite runs.
 * ------------------------------------------------------------------ */

test("CT-103-123 (annex D §D.1): the suite runs THE WHOLE ORACLE — every scenario of FX-17, FX-18, FX-19, FX-20 and FX-24, and no other", () => {
  assert.deepEqual([...ORACLE_FAMILY_IDS], ["FX-17", "FX-18", "FX-19", "FX-20", "FX-24"]);
  assert.deepEqual(
    ORACLE_FAMILIES.map((family) => family.id),
    [...ORACLE_FAMILY_IDS],
  );
  // One fixture for every scenario of the oracle, in the order the families
  // state them, and not one fixture more.
  assert.deepEqual(ORACLE_FIXTURES.map(keyOf), [...oracleScenarioKeys()]);
  assert.equal(ORACLE_FIXTURES.length, 29);
  // Both surfaces of this feature are represented, and every family is run.
  assert.deepEqual(
    [...new Set(ORACLE_FIXTURES.map((fixture) => fixture.family))].sort(),
    [...ORACLE_FAMILY_IDS].sort(),
  );
  assert.deepEqual([...new Set(ORACLE_FIXTURES.map((fixture) => fixture.subject))].sort(), [
    "the pass loop",
    "the request record",
  ]);
  // Nothing claims a baseline capture feature 141 records as not taken.
  for (const fixture of ORACLE_FIXTURES) {
    assert.ok(
      fixture.baselineVerb === "run" || fixture.baselineVerb === "read",
      `${keyOf(fixture)}: the capture verb of the family table`,
    );
  }
});

/* ------------------------------------------------------------------ *
 * The sample layer `noop` over the whole oracle.
 * ------------------------------------------------------------------ */

test("CT-103-123 (F103-FR-023): the sample layer `noop` returns `none` at every call point and declares no directive", () => {
  assert.equal(noopLayer.registration.id, "noop");
  assert.deepEqual([...noopLayer.registration.directives], []);
  assert.deepEqual([...noopLayer.registration.services], []);
  assert.equal(NOOP_DECLARES_A_UNIT_OF_WORK, false);
  const view = phaseAttemptView(PHASE_ATTEMPT_FACTS);
  for (const point of CALL_POINTS) {
    const returned = INVOKE_AT[point](noopLayer, { view, checkpoint: {}, ledger: [] });
    if (point === "report") {
      assert.deepEqual(returned, { layer: "noop", engaged: false, units: 0 });
      continue;
    }
    assert.equal(isNone(returned), true, `\`noop\` must return \`none\` at ${point}`);
  }
});

test("CT-103-123 (F103-FR-023, F103-SC-007): over THE WHOLE ORACLE, the run with the sample layer `noop` on produces the same exit code, the same pass number, the same lines and the same events as the classic loop", async () => {
  const pointsEverAsked = new Set<string>();
  for (const fixture of ORACLE_FIXTURES) {
    const where = keyOf(fixture);
    const classic = await runFixture(fixture);
    const stack = stackWithNoop(where);
    const withLayer = await runFixture(fixture, stack);

    // The family table's result for the scenario, on the classic side: the
    // fixture drives what it says it drives.
    assert.equal(classic.exit_code, fixture.expectedExit, `${where}: the result of the family`);
    if (fixture.expectedFailure !== undefined) {
      assert.equal(classic.failure, fixture.expectedFailure, `${where}: the failure kind`);
    }

    assert.equal(withLayer.exit_code, classic.exit_code, `${where}: exit code`);
    assert.equal(withLayer.passReached, classic.passReached, `${where}: pass reached`);
    assert.deepEqual(withLayer.blocked, classic.blocked, `${where}: blocked`);
    assert.deepEqual([...withLayer.lines], [...classic.lines], `${where}: lines`);
    assert.deepEqual([...withLayer.events], [...classic.events], `${where}: events`);
    assert.equal(withLayer.failure, classic.failure, `${where}: failure kind`);
    assert.equal(withLayer.shortPasses, classic.shortPasses, `${where}: step 7 reached as often`);

    const asked = new Set(stack.pointsCalled());
    for (const point of asked) pointsEverAsked.add(point);
    if (fixture.subject === "the request record") {
      // No pass starts, so no call point is reachable at all: there is nothing
      // for a layer to be asked, which is the inertness of this scenario.
      assert.deepEqual([...asked], [], `${where}: no call point is reachable`);
      continue;
    }
    if (withLayer.events.includes("iter_start")) {
      // The layer really was asked, at all eight points: an inert run is not
      // an unasked one.
      assert.deepEqual([...asked].sort(), [...CALL_POINTS].sort(), `${where}: points asked`);
    } else {
      // The loop ended before any pass: only the points of the report are
      // reached, and the layer added nothing there either.
      assert.deepEqual(
        [...asked].sort(),
        ["contributeCriticInput", "report", "resume"],
        `${where}: points asked before any pass`,
      );
    }
    // And it stayed on: nothing it did switched it off.
    assert.equal(stack.isOn("noop"), true, `${where}: still on`);
    assert.deepEqual([...stack.offSoFar()], [], `${where}: nothing switched off`);
  }
  // Over the oracle as a whole, every one of the eight call points was asked.
  assert.deepEqual([...pointsEverAsked].sort(), [...CALL_POINTS].sort());
});

test("CT-103-123 (F103-SC-007): the second suite shows EQUAL COUNTERS on 100 per cent of the scenarios of the whole oracle", async () => {
  let compared = 0;
  let withCounters = 0;
  for (const fixture of ORACLE_FIXTURES) {
    const where = keyOf(fixture);
    const classic = await runFixture(fixture);
    const withLayer = await runFixture(fixture, stackWithNoop(where));

    assert.deepEqual(withLayer.counters, classic.counters, `${where}: counters`);
    if (fixture.subject === "the pass loop") {
      assert.ok(classic.counters !== undefined, where);
      assert.ok(withLayer.counters !== undefined, where);
      assert.equal(
        countersAreEqual(
          withLayer.counters as unknown as Readonly<Record<string, number>>,
          classic.counters as unknown as Readonly<Record<string, number>>,
        ),
        true,
        `${where}: counters equal by key and by value`,
      );
      withCounters += 1;
    } else {
      // A refused request record reaches no counter at all, on either side.
      assert.equal(classic.counters, undefined, where);
      assert.equal(withLayer.counters, undefined, where);
    }
    compared += 1;
  }
  assert.equal(compared, ORACLE_FIXTURES.length);
  assert.equal(compared / ORACLE_FIXTURES.length, 1, "100 per cent of the scenarios");
  assert.equal(withCounters, 22, "the scenarios of the oracle that run the pass loop");

  // The comparison is not vacuous: unequal counters are reported as unequal.
  assert.equal(countersAreEqual({ errorCount: 1 }, { errorCount: 0 }), false);
  assert.equal(countersAreEqual({ errorCount: 0 }, { errorCount: 0, capCount: 1 }), false);
});

test("CT-103-123: the oracle is not vacuous — its scenarios end in different ways and move the counters", async () => {
  const exits = new Set<number>();
  let nonZeroCounters = 0;
  for (const fixture of ORACLE_FIXTURES) {
    const classic = await runFixture(fixture);
    exits.add(classic.exit_code);
    const counters = classic.counters;
    if (
      counters !== undefined &&
      (counters.errorCount > 0 || counters.capCount > 0 || counters.noProgressCount > 0)
    ) {
      nonZeroCounters += 1;
    }
  }
  // A comparison of two runs proves nothing if every run ends the same way.
  // The oracle's own results: 0, 1, 4, 7, 8 and 10.
  assert.deepEqual(
    [...exits].sort((a, b) => a - b),
    [0, 1, 4, 7, 8, 10],
  );
  assert.ok(exits.has(0), "one scenario ends with phase evidence");
  assert.ok(
    nonZeroCounters >= 2,
    `${String(nonZeroCounters)} scenarios moved a counter away from zero`,
  );
});
