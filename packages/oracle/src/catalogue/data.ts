/**
 * T005 — every data file and every schema of `packages/oracle/data/`, loaded
 * and validated at start, with typed readers (F141-FR-012, F141-FR-013).
 *
 * `loadOracleData` is the one way into the data of the oracle. It reads the
 * seven data files and the six schemas, checks each schema against the part of
 * JSON Schema the oracle implements (`schema.ts`), checks every data file
 * against the schema id it carries, and then checks what no single file can
 * say: that the catalogue is the 40 families of `spec.md` §O.2 with FX-37
 * retired, that an active family has at least one scenario and a retired one
 * none, that a scenario name is used once in a family with its members, that a
 * member matches its pattern and that a pattern of this feature has members,
 * that the surfaces of a family are surfaces of §O.4, that the register map has
 * one entry per row and names only normalization rules of feature 100, and that
 * every entry of the second suite names a row of the register map.
 *
 * The module runs the load at import: a data file that does not hold up stops
 * the oracle before a fixture runs, which is what "at start" in T005 means and
 * what F141-FR-012 asks for ("A fixture whose declaration lacks a field MUST be
 * refused before it runs").
 *
 * Every table the normalizer uses is data of feature 100 and is read from
 * `@specstride/contracts`, never copied (plan.md, "Approach").
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { rules as normalizationRules } from "@specstride/contracts/profile/normalization";

import { assertSupported, check, violationsAsText, type JsonSchema } from "./schema.ts";

/** `packages/oracle/data/`, the copy of `specs/141-parity-oracle/contracts/` (T003). */
export const ORACLE_DATA_DIR = resolve(
  dirname(dirname(dirname(fileURLToPath(import.meta.url)))),
  "data",
);

/** A data file or a schema of the oracle that does not hold up. */
export class OracleDataError extends Error {
  /** The file the error is about, relative to `data/`. */
  readonly file: string;
  constructor(file: string, message: string) {
    super(`packages/oracle/data/${file}: ${message}`);
    this.name = "OracleDataError";
    this.file = file;
  }
}

/** The data files, each with the schema id its `schema` field must carry. */
export const DATA_FILE_SCHEMA_IDS = {
  "fixture-catalogue.json": "urn:specstride:schema:internal:141:oracle-fixture-catalogue/1",
  "stub-vocabulary.json": "urn:specstride:schema:internal:141:oracle-stub-vocabulary/1",
  "surfaces.json": "urn:specstride:schema:internal:141:oracle-surfaces/1",
  "register-map.json": "urn:specstride:schema:internal:141:oracle-register-map/1",
  "layer-allowlist.json": "urn:specstride:schema:internal:141:oracle-layer-allowlist/1",
  "per-os-expectations.json": "urn:specstride:schema:internal:141:oracle-per-os/1",
} as const;

/** The one data file that is a table and carries no `schema` field. */
export const INVENTORY_SUPPLEMENT_FILE = "inventory-supplement.tsv" as const;

/** The schemas, each with the `$id` it must carry. */
export const SCHEMA_FILE_IDS = {
  "fixture.schema.json": "urn:specstride:schema:internal:141:oracle-fixture/1",
  "waivers.schema.json": "urn:specstride:schema:internal:141:oracle-waivers/1",
  "test-declaration.schema.json": "urn:specstride:schema:internal:141:oracle-test-declaration/1",
  "transcript.schema.json": "urn:specstride:schema:internal:141:oracle-transcript/1",
  "result.schema.json": "urn:specstride:schema:internal:141:oracle-result/1",
  "exercise-map.schema.json": "urn:specstride:schema:internal:141:oracle-exercise-map/1",
} as const;

export type DataFileName = keyof typeof DATA_FILE_SCHEMA_IDS;
export type SchemaFileName = keyof typeof SCHEMA_FILE_IDS;

/** The counts of `spec.md` §O.2: forty ids, thirty-nine active, FX-37 retired. */
export const FAMILY_COUNT = 40 as const;
export const ACTIVE_FAMILY_COUNT = 39 as const;
export const RETIRED_FAMILIES = ["FX-37"] as const;

// ---------------------------------------------------------------------------
// The shapes of the data
// ---------------------------------------------------------------------------

/** One entry of a family's scenario list (`data-model.md`, "Catalogue entry"). */
export type CatalogueScenario = {
  readonly name: string;
  readonly pattern: boolean;
  readonly waiver: string | null;
  /** The feature that writes and keeps the scenario. */
  readonly scenarioOf: string;
  readonly testOf?: string;
  readonly stubsAndVerbs?: string;
  readonly surfacesCompared?: string;
  readonly note?: string;
  /** For a pattern: the names it stands for. */
  readonly members?: readonly string[];
  readonly source?: string;
  /** For a scenario of a critic or a harness family: how it ends on the reference. */
  readonly endOnReference?: {
    readonly entryPoint: string;
    readonly end: string;
    readonly stopReason: string;
    readonly evidence: string;
    readonly knownBy: "run" | "read";
  };
};

/** One family of `spec.md` §O.2. */
export type FixtureFamily = {
  readonly id: string;
  readonly name: string;
  readonly status: "active" | "retired";
  readonly exercises: string;
  readonly reference: string;
  readonly system: string;
  readonly stubs: readonly string[];
  readonly surfaces: readonly string[];
  readonly features: readonly string[];
  readonly variants: readonly string[];
  readonly answersReservation?: string;
  readonly scenarios: readonly CatalogueScenario[];
};

export type FixtureCatalogue = {
  readonly schema: string;
  readonly families: readonly FixtureFamily[];
  readonly reservedNames: readonly Record<string, unknown>[];
  readonly notScenarios: readonly Record<string, unknown>[];
};

/** One harness stub of §O.3: its name, its executables, its roles and its sides. */
export type HarnessStub = {
  readonly harness: string;
  readonly executables: readonly string[];
  readonly roles: Readonly<Record<string, string>>;
  readonly prompt: string;
  readonly streamFormat: string;
  readonly sides: string;
  readonly records?: readonly string[];
};

export type StubVocabulary = {
  readonly schema: string;
  readonly rules: readonly string[];
  readonly overrunExitCode: number;
  readonly kinds: Readonly<Record<string, { readonly verbs: readonly string[] }>>;
  readonly harnessStubs: readonly HarnessStub[];
  readonly engineExecutable: string;
};

export type Surfaces = {
  readonly schema: string;
  readonly runSet: readonly string[];
  readonly transcriptRoles: readonly string[];
  readonly surfaces: readonly {
    readonly id: string;
    readonly name: string;
    readonly suites: string;
  }[];
};

export type RegisterMapRow = {
  readonly row: string;
  readonly handling: readonly string[];
  readonly rules: readonly string[];
  readonly families: readonly string[];
  readonly note: string;
  readonly registerText: string;
};

export type RegisterMap = { readonly schema: string; readonly rows: readonly RegisterMapRow[] };

export type LayerAllowlist = {
  readonly schema: string;
  readonly entries: readonly {
    readonly row: string;
    readonly surface: string;
    readonly match: string;
    readonly values: readonly string[];
  }[];
  readonly notReachable: readonly {
    readonly row: string;
    readonly field: string;
    readonly reason: string;
  }[];
};

export type PerOsExpectations = {
  readonly schema: string;
  readonly status: string;
  readonly expectations: readonly {
    readonly subject: string;
    readonly linux: string;
    readonly macos: string;
  }[];
};

/** One row of `inventory-supplement.tsv` (F141-FR-017). */
export type InventorySupplementRow = Readonly<Record<string, string>>;

/** Everything `data/` holds, loaded and checked. */
export type OracleData = {
  readonly dir: string;
  readonly fixtureCatalogue: FixtureCatalogue;
  readonly stubVocabulary: StubVocabulary;
  readonly surfaces: Surfaces;
  readonly registerMap: RegisterMap;
  readonly layerAllowlist: LayerAllowlist;
  readonly perOsExpectations: PerOsExpectations;
  readonly inventorySupplement: readonly InventorySupplementRow[];
  readonly schemas: Readonly<Record<SchemaFileName, JsonSchema>>;
  /** What the load checked, for a report: one line per check. */
  readonly checked: readonly string[];
};

// ---------------------------------------------------------------------------
// The load
// ---------------------------------------------------------------------------

function readJsonFile(dir: string, name: string): Record<string, unknown> {
  let text: string;
  try {
    text = readFileSync(join(dir, name), "utf8");
  } catch (cause) {
    throw new OracleDataError(name, `cannot be read (${String((cause as Error).message)})`);
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch (cause) {
    throw new OracleDataError(name, `is not JSON (${String((cause as Error).message)})`);
  }
}

/** The surface names of §O.4, with the per-role forms of the transcript. */
function surfaceNames(surfaces: Surfaces): Set<string> {
  const names = new Set(surfaces.surfaces.map((s) => s.name));
  for (const role of surfaces.transcriptRoles) names.add(`transcript.${role}`);
  return names;
}

/** The regular expression a pattern name stands for: `predicate-<kind>`. */
export function patternExpression(name: string): RegExp {
  const parts = name.split(/<[^>]+>/g).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`^${parts.join("[a-z0-9][a-z0-9-]*")}$`);
}

/**
 * Read the seven data files and the six schemas of `dir`, check every one of
 * them, and give back the typed form. Throws `OracleDataError` on the first
 * thing that does not hold up, with the file and what is wrong.
 */
export function loadOracleData(dir: string = ORACLE_DATA_DIR): OracleData {
  const checked: string[] = [];

  // --- the schemas ------------------------------------------------------
  const schemas: Record<string, JsonSchema> = {};
  for (const [name, id] of Object.entries(SCHEMA_FILE_IDS)) {
    const schema = readJsonFile(join(dir, "schemas"), name);
    if (schema["$id"] !== id) {
      throw new OracleDataError(
        `schemas/${name}`,
        `carries $id ${JSON.stringify(schema["$id"])}, expected ${id}`,
      );
    }
    try {
      assertSupported(schema, name);
    } catch (cause) {
      throw new OracleDataError(`schemas/${name}`, (cause as Error).message);
    }
    schemas[name] = schema;
    checked.push(`schemas/${name}: $id ${id}, every keyword implemented`);
  }

  // --- the data files ---------------------------------------------------
  const files: Record<string, Record<string, unknown>> = {};
  for (const [name, id] of Object.entries(DATA_FILE_SCHEMA_IDS)) {
    const data = readJsonFile(dir, name);
    if (data["schema"] !== id) {
      throw new OracleDataError(
        name,
        `carries schema ${JSON.stringify(data["schema"])}, expected ${id}`,
      );
    }
    files[name] = data;
    checked.push(`${name}: schema ${id}`);
  }

  const fixtureCatalogue = files["fixture-catalogue.json"] as unknown as FixtureCatalogue;
  const stubVocabulary = files["stub-vocabulary.json"] as unknown as StubVocabulary;
  const surfaces = files["surfaces.json"] as unknown as Surfaces;
  const registerMap = files["register-map.json"] as unknown as RegisterMap;
  const layerAllowlist = files["layer-allowlist.json"] as unknown as LayerAllowlist;
  const perOsExpectations = files["per-os-expectations.json"] as unknown as PerOsExpectations;

  // --- surfaces, §O.4 ---------------------------------------------------
  if (surfaces.surfaces.length !== 16) {
    throw new OracleDataError(
      "surfaces.json",
      `${surfaces.surfaces.length} surfaces, expected S-01 to S-16`,
    );
  }
  surfaces.surfaces.forEach((surface, i) => {
    const expected = `S-${String(i + 1).padStart(2, "0")}`;
    if (surface.id !== expected) {
      throw new OracleDataError(
        "surfaces.json",
        `surface ${String(i)} is ${surface.id}, expected ${expected}`,
      );
    }
  });
  const names = surfaceNames(surfaces);
  for (const name of surfaces.runSet) {
    if (!names.has(name)) {
      throw new OracleDataError(
        "surfaces.json",
        `the run set names ${name}, which is no surface of §O.4`,
      );
    }
  }
  const transcriptSchemaRoles = (
    (schemas["transcript.schema.json"]?.["properties"] as JsonSchema)?.["role"] as JsonSchema
  )?.["enum"];
  if (JSON.stringify(transcriptSchemaRoles) !== JSON.stringify(surfaces.transcriptRoles)) {
    throw new OracleDataError(
      "surfaces.json",
      `the roles of a transcript are ${JSON.stringify(surfaces.transcriptRoles)}, and ` +
        `schemas/transcript.schema.json says ${JSON.stringify(transcriptSchemaRoles)}`,
    );
  }
  checked.push(`surfaces.json: S-01 to S-16, the run set and the roles of a transcript`);

  // --- the stub vocabulary, §O.3 ---------------------------------------
  if (stubVocabulary.rules.length !== 5) {
    throw new OracleDataError(
      "stub-vocabulary.json",
      `${stubVocabulary.rules.length} rules, expected the five of §O.3`,
    );
  }
  if (!Number.isInteger(stubVocabulary.overrunExitCode)) {
    throw new OracleDataError("stub-vocabulary.json", "the overrun exit code is missing");
  }
  const stubKinds = new Set(Object.keys(stubVocabulary.kinds));
  checked.push(
    `stub-vocabulary.json: the five rules of §O.3, ${String(stubKinds.size)} kinds of stub, overrun ${String(stubVocabulary.overrunExitCode)}`,
  );

  // --- the catalogue, §O.2 ---------------------------------------------
  if (fixtureCatalogue.families.length !== FAMILY_COUNT) {
    throw new OracleDataError(
      "fixture-catalogue.json",
      `${fixtureCatalogue.families.length} families, expected ${String(FAMILY_COUNT)}`,
    );
  }
  const seen = new Set<string>();
  let active = 0;
  for (const family of fixtureCatalogue.families) {
    if (!/^FX-[0-9]{2}$/.test(family.id)) {
      throw new OracleDataError("fixture-catalogue.json", `${family.id} is no family id`);
    }
    if (seen.has(family.id)) {
      throw new OracleDataError(
        "fixture-catalogue.json",
        `the id ${family.id} is used twice; an id is never reused`,
      );
    }
    seen.add(family.id);

    const retired = (RETIRED_FAMILIES as readonly string[]).includes(family.id);
    if (retired && family.status !== "retired") {
      throw new OracleDataError(
        "fixture-catalogue.json",
        `${family.id} must be retired (F141-FR-013)`,
      );
    }
    if (family.status === "retired") {
      if (family.scenarios.length !== 0) {
        throw new OracleDataError(
          "fixture-catalogue.json",
          `${family.id} is retired and has ${String(family.scenarios.length)} scenarios`,
        );
      }
      continue;
    }
    active += 1;
    if (family.scenarios.length === 0) {
      throw new OracleDataError(
        "fixture-catalogue.json",
        `${family.id} is active and has no scenario`,
      );
    }
    for (const field of ["name", "exercises", "reference", "system"] as const) {
      if (typeof family[field] !== "string" || family[field] === "") {
        throw new OracleDataError("fixture-catalogue.json", `${family.id} has no ${field}`);
      }
    }
    if (family.features.length === 0) {
      throw new OracleDataError(
        "fixture-catalogue.json",
        `${family.id} names no feature it covers`,
      );
    }
    for (const surface of family.surfaces) {
      if (!names.has(surface)) {
        throw new OracleDataError(
          "fixture-catalogue.json",
          `${family.id} names the surface ${surface}, which is no surface of §O.4`,
        );
      }
    }
    for (const stub of family.stubs) {
      if (!stubKinds.has(stub) && !stubVocabulary.harnessStubs.some((h) => h["harness"] === stub)) {
        throw new OracleDataError(
          "fixture-catalogue.json",
          `${family.id} names the stub ${stub}, which §O.3 does not`,
        );
      }
    }

    // One name per family, members included.
    const used = new Map<string, string>();
    for (const scenario of family.scenarios) {
      const claim = (name: string, by: string): void => {
        const first = used.get(name);
        if (first !== undefined) {
          throw new OracleDataError(
            "fixture-catalogue.json",
            `${family.id}: the name ${name} is used twice (${first} and ${by})`,
          );
        }
        used.set(name, by);
      };
      claim(scenario.name, scenario.pattern ? "a pattern" : "a scenario");
      if (scenario.pattern) {
        const members = scenario.members ?? [];
        if (scenario.scenarioOf === "141" && members.length === 0) {
          throw new OracleDataError(
            "fixture-catalogue.json",
            `${family.id}/${scenario.name} is a pattern of this feature and has no member`,
          );
        }
        const expression = patternExpression(scenario.name);
        for (const member of members) {
          if (!expression.test(member)) {
            throw new OracleDataError(
              "fixture-catalogue.json",
              `${family.id}: the member ${member} does not match the pattern ${scenario.name}`,
            );
          }
          claim(member, `a member of ${scenario.name}`);
        }
      } else if ((scenario.members ?? []).length > 0) {
        throw new OracleDataError(
          "fixture-catalogue.json",
          `${family.id}/${scenario.name} is no pattern and has members`,
        );
      }
      if (!/^[0-9]{3}$/.test(scenario.scenarioOf)) {
        throw new OracleDataError(
          "fixture-catalogue.json",
          `${family.id}/${scenario.name}: scenarioOf is ${scenario.scenarioOf}`,
        );
      }
      const end = scenario.endOnReference;
      if (end !== undefined) {
        for (const field of ["entryPoint", "end", "stopReason", "evidence"] as const) {
          if (typeof end[field] !== "string" || end[field] === "") {
            throw new OracleDataError(
              "fixture-catalogue.json",
              `${family.id}/${scenario.name}: endOnReference has no ${field}`,
            );
          }
        }
        if (end.knownBy !== "run" && end.knownBy !== "read") {
          throw new OracleDataError(
            "fixture-catalogue.json",
            `${family.id}/${scenario.name}: knownBy is ${String(end.knownBy)}`,
          );
        }
      }
    }
  }
  if (active !== ACTIVE_FAMILY_COUNT) {
    throw new OracleDataError(
      "fixture-catalogue.json",
      `${String(active)} active families, expected ${String(ACTIVE_FAMILY_COUNT)}`,
    );
  }
  checked.push(
    `fixture-catalogue.json: ${String(FAMILY_COUNT)} families, ${String(ACTIVE_FAMILY_COUNT)} active, ` +
      `FX-37 retired with no scenario, names unique per family, members match their pattern`,
  );

  // --- the register map, F141-FR-023 ------------------------------------
  const knownRules = new Set(normalizationRules.map((rule) => rule.id));
  const rows = new Set<string>();
  for (const row of registerMap.rows) {
    if (!/^DV-[0-9]{3}$/.test(row.row)) {
      throw new OracleDataError("register-map.json", `${row.row} is no row of the register`);
    }
    if (rows.has(row.row)) {
      throw new OracleDataError(
        "register-map.json",
        `the row ${row.row} has two entries; F141-FR-023 asks for one`,
      );
    }
    rows.add(row.row);
    if (row.handling.length === 0) {
      throw new OracleDataError("register-map.json", `${row.row} states no handling`);
    }
    for (const rule of row.rules) {
      if (!knownRules.has(rule)) {
        throw new OracleDataError(
          "register-map.json",
          `${row.row} names the normalization rule ${rule}, which the contract of feature 100 does not hold`,
        );
      }
    }
    for (const family of row.families) {
      if (!seen.has(family)) {
        throw new OracleDataError(
          "register-map.json",
          `${row.row} names the family ${family}, which the catalogue does not hold`,
        );
      }
    }
  }
  checked.push(
    `register-map.json: ${String(rows.size)} rows, each once, every rule a rule of feature 100`,
  );

  // --- the second suite, F141-FR-040 ------------------------------------
  for (const entry of [...layerAllowlist.entries, ...layerAllowlist.notReachable]) {
    if (!rows.has(entry.row)) {
      throw new OracleDataError(
        "layer-allowlist.json",
        `${entry.row} is no row of the register map`,
      );
    }
  }
  for (const entry of layerAllowlist.entries) {
    if (!names.has(entry.surface)) {
      throw new OracleDataError(
        "layer-allowlist.json",
        `${entry.row} names the surface ${entry.surface}, which is no surface of §O.4`,
      );
    }
    if (entry.values.length === 0) {
      throw new OracleDataError("layer-allowlist.json", `${entry.row} allows nothing`);
    }
  }
  checked.push(
    `layer-allowlist.json: ${String(layerAllowlist.entries.length)} entries and ` +
      `${String(layerAllowlist.notReachable.length)} rows that are not reachable, each a row of the register map`,
  );

  // --- the per-OS expectations, F141-FR-035 -----------------------------
  if (!perOsExpectations.status.startsWith("inferred")) {
    throw new OracleDataError(
      "per-os-expectations.json",
      `every row is inferred until a macOS runner has passed; status is ${perOsExpectations.status}`,
    );
  }
  for (const row of perOsExpectations.expectations) {
    for (const field of ["subject", "linux", "macos"] as const) {
      if (typeof row[field] !== "string" || row[field] === "") {
        throw new OracleDataError("per-os-expectations.json", `a row has no ${field}`);
      }
    }
  }
  checked.push(
    `per-os-expectations.json: ${String(perOsExpectations.expectations.length)} rows, all inferred`,
  );

  // --- the supplement of the inventory, F141-FR-017 ---------------------
  const tsv = readFileSync(join(dir, INVENTORY_SUPPLEMENT_FILE), "utf8").trimEnd().split("\n");
  const header = (tsv[0] ?? "").split("\t");
  if (header[0] !== "b_item") {
    throw new OracleDataError(
      INVENTORY_SUPPLEMENT_FILE,
      `the first column is ${String(header[0])}, expected b_item`,
    );
  }
  const inventorySupplement = tsv.slice(1).map((line) => {
    const cells = line.split("\t");
    if (cells.length !== header.length) {
      throw new OracleDataError(
        INVENTORY_SUPPLEMENT_FILE,
        `a row has ${String(cells.length)} cells, the header has ${String(header.length)}`,
      );
    }
    return Object.freeze(Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ""])));
  });
  if (inventorySupplement.length !== 2) {
    throw new OracleDataError(
      INVENTORY_SUPPLEMENT_FILE,
      `${String(inventorySupplement.length)} rows, expected the two of F141-FR-017`,
    );
  }
  checked.push(`${INVENTORY_SUPPLEMENT_FILE}: the two proposed rows of F141-FR-017`);

  return Object.freeze({
    dir,
    fixtureCatalogue,
    stubVocabulary,
    surfaces,
    registerMap,
    layerAllowlist,
    perOsExpectations,
    inventorySupplement: Object.freeze(inventorySupplement),
    schemas: Object.freeze(schemas) as Readonly<Record<SchemaFileName, JsonSchema>>,
    checked: Object.freeze(checked),
  });
}

/**
 * The data of the oracle, loaded and checked at import: every reader below
 * gives a part of it. A data file that does not hold up stops the oracle here,
 * before a fixture runs.
 */
export const oracleData: OracleData = loadOracleData();

// ---------------------------------------------------------------------------
// The typed readers
// ---------------------------------------------------------------------------

/** §O.2: the catalogue of fixture families. */
export function fixtureCatalogue(): FixtureCatalogue {
  return oracleData.fixtureCatalogue;
}

/** One family by its id, or `undefined` when the catalogue does not hold it. */
export function family(id: string): FixtureFamily | undefined {
  return oracleData.fixtureCatalogue.families.find((f) => f.id === id);
}

/** The thirty-nine families that have scenarios. */
export function activeFamilies(): readonly FixtureFamily[] {
  return oracleData.fixtureCatalogue.families.filter((f) => f.status === "active");
}

/** §O.3: the rules, the verbs per kind of stub and the harness stubs. */
export function stubVocabulary(): StubVocabulary {
  return oracleData.stubVocabulary;
}

/** §O.4: S-01 to S-16, the run set and the roles of a transcript. */
export function surfaces(): Surfaces {
  return oracleData.surfaces;
}

/** Every surface name a test or a fixture may cite, the per-role forms included. */
export function knownSurfaceNames(): readonly string[] {
  return [...surfaceNames(oracleData.surfaces)].sort();
}

/** F141-FR-023: one entry per row of the divergence register. */
export function registerMap(): RegisterMap {
  return oracleData.registerMap;
}

/** F141-FR-040: the entries of the second suite and what is not reachable. */
export function layerAllowlist(): LayerAllowlist {
  return oracleData.layerAllowlist;
}

/** F141-FR-035: the expectations per operating system. */
export function perOsExpectations(): PerOsExpectations {
  return oracleData.perOsExpectations;
}

/** F141-FR-017: the two rows proposed for the behaviour inventory. */
export function inventorySupplement(): readonly InventorySupplementRow[] {
  return oracleData.inventorySupplement;
}

/** One schema of `data/schemas/`, by its file name. */
export function schemaOf(name: SchemaFileName): JsonSchema {
  const schema = oracleData.schemas[name];
  if (schema === undefined)
    throw new OracleDataError(`schemas/${name}`, "is not a schema of the oracle");
  return schema;
}

/**
 * F141-FR-013 — FX-37 keeps its id and has no scenario, and a test that cites
 * it is refused.
 */
export function assertFamilyMayBeCited(id: string): FixtureFamily {
  const found = family(id);
  if (found === undefined) {
    throw new OracleDataError(
      "fixture-catalogue.json",
      `${id} is no family of the catalogue; a test that cites it is refused`,
    );
  }
  if (found.status === "retired") {
    throw new OracleDataError(
      "fixture-catalogue.json",
      `${id} is retired: it keeps its id and has no scenario, and a test that cites it is refused (F141-FR-013)`,
    );
  }
  return found;
}

/**
 * F141-FR-012 — a fixture is a declaration and its files, and a declaration
 * that lacks a field is refused before it runs. The declaration is checked
 * against `data/schemas/fixture.schema.json`, and then against the catalogue:
 * the family is one that may be cited, every verb is a verb of §O.3 and every
 * surface is a surface of the family (F141-FR-030).
 */
export function validateFixtureDeclaration(value: unknown): {
  readonly id: string;
  readonly family: string;
  readonly scenario: string;
} {
  const violations = check(schemaOf("fixture.schema.json"), value);
  if (violations.length > 0) {
    throw new OracleDataError(
      "schemas/fixture.schema.json",
      `the declaration is refused: ${violationsAsText(violations)}`,
    );
  }
  const declaration = value as {
    id: string;
    stubs: Record<string, { verbs: string[] }[]>;
    surfaces: string[];
  };
  const [familyId, scenario] = declaration.id.split("/") as [string, string];
  const cited = assertFamilyMayBeCited(familyId);

  const vocabulary = oracleData.stubVocabulary;
  for (const [stub, steps] of Object.entries(declaration.stubs)) {
    const kind =
      vocabulary.kinds[stub] ??
      vocabulary.kinds[
        String(
          (
            vocabulary.harnessStubs.find((h) => h["harness"] === stub)?.["roles"] as
              Record<string, string> | undefined
          )?.["proposer"] ?? "",
        )
      ];
    if (kind === undefined) {
      throw new OracleDataError(
        "stub-vocabulary.json",
        `${declaration.id}: ${stub} is no stub of §O.3`,
      );
    }
    for (const step of steps) {
      for (const verb of step.verbs) {
        if (!kind.verbs.includes(verb)) {
          throw new OracleDataError(
            "stub-vocabulary.json",
            `${declaration.id}: ${verb} is no verb of ${stub}`,
          );
        }
      }
    }
  }

  for (const surface of declaration.surfaces) {
    if (!cited.surfaces.includes(surface)) {
      throw new OracleDataError(
        "fixture-catalogue.json",
        `${declaration.id}: the surface ${surface} is outside the surfaces of ${familyId} (F141-FR-030)`,
      );
    }
  }

  return { id: declaration.id, family: familyId, scenario };
}
