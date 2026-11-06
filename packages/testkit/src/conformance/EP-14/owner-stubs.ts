/**
 * T067 (feature 112) — the two stub checks of the test tree for CT-112-133,
 * the place of a registered check (F112-FR-033).
 *
 * Both stubs are registered through the registration call of the kernel
 * package (`registerDoctorCheck`, F100-FR-234, annex G §G.7), exactly as an
 * owner registers: this module imports `@specstride/contracts` and
 * `@specstride/kernel` and NEVER the doctor — the whole point of the kernel
 * surface is that an owner needs no import of the doctor. The code of the
 * checks lives here, in the tree of their owner; the doctor only renders what
 * is registered.
 */
import type { DoctorCheck, Severity } from "@specstride/contracts/ep/doctor";
import { registerDoctorCheck } from "@specstride/kernel";

/**
 * A check of the harness adapter that has the customisation: a customisation
 * that cannot be switched off (F112-FR-033, list, second item). Warns while
 * the customisation is in effect; `ok` once it is off.
 */
export const HARNESS_CUSTOMISATION_CHECK: DoctorCheck = Object.freeze({
  id: "harness.customisation.example",
  group: "harness",
  lb: false,
  order: 900,
  probe(injected: Readonly<Record<string, unknown>>): Promise<unknown> {
    return Promise.resolve(injected["customisationOn"] === true);
  },
  severityRule(observed: unknown): Severity {
    const state = (observed ?? {}) as { customisationOn?: unknown };
    return state["customisationOn"] === true ? "warn" : "ok";
  },
  messageTemplate: "customisation {name} of the harness cannot be switched off",
  fixHint: "review the customisation with the owner of the harness adapter",
});

/**
 * A check of the pipeline runtime: the presence of the terminal tool
 * `script` where a stage of a pipeline needs it (F112-FR-033, list, third
 * item). Fails while the tool is missing; `ok` once it is present.
 */
export const TERMINAL_TOOL_CHECK: DoctorCheck = Object.freeze({
  id: "pipeline.terminal.tool.script",
  group: "run",
  lb: false,
  order: 901,
  probe(injected: Readonly<Record<string, unknown>>): Promise<unknown> {
    return Promise.resolve(injected["terminalToolPresent"] === true);
  },
  severityRule(observed: unknown): Severity {
    const state = (observed ?? {}) as { terminalToolPresent?: unknown };
    return state["terminalToolPresent"] === true ? "ok" : "fail";
  },
  messageTemplate: "terminal tool {tool} is missing; the stage that needs it cannot run",
  fixHint: "install the terminal tool the pipeline stage names",
});

const registeredHere = new Set<string>();

/** Register both stubs with the kernel registry (idempotent per id). */
export function registerOwnerStubs(): void {
  for (const check of [HARNESS_CUSTOMISATION_CHECK, TERMINAL_TOOL_CHECK]) {
    if (!registeredHere.has(check.id)) {
      registeredHere.add(check.id);
      registerDoctorCheck(check);
    }
  }
}
