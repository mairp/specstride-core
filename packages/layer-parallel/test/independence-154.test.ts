/**
 * T072 — THE INDEPENDENCE OF TWO GROUPS OF ONE PHASE (F154-FR-032; rules
 * PG-0 to PG-3; CQ-154-02 C with (iii)).
 *
 * `independenceOf` over `INDEPENDENCE_TABLE`: a declared `dependsOn` makes a
 * pair dependent (PG-2), a declared `independentWith` makes it independent
 * (PG-3), the marker rule makes it independent (PG-1) — disjoint scopes,
 * every task marked, and no path of the later group inside the earlier
 * scope — and everything else is dependent (PG-0). Two task groups without
 * any declaration are dependent, because neither carries the marker.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { INDEPENDENCE_TABLE } from "../src/tables.ts";
import {
  DEPENDENCY_CHECK,
  INDEPENDENCE_RULE_IDS,
  independenceOf,
  type GroupIndependenceDeclaration,
  type GroupUnit,
} from "../src/independence.ts";
import { plannedGroupOf } from "../src/groups.ts";

/** A scope over one prefix tree (source `task-text`, as the slicer gives). */
function scopeOf(prefixes: string[]): GroupUnit["writeScope"] {
  return { prefixes: Object.freeze([...prefixes]), source: "task-text" };
}

/** One group unit: groupId, plan group, scope, task texts. */
function unitOf(groupId: string, tasks: string[], prefixes: string[], texts?: string[]): GroupUnit {
  const group = plannedGroupOf({
    groupId,
    phase: 2,
    taskIds: [...tasks],
    writeScope: { prefixes: [...prefixes] },
  });
  return {
    groupId,
    group,
    writeScope: scopeOf(prefixes),
    taskTexts: Object.freeze(texts ?? tasks.map((task) => `do the work of ${task}`)),
  };
}

/** Two groups with disjoint scopes: A first, B later. */
function pairOf(): [GroupUnit, GroupUnit] {
  return [
    unitOf("g-2-1", ["T001", "T002"], ["src/a"]),
    unitOf("g-2-2", ["T003", "T004"], ["src/b"]),
  ];
}

/** A declaration with neither map: no relation declared at all. */
const NO_DECLARATION: GroupIndependenceDeclaration = {};

test("the independence table is the rule source the verdict reads", () => {
  assert.equal(INDEPENDENCE_TABLE.id, "parallel.group-independence");
  const rows = INDEPENDENCE_TABLE.rows["parallel.group-independence"] ?? [];
  assert.deepEqual(
    rows.map((row) => row.ruleId),
    [...INDEPENDENCE_RULE_IDS],
  );
  assert.deepEqual(
    rows.map((row) => row.choice),
    ["dependent", "independent", "independent", "dependent"],
  );
});

test("PG-2 — a declared dependsOn of the later group makes the pair dependent", () => {
  const [earlier, later] = pairOf();
  const verdict = independenceOf(earlier, later, {
    dependsOn: { "g-2-2": ["g-2-1"] },
  });
  assert.deepEqual(
    { check: verdict.check, independent: verdict.independent, ruleId: verdict.ruleId },
    { check: DEPENDENCY_CHECK, independent: false, ruleId: "PG-2" },
  );
  assert.match(verdict.detail, /PG-2/);
});

test("PG-2 — the declaration decides over an otherwise independent pair", () => {
  const [earlier, later] = pairOf();
  // The marker rule would hold (PG-1), and an independentWith is declared
  // the other way: the dependsOn of the later group wins, PG-2 first.
  const marked = [
    unitOf("g-2-1", ["T001", "T002"], ["src/a"], ["[P] a one", "[P] a two"]),
    unitOf("g-2-2", ["T003", "T004"], ["src/b"], ["[P] b one", "[P] b two"]),
  ];
  const verdict = independenceOf(marked[0] as GroupUnit, marked[1] as GroupUnit, {
    dependsOn: { "g-2-2": ["g-2-1"] },
    independentWith: { "g-2-1": ["g-2-2"] },
  });
  assert.equal(verdict.ruleId, "PG-2");
  assert.equal(verdict.independent, false);
});

test("PG-3 — a declared independentWith makes the pair independent", () => {
  const [earlier, later] = pairOf();
  for (const declaration of [
    { independentWith: { "g-2-1": ["g-2-2"] } },
    { independentWith: { "g-2-2": ["g-2-1"] } },
  ] as GroupIndependenceDeclaration[]) {
    const verdict = independenceOf(earlier, later, declaration);
    assert.deepEqual(
      { check: verdict.check, independent: verdict.independent, ruleId: verdict.ruleId },
      { check: DEPENDENCY_CHECK, independent: true, ruleId: "PG-3" },
    );
    assert.match(verdict.detail, /PG-3/);
  }
});

test("PG-1 — the marker rule: disjoint scopes, every task marked, no named path", () => {
  const marked = [
    unitOf("g-2-1", ["T001", "T002"], ["src/a"], ["[P] work in src/a only", "[P] more of src/a"]),
    unitOf("g-2-2", ["T003", "T004"], ["src/b"], ["[P] work in src/b only", "[P] more of src/b"]),
  ];
  const verdict = independenceOf(marked[0] as GroupUnit, marked[1] as GroupUnit, NO_DECLARATION);
  assert.deepEqual(
    { check: verdict.check, independent: verdict.independent, ruleId: verdict.ruleId },
    { check: DEPENDENCY_CHECK, independent: true, ruleId: "PG-1" },
  );
  assert.match(verdict.detail, /PG-1/);
});

test("PG-0 — the later group naming a path in the earlier scope makes the pair dependent", () => {
  const marked = [
    unitOf("g-2-1", ["T001", "T002"], ["src/a"], ["[P] work in src/a", "[P] more of src/a"]),
    // The later group's text names src/a/shared.ts, a path inside the
    // earlier group's write scope.
    unitOf(
      "g-2-2",
      ["T003", "T004"],
      ["src/b"],
      ["[P] work in src/b", "[P] read src/a/shared.ts and write src/b/out.ts"],
    ),
  ];
  const verdict = independenceOf(marked[0] as GroupUnit, marked[1] as GroupUnit, NO_DECLARATION);
  assert.deepEqual(
    { check: verdict.check, independent: verdict.independent, ruleId: verdict.ruleId },
    { check: DEPENDENCY_CHECK, independent: false, ruleId: "PG-0" },
  );
});

test("PG-1 — a scope overlap makes the pair dependent even with every task marked", () => {
  const marked = [
    unitOf("g-2-1", ["T001", "T002"], ["src"], ["[P] one", "[P] two"]),
    unitOf("g-2-2", ["T003", "T004"], ["src/b"], ["[P] three", "[P] four"]),
  ];
  const verdict = independenceOf(marked[0] as GroupUnit, marked[1] as GroupUnit, NO_DECLARATION);
  assert.equal(verdict.ruleId, "PG-0");
  assert.equal(verdict.independent, false);
});

test("PG-0 — two task groups without a declaration are dependent (no marker)", () => {
  const [earlier, later] = pairOf();
  const verdict = independenceOf(earlier, later, NO_DECLARATION);
  assert.deepEqual(
    { check: verdict.check, independent: verdict.independent, ruleId: verdict.ruleId },
    { check: DEPENDENCY_CHECK, independent: false, ruleId: "PG-0" },
  );
  assert.match(verdict.detail, /PG-0/);
});

test("PG-0 — one unmarked task among marked ones is enough for dependent", () => {
  const marked = [
    unitOf("g-2-1", ["T001", "T002"], ["src/a"], ["[P] one", "[P] two"]),
    unitOf("g-2-2", ["T003", "T004"], ["src/b"], ["[P] three", "plain four"]),
  ];
  const verdict = independenceOf(marked[0] as GroupUnit, marked[1] as GroupUnit, NO_DECLARATION);
  assert.equal(verdict.ruleId, "PG-0");
  assert.equal(verdict.independent, false);
});

test("PG-3 — the declaration stands even where the marker rule fails", () => {
  const [earlier, later] = pairOf(); // no markers anywhere
  const verdict = independenceOf(earlier, later, {
    independentWith: { "g-2-2": ["g-2-1"] },
  });
  assert.equal(verdict.ruleId, "PG-3");
  assert.equal(verdict.independent, true);
});

test("the same inputs give the same verdict (F154-FR-003)", () => {
  const [earlier, later] = pairOf();
  const one = independenceOf(earlier, later, { independentWith: { "g-2-1": ["g-2-2"] } });
  const two = independenceOf(earlier, later, { independentWith: { "g-2-1": ["g-2-2"] } });
  assert.deepEqual(one, two);
  const three = independenceOf(earlier, later, NO_DECLARATION);
  const four = independenceOf(earlier, later, NO_DECLARATION);
  assert.deepEqual(three, four);
});

test("the reversed order of the same pair keeps a declared relation decisive", () => {
  const [a, b] = pairOf();
  // b declared dependsOn a: dependent one way…
  const forward = independenceOf(a, b, { dependsOn: { "g-2-2": ["g-2-1"] } });
  assert.equal(forward.independent, false);
  // …and the pair read the other way carries no dependsOn of its "later"
  // (a declares nothing), so the marker rule decides — and fails: dependent.
  const backward = independenceOf(b, a, { dependsOn: { "g-2-2": ["g-2-1"] } });
  assert.equal(backward.independent, false);
});
