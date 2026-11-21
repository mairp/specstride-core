/**
 * Feature 153, T091 — guard: the `interrupted` closed set does not move
 * (CQ-153-32, F118-FR-007, F153-FR-031).
 *
 * A check the runner ended at its time limit is a FAILED result (error
 * `timeout`, no exit code, signal `TIMEOUT`) and NEVER a transient stop:
 * the condition and error `interrupted` are set only by `interrupt` of the
 * check runner's result module, and only for the two causes F118-FR-007
 * names — `cancel` and `stop-request`. The engine adds no kill reason and
 * no interrupted path of its own.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  interrupt,
  resultOf,
  statedAsPass,
} from "../../../packages/check-runner/src/result/result.ts";
import {
  RESULT_CONDITIONS,
  RUNNER_ERRORS,
} from "../../../packages/check-runner/src/result/closed-sets.ts";

/** A passing result, as a check that ended well within its limit gives it. */
function aPass() {
  return resultOf({
    commandId: "check-1",
    executable: "node",
    args: ["-e", ""],
    cwd: "/",
    stdout: "",
    stderr: "",
    durationMs: 10,
    exitCode: 0,
    signal: null,
    passed: true,
  });
}

test("F118-FR-007 — the condition and error `interrupted` come only from `interrupt`", () => {
  // The two causes the closed set names, and no other, set the condition.
  for (const cause of ["cancel", "stop-request"] as const) {
    const interrupted = interrupt(aPass(), cause);
    assert.equal(interrupted.interrupted, true);
    assert.equal(interrupted.error, "interrupted");
    assert.equal(
      (interrupted as unknown as { interruptedBy: string }).interruptedBy,
      cause,
    );
    assert.equal(
      statedAsPass(interrupted),
      false,
      "an interrupted result is never stated as a pass",
    );
  }
  // The kill reasons of F118-FR-007, held here: unchanged.
  assert.deepEqual([...RESULT_CONDITIONS.filter((c) => c === "interrupted")], ["interrupted"]);
  assert.deepEqual([...RUNNER_ERRORS.filter((e) => e === "interrupted")], ["interrupted"]);
});

test("F118-FR-007 — no other writer of the module sets `interrupted`", () => {
  // The owning module sets the condition and the error `interrupted` only
  // inside `interrupt`: exactly one occurrence of each write, both in it.
  const source = readFileSync(
    fileURLToPath(new URL("../../../packages/check-runner/src/result/result.ts", import.meta.url)),
    "utf8",
  );
  assert.equal(
    (source.match(/error: "interrupted"/g) ?? []).length,
    1,
    'the error "interrupted" is written in exactly one place of result.ts',
  );
  assert.equal(
    (source.match(/withCondition\([^)]*, "interrupted"\)/g) ?? []).length,
    1,
    'the condition "interrupted" is set in exactly one place of result.ts',
  );
});

test("F153-FR-031 — a timed-out result carries no `interrupted`", () => {
  const timedOut = resultOf({
    commandId: "check-1",
    executable: "node",
    args: ["-e", ""],
    cwd: "/",
    stdout: "",
    stderr: "command timed out",
    durationMs: 3_000,
    exitCode: null,
    signal: "TIMEOUT",
    passed: false,
  });
  assert.ok(!timedOut.interrupted, "no interrupted condition on a timed-out result");
  assert.notEqual(timedOut.error, "interrupted");
});
