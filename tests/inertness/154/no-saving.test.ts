/**
 * T167 — NO PRINTED LINE PROMISES A SAVING (F154-FR-008).
 *
 * A GUARD test: no printed line of the feature's plan (`plan.md`), of its
 * report (`verified.md`), or of any trial record under `trials/` may hold a
 * FORECAST. The forbidden words are "speed-up", "faster" and "saving" (with
 * the hyphen/space variants "speedup" and "speed up" counted as the same
 * forbidden set), compared as substrings of the lower-cased text.
 *
 * THE ONLY ALLOWED HOME of a forbidden word is the ceiling statement
 * (F154-FR-008, F142-FR-073): the lines `expectedSavingStatement()` of
 * `packages/layer-parallel/src/plan.ts` emits, and the labelled
 * expected-saving block they close the printed plan with. The allow rules,
 * stated precisely:
 *
 * 1. CEILING-BLOCK CONTEXT — a hit is allowed when it sits inside the
 *    labelled ceiling block: the first line equal (after trim) to a line of
 *    `expectedSavingStatement()` OPENS the block, and every following line
 *    keeps the context until the first blank line closes it. This matches the
 *    printed plan, whose last lines are exactly the statement.
 * 2. QUOTED STATEMENT — a hit is allowed on a line that quotes the statement
 *    itself, i.e. a line that names the ceiling machinery
 *    (`expectedSavingStatement`) or equals a statement line. Today's
 *    `plan.md` quotes the symbol at its "one renderer, two callers" row.
 * 3. NEGATION — a hit is allowed when the word is NEGATED on its own line:
 *    a negation ("no saving", "never a saving", "promises no", "not an
 *    expectation") states the absence of a forecast and is not a forecast.
 *    A negator (`no`, `not`, `never`) must stand within the same sentence
 *    segment (no `.`, `;` or `:` between them) of the forbidden word. Today's
 *    `plan.md` relies on this rule for "no saving promised", "No goal is a
 *    saving" and "no slice promises a saving".
 *
 * For a TRIAL RECORD the rule is stricter: a string value is allowed only if
 * it IS a ceiling-statement line (equality after trim against the imported
 * `expectedSavingStatement()` output) — negation and quotation do not carry
 * into recorded data. Anything else fails.
 *
 * Missing surfaces never fail this guard: without `verified.md` (another
 * task writes it) the trial records' directory is the report surface and the
 * report subsection is skipped with a note; the test covers `verified.md`
 * automatically once the file exists. Without (or with an empty) `trials/`
 * the trial subsection is skipped with a note too.
 *
 * A failure names the file, the line number (or the JSON path) and the
 * offending line, so the fix lands in the SOURCE, never in this test. Run:
 *     node --experimental-strip-types --test tests/inertness/154/no-saving.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expectedSavingStatement } from "../../../packages/layer-parallel/src/plan.ts";

/** The feature's spec directory, the surface this guard scans. */
const SPEC_DIR = join(import.meta.dirname, "../../../specs/154-concurrency-and-parallelism");

/** The plan the guard scans (T167). */
const PLAN_FILE = join(SPEC_DIR, "plan.md");
/** The report; another task writes it — its absence is a skip, not a failure. */
const REPORT_FILE = join(SPEC_DIR, "verified.md");
/** The trial records: the report surface while `verified.md` is absent. */
const TRIALS_DIR = join(SPEC_DIR, "trials");

/**
 * The ceiling statement, word for word (F142-FR-073): the only text a
 * forbidden word may live in. Imported, not copied, so the guard can never
 * drift from what the printed plan really ends with.
 */
const CEILING_LINES: readonly string[] = expectedSavingStatement().map((l) => l.trim());

/**
 * The forbidden set as substrings of the lower-cased line: "speed-up",
 * "faster", "saving" — with "speedup" and "speed up" as the same set.
 */
const FORBIDDEN_WORDS: readonly string[] = Object.freeze([
  "speed-up",
  "speedup",
  "speed up",
  "faster",
  "saving",
]);

/** A negator and a forbidden word, inside one sentence segment (rule 3). */
const NEGATED = /\b(no|not|never)\b[^.;:]*\b(saving|speed[- ]?up|faster)\b/i;
/** The same negation, forbidden word first ("… a saving is not promised"). */
const NEGATED_REVERSED = /\b(saving|speed[- ]?up|faster)\b[^.;:]*\b(no|not|never)\b/i;

/** The mutable ceiling context a scanned line is judged against. */
type CeilingContext = {
  /** True from the first statement line until the block's first blank line. */
  inCeilingBlock: boolean;
};

/**
 * Is a hit on this line inside the ceiling context? The stateful half of the
 * guard: rules 1–3 of the header. `state` carries the block across lines.
 */
export function isCeilingContext(line: string, state: CeilingContext): boolean {
  const trimmed = line.trim();
  // Rule 1/2 — the line IS a statement line: allowed, and it opens the block.
  if (CEILING_LINES.includes(trimmed)) {
    state.inCeilingBlock = true;
    return true;
  }
  // Rule 1 — a line inside the open ceiling block (closed by a blank line).
  if (state.inCeilingBlock) {
    if (trimmed === "") state.inCeilingBlock = false;
    else return true;
  }
  // Rule 2 — the line quotes the ceiling machinery by its symbol name.
  if (trimmed.includes("expectedSavingStatement")) return true;
  // Rule 3 — the word is negated on its own line: no forecast is stated.
  if (NEGATED.test(line) || NEGATED_REVERSED.test(line)) return true;
  return false;
}

/** The first forbidden word of a lower-cased line, or `undefined`. */
function forbiddenWordIn(lower: string): string | undefined {
  return FORBIDDEN_WORDS.find((w) => lower.includes(w));
}

/** Walk every string value of a JSON record, nested objects and arrays too. */
export function* stringValues(value: unknown, path: string): Generator<[string, string]> {
  if (typeof value === "string") yield [path, value];
  else if (Array.isArray(value)) {
    for (const [i, item] of value.entries()) yield* stringValues(item, `${path}[${i}]`);
  } else if (value !== null && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) yield* stringValues(v, `${path}.${k}`);
  }
}

/** The lines of the plan (or the report): a hit outside the ceiling fails. */
export function scanLines(file: string, label: string): readonly string[] {
  const problems: string[] = [];
  const state: CeilingContext = { inCeilingBlock: false };
  for (const [index, line] of readFileSync(file, "utf8").split("\n").entries()) {
    const word = forbiddenWordIn(line.toLowerCase());
    if (word === undefined) continue;
    if (!isCeilingContext(line, state)) {
      problems.push(
        `${label} line ${index + 1} holds the forbidden word "${word}" outside the ` +
          `ceiling statement (F154-FR-008): ${JSON.stringify(line)}`,
      );
    }
  }
  return problems;
}

/** The string values of one trial record: only ceiling lines may hold a hit. */
export function scanTrialRecord(file: string, text: string): readonly string[] {
  const problems: string[] = [];
  const record = JSON.parse(text) as unknown;
  for (const [path, value] of stringValues(record, "(root)")) {
    const word = forbiddenWordIn(value.toLowerCase());
    if (word === undefined) continue;
    if (!CEILING_LINES.includes(value.trim())) {
      problems.push(
        `${file} at ${path} holds the forbidden word "${word}" and is not a line of ` +
          `the ceiling statement (F154-FR-008): ${JSON.stringify(value)}`,
      );
    }
  }
  return problems;
}

test("T167: no line of the plan, the report or a trial record holds a forecast outside the ceiling statement", () => {
  // — THE PLAN: scanned line by line; today's hits are negations and the
  //   quoted `expectedSavingStatement` symbol, all allowed by rules 2–3.
  assert.ok(existsSync(PLAN_FILE), "the feature's plan.md exists");
  const planProblems = scanLines(PLAN_FILE, "plan.md");
  assert.deepEqual(
    planProblems,
    [],
    `plan.md promises a saving outside the ceiling statement (F154-FR-008):\n${planProblems.join("\n")}`,
  );

  // — THE REPORT: `verified.md` is written by another task. While it is
  //   absent the trial records are the report surface and this subsection is
  //   skipped with a note; once the file exists it is scanned automatically.
  if (!existsSync(REPORT_FILE)) {
    console.log(
      "note: verified.md is absent — the trial records under trials/ are the " +
        "report surface for this guard; the report subsection is skipped",
    );
  } else {
    const reportProblems = scanLines(REPORT_FILE, "verified.md");
    assert.deepEqual(
      reportProblems,
      [],
      `verified.md promises a saving outside the ceiling statement (F154-FR-008):\n${reportProblems.join("\n")}`,
    );
  }

  // — THE TRIAL RECORDS: the directory is globbed at run time; every JSON
  //   record is walked string value by string value. An empty or missing
  //   directory is a skip with a note, never a failure.
  const records =
    existsSync(TRIALS_DIR) && readdirSync(TRIALS_DIR).filter((n) => n.endsWith(".json"));
  if (!records || records.length === 0) {
    console.log("note: no trial record under trials/ yet — the trial subsection is skipped");
  } else {
    const trialProblems: string[] = [];
    for (const name of records) {
      const file = join(TRIALS_DIR, name);
      trialProblems.push(...scanTrialRecord(file, readFileSync(file, "utf8")));
    }
    assert.deepEqual(
      trialProblems,
      [],
      `a trial record promises a saving outside the ceiling statement (F154-FR-008):\n${trialProblems.join("\n")}`,
    );
  }
});
