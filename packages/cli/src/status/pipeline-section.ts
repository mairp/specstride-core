/**
 * The pipeline section of `specstride status` (default text output).
 *
 * A launch of `requestKind: "pipeline"` (the MoL launcher a host renders from
 * a contract) does not write the run record and the `specstride.event` stream
 * the read model of feature 129 projects: the pipeline writes its own state
 * under `<control>/state/pipeline/<pipeline>/runs/<launchId>/state.json`, the
 * engine it runs writes its approvals under the home control root, and the
 * runtime log carries the phase headers. Without this section `status` on a
 * live pipeline run printed `st=none` — truthful about the view, useless to the
 * operator. Every read here is best-effort: a missing or torn file drops its
 * line, and nothing here can throw out of `status`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Where the section reads from. */
export type PipelinePlace = {
  /** The control root of the workspace (`<workspace>/.specstride`). */
  readonly controlRoot: string;
  /** The home control root of the workspace (`~/.specstride/workspaces/<id16>`), if known. */
  readonly homeControlRoot?: string | null;
};

/** What the lock probe said about the run, as the handler observed it. */
export type PipelineLock = {
  readonly result: string;
  readonly pid: number | null;
} | null;

function readJson(path: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(readFileSync(path, "utf8"));
    return value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** The newest launch record of the workspace, by `createdAt` then mtime. */
export function newestLaunchOf(
  controlRoot: string,
): { readonly launchId: string; readonly record: Record<string, unknown> } | null {
  const dir = join(controlRoot, "launches");
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return null;
  }
  let best: { launchId: string; record: Record<string, unknown>; at: number } | null = null;
  for (const name of names) {
    const path = join(dir, name, "launch.json");
    const record = readJson(path);
    if (record === null) continue;
    let at = Date.parse(String(record["createdAt"] ?? ""));
    if (Number.isNaN(at)) {
      try {
        at = statSync(path).mtimeMs;
      } catch {
        at = 0;
      }
    }
    if (best === null || at > best.at) best = { launchId: name, record, at };
  }
  return best === null ? null : { launchId: best.launchId, record: best.record };
}

/** The last `===== PHASE N — title (ts) =====` header of a runtime log. */
export function currentPhaseOf(
  logText: string,
): { readonly n: number; readonly title: string } | null {
  const re = /^===== PHASE (\d+) — (.*?)\s+\(\d{4}-\d{2}-\d{2}T[^)]*\) =====$/gm;
  let last: RegExpExecArray | null = null;
  for (let m = re.exec(logText); m !== null; m = re.exec(logText)) last = m;
  return last === null ? null : { n: Number(last[1]), title: last[2] ?? "" };
}

function tailOf(path: string, bytes = 256 * 1024): string {
  try {
    const text = readFileSync(path, "utf8");
    return text.length > bytes ? text.slice(-bytes) : text;
  } catch {
    return "";
  }
}

/** The approved phases the engine recorded (`features/<slug>/approvals/phase-N.json`). */
export function approvedPhasesOf(
  homeControlRoot: string | null | undefined,
  slug: string,
): number[] {
  if (homeControlRoot === null || homeControlRoot === undefined) return [];
  try {
    return readdirSync(join(homeControlRoot, "features", slug, "approvals"))
      .map((name) => /^phase-(\d+)\.json$/.exec(name))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => Number(m[1]))
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

/**
 * The lines of the section, or `[]` where the newest launch is not a pipeline
 * launch (or `feature` names another one). Never throws.
 */
export function pipelineSectionLines(
  place: PipelinePlace,
  feature: string | null,
  lock: PipelineLock,
): readonly string[] {
  try {
    const newest = newestLaunchOf(place.controlRoot);
    if (newest === null || newest.record["requestKind"] !== "pipeline") return [];
    const request = (newest.record["request"] ?? {}) as Record<string, unknown>;
    const pipeline = typeof request["pipeline"] === "string" ? request["pipeline"] : null;
    if (pipeline === null) return [];
    if (feature !== null && feature !== pipeline) return [];

    const runDir = join(place.controlRoot, "state", "pipeline", pipeline, "runs", newest.launchId);
    const state = readJson(join(runDir, "state.json"));
    const lines: string[] = [];
    const written = typeof state?.["state"] === "string" ? String(state["state"]) : "unknown";
    // A pipeline whose state file says running but whose lock owner is gone
    // is not running: say so rather than echo the stale file.
    const ownerGone =
      lock !== null &&
      (lock.result === "stale-owner-dead" || lock.result === "owner-dead-group-alive");
    const shown =
      written === "running" && ownerGone
        ? `dead (state file says running; lock: ${lock?.result})`
        : written;
    const stages = (state?.["stages"] ?? {}) as Record<string, Record<string, unknown>>;
    const running = Object.entries(stages).find(([, s]) => s?.["status"] === "running")?.[0];
    const live = lock !== null && lock.result === "held-live";
    lines.push(
      `pipeline: ${pipeline}  launch ${newest.launchId}  state ${shown}` +
        (running !== undefined ? `  stage ${running}` : "") +
        (live
          ? `  (live${lock?.pid !== null && lock?.pid !== undefined ? `, pid ${lock.pid}` : ""})`
          : ""),
    );
    const runtimeLog = join(place.controlRoot, "launches", newest.launchId, "runtime.log");
    const phase = currentPhaseOf(tailOf(runtimeLog));
    const approved = approvedPhasesOf(place.homeControlRoot, pipeline);
    if (phase !== null) lines.push(`phase: ${phase.n} — ${phase.title}`);
    lines.push(`approved: ${approved.length === 0 ? "none yet" : approved.join(", ")}`);
    if (existsSync(runtimeLog)) lines.push(`log: ${runtimeLog}`);
    if (typeof state?.["exit_reason"] === "string" && state["exit_reason"] !== "") {
      lines.push(`exit: ${String(state["exit_reason"])}`);
    }
    return Object.freeze(lines);
  } catch {
    return [];
  }
}
