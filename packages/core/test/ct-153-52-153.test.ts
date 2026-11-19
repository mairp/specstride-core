// Feature 153, phase 14 (US4) — the edges of the per-task critic evidence
// (F153-FR-052). A changed path no task names is shown under its own
// heading; a path the budget leaves out is named under NOT-SHOWN, never
// silently missing; a task that names no file says so; a named file that is
// missing on the tree is listed as MISSING under its task.
import assert from "node:assert/strict";
import test from "node:test";

import {
  NOT_SHOWN_HEADING,
  OUTSIDE_TASKS_HEADING,
  perTaskEvidenceOf,
} from "../../../packages/core/src/critic-input/evidence/per-task.ts";

/** A content map over a small fixed tree. */
function contentsOf(entries: Record<string, string>) {
  return (path: string) => entries[path];
}

const BASE = {
  windowTokens: undefined,
  totalBudgetBytes: 1_000_000,
} as const;

test("a change outside every task is shown", () => {
  const contents = {
    "src/a.ts": "export const a = 1;\n",
    "docs/x.md": "# x\n",
  };
  const result = perTaskEvidenceOf({
    ...BASE,
    tasks: [{ id: "T001", paths: ["src/a.ts"] }],
    changedPaths: ["src/a.ts", "docs/x.md"],
    contentOf: contentsOf(contents),
  });

  const heading = result.text.indexOf(`## ${OUTSIDE_TASKS_HEADING}`);
  assert.ok(heading !== -1, "the outside-every-task section exists");
  const after = result.text.slice(heading);
  assert.ok(after.includes("docs/x.md"), "the unnamed changed path is shown");
  assert.ok(after.includes(contents["docs/x.md"]!), "its text is shown");
  assert.ok(result.shown.includes("docs/x.md"), "the path is recorded as shown");
});

test("a path a cap leaves out is named", () => {
  const contents = {
    "src/a.ts": "export const a = 1;\n",
    "src/b.ts": "export const b = 2;\n",
    "src/c.ts": "export const c = 3;\n",
  };
  // A budget too small for the last two files of the changed set: the task
  // section (~57 bytes) fits, the outside paths do not.
  const result = perTaskEvidenceOf({
    ...BASE,
    tasks: [{ id: "T001", paths: ["src/a.ts"] }],
    changedPaths: ["src/a.ts", "src/b.ts", "src/c.ts"],
    contentOf: contentsOf(contents),
    totalBudgetBytes: 100,
  });

  const heading = result.text.indexOf(`## ${NOT_SHOWN_HEADING}`);
  assert.ok(heading !== -1, "the NOT-SHOWN section exists");
  const after = result.text.slice(heading);
  assert.ok(after.includes("src/b.ts"), "the first left-out path is named");
  assert.ok(after.includes("src/c.ts"), "the second left-out path is named");
  assert.deepEqual(result.notShown, ["src/b.ts", "src/c.ts"]);
  // Every changed path is either shown or named: none is silently missing.
  const accounted = [...result.shown, ...result.notShown];
  for (const path of ["src/a.ts", "src/b.ts", "src/c.ts"]) {
    assert.ok(accounted.includes(path), `${path} is accounted for`);
  }
  assert.equal(result.shown.length + result.notShown.length, 3);
  // The bound is real: the rendered text fits the budget given.
  assert.ok(
    Buffer.byteLength(result.text, "utf8") <= 100,
    `the text (${Buffer.byteLength(result.text, "utf8")} bytes) exceeds the 100-byte budget`,
  );
});

test("a task that names no file under a tight budget", () => {
  const contents = { "docs/x.md": "# x\n" };
  const result = perTaskEvidenceOf({
    ...BASE,
    tasks: [{ id: "T001", paths: [] }],
    changedPaths: ["docs/x.md"],
    contentOf: contentsOf(contents),
    totalBudgetBytes: 70,
  });
  // The no-file note is kept, the outside change is named, and the text
  // stays within the budget.
  assert.ok(/names no file/i.test(result.text), "the no-file note is kept");
  assert.ok(result.text.includes("docs/x.md"), "the outside change is shown or named");
  assert.ok(
    Buffer.byteLength(result.text, "utf8") <= 70,
    `the text (${Buffer.byteLength(result.text, "utf8")} bytes) exceeds the 70-byte budget`,
  );
});

test("a budget below the minimal skeleton names the count", () => {
  const contents: Record<string, string> = {
    "src/a.ts": "a",
    "src/b.ts": "b",
    "src/c.ts": "c",
  };
  const input = {
    ...BASE,
    tasks: [{ id: "T001", paths: ["src/a.ts", "src/b.ts", "src/c.ts"] }],
    changedPaths: ["src/a.ts", "src/b.ts", "src/c.ts"],
    contentOf: contentsOf(contents),
  };
  // 30 bytes cannot hold even the NOT-SHOWN list of three paths: the bound
  // wins, the text shrinks to what fits (here nothing), and `notShown`
  // still names every path.
  const tiny = perTaskEvidenceOf({ ...input, totalBudgetBytes: 30 });
  assert.deepEqual([...tiny.notShown].sort(), ["src/a.ts", "src/b.ts", "src/c.ts"]);
  assert.ok(
    Buffer.byteLength(tiny.text, "utf8") <= 30,
    `the text (${Buffer.byteLength(tiny.text, "utf8")} bytes) exceeds the 30-byte budget`,
  );
  // A budget that holds a one-line count but not the list shows the count.
  const longPaths = Array.from({ length: 12 }, (_, i) => `src/component-${i}-module.ts`);
  const many = perTaskEvidenceOf({
    ...BASE,
    tasks: [{ id: "T001", paths: longPaths }],
    changedPaths: longPaths,
    contentOf: contentsOf(Object.fromEntries(longPaths.map((p) => [p, "x"]))),
    totalBudgetBytes: 200,
  });
  assert.deepEqual([...many.notShown].sort(), [...longPaths].sort());
  assert.ok(
    Buffer.byteLength(many.text, "utf8") <= 200,
    `the text (${Buffer.byteLength(many.text, "utf8")} bytes) exceeds the 200-byte budget`,
  );
  assert.ok(/12 paths left out/.test(many.text), "the text says the count of left-out paths");
  assert.ok(!many.text.includes(longPaths[0]), "the list itself does not fit and is not shown");
});

test("a task that names no file", () => {
  const contents = { "docs/x.md": "# x\n" };
  const result = perTaskEvidenceOf({
    ...BASE,
    tasks: [
      { id: "T001", paths: [] },
      { id: "T002", paths: ["src/a.ts"] },
    ],
    changedPaths: ["docs/x.md"],
    contentOf: contentsOf(contents),
  });

  const first = result.text.indexOf("T001");
  const second = result.text.indexOf("T002");
  const section = result.text.slice(first, second);
  assert.ok(/names no file/i.test(section), "the section says the task names no file");

  // The changes the file-less task may have made stay outside every task.
  const heading = result.text.indexOf(`## ${OUTSIDE_TASKS_HEADING}`);
  assert.ok(heading !== -1, "the outside-every-task section exists");
  assert.ok(result.text.slice(heading).includes("docs/x.md"));
});

test("a named file that is missing", () => {
  const result = perTaskEvidenceOf({
    ...BASE,
    tasks: [{ id: "T001", paths: ["src/gone.ts"] }],
    changedPaths: ["src/gone.ts"],
    contentOf: contentsOf({}),
  });

  const first = result.text.indexOf("T001");
  const section = first === -1 ? result.text : result.text.slice(first);
  assert.ok(/MISSING/.test(section), "the missing file is listed as MISSING");
  assert.ok(result.text.includes("src/gone.ts"), "the path is never left out");
  assert.ok(result.shown.includes("src/gone.ts"), "the MISSING listing counts as shown");
});
