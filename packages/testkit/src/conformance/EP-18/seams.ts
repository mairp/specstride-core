/**
 * T030 of feature 149 — the CONFORMANCE SUITE OF BOTH SEAMS of EP-18, the
 * "Conformance suite" table of
 * `specs/149-attempt-planner-and-seams/contracts/ep18-seams.md` (F149-FR-010).
 *
 * The nine rows of that table are `SEAM_SUITE_ROWS` below, each with the id of
 * the conformance case that covers it, so that a reader can check the suite
 * against the contract file row by row and a test can assert that no row is
 * left without a case.
 *
 * The suite is run through the FRAME of the test kit and not beside it: every
 * subject is offered to `registryOf("EP-18")` of `../frame.ts`, and the cases
 * are `ConformanceCase`s of `../run.ts`, so a report of this suite names the
 * point, the implementation, the class and the major and carries the standing
 * `internal-seam` (F100-FR-017, F100-FR-020).
 *
 * The subjects are given by the caller, which is what makes this a suite and
 * not a test of one implementation: `ep18.conformance.test.ts` of this folder
 * runs it on the sample strategy, on the two sample planners and on both
 * planners of Wave 1, and an author of a new strategy or planner runs it on
 * theirs by passing it in.
 *
 * The seams themselves live in the core, and this module reaches them by
 * relative path: `@specstride/core` names only `.` in its `exports`, and
 * widening the manifest of a package another feature owns is not this feature's
 * to do. The test kit may import anything (`mayImport: ["anything"]` of the
 * package graph), and a relative import is never a boundary violation.
 */
import assert from "node:assert/strict";
import type {
  AttemptHistory,
  AttemptKind,
  GateInput,
  Verdict,
} from "@specstride/contracts/ep/critic-strategy";
import {
  ATTEMPT_KINDS,
  ATTEMPT_KIND_WHEN_UNKNOWN,
  ATTEMPT_PLANNER_ID,
  CRITIC_STRATEGY_ID,
  FAILURE_PATHS,
  VERDICTS,
  VERDICT_WHEN_UNKNOWN,
} from "@specstride/contracts/ep/critic-strategy";
import { isCriticCallOutcome, isNextAttemptPlan } from "@specstride/contracts/ep/ep18-values";
import type { CriticCallOutcome } from "@specstride/contracts/ep/ep18-values";
import {
  judgePhaseGate,
  registerCriticStrategy,
  resetCriticStrategiesForTest,
  type CompletionCallFacts,
  type CompletionPortCall,
  type CompletionRequest,
  type EngineCriticStrategy,
  type JudgeDependencies,
} from "../../../../core/src/ep18/critic-strategy.ts";
import {
  attemptPlannersInOrder,
  planNextAttempt,
  registerAttemptPlanner,
  resetAttemptPlannersForTest,
  type AttemptPlannerInput,
  type PlannerContribution,
  type SeamAttemptPlanner,
} from "../../../../core/src/ep18/attempt-planner.ts";
import {
  attemptHistoryOf,
  buildPhaseHistory,
  type PhaseHistory,
} from "../../../../core/src/ep18/history.ts";
import { registryOf, type Implementation } from "../frame.ts";
import { runSuite, type ConformanceCase, type SuiteReport } from "../run.ts";
import {
  compareTheBuildWithAndWithoutTheSamples,
  coreFilesNamingASample,
  observeACoreFileNamingASample,
  NAMING_RULE,
} from "./samples-outside-the-core.ts";

/** The point both seams belong to. */
export const EP = "EP-18" as const;

/** The contract file this suite is the suite of. */
export const CONTRACT_FILE = "specs/149-attempt-planner-and-seams/contracts/ep18-seams.md" as const;

/* ==================================================================== *
 * The nine rows of the "Conformance suite" table of the contract file.
 * ==================================================================== */

/** One row of the table: the case, what it asserts, and the id that covers it. */
export type SeamSuiteRow = {
  /** The "Case" cell, verbatim. */
  readonly case: string;
  /** The "Asserts" cell, verbatim. */
  readonly asserts: string;
  /** Which of the two seams the row is about. */
  readonly seam: "critic-strategy" | "attempt-planner" | "both";
  /** The id of the conformance case of this module that covers the row. */
  readonly caseId: string;
};

/**
 * The table of `ep18-seams.md`, "Conformance suite", as data. The two cells of
 * every row are verbatim; the two other columns are this module's.
 */
export const SEAM_SUITE_ROWS: readonly SeamSuiteRow[] = Object.freeze([
  Object.freeze({
    case: "Strategy returns one record",
    asserts: "Exactly one verdict record per `judge`",
    seam: "critic-strategy",
    caseId: "EP-18/seams/strategy-returns-one-record",
  }),
  Object.freeze({
    case: "Strategy with two calls",
    asserts: "Two nonces, two fresh sessions, neither equal to a session of a pass",
    seam: "critic-strategy",
    caseId: "EP-18/seams/strategy-with-two-calls",
  }),
  Object.freeze({
    case: "One call MALFORMED, one APPROVED",
    asserts: "The verdict is not APPROVED",
    seam: "critic-strategy",
    caseId: "EP-18/seams/one-call-malformed-one-approved",
  }),
  Object.freeze({
    case: "Strategy throws",
    asserts: "MALFORMED; the MALFORMED streak rises by one",
    seam: "critic-strategy",
    caseId: "EP-18/seams/strategy-throws",
  }),
  Object.freeze({
    case: "Strategy returns an unknown verdict",
    asserts: "MALFORMED",
    seam: "critic-strategy",
    caseId: "EP-18/seams/strategy-returns-an-unknown-verdict",
  }),
  Object.freeze({
    case: "Planner is pure",
    asserts: "The same history gives the same result; no write is observed",
    seam: "attempt-planner",
    caseId: "EP-18/seams/planner-is-pure",
  }),
  Object.freeze({
    case: "Planner throws or returns an unknown kind",
    asserts: "`plain`",
    seam: "attempt-planner",
    caseId: "EP-18/seams/planner-throws-or-returns-an-unknown-kind",
  }),
  Object.freeze({
    case: "Both planners of Wave 1",
    asserts: "Pass every planner case",
    seam: "attempt-planner",
    caseId: "EP-18/seams/both-planners-of-wave-1",
  }),
  Object.freeze({
    case: "Samples outside the core",
    asserts:
      "No core file names a sample; the build with and without the samples differs in no core file",
    seam: "both",
    caseId: "EP-18/seams/samples-outside-the-core",
  }),
]);

/** The row of the table that a case id covers. */
export function rowOfTheCase(caseId: string): SeamSuiteRow | undefined {
  return SEAM_SUITE_ROWS.find((row) => row.caseId === caseId);
}

/* ==================================================================== *
 * What the suite is run on.
 * ==================================================================== */

/** One subject of the suite at the seam of the critic strategy. */
export type StrategySubject = {
  /** The id the subject registers under in both registries. */
  readonly id: string;
  readonly strategy: EngineCriticStrategy;
  /** How many calls the strategy makes per phase gate. */
  readonly calls: number;
};

/** One subject of the suite at the seam of the attempt planner. */
export type PlannerSubject = {
  readonly id: string;
  readonly planner: SeamAttemptPlanner;
  /** True for a planner of Wave 1, which row 8 of the table is about. */
  readonly waveOne?: boolean;
};

/* ==================================================================== *
 * The fixtures of the suite. Nothing paid, nothing on disk, no clock.
 * ==================================================================== */

/** The session ids of the passes of the phase attempt the suite judges. */
export const SESSIONS_OF_THE_PASSES = Object.freeze(["pass-session-1", "pass-session-2"]);

/** The model of the critic in the role plan of the suite. */
export const CRITIC_MODEL = "critic-model-of-the-suite" as const;

/** The models that produced the passes: not the critic's, so no warning is due. */
export const MODELS_OF_THE_PASSES = Object.freeze(["proposer-model-of-the-suite"]);

/** The input of the phase gate the suite hands to `judge`. */
export function gateInputOfTheSuite(): GateInput {
  return Object.freeze({
    phaseEvidence: Object.freeze({
      logicalName: "attempt:1:1:1:evidence",
      hash: "a".repeat(64),
      size: 128,
    }),
    groundingSnapshot: Object.freeze({
      logicalName: "attempt:1:1:1:grounding",
      hash: "b".repeat(64),
      size: 256,
    }),
    verificationResult: Object.freeze({ passed: true }),
    factBlock: Object.freeze([]),
    rolePlan: Object.freeze({ critic: Object.freeze({ model: CRITIC_MODEL }) }),
  });
}

/** What the stub critic of the suite replies to the call at an ordinal, from 1. */
export type ReplyPlan = (callOrdinal: number, nonce: string) => string;

/** Every call replies with the same verdict, on a full line with its nonce. */
export function alwaysReplies(verdict: Verdict | string): ReplyPlan {
  return (_ordinal, nonce) => `I read the grounding snapshot.\n${verdict} ${nonce}\n`;
}

/** The call at `ordinal` replies with text that carries no verdict at all. */
export function repliesMalformedAt(ordinal: number, verdict: Verdict = "APPROVED"): ReplyPlan {
  return (callOrdinal, nonce) =>
    callOrdinal === ordinal
      ? "I could not read the grounding snapshot, so I say nothing.\n"
      : `${verdict} ${nonce}\n`;
}

/** The stub of `complete` of the harness port, with the requests it received. */
export type StubCritic = {
  readonly complete: CompletionPortCall;
  requests(): readonly CompletionRequest[];
};

/**
 * A stub critic: no paid call, no process, no network. The proof of the first
 * form passes, because the stub writes an initial record with an empty tool
 * list and the session id the call function minted (annex C §C.3).
 */
export function stubCritic(reply: ReplyPlan): StubCritic {
  const requests: CompletionRequest[] = [];
  const complete: CompletionPortCall = (request) => {
    requests.push(request);
    const facts: CompletionCallFacts = {
      reply: reply(requests.length, request.nonce),
      initialRecord: { tools: request.tools, sessionId: request.sessionId },
      model: request.model,
      usage: Object.freeze({ inputTokens: 900, outputTokens: 12 }),
      latency: 7,
    };
    return Promise.resolve(facts);
  };
  return { complete, requests: () => Object.freeze([...requests]) };
}

/** What the engine hands in to judge one phase gate of the suite. */
export function judgeDependenciesOfTheSuite(
  strategyId: string,
  reply: ReplyPlan,
  over: Partial<JudgeDependencies> = {},
): { readonly deps: JudgeDependencies; readonly critic: StubCritic } {
  const critic = stubCritic(reply);
  const deps: JudgeDependencies = {
    complete: critic.complete,
    gate: gateInputOfTheSuite(),
    form: "tool-less",
    criticModel: CRITIC_MODEL,
    modelsThatProducedPasses: MODELS_OF_THE_PASSES,
    sessionIdsOfThePasses: SESSIONS_OF_THE_PASSES,
    readOnlyTools: Object.freeze([]),
    sessionIdIsTakenFromTheCaller: true,
    provenance: "configured",
    strategyId,
    verdictId: `attempt:1:1:1:verdict/${strategyId}`,
    ...over,
  };
  return { deps, critic };
}

/**
 * A call function that gives the strategy outcomes directly, with the call at
 * `ordinal` MALFORMED and every other APPROVED. It is handed to a strategy to
 * observe the strategy's OWN answer, beside the verdict the engine lets
 * through. No harness and no nonce is involved: the outcome of a call is all a
 * strategy ever sees.
 */
export function outcomesOf(verdict: Verdict, calls: number): SampleCallFunction {
  let made = 0;
  return (_demand: string) => {
    made += 1;
    assert.ok(made <= Math.max(calls, 1), "the strategy made more calls than it declares");
    return Promise.resolve(outcomeOfTheSuite(verdict, made));
  };
}

/** One outcome of a critic call, as the engine's call function builds it. */
export function outcomeOfTheSuite(verdict: Verdict, ordinal: number): CriticCallOutcome {
  return Object.freeze({
    verdict,
    sessionId: `session-of-the-suite-${String(ordinal)}`,
    form: "tool-less" as const,
    proof: Object.freeze({
      form: "tool-less" as const,
      outcome: "passed" as const,
      kind: "initial-record" as const,
      sessionProofCase: "caller-minted-id" as const,
      weakerProof: false,
      facts: Object.freeze({ emptyToolList: true, sessionIdentity: true }),
      underParity: false,
    }),
    sameModelWarning: false,
    usage: null,
    latency: null,
  });
}

export function outcomesWithOneMalformedAt(ordinal: number, calls: number): SampleCallFunction {
  let made = 0;
  return (_demand: string) => {
    made += 1;
    assert.ok(made <= Math.max(calls, 1), "the strategy made more calls than it declares");
    const verdict: Verdict = made === ordinal ? VERDICT_WHEN_UNKNOWN : "APPROVED";
    return Promise.resolve(outcomeOfTheSuite(verdict, made));
  };
}

/** The call function of this seam, as a strategy receives it. */
export type SampleCallFunction = (demand: string) => Promise<CriticCallOutcome>;

/** Register one strategy as the ONLY strategy of the registry, and judge once. */
async function judgeWith(
  subject: StrategySubject,
  reply: ReplyPlan,
  over: Partial<JudgeDependencies> = {},
): Promise<Awaited<ReturnType<typeof judgePhaseGate>>> {
  resetCriticStrategiesForTest();
  registerCriticStrategy({
    id: subject.id,
    pointId: CRITIC_STRATEGY_ID,
    implementationClass: "first-party",
    strategy: subject.strategy,
  });
  const { deps } = judgeDependenciesOfTheSuite(subject.id, reply, over);
  try {
    return await judgePhaseGate(gateInputOfTheSuite(), deps);
  } finally {
    resetCriticStrategiesForTest();
  }
}

/* -------------------------------------------------------------------- *
 * The accounting the engine keeps around the seam. The seam returns a
 * verdict; the MALFORMED STREAK is a count of the ledger that the first
 * part of the split of 101 owns. The rule is declared here as data, so
 * that the suite can assert row 4 of the table without owning the count
 * (annex X §X.9, T-06; PROGRESS.md of this feature, phase 4, decision 5).
 * -------------------------------------------------------------------- */

/** The count of the ledger that row 4 of the table is about. */
export const MALFORMED_STREAK_COUNTER = "malformedStreak" as const;

/** The streak after one phase gate: up by one on MALFORMED, back to zero otherwise. */
export function malformedStreakAfter(before: number, verdict: Verdict): number {
  return verdict === VERDICT_WHEN_UNKNOWN ? before + 1 : 0;
}

/* ==================================================================== *
 * The fixtures of the planner side: histories built the way the engine
 * builds them, so that a planner receives the read-only history and not
 * a hand-written object.
 * ==================================================================== */

/** The harness of the proposer in the histories of the suite. */
export const HARNESS = "harness-of-the-suite" as const;

/** The model tier the role plan gives the proposer. */
export const BASE_TIER = "base" as const;

/** The two-rung ladder of that harness. */
export const LADDER = Object.freeze([
  Object.freeze({ tier: BASE_TIER, model: "proposer-model", effort: "standard" }),
  Object.freeze({ tier: "next", model: "proposer-model-next", effort: "high" }),
]);

/** What the suite varies in a history. */
export type HistoryOver = {
  readonly diagnosisMade?: boolean;
  readonly accelerationDue?: boolean;
  readonly criticRejections?: number;
  readonly verdicts?: readonly string[];
};

/** A read-only history of a phase, built through `buildPhaseHistory` of the core. */
export function historyOfTheSuite(over: HistoryOver = {}): PhaseHistory {
  const verdicts = over.verdicts ?? [];
  return buildPhaseHistory({
    phase: 1,
    attemptRecords: verdicts.map((_verdict, index) =>
      Object.freeze({
        engineStartOrdinal: 1,
        attemptOrdinal: index + 1,
        kind: "plain",
        outcome: "judged",
        modelTier: BASE_TIER,
      }),
    ),
    verdictRecords: verdicts.map((verdict, index) =>
      Object.freeze({
        engineStartOrdinal: 1,
        attemptOrdinal: index + 1,
        verdict,
        unmetCriteria: Object.freeze(["AC-1"]),
      }),
    ),
    recoveryMarkers: null,
    ledger: Object.freeze([
      Object.freeze({
        seq: 1,
        ns: "core",
        phase: 1,
        counters: Object.freeze({ criticRejections: over.criticRejections ?? 0 }),
      }),
    ]),
    baseModelTier: BASE_TIER,
    hintExists: false,
    feedbackExists: false,
    diagnosisMade: over.diagnosisMade ?? false,
    accelerationDue: over.accelerationDue ?? false,
  });
}

/** The input of the seam of the attempt planner for one history. */
export function plannerInputOfTheSuite(
  history: PhaseHistory,
  over: Partial<AttemptPlannerInput> = {},
): AttemptPlannerInput {
  return Object.freeze({
    history,
    attemptHistory: attemptHistoryOf(history),
    config: Object.freeze({}),
    harness: HARNESS,
    ladder: LADDER,
    baseModelTier: BASE_TIER,
    criticClassCalls: Object.freeze([
      Object.freeze({ role: "critic", model: CRITIC_MODEL, effort: "standard" }),
    ]),
    quotaRecordedByTheRun: Object.freeze([]),
    theTierBumpIsOffForTheRun: false,
    ...over,
  });
}

/** The histories the planner cases run over: every combination of the two facts. */
export const PLANNER_HISTORIES: readonly HistoryOver[] = Object.freeze([
  Object.freeze({}),
  Object.freeze({ diagnosisMade: true, verdicts: Object.freeze(["REJECTED"]) }),
  Object.freeze({ accelerationDue: true, verdicts: Object.freeze(["REJECTED"]) }),
  Object.freeze({
    diagnosisMade: true,
    accelerationDue: true,
    criticRejections: 2,
    verdicts: Object.freeze(["REJECTED", "REJECTED"]),
  }),
]);

/** Plan the next phase attempt with exactly these planners registered, in order. */
export function planWith(
  planners: readonly PlannerSubject[],
  input: AttemptPlannerInput,
): ReturnType<typeof planNextAttempt> {
  resetAttemptPlannersForTest();
  try {
    for (const subject of planners) {
      registerAttemptPlanner({
        id: subject.id,
        pointId: ATTEMPT_PLANNER_ID,
        implementationClass: "first-party",
        planner: subject.planner,
      });
    }
    assert.equal(
      attemptPlannersInOrder().length,
      planners.length,
      "the registry of the seam holds exactly the planners of this case",
    );
    return planNextAttempt(input);
  } finally {
    resetAttemptPlannersForTest();
  }
}

/* ==================================================================== *
 * Rows 1 to 5 — the seam of the critic strategy.
 * ==================================================================== */

/** The five rows of the table about a critic strategy, for one subject. */
export function strategyCases(subject: StrategySubject): readonly ConformanceCase[] {
  const of = (caseId: string): SeamSuiteRow => {
    const row = rowOfTheCase(caseId);
    assert.ok(row !== undefined, `no row of ${CONTRACT_FILE} is covered by ${caseId}`);
    return row;
  };
  return Object.freeze([
    {
      id: of("EP-18/seams/strategy-returns-one-record").caseId,
      title:
        `\`${subject.id}\`: exactly one verdict record per \`judge\`, with a verdict of the ` +
        `closed set and the unmet criteria the strategy named`,
      level: "behaviour",
      proves: ["F149-FR-001", "F149-FR-010"],
      async run() {
        for (const verdict of VERDICTS) {
          const judgment = await judgeWith(subject, alwaysReplies(verdict));
          // One record, always: `judgePhaseGate` returns a single `record`.
          assert.equal(typeof judgment.record, "object");
          assert.notEqual(judgment.record, null);
          assert.equal(judgment.record.verdictId, `attempt:1:1:1:verdict/${subject.id}`);
          assert.ok(
            (VERDICTS as readonly string[]).includes(judgment.record.verdict),
            `the verdict \`${judgment.record.verdict}\` is outside the closed set`,
          );
          assert.ok(Array.isArray(judgment.record.unmetCriteria));
          // No second record and no state of the strategy between gates.
          const again = await judgeWith(subject, alwaysReplies(verdict));
          assert.equal(again.record.verdict, judgment.record.verdict);
          assert.equal(again.calls.length, judgment.calls.length);
          // And the ONE value the strategy itself returns is a verdict of the
          // closed set. The engine reads anything else as MALFORMED, so this
          // asserts the strategy and not the engine's safety net.
          const own = await subject.strategy.judge(
            gateInputOfTheSuite(),
            outcomesOf(verdict, subject.calls),
          );
          assert.ok(
            (VERDICTS as readonly string[]).includes(own.verdict),
            `\`${subject.id}\` returned \`${String(own.verdict)}\`, outside the closed set ` +
              `of row 8 of annex X §X.6`,
          );
          assert.equal(Array.isArray(own.unmetCriteria ?? []), true);
        }
      },
    },
    {
      id: of("EP-18/seams/strategy-with-two-calls").caseId,
      title:
        `\`${subject.id}\`: the strategy makes its ${String(subject.calls)} call(s); each has a ` +
        `nonce of its own and a fresh session, and no session is a session of a pass`,
      level: "behaviour",
      proves: ["F149-FR-001", "F149-FR-010"],
      async run() {
        const judgment = await judgeWith(subject, alwaysReplies("REJECTED"));
        assert.equal(
          judgment.calls.length,
          subject.calls,
          `\`${subject.id}\` declares ${String(subject.calls)} call(s) per phase gate`,
        );
        const nonceHashes = judgment.calls.map((call) => call.nonceHash);
        const sessions = judgment.calls.map((call) => call.sessionId);
        // A nonce of its own per call: the hashes differ, and none is empty.
        assert.equal(new Set(nonceHashes).size, nonceHashes.length, "a nonce was reused");
        for (const hash of nonceHashes) assert.ok(hash.length > 0);
        // A fresh session per call, and none of them a session of a pass.
        assert.equal(new Set(sessions).size, sessions.length, "a session was reused");
        for (const session of sessions) {
          assert.ok(session.length > 0);
          assert.equal(
            SESSIONS_OF_THE_PASSES.includes(session),
            false,
            `the call ran in \`${session}\`, a session of a pass`,
          );
        }
        // The strategy never sees a nonce: what it receives is the outcome of
        // the call, which the guard refuses when it carries one.
        resetCriticStrategiesForTest();
        const seen: unknown[] = [];
        const watched: EngineCriticStrategy = {
          async judge(_input, call) {
            const outcome = await call("what the watched strategy asks");
            seen.push(outcome);
            return { verdict: outcome.verdict };
          },
        };
        registerCriticStrategy({
          id: `${subject.id}-watched`,
          pointId: CRITIC_STRATEGY_ID,
          implementationClass: "first-party",
          strategy: watched,
        });
        const { deps } = judgeDependenciesOfTheSuite(
          `${subject.id}-watched`,
          alwaysReplies("REJECTED"),
        );
        await judgePhaseGate(gateInputOfTheSuite(), deps);
        resetCriticStrategiesForTest();
        assert.equal(seen.length, 1);
        assert.equal(isCriticCallOutcome(seen[0]), true, "the outcome is not of the seam's form");
        assert.equal("nonce" in (seen[0] as object), false);
        assert.equal("nonceHash" in (seen[0] as object), false);
      },
    },
    {
      id: of("EP-18/seams/one-call-malformed-one-approved").caseId,
      title:
        `\`${subject.id}\`: with one call MALFORMED and the rest APPROVED the verdict is not ` +
        `APPROVED`,
      level: "behaviour",
      proves: ["F149-FR-001", "F149-FR-010"],
      async run() {
        for (let ordinal = 1; ordinal <= subject.calls; ordinal += 1) {
          const judgment = await judgeWith(subject, repliesMalformedAt(ordinal, "APPROVED"));
          assert.notEqual(
            judgment.record.verdict,
            "APPROVED",
            `the call ${String(ordinal)} was MALFORMED and the verdict was APPROVED`,
          );
          assert.ok(
            judgment.calls.some((call) => call.verdict === VERDICT_WHEN_UNKNOWN),
            "the suite did not make a call MALFORMED",
          );
          // And the STRATEGY'S OWN answer is not APPROVED either, not only the
          // verdict the engine lets through: the guarantee of `ep18-seams.md`
          // ("never APPROVED when any call was MALFORMED") is the strategy's,
          // and the engine holds it a second time so that none can weaken it.
          const own = await subject.strategy.judge(
            gateInputOfTheSuite(),
            outcomesWithOneMalformedAt(ordinal, subject.calls),
          );
          assert.notEqual(
            own.verdict,
            "APPROVED",
            `\`${subject.id}\` itself returned APPROVED after a MALFORMED call`,
          );
        }
      },
    },
    {
      id: of("EP-18/seams/strategy-throws").caseId,
      title:
        `\`${subject.id}\`: a strategy that throws gives MALFORMED, and the MALFORMED streak ` +
        `rises by one`,
      level: "behaviour",
      proves: ["F149-FR-001", "F149-FR-010"],
      async run() {
        const throwing: EngineCriticStrategy = {
          judge() {
            throw new Error(`\`${subject.id}\` failed inside the suite of ${EP}`);
          },
        };
        const judgment = await judgeWith(
          { id: `${subject.id}-throws`, strategy: throwing, calls: 0 },
          alwaysReplies("APPROVED"),
        );
        assert.equal(judgment.record.verdict, VERDICT_WHEN_UNKNOWN);
        assert.equal(judgment.record.verdict, "MALFORMED");
        assert.equal(FAILURE_PATHS.judge, "MALFORMED, counted by the MALFORMED limit");
        assert.ok(judgment.failure !== undefined, "the failure of the strategy is recorded");
        // The streak the MALFORMED limit counts rises by one on this verdict.
        assert.equal(malformedStreakAfter(0, judgment.record.verdict), 1);
        assert.equal(malformedStreakAfter(2, judgment.record.verdict), 3);
        // And falls back to zero on a verdict that is not MALFORMED.
        const judged = await judgeWith(subject, alwaysReplies("REJECTED"));
        assert.equal(judged.record.verdict, "REJECTED");
        assert.equal(malformedStreakAfter(2, judged.record.verdict), 0);
      },
    },
    {
      id: of("EP-18/seams/strategy-returns-an-unknown-verdict").caseId,
      title: `\`${subject.id}\`: a verdict outside the closed set is MALFORMED`,
      level: "behaviour",
      proves: ["F149-FR-001", "F149-FR-010"],
      async run() {
        for (const unknown of ["approved", "ACCEPTED", "", "bumped", "undefined"]) {
          const strategy: EngineCriticStrategy = {
            async judge(_input, call) {
              await call("what the strategy with an unknown verdict asks");
              return { verdict: unknown };
            },
          };
          const judgment = await judgeWith(
            { id: `${subject.id}-unknown`, strategy, calls: 1 },
            alwaysReplies("APPROVED"),
          );
          assert.equal(
            judgment.record.verdict,
            VERDICT_WHEN_UNKNOWN,
            `\`${unknown}\` was not read as MALFORMED`,
          );
        }
        // And the reply of the critic itself: a verdict outside the set in the
        // reply is MALFORMED too, so no strategy can smuggle one in.
        const judgment = await judgeWith(subject, alwaysReplies("ACCEPTED"));
        assert.equal(judgment.record.verdict, VERDICT_WHEN_UNKNOWN);
      },
    },
  ]);
}

/* ==================================================================== *
 * Rows 6 and 7 — the seam of the attempt planner.
 * ==================================================================== */

/**
 * Row 6, for one planner — a pure function. Three observations:
 *
 *  - the same history gives the same result, twice over;
 *  - nothing of the input changed: the seam freezes it at every depth, so a
 *    write would throw and be recorded as a failure of the planner, and there
 *    is no failure;
 *  - no clock and no random source was reached: both are replaced by throwing
 *    stubs for the call, and the call comes through.
 */
export function assertThePlannerIsPure(planners: readonly PlannerSubject[]): void {
  for (const over of PLANNER_HISTORIES) {
    const history = historyOfTheSuite(over);
    const input = plannerInputOfTheSuite(history);
    const before = JSON.stringify(input);

    const now = Date.now;
    const random = Math.random;
    let first: ReturnType<typeof planNextAttempt>;
    try {
      Date.now = () => {
        throw new Error("a planner reached the clock");
      };
      Math.random = () => {
        throw new Error("a planner reached a random source");
      };
      first = planWith(planners, input);
    } finally {
      Date.now = now;
      Math.random = random;
    }
    const second = planWith(planners, input);

    assert.deepEqual(second.plan, first.plan, "the same history gave two results");
    assert.deepEqual(second.calledInOrder, first.calledInOrder);
    assert.deepEqual(first.failures, [], `a planner failed: ${JSON.stringify(first.failures)}`);
    assert.equal(JSON.stringify(input), before, "the input of the seam was written to");
    assert.equal(JSON.stringify(plannerInputOfTheSuite(history)), before);
    // No count is changed and nothing halts: a planner writes nothing at all.
    assert.deepEqual(input.history.counters, history.counters);
    assert.equal(first.exitCode, null);
    assert.equal(first.stopReason, null);
    assert.equal(
      isNextAttemptPlan(first.plan, first.kindFromTheRecoveryCycle),
      true,
      `the plan ${JSON.stringify(first.plan)} does not satisfy the guard of data-model.md`,
    );
    assert.ok(
      (ATTEMPT_KINDS as readonly string[]).includes(first.plan.kind),
      `the kind \`${first.plan.kind}\` is outside the closed set of row 9`,
    );
  }
}

/**
 * Row 7, for one planner — a planner that throws and a planner that returns an
 * unknown kind both give `plain`. The subject is wrapped twice, so that the
 * assertion is about the SEAM around the subject and not about the subject's
 * own answer.
 */
export function assertAFailingPlannerGivesPlain(subject: PlannerSubject): void {
  const history = historyOfTheSuite({ accelerationDue: true, verdicts: ["REJECTED"] });
  const input = plannerInputOfTheSuite(history);

  const throwing: SeamAttemptPlanner = {
    next(): AttemptKind {
      throw new Error(`\`${subject.id}\` failed inside the suite of ${EP}`);
    },
    plan(): PlannerContribution {
      throw new Error(`\`${subject.id}\` failed inside the suite of ${EP}`);
    },
  };
  const threw = planWith([{ id: subject.id, planner: throwing }], input);
  assert.equal(threw.plan.kind, ATTEMPT_KIND_WHEN_UNKNOWN);
  assert.equal(threw.plan.kind, "plain");
  assert.equal(threw.plan.modelTier, BASE_TIER, FAILURE_PATHS.next);
  assert.equal(threw.failures.length, 1);
  assert.equal(threw.failures[0]?.kindAfterTheFailure, "plain");
  assert.equal(threw.exitCode, null);
  assert.equal(threw.stopReason, null);

  for (const unknown of ["repaired", "", "PLAIN", "escalated"]) {
    const unknownKind: SeamAttemptPlanner = {
      next(): AttemptKind {
        return unknown as AttemptKind;
      },
      plan(): PlannerContribution {
        return { kind: unknown as AttemptKind };
      },
    };
    const planned = planWith([{ id: subject.id, planner: unknownKind }], input);
    assert.equal(
      planned.plan.kind,
      ATTEMPT_KIND_WHEN_UNKNOWN,
      `the unknown kind \`${unknown}\` was not read as \`plain\``,
    );
    assert.deepEqual(planned.failures, []);
  }

  // A planner with `next` alone is called through `next`, which is all the
  // registry requires: both forms of a planner reach the seam.
  const nextOnly: SeamAttemptPlanner = {
    next(history: AttemptHistory): AttemptKind {
      return history.anAcceleratedPhaseAttemptIsDue ? "accelerated" : "plain";
    },
  };
  const throughNext = planWith([{ id: `${subject.id}-next-only`, planner: nextOnly }], input);
  assert.equal(throughNext.plan.kind, "accelerated");
  assert.deepEqual(throughNext.failures, []);
}

/** The two rows of the table about an attempt planner, for one subject. */
export function plannerCases(subject: PlannerSubject): readonly ConformanceCase[] {
  return Object.freeze([
    {
      id: "EP-18/seams/planner-is-pure",
      title:
        `\`${subject.id}\`: the same history gives the same result, and no write, no clock and ` +
        `no random source is observed`,
      level: "behaviour",
      proves: ["F149-FR-002", "F149-FR-010"],
      run() {
        assertThePlannerIsPure([subject]);
      },
    },
    {
      id: "EP-18/seams/planner-throws-or-returns-an-unknown-kind",
      title: `\`${subject.id}\`: a planner that throws and an unknown kind give \`plain\``,
      level: "behaviour",
      proves: ["F149-FR-002", "F149-FR-010"],
      run() {
        assertAFailingPlannerGivesPlain(subject);
      },
    },
  ]);
}

/* ==================================================================== *
 * Rows 8 and 9 — the planners of Wave 1 together, and the samples.
 * ==================================================================== */

/** Row 8 — both planners of Wave 1, in the order of the seam, pass every planner case. */
export function bothPlannersOfWaveOneCase(waveOne: readonly PlannerSubject[]): ConformanceCase {
  return {
    id: "EP-18/seams/both-planners-of-wave-1",
    title:
      "both planners of Wave 1 pass every planner case, on their own and together in the " +
      "order of the seam",
    level: "behaviour",
    proves: ["F149-FR-002", "F149-FR-010"],
    run() {
      assert.equal(waveOne.length, 2, 'Wave 1 has two planners (`ep18-seams.md`, "Wave 1")');
      for (const subject of waveOne) {
        assert.equal(subject.waveOne, true, `\`${subject.id}\` is not marked as of Wave 1`);
        assertThePlannerIsPure([subject]);
        assertAFailingPlannerGivesPlain(subject);
      }
      // And the pair, in the order of the seam, which is how the engine calls
      // them: the planner at place 1 gives the kind, the one at place 2 the
      // model tier.
      assertThePlannerIsPure(waveOne);
      const history = historyOfTheSuite({ accelerationDue: true, verdicts: ["REJECTED"] });
      const planned = planWith(waveOne, plannerInputOfTheSuite(history));
      assert.deepEqual(
        [...planned.calledInOrder],
        waveOne.map((s) => s.id),
      );
      assert.equal(planned.plan.kind, "accelerated");
      assert.equal(planned.plan.modelTier, BASE_TIER);
      assert.deepEqual(planned.failures, []);
    },
  };
}

/** Row 9 — the samples live outside the core, and the core cannot name one. */
export function samplesOutsideTheCoreCase(): ConformanceCase {
  return {
    id: "EP-18/seams/samples-outside-the-core",
    title:
      "no core file names a sample; the build with and without the samples differs in no core " +
      "file; and a core file that names a sample makes the build fail",
    level: "behaviour",
    proves: ["F149-FR-010"],
    run() {
      // 1 — no core file names a sample, by path or by directory.
      assert.deepEqual(
        [...coreFilesNamingASample()],
        [],
        "a file of a core package names a sample of the test kit",
      );

      // 2 — the build with and without the samples differs in no core file.
      const comparison = compareTheBuildWithAndWithoutTheSamples();
      assert.ok(comparison.built.length > 0, "no core package of the graph was built");
      assert.ok(comparison.samplesInTheCopy >= 1, "the copy held no sample to remove");
      assert.deepEqual(
        [...comparison.differing],
        [],
        `the build of ${comparison.differing.join(", ")} differed with the samples removed`,
      );
      for (const name of comparison.built) {
        assert.equal(comparison.withoutSamples[name], comparison.withSamples[name], name);
      }

      // 3 — the build FAILS when a core file names a sample.
      const observed = observeACoreFileNamingASample();
      assert.equal(observed.cleanCode, 0, "the check did not pass on the untouched copy");
      assert.equal(observed.namedCode, 1, "the check passed with a sample named in a core file");
      assert.match(observed.namedOutput, new RegExp(NAMING_RULE));
      assert.ok(
        observed.namedOutput.includes(observed.offendingFile),
        `the failure does not name ${observed.offendingFile}`,
      );
      assert.equal(observed.restoredCode, 0, "the check did not pass again after the naming went");
    },
  };
}

/* ==================================================================== *
 * The whole suite, and its run through the frame.
 * ==================================================================== */

/** What the suite is run on. */
export type SeamSubjects = {
  readonly strategies: readonly StrategySubject[];
  readonly planners: readonly PlannerSubject[];
};

/** Every case of the suite, for a set of subjects, in the order of the table. */
export function seamSuite(subjects: SeamSubjects): readonly ConformanceCase[] {
  const waveOne = subjects.planners.filter((p) => p.waveOne === true);
  return Object.freeze([
    ...subjects.strategies.flatMap((s) => [...strategyCases(s)]),
    ...subjects.planners.flatMap((p) => [...plannerCases(p)]),
    ...(waveOne.length === 2 ? [bothPlannersOfWaveOneCase(waveOne)] : []),
    samplesOutsideTheCoreCase(),
  ]);
}

/** One implementation of a subject, as the registry of the frame takes it. */
export function implementationOf(
  pointId: string,
  id: string,
  operations: Readonly<Record<string, unknown>>,
): Implementation {
  return Object.freeze({
    ep: EP,
    pointId,
    id,
    implementationClass: "first-party",
    majors: [1],
    provenance: "default",
    operations,
  });
}

/** One report of this suite: the subject, the seam and the report of the frame. */
export type SeamSuiteReport = {
  readonly subjectId: string;
  readonly pointId: string;
  readonly report: SuiteReport;
};

/**
 * F100-FR-017, F100-FR-020 — run the suite through the frame. Every subject is
 * registered under its point of EP-18 and run with the cases of its seam; the
 * cases that are about neither subject alone (rows 8 and 9) are run once, with
 * the first strategy as the implementation the report names.
 */
export async function runSeamSuite(subjects: SeamSubjects): Promise<readonly SeamSuiteReport[]> {
  const out: SeamSuiteReport[] = [];
  for (const subject of subjects.strategies) {
    const implementation = implementationOf(CRITIC_STRATEGY_ID, subject.id, {
      judge: subject.strategy.judge,
    });
    out.push({
      subjectId: subject.id,
      pointId: CRITIC_STRATEGY_ID,
      report: await runSuite(CRITIC_STRATEGY_ID, implementation, strategyCases(subject)),
    });
  }
  for (const subject of subjects.planners) {
    const implementation = implementationOf(ATTEMPT_PLANNER_ID, subject.id, {
      next: subject.planner.next,
    });
    out.push({
      subjectId: subject.id,
      pointId: ATTEMPT_PLANNER_ID,
      report: await runSuite(ATTEMPT_PLANNER_ID, implementation, plannerCases(subject)),
    });
  }
  const waveOne = subjects.planners.filter((p) => p.waveOne === true);
  const across: ConformanceCase[] = [
    ...(waveOne.length === 2 ? [bothPlannersOfWaveOneCase(waveOne)] : []),
    samplesOutsideTheCoreCase(),
  ];
  const first = subjects.strategies[0];
  assert.ok(first !== undefined, "the suite needs at least one strategy to report against");
  out.push({
    subjectId: first.id,
    pointId: CRITIC_STRATEGY_ID,
    report: await runSuite(
      CRITIC_STRATEGY_ID,
      implementationOf(CRITIC_STRATEGY_ID, first.id, { judge: first.strategy.judge }),
      across,
    ),
  });
  return Object.freeze(out);
}

/** The registry of EP-18 of the frame, which both seams are registered in. */
export function seamRegistry(): ReturnType<typeof registryOf> {
  return registryOf(EP);
}

export { CRITIC_STRATEGY_ID, ATTEMPT_PLANNER_ID };
