/**
 * The first tests of `@specstride/host-kit` — the package registration and
 * the re-export of the host-port contract.
 *
 * Two things are held here, each against an independent read path:
 *
 * 1 THE RE-EXPORT IS THE CONTRACT. `src/index.ts` binds a plugin to the host
 *   port EP-01 and to row 144 by re-exporting `@specstride/contracts`; this
 *   file imports the same two modules of contracts DIRECTLY and holds the
 *   re-export equal to them, so the kit can never publish a value that
 *   drifted from the port (a value of the kit that the contract does not
 *   hold is a fork of the contract, which the split forbids).
 *
 * 2 THE PACKAGE IS WHAT THE GRAPH SAYS. The dependency rule of the split is
 *   "a plugin depends on core's packed packages at one exact version, and on
 *   nothing else of core", so the manifest of the kit declares exactly one
 *   dependency, at an exact version, and the graph entry is L1 with
 *   `mayImport` exactly `@specstride/contracts` — the entry the
 *   import-boundary check enforces (`check:imports`).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as hostKit from "../src/index.ts";
import {
  CLI_PROTOCOL_VERSION,
  HOST_SKILL_IDS,
  DOCTOR_SKILL_ID,
  OPERATIONS,
  PROTOCOL_MISMATCH_LINE,
  PROTOCOL_MISMATCH_EXIT_CODE,
  POINT_ID,
} from "@specstride/contracts/ep/host";
import { HOST_SKILL_AND_ENTRY_IDS } from "@specstride/contracts/ep/context-cost";

const HERE = dirname(fileURLToPath(import.meta.url)); // packages/host-kit/test
const PKG = dirname(HERE); // packages/host-kit
const ROOT = dirname(dirname(PKG)); // the repository root

test("the kit re-exports the host-port contract of @specstride/contracts, unchanged", () => {
  assert.equal(hostKit.POINT_ID, POINT_ID);
  assert.equal(hostKit.POINT_ID, "specstride.host/1");
  assert.equal(hostKit.CLI_PROTOCOL_VERSION, CLI_PROTOCOL_VERSION);
  assert.equal(hostKit.CLI_PROTOCOL_VERSION, 1);
  assert.deepEqual(hostKit.OPERATIONS, OPERATIONS);
  assert.deepEqual(
    [...hostKit.OPERATIONS],
    ["describe", "renderSkill", "renderEntry", "renderStatusHooks", "evalDriver.run"],
  );
  assert.equal(hostKit.PROTOCOL_MISMATCH_LINE, PROTOCOL_MISMATCH_LINE);
  assert.equal(hostKit.PROTOCOL_MISMATCH_EXIT_CODE, PROTOCOL_MISMATCH_EXIT_CODE);
  assert.equal(hostKit.DOCTOR_SKILL_ID, DOCTOR_SKILL_ID);
  assert.deepEqual(hostKit.HOST_SKILL_IDS, HOST_SKILL_IDS);
});

test("the kit re-exports the row-144 ids of the context-cost table", () => {
  assert.deepEqual(hostKit.HOST_SKILL_AND_ENTRY_IDS, HOST_SKILL_AND_ENTRY_IDS);
  assert.deepEqual(
    [...hostKit.HOST_SKILL_AND_ENTRY_IDS],
    ["specstride-run", "specstride-reverse", "doctor"],
  );
  // The `doctor` of row 144 is the LOGICAL id; the Claude spelling of it is
  // DOCTOR_SKILL_ID, a rendering concern the kit keeps out of the contract.
  assert.notEqual(hostKit.HOST_SKILL_AND_ENTRY_IDS.includes(hostKit.DOCTOR_SKILL_ID), true);
  assert.equal(hostKit.DOCTOR_SKILL_ID, "specstride-doctor");
});

test("the manifest depends on @specstride/contracts alone, at an exact version", () => {
  const manifest = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8")) as {
    name?: string;
    version?: string;
    private?: boolean;
    license?: string;
    type?: string;
    engines?: { node?: string };
    dependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };
  assert.equal(manifest.name, "@specstride/host-kit");
  assert.equal(manifest.license, "Apache-2.0");
  assert.equal(manifest.type, "module");
  assert.equal(manifest.engines?.node, ">=22");
  assert.deepEqual(manifest.dependencies, { "@specstride/contracts": "0.0.0" });
  // No install script and no compile step (F100-FR-027 holds for a package
  // that crosses a repository boundary; the kit ships as one of them).
  for (const script of Object.keys(manifest.scripts ?? {})) {
    assert.ok(
      !["preinstall", "install", "postinstall", "prepare", "prepublishOnly"].includes(script),
      `the manifest holds the install script ${script}`,
    );
  }
});

test("the graph entry of @specstride/host-kit is L1 and imports only contracts", () => {
  const graph = JSON.parse(
    readFileSync(join(ROOT, "packages/contracts/data/package-graph.json"), "utf8"),
  ) as {
    packages: { name: string; layer?: string; mayImport?: string[]; owner?: string }[];
  };
  const entry = graph.packages.find((candidate) => candidate.name === "@specstride/host-kit");
  assert.ok(entry !== undefined, "@specstride/host-kit is a package of the graph");
  assert.equal(entry.layer, "L1", "the kit is L1, so every host package of L7 may import it");
  assert.notEqual(entry.layer, "L7");
  assert.deepEqual(entry.mayImport, ["@specstride/contracts"]);
  // The kit sits above the composition roots, so `every package above` of
  // the runtime and the CLI expands over it.
  const runtimeIndex = graph.packages.findIndex((p) => p.name === "@specstride/runtime");
  const kitIndex = graph.packages.findIndex((p) => p.name === "@specstride/host-kit");
  assert.ok(kitIndex < runtimeIndex, "the kit is listed above @specstride/runtime");
});
