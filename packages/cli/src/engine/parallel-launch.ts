/**
 * The engine's launch side of the loop layer `parallel` (feature 142): the
 * plan and its persistence.
 *
 * The layer decides and never executes (F142-FR-006): at launch it is handed
 * the task list exactly as it was read, the configuration in force and the
 * facts the engine read, and it hands back the plan, the directive to store it
 * and the event that carries its hash. This module is the engine half of that
 * handover (T051, F142-FR-017): it reads the task list of `tasks.md` through
 * the same grammar the phase loop reads, fills the admission inputs the engine
 * genuinely knows at launch, evaluates the eight preconditions, hashes the
 * plan through the canonical record hasher of the kernel, and executes the
 * handover — the plan file under the run's directory of the control plane,
 * written by the engine, and the `parallel.plan` event, emitted by the engine.
 *
 * With the switch `off` the module writes nothing, emits nothing and says
 * nothing: inertness is the whole of F142-SC-001, and `runRecordFields` alone
 * still records `loop.parallel.units=off` so the run says what it ran with.
 */
import { canonicalRecordHash, canonicalRecordText } from "@specstride/kernel/hasher";
import {
  ALONE_IN_ITS_RUN,
  evaluatePreconditions,
  groupsInThePlan,
  handThePlanToTheEngine,
  isConfigurationError,
  planAtLaunch,
  runRecordFields,
  scopesOf,
  unitsInForce,
  workersInForce,
  type AllowDetectConfiguration,
  type AdmissionInputs,
  type FallbackReason,
  type ParallelPlan,
  type PlanHasher,
  type PreconditionInputs,
  type ScopeConfiguration,
  type TaskAsReadAtLaunch,
  type UnitsConfiguration,
  type UnitsValue,
  type WorkerCountConfiguration,
} from "../../../layer-parallel/src/index.ts";
import { windows as quotaWindows } from "@specstride/policy/quota";
import type { QuotaObservation } from "../../../layer-parallel/src/admission.ts";
import type { FrozenTaskGroupShape } from "../../../layer-parallel/src/groups.ts";

/** The frozen task groups of the launch record per phase number (F154-FR-031). */
export type GroupCandidatesOfThePhases = Readonly<Record<number, readonly FrozenTaskGroupShape[]>>;
import type { SpecPhase } from "../../../spec-formats/src/model.ts";

/** The hasher of the plan: the canonical record hasher of the kernel. */
export const THE_PLAN_HASHER: PlanHasher = Object.freeze({
  canonicalRecordText: (record) => canonicalRecordText(record),
  canonicalRecordHash: (record) => canonicalRecordHash(record),
});

/**
 * The task list exactly as the reading at launch read it (F142-FR-007,
 * F142-FR-017): the grammar's own reading, carried over — a task is a
 * candidate where and only where the reading carries `[P]` on it — with the
 * heading fact the admission of serial runs reads (a heading between a task
 * and the one before it starts a new serial run; `admission.ts`).
 */
export function taskListAsReadAtLaunch(
  lines: string,
  phases: readonly SpecPhase[],
): readonly TaskAsReadAtLaunch[] {
  const fileLines = lines.split("\n");
  // A heading stands between two tasks where a markdown heading line stands
  // strictly between their lines in the file. Only headings INSIDE one phase
  // matter: the phase change alone already starts a new serial run.
  const headingBetween = (fromLine: number, toLine: number): boolean => {
    for (let at = fromLine + 1; at < toLine; at += 1) {
      if (/^#{1,6}\s/.test(fileLines[at] ?? "")) return true;
    }
    return false;
  };
  const tasks: TaskAsReadAtLaunch[] = [];
  for (const phase of phases) {
    const ordered = [...phase.tasks].sort((a, b) => a.line - b.line);
    let previous: number | undefined;
    for (const task of ordered) {
      tasks.push({
        id: task.id,
        phase: phase.number,
        marked: task.markers.includes("[P]"),
        text: task.text,
        ...(previous !== undefined && headingBetween(previous, task.line)
          ? { headingBefore: true }
          : {}),
        ...(task.ticked ? { ticked: true } : {}),
      });
      previous = task.line;
    }
  }
  return Object.freeze(tasks);
}

/** What the engine reads at launch, before the layer is asked anything. */
export type ParallelLaunchInput = {
  /** The run the plan belongs to; the plan carries it (annex D §D.3). */
  readonly runId: string;
  /** The ranks of `loop.parallel.units` the real merge resolved. */
  readonly units: UnitsConfiguration;
  /** The two worker-count keys, by the source the layer trusts for each. */
  readonly workers?: WorkerCountConfiguration;
  /** `loop.parallel.quota_headroom`, in per cent, where configuration set it. */
  readonly quotaHeadroomPerCent?: number;
  /**
   * The last limit-window facts the run observed of the proposer's account
   * (F127-FR-009), for the utilisation the check `headroom` reads
   * (F154-FR-021). Left out — the engine observes no window in this scope
   * yet — no utilisation was observed and the admission reads the empty
   * list, exactly as before this field existed.
   */
  readonly quotaWindowsOfTheLaunch?: quotaWindows.LimitWindowState;
  /** The instant the window facts are read at; the caller reads its clock. */
  readonly nowMs?: number;
  /** Where `loop.parallel.allow_detect` was found. */
  readonly allowDetect?: AllowDetectConfiguration;
  /** The scopes configuration declares, over the two sources of `scope.ts`. */
  readonly scopeConfiguration?: ScopeConfiguration;
  /**
   * The facts the eight preconditions read, as the engine read them — the
   * loop strategy, the gate, the git facts, the harness entry, the
   * containment in force. The group count is the module's to fill: it reads
   * it from the plan the admission just computed (F142-FR-002).
   */
  readonly preconditions?: Omit<PreconditionInputs, "groupsInThePlan">;
  /** The raw `tasks.md`, for the heading fact of the serial runs. */
  readonly lines: string;
  /** The phases of the task list, as the grammar read them. */
  readonly phases: readonly SpecPhase[];
  /**
   * The inner check set of the phases after the exclusions in force
   * (F142-FR-012): the engine derives it from the same verification
   * declaration the phase gate reads. An empty set admits no group.
   */
  readonly innerCheckSet?: readonly string[];
  /** Where the engine stores the plan: the file of the logical name. */
  readonly planPath: string;
  /** The engine's write into the control plane. */
  readonly store: (path: string, text: string) => void;
  /** The engine's event emitter (the primary stream of the run). */
  readonly emit: (type: string, data: Readonly<Record<string, unknown>>) => void;
  /** The hasher, for tests; the canonical hasher of the kernel at launch. */
  readonly hasher?: PlanHasher;
  /**
   * F154-FR-031 (feature 154, phase 9, T076; CQ-154-02, -09) — the frozen
   * task groups of the launch record per phase number, AS THE CANDIDATES of
   * the planner, read where `loop.parallel.groupUnits` is on. Left out, the
   * `[P]` tasks stay the unit and the admission slices as before. The launch
   * passes them through to BOTH `planAtLaunch` calls, so the pre- and the
   * post-precondition plan stay the same plan (F154-SC-002).
   */
  readonly groupCandidatesOfThePhases?: GroupCandidatesOfThePhases;
};

/** What the launch of the layer hands the engine back. */
export type ParallelLaunch = {
  /** The value of the switch in force (`on` or `off`). */
  readonly units: UnitsValue;
  /** True where the switch is on AND every precondition held. */
  readonly on: boolean;
  /** The first precondition that failed, or `null` where none did. */
  readonly fallback: FallbackReason | null;
  /** The hashed plan, or `null` with the option off (nothing was computed). */
  readonly plan: ParallelPlan | null;
  /** True where the engine stored the plan file. */
  readonly planWritten: boolean;
  /** True where the engine emitted the `parallel.plan` event. */
  readonly eventEmitted: boolean;
  /** The lines the launch says, in the order it says them. */
  readonly launchLines: readonly string[];
  /** The `parallel=` field of the `[LOOP]` line, or `null` where the layer is on. */
  readonly loopLineField: string | null;
  /** The run-record fields of the layer (row DV-088). */
  readonly fields: Readonly<Record<string, string>>;
};

/** A configured worker count over its ceiling: the launch is refused (F142-FR-019). */
export type ParallelConfigurationError = {
  readonly configurationError: true;
  readonly key: string;
  readonly message: string;
};

/** The launch of the layer, or the configuration error that refuses it. */
export type ParallelLaunchOutcome = ParallelLaunch | ParallelConfigurationError;

/** True where the outcome is the configuration error of F142-FR-019. */
export function isParallelConfigurationError(
  outcome: ParallelLaunchOutcome,
): outcome is ParallelConfigurationError {
  return (outcome as ParallelConfigurationError).configurationError === true;
}

/**
 * The launch lines that name the candidate tasks the admission refused —
 * the owed item of par-3, printed next to the launch message. A task the
 * plan made serial BY A CHECK of row 61 is a `[P]` candidate that a real
 * check refused, and an operator must be able to read that refusal on the
 * console, not only in `parallel-plan.json` (F142-SC-010's "refused with its
 * reason" is about a run's own output too). Two serial reasons are NOT
 * refusals and print nothing: `marker` — an unmarked task was never a
 * candidate (F142-FR-007), and printing every unmarked task would drown the
 * line of an ordinary serial run; `alone-in-its-run` — no check refused it,
 * its run of admitted tasks was only too short for a group (F142-FR-008).
 */
function refusalLinesOf(plan: ParallelPlan): readonly string[] {
  const lines: string[] = [];
  for (const phase of plan.phases) {
    for (const serial of phase.serial) {
      if (serial.reason === ALONE_IN_ITS_RUN || serial.reason === "marker") continue;
      lines.push(
        `parallel: ${serial.id} was refused a place in a group (${serial.reason}${
          serial.detail === undefined ? "" : `: ${serial.detail}`
        })`,
      );
    }
  }
  return Object.freeze(lines);
}

/**
 * Launch the loop layer `parallel` (T051): the plan at launch, its hash, its
 * persistence, the eight preconditions and the fields of the run record.
 *
 * The order is the spec's: the admission runs first and computes the plan
 * (pure), the preconditions read the group count from it — the precondition
 * `no-group` is about the computed plan, not about the switch — and where a
 * precondition failed, the plan is computed again with that reason as its
 * `fallback`, so the stored plan says why the run carried no group. The
 * admission is pure and deterministic, so the two computations give the same
 * groups, and the stored hash is the hash of the stored record.
 */

/**
 * F154-FR-021 (T052) — the quota observation the check `headroom` reads,
 * from the last limit-window facts the run observed of the proposer's
 * account (F127-FR-009), read through `readLimitWindow` and `headroomOf`
 * (`windows.ts:158`, `:318`).
 *
 * The observation carries the last observed utilisation of EVERY window the
 * state holds, in the deterministic order of the target keys, so that the
 * same facts give the same observation — the plan is derived from it
 * (F154-SC-002). A state with no window at all gives the empty list, which
 * the check `headroom` reads as "no quota window was observed in the run"
 * and the worker count reads as the two of F142-FR-016.
 */
export function quotaObservationOfTheWindows(input: {
  readonly state: quotaWindows.LimitWindowState;
  /** `loop.parallel.quota_headroom`, in per cent. */
  readonly headroomPerCent: number;
  readonly nowMs: number;
}): QuotaObservation {
  const utilisation: number[] = [];
  for (const key of Object.keys(input.state).sort()) {
    // The key is `<harness>/<model tier>` (`targetKey` of windows.ts); a key
    // with no slash is a harness whose tier is empty — the same split
    // `limitedTargets` reads.
    const slash = key.indexOf("/");
    const target =
      slash < 0
        ? { harness: key, modelTier: "" }
        : { harness: key.slice(0, slash), modelTier: key.slice(slash + 1) };
    const reading = quotaWindows.readLimitWindow(input.state, target, input.nowMs);
    if (reading.fact === null) continue;
    const headroom = quotaWindows.headroomOf(input.state, target, input.nowMs);
    if (headroom.utilizationUsed !== null) utilisation.push(headroom.utilizationUsed);
  }
  return Object.freeze({
    utilisationPerCent: Object.freeze(utilisation),
    headroomPerCent: input.headroomPerCent,
  });
}

/**
 * The quota observation of the launch inputs (F154-FR-021): the observed
 * windows where the launch was handed any, else the empty list — the value
 * the admission read before this field existed, and the value it still reads
 * whenever the run observes no window.
 */
function quotaObservationOfTheLaunch(input: ParallelLaunchInput): QuotaObservation {
  if (input.quotaHeadroomPerCent === undefined) {
    return Object.freeze({ utilisationPerCent: Object.freeze([]), headroomPerCent: 0 });
  }
  if (input.quotaWindowsOfTheLaunch === undefined) {
    return Object.freeze({
      utilisationPerCent: Object.freeze([]),
      headroomPerCent: input.quotaHeadroomPerCent,
    });
  }
  return quotaObservationOfTheWindows({
    state: input.quotaWindowsOfTheLaunch,
    headroomPerCent: input.quotaHeadroomPerCent,
    nowMs: input.nowMs ?? Date.now(),
  });
}

export function launchTheParallelLayer(input: ParallelLaunchInput): ParallelLaunchOutcome {
  const units = unitsInForce(input.units);
  if (units === "off") {
    return Object.freeze({
      units,
      on: false,
      fallback: null,
      plan: null,
      planWritten: false,
      eventEmitted: false,
      launchLines: Object.freeze([]),
      loopLineField: null,
      // With the option off the run record says `loop.parallel.units=off` and
      // nothing else of the layer (F142-FR-001, row DV-088).
      fields: runRecordFields(input.units),
    });
  }

  const workersResult = workersInForce(input.workers ?? {});
  if (isConfigurationError(workersResult)) {
    return Object.freeze({
      configurationError: true,
      key: workersResult.key,
      message: workersResult.message,
    });
  }

  const tasks = taskListAsReadAtLaunch(input.lines, input.phases);
  const admission: AdmissionInputs = Object.freeze({
    workers: workersResult.workers,
    scopes: scopesOf(
      tasks.map((task) => ({ id: task.id, text: task.text })),
      input.scopeConfiguration,
    ),
    ...(input.innerCheckSet !== undefined ? { innerCheckSet: input.innerCheckSet } : {}),
    ...(input.quotaHeadroomPerCent !== undefined
      ? {
          headroom: {
            quota: quotaObservationOfTheLaunch(input),
          },
        }
      : {}),
  });
  const hasher = input.hasher ?? THE_PLAN_HASHER;
  const first = planAtLaunch(
    {
      runId: input.runId,
      tasks,
      admission,
      fallback: null,
      ...(input.groupCandidatesOfThePhases !== undefined
        ? { groupCandidatesOfThePhases: input.groupCandidatesOfThePhases }
        : {}),
    },
    hasher,
  );
  const outcome = evaluatePreconditions({
    ...input.preconditions,
    groupsInThePlan: groupsInThePlan(first),
  });
  const plan =
    outcome.reason === null
      ? first
      : planAtLaunch(
          {
            runId: input.runId,
            tasks,
            admission,
            fallback: outcome.reason,
            ...(input.groupCandidatesOfThePhases !== undefined
              ? { groupCandidatesOfThePhases: input.groupCandidatesOfThePhases }
              : {}),
          },
          hasher,
        );

  // The engine stores the plan (the layer never writes, F142-FR-006) under the
  // logical name `run:<runId>:parallel-plan`, and emits the event that carries
  // its hash. The text is JSON with the plan as the record: the hash is taken
  // over the canonical form, never over the file's spelling.
  const handover = handThePlanToTheEngine(plan);
  input.store(input.planPath, `${JSON.stringify(handover.store.plan, null, 2)}\n`);
  input.emit(handover.event.type, handover.event.data);

  return Object.freeze({
    units,
    on: outcome.on,
    fallback: outcome.reason,
    plan,
    planWritten: true,
    eventEmitted: true,
    launchLines: Object.freeze([
      outcome.launchMessage,
      ...outcome.launchMessages,
      ...refusalLinesOf(plan),
    ]),
    loopLineField: outcome.loopLineField,
    fields: runRecordFields(input.units, {
      workers: workersResult.workers,
      workersMax: workersResult.workersMax,
      ...(input.quotaHeadroomPerCent !== undefined
        ? { quotaHeadroomPerCent: input.quotaHeadroomPerCent }
        : {}),
      ...(input.allowDetect?.userConfiguration === true ? { allowDetect: true } : {}),
      planHash: plan.hash,
      // `protection=sandbox` or `protection=detect`, as the preconditions say.
      protection: outcome.protection.replace(/^protection=/, "") as "sandbox" | "detect",
    }),
  });
}
