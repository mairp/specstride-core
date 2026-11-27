/**
 * T077 — GROUPS AS UNITS WIRED AT THE BOUNDARY (feature 154, phase 9;
 * F154-FR-031, -032; F154-SC-006; the phase-9 acceptance condition).
 *
 * With `loop.parallel.groupUnits` on and the plan's groups taken from the
 * frozen task-group record (`fromTaskGroup`), TWO groups of one phase whose
 * declaration (`independentWith`) and disjoint scopes make them independent
 * by PG-3 START AT ONCE — the later group's first worker starts before the
 * earlier group closes — and the pair decision is recorded with its rule id.
 * A pair declared `dependsOn` runs ONE AFTER THE OTHER, with ONE
 * `parallel.admission` event carrying the check `dependency`, the rule id
 * PG-2 and its detail, before the later group starts.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  groupGate,
  type ParallelPlan,
  type WriteScope,
} from "../../../layer-parallel/src/index.ts";
import {
  parallelWiringOfTheAttempt,
  type ParallelWiringInput,
} from "../../src/engine/parallel-wiring.ts";

import { plannedGroupOf } from "../../../layer-parallel/src/groups.ts";
import { independenceOf } from "../../../layer-parallel/src/independence.ts";
import { fixtureOf, wiringOf } from "./parallel-wiring.test.ts";

/** The fixture of the groups (`contracts/fixtures-154.json`, FX-154-GROUPS). */
const FIXTURE_DIR = join(import.meta.dirname, "../../../../tests/fixtures/154/groups");

const SCOPE_A: WriteScope = { prefixes: ["src/a"], source: "task-text" };
const SCOPE_B: WriteScope = { prefixes: ["src/b"], source: "task-text" };

/** Two frozen groups as units: g-2-1 (T001, T002, scope src/a) and g-2-2 (T003, T004, scope src/b). */
function planOfTwoGroupUnits(): ParallelPlan {
  return {
    schema: "specstride.parallel-plan/1",
    runId: "run-group-units-154",
    hash: "plan-hash-group-units-154",
    workers: 2,
    fallback: null,
    phases: [
      {
        phase: 2,
        groups: [
          {
            ordinal: 1,
            phase: 2,
            tasks: ["T001", "T002"],
            groupId: "g-2-1",
            writeScope: SCOPE_A,
            fromTaskGroup: true as const,
          },
          {
            ordinal: 2,
            phase: 2,
            tasks: ["T003", "T004"],
            groupId: "g-2-2",
            writeScope: SCOPE_B,
            fromTaskGroup: true as const,
          },
        ],
        tasks: ["T001", "T002", "T003", "T004"].map((id) => ({
          id,
          scope: id === "T001" || id === "T002" ? SCOPE_A : SCOPE_B,
          checks: [],
        })),
        serial: [],
        ceiling: 2,
      },
    ],
  };
}

type AdmissionData = {
  taskId?: string;
  groupId?: string;
  pairWith?: string;
  ordinal?: number;
  phase?: number;
  admitted?: boolean;
  reason?: string;
  ruleId?: string;
  verdicts?: readonly { check: string; verdict: string; detail: string }[];
};

test("two groups declared independentWith and disjoint start at once, the rule id recorded", async () => {
  const fixture = fixtureOf("group-units-154");
  /* The log of the attempt in the order it happened: `start:<taskId>` from
   * the stub door, `close:<groupId>:<admitted>` from the carry-out. */
  const log: string[] = [];
  const events: AdmissionData[] = [];
  try {
    const base = wiringOf(fixture, { plan: planOfTwoGroupUnits() });
    const innerStart = base.input.startDoor as unknown as (worker: {
      taskId: string;
    }) => Promise<unknown>;
    const input: ParallelWiringInput = {
      ...base.input,
      keptUnitsOf: () => [],
      emit: (type, data) => {
        if (type !== "parallel.admission") return;
        events.push(data as AdmissionData);
      },
      /* The REAL gate of the admission, as the engine wires it: the group
       * events then carry every verdict (F154-FR-024). */
      groupGateOfTheAttempt: (inputs) => groupGate(inputs),
      onClosed: (closed) => log.push(`close:${closed.groupId}`),
      startDoor: (async (worker: { taskId: string }) => {
        log.push(`start:${worker.taskId}`);
        return innerStart(worker);
      }) as never,
      groupUnitsOn: true,
      groupDeclarationOf: () => ({ independentWith: { "g-2-1": ["g-2-2"] } }),
    };
    const wiring = parallelWiringOfTheAttempt(input);
    assert.equal(await wiring.startIfTheBoundaryIsClean(), true);
    /* THE PAIR RAN AT ONCE: the later group's first worker started before the
     * earlier group closed (F154-FR-031, F154-FR-032). */
    const firstCloseOfTheEarlier = log.indexOf("close:g-2-1");
    assert.notEqual(firstCloseOfTheEarlier, -1, "the earlier group closed");
    const firstStartOfTheLater = log.findIndex(
      (one) => one === "start:T003" || one === "start:T004",
    );
    assert.notEqual(firstStartOfTheLater, -1, "the later group started");
    assert.ok(
      firstStartOfTheLater < firstCloseOfTheEarlier,
      `the later group started before the earlier closed — log: ${log.join(" | ")}`,
    );
    /* THE DECISION IS RECORDED (F154-SC-006): one event for the pair,
     * admitted, with the check `dependency`, the rule id PG-3 and a detail. */
    const pairEvent = events.find((one) => one.pairWith !== undefined);
    assert.notEqual(pairEvent, undefined, "the pair decision was recorded");
    assert.equal(pairEvent?.groupId, "g-2-1");
    assert.equal(pairEvent?.pairWith, "g-2-2");
    assert.equal(pairEvent?.admitted, true);
    assert.equal(pairEvent?.ruleId, "PG-3");
    const verdict = pairEvent?.verdicts?.[0];
    assert.equal(verdict?.check, "dependency");
    assert.equal(verdict?.verdict, "admitted");
    assert.match(verdict?.detail ?? "", /PG-3/);
    /* BOTH groups closed. */
    assert.equal(log.filter((one) => one === "close:g-2-1").length, 1);
    assert.equal(log.filter((one) => one === "close:g-2-2").length, 1);
  } finally {
    fixture.cleanup();
  }
});

test("a pair declared dependsOn runs one after the other, one dependency event (F154-SC-006)", async () => {
  const fixture = fixtureOf("group-units-154");
  const log: string[] = [];
  const events: AdmissionData[] = [];
  try {
    const base = wiringOf(fixture, { plan: planOfTwoGroupUnits() });
    const innerStart = base.input.startDoor as unknown as (worker: {
      taskId: string;
    }) => Promise<unknown>;
    const input: ParallelWiringInput = {
      ...base.input,
      keptUnitsOf: () => [],
      emit: (type, data) => {
        if (type !== "parallel.admission") return;
        events.push(data as AdmissionData);
      },
      groupGateOfTheAttempt: (inputs) => groupGate(inputs),
      onClosed: (closed) => log.push(`close:${closed.groupId}`),
      startDoor: (async (worker: { taskId: string }) => {
        log.push(`start:${worker.taskId}`);
        return innerStart(worker);
      }) as never,
      groupUnitsOn: true,
      groupDeclarationOf: () => ({ dependsOn: { "g-2-2": ["g-2-1"] } }),
    };
    const wiring = parallelWiringOfTheAttempt(input);
    assert.equal(await wiring.startIfTheBoundaryIsClean(), true);
    /* ONE dependency event for the dependent pair, BEFORE the later group
     * started (F154-SC-006): the check `dependency`, the rule id PG-2. */
    const dependencyEvents = events.filter((one) => one.reason === "dependency");
    assert.equal(dependencyEvents.length, 1, `events: ${JSON.stringify(events, null, 2)}`);
    assert.equal(dependencyEvents[0]?.groupId, "g-2-2");
    assert.equal(dependencyEvents[0]?.admitted, false);
    assert.equal(dependencyEvents[0]?.ruleId, "PG-2");
    const verdict = dependencyEvents[0]?.verdicts?.[0];
    assert.equal(verdict?.check, "dependency");
    assert.equal(verdict?.verdict, "refused");
    assert.match(verdict?.detail ?? "", /PG-2/);
    /* THE PAIR RAN ONE AFTER THE OTHER: no worker of the later group started
     * before the earlier group closed. */
    const closeOfTheEarlier = log.indexOf("close:g-2-1");
    assert.notEqual(closeOfTheEarlier, -1);
    const firstStartOfTheLater = log.findIndex(
      (one) => one === "start:T003" || one === "start:T004",
    );
    assert.notEqual(firstStartOfTheLater, -1);
    assert.ok(
      firstStartOfTheLater > closeOfTheEarlier,
      `the later group started only after the earlier closed — log: ${log.join(" | ")}`,
    );
  } finally {
    fixture.cleanup();
  }
});

test("the fixture of the groups: three tasks, the switch off, and the planned units of its groups", () => {
  const tasks = readFileSync(join(FIXTURE_DIR, "tasks.md"), "utf8");
  const launch = JSON.parse(readFileSync(join(FIXTURE_DIR, "launch.json"), "utf8")) as {
    configuration: Record<string, boolean>;
  };
  /* The fixture's phase carries the three tasks the frozen record groups. */
  const taskIds = [...tasks.matchAll(/^- \[ \] (T\d+)/gm)].map((one) => one[1] as string);
  assert.deepEqual(taskIds, ["T001", "T002", "T003"]);
  /* The launch record pins `loop.parallel.groupUnits` OFF (rule TG-1's side,
   * F154-FR-002): with the switch off nothing of this phase runs. */
  assert.equal(launch.configuration["loop.parallel.groupUnits"], false);
  /* The frozen record of that phase, as groups of two and of one — mapped
   * through `plannedGroupOf`, the two units with disjoint scopes are
   * independent by PG-1 only where every task carries the marker; the
   * fixture's tasks carry none, so the UNDECLARED pair stays dependent
   * (F154-FR-032), exactly as the switch-off fixture says. */
  const scopeOf = (prefixes: string[]) => ({ prefixes, source: "task-text" as const });
  const unitA = plannedGroupOf({
    groupId: "g-1-1",
    phase: 1,
    taskIds: ["T001"],
    writeScope: scopeOf(["src/a"]),
  });
  const unitB = plannedGroupOf({
    groupId: "g-1-2",
    phase: 1,
    taskIds: ["T002"],
    writeScope: scopeOf(["src/b"]),
  });
  const verdict = independenceOf(
    {
      groupId: unitA.groupId,
      group: unitA,
      writeScope: unitA.writeScope,
      taskTexts: ["T001 Do it"],
    },
    {
      groupId: unitB.groupId,
      group: unitB,
      writeScope: unitB.writeScope,
      taskTexts: ["T002 Do more"],
    },
    {},
  );
  assert.equal(verdict.ruleId, "PG-0");
  assert.equal(verdict.independent, false);
});
