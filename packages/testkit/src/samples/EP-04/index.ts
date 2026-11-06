/**
 * T126 — the sample implementation of EP-04, the loop-layer interface,
 * outside the core, registered from the test tree (annex A, §A.4,
 * F100-FR-018; annex X, §X.10, F100-FR-222).
 *
 * The sample layer `noop` of §D.1, "Proving test": it declares no unit of
 * work, so it executes nothing and adds nothing to a prompt but its protocol
 * block, and returns `none` at every call point that offers it. It also
 * carries a sample tree-store service, so that the contract tests of §D.2
 * have a service with exactly the seven operations.
 */
import { RETURN_WHEN_UNKNOWN } from "@specstride/contracts/ep/loop-layer";
import type {
  AfterPassResult,
  BetweenPassesOutcome,
  LayerRegistration,
  PhaseAttemptView,
  PromptBlock,
} from "@specstride/contracts/ep/loop-layer";
import { firstOverlap, COMPOSE_REFUSAL_REASON } from "@specstride/contracts/ep/tree-store";
import type {
  AuditedDelta,
  ChangedPath,
  ComposeResult,
  TreeId,
  TreeStoreService,
  WorkerTree,
} from "@specstride/contracts/ep/tree-store";
import type { Implementation } from "../../conformance/frame.ts";

/** The protocol block, the one thing the layer adds with no unit declared. */
export const PROTOCOL_BLOCK: PromptBlock = Object.freeze({
  id: "sample-noop.protocol",
  bytes: 24,
  hash: "3".repeat(64),
  writer: "sample-noop",
  protected: false,
  stability: "stable",
  text: "the sample layer is inert",
});

export const registration: LayerRegistration = Object.freeze({
  id: "sample-noop",
  directives: Object.freeze([]),
  services: Object.freeze([]),
  ledgerNamespace: "sample-noop",
});

/**
 * A tree store that keeps its trees in memory: exactly the seven operations
 * of §D.2 and no other, and only `apply` returns paths of the workspace.
 */
export function sampleTreeStore(): TreeStoreService {
  const trees = new Map<TreeId, readonly string[]>();
  let next = 0;
  const store: TreeStoreService = {
    snapshot(directory: string): Promise<TreeId> {
      const id = `tree-${++next}`;
      trees.set(id, Object.freeze([`${directory}/a.txt`]));
      return Promise.resolve(id);
    },
    materialize(treeId: TreeId, workerId: string): Promise<WorkerTree> {
      return Promise.resolve(Object.freeze({ workerId, path: `worker-root/${workerId}`, treeId }));
    },
    changed(baseTreeId: TreeId, treeId: TreeId): Promise<readonly ChangedPath[]> {
      const base = trees.get(baseTreeId) ?? [];
      const now = trees.get(treeId) ?? [];
      return Promise.resolve(
        Object.freeze(
          now
            .filter((p) => !base.includes(p))
            .map((p) => Object.freeze({ path: p, kind: "added" as const })),
        ),
      );
    },
    compose(baseTreeId: TreeId, deltas: readonly AuditedDelta[]): Promise<ComposeResult> {
      const overlap = firstOverlap(deltas);
      if (overlap !== undefined) {
        return Promise.resolve(
          Object.freeze({
            composed: false as const,
            reason: COMPOSE_REFUSAL_REASON,
            paths: overlap.paths,
            workerId: overlap.workerId,
          }),
        );
      }
      const id = `tree-${++next}`;
      trees.set(
        id,
        Object.freeze([...(trees.get(baseTreeId) ?? []), ...deltas.flatMap((d) => d.paths)]),
      );
      return Promise.resolve(Object.freeze({ composed: true as const, treeId: id }));
    },
    apply(_base: TreeId, composed: TreeId, _workspace: string): Promise<readonly string[]> {
      return Promise.resolve(trees.get(composed) ?? Object.freeze([]));
    },
    release(_tree: WorkerTree): Promise<void> {
      return Promise.resolve();
    },
    sweep(): Promise<readonly TreeId[]> {
      const removed = Object.freeze([...trees.keys()]);
      trees.clear();
      return Promise.resolve(removed);
    },
  };
  return store;
}

export const operations = Object.freeze({
  contributePrompt(_view: PhaseAttemptView): readonly PromptBlock[] {
    return Object.freeze([PROTOCOL_BLOCK]);
  },
  afterPass(): AfterPassResult {
    return RETURN_WHEN_UNKNOWN;
  },
  betweenPasses(): BetweenPassesOutcome | "none" {
    return "none";
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
    return Object.freeze({ layer: "sample-noop", engaged: false, units: 0 });
  },
});

export const implementation: Implementation = Object.freeze({
  ep: "EP-04",
  pointId: "specstride.loop-layer/1",
  id: "sample-loop-layer-noop",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});

/* ------------------------------------------------------------------ *
 * T058 of feature 103 — the two SAMPLE LAYERS of §D.1, "Proving test".
 *
 * `noop` returns `none` at every call point and declares no directive;
 * `stacked` stacks above it, declares `requestPassGroup` and `integrateGroup`,
 * requests a group of two stub passes and integrates them. Both live in this
 * directory, outside the core, and are registered as first-party code by the
 * conformance suite of EP-04 only — never by a file of `@specstride/core`.
 *
 * They are re-exported here so that a suite has one module to import, while the
 * implementation object above, which the frame of the test kit registers, stays
 * exactly what T126 of feature 100 made it.
 * ------------------------------------------------------------------ */
export {
  NOOP_DECLARES_A_UNIT_OF_WORK,
  NOOP_LAYER_ID,
  NOOP_REPORT,
  noopLayer,
  noopRegistration,
} from "./noop.ts";
export {
  STACKED_CONCURRENCY,
  STACKED_DIRECTIVES,
  STACKED_LAYER_ID,
  STACKED_WORKERS,
  stackedDirectiveCalls,
  stackedLayer,
  stackedRegistration,
  stubIntegration,
  stubPass,
  stubPassGroup,
  stubPromptBlock,
} from "./stacked.ts";
