/**
 * T071 of feature 123 — the sample STAGE KIND of EP-19, in the pipeline
 * shape of `@specstride/pipeline` (F123-FR-010, F123-SC-009; annex F §F.7).
 *
 * This file lives in the test tree (`packages/testkit/src/samples/EP-19/`),
 * never in the core: an author adds a stage kind by registering an object
 * with the three operations `validate`, `run` and `evaluate` — the launch
 * contract schema and the stage executor are untouched. The conformance test
 * CT-123-110 (`packages/testkit/src/conformance/EP-19/stage-kind.ts`)
 * registers THIS object into the two open registries and drives a dry run
 * and a live run with it.
 */
import type { Stage, StageOutcome } from "../../../../../packages/pipeline/src/executor/types.ts";
import type {
  EvaluationContext,
  StageKindOperations,
  StageRunContext,
} from "../../../../../packages/pipeline/src/kinds/registry.ts";

/** The id of the sample stage kind; it is no built-in kind of §R.3. */
export const SAMPLE_KIND_ID = "sample-stage" as const;

/** The id of the sample precondition check, in the same sample. */
export const SAMPLE_CHECK_ID = "sample_check" as const;

/**
 * The three operations of annex F §F.7, for the sample kind. Everything is
 * data and registry calls: no switch over a kind name anywhere in the core.
 */
export const sampleStageKind: StageKindOperations = {
  /** Validate one stage of the kind: the list of the problems, empty when valid. */
  validate(stage: Stage): string[] {
    const problems: string[] = [];
    if (stage.action === undefined) {
      problems.push(`the stage ${stage.id} declares no action`);
    } else if (stage.action.argv.length === 0) {
      problems.push(`the action of ${stage.id} is an empty argument list`);
    }
    return problems;
  },

  /**
   * Run one attempt through the context's child runner; a throw of the kind
   * becomes `exec-error:` with the child code 127, like every kind.
   */
  async run(input: {
    stage: Stage;
    attempt: number;
    maxAttempts: number;
    runChild: StageRunContext["runChild"];
    context: StageRunContext;
  }): Promise<StageOutcome> {
    try {
      const result = await input.runChild({
        stage: input.stage,
        action: input.stage.action ?? { argv: [], env: [] },
        attempt: input.attempt,
        maxAttempts: input.maxAttempts,
        env: {},
      });
      return {
        stageId: input.stage.id,
        ok: result.code === 0,
        reason: result.code === 0 ? "completed" : `exit:${result.code}`,
        childExitCode: result.code,
        evidence: result.error ?? null,
      };
    } catch (error) {
      return {
        stageId: input.stage.id,
        ok: false,
        reason: `exec-error: ${String((error as Error)?.message ?? error)}`,
        childExitCode: 127,
        evidence: null,
      };
    }
  },

  /**
   * `evaluate`: whether the stage holds right now — a postcondition the
   * sample marks through the stage's own evidence marker. A registered check
   * decides, never an inline rule.
   */
  async evaluate(stage: Stage, context: EvaluationContext): Promise<boolean> {
    if (stage.postconditions.length === 0) return true;
    return context.implement === true || stage.evidence === "sample-ready";
  },
};
