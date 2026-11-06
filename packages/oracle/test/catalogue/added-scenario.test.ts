/**
 * T020 — CT-141-130: a scenario that a feature adds (F141-FR-030).
 *
 * The subject is `assertAddedScenarioIsAccepted` of
 * `packages/oracle/src/catalogue/catalogue.ts`:
 *
 * - a scenario inside the scope of the family, with known verbs and known
 *   surfaces, is **accepted**;
 * - a scenario with an unknown verb, an unknown stub, a surface outside §O.4 or
 *   outside the surfaces of the family, or on a family the catalogue does not
 *   hold or has retired, is **refused**;
 * - scenario **names are unique** inside a family, members of a pattern
 *   included: the catalogue is the register of scenario names;
 * - a scenario the catalogue **holds** carries the name it has there and the
 *   feature the catalogue gives it as owner;
 * - a scenario the catalogue **does not hold** carries the number of the feature
 *   in its name.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  CatalogueError,
  type AddedScenario,
  assertAddedScenarioIsAccepted,
  duplicateScenarioNames,
  families,
  membersOf,
  scenarioNamesOf,
  scenarioOf,
  scenarioOwnerOf,
  scenariosAddedBy,
  scenariosAddedByOtherFeatures,
  scopeOf,
  stubNames,
  surfacesOf,
  verbsOfStub,
} from "../../src/catalogue/catalogue.ts";

test("CT-141-130: a scenario inside the scope, with known verbs and surfaces, is accepted", () => {
  const added: AddedScenario = {
    familyId: "FX-01",
    name: "109-core-loop-extra",
    addedBy: "109",
    stubsAndVerbs: { proposer: ["write", "evidence"], "critic-http": ["approve"] },
    surfaces: ["exit", "stdout", "state", "transcript"],
  };
  assert.doesNotThrow(() => assertAddedScenarioIsAccepted(added));
  // The scope of the family is stated, which is what "inside the scope" means.
  assert.ok(scopeOf("FX-01").length > 0);
  // A harness stub may be named instead of a kind: its verbs are the union of
  // the verbs of its roles.
  assert.doesNotThrow(() =>
    assertAddedScenarioIsAccepted({
      familyId: "FX-01",
      name: "109-harness-extra",
      addedBy: "109",
      stubsAndVerbs: { dsh: ["text", "approve"] },
      surfaces: ["exit"],
    }),
  );
});

test("CT-141-130: an unknown verb or an unknown stub refuses the scenario", () => {
  for (const [stub, verb] of [
    ["proposer", "teleport"],
    ["proposer", "approve"],
    ["critic-http", "write"],
    ["engine", "install"],
    ["telemetry-sink", "approve"],
  ] as const) {
    assert.throws(
      () =>
        assertAddedScenarioIsAccepted({
          familyId: "FX-01",
          name: "109-x",
          addedBy: "109",
          stubsAndVerbs: { [stub]: [verb] },
        }),
      new RegExp(`${verb} is no verb of ${stub}`),
      `${stub}/${verb}`,
    );
  }
  assert.throws(
    () =>
      assertAddedScenarioIsAccepted({
        familyId: "FX-01",
        name: "109-x",
        addedBy: "109",
        stubsAndVerbs: { oracle: ["approve"] },
      }),
    /oracle is no stub of §O.3/,
  );
  // Every stub of §O.3 has a non-empty verb list, and each of its verbs is
  // accepted for it.
  for (const stub of stubNames()) {
    const verbs = verbsOfStub(stub);
    assert.ok(verbs !== undefined && verbs.length > 0, stub);
    assert.doesNotThrow(
      () =>
        assertAddedScenarioIsAccepted({
          familyId: "FX-01",
          name: "109-x",
          addedBy: "109",
          stubsAndVerbs: { [stub]: [...verbs] },
        }),
      stub,
    );
  }
});

test("CT-141-130: a surface outside §O.4 or outside the family refuses the scenario", () => {
  assert.throws(
    () =>
      assertAddedScenarioIsAccepted({
        familyId: "FX-01",
        name: "109-x",
        addedBy: "109",
        surfaces: ["moonlight"],
      }),
    /moonlight is no surface of §O\.4/,
  );
  // `telemetry` is S-10 of §O.4 and no surface of FX-01.
  assert.ok(!surfacesOf("FX-01").includes("telemetry"));
  assert.throws(
    () =>
      assertAddedScenarioIsAccepted({
        familyId: "FX-01",
        name: "109-x",
        addedBy: "109",
        surfaces: ["exit", "telemetry"],
      }),
    /the surface telemetry is outside the surfaces of FX-01/,
  );
  // On the family that does compare it, the same surface is accepted.
  assert.doesNotThrow(() =>
    assertAddedScenarioIsAccepted({
      familyId: "FX-31",
      name: "128-x",
      addedBy: "128",
      surfaces: ["exit", "telemetry"],
    }),
  );
});

test("CT-141-130: a family outside the catalogue or retired refuses the scenario", () => {
  for (const familyId of ["FX-00", "FX-41", "FX-99"]) {
    assert.throws(
      () => assertAddedScenarioIsAccepted({ familyId, name: "109-x", addedBy: "109" }),
      /is no family of the catalogue/,
      familyId,
    );
  }
  assert.throws(
    () => assertAddedScenarioIsAccepted({ familyId: "FX-37", name: "109-x", addedBy: "109" }),
    /FX-37 is retired/,
  );
  // The feature number is a feature number.
  for (const addedBy of ["9", "0109", "abc", ""]) {
    assert.throws(
      () => assertAddedScenarioIsAccepted({ familyId: "FX-01", name: "x", addedBy }),
      /is no feature number/,
      addedBy,
    );
  }
});

test("CT-141-130: scenario names are unique inside a family, members included", () => {
  assert.deepEqual([...duplicateScenarioNames()], []);
  for (const family of families()) {
    const names = scenarioNamesOf(family.id);
    assert.equal(
      new Set(names).size,
      names.length,
      `${family.id}: ${names.length} names, all different`,
    );
  }
  // A pattern and its members live in the same namespace, so a feature cannot
  // add a scenario under the name of a member.
  const members = membersOf("FX-22", "predicate-<kind>");
  assert.ok(members.length > 0);
  for (const member of members) {
    assert.ok(scenarioNamesOf("FX-22").includes(member), member);
    // The catalogue holds it, under the pattern of feature 141; a feature that
    // claimed it would be told whose it is.
    assert.throws(
      () => assertAddedScenarioIsAccepted({ familyId: "FX-22", name: member, addedBy: "118" }),
      /the catalogue gives this scenario to feature 141, not to 118/,
      member,
    );
  }
});

test("CT-141-130: a scenario the catalogue holds has the name it has there and its owner", () => {
  // Every scenario another feature added is accepted under its catalogue name
  // and its catalogue owner, and refused under any other owner.
  const added = scenariosAddedByOtherFeatures();
  assert.ok(added.length > 0, `${added.length} scenarios of other features`);
  for (const scenario of added) {
    if (scenario.pattern) continue;
    const accepted = assertAddedScenarioIsAccepted({
      familyId: scenario.familyId,
      name: scenario.name,
      addedBy: scenario.scenarioOf,
    });
    assert.equal(
      (accepted as { name: string }).name,
      scenario.name,
      "the name the catalogue has stands",
    );
    assert.equal(scenarioOwnerOf(scenario.familyId, scenario.name), scenario.scenarioOf);
    const other = scenario.scenarioOf === "109" ? "130" : "109";
    assert.throws(
      () =>
        assertAddedScenarioIsAccepted({
          familyId: scenario.familyId,
          name: scenario.name,
          addedBy: other,
        }),
      new RegExp(`gives this scenario to feature ${scenario.scenarioOf}, not to ${other}`),
      `${scenario.familyId}/${scenario.name}`,
    );
  }
  // The scenarios feature 106 and 107 registered keep the names those features
  // gave them (§O.2, "Scenarios added after the first set").
  for (const [feature, name, familyId] of [
    ["106", "106-learning-suggest", "FX-01"],
    ["106", "106-apply-forced", "FX-29"],
    ["107", "107-plan-with-other-fence", "FX-32"],
    ["109", "root-sandbox-assertion", "FX-26"],
    ["131", "codex-model-named", "FX-01"],
    ["123", "relaunch-budget-<n>", "FX-36"],
  ] as const) {
    const entry = scenarioOf(familyId, name);
    assert.ok(entry !== undefined, `${familyId}/${name}`);
    assert.equal(entry.scenarioOf, feature, `${familyId}/${name} belongs to ${feature}`);
    assert.ok(
      scenariosAddedBy(feature).some((s) => s.name === name && s.familyId === familyId),
      `${feature} owns ${familyId}/${name}`,
    );
  }
});

test("CT-141-130: a scenario the catalogue does not hold carries the number of the feature", () => {
  // Feature 103 reserved the names `103-<name>` for FX-17 to FX-20 and FX-24 and
  // has not written them yet: such a name is accepted because it carries the
  // number of the feature.
  assert.equal(scenarioOf("FX-17", "103-usage-text"), undefined, "the catalogue does not hold it");
  assert.doesNotThrow(() =>
    assertAddedScenarioIsAccepted({
      familyId: "FX-17",
      name: "103-usage-text",
      addedBy: "103",
      stubsAndVerbs: { proposer: ["text", "nothing"] },
      surfaces: ["exit", "stdout"],
    }),
  );
  // The same name without the number of the feature is refused, and the refusal
  // says what the name would have to be.
  assert.throws(
    () =>
      assertAddedScenarioIsAccepted({
        familyId: "FX-17",
        name: "usage-text",
        addedBy: "103",
      }),
    (error: unknown) => {
      assert.ok(error instanceof CatalogueError);
      assert.match((error as Error).message, /the catalogue does not hold this scenario yet/);
      assert.match((error as Error).message, /103-usage-text/);
      assert.match((error as Error).message, /F141-FR-030/);
      return true;
    },
  );
  // And the number has to be the feature's own.
  assert.throws(
    () =>
      assertAddedScenarioIsAccepted({
        familyId: "FX-17",
        name: "109-usage-text",
        addedBy: "103",
      }),
    /carries the number of the feature: 103-109-usage-text/,
  );
});
