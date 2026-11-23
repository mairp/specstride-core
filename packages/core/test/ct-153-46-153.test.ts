/**
 * Feature 153, T272 and T273 — uncertainty and the switch select the full
 * inner set (F153-FR-046, F153-SC-011, and F153-FR-005's parity value).
 *
 * The unit is `selectionOf` (`../src/checks/selection.ts`). The rows are
 * decided in this order, and every one of WS-1 to WS-6 widens:
 *
 * - WS-1 — the switch is off (the `parity` profile arrives folded into the
 *   switch): the whole inner set runs, exactly as before the feature;
 * - WS-3 — the graph is `undefined` (unreadable) or fails its schema;
 * - WS-4 — the graph hash now differs from the hash at phase entry, or one
 *   of them is unknown;
 * - WS-5 — a changed path is under no workspace;
 * - WS-6 — a declared command's `cwd` is under no workspace.
 *
 * In every widened case the result holds every declared command, in
 * manifest order.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  selectionOf,
  WS_1,
  WS_3,
  WS_4,
  WS_5,
  WS_6,
  type SelectionGraph,
  type SelectionInput,
  type SelectionWorkspace,
} from "../src/checks/selection.ts";

const FIXTURE_GRAPH_URL = new URL("./fixtures/153/graph-small.json", import.meta.url);

const FIXTURE_WORKSPACES: readonly SelectionWorkspace[] = [
  { dir: "pkgs/a", name: "@x/a" },
  { dir: "pkgs/b", name: "@x/b" },
  { dir: "pkgs/c", name: "@x/c" },
  { dir: "pkgs/d", name: "@x/d" },
];

const FIXTURE_COMMAND_IDS = ["cmd-a", "cmd-b", "cmd-c", "cmd-d"];

function loadFixtureGraph(): SelectionGraph | undefined {
  if (!existsSync(fileURLToPath(FIXTURE_GRAPH_URL))) return undefined;
  return JSON.parse(readFileSync(fileURLToPath(FIXTURE_GRAPH_URL), "utf8")) as SelectionGraph;
}

function input(overrides: Partial<SelectionInput> = {}): SelectionInput {
  return {
    switchOn: true,
    caller: "in-pass",
    graph: loadFixtureGraph(),
    graphHashAtPhaseEntry: "g1",
    graphHashNow: "g1",
    workspaces: FIXTURE_WORKSPACES,
    changedPaths: ["pkgs/a/src/x.ts"],
    commands: [
      { id: "cmd-a", cwd: "pkgs/a" },
      { id: "cmd-b", cwd: "pkgs/b" },
      { id: "cmd-c", cwd: "pkgs/c" },
      { id: "cmd-d", cwd: "pkgs/d" },
    ],
    ...overrides,
  };
}

/** Every widened case selects the full set, in manifest order. */
function assertFull(decision: ReturnType<typeof selectionOf>, ruleId: string): void {
  assert.equal(decision.choice, "full", `expected full, got ${decision.choice}`);
  assert.equal(decision.ruleId, ruleId);
  assert.deepEqual(decision.selectedCommandIds, FIXTURE_COMMAND_IDS);
}

test("uncertainty selects the full set (T272, F153-FR-046, F153-SC-011)", () => {
  if (!loadFixtureGraph()) {
    test.skip("the fixture graph is missing");
    return;
  }

  // WS-3 — the graph cannot be read: `undefined`.
  assertFull(selectionOf(input({ graph: undefined })), WS_3);

  // WS-3 — the graph fails its schema: a package without a name, a
  // non-array `mayImport`, a non-string entry in it.
  assertFull(selectionOf(input({ graph: { packages: [{ name: "", mayImport: [] }] } })), WS_3);
  assertFull(
    selectionOf(
      input({ graph: { packages: [{ name: "@x/a", mayImport: 4 as unknown as string[] }] } }),
    ),
    WS_3,
  );
  assertFull(
    selectionOf(
      input({ graph: { packages: [{ name: "@x/a", mayImport: [7 as unknown as string] }] } }),
    ),
    WS_3,
  );

  // WS-4 — the graph hash now differs from the hash at phase entry.
  assertFull(selectionOf(input({ graphHashNow: "g2" })), WS_4);

  // WS-4 — either hash is unknown: equality cannot be claimed.
  assertFull(selectionOf(input({ graphHashAtPhaseEntry: null })), WS_4);
  assertFull(selectionOf(input({ graphHashNow: null })), WS_4);

  // WS-5 — a changed path is under no workspace (`docs/`, the `tools/` case).
  assertFull(selectionOf(input({ changedPaths: ["pkgs/a/src/x.ts", "docs/x.ts"] })), WS_5);

  // WS-6 — a declared command's `cwd` is under no workspace. The full set
  // here is the full set of the input's commands, both of them.
  const withUnmappedCommand = input({
    commands: [
      { id: "cmd-a", cwd: "pkgs/a" },
      { id: "cmd-x", cwd: "elsewhere" },
    ],
  });
  const ws6 = selectionOf(withUnmappedCommand);
  assert.equal(ws6.choice, "full");
  assert.equal(ws6.ruleId, WS_6);
  assert.deepEqual(
    ws6.selectedCommandIds,
    withUnmappedCommand.commands.map((command) => command.id),
  );

  // The ordering of the rows: a graph that both fails its schema and sits
  // under a stale hash is decided by WS-3, the earlier row.
  assertFull(selectionOf(input({ graph: undefined, graphHashNow: "g2" })), WS_3);
});

test("off and parity select the full set (T273, F153-FR-046, F153-FR-005)", () => {
  if (!loadFixtureGraph()) {
    test.skip("the fixture graph is missing");
    return;
  }
  // WS-1 — the switch is off. The `parity` profile arrives here folded into
  // the switch, so this one row covers both.
  assertFull(selectionOf(input({ switchOn: false })), WS_1);

  // The switch off wins over every later row: with the switch off, even a
  // stale graph hash leaves the whole inner set running.
  assertFull(selectionOf(input({ switchOn: false, graphHashNow: "g2" })), WS_1);
});
