/**
 * The frame of the host conformance suite of EP-01 (`./host-suite.ts`), held
 * against a sample host of this test: the frame takes the host's targets, the
 * way to its implementations and the host's cases, and registers the record of
 * the two targets, every case against every target, the `describe` of the six
 * capabilities of annex H §H.1 and the live-host case as a skip with its
 * reason. No host of this repository is named here: the sample target, its id
 * and its requirement are this test's own.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { HostDescription } from "@specstride/contracts/ep/host";
import type { Implementation } from "../frame.ts";
import { implementation as plainShell } from "../../samples/EP-01/index.ts";
import { hostConformanceTargets, type ConformanceTarget } from "./targets.ts";
import { registerHostConformanceCases, type SuiteCase } from "./host-suite.ts";

/** The runs the sample cases recorded, in order. */
const ran: string[] = [];

/** A sample first target: no host of the repository is named. */
const sampleTarget: ConformanceTarget = Object.freeze({
  order: 1 as const,
  implementationId: "sample-host-of-the-frame-test",
  host: "a sample host of this test, standing for any host package of the port",
  source: "packages/testkit/src/conformance/EP-01/host-suite.test.ts",
  live: false as const,
  requirement: "KIT-FR-02",
});

/** A sample implementation of EP-01 that declares every capability of §H.1. */
const sampleImplementation: Implementation = Object.freeze({
  ep: "EP-01",
  pointId: "specstride.host/1",
  id: sampleTarget.implementationId,
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations: Object.freeze({
    describe(): HostDescription {
      return Object.freeze({
        skillNaming: { rule: "lower-case with hyphens", descriptionCap: 200 },
        hooks: Object.freeze([]),
        background: null,
        statusSurface: "the terminal",
        evals: "the session-log driver",
        packagingForm: "a directory of shell scripts",
        stateRootWritable: true,
        model: false,
      });
    },
  }),
});

/** Two sample cases of a sample host: the frame runs each against both targets. */
const sampleCases: readonly SuiteCase[] = Object.freeze([
  {
    id: "EP-01/kit-frame/sample-case-one",
    title: "a sample case: the frame hands the implementation and the target of the run",
    proves: ["KIT-FR-02"],
    run(implementation, target) {
      ran.push(`${target.implementationId}:${implementation.id}`);
      assert.equal(implementation.id, target.implementationId);
    },
  },
  {
    id: "EP-01/kit-frame/sample-case-two",
    title: "a second sample case: the frame keeps the cases in the order the host gave",
    proves: ["KIT-FR-02"],
    run(implementation, target) {
      ran.push(`${target.implementationId}:${implementation.id}`);
      assert.ok(target.order === 1 || target.order === 2);
    },
  },
]);

const registered = registerHostConformanceCases({
  targets: hostConformanceTargets(sampleTarget),
  implementationOf(id) {
    if (id === plainShell.id) return plainShell;
    if (id === sampleTarget.implementationId) return sampleImplementation;
    throw new Error(`no implementation for \`${id}\``);
  },
  cases: sampleCases,
});

test("the frame returns the record of the registration: two targets, the host's cases, every run", () => {
  assert.deepEqual(registered, { targetCount: 2, caseCount: 2, caseRuns: 4 });
  // Every case ran against BOTH targets, in the order of the suite: the host
  // first, the plain shell second.
  assert.deepEqual(ran, [
    `${sampleTarget.implementationId}:${sampleTarget.implementationId}`,
    `${plainShell.id}:${plainShell.id}`,
    `${sampleTarget.implementationId}:${sampleTarget.implementationId}`,
    `${plainShell.id}:${plainShell.id}`,
  ]);
});

test("the frame refuses a suite that is not two targets in the order 1, 2", () => {
  assert.throws(
    () =>
      registerHostConformanceCases({
        targets: hostConformanceTargets(sampleTarget).slice(0, 1),
        implementationOf: () => sampleImplementation,
        cases: [],
      }),
    /two targets/,
  );
  assert.throws(
    () =>
      registerHostConformanceCases({
        targets: [
          hostConformanceTargets(sampleTarget)[1]!,
          hostConformanceTargets(sampleTarget)[0]!,
        ],
        implementationOf: () => sampleImplementation,
        cases: [],
      }),
    /order 1, 2/,
  );
});

test("the frame and the target record name no host of this repository", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const sources = [join(here, "host-suite.ts"), join(here, "targets.ts")].map((p) =>
    readFileSync(p, "utf8"),
  );
  for (const source of sources) {
    for (const pattern of [/host-claude-code/, /claude/i, /\.claude-plugin/, /\/specstride:/]) {
      assert.equal(
        pattern.test(source),
        false,
        `${String(pattern)} appears in the frame of the host conformance suite`,
      );
    }
  }
});
