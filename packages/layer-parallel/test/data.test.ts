/**
 * T002 — the data of this feature, and its comparison with `spec.md`.
 *
 * `data/` is a copy of `specs/142-parallel-units/contracts/`. Two things are
 * proved here:
 *
 * 1. the copy is byte-identical to the specification's folder — no file of
 *    `data/` has drifted from the one the feature owns, and none is missing;
 * 2. the content of every data file agrees with `spec.md`, which is the
 *    authority: `contracts/README.md` says "Where a file and `spec.md`
 *    differ, `spec.md` stands". The sets, the `[LOOP]` fields, the
 *    vocabulary list and the fixtures of experiment E6 are parsed out of
 *    `spec.md` and compared with the JSON, so a change to one side that is
 *    not made on the other fails this test.
 *
 * The sources in `spec.md`: the section "Closed sets" (the table), and the
 * requirements F142-FR-022 (`[LOOP]` fields), F142-FR-066 (vocabulary) and
 * F142-FR-072 (FX-PAR-S and FX-PAR-L).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { DATA_FILES } from "../src/index.ts";

const HERE = dirname(fileURLToPath(import.meta.url)); // packages/layer-parallel/test
const PKG = dirname(HERE); // packages/layer-parallel
const ROOT = dirname(dirname(PKG)); // the repository root
const DATA = join(PKG, "data");
const CONTRACTS = join(ROOT, "specs/142-parallel-units/contracts");
const SPEC = join(ROOT, "specs/142-parallel-units/spec.md");

const sha256 = (bytes: Buffer): string => createHash("sha256").update(bytes).digest("hex");

const readData = (name: string): unknown =>
  JSON.parse(readFileSync(join(DATA, name), "utf8")) as unknown;

const specText = (): string => readFileSync(SPEC, "utf8");

/** The text of one requirement of `spec.md`, by its id. */
function requirement(id: string): string {
  const line = specText()
    .split("\n")
    .find((l) => l.startsWith(`- **${id}**:`));
  assert.ok(line !== undefined, `${id} is a requirement of spec.md`);
  return line;
}

/** Every token written in backticks in a stretch of text. */
function backticked(text: string): string[] {
  return [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1] as string);
}

/* ------------------------------------------------------------------ *
 * 1. The copy
 * ------------------------------------------------------------------ */

test("T002: data/ is a byte-identical copy of specs/142-parallel-units/contracts/", () => {
  const owned = readdirSync(CONTRACTS).sort();
  const copied = readdirSync(DATA).sort();
  assert.deepEqual(copied, owned, "data/ holds exactly the files of contracts/");
  assert.ok(owned.length > 0, "contracts/ is not empty");
  for (const name of owned) {
    const a = readFileSync(join(CONTRACTS, name));
    const b = readFileSync(join(DATA, name));
    assert.equal(
      sha256(b),
      sha256(a),
      `${name}: the copy in data/ is byte-identical to the one in contracts/`,
    );
  }
  // The four JSON files the README of contracts/ lists are all present and
  // parse; `DATA_FILES` of the package names the same four.
  assert.deepEqual(
    [...DATA_FILES].sort(),
    owned.filter((n) => n.endsWith(".json")).sort(),
    "DATA_FILES names every JSON file of data/",
  );
  for (const name of DATA_FILES) assert.equal(typeof readData(name), "object");
});

/* ------------------------------------------------------------------ *
 * 2a. closed-sets.json against the table of the section "Closed sets"
 * ------------------------------------------------------------------ */

type SpecSet = { row: number; members: string[]; unknown: string };

/**
 * The table of the section "Closed sets" of `spec.md`, by the row number of
 * annex X §X.6. The members of a row are its backticked tokens, in order;
 * the unknown value is the last cell.
 */
function specClosedSets(): Map<number, SpecSet> {
  const text = specText();
  const start = text.indexOf("\n## Closed sets\n");
  assert.ok(start >= 0, "spec.md has a section 'Closed sets'");
  const rest = text.slice(start + 1);
  const end = rest.indexOf("\n## ", 1);
  const section = end >= 0 ? rest.slice(0, end) : rest;

  const out = new Map<number, SpecSet>();
  for (const line of section.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length !== 4) continue;
    const row = Number(cells[1]);
    if (!Number.isInteger(row)) continue; // the header and the separator
    out.set(row, {
      row,
      members: backticked(cells[2] as string),
      unknown: cells[3] as string,
    });
  }
  assert.equal(out.size, 5, "the table holds the five closed sets of this feature");
  return out;
}

test("T002: closed-sets.json agrees with the table 'Closed sets' of spec.md", () => {
  const data = readData("closed-sets.json") as {
    feature: string;
    sets: {
      name: string;
      annexXRow: number;
      closedBy: string;
      members: string[] | Record<string, string[]>;
      unknown: string;
    }[];
    contributedTo: { annexXRow: number; owner: string; members: string[] }[];
  };
  const fromSpec = specClosedSets();

  assert.equal(data.feature, "142-parallel-units");
  assert.equal(data.sets.length, fromSpec.size, "one entry per row of the table");
  assert.deepEqual(
    data.sets.map((s) => s.annexXRow).sort((x, y) => x - y),
    [...fromSpec.keys()].sort((x, y) => x - y),
    "the rows of annex X §X.6 are the rows of the table",
  );

  for (const set of data.sets) {
    const spec = fromSpec.get(set.annexXRow);
    assert.ok(spec !== undefined, `row ${set.annexXRow} is in the table`);
    // Every set of this feature is closed by design, as the section says.
    assert.equal(set.closedBy, "design", `${set.name}: closed by design`);
    // The unknown-value rule, compared without regard to the capital the
    // table starts its cell with.
    assert.equal(
      set.unknown.toLowerCase(),
      spec.unknown.toLowerCase(),
      `${set.name}: the unknown value is the one of the table`,
    );
    // The members. Row 185 is given in the table as two groups, "For the
    // phase attempt: …" and "For the run: …", and in the JSON as an object
    // of the same two lists; their concatenation is the backticked tokens of
    // the cell, in order.
    const members = Array.isArray(set.members)
      ? set.members
      : [...(set.members.attempt ?? []), ...(set.members.run ?? [])];
    assert.deepEqual(
      members,
      spec.members,
      `${set.name}: the members are those of the table, in order`,
    );
    assert.ok(members.length > 0, `${set.name} has members`);
  }

  // The named shape of row 185: the table splits it, so the JSON must too.
  const offReasons = data.sets.find((s) => s.annexXRow === 185);
  assert.ok(offReasons !== undefined);
  assert.equal(offReasons.name, "layer-off-reasons");
  assert.ok(!Array.isArray(offReasons.members), "row 185 is split in two lists");
  const split = offReasons.members as Record<string, string[]>;
  assert.deepEqual(split.attempt, [
    "group-failures",
    "harness-error",
    "unchecked",
    "missing-object",
    "ledger",
    "check-budget",
  ]);
  assert.deepEqual(split.run, ["plan-hash", "apply-incomplete"]);
  const cell = fromSpec.get(185) as SpecSet;
  const attemptAt = specText().indexOf("For the phase attempt:");
  const runAt = specText().indexOf("For the run:");
  assert.ok(attemptAt >= 0 && runAt > attemptAt, "the table splits row 185 in that order");
  assert.deepEqual(cell.members, [...split.attempt, ...split.run]);

  // The two members this feature contributes to row 65, which belongs to 116.
  assert.equal(data.contributedTo.length, 1);
  const contributed = data.contributedTo[0] as {
    annexXRow: number;
    owner: string;
    members: string[];
  };
  assert.equal(contributed.annexXRow, 65);
  assert.equal(contributed.owner, "116");
  assert.deepEqual(contributed.members, [
    "tree-changed-outside-pass",
    "protected-change-not-applied",
  ]);
  const closing = specText();
  assert.ok(
    closing.includes("Integrity kinds that reach the critic (row 65) belong to feature 116."),
    "spec.md gives row 65 to feature 116",
  );
  for (const member of contributed.members) {
    assert.ok(
      closing.includes("`" + member + "`"),
      `spec.md names the contributed member ${member}`,
    );
  }
});

/* ------------------------------------------------------------------ *
 * 2b. loop-fields.json against F142-FR-022
 * ------------------------------------------------------------------ */

test("T002: loop-fields.json agrees with F142-FR-022 of spec.md", () => {
  const data = readData("loop-fields.json") as {
    loopLine: {
      onlyWithOptionOn: boolean;
      fields: { key: string; values?: string[]; type?: string; from?: string; when?: string }[];
    };
    runRecord: string[];
    note: string;
  };
  const fr022 = requirement("F142-FR-022");

  // The requirement adds the fields "only with the option on".
  assert.equal(data.loopLine.onlyWithOptionOn, true);
  assert.ok(
    fr022.includes("only with the option on"),
    "F142-FR-022 adds the fields only with the option on",
  );

  // The keys the requirement writes as `key=`, in order, are the keys of the
  // JSON apart from `reason`, which the requirement gives as "the fallback
  // reason" rather than as a `key=` token.
  const keysInSpec = backticked(fr022)
    .filter((t) => t.endsWith("="))
    .map((t) => t.slice(0, -1));
  assert.deepEqual(
    keysInSpec,
    [
      "parallel",
      "workers",
      "groups",
      "group-failures",
      "refused",
      "worker-caches",
      "wall-hours",
      "agent-hours",
    ],
    "the `key=` tokens of F142-FR-022",
  );
  const keysInData = data.loopLine.fields.map((f) => f.key);
  assert.deepEqual(
    keysInData.filter((k) => k !== "reason"),
    keysInSpec,
    "loop-fields.json holds the keys of F142-FR-022, in the order of the requirement",
  );

  // The fallback reason: the requirement names it, and the JSON carries it as
  // the field `reason`, read from the two closed sets of reasons and written
  // only when the option is off.
  assert.ok(fr022.includes("and the fallback reason"), "F142-FR-022 names the fallback reason");
  const reason = data.loopLine.fields.find((f) => f.key === "reason");
  assert.ok(reason !== undefined, "loop-fields.json carries the fallback reason");
  assert.equal(reason.from, "fallback-reasons or layer-off-reasons");
  assert.equal(reason.when, "parallel=off");
  // Both names it reads are names of sets of closed-sets.json.
  const setNames = new Set(
    (readData("closed-sets.json") as { sets: { name: string }[] }).sets.map((s) => s.name),
  );
  for (const name of ["fallback-reasons", "layer-off-reasons"]) {
    assert.ok(setNames.has(name), `${name} is a set of closed-sets.json`);
  }

  // Wall hours and agent hours are required of the line by the same sentence.
  assert.ok(
    fr022.includes("both wall hours and agent hours"),
    "F142-FR-022 requires both wall hours and agent hours",
  );
  for (const key of ["wall-hours", "agent-hours"]) {
    const field = data.loopLine.fields.find((f) => f.key === key);
    assert.ok(field !== undefined, `${key} is a field of the line`);
    assert.equal(field.type, "number");
  }

  // The `parallel` field is the switch; `worker-caches` is a closed pair.
  assert.deepEqual(data.loopLine.fields.find((f) => f.key === "parallel")?.values, ["on", "off"]);
  assert.deepEqual(data.loopLine.fields.find((f) => f.key === "worker-caches")?.values, [
    "profile",
    "shared",
  ]);

  // The note points at the row of annex G §G.3 that the requirement cites.
  assert.ok(fr022.includes("annex G §G.3"), "F142-FR-022 cites annex G §G.3");
  assert.ok(data.note.includes("Annex G §G.3"), "the note cites the same annex");

  // The run record holds the configuration of the option, every key under
  // `loop.parallel.`.
  assert.ok(data.runRecord.length > 0);
  for (const key of data.runRecord) {
    assert.ok(key.startsWith("loop.parallel."), `${key} is a key of the option`);
  }
  assert.ok(
    data.runRecord.includes("loop.parallel.workersMax"),
    "the ceiling of workers is in the run record",
  );
});

/* ------------------------------------------------------------------ *
 * 2c. vocabulary.json against F142-FR-066
 * ------------------------------------------------------------------ */

test("T002: vocabulary.json agrees with F142-FR-066 of spec.md", () => {
  const data = readData("vocabulary.json") as {
    source: string;
    appliesTo: string;
    caseSensitive: boolean;
    forbidden: string[];
    forbiddenAtRunTime: string[];
    baseline: string;
  };
  const fr066 = requirement("F142-FR-066");

  // The list of the requirement: the words between "MUST find none of:" and
  // ", and the opaque tokens". A word the requirement writes with a trailing
  // hyphen (`integrat-`, `refus-`) is a stem; the JSON holds the stem without
  // the hyphen.
  const after = fr066.slice(fr066.indexOf("MUST find none of:") + "MUST find none of:".length);
  const listText = after.slice(0, after.indexOf(", and the opaque tokens"));
  const wordsInSpec = listText
    .split(",")
    .map((w) => w.trim().replace(/-$/, ""))
    .filter((w) => w.length > 0);
  assert.deepEqual(
    wordsInSpec,
    ["group", "worker", "parallel", "merge", "integrat", "refus", "snapshot"],
    "the list of F142-FR-066",
  );
  assert.deepEqual(
    data.forbidden,
    wordsInSpec,
    "vocabulary.json holds the words of F142-FR-066, in the order of the requirement",
  );

  // The requirement puts the opaque tokens on the list too; the JSON keeps
  // them apart, because they are known only at run time.
  assert.ok(fr066.includes("and the opaque tokens"), "F142-FR-066 names the opaque tokens");
  assert.equal(data.forbiddenAtRunTime.length, 2);
  for (const entry of data.forbiddenAtRunTime) {
    assert.ok(entry.includes("opaque"), `${entry} is an opaque value`);
  }

  // The reach of the test, and the baseline, as the requirement states them.
  assert.ok(
    fr066.includes(data.appliesTo),
    "the reach of the test is the one F142-FR-066 states, word for word",
  );
  assert.equal(data.caseSensitive, false, "the search ignores case");
  assert.ok(
    data.baseline.includes("serial run of the same fixture"),
    "a word of the project's own text is no finding",
  );
  assert.equal(data.source, "R29v PU-83");
});

/* ------------------------------------------------------------------ *
 * 2d. fx-par.json against F142-FR-072
 * ------------------------------------------------------------------ */

test("T002: fx-par.json agrees with F142-FR-072 of spec.md", () => {
  const data = readData("fx-par.json") as {
    "FX-PAR-S": {
      cost: string;
      when: string;
      fixtures: string[];
      passMark: string;
      note: string;
    };
    "FX-PAR-L": {
      cost: string;
      arms: string[];
      selection: string;
      passMark: string;
      defaultCondition: string;
    };
  };
  const fr072 = requirement("F142-FR-072");

  const small = data["FX-PAR-S"];
  const large = data["FX-PAR-L"];

  // FX-PAR-S: stubs, no cost, once per release candidate.
  assert.ok(
    fr072.includes("FX-PAR-S (stubs, no cost)"),
    "F142-FR-072 gives FX-PAR-S as stubs at no cost",
  );
  assert.equal(small.cost, "none");
  assert.ok(
    fr072.includes("MUST run once per release candidate"),
    "F142-FR-072 runs FX-PAR-S once per release candidate",
  );
  assert.equal(small.when, "once per release candidate");
  assert.ok(small.fixtures.length > 0, "FX-PAR-S has fixtures");

  // Its pass mark is the one of the experiment: no breach, and every test of
  // a rule passes.
  assert.ok(
    fr072.includes("no breach of gate integrity, and every test of a rule passes"),
    "the pass mark of E6 is in F142-FR-072",
  );
  assert.ok(small.passMark.includes("every test of a rule passes"));
  assert.ok(small.passMark.includes("zero breaches of gate integrity"));

  // FX-PAR-L: live, paid, logged; the three arms; no pass mark for a default.
  assert.ok(
    fr072.includes("FX-PAR-L (live, paid, logged)"),
    "F142-FR-072 gives FX-PAR-L as live, paid and logged",
  );
  assert.equal(large.cost, "paid; logged");
  const armsText = fr072.slice(fr072.indexOf("MUST have the arms ") + "MUST have the arms ".length);
  const armsInSpec = (armsText.slice(0, armsText.indexOf(" and MUST carry no pass mark")) as string)
    .split(/,| and /)
    .map((a) => a.trim())
    .filter((a) => a.length > 0);
  assert.deepEqual(armsInSpec, ["serial", "2 workers", "4 workers"], "the arms of F142-FR-072");
  assert.deepEqual(large.arms, armsInSpec, "fx-par.json holds the three arms of F142-FR-072");
  assert.ok(
    fr072.includes("MUST carry no pass mark for a default"),
    "FX-PAR-L carries no pass mark for a default",
  );
  assert.ok(
    large.passMark.startsWith("none for a default"),
    "the pass mark of FX-PAR-L is none for a default",
  );
  // The same requirement asks the experiment to measure and report the
  // failure classes, the cost and the killed passes; the pass mark of
  // FX-PAR-L carries that list after the semicolon.
  assert.ok(
    fr072.includes("MUST measure and report the share of failed groups per class"),
    "F142-FR-072 asks for the share of failed groups per class",
  );
  for (const reported of ["failure classes", "cost", "killed passes"]) {
    assert.ok(large.passMark.includes(reported), `the pass mark of FX-PAR-L reports ${reported}`);
  }
  for (const phrase of ["cost with every pass counted", "killed passes by count and hours"]) {
    assert.ok(fr072.includes(phrase), `F142-FR-072 asks for ${phrase}`);
  }

  // The condition under which the option could stop being off by default,
  // word for word out of the requirement.
  assert.ok(
    fr072.includes(large.defaultCondition),
    "the default condition of fx-par.json is the one F142-FR-072 states, word for word",
  );
  assert.equal(
    large.defaultCondition,
    "a corpus with phase ceilings of 1.28 or more and at least 71 pairs",
  );
});
