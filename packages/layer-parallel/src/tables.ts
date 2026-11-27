/**
 * The rule tables of spec 154 that live in this layer, imported as JSON and
 * exported as constants (T003; F154-FR-003: "Every decision to run work side
 * by side MUST be made by a pure table with a rule id. The table MUST live in
 * core, kernel or the layer; the composition root only wires it").
 *
 * Each file is the byte-identical copy of
 * `specs/154-concurrency-and-parallelism/contracts/rule-tables/` made by T003
 * and pinned by `test/data-154.test.ts`. The rule ids are the members of the
 * plan's rule-id sets:
 *
 * - `INDEPENDENCE_TABLE` — PG-0 to PG-3, independence of two groups of one
 *   phase (F154-FR-032; CQ-154-02 C with (iii)).
 * - `REPEAT_TABLE` — RP-1, RP-2, no restart of a group that failed over
 *   unchanged paths (F154-FR-026; CQ-154-17 A).
 * - `MERGE_CHECK_OUTCOME_TABLE` — MG-1 to MG-3, the outcome of a merge check:
 *   an empty application runs none, a baseline match charges nothing, else
 *   F142-FR-061 stands (F154-FR-027, -028).
 * - `WORKER_CHECK_TABLE` — WC-1 to WC-4, the acceptance check of a group run
 *   in the worker tree (F154-FR-034…-036; CQ-154-04 A).
 */
import independenceTable from "../data-154/independence-table.json" with { type: "json" };
import repeatTable from "../data-154/repeat-table.json" with { type: "json" };
import mergeCheckOutcomeTable from "../data-154/merge-check-outcome-table.json" with { type: "json" };
import workerCheckTable from "../data-154/worker-check-table.json" with { type: "json" };

/** The table files of spec 154 this package owns, as `DATA_FILES` above. */
export const TABLE_FILES_154 = [
  "independence-table.json",
  "repeat-table.json",
  "merge-check-outcome-table.json",
  "worker-check-table.json",
] as const;

export const INDEPENDENCE_TABLE = independenceTable;
export const REPEAT_TABLE = repeatTable;
export const MERGE_CHECK_OUTCOME_TABLE = mergeCheckOutcomeTable;
export const WORKER_CHECK_TABLE = workerCheckTable;

/** Every rule id of the four tables, in table order. */
export const RULE_IDS_154 = [
  "PG-0",
  "PG-1",
  "PG-2",
  "PG-3",
  "RP-1",
  "RP-2",
  "MG-1",
  "MG-2",
  "MG-3",
  "WC-1",
  "WC-2",
  "WC-3",
  "WC-4",
] as const;
