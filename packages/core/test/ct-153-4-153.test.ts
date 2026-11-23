/**
 * Feature 153, CT-153-4 — the guard of F153-FR-004 (T317): no closed set of
 * the engine was moved by the ready slices. Every closed set this feature
 * touches is pinned here against its owning data file or module, and the
 * pinned members are asserted equal — so a slice that added, removed or
 * renamed a member would fail this file before anything else runs.
 *
 * The sets and their owners:
 *   - the stop reasons (annex F; `data/stop-reasons.json`, the 16 literals);
 *   - the engine exit codes (annex D; `data/exit-codes.json`, the 8 codes);
 *   - the kinds of a phase attempt (annex E, §E.1; `ep/critic-strategy.ts`);
 *   - the blocked reasons (annex E, §E.2; `state/blocked-reasons.ts`);
 *   - the kill reasons (F118-FR-007; `codes/stop-reason-literals.ts`);
 *   - the check conditions (F148-FR-003; check-runner `result/closed-sets.ts`).
 *
 * Negative control: each pin is asserted against a literal that is NOT a
 * member, so an over-broad membership check cannot pass vacuously.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

import { readFileSync } from "node:fs";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO = join(HERE, "..", "..", "..");

// ---------------------------------------------------------------- the owners

import { ATTEMPT_KINDS } from "@specstride/contracts/ep/critic-strategy";
import { BLOCKED_REASONS } from "@specstride/contracts/state/blocked-reasons";
import { KILL_REASONS } from "@specstride/contracts/codes/stop-reason-literals";
import { RESULT_CONDITIONS } from "@specstride/check-runner";
import { STOP_REASONS } from "@specstride/contracts/codes/stop-reasons";

// ------------------------------------------------------------ the pin itself

const STOP_REASON_PIN = [
  "stop_flag",
  "wall_budget",
  "proposer_max_iter",
  "proposer_no_progress",
  "proposer_consecutive_errors",
  "proposer_yield_budget",
  "proposer_yield_timeout",
  "proposer_cap_exhausted",
  "proposer_no_evidence",
  "critic_config",
  "critic_unavailable",
  "gate_oscillation",
  "max_rejects",
  "release_verification",
  "paused_quota_ceiling",
  "commit_gate",
] as const;

const ENGINE_EXIT_CODE_PIN = [0, 1, 2, 3, 4, 5, 6, 70] as const;

const ATTEMPT_KIND_PIN = ["plain", "diagnosed", "accelerated", "bumped"] as const;

const BLOCKED_REASON_PIN = [
  "declared-block",
  "quota-credit",
  "auth",
  "budget-cap",
  "quota-wait-ceiling",
  "source-changed",
  "commit-gate",
] as const;

const KILL_REASON_PIN = ["idle_timeout", "repeat_stall", "progress_stall", "hard_cap"] as const;

const CHECK_CONDITION_PIN = ["tainted", "cached", "flaky", "interrupted", "unchecked"] as const;

test("T317 of feature 153 (F153-FR-004): no closed set moved — stop reasons", () => {
  const data = JSON.parse(
    readFileSync(join(REPO, "packages/contracts/data/stop-reasons.json"), "utf8"),
  ) as {
    stopReasons: { number: number; literal: string; engineExit: number }[];
  };
  const literals = data.stopReasons.map((row) => row.literal);
  assert.deepEqual(literals, STOP_REASON_PIN);
  // The module literal of the same annex agrees with the data file.
  assert.deepEqual([...STOP_REASONS], STOP_REASON_PIN);
  // The rows are numbered 1..16 in the annex order, without a gap.
  assert.deepEqual(
    data.stopReasons.map((row) => row.number),
    STOP_REASON_PIN.map((_, index) => index + 1),
  );
  // Negative control: a literal outside the set is absent.
  assert.ok(!literals.includes("budget_cap"));
});

test("T317 of feature 153 (F153-FR-004): no closed set moved — engine exit codes", () => {
  const data = JSON.parse(
    readFileSync(join(REPO, "packages/contracts/data/exit-codes.json"), "utf8"),
  ) as {
    engine: {
      process: string;
      rows: { Code: string; "Stop reasons": string }[];
    }[];
  };
  const rows = data.engine.find((group) => group.process === "Engine")?.rows ?? [];
  const codes = rows.map((row) => Number(row.Code)).sort((a, b) => a - b);
  assert.deepEqual(
    codes,
    [...ENGINE_EXIT_CODE_PIN].sort((a, b) => a - b),
  );
  // Every code maps at least the stop reasons of its meaning cell, except
  // the codes that carry no member (0, 5, 70).
  for (const row of rows) {
    if (row["Stop reasons"].trim() === "—") continue;
    const members = [...row["Stop reasons"].matchAll(/`([a-z_]+)`/g)].map((m) => m[1]);
    for (const member of members) {
      assert.ok(
        (STOP_REASON_PIN as readonly string[]).includes(member),
        `exit code ${row.Code} names the unknown stop reason ${member}`,
      );
    }
  }
  // Negative control: code 42 was never an engine exit code.
  assert.ok(!(codes as number[]).includes(42));
});

test("T317 of feature 153 (F153-FR-004): no closed set moved — attempt kinds (§E.1)", () => {
  assert.deepEqual([...ATTEMPT_KINDS], ATTEMPT_KIND_PIN);
  assert.ok(!(ATTEMPT_KINDS as readonly string[]).includes("escalated"));
});

test("T317 of feature 153 (F153-FR-004): no closed set moved — blocked reasons (§E.2)", () => {
  assert.deepEqual([...BLOCKED_REASONS], BLOCKED_REASON_PIN);
  assert.ok(!(BLOCKED_REASONS as readonly string[]).includes("quota"));
});

test("T317 of feature 153 (F153-FR-004): no closed set moved — kill reasons (F118-FR-007)", () => {
  assert.deepEqual([...KILL_REASONS], KILL_REASON_PIN);
  assert.ok(!(KILL_REASONS as readonly string[]).includes("wall_budget"));
});

test("T317 of feature 153 (F153-FR-004): no closed set moved — check conditions (F148-FR-003)", () => {
  assert.deepEqual([...RESULT_CONDITIONS], CHECK_CONDITION_PIN);
  assert.ok(!(RESULT_CONDITIONS as readonly string[]).includes("skipped"));
});
