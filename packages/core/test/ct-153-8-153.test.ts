/**
 * Feature 153, CT-153-8 — the guard of F153-FR-008 (T320): the tables, the
 * rule ids and the schemas of the ready slices agree, and the new records
 * validate against their schemas.
 *
 *  1. Each rule table the feature introduced (`attempt-end-cause`,
 *     `closing-check.skip`, `workspace-selection`) is a `specstride.table/1`
 *     table: every row carries a rule id, and the LAST row of the decision
 *     point is the default row (no `when`), so an unknown situation falls to
 *     it instead of being guessed.
 *  2. Each frozen constant equals its JSON copy under
 *     `specs/153-loop-feedback-speed/contracts/` — the contract file and the
 *     decision cannot drift apart.
 *  3. Each new record the feature writes (the gate binding, the workspace
 *     selection, the report rows) validates against its schema — validated
 *     here with the same draft-2020-12 validator the record reader of
 *     `@specstride/contracts` uses — and the writers stamp the schema id the
 *     record carries.
 *
 * Negative control: a record with a mutated field refuses its schema.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";

import { ATTEMPT_END_CAUSE_TABLE, loadTheAttemptEndCauseTable } from "../src/gate/end-cause.ts";
import { CLOSING_CHECK_SKIP_TABLE } from "../src/gate/closing-check-skip.ts";
import { WORKSPACE_SELECTION_TABLE } from "../src/checks/selection.ts";
import { reportRowsOf } from "../src/report/index.ts";
import { evaluateTable } from "@specstride/kernel";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const CONTRACTS = join(REPO, "specs/153-loop-feedback-speed/contracts");

type Table = {
  schema: string;
  id: string;
  version: string;
  points: Record<string, unknown>;
  rows: Record<string, { ruleId: string; when?: unknown; choice: string }[]>;
};

const TABLES: { name: string; table: Table; file: string }[] = [
  {
    name: "attempt-end-cause",
    table: ATTEMPT_END_CAUSE_TABLE as unknown as Table,
    file: "attempt-end-cause-table.json",
  },
  {
    name: "closing-check.skip",
    table: CLOSING_CHECK_SKIP_TABLE as unknown as Table,
    file: "closing-check-skip-table.json",
  },
  {
    name: "workspace-selection",
    table: WORKSPACE_SELECTION_TABLE as unknown as Table,
    file: "workspace-selection-table.json",
  },
];

for (const { name, table, file } of TABLES) {
  test(`T320 of feature 153 (F153-FR-008): the table ${name} is well-formed and equals its contract file`, () => {
    assert.equal(table.schema, "specstride.table/1");
    assert.equal(table.id, name);
    for (const [point, rows] of Object.entries(table.rows)) {
      assert.ok(rows.length > 0, `${point} has rows`);
      for (const row of rows) {
        assert.match(row.ruleId, /^[A-Z]+-\d+/, `every row of ${point} carries a rule id`);
      }
      const last = rows[rows.length - 1];
      assert.equal(last.when, undefined, `the last row of ${point} is the default row`);
      // Behaviourally: the default row fires for signals no other row knows.
      const signals = Object.fromEntries(
        Object.keys((table.points[point] as { signals: Record<string, string> }).signals).map(
          (signal) => [signal, "<outside every literal>"],
        ),
      );
      const decision = evaluateTable(table as never, point, signals);
      assert.equal(decision.ruleId, last.ruleId);
      assert.equal(decision.choice, last.choice);
    }
    const copy = JSON.parse(readFileSync(join(CONTRACTS, file), "utf8")) as Table;
    assert.deepEqual(copy, JSON.parse(JSON.stringify(table)));
  });
}

test("T320 of feature 153 (F153-FR-008): the attempt-end-cause table loads through the kernel check", () => {
  const loaded = loadTheAttemptEndCauseTable();
  assert.ok(loaded !== undefined);
});

// ------------------------------------------------------- the records + schemas

const ajv = new Ajv2020({ strict: false, allErrors: true });
const compiled = new Map<string, ReturnType<Ajv2020["compile"]>>();
const validateWith = (schemaFile: string, value: unknown): string[] => {
  let check = compiled.get(schemaFile);
  if (check === undefined) {
    const schema = JSON.parse(
      readFileSync(join(REPO, "packages/contracts/schemas", schemaFile), "utf8"),
    );
    check = ajv.compile(schema);
    compiled.set(schemaFile, check);
  }
  check(value);
  return (check.errors ?? []).map((error) => `${error.instancePath}: ${error.message}`);
};

test("T320 of feature 153 (F153-FR-008): the gate binding validates against its schema", () => {
  const binding = {
    schema: "specstride.gate-command-binding/1",
    phase: "phase-1",
    commands: [{ id: "test", argv: ["node", "--test"] }],
    runner: "runtime",
    treeFingerprint: "a1b2c3d4e5",
    resolvedByRule: "GCR-1",
    outcomes: [{ id: "test", exitCode: 0, signal: null }],
  };
  assert.deepEqual(validateWith("gate-command-binding.schema.json", binding), []);
});

test("T320 of feature 153 (F153-FR-008): the workspace selection validates against its schema", () => {
  const selection = {
    schema: "specstride.workspace-selection/1",
    phase: 1,
    attempt: 1,
    rule: "WS-4",
    choice: "scoped",
    graphHashAtPhaseEntry: null,
    graphHashAtSelection: null,
    changedWorkspaces: ["pkgs/a"],
    dependentWorkspaces: ["pkgs/b"],
    selectedCommandIds: ["a-test"],
  };
  assert.deepEqual(validateWith("workspace-selection.schema.json", selection), []);
});

test("T320 of feature 153 (F153-FR-008): the report rows validate against their schema", () => {
  const report = reportRowsOf(
    [
      {
        type: "attempt.ended",
        at: Date.parse("2026-11-14T00:00:00Z"),
        data: { attemptId: "a", endCause: "approved", ruleId: "EC-1-approved" },
      },
    ],
    "run-1",
  );
  assert.deepEqual(validateWith("report-rows.schema.json", report), []);
});

test("T320 of feature 153 (F153-FR-008): the writers stamp the schema id each record carries", () => {
  const engine = readFileSync(join(REPO, "packages/cli/src/engine/run-feature.ts"), "utf8");
  assert.ok(engine.includes('"specstride.gate-command-binding/1"'));
  assert.ok(engine.includes('"specstride.workspace-selection/1"'));
  const rows = readFileSync(join(REPO, "packages/core/src/report/rows.ts"), "utf8");
  assert.ok(rows.includes('"specstride.report-rows/1"'));
});

test("T320 of feature 153 (F153-FR-008): negative control — a mutated record refuses its schema", () => {
  const broken = {
    schema: "specstride.workspace-selection/1",
    phase: 1,
    attempt: 1,
    rule: "WS-9", // not a member of the closed rule-id set
    choice: "scoped",
    selectedCommandIds: [],
  };
  assert.ok(validateWith("workspace-selection.schema.json", broken).length > 0);
});
