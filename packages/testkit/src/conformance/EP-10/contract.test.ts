/**
 * T113 — the conformance suite at contract level for EP-10, the secret
 * resolver (annex C, §C.11): CT-100-207.
 *
 * Before the named case the suite checks the five things every suite at
 * contract level checks (annex A, §A.4). The behaviour of EP-10 belongs to
 * feature 110; its behaviour cases go in this folder beside this file.
 */
import assert from "node:assert/strict";
import {
  CORE_GUARANTEES,
  ERRORS,
  EXISTENCE,
  FILE_TARGET_RULES,
  KEYCHAIN_EXISTENCE_ON_LINUX,
  OPERATIONS,
  POINT_ID,
  WAVE_1_SCHEMES,
  A_RESOLVER_MAKES_A_NETWORK_CALL,
  STATE_WHEN_MISSING_IN_A_RUN,
  unknownValueOutcome,
} from "@specstride/contracts/ep/secret-resolver";
import { SCHEME, VALUES, implementation } from "../../samples/EP-10/index.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-10" as const;

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-207",
    title:
      "a resolver offers `handles`, `exists`, `resolve` and `boundHost` with the errors of §C.11; a secret in configuration is a reference, an inline value is a configuration error, and a `file:` target lies outside the workspace and is owner-readable only (F100-FR-107)",
    level: "contract",
    proves: ["F100-FR-107"],
    async run(impl) {
      assert.deepEqual([...OPERATIONS], ["handles", "exists", "resolve", "boundHost"]);
      assert.deepEqual([...ERRORS], ["missing", "inline-secret", "unsafe-file"]);
      assert.deepEqual([...WAVE_1_SCHEMES], ["env:", "file:", "keychain:"]);
      assert.equal((operationOf(impl, "handles") as (s: string) => boolean)(SCHEME), true);
      assert.equal((operationOf(impl, "handles") as (s: string) => boolean)("nope:"), false);
      // `exists` never returns the value.
      const exists = await (operationOf(impl, "exists") as (r: string) => Promise<string>)(
        `${SCHEME}present`,
      );
      assert.equal(exists, "yes");
      assert.notEqual(exists, VALUES["present"]);
      assert.equal(
        await (operationOf(impl, "exists") as (r: string) => Promise<string>)(`${SCHEME}absent`),
        "no",
      );
      assert.equal(
        await (operationOf(impl, "exists") as (r: string) => Promise<string>)(`${SCHEME}unprobed`),
        KEYCHAIN_EXISTENCE_ON_LINUX,
      );
      const resolved = await (
        operationOf(impl, "resolve") as (
          r: string,
        ) => Promise<{ value: string; registeredWithTheRedactor: true }>
      )(`${SCHEME}present`);
      assert.equal(resolved.value, VALUES["present"]);
      assert.equal(resolved.registeredWithTheRedactor, true);
      await assert.rejects(
        () => (operationOf(impl, "resolve") as (r: string) => Promise<unknown>)(`${SCHEME}absent`),
        /missing/,
      );
      assert.equal(
        (operationOf(impl, "boundHost") as (r: string) => string | null)(`${SCHEME}present`),
        "sample.invalid",
      );
      // An inline value where a reference is required is `inline-secret`.
      assert.equal(unknownValueOutcome("a-literal-secret", [SCHEME]), "inline-secret");
      assert.equal(unknownValueOutcome("other:target", [SCHEME]), "missing");
      assert.equal(unknownValueOutcome(`${SCHEME}present`, [SCHEME]), undefined);
      assert.deepEqual(
        [...FILE_TARGET_RULES],
        ["lies outside the workspace", "is readable by its owner only"],
      );
      assert.equal(A_RESOLVER_MAKES_A_NETWORK_CALL, false);
      assert.equal(STATE_WHEN_MISSING_IN_A_RUN, "blocked-on-human");
      assert.equal(CORE_GUARANTEES.length, 5);
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-10/operations-exist",
      "EP-10/closed-result-sets",
      "EP-10/degradation",
      "EP-10/unknown-value-rule",
      "EP-10/behaviour-cases",
    ],
    {
      resultSets: [
        {
          operation: "exists",
          members: [...EXISTENCE],
          calls: [[`${SCHEME}present`], [`${SCHEME}absent`], [`${SCHEME}unprobed`], ["other:x"]],
        },
      ],
      throwingOperation: "resolve",
    },
  ),
  ...named,
]);

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
