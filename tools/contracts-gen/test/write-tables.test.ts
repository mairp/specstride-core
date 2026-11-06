/**
 * T290 — the writers of the mirrors.
 *
 * `annex-tables/<annex>.json` for each of the nine annexes and
 * `requirements.json` are rebuilt from the annexes and compared with the
 * committed files byte for byte.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { dump, readAnnexes, requirementsIndex } from "../src/write-tables.ts";
import { ANNEXES, defaultPlaces } from "../src/paths.ts";

const places = defaultPlaces();
const corpus = readAnnexes(places.annexDir);

function committed(rel: string): string {
  return readFileSync(join(places.contractsDir, rel), "utf8");
}

test("T290 the nine files of annex-tables/ equal the committed files byte for byte", () => {
  assert.equal(corpus.annexTables.size, 9);
  for (const [, stem] of ANNEXES) {
    const rel = `annex-tables/${stem}.json`;
    assert.equal(dump(corpus.annexTables.get(rel)), committed(rel), rel);
  }
});

test("T290 every table of every annex is mirrored by section and sub-heading", () => {
  const a = JSON.parse(dump(corpus.annexTables.get("annex-tables/A-foundations.json"))) as {
    annex: string;
    tables: { section: string; heading: string; subheading: string | null; header: string[] }[];
  };
  assert.equal(a.annex, "A");
  for (const t of a.tables) {
    assert.ok(typeof t.section === "string");
    assert.ok(typeof t.heading === "string");
    assert.ok(Array.isArray(t.header));
    assert.ok(t.subheading === null || typeof t.subheading === "string");
  }
  // The mirror of every annex holds exactly the tables the parser found.
  let total = 0;
  for (const [, stem] of ANNEXES) {
    const one = JSON.parse(dump(corpus.annexTables.get(`annex-tables/${stem}.json`))) as {
      tables: unknown[];
    };
    total += one.tables.length;
  }
  assert.equal(total, corpus.tables.length);
});

test("T290 requirements.json equals the committed file byte for byte", () => {
  assert.equal(dump(requirementsIndex(corpus.reqs)), committed("requirements.json"));
});

test("T290 the index refuses a gap in the requirement ids", () => {
  const withAGap = corpus.reqs.filter((r) => r["id"] !== "F100-FR-100");
  assert.throws(() => requirementsIndex(withAGap), /not sequential in annex order/);
  // A requirement above 226 is outside the sequential window, so duplicating
  // it leaves the first check satisfied and fires the second.
  const above226 = corpus.reqs.find((r) => Number(String(r["id"]).slice(-3)) > 226);
  assert.ok(above226 !== undefined);
  const twice = [...corpus.reqs, above226];
  assert.throws(() => requirementsIndex(twice), /not unique and without a gap/);
});
