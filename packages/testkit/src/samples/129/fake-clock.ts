/**
 * T009 of feature 129 — a FAKE CLOCK for the tests of the read model and of its
 * two commands (F129-FR-036).
 *
 * `project` reads no clock: `now` is a value its caller hands in (F129-FR-001).
 * A test therefore needs no clock of the host at all; what it needs is one
 * place that makes a fixed instant, moves it on command, and never reads the
 * clock of the machine: no function of this module reads the host clock.
 */

/** A clock a test drives by hand. */
export type FakeClock = {
  /** The instant the clock stands at, as an ISO-8601 timestamp in UTC. */
  now(): string;
  /** The instant as milliseconds since the epoch. */
  millis(): number;
  /** Move the clock on by whole seconds and give the new instant. */
  advanceSeconds(seconds: number): string;
  /** Move the clock on by milliseconds and give the new instant. */
  advance(millis: number): string;
  /** Set the clock to an instant. */
  set(at: string): string;
  /** Every instant the clock has stood at, in order. */
  readings(): readonly string[];
};

/** The instant a fake clock starts at where the caller names none. */
export const EPOCH = "2026-10-01T00:00:00.000Z" as const;

/** A fake clock that starts at `at` and only moves when a test moves it. */
export function fakeClock(at: string = EPOCH): FakeClock {
  let millis = Date.parse(at);
  if (Number.isNaN(millis)) throw new Error(`not a timestamp: ${at}`);
  const readings: string[] = [new Date(millis).toISOString()];
  const stamp = (): string => {
    const text = new Date(millis).toISOString();
    readings.push(text);
    return text;
  };
  return Object.freeze({
    now: () => new Date(millis).toISOString(),
    millis: () => millis,
    advance: (step: number) => {
      millis += step;
      return stamp();
    },
    advanceSeconds: (seconds: number) => {
      millis += seconds * 1000;
      return stamp();
    },
    set: (instant: string) => {
      const parsed = Date.parse(instant);
      if (Number.isNaN(parsed)) throw new Error(`not a timestamp: ${instant}`);
      millis = parsed;
      return stamp();
    },
    readings: () => Object.freeze([...readings]),
  });
}
