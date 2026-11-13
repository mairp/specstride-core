/**
 * CT-152 (docs) — the amendment requests of the cross-spec amendments exist in
 * the feature's spec directory (tasks T155, T156).
 *
 * The amendments are requests addressed to the owners of other specs, so they
 * must not be edited into the target specs; the feature records them in its
 * own `specs/152-commit-backpressure/amendments.md`, one section per target.
 * This test reads that file from the worktree and asserts every target of
 * spec.md's "Cross-spec amendments" table, and the two register rows
 * DV-121/DV-122 with their oracle register-map entries, are present.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const AMENDMENTS = join(
  HERE,
  "..",
  "..",
  "..",
  "..",
  "specs",
  "152-commit-backpressure",
  "amendments.md",
);

test("amendments.md carries every cross-spec amendment (T155, T156)", () => {
  const text = readFileSync(AMENDMENTS, "utf8");

  // One section per target, as the "Cross-spec amendments" table of spec.md
  // lists them.
  const sections = [
    /## 6\..*Feature 101/, // the section for F101-FR-031, -033, -035
    /F101-FR-031/,
    /F101-FR-033/,
    /F101-FR-035/,
    /F111-FR-031/,
    /annex E §E\.2|Annex E §E\.2/,
    /F149-FR-004/,
    /§X\.6.*row 255|row 255.*§X\.6|## 4\./,
    /row 286|## 4\./,
    /row 134|## 5\./,
  ];
  for (const pattern of sections) {
    assert.match(text, pattern, `amendments.md is missing an amendment: ${String(pattern)}`);
  }

  // The two register rows (T156), with their oracle register-map entries.
  assert.match(text, /DV-121/, "the register row DV-121 (the switch) is missing");
  assert.match(text, /DV-122/, "the register row DV-122 (the 2026-11-04 exit-1 rule) is missing");
  assert.match(
    text,
    /register-map|Register map/,
    "the oracle register-map entries of DV-121 and DV-122 are missing",
  );
  // DV-121 is the switch under `parity` (off); DV-122 carries the waiver.
  assert.match(text, /DV-121[\s\S]{0,400}?off/, "DV-121 must record the value `off` under parity");
  assert.match(text, /DV-122[\s\S]{0,400}?waiver/i, "DV-122 must record the handling `waiver`");
});
