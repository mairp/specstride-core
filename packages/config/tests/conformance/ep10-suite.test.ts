/**
 * T040 — the run of the conformance suite of EP-10 on the sample and on the
 * three resolvers of Wave 1, and the check that no core file names them
 * (F110-FR-035).
 *
 * Phase 5 (T030) wrote the cases of the suite in
 * `packages/testkit/src/conformance/EP-10/`. This file is the task of phase 6:
 * it RUNS that suite — in a child process, through the real `node --test`, so
 * the run is observed from outside and not asserted from inside — and then runs
 * the core-file check in its wider form: every package of the workspace except
 * the two this feature owns work in (`@specstride/config`, where the resolvers
 * live, and `@specstride/testkit`, where the suite and the sample live) is
 * scanned, not only the three `core: true` packages of the graph and the two a
 * core package may import.
 *
 * Why the wider form: the three core packages are still skeletons (one
 * `index.ts` each), so CT-110-130's scan carries most of its weight in
 * `contracts` and `kernel`. Scanning every other package of the graph makes the
 * check bite today — a resolver named anywhere outside this feature's own
 * package and the test kit fails it — and it keeps biting when the core
 * packages are filled.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import process from "node:process";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE = join(HERE, "..", "..");
const REPO = join(PACKAGE, "..", "..");
const TESTKIT = join(REPO, "packages", "testkit");
const EP10 = join(TESTKIT, "src", "conformance", "EP-10");

/** The implementations the suite must be run on (F110-FR-035, T040). */
const WAVE_1_IMPLEMENTATION_IDS = Object.freeze([
  "config-secret-resolver-env",
  "config-secret-resolver-file",
  "config-secret-resolver-keychain",
]);

/** The five standard cases of annex A §A.4, by their name in the frame. */
const STANDARD_CASES = Object.freeze([
  "EP-10/operations-exist",
  "EP-10/closed-result-sets",
  "EP-10/degradation",
  "EP-10/unknown-value-rule",
  "EP-10/behaviour-cases",
]);

/** The behaviour cases of this feature, run on the sample of the point. */
const BEHAVIOUR_CASES = Object.freeze(["CT-110-128", "CT-110-129", "CT-110-130"]);

/** Every `*.test.ts` of the folder of the point, in a stable order. */
function suiteFiles(): readonly string[] {
  return Object.freeze(
    readdirSync(EP10)
      .filter((name) => name.endsWith(".test.ts"))
      .sort()
      .map((name) => join("src", "conformance", "EP-10", name)),
  );
}

/** The run of the suite, once, shared by the cases below. */
const run = (() => {
  const files = suiteFiles();
  // The child must be a test run of its own: `NODE_TEST_CONTEXT` of THIS run
  // would make `node --test` refuse to run files ("called recursively"), so it
  // is removed from the environment the child gets.
  const environment = { ...process.env };
  delete environment["NODE_TEST_CONTEXT"];
  const result = spawnSync(process.execPath, ["--test", ...files], {
    cwd: TESTKIT,
    encoding: "utf8",
    env: environment,
    timeout: 300_000,
  });
  return { files, result, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
})();

describe("T040 — the conformance suite of EP-10 runs on the sample and the three resolvers of Wave 1", () => {
  it("the folder of the point holds the frame of feature 100 and the cases of this feature", () => {
    assert.deepEqual(
      run.files.map((path) => path.split("/").at(-1)),
      ["contract.test.ts", "secrets.test.ts"],
    );
  });

  it("the suite passes: exit code 0, no failing case", () => {
    assert.equal(run.result.error, undefined, String(run.result.error?.message));
    assert.equal(run.result.status, 0, run.output.slice(-4000));
    assert.match(run.output, /^# fail 0$/m);
    assert.doesNotMatch(run.output, /^not ok /m);
  });

  it("the five standard cases of §A.4 ran on each of the three resolvers of Wave 1", () => {
    for (const id of WAVE_1_IMPLEMENTATION_IDS) {
      for (const name of STANDARD_CASES) {
        assert.ok(run.output.includes(`${name} [${id}]`), `the case ${name} did not run on ${id}`);
        assert.match(
          run.output,
          new RegExp(`^ok \\d+ - ${name.replace("/", "\\/")} \\[${id}\\]`, "m"),
          `the case ${name} did not pass on ${id}`,
        );
      }
    }
  });

  it("the cases of this feature and the contract case ran on the sample of the point", () => {
    for (const id of [...BEHAVIOUR_CASES, "CT-100-207"]) {
      assert.match(run.output, new RegExp(`^ok \\d+ - ${id}`, "m"), `${id} did not pass`);
    }
    // The sample is the `test:` scheme of `packages/testkit/src/samples/EP-10/`.
    assert.ok(statSync(join(TESTKIT, "src", "samples", "EP-10", "index.ts")).isFile());
  });

  it("the count of cases is asserted, so the run can never pass by running nothing", () => {
    const passed = (run.output.match(/^ok \d+ - /gm) ?? []).length;
    // 7 on the sample through the frame, 5 standard cases plus the report line
    // on each of the three resolvers, and the three behaviour cases with their
    // report line: 29 in this workdir, and never fewer.
    assert.ok(passed >= 29, `${passed} cases passed`);
  });
});

/** Every `.ts` file under a directory, recursively; an absent directory is empty. */
function sourceFilesOf(dir: string): readonly string[] {
  let entries: readonly string[];
  try {
    if (!statSync(dir).isDirectory()) return [];
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const name of entries) {
    if (name === "node_modules") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...sourceFilesOf(path));
    else if (/\.(ts|mts|js|mjs)$/.test(name)) out.push(path);
  }
  return Object.freeze(out);
}

/**
 * The names a file outside this feature's package would have to spell to reach a
 * resolver of Wave 1, its registry or the sample of the point. The scheme names
 * themselves (`env:`, `file:`, `keychain:`) are NOT in the list: they are
 * closed-set members of annex X §X.6 that feature 100 owns and `contracts`
 * carries by right.
 */
const FORBIDDEN = Object.freeze([
  "secrets/registry",
  "secrets/env.ts",
  "secrets/file.ts",
  "secrets/keychain.ts",
  "createWave1Registry",
  "createEnvResolver",
  "createFileResolver",
  "createKeychainResolver",
  "createSecretRegistry",
  "samples/EP-10",
  "sample-secret-resolver-test-scheme",
  "config-secret-resolver-",
]);

/** The two packages this feature owns work in; everything else is scanned. */
const OWNED_BY_THIS_FEATURE = Object.freeze(["config", "testkit"]);

describe("T040 — no core file names a resolver of Wave 1, the registry or the sample", () => {
  const graph = JSON.parse(
    readFileSync(join(REPO, "packages", "contracts", "data", "package-graph.json"), "utf8"),
  ) as { packages: { name: string; core?: boolean }[] };

  const directories = readdirSync(join(REPO, "packages")).filter(
    (name) => !OWNED_BY_THIS_FEATURE.includes(name),
  );

  it("the three `core: true` packages of the graph are scanned, and so is every other package", () => {
    const core = graph.packages.filter((entry) => entry.core === true).map((entry) => entry.name);
    assert.deepEqual(core, [
      "@specstride/core",
      "@specstride/layer-micro",
      "@specstride/layer-parallel",
    ]);
    for (const name of [...core, "@specstride/contracts", "@specstride/kernel"]) {
      assert.ok(directories.includes(name.replace("@specstride/", "")), `${name} is in the scan`);
    }
    // 29 packages in this workdir, 27 of them scanned here (every one but the
    // two this feature owns work in).
    assert.ok(directories.length >= 27, `${directories.length} packages scanned`);
  });

  it("no file of any of them names a resolver of Wave 1, the registry or the sample", () => {
    const files = directories.flatMap((name) => [
      ...sourceFilesOf(join(REPO, "packages", name, "src")),
    ]);
    // The scan can never pass by reading nothing.
    assert.ok(files.length > 50, `${files.length} files scanned`);
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const name of FORBIDDEN) {
        if (text.includes(name)) hits.push(`${relative(REPO, file)} names \`${name}\``);
      }
    }
    assert.deepEqual(
      hits,
      [],
      `the resolvers of Wave 1 are reached from outside this feature's package (F110-FR-035):\n${hits.join("\n")}`,
    );
  });

  it("the skeleton packages of the scan are named, so the weight of the check is known", () => {
    const empty = directories.filter(
      (name) => sourceFilesOf(join(REPO, "packages", name, "src")).length <= 1,
    );
    // A skeleton package carries one `index.ts`; the check still reads it, and
    // it grows with the package. The list is printed rather than asserted away.
    assert.ok(
      empty.length < directories.length,
      `every package of the scan is a skeleton: ${empty.join(", ")}`,
    );
    for (const name of ["core", "layer-micro", "layer-parallel"]) {
      assert.ok(
        sourceFilesOf(join(REPO, "packages", name, "src")).length >= 1,
        `the core package ${name} has at least one file to scan`,
      );
    }
  });
});
