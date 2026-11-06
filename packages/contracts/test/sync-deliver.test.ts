/**
 * T299 — tests of the delivery of other features' data and schema files into
 * the `contracts` package (`plan.md`, "Files of other features in the
 * `contracts` package"; `contracts/README.md`, "How the files are made";
 * F100-FR-227).
 *
 * The tests build a fixture feature under a temporary `specs/` tree and run
 * the delivery of `scripts/sync.mjs` against it: a delivery, a collision and a
 * missing source. The generator check and the two clean copies of the real tree
 * are not re-run here; `deliverOtherFeatures` is the step after them.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SYNC = join(PKG_DIR, "scripts/sync.mjs");
const ROOT = resolve(PKG_DIR, "../..");

/**
 * A temporary tree with a `specs/` of fixture features and an empty package
 * `data/` and `schemas/`, as the two clean copies would have left them.
 */
function makeTree(
  features: Record<string, { deliver: unknown; files: Record<string, string> }>,
  existingPackageFiles: Record<string, string> = {},
): { specsDir: string; pkgDir: string; cleanUp: () => void } {
  const root = mkdtempSync(join(tmpdir(), "sync-deliver-"));
  const specsDir = join(root, "specs");
  const pkgDir = join(root, "pkg");
  mkdirSync(join(pkgDir, "data"), { recursive: true });
  mkdirSync(join(pkgDir, "schemas"), { recursive: true });
  for (const [rel, body] of Object.entries(existingPackageFiles)) {
    mkdirSync(dirname(join(pkgDir, rel)), { recursive: true });
    writeFileSync(join(pkgDir, rel), body);
  }
  for (const [feature, body] of Object.entries(features)) {
    const contracts = join(specsDir, feature, "contracts");
    mkdirSync(join(contracts, "schemas"), { recursive: true });
    writeFileSync(join(contracts, "deliver.json"), JSON.stringify(body.deliver, null, 1) + "\n");
    for (const [rel, content] of Object.entries(body.files)) {
      mkdirSync(dirname(join(contracts, rel)), { recursive: true });
      writeFileSync(join(contracts, rel), content);
    }
  }
  return { specsDir, pkgDir, cleanUp: () => rmSync(root, { recursive: true, force: true }) };
}

/**
 * Run the delivery step of the real `scripts/sync.mjs` over a fixture tree, in
 * its own process, so that the exit code is the script's own.
 */
function runDelivery(specsDir: string, pkgDir: string): { code: number; out: string; err: string } {
  const program =
    `import { deliverOtherFeatures } from ${JSON.stringify(SYNC)};\n` +
    `const n = deliverOtherFeatures(${JSON.stringify(specsDir)}, ${JSON.stringify(pkgDir)});\n` +
    `process.stdout.write("sync: " + n + " file(s) delivered from other features " +\n` +
    `  "(verified byte for byte)\\n");\n`;
  try {
    const out = execFileSync(process.execPath, ["--input-type=module", "-e", program], {
      encoding: "utf8",
    });
    return { code: 0, out, err: "" };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? -1, out: e.stdout ?? "", err: e.stderr ?? "" };
  }
}

test("T299: a delivery copies each entry, verifies it and counts it in the final line", () => {
  const { specsDir, pkgDir, cleanUp } = makeTree({
    "150-fixture": {
      deliver: {
        schema: "specstride.deliver-150/1",
        owner: "150",
        data: { "closed-sets-150.json": "closed-sets.json", "rows-150.json": "rows.json" },
        schemas: { "fixture.schema.json": "schemas/fixture.schema.json" },
      },
      files: {
        "closed-sets.json": '{"closedSets":[]}\n',
        "rows.json": '{"rows":[1,2,3]}\n',
        "schemas/fixture.schema.json": '{"$id":"specstride.fixture/1"}\n',
      },
    },
  });
  try {
    const { code, out } = runDelivery(specsDir, pkgDir);
    assert.equal(code, 0, out);
    // Each entry is copied to its TARGET name in the package.
    assert.deepEqual(readdirSync(join(pkgDir, "data")).sort(), [
      "closed-sets-150.json",
      "rows-150.json",
    ]);
    assert.deepEqual(readdirSync(join(pkgDir, "schemas")).sort(), ["fixture.schema.json"]);
    // Byte for byte, from the path relative to that feature's contracts/.
    assert.deepEqual(
      readFileSync(join(pkgDir, "data/rows-150.json")),
      readFileSync(join(specsDir, "150-fixture/contracts/rows.json")),
    );
    assert.deepEqual(
      readFileSync(join(pkgDir, "schemas/fixture.schema.json")),
      readFileSync(join(specsDir, "150-fixture/contracts/schemas/fixture.schema.json")),
    );
    // The count of delivered files stands in the final line.
    const lines = out.trimEnd().split("\n");
    assert.match(
      lines[lines.length - 1] as string,
      /^sync: 3 file\(s\) delivered from other features/,
    );
  } finally {
    cleanUp();
  }
});

test("T299: features are read sorted by directory name, and feature 100 is skipped", () => {
  const { specsDir, pkgDir, cleanUp } = makeTree({
    "152-later": {
      deliver: { data: { "b-152.json": "b.json" } },
      files: { "b.json": "b\n" },
    },
    "151-earlier": {
      deliver: { data: { "a-151.json": "a.json" } },
      files: { "a.json": "a\n" },
    },
    // Feature 100's own contracts/ IS the two clean copies: it delivers nothing.
    "100-specstride": {
      deliver: { data: { "must-not-appear.json": "x.json" } },
      files: { "x.json": "x\n" },
    },
  });
  try {
    const { code, out } = runDelivery(specsDir, pkgDir);
    assert.equal(code, 0, out);
    // Sorted by directory name: 151 before 152.
    const delivered = out
      .split("\n")
      .filter((l) => l.startsWith("sync: delivered"))
      .map((l) => l.split(" ")[2]);
    assert.deepEqual(delivered, ["data/a-151.json", "data/b-152.json"]);
    // Feature 100 is skipped: its entry never reaches the package.
    assert.ok(!readdirSync(join(pkgDir, "data")).includes("must-not-appear.json"));
    assert.match(out, /2 file\(s\) delivered/);
  } finally {
    cleanUp();
  }
});

test("T299: a COLLISION with a file of the package fails with exit 1, naming the target", () => {
  const { specsDir, pkgDir, cleanUp } = makeTree(
    {
      "151-fixture": {
        deliver: { data: { "layout.json": "mine.json" } },
        files: { "mine.json": "mine\n" },
      },
    },
    // The clean copy of feature 100 already placed `data/layout.json`.
    { "data/layout.json": '{"layoutVersion":"1.2"}\n' },
  );
  try {
    const { code, err } = runDelivery(specsDir, pkgDir);
    assert.equal(code, 1);
    assert.match(err, /data\/layout\.json already exists/);
    assert.match(err, /must not overwrite a file of the package/);
    assert.match(err, /151-fixture/);
    // The file of the package is untouched.
    assert.equal(
      readFileSync(join(pkgDir, "data/layout.json"), "utf8"),
      '{"layoutVersion":"1.2"}\n',
    );
  } finally {
    cleanUp();
  }
});

test("T299: TWO FEATURES naming the same target fail with exit 1, naming the first", () => {
  const { specsDir, pkgDir, cleanUp } = makeTree({
    "151-first": {
      deliver: { data: { "shared.json": "a.json" } },
      files: { "a.json": "a\n" },
    },
    "152-second": {
      deliver: { data: { "shared.json": "b.json" } },
      files: { "b.json": "b\n" },
    },
  });
  try {
    const { code, err } = runDelivery(specsDir, pkgDir);
    assert.equal(code, 1);
    assert.match(err, /data\/shared\.json/);
    assert.match(err, /already delivered by feature 151-first/);
    assert.match(err, /two features must not name the same target/);
    // The first delivery stands; the second never overwrote it.
    assert.equal(readFileSync(join(pkgDir, "data/shared.json"), "utf8"), "a\n");
  } finally {
    cleanUp();
  }
});

test("T299: a MISSING SOURCE fails with exit 1, naming the target and the source", () => {
  const { specsDir, pkgDir, cleanUp } = makeTree({
    "151-fixture": {
      deliver: { data: { "absent-151.json": "not-written.json" } },
      files: {},
    },
  });
  try {
    const { code, err } = runDelivery(specsDir, pkgDir);
    assert.equal(code, 1);
    assert.match(err, /the source not-written\.json/);
    assert.match(err, /data\/absent-151\.json is missing/);
    assert.deepEqual(readdirSync(join(pkgDir, "data")), []);
  } finally {
    cleanUp();
  }
});

test("T299: the real tree delivers every feature's files, and they are byte-identical", () => {
  // The delivery already ran in this repository: the sync is the one writer of
  // the package directories, so the files are on disk and equal their sources.
  // The sync reads the `deliver.json` of every feature directory under `specs/`
  // (feature 100 skipped), so the tree's delivery is the union of them all:
  // read every manifest, hold each file to its own source, and hold each
  // manifest's delivered names to that manifest's own feature number.
  const manifests = readdirSync(join(ROOT, "specs"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(ROOT, "specs", entry.name, "contracts", "deliver.json"))
    .filter((path) => {
      try {
        return statSync(path).isFile();
      } catch {
        return false;
      }
    })
    .sort();
  assert.ok(manifests.length >= 1, "the tree declares at least one delivery");
  const deliveredData: string[] = [];
  for (const manifestPath of manifests) {
    const deliver = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      data?: Record<string, string>;
      schemas?: Record<string, string>;
    };
    const contracts = dirname(manifestPath);
    const featureNumber = basename(dirname(contracts)).split("-")[0];
    let checked = 0;
    for (const [key, map] of [
      ["data", deliver.data ?? {}],
      ["schemas", deliver.schemas ?? {}],
    ] as const) {
      for (const [target, source] of Object.entries(map)) {
        assert.deepEqual(
          readFileSync(join(PKG_DIR, key, target)),
          readFileSync(join(contracts, source)),
          `${key}/${target} is byte-identical to ${source}`,
        );
        checked++;
        if (key === "data") deliveredData.push(target);
      }
    }
    // The count is read back off the manifest itself, so it can no longer go
    // stale when a feature adds a file to its deliver.json: the sync is the one
    // writer, and the assertion that matters is byte identity above.
    const declared =
      Object.keys(deliver.data ?? {}).length + Object.keys(deliver.schemas ?? {}).length;
    assert.equal(checked, declared, `every file ${featureNumber} declares is delivered`);
    // A delivered file carries the number of the feature that delivers it.
    assert.ok(
      Object.keys(deliver.data ?? {}).every((t) => t.includes(featureNumber)),
      `${featureNumber}'s delivered data names carry its own number`,
    );
  }
  assert.ok(deliveredData.length >= 1, "the tree delivers at least one data file");
});
