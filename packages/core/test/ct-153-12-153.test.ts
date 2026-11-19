/**
 * Feature 153, T238 and T239 — the four rows of the closing-check skip
 * decision (F153-FR-012, US1b "a closing check equal to the gate runs once").
 *
 * The unit is `closingCheckSkipOf`
 * (`../src/gate/closing-check-skip.ts`), the pure decision of whether the
 * closing check of the micro loop may stand down because the gate that
 * runs next will execute the same commands through the same runner on the
 * same tree. It has exactly four rows, decided in this order:
 *
 * - CS-1 — the switch is off: the check runs, nothing ever stands down.
 * - CS-2 — a command id or an argument list differs, or the runner
 *   differs: the gate would not run the same check.
 * - CS-3 — the tree fingerprints differ, or one of them is empty: the
 *   gate would not run on the tree the check stands on.
 * - CS-4 — otherwise: the same check through the same runner on the same
 *   tree, and the check skips.
 *
 * The rows are ordered: an earlier row wins over a later one, so an input
 * that matches several rows is decided by the first. The property case
 * (T239) states the whole truth at once: the choice is `skip` only when the
 * two command lists are equal element by element and the two fingerprints
 * are equal and non-empty.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  closingCheckSkipOf,
  CLOSING_CHECK_SKIP_TABLE,
  CS_1,
  CS_2,
  CS_3,
  CS_4,
  type ClosingCheckCommand,
  type ClosingCheckSkipInput,
} from "../src/gate/closing-check-skip.ts";

/** One command of a set, derived from a seed so no pair repeats. */
const commandOf = (seed: number, salt: string): ClosingCheckCommand => ({
  id: `cmd-${String(seed)}`,
  argv: [`--seed=${createHash("sha256").update(`${salt}:${String(seed)}`).digest("hex").slice(0, 12)}`],
});

/** An input where everything matches: the only row that can fire is CS-4. */
function matching(overrides: {
  readonly switchOn?: boolean;
  readonly closing?: Partial<{
    readonly commands: readonly ClosingCheckCommand[];
    readonly runner: string;
    readonly tree: string;
  }>;
  readonly gate?: Partial<{
    readonly commands: readonly ClosingCheckCommand[];
    readonly runner: string;
    readonly tree: string;
  }>;
} = {}): ClosingCheckSkipInput {
  const closing = {
    commands: [commandOf(1, "closing")],
    runner: "runtime",
    tree: "a1b2c3d4",
    ...overrides.closing,
  };
  const gate = {
    commands: [commandOf(1, "closing")],
    runner: "runtime",
    tree: "a1b2c3d4",
    ...overrides.gate,
  };
  return { switchOn: overrides.switchOn ?? true, closing, gate };
}

test("CS-1 — the switch off runs the check, however well the rest matches", () => {
  // The switch alone decides this row: every other signal may agree.
  assert.deepEqual(closingCheckSkipOf(matching({ switchOn: false })), {
    choice: "run",
    ruleId: CS_1,
  });
  // The switch off wins even when nothing else matches either.
  assert.deepEqual(
    closingCheckSkipOf(
      matching({
        switchOn: false,
        closing: { commands: [commandOf(9, "other")] },
        gate: { tree: "ffffffff" },
      }),
    ),
    { choice: "run", ruleId: CS_1 },
  );
});

test("CS-2 — a differing command id, argument list or runner runs the check", () => {
  // A command id differs.
  assert.deepEqual(
    closingCheckSkipOf(
      matching({ closing: { commands: [commandOf(2, "closing")] } }),
    ),
    { choice: "run", ruleId: CS_2 },
  );
  // An argument list differs.
  assert.deepEqual(
    closingCheckSkipOf(matching({ gate: { commands: [commandOf(1, "gate")] } })),
    { choice: "run", ruleId: CS_2 },
  );
  // The set size differs.
  assert.deepEqual(
    closingCheckSkipOf(
      matching({
        closing: { commands: [commandOf(1, "closing"), commandOf(2, "closing")] },
      }),
    ),
    { choice: "run", ruleId: CS_2 },
  );
  // The runner differs.
  assert.deepEqual(closingCheckSkipOf(matching({ closing: { runner: "shell" } })), {
    choice: "run",
    ruleId: CS_2,
  });
  // CS-2 wins over CS-3: a differing runner decides even on differing trees.
  assert.deepEqual(
    closingCheckSkipOf(
      matching({ closing: { runner: "shell", tree: "bbbbbbbb" } }),
    ),
    { choice: "run", ruleId: CS_2 },
  );
});

test("CS-3 — differing tree fingerprints, or an empty one, run the check", () => {
  // The fingerprints differ.
  assert.deepEqual(closingCheckSkipOf(matching({ gate: { tree: "d4e5f6a7" } })), {
    choice: "run",
    ruleId: CS_3,
  });
  // One of them is empty: an empty fingerprint binds no tree.
  assert.deepEqual(closingCheckSkipOf(matching({ gate: { tree: "" } })), {
    choice: "run",
    ruleId: CS_3,
  });
  assert.deepEqual(closingCheckSkipOf(matching({ closing: { tree: "" } })), {
    choice: "run",
    ruleId: CS_3,
  });
});

test("CS-4 — the same check through the same runner on an equal tree skips", () => {
  assert.deepEqual(closingCheckSkipOf(matching()), {
    choice: "skip",
    ruleId: CS_4,
  });
});

test("T239 any difference means run — the property over 200 seeded pairs", () => {
  // A deterministic linear congruential generator: every run of the test
  // walks the same 200 pairs.
  let state = 0x2f6a88c1;
  const next = (mod: number): number => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state % mod;
  };

  for (let pair = 0; pair < 200; pair += 1) {
    const sameCommands = next(4) !== 0;
    const sameRunner = next(4) !== 0;
    const sameTree = next(4) !== 0;
    const emptyTree = !sameTree && next(3) === 0;
    const switchOn = next(6) !== 0;

    const tree = `tree-${String(next(1 << 20)).padStart(8, "0")}`;
    const otherTree = emptyTree ? "" : `tree-${String(next(1 << 20)).padStart(8, "0")}`;
    const closingCommands: readonly ClosingCheckCommand[] = [commandOf(next(8), "closing")];
    const gateCommands = sameCommands
      ? closingCommands
      : [commandOf(next(8), "gate")];
    const input: ClosingCheckSkipInput = {
      switchOn,
      closing: {
        commands: closingCommands,
        runner: sameRunner ? "runtime" : "shell",
        tree: sameTree ? tree : otherTree,
      },
      gate: {
        commands: gateCommands,
        runner: "runtime",
        tree: sameTree ? tree : (emptyTree ? "" : otherTree),
      },
    };
    const decision = closingCheckSkipOf(input);

    const commandsEqual =
      input.closing.commands.length === input.gate.commands.length &&
      input.closing.commands.every((command, at) => {
        const other = input.gate.commands[at];
        return (
          other !== undefined &&
          command.id === other.id &&
          command.argv.join("\u0000") === other.argv.join("\u0000")
        );
      });
    const treesEqual =
      input.closing.tree !== "" && input.gate.tree !== "" && input.closing.tree === input.gate.tree;
    const everythingEqual = switchOn && commandsEqual && sameRunner && treesEqual;

    assert.equal(
      decision.choice,
      everythingEqual ? "skip" : "run",
      `pair ${String(pair)}: ${JSON.stringify(decision)} for ${JSON.stringify(input)}`,
    );
    assert.equal(decision.ruleId, everythingEqual ? CS_4 : decision.ruleId);
    assert.ok(
      decision.ruleId === CS_1 ||
        decision.ruleId === CS_2 ||
        decision.ruleId === CS_3 ||
        decision.ruleId === CS_4,
      `the rule id is one of the four rows: ${decision.ruleId}`,
    );
    if (!everythingEqual && switchOn && commandsEqual && sameRunner && !treesEqual) {
      assert.equal(decision.ruleId, CS_3, `pair ${String(pair)}: only CS-3 runs a tree difference`);
    }
  }
});

test("T237 the contract file is this table", () => {
  // The contract file of T237 lives under the checkout's specs/ directory
  // (two levels above this package); it is the same table as the constant,
  // in the same shape — no translation step. Where the checkout carries no
  // contract file, the equality cannot be checked and the case skips with
  // its reason (missing prerequisites are skips, never passes).
  const contractPath = new URL(
    "../../../specs/153-loop-feedback-speed/contracts/closing-check-skip-table.json",
    import.meta.url,
  );
  if (!existsSync(fileURLToPath(contractPath))) {
    test.skip(`the contract file is absent at ${fileURLToPath(contractPath)}`);
    return;
  }
  const contract: unknown = JSON.parse(readFileSync(fileURLToPath(contractPath), "utf8"));
  // Field-by-field equality: schema, id, version, the point's signals and
  // choices, and every row's ruleId, predicate and choice.
  assert.deepEqual(contract, JSON.parse(JSON.stringify(CLOSING_CHECK_SKIP_TABLE)));
  const point = (contract as typeof CLOSING_CHECK_SKIP_TABLE).points["closing-check-skip"];
  assert.deepEqual(Object.keys(point.signals), [
    "switchOn",
    "commandDiffers",
    "runnerDiffers",
    "treeFingerprintDiffers",
  ]);
  assert.deepEqual(point.choices, ["run", "skip"]);
  assert.deepEqual(
    (contract as typeof CLOSING_CHECK_SKIP_TABLE).rows["closing-check-skip"].map((r) => r.ruleId),
    [CS_1, CS_2, CS_3, CS_4],
  );
});
