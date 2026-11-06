/**
 * T044 — the pin of the YAML parser of the loader and the proof that it is used
 * in a mode that constructs no code (F110-FR-003; decision D-8 of feature 100,
 * `specs/100-specstride/research.md`: "one YAML parser for the whole product,
 * the npm package `yaml` … The exact version is pinned at the first task of
 * feature 110 that uses it, and the licence is checked then").
 *
 * The three parts of the task are three suites:
 *
 *  1. The pin: one exact version, in the manifest of the package, in
 *     `package-lock.json` and in the installed package, all the same value, and
 *     no range anywhere.
 *  2. The licence: ISC, read from the installed package and from its `LICENSE`
 *     file, and recorded in `specs/110-config-and-terms/research.md` — which the
 *     task names as the place of the record — and in `DEPENDENCIES.md`.
 *  3. The mode that constructs no code: the options the loader passes, and the
 *     behaviour they produce, observed through `parseConfigText` on real text.
 *
 * Nothing here trusts the prose: every value is read from a file on disk.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { YAML_PARSER_PIN, YAML_PARSE_OPTIONS, parseConfigText } from "../../src/load/files.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE = join(HERE, "..", "..");
const REPO = join(PACKAGE, "..", "..");

const WHERE = Object.freeze({ logicalName: "user:config", path: "/tmp/t044/config.yaml" });

/** A version that is one exact release and not a range (F100-FR-027). */
const EXACT_VERSION = /^\d+\.\d+\.\d+$/;

function json(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

describe("T044 — the YAML parser is pinned to one version of the npm package `yaml`", () => {
  it("the constant of the loader names the package, one exact version and the licence", () => {
    assert.equal(YAML_PARSER_PIN.package, "yaml");
    assert.match(YAML_PARSER_PIN.version, EXACT_VERSION);
    assert.equal(YAML_PARSER_PIN.licence, "ISC");
  });

  it("`packages/config/package.json` declares that exact version, not a range", () => {
    const manifest = json(join(PACKAGE, "package.json"));
    const deps = manifest["dependencies"] as Record<string, string>;
    assert.equal(deps["yaml"], YAML_PARSER_PIN.version);
    assert.match(deps["yaml"], EXACT_VERSION, "a range would let the parser change under us");
    // The parser is a dependency of this package and of no other package of the
    // workspace (decision D-8: "a dependency of the package that loads
    // configuration (owner 110) and of no other package").
    const lock = json(join(REPO, "package-lock.json"));
    const packages = lock["packages"] as Record<string, Record<string, unknown>>;
    const others = Object.entries(packages).filter(
      ([path, entry]) =>
        path.startsWith("packages/") &&
        path !== "packages/config" &&
        Object.keys((entry["dependencies"] as Record<string, string>) ?? {}).includes("yaml"),
    );
    assert.deepEqual(others, []);
  });

  it("`package-lock.json` resolves exactly that version, with an integrity hash", () => {
    const lock = json(join(REPO, "package-lock.json"));
    const packages = lock["packages"] as Record<string, Record<string, unknown>>;
    const entry = packages["node_modules/yaml"];
    assert.ok(entry, "`node_modules/yaml` has an entry in the lock file");
    assert.equal(entry["version"], YAML_PARSER_PIN.version);
    assert.equal(entry["license"], YAML_PARSER_PIN.licence);
    assert.match(String(entry["integrity"]), /^sha512-/);
    // One entry only: no second copy of the parser at another version.
    const copies = Object.keys(packages).filter((path) => path.endsWith("node_modules/yaml"));
    assert.deepEqual(copies, ["node_modules/yaml"]);
  });

  it("the installed package is that version and carries no install script and no native part", () => {
    const installed = json(join(REPO, "node_modules", "yaml", "package.json"));
    assert.equal(installed["name"], "yaml");
    assert.equal(installed["version"], YAML_PARSER_PIN.version);
    assert.equal(installed["license"], YAML_PARSER_PIN.licence);
    const scripts = (installed["scripts"] as Record<string, string>) ?? {};
    for (const hook of ["preinstall", "install", "postinstall", "prepare"]) {
      assert.equal(hook in scripts, false, `the installed package runs \`${hook}\``);
    }
    assert.equal("gypfile" in installed, false);
    assert.equal(Object.keys((installed["dependencies"] as object) ?? {}).length, 0);
  });
});

describe("T044 — the licence of the parser is recorded in `research.md`", () => {
  const research = readFileSync(join(REPO, "specs", "110-config-and-terms", "research.md"), "utf8");

  it("`research.md` names the package, the exact version and the licence", () => {
    const section = research.slice(research.indexOf("§T044"));
    assert.ok(section.length > 0, "`research.md` has a §T044 section");
    assert.ok(section.includes("`yaml`"), "the package is named");
    assert.ok(section.includes(YAML_PARSER_PIN.version), "the exact version is named");
    assert.ok(section.includes(YAML_PARSER_PIN.licence), "the licence is named");
  });

  it("the verification record of `research.md` carries the pin as a fact that is `verified`", () => {
    const row = research
      .split("\n")
      .find((line) => line.includes("Licence and version of the YAML parser"));
    assert.ok(row, "the verification record has a row for the pin");
    assert.match(row, /`verified`/);
  });

  it("`DEPENDENCIES.md` states the same version and licence", () => {
    const deps = readFileSync(join(PACKAGE, "DEPENDENCIES.md"), "utf8");
    assert.ok(deps.includes(YAML_PARSER_PIN.version));
    assert.ok(deps.includes(YAML_PARSER_PIN.licence));
  });
});

describe("T044 — the parser is used in a mode that constructs no code", () => {
  it("the mode is the YAML 1.2 core schema, with no custom tag and no merge key", () => {
    assert.equal(YAML_PARSE_OPTIONS.version, "1.2");
    assert.equal(YAML_PARSE_OPTIONS.merge, false);
    assert.deepEqual([...YAML_PARSE_OPTIONS.customTags], []);
    assert.equal(YAML_PARSE_OPTIONS.uniqueKeys, true);
  });

  it("the loader passes that mode and no other: the source names the constant once", () => {
    const source = readFileSync(join(PACKAGE, "src", "load", "files.ts"), "utf8");
    const calls = source.match(/parseYaml\(/g) ?? [];
    assert.equal(calls.length, 1, "one call of the parser in the loader");
    assert.match(source, /parseYaml\(text, \{\s*\.\.\.YAML_PARSE_OPTIONS/);
    // No other source file of the package reaches the parser at all.
    const parsers = [
      "src/load/merge.ts",
      "src/load/trust.ts",
      "src/load/provenance.ts",
      "src/load/snapshot.ts",
      "src/load/alias.ts",
      "src/load/phase.ts",
      "src/cli/show.ts",
      "src/cli/schema.ts",
    ].filter((path) => readFileSync(join(PACKAGE, path), "utf8").includes('from "yaml"'));
    assert.deepEqual(parsers, []);
  });

  it("every leaf of a parsed document is data: a string, a number, a boolean or null", () => {
    const tree = parseConfigText(
      ["schema: 1", "loop:", "  maxIter: 10", "  escalation: true", "notes: ~"].join("\n"),
      WHERE,
    );
    const leaves: unknown[] = [];
    const walk = (value: unknown): void => {
      if (value !== null && typeof value === "object") {
        for (const inner of Object.values(value as Record<string, unknown>)) walk(inner);
      } else leaves.push(value);
    };
    walk(tree);
    assert.ok(leaves.length >= 4);
    for (const leaf of leaves) {
      assert.ok(
        leaf === null || ["string", "number", "boolean"].includes(typeof leaf),
        `a leaf of type ${typeof leaf} was constructed`,
      );
      assert.notEqual(typeof leaf, "function");
    }
  });

  it("a tag that names a constructor builds no function and no object of a class", () => {
    for (const text of [
      "schema: 1\nloop:\n  maxIter: !!js/function 'function (){ return 1 }'",
      "schema: 1\nloop:\n  maxIter: !<tag:yaml.org,2002:js/eval> 'process.exit(1)'",
      "schema: 1\nloop:\n  maxIter: !ruby/object:Gem::Requirement {}",
    ]) {
      let tree: Record<string, unknown>;
      try {
        tree = parseConfigText(text, WHERE);
      } catch {
        // A refusal is also a mode that constructs nothing.
        continue;
      }
      const value = (tree["loop"] as Record<string, unknown>)["maxIter"];
      assert.notEqual(typeof value, "function", "the tag constructed a function");
      assert.ok(
        value === null ||
          ["string", "number", "boolean"].includes(typeof value) ||
          (typeof value === "object" &&
            Object.getPrototypeOf(value as object) === Object.prototype),
        "the tag constructed an object of a class",
      );
    }
  });

  it("the merge key `<<` of YAML 1.1 is not honoured: it stays a key of its own", () => {
    const tree = parseConfigText(
      [
        "schema: 1",
        "base: &base",
        "  maxIter: 10",
        "loop:",
        "  <<: *base",
        "  escalation: true",
      ].join("\n"),
      WHERE,
    );
    const loop = tree["loop"] as Record<string, unknown>;
    assert.equal("maxIter" in loop, false, "the merge key grafted a mapping (merge is on)");
    assert.ok("<<" in loop, "the merge key stayed a key of its own");
  });

  it("a duplicate key is refused instead of the later value winning silently", () => {
    assert.throws(
      () => parseConfigText("schema: 1\nloop:\n  maxIter: 10\n  maxIter: 99", WHERE),
      /is not a YAML 1\.2 document/,
    );
  });

  it("a document cannot reach the prototype of an object", () => {
    const before = Object.keys(Object.prototype).length;
    const tree = parseConfigText("schema: 1\n__proto__:\n  polluted: true", WHERE);
    assert.equal(
      ({} as Record<string, unknown>)["polluted"],
      undefined,
      "parsing polluted Object.prototype",
    );
    assert.equal(Object.keys(Object.prototype).length, before);
    assert.ok(tree);
  });

  it("the YAML 1.2 core schema is in force: `off` is a string, not a boolean", () => {
    const tree = parseConfigText("schema: 1\nloop:\n  escalation: off", WHERE);
    assert.equal((tree["loop"] as Record<string, unknown>)["escalation"], "off");
  });
});
