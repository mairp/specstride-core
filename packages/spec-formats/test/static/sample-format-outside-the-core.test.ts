/**
 * T041 — the STATIC test of F104-SC-006:
 *
 *   "A format from the test tree is added with 0 changed core files: it is
 *    detected, parsed, validated, ticked and run in the conformance suite, and
 *    NO CORE FILE NAMES IT."
 *
 * The conformance half — detected, parsed, validated, ticked, run — is CT-104-4
 * of T040 (`packages/testkit/src/conformance/EP-03/behaviour.test.ts`). This
 * file is the other half, the one a static check answers: no file of a core
 * package of the package graph names the sample format, its module, its sample
 * tree or the package that owns the grammar; and the whole of feature 104, the
 * added format included, changed 0 files of a core package.
 *
 * A core package is a package the graph marks `core: true`
 * (`packages/contracts/data/package-graph.json`, annex A §A.3): the engine
 * (`@specstride/core`) and the two loop layers. That is the same subject
 * feature 100's second core rule takes (F100-FR-012, F100-FR-018); the rule is
 * reimplemented here rather than imported, so that this feature's package is
 * the only thing its own test tree depends on.
 *
 * The test is falsifiable in BOTH directions, and says so by measuring it: the
 * detector finds every name where the name really is (in the test tree, the
 * positive control), and a synthetic core file that names the sample is
 * reported with its line (the negative control). Without those two a result of
 * "0 namings" could just as well mean "the detector reads nothing".
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

/** The root of the repository: five levels up from `test/static/`. */
const ROOT = resolve(dirname(dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))))));

/** The package graph, which marks the core packages (annex A §A.3). */
const GRAPH = "packages/contracts/data/package-graph.json";

/* ------------------------------------------------------------------ *
 * What a core file may not name.
 * ------------------------------------------------------------------ */

/** The module T041 adds: the sample format, in the test tree. */
export const SAMPLE_MODULE = "packages/testkit/src/samples/EP-03/sample-format.ts";

/** The behaviour cases T040 adds, in the same test tree. */
export const BEHAVIOUR_SUITE = "packages/testkit/src/conformance/EP-03/behaviour.test.ts";

/** The one tree a sample of the test kit lives in (F100-FR-018). */
export const SAMPLE_TREE = "packages/testkit/src/samples";

/** The name of the sample format itself. */
export const SAMPLE_FORMAT_NAME = "sample-format";

/** The id the conformance report names the sample's implementation by. */
export const SAMPLE_IMPLEMENTATION_ID = "sample-spec-format-with-a-grammar";

/** The package that owns the grammar: no core package may name it either. */
export const GRAMMAR_OWNER_PACKAGE = "@specstride/spec-formats";

/**
 * Every name a core file would have to carry if the added format reached the
 * core. A core file that holds ANY of them fails F104-SC-006.
 */
export const FORBIDDEN_NAMES: readonly string[] = Object.freeze([
  SAMPLE_MODULE,
  BEHAVIOUR_SUITE,
  SAMPLE_TREE,
  "samples/EP-03",
  SAMPLE_FORMAT_NAME,
  SAMPLE_IMPLEMENTATION_ID,
  GRAMMAR_OWNER_PACKAGE,
]);

/** This file, which names every forbidden name because that is its subject. */
export const THIS_FILE = relative(ROOT, fileURLToPath(import.meta.url))
  .split(sep)
  .join("/");

/**
 * Where each forbidden name legitimately lives: this file, the two files of
 * this phase, and the registration of the samples of the test tree, which is
 * the one module that holds the sample tree's path (F100-FR-018). Together they
 * hold every name of `FORBIDDEN_NAMES`, which is what makes the scan's "0 in
 * the core" a measurement rather than a detector that reads nothing.
 */
export const WITNESSES: readonly string[] = Object.freeze([
  THIS_FILE,
  SAMPLE_MODULE,
  BEHAVIOUR_SUITE,
  "packages/testkit/src/conformance/register-samples.ts",
]);

/* ------------------------------------------------------------------ *
 * The scan.
 * ------------------------------------------------------------------ */

type Graph = { packages: { name: string; core?: boolean }[] };

/** The core packages of the graph, by package name. */
export function corePackages(root: string = ROOT): readonly string[] {
  const graph = JSON.parse(readFileSync(join(root, GRAPH), "utf8")) as Graph;
  return Object.freeze(graph.packages.filter((one) => one.core === true).map((one) => one.name));
}

/** The directory of a package of the graph, relative to the root. */
export function directoryOf(name: string): string {
  return `packages/${name.replace(/^@specstride\//, "")}`;
}

/** Every file of a directory, `node_modules` apart, relative to the root. */
export function filesUnder(directory: string, root: string = ROOT): readonly string[] {
  const found: string[] = [];
  const walk = (at: string): void => {
    let entries;
    try {
      entries = readdirSync(at, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === "node_modules") continue;
      const path = join(at, entry.name);
      if (entry.isDirectory()) walk(path);
      else found.push(relative(root, path).split(sep).join("/"));
    }
  };
  walk(join(root, directory));
  return Object.freeze(found.sort());
}

/** One naming of a forbidden name, with the file, the line and the name. */
export type Naming = { readonly file: string; readonly line: number; readonly name: string };

/** Every forbidden name a text holds, with its 1-based line. */
export function namingsIn(file: string, text: string): readonly Naming[] {
  const found: Naming[] = [];
  text.split("\n").forEach((line, index) => {
    for (const name of FORBIDDEN_NAMES) {
      if (line.includes(name)) found.push({ file, line: index + 1, name });
    }
  });
  return Object.freeze(found);
}

/** Every forbidden name every file of the core packages holds. */
export function namingsInTheCore(root: string = ROOT): readonly Naming[] {
  const found: Naming[] = [];
  for (const name of corePackages(root)) {
    for (const file of filesUnder(directoryOf(name), root)) {
      found.push(...namingsIn(file, readFileSync(join(root, file), "utf8")));
    }
  }
  return Object.freeze(found);
}

/* ------------------------------------------------------------------ *
 * The tests.
 * ------------------------------------------------------------------ */

test("F104-SC-006: the scan reaches every core package and reads real files", () => {
  const core = corePackages();
  // The graph marks three packages `core: true`: the engine and the two loop
  // layers. A graph that marked none would make every other test here vacuous.
  assert.ok(core.length >= 3, `${core.length} core packages: ${JSON.stringify(core)}`);
  assert.ok(core.includes("@specstride/core"), JSON.stringify(core));
  for (const name of core) {
    const directory = directoryOf(name);
    assert.ok(existsSync(join(ROOT, directory)), `${directory} exists`);
    const files = filesUnder(directory);
    assert.ok(files.length > 0, `${directory} holds ${files.length} files`);
    assert.ok(
      files.some((file) => file.endsWith(".ts")),
      `${directory} holds TypeScript sources`,
    );
  }
  // And the two files of this phase are where the tasks put them.
  assert.ok(statSync(join(ROOT, SAMPLE_MODULE)).isFile(), SAMPLE_MODULE);
  assert.ok(statSync(join(ROOT, BEHAVIOUR_SUITE)).isFile(), BEHAVIOUR_SUITE);
});

test("F104-SC-006: no core file names the sample format, its module, its tree or the grammar owner", () => {
  assert.deepEqual(
    namingsInTheCore().map((one) => `${one.file}:${one.line} names "${one.name}"`),
    [],
    "F104-SC-006: a file of a core package names the added format",
  );
});

test("F104-SC-006: the detector finds every forbidden name where the name really is", () => {
  // The POSITIVE control. Each forbidden name is findable, in the file that
  // legitimately holds it, so "0 namings in the core" is a measurement and not
  // a detector that reads nothing. Every witness is in a TEST tree.
  const found = new Map<string, string>();
  for (const witness of WITNESSES) {
    const text = readFileSync(join(ROOT, witness), "utf8");
    for (const naming of namingsIn(witness, text)) {
      if (!found.has(naming.name)) found.set(naming.name, `${witness}:${naming.line}`);
    }
  }
  assert.deepEqual(
    FORBIDDEN_NAMES.filter((name) => !found.has(name)),
    [],
    `every forbidden name is findable: ${JSON.stringify([...found])}`,
  );
  // And none of the witnesses is inside a core package: the names live in the
  // test tree, which is the whole point of F104-SC-006.
  for (const witness of WITNESSES) {
    for (const name of corePackages()) {
      assert.equal(witness.startsWith(`${directoryOf(name)}/`), false, `${witness} vs ${name}`);
    }
  }
});

test("F104-SC-006: a core file that DOES name the sample is reported, with its line", () => {
  // The NEGATIVE control, on synthetic content: nothing is written to the
  // working tree, and the rule is the same function the scan above runs.
  const pretend = [
    "// a core file that reaches for the test tree",
    `import { grammar } from "../../${SAMPLE_MODULE}";`,
    "",
    `export const FORMAT = "${SAMPLE_FORMAT_NAME}";`,
  ].join("\n");
  const reported = namingsIn("packages/core/src/pretend.ts", pretend);
  assert.deepEqual(
    reported.map((one) => [one.line, one.name]),
    [
      [2, SAMPLE_MODULE],
      [2, SAMPLE_TREE],
      [2, "samples/EP-03"],
      [2, SAMPLE_FORMAT_NAME],
      [4, SAMPLE_FORMAT_NAME],
    ],
  );
  // And a core file that names NEITHER is clean, so the rule is not "every
  // file fails".
  assert.deepEqual(
    [...namingsIn("packages/core/src/plain.ts", 'export const A = "a phase of a run";\n')],
    [],
  );
});

test("F104-SC-006: the whole SCAN is falsifiable, measured on a scratch workspace", () => {
  // The scan itself — graph, walk and rule together — is run over a workspace
  // built for the purpose under the temporary directory of the platform, so the
  // falsification touches NO file of this repository. One core package, one
  // file; once naming the sample and once not.
  const scratch = mkdtempSync(join(tmpdir(), "specstride-sc006-"));
  try {
    const graph = {
      packages: [{ name: "@specstride/core", core: true }, { name: "@specstride/testkit" }],
    };
    mkdirSync(join(scratch, "packages/contracts/data"), { recursive: true });
    writeFileSync(join(scratch, GRAPH), JSON.stringify(graph));
    mkdirSync(join(scratch, "packages/core/src"), { recursive: true });
    const file = join(scratch, "packages/core/src/reaches-for-the-test-tree.ts");

    // Clean first: the scan finds nothing, so a later finding is the naming.
    writeFileSync(file, 'export const A = "a phase of a run";\n');
    assert.deepEqual([...namingsInTheCore(scratch)], []);
    assert.deepEqual([...corePackages(scratch)], ["@specstride/core"]);

    // Then the breach: the same scan reports it, with the file and the line.
    writeFileSync(file, `const x = 1;\nimport "${GRAMMAR_OWNER_PACKAGE}";\n`);
    assert.deepEqual(
      namingsInTheCore(scratch).map((one) => [one.file, one.line, one.name]),
      [["packages/core/src/reaches-for-the-test-tree.ts", 2, GRAMMAR_OWNER_PACKAGE]],
    );
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

/**
 * The change-set measurement belongs to feature 104's own branch. Once 104 reached the
 * main line, the change set of any later branch is that feature's work, and features
 * that own a core package (101 creates `packages/core/src/gate/` and its siblings) must
 * change it. Tests 101-105 above carry F104-SC-006 on every branch; this one runs where
 * "the branch" means feature 104 (2026-10-02, 101 blocked on it for a day).
 */
const BRANCH = (() => {
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
})();
const ON_FEATURE_104 = /(^|\/)104-spec-input$/.test(BRANCH);

test(
  "F104-SC-006: the whole of feature 104 changed 0 files of a core package",
  {
    skip: ON_FEATURE_104
      ? false
      : `the change set of ${BRANCH || "this checkout"} is not feature 104's`,
  },
  () => {
    // The direct measurement of "0 changed core files": every file this branch
    // touches since it left the main line, and every file changed in the working
    // tree on top of it. None of them is inside a core package.
    const git = (...argv: readonly string[]): readonly string[] =>
      execFileSync("git", [...argv], { cwd: ROOT, encoding: "utf8" })
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "");

    const base = git("merge-base", "main", "HEAD")[0];
    assert.ok(base !== undefined && /^[0-9a-f]{40}$/.test(base), `the merge base is ${base}`);
    const committed = git("diff", "--name-only", base, "--");
    const working = git("status", "--porcelain").map(
      (line) => line.slice(3).split(" -> ").pop() ?? "",
    );
    const touched = [...new Set([...committed, ...working])].filter((path) => path !== "");

    // Not vacuous: the branch HAS changed files, and the two files of this phase
    // are among the ones it touched.
    assert.ok(touched.length > 0, "the branch changed files");
    for (const file of [SAMPLE_MODULE, BEHAVIOUR_SUITE]) {
      assert.ok(
        touched.includes(file) || git("log", "--oneline", "-1", "--", file).length > 0,
        `${file} is accounted for`,
      );
    }

    const directories = corePackages().map((name) => `${directoryOf(name)}/`);
    assert.deepEqual(
      touched.filter((path) => directories.some((directory) => path.startsWith(directory))),
      [],
      `F104-SC-006: a file of a core package was changed (core: ${JSON.stringify(directories)})`,
    );
  },
);
