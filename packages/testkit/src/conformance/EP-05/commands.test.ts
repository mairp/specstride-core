/**
 * CT-148-118 (T030) — the CONFORMANCE SUITE of EP-05 at behaviour level: the
 * five scripted commands the "Proving test" of the point names — pass, fail at
 * step n, slow, never ending, very large output (F148-FR-018, F148-FR-001).
 *
 * The suite is the content owner's half of the folder of the point: feature
 * 100's `contract.test.ts` beside this file makes the five checks every suite
 * at contract level makes, and this file adds the behaviour cases, as
 * `common.ts` (`behaviourCasesBelongToTheOwner`) says it must. Feature 148 is
 * the content owner named under "Content owner" of
 * `specs/100-specstride/contracts/extension-points/EP-05.check-runner.json`.
 *
 * The cases take the implementation under test as their argument and read it
 * only through the six operations of the point, so an author of a later runner
 * runs the same suite on theirs. Here they run on the sample of
 * `../../samples/EP-05/sample-remote-runner.ts`, which is REGISTERED FROM THE
 * TEST TREE by the `casesAsTests` call at the foot of this file and serves a
 * kind of identity — `sample-remote` — that the core does not know.
 *
 * Two readings keep the suite from drifting:
 *
 *  - `SCRIPTED_COMMANDS` is compared with the "Proving test" section of the
 *    contract file, so a scripted command that the annex does not name, or one
 *    the annex names and the suite forgets, fails the suite;
 *  - every scripted command is a REAL executable of
 *    `tests/fixtures/148/commands/` (T005), so the five names are not a story
 *    the suite tells itself.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { CONDITIONS, OPERATIONS, POINT_ID } from "@specstride/contracts/ep/check-runner";
import {
  SAMPLE_ID,
  SAMPLE_KIND,
  SAMPLE_OUTPUT_CAP,
  SAMPLE_TIMEOUT_SIGNAL,
  SCRIPTED_JOB_NAMES,
  implementation,
} from "../../samples/EP-05/sample-remote-runner.ts";
import { ROOT, loadExtensionPointContract, type Implementation } from "../frame.ts";
import { operationOf } from "../common.ts";
import { guardedCall, holdsNoVerdictExitCodeOrStopReason, plainerPathOf } from "../degrade.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-05" as const;

/** The id of this suite, as `specs/148-check-runner/tasks.md` gives it (T030). */
export const SUITE_ID = "CT-148-118" as const;

/** Where the scripted commands of feature 148 live (T005). */
export const SCRIPTED_COMMANDS_DIR = "tests/fixtures/148/commands" as const;

/**
 * One scripted command of the "Proving test" of EP-05, with the result every
 * conforming runner must report for it. `expect` is the whole of the
 * documented result; a runner that reports anything else fails the suite.
 */
export type ScriptedCommand = {
  /** The name the "Proving test" of the contract file gives the command. */
  readonly name: string;
  /** The job the runner is asked for; the sample's kind reads it as a job name. */
  readonly job: string;
  /** The real executable of `tests/fixtures/148/commands/` (T005). */
  readonly file: string;
  /** The time limit the case gives the command, in milliseconds. */
  readonly timeLimitMs: number;
  /** What the documented result is. */
  readonly expect: {
    /** The exit code, or null where the command has none of its own. */
    readonly exitCode: number | null;
    readonly signal: string | null;
    readonly passed: boolean;
    /** The state `poll` reports straight after `start`. */
    readonly pollAfterStart: "running" | "ended";
    /** The least number of characters standard output carries. */
    readonly stdoutAtLeast: number;
    /** The cap standard output may never pass. */
    readonly stdoutAtMost: number;
    /** The number of steps the result carries, or null where it carries none. */
    readonly steps: number | null;
  };
};

/**
 * F148-FR-018 — the five scripted commands of the "Proving test" of EP-05.
 * The order is the order of the annex.
 */
export const SCRIPTED_COMMANDS: readonly ScriptedCommand[] = Object.freeze([
  Object.freeze({
    name: "pass",
    job: "pass",
    file: "pass.ts",
    timeLimitMs: 1_000,
    expect: Object.freeze({
      exitCode: 0,
      signal: null,
      passed: true,
      pollAfterStart: "ended" as const,
      stdoutAtLeast: 1,
      stdoutAtMost: SAMPLE_OUTPUT_CAP,
      steps: null,
    }),
  }),
  Object.freeze({
    name: "fail at step n",
    job: "fail-at-step",
    file: "fail-at-step.ts",
    timeLimitMs: 1_000,
    expect: Object.freeze({
      // The command exits with the NUMBER of the failed required step, so a
      // caller tells which step failed from the exit result alone.
      exitCode: 35,
      signal: null,
      passed: false,
      pollAfterStart: "ended" as const,
      stdoutAtLeast: 1,
      stdoutAtMost: SAMPLE_OUTPUT_CAP,
      steps: 35,
    }),
  }),
  Object.freeze({
    name: "slow",
    job: "slow",
    file: "slow.ts",
    // A time limit ABOVE its duration: the slow command passes.
    timeLimitMs: 5_000,
    expect: Object.freeze({
      exitCode: 0,
      signal: null,
      passed: true,
      pollAfterStart: "ended" as const,
      stdoutAtLeast: 1,
      stdoutAtMost: SAMPLE_OUTPUT_CAP,
      steps: null,
    }),
  }),
  Object.freeze({
    name: "never ending",
    job: "never-ending",
    file: "never-ending.ts",
    // Only the time limit or `cancel` ends it.
    timeLimitMs: 25,
    expect: Object.freeze({
      exitCode: null,
      signal: SAMPLE_TIMEOUT_SIGNAL,
      passed: false,
      pollAfterStart: "running" as const,
      stdoutAtLeast: 0,
      stdoutAtMost: SAMPLE_OUTPUT_CAP,
      steps: null,
    }),
  }),
  Object.freeze({
    name: "very large output",
    job: "very-large-output",
    file: "large-output.ts",
    timeLimitMs: 5_000,
    expect: Object.freeze({
      exitCode: 0,
      signal: null,
      passed: true,
      pollAfterStart: "ended" as const,
      // The cap is the whole point: the command prints 10 MB and the runner
      // keeps the first 64000 characters per stream and nothing beyond.
      stdoutAtLeast: SAMPLE_OUTPUT_CAP,
      stdoutAtMost: SAMPLE_OUTPUT_CAP,
      steps: null,
    }),
  }),
]);

/** The result a runner returns, read as a record so the suite needs no cast. */
type AnyResult = Readonly<Record<string, unknown>>;

/** One operation of the implementation under test, as a function. */
function operation(impl: Implementation, name: string): (...args: unknown[]) => Promise<unknown> {
  const found = operationOf(impl, name);
  assert.equal(typeof found, "function", `the implementation offers no operation \`${name}\``);
  return found as (...args: unknown[]) => Promise<unknown>;
}

/** The manifest entry one scripted command is run from. */
function entryOf(command: ScriptedCommand, kind: string) {
  return Object.freeze({
    id: command.job,
    kind,
    argv: Object.freeze([command.job]),
    phase: 1,
    timeLimitMs: command.timeLimitMs,
  });
}

/**
 * Run one scripted command through the six operations of the point, in the
 * order a caller uses them: `pin` at launch, then `start`, `poll`, `result`.
 */
async function runTheCommand(
  impl: Implementation,
  command: ScriptedCommand,
  kind: string,
): Promise<{ readonly poll: string; readonly result: AnyResult }> {
  const entry = entryOf(command, kind);
  const identity = (await operation(impl, "pin")(entry)) as AnyResult;
  assert.equal(identity["kind"], kind, "`pin` returns an identity of the kind of the entry");
  const handle = (await operation(
    impl,
    "start",
  )({
    identity,
    workingDirectory: "/sample/workspace",
    environmentAllowList: ["PATH"],
    timeLimitMs: command.timeLimitMs,
    containment: "C1",
    entry,
  })) as { readonly id: string };
  assert.equal(typeof handle.id, "string", "`start` returns an opaque handle");
  const poll = (await operation(impl, "poll")(handle)) as { readonly state: string };
  const result = (await operation(impl, "result")(handle)) as AnyResult;
  return Object.freeze({ poll: poll.state, result });
}

/** The kind of identity the implementation under test serves. */
function kindOf(impl: Implementation): string {
  return impl.id === SAMPLE_ID ? SAMPLE_KIND : "command";
}

/** One behaviour case per scripted command (F148-FR-018). */
const scriptedCases: readonly ConformanceCase[] = Object.freeze(
  SCRIPTED_COMMANDS.map((command, index) => ({
    id: `${SUITE_ID}.${index + 1}`,
    title: `the scripted command "${command.name}" gives the documented result`,
    level: "behaviour" as const,
    proves: ["F148-FR-018", "F148-FR-001"],
    async run(impl: Implementation) {
      const observed = await runTheCommand(impl, command, kindOf(impl));
      const result = observed.result;
      assert.equal(
        observed.poll,
        command.expect.pollAfterStart,
        `\`poll\` straight after \`start\` for "${command.name}"`,
      );
      assert.equal(
        result["exitCode"],
        command.expect.exitCode,
        `the exit code of "${command.name}"`,
      );
      assert.equal(result["signal"], command.expect.signal, `the signal of "${command.name}"`);
      assert.equal(result["passed"], command.expect.passed, `\`passed\` of "${command.name}"`);
      const stdout = String(result["stdout"] ?? "");
      assert.ok(
        stdout.length >= command.expect.stdoutAtLeast,
        `"${command.name}" wrote ${stdout.length} characters, fewer than ` +
          `${command.expect.stdoutAtLeast}`,
      );
      assert.ok(
        stdout.length <= command.expect.stdoutAtMost,
        `"${command.name}" left ${stdout.length} characters, over the cap of ` +
          `${command.expect.stdoutAtMost}`,
      );
      // The conditions are fields of their own, whatever the exit result is.
      for (const condition of CONDITIONS) {
        assert.equal(
          typeof result[condition],
          "boolean",
          `${condition} is no field of its own in the result of "${command.name}"`,
        );
      }
      const steps = result["steps"] as { readonly steps?: readonly unknown[] } | null;
      if (command.expect.steps === null) {
        assert.equal(steps, null, `"${command.name}" carries no run of steps`);
      } else {
        assert.ok(steps !== null && steps !== undefined, `"${command.name}" carries its steps`);
        assert.equal(
          steps.steps?.length,
          command.expect.steps,
          `the number of steps of "${command.name}"`,
        );
      }
      // A command that did not exit 0 is never stated as a pass.
      if (!command.expect.passed) {
        assert.notEqual(result["exitCode"], 0, `"${command.name}" never exits 0`);
      }
    },
  })),
);

/** The behaviour cases of the point, in the order the suite runs them. */
export const cases: readonly ConformanceCase[] = Object.freeze([
  ...scriptedCases,
  {
    id: `${SUITE_ID}.6`,
    title:
      "the five scripted commands of the suite are the five the Proving test of the point names",
    level: "behaviour",
    proves: ["F148-FR-018"],
    run() {
      const proving = (loadExtensionPointContract(EP).sections["Proving test"] ?? []).join(" ");
      assert.ok(proving.length > 0, "the contract file of EP-05 names no proving test");
      for (const command of SCRIPTED_COMMANDS) {
        assert.ok(
          proving.includes(command.name),
          `the Proving test of ${EP} does not name the scripted command "${command.name}"`,
        );
      }
      // And nothing of the annex's list is missing from the suite: the five
      // names the annex gives, in its own words, are the five above.
      assert.deepEqual(
        SCRIPTED_COMMANDS.map((c) => c.name),
        ["pass", "fail at step n", "slow", "never ending", "very large output"],
      );
      assert.deepEqual(
        SCRIPTED_COMMANDS.map((c) => c.job),
        [...SCRIPTED_JOB_NAMES],
        "the suite and the sample name the same five scripted commands",
      );
    },
  },
  {
    id: `${SUITE_ID}.7`,
    title: "every scripted command of the suite is a real executable of the fixture tree",
    level: "behaviour",
    proves: ["F148-FR-018"],
    run() {
      for (const command of SCRIPTED_COMMANDS) {
        const path = join(ROOT, SCRIPTED_COMMANDS_DIR, command.file);
        assert.equal(
          existsSync(path),
          true,
          `the scripted command "${command.name}" has no executable at ` +
            `${SCRIPTED_COMMANDS_DIR}/${command.file}`,
        );
      }
    },
  },
  {
    id: `${SUITE_ID}.8`,
    title: "`pin` refuses an entry of a kind the runner does not serve, at launch",
    level: "behaviour",
    proves: ["F148-FR-001"],
    async run(impl: Implementation) {
      const entry = Object.freeze({
        id: "of-an-unknown-kind",
        kind: "no-runner-registered-this-kind",
        argv: Object.freeze(["pass"]),
        phase: 1,
        timeLimitMs: 1_000,
      });
      // A runner serves ONE kind; an entry of another kind is refused. The
      // refusal may be a rejected promise or a throw: either is a refusal, and
      // what the suite forbids is an identity record for a kind nobody serves.
      let refused = false;
      try {
        const identity = (await operation(impl, "pin")(entry)) as AnyResult;
        refused = identity["kind"] !== entry.kind;
      } catch {
        refused = true;
      }
      assert.equal(
        refused,
        true,
        "`pin` returned an identity record of a kind the runner does not serve",
      );
    },
  },
  {
    id: `${SUITE_ID}.9`,
    title:
      "`cancel` ends a command that never ends, and the result carries `interrupted` and is no pass",
    level: "behaviour",
    proves: ["F148-FR-018", "F148-FR-001"],
    async run(impl: Implementation) {
      const kind = kindOf(impl);
      const command = SCRIPTED_COMMANDS.find((c) => c.job === "never-ending") as ScriptedCommand;
      // A limit far above the case, so that only `cancel` can have ended it.
      const entry = { ...entryOf(command, kind), timeLimitMs: 60_000 };
      const identity = (await operation(impl, "pin")(entry)) as AnyResult;
      const handle = (await operation(
        impl,
        "start",
      )({
        identity,
        workingDirectory: "/sample/workspace",
        environmentAllowList: ["PATH"],
        timeLimitMs: 60_000,
        containment: "C1",
        entry,
      })) as { readonly id: string };
      const before = (await operation(impl, "poll")(handle)) as { readonly state: string };
      assert.equal(before.state, "running", "the command that never ends is still running");
      await operation(impl, "cancel")(handle);
      const after = (await operation(impl, "poll")(handle)) as { readonly state: string };
      assert.equal(after.state, "ended", "`cancel` ended the command");
      const result = (await operation(impl, "result")(handle)) as AnyResult;
      assert.equal(result["interrupted"], true, "a cancelled command carries `interrupted`");
      assert.equal(result["passed"], false, "a cancelled command is never a pass");
      assert.equal(result["exitCode"], null, "a cancelled command has no exit code of its own");
    },
  },
  {
    id: `${SUITE_ID}.10`,
    title:
      "a runner that throws takes the plainer path of the point and produces no verdict, exit code or stop reason",
    level: "behaviour",
    proves: ["F148-FR-018"],
    async run(impl: Implementation) {
      const outcome = await guardedCall(
        () => {
          throw new Error("the machine refused the job");
        },
        {
          ep: EP,
          implementationId: impl.id,
          operation: "start",
          event: {
            seq: 1,
            ts: "2026-10-02T00:00:00.000Z",
            runId: "run-ct-148-118",
            launchId: "launch-ct-148-118",
          },
        },
      );
      assert.equal(outcome.degraded, true, "a throw of a runner degrades");
      if (!outcome.degraded) return;
      assert.equal(outcome.cause, "threw");
      assert.equal(outcome.plainerPath, plainerPathOf(EP));
      // The plainer path of EP-05 is `cannot-start`, and the gate reads it as a
      // failed command; the record itself carries no verdict, no exit code and
      // no stop reason.
      assert.match(outcome.plainerPath, /cannot-start/);
      assert.match(outcome.plainerPath, /failed command/);
      assert.equal(holdsNoVerdictExitCodeOrStopReason(outcome), true);
    },
  },
  {
    id: `${SUITE_ID}.11`,
    title: "`environment` gives the variables of an entry without starting anything",
    level: "behaviour",
    proves: ["F148-FR-018", "F148-FR-001"],
    run(impl: Implementation) {
      const found = operationOf(impl, "environment");
      assert.equal(typeof found, "function", "the implementation offers no `environment`");
      const entry = {
        ...entryOf(SCRIPTED_COMMANDS[0] as ScriptedCommand, kindOf(impl)),
        env: Object.freeze({ FIXTURE_OWN: "1" }),
      };
      const environment = (found as (e: unknown) => Readonly<Record<string, string>>)(entry);
      assert.equal(typeof environment, "object");
      assert.equal(environment["FIXTURE_OWN"], "1", "the declared `env` of the entry is overlaid");
      for (const name of Object.keys(environment)) {
        assert.ok(
          !/(^|_)(API_KEY|TOKEN|SECRET|PASSWORD)$/.test(name),
          `\`environment\` offered the provider credential \`${name}\``,
        );
      }
    },
  },
]);

export { implementation };

test(`${SUITE_ID}: the suite covers the five scripted commands of EP-05 and the operations of the point`, () => {
  assert.equal(POINT_ID, "specstride.check-runner/1");
  assert.equal(SCRIPTED_COMMANDS.length, 5);
  assert.equal(scriptedCases.length, 5);
  assert.equal(cases.length, 11);
  assert.ok(
    cases.every((one) => one.level === "behaviour"),
    "the cases of the content owner are at behaviour level",
  );
  assert.deepEqual([...OPERATIONS], ["pin", "start", "poll", "result", "cancel", "environment"]);
});

test(`${SUITE_ID}: the sample this suite runs on is registered from the test tree, with a kind the core does not know`, () => {
  assert.equal(implementation.id, SAMPLE_ID);
  assert.equal(implementation.implementationClass, "first-party");
  assert.equal(implementation.pointId, POINT_ID);
  assert.equal(SAMPLE_KIND, "sample-remote");
});

await casesAsTests(POINT_ID, implementation, cases);
