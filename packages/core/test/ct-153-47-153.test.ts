/**
 * Feature 153, T274 — the gate is never scoped (F153-FR-047, CQ-153-08 A).
 *
 * The unit is `selectionOf` (`../src/checks/selection.ts`). The
 * verification gate of a phase is what approval rests on; when the caller
 * is `gate`, the choice is `full` and the rule is WS-2, whatever the other
 * signals say. The case feeds every input of the property generator of
 * `ct-153-45-153.test.ts` — seeded graphs and change sets over the fixture
 * graph — with `caller: "gate"`, and expects the full set every time.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  selectionOf,
  WS_2,
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

const FIXTURE_COMMANDS = [
  { id: "cmd-a", cwd: "pkgs/a" },
  { id: "cmd-b", cwd: "pkgs/b" },
  { id: "cmd-c", cwd: "pkgs/c" },
  { id: "cmd-d", cwd: "pkgs/d" },
];

function loadFixtureGraph(): SelectionGraph | undefined {
  if (!existsSync(fileURLToPath(FIXTURE_GRAPH_URL))) return undefined;
  return JSON.parse(
    readFileSync(fileURLToPath(FIXTURE_GRAPH_URL), "utf8"),
  ) as SelectionGraph;
}

/** A seeded pseudo-random generator, identical to the one of ct-153-45. */
function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

test("the gate is never scoped (T274, F153-FR-047, CQ-153-08 A)", () => {
  const graph = loadFixtureGraph();
  if (!graph) {
    test.skip("the fixture graph is missing");
    return;
  }
  const names = graph.packages.map((pkg) => pkg.name);
  let scopedWouldApply = 0;
  for (let seed = 1; seed <= 200; seed += 1) {
    const random = rng(seed);
    // The same seeded generator as ct-153-45: graphs and change sets that,
    // in-pass, would scope.
    const seededGraph: SelectionGraph = {
      packages: graph.packages.map((pkg) => ({
        name: pkg.name,
        mayImport: names.filter((other) => other !== pkg.name && random() < 0.35),
      })),
    };
    const changedPaths: string[] = [];
    for (const name of names) {
      if (random() < 0.5) changedPaths.push(`pkgs/${name.slice(3)}/src/x.ts`);
    }
    const base: SelectionInput = {
      switchOn: true,
      caller: "in-pass",
      graph: seededGraph,
      graphHashAtPhaseEntry: "g1",
      graphHashNow: "g1",
      workspaces: FIXTURE_WORKSPACES,
      changedPaths,
      commands: FIXTURE_COMMANDS,
    };
    if (selectionOf(base).choice === "scoped") scopedWouldApply += 1;

    // As the gate, the very same input selects the full set, and the rule
    // is WS-2 — ahead of every widening row and of the default row.
    const gate = selectionOf({ ...base, caller: "gate" });
    assert.equal(gate.choice, "full", `seed ${seed}: the gate is never scoped`);
    assert.equal(gate.ruleId, WS_2, `seed ${seed}: the gate is decided by WS-2`);
    assert.deepEqual(
      gate.selectedCommandIds,
      FIXTURE_COMMANDS.map((command) => command.id),
      `seed ${seed}: the gate runs every declared command`,
    );
  }
  assert.ok(
    scopedWouldApply > 0,
    "the generator must produce inputs that would scope in-pass, so the gate case is not vacuous",
  );
});

test("the gate row wins over the widening rows (WS-2 before WS-3 to WS-6)", () => {
  // A gate input that is uncertain on every axis at once still answers
  // WS-2, the earlier row, not WS-3.
  const decision = selectionOf({
    switchOn: true,
    caller: "gate",
    graph: undefined,
    graphHashAtPhaseEntry: null,
    graphHashNow: null,
    workspaces: FIXTURE_WORKSPACES,
    changedPaths: ["docs/x.ts"],
    commands: [{ id: "cmd-x", cwd: "elsewhere" }],
  });
  assert.equal(decision.choice, "full");
  assert.equal(decision.ruleId, WS_2);
});
