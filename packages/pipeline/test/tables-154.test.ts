/**
 * T008 — the stage-admission rule table of spec 154 (F154-FR-003, F154-FR-048):
 * the bytes of `data/stage-admission-table.json` are pinned against
 * `specs/154-concurrency-and-parallelism/contracts/rule-tables/`, and every
 * rule id of plan.md's SG set (SG-1 to SG-4) is a row of the table.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { STAGE_ADMISSION_TABLE } from "../src/executor/tables.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const SPEC_TABLES = join(
  HERE,
  "../../../specs/154-concurrency-and-parallelism/contracts/rule-tables",
);

test("stage-admission-table.json: the bytes are pinned against the specification", () => {
  const copied = readFileSync(join(HERE, "../data/stage-admission-table.json"), "utf8");
  const spec = readFileSync(join(SPEC_TABLES, "stage-admission-table.json"), "utf8");
  assert.equal(copied, spec, "must be the byte-identical copy");
});

test("stage-admission-table.json: the constant holds the same object", () => {
  const parsed = JSON.parse(
    readFileSync(join(SPEC_TABLES, "stage-admission-table.json"), "utf8"),
  );
  assert.deepEqual(STAGE_ADMISSION_TABLE, parsed);
  assert.equal((parsed as any).schema, "specstride.table/1");
});

test("stage-admission-table.json: SG-1 to SG-4 are rows", () => {
  const rows = Object.values(
    (STAGE_ADMISSION_TABLE as any).rows as Record<string, any[]>,
  ).flat();
  const ids = rows.map((row) => row.ruleId);
  for (const id of ["SG-1", "SG-2", "SG-3", "SG-4"]) {
    assert.ok(ids.includes(id), `${id} must be a row`);
  }
});
