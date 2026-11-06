/**
 * The generic render of `src/render.ts`: a host supplies its rendering tables
 * in one `SkillRenderProfile` and the kit renders through them, holding the
 * printed byte numbers against the arithmetic at load.
 *
 * The two sample hosts here are deliberately NOT the host the module moved out
 * of: the point of the move is that any host's tables render, that every
 * host-only figure — the rate, the caps, the layout, the spellings, the
 * requirement a budget message names — is an input, and that the kit source
 * names no host at all.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DOCTOR_SKILL_ID, HOST_SKILL_IDS } from "@specstride/contracts/ep/host";
import type { SkillSource } from "@specstride/contracts/ep/host";
import {
  STATIC_SIZE_CHECK,
  BudgetExceededError,
  UnknownLogicalIdError,
  assertBudgetTables,
  byteBudgetOf,
  byteBudgetsOf,
  bytesForTokens,
  checkSkillBudget,
  descriptionFor,
  isLogicalId,
  renderEntry,
  renderSkill,
  renderSkillDirectory,
  skillPath,
  type SkillRenderProfile,
} from "../src/render.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * The plain host: the second spelling the split asks the kit to render — the
 * logical id `doctor` spelled as the product's own contract spells the doctor
 * skill, a 500-character description cap, no namespace of any kind — with a
 * layout of `skills/<spelling>/SKILL.md` and the rate of 2.8 bytes per token.
 */
const PLAIN: SkillRenderProfile = {
  bytesPerToken: 2.8,
  maxBodyLines: 200,
  descriptionCap: 500,
  skillFile: "SKILL.md",
  skillsDirectory: "skills",
  spellings: {
    [HOST_SKILL_IDS[0]]: HOST_SKILL_IDS[0],
    doctor: DOCTOR_SKILL_ID,
  },
  tokenBudgets: { doctor: 1_000, [HOST_SKILL_IDS[0]]: 4_000 },
  printedByteBudgets: { doctor: 2_800, [HOST_SKILL_IDS[0]]: 11_200 },
  budgetRequirement: "the plain host's budget requirement",
};

/**
 * A second host whose every table differs: a rate of 4, caps of 300 characters
 * and 80 lines, an unprefixed spelling of `doctor`, and the layout
 * `commands/<spelling>/ENTRY.md`.
 */
const WIDE: SkillRenderProfile = {
  bytesPerToken: 4,
  maxBodyLines: 80,
  descriptionCap: 300,
  skillFile: "ENTRY.md",
  skillsDirectory: "commands",
  spellings: { doctor: "doctor" },
  tokenBudgets: { doctor: 500 },
  printedByteBudgets: { doctor: 2_000 },
  budgetRequirement: "the other host's budget requirement",
};

/** A skill source, as a caller of the kit hands one in. */
function source(logicalId: string, body: string, budget = 22_400): SkillSource {
  return {
    logicalId,
    body,
    references: [{ path: "references/modes.md", readWhen: "the consumer names a mode" }],
    budget,
  };
}

/* ------------------------------------------------------------ the tables */

test("the tables of a host are held against their own arithmetic at load", () => {
  // A consistent profile loads; the printed bytes are the product, at either
  // rate (2.8 has no exact binary form: the product is rounded).
  assert.doesNotThrow(() => assertBudgetTables(PLAIN));
  assert.doesNotThrow(() => assertBudgetTables(WIDE));
  assert.equal(bytesForTokens(8_000, 2.8), 22_400);
  assert.equal(bytesForTokens(150, 2.8), 420);
  assert.equal(bytesForTokens(500, 4), 2_000);
  assert.deepEqual({ ...byteBudgetsOf(PLAIN) }, { doctor: 2_800, [HOST_SKILL_IDS[0]]: 11_200 });
  assert.deepEqual({ ...byteBudgetsOf(WIDE) }, { doctor: 2_000 });

  // A printed number that is not the product fails at load, in the words of
  // the profile's own requirement — never in a requirement of the kit.
  const drifted: SkillRenderProfile = {
    ...PLAIN,
    printedByteBudgets: { ...PLAIN.printedByteBudgets, doctor: 2_799 },
  };
  assert.throws(
    () => assertBudgetTables(drifted),
    (error: unknown) => {
      assert.match((error as Error).message, /prints 2799 bytes for `doctor`/);
      assert.match((error as Error).message, /1000 tokens at 2\.8 bytes per token is 2800/);
      assert.ok((error as Error).message.includes(PLAIN.budgetRequirement));
      return true;
    },
  );

  // And the check the kit performs is the first of the seven of the annex.
  assert.equal(STATIC_SIZE_CHECK, "static size");
});

/* ---------------------------------------------------------- renderEntry */

test("`renderEntry` is the spelling the host passed, and an unknown id fails", () => {
  assert.equal(renderEntry("doctor", PLAIN), DOCTOR_SKILL_ID);
  assert.equal(renderEntry(HOST_SKILL_IDS[0], PLAIN), HOST_SKILL_IDS[0]);
  // The second host spells `doctor` unprefixed, in its own directory layout.
  assert.equal(renderEntry("doctor", WIDE), "doctor");
  assert.equal(skillPath("doctor", PLAIN), `skills/${DOCTOR_SKILL_ID}/SKILL.md`);
  assert.equal(skillPath("doctor", WIDE), "commands/doctor/ENTRY.md");

  // Row 144 of the annex, and the unknown-value rule over it.
  assert.equal(isLogicalId("doctor"), true);
  assert.equal(isLogicalId(HOST_SKILL_IDS[0]), true);
  assert.equal(isLogicalId("teleport"), false);
  for (const profile of [PLAIN, WIDE]) {
    assert.throws(
      () => renderEntry("teleport", profile),
      (error: unknown) => {
        assert.ok(error instanceof UnknownLogicalIdError);
        assert.equal((error as UnknownLogicalIdError).code, "unknown-logical-id");
        assert.match((error as Error).message, /the build of the host package fails/);
        assert.match((error as Error).message, /teleport/);
        return true;
      },
    );
  }
});

/* ---------------------------------------------------------- renderSkill */

test("`renderSkill` renders through the second spelling, under the 500-character cap", () => {
  const rendered = renderSkill(
    source("doctor", "# The doctor\n\nRun the checks the product names."),
    PLAIN,
  );
  assert.equal(rendered.path, `skills/${DOCTOR_SKILL_ID}/SKILL.md`);
  assert.equal(rendered.bytes, Buffer.byteLength(rendered.content, "utf8"));
  // The front matter the kit fixes, the body, the references.
  assert.match(rendered.content, new RegExp(`^---\nname: ${DOCTOR_SKILL_ID}\n`));
  assert.match(rendered.content, /description: "The doctor"/);
  assert.match(rendered.content, /Run the checks the product names\./);
  assert.match(rendered.content, /## References/);
  assert.match(rendered.content, /- `references\/modes\.md` — read when the consumer names a mode/);
  assert.deepEqual(
    renderSkillDirectory(source("doctor", "# x"), PLAIN).map((a) => a.path),
    [`skills/${DOCTOR_SKILL_ID}/SKILL.md`],
  );
  // A description over the profile's cap fails rather than being cut; at the
  // cap it passes: the limit is inclusive.
  assert.equal(descriptionFor(source("doctor", "x"), PLAIN, "y".repeat(500)).length, 500);
  assert.throws(
    () => descriptionFor(source("doctor", "x"), PLAIN, "y".repeat(501)),
    (error: unknown) => {
      assert.ok(error instanceof BudgetExceededError);
      assert.equal((error as BudgetExceededError).unit, "characters");
      assert.equal((error as BudgetExceededError).limit, 500);
      return true;
    },
  );
  // A source with no reference renders no References section.
  assert.equal(
    renderSkill(
      { logicalId: "doctor", body: "# x", references: [], budget: 2_800 },
      PLAIN,
    ).content.includes("## References"),
    false,
  );
});

test("the layout, the rate and the caps are the profile's, not the kit's", () => {
  // The second host's layout and spelling, in full.
  const rendered = renderSkill(source("doctor", "# The doctor\n\nx"), WIDE);
  assert.equal(rendered.path, "commands/doctor/ENTRY.md");
  assert.match(rendered.content, /^---\nname: doctor\n/);

  // The budgets come from the profile at its rate: 500 tokens at 4 is 2,000.
  assert.equal(byteBudgetOf("doctor", WIDE), 2_000);
  assert.equal(byteBudgetOf("doctor", PLAIN), 2_800);
  // A spelling resolves to the budget of the logical id it spells.
  assert.equal(byteBudgetOf(DOCTOR_SKILL_ID, PLAIN), 2_800);
  assert.equal(byteBudgetOf("nonsense", PLAIN), undefined);

  // The limit is the smaller of the source's own budget and the profile's.
  const modest = checkSkillBudget(source("doctor", "x", 1_000), 1_500, PLAIN);
  assert.equal(modest[0].limit, 1_000);
  assert.equal(modest[0].verdict, "fail");
  const greedy = checkSkillBudget(source("doctor", "x", 22_400), 3_000, PLAIN);
  assert.equal(greedy[0].limit, 2_800);
  assert.equal(greedy[0].verdict, "fail");
  const within = checkSkillBudget(source("doctor", "x"), 1_000, PLAIN);
  assert.equal(within[0].check, STATIC_SIZE_CHECK);
  assert.equal(within[0].verdict, "pass");

  // The cap on the lines of a body is the profile's too: 200 here, 80 there.
  const long = Array.from({ length: 201 }, () => "x").join("\n");
  assert.equal(checkSkillBudget(source("doctor", long), 10, PLAIN)[1].limit, 200);
  assert.equal(checkSkillBudget(source("doctor", long), 10, WIDE)[1].limit, 80);
  assert.throws(
    () => renderSkill(source("doctor", long), PLAIN),
    (error: unknown) => {
      assert.ok(error instanceof BudgetExceededError);
      assert.equal((error as BudgetExceededError).unit, "lines");
      assert.equal((error as BudgetExceededError).limit, 200);
      return true;
    },
  );

  // Over the byte budget, the message names the profile's requirement.
  const tooBig = source("doctor", `# Doctor\n\n${"x".repeat(5_000)}`);
  assert.throws(
    () => renderSkill(tooBig, PLAIN),
    (error: unknown) => {
      assert.ok(error instanceof BudgetExceededError);
      assert.equal((error as BudgetExceededError).code, "budget-exceeded");
      assert.equal((error as BudgetExceededError).limit, 2_800);
      assert.ok((error as Error).message.includes(PLAIN.budgetRequirement));
      assert.match((error as Error).message, /^budget-exceeded: /);
      return true;
    },
  );
});

/* ---------------------------------------------------------- neutrality */

test("neither host's output names the other host's facts, and the kit names none", () => {
  const plain = renderSkill(
    source("doctor", "# The doctor\n\nRun the checks the product names."),
    PLAIN,
  ).content;
  const wide = renderSkill(source("doctor", "# The doctor\n\nRun the checks."), WIDE).content;
  for (const foreign of ["commands/", "ENTRY.md", "name: doctor\n"]) {
    assert.equal(plain.includes(foreign), false, `the plain output must not hold ${foreign}`);
  }
  for (const foreign of ["skills/", "SKILL.md", DOCTOR_SKILL_ID]) {
    assert.equal(wide.includes(foreign), false, `the other output must not hold ${foreign}`);
  }

  // The kit source names no host: what moved out of a host's package stays
  // out of the kit. (The provenance sentence may NAME the module it moved
  // from; what it must not carry is a fact of that host.)
  const src = readFileSync(join(HERE, "../src/render.ts"), "utf8");
  for (const foreign of [
    "CLAUDE",
    "Claude Code",
    "claude plugin",
    ".claude-plugin",
    "/specstride:",
    "specstride-",
    "SKILL.md",
    "skills/",
    "F113-FR",
  ]) {
    assert.equal(src.includes(foreign), false, `src/render.ts must not hold ${foreign}`);
  }
});
