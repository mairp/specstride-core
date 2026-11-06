/**
 * T001 — the list of the three inherited facts
 * (`test/unverified-facts.json`) is well-formed and truthful against the
 * specification: it holds exactly the three requirements that carry a
 * `status: unverified` field (F109-FR-004, F109-FR-038, F109-FR-039), each
 * entry names the feature that captures the fact and the status field the
 * capture closes, and the feature itself runs no probe — every capture is
 * out of band, so every fact is `unverified` with a reason and no date.
 *
 * The test is the independent read path the evidence cites: it reads the file
 * back and asserts its shape, and it reads the specification to confirm the
 * set of requirements with a `status:` field is exactly the set the list holds.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import factsFile from "../unverified-facts.json" with { type: "json" };

const HERE = dirname(fileURLToPath(import.meta.url));
const SPEC = resolveSpec();

function resolveSpec(): string {
  // test/unverified-facts -> packages/harness -> packages -> repo root
  return join(HERE, "..", "..", "..", "..", "specs", "109-harness-seam", "spec.md");
}

interface Fact {
  id: string;
  requirement: string;
  statement: string;
  closes: string;
  capturedBy: string;
  status: string;
  "verified-on": string | null;
  reason: string;
}

test("T001: the list holds exactly the three inherited facts, each with capturer and closed field", () => {
  const facts = factsFile.facts as Fact[];
  assert.equal(facts.length, 3, "the specification carries exactly three inherited facts");
  assert.deepEqual(
    facts.map((f) => f.requirement),
    ["F109-FR-004", "F109-FR-038", "F109-FR-039"],
  );
  for (const fact of facts) {
    assert.ok(fact.statement.length > 10, `${fact.id}: no statement`);
    assert.match(fact.closes, /status/, `${fact.id}: the closed field is not a status field`);
    assert.match(fact.capturedBy, /\b1\d\d\b/, `${fact.id}: no capturing feature named`);
    assert.equal(fact.status, "unverified", `${fact.id}: the capture has not run`);
    assert.equal(fact["verified-on"], null, `${fact.id}: an unverified fact carries no date`);
    assert.ok(fact.reason.length > 10, `${fact.id}: no reason`);
  }
});

test("T001: the three requirements of the list are exactly the inherited facts of the phase task", () => {
  const spec = readFileSync(SPEC, "utf8");
  const blocks = spec.split(/(?=- \*\*F109-FR-\d+\*\*:)/);
  const marked = blocks
    .filter((block) => /^ {2}- status: unverified/m.test(block))
    .map((block) => /- \*\*(F109-FR-\d+)\*\*:/.exec(block)![1]);
  // Six requirements carry a `status: unverified` field. Three of them wait
  // on a macOS runner (F109-FR-027, F109-FR-033, F109-FR-035 — the
  // out-of-band task T104, never run unattended); the other three are the
  // inherited facts of this phase, and the list holds exactly them.
  assert.equal(marked.length, 6);
  const listed = (factsFile.facts as Fact[]).map((f) => f.requirement);
  assert.deepEqual(
    listed,
    ["F109-FR-004", "F109-FR-038", "F109-FR-039"],
    "the list is not the three inherited facts of T001",
  );
  for (const requirement of marked) {
    if (listed.includes(requirement)) continue;
    const block = spec.slice(spec.indexOf(`**${requirement}**`));
    assert.match(
      block.slice(0, 2000),
      /status: unverified \(check: on macOS/,
      `${requirement} is not carried by the list and is not a macOS fact; the list must be revisited`,
    );
  }
});

test("T001: the feature runs no probe — no entry claims this feature as its capturer", () => {
  for (const fact of factsFile.facts as Fact[]) {
    assert.doesNotMatch(
      fact.capturedBy,
      /by this feature|feature 109 \(a probe\)/,
      `${fact.id}: names this feature as the capturer of its own fact`,
    );
  }
});
