/**
 * The generic render of the host port EP-01 (`specstride.host/1`,
 * `contracts/host-package.md`): `renderEntry` — the host's spelling of a
 * command —, `renderSkill` — a skill directory with body and references — and
 * the byte budgets with their `budget-exceeded` check.
 *
 * A HOST SUPPLIES ITS RENDERING TABLES; THE KIT RENDERS. Everything that
 * names a host is an INPUT of every function here, gathered in one
 * `SkillRenderProfile`: the rate budgets are measured at, the token budgets
 * with the byte numbers the host's requirement prints beside them, the cap on
 * the lines of a body, the cap on a description, the file a skill's text lies
 * in, the directory the skills lie in, and the host's spelling of each
 * logical id of row 144. What the kit fixes is everything that must not drift
 * from the annex: the front matter a rendered skill carries, the references
 * section, the two errors (`budget-exceeded`, the unknown logical id that
 * FAILS THE BUILD), and the arithmetic that holds the printed byte numbers
 * against the product of the token budgets and the rate, so the two cannot
 * drift.
 *
 * The module moved here from `packages/host-claude-code/src/render/index.ts`
 * (the split of the monorepo, U-1 and U-2 of `specs/120-host-dsh`), which
 * keeps the old path and binds these functions to its host's own tables. It
 * runs in the BUILD, not on the consumer's machine, so it imports
 * `@specstride/contracts`; the shim core of this kit may not.
 */
import {
  CONTEXT_COST_CHECKS,
  HOST_SKILL_AND_ENTRY_IDS,
} from "@specstride/contracts/ep/context-cost";
import { unknownLogicalIdMessage } from "@specstride/contracts/ep/host";
import type { HostArtifact, SkillSource } from "@specstride/contracts/ep/host";

/* -------------------------------------------------------------------------
 * The check of the context-cost build this module performs
 * ---------------------------------------------------------------------- */

/**
 * The check of the context-cost build the render performs: "static size", the
 * first of the seven checks of row 145 of annex X §X.6, read from the
 * contracts and never spelled out here.
 */
export const STATIC_SIZE_CHECK = CONTEXT_COST_CHECKS[0];

if (STATIC_SIZE_CHECK !== "static size") {
  throw new Error(
    `the first of the seven checks of the context-cost build is "static size"; row 145 of ` +
      `annex X §X.6 gives "${STATIC_SIZE_CHECK}"`,
  );
}

/* -------------------------------------------------------------------------
 * The rendering tables of a host
 * ---------------------------------------------------------------------- */

/**
 * The rendering tables a host passes to every function of this module. The
 * kit takes no default of any of them: a host that forgot its tables cannot
 * compile into a second host by accident.
 */
export type SkillRenderProfile = {
  /** The rate budgets are measured at, in bytes per token. */
  readonly bytesPerToken: number;
  /** The cap on the lines of the body of a rendered skill. */
  readonly maxBodyLines: number;
  /** The cap on a rendered description, in characters. */
  readonly descriptionCap: number;
  /** The file of a skill inside the skill's own directory. */
  readonly skillFile: string;
  /** The directory the skills of the host lie in. */
  readonly skillsDirectory: string;
  /** The host's spelling of each logical id it renders. */
  readonly spellings: Readonly<Record<string, string>>;
  /** The token budgets, keyed by the thing each budget belongs to. */
  readonly tokenBudgets: Readonly<Record<string, number>>;
  /**
   * The byte numbers the host's budget requirement PRINTS, one per token
   * budget, held against the product at load by `assertBudgetTables`.
   */
  readonly printedByteBudgets: Readonly<Record<string, number>>;
  /**
   * The requirement the budget message names — a host's own id, in the host's
   * own words. The kit spells no requirement of any host.
   */
  readonly budgetRequirement: string;
};

/** The bytes a token budget allows, at the rate of the profile. */
export function bytesForTokens(tokens: number, bytesPerToken: number): number {
  // A rate of 2.8 has no exact binary form: 8000 * 2.8 is 22400.000000000004.
  // The printed byte numbers of a budget requirement are whole bytes, so the
  // product is rounded.
  return Math.round(tokens * bytesPerToken);
}

/** The byte budgets of a profile, computed from its token budgets at its rate. */
export function byteBudgetsOf(profile: SkillRenderProfile): Readonly<Record<string, number>> {
  return Object.freeze(
    Object.fromEntries(
      Object.keys(profile.tokenBudgets).map((id) => [
        id,
        bytesForTokens(profile.tokenBudgets[id] ?? 0, profile.bytesPerToken),
      ]),
    ),
  );
}

/**
 * The load-time check of a profile: every byte number the requirement prints
 * must be the product of the token budget and the rate, so the printed
 * figures and the arithmetic cannot drift. A host calls this once, at load,
 * with its own tables.
 */
export function assertBudgetTables(profile: SkillRenderProfile): void {
  const budgets = byteBudgetsOf(profile);
  for (const id of Object.keys(profile.tokenBudgets)) {
    const printed = profile.printedByteBudgets[id];
    const computed = budgets[id];
    if (printed === undefined || computed !== printed) {
      throw new Error(
        `${profile.budgetRequirement} prints ${printed} bytes for \`${id}\`, and ` +
          `${profile.tokenBudgets[id]} tokens at ${profile.bytesPerToken} bytes per token is ` +
          `${computed}`,
      );
    }
  }
}

/* -------------------------------------------------------------------------
 * The two errors of the build
 * ---------------------------------------------------------------------- */

/**
 * `budget-exceeded` of annex H §H.1: it FAILS THE BUILD. The error carries the
 * check, the measured bytes and the limit, so that a line of the report file
 * can be written from it (data-model.md, "Check result"); the requirement the
 * message names is the profile's.
 */
export class BudgetExceededError extends Error {
  /** The error of annex H §H.1, by its name in the closed set of errors. */
  readonly code = "budget-exceeded" as const;
  readonly check: string;
  readonly measured: number;
  readonly limit: number;
  readonly unit: "bytes" | "lines" | "characters";
  constructor(args: {
    readonly check: string;
    readonly measured: number;
    readonly limit: number;
    readonly unit: "bytes" | "lines" | "characters";
    readonly subject: string;
    readonly requirement: string;
  }) {
    super(
      `budget-exceeded: ${args.subject} measures ${args.measured} ${args.unit} and the limit ` +
        `is ${args.limit} (check "${args.check}", ${args.requirement})`,
    );
    this.name = "BudgetExceededError";
    this.check = args.check;
    this.measured = args.measured;
    this.limit = args.limit;
    this.unit = args.unit;
  }
}

/**
 * The unknown-value rule of annex H §H.1 and of row 144 of annex X §X.6: an
 * unknown logical id of a skill or a command FAILS THE BUILD. It is not one of
 * the three errors of §H.1: it is the build refusing. The message is the
 * contracts', so it cannot drift from the annex.
 */
export class UnknownLogicalIdError extends Error {
  readonly code = "unknown-logical-id" as const;
  readonly logicalId: string;
  constructor(logicalId: string) {
    super(unknownLogicalIdMessage(logicalId));
    this.name = "UnknownLogicalIdError";
    this.logicalId = logicalId;
  }
}

/* -------------------------------------------------------------------------
 * The check result (data-model.md, "Check result")
 * ---------------------------------------------------------------------- */

/** One line of the report file: check, measured bytes, limit, verdict. */
export type CheckResult = {
  readonly check: string;
  readonly subject: string;
  readonly measured: number;
  readonly limit: number;
  readonly unit: "bytes" | "lines" | "characters";
  readonly verdict: "pass" | "fail";
};

function result(
  subject: string,
  measured: number,
  limit: number,
  unit: "bytes" | "lines" | "characters",
): CheckResult {
  return Object.freeze({
    check: STATIC_SIZE_CHECK,
    subject,
    measured,
    limit,
    unit,
    verdict: measured <= limit ? ("pass" as const) : ("fail" as const),
  });
}

/* -------------------------------------------------------------------------
 * `renderEntry` — the host's spelling of a command
 * ---------------------------------------------------------------------- */

/**
 * The logical ids of skills and commands, row 144 of annex X §X.6, which a
 * host spells through its profile. Unknown value: the build fails.
 */
export function isLogicalId(logicalId: string): boolean {
  return (HOST_SKILL_AND_ENTRY_IDS as readonly string[]).includes(logicalId);
}

/**
 * `renderEntry` of EP-01: the host's spelling of a command, taken from the
 * spellings of the profile. An unknown logical id FAILS THE BUILD.
 */
export function renderEntry(logicalId: string, profile: SkillRenderProfile): string {
  const spelling = profile.spellings[logicalId];
  if (spelling === undefined) throw new UnknownLogicalIdError(logicalId);
  return spelling;
}

/**
 * The byte budget of a logical id, from the profile: the budget of the id
 * itself, else the budget of the logical id the id is the spelling of. There
 * is no budget the profile does not name.
 */
export function byteBudgetOf(logicalId: string, profile: SkillRenderProfile): number | undefined {
  const bySpelling = Object.fromEntries(
    Object.entries(profile.spellings).map(([logical, spelling]) => [spelling, logical]),
  );
  const key = profile.tokenBudgets[logicalId] !== undefined ? logicalId : bySpelling[logicalId];
  if (key === undefined || profile.tokenBudgets[key] === undefined) return undefined;
  return bytesForTokens(profile.tokenBudgets[key] ?? 0, profile.bytesPerToken);
}

/* -------------------------------------------------------------------------
 * `renderSkill` — a skill directory with body and references
 * ---------------------------------------------------------------------- */

/** The path of a skill's own file, in the layout the profile spells. */
export function skillPath(logicalId: string, profile: SkillRenderProfile): string {
  return `${profile.skillsDirectory}/${renderEntry(logicalId, profile)}/${profile.skillFile}`;
}

/**
 * The description of a rendered skill: the caller's, else the first non-empty
 * line of the body with the markers of a heading removed. It is capped at the
 * profile's `descriptionCap`, and a longer one FAILS THE BUILD rather than
 * being cut, so that no skill ships a description the host would truncate.
 */
export function descriptionFor(
  source: SkillSource,
  profile: SkillRenderProfile,
  given?: string,
): string {
  const first = source.body
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line !== "");
  const description = (given ?? first ?? "").replace(/^#+\s*/, "").trim();
  if (description.length > profile.descriptionCap) {
    throw new BudgetExceededError({
      check: STATIC_SIZE_CHECK,
      measured: description.length,
      limit: profile.descriptionCap,
      unit: "characters",
      subject: `the description of the skill \`${source.logicalId}\``,
      requirement: profile.budgetRequirement,
    });
  }
  return description;
}

/** The lines of the "References" section of a rendered skill, or none. */
function referenceLines(source: SkillSource): readonly string[] {
  if (source.references.length === 0) return Object.freeze([]);
  const lines = ["", "## References", ""];
  for (const reference of source.references) {
    lines.push(`- \`${reference.path}\` — read when ${reference.readWhen}`);
  }
  return Object.freeze(lines);
}

/** The text of a rendered skill: the front matter, the body, the references. */
export function skillText(
  source: SkillSource,
  profile: SkillRenderProfile,
  options?: { readonly description?: string },
): string {
  const name = renderEntry(source.logicalId, profile);
  const description = descriptionFor(source, profile, options?.description);
  return [
    "---",
    `name: ${name}`,
    `description: ${JSON.stringify(description)}`,
    "---",
    "",
    source.body.replace(/\n+$/, ""),
    ...referenceLines(source),
    "",
  ].join("\n");
}

/**
 * The budget check of one rendered skill: the bytes of the artifact against
 * the limit, and the lines of the BODY against the profile's cap. The limit is
 * the smaller of the source's own budget and the byte budget the profile fixes
 * for that skill: a source may ask for less, never for more than the host's
 * tables allow.
 */
export function checkSkillBudget(
  source: SkillSource,
  bytes: number,
  profile: SkillRenderProfile,
): readonly [CheckResult, CheckResult] {
  const fixed = byteBudgetOf(source.logicalId, profile);
  const limit = fixed === undefined ? source.budget : Math.min(source.budget, fixed);
  const bodyLines = source.body.split("\n").length;
  return Object.freeze([
    result(`the skill \`${source.logicalId}\``, bytes, limit, "bytes"),
    result(
      `the body of the skill \`${source.logicalId}\``,
      bodyLines,
      profile.maxBodyLines,
      "lines",
    ),
  ]);
}

/**
 * `renderSkill` of EP-01: the artifact of one skill for a host — the file of
 * the skill at the path the profile spells, with the body and the references.
 * It fails with `budget-exceeded` over the byte limit and over the cap on the
 * lines of the body, and with `UnknownLogicalIdError` for a logical id outside
 * row 144.
 */
export function renderSkill(
  source: SkillSource,
  profile: SkillRenderProfile,
  options?: { readonly description?: string },
): HostArtifact {
  const content = skillText(source, profile, options);
  const bytes = Buffer.byteLength(content, "utf8");
  for (const checked of checkSkillBudget(source, bytes, profile)) {
    if (checked.verdict === "fail") {
      throw new BudgetExceededError({
        check: checked.check,
        measured: checked.measured,
        limit: checked.limit,
        unit: checked.unit,
        subject: checked.subject,
        requirement: profile.budgetRequirement,
      });
    }
  }
  return Object.freeze({ path: skillPath(source.logicalId, profile), bytes, content });
}

/**
 * The whole skill DIRECTORY: the skill's own file, and one artifact per
 * reference that the source carries text for. A reference the source names
 * without text is listed in the skill's file and rendered by the task that
 * writes it; the directory is then the one file.
 */
export function renderSkillDirectory(
  source: SkillSource,
  profile: SkillRenderProfile,
  options?: { readonly description?: string },
): readonly HostArtifact[] {
  return Object.freeze([renderSkill(source, profile, options)]);
}
