// T136 (feature 154, US6; F154-FR-056..-059) — the phase trees and the
// validation queue of a run, extracted from `run-feature.ts` so the change
// stays small and reviewable, on the pattern of `parallel-group.ts`.
//
// THE SHAPE OF US6. With `loop.phases.parallel` ON, the phases whose declared
// write scopes are PAIRWISE DISJOINT and that declare no dependency on each
// other are worked AT ONCE, each in a worker tree materialized from a
// snapshot of the workspace (`materialize`, `@specstride/tree-store`); they
// are validated ONE AT A TIME in phase order through the validation queue
// (`loop.phase-queue`, the pure table of `packages/core`, PQ-1..PQ-3). The
// tree paths are OPAQUE (the store names them, no phase number, no feature
// slug in the path), and they live OUTSIDE the workspace and the control
// plane, under the worker root of the run.
//
// WITH THE SWITCH OFF the coordinator is `null`: no tree, no queue entry,
// nothing written — default-off stays inert (F154-FR-001, -002).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";
import { initStore, treeStore, type StorePlaces } from "../../../tree-store/src/index.ts";
import {
  admit as queueAdmits,
  effectiveDependenciesOf,
} from "../../../core/src/phase-queue/validation-queue.ts";
import { approvalRecordPath } from "../../../core/src/approval/record.ts";
import type { QueueEntry, ValidationQueuePort } from "./parallel-wiring.ts";

/** The schema of one persisted queue entry. */
export const PHASE_QUEUE_ENTRY_SCHEMA = "specstride.phase-queue/1" as const;

/** One phase's declaration, as the launch contract's coverage carries it (T132). */
export type PhaseDeclaration = {
  readonly phase: number;
  /** The DECLARED dependencies; the EMPTY list when the source declared none. */
  readonly dependsOn: readonly number[];
  /** The declared write scope, as path prefixes; absent when none was declared. */
  readonly writeScope?: readonly string[];
};

/** One persisted queue entry: the phase, its tree, and where validation stands. */
export type PhaseQueueEntry = {
  readonly schema: typeof PHASE_QUEUE_ENTRY_SCHEMA;
  readonly feature: string;
  readonly runId: string;
  readonly phase: number;
  readonly dependsOn: readonly number[];
  readonly writeScope: readonly string[];
  /** The id of the snapshot the tree materialized from. */
  readonly treeId: string;
  /** The OPAQUE path of the worker tree, under the run's worker root. */
  readonly treePath: string;
  /** The attempt of the phase's validation (one gate run per attempt, T137). */
  readonly attempt: number;
  /** The attempt whose gate the engine already ran (the once-per-attempt guard). */
  readonly gatedAttempt?: number;
  readonly status: "waiting" | "working" | "approved" | "rejected";
};

/** True when no prefix of `a` contains any prefix of `b` and the reverse (F142-FR-009). */
export function scopesAreDisjoint(a: readonly string[], b: readonly string[]): boolean {
  const contains = (scope: readonly string[], prefix: string): boolean =>
    scope.some((one) => one === prefix || one.startsWith(prefix) || prefix.startsWith(one));
  return !a.some((one) => contains(b, one)) && !b.some((one) => contains(a, one));
}

/**
 * THE CANDIDATES of parallel work (F154-FR-057): the phases that declared a
 * write scope, whose scopes are pairwise disjoint from every other
 * candidate's, and between which no DECLARED dependency runs in either
 * direction. Phases that declared no scope stay on the workspace; a declared
 * dependency between two candidates keeps BOTH out (the queue would hold one
 * behind the other, so no tree is worth materializing).
 */
export function candidatePhasesOf(declarations: readonly PhaseDeclaration[]): readonly number[] {
  const scoped = declarations.filter((one) => (one.writeScope ?? []).length > 0);
  const declared = (phase: number, on: number): boolean =>
    (declarations.find((one) => one.phase === phase)?.dependsOn ?? []).includes(on);
  // A phase that DECLARES a dependency on another scoped phase is out — it
  // cannot be worked at once with the phase it waits for; the phase DECLARED
  // ON stays in, since the queue will hold its dependent anyway.
  return scoped
    .filter((one) =>
      scoped.every(
        (other) =>
          other.phase === one.phase ||
          (scopesAreDisjoint(one.writeScope ?? [], other.writeScope ?? []) &&
            !declared(one.phase, other.phase)),
      ),
    )
    .map((one) => one.phase)
    .sort((a, b) => a - b);
}

/** The directory of the persisted queue, under the control root of the run. */
export function phaseQueueDirectoryOf(controlRoot: string): string {
  return join(controlRoot, "phase-queue");
}

/** The file of one phase's queue entry. */
export function queueEntryPathOf(controlRoot: string, phase: number): string {
  return join(phaseQueueDirectoryOf(controlRoot), `phase${String(phase)}.json`);
}

/** Read one phase's persisted entry; none persisted, or an unreadable file, gives `undefined`. */
export function readQueueEntry(controlRoot: string, phase: number): PhaseQueueEntry | undefined {
  const path = queueEntryPathOf(controlRoot, phase);
  if (!existsSync(path)) return undefined;
  try {
    const read = JSON.parse(readFileSync(path, "utf8")) as PhaseQueueEntry;
    return read.schema === PHASE_QUEUE_ENTRY_SCHEMA ? read : undefined;
  } catch {
    return undefined;
  }
}

/** Write one phase's persisted entry, creating the queue directory as needed. */
function writeQueueEntry(controlRoot: string, entry: PhaseQueueEntry): void {
  mkdirSync(phaseQueueDirectoryOf(controlRoot), { recursive: true, mode: 0o700 });
  writeFileSync(queueEntryPathOf(controlRoot, entry.phase), `${JSON.stringify(entry, null, 2)}\n`);
}

/** The places of the phase-tree store, on the pattern of `placesOfTheParallelStore`. */
export function placesOfThePhaseTreeStore(input: {
  readonly controlRoot: string;
  readonly runId: string;
  readonly home?: string;
}): StorePlaces {
  return {
    store: join(input.controlRoot, "phase-tree-store"),
    workerRoot: join(input.home ?? homedir(), ".specstride", "worker-roots", input.runId),
    control: input.controlRoot,
  };
}

/** What the coordinator is built from — everything the composition root holds already. */
export type PhaseTreeCoordinatorInput = {
  readonly on: boolean;
  readonly declarations: readonly PhaseDeclaration[];
  readonly feature: string;
  readonly runId: string;
  readonly controlRoot: string;
  readonly workspace: string;
  readonly taskListPath: string;
};

/** The coordinator, with what a caller may observe of it. */
export type PhaseTreeCoordinator = {
  readonly on: boolean;
  readonly candidates: readonly number[];
  readonly entryOf: (phase: number) => PhaseQueueEntry | undefined;
  /**
   * Materialize a tree for every READY candidate that has none yet — the
   * candidate phases whose dependencies are approved — AT ONCE (one
   * `Promise.all`, F154-FR-057). Called at the first attempt of a candidate
   * phase; a resume with every tree already on disk does nothing.
   */
  readonly materializeReadyCandidatesOf: (phase: number) => Promise<void>;
  /** T137 — the gate is about to run for this attempt; the second run of the SAME attempt is refused. */
  readonly markGated: (phase: number, attempt: number) => void;
  /** Whether the gate already ran for this exact attempt (the once-per-attempt guard). */
  readonly gateRanFor: (phase: number, attempt: number) => boolean;
  /** The validation of the phase approved: the workspace advanced past it. */
  readonly approved: (phase: number) => void;
  /**
   * The validation of the phase rejected: the phase KEEPS the head for
   * repair (T138), its attempt advances, and its dependents stay held.
   */
  readonly rejected: (phase: number) => void;
  /** The ordered validation queue port the parallel wiring reads (F154-FR-058, -059). */
  readonly validationQueue: ValidationQueuePort;
};

/** The declared dependencies of a phase, effective (PQ-3), from the declarations. */
function effectiveOf(declarations: readonly PhaseDeclaration[], phase: number): readonly number[] {
  const declared = declarations.find((one) => one.phase === phase)?.dependsOn ?? [];
  return effectiveDependenciesOf({ phase, dependsOn: declared });
}

/**
 * The approved phases, read from the run's records: a CANDIDATE phase's
 * approval stands in its persisted queue entry; a NON-CANDIDATE phase (one
 * that declared no scope, like the fixture's phase 1) was never given an
 * entry, and its approval stands in the approval record the engine wrote —
 * both are the one state a resume reads.
 */
function approvedPhasesOf(
  declarations: readonly PhaseDeclaration[],
  controlRoot: string,
  feature: string,
): Set<number> {
  const approved = new Set<number>();
  for (const one of declarations) {
    const entry = readQueueEntry(controlRoot, one.phase);
    if (entry?.status === "approved") {
      approved.add(one.phase);
      continue;
    }
    const record = join(controlRoot, approvalRecordPath(feature, one.phase));
    if (existsSync(record)) approved.add(one.phase);
  }
  return approved;
}

/**
 * THE COORDINATOR. With `on` false, or with NO candidate phase, it answers
 * `null` and the run is exactly what it was before US6.
 */
export function coordinatorOf(input: PhaseTreeCoordinatorInput): PhaseTreeCoordinator | null {
  if (!input.on) return null;
  const candidates = candidatePhasesOf(input.declarations);
  if (candidates.length === 0) return null;

  const places = placesOfThePhaseTreeStore({
    controlRoot: input.controlRoot,
    runId: input.runId,
  });
  // The store directory is laid down once per run (a resume finds it there).
  initStore(places);
  const store = treeStore(places, {
    runId: input.runId,
    groupId: "phase-trees",
    seedSource: input.workspace,
    taskListPath: input.taskListPath,
  });

  const entryOf = (phase: number): PhaseQueueEntry | undefined =>
    readQueueEntry(input.controlRoot, phase);

  const upsertOf = (
    phase: number,
    patch: Partial<PhaseQueueEntry>,
  ): PhaseQueueEntry | undefined => {
    const current = entryOf(phase);
    if (current === undefined) return undefined;
    const next: PhaseQueueEntry = { ...current, ...patch };
    writeQueueEntry(input.controlRoot, next);
    return next;
  };

  const materializeReadyCandidatesOf = async (phase: number): Promise<void> => {
    if (!candidates.includes(phase)) return;
    const approved = approvedPhasesOf(input.declarations, input.controlRoot, input.feature);
    const ready = candidates.filter((one) =>
      effectiveOf(input.declarations, one).every((dependency) => approved.has(dependency)),
    );
    const todo = ready.filter((one) => entryOf(one) === undefined);
    if (todo.length === 0) return;
    // ONE snapshot of the workspace as it stands, then ALL the trees of the
    // ready candidates AT ONCE, each from the same base (F154-FR-057).
    const baseTreeId = await store.snapshot(input.workspace);
    const made = await Promise.all(
      todo.map((one) =>
        // THE OPAQUE PATH (F154-FR-069): the worker directory of the tree
        // names NOTHING of the phase — no number, no slug — only the hash of
        // the run and the phase, so no prompt, no event, no record can leak
        // which tree belongs to which phase by its path.
        store
          .materialize(
            baseTreeId,
            createHash("sha256")
              .update(`${input.runId}:${String(one)}`)
              .digest("hex")
              .slice(0, 16),
          )
          .then((tree) => {
            writeQueueEntry(input.controlRoot, {
              schema: PHASE_QUEUE_ENTRY_SCHEMA,
              feature: input.feature,
              runId: input.runId,
              phase: one,
              dependsOn: [...effectiveOf(input.declarations, one)],
              writeScope: [...(input.declarations.find((d) => d.phase === one)?.writeScope ?? [])],
              treeId: baseTreeId,
              treePath: tree.path,
              attempt: 1,
              status: "waiting",
            });
            return tree;
          }),
      ),
    );
    return made.length === 0 ? undefined : undefined;
  };

  const markGated = (phase: number, attempt: number): void => {
    upsertOf(phase, { gatedAttempt: attempt, status: "working" });
  };
  const gateRanFor = (phase: number, attempt: number): boolean =>
    entryOf(phase)?.gatedAttempt === attempt;
  const approved = (phase: number): void => {
    upsertOf(phase, { status: "approved" });
  };
  const rejected = (phase: number): void => {
    const current = entryOf(phase);
    if (current === undefined) return;
    upsertOf(phase, { status: "rejected", attempt: current.attempt + 1, gatedAttempt: undefined });
  };

  const observationOf = () => {
    const approved = approvedPhasesOf(input.declarations, input.controlRoot, input.feature);
    const rejected = new Set<number>();
    for (const one of input.declarations) {
      if (entryOf(one.phase)?.status === "rejected") rejected.add(one.phase);
    }
    return { approved, rejected };
  };

  const validationQueue: ValidationQueuePort = {
    admit: (entry: QueueEntry) => {
      const verdict = queueAdmits(
        { phase: entry.phase, dependsOn: entryOf(entry.phase)?.dependsOn },
        observationOf(),
      );
      if (verdict.choice === "head") upsertOf(entry.phase, { status: "working" });
    },
    head: () => {
      for (const phase of candidates) {
        if (
          queueAdmits({ phase, dependsOn: entryOf(phase)?.dependsOn }, observationOf()).choice ===
          "head"
        ) {
          // THE PERSISTED ENTRY is the head; a phase the run has not yet
          // materialized an entry for composes one on the spot.
          return (
            entryOf(phase) ?? {
              schema: PHASE_QUEUE_ENTRY_SCHEMA,
              feature: input.feature,
              runId: input.runId,
              phase,
              dependsOn: [...effectiveOf(input.declarations, phase)],
              writeScope: [
                ...(input.declarations.find((d) => d.phase === phase)?.writeScope ?? []),
              ],
              treeId: "",
              treePath: "",
              attempt: 1,
              status: "waiting",
            }
          );
        }
      }
      return undefined;
    },
    pop: () => validationQueue.head(),
  };

  return {
    on: true,
    candidates,
    entryOf,
    materializeReadyCandidatesOf,
    markGated,
    gateRanFor,
    approved,
    rejected,
    validationQueue,
  };
}
