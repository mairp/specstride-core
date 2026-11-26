/**
 * THE WIRING OF ONE GROUP INTO ONE PHASE ATTEMPT (step 3 of
 * `prompts/specstride-parallel-units.md`): the slice `parallel-attempt.ts`
 * calls "the wiring slice". The composition root (`run-feature.ts`) holds one
 * wiring per phase attempt and uses it in four places:
 *
 *     reservedBlock()               — the main-line prompts while the group waits
 *     startIfTheBoundaryIsClean()   — the group run at a clean pass boundary
 *     handoffForTheCritic()         — the before-critic input of a kept group
 *     the totals and `parallelLoopLineField` — the `parallel=` fields of `[LOOP]`
 *
 * THE DECISIONS THIS SLICE TAKES (the layer decides, it never executes —
 * F142-FR-006 — and every decision below is the layer's own, applied at the
 * place the engine holds the state):
 *
 *  - EVERY group of the phase's plan runs, in plan order (F154-FR-020);
 *    one group is started per call at most when the plan holds one, and a
 *    group left with fewer than two tasks is cancelled (F142-FR-018).
 *  - The boundary is `cleanPassBoundary` of the layer (F142-FR-018): no
 *    session open (the wiring is read between passes, where none can be), no
 *    yield wait open, no phase evidence in the attempt, and every task of the
 *    phase that precedes the group named by a kept unit of work in the
 *    ledger (the composition root reads the ledger of kept units, which
 *    survives across attempts, together with the attempt's own units). At an
 *    unclean boundary the group does not start, and the reserved-tasks block
 *    keeps the main line away from the group's tasks until it does.
 *  - A directive `keep` carries the handoff to the critic before it judges
 *    the attempt (F142-FR-069); `repair` and `none` leave the tasks on the
 *    main line, which the standing prompt already names; `layerOffForAttempt`
 *    and the layer's own `layerOffDecision` over the closed groups of the
 *    attempt (F142-FR-023) emit the layer's event, say what carries on, and
 *    stop further groups of the decision's scope.
 *  - The counts of the `[LOOP] parallel=` field are the layer's `report`
 *    (F142-FR-022) over the run totals this slice keeps moving, one entry per
 *    closed group, `worker-caches=shared` (no toolchain profile of this host
 *    moves a cache per worker).
 *
 * WHAT IS NOT HERE: the persisted plan (`parallel-launch.ts`), the group run
 * itself (`parallel-attempt.ts` over `parallel-group.ts` and
 * `parallel-drive.ts`), and the run-record fields' file home (the engine
 * writes no `run-record.json` today; the fields are returned by the launch
 * and carried on the `[LOOP]` line, which is where DV-088 says a run says
 * what it ran with).
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";

import type { CheckRunner, ManifestEntry } from "@specstride/contracts/ep/check-runner";
import type { CheckResult } from "@specstride/contracts/ep/check-runner";
import type { RegistryAccess } from "../../../core/src/pass-supervision/ports.ts";
import type { TaskGroup } from "../../../core/src/spec-groups/slicer.ts";
import type { TickOutcome } from "../../../core/src/parallel/integrate.ts";
import {
  cleanPassBoundary,
  FAILED_GROUPS_THAT_SWITCH_THE_LAYER_OFF,
  groupFailed,
  layerOffDecision,
  layerOffFor,
  report as reportOfTheLayer,
  reservedTasksBlockText,
  shrinkOrCancelAGroup,
  TRANSIENT_RATE_LIMITS_THAT_HALVE,
  chargeCyclesPerAdmittedTask,
  cyclesSufficeForTheGroup,
  type CycleCharge,
  workerBlockText,
  workerCachesReading,
  type AdmissionInputs,
  type AdmissionVerdict,
  type BoundaryVerdict,
  type ClosedGroup,
  type FallbackReason,
  type GroupGate,
  type LayerOffDecision,
  type LayerOffReason,
  type ParallelPlan,
  type PlannedGroup,
  type QuotaObservation,
  workersForTheRestOfTheAttempt,
  type WorkerCaches,
} from "../../../layer-parallel/src/index.ts";
import { tickFile, tickedTaskIds } from "../../../spec-formats/src/tick.ts";
import {
  dshStartDoor,
  membersOfTheGroup,
  placesOfTheParallelStore,
  theParallelHomeOfARun,
  type PreparedWorker,
} from "./parallel-group.ts";
import {
  runTheGroupOfTheAttempt,
  type TheGroupAttempt,
  type TheGroupAttemptRefused,
  type TheGroupAttemptStoppedNow,
} from "./parallel-attempt.ts";
import {
  carryOutTheResumeOfTheOpenGroup,
  endTheHoldersOfTheOpenGroup,
  theOpenParallelGroupOf,
} from "./parallel-resume.ts";
import type { TheTailOfTheResumeDrive } from "./parallel-resume-drive.ts";

/** The worker count of a group whose plan carries no count of its own. */
const WORKERS_AT_A_TIME_DEFAULT = 2;

/** The format of the task list the engine reads (F104; the one Wave 1 reader). */
const THE_TASK_LIST_FORMAT = "speckit-tasks" as const;

/* ================================================================== *
 * 1. The plan read at the wiring: the group of the phase.
 * ================================================================== */

/** The first group of a phase of the plan, or `undefined` where none is. */
export function theGroupOfThePhase(plan: ParallelPlan, phase: number): PlannedGroup | undefined {
  return theGroupsOfThePhase(plan, phase)[0];
}

/**
 * EVERY group of a phase of the plan, in plan order (F154-FR-020): a phase
 * attempt works all of them, one after the other, never only the first.
 */
export function theGroupsOfThePhase(plan: ParallelPlan, phase: number): readonly PlannedGroup[] {
  return plan.phases.find((entry) => entry.phase === phase)?.groups ?? [];
}

/**
 * The tasks of the phase that precede the group, in the order at launch —
 * the first input of the boundary's kept-unit condition (F142-FR-018).
 * The group asked for is the plan's first where none is named.
 */
export function tasksBeforeTheGroup(
  plan: ParallelPlan,
  phase: number,
  ofTheGroup?: PlannedGroup,
): readonly string[] {
  const entry = plan.phases.find((candidate) => candidate.phase === phase);
  const group = ofTheGroup ?? theGroupOfThePhase(plan, phase);
  if (entry === undefined || group === undefined) return Object.freeze([]);
  const first = group.tasks[0];
  if (first === undefined) return Object.freeze([]);
  const ids = entry.tasks.map((task) => task.id);
  const at = ids.indexOf(first);
  return Object.freeze(at <= 0 ? [] : ids.slice(0, at));
}

/** The verdict on the boundary, as the layer computes it (F142-FR-018). */
export function theBoundaryOfNow(input: {
  readonly sessionOpen: boolean;
  readonly yieldWaitOpen: boolean;
  readonly evidencePresent: boolean;
  readonly plan: ParallelPlan;
  readonly phase: number;
  readonly keptUnits: readonly string[];
}): BoundaryVerdict {
  return cleanPassBoundary({
    sessionOpen: input.sessionOpen,
    yieldWaitOpen: input.yieldWaitOpen,
    phaseEvidencePresent: input.evidencePresent,
    tasksBeforeTheGroup: tasksBeforeTheGroup(input.plan, input.phase),
    tasksNamedByKeptUnits: input.keptUnits,
  });
}

/* ================================================================== *
 * 2. The closed group of one attempt, as the layer reads a group.
 * ================================================================== */

/**
 * The layer's `ClosedGroup` of one group attempt (F142-FR-023): the workers
 * an audit refused, the workers a time limit or a watchdog ended, and whether
 * the group's merge check passed — `null` where no check was due.
 */
export function theClosedGroupOf(attempt: TheGroupAttempt | TheGroupAttemptRefused): ClosedGroup {
  if (!attempt.ok) {
    // A start refusal is a worker the harness refused: the group closed as
    // failed at the survivor search, and the refusal is the cause here too.
    return Object.freeze({
      groupId: attempt.groupId,
      refused: Object.freeze([attempt.workerId]),
      killed: Object.freeze([]),
      mergeCheckPassed: null,
    });
  }
  return Object.freeze({
    groupId: attempt.groupId,
    refused: Object.freeze(attempt.audit.refused.map((row) => row.workerId)),
    killed: Object.freeze(
      attempt.barrier.perWorker
        .filter((row) => row.outcome.outcome === "killed")
        .map((row) => row.workerId),
    ),
    mergeCheckPassed:
      attempt.merge === undefined ? null : attempt.merge.outcome.directive === "keep",
  });
}

/* ================================================================== *
 * 3. The real doors the wiring hands the group run.
 * ================================================================== */

/** The real check runner: the command runs as a process with its real exit. */
export function theRealCheckRunner(): CheckRunner {
  const results = new Map<string, { exitCode: number; durationMs: number; out: string }>();
  let next = 0;
  return {
    pin: async (entry) => ({
      kind: "command",
      executable: entry.argv[0] ?? "node",
      argv: entry.argv.slice(1),
    }),
    start: async (probe) => {
      const id = `check-${String(++next)}`;
      const began = Date.now();
      const done = spawnSync(probe.identity.executable ?? "node", probe.identity.argv ?? [], {
        cwd: probe.workingDirectory,
        encoding: "utf8",
        timeout: probe.timeLimitMs,
      });
      results.set(id, {
        exitCode: done.status ?? 1,
        durationMs: Date.now() - began,
        out: `${done.stdout ?? ""}${done.stderr ?? ""}`,
      });
      return { id };
    },
    poll: async () => ({ state: "ended" as const }),
    result: async (handle) => {
      const one = results.get(handle.id);
      if (one === undefined) throw new Error(`no result for the handle ${handle.id}`);
      return {
        exitCode: one.exitCode,
        durationMs: one.durationMs,
        output: { logicalName: "merge-check-output", hash: one.out, size: one.out.length },
        tainted: false,
        cached: false,
        flaky: false,
        interrupted: false,
        unchecked: false,
      };
    },
    cancel: async () => {},
    environment: () => ({}),
  };
}

/**
 * The tick of the integrated tasks over the REAL task list (F143-FR-021): the
 * one byte a tick may change is the character inside the box, and the file is
 * rewritten atomically by the format reader's own tick. A task the tick did
 * not find is named in `notFound`.
 */
export function theTickOfTheTaskList(
  tasksPath: string,
): (taskIds: readonly string[]) => Promise<TickOutcome> {
  return async (taskIds) => {
    const result = tickFile({
      path: tasksPath,
      format: THE_TASK_LIST_FORMAT,
      request: { taskIds: [...taskIds] },
    });
    const ticked = new Set(result.taskIds);
    return Object.freeze({
      ticked: Object.freeze(
        result.taskIds.map((taskId, at) => ({ taskId, line: result.lines[at] ?? 0 })),
      ),
      ...(result.taskIds.length === taskIds.length
        ? {}
        : { notFound: Object.freeze([...taskIds].filter((taskId) => !ticked.has(taskId))) }),
    });
  };
}

/**
 * The worker's prompt, from the layer's own block (F142-FR-069), with the
 * checkpoint duty the engine adds (F143-FR-011: one pass that ENDS AT A
 * CHECKPOINT naming its assigned task). The duty names the worker's own
 * outbox — a runtime place only the engine knows — and nothing else: no
 * sibling, no count, no index, no group, which `forbiddenWordsIn` of the
 * layer holds the prompt to.
 */
export function thePromptOfTheWorker(input: {
  readonly taskId: string;
  readonly taskText: string;
  readonly prefixes: readonly string[];
  readonly hash: (text: string) => string;
  /** The worker's own outbox; without it the prompt is the block alone. */
  readonly outboxPath?: string | undefined;
}): string {
  const block = workerBlockText({
    taskId: input.taskId,
    taskText: input.taskText,
    prefixes: input.prefixes,
    hash: input.hash,
  });
  if (input.outboxPath === undefined || input.outboxPath === "") return block;
  const checkpoint = join(input.outboxPath, `${input.taskId}.checkpoint.json`);
  return [
    block,
    `End the work by writing the file ${checkpoint} with the exact content ` +
      `{"task":"${input.taskId}"} — create the directory of the file when it is missing.`,
  ].join("\n");
}

/** Where the two outputs of one worker pass go (the run's own directory). */
export function theOutputRootOfTheWorker(
  controlRoot: string,
  runId: string,
  workerId: string,
): string {
  return join(controlRoot, "runs", runId, "worker-outputs", workerId);
}

/**
 * The secrets of one worker's own places, as the path-leak audit reads them
 * (F142-FR-057): the worker root, the tree store and the control plane, and
 * the opaque token of THIS worker, which only the group run knows and which
 * the run slice hands over with the worker's id.
 */
export function theSecretsOfTheWorker(input: {
  readonly controlRoot: string;
  readonly home: string;
  readonly runId: string;
}): (
  workerId: string,
  workerToken: string,
) => {
  readonly workerRoot: string;
  readonly treeStore: string;
  readonly controlPlane: string;
  readonly workerToken: string;
} {
  const places = placesOfTheParallelStore({
    controlRoot: input.controlRoot,
    runId: input.runId,
    home: input.home,
  });
  return (workerId, workerToken) => {
    void workerId;
    return {
      workerRoot: places.workerRoot,
      treeStore: places.store,
      controlPlane: places.control,
      workerToken,
    };
  };
}

/* ================================================================== *
 * 4. The run totals and the `parallel=` fields of the `[LOOP]` line.
 * ================================================================== */

/** The run's totals of the layer, as the wiring keeps them moving. */
export type ParallelRunTotals = {
  readonly units: "on" | "off";
  readonly workers: number;
  groups: number;
  groupFailures: number;
  refused: number;
  wallMs: number;
  agentMs: number;
};

export function theEmptyRunTotals(units: "on" | "off", workers: number): ParallelRunTotals {
  return { units, workers, groups: 0, groupFailures: 0, refused: 0, wallMs: 0, agentMs: 0 };
}

/** One closed group enters the totals: groups, failures, refusals, times. */
export function totalsAfterTheGroup(
  totals: ParallelRunTotals,
  closed: ClosedGroup,
  counts: { readonly wallMs: number; readonly agentMs: number; readonly refused: number },
): void {
  totals.groups += 1;
  if (groupFailed(closed).failed) totals.groupFailures += 1;
  totals.refused += counts.refused;
  totals.wallMs += Math.max(0, counts.wallMs);
  totals.agentMs += Math.max(0, counts.agentMs);
}

/**
 * The `parallel=` fields of the `[LOOP]` line (F142-FR-022), from the layer's
 * own `report`. `worker-caches=shared` where no toolchain profile moves a
 * cache per worker, which is every host this engine runs on today.
 */
export function parallelLoopLineField(input: {
  readonly totals: ParallelRunTotals;
  /** The reason of row 185, where the layer was switched off in the run. */
  readonly layerOffReason?: LayerOffReason | null;
  /** The fallback reason of row 60, where the launch fell back. */
  readonly fallback?: FallbackReason | null;
}): string {
  const caches: WorkerCaches = workerCachesReading(undefined).value;
  const report = reportOfTheLayer({
    units: input.totals.units,
    workers: input.totals.workers,
    groups: input.totals.groups,
    groupFailures: input.totals.groupFailures,
    refused: input.totals.refused,
    workerCaches: caches,
    wallMs: input.totals.wallMs,
    agentMs: input.totals.agentMs,
    ...(input.layerOffReason ? { layerOff: input.layerOffReason } : {}),
    ...(input.fallback ? { fallback: input.fallback } : {}),
  });
  return report.loopLineField;
}

/* ================================================================== *
 * 5. The wiring of one phase attempt.
 * ================================================================== */

/* ------------------------------------------------------------------ *
 * 5a. The seams of feature 154 (T020). Each is OPTIONAL and each
 * defaults to today's behaviour: left out, the wiring reads the plan's
 * first group, passes the constant `failedGroupsBefore`, and runs no
 * slot, hold, temp-root, queue or speculation logic. Later phases
 * replace one seam at a time from its default reader in the
 * composition root. The types here are inputs only: no behaviour of
 * the wiring changes because a field exists (F154-FR-001).
 * ------------------------------------------------------------------ */

/** A slot store of the host (F154-FR-039 to -044), reached by its bound name. */
export type HostSlotPort = {
  readonly acquire: (bound: string) => Promise<boolean>;
  readonly probe: (
    bound: string,
  ) => Promise<"free" | "held-live" | "held-foreign" | "stale-owner-dead" | "unknown">;
  readonly release: (bound: string) => Promise<void>;
};

/** One quota hold of one harness account (F154-FR-041), or `null` where none is held. */
export type AccountHold = {
  readonly account: string;
  /** The reset time, epoch milliseconds; the hold expires at it and never before. */
  readonly resetAtMs: number;
};

/** One finished phase waiting for its gate, in phase order (F154-FR-058). */
export type QueueEntry = {
  readonly phase: number;
};

/** The one ordered validation queue of the run (F154-FR-058, -059). */
export type ValidationQueuePort = {
  readonly admit: (entry: QueueEntry) => void;
  readonly head: () => QueueEntry | undefined;
  readonly pop: () => QueueEntry | undefined;
};

/** The verdict of a group's acceptance check run in its worker tree (F154-FR-034, -035). */
export type WorkerCheckVerdict = {
  readonly outcome: "passed" | "failed" | "tainted" | "unchecked";
  /** The rule id of the worker-check table (WC-1 to WC-4). */
  readonly ruleId: string;
  readonly detail?: string | undefined;
};

/** Whether a speculative unit starts past an open verdict (F154-FR-061 to -067). */
export type SpeculationVerdict = {
  readonly start: boolean;
  /** Why not, from the closed set { rate, depth, sweep }; present where `start` is false. */
  readonly reason?: "rate" | "depth" | "sweep" | undefined;
};

/** Everything the wiring of one attempt needs, as the composition root holds it. */
export type ParallelWiringInput = {
  /** The plan of the launch; `null` with the option off or a fallback plan. */
  readonly plan: ParallelPlan | null;
  readonly phase: number;
  /** The boundary's reads, in the engine's own view. */
  readonly evidencePresent: () => boolean;
  readonly keptUnitsOf: () => readonly string[];
  /** The failed groups of this phase attempt BEFORE this wiring runs. */
  readonly failedGroupsBefore: number;
  /* The group run's facts, as the composition root holds them. */
  readonly controlRoot: string;
  readonly home: string;
  readonly runId: string;
  readonly workspace: string;
  readonly slug: string;
  readonly taskListPath: string;
  readonly taskTextAtLaunch: string;
  readonly taskTextOf: (taskId: string) => string;
  readonly model: string;
  readonly modelTierOrEffort: string;
  readonly containment: "C0" | "C1" | "C2" | "C3";
  readonly runToken: string;
  readonly timeLimitMs: number;
  readonly enginePid: number;
  readonly engineStartedAtMs: number;
  readonly registry: RegistryAccess;
  readonly guardScriptPath: string;
  readonly hash: (text: string) => string;
  /** The manifest entries of the merge check (the gate's own commands). */
  readonly innerCheckSet: readonly ManifestEntry[];
  /** Only a test hands another start door; the engine hands the real one. */
  readonly startDoor?: (worker: PreparedWorker) => Promise<unknown>;
  /** Only a test hands another check runner; the engine hands the real one. */
  readonly runner?: CheckRunner;
  /**
   * THE PATH OF THE STOP REQUEST (`inbox:stop`, annex B §B.5), which the
   * group's wait polls at its boundaries (F143-FR-026). Left out, no poll
   * runs. The composition root resolves it through the layout table.
   */
  readonly stopRequestPath?: string | undefined;
  /**
   * The run token hash of THIS run, carried into the stop the
   * group and the carried restart poll: a request that names another run is
   * ignored by the poll, and the sequential boundary removes it.
   */
  readonly runTokenHash?: string | undefined;
  /**
   * `--reset-counts` (F100-FR-045): zeroes the counters THIS start writes,
   * fresh group and carried resume alike. The composition root reads it from
   * the launch argv (`run --reset-counts`, the flag the verb table
   * documents); left out, the counters carry as they always did.
   */
  readonly resetCounts?: boolean | undefined;
  /* ----------------------------------------------------------------
   * The seams of feature 154 (T020). Each is optional; each defaults
   * to today's behaviour at the place that will read it.
   * ---------------------------------------------------------------- */
  /**
   * Every group of the stored plan for the phase, in plan order
   * (F154-FR-020). Default: the plan's first group, as today.
   */
  readonly groupsOfThePhase?: (() => readonly PlannedGroup[]) | undefined;
  /**
   * The group gate of one admission (F154-FR-021 to -024, -033).
   * Default: no group gate runs, as today.
   */
  readonly groupGateOfTheAttempt?: ((inputs: AdmissionInputs) => GroupGate) | undefined;
  /**
   * The last observed utilisation of the proposer account's quota
   * windows (F154-FR-021). Default: no observation.
   */
  readonly quotaObservationOf?: (() => QuotaObservation | null) | undefined;
  /**
   * T056 — the remaining cycles of the micro-loop layer for THIS attempt
   * (F154-FR-023). Default: none read, the gate's cycles check passes, as
   * today. What THIS attempt has charged already is subtracted by the
   * wiring, so the verdict a group is handed reflects the charged budget.
   */
  readonly remainingCyclesOfTheAttempt?: (() => number | undefined) | undefined;
  /**
   * T056 — the charge of one cycle per admitted task at its first start
   * (F142-FR-021, rule PU-87). Default: the layer's
   * `chargeCyclesPerAdmittedTask` over a per-attempt charged set, so a task
   * is charged once whatever the restarts of its worker did.
   */
  readonly chargeCyclesOfTheAdmittedTasks?:
    | ((workerId: string, taskId: string, admittedTasks: readonly string[]) => CycleCharge)
    | undefined;
  /**
   * The rate limits classified as transient that one group of this attempt
   * saw (F154-FR-022, F142-FR-019). Default: none seen, the count never
   * halves, as today.
   */
  readonly transientRateLimitsOfTheGroup?: ((group: PlannedGroup) => number) | undefined;
  /**
   * The count of the phase's failed groups read from the ledger
   * (F154-FR-025). Default: the constant `failedGroupsBefore`, as today.
   */
  readonly failedGroupsBeforeOfTheLedger?: ((phase: number) => number) | undefined;
  /**
   * The no-repeat verdict over one group (F154-FR-026). Default: no
   * repeat check, the group is admitted.
   */
  readonly repeatVerdictOf?: ((group: PlannedGroup) => AdmissionVerdict) | undefined;
  /**
   * The number of paths the group's application changed (F154-FR-027).
   * Default: not read.
   */
  readonly appliedPathCountOf?: ((group: PlannedGroup) => number) | undefined;
  /**
   * The latest inner-set result whose tree fingerprint equals the given
   * base snapshot's (F154-FR-028). Default: no base result.
   */
  readonly baseResultOfTheInnerSet?: ((snapshotFingerprint: string) => CheckResult | null) | undefined;
  /**
   * The group's acceptance check run in its worker tree (F154-FR-034,
   * -035). Default: the check runs on the workspace, as today.
   */
  readonly acceptanceCheckOfTheGroup?:
    | ((worker: PreparedWorker) => Promise<WorkerCheckVerdict>)
    | undefined;
  /**
   * The phase's frozen task groups, as candidates of the planner
   * (F154-FR-031). Default: none, the `[P]` tasks stay the unit.
   */
  readonly groupCandidatesOfThePhase?: (() => readonly TaskGroup[]) | undefined;
  /**
   * The host slot store of the run (F154-FR-039 to -044). Default: no
   * slot is taken, the host is unbounded.
   */
  readonly hostSlots?: (HostSlotPort | null) | undefined;
  /**
   * The quota hold of the proposer's harness account, or `null` where
   * none is held (F154-FR-041). Default: none.
   */
  readonly holdOfTheAccount?: (() => AccountHold | null) | undefined;
  /**
   * The temporary root of the run (F154-FR-043). Default: none, the
   * checks keep their own temporary directories.
   */
  readonly tempRootOfTheRun?: (() => string | null) | undefined;
  /**
   * The declared dependencies of the phase (F154-FR-056). Default: the
   * phase depends on the phase before it, as today.
   */
  readonly phaseDependenciesOf?: ((phase: number) => readonly string[]) | undefined;
  /**
   * The one ordered validation queue of the run (F154-FR-058, -059).
   * Default: no queue, validation stays on the workspace.
   */
  readonly validationQueue?: (ValidationQueuePort | null) | undefined;
  /**
   * Whether a speculative unit starts at this gate (F154-FR-062, -066,
   * -067). Default: none starts.
   */
  readonly speculationVerdictAt?: (() => SpeculationVerdict) | undefined;
  /* The carry-out. */
  readonly emit: (type: string, data: Readonly<Record<string, unknown>>) => void;
  readonly say: (line: string) => void;
  readonly onClosed: (
    closed: ClosedGroup,
    counts: { readonly wallMs: number; readonly agentMs: number; readonly refused: number },
  ) => void;
  readonly onHandoff: (text: string) => void;
};

/** What one wiring of one attempt gives the composition root. */
export type TheParallelWiring = {
  /** The group this attempt may start, or `undefined` where none is planned. */
  readonly group: PlannedGroup | undefined;
  /** The tasks of the phase that precede the group, in the order at launch. */
  readonly tasksBeforeTheGroup: readonly string[];
  /** The reserved-tasks block while the group waits (F142-FR-018). */
  reservedBlock(): string;
  /**
   * Run the group at this boundary, where the boundary is clean (F142-FR-018)
   * and no switch-off has stopped it. Returns whether a group ran.
   */
  startIfTheBoundaryIsClean(): Promise<boolean>;
  /**
   * THE STOP THE GROUP SAW (F143-FR-026), where a request stood in the inbox
   * while it ran: `now` true where `stop --now` cut the workers and left the
   * group to the resume states, false where a clean stop stood and the group
   * closed whole — the stop takes effect at the boundary that follows.
   * `null` where no request stood or no group ran.
   */
  theStopSeenOfTheGroup(): { readonly now: boolean } | null;
  /** The before-critic input of a kept group (F142-FR-069), "" before one. */
  handoffForTheCritic(): string;
  /** True where a decision switched the layer off for the whole run. */
  layerOffForTheRun(): boolean;
  /** True where no further group of this attempt may start. */
  layerOffForTheAttempt(): boolean;
};

/**
 * One wiring of one phase attempt: the state the composition root passes and
 * the carry-out of every directive the group's end hands back.
 */
export function parallelWiringOfTheAttempt(input: ParallelWiringInput): TheParallelWiring {
  const plan = input.plan;
  /* F154-FR-020 — EVERY group of the plan, in plan order: from the seam the
   * composition root wires, else from the plan itself. */
  const groups: readonly PlannedGroup[] =
    plan === null
      ? Object.freeze([])
      : (input.groupsOfThePhase !== undefined
          ? input.groupsOfThePhase()
          : theGroupsOfThePhase(plan, input.phase));
  const group = groups[0];
  const before = plan === null || group === undefined ? [] : tasksBeforeTheGroup(plan, input.phase, group);
  const secretsOf = theSecretsOfTheWorker({
    controlRoot: input.controlRoot,
    home: input.home,
    runId: input.runId,
  });

  let startedOrdinals: number[] = [];
  let cancelledOrdinals: number[] = [];
  let layerOffAttempt = false;
  let layerOffRun = false;
  let handoff = "";
  let stopSeen: { readonly now: boolean } | null = null;
  const closedGroups: ClosedGroup[] = [];
  /** The tasks this attempt's own group runs put on the main line (their ticks). */
  const workedHere: string[] = [];

  const carryOut = (decision: LayerOffDecision): void => {
    input.emit(decision.event.type, decision.event.data);
    input.say(`[LOOP] parallel: ${decision.reason} — ${decision.detail}`);
    input.say(`[LOOP] parallel: ${decision.carriesOn}`);
    if (decision.scope === "attempt") layerOffAttempt = true;
    else layerOffRun = true;
  };

  /** The prompt of one worker of the group with the ordinal given (F154-FR-020). */
  const promptOfTheOrdinal = (groupOrdinal: number) => {
    const members = plan === null ? [] : membersOfTheGroup(plan, input.phase, groupOrdinal);
    return (worker: { readonly taskId: string; readonly outboxPath: string }): string => {
      const member = members.find((one) => one.taskId === worker.taskId);
      return thePromptOfTheWorker({
        taskId: worker.taskId,
        taskText: input.taskTextOf(worker.taskId),
        prefixes: member?.scopePrefixes ?? [],
        hash: input.hash,
        outboxPath: worker.outboxPath,
      });
    };
  };

  /**
   * The tasks the task list as read NOW ticks (F142-FR-018): a task a serial
   * pass worked and ticked leaves its group. An unreadable task list ticks
   * nothing — the reading degrades, it never fails (F154-FR-004).
   */
  const tickedTaskIdsOfTheTaskList = (): readonly string[] => {
    try {
      return tickedTaskIds({
        path: join(input.workspace, input.taskListPath),
        format: THE_TASK_LIST_FORMAT,
      });
    } catch {
      return [];
    }
  };

  /**
   * The count of the phase attempt's failed groups read before EVERY group
   * (F154-FR-025): from the ledger where the composition root reads it, else
   * the constant the composition root passed, as today.
   */
  const failedGroupsBefore = (): number =>
    input.failedGroupsBeforeOfTheLedger !== undefined
      ? input.failedGroupsBeforeOfTheLedger(input.phase)
      : input.failedGroupsBefore;

  /**
   * F154-FR-022 (F142-FR-019) — THE HALVING: the worker count for the rest
   * of the phase attempt, read BEFORE EVERY group. Each earlier group of the
   * attempt that ended with two rate limits classified as transient halves
   * the count once, never below 1.
   */
  let groupsWithTwoTransientRateLimits = 0;
  const workersOfTheGroup = (current: PlannedGroup): number =>
    workersForTheRestOfTheAttempt(
      Math.max(WORKERS_AT_A_TIME_DEFAULT, current.tasks.length),
      groupsWithTwoTransientRateLimits,
    );

  /**
   * T056 — THE CHARGED CYCLES of this attempt (F142-FR-021, rule PU-87):
   * every admitted task whose first start charged its cycle. The set is the
   * idempotency of the charge — a worker that starts again, or a carried
   * resume that restarts its workers, charges nothing for a task named here.
   */
  const chargedCyclesOfTheAttempt = new Set<string>();
  /* The charge of one first start: whatever charger answers (the default is
   * the layer's `chargeCyclesPerAdmittedTask`; the tests of the wiring spy
   * through the seam), the charge it returns is recorded on the attempt's
   * charged set, so the charge stays once per task whatever restarts did. */
  const chargeTheFirstStartOf = (
    workerId: string,
    taskId: string,
    admittedTasks: readonly string[],
  ): CycleCharge => {
    const charge =
      input.chargeCyclesOfTheAdmittedTasks !== undefined
        ? input.chargeCyclesOfTheAdmittedTasks(workerId, taskId, admittedTasks)
        : chargeCyclesPerAdmittedTask(
            [{ workerId, taskId }],
            admittedTasks.filter((task) => !chargedCyclesOfTheAttempt.has(task)),
          );
    for (const [task, charged] of Object.entries(charge.perTask)) {
      if (charged === 1) chargedCyclesOfTheAttempt.add(task);
    }
    return charge;
  };

  return {
    group,
    tasksBeforeTheGroup: before,
    /* The reserved-tasks block stands while the NEXT group of the plan waits
     * (F154-FR-020): the first group not yet started and not cancelled. */
    reservedBlock: () => {
      const waiting = groups.find(
        (candidate) =>
          !startedOrdinals.includes(candidate.ordinal) && !cancelledOrdinals.includes(candidate.ordinal),
      );
      return waiting === undefined || layerOffAttempt || layerOffRun
        ? ""
        : reservedTasksBlockText(waiting.tasks);
    },
    handoffForTheCritic: () => handoff,
    layerOffForTheRun: () => layerOffRun,
    layerOffForTheAttempt: () => layerOffAttempt,
    theStopSeenOfTheGroup: () => stopSeen,
    /* F154-FR-020 — THE GROUPS LOOP: every group of the plan, in plan order,
     * each at its clean boundary, until the layer goes off (F142-FR-023) or
     * a boundary blocks the rest. */
    startIfTheBoundaryIsClean: async () => {
      if (plan === null || groups.length === 0) return false;
      if (layerOffAttempt || layerOffRun) return false;
      let ranAny = false;
      for (const current of groups) {
        if (layerOffAttempt || layerOffRun) break;
        if (startedOrdinals.includes(current.ordinal)) continue;
        if (cancelledOrdinals.includes(current.ordinal)) continue;
        const outcome = await startOneGroup(current);
        if (outcome === "ran") ranAny = true;
        else if (outcome === "stopped") {
          ranAny = true;
          break;
        } else if (outcome === "blocked") break;
        // "failed" and "skipped" fall through: the next group of the plan
        // decides for itself at ITS boundary (F154-FR-020).
      }
      return ranAny;
    },
  };

  /** Where one group's start stood after its run: `ran` when a group was
   * attempted (true where its run held), `skipped` where the next group may
   * still start, `stopped` where `stop --now` cut it, `blocked` where the
   * rest of the plan waits. */
  async function startOneGroup(
    current: PlannedGroup,
  ): Promise<"ran" | "failed" | "skipped" | "stopped" | "blocked"> {
    if (plan === null) return "blocked";
    /* F154-FR-025 (CQ-154-13 A) — read the failed count before EVERY group:
     * at the bound of F142-FR-023 no further group of the attempt starts. */
    const failed = failedGroupsBefore();
    if (failed >= FAILED_GROUPS_THAT_SWITCH_THE_LAYER_OFF) {
      input.say(
        `[LOOP] parallel: ${String(failed)} group(s) of the attempt have failed — the bound of F142-FR-023 is reached, no further group starts (CQ-154-13)`,
      );
      return "blocked";
    }
    /* F142-FR-018 (PU-17) — a task the main line worked (a kept unit names
     * it, or the task list ticks it) leaves the group; a group left with
     * fewer than two tasks is CANCELLED (F154-FR-020). */
    const worked = Object.freeze([...input.keptUnitsOf(), ...tickedTaskIdsOfTheTaskList()]);
    const shrink = shrinkOrCancelAGroup(current, { namedInACheckpoint: worked });
    if (shrink.kind === "cancelled") {
      cancelledOrdinals.push(current.ordinal);
      input.say(
        `[LOOP] parallel: group ${current.ordinal} is cancelled — ${shrink.detail} (F142-FR-018); ${shrink.left.join(", ")} stay on the main line`,
      );
      return "skipped";
    }
    /* F154-FR-022 — the worker count this group runs at, after the halving
     * of the attempt's earlier groups (F142-FR-019); said where it halved. */
    const workers = workersOfTheGroup(current);
    if (groupsWithTwoTransientRateLimits > 0) {
      input.say(
        `[LOOP] parallel: group ${current.ordinal} runs ${String(workers)} worker(s) — halved after ${String(groupsWithTwoTransientRateLimits)} group(s) of the attempt ended with ${String(TRANSIENT_RATE_LIMITS_THAT_HALVE)} transient rate limit(s) (F142-FR-019)`,
      );
    }
    /* The gate of the admission (F154-FR-021 to -024, -033), where the
     * composition root wires it: a refused group's tasks stay serial. */
    if (input.groupGateOfTheAttempt !== undefined) {
      const quota = input.quotaObservationOf !== undefined ? input.quotaObservationOf() : null;
      // T056 (F154-FR-023) — the cycles verdict of THIS group: the remaining
      // cycles of the attempt, less what it charged already, against the
      // group's tasks, through `cyclesSufficeForTheGroup` of the layer. No
      // remaining-cycles reading: no verdict, the check passes, as today.
      const remaining = input.remainingCyclesOfTheAttempt?.();
      const cycles =
        remaining === undefined
          ? undefined
          : cyclesSufficeForTheGroup({
              remainingCycles: Math.max(remaining - chargedCyclesOfTheAttempt.size, 0),
              tasks: current.tasks,
            });
      const gate = input.groupGateOfTheAttempt({
        workers,
        innerCheckSet: input.innerCheckSet.map((entry) => entry.id),
        ...(quota === null ? {} : { headroom: { quota } }),
        ...(cycles === undefined ? {} : { cycles: { sufficesForTheGroup: cycles } }),
      });
      if (!gate.admitted) {
        input.say(
          `[LOOP] parallel: group ${current.ordinal} is not admitted — ${gate.reason ?? "gate"}: ${gate.detail}`,
        );
        return "skipped";
      }
    }
    let attempt: TheGroupAttempt | TheGroupAttemptRefused | TheGroupAttemptStoppedNow | undefined;
    /* ---- THE RESUME JOIN (step 4, F143-FR-025): a group of an earlier
     * engine start may stand open over this feature. Before a fresh start
     * is even considered, the holders of that run's token are ended after
     * the identity check, the decision over the last ledger record is
     * carried out, and where a state stands that this engine cannot carry
     * out, the group does NOT start: an engine that cannot carry a resume
     * state out must never answer it by starting the group again over the
     * open ledger. ---- */
    const open = theOpenParallelGroupOf({
      controlRoot: input.controlRoot,
    });
    if (open !== undefined) {
      const search = await endTheHoldersOfTheOpenGroup({
        open,
        controlRoot: input.controlRoot,
        say: input.say,
      });
      // THE TAIL of the eight states, carried out with the facts of THIS
      // pass boundary — the same audits' inputs, tick, check runner and
      // hash the fresh group run below takes.
      const tailDrive: TheTailOfTheResumeDrive = {
        plan,
        phase: input.phase,
        groupOrdinal: current.ordinal,
        workspace: input.workspace,
        slug: input.slug,
        taskListPath: input.taskListPath,
        taskTextAtLaunch: input.taskTextAtLaunch,
        secretsOf: (workerId: string, workerToken: string) => secretsOf(workerId, workerToken),
        singleWriter: {
          taskList: join(input.workspace, input.taskListPath),
          phaseEvidence: [],
          notebook: join(input.controlRoot, "notebook.md"),
          handoff: join(
            theParallelHomeOfARun(open.runId),
            ".specstride",
            "worker-roots",
            open.runId,
            "handoff.json",
          ),
          workspacePart: join(input.workspace, ".specstride"),
        },
        tick: theTickOfTheTaskList(join(input.workspace, input.taskListPath)),
        runner: input.runner ?? theRealCheckRunner(),
        innerCheckSet: input.innerCheckSet,
        containment: input.containment,
        hash: input.hash,
        emit: (type, data) => input.emit(type, data),
      };
      const carried = await carryOutTheResumeOfTheOpenGroup({
        open,
        controlRoot: input.controlRoot,
        say: input.say,
        drive: tailDrive,
        ...(input.resetCounts === true ? { resetCounts: true } : {}),
        // THE STOP THE CARRIED RESTART RUNS UNDER (F143-FR-026, owed item 4
        // of par-4): the same request the fresh group runs — a restart runs
        // worker passes, and its boundaries poll `inbox:stop` exactly as the
        // fresh group's do.
        ...(input.stopRequestPath === undefined
          ? {}
          : { stopRequestPath: input.stopRequestPath, runTokenHash: input.runTokenHash }),
        // THE RESTART of the two states a worker process has to start for
        // (F143-FR-025 states 1 and 2): the interrupted run's ledger, THIS
        // start's supervision and start door — the restarted passes run
        // under this engine's token, the records go on the interrupted
        // run's ledger.
        restart: {
          tail: tailDrive,
          search,
          model: input.model,
          modelTierOrEffort: input.modelTierOrEffort,
          containment: input.containment,
          runToken: input.runToken,
          runId: input.runId,
          timeLimitSec: Math.ceil(input.timeLimitMs / 1000),
          enginePid: input.enginePid,
          engineStartedAtMs: input.engineStartedAtMs,
          workersAtATime: workers,
          guardScriptPath: input.guardScriptPath,
          registry: input.registry,
          promptOf: promptOfTheOrdinal(current.ordinal),
          outputRootOf: (worker) =>
            theOutputRootOfTheWorker(input.controlRoot, input.runId, worker.workerId),
          ...(input.startDoor === undefined ? {} : { startDoor: input.startDoor as never }),
        },
      });
      const stateOfTheResume = carried.carried
        ? "attempt" in carried
          ? ` (state ${String(carried.state)} of the resume carried out as this start's group run)`
          : ""
        : `, state ${String(carried.state)} of the resume`;
      input.say(
        `[LOOP] parallel: a group of run ${open.runId} (${open.groupId}) stands open from an earlier engine start — ${carried.action}${stateOfTheResume}; the survivor search ended ${String(search.ended.length)} worker(s), ${String(
          search.alreadyGone.length,
        )} had gone, ${String(search.refused.length)} refused by the identity check`,
      );
      if (!carried.carried) return "blocked";
      if ("attempt" in carried) {
        /* The tail of F143-FR-025 was carried out: the group's work stands
         * in the workspace already, and the carried attempt IS this start's
         * group run — the same close, counts and directives the fresh path
         * reports below. A fresh start over an open ledger that this engine
         * just carried is never considered. */
        startedOrdinals.push(current.ordinal);
        attempt = carried.attempt;
        if (carried.stopped !== undefined) {
          // F143-FR-025 state 6 — the loop layer goes off FOR THE RUN.
          layerOffRun = true;
          input.say(
            `[LOOP] parallel: ${carried.stopped.event} — the application of group ${open.groupId} stopped (${carried.stopped.integrityKind}); the loop layer is off for the run`,
          );
        }
      }
    }
    if (attempt === undefined) {
      /* The boundary of THIS group (F154-FR-020): every task of the phase
       * that precedes it is worked — named by a kept unit, or ticked on the
       * task list, or put there by an earlier group of this attempt. */
      const verdict = cleanPassBoundary({
        sessionOpen: false,
        yieldWaitOpen: false,
        phaseEvidencePresent: input.evidencePresent(),
        tasksBeforeTheGroup: tasksBeforeTheGroup(plan, input.phase, current),
        tasksNamedByKeptUnits: [...worked, ...workedHere],
      });
      if (!verdict.clean) {
        input.say(
          `[LOOP] parallel: the group does not start yet — ${verdict.condition}: ${verdict.detail}`,
        );
        return "blocked";
      }
      startedOrdinals.push(current.ordinal);
      const workersAtATime = workers;
      attempt = await runTheGroupOfTheAttempt({
        controlRoot: input.controlRoot,
        runId: input.runId,
        home: input.home,
        plan,
        phase: input.phase,
        groupOrdinal: current.ordinal,
        workspace: input.workspace,
        slug: input.slug,
        taskListPath: input.taskListPath,
        // T056 — the charge of one cycle per admitted task of THIS group, at
        // its first start, once per attempt (F142-FR-021, F154-FR-023).
        chargeCyclesOfTheAdmittedTasks: (workerId, taskId) =>
          chargeTheFirstStartOf(workerId, taskId, current.tasks),
        model: input.model,
        modelTierOrEffort: input.modelTierOrEffort,
        containment: input.containment,
        runToken: input.runToken,
        timeLimitSec: Math.ceil(input.timeLimitMs / 1000),
        promptOf: promptOfTheOrdinal(current.ordinal),
        outputRootOf: (worker) =>
          theOutputRootOfTheWorker(input.controlRoot, input.runId, worker.workerId),
        ...(input.startDoor === undefined
          ? {
              startDoor: dshStartDoor({
                model: input.model,
                modelTierOrEffort: input.modelTierOrEffort,
                containment: input.containment,
                runToken: input.runToken,
                timeLimitMs: input.timeLimitMs,
                promptOf: (worker) => promptOfTheOrdinal(current.ordinal)(worker),
                outputRootOf: (worker) =>
                  theOutputRootOfTheWorker(input.controlRoot, input.runId, worker.workerId),
              }),
            }
          : { startDoor: input.startDoor as never }),
        enginePid: input.enginePid,
        engineStartedAtMs: input.engineStartedAtMs,
        workersAtATime,
        guardScriptPath: input.guardScriptPath,
        registry: input.registry,
        taskTextAtLaunch: input.taskTextAtLaunch,
        secretsOf: (workerId: string, workerToken: string) => secretsOf(workerId, workerToken),
        singleWriter: {
          taskList: join(input.workspace, input.taskListPath),
          phaseEvidence: [],
          notebook: join(input.controlRoot, "notebook.md"),
          handoff: join(input.home, ".specstride", "worker-roots", input.runId, "handoff.json"),
          workspacePart: join(input.workspace, ".specstride"),
        },
        tick: theTickOfTheTaskList(join(input.workspace, input.taskListPath)),
        runner: input.runner ?? theRealCheckRunner(),
        innerCheckSet: input.innerCheckSet,
        hash: input.hash,
        ...(input.resetCounts === true ? { resetCounts: true } : {}),
        ...(input.stopRequestPath === undefined
          ? {}
          : { stopRequestPath: input.stopRequestPath, runTokenHash: input.runTokenHash }),
        emit: (event) => input.emit(event.type, event.data),
        say: input.say,
      });
    }
    workedHere.push(...current.tasks);
    if (attempt !== undefined && "stoppedByStopNow" in attempt) {
      /* ---- `stop --now` cut the group (F143-FR-026): nothing was closed,
       * the ledger stands as the kill left it, and the run stops. ---- */
      stopSeen = { now: true };
      input.say(
        `[LOOP] parallel: stop --now cut group ${attempt.groupId} — no further worker starts, the resume states decide at the next engine start (F143-FR-025, F143-FR-026)`,
      );
      return "stopped";
    }
    // A clean stop the group ran under takes effect AFTER the group
    // (F143-FR-026); the composition root reads it at this boundary.
    if (attempt.ok === true && attempt.stopAfterTheGroup === true) stopSeen = { now: false };
    const closed = theClosedGroupOf(attempt as TheGroupAttempt | TheGroupAttemptRefused);
    const counts = attempt.ok
      ? {
          wallMs: attempt.counts.wallMs,
          agentMs: attempt.counts.agentMs,
          refused: attempt.counts.refused,
        }
      : { wallMs: 0, agentMs: 0, refused: 1 };
    closedGroups.push(closed);
    input.onClosed(closed, counts);
    /* F154-FR-022 — the transient rate limits THIS group ended with count
     * for the groups that follow it in the attempt (F142-FR-019). */
    const transient = input.transientRateLimitsOfTheGroup !== undefined
      ? input.transientRateLimitsOfTheGroup(current)
      : 0;
    if (transient >= TRANSIENT_RATE_LIMITS_THAT_HALVE) {
      groupsWithTwoTransientRateLimits += 1;
    }
    if (attempt.ok) {
      if (attempt.directive === "keep") {
        handoff = attempt.handoff;
        input.onHandoff(attempt.handoff);
      } else if (attempt.directive === "layerOffForAttempt" && attempt.layerOff !== null) {
        carryOut(attempt.layerOff);
      }
      if (attempt.directive === "repair" || attempt.directive === "none") {
        input.say(
          `[LOOP] parallel: ${attempt.tasksOnTheMainLine.join(", ")} run on the main line (${attempt.directive})`,
        );
      }
    } else {
      carryOut(
        layerOffFor("harness-error", {
          groupId: attempt.groupId,
          detail: attempt.message,
        }),
      );
    }
    const decision = layerOffDecision({
      closedGroups,
      failedGroupsBefore: failed,
    });
    if (decision !== null) carryOut(decision);
    return attempt.ok ? "ran" : "failed";
  }
}
