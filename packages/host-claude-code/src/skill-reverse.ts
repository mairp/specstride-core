/**
 * T009 of `specs/113-host-claude-code/tasks.md` — the skill source
 * `specstride-reverse` of THIS host (F113-FR-014).
 *
 * The MODULE moved to `@specstride/host-kit` (`src/skill-reverse.ts` there) in
 * the split of the monorepo (U-1, U-2 of `specs/120-host-dsh`), and this file
 * re-exports it from the old path so the imports of this package keep working;
 * the module itself lives in one place (the rule of the split: a module moves
 * once, an old path re-exports).
 *
 * What the kit does not fix — the five shared sections and the budgets of
 * THIS host — this file passes in:
 *
 *  - the five shared sections, built once from `./skill-common.ts` over this
 *    host's own figures (the traceability of F113-FR-009 to F113-FR-012, the
 *    budgets of F113-FR-036, the absent `background` capability, "with Claude
 *    as harness" and Tier 2, the unused judgment delegation);
 *  - the total byte budget of the whole rendered reverse skill, 1,500 tokens,
 *    read as `BYTE_BUDGETS["specstride-reverse"]` from the render profile of
 *    F113-FR-036 (`./render/index.ts`, reached through `./skill-budgets.ts`);
 *  - the body-limit check the body must pass, 2,000 tokens (5,600 bytes) of
 *    the design point "Skill body size" of plan.md, from `bodyBudgetsOf`
 *    (`./skill-budgets.ts`), keyed by the logical id of row 144.
 *
 * Everything else is the kit's: the eight steps, the reverse command and its
 * verbs, the consent (read from the port contract, the module's alias for it
 * is `REVERSE_INVOCATION_IS_CONSENT`), the dry-run flag and the modes it
 * shares with the run skill, the sources-are-read-only line, the description
 * and the body builder. The binding keeps every import path of this module
 * and every rendered byte identical to the module it moved out of.
 *
 * The modules of `src/` outside `src/shim/` run in the BUILD, so they may
 * import `@specstride/contracts` and `@specstride/host-kit` (the rule files
 * RF-113-01 and RF-120-02 of the import-boundary check).
 */
import type { SkillSource } from "@specstride/contracts/ep/host";
import type { RunSkillSections } from "@specstride/host-kit";
import {
  REVERSE_SKILL_LOGICAL_ID,
  reverseSkillBodyOf,
  reverseSkillSourceOf,
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
export const REVERSE_SKILL_ID = REVERSE_SKILL_LOGICAL_ID;

export {
  /** The command of the CLI this skill is a thin layer over (annex G §G.2). */
  REVERSE_COMMAND,
  /** Its verbs, as the CLI protocol names them. */
  REVERSE_VERBS,
  /** The eight steps F113-FR-014 fixes, in the requirement's own order. */
  REVERSE_STEPS,
  /** The ids of the eight steps, in order. */
  REVERSE_STEP_IDS,
  /**
   * F113-FR-014 — invoking the skill IS the consent to run. The kit module
   * holds it under its alias `REVERSE_INVOCATION_IS_CONSENT`, read from the
   * port contract; the old path keeps the port's own name for it.
   */
  REVERSE_INVOCATION_IS_CONSENT as INVOCATION_IS_CONSENT,
  /** F113-FR-014 — a dry run WITHHOLDS that consent. */
  DRY_RUN_WITHHOLDS_CONSENT,
  /** The modes of this skill: the same two names, with the same default. */
  REVERSE_MODES,
  REVERSE_DEFAULT_MODE,
  /** The flag a dry run is asked for with, as the CLI protocol gives it. */
  DRY_RUN_FLAG,
  /** F113-FR-014 — the skill MUST NOT modify the sources of the reverse run. */
  MODIFIES_THE_SOURCES,
  /** The line the skill says when it is asked to change a source. */
  SOURCES_ARE_READ_ONLY_LINE,
  /** The one-line description of the skill, which the host shows in its list. */
  REVERSE_SKILL_DESCRIPTION,
} from "@specstride/host-kit";

/**
 * The five shared sections of this host's reverse skill, built once from the
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

/** The Markdown body of `specstride-reverse`, built from the declarations above. */
export function reverseSkillBody(): string {
  return reverseSkillBodyOf({ sections: SECTIONS });
}

/**
 * The skill source `specstride-reverse`, as `renderSkill` takes it. The skill
 * needs no reference file, so the source carries none.
 */
export function reverseSkillSource(): SkillSource {
  return reverseSkillSourceOf({
    sections: SECTIONS,
    budgets: { totalBytes: BYTE_BUDGETS["specstride-reverse"], assertBodyFitsItsLimit },
  });
}

/** The byte limit of the BODY of this skill, from the design point of plan.md. */
export const REVERSE_BODY_BYTE_LIMIT = BODY_BYTE_LIMITS[REVERSE_SKILL_ID];
