/**
 * T058 of feature 103 — THE SAMPLE LAYER `stacked`, outside the core
 * (F103-FR-024, F103-FR-025, F103-FR-026; annex D §D.1, "Proving test" (iii)).
 *
 * The second sample layer. It stacks ABOVE `noop` of `./noop.ts` — it is the
 * OUTER layer, so at every call point it is asked first and `noop` is asked only
 * where this one returns `none`. It declares exactly two directives,
 * `requestPassGroup` and `integrateGroup`, and at `betweenPasses` it issues
 * both: a group of TWO stub passes, and the integration of their results.
 *
 * It exists to prove three things that nothing else can:
 *
 *  1. two layers stack, outer first, to the depth the annex allows;
 *  2. a layer that declares the two directives of a group has them executed and
 *     accounted for by the ENGINE, and refused where the harness adapter
 *     declares no `concurrentSessions` (F103-FR-025);
 *  3. the whole oracle still passes with this sample UNREGISTERED — which is the
 *     sentence of the annex that makes the layer an addition and not a change.
 *
 * The two passes are STUBS: their prompt block is a fixed string of this file
 * and their working directory is a parameter, so running them starts no model
 * and writes nothing. The group's concurrency is 2, which is also the smallest
 * `concurrentSessions` a harness adapter must declare for a group to run.
 *
 * ## It lives in the test tree, and is registered from there only
 *
 * F100-FR-018 — first-party code of the test kit, registered by the conformance
 * suite. It imports nothing of `@specstride/core`; the interface it implements
 * is `@specstride/contracts`.
 */
import type {
  AfterPassResult,
  BetweenPassesOutcome,
  Directive,
  DirectiveCall,
  IntegrateGroupRequest,
  LayerRegistration,
  LoopLayer,
  PassGroupRequest,
  PassRequest,
  PromptBlock,
} from "@specstride/contracts/ep/loop-layer";

/** The id of the sample layer, which is also its ledger namespace. */
export const STACKED_LAYER_ID = "stacked" as const;

/** The two workers of the group, in the order of the tasks at launch. */
export const STACKED_WORKERS = ["worker-1", "worker-2"] as const;

/** F103-FR-025 — the two directives this layer declares, and nothing else. */
export const STACKED_DIRECTIVES: readonly Directive[] = Object.freeze([
  "requestPassGroup",
  "integrateGroup",
]);

/** The concurrency the group asks for: two passes at once. */
export const STACKED_CONCURRENCY = 2 as const;

export const stackedRegistration: LayerRegistration = Object.freeze({
  id: STACKED_LAYER_ID,
  directives: STACKED_DIRECTIVES,
  services: Object.freeze([]),
  ledgerNamespace: STACKED_LAYER_ID,
});

/** The prompt block of one stub pass: fixed text, so the pass starts no model. */
export function stubPromptBlock(workerId: string): PromptBlock {
  const text = `<data name="stacked-stub">stub pass of ${workerId}</data>`;
  return Object.freeze({
    id: `${STACKED_LAYER_ID}.stub.${workerId}`,
    bytes: text.length,
    hash: "4".repeat(64),
    writer: STACKED_LAYER_ID,
    protected: false,
    stability: "stable" as const,
    text,
  });
}

/** One stub pass of the group. */
export function stubPass(workerId: string, workingDirectory: string): PassRequest {
  return Object.freeze({
    promptBlock: stubPromptBlock(workerId),
    workingDirectory,
    session: "fresh" as const,
    timeLimitMs: 1_000,
    workerId,
  });
}

/** F103-FR-026 — the group of TWO stub passes, with its concurrency limit. */
export function stubPassGroup(workingDirectory = "."): PassGroupRequest {
  return Object.freeze({
    passes: Object.freeze(STACKED_WORKERS.map((worker) => stubPass(worker, workingDirectory))),
    concurrency: STACKED_CONCURRENCY,
  });
}

/** F103-FR-026 — the integration of the group: both workers accepted. */
export function stubIntegration(): IntegrateGroupRequest {
  return Object.freeze({
    perWorker: Object.freeze(
      STACKED_WORKERS.map((workerId) => Object.freeze({ workerId, outcome: "accepted" as const })),
    ),
  });
}

/** The two directive calls this layer issues at `betweenPasses`, in order. */
export function stackedDirectiveCalls(workingDirectory = "."): readonly DirectiveCall[] {
  return Object.freeze([
    Object.freeze({
      directive: "requestPassGroup" as const,
      request: stubPassGroup(workingDirectory),
    }),
    Object.freeze({ directive: "integrateGroup" as const, request: stubIntegration() }),
  ]);
}

/**
 * The sample layer. Every call point but `betweenPasses` and `report` returns
 * `none`, so `noop` beneath it is reached at six of the eight; `betweenPasses`
 * returns the outcome that carries the two directives of a group.
 */
export const stackedLayer: LoopLayer = Object.freeze({
  registration: stackedRegistration,
  contributePrompt(): readonly PromptBlock[] {
    return Object.freeze([]);
  },
  afterPass(): AfterPassResult {
    return "none";
  },
  betweenPasses(): BetweenPassesOutcome | "none" {
    return Object.freeze({ directives: stackedDirectiveCalls() });
  },
  nextPassBlock(): PromptBlock | "none" {
    return "none";
  },
  onEvidence(): { readonly closingCheck: boolean } | "none" {
    return "none";
  },
  contributeCriticInput(): readonly Readonly<Record<string, unknown>>[] | "none" {
    return "none";
  },
  resume(): BetweenPassesOutcome | "none" {
    return "none";
  },
  report(): Readonly<Record<string, unknown>> {
    return Object.freeze({
      layer: STACKED_LAYER_ID,
      engaged: true,
      groups: 1,
      workers: STACKED_WORKERS.length,
    });
  },
});
