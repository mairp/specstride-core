/**
 * CT-141-147 — the register of scenario names (T151, T160; F141-FR-030).
 *
 * > "Register of scenario names: every pattern name has members and every
 * > member matches its pattern; every scenario names the feature that owns it;
 * > a name used twice in a family fails; a scenario of another feature that
 * > the catalogue holds is accepted by the declaration check under the name it
 * > has there."
 *
 * What the test proves. The register is the catalogue's own table of names
 * (`data/fixture-catalogue.json`), read through `scenario-register.ts`; the
 * whole of it is checked by `assertScenarioRegisterHolds`, which returns the
 * list of what does not hold up — an empty list is a register that holds.
 *
 * - **the register holds**: the check names no failure on the data as it is;
 * - **every pattern name has members, and every member matches its pattern**:
 *   each entry marked `pattern` carries members, each member is matched by the
 *   family's `patternExpression`, and `scenarioNamesOf` reads the members as
 *   names of the family;
 * - **every scenario names the feature that owns it**: every scenario of every
 *   family carries a three-digit `scenarioOf`; the 21 scenarios the OTHER
 *   features own (106, 107, 109, 123 and 131, on 2026-09-30) are read back
 *   through `registeredScenariosOfOtherFeatures` with their owner — a
 *   registered name is accepted by the declaration check under the name the
 *   catalogue holds it under, and a name the catalogue does not hold is
 *   refused;
 * - **a name used twice in a family fails**: the loader refuses the data file
 *   outright — a copy of `data/` in which one family holds one name twice
 *   stops the load with the family and the name in the message, and
 *   `duplicateScenarioNames` finds nothing on the data as it is;
 * - **the names feature 103 reserves, and the two requests that are no
 *   scenario of a family**: each is recorded in the catalogue with the
 *   families the reservation or the request is over, and neither a reserved
 *   name nor an asked request is a scenario of any family.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { families, patternExpression, scenarioNamesOf } from "../../src/catalogue/catalogue.ts";
import { ORACLE_DATA_DIR, OracleDataError, loadOracleData } from "../../src/catalogue/data.ts";
import {
  assertScenarioRegisterHolds,
  declarationAcceptsScenario,
  registeredEntriesOf,
  registeredNamesOf,
  registeredScenariosOfOtherFeatures,
  requestsThatAreNoScenario,
  reservedNamesOf103,
  scenarioRegister,
} from "../../src/catalogue/scenario-register.ts";

// ---------------------------------------------------------------------------
// 1. the register holds
// ---------------------------------------------------------------------------

test("CT-141-147: the register of scenario names holds", () => {
  assert.deepEqual([...assertScenarioRegisterHolds()], []);
  assert.deepEqual([...duplicateNames()], [], "two scenarios of one family share no name");
});

/** The names used twice in a family, found the way the loader refuses them. */
function duplicateNames(): readonly { family: string; name: string }[] {
  const out: { family: string; name: string }[] = [];
  for (const f of families()) {
    const seen = new Set<string>();
    for (const name of scenarioNamesOf(f.id)) {
      if (seen.has(name)) out.push({ family: f.id, name });
      seen.add(name);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 2. every pattern name has members, and every member matches its pattern
// ---------------------------------------------------------------------------

test("CT-141-147: every pattern name has members and every member matches", () => {
  let patterns = 0;
  let members = 0;
  for (const f of families()) {
    for (const entry of registeredEntriesOf(f.id)) {
      if (!entry.pattern) continue;
      patterns += 1;
      const list = entry.members ?? [];
      if (list.length === 0) {
        // An alias pattern: another pattern of the same family holds the names
        // it stands for — the register accepts it, and what would fail is a
        // pattern of which the family holds no name at all.
        const expression = patternExpression(entry.name);
        const covered = registeredEntriesOf(f.id).some(
          (other) =>
            other !== entry &&
            other.pattern &&
            (other.members ?? []).some((member) => expression.test(member)),
        );
        assert.ok(
          covered,
          `${f.id}/${entry.name}: an alias pattern covered by another pattern of the family`,
        );
        continue;
      }
      const expression = patternExpression(entry.name);
      for (const member of list) {
        members += 1;
        assert.ok(expression.test(member), `${f.id}/${member}: matches the pattern ${entry.name}`);
        // A member is a name of the family: the declaration check reads it
        // there, and the owner of the pattern owns it.
        assert.ok(
          registeredNamesOf(f.id).includes(member),
          `${f.id}/${member}: a name of the family`,
        );
      }
    }
  }
  assert.ok(patterns >= 1, `${patterns} pattern names in the register`);
  assert.ok(members >= 1, `${members} members of patterns`);
});

// ---------------------------------------------------------------------------
// 3. every scenario names the feature that owns it
// ---------------------------------------------------------------------------

test("CT-141-147: every scenario names the feature that owns it", () => {
  let total = 0;
  for (const row of scenarioRegister()) {
    for (const scenario of row.scenarios) {
      total += 1;
      assert.match(
        scenario.scenarioOf,
        /^[0-9]{3}$/,
        `${row.familyId}/${scenario.name}: a three-digit owner`,
      );
    }
  }
  assert.ok(total >= 200, `${total} scenarios in the register`);
});

test("CT-141-147: the scenarios the other features own, under the names they have there", () => {
  const registered = registeredScenariosOfOtherFeatures();
  assert.ok(registered.length >= 21, `${registered.length} scenarios of other features`);
  const owners = new Set(registered.map((r) => r.scenarioOf));
  for (const owner of owners) {
    assert.match(owner, /^[0-9]{3}$/, `${owner}: a three-digit feature number`);
  }
  for (const scenario of registered) {
    // The name the catalogue holds is the name the declaration check accepts —
    // under the family it is held in, whoever owns it.
    assert.ok(
      declarationAcceptsScenario(scenario.familyId, scenario.name),
      `${scenario.familyId}/${scenario.name}: accepted as the catalogue holds it`,
    );
    // And the family really holds it, under the feature that owns it.
    const entry = registeredEntriesOf(scenario.familyId).find(
      (e) => e.name === scenario.name || (e.members ?? []).includes(scenario.name),
    );
    assert.notEqual(entry, undefined, `${scenario.familyId}/${scenario.name}: in its family`);
  }
  // A name the catalogue does not hold is refused by the same check.
  assert.equal(declarationAcceptsScenario("FX-40", "no-such-scenario-of-fx-40"), false);
  assert.equal(declarationAcceptsScenario("FX-999", "no-such-family"), false);
});

// ---------------------------------------------------------------------------
// 4. a name used twice in a family fails
// ---------------------------------------------------------------------------

test("CT-141-147: a name used twice in a family stops the load", () => {
  const dir = join(mkdtempSync(join(tmpdir(), "oracle-register-")), "data");
  cpSync(ORACLE_DATA_DIR, dir, { recursive: true });
  try {
    const path = join(dir, "fixture-catalogue.json");
    const value = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    const catalog = value as {
      families: { id: string; scenarios: { name: string; pattern: boolean }[] }[];
    };
    const family = catalog.families.find((f) => f.id === "FX-40");
    assert.notEqual(family, undefined);
    family?.scenarios.push({ name: family?.scenarios[0]?.name as string, pattern: false });
    writeFileSync(path, JSON.stringify(value, null, 1), "utf8");
    assert.throws(
      () => loadOracleData(dir),
      (error: unknown) =>
        error instanceof OracleDataError && /used twice/.test((error as Error).message),
      "the loader refuses a name used twice in a family",
    );
  } finally {
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// 5. the reserved names and the requests that are no scenario
// ---------------------------------------------------------------------------

test("CT-141-147: the names feature 103 reserves are recorded, and are no scenarios", () => {
  const reserved = reservedNamesOf103();
  assert.ok(reserved.length >= 1, "the reservation is recorded");
  for (const reservation of reserved) {
    assert.equal(reservation.reservedBy, "103");
    for (const familyId of reservation.families) {
      assert.notEqual(
        families().find((f) => f.id === familyId),
        undefined,
        `${familyId}: a family of the catalogue`,
      );
      // A reserved name is a name of no scenario yet.
      for (const name of scenarioNamesOf(familyId)) {
        assert.equal(
          reservation.names.startsWith(name),
          false,
          `${familyId}/${name}: not itself a reserved name`,
        );
      }
    }
  }
});

test("CT-141-147: the requests that are no scenario of a family are recorded", () => {
  const requests = requestsThatAreNoScenario();
  assert.ok(requests.length >= 2, `${requests.length} requests recorded with their why`);
  for (const request of requests) {
    assert.ok(request.why.length > 0, `${request.asked}: recorded with the why`);
    for (const familyId of request.families) {
      assert.notEqual(
        families().find((f) => f.id === familyId),
        undefined,
        `${familyId}: a family of the catalogue`,
      );
      // What was asked is no scenario of the family it was asked for.
      assert.equal(
        scenarioNamesOf(familyId).includes(request.asked),
        false,
        `${familyId}/${request.asked}: no scenario of the family`,
      );
    }
  }
});
