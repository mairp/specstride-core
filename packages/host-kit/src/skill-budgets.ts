/**
 * The byte limit of the BODY of a skill, inside the total budget a host's
 * budget requirement fixes for the whole rendered skill. Moved once out of
 * `packages/host-claude-code/src/skill-budgets.ts` (the split of the
 * monorepo, U-1 and U-2 of `specs/120-host-dsh`), which keeps the old path
 * and binds these functions to its own tables.
 *
 * A HOST SUPPLIES ITS BODY TABLES; THE KIT MEASURES AND HOLDS THE DRIFT. The
 * figures are facts of ONE host — the token limit of each skill's body and
 * the byte number the host's design point prints beside it — and travel in
 * one required `BodyBudgetTables` input, with no default anywhere, as in
 * `describe`, `render` and `skill-common`. What the kit fixes is the
 * machinery that must not drift: the byte limits are COMPUTED from the token
 * figures at the host's rate, the printed byte numbers are held against that
 * product when the tables are built, and a body over its limit FAILS with
 * `budget-exceeded` rather than being cut.
 *
 * Like the other modules of the kit, this one runs in the BUILD of a host
 * package. It imports nothing of a host: the design point whose limit a
 * `budget-exceeded` message names is the host's own words, an input exactly
 * like the requirement id the render profile carries. The rate is read from
 * `./render.ts`, so a host cannot measure its bodies at a different rate
 * than it renders its skills at.
 */
import { bytesForTokens } from "./render.ts";

/**
 * The body tables of one host: the design point's own figures, keyed by the
 * logical ids of the host's skills. The kit takes no default of any of them:
 * a host that forgot its tables cannot compile into a second host by
 * accident.
 */
export type BodyBudgetTables = {
  /** The token limit of the BODY of each skill, keyed by logical id. */
  readonly bodyTokenLimits: Readonly<Record<string, number>>;
  /**
   * The byte number the host's design point PRINTS beside each token limit,
   * held against the product at build time by `bodyBudgetsOf`.
   */
  readonly printedBodyByteLimits: Readonly<Record<string, number>>;
  /** The rate the body budgets are measured at — the render profile's. */
  readonly bytesPerToken: number;
  /**
   * The design point that fixes the limits, in the host's own words: the
   * `budget-exceeded` message names it, and the kit spells no design point
   * of any host.
   */
  readonly designPoint: string;
};

/** The bytes a string measures, in UTF-8 — the unit every limit here is in. */
export function bodyBytes(body: string): number {
  return Buffer.byteLength(body, "utf8");
}

/**
 * The body budgets of one host, bound to its tables: the limits it declared,
 * the byte limits computed from them at its rate, and the check a skill body
 * is held against. Building it runs the drift check — the printed byte
 * number of every id must be the product of its token limit and the rate, so
 * the printed figures and the arithmetic cannot drift — and a host calls it
 * once, at load, with its own tables.
 */
export type BodyBudgets = {
  /** The token limits the host declared, unchanged. */
  readonly bodyTokenLimits: Readonly<Record<string, number>>;
  /** The byte numbers the host's design point prints, unchanged. */
  readonly printedBodyByteLimits: Readonly<Record<string, number>>;
  /** The byte limits, computed from the token limits at the host's rate. */
  readonly bodyByteLimits: Readonly<Record<string, number>>;
  /**
   * Fails the BUILD where the body of a skill is over the host's limit for
   * it. The whole rendered skill is checked a second time, against the total
   * budget of the host's requirement, by `renderSkill` of `./render.ts`.
   */
  assertBodyFitsItsLimit(logicalId: string, body: string): void;
};

/** The body budgets of a host, from its tables. See `BodyBudgets`. */
export function bodyBudgetsOf(tables: BodyBudgetTables): BodyBudgets {
  const computed: Record<string, number> = {};
  for (const id of Object.keys(tables.bodyTokenLimits)) {
    computed[id] = bytesForTokens(tables.bodyTokenLimits[id] ?? 0, tables.bytesPerToken);
    const printed = tables.printedBodyByteLimits[id];
    if (printed === undefined || printed !== computed[id]) {
      throw new Error(
        `plan.md prints ${printed} bytes for the body of \`${id}\`, and ` +
          `${tables.bodyTokenLimits[id]} tokens at ${tables.bytesPerToken} bytes per token is ` +
          `${computed[id]}`,
      );
    }
  }
  const limits = Object.freeze(computed);
  function assertBodyFitsItsLimit(logicalId: string, body: string): void {
    const limit = limits[logicalId];
    if (limit === undefined) {
      throw new Error(`plan.md fixes no body limit for \`${logicalId}\``);
    }
    const measured = bodyBytes(body);
    if (measured > limit) {
      throw new Error(
        `budget-exceeded: the body of the skill \`${logicalId}\` measures ${measured} bytes and ` +
          `the limit of the design point "${tables.designPoint}" of plan.md is ${limit} bytes`,
      );
    }
  }
  return Object.freeze({
    bodyTokenLimits: Object.freeze({ ...tables.bodyTokenLimits }),
    printedBodyByteLimits: Object.freeze({ ...tables.printedBodyByteLimits }),
    bodyByteLimits: limits,
    assertBodyFitsItsLimit,
  });
}
