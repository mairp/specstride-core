/**
 * T021 — the parity test PT-110-alias-env (F110-FR-020; fixture families
 * FX-01, FX-13, FX-14), driven through the alias table.
 *
 * The parity oracle of feature 141 sets the as-is environment variables of the
 * baseline and selects the profile `parity`; the port must read them and reach
 * the same behaviour (user story 2). The bridge is the alias table of annex X
 * §X.8 and §K.8, which task T005 completed as
 * `specs/110-config-and-terms/contracts/alias-table.tsv` and task T026 ships as
 * `packages/config/data/alias-table.json`.
 *
 * The suite has two halves. The table-level half runs now: every as-is variable
 * of the table reaches the key or the keys the table names, at rank 4 only; two
 * names that reach one key and differ refuse the launch with both names; the
 * `WIGGUM_*` family is not read and prints nothing; and the one exception of
 * §K.8, the prime launcher pair, behaves as the baseline reads it. The four
 * acceptance scenarios of user story 2 are each a test here. The reference half
 * — the comparison against the reference trees of the oracle of feature 141 on
 * FX-01, FX-13 and FX-14 — reports a SKIP with its reason while feature 141 is
 * not built, and never a pass.
 */
import assert from "node:assert/strict";
import test, { describe, it } from "node:test";

import { rankOfLayer } from "@specstride/contracts/envelope/config";

import catalogue from "../../../../vendor/specs/141-parity-oracle/contracts/fixture-catalogue.json" with { type: "json" };

import {
  ALIAS_KEYS,
  ALIAS_LAYER,
  ALIAS_RANK,
  ALIAS_RELATIONS,
  ALIAS_ROWS,
  ALIAS_TABLE,
  AliasConflictError,
  WIGGUM_DEPRECATION_LINE_IS_PRINTED,
  WIGGUM_FAMILY_IS_READ,
  aliasMap,
  aliasMatchFor,
  aliasOffers,
  isReadBefore,
  isWiggumName,
  keysOfVariable,
  notCarriedNames,
  platformNames,
  resolutionOfKey,
  unresolvedFamilyNames,
  variablesOfKey,
} from "../../src/load/alias.ts";
import { resolveConfiguration } from "../../src/load/merge.ts";
import { matchCatalogueKey } from "../../src/schema/catalogue.ts";
import { environmentNameOf } from "../../src/schema/spelling.ts";
import {
  ALIAS_ROW_COUNT,
  ORDER_PATTERNS,
  check as checkAliasData,
} from "../../tools/alias-table-gen.ts";
import { referenceHalfFor } from "./oracle.ts";

/** The fixture families of PT-110-alias-* (`tasks.md`, T021). */
const FAMILIES = ["FX-01", "FX-13", "FX-14"] as const;

type Family = { id: string; status: string; system: string; surfaces: string[] };

const FAMILIES_OF_THE_CATALOGUE = (catalogue as { families: Family[] }).families;

/** The names of the prose forms the generator reads an order relation out of. */
const ORDER_PATTERN_NAMES: readonly string[] = ORDER_PATTERNS.map((p) => p.name);

describe("PT-110-alias-env (table level): the table itself (F110-FR-020)", () => {
  it("FX-01, FX-13 and FX-14 are families of the catalogue of feature 141", () => {
    for (const id of FAMILIES) {
      const family = FAMILIES_OF_THE_CATALOGUE.find((f) => f.id === id);
      assert.notEqual(family, undefined, `${id} is in contracts/fixture-catalogue.json of 141`);
      assert.equal(family?.status, "active");
      assert.ok((family?.surfaces ?? []).length > 0);
    }
  });

  it("the shipped table is the contract of T005, row for row", () => {
    const verdict = checkAliasData();
    assert.equal(verdict.ok, true, verdict.message);
    assert.equal(ALIAS_TABLE.rowCount, ALIAS_ROW_COUNT);
    assert.equal(ALIAS_ROWS.length, 159, "159 rows, one per as-is variable (T005)");
    assert.equal(ALIAS_TABLE.schema, "specstride.config.alias-table/1");
  });

  it("every row is of one of the four kinds, and the counts are the table's", () => {
    const counts = new Map<string, number>();
    for (const row of ALIAS_ROWS) counts.set(row.kind, (counts.get(row.kind) ?? 0) + 1);
    assert.deepEqual(
      [...counts].sort((a, b) => a[0].localeCompare(b[0])),
      [
        ["family", 5],
        ["key", 101],
        ["no-key", 43],
        ["not-carried", 10],
      ],
    );
    assert.equal(platformNames().length, 43);
    assert.equal(notCarriedNames().length, 10);
  });

  it("F110-FR-020, second sentence: an as-is name is read at rank 4 only", () => {
    assert.equal(ALIAS_RANK, 4);
    assert.equal(ALIAS_LAYER, "environment");
    assert.equal(rankOfLayer[ALIAS_LAYER], ALIAS_RANK);
    assert.equal(ALIAS_TABLE.rank, ALIAS_RANK);
    // Every offer the table produces stands at that one layer.
    const reading = aliasOffers({ SPECSTRIDE_MAX_ITER: "9", SPECSTRIDE_MAX_REJECTS: "1" });
    assert.equal(reading.offers.length, 2);
    for (const offer of reading.offers) assert.equal(offer.layer, "environment");
  });

  it("F110-FR-020, third sentence: every variable reaches the keys the table names", () => {
    const rowsWithKeys = ALIAS_ROWS.filter((row) => row.kind === "key" && !row.variableIsPattern);
    assert.ok(rowsWithKeys.length >= 95, `${rowsWithKeys.length} concrete rows reach a key`);
    for (const row of rowsWithKeys) {
      assert.deepEqual([...keysOfVariable(row.variable)], [...row.keys], row.variable);
      for (const key of row.keys) {
        assert.notEqual(
          matchCatalogueKey(key),
          undefined,
          `${row.variable} names ${key}, which the catalogue must carry`,
        );
        assert.ok(
          variablesOfKey(key).includes(row.variable),
          `${key} lists ${row.variable} among the variables that reach it`,
        );
      }
    }
  });

  it("a pattern row reaches the key of the named harness or phase", () => {
    assert.deepEqual(
      [...keysOfVariable("SPECSTRIDE_DSH_PROPOSER_MODEL")],
      ["roles.proposer.model"],
    );
    assert.deepEqual([...keysOfVariable("SPECSTRIDE_CODEX_CRITIC_MODEL")], ["roles.critic.model"]);
    assert.deepEqual([...keysOfVariable("SPECSTRIDE_DSH_OVERLAY")], ["harnesses.dsh.overlay"]);
    assert.deepEqual(
      [...keysOfVariable("SPECSTRIDE_PROPOSER_TIMEOUT_PHASE_3")],
      ["phases.3.proposer.timeoutSec"],
    );
    assert.equal(aliasMatchFor("SPECSTRIDE_DSH_OVERLAY")?.row.variableIsPattern, true);
    // A family row resolves by the derived name of §K.2 rule 3 inside its
    // namespace ("each the key of the same meaning").
    assert.deepEqual(
      [...keysOfVariable("SPECSTRIDE_REVERSE_CONTEXT_BUDGET")],
      ["reverse.contextBudget"],
    );
    assert.deepEqual([...keysOfVariable("SPECSTRIDE_REVERSE_TASKS")], ["reverse.tasks"]);
  });

  it("a name no row of the table covers reaches no key", () => {
    assert.equal(aliasMatchFor("SPECSTRIDE_NO_SUCH_NAME"), undefined);
    assert.deepEqual([...keysOfVariable("SPECSTRIDE_NO_SUCH_NAME")], []);
    const reading = aliasOffers({ SPECSTRIDE_NO_SUCH_NAME: "x" });
    assert.deepEqual([...reading.unknownNames], ["SPECSTRIDE_NO_SUCH_NAME"]);
    assert.deepEqual([...reading.offers], []);
  });

  it("a name of the platform and a name that is not carried reach no key", () => {
    for (const name of ["NO_COLOR", "TERM", "SPECSTRIDE_RUN_ID", "HOME"]) {
      assert.deepEqual([...keysOfVariable(name)], [], name);
    }
    for (const name of ["SPECSTRIDE_LOKI_PORT", "MOL_VIA", "SPECSTRIDE_CRITIC_VIA"]) {
      assert.deepEqual([...keysOfVariable(name)], [], name);
    }
    const reading = aliasOffers({ NO_COLOR: "1", SPECSTRIDE_LOKI_PORT: "3110", TERM: "dumb" });
    assert.deepEqual([...reading.offers], []);
    assert.deepEqual([...reading.unknownNames], [], "a row of the table is not an unknown name");
    assert.deepEqual([...reading.errors], []);
  });

  it("§K.2 rule 3: the as-is name replaces the derived name where the baseline has one", () => {
    const map = aliasMap();
    assert.equal(map.get("loop.maxIter"), "SPECSTRIDE_MAX_ITER");
    assert.equal(map.get("roles.proposer.timeoutSec"), "SPECSTRIDE_PROPOSER_TIMEOUT");
    assert.equal(environmentNameOf("loop.maxIter", map), "SPECSTRIDE_MAX_ITER");
    // A key the table does not name keeps its derived name.
    assert.equal(map.get("loop.oscMax"), "SPECSTRIDE_OSC_MAX");
    assert.equal(environmentNameOf("critic.autoPick", map), "SPECSTRIDE_CRITIC_AUTO_PICK");
  });
});

describe("PT-110-alias-env: the four acceptance scenarios of user story 2", () => {
  it("1. `SPECSTRIDE_MAX_REJECTS=1` resolves `loop.maxRejects` to 1 from `environment`", () => {
    const resolved = resolveConfiguration({
      environment: { SPECSTRIDE_MAX_REJECTS: "1" },
      aliasTable: true,
    });
    const merged = resolved.values.get("loop.maxRejects");
    assert.equal(merged?.value, 1);
    assert.equal(merged?.source, "environment");
    assert.equal(merged?.rank, 4);
    assert.equal(merged?.place, "SPECSTRIDE_MAX_REJECTS");
    assert.deepEqual([...resolved.errors], []);
    // The built-in default it shadowed is recorded (F110-FR-024).
    assert.equal(merged?.shadowed[0]?.value, 3);
  });

  it("2. the profile `parity` and no other setting gives every switch its §X.7 value", () => {
    const resolved = resolveConfiguration({ argv: ["--set", "profile=parity"], aliasTable: true });
    assert.equal(resolved.profile, "parity");
    // One row per system, read through the merge rather than through the data.
    assert.equal(resolved.values.get("loop.strategy")?.value, "classic");
    assert.equal(resolved.values.get("loop.strategy")?.profile, "parity");
    assert.equal(resolved.values.get("loop.micro.closing_check")?.value, false);
    assert.deepEqual([...resolved.errors], []);
  });

  it("3. the old variable `WIGGUM_MAX_ITER` is not read, and nothing is printed", () => {
    assert.equal(WIGGUM_FAMILY_IS_READ, false);
    assert.equal(WIGGUM_DEPRECATION_LINE_IS_PRINTED, false);
    assert.equal(isWiggumName("WIGGUM_MAX_ITER"), true);
    assert.equal(isWiggumName("SPECSTRIDE_MAX_ITER"), false);
    const reading = aliasOffers({ WIGGUM_MAX_ITER: "9" });
    assert.deepEqual([...reading.offers], []);
    assert.deepEqual([...reading.errors], []);
    assert.deepEqual([...reading.unknownNames], [], "no deprecation line and no complaint");
    assert.deepEqual([...reading.launchMessages], []);
    assert.deepEqual([...reading.wiggumNamesIgnored], ["WIGGUM_MAX_ITER"]);
    // And through the whole launch: the key keeps its built-in default.
    const resolved = resolveConfiguration({
      environment: { WIGGUM_MAX_ITER: "9" },
      aliasTable: true,
    });
    assert.equal(resolved.values.get("loop.maxIter")?.source, "default");
    assert.deepEqual([...resolved.unknownEnvironmentNames], []);
  });

  it("4. an empty `SPECSTRIDE_PRIME_FLEET_BIN` is unset, so the second name is read", () => {
    const resolved = resolveConfiguration({
      environment: {
        SPECSTRIDE_PRIME_FLEET_BIN: "",
        SPECSTRIDE_PRIME_BIN: "/usr/bin/prime-alt",
      },
      aliasTable: true,
    });
    const merged = resolved.values.get("harnesses.prime.launcher");
    assert.equal(merged?.value, "/usr/bin/prime-alt");
    assert.equal(merged?.place, "SPECSTRIDE_PRIME_BIN");
    assert.deepEqual([...resolved.errors], []);
    // The flag that makes it so is read off the note of the table, not a list.
    assert.equal(aliasMatchFor("SPECSTRIDE_PRIME_FLEET_BIN")?.row.emptyIsUnset, true);
    assert.equal(aliasMatchFor("SPECSTRIDE_PRIME_BIN")?.row.emptyIsUnset, undefined);
  });
});

describe("PT-110-alias-env: the conflict error (F110-FR-020, fourth sentence)", () => {
  it("two names that reach one key and differ refuse the launch with both names", () => {
    const reading = aliasOffers({
      SPECSTRIDE_LOKI_URL: "http://localhost:3100",
      RALPH_LOKI_URL: "http://localhost:3110",
    });
    assert.equal(reading.conflicts.length, 1);
    const conflict = reading.conflicts[0] as AliasConflictError;
    assert.ok(conflict instanceof AliasConflictError);
    assert.equal(conflict.reason, "alias-conflict");
    assert.equal(conflict.key, "telemetry.loki.url");
    assert.deepEqual([...conflict.names].sort(), ["RALPH_LOKI_URL", "SPECSTRIDE_LOKI_URL"]);
    assert.match(conflict.message, /SPECSTRIDE_LOKI_URL/);
    assert.match(conflict.message, /RALPH_LOKI_URL/);
    assert.match(conflict.message, /telemetry\.loki\.url/);
    // No offer is made for the key the launch is refused over.
    assert.deepEqual([...reading.offers], []);
    // And the launch is refused: the error reaches `resolveConfiguration`.
    const resolved = resolveConfiguration({
      environment: {
        SPECSTRIDE_LOKI_URL: "http://localhost:3100",
        RALPH_LOKI_URL: "http://localhost:3110",
      },
      aliasTable: true,
    });
    assert.equal(resolved.errors.length, 1);
    assert.ok(resolved.errors[0] instanceof AliasConflictError);
  });

  it("the same two names with the same value are no conflict", () => {
    const reading = aliasOffers({
      SPECSTRIDE_LOKI_URL: "http://localhost:3100",
      RALPH_LOKI_URL: "http://localhost:3100",
    });
    assert.deepEqual([...reading.conflicts], []);
    assert.equal(reading.offers.length, 1);
    assert.equal(reading.offers[0]?.key, "telemetry.loki.url");
    assert.equal(reading.offers[0]?.value, "http://localhost:3100");
  });

  it("one name alone is no conflict, whichever of the two it is", () => {
    for (const name of ["SPECSTRIDE_OTEL_URL", "RALPH_OTEL_URL"]) {
      const reading = aliasOffers({ [name]: "http://localhost:4318" });
      assert.deepEqual([...reading.conflicts], [], name);
      assert.equal(reading.offers[0]?.key, "telemetry.otel.url");
      assert.equal(reading.offers[0]?.place, name);
    }
  });

  it("every key more than one name reaches is either ordered or a conflict", () => {
    const many = ALIAS_KEYS.filter((entry) => entry.variables.length > 1);
    assert.ok(many.length >= 7, `${many.length} keys are reached by more than one name`);
    for (const entry of many) {
      assert.ok(
        entry.resolution === "ordered" || entry.resolution === "conflict",
        `${entry.key} is ${entry.resolution}`,
      );
      if (entry.resolution === "ordered") {
        assert.ok((entry.order ?? []).length >= 2, entry.key);
        const order = entry.order as readonly string[];
        for (let i = 0; i + 1 < order.length; i += 1) {
          assert.equal(isReadBefore(order[i] as string, order[i + 1] as string), true, entry.key);
        }
      }
    }
    assert.equal(resolutionOfKey("telemetry.loki.url"), "conflict");
    assert.equal(resolutionOfKey("harnesses.prime.launcher"), "ordered");
    assert.equal(resolutionOfKey("loop.maxIter"), "single");
  });
});

describe("PT-110-alias-env: the ordered pairs of §K.8", () => {
  it("the prime launcher pair is the one exception: the first set wins, no refusal", () => {
    const reading = aliasOffers({
      SPECSTRIDE_PRIME_FLEET_BIN: "/opt/fleet",
      SPECSTRIDE_PRIME_BIN: "/usr/bin/prime",
    });
    assert.deepEqual([...reading.conflicts], [], "the two names differ and the launch stands");
    assert.equal(reading.offers.length, 1);
    assert.equal(reading.offers[0]?.value, "/opt/fleet");
    assert.equal(reading.offers[0]?.place, "SPECSTRIDE_PRIME_FLEET_BIN");
    assert.deepEqual(
      [...reading.shadowedNames],
      [
        {
          key: "harnesses.prime.launcher",
          name: "SPECSTRIDE_PRIME_BIN",
          by: "SPECSTRIDE_PRIME_FLEET_BIN",
        },
      ],
    );
    assert.equal(isReadBefore("SPECSTRIDE_PRIME_FLEET_BIN", "SPECSTRIDE_PRIME_BIN"), true);
    assert.equal(isReadBefore("SPECSTRIDE_PRIME_BIN", "SPECSTRIDE_PRIME_FLEET_BIN"), false);
  });

  it("the Claude credential and endpoint pairs read the as-is name first", () => {
    const credential = aliasOffers({
      SPECSTRIDE_CLAUDE_CRITIC_API_KEY: "env:FIRST",
      ANTHROPIC_API_KEY: "env:SECOND",
    });
    assert.deepEqual([...credential.conflicts], []);
    assert.equal(credential.offers[0]?.value, "env:FIRST");
    const endpoint = aliasOffers({
      SPECSTRIDE_CLAUDE_CRITIC_BASE_URL: "http://first",
      ANTHROPIC_BASE_URL: "http://second",
    });
    assert.equal(endpoint.offers[0]?.value, "http://first");
    // And the fallback applies when the first name is absent.
    assert.equal(
      aliasOffers({ ANTHROPIC_BASE_URL: "http://second" }).offers[0]?.value,
      "http://second",
    );
  });

  it("every order relation is derived from a note of the table", () => {
    assert.equal(ALIAS_RELATIONS.length, 10);
    for (const relation of ALIAS_RELATIONS) {
      const row = ALIAS_ROWS.find((r) => r.variable === relation.statedBy);
      assert.notEqual(row, undefined, relation.statedBy);
      // The relation is stated by one of its two variables, and that row's
      // note names the other one: nothing here is a hand-written pair.
      assert.ok(
        relation.before === relation.statedBy || relation.after === relation.statedBy,
        "a relation is stated by one of its two variables",
      );
      const other = relation.before === relation.statedBy ? relation.after : relation.before;
      assert.ok(row?.note.includes(other), `the note of ${relation.statedBy} names ${other}`);
      assert.ok(
        ORDER_PATTERN_NAMES.includes(relation.pattern),
        `${relation.pattern} is one of the prose forms of the generator`,
      );
    }
  });
});

describe("PT-110-alias-env: the readings §K.8 states for a value", () => {
  it("one variable may feed several keys", () => {
    const reading = aliasOffers({ SPECSTRIDE_CONTEXT_BUDGET: "32000" });
    assert.deepEqual(
      reading.offers.map((o) => o.key),
      ["spec.contextBudget", "reverse.contextBudget"],
    );
    for (const offer of reading.offers) {
      assert.equal(offer.value, 32000);
      assert.equal(offer.place, "SPECSTRIDE_CONTEXT_BUDGET");
    }
  });

  it("the two shipper timeouts are decimal seconds and the key holds milliseconds", () => {
    assert.equal(aliasOffers({ RALPH_LOKI_TIMEOUT: "2.5" }).offers[0]?.value, 2500);
    assert.equal(aliasOffers({ RALPH_OTEL_TIMEOUT: "3" }).offers[0]?.value, 3000);
    assert.equal(aliasMatchFor("RALPH_LOKI_TIMEOUT")?.row.secondsToMilliseconds, true);
    // The derived name of the key still carries milliseconds, unconverted.
    assert.equal(
      aliasOffers({ SPECSTRIDE_TELEMETRY_LOKI_TIMEOUT_MS: "2500" }).offers[0]?.value,
      2500,
    );
  });

  it("`SPECSTRIDE_OTEL_STATE_DIR` is accepted, has no effect, and a message says so", () => {
    const reading = aliasOffers({ SPECSTRIDE_OTEL_STATE_DIR: "/tmp/otel" });
    assert.deepEqual([...reading.offers], []);
    assert.deepEqual([...reading.errors], []);
    assert.equal(reading.launchMessages.length, 1);
    assert.match(reading.launchMessages[0] ?? "", /accepted and has no effect/);
    assert.match(reading.launchMessages[0] ?? "", /CQ-120/);
  });

  it("a set-but-empty value is a value, except for the prime fleet name", () => {
    // The edge case of the specification: a set-but-empty variable counts.
    const reading = aliasOffers({ SPECSTRIDE_STATE_DIR: "" });
    assert.equal(reading.offers.length, 1);
    assert.equal(reading.offers[0]?.key, "state.dir");
    assert.equal(reading.offers[0]?.value, "");
    assert.deepEqual([...reading.errors], []);
    assert.deepEqual([...aliasOffers({ SPECSTRIDE_PRIME_FLEET_BIN: "" }).offers], []);
  });

  it("a variable of the table whose key the environment may not set is refused", () => {
    // `SPECSTRIDE_LEARNING_THROUGH` is a row of the table and reaches
    // `learning.through`, whose column "Layers" is `C only` (§K.5): the name
    // reaches the key, as F110-FR-020 asks, and the layer check of F110-FR-001
    // then refuses the value. Reported to the orchestrator in PROGRESS.md, not
    // repaired here.
    assert.deepEqual([...keysOfVariable("SPECSTRIDE_LEARNING_THROUGH")], ["learning.through"]);
    assert.deepEqual([...(matchCatalogueKey("learning.through")?.entry.layers ?? [])], ["C"]);
    const reading = aliasOffers({ SPECSTRIDE_LEARNING_THROUGH: "run-0001" });
    assert.deepEqual([...reading.offers], []);
    assert.equal(reading.errors.length, 1);
    assert.match(reading.errors[0]?.message ?? "", /SPECSTRIDE_LEARNING_THROUGH/);
    assert.match(reading.errors[0]?.message ?? "", /learning\.through/);
  });

  it("a value outside the type of its key refuses the launch, naming the variable", () => {
    const reading = aliasOffers({ SPECSTRIDE_MAX_ITER: "not-a-number" });
    assert.equal(reading.errors.length, 1);
    assert.match(reading.errors[0]?.message ?? "", /SPECSTRIDE_MAX_ITER/);
    assert.match(reading.errors[0]?.message ?? "", /loop\.maxIter/);
    assert.deepEqual([...reading.offers], []);
  });

  it("the family rows no mechanical rule resolves are named, not guessed", () => {
    // `roles.diagnostician.*` and `roles.accelerator.*` name a family of keys
    // and not one key, and the variable tail is not the key tail; the table
    // carries them as families and this port resolves them to nothing rather
    // than picking a field for them. Reported to the orchestrator in
    // PROGRESS.md, never invented here.
    assert.deepEqual(
      [...unresolvedFamilyNames()],
      ["SPECSTRIDE_DIAGNOSTICIAN", "SPECSTRIDE_ACCELERATOR", "SPECSTRIDE_ACCELERATOR_BACKEND"],
    );
    for (const name of unresolvedFamilyNames()) {
      assert.deepEqual([...keysOfVariable(name)], [], name);
      assert.deepEqual([...aliasOffers({ [name]: "x" }).unknownNames], [], name);
    }
  });
});

test(
  "PT-110-alias-env (reference half): the port against the reference trees on FX-01, FX-13, FX-14",
  referenceHalfFor(FAMILIES),
  () => {
    assert.fail(
      "the reference half must be written when the oracle of feature 141 is built; " +
        "until then this test skips with its reason and never passes",
    );
  },
);
