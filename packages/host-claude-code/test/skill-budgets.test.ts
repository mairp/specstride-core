/**
 * T008, T009 and T010 — the binding of the kit's body budgets to THIS host.
 *
 * The generic half of `src/skill-budgets.ts` moved into
 * `@specstride/host-kit` (`src/skill-budgets.ts` of the kit, the split of the
 * monorepo, U-1). This file holds the binding half: the module here is one
 * binding of the kit's `bodyBudgetsOf`, over the figures of the design point
 * "Skill body size" of plan.md at the rate of F113-FR-036, and every
 * consumer of the old path reads the same values and the same messages as
 * before the move.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { bodyBudgetsOf } from "@specstride/host-kit";
import { HOST_SKILL_AND_ENTRY_IDS } from "@specstride/contracts/ep/context-cost";
import { BYTES_PER_TOKEN, bytesForTokens } from "../src/render/index.ts";
import {
  BODY_BYTE_LIMITS,
  BODY_TOKEN_LIMITS,
  PRINTED_BODY_BYTE_LIMITS,
  assertBodyFitsItsLimit,
  bodyBytes,
} from "../src/skill-budgets.ts";

test("T008-T010: the body limits are the kit's arithmetic over this host's design point", () => {
  // The design point's own figures, per logical id of row 144.
  const [run, reverse, doctor] = HOST_SKILL_AND_ENTRY_IDS;
  assert.deepEqual({ ...BODY_TOKEN_LIMITS }, { [run]: 2_500, [reverse]: 2_000, [doctor]: 800 });
  assert.deepEqual(
    { ...PRINTED_BODY_BYTE_LIMITS },
    { [run]: 7_000, [reverse]: 5_600, [doctor]: 2_240 },
  );
  // The byte limits are the token figures at THIS host's rate, computed by
  // the kit: 2,500 tokens at 2.8 is 7,000 bytes, and so on.
  for (const id of [run, reverse, doctor]) {
    assert.equal(
      BODY_BYTE_LIMITS[id],
      bytesForTokens(BODY_TOKEN_LIMITS[id] ?? 0),
      `${id}: the byte limit is not the token figure at ${BYTES_PER_TOKEN}`,
    );
  }
  assert.deepEqual(
    { ...BODY_BYTE_LIMITS },
    {
      ...bodyBudgetsOf({
        bodyTokenLimits: { ...BODY_TOKEN_LIMITS },
        printedBodyByteLimits: { ...PRINTED_BODY_BYTE_LIMITS },
        bytesPerToken: BYTES_PER_TOKEN,
        designPoint: "Skill body size",
      }).bodyByteLimits,
    },
  );
  // The bound check refuses a body over the design point's limit, in the
  // moved words, and has no limit for an id outside row 144.
  assert.throws(
    () => assertBodyFitsItsLimit(doctor, "x".repeat(2_241)),
    (error: unknown) => {
      assert.match((error as Error).message, /^budget-exceeded: /);
      assert.match((error as Error).message, /measures 2241 bytes and the limit .* is 2240 bytes/);
      assert.match((error as Error).message, /the design point "Skill body size" of plan\.md/);
      return true;
    },
  );
  assert.doesNotThrow(() => assertBodyFitsItsLimit(doctor, "x".repeat(2_240)));
  assert.throws(() => assertBodyFitsItsLimit("onboard-skill", "x"), /no body limit/);
  // The measure is of bytes, not characters.
  assert.equal(bodyBytes("é"), 2);
});
