/**
 * T097 — the conformance suite at contract level for EP-02, the harness port
 * (annex C, §C.1): CT-100-176, CT-100-177, CT-100-178, CT-100-179,
 * CT-100-180, CT-100-181, CT-100-182, CT-100-183.
 *
 * The suite checks, before the named cases, the five things every suite at
 * contract level checks (annex A, §A.4): the operations exist; results stay
 * inside the closed result sets; a throwing implementation degrades to the
 * documented path; the unknown-value rule; and the behaviour cases are added
 * by the content owner, in the folder of the point.
 *
 * The behaviour of EP-02 belongs to feature 109 (registry, port, generic
 * harness adapter) with 124, 125, 126, 130, 131, 134 and 138; its behaviour
 * cases go in this folder beside this file.
 */
import assert from "node:assert/strict";
import {
  BETWEEN_PASSES_OUTCOMES,
  CAPABILITY_LEVELS,
  CAPABILITY_PROVENANCE,
  ENVIRONMENT_ALLOW_LIST_HEADS,
  EXECUTABLE_REFUSED_WHERE,
  FAILURES,
  FAILURE_WHEN_UNKNOWN,
  NATIVE_MEMORY_FOR_A_CRITIC_CLASS_CALL,
  NATIVE_MEMORY_FOR_THE_PROPOSER_BY_DEFAULT,
  OCCASIONS_OF_A_FRESH_SESSION,
  OPERATIONS,
  POINT_ID,
  PROPOSER_SOURCES,
  DISCOVERY_CHANGES_THE_PROPOSER,
  TRANSPORTS,
  UNSHOWN_CAPABILITY_REPORT,
  contextWindowInForce,
} from "@specstride/contracts/ep/harness";
import { implementation } from "../../samples/EP-02/index.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-02" as const;

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-176",
    title: "the port offers the eight operations and the two capability levels (F100-FR-076)",
    level: "contract",
    proves: ["F100-FR-076"],
    run(impl) {
      assert.equal(OPERATIONS.length, 8);
      assert.deepEqual([...CAPABILITY_LEVELS], ["proposer", "completion"]);
      for (const operation of OPERATIONS) {
        assert.equal(typeof operationOf(impl, operation), "function", operation);
      }
    },
  },
  {
    id: "CT-100-177",
    title:
      "every capability value carries its provenance or is null; an unshown capability is `unverified`; the smaller context window is used (F100-FR-077)",
    level: "contract",
    proves: ["F100-FR-077"],
    async run(impl) {
      const capabilities = (await (
        operationOf(impl, "capabilities") as () => Promise<Record<string, unknown>>
      )()) as Record<string, { value: unknown; provenance: unknown }>;
      for (const [name, entry] of Object.entries(capabilities)) {
        assert.ok(
          entry.value === null || CAPABILITY_PROVENANCE.includes(entry.provenance as never),
          `the capability \`${name}\` carries neither a provenance of the closed set nor a null value`,
        );
      }
      assert.equal(UNSHOWN_CAPABILITY_REPORT, "unverified");
      assert.equal(contextWindowInForce(200000, 100000), 100000);
      assert.equal(contextWindowInForce(100000, 200000), 100000);
      assert.equal((capabilities["contextWindow"] as { value: number }).value, 100000);
    },
  },
  {
    id: "CT-100-178",
    title:
      "the proposer comes from a flag, the environment, configuration or the shipped default only, and discovery never changes it (F100-FR-078)",
    level: "contract",
    proves: ["F100-FR-078"],
    run() {
      assert.deepEqual(
        [...PROPOSER_SOURCES],
        ["flag", "environment", "configuration", "shipped-default"],
      );
      assert.equal(DISCOVERY_CHANGES_THE_PROPOSER, false);
    },
  },
  {
    id: "CT-100-179",
    title: "the environment of every call is an allow-list (F100-FR-079)",
    level: "contract",
    proves: ["F100-FR-079"],
    async run(impl) {
      assert.equal(ENVIRONMENT_ALLOW_LIST_HEADS.length, 5);
      const handle = await (
        operationOf(impl, "startPass") as (i: unknown) => Promise<{ sessionId: string }>
      )({
        promptReference: "prompt:1",
        workingDirectory: "/tmp/sample",
        session: { kind: "fresh" },
        model: "sample",
        modelTierOrEffort: "small",
        containment: "C1",
        writeRoot: "/tmp/sample",
        environmentAllowList: ["PATH", "LC_ALL"],
        timeLimitMs: 1000,
        transport: "subprocess",
      });
      assert.equal(typeof handle.sessionId, "string");
    },
  },
  {
    id: "CT-100-180",
    title:
      "an executable inside the workspace or in a world-writable directory is refused (F100-FR-080)",
    level: "contract",
    proves: ["F100-FR-080"],
    run() {
      assert.deepEqual(
        [...EXECUTABLE_REFUSED_WHERE],
        ["inside the workspace", "in a directory that everyone may write"],
      );
    },
  },
  {
    id: "CT-100-181",
    title:
      "a transport is a property of a harness adapter, from the closed set of three (F100-FR-081)",
    level: "contract",
    proves: ["F100-FR-081"],
    async run(impl) {
      assert.deepEqual([...TRANSPORTS], ["subprocess", "sdk-in-process", "direct-call"]);
      const capabilities = (await (
        operationOf(impl, "capabilities") as () => Promise<Record<string, unknown>>
      )()) as { transports: { value: readonly string[] } };
      for (const transport of capabilities.transports.value) {
        assert.ok(TRANSPORTS.includes(transport as never), transport);
      }
    },
  },
  {
    id: "CT-100-182",
    title:
      "harness-native memory is off for every critic-class call and off by default for the proposer (F100-FR-082)",
    level: "contract",
    proves: ["F100-FR-082"],
    run() {
      assert.equal(NATIVE_MEMORY_FOR_A_CRITIC_CLASS_CALL, "off");
      assert.equal(NATIVE_MEMORY_FOR_THE_PROPOSER_BY_DEFAULT, "off");
    },
  },
  {
    id: "CT-100-183",
    title: "the eight occasions each start a fresh session (F100-FR-083)",
    level: "contract",
    proves: ["F100-FR-083"],
    async run(impl) {
      assert.equal(OCCASIONS_OF_A_FRESH_SESSION.length, 8);
      const result = await (
        operationOf(impl, "complete") as (
          i: unknown,
        ) => Promise<{ initialRecord: { sessionId: string } }>
      )({
        prompt: "one prompt",
        model: "sample",
        outputCap: 1000,
        budgetCap: 1,
        form: "tool-less",
        emptyWorkingDirectory: "/tmp/empty",
        sessionId: "minted-1",
      });
      assert.equal(result.initialRecord.sessionId, "minted-1");
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-02/operations-exist",
      "EP-02/closed-result-sets",
      "EP-02/degradation",
      "EP-02/unknown-value-rule",
      "EP-02/behaviour-cases",
    ],
    {
      resultSets: [
        {
          operation: "betweenPasses",
          members: [(v: unknown) => BETWEEN_PASSES_OUTCOMES.includes(outcomeLiteral(v) as never)],
          calls: [[{}, {}, "/tmp/sample"]],
        },
        {
          operation: "classify",
          members: [(v: unknown) => FAILURES.includes((v as { failure: string }).failure as never)],
          calls: [[{ status: { code: 429, headers: {} } }], [{ errorText: "who knows" }]],
        },
      ],
      throwingOperation: "startPass",
    },
  ),
  ...named,
]);

function outcomeLiteral(value: unknown): string {
  const v = value as { outcome: string; result?: number };
  return v.outcome === "stop" ? `stop:${v.result}` : v.outcome;
}

/** An unknown failure is `agent_failure` (the unknown-value rule of §C.1). */
export const FAILURE_FOR_AN_UNKNOWN = FAILURE_WHEN_UNKNOWN;

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
