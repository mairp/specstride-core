/**
 * The closed sets of the owners 150 to 152 (the rows of
 * `data/closed-sets.json` whose `owner` starts with a feature number of 150
 * or more). Each is a typed set registered through T070, with its members
 * from `literals` and its unknown-value rule (annex X, §X.6; F100-FR-208).
 *
 * Generated from the data file, so that the sets and the table cannot drift.
 */
import { defineClosedSet } from "./index.ts";

/**
 * Row 286 — Effects of a commit-gate rule.
 *
 * Members: `block`, `exempt`
 * Owner: 152. Closed by: Design.
 * Unknown value: The rule data is refused at load and the launch is refused
 * with exit 3, naming the file (F152-FR-016)
 */
export const effectsOfACommitGateRule = defineClosedSet(286, ["block", "exempt"] as const);
