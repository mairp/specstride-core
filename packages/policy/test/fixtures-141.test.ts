/**
 * T004 — the confirmation with feature 141, checked against feature 141's own
 * register.
 *
 * T004 asks this feature to confirm that the stubs and the scenarios of FX-23
 * (`wall-budget`) and FX-18 exist, that the generic stub `stub-harness` can
 * declare a limit signal, and to list the scenarios this feature adds inside
 * those families (F141-FR-030). The confirmation is recorded in
 * `packages/policy/test/fixtures-141.md`.
 *
 * F141-FR-030 makes the fixture catalogue "the register of scenario names: it
 * MUST hold every scenario with the feature that owns it". So the catalogue,
 * not prose, is the authority, and this test reads it: the confirmation is true
 * only while the catalogue still says so.
 *
 * It reads no clock, starts no process and makes no call.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPOSITORY_ROOT = join(PACKAGE_ROOT, "..", "..");
const ORACLE_SPEC = join(REPOSITORY_ROOT, "specs", "141-parity-oracle");

const RECORD_MD = join(PACKAGE_ROOT, "test", "fixtures-141.md");
const record = readFileSync(RECORD_MD, "utf8");

type Scenario = { name: string; pattern: boolean; waiver: unknown; scenarioOf?: string };
type Family = {
  id: string;
  name: string;
  status: string;
  exercises?: string;
  stubs?: string[];
  features?: string[];
  scenarios: Scenario[];
};
type NotScenario = { families: string[]; asked: string; askedBy: string; why: string };

const catalogue = JSON.parse(
  readFileSync(join(ORACLE_SPEC, "contracts", "fixture-catalogue.json"), "utf8"),
) as { families: Family[]; notScenarios: NotScenario[] };

const oracleSpec = readFileSync(join(ORACLE_SPEC, "spec.md"), "utf8");

function family(id: string): Family {
  const found = catalogue.families.find((f) => f.id === id);
  assert.ok(found, `the catalogue of feature 141 holds the family ${id}`);
  return found;
}

test("T004: the record exists", () => {
  assert.ok(existsSync(RECORD_MD), "packages/policy/test/fixtures-141.md exists");
  assert.ok(record.length > 2_000, "the record is more than a stub");
});

test("T004: FX-23 exists and holds the scenario `wall-budget`", () => {
  const fx23 = family("FX-23");

  assert.equal(fx23.name, "Wall-clock budget");
  assert.equal(fx23.status, "active", "FX-23 is active, not retired");
  assert.match(
    fx23.exercises ?? "",
    /wall_budget/,
    "FX-23 exercises the stop reason this feature ports",
  );

  const names = fx23.scenarios.map((s) => s.name);
  assert.ok(names.includes("wall-budget"), "the scenario `wall-budget` exists");

  const scenario = fx23.scenarios.find((s) => s.name === "wall-budget");
  assert.equal(scenario?.scenarioOf, "141", "`wall-budget` is owned by feature 141, not by 127");
  assert.equal(scenario?.waiver, null, "`wall-budget` carries no waiver");
  assert.equal(scenario?.pattern, false, "`wall-budget` is a plain scenario, not a pattern name");

  // The catalogue lists this feature among the features the family covers.
  assert.ok(fx23.features?.includes("127"), "FX-23 names feature 127 among its features");

  // The stubs the family needs are stubs of 141; this feature contributes none.
  assert.deepEqual([...(fx23.stubs ?? [])].sort(), ["critic-http", "proposer"]);

  assert.match(record, /`FX-23`/, "the record names FX-23");
  assert.match(record, /`wall-budget`/, "the record names the scenario");
});

test("T004: FX-18 exists and holds the two scenarios this feature cites", () => {
  const fx18 = family("FX-18");

  assert.equal(fx18.name, "Consecutive errors");
  assert.equal(fx18.status, "active");

  const names = fx18.scenarios.map((s) => s.name);
  for (const needed of ["consecutive-errors-legacy", "consecutive-errors-structured"]) {
    assert.ok(names.includes(needed), `the scenario \`${needed}\` exists`);
    const scenario = fx18.scenarios.find((s) => s.name === needed);
    assert.equal(scenario?.scenarioOf, "141", `\`${needed}\` is owned by feature 141`);
    assert.ok(record.includes(needed), `the record names \`${needed}\``);
  }

  assert.deepEqual([...(fx18.stubs ?? [])].sort(), ["critic-http", "proposer"]);
});

test("T004: the generic stub `stub-harness` exists as a stub name of feature 141", () => {
  // F141-FR-006 fixes the naming of stub executables, `stub-harness` among them.
  assert.match(
    oracleSpec,
    /`stub-harness` for a descriptor-driven harness/,
    "F141-FR-006 of feature 141 names `stub-harness`",
  );
  assert.match(record, /`stub-harness`/, "the record names the generic stub");
});

test("T004: a limit signal by the generic stub is refused as a family scenario, with the reason", () => {
  // The refusal is not prose this feature paraphrased: it is a structured entry
  // of feature 141's own catalogue, asked by 127, against these two families.
  const refusal = catalogue.notScenarios.find((n) => n.askedBy === "127");
  assert.ok(refusal, "the catalogue holds the entry feature 127 asked for");
  assert.deepEqual([...refusal.families].sort(), ["FX-18", "FX-23"]);
  assert.match(refusal.asked, /a limit signal declared by the generic stub/);
  assert.match(refusal.why, /No stub emits a quota signal in a fixture of a family/);
  assert.match(refusal.why, /F141-FR-043/, "the refusal rests on F141-FR-043");
  assert.match(
    refusal.why,
    /In a characterization test the generic stub prints what its script gives it through `text` or `stream`; no verb is needed/,
    "the refusal names the path that is open instead",
  );

  // F141-FR-043 states the owner decision the refusal rests on.
  assert.match(
    oracleSpec,
    /Quota pause: no stub emits a quota signal/,
    "F141-FR-043 states the decision",
  );

  // The record reproduces the reason rather than claiming the scenario exists.
  // The blockquote wraps, so match the two halves rather than one line.
  assert.match(record, /\*\*Refused\*\*/, "the record records the refusal");
  assert.match(
    record,
    /as a scenario of a family: no stub emits a quota signal/,
    "the record gives the reason",
  );
  assert.match(record, /F141-FR-043/, "the record cites the requirement the refusal rests on");
  assert.match(record, /no verb is added/, "the record states that no stub verb is added");
});

test("T004: the list of scenarios this feature adds inside those families is empty", () => {
  // This is the list F141-FR-030 asks for. It is empty, and the catalogue is
  // what proves it: no scenario of either family is owned by 127, and no
  // scenario carries this feature's number in its name, which F141-FR-030
  // requires of a scenario a feature adds before the catalogue holds it.
  for (const id of ["FX-18", "FX-23"]) {
    for (const scenario of family(id).scenarios) {
      assert.equal(
        scenario.scenarioOf,
        "141",
        `${id}/${scenario.name} is owned by 141; feature 127 adds no scenario to ${id}`,
      );
      assert.doesNotMatch(
        scenario.name,
        /(^|-)127(-|$)/,
        `${id}/${scenario.name} does not carry the number of feature 127`,
      );
    }
  }

  // Nor does this feature add a scenario to any other family of the catalogue.
  const ownedBy127 = catalogue.families.flatMap((f) =>
    f.scenarios.filter((s) => s.scenarioOf === "127").map((s) => `${f.id}/${s.name}`),
  );
  assert.deepEqual(ownedBy127, [], "feature 127 owns no scenario in the catalogue");

  assert.match(
    record,
    /\*\*none\*\* \| `wall-budget` already exists/,
    "the record states FX-23 adds none",
  );
  assert.match(
    record,
    /This is the list F141-FR-030 asks for, and it is empty\./,
    "the record gives the empty list as the answer to F141-FR-030",
  );
});

test("T004: FX-22, the other family the parity tests of this feature name, exists", () => {
  // `tests/parity/127/README.md` names FX-22 for the wait on a yield.
  const fx22 = family("FX-22");
  assert.equal(fx22.status, "active");
  assert.ok(record.includes("FX-22"), "the record names FX-22 among what this feature uses");
});
