/**
 * T158 — the acceptance run over all nineteen points, CT-100-322 (annex X,
 * §X.10, F100-FR-222; annex A, §A.4, F100-FR-018; F100-SC-001).
 *
 * `registerSamples()` and then `runSuite` for every point of
 * `contracts/extension-points/index.json`: every suite passes on its sample,
 * and the report names nineteen points. The same run is the script
 * `conformance` of the package without an argument (T277), which this file
 * also executes, so that the script and the test cannot drift.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import process from "node:process";
import {
  EXTENSION_POINT_COUNT,
  ROOT,
  loadExtensionPointIndex,
  resetFrame,
} from "../src/conformance/frame.ts";
import { registerSamples } from "../src/conformance/register-samples.ts";
import { runEverySuite, lineOf } from "../src/conformance/run.ts";

test("CT-100-322: `registerSamples()` then `runSuite` for every point; every suite passes on its sample, and the report names nineteen points (F100-FR-222, F100-FR-018, F100-SC-001)", async () => {
  resetFrame();
  const index = loadExtensionPointIndex();
  assert.equal(index.length, EXTENSION_POINT_COUNT);
  assert.equal(EXTENSION_POINT_COUNT, 19);

  const registered = await registerSamples();
  assert.equal(registered.length, 19, "one sample per point, from the test tree");

  const report = await runEverySuite();
  // The report names nineteen points, each once, in the order of the index.
  assert.equal(report.points.length, 19);
  assert.deepEqual(
    [...report.points],
    index.map((e) => e.ep),
  );
  assert.equal(new Set(report.points).size, 19);
  assert.equal(report.suites.length, 19);

  // Every suite passes on its sample.
  const failures = report.suites.flatMap((s) =>
    s.cases.filter((c) => !c.passed).map((c) => `${s.ep} ${c.caseId}: ${c.message}`),
  );
  assert.deepEqual(failures, [], failures.join("\n"));
  assert.equal(report.passed, true);

  for (const suite of report.suites) {
    assert.equal(suite.implementationClass, "first-party");
    assert.equal(suite.major, 1);
    assert.ok(suite.cases.length > 0, `${suite.ep} has no case`);
    assert.equal(suite.internalSeam, suite.ep === "EP-18");
    assert.match(lineOf(suite), new RegExp(`^${suite.ep} `));
    const sample = registered.find((r) => r.ep === suite.ep);
    assert.equal(suite.implementationId, sample?.implementationId);
  }
  resetFrame();
});

test("CT-100-322: the script `conformance` without an argument runs the same nineteen points and exits 0, and with a point argument runs that one (T277, T158)", () => {
  const node = process.execPath;
  const runner = join(ROOT, "packages/testkit/src/conformance/run.ts");
  const all = execFileSync(node, [runner], { cwd: ROOT, encoding: "utf8" });
  for (const entry of loadExtensionPointIndex()) {
    assert.match(all, new RegExp(`^${entry.ep} `, "m"), `the report does not name ${entry.ep}`);
  }
  assert.match(all, /conformance: 19 point\(s\) of 19, \d+ case\(s\), 0 failure\(s\)/);
  assert.match(all, /EP-18 .*\[internal seam\]/);

  const one = execFileSync(node, [runner, "EP-08"], { cwd: ROOT, encoding: "utf8" });
  assert.match(one, /^EP-08 /m);
  assert.match(one, /conformance: 1 point\(s\) of 19, \d+ case\(s\), 0 failure\(s\)/);
  assert.equal(/^EP-02 /m.test(one), false);

  // A point the index does not hold is a usage error, exit 2.
  let code = 0;
  try {
    execFileSync(node, [runner, "EP-99"], { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
  } catch (error) {
    code = (error as { status?: number }).status ?? 0;
  }
  assert.equal(code, 2);
});
