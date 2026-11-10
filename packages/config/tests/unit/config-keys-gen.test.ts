/**
 * T004 — the check that `contracts/config-keys.tsv` is derived from the tables
 * of `spec.md` §K.3 to §K.6b and fails when they differ
 * (F110-FR-001, F110-FR-009).
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildCatalogue,
  CATALOGUE_KEY_COUNT,
  check,
  checkCorrections,
  COLUMNS,
  defaultPlaces,
  diffTsv,
  EXCLUDED_KEYS,
  parseCorrections,
  parseOwnerCell,
  parseSpecTables,
  renderTsv,
} from "../../tools/config-keys-gen.ts";

const here = dirname(fileURLToPath(import.meta.url));
const places = defaultPlaces();
const specText = readFileSync(places.specPath, "utf8");
const sourcesText = readFileSync(places.sourcesPath, "utf8");
const committed = readFileSync(places.cataloguePath, "utf8");

test("T004: contracts/config-keys.tsv is what §K.3 to §K.6b derive", () => {
  const report = check(places);
  assert.deepEqual(report.problems, [], "the sources of the catalogue are complete and consistent");
  assert.deepEqual(
    report.differences,
    [],
    "every column the tables carry agrees with the committed catalogue",
  );
});

const fileKeys = committed
  .replace(/\n$/, "")
  .split("\n")
  .slice(1)
  .map((l) => l.split("\t")[0]);

test("T004: the file holds exactly those 260 keys of §K.3 to §K.6b, and each once", () => {
  const tableKeys = parseSpecTables(specText).map((r) => r.key);
  const excluded = new Set<string>(EXCLUDED_KEYS);
  const specKeys = tableKeys.filter((k) => !excluded.has(k));
  assert.equal(new Set(tableKeys).size, tableKeys.length, "no key is written twice in the spec");
  assert.equal(new Set(fileKeys).size, fileKeys.length, "no key is written twice in the file");
  assert.deepEqual(fileKeys, specKeys, "same keys, same order");
  // T004's acceptance fixes the count: "the file holds exactly those 260 keys".
  assert.equal(CATALOGUE_KEY_COUNT, 260);
  assert.equal(fileKeys.length, 260, "the catalogue holds exactly 260 keys");
  assert.equal(specKeys.length, CATALOGUE_KEY_COUNT);
});

test("T004: the four keys of feature 107 are in the tables and out of the catalogue", () => {
  const tableKeys = new Set(parseSpecTables(specText).map((r) => r.key));
  assert.deepEqual(
    [...EXCLUDED_KEYS],
    [
      "derive.stageTimeoutSec",
      "verification.scopes.<commandId>.reads",
      "verification.scopes.<commandId>.writes",
      "verification.scopes.<commandId>.sideEffects",
    ],
  );
  for (const key of EXCLUDED_KEYS) {
    // The exclusion cannot go stale: each name is really a row of the tables...
    assert.ok(tableKeys.has(key), `§K.3 to §K.6b still name ${key}`);
    // ...and really absent from the catalogue of this feature.
    assert.ok(!fileKeys.includes(key), `contracts/config-keys.tsv does not carry ${key}`);
  }
  // 260 carried + 4 left to feature 107 = every key the tables write.
  assert.equal(fileKeys.length + EXCLUDED_KEYS.length, tableKeys.size);
});

test("T004: every row has all ten columns", () => {
  const lines = committed.replace(/\n$/, "").split("\n");
  assert.deepEqual(lines[0].split("\t"), [...COLUMNS]);
  for (const line of lines.slice(1)) {
    assert.equal(line.split("\t").length, COLUMNS.length, `ten columns on: ${line.slice(0, 60)}`);
  }
});

test("T004: §K.9 — every old spelling lives in confirmed_or_corrected, never as a row", () => {
  const { rows } = buildCatalogue(specText, sourcesText);
  const corrections = parseCorrections(specText);
  assert.ok(corrections.length >= 30, `§K.9 was read: ${corrections.length} corrections`);
  // Spot checks of the three kinds §K.9 writes.
  const spellings = corrections.map((c) => c.oldSpelling);
  assert.ok(spellings.includes("otel.legacyMetricNames"), "the correction of row 42");
  assert.ok(spellings.includes("fallback.after"), "a withdrawal");
  assert.ok(spellings.includes("session.ttl_seconds"), "a spelling that became no key at all");
  assert.ok(
    spellings.includes("loop.micro.caps.escalations_per_attempt"),
    "a bare segment is read with the parent of the first key in its cell",
  );
  assert.deepEqual(checkCorrections(corrections, rows), []);
});

test("T004: the owner cell is read for the owner, the profile rows and the parity value", () => {
  assert.deepEqual(parseOwnerCell("110"), {
    ownerFeature: "110",
    profileRow: "",
    valueUnderParity: "as default",
  });
  assert.deepEqual(parseOwnerCell("110, 124. Row 36; (fixture)"), {
    ownerFeature: "110, 124",
    profileRow: "36",
    valueUnderParity: "(fixture)",
  });
  assert.deepEqual(parseOwnerCell("126. Row 79; on. Row 86 names the same switch"), {
    ownerFeature: "126",
    profileRow: "79, 86",
    valueUnderParity: "on",
  });
  assert.deepEqual(parseOwnerCell("105. Row 126; `80`. Alias `SPECSTRIDE_VERIFY_TAIL_LINES`"), {
    ownerFeature: "105",
    profileRow: "126",
    valueUnderParity: "80",
  });
});

// ---------------------------------------------------------------------------
// The negative cases: the check must FAIL when the two differ.
// ---------------------------------------------------------------------------

test("T004 negative: a key removed from the catalogue is reported", () => {
  const { rows } = buildCatalogue(specText, sourcesText);
  const short = renderTsv(rows.filter((r) => r.key !== "loop.maxIter"));
  const differences = diffTsv(renderTsv(rows), short);
  assert.deepEqual(differences, [
    "loop.maxIter: in §K.3 to §K.6b, missing from contracts/config-keys.tsv",
  ]);
});

test("T004 negative: a key in the catalogue that no table has is reported", () => {
  const { rows } = buildCatalogue(specText, sourcesText);
  const generated = renderTsv(rows);
  const extra = `${generated}loop.maxIterations\twhole number\t30\tas default\t- (snap t)\t103\t103\tconfirmed\tF E P U\t\n`;
  assert.deepEqual(diffTsv(generated, extra), [
    "loop.maxIterations: in contracts/config-keys.tsv, in no table of §K.3 to §K.6b",
  ]);
});

test("T004 negative: a default changed in the spec table makes the check differ", () => {
  const mutated = specText.replace(
    "| `loop.maxIter` | whole number",
    "| `loop.maxIter` | whole number of iterations",
  );
  assert.notEqual(mutated, specText, "the spec row of loop.maxIter was found");
  const { rows } = buildCatalogue(mutated, sourcesText);
  const differences = diffTsv(renderTsv(rows), committed);
  assert.equal(differences.length, 1);
  assert.match(differences[0], /^loop\.maxIter \[type_and_range\]: spec gives/);
});

test("T004 negative: a withdrawn spelling given a row of its own is refused", () => {
  const { rows } = buildCatalogue(specText, sourcesText);
  const withOrphan = [
    ...rows,
    {
      key: "fallback.after",
      type_and_range: "milliseconds",
      default: "none",
      value_under_parity: "as default",
      trust_class: "W (snap p)",
      owner_feature: "127",
      proposed_by: "110 (R16)",
      confirmed_or_corrected: "withdrawn",
      layers: "F E U",
      profile_row: "",
    },
  ];
  const problems = checkCorrections(parseCorrections(specText), withOrphan);
  assert.ok(
    problems.some((p) => p.includes("fallback.after") && p.includes("row of its own")),
    `the orphan row is named: ${problems.join(" | ")}`,
  );
});

test("T004 negative: a source row for a key no table has is refused", () => {
  const sources = JSON.parse(sourcesText) as {
    rows: { key: string; proposed_by?: string; confirmed_or_corrected?: string }[];
  };
  sources.rows.push({
    key: "loop.notAKey",
    proposed_by: "103",
    confirmed_or_corrected: "confirmed",
  });
  const { problems } = buildCatalogue(specText, JSON.stringify(sources));
  assert.deepEqual(problems, [
    "config-keys-sources.json names loop.notAKey, which no table of §K.3 to §K.6b has",
  ]);
});

test("T004 negative: an excluded key of feature 107 given a row is reported", () => {
  const { rows } = buildCatalogue(specText, sourcesText);
  const generated = renderTsv(rows);
  const withExcluded =
    `${generated}derive.stageTimeoutSec\twhole number of seconds, at least 1\t86400` +
    `\tas default\tN lo (snap t)\t107\t107\tconfirmed\tF E U; P lowers\t\n`;
  assert.deepEqual(diffTsv(generated, withExcluded), [
    "derive.stageTimeoutSec: in contracts/config-keys.tsv, but T004 leaves it to feature 107",
  ]);
});

test("T004 negative: a source row for an excluded key of feature 107 is refused", () => {
  const sources = JSON.parse(sourcesText) as {
    rows: { key: string; proposed_by?: string; confirmed_or_corrected?: string }[];
  };
  sources.rows.push({ key: "derive.stageTimeoutSec", proposed_by: "107" });
  const { problems } = buildCatalogue(specText, JSON.stringify(sources));
  assert.deepEqual(problems, [
    "config-keys-sources.json names derive.stageTimeoutSec, which T004 leaves out of the " +
      "catalogue (feature 107 owns it)",
  ]);
});

test("T004: the generator writes nothing outside the contracts folder of this feature", () => {
  const text = readFileSync(join(here, "..", "..", "tools", "config-keys-gen.ts"), "utf8");
  const writes = [...text.matchAll(/writeFileSync\(([^,]+),/g)].map((m) => m[1].trim());
  assert.deepEqual(writes, ["places.cataloguePath"]);
  assert.match(places.cataloguePath, /specs\/110-config-and-terms\/contracts\/config-keys\.tsv$/);
});
