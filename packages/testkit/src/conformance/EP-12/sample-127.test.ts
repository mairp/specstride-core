/**
 * T082 of feature 127 — the conformance suite of EP-12 run against the SAMPLE
 * CLASSIFIER OUTSIDE THE CORE whose limit signal is declared as data
 * (F127-SC-011, F127-FR-008).
 *
 * The suite is the one of EP-12, whole: the contract-level cases of feature
 * 100 (`./contract.test.ts`) and the behaviour cases this feature owns
 * (`./behaviour-127.ts`). It is not rebuilt here — the case list is imported
 * from the suite module, so that the sample is held to exactly what the point
 * demands of any implementation.
 *
 * The implementation under test is `../../samples/EP-12/sample-127.ts`, which
 * reads its signals from the `failures` map of a fake-harness descriptor and
 * its rules from a second data file. It is registered with the registry of the
 * point by `runSuite`, so a refusal of the registry fails the run.
 *
 * The result is a DURABLE RECORD and not a return value: the report is written
 * atomically to a file, then read back off the medium by a second, independent
 * read and checked there, with a content hash of the canonical hasher that
 * could not exist before the run.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { atomicWriteJson } from "@specstride/kernel/atomic-write";
import { contentHash } from "@specstride/kernel/hasher";
import { POINT_ID } from "@specstride/contracts/ep/quota-classifier";
import {
  DATA_FILES,
  DECLARED_RULES,
  DECLARES_A_LIMIT_SIGNAL,
  DESCRIPTOR,
  implementation as sample,
} from "../../samples/EP-12/sample-127.ts";
import { coreFilesNamingASample, corePackages } from "../register-samples.ts";
import { runSuite, REPORT_MODE_VARIABLE, type ConformanceCase } from "../run.ts";
import { ROOT } from "../frame.ts";

/**
 * The suite module of the point registers its cases as tests of `node:test`
 * at load, against feature 100's own sample. Report mode switches that off
 * while the case list is imported here, so the cases run once, against the
 * sample under test, and the count of this file stays its own.
 */
const beforeImport = process.env[REPORT_MODE_VARIABLE];
process.env[REPORT_MODE_VARIABLE] = "1";
const suiteModule = (await import("./contract.test.ts")) as {
  cases: readonly ConformanceCase[];
};
if (beforeImport === undefined) delete process.env[REPORT_MODE_VARIABLE];
else process.env[REPORT_MODE_VARIABLE] = beforeImport;

const cases = suiteModule.cases;

/** The run, once, for every case below. */
const report = await runSuite(POINT_ID, sample, cases);

/** Where the durable record of the run goes. */
const directory = mkdtempSync(join(tmpdir(), "specstride-127-ep12-"));
const recordPath = join(directory, "ep12-conformance.report.json");
const record = {
  schema: "specstride.conformance-report/1-of-T082",
  pointId: report.pointId,
  ep: report.ep,
  implementationId: report.implementationId,
  implementationClass: report.implementationClass,
  major: report.major,
  passed: report.passed,
  caseCount: report.cases.length,
  cases: report.cases.map((one) => ({
    caseId: one.caseId,
    level: one.level,
    passed: one.passed,
    message: one.message ?? null,
  })),
  dataFiles: [...DATA_FILES],
  declaredRuleCount: DECLARED_RULES.length,
};
atomicWriteJson(recordPath, record);

/**
 * The verdict, read from the medium and from nothing else. A report that is
 * not there, or that is there and says a case failed, is NOT a pass: the
 * negative case below holds this function to that.
 */
export function verdictOf(path: string): {
  passed: boolean;
  caseCount: number;
  failures: readonly string[];
} {
  if (!existsSync(path)) {
    throw new Error(`no conformance report at ${path}: there is no durable effect to read`);
  }
  const held = JSON.parse(readFileSync(path, "utf8")) as typeof record;
  const failures = held.cases
    .filter((one) => !one.passed)
    .map((one) => `${one.caseId}: ${one.message ?? "the case failed"}`);
  return {
    passed: held.passed === true && failures.length === 0 && held.caseCount >= 10,
    caseCount: held.caseCount,
    failures: Object.freeze(failures),
  };
}

test("T082: the fake-harness descriptor of the test tree declares a limit signal (F127-FR-008)", () => {
  assert.equal(DESCRIPTOR.descriptorVersion, 1);
  assert.equal(DESCRIPTOR.id, "fake-limit-harness");
  assert.equal(
    DECLARES_A_LIMIT_SIGNAL,
    true,
    "the `failures` map of the descriptor declares the limit signal `quota_exhausted`",
  );
  // The signal is DATA: a stream record, statuses, body patterns and an exit
  // code, each naming the class of §Q.1 it refines into.
  const limit = (DESCRIPTOR.failures as Record<string, { rules: Record<string, unknown>[] }>)
    .quota_exhausted.rules;
  assert.ok(limit.length >= 5, "the limit signal is declared by several rules");
  assert.ok(
    limit.some((rule) => Array.isArray(rule.streamRecords)),
    "a structured stream record is declared",
  );
  assert.ok(
    limit.some((rule) => Array.isArray(rule.statuses)),
    "a status is declared",
  );
  assert.ok(
    limit.some((rule) => Array.isArray(rule.bodyPatterns)),
    "a body pattern is declared",
  );
  assert.ok(
    limit.some((rule) => Array.isArray(rule.exitCodes)),
    "an exit code is declared",
  );
  assert.equal(DECLARED_RULES.length, 13, "thirteen declared rules in all");

  // Both data files are in the test tree, and both really exist there.
  for (const file of DATA_FILES) {
    assert.match(file, /^packages\/testkit\/src\/samples\/EP-12\//);
    assert.ok(existsSync(join(ROOT, file)), `${file} exists`);
  }
});

test("T082: the registry of EP-12 accepted the sample from outside the core", () => {
  assert.equal(report.implementationId, "sample-descriptor-quota-classifier");
  assert.equal(report.implementationClass, "first-party");
  assert.equal(report.pointId, "specstride.quota-classifier/1");
  assert.equal(report.ep, "EP-12");
  assert.equal(report.major, 1);
  assert.equal(report.internalSeam, false);
});

test("T082: the conformance suite of EP-12 passes on the sample classifier", () => {
  // The suite is the whole one of the point: the contract-level cases of
  // feature 100 and the behaviour cases of feature 127.
  assert.ok(report.cases.length >= 10, `the suite ran ${report.cases.length} cases`);
  assert.ok(
    report.cases.some((one) => one.level === "contract"),
    "the contract-level cases of feature 100 ran",
  );
  assert.ok(
    report.cases.some((one) => one.level === "behaviour"),
    "the behaviour cases of feature 127 ran",
  );
  assert.ok(
    report.cases.some((one) => one.caseId === "CT-100-209"),
    "the named contract case of the point ran",
  );
  for (const id of ["CT-127-EP12-1", "CT-127-EP12-2", "CT-127-EP12-3", "CT-127-EP12-4"]) {
    assert.ok(
      report.cases.some((one) => one.caseId === id),
      `the behaviour case ${id} ran`,
    );
  }

  const failed = report.cases.filter((one) => !one.passed);
  assert.deepEqual(
    failed.map((one) => `${one.caseId}: ${one.message}`),
    [],
    "every case of the suite passed on the sample",
  );
  assert.equal(report.passed, true);
});

test("T082: the result is read back off the medium, with a content hash (effect witness)", () => {
  // An independent read path: the file is opened again and parsed, and the
  // report object above is not consulted for the verdict.
  assert.ok(existsSync(recordPath), "the report was written");
  const bytes = readFileSync(recordPath);
  const onDisk = JSON.parse(bytes.toString("utf8")) as typeof record;

  assert.equal(onDisk.schema, "specstride.conformance-report/1-of-T082");
  assert.equal(onDisk.ep, "EP-12");
  assert.equal(onDisk.pointId, "specstride.quota-classifier/1");
  assert.equal(onDisk.implementationId, "sample-descriptor-quota-classifier");
  assert.equal(onDisk.implementationClass, "first-party");
  assert.equal(onDisk.passed, true, "the record on the medium says the suite passed");
  assert.ok(onDisk.caseCount >= 10);
  assert.equal(
    onDisk.cases.filter((one) => !one.passed).length,
    0,
    "no case of the record on the medium failed",
  );
  assert.deepEqual(onDisk.dataFiles, [...DATA_FILES]);

  // A durable identity that could not exist before the run.
  const hash = contentHash(bytes);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.equal(hash, contentHash(readFileSync(recordPath)), "the hash is stable on re-reading");
});

test("T082: the sample is outside the core — no core file names a sample (F127-SC-011)", () => {
  // The invariant that makes the removal of a sample a change of no core file.
  // The removal itself, with the hashes before and after, is the witness of
  // `./sample-removal-127.test.ts`.
  assert.deepEqual(
    coreFilesNamingASample().map((one) => `${one.file}:${one.line} ${one.name}`),
    [],
    "no core file names the sample tree",
  );
  const core = corePackages();
  assert.ok(core.length > 0, "the graph names at least one core package");
  for (const file of DATA_FILES) {
    for (const pkg of core) {
      assert.ok(
        !file.startsWith(`packages/${pkg.replace("@specstride/", "")}/`),
        `${file} is not in the core package ${pkg}`,
      );
    }
  }
});

test("T082: the witness rejects a report that is absent or that says a case failed (negative case)", () => {
  // The real report, read off the medium, is the pass.
  const real = verdictOf(recordPath);
  assert.equal(real.passed, true);
  assert.deepEqual([...real.failures], []);

  // A report that says a case failed is not a pass, however successful the
  // run looked: the verdict comes from the file.
  const tamperedPath = join(directory, "tampered.report.json");
  atomicWriteJson(tamperedPath, {
    ...record,
    passed: false,
    cases: [
      ...record.cases.slice(1),
      { caseId: "CT-100-209", level: "contract", passed: false, message: "a made-up failure" },
    ],
  });
  const tampered = verdictOf(tamperedPath);
  assert.equal(tampered.passed, false, "a failing case in the record is not a pass");
  assert.deepEqual([...tampered.failures], ["CT-100-209: a made-up failure"]);

  // And no report at all is an error, never a silent pass.
  assert.throws(
    () => verdictOf(join(directory, "there-is-no-such-report.json")),
    /no durable effect to read/,
  );
});
