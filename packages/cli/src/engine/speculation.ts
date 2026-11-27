/**
 * T145, T147 — THE SPECULATIVE UNIT OF A RUN (feature 154, US7; F154-FR-061
 * to -067). The composition root's HALF of US7: at the gate of phase n the
 * pure table `SPECULATION_TABLE` (SP-1…SP-6, `speculation-rule.ts`) decides
 * whether phase n+1 is worked ahead in a tree of its own, branched from the
 * FROZEN SNAPSHOT of phase n's evidence; on an approval the tree integrates
 * into the workspace like a group (SP-5, F154-FR-063), on a rejection it is
 * set aside at NO counter, with the `specstride.set-aside/1` record of its
 * cost (SP-6, F154-FR-064, -065).
 *
 * Every rule lives in core (F154-FR-003); this module only wires: it reads
 * the ledger counts from the run's events file, takes the snapshot, hands
 * the observation to the table, emits ONE `loop.speculation.admission` event
 * with the decision and its reason (`rate`, `depth`, `sweep`; F154-FR-066,
 * -067), and acts on the choice. With `loop.speculate` OFF nothing here
 * exists: no event, no tree, no record (F154-FR-001).
 *
 * Isolation (T149): the prompt of a speculative unit carries NO word of the
 * open verdict (F154-FR-080) — `speculativePromptAppendix` is the only text
 * this module contributes, and `promptCarriesNoVerdictWord` checks it. The
 * tree stands through the critic-class call of phase n only where the
 * amended F142-FR-070 allows it (the critic has no tools, IX, or the read
 * denial of the worker root is confirmed; `sweepConfirmsNoReadableTree` of
 * `before-critic.ts`); elsewhere the table answers `sweep` and no unit
 * starts. A stop ends the speculative worker as it ends a group worker
 * (F154-FR-074): `stopNow` releases the tree through the store.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

import { initStore, treeStore } from "../../../tree-store/src/index.ts";
import type { WorkerTree } from "@specstride/contracts/ep/tree-store";
import { placesOfThePhaseTreeStore } from "./phase-trees.ts";
import {
  approvalRateOverWindowOf,
  refusalReasonOf,
  speculationVerdictOf,
  SPECULATION_POINT,
} from "../../../core/src/speculation/speculation-rule.ts";
import { setAsideRecordOf, SET_ASIDE_SCHEMA } from "../../../core/src/speculation/set-aside.ts";
import { sweepConfirmsNoReadableTree } from "../../../core/src/parallel/before-critic.ts";
import type { IntegrationPorts, TickOutcome } from "../../../core/src/parallel/integrate.ts";

/** The closed-set member of the admission events of a speculative unit (CQ-154-09 A). */
export const SPECULATION_ADMISSION_EVENT = "loop.speculation.admission" as const;
/** The event of a speculative unit integrated like a group (SP-5, F154-FR-063). */
export const SPECULATION_INTEGRATED_EVENT = "loop.speculation.integrated" as const;
/** The event of a speculative unit set aside (SP-6, F154-FR-064). */
export const SPECULATION_SET_ASIDE_EVENT = "loop.speculation.set-aside" as const;

/** The admission event's data, as the report's rows read it. */
export type SpeculationAdmissionData = {
  readonly decision: "start" | "skip";
  /** Present where the decision is `skip`: the closed set { rate, depth, sweep }. */
  readonly reason?: "rate" | "depth" | "sweep";
  readonly ruleId: string;
  /** The phase whose gate asked (n); the unit worked ahead is `unitPhase` (n+1). */
  readonly phase: number;
  readonly unitPhase: number;
  readonly ratePerCent: number;
  readonly window: number;
  readonly minRatePerCent: number;
  readonly depth: number;
  readonly maxDepth: number;
};

/** The counts the approval rate reads, from the run's own events (F154-FR-066). */
export type LedgerCounts = {
  readonly attemptsStarted: number;
  readonly approvals: number;
};

/**
 * The last `window` closed attempts of the run's events file: the attempts
 * started are the `attempt.ended` closers (each names a started attempt),
 * the approvals are those whose end cause is `approved`. The events file is
 * the same surface `specstride report` reads — one source, no second
 * ledger. A missing or unreadable file reads as ZERO attempts, which the
 * table refuses (`rate`), never an error that stops a run (F154-FR-004).
 */
export function ledgerCountsOf(eventsPath: string, window: number): LedgerCounts {
  if (!existsSync(eventsPath)) return { attemptsStarted: 0, approvals: 0 };
  let text = "";
  try {
    text = readFileSync(eventsPath, "utf8");
  } catch {
    return { attemptsStarted: 0, approvals: 0 };
  }
  const closers: string[] = [];
  for (const line of text.split("\n")) {
    if (!line.includes('"attempt.ended"')) continue;
    try {
      closers.push(String(JSON.parse(line).data?.endCause ?? ""));
    } catch {
      // A torn final line is skipped, never fatal (F154-FR-004).
    }
  }
  const last = window > 0 ? closers.slice(-window) : [];
  return {
    attemptsStarted: last.length,
    approvals: last.filter((cause) => cause === "approved").length,
  };
}

/**
 * F154-FR-080 — the ONLY text this module contributes to a speculative
 * unit's prompt: it names no verdict, no gate, no critic and no word of the
 * open decision. `promptCarriesNoVerdictWord` checks every prompt of the
 * unit against the same word list, so the two cannot drift.
 */
export function speculativePromptAppendix(): string {
  return (
    "Work this phase in this tree from its own task list. " +
    "Write your evidence inside this tree as the task list says."
  );
}

/** The words of an open verdict no speculative prompt may carry (F154-FR-080). */
export const VERDICT_WORDS: readonly string[] = Object.freeze([
  "verdict",
  "approved",
  "approval",
  "rejected",
  "rejection",
  "malformed",
  "gate",
  "critic",
  "open verdict",
]);

/** True where the prompt carries NONE of the verdict words (F154-FR-080). */
export function promptCarriesNoVerdictWord(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return !VERDICT_WORDS.some((word) => lower.includes(word));
}

/** What one speculative unit costs (F154-FR-064). */
export type SpeculationCost = {
  readonly tokens: number;
  readonly wallTimeMs: number;
  readonly cycles: number;
};

/** The path of the set-aside record of one unit, under the control plane. */
export function setAsidePathOf(
  controlRoot: string,
  feature: string,
  runId: string,
  unitPhase: number,
): string {
  return join(
    controlRoot,
    "features",
    feature,
    "runs",
    runId,
    "speculation",
    `phase${String(unitPhase)}`,
    "set-aside.json",
  );
}

/** The coordinator's inputs, as the composition root holds them. */
export type SpeculationCoordinatorInput = {
  /** `loop.speculate` in force (off by default, off under `parity`, F154-FR-001). */
  readonly on: boolean;
  /** `loop.speculate.depth` (default 1, CQ-154-18 A). */
  readonly depth: number;
  /** `loop.speculate.window`, in attempts (default 20, CQ-154-18 A). */
  readonly window: number;
  /** `loop.speculate.minRate`, in per cent (default 50, CQ-154-18 A). */
  readonly minRatePerCent: number;
  readonly feature: string;
  readonly runId: string;
  readonly controlRoot: string;
  /** The workspace; the unit's snapshot reads it, and integration applies to it. */
  readonly workspace: string;
  readonly taskListPath: string;
  /** The run's events file: where the ledger counts come from. */
  readonly eventsPath: string;
  /** Only a test hands another HOME (the worker root lives under it, F143-FR-005). */
  readonly home?: string | undefined;
  /** The engine's one event writer (Principle V). */
  readonly emit: (type: string, data: Readonly<Record<string, unknown>>) => void;
  /** Whether the engine's critic-class call carries no tools (IX). Default true. */
  readonly criticHasNoTools?: (() => boolean) | undefined;
  /** Whether the adapter confirmed the read denial of the worker root. Default false. */
  readonly readDenialConfirmed?: (() => boolean) | undefined;
  /** The cost of the unit's passes so far, as the run's usage holds it. */
  readonly costOf?: (() => SpeculationCost) | undefined;
  /** Only a test hands another clock. */
  readonly nowMs?: (() => number) | undefined;
};

/** The verdict the parallel wiring's `speculationVerdictAt` seam reads. */
export type SpeculationStartVerdict = {
  readonly start: boolean;
  readonly reason?: "rate" | "depth" | "sweep" | undefined;
};

/**
 * The integration inputs of one approved speculative unit (SP-5,
 * F154-FR-063): what the engine hands to `integrateGroup`, the same entry
 * point a group uses, BEFORE phase n+1's own gate. Producing them is the
 * whole of what this module does on an approval — no compose, no apply.
 */
export type SpeculationIntegrationInputs = {
  readonly phase: number;
  readonly unitPhase: number;
  /** The rule id the admission recorded, carried onto the integrated event. */
  readonly ruleId: string;
  /** The worker id of the delta: `spec-<unitPhase>`. */
  readonly workerId: string;
  /** The base snapshot the unit branched from (F154-FR-061). */
  readonly baseTreeId: string;
  /** The final snapshot of the unit's tree. */
  readonly finalTreeId: string;
  /** The paths the tree changed over the base, as `changed` gave them. */
  readonly paths: readonly string[];
};

/** One speculative unit in flight. */
type UnitInFlight = {
  readonly phase: number;
  readonly unitPhase: number;
  readonly tree: WorkerTree;
  readonly baseTreeId: string;
  readonly startedAtMs: number;
  readonly ruleId: string;
};

/** The coordinator, with what the composition root and the tests observe. */
export type SpeculationCoordinator = {
  readonly on: boolean;
  /** Whether a unit is in flight (the depth in force, F154-FR-062). */
  readonly depthInForce: () => number;
  /** The gate-start decision of phase n (T145): decide, emit ONE admission event, start on SP-1. */
  readonly verdictAtTheGate: (phase: number) => Promise<SpeculationStartVerdict>;
  /**
   * SP-5 — the verdict of phase n approved: produce the INTEGRATION INPUTS of
   * the unit (final snapshot, changed paths) BEFORE phase n+1's gate
   * (F154-FR-063). The composition and the application belong to
   * `integrateGroup`, which the ENGINE calls over these inputs; this module
   * never writes the workspace.
   */
  readonly integrationInputsOf: (phase: number) => Promise<SpeculationIntegrationInputs | null>;
  /** The integration ports over this unit's store, for the engine's `integrateGroup` call. */
  readonly integrationPortsOf: () => IntegrationPorts;
  /** The trees whose inputs were produced: released after `integrateGroup` applied. */
  readonly releaseIntegrated: () => Promise<void>;
  /** SP-6 — the verdict of phase n rejected: discard the unit at no counter (F154-FR-064). */
  readonly resolveOnRejection: (phase: number) => Promise<boolean>;
  /** F154-FR-074 — a stop ends the speculative worker as it ends a group worker. */
  readonly stopNow: () => Promise<void>;
  /** The path of the set-aside record the last rejection wrote, for the tests. */
  readonly setAsidePathOf: (unitPhase: number) => string;
};

/**
 * THE COORDINATOR. With `loop.speculate` off it answers `null` and the run
 * is exactly what it was before US7 (F154-FR-001).
 */
export function speculationCoordinatorOf(
  input: SpeculationCoordinatorInput,
): SpeculationCoordinator | null {
  if (!input.on) return null;

  const places = placesOfThePhaseTreeStore({
    controlRoot: input.controlRoot,
    runId: input.runId,
    ...(input.home === undefined ? {} : { home: input.home }),
  });
  initStore(places);
  const store = treeStore(places, {
    runId: input.runId,
    groupId: "speculation",
    seedSource: input.workspace,
    taskListPath: input.taskListPath,
  });

  const nowMs = input.nowMs ?? (() => Date.now());
  const criticHasNoTools = input.criticHasNoTools ?? (() => true);
  const readDenialConfirmed = input.readDenialConfirmed ?? (() => false);
  const costOf = input.costOf ?? (() => ({ tokens: 0, wallTimeMs: 0, cycles: 0 }));

  // The units in flight (the depth, F154-FR-062): one per gate that started.
  let units: UnitInFlight[] = [];
  const depthInForce = (): number => units.length;

  const verdictAtTheGate = async (phase: number): Promise<SpeculationStartVerdict> => {
    const counts = ledgerCountsOf(input.eventsPath, input.window);
    const ratePerCent = approvalRateOverWindowOf(counts.approvals, counts.attemptsStarted);
    // F154-FR-067 — a tree that stood when a critic-class call of THIS gate
    // begins may stand only where the critic cannot read it (T146).
    const sweepConfirmed = sweepConfirmsNoReadableTree({
      criticHasNoTools: criticHasNoTools(),
      readDenialConfirmed: readDenialConfirmed(),
      leftoverTrees: units.map((one) => one.tree.path),
    });
    const decision = speculationVerdictOf({
      ratePerCent,
      depth: depthInForce(),
      sweepConfirmed,
      verdict: "open",
      minRatePerCent: input.minRatePerCent,
      maxDepth: input.depth,
    });
    const data: SpeculationAdmissionData = {
      decision: decision.choice === "start" ? "start" : "skip",
      ...(refusalReasonOf(decision) === undefined ? {} : { reason: refusalReasonOf(decision) }),
      ruleId: decision.ruleId,
      phase,
      unitPhase: phase + 1,
      ratePerCent,
      window: input.window,
      minRatePerCent: input.minRatePerCent,
      depth: depthInForce(),
      maxDepth: input.depth,
    };
    input.emit(SPECULATION_ADMISSION_EVENT, data as unknown as Readonly<Record<string, unknown>>);
    if (decision.choice !== "start") {
      return {
        start: false,
        reason: refusalReasonOf(decision),
      };
    }
    // THE FROZEN SNAPSHOT (F154-FR-061): the tree branches from a snapshot
    // of the workspace as the gate of phase n opens — the workspace itself
    // is never written (only `apply` may write it, and integration alone
    // calls `apply`). THE OPAQUE PATH (F154-FR-069): the tree's directory
    // names nothing of the phase.
    const baseTreeId = await store.snapshot(input.workspace);
    const name = createHash("sha256")
      .update(`${input.runId}:spec:${String(phase + 1)}`)
      .digest("hex")
      .slice(0, 16);
    const tree = await store.materialize(baseTreeId, name);
    units.push({
      phase,
      unitPhase: phase + 1,
      tree,
      baseTreeId,
      startedAtMs: nowMs(),
      ruleId: decision.ruleId,
    });
    return { start: true };
  };

  // The trees whose integration inputs were produced and that the engine's
  // `integrateGroup` call still names through their store ids: released only
  // after the application landed (the same order a group's close keeps).
  const pendingRelease: WorkerTree[] = [];

  const integrationInputsOf = async (
    phase: number,
  ): Promise<SpeculationIntegrationInputs | null> => {
    const index = units.findIndex((one) => one.phase === phase);
    if (index < 0) return null;
    const [current] = units.splice(index, 1);
    // SP-5 (F154-FR-063) — integrated LIKE A GROUP: this module stops at
    // producing the INTEGRATION INPUTS — the final snapshot of the tree and
    // its changed paths over the base snapshot. The composition and the
    // application belong to `integrateGroup` of core (`integrate.ts`), the
    // same entry point a group uses, which the ENGINE calls before phase
    // n+1's own gate; this module never writes the workspace. No outer
    // counter moves of its own; the applied paths are ordinary work of the
    // phase.
    const finalTreeId = await store.snapshot(current.tree.path);
    const changed = await store.changed(current.baseTreeId, finalTreeId);
    pendingRelease.push(current.tree);
    return Object.freeze({
      phase: current.phase,
      unitPhase: current.unitPhase,
      ruleId: current.ruleId,
      workerId: `spec-${current.unitPhase}`,
      baseTreeId: current.baseTreeId,
      finalTreeId,
      paths: Object.freeze(changed.map((one) => one.path)),
    });
  };

  const integrationPortsOf = (): IntegrationPorts => ({
    compose: (base, deltas) => store.compose(base, deltas),
    // The store's `apply` — the one operation that may write the workspace
    // (F100-FR-121) — is reached ONLY through `integrateGroup`.
    apply: (base, composed, workspace) => store.apply(base, composed, workspace),
    fingerprint: (directory) => store.snapshot(directory),
    // The speculative unit ticks NOTHING in the workspace: phase n+1's own
    // gate still stands ahead of it, so no checkbox of the workspace may
    // move. Its provenance is the `loop.speculation.*` events, not the
    // parallel ledger, so the record port is inert as well.
    tick: (): Promise<TickOutcome> => Promise.resolve({ ticked: [] }),
    record: () => Promise.resolve(),
  });

  const releaseIntegrated = async (): Promise<void> => {
    const remaining = [...pendingRelease];
    pendingRelease.length = 0;
    for (const tree of remaining) await store.release(tree);
  };

  const resolveOnRejection = async (phase: number): Promise<boolean> => {
    const index = units.findIndex((one) => one.phase === phase);
    if (index < 0) return false;
    const [current] = units.splice(index, 1);
    const cost = costOf();
    const record = setAsideRecordOf({
      feature: input.feature,
      runId: input.runId,
      phase: current.phase,
      unitPhase: current.unitPhase,
      ruleId: "SP-6",
      cost,
      setAsideAt: nowMs(),
    });
    const path = setAsidePathOf(input.controlRoot, input.feature, input.runId, current.unitPhase);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    input.emit(SPECULATION_SET_ASIDE_EVENT, {
      phase: current.phase,
      unitPhase: current.unitPhase,
      ruleId: current.ruleId,
      tokens: record.cost.tokens,
      wallTimeMs: record.cost.wallTimeMs,
      cycles: record.cost.cycles,
    });
    // THE DISCARD (F154-FR-064): the tree is removed; the workspace is NOT
    // reverted — a discarded tree is not a revert.
    await store.release(current.tree);
    rmSync(current.tree.path, { recursive: true, force: true });
    return true;
  };

  const stopNow = async (): Promise<void> => {
    const remaining = units;
    units = [];
    for (const current of remaining) {
      await store.release(current.tree);
      rmSync(current.tree.path, { recursive: true, force: true });
    }
  };

  return {
    on: true,
    depthInForce,
    verdictAtTheGate,
    integrationInputsOf,
    integrationPortsOf,
    releaseIntegrated,
    resolveOnRejection,
    stopNow,
    setAsidePathOf: (unitPhase: number) =>
      setAsidePathOf(input.controlRoot, input.feature, input.runId, unitPhase),
  };
}

/** Re-exported for the wiring's imports to stay on one module (F154-FR-003). */
export { SPECULATION_POINT, SET_ASIDE_SCHEMA };
