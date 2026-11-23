/**
 * Feature 153, T269 to T271 — the reverse-dependency closure of the scoped
 * in-pass selection (F153-FR-045, US3 "in-pass checks are scoped").
 *
 * The unit is `selectionOf` (`../src/checks/selection.ts`), with
 * `workspaceOfPath` and `dependentsOf`, the pure decision of which declared
 * commands of the inner check set an in-pass check runs. With the switch
 * on, an in-pass check (`caller: "in-pass"`) runs the declared commands of
 * the changed workspaces and of every workspace that depends on one of them
 * by a reverse-dependency walk of the static package graph — and nothing
 * else:
 *
 * - the selection holds only ids of the declared commands; the unit cannot
 *   make a command (Principle XIV — no command is synthesised);
 * - the selected commands run in the order of `commands` (manifest order),
 *   never in walk order;
 * - the property case states the whole truth at once: for seeded graphs and
 *   change sets the selected workspaces are exactly the set reached from
 *   the changed workspaces by following "is imported by", computed here by
 *   a plain breadth-first walk.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  dependentsOf,
  selectionOf,
  WORKSPACE_SELECTION_TABLE,
  WORKSPACE_SELECTION_TABLE_ID,
  WORKSPACE_SELECTION_TABLE_VERSION,
  workspaceOfPath,
  WS_7,
  type SelectionCommand,
  type SelectionGraph,
  type SelectionInput,
  type SelectionWorkspace,
} from "../src/checks/selection.ts";

/** The fixture graph of four packages: a <- b <- c, and d, which imports nothing. */
const FIXTURE_GRAPH_URL = new URL("./fixtures/153/graph-small.json", import.meta.url);

/** The workspaces of the fixture: pkgs/a holds @x/a, and so on. */
const FIXTURE_WORKSPACES: readonly SelectionWorkspace[] = [
  { dir: "pkgs/a", name: "@x/a" },
  { dir: "pkgs/b", name: "@x/b" },
  { dir: "pkgs/c", name: "@x/c" },
  { dir: "pkgs/d", name: "@x/d" },
];

/** One declared command per workspace, in manifest order. */
const FIXTURE_COMMANDS: readonly SelectionCommand[] = [
  { id: "cmd-a", cwd: "pkgs/a" },
  { id: "cmd-b", cwd: "pkgs/b" },
  { id: "cmd-c", cwd: "pkgs/c" },
  { id: "cmd-d", cwd: "pkgs/d" },
];

function loadFixtureGraph(): SelectionGraph | undefined {
  if (!existsSync(fileURLToPath(FIXTURE_GRAPH_URL))) return undefined;
  return JSON.parse(readFileSync(fileURLToPath(FIXTURE_GRAPH_URL), "utf8")) as SelectionGraph;
}

/** A well-formed input over the fixture graph, with the change in `pkgs/a`. */
function fixtureInput(
  overrides: {
    readonly switchOn?: boolean;
    readonly caller?: "in-pass" | "gate";
    readonly graph?: SelectionGraph | undefined;
    readonly graphHashAtPhaseEntry?: string | null;
    readonly graphHashNow?: string | null;
    readonly changedPaths?: readonly string[];
  } = {},
): SelectionInput {
  return {
    switchOn: overrides.switchOn ?? true,
    caller: overrides.caller ?? "in-pass",
    graph: "graph" in overrides ? overrides.graph : loadFixtureGraph(),
    graphHashAtPhaseEntry: overrides.graphHashAtPhaseEntry ?? "g1",
    graphHashNow: overrides.graphHashNow ?? "g1",
    workspaces: FIXTURE_WORKSPACES,
    changedPaths: overrides.changedPaths ?? ["pkgs/a/src/x.ts"],
    commands: FIXTURE_COMMANDS,
  };
}

/** A plain breadth-first walk of "is imported by", independent of the unit. */
function bfsClosure(names: readonly string[], graph: SelectionGraph): string[] {
  const importedBy = new Map<string, string[]>();
  for (const pkg of graph.packages) {
    for (const target of pkg.mayImport ?? []) {
      importedBy.set(target, [...(importedBy.get(target) ?? []), pkg.name]);
    }
  }
  const seen = new Set<string>(names);
  const queue = [...names];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    for (const next of importedBy.get(current) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return [...seen].sort();
}

/** A seeded pseudo-random generator, so the property case repeats exactly. */
function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

test("T267 the contract file is this table", () => {
  const url = new URL(
    "../../../specs/153-loop-feedback-speed/contracts/workspace-selection-table.json",
    import.meta.url,
  );
  const path = fileURLToPath(url);
  // No skip: an absent contract file is a failure, so a green run proves the
  // file exists and equals WORKSPACE_SELECTION_TABLE (T267).
  assert.ok(existsSync(path), `the contract file is missing: ${path}`);
  const contract: unknown = JSON.parse(readFileSync(path, "utf8"));
  assert.deepEqual(contract, WORKSPACE_SELECTION_TABLE);
  assert.equal(WORKSPACE_SELECTION_TABLE.id, WORKSPACE_SELECTION_TABLE_ID);
  assert.equal(WORKSPACE_SELECTION_TABLE.version, WORKSPACE_SELECTION_TABLE_VERSION);
});

test("the reverse-dependency closure (T269, F153-FR-045)", () => {
  const graph = loadFixtureGraph();
  if (!graph) {
    test.skip("the fixture graph is missing");
    return;
  }
  const decision = selectionOf(fixtureInput());
  assert.equal(decision.choice, "scoped");
  assert.equal(decision.ruleId, WS_7);
  // a is changed; b imports a and c imports b, so their commands are
  // selected; d imports nothing of the closure and is not.
  assert.deepEqual(decision.selectedCommandIds, ["cmd-a", "cmd-b", "cmd-c"]);
  assert.deepEqual(decision.selectedWorkspaces, ["@x/a", "@x/b", "@x/c"]);
  // The ids appear in the order of `commands` — manifest order, never walk
  // order.
  assert.deepEqual(
    decision.selectedCommandIds,
    FIXTURE_COMMANDS.filter((command) => decision.selectedCommandIds.includes(command.id)).map(
      (command) => command.id,
    ),
  );
  assert.equal(decision.tableId, WORKSPACE_SELECTION_TABLE_ID);
});

test("only declared commands (T270, F153-FR-045, Principle XIV)", () => {
  const graph = loadFixtureGraph();
  if (!graph) {
    test.skip("the fixture graph is missing");
    return;
  }
  const decision = selectionOf(fixtureInput());
  const declared = new Set(FIXTURE_COMMANDS.map((command) => command.id));
  for (const id of decision.selectedCommandIds) {
    assert.ok(declared.has(id), `the selected id ${id} is a declared command`);
  }
  // The result holds no argument list: the unit selects among declared
  // commands and cannot make one.
  const serialised = JSON.stringify(decision);
  assert.ok(!serialised.includes("argv"), "no argument list in the result");
  assert.ok(!serialised.includes('"sh"'), "no command text in the result");
});

test("the selection is the closure (T271, property, 200 seeds)", () => {
  const graph = loadFixtureGraph();
  if (!graph) {
    test.skip("the fixture graph is missing");
    return;
  }
  const names = graph.packages.map((pkg) => pkg.name);
  for (let seed = 1; seed <= 200; seed += 1) {
    const random = rng(seed);
    // A seeded random graph over the four fixture names.
    const seededGraph: SelectionGraph = {
      packages: graph.packages.map((pkg) => ({
        name: pkg.name,
        mayImport: names.filter((other) => other !== pkg.name && random() < 0.35),
      })),
    };
    // A seeded change set: each workspace changed with probability one half.
    const changedPaths: string[] = [];
    for (const name of names) {
      if (random() < 0.5) changedPaths.push(`pkgs/${name.slice(3)}/src/x.ts`);
    }
    if (changedPaths.length === 0) continue;
    const changedNames = new Set<string>();
    for (const path of changedPaths) {
      const workspace = workspaceOfPath(path, FIXTURE_WORKSPACES);
      if (workspace) changedNames.add(workspace.name);
    }
    const decision = selectionOf(fixtureInput({ graph: seededGraph, changedPaths }));
    if (decision.choice !== "scoped") continue; // a widened case: ct-153-46
    const expected = bfsClosure([...changedNames], seededGraph);
    assert.deepEqual(
      decision.selectedWorkspaces,
      expected,
      `seed ${seed}: the selection is the reverse-dependency closure`,
    );
    const expectedIds = FIXTURE_COMMANDS.filter((command) => {
      const workspace = workspaceOfPath(command.cwd, FIXTURE_WORKSPACES);
      return workspace !== undefined && expected.includes(workspace.name);
    }).map((command) => command.id);
    assert.deepEqual(decision.selectedCommandIds, expectedIds, `seed ${seed}: the ids follow`);
  }
});

test("the walk helpers agree with the closure (dependentsOf)", () => {
  const graph = loadFixtureGraph();
  if (!graph) {
    test.skip("the fixture graph is missing");
    return;
  }
  assert.deepEqual(dependentsOf(["@x/a"], graph), ["@x/a", "@x/b", "@x/c"]);
  assert.deepEqual(dependentsOf(["@x/d"], graph), ["@x/d"]);
  assert.deepEqual(dependentsOf(["@x/b"], graph), ["@x/b", "@x/c"]);
  assert.deepEqual(dependentsOf([], graph), []);
  assert.deepEqual(dependentsOf(["@x/a"], undefined), []);
});

test("workspaceOfPath matches only at a path boundary", () => {
  const workspaces: readonly SelectionWorkspace[] = [
    { dir: "pkgs/a", name: "@x/a" },
    { dir: "pkgs/a/sub", name: "@x/a-sub" },
  ];
  assert.equal(workspaceOfPath("pkgs/a/src/x.ts", workspaces)?.name, "@x/a");
  assert.equal(workspaceOfPath("pkgs/a/sub/x.ts", workspaces)?.name, "@x/a-sub");
  assert.equal(workspaceOfPath("pkgs/ab/src/x.ts", workspaces), undefined);
  assert.equal(workspaceOfPath("docs/x.ts", workspaces), undefined);
});
