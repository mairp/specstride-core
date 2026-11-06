/**
 * T004 — the fixture scenarios feature 138 needs, held against the catalogue
 * of feature 141 (`specs/141-parity-oracle/contracts/fixture-catalogue.json`).
 *
 * The rule is feature 141, §O.1 rule 4: a feature may add a scenario to a
 * family, inside the scope the catalogue states for it, with the stub verbs
 * of §O.3 and the surfaces of §O.4 only. This feature needs none beyond the
 * catalogue: every scenario the tasks of `tasks.md` cite is registered there
 * already, so nothing is added, and no family, stub verb, surface,
 * normalization rule or waiver is added by this feature (§O.1 rule 5). The
 * need that is not in the catalogue would be reported, not invented; the
 * check below fails if a cited scenario is missing, so a need cannot be
 * silently assumed.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import catalogue from "../../../../vendor/specs/141-parity-oracle/contracts/fixture-catalogue.json" with { type: "json" };

type Scenario = {
  name: string;
  pattern?: boolean;
  scenarioOf?: string;
  testOf?: string;
  members?: string[];
};

type Family = { id: string; scenarios: Scenario[]; features?: string[] };

const families = catalogue.families as Family[];

function family(id: string): Family {
  const hit = families.find((f) => f.id === id);
  assert.ok(hit, `family ${id} is not in the catalogue of feature 141`);
  return hit;
}

function scenario(familyId: string, name: string): Scenario {
  const hit = family(familyId).scenarios.find((s) => s.name === name);
  assert.ok(hit, `scenario ${familyId}/${name} is not registered in the catalogue of feature 141`);
  return hit;
}

/** Every scenario the tasks of this feature cite (tasks.md, phases 3 to 9). */
const CITED: [string, string][] = [
  ["FX-01", "harness-prime"],
  ["FX-01", "harness-prime-variant"],
  ["FX-06", "prime-critic-error"],
  ["FX-07", "prime-empty-variant"],
  ["FX-18", "harness-missing-prime"],
  ["FX-18", "harness-missing-prime-launcher"],
  ["FX-18", "prime-variant-with-model"],
  ["FX-18", "prime-empty-variant"],
];

test("T004: every scenario this feature cites is registered in the catalogue", () => {
  for (const [familyId, name] of CITED) scenario(familyId, name);
});

test("T004: every cited family covers this feature and lists it", () => {
  for (const id of new Set(CITED.map(([f]) => f))) {
    assert.ok(
      family(id).features?.includes("138"),
      `family ${id} does not list feature 138 as covered`,
    );
  }
});

test("T004: FX-26/prime-v3-<name> is a pattern whose members are the ten as-is streams", () => {
  const prime = scenario("FX-26", "prime-v3-<name>");
  assert.equal(prime.pattern, true);
  const members = prime.members ?? [];
  assert.equal(members.length, 10);
  const asis = readdirSync(new URL("../../tests/fixtures/streams/asis/", import.meta.url))
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => `prime-v3-${f.replace(/\.jsonl$/, "")}`)
    .sort();
  assert.deepEqual([...members].sort(), asis);
});

test("T004: this feature adds no family, verb, surface or waiver of its own", () => {
  const owned = [];
  for (const f of families) {
    for (const s of f.scenarios) {
      if (s.scenarioOf === "138") owned.push(`${f.id}/${s.name}`);
    }
  }
  // Feature 138 adds nothing: the one scenario that tests a behaviour of this
  // feature, `FX-18/prime-empty-variant`, is feature 141's own registration
  // (the proposer side of `FX-07/prime-empty-variant`), pointed at this
  // feature's tests with `testOf`.
  assert.deepEqual(owned, []);
  assert.equal(scenario("FX-18", "prime-empty-variant").scenarioOf, "141");
  assert.equal(scenario("FX-18", "prime-empty-variant").testOf, "138");
});
