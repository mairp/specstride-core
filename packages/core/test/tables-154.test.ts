/**
 * T007 — the five rule tables of spec 154 in `@specstride/core`
 * (F154-FR-003): the bytes of every file of `data/` written by T005 and T006
 * are pinned against
 * `specs/154-concurrency-and-parallelism/contracts/rule-tables/`, and every
 * rule id of plan.md "Rule-id sets fixed by this plan" is a row of its table
 * (SL-1 to SL-5, LD-1 to LD-4, PQ-1 to PQ-3, SP-1 to SP-6, TRI-1 to TRI-3).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { SLOT_ADMISSION_TABLE } from "../src/host-limits/tables.ts";
import { LANDING_TABLE } from "../src/landing/tables.ts";
import { VALIDATION_QUEUE_TABLE } from "../src/phase-queue/tables.ts";
import { SPECULATION_TABLE } from "../src/speculation/tables.ts";
import { TRIAL_PASS_MARK_TABLE } from "../src/trial/tables.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const SPEC_TABLES = join(
  HERE,
  "../../../specs/154-concurrency-and-parallelism/contracts/rule-tables",
);

/** The rows of a `specstride.table/1` file, keyed by its point id. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the parity rows of spec 154 are read as written
function rowsOf(table: unknown): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the parity rows of spec 154 are read as written
  return Object.values((table as any).rows as Record<string, any[]>).flat();
}

const TABLES: Array<[string, unknown, string[]]> = [
  ["slot-admission-table.json", SLOT_ADMISSION_TABLE, ["SL-1", "SL-2", "SL-3", "SL-4", "SL-5"]],
  ["landing-table.json", LANDING_TABLE, ["LD-1", "LD-2", "LD-3", "LD-4"]],
  ["validation-queue-table.json", VALIDATION_QUEUE_TABLE, ["PQ-1", "PQ-2", "PQ-3"]],
  ["speculation-table.json", SPECULATION_TABLE, ["SP-1", "SP-2", "SP-3", "SP-4", "SP-5", "SP-6"]],
  ["trial-pass-mark-table.json", TRIAL_PASS_MARK_TABLE, ["TRI-1", "TRI-2", "TRI-3"]],
];

for (const [name, table, expectedIds] of TABLES) {
  test(`${name}: the bytes are pinned against the specification's rule table`, () => {
    const copied = readFileSync(join(HERE, "../data", name), "utf8");
    const spec = readFileSync(join(SPEC_TABLES, name), "utf8");
    assert.equal(copied, spec, `${name} must be the byte-identical copy`);
  });

  test(`${name}: the constant holds the same object and the table shape`, () => {
    const parsed = JSON.parse(readFileSync(join(SPEC_TABLES, name), "utf8"));
    assert.deepEqual(table, parsed);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the parity rows of spec 154 are read as written
    assert.equal((parsed as any).schema, "specstride.table/1");
  });

  test(`${name}: every expected rule id is a row`, () => {
    const ids = rowsOf(table).map((row) => row.ruleId);
    for (const id of expectedIds) {
      assert.ok(ids.includes(id), `${id} must be a row of ${name}`);
    }
  });
}

test("the trial table carries its pass row TRI-pass", () => {
  const ids = rowsOf(TRIAL_PASS_MARK_TABLE).map((row) => row.ruleId);
  assert.ok(ids.includes("TRI-pass"));
});
