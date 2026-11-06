/**
 * T016 — CT-141-112: the declaration of a fixture (F141-FR-012).
 *
 * The subject is `packages/oracle/src/catalogue/fixture.ts` and
 * `packages/oracle/fixtures/assets/NOTICE`:
 *
 * - a declaration that lacks a field is refused BEFORE it runs, and so is one
 *   that names a verb which is no verb of its stub or a surface outside §O.4 or
 *   outside the surfaces of its family;
 * - an imported as-is asset carries the licence notice of its baseline: the
 *   notice is a parsed table, and an asset whose declared licence differs from
 *   the one the notice records refuses the fixture;
 * - a file of state in a template is named by its LOGICAL name and is laid out
 *   per side: at the as-is path of the compared table of feature 100 on the
 *   reference, and at the path the layout table of feature 100 gives on the port.
 *   The two paths are asserted to differ, because that is the whole point of the
 *   rule;
 * - a declaration that holds a physical path of the port's state is refused.
 *
 * Every refusal is driven through a real declaration object and a real template
 * on disk, in a fresh temporary directory per case.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ASSET_NOTICE_FILE,
  CHECKED_PORT_ENVIRONMENT,
  FixtureError,
  REQUIRED_FIXTURE_FIELDS,
  TEMPLATE_STATE_DIRECTORY,
  asIsPathOf,
  assertAssetsCarryTheirNotice,
  assertNoPhysicalPortStatePath,
  assetBaselines,
  assetIsUnchanged,
  importedAssetPath,
  layOutStateFile,
  licenceOfBaseline,
  logicalNamesWithAnAsIsPath,
  portStateMarkers,
  portStateRoots,
  readAssetNotice,
  stateFilesOfTemplate,
  validateFixture,
} from "../../src/catalogue/fixture.ts";
import { OracleDataError } from "../../src/catalogue/data.ts";

const PACKAGE = resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));

/** A declaration that holds up: the base every case of this test mutates. */
function validDeclaration(): Record<string, unknown> {
  return {
    schema: "urn:specstride:schema:internal:141:oracle-fixture/1",
    id: "FX-01/three-phases",
    system: "specstride",
    entryPoint: { reference: "front-door", port: "run" },
    command: {
      reference: ["run", "--feature", "<FIXTURE>"],
      port: ["run", "--feature", "<FIXTURE>"],
    },
    environment: { SPECSTRIDE_TICK_SECONDS: "1" },
    stubs: {
      proposer: [{ verbs: ["write", "evidence"] }],
      "critic-http": [{ verbs: ["approve"] }],
    },
    workdirTemplate: "FX-01/three-phases/workdir",
    expectedExit: 0,
    surfaces: ["exit", "stdout", "state"],
    proves: ["028 FR-005", "C-101", "B-0042"],
    os: ["linux"],
  };
}

function inATemporaryDirectory<T>(body: (root: string) => T): T {
  const root = mkdtempSync(join(tmpdir(), "oracle-fixture-"));
  try {
    return body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("CT-141-112: a declaration that holds up is accepted", () => {
  const accepted = validateFixture(validDeclaration());
  assert.equal(accepted.id, "FX-01/three-phases");
  assert.equal(accepted.family, "FX-01");
  assert.equal(accepted.scenario, "three-phases");
  assert.deepEqual([...accepted.stateFiles], []);
});

test("CT-141-112: a declaration that lacks a field is refused before it runs", () => {
  assert.ok(REQUIRED_FIXTURE_FIELDS.length >= 12, "the schema requires the fields of F141-FR-012");
  for (const field of REQUIRED_FIXTURE_FIELDS) {
    const declaration = validDeclaration();
    delete declaration[field];
    assert.throws(
      () => validateFixture(declaration),
      (error: unknown) => {
        assert.ok(error instanceof OracleDataError, `${field}: an OracleDataError`);
        assert.match((error as Error).message, new RegExp(`"${field}" is missing`), field);
        return true;
      },
      `a declaration without \`${field}\` is refused`,
    );
  }
});

test("CT-141-112: an unknown verb refuses the fixture", () => {
  for (const [stub, verb] of [
    ["proposer", "teleport"],
    ["proposer", "approve"], // a verb of the critic, not of the proposer
    ["critic-http", "write"], // a verb of the proposer, not of the critic
    ["engine", "approve"],
  ] as const) {
    const declaration = validDeclaration();
    declaration["stubs"] = { [stub]: [{ verbs: [verb] }] };
    assert.throws(
      () => validateFixture(declaration),
      new RegExp(`${verb} is no verb of ${stub}`),
      `${stub}/${verb}`,
    );
  }
  // An unknown stub is refused too.
  const unknownStub = validDeclaration();
  unknownStub["stubs"] = { oracle: [{ verbs: ["approve"] }] };
  assert.throws(() => validateFixture(unknownStub), /oracle is no stub of §O.3/);
});

test("CT-141-112: an unknown surface, and a surface outside the family, refuse the fixture", () => {
  const unknown = validDeclaration();
  unknown["surfaces"] = ["exit", "moonlight"];
  assert.throws(() => validateFixture(unknown), /"moonlight" is not one of/);

  // `telemetry` is a surface of §O.4 (S-10) and is NOT a surface of FX-01.
  const outside = validDeclaration();
  outside["surfaces"] = ["exit", "telemetry"];
  assert.throws(
    () => validateFixture(outside),
    /the surface telemetry is outside the surfaces of FX-01/,
  );

  // A declaration that cites no surface at all is refused (§O.4).
  const none = validDeclaration();
  none["surfaces"] = [];
  assert.throws(() => validateFixture(none), /surfaces/);
});

test("CT-141-112: a retired family refuses the fixture", () => {
  const retired = validDeclaration();
  retired["id"] = "FX-37/anything";
  assert.throws(() => validateFixture(retired), /FX-37 is retired/);
});

test("CT-141-112: imported assets carry the licence notice of their baseline", () => {
  // The notice exists, is parsed, and records a licence per pinned baseline.
  const notice = readAssetNotice();
  assert.ok(notice.length >= 2, "one entry per baseline");
  const baselines = assetBaselines();
  assert.deepEqual([...baselines], ["specstride@9cab15d", "mixture-of-loops@9c88f86"]);
  for (const baseline of baselines) {
    const licence = licenceOfBaseline(baseline);
    assert.equal(licence, "Apache-2.0", `${baseline} carries its licence in the notice`);
    const entry = notice.find((e) => e.baseline === baseline);
    assert.ok(entry !== undefined && entry.holder.length > 0, `${baseline} names its holder`);
  }
  // Read the notice off disk independently of the module.
  const text = readFileSync(ASSET_NOTICE_FILE, "utf8");
  for (const baseline of baselines) assert.ok(text.includes(baseline), baseline);
  assert.match(text, /Apache-2\.0/);
  assert.match(text, /MIT/, "the notice says which licence the repository itself is under");

  // An asset that declares the licence of the notice is accepted.
  const good = validDeclaration();
  good["assets"] = [
    {
      path: "fixtures/streams/claude-empty.jsonl",
      baseline: "specstride@9cab15d",
      licence: "Apache-2.0",
    },
  ];
  assert.doesNotThrow(() => assertAssetsCarryTheirNotice(good as never));
  assert.doesNotThrow(() => validateFixture(good));

  // An asset that declares another licence refuses the fixture.
  const wrong = validDeclaration();
  wrong["assets"] = [
    { path: "fixtures/streams/claude-empty.jsonl", baseline: "specstride@9cab15d", licence: "MIT" },
  ];
  assert.throws(
    () => validateFixture(wrong),
    (error: unknown) => {
      assert.ok(error instanceof FixtureError);
      assert.match(
        (error as Error).message,
        /declares the licence MIT, and the notice records Apache-2\.0/,
      );
      return true;
    },
  );

  // A baseline the schema does not know is refused by the schema.
  const unknownBaseline = validDeclaration();
  unknownBaseline["assets"] = [{ path: "x", baseline: "lisa@deadbee", licence: "Apache-2.0" }];
  assert.throws(() => validateFixture(unknownBaseline), /is not one of/);

  // An asset lies under its baseline, so the licence of a file is never in doubt.
  assert.equal(
    importedAssetPath({ path: "a/b.jsonl", baseline: "specstride@9cab15d", licence: "Apache-2.0" }),
    join(PACKAGE, "fixtures", "assets", "specstride@9cab15d", "a/b.jsonl"),
  );
  // "Unchanged" is a byte comparison, not a text one.
  const bytes = new TextEncoder().encode("one\ttwo\r\n");
  assert.equal(assetIsUnchanged(bytes, new TextEncoder().encode("one\ttwo\r\n")), true);
  assert.equal(assetIsUnchanged(bytes, new TextEncoder().encode("one\ttwo\n")), false);
});

test("CT-141-112: a file of state in a template is laid out by its logical name on each side", () => {
  inATemporaryDirectory((root) => {
    const template = join(root, "FX-01", "three-phases", "workdir");
    mkdirSync(join(template, TEMPLATE_STATE_DIRECTORY), { recursive: true });
    // The template names the file by its LOGICAL name and by no path.
    const logicalName = "feature:<slug>:notebook";
    writeFileSync(join(template, TEMPLATE_STATE_DIRECTORY, logicalName), "# notebook\n");

    const found = stateFilesOfTemplate(template);
    assert.deepEqual([...found], [logicalName]);

    // The declaration picks the template up through `validateFixture`.
    const declaration = validDeclaration();
    const accepted = validateFixture(declaration, { templateRoot: root });
    assert.deepEqual([...accepted.stateFiles], [logicalName]);

    // Laid out per side: the as-is path on the reference, the layout table of
    // feature 100 on the port. The two differ — that is the rule.
    const onReference = layOutStateFile(logicalName, "reference");
    const onPort = layOutStateFile(logicalName, "port", {
      parameters: { "<slug>": "141-parity-oracle" },
      roots: { "<workspace-part>": "/w/.specstride", "<control>": "/c" },
    });
    assert.equal(onReference, asIsPathOf(logicalName));
    assert.match(onReference, /PROGRESS\.md$/, "the as-is name of the notebook");
    assert.match(onPort, /^\/w\/\.specstride\//, "the port's path comes from the layout table");
    assert.notEqual(onReference, onPort, "the two sides lay the same name out differently");
    assert.ok(
      !onReference.includes("141-parity-oracle") || !onPort.includes("<slug>"),
      "each side is resolved on its own terms",
    );

    // Every name the compared table of feature 100 gives an as-is path can be
    // laid out on the reference, so a template may hold any of them.
    const names = logicalNamesWithAnAsIsPath();
    assert.ok(names.length >= 20, `${names.length} names have an as-is path`);
    for (const name of names) {
      assert.equal(typeof layOutStateFile(name, "reference"), "string", name);
    }

    // A template entry that is no logical name is refused: a template holds no path.
    writeFileSync(join(template, TEMPLATE_STATE_DIRECTORY, ".specstride-features-x"), "");
    assert.throws(
      () => stateFilesOfTemplate(template),
      (error: unknown) => {
        assert.ok(error instanceof FixtureError);
        assert.match((error as Error).message, /is no logical name of the layout table/);
        return true;
      },
    );
  });
});

test("CT-141-112: a logical name with no as-is path cannot come from a template", () => {
  // State that the reference does not read in the as-is form comes from steps of
  // the scenario, not from the template (F141-FR-012).
  const withoutAnAsIsPath = "user:config";
  assert.equal(asIsPathOf(withoutAnAsIsPath), undefined);
  assert.throws(
    () => layOutStateFile(withoutAnAsIsPath, "reference"),
    /has no as-is path in the compared table/,
  );
  // The port side of the very same name resolves, because the port has it.
  assert.match(
    layOutStateFile(withoutAnAsIsPath, "port", { roots: { "<user-config>": "/cfg" } }),
    /^\/cfg\//,
  );
  // A name that is no logical name at all is refused on both sides.
  for (const side of ["reference", "port"] as const) {
    assert.throws(() => layOutStateFile("not:a:name", side), /is no logical name/);
  }
});

test("CT-141-112: a physical path of the port's state refuses the fixture", () => {
  const markers = portStateMarkers();
  assert.ok(markers.length >= 6, `${markers.length} markers of the port's state`);
  // No marker is a single segment: `specstride` alone would refuse the
  // reference's own paths (the oracle's own note on DV-036).
  for (const marker of markers) {
    assert.ok(marker.includes("/"), `${marker} has more than one segment`);
    assert.notEqual(marker, ".specstride");
  }

  // Each place the declaration can hold a string is checked.
  const cases: readonly (readonly [string, (d: Record<string, unknown>) => void])[] = [
    [
      "command.port",
      (d) => {
        d["command"] = {
          reference: ["run"],
          port: ["run", "--control", "/home/x/.local/state/specstride/workspaces/w1"],
        };
      },
    ],
    [
      "command.reference",
      (d) => {
        d["command"] = {
          reference: ["run", "--out", "~/.cache/specstride/workers/w"],
          port: ["run"],
        };
      },
    ],
    [
      "environment.XDG_STATE_HOME",
      (d) => {
        d["environment"] = { XDG_STATE_HOME: "/h/.local/state/specstride/user" };
      },
    ],
    [
      "workdirTemplate",
      (d) => {
        d["workdirTemplate"] = "FX-01/x/.config/specstride/config.yaml";
      },
    ],
    [
      "prerequisites",
      (d) => {
        d["prerequisites"] = ["a writable .cache/specstride directory"];
      },
    ],
    [
      "stubs args",
      (d) => {
        d["stubs"] = {
          proposer: [
            { verbs: ["write"], args: { path: "/h/.local/state/specstride/workspaces/w/x" } },
          ],
        };
      },
    ],
  ];
  for (const [where, mutate] of cases) {
    const declaration = validDeclaration();
    mutate(declaration);
    assert.throws(
      () => validateFixture(declaration),
      (error: unknown) => {
        assert.ok(error instanceof FixtureError, `${where}: a FixtureError`);
        assert.match(
          (error as Error).message,
          /holds the physical path of the port's state/,
          where,
        );
        assert.match((error as Error).message, new RegExp(where.split(" ")[0] ?? ""), where);
        return true;
      },
      `a declaration that holds the port's state at ${where} is refused`,
    );
  }

  // The resolved roots of a real environment are refused as well, not only the
  // fragments: a fixture cannot escape by writing an absolute path.
  const env = { home: "/h", workspaceRealPath: "/w", workspaceId: "ws-1" };
  const roots = portStateRoots(env);
  assert.ok(roots.includes("/w/.specstride"), "the workspace part of a real environment");
  for (const root of roots) {
    const declaration = validDeclaration() as unknown as Parameters<
      typeof assertNoPhysicalPortStatePath
    >[0];
    (declaration as unknown as Record<string, unknown>)["workdirTemplate"] = `${root}/thing`;
    assert.throws(() => assertNoPhysicalPortStatePath(declaration, env), FixtureError, root);
  }

  // The reference's own as-is state paths are NOT refused: the as-is state
  // placeholder of the compared table and the legacy directory name of the
  // Specstride baseline are the reference's, not the port's.
  const reference = validDeclaration();
  reference["command"] = {
    reference: ["run", "--state", "<WORK>/.specstride/features/x/PROGRESS.md"],
    port: ["run"],
  };
  assert.doesNotThrow(
    () => validateFixture(reference),
    "the as-is legacy state directory of the baseline is no path of the port's state",
  );
  // And the placeholder form of the checked environment matches nothing.
  assert.ok(portStateRoots(CHECKED_PORT_ENVIRONMENT).every((r) => r.includes("<")));
});
