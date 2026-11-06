/**
 * T008, T009 and T010 — the byte limit of the BODY of each skill of this host.
 *
 * F113-FR-036 fixes the budget of the whole rendered skill (8,000; 7,000; 1,500
 * tokens; `./render/index.ts` holds those). The design point "Skill body size"
 * of plan.md fixes the tighter limit of the BODY alone, inside those totals:
 * "Body at most 2,500 tokens (7,000 bytes) for run, 2,000 (5,600) for reverse,
 * 800 (2,240) for the doctor". The figures are upper limits from research R17;
 * annex G §G.5 and the brief give only the totals.
 *
 * The GENERIC half of this module — the computation of the byte limits from
 * the token figures at the rate, the load-time check that holds the printed
 * byte numbers against that product so the two cannot drift, and the
 * `budget-exceeded` refusal for a body over its limit — lives in
 * `@specstride/host-kit` (`src/skill-budgets.ts` of the kit, the split of the
 * monorepo, U-1). THIS module holds what is a fact of this host and cannot be
 * the kit's:
 *
 *  - the token figures of the design point (2,500; 2,000; 800) and the byte
 *    figures plan.md prints beside them (7,000; 5,600; 2,240), per logical id
 *    of row 144 of annex X §X.6;
 *  - the rate they are measured at: `BYTES_PER_TOKEN` of `./render/index.ts`
 *    (2.8, the rate of F113-FR-036), read and never repeated, so the bodies
 *    and the whole rendered skills are measured at one rate;
 *  - the name of the design point the `budget-exceeded` message names
 *    ("Skill body size"), this host's own words, as the kit takes no design
 *    point of any host.
 *
 * The binding keeps every import path of this module and every message
 * byte-identical to the module it moved out of, and the drift check still
 * runs at load.
 */
import { bodyBudgetsOf, bodyBytes as bodyBytesOf } from "@specstride/host-kit";
import { BYTES_PER_TOKEN, BYTE_BUDGETS, bytesForTokens } from "./render/index.ts";
import { HOST_SKILL_AND_ENTRY_IDS } from "@specstride/contracts/ep/context-cost";

export { BYTES_PER_TOKEN, BYTE_BUDGETS, bytesForTokens };

/** The design point that fixes the body limits, in this host's own words. */
const BODY_DESIGN_POINT = "Skill body size" as const;

/** The tables of the design point, as the kit's `bodyBudgetsOf` takes them. */
const BODY_TABLES = {
  bodyTokenLimits: {
    [HOST_SKILL_AND_ENTRY_IDS[0]]: 2_500,
    [HOST_SKILL_AND_ENTRY_IDS[1]]: 2_000,
    [HOST_SKILL_AND_ENTRY_IDS[2]]: 800,
  },
  printedBodyByteLimits: {
    [HOST_SKILL_AND_ENTRY_IDS[0]]: 7_000,
    [HOST_SKILL_AND_ENTRY_IDS[1]]: 5_600,
    [HOST_SKILL_AND_ENTRY_IDS[2]]: 2_240,
  },
  bytesPerToken: BYTES_PER_TOKEN,
  designPoint: BODY_DESIGN_POINT,
};

/**
 * The bound body budgets of this host. Building them runs the drift check at
 * load, exactly as this module did before the move.
 */
const BUDGETS = bodyBudgetsOf(BODY_TABLES);

/** The token figures of the design point, per skill of this host. */
export const BODY_TOKEN_LIMITS: Readonly<Record<string, number>> = BUDGETS.bodyTokenLimits;

/** The byte figures the design point PRINTS beside them. */
export const PRINTED_BODY_BYTE_LIMITS: Readonly<Record<string, number>> =
  BUDGETS.printedBodyByteLimits;

/** The byte limit of the body of each skill, at 2.8 bytes per token. */
export const BODY_BYTE_LIMITS: Readonly<Record<string, number>> = BUDGETS.bodyByteLimits;

/** The bytes a body measures. */
export function bodyBytes(body: string): number {
  return bodyBytesOf(body);
}

/**
 * Fails the BUILD where the body of a skill is over the limit of the design
 * point. The whole rendered skill is checked a second time, against the budget
 * of F113-FR-036, by `renderSkill`.
 */
export function assertBodyFitsItsLimit(logicalId: string, body: string): void {
  BUDGETS.assertBodyFitsItsLimit(logicalId, body);
}
