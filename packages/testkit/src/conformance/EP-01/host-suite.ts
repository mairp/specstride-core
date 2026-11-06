/**
 * The frame of the host conformance suite of EP-01 (annex H, §H.1): the cases
 * a host supplies run against EVERY target of its suite — the host itself at
 * order 1, the plain shell at order 2 — beside the two cases every suite
 * holds (the record of the two targets, and the `describe` of the six
 * capabilities of the table of §H.1) and the live-host case, which is always
 * a skip with its reason (F113-FR-034, Principle XVII).
 *
 * A host package runs the suite against ITSELF by calling
 * `registerHostConformanceCases` at the top level of its own test file, with
 * its targets (`hostConformanceTargets` of `./targets.ts`), the way to reach
 * an implementation by the id of a target, and its own cases. The frame holds
 * no host's record: no id, no source path, no capability beyond the table of
 * `data/host-capabilities.json`, no requirement id beyond the one
 * F113-FR-034 fixed for the plain shell and the live-host case.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { CAPABILITIES } from "@specstride/contracts/ep/host";
import type { HostDescription } from "@specstride/contracts/ep/host";
import type { Implementation } from "../frame.ts";
import {
  LIVE_HOST_CASE,
  LIVE_HOST_SKIP_REASON,
  PLAIN_SHELL_IMPLEMENTATION_ID,
  type ConformanceTarget,
} from "./targets.ts";

/** One case of the suite: it is run against EVERY target of the suite. */
export type SuiteCase = {
  /** The id of the case, as the report names it. */
  readonly id: string;
  /** The title of the test the case becomes, per target. */
  readonly title: string;
  /** The requirements the case proves. */
  readonly proves: readonly string[];
  /** The case itself: the implementation and the target it runs against. */
  run(implementation: Implementation, target: ConformanceTarget): void;
};

/** The input of the frame: the suite of one host. */
export type HostConformanceSuite = {
  /** The targets, the host first and the plain shell second (`hostConformanceTargets`). */
  readonly targets: readonly ConformanceTarget[];
  /** The implementation of a target, by the id the target records. */
  readonly implementationOf: (id: string) => Implementation;
  /** The host's cases, each run against every target. */
  readonly cases: readonly SuiteCase[];
};

/** What a registration produced, for the test that holds the record. */
export type RegisteredSuite = {
  /** The targets of the suite: always 2. */
  readonly targetCount: number;
  /** The cases the host supplied. */
  readonly caseCount: number;
  /** The runs the registration makes: cases × targets. */
  readonly caseRuns: number;
};

/**
 * Register the suite of a host as `node:test` cases. Call at the top level of
 * the host's own test file. The generated tests are, in order: the record of
 * the two targets; every case of the host against every target; the
 * `describe` of the capabilities of §H.1; the live-host case as a skip.
 */
export function registerHostConformanceCases(suite: HostConformanceSuite): RegisteredSuite {
  const { targets, implementationOf, cases } = suite;
  if (targets.length !== 2) {
    throw new Error(`a host conformance suite has two targets, got ${String(targets.length)}`);
  }
  if (targets[0]!.order !== 1 || targets[1]!.order !== 2) {
    throw new Error("the targets of a host conformance suite are recorded in order 1, 2");
  }

  test(`the suite records two targets: the host first, the plain shell second (F113-FR-034)`, () => {
    assert.equal(targets.length, 2);
    assert.deepEqual(
      targets.map((t) => t.order),
      [1, 2],
    );
    assert.equal(targets[1]!.implementationId, PLAIN_SHELL_IMPLEMENTATION_ID);
    for (const target of targets) assert.equal(target.live, false);
  });

  for (const one of cases) {
    for (const target of targets) {
      test(`${one.id} [${target.implementationId}]: ${one.title}`, () => {
        one.run(implementationOf(target.implementationId), target);
      });
    }
  }

  test("describe of both targets declares the six capabilities of annex H §H.1", () => {
    for (const target of targets) {
      const impl = implementationOf(target.implementationId);
      const describeOp = impl.operations?.describe as (() => HostDescription) | undefined;
      const description = describeOp?.();
      for (const capability of CAPABILITIES) {
        assert.ok(
          description !== undefined && capability in description,
          `${target.implementationId} declares no \`${capability}\``,
        );
      }
    }
  });

  test(
    `${LIVE_HOST_CASE}: skip — ${LIVE_HOST_SKIP_REASON}`,
    { skip: LIVE_HOST_SKIP_REASON },
    () => {
      // The body never runs without a live host: the skip IS the report (F113-FR-034).
      assert.fail("the survival case ran without a live host");
    },
  );

  return Object.freeze({
    targetCount: targets.length,
    caseCount: cases.length,
    caseRuns: cases.length * targets.length,
  });
}
