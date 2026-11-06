/**
 * T054 — rules N-12, N-13 and N-14: the events (F141-FR-020).
 *
 * | Rule | Subject | What the rule does |
 * |---|---|---|
 * | N-12 | event vocabulary | "The compatibility projection of the port is compared, not its primary stream" |
 * | N-13 | event typing and duplicate keys | "Lines are read as ordered pairs of key and value with types kept, so that text against number and duplicate keys are compared as they are" |
 * | N-14 | event order | "Order is compared inside each class of writer. Interleaving between classes is not compared" |
 *
 * N-12 acts on the capture of the PORT alone — the reference has no primary
 * stream — which is why CT-141-120 gives it input in the port's form that the test
 * holds (T032). It is the only rule besides N-29 of which that is true.
 *
 * N-13 and N-14 replace nothing: they say HOW the comparison reads what is there.
 * N-13 is already carried out by the capture, which keeps every pair in document
 * order with its type and keeps the raw line beside it (`src/capture/events.ts`);
 * the rule counts the records it was applied to and asserts that the capture is in
 * that form, so a capture that lost a duplicate key cannot slip past. N-14 sorts
 * nothing: it GROUPS the records by the class of their writer, so that order
 * inside a class is compared and interleaving between classes is not.
 */
import type { EventRecord } from "../capture/events.ts";
import type { MutableCapture, NormalizeContext, Rule } from "./types.ts";

/** The classes of writer whose order is compared apart (N-14). */
export const WRITER_CLASSES = ["orchestrator", "proposer", "critic", "engine", "agent"] as const;
export type WriterClass = (typeof WRITER_CLASSES)[number] | "other";

/** The key under which the port carries its primary stream before the projection. */
export const PRIMARY_MARKER = "primary" as const;

/** The class of the writer of one record, from the record itself. */
export function writerClassOf(record: EventRecord): WriterClass {
  const pair = record.pairs.find(
    (p) => p.key === "writer" || p.key === "role" || p.key === "component",
  );
  const said = String(pair?.value ?? "");
  for (const known of WRITER_CLASSES) if (said === known) return known;
  // The baseline writes its own events without a writer field; the file they are
  // in is the class, which the capture carries.
  if (/proposer/.test(record.file)) return "proposer";
  if (/critic/.test(record.file)) return "critic";
  if (/events?\.jsonl$/.test(record.file)) return "orchestrator";
  return "other";
}

/**
 * N-12: on the port, the compatibility projection is what is compared. A capture
 * of the port whose surface `events` still carries the primary stream is reduced
 * to the projection here; the primary stream is the surface `events-primary` of
 * the second suite (S-14) and is never compared with the reference.
 */
export const N12: Rule = {
  id: "N-12",
  subject: "Event vocabulary",
  surfaces: ["events"],
  apply(capture: MutableCapture, context: NormalizeContext): number {
    const events = capture.surfaces["events"] as
      { files?: string[]; records?: EventRecord[] } | undefined;
    if (events?.records === undefined) return 0;
    if (context.side !== "port") {
      // The rule acts on the capture of the port alone; on the reference it is
      // applied to nothing and counts nothing.
      return 0;
    }
    const projection = events.records.filter(
      (record) =>
        !record.pairs.some((p) => p.key === "stream" && String(p.value) === PRIMARY_MARKER) &&
        !/primary/.test(record.file),
    );
    const removed = events.records.length - projection.length;
    capture.surfaces["events"] = {
      files: (events.files ?? []).filter((f) => !/primary/.test(f)),
      records: projection,
      comparedStream: "compatibility projection",
    };
    // The count is the number of records the rule was applied to (F141-FR-020):
    // the projection it kept plus the primary records it left out.
    return projection.length + removed;
  },
};

/**
 * N-13: the lines are read as ordered pairs with the types kept. The capture is
 * already in that form; the rule asserts it and counts the records it read.
 */
export const N13: Rule = {
  id: "N-13",
  subject: "Event typing and duplicate keys",
  surfaces: ["events"],
  apply(capture: MutableCapture): number {
    const events = capture.surfaces["events"] as { records?: EventRecord[] } | undefined;
    const records = events?.records ?? [];
    for (const record of records) {
      if (!Array.isArray(record.pairs) || typeof record.raw !== "string") {
        throw new Error(
          `N-13: the capture of an event record is not in the form the rule compares (ordered ` +
            `pairs of key and value with the types kept, and the raw line beside them): ` +
            `${JSON.stringify(record).slice(0, 200)}`,
        );
      }
    }
    return records.length;
  },
};

/**
 * N-14: order is compared inside each class of writer; interleaving between
 * classes is not compared. The records are grouped by class, each group keeping
 * the order it had.
 */
export const N14: Rule = {
  id: "N-14",
  subject: "Event order",
  surfaces: ["events"],
  apply(capture: MutableCapture): number {
    const events = capture.surfaces["events"] as
      { files?: string[]; records?: EventRecord[]; comparedStream?: string } | undefined;
    const records = events?.records ?? [];
    if (records.length === 0) return 0;
    const byClass: Record<string, EventRecord[]> = {};
    for (const record of records) {
      const writer = writerClassOf(record);
      (byClass[writer] ??= []).push(record);
    }
    capture.surfaces["events"] = {
      ...(events ?? {}),
      records: undefined,
      byWriterClass: Object.fromEntries(
        Object.keys(byClass)
          .sort()
          .map((writer) => [writer, byClass[writer]]),
      ),
      orderComparedInside: "each class of writer",
    };
    return records.length;
  },
};
