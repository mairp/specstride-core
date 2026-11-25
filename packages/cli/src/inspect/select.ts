/**
 * T029 — the selection of the events, the engine log and the feature by
 * logical name (F119-FR-016, F119-FR-017).
 *
 * Inspection reaches state ONLY through the logical names of annex B §B.5:
 * `workspace:current:events` and `workspace:current:engine-log` (the newest
 * engine start of the workspace), `run:<runId>:events` and
 * `run:<runId>:engine-log` (the run of the newest engine start of a feature),
 * `gate:<N>:feedback` and `gate:<N>:verdict` (the phase records). No legacy
 * state directory is named and none is read (F119-FR-017); nothing here
 * writes (F119-FR-016).
 *
 * `events --feature S` with no engine start of that feature falls back to the
 * current event file of the workspace (F119-FR-018); the fallback is a fact
 * of the selection (`fellBack`) that the caller may report.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { newestRunOf, eventsPathOf, type ControlPlane } from "../router/guards.ts";
import {
  sanitizeFeature,
  featureOfTheLastRun,
  DEFAULT_FEATURE,
  type InspectArgs,
} from "../router/inspect-args.ts";

/** Where one selection found the events or the log of a call. */
export type SelectedFile = {
  /** The physical path, for the read only; never printed. */
  readonly path: string;
  /** The logical name of annex B §B.5 the line and the record print. */
  readonly logicalName: string;
  /** True where `--feature` fell back to the current file (F119-FR-018). */
  readonly fellBack?: boolean | undefined;
};

/** What one inspection call selected (the `Selection` of the data model). */
export type Selection = {
  /** The feature slug the call resolved to. */
  readonly feature: string;
  /** The newest run recorded for the feature, by run id, when one is. */
  readonly runId: string | undefined;
  /** The event file of the call, when the workspace has one. */
  readonly events: SelectedFile | undefined;
  /** The engine log of the call, when the newest run has one. */
  readonly log: SelectedFile | undefined;
};

/** F119-FR-008 — the feature the call selected: `--feature`, last run, default. */
export function selectFeature(args: InspectArgs, cp: ControlPlane): string {
  if (args.feature !== undefined) return sanitizeFeature(args.feature);
  // The workspace record holds the feature of the newest engine start; the
  // reader of feature 100 resolves it from the run snapshots, by logical
  // name. This module loads lazily, so the read costs no cold start.
  return featureOfTheLastRun(cp.stateDir) ?? DEFAULT_FEATURE;
}

function newestRunOfPath(runs: string): string | undefined {
  let entries: string[];
  try {
    entries = readdirSync(runs);
  } catch {
    return undefined;
  }
  let newest: { name: string; at: number } | undefined;
  for (const name of entries) {
    const path = join(runs, name);
    try {
      const at = statSync(path).mtimeMs;
      if (newest === undefined || at > newest.at) newest = { name, at };
    } catch {
      continue;
    }
  }
  return newest === undefined ? undefined : join(runs, newest.name);
}

/** The id of the newest run of one feature, when one is recorded. */
export function newestRunId(cp: ControlPlane, slug: string): string | undefined {
  const run = newestRunOf(cp, slug);
  return run === undefined ? undefined : basenameOf(run);
}

function basenameOf(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] ?? path;
}

/**
 * F119-FR-018 — the event file of one call. Without `--feature` the current
 * event file of the workspace (`workspace:current:events`); with it the
 * newest event file of that feature, falling back to the current one.
 */
export function selectEvents(
  cp: ControlPlane,
  slug: string,
  explicitFeature: boolean,
): SelectedFile | undefined {
  const current = eventsPathOf(cp);
  if (!explicitFeature) {
    return existsSync(current)
      ? { path: current, logicalName: "workspace:current:events" }
      : undefined;
  }
  const featureDir = join(cp.stateDir, "features", slug);
  const candidates = [
    join(featureDir, "events.jsonl"),
    join(newestRunOfPath(join(featureDir, "runs")) ?? "", "events.jsonl"),
  ];
  let newest: { path: string; at: number } | undefined;
  for (const path of candidates) {
    if (path === "" || !existsSync(path)) continue;
    try {
      const at = statSync(path).mtimeMs;
      if (newest === undefined || at > newest.at) newest = { path, at };
    } catch {
      continue;
    }
  }
  if (newest !== undefined) {
    return { path: newest.path, logicalName: `feature:${slug}:events` };
  }
  // F119-FR-018 — the fallback to the current event file of the workspace.
  return existsSync(current)
    ? { path: current, logicalName: "workspace:current:events", fellBack: true }
    : undefined;
}

/**
 * The event files the engine wrote for one feature, oldest first: the engine
 * writes `<control>/runs/<runId>/events.jsonl`, one file per run or relaunch.
 * A run belongs to the feature where `features/<slug>/runs/<runId>` exists, or,
 * where no feature names the run, when `slug` is the only feature of the
 * control root (the events carry no feature name). Order is by the first
 * event time, then run id, so the result is deterministic. Read only.
 */
export function engineEventFilesOf(cp: ControlPlane, slug: string): readonly SelectedFile[] {
  const runsRoot = join(cp.stateDir, "runs");
  const featuresRoot = join(cp.stateDir, "features");
  let runIds: string[];
  let features: string[];
  try {
    runIds = readdirSync(runsRoot);
  } catch {
    return [];
  }
  try {
    features = readdirSync(featuresRoot);
  } catch {
    features = [];
  }
  const sole = features.length === 1 && features[0] === slug;
  const named = (id: string): string | undefined =>
    features.find((f) => existsSync(join(featuresRoot, f, "runs", id)));
  const found: { path: string; id: string; at: number }[] = [];
  for (const id of runIds) {
    const path = join(runsRoot, id, "events.jsonl");
    if (!existsSync(path)) continue;
    const owner = named(id);
    if (owner === undefined ? !sole : owner !== slug) continue;
    found.push({ path, id, at: firstEventTime(path) });
  }
  found.sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return found.map((f) => ({ path: f.path, logicalName: `run:${f.id}:events` }));
}

function firstEventTime(path: string): number {
  try {
    const text = readFileSync(path, "utf8");
    const end = text.indexOf("\n");
    const rec = JSON.parse(end === -1 ? text : text.slice(0, end)) as {
      at?: unknown;
      ts?: unknown;
    };
    const t = Date.parse(String(rec.at ?? rec.ts));
    return Number.isFinite(t) ? t : statSync(path).mtimeMs;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

/**
 * The event files `report` reads: the feature's own file (legacy layout)
 * where one exists, else every engine run of the feature, oldest first, else
 * the single file `select` fell back to (the current file of the workspace).
 */
export function reportEventFiles(
  args: InspectArgs,
  cp: ControlPlane,
  engineOnly = false,
): {
  readonly feature: string;
  readonly runId: string | undefined;
  readonly files: readonly SelectedFile[];
} {
  const chosen = select(args, cp);
  const own = chosen.events;
  if (engineOnly) {
    const runs = engineEventFilesOf(cp, chosen.feature);
    const last = runs[runs.length - 1]?.logicalName.split(":")[1];
    return { feature: chosen.feature, runId: last, files: runs };
  }
  if (own !== undefined && own.logicalName.startsWith("feature:")) {
    return { feature: chosen.feature, runId: chosen.runId, files: [own] };
  }
  const engine = engineEventFilesOf(cp, chosen.feature);
  if (engine.length > 0) {
    const last = engine[engine.length - 1]?.logicalName.split(":")[1];
    return { feature: chosen.feature, runId: last, files: engine };
  }
  return { feature: chosen.feature, runId: chosen.runId, files: own === undefined ? [] : [own] };
}

/**
 * F119-FR-018 — the engine log of the selected engine start:
 * `run:<runId>:engine-log` of the newest run of the feature.
 */
export function selectEngineLog(cp: ControlPlane, slug: string): SelectedFile | undefined {
  const run = newestRunOf(cp, slug);
  if (run === undefined) return undefined;
  const log = join(run, "engine.log");
  if (!existsSync(log)) return undefined;
  return { path: log, logicalName: `run:${basenameOf(run)}:engine-log` };
}

/** Select everything one inspection call reads. */
export function select(args: InspectArgs, cp: ControlPlane): Selection {
  const explicitFeature = args.feature !== undefined;
  const feature = selectFeature(args, cp);
  const runId = newestRunId(cp, feature);
  return Object.freeze({
    feature,
    runId,
    events: selectEvents(cp, feature, explicitFeature),
    log: selectEngineLog(cp, feature),
  });
}
