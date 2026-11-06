/**
 * T238 — contract tests CT-100-127 to CT-100-131 for the product-wide rules
 * F100-FR-027 to F100-FR-031 (annex A, §A.5).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  AUDIENCE_KEY,
  AUDIENCE_RANK,
  INSTALL_SCRIPTS,
  RANGE,
  SHIPPED_AUDIENCE,
  checkAudience,
  checkPackaging,
  packageManifests,
} from "../src/static/product-rules-packaging.ts";
import {
  ALLOWED_EXTENSIONS,
  COPYRIGHT_LINE,
  LICENCE,
  LOOP_LAYER_FEATURES,
  LOOP_LAYER_FREE_SETS,
  LOOP_LAYER_FAILURE_ENDS,
  MIT_COMPATIBLE,
  checkDependencyLicences,
  checkLanguage,
  checkLicence,
  checkLoopLayersAddNothing,
  isMitCompatible,
} from "../src/static/product-rules-vocabulary.ts";
import { ROOT, readJson, textOf } from "../src/static/kit.ts";

const closedSets = readJson<{
  closedSets: { number: number; name: string; literals: string[]; owner: string }[];
}>(join(ROOT, "packages/contracts/data/closed-sets.json")).closedSets;
const graph = readJson<{ published: string[]; builtByFeature100: string[] }>(
  join(ROOT, "packages/contracts/data/package-graph.json"),
);
const profile = readJson<{
  switches: { number: number; keys: string[]; default: string; parity: string; owner: string }[];
}>(join(ROOT, "packages/contracts/data/parity-profile.json"));

test("CT-100-127: installing a package runs no install script, compiles nothing, and every dependency is pinned (F100-FR-027)", () => {
  assert.deepEqual([...checkPackaging()], []);
  // The three published packages of the graph.
  assert.ok(graph.published.includes("@specstride/contracts"));
  assert.ok(graph.published.includes("@specstride/testkit"));
  // No package.json of the workspace carries an install script.
  for (const manifest of packageManifests()) {
    const scripts = readJson<{ scripts?: Record<string, string> }>(manifest).scripts ?? {};
    for (const script of INSTALL_SCRIPTS) {
      assert.equal(scripts[script], undefined, `${manifest} must not have \`${script}\``);
    }
  }
  // Every dependency at an exact version, never a range.
  for (const manifest of packageManifests()) {
    const pkg = readJson<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }>(manifest);
    for (const deps of [pkg.dependencies ?? {}, pkg.devDependencies ?? {}]) {
      for (const [name, range] of Object.entries(deps)) {
        assert.equal(RANGE.test(range), false, `${name}@${range} in ${manifest} is a range`);
      }
    }
  }
  // The rule discriminates: a caret, a tilde and `latest` are ranges.
  for (const range of ["^1.0.0", "~1.0.0", ">=1", "1.x", "latest", "1.0.0 - 2.0.0", "1 || 2"]) {
    assert.equal(RANGE.test(range), true, range);
  }
  assert.equal(RANGE.test("8.20.0"), false);
});

test("CT-100-128: the shipped package has the audience distributed, settable through user configuration only (F100-FR-028)", () => {
  assert.equal(AUDIENCE_KEY, "distribution.audience");
  assert.equal(SHIPPED_AUDIENCE, "distributed");
  assert.equal(AUDIENCE_RANK, "User configuration");
  // Row 34 of annex X §X.7 carries the key, with `distributed` as the value
  // the package ships and `personal` under the `parity` profile.
  const row = profile.switches.find((r) => r.number === 34);
  assert.notEqual(row, undefined);
  assert.deepEqual(row?.keys, ["distribution.audience"]);
  assert.equal(String(row?.default).replace(/`/g, ""), SHIPPED_AUDIENCE);
  assert.equal(String(row?.parity).replace(/`/g, ""), "personal");
  // The audience never changes through the environment: no alias names it.
  const normalization = readJson<{ environmentAliases: { Key: string }[] }>(
    join(ROOT, "packages/contracts/data/normalization.json"),
  );
  for (const alias of normalization.environmentAliases) {
    assert.equal(
      alias.Key.replace(/`/g, "").includes(AUDIENCE_KEY),
      false,
      `no alias may name ${AUDIENCE_KEY}`,
    );
  }
  assert.deepEqual([...checkAudience()], []);
});

test("CT-100-129: the licence is MIT with the copyright line, and every dependency is MIT-compatible (F100-FR-029)", () => {
  assert.equal(LICENCE, "Apache-2.0");
  assert.equal(COPYRIGHT_LINE, "Copyright 2026 mairp");
  const licence = textOf(join(ROOT, "LICENSE"));
  assert.match(licence, /Apache License/);
  assert.ok(licence.includes(COPYRIGHT_LINE));
  for (const manifest of packageManifests()) {
    assert.equal(readJson<{ license?: string }>(manifest).license, "Apache-2.0", manifest);
  }
  // The licence of a dependency is read from the package AS INSTALLED.
  assert.deepEqual([...checkDependencyLicences()], []);
  const ajv = join(ROOT, "packages/contracts/node_modules/ajv/package.json");
  if (existsSync(ajv)) {
    assert.ok(isMitCompatible(String(readJson<{ license?: string }>(ajv).license)));
  }
  // The rule discriminates.
  assert.ok(MIT_COMPATIBLE.includes("MIT"));
  assert.equal(isMitCompatible("MIT"), true);
  assert.equal(isMitCompatible("Apache-2.0"), true);
  assert.equal(isMitCompatible("(MIT OR Apache-2.0)"), true);
  assert.equal(isMitCompatible("GPL-3.0"), false, "a copyleft licence is not MIT-compatible");
  assert.equal(isMitCompatible("LicenseRef-Proprietary"), false, "a proprietary one is not");
  assert.equal(isMitCompatible(""), false);
  // No published file holds an owner-specific path, an account or a name.
  assert.deepEqual([...checkLicence()], []);
});

test("CT-100-130: every source file is TypeScript or JSON, and the Language Ledger is empty (F100-FR-030)", () => {
  assert.deepEqual([...ALLOWED_EXTENSIONS], [".ts", ".json"]);
  assert.deepEqual([...checkLanguage()], []);
  // The check discriminates: a shipped file in another language is a finding.
  const dir = mkdtempSync(join(tmpdir(), "specstride-language-"));
  try {
    mkdirSync(join(dir, "packages", "made-up", "src"), { recursive: true });
    writeFileSync(
      join(dir, "packages", "made-up", "package.json"),
      JSON.stringify({ name: "made-up", license: "MIT", files: ["src/"] }),
    );
    writeFileSync(join(dir, "packages", "made-up", "src", "thing.py"), "print('no')\n");
    const findings = checkLanguage({ root: dir });
    assert.ok(findings.length > 0, "a source file in another language is a finding");
    assert.ok(findings.some((f) => f.value === ".py"));
    assert.ok(findings.some((f) => /Language Ledger|written in TypeScript/.test(f.message)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  // The Language Ledger is empty at the start of Wave 1: it holds no entry,
  // and the repository carries no such file.
  assert.equal(existsSync(join(ROOT, "docs/language-ledger.json")), false);
});

test("CT-100-131: the closed sets of run states, exit codes and stop reasons hold no member owned by a loop layer (F100-FR-031)", () => {
  assert.deepEqual([...LOOP_LAYER_FREE_SETS], [1, 3, 6, 7]);
  assert.deepEqual([...LOOP_LAYER_FEATURES], ["115", "142", "148"]);
  // The four sets: run states, stop reasons, engine exit codes, exit codes
  // per command. Each is owned by feature 100, not by a loop layer.
  for (const number of LOOP_LAYER_FREE_SETS) {
    const row = closedSets.find((r) => r.number === number);
    assert.notEqual(row, undefined, `row ${number}`);
    assert.equal(row?.owner, "100", `row ${number} ("${row?.name}") is owned by 100`);
    assert.equal(
      (LOOP_LAYER_FEATURES as readonly string[]).includes(String(row?.owner)),
      false,
      `row ${number} is owned by no loop layer`,
    );
  }
  assert.equal(closedSets.find((r) => r.number === 1)?.name, "Run states");
  assert.equal(closedSets.find((r) => r.number === 3)?.name, "Stop reasons");
  assert.equal(closedSets.find((r) => r.number === 6)?.name, "Engine exit codes");
  assert.equal(closedSets.find((r) => r.number === 7)?.name, "Exit codes per command");
  // No set that a loop layer owns is a set of run states, exit codes or stop
  // reasons under another name.
  assert.deepEqual([...checkLoopLayersAddNothing()], []);
  // A failure inside a loop layer ends in one of exactly three ways.
  assert.equal(LOOP_LAYER_FAILURE_ENDS.length, 3);
  // The counters are compared by the second suite of the oracle (T204): the
  // profile with row 1 set to `micro` and nothing else changed.
  assert.equal(profile.switches.find((r) => r.number === 1)?.owner, "115");
});
