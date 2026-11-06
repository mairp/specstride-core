/**
 * T071 and T072 — the retirement of 2026-09-30 (second pass, item C8), as a
 * check in the build rather than as a sentence in a report.
 *
 * T071: *the test CT-111-152 and the two types `critic.passed_over` and
 * `critic.diversity` are gone with F111-FR-052; the id is retired, never
 * reused.*
 * T072: *see T071; the facts ride `critic.selected` and `critic.call`
 * (F111-FR-011).*
 *
 * A retirement is a claim about ABSENCE, and an absence is the one thing a
 * reader cannot see by reading. So it is recorded as data in
 * `src/catalogue/retired.ts` and checked five ways here:
 *
 *   1. neither type is a row of the catalogue, neither has a `data` schema, and
 *      the writer's own gate refuses an event of either with the reason
 *      `invalid` (F111-FR-020);
 *   2. the table "Types added on 2026-09-30" of `spec.md` keeps a row for each,
 *      reading `retired`, so the retirement is written where the types would
 *      have been;
 *   3. feature 144's projection table holds no row for either — read from
 *      `specs/144-compatibility-projection/contracts/projection-table.tsv`,
 *      which this feature does not own and does not write;
 *   4. the ids are NEVER REUSED: no test of this repository is named CT-111-152,
 *      and no requirement bullet of `spec.md` is F111-FR-052. The titles of
 *      every `*.test.*` file of the repository are read to say so;
 *   5. the facts RIDE the two types that stayed: `critic.selected` and
 *      `critic.call` both carry `diversity` and `sameModelWarning`
 *      (F111-FR-011), so nothing was lost with the retired types.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOGUE_BY_TYPE, dataSchemaForType, typeIsWritable } from "../src/catalogue/index.ts";
import { REFINEMENT_BY_TYPE, refinedDataSchemaOf } from "../src/catalogue/types/index.ts";
import {
  NEVER_REUSED,
  RETIRED_EVENT_TYPES,
  RETIRED_ON,
  RETIRED_REQUIREMENT_IDS,
  RETIRED_SECOND_PASS_ITEM,
  RETIRED_TASK_IDS,
  RETIRED_TEST_IDS,
  RETIRED_TYPE_NAMES,
  retirementFindings,
} from "../src/catalogue/retired.ts";
import { DROP_REASON_INVALID, validateBeforeWrite } from "../src/writer/validate.ts";
import {
  hasNoProjectionRow,
  readAddedTypesTable,
  readProjectionTable,
} from "./support/spec-tables.ts";

const ROOT = dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
const SPEC_FILE = join(ROOT, "specs/111-event-schema-and-projection/spec.md");
const TASKS_FILE = join(ROOT, "specs/111-event-schema-and-projection/tasks.md");
const PROJECTION_TABLE = join(
  ROOT,
  "specs/144-compatibility-projection/contracts/projection-table.tsv",
);

/** Every `*.test.*` file of the repository, outside `node_modules`. */
function testFiles(from: string, found: string[] = []): string[] {
  for (const name of readdirSync(from)) {
    if (name === "node_modules" || name === ".git" || name.startsWith(".")) continue;
    const path = join(from, name);
    if (statSync(path).isDirectory()) {
      testFiles(path, found);
      continue;
    }
    if (/\.test\.[cm]?[jt]s$/.test(name)) found.push(path);
  }
  return found;
}

/** The title of every case of a test file: `test("<title>"` and `test(\`<title>\``. */
function testTitles(file: string): readonly string[] {
  const text = readFileSync(file, "utf8");
  return Object.freeze(
    [...text.matchAll(/\btest\(\s*(["'`])((?:\\.|(?!\1).)*)\1/g)].map((hit) => hit[2] as string),
  );
}

/* ------------------------------------------------------------------ *
 * 1. The two types are gone.
 * ------------------------------------------------------------------ */

test("T071: `critic.passed_over` and `critic.diversity` are no types of the catalogue", () => {
  assert.deepEqual([...RETIRED_TYPE_NAMES], ["critic.passed_over", "critic.diversity"]);
  assert.equal(RETIRED_ON, "2026-09-30");
  assert.equal(RETIRED_SECOND_PASS_ITEM, "C8");
  for (const type of RETIRED_TYPE_NAMES) {
    assert.equal(CATALOGUE_BY_TYPE.has(type), false, `${type} is no row of the catalogue`);
    assert.equal(dataSchemaForType(type), undefined, `${type} has no data schema`);
    assert.equal(refinedDataSchemaOf(type), undefined, `${type} has no refined data schema`);
    assert.equal(REFINEMENT_BY_TYPE.has(type), false, `${type} has no refinement`);
    assert.equal(typeIsWritable(type), false, `${type} is not a writable type`);
    // The writer's own gate: an event of a retired type is not written and is
    // counted with the reason `invalid` (F111-FR-020).
    const verdict = validateBeforeWrite({ type, data: {} });
    assert.equal(verdict.admitted, false, `${type} is refused`);
    assert.ok(!verdict.admitted);
    assert.equal(verdict.reason, DROP_REASON_INVALID);
  }
  // And nothing drifted: the record of the retirement agrees with the data.
  assert.deepEqual([...retirementFindings()], []);
});

test("T071: the record of the retirement is a check — a type that came back is a finding", () => {
  // Negative control: the same check over a catalogue that holds the type.
  const resurrected = [
    {
      type: "critic.passed_over",
      kind: "instant" as const,
      partner: "",
      dataFields: ["reason"],
      freeTextFields: [],
    },
  ];
  assert.deepEqual(
    [...retirementFindings(resurrected)],
    [
      "critic.passed_over: the type was retired on 2026-09-30 (second pass, item C8) and is " +
        "a row of the catalogue again; a retired id is never reused",
    ],
  );
  assert.equal(NEVER_REUSED, true);
});

/* ------------------------------------------------------------------ *
 * 2. The table of `spec.md` keeps the two rows, reading `retired`.
 * ------------------------------------------------------------------ */

test('T071: the table "Types added on 2026-09-30" keeps a retired row for each', () => {
  if (!existsSync(SPEC_FILE)) {
    assert.ok(true, `skip: ${SPEC_FILE} is not in this checkout`);
    return;
  }
  const table = readAddedTypesTable(readFileSync(SPEC_FILE, "utf8"));
  for (const type of RETIRED_TYPE_NAMES) {
    const row = table.find((candidate) => candidate.type === type);
    assert.ok(row !== undefined, `${type} keeps a row of the table`);
    assert.equal(row.retired, true, `${type} reads \`retired\` where its fields would be`);
    assert.deepEqual([...row.fields], [], `${type} names no field`);
  }
  // Fourteen types were added and two rows record a retirement, so the table
  // holds sixteen rows of a type.
  assert.equal(table.filter((row) => !row.retired).length, 14, "fourteen types were added");
  assert.equal(table.filter((row) => row.retired).length, 2, "two rows record a retirement");
});

/* ------------------------------------------------------------------ *
 * 3. Feature 144 projects neither.
 * ------------------------------------------------------------------ */

test("T071: feature 144's projection table holds no row for either retired type", () => {
  if (!existsSync(PROJECTION_TABLE)) {
    assert.ok(true, `skip: ${PROJECTION_TABLE} is not in this checkout`);
    return;
  }
  const rows = readProjectionTable(readFileSync(PROJECTION_TABLE, "utf8"));
  for (const type of RETIRED_TYPE_NAMES) {
    assert.equal(hasNoProjectionRow(rows, type), true, `144 holds no row for ${type}`);
  }
  // The control: a type that IS in the table is found, so the absence above is
  // an absence and not a broken reader.
  assert.equal(hasNoProjectionRow(rows, "critic.selected"), false, "critic.selected has a row");
});

/* ------------------------------------------------------------------ *
 * 4. The ids are retired, never reused.
 * ------------------------------------------------------------------ */

test("T071: the retired test id names no test of the repository", () => {
  assert.deepEqual([...RETIRED_TEST_IDS], ["CT-111-152"]);
  const files = testFiles(join(ROOT, "packages")).concat(testFiles(join(ROOT, "tests")));
  assert.ok(files.length > 20, `${files.length} test files were read`);
  const titles = files.flatMap((file) => testTitles(file).map((title) => ({ file, title })));
  assert.ok(titles.length > 200, `${titles.length} test titles were read`);
  for (const id of RETIRED_TEST_IDS) {
    const used = titles.filter((named) => named.title.includes(id));
    assert.deepEqual(used, [], `${id} is retired and names no test`);
  }
  // The reader works: the ids that are NOT retired do name tests.
  for (const id of ["CT-111-150", "CT-111-151", "CT-111-101"]) {
    assert.ok(
      titles.some((named) => named.title.includes(id)),
      `${id} names at least one test, so the reader reads titles`,
    );
  }
});

test("T071: F111-FR-052 is a requirement of nothing — no bullet, no task", () => {
  assert.deepEqual([...RETIRED_REQUIREMENT_IDS], ["F111-FR-052"]);
  if (!existsSync(SPEC_FILE) || !existsSync(TASKS_FILE)) {
    assert.ok(true, "skip: the specs tree is not in this checkout");
    return;
  }
  const specification = readFileSync(SPEC_FILE, "utf8");
  for (const id of RETIRED_REQUIREMENT_IDS) {
    // A requirement of `spec.md` is a bullet `- **<id>**: …`. The retired id
    // may be NAMED in the notes of the retirement; it is a requirement of
    // nothing.
    assert.equal(
      specification.includes(`- **${id}**:`),
      false,
      `${id} is no requirement bullet of spec.md`,
    );
    assert.ok(specification.includes(id), `${id} is named in the record of its retirement`);
  }
  // And no task claims it: `covers:` and `proves:` of `tasks.md`.
  const claimed = readFileSync(TASKS_FILE, "utf8")
    .split("\n")
    .filter((line) => /^\s*-\s*(covers|proves|measures):/.test(line));
  assert.ok(claimed.length > 30, `${claimed.length} coverage lines were read`);
  for (const id of RETIRED_REQUIREMENT_IDS) {
    assert.deepEqual(
      claimed.filter((line) => line.includes(id)),
      [],
      `${id} is claimed by no task`,
    );
  }
  assert.ok(
    claimed.some((line) => line.includes("F111-FR-050")),
    "the reader reads coverage lines: F111-FR-050 is claimed",
  );
  // The two task ids themselves are retired and carry no deliverable.
  assert.deepEqual([...RETIRED_TASK_IDS], ["T071", "T072"]);
});

/* ------------------------------------------------------------------ *
 * 5. The facts ride `critic.selected` and `critic.call`.
 * ------------------------------------------------------------------ */

test("T072: the facts ride `critic.selected` and `critic.call` (F111-FR-011)", () => {
  for (const record of RETIRED_EVENT_TYPES) {
    assert.ok(record.ridesOn.length > 0, `${record.type} says where its facts went`);
    for (const carrier of record.ridesOn) {
      const entry = CATALOGUE_BY_TYPE.get(carrier);
      assert.ok(entry !== undefined, `${carrier} is a row of the catalogue`);
      assert.ok(refinedDataSchemaOf(carrier) !== undefined, `${carrier} has a data schema`);
    }
  }
  // `critic.diversity` carried the warning; it rides both types, in `diversity`
  // and `sameModelWarning` (F111-FR-011, research D-15).
  for (const carrier of ["critic.selected", "critic.call"]) {
    const entry = CATALOGUE_BY_TYPE.get(carrier);
    assert.ok(entry !== undefined);
    assert.ok(entry.dataFields.includes("diversity"), `${carrier} carries \`diversity\``);
    assert.ok(
      entry.dataFields.includes("sameModelWarning"),
      `${carrier} carries \`sameModelWarning\``,
    );
    const schema = refinedDataSchemaOf(carrier);
    assert.ok(schema !== undefined);
    assert.ok(Array.isArray(schema.properties.diversity?.enum), `${carrier}.diversity is a set`);
  }
  // `critic.passed_over` carried the pass-over reasons of an automatic pick;
  // they stay on the announcement line and in `criticPick` of the resolved
  // registry (feature 124), so they ride `critic.selected` here.
  const passedOver = RETIRED_EVENT_TYPES.find((record) => record.type === "critic.passed_over");
  assert.ok(passedOver !== undefined);
  assert.deepEqual([...passedOver.ridesOn], ["critic.selected"]);
  const diversity = RETIRED_EVENT_TYPES.find((record) => record.type === "critic.diversity");
  assert.ok(diversity !== undefined);
  assert.deepEqual([...diversity.ridesOn], ["critic.selected", "critic.call"]);
});
