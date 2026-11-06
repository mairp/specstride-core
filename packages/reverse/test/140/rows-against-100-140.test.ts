/**
 * T031 of feature 140 — the CHECK that the two tables of `spec.md` that
 * restate data of feature 100 really equal that data:
 *
 *  - "Rows of the `parity` profile"  against  row 69 of annex X §X.7;
 *  - "Closed sets"                   against  rows 146 to 149 and 151 to 155
 *    of annex X §X.6 (row 150 belongs to feature 108, which is why the task
 *    names two ranges).
 *
 * The data of feature 100 is read from its own files, never from a list
 * restated here:
 *   `specs/100-specstride/contracts/data/closed-sets.json`
 *   `specs/100-specstride/contracts/data/parity-profile.json`
 * and the annex markdown is read too, because the generator's note says "the
 * annex stands where the two differ" — so a check of the data alone could
 * agree with a stale file.
 *
 * T031 is a REPORT, not an edit (F100-FR-212: a feature must not change a row
 * of another feature). This test therefore does two things: it measures the
 * differences, and it holds the report
 * `specs/140-reverse-inventory-and-lint/reports/T031-rows-against-feature-100.md`
 * to account — every difference measured here must be in the report, and the
 * report must claim no difference that is not measured here. Neither side can
 * go stale without this test failing.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

/** The repository root: five levels up from `packages/reverse/test/140`. */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");

const SPEC = "specs/140-reverse-inventory-and-lint/spec.md";
const REPORT = "specs/140-reverse-inventory-and-lint/reports/T031-rows-against-feature-100.md";
const CLOSED_SETS = "specs/100-specstride/contracts/data/closed-sets.json";
const PARITY_PROFILE = "specs/100-specstride/contracts/data/parity-profile.json";
const ANNEX_X = "specs/100-specstride/annexes/X-cross-layer.md";
const FINDING_CODES = "packages/reverse/data/finding-codes.json";

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

/** The rows of §X.6 as feature 100 ships them. */
type ClosedSetRow = {
  readonly number: number;
  readonly name: string;
  readonly members: string;
  readonly literals: readonly string[];
  readonly owner: string;
  readonly closedBy: string;
  readonly unknownValue: string;
};

/** The rows of §X.7 as feature 100 ships them. */
type ParityRow = {
  readonly number: number;
  readonly switch: string;
  readonly keys: readonly string[];
  readonly default: string;
  readonly parity: string;
  readonly owner: string;
  readonly registerRows: readonly string[];
};

function closedSets(): readonly ClosedSetRow[] {
  return (JSON.parse(read(CLOSED_SETS)) as { closedSets: ClosedSetRow[] }).closedSets;
}

function closedSetRow(number: number): ClosedSetRow {
  const found = closedSets().find((row) => row.number === number);
  assert.ok(found !== undefined, `${CLOSED_SETS} holds no row ${number}`);
  return found;
}

function parityRow(number: number): ParityRow {
  const found = (JSON.parse(read(PARITY_PROFILE)) as { switches: ParityRow[] }).switches.find(
    (row) => row.number === number,
  );
  assert.ok(found !== undefined, `${PARITY_PROFILE} holds no row ${number}`);
  return found;
}

/** The cells of one markdown table row, trimmed. */
function cellsOf(line: string): readonly string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

/** The body of one `## ` section of a markdown file. */
function sectionOf(text: string, title: string): string {
  const start = text.indexOf(`\n## ${title}\n`);
  assert.notEqual(start, -1, `the document holds no section "## ${title}"`);
  const rest = text.slice(start + 1);
  const end = rest.indexOf("\n## ", 1);
  return end === -1 ? rest : rest.slice(0, end);
}

/** The data rows of the one table of a section (the header and rule dropped). */
function tableRowsOf(text: string, title: string): readonly (readonly string[])[] {
  const lines = sectionOf(text, title)
    .split("\n")
    .filter((line) => line.startsWith("|"));
  assert.ok(lines.length > 2, `the section "${title}" holds no table`);
  return lines.slice(2).map(cellsOf);
}

/** The literals a members cell names, in order, as `` `backticked` `` words. */
function literalsOf(cell: string): readonly string[] {
  return [...cell.matchAll(/`([^`]+)`/g)].map((match) => match[1] as string);
}

/* ------------------------------------------------------------------ *
 * The nine rows of §X.6 the two ranges of T031 name, in the order of
 * the table of `spec.md`.
 * ------------------------------------------------------------------ */

/** The numbers of §X.6 that feature 140 owns, as T031 names them. */
export const OWNED_X6_ROWS: readonly number[] = Object.freeze([
  146, 147, 148, 149, 151, 152, 153, 154, 155,
]);

/** The row of §X.7 the three limits of F140-FR-016 share. */
export const OWNED_X7_ROW = 69 as const;

/** The ids of the differences this check measures; the report carries each. */
export const DIFFERENCE_IDS: readonly string[] = Object.freeze([
  "D-140-01",
  "D-140-02",
  "D-140-03",
  "D-140-04",
  "D-140-05",
  "D-140-06",
  "D-140-07",
]);

describe("T031 — the data of feature 100 is where this check reads it", () => {
  it("§X.6 holds the nine rows of feature 140 and row 150 of feature 108 between them", () => {
    for (const number of OWNED_X6_ROWS) {
      assert.equal(closedSetRow(number).owner, "140", `row ${number} of §X.6`);
    }
    assert.equal(closedSetRow(150).owner, "108", "row 150 is feature 108's, hence the two ranges");
  });

  it("§X.7 row 69 is feature 140's and names the three limits of F140-FR-016", () => {
    const row = parityRow(OWNED_X7_ROW);
    assert.equal(row.owner, "140");
    assert.deepEqual(
      [...row.keys],
      ["reverse.maxFileBytes", "reverse.maxTotalBytes", "reverse.contextBudget"],
    );
    assert.deepEqual([...row.registerRows], ["DV-027"]);
  });

  it("the annex markdown and the shipped data agree, row for row", () => {
    const annex = read(ANNEX_X);
    for (const number of [...OWNED_X6_ROWS, 150]) {
      const row = closedSetRow(number);
      const line = annex.split("\n").find((one) => one.startsWith(`| ${number} | `));
      assert.ok(line !== undefined, `${ANNEX_X} holds the row ${number} of §X.6`);
      const cells = cellsOf(line);
      assert.deepEqual(cells.slice(1), [
        row.name,
        row.members,
        row.owner,
        row.closedBy,
        row.unknownValue,
      ]);
    }
    const seventyNine = annex
      .split("\n")
      .find((one) => one.startsWith(`| ${OWNED_X7_ROW} | Limits of the source inventory |`));
    assert.ok(seventyNine !== undefined, `${ANNEX_X} holds row ${OWNED_X7_ROW} of §X.7`);
    const row = parityRow(OWNED_X7_ROW);
    assert.deepEqual(cellsOf(seventyNine).slice(1), [
      row.switch,
      row.keys.map((key) => `\`${key}\``).join(", "),
      row.default,
      row.parity,
      row.owner,
      row.registerRows.join("; "),
    ]);
  });
});

describe('T031 — "Closed sets" of `spec.md` against rows 146 to 149 and 151 to 155', () => {
  const rows = tableRowsOf(read(SPEC), "Closed sets");

  it("the table holds the nine owned rows in the order of §X.6, and one row more", () => {
    assert.equal(rows.length, OWNED_X6_ROWS.length + 1, "nine rows of §X.6 plus the schema row");
    assert.equal(
      rows[OWNED_X6_ROWS.length]?.[0],
      "Schema of the inventory",
      "the last line is the schema id of annex B §B.20 and has no row of §X.6",
    );
    assert.match(
      sectionOf(read(SPEC), "Closed sets"),
      /rows 146 to 149 and 151 to 155 of annex X §X\.6/,
      "the introduction names the rows by number (waiver W-X-07)",
    );
  });

  it("the MEMBERS of each row are the same set, in the same order", () => {
    OWNED_X6_ROWS.forEach((number, index) => {
      const annex = closedSetRow(number);
      const spec = rows[index] as readonly string[];
      const specLiterals = literalsOf(spec[1] as string);
      const annexLiterals = [...annex.literals];
      // Two rows of `spec.md` say MORE in the same cell; the spec's extra
      // words are the measured differences D-140-01 and D-140-02 below. Every
      // member of §X.6 is present, in order, in every row.
      assert.deepEqual(
        specLiterals.slice(0, annexLiterals.length),
        annexLiterals,
        `row ${number}: the members of §X.6, in order`,
      );
    });
  });

  it("the OWNER and the CLOSED BY of each row are equal, cell for cell", () => {
    OWNED_X6_ROWS.forEach((number, index) => {
      const annex = closedSetRow(number);
      const spec = rows[index] as readonly string[];
      assert.equal(spec[2], annex.owner, `row ${number}: owner`);
      assert.equal(spec[3], annex.closedBy, `row ${number}: closed by`);
    });
  });

  it("row 146: the 38 finding codes equal the closed family the package ships", () => {
    const shipped = (JSON.parse(read(FINDING_CODES)) as { codes: { code: string }[] }).codes.map(
      (one) => one.code,
    );
    assert.equal(shipped.length, 38);
    assert.deepEqual(shipped, [...closedSetRow(146).literals]);
    assert.deepEqual(literalsOf(rows[0]?.[1] as string), shipped);
  });

  it("D-140-01: the spec's row 147 adds which codes are warnings; §X.6 does not", () => {
    const spec = rows[1]?.[1] as string;
    assert.match(spec, /^`error`, `warning`\. Warnings: /, "the spec's cell says more");
    assert.equal(closedSetRow(147).members, "`error`, `warning`", "§X.6's cell says only the two");
    // The addition is TRUE of the shipped family: exactly those four codes are
    // warnings, which is what makes this a refinement and not a disagreement.
    const shipped = (
      JSON.parse(read(FINDING_CODES)) as { codes: { code: string; severity: string }[] }
    ).codes;
    const warnings = shipped.filter((one) => one.severity === "warning").map((one) => one.code);
    assert.deepEqual([...warnings].sort(), [
      "data-model.entities",
      "evidence.skipped",
      "template.expected",
      "unknowns.placement",
    ]);
    for (const code of warnings) assert.ok(spec.includes(`\`${code}\``), `the cell names ${code}`);
    assert.ok(
      new Set(shipped.map((one) => one.severity)).size === 2,
      "and the severities really are the closed pair of row 147",
    );
  });

  it("D-140-02: the spec's row 149 adds that `desired` is refused; §X.6 does not", () => {
    const spec = rows[3]?.[1] as string;
    assert.ok(spec.includes("(`desired` is refused)"), "the spec's cell says more");
    assert.ok(
      !closedSetRow(149).members.includes("desired"),
      "§X.6's cell names the six members only",
    );
    assert.ok(
      !closedSetRow(149).literals.includes("desired"),
      "`desired` is NOT a member of the set on either side; it is a refused value",
    );
  });

  it("D-140-03 to D-140-05: three UNKNOWN VALUE cells are worded differently", () => {
    const differences: readonly (readonly [string, number, number])[] = [
      ["D-140-03", 146, 0],
      ["D-140-04", 148, 2],
      ["D-140-05", 151, 4],
    ];
    for (const [id, number, index] of differences) {
      const spec = (rows[index] as readonly string[])[4] as string;
      assert.notEqual(
        spec,
        closedSetRow(number).unknownValue,
        `${id}: row ${number}'s unknown-value cell differs between the two`,
      );
    }
    // And the SIX rows not named above agree cell for cell.
    OWNED_X6_ROWS.forEach((number, index) => {
      if (differences.some(([, n]) => n === number)) return;
      assert.equal(
        (rows[index] as readonly string[])[4],
        closedSetRow(number).unknownValue,
        `row ${number}: unknown value`,
      );
    });
  });

  it("D-140-05 names the one difference a reader could read two ways", () => {
    assert.equal((rows[4] as readonly string[])[4], "Baseline refused");
    assert.equal(closedSetRow(151).unknownValue, "The inventory is refused");
  });

  it("D-140-06: six of the nine labels of `spec.md` are short forms of §X.6's names", () => {
    const short = OWNED_X6_ROWS.filter(
      (number, index) => (rows[index] as readonly string[])[0] !== closedSetRow(number).name,
    );
    assert.deepEqual(short, [146, 148, 151, 152, 153, 155]);
    // Short, but still the same set: each short label is a prefix or a part of
    // the annex's name, so a reader can find the row.
    for (const number of short) {
      const index = OWNED_X6_ROWS.indexOf(number);
      const label = (rows[index] as readonly string[])[0] as string;
      const name = closedSetRow(number).name.toLowerCase();
      const words = label.toLowerCase().split(" ");
      assert.ok(
        words.every((word) => name.includes(word)),
        `row ${number}: "${label}" against "${closedSetRow(number).name}"`,
      );
    }
  });
});

describe('T031 — "Rows of the `parity` profile" of `spec.md` against row 69 of §X.7', () => {
  const rows = tableRowsOf(read(SPEC), "Rows of the `parity` profile");
  const annex = parityRow(OWNED_X7_ROW);

  it("the table holds one row per key of row 69, in the order of row 69", () => {
    assert.equal(rows.length, annex.keys.length);
    rows.forEach((row, index) => {
      assert.equal(literalsOf(row[1] as string)[0], annex.keys[index], `row ${index + 1}: the key`);
      assert.ok(
        (row[5] as string).startsWith(String(OWNED_X7_ROW)),
        `row ${index + 1}: cites row 69`,
      );
      assert.equal(row[4], annex.registerRows.join("; "), `row ${index + 1}: the register row`);
    });
  });

  it("the DEFAULTS of the three rows are the three values row 69 lists", () => {
    const annexDefaults = annex.default.split(";").map((part) => part.trim());
    assert.deepEqual(annexDefaults, ["1048576", "20971520", "24000"]);
    assert.deepEqual(
      rows.map((row) => row[2]),
      annexDefaults,
    );
  });

  it('D-140-07: row 69 writes "The same" once; `spec.md` repeats each value', () => {
    assert.equal(annex.parity, "The same");
    // Equal in effect: each value under `parity` is its default, which is what
    // "The same" says, and what F100-FR-212 asks a feature to state per switch.
    rows.forEach((row, index) => {
      assert.equal(row[3], row[2], `row ${index + 1}: under \`parity\` the default`);
    });
  });

  it("the alias note of the third row is true of the alias table of §X.8", () => {
    const annexText = read(ANNEX_X);
    assert.ok(
      annexText.includes(
        "| `SPECSTRIDE_CONTEXT_BUDGET` | `spec.contextBudget` and `reverse.contextBudget`: " +
          "one variable feeds both keys |",
      ),
      "§X.8's alias table holds the row the spec cites",
    );
    assert.ok(
      annexText.includes("| `SPECSTRIDE_REVERSE_*` | `reverse.*` |"),
      "and the `reverse.*`",
    );
    assert.ok((rows[2] as readonly string[])[5]?.includes("SPECSTRIDE_CONTEXT_BUDGET"));
  });

  it('the claim about row 19 of §X.7 is true: "never printed"', () => {
    assert.equal(parityRow(19).parity, "never printed");
    assert.match(
      sectionOf(read(SPEC), "Rows of the `parity` profile"),
      /no line without an as-is equivalent is printed \(row 19 of annex X §X\.7\)/,
    );
  });
});

describe("T031 — the report is a report, and it is neither stale nor inflated", () => {
  const report = read(REPORT);

  it("it says it asks for no edit of feature 100's data", () => {
    assert.match(report, /a report, not an edit/);
    assert.match(report, /F100-FR-212/, "and cites the rule that forbids the edit");
    assert.match(report, /No row of feature 100 was changed/);
  });

  it("every difference this check measures has a row in the report", () => {
    for (const id of DIFFERENCE_IDS) {
      const line = report.split("\n").find((one) => one.startsWith(`| ${id} |`));
      assert.ok(line !== undefined, `${REPORT} holds a row for ${id}`);
    }
  });

  it("the report claims no difference this check does not measure", () => {
    const claimed = [...report.matchAll(/^\| (D-140-\d\d) \|/gm)].map(
      (match) => match[1] as string,
    );
    assert.deepEqual(claimed, [...DIFFERENCE_IDS]);
  });

  it("it records the two ranges of §X.6 and the row of §X.7 by number", () => {
    assert.match(report, /rows 146 to 149 and 151 to 155 of annex X §X\.6/);
    assert.match(report, /row 69 of annex X §X\.7/);
    assert.match(report, /Row 150 of §X\.6 .* is feature 108's/);
  });

  it("it records that no difference is a disagreement of substance", () => {
    assert.match(report, /no difference of substance/i);
  });
});
