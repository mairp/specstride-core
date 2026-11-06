/**
 * T292 — the writers of the data files.
 *
 * The 22 files of `data/` and the 30 files of `schemas/` are rebuilt from the
 * annexes and the three hand-written sources and compared with the committed
 * files byte for byte; and the two checks of the hand-written sources fire.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dump, readAnnexes } from "../src/write-tables.ts";
import { data, readTsv, writeData, writeSchemas } from "../src/write-data.ts";
import { RECORDS } from "../src/schema.ts";
import { defaultPlaces, NOTE, type Places } from "../src/paths.ts";

const places = defaultPlaces();
const corpus = readAnnexes(places.annexDir);

const out = new Map<string, unknown>();
writeSchemas(out, corpus.tables);
writeData(out, corpus.tables, places);

function committed(rel: string): string {
  return readFileSync(join(places.contractsDir, rel), "utf8");
}

test("T292 the 22 files of data/ equal the committed files byte for byte", () => {
  const built = [...out.keys()].filter((k) => k.startsWith("data/")).sort();
  const onDisk = readdirSync(join(places.contractsDir, "data"))
    .filter((n) => n.endsWith(".json"))
    .map((n) => `data/${n}`)
    .sort();
  assert.equal(built.length, 22);
  assert.deepEqual(built, onDisk);
  for (const rel of built) assert.equal(dump(out.get(rel)), committed(rel), rel);
});

test("T292 the 30 files of schemas/ equal the committed files byte for byte", () => {
  const built = [...out.keys()].filter((k) => k.startsWith("schemas/")).sort();
  assert.equal(built.length, 30);
  assert.equal(RECORDS.length, 30);
  for (const rel of built) assert.equal(dump(out.get(rel)), committed(rel), rel);
});

test("T292 every file of data/ carries its schema id, the note and its annex", () => {
  for (const rel of [...out.keys()].filter((k) => k.startsWith("data/"))) {
    const value = out.get(rel) as Record<string, unknown>;
    const keys = Object.keys(value);
    assert.deepEqual(keys.slice(0, 3), ["schema", "note", "annex"], rel);
    assert.equal(value["note"], NOTE, rel);
    assert.ok(String(value["annex"]).startsWith("annex "), rel);
  }
});

test("T292 `data` puts the schema id, the note and the annex before the payload", () => {
  const one = new Map<string, unknown>();
  data(one, "sample", "specstride.sample/1", "B", "§B.5", { rows: [1, 2] });
  assert.deepEqual(one.get("data/sample.json"), {
    schema: "specstride.sample/1",
    note: NOTE,
    annex: "annex B, §B.5",
    rows: [1, 2],
  });
});

test("T292 the tab-separated readers read the inventory and the traceability items", () => {
  const inv = readTsv(join(places.repoDir, "docs/ecosystem/research/R18-behaviour-inventory.tsv"));
  assert.ok(inv.length > 0);
  assert.ok(Object.prototype.hasOwnProperty.call(inv[0], "b_item"));
  assert.ok(Object.prototype.hasOwnProperty.call(inv[0], "kind"));
  const items = readTsv(join(places.repoDir, "docs/ecosystem/traceability-items.tsv"));
  assert.ok(items.length > 0);
  assert.ok(Object.prototype.hasOwnProperty.call(items[0], "disposition"));
  // `layout-old-side.json` holds one row per `file` item of the inventory.
  const fileItems = inv.filter((r) => r["kind"] === "file");
  const oldSide = out.get("data/layout-old-side.json") as { count: number; items: unknown[] };
  assert.equal(oldSide.count, fileItems.length);
  assert.equal(oldSide.items.length, fileItems.length);
});

/** A scratch copy of `contracts/sources/` that a test may edit. */
function scratchPlaces(): Places {
  const dir = mkdtempSync(join(tmpdir(), "contracts-gen-sources-"));
  cpSync(join(places.contractsDir, "sources"), join(dir, "sources"), { recursive: true });
  return { annexDir: places.annexDir, contractsDir: dir, repoDir: places.repoDir };
}

test("T292 physical-paths.json is checked against the table of annex B §B.5", () => {
  const scratch = scratchPlaces();
  const path = join(scratch.contractsDir, "sources/physical-paths.json");
  const phys = JSON.parse(readFileSync(path, "utf8")) as {
    paths: Record<string, string>;
  };
  const first = Object.keys(phys.paths)[0];
  delete phys.paths[first];
  phys.paths["run:<runId>:no-such-name"] = "<control>/nowhere";
  writeFileSync(path, JSON.stringify(phys, null, 1) + "\n");
  assert.throws(
    () => writeData(new Map(), corpus.tables, scratch),
    (err: Error) =>
      /physical-paths\.json: missing/.test(err.message) &&
      err.message.includes(first) &&
      err.message.includes("run:<runId>:no-such-name"),
  );
});

test("T292 old-side.json is checked against the inventory and the traceability items", () => {
  const scratch = scratchPlaces();
  const path = join(scratch.contractsDir, "sources/old-side.json");
  const old = JSON.parse(readFileSync(path, "utf8")) as {
    items: Record<string, { what?: string; rule?: string; logicalNames?: string[] }>;
  };
  const first = Object.keys(old.items)[0];
  delete old.items[first];
  old.items["B-9999"] = { what: "location", rule: "not carried" };
  writeFileSync(path, JSON.stringify(old, null, 1) + "\n");
  assert.throws(
    () => writeData(new Map(), corpus.tables, scratch),
    (err: Error) =>
      err.message.startsWith("old-side.json:") &&
      err.message.includes("no row for " + first) &&
      err.message.includes("B-9999 is not a file item of the inventory"),
  );
});

test("T292 a logical name of old-side.json that annex B does not hold is refused", () => {
  const scratch = scratchPlaces();
  const path = join(scratch.contractsDir, "sources/old-side.json");
  const old = JSON.parse(readFileSync(path, "utf8")) as {
    items: Record<string, { what?: string; rule?: string; logicalNames?: string[] }>;
  };
  const named = Object.keys(old.items).find((k) => (old.items[k].logicalNames ?? []).length > 0);
  assert.ok(named !== undefined);
  old.items[named].logicalNames = ["run:<runId>:not-in-annex-b"];
  writeFileSync(path, JSON.stringify(old, null, 1) + "\n");
  assert.throws(
    () => writeData(new Map(), corpus.tables, scratch),
    new RegExp(`${named}: run:<runId>:not-in-annex-b is not in annex B`),
  );
});

test("T292 package-graph.json is copied unchecked", () => {
  const graph = JSON.parse(
    readFileSync(join(places.contractsDir, "sources/package-graph.json"), "utf8"),
  ) as Record<string, unknown>;
  const built = out.get("data/package-graph.json") as Record<string, unknown>;
  for (const [key, value] of Object.entries(graph)) assert.deepEqual(built[key], value, key);
  assert.equal(built["schema"], "specstride.package-graph/1");
});
