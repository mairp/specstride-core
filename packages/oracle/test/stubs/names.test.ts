/**
 * CT-141-106 — the names of the stub executables (T026, T044; F141-FR-006,
 * F141-FR-010).
 *
 * What the test proves.
 *
 * - **as-is commands and `stub-harness`**: the set of names is exactly the as-is
 *   commands of the harness stubs (`claude`, `dsh`, `codex`, `prime-agent`,
 *   `prime`, `pi`), the one generic name `stub-harness`, and the as-is engine
 *   command. A stub is found on the search path under the name the side it runs
 *   calls, which is what makes the same stub serve both sides;
 * - **the set is data**: every name comes from
 *   `packages/oracle/data/stub-vocabulary.json`, read back off disk here and
 *   compared with what the module gives; and `packages/oracle/stubs/bin/` holds
 *   one node-shebang file per name, byte for byte what the generator writes
 *   (T044), executable, and nothing stale;
 * - **a fixture that enumerates harnesses reads the registry**: asking the set of
 *   stub names for the list of supported harnesses FAILS with the name of what to
 *   read instead, and `harnessesOfTheRegistry` reads the registry of each side
 *   from the file of that side — the backend registry of the baseline on the
 *   reference, the harness registry of the product on the port.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  accessSync,
  constants,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  GENERIC_STUB_NAME,
  REGISTRY_SOURCE,
  StubNameError,
  assertNotAListOfSupportedHarnesses,
  engineExecutableName,
  harnessOfExecutable,
  harnessStubExecutables,
  harnessesOfTheRegistry,
  sidesOfHarnessStub,
  stubExecutableNames,
} from "../../stubs/lib/names.ts";
import {
  STUB_BIN_DIR,
  STUB_BIN_MODE,
  binFileContent,
  staleStubBinFiles,
  writeStubBinFiles,
} from "../../stubs/lib/bin-files.ts";

const PACKAGE = resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
const VOCABULARY = JSON.parse(readFileSync(join(PACKAGE, "data/stub-vocabulary.json"), "utf8")) as {
  harnessStubs: { harness: string; executables: string[]; sides: string }[];
  engineExecutable: string;
};

test("CT-141-106: the names are the as-is commands, `stub-harness` and the engine command", () => {
  assert.deepEqual(
    [...stubExecutableNames()],
    ["claude", "dsh", "codex", "prime-agent", "prime", "pi", "stub-harness", "specstride"],
  );
  assert.equal(GENERIC_STUB_NAME, "stub-harness");
  assert.ok(stubExecutableNames().includes(GENERIC_STUB_NAME));
  assert.equal(engineExecutableName(), "specstride");
  // Each as-is command belongs to its harness; the engine command to none.
  assert.equal(harnessOfExecutable("claude"), "claude");
  assert.equal(harnessOfExecutable("prime-agent"), "prime");
  assert.equal(harnessOfExecutable("stub-harness"), "generic");
  assert.equal(harnessOfExecutable("specstride"), undefined);
  // The pi stub is offered on the port side only (F141-FR-010).
  assert.match(sidesOfHarnessStub("pi"), /port only/);
  assert.equal(sidesOfHarnessStub("claude"), "both");
});

test("CT-141-106: the set is data, read from `data/stub-vocabulary.json` and nowhere else", () => {
  const fromTheFile = [
    ...VOCABULARY.harnessStubs.flatMap((entry) => entry.executables),
    VOCABULARY.engineExecutable,
  ];
  assert.deepEqual([...stubExecutableNames()], fromTheFile);
  assert.deepEqual(
    [...harnessStubExecutables()],
    [...VOCABULARY.harnessStubs.flatMap((e) => e.executables)],
  );
  // Every name is in the data file: no module adds one of its own.
  const text = readFileSync(join(PACKAGE, "data/stub-vocabulary.json"), "utf8");
  for (const name of stubExecutableNames()) {
    assert.ok(text.includes(`"${name}"`), `${name} is named in the data file`);
  }
});

test("CT-141-106 / T044: `stubs/bin/` holds one node-shebang file per name, from the data", () => {
  const onDisk = readdirSync(STUB_BIN_DIR).sort();
  assert.deepEqual(onDisk, [...stubExecutableNames()].sort());
  for (const name of stubExecutableNames()) {
    const file = join(STUB_BIN_DIR, name);
    const content = readFileSync(file, "utf8");
    assert.ok(content.startsWith("#!/usr/bin/env node\n"), `${name} is a node-shebang file`);
    assert.equal(content, binFileContent(name), `${name} is what the generator writes`);
    // The only line of its own is the name it was called by.
    assert.ok(
      content.includes(`harnessMain(${JSON.stringify(name)});`),
      `${name} hands over to harnessMain under its own name`,
    );
    assert.equal(statSync(file).mode & 0o777, STUB_BIN_MODE);
    accessSync(file, constants.X_OK);
  }
  assert.deepEqual([...staleStubBinFiles()], []);
});

test("CT-141-106 / T044: the generator writes the same bytes again, into a fresh directory", () => {
  const dir = mkdtempSync(join(tmpdir(), "oracle-stub-bin-"));
  const written = writeStubBinFiles(dir);
  assert.equal(written.length, stubExecutableNames().length);
  for (const name of stubExecutableNames()) {
    assert.equal(
      readFileSync(join(dir, name), "utf8"),
      readFileSync(join(STUB_BIN_DIR, name), "utf8"),
      `${name} on disk and ${name} as generated agree`,
    );
  }
  assert.deepEqual([...staleStubBinFiles(dir)], []);
});

test("CT-141-106: the set of stub names is not a list of supported harnesses", () => {
  assert.throws(
    () => assertNotAListOfSupportedHarnesses("FX-14 enumerates the harnesses"),
    (error: unknown) =>
      error instanceof StubNameError &&
      /is not a list of the harnesses the product\s+supports/.test(error.message) &&
      /harnessesOfTheRegistry/.test(error.message),
  );
});

test("CT-141-106: a fixture that enumerates harnesses reads the registry of its side", () => {
  assert.equal(REGISTRY_SOURCE.reference, "lib/backends.py");
  assert.equal(REGISTRY_SOURCE.port, "packages/harness/src/registry.ts");
  // A root that holds no registry gives a reading with its reason and no entries —
  // never the set of stub names.
  const empty = mkdtempSync(join(tmpdir(), "oracle-no-registry-"));
  for (const side of ["reference", "port"] as const) {
    const reading = harnessesOfTheRegistry(side, empty);
    assert.deepEqual([...reading.entries], []);
    assert.match(reading.unread ?? "", /reads the registry of the\s+side it runs/);
    assert.equal(reading.source, REGISTRY_SOURCE[side]);
  }
});

test("CT-141-106: the registry of the reference is read from the baseline's backends module", () => {
  const root = mkdtempSync(join(tmpdir(), "oracle-registry-"));
  mkdirSync(join(root, "lib"), { recursive: true });
  writeFileSync(
    join(root, "lib", "backends.py"),
    [
      "REGISTRY = (",
      '    Backend("claude", prompt="argument"),',
      '    Backend("dsh", prompt="argument"),',
      '    Backend("locally-registered", prompt="argument"),',
      ")",
      "",
    ].join("\n"),
    "utf8",
  );
  const reading = harnessesOfTheRegistry("reference", root);
  assert.deepEqual([...reading.entries], ["claude", "dsh", "locally-registered"]);
  // The registry of the reference holds a backend the set of stub names does not:
  // the two sets differ, which is why a fixture may never read the stub names
  // (DV-064).
  assert.ok(!stubExecutableNames().includes("locally-registered"));
});
