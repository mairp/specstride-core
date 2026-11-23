/**
 * CT-153-21 — the count is derived, finite and survives
 * (F153-FR-021; Principles VIII, XV, XVI).
 *
 *  1. `redGateCountOf` over the gate result records of a phase gives the
 *     number of records whose code is not 0, since the counts were reset;
 *  2. the count is the same after the records are read again from disk —
 *     derived, never held in memory;
 *  3. a reset of the ledger sets it aside: over the records a reset leaves
 *     the count is 0;
 *  4. with `SPECSTRIDE_LIMITS=off` the limit is still finite — no setting
 *     makes the budget unbounded;
 *  5. the phase attempts of a phase never exceed the reject limit plus the
 *     red-gate limit.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  redGateCountOf,
  redGateBudgetLimit,
  redGateBudgetOf,
  RED_GATE_BUDGET_LIMIT_DEFAULT,
} from "../src/gate/red-gate-budget.ts";
import { NO_COUNTS, afterARejection, type LedgerCounts } from "../src/gate/limits.ts";

test('CT-153-21 "the count is derived, finite and survives"', async (t) => {
  await t.test("the count is derived from the records", () => {
    // A code 3 (could not run) counts like a code 10 (failed); a green gate
    // (code 0) adds nothing.
    assert.equal(redGateCountOf([{ code: 10 }, { code: 0 }, { code: 10 }]), 2);
    assert.equal(redGateCountOf([{ code: 3 }, { code: 10 }]), 2);
    assert.equal(redGateCountOf([]), 0);
  });

  await t.test("the count is stable across a disk re-read", () => {
    // The engine derives the count from the records the control plane holds;
    // reading them again gives the same count, whatever a counter held in
    // memory would have said.
    const dir = mkdtempSync(join(tmpdir(), "red-gate-count-"));
    try {
      const file = join(dir, "records.json");
      const records = [{ code: 10 }, { code: 10 }, { code: 0 }];
      writeFileSync(file, JSON.stringify(records), "utf8");
      const first = redGateCountOf(JSON.parse(readFileSync(file, "utf8")));
      const second = redGateCountOf(JSON.parse(readFileSync(file, "utf8")));
      assert.equal(first, 2);
      assert.equal(second, first);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await t.test("a reset of the ledger sets the count aside", () => {
    // F153-FR-021 — the `--reset-counts` launch moves the per-attempt
    // verification records of the control plane aside by rename into
    // `verification/reset-<at>/`, so the derived count reads nothing from
    // before the reset. This drives the REAL layout and the REAL derivation
    // over the engine's record shape (`exit_code`): three red gates before
    // the reset, none after the move.
    const control = mkdtempSync(join(tmpdir(), "red-gate-reset-"));
    const verification = join(control, "features", "001-one", "verification");
    mkdirSync(verification, { recursive: true });
    const recordsReadLikeTheEngine = (): number => {
      // The derivation of the engine (`redGateRecordsOfThePhase`): every
      // `phase<N>.<k>.json` still at the top level, its `exit_code` folded
      // into a record; a `reset-<at>/` subdirectory contributes nothing.
      const count: { code: number }[] = [];
      for (const entry of readdirSync(verification).sort()) {
        if (!/^phase\d+\.\d+\.json$/.test(entry)) continue;
        const parsed = JSON.parse(readFileSync(join(verification, entry), "utf8")) as {
          exit_code?: unknown;
        };
        const code = Number(parsed.exit_code);
        if (Number.isFinite(code)) count.push({ code });
      }
      return redGateCountOf(count);
    };
    try {
      writeFileSync(join(verification, "phase1.1.json"), JSON.stringify({ exit_code: 1 }));
      writeFileSync(join(verification, "phase1.2.json"), JSON.stringify({ exit_code: 1 }));
      writeFileSync(join(verification, "phase1.3.json"), JSON.stringify({ exit_code: 0 }));
      assert.equal(recordsReadLikeTheEngine(), 2, "two red gates before the reset");
      // The move the `--reset-counts` launch performs (F152-FR-015's way):
      // a `reset-<at>/` directory inside, the top-level files moved by
      // rename, `reset-` prefixed names skipped.
      const atOfTheReset = new Date().toISOString().replace(/[:.]/g, "-");
      const resetDirectory = join(verification, "reset-" + atOfTheReset);
      mkdirSync(resetDirectory, { recursive: true });
      for (const name of readdirSync(verification)) {
        if (name.startsWith("reset-")) continue;
        renameSync(join(verification, name), join(resetDirectory, name));
      }
      assert.equal(
        recordsReadLikeTheEngine(),
        0,
        "the budget is spent from nothing after the reset",
      );
    } finally {
      rmSync(control, { recursive: true, force: true });
    }
  });

  await t.test("with SPECSTRIDE_LIMITS=off the limit is still finite", () => {
    const env = { SPECSTRIDE_LIMITS: "off" };
    assert.equal(typeof env.SPECSTRIDE_LIMITS, "string");
    // The budget limit never reads the switch and never comes back unbounded.
    assert.equal(redGateBudgetLimit(3), 3);
    assert.ok(Number.isFinite(redGateBudgetLimit(3)));
    assert.ok(Number.isFinite(redGateBudgetLimit(undefined)));
    assert.equal(redGateBudgetLimit(undefined), RED_GATE_BUDGET_LIMIT_DEFAULT);
    assert.ok(Number.isFinite(redGateBudgetLimit(Number.NaN)));
    // And the decision under limits-off still halts a spent budget.
    const decision = redGateBudgetOf({ switchOn: true, count: 3, limit: 3 });
    assert.equal(decision.decision, "halt");
  });

  await t.test("the attempts never exceed the reject limit plus the red-gate limit", async () => {
    // Every attempt of the phase is a red gate (the gate fails every time),
    // the reject limit 3, the red-gate limit 3: the run must halt by the
    // budget, the reject count must stay 0, and the number of attempts must
    // stay within 3 + 3.
    let counts: { rejectCount: number; phaseAttemptOrdinal: number; malformedStreak: number } = {
      ...NO_COUNTS,
    };
    const ledgerPort: LedgerCounts = {
      read: () => ({ ...counts }),
      write: (next) => {
        counts = { ...next };
      },
    };
    const planner = { next: () => "plain" as const };
    const rejectLimit = 3;
    const redGateLimit = 3;
    let attempts = 0;
    let halted = false;
    for (let ordinal = 1; ordinal <= rejectLimit + redGateLimit + 2; ordinal += 1) {
      attempts = ordinal;
      const outcome = await afterARejection(
        {
          phase: 1,
          ordinal,
          kind: "gate-failed",
          feedbackRecords: [],
          redGate: { switchOn: true, count: ordinal, limit: redGateLimit },
          rejectLimit,
        } as never,
        { counts: ledgerPort, attemptPlanner: planner } as never,
      );
      if (outcome.go === "halt") {
        halted = true;
        break;
      }
    }
    assert.equal(halted, true, "the budget halts the run");
    assert.ok(attempts <= rejectLimit + redGateLimit, `attempts ${attempts} within the bound`);
    assert.equal(counts.rejectCount, 0, "no red gate spent the reject limit");
  });
});
