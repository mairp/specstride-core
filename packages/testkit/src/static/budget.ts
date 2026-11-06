/**
 * T194 — the byte measure of the build and the budgets of §G.5 as data, as a
 * helper that the owner of each command uses in its build (annex G, §G.5;
 * F100-FR-187).
 *
 * The budgets are read from the key `budgets` of `data/cli-protocol.json`; the
 * measure in the build is bytes, at 2.8 bytes per token, which the last row of
 * the table states.
 */
import { Buffer } from "node:buffer";
import cliProtocol from "@specstride/contracts/data/cli-protocol.json" with { type: "json" };

/** The section of annex G that owns the budgets. */
export const ANNEX_SECTION = "annex G, §G.5" as const;

/** The key of `data/cli-protocol.json` this module reads. */
export const DATA_KEY = "budgets" as const;

/** F100-FR-187 — the measure in the build: bytes, at 2.8 bytes per token. */
export const BYTES_PER_TOKEN = 2.8 as const;

/** The row of the table that states the measure. */
export const MEASURE_ROW = "Measure in the build" as const;

type RawBudget = { Subject: string; Budget: string };

/** One row of the table of §G.5. */
export type BudgetRow = {
  /** The subject, as the table names it. */
  readonly subject: string;
  /** The `Budget` cell as the annex writes it, prose and all. */
  readonly cell: string;
  /** The budget in tokens, or `null` for the row that states the measure. */
  readonly tokens: number | null;
  /** The budget in bytes, at 2.8 bytes per token; `null` where there is none. */
  readonly bytes: number | null;
  /** For the row of one supervision cycle: the budget of an unchanged cycle. */
  readonly unchangedTokens?: number | undefined;
};

/** The whole number a cell writes with thousands separated by commas. */
function tokensOf(cell: string): number | null {
  const match = /([\d,]+)\s*tokens?/.exec(cell);
  if (match === null) return null;
  return Number(match[1].replace(/,/g, ""));
}

/** The budget of an unchanged cycle, where the cell states one. */
function unchangedOf(cell: string): number | undefined {
  const match = /an unchanged cycle\s+([\d,]+)/.exec(cell);
  return match === null ? undefined : Number(match[1].replace(/,/g, ""));
}

/** The bytes a token budget allows, at 2.8 bytes per token (F100-FR-187). */
export function bytesOf(tokens: number): number {
  return Math.floor(tokens * BYTES_PER_TOKEN);
}

/** Load the table of §G.5 from `data/cli-protocol.json` (F100-FR-187). */
export function loadBudgets(): readonly BudgetRow[] {
  return Object.freeze(
    (cliProtocol as { budgets: RawBudget[] }).budgets.map((row) => {
      const tokens = tokensOf(row.Budget);
      const unchanged = unchangedOf(row.Budget);
      return Object.freeze({
        subject: row.Subject,
        cell: row.Budget,
        tokens,
        bytes: tokens === null ? null : bytesOf(tokens),
        ...(unchanged === undefined ? {} : { unchangedTokens: unchanged }),
      });
    }),
  );
}

/** The rows of the table of §G.5, in the order of the annex. */
export const budgetRows: readonly BudgetRow[] = loadBudgets();

/** The row whose subject holds the text, or `undefined`. */
export function budgetRow(subjectHolds: string): BudgetRow | undefined {
  return budgetRows.find((row) => row.subject.includes(subjectHolds));
}

/** The budget of a subject in tokens, or `undefined`. */
export function tokenBudget(subjectHolds: string): number | undefined {
  return budgetRow(subjectHolds)?.tokens ?? undefined;
}

/** The budget of a subject in bytes, or `undefined`. */
export function byteBudget(subjectHolds: string): number | undefined {
  return budgetRow(subjectHolds)?.bytes ?? undefined;
}

/** The six subjects of §G.5 that carry a budget, by a short name. */
export const SUBJECTS = Object.freeze({
  hostSkillRun: "Host skill `specstride-run`" as const,
  hostSkillReverse: "Host skill `specstride-reverse`" as const,
  doctorSkill: "Doctor skill" as const,
  supervisionCycle: "One supervision cycle" as const,
  supervisionOfAWholeRun: "Supervision of a whole run" as const,
  judgmentBatch: "One batch of the judgment exchange" as const,
});

/** The result of measuring one output against a budget of §G.5. */
export type BudgetMeasurement = {
  /** The subject of §G.5 the output was measured against. */
  readonly subject: string;
  /** The bytes the output holds. */
  readonly bytes: number;
  /** The bytes the budget allows. */
  readonly allowed: number;
  /** True where the output stays inside the budget. */
  readonly inside: boolean;
  /** The message the build prints on a breach (F100-FR-187). */
  readonly message?: string;
};

/**
 * F100-FR-187 — the helper the owner of each command uses in its build: it
 * measures BYTES and fails on a breach. The text is measured as UTF-8, as it
 * leaves the command.
 */
export function measure(subjectHolds: string, output: string): BudgetMeasurement {
  const row = budgetRow(subjectHolds);
  if (row === undefined || row.bytes === null) {
    throw new Error(
      `annex G §G.5 holds no budget for "${subjectHolds}"; the subjects are ` +
        `${budgetRows.map((r) => r.subject).join(", ")} (F100-FR-187)`,
    );
  }
  const bytes = Buffer.byteLength(output, "utf8");
  const inside = bytes <= row.bytes;
  return Object.freeze({
    subject: row.subject,
    bytes,
    allowed: row.bytes,
    inside,
    ...(inside
      ? {}
      : {
          message:
            `the output of "${row.subject}" holds ${bytes} bytes; the budget of annex G ` +
            `§G.5 is ${row.tokens} tokens, ${row.bytes} bytes at ${BYTES_PER_TOKEN} bytes ` +
            "per token (F100-FR-187)",
        }),
  });
}

/** `measure` that throws on a breach: the form the build uses. */
export function assertInsideBudget(subjectHolds: string, output: string): BudgetMeasurement {
  const result = measure(subjectHolds, output);
  if (!result.inside) throw new Error(result.message);
  return result;
}

/**
 * F100-FR-187 — the budget for a whole run holds with `relaunch.owner: root`;
 * with `supervise` the host watches for the whole run and the budget is not
 * promised.
 */
export const WHOLE_RUN_BUDGET_HOLDS_WITH: readonly string[] = Object.freeze(["root"]);
export function wholeRunBudgetIsPromised(relaunchOwner: string): boolean {
  return WHOLE_RUN_BUDGET_HOLDS_WITH.includes(relaunchOwner);
}

/** An unchanged supervision cycle costs 0 tokens (§G.5). */
export const UNCHANGED_CYCLE_TOKENS = 0 as const;
