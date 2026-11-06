/**
 * CT-141-145 — packaging and order (T146; F141-FR-045, R18 O-12).
 *
 * What the test proves.
 *
 * - **the product package holds no file of the oracle, no stub and no fixture**
 *   (F141-FR-045): the static check of `src/release/no-oracle-path.ts` passes
 *   over this repository as it stands — the oracle is private and at layer `dev`,
 *   outside the published set of `package-graph.json`, and no package of the
 *   product imports it, names `packages/oracle/`, or names its stubs, fixtures or
 *   golden captures. The check is also shown NOT to be vacuous: the same two
 *   finders over a synthetic product root that DOES import the oracle and name a
 *   stub produce findings, and `assertNoOraclePath` throws there;
 * - **the steps of the order of construction are recorded as done in order**
 *   (R18 O-12): `specs/141-parity-oracle/tasks.md` records the four steps of
 *   O-12 — stubs and the first three families, then the normalizer and the
 *   layout table, then the exercise map and the remaining fixtures, then the
 *   second suite — and every task of every step is checked, the steps in file
 *   order, with no task of a later step checked before a task of an earlier one.
 *   The only tasks of the span that are not checked are the two the owner ruled
 *   out of band (T067, T074 — macOS, never run on Linux), and they are recorded
 *   as such in the file.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  isSanctionedTestKit,
  assertNoOraclePath,
  devPackages,
  directoryOf,
  productOffersNothingForTheOracleAlone,
  productPackageHoldsNoFileOfTheOracle,
  productPackages,
  publishedPackages,
  REPOSITORY_ROOT,
  sourceFilesOf,
} from "../../src/release/no-oracle-path.ts";

/** The four steps of the order of construction (R18 O-12), as tasks.md records them. */
const ORDER_OF_CONSTRUCTION: readonly {
  readonly step: number;
  readonly what: string;
  readonly tasks: readonly string[];
}[] = Object.freeze([
  {
    step: 1,
    what: "stubs and FX-01, FX-02, FX-35 (dry run): proves the harness end to end",
    tasks: ["T015", "T039", "T040", "T041", "T042", "T043", "T044", "T051"],
  },
  {
    step: 2,
    what: "the normalizer N-01 to N-08 and the layout table",
    tasks: ["T052", "T053", "T054", "T055", "T056", "T057"],
  },
  {
    step: 3,
    what: "the exercise map, then the remaining fixtures in the order of uncovered clusters",
    tasks: [
      "T080",
      "T081",
      "T082",
      "T083",
      "T084",
      "T085",
      "T086",
      "T087",
      "T088",
      "T089",
      "T090",
      "T091",
      "T092",
      "T093",
      "T094",
      "T095",
      "T096",
      "T097",
      "T098",
      "T099",
      "T100",
      "T101",
      "T102",
      "T103",
      "T104",
      "T105",
      "T106",
      "T107",
      "T108",
      "T109",
      "T110",
      "T111",
      "T112",
      "T113",
    ],
  },
  {
    step: 4,
    what: "the second suite, once the layer exists",
    tasks: ["T136", "T137", "T138", "T139", "T140", "T141", "T142", "T143", "T144", "T145"],
  },
]);

/** The tasks the owner ruled out of band (macOS; never run, never faked). */
const OUT_OF_BAND = new Set(["T067", "T074"]);

/** The checkbox state of every task id in specs/141-parity-oracle/tasks.md. */
function checkboxStateOf(tasksFile: string): Map<string, { done: boolean; at: number }> {
  const lines = readFileSync(tasksFile, "utf8").split("\n");
  const state = new Map<string, { done: boolean; at: number }>();
  lines.forEach((line, index) => {
    const match = /^(?:- \[[ x]\] )?(?:\* )?T(\d{3})\b/.exec(line.trim());
    if (match === null) return;
    const id = `T${match[1] as string}`;
    if (!state.has(id)) state.set(id, { done: line.includes("[x]"), at: index });
  });
  return state;
}

test("CT-141-145: the product package holds no file of the oracle, no stub and no fixture", () => {
  // The manifest: private, layer dev, never shipped, no install script — npm
  // refuses to publish it at all.
  const manifest = JSON.parse(
    readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
  ) as { private?: boolean; specstride?: { layer?: string; shipped?: string } };
  assert.equal(manifest.private, true);
  assert.equal(manifest.specstride?.layer, "dev");
  assert.equal(manifest.specstride?.shipped, "never");

  // The oracle is at layer dev and outside the published set.
  assert.equal(devPackages().includes("@specstride/oracle"), true);
  assert.equal(publishedPackages().includes("@specstride/oracle"), false);

  // No package of the product is the oracle, and none of them imports it or
  // names its stubs, fixtures or golden captures.
  assert.equal(productPackages().includes("@specstride/oracle"), false);
  assert.deepEqual(productOffersNothingForTheOracleAlone(), []);
  assert.deepEqual(productPackageHoldsNoFileOfTheOracle(), []);
  assertNoOraclePath();

  // And directly, not only through the check: no file under a product package
  // names `packages/oracle/` in any form. The sanctioned test kits of
  // `no-oracle-path.ts` are exempt here too: they name the oracle because they
  // verify the product against it or explain its absence, not to reach it.
  for (const name of productPackages()) {
    for (const file of sourceFilesOf(directoryOf(name))) {
      if (isSanctionedTestKit(file)) continue;
      const text = readFileSync(join(REPOSITORY_ROOT, file), "utf8");
      assert.equal(/packages\/oracle\b/.test(text), false, `${file} names the oracle package`);
    }
  }
});

test("CT-141-145: the check is not vacuous — a product that ships the oracle is caught", () => {
  const root = mkdtempSync(join(tmpdir(), "oracle-packaging-"));
  const product = join(root, "packages", "cli");
  mkdirSync(product, { recursive: true });
  writeFileSync(
    join(product, "leak.ts"),
    [
      'import { execFileSync } from "node:child_process";',
      'import x from "@specstride/oracle/stubs/lib/proposer.ts";',
      'const stub = "packages/oracle/stubs/bin/claude";',
      "export const run = (): string => execFileSync(stub, []) + String(x);",
    ].join("\n"),
    "utf8",
  );
  const findings = productPackageHoldsNoFileOfTheOracle(root);
  assert.equal(
    findings.some((f) => f.what.includes("names a stub or a fixture of the oracle")),
    true,
    `no stub finding in ${JSON.stringify(findings)}`,
  );
  const offered = productOffersNothingForTheOracleAlone(root);
  assert.equal(
    offered.some((f) => f.what.includes("an import of the package of the oracle")),
    true,
    `no import finding in ${JSON.stringify(offered)}`,
  );
  assert.throws(() => assertNoOraclePath(root), /file of the oracle/);
});

test("CT-141-145: the steps of the order of construction are recorded as done in order", () => {
  const tasksFile = join(REPOSITORY_ROOT, "specs", "141-parity-oracle", "tasks.md");
  assert.equal(existsSync(tasksFile), true, `${tasksFile} exists`);
  const state = checkboxStateOf(tasksFile);

  // Every task of every step exists and is recorded done.
  const ends: number[] = [];
  for (const step of ORDER_OF_CONSTRUCTION) {
    for (const id of step.tasks) {
      const record = state.get(id);
      assert.ok(record !== undefined, `${id} (step ${step.step}) is in tasks.md`);
      if (OUT_OF_BAND.has(id)) {
        assert.equal(record.done, false, `${id} is out of band and stays unchecked`);
        continue;
      }
      assert.equal(record.done, true, `${id} (step ${step.step}: ${step.what}) is checked`);
    }
    ends.push(Math.max(...step.tasks.map((id) => state.get(id)!.at)));
  }

  // In order: every step's last task is recorded before the next step's first.
  for (let i = 1; i < ORDER_OF_CONSTRUCTION.length; i += 1) {
    const starts = ORDER_OF_CONSTRUCTION[i]!.tasks.map((id) => state.get(id)!.at);
    assert.equal(
      Math.min(...starts) > ends[i - 1]!,
      true,
      `step ${ORDER_OF_CONSTRUCTION[i]!.step} is recorded after step ${ORDER_OF_CONSTRUCTION[i - 1]!.step}`,
    );
  }

  // No gap: between the first task of step 1 and the last task of step 4 there
  // is no unchecked task other than the two the owner ruled out of band.
  const first = Math.min(...ORDER_OF_CONSTRUCTION[0]!.tasks.map((id) => state.get(id)!.at));
  const last = ends[ends.length - 1]!;
  for (const [id, record] of state) {
    if (record.at < first || record.at > last) continue;
    if (OUT_OF_BAND.has(id)) continue;
    assert.equal(
      record.done,
      true,
      `${id}, inside the span of the order of construction, is checked`,
    );
  }
});
