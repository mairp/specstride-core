/**
 * T013 — the parity test PT-110-DV025-pass-ceiling (F110-FR-015; DV-025;
 * fixture family FX-29).
 *
 * DV-025, as `consolidation.md` records it: "a learned pass ceiling beats the
 * global `--proposer-timeout` flag and loses to a per-phase setting (B-0302,
 * B-0303). Kept as it is, and recorded as a named place in the order." F110-FR-015
 * is where it is named: the order of the pass ceiling is an explicit per-phase
 * setting, the learned value, the value declared by the verification-commands
 * document, the role key — so a learned value loses only to a per-phase setting
 * and beats a global setting, whatever the rank of that global setting.
 *
 * The suite has two halves. The table-level half runs now: it asserts that the
 * port's own order is the baseline's, that a learned value applies only under the
 * mode `apply` and only for a knob of feature 106's allowlist, and that the source
 * of a learned value carries the id of its decision. The reference half — the
 * comparison against the reference trees of the oracle of feature 141 on the
 * fixture family FX-29 — reports a SKIP with its reason while feature 141 is not
 * built, and never a pass.
 */
import assert from "node:assert/strict";
import test, { describe, it } from "node:test";

import { rankOfLayer } from "@specstride/contracts/envelope/config";

import catalogue from "../../../../vendor/specs/141-parity-oracle/contracts/fixture-catalogue.json" with { type: "json" };

import { catalogueEntry } from "../../src/schema/catalogue.ts";
import {
  DEFAULT_RANK,
  KEY_OF_KNOB,
  LEARNABLE_KNOBS,
  LEARNED_RANK,
  LEARNING_MODE_THAT_APPLIES,
  PASS_CEILING_ORDER,
  POLL_INTERVAL_KEY,
  POLL_INTERVAL_ORDER,
  PER_PHASE_KEYS,
  learnedApplies,
  perPhaseInheritance,
  phaseOf,
  resolvePassCeiling,
  resolvePhaseKey,
  resolvePollInterval,
  roleKeyOfPhaseKey,
} from "../../src/load/phase.ts";
import type { ConfigOffer } from "../../src/load/merge.ts";
import { referenceHalfFor } from "./oracle.ts";

/** The fixture family of PT-110-DV025-* (`tasks.md`, T013). */
const FAMILIES = ["FX-29"] as const;

type Family = { id: string; status: string; system: string; surfaces: string[] };

const FAMILIES_OF_THE_CATALOGUE = (catalogue as { families: Family[] }).families;

/** The phase the fixture family drives, and the keys of its pass ceiling. */
const PHASE = "3";
const PHASE_KEY = `phases.${PHASE}.proposer.timeoutSec`;
const ROLE_KEY = "roles.proposer.timeoutSec";

/** The decision of the fixture: a learned ceiling of 1,200 seconds. */
const DECISION = {
  value: 1200,
  decisionId: "learn-0a1b2c3d4e5f",
  knob: "proposer_timeout",
} as const;

/** The value the verification-commands document declares for the phase. */
const DECLARED = { value: 2400, place: "the verification-commands document" } as const;

/** The global setting of the baseline: `--proposer-timeout`, which is the role key. */
const globalFlag = (seconds: number): ConfigOffer[] => [
  { key: ROLE_KEY, layer: "flag", value: seconds, place: `--proposer-timeout ${seconds}` },
];

/** The built-in default of the role key, at rank 8. */
const roleDefault = (): ConfigOffer[] => [
  { key: ROLE_KEY, layer: "default", value: 1800, place: "the built-in default of the catalogue" },
];

describe("PT-110-DV025-pass-ceiling (table level): the order of the pass ceiling (F110-FR-015)", () => {
  it("FX-29 is a family of the catalogue of feature 141", () => {
    const family = FAMILIES_OF_THE_CATALOGUE.find((f) => f.id === "FX-29");
    assert.notEqual(family, undefined, "FX-29 is in `contracts/fixture-catalogue.json` of 141");
    assert.ok((family?.surfaces ?? []).length > 0);
  });

  it("the order is the one the requirement names, in four named places", () => {
    assert.deepEqual(
      [...PASS_CEILING_ORDER],
      [
        "an explicit per-phase setting",
        "the learned value",
        "the value declared by the verification-commands document",
        "the role key",
      ],
    );
    assert.deepEqual(
      [...POLL_INTERVAL_ORDER],
      ["an explicit setting", "the learned value", "the default"],
    );
  });

  it("DV-025: a learned ceiling beats the global `--proposer-timeout` flag", () => {
    const resolution = resolvePassCeiling({
      key: PHASE_KEY,
      offers: [...globalFlag(900), ...roleDefault()],
      declared: DECLARED,
      learned: DECISION,
      learningMode: LEARNING_MODE_THAT_APPLIES,
    });
    assert.equal(resolution?.value, DECISION.value);
    assert.equal(resolution?.step, "the learned value");
    assert.equal(resolution?.source, "learned-value");
    assert.equal(resolution?.rank, LEARNED_RANK);
    assert.equal(LEARNED_RANK, 7, "rank 7 of annex X §X.2, kept from the baseline");
    // The global flag stands at rank 2 and still loses: the order of the ceiling
    // is not the bare rank order (F106-FR-010).
    assert.equal(rankOfLayer["flag"], 2);
    assert.equal(resolution?.decisionId, DECISION.decisionId);
  });

  it("DV-025: a learned ceiling loses to an explicit per-phase setting", () => {
    const resolution = resolvePassCeiling({
      key: PHASE_KEY,
      offers: [
        {
          key: PHASE_KEY,
          layer: "environment",
          value: 600,
          place: `SPECSTRIDE_PROPOSER_TIMEOUT_PHASE_${PHASE}`,
        },
        ...globalFlag(900),
        ...roleDefault(),
      ],
      declared: DECLARED,
      learned: DECISION,
      learningMode: LEARNING_MODE_THAT_APPLIES,
    });
    assert.equal(resolution?.value, 600);
    assert.equal(resolution?.step, "an explicit per-phase setting");
    assert.equal(resolution?.source, "environment");
    assert.equal(resolution?.phase, PHASE);
  });

  it("the whole order, one place at a time: each place in turn decides", () => {
    const base = {
      key: PHASE_KEY,
      learningMode: LEARNING_MODE_THAT_APPLIES,
    } as const;
    // 1. an explicit per-phase setting
    assert.equal(
      resolvePassCeiling({
        ...base,
        offers: [
          { key: PHASE_KEY, layer: "flag", value: 600 },
          ...globalFlag(900),
          ...roleDefault(),
        ],
        declared: DECLARED,
        learned: DECISION,
      })?.value,
      600,
    );
    // 2. the learned value
    assert.equal(
      resolvePassCeiling({
        ...base,
        offers: [...globalFlag(900), ...roleDefault()],
        declared: DECLARED,
        learned: DECISION,
      })?.value,
      DECISION.value,
    );
    // 3. the value the document declares, which is the default of the per-phase key
    const declaredOnly = resolvePassCeiling({
      ...base,
      offers: [...globalFlag(900), ...roleDefault()],
      declared: DECLARED,
    });
    assert.equal(declaredOnly?.value, DECLARED.value);
    assert.equal(declaredOnly?.step, "the value declared by the verification-commands document");
    assert.equal(declaredOnly?.source, "default");
    assert.equal(declaredOnly?.rank, DEFAULT_RANK, "rank 8: it is the default of the key");
    // 4. the role key, whichever rank set it
    const roleOnly = resolvePassCeiling({
      ...base,
      offers: [...globalFlag(900), ...roleDefault()],
    });
    assert.equal(roleOnly?.value, 900);
    assert.equal(roleOnly?.step, "the role key");
    assert.equal(roleOnly?.inheritedFrom, ROLE_KEY);
    assert.equal(roleOnly?.source, "flag");
    // and with no flag either, the built-in default of the role key.
    const bare = resolvePassCeiling({ ...base, offers: roleDefault() });
    assert.equal(bare?.value, 1800);
    assert.equal(bare?.source, "default");
  });

  it("a learned value applies only under the mode `apply`", () => {
    for (const mode of [undefined, "off", "suggest", "APPLY"]) {
      const resolution = resolvePassCeiling({
        key: PHASE_KEY,
        offers: roleDefault(),
        declared: DECLARED,
        learned: DECISION,
        ...(mode === undefined ? {} : { learningMode: mode }),
      });
      assert.equal(resolution?.value, DECLARED.value, `mode ${String(mode)}`);
      assert.equal(resolution?.step, "the value declared by the verification-commands document");
    }
    assert.equal(learnedApplies("apply", "proposer_timeout"), true);
    assert.equal(learnedApplies("suggest", "proposer_timeout"), false);
    assert.equal(catalogueEntry("learning.mode")?.type.members?.includes("apply"), true);
  });

  it("a learned value applies only for a knob of feature 106's allowlist (F106-FR-001)", () => {
    assert.deepEqual([...LEARNABLE_KNOBS], ["proposer_timeout", "yield_poll_interval"]);
    assert.equal(KEY_OF_KNOB.proposer_timeout, "phases.<N>.proposer.timeoutSec");
    assert.equal(KEY_OF_KNOB.yield_poll_interval, "loop.yield.pollSec");
    assert.equal(learnedApplies("apply", "grounding_cap"), false);
    assert.equal(learnedApplies("apply", "critic_timeout"), false);
    const refused = resolvePassCeiling({
      key: PHASE_KEY,
      offers: roleDefault(),
      declared: DECLARED,
      learned: { value: 1200, decisionId: "learn-ffffffffffff", knob: "grounding_cap" as never },
      learningMode: "apply",
    });
    assert.equal(refused?.value, DECLARED.value, "a knob outside the allowlist changes nothing");
  });

  it("the poll interval: an explicit setting, the learned value, the default", () => {
    assert.equal(POLL_INTERVAL_KEY, "loop.yield.pollSec");
    const learned = {
      value: 20,
      decisionId: "learn-123456abcdef",
      knob: "yield_poll_interval",
    } as const;
    const offers: ConfigOffer[] = [
      {
        key: POLL_INTERVAL_KEY,
        layer: "default",
        value: 30,
        place: "the built-in default of the catalogue",
      },
    ];
    assert.equal(resolvePollInterval({ offers })?.value, 30);
    assert.equal(resolvePollInterval({ offers })?.step, "the default");
    const withLearned = resolvePollInterval({ offers, learned, learningMode: "apply" });
    assert.equal(withLearned?.value, 20);
    assert.equal(withLearned?.step, "the learned value");
    assert.equal(withLearned?.decisionId, learned.decisionId);
    assert.equal(withLearned?.rank, LEARNED_RANK);
    const explicit = resolvePollInterval({
      offers: [
        ...offers,
        { key: POLL_INTERVAL_KEY, layer: "environment", value: 45, place: "SPECSTRIDE_YIELD_POLL" },
      ],
      learned,
      learningMode: "apply",
    });
    assert.equal(explicit?.value, 45);
    assert.equal(explicit?.step, "an explicit setting");
  });

  it("a per-phase key no rank sets takes the value of the role key, whichever rank set it", () => {
    const inheritance = perPhaseInheritance();
    assert.equal(inheritance.get("phases.<N>.proposer.timeoutSec"), "roles.proposer.timeoutSec");
    assert.equal(inheritance.get("phases.<N>.critic.harness"), "roles.critic.harness");
    assert.equal(roleKeyOfPhaseKey("phases.7.proposer.model"), "roles.proposer.model");
    assert.equal(roleKeyOfPhaseKey("phases.7.budget.costUsd"), "budget.run.costUsd");
    assert.equal(phaseOf("phases.7.proposer.model"), "7");
    assert.equal(phaseOf("roles.proposer.model"), undefined);
    assert.equal(PER_PHASE_KEYS.length, 9, "the nine template keys of §K.4");

    const inherited = resolvePhaseKey({
      key: "phases.3.proposer.model",
      offers: [
        {
          key: "roles.proposer.model",
          layer: "user-configuration",
          value: "a-model",
          place: "/u/config.yaml",
        },
      ],
    });
    assert.equal(inherited?.value, "a-model");
    assert.equal(inherited?.step, "the role key");
    assert.equal(inherited?.source, "user-configuration");
    assert.equal(inherited?.inheritedFrom, "roles.proposer.model");

    const refined = resolvePhaseKey({
      key: "phases.3.proposer.model",
      offers: [
        { key: "roles.proposer.model", layer: "user-configuration", value: "a-model" },
        { key: "phases.3.proposer.model", layer: "project-configuration", value: "another-model" },
      ],
    });
    assert.equal(refined?.value, "another-model");
    assert.equal(refined?.step, "an explicit per-phase setting");
    assert.equal(refined?.inheritedFrom, undefined);
  });

  it("the catalogue states that the per-phase timeout keys inherit and declare", () => {
    const entry = catalogueEntry("phases.<N>.proposer.timeoutSec");
    assert.match(entry?.cells.default ?? "", /verification-commands document/);
    assert.match(entry?.cells.default ?? "", /inherits the role key/);
    assert.equal(entry?.snapshot, "t");
    assert.equal(
      catalogueEntry("phases.<N>.proposer.harness")?.cells.default,
      "inherits the role key",
    );
  });
});

test(
  "PT-110-DV025-pass-ceiling (reference half): the port against the reference trees on FX-29",
  referenceHalfFor(FAMILIES),
  () => {
    assert.fail(
      "the reference half must be written when the oracle of feature 141 is built; " +
        "until then this test skips with its reason and never passes",
    );
  },
);
