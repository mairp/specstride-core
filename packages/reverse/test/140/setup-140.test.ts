/**
 * Phase 1 of feature 140, T001, T002 and T003: the three directories of this
 * feature inside `@specstride/reverse`, the five Spec Kit templates with their
 * MIT notice and the record of the upstream commit, the two contract files in
 * `data/`, and the build check that `src/codes.ts` equals `finding-codes.json`.
 *
 * Every assertion reads the FILE SYSTEM — the independent read path — and
 * records a content hash, so each effect is OBSERVED and never declared. The
 * modules are imported, so a file that exists but cannot load does not pass.
 * Each task also carries a NEGATIVE case: a check that would report success
 * without a durable effect is made to fail here on purpose.
 *
 * This file is in `test/140/` and not in `test/`: feature 108's record test
 * (`tests/characterization/108/records.test.ts`, T032) enumerates the flat
 * `packages/reverse/test/` directory and requires one row of its macOS record
 * per file it finds. That record is 108's artifact; this feature does not
 * write it. The package's own `test` script globs `test/**` and runs this file.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
/** The package root: two levels up from `test/140/`. */
const PACKAGE_ROOT = join(HERE, "..", "..");
/** The repository root: four levels up from `packages/reverse/test/140`. */
const ROOT = join(HERE, "..", "..", "..", "..");

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

/** The three directories T001 creates in the package. */
const T001_DIRECTORIES = ["src/inventory", "src/lint", "templates"] as const;

/**
 * T002 — the five templates, their MIT notice, and the SHA-256 of each as the
 * baseline at `9cab15d` holds it, which is the upstream `github/spec-kit`
 * commit `4a7341a9`. The hashes are PINNED here as well as in
 * `templates/UPSTREAM.txt`: three records must agree — the bytes on disk, the
 * record beside them, and this test — so an "unchanged copy" that quietly
 * changed fails even when its own record was updated with it.
 */
const T002_TEMPLATES = {
  "checklist-template.md": "c65b7f10aa9a965ea9c7f4e879d4ab0240665473731c5e9e638c4acb3ca9afc4",
  "constitution-template.md": "ce7549540fa45543cca797a150201d868e64495fdff39dc38246fb17bd4024b3",
  "plan-template.md": "dfba43da2b2a207ff8c177a0fba03af074fd45e261696b4b64172041fad2e992",
  "spec-template.md": "3945437fc35cd30a5b2bf7beea680337c3516826d3efa5a6b92c4a7eca1ba28e",
  "tasks-template.md": "1e448e9153462e8c5b5a55231a54c756d870a82950d4dd9425a2bf5b7008a0d9",
} as const;

/** The MIT notice that travels with the templates. */
const T002_LICENCE = "2510b446bc1f0cf9702453075d20cd88631e20e5642658edb7325d9c1eb534f7";

/** The upstream commit the record names (F140-FR-026). */
const T002_UPSTREAM_COMMIT = "4a7341a9";

/** T003 — the two contract files of this feature, copied into `data/`. */
const T003_DATA_FILES = ["finding-codes.json", "inventory.schema.json"] as const;

/* ------------------------------------------------------------------------- *
 * T001 — the directories of this feature in the package
 * ------------------------------------------------------------------------- */

test("T001: src/inventory/, src/lint/ and templates/ are directories of the package", () => {
  for (const relative of T001_DIRECTORIES) {
    const directory = join(PACKAGE_ROOT, relative);
    // Read through `statSync`, not through a flag the creator returned.
    assert.equal(
      statSync(directory).isDirectory(),
      true,
      `packages/reverse/${relative} is a directory`,
    );
    const entries = readdirSync(directory);
    assert.ok(entries.length > 0, `packages/reverse/${relative} is not empty`);
  }
});

test("T001: the negative case — an absent directory is not reported as present", () => {
  // The read path this task is witnessed through must FAIL for a directory
  // that was never created; a check that cannot fail is not a check.
  assert.throws(
    () => statSync(join(PACKAGE_ROOT, "src/this-directory-was-never-created")),
    /ENOENT/,
    "statSync throws for a directory the phase did not create",
  );
  const siblings = readdirSync(join(PACKAGE_ROOT, "src"));
  assert.ok(!siblings.includes("this-directory-was-never-created"));
  // And the three that ARE there are there as directories, not as files of
  // the same name, which `isDirectory` is what distinguishes.
  for (const relative of T001_DIRECTORIES) {
    assert.equal(statSync(join(PACKAGE_ROOT, relative)).isFile(), false, relative);
  }
});

test("T001: the package manifest is @specstride/reverse and has no install script", () => {
  const manifestPath = join(PACKAGE_ROOT, "package.json");
  assert.equal(statSync(manifestPath).isFile(), true, "packages/reverse/package.json is a file");
  assert.match(sha256(manifestPath), /^[0-9a-f]{64}$/, "the manifest has a content hash");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    name: string;
    scripts: Record<string, string | undefined>;
    specstride?: { owner?: string };
  };
  assert.equal(manifest.name, "@specstride/reverse");
  // Owners 108 and 140, as `package-graph.json` has it: T001 names both.
  assert.match(String(manifest.specstride?.owner), /140/, "feature 140 is an owner");
  // "no install script" (F100-FR-027): the gate's `npm install --ignore-scripts`
  // is the whole installation, and nothing compiles.
  for (const script of [
    "preinstall",
    "install",
    "postinstall",
    "prepare",
    "prepublish",
    "prepublishOnly",
    "build",
  ]) {
    assert.equal(manifest.scripts[script], undefined, `no ${script} script`);
  }
});

test("T001: the package graph names @specstride/reverse with 140 as an owner", () => {
  const graph = JSON.parse(
    readFileSync(join(ROOT, "packages/contracts/data/package-graph.json"), "utf8"),
  ) as { packages: { name: string; owner: string; layer: string }[] };
  const row = graph.packages.find((p) => p.name === "@specstride/reverse");
  assert.ok(row !== undefined, "the graph holds a row for @specstride/reverse");
  assert.match(row.owner, /108/, "owner 108");
  assert.match(row.owner, /140/, "owner 140");
  assert.equal(row.layer, "L6");
});

/* ------------------------------------------------------------------------- *
 * T002 — the five shipped Spec Kit templates
 * ------------------------------------------------------------------------- */

test("T002: the five templates are in templates/ with the hashes of the baseline", () => {
  for (const [name, expected] of Object.entries(T002_TEMPLATES)) {
    const file = join(PACKAGE_ROOT, "templates", name);
    assert.equal(statSync(file).isFile(), true, `templates/${name} is a file`);
    // The durable identity: the content hash, which could not exist before the
    // copy and cannot be produced by any other bytes.
    assert.equal(sha256(file), expected, `templates/${name} is the unchanged copy`);
  }
  assert.equal(Object.keys(T002_TEMPLATES).length, 5, "five templates, as F140-FR-026 asks");
});

test("T002: the MIT notice travels with them, unchanged", () => {
  const licence = join(PACKAGE_ROOT, "templates/LICENSE");
  assert.equal(statSync(licence).isFile(), true, "templates/LICENSE is a file");
  assert.equal(sha256(licence), T002_LICENCE, "templates/LICENSE is the unchanged notice");
  const text = readFileSync(licence, "utf8");
  assert.match(text, /MIT License/, "it is the MIT licence");
  assert.match(text, /Copyright GitHub, Inc\./, "of the upstream project");
  assert.match(text, /WITHOUT WARRANTY OF ANY KIND/, "with the warranty clause");
});

test("T002: a text file records the upstream commit, and agrees with the bytes", () => {
  const record = join(PACKAGE_ROOT, "templates/UPSTREAM.txt");
  assert.equal(statSync(record).isFile(), true, "templates/UPSTREAM.txt is a file");
  const text = readFileSync(record, "utf8");
  assert.match(text, /github\/spec-kit/, "it names the upstream project");
  assert.ok(text.includes(T002_UPSTREAM_COMMIT), `it records the commit ${T002_UPSTREAM_COMMIT}`);
  assert.match(text, /\bMIT\b/, "and the licence");
  // The record is not merely prose: it carries the hash of every file beside
  // it, and each one equals the bytes on disk. A template edited without its
  // record, or a record edited without the template, fails here.
  for (const [name, expected] of Object.entries({
    ...T002_TEMPLATES,
    LICENSE: T002_LICENCE,
  })) {
    assert.ok(text.includes(expected), `UPSTREAM.txt records the hash of ${name}`);
    assert.ok(text.includes(name), `UPSTREAM.txt names ${name}`);
    assert.equal(sha256(join(PACKAGE_ROOT, "templates", name)), expected, `${name} on disk`);
  }
});

test("T002: templates/ holds exactly the five templates, the notice and the record", () => {
  const entries = readdirSync(join(PACKAGE_ROOT, "templates")).sort();
  assert.deepEqual(entries, [...Object.keys(T002_TEMPLATES), "LICENSE", "UPSTREAM.txt"].sort());
});

test("T002: the copies carry the headings the lint's rules are derived from", () => {
  const read = (name: string): string =>
    readFileSync(join(PACKAGE_ROOT, "templates", name), "utf8");
  // F140-FR-026 names, per template, the shape the lint reads out of the
  // bytes. These assertions are on the COPIES: they prove the five files are
  // the Spec Kit templates the rules were written against, and not five files
  // with the right names.
  const checklist = read("checklist-template.md");
  assert.match(checklist, /## \[Category 1\]/, "the checklist's first bracket family");
  assert.match(checklist, /## \[Category 2\]/, "and its second");
  assert.match(checklist, /## Notes/, "and the one explicit heading");

  const constitution = read("constitution-template.md");
  assert.match(constitution, /\[PROJECT_NAME\]/, "the upper-case placeholder token");
  assert.match(constitution, /## Core Principles/, "an expected heading");
  assert.match(constitution, /## Governance/, "and the other");
  assert.match(constitution, /## \[SECTION_2_NAME\]/, "and the bracket family");

  const plan = read("plan-template.md");
  assert.ok(!plan.includes("*(mandatory)*"), "no heading of the plan template is mandatory");

  const spec = read("spec-template.md");
  for (const heading of ["## User Scenarios & Testing", "## Requirements", "## Success Criteria"]) {
    assert.ok(spec.includes(heading), `the spec template carries ${heading}`);
    const line = spec.split("\n").find((l) => l.startsWith(heading)) as string;
    assert.match(line, /\*\(mandatory\)\*/, `${heading} is marked mandatory`);
  }
  const assumptions = spec.split("\n").find((l) => l.startsWith("## Assumptions"));
  assert.ok(assumptions !== undefined, "the spec template carries ## Assumptions");
  assert.ok(!assumptions.includes("*(mandatory)*"), "## Assumptions carries no mark");

  const tasks = read("tasks-template.md");
  assert.match(tasks, /## Format: `\[ID\] \[P\?\] \[Story\] Description`/, "the bracket family");
  assert.match(tasks, /^## Phase \d+:/m, "and the phase family");
});

/* ------------------------------------------------------------------------- *
 * T003 — the contracts in data/, and the build check on src/codes.ts
 * ------------------------------------------------------------------------- */

test("T003: the two contract files of this feature are copied into data/ byte for byte", () => {
  const specDirectory = join(ROOT, "specs/140-reverse-inventory-and-lint/contracts");
  // The specification holds exactly these two JSON contracts — none missed.
  const inSpec = readdirSync(specDirectory)
    .filter((name) => name.endsWith(".json"))
    .sort();
  assert.deepEqual(inSpec, [...T003_DATA_FILES].sort());
  for (const name of T003_DATA_FILES) {
    const packageFile = join(PACKAGE_ROOT, "data", name);
    const specFile = join(specDirectory, name);
    assert.equal(statSync(packageFile).isFile(), true, `data/${name} is a file`);
    // Byte for byte, by hash and by comparison: a reformatting would make the
    // package differ from the contract this feature owns.
    assert.equal(sha256(packageFile), sha256(specFile), `data/${name} has the contract's hash`);
    assert.equal(
      readFileSync(packageFile).equals(readFileSync(specFile)),
      true,
      `data/${name} is byte for byte the contract`,
    );
  }
  // And `data/` holds the copies of both owners of the package, nothing else.
  const inPackage = readdirSync(join(PACKAGE_ROOT, "data"))
    .filter((name) => name.endsWith(".json"))
    .sort();
  assert.deepEqual(inPackage, [
    "finding-codes.json",
    "inventory.schema.json",
    "plan-output.schema.json",
    "verification-commands.schema.json",
  ]);
});

test("T003: the copies are the documents their schema ids say they are", () => {
  const codes = JSON.parse(readFileSync(join(PACKAGE_ROOT, "data/finding-codes.json"), "utf8")) as {
    schema: string;
    owner: string;
    codes: { code: string; severity: string }[];
  };
  assert.equal(codes.schema, "specstride.reverse-finding-codes/1");
  assert.equal(codes.owner, "140");
  assert.equal(codes.codes.length, 38, "the closed family holds 38 codes (F140-SC-001)");
  const inventory = JSON.parse(
    readFileSync(join(PACKAGE_ROOT, "data/inventory.schema.json"), "utf8"),
  ) as { $id: string; title: string; required: string[] };
  assert.equal(inventory.$id, "urn:specstride:schema:specstride.reverse-inventory/1");
  assert.equal(inventory.title, "specstride.reverse-inventory/1");
  assert.ok(
    inventory.required.includes("fingerprint"),
    "the inventory schema requires fingerprint",
  );
  assert.ok(inventory.required.includes("schema"), "and the field `schema`");
});

test("T003: src/codes.ts equals data/finding-codes.json — the check finds no difference", async () => {
  const check = await import(join(PACKAGE_ROOT, "src/lint/codes-check.ts"));
  const codes = await import(join(PACKAGE_ROOT, "src/codes.ts"));
  assert.deepEqual([...check.differencesFromTheContract()], [], "no difference");
  check.checkCodesEqualTheContract();
  // The module really is the face of the contract: the same 38 codes, in the
  // same order, with the same severities and level strings.
  const contract = JSON.parse(
    readFileSync(join(PACKAGE_ROOT, "data/finding-codes.json"), "utf8"),
  ) as { codes: { code: string; severity: string; levels: string }[] };
  assert.deepEqual(
    codes.FINDING_CODES.map((r: { code: string; severity: string; levels: string }) => [
      r.code,
      r.severity,
      r.levels,
    ]),
    contract.codes.map((r) => [r.code, r.severity, r.levels]),
  );
  assert.equal(codes.FINDING_CODE_COUNT, 38);
  // And the `FindingCode` union of the source text lists the same 38 codes,
  // so the type cannot drift from the data.
  const union = check.unionMembers(readFileSync(join(PACKAGE_ROOT, "src/codes.ts"), "utf8"));
  assert.deepEqual(
    [...union],
    contract.codes.map((r) => r.code),
  );
});

test("T003: the negative case — the check reports a divergence and does not pass it", async () => {
  const check = await import(join(PACKAGE_ROOT, "src/lint/codes-check.ts"));
  const contractFile = join(PACKAGE_ROOT, "data/finding-codes.json");
  const original = JSON.parse(readFileSync(contractFile, "utf8")) as {
    schema: string;
    owner: string;
    codes: { code: string; severity: string; levels: string }[];
  };
  const scratch = mkdtempSync(join(tmpdir(), "ct-140-t003-"));

  /** Writes a mutated contract and returns the differences the check reports. */
  const against = (mutate: (c: typeof original) => void, name: string): readonly string[] => {
    const copy = JSON.parse(JSON.stringify(original)) as typeof original;
    mutate(copy);
    const file = join(scratch, `${name}.json`);
    writeFileSync(file, JSON.stringify(copy, null, 1));
    return check.differencesFromTheContract({ contractFile: file });
  };

  // A code removed from the contract — src/codes.ts holds one too many.
  const removed = against((c) => void c.codes.splice(5, 1), "removed");
  assert.ok(removed.length > 0, "a removed code is a difference");
  assert.ok(
    removed.some((d) => /not in the contract/.test(d)),
    `the difference names the extra code: ${removed.join("; ")}`,
  );

  // A code added to the contract — src/codes.ts is missing it.
  const added = against(
    (c) => void c.codes.push({ code: "invented.code", severity: "error", levels: "1" }),
    "added",
  );
  assert.ok(
    added.some((d) => /missing from src\/codes\.ts/.test(d) && /invented\.code/.test(d)),
    `the difference names the missing code: ${added.join("; ")}`,
  );

  // A severity flipped.
  const severity = against(
    (c) => void ((c.codes[0] as { severity: string }).severity = "warning"),
    "severity",
  );
  assert.ok(
    severity.some((d) => /^severity of /.test(d)),
    `the difference names the severity: ${severity.join("; ")}`,
  );

  // A level list changed.
  const levels = against((c) => void ((c.codes[3] as { levels: string }).levels = "all"), "levels");
  assert.ok(
    levels.some((d) => /^levels of /.test(d)),
    `the difference names the levels: ${levels.join("; ")}`,
  );

  // The rows reordered — the order is part of the contract.
  const reordered = against((c) => {
    const first = c.codes[0] as { code: string };
    c.codes[0] = c.codes[1] as { code: string; severity: string; levels: string };
    c.codes[1] = first as { code: string; severity: string; levels: string };
  }, "reordered");
  assert.ok(
    reordered.some((d) => /^order: /.test(d)),
    `the difference names the order: ${reordered.join("; ")}`,
  );

  // The schema id changed.
  const schema = against((c) => void (c.schema = "specstride.something-else/1"), "schema");
  assert.ok(
    schema.some((d) => /^schema: /.test(d)),
    `the difference names the schema: ${schema.join("; ")}`,
  );

  // And the throwing form really throws, carrying the differences.
  const file = join(scratch, "removed.json");
  assert.throws(
    () => check.checkCodesEqualTheContract({ contractFile: file }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.name, "FindingCodesDivergeFromTheContractError");
      assert.ok(
        ((error as unknown as { differences?: readonly string[] }).differences ?? []).length > 0,
      );
      return true;
    },
    "a divergence is an error, never a pass",
  );
});

test("T003: the check is in the build — the package script and the root pipeline", () => {
  const manifest = JSON.parse(readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  };
  assert.equal(manifest.scripts["check:codes"], "node src/lint/codes-check.ts");
  const root = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  };
  // The root fans the script over the workspace, and `npm run test` — the
  // command the gate executes — runs it.
  assert.equal(root.scripts["check:codes"], "npm run check:codes --workspaces --if-present");
  assert.match(root.scripts["test"] as string, /npm run check:codes/, "the build runs the check");
  // The file the script names really is there and really loads.
  assert.equal(statSync(join(PACKAGE_ROOT, "src/lint/codes-check.ts")).isFile(), true);
});

test("T003: the check as a program exits 0 on the state of the repository", () => {
  // The exit code of the program is the build's signal, so it is read here and
  // not inferred from the function that computes the differences.
  const script = join(PACKAGE_ROOT, "src/lint/codes-check.ts");
  const result = spawnSync(process.execPath, [script], { encoding: "utf8" });
  assert.equal(result.status, 0, `exit 0; stderr: ${result.stderr}`);
  assert.match(result.stdout, /src\/codes\.ts equals data\/finding-codes\.json/);
  assert.match(result.stdout, /38 codes/);
});
