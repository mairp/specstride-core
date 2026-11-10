/**
 * CT-152-16 (part) — the engine rule data of the commit gate (F152-FR-016,
 * F152-FR-019).
 *
 * The rules that decide whether a hit of the pre-commit scan blocks the
 * approval commit are versioned data: `packages/kernel/data/commit-gate/
 * engine-v1.json`, validated at load against
 * `packages/contracts/schemas/commit-gate-rules.schema.json`
 * (`specstride.commit-gate-rules/1`).
 *
 * The cases here pin the shipped file: it validates against the schema; it
 * holds one `block` rule per value pattern of the widened pattern set (one
 * `cg-<name>` per `name` of the `values` list, never the `keyNames` list);
 * a rule for registered secrets; and the carve-out of ordinary code
 * (`key-name-then-value`) as an `exempt` rule with its owner and requirement
 * (F152-FR-019), so the composition root's constant is migrated, not kept.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "@specstride/contracts/records/compile";

/** The kernel package root: three levels up from this file. */
const KERNEL_ROOT = resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));

/** The shipped engine rule data (T013). */
const ENGINE_FILE = join(KERNEL_ROOT, "data", "commit-gate", "engine-v1.json");

/** The widened pattern set whose `values` names get a `block` rule each. */
const WIDENED_FILE = join(KERNEL_ROOT, "data", "patterns", "widened-v1.json");

const SCHEMA_ID = "specstride.commit-gate-rules/1";

type PatternSet = { values: ReadonlyArray<{ name: string }> };

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

test("the engine file validates", () => {
  const data = readJson(ENGINE_FILE);
  const result = validate(SCHEMA_ID, data);
  assert.deepEqual(
    result.ok ? [] : result.errors.map((e) => `${e.path}: ${e.message}`),
    [],
    "engine-v1.json must validate against specstride.commit-gate-rules/1",
  );
});

test("one block rule per pattern", () => {
  const data = readJson(ENGINE_FILE) as { rules: Array<Record<string, unknown>> };
  const patterns = (readJson(WIDENED_FILE) as PatternSet).values.map((v) => v.name);
  assert.ok(patterns.length > 0, "the widened set must name value patterns");
  for (const name of patterns) {
    const rules = data.rules.filter(
      (r) =>
        r.effect === "block" &&
        typeof r.match === "object" &&
        r.match !== null &&
        (r.match as Record<string, unknown>).pattern === name,
    );
    assert.equal(
      rules.length,
      1,
      `exactly one cg-${name} block rule must exist for the value pattern "${name}"`,
    );
    assert.equal(
      rules[0]?.rule,
      `cg-${name}`,
      `the block rule of the pattern "${name}" must be named cg-${name}`,
    );
  }
  // The keyNames list gives no rule (plan.md, "Rule data"): no rule id ends
  // with the name of a key-only entry that is not also a value pattern.
  const valueNames = new Set(patterns);
  for (const r of data.rules) {
    const match = r.match as Record<string, unknown> | undefined;
    if (typeof match?.pattern === "string" && !valueNames.has(match.pattern)) {
      assert.fail(`rule ${String(r.rule)} names a pattern that is not in the values list`);
    }
  }
});

test("registered secrets block", () => {
  const data = readJson(ENGINE_FILE) as { rules: Array<Record<string, unknown>> };
  const rule = data.rules.find(
    (r) =>
      r.rule === "cg-registered-secret" &&
      r.effect === "block" &&
      typeof r.match === "object" &&
      r.match !== null &&
      (r.match as Record<string, unknown>).registeredSecret === true,
  );
  assert.ok(rule, "a cg-registered-secret block rule must exist");
});

test("the carve-out is a rule", () => {
  const data = readJson(ENGINE_FILE) as {
    rules: Array<Record<string, unknown>>;
  };
  const rule = data.rules.find((r) => r.rule === "cg-ordinary-code");
  assert.ok(rule, "the carve-out cg-ordinary-code must be a rule of the engine data");
  assert.equal(rule?.effect, "exempt");
  const match = rule?.match as Record<string, unknown> | undefined;
  assert.equal(match?.pattern, "key-name-then-value");
  assert.equal(rule?.owner, "152");
  assert.equal(rule?.requirement, "F152-FR-019");
});

/* ------------------------------------------------------------------ *
 * Phase 2 — the parser, the hash and the matcher (T016–T025).
 * ------------------------------------------------------------------ */

import {
  CommitGateRulesError,
  blockingRuleOf,
  hashOfCommitGateRules,
  loadEngineCommitGateRules,
  parseCommitGateRules,
} from "../../src/redactor/commit-gate-rules.ts";

/** A rule of the engine's own shape, for the refusals. */
function ruleOf(over: Record<string, unknown>): unknown {
  return {
    rule: "cg-project-rule",
    owner: "152",
    requirement: "F152-FR-016",
    reason: "a plain reason that carries no secret",
    effect: "block",
    match: { pattern: "bearer" },
    ...over,
  };
}

function rulesTextOf(rules: unknown[]): string {
  return JSON.stringify({
    schema: "specstride.commit-gate-rules/1",
    version: "1.0.0",
    rules,
  });
}

test("a malformed file is refused", () => {
  assert.throws(() => parseCommitGateRules("{", "engine"), CommitGateRulesError);
  const missingReason = rulesTextOf([ruleOf({ reason: undefined })]);
  delete (JSON.parse(missingReason) as { rules: Array<Record<string, unknown>> }).rules[0].reason;
  assert.throws(
    () =>
      parseCommitGateRules(
        JSON.stringify({
          schema: "specstride.commit-gate-rules/1",
          version: "1.0.0",
          rules: [
            {
              rule: "cg-project-rule",
              owner: "152",
              requirement: "F152-FR-016",
              effect: "block",
              match: { pattern: "bearer" },
            },
          ],
        }),
        "engine",
      ),
    CommitGateRulesError,
  );
  void missingReason;
});

test("a reason the redactor changes is refused", () => {
  assert.throws(
    () =>
      parseCommitGateRules(
        rulesTextOf([ruleOf({ reason: `a key like sk${"-"}AAAAAAAAAAAA must not be committed` })]),
        "engine",
      ),
    CommitGateRulesError,
  );
});

test("an unknown pattern is refused", () => {
  assert.throws(
    () => parseCommitGateRules(rulesTextOf([ruleOf({ match: { pattern: "no-such-pattern" } })]), "engine"),
    CommitGateRulesError,
  );
});

test("the engine rules load once, frozen", () => {
  const first = loadEngineCommitGateRules();
  const second = loadEngineCommitGateRules();
  assert.equal(first, second, "the engine rules are read once");
  assert.ok(Object.isFrozen(first), "the engine rules are frozen");
});

test("the hash is stable", () => {
  const engine = loadEngineCommitGateRules();
  const same = hashOfCommitGateRules(engine, null);
  assert.equal(same, hashOfCommitGateRules(engine, null));
  const changedReason = {
    ...engine,
    rules: [
      ...engine.rules.slice(0, 3),
      { ...engine.rules[3], reason: "a different reason entirely" },
      ...engine.rules.slice(4),
    ],
  };
  assert.notEqual(same, hashOfCommitGateRules(changedReason, null));
});

test("the matcher decides by the kind of the hit", () => {
  const engine = loadEngineCommitGateRules();

  // bearer → its own block rule.
  assert.equal(blockingRuleOf({ matched: "pattern", pattern: "bearer" }, engine), "cg-bearer");

  // the carve-out of ordinary code exempts: no rule holds the commit back.
  assert.equal(blockingRuleOf({ matched: "pattern", pattern: "key-name-then-value" }, engine), null);

  // a registered secret is its own rule.
  assert.equal(blockingRuleOf({ matched: "registered-secret" }, engine), "cg-registered-secret");

  // an unreadable file is the unreadable rule, not the registered-secret rule.
  assert.equal(blockingRuleOf({ matched: "unreadable" }, engine), "cg-unreadable");

  // a pattern no rule names yet fails closed, and never matches `unmatched`
  // directly: the fallback is the only way `cg-unmatched-hit` is reached.
  assert.equal(blockingRuleOf({ matched: "pattern", pattern: "no-rule-yet" }, engine), "cg-unmatched-hit");
});
