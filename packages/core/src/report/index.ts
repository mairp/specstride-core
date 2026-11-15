/**
 * T144 — the entry of the module group `report` of feature 153: the pure
 * projection of events into the rows of F153-FR-040, behind
 * `./rows.ts`. The group holds no I/O of its own: `specstride report`
 * (`packages/cli/src/inspect/report.ts`) is the reader that hands it a list
 * of events and prints the rows.
 */
export * from "./rows.ts";
