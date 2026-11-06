/**
 * T265 — static tests CT-100-326 (annex X, §X.10; F100-FR-226; F100-SC-003;
 * quickstart.md scenario 3, the rows "Vocabulary" and "No closed list").
 *
 * The review fails on a specification whose exit code, stop reason, state
 * name, logical name, envelope field or configuration rank is not in the data
 * files, and on a requirement that lists harness names. Each of the six
 * vocabularies is proven twice: the repository passes, and a synthetic
 * specification in which the value is not in the data files fails.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkVocabulary,
  envelopeFields,
  exitCodes,
  logicalNamePatterns,
  matchesALogicalName,
  ranks,
  runStates,
  stopReasons,
} from "../src/static/vocabulary.ts";
import { checkOpenHarnessRegistry, harnessNames } from "../src/static/product-rules.ts";
import { review, reviewCheck } from "../src/static/static-review.ts";

function corpus(text: string): { dir: string; files: string[] } {
  const dir = mkdtempSync(join(tmpdir(), "specstride-review-"));
  const file = join(dir, "spec.md");
  writeFileSync(file, text);
  return { dir, files: [file] };
}

function findingsFor(text: string): ReturnType<typeof checkVocabulary> {
  const { dir, files } = corpus(text);
  try {
    return checkVocabulary({ specFiles: files });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("CT-100-326: the review passes over the specifications of all features (F100-FR-226)", () => {
  assert.deepEqual([...checkVocabulary()], []);
  assert.deepEqual([...checkOpenHarnessRegistry()], []);
  assert.deepEqual([...review()], []);
  assert.equal(reviewCheck.name, "No closed list");
  assert.ok(reviewCheck.covers.includes("F100-FR-226"));
});

test("CT-100-326: the six vocabularies come from the data files (F100-FR-226)", () => {
  // The values the review compares against are read from the data files, so
  // that the review and the product cannot drift.
  assert.ok(exitCodes().has("0"));
  assert.ok(exitCodes().has("70"));
  assert.ok(runStates().has("running"));
  assert.ok(runStates().has("blocked-on-human"));
  assert.ok(stopReasons().has("stop_flag"));
  assert.equal(stopReasons().size, 15, "the 15 stop reasons of annex E §E.3");
  assert.ok(envelopeFields().has("seq"));
  assert.ok(envelopeFields().has("runId"));
  assert.deepEqual([...ranks()].sort(), ["1", "2", "3", "4", "5", "6", "7", "8"]);
  const { patterns, namespaces } = logicalNamePatterns();
  assert.ok(namespaces.has("run"));
  assert.ok(namespaces.has("gate"));
  assert.ok(matchesALogicalName("run:<runId>:events", patterns));
  // An instantiated parameter matches its template.
  assert.ok(matchesALogicalName("overlay:dsh:tree", patterns));
  // A long form the table states ("Short for `…`") matches too.
  assert.ok(matchesALogicalName("run:<runId>:tree-store", patterns));
  assert.equal(matchesALogicalName("run:<runId>:invented", patterns), false);
});

test("CT-100-326: the review fails on an exit code that is in no table", () => {
  const findings = findingsFor("A failure MUST end with exit 199 beside the command.\n");
  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.value, "199");
  assert.match(findings[0]?.message ?? "", /is in no exit-code table/);
  assert.equal(findings[0]?.line, 1);
  // A code the table holds passes.
  assert.deepEqual([...findingsFor("It MUST end with exit 3 beside the command.\n")], []);
  // A code inside a code span is a quoted as-is message, not a statement of
  // the product: the check reads prose.
  assert.deepEqual([...findingsFor("The baseline prints `aborting (exit 199)`.\n")], []);
});

test("CT-100-326: the review fails on a stop reason, a state name and a rank that are in no data file", () => {
  const stop = findingsFor("The engine MUST write the stop reason `not_a_reason`.\n");
  assert.equal(stop.length, 1);
  assert.equal(stop[0]?.value, "not_a_reason");
  assert.match(stop[0]?.message ?? "", /is in no closed set/);
  assert.deepEqual([...findingsFor("The engine MUST write the stop reason `stop_flag`.\n")], []);

  const state = findingsFor("The run MUST enter the run state `almost-done`.\n");
  assert.equal(state.length, 1);
  assert.equal(state[0]?.value, "almost-done");
  assert.match(state[0]?.message ?? "", /is in no state table/);
  assert.deepEqual([...findingsFor("The run MUST enter the run state `running`.\n")], []);

  const rank = findingsFor("The key MUST be resolved at rank 9 of the table.\n");
  assert.equal(rank.length, 1);
  assert.equal(rank[0]?.value, "9");
  assert.match(rank[0]?.message ?? "", /is in no rank table/);
  assert.deepEqual([...findingsFor("The key MUST be resolved at rank 5 of the table.\n")], []);
});

test("CT-100-326: the review fails on a logical name and an envelope field that are in no data file", () => {
  const name = findingsFor("The engine MUST write `run:<runId>:invented`.\n");
  assert.equal(name.length, 1);
  assert.equal(name[0]?.value, "run:<runId>:invented");
  assert.match(name[0]?.message ?? "", /is not in the table of annex B §B.5/);
  assert.deepEqual([...findingsFor("The engine MUST write `run:<runId>:events`.\n")], []);
  // A token whose first segment is no namespace of the table is no logical
  // name: `node:fs` and `test:static` are not findings.
  assert.deepEqual([...findingsFor("It MUST NOT import `node:fs` and runs `test:static`.\n")], []);
  // A line that records a withdrawal is no use of the name.
  assert.deepEqual([...findingsFor("The request for `run:<runId>:invented` is withdrawn.\n")], []);

  const field = findingsFor("Every event MUST carry the envelope field `notAField`.\n");
  assert.equal(field.length, 1);
  assert.equal(field[0]?.value, "notAField");
  assert.match(field[0]?.message ?? "", /is in no event envelope/);
  assert.deepEqual([...findingsFor("Every event MUST carry the envelope field `seq`.\n")], []);
});

test("CT-100-326: the review fails on a requirement that lists harness names (F100-FR-023, F100-FR-226)", () => {
  const names = harnessNames();
  assert.ok(names.length >= 2);
  const { dir, files } = corpus(
    `- **F999-FR-001**: The critic MUST be one of \`${names[0]}\`, \`${names[1]}\`.\n`,
  );
  try {
    const findings = checkOpenHarnessRegistry({ specFiles: files });
    assert.equal(findings.length, 1);
    assert.match(findings[0]?.message ?? "", /as a closed set/);
    assert.match(findings[0]?.message ?? "", /reads the resolved registry/);
    // The review reports it too.
    assert.equal(review({ specFiles: files }).length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  // A line that is not a requirement is not a closed list of harnesses: the
  // fixture catalogues and the terms tables name them as data.
  const data = corpus(`| \`${names[0]}\` | \`${names[1]}\` | a table of data |\n`);
  try {
    assert.deepEqual([...checkOpenHarnessRegistry({ specFiles: data.files })], []);
  } finally {
    rmSync(data.dir, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------------ *
 * T305 — the scope of the static review (owner ruling of 2026-09-30;
 * F100-FR-225 and F100-FR-226 as amended).
 *
 * The runner reads `TESTKIT_STATIC_SCOPE` (feature folder names separated by
 * commas; unset or empty means every feature). The checks that read the
 * specifications take the named folders as their subject and still read every
 * folder of `specs/1*` as reference; a named folder that does not exist fails
 * the run; the checks of the `contracts` package are not scoped.
 * ------------------------------------------------------------------ */

const KIT = await import("../src/static/kit.ts");
const RUNNER = await import("../src/static/index.ts");

/**
 * A fixture `specs/` of two feature folders. The violation is a requirement
 * that lists harness names, which the harness-list check of T018 and T265
 * refuses (F100-FR-023) — one of the four checks the scope narrows.
 */
function twoFeatures(options: {
  readonly violationIn?: "110-inside" | "120-outside" | undefined;
}): { root: string; cleanUp: () => void } {
  const root = mkdtempSync(join(tmpdir(), "specstride-scope-"));
  // The harness names come from the data files of this repository, never from
  // the fixture: the check reads the registry, and the fixture is only a corpus.
  const names = harnessNames(KIT.ROOT);
  assert.ok(names.length >= 2, "the data files of the package name the harnesses");
  const clean = "- **F110-FR-001**: The runtime MUST read the resolved registry.\n";
  const dirty =
    "- **F120-FR-001**: The runtime MUST support the harnesses " +
    names
      .slice(0, 2)
      .map((n) => `\`${n}\``)
      .join(" and ") +
    ".\n";
  for (const folder of ["110-inside", "120-outside"]) {
    const dir = join(root, "specs", folder);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "spec.md"),
      `# Feature ${folder}\n\n## Requirements\n\n` +
        (options.violationIn === folder ? dirty : clean),
    );
  }
  return { root, cleanUp: () => rmSync(root, { recursive: true, force: true }) };
}

/**
 * The harness-list check over a fixture root: the real data files of the
 * `contracts` package name the harnesses, so the fixture root is only the
 * corpus. The check reads the names from the repository, never from the scope.
 */
function harnessFindings(fixtureRoot: string, scope: readonly string[]): readonly unknown[] {
  // The names come from THIS repository (`root`), and the files that are the
  // subject come from the fixture root under the scope given.
  const files = KIT.specFiles({ root: fixtureRoot, scope });
  return checkOpenHarnessRegistry({ root: KIT.ROOT, specFiles: files });
}

test("T305: the runner reads TESTKIT_STATIC_SCOPE, and unset or empty means every feature", () => {
  assert.equal(KIT.STATIC_SCOPE_VARIABLE, "TESTKIT_STATIC_SCOPE");
  assert.deepEqual([...KIT.scopeFromEnvironment({})], []);
  assert.deepEqual([...KIT.scopeFromEnvironment({ TESTKIT_STATIC_SCOPE: "" })], []);
  assert.deepEqual([...KIT.scopeFromEnvironment({ TESTKIT_STATIC_SCOPE: "  ,  " })], []);
  // Feature folder names separated by commas, blanks trimmed.
  assert.deepEqual(
    [...KIT.scopeFromEnvironment({ TESTKIT_STATIC_SCOPE: "100-specstride, 116-x ,," })],
    ["100-specstride", "116-x"],
  );
  // An empty scope is every feature of `specs/1*`.
  const every = KIT.specDirectories();
  assert.deepEqual(KIT.scopedSpecDirectories({ scope: [] }), every);
  assert.deepEqual(KIT.scopedSpecDirectories({}), every);
});

test("T305: a violation OUTSIDE the scope passes the scoped run and fails the full run", () => {
  const { root, cleanUp } = twoFeatures({ violationIn: "120-outside" });
  try {
    // The full run (no scope) sees it and fails.
    const full = harnessFindings(root, []);
    assert.equal(full.length, 1, "the full run finds the violation");
    assert.match(
      (full[0] as { file: string }).file,
      /120-outside/,
      "the finding names the folder outside the scope",
    );
    // The scoped run takes only the named folder as its subject, and passes.
    assert.deepEqual([...harnessFindings(root, ["110-inside"])], []);
  } finally {
    cleanUp();
  }
});

test("T305: a violation INSIDE the scope fails both the scoped run and the full run", () => {
  const { root, cleanUp } = twoFeatures({ violationIn: "110-inside" });
  try {
    const scoped = harnessFindings(root, ["110-inside"]);
    assert.equal(scoped.length, 1, "the scoped run finds it");
    assert.match((scoped[0] as { file: string }).file, /110-inside/);
    const full = harnessFindings(root, []);
    assert.equal(full.length, 1, "the full run finds it too");
    assert.match((full[0] as { file: string }).file, /110-inside/);
  } finally {
    cleanUp();
  }
});

test("T305: an UNKNOWN folder name fails the run, naming the folder", () => {
  const { root, cleanUp } = twoFeatures({});
  try {
    assert.throws(
      () => KIT.scopedSpecDirectories({ root, scope: ["110-inside", "999-absent"] }),
      (error: unknown) =>
        error instanceof KIT.UnknownScopeError &&
        error.unknown.includes("999-absent") &&
        !error.unknown.includes("110-inside") &&
        /999-absent/.test(error.message) &&
        /TESTKIT_STATIC_SCOPE/.test(error.message),
      "a folder the scope names that `specs/` does not hold fails the run",
    );
    // The runner refuses it too, and names the folders that do exist.
    assert.throws(
      () => RUNNER.resolveScope({ root, scope: ["999-absent"] }),
      (error: unknown) =>
        error instanceof KIT.UnknownScopeError && error.known.includes("110-inside"),
    );
    // A folder that exists resolves.
    assert.deepEqual(
      RUNNER.resolveScope({ root, scope: ["110-inside"] }).directories.map((d) =>
        d.split("/").pop(),
      ),
      ["110-inside"],
    );
  } finally {
    cleanUp();
  }
});

test("T305: the scope narrows the subject but never the reference corpus", () => {
  const { root, cleanUp } = twoFeatures({});
  try {
    // The SUBJECT of a scoped run is the named folder only.
    const subject = KIT.specFiles({ root, scope: ["110-inside"] });
    assert.equal(subject.length, 1);
    assert.match(subject[0] as string, /110-inside/);
    // The REFERENCE corpus is every folder of `specs/1*`, whatever the scope.
    const reference = KIT.referenceSpecFiles({ root, scope: ["110-inside"] });
    assert.equal(reference.length, 2);
    assert.ok(reference.some((f) => f.includes("120-outside")));
    assert.deepEqual(
      KIT.referenceSpecDirectories(root).map((d) => d.split("/").pop()),
      ["110-inside", "120-outside"],
    );
    // And the specification files proper, the same way.
    assert.equal(KIT.specificationFiles({ root, scope: ["110-inside"] }).length, 1);
    assert.equal(KIT.referenceSpecificationFiles({ root, scope: ["110-inside"] }).length, 2);
  } finally {
    cleanUp();
  }
});

test("T305: the four checks that read the specifications are scoped; the others are not", () => {
  // The scope narrows exactly the checks of T262, T263, T265 and the
  // harness-list check of T018.
  assert.deepEqual([...RUNNER.SCOPED_CHECKS].sort(), [
    "No closed list",
    "Physical paths",
    "Product-wide rules: vocabulary and the open registry",
    "Vocabulary",
  ]);
  const scoped = RUNNER.CHECKS.filter((c) => RUNNER.isScoped(c)).map((c) => c.name);
  assert.equal(scoped.length, 4);
  // The checks of the `contracts` package never see the scope: `optionsFor`
  // hands them the empty scope, which is every folder.
  for (const name of ["Closed sets", "Schema field", "Logical names", "Profile"]) {
    const check = RUNNER.CHECKS.find((c) => c.name === name);
    assert.ok(check !== undefined, name);
    assert.equal(RUNNER.isScoped(check), false, `${name} is not scoped`);
    assert.deepEqual(
      RUNNER.optionsFor(check, { scope: ["100-specstride"] }).scope,
      [],
      `${name} is run over every folder`,
    );
  }
  // A scoped check keeps the scope it was given.
  const physical = RUNNER.CHECKS.find((c) => c.name === "Physical paths");
  assert.ok(physical !== undefined);
  assert.deepEqual(RUNNER.optionsFor(physical, { scope: ["100-specstride"] }).scope, [
    "100-specstride",
  ]);
});

test("T305: runAll under the scope of feature 100 passes over this repository", () => {
  // The gate of phase 4 runs `test:static` scoped to feature 100; the full run
  // over every feature is the gate of phase 10 (F100-FR-226).
  const results = RUNNER.runAll({ scope: ["100-specstride"] });
  assert.equal(results.length, RUNNER.CHECKS.length);
  for (const result of results) {
    assert.deepEqual(result.findings.map(RUNNER.formatFinding), [], RUNNER.report(result));
  }
});
