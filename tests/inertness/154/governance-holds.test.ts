/**
 * T164 — GOVERNANCE HOLDS WITH EVERY SWITCH ON (F154-FR-006).
 *
 * The baseline governance test (`governance.test.ts`, T016) measures the
 * invariant with every switch off. This one measures it where the feature
 * could disturb it: the stub engine runs with every spec-154 switch (eight)
 * ON (the catalogue's environment names, the house form of
 * `closed-sets-154.test.ts`), over every Phase 1 fixture directory, and the
 * run must show that governance stayed as it is:
 *
 * - ONE critic call per phase, in a FRESH session (its session id is its
 *   own, never a proposer's, and no second critic-class call exists);
 * - the verdict is bound to the nonce the engine minted: the prompt carries
 *   `VERDICT <nonce>`, and the approval record's `nonceHash` is
 *   `nonceHashOf` of exactly that nonce (`ep18/critic-strategy.ts:284`);
 * - ONE signed approval record stands per approved phase (`sig` present —
 *   the HMAC over every field above it, `approval/record.ts:290`);
 * - ONE commit per approved phase in the workspace's git history.
 *
 * No behaviour of spec 154 may add a critic call, an approval record or a
 * commit (the invariant the switch-off baseline already holds). Run:
 *     node --experimental-strip-types --test tests/inertness/154/governance-holds.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

import { nonceHashOf } from "../../../packages/core/src/ep18/critic-strategy.ts";
import { fixture154 } from "./helpers.ts";

/** The catalogue's environment names of the spec-154 switches, set to `on`. */
const SWITCHES_ON: readonly string[] = Object.freeze([
  "SPECSTRIDE_LOOP_PHASES_PARALLEL",
  "SPECSTRIDE_LOOP_SPECULATE",
  "SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS",
  "SPECSTRIDE_LOOP_PARALLEL_GROUP_CHECK",
  "SPECSTRIDE_LOOP_PARALLEL_NO_REPEAT",
  "SPECSTRIDE_LOOP_PARALLEL_MERGE_BASELINE",
  "SPECSTRIDE_HOST_LIMITS",
  "SPECSTRIDE_PIPELINE_STAGE_GROUPS",
]);

/** The fixture directories Phase 1 (T011) wrote under `tests/fixtures/154/`. */
const FIXTURE_DIRS = ["plan", "groups", "slots", "stages", "phases", "spec"] as const;

test("T164 with every switch on: one fresh-session critic per phase, a nonce-bound verdict, one signed approval, one commit", async () => {
  for (const dir of FIXTURE_DIRS) {
    const tasksFile = join(import.meta.dirname, "../../fixtures/154", dir, "tasks.md");
    assert.ok(existsSync(tasksFile), `the fixture ${dir} holds its tasks.md`);
    const f = fixture154();
    const names = [...SWITCHES_ON];
    const before = names.map((n) => process.env[n]);
    try {
      // The fixture's own task list, and every switch of spec 154 on
      // (`SPECSTRIDE_LIMITS=on`, `host.limits`, the helpers already set).
      writeFileSync(join(f.work, "specs", "001-one", "tasks.md"), readFileSync(tasksFile, "utf8"));
      for (const name of names) process.env[name] = "on";
      const exit = await f.run();
      assert.equal(exit, 0, `the engine run over ${dir} (switches on) exits 0`);

      // — ONE critic call per phase, in a FRESH session (F154-FR-006).
      // The phase count comes from the fixture's own tasks.md: one
      // `## Phase` heading per phase.
      const phasesOfTheFixture = readFileSync(tasksFile, "utf8")
        .split("\n")
        .filter((line) => /^## Phase \d/.test(line)).length;
      assert.ok(phasesOfTheFixture >= 1, `${dir}: the fixture holds at least one phase`);
      const calls = f.prompts();
      const critics = calls.filter((record) => record.role === "critic");
      assert.equal(
        critics.length,
        phasesOfTheFixture,
        `${dir}: one critic call per phase (${String(phasesOfTheFixture)}), saw ${String(critics.length)}`,
      );
      // Each critic call judges its own phase, once.
      const judgedPhases = critics.map(
        (record) => /critic\. You judge whether phase (\d+)/.exec(record.prompt)?.[1],
      );
      assert.deepEqual(
        [...judgedPhases].sort(),
        Array.from({ length: phasesOfTheFixture }, (_, i) => String(i + 1)).sort(),
        `${dir}: each phase was judged exactly once`,
      );
      const proposerSessions = new Set(
        calls.filter((r) => r.role !== "critic").map((r) => r.session),
      );
      for (const critic of critics) {
        assert.ok(
          !proposerSessions.has(critic.session),
          `${dir}: every critic session is fresh, never a proposer's session`,
        );
      }
      // — ONE signed approval record per approved phase, each nonceHash the
      //   hash of THAT phase's verdict nonce.
      const approvals = join(f.control, "features", "001-one", "approvals");
      assert.ok(existsSync(approvals), `${dir}: the gate's approval records exist`);
      const files = readdirSync(approvals).sort();
      assert.deepEqual(
        files,
        Array.from({ length: phasesOfTheFixture }, (_, i) => `phase-${i + 1}.json`),
        `${dir}: one approval record per phase`,
      );
      for (const [index, file] of files.entries()) {
        const record = JSON.parse(readFileSync(join(approvals, file), "utf8")) as {
          schema?: string;
          nonceHash?: string;
          sig?: string;
        };
        assert.match(String(record.schema), /approval/, `${dir}: ${file} is an approval record`);
        const phaseCritic = critics[index]!;
        const phaseNonce = /VERDICT ([0-9a-f]{16}): APPROVED/.exec(phaseCritic.prompt)?.[1];
        assert.ok(
          phaseNonce !== undefined,
          `${dir}: ${file} — the phase's gate prompt minted a nonce`,
        );
        assert.equal(
          record.nonceHash,
          nonceHashOf(phaseNonce),
          `${dir}: ${file}'s nonceHash binds the record to its verdict's nonce`,
        );
        assert.ok(
          typeof record.sig === "string" && record.sig.length > 0,
          `${dir}: ${file} is signed`,
        );
      }

      // — ONE commit per approved phase in the workspace's history.
      const log = spawnSync("git", ["-C", f.work, "rev-list", "--count", "HEAD"]);
      assert.equal(log.status, 0, `${dir}: git rev-list ran`);
      assert.equal(
        Number(log.stdout.toString().trim()),
        phasesOfTheFixture + 1,
        `${dir}: one commit per approved phase beyond the fixture's initial commit`,
      );
    } finally {
      for (const [index, name] of names.entries()) {
        const old = before[index];
        if (old === undefined) delete process.env[name];
        else process.env[name] = old;
      }
      f.restore();
    }
  }
});
