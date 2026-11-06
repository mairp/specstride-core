/**
 * The run skill source of a host: the order of the steps, the outcome lines
 * of `launch`, the modes, the comment and its flags, and the body that says
 * all of it. Moved once out of
 * `packages/host-claude-code/src/skill-run.ts` (the split of the monorepo,
 * U-1 and U-2 of `specs/120-host-dsh`), which keeps the old path, holds what
 * is a fact of that host alone, and binds the source to its own figures.
 *
 * A HOST SUPPLIES ITS SECTIONS, ITS PARAGRAPH AND ITS BUDGETS; THE KIT
 * DECLARES THE SKILL. Every fact the declarations below hold is the
 * product's or the annex's, never one host's: the ten steps of the run are
 * the workflow of the CLI through the shim (annex G §G.2, annex F §F.3), the
 * three launch outcomes and the refusal exit code are READ from the
 * handshake contract, the consent and the comment rule are the port's own
 * (`@specstride/contracts/ep/host`), and the options the comment may select
 * are row 283 of annex X §X.6. The figures that ARE a host's travel in one
 * required input of `runSkillBodyOf` / `runSkillSourceOf`, with no default
 * anywhere, as in `describe`, `render`, `skill-common`, `skill-budgets` and
 * `skill-doctor`:
 *
 *  - `sections` — the five shared sections the host's own figures write (the
 *    judgment exchange, the supervision cycle, the audience notice, the data
 *    framing, the prohibitions), which the host builds from its binding of
 *    the kit's `src/skill-common.ts`;
 *  - `oldModeNamesLine` — the one Modes bullet about the mode names of the
 *    host's PREVIOUS skill, if it had one, and how they map into the modes
 *    of this skill (a parity fact of the host that had the predecessor; a
 *    host without one still states its mode rule there, in its own words);
 *  - `budgets` — the total byte budget of the whole rendered skill and the
 *    body-limit check the body must pass.
 *
 * The old module's map of its old mode names, the register row, the fixture
 * and the waiver of its parity campaign are parity facts of the host it moved
 * out of and stayed there; only the rendered bullet travels in, as
 * `oldModeNamesLine`.
 *
 * Like the other modules of the kit, this one runs in the BUILD of a host
 * package. The body binds no host and no spelling: the logical id it is
 * declared under is the contracts' own (`HOST_SKILL_IDS` of the port, read
 * and never spelled here), and the spelling a host files it at is a spelling
 * of its render profile (`./render.ts`).
 */
import { HOST_SKILL_IDS } from "@specstride/contracts/ep/host";
import type { SkillSource } from "@specstride/contracts/ep/host";
import { INVOCATION_IS_CONSENT, THE_COMMENT_CANNOT_BYPASS } from "@specstride/contracts/ep/host";
import {
  HANDSHAKE_OUTCOMES,
  REFUSAL_CODE,
  handshakeRow,
} from "@specstride/contracts/state/handshake";
import type { HandshakeOutcome } from "@specstride/contracts/state/handshake";
import type { SkillStep } from "./skill-common.ts";
import { DIGEST_STEP_TEXT, stepIds, stepLines, steps } from "./skill-common.ts";

/** The outcome of a `launch` of the CLI, of annex F §F.3 — the contracts' own type. */
export type { HandshakeOutcome };

/** The logical id of this skill, the contracts' own first host skill id. */
export const RUN_SKILL_LOGICAL_ID = HOST_SKILL_IDS[0];

/* -------------------------------------------------------------------------
 * The order of the steps
 * ---------------------------------------------------------------------- */

/**
 * The ten steps of the run, in order: (1) capture the consumer's comment
 * verbatim; (2) run the shim's CLI check; (3) derive the launch contract
 * through the launch-contract commands of the CLI; (4) judge the batches of
 * the judgment exchange; (5) validate, and promote through validation;
 * (6) render; (7) launch; (8) print the outcome line; (9) supervise;
 * (10) print the digest.
 */
export const RUN_STEPS: readonly SkillStep[] = steps([
  [
    "capture-the-comment",
    "Capture the consumer's comment VERBATIM, before you read any text of the repository; " +
      "do not summarize it, translate it or extend it.",
  ],
  [
    "cli-check",
    "Run the shim's CLI check. The shim finds the CLI and compares the protocol; if it " +
      "refuses, print its one line and stop.",
  ],
  [
    "derive",
    "Derive the launch contract through the launch-contract commands of the CLI (`contract " +
      "derive --repo <the repository root>`, `--comment <the comment, verbatim>`).",
  ],
  ["judge", "Judge the batches of the judgment exchange (see “Judge”)."],
  [
    "validate",
    "Validate, and promote through validation (`contract validate`, then `contract promote`).",
  ],
  ["render", "Render (`contract render`)."],
  [
    "launch",
    "Launch (`launch`), with `--comment <the comment, verbatim and unchanged>`. In `dry-run` " +
      "you never reach this step.",
  ],
  ["outcome-line", "Print the outcome line of `launch` exactly as the CLI gave it."],
  ["supervise", "Supervise the run (see “Supervise”)."],
  ["digest", DIGEST_STEP_TEXT],
]);

/** The ids of the ten steps, in order. */
export const RUN_STEP_IDS: readonly string[] = stepIds(RUN_STEPS);

/** The skill stops at the FIRST refusal and prints the CLI's line. */
export const STOPS_AT_THE_FIRST_REFUSAL = true as const;
export const PRINTS_THE_LINE_THAT_NAMES_THE_FIX = true as const;

/** With no finished feature the skill says so and stops. */
export const NO_FINISHED_FEATURE_LINE: string =
  "No finished feature: the CLI found nothing to derive a launch contract from. Nothing was " +
  "started.";

/** The step a refusal stops the skill at: the one that refused, and no later one. */
export function stepsUpTo(stepId: string): readonly SkillStep[] {
  const index = RUN_STEPS.findIndex((step) => step.id === stepId);
  if (index < 0) throw new Error(`\`${RUN_SKILL_LOGICAL_ID}\` has no step \`${stepId}\``);
  return Object.freeze(RUN_STEPS.slice(0, index + 1));
}

/* -------------------------------------------------------------------------
 * The outcome of `launch`, as the CLI gives it
 * ---------------------------------------------------------------------- */

/** The three outcomes of a launch, read from annex F §F.3 and not written here. */
export const LAUNCH_OUTCOMES = HANDSHAKE_OUTCOMES;

/** What the skill does for each outcome. */
export const LAUNCH_OUTCOME_ACTIONS: Readonly<Record<HandshakeOutcome, string>> = Object.freeze({
  started: "print the line and supervise the run that started",
  attached: "print the line and supervise the run that lives",
  refused: "print the refusal line and do not retry unless the consumer asks",
});

/** The skill prints no state it did not read from a line. */
export const PRINTS_A_STATE_IT_DID_NOT_READ = false as const;

/** The exit code of a refused launch, read from annex F §F.3. */
export const REFUSAL_EXIT_CODE = REFUSAL_CODE;

/** True where the skill supervises after this outcome. */
export function supervisesAfter(outcome: HandshakeOutcome): boolean {
  return outcome === "started" || outcome === "attached";
}

/** True where the skill retries by itself after this outcome: never. */
export function retriesAfter(_outcome: HandshakeOutcome): boolean {
  return false;
}

/** The row of annex F §F.3 an outcome carries, for the body of the skill. */
export function outcomeNote(outcome: HandshakeOutcome): string {
  return handshakeRow(outcome)?.meaning ?? "";
}

/* -------------------------------------------------------------------------
 * The modes and the mode map inputs
 * ---------------------------------------------------------------------- */

/** The two modes of this skill; `run` is the default. */
export const MODES = ["run", "dry-run"] as const;
export type Mode = (typeof MODES)[number];
export const DEFAULT_MODE: Mode = "run";

/** Invoking the skill IS the consent to launch — the port's own value. */
export const INVOCATION_OF_THE_SKILL_IS_CONSENT = INVOCATION_IS_CONSENT;

/** A request that does not invoke the skill launches nothing. */
export const A_REQUEST_THAT_DOES_NOT_INVOKE_LAUNCHES = false as const;

/** In `dry-run` the skill stops after the plan and launches nothing. */
export const DRY_RUN_LAST_STEP = "validate" as const;
export const DRY_RUN_PRINTS = "the plan" as const;
export const DRY_RUN_LAUNCHES = false as const;

/** The steps the mode `dry-run` reaches: up to validation, then the plan. */
export function stepsOfMode(mode: Mode): readonly SkillStep[] {
  return mode === "dry-run" ? stepsUpTo(DRY_RUN_LAST_STEP) : RUN_STEPS;
}

/**
 * A failed launch check shown in the plan is a FINDING, never a failure of
 * derivation.
 */
export const FAILED_LAUNCH_CHECK_IS = "a finding" as const;
export const FAILED_LAUNCH_CHECK_IS_A_FAILURE_OF_DERIVATION = false as const;

/* -------------------------------------------------------------------------
 * The comment
 * ---------------------------------------------------------------------- */

/** The one argument the comment is passed as. */
export const COMMENT_FLAG = "--comment" as const;

/** The two calls the comment is passed to, verbatim and unchanged. */
export const COMMENT_IS_PASSED_TO = Object.freeze(["contract derive", "launch"]);

/** The comment is captured before any repository text is read. */
export const COMMENT_IS_CAPTURED_FIRST = true as const;

/** The skill never summarizes, translates or extends the comment. */
export const COMMENT_IS_REWRITTEN = false as const;

/** The flag that records an option the comment selected (row 283 of annex X §X.6). */
export const COMMENT_SELECTS_FLAG = "--comment-selects" as const;

/**
 * The options the consumer's comment may select, row 283 of annex X §X.6:
 * `features`, `relaunch` or `learning` on `contract derive`; `mode` on
 * `launch`.
 */
export const COMMENT_SELECTABLE_OPTIONS = Object.freeze([
  "features",
  "relaunch",
  "learning",
  "mode",
]);

/** The call each selectable option is recorded on (row 283). */
export const OPTION_IS_SELECTED_ON: Readonly<Record<string, string>> = Object.freeze({
  features: "contract derive",
  relaunch: "contract derive",
  learning: "contract derive",
  mode: "launch",
});

/** The line the skill prints for a comment that asks to bypass one of them. */
export const BYPASS_REFUSAL_LINE: string =
  "The comment asks to skip a check that cannot be skipped. I am not acting on that part of " +
  "it: a launch check, the terms gate and a budget are not mine to waive. Everything else in " +
  "the comment is passed on unchanged.";

/** A mode is never inferred from the request's prose outside the comment. */
export const MODE_IS_INFERRED_FROM_THE_REQUEST = false as const;

/** The two inputs a mode is decided from, and the only two. */
export const MODE_INPUTS = Object.freeze(["the explicit mode", "the comment"]);

/**
 * The refusal phrases of a comment: a comment that refuses to run beats an
 * invitation and gives `dry-run`.
 */
export const COMMENT_REFUSAL_PATTERNS: readonly RegExp[] = Object.freeze([
  /\bdo not run\b/i,
  /\bdon't run\b/i,
  /\bdo not (execute|launch|start)\b/i,
  /\bdon't (execute|launch|start)\b/i,
  /\bwithout running\b/i,
  /\bno execution\b/i,
  /\b(generation|dry[- ]run) only\b/i,
  /\bdry[- ]run\b/i,
]);

/** The phrases of a comment that invite a launch. */
export const COMMENT_INVITATION_PATTERNS: readonly RegExp[] = Object.freeze([
  /\brun it\b/i,
  /\brun this\b/i,
  /\b(launch|execute|start) it\b/i,
  /\bfor real\b/i,
  /\bgo ahead\b/i,
]);

/** The phrases of a comment that ask to bypass a check. */
export const COMMENT_BYPASS_PATTERNS: readonly RegExp[] = Object.freeze([
  /\bskip (the |a )?(launch )?check/i,
  /\bignore (the |a )?(launch )?check/i,
  /\bbypass\b/i,
  /\bskip the terms\b/i,
  /\b(ignore|raise|skip) the budget\b/i,
  /\bwithout the (launch )?check/i,
  /\bforce\b/i,
]);

/** True where the comment refuses to run. */
export function commentRefusesToRun(comment: string): boolean {
  return COMMENT_REFUSAL_PATTERNS.some((pattern) => pattern.test(comment));
}

/** True where the comment invites a launch. */
export function commentInvitesALaunch(comment: string): boolean {
  return COMMENT_INVITATION_PATTERNS.some((pattern) => pattern.test(comment));
}

/** True where the comment asks to bypass a check, the terms gate or a budget. */
export function commentAsksToBypassACheck(comment: string): boolean {
  return COMMENT_BYPASS_PATTERNS.some((pattern) => pattern.test(comment));
}

/** Why the mode is what it is. */
export const MODE_SOURCES = [
  "the explicit mode of the consumer",
  "a refusal in the comment",
  "an invitation in the comment",
  "the default",
] as const;
export type ModeSource = (typeof MODE_SOURCES)[number];

/** What `decideMode` decided. */
export type ModeDecision = {
  /** The mode the skill works in. */
  readonly mode: Mode;
  /** Where the mode came from. */
  readonly source: ModeSource;
  /** True where the comment changed the mode, which the skill then SAYS. */
  readonly changedByTheComment: boolean;
  /** What the skill says it changed because of the comment, or `null`. */
  readonly saysWhatChanged: string | null;
  /** The options the comment selected, each recorded with `--comment-selects`. */
  readonly commentSelects: readonly string[];
  /** True where the comment asked to bypass a check, which the skill refuses. */
  readonly refusedBypass: boolean;
};

/**
 * The mode, from the explicit mode and the comment and from NOTHING ELSE. An
 * explicit mode beats prose in the comment; a refusal in the comment beats an
 * invitation and gives `dry-run`; no mode and no comment give `run`.
 * `requestProse` is accepted and IGNORED on purpose: the skill must not infer
 * a mode from the request's prose outside the comment, and a test holds two
 * calls that differ only in it against each other.
 */
export function decideMode(input: {
  readonly explicit?: string | undefined;
  readonly comment?: string | undefined;
  readonly requestProse?: string | undefined;
}): ModeDecision {
  const comment = input.comment ?? "";
  const refusedBypass = comment !== "" && commentAsksToBypassACheck(comment);
  if (input.explicit !== undefined && input.explicit !== "") {
    if (!(MODES as readonly string[]).includes(input.explicit)) {
      throw new Error(`\`${RUN_SKILL_LOGICAL_ID}\` has no mode \`${input.explicit}\``);
    }
    return Object.freeze({
      mode: input.explicit as Mode,
      source: MODE_SOURCES[0],
      changedByTheComment: false,
      saysWhatChanged: null,
      commentSelects: Object.freeze([]),
      refusedBypass,
    });
  }
  if (comment !== "" && commentRefusesToRun(comment)) {
    return Object.freeze({
      mode: "dry-run",
      source: MODE_SOURCES[1],
      changedByTheComment: true,
      saysWhatChanged:
        "Your comment refuses a launch, so the mode is `dry-run`: I derive and validate, print " +
        "the plan, and start nothing.",
      commentSelects: Object.freeze(["mode"]),
      refusedBypass,
    });
  }
  if (comment !== "" && commentInvitesALaunch(comment)) {
    return Object.freeze({
      mode: "run",
      source: MODE_SOURCES[2],
      changedByTheComment: true,
      saysWhatChanged: "Your comment asks for a launch, so the mode is `run`.",
      commentSelects: Object.freeze(["mode"]),
      refusedBypass,
    });
  }
  return Object.freeze({
    mode: DEFAULT_MODE,
    source: MODE_SOURCES[3],
    changedByTheComment: false,
    saysWhatChanged: null,
    commentSelects: Object.freeze([]),
    refusedBypass,
  });
}

/**
 * The arguments of one call, with the comment and with one
 * `--comment-selects <option>` per option the comment set on THAT call
 * (row 283 of annex X §X.6).
 */
export function callArguments(
  call: "contract derive" | "launch",
  comment: string | undefined,
  selected: readonly string[] = [],
): readonly string[] {
  const argv: string[] = [];
  if (comment !== undefined && comment !== "") argv.push(COMMENT_FLAG, comment);
  for (const option of selected) {
    if (!COMMENT_SELECTABLE_OPTIONS.includes(option)) {
      throw new Error(`row 283 of annex X §X.6 holds no option \`${option}\``);
    }
    if (OPTION_IS_SELECTED_ON[option] !== call) continue;
    argv.push(COMMENT_SELECTS_FLAG, option);
  }
  return Object.freeze(argv);
}

/** A refusal of an option is relayed as the CLI prints it. */
export const RELAYS_AN_OPTION_REFUSAL_VERBATIM = true as const;

/* -------------------------------------------------------------------------
 * The host's inputs, and the body of the skill
 * ---------------------------------------------------------------------- */

/**
 * The shared sections of a host's run skill: what the host's own figures
 * write, built once from its binding of `src/skill-common.ts`. Every field
 * is required — a host that forgot a section cannot compile into a second
 * host by accident.
 */
export type RunSkillSections = {
  /** The judgment exchange (the “Judge” section; the kit writes it over the host's delegation). */
  readonly judgment: readonly string[];
  /** The supervision cycle (the kit writes it over the host's budgets and background). */
  readonly supervision: readonly string[];
  /** The audience notice (the kit writes it over the host's auth facts). */
  readonly audienceNotice: readonly string[];
  /** The data framing (the kit's, rebound per host for provenance). */
  readonly dataFraming: readonly string[];
  /** The prohibitions (the kit's texts over the host's traceability). */
  readonly prohibitions: readonly string[];
};

/** The budgets of a host that the run source is built under — see `skill-doctor.ts`. */
export type RunSkillBudgets = {
  /** The total byte budget of the whole rendered skill, of the host's render profile. */
  readonly totalBytes: number;
  /**
   * The body-limit check the body must pass — the host's own, the
   * `assertBodyFitsItsLimit` of its `bodyBudgetsOf` (`./skill-budgets.ts`),
   * keyed by the logical id.
   */
  assertBodyFitsItsLimit(logicalId: string, body: string): void;
};

/**
 * What is a host's in the run skill: the five shared sections and the one
 * Modes bullet about the mode names of the host's previous skill.
 */
export type RunSkillHost = {
  /** The host's five shared sections. */
  readonly sections: RunSkillSections;
  /**
   * The Modes bullet about the mode names of the host's PREVIOUS skill and
   * how they map into the modes of this skill, in the host's own words —
   * without the leading `- ` of the bullet, which the body adds. A host
   * without a predecessor states its mode rule there instead.
   */
  readonly oldModeNamesLine: string;
};

/** The one-line description of the skill, which the host shows in its list. */
export const RUN_SKILL_DESCRIPTION: string =
  "Run Specstride on the finished features of this repository: derive and judge the launch " +
  "contract, validate, promote, render, launch, and supervise the run to its digest. Invoking " +
  "this skill is the consent to launch; the mode `dry-run` stops after the plan.";

/** A list in prose: "a, b or c". */
function orList(items: readonly string[]): string {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
}

/** The options of row 283 the comment may select on ONE call, in backticks. */
function optionsSelectedOn(call: string): readonly string[] {
  return COMMENT_SELECTABLE_OPTIONS.filter((option) => OPTION_IS_SELECTED_ON[option] === call).map(
    (option) => `\`${option}\``,
  );
}

/** The Markdown body of the run skill, built from the declarations above. */
export function runSkillBodyOf(host: RunSkillHost): string {
  const lines: string[] = [
    "# Run Specstride",
    "",
    "A thin layer over the Specstride CLI. Every fact you report is a line the CLI printed.",
    "You hold no product logic, you author no spec, and the happy path needs no reference file.",
    "",
    "## Order",
    "",
    ...stepLines(RUN_STEPS),
    "",
    "- Stop at the FIRST refusal and print the line of the CLI that names the fix; go no further.",
    `- If no finished feature exists, say so and stop: "${NO_FINISHED_FEATURE_LINE}"`,
    "",
    "## Modes",
    "",
    `- The modes are \`${DEFAULT_MODE}\`, the default, and \`${MODES[1]}\`: invoking this skill ` +
      "IS the consent to launch. A request that does not invoke this skill launches nothing.",
    `- In \`dry-run\`: derive and validate, print ${DRY_RUN_PRINTS}, and STOP. Never launch.`,
    `- A failed launch check shown in the plan is ${FAILED_LAUNCH_CHECK_IS}, NOT a failure of `,
    "  derivation; say which check failed and what the CLI says fixes it.",
    `- ${host.oldModeNamesLine}`,
    "",
    "## The comment",
    "",
    `- Pass the comment as ONE argument, \`${COMMENT_FLAG} <text>\`, to ` +
      `\`${COMMENT_IS_PASSED_TO[0]}\` and again, unchanged, to \`${COMMENT_IS_PASSED_TO[1]}\`.`,
    "- An explicit mode from the consumer beats prose in the comment. A refusal in the comment",
    '  ("do not run yet") beats an invitation and gives `dry-run`. No mode and no comment give',
    `  \`${DEFAULT_MODE}\`.`,
    "- Never infer a mode from the prose of the request outside the comment.",
    `- The comment cannot bypass ${orList(THE_COMMENT_CANNOT_BYPASS)}. For a comment that`,
    `  asks for it, say: "${BYPASS_REFUSAL_LINE}"`,
    "- Say what you changed because of the comment.",
    `- For every option you set because of the comment, add \`${COMMENT_SELECTS_FLAG} <option>\``,
    "  to the SAME call. The options are " +
      `${COMMENT_IS_PASSED_TO.map((call) => `\`${orList(optionsSelectedOn(call))} on \`${call}\``).join("; ")}.`,
    "- When the CLI refuses an option, relay its refusal as it printed it.",
    "",
    ...host.sections.judgment,
    "",
    "## The outcome of `launch`",
    "",
    ...LAUNCH_OUTCOMES.map((outcome) => `- \`${outcome}\`: ${LAUNCH_OUTCOME_ACTIONS[outcome]}.`),
    "- Print the outcome as the CLI gave it. Never print a state you did not read from a line.",
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
 * The run skill source of a host, as `renderSkill` takes it. The happy path
 * needs no reference file, so the source carries none. See `RunSkillHost`.
 */
export function runSkillSourceOf(host: RunSkillHost & { budgets: RunSkillBudgets }): SkillSource {
  const body = runSkillBodyOf(host);
  host.budgets.assertBodyFitsItsLimit(RUN_SKILL_LOGICAL_ID, body);
  return Object.freeze({
    logicalId: RUN_SKILL_LOGICAL_ID,
    body,
    references: Object.freeze([]),
    budget: host.budgets.totalBytes,
  });
}
