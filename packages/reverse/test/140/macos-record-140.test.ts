/**
 * T035 of feature 140 — the record of the macOS half, held to account.
 *
 * T035 asks for the result PER TEST in `tests/parity/140/README.md`, and the
 * owner's out-of-band ruling of 2026-09-30 asks for the macOS part to be
 * recorded as `unverified` with its reason in this feature's verification
 * record. This test is what makes both true rather than written down:
 *
 *  - every test file of this feature has a row in the per-test record;
 *  - every row's macOS cell is `unverified`, and no row is a pass;
 *  - the totals of the record add up, per tier and over all;
 *  - the three macOS statements of `spec.md`, `plan.md` and `research.md` still
 *    say `unverified`;
 *  - the verification record exists, names T035 and points at the per-test
 *    record.
 *
 * So a new test file that is not recorded, a macOS row that quietly becomes a
 * pass, or a `status:` line that is changed without a macOS run, fails the run.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { describe, it } from "node:test";

/** The repository root: five levels up from `packages/reverse/test/140`. */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");

const RECORD = "tests/parity/140/README.md";
const VERIFICATION = "specs/140-reverse-inventory-and-lint/verification-record.md";
const SPEC = "specs/140-reverse-inventory-and-lint/spec.md";
const PLAN = "specs/140-reverse-inventory-and-lint/plan.md";
const RESEARCH = "specs/140-reverse-inventory-and-lint/research.md";
const WORKFLOW = ".github/workflows/build.yml";

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

/**
 * The test files of feature 140, read from the directories rather than listed.
 * `packages/reverse/test/` is shared with feature 108, so this feature's files
 * there are named: they are the flat paths the tasks T004, T012, T021, T034 and
 * T036 name, and feature 108's record names them as this feature's too.
 */
export const FLAT_FILES_OF_140: readonly string[] = Object.freeze([
  "packages/reverse/test/determinism.test.ts",
  "packages/reverse/test/inventory-schema.test.ts",
  "packages/reverse/test/lint-codes.test.ts",
  "packages/reverse/test/output-bytes.test.ts",
  "packages/reverse/test/serialize.test.ts",
]);

/** The three directories that hold only this feature's tests. */
export const OWN_DIRECTORIES: readonly string[] = Object.freeze([
  "tests/parity/140",
  "tests/characterization/140",
  "packages/reverse/test/140",
]);

/** Every test file of this feature. */
export function testFiles(): readonly string[] {
  const found: string[] = [];
  for (const directory of OWN_DIRECTORIES) {
    for (const name of readdirSync(join(ROOT, directory)).sort()) {
      if (name.endsWith(".test.ts")) found.push(`${directory}/${name}`);
    }
  }
  return Object.freeze([...found, ...FLAT_FILES_OF_140].sort());
}

/** The rows of the per-test record, as cells. */
function recordRows(): readonly (readonly string[])[] {
  return read(RECORD)
    .split("\n")
    .filter((line) => line.startsWith("| `tests/") || line.startsWith("| `packages/"))
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim()),
    );
}

describe("T035 — the per-test record is complete and claims no macOS pass", () => {
  it("every test file of this feature has a row in the record", () => {
    const record = read(RECORD);
    const files = testFiles();
    assert.ok(files.length >= 18, `${files.length} test files of feature 140`);
    for (const file of files) {
      assert.ok(
        record.includes(`\`${file}\``),
        `${RECORD} must hold a row for ${file}; T035 asks for the result PER TEST`,
      );
    }
  });

  it("every row is `unverified` on macOS, and none is a pass", () => {
    const rows = recordRows();
    assert.equal(rows.length, testFiles().length, "one row per test file, and no more");
    for (const cells of rows) {
      assert.equal(cells.length, 7, cells[0]);
      assert.equal(cells[6], "`unverified`", `${cells[0]}: the macOS cell`);
      assert.equal(cells[3], "0", `${cells[0]}: no failure on Linux`);
      assert.equal(cells[5], "0", `${cells[0]}: exit 0 on Linux`);
      assert.equal(
        Number(cells[1]),
        Number(cells[2]) + Number(cells[3]) + Number(cells[4]),
        `${cells[0]}: tests = pass + fail + skipped`,
      );
    }
    const record = read(RECORD);
    assert.match(record, /\*\*Status: `unverified`\.\*\*/);
    assert.ok(!/macOS \| pass/.test(record), "no row claims a macOS pass");
  });

  it("the totals of the record are the sum of its rows", () => {
    const rows = recordRows();
    const sum = (index: number): number =>
      rows.reduce((total, cells) => total + Number(cells[index]), 0);
    const record = read(RECORD);
    const totals =
      /\*\*Totals on Linux\*\*: (\d+) files, (\d+) tests, (\d+) pass, \*\*0 fail\*\*, (\d+) skipped/.exec(
        record,
      );
    assert.ok(totals !== null, `${RECORD} must state its totals`);
    assert.equal(Number(totals[1]), rows.length, "files");
    assert.equal(Number(totals[2]), sum(1), "tests");
    assert.equal(Number(totals[3]), sum(2), "pass");
    assert.equal(Number(totals[4]), sum(4), "skipped");
    assert.equal(sum(3), 0, "no failure on Linux");
  });

  it("it names the system the run is actually on, and the macOS runner's owner", () => {
    const record = read(RECORD);
    assert.equal(process.platform, "linux", "this run is on Linux; a macOS run must be recorded");
    assert.ok(record.includes("`linux` (`process.platform`)"), `${RECORD} names the platform`);
    assert.match(record, /\|\s*Node\.js\s*\|\s*v?\d+\.\d+\.\d+/, "the Node.js version of the run");
    assert.match(record, /\|\s*Kernel\s*\|\s*Linux\b/, "a Linux kernel");
    assert.ok(record.includes(WORKFLOW), "it names the workflow");
    assert.ok(record.includes("macos-latest"), "and the runner in its matrix");
    assert.ok(record.includes("principle XVII"), "and the rule that a skip is never a pass");
    assert.ok(record.includes("never run here and never faked"), "and the owner's ruling");
    // The runner really is in the matrix of the workflow — a citation, checked.
    assert.match(read(WORKFLOW), /os: \[ubuntu-latest, macos-latest\]/);
  });

  it("it names the case-insensitive file system T035 asks for", () => {
    assert.match(read(RECORD), /case-insensitive/);
  });

  it("it says why the 24 skips are not macOS skips", () => {
    const record = read(RECORD);
    assert.match(record, /feature 141/);
    assert.match(record, /not a macOS question/);
  });
});

describe("T035 — the macOS statements of the specification still say `unverified`", () => {
  it("the `status:` line of F140-FR-017", () => {
    const spec = read(SPEC);
    const start = spec.indexOf("- **F140-FR-017**:");
    assert.notEqual(start, -1);
    const block = spec.slice(start, spec.indexOf("\n- **F140-FR-018**:", start));
    const status = block.split("\n").find((line) => line.trim().startsWith("- status:"));
    assert.ok(status !== undefined, "F140-FR-017 carries a `status:` line");
    assert.match(status, /status: unverified/);
    assert.match(status, /macOS runner/);
    assert.match(status, /case-insensitive file system/);
    assert.match(status, /verified-on: —/, "and nothing claims it was verified anywhere");
  });

  it("the target platform of `plan.md`", () => {
    const plan = read(PLAN);
    const line = plan.split("\n").find((one) => one.startsWith("**Target Platform**:"));
    assert.ok(line !== undefined);
    assert.match(line, /every macOS statement `unverified`/);
    assert.match(line, /T035/);
  });

  it("the two rows of `research.md`", () => {
    const research = read(RESEARCH);
    const section = research.slice(research.indexOf("## Facts that are `unverified`"));
    assert.match(section, /macOS/);
    assert.match(section, /case-insensitive file system/);
  });
});

describe("T035 — this feature's verification record exists and carries the reason", () => {
  const record = read(VERIFICATION);

  it("it names T035, its kind and its `unverified` state", () => {
    assert.ok(record.includes("T035"), "the verification record names T035");
    assert.match(record, /\*\*`unverified`\*\*/);
    assert.match(record, /macOS runner/);
  });

  it("it gives the reason, and what would settle it", () => {
    assert.match(record, /this host is Linux/i);
    assert.match(record, /no git remote/);
    assert.match(record, /What would settle it/);
  });

  it("it points at the per-test record T035 asks for", () => {
    assert.ok(record.includes(RECORD), `${VERIFICATION} points at ${RECORD}`);
  });

  it("it says the macOS part is never run and never faked", () => {
    assert.match(record, /never run and never faked/);
  });

  it("its totals agree with the per-test record", () => {
    const rows = recordRows();
    const sum = (index: number): number =>
      rows.reduce((total, cells) => total + Number(cells[index]), 0);
    const totals =
      /\| \*\*Total\*\* \| \*\*(\d+)\*\* \| \*\*(\d+)\*\* \| \*\*(\d+)\*\* \| \*\*0\*\* \| \*\*(\d+)\*\* \|/.exec(
        record,
      );
    assert.ok(totals !== null, `${VERIFICATION} must state its totals`);
    assert.equal(Number(totals[1]), rows.length, "files");
    assert.equal(Number(totals[2]), sum(1), "tests");
    assert.equal(Number(totals[3]), sum(2), "pass");
    assert.equal(Number(totals[4]), sum(4), "skipped");
  });

  it("it names the four reports of phase 6", () => {
    for (const report of [
      "reports/T031-rows-against-feature-100.md",
      "reports/T032-fx30-parity-profile.md",
      "reports/T033-quickstart-results.md",
      "reports/T036-output-bytes.md",
    ]) {
      assert.ok(record.includes(report), `${VERIFICATION} names ${report}`);
    }
  });
});
