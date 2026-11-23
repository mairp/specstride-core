// T159 — ledger method: recompute rows the frozen events actually hold (M2, M3, M4, M6).
import { readFileSync, writeFileSync } from "node:fs";
const [inArg, outArg] = process.argv.slice(2);
const r3 = (x) => Math.round(Number(x) * 1000) / 1000; // seconds to 3 decimals for display stability
const toSec = (ms) => r3(ms / 1000);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const median = (xs) => {
  if (xs.length === 0) return null;
  const a = [...xs].sort((x, y) => x - y),
    m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};
const events = readFileSync(inArg ?? new URL("./events.jsonl", import.meta.url), "utf8")
  .split("\n")
  .filter((x) => x.trim() !== "")
  .map((x) => JSON.parse(x))
  .map(({ type, at, data }) => ({ type, at: typeof at === "string" ? Date.parse(at) : at, data }));
// Attempts paired on (phase, attempt); unclosed carry no duration.
const opened = new Map(),
  endCauses = {},
  closedMs = [],
  approved = {};
for (const { type, at, data: d } of events) {
  const key = `${d.phase}|${d.attempt}`;
  if (type === "attempt.started") opened.set(key, at);
  if (type === "attempt.ended") {
    const t0 = opened.get(key);
    if (t0 !== undefined) closedMs.push(at - t0);
    if (d.endCause === "approved") approved[String(d.phase)] = Number(d.attempt);
    endCauses[String(d.endCause ?? "")] = (endCauses[String(d.endCause ?? "")] ?? 0) + 1;
  }
}
const attemptsStarted = events.filter((e) => e.type === "attempt.started").length;
const attemptsClosed = events.filter((e) => e.type === "attempt.ended").length;
const attemptsUnclosed = Math.max(0, attemptsStarted - attemptsClosed);
const attemptSeconds = closedMs.map(toSec);
// In-pass checks: counts and durations.
const checkEnds = events.filter((e) => e.type === "check.ended");
const checkMs = checkEnds.map((e) => Number(e.data.durationMs)).filter((v) => Number.isFinite(v));
const checkSec = checkMs.map(toSec);
const checksFailed = checkEnds.filter((e) => e.data.result === "failed").length;
// Commit-gate: rule counts and rejections from a block.
const blocksByRule = {};
for (const e of events)
  if (e.type === "commit_gate.blocked")
    for (const r of String(e.data.rules ?? "").split(","))
      if (r !== "") blocksByRule[r] = (blocksByRule[r] ?? 0) + 1;
const blockedKeys = new Set(
  events
    .filter((e) => e.type === "commit_gate.blocked")
    .map((e) => `${e.data.phase}|${e.data.attempt}`),
);
const rejectionsFromBlock = events.filter(
  (e) =>
    e.type === "attempt.ended" &&
    e.data.endCause === "rejected" &&
    blockedKeys.has(`${e.data.phase}|${e.data.attempt}`),
).length;
// Hard-cap passes: count and summed elapsed.
const hardCaps = events.filter((e) => e.type === "pass.ended" && e.data.endCause === "hard_cap");
const hardCapTotal = toSec(sum(hardCaps.map((e) => Number(e.data.elapsed ?? 0))));
// Diagnostician: pair starts with done/error by (phase, attempt).
const diagOpen = new Map(),
  diagDurations = [];
for (const { type, at, data: d } of events) {
  const key = `${d.phase}|${d.attempt}`;
  if (type === "diagnostician_start") diagOpen.set(key, at);
  if (type === "diagnostician_done" || type === "diagnostician_error") {
    const t0 = diagOpen.get(key);
    if (t0 !== undefined) diagDurations.push(at - t0);
    diagOpen.delete(key);
  }
}
const rows = [];
rows.push({ row: "attempts started", value: attemptsStarted });
rows.push({ row: "attempts closed", value: attemptsClosed });
rows.push({ row: "attempts unclosed", value: attemptsUnclosed });
rows.push({ row: "attempt duration total", value: r3(sum(attemptSeconds)), unit: "s" });
rows.push({ row: "attempt duration median", value: median(attemptSeconds), unit: "s" });
rows.push({ row: "phases approved", value: approved });
rows.push({ row: "in-pass checks", value: checkEnds.length });
rows.push({ row: "checks failed", value: checksFailed });
rows.push({
  row: "check duration median",
  value: (() => {
    const m = median(checkMs);
    return m === null ? null : toSec(m);
  })(),
  unit: "s",
});
rows.push({ row: "check duration total", value: r3(sum(checkSec)), unit: "s" });
rows.push({
  row: "check duration minimum",
  value: checkSec.length === 0 ? null : Math.min(...checkSec),
  unit: "s",
});
rows.push({
  row: "check duration maximum",
  value: checkSec.length === 0 ? null : Math.max(...checkSec),
  unit: "s",
});
rows.push({ row: "check durations concurrent", value: {} });
rows.push({
  row: "attempts by endCause",
  value: Object.fromEntries(Object.entries(endCauses).filter(([k]) => k !== "")),
});
rows.push({ row: "commit-gate blocks by rule", value: blocksByRule });
rows.push({ row: "rejections from a commit-gate block", value: rejectionsFromBlock });
rows.push({ row: "passes ended by hard_cap", value: hardCaps.length });
rows.push({ row: "hard_cap pass time total", value: hardCapTotal, unit: "s" });
rows.push({ row: "diagnostician calls", value: diagDurations.length });
rows.push({
  row: "diagnostician duration median",
  value: diagDurations.length === 0 ? "not-in-events" : toSec(median(diagDurations)),
  unit: "s",
});
rows.push({
  row: "events dropped",
  value: sum(
    events.filter((e) => e.type === "event.dropped").map((e) => Number(e.data.count ?? 0)),
  ),
});
writeFileSync(
  outArg ?? new URL("./expected.json", import.meta.url),
  `${JSON.stringify({ schema: "specstride.report-rows/1", runId: null, rows }, null, 2)}\n`,
);
