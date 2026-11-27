/**
 * T156 (feature 154, Phase 17, G8) — THE TICK ORDER AUDIT (V-11,
 * F154-FR-073).
 *
 * A task checkbox of the workspace moves only when its phase is APPROVED —
 * never earlier, and never for a unit whose phase was never approved at
 * all.
 *
 *  - THE RUN: a run of the `phases` fixture (`loop.phases.parallel` on).
 *    The stub `claude` never ticks; it only OBSERVES — every call appends
 *    the workspace task list's snapshot together with the number of event
 *    lines then on the run's events file, so every snapshot is placed in
 *    the event order without a shared clock. The engine writes the ticks
 *    itself (`tasks.ticked`, one event per approved phase): the audit
 *    asserts each phase's tick event stands AFTER that phase's approval
 *    event, and that every snapshot taken before the approval still shows
 *    the phase's box unchecked — ticks of a later phase are written ONLY
 *    upon that phase's approval (V-11, F154-FR-073a).
 *  - THE SET-ASIDE UNIT: a coordinator started at a gate (rate above the
 *    threshold), whose speculative unit ticks its tasks INSIDE the tree
 *    (the tree's own task list copy), and is then set aside with
 *    `resolveOnRejection`. The workspace's task list stands unchanged —
 *    ZERO ticks landed (F154-FR-073b), the tree directory is gone (its
 *    ticks died with it), no event of the discarded unit records a tick or
 *    an approval, and the set-aside record exists (F154-FR-064) yet
 *    carries no tick, no attempt kind, no run state, no stop reason and no
 *    exit code.
 *
 * Run from the repository root:
 *     node --experimental-strip-types --test tests/parallel/154/ticks-154.test.ts
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { runFeature } from "../../../packages/cli/src/engine/run-feature.ts";
import { controlRootOfWorkspace } from "../../../packages/cli/src/engine/workspace-control-root.ts";
import { pinEngineEnv } from "../../../packages/cli/test/engine/helpers/fixture.ts";
import {
  SPECULATION_ADMISSION_EVENT,
  SPECULATION_INTEGRATED_EVENT,
  SPECULATION_SET_ASIDE_EVENT,
  speculationCoordinatorOf,
  type SpeculationAdmissionData,
} from "../../../packages/cli/src/engine/speculation.ts";
import { recordCarriesNoKindOrStopReason } from "../../../packages/core/src/speculation/set-aside.ts";

/** The task list OF THE PHASES FIXTURE (T132): three phases, 2 and 3 declared. */
const PHASES_TASKS = readFileSync(
  join(import.meta.dirname, "../../fixtures/154/phases/tasks.md"),
  "utf8",
);

/** The task list OF THE SPEC FIXTURE (T141): the speculation fixture. */
const SPEC_TASKS = readFileSync(
  join(import.meta.dirname, "../../fixtures/154/spec/tasks.md"),
  "utf8",
);

/** The ids a task list holds already ticked. */
const checkedOf = (snapshot: string): readonly string[] =>
  [...snapshot.matchAll(/- \[x\] (T00\d)/g)].map((one) => one[1]);

/* ------------------------------------------------------------------ */
/* Part (a) — ticks of a later phase land only upon its approval        */
/* ------------------------------------------------------------------ */

/** One observation the stub recorded: where the event order stood, and what the workspace task list then showed. */
type TickObservation = {
  readonly role: "PROPOSER" | "CRITIC";
  readonly phase: number;
  /** Non-empty event lines on the run's events file at call time. */
  readonly eventsLines: number;
  readonly workspaceTasks: string;
};

/**
 * The phases workspace (the path-leak harness, T152, with the stub turned
 * from a TICKER into an OBSERVER: it ticks nothing — the engine writes the
 * workspace ticks itself — and instead appends, at every call, the
 * workspace task list's snapshot and the events file's then line count).
 */
function phasesWorkspaceOfFixture(): {
  readonly dir: string;
  readonly promptLog: string;
  readonly observationLog: string;
  readonly restore: () => void;
} {
  const dir = mkdtempSync(join(tmpdir(), "specstride-g8-ticks-"));
  const bin = join(dir, "bin");
  const work = join(dir, "work");
  const promptLog = join(dir, "prompts.log");
  const observationLog = join(dir, "observations.log");
  mkdirSync(bin);
  mkdirSync(join(work, "specs", "154-phases"), { recursive: true });
  // The control root the run will write (HOME is pinned to `dir` before the
  // engine starts, so the id is the first 16 hex digits of sha256(workdir)).
  const controlRoot = join(
    dir,
    ".specstride",
    "workspaces",
    createHash("sha256").update(work).digest("hex").slice(0, 16),
  );
  writeFileSync(
    join(bin, "claude"),
    `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC");
fs.appendFileSync(${JSON.stringify(promptLog)}, (critic ? "CRITIC\\n" : "PROPOSER\\n") + prompt + "\\n---8<---\\n");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (critic) {
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  console.log(JSON.stringify({ type: "result", result: "T00x judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  const evidence = (/Write your evidence to (\\.specstride\\S+?) \\(/i.exec(prompt) ?? /write (\\.specstride\\S+?):/i.exec(prompt))[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T00x done\\n");
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
// THE OBSERVATION (both roles): the workspace task list as it stands at
// call time, and how far the run's event order has got — the stub ticks
// NOTHING; the engine is the only writer of the workspace's checkboxes.
const marker = /(?:implementing|judge whether) phase (\\d+)/.exec(prompt);
const cr = ${JSON.stringify(controlRoot)};
let eventsLines = 0;
const runsDir = path.join(cr, "runs");
if (fs.existsSync(runsDir)) {
  for (const runId of fs.readdirSync(runsDir)) {
    const events = path.join(runsDir, runId, "events.jsonl");
    if (fs.existsSync(events)) {
      eventsLines = fs.readFileSync(events, "utf8").split("\\n").filter((l) => l.trim() !== "").length;
    }
  }
}
const snapshot = fs.readFileSync(${JSON.stringify(join(work, "specs", "154-phases", "tasks.md"))}, "utf8");
fs.appendFileSync(${JSON.stringify(observationLog)}, JSON.stringify({
  role: critic ? "CRITIC" : "PROPOSER",
  phase: marker ? Number(marker[1]) : 0,
  eventsLines,
  workspaceTasks: snapshot,
}) + "\\n");
`,
  );
  chmodSync(join(bin, "claude"), 0o755);
  writeFileSync(join(work, "specs", "154-phases", "tasks.md"), PHASES_TASKS);
  for (const argv of [
    ["init", "-q"],
    ["config", "user.email", "t@t"],
    ["config", "user.name", "t"],
    ["add", "-A"],
    ["commit", "-qm", "init"],
  ]) {
    spawnSync("git", ["-C", work, ...argv]);
  }
  const before = {
    HOME: process.env.HOME,
    PATH: process.env.PATH,
    PHASES_PARALLEL: process.env.SPECSTRIDE_LOOP_PHASES_PARALLEL,
  };
  process.env.HOME = dir;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  process.env.SPECSTRIDE_LOOP_PHASES_PARALLEL = "on";
  const restoreEnv = pinEngineEnv({ feature: "154-phases" });
  return {
    dir: work,
    promptLog,
    observationLog,
    restore: () => {
      restoreEnv();
      process.env.HOME = before.HOME;
      process.env.PATH = before.PATH;
      if (before.PHASES_PARALLEL === undefined) delete process.env.SPECSTRIDE_LOOP_PHASES_PARALLEL;
      else process.env.SPECSTRIDE_LOOP_PHASES_PARALLEL = before.PHASES_PARALLEL;
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** The run's events file, read as ordered JSON lines. */
function eventsOf(controlRoot: string): { readonly lines: Record<string, unknown>[] } {
  const runsDir = join(controlRoot, "runs");
  assert.ok(existsSync(runsDir), "the run wrote no runs directory");
  const entries = readdirSync(runsDir).filter((name) =>
    existsSync(join(runsDir, name, "events.jsonl")),
  );
  assert.equal(entries.length, 1, `expected one run, saw ${entries.length}`);
  const lines = readFileSync(join(runsDir, entries[0], "events.jsonl"), "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as Record<string, unknown>);
  return { lines };
}

/** The first index of the event `type` whose `data.phase` is `phase`. */
function indexOfEvent(
  lines: readonly Record<string, unknown>[],
  type: string,
  phase: number,
): number {
  const index = lines.findIndex(
    (one) =>
      one.type === type && (one.data as Record<string, unknown> | undefined)?.phase === phase,
  );
  assert.ok(index >= 0, `no ${type} event for phase ${phase} on the events file`);
  return index;
}

test("G8 T156: ticks of a later phase are written only upon that phase's approval (V-11, F154-FR-073)", async () => {
  const ws = phasesWorkspaceOfFixture();
  try {
    const controlRoot = controlRootOfWorkspace(ws.dir);
    const exit = await runFeature({ argv: [], workdir: ws.dir });
    assert.equal(exit, 0, `the run ended ${String(exit)}`);

    // THE EVENT ORDER: every phase ended approved, and every phase's tick
    // event stands AFTER its own approval event — the engine wrote each
    // phase's checkboxes only once the phase was approved (F154-FR-073a).
    const { lines } = eventsOf(controlRoot);
    const tasksPath = join(ws.dir, "specs", "154-phases", "tasks.md");
    for (const phase of [1, 2, 3]) {
      const approvedAt = indexOfEvent(lines, "phase.ended", phase);
      assert.equal(
        (lines[approvedAt].data as Record<string, unknown>).outcome,
        "approved",
        `phase ${phase} did not end approved`,
      );
      const tickedAt = indexOfEvent(lines, "tasks.ticked", phase);
      assert.ok(
        tickedAt > approvedAt,
        `phase ${phase}'s tick event (line ${tickedAt}) did not follow its approval (line ${approvedAt})`,
      );
      assert.equal(
        (lines[tickedAt].data as Record<string, unknown>).count,
        1,
        `phase ${phase}'s tick event did not name one checkbox`,
      );
    }
    // The ticks landed each phase's OWN task: one tick event per phase,
    // three in all — no phase ticked another phase's checkbox, and none
    // ticked a phase that was never approved.
    const tickEvents = lines.filter((one) => one.type === "tasks.ticked");
    assert.equal(tickEvents.length, 3, `expected three tick events, saw ${tickEvents.length}`);

    // THE OBSERVATIONS, placed in the event order by the line count each
    // recorded: every snapshot taken while the approval of phase p was not
    // yet on the file shows phase p's box UNCHECKED — no tick of a phase
    // stands in the workspace one event before its approval (V-11).
    const observations = readFileSync(ws.observationLog, "utf8")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line) as TickObservation);
    assert.ok(observations.length >= 6, `only ${observations.length} calls were observed`);
    for (const phase of [1, 2, 3]) {
      const approvedAt = indexOfEvent(lines, "phase.ended", phase);
      const taskId = `T00${String(phase)}`;
      for (const one of observations) {
        if (one.eventsLines <= approvedAt) {
          assert.ok(
            !checkedOf(one.workspaceTasks).includes(taskId),
            `the ${one.role} call of phase ${one.phase} (${one.eventsLines} event lines) saw ${taskId} already ticked BEFORE phase ${phase}'s approval`,
          );
        }
      }
      // AND UPON THE APPROVAL the tick stands: the workspace's own file
      // holds it once the run is over.
      const final = readFileSync(tasksPath, "utf8");
      assert.ok(
        checkedOf(final).includes(taskId),
        `phase ${phase}'s checkbox was never ticked although the phase was approved`,
      );
    }
    // The proposals could not have smuggled a tick: the stub never edits
    // the task list, so the first call saw a fully unchecked list and the
    // only writer was the engine's approval step.
    assert.deepEqual(
      checkedOf(observations[0].workspaceTasks),
      [],
      "the first call already saw a ticked checkbox",
    );
  } finally {
    ws.restore();
  }
});

/* ------------------------------------------------------------------ */
/* Part (b) — a set-aside speculative unit writes NO tick at all        */
/* ------------------------------------------------------------------ */

/** The coordinator harness, modelled on T149's: rate 100 % in the window. */
function speculationHarnessOf(): {
  readonly coordinator: NonNullable<ReturnType<typeof speculationCoordinatorOf>>;
  readonly controlRoot: string;
  readonly home: string;
  readonly workspace: string;
  readonly workerRoot: string;
  readonly eventsPath: string;
  readonly admissions: () => SpeculationAdmissionData[];
  readonly stream: () => readonly { type: string; data: Record<string, unknown> }[];
  readonly setAsideTextOf: (unitPhase: number) => string;
  readonly restore: () => void;
} {
  const base = mkdtempSync(join(tmpdir(), "specstride-g8-tickspec-"));
  const controlRoot = join(base, "control");
  const home = join(base, "home");
  const work = join(base, "work");
  const eventsPath = join(controlRoot, "runs", "r154", "events.jsonl");
  mkdirSync(controlRoot, { recursive: true });
  mkdirSync(home, { recursive: true });
  mkdirSync(join(work, "specs", "154-spec"), { recursive: true });
  writeFileSync(join(work, "specs", "154-spec", "tasks.md"), SPEC_TASKS);
  for (const argv of [
    ["init", "-q"],
    ["config", "user.email", "t@t"],
    ["config", "user.name", "t"],
    ["add", "-A"],
    ["commit", "-qm", "init"],
  ]) {
    spawnSync("git", ["-C", work, ...argv]);
  }
  mkdirSync(eventsPath.slice(0, eventsPath.lastIndexOf("/")), { recursive: true });
  writeFileSync(
    eventsPath,
    `${JSON.stringify({
      type: "attempt.ended",
      at: 1,
      data: { run: "r154", phase: 1, attempt: 1, endCause: "approved" },
    })}\n`,
  );
  const seen: { type: string; data: Record<string, unknown> }[] = [];
  const coordinator = speculationCoordinatorOf({
    on: true,
    depth: 1,
    window: 20,
    minRatePerCent: 50,
    feature: "154-spec",
    runId: "r154",
    controlRoot,
    workspace: work,
    taskListPath: "specs/154-spec/tasks.md",
    eventsPath,
    home,
    emit: (type, data) => seen.push({ type, data: { ...data } }),
  })!;
  return {
    coordinator,
    controlRoot,
    home,
    workspace: work,
    workerRoot: join(home, ".specstride", "worker-roots", "r154"),
    eventsPath,
    admissions: () =>
      seen
        .filter((one) => one.type === SPECULATION_ADMISSION_EVENT)
        .map((one) => one.data as unknown as SpeculationAdmissionData),
    stream: () => [...seen],
    setAsideTextOf: (unitPhase: number) => {
      const path = join(
        controlRoot,
        "features",
        "154-spec",
        "runs",
        "r154",
        "speculation",
        `phase${String(unitPhase)}`,
        "set-aside.json",
      );
      assert.ok(existsSync(path), "the set-aside record was never written");
      return readFileSync(path, "utf8");
    },
    restore: () => rmSync(base, { recursive: true, force: true }),
  };
}

test("G8 T156: a set-aside speculative unit writes no tick at all (V-11, F154-FR-073, F154-FR-064)", async () => {
  const harness = speculationHarnessOf();
  const coordinator = harness.coordinator;
  try {
    assert.deepEqual(await coordinator.verdictAtTheGate(1), { start: true });
    assert.equal(coordinator.depthInForce(), 1, "no unit started");
    const admission = harness.admissions()[0];
    assert.ok(admission !== undefined, "no admission event was recorded");
    assert.equal(admission.unitPhase, 2, "the unit did not work phase 2 ahead");

    // THE TREE, and the ticks the unit's stub writes INSIDE it: the tree's
    // own copy of the task list — never the workspace's.
    const trees = readdirSync(harness.workerRoot, { withFileTypes: true })
      .filter((one) => one.isDirectory())
      .map((one) => one.name);
    assert.equal(trees.length, 1, `expected one materialised tree, saw ${trees.length}`);
    const treePath = join(harness.workerRoot, trees[0]);
    // The materialised tree checks its snapshot out under `tree/`.
    const treeTasksPath = join(treePath, "tree", "specs", "154-spec", "tasks.md");
    assert.ok(existsSync(treeTasksPath), "the tree holds no copy of the task list");
    const treeTasksBefore = readFileSync(treeTasksPath, "utf8");
    writeFileSync(treeTasksPath, treeTasksBefore.replace(/- \[ \] (T00\d)/g, "- [x] $1"));

    // THE WORKSPACE BEFORE: both boxes unchecked (the baseline of the
    // no-tick claim).
    const workspaceTasksPath = join(harness.workspace, "specs", "154-spec", "tasks.md");
    const workspaceBefore = readFileSync(workspaceTasksPath, "utf8");
    assert.equal(
      /- \[x\]/.test(workspaceBefore),
      false,
      "the workspace task list was already ticked before the unit",
    );

    // THE SET-ASIDE: the unit is discarded at no counter.
    assert.equal(await coordinator.resolveOnRejection(1), true, "the unit was not set aside");

    // ZERO TICKS LANDED (F154-FR-073b): the workspace's task list stands
    // exactly as it stood — byte for byte — and the tree's ticks died with
    // the tree, whose directory is gone.
    assert.equal(
      readFileSync(workspaceTasksPath, "utf8"),
      workspaceBefore,
      "the workspace's task list changed with the set-aside unit",
    );
    assert.equal(
      /- \[x\]/.test(readFileSync(workspaceTasksPath, "utf8")),
      false,
      "a tick landed in the workspace",
    );
    assert.equal(existsSync(treePath), false, "the discarded tree was not removed");
    assert.equal(
      existsSync(treeTasksPath),
      false,
      "the tree's ticked task list survived the discard",
    );

    // NO EVENT OF THE DISCARDED UNIT RECORDS A TICK OR AN APPROVAL: the
    // run's events file gained no line at all — no attempt kind, no run
    // state, no stop reason, no exit code, no tick for the discarded unit
    // (F154-FR-064) — and the coordinator's own stream holds exactly the
    // admission and the set-aside, no integration, no approval, no tick.
    const eventText = readFileSync(harness.eventsPath, "utf8");
    assert.equal(
      eventText.split("\n").filter((line) => line.trim() !== "").length,
      1,
      "the events file grew for the discarded unit",
    );
    assert.ok(!eventText.includes("tasks.ticked"), "the events file recorded a tick");
    // The one line already on the file is the seeded `attempt.ended` of
    // phase 1; any further line would be a record of the discarded unit —
    // no approval, no attempt kind, no run state, no stop reason, no exit
    // code of its own on the run's record.
    const eventLines = eventText.split("\n").filter((line) => line.trim() !== "");
    assert.deepEqual(
      eventLines.filter((line) => !line.includes('"phase":1')),
      [],
      "the events file holds a line that is not the seeded phase-1 closer",
    );
    const stream = harness.stream();
    assert.deepEqual(
      stream.map((one) => one.type),
      [SPECULATION_ADMISSION_EVENT, SPECULATION_SET_ASIDE_EVENT],
      "the discarded unit's stream holds more than admission and set-aside",
    );
    assert.ok(
      !stream.some((one) => one.type === SPECULATION_INTEGRATED_EVENT),
      "an integration was recorded",
    );

    // THE RECORD EXISTS (F154-FR-064) yet records NO tick: the schema
    // carries no attempt kind, no stop reason, no exit code, no run state,
    // and not a word about a tick anywhere in its text.
    const recordText = harness.setAsideTextOf(2);
    const record = JSON.parse(recordText) as Parameters<typeof recordCarriesNoKindOrStopReason>[0];
    assert.equal(
      recordCarriesNoKindOrStopReason(record),
      true,
      "the set-aside record carries a kind or a stop reason",
    );
    assert.equal(record.schema, "specstride.set-aside/1", "the record is not a set-aside record");
    assert.equal(record.unitPhase, 2, "the record does not name the worked-ahead phase");
    assert.ok(!/tick/i.test(recordText), "the set-aside record mentions a tick");
    for (const word of ["attemptKind", "stopReason", "endCause", "exitCode", "runState"]) {
      assert.ok(!recordText.includes(`"${word}"`), `the set-aside record carries ${word}`);
    }
  } finally {
    await coordinator.stopNow();
    harness.restore();
  }
});
