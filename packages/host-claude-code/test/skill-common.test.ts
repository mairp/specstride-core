/**
 * The binding of `src/skill-common.ts`: the shared sections of the three
 * skill sources are the kit's (`@specstride/host-kit`, `src/skill-common.ts`),
 * and this module holds only the facts of THIS host and the bindings of the
 * kit's `*Of` functions to them.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROHIBITION_TEXTS as KIT_PROHIBITION_TEXTS,
  audienceNoticeSectionOf as kitNoticeSectionOf,
  audienceNoticeTextOf as kitNoticeTextOf,
  dataFramingSection as kitDataFramingSection,
  judgmentSectionOf as kitJudgmentSectionOf,
  prohibitionsOf,
  prohibitionSectionOf as kitProhibitionSectionOf,
  supervisionSectionOf as kitSupervisionSectionOf,
  waitRunsInTheBackgroundOf as kitWaitRunsInTheBackgroundOf,
  type ProhibitionTrace,
} from "@specstride/host-kit";
import { CAPABILITY_DECLARATIONS, declarationOf } from "../src/describe/index.ts";
import { TOKEN_BUDGETS } from "../src/render/index.ts";
import {
  AUTH_TIER_WITH_CLAUDE_AS_HARNESS,
  CYCLE_TOKEN_BUDGET,
  DELEGATION_TO_A_HARNESS_IS_USED,
  HARNESS_AUTH_CLAUSE,
  PROHIBITIONS,
  PROHIBITION_IDS,
  RUN_SUPERVISION_TOKEN_BUDGET,
  audienceNoticeSection,
  audienceNoticeText,
  dataFramingSection,
  judgmentSection,
  prohibitionOf,
  prohibitionSection,
  supervisionBudgetTokens,
  supervisionSection,
  waitRunsInTheBackground,
} from "../src/skill-common.ts";

/** The auth facts of this host, exactly as the module binds them. */
const AUTH_FACTS_OF_THIS_HOST = {
  harnessClause: HARNESS_AUTH_CLAUSE,
  authTier: AUTH_TIER_WITH_CLAUDE_AS_HARNESS,
};

/** The traceability of this host, exactly as the module binds it. */
const TRACEABILITY_OF_THIS_HOST: Readonly<Record<string, ProhibitionTrace>> = {
  "no-repository-write": { requirement: "F113-FR-009", origin: "B-2661" },
  "no-verification-file": { requirement: "F113-FR-010", origin: "B-2662" },
  "no-cli-search": { requirement: "F113-FR-011", origin: "B-2663" },
  "logical-names-only": { requirement: "F113-FR-011", origin: "B-2664" },
  "no-launcher-edit": { requirement: "F113-FR-011", origin: "B-2666" },
  "supervision-reads-only": { requirement: "F113-FR-012", origin: "B-2668" },
};

/* ------------------------------------------------- the binding to the kit */

test("T008: the shared sections are the kit's; this module binds only this host's facts", () => {
  // The prohibition TEXTS are the kit's own entries, built by the kit's own
  // builder over this host's traceability — the requirement of F113-FR-009 to
  // F113-FR-012 that fixes each text and the behaviour row of the old skill's
  // inventory it was translated from.
  assert.deepEqual(PROHIBITIONS, prohibitionsOf(TRACEABILITY_OF_THIS_HOST));
  assert.deepEqual(
    PROHIBITIONS.map((p) => ({ id: p.id, text: p.text })),
    KIT_PROHIBITION_TEXTS.map((p) => ({ id: p.id, text: p.text })),
  );
  assert.deepEqual(
    [...PROHIBITION_IDS],
    PROHIBITIONS.map((p) => p.id),
  );
  const noWrite = prohibitionOf("no-repository-write");
  assert.ok(noWrite !== undefined);
  assert.equal(noWrite.requirement, "F113-FR-009");
  assert.equal(noWrite.origin, "B-2661");
  const supervision = prohibitionOf("supervision-reads-only");
  assert.ok(supervision !== undefined);
  assert.equal(supervision.requirement, "F113-FR-012");
  assert.equal(supervision.origin, "B-2668");
  assert.deepEqual([...prohibitionSection()], [...kitProhibitionSectionOf(PROHIBITIONS)]);

  // The supervision figures are this host's F113-FR-036 budgets, read from
  // the one table of the requirement, so the sentences cannot drift from it.
  assert.equal(CYCLE_TOKEN_BUDGET, 150);
  assert.equal(CYCLE_TOKEN_BUDGET, TOKEN_BUDGETS["supervision-cycle"]);
  assert.equal(RUN_SUPERVISION_TOKEN_BUDGET, 3_000);
  assert.equal(RUN_SUPERVISION_TOKEN_BUDGET, TOKEN_BUDGETS["run-supervision"]);
  assert.equal(supervisionBudgetTokens("root"), RUN_SUPERVISION_TOKEN_BUDGET);
  assert.equal(supervisionBudgetTokens("supervise"), null);
  assert.deepEqual(
    [...supervisionSection()],
    [
      ...kitSupervisionSectionOf({
        backgroundPresent: waitRunsInTheBackground(),
        cycleTokenBudget: CYCLE_TOKEN_BUDGET,
        runSupervisionTokenBudget: RUN_SUPERVISION_TOKEN_BUDGET,
      }),
    ],
  );
  // This host declares no background primitive, so the wait runs in the
  // foreground — read from the declarations of `describe`, as before.
  assert.equal(declarationOf("background")?.present, false);
  assert.equal(waitRunsInTheBackground(), false);
  assert.equal(waitRunsInTheBackground(), kitWaitRunsInTheBackgroundOf(CAPABILITY_DECLARATIONS));

  // The auth facts of F113-FR-016 are this host's: the clause that names the
  // harness (the harness, not the host) and the tier it yields.
  assert.equal(HARNESS_AUTH_CLAUSE, "with Claude as harness");
  assert.equal(AUTH_TIER_WITH_CLAUDE_AS_HARNESS, "Tier 2");
  assert.equal(audienceNoticeText(), kitNoticeTextOf(AUTH_FACTS_OF_THIS_HOST));
  assert.deepEqual([...audienceNoticeSection()], [...kitNoticeSectionOf(AUTH_FACTS_OF_THIS_HOST)]);
  assert.match(audienceNoticeText(), /default auth tier is Tier 2/);
  assert.match(audienceNoticeText(), /I will not set it for you/);

  // This host has a model: the judgment section carries its bullet.
  assert.equal(DELEGATION_TO_A_HARNESS_IS_USED, false);
  assert.deepEqual(
    [...judgmentSection()],
    [...kitJudgmentSectionOf({ delegatesToAHarness: DELEGATION_TO_A_HARNESS_IS_USED })],
  );
  assert.match(judgmentSection().join("\n"), /never delegate the judgment to a harness/);

  // The data framing moved unchanged: the binding is the kit's own function.
  assert.equal(dataFramingSection, kitDataFramingSection);
});
