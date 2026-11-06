/**
 * The run skill source of `src/skill-run.ts`: the order of the steps, the
 * outcome lines of `launch` (READ from the handshake contract), the modes,
 * the comment, and the body built from them. The sample hosts here are
 * deliberately NOT the host the module moved out of — the point of the move
 * is that any host's sections, its Modes paragraph and its budgets build the
 * skill, and that the kit source names no host and no requirement of one.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  HANDSHAKE_OUTCOMES,
  REFUSAL_CODE,
  handshakeRow,
} from "@specstride/contracts/state/handshake";
import { HOST_SKILL_IDS, THE_COMMENT_CANNOT_BYPASS } from "@specstride/contracts/ep/host";
import type { RunSkillSections } from "../src/skill-run.ts";
import type { ProhibitionTrace } from "../src/skill-common.ts";
import {
  audienceNoticeSectionOf,
  dataFramingSection,
  judgmentSectionOf,
  prohibitionSectionOf,
  prohibitionsOf,
  supervisionSectionOf,
} from "../src/skill-common.ts";
import {
  COMMENT_BYPASS_PATTERNS,
  COMMENT_FLAG,
  COMMENT_SELECTABLE_OPTIONS,
  DEFAULT_MODE,
  DRY_RUN_LAUNCHES,
  DRY_RUN_LAST_STEP,
  DRY_RUN_PRINTS,
  FAILED_LAUNCH_CHECK_IS,
  LAUNCH_OUTCOME_ACTIONS,
  LAUNCH_OUTCOMES,
  MODES,
  NO_FINISHED_FEATURE_LINE,
  PRINTS_A_STATE_IT_DID_NOT_READ,
  PRINTS_THE_LINE_THAT_NAMES_THE_FIX,
  REFUSAL_EXIT_CODE,
  RELAYS_AN_OPTION_REFUSAL_VERBATIM,
  RUN_SKILL_DESCRIPTION,
  RUN_SKILL_LOGICAL_ID,
  RUN_STEPS,
  RUN_STEP_IDS,
  STOPS_AT_THE_FIRST_REFUSAL,
  callArguments,
  commentAsksToBypassACheck,
  commentInvitesALaunch,
  commentRefusesToRun,
  decideMode,
  outcomeNote,
  retriesAfter,
  runSkillBodyOf,
  runSkillSourceOf,
  stepsOfMode,
  stepsUpTo,
  supervisesAfter,
} from "../src/skill-run.ts";
import { DIGEST_STEP_TEXT } from "../src/skill-common.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

/** The traceability of a host's prohibitions, in its own register. */
const TRACE: Readonly<Record<string, ProhibitionTrace>> = {
  "no-repository-write": { requirement: "the file rule", origin: "R-1" },
  "no-verification-file": { requirement: "the plan rule", origin: "R-2" },
  "no-cli-search": { requirement: "the search rule", origin: "R-3" },
  "logical-names-only": { requirement: "the naming rule", origin: "R-4" },
  "no-launcher-edit": { requirement: "the edit rule", origin: null },
  "supervision-reads-only": { requirement: "the read rule", origin: "R-6" },
};

/** The sections of a host, built the way a host builds them: over its figures. */
function sectionsOf(host: {
  delegatesToAHarness: boolean;
  backgroundPresent: boolean;
  cycleTokenBudget: number;
  runSupervisionTokenBudget: number;
  harnessClause: string;
  authTier: string;
}): RunSkillSections {
  return Object.freeze({
    judgment: judgmentSectionOf({ delegatesToAHarness: host.delegatesToAHarness }),
    supervision: supervisionSectionOf({
      backgroundPresent: host.backgroundPresent,
      cycleTokenBudget: host.cycleTokenBudget,
      runSupervisionTokenBudget: host.runSupervisionTokenBudget,
    }),
    audienceNotice: audienceNoticeSectionOf({
      harnessClause: host.harnessClause,
      authTier: host.authTier,
    }),
    dataFraming: dataFramingSection(),
    prohibitions: prohibitionSectionOf(prohibitionsOf(TRACE)),
  });
}

/**
 * The plain host: no judgment delegation, foreground supervision at 100/2000
 * tokens, the auth of Tier 1, and a Modes paragraph about a predecessor whose
 * one mode was `plan`.
 */
const PLAIN_HOST = {
  sections: sectionsOf({
    delegatesToAHarness: false,
    backgroundPresent: false,
    cycleTokenBudget: 100,
    runSupervisionTokenBudget: 2_000,
    harnessClause: "with the plain host's harness",
    authTier: "Tier 1",
  }),
  oldModeNamesLine: "The old mode names map: `plan` → `run`.",
};

/** A second host: delegation, background supervision at 250/4000, Tier 2. */
const SECOND_HOST = {
  sections: sectionsOf({
    delegatesToAHarness: true,
    backgroundPresent: true,
    cycleTokenBudget: 250,
    runSupervisionTokenBudget: 4_000,
    harnessClause: "with the second host's harness",
    authTier: "Tier 2",
  }),
  oldModeNamesLine: "There was no predecessor; the modes of this host are fixed.",
};

/** The budgets a host passes: the total of its profile, and its body check. */
function budgetsOf(totalBytes: number, bodyLimit: number) {
  return {
    totalBytes,
    assertBodyFitsItsLimit(logicalId: string, body: string): void {
      const bytes = Buffer.byteLength(body, "utf8");
      if (bytes > bodyLimit) {
        throw new Error(`budget-exceeded: the body of \`${logicalId}\` is ${bytes} bytes`);
      }
    },
  };
}

/* ------------------------------------------------------- the declarations */

test("the skill is declared under the contracts' own first host skill id", () => {
  assert.equal(RUN_SKILL_LOGICAL_ID, HOST_SKILL_IDS[0]);
  assert.equal(RUN_SKILL_LOGICAL_ID, "specstride-run");
});

test("the ten steps are in order, and the digest step is the kit's own text", () => {
  assert.deepEqual(
    [...RUN_STEP_IDS],
    [
      "capture-the-comment",
      "cli-check",
      "derive",
      "judge",
      "validate",
      "render",
      "launch",
      "outcome-line",
      "supervise",
      "digest",
    ],
  );
  assert.deepEqual([...RUN_STEPS.map((step) => step.number)], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  // The digest text is the shared module's by identity, never spelled twice.
  const digest = RUN_STEPS.find((step) => step.id === "digest");
  assert.equal(digest?.text, DIGEST_STEP_TEXT);
  // A refusal stops at the step that refused and no later one.
  assert.deepEqual(
    [...stepsUpTo("validate").map((step) => step.id)],
    ["capture-the-comment", "cli-check", "derive", "judge", "validate"],
  );
  assert.throws(() => stepsUpTo("nonsense"), /`specstride-run` has no step `nonsense`/);
  assert.equal(STOPS_AT_THE_FIRST_REFUSAL, true);
  assert.equal(PRINTS_THE_LINE_THAT_NAMES_THE_FIX, true);
  assert.match(NO_FINISHED_FEATURE_LINE, /^No finished feature/);
});

test("the launch outcomes are READ from the handshake contract", () => {
  assert.equal(LAUNCH_OUTCOMES, HANDSHAKE_OUTCOMES);
  assert.deepEqual([...LAUNCH_OUTCOMES], ["started", "attached", "refused"]);
  assert.equal(REFUSAL_EXIT_CODE, REFUSAL_CODE);
  assert.equal(outcomeNote("started"), handshakeRow("started")?.meaning);
  assert.equal(supervisesAfter("started"), true);
  assert.equal(supervisesAfter("attached"), true);
  assert.equal(supervisesAfter("refused"), false);
  for (const outcome of LAUNCH_OUTCOMES) {
    assert.equal(retriesAfter(outcome), false, `the skill retries after \`${outcome}\``);
    assert.ok(LAUNCH_OUTCOME_ACTIONS[outcome].length > 0, `no action recorded for \`${outcome}\``);
  }
  assert.equal(PRINTS_A_STATE_IT_DID_NOT_READ, false);
});

test("the modes and the decision read the annexes and no host", () => {
  assert.deepEqual([...MODES], ["run", "dry-run"]);
  assert.equal(DEFAULT_MODE, "run");
  assert.equal(DRY_RUN_LAUNCHES, false);
  assert.equal(DRY_RUN_LAST_STEP, "validate");
  assert.equal(DRY_RUN_PRINTS, "the plan");
  assert.equal(FAILED_LAUNCH_CHECK_IS, "a finding");
  // `dry-run` reaches validation and never launch.
  const dry = stepsOfMode("dry-run").map((step) => step.id);
  assert.ok(dry.includes("derive") && dry.includes("validate"));
  assert.equal(dry.includes("launch"), false);
  assert.deepEqual([...stepsOfMode("run").map((step) => step.id)], [...RUN_STEP_IDS]);

  // An explicit mode beats prose in the comment.
  const explicit = decideMode({ explicit: "run", comment: "do not run yet" });
  assert.equal(explicit.mode, "run");
  assert.equal(explicit.source, "the explicit mode of the consumer");
  assert.equal(explicit.changedByTheComment, false);
  // A refusal in the comment beats an invitation and gives `dry-run`.
  const refusal = decideMode({ comment: "run it, but do not run yet" });
  assert.equal(refusal.mode, "dry-run");
  assert.equal(refusal.source, "a refusal in the comment");
  assert.equal(refusal.changedByTheComment, true);
  assert.match(refusal.saysWhatChanged ?? "", /refuses a launch, so the mode is `dry-run`/);
  assert.deepEqual([...refusal.commentSelects], ["mode"]);
  // An invitation gives `run`; no input at all gives the default.
  assert.equal(decideMode({ comment: "go ahead and run it" }).mode, "run");
  assert.equal(
    decideMode({ comment: "go ahead and run it" }).source,
    "an invitation in the comment",
  );
  const plain = decideMode({});
  assert.equal(plain.mode, DEFAULT_MODE);
  assert.equal(plain.source, "the default");
  assert.equal(plain.saysWhatChanged, null);
  // The prose of the request outside the comment is accepted and IGNORED.
  assert.deepEqual(decideMode({ requestProse: "start everything now" }), plain);
  // An unknown explicit mode throws; nothing defaults it.
  assert.throws(() => decideMode({ explicit: "bogus" }), /`specstride-run` has no mode `bogus`/);
});

test("the comment rules are the port's, and the flags are the annex's row 283", () => {
  assert.equal(commentRefusesToRun("please do not run yet"), true);
  assert.equal(commentInvitesALaunch("run this one"), true);
  assert.equal(commentAsksToBypassACheck("skip the launch check"), true);
  assert.equal(commentAsksToBypassACheck("bypass the terms gate"), true);
  assert.equal(commentAsksToBypassACheck("raise the budget"), true);
  assert.equal(commentAsksToBypassACheck("and please run it"), false);
  // Every bypass ask the port names is covered by some pattern of the kit.
  assert.ok(COMMENT_BYPASS_PATTERNS.length >= 3);
  assert.deepEqual([...COMMENT_SELECTABLE_OPTIONS], ["features", "relaunch", "learning", "mode"]);
  assert.deepEqual(
    [...callArguments("contract derive", "the comment", ["features"])],
    [COMMENT_FLAG, "the comment", "--comment-selects", "features"],
  );
  // A selectable option is recorded only on the call it belongs to.
  assert.deepEqual(
    [...callArguments("launch", "the comment", ["features", "mode"])],
    [COMMENT_FLAG, "the comment", "--comment-selects", "mode"],
  );
  assert.throws(
    () => callArguments("launch", "c", ["nonsense"]),
    /row 283 of annex X §X\.6 holds no option `nonsense`/,
  );
  assert.equal(RELAYS_AN_OPTION_REFUSAL_VERBATIM, true);
  assert.ok(RUN_SKILL_DESCRIPTION.length > 0);
});

/* ------------------------------------------------------- the body and host */

test("the body is built from a host's sections and its own Modes paragraph", () => {
  const plain = runSkillBodyOf(PLAIN_HOST);
  const second = runSkillBodyOf(SECOND_HOST);

  // The same steps, the same annex lines, byte for byte.
  for (const line of [
    "# Run Specstride",
    "1. Capture the consumer's comment VERBATIM",
    "2. Run the shim's CLI check",
    "- Stop at the FIRST refusal and print the line of the CLI that names the fix",
    `- In \`dry-run\`: derive and validate, print ${DRY_RUN_PRINTS}, and STOP. Never launch.`,
    `- A failed launch check shown in the plan is ${FAILED_LAUNCH_CHECK_IS}, NOT a failure of `,
    "`started`: print the line and supervise the run that started.",
    "`refused`: print the refusal line and do not retry unless the consumer asks.",
  ]) {
    assert.ok(plain.includes(line), `the body must carry ${JSON.stringify(line)}`);
  }
  assert.ok(plain.includes(`- ${PLAIN_HOST.oldModeNamesLine}`));
  assert.ok(second.includes(`- ${SECOND_HOST.oldModeNamesLine}`));
  assert.equal(plain.includes(SECOND_HOST.oldModeNamesLine), false);

  // Each host's figures appear in its own body and in nobody else's.
  for (const own of ["100 tokens", "stays within 2000 tokens", "Tier 1", "plain host's harness"]) {
    assert.ok(plain.includes(own), `the plain host's body must carry ${own}`);
    assert.equal(second.includes(own), false, `the second host's body must not carry ${own}`);
  }
  for (const own of [
    "offers a background primitive",
    "stays within 4000 tokens",
    "Tier 2",
    "second host's harness",
  ]) {
    assert.ok(second.includes(own), `the second host's body must carry ${own}`);
    assert.equal(plain.includes(own), false, `the plain host's body must not carry ${own}`);
  }

  // The bypass rule of the body is the port's, read from the contracts.
  const bypassList = [...THE_COMMENT_CANNOT_BYPASS];
  assert.ok(
    plain.includes(
      `The comment cannot bypass ${bypassList.slice(0, -1).join(", ")} or ` +
        `${bypassList[bypassList.length - 1]}.`,
    ),
  );

  // The same inputs give the same bytes; a different paragraph, a different body.
  assert.equal(runSkillBodyOf(PLAIN_HOST), plain);
  assert.notEqual(plain, second);
});

test("the source is frozen, carries no reference, and refuses an over-budget body", () => {
  const source = runSkillSourceOf({ ...PLAIN_HOST, budgets: budgetsOf(11_200, 9_000) });
  assert.equal(source.logicalId, RUN_SKILL_LOGICAL_ID);
  assert.equal(source.budget, 11_200);
  assert.deepEqual([...source.references], []);
  assert.equal(source.body, runSkillBodyOf(PLAIN_HOST));
  assert.equal(Object.isFrozen(source), true);

  // A host whose body limit the body exceeds FAILS THE BUILD.
  assert.throws(
    () => runSkillSourceOf({ ...PLAIN_HOST, budgets: budgetsOf(11_200, 100) }),
    /budget-exceeded/,
  );
});

/* ------------------------------------------------------------- neutrality */

test("the kit source names no host, no predecessor and no requirement of one", () => {
  const src = readFileSync(join(HERE, "../src/skill-run.ts"), "utf8");
  for (const foreign of [
    "CLAUDE",
    "Claude",
    "claude plugin",
    ".claude-plugin",
    "/specstride:",
    "specstride-",
    "F113-FR",
    "DV-0",
    "FX-3",
    "the old skill",
    "`generate`",
    "`auto`",
    "Tier 2",
    "22,400",
    "8,000",
  ]) {
    assert.equal(src.includes(foreign), false, `src/skill-run.ts must not hold ${foreign}`);
  }
  // The provenance PATH of the move is allowed.
  assert.ok(src.includes("packages/host-claude-code/src/skill-run.ts"));
});
