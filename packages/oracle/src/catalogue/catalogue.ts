/**
 * T021 — the catalogue of fixture families and scenarios (F141-FR-013,
 * F141-FR-030).
 *
 * `spec.md` §O.2 is the catalogue; `data/fixture-catalogue.json` is its
 * machine-readable form, which `src/catalogue/data.ts` loads and checks at
 * import. This module is the reading of that data that the rest of the oracle
 * and every feature that cites the oracle use:
 *
 * - the forty ids, the status of each one, and the refusal of a family that is
 *   not in the catalogue or is retired (F141-FR-013);
 * - the variants of a family (`@engine-stub` and `@full-stack` of FX-35 and
 *   FX-36), which a citation may name;
 * - the scenarios: the names of the first set, the members a pattern name
 *   stands for, and the scenarios another feature added inside the scope of a
 *   family, each with the feature that owns the scenario and the feature that
 *   owns the test (F141-FR-030);
 * - the end on the reference that the catalogue states for a scenario of a
 *   critic family or a harness family, which is a record of the reference and
 *   no expectation of its own (F141-FR-013);
 * - the acceptance of a scenario a feature adds: inside the scope of the
 *   family, with known verbs and known surfaces, under a name no other
 *   scenario of the family has (F141-FR-030).
 *
 * Nothing here holds a list of its own. Every name, status, variant, member and
 * end comes out of `oracleData.fixtureCatalogue`, so `spec.md` and this module
 * cannot drift apart: the generator check of the specification holds the data
 * file to §O.2, and `data.ts` holds this module to the data file.
 */
import {
  ACTIVE_FAMILY_COUNT,
  FAMILY_COUNT,
  OracleDataError,
  RETIRED_FAMILIES,
  assertFamilyMayBeCited,
  family,
  knownSurfaceNames,
  oracleData,
  patternExpression,
  type CatalogueScenario,
  type FixtureFamily,
} from "./data.ts";

/** Raised when a citation or an added scenario does not hold up. */
export class CatalogueError extends Error {
  /** What the error is about: a citation, a scenario, a fixture or an asset. */
  readonly subject: string;
  constructor(subject: string, message: string) {
    super(`${subject}: ${message}`);
    this.name = "CatalogueError";
    this.subject = subject;
  }
}

// ---------------------------------------------------------------------------
// Families: ids, status, variants
// ---------------------------------------------------------------------------

/** Every family of the catalogue, retired ones included, in the order of §O.2. */
export function families(): readonly FixtureFamily[] {
  return oracleData.fixtureCatalogue.families;
}

/** The ids of every family. Forty of them; an id is never reused or renamed. */
export function familyIds(): readonly string[] {
  return families().map((f) => f.id);
}

/** The ids of the families that have scenarios and may be cited. */
export function activeFamilyIds(): readonly string[] {
  return families()
    .filter((f) => f.status === "active")
    .map((f) => f.id);
}

/** The ids of the retired families. They keep their id and have no scenario. */
export function retiredFamilyIds(): readonly string[] {
  return families()
    .filter((f) => f.status === "retired")
    .map((f) => f.id);
}

/** The status of a family, or `undefined` where the catalogue has no such id. */
export function familyStatus(id: string): "active" | "retired" | undefined {
  return family(id)?.status;
}

/**
 * The variants a citation of this family may name (§O.6, `fixture:`). Only
 * FX-35 and FX-36 have them: every scenario of those two families runs as
 * `@engine-stub` and as `@full-stack`.
 */
export function variantsOf(id: string): readonly string[] {
  return family(id)?.variants ?? [];
}

/** The surfaces the family compares (§O.4, the column "Surfaces" of §O.2). */
export function surfacesOf(id: string): readonly string[] {
  return family(id)?.surfaces ?? [];
}

/** What the family exercises — the scope inside which a feature may add a scenario. */
export function scopeOf(id: string): string {
  return family(id)?.exercises ?? "";
}

/** The stubs the family drives (§O.3). */
export function stubsOf(id: string): readonly string[] {
  return family(id)?.stubs ?? [];
}

/** The reservation of `traceability.md` section 5 a new family answers, where it answers one. */
export function answersReservation(id: string): string | undefined {
  return family(id)?.answersReservation;
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

/** One scenario of the catalogue, with the family it belongs to. */
export type Scenario = CatalogueScenario & { readonly familyId: string };

/** The entries of a family's scenario list, patterns as patterns. */
export function scenarioEntriesOf(id: string): readonly Scenario[] {
  return (family(id)?.scenarios ?? []).map((s) => ({ ...s, familyId: id }));
}

/**
 * Every scenario NAME of a family: the plain names, and the members of every
 * pattern name. A pattern name itself is a name a citation may use — it stands
 * for all its members (§O.6) — so it is in the list as well.
 */
export function scenarioNamesOf(id: string): readonly string[] {
  const names: string[] = [];
  for (const entry of family(id)?.scenarios ?? []) {
    names.push(entry.name);
    for (const member of entry.members ?? []) names.push(member);
  }
  return names;
}

/** The members a pattern name stands for, or an empty list for a plain name. */
export function membersOf(id: string, name: string): readonly string[] {
  const entry = (family(id)?.scenarios ?? []).find((s) => s.name === name);
  return entry?.members ?? [];
}

/**
 * The catalogue entry a scenario name resolves to: the entry of that name, or
 * the pattern whose members hold it. `undefined` where the catalogue does not
 * hold the name.
 */
export function scenarioOf(id: string, name: string): Scenario | undefined {
  const entries = family(id)?.scenarios ?? [];
  const exact = entries.find((s) => s.name === name);
  if (exact !== undefined) return { ...exact, familyId: id };
  const pattern = entries.find(
    (s) => s.pattern && ((s.members ?? []).includes(name) || patternExpression(s.name).test(name)),
  );
  return pattern === undefined ? undefined : { ...pattern, familyId: id };
}

/** The feature that writes and keeps a scenario (the column "Scenario of" of §O.2). */
export function scenarioOwnerOf(id: string, name: string): string | undefined {
  return scenarioOf(id, name)?.scenarioOf;
}

/** The feature that owns the parity test of a scenario, where the catalogue names one. */
export function testOwnerOf(id: string, name: string): string | undefined {
  return scenarioOf(id, name)?.testOf;
}

/** Every scenario a given feature added to a family of the catalogue (F141-FR-030). */
export function scenariosAddedBy(feature: string): readonly Scenario[] {
  const added: Scenario[] = [];
  for (const f of families()) {
    for (const entry of f.scenarios) {
      if (entry.scenarioOf === feature) added.push({ ...entry, familyId: f.id });
    }
  }
  return added;
}

/** Every scenario of the catalogue that this feature does not own. */
export function scenariosAddedByOtherFeatures(): readonly Scenario[] {
  const added: Scenario[] = [];
  for (const f of families()) {
    for (const entry of f.scenarios) {
      if (entry.scenarioOf !== OWNING_FEATURE) added.push({ ...entry, familyId: f.id });
    }
  }
  return added;
}

/** The three-digit number of the feature that owns the oracle and the first set of scenarios. */
export const OWNING_FEATURE = "141" as const;

/** The waiver a scenario of the catalogue carries, where it carries one (§O.2). */
export function waiverOf(id: string, name: string): string | null {
  return scenarioOf(id, name)?.waiver ?? null;
}

/**
 * How the driven command of a scenario ends on the reference, where the
 * catalogue states it (F141-FR-013: the scenarios of the critic families and
 * the harness families FX-06, FX-07 and FX-17 to FX-20). The stated end is a
 * record of the reference and no expectation of its own.
 */
export function endOnReferenceOf(
  id: string,
  name: string,
): CatalogueScenario["endOnReference"] | undefined {
  return scenarioOf(id, name)?.endOnReference;
}

/** The families for which the catalogue states ends on the reference (F141-FR-013). */
export const FAMILIES_WITH_AN_END_ON_THE_REFERENCE = [
  "FX-06",
  "FX-07",
  "FX-17",
  "FX-18",
  "FX-19",
  "FX-20",
] as const;

// ---------------------------------------------------------------------------
// Citations: `FX-nn`, `FX-nn/<scenario>`, `FX-nn/<scenario>@<variant>`
// ---------------------------------------------------------------------------

/** What a citation of §O.6 `fixture:` resolved to. */
export type Citation = {
  /** The citation as written. */
  readonly cited: string;
  readonly familyId: string;
  /** The scenario the citation names, where it names one. */
  readonly scenario?: string;
  /** The variant the citation names, where it names one. */
  readonly variant?: string;
  /** The scenario names the citation stands for: one, or every member of a pattern. */
  readonly scenarios: readonly string[];
};

/** The shape of one citation: `FX-nn`, with an optional scenario and an optional variant. */
const CITATION = /^(FX-[0-9]{2})(?:\/([a-z0-9][a-z0-9<>-]*))?(@engine-stub|@full-stack)?$/;

/**
 * F141-FR-013, F141-FR-027 — resolve one citation of §O.6. Throws
 * `CatalogueError` when the citation names a family outside the catalogue, a
 * retired family, a scenario the catalogue does not hold, or a variant the
 * family does not have.
 */
export function resolveCitation(cited: string): Citation {
  const match = CITATION.exec(cited.trim());
  if (match === null) {
    throw new CatalogueError(
      cited,
      "is no citation of §O.6: a citation reads `FX-nn`, " +
        "`FX-nn/<scenario>` or `FX-nn/<scenario>@<variant>`",
    );
  }
  const [, familyId, scenario, variant] = match as unknown as [
    string,
    string,
    string | undefined,
    string | undefined,
  ];
  let found: FixtureFamily;
  try {
    found = assertFamilyMayBeCited(familyId);
  } catch (error) {
    throw new CatalogueError(cited, (error as Error).message);
  }
  if (variant !== undefined && !found.variants.includes(variant)) {
    throw new CatalogueError(
      cited,
      `${familyId} has no variant ${variant}` +
        (found.variants.length === 0
          ? ": only FX-35 and FX-36 have variants"
          : `; it has ${found.variants.join(", ")}`),
    );
  }
  if (scenario === undefined) {
    return { cited, familyId, scenarios: scenarioNamesOf(familyId) };
  }
  const entry = scenarioOf(familyId, scenario);
  if (entry === undefined) {
    throw new CatalogueError(
      cited,
      `${familyId} has no scenario ${scenario}: the catalogue is the register of scenario names (F141-FR-030)`,
    );
  }
  const scenarios =
    entry.name === scenario && entry.pattern ? [...(entry.members ?? [])] : [scenario];
  return {
    cited,
    familyId,
    scenario,
    ...(variant === undefined ? {} : { variant }),
    scenarios,
  };
}

/** True when the citation holds up, with no throw. */
export function citationHoldsUp(cited: string): boolean {
  try {
    resolveCitation(cited);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// A scenario a feature adds (F141-FR-030)
// ---------------------------------------------------------------------------

/** What a feature declares when it adds a scenario to a family (rule 4 of §O.1). */
export type AddedScenario = {
  readonly familyId: string;
  readonly name: string;
  /** The three-digit number of the feature that writes and keeps the scenario. */
  readonly addedBy: string;
  /** Per stub kind or harness stub, the verbs the scenario uses (§O.3). */
  readonly stubsAndVerbs?: Readonly<Record<string, readonly string[]>>;
  /** The surfaces the scenario compares (§O.4). */
  readonly surfaces?: readonly string[];
};

/** The verbs of one stub kind or harness stub of §O.3, or `undefined` for no such stub. */
export function verbsOfStub(stub: string): readonly string[] | undefined {
  const vocabulary = oracleData.stubVocabulary;
  const kind = vocabulary.kinds[stub];
  if (kind !== undefined) return kind.verbs;
  const harness = vocabulary.harnessStubs.find((h) => h["harness"] === stub) as
    { readonly roles: Readonly<Record<string, string>> } | undefined;
  if (harness === undefined) return undefined;
  const verbs = new Set<string>();
  for (const role of Object.values(harness.roles)) {
    for (const verb of vocabulary.kinds[role]?.verbs ?? []) verbs.add(verb);
  }
  return [...verbs];
}

/** Every name a stub of §O.3 can be declared under: the kinds and the harness stubs. */
export function stubNames(): readonly string[] {
  return [
    ...Object.keys(oracleData.stubVocabulary.kinds),
    ...oracleData.stubVocabulary.harnessStubs.map((h) => String(h["harness"])),
  ];
}

/**
 * F141-FR-030 — accept or refuse a scenario a feature adds to a family.
 *
 * It is accepted when the family is one that may be cited, the name is one no
 * other scenario of the family has, every verb is a verb of §O.3 for the stub
 * that is to run it, and every surface is a surface of §O.4 that belongs to the
 * family. A scenario the catalogue already holds must carry the name it has
 * there and the feature that owns it; a scenario the catalogue does not hold
 * yet must carry the number of the feature in its name.
 *
 * Throws `CatalogueError` on the first thing that does not hold up.
 */
export function assertAddedScenarioIsAccepted(added: AddedScenario): Scenario | AddedScenario {
  const subject = `${added.familyId}/${added.name}`;
  let found: FixtureFamily;
  try {
    found = assertFamilyMayBeCited(added.familyId);
  } catch (error) {
    throw new CatalogueError(subject, (error as Error).message);
  }

  if (!/^[0-9]{3}$/.test(added.addedBy)) {
    throw new CatalogueError(
      subject,
      `${added.addedBy} is no feature number: a scenario names the feature that writes and keeps it`,
    );
  }

  for (const [stub, verbs] of Object.entries(added.stubsAndVerbs ?? {})) {
    const known = verbsOfStub(stub);
    if (known === undefined) {
      throw new CatalogueError(subject, `${stub} is no stub of §O.3`);
    }
    for (const verb of verbs) {
      if (!known.includes(verb)) {
        throw new CatalogueError(
          subject,
          `${verb} is no verb of ${stub} (§O.3); the oracle refuses a scenario that uses an unknown verb`,
        );
      }
    }
  }

  const known = new Set(knownSurfaceNames());
  for (const surface of added.surfaces ?? []) {
    if (!known.has(surface)) {
      throw new CatalogueError(subject, `${surface} is no surface of §O.4`);
    }
    if (!found.surfaces.includes(surface)) {
      throw new CatalogueError(
        subject,
        `the surface ${surface} is outside the surfaces of ${added.familyId}`,
      );
    }
  }

  const entry = scenarioOf(added.familyId, added.name);
  if (entry !== undefined) {
    // The catalogue holds the scenario: the name it has there stands, and the
    // feature that owns it is the one the catalogue names.
    if (entry.scenarioOf !== added.addedBy) {
      throw new CatalogueError(
        subject,
        `the catalogue gives this scenario to feature ${entry.scenarioOf}, not to ${added.addedBy}`,
      );
    }
    return entry;
  }

  // The catalogue does not hold it yet: the name carries the number of the
  // feature, so that two features cannot write the same name into one family.
  if (!added.name.startsWith(`${added.addedBy}-`)) {
    throw new CatalogueError(
      subject,
      `the catalogue does not hold this scenario yet, so its name carries the number of the ` +
        `feature: ${added.addedBy}-${added.name} (F141-FR-030)`,
    );
  }
  return added;
}

/**
 * F141-FR-030 — the catalogue is the register of scenario names: two scenarios
 * of one family never share a name, members of a pattern included. Gives the
 * names that occur more than once, per family; an empty list means the register
 * holds.
 */
export function duplicateScenarioNames(): readonly { family: string; name: string }[] {
  const duplicates: { family: string; name: string }[] = [];
  for (const f of families()) {
    const seen = new Set<string>();
    for (const name of scenarioNamesOf(f.id)) {
      if (seen.has(name)) duplicates.push({ family: f.id, name });
      seen.add(name);
    }
  }
  return duplicates;
}

/**
 * The catalogue as one flat register: every family with its status, its
 * variants and every scenario name it holds, with the feature that owns the
 * scenario. This is the form the citing page of `CITING.md` is generated from.
 */
export function catalogueRegister(): readonly {
  readonly familyId: string;
  readonly status: "active" | "retired";
  readonly variants: readonly string[];
  readonly scenarios: readonly { name: string; scenarioOf: string; pattern: boolean }[];
}[] {
  return families().map((f) => ({
    familyId: f.id,
    status: f.status,
    variants: f.variants,
    scenarios: f.scenarios.map((s) => ({
      name: s.name,
      scenarioOf: s.scenarioOf,
      pattern: s.pattern,
    })),
  }));
}

/**
 * Re-exported so a caller needs one import for the catalogue, its counts and
 * its errors.
 */
export {
  ACTIVE_FAMILY_COUNT,
  FAMILY_COUNT,
  OracleDataError,
  RETIRED_FAMILIES,
  assertFamilyMayBeCited,
  family,
  knownSurfaceNames,
  patternExpression,
  type CatalogueScenario,
  type FixtureFamily,
};
