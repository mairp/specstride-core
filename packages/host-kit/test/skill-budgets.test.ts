/**
 * The body budgets of `src/skill-budgets.ts`: a host supplies the token
 * figures of its design point and the byte numbers it prints beside them,
 * and the kit computes the byte limits at the host's rate, holds the printed
 * numbers against that product when the tables are built, and refuses a body
 * over its limit.
 *
 * The two sample hosts here are deliberately NOT the host the module moved
 * out of: the point of the move is that any host's tables measure, that
 * every host-only figure — the token limits, the printed bytes, the rate,
 * the design point a refusal names — is an input, and that the kit source
 * names no host and no design point of one.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { HOST_SKILL_IDS } from "@specstride/contracts/ep/host";
import { bodyBytes, bodyBudgetsOf } from "../src/skill-budgets.ts";
import type { BodyBudgetTables } from "../src/skill-budgets.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * The plain host: the rate of 2.8 bytes per token, two skills, and the
 * figures of its own design point "Body size" — 2,000 tokens (5,600 bytes)
 * for the run skill, 900 (2,520) for the doctor.
 */
const PLAIN: BodyBudgetTables = {
  bodyTokenLimits: { [HOST_SKILL_IDS[0]]: 2_000, doctor: 900 },
  printedBodyByteLimits: { [HOST_SKILL_IDS[0]]: 5_600, doctor: 2_520 },
  bytesPerToken: 2.8,
  designPoint: "Body size",
};

/**
 * A second host whose every figure differs: a rate of 4, one skill, and the
 * design point "Skill body ceiling" — 600 tokens (2,400 bytes).
 */
const WIDE: BodyBudgetTables = {
  bodyTokenLimits: { doctor: 600 },
  printedBodyByteLimits: { doctor: 2_400 },
  bytesPerToken: 4,
  designPoint: "Skill body ceiling",
};

/* ------------------------------------------------------------- the tables */

test("the body tables of a host are held against their own arithmetic when built", () => {
  // A consistent pair of tables builds, at either rate (2.8 has no exact
  // binary form: the product is rounded).
  const plain = bodyBudgetsOf(PLAIN);
  const wide = bodyBudgetsOf(WIDE);
  assert.deepEqual({ ...plain.bodyTokenLimits }, { [HOST_SKILL_IDS[0]]: 2_000, doctor: 900 });
  assert.deepEqual({ ...plain.bodyByteLimits }, { [HOST_SKILL_IDS[0]]: 5_600, doctor: 2_520 });
  assert.deepEqual({ ...wide.bodyByteLimits }, { doctor: 2_400 });

  // A printed number that is not the product fails when the tables are
  // built, in the words of the moved check.
  const drifted: BodyBudgetTables = {
    ...PLAIN,
    printedBodyByteLimits: { ...PLAIN.printedBodyByteLimits, doctor: 2_519 },
  };
  assert.throws(
    () => bodyBudgetsOf(drifted),
    (error: unknown) => {
      assert.match((error as Error).message, /prints 2519 bytes for the body of `doctor`/);
      assert.match((error as Error).message, /900 tokens at 2\.8 bytes per token is 2520/);
      return true;
    },
  );
  // A token limit with no printed byte number beside it drifts too.
  assert.throws(
    () =>
      bodyBudgetsOf({
        ...PLAIN,
        printedBodyByteLimits: { [HOST_SKILL_IDS[0]]: 5_600 },
      }),
    (error: unknown) => {
      assert.match((error as Error).message, /prints undefined bytes for the body of `doctor`/);
      return true;
    },
  );

  // The declared figures travel through unchanged, so a host can hold its
  // own requirement's numbers against what it bound.
  assert.deepEqual(
    { ...plain.printedBodyByteLimits },
    {
      [HOST_SKILL_IDS[0]]: 5_600,
      doctor: 2_520,
    },
  );
});

/* -------------------------------------------------- assertBodyFitsItsLimit */

test("a body over its limit fails with budget-exceeded, at or under it passes", () => {
  const { assertBodyFitsItsLimit } = bodyBudgetsOf(PLAIN);
  // The limit is inclusive: at it the body passes.
  assert.doesNotThrow(() => assertBodyFitsItsLimit("doctor", "x".repeat(2_520)));
  assert.doesNotThrow(() => assertBodyFitsItsLimit("doctor", "x".repeat(2_519)));
  // Over it the build fails rather than the body being cut.
  assert.throws(
    () => assertBodyFitsItsLimit("doctor", "x".repeat(2_521)),
    (error: unknown) => {
      assert.match((error as Error).message, /^budget-exceeded: /);
      assert.match(
        (error as Error).message,
        /the body of the skill `doctor` measures 2521 bytes and the limit .* is 2520 bytes/,
      );
      return true;
    },
  );
  // An id outside the tables has no limit to fit.
  assert.throws(() => assertBodyFitsItsLimit("onboard-skill", "x"), /no body limit/);
  // The second host's check holds its own tables, not the first's.
  const wide = bodyBudgetsOf(WIDE);
  assert.doesNotThrow(() => wide.assertBodyFitsItsLimit("doctor", "x".repeat(2_400)));
  assert.throws(
    () => wide.assertBodyFitsItsLimit("doctor", "x".repeat(2_401)),
    /measures 2401 bytes and the limit .* is 2400 bytes/,
  );
  assert.throws(() => wide.assertBodyFitsItsLimit(HOST_SKILL_IDS[0], "x"), /no body limit/);
});

test("the design point a refusal names is the host's own words", () => {
  const plainMessage = (() => {
    try {
      bodyBudgetsOf(PLAIN).assertBodyFitsItsLimit("doctor", "x".repeat(2_600));
    } catch (error) {
      return (error as Error).message;
    }
    return "";
  })();
  const wideMessage = (() => {
    try {
      bodyBudgetsOf(WIDE).assertBodyFitsItsLimit("doctor", "x".repeat(2_600));
    } catch (error) {
      return (error as Error).message;
    }
    return "";
  })();
  assert.ok(plainMessage.includes('the design point "Body size" of plan.md'));
  assert.equal(plainMessage.includes("Skill body ceiling"), false);
  assert.ok(wideMessage.includes('the design point "Skill body ceiling" of plan.md'));
  assert.equal(wideMessage.includes('"Body size"'), false);
});

/* -------------------------------------------------------------- bodyBytes */

test("bodyBytes measures UTF-8 bytes", () => {
  assert.equal(bodyBytes(""), 0);
  assert.equal(bodyBytes("x"), 1);
  // A character outside ASCII measures in its bytes, not its characters.
  assert.equal(bodyBytes("é"), 2);
  assert.equal(bodyBytes("é".repeat(3)), 6);
  assert.equal(bodyBytes("xé"), 3);
});

/* ------------------------------------------------------------- neutrality */

test("the kit source names no host and no design point of one", () => {
  const src = readFileSync(join(HERE, "../src/skill-budgets.ts"), "utf8");
  for (const foreign of [
    "CLAUDE",
    "Claude",
    "claude plugin",
    ".claude-plugin",
    "/specstride:",
    "specstride-",
    "F113-FR",
    "Skill body size",
    "2,500",
    "7,000",
  ]) {
    assert.equal(src.includes(foreign), false, `src/skill-budgets.ts must not hold ${foreign}`);
  }
});
