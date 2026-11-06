/**
 * T023 — the parity test PT-110-DV026-pins (F110-FR-023; DV-026; fixture
 * families FX-35, FX-36).
 *
 * DV-026, as `consolidation.md` records it: "the launch contract strips the
 * learning mode from the environment of every child and forces `off` unless the
 * stage declares it (011 FR-016; B-2561); it forces `--no-live` when colour is
 * never. Kept, as a rule: a key marked as pinned by the launch contract takes
 * the contract's value. It is the only rank above flags. It is a named
 * exception to decision 9." Row 38 of annex X §X.7 adds the parity half: under
 * the profile only the two as-is keys are honoured as pins.
 *
 * The table-level half runs now: the three pinnable keys, the rank above flags,
 * the removal of the shell value from the child's environment under every name
 * the key has, the two keys honoured under `parity`, and the refusal of a pin
 * outside a child of the runtime root — which is what makes a manual run on the
 * shell no run of a launch contract. The reference half — the comparison
 * against the reference trees of the oracle of feature 141 on FX-35 and FX-36 —
 * reports a SKIP with its reason while feature 141 is not built, and never a
 * pass.
 */
import assert from "node:assert/strict";
import test, { describe, it } from "node:test";

import { rankOfLayer } from "@specstride/contracts/envelope/config";
import { profileRow } from "@specstride/contracts/profile/parity";

import catalogue from "../../../../vendor/specs/141-parity-oracle/contracts/fixture-catalogue.json" with { type: "json" };

import {
  MANUAL_SHELL_RUN_IS_A_RUN_OF_A_LAUNCH_CONTRACT,
  PINNABLE_KEYS,
  PINNABLE_KEYS_UNDER_PARITY,
  PIN_RANK,
  PIN_REFUSAL_REASONS,
  childEnvironment,
  contractPins,
  environmentNamesOfKey,
  isPinnable,
  pinnableKeys,
} from "../../src/load/snapshot.ts";
import { resolveConfiguration } from "../../src/load/merge.ts";
import { matchCatalogueKey } from "../../src/schema/catalogue.ts";
import { PROFILE_NAME } from "../../src/schema/profile.ts";
import { referenceHalfFor } from "./oracle.ts";

/** The fixture families of PT-110-DV026-* (`tasks.md`, T023). */
const FAMILIES = ["FX-35", "FX-36"] as const;

type Family = { id: string; status: string; system: string; scenarios: { name: string }[] };

const FAMILIES_OF_THE_CATALOGUE = (catalogue as { families: Family[] }).families;

/** The row of annex X §X.7 that owns the parity half of the rule. */
const PIN_ROW = 38;

/** A child of the runtime root, which is the only place a pin applies. */
const IN_CHILD = { inRuntimeRootChild: true } as const;
/** A manual run on the shell. */
const ON_THE_SHELL = { inRuntimeRootChild: false } as const;

describe("PT-110-DV026-pins (table level): the pinnable keys (F110-FR-023)", () => {
  it("FX-35 and FX-36 are families of the catalogue of feature 141", () => {
    for (const id of FAMILIES) {
      const family = FAMILIES_OF_THE_CATALOGUE.find((f) => f.id === id);
      assert.notEqual(family, undefined, `${id} is in contracts/fixture-catalogue.json of 141`);
      assert.equal(family?.status, "active");
      assert.equal(family?.system, "mixture-of-loops");
    }
    // Both families exercise the learning mode of a child, which is what the
    // pin of DV-026 acts on.
    const fx35 = FAMILIES_OF_THE_CATALOGUE.find((f) => f.id === "FX-35");
    assert.ok((fx35?.scenarios ?? []).some((s) => s.name === "106-learning-exported"));
    const fx36 = FAMILIES_OF_THE_CATALOGUE.find((f) => f.id === "FX-36");
    assert.ok((fx36?.scenarios ?? []).some((s) => s.name === "learning-selection"));
  });

  it("the pinnable keys are the three the requirement names, and they are keys", () => {
    assert.deepEqual([...PINNABLE_KEYS], ["learning.mode", "learning.through", "output.live"]);
    for (const key of PINNABLE_KEYS) {
      const entry = matchCatalogueKey(key)?.entry;
      assert.notEqual(entry, undefined, key);
      // The catalogue lists `C` among the layers of each of them.
      assert.ok(entry?.layers.includes("C"), `${key} may be set by the contract pin`);
    }
    // The negative half: no other key may be pinned, including one that looks
    // like it could be.
    for (const key of ["learning.decisions", "output.color", "loop.maxIter", "profile"]) {
      assert.equal(isPinnable(key), false, key);
    }
  });

  it("the pin is rank 1, the only rank above flags (DV-026)", () => {
    assert.equal(PIN_RANK, 1);
    assert.equal(PIN_RANK, rankOfLayer["launch-contract-pin"]);
    assert.ok(PIN_RANK < rankOfLayer["flag"]);
    const outcome = contractPins({ "learning.mode": "apply" }, IN_CHILD);
    const resolved = resolveConfiguration({
      pins: outcome.pins,
      argv: ["--set", "learning.mode=off"],
      environment: { SPECSTRIDE_LEARNING: "suggest" },
      aliasTable: true,
    });
    const merged = resolved.values.get("learning.mode");
    assert.equal(merged?.value, "apply", "the contract pin beats the flag and the environment");
    assert.equal(merged?.source, "launch-contract-pin");
    assert.equal(merged?.rank, 1);
    assert.deepEqual(
      merged?.shadowed.map((s) => s.layer),
      ["flag", "environment", "default"],
    );
  });

  it("a key that is not pinnable is refused with `not-pinnable`", () => {
    const outcome = contractPins({ "loop.maxIter": 9, "learning.mode": "apply" }, IN_CHILD);
    assert.deepEqual(Object.keys(outcome.pins), ["learning.mode"]);
    assert.equal(outcome.refused.length, 1);
    assert.equal(outcome.refused[0]?.key, "loop.maxIter");
    assert.equal(outcome.refused[0]?.reason, "not-pinnable");
    assert.match(outcome.refused[0]?.message ?? "", /the pinnable keys are/);
    assert.match(outcome.refused[0]?.message ?? "", /learning\.mode/);
    assert.ok(PIN_REFUSAL_REASONS.includes("not-pinnable"));
  });
});

describe("PT-110-DV026-pins: only in a child of the runtime root", () => {
  it("a manual run on the shell is not a run of a launch contract", () => {
    assert.equal(MANUAL_SHELL_RUN_IS_A_RUN_OF_A_LAUNCH_CONTRACT, false);
    const outcome = contractPins({ "learning.mode": "apply", "output.live": true }, ON_THE_SHELL);
    assert.deepEqual(Object.keys(outcome.pins), []);
    assert.deepEqual([...outcome.offers], []);
    assert.equal(outcome.refused.length, 2);
    for (const refused of outcome.refused) {
      assert.equal(refused.reason, "not-in-a-child-of-the-runtime-root");
      assert.match(refused.message ?? "", /only in a child of the runtime root/);
      assert.match(refused.message ?? "", /manual run on the shell/);
    }
  });

  it("in a child of the runtime root the same declaration is honoured", () => {
    const outcome = contractPins({ "learning.mode": "apply", "output.live": true }, IN_CHILD);
    assert.deepEqual(Object.keys(outcome.pins).sort(), ["learning.mode", "output.live"]);
    assert.deepEqual([...outcome.refused], []);
    assert.equal(outcome.offers.length, 2);
    for (const offer of outcome.offers) {
      assert.equal(offer.layer, "launch-contract-pin");
      assert.equal(offer.place, "the launch contract");
    }
  });
});

describe("PT-110-DV026-pins: the shell value is removed from the child", () => {
  it("every name a pinned key has is removed from the child's environment", () => {
    // The learning mode has an as-is name (§K.8) and a derived name (§K.2 rule
    // 3); both carry the key, so both are removed.
    assert.deepEqual([...environmentNamesOfKey("learning.mode")].sort(), [
      "SPECSTRIDE_LEARNING",
      "SPECSTRIDE_LEARNING_MODE",
    ]);
    const pins = contractPins({ "learning.mode": "off" }, IN_CHILD).pins;
    const child = childEnvironment(
      {
        SPECSTRIDE_LEARNING: "apply",
        SPECSTRIDE_LEARNING_MODE: "suggest",
        SPECSTRIDE_MAX_ITER: "9",
        HOME: "/home/someone",
      },
      pins,
    );
    assert.deepEqual(Object.keys(child.environment).sort(), ["HOME", "SPECSTRIDE_MAX_ITER"]);
    assert.deepEqual(
      [...child.removed].sort((a, b) => a.name.localeCompare(b.name)),
      [
        { name: "SPECSTRIDE_LEARNING", key: "learning.mode" },
        { name: "SPECSTRIDE_LEARNING_MODE", key: "learning.mode" },
      ],
    );
  });

  it("the stripped child reads the pin and not an inherited value", () => {
    const pins = contractPins({ "learning.mode": "off" }, IN_CHILD).pins;
    const child = childEnvironment({ SPECSTRIDE_LEARNING: "apply" }, pins);
    const resolved = resolveConfiguration({
      pins,
      environment: child.environment,
      aliasTable: true,
    });
    const merged = resolved.values.get("learning.mode");
    assert.equal(merged?.value, "off");
    assert.equal(merged?.source, "launch-contract-pin");
    // Nothing was shadowed at rank 4: the name is gone from the child.
    assert.deepEqual(
      merged?.shadowed.filter((s) => s.layer === "environment"),
      [],
    );
  });

  it("a key that is not pinned keeps its shell value in the child", () => {
    const pins = contractPins({ "output.live": false }, IN_CHILD).pins;
    const child = childEnvironment({ SPECSTRIDE_LEARNING: "apply", SPECSTRIDE_LIVE: "true" }, pins);
    assert.deepEqual(Object.keys(child.environment), ["SPECSTRIDE_LEARNING"]);
    assert.deepEqual([...child.removed], [{ name: "SPECSTRIDE_LIVE", key: "output.live" }]);
  });
});

describe("PT-110-DV026-pins: under the `parity` profile only two are honoured", () => {
  it("row 38 of annex X §X.7 says so, and the two keys are the as-is ones", () => {
    const row = profileRow(PIN_ROW);
    assert.notEqual(row, undefined, `row ${PIN_ROW} of annex X §X.7`);
    assert.equal(row?.switch, "Pins of the launch contract");
    assert.equal(row?.default, "The pinnable keys");
    assert.equal(row?.parity, "The two as-is keys only");
    assert.deepEqual([...(row?.registerRows ?? [])], ["DV-026"]);
    assert.deepEqual([...PINNABLE_KEYS_UNDER_PARITY], ["learning.mode", "output.live"]);
  });

  it("`learning.through` is pinnable outside `parity` and not under it", () => {
    assert.equal(isPinnable("learning.through"), true);
    assert.equal(isPinnable("learning.through", PROFILE_NAME), false);
    assert.deepEqual([...pinnableKeys()], [...PINNABLE_KEYS]);
    assert.deepEqual([...pinnableKeys(PROFILE_NAME)], [...PINNABLE_KEYS_UNDER_PARITY]);
    // The catalogue states the same thing in its own cell.
    assert.match(matchCatalogueKey("learning.through")?.entry.cells.ownerFeature ?? "", /106/);
  });

  it("a pin of `learning.through` under `parity` is refused, naming the row", () => {
    const outcome = contractPins(
      { "learning.mode": "off", "learning.through": "run-0001", "output.live": false },
      { ...IN_CHILD, profile: PROFILE_NAME },
    );
    assert.deepEqual(Object.keys(outcome.pins).sort(), ["learning.mode", "output.live"]);
    assert.equal(outcome.refused.length, 1);
    assert.equal(outcome.refused[0]?.key, "learning.through");
    assert.equal(outcome.refused[0]?.reason, "not-honoured-under-parity");
    assert.match(outcome.refused[0]?.message ?? "", /row 38 of annex X §X\.7/);
    assert.match(outcome.refused[0]?.message ?? "", /parity/);
  });

  it("the same three pins outside `parity` are all honoured", () => {
    const outcome = contractPins(
      { "learning.mode": "off", "learning.through": "run-0001", "output.live": false },
      IN_CHILD,
    );
    assert.deepEqual(Object.keys(outcome.pins).sort(), [
      "learning.mode",
      "learning.through",
      "output.live",
    ]);
    assert.deepEqual([...outcome.refused], []);
  });

  it("the three refusal reasons are a closed set and each one is reachable", () => {
    assert.deepEqual(
      [...PIN_REFUSAL_REASONS],
      ["not-pinnable", "not-honoured-under-parity", "not-in-a-child-of-the-runtime-root"],
    );
    const reached = new Set<string>();
    for (const outcome of [
      contractPins({ "loop.maxIter": 9 }, IN_CHILD),
      contractPins({ "learning.through": "r" }, { ...IN_CHILD, profile: PROFILE_NAME }),
      contractPins({ "learning.mode": "off" }, ON_THE_SHELL),
    ]) {
      for (const refused of outcome.refused) reached.add(refused.reason);
    }
    assert.deepEqual([...reached].sort(), [...PIN_REFUSAL_REASONS].sort());
  });
});

test(
  "PT-110-DV026-pins (reference half): the port against the reference trees on FX-35, FX-36",
  referenceHalfFor(FAMILIES),
  () => {
    assert.fail(
      "the reference half must be written when the oracle of feature 141 is built; " +
        "until then this test skips with its reason and never passes",
    );
  },
);
