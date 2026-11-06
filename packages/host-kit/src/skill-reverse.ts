/**
 * The reverse skill source of a host: the skill reverse-specifies existing
 * sources through the reverse commands of the CLI — capture the comment, check
 * the CLI, plan, take the inventory, judge where the reverse commands offer
 * items, run, supervise, print the digest verbatim — and it never modifies the
 * sources of the reverse run. Moved once out of
 * `packages/host-claude-code/src/skill-reverse.ts` (the split of the
 * monorepo, U-1 and U-2 of `specs/120-host-dsh`), which keeps the old path
 * and binds the source to its own sections and budgets.
 *
 * A HOST SUPPLIES ITS SECTIONS AND ITS BUDGETS; THE KIT DECLARES THE SKILL.
 * Every fact the declarations below hold is the product's or the annex's,
 * never one host's: the logical id is the port's own second host skill
 * (`HOST_SKILL_IDS`, read and never spelled here), the consent to run is the
 * port contract's own value, the modes and the flag the comment is passed as
 * come from `./skill-run.ts` (the run skill of the kit, whose modes this
 * skill shares), the digest step is the shared module's own text, and the
 * verbs of the reverse command are the CLI's, from the protocol table of
 * annex G §G.2. The two inputs that ARE a host's are one required argument of
 * `reverseSkillBodyOf` / `reverseSkillSourceOf`, with no default anywhere, as
 * in `describe`, `render`, `skill-common`, `skill-budgets`, `skill-doctor`
 * and `skill-run`:
 *
 *  - `sections` — the five shared sections the host's own figures write (the
 *    judgment exchange, the supervision cycle, the audience notice, the data
 *    framing, the prohibitions), which the host builds from its binding of
 *    the kit's `src/skill-common.ts`;
 *  - `budgets` — the total byte budget of the whole rendered skill and the
 *    body-limit check the body must pass.
 *
 * Like the other modules of the kit, this one runs in the BUILD of a host
 * package. The body binds no host and no spelling: the logical id it is
 * declared under is the contracts' own, and the spelling a host files it at
 * is a spelling of its render profile (`./render.ts`).
 */
import { HOST_SKILL_IDS } from "@specstride/contracts/ep/host";
import { INVOCATION_IS_CONSENT } from "@specstride/contracts/ep/host";
import type { SkillSource } from "@specstride/contracts/ep/host";
import type { RunSkillBudgets, RunSkillSections } from "./skill-run.ts";
import { COMMENT_FLAG, DEFAULT_MODE, MODES } from "./skill-run.ts";
import type { SkillStep } from "./skill-common.ts";
import { DIGEST_STEP_TEXT, stepIds, stepLines, steps } from "./skill-common.ts";

/** The logical id of this skill, the contracts' own second host skill id. */
export const REVERSE_SKILL_LOGICAL_ID = HOST_SKILL_IDS[1];

/** The command of the CLI this skill is a thin layer over (annex G §G.2). */
export const REVERSE_COMMAND = "reverse" as const;

/** Its verbs, as the CLI protocol names them. */
export const REVERSE_VERBS = Object.freeze(["plan", "lint", "guard", "inventory"]);

/**
 * The eight steps of the reverse run, in the order the requirement of a host
 * fixes them: capture the comment; check the CLI; plan; inventory; judge
 * where the reverse commands offer items; run through the reverse command;
 * supervise; print the digest verbatim.
 */
export const REVERSE_STEPS: readonly SkillStep[] = steps([
  [
    "capture-the-comment",
    "Capture the consumer's comment VERBATIM, before you read any text of the repository.",
  ],
  ["cli-check", "Run the shim's CLI check. If it refuses, print its one line and stop."],
  ["plan", "Plan the reverse run (`reverse plan`), with the comment passed unchanged."],
  [
    "inventory",
    "Take the source inventory (`reverse inventory`) and report it as the CLI gave it.",
  ],
  [
    "judge",
    "Judge where the reverse commands offer items, one batch at a time (see “Judge” below).",
  ],
  ["run", "Run through the reverse command (`reverse`), with the comment passed unchanged."],
  ["supervise", "Supervise the run (see “Supervise” below)."],
  ["digest", DIGEST_STEP_TEXT],
]);

/** The ids of the eight steps, in order. */
export const REVERSE_STEP_IDS: readonly string[] = stepIds(REVERSE_STEPS);

/**
 * Invoking the skill IS the consent to run — the port contract's own value,
 * read and never written here (the root index re-exports it under its own
 * name, so the module's alias carries the skill's).
 */
export const REVERSE_INVOCATION_IS_CONSENT = INVOCATION_IS_CONSENT;

/** A dry run WITHHOLDS that consent. */
export const DRY_RUN_WITHHOLDS_CONSENT = true as const;

/** The modes of this skill: the same two names, with the same default. */
export const REVERSE_MODES = MODES;
export const REVERSE_DEFAULT_MODE = DEFAULT_MODE;

/** The flag a dry run is asked for with, as the CLI protocol gives it. */
export const DRY_RUN_FLAG = "--dry-run" as const;

/** The skill MUST NOT modify the sources of the reverse run. */
export const MODIFIES_THE_SOURCES = false as const;

/** The line the skill says when it is asked to change a source. */
export const SOURCES_ARE_READ_ONLY_LINE: string =
  "A reverse run reads its sources and never changes them. I am not editing any source of this " +
  "repository; the CLI writes what it writes and prints which artifact it wrote, by logical " +
  "name.";

/** The one-line description of the skill, which the host shows in its list. */
export const REVERSE_SKILL_DESCRIPTION: string =
  "Reverse-specify existing sources with Specstride: plan the reverse run, take the inventory, " +
  "judge the items the reverse commands offer, run, and supervise to the digest. Invoking this " +
  "skill is the consent to run; a dry run withholds it and changes nothing.";

/* -------------------------------------------------------------------------
 * The host's inputs, and the body of the skill
 * ---------------------------------------------------------------------- */

/**
 * The shared sections of a host's reverse skill: the same five sections the
 * run skill takes (`RunSkillSections`), built once from the host's binding of
 * `src/skill-common.ts`.
 */
export type ReverseSkillSections = RunSkillSections;

/** The budgets of a host that the reverse source is built under — see `skill-run.ts`. */
export type ReverseSkillBudgets = RunSkillBudgets;

/**
 * What is a host's in the reverse skill: the five shared sections the host's
 * own figures write. Every field is required — a host that forgot a section
 * cannot compile into a second host by accident.
 */
export type ReverseSkillHost = {
  /** The host's five shared sections. */
  readonly sections: ReverseSkillSections;
};

/** The Markdown body of the reverse skill, built from the declarations above. */
export function reverseSkillBodyOf(host: ReverseSkillHost): string {
  const lines: string[] = [
    "# Reverse-specify with Specstride",
    "",
    "A thin layer over the Specstride CLI. Every fact you report is a line the CLI printed.",
    "",
    "## Order",
    "",
    ...stepLines(REVERSE_STEPS),
    "",
    "- Stop at the FIRST refusal and print the line of the CLI that names the fix.",
    "",
    "## Consent",
    "",
    `- Invoking this skill IS the consent to run. The modes are ` +
      `\`${REVERSE_MODES.join("` and `")}\`, and the default is \`${REVERSE_DEFAULT_MODE}\`.`,
    `- A dry run (\`${DRY_RUN_FLAG}\`) WITHHOLDS that consent: plan, inventory, print what`,
    "  would happen, and stop.",
    `- Pass the comment as ONE argument, \`${COMMENT_FLAG} <text>\`, verbatim, to every call`,
    "  that takes it. Never summarize, translate or extend it.",
    "",
    "## The sources",
    "",
    `- Never modify the sources of the reverse run. ${SOURCES_ARE_READ_ONLY_LINE}`,
    `- The verbs are ${REVERSE_VERBS.map((verb) => `\`${REVERSE_COMMAND} ${verb}\``).join(", ")}.`,
    "  Report their findings as findings, with the fix each one names.",
    "",
    ...host.sections.judgment,
    "",
    ...host.sections.supervision,
    "",
    ...host.sections.audienceNotice,
    "",
    ...host.sections.dataFraming,
    "",
    ...host.sections.prohibitions,
    "",
  ];
  return lines.join("\n");
}

/**
 * The reverse skill source of a host, as `renderSkill` takes it. The skill
 * needs no reference file, so the source carries none. See `ReverseSkillHost`.
 */
export function reverseSkillSourceOf(
  host: ReverseSkillHost & { budgets: ReverseSkillBudgets },
): SkillSource {
  const body = reverseSkillBodyOf(host);
  host.budgets.assertBodyFitsItsLimit(REVERSE_SKILL_LOGICAL_ID, body);
  return Object.freeze({
    logicalId: REVERSE_SKILL_LOGICAL_ID,
    body,
    references: Object.freeze([]),
    budget: host.budgets.totalBytes,
  });
}
