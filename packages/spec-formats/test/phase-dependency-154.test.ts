/**
 * T130 — the specstride dependency line of a phase heading (feature 154,
 * US6, F154-FR-056).
 *
 * The line `<!-- specstride: depends-on: [2, 5] scope: packages/a/ packages/b/ -->`
 * under a phase heading parses into `SpecPhase.dependsOn` (numbers) and
 * `SpecPhase.writeScope` (path prefixes); a malformed line is a parse error
 * that carries the exact line and column of the offending character; a
 * phase heading with NO line gains NO field here — the queue derives the
 * implicit dependency (PQ-3), the parser infers nothing.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  DEPENDENCY_LINE_TOKENS,
  SpecstrideLineError,
  dependencyOfTheSection,
  parseDependencyLine,
  phasesOf,
} from "../src/adapters/speckit-tasks.ts";
import { level2SectionsOf } from "../src/model.ts";

/* ------------------------------------------------------------------ *
 * The line itself.
 * ------------------------------------------------------------------ */

test("a single dependency parses into numbers", () => {
  const fields = parseDependencyLine("<!-- specstride: depends-on: [2] -->", 3);
  assert.deepEqual(fields, { dependsOn: [2] });
});

test("multiple dependencies keep their order, whitespace allowed", () => {
  const fields = parseDependencyLine("<!-- specstride: depends-on: [ 2 , 5 ] -->", 4);
  assert.deepEqual(fields, { dependsOn: [2, 5] });
});

test("a scope with several prefixes keeps order and is slash-normalized", () => {
  const fields = parseDependencyLine("<!-- specstride: scope: packages/a packages/b/ -->", 5);
  assert.deepEqual(fields, { writeScope: ["packages/a/", "packages/b/"] });
});

test("an empty depends-on list is allowed and means none declared", () => {
  const fields = parseDependencyLine("<!-- specstride: depends-on: [] scope: packages/a/ -->", 6);
  assert.deepEqual(fields, { dependsOn: [], writeScope: ["packages/a/"] });
});

test("both tokens together parse into both fields", () => {
  const fields = parseDependencyLine(
    "<!-- specstride: depends-on: [2, 5] scope: packages/a/ packages/b/ -->",
    7,
  );
  assert.deepEqual(fields, { dependsOn: [2, 5], writeScope: ["packages/a/", "packages/b/"] });
});

test("duplicate numbers are de-duplicated, first occurrence first", () => {
  const fields = parseDependencyLine("<!-- specstride: depends-on: [2, 2, 5] -->", 8);
  assert.deepEqual(fields, { dependsOn: [2, 5] });
});

test("a line that is no specstride comment parses to undefined", () => {
  assert.equal(parseDependencyLine("- [ ] T001 a task", 9), undefined);
  assert.equal(parseDependencyLine("<!-- an ordinary comment -->", 10), undefined);
});

test("only the two designed tokens exist", () => {
  assert.deepEqual(DEPENDENCY_LINE_TOKENS, ["depends-on", "scope"]);
});

/* ------------------------------------------------------------------ *
 * The errors, each with its exact position.
 * ------------------------------------------------------------------ */

test("an unknown token is an error at its first character", () => {
  assert.throws(
    () => parseDependencyLine("<!-- specstride: priority: high -->", 11),
    (error: unknown) => {
      assert.ok(error instanceof SpecstrideLineError);
      assert.equal(error.line, 11);
      assert.equal(error.column, 18); // the `p` of `priority`
      assert.match(error.message, /unknown|token|expected/i);
      return true;
    },
  );
});

test("a non-integer in depends-on is an error at the offending character", () => {
  assert.throws(
    () => parseDependencyLine("<!-- specstride: depends-on: [2, x] -->", 12),
    (error: unknown) => {
      assert.ok(error instanceof SpecstrideLineError);
      assert.equal(error.line, 12);
      assert.equal(error.column, 34); // the `x`
      return true;
    },
  );
});

test("a missing closing bracket is an error at the end of the line", () => {
  assert.throws(
    () => parseDependencyLine("<!-- specstride: depends-on: [2, 5 -->", 13),
    (error: unknown) => {
      assert.ok(error instanceof SpecstrideLineError);
      assert.equal(error.line, 13);
      assert.match(error.message, /closes|missing/i);
      return true;
    },
  );
});

test("a depends-on without a list is an error at the value", () => {
  assert.throws(
    () => parseDependencyLine("<!-- specstride: depends-on: two -->", 14),
    (error: unknown) => {
      assert.ok(error instanceof SpecstrideLineError);
      assert.equal(error.line, 14);
      assert.equal(error.column, 30); // the `t` of `two`
      return true;
    },
  );
});

test("a malformed list member is an error at its position", () => {
  assert.throws(
    () => parseDependencyLine("<!-- specstride: depends-on: [2.5] -->", 15),
    (error: unknown) => {
      assert.ok(error instanceof SpecstrideLineError);
      assert.equal(error.line, 15);
      assert.equal(error.column, 32); // the `.`
      return true;
    },
  );
});

test("an empty scope is an error", () => {
  assert.throws(
    () => parseDependencyLine("<!-- specstride: scope: -->", 16),
    (error: unknown) => {
      assert.ok(error instanceof SpecstrideLineError);
      assert.equal(error.line, 16);
      assert.match(error.message, /scope/);
      return true;
    },
  );
});

/* ------------------------------------------------------------------ *
 * The line under a phase heading.
 * ------------------------------------------------------------------ */

const TEXT_WITH_LINES = [
  "# Tasks",
  "",
  "## Phase 1: One",
  "",
  "- [ ] T001 the first",
  "",
  "## Phase 2: Two",
  "<!-- specstride: depends-on: [1] scope: packages/a/ -->",
  "",
  "- [ ] T002 the second",
  "",
  "## Phase 3: Three",
  "<!-- specstride: depends-on: [] scope: packages/b/ packages/c -->",
  "",
  "- [ ] T003 the third",
  "",
].join("\n");

test("a phase with the line carries dependsOn and writeScope", () => {
  const phases = phasesOf(TEXT_WITH_LINES, "tasks.md");
  const two = phases.find((phase) => phase.number === 2);
  assert.ok(two !== undefined);
  assert.deepEqual(two.dependsOn, [1]);
  assert.deepEqual(two.writeScope, ["packages/a/"]);
});

test("an empty depends-on stays an empty array on the phase", () => {
  const phases = phasesOf(TEXT_WITH_LINES, "tasks.md");
  const three = phases.find((phase) => phase.number === 3);
  assert.ok(three !== undefined);
  assert.deepEqual(three.dependsOn, []);
  assert.deepEqual(three.writeScope, ["packages/b/", "packages/c/"]);
});

test("a phase with no line carries the EMPTY dependsOn and no write scope", () => {
  const phases = phasesOf(TEXT_WITH_LINES, "tasks.md");
  const one = phases.find((phase) => phase.number === 1);
  assert.ok(one !== undefined);
  // T131 — a phase with no specstride line carries NO DECLARED DEPENDENCIES,
  // stated explicitly as the empty list, and the implicit dependency stays
  // the queue's (PQ-3); the write scope is absent, the source declared none.
  assert.deepEqual(one.dependsOn, []);
  assert.equal("writeScope" in one, false);
});

test("a second specstride line under one heading is an error at its line", () => {
  const text = [
    "## Phase 1: One",
    "<!-- specstride: depends-on: [] -->",
    "<!-- specstride: scope: packages/a/ -->",
    "- [ ] T001 a task",
  ].join("\n");
  assert.throws(
    () => phasesOf(text, "tasks.md"),
    (error: unknown) => {
      assert.ok(error instanceof SpecstrideLineError);
      assert.equal(error.line, 3); // the SECOND comment line of the file
      return true;
    },
  );
});

test("a specstride line NOT immediately after the heading is an error", () => {
  const text = [
    "## Phase 1: One",
    "",
    "some prose first",
    "<!-- specstride: depends-on: [] -->",
    "- [ ] T001 a task",
  ].join("\n");
  assert.throws(
    () => phasesOf(text, "tasks.md"),
    (error: unknown) => {
      assert.ok(error instanceof SpecstrideLineError);
      assert.equal(error.line, 4);
      return true;
    },
  );
});

test("the sections reader sees the line where the file puts it", () => {
  const sections = level2SectionsOf(TEXT_WITH_LINES);
  const two = sections.find((section) => section.headingLine === 7);
  assert.ok(two !== undefined);
  const fields = dependencyOfTheSection(two);
  assert.deepEqual(fields, { dependsOn: [1], writeScope: ["packages/a/"] });
});
