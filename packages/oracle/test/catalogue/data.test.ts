/**
 * CT-141-100 — every data file and every schema of `packages/oracle/data/`,
 * loaded and validated at start, with typed readers (T005, F141-FR-012,
 * F141-FR-013).
 *
 * What the test proves:
 *
 * - the load reads all thirteen files and says what it checked. Every file the
 *   load names is read back from disk here, independently of the loader, and a
 *   sha-256 over its bytes is recorded as its durable identity;
 * - the load happens at start: importing the module is what runs it, and a
 *   data file that does not hold up stops the oracle with the file named. Each
 *   refusal is witnessed against a copy of `data/` with one thing changed, so
 *   the check is shown to be a check and not a claim;
 * - the typed readers give the data of §O.2 to §O.4: the forty families with
 *   thirty-nine active, the verbs per kind of stub, S-01 to S-16, the one entry
 *   per register row, the entries of the second suite, the per-OS expectations
 *   and the two rows of the supplement;
 * - F141-FR-013: FX-37 is retired, keeps its id, has no scenario, and a test
 *   that cites it is refused;
 * - F141-FR-012: a fixture declaration that lacks a field is refused before it
 *   runs, and so is one with an unknown verb or a surface outside its family.
 *
 * Nothing here calls a model, opens a socket or needs a credential (F141-FR-038).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ACTIVE_FAMILY_COUNT,
  DATA_FILE_SCHEMA_IDS,
  FAMILY_COUNT,
  INVENTORY_SUPPLEMENT_FILE,
  ORACLE_DATA_DIR,
  OracleDataError,
  RETIRED_FAMILIES,
  SCHEMA_FILE_IDS,
  activeFamilies,
  assertFamilyMayBeCited,
  family,
  fixtureCatalogue,
  inventorySupplement,
  knownSurfaceNames,
  layerAllowlist,
  loadOracleData,
  oracleData,
  patternExpression,
  perOsExpectations,
  registerMap,
  schemaOf,
  stubVocabulary,
  surfaces,
  validateFixtureDeclaration,
} from "../../src/catalogue/data.ts";
import { SchemaUnsupportedError, assertSupported, check } from "../../src/catalogue/schema.ts";

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const made: string[] = [];
function temp(): string {
  const dir = mkdtempSync(join(tmpdir(), "oracle-data-"));
  made.push(dir);
  return dir;
}
process.on("exit", () => {
  for (const dir of made) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // nothing to do
    }
  }
});

/** A copy of `data/` with one file replaced, so a refusal can be witnessed. */
function dataWith(file: string, change: (value: Record<string, unknown>) => unknown): string {
  const dir = join(temp(), "data");
  cpSync(ORACLE_DATA_DIR, dir, { recursive: true });
  const path = join(dir, file);
  const value = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  writeFileSync(path, JSON.stringify(change(value), null, 1), "utf8");
  return dir;
}

// ---------------------------------------------------------------------------
// The load, at start
// ---------------------------------------------------------------------------

test("CT-141-100: the load reads every data file and every schema of data/", () => {
  assert.equal(resolve(ORACLE_DATA_DIR), join(PACKAGE, "data"));

  const files = [...Object.keys(DATA_FILE_SCHEMA_IDS), INVENTORY_SUPPLEMENT_FILE];
  const schemas = Object.keys(SCHEMA_FILE_IDS).map((name) => join("schemas", name));
  assert.equal(files.length, 7);
  assert.equal(schemas.length, 6);

  // Each one is on disk, read back here, with its durable identity recorded.
  const identities: Record<string, string> = {};
  for (const relative of [...files, ...schemas]) {
    const path = join(ORACLE_DATA_DIR, relative);
    assert.ok(existsSync(path), `data/${relative} exists`);
    identities[relative] = createHash("sha256").update(readFileSync(path)).digest("hex");
    assert.match(identities[relative] as string, /^[0-9a-f]{64}$/);
  }
  assert.equal(Object.keys(identities).length, 13);
  assert.equal(new Set(Object.values(identities)).size, 13, "thirteen distinct files");

  // The schema id each file carries is the one the loader requires.
  for (const [name, id] of Object.entries(DATA_FILE_SCHEMA_IDS)) {
    const value = JSON.parse(readFileSync(join(ORACLE_DATA_DIR, name), "utf8")) as {
      schema: string;
    };
    assert.equal(value.schema, id, `data/${name} carries ${id}`);
  }
  for (const [name, id] of Object.entries(SCHEMA_FILE_IDS)) {
    const value = JSON.parse(readFileSync(join(ORACLE_DATA_DIR, "schemas", name), "utf8")) as {
      $id: string;
    };
    assert.equal(value.$id, id, `data/schemas/${name} carries ${id}`);
    // The schemas of the oracle are no contracts of the product.
    assert.match(id, /^urn:specstride:schema:internal:141:/);
  }

  // The load says what it checked, one line per check.
  assert.ok(oracleData.checked.length >= 13);
  const report = oracleData.checked.join("\n");
  for (const relative of [...files, ...schemas]) {
    assert.ok(
      report.includes(relative.replace("schemas/", "schemas/")),
      `the report names ${relative}`,
    );
  }
});

test("CT-141-100: the load runs at import, and a second load gives the same", () => {
  // `oracleData` is the result of the load at import: it is already there.
  assert.equal(oracleData.dir, ORACLE_DATA_DIR);
  const again = loadOracleData();
  assert.deepEqual(again.checked, oracleData.checked);
  assert.equal(again.fixtureCatalogue.families.length, FAMILY_COUNT);
});

test("CT-141-100: a data file that does not hold up stops the oracle, with the file named", () => {
  const cases: [string, string, (v: Record<string, unknown>) => unknown][] = [
    [
      "fixture-catalogue.json",
      "an active family taken out",
      (v) => ({ ...v, families: (v["families"] as unknown[]).slice(1) }),
    ],
    [
      "fixture-catalogue.json",
      // The retired family is the one whose removal leaves the count of the
      // ACTIVE families right, so only the check of the total count can catch
      // it. F141-FR-013: an id is never reused and never dropped.
      "the retired family FX-37 taken out, which leaves 39 families and 39 active",
      (v) => ({
        ...v,
        families: (v["families"] as Record<string, unknown>[]).filter((f) => f["id"] !== "FX-37"),
      }),
    ],
    [
      "fixture-catalogue.json",
      "FX-37 given a scenario",
      (v) => ({
        ...v,
        families: (v["families"] as Record<string, unknown>[]).map((f) =>
          f["id"] === "FX-37"
            ? { ...f, scenarios: [{ name: "x", pattern: false, waiver: null, scenarioOf: "141" }] }
            : f,
        ),
      }),
    ],
    [
      "fixture-catalogue.json",
      "a member that does not match its pattern",
      (v) => ({
        ...v,
        families: (v["families"] as Record<string, unknown>[]).map((f) => {
          if (f["id"] !== "FX-22") return f;
          return {
            ...f,
            scenarios: (f["scenarios"] as Record<string, unknown>[]).map((s) =>
              s["pattern"] === true ? { ...s, members: ["something-else"] } : s,
            ),
          };
        }),
      }),
    ],
    [
      "surfaces.json",
      "a surface taken out",
      (v) => ({ ...v, surfaces: (v["surfaces"] as unknown[]).slice(1) }),
    ],
    [
      "register-map.json",
      "a normalization rule feature 100 does not hold",
      (v) => ({
        ...v,
        rows: (v["rows"] as Record<string, unknown>[]).map((r, i) =>
          i === 0 ? { ...r, rules: ["N-99"] } : r,
        ),
      }),
    ],
    [
      "register-map.json",
      "a row twice",
      (v) => ({ ...v, rows: [...(v["rows"] as unknown[]), (v["rows"] as unknown[])[0]] }),
    ],
    [
      "layer-allowlist.json",
      "an entry that is no row of the register map",
      (v) => ({
        ...v,
        entries: (v["entries"] as Record<string, unknown>[]).map((e, i) =>
          i === 0 ? { ...e, row: "DV-999" } : e,
        ),
      }),
    ],
    [
      "per-os-expectations.json",
      "a status that is not inferred",
      (v) => ({ ...v, status: "verified" }),
    ],
    [
      "stub-vocabulary.json",
      "four rules instead of the five of §O.3",
      (v) => ({ ...v, rules: (v["rules"] as unknown[]).slice(1) }),
    ],
  ];

  for (const [file, why, change] of cases) {
    const dir = dataWith(file, change);
    assert.throws(
      () => loadOracleData(dir),
      (error: unknown) =>
        error instanceof OracleDataError && (error as OracleDataError).file === file,
      `${file} with ${why} stops the oracle, and the error names the file`,
    );
    // The untouched copy still loads, so the refusal is about the change.
    const clean = join(temp(), "data");
    cpSync(ORACLE_DATA_DIR, clean, { recursive: true });
    assert.doesNotThrow(() => loadOracleData(clean));
  }
});

test("CT-141-100: a schema whose $id or whose keywords are not the oracle's is refused", () => {
  const dir = dataWith("schemas/transcript.schema.json", (v) => ({ ...v, $id: "urn:x:y/1" }));
  assert.throws(
    () => loadOracleData(dir),
    (error: unknown) => error instanceof OracleDataError && /\$id/.test((error as Error).message),
  );

  // A keyword the checker does not implement is an error and never a pass, so
  // nothing can slip through unchecked.
  assert.throws(
    () => assertSupported({ type: "object", oneOf: [] }),
    (e: unknown) => e instanceof SchemaUnsupportedError,
  );
  assert.throws(
    () => assertSupported({ type: "nothing" }),
    (e: unknown) => e instanceof SchemaUnsupportedError,
  );
  assert.doesNotThrow(() => assertSupported(schemaOf("fixture.schema.json")));
});

// ---------------------------------------------------------------------------
// The typed readers
// ---------------------------------------------------------------------------

test("CT-141-100: the typed readers give the data of §O.2 to §O.4", () => {
  assert.equal(fixtureCatalogue().families.length, FAMILY_COUNT);
  assert.equal(activeFamilies().length, ACTIVE_FAMILY_COUNT);
  assert.equal(FAMILY_COUNT - ACTIVE_FAMILY_COUNT, RETIRED_FAMILIES.length);

  const first = family("FX-01");
  assert.ok(first);
  assert.equal(first?.status, "active");
  assert.ok((first?.scenarios.length ?? 0) > 0);
  assert.ok(first?.features.includes("100"));
  assert.ok(first?.surfaces.includes("exit"));
  assert.equal(family("FX-99"), undefined);

  // Every family of the catalogue has the seven things F141-FR-013 asks for.
  for (const f of activeFamilies()) {
    assert.match(f.id, /^FX-[0-9]{2}$/);
    assert.ok(f.name !== "" && f.exercises !== "" && f.reference !== "");
    assert.ok(f.surfaces.length > 0 && f.features.length > 0);
    for (const surface of f.surfaces) assert.ok(knownSurfaceNames().includes(surface));
  }

  // §O.3: the five rules, the verbs per kind, the fixed overrun code.
  assert.equal(stubVocabulary().rules.length, 5);
  assert.equal(stubVocabulary().overrunExitCode, 97);
  assert.ok(stubVocabulary().kinds["proposer"]?.verbs.includes("evidence"));
  assert.ok(stubVocabulary().kinds["critic-http"]?.verbs.includes("malformed-wrong-nonce"));

  // §O.4: S-01 to S-16, the run set and the roles.
  assert.equal(surfaces().surfaces.length, 16);
  assert.equal(surfaces().surfaces[0]?.id, "S-01");
  assert.equal(surfaces().surfaces[15]?.id, "S-16");
  assert.ok(knownSurfaceNames().includes("transcript.proposer"));

  // F141-FR-023: one entry per row of the register.
  const rows = registerMap().rows.map((r) => r.row);
  assert.equal(new Set(rows).size, rows.length);
  assert.ok(rows.includes("DV-001"));
  assert.ok(rows.includes("DV-116"));
  assert.ok(
    registerMap()
      .rows.find((r) => r.row === "DV-116")
      ?.rules.includes("N-29"),
  );

  // F141-FR-040 and F141-FR-035.
  assert.ok(layerAllowlist().entries.length > 0);
  assert.ok(layerAllowlist().notReachable.length > 0);
  assert.match(perOsExpectations().status, /^inferred/);

  // F141-FR-017: the two proposed rows.
  assert.equal(inventorySupplement().length, 2);
  assert.deepEqual(
    inventorySupplement().map((r) => r["b_item"]),
    ["B-2784", "B-2785"],
  );

  // The pattern names of the catalogue stand for their members.
  assert.ok(patternExpression("predicate-<kind>").test("predicate-pid"));
  assert.ok(!patternExpression("predicate-<kind>").test("something-pid"));
});

// ---------------------------------------------------------------------------
// F141-FR-013 — FX-37 is retired and a test that cites it is refused
// ---------------------------------------------------------------------------

test("CT-141-100: FX-37 keeps its id, has no scenario, and a test that cites it is refused", () => {
  assert.deepEqual([...RETIRED_FAMILIES], ["FX-37"]);
  const retired = family("FX-37");
  assert.ok(retired, "FX-37 keeps its id");
  assert.equal(retired?.status, "retired");
  assert.equal(retired?.scenarios.length, 0, "a retired family has no scenario");

  assert.throws(
    () => assertFamilyMayBeCited("FX-37"),
    (error: unknown) =>
      error instanceof OracleDataError && /retired/.test((error as Error).message),
    "a test that cites FX-37 is refused",
  );
  assert.throws(
    () => assertFamilyMayBeCited("FX-99"),
    (error: unknown) => error instanceof OracleDataError,
    "a test that cites a family outside the catalogue is refused",
  );
  assert.equal(assertFamilyMayBeCited("FX-01").id, "FX-01");
});

// ---------------------------------------------------------------------------
// F141-FR-012 — a declaration that lacks a field is refused before it runs
// ---------------------------------------------------------------------------

test("CT-141-100: a fixture declaration that lacks a field is refused before it runs", () => {
  const good = {
    schema: "urn:specstride:schema:internal:141:oracle-fixture/1",
    id: "FX-01/three-phases",
    system: "specstride",
    entryPoint: { reference: "front-door run", port: "run" },
    command: { reference: ["run"], port: ["run"] },
    environment: { SPECSTRIDE_MAX_ITER: "3" },
    stubs: { proposer: [{ verbs: ["evidence"] }], "critic-http": [{ verbs: ["approve"] }] },
    workdirTemplate: "three-phases",
    expectedExit: 0,
    surfaces: ["exit", "stdout", "state"],
    proves: ["C-001"],
    os: ["linux"],
  };
  assert.deepEqual(validateFixtureDeclaration(good), {
    id: "FX-01/three-phases",
    family: "FX-01",
    scenario: "three-phases",
  });

  // Every required field, taken out one at a time.
  const required = [
    "schema",
    "id",
    "system",
    "entryPoint",
    "command",
    "environment",
    "stubs",
    "workdirTemplate",
    "expectedExit",
    "surfaces",
    "proves",
    "os",
  ];
  for (const field of required) {
    const without: Record<string, unknown> = { ...good };
    delete without[field];
    assert.throws(
      () => validateFixtureDeclaration(without),
      (error: unknown) =>
        error instanceof OracleDataError && (error as Error).message.includes(field),
      `a declaration without ${field} is refused`,
    );
  }

  // An unknown verb, a verb of another kind of stub, and a surface outside
  // the family (F141-FR-030).
  assert.throws(
    () => validateFixtureDeclaration({ ...good, stubs: { proposer: [{ verbs: ["teleport"] }] } }),
    (error: unknown) =>
      error instanceof OracleDataError && /teleport/.test((error as Error).message),
  );
  assert.throws(
    () => validateFixtureDeclaration({ ...good, stubs: { proposer: [{ verbs: ["approve"] }] } }),
    (error: unknown) => error instanceof OracleDataError,
  );
  assert.throws(
    () => validateFixtureDeclaration({ ...good, surfaces: ["telemetry"] }),
    (error: unknown) =>
      error instanceof OracleDataError && /outside the surfaces/.test((error as Error).message),
  );
  // A retired family, and an id that is no scenario id.
  assert.throws(
    () => validateFixtureDeclaration({ ...good, id: "FX-37/anything" }),
    (error: unknown) =>
      error instanceof OracleDataError && /retired/.test((error as Error).message),
  );
  assert.throws(
    () => validateFixtureDeclaration({ ...good, id: "nonsense" }),
    (error: unknown) => error instanceof OracleDataError,
  );

  // The schema checker is what the refusal of a missing field rests on.
  assert.deepEqual(check(schemaOf("fixture.schema.json"), good), []);
});
