/**
 * T052 — rule N-04, timestamps (F141-FR-020, F141-FR-021).
 *
 * "Every time field, log header and file stamp of a transcript becomes a
 * placeholder. Order is kept: values do not decrease where the reference's do
 * not."
 *
 * The second sentence is an ASSERTION, not a replacement, and it is made BEFORE
 * the replacement — once every time is `<time>` the order cannot be seen any
 * more. `timeValuesOf` is therefore exported for `src/compare/assertions.ts`,
 * which makes the assertion of F141-FR-021 on the capture as it was captured.
 */
import { collect, replaceInSurfaces } from "./walk.ts";
import type { MutableCapture, Rule } from "./types.ts";

/** The forms of a time the two baselines write. */
export const TIME_PATTERNS: readonly RegExp[] = Object.freeze([
  // ISO 8601 with or without a zone: 2026-10-01T19:31:18+00:00, …Z, … 19:31:18.
  /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/g,
  // The compact stamp the Specstride baseline puts in a file NAME:
  // `verdicts/phase1.attempt1.20261001-214754.txt`. It is a time and not a run
  // id — the run id carries the process id as its third part and N-03, which runs
  // before this rule, has already replaced it.
  /\b\d{8}-\d{6}\b/g,
  // The compact UTC stamp with microseconds that the dsh plugin request protocol
  // puts in the NAME of an archived request and of its receipt:
  // `20261002T110740.402031Z.receipt.json`, from
  // `started.strftime("%Y%m%dT%H%M%S.%fZ")` (`lib/dsh_plugin_requests.py:108`
  // at `9cab15d`). It is a file stamp, which is this rule's subject, and the
  // compact pattern above does not reach it: that one has a hyphen between the
  // date and the time where this one has a `T`.
  /\b\d{8}T\d{6}(?:\.\d+)?Z\b/g,
  // A bare date, as a log header writes it.
  /\b\d{4}-\d{2}-\d{2}\b/g,
  // Seconds since the epoch, ten digits, with the fraction where the writer has
  // one: the `ts` field of an event line of the reference is
  // `1790890335.544232833` and of the Python writer `1790890335.371740`. The
  // fraction belongs to the SAME time, so it is part of this pattern and not left
  // behind as a value of its own.
  /\b1[0-9]{9}(?:\.[0-9]+)?\b/g,
  // The clock of a presenter line. `hhmmss` of `lib/present.py:110` at `9cab15d`
  // writes the time of an event as `HH:MM:SS` and the timeline, the card and the
  // plain view all put it at the START of the line — the only place this form
  // occurs, which is why the pattern is anchored there: a bare `HH:MM:SS`
  // anywhere in a line would also eat a value that is no time. It is a time
  // field of an output line, so it is this rule's subject and not a rule of its
  // own (the oracle implements N-01 to N-29 and no other rule).
  /(?<=(?:^|\n) *)\d{2}:\d{2}:\d{2}(?=\s)/g,
]);

/** The placeholder a time becomes. */
export const TIME_PLACEHOLDER = "<time>" as const;

/** Every time a capture holds, in the order it holds them. */
export function timeValuesOf(value: unknown): readonly string[] {
  const found: string[] = [];
  for (const text of collect(value, (node) => (typeof node === "string" ? node : undefined))) {
    for (const pattern of TIME_PATTERNS) {
      for (const match of text.matchAll(new RegExp(pattern.source, "g"))) found.push(match[0]);
    }
  }
  return Object.freeze(found);
}

/** N-04. */
export const N04: Rule = {
  id: "N-04",
  subject: "Timestamps",
  surfaces: [],
  apply(capture: MutableCapture): number {
    return replaceInSurfaces(capture.surfaces, [], (value) => {
      let text = value;
      for (const pattern of TIME_PATTERNS) {
        text = text.replace(new RegExp(pattern.source, "g"), TIME_PLACEHOLDER);
      }
      return text;
    });
  },
};
