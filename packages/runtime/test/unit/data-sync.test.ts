/**
 * T007 — the copies of the contract data of feature 122 under
 * `packages/runtime/src/data/` do not drift from their sources in
 * `specs/122-detached-runtime/contracts/`.
 *
 * The product reads its data from `src/data/`, because a package of the
 * product must not reach into `specs/` at run time (annex X; the single source
 * of truth of the spec grammar is the specification, the copy is what ships).
 * A copy is therefore a second place the same bytes live, and this test is what
 * stops the two from parting: it fails when a copy differs from its source in
 * a single byte, when a copy is missing, and when a source is missing.
 *
 * Checked for each of the three files of T007:
 *
 *   1. the source exists and the copy exists;
 *   2. the copy is byte-identical to the source (SHA-256 over the raw bytes,
 *      so a changed newline, a changed order of keys or a changed space is a
 *      failure, not a pass);
 *   3. `src/data/` holds no copy of a contract file that T007 does not name,
 *      so that an undeclared copy cannot sit there unchecked.
 *
 * Proves T007 (plan.md, "Project Structure", `src/data/`).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/runtime/test/unit` → the repository root. */
const REPO = resolve(HERE, "..", "..", "..", "..");
const CONTRACTS = join(REPO, "specs", "122-detached-runtime", "contracts");
const COPIES = join(REPO, "packages", "runtime", "src", "data");

/** The data of `contracts/` that T007 copies into `src/data/`. */
export const SYNCED_FILES = Object.freeze([
  "closed-sets.json",
  "parity-rows.json",
  "probe-decision-table.json",
]);

/** The SHA-256 of the raw bytes of a file, so that no parse can hide a change. */
function digestOf(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("T007 — every copy under src/data/ is byte-identical to its source in contracts/", () => {
  for (const name of SYNCED_FILES) {
    const source = join(CONTRACTS, name);
    const copy = join(COPIES, name);

    assert.ok(
      existsSync(source),
      `the source specs/122-detached-runtime/contracts/${name} is missing`,
    );
    assert.ok(existsSync(copy), `the copy packages/runtime/src/data/${name} is missing`);

    const sourceBytes = readFileSync(source);
    const copyBytes = readFileSync(copy);
    assert.equal(
      digestOf(copy),
      digestOf(source),
      `packages/runtime/src/data/${name} differs from ` +
        `specs/122-detached-runtime/contracts/${name}: the copy has drifted from its source. ` +
        `Copy the source over it again (the source is the single source of truth). ` +
        `source ${sourceBytes.length} bytes, copy ${copyBytes.length} bytes`,
    );
    assert.ok(copyBytes.equals(sourceBytes), `${name}: the bytes differ`);
  }
});

test("T007 — every copy is valid JSON and carries the content of its source", () => {
  for (const name of SYNCED_FILES) {
    const copy = JSON.parse(readFileSync(join(COPIES, name), "utf8")) as unknown;
    const source = JSON.parse(readFileSync(join(CONTRACTS, name), "utf8")) as unknown;
    assert.deepEqual(copy, source, `${name}: the parsed copy differs from the parsed source`);
    assert.ok(copy !== null && typeof copy === "object", `${name}: the copy is not an object`);
  }
});

test("T007 — src/data/ holds no copy that T007 does not name", () => {
  const present = readdirSync(COPIES)
    .filter((entry) => entry.endsWith(".json"))
    .sort();
  assert.deepEqual(
    present,
    [...SYNCED_FILES].sort(),
    "packages/runtime/src/data/ holds a JSON file that T007 does not name; " +
      "an undeclared copy is a copy nothing checks",
  );
});
