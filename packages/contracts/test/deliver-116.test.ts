/**
 * T002 — the delivery of feature 116's data and schema files into the
 * `contracts` package through `specs/116-check-integrity-and-unit-evidence/contracts/deliver.json`,
 * which the sync script of feature 100 reads after its two clean copies
 * (proposal P-1 of `analyze-report.md`). No file is copied by hand: the sync
 * is the one writer of the package directories, and the tests here observe the
 * delivered state — byte identity with the source of the manifest, each
 * delivered schema compiled and proved against a sample record through the
 * package's own lazy validator (`validatorFor`, so the delivery also reached
 * the generated schema map), and the two data files validated against the
 * shape their `schema` field declares.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validatorFor } from "../src/records/compile.ts";
import { Ajv2020 } from "ajv/dist/2020.js";

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = resolve(PKG_ROOT, "../..");
const FEATURE = "specs/116-check-integrity-and-unit-evidence/contracts";

const deliver = JSON.parse(readFileSync(resolve(ROOT, `${FEATURE}/deliver.json`), "utf8")) as {
  schema: string;
  owner: string;
  data: Record<string, string>;
  schemas: Record<string, string>;
};

test("T002: the manifest delivers exactly the five files of feature 116", () => {
  assert.equal(deliver.schema, "specstride.deliver-116/1");
  assert.equal(deliver.owner, "116");
  // The closed sets (T003) and the profile row (T004) ride the same manifest.
  assert.ok(["integrity-rules-116.json", "tamperings-116.json"].every((t) => t in deliver.data));
  assert.ok(
    ["closed-sets-116.json", "parity-rows-116.json"].every((t) => t in deliver.data),
    "the manifest also delivers the closed sets and the profile row (T003, T004)",
  );
  // The two data-file schemas of T002 (specstride.integrity-rules-116/1 and
  // specstride.tamperings-116/1) ride the same map; the three the criterion
  // names must all be present.
  for (const target of [
    "check-result.schema.json",
    "protected-set.schema.json",
    "toolchain.schema.json",
  ]) {
    assert.ok(target in deliver.schemas, `the manifest delivers ${target}`);
  }
});

test("T002: every delivered file is byte-identical to the source the manifest names", () => {
  for (const key of ["data", "schemas"] as const) {
    for (const [target, source] of Object.entries(deliver[key])) {
      const from = readFileSync(resolve(ROOT, FEATURE, source));
      const to = readFileSync(resolve(PKG_ROOT, key, target));
      assert.ok(
        from.equals(to),
        `${key}/${target} differs from the source ${source}; the sync would remove or fail it`,
      );
    }
  }
});

test("T002: no delivered target overwrites a file of feature 100 or 115", () => {
  const ownTargets = new Set([...Object.keys(deliver.data), ...Object.keys(deliver.schemas)]);
  const otherFeatures = ["specs/100-specstride/contracts", "specs/115-micro-loop-layer/contracts"];
  for (const feature of otherFeatures) {
    for (const key of ["data", "schemas"]) {
      for (const target of ownTargets) {
        let listed: string[] = [];
        try {
          listed = readdirSync(resolve(ROOT, feature, key));
        } catch {
          continue; // the feature ships no such directory
        }
        assert.ok(
          !listed.includes(target),
          `target ${key}/${target} already exists in ${feature}; the sync must fail, not overwrite`,
        );
      }
    }
  }
});

test("T002: each delivered schema compiles and validates a sample record through validatorFor", () => {
  const cases: Array<{ id: string; sample: object }> = [
    {
      id: "specstride.protected-set/1",
      sample: {
        schema: "specstride.protected-set/1",
        phase: 1,
        profiles: [],
        basic: false,
        classA: { patterns: [], ignoredListings: [] },
        classB: { files: [] },
        authorised: {},
        atLaunch: { set: "s", tree: "t" },
        atPhaseEntry: { set: "s", tree: "t" },
        exclusions: [],
        effectiveConfig: null,
      },
    },
    {
      id: "specstride.check-result/1",
      sample: {
        schema: "specstride.check-result/1",
        unitId: "u1",
        ordinal: 1,
        treeBefore: "t",
        treeAfter: "t",
        protectedBefore: "p",
        protectedAfter: "p",
        commands: [],
      },
    },
    {
      id: "specstride.toolchain/1",
      sample: {
        schema: "specstride.toolchain/1",
        id: "fictional",
        version: "1",
        detect: {},
        classA: [],
      },
    },
  ];
  for (const { id, sample } of cases) {
    const compiled = validatorFor(id); // throws when the id is unknown (F100-FR-049)
    assert.equal(compiled.schemaId, id);
    const ok = compiled.validate(sample);
    assert.ok(ok, `${id}: sample record does not validate`);
  }
});

/**
 * T002 — "validate each against its schema in the build": the two delivered
 * data files are validated against the JSON Schemas their `schema` field
 * declares (`specstride.integrity-rules-116/1`,
 * `specstride.tamperings-116/1`). The schemas travel with the delivery —
 * `contracts/deliver.json` maps them into `packages/contracts/schemas/` — and
 * the validator is the package's own (Ajv 2020-12), so the check runs in the
 * build like the schema compilations above.
 */
test("T002: each delivered data file validates against its declared JSON Schema", () => {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  const cases = [
    {
      schemaId: "specstride.integrity-rules-116/1",
      schemaFile: "schemas/integrity-rules-116.schema.json",
      dataFile: "data/integrity-rules-116.json",
    },
    {
      schemaId: "specstride.tamperings-116/1",
      schemaFile: "schemas/tamperings-116.schema.json",
      dataFile: "data/tamperings-116.json",
    },
  ];
  for (const { schemaId, schemaFile, dataFile } of cases) {
    const schema = JSON.parse(readFileSync(resolve(PKG_ROOT, schemaFile), "utf8")) as {
      $id: string;
    };
    assert.ok(schema.$id.includes(schemaId), `${schemaFile} declares ${schemaId}`);
    const validate = ajv.compile(schema);
    const data = JSON.parse(readFileSync(resolve(PKG_ROOT, dataFile), "utf8"));
    const ok = validate(data);
    assert.ok(
      ok,
      `${dataFile} does not validate against ${schemaFile}: ${ajv.errorsText(validate.errors)}`,
    );
  }
});

test("T002: the delivered data files match the shape their schema field declares", () => {
  const rules = JSON.parse(
    readFileSync(resolve(PKG_ROOT, "data/integrity-rules-116.json"), "utf8"),
  ) as { schema: string; rules: Array<{ rule: string; requirements: string[]; test: string }> };
  assert.equal(rules.schema, "specstride.integrity-rules-116/1");
  assert.ok(rules.rules.length >= 18, "the feature owns 18 integrity rules");
  for (const rule of rules.rules) {
    assert.match(rule.rule, /^IR-\d+$/);
    assert.ok(
      rule.requirements.every((r) => /^F116-FR-\d+$/.test(r)),
      rule.rule,
    );
    assert.match(rule.test, /^CT-116-\d+$/, rule.rule);
  }

  const tamperings = JSON.parse(
    readFileSync(resolve(PKG_ROOT, "data/tamperings-116.json"), "utf8"),
  ) as {
    schema: string;
    never: string;
    tamperings: Array<{ id: string; act: string; expected: string }>;
  };
  assert.equal(tamperings.schema, "specstride.tamperings-116/1");
  assert.equal(tamperings.never, "pass");
  assert.ok(tamperings.tamperings.length >= 7, "the feature seeds 7 tamperings");
  for (const t of tamperings.tamperings) {
    assert.match(t.id, /^[a-z0-9-]+$/);
    assert.ok(t.act.length > 0 && t.expected.length > 0, t.id);
  }
});
