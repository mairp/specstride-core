/**
 * THE SPECULATION RULE SP-1…SP-6 (T142; F154-FR-061…-067), decided over the
 * PURE TABLE `loop.speculation` (`SPECULATION_TABLE` of `tables.ts`, the
 * byte-pinned copy of the spec's rule table; F154-FR-003: every decision to
 * run work side by side is a pure table with a rule id, living in core —
 * the composition root only wires it).
 *
 *   SP-1  rate at or above the minimum and depth below the bound -> start
 *   SP-2  rate below `loop.speculate.minRate`                    -> skip `rate`
 *   SP-3  depth at `loop.speculate.depth`                        -> skip `depth`
 *   SP-4  the sweep cannot be confirmed                          -> skip `sweep`
 *   SP-5  the verdict approves                                   -> integrate
 *   SP-6  the verdict rejects                                    -> set aside
 *
 * One table serves BOTH decisions of a speculative unit. A unit that has no
 * verdict yet is asked with the verdict `open`: SP-5 and SP-6 cannot fire,
 * and the admission guards decide — start, or the refusal reason `rate`,
 * `depth` or `sweep` (F154-FR-062, -066, -067). A unit that has a verdict is
 * asked again with `approved` or `rejected`: it integrates like a group
 * (F154-FR-063) or is set aside at no counter (F154-FR-064).
 *
 * The measured runs never start a unit at the defaults: 29 of 336 and 10 of
 * 121 approvals sit far below `loop.speculate.minRate` = 50 over a window of
 * 20 attempts (R-M11; F154-SC-013), so the switch stays off by design until
 * a trial shows otherwise. The rule is the same under any values (CQ-154-18).
 *
 * Pure: no I/O, no clock, no randomness, no model. The same observation
 * gives the same decision, with its rule id (F154-SC-002, -006).
 */

import { evaluateTable, type LoadedTable } from "@specstride/kernel";
import { SPECULATION_TABLE } from "./tables.ts";

/** The decision point of the speculation table. */
export const SPECULATION_POINT = "loop.speculation";

/** The default depth of `loop.speculate.depth` (CQ-154-18 A). */
export const SPECULATE_DEPTH_DEFAULT = 1;
/** The default window of `loop.speculate.window`, in attempts (CQ-154-18 A). */
export const SPECULATE_WINDOW_DEFAULT = 20;
/** The default threshold of `loop.speculate.minRate`, in per cent (CQ-154-18 A). */
export const SPECULATE_MIN_RATE_DEFAULT = 50;

/** The verdict a speculative unit is asked with. */
export type SpeculationVerdict = "open" | "approved" | "rejected";

/** The choices of the speculation table. */
export type SpeculationChoice =
  "start" | "skip-rate" | "skip-depth" | "skip-sweep" | "integrate" | "set-aside";

/** The decision of the speculation table, with the rule id that decided it. */
export type SpeculationDecision = {
  readonly choice: SpeculationChoice;
  readonly ruleId: string;
};

/** The observation the table decides over (F154-FR-062, -066, -067). */
export type SpeculationObservation = {
  /**
   * The approvals per attempt started of the run, over the last
   * `loop.speculate.window` attempts, in per cent (F154-FR-066).
   */
  readonly ratePerCent: number;
  /** The speculative units already started of the run (the depth in force). */
  readonly depth: number;
  /**
   * Whether the sweep before a critic-class call confirmed that every tree
   * outside a confirmed read denial is gone, or the critic has no tools
   * (F154-FR-067; the amended F142-FR-070). A unit asked with a verdict
   * (`approved`/`rejected`) reads `true`: the sweep was confirmed when it
   * started.
   */
  readonly sweepConfirmed: boolean;
  /** The open verdict (`open`) or the verdict that landed. */
  readonly verdict: SpeculationVerdict;
  /** `loop.speculate.minRate` in force (per cent). Default 50 (CQ-154-18 A). */
  readonly minRatePerCent?: number;
  /** `loop.speculate.depth` in force. Default 1 (CQ-154-18 A). */
  readonly maxDepth?: number;
};

/** The signals of the table, from one observation. */
function signalsOf(observation: SpeculationObservation): Record<string, unknown> {
  const minRate =
    observation.minRatePerCent === undefined
      ? SPECULATE_MIN_RATE_DEFAULT
      : observation.minRatePerCent;
  const maxDepth =
    observation.maxDepth === undefined ? SPECULATE_DEPTH_DEFAULT : observation.maxDepth;
  return {
    verdict: observation.verdict,
    rateAtOrAboveMin: observation.ratePerCent >= minRate,
    depthBelowBound: observation.depth < maxDepth,
    sweepConfirmed: observation.sweepConfirmed === true,
  };
}

/**
 * The speculation decision for ONE observation (SP-1…SP-6). Total: SP-1 is
 * the fallthrough row. Rows fire in the table's order, so a verdict
 * (`approved`/`rejected`) decides before any admission guard is read.
 */
export function speculationVerdictOf(observation: SpeculationObservation): SpeculationDecision {
  const decision = evaluateTable(
    SPECULATION_TABLE as unknown as LoadedTable,
    SPECULATION_POINT,
    signalsOf(observation),
  );
  return Object.freeze({
    choice: decision.choice as SpeculationChoice,
    ruleId: decision.ruleId,
  });
}

/**
 * The refusal reason of a unit that does not start, from the table's skip
 * choices — the closed set of "Reasons a speculative unit does not start"
 * (`rate`, `depth`, `sweep`; F154-FR-002: no exit code, no stop reason).
 */
export function refusalReasonOf(
  decision: SpeculationDecision,
): "rate" | "depth" | "sweep" | undefined {
  switch (decision.choice) {
    case "skip-rate":
      return "rate";
    case "skip-depth":
      return "depth";
    case "skip-sweep":
      return "sweep";
    default:
      return undefined;
  }
}

/**
 * The approval rate over the last `window` attempts (F154-FR-066), in per
 * cent: the approvals over the attempts started of the run, counted over the
 * LAST `window` attempts. A window of 0 attempts reads as 0 — no window is
 * no measured rate, and SP-2 refuses. The caller reads the counts from the
 * ledger; this is the arithmetic, not the reading.
 */
export function approvalRateOverWindowOf(approvals: number, attemptsStarted: number): number {
  if (!Number.isFinite(approvals) || !Number.isFinite(attemptsStarted) || attemptsStarted <= 0) {
    return 0;
  }
  return (Math.max(0, approvals) / attemptsStarted) * 100;
}
