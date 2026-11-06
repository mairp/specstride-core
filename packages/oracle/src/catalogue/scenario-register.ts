/**
 * T160 — the register of the scenario names that belong to somebody else
 * (F141-FR-030, F141-FR-027).
 *
 * §O.2 holds three kinds of name that are no scenario of feature 141:
 *
 * - **the scenarios other features own** — 21 names on 2026-09-30, of the
 *   features 106, 107, 109, 123 and 131. A feature of Wave 1 added each of
 *   them inside the scope of a family (rule 4 of §O.1); the catalogue carries
 *   them under the name the owning feature gave them, with `scenarioOf` set to
 *   the number of that feature.
 * - **the names feature 103 reserves** — `103-<name>` over the families FX-17,
 *   FX-18, FX-19, FX-20 and FX-24, for its usage failures of the pass loop and
 *   the empty prompt. Not yet named: feature 103 registers each name here when
 *   it writes it.
 * - **the two requests that are no scenario of a family** — what features 109
 *   and 127 asked for and why the family refuses it, so the asking feature has
 *   a recorded answer and does not ask again.
 *
 * This module is the reading of those three lists that the DECLARATION CHECK
 * uses: a parity test that cites a registered scenario of another feature is
 * accepted UNDER THE NAME IT HAS THERE — the name the catalogue holds stands,
 * and the check does not demand that feature 141's number be in it. That is
 * the one relaxation F141-FR-030 makes, and it holds only for a name the
 * catalogue actually holds; anything else is refused by
 * `assertDeclarationMayRun` as before.
 *
 * Nothing here holds a list of its own: every name comes out of
 * `oracleData.fixtureCatalogue` (`reservedNames`, `notScenarios`, the
 * `scenarioOf` field of a scenario), which the generator check of the
 * specification holds to §O.2.
 */
import { oracleData, patternExpression } from "./data.ts";
import {
  catalogueRegister,
  duplicateScenarioNames,
  scenarioEntriesOf,
  scenarioNamesOf,
  scenarioOwnerOf,
  scenariosAddedByOtherFeatures,
} from "./catalogue.ts";

/** One scenario of the register: the family, the name, the feature that owns it. */
export type RegisteredScenario = {
  readonly familyId: string;
  readonly name: string;
  /** The three-digit number of the feature that writes and keeps the scenario. */
  readonly scenarioOf: string;
  /** True for a pattern name; its members belong to the same feature. */
  readonly pattern: boolean;
};

/**
 * Every scenario of the catalogue another feature owns: 21 names on
 * 2026-09-30, of the features 106, 107, 109, 123 and 131.
 */
export function registeredScenariosOfOtherFeatures(): readonly RegisteredScenario[] {
  return scenariosAddedByOtherFeatures().map((s) => ({
    familyId: s.familyId,
    name: s.name,
    scenarioOf: s.scenarioOf,
    pattern: s.pattern,
  }));
}

/** The names feature 103 reserves, with the families the reservation is over. */
export function reservedNamesOf103(): readonly {
  readonly families: readonly string[];
  readonly names: string;
  readonly reservedBy: string;
}[] {
  return (
    (oracleData.fixtureCatalogue["reservedNames"] as
      { families: string[]; names: string; reservedBy: string }[] | undefined) ?? []
  );
}

/** The requests that are no scenario of a family, with the recorded why. */
export function requestsThatAreNoScenario(): readonly {
  readonly families: readonly string[];
  readonly asked: string;
  readonly askedBy: string;
  readonly why: string;
}[] {
  return (
    (oracleData.fixtureCatalogue["notScenarios"] as
      { families: string[]; asked: string; askedBy: string; why: string }[] | undefined) ?? []
  );
}

/**
 * Whether the declaration check accepts a citation of `familyId`/`name`: a
 * name the catalogue holds is accepted under the name it has there, whoever
 * owns it; a name it does not hold is refused here, as
 * `assertDeclarationMayRun` refuses it later.
 */
export function declarationAcceptsScenario(familyId: string, name: string): boolean {
  return scenarioOwnerOf(familyId, name) !== undefined;
}

/**
 * The check behind CT-141-147 (T151). Everything it proves holds in the data
 * file, so the failures it names are failures of the REGISTER, not of a
 * caller:
 *
 * - every pattern name has members, and every member matches its pattern; a
 *   pattern of another feature whose members another pattern of the same
 *   family already holds (the catalogue records the covering, as the spec's
 *   citing page does for `FX-36/relaunch-budget-<n>`) is no orphan — what
 *   fails is a pattern whose names NO pattern of the family holds;
 * - every scenario names the feature that owns it (`scenarioOf`);
 * - a name used twice in a family (plain names and members alike) fails;
 * - a scenario of another feature is accepted by the declaration check under
 *   the name it has there.
 *
 * Returns the list of what does not hold up; an empty list is a register that
 * holds.
 */
export function assertScenarioRegisterHolds(): readonly string[] {
  const failures: string[] = [];

  for (const f of oracleData.fixtureCatalogue.families) {
    for (const scenario of f.scenarios) {
      if (typeof scenario.scenarioOf !== "string" || !/^[0-9]{3}$/.test(scenario.scenarioOf)) {
        failures.push(`${f.id}/${scenario.name}: no feature owns it (scenarioOf)`);
      }
      if (scenario.pattern) {
        const members = scenario.members ?? [];
        if (members.length === 0) {
          // An alias pattern: another pattern of the same family holds the
          // names it stands for. What fails is a pattern of which the family
          // holds no name at all — a name in the register that no scenario
          // answers.
          const expression = patternExpression(scenario.name);
          const covered = oracleData.fixtureCatalogue.families
            .find((family) => family.id === f.id)
            ?.scenarios.some(
              (other) =>
                other !== scenario &&
                other.pattern === true &&
                (other.members ?? []).some((member) => expression.test(member)),
            );
          if (!covered) {
            failures.push(`${f.id}/${scenario.name}: a pattern name has no members`);
          }
          continue;
        }
        const expression = patternExpression(scenario.name);
        for (const member of members) {
          if (!expression.test(member)) {
            failures.push(`${f.id}/${member}: does not match the pattern ${scenario.name}`);
          }
        }
      }
    }
  }

  for (const duplicate of duplicateScenarioNames()) {
    failures.push(`${duplicate.family}/${duplicate.name}: the name is used twice in the family`);
  }

  // A registered scenario of another feature is accepted by the declaration
  // check under the name it has there — and by no other name.
  for (const registered of registeredScenariosOfOtherFeatures()) {
    if (!declarationAcceptsScenario(registered.familyId, registered.name)) {
      failures.push(
        `${registered.familyId}/${registered.name}: the declaration check does not accept the name the catalogue holds`,
      );
    }
  }

  return failures;
}

/**
 * The register in one flat list, for the citing page and for the tests: every
 * family with every scenario name it holds and the feature that owns each.
 */
export function scenarioRegister(): ReturnType<typeof catalogueRegister> {
  return catalogueRegister();
}

/** The names of one family, patterns resolved, for a declaration check to read. */
export function registeredNamesOf(familyId: string): readonly string[] {
  return scenarioNamesOf(familyId);
}

/** The entries of one family, patterns as patterns. */
export function registeredEntriesOf(familyId: string): ReturnType<typeof scenarioEntriesOf> {
  return scenarioEntriesOf(familyId);
}
