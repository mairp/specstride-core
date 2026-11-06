/**
 * T054 — the macOS runner and the skip-with-its-reason rule of this feature.
 *
 * The RUN on a macOS runner is OUT OF BAND: the owner ruled on 2026-09-30 that
 * a paid, live or person-run step is never run and never faked by a pass of
 * this campaign. This host is Linux and no pass can start a macOS runner, so
 * the runner part is recorded as `unverified` with its reason in
 * `specs/104-spec-input/research.md`, section T054. The task is complete when
 * that record exists, and this file makes the record machine-checked rather
 * than prose, so that a run cannot be claimed without being made:
 *
 *   1. the macOS job of `.github/workflows/build.yml` exists and runs EVERY
 *      test of this feature, so one dispatch covers the whole task;
 *   2. the TWO-WAY RULE between the run record
 *      `tests/release/100/macos-verified.json` and section T054 of
 *      `specs/104-spec-input/research.md`: while the record is absent the
 *      section says `unverified` and its entry table is empty; once the record
 *      is present it is a well-formed run record and the section carries the
 *      same run, with its date and its version. Neither half can be written
 *      without the other, so a fabricated half fails the build;
 *   3. every test of this feature whose PREREQUISITE is missing reports a SKIP
 *      WITH ITS REASON and never a pass. That half is measured by RUNNING the
 *      parity suite of this feature in a child process and reading its TAP
 *      output: every skip must carry a reason that names what is missing.
 *
 * The pattern is feature 100's T206 (`packages/testkit/test/macos-runner.test.ts`),
 * which holds the same two-way rule for its own section of `verified.md`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The root of the repository: five levels up from `test/static/`. */
const ROOT = resolve(dirname(dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))))));

const WORKFLOW = ".github/workflows/build.yml";
const RESEARCH = "specs/104-spec-input/research.md";
/** The ONE run record of the workspace: the macOS job of feature 100 writes it. */
const RECORD = "tests/release/100/macos-verified.json";
const PROCEDURE = "tests/release/100/macos-run.md";

function readText(file: string): string {
  return readFileSync(join(ROOT, file), "utf8");
}

/** Section T054 of `research.md`, from its heading to the end of the file. */
function sectionT054(): string {
  const document = readText(RESEARCH);
  const start = document.indexOf("## T054");
  assert.notEqual(start, -1, `${RESEARCH} must hold a section "## T054 …"`);
  const next = document.indexOf("\n## ", start + 1);
  return next === -1 ? document.slice(start) : document.slice(start, next);
}

test("T054: the build workflow runs EVERY test of this feature on a macOS runner", () => {
  const workflow = readText(WORKFLOW);
  // The matrix, and that a Linux failure does not cancel the macOS job.
  assert.match(workflow, /macos-latest/, "the matrix carries macos-latest");
  assert.match(workflow, /fail-fast: false/);
  assert.match(workflow, /workflow_dispatch/, "the run is startable by hand");
  // `npm run test` is run on BOTH entries of the matrix, and it carries every
  // test of this feature. The root script is read, not assumed.
  assert.match(workflow, /run: npm run test/);
  const root = JSON.parse(readText("package.json")) as { scripts: Record<string, string> };
  const all = root.scripts["test"] as string;
  assert.match(all, /npm test --workspaces/, "every package's own tests");
  assert.match(all, /test:parity/, "the parity suite");
  assert.match(all, /test:characterization/, "the characterization suite");
  // And the three trees of this feature are inside those three globs.
  assert.match(root.scripts["test:parity"] as string, /tests\/parity\/\*\*/);
  assert.match(root.scripts["test:characterization"] as string, /tests\/characterization\/\*\*/);
  for (const tree of [
    "tests/parity/104",
    "tests/characterization/104",
    "packages/spec-formats/test",
    "packages/kernel/test/hasher",
  ]) {
    assert.ok(existsSync(join(ROOT, tree)), `${tree} is a test tree of this feature`);
  }
  // The package of this feature declares the script the workspace glob runs.
  const own = JSON.parse(readText("packages/spec-formats/package.json")) as {
    scripts: Record<string, string>;
  };
  assert.match(own.scripts["test"] as string, /node --test/);
});

test("T054: the two-way rule between the run record and section T054", () => {
  const section = sectionT054();
  // The procedure that makes the run exists, and the section names it.
  assert.ok(existsSync(join(ROOT, PROCEDURE)), `${PROCEDURE} must exist`);
  assert.ok(section.includes(PROCEDURE), "the section names the scripted procedure");

  if (!existsSync(join(ROOT, RECORD))) {
    // The record is ABSENT: the section says `unverified`, gives its reason,
    // and its entry table is EMPTY. A row of the entry table with the record
    // absent would be a claim with nothing behind it.
    assert.match(section, /Status: `unverified`/, "the section says `unverified`");
    assert.match(section, /No macOS runner has run them/);
    assert.match(section, /`unverified`/);
    assert.match(section, /Reason:/, "the section gives its reason");
    assert.match(section, /out of band|OUT OF BAND/, "the ruling of 2026-09-30 is named");
    // The entry table holds exactly one row, and it is the empty one.
    const entry = section.slice(section.indexOf("### The entry"));
    const rows = entry
      .split("\n")
      .filter((line) => line.startsWith("|") && !/^\|\s*-+/.test(line.replace(/\|/g, "|")));
    const body = rows.filter((line) => !line.includes("Date") && !/^\|[\s|:-]+\|$/.test(line));
    assert.equal(body.length, 1, `the entry table holds one row; it holds ${body.length}`);
    assert.match(body[0] as string, /^\|( — \|)+$/, "and that row is empty");
    return;
  }

  // The record is PRESENT: it is a well-formed run record, and the section
  // carries the SAME run with its date and its version.
  const record = JSON.parse(readText(RECORD)) as Record<string, unknown>;
  for (const field of ["date", "runner", "node", "workflowRun"]) {
    assert.equal(typeof record[field], "string", `the record carries \`${field}\``);
    assert.notEqual(record[field], "", `the record's \`${field}\` is not empty`);
  }
  assert.match(record["date"] as string, /^\d{4}-\d{2}-\d{2}/, "the date of the run");
  assert.match(record["node"] as string, /^v\d+/, "the version of Node");
  // The section must now say so, and carry the same date and the same version.
  assert.ok(
    !/Status: `unverified`/.test(section),
    "the record is present: the section may no longer say `unverified`",
  );
  assert.ok(section.includes(record["date"] as string), "the section carries the run's date");
  assert.ok(section.includes(record["node"] as string), "the section carries the Node version");
  assert.ok(section.includes(record["runner"] as string), "the section carries the runner image");
});

test("T054: a test whose PREREQUISITE is missing reports a skip with its reason", () => {
  // The three prerequisites this feature's tests can lack, and the reason each
  // skip must name. The oracle's is the one that bites today: 0 of 31 golden
  // captures of FX-09, FX-10, FX-32 and FX-33 exist (T001, unchanged).
  const REASONS = Object.freeze([
    /prerequisite missing/,
    /golden capture|fixture\.json/,
    /SKIP with its reason and never a pass/,
  ]);

  // The parity suite of this feature is RUN, and its TAP output measured. A
  // non-zero exit would be a failure of the suite and is reported as one.
  let tap: string;
  try {
    tap = execFileSync(
      process.execPath,
      ["--test", "--test-reporter=tap", "tests/parity/104/*.test.ts"],
      {
        cwd: ROOT,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
        // The test runner marks its own children with `NODE_TEST_CONTEXT`, and
        // a child that sees it reports in the runner's internal format instead
        // of TAP. The variable is dropped so that the suite below really does
        // print the TAP this test reads.
        env: Object.fromEntries(
          Object.entries(process.env).filter(([name]) => name !== "NODE_TEST_CONTEXT"),
        ) as NodeJS.ProcessEnv,
      },
    );
  } catch (cause) {
    const failed = cause as { stdout?: string; status?: number };
    assert.fail(
      `the parity suite of this feature did not pass (exit ${failed.status}):\n` +
        `${(failed.stdout ?? "").split("\n").slice(-40).join("\n")}`,
    );
  }

  // Non-vacuity: the suite really ran, and it really skipped something.
  const skipped = Number(/^# skipped (\d+)$/m.exec(tap)?.[1] ?? "-1");
  const passed = Number(/^# pass (\d+)$/m.exec(tap)?.[1] ?? "-1");
  const failed = Number(/^# fail (\d+)$/m.exec(tap)?.[1] ?? "-1");
  assert.equal(failed, 0, "the parity suite of this feature has no failure");
  assert.ok(passed > 0, `the suite ran: ${passed} passed`);
  assert.ok(skipped > 0, `the suite skipped something: ${skipped} skipped`);

  // EVERY skip carries a reason, and the reason names what is missing. A skip
  // with no reason would be a prerequisite silently dropped.
  const skips = tap.split("\n").filter((line) => / # SKIP/.test(line));
  assert.equal(
    skips.length,
    skipped,
    `every skip of the ${skipped} reported is on a line of its own`,
  );
  for (const line of skips) {
    const reason = line.slice(line.indexOf(" # SKIP") + " # SKIP".length).trim();
    assert.notEqual(reason, "", `a skip with no reason: ${line}`);
    assert.ok(reason.length > 40, `a skip with a reason too short to say what is missing: ${line}`);
    for (const pattern of REASONS) {
      assert.match(reason, pattern, line);
    }
  }

  // And the reason is TRUE: the captures really are absent. The same reader
  // the fixture-availability check of T001 uses says so, so this half cannot
  // become a stale claim the day the captures land — it would fail instead.
  const catalogue = JSON.parse(
    readText("specs/141-parity-oracle/contracts/fixture-catalogue.json"),
  ) as {
    families?: {
      id: string;
      status?: string;
      features?: string[];
      scenarios?: unknown[];
    }[];
  };
  const families = (catalogue.families ?? []).filter((family) =>
    ["FX-09", "FX-10", "FX-32", "FX-33"].includes(family.id),
  );
  assert.equal(families.length, 4, "the four fixture families of this feature are declared");
  for (const family of families) {
    assert.equal(family.status, "active", `${family.id} is active`);
    assert.ok(
      (family.features ?? []).some((name) => name.includes("104")),
      `${family.id} names 104`,
    );
    assert.ok((family.scenarios ?? []).length > 0, `${family.id} declares scenarios`);
  }
  // The skip is honest only while no capture is BUILT. The report of T001
  // records the count it measured, and `comparison.ts` measures the route per
  // scenario from disk — so the day a capture lands the parity tests stop
  // skipping without an edit, and this half would fail instead of going stale.
  const report = readText("tests/parity/104/FIXTURES.md");
  assert.match(report, /\*\*Scenarios declared: (\d+)\. Present: 0\. Missing: \1\.\*\*/);
  assert.match(readText("tests/parity/104/comparison.ts"), /availabilityOf/);
});
