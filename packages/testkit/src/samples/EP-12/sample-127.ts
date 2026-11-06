/**
 * T082 of feature 127 — the sample classifier of EP-12 whose limit signal is
 * DECLARED AS DATA, outside the core, in the test tree (F127-SC-011,
 * F127-FR-008; annex A §A.4, F100-FR-018).
 *
 * The goal of user story 5 is that "any harness can pause a run by data
 * alone". This sample is the proof of it. It holds no knowledge of any
 * harness: everything it decides it reads from two files of the test tree,
 *
 *  - `fake-harness.descriptor.json`: a harness descriptor of §C.2 whose
 *    `failures` map declares the limit signal — a stream record, statuses,
 *    body patterns and an exit code, each with the class of §Q.1 it refines
 *    into and where the reset time is read from;
 *  - `sample-127-rules.json`: the product's own rules of §Q.1 and §Q.2 — the
 *    confidence order, the reset-source order, `retryable` per class and the
 *    thresholds of `observe`.
 *
 * It therefore tests NO harness name (F127-FR-008, "No shared code MUST test
 * a harness name"), uses no regular expression, and is pure: no I/O, no clock
 * and no model inside `classify` or `observe` (§C.13, IS_PURE). The two files
 * are read once, at load, and the descriptor is validated against the schema
 * of §C.2 while it is read, so a descriptor that §C.2 refuses can never reach
 * the classifier.
 *
 * It lives in the test tree only: no core file names it, which is what the
 * removal witness of T082 shows.
 */
import {
  ALERT_LEVELS,
  CLASSES,
  CONFIDENCES,
  NO_ENTRY_MATCHES,
} from "@specstride/contracts/ep/quota-classifier";
import type {
  AlertLevel,
  Classification,
  ClassifyInput,
  Confidence,
  Observation,
  QuotaClass,
} from "@specstride/contracts/ep/quota-classifier";
import { readHarnessDescriptor } from "@specstride/contracts/records/harness-descriptor";
import type { Implementation } from "../../conformance/frame.ts";
import descriptorData from "./fake-harness.descriptor.json" with { type: "json" };
import rulesData from "./sample-127-rules.json" with { type: "json" };

/* ------------------------------------------------------------------ *
 * 1. The two data files, read once and validated at load.
 * ------------------------------------------------------------------ */

/** The paths of the two files this sample is made of, for the report. */
export const DATA_FILES = Object.freeze([
  "packages/testkit/src/samples/EP-12/fake-harness.descriptor.json",
  "packages/testkit/src/samples/EP-12/sample-127-rules.json",
]);

/**
 * The fake-harness descriptor, validated against `specstride.harness/1:descriptor`
 * as it is read (F100-FR-084). A refusal throws here, at load.
 */
export const DESCRIPTOR = readHarnessDescriptor(descriptorData);

/** Where the reset time of a rule may be read from, in the order of §Q.2. */
export type DeclaredResetSource = {
  readonly source: "structured" | "header" | "parsed_text";
  readonly from: string;
  readonly field?: string;
  readonly after?: string;
};

/** One declared rule of the `failures` map: the signal, and what it means. */
export type DeclaredRule = {
  readonly id: string;
  readonly confidence: string;
  readonly refinesTo: string;
  readonly statuses?: readonly number[];
  readonly bodyPatterns?: readonly string[];
  readonly exitCodes?: readonly number[];
  readonly streamRecords?: readonly { readonly field: string; readonly equals: unknown }[];
  readonly resetsAtFrom?: readonly DeclaredResetSource[];
};

/** The rules of the sample, as `sample-127-rules.json` declares them. */
export const RULES = rulesData as {
  readonly confidenceOrder: readonly string[];
  readonly resetSourceOrder: readonly string[];
  readonly retryableOfClass: Readonly<Record<string, boolean>>;
  readonly classWhenNothingMatches: string;
  readonly confidenceWhenNothingMatches: string;
  readonly observe: {
    readonly gauge: readonly {
      readonly atMost?: number;
      readonly below?: number;
      readonly level: string;
    }[];
    readonly hostFact: string;
  };
};

/**
 * The declared rules of the descriptor, flattened and kept in the order the
 * two files give: the typed failures of §C.1 sorted by name, and inside each
 * the rules in the order they are declared. The order is only a tie-breaker;
 * the confidence order of §Q.2 decides which rule wins.
 */
export const DECLARED_RULES: readonly (DeclaredRule & { readonly failure: string })[] =
  Object.freeze(
    Object.keys(DESCRIPTOR.failures)
      .sort()
      .flatMap((failure) => {
        const entry = DESCRIPTOR.failures[failure] as { rules?: readonly DeclaredRule[] };
        return (entry.rules ?? []).map((rule) => Object.freeze({ ...rule, failure }));
      }),
  );

/** The one entry of the map that declares a limit signal, by its failure name. */
export const LIMIT_SIGNAL_IS_DECLARED_FOR = "quota_exhausted" as const;

/** True when the declared map carries a limit signal at all (F127-FR-008). */
export const DECLARES_A_LIMIT_SIGNAL = Object.prototype.hasOwnProperty.call(
  DESCRIPTOR.failures,
  LIMIT_SIGNAL_IS_DECLARED_FOR,
);

/* ------------------------------------------------------------------ *
 * 2. Reading a declared rule: pure, and free of regular expressions.
 * ------------------------------------------------------------------ */

/** The rank of a confidence in the order of §Q.2; lower wins. */
function rankOf(confidence: string): number {
  const at = RULES.confidenceOrder.indexOf(confidence);
  return at < 0 ? RULES.confidenceOrder.length : at;
}

/** A field of a record, by name, without a path language. */
function fieldOf(record: unknown, field: string): unknown {
  if (typeof record !== "object" || record === null) return undefined;
  return (record as Record<string, unknown>)[field];
}

/** True when the declared rule matches what the harness adapter saw. */
export function ruleMatches(rule: DeclaredRule, seen: ClassifyInput): boolean {
  for (const declared of rule.streamRecords ?? []) {
    if (fieldOf(seen.streamRecord, declared.field) === declared.equals) return true;
  }
  const code = seen.status?.code;
  if (code !== undefined && (rule.statuses ?? []).includes(code)) return true;
  if (seen.exitCode !== undefined && (rule.exitCodes ?? []).includes(seen.exitCode)) return true;
  const text = seen.errorText;
  if (text !== undefined) {
    const lowered = text.toLowerCase();
    for (const pattern of rule.bodyPatterns ?? []) {
      if (lowered.includes(pattern.toLowerCase())) return true;
    }
  }
  return false;
}

/**
 * The reset time of a matched rule, in the order of §Q.2: a structured field
 * first, then a header, and a time read from text only where neither exists.
 */
export function resetsAtOf(
  rule: DeclaredRule,
  seen: ClassifyInput,
): { readonly resetsAt: string | null; readonly source: string | null } {
  for (const wanted of RULES.resetSourceOrder) {
    for (const declared of rule.resetsAtFrom ?? []) {
      if (declared.source !== wanted) continue;
      const value = readDeclaredReset(declared, seen);
      if (value !== null) return { resetsAt: value, source: declared.source };
    }
  }
  return { resetsAt: null, source: null };
}

function readDeclaredReset(declared: DeclaredResetSource, seen: ClassifyInput): string | null {
  if (declared.from === "streamRecord" && declared.field !== undefined) {
    const value = fieldOf(seen.streamRecord, declared.field);
    return typeof value === "string" ? value : null;
  }
  if (declared.from === "statusHeader" && declared.field !== undefined) {
    const value = seen.status?.headers[declared.field];
    return typeof value === "string" ? value : null;
  }
  if (declared.from === "errorText" && declared.after !== undefined) {
    const text = seen.errorText;
    if (text === undefined) return null;
    const at = text.toLowerCase().indexOf(declared.after.toLowerCase());
    if (at < 0) return null;
    const rest = text.slice(at + declared.after.length).trim();
    const token = rest.split(" ")[0];
    return token === undefined || token === "" ? null : token;
  }
  return null;
}

/** A class the sample read from data, through the unknown-value rule of row 46. */
function classOf(declared: string): QuotaClass {
  return (CLASSES as readonly string[]).includes(declared)
    ? (declared as QuotaClass)
    : (RULES.classWhenNothingMatches as QuotaClass);
}

/** A confidence the sample read from data, through the unknown-value rule of row 47. */
function confidenceOf(declared: string): Confidence {
  return (CONFIDENCES as readonly string[]).includes(declared)
    ? (declared as Confidence)
    : (RULES.confidenceWhenNothingMatches as Confidence);
}

/* ------------------------------------------------------------------ *
 * 3. The two operations of the point.
 * ------------------------------------------------------------------ */

/** The rule of the declared map that wins for an input, or undefined. */
export function matchedRuleOf(
  seen: ClassifyInput,
): (DeclaredRule & { readonly failure: string }) | undefined {
  let best: (DeclaredRule & { readonly failure: string }) | undefined;
  for (const rule of DECLARED_RULES) {
    if (!ruleMatches(rule, seen)) continue;
    if (best === undefined || rankOf(rule.confidence) < rankOf(best.confidence)) best = rule;
  }
  return best;
}

export const operations = Object.freeze({
  /** §C.13 `classify`: the class, the confidence, the reset time, `retryable`. */
  classify(seen: ClassifyInput): Classification {
    const rule = matchedRuleOf(seen);
    if (rule === undefined) return NO_ENTRY_MATCHES;
    const quotaClass = classOf(rule.refinesTo);
    return Object.freeze({
      quotaClass,
      confidence: confidenceOf(rule.confidence),
      resetsAt: resetsAtOf(rule, seen).resetsAt,
      retryable: RULES.retryableOfClass[quotaClass] ?? NO_ENTRY_MATCHES.retryable,
    });
  },
  /** §C.13 `observe`: a gauge or a fact a host observed, read from the data. */
  observe(observation: Observation): AlertLevel | undefined {
    if (observation.kind === "gauge") {
      for (const threshold of RULES.observe.gauge) {
        const hit =
          (threshold.atMost !== undefined && observation.remaining <= threshold.atMost) ||
          (threshold.below !== undefined && observation.remaining < threshold.below);
        if (hit) return levelOf(threshold.level);
      }
      return undefined;
    }
    return levelOf(RULES.observe.hostFact);
  },
});

/** An alert level read from data, through the closed set of row 48. */
function levelOf(declared: string): AlertLevel | undefined {
  return (ALERT_LEVELS as readonly string[]).includes(declared)
    ? (declared as AlertLevel)
    : undefined;
}

/** The sample as the registry of EP-12 takes it (F100-FR-018). */
export const implementation: Implementation = Object.freeze({
  ep: "EP-12",
  pointId: "specstride.quota-classifier/1",
  id: "sample-descriptor-quota-classifier",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
