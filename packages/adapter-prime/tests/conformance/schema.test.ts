/**
 * T005 — the schema checks of phase 1: the descriptor of the prime adapter,
 * `specs/138-adapter-prime/contracts/descriptor-prime.json`, loads against
 * `harness-descriptor.schema.json` of feature 100, and the dialect row,
 * `specs/138-adapter-prime/contracts/dialect-row-prime.json`, loads against
 * `stream-dialect-row.schema.json` of feature 100 (F138-FR-001, F138-FR-024).
 *
 * The validator is the one of feature 100 (`@specstride/contracts`,
 * `records/compile`, Ajv 8.20.0, draft 2020-12). The two schema files of
 * feature 100 are read here directly and their `$id` is asserted equal to the
 * schema id the validator compiles, so the check is against feature 100's own
 * schemas, not a copy.
 */
import test from "node:test";
import assert from "node:assert/strict";
import descriptorSchema from "../../../../vendor/specs/100-specstride/contracts/schemas/harness-descriptor.schema.json" with { type: "json" };
import dialectRowSchema from "../../../../vendor/specs/100-specstride/contracts/schemas/stream-dialect-row.schema.json" with { type: "json" };
import descriptorContract from "../../../../vendor/specs/138-adapter-prime/contracts/descriptor-prime.json" with { type: "json" };
import dialectRowContract from "../../../../vendor/specs/138-adapter-prime/contracts/dialect-row-prime.json" with { type: "json" };
import { validate } from "@specstride/contracts/records/compile";
import {
  DESCRIPTOR_SCHEMA_ID,
  DIALECT_ROW_SCHEMA_ID,
  primeDescriptor,
  primeDialectRow,
} from "../../src/index.ts";

const DESCRIPTOR = descriptorContract as Record<string, unknown>;
const DIALECT_ROW = dialectRowContract as Record<string, unknown>;

test("T005: the schema files of feature 100 carry the ids the validator compiles", () => {
  assert.equal(descriptorSchema.$id, `urn:specstride:schema:${DESCRIPTOR_SCHEMA_ID}`);
  assert.equal(dialectRowSchema.$id, `urn:specstride:schema:${DIALECT_ROW_SCHEMA_ID}`);
});

test("T005: contracts/descriptor-prime.json satisfies harness-descriptor.schema.json", () => {
  const result = validate(DESCRIPTOR_SCHEMA_ID, DESCRIPTOR);
  assert.equal(result.ok, true, JSON.stringify(result.ok ? null : result.errors));
  if (result.ok) {
    assert.equal(result.record.id, "prime");
    assert.equal(result.record.kind, "cli");
    assert.equal(result.record.descriptorVersion, 1);
  }
});

test("T005: contracts/dialect-row-prime.json satisfies stream-dialect-row.schema.json", () => {
  const result = validate(DIALECT_ROW_SCHEMA_ID, DIALECT_ROW);
  assert.equal(result.ok, true, JSON.stringify(result.ok ? null : result.errors));
  if (result.ok) {
    assert.equal(result.record.dialect, "prime");
    assert.deepEqual(result.record.schemaVersions, [3]);
    assert.equal(result.record.terminalDecides, true);
  }
});

test("T005: a descriptor with an unknown top-level key is refused", () => {
  const broken = { ...DESCRIPTOR, notAFieldOfTheAnnex: true };
  const result = validate(DESCRIPTOR_SCHEMA_ID, broken);
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((e) => e.keyword === "additionalProperties"));
});

test("T005: a dialect row without the schema versions list is refused", () => {
  const broken = { ...DIALECT_ROW, schemaVersions: 3 };
  const result = validate(DIALECT_ROW_SCHEMA_ID, broken);
  assert.equal(result.ok, false);
});

test("T005: the descriptor and the row the package exports are the contract files", () => {
  assert.deepEqual(primeDescriptor, DESCRIPTOR);
  assert.deepEqual(primeDialectRow, DIALECT_ROW);
});
