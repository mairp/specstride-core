/**
 * T143 — the sample implementation of EP-17, the detach strategy, outside the
 * core, registered from the test tree (annex A, §A.4, F100-FR-018; annex X,
 * §X.10, F100-FR-222).
 *
 * A sample strategy registered from the test tree, which §F.6 "Proving test"
 * names. It starts nothing: it records what a start would be, so that the
 * case runs hermetically and never leaves a process behind.
 */
import { STRATEGY_WITHOUT_DETACHING } from "@specstride/contracts/ep/detach";
import type {
  AvailableResult,
  StartInput,
  StartedProcess,
  StrategyDescription,
} from "@specstride/contracts/ep/detach";
import type { Implementation } from "../../conformance/frame.ts";

/** The id of the sample strategy. */
export const STRATEGY_ID = "sample-detach" as const;

/** Every start the sample was asked for, in order. */
export const starts: StartInput[] = [];

/** Let a case make the strategy unavailable, as §F.6 "Failure" asks. */
export let available = true;
export function setAvailable(value: boolean): void {
  available = value;
}

export const operations = Object.freeze({
  available(): AvailableResult {
    return Object.freeze({
      available,
      reason: available
        ? "the sample strategy of the test tree starts nothing and is always available"
        : `unavailable: run the runtime root with the strategy \`${STRATEGY_WITHOUT_DETACHING}\``,
    });
  },
  start(input: StartInput): Promise<StartedProcess> {
    starts.push(input);
    return Promise.resolve(
      Object.freeze({ pid: 0, startTime: "2026-10-01T00:00:00.000Z", sessionLeader: true }),
    );
  },
  describe(): StrategyDescription {
    return Object.freeze({
      id: STRATEGY_ID,
      survives: Object.freeze({ endOfTheParent: true, endOfTheHostSession: true, reboot: false }),
    });
  },
});

export const implementation: Implementation = Object.freeze({
  ep: "EP-17",
  pointId: "specstride.detach/1",
  id: "sample-detach-strategy",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
