/**
 * T048 — the surface `events` (S-06, F141-FR-019).
 *
 * "Every event file. On the port side the compatibility projection." The oracle
 * consumes `specstride.event-sink/1` (EP-08) and compares what the projection
 * writes; the primary stream of the port is the surface `events-primary` of the
 * second suite (S-14), not this one. That is the rule N-12 of feature 100, and
 * `src/normalize/events.ts` is where it is applied — this module only reads.
 *
 * A line is read as an ordered list of pairs of key and value with the types
 * kept (N-13), so text against number and duplicate keys compare as they are. So
 * the capture keeps the RAW line beside the parsed pairs: a normalizer that
 * reads only a parsed object would have lost a duplicate key before the rule
 * could see it.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";

import { assertTheRunHasEnded, type CaptureContext, type SurfaceCapture } from "./types.ts";

/** One pair of a line of an event file, with its type kept. */
export type EventPair = {
  readonly key: string;
  readonly value: unknown;
  readonly type: "string" | "number" | "boolean" | "null" | "object" | "array";
};

/** One record of an event file. */
export type EventRecord = {
  readonly file: string;
  readonly line: number;
  /** The raw line, so a duplicate key survives to the rule that compares it. */
  readonly raw: string;
  /** The pairs in the order the line carries them; a duplicate key appears twice. */
  readonly pairs: readonly EventPair[];
};

/** The value of the surface `events`. */
export type EventsCapture = {
  readonly files: readonly string[];
  readonly records: readonly EventRecord[];
};

function typeOf(value: unknown): EventPair["type"] {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  const kind = typeof value;
  if (kind === "string" || kind === "number" || kind === "boolean") return kind;
  return "object";
}

/**
 * The keys of the top-level object of a line, in the order the TEXT carries
 * them, with a duplicate key appearing once per occurrence. `JSON.parse` keeps
 * only the last of two equal keys, so the keys are scanned off the text: N-13
 * compares duplicate keys as they are, and a parsed object has already lost one.
 */
export function topLevelKeys(line: string): readonly string[] {
  const keys: string[] = [];
  let depth = 0;
  let i = 0;
  while (i < line.length) {
    const ch = line[i] as string;
    if (ch === '"') {
      // Read the string, then look for a colon after it.
      let j = i + 1;
      let text = "";
      while (j < line.length) {
        const c = line[j] as string;
        if (c === "\\") {
          text += line.slice(j, j + 2);
          j += 2;
          continue;
        }
        if (c === '"') break;
        text += c;
        j += 1;
      }
      let k = j + 1;
      while (k < line.length && /\s/.test(line[k] as string)) k += 1;
      if (depth === 1 && line[k] === ":") keys.push(JSON.parse(`"${text}"`) as string);
      i = j + 1;
      continue;
    }
    if (ch === "{" || ch === "[") depth += 1;
    else if (ch === "}" || ch === "]") depth -= 1;
    i += 1;
  }
  return Object.freeze(keys);
}

/**
 * The pairs of one line, in the order the line carries them, with the types kept
 * and duplicate keys kept (N-13). For a duplicate key the value is the one the
 * parser kept; the raw line stays in the record, which is what the rule reads.
 */
export function pairsOfLine(line: string): readonly EventPair[] {
  const top = JSON.parse(line) as unknown;
  if (top === null || typeof top !== "object" || Array.isArray(top)) {
    return Object.freeze([{ key: "", value: top, type: typeOf(top) }]);
  }
  const asObject = top as Record<string, unknown>;
  const keys = topLevelKeys(line);
  const used = keys.length > 0 ? keys : Object.keys(asObject);
  return Object.freeze(
    used.map((key) => ({ key, value: asObject[key], type: typeOf(asObject[key]) })),
  );
}

/** Read one event file into records. A line that is no record is kept raw. */
export function readEventFile(file: string): readonly EventRecord[] {
  if (!existsSync(file)) return [];
  const text = readFileSync(file, "utf8");
  if (text.trim() === "") return [];
  return Object.freeze(
    text
      .replace(/\n$/, "")
      .split("\n")
      .map((raw, i) => {
        let pairs: readonly EventPair[] = [];
        try {
          pairs = pairsOfLine(raw);
        } catch {
          pairs = Object.freeze([{ key: "", value: raw, type: "string" as const }]);
        }
        return Object.freeze({ file: basename(file), line: i + 1, raw, pairs });
      }),
  );
}

/** Capture the surface `events`: every event file of this side. */
export function captureEvents(
  context: CaptureContext,
): SurfaceCapture & { readonly value: EventsCapture } {
  assertTheRunHasEnded(context, "events");
  const files = [...context.eventFiles].sort();
  return {
    surface: "events",
    id: "S-06",
    value: {
      files: Object.freeze(files.map((f) => basename(f))),
      records: Object.freeze(files.flatMap((f) => readEventFile(f))),
    },
  };
}
