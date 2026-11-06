/**
 * T113 of feature 101 — own test CT-101-31 (F101-FR-020).
 *
 * What it proves, in the words of the task:
 *
 *  1. the diagnostician runs IN THE FORM of the `completion` level of its entry
 *     of the role plan, and the PROOF of that form is RECORDED for the call;
 *  2. a proof that FAILS gives a WARNING, NO CALL and NO HINT;
 *  3. for the form `read-only-tools` the proposer's NOTEBOOK, HANDOFF and
 *     OUTBOX are OUT of the working tree DURING the call and BACK, UNCHANGED,
 *     after it, HOWEVER THE CALL ENDS;
 *  4. the CRITIC-DIVERSITY WARNING is raised and recorded for the results
 *     `same-model` and `unverified`, and NEVER blocks the call;
 *  5. under the `parity` profile NO PROOF is made and the LINE of the warning
 *     is NOT printed.
 *
 * fixture: FX-08 (port side only), with the SAMPLE HARNESS OF THE TEST KIT in
 * BOTH FORMS of annex C §C.3.
 *
 * The sample harness of EP-02 — `src/samples/EP-02/index.ts` INSIDE THE TEST
 * KIT, whose directory this file resolves at run time and never names as one
 * path, because F104-SC-006 forbids a file of a core package to hold the path
 * of the sample tree — is loaded as CT-101-17 loads the sample lock provider:
 * a core package may not depend on the test kit, so the specifier is a value
 * and no static edge is made. The sample is used AS IT IS — its `detect`, its
 * `preflight`, its `capabilities` and its `complete` build the facts of the
 * form, and nothing of them is faked here. That is what makes the second form
 * interesting: the sample reports `readOnlyCriticMode: false` and a call record
 * with `sandboxMode: "none"`, so the proof of the second form FAILS for it, and
 * case 2 above is proved against a real adapter rather than a stub.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FIRST_FORM, SECOND_FORM } from "@specstride/contracts/enums/completion-forms";
import type {
  Capabilities,
  CompleteInput,
  CompleteResult,
  DetectResult,
  PreflightResult,
} from "@specstride/contracts/ep/harness";
import {
  DIVERSITY_RESULTS_THAT_WARN,
  FAILURE_WHEN_THE_PROOF_REFUSES,
  FILES_HIDDEN_FOR_THE_SECOND_FORM,
  MOVED_FILE_NAMES,
  THE_WARNING_BLOCKS_THE_CALL,
  WARNING_NAME,
  WITHHELD_PATHS_RECORD,
  diversityOfTheDiagnostician,
  diversityWarningLine,
  proofOfTheDiagnosticianCall,
  runTheDiagnostician,
  theCallMayBeMade,
  theProposersFilesAreHiddenFor,
  theWarningLineIsPrinted,
  type DiagnosticianRolePlanEntry,
  type FormFactsBeforeTheCall,
} from "../../src/recovery/diagnostician.ts";
import { emptyMarkers } from "../../src/recovery/markers.ts";
import {
  runFixture,
  hintPath,
  PROPOSER_FILES_IN_THE_WORKING_TREE,
  withheldAt,
  FX_08_ACCELERATED_ATTEMPT,
  FX_08_MODEL_UNKNOWN,
  FX_08_PROOF_FAILS,
  FX_08_READ_ONLY_TOOLS,
  FX_08_READ_ONLY_TOOLS_CALL_FAILS,
  FX_08_SAME_MODEL,
  FX_08_UNDER_PARITY,
} from "./run-harness.ts";

/* ------------------------------------------------------------------ *
 * The sample harness of the test kit, loaded at run time.
 * ------------------------------------------------------------------ */

const TEST_KIT = new URL("../../../testkit/", import.meta.url);
const SAMPLE_MODULE = new URL("src/samples/EP-02/index.ts", TEST_KIT);
const SAMPLE_PATH = fileURLToPath(SAMPLE_MODULE);

/** Where the sample harness came from, for the report of its provenance. */
export function provenanceOfTheSample(): {
  readonly path: string;
  readonly insideTheTestKit: boolean;
  readonly insideACorePackage: boolean;
  readonly bytes: number;
} {
  const path = SAMPLE_PATH.split("\\").join("/");
  return {
    path,
    insideTheTestKit: /\/testkit\/src\/samples\/EP-02\/index\.ts$/.test(path),
    insideACorePackage: /\/packages\/(core|layer-micro|layer-parallel)\//.test(path),
    bytes: existsSync(SAMPLE_PATH) ? readFileSync(SAMPLE_PATH).byteLength : 0,
  };
}

assert.ok(existsSync(SAMPLE_PATH), `the sample harness of the test kit is not at ${SAMPLE_PATH}`);

type SampleHarness = {
  readonly operations: {
    detect(): Promise<DetectResult>;
    capabilities(detected: DetectResult): Promise<Capabilities>;
    preflight(role: string): Promise<PreflightResult>;
    complete(input: CompleteInput): Promise<CompleteResult>;
  };
  readonly implementation: { readonly id: string; readonly pointId: string };
};

const specifier: string = SAMPLE_MODULE.href;
const sample = (await import(specifier)) as SampleHarness;

/** The facts of the form, taken from the sample harness itself. */
async function factsFromTheSample(
  form: typeof FIRST_FORM | typeof SECOND_FORM,
  sessionId: string,
): Promise<FormFactsBeforeTheCall> {
  const detected = await sample.operations.detect();
  const capabilities = await sample.operations.capabilities(detected);
  const preflight = await sample.operations.preflight("diagnostician");
  const call = await sample.operations.complete({
    prompt: "the facts of the form of this call",
    model: "sample-model",
    outputCap: 1024,
    budgetCap: 1,
    form,
    sessionId,
    ...(form === SECOND_FORM ? { workingTree: "/workdir", withheldPaths: [] } : {}),
  });
  return {
    sessionId,
    initialRecord: {
      tools: call.initialRecord.tools,
      sessionId: call.initialRecord.sessionId,
    },
    sandboxMode: call.initialRecord.sandboxMode,
    networkOff: call.initialRecord.networkState === "off",
    // §C.4 — the sample confirms no denial of the withheld paths, and it
    // declares no read-only critic mode either.
    withheldPathsConfirmed: capabilities.readOnlyCriticMode.value === true,
    versionPin: detected.version,
    preflight: preflight.credentialPresent && !preflight.refused,
    flagSet: capabilities.toolLessMode.value === true,
  };
}

/** The entry of the role plan over the sample harness, in one of the two forms. */
function entryOverTheSample(
  form: typeof FIRST_FORM | typeof SECOND_FORM,
): DiagnosticianRolePlanEntry {
  return {
    harness: "sample-harness-fake-cli",
    provider: "sample-harness-fake-cli",
    model: "sample-model",
    form,
    readOnlyTools: form === SECOND_FORM ? ["read"] : [],
    contextWindow: 200_000,
    testedHarnessAdapter: true,
    sessionIdIsTakenFromTheCaller: true,
    provenance: "configured",
  };
}

/** One diagnosis over the sample harness, with everything it leaves behind. */
async function diagnoseOverTheSample(
  form: typeof FIRST_FORM | typeof SECOND_FORM,
  over: { readonly underParity?: boolean } = {},
) {
  const sessionId = `diagnose-over-the-sample-${form}`;
  const facts = await factsFromTheSample(form, sessionId);
  const hints: string[] = [];
  const lines: string[] = [];
  const warnings: string[] = [];
  const events: { name: string; data: Readonly<Record<string, unknown>> }[] = [];
  const moves: string[] = [];
  const prompts: string[] = [];
  const outcome = await runTheDiagnostician(
    {
      phase: 1,
      ordinal: 1,
      signature: "T001",
      feedbackExists: true,
      markers: emptyMarkers(1),
      entry: entryOverTheSample(form),
      formFacts: facts,
      sessionIdsOfThePasses: ["pass-1-1"],
      modelsThatProducedPasses: ["another-model"],
      underParity: over.underParity === true,
      prompt: {
        phase: 1,
        ordinal: 1,
        phaseEvidence: "the evidence of the phase attempt",
        feedback: "T001 is not met",
        history: ["attempt 1: T001 is not met"],
        files: [{ path: "a.ts", kind: "text", content: "const a = 1;" }],
        blockSet: over.underParity === true ? "as-is" : "new",
        contextWindow: 200_000,
      },
    },
    {
      call: async (request) => {
        prompts.push(request.prompt);
        const result = await sample.operations.complete({
          prompt: request.prompt,
          model: request.model ?? "sample-model",
          outputCap: 1024,
          budgetCap: 1,
          form: request.form,
          sessionId: request.sessionId,
        });
        return { reply: result.reply, model: request.model };
      },
      proposerFiles: {
        moveOut: () => {
          moves.push("out");
          return [{ file: "notebook", from: "a", keptAt: "b" }];
        },
        moveBack: () => void moves.push("back"),
      },
      writeHint: (text) => void hints.push(text),
      writeMarkers: () => undefined,
      emit: (name, data) => void events.push({ name, data }),
      writeLine: (line) => void lines.push(line),
      warn: (line) => void warnings.push(line),
      framing: {
        boundary: "SPECSTRIDE-OUTSIDE-".padEnd(51, "0"),
        frame: (text, token) => ({ framed: `<<<${token}>>>\n${text}\n<<<END ${token}>>>` }),
      },
    },
  );
  return { outcome, hints, lines, warnings, events, moves, prompts, facts };
}

/* ------------------------------------------------------------------ *
 * 1 — the form of the role plan, and the proof recorded for the call.
 * ------------------------------------------------------------------ */

test("CT-101-31: the sample harness of the test kit is the real one, outside the core", () => {
  const provenance = provenanceOfTheSample();
  assert.equal(provenance.insideTheTestKit, true, provenance.path);
  assert.equal(provenance.insideACorePackage, false, provenance.path);
  assert.ok(provenance.bytes > 0);
  assert.equal(sample.implementation.pointId, "specstride.harness/1");
  assert.equal(sample.implementation.id, "sample-harness-fake-cli");
});

test("CT-101-31 (form 1 of 2, `tool-less`): the call is made and the proof is recorded", async () => {
  const run = await diagnoseOverTheSample(FIRST_FORM);
  // The call ran in the form of the entry of the role plan, with no tool.
  assert.equal(run.outcome.called, true);
  assert.equal(run.outcome.proof?.form, FIRST_FORM);
  assert.deepEqual([...(run.facts.initialRecord?.tools ?? ["x"])], []);
  // F100-FR-087 — the result of the proof is RECORDED for the call, with the
  // facts of §C.3 it rests on and the way the session was shown.
  assert.equal(run.outcome.proof?.outcome, "passed");
  assert.equal(run.outcome.proof?.kind, "initial-record");
  assert.equal(run.outcome.proof?.sessionProofCase, "caller-minted-id");
  assert.deepEqual(run.outcome.proof?.facts, { emptyToolList: true, sessionIdentity: true });
  assert.equal(theCallMayBeMade(run.outcome.proof!), true);
  // The hint was written from the sample's reply, and the result code is 0.
  assert.equal(run.outcome.hintWasWritten, true);
  assert.equal(run.hints.length, 1);
  assert.equal(run.outcome.resultCode, 0);
  // The first form hides no file of the proposer (F100-FR-088 names the second).
  assert.equal(theProposersFilesAreHiddenFor(FIRST_FORM), false);
  assert.deepEqual(run.moves, []);
});

/* ------------------------------------------------------------------ *
 * 2 — a proof that fails: a warning, no call, no hint.
 * ------------------------------------------------------------------ */

test("CT-101-31 (form 2 of 2, `read-only-tools`): the sample's proof fails, so no call", async () => {
  const run = await diagnoseOverTheSample(SECOND_FORM);
  // The sample harness declares no read-only critic mode and its call record
  // reports `sandboxMode: "none"`, so the proof of the second form FAILS.
  assert.equal(run.outcome.proof?.form, SECOND_FORM);
  assert.equal(run.outcome.proof?.outcome, "failed");
  assert.equal(run.outcome.proof?.failure, "critic_not_toolless");
  assert.deepEqual(run.outcome.proof?.facts, {
    readOnlySandboxMode: false,
    networkOff: true,
    withheldPathsConfirmed: false,
  });
  assert.equal(theCallMayBeMade(run.outcome.proof!), false);
  // F101-FR-020 — NO CALL was made, NO HINT was written, and the failure is a
  // WARNING: the result code stays 0 and nothing halted.
  assert.equal(run.outcome.called, false);
  assert.equal(run.prompts.length, 0);
  assert.equal(run.outcome.hintWasWritten, false);
  assert.deepEqual(run.hints, []);
  assert.equal(run.outcome.failure, FAILURE_WHEN_THE_PROOF_REFUSES);
  assert.equal(run.outcome.resultCode, 0);
  assert.equal(run.warnings.length, 1);
  assert.match(run.warnings[0] ?? "", /^critic: WARN: .*proof of the form/);
  // No start event and no end event: the call never happened.
  assert.deepEqual(
    run.events.map((event) => event.name),
    ["diagnostician_trigger"],
  );
  // And the files of the proposer were not moved for a call that is not made.
  assert.deepEqual(run.moves, []);
});

test("CT-101-31 (port, FX-08): a proof that fails inside a whole run", async () => {
  const run = await runFixture(FX_08_PROOF_FAILS);
  // The run goes on and ends 0: a failure of the diagnostician only warns.
  assert.equal(run.exitCode, 0);
  assert.equal(run.diagnoses.length, 1);
  assert.equal(run.diagnoses[0]?.called, false);
  assert.equal(run.diagnoses[0]?.proof?.outcome, "failed");
  assert.equal(run.diagnoses[0]?.hintWasWritten, false);
  assert.deepEqual([...run.diagnosticianCalls], []);
  assert.equal(run.files.has(hintPath(run.runId, 1, 1)), false);
  assert.equal(run.warnings.length, 1);
  // And with no hint, no accelerated phase attempt follows (F101-FR-024).
  assert.deepEqual([...run.accelerations], []);
});

/* ------------------------------------------------------------------ *
 * 3 — the proposer's files, out during the call and back after it.
 * ------------------------------------------------------------------ */

test("CT-101-31: the three files of F100-FR-088, and the record of §C.4", () => {
  assert.deepEqual([...FILES_HIDDEN_FOR_THE_SECOND_FORM], ["notebook", "handoff", "outbox"]);
  assert.deepEqual([...MOVED_FILE_NAMES], ["notebook", "handoff", "outbox"]);
  assert.equal(WITHHELD_PATHS_RECORD, "attempt:<N>:<k>:<n>:withheld-paths");
  assert.equal(theProposersFilesAreHiddenFor(SECOND_FORM), true);
  assert.equal(theProposersFilesAreHiddenFor(FIRST_FORM), false);
});

test("CT-101-31 (port, FX-08, `read-only-tools`): out during the call, back after it", async () => {
  // Both ends of a call: one that returns a reply, and one that throws.
  for (const set of [FX_08_READ_ONLY_TOOLS, FX_08_READ_ONLY_TOOLS_CALL_FAILS]) {
    const run = await runFixture(set);
    const where = set === FX_08_READ_ONLY_TOOLS ? "the call returned" : "the call threw";
    const around = run.withheldAroundTheCall[0];
    assert.notEqual(around, undefined, where);
    // DURING the call the working tree held NONE of the three.
    assert.deepEqual([...(around?.inTheWorkingTreeDuringTheCall ?? ["x"])], [], where);
    // Each was kept outside the working tree, and the engine recorded where.
    assert.deepEqual(
      (around?.moved ?? []).map((entry) => entry.file),
      ["notebook", "handoff", "outbox"],
      where,
    );
    for (const entry of around?.moved ?? []) {
      assert.equal(
        entry.from,
        PROPOSER_FILES_IN_THE_WORKING_TREE[
          entry.file as keyof typeof PROPOSER_FILES_IN_THE_WORKING_TREE
        ],
        where,
      );
      assert.equal(entry.keptAt, withheldAt(run.runId, entry.file), where);
    }
    // AFTER the call all three are BACK, and UNCHANGED: the bytes are the ones
    // that stood there before the run, and nothing is left at the kept place.
    assert.deepEqual(
      [...(around?.backAfterTheCall ?? [])],
      Object.values(PROPOSER_FILES_IN_THE_WORKING_TREE),
      where,
    );
    for (const [file, path] of Object.entries(PROPOSER_FILES_IN_THE_WORKING_TREE)) {
      assert.equal(
        run.files.get(path),
        `# the proposer's ${file}\nwritten before the run\n`,
        `${where}: ${file} came back unchanged`,
      );
      assert.equal(run.files.has(withheldAt(run.runId, file)), false, `${where}: ${file}`);
    }
    // The call itself was given the withheld paths of §C.4.
    assert.deepEqual(
      [...(run.diagnosticianCalls[0]?.withheldPaths ?? [])],
      Object.values(PROPOSER_FILES_IN_THE_WORKING_TREE),
      where,
    );
  }
});

test("CT-101-31 (port, FX-08, `tool-less`): the first form moves nothing", async () => {
  const run = await runFixture(FX_08_ACCELERATED_ATTEMPT);
  const around = run.withheldAroundTheCall[0];
  assert.deepEqual([...(around?.moved ?? ["x"])], []);
  // The three files stood in the working tree THROUGHOUT the call.
  assert.deepEqual(
    [...(around?.inTheWorkingTreeDuringTheCall ?? [])],
    Object.values(PROPOSER_FILES_IN_THE_WORKING_TREE),
  );
});

/* ------------------------------------------------------------------ *
 * 4 — the critic-diversity warning: raised, recorded, never blocking.
 * ------------------------------------------------------------------ */

test("CT-101-31: the two results of row 183 that warn, and the two that do not", () => {
  assert.deepEqual([...DIVERSITY_RESULTS_THAT_WARN], ["same-model", "unverified"]);
  assert.equal(WARNING_NAME, "critic-diversity");
  assert.equal(THE_WARNING_BLOCKS_THE_CALL, false);
  // `same-model`: the diagnostician runs on a model that produced a pass.
  assert.deepEqual(
    { ...diversityOfTheDiagnostician({ model: "m1", modelsThatProducedPasses: ["m1"] }) },
    { result: "same-model", warning: true },
  );
  // `unverified`: the model of the call, or a model of a pass, is not known.
  assert.deepEqual(
    { ...diversityOfTheDiagnostician({ model: null, modelsThatProducedPasses: ["m1"] }) },
    { result: "unverified", warning: true },
  );
  assert.deepEqual(
    { ...diversityOfTheDiagnostician({ model: "m1", modelsThatProducedPasses: [null] }) },
    { result: "unverified", warning: true },
  );
  // And the two results that do NOT warn.
  assert.deepEqual(
    { ...diversityOfTheDiagnostician({ model: "m1", modelsThatProducedPasses: ["m2"] }) },
    { result: "diverse", warning: false },
  );
  assert.deepEqual(
    {
      ...diversityOfTheDiagnostician({
        model: "m1",
        provider: "p",
        modelsThatProducedPasses: ["m2"],
        providersThatProducedPasses: ["p"],
      }),
    },
    { result: "same-provider", warning: false },
  );
  assert.match(diversityWarningLine("same-model"), /^critic: WARN: .*same-model/);
});

test("CT-101-31 (port, FX-08): the warning is raised and recorded and blocks nothing", async () => {
  for (const [set, result] of [
    [FX_08_SAME_MODEL, "same-model"],
    [FX_08_MODEL_UNKNOWN, "unverified"],
  ] as const) {
    const run = await runFixture(set);
    // RECORDED: the record of the call carries the result and the warning.
    assert.equal(run.diagnoses[0]?.diversity, result);
    assert.equal(run.diagnoses[0]?.warningRaised, true);
    // RAISED: the line of the warning stands, outside the `parity` profile.
    assert.equal(run.warnings.length, 1, result);
    assert.equal(run.warnings[0], diversityWarningLine(result));
    // NEVER BLOCKS: the call was made all the same, the hint was written, and
    // the run reached its end as it does without the warning.
    assert.equal(run.diagnoses[0]?.called, true, result);
    assert.equal(run.diagnoses[0]?.hintWasWritten, true, result);
    assert.equal(run.diagnosticianCalls.length, 1, result);
    assert.equal(run.exitCode, 0, result);
    assert.equal(run.accelerations.length, 1, result);
  }
});

/* ------------------------------------------------------------------ *
 * 5 — under the `parity` profile: no proof, and no line of the warning.
 * ------------------------------------------------------------------ */

test("CT-101-31 (port, FX-08, `parity`): no proof is made, and no warning line", async () => {
  const run = await runFixture(FX_08_UNDER_PARITY);
  // F100-FR-230, rows 28 and 117 of annex X §X.7 — NO PROOF is made under the
  // profile: the result is recorded as `not-made` and refuses nothing.
  assert.equal(run.diagnoses[0]?.proof?.outcome, "not-made");
  assert.equal(run.diagnoses[0]?.proof?.underParity, true);
  assert.equal(theCallMayBeMade(run.diagnoses[0]!.proof!), true);
  assert.equal(run.diagnoses[0]?.called, true);
  assert.equal(run.diagnoses[0]?.hintWasWritten, true);
  // The run set is the one whose model IS the model of the passes, so the
  // warning is still RAISED and RECORDED...
  assert.equal(run.diagnoses[0]?.diversity, "same-model");
  assert.equal(run.diagnoses[0]?.warningRaised, true);
  // ... and its LINE is not printed, as at the baseline, which printed none.
  assert.equal(theWarningLineIsPrinted(true), false);
  assert.equal(theWarningLineIsPrinted(false), true);
  assert.deepEqual([...run.warnings], []);
  for (const line of run.lines) {
    assert.equal(/critic diversity/.test(line), false, line);
  }
  // And the same run OUTSIDE the profile does print it: the difference is the
  // profile and nothing else.
  const outside = await runFixture(FX_08_SAME_MODEL);
  assert.equal(outside.warnings.length, 1);
});

test("CT-101-31 (sample harness, `parity`): no proof is made for the first form either", async () => {
  const run = await diagnoseOverTheSample(FIRST_FORM, { underParity: true });
  assert.equal(run.outcome.proof?.outcome, "not-made");
  assert.equal(run.outcome.proof?.underParity, true);
  assert.equal(run.outcome.called, true);
  // Under the profile the facts of the form are still RECORDED with the
  // result, so a reader of the record sees what was seen and not judged.
  assert.deepEqual(run.outcome.proof?.facts, { emptyToolList: true, sessionIdentity: true });
  // The second form under the profile: no proof is made, so the call that the
  // judgment would have refused IS made, as at the baseline.
  const second = await diagnoseOverTheSample(SECOND_FORM, { underParity: true });
  assert.equal(second.outcome.proof?.outcome, "not-made");
  assert.equal(second.outcome.called, true);
  // And the files of the proposer are moved for it all the same, because the
  // move follows the FORM and not the proof (F100-FR-088).
  assert.deepEqual(second.moves, ["out", "back"]);
});

test("CT-101-31: the proof of a form is the judgment of feature 100 and not this feature's", () => {
  // The same facts, judged by `proofOfTheDiagnosticianCall`, give the result of
  // `proofOfTheCall` of `ep18/critic-strategy.ts`, which applies `judgeProof`
  // of feature 100. A fact that does not hold fails the proof, whichever form.
  const entry = entryOverTheSample(SECOND_FORM);
  const base: FormFactsBeforeTheCall = {
    sessionId: "s1",
    initialRecord: { tools: ["read"], sessionId: "s1" },
    sandboxMode: "read-only",
    networkOff: true,
    withheldPathsConfirmed: true,
  };
  const passed = proofOfTheDiagnosticianCall({
    entry,
    facts: base,
    sessionIdsOfThePasses: ["pass-1"],
    underParity: false,
  });
  assert.equal(passed.outcome, "passed");
  assert.equal(theCallMayBeMade(passed), true);
  for (const broken of [
    { ...base, sandboxMode: "none" },
    { ...base, networkOff: false },
    { ...base, withheldPathsConfirmed: false },
  ]) {
    const proof = proofOfTheDiagnosticianCall({
      entry,
      facts: broken,
      sessionIdsOfThePasses: ["pass-1"],
      underParity: false,
    });
    assert.equal(proof.outcome, "failed", JSON.stringify(broken));
    assert.equal(theCallMayBeMade(proof), false);
  }
});
