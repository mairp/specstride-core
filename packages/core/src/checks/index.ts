/**
 * The module group `checks` of feature 153: the scoped in-pass selection of
 * the inner check set (F153-FR-045 to F153-FR-047).
 *
 * | Module | Task | Requirement |
 * |---|---|---|
 * | `selection.ts` | T275 to T278 | F153-FR-045, -046, -047 |
 * | `index.ts` | T279 | — (the entry of the group) |
 *
 * The group holds no I/O of its own: the graph arrives as data (F153-FR-045).
 */
export * from "./selection.ts";
