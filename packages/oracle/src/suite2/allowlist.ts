/**
 * T142 — the layer allowlist of the second suite: its generation from the
 * register map and `layer-allowlist.json`, its matching, and its failures
 * (F141-FR-040).
 *
 * "The second suite MUST compare capture A with capture B after normalization
 * and MUST remove only the entries of the layer allowlist." The allowlist is
 * GENERATED from the rows of the divergence register that name a layer field:
 * `register-map.json` says which rows those are (the handling `layer field`),
 * and `layer-allowlist.json` holds one entry per row that can appear, with the
 * surface the entry matches on and the values it removes. A row that names a
 * layer field and has no entry MUST carry a row of `notReachable` with its
 * reason, or be a switch the `parity` profile already holds off — a field that
 * cannot appear in either capture.
 *
 * The VALUES of an entry come from `layer-allowlist.json`, and the file follows
 * two authorities where the text of its register row names no value: an event
 * type is one of the event catalogue of feature 111 (`F111-FR-050`), and a file
 * of state is named by its logical name in feature 100, annex B §B.5 (the
 * layout table). Where the text of a register row names a value under its OLD
 * name — DV-016, DV-020 and DV-052 do — the correction is proposed upstream in
 * `specs/141-parity-oracle/analyze-report.md`, "Proposed upstream fixes", P2
 * and P3, and `layer-allowlist.json` already carries the catalogue's names.
 * `checkValueSources` proves for every value which of the three it comes from
 * and fails when it comes from none.
 *
 * Three failures, all of them the suite's:
 * - an entry that matches nothing in any fixture fails the suite;
 * - a difference outside the allowlist fails the suite and is reported as a
 *   POSSIBLE BREACH OF GATE INTEGRITY — the second suite exists because the
 *   micro-loop layer must be inert, so a difference it cannot name is a gate
 *   that may no longer hold;
 * - a value from no authority fails before a fixture runs.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  layerAllowlist,
  registerMap,
  type LayerAllowlist,
  type RegisterMapRow,
} from "../catalogue/data.ts";
import { profileRows } from "@specstride/contracts/profile/parity";
import { LOGICAL_NAMES } from "@specstride/contracts/ids/logical-names";
import type { NormalizedCapture } from "../normalize/index.ts";

/** The file that holds the entries of the second suite. */
export const LAYER_ALLOWLIST_FILE = "packages/oracle/data/layer-allowlist.json";

/** The handling in `register-map.json` that puts a row in this allowlist. */
export const LAYER_FIELD_HANDLING = "layer field" as const;

/** The rows of the divergence register that name a layer field (F141-FR-040). */
export function layerFieldRows(map: ReturnType<typeof registerMap>): readonly RegisterMapRow[] {
  return map.rows.filter((row) => row.handling.includes(LAYER_FIELD_HANDLING));
}

/**
 * A row of the register that names a layer field and is no entry: the `parity`
 * profile holds its switch off, so neither capture can hold the field.
 */
function heldOffByTheProfile(row: RegisterMapRow): string | undefined {
  if (!row.handling.includes("off")) return undefined;
  // The switch the profile holds off is the one whose key the row is about. The
  // profile is the authority: a row marked off whose key no switch of the
  // `parity` profile holds is NOT explained and is reported.
  const keys = profileRows.flatMap((r) => [...r.keys]);
  const named = keys.find((key) => row.registerText.includes(key));
  if (named === undefined) {
    return `the row carries the handling off, and no key of the parity profile is named in its text; explain it in ${LAYER_ALLOWLIST_FILE}`;
  }
  return `the switch ${named} is off under the parity profile (the row carries the handling off), so neither capture can hold the field`;
}

/**
 * Generate the allowlist: the entries of `layer-allowlist.json`, checked
 * against the rows of the register that name a layer field. Every such row is
 * either an entry, a `notReachable` row with its reason, or a switch the
 * `parity` profile holds off. Anything else is a failure with the row named.
 */
export function generateLayerAllowlist(
  map: ReturnType<typeof registerMap> = registerMap(),
  file: LayerAllowlist = layerAllowlist(),
): {
  readonly entries: LayerAllowlist["entries"];
  readonly notReachable: LayerAllowlist["notReachable"];
} {
  const rows = layerFieldRows(map);
  const entryRows = new Set(file.entries.map((entry) => entry.row));
  const unreachableRows = new Set(file.notReachable.map((row) => row.row));
  const problems: string[] = [];
  for (const row of rows) {
    if (entryRows.has(row.row)) continue;
    if (unreachableRows.has(row.row)) continue;
    const off = heldOffByTheProfile(row);
    if (off !== undefined) continue;
    problems.push(
      `${row.row} names a layer field and is neither an entry of the allowlist nor listed as ` +
        `not reachable with its reason (F141-FR-040)`,
    );
  }
  const knownRows = new Set(rows.map((row) => row.row));
  for (const entry of file.entries) {
    if (!knownRows.has(entry.row)) {
      problems.push(
        `the entry for ${entry.row} names a row that does not name a layer field in the register map`,
      );
    }
  }
  for (const row of file.notReachable) {
    if (!knownRows.has(row.row)) {
      problems.push(
        `the not-reachable row ${row.row} names a row that does not name a layer field in the register map`,
      );
    }
    if (row.reason.trim() === "") {
      problems.push(`the not-reachable row ${row.row} carries no reason (F141-FR-040)`);
    }
  }
  if (problems.length > 0) {
    throw new AllowlistError(problems.join("; "));
  }
  return { entries: file.entries, notReachable: file.notReachable };
}

/** The task list as read at launch, which is written in EVERY run (CQ-084). */
export const TASK_LIST_AT_LAUNCH = "run:<runId>:task-list" as const;

/**
 * The logical names the entry of DV-052 names, and the one it must NOT name.
 * `run:<runId>:task-list` is written by the engine at launch in every run, so
 * captures A and B both hold it and compare it; an entry for it would match
 * nothing and fail the suite (CQ-084).
 */
export function assertTaskListAtLaunchIsNoEntry(file: LayerAllowlist = layerAllowlist()): void {
  for (const entry of file.entries) {
    if (entry.values.includes(TASK_LIST_AT_LAUNCH)) {
      throw new AllowlistError(
        `${TASK_LIST_AT_LAUNCH} is no entry: the engine writes it at launch in every run, so ` +
          `captures A and B both hold it (CQ-084; F141-FR-040)`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Where a value comes from
// ---------------------------------------------------------------------------

/** The event catalogue of feature 111, read where feature 111 keeps it. */
export function eventTypesOfFeature111(
  cataloguePath = resolve(
    dirname(dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))))),
    "specs",
    "111-event-schema-and-projection",
    "contracts",
    "event-catalogue.tsv",
  ),
): ReadonlySet<string> {
  if (!existsSync(cataloguePath)) return new Set();
  const types = new Set<string>();
  for (const line of readFileSync(cataloguePath, "utf8").split("\n").slice(1)) {
    const type = line.split("\t")[0]?.trim();
    if (type !== undefined && type !== "") types.add(type);
  }
  return types;
}

/** The logical names of the layout table of feature 100 (annex B §B.5 and D §D.8). */
export function logicalNamesOfAnnexB(): ReadonlySet<string> {
  return new Set(LOGICAL_NAMES);
}

/** Where the text of a register row names a value: the row by its id. */
export function registerTextOfRow(row: string, map: ReturnType<typeof registerMap>): string {
  return map.rows.find((r) => r.row === row)?.registerText ?? "";
}

/** What a value of an entry comes from. */
export type ValueSource =
  | "the event catalogue of feature 111"
  | "the logical name of feature 100, annex B §B.5"
  | "the text of its register row"
  | "nowhere";

/** Which authority a value of an entry follows, or `nowhere`. */
export function sourceOfValue(
  value: string,
  row: string,
  map: ReturnType<typeof registerMap> = registerMap(),
  eventTypes: ReadonlySet<string> = eventTypesOfFeature111(),
  logicalNames: ReadonlySet<string> = logicalNamesOfAnnexB(),
  registerText: ReadonlyMap<string, string> = registerRowTexts(),
): ValueSource {
  const head = value.split(" ")[0] as string;
  if (eventTypes.has(head)) return "the event catalogue of feature 111";
  if (logicalNames.has(value)) return "the logical name of feature 100, annex B §B.5";
  // A value the register row names: either the value itself, or every word of
  // a spoken value ("prompt size") in the row's text.
  const text = registerTextOfRow(row, map);
  const texts = [text, ...(registerText.has(row) ? [registerText.get(row) as string] : [])];
  if (texts.some((candidate) => candidate.includes(value))) return "the text of its register row";
  const words = value
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);
  if (
    words.length > 1 &&
    texts.some((candidate) => words.every((word) => candidate.toLowerCase().includes(word)))
  ) {
    return "the text of its register row";
  }
  const withoutCounter = value.replace(/<N>/g, "");
  if (withoutCounter !== value && texts.some((candidate) => candidate.includes(withoutCounter))) {
    return "the text of its register row";
  }
  return "nowhere";
}

/**
 * The text of the register rows, read where the register stands
 * (`docs/ecosystem/consolidation.md`, section 6.3, column "New behaviour"). The
 * register map keeps the handling column only; the fields, blocks and events an
 * entry may name stand in the row's own text, which the oracle reads and never
 * copies (the same rule the layout table follows).
 */
export function registerRowTexts(): ReadonlyMap<string, string> {
  const file = resolve(
    dirname(dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))))),
    "docs",
    "ecosystem",
    "consolidation.md",
  );
  const texts = new Map<string, string>();
  if (!existsSync(file)) return texts;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const columns = line.split(" | ");
    if (columns.length < 4 || !columns[0]?.startsWith("| DV-")) continue;
    texts.set((columns[0] as string).replace("| ", "").trim(), (columns[2] ?? "").trim());
  }
  return texts;
}

/**
 * Every value of every entry comes from one of the three authorities. The
 * texts of DV-016, DV-020 and DV-052 that name the OLD names are proposed
 * upstream (`analyze-report.md`, "Proposed upstream fixes", P2 and P3), so the
 * catalogue's names stand in the file in their place; the file's own note says
 * so, and that note is the fourth authority — but only while P2 and P3 are
 * still open, which the note records.
 */
export function checkValueSources(map: ReturnType<typeof registerMap> = registerMap()): void {
  const problems: string[] = [];
  for (const entry of layerAllowlist().entries) {
    for (const value of entry.values) {
      const source = sourceOfValue(value, entry.row, map);
      if (source === "nowhere") {
        problems.push(`${entry.row}: the value ${value} comes from no authority`);
      }
    }
  }
  if (problems.length > 0) throw new AllowlistError(problems.join("; "));
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/** One difference between capture A and capture B, found on one surface. */
export type Difference = {
  readonly surface: string;
  /** Where on the surface: the event type, the logical name or the field path. */
  readonly where: string;
  /** The values on each side, as text. */
  readonly a: string;
  readonly b: string;
};

/** The entry that allowed a difference, with the row that carried it. */
export type MatchedEntry = {
  readonly row: string;
  readonly surface: string;
  readonly match: string;
};

/** An entry that matched nothing in any fixture, with the fixtures it saw. */
export type EntryObservation = {
  readonly row: string;
  readonly surface: string;
  readonly match: string;
  readonly matchedInFixtures: readonly string[];
};

/** The verdict on one fixture's pair of captures. */
export type AllowlistVerdict = {
  readonly fixture: string;
  readonly allowed: readonly { readonly difference: Difference; readonly entry: MatchedEntry }[];
  /** The differences no entry removes: each is a possible breach of gate integrity. */
  readonly breaches: readonly Difference[];
};

/** The message a breach is reported with (F141-FR-040). */
export const BREACH_MESSAGE = "possible breach of gate integrity" as const;

/** The events-primary records of a normalized capture, when it holds them. */
type EventLike = { readonly pairs?: readonly { readonly key: string; readonly value: unknown }[] };

/**
 * The type of one event record, in the form N-13 keeps it: the ordered pairs of
 * the line, with the type in the pair `type` — the catalogue of feature 111 is
 * a closed set of types, and a record without one is compared as `unknown`.
 */
export function eventTypeOf(record: EventLike): string {
  const pair = record.pairs?.find((p) => p.key === "type");
  if (pair !== undefined) return String(pair.value);
  const first = record.pairs?.[0];
  return first === undefined ? "unknown" : first.key;
}

function eventsOf(capture: NormalizedCapture): readonly EventLike[] {
  const surface = capture.surfaces["events-primary"] as
    { readonly records?: readonly EventLike[] } | undefined;
  return surface?.records ?? [];
}

function controlEntriesOf(capture: NormalizedCapture): readonly {
  readonly name: string;
  readonly value: unknown;
}[] {
  const surface = capture.surfaces["control-records"] as
    | { readonly entries?: readonly { readonly name: string; readonly value: unknown }[] }
    | undefined;
  return surface?.entries ?? [];
}

/**
 * Whether one entry matches one difference. An entry matches BY ITS VALUES:
 * an event entry by the event's type in the catalogue of feature 111, a file
 * of state by its logical name, a field of the run record by its name, a
 * prompt block by its name. The announcement entry of DV-053 matches only the
 * event `strategy.selected` whose `fallbackReason` is `gate-not-executing`,
 * and only in a fixture whose verification mode is `plan` or `off`.
 */
export function entryMatches(
  entry: LayerAllowlist["entries"][number],
  difference: Difference,
  fixture?: { readonly verificationMode?: string },
): boolean {
  if (entry.surface !== difference.surface) return false;
  // The announcement entry never matches outside its fixture class (DV-053):
  // only a fixture whose verification mode is `plan` or `off` may have it.
  if (entry.row === "DV-053" && fixture !== undefined) {
    const mode = fixture.verificationMode;
    if (mode !== "plan" && mode !== "off") return false;
  }
  for (const value of entry.values) {
    // The announcement entry: the value names the event AND the reason.
    if (value.includes(" with ")) {
      const [type, announcement] = value.split(" with ").map((part) => part.trim());
      if (difference.where !== type) continue;
      // The announcement names the pair and its value: "fallbackReason
      // gate-not-executing".
      const [key, reason] = announcement.split(/:?\s+/);
      if (reason === undefined || key === undefined) continue;
      let b: unknown = difference.b;
      try {
        b = JSON.parse(difference.b) as unknown;
      } catch {
        /* a text value: matched as text below */
      }
      // The record is in the form N-13 keeps: ordered pairs. The reason stands
      // in the pair the announcement names.
      const pairs =
        typeof b === "object" && b !== null && "pairs" in (b as object)
          ? ((b as { pairs?: readonly { key: string; value: unknown }[] }).pairs ?? [])
          : [];
      const pair = pairs.find((p) => p.key === key);
      // A record that carries the fields at its top level (as the expectation
      // of T144 spells the announcement) is read there; a record in the form of
      // N-13 is read in its pairs.
      const topLevel =
        typeof b === "object" && b !== null && key in (b as object)
          ? (b as Readonly<Record<string, unknown>>)[key]
          : undefined;
      const reasonValue =
        topLevel !== undefined
          ? String(topLevel)
          : pair === undefined
            ? announcement
            : String(pair.value);
      if (reasonValue === reason || announcement.includes(reasonValue)) return true;
      continue;
    }
    if (difference.where === value) return true;
    // A logical name with its phase counter: `phase:<N>:manifest` matches
    // `phase:2:manifest`.
    if (value.includes("<N>")) {
      const pattern = new RegExp(
        `^${value
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .split("<N>")
          .join("[0-9]+")}$`,
      );
      if (pattern.test(difference.where)) return true;
    }
  }
  return false;
}

/** Compare the two normalized captures of one fixture and judge the differences. */
export function compareWithAllowlist(
  fixture: string,
  a: NormalizedCapture,
  b: NormalizedCapture,
  file: LayerAllowlist = layerAllowlist(),
  fixtureClass?: { readonly verificationMode?: string },
): AllowlistVerdict {
  const differences: Difference[] = [];

  // S-14 events-primary: a record that only one side holds, or a record whose
  // fields differ, is one difference per event type.
  const eventsA = new Map<string, EventLike>();
  for (const record of eventsOf(a)) {
    const type = eventTypeOf(record);
    eventsA.set(type, record);
  }
  const eventsB = new Map<string, EventLike>();
  for (const record of eventsOf(b)) {
    const type = eventTypeOf(record);
    eventsB.set(type, record);
  }
  const types = [...new Set([...eventsA.keys(), ...eventsB.keys()])].sort();
  for (const type of types) {
    const left = eventsA.get(type);
    const right = eventsB.get(type);
    if (JSON.stringify(left) === JSON.stringify(right)) continue;
    differences.push({
      surface: "events-primary",
      where: type,
      a: JSON.stringify(left ?? null),
      b: JSON.stringify(right ?? null),
    });
  }

  // S-15 control-records: one difference per logical name (or field path under
  // one), keyed by the name the layout table gives the file.
  const entriesA = new Map(controlEntriesOf(a).map((e) => [e.name, e.value]));
  const entriesB = new Map(controlEntriesOf(b).map((e) => [e.name, e.value]));
  const names = [...new Set([...entriesA.keys(), ...entriesB.keys()])].sort();
  for (const name of names) {
    const left = entriesA.get(name);
    const right = entriesB.get(name);
    if (JSON.stringify(left) === JSON.stringify(right)) continue;
    differences.push({
      surface: "control-records",
      where: name,
      a: JSON.stringify(left ?? null),
      b: JSON.stringify(right ?? null),
    });
  }

  const allowed: { difference: Difference; entry: MatchedEntry }[] = [];
  const breaches: Difference[] = [];
  for (const difference of differences) {
    const entry = file.entries.find((candidate) =>
      entryMatches(candidate, difference, fixtureClass),
    );
    if (entry === undefined) {
      breaches.push(difference);
      continue;
    }
    allowed.push({
      difference,
      entry: { row: entry.row, surface: entry.surface, match: entry.match },
    });
  }
  return { fixture, allowed, breaches };
}

/**
 * One entry that matched nothing in ANY fixture fails the suite
 * (F141-FR-040). Give the observations of the whole suite run.
 */
export function assertEveryEntryMatchesSomething(observations: readonly EntryObservation[]): void {
  const problems: string[] = [];
  for (const observation of observations) {
    if (observation.matchedInFixtures.length === 0) {
      problems.push(
        `the entry of ${observation.row} on ${observation.surface} (${observation.match}) ` +
          `matched nothing in any fixture; an entry that matches nothing fails the second suite ` +
          `(F141-FR-040)`,
      );
    }
  }
  if (problems.length > 0) throw new AllowlistError(problems.join("; "));
}

/** The failures of one verdict, as the suite reports them. */
export function failuresOfVerdict(verdict: AllowlistVerdict): readonly string[] {
  return verdict.breaches.map(
    (breach) =>
      `${verdict.fixture}: ${breach.surface} differs at ${breach.where} outside the layer ` +
      `allowlist: ${BREACH_MESSAGE} (F141-FR-040)`,
  );
}

/** An allowlist that does not hold up. */
export class AllowlistError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AllowlistError";
  }
}

/** Where the file stands, for a report. */
export function layerAllowlistPath(root: string = process.cwd()): string {
  return join(root, LAYER_ALLOWLIST_FILE);
}
