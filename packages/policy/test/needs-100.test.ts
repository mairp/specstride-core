/**
 * T085 — THE ONE NEED OF FEATURE 127 THAT WAS STILL OPEN TOWARDS FEATURE 100:
 * the quota signal of annex D §D.4, or feature 100's confirmation that the
 * router asks the limit-window state (CQ-136).
 *
 * The report is `./needs-100.md`; this file holds it to what is on disk. The
 * need is SENT through the channel the repository uses for it,
 * `docs/ecosystem/STAGE-B-F100-AMENDMENTS.md` ("What the tier 2 features need
 * from feature 100"), and the ANSWER is read back through an INDEPENDENT READ
 * PATH: feature 100's own annexes and spec, which feature 127 never writes.
 *
 * Every assertion below reads a file of feature 100 read-only. A content hash
 * of the four answering passages is recomputed here and compared with the one
 * the report records, so the report cannot drift from feature 100's text.
 *
 * The three needs the task calls already satisfied — the logical name
 * `run:<runId>:spend` (annex B §B.5), rows 107 to 112 of annex X §X.7 and rows
 * 205 to 208 of annex X §X.6 — are checked here too, because "already exist"
 * is a claim about another feature's files and must be measured, not assumed.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { contentHash } from "@specstride/kernel/hasher";
import { LEDGER_LOGICAL_NAME } from "../src/budget/ledger.ts";
import {
  SKIP_REASON_LIMITED,
  decideEscalation,
  emptyWindowState,
  observeLimitWindow,
  readLimitWindow,
} from "../src/quota/windows.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..", "..");
const F100 = join(ROOT, "specs", "100-specstride");
const CHANNEL = join(ROOT, "docs", "ecosystem", "STAGE-B-F100-AMENDMENTS.md");

const ANNEX_D = readFileSync(join(F100, "annexes", "D-pass-loop.md"), "utf8");
const ANNEX_B = readFileSync(join(F100, "annexes", "B-state.md"), "utf8");
const ANNEX_X = readFileSync(join(F100, "annexes", "X-cross-layer.md"), "utf8");
const SPEC_100 = readFileSync(join(F100, "spec.md"), "utf8");
/** One section of annex X, so a row number of §X.6 is never read as one of §X.7. */
function annexXSection(heading: string): string {
  const start = ANNEX_X.indexOf(heading);
  assert.notEqual(start, -1, `annex X has no heading \`${heading}\``);
  const after = ANNEX_X.slice(start + heading.length);
  const end = after.search(/\n## /);
  return end === -1 ? after : after.slice(0, end);
}
const WORKLIST = readFileSync(join(F100, "amendments-worklist.md"), "utf8");
const REPORT = readFileSync(join(HERE, "needs-100.md"), "utf8");
const CHANNEL_TEXT = readFileSync(CHANNEL, "utf8");

/** The row of a numbered annex table: the line that STARTS with `| <n> |`. */
function rowOf(section: string, row: number, where: string): string {
  const prefix = `| ${row} | `;
  const line = section.split("\n").find((candidate) => candidate.startsWith(prefix));
  assert.ok(line !== undefined, `${where} has no row ${row}`);
  return line;
}

/** The one line of a file that holds a fragment, with its 1-based number. */
function lineWith(
  text: string,
  fragment: string,
  where: string,
): { readonly line: string; readonly number: number } {
  const lines = text.split("\n");
  const index = lines.findIndex((line) => line.includes(fragment));
  assert.notEqual(index, -1, `${where} has no line holding "${fragment}"`);
  return { line: lines[index] as string, number: index + 1 };
}

/* ------------------------------------------------------------------ *
 * The need was SENT: the row stands in the channel, with its answer.
 * ------------------------------------------------------------------ */

test("T085: the need stands in the channel to feature 100, as a row of feature 127", () => {
  const row = lineWith(
    CHANNEL_TEXT,
    "Annex D §D.4 lists no quota signal for the router",
    "the channel",
  );
  assert.ok(row.line.startsWith("| 127 |"), "the row is feature 127's");
  assert.match(row.line, /CQ-136/, "it names the clarification it came from");
  assert.equal(row.number, 141, "row 141 of the channel, as feature 100's worklist numbers it");
  assert.match(
    row.line,
    /\| yes \(confirmed by 127 on 2026-10-03, T085\)/,
    "the Applied cell now carries the answer this task read back",
  );
});

test("T085: the three needs the task calls satisfied are marked so in the channel too", () => {
  for (const fragment of [
    "Annex B §B.5: a logical name for the spend ledger",
    "Annex X §X.7: rows for `loop.maxWallMin`",
    "Annex X §X.6: four closed sets of 127",
  ]) {
    const row = lineWith(CHANNEL_TEXT, fragment, "the channel");
    assert.ok(row.line.startsWith("| 127 |"), `${fragment}: a row of 127`);
    assert.match(row.line, /\| yes \(confirmed by 127 on 2026-10-03, T085\)/, fragment);
  }
  // No row of another feature was touched: every other row still reads `no`,
  // `yes (B-8.…)` or a sentence of its own owner, none of them this task's.
  const mine = CHANNEL_TEXT.split("\n").filter((line) =>
    line.includes("confirmed by 127 on 2026-10-03, T085"),
  );
  assert.equal(mine.length, 4, "exactly the four rows of feature 127");
  for (const line of mine) assert.ok(line.startsWith("| 127 |"), "and each is a row of 127");
});

/* ------------------------------------------------------------------ *
 * The ANSWER, read back from feature 100's own files.
 * ------------------------------------------------------------------ */

const SIGNAL = "the state of the limit window of the target of an escalation";

test("T085: annex D §D.4 of feature 100 now lists the limit-window signal among the router's inputs", () => {
  const inputs = lineWith(ANNEX_D, SIGNAL, "annex D");
  assert.match(
    inputs.line,
    /failed command ids|signals|caps left/,
    "it is in the Inputs list of §D.4",
  );
  // §D.4 is the section of EP-06, the router rule table.
  const section = ANNEX_D.slice(ANNEX_D.indexOf("#### Inputs", ANNEX_D.indexOf(SIGNAL) - 4_000));
  assert.ok(section.includes(SIGNAL), "the signal stands under the Inputs of the decision point");
});

test("T085: F100-FR-130 says the escalation is skipped when the quota of the target is exhausted", () => {
  const fr130 = lineWith(ANNEX_D, "F100-FR-130", "annex D");
  assert.match(
    fr130.line,
    /When the quota of the target is exhausted the escalation MUST be skipped/,
    "the rule the limit-window state feeds",
  );
  assert.match(fr130.line, /the skip MUST be recorded/);
});

test("T085: feature 100's spec records the reading for 115 and 127 under CQ-136", () => {
  const row = lineWith(
    SPEC_100,
    "the signals include the state of the limit window of an escalation target",
    "feature 100's spec",
  );
  assert.match(row.line, /Annex D §D.4/);
  assert.match(row.line, /115, 127/, "the owners of the reading");
  assert.match(row.line, /CQ-136/, "the clarification feature 127 raised");
});

test("T085: feature 100's own worklist has the row done", () => {
  const row = lineWith(
    WORKLIST,
    "Annex D §D.4 lists no quota signal for the router",
    "the worklist",
  );
  assert.match(
    row.line,
    /^\| \[x\] \| 141 \| 127 \|/,
    "row 141, feature 127, ticked by feature 100",
  );
  assert.match(row.line, /change in place/);
});

/* ------------------------------------------------------------------ *
 * The three that already existed, measured rather than assumed.
 * ------------------------------------------------------------------ */

test("T085: annex B §B.5 carries the logical name of the spend ledger", () => {
  const row = lineWith(ANNEX_B, `\`${LEDGER_LOGICAL_NAME}\` | control`, "annex B");
  assert.match(row.line, /The spend ledger of the run/);
  assert.match(row.line, /\| Engine \|/, "the engine is the one writer");
  const schema = lineWith(ANNEX_B, "`specstride.spend/1`", "annex B");
  assert.match(schema.line, /run:<runId>:spend/);
  assert.match(schema.line, /\| 127 \|/, "owner 127");
});

test("T085: rows 107 to 112 of annex X §X.7 carry the keys of feature 127", () => {
  const wanted: readonly (readonly [number, string])[] = [
    [107, "`loop.maxWallMin`"],
    [108, "`budget.role.<role>.costUsd`"],
    [109, "`budget.alerts.thresholds`"],
    [110, "`budget.rates`"],
    [111, "`pause.marginMs`"],
    [112, "`roles.<role>.fallbackAfterMs`"],
  ];
  const section = annexXSection("## §X.7 The `parity` profile");
  for (const [row, key] of wanted) {
    const found = rowOf(section, row, "annex X §X.7");
    assert.ok(found.includes(key), `row ${row} of §X.7 carries ${key}`);
    assert.match(found, /\| 127 \|/, `row ${row} is owned by 127`);
  }
});

test("T085: rows 205 to 208 of annex X §X.6 carry the four closed sets of feature 127", () => {
  const wanted: readonly (readonly [number, string])[] = [
    [205, "Alert kinds"],
    [206, "Budget dimensions"],
    [207, "Sources of a reset time"],
    [208, "Reasons that skip a fallback entry"],
  ];
  const section = annexXSection("## §X.6 List of closed sets");
  for (const [row, name] of wanted) {
    const found = rowOf(section, row, "annex X §X.6");
    assert.ok(found.includes(name), `row ${row} of §X.6 is "${name}"`);
    assert.match(found, /\| 127 \|/, `row ${row} is owned by 127`);
  }
});

/* ------------------------------------------------------------------ *
 * The side of the need feature 127 owns: the state the router asks for.
 * ------------------------------------------------------------------ */

test("T085: feature 127 answers the query the signal names, through `windows.ts`", () => {
  const nowMs = Date.parse("2026-01-01T00:00:00.000Z");
  const base = { harness: "stub-harness", modelTier: "base" };
  const target = { harness: "stub-harness", modelTier: "big" };
  const state = observeLimitWindow(emptyWindowState(), {
    target,
    quotaClass: "quota_window",
    resetsAt: new Date(nowMs + 3_600_000).toISOString(),
    utilization: 1,
    rateLimitType: "tokens-per-window",
    observedAt: new Date(nowMs).toISOString(),
  });
  assert.equal(readLimitWindow(state, target, nowMs).limited, true, "the state answers `limited`");
  const decision = decideEscalation(state, base, target, nowMs);
  assert.equal(decision.skipped, true, "the escalation is skipped, as F100-FR-130 asks");
  assert.equal(decision.reason, SKIP_REASON_LIMITED);
  assert.deepEqual(decision.runsOn, base, "the work runs on the base model");
});

/* ------------------------------------------------------------------ *
 * The durable identity of the answer: a content hash of what was read.
 * ------------------------------------------------------------------ */

/** The four passages of feature 100 that answer the need, in a fixed order. */
const ANSWER = [
  lineWith(ANNEX_D, SIGNAL, "annex D").line.trim(),
  lineWith(ANNEX_D, "F100-FR-130", "annex D").line.trim(),
  lineWith(
    SPEC_100,
    "the signals include the state of the limit window of an escalation target",
    "spec",
  ).line.trim(),
  lineWith(WORKLIST, "Annex D §D.4 lists no quota signal for the router", "worklist").line.trim(),
].join("\n");

test("T085: the report records the content hash of the answer, and it is this one", () => {
  const hash = contentHash(ANSWER);
  assert.match(hash, /^[0-9a-f]{64}$/, "the canonical hasher of feature 100 (annex X §X.5)");
  assert.ok(
    REPORT.includes(hash),
    `\`needs-100.md\` must record the hash of the answer; it is ${hash}`,
  );
});

test("T085: the report states the outcome the files support, and no stronger one", () => {
  assert.match(REPORT, /CQ-136/);
  assert.match(REPORT, /answered/i, "the need is answered, not merely sent");
  assert.ok(
    !/\bopen\b(?![^.]*no longer)/i.test(REPORT.split("## ")[1] ?? ""),
    "the summary does not call it open",
  );
});
