/**
 * T120 — the calling convention of the generic, descriptor-driven stub
 * (F141-FR-006, F141-FR-010).
 *
 * §O.3 gives it one name, `stub-harness`, and one rule: the prompt arrives "as
 * the harness descriptor of the fixture declares". So the convention takes the
 * channel from the call itself — standard input where the fixture wrote something
 * there, the last positional argument otherwise — and records the descriptor the
 * fixture declared, where it declared one. This is also the shape a harness added
 * by DATA gets (`conventionFromEntry`): the generic stub is not a special case of
 * the oracle but the default reading of an entry of `harnessStubs`.
 */
import {
  conventionOfKnownHarness,
  promptFromTheCall,
  type HarnessCall,
  type HarnessConvention,
  type PromptOfCall,
} from "./conventions.ts";

/** The variable through which a fixture names the descriptor the stub follows. */
export const DESCRIPTOR_VARIABLE = "ORACLE_HARNESS_DESCRIPTOR" as const;

/** The prompt of one call of the generic stub: as the call carries it. */
export function promptOfGenericCall(call: HarnessCall): PromptOfCall {
  return promptFromTheCall(call, call.stdin === "" ? "argument" : "stdin");
}

/** What the generic stub records: the descriptor the fixture declared. */
export function recordsOfGenericCall(
  call: HarnessCall,
): Readonly<Record<string, unknown>> | undefined {
  const descriptor = call.env[DESCRIPTOR_VARIABLE];
  return descriptor === undefined || descriptor === "" ? undefined : Object.freeze({ descriptor });
}

/** The convention of the generic harness. */
export function genericConvention(): HarnessConvention {
  return conventionOfKnownHarness("generic", {
    prompt: promptOfGenericCall,
    records: recordsOfGenericCall,
  });
}
