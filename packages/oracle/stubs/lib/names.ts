/**
 * T044 — the names of the stub executables, and why the set is not a list of
 * supported harnesses (F141-FR-006, F141-FR-010).
 *
 * "Stub executables MUST be named as §O.3 says: after the as-is command of a
 * harness with as-is behaviour, after the as-is engine command, or
 * `stub-harness` for a descriptor-driven harness. The set of names MUST be data
 * of the fixture catalogue and MUST NOT be read as a list of supported
 * harnesses; a fixture that enumerates harnesses MUST read the registry of the
 * side it runs."
 *
 * So this module holds no name of its own. Every name comes from
 * `packages/oracle/data/stub-vocabulary.json`: the `executables` of each entry
 * of `harnessStubs`, and `engineExecutable`. A harness is added to the oracle by
 * adding data there — "a further harness stub MUST be added by data: a name, a
 * calling convention and a stream format, with no change to the comparator or
 * the normalizer" — and the executables of `stubs/bin/` are generated from the
 * same list, so a name can never exist in one place and not the other.
 *
 * `harnessesOfTheRegistry` is the other half of F141-FR-006: a fixture that
 * enumerates harnesses reads the REGISTRY of the side it runs and never this
 * list. On the reference that is the backend registry of the baseline, which
 * holds the locally registered backend the product does not carry (DV-064); on
 * the port it is the harness registry of the product. The two sets differ, and a
 * fixture that read the stub names for either would compare the oracle with
 * itself.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { stubVocabulary } from "../../src/catalogue/data.ts";

/** The one generic name of a descriptor-driven harness (§O.3). */
export const GENERIC_STUB_NAME = "stub-harness" as const;

/** The names of the stub executables of the harness stubs, in the order of the data. */
export function harnessStubExecutables(): readonly string[] {
  return Object.freeze(stubVocabulary().harnessStubs.flatMap((entry) => [...entry.executables]));
}

/** The name of the as-is engine command, which the engine stub carries. */
export function engineExecutableName(): string {
  return stubVocabulary().engineExecutable;
}

/**
 * Every name a stub executable of `stubs/bin/` has: the as-is commands of the
 * harness stubs, the one generic name, and the as-is engine command.
 */
export function stubExecutableNames(): readonly string[] {
  return Object.freeze([...harnessStubExecutables(), engineExecutableName()]);
}

/** The harness a stub executable belongs to, or `undefined` for the engine. */
export function harnessOfExecutable(name: string): string | undefined {
  return stubVocabulary().harnessStubs.find((entry) => entry.executables.includes(name))?.harness;
}

/** The harness stubs the pi stub among them is used on the port side only (F141-FR-010). */
export function sidesOfHarnessStub(harness: string): string {
  return stubVocabulary().harnessStubs.find((entry) => entry.harness === harness)?.sides ?? "";
}

/** A reading of the set of names that §O.3 refuses. */
export class StubNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StubNameError";
  }
}

/**
 * The set of stub names is not a list of supported harnesses. A caller that asks
 * for one is sent to the registry of its side (F141-FR-006).
 */
export function assertNotAListOfSupportedHarnesses(purpose: string): never {
  throw new StubNameError(
    `${purpose}: the set of names of stub executables is not a list of the harnesses the product ` +
      `supports, which is the registry (F141-FR-006, DV-064). A fixture that enumerates ` +
      `harnesses reads the registry of the side it runs: harnessesOfTheRegistry("reference", …) ` +
      `or harnessesOfTheRegistry("port", …)`,
  );
}

/** Where the registry of each side is read from. */
export const REGISTRY_SOURCE = Object.freeze({
  reference: "lib/backends.py",
  port: "packages/harness/src/registry.ts",
});

/** What a side's registry holds, or why it could not be read. */
export type RegistryReading = {
  readonly side: "reference" | "port";
  readonly source: string;
  readonly entries: readonly string[];
  /** Set where the registry could not be read; the entries are then empty. */
  readonly unread?: string;
};

/**
 * The harnesses the registry of one side holds. The reference registry is the
 * `REGISTRY` tuple of the backends module of the baseline, read from the
 * reference tree at the pinned commit; the port registry is the registry of the
 * product. Neither is the set of stub names.
 */
export function harnessesOfTheRegistry(side: "reference" | "port", root: string): RegistryReading {
  const source = REGISTRY_SOURCE[side];
  const file = join(root, source);
  if (!existsSync(file)) {
    return Object.freeze({
      side,
      source,
      entries: Object.freeze([]),
      unread:
        `${file} does not exist. A fixture that enumerates harnesses reads the registry of the ` +
        `side it runs and never the set of stub names (F141-FR-006); where the registry of a side ` +
        `is not built yet, the fixture is skipped with this reason and nothing is compared`,
    });
  }
  const text = readFileSync(file, "utf8");
  const entries =
    side === "reference"
      ? [...text.matchAll(/Backend\("([a-z0-9-]+)"/g)].map((m) => m[1] as string)
      : [...text.matchAll(/id:\s*"([a-z0-9-]+)"/g)].map((m) => m[1] as string);
  return Object.freeze({ side, source, entries: Object.freeze(entries) });
}
