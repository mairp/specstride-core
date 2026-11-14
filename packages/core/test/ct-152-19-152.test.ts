/**
 * CT-152-19 (T129) — the carve-out moved, nothing else changed
 * (F152-FR-019).
 *
 * The exemption of the pattern `key-name-then-value`, which the composition
 * root held as the constant `THE_SHAPE_OF_ORDINARY_CODE` and applied as the
 * filter `hit.pattern !== "key-name-then-value"`, is a rule of the engine's
 * rule data (`cg-ordinary-code`, `effect: "exempt"`). Over every fixture of
 * the scan's own commit tests and the blocked-commit cases of the engine, the
 * decision of `blockingRuleOf` with the engine rules equals the decision of
 * the old filter. The fixtures include an UNREADABLE file (a hit with
 * `matched: "unreadable"`), which blocks under both.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRedactor } from "@specstride/kernel/redactor/redactor";
import { scanCommitFiles } from "@specstride/kernel/redactor/scan";
import {
  blockingRuleOf,
  loadEngineCommitGateRules,
  type CommitGateHit,
} from "@specstride/kernel/redactor/commit-gate-rules";

const RULES = loadEngineCommitGateRules();

/** The as-is decision the composition root made before this feature. */
function theOldFilter(hit: CommitGateHit): boolean {
  return hit.pattern !== "key-name-then-value";
}

/** The planted secret of the engine's blocked-commit cases (run-feature.test.ts). */
const GHP = ["gh", "p_", "abcd1234", "efgh"].join("");

/**
 * The scan hits of the fixture families, read from REAL FILES the way the
 * scan's own tests read them: the registered secret, the `ghp_` pattern, the
 * `sk-` pattern, the URL-embedded credential, the ordinary code of the
 * carve-out, a file with no hit, and a file that cannot be read.
 */
function hitsOfTheFixtures(): { hit: CommitGateHit; what: string }[] {
  const dir = mkdtempSync(join(tmpdir(), "ct-152-19-"));
  try {
    const redactor = createRedactor();
    mkdirSync(join(dir, "src"), { recursive: true });
    // The fixture of CT-111-131 (secrets-commit.test.ts): a registered
    // secret, a pattern of the set, a clean file, and an unreadable file.
    const registered = "Zq7-correct-horse-battery";
    redactor.register(registered);
    writeFileSync(join(dir, "src", "leaky.ts"), `const key = "${registered}";\n`);
    const SK_PLANTED = ["sk", "-", "abcdef", "gh1234"].join("");
    writeFileSync(join(dir, "config.env"), `GITHUB=${GHP}\nOK=1\nSK=${SK_PLANTED}\n`);
    writeFileSync(join(dir, "clean.ts"), "const ok = 1;\n");
    // The blocked-commit cases of run-feature.test.ts: a planted secret in a
    // file the proposer wrote, and ordinary code of the carve-out.
    writeFileSync(join(dir, "creds.txt"), `token = ${GHP}\n`);
    writeFileSync(join(dir, "example.json"), '{"token": "abc"}\n');
    // The URL-embedded credential (the widened set's own fixture family).
    const EMBEDDED = "https://user:" + "pass@host.example/repo";
    writeFileSync(join(dir, "notes.md"), `see ${EMBEDDED}\n`);
    const files = [
      "src/leaky.ts",
      "config.env",
      "clean.ts",
      "creds.txt",
      "example.json",
      "notes.md",
      "does/not/exist.ts",
    ];
    const result = scanCommitFiles(files, { root: dir, redactor });
    const hits = result.hits.map((hit) => ({
      hit: hit as unknown as CommitGateHit,
      what: `${hit.file}:${String(hit.line)} ${hit.matched}${hit.pattern === undefined ? "" : `/${hit.pattern}`}`,
    }));
    assert.ok(
      hits.some((one) => one.hit.matched === "unreadable"),
      "the fixtures include an unreadable file",
    );
    assert.ok(
      hits.some((one) => one.hit.pattern === "key-name-then-value"),
      "the fixtures include the carve-out's own pattern",
    );
    assert.ok(
      hits.some((one) => one.hit.matched === "registered-secret"),
      "the fixtures include a registered secret",
    );
    assert.ok(hits.length >= 6, `the fixtures give enough hits (got ${String(hits.length)})`);
    return hits;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("the carve-out moved, nothing else changed", () => {
  const carvedOut = hitsOfTheFixtures();
  for (const { hit, what } of carvedOut) {
    const rule = blockingRuleOf(hit, RULES);
    assert.equal(
      rule !== null,
      theOldFilter(hit),
      `the decision differs at ${what}: blockingRuleOf=${String(rule)}`,
    );
    // Where both hold the commit back, the rule is one of the engine's own
    // ids — never a project id, and the carve-out is `cg-ordinary-code`.
    if (hit.pattern === "key-name-then-value") {
      assert.equal(rule, null, `the carve-out exempts ${what}`);
    } else {
      assert.ok(rule !== null && rule.startsWith("cg-"), `the rule of ${what} is the engine's`);
    }
  }
});

test("the carve-out is a rule of the engine's rule data", () => {
  const rule = RULES.rules.find((one) => one.effect === "exempt");
  assert.ok(rule !== undefined, "the engine rule data holds an exempt rule");
  assert.equal(rule?.rule, "cg-ordinary-code");
  assert.deepEqual(rule?.match, { pattern: "key-name-then-value" });
  assert.ok(rule?.reason.length > 0, "the carve-out carries an owned reason");
});
