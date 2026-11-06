/**
 * T110 — the conformance suite at contract level for EP-08, the event sink
 * (annex C, §C.10): CT-100-204, CT-100-205, CT-100-206.
 *
 * Before the named cases the suite checks the five things every suite at
 * contract level checks (annex A, §A.4). The behaviour of EP-08 belongs to
 * feature 111, with 144 for the compatibility projection and 128 for the OTLP
 * exporter and the Loki sink; its behaviour cases go in this folder beside
 * this file.
 */
import assert from "node:assert/strict";
import {
  AS_IS_LABELS,
  CAPTURED_CONTENT_PASSES_THE_REDACTOR,
  COMPATIBILITY_PROJECTION_SWITCH,
  COMPATIBILITY_PROJECTION_WRITES_THE_PRIMARY_STREAM,
  CORE_GUARANTEES,
  ERROR_IS_CONTAINED_IN_THE_SINK,
  EVENT_THE_WRITER_RECORDS,
  FAILURE_PATH,
  MARK_WHEN_THE_REDACTOR_CANNOT_RUN,
  OPERATIONS,
  POINT_ID,
  THIRD_PARTY_PREFIX,
  isNeverProjected,
} from "@specstride/contracts/ep/event-sink";
import { MAJOR as EVENT_MAJOR, SCHEMA as EVENT_SCHEMA } from "@specstride/contracts/envelope/event";
import type { EventEnvelope } from "@specstride/contracts/envelope/event";
import { ACCEPTS_MAJORS, implementation, kept } from "../../samples/EP-08/index.ts";
import { plainerPathOf } from "../degrade.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-08" as const;

function event(type: string, seq = 1): EventEnvelope {
  return {
    schema: EVENT_SCHEMA,
    v: EVENT_MAJOR,
    seq,
    ts: "2026-10-01T00:00:00.000Z",
    type,
    runId: "run-1",
    launchId: "launch-1",
    data: {},
  };
}

const context = Object.freeze({
  runId: "run-1",
  launchId: "launch-1",
  engineStartId: "start-1",
  feature: "100-specstride",
  workspaceId: "ws-1",
  labels: Object.freeze({ job: "j", "service.name": "s", task: "t", backend: "b" }),
  profile: "default",
  switches: Object.freeze({}),
  content: Object.freeze({
    byReference: () => Promise.resolve(undefined),
    asIsSnippetForTheCompatibilityProjection: () => Promise.resolve("as-is"),
  }),
  compatibilityProjection: Object.freeze({ asIsNameOf: () => null }),
});

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-204",
    title:
      "a sink offers `open`, `write`, `flush`, `close` and `status`, the context of `open` holds what §C.10 lists, and a failure changes neither the outcome nor the primary file (F100-FR-104)",
    level: "contract",
    proves: ["F100-FR-104"],
    async run(impl) {
      assert.deepEqual([...OPERATIONS], ["open", "write", "flush", "close", "status"]);
      assert.deepEqual([...AS_IS_LABELS], ["job", "service.name", "task", "backend"]);
      await (operationOf(impl, "open") as (c: unknown) => Promise<void>)(context);
      await (operationOf(impl, "write") as (e: unknown) => Promise<void>)(event("pass.started"));
      assert.equal(kept.length, 1);
      const status = (operationOf(impl, "status") as () => { record: { receiverState: string } })();
      assert.equal(status.record.receiverState, "open");
      assert.equal(ERROR_IS_CONTAINED_IN_THE_SINK, true);
      assert.equal(EVENT_THE_WRITER_RECORDS, "telemetry.delivery");
      assert.ok(CORE_GUARANTEES[0]?.includes("the primary file is written before any sink"));
      await (operationOf(impl, "close") as () => Promise<void>)();
    },
  },
  {
    id: "CT-100-205",
    title:
      "the compatibility projection is a sink of its own with its own switch, and it never writes the primary stream (F100-FR-105)",
    level: "contract",
    proves: ["F100-FR-105"],
    run() {
      assert.equal(COMPATIBILITY_PROJECTION_SWITCH, "compat.legacyEvents");
      assert.equal(COMPATIBILITY_PROJECTION_WRITES_THE_PRIMARY_STREAM, false);
      // The content accessor serves the projection with its own as-is snippets
      // whatever the switch of content capture says.
      assert.equal(typeof context.content.asIsSnippetForTheCompatibilityProjection, "function");
    },
  },
  {
    id: "CT-100-206",
    title:
      "captured content passes the single redaction point and is dropped with a mark when the redactor cannot run (F100-FR-106)",
    level: "contract",
    proves: ["F100-FR-106"],
    run() {
      assert.equal(CAPTURED_CONTENT_PASSES_THE_REDACTOR, true);
      assert.equal(MARK_WHEN_THE_REDACTOR_CANNOT_RUN, "content-dropped-redactor-unavailable");
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-08/operations-exist",
      "EP-08/closed-result-sets",
      "EP-08/degradation",
      "EP-08/unknown-value-rule",
      "EP-08/behaviour-cases",
    ],
    {
      resultSets: [
        {
          operation: "status",
          members: [
            (v: unknown) =>
              ["open", "closed"].includes(
                (v as { record: { receiverState: string } }).record.receiverState,
              ),
          ],
          calls: [[]],
        },
      ],
      throwingOperation: "write",
    },
  ),
  ...named,
  {
    id: "EP-08/third-party-types",
    title:
      "a type that starts with `x.` belongs to third parties: it is never projected and never changes the read model (the unknown-value rule of §C.10)",
    level: "contract",
    proves: ["F100-FR-021"],
    async run(impl) {
      assert.equal(THIRD_PARTY_PREFIX, "x.");
      assert.equal(isNeverProjected("x.something"), true);
      assert.equal(isNeverProjected("pass.started"), false);
      await (operationOf(impl, "open") as (c: unknown) => Promise<void>)(context);
      const before = kept.length;
      await (operationOf(impl, "write") as (e: unknown) => Promise<void>)(event("x.third", 2));
      assert.equal(kept.length, before);
      await (operationOf(impl, "write") as (e: unknown) => Promise<void>)({
        ...event("pass.ended", 3),
        v: ACCEPTS_MAJORS.to + 1,
      });
      assert.equal(kept.length, before, "an event outside the range the sink accepts is ignored");
      await (operationOf(impl, "close") as () => Promise<void>)();
    },
  },
  {
    id: "EP-08/documented-failure-path",
    title:
      'the plainer path of EP-08 is the sentence its contract file documents under "Failure of an implementation"',
    level: "contract",
    proves: ["F100-FR-019"],
    run() {
      assert.equal(plainerPathOf(EP), FAILURE_PATH);
    },
  },
]);

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
