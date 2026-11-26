/**
 * T118 — the workspace of one stage of a wide stage group (F154-FR-049).
 *
 * For a wide group the pipeline runtime makes, through a port, one worktree
 * of home per stage under the control root, and removes it after the stage
 * lands or is parked. Each stage then runs as one run of its own, with its
 * own lock (the directory lock it holds inside its own workspace,
 * `lockPathOf`), its own process tree and its own runtime root; the pipeline
 * coordinates the stage runs only through files — the record of this module
 * and the stage's landing record (F154-FR-049, T-e).
 *
 * The record is `specstride.stage-workspace/1`
 * (`specs/154-concurrency-and-parallelism/contracts/schemas/stage-workspace.schema.json`,
 * data-model.md D11), written atomically by the pipeline runtime, one per
 * stage of a wide group, with the state `running`, `landed` or `parked`
 * (`parked` carries the existing exit 22 for that stage, F154-FR-052).
 * Nothing here starts a stage: `stage-loop.ts` launches the children
 * (T119); this module only makes, names, marks and removes the workspaces.
 *
 * A worktree that cannot be made or removed is never an error that stops the
 * pipeline (F154-FR-004): a failed `add` leaves no record and reports the
 * stage as not made; a failed `remove` leaves the record's `removedAt` null
 * so that a later run retries the removal.
 */
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { atomicWrite } from "@specstride/kernel";

/** The three states of the record (the schema's closed enum). */
export const STAGE_WORKSPACE_STATES = ["running", "landed", "parked"] as const;
export type StageWorkspaceState = (typeof STAGE_WORKSPACE_STATES)[number];

/** One stage workspace record (`specstride.stage-workspace/1`). */
export type StageWorkspaceRecord = {
  schema: "specstride.stage-workspace/1";
  /** The run of the stage, with its own lock and runtime root. */
  runId: string;
  /** The pipeline run the wide group belongs to. */
  pipelineRunId: string;
  stage: string;
  /** The stages of the wide group, in declared order (the schema: at least 2). */
  group: string[];
  /** The worktree of home the stage runs in, under the control root. */
  workspace: string;
  state: StageWorkspaceState;
  createdAt: string;
  /** The stage's `specstride.landing/1` record, or null before a landing or a park. */
  landingRecord: string | null;
  /** When the workspace was removed; null while the stage runs or removal is pending. */
  removedAt: string | null;
};

/** The worktree port: the pipeline's own git hardening makes and removes the tree (PU-81). */
export type WorktreePort = {
  add(home: string, workspace: string): Promise<void>;
  remove(workspace: string): Promise<void>;
};

/** Where the record of one stage workspace is written, under the control root. */
export function stageWorkspaceRecordPath(controlRoot: string, pipelineRunId: string, stage: string): string {
  return join(controlRoot, "stage-workspaces", pipelineRunId, `${stage}.json`);
}

/** The directory under the control root that holds one wide group's workspaces. */
export function stageWorkspaceDirOf(controlRoot: string, pipelineRunId: string): string {
  return join(controlRoot, "stage-workspaces", pipelineRunId);
}

/** The workspace path of one stage of one wide group (deterministic). */
export function stageWorkspacePath(controlRoot: string, pipelineRunId: string, stage: string): string {
  return join(stageWorkspaceDirOf(controlRoot, pipelineRunId), stage);
}

/**
 * The lock the stage run holds inside its own workspace (F154-FR-049, "one
 * run with its own lock"): a directory lock at this path, made by the
 * runtime's lock provider (feature 122). Two stages of a wide group have two
 * workspaces, so two lock paths; one stage never holds another's lock.
 */
export function lockPathOf(workspace: string): string {
  return join(workspace, ".specstride", "lock");
}

/**
 * Make the workspace of one stage of a wide group: a worktree of `home`
 * through the port, under the control root, and its record written
 * atomically in state `running`. A port that refuses (the worktree cannot be
 * made) leaves no record and returns null — the caller degrades the group to
 * serial with its reason recorded (F154-FR-004).
 */
export async function makeStageWorkspace(input: {
  home: string;
  stage: string;
  /** The stages of the wide group, in declared order. */
  group: readonly string[];
  pipelineRunId: string;
  runId: string;
  controlRoot: string;
  port: WorktreePort;
  /** The clock of the record's stamps; the tests hand a fixed one in. */
  now?: () => Date;
}): Promise<StageWorkspaceRecord | null> {
  const workspace = stageWorkspacePath(input.controlRoot, input.pipelineRunId, input.stage);
  try {
    await input.port.add(input.home, workspace);
  } catch {
    return null; // SL/degrade: the caller records the reason and runs serially
  }
  const record: StageWorkspaceRecord = {
    schema: "specstride.stage-workspace/1",
    runId: input.runId,
    pipelineRunId: input.pipelineRunId,
    stage: input.stage,
    group: [...input.group],
    workspace,
    state: "running",
    createdAt: (input.now ?? (() => new Date()))().toISOString(),
    landingRecord: null,
    removedAt: null,
  };
  writeStageWorkspaceRecord(input.controlRoot, record);
  return record;
}

/**
 * Mark the state of a running workspace: `landed` or `parked`, with the
 * stage's landing record once one exists. Pure: it returns the new record
 * and writes it; it never touches the tree (the removal is
 * `removeStageWorkspace`'s).
 */
export function markStageWorkspace(
  controlRoot: string,
  record: StageWorkspaceRecord,
  state: Extract<StageWorkspaceState, "landed" | "parked">,
  input?: { landingRecord?: string | null; now?: () => Date },
): StageWorkspaceRecord {
  const next: StageWorkspaceRecord = {
    ...record,
    state,
    landingRecord: input?.landingRecord !== undefined ? input.landingRecord : record.landingRecord,
  };
  writeStageWorkspaceRecord(controlRoot, next);
  return next;
}

/**
 * Remove the workspace of a landed or parked stage through the port, and set
 * `removedAt`. A port that refuses leaves `removedAt` null — the record keeps
 * its terminal state, and a later run retries the removal; the removal is
 * never an error that stops the pipeline (F154-FR-004).
 */
export async function removeStageWorkspace(
  controlRoot: string,
  record: StageWorkspaceRecord,
  input: { port: WorktreePort; now?: () => Date },
): Promise<StageWorkspaceRecord> {
  if (record.state === "running") return record; // nothing is removed under a running stage
  try {
    await input.port.remove(record.workspace);
  } catch {
    return record; // removal retried by a later run; the terminal state stands
  }
  const next: StageWorkspaceRecord = {
    ...record,
    removedAt: (input.now ?? (() => new Date()))().toISOString(),
  };
  writeStageWorkspaceRecord(controlRoot, next);
  return next;
}

/** Write the record atomically: sorted keys, indent 2, newline (as `state-record.ts`). */
export function writeStageWorkspaceRecord(controlRoot: string, record: StageWorkspaceRecord): void {
  mkdirSync(join(controlRoot, "stage-workspaces", record.pipelineRunId), { recursive: true });
  atomicWrite(
    stageWorkspaceRecordPath(controlRoot, record.pipelineRunId, record.stage),
    new TextEncoder().encode(`${JSON.stringify(record, sortedKeys, 2)}\n`),
  );
}

/** Read the record back; unreadable content reads as null (the caller re-makes). */
export function readStageWorkspaceRecord(
  controlRoot: string,
  pipelineRunId: string,
  stage: string,
): StageWorkspaceRecord | null {
  let text: string;
  try {
    text = readRecordUtf8(stageWorkspaceRecordPath(controlRoot, pipelineRunId, stage));
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
  if (record.schema !== "specstride.stage-workspace/1") return null;
  if (typeof record.stage !== "string" || typeof record.workspace !== "string") return null;
  return record as unknown as StageWorkspaceRecord;
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

function readRecordUtf8(path: string): string {
  return readFileSync(path, "utf8");
}
