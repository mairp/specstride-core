/**
 * T038 — profile test for the switches of feature 124 (F124-FR-028,
 * F124-FR-042, F124-FR-045): every switch of this feature has a row in the
 * `parity` profile (rows 35, 36, 90, 91 and 92 of annex X §X.7) and the rows
 * the contract spells out carry the value of
 * `specs/124-harness-discovery-and-roles/contracts/parity-rows.json`.
 *
 * The parity profile itself is data of feature 100
 * (`packages/contracts/data/parity-profile.json`); this test reads it and the
 * contract of this feature as data and compares them. It holds no switch
 * value of its own.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CONTRACT_PATH = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "specs",
  "124-harness-discovery-and-roles",
  "contracts",
  "parity-rows.json",
);
const PROFILE_PATH = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "packages",
  "contracts",
  "data",
  "parity-profile.json",
);

const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8")) as {
  schema: string;
  feature: string;
  owned: number[];
  shared: number[];
  read: number[];
  rows: {
    row: number;
    status: string;
    key: string;
    default: string;
    parity: string;
    register: string;
    requirement: string;
  }[];
};
const profile = JSON.parse(readFileSync(PROFILE_PATH, "utf8")) as {
  profile: string;
  switches: {
    number: number;
    switch: string;
    key: string;
    keys: string[];
    default: string;
    parity: string;
    owner: string;
    registerRows: string[];
  }[];
};

/** The row of the `parity` profile for one annex row number. */
function profileRow(row: number) {
  const hit = profile.switches.find((s) => s.number === row);
  assert.ok(hit, `row ${row} of the contract exists in the parity profile`);
  return hit;
}

test("T038 the contract is the profile contract and names rows 35, 36, 90, 91 and 92", () => {
  assert.equal(contract.schema, "specstride.profile/1");
  assert.equal(contract.feature, "124");
  assert.deepEqual(contract.owned, [35, 36, 90, 91, 92]);
});

test("T038 every owned and shared row of this feature exists in the parity profile", () => {
  for (const row of [...contract.owned, ...contract.shared]) {
    const entry = profileRow(row);
    assert.equal(
      entry.owner.includes("124"),
      true,
      `row ${row} of the parity profile names 124 among its owners`,
    );
  }
});

test("T038 row 90 (roles.refuseUnknown, F124-FR-028) carries the value of the contract", () => {
  const wanted = contract.rows.find((r) => r.row === 90);
  assert.ok(wanted, "the contract spells out row 90");
  const entry = profileRow(90);
  assert.equal(entry.key, wanted.key);
  assert.equal(entry.default, wanted.default);
  assert.equal(entry.parity, wanted.parity);
  assert.ok(entry.registerRows.includes(wanted.register), "row 90 carries DV-104");
});

test("T038 row 91 (critic.autoPickMaxUsd, F124-FR-042) carries the value of the contract", () => {
  const wanted = contract.rows.find((r) => r.row === 91);
  assert.ok(wanted, "the contract spells out row 91");
  const entry = profileRow(91);
  assert.equal(entry.key, wanted.key);
  assert.equal(entry.default, wanted.default);
  assert.equal(entry.parity, wanted.parity);
  assert.ok(entry.registerRows.includes(wanted.register), "row 91 carries DV-049");
});

test("T038 row 92 (critic.warnSameModel, F124-FR-045) carries the value of the contract", () => {
  const wanted = contract.rows.find((r) => r.row === 92);
  assert.ok(wanted, "the contract spells out row 92");
  const entry = profileRow(92);
  assert.equal(entry.key, wanted.key);
  assert.equal(entry.default, wanted.default);
  assert.equal(entry.parity, wanted.parity);
  assert.ok(entry.registerRows.includes(wanted.register), "row 92 carries DV-034");
});

test("T038 rows 35 and 36 exist in the profile with the keys of the config-keys contract", () => {
  // Rows 35 and 36 belong to feature 110's spelling of the keys; the contract
  // lists them as owned without restating the cell. The profile is the source
  // of the value; the keys here are those of
  // specs/124-harness-discovery-and-roles/contracts/config-keys.json.
  const autoPick = profileRow(35);
  assert.equal(autoPick.key, "critic.autoPick");
  assert.equal(autoPick.default, "on");
  const defaults = profileRow(36);
  assert.deepEqual(defaults.keys.sort(), ["roles.critic.harness", "roles.proposer.harness"].sort());
});
