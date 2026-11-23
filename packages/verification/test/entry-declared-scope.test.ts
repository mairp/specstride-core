/**
 * Phase 21 of feature 153 (the unplanned change disclosed in
 * GATE21-EVIDENCE.md) — the manifest entry reads the DECLARED reads and
 * writes of a command under the id the sources named
 * (`command.declaredId ?? command.id`, derive.ts `entryOf`), because the
 * launch contract records `configuration.scopes` under the DECLARED id
 * (F105-FR-020) while the plan carries a derived id beside it.
 *
 * Pure unit test: no file system, no launch.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { entryOf, type PinPort } from "../src/manifest/derive.ts";
import type { LaunchContractScopes } from "../src/sources/scopes.ts";
import type { PlanCommand } from "../src/plan/record.ts";

const pin: PinPort = (command) => ({ id: command.id });

const command: PlanCommand = {
  id: "SUITE-phase-1-cmd-verify-checks",
  kind: "declared",
  label: "verify-checks",
  executable: "node",
  args: ["-e", "process.exit(0)"],
  cwd: ".",
  timeoutSec: 30,
  declaredId: "verify-checks",
};

const scopes: LaunchContractScopes = {
  verificationCommands: {
    "verify-checks": {
      reads: ["src/**"],
      writes: ["out/**"],
      source: "user-configuration",
    },
  },
};

test("the entry reads the declaration under the DECLARED id, not the derived one", () => {
  const entry = entryOf({ command, pin, scopes });
  assert.deepEqual(entry.reads, ["src/**"], "the declared reads entered");
  assert.deepEqual(entry.writes, ["out/**"], "the declared writes entered");
});

test("without a declared id the lookup falls back to the plan id", () => {
  const undeclared: PlanCommand = { ...command, declaredId: undefined };
  const entry = entryOf({ command: undeclared, pin, scopes });
  assert.equal(entry.reads === undefined, true, "no reads under the derived id");
  assert.equal(entry.writes === undefined, true, "no writes under the derived id");

  const byPlanId: LaunchContractScopes = {
    verificationCommands: {
      [undeclared.id]: { reads: ["a/**"], source: "user-configuration" },
    },
  };
  const plain = entryOf({ command: undeclared, pin, scopes: byPlanId });
  assert.deepEqual(plain.reads, ["a/**"], "the plan id is the key when no declared id exists");
});
