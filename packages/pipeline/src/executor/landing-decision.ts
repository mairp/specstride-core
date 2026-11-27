/**
 * The landing decision LD-1…LD-4 in the pipeline (T125's rule; F154-FR-050,
 * F154-FR-003). The same pure lookup as `@specstride/core`'s
 * `landingDecisionOf`, over this module group's byte-pinned copy of
 * `landing-table.json` (`tables.ts` `LANDING_TABLE`; the package graph does
 * not let L5 import core, so the bytes are pinned by `test/tables-154.test.ts`
 * instead of an import).
 *
 *   LD-1  clean rebase and a green gate            -> fast-forward
 *   LD-2  rebase conflict                          -> park
 *   LD-3  red gate on the rebased tree             -> park
 *   LD-4  a landing record without a fast-forward  -> rebase (resume)
 *
 * Pure: no I/O, no clock, no randomness, no model. The same observation
 * gives the same decision, with its rule id (F154-SC-002, F154-FR-003).
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

/** The minimal shape of a landing record the rule reads. */
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
    landingRecordExists: landingRecord !== null && typeof landingRecord === "object",
    // LD-4 fires on a record WITHOUT a fast-forward; any other reading of
    // the field counts as "no fast-forward yet" (F154-FR-079).
    fastForwarded: landingRecord?.fastForward === true,
    rebaseClean: rebaseClean === true,
    gateGreen: gateGreen === true,
  };
}

/** The landing decision for one observation (LD-1…LD-4; F154-FR-050). */
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
