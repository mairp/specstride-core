/**
 * T029 of feature 149 — the SAMPLE ATTEMPT PLANNER of the seam
 * `specstride.attempt-planner/1`
 * (`specs/149-attempt-planner-and-seams/contracts/ep18-seams.md`; F149-FR-010).
 *
 * Two samples, because the seam takes two forms of a planner and an author must
 * see both (PROGRESS.md of this feature, decision 1 of phase 5):
 *
 *  - `sampleAttemptPlanner` carries `next` AND `plan`. `next` is the operation
 *    feature 100's annex E §E.1 names and the registry requires; `plan` is this
 *    seam's wider form, which can also carry a model tier, a decision record
 *    and events;
 *  - `sampleNextOnlyPlanner` carries `next` alone, which is all the registry
 *    requires. The seam calls it through `next`.
 *
 * Both are PURE functions of what they are handed: no I/O, no clock, no model,
 * no count is changed, nothing outside the input is read and nothing at all is
 * written (`ep18-seams.md`, "Guarantees of a planner"). That is what makes the
 * two of them a sample: an author who keeps to this shape needs no change of
 * the loop.
 */
import type { AttemptHistory, AttemptKind } from "@specstride/contracts/ep/critic-strategy";
import { ATTEMPT_KINDS, ATTEMPT_KIND_WHEN_UNKNOWN } from "@specstride/contracts/ep/critic-strategy";
import type { Implementation } from "../../conformance/frame.ts";

/** The id the sample with both forms registers under. */
export const SAMPLE_ATTEMPT_PLANNER_ID = "sample-planner" as const;

/** The id the sample with `next` alone registers under. */
export const SAMPLE_NEXT_ONLY_PLANNER_ID = "sample-planner-next-only" as const;

/** The id of the point both samples implement (`ep18-seams.md`). */
export const ATTEMPT_PLANNER_POINT_ID = "specstride.attempt-planner/1" as const;

/**
 * The two facts of the recovery cycle a planner reads and never works out again
 * (`ep18-seams.md`, "Input"; data-model.md, fields `diagnosisMade` and
 * `accelerationDue`). The engine puts them into the history.
 */
export const FACTS_THE_SAMPLE_PLANNER_READS = [
  "diagnosisWasMadeForTheNewestSignature",
  "anAcceleratedPhaseAttemptIsDue",
] as const;

/**
 * The part of the input of ONE planner that the sample reads. It is written as
 * the least the sample needs, so that the sample stays a reader of the seam's
 * input and never of the core's own history type.
 */
export type SamplePlannerInput = {
  readonly attemptHistory: AttemptHistory;
};

/** What a planner of the wider form gives back. The sample gives the kind only. */
export type SamplePlannerContribution = {
  readonly kind: AttemptKind;
};

/**
 * The kind of the next phase attempt out of the two facts. An accelerated phase
 * attempt follows a diagnosis, so acceleration is read first; where neither
 * fact holds, the kind is `plain`, which is also the failure path and the
 * unknown value of the seam.
 */
export function sampleKindOf(history: AttemptHistory): AttemptKind {
  if (history.anAcceleratedPhaseAttemptIsDue === true) return "accelerated";
  if (history.diagnosisWasMadeForTheNewestSignature === true) return "diagnosed";
  return ATTEMPT_KIND_WHEN_UNKNOWN;
}

/** True for a member of the closed set of row 9 of annex X §X.6. */
export function isAnAttemptKind(value: unknown): value is AttemptKind {
  return typeof value === "string" && (ATTEMPT_KINDS as readonly string[]).includes(value);
}

/**
 * The sample planner in the wider form of this seam: `next` for the registry
 * and `plan` for the seam. Both read the same two facts, so the two answers can
 * never disagree.
 */
export const sampleAttemptPlanner = Object.freeze({
  next(history: AttemptHistory): AttemptKind {
    return sampleKindOf(history);
  },
  plan(input: SamplePlannerInput): SamplePlannerContribution {
    return Object.freeze({ kind: sampleKindOf(input.attemptHistory) });
  },
});

/**
 * The sample planner with `next` alone: the smallest planner the registry
 * accepts. An author who needs no model tier and no decision record writes this
 * much and nothing more.
 */
export const sampleNextOnlyPlanner = Object.freeze({
  next(history: AttemptHistory): AttemptKind {
    return sampleKindOf(history);
  },
});

/** The sample with both forms, as the registry of the frame takes it. */
export const implementation: Implementation = Object.freeze({
  ep: "EP-18",
  pointId: ATTEMPT_PLANNER_POINT_ID,
  id: SAMPLE_ATTEMPT_PLANNER_ID,
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations: Object.freeze({ next: sampleAttemptPlanner.next }),
});

/** The sample with `next` alone, as the registry of the frame takes it. */
export const nextOnlyImplementation: Implementation = Object.freeze({
  ep: "EP-18",
  pointId: ATTEMPT_PLANNER_POINT_ID,
  id: SAMPLE_NEXT_ONLY_PLANNER_ID,
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations: Object.freeze({ next: sampleNextOnlyPlanner.next }),
});
