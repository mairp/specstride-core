/**
 * T043 — the trial of `loop.parallel.units` (F154-FR-008, -018) writes a
 * `specstride.trial/1` record whose pass mark is stated and whose text holds
 * no saving: only ceilings and counts, never a forecast (Principle
 * no-model-merges; F154-FR-019 first case = the recorded read of 153's
 * 28 groups). The trial runs through the stub engine; no model is called.
 *
 * The record is written into a temporary directory: the owner's own record
 * under `specs/154-concurrency-and-parallelism/trials/` is produced by the
 * trial run itself (T044) and this test never overwrites it.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const REPO = join(import.meta.dirname, "../../../..");
const SCRIPT = join(REPO, "scripts/trial.mjs");
const FIXTURES = join(
  REPO,
  "specs/154-concurrency-and-parallelism/contracts/fixtures-154.json",
);

test("T043 the trial writes a record whose pass mark is stated, with no saving", () => {
  const out = mkdtempSync(join(tmpdir(), "specstride-trial-test-154-"));
  try {
    const outcome = spawnSync(
      "node",
      [
        SCRIPT,
        "--switch", "loop.parallel.units",
        "--fixtures", FIXTURES,
        "--out", out,
      ],
      { cwd: REPO, encoding: "utf8", timeout: 10 * 60 * 1000 },
    );
    assert.equal(outcome.status, 0, `the trial exits 0:\n${outcome.stdout}\n${outcome.stderr}`);
    const file = join(out, "loop.parallel.units.json");
    assert.ok(existsSync(file), "the record of the switch exists");
    const text = readFileSync(file, "utf8");
    const record = JSON.parse(text) as Record<string, unknown>;

    // The schema of the record.
    assert.equal(record.schema, "specstride.trial/1");
    assert.equal(record.switch, "loop.parallel.units");
    assert.match(String(record.fixtureSet), /^\d+ fixtures of 154-concurrency-and-parallelism$/);

    // The first case is the recorded read of 153's 28 groups (F154-FR-019).
    const firstCase = record.firstCase as Record<string, unknown>;
    assert.equal(firstCase.name, "replay of 153's 28 groups");
    assert.equal(firstCase.groupsTotal, 28);
    assert.equal(firstCase.groupsKept, 0);

    // Two arms, the same seed: off, then only that switch on.
    const arms = record.arms as Record<string, unknown>[];
    assert.equal(arms.length, 2);
    assert.equal(arms[0]!["switchValue"], false);
    assert.equal(arms[1]!["switchValue"], true);
    assert.equal(arms[0]!["seed"], arms[1]!["seed"]);
    for (const arm of arms) {
      const rows = arm["rowsWithoutPassMark"] as Record<string, unknown>;
      assert.deepEqual(Object.keys(rows).sort(), [
        "costWithEveryPassCounted",
        "groupsKept",
        "groupsTotal",
        "refusalsPerReason",
      ]);
      const cost = rows["costWithEveryPassCounted"] as Record<string, unknown>;
      assert.deepEqual(Object.keys(cost).sort(), ["cycles", "passes", "tokensIn", "tokensOut"]);
    }

    // The pass mark is stated (TRI-1 ∧ TRI-2 ∧ TRI-3).
    assert.equal(record.pass, true, "the pass mark of the trial is stated");
    const ruleTests = record.ruleTests as { ruleId: string; passed: boolean }[];
    assert.ok(ruleTests.length > 0, "the rule tests are named");
    for (const ruleId of ["TRI-1", "TRI-2", "TRI-3"]) {
      const row = ruleTests.find((row) => row.ruleId === ruleId);
      assert.ok(row !== undefined, `${ruleId} is in the rule tests`);
      assert.equal(row!.passed, true);
    }
    assert.deepEqual(record.breachInvariantsFailed, []);
    assert.equal((record.closedSets as Record<string, unknown>)["exitCodesAreSubset"], true);
    assert.equal((record.closedSets as Record<string, unknown>)["stopReasonsAreSubset"], true);
    assert.equal((record.closedSets as Record<string, unknown>)["runStatesAreSubset"], true);

    // No saving anywhere (F154-FR-008): no saving word, no speed-up figure.
    assert.doesNotMatch(text, /saving/i);
    assert.doesNotMatch(text, /faster|speed-?up|×|percent faster/i);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
