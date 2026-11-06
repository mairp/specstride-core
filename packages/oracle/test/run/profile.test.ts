/**
 * CT-141-104 — the port runs under the profile `parity` by ordinary
 * configuration (T025, F141-FR-004).
 *
 * What the test proves.
 *
 * - **the profile, by ordinary configuration**: the configuration the driver
 *   writes for the port side selects the named profile `parity` of feature 100
 *   through the ordinary key `profile`, and the driver writes it to the ordinary
 *   configuration file of the run's own config home — not to a switch of the
 *   oracle's own;
 * - **nothing else is set**: every key of the configuration is either `profile`,
 *   a key of the parity profile of feature 100, or a key the fixture declares.
 *   `assertNothingBeyondTheProfileOrTheFixture` refuses anything else;
 * - **the engine stub is named through row 41**: the only way the oracle names the
 *   engine stub is the key of row 41 of the profile, and that row is read from
 *   `@specstride/contracts/profile/parity` — the data of feature 100 — and never
 *   from a table of the oracle's own;
 * - **a switch, variable or code path for the oracle alone fails**: the static
 *   check of `src/release/no-oracle-path.ts` passes over this repository as it
 *   stands, and FAILS on a product tree that offers a flag, a variable, a
 *   configuration key, a code path, an import or a dependency for the oracle.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { profileRow, profileRows } from "@specstride/contracts/profile/parity";

import {
  DriverError,
  ENGINE_SWITCH_KEY,
  ENGINE_SWITCH_ROW,
  NO_SUCH_COMMAND,
  PARITY_PROFILE,
  PATH_GUARD,
  PORT_CONFIGURATION_FILE,
  PRODUCT_BIN,
  PRODUCT_COMMAND_PACKAGE,
  STUB_BIN_SOURCE,
  assertNothingBeyondTheProfileOrTheFixture,
  buildProductBin,
  buildStubBin,
  denyMachineImplementations,
  engineStubForThePort,
  parityProfileKeys,
  portConfiguration,
  productCommandLine,
  sideIsAvailable,
  stubExecutablesOfSide,
} from "../../src/run/driver.ts";
import { engineExecutableName, stubExecutableNames } from "../../stubs/lib/names.ts";
import { SYSTEM_PATH_DIRECTORIES } from "../../src/env/hermetic.ts";
import {
  NoOraclePathError,
  ORACLE_ONLY_MARKERS,
  REPOSITORY_ROOT,
  assertNoOraclePath,
  isProse,
  productOffersNothingForTheOracleAlone,
  productPackageHoldsNoFileOfTheOracle,
} from "../../src/release/no-oracle-path.ts";

test("CT-141-104: the port side selects the profile `parity` by the ordinary key `profile`", () => {
  const configuration = portConfiguration({});
  assert.equal(configuration["profile"], PARITY_PROFILE);
  assert.equal(PARITY_PROFILE, "parity");
  // The key is `profile`, the ordinary selection, and the configuration holds
  // nothing else at all when the fixture declares nothing.
  assert.deepEqual(Object.keys(configuration), ["profile"]);
  // And it is written to the ordinary configuration file of the run's config home.
  assert.equal(PORT_CONFIGURATION_FILE, join("specstride", "config.json"));
});

test("CT-141-104: the configuration the driver writes is the ordinary configuration file", () => {
  const configHome = mkdtempSync(join(tmpdir(), "oracle-config-"));
  const file = join(configHome, PORT_CONFIGURATION_FILE);
  mkdirSync(dirname(file), { recursive: true });
  const configuration = portConfiguration({ declaredKeys: { "run.maxIterations": "3" } });
  writeFileSync(file, `${JSON.stringify(configuration, null, 1)}\n`, "utf8");
  const readBack = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
  assert.equal(readBack["profile"], "parity");
  assert.equal(readBack["run.maxIterations"], "3");
});

test("CT-141-104: nothing beyond the profile or the fixture may be set", () => {
  // A key of the profile is allowed.
  const ofTheProfile = parityProfileKeys()[0] as string;
  assertNothingBeyondTheProfileOrTheFixture({ profile: "parity", [ofTheProfile]: "x" }, {});
  // A key the fixture declares is allowed.
  assertNothingBeyondTheProfileOrTheFixture(
    { profile: "parity", "fixture.only": "x" },
    { "fixture.only": "x" },
  );
  // Anything else is refused, by name.
  assert.throws(
    () => assertNothingBeyondTheProfileOrTheFixture({ profile: "parity", "oracle.mode": "on" }, {}),
    (error: unknown) =>
      error instanceof DriverError &&
      /oracle\.mode.*neither the parity profile/s.test(error.message),
  );
  // A key the fixture did NOT declare is refused even when it looks like one.
  assert.throws(
    () =>
      assertNothingBeyondTheProfileOrTheFixture(
        { profile: "parity", "fixture.only": "x" },
        { "something.else": "y" },
      ),
    DriverError,
  );
});

test("CT-141-104: the engine stub is named through row 41 of the profile and through nothing else", () => {
  assert.equal(ENGINE_SWITCH_ROW, 41);
  const row = profileRow(ENGINE_SWITCH_ROW);
  assert.ok(row !== undefined, "row 41 of the parity profile of feature 100 exists");
  assert.ok(
    row.keys.includes(ENGINE_SWITCH_KEY),
    `row 41 names ${ENGINE_SWITCH_KEY}; it names ${row.keys.join(", ")}`,
  );
  const configuration = portConfiguration({ engineStub: "specstride" });
  assert.equal(configuration[ENGINE_SWITCH_KEY], "specstride");
  assert.deepEqual(Object.keys(configuration).sort(), ["engine.executable", "profile"]);
  // The key is the one of the row, so a renamed row renames the switch: the oracle
  // holds no copy of it.
  assert.equal(
    ENGINE_SWITCH_KEY,
    row.keys.find((k) => k === ENGINE_SWITCH_KEY),
  );
});

test("CT-141-104: the keys the oracle may set come from the data of feature 100", () => {
  const keys = parityProfileKeys();
  assert.ok(keys.length > 0);
  // Exactly the keys of the rows of `@specstride/contracts/profile/parity`.
  assert.deepEqual([...keys].sort(), [...profileRows.flatMap((r) => [...r.keys])].sort());
});

test("CT-141-104: the product offers nothing for the oracle alone in this repository", () => {
  assert.deepEqual([...productOffersNothingForTheOracleAlone()], []);
  assert.deepEqual([...productPackageHoldsNoFileOfTheOracle()], []);
  assertNoOraclePath();
});

test("CT-141-104: a switch, variable or code path for the oracle alone is caught", () => {
  const caught = (line: string): readonly string[] =>
    ORACLE_ONLY_MARKERS.filter((m) => m.marker.test(line)).map((m) => m.what);
  assert.deepEqual(caught("if (config.get('oracle.mode')) {"), [
    "a configuration key for the oracle alone",
  ]);
  assert.deepEqual(caught("const on = process.env.SPECSTRIDE_ORACLE === '1';"), [
    "a variable for the oracle alone",
  ]);
  assert.deepEqual(caught("const dir = process.env.ORACLE_STUB_SCRIPT_DIR;"), [
    "a variable of the stub kit of the oracle",
  ]);
  assert.deepEqual(caught("if (oracleMode) return;"), ["a code path for the oracle alone"]);
  assert.deepEqual(caught("program.option('--oracle');"), ["a flag for the oracle alone"]);
  assert.deepEqual(caught('import { compare } from "@specstride/oracle";'), [
    "an import of the package of the oracle",
  ]);
  assert.deepEqual(caught('  "@specstride/oracle": "*",'), [
    "a dependency on the package of the oracle",
  ]);
  // The entry of the package graph that DECLARES the oracle to be at layer `dev`
  // is the registry F141-FR-045 is checked against, and is no finding.
  assert.deepEqual(caught('  "name": "@specstride/oracle",'), []);
  // Prose is no code path.
  assert.ok(isProse(" * the oracle runs the product under the profile `parity`"));
  assert.ok(isProse("// --oracle is not a flag of this product"));
  assert.ok(!isProse("const x = 1; // --oracle"));
});

test("CT-141-104: the static check FAILS on a product tree that offers a path for the oracle", () => {
  const root = mkdtempSync(join(tmpdir(), "oracle-fake-product-"));
  // The smallest tree the check reads: the package graph of feature 100, a product
  // package with one source file, and the manifest of the oracle.
  mkdirSync(join(root, "packages", "contracts", "data"), { recursive: true });
  writeFileSync(
    join(root, "packages", "contracts", "data", "package-graph.json"),
    JSON.stringify({
      packages: [
        { name: "@specstride/kernel", layer: "core", published: true },
        { name: "@specstride/oracle", layer: "dev", published: false },
      ],
    }),
    "utf8",
  );
  mkdirSync(join(root, "packages", "kernel", "src"), { recursive: true });
  writeFileSync(
    join(root, "packages", "kernel", "src", "run.ts"),
    ["export function run(): void {", "  if (oracleMode) return;", "}", ""].join("\n"),
    "utf8",
  );
  const findings = productOffersNothingForTheOracleAlone(root);
  assert.ok(
    findings.some((f) => f.what === "a code path for the oracle alone"),
    `the check found ${JSON.stringify(findings)}`,
  );
  assert.throws(() => assertNoOraclePath(root), NoOraclePathError);
});

test("CT-141-104: the as-is engine command never stands on the PORT's search path", () => {
  // The name of the engine stub IS the name of the product's own command line, so a
  // link to the stub in front of it would make every scenario whose port command is
  // the product's front door run the ORACLE instead of the product: the oracle would
  // compare itself with the reference. The port's set of stub executables therefore
  // leaves that one name out, and no other.
  const engine = engineExecutableName();
  assert.ok(stubExecutableNames().includes(engine), "the reference's set holds the engine command");
  assert.deepEqual(
    [...stubExecutablesOfSide("reference")],
    [...stubExecutableNames()],
    "the reference gets every stub executable",
  );
  assert.deepEqual(
    [...stubExecutablesOfSide("port")],
    stubExecutableNames().filter((name) => name !== engine),
    "the port gets every stub executable but the as-is engine command",
  );
  // And the directory the driver links is built that way, so the search path of the
  // port holds no file of that name at all.
  const source = mkdtempSync(join(tmpdir(), "oracle-stub-source-"));
  for (const name of stubExecutableNames())
    writeFileSync(join(source, name), "#!/usr/bin/env node\n");
  const ofTheReference = mkdtempSync(join(tmpdir(), "oracle-bin-reference-"));
  const ofThePort = mkdtempSync(join(tmpdir(), "oracle-bin-port-"));
  buildStubBin(ofTheReference, source, "reference");
  buildStubBin(ofThePort, source, "port");
  assert.ok(readdirSync(ofTheReference).includes(engine));
  assert.ok(!readdirSync(ofThePort).includes(engine), `${engine} is linked on the port's path`);
  assert.deepEqual(
    readdirSync(ofThePort).sort(),
    [...stubExecutablesOfSide("port")].sort(),
    "every other stub still stands first on the port's search path",
  );
});

test("CT-141-104: row 41 names the engine stub BY PATH on the port, which is the one way it reaches it", () => {
  // Because the name is not on the port's search path, the switch of row 41 carries
  // the path of the stub executable and not a bare name (F141-FR-004).
  const resolved = engineStubForThePort(engineExecutableName());
  assert.equal(resolved, join(STUB_BIN_SOURCE, engineExecutableName()));
  assert.ok(existsSync(resolved), `${resolved} is the generated stub executable of T044`);
  // A value that is already a path is left as it is.
  assert.equal(engineStubForThePort("/opt/engine/specstride"), "/opt/engine/specstride");
  // And the configuration the port is given still names it through row 41 and
  // through no switch of the oracle's own.
  const configuration = portConfiguration({ engineStub: resolved });
  assert.equal(configuration[ENGINE_SWITCH_KEY], resolved);
  assert.deepEqual(Object.keys(configuration).sort(), ["engine.executable", "profile"]);
});

test("CT-141-104: nothing installed on the machine answers a name the port does not stub", () => {
  // A development machine may have an as-is command installed: this one has
  // /usr/local/bin/specstride, a wrapper that executes the Specstride baseline out of a
  // live clone. The port does not stub that name, so without a refusal the port of a
  // scenario would reach the machine's own baseline and be compared as though it were
  // the product (F141-FR-003, F141-FR-038).
  const engine = engineExecutableName();
  const ofTheReference = mkdtempSync(join(tmpdir(), "oracle-guard-reference-"));
  const reference = denyMachineImplementations(ofTheReference, "reference");
  assert.equal(reference.dir, undefined, "the reference stubs every as-is name, so it needs none");
  assert.deepEqual([...reference.refused], []);

  const runRoot = mkdtempSync(join(tmpdir(), "oracle-guard-port-"));
  const port = denyMachineImplementations(runRoot, "port");
  assert.equal(port.dir, join(runRoot, PATH_GUARD));
  assert.deepEqual([...port.refused], [engine]);
  assert.ok((statSync(join(port.dir as string, engine)).mode & 0o111) !== 0, "it is executable");

  // The refusal wins over whatever the system directories hold, and says why.
  const result = spawnSync(engine, ["contract", "derive"], {
    env: {
      PATH: [port.dir as string, ...SYSTEM_PATH_DIRECTORIES].join(":"),
      HOME: runRoot,
    },
    encoding: "utf8",
    shell: false,
  });
  assert.equal(result.status, NO_SUCH_COMMAND);
  assert.match(result.stderr, /no such command in the hermetic environment of the oracle/);
  assert.match(result.stderr, /F141-FR-003/);
  assert.equal(result.stdout, "");
});

test("CT-141-104: the port is driven on the COMMAND its scenario names, read off the manifest of the product's command line", () => {
  // The oracle asks the product's own manifest two things and nothing else: which
  // executable the command line is (`bin`), and which commands of CLI protocol 1 this
  // build has (`specstride.commands`). There is no switch, variable or code path of
  // the oracle's in the product (F141-FR-004) — the manifest is ordinary metadata that
  // a caller with only the package can read.
  const line = productCommandLine(REPOSITORY_ROOT);
  assert.ok(line !== undefined, `${PRODUCT_COMMAND_PACKAGE} carries the product's command line`);
  const executable = line.executables["specstride"];
  assert.ok(typeof executable === "string", "the manifest names the executable");
  assert.ok(
    existsSync(join(REPOSITORY_ROOT, PRODUCT_COMMAND_PACKAGE, executable as string)),
    "the executable the manifest names is on disk",
  );
  // A command the build declares is driven; one it does not is a SKIP WITH ITS REASON
  // and never a pass, and the reason names the command and the rule (F141-FR-037).
  for (const command of line.commands) {
    assert.equal(
      sideIsAvailable("port", REPOSITORY_ROOT, command),
      undefined,
      `the port is available for \`${command}\``,
    );
  }
  const absent = sideIsAvailable("port", REPOSITORY_ROOT, "launch");
  assert.ok(absent !== undefined, "a command of CLI protocol 1 the build has not got");
  assert.match(absent.reason, /does not have the command `launch`/);
  assert.match(absent.reason, /F141-FR-037/);
  assert.match(absent.reason, /F141-FR-026/);
  // And a tree with no command line at all is a skip with its own reason.
  const empty = mkdtempSync(join(tmpdir(), "oracle-no-product-"));
  assert.match(
    sideIsAvailable("port", empty, "contract derive")?.reason ?? "",
    /the product's command line is not in/,
  );
  // A manifest that names no executable is one too.
  mkdirSync(join(empty, PRODUCT_COMMAND_PACKAGE), { recursive: true });
  writeFileSync(
    join(empty, PRODUCT_COMMAND_PACKAGE, "package.json"),
    JSON.stringify({ name: "@specstride/cli", specstride: { commands: ["contract derive"] } }),
    "utf8",
  );
  assert.match(
    sideIsAvailable("port", empty, "contract derive")?.reason ?? "",
    /names no executable of the product's command line/,
  );
});

test("CT-141-104: the product's own command answers its own name on the port, and the machine's never does", () => {
  // Three things have to hold together on the port's search path, in this order: a
  // stub of the scenario first (§O.3, rule 3), then the product's own front door, then
  // the refusal that keeps an implementation installed on the MACHINE out of the run
  // (F141-FR-003). The `product-bin` of the run is the middle one.
  const runRoot = mkdtempSync(join(tmpdir(), "oracle-product-bin-"));
  const product = buildProductBin(runRoot, REPOSITORY_ROOT);
  assert.equal(product.dir, join(runRoot, PRODUCT_BIN));
  assert.deepEqual([...product.linked], [join(runRoot, PRODUCT_BIN, "specstride")]);
  const guard = denyMachineImplementations(runRoot, "port");
  assert.deepEqual([...guard.refused], [engineExecutableName()]);
  // With the product's directory ahead of the refusal the product answers, and the
  // machine's installed baseline never gets the chance.
  const path = [product.dir as string, guard.dir as string, ...SYSTEM_PATH_DIRECTORIES].join(":");
  const home = mkdtempSync(join(tmpdir(), "oracle-product-home-"));
  const ran = spawnSync(engineExecutableName(), ["contract", "derive"], {
    env: { PATH: path, HOME: home },
    encoding: "utf8",
    shell: false,
  });
  // It is the product that answered: `--repo` is required of `contract derive`
  // (F107-FR-002), so the command refuses its own call and never the oracle's guard.
  assert.notEqual(ran.status, NO_SUCH_COMMAND);
  assert.doesNotMatch(ran.stderr, /no such command in the hermetic environment/);
  assert.match(ran.stderr, /--repo is required/);
  // Behind the product's directory the refusal is still there: with only the guard on
  // the search path the name is answered by it and by nothing of the machine.
  const withoutTheProduct = spawnSync(engineExecutableName(), ["contract", "derive"], {
    env: { PATH: [guard.dir as string, ...SYSTEM_PATH_DIRECTORIES].join(":"), HOME: home },
    encoding: "utf8",
    shell: false,
  });
  assert.equal(withoutTheProduct.status, NO_SUCH_COMMAND);
  assert.match(withoutTheProduct.stderr, /F141-FR-003/);
  // A tree that carries no command line gets no directory and no change of path, so a
  // side is never given an empty directory to look in.
  const noProduct = mkdtempSync(join(tmpdir(), "oracle-product-absent-"));
  const none = buildProductBin(mkdtempSync(join(tmpdir(), "oracle-run-")), noProduct);
  assert.equal(none.dir, undefined);
  assert.deepEqual([...none.linked], []);
});
