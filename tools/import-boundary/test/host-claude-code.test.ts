/**
 * T002 of `specs/113-host-claude-code/tasks.md` — `@specstride/host-claude-code`
 * is registered in the import-boundary check.
 *
 * Three things are held, each read back through an independent read path (the
 * package graph on disk, the workspace collector of `src/index.ts`, and the
 * rule-file loader), so that none of them rests on a claim of this test:
 *
 *  1. the package has its entry in `packages/contracts/data/package-graph.json`
 *     — layer L7, owner 113, `mayImport` exactly
 *     `@specstride/contracts (at build time only)` — and the layer facts of
 *     annex A §A.1 count it among the host packages of F100-FR-002;
 *  2. the check of `tools/import-boundary/src/index.ts` COLLECTS the package
 *     and reads the source files of the layout of plan.md, and reports no
 *     violation for the workspace as it stands;
 *  3. the rule file `rules/113-host-claude-code-build-time-only.json` loads
 *     with its six fields, and it FIRES on a module of `src/shim/` that
 *     imports `@specstride/contracts` — the module-level half of "at build
 *     time only", which `mayImport` cannot express (F149-FR-007).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../src/index.ts";
import { loadLayerFacts } from "../src/layer-facts.ts";
import { entryOf, expandMayImport } from "../src/rules.ts";
import { RULE_FILE_FIELDS, loadRuleFiles, readRuleFile } from "../src/rule-files.ts";

const TOOL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const facts = loadLayerFacts();
const ROOT = facts.root;
const GRAPH = join(ROOT, "packages/contracts/data/package-graph.json");

/** The package this test is about, and where it lies. */
const PACKAGE = "@specstride/host-claude-code" as const;
const DIRECTORY = "packages/host-claude-code" as const;
const RULE_FILE = "113-host-claude-code-build-time-only.json" as const;

/** The directories of the layout of plan.md that hold TypeScript modules. */
const SOURCE_DIRECTORIES = ["src/describe", "src/render", "src/shim", "src/evals"] as const;

test("T002: @specstride/host-claude-code has its entry in the package graph (L7, owner 113)", () => {
  const entry = entryOf(facts.graph, PACKAGE);
  assert.ok(entry !== undefined, `the package graph holds no ${PACKAGE}`);
  assert.equal(entry.layer, "L7");
  assert.equal(entry.owner, "113");
  // The split (U-1 of 120) added the kit as the second build-time edge: the
  // plugin composes its shim and, in later commits, its skills and its render
  // from @specstride/host-kit, as from contracts, and carries neither at run
  // time. Both edges stay qualified, and the list stays EXACT.
  assert.deepEqual(
    [...(entry.mayImport ?? [])],
    ["@specstride/contracts (at build time only)", "@specstride/host-kit (at build time only)"],
  );
  // The parenthetical is prose: the expanded list is exactly the two packages.
  assert.deepEqual(
    [...expandMayImport(facts.graph, entry)],
    ["@specstride/contracts", "@specstride/host-kit"],
  );
  // F100-FR-002 — the host packages are the packages of layer L7.
  assert.equal(facts.layerOf[PACKAGE], 7);
  assert.ok(
    facts.hostPackages.includes(PACKAGE),
    `the host packages of F100-FR-002 are ${facts.hostPackages.join(", ")}`,
  );
});

test("T002: the import-boundary check collects the package and reads the layout of plan.md", () => {
  // The package exists in the workspace, with the directories of the layout.
  assert.equal(existsSync(join(ROOT, DIRECTORY, "package.json")), true);
  for (const directory of SOURCE_DIRECTORIES) {
    assert.equal(
      existsSync(join(ROOT, DIRECTORY, directory, "index.ts")),
      true,
      `${DIRECTORY}/${directory}/index.ts is missing`,
    );
  }
  // The check reads the workspace through its own collector, and the package is
  // among the packages it checks; the workspace as it stands has no violation.
  const report = run(ROOT, GRAPH, join(TOOL_DIR, "rules"));
  assert.deepEqual(
    report.violations.map((v) => `${v.file}:${v.line} [${v.rule}] ${v.detail}`),
    [],
  );
  // The collector walks `packages/*` and `tools/*` of the workspace, so the
  // count covers this package; the files of its `src/` are among the files read.
  assert.ok(report.packagesChecked >= 31, `only ${report.packagesChecked} packages collected`);
  assert.ok(report.filesChecked > 0);
});

test("T002: the rule file of the build-time-only edge loads with its six fields", () => {
  const file = join(TOOL_DIR, "rules", RULE_FILE);
  assert.equal(existsSync(file), true, `${RULE_FILE} is missing`);
  const rule = readRuleFile(file, `tools/import-boundary/rules/${RULE_FILE}`);
  for (const field of RULE_FILE_FIELDS) {
    assert.ok(field in rule, `the rule file lacks \`${field}\``);
  }
  assert.equal(rule.rule, "RF-113-01");
  assert.equal(rule.owner, "113");
  assert.equal(rule.requirement, "F113-FR-030");
  assert.deepEqual([...rule.from], ["packages/host-claude-code/src/shim/**"]);
  assert.deepEqual([...rule.forbid], ["@specstride/contracts", "@specstride/contracts/**"]);
  // The loader of the whole directory finds it too, so `check:imports` applies it.
  const loaded = loadRuleFiles(join(TOOL_DIR, "rules"), ROOT);
  assert.ok(
    loaded.some((r) => r.rule === "RF-113-01"),
    `loadRuleFiles found ${loaded.map((r) => r.rule).join(", ") || "no rule"}`,
  );
});

test("T002: the rule FIRES on a module of src/shim/ that imports @specstride/contracts", () => {
  // A scratch workspace that holds the real graph and the real rule file, and
  // one shim module that breaks the rule. Nothing of this test writes the
  // workspace; the scratch copy is removed again.
  const scratch = mkdtempSync(join(tmpdir(), "host-claude-code-shim-"));
  try {
    writeFileSync(
      join(scratch, "package.json"),
      JSON.stringify({ name: "fixture-root", private: true, workspaces: ["packages/*"] }),
    );
    mkdirSync(join(scratch, "packages/contracts/data"), { recursive: true });
    cpSync(GRAPH, join(scratch, "packages/contracts/data/package-graph.json"));
    mkdirSync(join(scratch, DIRECTORY, "src/shim"), { recursive: true });
    writeFileSync(
      join(scratch, DIRECTORY, "package.json"),
      JSON.stringify({ name: PACKAGE, private: true, dependencies: {} }),
    );
    // The specifier is assembled so that this test file holds no such import.
    const specifier = `@specstride/${"contracts"}/ep/host`;
    writeFileSync(
      join(scratch, DIRECTORY, "src/shim/index.ts"),
      `import { CLI_PROTOCOL_VERSION } from "${specifier}";\nexport { CLI_PROTOCOL_VERSION };\n`,
    );

    const report = run(
      scratch,
      join(scratch, "packages/contracts/data/package-graph.json"),
      join(TOOL_DIR, "rules"),
    );
    const fired = report.violations.filter((v) => v.rule === "RF-113-01");
    assert.equal(
      fired.length,
      1,
      `RF-113-01 did not fire; violations: ${
        report.violations.map((v) => `${v.file}:${v.line} [${v.rule}]`).join(", ") || "none"
      }`,
    );
    assert.equal(fired[0].file, `${DIRECTORY}/src/shim/index.ts`);
    assert.equal(fired[0].line, 1);
    assert.match(fired[0].detail, /build time only|run-time dependency|F113-FR-030/);

    // The control: the SAME import from a directory the rule does not name is
    // permitted, because the package may import contracts at build time.
    mkdirSync(join(scratch, DIRECTORY, "src/describe"), { recursive: true });
    writeFileSync(
      join(scratch, DIRECTORY, "src/describe/index.ts"),
      `import { CAPABILITIES } from "${specifier}";\nexport { CAPABILITIES };\n`,
    );
    const second = run(
      scratch,
      join(scratch, "packages/contracts/data/package-graph.json"),
      join(TOOL_DIR, "rules"),
    );
    assert.deepEqual(
      second.violations
        .filter((v) => v.file.includes("src/describe/"))
        .map((v) => `${v.file} [${v.rule}]`),
      [],
      "the build-time import of src/describe/ is permitted",
    );
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
