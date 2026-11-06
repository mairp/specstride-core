/**
 * T148 — the conformance suite at contract level for EP-09, the UI read model
 * `RunView` (annex G, §G.6): CT-100-288.
 *
 * Before the named case the suite checks the five things every suite at
 * contract level checks (annex A, §A.4). The behaviour of EP-09 belongs to
 * feature 129, which also delivers the schema `specstride.view/1`; its
 * behaviour cases go in this folder beside this file.
 */
import assert from "node:assert/strict";
import {
  A_RENDERER_IS_GIVEN_A_FILE_HANDLE,
  A_TORN_LAST_LINE_IS_TOLERATED,
  CHANGE_SIGNATURE_LENGTH,
  CORE_GUARANTEES,
  DERIVED_CONDITIONS,
  MAJOR_OUTSIDE_THE_RANGE_MARKS,
  NAMED_STATE_FILES,
  OPERATIONS,
  POINT_ID,
  STATE_WHEN_UNKNOWN,
  TEXT_FROM_A_RUN_IS_RENDERED_AS_TEXT,
  unknownStateItem,
} from "@specstride/contracts/ep/view";
import { MAJOR as EVENT_MAJOR, SCHEMA as EVENT_SCHEMA } from "@specstride/contracts/envelope/event";
import type { EventEnvelope } from "@specstride/contracts/envelope/event";
import { KNOWN_STATES, implementation } from "../../samples/EP-09/index.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-09" as const;

function event(seq: number, type = "pass.started"): EventEnvelope {
  return {
    schema: EVENT_SCHEMA,
    v: EVENT_MAJOR,
    seq,
    ts: `2026-10-01T00:00:0${seq}.000Z`,
    type,
    runId: "run-1",
    launchId: "launch-1",
    data: {},
  };
}

const input = Object.freeze({
  events: Object.freeze([event(1), event(2), event(3)]),
  runRecord: Object.freeze({ state: "running" }),
  terminalRecord: undefined,
  pauseRecord: undefined,
  leaseProbe: "held-live",
  newestLaunchRecord: undefined,
  supervisionRecord: undefined,
  processTableSearch: Object.freeze([]),
  handshakeLimitMs: 5000,
  now: "2026-10-01T00:00:10.000Z",
});

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-288",
    title:
      "the read model offers the pure operations `project` and `reduce` with a cursor held by the caller; the event stream and the named state files are its only inputs, and an attention item for an unknown state names it (F100-FR-188)",
    level: "contract",
    proves: ["F100-FR-188"],
    run(impl) {
      assert.deepEqual([...OPERATIONS], ["project", "reduce"]);
      assert.deepEqual([...DERIVED_CONDITIONS], ["dead", "stale", "launch-abandoned"]);
      assert.equal(NAMED_STATE_FILES.length, 3);
      const project = operationOf(impl, "project") as (i: unknown) => Record<string, unknown>;
      const reduce = operationOf(impl, "reduce") as (
        v: unknown,
        e: unknown,
      ) => Record<string, unknown>;
      const view = project(input);
      assert.equal(view["state"], "running");
      assert.equal(typeof view["dead"], "boolean");
      assert.equal(typeof view["stale"], "boolean");
      assert.equal(typeof view["launchAbandoned"], "boolean");
      // The cursor is held by the caller: it comes back in the view.
      const cursor = view["cursor"] as { lastSeq: number; changeSignature: string };
      assert.equal(cursor.lastSeq, 3);
      assert.equal(cursor.changeSignature.length, CHANGE_SIGNATURE_LENGTH);
      // Projecting a batch equals folding event by event.
      const folded = input.events.reduce((v, e) => reduce(v, e), project({ ...input, events: [] }));
      assert.deepEqual(folded["cursor"], view["cursor"]);
      // `project` is pure: the same input gives the same view.
      assert.deepEqual(project(input), view);
      // An unknown state of the run is shown as `unknown` with an attention item.
      const unknown = project({ ...input, runRecord: { state: "no-such-state" } });
      assert.equal(unknown["state"], STATE_WHEN_UNKNOWN);
      const attention = unknown["attention"] as readonly { id: string }[];
      assert.equal(attention.length, 1);
      assert.equal(attention[0]?.id, "state-unknown");
      assert.match(unknownStateItem("no-such-state").text, /no-such-state/);
      assert.ok(KNOWN_STATES.includes("blocked-on-human"));
      assert.equal(A_TORN_LAST_LINE_IS_TOLERATED, true);
      assert.equal(MAJOR_OUTSIDE_THE_RANGE_MARKS, "stale");
      assert.equal(A_RENDERER_IS_GIVEN_A_FILE_HANDLE, false);
      assert.equal(TEXT_FROM_A_RUN_IS_RENDERED_AS_TEXT, true);
      assert.equal(CORE_GUARANTEES.length, 5);
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-09/operations-exist",
      "EP-09/closed-result-sets",
      "EP-09/degradation",
      "EP-09/unknown-value-rule",
      "EP-09/behaviour-cases",
    ],
    {
      resultSets: [
        {
          operation: "project",
          members: [
            (v: unknown) => {
              const state = (v as { state: string }).state;
              return (
                (KNOWN_STATES as readonly string[]).includes(state) || state === STATE_WHEN_UNKNOWN
              );
            },
          ],
          calls: [[input], [{ ...input, runRecord: { state: "no-such-state" } }]],
        },
      ],
      throwingOperation: "project",
    },
  ),
  ...named,
]);

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
