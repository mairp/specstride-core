/**
 * Phase 17 of feature 153, US1b — the gate runs the DECLARED commands of the
 * verification plan (F153-FR-010, -011, -015): `runVerificationGate` calls
 * the gate of feature 105 (`runGateOrCode3`) over the check runner of
 * feature 148, and the literal `npm test` of `checkCommandOf` is gone from
 * the gate path.
 *
 * The cases (tasks T221 to T226):
 *  - T221 CT-153-10 the gate of phase 1 passes on the declared commands,
 *    although the `test` script of `package.json` would fail;
 *  - T222 CT-153-11 two declared commands give exactly two `check.started`
 *    and two `check.ended`, each `check.ended` with the fields of the
 *    catalogue and no others;
 *  - T223 a command argument holding `; touch pwned` runs as ONE argument —
 *    no shell ever sees it;
 *  - T224 the first of two commands fails, the second still ran, and the
 *    red-gate notice names the first command only (F105-FR-032);
 *  - T225 a plan made unreadable after the launch: the attempt ends
 *    `gate-failed`, `verification.ended` carries `rc: 3` and the notice
 *    holds the placeholder of T049;
 *  - T226 CT-153-15 the gate executes EVERY attempt: two rejections and an
 *    approval leave the command run three times.
 *
 * No paid or external model API is called (F153-FR-060): the proposer and
 * the critic are the stub `claude` of the helpers, the commands are `node`
 * and the scripts this file writes beside the workspace.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { CHECK_ENDED_FIELDS } from "../../../check-runner/src/events/check-events.ts";
import { SUMMARY_UNAVAILABLE } from "../../../verification/src/gate/feedback.ts";

import { fixture, type Verdicts } from "./loop-speed-helpers.ts";
import { runFeature } from "../../src/engine/run-feature.ts";
import { workspaceIdOfWorkspace } from "../../src/engine/workspace-control-root.ts";

/** The control root the engine of this fixture's workspace writes. */
function controlRootOf(work: string): string {
  return join(process.env.HOME ?? "", ".specstride", "workspaces", workspaceIdOfWorkspace(work));
}

/** The `bin` directory beside the workspace, where the command scripts live. */
const binOf = (work: string): string => join(work, "..", "bin");

/** The counter: appends one line to the file its argument names. */
const COUNTER = `const fs = require("node:fs");
const [file] = process.argv.slice(2);
fs.appendFileSync(file, "counted\\n");
`;

/** Fails with exit 1 and one `not ok` line on standard error. */
const FAILER = `console.error("not ok: the declared command failed");
process.exit(1);
`;

/** Writes its second argument, as-is, into the file its first argument names. */
const ECHO_ARG = `const fs = require("node:fs");
const [out, text] = process.argv.slice(2);
fs.writeFileSync(out, text);
`;

/** One declared command of the document, absolute and shell-free. */
const declared = (
  id: string,
  script: string,
  args: readonly string[],
  work: string,
): Record<string, unknown> => ({
  id,
  phase: 1,
  executable: "node",
  args: [join(binOf(work), script), ...args],
  cwd: work,
  timeoutSec: 30,
});

type FixtureWithOptions = {
  readonly verdicts: Verdicts;
  /** The declared commands, built with the workspace path. */
  readonly commands: (work: string) => readonly Record<string, unknown>[];
  /** The `test` script of `package.json`, where the workspace holds one. */
  readonly testScript?: string;
  /** Extra environment set for the run, restored with the fixture. */
  readonly env?: Readonly<Record<string, string>>;
  /** Extra statements in the proposer branch of the stub `claude`. */
  readonly proposerExtra?: string;
};

/**
 * The T225 sabotage, run by the stub's proposer pass: the persisted plan
 * record of the run is overwritten with text no plan validates as, so the
 * gate's load of the plan fails and the gate COULD NOT RUN (code 3).
 */
const SABOTAGE_PLAN = `if (process.env.SPECSTRIDE_TEST_SABOTAGE_PLAN === "1") {
    const root = path.join(process.cwd(), "..");
    const wsDir = path.join(root, ".specstride", "workspaces");
    for (const ws of fs.readdirSync(wsDir)) {
      const runsDir = path.join(wsDir, ws, "features", "001-one", "runs");
      if (!fs.existsSync(runsDir)) continue;
      for (const run of fs.readdirSync(runsDir)) {
        const plan = path.join(runsDir, run, "verification", "verification-plan.json");
        if (fs.existsSync(plan)) fs.writeFileSync(plan, "{ this is not a plan");
      }
    }
  }`;

/** The fixture of this file: a workspace, the declared-commands document, the failing `npm test` where said. */
function gateFixture(options: FixtureWithOptions): {
  readonly work: string;
  readonly control: string;
  readonly restore: () => void;
} {
  const f = fixture({ verdicts: options.verdicts, proposerExtra: options.proposerExtra });
  const work = f.dir;
  mkdirSync(binOf(work), { recursive: true });
  for (const [name, text] of [
    ["count-and-pass.cjs", COUNTER],
    ["fail.cjs", FAILER],
    ["echo-arg.cjs", ECHO_ARG],
  ] as const) {
    const path = join(binOf(work), name);
    writeFileSync(path, text);
    chmodSync(path, 0o755);
  }
  if (options.testScript !== undefined) {
    writeFileSync(
      join(work, "package.json"),
      JSON.stringify({ scripts: { test: options.testScript } }),
    );
  }
  // The declared-commands document, in the control plane, with toolchain
  // discovery OFF (`discovery: "none"`): the gate takes its commands from
  // the document alone.
  const control = controlRootOf(work);
  mkdirSync(join(control, "features", "001-one", "verification"), { recursive: true });
  writeFileSync(
    join(control, "features", "001-one", "verification", "verification-commands.json"),
    JSON.stringify({
      schema_version: "specstride.verification-commands/1",
      discovery: "none",
      commands: options.commands(work),
    }),
  );
  const heldEnv: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(options.env ?? {})) {
    heldEnv[key] = process.env[key];
    process.env[key] = value;
  }
  return {
    work,
    control,
    restore: () => {
      for (const [key, value] of Object.entries(heldEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      f.restore();
    },
  };
}

type EventRecord = { type: string; data: Record<string, unknown> };

/** Every event of the run's control plane, in write order. */
function eventsOf(control: string): readonly EventRecord[] {
  const runs = join(control, "runs");
  const all: EventRecord[] = [];
  for (const name of existsSync(runs) ? readdirSync(runs).sort() : []) {
    for (const line of readFileSync(join(runs, name, "events.jsonl"), "utf8").split("\n")) {
      if (line.trim() === "") continue;
      all.push(JSON.parse(line) as EventRecord);
    }
  }
  return all;
}

/** The one run id of the fixture. */
function runIdOf(control: string): string {
  const names = readdirSync(join(control, "runs")).sort();
  assert.equal(names.length, 1, "the fixture made exactly one run");
  return names[0] ?? "";
}

/** The canonical gate result record of one phase attempt (the layout table's place). */
function gateRecordPath(control: string, phase: number, attempt: number): string {
  return join(
    control,
    "features",
    "001-one",
    "runs",
    runIdOf(control),
    "phases",
    String(phase),
    "attempts",
    `e1-a${String(attempt)}`,
    "gate",
    "verification.json",
  );
}

const eventsOfType = (events: readonly EventRecord[], type: string): readonly EventRecord[] =>
  events.filter((event) => event.type === type);

test("T221 CT-153-10 the gate passes on the declared commands, the failing `npm test` apart", async () => {
  const g = gateFixture({
    verdicts: "APPROVED",
    testScript: 'node -e "process.exit(1)"',
    commands: (work) => [declared("verify-one", "count-and-pass.cjs", ["counter-a.txt"], work)],
  });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0, "the run ends approved on the passing declared command");
    // The declared command ran and passed.
    assert.equal(readFileSync(join(g.work, "counter-a.txt"), "utf8"), "counted\n");
    // The engine's verification record holds the declared command, and no
    // `npm test` — the literal check is off the gate path.
    const record = JSON.parse(
      readFileSync(join(g.control, "features", "001-one", "verification", "phase1.1.json"), "utf8"),
    ) as { exit_code: number; mode: string; roster: readonly { name: string; status: string }[] };
    assert.equal(record.exit_code, 0);
    assert.equal(record.mode, "required");
    assert.deepEqual(record.roster, [{ name: "verify-one", status: "passed" }]);
    // The result record of the gate of feature 105 stands at the layout
    // table's place and holds the as-is fields.
    const path = gateRecordPath(g.control, 1, 1);
    assert.ok(existsSync(path), `the gate result record exists at ${path}`);
    const gateRecord = JSON.parse(readFileSync(path, "utf8")) as {
      planId: string;
      gateId: string;
      phase: number;
      passed: boolean;
      commands: readonly { commandId: string; declaredId: string; passed: boolean; stdout: string }[];
    };
    assert.equal(gateRecord.passed, true);
    assert.equal(gateRecord.gateId, "GATE-phase-1");
    assert.equal(gateRecord.phase, 1);
    assert.equal(gateRecord.commands.length, 1);
    assert.equal(gateRecord.commands[0]?.declaredId, "verify-one");
    assert.equal(gateRecord.commands[0]?.passed, true);
    // The record stays digest-free: a stream of a command is not in it.
    assert.ok(
      !JSON.stringify(gateRecord).includes("counted"),
      "the gate record holds no stream of the command",
    );
    // One `check.ended` for the one gate run of the one attempt.
    const ended = eventsOfType(eventsOf(g.control), "check.ended");
    assert.equal(ended.length, 1, `one check.ended: ${JSON.stringify(ended.map((e) => e.data))}`);
    // The attempt that the gate closed was not a rejection.
    const attemptEnds = eventsOfType(eventsOf(g.control), "attempt.ended");
    assert.ok(
      attemptEnds.every((event) => event.data.endCause !== "verification-failed"),
      `no attempt ends on a failed gate: ${JSON.stringify(attemptEnds.map((e) => e.data))}`,
    );
  } finally {
    g.restore();
  }
});

test("T222 CT-153-11 two declared commands give two check pairs, the catalogue fields only", async () => {
  const g = gateFixture({
    verdicts: "APPROVED",
    commands: (work) => [
      declared("verify-one", "count-and-pass.cjs", ["counter-a.txt"], work),
      declared("verify-two", "count-and-pass.cjs", ["counter-b.txt"], work),
    ],
  });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0);
    assert.ok(existsSync(join(g.work, "counter-a.txt")));
    assert.ok(existsSync(join(g.work, "counter-b.txt")), "the second command ran too");
    const events = eventsOf(g.control);
    const started = eventsOfType(events, "check.started");
    const ended = eventsOfType(events, "check.ended");
    assert.equal(started.length, 2, `two check.started: ${JSON.stringify(started.map((e) => e.data))}`);
    assert.equal(ended.length, 2, `two check.ended: ${JSON.stringify(ended.map((e) => e.data))}`);
    const ids = ended.map((event) => event.data.checkId).sort();
    assert.deepEqual(ids, ["verify-one", "verify-two"].sort());
    // Each close holds EXACTLY the fields of the catalogue row, no others.
    for (const event of ended) {
      assert.deepEqual(
        Object.keys(event.data).sort(),
        [...CHECK_ENDED_FIELDS].sort(),
        `the fields of check.ended: ${JSON.stringify(Object.keys(event.data).sort())}`,
      );
    }
  } finally {
    g.restore();
  }
});

test("T223 an argument holding `; touch pwned` is one argument, never a shell line", async () => {
  const g = gateFixture({
    verdicts: "APPROVED",
    commands: (work) => [
      declared("verify-one", "echo-arg.cjs", ["arg.txt", "a; touch pwned"], work),
    ],
  });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0, `the argument is passed verbatim: exit ${String(exit)}`);
    assert.equal(readFileSync(join(g.work, "arg.txt"), "utf8"), "a; touch pwned");
    assert.ok(!existsSync(join(g.work, "pwned")), "no shell ran the second statement");
  } finally {
    g.restore();
  }
});

test("T224 the first command fails, the second still ran, the notice names the first only", async () => {
  const g = gateFixture({
    verdicts: "APPROVED",
    commands: (work) => [
      declared("verify-one", "fail.cjs", [], work),
      declared("verify-two", "count-and-pass.cjs", ["counter-b.txt"], work),
    ],
  });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.notEqual(exit, 0, "a failed gate command rejects the attempt");
    // F105-FR-032 — the gate never stops at a failed command: the second ran.
    assert.ok(existsSync(join(g.work, "counter-b.txt")), "the second command still ran");
    const record = JSON.parse(
      readFileSync(join(g.control, "features", "001-one", "verification", "phase1.1.json"), "utf8"),
    ) as { exit_code: number; roster: readonly { name: string; status: string }[] };
    assert.equal(record.exit_code, 10);
    assert.deepEqual(
      record.roster,
      [
        { name: "verify-one", status: "failed" },
        { name: "verify-two", status: "passed" },
      ],
    );
    // The attempt ended gate-failed.
    const attemptEnds = eventsOfType(eventsOf(g.control), "attempt.ended");
    assert.ok(
      attemptEnds.some((event) => event.data.endCause === "verification-failed"),
      `an attempt ends on the failed gate: ${JSON.stringify(attemptEnds.map((e) => e.data))}`,
    );
    // The red-gate notice names the failed command only. The attempt is
    // never approved, so the notice stands in the feedback directory.
    const notice = readFileSync(
      join(g.control, "features", "001-one", "feedback", "phase1.1.md"),
      "utf8",
    );
    assert.ok(notice.includes("verify-one"), "the notice names the failed command");
    assert.ok(
      !notice.includes("verify-two"),
      `the notice names no passed command: ${notice}`,
    );
    assert.ok(notice.includes("not ok: the declared command failed"), "the notice holds the failing line");
    // T230 — `## References` names the REAL logical names: the persisted plan
    // record and the gate result record of this attempt, never the invented
    // `…:verification-plan` string.
    assert.ok(
      notice.includes(`run:${runIdOf(g.control)}:verification:plan`),
      `the notice names the persisted plan record: ${notice}`,
    );
    assert.ok(notice.includes("attempt:1:1:1:verification"), "the notice names the gate result record");
    assert.ok(!notice.includes("verification-plan"), "the invented plan name is gone");
  } finally {
    g.restore();
  }
});

test("T225 a plan unreadable after the launch: rc 3 on the event, the placeholder in the notice", async () => {
  const g = gateFixture({
    verdicts: "APPROVED",
    env: { SPECSTRIDE_TEST_SABOTAGE_PLAN: "1" },
    proposerExtra: SABOTAGE_PLAN,
    commands: (work) => [declared("verify-one", "count-and-pass.cjs", ["counter-a.txt"], work)],
  });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.notEqual(exit, 0, "a gate that could not run is a red gate");
    assert.ok(!existsSync(join(g.work, "counter-a.txt")), "no command ran");
    const events = eventsOf(g.control);
    const closes = eventsOfType(events, "verification.ended");
    assert.ok(closes.length >= 1, "the gate closed its pair");
    assert.equal(closes[0]?.data.rc, 3, `the code of a gate that could not run: ${JSON.stringify(closes[0]?.data)}`);
    // T233 — no record was written, so `evidenceRef` names NO record: the
    // `"none"` convention, and no gate record file exists anywhere under the
    // feature's runs (`…/gate/verification.json`).
    assert.equal(
      closes[0]?.data.evidenceRef,
      "none",
      `no record named for a gate that could not run: ${JSON.stringify(closes[0]?.data)}`,
    );
    const recordFiles = readdirSync(join(g.control, "features", "001-one"), { recursive: true })
      .map((entry) => String(entry))
      .filter((path) => path.endsWith(join("gate", "verification.json")));
    assert.equal(recordFiles.length, 0, `no gate record exists: ${JSON.stringify(recordFiles)}`);
    // The attempt ended gate-failed.
    const attemptEnds = eventsOfType(events, "attempt.ended");
    assert.ok(
      attemptEnds.some((event) => event.data.endCause === "verification-failed"),
      `an attempt ends on the failed gate: ${JSON.stringify(attemptEnds.map((e) => e.data))}`,
    );
    // The notice carries the placeholder of T049 — no digest could be made.
    const notice = readFileSync(
      join(g.control, "features", "001-one", "feedback", "phase1.1.md"),
      "utf8",
    );
    assert.ok(notice.includes(SUMMARY_UNAVAILABLE), `the notice holds the placeholder: ${notice}`);
    // T230, code 3 — the plan name stays the REAL logical name (the plan was
    // persisted at launch; only its content was made unreadable), and the
    // record stays `"none"`: no gate record was written.
    assert.ok(
      notice.includes(`run:${runIdOf(g.control)}:verification:plan`),
      `the notice names the persisted plan record: ${notice}`,
    );
    assert.ok(!notice.includes("attempt:1:1:1:verification"), "no record is named when none was written");
    assert.ok(!notice.includes("verification-plan"), "the invented plan name is gone");
  } finally {
    g.restore();
  }
});

test("T226 CT-153-15 the gate executes every attempt: three attempts, three runs", async () => {
  const g = gateFixture({
    verdicts: ["REJECTED", "REJECTED", "APPROVED"],
    commands: (work) => [declared("verify-one", "count-and-pass.cjs", ["counter-a.txt"], work)],
  });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.notEqual(exit, undefined);
    const events = eventsOf(g.control);
    const opens = eventsOfType(events, "verification.started");
    const ended = eventsOfType(events, "check.ended");
    assert.equal(opens.length, 3, `three attempts opened their gate: ${JSON.stringify(opens.map((e) => e.data))}`);
    assert.equal(ended.length, 3, `the gate ran its command at every attempt: ${JSON.stringify(ended.map((e) => e.data))}`);
    const lines = readFileSync(join(g.work, "counter-a.txt"), "utf8").trim().split("\n");
    assert.equal(lines.length, 3, `one line per attempt: ${JSON.stringify(lines)}`);
    assert.notEqual(exit, 1, `the run stopped for no other reason: exit ${String(exit)}`);
  } finally {
    g.restore();
  }
});


