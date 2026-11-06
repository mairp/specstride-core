/**
 * CT-141-115 — the scenarios of dsh, Codex and prime (T117; F141-FR-015).
 *
 * What the test proves. Nothing is mocked: every assertion reads the scenarios
 * that lie on disk under `packages/oracle/fixtures/`, the harness-stub table of
 * `data/stub-vocabulary.json` and the environment alias table of feature 100.
 *
 * - **present in the eight families** F141-FR-015 names: FX-01 and FX-26 for the
 *   proposer invocations and the streams, FX-01 and FX-06 for the critic calls,
 *   FX-07 for the errors of the critic configuration, FX-18 for a pass that fails
 *   before the harness starts, FX-25 for the context windows, FX-38 for the plugin
 *   protocol and FX-39 for the settings overlay of dsh. Each of the three harnesses
 *   has at least one scenario in the families that name it;
 * - **the reference needs only stubs**: every executable such a scenario names is
 *   a stub executable of `stub-vocabulary.json`, every prerequisite it declares is
 *   one of the three prerequisites of the reference tier, and none of them is an
 *   installed harness, a login, a key or a network;
 * - **no scenario encodes an `unverified` fact**: research left two facts of these
 *   three harnesses unverified — what the approval mode of dsh does in a headless
 *   run, and the structured quota event of Codex. No scenario declares the as-is
 *   variable of the approval mode, and no stream file of a Codex scenario carries a
 *   quota record. The two facts are captured by features 130 and 131.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { ORACLE_ROOT } from "../../src/index.ts";
import { oracleData, type HarnessStub } from "../../src/catalogue/data.ts";
import { stubExecutableNames } from "../../stubs/lib/names.ts";
import { AS_IS_VARIABLES } from "../../src/env/hermetic.ts";

const FIXTURES = join(ORACLE_ROOT, "fixtures");

/** The eight families F141-FR-015 names, with what each one is for. */
export const FAMILIES_OF_THE_THREE_HARNESSES: Readonly<Record<string, string>> = Object.freeze({
  "FX-01": "the proposer invocation and the critic call of each harness",
  "FX-06": "the transport failure of each harness as a critic",
  "FX-07": "the errors of the critic configuration",
  "FX-18": "a pass that fails before the harness starts",
  "FX-25": "the context window of each harness",
  "FX-26": "the stream format of each harness through the seam",
  "FX-38": "the plugin request protocol of dsh",
  "FX-39": "the settings overlay of dsh",
});

/** The three harnesses this test is about. The generic stub and pi are not of it. */
export const THE_THREE_HARNESSES = Object.freeze(["dsh", "codex", "prime"] as const);

type Declaration = Record<string, unknown> & {
  readonly id: string;
  readonly environment: Record<string, string>;
  readonly command: Record<string, readonly string[]>;
  readonly prerequisites?: readonly string[];
};

/** Every scenario on disk, with the family it is of. */
function scenariosOnDisk(): { family: string; name: string; declaration: Declaration }[] {
  const found: { family: string; name: string; declaration: Declaration }[] = [];
  for (const family of readdirSync(FIXTURES).sort()) {
    const root = join(FIXTURES, family);
    if (!statSync(root).isDirectory() || !/^FX-\d\d$/.test(family)) continue;
    for (const name of readdirSync(root).sort()) {
      const file = join(root, name, "fixture.json");
      if (!existsSync(file)) continue;
      found.push({
        family,
        name,
        declaration: JSON.parse(readFileSync(file, "utf8")) as Declaration,
      });
    }
  }
  return found;
}

/**
 * The harnesses one scenario names, read off the roles of its declaration. The
 * value of `SPECSTRIDE_PROPOSER` and `SPECSTRIDE_CRITIC` is the whole backend
 * string, qualifier included (`proposer.sh:140`), so the name is what stands
 * before the first colon.
 */
function harnessesOf(declaration: Declaration): string[] {
  const named = new Set<string>();
  for (const role of ["SPECSTRIDE_PROPOSER", "SPECSTRIDE_CRITIC"]) {
    const value = declaration.environment[role];
    if (value === undefined) continue;
    named.add(value.split(":")[0] as string);
  }
  return [...named].sort();
}

// ---------------------------------------------------------------------------
// Present in the eight families
// ---------------------------------------------------------------------------

test("CT-141-115: dsh, Codex and prime have scenarios in the families F141-FR-015 names", () => {
  const scenarios = scenariosOnDisk();
  assert.ok(scenarios.length > 100, `${String(scenarios.length)} scenarios are on disk`);

  // Which of the three each family holds a scenario for.
  const byFamily: Record<string, Set<string>> = {};
  for (const { family, declaration } of scenarios) {
    byFamily[family] ??= new Set<string>();
    for (const harness of harnessesOf(declaration)) {
      if ((THE_THREE_HARNESSES as readonly string[]).includes(harness)) {
        byFamily[family]?.add(harness);
      }
    }
  }

  // Every one of the eight families holds at least one scenario of one of the
  // three, and together the eight hold all three.
  const all = new Set<string>();
  for (const family of Object.keys(FAMILIES_OF_THE_THREE_HARNESSES)) {
    const held = byFamily[family] ?? new Set<string>();
    assert.ok(
      held.size > 0,
      `${family} holds no scenario of dsh, Codex or prime (${FAMILIES_OF_THE_THREE_HARNESSES[family] as string})`,
    );
    for (const harness of held) all.add(harness);
  }
  assert.deepEqual([...all].sort(), ["codex", "dsh", "prime"]);

  // The three families the requirement names for the streams and the invocations
  // of each harness hold a scenario for EVERY one of the three.
  for (const family of ["FX-01", "FX-26"]) {
    assert.deepEqual(
      [...(byFamily[family] ?? [])].sort(),
      ["codex", "dsh", "prime"],
      `${family} holds a scenario of each of the three`,
    );
  }
  // The plugin protocol and the settings overlay are dsh's alone.
  for (const family of ["FX-38", "FX-39"]) {
    assert.ok((byFamily[family] ?? new Set()).has("dsh"), `${family} holds a dsh scenario`);
  }
});

// ---------------------------------------------------------------------------
// The reference needs nothing but stub executables
// ---------------------------------------------------------------------------

test("CT-141-115: the reference side of such a scenario needs nothing but stub executables", () => {
  const stubs = new Set(stubExecutableNames());
  // The table names the executables of each of the three, and each of them is a
  // stub the oracle builds (F141-FR-010).
  for (const harness of THE_THREE_HARNESSES) {
    const row = (oracleData.stubVocabulary.harnessStubs as readonly HarnessStub[]).find(
      (entry) => entry.harness === harness,
    );
    assert.ok(row !== undefined, `the table names the stub of ${harness}`);
    for (const executable of row?.executables ?? []) {
      assert.ok(stubs.has(executable), `${executable} is a stub executable of the oracle`);
    }
  }

  const prerequisitesOfTheReferenceTier = new Set([
    "bash 4 or later, flock, setsid, GNU stat and date",
    "python3 3.10 to 3.13",
    "the Specstride reference tree at 9cab15d in scratch (ORACLE_REF_SPECSTRIDE)",
    "the mixture-of-loops reference tree at 9c88f86 in scratch (ORACLE_REF_MOL)",
    "the run has the effective user id 0",
  ]);

  let judged = 0;
  for (const { family, name, declaration } of scenariosOnDisk()) {
    const named = harnessesOf(declaration).filter((harness) =>
      (THE_THREE_HARNESSES as readonly string[]).includes(harness),
    );
    if (named.length === 0) continue;
    judged += 1;
    const where = `${family}/${name}`;

    // No prerequisite of an installed harness, a login, a key or a network.
    for (const prerequisite of declaration.prerequisites ?? []) {
      assert.ok(
        prerequisitesOfTheReferenceTier.has(prerequisite),
        `${where} declares the prerequisite "${prerequisite}"`,
      );
    }

    // Every variable that names the executable of a harness names a BARE name,
    // never a path of a machine: a bare name can only resolve inside the
    // `stub-bin` of the run, so the reference needs no installed harness.
    for (const [variable, value] of Object.entries(declaration.environment)) {
      if (!/_BIN$/.test(variable)) continue;
      assert.ok(
        !value.includes("/"),
        `${where} points ${variable} at the path ${value}; a harness executable is named bare`,
      );
      // A name that is no stub resolves NOWHERE, which is the one case the
      // requirement names for it: a pass that fails before the harness starts.
      assert.ok(
        stubs.has(value) || name.startsWith("harness-missing-"),
        `${where} points ${variable} at ${value}, which is no stub executable and the ` +
          `scenario is not a missing-harness scenario`,
      );
      if (!stubs.has(value)) {
        assert.notEqual(
          declaration["expectedExit"],
          0,
          `${where} names a harness that is not there and still ends well`,
        );
      }
    }

    // And every variable it declares is a row of the environment alias table of
    // feature 100, so the port is driven by the same variables (F141-FR-003).
    for (const variable of Object.keys(declaration.environment)) {
      const known =
        AS_IS_VARIABLES.includes(variable) ||
        AS_IS_VARIABLES.some((row) => {
          if (!row.includes("<")) return false;
          return new RegExp(`^${row.replace(/<[^>]*>/g, "[A-Z0-9_]+")}$`).test(variable);
        });
      assert.ok(known || variable.startsWith("SPECSTRIDE_"), `${where} declares ${variable}`);
    }
  }
  assert.ok(judged >= 40, `${String(judged)} scenarios name one of the three harnesses`);
});

// ---------------------------------------------------------------------------
// No scenario encodes a fact research left `unverified`
// ---------------------------------------------------------------------------

/**
 * The two facts of these three harnesses that research left `unverified`
 * (F141-FR-015; R9 for dsh, R6 for Codex). Features 130 and 131 capture them
 * before their specifications freeze; until then no scenario of the oracle may
 * state what they are.
 */
export const UNVERIFIED_FACTS = Object.freeze([
  {
    fact: "what the approval mode of dsh does in a headless run",
    research: "R9",
    capturedBy: "130",
    /** The as-is variables that would state it. */
    variables: ["SPECSTRIDE_DSH_PERMISSION_MODE", "DSH_PERMISSION_MODE"],
  },
  {
    fact: "the structured quota event of Codex",
    research: "R6",
    capturedBy: "131",
    /** The record a stream would have to carry to state it. */
    records: ["quota", "rate_limit", "rate-limit"],
  },
] as const);

test("CT-141-115: no scenario encodes a fact that research left `unverified`", () => {
  assert.equal(UNVERIFIED_FACTS.length, 2);

  let codexScenarios = 0;
  let dshScenarios = 0;
  for (const { family, name, declaration } of scenariosOnDisk()) {
    const named = harnessesOf(declaration);
    const where = `${family}/${name}`;

    // 1. dsh: the approval mode. The baseline reads it
    //    (`DSH_PERMISSION_MODE="${SPECSTRIDE_DSH_PERMISSION_MODE:-…workspace-write}"`),
    //    so a scenario COULD set it — and what it then does in a headless run is
    //    exactly the fact research did not establish.
    if (named.includes("dsh")) dshScenarios += 1;
    for (const variable of UNVERIFIED_FACTS[0].variables) {
      assert.ok(
        !(variable in declaration.environment),
        `${where} declares ${variable}, which states the unverified approval mode of dsh`,
      );
    }

    // 2. Codex: the structured quota event. No recorded stream of a Codex scenario
    //    carries a quota record, because the shape of that record is the fact
    //    research did not establish.
    if (!named.includes("codex")) continue;
    codexScenarios += 1;
    const root = join(FIXTURES, family, name);
    for (const file of readdirSync(root)) {
      if (!file.endsWith(".jsonl")) continue;
      const text = readFileSync(join(root, file), "utf8").toLowerCase();
      for (const record of UNVERIFIED_FACTS[1].records) {
        assert.ok(
          !text.includes(`"${record}"`),
          `${where}/${file} carries a ${record} record of Codex, which research left unverified`,
        );
      }
    }
  }
  assert.ok(dshScenarios >= 10, `${String(dshScenarios)} scenarios name dsh`);
  assert.ok(codexScenarios >= 3, `${String(codexScenarios)} scenarios name Codex`);
});
