/**
 * T120 — the sample implementation of EP-12, the quota classifier, outside the
 * core, registered from the test tree (annex A, §A.4, F100-FR-018; annex X,
 * §X.10, F100-FR-222).
 *
 * A declared `failures` map for a fake harness, which §C.13 "Proving test"
 * names. The classifier is pure: no I/O, no clock, no model.
 */
import {
  CLASS_WHEN_UNKNOWN,
  CONFIDENCE_WHEN_UNKNOWN,
  NO_ENTRY_MATCHES,
} from "@specstride/contracts/ep/quota-classifier";
import type {
  AlertLevel,
  Classification,
  ClassifyInput,
  Observation,
  QuotaClass,
} from "@specstride/contracts/ep/quota-classifier";
import type { Implementation } from "../../conformance/frame.ts";

/** The declared map of the fake harness: status code to class. */
export const FAILURES: Readonly<Record<number, QuotaClass>> = Object.freeze({
  401: "auth",
  429: "quota_window",
  500: "overload",
});

export const operations = Object.freeze({
  classify(seen: ClassifyInput): Classification {
    const code = seen.status?.code;
    const declared = code === undefined ? undefined : FAILURES[code];
    if (declared !== undefined) {
      const resets = seen.status?.headers["retry-after"];
      return Object.freeze({
        quotaClass: declared,
        confidence: "status" as const,
        resetsAt: resets === undefined ? null : resets,
        retryable: declared !== "auth",
      });
    }
    if (seen.errorText !== undefined && /context/i.test(seen.errorText)) {
      return Object.freeze({
        quotaClass: "context_window" as QuotaClass,
        confidence: CONFIDENCE_WHEN_UNKNOWN,
        resetsAt: null,
        retryable: false,
      });
    }
    if (
      seen.streamRecord === undefined &&
      seen.status === undefined &&
      seen.errorText === undefined
    ) {
      return NO_ENTRY_MATCHES;
    }
    return Object.freeze({
      quotaClass: CLASS_WHEN_UNKNOWN,
      confidence: CONFIDENCE_WHEN_UNKNOWN,
      resetsAt: null,
      retryable: true,
    });
  },
  observe(observation: Observation): AlertLevel | undefined {
    if (observation.kind === "gauge") {
      if (observation.remaining <= 0) return "critical";
      if (observation.remaining < 10) return "warn";
      return undefined;
    }
    return "info";
  },
});

export const implementation: Implementation = Object.freeze({
  ep: "EP-12",
  pointId: "specstride.quota-classifier/1",
  id: "sample-quota-classifier",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
