/**
 * CT-152-8 — the commit gate acts ONCE PER PHASE ATTEMPT, at phase level
 * (F152-FR-008; F100-FR-031; Principle XX).
 *
 * Static proof: `commitGate` is imported only by the composition root
 * (`run-feature.ts`, the approved branch of the phase attempt) and re-exported
 * by the barrel of `post-approval/`. Neither loop layer imports it, so no
 * unit of the micro-loop layer or of the parallel layer can spend a count of
 * this feature, add an exit code or add a stop reason for it.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..", "..", "packages");

/** Every .ts source under a directory, recursively. */
function sourcesOf(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...sourcesOf(full));
    else if (name.endsWith(".ts")) out.push(full);
  }
  return out;
}

const IMPORTERS = sourcesOf(join(ROOT, "core", "src"))
  .concat(sourcesOf(join(ROOT, "cli", "src")))
  .filter((file) => /import\s*\{[^}]*\bcommitGate\b[^}]*\}\s*from/.test(readFileSync(file, "utf8")));

test("only the phase attempt (the composition root) imports commitGate", () => {
  assert.ok(
    IMPORTERS.length > 0,
    "the scan found no importer at all — the scan itself is broken",
  );
  for (const file of IMPORTERS) {
    assert.ok(
      file.endsWith(join("cli", "src", "engine", "run-feature.ts")) ||
        file.endsWith(join("core", "src", "post-approval", "index.ts")),
      `commitGate imported outside the phase attempt: ${file}`,
    );
  }
});

test("no loop layer imports the commit gate", () => {
  for (const layer of ["layer-micro", "layer-parallel"]) {
    const dir = join(ROOT, layer);
    let files: string[] = [];
    try {
      files = sourcesOf(dir);
    } catch {
      // A layer the workspace does not hold cannot import anything.
      continue;
    }
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      assert.ok(
        !/post-approval\/commit-gate|commitGate/.test(text),
        `the loop layer ${layer} must not touch the commit gate: ${file}`,
      );
    }
  }
});
