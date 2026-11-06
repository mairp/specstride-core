/**
 * The reference trees, for the tests that run a side.
 *
 * The clones of the two baselines are named by `ORACLE_REF_SPECSTRIDE` and
 * `ORACLE_REF_MOL` (quickstart.md). Where a variable is not set, the
 * conventional places are tried, because the reference test tier is run by hand
 * as often as by the build. Where no clone is found, the caller gets a SKIP with
 * its reason and never a pass: the tier that compares against the reference needs
 * the reference.
 *
 * One tree per system is unpacked per test process and reused, so a suite that
 * runs several scenarios of one baseline unpacks it once.
 */
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

import { fetchReferenceTree, type ReferenceTree } from "../src/reference/fetch.ts";
import { readPins, type Pin } from "../src/reference/pins.ts";

/** The variable that names the clone of each baseline, as `reference/pins.json` says. */
export const CLONE_VARIABLES: Readonly<Record<string, string>> = Object.freeze({
  specstride: "ORACLE_REF_SPECSTRIDE",
  "mixture-of-loops": "ORACLE_REF_MOL",
});

/** Where a clone is looked for when the variable names none. */
function candidates(system: string): readonly string[] {
  return Object.freeze([
    join("/root", system),
    join(homedir(), system),
    join("/srv", system),
    join(process.cwd(), "..", system),
  ]);
}

/** The clone of one baseline, or `undefined` with no clone. */
export function cloneOf(system: string): string | undefined {
  const named = process.env[CLONE_VARIABLES[system] as string];
  const places = named === undefined || named === "" ? candidates(system) : [named];
  return places.find((place) => existsSync(join(place, ".git")) || existsSync(join(place, "HEAD")));
}

/** The pin of one baseline. */
export function pinOf(system: string): Pin {
  const pin = readPins().find((p) => p.system === system);
  if (pin === undefined) throw new Error(`${system} has no pin in reference/pins.json`);
  return pin;
}

/** Why a scenario of one baseline cannot run here. */
export function skipReasonFor(system: string): string {
  return (
    `prerequisite missing: no clone of the ${system} baseline was found. The reference test tier ` +
    `reads the pinned commit out of a clone named by ${CLONE_VARIABLES[system] as string} ` +
    `(quickstart.md); without it nothing can be run against the reference. This is a SKIP with ` +
    `its reason and never a pass.`
  );
}

const trees = new Map<string, ReferenceTree>();

/** The read-only reference tree of one baseline in scratch, unpacked once per process. */
export function referenceTreeOf(system: string): ReferenceTree | undefined {
  const held = trees.get(system);
  if (held !== undefined) return held;
  const clone = cloneOf(system);
  if (clone === undefined) return undefined;
  const tree = fetchReferenceTree({
    pin: pinOf(system),
    cloneDir: clone,
    scratchRoot: mkdtempSync(join(tmpdir(), "oracle-reference-")),
  });
  trees.set(system, tree);
  return tree;
}

/** The declaration of one scenario, read off disk. */
export function declarationOf(fixtureDir: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(fixtureDir, "fixture.json"), "utf8")) as Record<
    string,
    unknown
  >;
}
