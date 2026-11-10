/**
 * CT-152-10 — the corrective block holds exactly the template of
 * data-model.md E3 and no matched text (F152-FR-010, F152-SC-004).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { feedbackOfTheCommitGate } from "../src/gate/feedback.ts";
import {
  blockingRuleOf,
  loadEngineCommitGateRules,
  type CommitGateRules,
} from "@specstride/kernel/redactor/commit-gate-rules";
import { loadWidenedPatternSet } from "@specstride/kernel/redactor/patterns";
import { scanCommitFiles } from "@specstride/kernel/redactor/scan";
import { createRedactor } from "@specstride/kernel/redactor/redactor";
import { registerAtUse } from "@specstride/kernel/redactor/register";

const HERE = dirname(fileURLToPath(import.meta.url));
const GOLDEN = join(HERE, "fixtures/152/corrective-one-hit.md");
const RULES: CommitGateRules = loadEngineCommitGateRules();

const ONE_HIT = {
  phase: 3,
  ordinal: 2,
  nonce: "a1b2c3d4e5f60718",
  rejectCount: 1,
  rejectLimit: 3,
  hits: [
    {
      rule: "cg-bearer",
      reason: "a value of the shape of the credential pattern bearer must not be committed",
      file: '"src/a.ts"',
      line: 3,
    },
  ],
  hitsOmitted: 0,
};

test("the template, exactly (F152-FR-010)", () => {
  const rendered = feedbackOfTheCommitGate(ONE_HIT);
  const golden = readFileSync(GOLDEN, "utf8");
  assert.equal(rendered, golden);
});

/* ------------------------------------------------------------------ *
 * T053 — the property: no substring of length >= 8 of any planted secret
 * appears in a rendered corrective block. The hits are built from a REAL
 * scan of a planted file, over every `values` pattern of widened-v1.json
 * and over registered secrets.
 * ------------------------------------------------------------------ */

const ALNUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function body(length: number, charset: string = ALNUM): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += charset[Math.floor(Math.random() * charset.length)]!;
  }
  return out;
}

/** One exemplar secret per pattern, with a variable body, all matching. */
function secretFor(name: string): string {
  switch (name) {
    case "bearer":
      return `Bearer ${body(12)}`;
    case "sk-prefix":
      return `sk-${body(12)}`;
    case "github-prefix":
      return `ghp_${body(20)}`;
    case "key-name-then-value":
      return `token=${body(12)}`;
    case "private-key-block":
      return ["-----BEGIN RSA", "PRIVATE KEY-----"].join(" ");
    case "jwt":
      return `eyJ${body(12)}.${body(12)}.${body(12)}`;
    case "aws-access-key-id":
      return `AKIA${body(16, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ")}`;
    case "google-access-key-id":
      return `GOOG${body(16, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ")}`;
    case "url-embedded-credentials":
      return ["https://user", `${body(12)}@host.example`].join(":");
    case "slack-prefix":
      return `xoxb-${body(12)}`;
    case "google-api-key-prefix":
      return `AIza${body(30)}`;
    case "gitlab-prefix":
      return `glpat-${body(16)}`;
    case "npm-prefix":
      return `npm_${body(32)}`;
    case "huggingface-prefix":
      return `hf_${body(16)}`;
    case "digitalocean-prefix":
      return `dop_v1_${body(32, "0123456789abcdef")}`;
    default:
      throw new Error(`no exemplar for the pattern ${name}`);
  }
}

/** Every substring of length >= 8 of the secret (the probes of the property). */
function probesOf(secret: string): string[] {
  const probes: string[] = [];
  for (let size = 8; size <= secret.length; size += 1) {
    for (let start = 0; start + size <= secret.length; start += 1) {
      probes.push(secret.slice(start, start + size));
    }
  }
  return probes;
}

/** Render the corrective block the engine would write for these hits. */
function renderForHits(
  hits: readonly { rule: string; file: string; line: number }[],
): string | null {
  if (hits.length === 0) return null;
  return feedbackOfTheCommitGate({
    phase: 1,
    ordinal: 1,
    nonce: "0123456789abcdef",
    rejectCount: 1,
    rejectLimit: 3,
    hits: hits.map((hit) => ({
      rule: hit.rule,
      reason: RULES.rules.find((rule) => rule.rule === hit.rule)?.reason ?? "the rule's reason",
      file: `"${hit.file}"`,
      line: hit.line,
    })),
    hitsOmitted: 0,
  });
}

test("no match text: a planted secret never reaches the block (F152-SC-004)", () => {
  const widened = loadWidenedPatternSet();
  assert.ok(widened.ok, "the widened pattern set loads");

  const redactor = createRedactor();
  const root = mkdtempSync(join(tmpdir(), "ct-152-10-"));
  try {
    const planted = join(root, "planted.ts");
    let checked = 0;
    // Over every `values` pattern of widened-v1.json, 70 variable secrets each.
    const patternEntries = widened.ok ? widened.loaded.values : [];
    for (const entry of patternEntries) {
      for (let i = 0; i < 70; i += 1) {
        const secret = secretFor(entry.name);
        writeFileSync(planted, `const x = 1;\nconst value = "${secret}";\n`, "utf8");
        const scan = scanCommitFiles(["planted.ts"], { root, redactor });
        const blocked = scan.hits
          .map((hit) => blockingRuleOf({ matched: hit.matched, pattern: hit.pattern }, RULES))
          .filter((rule): rule is string => rule !== null);
        if (entry.name === "key-name-then-value") {
          // The carve-out: the hit is exempt, so there is no block at all.
          assert.equal(blocked.length, 0, entry.name);
          continue;
        }
        assert.ok(blocked.length > 0, `the pattern ${entry.name} did not block`);
        const text = renderForHits(blocked.map((rule) => ({ rule, file: "planted.ts", line: 2 })));
        assert.ok(text !== null);
        for (const probe of probesOf(secret)) {
          assert.ok(!text!.includes(probe), `${entry.name}: ${probe}`);
        }
        checked += 1;
      }
    }
    // Registered secrets: exact values the registry replaces at use.
    for (let i = 0; i < 30; i += 1) {
      const secret = `reg-${body(24)}`;
      registerAtUse(redactor, secret);
      writeFileSync(planted, `const x = 1;\nconst value = "${secret}";\n`, "utf8");
      const scan = scanCommitFiles(["planted.ts"], { root, redactor });
      const blocked = scan.hits
        .map((hit) => blockingRuleOf({ matched: hit.matched, pattern: hit.pattern }, RULES))
        .filter((rule): rule is string => rule !== null);
      assert.ok(blocked.length > 0, "a registered secret must block");
      checked += 1;
      const text = renderForHits(blocked.map((rule) => ({ rule, file: "planted.ts", line: 2 })));
      assert.ok(text !== null);
      for (const probe of probesOf(secret)) {
        assert.ok(!text!.includes(probe), probe);
      }
    }
    assert.ok(checked >= 1000, `expected at least 1000 secrets, rendered ${checked}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
