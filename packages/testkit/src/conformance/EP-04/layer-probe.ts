/**
 * The shared probes of the EP-04 behaviour suite of feature 103 (T050 to T056).
 *
 * A probe is a loop layer whose only purpose is to record what the ENGINE did
 * to it: which call points it was asked at, in which order, and with which
 * view. Nothing here asserts anything — the test files do that — and nothing
 * here is a test file, so `node --test` does not pick it up.
 *
 * The probes implement `LoopLayer` of `@specstride/contracts` and know nothing
 * of the core. The core side they are driven through is
 * `packages/core/src/layers/`, which the test files import by relative path:
 * `@specstride/core` names only `.` in its `exports`, and widening the manifest
 * of a package another feature owns is not this feature's to do.
 */
import { CALL_POINTS } from "@specstride/contracts/ep/loop-layer";
import type {
  AfterPassResult,
  BetweenPassesOutcome,
  CallPoint,
  LayerRegistration,
  LoopLayer,
  PhaseAttemptView,
  PromptBlock,
} from "@specstride/contracts/ep/loop-layer";

/** One call the engine made to a probe. */
export type ProbeCall = {
  readonly point: CallPoint;
  readonly view?: PhaseAttemptView;
  readonly checkpoint?: unknown;
  readonly ledger?: readonly unknown[];
};

/** A probe: a layer plus the log of what the engine asked it. */
export type Probe = {
  readonly layer: LoopLayer;
  readonly calls: ProbeCall[];
  /** The call points the engine asked, in the order it asked them. */
  points(): readonly CallPoint[];
};

/** What a probe returns at a call point; absent means `none` in that point's shape. */
export type ProbeAnswers = Partial<Record<CallPoint, unknown>>;

/** The registration of a probe: no directive and no service unless given. */
export function probeRegistration(
  id: string,
  registration: Partial<LayerRegistration> = {},
): LayerRegistration {
  return Object.freeze({
    id,
    directives: Object.freeze([...(registration.directives ?? [])]),
    services: Object.freeze([...(registration.services ?? [])]),
    ledgerNamespace: registration.ledgerNamespace ?? id,
  });
}

/**
 * A probe that records every call and answers `none` at every call point, or
 * the value `answers` gives for that point. A point named in `throwsAt` throws
 * instead, which is the thrown error of F103-FR-027.
 */
export function probe(
  id: string,
  options: {
    readonly answers?: ProbeAnswers;
    readonly throwsAt?: readonly CallPoint[];
    readonly registration?: Partial<LayerRegistration>;
  } = {},
): Probe {
  const calls: ProbeCall[] = [];
  const answers = options.answers ?? {};
  const throwsAt = options.throwsAt ?? [];

  function answer(point: CallPoint, call: ProbeCall): unknown {
    calls.push(call);
    if (throwsAt.includes(point)) {
      throw new Error(`the probe \`${id}\` throws at \`${point}\``);
    }
    return point in answers ? answers[point] : undefined;
  }

  const layer: LoopLayer = {
    registration: probeRegistration(id, options.registration),
    contributePrompt(view: PhaseAttemptView): readonly PromptBlock[] {
      const given = answer("contributePrompt", { point: "contributePrompt", view });
      return (given as readonly PromptBlock[] | undefined) ?? Object.freeze([]);
    },
    afterPass(view: PhaseAttemptView, checkpoint: unknown): AfterPassResult {
      const given = answer("afterPass", { point: "afterPass", view, checkpoint });
      return (given as AfterPassResult | undefined) ?? "none";
    },
    betweenPasses(view: PhaseAttemptView): BetweenPassesOutcome | "none" {
      const given = answer("betweenPasses", { point: "betweenPasses", view });
      return (given as BetweenPassesOutcome | "none" | undefined) ?? "none";
    },
    nextPassBlock(view: PhaseAttemptView): PromptBlock | "none" {
      const given = answer("nextPassBlock", { point: "nextPassBlock", view });
      return (given as PromptBlock | "none" | undefined) ?? "none";
    },
    onEvidence(view: PhaseAttemptView): { readonly closingCheck: boolean } | "none" {
      const given = answer("onEvidence", { point: "onEvidence", view });
      return (given as { readonly closingCheck: boolean } | "none" | undefined) ?? "none";
    },
    contributeCriticInput(
      view: PhaseAttemptView,
    ): readonly Readonly<Record<string, unknown>>[] | "none" {
      const given = answer("contributeCriticInput", { point: "contributeCriticInput", view });
      return (given as readonly Readonly<Record<string, unknown>>[] | "none" | undefined) ?? "none";
    },
    resume(view: PhaseAttemptView, ledger: readonly unknown[]): BetweenPassesOutcome | "none" {
      const given = answer("resume", { point: "resume", view, ledger });
      return (given as BetweenPassesOutcome | "none" | undefined) ?? "none";
    },
    report(): Readonly<Record<string, unknown>> {
      const given = answer("report", { point: "report" });
      return (given as Readonly<Record<string, unknown>> | undefined) ?? Object.freeze({});
    },
  };

  return {
    layer,
    calls,
    points(): readonly CallPoint[] {
      return Object.freeze(calls.map((c) => c.point));
    },
  };
}

/** The eight call points, as the suite walks them. */
export const EVERY_CALL_POINT = CALL_POINTS;

/** The facts a view is built from in these tests: fixed, so the cases are pure. */
export const PHASE_ATTEMPT_FACTS = Object.freeze({
  phase: 3,
  attempt: 1,
  counters: Object.freeze({ errorCount: 0, capCount: 0, noProgressCount: 0 }),
  checkManifest: Object.freeze([Object.freeze({ id: "check-1" })]),
  fingerprints: Object.freeze({ tree: "a".repeat(64) }),
});

/** A harness capability map that DECLARES `concurrentSessions`. */
export const DECLARES_CONCURRENT_SESSIONS = Object.freeze({
  concurrentSessions: Object.freeze({ value: 4, provenance: "probed" as const }),
});

/** A harness capability map that does NOT declare it. */
export const DECLARES_NO_CONCURRENT_SESSIONS = Object.freeze({
  concurrentSessions: Object.freeze({ value: null, provenance: null }),
});
