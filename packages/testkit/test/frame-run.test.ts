/**
 * T276 — the contract tests CT-100-117, CT-100-118, CT-100-119, CT-100-120 and
 * CT-100-121 for the run of a conformance suite and the degradation (annex A,
 * §A.4; F100-FR-017 to F100-FR-021).
 *
 * The subjects are `src/conformance/run.ts` (T277), `degrade.ts` (T278) and
 * `register-samples.ts` (T279).
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_UNKNOWN_VALUE_RULE,
  FIELDS_A_DEGRADATION_NEVER_CARRIES,
  UNKNOWN_VALUE_CASES,
  hasCompatibilityPromise,
  INTERNAL_SEAM_POINT,
  standingOf,
} from "@specstride/contracts/ep/extension-point";
import { isEventEnvelope } from "@specstride/contracts/envelope/event";
import {
  loadExtensionPointContract,
  loadExtensionPointIndex,
  registryOf,
  resetFrame,
  type Implementation,
} from "../src/conformance/frame.ts";
import {
  DEGRADATION_CAUSES,
  DEGRADATION_EVENT_TYPE,
  FAILURE_SUB_HEADING,
  UNKNOWN_VALUE_SUB_HEADING,
  applyDefaultUnknownValueRule,
  eventIsAnEnvelope,
  guardedCall,
  holdsNoVerdictExitCodeOrStopReason,
  plainerPathOf,
  unknownValueRuleInForce,
} from "../src/conformance/degrade.ts";
import {
  SAMPLES_DIR,
  SAMPLE_CLASS,
  SAMPLE_MODULE,
  coreFilesNamingASample,
  corePackages,
  registerSamples,
  sampleDirectories,
} from "../src/conformance/register-samples.ts";
import { runSuite, lineOf, type ConformanceCase } from "../src/conformance/run.ts";
import {
  cases as sinkCases,
  implementation as sinkSample,
} from "../src/conformance/EP-08/contract.test.ts";
import { implementation as criticSample } from "../src/samples/EP-18/index.ts";
import { cases as criticCases } from "../src/conformance/EP-18/contract.test.ts";

const EVENT = Object.freeze({
  seq: 7,
  ts: "2026-10-01T00:00:00.000Z",
  runId: "run-1",
  launchId: "launch-1",
});

test("CT-100-117: a suite runs on a registered implementation and reports per case, with the point, the implementation, the class and the major (F100-FR-017)", async () => {
  resetFrame();
  const cases: readonly ConformanceCase[] = Object.freeze([
    {
      id: "CASE-pass",
      title: "a case that passes",
      level: "contract",
      proves: ["F100-FR-017"],
      run() {
        assert.equal(1, 1);
      },
    },
    {
      id: "CASE-fail",
      title: "a case that fails",
      level: "behaviour",
      proves: ["F100-FR-017"],
      run() {
        throw new Error("the case failed on purpose");
      },
    },
  ]);
  const implementation: Implementation = Object.freeze({
    ep: "EP-08",
    pointId: "specstride.event-sink/1",
    id: "an-implementation-under-test",
    implementationClass: "first-party",
    majors: [1],
    provenance: "default",
    operations: Object.freeze({}),
  });
  const report = await runSuite("specstride.event-sink/1", implementation, cases);
  assert.equal(report.ep, "EP-08");
  assert.equal(report.pointId, "specstride.event-sink/1");
  assert.equal(report.implementationId, "an-implementation-under-test");
  assert.equal(report.implementationClass, "first-party");
  assert.equal(report.major, 1);
  assert.equal(report.passed, false);
  // A report per case, in the order of the cases.
  assert.equal(report.cases.length, 2);
  assert.equal(report.cases[0]?.caseId, "CASE-pass");
  assert.equal(report.cases[0]?.passed, true);
  assert.equal(report.cases[0]?.level, "contract");
  assert.equal(report.cases[1]?.caseId, "CASE-fail");
  assert.equal(report.cases[1]?.passed, false);
  assert.equal(report.cases[1]?.level, "behaviour");
  assert.match(report.cases[1]?.message ?? "", /the case failed on purpose/);
  for (const one of report.cases) assert.equal(typeof one.durationMs, "number");
  // The line of the report names the point, the implementation, the class and
  // the major.
  const line = lineOf(report);
  assert.match(line, /EP-08/);
  assert.match(line, /specstride\.event-sink\/1/);
  assert.match(line, /impl=an-implementation-under-test/);
  assert.match(line, /class=first-party/);
  assert.match(line, /major 1/);
  // The implementation the registry did not accept: the suite refuses to run.
  await assert.rejects(
    () =>
      runSuite(
        "specstride.event-sink/1",
        { ...implementation, id: "third", implementationClass: "third-party" },
        cases,
      ),
    /the registry did not accept it/,
  );
  resetFrame();
});

test("CT-100-118: a sample registered from the test tree passes its suite, and no core file names it (F100-FR-018)", async () => {
  resetFrame();
  // The test tree holds one sample per point, and only there.
  const directories = sampleDirectories();
  assert.equal(SAMPLES_DIR, "packages/testkit/src/samples");
  assert.equal(SAMPLE_MODULE, "index.ts");
  assert.equal(directories.length, loadExtensionPointIndex().length);
  // `registerSamples()` registers every one with the class `first-party`.
  const records = await registerSamples();
  assert.equal(SAMPLE_CLASS, "first-party");
  assert.equal(records.length, 19);
  for (const record of records) {
    assert.equal(record.implementationClass, "first-party");
    assert.equal(record.major, 1);
  }
  // The suite of a point passes on its sample.
  const report = await runSuite("specstride.event-sink/1", sinkSample, sinkCases);
  assert.equal(report.passed, true, JSON.stringify(report.cases.filter((c) => !c.passed)));
  assert.equal(report.implementationId, sinkSample.id);
  // No core file names a sample, so adding or removing one changes no core file.
  assert.deepEqual(
    [...corePackages()],
    ["@specstride/core", "@specstride/layer-micro", "@specstride/layer-parallel"],
  );
  assert.deepEqual([...coreFilesNamingASample()], []);
  resetFrame();
});

test("CT-100-119: an implementation that throws, runs over its time or returns outside its result set degrades to the documented path, with an event and no verdict, code or stop reason of its own (F100-FR-019)", async () => {
  resetFrame();
  assert.deepEqual([...DEGRADATION_CAUSES], ["threw", "time-limit", "outside-result-set"]);
  const documented = plainerPathOf("EP-08");
  assert.equal(
    documented,
    loadExtensionPointContract("EP-08").sections[FAILURE_SUB_HEADING]?.join(" "),
  );
  assert.ok(documented.length > 0);

  // A throw.
  const threw = await guardedCall(
    () => {
      throw new Error("the sink threw");
    },
    { ep: "EP-08", implementationId: "a-sink", operation: "write", event: EVENT },
  );
  assert.equal(threw.degraded, true);
  if (!threw.degraded) return;
  assert.equal(threw.cause, "threw");
  assert.equal(threw.plainerPath, documented);

  // A run over the time limit.
  const slow = await guardedCall(
    () => new Promise((resolve) => setTimeout(() => resolve("late"), 200)),
    {
      ep: "EP-08",
      implementationId: "a-slow-sink",
      operation: "write",
      timeLimitMs: 10,
      event: { ...EVENT, seq: 8 },
    },
  );
  assert.equal(slow.degraded, true);
  if (slow.degraded) {
    assert.equal(slow.cause, "time-limit");
    assert.equal(slow.plainerPath, documented);
  }

  // A result outside the closed result set of the point.
  const outside = await guardedCall(() => "something-else", {
    ep: "EP-04",
    implementationId: "a-layer",
    operation: "afterPass",
    resultSet: ["accept", "refuse", "none"],
    event: { ...EVENT, seq: 9 },
  });
  assert.equal(outside.degraded, true);
  if (outside.degraded) {
    assert.equal(outside.cause, "outside-result-set");
    assert.equal(outside.plainerPath, plainerPathOf("EP-04"));
    assert.match(outside.detail, /outside the closed result set/);
  }
  // A result inside the set is no degradation.
  const inside = await guardedCall(() => "none", {
    ep: "EP-04",
    implementationId: "a-layer",
    operation: "afterPass",
    resultSet: ["accept", "refuse", "none"],
    event: { ...EVENT, seq: 10 },
  });
  assert.equal(inside.degraded, false);
  if (!inside.degraded) assert.equal(inside.value, "none");

  // The degradation is recorded as an event of the envelope, and it carries no
  // verdict, no exit code and no stop reason.
  for (const degraded of [threw, slow, outside]) {
    if (!degraded.degraded) continue;
    assert.equal(eventIsAnEnvelope(degraded), true);
    assert.equal(isEventEnvelope(degraded.event), true);
    assert.equal(degraded.event.type, DEGRADATION_EVENT_TYPE);
    assert.equal(degraded.event.data["cause"], degraded.cause);
    assert.equal(degraded.event.data["plainerPath"], degraded.plainerPath);
    assert.equal(holdsNoVerdictExitCodeOrStopReason(degraded), true);
    for (const field of FIELDS_A_DEGRADATION_NEVER_CARRIES) {
      assert.equal(field in degraded, false, field);
      assert.equal(field in degraded.event.data, false, field);
    }
  }
  // The check is not vacuous: a record that did carry one would fail it.
  const withAVerdict = { ...threw, verdict: "REJECTED" } as unknown as typeof threw & object;
  assert.equal(
    holdsNoVerdictExitCodeOrStopReason(withAVerdict as never),
    false,
    "the check must catch a verdict",
  );
  resetFrame();
});

test("CT-100-120: EP-18 is marked internal in the report of its suite, and EP-01 to EP-17 and EP-19 are public contracts (F100-FR-020)", async () => {
  resetFrame();
  await registerSamples();
  const report = await runSuite("specstride.critic-strategy/1", criticSample, criticCases);
  assert.equal(report.ep, "EP-18");
  assert.equal(report.internalSeam, true);
  assert.equal(report.standing, "internal-seam");
  assert.match(lineOf(report), /\[internal seam\]/);
  assert.equal(INTERNAL_SEAM_POINT, "EP-18");
  for (const entry of loadExtensionPointIndex()) {
    const expected = entry.ep === "EP-18" ? "internal-seam" : "public-contract";
    assert.equal(standingOf(entry.ep), expected, entry.ep);
    assert.equal(hasCompatibilityPromise(entry.ep), entry.ep !== "EP-18", entry.ep);
    assert.equal(registryOf(entry.ep).standing, expected, entry.ep);
  }
  const sink = await runSuite("specstride.event-sink/1", sinkSample, sinkCases);
  assert.equal(sink.internalSeam, false);
  assert.equal(/\[internal seam\]/.test(lineOf(sink)), false);
  resetFrame();
});

test("CT-100-121: the default unknown-value rule holds where a point states nothing more specific (F100-FR-021)", () => {
  resetFrame();
  assert.deepEqual(
    [...UNKNOWN_VALUE_CASES],
    ["unknown-field", "unknown-closed-member", "unknown-open-member"],
  );
  assert.equal(
    DEFAULT_UNKNOWN_VALUE_RULE["unknown-field"],
    "ignored by a reader and kept by a writer that copies the record",
  );
  assert.equal(
    DEFAULT_UNKNOWN_VALUE_RULE["unknown-closed-member"],
    "refuses the record with a message that names the set and the value",
  );
  assert.equal(
    DEFAULT_UNKNOWN_VALUE_RULE["unknown-open-member"],
    "resolved through the registry and refused only if no entry matches",
  );

  // An unknown field: ignored by a reader, kept by a writer that copies.
  const field = applyDefaultUnknownValueRule("unknown-field", "somethingNew", "a record");
  assert.equal(field.ignoredByAReader, true);
  assert.equal(field.keptByACopyingWriter, true);
  assert.equal(field.refused, undefined);

  // An unknown member of a closed set: the record is refused, and the message
  // names the set and the value.
  const closed = applyDefaultUnknownValueRule("unknown-closed-member", "nope", "Verdicts");
  assert.equal(closed.refused, true);
  assert.match(closed.message ?? "", /"nope"/);
  assert.match(closed.message ?? "", /"Verdicts"/);

  // An unknown member of an open set: resolved through the registry, refused
  // only if no entry matches.
  const matched = applyDefaultUnknownValueRule(
    "unknown-open-member",
    "a-harness",
    "Harnesses",
    true,
  );
  assert.equal(matched.resolvedThroughTheRegistry, true);
  assert.equal(matched.refused, false);
  const unmatched = applyDefaultUnknownValueRule(
    "unknown-open-member",
    "a-harness",
    "Harnesses",
    false,
  );
  assert.equal(unmatched.refused, true);
  assert.match(unmatched.message ?? "", /no entry of the registry/);

  // Every point states its own rule under the sub-heading, and the default is
  // the fallback of every point.
  for (const entry of loadExtensionPointIndex()) {
    const inForce = unknownValueRuleInForce(entry.ep);
    assert.equal(inForce.ep, entry.ep);
    assert.deepEqual(inForce.fallback, DEFAULT_UNKNOWN_VALUE_RULE);
    assert.equal(
      inForce.stated,
      (loadExtensionPointContract(entry.ep).sections[UNKNOWN_VALUE_SUB_HEADING] ?? [])
        .join(" ")
        .trim(),
    );
    // Where a point states nothing more specific, the default alone holds.
    if (inForce.stated === "") assert.equal(inForce.statesNothingMoreSpecific, true);
    else assert.equal(inForce.statesNothingMoreSpecific, false);
  }
  resetFrame();
});
