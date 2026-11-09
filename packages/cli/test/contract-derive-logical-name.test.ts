/**
 * `contract derive` takes the contract by its logical name
 * (`pipeline:<id>:contract`, F107-FR-039) on `--output` and on
 * `--answer <draft>`, as `contract validate|promote|render` do: the name
 * resolves to the contract under the state of `--repo`. Before, derive used
 * the name as a file path, wrote a file literally named
 * `pipeline:<id>:contract` in the working directory, printed the logical
 * name as if the state held it, and left the state contract untouched.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { contractDeriveHandler } from "../src/engine/handlers.ts";

function repository(): string {
  const repo = mkdtempSync(join(tmpdir(), "derive-logical-"));
  const feature = join(repo, "specs", "001-made");
  mkdirSync(feature, { recursive: true });
  execFileSync("git", ["init", "-q"], { cwd: repo });
  writeFileSync(
    join(feature, "tasks.md"),
    ["# Tasks", "", "## Phase 1: Create", "", "- [ ] T001 Create `made.txt`", ""].join("\n"),
  );
  return repo;
}

function run(cwd: string, argv: readonly string[]): { exit: number; text: string } {
  const lines: string[] = [];
  const previous = process.cwd();
  try {
    process.chdir(cwd);
    const exit = contractDeriveHandler(argv, {
      out: (text: string): void => {
        lines.push(text);
      },
      err: (text: string): void => {
        lines.push(text);
      },
    });
    return { exit, text: lines.join("") };
  } finally {
    process.chdir(previous);
  }
}

test("--output pipeline:<id>:contract writes the state contract, not a file of that name", () => {
  const repo = repository();
  try {
    const derived = run(repo, ["--repo", repo, "--output", "pipeline:001-made:contract"]);
    assert.equal(derived.exit, 0, derived.text);
    assert.ok(existsSync(join(repo, ".specstride", "state", "pipeline", "001-made", "contract")));
    assert.deepEqual(
      readdirSync(repo).filter((name) => name.startsWith("pipeline:")),
      [],
    );
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("--next-batch and --answer load the draft named by its logical name", () => {
  const repo = repository();
  try {
    assert.equal(run(repo, ["--repo", repo]).exit, 0);
    const batch = run(repo, [
      "--repo",
      repo,
      "--output",
      "pipeline:001-made:contract",
      "--next-batch",
    ]);
    assert.equal(batch.exit, 0, batch.text);
    assert.match(batch.text, /"schema":"specstride\.judgment\/1"/);
    // An answer to an item the draft does not hold: the draft WAS loaded
    // (the refusal names the item), not a missing file of that name.
    const answered = run(repo, [
      "--repo",
      repo,
      "--answer",
      "pipeline:001-made:contract",
      "001-made-1",
      "nope=x",
    ]);
    assert.equal(answered.exit, 2);
    assert.match(answered.text, /no judgment item nope in the draft/);
    assert.deepEqual(
      readdirSync(repo).filter((name) => name.startsWith("pipeline:")),
      [],
    );
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
