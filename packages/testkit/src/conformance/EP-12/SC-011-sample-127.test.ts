/**
 * T086, F127-SC-011 (the EP-12 half) — "the conformance suite of EP-12 passes
 * with a sample classifier outside the core with 0 core files changed".
 *
 * The other half of F127-SC-011 — one classifier fixture per tested harness
 * that has a captured quota signal — is measured in
 * `packages/policy/test/success-criteria-127.test.ts`, which can read the
 * fixture manifest of feature 127. This half lives here because it runs the
 * suite of the point against the sample, which lives in this package.
 *
 * This is NOT a second copy of T082's test (`./sample-127.test.ts`): that one
 * proves the sample and the removal; this one MEASURES the outcome the success
 * criterion states and writes the figure into the one record of T086,
 * `packages/policy/test/success-criteria-127.md`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { POINT_ID } from "@specstride/contracts/ep/quota-classifier";
import { implementation as sample } from "../../samples/EP-12/sample-127.ts";
import { coreFilesNamingASample } from "../register-samples.ts";
import { runSuite, REPORT_MODE_VARIABLE, type ConformanceCase } from "../run.ts";
import { ROOT } from "../frame.ts";

const RECORD_PATH = join(ROOT, "packages", "policy", "test", "success-criteria-127.md");
const REPORT_MODE = process.env.SPECSTRIDE_SC_RECORD === "1";

/** Hold the one record of T086 to what this run measured. */
function recorded(id: string, measured: string): void {
  if (REPORT_MODE) {
    process.stdout.write(`RECORD ${id} :: ${measured}\n`);
    return;
  }
  const record = readFileSync(RECORD_PATH, "utf8");
  const row = record.split("\n").find((line) => line.startsWith(`| ${id} |`));
  assert.ok(row !== undefined, `the record has no row for ${id}`);
  const cells = row.split("|").map((cell) => cell.trim());
  assert.equal(cells[3], measured, `${id}: the record must state what this run measured`);
  assert.equal(cells[4], "met", `${id}: the verdict of the record`);
}

/**
 * The case list of the point, imported in report mode so the suite module
 * registers no tests of its own in this file's count.
 */
const beforeImport = process.env[REPORT_MODE_VARIABLE];
process.env[REPORT_MODE_VARIABLE] = "1";
const suiteModule = (await import("./contract.test.ts")) as { cases: readonly ConformanceCase[] };
if (beforeImport === undefined) delete process.env[REPORT_MODE_VARIABLE];
else process.env[REPORT_MODE_VARIABLE] = beforeImport;

const report = await runSuite(POINT_ID, sample, suiteModule.cases);

test("F127-SC-011 (EP-12): the suite passes against the sample outside the core, 0 core files naming it", () => {
  const failures = report.cases.filter((one) => !one.passed);
  assert.equal(failures.length, 0, failures.map((one) => one.caseId).join(", "));
  assert.equal(report.passed, true);
  assert.ok(report.cases.length >= 10, "the suite of the point, whole");
  assert.equal(report.implementationClass, "first-party");

  const naming = coreFilesNamingASample(ROOT);
  assert.deepEqual(
    naming.map((one) => `${one.file}:${one.line}`),
    [],
    "no core file names a sample (F100-FR-018, the rule `core:names-sample`)",
  );

  recorded(
    "F127-SC-011 (EP-12)",
    `${report.cases.length - failures.length}/${report.cases.length} cases of the conformance ` +
      `suite of EP-12 passed against the sample classifier outside the core; ` +
      `${naming.length} core files name a sample`,
  );
});
