/**
 * T351 — the commit scan as ONE typed unit (feature 153, F153-FR-026; slice
 * P1d; CQ-153-06 answered A on 2026-11-13).
 *
 * The engine's scan lived as a closure inside the composition root
 * (`run-feature.ts`, `scanBeforeTheCommit`), so no second caller — the
 * pre-critic step of F153-FR-024, the commit-time step, the in-pass command
 * of F153-FR-027 — could reach it, and a second implementation could
 * disagree with the gate it advises on. This module lifts the DECIDING steps
 * of that closure into one pure unit: one result for one tree and one pinned
 * rule set.
 *
 * What the unit decides (the steps of the closure, as they ran):
 *
 *  1. keep the files that exist on the tree (`exists` port);
 *  2. scan the present files through the scan port (the one ingress's
 *     `scanCommit`, whose rule data is pinned at launch — F152-FR-016, -017);
 *  3. read the lines the commit adds (`addedLines` port), and drop every hit
 *     that is ordinary code (the pattern `key-name-then-value`) or that sits
 *     on a line HEAD already holds (`lineIsAdded` port — the gate judges
 *     what the commit brings, not what HEAD holds).
 *
 * What the unit does NOT do: no counter, no `say` line, no record, no
 * decision for the run. Those stay with the caller (the composition root
 * keeps its two counters and its console line — T352), because a decision
 * reads control-plane records, never a closure's memory (Principle I), and
 * the in-pass command's result is advice only (F153-FR-027).
 *
 * The result carries no match text and no file content: a hit names the rule
 * (`pattern` is a NAME) and never the value that matched — the shape
 * `CommitGateScanResult` of the F152 gate unit already types, which this
 * result satisfies (T350).
 */

import type { CommitGateScanResult } from "../post-approval/commit-gate.ts";

/** The value pattern whose hits are ordinary code, not secrets (commit-lines era). */
export const ORDINARY_CODE_PATTERN = "key-name-then-value";

/** The added line numbers (1-based) of each tracked file; absent: the whole file is new. */
export type AddedLines = ReadonlyMap<string, ReadonlySet<number>>;

/** The fields of a hit the added-line port reads. */
export type HitOnALine = {
  readonly file: string;
  readonly line: number;
};

/** What the scan port answers: the ingress's own scan result, as it stands. */
export type CommitScanPortResult = CommitGateScanResult & {
  /** Whether the raw scan (before the added-line and ordinary-code drops) blocked. */
  readonly blocked?: boolean;
  /** The files that were hit, in the order the caller gave them. */
  readonly files?: readonly string[];
  /** The count of hits of each file of `files`, aligned with it. */
  readonly counts?: readonly number[];
};

/** The ports the unit runs through: the tree, the pinned scan, the diff. */
export type CommitScanOfPorts = {
  /** Whether the file exists on the tree (a deleted candidate is not scanned). */
  readonly exists: (file: string) => boolean;
  /** Scan the given files — the one scan of the pinned rule data (F152-FR-016, -017). */
  readonly scan: (files: readonly string[]) => CommitScanPortResult;
  /** The lines each file adds against HEAD (the caller's `addedLinesAgainstHead`). */
  readonly addedLines: (files: readonly string[]) => AddedLines;
  /** Whether a hit sits on a line the commit adds (the caller's `isAddedLine`). */
  readonly lineIsAdded: (added: AddedLines, hit: HitOnALine) => boolean;
};

/** The inputs of one scan of one tree. */
export type CommitScanOfInput = {
  /** The candidate files, as the caller names them (relative to the root). */
  readonly files: readonly string[];
  /** The pattern whose hits are ordinary code; the default `ORDINARY_CODE_PATTERN`. */
  readonly ordinaryCodePattern?: string;
};

/** What the unit answers: the gate's own result shape, with the deciding fields. */
export type CommitScanOfResult = CommitGateScanResult & {
  /** True where at least one deciding hit stands: the gate holds the commit back. */
  readonly blocked: boolean;
  /** The files that were hit, in the order the caller gave them. */
  readonly files: readonly string[];
  /** The count of hits of each file of `files`, aligned with it. */
  readonly counts: readonly number[];
};

/**
 * One scan of one tree with one pinned rule set (F153-FR-026). The same
 * files, the same rule data and the same ports give the same result on every
 * call — no counter, no clock, no `say` — which is what CT-153-26 (T350)
 * pins.
 */
export function commitScanOf(
  input: CommitScanOfInput,
  ports: CommitScanOfPorts,
): CommitScanOfResult {
  const present = input.files.filter((file) => ports.exists(file));
  const found = ports.scan(present);
  // A line HEAD already holds is not the commit's to answer for (commit-lines.ts).
  const added = ports.addedLines(present);
  const ordinary = input.ordinaryCodePattern ?? ORDINARY_CODE_PATTERN;
  const hits = found.hits.filter(
    (hit) => hit.pattern !== ordinary && ports.lineIsAdded(added, hit),
  );
  const blocked = hits.length > 0;
  return {
    ...found,
    hits,
    blocked,
    files: found.files ?? [],
    counts: found.counts ?? [],
  };
}
