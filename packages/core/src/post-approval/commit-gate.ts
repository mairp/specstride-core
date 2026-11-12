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
  readonly scan: (
    files: readonly string[],
    overlay: Record<string, string>,
  ) => CommitGateScanResult;
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
 * T168 — the steps of a block a kill left unfinished (F152-FR-013).
 * ------------------------------------------------------------------ */

/**
 * What of one block's write order is still missing. `complete` where either
 * no block record exists (the attempt re-runs from its start, as any
 * interrupted attempt does) or the feedback and the counts are both present.
 */
export type StepsToCompleteABlock =
  | { readonly complete: true }
  | {
      readonly complete: false;
      /** The ordinal k of the newest block record of the phase. */
      readonly ordinal: number;
      /** The corrective feedback file of ordinal k is missing. */
      readonly writeFeedback: boolean;
      /** The counts of ordinal k are missing. */
      readonly writeCounts: boolean;
    };

/** The counts of one phase, as `stepsToCompleteABlock` reads them. */
export type CountsOfABlock = { readonly phaseAttemptOrdinal: number };

/**
 * T168 — the block record of the newest ordinal k of the phase says what a
 * kill between the writes left undone (F152-FR-013; plan, "Crash and resume
 * design"). The counts of ordinal k are present when the ledger counts of the
 * phase show `phaseAttemptOrdinal` ≥ k — a ledger record carries `phase` and
 * `attemptId` but no ordinal field, so this is how "ordinal k is counted" is
 * read. The corrective feedback rides the feature's own feedback folder, read
 * from the `feature` the block record carries.
 */
export async function stepsToCompleteABlock(
  phase: number,
  ports: {
    readonly readControl: (path: string) => Promise<string | null> | string | null;
    readonly readCounts: () => CountsOfABlock;
  },
): Promise<StepsToCompleteABlock> {
  let ordinal = 0;
  let record: Record<string, unknown> | null = null;
  for (;;) {
    const next = await readBlockRecord(phase, ordinal + 1, ports);
    if (next === null) break;
    ordinal += 1;
    record = next;
  }
  if (record === null) return { complete: true };
  const feature = typeof record.feature === "string" ? record.feature : "";
  const feedbackPath = `features/${feature}/feedback/phase${String(phase)}.${String(ordinal)}.md`;
  const feedback = await awaited(ports.readControl(feedbackPath));
  const countsPresent = ports.readCounts().phaseAttemptOrdinal >= ordinal;
  if (feedback === null && !countsPresent) {
    return { complete: false, ordinal, writeFeedback: true, writeCounts: true };
  }
  if (feedback === null) {
    return { complete: false, ordinal, writeFeedback: true, writeCounts: false };
  }
  if (!countsPresent) {
    return { complete: false, ordinal, writeFeedback: false, writeCounts: true };
  }
  return { complete: true };
}

/* ------------------------------------------------------------------ *
 * US3 — the pre-tick copy, the void marker and the restore (T118–T120;
 * F152-FR-004, F152-FR-014).
 * ------------------------------------------------------------------ */

/**
 * The checkbox syntax of EVERY format (F104-FR-011; B-2021), as
 * `packages/spec-formats/src/model.ts` states it: optional indent, `-`,
 * optional spaces, `[ ]`, `[x]`, `[X]` or `[]`, then the text. The one
 * grammar of the spec-formats package is not imported here — a core package
 * depends only on contracts and kernel — and a core file holds no reader of
 * the grammar either (F104-SC-001, the one-grammar owner), so the line shape
 * is read by hand, character by character, with the same acceptance as the
 * owner's own pattern. Every function below reads a tick line through these
 * two readers and no other shape.
 */

/** The two forms of a task id (F104-FR-010, F104-FR-013): `T001b`, `1.2`. */
const TASK_ID_AT_TEXT_START = /^(?:T\d+[A-Za-z]?|\d+(?:\.\d+)+)\b/;

const IS_SPACE = (character: string | undefined) =>
  character === " " || character === "\t";

/** One line read as a checkbox line, or `undefined` where it is not one. */
function checkboxLineOf(
  line: string,
): { readonly markIndex: number; readonly mark: string; readonly rest: string } | undefined {
  let at = 0;
  while (IS_SPACE(line[at])) at += 1;
  const indentEnds = at;
  if (line[at] !== "-") return undefined;
  at += 1;
  while (IS_SPACE(line[at])) at += 1;
  if (line[at] !== "[") return undefined;
  const markIndex = at + 1;
  const mark = line[markIndex] ?? "";
  if (mark !== "" && mark !== " " && mark !== "x" && mark !== "X") return undefined;
  if (line[markIndex + 1] !== "]") return undefined;
  // indent + "-" + spaces + "[" is everything before the mark: the one
  // byte a tick may change (F104-FR-017). The rest begins after the box.
  if (mark === "" || line.slice(markIndex + 2).trim() === "") return undefined;
  return { mark, markIndex, rest: line.slice(markIndex + 2) };
}

/**
 * The number of the phase a heading opens, or `undefined` where the line is
 * no heading of a phase. The heading forms the grammar owner accepts: one to
 * six `#` marks, whitespace, then the phase named as `Phase 3` or `P3`, in
 * any case, with the number after optional whitespace.
 */
function phaseNumberOf(line: string): number | undefined {
  let at = 0;
  while (line[at] === "#") at += 1;
  if (at === 0 || at > 6) return undefined;
  if (!IS_SPACE(line[at])) return undefined;
  while (IS_SPACE(line[at])) at += 1;
  const word = line.slice(at).toLowerCase();
  let cursor = at;
  if (word.startsWith("phase")) cursor = at + 5;
  else if (word[0] === "p") cursor = at + 1;
  else return undefined;
  while (IS_SPACE(line[cursor])) cursor += 1;
  const digitsBegin = cursor;
  let number = 0;
  while (line[cursor] !== undefined && line[cursor] >= "0" && line[cursor] <= "9") {
    number = number * 10 + (line.charCodeAt(cursor) - 48);
    cursor += 1;
  }
  return cursor === digitsBegin ? undefined : number;
}

/**
 * T119 — true when the two texts differ ONLY in the checked state of the task
 * checkboxes of the phase (F152-FR-004). Compared by line: a difference is
 * allowed only where both lines are task checkbox lines of the phase's own
 * section and nothing but the mark inside the box moved. A human's edit of
 * any other byte is NOT ticks-only, so the pre-tick bytes are never written
 * over it.
 */
export function onlyTicksChanged(preTick: string, now: string, phase: number): boolean {
  const before = preTick.split("\n");
  const after = now.split("\n");
  if (before.length !== after.length) return false;
  let within = false;
  for (let at = 0; at < before.length; at += 1) {
    const left = before[at] as string;
    const right = after[at] as string;
    const heading = phaseNumberOf(left);
    if (heading !== undefined) within = heading === phase;
    if (left === right) continue;
    const leftBox = checkboxLineOf(left);
    const rightBox = checkboxLineOf(right);
    if (!within || leftBox === undefined || rightBox === undefined) return false;
    if (leftBox.markIndex !== rightBox.markIndex) return false;
    if (leftBox.rest !== rightBox.rest) return false;
    if (!TASK_ID_AT_TEXT_START.test(rightBox.rest.trimStart())) return false;
  }
  return true;
}

/** The logical path of the pre-tick copy of one phase's task list. */
export function preTickPath(phase: number): string {
  return `${COMMIT_GATE_DIR}/phase${String(phase)}.pretick.md`;
}

/** The logical path of the void marker of one phase's approval. */
export function voidMarkerPath(phase: number): string {
  return `${COMMIT_GATE_DIR}/phase${String(phase)}.void.json`;
}

/** The ports the pre-tick copy and the void marker read and write through. */
export type PreTickPorts = {
  /** The absolute path of the phase's tasks.md. */
  readonly tasksPath: () => string;
  /** The current bytes of the phase's tasks.md. */
  readonly readTasksText: () => string;
  /** The absolute path of one file of the control plane, by logical name. */
  readonly inControl: (path: string) => string;
  /** Read one file of the control plane, or `null` where it does not exist. */
  readonly readControlText: (file: string) => Promise<string | null> | string | null;
  /** The kernel's atomic write; the mode is copied, as `tickFile` does. */
  readonly writeAtomic: (file: string, text: string, mode: number) => Promise<void> | void;
  /** The mode of one file, masked to what a file may hold. */
  readonly modeOf: (file: string) => number;
  /** Put a mode back that the process umask took something off. */
  readonly chmod: (file: string, mode: number) => void;
};

/**
 * T118 — save the bytes of the phase's task list BEFORE the tick (step 4 of
 * the order after an approval), atomically, with the file mode copied the way
 * `tickFile` copies it (packages/spec-formats/src/tick.ts:238).
 */
export async function savePreTick(phase: number, ports: PreTickPorts): Promise<void> {
  const path = ports.tasksPath();
  const text = ports.readTasksText();
  const mode = ports.modeOf(path) & 0o7777;
  const file = ports.inControl(preTickPath(phase));
  await awaited(ports.writeAtomic(file, text, mode));
  if ((ports.modeOf(file) & 0o7777) !== mode) ports.chmod(file, mode);
}

/**
 * T118 — restore the pre-tick bytes of the phase's task list, atomically,
 * with the mode the copy carries. False where no copy exists (the tick never
 * ran, so there is nothing to restore).
 */
export async function restorePreTick(phase: number, ports: PreTickPorts): Promise<boolean> {
  const copy = ports.inControl(preTickPath(phase));
  const text = await awaited(ports.readControlText(copy));
  if (text === null || text === undefined) return false;
  const mode = ports.modeOf(copy) & 0o7777;
  await awaited(ports.writeAtomic(ports.tasksPath(), text, mode));
  if ((ports.modeOf(ports.tasksPath()) & 0o7777) !== mode) ports.chmod(ports.tasksPath(), mode);
  return true;
}

/** What a void of one approval reports back (T120). */
export type VoidApprovalResult =
  | { readonly halt?: undefined }
  | { readonly halt: "commit-gate"; readonly file: string };

/** The inputs of one void of an approval (T120; data-model.md E4). */
export type VoidApprovalInputs = {
  readonly phase: number;
  readonly verdictId: string;
  readonly ordinal: number;
  readonly path: "step-6" | "resume";
};

/**
 * The ticks of one phase, taken back: every ticked task line of the phase's
 * section loses its mark (F152-FR-014 — a voided approval never leaves the
 * ticks of its attempt standing, so the phase runs again from its first
 * attempt and no tick can pass for approved work). The text, not the file, is
 * the unit: the caller writes it back.
 */
export function untickedTextOf(phase: number, text: string): string {
  const lines = text.split("\n");
  const out = lines.map((line) => {
    const heading = phaseNumberOf(line);
    const within = heading !== undefined && heading === phase;
    if (!within) return line;
    const box = checkboxLineOf(line);
    if (box === undefined || (box.mark !== "x" && box.mark !== "X")) return line;
    return line.slice(0, box.markIndex) + " " + line.slice(box.markIndex + 1);
  });
  if (out.every((line, at) => line === lines[at])) return text;
  return out.join("\n");
}

/**
 * T120 — void one approval (F152-FR-014). Where the task list changed since
 * the tick ONLY in its ticks, the pre-tick bytes go back first; where a human
 * edited anything else, the run halts `commit-gate` naming the file, and the
 * bytes are never overwritten. Then the ticks of the phase go back, and only
 * then is the void marker E4 — the verdictId of the record it voids —
 * written, so the reader of F101-FR-031 never sees a voided record whose
 * ticks still stand.
 */
export async function voidApproval(
  inputs: VoidApprovalInputs,
  ports: PreTickPorts,
): Promise<VoidApprovalResult> {
  const copy = ports.inControl(preTickPath(inputs.phase));
  const preTick = await awaited(ports.readControlText(copy));
  if (preTick !== null && preTick !== undefined) {
    if (!onlyTicksChanged(preTick, ports.readTasksText(), inputs.phase)) {
      return { halt: "commit-gate", file: ports.tasksPath() };
    }
    await restorePreTick(inputs.phase, ports);
  }
  // The ticks of the phase go back, whether the restore brought them or the
  // tick never ran through the engine at all.
  const unticked = untickedTextOf(inputs.phase, ports.readTasksText());
  if (unticked !== ports.readTasksText()) {
    const mode = ports.modeOf(ports.tasksPath()) & 0o7777;
    await awaited(ports.writeAtomic(ports.tasksPath(), unticked, mode));
    if ((ports.modeOf(ports.tasksPath()) & 0o7777) !== mode) ports.chmod(ports.tasksPath(), mode);
  }
  await awaited(
    ports.writeAtomic(
      ports.inControl(voidMarkerPath(inputs.phase)),
      `${JSON.stringify(
        {
          phase: inputs.phase,
          ordinal: inputs.ordinal,
          verdictId: inputs.verdictId,
          path: inputs.path,
          at: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
      0o644,
    ),
  );
  return {};
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
