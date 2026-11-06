/**
 * The targets of the host conformance suite of EP-01, the host port (annex H,
 * §H.1): the suite of a host runs against THAT HOST, recorded FIRST, and
 * against the PLAIN SHELL, recorded SECOND.
 *
 * F113-FR-034 names the shape every host suite takes: "The host conformance
 * suite MUST run the command sequences of both host skills on oracle fixtures
 * with stub agents, AGAINST THE PLAIN SHELL AND AGAINST [the host], measure
 * bytes against the budgets, check the reference closure and validate the
 * artifact tree." The suite therefore has two targets; this module records the
 * built-in one and builds the pair, so that the run of the suite cannot
 * silently drop one.
 *
 * The FIRST target is an INPUT: `hostConformanceTargets(first)` records the
 * host's own target ahead of the built-in plain shell, so a host package runs
 * the suite against itself by passing its own record. This module holds no
 * host's record — the id, the words, the source path and the requirement of
 * the first target are the host's to supply.
 *
 * The plain shell is BUILT IN: annex H §H.1 names it the test host, and the
 * test tree carries it as the sample of EP-01
 * (`src/samples/EP-01/index.ts`, registered with the class `first-party`,
 * T156). Recording it as the second target binds every suite to that sample: a
 * run that skips it is a run against one host. Its record keeps the
 * requirement of the feature that named the plain shell the test host
 * (F113-FR-034); a host whose own suite rests on another requirement says so
 * in its FIRST target, which is entirely its own.
 *
 * Neither target is a LIVE host. The case of survival after detaching runs
 * only on a live host and is reported as a skip with its reason (F113-FR-034,
 * Principle XVII: a missing capability, a missing host CLI or a missing live
 * host is a skip with its reason, never a pass).
 */
import { POINT_ID } from "@specstride/contracts/ep/host";

/** The point the suite is of (annex H, §H.1). */
export const EP = "EP-01" as const;
export { POINT_ID };

/** One target of the host conformance suite. */
export type ConformanceTarget = {
  /** The position in the order F113-FR-034 gives: the host at 1, the plain shell at 2. */
  readonly order: 1 | 2;
  /** The id of the implementation the suite runs against. */
  readonly implementationId: string;
  /** The host the target is, in words. */
  readonly host: string;
  /** Where the implementation lives, relative to the root of the repository. */
  readonly source: string;
  /** True for a host whose session is live; the suite has no such target. */
  readonly live: false;
  /** The requirement that puts the target in the suite. */
  readonly requirement: string;
};

/** The id the sample of EP-01 registers under (T156; `samples/EP-01/index.ts`). */
export const PLAIN_SHELL_IMPLEMENTATION_ID = "sample-host-plain-shell" as const;

/**
 * The built-in SECOND target of every host suite: the plain shell host (T004,
 * annex H §H.1), the sample of EP-01.
 */
export const PLAIN_SHELL_TARGET: ConformanceTarget = Object.freeze({
  order: 2 as const,
  implementationId: PLAIN_SHELL_IMPLEMENTATION_ID,
  host: "the plain shell, the test host of annex H §H.1",
  source: "packages/testkit/src/samples/EP-01/index.ts",
  live: false as const,
  requirement: "F113-FR-034",
});

/** The second target of every suite: the plain shell host (T004). */
export const SECOND_TARGET: ConformanceTarget = PLAIN_SHELL_TARGET;

/**
 * The targets of a host's suite, in order: the host's own record FIRST, the
 * plain shell SECOND (F113-FR-034, T004). The host's record is copied and
 * frozen, so a caller cannot move the built-in target through it.
 */
export function hostConformanceTargets(first: ConformanceTarget): readonly ConformanceTarget[] {
  if (first.order !== 1) {
    throw new Error(`the host's own target must be at order 1, got ${String(first.order)}`);
  }
  return Object.freeze([Object.freeze({ ...first }), PLAIN_SHELL_TARGET]);
}

/** The target of a suite at a position, or `undefined`. */
export function targetAt(
  targets: readonly ConformanceTarget[],
  order: number,
): ConformanceTarget | undefined {
  return targets.find((t) => t.order === order);
}

/**
 * The fixture both targets run on (quickstart.md step 3: "Run the conformance
 * suite against the plain shell and the host on fixture `greeting-ready`").
 */
export const TARGET_FIXTURE = "greeting-ready" as const;

/**
 * F113-FR-034 — the one case that runs only on a live host, and the reason the
 * suite reports when it is skipped. No target of a suite is live, so the case
 * is always a skip in the per-change build.
 */
export const LIVE_HOST_CASE = "survival after detaching" as const;
export const LIVE_HOST_SKIP_REASON =
  "no live host: the case of survival after detaching runs only on a live host and is " +
  "reported as a skip with its reason, never as a pass (F113-FR-034; Principle XVII)";
