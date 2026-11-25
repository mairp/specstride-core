/**
 * The rule table of spec 154 that lives in this module group, imported as
 * JSON and exported as a constant (T008; F154-FR-003, F154-FR-048). The file
 * is the byte-identical copy of
 * `specs/154-concurrency-and-parallelism/contracts/rule-tables/stage-admission-table.json`
 * and is pinned by `test/tables-154.test.ts`.
 */
import table from "../../data/stage-admission-table.json" with { type: "json" };

export const STAGE_ADMISSION_TABLE = table;
