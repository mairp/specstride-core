/**
 * T017 — CT-141-113: the catalogue of fixture families (F141-FR-013).
 *
 * The subject is `packages/oracle/src/catalogue/catalogue.ts` over the data of
 * `packages/oracle/data/fixture-catalogue.json`:
 *
 * - forty ids, thirty-nine active;
 * - the ids are STABLE: the list is read back off disk and compared with the
 *   forty ids this test writes down, so a renamed or reused id fails here;
 * - FX-37 is retired and a citation of it is refused;
 * - every active family states what it exercises, its reference and entry point,
 *   its stubs, its surfaces and the features it covers;
 * - every scenario of FX-06, FX-07 and FX-17 to FX-20 for which the catalogue
 *   states an end on the reference states all five parts of it: the entry point,
 *   the end, the stop reason, the evidence line of the baseline, and whether the
 *   end is known by `run` or by `read`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ACTIVE_FAMILY_COUNT,
  CatalogueError,
  FAMILIES_WITH_AN_END_ON_THE_REFERENCE,
  FAMILY_COUNT,
  OWNING_FEATURE,
  RETIRED_FAMILIES,
  activeFamilyIds,
  assertFamilyMayBeCited,
  catalogueRegister,
  citationHoldsUp,
  duplicateScenarioNames,
  endOnReferenceOf,
  families,
  familyIds,
  familyStatus,
  membersOf,
  resolveCitation,
  retiredFamilyIds,
  scenarioNamesOf,
  scenarioOf,
  scenarioOwnerOf,
  scenariosAddedBy,
  scopeOf,
  stubsOf,
  surfacesOf,
  variantsOf,
} from "../../src/catalogue/catalogue.ts";

const PACKAGE = resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));

/**
 * The forty ids of `spec.md` §O.2, written out. An id is never reused and never
 * renamed (F141-FR-013), so this list is a fixed record: a change to the data
 * file that renames or drops an id fails this assertion, and a new family must
 * continue the numbering and be added here on purpose.
 */
const THE_FORTY_IDS = [
  "FX-01",
  "FX-02",
  "FX-03",
  "FX-04",
  "FX-05",
  "FX-06",
  "FX-07",
  "FX-08",
  "FX-09",
  "FX-10",
  "FX-11",
  "FX-12",
  "FX-13",
  "FX-14",
  "FX-15",
  "FX-16",
  "FX-17",
  "FX-18",
  "FX-19",
  "FX-20",
  "FX-21",
  "FX-22",
  "FX-23",
  "FX-24",
  "FX-25",
  "FX-26",
  "FX-27",
  "FX-28",
  "FX-29",
  "FX-30",
  "FX-31",
  "FX-32",
  "FX-33",
  "FX-34",
  "FX-35",
  "FX-36",
  "FX-37",
  "FX-38",
  "FX-39",
  "FX-40",
] as const;

test("CT-141-113: forty ids, thirty-nine active, and the ids are stable", () => {
  assert.equal(FAMILY_COUNT, 40);
  assert.equal(ACTIVE_FAMILY_COUNT, 39);
  assert.deepEqual([...familyIds()], [...THE_FORTY_IDS], "the forty ids of §O.2, in order");
  assert.equal(familyIds().length, FAMILY_COUNT);
  assert.equal(activeFamilyIds().length, ACTIVE_FAMILY_COUNT);
  assert.deepEqual([...retiredFamilyIds()], [...RETIRED_FAMILIES]);

  // Read independently of the module: the ids of the data file on disk.
  const onDisk = JSON.parse(
    readFileSync(join(PACKAGE, "data", "fixture-catalogue.json"), "utf8"),
  ) as { families: { id: string; status: string }[] };
  assert.deepEqual(
    onDisk.families.map((f) => f.id),
    [...THE_FORTY_IDS],
    "the ids on disk are the forty ids",
  );
  assert.equal(onDisk.families.filter((f) => f.status === "active").length, ACTIVE_FAMILY_COUNT);
  // Every id has the shape `FX-nn` and no id occurs twice.
  assert.equal(new Set(familyIds()).size, FAMILY_COUNT, "no id occurs twice");
  for (const id of familyIds()) assert.match(id, /^FX-[0-9]{2}$/);
});

test("CT-141-113: FX-37 is retired, has no scenario, and a test that cites it is refused", () => {
  assert.equal(familyStatus("FX-37"), "retired");
  assert.deepEqual([...scenarioNamesOf("FX-37")], [], "a retired family has no scenario");
  assert.deepEqual([...stubsOf("FX-37")], []);
  assert.deepEqual([...surfacesOf("FX-37")], []);

  assert.throws(() => assertFamilyMayBeCited("FX-37"), /FX-37 is retired/);
  assert.throws(() => resolveCitation("FX-37"), CatalogueError);
  assert.throws(() => resolveCitation("FX-37"), /is retired/);
  assert.equal(citationHoldsUp("FX-37"), false);
  // It keeps its id: it is still in the catalogue, and still at its place.
  assert.ok(familyIds().includes("FX-37"));
  assert.equal(familyIds().indexOf("FX-37"), 36);
});

test("CT-141-113: a family outside the catalogue is refused, an active one is accepted", () => {
  for (const outside of ["FX-00", "FX-41", "FX-99", "FX-1", "fx-01", "FX-01x"]) {
    assert.equal(citationHoldsUp(outside), false, `${outside} is no family of the catalogue`);
  }
  for (const id of activeFamilyIds()) {
    const resolved = resolveCitation(id);
    assert.equal(resolved.familyId, id);
    assert.ok(resolved.scenarios.length > 0, `${id} has at least one scenario`);
  }
});

test("CT-141-113: every active family has scope, reference, stubs, surfaces and features", () => {
  const knownSurfaces = new Set(
    (
      JSON.parse(readFileSync(join(PACKAGE, "data", "surfaces.json"), "utf8")) as {
        surfaces: { name: string }[];
        transcriptRoles: string[];
      }
    ).surfaces.map((s) => s.name),
  );
  for (const id of activeFamilyIds()) {
    assert.ok(scopeOf(id).length > 0, `${id} states what it exercises`);
    const row = families().find((f) => f.id === id);
    assert.ok(row !== undefined);
    assert.ok(row.reference.length > 0, `${id} names its reference and entry point`);
    assert.ok(
      row.system === "specstride" || row.system === "mixture-of-loops",
      `${id} names one of the two reference systems, not ${row.system}`,
    );
    assert.ok(row.name.length > 0, `${id} has a name`);
    assert.ok(surfacesOf(id).length > 0, `${id} names the surfaces it compares`);
    for (const surface of surfacesOf(id)) {
      assert.ok(knownSurfaces.has(surface), `${id}: ${surface} is a surface of §O.4`);
    }
    assert.ok(row.features.length > 0, `${id} names the features it covers`);
    for (const feature of row.features) assert.match(feature, /^[0-9]{3}$/);
    // Stubs: a family may legitimately drive none (FX-09, FX-10, FX-28 …), but
    // where it names one, the name must be a stub of §O.3.
    const vocabulary = JSON.parse(
      readFileSync(join(PACKAGE, "data", "stub-vocabulary.json"), "utf8"),
    ) as { kinds: Record<string, unknown>; harnessStubs: { harness: string }[] };
    const stubNames = new Set([
      ...Object.keys(vocabulary.kinds),
      ...vocabulary.harnessStubs.map((h) => h.harness),
    ]);
    for (const stub of stubsOf(id)) {
      assert.ok(stubNames.has(stub), `${id}: ${stub} is a stub of §O.3`);
    }
    assert.ok(scenarioNamesOf(id).length > 0, `${id} has at least one scenario`);
  }
});

test("CT-141-113: only FX-35 and FX-36 have variants, and a citation may name one", () => {
  const withVariants = activeFamilyIds().filter((id) => variantsOf(id).length > 0);
  assert.deepEqual(withVariants, ["FX-35", "FX-36"]);
  for (const id of withVariants) {
    assert.deepEqual([...variantsOf(id)], ["@engine-stub", "@full-stack"]);
    const first = scenarioNamesOf(id)[0] as string;
    const resolved = resolveCitation(`${id}/${first}@engine-stub`);
    assert.equal(resolved.variant, "@engine-stub");
    assert.equal(resolveCitation(`${id}/${first}@full-stack`).variant, "@full-stack");
  }
  // A family without variants refuses one.
  assert.throws(() => resolveCitation("FX-01/three-phases@engine-stub"), /has no variant/);
});

test("CT-141-113: every stated end on the reference has all five of its parts", () => {
  let counted = 0;
  for (const id of FAMILIES_WITH_AN_END_ON_THE_REFERENCE) {
    assert.equal(familyStatus(id), "active", `${id} is an active family`);
    for (const name of scenarioNamesOf(id)) {
      const end = endOnReferenceOf(id, name);
      if (end === undefined) continue;
      counted += 1;
      const where = `${id}/${name}`;
      assert.ok(end.entryPoint.length > 0, `${where}: an entry point`);
      assert.ok(end.end.length > 0, `${where}: how the driven command ends`);
      assert.ok(end.stopReason.length > 0, `${where}: a stop reason`);
      assert.ok(end.evidence.length > 0, `${where}: the evidence line of the baseline`);
      assert.ok(
        end.knownBy === "run" || end.knownBy === "read",
        `${where}: known by \`run\` or \`read\`, not ${end.knownBy}`,
      );
      // The evidence names a module or a script of the baseline and a line.
      assert.match(end.evidence, /line/i, `${where}: the evidence names a line`);
    }
  }
  // §O.2 states ends for every scenario of FX-06 and FX-07 of the first set, for
  // FX-17 and FX-18, and for the two breaker scenarios of FX-19 and FX-20.
  assert.ok(counted >= 34, `the catalogue states ${counted} ends; §O.2 states 34 or more`);
  assert.equal(
    counted,
    families()
      .flatMap((f) => f.scenarios)
      .filter((s) => s.endOnReference !== undefined).length,
    "every stated end belongs to one of the six families F141-FR-013 names",
  );
});

test("CT-141-113: the catalogue is the register of scenario names", () => {
  assert.deepEqual([...duplicateScenarioNames()], [], "two scenarios of one family share no name");
  // A pattern name resolves, and so does each of its members.
  const members = membersOf("FX-22", "predicate-<kind>");
  assert.ok(members.length >= 6, "the pattern of FX-22 has its six members");
  for (const member of members) {
    const entry = scenarioOf("FX-22", member);
    assert.ok(entry !== undefined, `${member} resolves through its pattern`);
    assert.equal(entry.name, "predicate-<kind>");
  }
  // A citation of the pattern stands for all its members (§O.6).
  const resolved = resolveCitation("FX-22/predicate-<kind>");
  assert.deepEqual([...resolved.scenarios], [...members]);
  // A scenario the catalogue does not hold is refused.
  assert.throws(() => resolveCitation("FX-01/not-a-scenario"), /has no scenario/);
});

test("CT-141-113: every scenario names the feature that writes and keeps it", () => {
  let ofThisFeature = 0;
  let ofOtherFeatures = 0;
  for (const row of catalogueRegister()) {
    for (const scenario of row.scenarios) {
      assert.match(
        scenario.scenarioOf,
        /^[0-9]{3}$/,
        `${row.familyId}/${scenario.name}: a three-digit feature number`,
      );
      assert.equal(scenarioOwnerOf(row.familyId, scenario.name), scenario.scenarioOf);
      if (scenario.scenarioOf === OWNING_FEATURE) ofThisFeature += 1;
      else ofOtherFeatures += 1;
    }
  }
  assert.ok(ofThisFeature > 0, "this feature delivers the first set");
  assert.ok(ofOtherFeatures > 0, "other features added scenarios inside the scope of a family");
  // The scenarios of feature 106 and 107 that §O.2 registers are there, under
  // the names those features gave them.
  for (const [feature, expected] of [
    [
      "106",
      [
        "106-learning-suggest",
        "106-learning-apply",
        "106-learning-tampered",
        "106-apply-forced",
        "106-learning-exported",
      ],
    ],
    ["107", ["107-plan-with-other-fence", "107-promote-unreadable"]],
  ] as const) {
    const added = scenariosAddedBy(feature).map((s) => s.name);
    for (const name of expected) {
      assert.ok(added.includes(name), `feature ${feature} owns the scenario ${name}`);
    }
  }
});
