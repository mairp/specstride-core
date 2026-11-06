/**
 * T291 — the writers of the extension points.
 *
 * The nineteen files of `extension-points/` and `index.json` are rebuilt from
 * the annexes and compared with the committed files byte for byte.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { dump, readAnnexes } from "../src/write-tables.ts";
import { EPS, writeExtensionPoints } from "../src/write-extension-points.ts";
import { EP_SUBHEADS } from "../src/markdown.ts";
import { defaultPlaces } from "../src/paths.ts";

const places = defaultPlaces();
const corpus = readAnnexes(places.annexDir);

const out = new Map<string, unknown>();
writeExtensionPoints(out, corpus.eps, corpus.reqs);

function committed(rel: string): string {
  return readFileSync(join(places.contractsDir, rel), "utf8");
}

test("T291 the twenty files of extension-points/ equal the committed files byte for byte", () => {
  assert.equal(out.size, 20);
  assert.equal(EPS.length, 19);
  for (const [rel, value] of out) assert.equal(dump(value), committed(rel), rel);
});

test("T291 each file holds the ids, the section, the operations and the thirteen sub-sections", () => {
  for (const spec of EPS) {
    const rel = `extension-points/${spec.ep}.${spec.stem}.json`;
    const doc = out.get(rel) as {
      ep: string;
      ids: string[];
      annex: string;
      operations: string[];
      requirements: string[];
      sections: Record<string, unknown>;
    };
    assert.equal(doc.ep, spec.ep);
    assert.deepEqual(doc.ids, [...spec.ids]);
    assert.equal(doc.annex, `annex ${spec.annex}, ${spec.section}`);
    assert.deepEqual(doc.operations, [...spec.operations]);
    assert.deepEqual(Object.keys(doc.sections), [...EP_SUBHEADS]);
    assert.ok(Array.isArray(doc.requirements));
  }
});

test("T291 the sub-sections are carried word for word", () => {
  // EP-13 (the lock, annex F §F.5) is the sample: every prose line of a
  // sub-section of the file is a line of the annex.
  const annex = readFileSync(join(places.annexDir, "F-runtime-root.md"), "utf8");
  const doc = out.get("extension-points/EP-13.lock.json") as {
    sections: Record<string, (string | { table: unknown })[]>;
  };
  let lines = 0;
  for (const body of Object.values(doc.sections)) {
    for (const part of body) {
      if (typeof part !== "string") continue;
      assert.ok(annex.includes(part), part);
      lines++;
    }
  }
  assert.ok(lines > 0);
});

test("T291 the requirements that cite a point are the ones with its `ep` field", () => {
  const doc = out.get("extension-points/EP-13.lock.json") as { requirements: string[] };
  const expected = corpus.reqs
    .filter((r) => String(r["ep"] ?? "").startsWith("EP-13 "))
    .map((r) => String(r["id"]));
  assert.deepEqual(doc.requirements, expected);
  assert.ok(expected.length > 0);
});

test("T291 index.json names the nineteen points and their files", () => {
  const index = out.get("extension-points/index.json") as {
    extensionPoints: { ep: string; file: string }[];
  };
  assert.equal(index.extensionPoints.length, 19);
  for (const row of index.extensionPoints) assert.ok(out.has(row.file), row.file);
});

test("T291 a point whose section lacks a sub-heading stops the generator", () => {
  const broken = structuredClone(corpus.eps);
  delete broken["§F.5"]["Purpose"];
  assert.throws(
    () => writeExtensionPoints(new Map(), broken, corpus.reqs),
    /EP-13 lacks a sub-heading in §F\.5/,
  );
});
