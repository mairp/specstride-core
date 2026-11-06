/**
 * T083 — the exercise map (`schemas/exercise-map.schema.json`, F141-FR-031).
 *
 * The map is one file: per scenario, per file of the reference, the lines the
 * scenario executed, as ranges. It is built from the traces that
 * `src/trace/shell.ts` and `src/trace/python.ts` leave behind, it carries the
 * pins of the systems it was taken on (a line number means nothing without the
 * commit it was read at), and it is validated against the schema of the
 * specification before it is written.
 *
 * What the map is FOR is the claim check (`src/trace/claims.ts`) and the
 * correction list (`src/trace/corrections.ts`): the evidence column of the
 * behaviour inventory is a `file:line` of a baseline, and `didExecute` is the one
 * question both of them ask of the map.
 *
 * Ranges rather than line numbers, because a scenario of the reference executes
 * thousands of lines and the map is committed. The two forms are the same
 * information: `toRanges` and `fromRanges` are inverse.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { schemaOf } from "../catalogue/data.ts";
import { check, violationsAsText } from "../catalogue/schema.ts";
import { oracleDirectory } from "../index.ts";
import type { Pin } from "../reference/pins.ts";

import { type PythonTracer, installPythonTracer, readPythonTrace } from "./python.ts";
import {
  type ExecutedLines,
  type ShellTracer,
  installShellTracer,
  readShellTrace,
} from "./shell.ts";

/** A fault of the exercise map. */
export class ExerciseMapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExerciseMapError";
  }
}

/** The schema id the file carries. */
export const EXERCISE_MAP_SCHEMA =
  "urn:specstride:schema:internal:141:oracle-exercise-map/1" as const;

/** Where the map is committed. */
export const EXERCISE_MAP_FILE = join(
  oracleDirectory("exercise-map"),
  "exercise-map.json",
) as string;

/** One range of executed lines, both ends included. */
export type LineRange = readonly [number, number];

/** What the map says a scenario executed: per file of the reference, the ranges. */
export type ScenarioLines = Readonly<Record<string, readonly LineRange[]>>;

/** An item of the behaviour inventory that no fixture executed (F141-FR-033). */
export type UnreachedItem = {
  readonly item: string;
  readonly evidence: string;
  readonly familiesNamed: readonly string[];
  readonly executedBy?: readonly string[];
  readonly proposal?:
    "another family" | "a new scenario" | "a characterization test" | "a register row";
};

/** The exercise map, as the schema of the specification defines it. */
export type ExerciseMap = {
  readonly schema: typeof EXERCISE_MAP_SCHEMA;
  /** Per system, the commit the lines were read at. */
  readonly pins: Readonly<Record<string, string>>;
  readonly scenarios: Readonly<Record<string, ScenarioLines>>;
  readonly unreached?: readonly UnreachedItem[];
};

/** The set of lines of one file, as the ranges the map holds. */
export function toRanges(lines: Iterable<number>): readonly LineRange[] {
  const sorted = [...new Set(lines)]
    .filter((n) => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b);
  const out: LineRange[] = [];
  for (const line of sorted) {
    const last = out[out.length - 1];
    if (last !== undefined && line === last[1] + 1) out[out.length - 1] = [last[0], line];
    else out.push([line, line]);
  }
  return out;
}

/** The ranges of one file, as the set of lines they stand for. */
export function fromRanges(ranges: readonly LineRange[]): ReadonlySet<number> {
  const out = new Set<number>();
  for (const [first, last] of ranges) for (let n = first; n <= last; n += 1) out.add(n);
  return out;
}

/** One scenario and what it executed, as the builder takes it. */
export type ScenarioTrace = {
  readonly scenario: string;
  /** The system of the baseline the scenario drives. */
  readonly system: string;
  readonly shell: ExecutedLines;
  readonly python: ExecutedLines;
};

/**
 * Build the map. `pins` must name every system a scenario drives: a map whose
 * pins do not cover a scenario is refused rather than written, because a line
 * number of a baseline means nothing without its commit.
 */
export function buildExerciseMap(options: {
  readonly pins: readonly Pin[];
  readonly traces: readonly ScenarioTrace[];
  readonly unreached?: readonly UnreachedItem[];
}): ExerciseMap {
  const pins: Record<string, string> = {};
  for (const pin of options.pins) pins[pin.system] = pin.commit;
  const scenarios: Record<string, ScenarioLines> = {};
  for (const trace of options.traces) {
    if (pins[trace.system] === undefined) {
      throw new ExerciseMapError(
        `the scenario ${trace.scenario} drives ${trace.system}, which the pins of the map do not name`,
      );
    }
    if (scenarios[trace.scenario] !== undefined) {
      throw new ExerciseMapError(`the scenario ${trace.scenario} is in the map twice`);
    }
    const merged = new Map<string, Set<number>>();
    for (const part of [trace.shell, trace.python]) {
      for (const [file, lines] of part) {
        let known = merged.get(file);
        if (known === undefined) {
          known = new Set<number>();
          merged.set(file, known);
        }
        for (const line of lines) known.add(line);
      }
    }
    const perFile: Record<string, readonly LineRange[]> = {};
    for (const file of [...merged.keys()].sort()) perFile[file] = toRanges(merged.get(file)!);
    scenarios[trace.scenario] = Object.freeze(perFile);
  }
  const map: ExerciseMap = {
    schema: EXERCISE_MAP_SCHEMA,
    pins: Object.freeze(pins),
    scenarios: Object.freeze(scenarios),
    ...(options.unreached === undefined
      ? {}
      : { unreached: Object.freeze([...options.unreached]) }),
  };
  assertValidExerciseMap(map);
  return Object.freeze(map);
}

/** Refuse a map that the schema of the specification does not accept. */
export function assertValidExerciseMap(map: unknown): void {
  const violations = check(schemaOf("exercise-map.schema.json"), map);
  if (violations.length > 0) {
    throw new ExerciseMapError(
      `the exercise map does not satisfy schemas/exercise-map.schema.json:\n${violationsAsText(violations)}`,
    );
  }
}

/** Write the map, after validating it. */
export function writeExerciseMap(map: ExerciseMap, file: string = EXERCISE_MAP_FILE): string {
  assertValidExerciseMap(map);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(map, null, 1)}\n`, "utf8");
  return file;
}

/** Read the map back, after validating it. */
export function readExerciseMap(file: string = EXERCISE_MAP_FILE): ExerciseMap {
  const map = JSON.parse(readFileSync(file, "utf8")) as ExerciseMap;
  assertValidExerciseMap(map);
  return map;
}

/** Whether a map holds a scenario at all. */
export function hasScenario(map: ExerciseMap, scenario: string): boolean {
  return Object.prototype.hasOwnProperty.call(map.scenarios, scenario);
}

/** One evidence line of the behaviour inventory, split into its two parts. */
export type Evidence = { readonly file: string; readonly line: number };

/** Read an evidence line of the inventory, `<path>:<line>`. */
export function parseEvidence(evidence: string): Evidence {
  const match = /^(.+):(\d+)$/.exec(evidence.trim());
  if (match === null) {
    throw new ExerciseMapError(
      `${JSON.stringify(evidence)} is no evidence line of the behaviour inventory (<path>:<line>)`,
    );
  }
  return { file: match[1]!, line: Number(match[2]) };
}

/**
 * The one question the claim check and the correction list ask of the map: did
 * this scenario execute this line of this file of the reference?
 */
export function didExecute(
  map: ExerciseMap,
  scenario: string,
  evidence: string | Evidence,
): boolean {
  const { file, line } = typeof evidence === "string" ? parseEvidence(evidence) : evidence;
  const ranges = map.scenarios[scenario]?.[file];
  if (ranges === undefined) return false;
  return ranges.some(([first, last]) => line >= first && line <= last);
}

/** Every scenario of the map that executed one evidence line. */
export function scenariosThatExecuted(
  map: ExerciseMap,
  evidence: string | Evidence,
): readonly string[] {
  return Object.keys(map.scenarios)
    .filter((scenario) => didExecute(map, scenario, evidence))
    .sort();
}

/** The family of a scenario id, `FX-nn/<name>` or `FX-nn/<name>@<variant>`. */
export function familyOfScenario(scenario: string): string {
  const match = /^(FX-\d{2})\//.exec(scenario);
  if (match === null) {
    throw new ExerciseMapError(`${JSON.stringify(scenario)} is no scenario id (FX-nn/<name>)`);
  }
  return match[1]!;
}

/** How many lines of which file the map holds for one scenario. */
export function sizeOfScenario(
  map: ExerciseMap,
  scenario: string,
): { files: number; lines: number } {
  const perFile = map.scenarios[scenario] ?? {};
  let lines = 0;
  for (const ranges of Object.values(perFile))
    for (const [first, last] of ranges) lines += last - first + 1;
  return { files: Object.keys(perFile).length, lines };
}

// ---------------------------------------------------------------------------
// T080 — the supplement of F141-FR-017, as items of the exercise map
// ---------------------------------------------------------------------------

/**
 * The two rows that feature 141 proposed for the behaviour inventory
 * (F141-FR-017). The orchestrator decided the ids B-2784 and B-2785 and put the
 * rows in `docs/ecosystem/research/R18-behaviour-inventory.tsv` and
 * `docs/ecosystem/traceability-items.tsv`; the oracle holds them here as items of
 * the exercise map, with the write site of each at the pinned commit, so that
 * `verifySupplementEvidence` can read the reference tree and say that the
 * evidence line is still the line it was read at.
 */
export const SUPPLEMENT_FILE = join(oracleDirectory("exercise-map"), "supplement.tsv") as string;

/** The columns of `supplement.tsv`. */
export const SUPPLEMENT_COLUMNS = [
  "b_item",
  "system",
  "kind",
  "cluster",
  "disposition",
  "feature",
  "evidence",
  "must_contain",
  "item",
] as const;

/** One row of the supplement: an item of the exercise map. */
export type SupplementRow = Readonly<Record<(typeof SUPPLEMENT_COLUMNS)[number], string>>;

/** Read `supplement.tsv`. */
export function readSupplement(file: string = SUPPLEMENT_FILE): readonly SupplementRow[] {
  const lines = readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line !== "");
  const header = (lines[0] ?? "").split("\t");
  const expected = [...SUPPLEMENT_COLUMNS];
  if (header.length !== expected.length || header.some((name, i) => name !== expected[i])) {
    throw new ExerciseMapError(
      `${file}: the header is ${header.join(", ")}, expected ${expected.join(", ")}`,
    );
  }
  return Object.freeze(
    lines.slice(1).map((line) => {
      const fields = line.split("\t");
      const row: Record<string, string> = {};
      for (const [index, name] of expected.entries()) row[name] = fields[index] ?? "";
      return Object.freeze(row) as SupplementRow;
    }),
  );
}

/** The evidence lines of the supplement, by item id: what the claim check reads. */
export function supplementEvidence(
  rows: readonly SupplementRow[] = readSupplement(),
): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const row of rows) out[row.b_item] = row.evidence;
  return Object.freeze(out);
}

/** What one row of the supplement came to when it was read against the tree. */
export type SupplementCheck = {
  readonly item: string;
  readonly evidence: string;
  /** The line of the reference tree, as it stands at the pinned commit. */
  readonly text: string;
  readonly holds: boolean;
};

/**
 * Verify the evidence lines of the supplement against the reference tree: the
 * line the row names must exist and must hold the write site the row records
 * (T080). A row that does not hold is a fault of the supplement, not of the
 * tree: the tree is the pinned commit and is read-only (F141-FR-002).
 */
export function verifySupplementEvidence(
  referenceRoot: string,
  rows: readonly SupplementRow[] = readSupplement(),
): readonly SupplementCheck[] {
  return Object.freeze(
    rows.map((row) => {
      const { file, line } = parseEvidence(row.evidence);
      const text = readFileSync(join(referenceRoot, file), "utf8").split("\n")[line - 1] ?? "";
      return Object.freeze({
        item: row.b_item,
        evidence: row.evidence,
        text,
        holds: text.includes(row.must_contain),
      });
    }),
  );
}

/** Refuse a supplement whose evidence line is not the line it was read at. */
export function assertSupplementEvidenceHolds(
  referenceRoot: string,
  rows: readonly SupplementRow[] = readSupplement(),
): void {
  const bad = verifySupplementEvidence(referenceRoot, rows).filter((check) => !check.holds);
  if (bad.length > 0) {
    throw new ExerciseMapError(
      `the supplement names an evidence line that the reference tree does not hold: ` +
        bad.map((c) => `${c.item} at ${c.evidence} reads ${JSON.stringify(c.text)}`).join("; "),
    );
  }
}

// ---------------------------------------------------------------------------
// The two tracers together: what the capture job adds to a run
// ---------------------------------------------------------------------------

/** The tracers of one traced run, and the variables that switch them on. */
export type Tracers = {
  readonly traceDir: string;
  readonly shell: ShellTracer;
  readonly python: PythonTracer;
  /**
   * The overlay the capture job hands to `driveSide` as `traceOverlay`. It holds
   * the directory of the trace, the file bash sources and the directory the
   * interpreter imports the tracer from — and nothing of the machine
   * (F141-FR-003 keeps the run's own environment to the allow-list).
   */
  readonly env: Readonly<Record<string, string>>;
};

/**
 * Write both tracers into one directory and give the overlay that switches them
 * on (F141-FR-031). The directory is a directory of the capture job: never the
 * reference tree, which is read-only, and never the working directory of the
 * scenario, which the surface `tree` captures.
 */
export function installTracers(options: { readonly traceDir: string }): Tracers {
  const shell = installShellTracer({ traceDir: options.traceDir });
  const python = installPythonTracer({ traceDir: options.traceDir });
  return Object.freeze({
    traceDir: shell.traceDir,
    shell,
    python,
    env: Object.freeze({ ...shell.env, ...python.env }),
  });
}

/** The two halves of the trace of one run, read back off disk. */
export function readTrace(
  traceDir: string,
  referenceRoot: string,
): { readonly shell: ExecutedLines; readonly python: ExecutedLines } {
  return {
    shell: readShellTrace(traceDir, referenceRoot),
    python: readPythonTrace(traceDir, referenceRoot),
  };
}

/** Which parts of the reference the trace of one run reached. */
export function partsOfTrace(trace: {
  readonly shell: ExecutedLines;
  readonly python: ExecutedLines;
}): { readonly shell: readonly string[]; readonly python: readonly string[] } {
  return {
    shell: [...trace.shell.keys()].sort(),
    python: [...trace.python.keys()].sort(),
  };
}
