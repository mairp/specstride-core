/**
 * CT-152 (docs) — the quickstart scenarios are verified in the feature's
 * record (task T154).
 *
 * `specs/152-commit-backpressure/verified.md` holds a copy of the quickstart's
 * scenario table. This test reads it from the worktree and asserts all 12
 * rows exist and are ticked (`| Yes |`), so the run of every quickstart
 * scenario is machine-checkable.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const VERIFIED = join(
  HERE,
  "..",
  "..",
  "..",
  "..",
  "specs",
  "152-commit-backpressure",
  "verified.md",
);

const SCENARIOS = [
  "secret-removed-on-retry",
  "Scenario 1's control plane",
  "secret-every-attempt",
  "secret-moves-files",
  "instruction-in-a-file-name",
  "ordinary-code",
  "SIGKILL after each write step",
  "Kill between approval and step 6",
  "commit.backpressure: false",
  "Scenario 1 under `--profile parity`",
  "Edit the rule data during a run",
  "Project `specstride.commit-gate.json` with `exempt`",
] as const;

test("the quickstart scenarios of verified.md are all ticked (T154)", () => {
  const text = readFileSync(VERIFIED, "utf8");

  // The "Quickstart scenarios" table holds one ticked row per scenario above.
  const tableStart = text.indexOf("## Quickstart scenarios");
  assert.notEqual(tableStart, -1, "verified.md has no 'Quickstart scenarios' section");
  const tableEnd = text.indexOf("## ", tableStart + 4);
  const table = text.slice(
    tableStart,
    tableEnd === -1 ? text.length : tableEnd,
  );

  const rows = table
    .split("\n")
    .filter((line) => line.startsWith("|") && /\d+ \|/.test(line));
  assert.equal(rows.length, 12, `expected 12 scenario rows, found ${String(rows.length)}`);

  for (const scenario of SCENARIOS) {
    const row = rows.find((line) => line.includes(scenario));
    assert.notEqual(row, undefined, `no quickstart row for the scenario: ${scenario}`);
    assert.match(
      row as string,
      /\|\s*Yes\s*\|/,
      `the quickstart row of "${scenario}" is not ticked`,
    );
  }
});
