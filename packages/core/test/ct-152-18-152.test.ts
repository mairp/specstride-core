/**
 * CT-152-18 (T130, T131, T132) — a project rule may add, and only add
 * (F152-FR-018).
 *
 * A project rule data file MAY add rules that block; it MUST NOT remove,
 * exempt or weaken a rule of the engine: an `exempt` rule of the project and
 * an id in the engine's `cg-` namespace are refused at load, and a project id
 * that repeats one of the engine's is refused at the merge.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CommitGateRulesError,
  loadEngineCommitGateRules,
  mergeCommitGateRules,
  parseCommitGateRules,
} from "@specstride/kernel/redactor/commit-gate-rules";

const ENGINE = loadEngineCommitGateRules();

test("a project rule may add", () => {
  const project = parseCommitGateRules(
    JSON.stringify({
      schema: "specstride.commit-gate-rules/1",
      version: "1.0.0",
      rules: [
        {
          rule: "proj-bearer",
          owner: "314",
          requirement: "F314-FR-001",
          reason: "a value of the shape of the credential pattern bearer must not be committed",
          effect: "block",
          match: { pattern: "bearer" },
        },
      ],
    }),
    "project",
  );
  assert.equal(project.rules.length, 1);
  assert.equal(project.rules[0]?.rule, "proj-bearer");
  const merged = mergeCommitGateRules(ENGINE, project);
  // The merged rules list the project's rule AFTER the engine's, which keep
  // their order.
  assert.equal(merged.rules.length, ENGINE.rules.length + 1);
  assert.deepEqual(
    merged.rules.slice(0, ENGINE.rules.length).map((rule) => rule.rule),
    ENGINE.rules.map((rule) => rule.rule),
  );
  assert.equal(merged.rules[merged.rules.length - 1]?.rule, "proj-bearer");
  // And the merged document decides like the engine's plus the addition.
  const rule = merged.rules.find((one) => one.effect === "block" && "pattern" in one.match &&
    one.match.pattern === "bearer");
  assert.ok(rule !== undefined);
});

test("a project exempt is refused", () => {
  assert.throws(
    () =>
      parseCommitGateRules(
        JSON.stringify({
          schema: "specstride.commit-gate-rules/1",
          version: "1.0.0",
          rules: [
            {
              rule: "proj-loose",
              owner: "314",
              requirement: "F314-FR-001",
              reason: "the project holds this shape for ordinary code",
              effect: "exempt",
              match: { pattern: "bearer" },
            },
          ],
        }),
        "project",
      ),
    (error: unknown) => {
      assert.ok(error instanceof CommitGateRulesError);
      assert.match(error.message, /exempt|only add/);
      return true;
    },
  );
});

test("a project rule may not shadow", () => {
  assert.throws(
    () =>
      parseCommitGateRules(
        JSON.stringify({
          schema: "specstride.commit-gate-rules/1",
          version: "1.0.0",
          rules: [
            {
              rule: "cg-bearer",
              owner: "314",
              requirement: "F314-FR-001",
              reason: "a weaker rule under an engine id would steer the gate",
              effect: "block",
              match: { pattern: "bearer" },
            },
          ],
        }),
        "project",
      ),
    CommitGateRulesError,
  );
  // The merge refuses a repeat as well, whichever way it was built.
  const forged = {
    schema: ENGINE.schema,
    version: ENGINE.version,
    rules: [
      {
        rule: ENGINE.rules[0]!.rule,
        owner: "314",
        requirement: "F314-FR-001",
        reason: "a repeat of an engine id",
        effect: "block" as const,
        match: { registeredSecret: true } as const,
      },
    ],
  };
  assert.throws(() => mergeCommitGateRules(ENGINE, forged), CommitGateRulesError);
});
