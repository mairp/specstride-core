/**
 * T137 — the sample implementation of EP-18, the critic strategy and the
 * attempt planner, outside the core, registered from the test tree (annex A,
 * §A.4, F100-FR-018; annex X, §X.10, F100-FR-222).
 *
 * The sample critic strategy that makes TWO calls and the sample attempt
 * planner, both of which §E.1 "Proving test" names. EP-18 is an internal
 * seam (F100-FR-020): it is versioned and tested in the same way, with a
 * conformance suite and a sample, and carries no promise outside the
 * product's repository in Wave 1.
 */
import {
  ATTEMPT_KIND_WHEN_UNKNOWN,
  VERDICTS,
  VERDICT_WHEN_UNKNOWN,
} from "@specstride/contracts/ep/critic-strategy";
import type {
  AttemptHistory,
  AttemptKind,
  CriticCall,
  GateInput,
  Verdict,
  VerdictRecord,
} from "@specstride/contracts/ep/critic-strategy";
import type { Implementation } from "../../conformance/frame.ts";

/** The line from which a verdict is parsed: a full line, exactly one match. */
export const VERDICT_LINE = /^VERDICT:\s*(APPROVED|REJECTED|MALFORMED)\s*$/;

/** The number of calls the sample strategy makes per phase gate. */
export const CALLS_PER_GATE = 2 as const;

/** Parse a verdict from a reply; anything else is MALFORMED (§E.1). */
export function parseVerdict(reply: string): Verdict {
  const matches = reply
    .split("\n")
    .map((line) => VERDICT_LINE.exec(line.trim()))
    .filter((m): m is RegExpExecArray => m !== null);
  if (matches.length !== 1) return VERDICT_WHEN_UNKNOWN;
  const found = matches[0]?.[1];
  return found !== undefined && (VERDICTS as readonly string[]).includes(found)
    ? (found as Verdict)
    : VERDICT_WHEN_UNKNOWN;
}

export const operations = Object.freeze({
  async judge(_input: GateInput, call: CriticCall): Promise<VerdictRecord> {
    // Two calls, as §E.1 "Proving test" asks; each is a fresh session with a
    // nonce of its own, which the engine's call function mints.
    const first = await call("the first call of the sample critic strategy");
    const second = await call("the second call of the sample critic strategy");
    const verdicts = [parseVerdict(first.reply), parseVerdict(second.reply)];
    // A strategy never approves on a MALFORMED reply of any of its calls.
    const verdict: Verdict = verdicts.includes("MALFORMED")
      ? "MALFORMED"
      : verdicts.every((v) => v === "APPROVED")
        ? "APPROVED"
        : "REJECTED";
    return Object.freeze({
      verdictId: "sample-verdict-1",
      verdict,
      unmetCriteria: Object.freeze(verdict === "APPROVED" ? [] : ["the sample criterion"]),
      nonceHash: second.nonceHash,
    });
  },
  next(history: AttemptHistory): AttemptKind {
    if (history.anAcceleratedPhaseAttemptIsDue) return "accelerated";
    if (!history.diagnosisWasMadeForTheNewestSignature && history.verdicts.length > 0) {
      return "diagnosed";
    }
    return ATTEMPT_KIND_WHEN_UNKNOWN;
  },
});

export const implementation: Implementation = Object.freeze({
  ep: "EP-18",
  pointId: "specstride.critic-strategy/1",
  id: "sample-critic-strategy-and-planner",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
