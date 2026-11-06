/**
 * T082 of feature 127 — the removal witness: remove the sample and show that
 * 0 core files differ (F127-SC-011; F100-FR-012, F100-FR-018).
 *
 * The claim of F127-SC-011 is that the conformance suite of EP-12 passes with
 * a sample classifier outside the core "with 0 core files changed". The suite
 * run is `./sample-127.test.ts`. This file proves the second half, by doing
 * the removal rather than asserting it:
 *
 *  1. the core packages of `packages/contracts/data/package-graph.json` (the
 *     packages marked `core: true`) are copied to a tree of their own, and
 *     every copied file is shown to be BYTE-IDENTICAL to the live one, so the
 *     tree the removal happens in is the real core and not a stand-in;
 *  2. a manifest of the content hash of every core file is written to the
 *     medium and read back;
 *  3. the three files of the sample are REMOVED from that tree with `rm`;
 *  4. the core is walked again, a second manifest is written and read back,
 *     and the two manifests are compared: 0 core files differ, and the file
 *     set is the same one.
 *
 * It also shows what makes that outcome structural rather than lucky: no file
 * of a core package names the sample tree, and no file anywhere outside
 * `packages/testkit/` names this sample at all.
 *
 * The removal is done in the copied tree and never in the working tree, so a
 * test running beside this one cannot see a half-removed sample.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { atomicWriteJson } from "@specstride/kernel/atomic-write";
import { contentHash } from "@specstride/kernel/hasher";
import { coreFilesNamingASample, corePackages, SAMPLE_PATHS } from "../register-samples.ts";
import { ROOT } from "../frame.ts";

/** The graph the core packages are read from. */
const GRAPH = "packages/contracts/data/package-graph.json";

/** The three files of the sample of T082, relative to the repository root. */
const SAMPLE_FILES = Object.freeze([
  "packages/testkit/src/samples/EP-12/sample-127.ts",
  "packages/testkit/src/samples/EP-12/fake-harness.descriptor.json",
  "packages/testkit/src/samples/EP-12/sample-127-rules.json",
]);

/** The sample of feature 100, which this removal must leave alone. */
const SAMPLE_OF_100 = "packages/testkit/src/samples/EP-12/index.ts";

/** Every source file under a directory, relative to a root, sorted. */
function filesUnder(root: string, directory: string): readonly string[] {
  const out: string[] = [];
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
      else out.push(relative(root, path));
    }
  };
  walk(join(root, directory));
  return Object.freeze(out.sort());
}

/** The directory of a package of the graph, relative to the root. */
function directoryOf(pkg: string): string {
  return `packages/${pkg.replace(/^@specstride\//, "")}`;
}

/** The content hash of every file of the list, by path. */
function manifestOf(root: string, files: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const file of files) out[file] = contentHash(readFileSync(join(root, file)));
  return out;
}

/* ------------------------------------------------------------------ *
 * The tree the removal happens in.
 * ------------------------------------------------------------------ */

const CORE = corePackages();
const coreSourceDirectories = CORE.map((pkg) => `${directoryOf(pkg)}/src`);

const tree = mkdtempSync(join(tmpdir(), "specstride-127-removal-"));
for (const file of [GRAPH, ...SAMPLE_FILES, SAMPLE_OF_100]) {
  mkdirSync(join(tree, dirname(file)), { recursive: true });
  cpSync(join(ROOT, file), join(tree, file));
}
for (const directory of coreSourceDirectories) {
  mkdirSync(join(tree, directory), { recursive: true });
  cpSync(join(ROOT, directory), join(tree, directory), { recursive: true });
}

/** The core files of the copied tree, before the removal. */
const coreFilesBefore = coreSourceDirectories.flatMap((d) => filesUnder(tree, d));

/** The two manifests, each written to the medium and read back from it. */
const beforePath = join(tree, "core-before.manifest.json");
atomicWriteJson(beforePath, manifestOf(tree, coreFilesBefore));

/* The removal itself. */
for (const file of SAMPLE_FILES) rmSync(join(tree, file));

const coreFilesAfter = coreSourceDirectories.flatMap((d) => filesUnder(tree, d));
const afterPath = join(tree, "core-after.manifest.json");
atomicWriteJson(afterPath, manifestOf(tree, coreFilesAfter));

const before = JSON.parse(readFileSync(beforePath, "utf8")) as Record<string, string>;
const after = JSON.parse(readFileSync(afterPath, "utf8")) as Record<string, string>;

/* ------------------------------------------------------------------ *
 * The cases.
 * ------------------------------------------------------------------ */

test("T082: the tree the removal happens in holds the real core, byte for byte", () => {
  assert.ok(CORE.length > 0, "the graph marks at least one package `core: true`");
  assert.ok(
    coreFilesBefore.length > 0,
    `the core packages ${CORE.join(", ")} hold at least one source file`,
  );
  for (const file of coreFilesBefore) {
    assert.equal(
      contentHash(readFileSync(join(tree, file))),
      contentHash(readFileSync(join(ROOT, file))),
      `${file} of the copied tree is byte-identical to the live one`,
    );
  }
});

test("T082: the sample was really removed, and the sample of feature 100 was left alone", () => {
  for (const file of SAMPLE_FILES) {
    assert.ok(existsSync(join(ROOT, file)), `${file} is in the working tree`);
    assert.equal(existsSync(join(tree, file)), false, `${file} was removed from the copied tree`);
  }
  assert.ok(
    existsSync(join(tree, SAMPLE_OF_100)),
    "the removal left the sample of feature 100 in place",
  );
});

test("T082: 0 core files differ after the removal (F127-SC-011)", () => {
  // Read off the medium, from the two manifests, not from the objects above.
  const differ = Object.keys(before).filter((file) => before[file] !== after[file]);
  assert.deepEqual(differ, [], "0 core files differ");

  const gone = Object.keys(before).filter((file) => after[file] === undefined);
  const added = Object.keys(after).filter((file) => before[file] === undefined);
  assert.deepEqual(gone, [], "no core file disappeared");
  assert.deepEqual(added, [], "no core file appeared");

  assert.equal(Object.keys(after).length, Object.keys(before).length);
  assert.equal(Object.keys(before).length, coreFilesBefore.length);
  // The two manifests are the same document, so their content hashes agree.
  assert.equal(
    contentHash(readFileSync(beforePath)),
    contentHash(readFileSync(afterPath)),
    "the manifest of the core is unchanged by the removal",
  );
  for (const hash of Object.values(after)) assert.match(hash, /^[0-9a-f]{64}$/);
});

test("T082: no core file names the sample tree, before or after the removal", () => {
  assert.deepEqual(
    coreFilesNamingASample(ROOT).map((one) => `${one.file}:${one.line} ${one.name}`),
    [],
    "no core file of the working tree names the sample tree",
  );
  assert.deepEqual(
    coreFilesNamingASample(tree).map((one) => `${one.file}:${one.line} ${one.name}`),
    [],
    "and none of the copied tree does either, with the sample gone",
  );
  assert.deepEqual([...SAMPLE_PATHS], ["packages/testkit/src/samples/"]);
});

test("T082: only a test tree names this sample, and no core package does", () => {
  // The names a reader would have to use to reach the sample. Every file that
  // uses one must be in a test tree: the test kit itself, or the test
  // directory of a package, or `tests/`. A file of a core package naming one
  // would make the removal a change of that file.
  const names = ["sample-127", "fake-harness.descriptor", "sample-descriptor-quota-classifier"];
  const searched = [
    ...readdirSync(join(ROOT, "packages")).map((name) => `packages/${name}`),
    "tools",
    "tests",
  ];
  const coreDirectories = CORE.map((pkg) => `${directoryOf(pkg)}/`);
  const inATestTree = (file: string): boolean =>
    file.startsWith("packages/testkit/") ||
    file.startsWith("tests/") ||
    file.includes("/test/") ||
    file.includes("/tests/");

  const naming: string[] = [];
  const outsideATestTree: string[] = [];
  const inTheCore: string[] = [];
  for (const directory of searched) {
    for (const file of filesUnder(ROOT, directory)) {
      if (!/\.(ts|mts|cts|js|mjs|cjs|json|md)$/.test(file)) continue;
      let content: string;
      try {
        content = readFileSync(join(ROOT, file), "utf8");
      } catch {
        continue;
      }
      if (!names.some((name) => content.includes(name))) continue;
      naming.push(file);
      if (!inATestTree(file)) outsideATestTree.push(file);
      if (coreDirectories.some((at) => file.startsWith(at))) inTheCore.push(file);
    }
  }
  assert.ok(naming.length > 0, "the sample is named somewhere, so the search works");
  assert.deepEqual(outsideATestTree, [], "every file that names the sample is in a test tree");
  assert.deepEqual(inTheCore, [], "no file of a core package names the sample");
});
