/**
 * T006 of feature 115 — the ten closed sets the feature states, added to the
 * static test of the closed sets (annex X, §X.6, rows 55, 56, 59, 67, 136,
 * 137, 138, 139, 140, 141; F100-FR-208, F100-FR-209; F115-FR-005, F115-FR-011,
 * F115-FR-030, F115-FR-034, F115-FR-039; the section "Closed sets" of
 * `specs/115-micro-loop-layer/spec.md`).
 *
 * Three sources must agree for every one of the ten sets:
 *
 * 1. `packages/contracts/data/closed-sets-115.json` — the data the feature
 *    declares (written by T006 itself, unlike the copied files of T004).
 * 2. `packages/contracts/data/closed-sets.json` — the shipped list of the
 *    `contracts` package, where each set has its row of annex X §X.6
 *    (members, literals, owner, closedBy, unknown-value rule).
 * 3. `specs/100-specstride/annexes/X-cross-layer.md` §X.6 itself — read as
 *    text at test time, so a change of a row of the annex fails here and not
 *    only after the next regeneration of the data file.
 *
 * The rule for an unknown value is part of the set: the data file states it,
 * and the test asserts it equals the rule of the annex and of the shipped
 * row. F100-FR-209 asks exactly this.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = resolve(PKG_ROOT, "../..");

type DeclaredSet = {
  row: string;
  set: string;
  members: string;
  closedBy: string;
  unknownValue: string;
};

const declared = (
  JSON.parse(readFileSync(resolve(PKG_ROOT, "data/closed-sets-115.json"), "utf8")) as {
    schema: string;
    owner: string;
    sets: DeclaredSet[];
  }
).sets;

const shipped = (
  JSON.parse(readFileSync(resolve(PKG_ROOT, "data/closed-sets.json"), "utf8")) as {
    closedSets: Array<{
      number: number;
      name: string;
      members: string;
      literals: string[];
      owner: string;
      closedBy: string;
      unknownValue: string;
    }>;
  }
).closedSets;

/** The rows of annex X §X.6 that feature 115 owns, as the annex words them. */
const ANNEX_ROWS: Record<string, { members: string; unknownValue: string }> = {
  "55": { members: "`classic`, `micro`", unknownValue: "Configuration error" },
  "56": {
    members: "L0, L1, L2, L3; Wave 1 uses L1",
    unknownValue: "Configuration error",
  },
  "59": {
    members: "`gate-not-executing`, `no-check`, `single-unit`, `harness`, `config`, `tripwire`",
    unknownValue: "Shown as text",
  },
  "67": {
    members:
      "`tools`: `run`, `exclude:flaky`, `exclude:slow`, `exclude:budget`. `loop`: `stay`, `off:<registered layer>`. `escalation`: `next-tier`, `skip:<skip reason>`. `attempt-tier` (of the attempt planner, owner 149): `bump`, `skip`, `none`. A layer may register a point",
    unknownValue: "The table is invalid",
  },
  "136": {
    members: "`kept`, `repair`, `unresolved`",
    unknownValue: "Read as `unresolved`",
  },
  "137": {
    members: "`unchecked`",
    unknownValue: "Read as `unchecked`",
  },
  "138": {
    members:
      "`pass-killed`, `foreign-id`, `yield-in-pass`, `not-regular`, `stale`, `too-large`, `changed-while-read`, `empty`",
    unknownValue: "The checkpoint is refused",
  },
  "139": {
    members:
      "`unit-declared`, `check-started`, `check-finished`, `unit-kept`, `unit-repair`, `unit-unresolved`, `command-excluded`, `escalation`, `closing-check`, `disengaged`, `integrity`",
    unknownValue: "The ledger is invalid for the layer; the layer is off for the phase attempt",
  },
  "140": {
    members:
      "`off`, `integrity`, `flaky`, `not-due`, `cap`, `no-ladder`, `critic-collision`, `quota`, `budget`",
    unknownValue: "Read as a skip; shown as text",
  },
  "141": {
    members:
      "`approval-without-gate`, `outer-counter-changed`, `critic-input-excluded-field`, `false-pass`",
    unknownValue: "Treated as a breach",
  },
};

/** Loose text of members: drop backticks, drop the word `feature`, squash space. */
const norm = (s: string): string =>
  s
    .replace(/`/g, "")
    .replace(/\bfeature\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** The members and unknown value of one row, read from the annex file. */
function annexRowTexts(row: string): { members: string; unknownValue: string } {
  const annex = readFileSync(
    resolve(REPO_ROOT, "specs/100-specstride/annexes/X-cross-layer.md"),
    "utf8",
  );
  const line = annex.split("\n").find((l) => new RegExp(`^\\| ${row} \\|`).test(l));
  assert.ok(line, `annex X §X.6 has no row ${row}`);
  const cells = line.split("|").map((c) => c.trim());
  // cells[0] is empty (leading pipe); cells[1] = row number, 2 = name,
  // 3 = members, 4 = owner, 5 = closedBy, 6 = unknown value.
  return { members: cells[3], unknownValue: cells[6] };
}

test("T006: the data file declares exactly the ten sets of spec.md, each with its unknown-value rule", () => {
  assert.equal(declared.length, 10);
  assert.deepEqual(
    declared.map((s) => s.row),
    ["55", "56", "59", "67", "136", "137", "138", "139", "140", "141"],
  );
  for (const s of declared) {
    assert.notEqual(s.set.trim(), "", `row ${s.row} has a name`);
    assert.notEqual(s.members.trim(), "", `row ${s.row} lists its members`);
    assert.ok(
      s.unknownValue.trim().length > 0,
      `row ${s.row} states what a reader does with an unknown value`,
    );
  }
});

test("T006: every declared set equals its row of annex X §X.6 (F100-FR-208)", () => {
  for (const s of declared) {
    const fromAnnexFile = annexRowTexts(s.row);
    const pinned = ANNEX_ROWS[s.row];
    assert.equal(
      norm(fromAnnexFile.members),
      norm(pinned.members),
      `row ${s.row}: the annex file and the pinned row disagree`,
    );
    assert.equal(
      norm(fromAnnexFile.unknownValue),
      norm(pinned.unknownValue),
      `row ${s.row}: the annex file and the pinned unknown value disagree`,
    );
    assert.equal(norm(s.members), norm(pinned.members), `row ${s.row}: members`);
    assert.equal(norm(s.unknownValue), norm(pinned.unknownValue), `row ${s.row}: unknown value`);
  }
});

test("T006: every declared set equals its row in packages/contracts/data/closed-sets.json (F100-FR-209)", () => {
  for (const s of declared) {
    const row = shipped.find((r) => r.number === Number(s.row));
    assert.ok(row, `row ${s.row} is in the shipped list of closed sets`);
    assert.equal(row.owner, "115", `row ${s.row} is owned by feature 115`);
    assert.equal(row.closedBy, s.closedBy, `row ${s.row}: closedBy`);
    assert.equal(norm(row.unknownValue), norm(s.unknownValue), `row ${s.row}: unknown value`);
    assert.equal(norm(row.members), norm(s.members), `row ${s.row}: members`);
    for (const literal of row.literals) {
      assert.ok(
        norm(s.members).includes(literal),
        `row ${s.row}: the declared members name the literal ${literal}`,
      );
    }
  }
});

test("T006: the members the spec.md table states are the members the data file holds", () => {
  // The literal member lists of `specs/115-micro-loop-layer/spec.md`,
  // section "Closed sets", pinned here so a change of the specification fails
  // the static test until the data file follows it.
  const membersOfSpec = new Map<string, string[]>([
    ["55", ["classic", "micro"]],
    ["56", ["L0", "L1", "L2", "L3"]],
    ["59", ["gate-not-executing", "no-check", "single-unit", "harness", "config", "tripwire"]],
    [
      "67",
      [
        "tools",
        "run",
        "exclude:flaky",
        "exclude:slow",
        "exclude:budget",
        "loop",
        "stay",
        "off:<registered layer>",
        "escalation",
        "next-tier",
        "skip:<skip reason>",
        "attempt-tier",
        "bump",
        "skip",
        "none",
      ],
    ],
    ["136", ["kept", "repair", "unresolved"]],
    ["137", ["unchecked"]],
    [
      "138",
      [
        "pass-killed",
        "foreign-id",
        "yield-in-pass",
        "not-regular",
        "stale",
        "too-large",
        "changed-while-read",
        "empty",
      ],
    ],
    [
      "139",
      [
        "unit-declared",
        "check-started",
        "check-finished",
        "unit-kept",
        "unit-repair",
        "unit-unresolved",
        "command-excluded",
        "escalation",
        "closing-check",
        "disengaged",
        "integrity",
      ],
    ],
    [
      "140",
      [
        "off",
        "integrity",
        "flaky",
        "not-due",
        "cap",
        "no-ladder",
        "critic-collision",
        "quota",
        "budget",
      ],
    ],
    [
      "141",
      [
        "approval-without-gate",
        "outer-counter-changed",
        "critic-input-excluded-field",
        "false-pass",
      ],
    ],
  ]);
  for (const s of declared) {
    const expected = membersOfSpec.get(s.row);
    assert.ok(expected, `row ${s.row} is in the table of spec.md`);
    const text = s.members.replace(/`/g, "").replace(/\s+/g, " ");
    for (const member of expected) {
      assert.ok(text.includes(member), `row ${s.row} names the member ${member}`);
    }
  }
});
