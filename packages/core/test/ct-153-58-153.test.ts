/**
 * Phase 22 of feature 153, T307 — the guard of the pass handoff: the handoff
 * of F103-FR-041 is a POINTER for the next pass (CQ-153-14 A), so nothing in
 * the product READS it back — no prompt, no critic input, no diagnostician
 * input is fed from it. The writer (`packages/core/src/carry/handoff.ts`) is
 * the only module that touches the file; the composition root
 * (`packages/cli/src/engine/run-feature.ts`) is the only caller, and it only
 * WRITES. The grounding refusal (F103-FR-042) and the critic-input hiding
 * carry the name, and that is their job: refusing and hiding, not reading.
 *
 * This file is a STATIC-SEARCH guard: it walks the sources and asserts the
 * closed set of files that may name the handoff's path or logical name, and
 * that `groundingRefusedNames` holds the name.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { LOGICAL_NAME, GROUNDING_REFUSES_THIS_NAME } from "../src/carry/handoff.ts";
import { groundingRefusedNames } from "../../contracts/src/ids/layout-rules.ts";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..", "..");

/** Every .ts file under a source directory, recursively. */
function sourcesOf(directory: string): readonly string[] {
  const held: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile() && entry.name.endsWith(".ts")) held.push(path);
    }
  };
  walk(directory);
  return held;
}

/** The file names its path relative to the repository root. */
function relative(path: string): string {
  return path.slice(ROOT.length + 1);
}

test("CT-153-58 nothing in the product reads the handoff back; the name is grounding-refused", () => {
  // F103-FR-042 — the grounding refusal holds the handoff's logical name.
  assert.ok(
    groundingRefusedNames.includes(LOGICAL_NAME),
    "groundingRefusedNames holds feature:<slug>:handoff",
  );
  assert.ok(
    GROUNDING_REFUSES_THIS_NAME.includes(LOGICAL_NAME),
    "the writer's own refusal filter holds the name",
  );

  // The closed set of files that may name the handoff at all, by what they do
  // with it: the writer writes it, the composition root calls the writer, the
  // grounding refusal refuses it, the critic-input hiding hides it, and the
  // carry module holds the constant. Anything else naming it is a reader and
  // breaks CQ-153-14 A.
  const allowed = new Set([
    "packages/core/src/carry/handoff.ts",
    "packages/core/src/carry/module.ts",
    "packages/core/src/critic-input/grounding/refuse.ts",
    "packages/core/src/critic-input/hide/hide.ts",
    "packages/cli/src/engine/run-feature.ts",
  ]);
  const pattern = /handoff\.md|feature:<slug>:handoff/;
  const naming: string[] = [];
  for (const directory of ["packages/cli/src", "packages/core/src"]) {
    for (const path of sourcesOf(join(ROOT, directory))) {
      if (pattern.test(readFileSync(path, "utf8"))) naming.push(relative(path));
    }
  }
  naming.sort();
  const unexpected = naming.filter((path) => !allowed.has(path));
  assert.deepEqual(
    unexpected,
    [],
    `only the writer, its caller and the refusers may name the handoff; these name it too: ${unexpected.join(", ")}`,
  );
  assert.ok(naming.length >= 3, `the guard found the known namers (${String(naming.length)} files)`);

  // And none of the allowed files READS the file back: no `readFileSync`, no
  // `readAfter`, no `existsSync` aimed at the handoff in the composition
  // root's handoff call — the writer receives the path and the atomic write,
  // and gives a `WriteResult` back.
  const engine = readFileSync(join(ROOT, "packages/cli/src/engine/run-feature.ts"), "utf8");
  const at = engine.indexOf("writeHandoffForAPass({");
  assert.ok(at > 0, "the engine calls the writer exactly once");
  assert.equal(engine.indexOf("writeHandoffForAPass({", at + 1), -1, "exactly one call site");
  const call = engine.slice(at, at + 1_200);
  assert.ok(call.includes("records: []"), "no ledger records (CQ-153-19 B)");
  assert.ok(call.includes("atomicWrite,"), "the kernel's atomic write is handed over");
  assert.ok(!/readFileSync|readAfter|existsSync/.test(call), "the call reads nothing back");
});
