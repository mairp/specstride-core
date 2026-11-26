/**
 * T121 — the landing rule LD-1…LD-4 over the pure table (F154-FR-050):
 * `landingDecisionOf` is a pure lookup over `LANDING_TABLE` that matches it
 * exhaustively — every combination of a landing record (absent, half-landed
 * without a fast-forward, fast-forwarded), a clean or conflicted rebase and
 * a green or red gate decides as the table's rows say, in the table's
 * order, with the rule id of the row that fired.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { landingDecisionOf, LANDING_POINT } from "../src/landing/landing-rule.ts";
import { LANDING_TABLE } from "../src/landing/tables.ts";
import type { LandingRecordShape } from "../src/landing/landing-rule.ts";

/** A half-landed record: written, no fast-forward yet (LD-4's resume). */
const HALF_LANDED = { schema: "specstride.landing/1", fastForward: false } as const;
/** A fast-forwarded record: the landing already reached LD-1. */
const FAST_FORWARDED = { schema: "specstride.landing/1", fastForward: true } as const;

const RECORDS: Array<LandingRecordShape | null> = [null, FAST_FORWARDED];

/**
 * An independent reading of the table's rows (its `and`/`equal` ops, in
 * the file's order), so the test pins the lookup to the bytes on disk
 * rather than to itself.
 */
type TableClause = { op: string; of?: TableClause[]; signal?: string; value?: unknown };
type TableRow = { ruleId: string; choice: string; when?: TableClause };

function expectedOf(table: unknown, signals: Record<string, unknown>): string {
  const rows = Object.values((table as { rows: Record<string, TableRow[]> }).rows).flat();
  const fired = rows.find((row) => matches(row.when, signals));
  return fired !== undefined ? fired.ruleId : "(none)";
}

function matches(when: TableClause | undefined, signals: Record<string, unknown>): boolean {
  if (when === undefined) return true; // LD-1's fallthrough
  if (when.op === "and") return (when.of ?? []).every((clause) => matches(clause, signals));
  if (when.op === "equal") return signals[when.signal ?? ""] === when.value;
  throw new Error(`unknown op ${when.op}`);
}

function signalsOf(record: unknown, rebaseClean: boolean, gateGreen: boolean) {
  return {
    landingRecordExists: record !== null,
    fastForwarded: (record as { fastForward?: boolean } | null)?.fastForward === true,
    rebaseClean,
    gateGreen,
  };
}

test("LD-1 — a clean rebase and a green gate fast-forward", () => {
  // With no record yet, the fresh landing reaches the fallthrough row.
  const decision = landingDecisionOf(null, true, true);
  assert.equal(decision.choice, "fast-forward");
  assert.equal(decision.ruleId, "LD-1");
  assert.equal(LANDING_POINT, "pipeline.landing");
});

test("LD-2 — a rebase conflict parks, whatever else was observed", () => {
  for (const record of RECORDS) {
    if ((record as { fastForward?: boolean } | null)?.fastForward === true) continue; // LD-4 does not fire
    const decision = landingDecisionOf(record, false, true);
    assert.equal(decision.choice, "park", `record ${JSON.stringify(record)}`);
    assert.equal(decision.ruleId, "LD-2", `record ${JSON.stringify(record)}`);
  }
});

test("LD-3 — a red gate parks a clean rebase", () => {
  for (const record of RECORDS) {
    if ((record as { fastForward?: boolean } | null)?.fastForward === true) continue;
    const decision = landingDecisionOf(record, true, false);
    assert.equal(decision.choice, "park", `record ${JSON.stringify(record)}`);
    assert.equal(decision.ruleId, "LD-3", `record ${JSON.stringify(record)}`);
  }
});

test("LD-4 — a landing record without a fast-forward resumes at the rebase", () => {
  const decision = landingDecisionOf(HALF_LANDED, true, true);
  assert.equal(decision.choice, "rebase");
  assert.equal(decision.ruleId, "LD-4");
  // A fast-forwarded record does not resume: the table's LD-4 clause misses.
  assert.equal(landingDecisionOf(FAST_FORWARDED, true, true).ruleId, "LD-1");
});

test("exhaustive — every observation decides as LANDING_TABLE's rows, in order", () => {
  for (const record of RECORDS) {
    for (const rebaseClean of [true, false]) {
      for (const gateGreen of [true, false]) {
        const decision = landingDecisionOf(record, rebaseClean, gateGreen);
        const expected = expectedOf(LANDING_TABLE, signalsOf(record, rebaseClean, gateGreen));
        assert.equal(
          decision.ruleId,
          expected,
          `record=${JSON.stringify(record)} rebaseClean=${rebaseClean} gateGreen=${gateGreen}`,
        );
        const row = Object.values(LANDING_TABLE.rows as Record<string, TableRow[]>)
          .flat()
          .find((r) => r.ruleId === expected);
        assert.ok(row !== undefined, `row ${expected} is in the table`);
        assert.equal(decision.choice, row.choice, `choice of ${expected}`);
      }
    }
  }
});

test("resilience — an incomplete or unreadable record reads as no fast-forward", () => {
  // An initial record without the fastForward field, and junk, must not
  // throw: they read like a half-landed record (LD-4) or absent.
  assert.equal(landingDecisionOf({}, true, true).ruleId, "LD-4");
  assert.equal(
    landingDecisionOf({ fastForward: null } as unknown as LandingRecordShape, true, true).ruleId,
    "LD-4",
  );
  assert.equal(landingDecisionOf(null, true, true).ruleId, "LD-1");
});

test("purity — the same observation gives the same decision", () => {
  const a = landingDecisionOf(HALF_LANDED, false, true);
  const b = landingDecisionOf(HALF_LANDED, false, true);
  assert.deepEqual({ choice: a.choice, ruleId: a.ruleId }, {
    choice: b.choice,
    ruleId: b.ruleId,
  });
});
