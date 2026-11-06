/**
 * T289 — the JSON Schema builder of the generator.
 *
 * The proof is `schemas/lease.schema.json` rebuilt from the field table of
 * annex B §B.8 and compared with the committed file byte for byte. The three
 * parts are tested on their own too: the type in words, the placing of a
 * dotted field path, and the `$id` of a schema file.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readAnnexes, dump } from "../src/write-tables.ts";
import { oneType, place, recordSchema, RECORDS, typesFor } from "../src/schema.ts";
import { defaultPlaces, URN } from "../src/paths.ts";

const places = defaultPlaces();
const corpus = readAnnexes(places.annexDir);

test("T289 lease.schema.json is rebuilt from annex B §B.8 byte for byte", () => {
  const spec = RECORDS.find((r) => r.stem === "lease");
  assert.ok(spec !== undefined);
  assert.equal(spec.annex, "B");
  assert.equal(spec.section, "§B.8");
  assert.equal(spec.sid, "specstride.lease/1");
  const built = dump(recordSchema(corpus.tables, spec));
  const committed = readFileSync(join(places.contractsDir, "schemas/lease.schema.json"), "utf8");
  assert.equal(built, committed);
});

test("T289 the `$id` of a schema file is the urn of its schema id", () => {
  const spec = RECORDS.find((r) => r.stem === "lease");
  assert.ok(spec !== undefined);
  const schema = recordSchema(corpus.tables, spec) as Record<string, unknown>;
  assert.equal(schema["$id"], URN + "specstride.lease/1");
  assert.equal(schema["$id"], "urn:specstride:schema:specstride.lease/1");
  assert.equal(schema["x-schema-id"], "specstride.lease/1");
  assert.equal(schema["x-annex"], "annex B, §B.8");
});

test("T289 every property carries description, x-type-in-words and x-required", () => {
  const spec = RECORDS.find((r) => r.stem === "lease");
  assert.ok(spec !== undefined);
  const schema = recordSchema(corpus.tables, spec) as {
    properties: Record<string, Record<string, unknown>>;
  };
  const names = Object.keys(schema.properties);
  assert.ok(names.length > 0);
  for (const name of names) {
    const node = schema.properties[name];
    assert.ok(typeof node["description"] === "string", name);
    assert.ok(typeof node["x-type-in-words"] === "string", name);
    assert.ok(typeof node["x-required"] === "string", name);
  }
});

test("T289 the two common rules are stated on every schema", () => {
  for (const spec of RECORDS) {
    const schema = recordSchema(corpus.tables, spec) as Record<string, unknown>;
    assert.equal(schema["x-different-major"], "refused (annex B, §B.4)");
    if (spec.closed) {
      assert.equal(schema["x-unknown-field"], "refused, except keys under x-");
      assert.equal(schema["additionalProperties"], false);
      assert.deepEqual(schema["patternProperties"], { "^x-": {} });
    } else {
      assert.equal(schema["x-unknown-field"], "ignored by a reader (annex B, §B.4)");
      assert.equal(schema["additionalProperties"], true);
    }
  }
});

test("T289 the type in words becomes a JSON Schema type", () => {
  assert.deepEqual(oneType("Text"), { type: "string" });
  assert.deepEqual(oneType("Whole number"), { type: "integer" });
  assert.deepEqual(oneType("Truth value"), { type: "boolean" });
  assert.deepEqual(oneType("Timestamp"), { type: "string", format: "date-time" });
  assert.deepEqual(oneType("Date"), { type: "string", format: "date" });
  assert.deepEqual(oneType("List of text"), { type: "array" });
  assert.deepEqual(oneType("Record"), { type: "object" });
  assert.deepEqual(oneType("Member of a closed set"), { type: "string" });
  assert.deepEqual(oneType("Text, or null"), { type: ["string", "null"] });
  assert.deepEqual(oneType("Something the builder does not know"), {});
  // One cell for several names: the same type, or one type per part.
  assert.deepEqual(typesFor("Text", 1), [{ type: "string" }]);
  assert.deepEqual(typesFor("Text", 2), [{ type: "string" }, { type: "string" }]);
  assert.deepEqual(typesFor("Text, Whole number", 2), [{ type: "string" }, { type: "integer" }]);
});

test("T289 a dotted field path is placed below the schema", () => {
  const root: Record<string, unknown> = { type: "object" };
  place(root, "owner.pid", { type: "integer" }, true);
  place(root, "owner.host", { type: "string" }, false);
  place(root, "units[].id", { type: "string" }, false);
  assert.deepEqual(root, {
    type: "object",
    properties: {
      owner: {
        type: "object",
        properties: { pid: { type: "integer" }, host: { type: "string" } },
        required: ["pid"],
      },
      units: { type: "array", items: { type: "object", properties: { id: { type: "string" } } } },
    },
  });
});
