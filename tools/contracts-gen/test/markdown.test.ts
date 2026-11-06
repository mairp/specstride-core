/**
 * T288 — the markdown readers of the generator.
 *
 * The test input is annex A. The parser finds its five sections and every
 * requirement block of the annex with its fields, and the cell splitter, the
 * tick stripper, the profile-key reader and the table finder each answer for
 * the annexes as the Python script does.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  asDicts,
  cells,
  EP_SUBHEADS,
  findTable,
  parseAnnex,
  profileKeys,
  ticks,
} from "../src/markdown.ts";
import { defaultPlaces } from "../src/paths.ts";

const places = defaultPlaces();

/**
 * The five sections of annex A (`## §A.1` to `## §A.5`).
 */
const SECTIONS_OF_ANNEX_A = ["§A.1", "§A.2", "§A.3", "§A.4", "§A.5"] as const;

/**
 * The 33 requirements that T288 names: F100-FR-001 to F100-FR-031 with
 * F100-FR-234 and F100-FR-235, which is what annex A held when the task was
 * written. The amendment of 2026-09-30 added one more requirement to §A.4,
 * F100-FR-237 (the interface of finalization; plan.md, "237 requirements …
 * 237 after the upstream fixes of 2026-09-30"), so the annex now holds 34.
 * The test pins both numbers: the 33 of the task must all be there, and the
 * whole count must equal the committed `requirements.json`.
 */
const THE_33_OF_THE_TASK = [
  ...Array.from({ length: 31 }, (_, n) => `F100-FR-${String(n + 1).padStart(3, "0")}`),
  "F100-FR-234",
  "F100-FR-235",
];

test("T288 the annex parser finds the five sections of annex A", () => {
  const { tables, reqs } = parseAnnex("A", "A-foundations", places.annexDir);
  // Every table and every requirement carries the section it stands in; the
  // union over annex A is its five sections. §A.1 holds only tables (the
  // layers) and §A.2, §A.3 and §A.5 hold only requirements, so neither list
  // alone names all five.
  const sections = [
    ...new Set([...tables.map((t) => t.section), ...reqs.map((r) => r["section"])]),
  ].sort();
  assert.deepEqual(sections, [...SECTIONS_OF_ANNEX_A]);
  assert.equal(sections.length, 5);
  assert.deepEqual(
    [...new Set(tables.map((t) => `${t.section} ${t.heading}`))],
    ["§A.1 Layers", "§A.4 Common rules of every extension point"],
  );
});

test("T288 the annex parser finds the requirements of annex A with their fields", () => {
  const { reqs } = parseAnnex("A", "A-foundations", places.annexDir);
  const ids = reqs.map((r) => String(r["id"]));
  assert.equal(THE_33_OF_THE_TASK.length, 33);
  for (const id of THE_33_OF_THE_TASK) assert.ok(ids.includes(id), `${id} is missing`);
  // The one requirement the amendment of 2026-09-30 added to §A.4.
  assert.ok(ids.includes("F100-FR-237"));
  assert.equal(ids.length, 34);
  // The same set, and the same order, as the committed mirror.
  const committed = JSON.parse(
    readFileSync(join(places.contractsDir, "requirements.json"), "utf8"),
  ) as { requirements: Record<string, string>[] };
  const ofA = committed.requirements.filter((r) => r["annex"] === "A");
  assert.deepEqual(reqs, ofA);
  // The fields of a requirement block are read: F100-FR-001 carries its origin.
  const one = reqs.find((r) => r["id"] === "F100-FR-001") as Record<string, string>;
  assert.equal(one["annex"], "A");
  assert.equal(one["section"], "§A.2");
  assert.ok(Object.keys(one).length > 4, "the fields below the requirement are read");
});

test("T288 the cell splitter keeps a pipe inside backticks", () => {
  assert.deepEqual(cells("| a | b | c |"), ["a", "b", "c"]);
  assert.deepEqual(cells("| a | `b|c` | d |"), ["a", "`b|c`", "d"]);
  assert.deepEqual(cells("a | b"), ["a", "b"]);
});

test("T288 the tick stripper returns the names in backticks in order", () => {
  assert.deepEqual(ticks("the `run` and the `pass`"), ["run", "pass"]);
  assert.deepEqual(ticks("no backtick here"), []);
});

test("T288 the profile-key reader reads the key column of annex X §X.7", () => {
  assert.deepEqual(profileKeys("—"), []);
  assert.deepEqual(profileKeys("`loop.micro.enabled`"), ["loop.micro.enabled"]);
  // A short form takes the place of the last segment of the last full key.
  assert.deepEqual(profileKeys("`caps.evidence.chars`, `.tokens`"), [
    "caps.evidence.chars",
    "caps.evidence.tokens",
  ]);
  // Text in parentheses names no key; a bare name that is not a key is left out.
  assert.deepEqual(profileKeys("`loop.micro.enabled` (`--no-micro`)"), ["loop.micro.enabled"]);
  assert.deepEqual(profileKeys("`resume`"), []);
  // Every cell of the committed profile agrees with the reader.
  const profile = JSON.parse(
    readFileSync(join(places.contractsDir, "data/parity-profile.json"), "utf8"),
  ) as { switches: { keyNote: string; keys: string[]; key: string | null }[] };
  for (const row of profile.switches) {
    assert.deepEqual(profileKeys(row.keyNote), row.keys, row.keyNote);
    assert.equal(row.key, row.keys.length > 0 ? row.keys[0] : null);
  }
});

test("T288 the table finder picks a table by section, first cell and sub-heading", () => {
  const { tables } = parseAnnex("A", "A-foundations", places.annexDir);
  const layers = findTable(tables, "A", "§A.1", "Layer");
  assert.equal(layers.header[0], "Layer");
  const rows = asDicts(layers);
  assert.ok(rows.length >= 7);
  assert.ok(Object.prototype.hasOwnProperty.call(rows[0], "Layer"));
  assert.throws(() => findTable(tables, "A", "§A.1", "No such column"), /no table A §A\.1/);
});

test("T288 the parser collects the thirteen sub-sections of an extension point", () => {
  const { eps } = parseAnnex("C", "C-ports-and-edges", places.annexDir);
  const harness = eps["§C.1"];
  assert.ok(harness !== undefined, "§C.1 holds an extension point");
  for (const head of EP_SUBHEADS) {
    assert.ok(Object.prototype.hasOwnProperty.call(harness, head), `${head} is missing`);
  }
});
