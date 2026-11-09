/**
 * The secret gate judges the lines an approval commit adds: a fixture HEAD
 * already holds does not block the commit of a pass that edits its file
 * (152-commit-backpressure phase 2, 2026-11-09), and a new line still does.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  addedLinesAgainstHead,
  addedLinesOfDiff,
  isAddedLine,
} from "../../src/engine/commit-lines.ts";

const KEY = ["sk", "the-secret-itself"].join("-");

function repo(): string {
  const dir = mkdtempSync(join(tmpdir(), "commit-lines-"));
  const run = (...argv: string[]) =>
    assert.equal(spawnSync("git", ["-C", dir, ...argv]).status, 0, argv.join(" "));
  run("init", "-q");
  run("config", "user.email", "t@example.invalid");
  run("config", "user.name", "t");
  writeFileSync(join(dir, "fixture.test.ts"), `const a = 1;\nconst key = "${KEY}";\n`);
  run("add", ".");
  run("commit", "-qm", "base");
  return dir;
}

test("the hunk headers give the added lines; a pure deletion adds none", () => {
  const diff = [
    "@@ -1,0 +2,3 @@",
    "+a",
    "+b",
    "+c",
    "@@ -9 +12 @@",
    "+d",
    "@@ -20,2 +22,0 @@",
  ].join("\n");
  assert.deepEqual([...addedLinesOfDiff(diff)], [2, 3, 4, 12]);
});

test("a line HEAD holds does not count; a line the commit adds does", () => {
  const dir = repo();
  try {
    writeFileSync(
      join(dir, "fixture.test.ts"),
      `const a = 1;\nconst key = "${KEY}";\nconst b = 2;\nconst c = "${KEY}";\n`,
    );
    const added = addedLinesAgainstHead(dir, ["fixture.test.ts"]);
    assert.equal(isAddedLine(added, { file: "fixture.test.ts", line: 2 }), false);
    assert.equal(isAddedLine(added, { file: "fixture.test.ts", line: 4 }), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a file HEAD does not hold is new: every line counts; an unreadable hit always counts", () => {
  const dir = repo();
  try {
    writeFileSync(join(dir, "new.ts"), `const key = "${KEY}";\n`);
    const added = addedLinesAgainstHead(dir, ["new.ts", "fixture.test.ts"]);
    assert.equal(isAddedLine(added, { file: "new.ts", line: 1 }), true);
    assert.equal(isAddedLine(added, { file: "fixture.test.ts", line: 0 }), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("with no commit yet every file is scanned whole", () => {
  const dir = mkdtempSync(join(tmpdir(), "commit-lines-"));
  try {
    spawnSync("git", ["-C", dir, "init", "-q"]);
    writeFileSync(join(dir, "a.ts"), "x\n");
    assert.equal(addedLinesAgainstHead(dir, ["a.ts"]).size, 0);
    assert.equal(isAddedLine(new Map(), { file: "a.ts", line: 1 }), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
