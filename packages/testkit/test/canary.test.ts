/**
 * T203 — the canary test CT-100-319 (annex X, §X.9; F100-FR-219, F100-SC-008;
 * quickstart.md, scenario 7).
 *
 * With content capture ON, canaries planted in the prompt, the reply of the
 * model, tool arguments, tool output, phase evidence, the output of a check and
 * the consumer's comment appear in NO sink. The run is against the sample sink
 * of T111 (EP-08), the sample view of T149 (EP-09) and the stub redactor of
 * T284. The script is `test:canary`.
 *
 * What this run proves and what it does not: the stub redactor holds no pattern
 * of its own, so a pass shows that the runtime registers what it resolves and
 * that every sink sits behind the one point of redaction. Feature 111 runs the
 * SAME harness against the real redactor and its pattern set; that run is the
 * release condition (F100-SC-008, and the second release condition of T225).
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  CANARY_COUNT,
  CANARY_PLACES,
  CANARY_PREFIX,
  REQUIREMENT,
  WHERE,
  createStubCheckRunner,
  createStubHarness,
  plantCanaries,
  plantEverything,
  plantedComment,
  plantedPhaseEvidence,
  plantingIsSound,
  registerCanaries,
} from "../src/canary/plant.ts";
import {
  CONTENT_CAPTURE,
  SCANNED_SINKS,
  formatReport,
  runAndScan,
  runCanaryHarness,
  scanSinks,
} from "../src/canary/scan.ts";
import { createStubRedactor } from "../src/canary/stub-redactor.ts";
import { kept as sampleSinkEvents } from "../src/samples/EP-08/index.ts";

test("CT-100-319: the seven canaries are planted at the seven places of F100-FR-219", async () => {
  assert.equal(REQUIREMENT, "F100-FR-219");
  assert.equal(CANARY_COUNT, 7);
  const planting = plantCanaries();
  assert.equal(planting.plan.length, 7);
  assert.equal(new Set(planting.values).size, 7, "seven DISTINCT canary secrets");
  for (const canary of planting.plan) {
    assert.ok(canary.value.startsWith(CANARY_PREFIX), canary.value);
    assert.equal(canary.where, WHERE[canary.place]);
    assert.equal(planting.valueOf(canary.place), canary.value);
    assert.equal(planting.placeOf(canary.value), canary.place);
  }
  assert.equal(planting.placeOf("not a canary"), undefined);

  // Every place holds its own canary, and no place holds the canary of another.
  const artefacts = await plantEverything(planting);
  const sound = plantingIsSound(planting, artefacts);
  assert.deepEqual([...sound.problems], []);
  assert.equal(sound.sound, true);
  for (const place of CANARY_PLACES) {
    assert.ok(
      artefacts[place].includes(planting.valueOf(place)),
      `the canary of ${place} is in ${WHERE[place]}`,
    );
  }
});

test("CT-100-319: the planting drives the stub harness and the stub check runner", async () => {
  const planting = plantCanaries("drives-the-samples");
  // The stub harness is the sample of T098 with the four canaries around it.
  const harness = createStubHarness(planting);
  const pass = await harness.runPass({ promptBody: "Do the work of the phase." });
  assert.ok(pass.prompt.includes(planting.valueOf("prompt")));
  assert.ok(pass.reply.includes(planting.valueOf("reply")));
  assert.equal(pass.toolCalls.length, 1);
  assert.ok(pass.toolCalls[0]?.arguments.includes(planting.valueOf("tool-arguments")));
  assert.ok(pass.toolCalls[0]?.output.includes(planting.valueOf("tool-output")));
  // The seam is the real one: the handle and the completion come from the sample.
  assert.equal(pass.handle.pid, 0);
  assert.equal(pass.completion.reply, "VERDICT: REJECTED");
  assert.equal(pass.completion.initialRecord?.sessionId, "canary-session");

  // The stub check runner is the sample of T105 with the canary in the output.
  const runner = createStubCheckRunner(planting);
  const check = await runner.run("pass");
  assert.ok(check.output.includes(planting.valueOf("check-output")));
  assert.equal(check.result.exitCode, 0);
  // The result of the sample carries a REFERENCE to the output and no content.
  assert.equal(check.result.output?.logicalName, "attempt:1:1:1:check-output");
  assert.ok(!JSON.stringify(check.result).includes(planting.valueOf("check-output")));

  // The two artefacts the run writes itself.
  assert.ok(plantedPhaseEvidence(planting).includes(planting.valueOf("phase-evidence")));
  assert.ok(plantedComment(planting).includes(planting.valueOf("comment")));
});

test("CT-100-319: with content capture on, no canary appears in any sink", async () => {
  assert.equal(CONTENT_CAPTURE, true, "the canaries are planted with content capture ON");
  const redactor = createStubRedactor();
  const planting = plantCanaries();
  const { run, report } = await runAndScan({ redactor, planting });

  // Every sink was read, and every canary was searched for.
  assert.deepEqual([...report.sinksRead], [...SCANNED_SINKS]);
  assert.equal(report.sinksRead.length, 5);
  assert.equal(report.canariesSearched, CANARY_COUNT);
  for (const sink of SCANNED_SINKS) {
    assert.ok(run.sinks[sink].length > 0, `the sink "${sink}" holds something to search`);
  }

  // ZERO hits is the pass (F100-FR-219).
  assert.deepEqual([...report.hits], [], formatReport(report));
  assert.equal(report.passed, true);
  assert.match(formatReport(report), /^0 of 7 planted canaries/);

  // The one point of redaction saw every one of the seven values.
  assert.equal(run.replacements, CANARY_COUNT);
  assert.deepEqual([...redactor.registered()].sort(), [...planting.values].sort());

  // The sinks of the run are the sample sink of T111 and the sample view of
  // T149: the events the sink kept, the digest line, the status output and the
  // payload of the read model.
  assert.equal(run.events.length, CANARY_COUNT);
  assert.equal(sampleSinkEvents.length, CANARY_COUNT);
  assert.ok(run.digestLine.startsWith("[DIGEST] "));
  assert.match(run.statusOutput, /^run=/);
  assert.equal(run.view.state, "finished");

  // Every raw artefact DID hold its canary: the run is no green run of nothing.
  for (const place of CANARY_PLACES) {
    assert.ok(run.artefacts[place].includes(planting.valueOf(place)), place);
  }
});

test("CT-100-319: a sink that is handed the RAW text fails the scan (negative control)", async () => {
  const redactor = createStubRedactor();
  const planting = plantCanaries("raw-into-a-sink");
  const run = await runCanaryHarness({ redactor, planting });
  // A sink that bypassed the one point of redaction would hold the raw text of
  // every place; the scan then names the sink and the place of every hit.
  const report = scanSinks({
    planting,
    sinks: {
      "event file": CANARY_PLACES.map((place) => run.artefacts[place]),
      exporters: [],
      digest: [],
      status: [],
      "read model": [],
    },
  });
  assert.equal(report.passed, false);
  assert.equal(report.hits.length, CANARY_COUNT);
  assert.deepEqual(
    report.hits.map((h) => h.place).sort(),
    [...CANARY_PLACES].sort(),
    "every place of planting is named",
  );
  for (const hit of report.hits) {
    assert.equal(hit.sink, "event file");
    assert.equal(hit.where, WHERE[hit.place]);
  }
  assert.match(formatReport(report), /7 planted canary value\(s\) reached a sink/);
});

test("CT-100-319: a redactor that cannot run drops the content and lets no canary through", async () => {
  const redactor = createStubRedactor();
  const planting = plantCanaries("fails-closed");
  registerCanaries(redactor, planting);
  redactor.breakTheRedactor("the pattern set could not be read");
  const { report } = await runAndScan({ redactor, planting });
  // Failing closed: the content is dropped, so the sinks are still clean.
  assert.equal(report.passed, true, formatReport(report));
});
