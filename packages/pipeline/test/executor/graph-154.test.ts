/**
 * T115 — the wide stage graph over `declareStageGraph` (F154-FR-048): with
 * `configuration.stageGroups` width 2 the independent stages {A, B} land in
 * ONE group of two; with a `never_together` pair they land in two groups, in
 * declared order; with the switch off the graph is the serial graph of today.
 * Every admitted stage emitted one `pipeline.stage.admission` event with a
 * rule id of the pinned table (F154-FR-003).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { STAGE_ADMISSION_TABLE } from "../../src/executor/tables.ts";
import {
  declareStageGraph,
  type StageAdmissionEvent,
} from "../../src/executor/graph.ts";
import type { Stage } from "../../src/executor/types.ts";

/** A minimal stage: id and dependencies only; the graph reads nothing else. */
function stageOf(id: string, dependencies: string[] = []): Stage {
  return {
    id,
    kind: "command",
    dependencies,
    preconditions: [],
    postconditions: [],
  };
}

/** A collecting admission event port, for the per-stage assertions. */
function collecting(): {
  events: StageAdmissionEvent[];
  port: { write(event: StageAdmissionEvent): void };
} {
  const events: StageAdmissionEvent[] = [];
  return { events, port: { write: (event) => events.push(event) } };
}

const RULE_IDS_OF_THE_TABLE = Object.values(
  (STAGE_ADMISSION_TABLE as { rows: Record<string, { ruleId: string }[]> }).rows,
)
  .flat()
  .map((row) => row.ruleId);

test("width 2 with independent {A, B}: one wide group of two stages", () => {
  const a = stageOf("A");
  const b = stageOf("B");
  const { events, port } = collecting();
  const graph = declareStageGraph([a, b], {
    pipeline: { stageGroups: true },
    declaration: { width: 2, never_together: [] },
    events: port,
    now: () => 0,
  });
  assert.equal(graph.mode, "wide");
  assert.equal(graph.groups.length, 1);
  assert.deepEqual(
    graph.groups[0]!.stages.map((stage) => stage.id),
    ["A", "B"],
  );
  assert.deepEqual(graph.groups.map((group) => group.index), [0]);
  // One admission event per stage, each with a rule id of the pinned table.
  assert.equal(events.length, 2);
  assert.deepEqual(events.map((one) => one.fields.stageId), ["A", "B"]);
  for (const event of events) {
    assert.equal(event.name, "pipeline.stage.admission");
    assert.ok(
      RULE_IDS_OF_THE_TABLE.includes(event.fields.ruleId),
      `rule id ${event.fields.ruleId} must be a row of the pinned table`,
    );
  }
});

test("never_together {A, B}: two groups, one per stage, in declared order", () => {
  const a = stageOf("A");
  const b = stageOf("B", ["A"]);
  const graph = declareStageGraph([a, b], {
    pipeline: { stageGroups: true },
    declaration: {
      width: 2,
      never_together: [{ stages: ["A", "B"], why: "one lock" }],
    },
    now: () => 0,
  });
  assert.equal(graph.mode, "wide");
  assert.equal(graph.groups.length, 2);
  assert.deepEqual(
    graph.groups.map((group) => group.stages.map((stage) => stage.id)),
    [["A"], ["B"]],
  );
  assert.deepEqual(graph.groups.map((group) => group.index), [0, 1]);
});

test("the switch off: the serial graph of today, one stage per group", () => {
  const a = stageOf("A");
  const b = stageOf("B", ["A"]);
  const off = declareStageGraph([a, b]);
  assert.equal(off.mode, "serial");
  assert.equal(off.groups.length, 2);
  assert.deepEqual(
    off.groups.map((group) => group.stages.map((stage) => stage.id)),
    [["A"], ["B"]],
  );
  // The same input with the switch explicitly off declares the same graph.
  const explicit = declareStageGraph([a, b], {
    pipeline: { stageGroups: false },
    declaration: { width: 2, never_together: [] },
  });
  assert.deepEqual(explicit, off);
});

test("the switch on without a declaration falls back to the serial graph", () => {
  const a = stageOf("A");
  const graph = declareStageGraph([a], { pipeline: { stageGroups: true } });
  assert.equal(graph.mode, "serial");
  assert.equal(graph.groups.length, 1);
});
