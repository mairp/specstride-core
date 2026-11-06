/**
 * T003 — the build check that the data copies under
 * `packages/core/src/critic-input/data/` are byte-identical to their sources in
 * `specs/117-critic-grounding-and-prompt/contracts/`. T004 completes the source
 * `as-is-literals.json` first; this check is what forces the copy to follow.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const COPIES = fileURLToPath(new URL("../../src/critic-input/data/", import.meta.url));
const SOURCE = fileURLToPath(
  new URL("../../../../specs/117-critic-grounding-and-prompt/contracts/", import.meta.url),
);

const DATA_FILES = [
  "as-is-literals.json",
  "budgets.json",
  "closed-sets.json",
  "critic-block-set.json",
  "excluded-vocabulary.json",
  "parity-rows.json",
];

test("every copied data file equals its source in the contracts directory, byte for byte", () => {
  for (const name of DATA_FILES) {
    const copy = readFileSync(COPIES + name);
    const source = readFileSync(SOURCE + name);
    assert.ok(
      copy.equals(source),
      `packages/core/src/critic-input/data/${name} differs from specs/117-critic-grounding-and-prompt/contracts/${name}`,
    );
  }
});

test("the copied schema of the hidden-files record equals its source (F117-FR-040)", () => {
  const copy = readFileSync(COPIES + "schemas/hidden-files.schema.json");
  const source = readFileSync(SOURCE + "schemas/hidden-files.schema.json");
  assert.ok(copy.equals(source));
});

test("the source as-is-literals.json carries the long as-is texts of T004", () => {
  const literals = JSON.parse(readFileSync(COPIES + "as-is-literals.json", "utf8")) as Record<
    string,
    unknown
  >;
  for (const key of [
    "promptRules",
    "snapshotIntro",
    "gapBody",
    "needsGrounding",
    "notShown",
    "designContextFrame",
    "pinBlock",
  ]) {
    const value = literals[key];
    assert.equal(typeof value, "string", `key ${key} of as-is-literals.json is a string`);
    assert.ok((value as string).length > 60, `key ${key} holds a long text, not a placeholder`);
  }
  assert.match(literals.promptRules as string, /^You are the CRITIC/);
  assert.match(literals.promptRules as string, /Substance only\./);
  assert.ok((literals.notShown as string).includes("NOT-SHOWN"));
  assert.ok((literals.needsGrounding as string).includes("**NEEDS-GROUNDING**"));
  assert.ok((literals.pinBlock as string).includes("PREVIOUSLY CONFIRMED (W9 verdict pins)"));
  assert.ok(
    (literals.designContextFrame as string).includes("DESIGN CONTEXT (read-only background"),
  );
  assert.ok((literals.gapBody as string).includes("TOOLING limitation"));
  assert.ok((literals.snapshotIntro as string).includes("ACTUAL on-disk state"));
});
