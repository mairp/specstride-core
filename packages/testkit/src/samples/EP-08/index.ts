/**
 * T111 — the sample implementation of EP-08, the event sink, outside the core,
 * registered from the test tree (annex A, §A.4, F100-FR-018; annex X, §X.10,
 * F100-FR-222).
 *
 * The sample sink that keeps events in memory, which §C.10 "Proving test"
 * names. It ignores event types it does not know, never projects a type that
 * starts with `x.`, and contains every error.
 */
import { isNeverProjected } from "@specstride/contracts/ep/event-sink";
import type { DeliveryStatus, MajorRange, SinkContext } from "@specstride/contracts/ep/event-sink";
import type { EventEnvelope } from "@specstride/contracts/envelope/event";
import type { Implementation } from "../../conformance/frame.ts";

/** The events the sink kept, in the order of `seq`. */
export const kept: EventEnvelope[] = [];

/** The range of event schema majors the sink accepts (§C.10, Inputs). */
export const ACCEPTS_MAJORS: MajorRange = Object.freeze({ from: 1, to: 1 });

let opened: SinkContext | undefined;
let lastStatus = "idle";
let lastReason: string | null = null;

export const operations = Object.freeze({
  open(context: SinkContext): Promise<void> {
    opened = context;
    kept.length = 0;
    lastStatus = "open";
    lastReason = null;
    return Promise.resolve();
  },
  write(event: EventEnvelope): Promise<void> {
    if (opened === undefined) {
      lastStatus = "skipped";
      lastReason = "the sink is not open";
      return Promise.resolve();
    }
    if (isNeverProjected(event.type)) {
      lastStatus = "ignored";
      lastReason = "an event type of a third party is never projected";
      return Promise.resolve();
    }
    if (event.v < ACCEPTS_MAJORS.from || event.v > ACCEPTS_MAJORS.to) {
      lastStatus = "ignored";
      lastReason = `the major ${event.v} is outside the range the sink accepts`;
      return Promise.resolve();
    }
    kept.push(event);
    lastStatus = "delivered";
    lastReason = null;
    return Promise.resolve();
  },
  flush(): Promise<void> {
    return Promise.resolve();
  },
  close(): Promise<void> {
    opened = undefined;
    lastStatus = "closed";
    return Promise.resolve();
  },
  status(): DeliveryStatus {
    return Object.freeze({
      line: `sink=sample-memory state=${opened === undefined ? "closed" : "open"} last=${lastStatus}`,
      record: Object.freeze({
        sinkLabel: "sample-memory",
        receiverState: opened === undefined ? "closed" : "open",
        lastDeliveryStatus: lastStatus,
        reason: lastReason,
      }),
    });
  },
});

export const implementation: Implementation = Object.freeze({
  ep: "EP-08",
  pointId: "specstride.event-sink/1",
  id: "sample-event-sink-memory",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
