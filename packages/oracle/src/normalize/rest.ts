/**
 * T056 — rules N-21 to N-29 (F141-FR-020).
 *
 * | Rule | Subject | What the rule does |
 * |---|---|---|
 * | N-21 | colour | "Captures run with colour off; a fixture that tests colour compares the escape sequences as written" |
 * | N-22 | objects of the repository | "Hashes of commits become numbered placeholders; message, tree content and the absence of a push are compared" |
 * | N-23 | counter files and transcripts of stub agents | "Counter files are left out of the tree; transcripts are compared after N-01 to N-08" |
 * | N-24 | prompt text | "Prompts are compared in full after N-01 to N-08" |
 * | N-25 | caches of the languages | "Left out; their presence inside the working directory is a failure" |
 * | N-26 | telemetry payloads | "Compared at the stub sink after N-03, N-04 and N-07" |
 * | N-27 | sorting that depends on the locale | "Both sides run with the same locale; the comparator does not sort for them" |
 * | N-28 | legacy state and names | "The behaviour of the legacy command names, legacy variables and the pre-v2 layout is not compared" |
 * | N-29 | field `schema` of a reverse-run source inventory | "The key `schema` is removed from the source inventory of a reverse run before the inventory is compared" |
 *
 * N-29 acts on the capture of the PORT alone: the as-is inventory carries
 * `schema_version` 1 and no field `schema` (DV-116), so on the reference the rule
 * has nothing to remove. It and N-12 are the two rules of which that is true, and
 * CT-141-120 gives both input in the port's form that the test holds (T032).
 *
 * N-25 and N-28 LEAVE A SUBJECT OUT and count what they left out; N-21, N-24 and
 * N-27 compare as written and count the values they were applied to
 * (F141-FR-020).
 */
import { collect, countStrings, numberer, replaceInSurfaces } from "./walk.ts";
import type { EventRecord } from "../capture/events.ts";
import type { TreeEntry } from "../capture/tree.ts";
import type { MutableCapture, NormalizeContext, Rule } from "./types.ts";

/** An escape sequence of a terminal. */
// The escape character is named by its code point rather than written, so that no
// control character stands in this source file.
const ESCAPE = String.fromCharCode(0x1b);
export const ESCAPE_SEQUENCE = new RegExp(`${ESCAPE}\\[[0-9;]*[A-Za-z]`, "g");

/** The placeholder an escape sequence becomes where the fixture does not test colour. */
export const COLOUR_PLACEHOLDER = "<colour>" as const;

/**
 * N-21: captures run with colour off, so an escape sequence is a difference and
 * not noise — unless the fixture TESTS colour, and then the sequences are compared
 * as written. The rule therefore replaces nothing in the ordinary case either: it
 * counts the escape sequences it found, and a capture that holds one while the
 * fixture does not test colour is reported as a finding.
 */
export const N21: Rule = {
  id: "N-21",
  subject: "Colour",
  surfaces: ["stdout", "stderr", "pipeline"],
  apply(capture: MutableCapture, context: NormalizeContext): number {
    let count = 0;
    for (const name of this.surfaces) {
      const surface = capture.surfaces[name];
      if (surface === undefined) continue;
      count += countStrings(surface, (value) => ESCAPE_SEQUENCE.test(value));
    }
    if (count > 0 && context.testsColour !== true) {
      capture.findings.push(
        `N-21: ${String(count)} value(s) of ${capture.scenario} (${capture.side}) hold an escape ` +
          `sequence while the fixture does not test colour; the captures run with colour off, so ` +
          `the sequences are compared as written and this is a difference`,
      );
    }
    return count;
  },
};

/** N-22: the hashes of commits become numbered placeholders. */
export const N22: Rule = {
  id: "N-22",
  subject: "Objects of the repository",
  surfaces: ["repository"],
  apply(capture: MutableCapture): number {
    if (capture.surfaces["repository"] === undefined) return 0;
    const number = numberer("commit");
    // A commit hash is forty hexadecimal characters. The message, the content of
    // the tree and the absence of a push are left exactly as they are.
    const holder: Record<string, unknown> = { value: capture.surfaces["repository"] };
    const changed = replaceInSurfaces(holder, [], (value) =>
      value.replace(/\b[0-9a-f]{40}\b/g, (found) => number(found)),
    );
    capture.surfaces["repository"] = holder["value"];
    return changed;
  },
};

/** The names of the counter files of the stubs, which N-23 leaves out of the tree. */
export const COUNTER_FILE_PATTERN = /\.count$|\.count\.lock$|\.attempts$/;

/**
 * N-23: the counter files of the stubs are left out of the tree, and the
 * transcripts are compared after N-01 to N-08. The counters are outside the
 * working directory already (§O.3, rule 1), so the rule is what makes a counter
 * that nonetheless turned up inside it harmless — and it counts what it left out.
 */
export const N23: Rule = {
  id: "N-23",
  subject: "Counter files and transcripts of stub agents",
  surfaces: ["tree", "home"],
  apply(capture: MutableCapture): number {
    let left = 0;
    for (const name of this.surfaces) {
      const surface = capture.surfaces[name] as Record<string, unknown> | undefined;
      if (surface === undefined) continue;
      const strip = (entries: unknown): unknown => {
        if (!Array.isArray(entries)) return entries;
        const kept = (entries as TreeEntry[]).filter((entry) => {
          const out = COUNTER_FILE_PATTERN.test(entry.path);
          if (out) left += 1;
          return !out;
        });
        return kept;
      };
      if (name === "tree") {
        capture.surfaces[name] = { ...surface, entries: strip(surface["entries"]) };
      } else {
        capture.surfaces[name] = {
          ...surface,
          home: strip(surface["home"]),
          temporaryDirectory: strip(surface["temporaryDirectory"]),
        };
      }
    }
    return left;
  },
};

/**
 * N-24: prompts are compared in full after N-01 to N-08. The rule replaces
 * nothing — "in full" is the point — and counts the prompts it was applied to. A
 * prompt that one side sent and the other did not is a difference of the surface
 * `transcript`, and nothing here hides it.
 */
export const N24: Rule = {
  id: "N-24",
  subject: "Prompt text",
  surfaces: ["transcript"],
  apply(capture: MutableCapture): number {
    let count = 0;
    for (const [name, value] of Object.entries(capture.surfaces)) {
      if (!name.startsWith("transcript")) continue;
      count += collect(value, (node) =>
        node !== null &&
        typeof node === "object" &&
        !Array.isArray(node) &&
        typeof (node as Record<string, unknown>)["prompt"] === "string"
          ? true
          : undefined,
      ).length;
    }
    return count;
  },
};

/** The caches of the two old languages, which N-25 leaves out. */
export const LANGUAGE_CACHE_PATTERN =
  /(^|\/)(__pycache__|\.pytest_cache|\.mypy_cache)(\/|$)|\.pyc$|\.pyo$/;

/**
 * N-25: the caches of the languages are left out, and their presence INSIDE the
 * working directory is a failure. Both halves: the entries are removed from the
 * tree and counted, and a cache inside the working directory is recorded as a
 * finding, which the comparator turns into a `different`.
 */
export const N25: Rule = {
  id: "N-25",
  subject: "Caches of the languages",
  surfaces: ["tree", "home"],
  apply(capture: MutableCapture): number {
    let left = 0;
    const tree = capture.surfaces["tree"] as { root?: string; entries?: TreeEntry[] } | undefined;
    if (tree?.entries !== undefined) {
      const inside = tree.entries.filter((e) => LANGUAGE_CACHE_PATTERN.test(e.path));
      if (inside.length > 0) {
        capture.findings.push(
          `N-25: ${String(inside.length)} cache(s) of a language lie inside the working directory ` +
            `of ${capture.scenario} (${capture.side}): ${inside.map((e) => e.path).join(", ")}. ` +
            `Their presence inside the working directory is a failure`,
        );
      }
      left += inside.length;
      capture.surfaces["tree"] = {
        ...tree,
        entries: tree.entries.filter((e) => !LANGUAGE_CACHE_PATTERN.test(e.path)),
      };
    }
    const home = capture.surfaces["home"] as
      { home?: TreeEntry[]; temporaryDirectory?: TreeEntry[] } | undefined;
    if (home !== undefined) {
      const strip = (entries: TreeEntry[] | undefined): TreeEntry[] => {
        if (entries === undefined) return [];
        const out = entries.filter((e) => LANGUAGE_CACHE_PATTERN.test(e.path));
        left += out.length;
        return entries.filter((e) => !LANGUAGE_CACHE_PATTERN.test(e.path));
      };
      capture.surfaces["home"] = {
        ...home,
        home: strip(home.home),
        temporaryDirectory: strip(home.temporaryDirectory),
      };
    }
    return left;
  },
};

/**
 * N-26: the payloads are compared at the stub sink after N-03, N-04 and N-07. The
 * three have run by the time this rule does; what is left to it is to say that the
 * payloads of the sink, and no other record of shipping, are the subject. A payload
 * that holds a field no rule above replaced and that is not deterministic would be
 * a difference, which is the intent.
 */
export const N26: Rule = {
  id: "N-26",
  subject: "Telemetry payloads",
  surfaces: ["telemetry"],
  apply(capture: MutableCapture): number {
    const telemetry = capture.surfaces["telemetry"] as
      { count?: number; payloads?: unknown[]; noSink?: true } | undefined;
    if (telemetry?.payloads === undefined) return 0;
    capture.surfaces["telemetry"] = {
      ...telemetry,
      comparedAfter: ["N-03", "N-04", "N-07"],
    };
    return telemetry.payloads.length;
  },
};

/**
 * N-27: both sides run with the same locale, and the comparator does not sort for
 * them. The rule replaces nothing and sorts nothing: it counts the ordered lists it
 * was applied to, and it is the rule that forbids a comparator from "helpfully"
 * sorting a list whose order is the behaviour.
 */
export const N27: Rule = {
  id: "N-27",
  subject: "Sorting that depends on the locale",
  surfaces: [],
  apply(capture: MutableCapture): number {
    return collect(capture.surfaces, (node) =>
      Array.isArray(node) && node.length > 1 ? true : undefined,
    ).length;
  },
};

/** The legacy command names, legacy variables and pre-v2 paths N-28 leaves out. */
export const LEGACY_MARKERS: readonly string[] = Object.freeze([
  "RALPH_",
  "ralph-loop",
  "ralph.sh",
  "wiggum",
  ".ralph/",
]);

/**
 * N-28: the behaviour of the legacy command names, the legacy variables and the
 * pre-v2 layout is not compared. The rule leaves the subject out and counts what
 * it left out.
 */
export const N28: Rule = {
  id: "N-28",
  subject: "Legacy state and names",
  surfaces: [],
  apply(capture: MutableCapture): number {
    let left = 0;
    for (const name of Object.keys(capture.surfaces)) {
      const holder: Record<string, unknown> = { value: capture.surfaces[name] };
      left += replaceInSurfaces(holder, [], (value) =>
        LEGACY_MARKERS.some((marker) => value.includes(marker)) ? "<legacy, not compared>" : value,
      );
      capture.surfaces[name] = holder["value"];
    }
    return left;
  },
};

/** The field the port's source inventory of a reverse run carries and the reference does not. */
export const REVERSE_INVENTORY_SCHEMA_FIELD = "schema" as const;

/** The id the port's inventory carries in that field (DV-116). */
export const REVERSE_INVENTORY_SCHEMA_ID = "specstride.reverse-inventory/1" as const;

/**
 * N-29: the key `schema` is removed from the source inventory of a reverse run
 * before the inventory is compared. The as-is inventory carries `schema_version` 1
 * and no field `schema` (DV-116), so on the REFERENCE the rule has nothing to
 * remove — it acts on the capture of the port alone.
 */
export const N29: Rule = {
  id: "N-29",
  subject: "Field `schema` of a reverse-run source inventory",
  surfaces: ["state", "tree", "events"],
  apply(capture: MutableCapture, context: NormalizeContext): number {
    if (context.side !== "port") return 0;
    let removed = 0;
    const strip = (node: unknown): unknown => {
      if (Array.isArray(node)) return node.map(strip);
      if (node !== null && typeof node === "object") {
        const record = node as Record<string, unknown>;
        const out: Record<string, unknown> = {};
        const isInventory =
          record[REVERSE_INVENTORY_SCHEMA_FIELD] === REVERSE_INVENTORY_SCHEMA_ID ||
          (typeof record[REVERSE_INVENTORY_SCHEMA_FIELD] === "string" && "sources" in record);
        for (const [key, value] of Object.entries(record)) {
          if (isInventory && key === REVERSE_INVENTORY_SCHEMA_FIELD) {
            removed += 1;
            continue;
          }
          out[key] = strip(value);
        }
        return out;
      }
      return node;
    };
    for (const name of this.surfaces) {
      if (capture.surfaces[name] === undefined) continue;
      capture.surfaces[name] = strip(capture.surfaces[name]);
    }
    // The inventory may also be the TEXT of a file of state; the key is removed
    // from that text too, which is where it reaches the comparison on FX-30.
    const asText = (value: string): string => {
      if (!value.includes(REVERSE_INVENTORY_SCHEMA_ID)) return value;
      removed += 1;
      return value
        .replace(new RegExp(`\\s*"${REVERSE_INVENTORY_SCHEMA_FIELD}"\\s*:\\s*"[^"]*"\\s*,?`), "")
        .replace(/\{\s*,/, "{");
    };
    for (const name of this.surfaces) {
      if (capture.surfaces[name] === undefined) continue;
      const holder: Record<string, unknown> = { value: capture.surfaces[name] };
      replaceInSurfaces(holder, [], asText);
      capture.surfaces[name] = holder["value"];
    }
    return removed;
  },
};

/** The two rules that act on the capture of the port alone (T032, CT-141-120). */
export const RULES_ON_THE_PORT_ALONE: readonly string[] = Object.freeze(["N-12", "N-29"]);

/** Every event record of a capture, for the report. */
export function eventRecordsOf(capture: MutableCapture): readonly EventRecord[] {
  const events = capture.surfaces["events"] as { records?: EventRecord[] } | undefined;
  return events?.records ?? [];
}
