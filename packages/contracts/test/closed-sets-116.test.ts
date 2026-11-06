/**
 * T003 of feature 116 — the five closed sets the feature states, added to the
 * static test of the closed sets (annex X, §X.6, rows 27, 65, 66, 142, 143;
 * F100-FR-208, F100-FR-209; F116-FR-007, F116-FR-021; the section "Closed
 * sets" of `specs/116-check-integrity-and-unit-evidence/spec.md`).
 *
 * Three sources must agree for every one of the five sets:
 *
 * 1. `packages/contracts/data/closed-sets-116.json` — the data the feature
 *    declares, delivered from `specs/116-check-integrity-and-unit-evidence/contracts/closed-sets.json`
 *    through `contracts/deliver.json` (byte identity is proved by
 *    `deliver-116.test.ts`; this file proves the CONTENT).
 * 2. `packages/contracts/data/closed-sets.json` — the shipped list of the
 *    `contracts` package, where each set has its row of annex X §X.6
 *    (members, literals, owner, closedBy, unknown-value rule).
 * 3. `specs/100-specstride/annexes/X-cross-layer.md` §X.6 itself — read as
 *    text at test time, so a change of a row of the annex fails here and not
 *    only after the next regeneration of the data file.
 *
 * The rule for an unknown value is part of the set: the data file states it,
 * and the test asserts it equals the rule of the annex and of the shipped
 * row. F100-FR-209 asks exactly this: a static test fails when a set has no
 * row in §X.6, when a row names a member the data does not hold, or when the
 * unknown-value rule differs.
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
  JSON.parse(readFileSync(resolve(PKG_ROOT, "data/closed-sets-116.json"), "utf8")) as {
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

/** The rows of annex X §X.6 that feature 116 owns, as the annex words them. */
const ANNEX_ROWS: Record<string, { name: string; members: string; unknownValue: string }> = {
  "27": {
    name: "`protection`",
    members: "`prevent`, `detect`",
    unknownValue: "Read as `detect`",
  },
  "65": {
    name: "Integrity kinds that reach the critic",
    members:
      "`ledger-invalid`, `manifest-mismatch`, `pin-mismatch`, `changed-during-check`, `phase-entry-mismatch`, `toolchain-config-changed`, `advisory-marker-removed`, and the two neutral kinds of 142, `tree-changed-outside-pass` and `protected-change-not-applied`",
    unknownValue: "The kind is not shown to the critic; it stays in the event file",
  },
  "66": {
    name: "Further facts of the fact block",
    members:
      "`manifest-rederived`, `result-of-stopped-job`, `evidence-predates-tree`, `source-change-accepted`, `task-list-changed`",
    unknownValue: "Not shown",
  },
  "142": {
    name: "Classes of the protected set",
    members: "A, B",
    unknownValue: "Read as class A",
  },
  "143": {
    name: "Freshness of a result",
    members: "`current`, `superseded`",
    unknownValue: "Read as `superseded`",
  },
};

/** Loose text of members: drop backticks, drop the word `feature`, squash space. */
const norm = (s: string): string =>
  s
    .replace(/`/g, "")
    .replace(/\bfeature\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** The members of the annex row 27/65/66/142/143, read from the annex file. */
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

test("T003: the data file declares exactly the five sets of spec.md, each with its unknown-value rule", () => {
  assert.equal(declared.length, 5);
  assert.deepEqual(
    declared.map((s) => s.row),
    ["27", "65", "66", "142", "143"],
  );
  for (const s of declared) {
    assert.notEqual(s.set.trim(), "", `row ${s.row} has a name`);
    assert.notEqual(s.members.trim(), "", `row ${s.row} lists its members`);
    assert.equal(s.closedBy, "Design", `row ${s.row} is closed by design`);
    assert.ok(
      s.unknownValue.trim().length > 0,
      `row ${s.row} states what a reader does with an unknown value`,
    );
  }
});

test("T003: every declared set equals its row of annex X §X.6 (F100-FR-208)", () => {
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

test("T003: every declared set equals its row in packages/contracts/data/closed-sets.json (F100-FR-209)", () => {
  for (const s of declared) {
    const row = shipped.find((r) => r.number === Number(s.row));
    assert.ok(row, `row ${s.row} is in the shipped list of closed sets`);
    assert.equal(row.owner, "116", `row ${s.row} is owned by feature 116`);
    assert.equal(row.closedBy, s.closedBy, `row ${s.row}: closedBy`);
    assert.equal(norm(row.unknownValue), norm(s.unknownValue), `row ${s.row}: unknown value`);
    assert.equal(norm(row.members), norm(s.members), `row ${s.row}: members`);
    // Where the shipped row carries literals, every literal is a member the
    // declared set names (the membership as a whole is pinned exactly by the
    // annex comparison above; row 142 names the classes A and B, which the
    // shipped row holds as text, with an empty literal list).
    if (row.literals.length > 0) {
      for (const literal of row.literals) {
        assert.ok(
          norm(s.members).includes(literal),
          `row ${s.row}: the declared members name the literal ${literal}`,
        );
      }
    } else {
      assert.equal(s.row, "142", `only row 142 ships no literals`);
    }
  }
});

test("T003: the members the spec.md table states are the members the data file holds", () => {
  // The literal member lists of `specs/116-check-integrity-and-unit-evidence/spec.md`,
  // section "Closed sets", pinned here so a change of the specification fails
  // the static test until the data file follows it.
  const membersOfSpec = new Map<string, string[]>([
    ["27", ["prevent", "detect"]],
    [
      "65",
      [
        "ledger-invalid",
        "manifest-mismatch",
        "pin-mismatch",
        "changed-during-check",
        "phase-entry-mismatch",
        "toolchain-config-changed",
        "advisory-marker-removed",
        "tree-changed-outside-pass",
        "protected-change-not-applied",
      ],
    ],
    [
      "66",
      [
        "manifest-rederived",
        "result-of-stopped-job",
        "evidence-predates-tree",
        "source-change-accepted",
        "task-list-changed",
      ],
    ],
    ["142", ["A", "B"]],
    ["143", ["current", "superseded"]],
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
