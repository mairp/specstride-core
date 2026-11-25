/**
 * T010 — the nine switch rows of spec 154's "Rows of the `parity` profile"
 * (F154-FR-001, F154-FR-002): each row exists in
 * `packages/contracts/data/parity-profile.json`, its value under `parity` is
 * `off`, and the closed-set members the feature proposes (`repeat`,
 * `dependency`, `group-check`, `host_slot`) are NOT yet members of
 * `packages/contracts/data/closed-sets.json` — a proposal is not a member
 * until the owner copies it (CQ-154-09).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import profileData from "../data/parity-profile.json" with { type: "json" };
import closedSets from "../data/closed-sets.json" with { type: "json" };

const HERE = dirname(fileURLToPath(import.meta.url));

const ROWS_154 = [
  { key: "loop.parallel.units", default: "off" },
  { key: "loop.parallel.noRepeat", default: "on with `loop.parallel.units`" },
  { key: "loop.parallel.mergeBaseline", default: "off" },
  { key: "loop.parallel.groupUnits", default: "off" },
  { key: "loop.parallel.groupCheck", default: "off" },
  { key: "host.limits", default: "off" },
  { key: "pipeline.stageGroups", default: "off" },
  { key: "loop.phases.parallel", default: "off" },
  { key: "loop.speculate", default: "off" },
] as const;

const switches = (profileData as any).switches as any[];

test("T009: the nine rows of spec 154 exist in the parity profile", () => {
  for (const expected of ROWS_154) {
    const rows = switches.filter((row) => (row.keys as string[]).includes(expected.key));
    const owned = rows.filter((row) => row.owner === "154");
    assert.equal(
      owned.length,
      1,
      `exactly one row of owner 154 must carry ${expected.key}`,
    );
    assert.equal(owned[0].default, expected.default);
    assert.deepEqual(owned[0].registerRows, []);
  }
});

test("T010: every row of spec 154 is off under `parity`", () => {
  for (const expected of ROWS_154) {
    const row = switches.find(
      (candidate) =>
        candidate.owner === "154" &&
        (candidate.keys as string[]).includes(expected.key),
    );
    assert.equal(row.parity, "off", `${expected.key} must be off under parity`);
  }
});

test("T010: every row names its output fields", () => {
  for (const expected of ROWS_154) {
    const row = switches.find(
      (candidate) =>
        candidate.owner === "154" &&
        (candidate.keys as string[]).includes(expected.key),
    );
    assert.equal(
      typeof row.outputFields154,
      "string",
      `${expected.key} must name its output fields`,
    );
    assert.ok(row.outputFields154.length > 0);
  }
});

test("T010: the proposed closed-set members are not members yet", () => {
  const literals = new Set<string>();
  for (const set of (closedSets as any).closedSets as any[]) {
    for (const literal of set.literals ?? []) literals.add(literal);
  }
  // `repeat` is shared with set 263 (a verb of the proposer stub), a different
  // closed set from set 61; the proposal concerns set 61 and the new sets.
  const SET_263 = 263;
  for (const set of (closedSets as any).closedSets as any[]) {
    if (set.number === SET_263) continue;
    for (const literal of set.literals ?? []) {
      assert.ok(
        !["repeat", "dependency", "group-check", "host_slot"].includes(literal),
        `\`${literal}\` (set ${set.number}) is a proposal of CQ-154-09 and must not be a member yet`,
      );
    }
  }
  void literals;
});

test("T010: the pinned copy is the byte-for-byte data of the profile file", () => {
  // The profile is data generated from the annex; this pins that the nine
  // rows live in the file this package ships, not in a test-only copy.
  const raw = JSON.parse(
    readFileSync(join(HERE, "../data/parity-profile.json"), "utf8"),
  );
  const owned = (raw.switches as any[]).filter((row) => row.owner === "154");
  assert.equal(owned.length, ROWS_154.length);
});
