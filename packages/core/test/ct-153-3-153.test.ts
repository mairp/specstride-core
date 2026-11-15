/**
 * CT-153-3 (F153-FR-003) — the guard: no unit of feature 153 redacts.
 *
 * The redaction of outside text is THE ONE INGRESS's work (feature 100 annex
 * A, F100-FR-009), reached through the injected port of feature 105
 * (`CommandOutputIngress`). No new file of the "Path Conventions" section of
 * `specs/153-loop-feedback-speed/tasks.md` defines a function whose name
 * starts with `redact`, and none imports `packages/kernel/src/redactor/`
 * directly: outside text reaches these files only as values ALREADY passed
 * through an ingress.
 *
 * The files the guard reads are listed by their tasks.md paths. A file the
 * phases have not written yet is skipped (it cannot violate the guard before
 * it exists); the guard still fails the day one of them starts redacting.
 *
 * This is a guard of the source text, not of behaviour: it reads the files,
 * it does not import them (a unit that fails to compile must not hide a
 * redactor behind the compile error).
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

/** The directory of this test file (`packages/core/test/`). */
const HERE = fileURLToPath(new URL(".", import.meta.url));

/** The repository root, as seen from `packages/core/test/`. */
const REPO = join(HERE, "..", "..", "..");

/** Every new file "Path Conventions" names for this feature. */
const PATH_CONVENTION_FILES: readonly string[] = [
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
  "packages/core/src/report/rows.ts",
];

/** A definition of a function whose name starts with `redact`. */
const REDACT_DEFINITION =
  /(^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+redact|(^|\n)\s*(?:export\s+)?const\s+redact\w*\s*=/u;

/** A direct import of the redactor of the kernel. */
const REDACTOR_IMPORT = /from\s+"[^"]*kernel\/src\/redactor|from\s+"@specstride\/kernel\/redactor/u;

test("no redactor of this feature", () => {
  const offenders: string[] = [];
  for (const relative of PATH_CONVENTION_FILES) {
    const path = join(REPO, relative);
    if (!existsSync(path)) continue; // not written yet: nothing to guard
    const text = readFileSync(path, "utf8");
    if (REDACT_DEFINITION.test(text)) offenders.push(`${relative}: defines a function starting with redact`);
    if (REDACTOR_IMPORT.test(text)) offenders.push(`${relative}: imports packages/kernel/src/redactor/ directly`);
  }
  assert.deepEqual(offenders, []);
});
