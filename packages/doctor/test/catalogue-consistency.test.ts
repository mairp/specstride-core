/**
 * T003 — the consistency check of `specs/112-doctor/contracts/README.md`,
 * added to the build of `@specstride/doctor`.
 *
 * The copy of the catalogue in `packages/doctor/data/check-catalogue.tsv` is
 * held against the contract of the feature:
 *
 * - the copy is byte-identical to `specs/112-doctor/contracts/check-catalogue.tsv`;
 * - 45 rows (one per core check, F112-FR-011);
 * - every id is written in the table of `spec.md` (the severities per group);
 * - the rows with `lb` are exactly the ten of F112-FR-030;
 * - every group is one of the 19 groups (the closed set of `data-model.md`);
 * - every message template is at most 200 bytes (R16 F3).
 *
 * The expectations are the contract text and the spec, read at run time, so
 * the test fails when either side moves: it does not restate the catalogue.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const CATALOGUE_URL = new URL("../data/check-catalogue.tsv", import.meta.url);
const BOUNDARY_URL = new URL("../data/import-boundary.json", import.meta.url);
const SOURCE_CATALOGUE_URL = new URL(
  "../../../specs/112-doctor/contracts/check-catalogue.tsv",
  import.meta.url,
);
const SPEC_URL = new URL("../../../specs/112-doctor/spec.md", import.meta.url);

/** The ten ids F112-FR-030 fixes as launch-blocking, in the order of the file. */
const LAUNCH_BLOCKING_IDS = [
  "bin.<id>",
  "auth.<id>.<role>",
  "model.reach.<role>",
  "critic.independence",
  "terms.gate",
  "budget.caps",
  "config.schema",
  "secret.inline",
  "secret.file",
  "sandbox.critic",
] as const;

/** The 19 groups of the closed set (`specs/112-doctor/data-model.md`). */
const GROUPS = [
  "env",
  "cli",
  "host",
  "bin",
  "harness",
  "auth",
  "model",
  "critic",
  "terms",
  "quota",
  "budget",
  "config",
  "secret",
  "run",
  "sandbox",
  "ui",
  "telemetry",
  "events",
  "memory",
] as const;

const HEADERS = [
  "n",
  "id",
  "group",
  "probe supplied by",
  "severity rule",
  "lb",
  "message template",
  "fix hint",
] as const;

type Row = Readonly<Record<(typeof HEADERS)[number], string>>;

/** Parse the TSV into rows keyed by the header line. */
function parseCatalogue(text: string): readonly Row[] {
  const lines = text.split("\n").filter((l) => l !== "");
  const header = lines[0]!.split("\t");
  assert.deepEqual(header, [...HEADERS]);
  return lines.slice(1).map((line) => {
    const cells = line.split("\t");
    assert.equal(cells.length, HEADERS.length, `row has 8 tab-separated cells: ${line}`);
    return Object.fromEntries(HEADERS.map((h, i) => [h, cells[i]!])) as Row;
  });
}

test("T003: the copy of the catalogue is byte-identical to the contract of the feature", () => {
  const copy = readFileSync(CATALOGUE_URL);
  const source = readFileSync(SOURCE_CATALOGUE_URL);
  assert.ok(copy.equals(source), "packages/doctor/data/check-catalogue.tsv must be a plain copy");
});

test("T003: the catalogue has exactly 45 rows, numbered 1 to 45", () => {
  const rows = parseCatalogue(readFileSync(CATALOGUE_URL, "utf8"));
  assert.equal(rows.length, 45);
  assert.deepEqual(
    rows.map((r) => r["n"]),
    Array.from({ length: 45 }, (_, i) => String(i + 1)),
  );
});

test("T003: every id of the catalogue is written in the table of spec.md", () => {
  const rows = parseCatalogue(readFileSync(CATALOGUE_URL, "utf8"));
  const spec = readFileSync(SPEC_URL, "utf8");
  for (const row of rows) {
    assert.ok(
      spec.includes(`\`${row["id"]}\``),
      `id ${row["id"]} of the catalogue is not in the tables of spec.md`,
    );
  }
});

test("T003: the rows with lb are exactly the ten launch checks of F112-FR-030", () => {
  const rows = parseCatalogue(readFileSync(CATALOGUE_URL, "utf8"));
  // `budget.caps` carries the flag conditionally ("yes (only for an
  // automatically picked metered critic)", F112-FR-030); the cell starts
  // with `yes` exactly when the flag is set.
  const flagged = rows.filter((r) => r["lb"].startsWith("yes")).map((r) => r["id"]);
  assert.equal(rows.filter((r) => !r["lb"].startsWith("yes") && r["lb"] !== "no").length, 0);
  assert.deepEqual(flagged, [...LAUNCH_BLOCKING_IDS]);
  assert.ok(
    rows.find((r) => r["id"] === "budget.caps")?.["lb"].startsWith("yes (only for"),
    "budget.caps keeps its conditional lb cell",
  );
});

test("T003: every group of the catalogue is one of the 19 groups of the closed set", () => {
  const rows = parseCatalogue(readFileSync(CATALOGUE_URL, "utf8"));
  for (const row of rows) {
    assert.ok(
      (GROUPS as readonly string[]).includes(row["group"]),
      `unknown group ${row["group"]} on row ${row["n"]}`,
    );
  }
  assert.equal(new Set(rows.map((r) => r["group"])).size, GROUPS.length, "all 19 groups occur");
});

test("T003: every message template of the catalogue is at most 200 bytes", () => {
  const rows = parseCatalogue(readFileSync(CATALOGUE_URL, "utf8"));
  for (const row of rows) {
    const bytes = Buffer.byteLength(row["message template"], "utf8");
    assert.ok(bytes <= 200, `message of row ${row["n"]} (${row["id"]}) is ${bytes} bytes`);
  }
});

/**
 * T068 — the rule of F112-FR-033, from the import-boundary data of the
 * package (`data/import-boundary.json`): every row of the catalogue whose
 * probe is not `core` has no file of that check in `src/checks/`. The probe
 * of such a row lives in the package of its owner; the doctor keeps only the
 * data of the row (id, severity rule, flag, message, fix).
 */
test("T068: every row whose probe is not core has no file of that check in src/checks (F112-FR-033)", () => {
  const boundary = JSON.parse(readFileSync(BOUNDARY_URL, "utf8")) as {
    requirement: string;
    coreSupplierMarker: string;
    coreAllowedMarker: string;
    allowedDependencies: readonly string[];
  };
  assert.equal(boundary.requirement, "F112-FR-033");
  const rows = parseCatalogue(readFileSync(CATALOGUE_URL, "utf8"));

  // The file stems held in src/checks/. A file of a check would be named for
  // it: the literal head of the id, dots read as dashes (a file of the core
  // rows 12 and 13 is `harness.ts`, which no row's head produces).
  const stems = readdirSync(new URL("../src/checks/", import.meta.url))
    .filter((f) => f.endsWith(".ts"))
    .map((f) => f.replace(/\.ts$/, "").toLowerCase());
  const stemOf = (id: string): string =>
    id.split("<")[0]!.replace(/\.$/, "").split(".").join("-").toLowerCase();

  for (const row of rows) {
    const supplier = row["probe supplied by"].trim();
    // The catalogue lets the core supply a row either outright (`core`) or
    // jointly (`... or core ...`, read from the resolved registry).
    if (supplier === boundary.coreSupplierMarker) continue;
    if (supplier.includes(boundary.coreAllowedMarker)) continue;
    const stem = stemOf(row["id"]);
    assert.ok(
      !stems.includes(stem),
      `row ${row["n"]} (${row["id"]}) is supplied by "${supplier}", ` +
        `but src/checks/ holds a file of it (${stem}.ts) — F112-FR-033`,
    );
  }

  // The same rule on the imports: no file of src/checks/ imports the package
  // of an owner — only node built-ins, siblings and the allowed dependencies.
  const allowed = boundary.allowedDependencies;
  for (const name of readdirSync(new URL("../src/checks/", import.meta.url))) {
    if (!name.endsWith(".ts")) continue;
    const text = readFileSync(new URL(`../src/checks/${name}`, import.meta.url), "utf8");
    for (const match of text.matchAll(/(?:from|import)\s+"([^"]+)"/g)) {
      const specifier = match[1] ?? "";
      const ok =
        specifier.startsWith("node:") ||
        specifier.startsWith("./") ||
        specifier.startsWith("../") ||
        allowed.some((pkg) => specifier === pkg || specifier.startsWith(`${pkg}/`));
      assert.ok(
        ok,
        `src/checks/${name} imports "${specifier}", which is not of the ` +
          `import boundary of the package (F112-FR-033)`,
      );
    }
  }

  // And the boundary data agrees with the manifest: the doctor depends on
  // exactly the allowed packages, never on the package of an owner.
  const manifest = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  ) as { dependencies?: Record<string, string> };
  assert.deepEqual(
    Object.keys(manifest.dependencies ?? {}).sort(),
    [...allowed].sort(),
    "the dependencies of the package are exactly the allowed ones of the boundary data",
  );
});
