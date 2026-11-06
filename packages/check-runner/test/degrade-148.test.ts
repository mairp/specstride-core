/**
 * T033 — the plainer path of a check runner that fails
 * (`packages/check-runner/src/registry/degrade.ts`; F148-FR-018, F100-FR-019,
 * F100-FR-021).
 *
 * The three causes of F100-FR-019 are each driven through `guardTheRunner`: a
 * runner that THROWS, one that runs over its OWN TIME, and one that returns a
 * value OUTSIDE the closed set of its operation. For each, the test reads the
 * record and asserts
 *
 *  - the cause, and the plainer path the contract file of EP-05 documents,
 *  - that the record carries no verdict, no exit code and no stop reason,
 *  - that the RESULT a caller gets is `cannot-start`, counts as failed, and is
 *    never stated as a pass.
 *
 * `PLAINER_PATH` and `UNKNOWN_VALUE_RULE` are compared with the two
 * sub-headings of
 * `specs/100-specstride/contracts/extension-points/EP-05.check-runner.json`,
 * so the module cannot drift from the annex of feature 100.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FIELDS_A_DEGRADATION_NEVER_CARRIES } from "@specstride/contracts/ep/extension-point";
import { OPERATIONS, POINT_ID } from "@specstride/contracts/ep/check-runner";
import {
  CAUSE_IS_A_FAILURE_OF_THE_RUNNER_NOT_OF_THE_COMMAND,
  CONSEQUENCES_OF_THE_PLAINER_PATH,
  CONTRACT_FILE,
  ERROR_OF_THE_PLAINER_PATH,
  FAILURE_SUB_HEADING,
  PLAINER_PATH,
  RUNNER_DEGRADATION_CAUSES,
  RunnerTimeLimitExceeded,
  UNKNOWN_CONDITION_REASON,
  UNKNOWN_VALUE_RULE,
  UNKNOWN_VALUE_SUB_HEADING,
  degradedResultIsNeverAPass,
  degradedRunner,
  errorIsInItsSet,
  guardTheRunner,
  holdsNoVerdictExitCodeOrStopReason,
  isAnOperationOfThePoint,
  plainerPathOfAnEntry,
  pollIsInItsSet,
  refusalOfAnUnknownKind,
  resultOfADegradedRunner,
  runnerResultOrThePlainerPath,
  uncheckedForAnUnknownCondition,
  countsAsFailed,
  statedAsPass,
  type RunnerDegradation,
} from "../src/index.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** The two sub-headings of the contract file of EP-05, as prose. */
function sectionOfTheContract(subHeading: string): string {
  const contract = JSON.parse(readFileSync(join(ROOT, CONTRACT_FILE), "utf8")) as {
    sections: Record<string, string[]>;
  };
  const lines = contract.sections[subHeading];
  assert.ok(lines !== undefined, `the contract file holds no sub-heading "${subHeading}"`);
  return lines.join(" ");
}

describe("T033 — the plainer path of EP-05 is read from the contract file", () => {
  it("names the point and the three causes of F100-FR-019", () => {
    assert.equal(POINT_ID, "specstride.check-runner/1");
    assert.deepEqual([...RUNNER_DEGRADATION_CAUSES], ["threw", "time-limit", "outside-result-set"]);
  });

  it('`PLAINER_PATH` is the sub-heading "Failure of an implementation" of EP-05', () => {
    assert.equal(FAILURE_SUB_HEADING, "Failure of an implementation");
    assert.equal(PLAINER_PATH, sectionOfTheContract(FAILURE_SUB_HEADING));
  });

  it('`UNKNOWN_VALUE_RULE` is the sub-heading "Unknown-value rule" of EP-05', () => {
    assert.equal(UNKNOWN_VALUE_SUB_HEADING, "Unknown-value rule");
    assert.equal(UNKNOWN_VALUE_RULE, sectionOfTheContract(UNKNOWN_VALUE_SUB_HEADING));
  });

  it("the two consequences of the plainer path are data, not prose", () => {
    assert.equal(CONSEQUENCES_OF_THE_PLAINER_PATH.atTheVerificationGate, "a failed command");
    assert.match(CONSEQUENCES_OF_THE_PLAINER_PATH.inAnInnerCheck, /loop layer is off/);
    assert.match(PLAINER_PATH, /cannot-start/);
    assert.equal(ERROR_OF_THE_PLAINER_PATH, "cannot-start");
  });

  it("the three causes are failures of the RUNNER, never of the command", () => {
    assert.deepEqual(
      [...CAUSE_IS_A_FAILURE_OF_THE_RUNNER_NOT_OF_THE_COMMAND.ofTheRunner],
      [...RUNNER_DEGRADATION_CAUSES],
    );
    assert.equal(
      CAUSE_IS_A_FAILURE_OF_THE_RUNNER_NOT_OF_THE_COMMAND.requirementOfTheCommand,
      "F148-FR-004",
    );
  });

  it("every operation the module guards is one of the six of the point", () => {
    for (const operation of OPERATIONS) assert.equal(isAnOperationOfThePoint(operation), true);
    assert.equal(isAnOperationOfThePoint("run"), false);
  });
});

describe("T033 — a runner that throws", () => {
  it("degrades with the cause `threw` and the plainer path of the point", async () => {
    const outcome = await guardTheRunner(
      () => {
        throw new Error("the runner threw");
      },
      { operation: "start", kind: "command" },
    );
    assert.equal(outcome.degraded, true);
    if (!outcome.degraded) return;
    assert.equal(outcome.cause, "threw");
    assert.equal(outcome.operation, "start");
    assert.equal(outcome.kind, "command");
    assert.equal(outcome.plainerPath, PLAINER_PATH);
    assert.equal(outcome.error, "cannot-start");
    assert.equal(outcome.entryRefused, false);
    assert.match(outcome.detail, /the runner threw/);
  });

  it("the record carries no verdict, no exit code and no stop reason", async () => {
    const outcome = (await guardTheRunner(
      () => {
        throw new Error("x");
      },
      { operation: "result" },
    )) as RunnerDegradation;
    assert.equal(holdsNoVerdictExitCodeOrStopReason(outcome), true);
    for (const field of FIELDS_A_DEGRADATION_NEVER_CARRIES) {
      assert.equal(field in outcome, false, `the record carries \`${field}\``);
    }
  });

  it("the result a caller gets is `cannot-start`, counts as failed and is no pass", async () => {
    const outcome = (await guardTheRunner(
      () => {
        throw new Error("the machine refused the job");
      },
      { operation: "start" },
    )) as RunnerDegradation;
    const result = resultOfADegradedRunner(outcome, { commandId: "unit-tests" });
    assert.equal(result.commandId, "unit-tests");
    assert.equal(result.exitCode, null);
    assert.equal(result.signal, "EXEC_ERROR");
    assert.equal(result.error, "cannot-start");
    assert.equal(result.passed, false);
    assert.equal(countsAsFailed(result), true);
    assert.equal(statedAsPass(result), false);
    assert.equal(degradedResultIsNeverAPass(result), true);
    assert.match(result.stderr, /the machine refused the job/);
  });
});

describe("T033 — a runner that runs over its own time", () => {
  it("degrades with the cause `time-limit` and never throws", async () => {
    const outcome = await guardTheRunner(
      () => new Promise<string>((resolve) => setTimeout(() => resolve("late"), 200)),
      { operation: "poll", timeLimitMs: 10 },
    );
    assert.equal(outcome.degraded, true);
    if (!outcome.degraded) return;
    assert.equal(outcome.cause, "time-limit");
    assert.equal(outcome.error, "cannot-start");
    assert.match(outcome.detail, /over its own time limit of 10 ms/);
    assert.equal(holdsNoVerdictExitCodeOrStopReason(outcome), true);
  });

  it("a call that answers inside its time limit is no degradation", async () => {
    const outcome = await guardTheRunner(() => "in time", {
      operation: "poll",
      timeLimitMs: 1_000,
    });
    assert.equal(outcome.degraded, false);
    if (outcome.degraded) return;
    assert.equal(outcome.value, "in time");
  });

  it("the error of a time limit of the RUNNER names the operation", () => {
    const error = new RunnerTimeLimitExceeded(25, "result");
    assert.equal(error.name, "RunnerTimeLimitExceeded");
    assert.equal(error.limitMs, 25);
    assert.match(error.message, /`result`/);
    assert.match(error.message, /not of the command/);
  });
});

describe("T033 — a runner that returns a value outside its sets", () => {
  it("degrades with the cause `outside-result-set` and names the value", async () => {
    const outcome = await guardTheRunner(() => ({ state: "halfway" }), {
      operation: "poll",
      inResultSet: pollIsInItsSet,
    });
    assert.equal(outcome.degraded, true);
    if (!outcome.degraded) return;
    assert.equal(outcome.cause, "outside-result-set");
    assert.match(outcome.detail, /halfway/);
    assert.match(outcome.detail, /specstride\.check-runner\/1/);
    assert.equal(holdsNoVerdictExitCodeOrStopReason(outcome), true);
  });

  it("a member of the set of `poll` is no degradation", async () => {
    for (const state of ["running", "ended"]) {
      const outcome = await guardTheRunner(() => ({ state }), {
        operation: "poll",
        inResultSet: pollIsInItsSet,
      });
      assert.equal(outcome.degraded, false, `${state} is a member of the set of \`poll\``);
    }
  });

  it("an error outside row 54 is outside the set, and the three members are inside it", () => {
    assert.equal(errorIsInItsSet("cannot-start"), true);
    assert.equal(errorIsInItsSet("timeout"), true);
    assert.equal(errorIsInItsSet("interrupted"), true);
    assert.equal(errorIsInItsSet("exploded"), false);
    assert.equal(errorIsInItsSet(7), false);
  });

  it("an unknown KIND of identity refuses the entry at `pin`, at launch", () => {
    const refusal = refusalOfAnUnknownKind("on-another-machine", ["command"]);
    assert.equal(refusal.name, "UnknownIdentityKindError");
    assert.equal(refusal.kind, "on-another-machine");
    assert.match(refusal.message, /refused at `pin`/);
    const plain = plainerPathOfAnEntry({ id: "e", kind: "on-another-machine" }, ["command"]);
    assert.equal(plain.refused, true);
    assert.equal(plain.refusal?.kind, "on-another-machine");
    const known = plainerPathOfAnEntry({ id: "e", kind: "command" }, ["command"]);
    assert.equal(known.refused, false);
    assert.equal(known.refusal, null);
  });

  it("a degradation at `pin` REFUSES the entry instead of returning a result", () => {
    const record = degradedRunner({ operation: "pin", cause: "outside-result-set" });
    assert.equal(record.entryRefused, true);
    assert.equal(record.error, null);
    assert.equal(holdsNoVerdictExitCodeOrStopReason(record), true);
  });

  it("an unknown CONDITION in a result makes the result `unchecked`, with the exit result kept", () => {
    const read = uncheckedForAnUnknownCondition({
      commandId: "unit-tests",
      exitCode: 0,
      passed: true,
      stdout: "ok",
      // A condition-shaped name of row 53 that this reader does not know.
      quarantined: true,
    });
    assert.equal(read.unchecked, true);
    assert.equal(read.reason, UNKNOWN_CONDITION_REASON);
    assert.deepEqual([...read.unknownConditions], ["quarantined"]);
    // The exit result is kept: a condition never replaces it (F148-FR-003).
    assert.equal(read.exitCode, 0);
    assert.equal(read.passed, true);
    // And `unchecked` forbids the pass.
    assert.equal(statedAsPass(read), false);
  });
});

describe("T033 — a guarded call read as a result", () => {
  it("gives the value where the runner held", async () => {
    const outcome = await runnerResultOrThePlainerPath(
      () =>
        Object.freeze({
          commandId: "unit-tests",
          executable: "/usr/bin/true",
          args: Object.freeze([]),
          cwd: "/tmp",
          exitCode: 0,
          signal: null,
          durationMs: 1,
          stdout: "",
          stderr: "",
          passed: true,
          tainted: false,
          cached: false,
          flaky: false,
          interrupted: false,
          unchecked: false,
          reason: null,
          error: null,
          batch: null,
          slot: null,
          concurrent: false,
          steps: null,
          rerun: null,
          unknownConditions: Object.freeze([]),
        }),
      { operation: "result", commandId: "unit-tests" },
    );
    assert.equal(outcome.degradation, null);
    assert.equal(outcome.result.exitCode, 0);
    assert.equal(statedAsPass(outcome.result), true);
  });

  it("gives the plainer path where it failed, and the caller tells no exception from a result", async () => {
    const outcome = await runnerResultOrThePlainerPath(
      () => {
        throw new Error("the runner is gone");
      },
      { operation: "result", commandId: "unit-tests" },
    );
    assert.notEqual(outcome.degradation, null);
    assert.equal(outcome.degradation?.cause, "threw");
    assert.equal(outcome.result.error, "cannot-start");
    assert.equal(countsAsFailed(outcome.result), true);
    assert.equal(statedAsPass(outcome.result), false);
  });
});
