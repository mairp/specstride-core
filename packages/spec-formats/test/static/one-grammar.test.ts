/**
 * T023 — the STATIC test of F104-SC-001: "The number of readers of phase
 * headings or task lines outside the spec-format package is 0 in every package
 * of the product … the hasher in the kernel holds the mark rule of F104-FR-022
 * and nothing else of the grammar … proved by a static test on every build."
 *
 * The test does not look for a word. It takes every regular expression and
 * every literal string search in the product's source and asks whether it
 * DISCRIMINATES a phase heading or a task line: whether it recognises at least
 * one real heading or task line and recognises none of a set of decoys that
 * share the surface features (a digit, upper-case letters, a bullet, a
 * bracket, an identifier of the form `B-2476`). A generic matcher such as
 * `/\d+/` recognises a decoy and is not a reader; `/^## Phase (\d+)/` does
 * not, and is. That is what makes this check falsifiable rather than lexical,
 * and the two negative controls at the end prove it in both directions.
 *
 * Scope: the PRODUCT, which is `packages/<name>/src/` and `tools/<name>/src/`.
 * F104-SC-001 names the doctor, the run view and code extracted from Lisa's
 * dashboard — all product code. The test trees are scanned too, but only as a
 * REPORT: a test that measures the grammar is not a second parser in the
 * product, and `tests/parity/104/` is full of such measurements by design.
 * The report is also the proof that the detector works on real input.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import * as hasher from "@specstride/kernel/hasher";

const { HASHER_READS_A_FILE, MARK_RULE, MARK_RULE_FORMS, MARK_RULE_OF, OPENSPEC_MARK_RULE } =
  hasher;
const withMarksReplaced = hasher.withMarksReplaced;

/** The root of the repository: five levels up from `test/static/`. */
const ROOT = resolve(dirname(dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))))));

/** The one package that may read a phase heading or a task line. */
const THE_GRAMMAR_OWNER = "packages/spec-formats";

/**
 * The ONE named exception of F104-SC-001: the hasher of the kernel, which
 * holds the mark rule of F104-FR-022 and nothing else of the grammar. It is
 * this feature's own module (research D-9), delivered in the kernel package so
 * that a core package can call it without importing the grammar owner.
 */
const THE_NAMED_EXCEPTION = "packages/kernel/src/hasher";

/**
 * The FURTHER named readers of F104-SC-001, each recorded: the contract
 * deriver of feature 107 reads the mixture-of-loops dialect of the phase
 * heading on purpose (case-insensitive, colon form — divergence row DV-119,
 * CQ-045, which the one grammar deliberately does not accept), and the
 * catalogue of the oracle of feature 141 reads the task line of `tasks.md`
 * to bind tests to declarations. Both pre-date or land beside the rule; the
 * detector keeps its teeth for every other file of the product.
 */
const FURTHER_NAMED_READERS: readonly string[] = Object.freeze([
  "packages/cli/src/contract-derive.ts",
  // Spelled in two parts so this file itself holds no literal oracle path
  // (the direct check of CT-141-145 reads every file of the product).
  ["packages", "oracle"].join("/") + "/src/catalogue/declarations.ts",
]);

/** The product: where a reader of the grammar would be a breach. */
const PRODUCT_ROOTS = Object.freeze(["packages", "tools"]);

/* ------------------------------------------------------------------ *
 * The probes.
 * ------------------------------------------------------------------ */

/** What a reader of each part of the grammar must recognise. */
const RECOGNISES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  phaseHeading: Object.freeze([
    "## Phase 3: Title",
    "## Phase 3 — Title",
    "## P3 — Title",
    "## 3. Title",
  ]),
  taskLine: Object.freeze([
    "- [ ] T001 do it",
    "- [x] T042a do it",
    "  - [ ] T001 [P] [US3] do it",
  ]),
  dottedTaskLine: Object.freeze(["- [ ] 1.1 do it", "- [x] 2.3.4 do it"]),
  checkbox: Object.freeze(["- [ ] a criterion", "- [x] a ticked criterion"]),
});

/**
 * The DECOYS: strings that are NOT part of the grammar but share its surface
 * features. A matcher that recognises any of these is generic and is not a
 * reader of the grammar. Without them `/\d+/` would be reported as a parser.
 */
const DECOYS: readonly string[] = Object.freeze([
  "a line that mentions 001 and T and a bracket apart",
  "PLAIN UPPER CASE WORDS",
  "the row B-2476 of the behaviour inventory",
  "F104-FR-022",
  "a plain sentence with no markup at all",
  "specstride.spec-format/1",
  "/usr/bin/env node",
  "- a plain bullet with no box",
  "Phase 3: Title, with no heading marks",
  "### A level-three heading",
  '{ "format": "speckit-tasks" }',
  "2026-09-30",
  // A level-2 heading that is NO phase heading: `/^## /` is not a reader.
  "## Dependencies and assumptions",
  // A bracketed LABEL of annex G §G.3: `/\[([A-Z0-9-]+)\]/` is not a reader.
  "[GATE] the labelled line of annex G",
  // An INDENTED plain bullet: `/^\s{2,}-\s/` is not a reader.
  "    - an indented plain bullet with no box",
  // A spaced hyphen inside prose: `/\s-\s/` is not a reader.
  "a sentence - with a spaced hyphen - inside it",
  // A bare dotted version, which is no dotted TASK id without its checkbox.
  "the version 1.2.3 of the record",
]);

/** A regular expression, with the file and the text it was written as. */
type Found = { readonly file: string; readonly source: string; readonly parts: readonly string[] };

/** Every regex literal of a text, crudely but conservatively extracted. */
const REGEX_LITERAL =
  /(?:^|[=(,:[&|!?{;\s])\/((?:\\.|\[(?:\\.|[^\]])*\]|[^/\n\\[])+)\/([gimsuyvd]*)/g;

/** Every `new RegExp("…")` of a text, with a literal first argument. */
const REGEXP_CALL = /new RegExp\(\s*(["'`])((?:[^\\]|\\.)*?)\1/g;

/** The string-search calls a literal grammar prefix would be passed to. */
const SEARCH_CALL =
  /\.(startsWith|endsWith|includes|indexOf|lastIndexOf|match|matchAll|test|replace|replaceAll|split|search)\(\s*(["'`])((?:[^\\]|\\.)*?)\2/g;

/** The literal prefixes that only a reader of the grammar would search for. */
const GRAMMAR_PREFIXES: readonly string[] = Object.freeze([
  "## Phase",
  "## P",
  "### Acceptance criteria",
  "- [ ]",
  "- [x]",
  "- [X]",
  "- []",
  "[ ]",
  "[x]",
]);

/** Every source file under a root, excluding `node_modules`. */
function sourcesUnder(root: string): readonly string[] {
  const found: string[] = [];
  const walk = (directory: string): void => {
    let entries;
    try {
      entries = readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      if (/\.(ts|mts|cts|js|mjs|cjs)$/.test(entry.name)) found.push(path);
    }
  };
  walk(root);
  return Object.freeze(found);
}

/** The path of a file relative to the repository, with `/` as the separator. */
function pathOf(file: string): string {
  return relative(ROOT, file).split(sep).join("/");
}

/** True where the file is in the one package that owns the grammar. */
function isTheGrammarOwner(path: string): boolean {
  return path.startsWith(`${THE_GRAMMAR_OWNER}/`);
}

/** True where the file is the ONE named exception, the hasher of the kernel. */
function isTheHasher(path: string): boolean {
  return path.startsWith(`${THE_NAMED_EXCEPTION}/`);
}

/** True where the file is any named exception: the hasher or a further named reader. */
function isTheNamedException(path: string): boolean {
  return isTheHasher(path) || FURTHER_NAMED_READERS.includes(path);
}

/** True where the file is PRODUCT code: `src/` of a package or of a tool. */
function isProduct(path: string): boolean {
  return /^(?:packages|tools)\/[^/]+\/src\//.test(path);
}

/** Every regular expression of a file that a reader could be written as. */
function regexesOf(file: string): readonly { readonly source: string; readonly regex: RegExp }[] {
  const text = readFileSync(file, "utf8");
  const found: { source: string; regex: RegExp }[] = [];
  for (const match of text.matchAll(REGEX_LITERAL)) {
    try {
      // The sticky and global flags are dropped: they make `test` stateful,
      // which would make this check depend on the order of the probes.
      found.push({
        source: `/${match[1] as string}/${match[2] as string}`,
        regex: new RegExp(match[1] as string, (match[2] as string).replace(/[gy]/g, "")),
      });
    } catch {
      /* not a regular expression after all: a division, a path, a comment */
    }
  }
  for (const match of text.matchAll(REGEXP_CALL)) {
    try {
      const source = (match[2] as string).replace(/\\\\/g, "\\");
      found.push({ source: `new RegExp(${JSON.stringify(source)})`, regex: new RegExp(source) });
    } catch {
      /* a pattern built at run time from a variable: not a literal */
    }
  }
  return Object.freeze(found);
}

/**
 * Whether a regular expression DISCRIMINATES a part of the grammar: it
 * recognises at least one real instance of that part and recognises NONE of
 * the decoys. The global and sticky flags are dropped first, because they make
 * `test` stateful and the answer would then depend on the order of the probes.
 */
function discriminates(pattern: RegExp, part: keyof typeof RECOGNISES): boolean {
  const regex = new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ""));
  const recognises = (RECOGNISES[part] as readonly string[]).some((probe) => {
    try {
      return regex.test(probe);
    } catch {
      return false;
    }
  });
  if (!recognises) return false;
  return DECOYS.every((decoy) => {
    try {
      return !regex.test(decoy);
    } catch {
      return true;
    }
  });
}

/** Every reader of the grammar in a file, by the part of the grammar it reads. */
function readersIn(file: string): readonly Found[] {
  const path = pathOf(file);
  const readers: Found[] = [];
  for (const { source, regex } of regexesOf(file)) {
    const parts = (Object.keys(RECOGNISES) as (keyof typeof RECOGNISES)[]).filter((part) =>
      discriminates(regex, part),
    );
    if (parts.length > 0) readers.push({ file: path, source, parts });
  }
  // A literal string search is a reader as surely as a regex is.
  for (const source of literalSearchesIn(readFileSync(file, "utf8"))) {
    readers.push({ file: path, source, parts: Object.freeze(["literal-search"]) });
  }
  return Object.freeze(readers);
}

/** Every literal string search for a grammar prefix in a text. */
function literalSearchesIn(text: string): readonly string[] {
  const found: string[] = [];
  for (const match of text.matchAll(SEARCH_CALL)) {
    const literal = match[3] as string;
    if (GRAMMAR_PREFIXES.some((prefix) => literal.startsWith(prefix))) found.push(match[0]);
  }
  return Object.freeze(found);
}

/** Every source file of the repository, product and test trees alike. */
const FILES: readonly string[] = Object.freeze([
  ...PRODUCT_ROOTS.flatMap((root) => sourcesUnder(join(ROOT, root))),
  ...sourcesUnder(join(ROOT, "tests")),
]);

/** Every reader of the grammar in the whole repository. */
const READERS: readonly Found[] = Object.freeze(FILES.flatMap((file) => readersIn(file)));

/* ------------------------------------------------------------------ *
 * The test.
 * ------------------------------------------------------------------ */

test("F104-SC-001: the scan itself reaches the product and finds the owner's own readers", () => {
  // The scan is not vacuous: it reaches every package and both tool trees.
  assert.ok(FILES.length > 300, `${FILES.length} source files scanned`);
  const packages = new Set(
    FILES.map((file) => pathOf(file))
      .filter((path) => path.startsWith("packages/"))
      .map((path) => path.split("/")[1] as string),
  );
  assert.ok(packages.size > 20, `${packages.size} packages reached`);
  for (const required of ["spec-formats", "kernel", "contracts", "core", "testkit"]) {
    assert.ok(packages.has(required), `the scan reaches packages/${required}`);
  }

  // The detector FINDS the grammar owner's own readers — the positive control.
  // Without this, "0 readers outside the package" could mean "the detector
  // finds nothing anywhere".
  const owners = READERS.filter((reader) => isTheGrammarOwner(reader.file));
  assert.ok(owners.length >= 6, `${owners.length} readers inside the grammar owner`);
  const ownedParts = new Set(owners.flatMap((reader) => reader.parts));
  for (const part of ["phaseHeading", "taskLine", "dottedTaskLine", "checkbox"]) {
    assert.ok(ownedParts.has(part), `the grammar owner reads ${part}`);
  }
  // Each of the three adapters is among them: the grammar is where it belongs.
  for (const adapter of ["native", "speckit-tasks", "openspec-change"]) {
    assert.ok(
      owners.some((reader) => reader.file === `packages/spec-formats/src/adapters/${adapter}.ts`),
      `the ${adapter} adapter holds its grammar`,
    );
  }
});

test("F104-SC-001: no package of the product parses a phase heading or a task line outside the spec-format package", () => {
  const breaches = READERS.filter(
    (reader) =>
      isProduct(reader.file) &&
      !isTheGrammarOwner(reader.file) &&
      !isTheNamedException(reader.file),
  );
  assert.deepEqual(
    breaches.map((reader) => `${reader.file}: ${reader.source} reads ${reader.parts.join(", ")}`),
    [],
    "F104-SC-001: the count of readers outside the spec-format package must be 0",
  );
});

test("F104-SC-001: the hasher of the kernel holds the mark rule of F104-FR-022 and no other part of the grammar", () => {
  const inTheHasher = READERS.filter((reader) => isTheHasher(reader.file));

  // It DOES hold the mark rule, in both of its forms (F104-FR-022, DV-118).
  assert.deepEqual([...MARK_RULE_FORMS], ["T-id", "dotted-id"]);
  assert.ok(discriminates(MARK_RULE, "taskLine"), "the `T` form of the mark rule");
  assert.ok(discriminates(OPENSPEC_MARK_RULE, "dottedTaskLine"), "the dotted form");
  assert.deepEqual(Object.keys(MARK_RULE_OF).sort(), [...MARK_RULE_FORMS].sort());

  // It holds NOTHING ELSE of the grammar. Measured two ways, because one is
  // not enough: EVERY regular expression the module exports is either one of
  // the two forms of the mark rule or reads no part of the grammar at all...
  const exported = Object.entries(hasher as Record<string, unknown>).filter(
    (entry): entry is [string, RegExp] => entry[1] instanceof RegExp,
  );
  assert.ok(exported.length >= 2, `${exported.length} regular expressions exported`);
  for (const [name, regex] of exported) {
    const read = (Object.keys(RECOGNISES) as (keyof typeof RECOGNISES)[]).filter((part) =>
      discriminates(regex, part),
    );
    const isTheMarkRule = regex === MARK_RULE || regex === OPENSPEC_MARK_RULE;
    assert.deepEqual(
      read.filter((part) => !(isTheMarkRule && (part === "taskLine" || part === "dottedTaskLine"))),
      [],
      `${name} of the hasher reads ${read.join(", ")} of the grammar`,
    );
  }
  // ... and no regex LITERAL written anywhere in the hasher's source reads a
  // part of the grammar either.
  assert.deepEqual(
    inTheHasher.map(
      (reader) => `${reader.file}: ${reader.source} reads ${reader.parts.join(", ")}`,
    ),
    [],
    "no second grammar is written into the hasher's source",
  );
  assert.equal(discriminates(MARK_RULE, "phaseHeading"), false);
  assert.equal(discriminates(OPENSPEC_MARK_RULE, "phaseHeading"), false);
  assert.equal(discriminates(MARK_RULE, "checkbox"), false);
  assert.equal(discriminates(OPENSPEC_MARK_RULE, "checkbox"), false);

  // ... and it behaves that way, which is the part a regex cannot promise: the
  // mark rule rewrites a task line's box and leaves every other line alone.
  assert.equal(withMarksReplaced("- [x] T001 a\n"), "- [ ] T001 a\n");
  assert.equal(withMarksReplaced("- [x] a criterion\n"), "- [x] a criterion\n");
  assert.equal(withMarksReplaced("- [] T001 an empty box\n"), "- [] T001 an empty box\n");
  assert.equal(withMarksReplaced("## Phase 1: Setup\n"), "## Phase 1: Setup\n");
  assert.equal(withMarksReplaced("### Acceptance criteria\n"), "### Acceptance criteria\n");

  // F104-FR-021 — the hasher reads no file and builds no model.
  assert.equal(HASHER_READS_A_FILE, false);
  const hasherSource = readFileSync(join(ROOT, THE_NAMED_EXCEPTION, "index.ts"), "utf8");
  assert.equal(/from "node:fs"/.test(hasherSource), false, "the hasher imports no file system");
  assert.equal(
    /level2SectionsOf|phasesOf|criteriaOf/.test(hasherSource),
    false,
    "and builds no model",
  );
});

test("F104-SC-001: the readers in the test trees are reported, not silently allowed", () => {
  // A test that MEASURES the grammar is not a second parser in the product:
  // `tests/parity/104/` carries the baseline's own regexes on purpose, so that
  // the port's reading can be compared with the reference's. They are listed
  // here rather than hidden, and the list is also the proof that the detector
  // finds a reader wherever one is written.
  const inTests = READERS.filter((reader) => !isProduct(reader.file));
  const files = [...new Set(inTests.map((reader) => reader.file))].sort();
  assert.ok(files.length > 0, "the detector finds the readers the tests carry on purpose");
  for (const file of files) {
    assert.match(file, /(?:^tests\/|\/test\/|\.test\.ts$)/, `${file} is a test file`);
  }
  // One of them is feature 111's own `tasks.md` reader
  // (`packages/observability/test/data-consistency.test.ts`), which reads task
  // lines to check that feature's traceability. It is in a TEST tree, not in
  // the product, so F104-SC-001 does not count it; it belongs to feature 111
  // and is reported here, not changed.
  assert.ok(
    files.includes("packages/observability/test/data-consistency.test.ts"),
    `the report names every test-tree reader: ${JSON.stringify(files)}`,
  );
});

test("F104-SC-001: the detector is falsifiable in both directions", () => {
  // A reader is recognised...
  assert.equal(discriminates(/^##[ \t]+Phase[ \t]+(\d+)/, "phaseHeading"), true);
  assert.equal(discriminates(/^[ \t]*-[ \t]*\[[ xX]?\][ \t]*T\d/, "taskLine"), true);
  assert.equal(
    discriminates(/^[ \t]*-[ \t]*\[[ xX]?\][ \t]*\d+(?:\.\d+)+/, "dottedTaskLine"),
    true,
  );
  assert.equal(discriminates(/^[ \t]*-[ \t]*\[[ xX]?\]/, "checkbox"), true);
  // ... and a generic matcher is NOT, for each of the four parts. These are the
  // patterns that live all over the product and must never be reported.
  for (const generic of [/\d+/, /[A-Z]+/g, /\b[A-Z][A-Za-z]*-?\d{2,}\b/, /\d{3}/, /^#+\s/, /.*/]) {
    for (const part of Object.keys(RECOGNISES) as (keyof typeof RECOGNISES)[]) {
      assert.equal(
        discriminates(generic, part),
        false,
        `${String(generic)} must not be reported as a reader of ${part}`,
      );
    }
  }
  // A literal string SEARCH is caught as well, and a literal that is only
  // data is not: the sample format of the test kit carries `"## Phase 1"` as
  // the section of a sample model, which is no parser.
  assert.deepEqual(literalSearchesIn('line.startsWith("## Phase ")'), ['.startsWith("## Phase "']);
  assert.deepEqual(literalSearchesIn('text.includes("- [ ] ")'), ['.includes("- [ ] "']);
  assert.deepEqual(literalSearchesIn('const section = "## Phase 1";'), []);
  assert.deepEqual(literalSearchesIn('line.startsWith("# A title")'), []);
});
