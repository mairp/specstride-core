/**
 * T149 — the sample implementation of EP-09, the UI read model, outside the
 * core, registered from the test tree (annex A, §A.4, F100-FR-018; annex X,
 * §X.10, F100-FR-222).
 *
 * A read model whose `project` is a pure fold of `reduce` over the events,
 * so that projecting a batch equals folding event by event. It takes no file
 * handle: the caller hands it the events and the named state files.
 */
import { CHANGE_SIGNATURE_LENGTH, STATE_WHEN_UNKNOWN } from "@specstride/contracts/ep/view";
import type { Cursor, ProjectInput, RunView } from "@specstride/contracts/ep/view";
import type { EventEnvelope } from "@specstride/contracts/envelope/event";
import type { Implementation } from "../../conformance/frame.ts";

/** The states the sample knows; anything else is shown as `unknown`. */
export const KNOWN_STATES = ["starting", "running", "blocked-on-human", "finished"] as const;

function emptyCursor(file: string): Cursor {
  return Object.freeze({
    file,
    offset: 0,
    lastSeq: 0,
    changeSignature: "0".repeat(CHANGE_SIGNATURE_LENGTH),
  });
}

function signature(lastSeq: number, now: string): string {
  let hash = 0;
  for (const ch of `${lastSeq}\u0000${now}`) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash.toString(16).padStart(CHANGE_SIGNATURE_LENGTH, "0").slice(0, CHANGE_SIGNATURE_LENGTH);
}

export const operations = Object.freeze({
  project(input: ProjectInput): RunView {
    const declared = (input.runRecord as { state?: string } | undefined)?.state;
    const state =
      declared !== undefined && (KNOWN_STATES as readonly string[]).includes(declared)
        ? declared
        : STATE_WHEN_UNKNOWN;
    const base: RunView = Object.freeze({
      state,
      dead: input.leaseProbe === "stale-owner-dead",
      stale: false,
      launchAbandoned: input.leaseProbe === "free" && input.newestLaunchRecord !== undefined,
      lanes: Object.freeze([Object.freeze({ id: "main", label: "main line", state })]),
      attention: Object.freeze(
        state === STATE_WHEN_UNKNOWN
          ? [Object.freeze({ id: "state-unknown", text: `the state \`${declared}\` is unknown` })]
          : [],
      ),
      budgets: Object.freeze({}),
      phase: null,
      attempt: null,
      pass: null,
      strategy: null,
      ownerText: null,
      cursor: input.cursor ?? emptyCursor("run:events"),
    });
    return input.events.reduce((view, event) => operations.reduce(view, event), base);
  },
  reduce(view: RunView, event: EventEnvelope): RunView {
    const lastSeq = Math.max(view.cursor.lastSeq, event.seq);
    return Object.freeze({
      ...view,
      lanes: view.lanes,
      cursor: Object.freeze({
        ...view.cursor,
        lastSeq,
        offset: view.cursor.offset + 1,
        changeSignature: signature(lastSeq, event.ts),
      }),
    });
  },
});

export const implementation: Implementation = Object.freeze({
  ep: "EP-09",
  pointId: "specstride.view/1",
  id: "sample-view-read-model",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
