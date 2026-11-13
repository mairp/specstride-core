/**
 * T003 of `specs/113-host-claude-code/tasks.md` — the closed sets of spec.md,
 * section "Closed sets", are in `@specstride/contracts`, added through the
 * rows the specification proposed.
 *
 * spec.md calls two of the three a "proposed row"; annex X §X.6 has since
 * accepted both, as row 144 and row 145, so all three carry a number. Rows 84
 * and 145 give no literals in the annex and register BY REFERENCE to a table
 * of the package (T250 to T256); until T003 both referred to an EMPTY tuple, so
 * the sets existed with no members and `has()` was false for every value. T003
 * supplies the two tables:
 *
 *  - row 84 → `CAPABILITIES` of `@specstride/contracts/ep/host`;
 *  - row 145 → `CONTEXT_COST_CHECKS` of `@specstride/contracts/ep/context-cost`,
 *    which holds the seven checks against `data/closed-sets-113.json` at load.
 *
 * The delivery path of the data file is T299 of feature 100: the file lies in
 * `specs/113-host-claude-code/contracts/`, is named in that directory's
 * `deliver.json`, and the sync script copies it into the package and verifies
 * it byte for byte. The witnesses below are the file IN THE PACKAGE, read from
 * disk, and the assembled registry of `@specstride/contracts/enums/all-sets` —
 * not a claim of this test.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CAPABILITIES } from "@specstride/contracts/ep/host";
import {
  CONTEXT_COST_CHECKS,
  CONTEXT_COST_CHECK_COUNT,
  CONTEXT_COST_ROW,
  CONTEXT_COST_SET_NAME,
  CONTEXT_COST_SET_NAME_IN_SPEC,
  HOST_SKILL_AND_ENTRY_IDS,
  isContextCostCheck,
  rowOf113,
} from "@specstride/contracts/ep/context-cost";
import { closedSets } from "@specstride/contracts/enums/all-sets";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = resolve(PKG, "../..");

/** The file in the package: what T003 delivers. */
const DELIVERED = "packages/contracts/data/closed-sets-113.json" as const;
/** The source in this feature's directory, and the manifest that names it. */
const SOURCE = "specs/113-host-claude-code/contracts/closed-sets.json" as const;
const DELIVER = "specs/113-host-claude-code/contracts/deliver.json" as const;

/** The three rows of spec.md, section "Closed sets", with their annex numbers. */
const ROWS_OF_113 = [84, 144, 145] as const;

type Row = {
  row: string;
  standing: string;
  registration: string;
  set: string;
  setInSpec: string;
  members: string;
  literals: string[];
  table: string;
  owner: string;
  closedBy: string;
  unknownValue: string;
};

function readJson<T>(relative: string): T {
  return JSON.parse(readFileSync(join(ROOT, relative), "utf8")) as T;
}

test("T003: the closed sets of feature 113 are delivered into @specstride/contracts", () => {
  assert.equal(existsSync(join(ROOT, DELIVERED)), true, `${DELIVERED} is missing`);
  // The manifest of T299 names the target and the source.
  const deliver = readJson<{ owner: string; data: Record<string, string> }>(DELIVER);
  assert.equal(deliver.owner, "113");
  assert.deepEqual(deliver.data, { "closed-sets-113.json": "closed-sets.json" });
  // The delivered file is the source, byte for byte (the sync verifies it too).
  assert.deepEqual(
    readFileSync(join(ROOT, DELIVERED)),
    readFileSync(join(ROOT, SOURCE)),
    "the delivered file differs from the source in specs/",
  );
});

test("T003: the file holds the three rows of spec.md, section `Closed sets`", () => {
  const data = readJson<{ schema: string; owner: string; sets: Row[] }>(DELIVERED);
  assert.equal(data.schema, "specstride.closed-sets-113/1");
  assert.equal(data.owner, "113");
  assert.equal(data.sets.length, 3, "spec.md names three closed sets");
  assert.deepEqual(
    data.sets.map((s) => Number(s.row)),
    [...ROWS_OF_113],
  );
  assert.deepEqual(
    data.sets.map((s) => s.set),
    [
      "Capabilities of a host",
      "Logical ids of host skills and entries",
      "Checks of the context-cost build",
    ],
  );
  for (const row of data.sets) {
    assert.equal(row.owner, "113", `${row.set}: the owner is 113`);
    assert.equal(row.closedBy, "Design", `${row.set}: closed by Design`);
    assert.equal(row.standing, "accepted", `${row.set}: the row stands in the annex`);
    assert.ok(row.unknownValue.length > 0, `${row.set}: no unknown-value rule`);
    assert.ok(row.literals.length > 0, `${row.set}: no members as literals`);
    assert.ok(row.table.length > 0, `${row.set}: no table named`);
    assert.ok(row.setInSpec.length > 0, `${row.set}: the name in spec.md is not recorded`);
    // The prose cell and the literals agree.
    for (const member of row.literals) {
      assert.ok(row.members.includes(member), `${row.set}: \`${member}\` is not in \`members\``);
    }
  }
  // spec.md calls two of the three a proposed row; the record keeps that.
  assert.equal(
    data.sets.filter((s) => s.setInSpec.includes("proposed row")).length,
    2,
    "spec.md calls two rows proposed",
  );
  // The members of each row, as spec.md gives them.
  const byRow = new Map(data.sets.map((s) => [Number(s.row), s]));
  assert.deepEqual(byRow.get(84)?.literals, [
    "hooks",
    "statusSurface",
    "background",
    "evals",
    "model",
    "stateRootWritable",
  ]);
  assert.deepEqual(byRow.get(144)?.literals, ["specstride-run", "specstride-reverse", "doctor"]);
  assert.deepEqual(byRow.get(145)?.literals, [
    "static size",
    "reference closure",
    "golden output",
    "supervision cycle",
    "judgment payload",
    "host cross-check",
    "startup",
  ]);
  assert.equal(byRow.get(145)?.literals.length, 7, "seven checks");
});

test("T003: the three rows agree with annex X §X.6, and each carries its members in the registry", () => {
  const data = readJson<{ sets: Row[] }>(DELIVERED);
  const byRow = new Map(data.sets.map((s) => [Number(s.row), s]));
  const annex = readJson<{
    closedSets: {
      number: number;
      name: string;
      owner: string;
      closedBy: string;
      unknownValue: string;
    }[];
  }>("packages/contracts/data/closed-sets.json");
  // The count follows the annex as it grows: row 286 is the closed set of
  // feature 152 (the effects of a commit-gate rule), owner "152", so the
  // pinned literal here is the annex's row count, not T257's 285.
  assert.equal(annex.closedSets.length, 286, "annex X §X.6 holds 286 rows");

  for (const number of ROWS_OF_113) {
    const row = byRow.get(number);
    assert.ok(row !== undefined, `the file holds no row ${number}`);
    const annexRow = annex.closedSets.find((r) => r.number === number);
    assert.ok(annexRow !== undefined, `annex X §X.6 holds no row ${number}`);
    assert.equal(annexRow.name, row.set, `row ${number}: the name`);
    assert.equal(annexRow.owner, row.owner, `row ${number}: the owner`);
    assert.equal(annexRow.closedBy, row.closedBy, `row ${number}: closed by`);
    assert.equal(annexRow.unknownValue, row.unknownValue, `row ${number}: unknown value`);

    // The assembled registry of the package: the set exists AND carries its
    // members, so `has()` answers. Before T003 rows 84 and 145 were empty.
    const set = closedSets.get(number);
    assert.ok(set !== undefined, `the registry holds no closed set ${number}`);
    assert.equal(set.name, row.set);
    assert.equal(set.owner, "113");
    assert.deepEqual([...set.members], row.literals, `row ${number}: the members of the registry`);
    assert.ok(set.members.length > 0, `row ${number} registers with no member`);
    for (const member of row.literals) {
      assert.equal(set.has(member), true, `row ${number}: \`${member}\` is not a member`);
    }
    assert.equal(set.has("no-such-member"), false, `row ${number}: an unknown value is a member`);
  }
});

test("T003: row 84 refers to the capability table of annex H §H.1", () => {
  const set = closedSets.get(84);
  assert.ok(set !== undefined);
  assert.deepEqual([...set.members], [...CAPABILITIES]);
  assert.equal(set.members.length, 6, "six capabilities");
  // Unknown value of row 84: ignored (it is not refused).
  assert.equal(set.onUnknown("no-such-capability").kind, "ignore");
});

test("T003: row 145 refers to the seven checks of the context-cost build", () => {
  assert.equal(CONTEXT_COST_ROW, 145);
  assert.equal(CONTEXT_COST_CHECK_COUNT, 7);
  assert.equal(CONTEXT_COST_CHECKS.length, 7);
  assert.equal(CONTEXT_COST_SET_NAME, "Checks of the context-cost build");
  assert.equal(CONTEXT_COST_SET_NAME_IN_SPEC, "Checks of the context-cost CI");
  const set = closedSets.get(145);
  assert.ok(set !== undefined);
  assert.deepEqual([...set.members], [...CONTEXT_COST_CHECKS]);
  // Unknown value of row 145: the build fails, so the rule refuses.
  assert.equal(set.onUnknown("no-such-check").kind, "refuse");
  assert.equal(isContextCostCheck("startup"), true);
  assert.equal(isContextCostCheck("no-such-check"), false);
  // Row 144's members, as the same module holds them.
  assert.deepEqual(
    [...HOST_SKILL_AND_ENTRY_IDS],
    ["specstride-run", "specstride-reverse", "doctor"],
  );
  assert.equal(rowOf113(145)?.set, CONTEXT_COST_SET_NAME);
  assert.equal(rowOf113(999), undefined);
});
