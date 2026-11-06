/**
 * T088 — the build check that `specs/117-critic-grounding-and-prompt/contracts/parity-rows.json`
 * (and its copy `packages/core/src/critic-input/data/parity-rows.json`, which
 * the data-copies check keeps byte-equal) equals the rows 52 to 58 of the
 * `parity` profile of feature 100 (`specs/100-specstride/contracts/data/parity-profile.json`)
 * in KEY, DEFAULT and VALUE under `parity`, and that the register rows DV-099
 * and DV-100 it names exist in the register of the parity oracle
 * (F117-FR-024, F117-FR-029, F117-FR-035).
 *
 * The profile is the oracle: where the spellings differ (backticks, casing, a
 * number against its text), the comparison normalises both sides; the VALUE is
 * the cell of the profile, not a free invention of the data file.
 *
 * covers: F117-FR-024; F117-FR-029; F117-FR-035
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type ParityRow = {
  row: number;
  status: string;
  key: string;
  default: unknown;
  parity: unknown;
  register: string;
};

type ProfileRow = {
  number: number;
  key: string;
  default: string;
  parity: string;
  registerRows: readonly string[];
};

type RegisterMap = { rows: readonly { row: string }[] };

const REPO = fileURLToPath(new URL("../../../..", import.meta.url));
const rows = JSON.parse(
  readFileSync(`${REPO}specs/117-critic-grounding-and-prompt/contracts/parity-rows.json`, "utf8"),
) as ParityRow[];
const profile = JSON.parse(
  readFileSync(`${REPO}specs/100-specstride/contracts/data/parity-profile.json`, "utf8"),
) as { switches: ProfileRow[] };
const register = JSON.parse(
  readFileSync(`${REPO}specs/141-parity-oracle/contracts/register-map.json`, "utf8"),
) as RegisterMap;

/** Normalise a cell: backticks off, trimmed, numbers as their text, lower case. */
function norm(value: unknown): string {
  return String(value).replace(/`/g, "").trim().toLowerCase();
}

const profileByNumber = new Map(profile.switches.map((s) => [s.number, s]));

test("parity-rows.json holds exactly the rows 52 to 58", () => {
  assert.deepEqual(
    rows.map((r) => r.row),
    [52, 53, 54, 55, 56, 57, 58],
  );
});

test("every row equals its row of the parity profile in key, default and value under `parity`", () => {
  const offenders: string[] = [];
  for (const row of rows) {
    const source = profileByNumber.get(row.row);
    if (source === undefined) {
      offenders.push(`row ${row.row}: not in the profile`);
      continue;
    }
    if (row.key !== source.key) offenders.push(`row ${row.row}: key ${row.key} ≠ ${source.key}`);
    if (norm(row.default) !== norm(source.default)) {
      offenders.push(`row ${row.row}: default ${row.default} ≠ ${source.default}`);
    }
    if (norm(row.parity) !== norm(source.parity)) {
      offenders.push(`row ${row.row}: parity ${row.parity} ≠ ${source.parity}`);
    }
  }
  assert.deepEqual(offenders, [], "a row that differs from feature 100's profile");
});

test("the register rows the file names exist, DV-099 and DV-100 among them", () => {
  const known = new Set(register.rows.map((r) => r.row));
  const named = new Set(rows.flatMap((r) => r.register.split(/\s*;\s*/)));
  assert.ok(named.has("DV-099"), "row 57 names DV-099");
  assert.ok(named.has("DV-100"), "row 58 names DV-100");
  const missing = [...named].filter((dv) => !known.has(dv));
  assert.deepEqual(missing, [], "a register row the file names that does not exist");
});

test("rows 57 and 58 carry the two decisions the plan took (D-6, D-7)", () => {
  const over = rows.find((r) => r.row === 57)!;
  const blockSet = rows.find((r) => r.row === 58)!;
  assert.equal(norm(over.key), "prompt.critic.overwindow");
  assert.equal(norm(over.default), "refuse");
  assert.equal(norm(over.parity), "send");
  assert.equal(norm(blockSet.key), "prompt.critic.block_set");
  assert.equal(norm(blockSet.default), "current");
  assert.equal(norm(blockSet.parity), "as-is");
  assert.equal(blockSet.status, "confirmed");
});
