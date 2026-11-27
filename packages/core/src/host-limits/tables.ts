/**
 * The rule table of spec 154 that lives in this module group, imported as
 * JSON and exported as a constant (T005/T006; F154-FR-003: every decision to
 * run work side by side is made by a pure table with a rule id, living in
 * core; the composition root only wires it).
 *
 * The file is the byte-identical copy of
 * `specs/154-concurrency-and-parallelism/contracts/rule-tables/slot-admission-table.json` and is
 * pinned by `test/tables-154.test.ts` (T007).
 */
import table from "../../data/slot-admission-table.json" with { type: "json" };

export const SLOT_ADMISSION_TABLE = table;
