/**
 * T151 to T154 — the handler of `report` (feature 153, F153-FR-039 to -041).
 *
 * `report` prints the rows of the loop report (F153-FR-040) of the events of
 * one run: in default output one terse line per row; under `--json` exactly
 * one JSON document. The handler reads the events file the selection names,
 * hands the events to the pure projection `reportRowsOf`
 * (`@specstride/core/report`) and prints what it returns — it decides
 * nothing, writes nothing and spawns nothing (F153-FR-039, F153-FR-006).
 *
 * The projection only ever prints ids and numbers through the engine's
 * ingress; no free-text field of an event reaches the output
 * (F153-FR-003, CQ-153-14).
 */

import { readFileSync } from "node:fs";
import { parseInspectArgs } from "../router/inspect-args.ts";
import type { RoutedCall } from "../router/route.ts";
import { controlPlaneOf } from "../router/guards.ts";
import { controlRootOfWorkspace } from "../engine/workspace-control-root.ts";
import { reportEventFiles } from "./select.ts";
import {
  NOT_IN_EVENTS,
  groupSummaryOf,
  reportRows154Of,
  reportRowsOf,
  type Report,
  type ReportEvent,
  type ReportRow,
} from "@specstride/core/report";
import { readEvents as readEnveloped, type ReadResult } from "../status/event-reader.ts";

/** The terse marking of a row the events cannot hold (F153-FR-040). */
const TERSE_NOT_IN_EVENTS = "not in the events";

/**
 * T152 — read the events through the shared reader and adapt them to {type, at, data}.
 * The reader tolerates torn lines, skipped lines and records gaps.
 */
function readReportEvents(path: string): readonly ReportEvent[] {
  const rr: ReadResult = readEnveloped(path, { offset: 0, lastSeq: 0 });
  if (rr.events.length > 0) {
    return rr.events.map((env) => ({
      type: env.type,
      at: Date.parse(env.ts),
      data: env.data as Record<string, unknown>,
    }));
  }
  // Thin mapper fallback: tolerate the plain {type, at, data} form used by frozen fixtures.
  const events: ReportEvent[] = [];
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (line.trim() === "") continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    if (typeof parsed !== "object" || parsed === null) continue;
    const record = parsed as Record<string, unknown>;
    if (typeof record["type"] !== "string") continue;
    const at =
      typeof record["at"] === "number"
        ? record["at"]
        : typeof record["at"] === "string"
          ? Date.parse(record["at"])
          : Number.NaN;
    if (!Number.isFinite(at)) continue;
    const data =
      typeof record["data"] === "object" && record["data"] !== null
        ? (record["data"] as Record<string, unknown>)
        : {};
    events.push({ type: record["type"], at, data });
  }
  return events;
}

/** The events of several run files in time order; ties keep file then line order. */
function mergedInTime(streams: readonly (readonly ReportEvent[])[]): readonly ReportEvent[] {
  return streams
    .flat()
    .map((event, index) => ({ event, index }))
    .sort((a, b) => a.event.at - b.event.at || a.index - b.index)
    .map((entry) => entry.event);
}

/** The terse form of one value: `unknown`, the marking, `k=v` records, a unit on a number. */

export function terseValue(row: ReportRow): string {
  if (row.value === null) return "unknown";
  if (row.value === NOT_IN_EVENTS) return TERSE_NOT_IN_EVENTS;
  if (typeof row.value === "number")
    return row.unit === undefined ? String(row.value) : `${row.value} ${row.unit}`;
  if (typeof row.value === "string") return row.value;
  const keys = Object.keys(row.value);
  if (keys.length === 0) return "none";
  return keys
    .map((key) => {
      const val = (row.value as Record<string, number>)[key];
      return `${key}=${String(val)}`;
    })
    .join(", ");
}

/** The terse lines of the report: one `<row>: <value> <unit>` line per row. */
export function terseLines(report: Report): readonly string[] {
  return report.rows.map((row) => `${row.row}: ${terseValue(row)}`);
}

/**
 * T040 — the feature-154 rows (F154-FR-012, -014, -015), as terse ReportRow
 * lines. The window shares, the in-pass check time outside the passes, the
 * counts over groups and workers, and one line per group. Terse only: no
 * forecast and no saving is ever printed (F154-FR-008, -017).
 */
export function rows154Lines(
  events: readonly ReportEvent[],
  feature: string,
): readonly string[] {
  const rows154 = reportRows154Of(events, feature);
  const summary = groupSummaryOf(events);
  const shares = rows154.windowShares;
  const lines: string[] = [
    `window share proposer passes: ${share(shares.proposerPasses)}`,
    `window share in-pass checks: ${share(shares.inPassChecks)}`,
    `window share gate and critic outside checks: ${share(shares.gateAndCriticOutsideChecks)}`,
    `window share rest: ${share(shares.rest)}`,
    `in-pass check time outside passes: ${marking(rows154.inPassCheckTimeOutsidePasses)} ms`,
    `groups by outcome: ${terseCounts(summary.groupsByOutcome)}`,
    `workers by outcome: ${terseCounts(summary.workersByOutcome)}`,
    `worker refusals by reason: ${terseCounts(summary.workerRefusalsByReason)}`,
    `concurrent check time: ${summary.concurrentCheckTimeMs} ms`,
  ];
  for (const group of rows154.groups) {
    lines.push(
      `group: phase=${group.phase} outcome=${group.outcome} appliedPaths=${group.appliedPathCount} ` +
        `mergeCheck=${group.mergeCheckResult ?? "unknown"} wallTimeMs=${group.wallTimeMs}`,
    );
  }
  return lines;
}

/** A count record in the terse `k=v` form, `none` when empty. */
function terseCounts(counts: Readonly<Record<string, number>>): string {
  const keys = Object.keys(counts);
  if (keys.length === 0) return "none";
  return keys.map((key) => `${key}=${String(counts[key])}`).join(", ");
}

/** A share: the number in per cent, or the marking (F154-FR-012). */
function share(value: number | string): string {
  return typeof value === "number" ? `${value}%` : value;
}

/** A duration in ms, or the marking where the events hold none. */
function marking(value: number | string): string {
  return typeof value === "number" ? String(value) : value;
}

/**
 * T151 to T154 — the handler of `report`. Without a readable events file it
 * writes one line to standard error and returns 1; otherwise it prints the
 * rows (terse by default, one JSON document under `--json`) and returns 0.
 */
export function reportHandler(call: RoutedCall): number {
  const args = parseInspectArgs(call.extras);
  // The engine writes a workspace under `~/.specstride/workspaces/<id>`
  // (controlRootOfWorkspace, the root `stop` reads); the control plane of the
  // call is `<workdir>/.specstride` unless the host named one, and its
  // `features/<slug>/runs/*/events.jsonl` are launch records, not engine
  // events. Engine runs win: the call's plane, then the engine's root of the
  // workdir, then the single file of the older layout.
  const engineRoot = controlPlaneOf(call.workdir, controlRootOfWorkspace(call.workdir));
  const chosen =
    [call.controlPlane, engineRoot]
      .map((cp) => reportEventFiles(args, cp, true))
      .find((found) => found.files.length > 0) ?? reportEventFiles(args, call.controlPlane);
  if (chosen.files.length === 0) {
    call.io.err(
      `specstride report: no events of the feature ${chosen.feature} in the control plane\n`,
    );
    return 1;
  }
  const events =
    chosen.files.length === 1
      ? readReportEvents(chosen.files[0]?.path ?? "")
      : mergedInTime(chosen.files.map((file) => readReportEvents(file.path)));
  const report = reportRowsOf(events, chosen.runId ?? null);
  if (args.json === true) {
    // T154 — one JSON document and nothing else.
    call.io.out(`${JSON.stringify(report, null, 2)}\n`);
    return 0;
  }
  for (const line of terseLines(report)) call.io.out(`${line}\n`);
  // T040 — the feature-154 rows (F154-FR-012, -014, -015) follow the rows of
  // feature 153, in default output only. Under the `parity` profile none of
  // them is printed: the events they read do not exist there and no line
  // without an as-is equivalent reaches the output (F154-FR-001, F154-SC-012,
  // F119-FR-029). The verb stays read only (F154-FR-017).
  if (process.env.SPECSTRIDE_PROFILE === "parity") return 0;
  for (const line of rows154Lines(events, chosen.feature)) call.io.out(`${line}\n`);
  return 0;
}
