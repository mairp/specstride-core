/**
 * T161 — the end of a scenario against the end the catalogue states
 * (F141-FR-013).
 *
 * The catalogue states, for every scenario of FX-06, FX-07 and FX-17 to FX-20
 * that the reference gives an observable end for, what that end is: the exit
 * code and the stop reason, read off the capture of the reference
 * (`endOnReference`, F141-FR-013). A golden capture is therefore not only
 * surfaces: the capture job ALSO compares the end of every fresh capture with
 * the end the catalogue states, and FAILS on a difference, naming the
 * scenario — because a capture can agree surface by surface and still end
 * differently than the record of the reference says, and the ends are the
 * column the parity tests of the other features cite.
 *
 * The end of a capture is read the way the reference writes it:
 *
 * - the exit code is `exit.exitCode` of the capture (S-01), the exit of the
 *   entry point the scenario drives;
 * - the stop reason is the `reason` of the LAST `run_stop` event of the events
 *   surface (S-07) — the engine writes one `run_stop` per run, and the literal
 *   is one of the stop reasons of feature 100 (`stop-reasons.json`). A capture
 *   with no `run_stop` ends with no stop reason, which is what `null` stands
 *   for.
 *
 * Nothing here holds a list of its own: the ends come out of
 * `oracleData.fixtureCatalogue` through `endOnReferenceOf`.
 */
import { endOnReferenceOf } from "../catalogue/catalogue.ts";
import type { NormalizedCapture } from "../normalize/index.ts";
import type { Difference } from "../waivers/waivers.ts";

/** The end of one capture: the exit code and the stop reason, as observed. */
export type ScenarioEnd = {
  readonly exitCode: number;
  /** The literal of the last `run_stop`, or `null` where the run wrote none. */
  readonly stopReason: string | null;
};

/**
 * The end one capture shows. The exit code is the exit of the last command of
 * the run (the entry point's own exit); the stop reason is the `reason` of the
 * last `run_stop` event.
 */
export function endOfCapture(capture: NormalizedCapture): ScenarioEnd {
  const exit = capture.surfaces["exit"] as { exitCode?: unknown } | undefined;
  const exitCode = Number(exit?.exitCode ?? 1);
  return Object.freeze({ exitCode, stopReason: lastStopReason(capture) });
}

/** The `reason` of the last `run_stop` event of a capture, or `null`. */
export function lastStopReason(capture: NormalizedCapture): string | null {
  let found: string | null = null;
  const events = capture.surfaces["events"] as
    { byWriterClass?: Record<string, unknown> } | undefined;
  for (const writer of Object.values(events?.byWriterClass ?? {})) {
    for (const record of Array.isArray(writer) ? (writer as Record<string, unknown>[]) : []) {
      // One record is one line of the events file as ordered pairs; only the
      // `reason` of a `run_stop` record is a stop reason — a pass-level reason
      // (why a pass was launched or killed) is not the run's stop reason.
      const pairs = (record["pairs"] as { key: string; value: string }[] | undefined) ?? [];
      if (!pairs.some((p) => p.key === "event" && p.value === "run_stop")) continue;
      for (const pair of pairs) {
        if (pair.key === "reason" && typeof pair.value === "string") found = pair.value;
      }
    }
  }
  return found;
}

/** Strip the backticks and the prose of a catalogue field down to its literal. */
export function stopReasonLiteral(stated: string): string | null {
  const cleaned = stated.trim();
  if (cleaned === "" || /^none\b/i.test(cleaned)) return null;
  const ticked = cleaned.match(/`([^`]+)`/);
  return ticked ? (ticked[1] as string) : cleaned;
}

/**
 * The exit code the catalogue states in `end`, read for the entry point the
 * scenario drives: `critic exit N` where the scenario drives the critic
 * directly, otherwise the engine's exit (`engine exit N`). A text that names
 * neither falls back to the first `exit N` it holds.
 */
export function statedExitCode(stated: string, entryPoint: string): number | undefined {
  const criticFirst = /`?critic`?/.test(entryPoint);
  const engine = stated.match(/engine exit ([0-9]+)/);
  const critic = stated.match(/critic exit ([0-9]+)/);
  const passLoop = stated.match(/pass-loop exit ([0-9]+)/);
  const chosen = criticFirst ? (critic ?? engine ?? passLoop) : (engine ?? critic ?? passLoop);
  const fallback = stated.match(/\bexits? ([0-9]+)/);
  const match = chosen ?? fallback;
  return match === null || match === undefined ? undefined : Number(match[1]);
}

/** The end the catalogue states for one scenario, or `undefined` where it states none. */
export function catalogueEndOf(
  fixtureId: string,
): { readonly exitCode: number; readonly stopReason: string | null } | undefined {
  const [family, name] = fixtureId.split("/");
  const end = endOnReferenceOf(family as string, name as string);
  if (end === undefined) return undefined;
  const exitCode = statedExitCode(end.end, end.entryPoint);
  if (exitCode === undefined) return undefined;
  return Object.freeze({ exitCode, stopReason: stopReasonLiteral(end.stopReason) });
}

/**
 * Whether the catalogue states an end for the scenario at all — the families
 * FX-06, FX-07 and FX-17 to FX-20, and only the scenarios of them whose prose
 * yields an exit code. How the end was LEARNED (`knownBy`: out of a run or
 * out of the code) does not matter here: the catalogue states the same exit
 * and the same stop reason either way, and a capture is held against it the
 * same way.
 */
export function catalogueStatesAnEnd(fixtureId: string): boolean {
  return catalogueEndOf(fixtureId) !== undefined;
}

/**
 * The difference between the end a fresh capture shows and the end the
 * catalogue states, as one `Difference` the capture job reports and fails on.
 * An empty list: the capture agrees with the catalogue, or the catalogue
 * states no end for the scenario.
 */
export function endDifferencesFromCatalogue(
  fixtureId: string,
  capture: NormalizedCapture,
): readonly Difference[] {
  const stated = catalogueEndOf(fixtureId);
  if (stated === undefined) return [];
  const shown = endOfCapture(capture);
  const differences: Difference[] = [];
  if (shown.exitCode !== stated.exitCode) {
    differences.push({
      fixture: fixtureId,
      surface: "exit",
      selector: "endOnReference.exitCode",
      reference: String(stated.exitCode),
      port: String(shown.exitCode),
    });
  }
  if (shown.stopReason !== stated.stopReason) {
    differences.push({
      fixture: fixtureId,
      surface: "events",
      selector: "endOnReference.stopReason",
      reference: stated.stopReason ?? "none",
      port: shown.stopReason ?? "none",
    });
  }
  return differences;
}
