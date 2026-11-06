/**
 * T002 — independent proof that the sync script of feature 100 (not a hand
 * copy) is the writer that delivers feature 116's five contract files into
 * the package. The full `scripts/sync.mjs` is not run against the real
 * package here: its two clean copies rebuild `packages/contracts/{data,
 * schemas}/` from feature 100's annexes and would drop the delivered files of
 * every other feature in the working tree. Instead the test runs the same
 * delivery pass the script runs after its clean copies — the exported
 * `deliverOtherFeatures` of `packages/contracts/scripts/sync.mjs` — against
 * the real `specs/` tree and a throwaway package directory, captures the
 * lines the script prints, and asserts that feature 116's five targets of
 * `contracts/deliver.json` are each delivered and verified byte for byte by
 * that code path.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const FEATURE = "116-check-integrity-and-unit-evidence";

test("T002: the sync script's delivery pass delivers feature 116's five files from its manifest", async (t) => {
  const pkgDir = mkdtempSync(join(tmpdir(), "specstride-sync-116-"));
  t.after(() => rmSync(pkgDir, { recursive: true, force: true }));

  const lines: string[] = [];
  const write = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: unknown) => {
    lines.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;
  let delivered: number;
  try {
    // sync.mjs is a plain Node script of feature 100 and carries no type
    // declarations; only its exported delivery pass is used here.
    // @ts-expect-error - no declaration file for a plain .mjs script
    const sync = await import("../scripts/sync.mjs");
    delivered = sync.deliverOtherFeatures(undefined, pkgDir);
  } finally {
    process.stdout.write = write;
  }
  const out = lines.join("");

  // The script's own report, line per delivered file.
  assert.match(out, new RegExp(`delivered data/integrity-rules-116\\.json from ${FEATURE}`));
  assert.match(out, new RegExp(`delivered data/tamperings-116\\.json from ${FEATURE}`));
  assert.match(out, new RegExp(`delivered schemas/toolchain\\.schema\\.json from ${FEATURE}`));
  assert.match(out, new RegExp(`delivered schemas/protected-set\\.schema\\.json from ${FEATURE}`));
  assert.match(out, new RegExp(`delivered schemas/check-result\\.schema\\.json from ${FEATURE}`));
  assert.ok(delivered >= 5, `the delivery pass delivered ${delivered} files`);

  // The delivered targets exist and are byte-identical to the manifest's sources.
  const deliver = JSON.parse(
    readFileSync(join(ROOT, `specs/${FEATURE}/contracts/deliver.json`), "utf8"),
  ) as { data: Record<string, string>; schemas: Record<string, string> };
  for (const [key, map] of [
    ["data", deliver.data],
    ["schemas", deliver.schemas],
  ] as const) {
    for (const [target, source] of Object.entries(map)) {
      const from = readFileSync(join(ROOT, `specs/${FEATURE}/contracts`, source));
      const to = readFileSync(join(pkgDir, key, target));
      assert.ok(from.equals(to), `sync delivered ${key}/${target} byte-identical to ${source}`);
    }
  }
});
