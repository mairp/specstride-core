/**
 * T033 — the sample sink of EP-08 that keeps events in memory (F111-FR-036).
 *
 * F111-FR-036: *The conformance suite of EP-08 MUST hold a slow sink, a
 * throwing sink and a dead collector, and MUST assert equal exit code and equal
 * event file with and without the failing sink. A sample sink that keeps events
 * in memory MUST be registered from the test tree. No core file MUST name the
 * sample.*
 *
 * It lives in the TEST TREE and nowhere else. Two things follow, and both are
 * checked rather than asserted in prose:
 *
 *   - no core file names it — `packages/testkit/src/samples/EP-08/`, the
 *     module name `sample-sink` and the id it registers under are all refused
 *     in a source file of a core package. The check runs in the build, in
 *     `src/conformance/EP-08/suite.test.ts` (CT-111-136/c), beside the second
 *     core rule of the import-boundary check, which refuses the sample path
 *     for every point at once;
 *   - adding or removing it changes no core file — the fixtures of the suite
 *     reach it by the path in `SAMPLE_SINK_FILE`, which is a constant of this
 *     file and of the test tree.
 *
 * The sample sink of feature 100 is `index.ts` beside this file: it is the one
 * the conformance FRAME registers for the point. This one is feature 111's
 * sample for the behaviour cases — a fresh instance per run, with its own
 * memory, which is what a comparison of two runs needs.
 */
import { isNeverProjected } from "@specstride/contracts/ep/event-sink";
import type { DeliveryStatus, MajorRange, SinkContext } from "@specstride/contracts/ep/event-sink";
import type { EventEnvelope } from "@specstride/contracts/envelope/event";

/** The path of this file, relative to the root of the repository. */
export const SAMPLE_SINK_FILE = "packages/testkit/src/samples/EP-08/sample-sink.ts" as const;

/** The id this sample registers under. */
export const SAMPLE_SINK_ID = "sample-in-memory-sink" as const;

/** F111-FR-036 — the sample keeps the events it receives in memory. */
export const SAMPLE_SINK_KEEPS_EVENTS_IN_MEMORY = true as const;

/** The range of event majors the sample accepts (§C.10, Inputs). */
export const SAMPLE_ACCEPTS_MAJORS: MajorRange = Object.freeze({ from: 1, to: 1 });

/** The sample sink: the EP-08 shape, with the events it kept. */
export type SampleSink = {
  readonly label: string;
  readonly acceptsMajors: MajorRange;
  /** The events the sink kept, in the order of `seq`. */
  readonly kept: readonly EventEnvelope[];
  open(context: SinkContext): Promise<void>;
  write(event: EventEnvelope): Promise<void>;
  flush(): Promise<void>;
  close(): Promise<void>;
  status(): DeliveryStatus;
};

/**
 * One sample sink with its own memory. A fresh instance per run, so that two
 * runs of the same fixture do not share state.
 */
export function sampleSink(label: string = SAMPLE_SINK_ID): SampleSink {
  const kept: EventEnvelope[] = [];
  let opened: SinkContext | undefined;
  let last = "idle";

  return {
    label,
    acceptsMajors: SAMPLE_ACCEPTS_MAJORS,
    kept,
    open(context: SinkContext): Promise<void> {
      opened = context;
      kept.length = 0;
      last = "open";
      return Promise.resolve();
    },
    write(event: EventEnvelope): Promise<void> {
      if (opened === undefined) {
        last = "skipped";
        return Promise.resolve();
      }
      // The unknown-value rule of §C.10: a third-party type is never
      // projected, and a major outside the declared range is ignored.
      if (isNeverProjected(event.type)) {
        last = "ignored";
        return Promise.resolve();
      }
      if (event.v < SAMPLE_ACCEPTS_MAJORS.from || event.v > SAMPLE_ACCEPTS_MAJORS.to) {
        last = "ignored";
        return Promise.resolve();
      }
      kept.push(event);
      last = "accepted";
      return Promise.resolve();
    },
    flush(): Promise<void> {
      return Promise.resolve();
    },
    close(): Promise<void> {
      opened = undefined;
      last = "closed";
      return Promise.resolve();
    },
    status(): DeliveryStatus {
      return Object.freeze({
        line: `sink=${label} state=${opened === undefined ? "closed" : "open"} kept=${kept.length}`,
        record: Object.freeze({
          sinkLabel: label,
          receiverState: opened === undefined ? "closed" : "open",
          lastDeliveryStatus: last,
          reason: null,
        }),
      });
    },
  };
}
