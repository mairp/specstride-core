/**
 * T143 — the counter assertion and the subset assertion of the second suite
 * (F141-FR-041).
 *
 * "Apart from the comparison, the second suite MUST assert for every phase of
 * every fixture that the counters of capture A and capture B are equal: passes
 * used, reject count, MALFORMED streak, numbers of phase attempts and yield
 * count. It MUST also assert that the sets of exit codes, stop reasons and run
 * states seen in capture B are subsets of those seen in capture A."
 *
 * The layer is inert, so it can never change how many passes a phase took, how
 * often the critic rejected, how long a MALFORMED streak ran, how many phase
 * attempts ran or how often the proposer yielded. And because the layer may
 * end a run no EARLIER and no LATER than the run without it, every exit code,
 * stop reason and run state capture B shows must be one capture A shows too —
 * the layer may remove a way of ending, never add one.
 *
 * Both assertions are verdicts, not throws, so a report can hold every
 * fixture's failures at once; `assertCountersEqual` and `assertSubsets` throw
 * for a caller that wants the first failure.
 */
import type { CountersCapture, PhaseCounters } from "../capture/port-only.ts";
import { COUNTER_NAMES } from "../capture/port-only.ts";
import { BREACH_MESSAGE } from "./allowlist.ts";

/** One phase whose counters differ, with both sides. */
export type CounterDifference = {
  readonly phase: number;
  readonly counter: string;
  readonly a: number;
  readonly b: number;
};

/** One set that is no subset, with the values only capture B shows. */
export type SubsetViolation = {
  readonly set: "exitCodes" | "stopReasons" | "runStates";
  /** The values in capture B that capture A does not hold. */
  readonly onlyInB: readonly string[];
};

/** The verdict of both assertions for one fixture. */
export type CountersVerdict = {
  readonly fixture: string;
  readonly differences: readonly CounterDifference[];
  readonly violations: readonly SubsetViolation[];
};

/** The counters as text, for a report. */
export function counterNameList(): readonly string[] {
  return COUNTER_NAMES;
}

/**
 * The counters that are equal per phase in capture A and capture B. A phase
 * that only one capture holds is itself a difference — the layer cannot add a
 * phase — and every named counter of a shared phase must be equal.
 */
export function countersEqual(
  fixture: string,
  a: CountersCapture,
  b: CountersCapture,
): readonly CounterDifference[] {
  const differences: CounterDifference[] = [];
  const phasesA = new Map(a.perPhase.map((phase) => [phase.phase, phase]));
  const phasesB = new Map(b.perPhase.map((phase) => [phase.phase, phase]));
  const phases = [...new Set([...phasesA.keys(), ...phasesB.keys()])].sort((x, y) => x - y);
  for (const phase of phases) {
    const left = phasesA.get(phase);
    const right = phasesB.get(phase);
    if (left === undefined || right === undefined) {
      // A phase on one side alone: every counter of it is a difference, but the
      // phase itself is named once, with the counter that shows the phase first.
      const present = left ?? right;
      const counter = COUNTER_NAMES.find((name) => (present?.[name] ?? 0) !== 0) ?? "passesUsed";
      differences.push({ phase, counter, a: left?.[counter] ?? 0, b: right?.[counter] ?? 0 });
      continue;
    }
    for (const name of COUNTER_NAMES) {
      if (left[name] !== right[name]) {
        differences.push({ phase, counter: name, a: left[name], b: right[name] });
      }
    }
  }
  return differences;
}

/**
 * The sets of capture B are subsets of the sets of capture A. A set is read
 * over the WHOLE run, not per phase; the values are compared as text, because
 * a stop reason and a run state are names and an exit code is a number.
 */
export function subsetsOfA(a: CountersCapture, b: CountersCapture): readonly SubsetViolation[] {
  const violations: SubsetViolation[] = [];
  const sets: {
    readonly set: SubsetViolation["set"];
    readonly left: readonly (string | number)[];
    readonly right: readonly (string | number)[];
  }[] = [
    { set: "exitCodes", left: a.exitCodes, right: b.exitCodes },
    { set: "stopReasons", left: a.stopReasons, right: b.stopReasons },
    { set: "runStates", left: a.runStates, right: b.runStates },
  ];
  for (const { set, left, right } of sets) {
    const inA = new Set(left.map((value) => String(value)));
    const onlyInB = [...new Set(right.map((value) => String(value)))]
      .filter((value) => !inA.has(value))
      .sort();
    if (onlyInB.length > 0) violations.push({ set, onlyInB });
  }
  return violations;
}

/** Judge one fixture's pair of counter captures. */
export function countersVerdict(
  fixture: string,
  a: CountersCapture,
  b: CountersCapture,
): CountersVerdict {
  return {
    fixture,
    differences: countersEqual(fixture, a, b),
    violations: subsetsOfA(a, b),
  };
}

/** The failures of a verdict, as the suite reports them. */
export function failuresOfCountersVerdict(verdict: CountersVerdict): readonly string[] {
  const lines: string[] = [];
  for (const difference of verdict.differences) {
    lines.push(
      `${verdict.fixture}: phase ${String(difference.phase)}, counter ${difference.counter} is ` +
        `${String(difference.a)} in capture A and ${String(difference.b)} in capture B; the ` +
        `counters are equal per phase in A and B, and a counter the layer changed is a ` +
        `${BREACH_MESSAGE} (F141-FR-041)`,
    );
  }
  for (const violation of verdict.violations) {
    lines.push(
      `${verdict.fixture}: the ${violation.set} of capture B hold ${violation.onlyInB.join(", ")}, ` +
        `which capture A does not; the sets of B are subsets of those of A (F141-FR-041)`,
    );
  }
  return lines;
}

/** Throw on the first difference, for a caller that wants the first failure. */
export function assertCountersEqual(fixture: string, a: CountersCapture, b: CountersCapture): void {
  const differences = countersEqual(fixture, a, b);
  if (differences.length > 0) {
    throw new CountersError(
      failuresOfCountersVerdict({ fixture, differences, violations: [] }).join("; "),
    );
  }
}

/** Throw on the first violation, for a caller that wants the first failure. */
export function assertSubsets(a: CountersCapture, b: CountersCapture): void {
  const violations = subsetsOfA(a, b);
  if (violations.length > 0) {
    throw new CountersError(
      failuresOfCountersVerdict({
        fixture: "the fixture under assertion",
        differences: [],
        violations,
      }).join("; "),
    );
  }
}

/** A counter assertion that does not hold. */
export class CountersError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CountersError";
  }
}

/** One counter row, for a test that builds a capture by hand. */
export function countersOfPhase(
  phase: number,
  counters: Partial<Record<(typeof COUNTER_NAMES)[number], number>>,
): PhaseCounters {
  const row = { phase } as Record<string, number>;
  for (const name of COUNTER_NAMES) row[name] = counters[name] ?? 0;
  return row as unknown as PhaseCounters;
}
