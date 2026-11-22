// Feature 153, phase 27 (US5) — the task-group cases of the engine
// (`loop-speed-groups.test.ts`, CT-153-56, F153-SC-015, CT-153-5; T376, T377,
// T381):
//
//  - CT-153-56 — when the checkpoint of a pass completes a group, the
//    group's acceptance check runs through the check runner (T038), the
//    review is a critic-class call with a fresh session, a nonce and no
//    tools, and the only file the review leaves is the pins record;
//  - F153-SC-015 — a group review approves nothing: 0 approval records are
//    written by it, no outer counter moves, and no exit code or stop reason
//    is added;
//  - CT-153-5 — with the switch off, and under `parity`, a unit is the
//    checkpoint claim (F115-FR-009): no group is checked and no review runs.
//
// No paid or external model API is called (F153-FR-060): the agents are a
// stub executable this file writes, the check a script this file writes. The
// stub logs its prompts OUTSIDE the working tree (under `HOME`): a nonce of a
// call must never reach the working tree (F101-FR-006, threat T-05) — a log
// inside the tree would leak the review's nonce into the gate's evidence and
// break the gate's nonce check for a reason no requirement names.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { tmpdir } from "node:os";
import test from "node:test";

import { runFeature } from "../../src/engine/run-feature.ts";
import { loopConfigurationOf } from "../../src/engine/loop-config.ts";
import { workspaceIdOfWorkspace } from "../../src/engine/workspace-control-root.ts";
import { verdictPinsRecordPath } from "../../../core/src/critic-input/pins/store.ts";
import { sliceThePhase } from "../../../core/src/spec-groups/slicer.ts";
import { fixture, type Verdicts } from "./loop-speed-helpers.ts";

/** The control root the engine of this fixture's workspace writes. */
function controlOf(work: string): string {
  return join(process.env.HOME ?? "", ".specstride", "workspaces", workspaceIdOfWorkspace(work));
}

/** The `bin` directory beside the workspace, where the check scripts live. */
const binOf = (work: string): string => join(work, "..", "bin");

/** The check: appends one line to the file its argument names and exits 0. */
const COUNTER = `const fs = require("node:fs");
const [file] = process.argv.slice(2);
fs.appendFileSync(file, "counted\\n");
`;

/** One declared command of the verification-commands document, shell-free. */
const declared = (work: string): Record<string, unknown> => ({
  id: "verify-group-one",
  phase: 1,
  executable: "node",
  args: [join(binOf(work), "count-and-pass.cjs"), join(work, "checks.txt")],
  cwd: work,
  timeoutSec: 30,
});

/**
 * The stub `claude` of this file: the proposer claims the phase's three tasks
 * at the u1 checkpoint, the critic answers from `verdicts` in call order. The
 * prompt log goes to `HOME`, never into the working tree.
 */
const groupsStub = (verdicts: Verdicts): string => `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC");
const role = prompt.includes("Diagnostician") ? "diagnostician" : (critic ? "critic" : "proposer");
const VERDICTS = ${JSON.stringify(Array.isArray(verdicts) ? verdicts : [verdicts])};
const log = path.join(process.env.HOME, "prompts.jsonl");
fs.appendFileSync(log, JSON.stringify({ role, prompt, session }) + "\\n");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (role === "diagnostician") {
  console.log(JSON.stringify({ type: "result", result: "CASE: GROUNDING\\nName the missing test of T001." }));
} else if (critic) {
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  const n = fs.existsSync(log + ".calls") ? Number(fs.readFileSync(log + ".calls", "utf8")) : 0;
  fs.writeFileSync(log + ".calls", String(n + 1));
  const verdict = VERDICTS[Math.min(n, VERDICTS.length - 1)];
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": " + verdict }));
} else {
  const evidence = (/Write your evidence to (\\.specstride\\S+?) \\(/i.exec(prompt) ?? /write (\\.specstride\\S+?):/i.exec(prompt))[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  fs.writeFileSync("made.txt", "work\\n");
  fs.mkdirSync(".specstride/features/001-one/outbox", { recursive: true });
  fs.writeFileSync(
    ".specstride/features/001-one/outbox/u1.checkpoint.json",
    JSON.stringify({ schema: "specstride.checkpoint/1", tasks: ["T001", "T002", "T003"] }),
  );
  const tasks = "specs/001-one/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replaceAll("[ ]", "[x]"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;

type GroupsFixture = {
  readonly work: string;
  readonly control: string;
  readonly events: () => readonly { type: string; data: Record<string, unknown> }[];
  readonly prompts: () => readonly { role: string; prompt: string; session: string }[];
  readonly restore: () => void;
};

/** A fixture with the groups switch on and one declared, passing check. */
function groupsFixture(verdicts: Verdicts): GroupsFixture {
  const f = fixture({ verdicts });
  const work = f.dir;
  // Three tasks: the micro layer engages only over more than one unit
  // (`single-unit` disengages it over one), and with the default size 5
  // (CQ-153-15 A) the phase is one group of three, rule TG-2.
  writeFileSync(
    join(work, "specs", "001-one", "tasks.md"),
    "# Tasks\n\n## Phase 1: One\n\n- [ ] T001 Do it\n- [ ] T002 Do more\n- [ ] T003 Do the rest\n",
  );
  // The stub of this file (the prompt log lives under `HOME`, never in the tree).
  writeFileSync(join(binOf(work), "claude"), groupsStub(verdicts));
  chmodSync(join(binOf(work), "claude"), 0o755);
  // A `test` script: the engine runs `micro` only over a workspace with a
  // declared check (`gate-not-executing` falls back to `classic`).
  writeFileSync(join(work, "package.json"), JSON.stringify({ scripts: { test: "node bin/noop.cjs" } }));
  mkdirSync(join(work, "bin"), { recursive: true });
  writeFileSync(join(work, "bin", "noop.cjs"), "process.exit(0);\n");
  // The switch on, in the USER file (row 142, trust class `N off`): a project
  // file may only narrow an off-by-default switch, so `on` stands at the rank
  // above it. No size key is set, so the default 5 of CQ-153-15 A stands.
  const userDir = join(process.env.HOME ?? "", ".config", "specstride");
  mkdirSync(userDir, { recursive: true });
  writeFileSync(join(userDir, "config.yaml"), "schema: 1\nloop:\n  taskGroups: true\n");
  // The check scripts, and the declared-commands document in the control
  // plane (the gate takes its commands from the document alone, discovery
  // `none` — F105-FR-015); the group resolves its acceptance check from the
  // same commands (F153-FR-055).
  writeFileSync(join(binOf(work), "count-and-pass.cjs"), COUNTER);
  chmodSync(join(binOf(work), "count-and-pass.cjs"), 0o755);
  const control = controlOf(work);
  mkdirSync(join(control, "features", "001-one", "verification"), { recursive: true });
  writeFileSync(
    join(control, "features", "001-one", "verification", "verification-commands.json"),
    JSON.stringify({
      schema_version: "specstride.verification-commands/1",
      discovery: "none",
      commands: [declared(work)],
    }),
  );
  // T379 — the engine reads the frozen groups from the LAUNCH RECORD of the
  // run (`launch:<launchId>:record`, through `SPECSTRIDE_LAUNCH_ID`): it
  // recomputes the slicing nowhere. This fixture names a launch and writes
  // the record the derivation would have written: the groups of the phase
  // as the ONE pure table slices them, with the declared command as the
  // acceptance check. The record-wins case below writes DIFFERENT groups.
  process.env.SPECSTRIDE_LAUNCH_ID = "L1";
  const sliced = sliceThePhase({
    phase: 1,
    tasks: [
      { id: "T001", text: "Do it" },
      { id: "T002", text: "Do more" },
      { id: "T003", text: "Do the rest" },
    ],
    pathsOfTask: () => [],
    declaredCommands: [
      {
        id: "verify-group-one",
        argv: ["node", join(binOf(work), "count-and-pass.cjs"), join(work, "checks.txt")],
        forTaskIds: ["T001", "T002", "T003"],
      },
    ],
  });
  const recordPath = join(control, "launches", "L1", "launch.json");
  mkdirSync(dirname(recordPath), { recursive: true });
  writeFileSync(
    recordPath,
    JSON.stringify({
      schema: "specstride.launch/1",
      configuration: {
        taskGroups: {
          schema: "specstride.task-groups-frozen/1",
          hashes: { phase1: sliced.hash },
          groups: sliced.groups,
        },
      },
    }),
  );
  return {
    work,
    control,
    events: () => {
      const runs = join(controlOf(work), "runs");
      const all: { type: string; data: Record<string, unknown> }[] = [];
      for (const run of existsSync(runs) ? readdirSync(runs).sort() : []) {
        const file = join(runs, run, "events.jsonl");
        if (!existsSync(file)) continue;
        for (const line of readFileSync(file, "utf8").split("\n")) {
          if (line.trim() === "") continue;
          all.push(JSON.parse(line) as { type: string; data: Record<string, unknown> });
        }
      }
      return all;
    },
    prompts: () =>
      existsSync(join(process.env.HOME ?? "", "prompts.jsonl"))
        ? readFileSync(join(process.env.HOME ?? "", "prompts.jsonl"), "utf8")
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map((line) => JSON.parse(line) as { role: string; prompt: string; session: string })
        : [],
    restore: () => {
      delete process.env.SPECSTRIDE_LAUNCH_ID;
      f.restore();
    },
  };
}

function listTree(dir: string): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTree(p));
    else out.push(p);
  }
  return out;
}

/** The approval records of the control plane. */
function approvalRecords(control: string): readonly string[] {
  const dir = join(control, "features", "001-one", "approvals");
  return existsSync(dir) ? readdirSync(dir) : [];
}

test("CT-153-56 a completed group is checked and reviewed", async () => {
  // Two critic-class calls: the group review first, then the phase gate.
  const g = groupsFixture(["APPROVED", "APPROVED"]);
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0);
    const events = g.events();
    // The group's acceptance check ran, through the check runner (T038), and
    // passed; the event names the DECLARED id of the command (F153-FR-055).
    const checked = events.filter((event) => event.type === "group.checked");
    assert.equal(checked.length, 1, "exactly one group.checked");
    assert.equal(checked[0]?.data.groupId, "phase1-g1");
    assert.equal(checked[0]?.data.ruleId, "verify-group-one");
    assert.equal(checked[0]?.data.outcome, "passed");
    assert.ok(events.some((event) => event.type === "check.started"), "the runner ran the check");
    // The declared command itself ran (its side effect is on disk), once by
    // the group check and once more at the gate.
    const counts = readFileSync(join(g.work, "checks.txt"), "utf8").split("counted").length - 1;
    assert.ok(counts >= 2, `the declared command ran at least twice, saw ${String(counts)}`);
    // The review is a critic-class call: a fresh session, a nonce, no tools,
    // before the phase gate's call.
    const criticPrompts = g.prompts().filter((record) => record.role === "critic");
    assert.equal(criticPrompts.length, 2, "the review and the gate are two critic calls");
    assert.match(criticPrompts[0]?.prompt ?? "", /^You are the CRITIC/);
    assert.match(criticPrompts[0]?.prompt ?? "", /task group phase1-g1 of phase 1/);
    assert.match(criticPrompts[0]?.prompt ?? "", /T001, T002, T003/);
    assert.match(criticPrompts[0]?.prompt ?? "", /VERDICT [0-9a-f]{16}: APPROVED/);
    // The review ran BEFORE the gate judged the phase, with its own prompt.
    assert.ok((criticPrompts[1]?.prompt ?? "").includes("really done"), "the second call is the gate");
    assert.notEqual(criticPrompts[0]?.prompt, criticPrompts[1]?.prompt);
    // The review event records the verdict of the closed set, never a prompt.
    const review = events.filter((event) => event.type === "group.review");
    assert.equal(review.length, 1, "exactly one group.review");
    assert.equal(review[0]?.data.outcome, "APPROVED");
    // F153-SC-015 — the review's only durable effect is pins: it wrote no
    // approval record, and an APPROVED review leaves no pins record either.
    assert.deepEqual(approvalRecords(g.control), ["phase-1.json"], "one approval, the gate's");
    const phasesDir = join(g.control, "features", "001-one", "phases");
    assert.ok(
      !listTree(join(g.control, "features", "001-one")).some((p) => p.includes("verdict-pins")),
      "the only files a review may leave are pins records — an APPROVED review leaves none",
    );
  } finally {
    g.restore();
  }
});

test("CT-153-57 approval and commit stay per phase: the gate still runs in full over the phase", async () => {
  // The group is the unit of a PASS, never of an APPROVAL: with groups on,
  // the phase gate still runs the full verification gate and a fresh critic
  // call over the WHOLE phase (not the group), and the approval record and
  // the approval commit of the run belong to the phase alone — one each
  // (F153-FR-057, F101-FR-019, F101-FR-035).
  const g = groupsFixture(["APPROVED", "APPROVED"]);
  try {
    // The fixture is a git repository with ONE initial commit (`fixture` of
    // `loop-speed-helpers.ts`), and `SPECSTRIDE_GIT_COMMITS` is unset, so the
    // engine's default `auto` stands: the approval commit is enabled.
    const head = () =>
      spawnSync("git", ["-C", g.work, "rev-list", "--count", "HEAD"]).stdout.toString().trim();
    const subjects = () =>
      spawnSync("git", ["-C", g.work, "log", "--format=%s", "--reverse", "HEAD"])
        .stdout.toString()
        .split("\n")
        .filter((line) => line !== "");
    assert.equal(head(), "1", "the fixture starts at exactly the initial commit");
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0);
    const events = g.events();

    // 1. The verification gate ran AT THE PHASE: the declared command ran at
    //    the group check AND again at the gate, and the gate emitted its own
    //    check start (T038) — the group check does not stand in for the gate.
    const counts = readFileSync(join(g.work, "checks.txt"), "utf8").split("counted").length - 1;
    assert.ok(counts >= 2, `the declared command ran at the gate too, saw ${String(counts)}`);
    const checkStarts = events.filter((event) => event.type === "check.started");
    assert.ok(checkStarts.length >= 2, "a check started for the group AND for the gate");

    // 2. A FRESH critic call over the whole phase: the second critic call is
    //    the gate, not the review — it names the phase (not the group), it
    //    carries its own session id and its own nonce, and its task section
    //    is the phase's whole section, not the group's task list.
    const criticPrompts = g.prompts().filter((record) => record.role === "critic");
    assert.equal(criticPrompts.length, 2, "the review and the gate are two critic calls");
    const review = criticPrompts[0] ?? { prompt: "", session: "" };
    const gate = criticPrompts[1] ?? { prompt: "", session: "" };
    assert.match(review.prompt, /task group phase1-g1 of phase 1/);
    assert.match(review.prompt, /The tasks of the group\n/);
    assert.match(gate.prompt, /judge whether phase 1 of the\s*feature is really done/);
    assert.ok(gate.prompt.includes("The tasks of the phase"), "the gate judges the PHASE's tasks");
    assert.ok(!gate.prompt.includes("The tasks of the group"), "the gate is not the group review");
    assert.notEqual(review.session, gate.session, "the gate is a FRESH session, not the review's");
    const nonceOf = (prompt: string): string =>
      /VERDICT ([0-9a-f]{16}): APPROVED/.exec(prompt)?.[1] ?? "";
    assert.notEqual(nonceOf(review.prompt), "", "the review carried a nonce");
    assert.notEqual(nonceOf(gate.prompt), "", "the gate carried a nonce");
    assert.notEqual(
      nonceOf(review.prompt),
      nonceOf(gate.prompt),
      "the gate's nonce is the review's: a fresh call over the whole phase",
    );
    // The whole-phase change stands in the gate's prompt: all three tasks of
    // the phase, not only the group the pass completed.
    for (const task of ["T001", "T002", "T003"]) {
      assert.ok(gate.prompt.includes(task), `the gate's prompt carries ${task}`);
    }

    // 3. Exactly ONE approval record, the gate's, for the phase.
    assert.deepEqual(approvalRecords(g.control), ["phase-1.json"]);

    // 4. Exactly ONE commit per approved phase: the review left NO commit —
    //    the only commit of the run is the gate's, with the as-is message
    //    that names the phase (F101-FR-035).
    const commitEvents = events.filter((event) => event.type === "commit.made");
    assert.equal(commitEvents.length, 1, "exactly one commit event: the gate's");
    assert.equal(commitEvents[0]?.data.phase, 1);
    assert.equal(head(), "2", "exactly one commit was added after the initial one");
    assert.match(subjects()[1] ?? "", /^specstride: phase 1 approved/);
  } finally {
    g.restore();
  }
});

test("F153-SC-015 a REJECTED group review leaves only the pins record, and moves no counter", async () => {
  // The group review REJECTS; the phase gate still APPROVES the phase.
  const g = groupsFixture(["REJECTED", "APPROVED"]);
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    // No exit code was added: the phase is approved, the run ends 0.
    assert.equal(exit, 0);
    const events = g.events();
    const review = events.filter((event) => event.type === "group.review");
    assert.equal(review.length, 1, "exactly one group.review");
    assert.equal(review[0]?.data.outcome, "REJECTED");
    assert.equal(review[0]?.data.groupId, "phase1-g1");
    // 0 approval records were written by the review: the one record of the
    // run is the gate's, for the phase.
    assert.deepEqual(approvalRecords(g.control), ["phase-1.json"]);
    // The only file the review left is the pins record.
    const pinsPath = verdictPinsRecordPath(join(g.control, "features", "001-one", "phases"), 1);
    // F153-FR-048 — the approval of the phase removed the pins record again:
    // the record lived only between the review and the approval, so the end
    // state holds no verdict-pins file at all.
    assert.ok(
      !existsSync(pinsPath),
      "the approval removed the pins record (F153-FR-048)",
    );
    // No outer counter moved: no extra attempt for the review — the run is
    // the one attempt the phase always takes.
    const attempts = events.filter((event) => event.type === "attempt.started");
    assert.equal(attempts.length, 1, "one attempt, the phase's own");
  } finally {
    g.restore();
  }
});

test("CT-153-5 off and parity are today: a unit is the checkpoint claim", async () => {
  // With the switch off (its default), the configuration carries no slicing:
  // the unit stays the checkpoint claim (F115-FR-009). Under `parity` the
  // same: the row is off under the profile, whatever a source holds.
  const root = mkdtempSync(join(tmpdir(), "specstride-groups-ct-153-5-"));
  try {
    const plain = loopConfigurationOf({ home: root, workdir: root, environment: {} });
    assert.equal(
      plain.taskGroupsAreSliced,
      false,
      "row 142: off by default — a unit is the checkpoint claim",
    );
    const parityHome = join(root, "parity-home");
    const parityDir = join(parityHome, ".config", "specstride");
    mkdirSync(parityDir, { recursive: true });
    writeFileSync(join(parityDir, "config.yaml"), "schema: 1\nprofile: parity\n");
    const parity = loopConfigurationOf({
      home: parityHome,
      workdir: root,
      environment: {},
    });
    assert.equal(parity.taskGroupsAreSliced, false, "row 142: off under parity (F115-FR-009)");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  // And an engine run with the switch off runs no group check and no review:
  // today's run, no slicing at all.
  const off = fixture({ verdicts: "APPROVED" });
  try {
    const code = await runFeature({ argv: [], workdir: off.dir });
    assert.equal(code, 0);
    const runs = join(controlOf(off.dir), "runs");
    let body = "";
    for (const run of existsSync(runs) ? readdirSync(runs).sort() : []) {
      const file = join(runs, run, "events.jsonl");
      if (existsSync(file)) body += readFileSync(file, "utf8");
    }
    assert.ok(!body.includes("group.checked"), "no group check runs with the switch off");
    assert.ok(!body.includes("group.review"), "no group review runs with the switch off");
  } finally {
    off.restore();
  }
});

test("CT-153-5 under `parity` an engine run with groups configured still runs no group", async () => {
  // The parity profile reads the switch off whatever a source holds, so a
  // parity run never slices and never reviews (the guard of F115-FR-009).
  const g = groupsFixture("APPROVED");
  try {
    const userDir = join(process.env.HOME ?? "", ".config", "specstride");
    mkdirSync(userDir, { recursive: true });
    writeFileSync(
      join(userDir, "config.yaml"),
      "schema: 1\nprofile: parity\nloop:\n  taskGroups: true\n",
    );
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0);
    const body = g
      .events()
      .map((event) => event.type)
      .join("\n");
    assert.ok(!body.includes("group.checked"), "under parity no group check runs");
    assert.ok(!body.includes("group.review"), "under parity no group review runs");
  } finally {
    g.restore();
  }
});

test("T379 the pass unit follows the frozen RECORD, not what a re-slice would give", async () => {
  // The engine recomputes the slicing nowhere: whatever the launch record
  // froze is the unit of the pass. This record carries groups a re-slice of
  // the same sources would NEVER give — split two ways, under other group
  // ids — so a passing run can only be explained by the record.
  const g = groupsFixture(["APPROVED", "APPROVED"]);
  try {
    const argv = ["node", join(binOf(g.work), "count-and-pass.cjs"), join(g.work, "checks.txt")];
    mkdirSync(dirname(join(g.control, "launches", "L1", "launch.json")), { recursive: true });
    writeFileSync(
      join(g.control, "launches", "L1", "launch.json"),
      JSON.stringify({
        schema: "specstride.launch/1",
        configuration: {
          taskGroups: {
            schema: "specstride.task-groups-frozen/1",
            hashes: { phase1: "record-hash-of-a-different-slicing" },
            groups: [
              {
                schema: "specstride.task-group/1",
                groupId: "record-g1",
                phase: 1,
                taskIds: ["T001"],
                writeScope: { prefixes: [], source: "task-text" },
                acceptanceCheck: { kind: "declared", id: "verify-group-one", argv },
                sizeRuleId: "TG-3",
              },
              {
                schema: "specstride.task-group/1",
                groupId: "record-g2",
                phase: 1,
                taskIds: ["T002", "T003"],
                writeScope: { prefixes: [], source: "task-text" },
                acceptanceCheck: { kind: "declared", id: "verify-group-one", argv },
                sizeRuleId: "TG-3",
              },
            ],
          },
        },
      }),
    );
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0);
    const events = g.events();
    // The check and the review ran over the RECORD's first group: its id and
    // its task list, not the ids the pure table derives from the sources.
    const checked = events.filter((event) => event.type === "group.checked");
    assert.equal(checked.length, 1, "exactly one group.checked");
    assert.equal(checked[0]?.data.groupId, "record-g1", "the unit is the record's group");
    const review = events.filter((event) => event.type === "group.review");
    assert.equal(review.length, 1, "exactly one group.review");
    assert.equal(review[0]?.data.groupId, "record-g1");
    const criticPrompts = g.prompts().filter((record) => record.role === "critic");
    assert.ok(
      (criticPrompts[0]?.prompt ?? "").includes("record-g1"),
      "the review names the record's group id",
    );
    assert.ok(
      /The tasks of the group\nT001\n/.test(criticPrompts[0]?.prompt ?? ""),
      "the review's task section holds only the record group's task",
    );
    // The slicing the sources would give (phase1-g1 of three) ran nowhere.
    const body = events.map((event) => JSON.stringify(event.data)).join("\n");
    assert.ok(!body.includes("phase1-g1"), "no re-sliced group id appears anywhere");
  } finally {
    g.restore();
  }
});

test("T379 a record without the taskGroups block gives no groups: the unit stays the checkpoint claim", async () => {
  // The STATED FALLBACK: an older record (no `configuration.taskGroups`)
  // gives NO groups — the engine never re-slices in its place, so a unit
  // stays the checkpoint claim and no group check or review runs.
  const g = groupsFixture(["APPROVED"]);
  try {
    writeFileSync(
      join(g.control, "launches", "L1", "launch.json"),
      JSON.stringify({ schema: "specstride.launch/1", configuration: {} }),
    );
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0);
    const body = g
      .events()
      .map((event) => event.type)
      .join("\n");
    assert.ok(!body.includes("group.checked"), "no group check without a frozen record");
    assert.ok(!body.includes("group.review"), "no group review without a frozen record");
    // Exactly one critic call: the phase gate only — no group review happened.
    assert.equal(g.prompts().filter((record) => record.role === "critic").length, 1);
  } finally {
    g.restore();
  }
});
