/**
 * T093 — CT-109-42: the sample proves the harness adapter and the descriptor
 * (F109-FR-042).
 *
 * The conformance suite HC-01 to HC-17 runs on the SAMPLE of the test tree
 * (`./target.ts`), a harness adapter OUTSIDE the core. Every case passes. The
 * suite makes no paid and no external call: the only network step of the
 * whole suite is the refused loopback reach of the second form (HC-09). And
 * no file of a core package names the sample: the adapter stays outside.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CONFORMANCE_CASE_IDS,
  conformanceCases,
  runConformanceSuite,
} from "../../conformance/EP-02/suite.ts";
import { createSampleTarget } from "./target.ts";
import { coreFilesNamingASample } from "../../conformance/register-samples.ts";

test("CT-109-42: the whole conformance suite HC-01 to HC-17 passes on the sample", async () => {
  // The contract data and the suite agree on the case ids before anything runs.
  assert.deepEqual(
    conformanceCases().map((entry) => entry.id),
    [...CONFORMANCE_CASE_IDS],
  );

  const target = createSampleTarget();
  try {
    const result = await runConformanceSuite(target);
    const failed = result.cases.filter((entry) => !entry.passed);
    assert.deepEqual(
      failed,
      [],
      `the cases that failed: ${failed.map((entry) => `${entry.id}: ${entry.detail ?? ""}`).join(" | ")}`,
    );
    assert.deepEqual(
      result.cases.map((entry) => entry.id),
      [...CONFORMANCE_CASE_IDS],
    );
    assert.equal(result.passed, true);
    assert.equal(result.target, "ep02-sample");
  } finally {
    target.dispose();
  }
});

test("CT-109-42: the suite makes no paid call and no external non-loopback call", async () => {
  const target = createSampleTarget();
  try {
    const result = await runConformanceSuite(target);
    assert.equal(result.paidCalls, 0);
    assert.equal(result.externalCalls, 0);
  } finally {
    target.dispose();
  }
});

test("CT-109-42: no core file names the sample — the adapter stays outside the core", () => {
  const naming = coreFilesNamingASample().filter((entry) => entry.name.includes("EP-02"));
  assert.deepEqual(naming, []);
});
