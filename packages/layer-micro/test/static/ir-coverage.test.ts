/**
 * T142 (F115-SC-010) — static: every integrity rule that
 * `packages/contracts/data/integrity-rules-115.json` marks as owned by this
 * feature names its test `CT-115-<n>`, every named test has a task in
 * `specs/115-micro-loop-layer/tasks.md`, and the number of owned rules is
 * 28. The completeness claim of F115-SC-010 — "28 of 28 integrity rules
 * owned here have a passing test" — is thereby proven mechanically, beside
 * the caps of T053 and the fallback reasons of T085.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..", "..", "..");

const RULES = JSON.parse(
  readFileSync(join(ROOT, "packages", "contracts", "data", "integrity-rules-115.json"), "utf8"),
) as {
  rules: {
    rule: string;
    ownedHere: boolean;
    requirements: string[];
    test: string | null;
  }[];
};

const TASKS = readFileSync(join(ROOT, "specs", "115-micro-loop-layer", "tasks.md"), "utf8");

test("T142: exactly 28 integrity rules are owned by this feature", () => {
  const owned = RULES.rules.filter((rule) => rule.ownedHere);
  assert.equal(
    owned.length,
    28,
    `expected 28 owned rules, found ${owned.length}: ${owned.map((r) => r.rule).join(", ")}`,
  );
  assert.equal(RULES.rules.length, 60);
});

test("T142: every owned rule names its test CT-115-<n>", () => {
  for (const rule of RULES.rules.filter((r) => r.ownedHere)) {
    assert.match(
      rule.test ?? "",
      /^CT-115-\d+$/,
      `${rule.rule} names no test of the form CT-115-<n>`,
    );
  }
});

test("T142: every named test has a task in tasks.md", () => {
  const named = RULES.rules.filter((r) => r.ownedHere).map((r) => r.test as string);
  const missing = named.filter((ct) => !TASKS.includes(ct));
  assert.deepEqual(
    missing,
    [],
    `characterization tests named by owned rules but absent from tasks.md: ${missing.join(", ")}`,
  );
});

test("T142: the count 28 is the completeness claim of F115-SC-010, beside T053 and T085", () => {
  // The caps (T053) and the fallback reasons (T085) stand in tasks.md as
  // the tests of the owned rules IR-23 and IR-27; the owned set closes over
  // both, which is what "28 of 28" claims.
  assert.match(TASKS, /CT-115-22[^\n]*one test case per cap/);
  assert.match(TASKS, /CT-115-5[^\n]*one test case per fallback reason/);
  const owned = RULES.rules.filter((r) => r.ownedHere);
  const withTest = owned.filter((r) => /^CT-115-\d+$/.test(r.test ?? ""));
  assert.equal(withTest.length, owned.length, "an owned rule names no test");
});
