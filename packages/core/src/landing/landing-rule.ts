/**
 * THE LANDING RULE LD-1…LD-4 (T122; F154-FR-050), decided over the PURE
 * TABLE `pipeline.landing` (`LANDING_TABLE` of `tables.ts`, the byte-pinned
 * copy of the spec's rule table; F154-FR-003: the decision is a table with
 * a rule id, living in core — the composition root only wires it).
 *
 *   LD-1  clean rebase and a green gate            -> fast-forward
 *   LD-2  rebase conflict                          -> park
 *   LD-3  red gate on the rebased tree             -> park
 *   LD-4  a landing record without a fast-forward  -> rebase (resume, LD-1)
 *
 * The observation carries the landing record of the stage (null when none
 * was written yet, or when it was unreadable — an incomplete or initial
 * record reads as "no fast-forward yet", F154-FR-079), whether the rebase
 * onto home came back clean, and whether the full gate on the rebased tree
 * is green.
 *
 * Pure: no I/O, no clock, no randomness, no model. The same observation
 * gives the same decision, with its rule id (F154-SC-002). Rows fire in the
 * table's order, so a half-landed record (LD-4) resumes the landing before
 * anything else is decided.
 */

import { evaluateTable, type LoadedTable } from "@specstride/kernel";
import { LANDING_TABLE } from "./tables.ts";

/** The decision point of the landing table. */
export const LANDING_POINT = "pipeline.landing";

/** The choices of the landing table. */
export type LandingChoice = "rebase" | "fast-forward" | "park";

/** The landing decision, with the rule id that decided it. */
export type LandingDecision = {
  readonly choice: LandingChoice;
  readonly ruleId: string;
};

/**
 * The minimal shape of a landing record the rule reads. The rule is
 * resilient: anything without a `fastForward: true` reads as a record
 * without a fast-forward (an initial or half-landed record, LD-4).
 */
export type LandingRecordShape = {
  fastForward?: boolean;
} & Record<string, unknown>;

/** The signals of the table, from one landing observation. */
function signalsOf(
  landingRecord: LandingRecordShape | null,
  rebaseClean: boolean,
  gateGreen: boolean,
): Record<string, unknown> {
  return {
    // A record on disk (an unreadable one counts as absent).
    landingRecordExists: landingRecord !== null && typeof landingRecord === "object",
    // LD-4 fires on a record WITHOUT a fast-forward; any other reading of
    // the field counts as "no fast-forward yet" (F154-FR-079).
    fastForwarded: landingRecord?.fastForward === true,
    rebaseClean: rebaseClean === true,
    gateGreen: gateGreen === true,
  };
}

/**
 * The landing decision for one observation (LD-1…LD-4; F154-FR-050).
 * Total: every observation decides through LD-1's fallthrough row.
 */
export function landingDecisionOf(
  landingRecord: LandingRecordShape | null,
  rebaseClean: boolean,
  gateGreen: boolean,
): LandingDecision {
  const decision = evaluateTable(
    LANDING_TABLE as unknown as LoadedTable,
    LANDING_POINT,
    signalsOf(landingRecord, rebaseClean, gateGreen),
  );
  return Object.freeze({
    choice: decision.choice as LandingChoice,
    ruleId: decision.ruleId,
  });
}
