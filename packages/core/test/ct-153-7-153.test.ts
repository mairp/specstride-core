/**
 * Feature 153, CT-153-7 — the guard of F153-FR-007 (T319): no source file of
 * this feature names a harness. The engine is harness-blind: which tool
 * drives the proposer is a fact of the environment, recorded through the
 * harness descriptor of feature 101 and never spelled into the sources.
 *
 * Static half: every string literal of every source file this feature ADDED
 * is scanned for the five harness names (`claude`, `dsh`, `codex`, `pi`,
 * `prime`) as whole words, and for a `harness ===` comparison — the shape a
 * harness branch would take. Files the feature only TOUCHED
 * (`engine/run-feature.ts`, `engine/micro-layer.ts`, `engine/loop-config.ts`)
 * are out of scope: their pre-baseline text is the adapter of feature 101,
 * which names the executables it spawns by design (F101). The ban holds for
 * what 153 itself wrote.
 *
 * Negative control: the scanner is first fed strings that do and do not
 * contain the names, so a scanner that matches nothing cannot pass the file
 * scan vacuously.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { readFileSync, existsSync } from "node:fs";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO = join(HERE, "..", "..", "..");

/** The source files feature 153 ADDED: the full "Path Conventions" list of tasks.md. */
const FEATURE_SOURCES = [
  // Composition root and its helpers — the NEW pure helpers of the engine.
  "packages/cli/src/engine/check-run.ts",
  "packages/cli/src/engine/gate-feedback.ts",
  // Read-only verb.
  "packages/cli/src/inspect/report.ts",
  "packages/cli/src/inspect/index.ts",
  "packages/cli/src/router/verbs.ts",
  // New core units (pure; no `node:child_process`, no `node:fs`).
  "packages/core/src/gate/closing-check-skip.ts",
  "packages/core/src/gate/end-cause.ts",
  "packages/core/src/checks/selection.ts",
  "packages/core/src/critic-input/evidence/per-task.ts",
  "packages/core/src/critic-input/grounding/grounding.ts",
  "packages/core/src/critic-input/grounding/refuse.ts",
  "packages/core/src/critic-input/hide/hide.ts",
  "packages/core/src/critic-input/prompt/fit.ts",
  "packages/core/src/carry/handoff.ts",
  "packages/core/src/carry/module.ts",
  "packages/core/src/report/rows.ts",
].map((relative) => join(REPO, relative));

/** Any string literal of the file: '…', "…" or `…`. */
const STRING_LITERAL = /'([^'\\\n]*(?:\\.[^'\\\n]*)*)'|"([^"\\\n]*(?:\\.[^"\\\n]*)*)"|`([^`\\]*(?:\\.[^`\\]*)*)`/g;

/** The harness names, as whole words, case-insensitive. */
const HARNESS_NAME = /\b(claude|dsh|codex|pi|prime)\b/i;

/** Every string-literal body of a source file. */
function literalsOf(source: string): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(STRING_LITERAL)) {
    found.push(match[1] ?? match[2] ?? match[3] ?? "");
  }
  return found;
}

test("T319 of feature 153 (F153-FR-007): negative control — the scanner tells a name from its absence", () => {
  assert.ok(HARNESS_NAME.test('the harness "codex" runs'));
  assert.ok(HARNESS_NAME.test('harness === "claude"'));
  assert.ok(!HARNESS_NAME.test("the primaries are numbered")); // letters inside a word are not the name
  assert.ok(!HARNESS_NAME.test("a plain descriptor"));
});

test("T319 of feature 153 (F153-FR-007): no string literal of the feature names a harness", () => {
  for (const path of FEATURE_SOURCES) {
    assert.ok(
      existsSync(path),
      `the feature source ${path} exists — a missing file fails the scan, it is never filtered out`,
    );
    const name = path.slice(REPO.length + 1);
    for (const literal of literalsOf(readFileSync(path, "utf8"))) {
      assert.ok(
        !HARNESS_NAME.test(literal),
        `${name} carries the string literal ${JSON.stringify(literal)} — no harness name may appear`,
      );
    }
  }
});

test("T319 of feature 153 (F153-FR-007): no `harness ===` comparison in the feature's sources", () => {
  for (const path of FEATURE_SOURCES) {
    const source = readFileSync(path, "utf8");
    const name = path.slice(REPO.length + 1);
    assert.ok(
      !/harness\s*===/.test(source),
      `${name} compares a harness — the engine must not branch on one`,
    );
  }
});
