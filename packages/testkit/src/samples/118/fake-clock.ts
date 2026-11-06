/**
 * T006 of feature 118 — the fake clock of the pass-supervision tests
 * (`packages/testkit`, sample tree; `specs/118-pass-supervision-and-jobs/plan.md`,
 * "Testing": "a fake clock and a fake process list for the unit tests").
 *
 * Every watchdog of feature 118 (T022 to T031) decides from times the `Clock`
 * port hands it, so the tests of `tests/parity/118` and `tests/characterization/118` advance this clock by hand and
 * no test sleeps. No real timer is started.
 */
import type { Clock } from "../../../../core/src/pass-supervision/index.ts";

/** A clock the test advances by hand. Starts at `startMs` (default 0). */
export class FakeClock implements Clock {
  private currentMs: number;

  constructor(startMs: number = 0) {
    this.currentMs = startMs;
  }

  /** The current time of the fake, in milliseconds since the epoch. */
  nowMs(): number {
    return this.currentMs;
  }

  /** Move the clock forward by `ms` milliseconds. */
  advance(ms: number): void {
    this.currentMs += ms;
  }

  /** Set the clock to an absolute time. */
  set(ms: number): void {
    this.currentMs = ms;
  }
}
