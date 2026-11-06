/**
 * T120 — the calling convention of the prime stub, agent and launcher
 * (F141-FR-010, F141-FR-015).
 *
 * Two executables, one harness. `proposer.sh`, the two prime arms of
 * `run_agent`:
 *
 *     printf '%s' "$prompt" | prime-agent -p --mode <text|json> --no-session --cwd <workdir>
 *     printf '%s' "$prompt" | prime <variant> -p --mode <text|json> --no-session --cwd <workdir>
 *
 * and `lib/critic.py`, `call_prime_shell`, which adds `--no-tools --no-skills
 * --no-context-files` and passes the prompt as the input of the process. So the
 * prompt arrives on standard input in every role, which is what the entry of the
 * data says, and the mode (`text` or `json`) and the variant are visible in the
 * argument list.
 *
 * The variant of the launcher form is a positional argument that stands FIRST,
 * before `-p`: it is not a prompt, and the prompt is never an argument of either
 * form. Nothing of this convention reads the variant as a prompt.
 */
import {
  conventionOfKnownHarness,
  promptFromTheCall,
  type HarnessCall,
  type HarnessConvention,
  type PromptOfCall,
} from "./conventions.ts";

/** The two executables of the harness: the agent and the fleet launcher. */
export const AGENT_EXECUTABLE = "prime-agent" as const;
export const LAUNCHER_EXECUTABLE = "prime" as const;

/** The option that names the mode of the stream the agent writes. */
export const MODE_OPTION = "--mode" as const;

/** The option that keeps every pass fresh. */
export const NO_SESSION_OPTION = "--no-session" as const;

/** The mode of this call, where the argument list names one. */
export function modeOfPrimeCall(argv: readonly string[]): string | undefined {
  const index = argv.indexOf(MODE_OPTION);
  return index < 0 ? undefined : argv[index + 1];
}

/**
 * The variant of this call: the first positional argument of the launcher form,
 * and nothing for the agent form, which takes no variant.
 */
export function variantOfPrimeCall(call: HarnessCall): string | undefined {
  if (call.executable !== LAUNCHER_EXECUTABLE) return undefined;
  const first = call.argv[0];
  return first === undefined || first.startsWith("-") ? undefined : first;
}

/** The prompt of one call of a prime stub: standard input, in every role. */
export function promptOfPrimeCall(call: HarnessCall): PromptOfCall {
  return promptFromTheCall(call, "stdin");
}

/** What a prime stub records: the mode it was called in, and the variant. */
export function recordsOfPrimeCall(
  call: HarnessCall,
): Readonly<Record<string, unknown>> | undefined {
  const given: Record<string, unknown> = {};
  const mode = modeOfPrimeCall(call.argv);
  if (mode !== undefined) given["mode"] = mode;
  const variant = variantOfPrimeCall(call);
  if (variant !== undefined) given["variant"] = variant;
  return Object.keys(given).length === 0 ? undefined : Object.freeze(given);
}

/** The convention of prime. */
export function primeConvention(): HarnessConvention {
  return conventionOfKnownHarness("prime", {
    prompt: promptOfPrimeCall,
    records: recordsOfPrimeCall,
  });
}
