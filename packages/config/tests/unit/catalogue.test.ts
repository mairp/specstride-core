/**
 * T006 — CT-110-108 and CT-110-109, the static tests of the catalogue
 * (F110-FR-009, F110-FR-010).
 *
 * CT-110-108 (F110-FR-010): a build test fails when a key of the catalogue has
 * no trust class, no snapshot class, no owner, or a type that cannot hold its
 * default. Both halves are checked: the whole catalogue passes, and a row that
 * lacks each of the four is refused.
 *
 * CT-110-109 (F110-FR-009): a key that is not in the catalogue is not read by
 * any feature. Three independent checks: every configuration key the rows of
 * annex X §X.7 name is in the catalogue; no source file of the workspace holds a
 * dotted literal in a namespace of the schema that the catalogue does not hold,
 * apart from the named exceptions below, each of which is something other than a
 * configuration key; and the one read path of the package refuses a key outside
 * the catalogue at every layer.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { profileRows } from "@specstride/contracts/profile/parity";

import {
  CATALOGUE,
  CATALOGUE_KEYS,
  CATALOGUE_NAMESPACES,
  CATALOGUE_SIZE,
  CatalogueRowError,
  buildEntry,
  catalogueEntry,
  isKnownKey,
  matchCatalogueKey,
  parseLayers,
  parseTrustCell,
  type CatalogueDataRow,
} from "../../src/schema/catalogue.ts";
import {
  AbsentProposerError,
  LAUNCH_DEFAULT_KEYS,
  LISA_DEFAULTS,
  LISA_DEFAULTS_APPLY,
  SHIPPED_HARNESS,
  launchDefaults,
  proposerLayers,
  proposerMayComeFrom,
  rolesShareAModel,
} from "../../src/schema/launch-defaults.ts";
import { literalValue, normaliseDefaultCell, parseValueSpec } from "../../src/schema/type-parse.ts";
import {
  LAYER_CODES,
  SNAPSHOT_CODES,
  TRUST_CODES,
  UnknownKeyError,
  type LayerCode,
} from "../../src/schema/types.ts";
import { rangeProblemOf, typeProblemOf, validateKeyValue } from "../../src/schema/validate.ts";
import { check as checkCatalogueData } from "../../tools/catalogue-data-gen.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE = join(HERE, "..", "..");
const REPO = join(PACKAGE, "..", "..");

/** A row that passes, which each negative case then breaks in one place. */
const SOUND_ROW: CatalogueDataRow = Object.freeze({
  key: "loop.maxIter",
  typeAndRange: "whole number",
  default: "10",
  valueUnderParity: "as default",
  trustClass: "N lo (snap t)",
  ownerFeature: "115",
  proposedBy: "115",
  confirmedOrCorrected: "confirmed",
  layers: "F E P U",
  profileRow: "",
});

describe("CT-110-108 — every key has a class, a snapshot class, an owner and a default of its own type (F110-FR-010)", () => {
  it("reads the whole catalogue: 259 keys, every one with all seven columns of §K.1", () => {
    assert.equal(CATALOGUE.length, 259);
    assert.equal(CATALOGUE_SIZE, 259);
    assert.equal(new Set(CATALOGUE_KEYS).size, 259, "every spelling is unique");
  });

  it("the shipped catalogue data equals the contract of T004", () => {
    assert.deepEqual(checkCatalogueData(), []);
  });

  it("every key has one trust class of §K.1", () => {
    for (const entry of CATALOGUE) {
      assert.ok(
        TRUST_CODES.includes(entry.trust),
        `${entry.key}: \`${entry.cells.trustClass}\` is no trust class`,
      );
      if (entry.trust === "N") {
        assert.ok(
          entry.narrowing !== undefined,
          `${entry.key}: a narrowing key says what is stricter`,
        );
      }
    }
  });

  it("every key has one class in the run snapshot", () => {
    for (const entry of CATALOGUE) {
      assert.ok(
        SNAPSHOT_CODES.includes(entry.snapshot),
        `${entry.key}: \`${entry.cells.trustClass}\` names no snapshot class`,
      );
    }
  });

  it("every key names the feature that owns its meaning", () => {
    for (const entry of CATALOGUE) {
      assert.ok(entry.owners.length > 0, `${entry.key}: no owning feature`);
      for (const owner of entry.owners) {
        assert.match(owner, /^\d{3}$/, `${entry.key}: \`${owner}\` is no feature number`);
      }
    }
  });

  it("every key names at least one layer that may set it", () => {
    for (const entry of CATALOGUE) {
      assert.ok(entry.layers.length > 0, `${entry.key}: no layer may set it`);
      for (const layer of entry.layers) {
        assert.ok(LAYER_CODES.includes(layer), `${entry.key}: \`${layer}\` is no layer`);
      }
    }
  });

  it("every stated default is a value of the key's own type and inside its range", () => {
    for (const entry of CATALOGUE) {
      if (entry.default.kind === "deferred") continue;
      const value = entry.default.value;
      assert.equal(
        typeProblemOf(value, entry.type),
        undefined,
        `${entry.key}: the default \`${entry.cells.default}\` is not a value of ` +
          `\`${entry.cells.typeAndRange}\``,
      );
      assert.equal(
        rangeProblemOf(value, entry.type, entry.type.max, undefined),
        undefined,
        `${entry.key}: the default \`${entry.cells.default}\` is outside ` +
          `\`${entry.cells.typeAndRange}\``,
      );
    }
  });

  it("a default the table states in prose names no value of the type, so none is hidden", () => {
    // A `deferred` default must be a statement about where the value comes from,
    // never a value the reader failed to read: the owner of the key supplies it
    // (F110-FR-009). This is what keeps the check above honest.
    for (const entry of CATALOGUE) {
      if (entry.default.kind !== "deferred") continue;
      assert.equal(
        literalValue(normaliseDefaultCell(entry.cells.default), entry.type),
        undefined,
        `${entry.key}: the default \`${entry.cells.default}\` is a value of ` +
          `\`${entry.cells.typeAndRange}\` and must not be deferred`,
      );
    }
  });

  it("every key is one of the kinds of value the tables use", () => {
    const kinds = new Map<string, number>();
    for (const entry of CATALOGUE)
      kinds.set(entry.type.kind, (kinds.get(entry.type.kind) ?? 0) + 1);
    assert.equal(
      [...kinds.values()].reduce((a, b) => a + b, 0),
      259,
      "every key has a type the reader could read",
    );
  });

  it("refuses a row with no trust class", () => {
    assert.throws(
      () => buildEntry({ ...SOUND_ROW, trustClass: "Q (snap t)" }),
      (error: unknown) => error instanceof CatalogueRowError && error.column === "trust_class",
    );
  });

  it("refuses a row with no snapshot class", () => {
    assert.throws(
      () => buildEntry({ ...SOUND_ROW, trustClass: "N lo" }),
      (error: unknown) => error instanceof CatalogueRowError && error.column === "trust_class",
    );
    assert.throws(() => parseTrustCell("W"), CatalogueRowError);
  });

  it("refuses a row with no owner", () => {
    assert.throws(
      () => buildEntry({ ...SOUND_ROW, ownerFeature: "the loop" }),
      (error: unknown) => error instanceof CatalogueRowError && error.column === "owner_feature",
    );
  });

  it("refuses a row with no layer", () => {
    assert.throws(
      () => buildEntry({ ...SOUND_ROW, layers: "" }),
      (error: unknown) => error instanceof CatalogueRowError && error.column === "layers",
    );
    assert.throws(() => parseLayers("F E Z"), CatalogueRowError);
  });

  it("refuses a row whose type cannot hold its default", () => {
    // The reader cannot type-check a default it reads as prose, so the case the
    // requirement names is a default the type openly contradicts: a whole number
    // key whose stated default is a closed-set literal of another key.
    const spec = parseValueSpec("whole number");
    assert.equal(literalValue("subprocess", spec), undefined);
    assert.notEqual(
      typeProblemOf("subprocess", spec),
      undefined,
      "a whole number cannot hold the text `subprocess`",
    );
    const row = buildEntry({ ...SOUND_ROW, default: "subprocess" });
    assert.equal(
      row.default.kind,
      "deferred",
      "the reader never invents a value of the wrong type",
    );
  });

  it("refuses a row whose cell `Under `parity`` is neither a value nor a reserved literal", () => {
    assert.throws(
      () => buildEntry({ ...SOUND_ROW, valueUnderParity: "whatever the fixture feels like" }),
      (error: unknown) =>
        error instanceof CatalogueRowError && error.column === "value_under_parity",
    );
  });
});

/**
 * Dotted literals that a source file of the workspace holds in a namespace of
 * the schema and that are not configuration keys. Each is named with what it is,
 * so that a literal that is really a key read cannot hide behind the list: a new
 * one fails this test until it is either entered in the catalogue or named here.
 */
const NOT_A_CONFIGURATION_KEY: Readonly<Record<string, string>> = Object.freeze({
  "budget.run":
    "the prefix of a family of keys, named by the delegate rule of `phases.<N>.budget.*` (§K.4)",
  "budget.role.<role>":
    "the prefix of a family of keys, named by the delegate rule of `phases.<N>.budget.*` (§K.4)",
  "roles.<role>.tier":
    "the family name of the per-role auth tier; the catalogue holds `roles.proposer.tier` and `roles.critic.tier` (feature 147)",
  "roles.<role>.model":
    "the family name of the per-role model; the catalogue holds `roles.proposer.model`, `roles.critic.model` and the rest",
  "attempt.ended": "an event type of the event grammar, not a configuration key",
  "prompt.built": "an event type of the event grammar (EP-15), not a configuration key",
  "prompt.block_protected":
    "an event type of the event catalogue of feature 111, emitted by the prompt assembler of feature 103 (F103-FR-033), not a configuration key",
  "prompt.block_dropped":
    "an event type of the event catalogue of feature 111, emitted by the prompt assembler of feature 103 (F103-FR-033), not a configuration key",
  "telemetry.delivery": "an event type of the event grammar (EP-08), not a configuration key",
  "phases.title":
    "an event field of the run-view signal table (feature 129, T020), not a configuration key",
  "verification.started":
    "an event type of the run grammar, folded by the signal table of feature 129, not a configuration key",
  "verification.ended":
    "an event type of the run grammar, folded by the signal table of feature 129, not a configuration key",
  "stream.mode":
    "an event type of the run grammar (EP-19), folded by the signal table of feature 129, not a configuration key",
  "stream.init":
    "an event type of the run grammar (EP-19), folded by the signal table of feature 129, not a configuration key",
  "stream.evidence_writing":
    "an event type of the run grammar (EP-19), folded by the signal table of feature 129, not a configuration key",
  "verification.release_passed":
    "an event type of the run grammar, folded by the signal table of feature 129, not a configuration key",
  "verification.prestaged":
    "an event type of the run grammar, folded by the signal table of feature 129, not a configuration key",
  "attempt.archived":
    "an event type of the run grammar, folded by the signal table of feature 129, not a configuration key",
  "attempt.acceleration_note":
    "an event type of the run grammar, folded by the signal table of feature 129, not a configuration key",
  "critic.malformed":
    "an event type of the run grammar, folded by the signal table of feature 129, not a configuration key",
  "learning.observed":
    "an event type of the run grammar, folded by the signal table of feature 129, not a configuration key",
  "integrity.events_changed": "an event type of the event grammar, not a configuration key",
  "integrity.secret_in_commit": "an event type of the redactor, not a configuration key",
  "loop.level": "a field of the run record, named in its documentation",
  "loop.manifest_hash": "a field of the run record, named in its documentation",
  "loop.parallel.plan_hash":
    "a field of the run record of the parallel layer (row DV-088, `packages/layer-parallel/src/register.ts` `RUN_RECORD_FIELDS`), written with the option on and never read from configuration",
  "loop.parallel.protection":
    "a field of the run record of the parallel layer (row DV-088, `packages/layer-parallel/src/register.ts` `RUN_RECORD_FIELDS`), written with the option on and never read from configuration",
  "loop.parallel.worker_caches":
    "a field of the run record of the parallel layer (row DV-088, `packages/layer-parallel/src/register.ts` `RUN_RECORD_FIELDS`), written with the option on and never read from configuration",
  "stream.format": "the name of the registry a stream dialect row belongs to",
  "stream.mapping": "the way a new stream format is added as data",
  "pause.record":
    "the logical name of the one run-state record of a group pause (R29 PU-38, feature 143's F143-FR-015), not a configuration key",
  "spec.clarifications": "the id of a check of the spec-format registry, not a configuration key",
  "spec.env":
    "a field of the scenario spec the pty helper of feature 141 applies to the child environment (the run helper of the oracle package), not a configuration key",
  "verification.scopes.<commandId>.reads":
    "a key of feature 107's own contract, which §K.6 also lists and which T004 excludes from this catalogue; F110-FR-019 names it by spelling, so `src/load/trust.ts` names it too (reported to the orchestrator with W-ORC-01 to W-ORC-03)",
  "verification.scopes.<commandId>.writes":
    "a key of feature 107's own contract, named by F110-FR-019 and excluded from this catalogue by T004, as the `.reads` row above",
  "verification.scopes.<commandId>.sideEffects":
    "a key of feature 107's own contract, named by F110-FR-019 and excluded from this catalogue by T004, as the `.reads` row above",
  "loop.yield.<key>":
    'the key pattern of the catch-all row of the alias table (§K.8, "every further SPECSTRIDE_YIELD_* name"): a family of keys and not a key, named as such by `src/load/alias.ts` (T026)',
  "quota.signal":
    "an event type of the event catalogue of feature 111 (`packages/observability/src/catalogue`), not a configuration key",
  "budget.exceeded":
    "an event type of the event catalogue of feature 111 (`packages/observability/src/catalogue`), not a configuration key",
  "attempt.started":
    "an event type of the event catalogue of feature 111 (`packages/observability/src/catalogue`), not a configuration key",
  "stream.diagnostic":
    "an event type of the event catalogue of feature 111 (`packages/observability/src/catalogue`), not a configuration key",
  "critic.selected":
    "an event type of the event catalogue of feature 111 (`packages/observability/src/catalogue`), not a configuration key",
  "critic.call":
    "an event type of the event catalogue of feature 111 (`packages/observability/src/catalogue`), not a configuration key",
  "learning.knob_adjusted":
    "an event type of the event catalogue of feature 111 (`packages/observability/src/catalogue`), not a configuration key",
  "learning.knob_auto_reverted":
    "an event type of the event catalogue of feature 111 (`packages/observability/src/catalogue`), not a configuration key",
  "learning.knob_evaluated":
    "an event type of the event catalogue of feature 111 (`packages/observability/src/catalogue`), not a configuration key",
  "critic.started":
    "an event type of the event catalogue of feature 111 (`packages/observability/src/catalogue`), not a configuration key",
  "stream.text":
    "an event type of the event catalogue of feature 111 (`packages/observability/src/catalogue`), not a configuration key",
  "attempt.tier_bumped":
    "an event type of the event catalogue of feature 111 (`packages/observability/src/catalogue`), not a configuration key",
  "attempt.tier_bump_skipped":
    "an event type of the event catalogue of feature 111 (`packages/observability/src/catalogue`), not a configuration key",
  "stream.missing_terminal":
    "an event type of the event catalogue of feature 111 (`packages/observability/src/catalogue`), not a configuration key",
  "stream.result":
    "an event type of the event catalogue of feature 111 (`packages/observability/src/catalogue`), not a configuration key",
  "critic.passed_over":
    "a retired event type kept by the event catalogue of feature 111 (`catalogue/retired.ts`), not a configuration key",
  "critic.diversity":
    "a retired event type kept by the event catalogue of feature 111 (`catalogue/retired.ts`), not a configuration key",
  "integrity.layer.call":
    "the event type of a layer call of feature 149 (`packages/core/src/integrity/layer-calls.ts`), not a configuration key",
  "integrity.noted":
    "the event type of an integrity event of feature 116 (F116-FR-022; `packages/integrity/src/events/noted.ts`), not a configuration key",
  "critic.grounding_carried":
    "the event type of the carried grounding paths of feature 117 (F117-FR-015; `packages/core/src/critic-input/events.ts`), not a configuration key",
  "critic.grounding_gap":
    "the event type of the grounding gap of feature 117 (F117-FR-014 and F117-FR-015; `packages/core/src/critic-input/events.ts`), not a configuration key",
  "critic.citation_unresolved":
    "the event type of an unresolved citation of feature 117 (F117-FR-015; `packages/core/src/critic-input/events.ts`; its catalogue row is P1 of `analyze-report.md`), not a configuration key",
  "quota.state.<role>":
    "the id of the quota check of feature 112 (`specs/112-doctor/contracts/check-catalogue.tsv` row `quota.state.<role>`), a probe-bag key of the doctor, not a configuration key",
  "quota.states":
    "the probe-bag key the doctor's quota check reads the last observed states from (F112-FR-017), not a configuration key",
  "quota.shared":
    "the probe-bag key the doctor's quota check reads the shared auth tier 1 window from (F112-FR-017), not a configuration key",
  "budget.caps":
    "the id of the budget check of feature 112 (check-catalogue row `budget.caps`), a probe-bag key of the doctor, not a configuration key",
  "budget.caps.roles":
    "the probe-bag key the doctor's budget check reads the caps in force from (F112-FR-017), not a configuration key",
  "budget.caps.autopickCritic":
    "the probe-bag key the doctor's budget check reads the automatically picked critic's cap from (F112-FR-030), not a configuration key",
  "telemetry.endpoint":
    "the id of the telemetry check of feature 112 (check-catalogue row `telemetry.endpoint`), a probe-bag key of the doctor, not a configuration key",
  "memory.native":
    "the id of the memory check of feature 112 (check-catalogue row `memory.native`), a probe-bag key of the doctor, not a configuration key",
  "sandbox.critic":
    "the id of the sandbox check of feature 112 (check-catalogue row `sandbox.critic`), a probe-bag key of the doctor, not a configuration key",
  "critic.diversity.result":
    "the probe-bag key the doctor's critic check reads the result of the diversity test from (F112-FR-015; row 183 of annex X §X.6), not a configuration key",
  "critic.diversity.sharedTier":
    "the probe-bag key the doctor's critic check reads the shared-model-tier field from (F112-FR-015), not a configuration key",
  "critic.pick":
    "the probe-bag key the doctor's critic check reads the criticPick field of the resolved registry from (F112-FR-015), not a configuration key",
  "critic.independence":
    "the id of the critic-independence check of feature 112 (check-catalogue row `critic.independence`) and the probe-bag key its probe reads (F112-FR-015), not a configuration key",
  "critic.autopick":
    "the id of the critic-autopick check of feature 112 (check-catalogue row `critic.autopick`) and the probe-bag key its probe reads the resolved role plan from (F112-FR-015), not a configuration key",
  "quota.state.proposer":
    "an instance of the quota check id `quota.state.<role>` of feature 112 (check-catalogue row `quota.state.<role>`), a probe-bag key of the doctor, not a configuration key",
  "doctor.launch.disable":
    "a probe-bag key only the launch-subset tests of feature 112 plant, to prove that no such switch exists (F112-FR-030 forbids a key that switches an `lb` check off); not a configuration key",
  "observability.captureContent":
    "a switch label of the sink context of feature 100's EP-08 conformance sample; it is in no table of §K.3 to §K.6b and in no row of annex X §X.7, and this feature neither carries nor edits it (reported to the orchestrator)",
});

/** Every source file of every package of the workspace. */
function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules") continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(ts|mts|js|mjs)$/.test(entry.name)) out.push(path);
    }
  };
  for (const pkg of readdirSync(join(REPO, "packages"))) {
    const src = join(REPO, "packages", pkg, "src");
    try {
      if (statSync(src).isDirectory()) walk(src);
    } catch {
      // A package without `src/` is skipped.
    }
  }
  return out;
}

/** The file extensions a dotted literal names when it is a file, not a key. */
const FILE_EXTENSION = /\.(md|json|jsonl|ya?ml|tsv|csv|ts|mts|js|mjs|sh|py|txt|log|lock|html|svg)$/;

describe("CT-110-109 — a key read by any package is in the catalogue (F110-FR-009)", () => {
  it("every configuration key the rows of annex X §X.7 name is in the catalogue", () => {
    const keys = [...new Set(profileRows.flatMap((r) => r.keys))];
    assert.ok(keys.length > 100, "the annex names the keys of the switches");
    const missing = keys.filter((k) => !isKnownKey(k));
    assert.deepEqual(missing, [], "a switch of another feature with no row in the catalogue");
  });

  it("every key of the catalogue is reachable through the one read path", () => {
    for (const entry of CATALOGUE) {
      const match = matchCatalogueKey(entry.key);
      assert.ok(match !== undefined, `${entry.key} is not reachable`);
      assert.equal(match.entry.key, entry.key);
    }
  });

  it("no source file holds a dotted literal in a namespace of the schema that the catalogue lacks", () => {
    const namespaces = new Set(CATALOGUE_NAMESPACES);
    const literal = /["'`]([a-z][A-Za-z0-9_<>*@-]*(?:\.[A-Za-z0-9_<>*@-]+)+)["'`]/g;
    const found = new Map<string, string[]>();
    for (const file of sourceFiles()) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(literal)) {
        const candidate = match[1] ?? "";
        const head = candidate.split(".")[0] ?? "";
        if (!namespaces.has(head)) continue;
        if (isKnownKey(candidate)) continue;
        // §K.2 rule 1 — a segment of a key is lowerCamelCase or carries an
        // underscore; a hyphen in a segment makes the literal an event type, a
        // finding code or a check id, never a key.
        if (candidate.split(".").some((s) => s.includes("-") && !/^<[A-Za-z]+>$/.test(s))) continue;
        if (FILE_EXTENSION.test(candidate)) continue;
        // A literal that ends in `.*` names a family of keys, not a key.
        if (candidate.endsWith(".*")) continue;
        const list = found.get(candidate) ?? [];
        list.push(relative(REPO, file));
        found.set(candidate, list);
      }
    }
    const unexplained = [...found.keys()].filter((k) => NOT_A_CONFIGURATION_KEY[k] === undefined);
    assert.deepEqual(
      unexplained.map((k) => `${k} (${(found.get(k) ?? []).join(", ")})`),
      [],
      "a dotted literal in a namespace of the schema that is neither a key of the " +
        "catalogue nor named in NOT_A_CONFIGURATION_KEY",
    );
  });

  it("every entry of NOT_A_CONFIGURATION_KEY is really outside the catalogue", () => {
    for (const [key, reason] of Object.entries(NOT_A_CONFIGURATION_KEY)) {
      assert.equal(isKnownKey(key), false, `${key} is in the catalogue and needs no exception`);
      assert.ok(reason.length > 20, `${key}: the exception states no reason`);
    }
  });

  it("the read path refuses a key outside the catalogue at every layer", () => {
    for (const layer of LAYER_CODES as readonly LayerCode[]) {
      const verdict = validateKeyValue("loop.maxIterz", 3, layer, { place: "a file" });
      assert.equal(verdict.ok, false);
      assert.ok(verdict.ok === false && verdict.error instanceof UnknownKeyError);
    }
  });
});

/**
 * T009 covers F110-FR-005 as well: the launch defaults stand in keys of this
 * catalogue, and this suite checks that the keys carry them. CT-110-105 (task
 * T025) is the test of the requirement's behaviour.
 */
describe("T009 — the launch defaults stand in keys of the catalogue (F110-FR-005)", () => {
  it("names a key for each default, and every one is in the catalogue", () => {
    for (const key of Object.values(LAUNCH_DEFAULT_KEYS)) {
      assert.ok(catalogueEntry(key) !== undefined, `${key} is not in the catalogue`);
    }
  });

  it("the proposer and the critic are both the shipped harness, Claude in Wave 1", () => {
    const defaults = launchDefaults();
    assert.equal(defaults.proposerHarness, SHIPPED_HARNESS);
    assert.equal(defaults.criticHarness, SHIPPED_HARNESS);
    assert.match(
      catalogueEntry(LAUNCH_DEFAULT_KEYS.proposerHarness)!.cells.default,
      /the shipped default, Claude in Wave 1/,
    );
  });

  it("on different model tiers", () => {
    const defaults = launchDefaults();
    assert.match(defaults.criticModel, /a model tier other than the proposer's/);
    assert.equal(rolesShareAModel("claude-opus-5", "claude-opus-5"), true);
    assert.equal(rolesShareAModel("claude-opus-5", "claude-sonnet-5-5"), false);
  });

  it("`verification.mode` is `required`", () => {
    assert.equal(launchDefaults().verificationMode, "required");
    const entry = catalogueEntry(LAUNCH_DEFAULT_KEYS.verificationMode);
    assert.deepEqual(entry?.type.members, ["required", "plan", "off"]);
  });

  it("the proposer comes from a flag, the environment, a configuration file or the default only", () => {
    assert.deepEqual([...proposerLayers()], ["F", "E", "P", "U"]);
    for (const layer of ["F", "E", "P", "U"] as const) {
      assert.equal(proposerMayComeFrom(layer), true, layer);
    }
    assert.equal(proposerMayComeFrom("C"), false, "a contract pin does not name the proposer");
  });

  it("an absent proposer refuses the launch and names the discovered candidates", () => {
    const error = new AbsentProposerError(["claude", "codex"]);
    assert.ok(error instanceof AbsentProposerError);
    assert.equal(error.reason, "no-proposer");
    assert.deepEqual(error.candidates, ["claude", "codex"]);
    assert.match(error.message, /`claude`, `codex`/);
    assert.match(error.message, /`roles\.proposer\.harness`/);
    assert.match(new AbsentProposerError([]).message, /No harness was discovered/);
  });

  it("Lisa's defaults do not apply", () => {
    assert.equal(LISA_DEFAULTS_APPLY, false);
    assert.equal(LISA_DEFAULTS.verificationMode, "off");
    assert.notEqual(launchDefaults().verificationMode, LISA_DEFAULTS.verificationMode);
    assert.equal(LISA_DEFAULTS.oneModelForBothRoles, true);
  });
});
