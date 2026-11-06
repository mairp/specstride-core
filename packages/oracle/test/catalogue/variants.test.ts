/**
 * CT-141-116 — the two variants of FX-35 and FX-36 (T118; F141-FR-016).
 *
 * > "Every scenario of FX-35 and FX-36 MUST run twice: as `@engine-stub`, against
 * > the engine stub, which isolates the launcher, the pipeline runtime and the
 * > supervisor; and as `@full-stack`, against the real engine with agent stubs."
 *
 * What the test proves. Nothing is mocked: every assertion reads the catalogue of
 * `data/fixture-catalogue.json`, the declarations on disk under
 * `packages/oracle/fixtures/FX-35/` and `FX-36/`, and the rule the driver applies
 * to a variant (`engineSystemOf`, `engineTargetOfTheReferenceSide`,
 * `buildStubBin`, `portConfiguration`).
 *
 * - **twice**: every scenario of the two families that this feature owns lies on
 *   disk once per variant, and only those two families have variants at all;
 * - **against the engine stub**: the `@engine-stub` declaration declares the engine
 *   stub as its stub and no agent stub, and row 41 of the `parity` profile is the
 *   only switch through which the oracle names it;
 * - **against the real engine with agent stubs**: the `@full-stack` declaration
 *   declares `engineSystem` — the baseline whose own front door answers the as-is
 *   engine command — and the agent stubs, and the driver refuses it without that
 *   baseline's tree rather than falling back to the stub;
 * - **the same scenario, twice**: the two declarations of one scenario differ in
 *   the variant, the stubs, the environment and the prerequisites, and in NOTHING
 *   else — the steps and the launch contract are byte-identical, which is what
 *   makes `@engine-stub` an isolation of the launcher, the pipeline runtime and the
 *   supervisor rather than a second scenario;
 * - **a store of its own per variant**: a golden capture and a waiver name the
 *   variant (`scenarioNameOf`), so the two runs are never compared with each other.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { ORACLE_ROOT } from "../../src/index.ts";
import {
  families,
  resolveCitation,
  scenarioNamesOf,
  scenarioOwnerOf,
  variantsOf,
} from "../../src/catalogue/catalogue.ts";
import { scenarioNameOf, goldenFile } from "../../src/capture/golden.ts";
import {
  ENGINE_STUB_VARIANT,
  FULL_STACK_VARIANT,
  DriverError,
  engineSystemOf,
  engineTargetOfTheReferenceSide,
  portConfiguration,
  ENGINE_SWITCH_KEY,
  ENGINE_SWITCH_ROW,
} from "../../src/run/driver.ts";
import { engineExecutableName } from "../../stubs/lib/names.ts";

const FIXTURES = join(ORACLE_ROOT, "fixtures");
const WITH_VARIANTS = ["FX-35", "FX-36"] as const;
/** The feature that writes and keeps the first set of scenarios of each family. */
const OWNER = "141";

/** The declaration of one scenario of one variant, or `undefined`. */
function declarationOf(
  family: string,
  name: string,
  variant: string,
): Record<string, unknown> | undefined {
  const file = join(FIXTURES, family, `${name}${variant}`, "fixture.json");
  if (!existsSync(file)) return undefined;
  return JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
}

/**
 * The FIRST SET of scenarios of a family: the ones this feature both writes and
 * tests, patterns expanded.
 *
 * `spec.md` §O.2 keeps two tables for these families — the first set, which T134
 * and T135 build, and "Scenarios added after the first set", which another feature
 * asks for and whose test it owns. The catalogue tells them apart by `testOf`: the
 * first set names none, the added ones name the feature that tests them (123 for
 * every added scenario of FX-35 and FX-36, 106 for `106-learning-exported`). Those
 * are built by T156 and by feature 106, and are NOT this phase's deliverable;
 * `scenariosAnotherFeatureTests` below is what the test says about them.
 */
function ownedScenariosOf(family: string): readonly string[] {
  const entries = families().find((f) => f.id === family)?.scenarios ?? [];
  const names: string[] = [];
  for (const entry of entries) {
    if (entry.scenarioOf !== OWNER || entry.testOf !== undefined) continue;
    if (entry.pattern) names.push(...(entry.members ?? []));
    else names.push(entry.name);
  }
  return names;
}

/** The scenarios of a family whose test another feature owns, patterns expanded. */
function scenariosAnotherFeatureTests(family: string): readonly string[] {
  const entries = families().find((f) => f.id === family)?.scenarios ?? [];
  const names: string[] = [];
  for (const entry of entries) {
    if (entry.testOf === undefined) continue;
    // A pattern of ANOTHER feature lists no members here — the feature that owns it
    // decides them (§O.2) — so the pattern name itself is what the catalogue holds.
    if (entry.pattern && (entry.members ?? []).length > 0) names.push(...(entry.members ?? []));
    else names.push(entry.name);
  }
  return names;
}

/** The size of the first set of each family, as `spec.md` §O.2 states it. */
const FIRST_SET = { "FX-35": 12, "FX-36": 63 } as const;

/**
 * The scenarios whose END the engine decides, so the two variants do not share one.
 * Named here rather than inferred, so a third one cannot appear unnoticed.
 */
const ENDS_WITH_THE_ENGINE: readonly string[] = ["FX-35/second-pipeline-on-held-workspace"];

test("CT-141-116: FX-35 and FX-36 are the only families with variants, and they have the two", () => {
  for (const family of WITH_VARIANTS) {
    assert.deepEqual(
      [...variantsOf(family)],
      [ENGINE_STUB_VARIANT, FULL_STACK_VARIANT],
      `${family} runs every scenario as ${ENGINE_STUB_VARIANT} and as ${FULL_STACK_VARIANT}`,
    );
  }
  for (const family of families()) {
    if ((WITH_VARIANTS as readonly string[]).includes(family.id)) continue;
    assert.deepEqual(
      [...variantsOf(family.id)],
      [],
      `${family.id} has no variant: F141-FR-016 names FX-35 and FX-36`,
    );
  }
  // A citation may name a variant of those two and of nothing else, and only the two.
  assert.equal(resolveCitation("FX-35/dry-run@engine-stub").variant, ENGINE_STUB_VARIANT);
  assert.equal(resolveCitation("FX-36/launch@full-stack").variant, FULL_STACK_VARIANT);
  assert.throws(() => resolveCitation("FX-01/three-phases@engine-stub"), /only FX-35 and FX-36/);
  assert.throws(() => resolveCitation("FX-35/dry-run@both"), /citation/);
});

test("CT-141-116: every scenario of FX-35 and FX-36 lies on disk once per variant", () => {
  let counted = 0;
  for (const family of WITH_VARIANTS) {
    const owned = ownedScenariosOf(family);
    assert.ok(owned.length > 0, `the catalogue gives ${family} scenarios of feature ${OWNER}`);
    for (const name of owned) {
      for (const variant of [ENGINE_STUB_VARIANT, FULL_STACK_VARIANT]) {
        const declaration = declarationOf(family, name, variant);
        assert.ok(
          declaration !== undefined,
          `${family}/${name}${variant} is built: F141-FR-016 asks for both variants`,
        );
        assert.equal(declaration["id"], `${family}/${name}`);
        assert.equal(declaration["variant"], variant);
        assert.equal(declaration["system"], "mixture-of-loops");
        counted += 1;
      }
    }
    // And nothing on disk is of a variant the family does not have, or of none.
    for (const entry of readdirSync(join(FIXTURES, family))) {
      if (!existsSync(join(FIXTURES, family, entry, "fixture.json"))) continue;
      const found = [ENGINE_STUB_VARIANT, FULL_STACK_VARIANT].filter((v) => entry.endsWith(v));
      assert.equal(
        found.length,
        1,
        `${family}/${entry} names one of the two variants of F141-FR-016 in its directory`,
      );
      const name = entry.slice(0, entry.length - (found[0] as string).length);
      assert.ok(
        scenarioNamesOf(family).includes(name) || scenarioOwnerOf(family, name) !== undefined,
        `${family}/${name} is a scenario the catalogue holds`,
      );
    }
  }
  // The first set is the size §O.2 gives it, so the test cannot pass with fewer:
  // twelve scenarios of FX-35 (nine plain and the three signals) and 63 of FX-36
  // (six plain and the 57 members of the four patterns).
  for (const [family, size] of Object.entries(FIRST_SET)) {
    assert.equal(ownedScenariosOf(family).length, size, `the first set of ${family}`);
  }
  assert.equal(counted, 2 * (FIRST_SET["FX-35"] + FIRST_SET["FX-36"]));
  // And the scenarios another feature's test owns are named, not silently counted:
  // T156 builds the six of FX-35 and the one of FX-36, and feature 106 its own.
  assert.deepEqual(
    [...scenariosAnotherFeatureTests("FX-35")],
    [
      "stale-sources",
      "invalid-launch-contract",
      "colour-always",
      "colour-never",
      "setup-without-implement",
      "precondition-fails",
      "106-learning-exported",
    ],
  );
  assert.deepEqual(
    [...scenariosAnotherFeatureTests("FX-36")],
    ["observe-cadence", "relaunch-budget-<n>"],
  );
});

test("CT-141-116: the two variants of one scenario differ in the engine and in nothing else", () => {
  const engine = engineExecutableName();
  for (const family of WITH_VARIANTS) {
    for (const name of ownedScenariosOf(family)) {
      const stub = declarationOf(family, name, ENGINE_STUB_VARIANT) as Record<string, unknown>;
      const full = declarationOf(family, name, FULL_STACK_VARIANT) as Record<string, unknown>;
      const where = `${family}/${name}`;

      // `@engine-stub`: the engine stub, and no agent stub.
      const stubbed = Object.keys(stub["stubs"] as Record<string, unknown>);
      assert.deepEqual(stubbed, ["engine"], `${where}@engine-stub drives the engine stub`);
      assert.equal(
        stub["engineSystem"],
        undefined,
        `${where}@engine-stub reaches no second baseline: the engine stub answers`,
      );
      assert.equal(engineSystemOf(stub), undefined);

      // `@full-stack`: the real engine, named as a baseline, and the agent stubs.
      assert.equal(full["engineSystem"], "specstride", `${where}@full-stack names the real engine`);
      assert.equal(engineSystemOf(full), "specstride");
      const agents = Object.keys(full["stubs"] as Record<string, unknown>).sort();
      assert.deepEqual(
        agents,
        ["critic-http", "proposer"],
        `${where}@full-stack drives the real engine with agent stubs`,
      );

      // The SAME scenario: the steps and the launch contract are byte-identical, so
      // the engine is the whole difference between the two runs.
      assert.deepEqual(
        full["steps"],
        stub["steps"],
        `${where}: the two variants run the same steps`,
      );
      assert.deepEqual(
        full["surfaces"],
        stub["surfaces"],
        `${where}: the two variants compare the same surfaces`,
      );
      // The END may differ, and for exactly one scenario it does: the engine is
      // what decides it. `second-pipeline-on-held-workspace` is about the workdir
      // lock, which is SPECSTRIDE's and not the pipeline's (register row DV-075), so
      // the engine stub runs the second pipeline to the end and the real engine
      // finds the lock held and exits 5, which the runtime reports as 22. Every
      // other scenario of the two families ends the same way whichever engine ran,
      // which is what makes `@engine-stub` an isolation and not a second behaviour.
      if (ENDS_WITH_THE_ENGINE.includes(`${family}/${name}`)) {
        assert.notEqual(
          full["expectedExit"],
          stub["expectedExit"],
          `${where}: the engine decides the end, so the two variants end differently`,
        );
      } else {
        assert.equal(full["expectedExit"], stub["expectedExit"], `${where}: the same end`);
      }
      for (const side of [ENGINE_STUB_VARIANT, FULL_STACK_VARIANT]) {
        const patch = join(FIXTURES, family, `${name}${side}`, "contract-patch.json");
        if (!existsSync(patch)) continue;
        const other = join(
          FIXTURES,
          family,
          `${name}${ENGINE_STUB_VARIANT}`,
          "contract-patch.json",
        );
        assert.equal(
          readFileSync(patch, "utf8"),
          readFileSync(other, "utf8"),
          `${where}: the two variants act on the same launch contract`,
        );
      }

      // And the contract names the engine by its BARE command name, so which engine
      // answers is decided by the run's own `stub-bin` and by nothing in the contract.
      const patch = join(FIXTURES, family, `${name}${FULL_STACK_VARIANT}`, "contract-patch.json");
      if (existsSync(patch)) {
        const stages = (
          JSON.parse(readFileSync(patch, "utf8")) as {
            stages: Record<string, unknown>[];
          }
        ).stages;
        for (const stage of stages.filter((s) => s["kind"] === "specstride")) {
          const action = stage["action"] as { argv: readonly string[] };
          assert.equal(
            action.argv[0],
            engine,
            `${where}: the engine stage names the as-is engine command and no path`,
          );
        }
      }
    }
  }
});

test("CT-141-116: the engine of the reference side is the stub or the second baseline, never neither", () => {
  const full = declarationOf("FX-35", "stages-complete", FULL_STACK_VARIANT) as Record<
    string,
    unknown
  >;
  // The tree of the engine's baseline is what the variant needs; without it the
  // driver REFUSES rather than falling back to the engine stub, because a fallback
  // would capture the engine-stub run under the name of the full-stack one.
  assert.throws(
    () => engineTargetOfTheReferenceSide({ fixture: full }),
    (error: unknown) =>
      error instanceof DriverError && /cannot fall back to the engine stub/.test(error.message),
  );
  // And a tree that holds no front door of that baseline is refused too.
  assert.throws(
    () => engineTargetOfTheReferenceSide({ fixture: full, engineRoot: ORACLE_ROOT }),
    (error: unknown) => error instanceof DriverError && /does not exist/.test(error.message),
  );
  // The `@engine-stub` variant asks for no second tree.
  const stub = declarationOf("FX-35", "stages-complete", ENGINE_STUB_VARIANT) as Record<
    string,
    unknown
  >;
  assert.equal(engineTargetOfTheReferenceSide({ fixture: stub }), undefined);

  // Only a `@full-stack` scenario may name a second baseline, and never its own.
  assert.throws(
    () => engineSystemOf({ ...stub, engineSystem: "specstride" }),
    /only the @full-stack variant/,
  );
  assert.throws(
    () => engineSystemOf({ ...full, engineSystem: "mixture-of-loops" }),
    /its own system/,
  );

  // On the PORT the engine stub is named through row 41 of the `parity` profile and
  // through no switch of the oracle's own; the `@full-stack` port names none, so the
  // product's own front door answers.
  assert.equal(
    (portConfiguration({ engineStub: "/stubs/bin/specstride" }) as Record<string, unknown>)[
      ENGINE_SWITCH_KEY
    ],
    "/stubs/bin/specstride",
  );
  assert.equal(ENGINE_SWITCH_ROW, 41);
  assert.equal(
    Object.hasOwn(portConfiguration({}) as Record<string, unknown>, ENGINE_SWITCH_KEY),
    false,
  );
});

test("CT-141-116: a golden capture and a waiver of a variant name the variant", () => {
  // The identity of a scenario of these two families is the id WITH the variant
  // (`data-model.md`), so the two runs are stored apart and never compared with each
  // other.
  assert.equal(
    scenarioNameOf({ id: "FX-35/dry-run", variant: ENGINE_STUB_VARIANT }),
    "FX-35/dry-run@engine-stub",
  );
  assert.equal(scenarioNameOf({ id: "FX-01/three-phases" }), "FX-01/three-phases");
  assert.notEqual(goldenFile("FX-35/dry-run@engine-stub"), goldenFile("FX-35/dry-run@full-stack"));
  for (const family of WITH_VARIANTS) {
    for (const name of ownedScenariosOf(family)) {
      for (const variant of [ENGINE_STUB_VARIANT, FULL_STACK_VARIANT]) {
        const declaration = declarationOf(family, name, variant) as Record<string, unknown>;
        assert.equal(
          scenarioNameOf(declaration as { id: string; variant?: string }),
          `${family}/${name}${variant}`,
        );
      }
    }
  }
});
