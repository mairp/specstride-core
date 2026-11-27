/**
 * T157 (feature 154, Phase 17, G8) — A STOP MID-EXECUTION LEAVES EACH
 * IN-FLIGHT THING IN ITS OWN RESUME STATE, AND NOTHING LANDS AS A RESULT OF
 * THE STOP (V-12, V-19; F154-FR-074, -079).
 *
 * Three things can be in flight when a stop takes effect, and each must be
 * left in the state the next run resumes from — while NOTHING of what was
 * underway may land because of the stop: no task ticked, no merge applied,
 * no landing record marked landed.
 *
 *  - THE WIDE STAGE GROUP: fake ports over `runWideGroupLandings`
 *    (stage-loop.ts) and `runLandingForStage` (landing-run.ts), killed
 *    through the killpoints. A stop mid-loop leaves the interrupted stage's
 *    workspace record `running` with `removedAt: null`, its landing record
 *    on disk without a fast-forward, home empty — and a clean resume
 *    reaches the SAME end as a run that was never stopped (the comparison
 *    pattern of T124's landing-kills test).
 *  - THE PHASE QUEUE: a hermetic run of the `phases` fixture with
 *    `loop.phases.parallel` on; the stub claude writes the engine's own
 *    stop request (`inbox:stop`, the empty request, F100-FR-065) during the
 *    second critic-class call — mid-flight, inside the engine's real stop
 *    seam (`theStopRequestAsItStands`). The run ends exit 6 `stop_flag`,
 *    the on-disk queue entries survive as the resume state, and nothing of
 *    phase 3 lands: its tasks stay unticked in the workspace.
 *  - THE SPECULATIVE UNIT: the coordinator at a rate above the threshold,
 *    so a unit materialises; `stopNow` — the engine's own stop seam for a
 *    unit (F154-FR-074) — releases the tree through the store, which marks
 *    it `released: true` in the worker root's index (the on-disk stop
 *    state), removes the tree, and leaves the workspace untouched.
 *
 * Run from the repository root:
 *     node --experimental-strip-types --test tests/parallel/154/stop-154.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import {
  readLandingRecord,
  landingRecordPath,
  runLandingForStage,
  type LandingApprovalsPort,
  type LandingChecksPort,
  type LandingGitPort,
  type LandingKillpoint,
  type LandingRunInput,
  type LandingRunOutcome,
} from "../../../packages/pipeline/src/executor/landing-run.ts";
import { runWideGroupLandings } from "../../../packages/pipeline/src/executor/stage-loop.ts";
import type { WorktreePort } from "../../../packages/pipeline/src/executor/stage-workspace.ts";
import { readStageWorkspaceRecord } from "../../../packages/pipeline/src/executor/stage-workspace.ts";
import type { Stage } from "../../../packages/pipeline/src/executor/types.ts";

import { runFeature } from "../../../packages/cli/src/engine/run-feature.ts";
import { controlRootOfWorkspace } from "../../../packages/cli/src/engine/workspace-control-root.ts";
import { pinEngineEnv } from "../../../packages/cli/test/engine/helpers/fixture.ts";
import {
  phaseQueueDirectoryOf,
  queueEntryPathOf,
  readQueueEntry,
} from "../../../packages/cli/src/engine/phase-trees.ts";
import {
  SPECULATION_ADMISSION_EVENT,
  speculationCoordinatorOf,
} from "../../../packages/cli/src/engine/speculation.ts";
import { treesOfTheWorkerRoot } from "../../../packages/tree-store/src/index.ts";

/* ------------------------------------------------------------------ */
/* Part 1 — the wide stage group (landing killpoints as the stop seam) */
/* ------------------------------------------------------------------ */

/** Fake ports over in-memory state: home holds landed stages in order. */
function fakeWorld(input: { conflict?: readonly string[]; red?: readonly string[] }): {
  makeInput(over?: Partial<LandingRunInput>): LandingRunInput;
  home: () => readonly string[];
  git: LandingGitPort;
  checks: LandingChecksPort;
  approvals: LandingApprovalsPort;
} {
  const homeStages: string[] = [];
  const conflicts = new Set(input.conflict ?? []);
  const reds = new Set(input.red ?? []);
  const git: LandingGitPort = {
    async rebaseOnto(_home, workspace) {
      const stage = workspace.split(/[\\/]/u).at(-1) ?? workspace;
      return conflicts.has(stage) ? "conflict" : "clean";
    },
    async abortRebase() {},
    async mergeFastForward(workspace) {
      const stage = workspace.split(/[\\/]/u).at(-1) ?? workspace;
      if (!homeStages.includes(stage)) homeStages.push(stage);
    },
  };
  const checks: LandingChecksPort = {
    async runGate(_workspace, stage) {
      return !reds.has(stage);
    },
  };
  const approvals: LandingApprovalsPort = {
    async noteRewriteAfterFastForward() {
      return { commits: [] };
    },
  };
  return {
    makeInput(over) {
      return {
        controlRoot: over?.controlRoot ?? "",
        home: "/home",
        workspace: over?.workspace ?? "",
        pipelineRunId: "p-154",
        group: ["A"],
        stage: over?.stage ?? "A",
        ports: { git, checks, approvals },
        now: () => new Date("2026-11-25T00:00:00Z"),
        ...(over ?? {}),
      };
    },
    home: () => [...homeStages],
    git,
    checks,
    approvals,
  };
}

/** One control root per case; the stage-workspace and landing records live under it. */
function groupRoot(name: string): string {
  return mkdtempSync(join(tmpdir(), `stop-154-g8-${name}-`));
}

const GROUP: readonly Stage[] = [
  { id: "A", kind: "specstride", dependencies: [], preconditions: [], postconditions: [] },
  { id: "B", kind: "specstride", dependencies: [], preconditions: [], postconditions: [] },
  { id: "C", kind: "specstride", dependencies: [], preconditions: [], postconditions: [] },
];

/** A run of the group over one control root, with an optional stop (throw). */
async function runGroup(input: {
  controlRoot: string;
  home: string;
  world: ReturnType<typeof fakeWorld>;
  worktree: WorktreePort;
  stopAt?: (stage: string, point: LandingKillpoint) => boolean;
}): Promise<Awaited<ReturnType<typeof runWideGroupLandings>>> {
  return await runWideGroupLandings({
    controlRoot: input.controlRoot,
    home: input.home,
    pipelineRunId: "p-154",
    stages: GROUP,
    ports: {
      worktree: input.worktree,
      git: input.world.git,
      checks: input.world.checks,
      approvals: input.world.approvals,
    },
    now: () => new Date("2026-11-25T00:00:00Z"),
    ...(input.stopAt === undefined
      ? {}
      : {
          killpoint: (stage: string, point: LandingKillpoint) => {
            if (input.stopAt?.(stage, point)) throw new Error(`stop at ${stage} ${point}`);
          },
        }),
  });
}

function worktreeOf(): WorktreePort {
  return {
    async add(_home, workspace) {
      mkdirSync(workspace, { recursive: true });
      writeFileSync(join(workspace, "shared.txt"), "stage\n");
    },
    async remove(workspace) {
      rmSync(workspace, { recursive: true, force: true });
    },
  };
}

/** The end of a group, as the stopped run is compared against the reference. */
function endOfGroup(
  result: Awaited<ReturnType<typeof runWideGroupLandings>>,
  home: readonly string[],
): {
  landed: readonly string[];
  parked: readonly string[];
  exitCode: number;
  home: readonly string[];
} {
  return {
    landed: [...result.landed],
    parked: [...result.parked],
    exitCode: result.exitCode,
    home: [...home],
  };
}

test("G8 T157: a stop in a wide stage group lands nothing and a clean resume reaches the unstop end (V-12, V-19; F154-FR-074, -079)", async (t) => {
  // The stop hits INSIDE the landing of stage A, the group's first stage:
  // the loop is interrupted mid-execution, before any merge can be applied.
  const stopAtFirstStage = (_stage: string, point: LandingKillpoint): boolean =>
    point === "after-rebase";
  // The stop hits INSIDE the landing of stage B, the group's middle stage:
  // stage A's landing is whole (it landed before the stop, not because of
  // it), stage B's is interrupted, stage C was never reached.
  const stopAtMiddleStage = (stage: string, point: LandingKillpoint): boolean =>
    stage === "B" && point === "after-gate";

  for (const [name, stopAt] of [
    ["first-stage", stopAtFirstStage],
    ["middle-stage", stopAtMiddleStage],
  ] as const) {
    await t.test(`stop mid-loop at the ${name} of the group`, async () => {
      const referenceRoot = groupRoot(`${name}-ref`);
      const stoppedRoot = groupRoot(`${name}-stop`);
      const referenceHome = join(referenceRoot, "home");
      const stoppedHome = join(stoppedRoot, "home");
      const referenceWorld = fakeWorld({});
      const stoppedWorld = fakeWorld({});
      const worktree = worktreeOf();
      try {
        for (const home of [referenceHome, stoppedHome]) {
          mkdirSync(home, { recursive: true });
          writeFileSync(join(home, ".gitkeep"), "");
        }

        // THE REFERENCE: the same group, never stopped.
        const reference = await runGroup({
          controlRoot: referenceRoot,
          home: referenceHome,
          world: referenceWorld,
          worktree,
        });
        const referenceEnd = endOfGroup(reference, referenceWorld.home());
        assert.deepEqual(referenceEnd.landed, ["A", "B", "C"]);
        assert.equal(referenceEnd.exitCode, 0);

        // THE STOPPED RUN: the stop seam throws mid-loop.
        let thrown: unknown;
        try {
          await runGroup({
            controlRoot: stoppedRoot,
            home: stoppedHome,
            world: stoppedWorld,
            worktree,
            stopAt,
          });
        } catch (err) {
          thrown = err;
        }
        assert.ok(thrown instanceof Error, "the stop must interrupt the loop");

        // NOTHING MAY LAND AS A RESULT OF THE STOP: no task ticked (there
        // is no tick seam here at all), no merge applied by the stop — for
        // a stop in the FIRST stage home holds nothing at all — and no
        // landing record of a stage the stop interrupted was marked
        // landed. (A stage whose whole landing ran BEFORE the stop, in the
        // middle-stage case, keeps the landed record it earned.)
        for (const stage of ["A", "B", "C"] as const) {
          if (stoppedWorld.home().includes(stage)) continue;
          const landing = readLandingRecord(stoppedRoot, "p-154", stage);
          if (landing !== null) {
            assert.notEqual(
              landing.fastForward,
              true,
              `the landing record of ${stage} was marked landed by the stop`,
            );
          }
        }
        if (name === "first-stage") {
          assert.deepEqual(stoppedWorld.home(), [], "a stage landed while the stop was in flight");
        }

        // EACH STAGE'S RESUME STATE. A stage the loop never reached has no
        // workspace record at all (the next run makes one); a stage whose
        // landing completed BEFORE the stop is `landed` and removed; a
        // stage interrupted MID-LANDING is `running` with `removedAt:
        // null` — the resumable state, and nothing under it is removed.
        for (const stage of ["A", "B", "C"] as const) {
          const record = readStageWorkspaceRecord(stoppedRoot, "p-154", stage);
          if (record === null) continue;
          if (record.state === "running") {
            assert.equal(record.removedAt, null, `${stage}: a running workspace was removed`);
            assert.equal(
              existsSync(record.workspace),
              true,
              `${stage}: the workspace of a running stage is gone`,
            );
          }
        }
        if (name === "first-stage") {
          const interrupted = readStageWorkspaceRecord(stoppedRoot, "p-154", "A");
          assert.ok(interrupted !== null, "the interrupted stage has no workspace record");
          assert.equal(interrupted.state, "running");
          assert.equal(interrupted.removedAt, null);
          for (const stage of ["B", "C"] as const) {
            assert.equal(
              readStageWorkspaceRecord(stoppedRoot, "p-154", stage),
              null,
              `${stage} was reached by the stopped run`,
            );
          }
        } else {
          const interrupted = readStageWorkspaceRecord(stoppedRoot, "p-154", "B");
          assert.ok(interrupted !== null, "the interrupted stage has no workspace record");
          assert.equal(interrupted.state, "running");
          assert.equal(interrupted.removedAt, null);
          assert.equal(existsSync(interrupted.workspace), true);
          assert.deepEqual(stoppedWorld.home(), ["A"], "home moved during the stop itself");
        }

        // THE RECORDS ON DISK THE NEXT RUN RESUMES FROM: the interrupted
        // stage's landing record exists and holds the observations the
        // resume decides over.
        const interruptedStage = name === "first-stage" ? "A" : "B";
        assert.equal(
          existsSync(landingRecordPath(stoppedRoot, "p-154", interruptedStage)),
          true,
          "the interrupted stage's landing record is not on disk",
        );
        const interruptedLanding = readLandingRecord(stoppedRoot, "p-154", interruptedStage);
        assert.ok(interruptedLanding !== null);
        assert.notEqual(interruptedLanding.rebaseClean, null, "the record holds no observation");

        // THE CLEAN RESUME: no killpoint — the next run picks the records
        // up from disk and reaches the SAME end as the run never stopped.
        const resumed = await runGroup({
          controlRoot: stoppedRoot,
          home: stoppedHome,
          world: stoppedWorld,
          worktree,
        });
        assert.deepEqual(endOfGroup(resumed, stoppedWorld.home()), referenceEnd);
        assert.deepEqual(stoppedWorld.home(), ["A", "B", "C"]);
        // And every stage is terminal on disk: landed, removed, recorded.
        for (const stage of ["A", "B", "C"] as const) {
          const record = readStageWorkspaceRecord(stoppedRoot, "p-154", stage);
          assert.ok(record !== null, `${stage} has no record after the resume`);
          assert.equal(record.state, "landed");
          assert.notEqual(record.removedAt, null);
          const landing = readLandingRecord(stoppedRoot, "p-154", stage);
          assert.ok(landing !== null);
          assert.equal(landing.fastForward, true, `${stage} did not land on the resume`);
        }
      } finally {
        rmSync(referenceRoot, { recursive: true, force: true });
        rmSync(stoppedRoot, { recursive: true, force: true });
      }
    });
  }
});

/* ------------------------------------------------------------------ */
/* Part 2 — the phase queue (the engine's own inbox:stop seam)         */
/* ------------------------------------------------------------------ */

/** The task list OF THE PHASES FIXTURE (T132): three phases, 2 and 3 declared. */
const PHASES_TASKS = readFileSync(
  join(import.meta.dirname, "../../fixtures/154/phases/tasks.md"),
  "utf8",
);

/**
 * The hermetic phases workspace, on the pattern of T152's
 * `phasesWorkspaceOfFixture`: private HOME, stub claude on PATH,
 * `SPECSTRIDE_LOOP_PHASES_PARALLEL=on`. THE STOP: the stub claude writes
 * the EMPTY stop request (a clean stop with every default, F100-FR-065)
 * into the inbox at `<controlRoot>/inbox/stop.request` — the ONE file the
 * engine's stop seam (`theStopRequestAsItStands`, `parallel-stop.ts`) and
 * the boundaries of `run-feature.ts` read — during the SECOND
 * critic-class call, i.e. mid-flight, while the run is inside a phase
 * after the first one's gate.
 */
function phasesWorkspaceOfFixture(): {
  readonly dir: string;
  readonly promptLog: string;
  readonly controlRoot: string;
  readonly stopRequestPath: string;
  readonly restore: () => void;
} {
  const dir = mkdtempSync(join(tmpdir(), "specstride-g8-t157-stop-"));
  const bin = join(dir, "bin");
  const work = join(dir, "work");
  const promptLog = join(dir, "prompts.log");
  mkdirSync(bin);
  mkdirSync(join(work, "specs", "154-phases"), { recursive: true });
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
  // HOME FIRST: the control root is derived from it (`~/.specstride/...`),
  // and the stub must write the request where THIS engine looks.
  const before = {
    HOME: process.env.HOME,
    PATH: process.env.PATH,
    PHASES_PARALLEL: process.env.SPECSTRIDE_LOOP_PHASES_PARALLEL,
  };
  process.env.HOME = dir;
  const controlRoot = controlRootOfWorkspace(work);
  const stopRequestPath = join(controlRoot, "inbox", "stop.request");
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  process.env.SPECSTRIDE_LOOP_PHASES_PARALLEL = "on";
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
  // THE STOP, MID-FLIGHT: on the SECOND critic-class call write the empty
  // stop request into the inbox — atomically, temporary name then rename,
  // exactly as the writer of the CLI does (F102-FR-001).
  const counter = path.join(${JSON.stringify(bin)}, "critics");
  const nth = (fs.existsSync(counter) ? Number(fs.readFileSync(counter, "utf8")) : 0) + 1;
  fs.writeFileSync(counter, String(nth));
  if (nth === 2) {
    fs.mkdirSync(${JSON.stringify(join(controlRoot, "inbox"))}, { recursive: true });
    const tmp = ${JSON.stringify(stopRequestPath)} + ".tmp";
    fs.writeFileSync(tmp, "");
    fs.renameSync(tmp, ${JSON.stringify(stopRequestPath)});
  }
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  console.log(JSON.stringify({ type: "result", result: "T00x judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  const evidence = (/Write your evidence to (\\.specstride\\S+?) \\(/i.exec(prompt) ?? /write (\\.specstride\\S+?):/i.exec(prompt))[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T00x done\\n");
  const tasks = "specs/154-phases/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replace(/- \\[ \\] (T00\\d)/g, "- [x] $1"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`,
  );
  chmodSync(join(bin, "claude"), 0o755);
  const restoreEnv = pinEngineEnv({ feature: "154-phases" });
  return {
    dir: work,
    promptLog,
    controlRoot,
    stopRequestPath,
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

test("G8 T157: a stop mid-flight leaves the phase queue entries as the resume state and phase 3 lands nothing (F154-FR-074, -079)", async () => {
  const ws = phasesWorkspaceOfFixture();
  try {
    // THE RUN UNDER THE STOP: the request is written while a phase after
    // the first is in flight; the run must end exit 6, `stop_flag`, at the
    // boundary the engine honours the request at.
    const exit = await runFeature({ argv: [], workdir: ws.dir });
    assert.equal(exit, 6, `the run ended ${String(exit)}, not 6 stop_flag`);

    // THE RESUME STATE OF THE QUEUE: the on-disk entries of both candidate
    // phases survived the stop, each with its own tree, and phase 3's
    // entry is still an UNAPPROVED waiting entry — what the next run
    // resumes from.
    assert.equal(existsSync(phaseQueueDirectoryOf(ws.controlRoot)), true, "no queue was written");
    const two = readQueueEntry(ws.controlRoot, 2);
    const three = readQueueEntry(ws.controlRoot, 3);
    assert.ok(two !== undefined, "phase 2's queue entry did not survive the stop");
    assert.ok(three !== undefined, "phase 3's queue entry did not survive the stop");
    assert.equal(existsSync(queueEntryPathOf(ws.controlRoot, 2)), true);
    assert.equal(existsSync(queueEntryPathOf(ws.controlRoot, 3)), true);
    assert.notEqual(two.treePath, three.treePath, "the two trees share one path");
    assert.equal(existsSync(two.treePath), true, "phase 2's tree is gone");
    assert.equal(existsSync(three.treePath), true, "phase 3's tree is gone");
    assert.notEqual(three.status, "approved", "phase 3 was approved past the stop");

    // NOTHING OF PHASE 3 LANDED: its task is not ticked in the workspace —
    // no apply touched it through the stop.
    const tasks = readFileSync(join(ws.dir, "specs", "154-phases", "tasks.md"), "utf8");
    assert.match(tasks, /^- \[ \] T003 /m, "phase 3's task was ticked by the stopped run");
    assert.ok(!/- \[x\] T003 /.test(tasks), "phase 3's task ticked");

    // NO LANDING RECORD WAS MARKED LANDED: a phases run under a stop
    // writes no landing record at all.
    assert.equal(existsSync(join(ws.controlRoot, "landing")), false, "a landing record exists");

    // AND THE STOP WAS THE ENGINE'S OWN: the request stood in the inbox
    // (the engine removes it when it honours it, so only its directory is
    // asserted) — nothing here threw or crashed the run.
    assert.equal(existsSync(join(ws.controlRoot, "inbox")), true, "no inbox was made");
  } finally {
    ws.restore();
  }
});

/* ------------------------------------------------------------------ */
/* Part 3 — the speculative unit (the coordinator's stopNow seam)      */
/* ------------------------------------------------------------------ */

/** The task list OF THE SPEC FIXTURE (T141): the speculation fixture. */
const SPEC_TASKS = readFileSync(
  join(import.meta.dirname, "../../fixtures/154/spec/tasks.md"),
  "utf8",
);

/**
 * The coordinator harness, on the pattern of T152's `speculationHarnessOf`:
 * rate above the threshold, so a unit materialises. THE EVENTS FILE IS
 * REAL: the engine's one event writer appends to it, so the admission of
 * the unit is on disk under the control root.
 */
function speculationHarnessOf(): {
  readonly coordinator: NonNullable<ReturnType<typeof speculationCoordinatorOf>>;
  readonly controlRoot: string;
  readonly home: string;
  readonly workspace: string;
  readonly workerRoot: string;
  readonly restore: () => void;
} {
  const base = mkdtempSync(join(tmpdir(), "specstride-g8-t157-spec-"));
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
    emit: (type, data) => {
      seen.push({ type, data: { ...data } });
      // THE ENGINE'S ONE EVENT WRITER: the same events the report reads,
      // on disk under the control root (Principle V).
      appendFileSync(eventsPath, `${JSON.stringify({ type, at: 2, data })}\n`);
    },
  })!;
  return {
    coordinator,
    controlRoot,
    home,
    workspace: work,
    workerRoot: join(home, ".specstride", "worker-roots", "r154"),
    restore: () => rmSync(base, { recursive: true, force: true }),
  };
}

test("G8 T157: a stop mid-flight of a speculative unit releases the tree, lands nothing and records the stop state on disk (F154-FR-074)", async () => {
  const harness = speculationHarnessOf();
  const coordinator = harness.coordinator;
  try {
    // THE UNIT IN FLIGHT: the gate starts it, one tree materialised under
    // the run's worker root.
    assert.deepEqual(await coordinator.verdictAtTheGate(1), { start: true });
    assert.equal(coordinator.depthInForce(), 1, "no unit started");
    const trees = treesOfTheWorkerRoot({
      store: join(harness.controlRoot, "phase-tree-store"),
      workerRoot: harness.workerRoot,
      control: harness.controlRoot,
    });
    assert.equal(trees.length, 1, `expected one held tree, saw ${trees.length}`);
    const held = trees[0];
    assert.equal(existsSync(held.tree), true, "the speculative tree was never materialised");
    assert.match(held.opaque, /^[0-9a-f]{32}$/, "the tree's name is not opaque");

    // THE STOP, MID-FLIGHT: the engine's own seam for a unit
    // (F154-FR-074). Per the engine's stop semantics a stop is neither an
    // approval nor a rejection: the tree is released through the store and
    // NO set-aside record is written (a stop has no counter to answer).
    await coordinator.stopNow();
    assert.equal(coordinator.depthInForce(), 0, "the stop left the unit in flight");
    assert.equal(existsSync(held.tree), false, "the stopped tree was not released");

    // THE STOP STATE ON DISK: the worker root's index marks the unit's
    // tree `released: true` — what a relaunched engine reads to know the
    // unit ended at the stop — and the run's events file under the control
    // root holds the admission of the unit.
    const index = treesOfTheWorkerRoot({
      store: join(harness.controlRoot, "phase-tree-store"),
      workerRoot: harness.workerRoot,
      control: harness.controlRoot,
    });
    assert.equal(index.length, 1, "the index lost the unit's entry");
    assert.equal(index[0].released, true, "the index does not record the stop's release");
    assert.equal(
      index[0].groupId,
      "speculation",
      "the released entry is not the speculative unit's",
    );
    const events = readFileSync(join(harness.controlRoot, "runs", "r154", "events.jsonl"), "utf8");
    assert.ok(events.includes(SPECULATION_ADMISSION_EVENT), "the admission is not on disk");
    const setAside = join(
      harness.controlRoot,
      "features",
      "154-spec",
      "runs",
      "r154",
      "speculation",
      "phase2",
      "set-aside.json",
    );
    assert.equal(existsSync(setAside), false, "a stop wrote a set-aside record");

    // THE WORKSPACE IS UNTOUCHED: a stop integrates nothing — no task
    // ticked, no merge applied, the task list exactly as it stood.
    const tasks = readFileSync(join(harness.workspace, "specs", "154-spec", "tasks.md"), "utf8");
    assert.ok(!/- \[x\] /.test(tasks), "a task was ticked by the stopped unit");
    assert.ok(existsSync(harness.workspace), "the workspace was removed with the tree");
  } finally {
    await coordinator.stopNow();
    harness.restore();
  }
});
