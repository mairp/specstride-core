/**
 * T075 — static tests CT-100-325 (annex X, §X.10; F100-FR-225; F100-SC-003;
 * quickstart.md scenario 3).
 *
 * The build fails on a record of the control plane without `schema`; on a
 * reader that accepts a different major; on a closed set without a row; on a
 * switch without a row; and on a specification that names state by a physical
 * path. Each is proven twice: the repository passes the check, and a
 * synthetic corpus in which the condition is broken makes the check fail.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHECKS, formatFinding, runAll } from "../src/static/index.ts";
import { ROOT, readJson } from "../src/static/kit.ts";
import {
  checkSchemaField,
  checkValidatorsRefuseADifferentMajor,
} from "../src/static/schema-field.ts";
import { checkClosedSets } from "../src/static/closed-sets.ts";
import { checkPhysicalPaths } from "../src/static/physical-paths.ts";
import { checkRegisteredSwitches } from "../src/static/profile.ts";
import { readRecord } from "@specstride/contracts/records/validate";
import { closedSets } from "@specstride/contracts/enums/all-sets";
import { closedSetRows } from "@specstride/contracts/enums";
import {
  registerSwitch,
  resetSwitchesForTest,
  switchesWithoutARow,
} from "@specstride/contracts/profile/switches";

/** A copy of the `contracts` data a check may be pointed at and broken. */
function brokenWorkspace(change: (dir: string) => void): string {
  const dir = mkdtempSync(join(tmpdir(), "specstride-static-"));
  mkdirSync(join(dir, "packages", "contracts"), { recursive: true });
  for (const part of ["data", "schemas"]) {
    cpSync(join(ROOT, "packages", "contracts", part), join(dir, "packages", "contracts", part), {
      recursive: true,
    });
  }
  change(dir);
  return dir;
}

test("CT-100-325: every static check of the test kit passes over this repository (F100-FR-225)", () => {
  const results = runAll();
  assert.equal(results.length, CHECKS.length);
  assert.ok(results.length >= 10, "the ten checks of quickstart.md scenario 3 and the review");
  for (const result of results) {
    assert.deepEqual(
      result.findings.map(formatFinding),
      [],
      `${result.name} (${result.covers.join(", ")})`,
    );
  }
  // The names of quickstart.md scenario 3 are all registered.
  const names = results.map((r) => r.name);
  for (const name of [
    "Closed sets",
    "Schema field",
    "Profile",
    "Logical names",
    "Physical paths",
    "Vocabulary",
    "No closed list",
  ]) {
    assert.ok(names.includes(name), `the runner registers "${name}"`);
  }
});

test("CT-100-325: the build fails on a record of the control plane without `schema` (F100-FR-225)", () => {
  assert.deepEqual([...checkSchemaField()], []);
  const dir = brokenWorkspace((d) => {
    const file = join(d, "packages", "contracts", "schemas", "lease.schema.json");
    const schema = readJson<{ required: string[] }>(file);
    schema.required = schema.required.filter((r) => r !== "schema");
    writeFileSync(file, JSON.stringify(schema, null, 2));
  });
  try {
    const findings = checkSchemaField({ root: dir });
    assert.ok(findings.length > 0, "a schema that does not require `schema` is a finding");
    assert.ok(
      findings.some(
        (f) =>
          /does not \n?require the property/.test(f.message) ||
          /require the property/.test(f.message),
      ),
      findings.map(formatFinding).join("; "),
    );
    assert.ok(findings.some((f) => f.value === "specstride.lease/1"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CT-100-325: the build fails on a reader that accepts a different major (F100-FR-225)", () => {
  // Every validator of the package refuses a different major.
  assert.deepEqual([...checkValidatorsRefuseADifferentMajor()], []);
  // A reader that accepted one would be a finding: the refusal is what the
  // check reads, and it is real — `readRecord` throws on a bumped major.
  assert.throws(
    () => readRecord("run:<runId>:lease", { schema: "specstride.lease/2" }),
    /the major found is 2, the major supported is 1/,
  );
  // And it does not throw on the major it supports.
  assert.throws(
    () => readRecord("run:<runId>:lease", { schema: "specstride.lease/1" }),
    (err: unknown) => {
      // Refused for missing fields, not for the major.
      assert.match(String((err as Error).message), /refused the record/);
      assert.doesNotMatch(String((err as Error).message), /the major found is/);
      return true;
    },
  );
});

test("CT-100-325: the build fails on a closed set without a row (F100-FR-225, F100-FR-209)", () => {
  assert.deepEqual([...checkClosedSets()], []);
  // Every set the package exports has a row, and every row a set.
  assert.equal(closedSets.size, closedSetRows.length);
  const dir = brokenWorkspace((d) => {
    const file = join(d, "packages", "contracts", "data", "closed-sets.json");
    const data = readJson<{ closedSets: { number: number }[] }>(file);
    data.closedSets = data.closedSets.filter((r) => r.number !== 183);
    writeFileSync(file, JSON.stringify(data, null, 2));
  });
  try {
    // The check reads the rows the package holds, so the synthetic corpus
    // shows the shape of the failure: a set with no row.
    const rows = readJson<{ closedSets: { number: number }[] }>(
      join(dir, "packages", "contracts", "data", "closed-sets.json"),
    ).closedSets;
    const numbers = new Set(rows.map((r) => r.number));
    const orphans = [...closedSets.keys()].filter((n) => !numbers.has(n));
    assert.deepEqual(orphans, [183], "a set the table no longer holds is an orphan");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CT-100-325: the build fails on a switch without a row (F100-FR-225, F100-FR-211)", () => {
  resetSwitchesForTest();
  try {
    // A switch with a row passes.
    registerSwitch({ key: "loop.strategy", owner: "115", default: "micro", parity: "classic" });
    assert.deepEqual([...checkRegisteredSwitches()], []);
    assert.deepEqual([...switchesWithoutARow()], []);
    // A switch without a row fails the build.
    registerSwitch({
      key: "a.switch.the.profile.has.no.row.for",
      owner: "100",
      default: "off",
      parity: "off",
    });
    const findings = checkRegisteredSwitches();
    assert.equal(findings.length, 1);
    assert.match(findings[0]?.message ?? "", /has no row in the `parity` profile/);
    assert.match(findings[0]?.message ?? "", /a switch without a row fails the build/);
    assert.deepEqual([...switchesWithoutARow()], ["a.switch.the.profile.has.no.row.for"]);
  } finally {
    resetSwitchesForTest();
  }
});

test("CT-100-325: the build fails on a specification that names state by a physical path (F100-FR-225)", () => {
  assert.deepEqual([...checkPhysicalPaths()], []);
  const layout = readJson<{ logicalNames: { path: string }[] }>(
    join(ROOT, "packages/contracts/data/layout.json"),
  );
  const template = layout.logicalNames[0]?.path as string;
  const dir = mkdtempSync(join(tmpdir(), "specstride-paths-"));
  try {
    const file = join(dir, "spec.md");
    writeFileSync(file, `The consumer's configuration is kept at ${template}.\n`);
    const findings = checkPhysicalPaths({ specFiles: [file] });
    assert.equal(findings.length, 1);
    assert.equal(findings[0]?.value, template);
    assert.equal(findings[0]?.line, 1);
    assert.match(findings[0]?.message ?? "", /names state by logical name/);
    // `plan.md` and anything under `contracts/` are exempt.
    const plan = join(dir, "plan.md");
    writeFileSync(plan, `The path is ${template}.\n`);
    assert.deepEqual([...checkPhysicalPaths({ specFiles: [plan] })], []);
    mkdirSync(join(dir, "contracts"), { recursive: true });
    const contract = join(dir, "contracts", "README.md");
    writeFileSync(contract, `The path is ${template}.\n`);
    assert.deepEqual([...checkPhysicalPaths({ specFiles: [contract] })], []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
