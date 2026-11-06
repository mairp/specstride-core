/**
 * T038 — the BEHAVIOUR cases of the conformance suite of EP-12,
 * `specstride.quota-classifier/1` (annex A §A.4; F127-FR-001, F127-FR-008).
 *
 * Feature 100 owns the contract-level case of the point (CT-100-209, in
 * `./contract.test.ts`); feature 127 is the CONTENT OWNER of EP-12 and owns
 * the cases below, which is the division annex A §A.4 asks for: "the
 * contract-level cases of feature 100 and the behaviour cases the content
 * owner adds in the same folder".
 *
 * The cases are the standing of the point, not of one implementation. Each
 * runs twice over:
 *
 *  - the IMPLEMENTATION UNDER TEST, through `operationOf` of the frame, so
 *    that a classifier from outside the core — the sample of the test tree
 *    today, another author's tomorrow — is held to the same rules. T082 of
 *    feature 127 adds the sample classifier and the fake-harness descriptor
 *    with a declared limit signal and runs this suite against them;
 *  - the DEFAULT CLASSIFIER of the product (`@specstride/policy`), which is
 *    the content this feature ships for the point, so that the suite tests
 *    what a consumer actually gets.
 *
 * The last case is the one F127-FR-008 asks for by name: a fixture run PAUSES
 * on a declared map, with the reject count unchanged, and takes the error path
 * without the map.
 */
import assert from "node:assert/strict";
import {
  CLASSES,
  CLASS_WHEN_UNKNOWN,
  CONFIDENCES,
  CONFIDENCES_THAT_NEED_A_PROBE,
  CONFIDENCE_WHEN_UNKNOWN,
  IS_PURE,
  NO_ENTRY_MATCHES,
  OPERATIONS,
  A_QUOTA_CLASS_SPENDS,
} from "@specstride/contracts/ep/quota-classifier";
import { FAILURES as TYPED_FAILURES, FAILURE_WHEN_UNKNOWN } from "@specstride/contracts/ep/harness";
import { quota } from "@specstride/policy";
import { operationOf } from "../common.ts";
import type { ConformanceCase } from "../run.ts";

/** The shape of a classification, as the point declares it (§C.13, Outputs). */
type Classification = {
  quotaClass: string;
  confidence: string;
  resetsAt: string | null;
  retryable: boolean;
};

type ClassifyFn = (seen: unknown) => Classification;

/** `retryable` per class, from §Q.1 of the specification of feature 127. */
const RETRYABLE_OF_SECTION_Q1: Readonly<Record<string, boolean>> = Object.freeze({
  quota_window: true,
  quota_credit: false,
  rate_limit_transient: true,
  overload: true,
  auth: false,
  context_window: false,
  agent_failure: true,
  provider_other: true,
  budget_cap: false,
});

/** The three confidences of §Q.2 that pause only after a confirming probe. */
const PAUSE_AFTER_A_PROBE = Object.freeze(["text", "stall", "host"]);

/** The `failures` map of a fake harness that DECLARES a limit signal (§C.2). */
const DECLARED_MAP: Readonly<Record<string, unknown>> = Object.freeze({
  quota_exhausted: { statuses: [429], bodyPatterns: ["usage limit"] },
  authentication_failed: { statuses: [401] },
});

/** The same map WITHOUT the limit entry. */
const NO_LIMIT_DECLARED: Readonly<Record<string, unknown>> = Object.freeze({
  authentication_failed: { statuses: [401] },
});

/**
 * The generic harness adapter of a fake harness, as the suite fakes it: it
 * reads the declared map and answers in the typed failure vocabulary of §C.1.
 * It is handed the MAP and never a harness name (F127-FR-008).
 */
function adapterOf(failures: Readonly<Record<string, unknown>>): quota.HarnessClassifyPort {
  return {
    classify(seen) {
      for (const [failure, signal] of Object.entries(failures)) {
        const statuses = (signal as { statuses?: number[] }).statuses ?? [];
        if (seen.status !== undefined && statuses.includes(seen.status.code)) return { failure };
        const patterns = (signal as { bodyPatterns?: string[] }).bodyPatterns ?? [];
        if (seen.errorText !== undefined && patterns.some((p) => seen.errorText?.includes(p))) {
          return { failure };
        }
      }
      return { failure: FAILURE_WHEN_UNKNOWN };
    },
  };
}

/** The six counts of F127-FR-005 and F127-FR-011, as a fixture run holds them. */
const COUNTS = Object.freeze({
  rejects: 1,
  passes: 4,
  malformedStreak: 0,
  errors: 0,
  wallClockMs: 60_000,
  relaunches: 0,
});

const START_MS = Date.UTC(2026, 0, 1);

/** The behaviour cases of EP-12, owned by feature 127. */
export const cases: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-127-EP12-1",
    title:
      "the point offers `classify` and `observe`, and `classify` answers with a class of the nine, a confidence of the five, a reset time or null, and the `retryable` of §Q.1 (F127-FR-001)",
    level: "behaviour",
    proves: ["F127-FR-001"],
    run(implementation) {
      assert.deepEqual([...OPERATIONS], ["classify", "observe"]);
      assert.equal(CLASSES.length, 9, "the nine classes of §Q.1");
      assert.equal(CONFIDENCES.length, 5, "the five confidence values of §Q.2");

      const implementations: readonly ClassifyFn[] = [
        operationOf(implementation, "classify") as ClassifyFn,
        (seen) => quota.classify(seen as never) as Classification,
      ];
      const inputs: readonly unknown[] = [
        { status: { code: 429, headers: {} } },
        { status: { code: 401, headers: {} } },
        { status: { code: 402, headers: {} } },
        { errorText: "your session limit has been reached" },
        { errorText: "credit balance is too low" },
        { errorText: "prompt is too long" },
        { errorText: "the server is busy" },
        {},
      ];
      for (const classify of implementations) {
        for (const seen of inputs) {
          const result = classify(seen);
          assert.ok(
            CLASSES.includes(result.quotaClass as never),
            `the class ${result.quotaClass} is a member of the closed set of §Q.1`,
          );
          assert.ok(
            CONFIDENCES.includes(result.confidence as never),
            `the confidence ${result.confidence} is a member of the closed set of §Q.2`,
          );
          assert.ok(result.resetsAt === null || typeof result.resetsAt === "string");
          assert.equal(typeof result.retryable, "boolean");
          assert.equal(
            result.retryable,
            RETRYABLE_OF_SECTION_Q1[result.quotaClass],
            `\`retryable\` of ${result.quotaClass} is the one value §Q.1 gives it`,
          );
        }
        // An input that matches no entry: `provider_other` with `text`.
        const nothing = classify({});
        assert.equal(nothing.quotaClass, NO_ENTRY_MATCHES.quotaClass);
        assert.equal(nothing.confidence, NO_ENTRY_MATCHES.confidence);
      }

      // The unknown-value rules, and the purity of the point.
      assert.equal(CLASS_WHEN_UNKNOWN, "provider_other");
      assert.equal(CONFIDENCE_WHEN_UNKNOWN, "text");
      assert.equal(quota.readQuotaClass("a_class_no_set_holds"), "provider_other");
      assert.equal(quota.readConfidence("very-sure"), "text");
      assert.equal(quota.readResetSource("guessed"), "parsed_text");
      assert.equal(IS_PURE, true);
      for (const [what, spends] of Object.entries(A_QUOTA_CLASS_SPENDS)) {
        assert.equal(spends, false, `a quota class spends no ${what}`);
      }
    },
  },
  {
    id: "CT-127-EP12-2",
    title:
      "a classification of weak confidence pauses only after a confirming probe, and a probe is real spend that is never a pass, a phase attempt or a call (F127-FR-001, F127-FR-006)",
    level: "behaviour",
    proves: ["F127-FR-001"],
    async run() {
      assert.deepEqual([...CONFIDENCES_THAT_NEED_A_PROBE], [...PAUSE_AFTER_A_PROBE]);
      for (const confidence of PAUSE_AFTER_A_PROBE) {
        assert.equal(quota.probe.needsAConfirmingProbe(confidence as never), true);
      }
      for (const confidence of ["structured", "status"] as const) {
        assert.equal(quota.probe.pausesAtOnce(confidence), true);
      }

      const request = {
        role: "proposer",
        harness: "the harness of the role",
        model: "the model of the role",
        reason: "confirming-probe" as const,
        usageId: "conformance-probe-1",
      };
      const confirmed = await quota.probe.confirmingProbe(
        {
          probe: () => ({
            ok: false,
            classification: quota.classify({ structuredClass: "quota_window" }),
            costUsd: 0.001,
            billingMode: "api",
          }),
        },
        request,
      );
      assert.equal(confirmed.calls, 1, "one minimal real call");
      assert.equal(confirmed.outcome, "confirmed");
      assert.equal(confirmed.pauses, true);
      assert.equal(confirmed.usageRecord?.isProbe, true, "real spend, written to the ledger");
      assert.equal(confirmed.usageRecord?.closesAPass, false, "never a pass");
      assert.equal(confirmed.usageRecord?.isCall, false, "never a call of the `calls` ceiling");

      const refuted = await quota.probe.confirmingProbe({ probe: () => ({ ok: true }) }, request);
      assert.equal(refuted.outcome, "refuted");
      assert.equal(refuted.pauses, false, "a probe that succeeds refutes the classification");
      assert.equal(refuted.refutedAs, "provider_other");
    },
  },
  {
    id: "CT-127-EP12-3",
    title:
      "the classifier entries of a harness are read through the harness port's `classify`, and no shared code tests a harness name (F127-FR-008)",
    level: "behaviour",
    proves: ["F127-FR-008"],
    run() {
      // Every member of the typed failure vocabulary of §C.1 has a class of §Q.1.
      for (const failure of TYPED_FAILURES) {
        const quotaClass = quota.classOfTypedFailure(failure);
        assert.ok(
          CLASSES.includes(quotaClass as never),
          `the typed failure ${failure} refines into a class of §Q.1`,
        );
      }
      assert.equal(quota.classOfTypedFailure("quota_exhausted"), "quota_window");
      assert.equal(
        quota.classOfTypedFailure("a_failure_no_vocabulary_holds"),
        "agent_failure",
        "§C.1's unknown-value rule",
      );

      // A declared map that names a limit signal, and one that does not.
      assert.equal(quota.declaresALimitSignal(DECLARED_MAP), true);
      assert.equal(quota.declaresALimitSignal(NO_LIMIT_DECLARED), false);
    },
  },
  {
    id: "CT-127-EP12-4",
    title:
      "a fixture run PAUSES on a declared map, with the reject count unchanged, and takes the error path without the map (F127-FR-008)",
    level: "behaviour",
    proves: ["F127-FR-008"],
    run() {
      /** The failure the fixture produces: a 429 with a limit message. */
      const failure = {
        status: { code: 429, headers: {} },
        errorText: "usage limit reached for this window",
        resetsAt: { header: new Date(START_MS + 5 * 60 * 60 * 1000).toISOString() },
      };

      // 1. WITH the declared map: the run pauses.
      const classified = quota.classifyThroughTheHarnessPort(adapterOf(DECLARED_MAP), failure);
      assert.equal(classified.quotaClass, "quota_window");
      assert.equal(quota.actionFor(classified.quotaClass).action, "pause-role");

      const writes: { path: string; content: string }[] = [];
      const files = new Map<string, string>();
      const events: { type: string }[] = [];
      const store = {
        write(path: string, content: string | Uint8Array) {
          const text = typeof content === "string" ? content : new TextDecoder().decode(content);
          writes.push({ path, content: text });
          files.set(path, text);
        },
        read: (path: string) => {
          const held = files.get(path);
          if (held === undefined) throw new Error(`no such file: ${path}`);
          return held;
        },
        exists: (path: string) => files.has(path),
        remove: (path: string) => void files.delete(path),
      };
      const entry = quota.pause.enterPause(
        { fileWriter: store, eventWriter: { emit: (event) => void events.push(event) } },
        {
          runId: "conformance-run",
          attemptId: "p1-a1",
          role: "proposer",
          harness: "the harness of the role",
          classification: classified,
          since: new Date(START_MS).toISOString(),
          resumeAt: new Date(START_MS + 5 * 60 * 60 * 1000 + 60_000).toISOString(),
          ceilingAt: new Date(START_MS + 24 * 60 * 60 * 1000).toISOString(),
          recordPath: "conformance/pause.record",
          counts: COUNTS,
        },
        quota.PAIR_CLOSED,
      );
      assert.equal(entry.state, "paused-quota", "the fixture run entered the pause");
      assert.equal(writes.length, 1, "one pause record was written");
      assert.deepEqual(
        events.map((event) => event.type),
        ["quota.signal", "run.paused"],
      );
      assert.equal(entry.counts?.rejects, COUNTS.rejects, "the reject count is UNCHANGED");
      assert.deepEqual(entry.counts, COUNTS, "and so are the other five");
      assert.equal(entry.passEnded.endCause, "quota_pause");

      // 2. WITHOUT the map: the same failure takes the error path.
      const unclassified = quota.classifyThroughTheHarnessPort(
        adapterOf(NO_LIMIT_DECLARED),
        failure,
      );
      assert.equal(unclassified.quotaClass, "agent_failure");
      const decision = quota.actionFor(unclassified.quotaClass);
      assert.equal(decision.action, "error-path", "the error path (F127-FR-008)");
      assert.equal(decision.countsAsAConsecutiveError, true);
      assert.equal(quota.AS_IS_ERROR_PATH.stopReason, "proposer_consecutive_errors");
      assert.equal(quota.AS_IS_ERROR_PATH.exitCode, 4);
    },
  },
]);
