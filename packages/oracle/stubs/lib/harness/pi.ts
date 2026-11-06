/**
 * T120 — the calling convention of the pi stub, which is used on the PORT side
 * only (F141-FR-010, §O.7).
 *
 * pi has no as-is behaviour: the Specstride baseline at `9cab15d` has no arm for
 * it in `run_agent` and no call of it in `lib/critic.py`. So no fixture family
 * names it, the data of its entry says `port only; no fixture family names it`,
 * and `sidesOfHarnessStub("pi")` is what a caller is held to. The stub exists
 * because §O.7 requires the oracle to OFFER a stub for a behaviour with no
 * reference: a characterization test of feature 134 drives the port against it
 * and compares nothing with a baseline.
 *
 * The convention is the one the harness descriptor of feature 134 declares
 * (F134-FR-011, F134-FR-018): print mode with the JSON output mode, the prompt on
 * standard input and never as an argument, the working directory stated, no
 * session, and for a critic call no tool, no skill and no context file.
 */
import {
  conventionOfKnownHarness,
  promptFromTheCall,
  type HarnessCall,
  type HarnessConvention,
  type PromptOfCall,
} from "./conventions.ts";

/** The side the pi stub serves, as the data of its entry states it. */
export const PORT_SIDE_ONLY = "port only" as const;

/** The prompt of one call of the pi stub: standard input, never an argument. */
export function promptOfPiCall(call: HarnessCall): PromptOfCall {
  return promptFromTheCall(call, "stdin");
}

/** Why a call of the pi stub on the reference side is refused. */
export const PI_HAS_NO_REFERENCE =
  `pi has no as-is behaviour: the Specstride baseline has no arm for it in run_agent and no call ` +
  `of it in the critic module, so the pi stub is used on the port side only (F141-FR-010, §O.7)`;

/** The convention of pi. */
export function piConvention(): HarnessConvention {
  return conventionOfKnownHarness("pi", { prompt: promptOfPiCall });
}
