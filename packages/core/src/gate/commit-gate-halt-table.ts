/**
 * T097/T098 — the halt table of the commit gate as a frozen constant, and the
 * pure decision over it (F152-FR-006; CQ-152-01 A).
 *
 * The table is the one of
 * `specs/152-commit-backpressure/contracts/commit-gate-halt-table.json`
 * (T006). It lives here and not in `packages/contracts/data/`, which the sync
 * script of feature 100 clean-copies from feature 100's own contracts — the
 * same reason the bump table of feature 149 lives in
 * `../ep18/bump-table.ts`.
 *
 * It has the one decision point `commit-gate-halt`, read by the table
 * evaluator of the kernel (annex X §X.3; `specstride.table/1`):
 *
 * - `CGH-1-same-signature` — two consecutive blocked attempts of one phase
 *   with the same signature halt the run blocked on a human with the blocked
 *   reason `commit-gate` (F152-FR-006; CQ-152-01 A: mapped to the existing
 *   non-transient stop reason `max_rejects`, engine exit 2; no new stop
 *   reason);
 * - `CGH-2-go` — the default row: signatures that differ go on, and the
 *   reject limit alone bounds the retries (F152-FR-005). The reject limit is
 *   deliberately NOT a row of this table: the existing reject-limit step of
 *   the order after a rejection keeps deciding that alone.
 *
 * The rule data of a block is versioned and pinned elsewhere
 * (`@specstride/kernel/redactor/commit-gate-rules`); this table decides only
 * RETRY OR HALT, and every decision is recorded with its rule id (Principle
 * XIII).
 */
import { evaluateTable, loadTable, type LoadedTable } from "@specstride/kernel";

/** The id of the table, recorded with every decision. */
export const COMMIT_GATE_HALT_TABLE_ID = "commit-gate.halt" as const;

/** The version of the table, recorded with every decision. */
export const COMMIT_GATE_HALT_TABLE_VERSION = "1.0.0" as const;

/** The one decision point of the table. */
export const COMMIT_GATE_HALT_POINT = "commit-gate-halt" as const;

/** The rule id of the row that halts on a repeated signature. */
export const HALT_RULE = "CGH-1-same-signature" as const;

/** The rule id of the default row, which goes on to the reject limit. */
export const GO_RULE = "CGH-2-go" as const;

/** The two choices of the point. */
export const CHOICES_OF_THE_HALT = ["halt-commit-gate", "go"] as const;
export type ChoiceOfTheHalt = (typeof CHOICES_OF_THE_HALT)[number];

/** The table, in the shape `specstride.table/1` gives (annex X §X.3). */
export type CommitGateHaltTable = {
  readonly schema: string;
  readonly id: string;
  readonly version: string;
  readonly points: {
    readonly "commit-gate-halt": {
      readonly signals: Readonly<Record<string, string>>;
      readonly choices: readonly string[];
    };
  };
  readonly rows: {
    readonly "commit-gate-halt": readonly {
      readonly ruleId: string;
      readonly when?: { readonly op: string; readonly signal?: string; readonly value?: unknown };
      readonly choice: string;
    }[];
  };
};

/** Freeze a value and everything it holds, so that no reader can change the table. */
function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  for (const key of Object.getOwnPropertyNames(value)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}

/**
 * The halt table of the commit gate, frozen through and through. Equal to
 * `specs/152-commit-backpressure/contracts/commit-gate-halt-table.json`
 * (asserted by CT-152-6's case "the table equals its contract", T166).
 */
export const COMMIT_GATE_HALT_TABLE: CommitGateHaltTable = deepFreeze({
  schema: "specstride.table/1",
  id: COMMIT_GATE_HALT_TABLE_ID,
  version: COMMIT_GATE_HALT_TABLE_VERSION,
  points: {
    "commit-gate-halt": {
      signals: { sameSignature: "boolean" },
      choices: CHOICES_OF_THE_HALT,
    },
  },
  rows: {
    "commit-gate-halt": [
      {
        ruleId: HALT_RULE,
        when: { op: "equal", signal: "sameSignature", value: true },
        choice: "halt-commit-gate",
      },
      { ruleId: GO_RULE, choice: "go" },
    ],
  },
} satisfies CommitGateHaltTable);

/**
 * Load the table through the LOAD CHECK of the table evaluator of the kernel
 * (annex X §X.3), the way the bump table is loaded. A table that does not
 * pass the check is invalid at load, never mid-run.
 */
export function loadTheCommitGateHaltTable(table: CommitGateHaltTable = COMMIT_GATE_HALT_TABLE): LoadedTable {
  return loadTable(table as never);
}

/** What the decision carries: the choice, and the rule id that made it. */
export type DecisionAfterABlock = {
  readonly decision: ChoiceOfTheHalt;
  readonly ruleId: string;
  /** The table id and version, recorded with every decision (F100-FR-204). */
  readonly tableId: typeof COMMIT_GATE_HALT_TABLE_ID;
  readonly tableVersion: typeof COMMIT_GATE_HALT_TABLE_VERSION;
};

/**
 * T098 — the pure decision after one blocked attempt: does the run halt on a
 * repeated signature, or does it go on to the reject-limit step?
 *
 * `sameSignature` is true only where the block record of ordinal k−1 of the
 * phase exists and holds the SAME signature as the block just written; where
 * the previous attempt was rejected by the critic (no block record at all) it
 * is false, whatever earlier attempts held (data-model.md E6: only the
 * attempt just before counts).
 */
export function decideAfterABlock(inputs: {
  readonly sameSignature: boolean;
}): DecisionAfterABlock {
  const decision = evaluateTable(loadTheCommitGateHaltTable(), COMMIT_GATE_HALT_POINT, {
    sameSignature: inputs.sameSignature,
  });
  return Object.freeze({
    decision: decision.choice as ChoiceOfTheHalt,
    ruleId: decision.ruleId,
    tableId: COMMIT_GATE_HALT_TABLE_ID,
    tableVersion: COMMIT_GATE_HALT_TABLE_VERSION,
  });
}
