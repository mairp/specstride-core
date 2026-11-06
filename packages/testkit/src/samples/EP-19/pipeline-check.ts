/**
 * T071 of feature 123 — the sample PRECONDITION CHECK of EP-19, in the
 * pipeline shape of `@specstride/pipeline` (F123-FR-010, F123-SC-009).
 *
 * A check READS and never writes: this sample only looks at its parameters
 * and at the evaluation context. The conformance test CT-123-110 registers
 * it into the open registry of precondition checks and drives it through the
 * dry run and a live preflight.
 */
import type { Condition } from "../../../../../packages/pipeline/src/executor/types.ts";
import type {
  CheckResult,
  EvaluationContext,
} from "../../../../../packages/pipeline/src/kinds/registry.ts";

/** The id of the sample precondition check; it is no built-in check of §R.3. */
export const SAMPLE_CHECK_ID = "sample_check" as const;

function text(condition: Condition, key: string): string {
  const value = condition.params[key];
  return typeof value === "string" ? value : "";
}

/**
 * The sample check:
 *
 * - `{ expect: "pass" }` (or no parameters) reads `pass`;
 * - `{ expect: "fail" }` reads `fail`;
 * - `{ expect: "deferred" }` reads `deferred`, the verdict a check gives in
 *   the dry run where executing it would act.
 */
export function sampleCheck(condition: Condition, context: EvaluationContext): CheckResult {
  const expect = text(condition, "expect") || "pass";
  if (expect === "fail") {
    return { result: "fail", detail: `${SAMPLE_CHECK_ID}: fail (asked by the contract)` };
  }
  if (expect === "deferred") {
    return { result: "deferred", detail: `${SAMPLE_CHECK_ID}: deferred (dry run)` };
  }
  const subject = text(condition, "subject") || context.cwd || "the workspace";
  return { result: "pass", detail: `${SAMPLE_CHECK_ID}: pass (${subject})` };
}
