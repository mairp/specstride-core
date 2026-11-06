/**
 * T005 — `contracts/alias-table.tsv` is complete against the 226 items of kind
 * `env` of `docs/ecosystem/research/R18-behaviour-inventory.tsv`
 * (F110-FR-020).
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  coverage,
  defaultPlaces,
  DV_064_ITEMS,
  NOT_A_VARIABLE,
  readAliasTable,
  readEnvItems,
  rowCovers,
  run,
} from "../../tools/alias-coverage.ts";

const places = defaultPlaces();
const inventoryText = readFileSync(places.inventoryPath, "utf8");
const aliasText = readFileSync(places.aliasPath, "utf8");

test("T005: the inventory holds exactly 226 items of kind env", () => {
  assert.equal(readEnvItems(inventoryText).length, 226);
});

test("T005: every as-is variable of those items has a row, or is omitted by DV-064", () => {
  const report = run();
  assert.equal(report.envItemCount, 226);
  assert.deepEqual(
    report.uncovered,
    [],
    `every variable is placed; still open: ${report.uncovered.map((u) => u.variable).join(", ")}`,
  );
  assert.ok(report.variables.length >= 150, `${report.variables.length} variables placed`);
});

test("T005: the variables of the locally registered backend are omitted (DV-064)", () => {
  const report = run();
  // The nine items DV-064 removes name these six variables and no others; none
  // of them may have a row that reaches a key.
  assert.deepEqual(report.omittedByDv064, [
    "<LOCAL_BACKEND>_SH",
    "SPECSTRIDE_<GATEWAY>_KEY",
    "SPECSTRIDE_<GATEWAY>_URL",
    "SPECSTRIDE_<LOCAL_BACKEND>_BACKEND",
    "SPECSTRIDE_<LOCAL_BACKEND>_CRITIC_MODEL",
    "SPECSTRIDE_CRITIC_VIA",
  ]);
  const rows = readAliasTable(aliasText);
  for (const v of report.omittedByDv064) {
    const row = rows.find((r) => r.variable === v);
    if (row) {
      assert.equal(row.key, "(not carried)", `${v} reaches no key`);
    }
  }
  assert.equal(DV_064_ITEMS.length, 9);
});

test("T005: every row names a variable, and a key or `(no key)` / `(not carried)`", () => {
  const rows = readAliasTable(aliasText);
  assert.ok(rows.length >= 150, `${rows.length} rows`);
  const seen = new Set<string>();
  for (const r of rows) {
    assert.ok(r.variable.length > 0, "the variable column is never empty");
    assert.ok(r.key.length > 0, `the key column of ${r.variable} is never empty`);
    assert.ok(!seen.has(r.variable), `${r.variable} has one row only`);
    seen.add(r.variable);
    if (r.key === "(no key)" || r.key === "(not carried)") {
      assert.ok(r.note.length > 0, `${r.variable} says why it reaches no key`);
    }
  }
});

test("T005: the rows are ordered — the aliases, then `(no key)`, then `(not carried)`", () => {
  const kinds = readAliasTable(aliasText).map((r) =>
    r.key === "(no key)" ? 1 : r.key === "(not carried)" ? 2 : 0,
  );
  for (let i = 1; i < kinds.length; i++) {
    assert.ok(kinds[i] >= kinds[i - 1], `the block boundary holds at row ${i + 1}`);
  }
});

test("T005: §K.8 — every alias the spec names has its row", () => {
  const rows = readAliasTable(aliasText);
  const covered = (v: string): boolean => rows.some((r) => rowCovers(r.variable, v));
  for (const v of [
    "SPECSTRIDE_DSH_PLUGIN_ALLOWLIST",
    "SPECSTRIDE_DSH_PLUGIN_TIMEOUT",
    "SPECSTRIDE_DSH_REASONING_EFFORT",
    "SPECSTRIDE_CONTEXT_BUDGET",
    "SPECSTRIDE_PROMPT_PROTECTED_BLOCKS",
    "SPECSTRIDE_TICK_TASKS",
    "SPECSTRIDE_YIELD_COUNTS_AS_ITER",
    "SPECSTRIDE_WATCHDOG_TICK",
    "SPECSTRIDE_VERIFY_TAIL_LINES",
    "SPECSTRIDE_VERIFY_TAIL_ERR_LINES",
    "SPECSTRIDE_AGENT_STREAM",
    "SPECSTRIDE_AGENT_TAP",
    "SPECSTRIDE_OTEL_TRACES",
    "RALPH_LOKI_URL",
    "RALPH_OTEL_URL",
    "RALPH_LOKI_TIMEOUT",
    "RALPH_OTEL_TIMEOUT",
    "RALPH_LOKI_MAX_BATCH_BYTES",
    "RALPH_OTEL_MAX_BATCH_BYTES",
    "SPECSTRIDE_PRIME_FLEET_BIN",
    "SPECSTRIDE_PRIME_BIN",
    "NO_COLOR",
    "FORCE_COLOR",
    "TERM",
    "COLORTERM",
  ]) {
    assert.ok(covered(v), `§K.8 names ${v}`);
  }
});

test("T005: one variable may feed several keys, and the WIGGUM family is not carried", () => {
  const rows = readAliasTable(aliasText);
  const contextBudget = rows.find((r) => r.variable === "SPECSTRIDE_CONTEXT_BUDGET");
  assert.ok(contextBudget);
  assert.equal(contextBudget.key, "spec.contextBudget; reverse.contextBudget");
  const wiggum = rows.find((r) => r.variable === "WIGGUM_*");
  assert.ok(wiggum);
  assert.equal(wiggum.key, "(not carried)");
  assert.match(wiggum.note, /never read|no deprecation/);
});

// ---------------------------------------------------------------------------
// The negative cases: the check must FAIL when a variable loses its row.
// ---------------------------------------------------------------------------

test("T005 negative: a variable whose row is removed is reported as uncovered", () => {
  const without = aliasText
    .split("\n")
    .filter((l) => !l.startsWith("SPECSTRIDE_MAX_ITER\t"))
    .join("\n");
  const report = coverage(inventoryText, without);
  assert.deepEqual(
    report.uncovered.map((u) => u.variable),
    ["SPECSTRIDE_MAX_ITER"],
  );
  assert.deepEqual(report.uncovered[0].items.sort(), ["B-0040", "B-0487"]);
});

test("T005 negative: an empty table leaves every variable uncovered", () => {
  const report = coverage(inventoryText, "as-is variable\tkey\tnote\n");
  assert.equal(report.uncovered.length, report.variables.length);
  assert.ok(report.uncovered.length > 150);
});

test("T005: a family row covers a name with a placeholder segment", () => {
  assert.ok(rowCovers("SPECSTRIDE_<HARNESS>_OVERLAY", "SPECSTRIDE_<BACKEND>_OVERLAY"));
  assert.ok(rowCovers("SPECSTRIDE_<HARNESS>_CRITIC_MODEL", "SPECSTRIDE_DSH_CRITIC_MODEL"));
  assert.ok(rowCovers("WIGGUM_*", "WIGGUM_LEARNING"));
  assert.ok(!rowCovers("SPECSTRIDE_MAX_ITER", "SPECSTRIDE_MAX_ITERS"));
});

test("T005: every token the check skips is named with its reason", () => {
  for (const [token, reason] of NOT_A_VARIABLE) {
    assert.ok(token.length > 0);
    assert.ok(reason.length > 0, `${token} says why it is not a variable`);
  }
  assert.ok(NOT_A_VARIABLE.has("GIT_COMMITS"), "the conf key of `resume`, not a variable");
});
