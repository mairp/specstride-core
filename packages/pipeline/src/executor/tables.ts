/**
 * The rule table of spec 154 that lives in this module group, imported as
 * JSON and exported as a constant (T008; F154-FR-003, F154-FR-048). The file
 * is the byte-identical copy of
 * `specs/154-concurrency-and-parallelism/contracts/rule-tables/stage-admission-table.json`
 * and is pinned by `test/tables-154.test.ts`.
 */
import table from "../../data/stage-admission-table.json" with { type: "json" };

export const STAGE_ADMISSION_TABLE = table;

/**
 * The landing rule table of spec 154 (T122; F154-FR-050), imported as JSON
 * and exported as a constant (F154-FR-003: the landing decision is a table
 * with a rule id). The file is the byte-identical copy of the spec's
 * `landing-table.json` — the same bytes `@specstride/core` pins for its own
 * `LANDING_TABLE` — and is pinned by `test/tables-154.test.ts`. The copy
 * exists because the package graph (annex A) does not let L5 import core;
 * the two constants hold the same object, and the pin test holds the bytes.
 */
import landingTable from "../../data/landing-table.json" with { type: "json" };

export const LANDING_TABLE = landingTable;
