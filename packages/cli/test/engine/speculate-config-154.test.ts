/**
 * T143 — the speculation keys of the loop configuration (F154-FR-062, -066;
 * CQ-154-18 A): `loop.speculate` reads OFF by default and OFF under the
 * `parity` profile whatever a source holds (F154-FR-001); `depth`, `window`
 * and `minRate` read their defaults 1, 20 and 50 where no source holds them,
 * and a whole-number source value where one does.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { loopConfigurationOf } from "../../src/engine/loop-config.ts";

function fixtureWithUserFile(userFile?: string): { readonly home: string; readonly dir: string } {
  const root = mkdtempSync(join(tmpdir(), "specstride-speculate-cfg-"));
  const home = join(root, "home");
  const dir = join(root, "work");
  if (userFile !== undefined) {
    mkdirSync(join(home, ".config", "specstride"), { recursive: true });
    writeFileSync(join(home, ".config", "specstride", "config.yaml"), userFile);
  }
  mkdirSync(dir);
  return { home, dir };
}

const ENV: NodeJS.ProcessEnv = { PATH: process.env.PATH ?? "" };

function cleanup(home: string, _dir: string): void {
  rmSync(join(home, ".."), { recursive: true, force: true });
}

test("with no source the switch is off and the keys hold the defaults (CQ-154-18 A)", () => {
  const { home, dir } = fixtureWithUserFile();
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(loop.speculate.on, false);
    assert.equal(loop.speculate.depth, 1);
    assert.equal(loop.speculate.window, 20);
    assert.equal(loop.speculate.minRatePerCent, 50);
  } finally {
    cleanup(home, dir);
  }
});

test("a user file holds the key values (the switch stays at its default)", () => {
  const { home, dir } = fixtureWithUserFile(
    'schema: 1\n"loop.speculate.depth": 2\n"loop.speculate.window": 40\n"loop.speculate.minRate": 25\n',
  );
  try {
    // The switch itself: no source held it here, and it stays off — it turns
    // on only by a value of its own (`loop.speculate: true`).
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(loop.speculate.on, false);
    assert.equal(loop.speculate.depth, 2);
    assert.equal(loop.speculate.window, 40);
    assert.equal(loop.speculate.minRatePerCent, 25);
  } finally {
    cleanup(home, dir);
  }
});

test("the switch reads on when a source holds loop.speculate: true", () => {
  const { home, dir } = fixtureWithUserFile("schema: 1\nloop:\n  speculate: true\n");
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(loop.speculate.on, true);
    assert.equal(loop.speculate.depth, 1);
  } finally {
    cleanup(home, dir);
  }
});

test("under the parity profile the switch is off whatever a source holds (F154-FR-001)", () => {
  const { home, dir } = fixtureWithUserFile(
    "schema: 1\nprofile: parity\nloop:\n  speculate: true\n",
  );
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(loop.speculate.on, false);
  } finally {
    cleanup(home, dir);
  }
});

test("a foreign key value falls back to its default, never an error (F154-FR-004)", () => {
  const { home, dir } = fixtureWithUserFile(
    'schema: 1\nloop:\n  speculate: true\n"loop.speculate.depth": 0\n',
  );
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(loop.speculate.on, true);
    assert.equal(loop.speculate.depth, 1);
    assert.equal(loop.speculate.window, 20);
    assert.equal(loop.speculate.minRatePerCent, 50);
  } finally {
    cleanup(home, dir);
  }
});
