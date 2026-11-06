/**
 * T004 — the delivery of feature 115's data and schema files into the
 * `contracts` package: `data/ledger-micro-115.json`,
 * `data/integrity-rules-115.json` and `schemas/checkpoint-115.schema.json`,
 * delivered from `specs/115-micro-loop-layer/contracts/deliver.json` by the
 * sync script of feature 100 (the one writer of the package directories,
 * proposal U1 of `analyze-report.md`).
 *
 * The tests observe the delivered state: byte identity with the source the
 * manifest names, targets that all end in `-115` and take the name of no
 * file of feature 100 or of feature 116, the two data files valid against
 * the shape their `schema` field declares, and the checkpoint schema
 * compiled — both directly with Ajv and through the package's own lazy
 * validator (`validatorFor`, so the delivery also reached the generated
 * schema map) — and proved against a sample checkpoint record.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validate, validatorFor } from "../src/records/compile.ts";
import { Ajv2020 } from "ajv/dist/2020.js";

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = resolve(PKG_ROOT, "../..");
const FEATURE = "specs/115-micro-loop-layer/contracts";

const deliver = JSON.parse(readFileSync(resolve(ROOT, `${FEATURE}/deliver.json`), "utf8")) as {
  schema: string;
  owner: string;
  data: Record<string, string>;
  schemas: Record<string, string>;
};

test("T004: the manifest delivers exactly the three files of feature 115", () => {
  assert.equal(deliver.schema, "specstride.deliver-115/1");
  assert.equal(deliver.owner, "115");
  assert.deepEqual(Object.keys(deliver.data).sort(), [
    "integrity-rules-115.json",
    "ledger-micro-115.json",
  ]);
  assert.deepEqual(Object.keys(deliver.schemas), ["checkpoint-115.schema.json"]);
});

test("T004: every delivered target ends in -115 and names no file of another feature", () => {
  const targets = [...Object.keys(deliver.data), ...Object.keys(deliver.schemas)];
  for (const target of targets) {
    assert.match(target, /-115(\.schema)?\.json$/, `${target} ends in -115`);
  }
  for (const dir of ["data", "schemas"] as const) {
    for (const name of readdirSync(resolve(PKG_ROOT, dir))) {
      if (/-115/.test(name)) continue; // a file of this feature
      // No target of feature 115 may take the name of an existing file of
      // the package (feature 100's clean copy, or another feature's delivery).
      assert.ok(
        !targets.includes(name),
        `the target name ${name} would overwrite an existing file of ${dir}/`,
      );
    }
  }
});

test("T004: every delivered file is byte-identical to the source the manifest names", () => {
  for (const key of ["data", "schemas"] as const) {
    for (const [target, source] of Object.entries(deliver[key])) {
      const from = readFileSync(resolve(ROOT, FEATURE, source));
      const to = readFileSync(resolve(PKG_ROOT, key, target));
      assert.ok(from.equals(to), `${key}/${target} differs from the source ${source}`);
    }
  }
});

test("T004: ledger-micro-115.json is valid against the shape its schema field declares", () => {
  const ledger = JSON.parse(
    readFileSync(resolve(PKG_ROOT, "data/ledger-micro-115.json"), "utf8"),
  ) as {
    schema: string;
    namespace: string;
    kinds: string[];
    writeAhead: boolean;
    counters: string[];
    resumeStates: { last: string | null; state: string; onResume: string }[];
  };
  assert.equal(ledger.schema, "specstride.ledger-micro/1");
  assert.equal(ledger.namespace, "micro");
  assert.equal(ledger.writeAhead, true);
  assert.ok(ledger.kinds.length >= 11, "the record kinds are stated");
  assert.ok(ledger.counters.includes("cyclesUsed"), "the counters are stated");
  assert.ok(ledger.resumeStates.length >= 5, "the resume states are stated (F115-FR-031)");
  for (const state of ledger.resumeStates) {
    assert.equal(typeof state.onResume, "string");
    assert.ok(state.onResume.length > 0, "every resume state names its action on resume");
  }
});

test("T004: integrity-rules-115.json is valid against the shape its schema field declares", () => {
  const rules = JSON.parse(
    readFileSync(resolve(PKG_ROOT, "data/integrity-rules-115.json"), "utf8"),
  ) as {
    schema: string;
    rules: {
      rule: string;
      subject: string;
      ownedHere: boolean;
      requirements: string[];
      test: string | null;
    }[];
  };
  assert.equal(rules.schema, "specstride.integrity-rules-115/1");
  assert.ok(rules.rules.length >= 60, "IR-01 to IR-60 are stated");
  const numbers = rules.rules.map((r) => Number(r.rule.replace("IR-", "")));
  assert.deepEqual(
    numbers,
    numbers.map((_, i) => i + 1),
    "the rules are IR-01 to IR-60 in order, none reused and none missing",
  );
  for (const rule of rules.rules) {
    assert.equal(typeof rule.subject, "string");
    assert.equal(typeof rule.ownedHere, "boolean");
    assert.ok(Array.isArray(rule.requirements));
    // An owned rule carries its test; a rule of another owner carries none here.
    assert.equal(
      rule.ownedHere || rule.test === null,
      true,
      `${rule.rule}: only a rule owned here carries a test`,
    );
  }
});

test("T004: the checkpoint schema compiles and proves a sample checkpoint record", () => {
  const schema = JSON.parse(
    readFileSync(resolve(PKG_ROOT, "schemas/checkpoint-115.schema.json"), "utf8"),
  ) as { $id?: string; type?: string; required?: string[] };
  assert.equal(schema.$id, "urn:specstride:schema:specstride.checkpoint/1");
  assert.equal(schema.type, "object");
  assert.deepEqual(schema.required, ["schema", "tasks"]);

  // The strict keywords of the schema file (`x-unknown-field`, ...) are data
  // of the annex, not schema keywords; the package's own Ajv instance runs
  // with strict off, and the direct compile here does the same.
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  const validate = ajv.compile(schema);
  assert.equal(
    validate({ schema: "specstride.checkpoint/1", tasks: ["T010"] }),
    true,
    "a checkpoint with its schema id and at least one task validates",
  );
  assert.equal(validate({ schema: "specstride.checkpoint/1", tasks: [] }), false);
  assert.equal(validate({ tasks: ["T010"] }), false, "the schema id is required");
  assert.equal(
    validate({ schema: "specstride.checkpoint/1", tasks: ["T010"], note: "x", extra: 1 }),
    true,
    "any other field is ignored (additionalProperties stays true)",
  );
});

test("T004: the lazy validator of the package resolves specstride.checkpoint/1", () => {
  const compiled = validatorFor("specstride.checkpoint/1");
  assert.equal(
    compiled.validate({ schema: "specstride.checkpoint/1", tasks: ["T004"] }),
    true,
    "a sample checkpoint validates through the package validator",
  );
  const bad = validate("specstride.checkpoint/1", {
    schema: "specstride.checkpoint/2",
    tasks: ["T004"],
  });
  assert.equal(bad.ok, false, "a different major is refused (F100-FR-049)");
});
