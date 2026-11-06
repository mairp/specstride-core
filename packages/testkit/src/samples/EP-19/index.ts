/**
 * T146 — the sample implementation of EP-19, the stage kind and the
 * precondition check, outside the core, registered from the test tree (annex
 * A, §A.4, F100-FR-018; annex X, §X.10, F100-FR-222).
 *
 * A sample stage kind and a sample check registered from the test tree, which
 * §F.7 "Proving test" names: both are validated, shown by the dry run and
 * executed, with no change to the schema of the launch contract or to the
 * stage executor.
 */
import {
  CHECK_OUTCOME_ON_A_THROW,
  STAGE_REASON_ON_A_THROW,
} from "@specstride/contracts/ep/stage-kind";
import type {
  CheckTiming,
  EvaluateOutcome,
  LaunchFlags,
  StageFinding,
  StageRunResult,
} from "@specstride/contracts/ep/stage-kind";
import type { Implementation } from "../../conformance/frame.ts";

/** The id of the sample stage kind; it is no built-in kind. */
export const STAGE_KIND = "sample-stage" as const;

/** The id of the sample precondition check; it is no built-in check. */
export const PRECONDITION_CHECK = "sample_check" as const;

export const operations = Object.freeze({
  validate(stage: Readonly<Record<string, unknown>>): readonly StageFinding[] {
    const out: StageFinding[] = [];
    if (typeof stage["name"] !== "string") {
      out.push(Object.freeze({ message: "a stage of the sample kind needs a `name`" }));
    }
    if (stage["kind"] !== STAGE_KIND) {
      out.push(
        Object.freeze({
          message: `the stage kind \`${String(stage["kind"])}\` is not \`${STAGE_KIND}\``,
        }),
      );
    }
    return Object.freeze(out);
  },
  run(
    stage: Readonly<Record<string, unknown>>,
    flags: LaunchFlags,
    environment: Readonly<Record<string, string>>,
    _timeLimitMs: number,
  ): Promise<StageRunResult> {
    if (stage["throws"] === true) {
      return Promise.resolve(
        Object.freeze({
          exitCode: 1,
          stageReason: `${STAGE_REASON_ON_A_THROW}the sample stage was asked to throw`,
          digestEvidencePath: "stage:sample:digest",
        }),
      );
    }
    // A fixed argument list, no shell; the sample records it and starts nothing.
    return Promise.resolve(
      Object.freeze({
        exitCode: flags.smoke ? 0 : 0,
        stageReason: "ok",
        digestEvidencePath: `stage:sample:digest:${Object.keys(environment).length}`,
      }),
    );
  },
  evaluate(
    declared: Readonly<Record<string, unknown>>,
    _timing: CheckTiming,
    dryRun: boolean,
  ): Promise<EvaluateOutcome> {
    if (declared["throws"] === true) return Promise.resolve(CHECK_OUTCOME_ON_A_THROW);
    // In a dry run the check executes nothing and reports `deferred` where it
    // would have to execute.
    if (dryRun && declared["needsExecution"] === true) return Promise.resolve("deferred");
    return Promise.resolve(declared["passes"] === false ? "fail" : "pass");
  },
});

export const implementation: Implementation = Object.freeze({
  ep: "EP-19",
  pointId: "specstride.stage-kind/1",
  id: "sample-stage-kind-and-check",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
