/**
 * Phase 8 (Polish) — the two tasks of the phase, made observable by a test.
 *
 *   T042  Run `python3 docs/ecosystem/check-traceability.py` and fix lines that
 *         name feature 104.
 *   T043  Report to the orchestrator the two items of the analyze report of
 *         2026-09-30 that are feature 100's: a schema id for the record
 *         `run:<runId>:task-list` in annex B §B.20 (F104-FR-026), and the rule
 *         owners of the obligation id (107) and of the signature of unmet
 *         criteria (101) in the row of annex X §X.5 (F104-FR-021). CQ-039 to
 *         CQ-045 and CQ-214 are closed and the rows of annex X exist; nothing
 *         else is open.
 *
 * Why a test and not a note. Both tasks are claims about files, and a claim of
 * the form "the checker reports no line of feature 104" is worth nothing unless
 * two further things are measured beside it: that the checker really has rows of
 * feature 104 to check (otherwise 0 lines means "it read nothing"), and that a
 * line WOULD be reported if one were owed. This file measures all three, and the
 * falsification runs on a SCRATCH copy of the two trees the checker reads, so
 * nothing of the repository is written — the same rule T041 follows.
 *
 * The checker is also a gate command of this phase, run directly by the gate
 * (`/usr/bin/python3.13 docs/ecosystem/check-traceability.py`). This file adds
 * the part the exit code alone does not carry.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The root of the repository: five levels up from `test/static/`. */
const ROOT = resolve(dirname(dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))))));

/** The checker of T042, relative to the repository root. */
export const CHECKER = "docs/ecosystem/check-traceability.py";

/** The two traceability files it reads beside `traceability.md`. */
export const FRS_TSV = "docs/ecosystem/traceability-frs.tsv";
export const ITEMS_TSV = "docs/ecosystem/traceability-items.tsv";

/** The destination name this feature carries in both files. */
export const DESTINATION = "104-spec-input";

/** The dispositions the checker counts as kept (`KEPT` of the checker). */
export const KEPT = ["ported", "translated", "merged-with"];

/** The line the checker prints when every check passes. */
// Checks i (the Stage B spec census) and j (the exercise-map note of F141-FR-032)
// extended the checker's pass line from "a to h" to "a to j" when feature 141
// landed its traceability additions.
export const PASS_LINE = "PASSED: checks a to j";

/** A reported failure of the checker: two spaces, then `[<check>] <message>`. */
export const REPORTED = /^ {2}\[([a-z0-9]+)\] (.*)$/;

const read = (relative: string): string => readFileSync(join(ROOT, relative), "utf8");

/* ------------------------------------------------------------------ *
 * Running the checker.
 * ------------------------------------------------------------------ */

/**
 * The interpreter the checker runs under. The gate of this phase runs
 * `/usr/bin/python3.13`; a plain `python3` is the same interpreter here. If
 * neither is on the path the test FAILS rather than skips: an absent
 * interpreter would turn "no line names 104" into "nothing was measured".
 */
export function pythonOf(candidates = [process.env["PYTHON"], "python3", "python3.13"]): string {
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      execFileSync(candidate, ["--version"], { stdio: "ignore" });
      return candidate;
    } catch {
      /* try the next one */
    }
  }
  throw new Error("no python3 interpreter: the traceability check cannot be measured");
}

export interface CheckerRun {
  readonly exit: number;
  readonly stdout: string;
  /** Every reported failure, without its two leading spaces. */
  readonly reported: readonly string[];
  /** The reported failures that name feature 104, by its number or its slug. */
  readonly namingThisFeature: readonly string[];
  readonly passed: boolean;
}

/** Runs the checker in `cwd` and reads its four surfaces off the output. */
export function runChecker(cwd: string, args: readonly string[] = []): CheckerRun {
  let exit = 0;
  let stdout = "";
  try {
    stdout = execFileSync(pythonOf(), [CHECKER, ...args], { cwd, encoding: "utf8" });
  } catch (error) {
    const failure = error as { status?: number; stdout?: string };
    exit = failure.status ?? -1;
    stdout = failure.stdout ?? "";
  }
  const reported = stdout
    .split("\n")
    .map((line) => REPORTED.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => `[${match[1]}] ${match[2]}`);
  return {
    exit,
    stdout,
    reported,
    namingThisFeature: reported.filter((line) => /104/.test(line)),
    passed: stdout.split("\n").some((line) => line.trim() === PASS_LINE),
  };
}

/* ------------------------------------------------------------------ *
 * The rows of feature 104, read from the two traceability files.
 * ------------------------------------------------------------------ */

const rowsOf = (text: string, fields: readonly string[]): Record<string, string>[] =>
  text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const cells = line.split("\t");
      const row: Record<string, string> = {};
      fields.forEach((field, i) => (row[field] = cells[i] ?? ""));
      return row;
    });

const isKept = (disposition: string): boolean => KEPT.includes(disposition.split(" ")[0] ?? "");

/** The kept as-is requirement rows the files give to this feature. */
export function keptRequirementRows(): readonly string[] {
  const rows = rowsOf(read(FRS_TSV), ["origin_id", "system", "disposition", "feature"]);
  return rows
    .filter((row) => row["feature"] === DESTINATION && isKept(row["disposition"] ?? ""))
    .map((row) => row["origin_id"] ?? "");
}

/** The kept behaviour items the files give to this feature, by cluster. */
export function keptItemRows(): readonly { readonly item: string; readonly cluster: string }[] {
  const rows = rowsOf(read(ITEMS_TSV), ["b_id", "cluster", "system", "disposition", "feature"]);
  return rows
    .filter((row) => row["feature"] === DESTINATION && isKept(row["disposition"] ?? ""))
    .map((row) => ({ item: row["b_id"] ?? "", cluster: row["cluster"] ?? "" }));
}

/** `origin:` and `proves:` fields, read as the checker reads them. */
const FIELD =
  /^\s+[-*] (origin|disposition|test|divergence|ep|parity|status|assumption|proves|fixture):\s*(.*)$/;
const CITED = /(?<![A-Za-z0-9-])((?:028|011|002) (?:FR|SC)-\d{3}|C-\d{3}|B-\d{4})(?![0-9])/g;

export function citationsOf(relative: string, field: "origin" | "proves"): Set<string> {
  const out = new Set<string>();
  for (const line of read(relative).split("\n")) {
    const match = FIELD.exec(line);
    if (match && match[1] === field)
      for (const [id] of (match[2] ?? "").matchAll(CITED)) out.add(id);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * T042 — the run, the lines that name feature 104, and the two controls.
 * ------------------------------------------------------------------ */

test("T042/the-checker-passes", () => {
  const run = runChecker(ROOT);
  assert.equal(run.exit, 0, `the checker failed:\n${run.reported.join("\n")}`);
  assert.ok(run.passed, `the checker printed no "${PASS_LINE}":\n${run.stdout}`);
});

test("T042/the-checker-passes-with-require-all", () => {
  // `--require-all` turns a Wave 1 feature without spec.md or tasks.md into a
  // failure instead of a note, so h3 is never skipped for any feature.
  const run = runChecker(ROOT, ["--require-all"]);
  assert.equal(run.exit, 0, `--require-all failed:\n${run.reported.join("\n")}`);
  assert.ok(run.passed);
  assert.match(run.stdout, /Stage B check: 41 of 41 Wave 1 features have a spec/);
});

test("T042/no-reported-line-names-feature-104", () => {
  // The task is "fix lines that name feature 104". This is the measurement of
  // how many such lines there are to fix: zero.
  const run = runChecker(ROOT);
  assert.deepEqual([...run.namingThisFeature], []);
  assert.deepEqual([...run.reported], []);
});

test("T042/the-check-is-not-vacuous-for-feature-104", () => {
  // Without this, "no line names 104" could mean the checker has nothing of
  // feature 104 to check at all.
  const requirements = keptRequirementRows();
  const items = keptItemRows();
  const clusters = new Set(items.map((row) => row.cluster));
  assert.deepEqual(
    [...requirements].sort(),
    ["002 FR-028", "002 FR-029", "011 FR-007", "028 FR-001", "028 FR-002", "028 FR-029"],
    "the kept as-is requirements of feature 104",
  );
  assert.equal(items.length, 116, "the kept behaviour items of feature 104");
  assert.equal(clusters.size, 20, "the clusters they fall in");

  // h1 and h2 read `origin:` of the spec; h3 reads `proves:` of the tasks.
  const origins = citationsOf("specs/104-spec-input/spec.md", "origin");
  const proves = citationsOf("specs/104-spec-input/tasks.md", "proves");
  assert.ok(origins.size > 0 && proves.size > 0, "the two fields the checker reads are non-empty");
  for (const id of requirements) {
    assert.ok(origins.has(id), `${id} is in an origin: of the spec`);
    assert.ok(proves.has(id), `${id} is in a proves: of the tasks`);
  }
  for (const cluster of [...clusters].sort()) {
    assert.ok(origins.has(cluster), `${cluster} is in an origin: of the spec`);
    assert.ok(proves.has(cluster), `${cluster} is in a proves: of the tasks`);
  }
});

test("T042/a-line-naming-feature-104-would-be-reported", () => {
  // The falsification. It runs on a scratch copy of the two trees the checker
  // reads (`docs/ecosystem/` and `specs/`, which it resolves as `../../specs`
  // from its own directory), so the repository is never written.
  const before = createHash("sha256").update(read("specs/104-spec-input/spec.md")).digest("hex");
  const scratch = mkdtempSync(join(tmpdir(), "t042-"));
  try {
    cpSync(join(ROOT, "docs/ecosystem"), join(scratch, "docs/ecosystem"), { recursive: true });
    const specs = join(scratch, "specs");
    cpSync(join(ROOT, "specs/104-spec-input"), join(specs, "104-spec-input"), { recursive: true });
    for (const name of readdirSync(join(ROOT, "specs"))) {
      if (name === "104-spec-input") continue;
      symlinkSync(join(ROOT, "specs", name), join(specs, name));
    }

    // The unmutated control: the copy gives the repository's own verdict.
    const control = runChecker(scratch);
    assert.equal(control.exit, 0);
    assert.deepEqual([...control.namingThisFeature], []);

    // One mutation: the two `origin:` fields that cite 028 FR-001 lose it, so
    // a kept row of feature 104 has no requirement with its origin (check h1).
    const path = join(specs, "104-spec-input/spec.md");
    const mutated = readFileSync(path, "utf8")
      .replace(/^(\s+[-*] origin:.*)028 FR-001; /gm, "$1")
      .replace(/^(\s+[-*] origin: )028 FR-001$/gm, "$1");
    assert.notEqual(mutated, readFileSync(path, "utf8"), "the mutation changed something");
    writeFileSync(path, mutated);

    const failing = runChecker(scratch);
    assert.equal(failing.exit, 1, "the mutated copy fails");
    assert.deepEqual(
      [...failing.namingThisFeature],
      ["[h1] 104-spec-input: 028 FR-001 has no requirement with this origin"],
    );
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
  assert.equal(
    createHash("sha256").update(read("specs/104-spec-input/spec.md")).digest("hex"),
    before,
    "the repository's own spec.md is unchanged",
  );
});

/* ------------------------------------------------------------------ *
 * T043 — the two items that are feature 100's, and the closures.
 * ------------------------------------------------------------------ */

/** Annex B of feature 100: the state annex, which holds §B.5 and §B.20. */
export const ANNEX_B = "specs/100-specstride/annexes/B-state.md";
/** Annex X of feature 100: the cross-layer annex, which holds §X.5 to §X.8. */
export const ANNEX_X = "specs/100-specstride/annexes/X-cross-layer.md";
/** The generated data file behind §B.20. */
export const SCHEMA_IDS_JSON = "specs/100-specstride/contracts/data/further-schema-ids.json";
/** The queue the clarification round closed. */
export const QUEUE = "docs/ecosystem/CLARIFY-QUEUE.md";

/** The questions T043 reports as closed. */
export const CLOSED_QUESTIONS = [
  "CQ-039",
  "CQ-040",
  "CQ-041",
  "CQ-042",
  "CQ-043",
  "CQ-044",
  "CQ-045",
  "CQ-214",
];

/** A row of a markdown table, by its first cell. */
export function tableRow(text: string, firstCell: string): string | undefined {
  return text
    .split("\n")
    .find((line) => line.startsWith("| ") && (line.split("|")[1] ?? "").trim() === firstCell);
}

test("T043/item-1-the-schema-id-of-the-task-list-record-is-given-by-feature-100", () => {
  const annexB = read(ANNEX_B);
  // §B.20, "Further schema ids": the id, the logical name and the owner.
  const row = tableRow(annexB, "`specstride.task-list/1`");
  assert.ok(row, "annex B §B.20 holds a row for `specstride.task-list/1`");
  const cells = row.split("|").map((cell) => cell.trim());
  assert.equal(cells[3], "`run:<runId>:task-list`", "its logical name");
  assert.equal(cells[4], "104", "its owner");
  assert.match(row, /tasks \(id, markers, text\) in order and the canonical record hash/);

  // §B.5, the row of the record itself, now names the schema.
  const b5 = tableRow(annexB, "`run:<runId>:task-list`");
  assert.ok(b5, "annex B §B.5 holds the row of the record");
  assert.match(b5, /`specstride\.task-list\/1`/);
  assert.match(b5, /fields: feature 104, annex B §B\.20/);

  // The generated data file of annex B §B.20 carries it too.
  const data = JSON.parse(read(SCHEMA_IDS_JSON)) as {
    schemaIds: { "Schema id": string; "Logical name": string; Owner: string }[];
  };
  const entry = data.schemaIds.find((row) => row["Schema id"] === "`specstride.task-list/1`");
  assert.ok(entry, "the data file of §B.20 holds the id");
  assert.equal(entry["Logical name"], "`run:<runId>:task-list`");
  assert.equal(entry["Owner"], "104");
});

test("T043/item-2-the-rule-owners-stand-in-the-row-of-the-hasher", () => {
  const row = tableRow(read(ANNEX_X), "Phase shape, obligation id, signature of unmet criteria");
  assert.ok(row, "annex X §X.5 holds the row");
  // The three rules, each with its owner and its requirement.
  assert.match(
    row,
    /The phase shape is built by the hasher \(16 hexadecimal characters; rules: feature 104, F104-FR-021\)/,
  );
  assert.match(row, /The obligation id \(rules: feature 107, F107-FR-004\)/);
  assert.match(row, /the signature of unmet criteria \(rules: feature 101, F101-FR-019\)/);
  // And the sentence that keeps the two others out of the hasher.
  assert.match(row, /the hasher holds no rule of theirs/);
});

test("T043/the-questions-of-feature-104-are-closed", () => {
  const queue = read(QUEUE);
  const mine = queue
    .split("\n")
    .filter((line) => /^\| CQ-\d{3} \| 104 \|/.test(line))
    .map((line) => ({ id: (line.split("|")[1] ?? "").trim(), line }));
  assert.deepEqual(
    mine.map((row) => row.id),
    CLOSED_QUESTIONS,
    "the questions the queue gives to feature 104",
  );
  for (const row of mine) {
    assert.match(row.line, /closed 2026-09-30/, `${row.id} is closed`);
  }
});

test("T043/the-rows-of-annex-X-exist", () => {
  const annexX = read(ANNEX_X);
  // The closed sets of feature 104 (§X.6, rows 49, 50 and 97 to 100): the rows
  // T043 reported as missing in its first form, and that exist.
  for (const [number, name] of [
    ["49", "Spec formats"],
    ["50", "Files of the staleness verdict"],
    ["97", "Kinds of source of a specification"],
    ["98", "States of a source in a staleness verdict"],
    ["99", "Errors of a spec-format adapter"],
    ["100", "Subcommands of the command `spec`"],
  ] as const) {
    const rows = annexX.split("\n").filter((line) => line.startsWith(`| ${number} | ${name} |`));
    assert.equal(rows.length, 1, `annex X §X.6 row ${number} (${name})`);
    assert.equal((rows[0] ?? "").split("|")[4]?.trim(), "104", `row ${number} is owned by 104`);
  }
  // The row of the `parity` profile that holds the three inputs (row 49).
  assert.ok(
    annexX.split("\n").some((line) => line.startsWith("| 49 | Inputs of the specification |")),
    "the profile row of the inputs of the specification",
  );
  // The alias row of the context budget (§X.8), reported as missing and present.
  const alias = tableRow(annexX, "`SPECSTRIDE_CONTEXT_BUDGET`");
  assert.ok(alias, "the alias row of §X.8");
  assert.match(alias, /`spec\.contextBudget`/);
});

test("T043/nothing-else-of-the-analyze-report-is-open", () => {
  // The report named three items for another feature or the orchestrator. The
  // two of feature 100 are items 1 and 2 above; the third was the register
  // count of the final summary, and it is applied as well — so the claim
  // "nothing else is open" is measured and not asserted.
  const report = read("specs/104-spec-input/analyze-report.md");
  assert.match(report, /What another feature or the orchestrator must do/);
  const summary = read("docs/ecosystem/FINAL-SUMMARY.md");
  const register = tableRow(summary, "Divergence register");
  assert.ok(register, "the register row of the final summary");
  assert.match(register, /120 rows, DV-001 to DV-120/);
  assert.match(register, /every row cited by at least one spec/);
  const facts = read("docs/ecosystem/reviews/FINAL-SUMMARY-FACTS.md");
  assert.match(facts, /- Rows: 120 \(DV-001 to DV-120\)/);
  assert.match(facts, /- Uncited rows \(0\): none/);
  // The two register rows CQ-045 asked for exist and are cited by this feature.
  const consolidation = read("docs/ecosystem/consolidation.md");
  for (const dv of ["DV-118", "DV-119"]) {
    assert.ok(
      consolidation.split("\n").some((line) => line.startsWith(`| ${dv} |`)),
      `${dv} is a row of the divergence register`,
    );
    assert.ok(read("specs/104-spec-input/spec.md").includes(dv), `${dv} is cited by the spec`);
  }
  assert.ok(existsSync(join(ROOT, "specs/104-spec-input/repair-report.md")));
});
