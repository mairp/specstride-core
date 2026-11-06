/**
 * T017 — contract tests CT-100-122 to CT-100-126 for the product-wide rules
 * F100-FR-022 to F100-FR-026 (annex A, §A.5).
 *
 * Each one checks, at contract level, what the rule leaves in the data files
 * or in the specifications.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  NEVER_BARE_HEADS,
  NEVER_BARE_TERMS,
  RECOVERY_CYCLE,
  checkNeverBareTerms,
  checkOpenHarnessRegistry,
  harnessNames,
} from "../src/static/product-rules.ts";
import {
  DIVERSITY_SET,
  EP_02_FILE,
  MEMBERS_THAT_RAISE_THE_WARNING,
  checkCriticSession,
  checkPlatformMarks,
  macosRunnerHasPassed,
} from "../src/static/product-rules-platform.ts";
import {
  OLD_SIDE_FILE,
  asIsDirectoryPlaceholders,
  checkNoAsIsStateDirectory,
  legacyNames,
} from "../src/static/product-rules-packaging.ts";
import { ROOT, readJson, specFiles } from "../src/static/kit.ts";

const closedSets = readJson<{
  closedSets: { number: number; name: string; literals: string[]; owner: string }[];
}>(join(ROOT, "packages/contracts/data/closed-sets.json")).closedSets;

test("CT-100-122: the never-bare terms are written in their qualified form (F100-FR-022)", () => {
  // The thirteen terms annex A §A.5 lists.
  assert.equal(NEVER_BARE_TERMS.length, 13);
  assert.deepEqual(
    [...NEVER_BARE_TERMS],
    [
      "phase gate",
      "launch check",
      "verification gate",
      "phase attempt",
      "stage attempt",
      "launch contract",
      "launch bundle",
      "spec bundle",
      "engine hook",
      "host hook",
      "harness adapter",
      "auth tier",
      "model tier",
    ],
  );
  assert.deepEqual([...NEVER_BARE_HEADS].sort(), [
    "adapter",
    "attempt",
    "bundle",
    "check",
    "contract",
    "gate",
    "hook",
    "tier",
  ]);
  assert.equal(RECOVERY_CYCLE, "recovery cycle");
  // The specifications keep the rule.
  assert.deepEqual([...checkNeverBareTerms()], []);
});

test("CT-100-122: the check discriminates — a run-together spelling and a bare heading fail", () => {
  // The check reads a list of files a caller gives it, so a synthetic corpus
  // proves that it can fail.
  // The files are named `spec.md`, because the never-bare rules bind the
  // specification proper (`spec.md` and the annexes), not every file.
  const dir = mkdtempSync(join(tmpdir(), "specstride-nb-"));
  const withRunTogether = join(dir, "a", "spec.md");
  const withHeading = join(dir, "b", "spec.md");
  const withMicroLoop = join(dir, "c", "spec.md");
  for (const path of [withRunTogether, withHeading, withMicroLoop]) {
    mkdirSync(join(path, ".."), { recursive: true });
  }
  try {
    writeFileSync(withRunTogether, "The harnessadapter starts the pass.\n");
    writeFileSync(withHeading, "# Gate\n\nsomething\n");
    writeFileSync(withMicroLoop, "The micro-loop does the diagnosis of the phase attempt.\n");
    const findings = checkNeverBareTerms({
      specFiles: [withRunTogether, withHeading, withMicroLoop],
    });
    const values = findings.map((f) => f.value);
    // Every never-bare term is missing from this corpus, so the
    // qualified-form rule fires for each; plus the three deviations.
    assert.ok(values.includes("harnessadapter"), "a run-together spelling is a finding");
    assert.ok(values.includes("Gate"), "a bare heading is a finding");
    assert.ok(values.includes("micro-loop"), "the old use of micro-loop is a finding");
    // The qualified-form rule fires for every term this corpus never writes.
    const text =
      "The harnessadapter starts the pass.\n# Gate\nThe micro-loop does the diagnosis of the phase attempt.\n".toLowerCase();
    const absent = NEVER_BARE_TERMS.filter((t) => !text.includes(t));
    assert.ok(absent.length > 0);
    for (const term of absent) {
      assert.ok(values.includes(term), `${term} is missing from the corpus`);
    }
    // And does not fire for the one term the corpus does write.
    assert.ok(!values.includes("phase attempt"), "the corpus writes `phase attempt` qualified");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CT-100-123: no requirement assumes a closed list of harnesses (F100-FR-023)", () => {
  const names = harnessNames();
  assert.ok(names.length >= 2, "the product has harness adapters to enumerate");
  assert.deepEqual([...checkOpenHarnessRegistry()], []);
  // The check discriminates: a requirement that lists two harness literals is
  // a closed list.
  const dir = mkdtempSync(join(tmpdir(), "specstride-harness-"));
  const path = join(dir, "spec.md");
  try {
    writeFileSync(
      path,
      `- **F999-FR-001**: The critic MUST be \`${names[0]}\` or \`${names[1]}\`.\n`,
    );
    const findings = checkOpenHarnessRegistry({ specFiles: [path] });
    assert.equal(findings.length, 1);
    assert.match(findings[0]?.message ?? "", /as a closed set/);
    assert.match(findings[0]?.message ?? "", /reads the resolved registry/);
    // One name alone is the adapter's own feature naming itself: not a list.
    writeFileSync(path, `- **F999-FR-002**: The adapter of \`${names[0]}\` MUST do so.\n`);
    assert.deepEqual([...checkOpenHarnessRegistry({ specFiles: [path] })], []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CT-100-124: the EP-02 contract requires a fresh session, and the diversity set raises the warning (F100-FR-024)", () => {
  // The contract of `complete` in the EP-02 contract file.
  const contract = readJson<{ operations: string[]; sections: Record<string, unknown> }>(
    join(ROOT, EP_02_FILE),
  );
  assert.ok(contract.operations.includes("complete"), "EP-02 offers `complete`");
  const text = JSON.stringify(contract.sections);
  assert.match(text, /Every critic-class call is a fresh session/);
  assert.match(JSON.stringify(contract.sections["Inputs"]), /the minted session id/);
  // The closed set of the diversity test holds both members that raise the
  // critic-diversity warning (annex X §X.6 row 183).
  const row = closedSets.find((r) => r.number === DIVERSITY_SET);
  assert.notEqual(row, undefined);
  assert.equal(row?.name, "Results of the diversity test");
  for (const member of MEMBERS_THAT_RAISE_THE_WARNING) {
    assert.ok(row?.literals.includes(member), `${member} must be a member of row ${DIVERSITY_SET}`);
  }
  assert.deepEqual([...MEMBERS_THAT_RAISE_THE_WARNING], ["same-model", "unverified"]);
  // The check over the repository passes.
  assert.deepEqual([...checkCriticSession()], []);
});

test("CT-100-125: every macOS statement carries unverified, and no specification names Windows or WSL as supported (F100-FR-025)", () => {
  assert.deepEqual([...checkPlatformMarks()], []);
  // The mark is required while the macOS runner has not passed (T206).
  assert.equal(macosRunnerHasPassed(), false, "the macOS runner has not passed yet");
  // The check discriminates.
  const dir = mkdtempSync(join(tmpdir(), "specstride-platform-"));
  const path = join(dir, "spec.md");
  try {
    writeFileSync(path, "Windows and WSL are supported by the product.\n");
    const findings = checkPlatformMarks({ specFiles: [path] });
    assert.ok(
      findings.some((f) => /names Windows or WSL as supported/.test(f.message)),
      "a specification that names Windows as supported is a finding",
    );
    // The recorded form is not a finding.
    writeFileSync(
      path,
      "| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated |\n",
    );
    assert.deepEqual(
      checkPlatformMarks({ specFiles: [path] }).filter((f) => /as supported/.test(f.message)),
      [],
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  // Every spec.md of the product records it.
  const specs = specFiles().filter((f) => /(^|\/)spec\.md$/.test(f));
  assert.ok(specs.length >= 40, "every feature has a spec.md");
});

test("CT-100-126: no package, schema or data file names a state directory of the three as-is systems (F100-FR-026)", () => {
  // The as-is directory names live on the old side of the layout table, and
  // only there.
  const placeholders = asIsDirectoryPlaceholders();
  assert.ok(placeholders.includes("<state>"), "the old side names the as-is state directory");
  assert.ok(placeholders.includes("<artifact root>"), "and the as-is artifact directory");
  assert.equal(OLD_SIDE_FILE, "packages/contracts/data/layout-old-side.json");
  // No legacy command name is carried either. The names come from the
  // `asIsPaths` of the old side, so that this test names none of them.
  const legacy = legacyNames();
  assert.ok(legacy.length > 0, "the old side names the legacy commands");
  assert.ok(
    legacy.some((n) => n.endsWith(".sh")),
    "a shell script of a baseline",
  );
  assert.ok(
    legacy.some((n) => n.endsWith(".py")),
    "a Python module of a baseline",
  );
  // The workspace holds none of them outside the one file.
  assert.deepEqual([...checkNoAsIsStateDirectory()], []);
});
