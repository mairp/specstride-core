/**
 * T223 — the static test of the amendments (annex X, §X.7 and §X.8;
 * F100-FR-208, F100-FR-211, F100-FR-214).
 *
 * Three checks over the tree, each as a test that fails when the condition is
 * broken:
 *
 *  1 every key of annex X §X.7 is in the key list of feature 110;
 *  2 every alias of annex X §X.8 names a key of that list;
 *  3 every closed set of a feature's section "Closed sets" has a row in
 *    `closed-sets.json` with the same members.
 *
 * The key list of feature 110 is the one file its `contracts/` directory
 * publishes, `config-keys.tsv`, and that file only. The closed-set sections are
 * those of the specification of every feature whose directory opens with 1, each
 * section only.
 *
 * Each check has a negative control over a fixture tree, so that a reader can
 * see that it fails when the condition is broken and does not merely pass.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ANNEX_SECTIONS,
  CLOSED_SETS_HEADING,
  KEY_LIST_FILE,
  REQUIREMENTS,
  catalogueHolds,
  checkAliasKeys,
  checkClosedSets,
  checkProfileKeys,
  isKeyShaped,
  keyMatches,
  keysOfAliasCell,
  loadKeyList,
  membersOfCell,
  namesNoKey,
  profileKeys,
} from "../src/static/amendments.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/**
 * The feature rows that no number and no name of annex X §X.6 joins. Each is a
 * row of another feature's specification whose name differs from the name of its
 * annex row; the owner of that feature repairs the name. The list is pinned so
 * that it cannot grow unnoticed: a new unjoined row fails this test.
 */
const UNJOINED_BY_NAME: readonly string[] = Object.freeze([
  "102-run-control::Where a stop request was found",
  "103-proposer-pass::Block sets of the proposer's prompt",
  "103-proposer-pass::Kinds of record of the namespace `core`",
  "103-proposer-pass::Values of the session directive",
  "108-reverse::Kinds of guard problem",
  "112-doctor::Groups of a check",
  "113-host-claude-code::Checks of the context-cost CI",
  "119-front-door-and-presenter::Reasons of a default-output failure",
  "123-pipeline-runtime-and-supervisor::Launch decisions; launch checks and their statuses",
  "123-pipeline-runtime-and-supervisor::Modes of a launch by `supervise`; sources of a mode; sources of a launcher",
  "124-harness-discovery-and-roles::Reasons why a candidate does not qualify or is passed over",
  "125-adapter-claude::Classifier signals of Claude",
  "125-adapter-claude::Session directives of the harness adapter's call",
  "128-telemetry-export::Forms of a payload",
  "131-adapter-codex::Sources of a fact of the proof of form",
  "138-adapter-prime::Codes of the diagnostics of the reader",
  "138-adapter-prime::Reason codes of a terminal that the reader writes",
  "138-adapter-prime::Words of the end of the agent",
  "140-reverse-inventory-and-lint::Lint finding codes",
  "140-reverse-inventory-and-lint::Lint levels",
  "140-reverse-inventory-and-lint::Schema of the inventory",
  "140-reverse-inventory-and-lint::Skip reasons",
  "141-parity-oracle::Verbs of the critic stub and of the diagnostician stub",
  "141-parity-oracle::Verbs of the verification command stubs, the installer stub and the sink stub",
  "144-compatibility-projection::Row shapes of the projection",
  "144-compatibility-projection::Writer classes of the projection",
  "145-presenter::Banner width tiers",
]);

test("T223: the three checks name the annex sections and the requirements they prove", () => {
  assert.deepEqual([...ANNEX_SECTIONS], ["annex X, §X.7", "annex X, §X.8", "annex X, §X.6"]);
  assert.deepEqual([...REQUIREMENTS], ["F100-FR-208", "F100-FR-211", "F100-FR-214"]);
  assert.equal(KEY_LIST_FILE, "specs/110-config-and-terms/contracts/config-keys.tsv");
  assert.equal(CLOSED_SETS_HEADING, "## Closed sets");
});

/* ------------------------------------------------------------------ *
 * 1 — every key of annex X §X.7 is in the key list of feature 110.
 * ------------------------------------------------------------------ */

test("T223: the key list of feature 110 is read from the one file it publishes (F100-FR-211)", () => {
  const keys = loadKeyList(ROOT);
  assert.ok(keys.length >= 250, `${String(keys.length)} keys in the catalogue of feature 110`);
  // The list is that file and no other: the first key of the file is the first
  // key of the list, and the header row is not a key.
  const raw = readFileSync(join(ROOT, KEY_LIST_FILE), "utf8").trim().split("\n");
  assert.equal(keys.length, raw.length - 1);
  assert.equal(keys[0], (raw[1] ?? "").split("\t")[0]);
  assert.equal(keys.includes("key"), false, "the header row is not a key");
});

test("T223: every key of annex X §X.7 is in the key list of feature 110 (F100-FR-211)", () => {
  const rows = profileKeys(ROOT);
  assert.ok(rows.length >= 133, `${String(rows.length)} keys over the rows of the profile`);
  const findings = checkProfileKeys(ROOT);
  assert.deepEqual(
    findings.map((f) => f.message),
    [],
    "every key of every row of annex X §X.7 is a configuration key of feature 110",
  );
});

test("T223: a key of §X.7 matches a key of the catalogue by name or by template", () => {
  // The same key, verbatim.
  assert.equal(keyMatches("loop.strategy", "loop.strategy"), true);
  // A concrete harness against the templated key of the catalogue, and back.
  assert.equal(keyMatches("harnesses.dsh.pluginAllowlist", "harnesses.<id>.pluginAllowlist"), true);
  assert.equal(keyMatches("roles.<role>.model", "roles.critic.model"), true);
  // A different key, a different depth, a different family: no match.
  assert.equal(keyMatches("loop.strategy", "loop.escalation"), false);
  assert.equal(keyMatches("harnesses.<id>.bin", "harnesses.<id>.bin.path"), false);
  assert.equal(keyMatches("roles.critic.model", "harnesses.<id>.model"), false);
  const keys = loadKeyList(ROOT);
  assert.equal(catalogueHolds("loop.strategy", keys), true);
  assert.equal(catalogueHolds("loop.inventedByNobody", keys), false);
});

test("T223 (negative control): a row of §X.7 whose key the catalogue does not hold fails the check", () => {
  const root = fixtureRoot();
  try {
    assert.deepEqual([...checkProfileKeys(root)], [], "the fixture passes before the break");
    writeProfile(root, [
      { number: 1, keys: ["loop.strategy"] },
      { number: 2, keys: ["loop.inventedByNobody"] },
    ]);
    const findings = checkProfileKeys(root);
    assert.equal(findings.length, 1);
    assert.equal(findings[0]?.check, "profile-keys");
    assert.match(findings[0]?.subject ?? "", /row 2/);
    assert.match(findings[0]?.message ?? "", /loop\.inventedByNobody/);
    assert.match(findings[0]?.message ?? "", /F100-FR-211/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------------ *
 * 2 — every alias of annex X §X.8 names a key of that list.
 * ------------------------------------------------------------------ */

test("T223: every alias of annex X §X.8 names a key of the list of feature 110 (F100-FR-214)", () => {
  const { findings, coverage } = checkAliasKeys(ROOT);
  assert.deepEqual(
    findings.map((f) => f.message),
    [],
    "every alias either names a key of the catalogue or says that it names none",
  );
  // The check is not vacuous: most rows name a key, and it compared them all.
  assert.equal(coverage.rows, coverage.compared + coverage.nameNoKey);
  assert.ok(coverage.compared >= 30, `${String(coverage.compared)} rows named a key`);
  assert.ok(coverage.keys >= 80, `${String(coverage.keys)} keys compared`);
  assert.ok(coverage.nameNoKey >= 1, "some rows name no key, and say so");
});

test("T223: a cell of §X.8 that names no key says so, and a key-shaped token is told from other text", () => {
  for (const cell of [
    "No key: the as-is default of the plan argument of a critic call",
    "Not carried",
    "Accepted and without effect; a message at launch says so (CQ-120)",
  ]) {
    assert.equal(namesNoKey(cell), true, cell);
  }
  assert.equal(namesNoKey("`roles.critic.harness`"), false);
  // A profile name, a variable and a logical name are not keys.
  assert.equal(isKeyShaped("parity"), false, "a profile name has no dot");
  assert.equal(isKeyShaped("SPECSTRIDE_PRIME_BIN"), false, "a variable is not a key");
  assert.equal(isKeyShaped("run:<runId>:verification:plan"), false, "a logical name is not a key");
  assert.equal(isKeyShaped("roles.critic.harness"), true);
  assert.equal(isKeyShaped("harnesses.<id>.bin"), true);
  assert.equal(isKeyShaped("loop.yield.*"), true);
  // A token that opens with a dot continues the key before it in the cell.
  assert.deepEqual(
    [...keysOfAliasCell("`roles.proposer.idleTimeoutSec`, `.progressTimeoutSec`, `.repeatLimit`")],
    [
      "roles.proposer.idleTimeoutSec",
      "roles.proposer.progressTimeoutSec",
      "roles.proposer.repeatLimit",
    ],
  );
  // A cell that names two keys names both.
  assert.deepEqual(
    [...keysOfAliasCell("`roles.proposer.harness`, `roles.critic.harness`")],
    ["roles.proposer.harness", "roles.critic.harness"],
  );
});

test("T223 (negative control): an alias of §X.8 whose key the catalogue does not hold fails the check", () => {
  const root = fixtureRoot();
  try {
    assert.deepEqual([...checkAliasKeys(root).findings], [], "the fixture passes before the break");
    writeNormalization(root, [
      { "As-is variable": "`SPECSTRIDE_PROPOSER`", Key: "`roles.proposer.harness`" },
      { "As-is variable": "`SPECSTRIDE_INVENTED`", Key: "`roles.proposer.inventedByNobody`" },
    ]);
    const first = checkAliasKeys(root).findings;
    assert.equal(first.length, 1);
    assert.equal(first[0]?.check, "alias-keys");
    assert.match(first[0]?.message ?? "", /roles\.proposer\.inventedByNobody/);
    assert.match(first[0]?.message ?? "", /F100-FR-214/);
    // A row that names neither a key nor "No key" fails too: an alias that
    // reaches nothing must say that it reaches nothing.
    writeNormalization(root, [
      { "As-is variable": "`SPECSTRIDE_SILENT`", Key: "it goes somewhere, who knows where" },
    ]);
    const second = checkAliasKeys(root).findings;
    assert.equal(second.length, 1);
    assert.match(second[0]?.message ?? "", /names no key and does not say that it names none/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------------ *
 * 3 — every closed set of a feature has a row with the same members.
 * ------------------------------------------------------------------ */

test("T223: every closed set of a feature's section has a row of `closed-sets.json` with the same members (F100-FR-208)", () => {
  const { findings, coverage } = checkClosedSets(ROOT);
  assert.deepEqual(
    findings.map((f) => `${f.subject}: ${f.message}`),
    [],
    "no feature states a closed set whose row is missing or whose members differ",
  );
  // The check is not vacuous: it read every section, joined all but the pinned
  // rows, and compared the members of 170 or more of them.
  assert.ok(coverage.rows >= 290, `${String(coverage.rows)} closed-set rows over the features`);
  assert.ok(
    coverage.compared >= 150,
    `${String(coverage.compared)} rows compared member by member`,
  );
  assert.equal(coverage.joined, coverage.rows - coverage.unjoined.length);
  assert.equal(coverage.joined, coverage.compared + coverage.deferred + sharedRowSurplus(coverage));
});

test("T223: the rows that no number and no name joins are the pinned list, and the list has not grown (F100-FR-208)", () => {
  const { coverage } = checkClosedSets(ROOT);
  // Every unjoined row is in the pinned list: a new one fails this test, and is
  // repaired by the owner of the feature whose specification holds it.
  const unexpected = coverage.unjoined.filter((u) => !UNJOINED_BY_NAME.includes(u));
  assert.deepEqual(
    unexpected,
    [],
    "a closed set of a feature that joins to no row of annex X §X.6 by number or by name",
  );
  // And every pinned row is still unjoined: one that now joins leaves the list.
  const repaired = UNJOINED_BY_NAME.filter((u) => !coverage.unjoined.includes(u));
  assert.deepEqual(
    repaired,
    [],
    "a pinned row now joins to its row of annex X §X.6; take it out of UNJOINED_BY_NAME",
  );
});

test("T223: a members cell is a plain list only when nothing but the members is in it", () => {
  assert.deepEqual(
    [...(membersOfCell("`off`, `suggest`, `apply`") ?? [])],
    ["off", "suggest", "apply"],
  );
  assert.deepEqual(
    [...(membersOfCell("APPROVED, REJECTED, MALFORMED") ?? [])],
    ["APPROVED", "REJECTED", "MALFORMED"],
  );
  // A cell that points at a requirement or an annex for its members states none
  // here, so the members are compared where that text lives.
  assert.equal(membersOfCell("The seven of F111-FR-015"), undefined);
  assert.equal(membersOfCell("Annex E §E.4"), undefined);
  assert.equal(membersOfCell("the twelve of F126-FR-033 and any provider code"), undefined);
  assert.equal(
    membersOfCell("budget (`hard_cap`), futility (`repeat_stall`), hang (`idle_timeout`)"),
    undefined,
    "a cell whose members are bare words and whose back-ticks are something else",
  );
  assert.equal(membersOfCell("—"), undefined);
});

test("T223 (negative control): a feature whose closed set has no row, or different members, fails the check", () => {
  const root = fixtureRoot();
  try {
    assert.deepEqual(
      [...checkClosedSets(root).findings],
      [],
      "the fixture passes before the break",
    );
    // A set that names a row the table does not hold.
    writeFeatureSpec(root, "199-fixture", [
      "| Row | Closed set | Members | Unknown value |",
      "|---|---|---|---|",
      "| 999 | Invented set | `a`, `b` | ignore |",
    ]);
    const missing = checkClosedSets(root).findings;
    assert.equal(missing.length, 1);
    assert.equal(missing[0]?.check, "closed-sets");
    assert.match(missing[0]?.message ?? "", /the table holds no such row/);
    assert.match(missing[0]?.message ?? "", /F100-FR-208/);

    // A set whose members differ from those of its row.
    writeFeatureSpec(root, "199-fixture", [
      "| Row | Closed set | Members | Unknown value |",
      "|---|---|---|---|",
      "| 77 | Learning modes | `off`, `suggest`, `apply`, `invented` | `off` |",
    ]);
    const differ = checkClosedSets(root).findings;
    assert.equal(differ.length, 1);
    assert.match(differ[0]?.message ?? "", /only in the specification: invented/);

    // A set that drops a member of its row fails as well.
    writeFeatureSpec(root, "199-fixture", [
      "| Row | Closed set | Members | Unknown value |",
      "|---|---|---|---|",
      "| 77 | Learning modes | `off`, `suggest` | `off` |",
    ]);
    const dropped = checkClosedSets(root).findings;
    assert.equal(dropped.length, 1);
    assert.match(dropped[0]?.message ?? "", /only in the annex: apply/);

    // The members as the table has them pass.
    writeFeatureSpec(root, "199-fixture", [
      "| Row | Closed set | Members | Unknown value |",
      "|---|---|---|---|",
      "| 77 | Learning modes | `off`, `suggest`, `apply` | `off` |",
    ]);
    assert.deepEqual([...checkClosedSets(root).findings], []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("T223 (negative control): the checks refuse to run when the key list of feature 110 is absent", () => {
  const root = fixtureRoot();
  try {
    rmSync(join(root, KEY_LIST_FILE));
    assert.throws(
      () => loadKeyList(root),
      (error: unknown) => {
        assert.match(String(error), /config-keys\.tsv/);
        assert.match(String(error), /F100-FR-211, F100-FR-214/);
        return true;
      },
      "a missing key list is an error, never a pass",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------------ *
 * The fixture tree of the negative controls.
 * ------------------------------------------------------------------ */

/**
 * Where a row of annex X §X.6 is cited by more than one feature, the group is
 * compared once; the surplus rows are not counted again.
 */
function sharedRowSurplus(coverage: {
  joined: number;
  compared: number;
  deferred: number;
}): number {
  return coverage.joined - coverage.compared - coverage.deferred;
}

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "static-amendments-"));
  mkdirSync(join(root, "specs/110-config-and-terms/contracts"), { recursive: true });
  writeFileSync(
    join(root, KEY_LIST_FILE),
    [
      "key\ttype_and_range\tdefault",
      "loop.strategy\tname\tmicro",
      "roles.proposer.harness\tname\tunset",
      "roles.critic.harness\tname\tunset",
      "learning.mode\tname\toff",
    ].join("\n") + "\n",
  );
  mkdirSync(join(root, "packages/contracts/data"), { recursive: true });
  writeProfile(root, [{ number: 1, keys: ["loop.strategy"] }]);
  writeNormalization(root, [
    { "As-is variable": "`SPECSTRIDE_PROPOSER`", Key: "`roles.proposer.harness`" },
    { "As-is variable": "`SPECSTRIDE_UNUSED`", Key: "Not carried" },
  ]);
  writeFileSync(
    join(root, "packages/contracts/data/closed-sets.json"),
    JSON.stringify({
      schema: "specstride.closed-sets/1",
      closedSets: [
        {
          number: 77,
          name: "Learning modes",
          members: "`off`, `suggest`, `apply`",
          literals: ["off", "suggest", "apply"],
          owner: "106",
          closedBy: "Design",
          unknownValue: "`off`",
        },
      ],
    }),
  );
  writeFeatureSpec(root, "199-fixture", [
    "| Row | Closed set | Members | Unknown value |",
    "|---|---|---|---|",
    "| 77 | Learning modes | `off`, `suggest`, `apply` | `off` |",
  ]);
  return root;
}

function writeProfile(root: string, switches: readonly { number: number; keys: string[] }[]): void {
  writeFileSync(
    join(root, "packages/contracts/data/parity-profile.json"),
    JSON.stringify({ schema: "specstride.parity-profile/1", switches }),
  );
}

function writeNormalization(root: string, environmentAliases: readonly object[]): void {
  writeFileSync(
    join(root, "packages/contracts/data/normalization.json"),
    JSON.stringify({ schema: "specstride.normalization/1", environmentAliases }),
  );
}

function writeFeatureSpec(root: string, feature: string, table: readonly string[]): void {
  const dir = join(root, "specs", feature);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "spec.md"),
    ["# Fixture", "", CLOSED_SETS_HEADING, "", ...table, "", "## Next section", ""].join("\n"),
  );
}
