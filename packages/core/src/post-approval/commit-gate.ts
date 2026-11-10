/**
 * Phase 2 — the records of the commit gate (F152-FR-013, F152-FR-015,
 * F152-FR-021).
 *
 * When the gate holds an approval commit back, the attempt writes ONE block
 * record per block at the TOP LEVEL of `commit-gate/` in the control plane:
 * `commit-gate/phase<N>.<k>.block.json`, validated against
 * `specstride.commit-gate-block/1`. The facts a later report reads come from
 * those records and from nothing else. A reset of the counts moves every
 * top-level file of the folder into `commit-gate/reset-<at>/`, by rename only,
 * so no evidence is copied or destroyed (F102-FR-033).
 *
 * The module reads the control plane ONLY through its ports; nothing here
 * touches the disk itself.
 */

/** The schema id a block record validates against. */
export const COMMIT_GATE_BLOCK_SCHEMA_ID = "specstride.commit-gate-block/1" as const;

/** The folder of the block records, relative to the control root. */
export const COMMIT_GATE_DIR = "commit-gate" as const;

/** The ports the block records of the commit gate read the control plane through. */
export type CommitGateControlPorts = {
  /** The text of one file, or `null` where the file does not exist. */
  readonly readControl: (path: string) => Promise<string | null> | string | null;
  /** The names of the entries of one folder. */
  readonly listControl: (dir: string) => Promise<readonly string[]> | readonly string[];
  /** Rename one file; never a copy. */
  readonly moveControl: (from: string, to: string) => Promise<void> | void;
  /** Create a folder, with its parents. */
  readonly makeDirectoryControl: (dir: string) => Promise<void> | void;
};

/** The name of the block record of one phase attempt. */
export function blockRecordPath(phase: number, ordinal: number): string {
  return `${COMMIT_GATE_DIR}/phase${String(phase)}.${String(ordinal)}.block.json`;
}

async function awaited<T>(value: Promise<T> | T): Promise<T> {
  return value instanceof Promise ? value : await Promise.resolve(value);
}

/* ------------------------------------------------------------------ *
 * T066–T068 — the gate itself (F152-FR-001, F152-FR-016 to F152-FR-020).
 * ------------------------------------------------------------------ */

import { createHash } from "node:crypto";
import {
  blockingRuleOf,
  type CommitGateRules,
} from "@specstride/kernel/redactor/commit-gate-rules";
import type { MatchKind } from "@specstride/kernel/redactor/scan";

/** One hit the scan port reports. Only the fields the gate reads are typed. */
export type CommitGateScanHit = {
  /** The file the hit came from, as the caller named it. */
  readonly file: string;
  /** The line of the hit; `0` where the line is unknown. */
  readonly line: number;
  /** The NAME of the value pattern that matched, where one did. */
  readonly pattern?: string;
  /** True where the hit is a registered secret. */
  readonly registeredSecret?: boolean;
  /** True where the file could not be read at all. */
  readonly unreadable?: boolean;
};

/** What the scan port answers: the hits, and never the match text. */
export type CommitGateScanResult = {
  readonly hits: readonly CommitGateScanHit[];
};

/**
 * T066 — the ports the gate runs through: one scan over files, with an
 * overlay of texts read in place of the file bytes.
 */
export type CommitGatePorts = {
  /** Scan the given files, reading `overlay[path]` in place of any file text. */
  readonly scan: (files: readonly string[], overlay: Record<string, string>) => CommitGateScanResult;
};

/** The inputs of one run of the gate. */
export type CommitGateInputs = {
  /** Whether the approval commit is made: `on`/`true`, `off`/`false`, or `auto`. */
  readonly commits: "on" | "off" | "auto" | boolean;
  /** Whether the workdir sits inside a git work tree. */
  readonly insideAWorkTree: boolean;
  /** The paths the approval commit would hold. */
  readonly changedPaths: readonly string[];
  /** The path of the phase's tasks.md, scanned with the overlay below. */
  readonly tasksPath: string;
  /** The task list as `tickText` holds it for the phase. */
  readonly tickedTasksText: string;
  /** The rule data in force (the engine's, and the project's where added). */
  readonly rules: CommitGateRules;
};

/** A normalized hit: which rule held the commit back, where. */
export type CommitGateBlockedHit = {
  readonly rule: string;
  readonly file: string;
  readonly line: number;
};

/** What the gate answers: it entered, and whether it held the commit back. */
export type CommitGateResult =
  | { readonly entered: false }
  | { readonly entered: true; readonly blocked: false }
  | {
      readonly entered: true;
      readonly blocked: true;
      readonly hits: readonly CommitGateBlockedHit[];
      readonly signature: string;
    };

/**
 * T067 — the canonical signature of a set of hits: SHA-256 over the sorted,
 * de-duplicated `rule + "\u0000" + file` pairs, hex-encoded. Line numbers are
 * deliberately NOT part of it: the same rule matching the same file twice, on
 * any lines, is one fact.
 */
export function signatureOfHits(hits: readonly CommitGateBlockedHit[]): string {
  const pairs = [...new Set(hits.map((hit) => `${hit.rule}\u0000${hit.file}`))].sort();
  return createHash("sha256").update(pairs.join("\n")).digest("hex");
}

/** The kind of a hit, read off the fields the scan port sets (never its text). */
function kindOf(hit: CommitGateScanHit): MatchKind {
  if (hit.unreadable === true || hit.line === 0) return "unreadable";
  if (hit.registeredSecret === true) return "registered-secret";
  return "pattern";
}

/**
 * T068 — the gate. With the switch on, inside a work tree, and something
 * changed, it scans exactly the changed paths plus the phase's task list (the
 * task list arrives as the overlay, so the scan reads the TICKED text), and
 * holds the commit back where any hit names a blocking rule. The decision
 * reads the rule DATA only, never the match text.
 */
export function commitGate(inputs: CommitGateInputs, ports: CommitGatePorts): CommitGateResult {
  const commitsOff = inputs.commits === "off" || inputs.commits === false;
  if (commitsOff || inputs.insideAWorkTree !== true || inputs.changedPaths.length === 0) {
    return { entered: false };
  }
  const filesToScan = [...new Set([...inputs.changedPaths, inputs.tasksPath])];
  const overlay: Record<string, string> = { [inputs.tasksPath]: inputs.tickedTasksText };
  const { hits } = ports.scan(filesToScan, overlay);
  const blocked: CommitGateBlockedHit[] = [];
  for (const hit of hits) {
    const rule = blockingRuleOf({ matched: kindOf(hit), pattern: hit.pattern }, inputs.rules);
    if (rule !== null) blocked.push({ rule, file: hit.file, line: hit.line });
  }
  if (blocked.length === 0) return { entered: true, blocked: false };
  return { entered: true, blocked: true, hits: blocked, signature: signatureOfHits(blocked) };
}

/**
 * T035 — the block record of one phase attempt, or `null` where the file does
 * not exist. A file that exists and fails to parse or to validate is a FAULT
 * and throws: it is never read as "no block".
 */
export async function readBlockRecord(
  phase: number,
  ordinal: number,
  ports: Pick<CommitGateControlPorts, "readControl">,
): Promise<Record<string, unknown> | null> {
  const text = await awaited(ports.readControl(blockRecordPath(phase, ordinal)));
  if (text === null || text === undefined) return null;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `the block record ${blockRecordPath(phase, ordinal)} is no JSON document: ` +
        `${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const { validate } = await import("@specstride/contracts/records/compile");
  const result = validate<Record<string, unknown>>(COMMIT_GATE_BLOCK_SCHEMA_ID, data);
  if (!result.ok) {
    const first = result.errors[0];
    throw new Error(
      `the block record ${blockRecordPath(phase, ordinal)} fails ` +
        `${COMMIT_GATE_BLOCK_SCHEMA_ID} at \`${first?.path ?? "(record)"}\`: ` +
        `${first?.message ?? "validation failed"}`,
    );
  }
  return result.record;
}

/**
 * T036 — how many block records the TOP LEVEL of `commit-gate/` holds for one
 * phase. For reports only: it decides nothing.
 */
export async function blocksOfThePhase(
  phase: number,
  ports: Pick<CommitGateControlPorts, "listControl">,
): Promise<number> {
  const names = await awaited(ports.listControl(COMMIT_GATE_DIR));
  const pattern = new RegExp(`^phase${String(phase)}\\.\\d+\\.block\\.json$`);
  return names.filter((name) => pattern.test(name)).length;
}

/**
 * T038 — move every file at the top level of `commit-gate/` into
 * `commit-gate/reset-<at>/`, by rename only, filenames preserved. The records
 * of the blocks before a reset of the counts are set aside, not deleted.
 */
export async function setAsideBlockRecords(
  ports: Pick<CommitGateControlPorts, "listControl" | "moveControl" | "makeDirectoryControl">,
  at: string,
): Promise<number> {
  const names = await awaited(ports.listControl(COMMIT_GATE_DIR));
  const target = `${COMMIT_GATE_DIR}/reset-${at}`;
  await awaited(ports.makeDirectoryControl(target));
  for (const name of names) {
    await awaited(ports.moveControl(`${COMMIT_GATE_DIR}/${name}`, `${target}/${name}`));
  }
  return names.length;
}

/**
 * T073 — write the block record of one blocked attempt (F152-FR-013;
 * data-model.md E1) at `commit-gate/phase<N>.<k>.block.json`, atomically,
 * through the kernel's `atomicWrite` port. The record carries the nonce it was
 * given, so that every rendering of the corrective block is the same. The
 * reader (`readBlockRecord`) validates against the schema; the caller builds
 * the record.
 */
export type BlockRecordWritePorts = {
  /** The kernel's atomic write: temporary file, then rename. */
  readonly atomicWrite: (file: string, text: string) => Promise<void> | void;
  /** The absolute path of one file of the control plane, by logical name. */
  readonly inControl: (path: string) => string;
};

export type CommitGateBlockRecord = {
  readonly schema: "specstride.commit-gate-block/1";
  readonly feature: string;
  readonly phase: number;
  readonly ordinal: number;
  readonly runId: string;
  readonly engineStartId: string;
  readonly verdictId: string;
  readonly hits: readonly { readonly rule: string; readonly file: string; readonly line: number }[];
  readonly hitsOmitted: number;
  readonly signature: string;
  readonly ruleDataHash: string;
  readonly nonce: string;
  readonly at: string;
  readonly path: "pre-scan" | "step-6" | "resume";
};

export async function writeBlockRecord(
  record: CommitGateBlockRecord,
  ports: BlockRecordWritePorts,
): Promise<string> {
  const logical = blockRecordPath(record.phase, record.ordinal);
  await awaited(
    ports.atomicWrite(ports.inControl(logical), `${JSON.stringify(record, null, 2)}\n`),
  );
  return logical;
}

/* ------------------------------------------------------------------ *
 * T043 — the switch of F152-FR-021.
 * ------------------------------------------------------------------ */

/** The configuration key of the switch, next to `attempt.tier_bump`. */
export const COMMIT_BACKPRESSURE_KEY = "commit.backpressure" as const;

/** The literals the key takes, as `attempt.tier_bump` takes them. */
const OFF = "off" as const;

/**
 * Whether the commit backpressure is on. The engine reads the option the way
 * it reads `attempt.tier_bump` (the reader of `theBumpIsOn`), with the row's
 * own default turned about: the key not held at all is ON — the default of the
 * key is on (row 134 of annex X §X.7) — and the gate is the fail-closed side.
 * `off` and `false` switch it off, and so does the value the `parity` profile
 * holds under the key, which is the row's annotated off (`off: the approval
 * commit is made with no gate of its own (DV-121)`), read by its head literal.
 */
export function commitBackpressureIsOn(config: Readonly<Record<string, unknown>> = {}): boolean {
  const held = config[COMMIT_BACKPRESSURE_KEY];
  if (held === false) return false;
  if (typeof held === "string" && held.trim().startsWith(OFF)) return false;
  return true;
}
