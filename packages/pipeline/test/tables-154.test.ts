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

import { LANDING_TABLE, STAGE_ADMISSION_TABLE } from "../src/executor/tables.ts";

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
  const parsed = JSON.parse(readFileSync(join(SPEC_TABLES, "stage-admission-table.json"), "utf8"));
  assert.deepEqual(STAGE_ADMISSION_TABLE, parsed);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the parity rows of spec 154 are read as written
  assert.equal((parsed as any).schema, "specstride.table/1");
});

test("stage-admission-table.json: SG-1 to SG-4 are rows", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the parity rows of spec 154 are read as written
  const rows = Object.values((STAGE_ADMISSION_TABLE as any).rows as Record<string, any[]>).flat();
  const ids = rows.map((row) => row.ruleId);
  for (const id of ["SG-1", "SG-2", "SG-3", "SG-4"]) {
    assert.ok(ids.includes(id), `${id} must be a row`);
  }
});

/**
 * T125 — the landing rule table of spec 154 (F154-FR-050…-052,
 * F154-FR-003): the bytes of `data/landing-table.json` are pinned against
 * the specification the same way, and every rule id of the LD set (LD-1 to
 * LD-4) is a row of the table.
 */
test("landing-table.json: the bytes are pinned against the specification", () => {
  const copied = readFileSync(join(HERE, "../data/landing-table.json"), "utf8");
  const spec = readFileSync(join(SPEC_TABLES, "landing-table.json"), "utf8");
  assert.equal(copied, spec, "must be the byte-identical copy");
});

test("landing-table.json: the constant holds the same object", () => {
  const parsed = JSON.parse(readFileSync(join(SPEC_TABLES, "landing-table.json"), "utf8"));
  assert.deepEqual(LANDING_TABLE, parsed);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the parity rows of spec 154 are read as written
  assert.equal((parsed as any).schema, "specstride.table/1");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the parity rows of spec 154 are read as written
  assert.equal((parsed as any).id, "pipeline.landing");
});

test("landing-table.json: LD-1 to LD-4 are rows", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the parity rows of spec 154 are read as written
  const rows = Object.values((LANDING_TABLE as any).rows as Record<string, any[]>).flat();
  const ids = rows.map((row) => row.ruleId);
  for (const id of ["LD-1", "LD-2", "LD-3", "LD-4"]) {
    assert.ok(ids.includes(id), `${id} must be a row`);
  }
});
