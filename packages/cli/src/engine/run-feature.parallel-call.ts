// F154-FR-020 to -067 (T021) — the call assembly of `parallelWiringOfTheAttempt`,
// extracted from `run-feature.ts` so the change stays small and reviewable.
// The builder returns EXACTLY the argument object the engine assembled inline
// before: every seam of T020 passed explicitly from its default reader, the
// failed groups read from the LEDGER OF THE ATTEMPT through
// `countFailedGroups` (`decide.ts:1640`) — never from the constant 0 — and
// the closed group pushed into that ledger in `onClosed` before the totals
// are updated. Behaviour is identical to the inline assembly; internal to
// the CLI, nothing is exported publicly.
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { groupGate } from "../../../layer-parallel/src/index.ts";
import { countFailedGroups, type ClosedGroup } from "../../../layer-parallel/src/decide.ts";
import {
  totalsAfterTheGroup,
  type ParallelRunTotals,
  type ParallelWiringInput,
} from "./parallel-wiring.ts";

/** The facts of the run the call assembly reads, as the composition root holds them. */
export type TheParallelCallContext = {
  readonly plan: ParallelWiringInput["plan"];
  readonly phase: number;
  readonly resetCounts: boolean;
  readonly evidencePresent: () => boolean;
  readonly keptUnitsPathOf: (relative: string) => string;
  readonly closedGroupsOfTheAttempt: ClosedGroup[];
  readonly runTempRoot: string | null;
  readonly controlRoot: string;
  readonly home: string;
  readonly runId: string;
  readonly workspace: string;
  readonly slug: string;
  readonly taskListPath: string;
  readonly taskTextAtLaunch: string;
  readonly implementerOfTheRun: string | null | undefined;
  readonly model: string;
  readonly containmentCeiling: "C0" | "C1" | "C2" | "C3";
  readonly ceilingSeconds: number;
  readonly enginePid: number;
  readonly engineStartedAtMs: number;
  readonly registry: ParallelWiringInput["registry"];
  readonly guardScriptPath: string;
  readonly stopRequestPath: string;
  readonly runTokenHash: string | undefined;
  readonly npmPath: string | undefined;
  readonly checkCommandOfTheWorkspace: (workdir: string) => string | undefined;
  readonly checkMin: number;
  readonly phases: readonly { tasks: readonly { id: string; text?: string }[] }[];
  readonly parallelTotals: ParallelRunTotals;
  readonly emit: ParallelWiringInput["emit"];
  readonly say: ParallelWiringInput["say"];
};

/** Build the argument object of `parallelWiringOfTheAttempt` for one attempt. */
export function parallelWiringInputOf(ctx: TheParallelCallContext): ParallelWiringInput {
  return {
    plan: ctx.plan,
    phase: ctx.phase,
    ...(ctx.resetCounts ? { resetCounts: true } : {}),
    evidencePresent: ctx.evidencePresent,
    // The kept units of the ledger of the phase (F115's own file): the tasks
    // its kept units of work name are the boundary's last input. A file that
    // fails to read names nothing.
    keptUnitsOf: () => {
      const path = ctx.keptUnitsPathOf(`features/${ctx.slug}/micro/phase${String(ctx.phase)}.json`);
      try {
        if (!existsSync(path)) return [];
        const state = JSON.parse(readFileSync(path, "utf8")) as {
          units?: readonly { outcome?: string; tasks?: readonly string[] }[];
        };
        return (state.units ?? [])
          .filter((unit) => unit.outcome === "kept")
          .flatMap((unit) => unit.tasks ?? []);
      } catch {
        return [];
      }
    },
    /* ---------------------------------------------------------- *
     * F154-FR-020 to -067 (T021) — EVERY seam of T020, passed
     * explicitly from its default reader, so that each later phase
     * changes one seam. Each binding below is the behaviour the
     * engine had before the seams existed: nothing new runs, no
     * decision changes (F154-FR-001). The wiring reads none of them
     * until its own phase turns its switch on.
     * ---------------------------------------------------------- */
    // F154-FR-020 — every group of the stored plan for this phase, in plan
    // order; today the wiring still reads only the first.
    groupsOfThePhase: () => ctx.plan?.phases.find((entry) => entry.phase === ctx.phase)?.groups ?? [],
    // F154-FR-021…-024, -033 — the group gate of one admission, the same
    // pure table the layer computes; no stub.
    groupGateOfTheAttempt: (inputs) => groupGate(inputs),
    // F154-FR-021 — no quota window is observed in this scope yet (the
    // neutral default; P2 replaces it with `readLimitWindow`).
    quotaObservationOf: () => null,
    // F154-FR-025 (T021) — the count of the phase's failed groups comes from
    // the LEDGER OF THE ATTEMPT, through the seam, never from a constant:
    // the groups this attempt has already closed, counted by
    // `countFailedGroups` (`decide.ts:1640`). The required field stays the
    // seam's default reading of the same count, so the wiring sees one
    // number either way.
    failedGroupsBeforeOfTheLedger: (ledgerPhase) =>
      ledgerPhase === ctx.phase ? countFailedGroups(ctx.closedGroupsOfTheAttempt) : 0,
    failedGroupsBefore: countFailedGroups(ctx.closedGroupsOfTheAttempt),
    // F154-FR-026 — with `loop.parallel.noRepeat` off (today's
    // configuration), no repeat check runs and the group is admitted.
    repeatVerdictOf: (group) => {
      void group;
      return {
        check: "marker",
        passed: true,
        detail: "loop.parallel.noRepeat off: no repeat check ran",
      };
    },
    // F154-FR-027 — the applied path count of the group is not read in this
    // scope yet; the neutral default preserves behaviour.
    appliedPathCountOf: () => 0,
    // F154-FR-028 — with `loop.parallel.mergeBaseline` off, no base result
    // is compared and F142-FR-061 applies unchanged.
    baseResultOfTheInnerSet: () => null,
    // F154-FR-034, -035 — with `loop.parallel.groupCheck` off, no acceptance
    // check runs in the worker tree; the delta goes on to the merge check,
    // `unchecked`, as today (the check runs on the workspace,
    // `micro-layer.ts:552-575`).
    acceptanceCheckOfTheGroup: async (worker) => {
      void worker;
      return { outcome: "unchecked", ruleId: "WC-4" };
    },
    // F154-FR-031 — with `loop.parallel.groupUnits` off, the frozen task
    // groups are no candidates; the `[P]` task stays the unit.
    groupCandidatesOfThePhase: () => [],
    // F154-FR-039…-044 — with `host.limits` off, the host is unbounded: no
    // slot is taken.
    hostSlots: null,
    // F154-FR-041 — no hold record exists while `host.limits` is off.
    holdOfTheAccount: () => null,
    // F154-FR-043 (T024) — the run's temporary root, where `host.limits`
    // made one; `null` (the seam's default) keeps the checks' own temporary
    // directories, as before.
    tempRootOfTheRun: () => ctx.runTempRoot,
    controlRoot: ctx.controlRoot,
    home: ctx.home,
    runId: ctx.runId,
    workspace: ctx.workspace,
    slug: ctx.slug,
    taskListPath: ctx.taskListPath,
    taskTextAtLaunch: ctx.taskTextAtLaunch,
    taskTextOf: (taskId) =>
      ctx.phases
        .flatMap((held) => held.tasks)
        .find((task) => task.id === taskId)?.text ?? taskId,
    // The parallel worker carries a NAMED model only; the bare `dsh` alias
    // selects the harness alone, so the worker takes the run's default
    // model, as `modelsThatProducedPasses` does.
    model: ctx.implementerOfTheRun ?? ctx.model,
    // The base tier of the proposer, as resolved at launch; the engine
    // resolves no tier today, so the worker runs the default tier unless a
    // host sets the escape.
    modelTierOrEffort: process.env.SPECSTRIDE_WORKER_TIER ?? "default",
    containment: ctx.containmentCeiling,
    runToken: ctx.runId,
    timeLimitMs: ctx.ceilingSeconds * 1000,
    enginePid: ctx.enginePid,
    engineStartedAtMs: ctx.engineStartedAtMs,
    registry: ctx.registry,
    guardScriptPath: ctx.guardScriptPath,
    hash: (text) => createHash("sha256").update(text).digest("hex"),
    innerCheckSet:
      ctx.checkCommandOfTheWorkspace(ctx.workspace) !== undefined && ctx.npmPath !== undefined
        ? [
            {
              id: "check",
              kind: "command",
              argv: [ctx.npmPath, "test"],
              phase: ctx.phase,
              timeLimitMs: ctx.checkMin * 60_000,
            },
          ]
        : [],
    emit: ctx.emit,
    say: ctx.say,
    // THE STOP THE GROUP RUNS UNDER (F143-FR-026): the request the `stop`
    // command writes into the inbox, resolved through the layout table from
    // the same control root the run writes; bound to THIS run's token so a
    // stale request for a run that ended cannot stop the group of the run
    // that follows.
    stopRequestPath: ctx.stopRequestPath,
    runTokenHash: ctx.runTokenHash,
    // F154-FR-056 — with the canonical model holding no declared dependency,
    // the default holds: a phase depends on the phase before it, and phase 1
    // depends on nothing.
    phaseDependenciesOf: (queuedPhase) => (queuedPhase > 1 ? [String(queuedPhase - 1)] : []),
    // F154-FR-058, -059 — with `loop.phases.parallel` off, no queue exists
    // and validation stays on the workspace.
    validationQueue: null,
    // F154-FR-062, -066, -067 — with `loop.speculate` off, no speculative
    // unit starts, for no recorded reason (the switch itself is the reason
    // the unit does not exist).
    speculationVerdictAt: () => ({ start: false }),
    onClosed: (closed, counts) => {
      // F154-FR-025 (T021) — the closed group enters the ledger of the
      // attempt, which the next wiring of this attempt reads.
      ctx.closedGroupsOfTheAttempt.push(closed);
      totalsAfterTheGroup(ctx.parallelTotals, closed, counts);
    },
    // The callback of the PARALLEL units' own handoff (feature 143's
    // wiring), NOT the pass handoff of F103-FR-041, which `runPass` writes
    // above.
    onHandoff: () => {},
  };
}
