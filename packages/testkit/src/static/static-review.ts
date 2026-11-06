/**
 * T265's counterpart in `src/`: the review over the specifications of all
 * features (annex X, §X.10; F100-FR-226). It is the pair of checks that the
 * consistency review runs — the vocabulary of the data files, and the rule
 * that no requirement lists harnesses other than by reading the registry.
 */
import { checkVocabulary } from "./vocabulary.ts";
import { checkOpenHarnessRegistry } from "./product-rules.ts";
import type { CheckOptions, Finding, StaticCheck } from "./kit.ts";

/** F100-FR-226 — the consistency review over the specifications of all features. */
export function review(options: CheckOptions = {}): readonly Finding[] {
  return Object.freeze([...checkVocabulary(options), ...checkOpenHarnessRegistry(options)]);
}

export const reviewCheck: StaticCheck = {
  name: "No closed list",
  covers: ["F100-FR-023", "F100-FR-226", "F100-SC-003"],
  run: checkOpenHarnessRegistry,
};

export default reviewCheck;
