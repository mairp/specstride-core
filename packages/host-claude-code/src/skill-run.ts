/**
 * T008 of `specs/113-host-claude-code/tasks.md` — the skill source
 * `specstride-run`: the order of the steps, the outcome lines, the modes, the
 * comment, the judgment, the audience notice and the data framing
 * (F113-FR-002 to F113-FR-008, F113-FR-011, F113-FR-016, F113-FR-017).
 *
 * The source is LOGICAL: the declarations are the skill, and the body is
 * BUILT from them, so the rule a test reads and the sentence the consumer's
 * model reads cannot drift apart. `renderSkill` of `./render/index.ts`
 * renders it as `skills/specstride-run/SKILL.md` and holds it against the
 * byte budget of F113-FR-036 (8,000 tokens, 22,400 bytes).
 *
 * The GENERIC half of this module — the ten steps, the launch outcomes, the
 * modes, the comment rules and patterns, the mode decision, the call
 * arguments, the description and the body builder — lives in
 * `@specstride/host-kit` (`src/skill-run.ts` of the kit, the split of the
 * monorepo, U-1). THIS module holds what is a fact of THIS host and binds
 * the kit's builders to it:
 *
 *  - the five shared sections the body carries, built once from
 *    `./skill-common.ts` over this host's own figures (the traceability of
 *    the prohibitions, the budgets of F113-FR-036, the absent `background`
 *    capability, "with Claude as harness" and Tier 2, the unused judgment
 *    delegation);
 *  - the Modes bullet about the mode names of the OLD skill of this host and
 *    the map DV-009 fixes — `OLD_MODES`, `MODE_MAP`, `mappedMode`, the one
 *    waiver `MODE_MAP_WAIVER` (fixture FX-36, scenario
 *    `mode-no-execution-phrasing`) and `isTheWaivedScenario`. The predecessor
 *    of THIS host is a parity fact of this host; a host without one names its
 *    own mode rule in the bullet instead;
 *  - the budgets the source is built under, read from `./skill-budgets.ts`
 *    (the total of F113-FR-036 and the body-limit check of the design point).
 *
 * The binding keeps every import path of this module and every rendered byte
 * identical to the module it moved out of.
 *
 * The modules of `src/` outside `src/shim/` run in the BUILD, so they may
 * import `@specstride/contracts` and `@specstride/host-kit` (the rule files
 * RF-113-01 and RF-120-02 of the import-boundary check).
 */
import type { SkillSource } from "@specstride/contracts/ep/host";
import type { Mode, RunSkillSections } from "@specstride/host-kit";
import {
  DEFAULT_MODE,
  RUN_SKILL_LOGICAL_ID,
  runSkillBodyOf,
  runSkillSourceOf,
} from "@specstride/host-kit";
import { BYTE_BUDGETS, BODY_BYTE_LIMITS, assertBodyFitsItsLimit } from "./skill-budgets.ts";
import {
  audienceNoticeSection,
  dataFramingSection,
  judgmentSection,
  prohibitionSection,
  supervisionSection,
} from "./skill-common.ts";

/** The logical id of this skill, row 144 of annex X §X.6. */
export const RUN_SKILL_ID = RUN_SKILL_LOGICAL_ID;

/* -------------------------------------------------------------------------
 * F113-FR-002 — the order of the steps (the kit's, in this host's order)
 * ---------------------------------------------------------------------- */

export {
  /** The ten steps F113-FR-002 fixes, in the requirement's own order. */
  RUN_STEPS,
  /** The ids of the ten steps, in order. */
  RUN_STEP_IDS,
  /** F113-FR-002 — the skill stops at the FIRST refusal and prints the CLI's line. */
  STOPS_AT_THE_FIRST_REFUSAL,
  PRINTS_THE_LINE_THAT_NAMES_THE_FIX,
  /** F113-FR-002 — with no finished feature the skill says so and stops. */
  NO_FINISHED_FEATURE_LINE,
  /** The step a refusal stops the skill at: the one that refused, and no later one. */
  stepsUpTo,
} from "@specstride/host-kit";

/* -------------------------------------------------------------------------
 * F113-FR-003 — the outcome of `launch`, as the CLI gives it (the kit's)
 * ---------------------------------------------------------------------- */

export {
  /** The three outcomes of a launch, read from annex F §F.3 and not written here. */
  LAUNCH_OUTCOMES,
  /** What the skill does for each outcome (F113-FR-003). */
  LAUNCH_OUTCOME_ACTIONS,
  /** F113-FR-003 — the skill prints no state it did not read from a line. */
  PRINTS_A_STATE_IT_DID_NOT_READ,
  /** The exit code of a refused launch, read from annex F §F.3. */
  REFUSAL_EXIT_CODE,
  /** True where the skill supervises after this outcome (F113-FR-003). */
  supervisesAfter,
  /** True where the skill retries by itself after this outcome: never. */
  retriesAfter,
  /** The row of annex F §F.3 an outcome carries, for the body of the skill. */
  outcomeNote,
} from "@specstride/host-kit";
export type { HandshakeOutcome } from "@specstride/host-kit";

/* -------------------------------------------------------------------------
 * F113-FR-004, F113-FR-006 — the modes, and the map of the OLD skill
 * ---------------------------------------------------------------------- */

export {
  /** F113-FR-004 — the two modes of this skill; `run` is the default. */
  MODES,
  DEFAULT_MODE,
  /** F113-FR-004 — invoking the skill IS the consent to launch. */
  INVOCATION_IS_CONSENT,
  /** F113-FR-004 — a request that does not invoke the skill launches nothing. */
  A_REQUEST_THAT_DOES_NOT_INVOKE_LAUNCHES,
  /** F113-FR-004 — in `dry-run` the skill stops after the plan and launches nothing. */
  DRY_RUN_LAST_STEP,
  DRY_RUN_PRINTS,
  DRY_RUN_LAUNCHES,
  /** The steps the mode `dry-run` reaches: up to validation, then the plan. */
  stepsOfMode,
  /**
   * F113-FR-004 — a failed launch check shown in the plan is a FINDING, never
   * a failure of derivation.
   */
  FAILED_LAUNCH_CHECK_IS,
  FAILED_LAUNCH_CHECK_IS_A_FAILURE_OF_DERIVATION,
} from "@specstride/host-kit";
export type { Mode } from "@specstride/host-kit";

/** F113-FR-006 — the mode names of the old skill OF THIS HOST. */
export const OLD_MODES = ["generate", "run", "auto"] as const;
export type OldMode = (typeof OLD_MODES)[number];

/**
 * F113-FR-006 — the mode map of DV-009: `generate` to `dry-run`; `run` and
 * `auto` to `run`.
 */
export const MODE_MAP: Readonly<Record<OldMode, Mode>> = Object.freeze({
  generate: "dry-run",
  run: "run",
  auto: "run",
});

/** The mode of this skill an old mode name maps to; an unknown name throws. */
export function mappedMode(oldMode: string): Mode {
  const mapped = MODE_MAP[oldMode as OldMode];
  if (mapped === undefined) {
    throw new Error(`the old skill has no mode \`${oldMode}\` (F113-FR-006, DV-009)`);
  }
  return mapped;
}

/**
 * F113-FR-006 — the ONE waiver of the oracle: the case "no execution
 * phrasing", which the old skill turned into `generate` and this skill answers
 * with `run`. It is a waiver and never a pass (FX-36, scenario
 * `mode-no-execution-phrasing`; register row DV-009).
 */
export const MODE_MAP_WAIVER = Object.freeze({
  fixture: "FX-36",
  scenario: "mode-no-execution-phrasing",
  reference: "generate" as OldMode,
  port: DEFAULT_MODE,
  register: "DV-009",
  why:
    "Decision 18: `specstride-run` launches by default, so the absence of execution phrasing " +
    "gives `run` where the old skill gave `generate`. Mapping it would contradict the decision, " +
    "so the case is waived and never counted as a pass.",
});

/** True for the one scenario of FX-36 the mode map does not answer for. */
export function isTheWaivedScenario(scenario: string): boolean {
  return scenario === MODE_MAP_WAIVER.scenario;
}

/* -------------------------------------------------------------------------
 * F113-FR-005, F113-FR-007 — the comment (the kit's rules and patterns)
 * ---------------------------------------------------------------------- */

export {
  /** The one argument the comment is passed as (F113-FR-007). */
  COMMENT_FLAG,
  /** The two calls the comment is passed to, verbatim and unchanged (F113-FR-007). */
  COMMENT_IS_PASSED_TO,
  /** F113-FR-007 — the comment is captured before any repository text is read. */
  COMMENT_IS_CAPTURED_FIRST,
  /** F113-FR-007 — the skill never summarizes, translates or extends the comment. */
  COMMENT_IS_REWRITTEN,
  /** The flag that records an option the comment selected (row 283 of annex X §X.6). */
  COMMENT_SELECTS_FLAG,
  /** The options the consumer's comment may select, row 283 of annex X §X.6. */
  COMMENT_SELECTABLE_OPTIONS,
  /** The call each selectable option is recorded on (row 283). */
  OPTION_IS_SELECTED_ON,
  /** F113-FR-005 — the comment cannot bypass any of these (the port's own value). */
  THE_COMMENT_CANNOT_BYPASS,
  /** The line the skill prints for a comment that asks to bypass one of them. */
  BYPASS_REFUSAL_LINE,
  /** F113-FR-005 — a mode is never inferred from the request's prose outside the comment. */
  MODE_IS_INFERRED_FROM_THE_REQUEST,
  /** The two inputs a mode is decided from, and the only two. */
  MODE_INPUTS,
  /** The refusal phrases of a comment (F113-FR-005). */
  COMMENT_REFUSAL_PATTERNS,
  /** The phrases of a comment that invite a launch. */
  COMMENT_INVITATION_PATTERNS,
  /** The phrases of a comment that ask to bypass a check (F113-FR-005). */
  COMMENT_BYPASS_PATTERNS,
  /** True where the comment refuses to run (F113-FR-005). */
  commentRefusesToRun,
  /** True where the comment invites a launch. */
  commentInvitesALaunch,
  /** True where the comment asks to bypass a check, the terms gate or a budget. */
  commentAsksToBypassACheck,
  /** Why the mode is what it is. */
  MODE_SOURCES,
  /** F113-FR-005 — the mode, from the explicit mode and the comment and from nothing else. */
  decideMode,
  /** The arguments of one call, with the comment and the `--comment-selects` flags. */
  callArguments,
  /** F113-FR-005 — a refusal of an option is relayed as the CLI prints it. */
  RELAYS_AN_OPTION_REFUSAL_VERBATIM,
} from "@specstride/host-kit";
export type { ModeDecision, ModeSource } from "@specstride/host-kit";

/* -------------------------------------------------------------------------
 * The host's inputs, and the body of the skill
 * ---------------------------------------------------------------------- */

/** The one-line description of the skill, which the host shows in its list. */
export { RUN_SKILL_DESCRIPTION } from "@specstride/host-kit";

/**
 * The five shared sections of this host's run skill, built once from the
 * binding of `./skill-common.ts` — over the traceability of F113-FR-009 to
 * F113-FR-012, the budgets of F113-FR-036, the absent `background`
 * capability, the harness clause and auth tier of F113-FR-016 and the unused
 * judgment delegation of F113-FR-008.
 */
const SECTIONS: RunSkillSections = Object.freeze({
  judgment: judgmentSection(),
  supervision: supervisionSection(),
  audienceNotice: audienceNoticeSection(),
  dataFraming: dataFramingSection(),
  prohibitions: prohibitionSection(),
});

/**
 * The Modes bullet about the mode names of the OLD skill of this host and the
 * map DV-009 fixes, exactly as this host has always rendered it.
 */
const OLD_MODE_NAMES_LINE: string = `The old mode names map: ${OLD_MODES.map(
  (old) => `\`${old}\` → \`${MODE_MAP[old]}\``,
).join("; ")}.`;

/** The Markdown body of `specstride-run`, built from the declarations above. */
export function runSkillBody(): string {
  return runSkillBodyOf({ sections: SECTIONS, oldModeNamesLine: OLD_MODE_NAMES_LINE });
}

/**
 * The skill source `specstride-run`, as `renderSkill` takes it. The happy path
 * needs no reference file (F113-FR-001), so the source carries none.
 */
export function runSkillSource(): SkillSource {
  return runSkillSourceOf({
    sections: SECTIONS,
    oldModeNamesLine: OLD_MODE_NAMES_LINE,
    budgets: { totalBytes: BYTE_BUDGETS["specstride-run"], assertBodyFitsItsLimit },
  });
}

/** The byte limit of the BODY of this skill, from the design point of plan.md. */
export const RUN_BODY_BYTE_LIMIT = BODY_BYTE_LIMITS[RUN_SKILL_ID];
