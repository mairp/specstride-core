/**
 * T240, T241 — the pure equality test of the closing check against the gate
 * (feature 153, F153-FR-012): with the switch
 * `loop.micro.closingCheck.skipWhenEqualToGate` on, a closing check whose
 * command set, runner and tree are the gate's own SKIPS — the gate runs the
 * same commands on the same tree moments later, so running the check twice
 * spends a cycle for nothing (F153-SC-004, first half).
 *
 * The decision is made by the rule table `closing-check.skip`
 * (`specs/153-loop-feedback-speed/contracts/closing-check-skip-table.json`,
 * task T237), never guessed at the call site: rows CS-1 to CS-4 of plan.md
 * ("Rule-id sets fixed by this plan"), in that order; the first row that
 * matches decides.
 *
 * ## The constant and the contract file are the same table
 *
 * The constant below and the contract file hold the same predicates in the
 * same shape — `{op, signal, value}` leaves and `{op, of}` combinators, the
 * form `loadTable` of `@specstride/kernel` reads. There is no translation
 * step, and the equality is asserted by a test
 * (`../test/ct-153-12-153.test.ts`, case "T237 the contract file is this
 * table"), which loads the contract file from the checkout and compares it
 * to the constant field by field; where the checkout carries no contract
 * file the test skips with its reason. The constant is loaded through
 * `loadTable` on every decision, so a table that fails the load fails at
 * load, never mid-run.
 *
 * ## What the table does not see
 *
 * The `parity` profile is folded into the switch before this module runs:
 * `loopConfigurationOf` reads `loop.micro.closingCheck.skipWhenEqualToGate`
 * off under `profile: parity` (row 136 of annex X §X.7), so the parity
 * branch of CS-1 of plan.md arrives here as `switchOn: false` and the
 * behaviour is exactly the pre-feature one — both checks run.
 */
import { evaluateTable, loadTable, type LoadedTable } from "@specstride/kernel";

/** One command of a check set, as the manifest and the plan hold it. */
export type ClosingCheckCommand = {
  readonly id: string;
  readonly argv: readonly string[];
};

/** One bound check: its command set, the runner that runs it, and its tree. */
export type ClosingCheckSide = {
  readonly commands: readonly ClosingCheckCommand[];
  readonly runner: string;
  readonly tree: string;
};

/**
 * What the caller gives the table: whether the switch is on (already
 * profile-folded — under `profile: parity` it reads off), the closing check
 * as it stands, and the binding of the gate that runs next.
 */
export type ClosingCheckSkipInput = {
  readonly switchOn: boolean;
  readonly closing: ClosingCheckSide;
  readonly gate: ClosingCheckSide;
};

/** What the table decided: the choice, and the rule that decided it. */
export type ClosingCheckSkipDecision = {
  /** `run` — the closing check runs as before; `skip` — it stands down. */
  readonly choice: "run" | "skip";
  /** The rule id of the row that fired. */
  readonly ruleId: string;
};

/** The id of the table, recorded with every decision (F100-FR-204). */
export const CLOSING_CHECK_SKIP_TABLE_ID = "closing-check.skip" as const;

/** The version of the table, recorded with every decision (F100-FR-204). */
export const CLOSING_CHECK_SKIP_TABLE_VERSION = "1.0.0" as const;

/** The one decision point of the table. */
export const CLOSING_CHECK_SKIP_POINT = "closing-check-skip" as const;

/** The rule id of the row for a switch that is off, or parity (CS-1). */
export const CS_1 = "CS-1" as const;
/** The rule id of the row for a differing command set or runner (CS-2). */
export const CS_2 = "CS-2" as const;
/** The rule id of the row for differing, or empty, tree fingerprints (CS-3). */
export const CS_3 = "CS-3" as const;
/** The rule id of the default row: the same check through the same runner on the same tree (CS-4). */
export const CS_4 = "CS-4" as const;

/** The rule ids of the table, in row order. */
export const CLOSING_CHECK_SKIP_RULES = Object.freeze([CS_1, CS_2, CS_3, CS_4]);

/** A leaf or a combinator of a predicate, in the leaf form of annex X §X.3. */
export type ClosingCheckSkipPredicate = {
  readonly op: string;
  readonly signal?: string;
  readonly value?: unknown;
  readonly of?: readonly ClosingCheckSkipPredicate[];
};

/** One row of the table: the rule id, the predicate (absent in the default row), the choice. */
export type ClosingCheckSkipTableRow = {
  readonly ruleId: string;
  readonly when?: ClosingCheckSkipPredicate;
  readonly choice: string;
};

/** The table, in the shape `specstride.table/1` gives (annex X §X.3). */
export type ClosingCheckSkipTable = {
  readonly schema: string;
  readonly id: string;
  readonly version: string;
  readonly points: {
    readonly "closing-check-skip": {
      readonly signals: Readonly<Record<string, string>>;
      readonly choices: readonly string[];
    };
  };
  readonly rows: {
    readonly "closing-check-skip": readonly ClosingCheckSkipTableRow[];
  };
};

/** Freeze a value and everything it holds, so that no reader can change the table. */
function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  for (const key of Object.getOwnPropertyNames(value)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}

/**
 * The rule table of the closing check's equality test, frozen through and
 * through. Equal to
 * `specs/153-loop-feedback-speed/contracts/closing-check-skip-table.json`,
 * with the leaf form of annex X §X.3 that the load check of the kernel reads.
 */
export const CLOSING_CHECK_SKIP_TABLE: ClosingCheckSkipTable = deepFreeze({
  schema: "specstride.table/1",
  id: CLOSING_CHECK_SKIP_TABLE_ID,
  version: CLOSING_CHECK_SKIP_TABLE_VERSION,
  points: {
    "closing-check-skip": {
      signals: {
        switchOn: "boolean",
        commandDiffers: "boolean",
        runnerDiffers: "boolean",
        treeFingerprintDiffers: "boolean",
      },
      choices: ["run", "skip"],
    },
  },
  rows: {
    "closing-check-skip": [
      {
        // CS-1 — the switch is off: nothing is skipped, the closing check
        // runs exactly as it did before the feature. The `parity` profile
        // arrives here too, folded into the switch (module header).
        ruleId: CS_1,
        when: { op: "equal", signal: "switchOn", value: false },
        choice: "run",
      },
      {
        // CS-2 — the command sets differ (an id or an argument list), or the
        // runner differs: the closing check is not the gate's check.
        ruleId: CS_2,
        when: {
          op: "or",
          of: [
            { op: "equal", signal: "commandDiffers", value: true },
            { op: "equal", signal: "runnerDiffers", value: true },
          ],
        },
        choice: "run",
      },
      {
        // CS-3 — the tree fingerprints differ, or one is empty: an empty
        // fingerprint binds no tree, so equality cannot be claimed.
        ruleId: CS_3,
        when: { op: "equal", signal: "treeFingerprintDiffers", value: true },
        choice: "run",
      },
      // CS-4 — the default row (F100-FR-204): the same check through the
      // same runner on the same tree. Its choice is the one skip of the
      // table.
      { ruleId: CS_4, choice: "skip" },
    ],
  },
});

const LOADED: LoadedTable = loadTable(CLOSING_CHECK_SKIP_TABLE);

/** Two command sets are the same check only when they match element by element. */
const commandsDiffer = (
  a: readonly ClosingCheckCommand[],
  b: readonly ClosingCheckCommand[],
): boolean =>
  a.length !== b.length ||
  a.some((command, at) => {
    const other = b[at];
    return (
      other === undefined ||
      command.id !== other.id ||
      command.argv.join("\u0000") !== other.argv.join("\u0000")
    );
  });

/** Two fingerprints bind the same tree only when both are held and equal. */
const fingerprintsDiffer = (a: string, b: string): boolean => a === "" || b === "" || a !== b;

/**
 * The decision of the table at one closing check: rows CS-1 to CS-4, in
 * order, the first match decides, the default row skips. Pure: no I/O, no
 * clock, no randomness, no model.
 */
export function closingCheckSkipOf(input: ClosingCheckSkipInput): ClosingCheckSkipDecision {
  const decision = evaluateTable(LOADED, CLOSING_CHECK_SKIP_POINT, {
    switchOn: input.switchOn,
    commandDiffers: commandsDiffer(input.closing.commands, input.gate.commands),
    runnerDiffers: input.closing.runner !== input.gate.runner,
    treeFingerprintDiffers: fingerprintsDiffer(input.closing.tree, input.gate.tree),
  });
  return { choice: decision.choice as "run" | "skip", ruleId: decision.ruleId };
}
