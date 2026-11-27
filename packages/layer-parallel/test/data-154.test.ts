/**
 * T004 — the four rule tables of spec 154 in this layer (F154-FR-003):
 * the bytes of every file of `data-154/` named by `TABLE_FILES_154` are pinned
 * against `specs/154-concurrency-and-parallelism/contracts/rule-tables/`,
 * and every rule id of plan.md "Rule-id sets fixed by this plan" is a row of
 * its table (PG-0 to PG-3, RP-1, RP-2, MG-1 to MG-3, WC-1 to WC-4).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  TABLE_FILES_154,
  INDEPENDENCE_TABLE,
  REPEAT_TABLE,
  MERGE_CHECK_OUTCOME_TABLE,
  WORKER_CHECK_TABLE,
  RULE_IDS_154,
} from "../src/tables.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const SPEC_TABLES = join(
  HERE,
  "../../../specs/154-concurrency-and-parallelism/contracts/rule-tables",
);

/** The rows of a `specstride.table/1` file, keyed by its point id. */
function rowsOf(table: unknown): any[] {
  const rows = (table as any).rows as Record<string, any[]>;
  return Object.values(rows).flat();
}

const TABLES: Array<[string, unknown, string[]]> = [
  ["independence-table.json", INDEPENDENCE_TABLE, ["PG-0", "PG-1", "PG-2", "PG-3"]],
  ["repeat-table.json", REPEAT_TABLE, ["RP-1", "RP-2"]],
  ["merge-check-outcome-table.json", MERGE_CHECK_OUTCOME_TABLE, ["MG-1", "MG-2", "MG-3"]],
  ["worker-check-table.json", WORKER_CHECK_TABLE, ["WC-1", "WC-2", "WC-3", "WC-4"]],
];

for (const [name, table, expectedIds] of TABLES) {
  test(`${name}: the bytes are pinned against the specification's rule table`, () => {
    const copied = readFileSync(join(HERE, "../data-154", name), "utf8");
    const spec = readFileSync(join(SPEC_TABLES, name), "utf8");
    assert.equal(copied, spec, `${name} must be the byte-identical copy`);
  });

  test(`${name}: the constant holds the same object and the table shape`, () => {
    const parsed = JSON.parse(readFileSync(join(SPEC_TABLES, name), "utf8"));
    assert.deepEqual(table, parsed);
    assert.equal((parsed as any).schema, "specstride.table/1");
    // The rows are keyed by the table's point id, not a flat array.
    const points = (parsed as any).rows as Record<string, any[]>;
    assert.ok(Object.values(points).every((rows) => Array.isArray(rows)));
  });

  test(`${name}: every expected rule id is a row`, () => {
    const ids = rowsOf(table).map((row) => row.ruleId);
    for (const id of expectedIds) {
      assert.ok(ids.includes(id), `${id} must be a row of ${name}`);
    }
    assert.equal(ids.length, expectedIds.length, `${name} holds exactly its rows`);
  });
}

test("RULE_IDS_154 names every rule id of the four tables", () => {
  const ids = TABLES.flatMap(([, table]) => rowsOf(table).map((row) => row.ruleId)).sort();
  assert.deepEqual([...RULE_IDS_154].sort(), ids);
});
