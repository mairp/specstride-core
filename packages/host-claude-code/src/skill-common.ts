/**
 * T008, T009 and T010 of `specs/113-host-claude-code/tasks.md` — what the
 * three skill sources of this host share: the prohibitions the skills carry
 * (F113-FR-009 to F113-FR-012), the supervision cycle (F113-FR-013), the
 * audience notice (F113-FR-016) and the data framing (F113-FR-017).
 *
 * A skill source of this host is LOGICAL (plan.md, "Structure Decision": "skill
 * sources are logical, and the spelling is rendered per host"). It is declared
 * as data, and the Markdown body is BUILT from the declaration, so the
 * rule a test reads and the sentence the consumer's model reads cannot drift
 * apart. `renderSkill` of `./render/index.ts` turns the source into
 * `skills/<the host's spelling>/SKILL.md` and holds it against the byte budget.
 *
 * The GENERIC half of this module — the steps machinery, the prohibition
 * texts, the digest line, the supervision commands, the audience row and its
 * marker mechanics, the data framing, the judgment exchange — lives in
 * `@specstride/host-kit` (`src/skill-common.ts` of the kit, the split of the
 * monorepo, U-1). THIS module holds what is a fact of the host and cannot be
 * the kit's, and binds the kit's `*Of` functions to it:
 *
 *  - the traceability of the six prohibitions: the requirement id of this
 *    host that fixes each text (F113-FR-009 to F113-FR-012) and the row of
 *    the old skill's behaviour inventory it was translated from (C-244 →
 *    B-2661, B-2662; C-245 → B-2663, B-2664, B-2666, B-2668);
 *  - the budgets of F113-FR-036 the supervision sentences interpolate —
 *    150 tokens for one cycle, 3,000 for the supervision of a whole run —
 *    read from `TOKEN_BUDGETS` of `./render/index.ts`, so the budget table of
 *    the requirement and the sentences of the skills cannot drift apart;
 *  - the background primitive of this host: `background` is ABSENT in
 *    `./describe/index.ts`, so the declared fallback of annex H §H.1 applies
 *    and the wait runs in the foreground;
 *  - the auth facts of F113-FR-016 — the clause "with Claude as harness"
 *    (the harness, not the host) and the default auth tier it yields, Tier 2;
 *  - the judgment delegation of F113-FR-008: this host has a model, so the
 *    delegation to a harness is not used.
 *
 * The binding keeps every import path of this module and every sentence the
 * skills render byte-identical to the module it moved out of.
 *
 * The modules of `src/` outside `src/shim/` run in the BUILD, so they may
 * import `@specstride/contracts` and `@specstride/host-kit` (the rule files
 * RF-113-01 and RF-120-02 of the import-boundary check). Every fact below
 * that is not a host figure is read from a contract by the kit.
 */
import type { AudienceAuthFacts, Prohibition, ProhibitionTrace } from "@specstride/host-kit";
import {
  audienceNoticeSectionOf,
  audienceNoticeTextOf,
  judgmentSectionOf,
  prohibitionsOf,
  prohibitionIds,
  prohibitionOfIn,
  prohibitionSectionOf,
  supervisionBudgetTokensOf,
  supervisionSectionOf,
  waitRunsInTheBackgroundOf,
} from "@specstride/host-kit";
import { TOKEN_BUDGETS } from "./render/index.ts";
import { CAPABILITY_DECLARATIONS } from "./describe/index.ts";

/* -------------------------------------------------------------------------
 * Steps: what a skill tells the host model to do, in order (the kit's
 * machinery, moved unchanged)
 * ---------------------------------------------------------------------- */

export type { SkillStep, Prohibition, MarkerState } from "@specstride/host-kit";
export { steps, stepIds, stepLines } from "@specstride/host-kit";

/* -------------------------------------------------------------------------
 * F113-FR-009 to F113-FR-012 — the prohibitions every skill carries
 * ---------------------------------------------------------------------- */

/**
 * The requirement of this host that fixes each prohibition text, and the row
 * of the behaviour inventory (`docs/ecosystem/research/`) it was translated
 * from, where there is one. This table is the host's half of the kit's
 * `prohibitionsOf`; the TEXTS are the kit's, and a characterization test
 * holds each text against the row named here.
 */
const PROHIBITION_TRACEABILITY: Readonly<Record<string, ProhibitionTrace>> = Object.freeze({
  "no-repository-write": { requirement: "F113-FR-009", origin: "B-2661" },
  "no-verification-file": { requirement: "F113-FR-010", origin: "B-2662" },
  "no-cli-search": { requirement: "F113-FR-011", origin: "B-2663" },
  "logical-names-only": { requirement: "F113-FR-011", origin: "B-2664" },
  "no-launcher-edit": { requirement: "F113-FR-011", origin: "B-2666" },
  "supervision-reads-only": { requirement: "F113-FR-012", origin: "B-2668" },
});

/** The prohibitions of F113-FR-009 to F113-FR-012, each with this host's traceability. */
export const PROHIBITIONS: readonly Prohibition[] = prohibitionsOf(PROHIBITION_TRACEABILITY);

/** The ids of the prohibitions, in order. */
export const PROHIBITION_IDS: readonly string[] = prohibitionIds(PROHIBITIONS);

/** The prohibition with an id, or `undefined`. */
export function prohibitionOf(id: string): Prohibition | undefined {
  return prohibitionOfIn(PROHIBITIONS, id);
}

/** The Markdown section every skill body carries for the prohibitions. */
export function prohibitionSection(): readonly string[] {
  return prohibitionSectionOf(PROHIBITIONS);
}

/* -------------------------------------------------------------------------
 * F113-FR-012 — the digest, printed verbatim as the last line
 * ---------------------------------------------------------------------- */

export {
  DIGEST_LINE_LABEL,
  DIGEST_IS_PRINTED_VERBATIM,
  DIGEST_IS_THE_FINAL_LINE,
  DIGEST_STEP_TEXT,
} from "@specstride/host-kit";

/* -------------------------------------------------------------------------
 * F113-FR-013 — the supervision cycle
 * ---------------------------------------------------------------------- */

export {
  SUPERVISION_COMMAND,
  SUPERVISION_CHANGE_OPTION,
  SUPERVISION_CURSOR_OPTION,
  UNCHANGED_CYCLE_PRINTS_NOTHING,
  UNCHANGED_CYCLE_TOKENS,
  BUDGET_IS_PROMISED_FOR,
  RELAUNCH_OWNER_CONFIGURATION_KEY,
  RELAUNCH_OWNERS_OF_ANNEX_F,
} from "@specstride/host-kit";

/** The token budget of one supervision cycle (F113-FR-036: 150 tokens). */
export const CYCLE_TOKEN_BUDGET: number = TOKEN_BUDGETS["supervision-cycle"];

/** The token budget of the supervision of a whole run (F113-FR-036: 3,000). */
export const RUN_SUPERVISION_TOKEN_BUDGET: number = TOKEN_BUDGETS["run-supervision"];

/**
 * The token budget of the supervision of a whole run for an owner of a
 * relaunch, or `null` where F113-FR-013 promises none.
 */
export function supervisionBudgetTokens(owner: string): number | null {
  return supervisionBudgetTokensOf(owner, RUN_SUPERVISION_TOKEN_BUDGET);
}

/**
 * True where the wait runs in the background: only with the host's background
 * primitive. The capability is read from `describe` (`./describe/index.ts`),
 * where `background` is ABSENT for this host and the declared fallback of
 * annex H §H.1 applies, so the wait runs in the foreground and every cycle
 * costs at most `CYCLE_TOKEN_BUDGET` tokens (F113-FR-013).
 */
export function waitRunsInTheBackground(): boolean {
  return waitRunsInTheBackgroundOf(CAPABILITY_DECLARATIONS);
}

/** The Markdown section both supervising skills carry (F113-FR-012, F113-FR-013). */
export function supervisionSection(): readonly string[] {
  return supervisionSectionOf({
    backgroundPresent: waitRunsInTheBackground(),
    cycleTokenBudget: CYCLE_TOKEN_BUDGET,
    runSupervisionTokenBudget: RUN_SUPERVISION_TOKEN_BUDGET,
  });
}

/* -------------------------------------------------------------------------
 * F113-FR-016 — the audience notice, told once
 * ---------------------------------------------------------------------- */

export {
  AUDIENCE_ROW,
  AUDIENCE_KEY,
  AUDIENCE_THAT_TRIGGERS_THE_NOTICE,
  AUDIENCE_THE_NOTICE_NAMES,
  NOTICE_TRIGGERS,
  THE_SKILL_SETS_THE_AUDIENCE,
  NOTICE_MARKER_FILE,
  MARKER_DIRECTORY,
  MARKER_IS_STATE_OF_THE_HOST,
  MARKER_HAS_A_LOGICAL_NAME,
  NO_COMMAND_OF_THE_PRODUCT_READS_THE_MARKER,
  MARKER_STATES,
  noticePrints,
  markerFailureChangesAnythingElse,
} from "@specstride/host-kit";

/** The default auth tier with Claude as harness while the audience is `distributed`. */
export const AUTH_TIER_WITH_CLAUDE_AS_HARNESS = "Tier 2" as const;

/** The clause of F113-FR-016 that names the harness: the harness, not the host. */
export const HARNESS_AUTH_CLAUSE = "with Claude as harness" as const;

/** The auth facts of F113-FR-016, as the kit's notice builder takes them. */
const AUTH_FACTS: AudienceAuthFacts = Object.freeze({
  harnessClause: HARNESS_AUTH_CLAUSE,
  authTier: AUTH_TIER_WITH_CLAUDE_AS_HARNESS,
});

/** The notice itself, as the skill prints it. */
export function audienceNoticeText(): string {
  return audienceNoticeTextOf(AUTH_FACTS);
}

/** The Markdown section of the audience notice (F113-FR-016). */
export function audienceNoticeSection(): readonly string[] {
  return audienceNoticeSectionOf(AUTH_FACTS);
}

/* -------------------------------------------------------------------------
 * F113-FR-017 — text from a run or a repository is data
 * ---------------------------------------------------------------------- */

export {
  DATA_FRAMING_KINDS,
  DATA_FRAMING_RULE,
  INJECTED_LINE_FOLLOWS,
  INJECTED_LINE_HOLDS_REPOSITORY_TEXT,
  PRODUCT_LABEL_PATTERN,
  dataFramingSection,
} from "@specstride/host-kit";

/* -------------------------------------------------------------------------
 * F113-FR-008 — the judgment exchange, as both skills take it
 * ---------------------------------------------------------------------- */

export {
  JUDGMENT_BATCH_TOKEN_CAP,
  JUDGMENT_OPENS_THE_LAUNCH_CONTRACT,
  JUDGMENT_OPENS_THE_SOURCES,
  ANSWER_IS_FREE_TEXT,
} from "@specstride/host-kit";

/** This host has a model, so the delegation to a harness is not used (F113-FR-008). */
export const DELEGATION_TO_A_HARNESS_IS_USED = false as const;

/**
 * The Markdown section of the judgment exchange (F113-FR-008). Every sentence
 * the requirement fixes stands in the kit, and the two commands of the
 * exchange are named with the repository root each takes (`--repo`,
 * F107-FR-002).
 */
export function judgmentSection(): readonly string[] {
  return judgmentSectionOf({ delegatesToAHarness: DELEGATION_TO_A_HARNESS_IS_USED });
}
