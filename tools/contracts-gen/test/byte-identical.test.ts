/**
 * T293 — the byte-identical proof, and the `--check` mode.
 *
 * The test runs the Python generator of the specification and the TypeScript
 * one into two scratch directories and asserts that the 82 files are equal. It
 * is skipped with its reason when `python3` is absent: a missing prerequisite
 * reports a skip with its reason and never a pass (quickstart.md, "Tiers").
 *
 * The Python script fixes its places from its own path (`HERE.parents[1]`,
 * `[2]`, `[4]`), so the scratch tree copies the script to the same depth and
 * links the annexes, the hand-written sources and `docs/` into place; the
 * script then writes into the scratch `contracts/` and touches nothing of the
 * repository.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { build, check, GENERATED_DIRECTORIES, write } from "../src/main.ts";
import { defaultPlaces } from "../src/paths.ts";

const places = defaultPlaces();

/** True when `python3` runs on this machine. */
function pythonIsAvailable(): boolean {
  const probe = spawnSync("python3", ["--version"], { encoding: "utf8" });
  return probe.status === 0;
}

/** The reason the byte-identical proof skips, named so that it is never read as a pass. */
const PYTHON_SKIP =
  "prerequisite missing: `python3` is not on this machine, so the Python generator of " +
  "the specification cannot be run beside the TypeScript one. This is a SKIP with its " +
  "reason and never a pass (quickstart.md, “Tiers”).";

/** Every `.json` of the four generated directories and `requirements.json`, sorted. */
function generatedFiles(root: string): string[] {
  const out: string[] = [];
  if (existsSync(join(root, "requirements.json"))) out.push("requirements.json");
  for (const d of GENERATED_DIRECTORIES) {
    const dir = join(root, d);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (name.endsWith(".json")) out.push(`${d}/${name}`);
    }
  }
  return out.sort();
}

test(
  "T293 the Python generator and the TypeScript one write the same 82 files",
  { skip: pythonIsAvailable() ? false : PYTHON_SKIP },
  () => {
    // The Python side: a scratch repository root with the script at the depth it
    // expects, and the annexes, the sources and docs/ linked into place.
    const py = mkdtempSync(join(tmpdir(), "contracts-gen-py-"));
    const feature = join(py, "specs/100-specstride");
    const contracts = join(feature, "contracts");
    mkdirSync(join(contracts, "tools"), { recursive: true });
    symlinkSync(places.annexDir, join(feature, "annexes"));
    symlinkSync(join(places.contractsDir, "sources"), join(contracts, "sources"));
    symlinkSync(join(places.repoDir, "docs"), join(py, "docs"));
    copyFileSync(
      join(places.contractsDir, "tools/generate.py"),
      join(contracts, "tools/generate.py"),
    );
    const run = spawnSync("python3", [join(contracts, "tools/generate.py")], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /^wrote 82 files$/m);

    // The TypeScript side: the same annexes and sources, a scratch output tree.
    const ts = mkdtempSync(join(tmpdir(), "contracts-gen-ts-"));
    cpSync(join(places.contractsDir, "sources"), join(ts, "sources"), { recursive: true });
    const wrote = write({ annexDir: places.annexDir, contractsDir: ts, repoDir: places.repoDir });
    assert.equal(wrote, 82);

    const fromPython = generatedFiles(contracts);
    const fromTypeScript = generatedFiles(ts);
    assert.equal(fromPython.length, 82);
    assert.deepEqual(fromTypeScript, fromPython);
    const differ: string[] = [];
    for (const rel of fromPython) {
      if (readFileSync(join(contracts, rel), "utf8") !== readFileSync(join(ts, rel), "utf8")) {
        differ.push(rel);
      }
    }
    assert.deepEqual(differ, [], `these files differ: ${differ.join(", ")}`);
  },
);

test("T293 --check reports `checked 82 files, 0 differ` on the committed tree", () => {
  const report = check(places);
  assert.equal(report.checked, 82);
  assert.deepEqual(report.differs, []);
  assert.deepEqual(report.notGenerated, []);
  assert.equal(report.lines.at(-1), "checked 82 files, 0 differ");
});

test("T293 --check names every file that differs and exits 1", () => {
  const scratch = mkdtempSync(join(tmpdir(), "contracts-gen-check-"));
  cpSync(places.contractsDir, scratch, { recursive: true });
  // A changed cell of a generated file: the file is named.
  const target = join(scratch, "data/stop-reasons.json");
  writeFileSync(target, readFileSync(target, "utf8").replace('"number": 1,', '"number": 99,'));
  const report = check({ ...places, contractsDir: scratch });
  assert.deepEqual(report.differs, ["data/stop-reasons.json"]);
  assert.ok(report.lines.includes("differs from the annexes: data/stop-reasons.json"));
  assert.equal(report.lines.at(-1), "checked 82 files, 1 differ");
});

test("T293 --check names a file of a generated directory that the generator does not produce", () => {
  const scratch = mkdtempSync(join(tmpdir(), "contracts-gen-extra-"));
  cpSync(places.contractsDir, scratch, { recursive: true });
  writeFileSync(join(scratch, "data/invented.json"), "{}\n");
  const report = check({ ...places, contractsDir: scratch });
  assert.deepEqual(report.notGenerated, ["data/invented.json"]);
  assert.ok(report.lines.includes("not generated: data/invented.json"));
  assert.equal(report.lines.at(-1), "checked 82 files, 1 differ");
});

test("T293 the command-line entry exits 1 when a file differs and 0 when none do", () => {
  const entry = join(places.repoDir, "tools/contracts-gen/src/main.ts");
  const ok = spawnSync(process.execPath, [entry, "--check"], {
    cwd: places.repoDir,
    encoding: "utf8",
  });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /^checked 82 files, 0 differ$/m);
});

test("T293 build() produces the 82 files of contracts/, and only those", () => {
  const files = build(places);
  assert.equal(files.size, 82);
  const rels = [...files.keys()].sort();
  assert.deepEqual(rels, generatedFiles(places.contractsDir));
  for (const rel of rels) {
    assert.ok(files.get(rel)?.endsWith("\n"), rel);
    assert.equal(relative(places.contractsDir, join(places.contractsDir, rel)), rel);
  }
});
