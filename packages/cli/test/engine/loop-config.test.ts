/**
 * The loop configuration of a run (F115-FR-001): `micro` is the default of
 * the catalogue, a project file `specstride.yaml` with `loop.strategy:
 * classic` selects the classic loop, and the caps come from the
 * `loop.micro.caps.*` keys with the catalogue defaults where the
 * configuration is silent.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { ConfigValueError, loadConfigFiles } from "@specstride/config";
import { loopConfigurationOf } from "../../src/engine/loop-config.ts";

function fixture(projectFile?: string): { readonly home: string; readonly dir: string } {
  const root = mkdtempSync(join(tmpdir(), "specstride-loopcfg-"));
  const home = join(root, "home");
  const dir = join(root, "work");
  mkdirSync(home);
  mkdirSync(dir);
  if (projectFile !== undefined) writeFileSync(join(dir, "specstride.yaml"), projectFile);
  return { home, dir: root && dir };
}

/** The fixture whose configuration sits in the USER file, as a real install has it. */
function fixtureWithUserFile(userFile: string): { readonly home: string; readonly dir: string } {
  const root = mkdtempSync(join(tmpdir(), "specstride-loopcfg-"));
  const home = join(root, "home");
  const dir = join(root, "work");
  mkdirSync(join(home, ".config", "specstride"), { recursive: true });
  mkdirSync(dir);
  writeFileSync(join(home, ".config", "specstride", "config.yaml"), userFile);
  return { home, dir: root && dir };
}

const ENV: NodeJS.ProcessEnv = { PATH: process.env.PATH ?? "" };

test("with no configuration file the strategy is micro, the default of the catalogue", () => {
  const { home, dir } = fixture();
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(loop.strategy, "micro");
    assert.equal(loop.source, "default");
    assert.equal(loop.configuredValue, undefined);
    assert.equal(loop.closingCheck, true);
    assert.deepEqual(loop.caps, {
      repairs: 2,
      proposalMinutes: 20,
      unitMinutes: 30,
      cyclesExtra: 6,
      cyclesMin: 12,
      unresolvedUnits: 2,
    });
  } finally {
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

test("a project file with loop.strategy: classic selects the classic loop", () => {
  const { home, dir } = fixture("schema: 1\nloop:\n  strategy: classic\n");
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(loop.strategy, "classic");
    assert.equal(loop.source, "configured");
    assert.equal(loop.configuredValue, "classic");
  } finally {
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

test("the caps of the project file replace the defaults they name, and only them", () => {
  const { home, dir } = fixture(
    "schema: 1\nloop:\n  strategy: micro\n  micro:\n    caps:\n      repairs: 0\n      unresolvedUnits: 1\n",
  );
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(loop.strategy, "micro");
    assert.equal(loop.source, "configured");
    assert.equal(loop.caps.repairs, 0);
    assert.equal(loop.caps.unresolvedUnits, 1);
    assert.equal(loop.caps.cyclesMin, 12, "an unnamed cap keeps its default");
  } finally {
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

test("the closing-check switch reads loop.micro.closing_check", () => {
  const { home, dir } = fixture("schema: 1\nloop:\n  micro:\n    closing_check: false\n");
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(loop.closingCheck, false);
    assert.equal(loop.strategy, "micro");
  } finally {
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

test("the units switch reads the boolean true of the user file as on", () => {
  // The form the campaign of feature 153 runs on: the user file carries the
  // boolean, and the merge delivers it engaged to the rank the layer reads.
  const { home, dir } = fixtureWithUserFile("schema: 1\nloop:\n  parallel:\n    units: true\n");
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(loop.parallel.units.userConfiguration, "on");
  } finally {
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

test("the string switch word of the units switch is refused, and the refusal is recorded", () => {
  // The campaign incident of feature 153: `units: "on"` where a boolean was
  // declared engaged nothing, silently. The switch word is no value of a
  // boolean key: the loader refuses it as a type error it RECORDS, and the
  // rank is left out rather than filled with a foreign value.
  const { home, dir } = fixtureWithUserFile('schema: 1\nloop:\n  parallel:\n    units: "on"\n');
  try {
    const loaded = loadConfigFiles({
      home,
      workspaceRealPath: realpathSync(dir),
      startDir: dir,
    });
    const refusal = (loaded.user?.errors ?? []).find(
      (error) => error instanceof ConfigValueError && error.key === "loop.parallel.units",
    );
    assert.ok(refusal !== undefined, "the type refusal of the string switch word is recorded");
    assert.match(refusal.range, /on, off/);
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(loop.parallel.units.userConfiguration, undefined);
  } finally {
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

test("the project file may turn the units switch off, which is the stricter value", () => {
  // F110-FR-018: the switch is of the class narrowing, and off is the
  // stricter value — the project file may narrow a run to sequential.
  const { home, dir } = fixture("schema: 1\nloop:\n  parallel:\n    units: false\n");
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(loop.parallel.units.projectConfiguration, "off");
  } finally {
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

test("the project file may not turn the units switch on: it narrows, it never widens", () => {
  // F110-FR-017/-FR-018: on is looser than the ranks below, so a project
  // file asking for parallel units is ignored — engagement is the user's
  // decision (or a flag), never the repository's.
  const { home, dir } = fixture("schema: 1\nloop:\n  parallel:\n    units: true\n");
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(loop.parallel.units.projectConfiguration, undefined);
  } finally {
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});
