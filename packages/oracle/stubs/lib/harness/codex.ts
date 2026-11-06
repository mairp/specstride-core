/**
 * T120 — the calling convention of the Codex stub (F141-FR-010, F141-FR-015).
 *
 * `proposer.sh`, the `codex` arm of `run_agent`: "`codex exec` is the
 * headless/non-interactive entrypoint", called as
 *
 *     codex exec --dangerously-bypass-approvals-and-sandbox [--model <model>] <prompt>
 *
 * The prompt is one positional argument and it is the LAST one; `exec` is the
 * subcommand and is positional too, so a reading that joined every positional
 * argument would record the subcommand as part of the prompt. The critic of Codex
 * goes over HTTP (`call_openai_chat` of `lib/critic.py`), which is the role the
 * data gives it.
 *
 * The arm carries the comment "UNVERIFIED on this host (no codex CLI here to
 * test)". F141-FR-015 forbids a scenario to encode a fact research left
 * `unverified`, and the structured quota event of Codex is named there as one of
 * the two. Nothing of that event is in this convention: the stub records the
 * argument list the baseline builds and nothing about what Codex would answer.
 */
import {
  conventionOfKnownHarness,
  positionalArguments,
  type HarnessCall,
  type HarnessConvention,
  type PromptOfCall,
} from "./conventions.ts";

/** The headless subcommand of the as-is command. */
export const HEADLESS_SUBCOMMAND = "exec" as const;

/** The option the arm always passes. */
export const BYPASS_OPTION = "--dangerously-bypass-approvals-and-sandbox" as const;

/** The prompt of one call of the Codex stub: the last positional argument. */
export function promptOfCodexCall(call: HarnessCall): PromptOfCall {
  const positional = positionalArguments(call.argv).filter(
    (argument) => argument !== HEADLESS_SUBCOMMAND,
  );
  if (positional.length > 0) {
    return Object.freeze({
      prompt: positional[positional.length - 1] as string,
      promptChannel: "argument" as const,
    });
  }
  return Object.freeze({ prompt: call.stdin, promptChannel: "argument" as const });
}

/** The convention of Codex. */
export function codexConvention(): HarnessConvention {
  return conventionOfKnownHarness("codex", { prompt: promptOfCodexCall });
}
