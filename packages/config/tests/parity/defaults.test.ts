/**
 * T024 — the parity test PT-110-defaults-baseline (F110-FR-006; fixture family
 * FX-01).
 *
 * F110-FR-006: every key that has a counterpart in the baseline must have the
 * baseline's default, which is the value under `parity`. The reference for the
 * defaults is the entry-point shell script of the Specstride baseline at
 * `9cab15d` — its built-in defaults. The example environment file of the
 * baseline counts only for a key whose built-in default it repeats; it
 * disagrees with the built-in defaults for the critic and for the Loki address,
 * where defect D-42 is dropped and D-41 keeps port 3100. A test must compare
 * each with the baseline text.
 *
 * The name of that reference file is never spelled in this file: F100-FR-026
 * lets no file under `packages/` carry a legacy file name of an as-is system.
 * It is read out of the `source` column of the snapshot below, and the
 * requirement text that names it is read out of `spec.md`, so the test still
 * pins which file the reference is.
 *
 * Task T002 derived the baseline text into
 * `specs/110-config-and-terms/contracts/baseline-defaults.tsv`: one row per
 * as-is variable the baseline gives a built-in default, with the value, the
 * file and line at `9cab15d` that holds it, and the key it reaches through
 * `contracts/alias-table.tsv`. `tests/characterization/110/baseline-defaults.test.ts`
 * compares that snapshot with the baseline text itself and re-derives it where
 * a checkout of `9cab15d` is present.
 *
 * This test is the parity half: every default is read out of the **port**,
 * through `resolveConfiguration` with nothing set and again under the profile
 * `parity`, and compared with the baseline row. A key whose resolved default
 * drifts from the baseline fails here even when the contract file still agrees
 * with the baseline text, which is what makes the two tests different tests.
 *
 * The reference half — the comparison against the reference trees of the oracle
 * of feature 141 on FX-01 — reports a SKIP with its reason while feature 141 is
 * not built, and never a pass.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test, { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import catalogue from "../../../../vendor/specs/141-parity-oracle/contracts/fixture-catalogue.json" with { type: "json" };

import { resolveConfiguration } from "../../src/load/merge.ts";
import { matchCatalogueKey } from "../../src/schema/catalogue.ts";
import { PROFILE_NAME } from "../../src/schema/profile.ts";
import { keysOfVariable } from "../../src/load/alias.ts";
import { referenceHalfFor } from "./oracle.ts";

/** The fixture family of PT-110-defaults-baseline (`tasks.md`, T024). */
const FAMILIES = ["FX-01"] as const;

type Family = { id: string; status: string; scenarios: { name: string; waiver: string | null }[] };

const FAMILIES_OF_THE_CATALOGUE = (catalogue as { families: Family[] }).families;

/** The commit of the baseline F110-FR-006 names as the reference. */
const BASELINE_COMMIT = "9cab15d";

/** One row of the snapshot task T002 derived from the baseline text. */
interface BaselineRow {
  readonly variable: string;
  readonly baselineDefault: string;
  readonly source: string;
  readonly keyCell: string;
  readonly catalogueDefault: string;
  readonly verdict: string;
  readonly note: string;
}

const here = dirname(fileURLToPath(import.meta.url)); // packages/config/tests/parity
const SNAPSHOT = join(
  here,
  "..",
  "..",
  "..",
  "..",
  "specs",
  "110-config-and-terms",
  "contracts",
  "baseline-defaults.tsv",
);

const SPEC = join(here, "..", "..", "..", "..", "specs", "110-config-and-terms", "spec.md");

const ROWS: readonly BaselineRow[] = Object.freeze(
  readFileSync(SNAPSHOT, "utf8")
    .replace(/\n$/, "")
    .split("\n")
    .slice(1)
    .map((line) => {
      const cells = line.split("\t");
      return Object.freeze({
        variable: cells[0] ?? "",
        baselineDefault: cells[1] ?? "",
        source: cells[2] ?? "",
        keyCell: cells[3] ?? "",
        catalogueDefault: cells[4] ?? "",
        verdict: cells[5] ?? "",
        note: cells[6] ?? "",
      });
    }),
);

/** The five verdicts the snapshot uses (T002's report). */
const VERDICTS = ["same", "same (spelled)", "differs", "n/a (no key)", "n/a (DV-064)"] as const;

const rowsOf = (verdict: string): readonly BaselineRow[] =>
  ROWS.filter((row) => row.verdict === verdict);

/** The file of the snapshot's `source` column that most carried defaults cite. */
function referenceFile(): string {
  const counts = new Map<string, number>();
  for (const row of [...rowsOf("same"), ...rowsOf("same (spelled)")]) {
    const file = row.source.split(":")[0] ?? "";
    counts.set(file, (counts.get(file) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

/**
 * The file of the baseline whose built-in defaults are the reference, read out
 * of the snapshot rather than spelled here (F100-FR-026).
 */
const REFERENCE_FILE = referenceFile();

/** The keys one row names, split out of its key cell. */
const keysOf = (row: BaselineRow): readonly string[] =>
  row.keyCell.split("; ").map((key) => key.trim());

/** The resolved value of one key, with nothing set at any rank. */
const bare = resolveConfiguration({});
/** The same, with the profile `parity` selected and nothing else set. */
const underParity = resolveConfiguration({ argv: ["--set", `profile=${PROFILE_NAME}`] });

function resolvedText(
  resolved: ReturnType<typeof resolveConfiguration>,
  key: string,
): string | undefined {
  const entry = matchCatalogueKey(key)?.entry;
  const merged = resolved.values.get(key) ?? (entry && resolved.values.get(entry.key));
  return merged === undefined ? undefined : String(merged.value);
}

describe("PT-110-defaults-baseline: the snapshot of the baseline text", () => {
  it("FX-01 is a family of the catalogue of feature 141", () => {
    const family = FAMILIES_OF_THE_CATALOGUE.find((f) => f.id === "FX-01");
    assert.notEqual(family, undefined, "FX-01 is in contracts/fixture-catalogue.json of 141");
    assert.equal(family?.status, "active");
    // The scenario that names the defaults where no role is named.
    const defaults = (family?.scenarios ?? []).find((s) => s.name === "defaults-no-role-named");
    assert.notEqual(defaults, undefined);
    assert.equal(defaults?.waiver, "DV-004");
  });

  it("the snapshot holds the 105 as-is variables the baseline gives a default", () => {
    assert.equal(ROWS.length, 105);
    for (const row of ROWS) {
      assert.ok(VERDICTS.includes(row.verdict as (typeof VERDICTS)[number]), row.verdict);
      assert.notEqual(row.variable, "", "every row names an as-is variable");
      assert.notEqual(row.source, "", `${row.variable} names the file and line of its default`);
    }
    assert.equal(rowsOf("same").length, 45);
    assert.equal(rowsOf("same (spelled)").length, 36);
    assert.equal(rowsOf("differs").length, 6);
    assert.equal(rowsOf("n/a (no key)").length, 14);
    assert.equal(rowsOf("n/a (DV-064)").length, 4);
  });

  it("the reference is the built-in defaults of the baseline at `9cab15d`", () => {
    assert.equal(BASELINE_COMMIT, "9cab15d");
    // F110-FR-006 names the reference file, and the file most carried defaults
    // cite is that one. The requirement text is read from `spec.md`, which is
    // outside `packages/` and may carry the legacy name.
    const requirement = readFileSync(SPEC, "utf8")
      .split("\n")
      .find((line) => line.startsWith("- **F110-FR-006**"));
    assert.notEqual(requirement, undefined, "F110-FR-006 is in spec.md");
    assert.notEqual(REFERENCE_FILE, "", "the snapshot cites a file for its defaults");
    assert.match(REFERENCE_FILE, /\.sh$/, "the reference is the baseline's entry-point script");
    assert.ok(
      (requirement ?? "").includes(REFERENCE_FILE),
      "the file the snapshot cites most is the one F110-FR-006 names",
    );
    assert.ok(
      (requirement ?? "").includes(BASELINE_COMMIT),
      "F110-FR-006 names the commit the defaults are read at",
    );
    // The majority of the carried defaults come from the file the requirement
    // names; the rest come from the baseline's own other sources, each cited.
    const carried = [...rowsOf("same"), ...rowsOf("same (spelled)")];
    const fromReference = carried.filter((row) => row.source.startsWith(`${REFERENCE_FILE}:`));
    assert.ok(
      fromReference.length >= 25,
      `${fromReference.length} of ${carried.length} defaults come from ${REFERENCE_FILE}`,
    );
    // The rest come from the baseline's other sources, each cited by file and
    // line; none is uncited, which is what keeps "compare each with the
    // baseline text" checkable.
    assert.equal(
      carried.filter((row) => row.source === "").length,
      0,
      "no carried default is uncited",
    );
    for (const row of carried) {
      assert.match(row.source, /^[A-Za-z0-9_./-]+:\d+$/, `${row.variable}: ${row.source}`);
    }
  });

  it("every variable of the snapshot that reaches a key reaches it through the table", () => {
    for (const row of ROWS) {
      if (row.verdict.startsWith("n/a")) continue;
      const throughTheTable = keysOfVariable(row.variable);
      if (throughTheTable.length === 0) {
        // A variable the table carries as a pattern row only (`DSH_HOME` and
        // the harness families) still names its key in the snapshot.
        assert.notEqual(row.keyCell, "", row.variable);
        continue;
      }
      assert.deepEqual([...throughTheTable], [...keysOf(row)], row.variable);
    }
  });
});

describe("PT-110-defaults-baseline: the port's default is the baseline's", () => {
  it("every `same` row resolves, with nothing set, to the baseline value", () => {
    const checked: string[] = [];
    for (const row of rowsOf("same")) {
      for (const key of keysOf(row)) {
        const entry = matchCatalogueKey(key)?.entry;
        assert.notEqual(entry, undefined, `${row.variable} names ${key}`);
        const text = resolvedText(bare, key);
        assert.notEqual(text, undefined, `${key} has a default at rank 8`);
        assert.equal(
          text,
          row.baselineDefault,
          `${key} (${row.variable}, ${row.source}) must be the baseline default`,
        );
        checked.push(key);
      }
    }
    assert.ok(checked.length >= 45, `${checked.length} keys compared with the baseline text`);
  });

  it("and resolves to the same value under the profile `parity`", () => {
    assert.equal(underParity.profile, PROFILE_NAME);
    for (const row of rowsOf("same")) {
      for (const key of keysOf(row)) {
        assert.equal(
          resolvedText(underParity, key),
          row.baselineDefault,
          `${key} under \`${PROFILE_NAME}\` must be the baseline default`,
        );
      }
    }
  });

  it("every `same (spelled)` row carries the catalogue cell and says why it is spelled so", () => {
    for (const row of rowsOf("same (spelled)")) {
      assert.notEqual(row.note, "", `${row.variable} must say how the spelling differs`);
      const keys = keysOf(row);
      for (const key of keys) {
        const entry = matchCatalogueKey(key)?.entry;
        assert.notEqual(entry, undefined, `${row.variable} names ${key}`);
        const cell = entry?.cells.default ?? "";
        // A row that names one key quotes that key's own cell. A row that
        // names several (`SPECSTRIDE_DSH_MODEL` feeds both model keys, §K.8)
        // quotes them together where they differ, so each must be in the cell.
        if (keys.length === 1) {
          assert.equal(cell, row.catalogueDefault, `${key}: the snapshot quotes its cell`);
        } else {
          assert.ok(
            row.catalogueDefault === cell || row.catalogueDefault.includes(cell),
            `${key}: the snapshot names its cell \`${cell}\` in \`${row.catalogueDefault}\``,
          );
        }
      }
    }
  });

  it("a key with no baseline counterpart is not claimed to have one", () => {
    for (const row of ROWS) {
      if (!row.verdict.startsWith("n/a")) continue;
      // The key cell of such a row is empty or names the reason, never a key
      // of the catalogue that the test would then compare.
      for (const key of keysOf(row)) {
        if (key === "") continue;
        assert.equal(
          matchCatalogueKey(key),
          undefined,
          `${row.variable} is ${row.verdict} and must name no key of the catalogue`,
        );
      }
    }
  });
});

describe("PT-110-defaults-baseline: the `.env.example` clause of F110-FR-006", () => {
  it("D-41: the Loki address keeps port 3100, not the 3110 of `.env.example`", () => {
    assert.equal(resolvedText(bare, "telemetry.loki.url"), "http://localhost:3100");
    assert.equal(resolvedText(underParity, "telemetry.loki.url"), "http://localhost:3100");
    const row = ROWS.find((r) => r.variable === "SPECSTRIDE_LOKI_URL");
    assert.equal(row?.baselineDefault, "http://localhost:3100");
    assert.equal(row?.source, `${REFERENCE_FILE}:207`);
    assert.equal(row?.verdict, "same");
  });

  it("D-42: the critic default of `.env.example` is dropped, and `dsh` is not it", () => {
    const row = ROWS.find((r) => r.variable === "SPECSTRIDE_CRITIC");
    assert.equal(row?.baselineDefault, "claude", "the built-in default is the reference");
    assert.equal(row?.source, `${REFERENCE_FILE}:203`);
    assert.equal(row?.verdict, "differs");
    // The port resolves the critic by the critic order of feature 124, so no
    // rank gives `roles.critic.harness` a value with nothing set — and in no
    // case is it the `dsh` of `.env.example`.
    assert.equal(matchCatalogueKey("roles.critic.harness")?.entry.default.kind, "deferred");
    assert.notEqual(resolvedText(bare, "roles.critic.harness"), "dsh");
  });
});

describe("PT-110-defaults-baseline: the six differences, reported not repaired", () => {
  it("each `differs` row names a key and the decision that made it differ", () => {
    const differs = rowsOf("differs");
    assert.equal(differs.length, 6);
    for (const row of differs) {
      assert.notEqual(row.keyCell, "", row.variable);
      assert.notEqual(row.note, "", `${row.variable} must say why it differs`);
      // Each is a decision an approved register row or another feature made:
      // the note cites one.
      assert.match(
        row.note,
        /DV-\d+|feature \d+|descriptor|critic order|§K\.9|profile/,
        `${row.variable}: ${row.note}`,
      );
    }
    assert.deepEqual(
      differs.map((r) => r.variable).sort(),
      [
        "SPECSTRIDE_CRITIC",
        "SPECSTRIDE_DSH_BIN",
        "SPECSTRIDE_DSH_PROFILE",
        "SPECSTRIDE_PRIME_AGENT_BIN",
        "SPECSTRIDE_PROPOSER",
        "SPECSTRIDE_DSH_PERMISSION_MODE",
      ].sort(),
    );
  });

  it("the report for the orchestrator exists and names all six", () => {
    const report = readFileSync(
      join(
        here,
        "..",
        "..",
        "..",
        "..",
        "specs",
        "110-config-and-terms",
        "baseline-defaults-report.md",
      ),
      "utf8",
    );
    for (const row of rowsOf("differs")) {
      // The report names each difference by its variable, by the key, or by
      // the template key of the catalogue the key belongs to.
      const names = [
        row.variable,
        ...keysOf(row),
        ...keysOf(row).map((key) => matchCatalogueKey(key)?.entry.key ?? ""),
      ].filter((name) => name !== "");
      assert.ok(
        names.some((name) => report.includes(name)),
        `${row.variable}: the report names none of ${names.join(", ")}`,
      );
    }
    assert.match(report, /The six differences, for the orchestrator/);
  });
});

test(
  "PT-110-defaults-baseline (reference half): the port against the reference trees on FX-01",
  referenceHalfFor(FAMILIES),
  () => {
    assert.fail(
      "the reference half must be written when the oracle of feature 141 is built; " +
        "until then this test skips with its reason and never passes",
    );
  },
);
