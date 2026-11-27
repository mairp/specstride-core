/**
 * T022 — THE SEAM GUARD (F154-FR-020): with every seam of feature 154 (the
 * 15 optional fields T020 added to `ParallelWiringInput`) at its default,
 * the wiring of one phase attempt produces the SAME DIRECTIVES as before —
 * a wiring built with no seam at all and a wiring built with every seam
 * passed explicitly at its default reader agree on every directive the
 * wiring gives the composition root, over the fixture of the feature
 * (`tests/fixtures/154/groups/`: a phase whose plan holds three groups).
 *
 * The guard is the parity of the wiring slice: a later phase that replaces
 * one seam at a time from its default reader runs against this test, and a
 * wiring that silently changed a directive with the seams left at their
 * defaults fails here.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import type { RegistryAccess, RegistryEntry } from "../../../core/src/pass-supervision/ports.ts";
import type { ParallelPlan } from "../../../layer-parallel/src/index.ts";
import {
  parallelWiringOfTheAttempt,
  type ParallelWiringInput,
} from "../../src/engine/parallel-wiring.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(HERE, "../../../../tests/fixtures/154/groups");

const SLUG = "154-groups";
const RUN_ID = "run-seams-154";
const PHASE = 1;

/** The fixture stands: its launch and its task list are read, not assumed. */
const LAUNCH = JSON.parse(readFileSync(join(FIXTURE, "launch.json"), "utf8")) as {
  configuration: Record<string, boolean>;
};
const TASK_TEXT = readFileSync(join(FIXTURE, "tasks.md"), "utf8");
const TASK_IDS = ["T001", "T002", "T003"];
for (const id of TASK_IDS) assert.ok(TASK_TEXT.includes(id), `fixture task list lacks ${id}`);

/** A registry over memory: the wiring only puts and gets entries. */
const registry: RegistryAccess = {
  get: () => undefined,
  put: (_entry: RegistryEntry) => {},
  remove: () => {},
  adoptable: () => [],
};

/**
 * The fixture's plan: a phase whose plan holds THREE groups (F154-FR-020),
 * one task each, none serial — the plan the fixture's task list names.
 */
function planOfTheFixture(): ParallelPlan {
  return {
    schema: "specstride.parallel-plan/1",
    runId: RUN_ID,
    hash: "plan-hash-seams-154",
    workers: 2,
    fallback: undefined,
    phases: [
      {
        phase: PHASE,
        groups: TASK_IDS.map((taskId, index) => ({
          ordinal: index + 1,
          phase: PHASE,
          tasks: [taskId],
        })),
        tasks: TASK_IDS.map((id) => ({
          id,
          scope: { prefixes: [], source: "task-text" as const },
          checks: [],
        })),
        serial: [],
        ceiling: 3,
      },
    ],
  };
}

/** The input of the wiring, with or without the seams at their defaults. */
function wiringInput(withDefaults: boolean): ParallelWiringInput {
  const said: string[] = [];
  const emitted: Array<{ type: string }> = [];
  const base: ParallelWiringInput = {
    plan: planOfTheFixture(),
    phase: PHASE,
    evidencePresent: () => false,
    keptUnitsOf: () => [],
    failedGroupsBefore: 0,
    controlRoot: join(FIXTURE, "control"),
    home: join(FIXTURE, "home"),
    runId: RUN_ID,
    workspace: FIXTURE,
    slug: SLUG,
    taskListPath: "tasks.md",
    taskTextAtLaunch: TASK_TEXT,
    taskTextOf: (taskId) => TASK_IDS.find((one) => one === taskId) ?? taskId,
    model: "dsh",
    modelTierOrEffort: "default",
    containment: "C0",
    runToken: RUN_ID,
    timeLimitMs: 60_000,
    enginePid: process.pid,
    engineStartedAtMs: 0,
    registry,
    guardScriptPath: join(FIXTURE, "worker-guard.mjs"),
    hash: (text) => text,
    innerCheckSet: [],
    emit: (type) => {
      emitted.push({ type });
    },
    say: (line) => {
      said.push(line);
    },
    onClosed: () => {},
    onHandoff: () => {},
  };
  // EVERY seam of T020, at the default its doc comment names. A seam whose
  // default is "none" is `undefined`; a port whose default is "no port" is
  // `null`; a reader whose default reads nothing returns the nothing.
  const seams = withDefaults
    ? {
        groupsOfThePhase: undefined,
        groupGateOfTheAttempt: undefined,
        quotaObservationOf: () => null,
        failedGroupsBeforeOfTheLedger: undefined,
        repeatVerdictOf: undefined,
        appliedPathCountOf: undefined,
        baseResultOfTheInnerSet: () => null,
        acceptanceCheckOfTheGroup: undefined,
        groupCandidatesOfThePhase: () => [],
        hostSlots: null,
        holdOfTheAccount: () => null,
        tempRootOfTheRun: () => null,
        phaseDependenciesOf: undefined,
        validationQueue: null,
        speculationVerdictAt: undefined,
      }
    : {};
  return { ...base, ...seams } as ParallelWiringInput;
}

/** Every directive the wiring hands the composition root, before a start. */
function directivesOf(wiring: ReturnType<typeof parallelWiringOfTheAttempt>) {
  return {
    group: wiring.group,
    tasksBeforeTheGroup: wiring.tasksBeforeTheGroup,
    reservedBlock: wiring.reservedBlock(),
    handoffForTheCritic: wiring.handoffForTheCritic(),
    layerOffForTheRun: wiring.layerOffForTheRun(),
    layerOffForTheAttempt: wiring.layerOffForTheAttempt(),
    theStopSeenOfTheGroup: wiring.theStopSeenOfTheGroup(),
  };
}

test("the fixture is the feature's: the launch holds every switch off", () => {
  assert.equal(LAUNCH.configuration["loop.parallel.units"], false);
  assert.equal(LAUNCH.configuration["host.limits"], false);
});

test("with every seam at its default the wiring gives the same directives as with no seam", () => {
  const without = directivesOf(parallelWiringOfTheAttempt(wiringInput(false)));
  const withSeams = directivesOf(parallelWiringOfTheAttempt(wiringInput(true)));
  assert.deepEqual(withSeams, without);
});

test("the directives are the ones the wiring always gave over the fixture's plan", () => {
  const wiring = parallelWiringOfTheAttempt(wiringInput(false));
  // The plan's FIRST group, as always (the seam's default reading).
  assert.equal(wiring.group?.ordinal, 1);
  assert.deepEqual(wiring.group?.tasks, ["T001"]);
  // No task runs before the first group of this plan.
  assert.deepEqual(wiring.tasksBeforeTheGroup, []);
  // The reserved-tasks block stands while the group waits, and names its task.
  const reserved = wiring.reservedBlock();
  assert.ok(reserved.includes("T001"), "the reserved block does not name the group's task");
  // Nothing is off, nothing is carried, no stop stood.
  assert.equal(wiring.layerOffForTheRun(), false);
  assert.equal(wiring.layerOffForTheAttempt(), false);
  assert.equal(wiring.handoffForTheCritic(), "");
  assert.equal(wiring.theStopSeenOfTheGroup(), null);
});
