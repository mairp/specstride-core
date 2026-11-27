/**
 * T013 — the stage loop (F123-FR-009).
 *
 * Stages run in the order of the launch contract. A smoke stage without
 * `--smoke` is skipped. A stage that an earlier launch completed is skipped
 * when its postconditions still hold and rerun when they do not (`[RESUME]`).
 * When the launch contract hash differs from the one in the state record, the
 * state of every stage is reset and the old hash is recorded as
 * `superseded_contract_digest`. The state passes through `preflight`, `ready`,
 * `running` and a terminal value, and the digest of a complete run names the
 * last stage of the launch contract even when it was skipped.
 *
 * The hash (F123-FR-009) is taken over the launch contract without its
 * `inventory`, its generation data and the revision and dirty flag of its
 * repository, with the hash of a task-list source that ignores checkboxes in
 * place of its plain hash — by the canonical hasher of feature 100, annex X
 * §X.5 — so that a tick never resets a stage.
 */
import { canonicalRecordHash } from "@specstride/kernel";
import type { Clock, Stage } from "./types.ts";
import {
  emptyState,
  freshStageEntry,
  readState,
  writeState,
  type PipelineStateRecord,
  type StageEntry,
  type StageStatus,
} from "./state-record.ts";
import type { PreconditionCheckRegistry, EvaluationContext } from "../kinds/registry.ts";
import { evaluatePostconditionFailures } from "../kinds/setup.ts";
import { runWithRetry, type AttemptRunner, type TerminalReader, type RetryLine } from "./retry.ts";
import {
  emitPipelineStarted,
  emitPipelineEnded,
  emitDigestWritten,
  emitSupervisorObserved,
  emitSupervisorRelaunch,
  type EventPort,
  type PipelineEvent,
} from "./events.ts";
import { digestFromEvents } from "../output/digest.ts";
import { exitCodeForState, EXIT_CODES } from "./exit.ts";
import { join } from "node:path";
import {
  lockPathOf,
  makeStageWorkspace,
  markStageWorkspace,
  removeStageWorkspace,
  type WorktreePort,
} from "./stage-workspace.ts";
import {
  landingRecordPath,
  runLandingForStage,
  type LandingApprovalsPort,
  type LandingChecksPort,
  type LandingGitPort,
  type LandingKillpoint,
} from "./landing-run.ts";

/** The keys of the contract the hash leaves out (F123-FR-009). */
export const HASH_EXCLUDED_KEYS = [
  "inventory",
  "generated_by",
  "promotion",
  "status",
  "findings",
] as const;

/**
 * The launch contract hash of F123-FR-009: over the contract without its
 * `inventory`, its generation data and the revision and dirty flag of its
 * repository.
 */
export function launchContractHash(contract: Record<string, unknown>): string {
  const reduced: Record<string, unknown> = {};
  for (const key of Object.keys(contract).sort()) {
    if ((HASH_EXCLUDED_KEYS as readonly string[]).includes(key)) continue;
    if (key === "repository") {
      const repository = contract["repository"] as Record<string, unknown> | undefined;
      reduced["repository"] = {
        root: repository?.["root"],
      };
      continue;
    }
    if (key === "sources") {
      // A task-list source carries the hash that ignores checkboxes in place
      // of its plain hash, so that a tick never resets a stage.
      const sources = Array.isArray(contract["sources"]) ? contract["sources"] : [];
      reduced["sources"] = (sources as Array<Record<string, unknown>>).map((source) =>
        source["kind"] === "task-list"
          ? // A task-list source carries its checkbox-insensitive hash in
            // place of its plain hash, so a tick never resets a stage.
            {
              kind: source["kind"],
              path: source["path"],
              content_hash: source["hash_ignoring_checkboxes"] ?? null,
            }
          : source,
      );
      continue;
    }
    reduced[key] = contract[key];
  }
  return canonicalRecordHash(reduced);
}

/** One stage event the loop reports, in order. */
export type StageLoopLine =
  RetryLine | { label: "[SKIP]"; text: string } | { label: "[RESUME]"; text: string };

/** The result of the loop over the whole contract. */
export type StageLoopResult = {
  state: PipelineStateRecord;
  lines: StageLoopLine[];
  lastStage: string | null;
  completed: boolean;
  stopped: boolean;
  /** The digest of the run, as computed from the events written in the run. */
  digest: string | null;
};

/** Whether a stage is enabled for this launch. */
export function stageEnabled(stage: Stage, smoke: boolean): boolean {
  if (stage.kind === "smoke" && !smoke) return false;
  return true;
}

/** Whether the state of every stage resets because the contract hash changed. */
export function resetNeeded(record: PipelineStateRecord | null, contractHash: string): boolean {
  return record !== null && record.contract_hash !== "" && record.contract_hash !== contractHash;
}

export function freshStages(stages: readonly Stage[]): Record<string, StageEntry> {
  const entries: Record<string, StageEntry> = {};
  for (const stage of stages) entries[stage.id] = freshStageEntry(0);
  return entries;
}

/** The status a finished stage gets from its outcome. */
export function statusOfOutcome(ok: boolean): StageStatus {
  return ok ? "completed" : "failed";
}

/**
 * The stage loop over the ordered stages (F123-FR-009). The executor writes
 * the state record after every transition through the injected `statePath`;
 * the caller supplies the runner, the terminal reader, the checks and the
 * clock, so the loop has a fake-clock test.
 */
export async function runStageLoop(input: {
  pipelineId: string;
  contract: Record<string, unknown>;
  stages: readonly Stage[];
  statePath: string;
  smoke: boolean;
  implement: boolean;
  checks: PreconditionCheckRegistry;
  checkContext: EvaluationContext;
  clock: Clock;
  runner: AttemptRunner;
  readTerminal: TerminalReader;
  /** The event port of the run (F123-FR-018); a run without one still digests. */
  events?: EventPort;
  /** The relaunch budget the root holds; set when the root owns the relaunch. */
  relaunchBudget?: number;
  now?: number;
}): Promise<StageLoopResult> {
  const contractHash = launchContractHash(input.contract);
  const now = input.now ?? input.clock.now();

  // The port of this run: every event also lands in `written`, so the digest
  // can be computed from the events of the run itself (F123-FR-016).
  const upstream = input.events;
  const written: PipelineEvent[] = [];
  const events: EventPort = {
    write(event: PipelineEvent): void {
      upstream?.write(event);
      written.push(event);
    },
  };
  // `pipeline.started`, once per launch (and once per relaunch, `relaunchOf`).
  emitPipelineStarted(events, { pipeline: input.pipelineId, launch: 1, contractHash }, now);

  const finish = (final: PipelineStateRecord, stageId: string): StageLoopResult => {
    const childExit = final.stages[stageId]?.child_exit_code ?? null;
    const terminal = input.readTerminal();
    // The classifier's reading of the terminal run (`supervisor.observed`).
    emitSupervisorObserved(
      events,
      {
        tableId: "relaunch-root",
        ruleId: final.exit_reason ?? final.state,
        choice: final.state,
        signals: {
          runState: final.state,
          stopReason: terminal?.stop_reason ?? null,
          retryable: terminal?.retryable ?? null,
          blocked: terminal?.blocked ?? null,
          childExitCode: childExit,
        },
      },
      input.clock.now(),
    );
    // A retryable stop under an open budget is a relaunch of the root
    // (`supervisor.relaunch`); a completed run and a non-retryable stop are not.
    if (
      final.state !== "completed" &&
      (terminal?.retryable ?? false) &&
      input.relaunchBudget !== undefined &&
      input.relaunchBudget > 0
    ) {
      emitSupervisorRelaunch(
        events,
        {
          attempt: 1,
          maximum: input.relaunchBudget,
          remaining: input.relaunchBudget - 1,
          reason: terminal?.stop_reason ?? final.exit_reason ?? "retryable",
        },
        input.clock.now(),
      );
    }
    emitPipelineEnded(
      events,
      {
        pipeline: input.pipelineId,
        launch: 1,
        state: final.state,
        exit: exitCodeForState(final.state),
        lastStage: final.last_stage,
        childExit,
        evidence: input.pipelineId,
      },
      input.clock.now(),
    );
    const digest = digestFromEvents(written);
    // Exactly one `digest.written` per run, with the digest (F123-FR-018).
    emitDigestWritten(events, { digest }, input.clock.now());
    return {
      state: final,
      lines,
      lastStage: stageId,
      completed: final.state === "completed",
      stopped: final.state === "stopped",
      digest,
    };
  };
  let state: PipelineStateRecord =
    readState(input.statePath) ?? emptyState(input.pipelineId, contractHash, now);
  if (resetNeeded(state, contractHash)) {
    const superseded = state.contract_hash;
    state = emptyState(input.pipelineId, contractHash, now);
    state.superseded_contract_digest = superseded;
  }
  state.stages = { ...freshStages(input.stages), ...pickKnown(state.stages, input.stages) };

  const lines: StageLoopLine[] = [];
  state.state = "preflight";
  state.updated_at = input.clock.now();
  writeState(input.statePath, state);

  state.state = "ready";
  state.updated_at = input.clock.now();
  writeState(input.statePath, state);

  let lastStage: string | null = null;
  let _failed = false;
  let _stopped = false;

  for (const stage of input.stages) {
    lastStage = stage.id;

    // A smoke stage without `--smoke` is skipped.
    if (!stageEnabled(stage, input.smoke)) {
      lines.push({ label: "[SKIP]", text: `${stage.id} smoke stage disabled` });
      state.stages[stage.id] = { ...freshStageEntry(input.clock.now()), status: "skipped" };
      state.updated_at = input.clock.now();
      writeState(input.statePath, state);
      continue;
    }

    // A stage an earlier launch completed: skip when its postconditions hold.
    const previous = state.stages[stage.id];
    if (previous?.status === "completed") {
      const failures = await evaluatePostconditionFailures(stage, input.checks, input.checkContext);
      if (failures.length === 0) {
        lines.push({ label: "[RESUME]", text: `${stage.id} postconditions still hold; skipping` });
        state.updated_at = input.clock.now();
        writeState(input.statePath, state);
        continue;
      }
      lines.push({ label: "[RESUME]", text: `${stage.id} postconditions changed; rerunning` });
    }

    state.stages[stage.id] = {
      ...freshStageEntry(input.clock.now()),
      status: "running",
      started_at: input.clock.now(),
    };
    state.state = "running";
    state.updated_at = input.clock.now();
    writeState(input.statePath, state);

    const recovery = stage.recovery ?? { maxAttempts: 1, exitCodes: [], backoffSeconds: [] };
    const outcome = await runWithRetry({
      stage,
      recovery,
      runner: input.runner,
      clock: input.clock,
      readTerminal: input.readTerminal,
      events,
      pipelineId: input.pipelineId,
      readPostconditionFailures: async () =>
        evaluatePostconditionFailures(stage, input.checks, input.checkContext),
    });
    for (const line of outcome.lines) lines.push(line);

    state.stages[stage.id] = {
      status: statusOfOutcome(outcome.ok),
      started_at: state.stages[stage.id]?.started_at ?? input.clock.now(),
      finished_at: input.clock.now(),
      child_exit_code: outcome.childExitCode,
      reason: outcome.reason,
      evidence: null,
    };
    state.last_stage = stage.id;
    state.updated_at = input.clock.now();

    if (!outcome.ok) {
      // A child exit 6 stops the pipeline; it is never relaunched (F123-FR-013).
      if (outcome.childExitCode === 6) {
        state.state = "stopped";
        _stopped = true;
      } else {
        state.state = "failed";
        _failed = true;
      }
      state.exit_reason = outcome.reason;
      writeState(input.statePath, state);
      return finish(state, stage.id);
    }
    writeState(input.statePath, state);
  }

  state.state = "completed";
  state.exit_reason = "all-stages-complete";
  state.last_stage = lastStage;
  state.updated_at = input.clock.now();
  writeState(input.statePath, state);
  return finish(state, lastStage ?? "");
}

/** Keep the entries of the stages the contract still holds. */
function pickKnown(
  stages: Record<string, StageEntry>,
  contractStages: readonly Stage[],
): Record<string, StageEntry> {
  const out: Record<string, StageEntry> = {};
  for (const stage of contractStages) {
    const entry = stages[stage.id];
    if (entry !== undefined) out[stage.id] = entry;
  }
  return out;
}

/**
 * The landing outcome of one stage of a wide group, through the glue.
 */
export type WideGroupStageLanding = {
  stage: string;
  landed: boolean;
  parked: boolean;
  /** Exit 22 for a parked stage (F154-FR-052); null otherwise. */
  exitCode: number | null;
  /** The landing decision's rule id (LD-1…LD-4), or null when no workspace was made. */
  ruleId: string | null;
  /** The workspace of the stage, or null when it could not be made. */
  workspace: string | null;
  /** The stage's own lock inside its workspace (F154-FR-049). */
  lockPath: string | null;
  /** The stage's own runtime root, under its workspace (F154-FR-049). */
  runtimeRoot: string | null;
};

/** The result of the landing glue over one wide group. */
export type WideGroupLandingResult = {
  /** The stages that landed, in declared order. */
  landed: readonly string[];
  /** The stages that parked (exit 22), in declared order (F154-FR-052). */
  parked: readonly string[];
  /** 22 when any stage parked, 0 otherwise (codes 20 to 24 untouched). */
  exitCode: number;
  stages: readonly WideGroupStageLanding[];
};

/** The inputs of the landing glue over one wide group. */
export type WideGroupLandingInput = {
  controlRoot: string;
  home: string;
  pipelineRunId: string;
  /** The stages of the wide group, in declared order. */
  stages: readonly Stage[];
  ports: {
    worktree: WorktreePort;
    git: LandingGitPort;
    checks: LandingChecksPort;
    approvals: LandingApprovalsPort;
  };
  /** The clock of the records' stamps; the tests hand a fixed one in. */
  now?: () => Date;
  /** Where a test kills the landing of one stage (T124). */
  killpoint?: (stage: string, point: LandingKillpoint) => void;
};

/**
 * The stage-loop glue over one wide group's landing (the minimal form of
 * T119; F154-FR-049, -050…-054). The stages of the group run SEQUENTIALLY
 * for now — wide-group parallelism (each child with its own workspace,
 * lock, process tree and runtime root, coordinated only through the landing
 * records) is T119's remaining work; this glue is the path the parallel
 * launch replaces.
 *
 * Per stage, in declared order: a workspace of its own
 * (`makeStageWorkspace`, F154-FR-049), its own lock path (`lockPathOf`)
 * and its own runtime root under that workspace, then the landing
 * (`runLandingForStage`). A workspace that cannot be made leaves the
 * stage unlanded and the glue goes on (F154-FR-004: degrade, never stop).
 * A parked stage carries exit 22 and the other stages go on (F154-FR-052).
 * A landed or parked workspace is removed; a stage the glue never reaches
 * keeps its workspace `running` — nothing lands during a stop
 * (F154-FR-079).
 */
export async function runWideGroupLandings(
  input: WideGroupLandingInput,
): Promise<WideGroupLandingResult> {
  const group = input.stages.map((stage) => stage.id);
  const out: WideGroupStageLanding[] = [];
  const landed: string[] = [];
  const parked: string[] = [];
  for (const stage of input.stages) {
    const record = await makeStageWorkspace({
      home: input.home,
      stage: stage.id,
      group,
      pipelineRunId: input.pipelineRunId,
      runId: `${input.pipelineRunId}:${stage.id}`,
      controlRoot: input.controlRoot,
      port: input.ports.worktree,
      now: input.now,
    });
    if (record === null) {
      // Degrade, never stop (F154-FR-004): the stage's landing is left to a
      // later run; the glue goes on with the declared order.
      out.push({
        stage: stage.id,
        landed: false,
        parked: false,
        exitCode: null,
        ruleId: null,
        workspace: null,
        lockPath: null,
        runtimeRoot: null,
      });
      continue;
    }
    const outcome = await runLandingForStage({
      controlRoot: input.controlRoot,
      home: input.home,
      workspace: record.workspace,
      pipelineRunId: input.pipelineRunId,
      group,
      stage: stage.id,
      ports: { git: input.ports.git, checks: input.ports.checks, approvals: input.ports.approvals },
      now: input.now,
      killpoint:
        input.killpoint !== undefined ? (point) => input.killpoint?.(stage.id, point) : undefined,
    });
    // The terminal state of the workspace, with its landing record, then the
    // removal (T118: nothing under a running stage is removed).
    const marked = markStageWorkspace(
      input.controlRoot,
      record,
      outcome.parked ? "parked" : "landed",
      {
        landingRecord: landingRecordPath(input.controlRoot, input.pipelineRunId, stage.id),
        now: input.now,
      },
    );
    await removeStageWorkspace(input.controlRoot, marked, {
      port: input.ports.worktree,
      now: input.now,
    });
    if (outcome.parked) parked.push(stage.id);
    else landed.push(stage.id);
    out.push({
      stage: stage.id,
      landed: outcome.landed,
      parked: outcome.parked,
      exitCode: outcome.exitCode,
      ruleId: outcome.ruleId,
      workspace: record.workspace,
      lockPath: lockPathOf(record.workspace),
      runtimeRoot: join(record.workspace, ".specstride", "runtime"),
    });
  }
  return {
    landed,
    parked,
    exitCode: parked.length > 0 ? EXIT_CODES.stageFailed : EXIT_CODES.ok,
    stages: out,
  };
}
