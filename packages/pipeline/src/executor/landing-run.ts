/**
 * T125–T128 — the landing of one finished stage of a wide stage group
 * (F154-FR-050…-054, F154-FR-079).
 *
 * The landing is, for the next stage in declared order: a rebase onto home
 * with the hardened git port (PU-81), the full verification gate of the
 * stage on the rebased tree through the check runner, and on green a
 * fast-forward of home — and nothing else. A rebase conflict or a red gate
 * parks that stage alone with the existing exit 22: home is unchanged, the
 * other stages go on, and no model is called (F154-FR-052). After the
 * fast-forward the rewrite of every approval commit is noted from the
 * approvals port (`approvalCommitStanding`, whose `rebased` case stands,
 * PR #41) and no critic is called on the rebased tree (F154-FR-053, -054;
 * CQ-154-06 A).
 *
 * Everything is decided by the pure table `pipeline.landing`
 * (`landingDecisionOf`, LD-1…LD-4) over the record on disk and the two
 * observations (the rebase came back clean, the gate is green), so the same
 * inputs give the same decision (F154-FR-003). The record
 * `specstride.landing/1` is written atomically after every step, so a kill
 * at any point leaves a state from which the next run resumes at LD-4 (the
 * record without a fast-forward) and reaches the same end (F154-FR-079).
 *
 * This module touches no process and no model: git, the check runner and
 * the approvals reader come in as ports. The stage-loop glue launches one
 * landing per stage of a wide group; parallelism is T119, after this unit.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { atomicWrite } from "@specstride/kernel";
import { landingDecisionOf, type LandingDecision } from "./landing-decision.ts";
import { EXIT_CODES } from "./exit.ts";

/** The exit code of a parked stage (F154-FR-052: the existing exit 22). */
export const PARKED_STAGE_EXIT_CODE: number = EXIT_CODES.stageFailed;

/** The hardened git port of the landing (PU-81; F154-FR-071). */
export type LandingGitPort = {
  /** Rebase the workspace onto home; `"conflict"` when the rebase conflicts. */
  rebaseOnto(home: string, workspace: string): Promise<"clean" | "conflict">;
  /** Abort a conflicted rebase, so the workspace is left whole. */
  abortRebase(workspace: string): Promise<void>;
  /** Fast-forward home to the workspace's branch (`merge --ff-only`). */
  mergeFastForward(workspace: string, home: string): Promise<void>;
};

/** The check-runner port: the full verification gate of the stage, once. */
export type LandingChecksPort = {
  /** Run the stage's full gate on the rebased tree; green or not. */
  runGate(workspace: string, stage: string): Promise<boolean>;
};

/** One approval commit's standing after the landing, as the note holds it. */
export type ApprovalRewriteEntry = {
  commit: string;
  standing: "ancestor" | "rebased" | "gone";
  /** The equivalent commit of a rewrite (`rebased`), null otherwise. */
  equivalent: string | null;
};

/** The rewrite note of every approval commit of the stage (F154-FR-053). */
export type ApprovalRewriteNote = {
  commits: readonly ApprovalRewriteEntry[];
};

/** The approvals port (`approvalCommitStanding`, PR #41). */
export type LandingApprovalsPort = {
  noteRewriteAfterFastForward(workspace: string, home: string): Promise<ApprovalRewriteNote>;
};

/** The ports of one landing. */
export type LandingPorts = {
  git: LandingGitPort;
  checks: LandingChecksPort;
  approvals: LandingApprovalsPort;
};

/** One landing record (`specstride.landing/1`). */
export type LandingRecord = {
  schema: "specstride.landing/1";
  pipelineRunId: string;
  stage: string;
  /** The stages of the wide group, in declared order. */
  group: readonly string[];
  workspace: string;
  createdAt: string;
  rebaseAt: string | null;
  rebaseClean: boolean | null;
  gateAt: string | null;
  gateGreen: boolean | null;
  fastForwardAt: string | null;
  fastForward: boolean;
  /** The rewrite note of the approval commits, null before a fast-forward. */
  approvalsRewrite: ApprovalRewriteNote | null;
  /** Why the stage parked (`rebase-conflict`, `gate-red`); null when it landed. */
  parkedReason: string | null;
};

/** The outcome of one landing run. */
export type LandingRunOutcome = {
  landed: boolean;
  parked: boolean;
  /** Exit 22 for a parked stage; null when the stage landed or was skipped. */
  exitCode: number | null;
  record: LandingRecord;
  /** The rule id of the last decision of the landing (LD-1…LD-4). */
  ruleId: string;
};

/** The killpoints the tests use (T124): where a kill leaves a resume state. */
export type LandingKillpoint =
  | "after-rebase"
  | "after-gate"
  | "after-fast-forward"
  | "before-record";

/** Where the landing record of one stage is written, under the control root. */
export function landingRecordPath(
  controlRoot: string,
  pipelineRunId: string,
  stage: string,
): string {
  return join(controlRoot, "landing", pipelineRunId, `${stage}.json`);
}

/** Write the record atomically: sorted keys, indent 2, newline. */
export function writeLandingRecord(controlRoot: string, record: LandingRecord): void {
  atomicWrite(landingRecordPath(controlRoot, record.pipelineRunId, record.stage), `${JSON.stringify(record, sortedKeys, 2)}\n`, { createDirectory: true });
}

/** Read the record back; absent or unreadable content reads as null (LD-4). */
export function readLandingRecord(
  controlRoot: string,
  pipelineRunId: string,
  stage: string,
): LandingRecord | null {
  let text: string;
  try {
    text = readFileSync(landingRecordPath(controlRoot, pipelineRunId, stage), "utf8");
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  const record = parsed as Record<string, unknown>;
  if (record.schema !== "specstride.landing/1") return null;
  if (typeof record.stage !== "string") return null;
  return record as unknown as LandingRecord;
}

/** A fresh record for a stage that never landed (its fields fill in as it goes). */
export function freshLandingRecord(input: {
  pipelineRunId: string;
  stage: string;
  group: readonly string[];
  workspace: string;
  createdAt: string;
}): LandingRecord {
  return {
    schema: "specstride.landing/1",
    pipelineRunId: input.pipelineRunId,
    stage: input.stage,
    group: [...input.group],
    workspace: input.workspace,
    createdAt: input.createdAt,
    rebaseAt: null,
    rebaseClean: null,
    gateAt: null,
    gateGreen: null,
    fastForwardAt: null,
    fastForward: false,
    approvalsRewrite: null,
    parkedReason: null,
  };
}

/** The inputs of one landing run. */
export type LandingRunInput = {
  controlRoot: string;
  home: string;
  workspace: string;
  pipelineRunId: string;
  /** The stages of the wide group, in declared order. */
  group: readonly string[];
  stage: string;
  ports: LandingPorts;
  /** The clock of the record's stamps; the tests hand a fixed one in. */
  now?: () => Date;
  /** Where a test kills the landing (T124); absent, the landing runs whole. */
  killpoint?: (point: LandingKillpoint) => void;
};

/**
 * Run the landing of one stage (T125). Idempotent and resumable: a record
 * that already holds a fast-forward skips (the stage landed); a record
 * without one resumes at LD-4 — the rebase (T128). On a conflict or a red
 * gate the stage parks alone with exit 22 and home is untouched (T126);
 * no model is called anywhere (F154-FR-053).
 */
export async function runLandingForStage(input: LandingRunInput): Promise<LandingRunOutcome> {
  const now = input.now ?? (() => new Date());
  const stamp = (): string => now().toISOString();
  const kill = input.killpoint ?? ((): void => undefined);

  // 1) The record on disk; absent or unreadable counts as none (LD-4).
  const existing = readLandingRecord(input.controlRoot, input.pipelineRunId, input.stage);
  const record: LandingRecord =
    existing ??
    freshLandingRecord({
      pipelineRunId: input.pipelineRunId,
      stage: input.stage,
      group: input.group,
      workspace: input.workspace,
      createdAt: stamp(),
    });

  // A fast-forwarded record never resumes: the stage landed (T128).
  if (record.fastForward === true) {
    return { landed: true, parked: false, exitCode: null, record, ruleId: "LD-1" };
  }

  // LD-4 fires here: the record (whatever is on disk) holds no fast-forward,
  // so the landing resumes at the rebase. The resume decision consumes the
  // record; the step decisions below read the two observations alone (a
  // record-less observation: LD-2's conflict and LD-3's red gate decide
  // ahead of LD-1's fallthrough, as the table's rows order them).

  // 2) The rebase onto home (LD-4's action: the record has no fast-forward).
  let decision: LandingDecision;
  const rebase = await input.ports.git.rebaseOnto(input.home, input.workspace);
  if (rebase === "conflict") {
    // The workspace is aborted back to whole; home is untouched.
    await input.ports.git.abortRebase(input.workspace);
  }
  record.rebaseAt = stamp();
  record.rebaseClean = rebase === "clean";
  writeLandingRecord(input.controlRoot, record);
  kill("after-rebase");
  decision = landingDecisionOf(null, record.rebaseClean, true);
  if (decision.choice === "park") {
    // LD-2: park the stage alone; home unchanged, no model called (F154-FR-052).
    record.parkedReason = "rebase-conflict";
    kill("before-record");
    writeLandingRecord(input.controlRoot, record);
    return { landed: false, parked: true, exitCode: PARKED_STAGE_EXIT_CODE, record, ruleId: decision.ruleId };
  }

  // 3) The full gate of the stage on the rebased tree (F154-FR-051).
  const gateGreen = await input.ports.checks.runGate(input.workspace, input.stage);
  record.gateAt = stamp();
  record.gateGreen = gateGreen;
  writeLandingRecord(input.controlRoot, record);
  kill("after-gate");
  decision = landingDecisionOf(null, record.rebaseClean ?? false, gateGreen);
  if (decision.choice === "park") {
    // LD-3: a red gate parks the stage; home unchanged (F154-FR-052).
    record.parkedReason = "gate-red";
    kill("before-record");
    writeLandingRecord(input.controlRoot, record);
    return { landed: false, parked: true, exitCode: PARKED_STAGE_EXIT_CODE, record, ruleId: decision.ruleId };
  }

  // 4) LD-1: fast-forward home, and nothing else (F154-FR-050).
  await input.ports.git.mergeFastForward(input.workspace, input.home);
  record.fastForwardAt = stamp();
  record.fastForward = true;
  kill("after-fast-forward");

  // 5) The rewrite note of the approval commits (F154-FR-053); no critic is
  // called on the rebased tree (F154-FR-054, CQ-154-06 A).
  record.approvalsRewrite = await input.ports.approvals.noteRewriteAfterFastForward(
    input.workspace,
    input.home,
  );
  record.parkedReason = null;
  kill("before-record");
  writeLandingRecord(input.controlRoot, record);
  // LD-1: with the fast-forward on the record, the landing is complete.
  decision = landingDecisionOf(record, record.rebaseClean ?? false, record.gateGreen ?? false); // ff on the record: LD-1
  return { landed: true, parked: false, exitCode: null, record, ruleId: decision.ruleId };
}

/** A replacer that visits object keys in sorted order. */
function sortedKeys(key: string, value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return value;
  const out: Record<string, unknown> = {};
  for (const entry of Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  )) {
    out[entry[0]] = entry[1];
  }
  return out;
}
