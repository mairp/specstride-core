/**
 * T135 to T143 — the rows of the report (feature 153, F153-FR-040, F153-FR-041;
 * plan.md "Telemetry and report design").
 *
 * `reportRowsOf` is a PURE projection of a list of events into the rows
 * F153-FR-040 names. It reads no file, reads no clock, writes no file and
 * makes no decision for a run (F153-FR-039); no decision of the engine reads
 * it either (F153-FR-006, Principle V — telemetry describes a run and is
 * never its event bus).
 *
 * ## Truthfulness (Principle XI)
 *
 * - Unclosed attempts are shown as unclosed; their duration is `null`, never
 *   imputed. The median and total rows count the closed attempts only.
 * - A row the events cannot hold (the manual critic split L-3, the verdict
 *   MET and UNMET counts, the pass-limit banners of a log) is printed as
 *   `not-in-events` (`NOT_IN_EVENTS`), never estimated. The timing rows of
 *   the gate, the critic and the commit scan carry the same marking where
 *   their open/close pairs are absent.
 * - No speed-up estimate and no judgment as fact is printed, ever.
 *
 * ## Shapes
 *
 * `ReportEvent` is the raw line shape of the engine's events file: a type,
 * a millisecond timestamp and the event's data object. `ReportRow` holds one
 * terse row: its name, a value that is a number, a string, `null` or a
 * record of counts, and an optional unit. The shape is
 * `contracts/schemas/report-rows.schema.json` of the feature (marked
 * **proposal** there; the tasks' shape of T135 governs here).
 */

/** The marking of a row the events cannot hold (F153-FR-040; a new closed set of one value beside `null`). */
export const NOT_IN_EVENTS = "not-in-events" as const;

/** One raw event: the line shape of the engine's events file (T135). */
export type ReportEvent = {
  readonly type: string;
  /** Milliseconds since the epoch, as the events file carries. */
  readonly at: number;
  readonly data: Readonly<Record<string, unknown>>;
};

/** One terse row of the report (T135). */
export type ReportRow = {
  readonly row: string;
  readonly value: number | string | null | Readonly<Record<string, number>>;
  readonly unit?: string;
};

/** The whole report (T135): a pure projection, never a second record store. */
export type Report = {
  readonly schema: "specstride.report-rows/1";
  readonly runId: string | null;
  readonly rows: readonly ReportRow[];
};

/** One paired attempt: closed attempts carry duration and cause; unclosed carry `null`. */
export type PairedAttempt = {
  readonly runId: string | null;
  readonly phase: string;
  readonly attempt: string;
  readonly startedAt: number;
  readonly durationMs: number | null;
  readonly endCause: string | null;
};

/**
 * T136 — pair `attempt.started` with `attempt.ended` on
 * (run, phase, attempt). The run comes from the event's data where the
 * stream carries it and is `null` where it does not (the run is the file).
 * An attempt with no closer is unclosed, with duration `null` — never
 * imputed.
 */
export function pairAttempts(events: readonly ReportEvent[]): {
  closed: PairedAttempt[];
  unclosed: PairedAttempt[];
} {
  const keyOf = (data: Record<string, unknown>): string =>
    `${str(data.run)}|${str(data.phase)}|${str(data.attempt)}`;
  const started = new Map<string, { event: ReportEvent; key: string }>();
  const closed: PairedAttempt[] = [];
  // A start whose key is opened again before any closer (a relaunch that
  // reuses an ordinal) stays a start of its own: unclosed, never overwritten.
  const superseded: { event: ReportEvent; key: string }[] = [];
  for (const event of events) {
    if (event.type === "attempt.started") {
      const key = keyOf(event.data);
      const earlier = started.get(key);
      if (earlier !== undefined) superseded.push(earlier);
      started.set(key, { event, key });
    } else if (event.type === "attempt.ended") {
      const key = keyOf(event.data);
      const open = started.get(key);
      started.delete(key);
      closed.push({
        runId: str(event.data.run),
        phase: str(event.data.phase),
        attempt: str(event.data.attempt),
        startedAt: open ? open.event.at : event.at,
        durationMs: open ? Math.max(0, event.at - open.event.at) : null,
        endCause: str(event.data.endCause),
      });
    }
  }
  const unclosed: PairedAttempt[] = [...superseded, ...started.values()].map(({ event, key }) => {
    const [runId, phase, attempt] = key.split("|");
    return {
      runId: runId === "null" ? null : runId,
      phase: phase ?? "",
      attempt: attempt ?? "",
      startedAt: event.at,
      durationMs: null,
      endCause: null,
    };
  });
  return { closed, unclosed };
}

/**
 * T137 — the median: `null` for an empty list, the mean of the two middle
 * values for an even count.
 */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function str(value: unknown): string {
  return value === undefined || value === null ? "null" : String(value);
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function seconds(ms: number): number {
  return ms / 1000;
}

/** Sum a numeric field of the events of one type (0 where none carries it). */
function sumOf(events: readonly ReportEvent[], type: string, field: string): number {
  return events.reduce(
    (sum, event) => sum + (event.type === type ? (num(event.data[field]) ?? 0) : 0),
    0,
  );
}

function countOf(events: readonly ReportEvent[], type: string): number {
  return events.filter((event) => event.type === type).length;
}

/** A timed open/close pair: total and median durations, `null` without pairs. */
function pairTimes(
  events: readonly ReportEvent[],
  openType: string,
  closeTypes: readonly string[],
  durationField: string | null,
): { total: number | null; medianValue: number | null } {
  const keyOf = (data: Record<string, unknown>): string =>
    `${str(data.phase)}|${str(data.attempt)}|${str(data.step)}`;
  const durations: number[] = [];
  const open = new Map<string, number>();
  for (const event of events) {
    if (event.type === openType) {
      open.set(keyOf(event.data), event.at);
    } else if (closeTypes.includes(event.type)) {
      const startedAt = open.get(keyOf(event.data));
      const carried = durationField === null ? null : num(event.data[durationField]);
      if (carried !== null) {
        durations.push(carried);
      } else if (startedAt !== undefined) {
        durations.push(Math.max(0, event.at - startedAt));
      }
      open.delete(keyOf(event.data));
    }
  }
  if (durations.length === 0) return { total: null, medianValue: null };
  return {
    total: durations.reduce((sum, value) => sum + value, 0),
    medianValue: median(durations),
  };
}

function timeRow(
  rows: ReportRow[],
  name: string,
  times: { total: number | null; medianValue: number | null },
  unit = "s",
): void {
  rows.push({
    row: `${name} total`,
    value: times.total === null ? NOT_IN_EVENTS : seconds(times.total),
    unit,
  });
  rows.push({
    row: `${name} median`,
    value: times.medianValue === null ? NOT_IN_EVENTS : seconds(times.medianValue),
    unit,
  });
}

/**
 * T138 to T143 — the whole projection: the rows of F153-FR-040 from the
 * events alone. `runId` is the run the stream belongs to (or `null` where
 * the caller has none); the rows never depend on it.
 */
export function reportRowsOf(events: readonly ReportEvent[], runId: string | null): Report {
  const rows: ReportRow[] = [];

  // Attempts (T127): paired on (run, phase, attempt); the totals and the
  // median count the closed attempts only — never an imputed duration.
  const paired = pairAttempts(events);
  const attemptSeconds = paired.closed.map((attempt) => attempt.durationMs ?? 0).map(seconds);
  rows.push({ row: "attempts started", value: paired.closed.length + paired.unclosed.length });
  rows.push({ row: "attempts closed", value: paired.closed.length });
  rows.push({ row: "attempts unclosed", value: paired.unclosed.length });
  rows.push({
    row: "attempt duration total",
    value: attemptSeconds.reduce((sum, value) => sum + value, 0),
    unit: "s",
  });
  rows.push({ row: "attempt duration median", value: median(attemptSeconds), unit: "s" });

  // Phases approved (T128): each approved phase with the attempt ordinal it
  // was approved on.
  // An approval is a `phase.ended` (the old vocabulary carries no outcome and
  // means approved; a recorded outcome other than "approved" is not one) or an
  // `attempt.ended` with `endCause: approved`; distinct (phase, attempt) pairs
  // are the approvals, distinct phases the phases approved.
  const approved: Record<string, number> = {};
  const approvals = new Set<string>();
  const approve = (phase: unknown, attempt: unknown): void => {
    const key = str(phase);
    if (key === "null") return;
    approvals.add(`${key}|${str(attempt)}`);
    const ordinal = num(attempt) ?? Number(attempt);
    approved[key] = Number.isFinite(ordinal) ? ordinal : 0;
  };
  for (const event of events) {
    if (event.type === "phase.ended") {
      const outcome = event.data.outcome;
      if (outcome === undefined || outcome === null || outcome === "approved") {
        approve(event.data.phase, event.data.attempt);
      }
    }
  }
  for (const attempt of paired.closed) {
    if (attempt.endCause === "approved") approve(attempt.phase, attempt.attempt);
  }
  rows.push({ row: "phases approved", value: approved });
  rows.push({ row: "phases approved count", value: Object.keys(approved).length });
  rows.push({ row: "approvals", value: approvals.size });
  rows.push({
    row: "approvals per attempt started",
    value: { approvals: approvals.size, started: paired.closed.length + paired.unclosed.length },
  });

  // In-pass checks (T129): count, failed, median, total, minimum, maximum,
  // and each duration with its own `concurrent` flag (F148).
  const checkEnds = events.filter((event) => event.type === "check.ended");
  const checkDurationsMs = checkEnds
    .map((event) => num(event.data.durationMs))
    .filter((value): value is number => value !== null);
  const checkSeconds = checkDurationsMs.map(seconds);
  const failedChecks = checkEnds.filter(
    (event) => event.data.result === "failed" || event.data.result === "fail",
  ).length;
  const concurrent: Record<string, number> = {};
  for (const event of checkEnds) {
    const durationMs = num(event.data.durationMs);
    if (durationMs === null) continue;
    // Keep unknown 'concurrent' as unknown: only record keys where the flag is present.
    if (Object.hasOwn(event.data, "concurrent")) {
      concurrent[String(seconds(durationMs))] = event.data.concurrent === true ? 1 : 0;
    }
  }
  rows.push({ row: "in-pass checks", value: checkEnds.length });
  rows.push({ row: "checks failed", value: failedChecks });
  const medMs = median(checkDurationsMs);
  rows.push({
    row: "check duration median",
    value: medMs === null ? null : seconds(medMs),
    unit: "s",
  });
  rows.push({
    row: "check duration total",
    value: seconds(checkDurationsMs.reduce((sum, value) => sum + value, 0)),
    unit: "s",
  });
  rows.push({
    row: "check duration minimum",
    value: checkSeconds.length === 0 ? null : Math.min(...checkSeconds),
    unit: "s",
  });
  rows.push({
    row: "check duration maximum",
    value: checkSeconds.length === 0 ? null : Math.max(...checkSeconds),
    unit: "s",
  });
  rows.push({ row: "check durations concurrent", value: concurrent });

  // End causes and commit-gate blocks (T130): the causes of row 272 as the
  // closers carry them; the blocks by rule; a block told apart from a critic
  // rejection by the `commit_gate.blocked` of the same phase and attempt.
  // Only closed-set values may appear in the output (F153-FR-003): filter unknowns.
  const END_CAUSES = new Set([
    "approved",
    "rejected",
    "malformed",
    "verification-failed",
    "no-evidence",
    "budget",
    "blocked",
    "stopped",
    "error",
    "crash",
  ]);
  const countsByFiltered = (
    ev: readonly ReportEvent[],
    type: string,
    field: string,
    accept: (key: string) => boolean,
  ): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const e of ev) {
      if (e.type !== type) continue;
      const key = str(e.data[field]);
      if (key === "null") continue;
      if (!accept(key)) {
        out.other = (out.other ?? 0) + 1;
        continue;
      }
      out[key] = (out[key] ?? 0) + 1;
    }
    return out;
  };
  rows.push({
    row: "attempts by endCause",
    value: countsByFiltered(events, "attempt.ended", "endCause", (k) => END_CAUSES.has(k)),
  });
  rows.push({
    row: "commit-gate blocks by rule",
    // Commit-gate rules are ids owned by the product and start with `cg-` (e.g. `cg-sk-prefix`).
    value: countsByFiltered(events, "commit_gate.blocked", "rules", (k) =>
      /^cg-[a-z0-9._-]{1,64}$/.test(k),
    ),
  });
  const blockedKeys = new Set(
    events
      .filter((event) => event.type === "commit_gate.blocked")
      .map((event) => `${str(event.data.phase)}|${str(event.data.attempt)}`),
  );
  const rejectionsFromBlock = paired.closed.filter(
    (attempt) =>
      attempt.endCause === "rejected" && blockedKeys.has(`${attempt.phase}|${attempt.attempt}`),
  ).length;
  rows.push({ row: "rejections from a commit-gate block", value: rejectionsFromBlock });

  // Passes ended by `hard_cap`, and the diagnostician calls (T131).
  const hardCapPasses = events.filter(
    (event) => event.type === "pass.ended" && event.data.endCause === "hard_cap",
  );
  const hardCapSeconds = hardCapPasses
    .map((event) => num(event.data.elapsed))
    .filter((value): value is number => value !== null)
    .map(seconds);
  rows.push({ row: "passes ended by hard_cap", value: hardCapPasses.length });
  rows.push({
    row: "hard_cap pass time total",
    value: hardCapSeconds.reduce((sum, value) => sum + value, 0),
    unit: "s",
  });
  // Diagnostician: support both legacy recovery.diagnosis_* and diagnostician_* spellings.
  const diagDurationsA = pairTimes(
    events,
    "diagnostician_start",
    ["diagnostician_done", "diagnostician_error"],
    null,
  );
  const diagDurationsB = pairTimes(
    events,
    "recovery.diagnosis_started",
    ["recovery.diagnosis_done", "recovery.diagnosis_error"],
    null,
  );
  const diagnosisCount =
    countOf(events, "diagnostician_start") + countOf(events, "recovery.diagnosis_started");
  const mergedDiagMedianMs = (() => {
    const parts: number[] = [];
    if (diagDurationsA.medianValue !== null) parts.push(diagDurationsA.medianValue);
    if (diagDurationsB.medianValue !== null) parts.push(diagDurationsB.medianValue);
    if (parts.length === 0) return null;
    return median(parts);
  })();
  rows.push({ row: "diagnostician calls", value: diagnosisCount });
  rows.push({
    row: "diagnostician duration median",
    value:
      diagnosisCount === 0
        ? NOT_IN_EVENTS
        : mergedDiagMedianMs === null
          ? null
          : seconds(mergedDiagMedianMs),
    unit: "s",
  });

  // Gate, critic and commit-scan times (T132): the pairs of F153-FR-034 to
  // F153-FR-036 where they exist; the marking where they do not.
  timeRow(
    rows,
    "gate time",
    pairTimes(events, "verification.started", ["verification.ended"], null),
  );
  timeRow(rows, "critic time", pairTimes(events, "critic.started", ["critic.call"], "latencyMs"));
  timeRow(
    rows,
    "commit-scan time",
    pairTimes(events, "commit_gate.started", ["commit_gate.ended"], "durationMs"),
  );

  // What the events cannot hold (T133): the marking, never an estimate.
  rows.push({ row: "critic split (missing or wrong / no evidence)", value: NOT_IN_EVENTS });
  rows.push({ row: "verdict MET and UNMET counts", value: NOT_IN_EVENTS });
  rows.push({ row: "pass-limit banners of a log", value: NOT_IN_EVENTS });

  const phaseTotals: Record<string, number> = {};
  for (const event of events) {
    if (event.type !== "phase.started") continue;
    const shape = String((event.data as Record<string, unknown>)["shape"] ?? "");
    if (shape !== "flat") continue;
    const phase = str(event.data.phase);
    const total = num(event.data.total);
    if (phase === "null" || total === null) continue;
    phaseTotals[phase] = total;
  }
  if (Object.keys(phaseTotals).length === 0)
    rows.push({ row: "tasks per phase", value: NOT_IN_EVENTS });
  else rows.push({ row: "tasks per phase", value: phaseTotals });

  // Dropped events (T134): the gap the stream itself reports (F111-FR-019).
  rows.push({ row: "events dropped", value: sumOf(events, "event.dropped", "count") });

  return { schema: "specstride.report-rows/1", runId, rows };
}
