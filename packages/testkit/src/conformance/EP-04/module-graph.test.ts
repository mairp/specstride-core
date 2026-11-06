/**
 * T055 of feature 103 — STATIC TEST CT-103-128 (F103-FR-028).
 *
 * Two statements about the MODULE GRAPH, both proved over the real repository
 * and not over a fixture:
 *
 *  1. NO LAYER IMPORTS A WRITER OF THE PHASE GATE. The writers are
 *     `packages/core/src/gate/writers.ts` and
 *     `packages/core/src/approval/record.ts`. Three rule files of
 *     `tools/import-boundary/rules/` forbid them to the layer packages, to the
 *     router of a layer, and to every module group of this feature in the core
 *     and to the samples of EP-04 and EP-15. The test runs the import-boundary
 *     check over the workspace and asserts no violation — and then asserts the
 *     POSITIVE CONTROL: a file of a layer package that imported a writer WOULD
 *     be reported. A rule that cannot fire proves nothing.
 *  2. NO CORE FILE NAMES THE LAYER `micro` OR THE LAYER `parallel`. Every source
 *     file of every package marked `core: true` in the package graph is read and
 *     scanned by `namesALoopLayer` below.
 *
 * ## What "names the layer" means, exactly
 *
 * The identifiers are also ordinary words of the product's own vocabulary:
 * annex D §D.1 says "with parallel units on" of the view a layer reads, annex A
 * names the module-group directory `src/parallel/` of another feature, and
 * `parallelism` and `micro-loop` are English. A check that flagged every
 * occurrence of the letters would flag the annex's own wording and could only be
 * satisfied by writing worse comments.
 *
 * So `namesALoopLayer` reports the four forms in which a core file would really
 * KNOW a layer, each of which is a way for the core to depend on one:
 *
 *  - a string or template literal whose whole content is the identifier
 *    (`"micro"`, `'parallel'`) — a layer id in code;
 *  - a documentation literal in backticks (`` `micro` ``) — a layer id in prose;
 *  - the bare identifier adjacent to the word `layer` or `layers`, articles
 *    aside (`layer micro`, `the layer parallel`, `micro layer`);
 *  - a specifier or path of a layer package (`@specstride/layer-micro`,
 *    `packages/layer-parallel/...`).
 *
 * `NON_LAYER_SENSES` lists the senses this leaves alone, and the test checks
 * BOTH directions: every form above is reported, and every sense below is not.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WAVE_1_LAYERS } from "@specstride/contracts/ep/loop-layer";
import { loadRuleFiles, ruleFileViolations } from "@specstride/import-boundary/src/rule-files.ts";
import { run } from "@specstride/import-boundary/src/index.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
/** The root of the repository: five levels up from this folder. */
const ROOT = resolve(HERE, "..", "..", "..", "..", "..");
const GRAPH = join(ROOT, "packages/contracts/data/package-graph.json");
const RULES = join(ROOT, "tools/import-boundary/rules");

/** F103-FR-028 — the writers of the phase gate, which no layer may import. */
export const GATE_WRITERS = [
  "packages/core/src/gate/writers.ts",
  "packages/core/src/approval/record.ts",
] as const;

/** The two Wave 1 layer identifiers a core file may not name. */
export const LAYER_IDENTIFIERS = ["micro", "parallel"] as const;

/** The packages of the two layers, whose module graph rule 1 is about. */
export const LAYER_PACKAGES = ["packages/layer-micro", "packages/layer-parallel"] as const;

/** One naming of a layer by a core file. */
export type LayerNaming = {
  readonly line: number;
  readonly identifier: (typeof LAYER_IDENTIFIERS)[number];
  readonly form: "quoted literal" | "documentation literal" | "beside the word layer" | "package";
  readonly text: string;
};

/** Words that may stand between the identifier and the word `layer`. */
const ARTICLES = ["the", "a", "an", "built-in"];

/**
 * F103-FR-028 — every naming of the layer `micro` or the layer `parallel` in one
 * file's content, in the four forms of the head comment. The line is 1-based.
 */
export function namesALoopLayer(content: string): readonly LayerNaming[] {
  const found: LayerNaming[] = [];
  const lines = content.split("\n");
  for (const identifier of LAYER_IDENTIFIERS) {
    const quoted = new RegExp(`(["'])${identifier}\\1`);
    const documented = new RegExp("`" + identifier + "`");
    const pkg = new RegExp(`(@specstride/layer-|packages/layer-)${identifier}(?![\\w-])`);
    const bare = new RegExp(`(?<![\\w@/-])${identifier}(?![\\w-])`);
    lines.forEach((line, index) => {
      const at = index + 1;
      if (pkg.test(line)) {
        found.push({ line: at, identifier, form: "package", text: line.trim() });
        return;
      }
      if (quoted.test(line)) {
        found.push({ line: at, identifier, form: "quoted literal", text: line.trim() });
        return;
      }
      if (documented.test(line)) {
        found.push({ line: at, identifier, form: "documentation literal", text: line.trim() });
        return;
      }
      if (!bare.test(line)) return;
      // The bare identifier counts only beside the word `layer` or `layers`.
      const words = line
        .toLowerCase()
        .split(/[^\w-]+/)
        .filter((w) => w !== "");
      const where = words.indexOf(identifier);
      if (where < 0) return;
      const neighbours: string[] = [];
      for (let step = where - 1; step >= 0 && neighbours.length < 2; step -= 1) {
        const word = words[step] ?? "";
        if (ARTICLES.includes(word)) continue;
        neighbours.push(word);
        break;
      }
      for (let step = where + 1; step < words.length; step += 1) {
        const word = words[step] ?? "";
        if (ARTICLES.includes(word)) continue;
        neighbours.push(word);
        break;
      }
      if (neighbours.some((word) => word === "layer" || word === "layers")) {
        found.push({ line: at, identifier, form: "beside the word layer", text: line.trim() });
      }
    });
  }
  return Object.freeze(found.sort((left, right) => left.line - right.line));
}

/** The senses the check leaves alone, each of them the product's own wording. */
export const NON_LAYER_SENSES = [
  "with parallel units on",
  "the parallelism in force at the exit",
  "the count of the escalation of the micro-loop",
  "module groups of 142 and 143 under src/parallel/",
  "a microsecond of the clock",
] as const;

/** Every package of the graph marked `core: true`. */
function corePackageDirectories(): readonly string[] {
  const graph = JSON.parse(readFileSync(GRAPH, "utf8")) as {
    packages: { name: string; core?: boolean }[];
  };
  return Object.freeze(
    graph.packages
      .filter((entry) => entry.core === true)
      .map((entry) => join(ROOT, "packages", entry.name.replace("@specstride/", "")))
      .filter((dir) => {
        try {
          return statSync(dir).isDirectory();
        } catch {
          return false;
        }
      }),
  );
}

/** Every TypeScript source file under a directory. */
function sourceFilesUnder(dir: string): readonly string[] {
  const out: string[] = [];
  const walk = (at: string): void => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const full = join(at, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|mts|cts)$/.test(entry.name)) out.push(full);
    }
  };
  try {
    walk(dir);
  } catch {
    // A package of the graph with no source tree yet.
  }
  return Object.freeze(out.sort());
}

/* ------------------------------------------------------------------ *
 * 1. No layer imports a writer of the phase gate.
 * ------------------------------------------------------------------ */

test("CT-103-128 (F103-FR-028): the import-boundary check passes over the whole workspace, so no layer imports a writer of the phase gate", () => {
  const report = run(ROOT, GRAPH, RULES);
  assert.deepEqual(
    report.violations.map((v) => `${v.file}:${String(v.line)} ${v.rule} ${v.spec}`),
    [],
  );
  assert.ok(report.packagesChecked > 20, `${String(report.packagesChecked)} packages checked`);
  assert.ok(report.filesChecked > 100, `${String(report.filesChecked)} files checked`);
  assert.ok(report.importsChecked > 100, `${String(report.importsChecked)} imports checked`);
});

test("CT-103-128 (F103-FR-028): a rule file really forbids the writers of the phase gate to every layer, to this feature's module groups in the core and to the samples of EP-04 — the positive control", () => {
  const rules = loadRuleFiles(RULES, ROOT);
  assert.ok(rules.length >= 3, `${String(rules.length)} rule files`);

  // Each of these files is matched by a rule whose `forbid` holds the writers.
  const guarded = [
    "packages/layer-micro/src/index.ts",
    "packages/layer-parallel/src/index.ts",
    "packages/core/src/layers/call-points.ts",
    "packages/core/src/layers/registry.ts",
    "packages/core/src/layers/directives.ts",
    "packages/core/src/layers/attempt-view.ts",
    "packages/core/src/layers/none.ts",
    "packages/core/src/pass-loop/loop.ts",
    "packages/testkit/src/samples/EP-04/noop.ts",
    "packages/testkit/src/samples/EP-04/stacked.ts",
  ];
  for (const file of guarded) {
    for (const writer of GATE_WRITERS) {
      // The import is written as the caller would write it: a relative path
      // from the file to the writer.
      const spec = relative(dirname(join(ROOT, file)), join(ROOT, writer))
        .split("\\")
        .join("/");
      const violations = ruleFileViolations(
        rules,
        file,
        1,
        spec.startsWith(".") ? spec : `./${spec}`,
        ROOT,
      );
      assert.ok(
        violations.length > 0,
        `no rule forbids ${file} to import ${writer} (it resolved as ${spec})`,
      );
      for (const violation of violations) {
        assert.match(violation.detail, /F1(01|03|49)-FR-0(28|07|\d\d)/);
      }
    }
  }

  // And an ordinary import of the same files is not a violation, so the rules
  // are not blanket refusals.
  for (const file of guarded) {
    assert.deepEqual(
      [...ruleFileViolations(rules, file, 1, "@specstride/contracts/ep/loop-layer", ROOT)],
      [],
      file,
    );
  }
});

/* ------------------------------------------------------------------ *
 * 2. No core file names the layer `micro` or the layer `parallel`.
 * ------------------------------------------------------------------ */

test("CT-103-128 (F103-FR-028): `namesALoopLayer` reports every form in which a file would name a layer, and leaves the product's own wording alone", () => {
  assert.deepEqual([...LAYER_IDENTIFIERS], ["micro", "parallel"]);
  // The two identifiers are the Wave 1 layers of the annex, less the built-in.
  assert.deepEqual(
    WAVE_1_LAYERS.filter((name) => name !== "none"),
    [...LAYER_IDENTIFIERS],
  );

  const reported = [
    'const strategy = "micro";',
    "const other = 'parallel';",
    "/** The layer `micro` is on by default. */",
    "// the layer parallel stacks above it",
    "// a micro layer of its own",
    'import x from "@specstride/layer-micro";',
    "// see packages/layer-parallel/src/index.ts",
  ];
  for (const line of reported) {
    const found = namesALoopLayer(line);
    assert.ok(found.length > 0, `not reported: ${line}`);
  }

  for (const sense of NON_LAYER_SENSES) {
    assert.deepEqual([...namesALoopLayer(`// ${sense}`)], [], sense);
  }
  // And the line number is the line, not the match.
  const found = namesALoopLayer(`one\ntwo\nconst s = "micro";\n`);
  assert.equal(found.length, 1);
  assert.equal(found[0]?.line, 3);
  assert.equal(found[0]?.form, "quoted literal");
});

test("CT-103-128 (F103-FR-028): no source file of any core package names the layer `micro` or the layer `parallel`", () => {
  const directories = corePackageDirectories();
  assert.ok(directories.length >= 3, `${String(directories.length)} core packages`);
  let scanned = 0;
  const offences: string[] = [];
  for (const dir of directories) {
    for (const file of sourceFilesUnder(dir)) {
      scanned += 1;
      const rel = relative(ROOT, file).split("\\").join("/");
      // The two layer packages are themselves marked `core: true` in the graph,
      // and a layer may of course name itself: the rule is about a core file
      // that is not that layer.
      if (LAYER_PACKAGES.some((pkg) => rel.startsWith(`${pkg}/`))) continue;
      for (const naming of namesALoopLayer(readFileSync(file, "utf8"))) {
        offences.push(`${rel}:${String(naming.line)} (${naming.form}) ${naming.text}`);
      }
    }
  }
  assert.ok(scanned > 50, `${String(scanned)} core source files scanned`);
  assert.deepEqual(offences, []);
});

test("CT-103-128 (F103-FR-028): the module group of the loop layers in the core names no layer at all, in any form", () => {
  const dir = join(ROOT, "packages/core/src/layers");
  const files = sourceFilesUnder(dir);
  assert.ok(files.length >= 5, `${String(files.length)} files under packages/core/src/layers`);
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const rel = relative(ROOT, file).split("\\").join("/");
    assert.deepEqual([...namesALoopLayer(content)], [], rel);
    // Nor does it import a layer package, by name or by path.
    for (const pkg of LAYER_PACKAGES) {
      assert.equal(content.includes(pkg), false, `${rel} names ${pkg}`);
    }
    for (const writer of GATE_WRITERS) {
      assert.equal(content.includes(writer), false, `${rel} names ${writer}`);
    }
  }
});
