/**
 * The eval driver (`src/evals/eval-driver.ts`) and the stub of a suite runner
 * (`src/evals/stub-runner.ts`). The sample host here is deliberately NOT the
 * host these modules moved out of: its skill is `a-pack-skill`, its case ids
 * are its own, and its record names two runs that are not scored — one
 * interrupted, one ended by a usage limit. The point of the move is that the
 * driver and the replay hold no fact of any host: the suite and the runner
 * are the driver's inputs, and the record is the required input of the stub.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  type RecordedCaseResult,
  type TriggerSuiteFile,
  evalDriverCallsAModel,
  evalDriverRun,
  stubSuiteRunner,
} from "../src/evals/index.ts";

const SUITE: TriggerSuiteFile = {
  skill: "a-pack-skill",
  cases: [
    { id: "pack-pos-1", kind: "positive", prompt: "a prompt", expected: "a-pack-skill" },
    { id: "pack-pos-2", kind: "positive", prompt: "a prompt", expected: "a-pack-skill" },
    { id: "pack-neg-1", kind: "negative", prompt: "a prompt", expected: null },
    { id: "pack-neg-2", kind: "negative", prompt: "a prompt", expected: null },
  ],
};

/** The record of the sample host's stub, keyed by its own case ids. */
const RECORD: Readonly<Record<string, RecordedCaseResult>> = Object.freeze({
  "pack-pos-1": Object.freeze({ invokedSkill: "a-pack-skill", toolCalls: Object.freeze([]) }),
  "pack-pos-2": Object.freeze({
    invokedSkill: "another-skill",
    toolCalls: Object.freeze([]),
  }),
  "pack-neg-1": Object.freeze({ invokedSkill: null, toolCalls: Object.freeze([]) }),
  // A recorded run that launched: the free graders refuse it.
  "pack-neg-2": Object.freeze({
    invokedSkill: null,
    toolCalls: Object.freeze(["shell: ls"]),
  }),
});

test("one result per case, in the order of the suite", () => {
  const reports = evalDriverRun(SUITE, stubSuiteRunner(RECORD));
  assert.deepEqual(
    reports.map((report) => report.caseId),
    ["pack-pos-1", "pack-pos-2", "pack-neg-1", "pack-neg-2"],
  );
  assert.equal(Object.isFrozen(reports), true);
  assert.equal(Object.isFrozen(reports[0]), true);
});

test("an exact match passes; a wrong skill fails the graders", () => {
  const reports = evalDriverRun(SUITE, stubSuiteRunner(RECORD));
  assert.equal(reports[0]?.scored, true);
  assert.equal(reports[0]?.gradersPass, true);
  assert.equal(reports[0]?.invokedSkill, "a-pack-skill");
  assert.equal(reports[1]?.scored, true);
  assert.equal(reports[1]?.gradersPass, false, "the wrong skill is not the expected one");
});

test("a case that expects no skill passes when none fired, and refuses a launch", () => {
  const reports = evalDriverRun(SUITE, stubSuiteRunner(RECORD));
  assert.equal(reports[2]?.expected, null);
  assert.equal(reports[2]?.gradersPass, true);
  assert.equal(reports[3]?.gradersPass, false, "a recorded launch fails the free graders");
});

test("an interrupted run and a usage-limit run are not scored, and graded by nothing", () => {
  const interrupted: Readonly<Record<string, RecordedCaseResult>> = Object.freeze({
    "pack-pos-1": Object.freeze({ invokedSkill: "a-pack-skill", exitCode: 130 }),
  });
  const [report] = evalDriverRun(
    { skill: SUITE.skill, cases: [SUITE.cases[0]!] },
    stubSuiteRunner(interrupted),
  );
  assert.equal(report?.scored, false);
  assert.equal(report?.notScoredReason, "interrupted");
  assert.equal(report?.interruptedExitCode, 130);
  assert.equal(report?.gradersPass, false);

  const usageLimit: Readonly<Record<string, RecordedCaseResult>> = Object.freeze({
    "pack-pos-1": Object.freeze({
      invokedSkill: "a-pack-skill",
      marker: "usage-limit",
      toolCalls: Object.freeze([]),
    }),
  });
  const [limited] = evalDriverRun(
    { skill: SUITE.skill, cases: [SUITE.cases[0]!] },
    stubSuiteRunner(usageLimit),
  );
  assert.equal(limited?.scored, false);
  assert.equal(limited?.notScoredReason, "usage-limit");
  assert.equal(limited?.gradersPass, false);
  assert.equal(limited?.interruptedExitCode, undefined);
});

test("the stub replays the GIVEN record and refuses a case it does not hold", () => {
  const runner = stubSuiteRunner(RECORD);
  assert.equal(runner.kind, "stub");
  assert.deepEqual(runner.runCase(SUITE.cases[1]!), RECORD["pack-pos-2"]);
  assert.throws(
    () => runner.runCase({ ...SUITE.cases[0]!, id: "no-such-case" }),
    /the stub of the host's suite runner holds no record for no-such-case/,
  );
});

test("the driver, as the build runs it, calls no model", () => {
  assert.equal(evalDriverCallsAModel(), false);
});
