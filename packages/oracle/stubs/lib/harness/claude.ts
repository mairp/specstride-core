/**
 * T120 — the calling convention of the Claude stub (F141-FR-010).
 *
 * At the pinned commit the proposer arm writes the prompt into a temporary file
 * and names it in `SPECSTRIDE_STDIN_FILE`, then runs `claude -p [--model <model>]`
 * with no positional prompt: "the prompt goes in on stdin (claude -p reads it when
 * no positional prompt is given): a phase's standing prompt plus its cumulative
 * verification block can exceed the 128 KiB single-argument limit"
 * (`proposer.sh`, the `claude` arm of `run_agent`). The critic of Claude is not
 * this command at all — `lib/critic.py` calls the vendor API directly
 * (`call_claude`), which is why the entry of the data gives Claude the role
 * `critic-http`.
 *
 * So: the prompt arrives on standard input, the stub records nothing beyond what
 * every stub records, and `--model` is visible in the argument list, which is the
 * compared surface the model selection shows up in.
 */
import {
  conventionOfKnownHarness,
  promptFromTheCall,
  type HarnessCall,
  type HarnessConvention,
  type PromptOfCall,
} from "./conventions.ts";

/** The option of the one-shot print mode. */
export const PRINT_OPTION = "-p" as const;

/** The option that names the model, where the run names one. */
export const MODEL_OPTION = "--model" as const;

/** The variable through which the arm hands the prompt file to the command. */
export const PROMPT_FILE_VARIABLE = "SPECSTRIDE_STDIN_FILE" as const;

/** The prompt of one call of the Claude stub: standard input. */
export function promptOfClaudeCall(call: HarnessCall): PromptOfCall {
  return promptFromTheCall(call, "stdin");
}

/** The convention of Claude. */
export function claudeConvention(): HarnessConvention {
  return conventionOfKnownHarness("claude", { prompt: promptOfClaudeCall });
}
