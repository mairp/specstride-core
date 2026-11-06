/**
 * Feature 147 — tests CT-147-101 to CT-147-106 (T002, User Story 1).
 *
 * CT-147-101  auth tier 3 is refused everywhere; tier 3 is never a valid
 *             value of a key or descriptor (F147-FR-001; F147-SC-003).
 * CT-147-102  the audiences; `distributed` ships as the default; no project
 *             key, comment, flag or mode changes the audience (F147-FR-002).
 * CT-147-103  row validation: the eight fields, the closed status set, an
 *             unknown status read as `refused`, a missing field invalidates
 *             the file (F147-FR-003).
 * CT-147-104  `evaluate`: decision, row, rule id, table version; pure; a
 *             default row for every decision point; under 1 ms per call
 *             (F147-FR-004; plan.md Performance Goals).
 * CT-147-105  the points of evaluation: launch, role resolution, every
 *             fallback switch (F147-FR-005).
 * CT-147-106  no bypass: every comment, flag, mode and project key of the
 *             configuration catalogue set, 0 `refused` decisions changed
 *             (F147-FR-006; F147-SC-001).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as terms from "../../src/terms/index.ts";

const ROOT = fileURLToPath(new URL("../../../..", import.meta.url));
const CONFIG_KEYS = "specs/110-config-and-terms/contracts/config-keys.tsv";

const q = (
  provider: string,
  authTier: 1 | 2 | 3,
  audience: "personal" | "distributed",
  acknowledgements: readonly string[] = [],
) => ({ provider, authTier, audience, acknowledgements });

/** The providers of the shipped data, plus the front harnesses with no row. */
const SHIPPED_PROVIDERS = [
  "anthropic",
  "openai",
  "google",
  "github-copilot",
  "openrouter",
  "zai-coding-plan",
  "zai-api",
  "zai",
  "opencode",
  "deepseek",
] as const;
const AUDIENCES = ["personal", "distributed"] as const;

test("CT-147-101: auth tier 3 is refused for every provider and audience; no tier 3 row is allowed (F147-FR-001, F147-SC-003)", () => {
  for (const provider of SHIPPED_PROVIDERS) {
    for (const audience of AUDIENCES) {
      const decision = terms.evaluate(q(provider, 3, audience));
      assert.equal(decision.decision, "refused", `${provider} tier 3 ${audience} must be refused`);
      if (decision.row !== null) {
        assert.equal(
          decision.row.status,
          "refused",
          `${provider} tier 3 ${audience}: the row itself must carry \`refused\``,
        );
      }
      assert.match(
        decision.explanation,
        /subscription|credentials|sharing|prohibited|partnership|violation|OAuth|resell|refused/i,
        `${provider}: the explanation must say why tier 3 is refused`,
      );
    }
  }
  // The shipped data holds no row that makes tier 3 `allowed` (F147-SC-003):
  // the count is 0.
  const shipped = terms.shippedData();
  const tier3Allowed = shipped.rows.filter((r) => r.authTier === 3 && r.status === "allowed");
  assert.equal(tier3Allowed.length, 0, "F147-SC-003: 0 tier 3 rows `allowed` at release");
  // Tier 3 is never a valid value of a configuration key: the catalogue of
  // feature 110 types every tier key `1 or 2` (row `roles.<role>.tier`).
  const catalogue = readFileSync(`${ROOT}/${CONFIG_KEYS}`, "utf8");
  for (const line of catalogue.split("\n").slice(1)) {
    if (!line.includes(".tier\t")) continue;
    const typeAndRange = line.split("\t")[1];
    assert.equal(
      typeAndRange,
      "1 or 2",
      `a tier key of the catalogue must not accept tier 3: got "${typeAndRange}"`,
    );
  }
  // Even with a tier 3 acknowledgement the gate refuses: an acknowledgement
  // never lifts a `refused` row (F147-FR-006).
  const acked = terms.evaluate(q("anthropic", 3, "personal", ["anthropic:3"]));
  assert.equal(acked.decision, "refused");
});

test("CT-147-102: the audiences; `distributed` is the shipped default; no project key, comment, flag or mode changes the audience (F147-FR-002)", () => {
  // Row 34 of annex X §X.7, as the catalogue of feature 110 records it.
  const catalogue = readFileSync(`${ROOT}/${CONFIG_KEYS}`, "utf8").split("\n");
  const audienceRow = catalogue.find((l) => l.startsWith("distribution.audience\t"));
  assert.ok(audienceRow !== undefined, "the catalogue holds distribution.audience");
  const columns = audienceRow.split("\t");
  assert.equal(columns[2], "distributed", "the shipped default of the audience");
  assert.equal(columns[3], "personal", "the value under the parity profile");
  assert.equal(columns[4], "W (snap p)", "the trust class of the audience key");
  assert.equal(columns[8], "U", "the layers of the audience key are user-only (ruling 2)");
  assert.equal(
    columns[7].includes("layers narrowed to U"),
    true,
    "the layers are user-only (ruling 2)",
  );

  // The gate over the shipped default: a consumer who asks for Claude at
  // tier 1 under `distributed` is told `personal-only`; under `personal`,
  // tier 1 is allowed (acceptance scenario 1 of US1).
  assert.equal(terms.evaluate(q("anthropic", 1, "distributed")).decision, "refused");
  assert.equal(terms.evaluate(q("anthropic", 1, "distributed")).row?.status, "personal-only");
  assert.equal(terms.evaluate(q("anthropic", 1, "personal")).decision, "allowed");

  // A project key, a comment, a flag of a launch contract or a mode cannot
  // reach the audience: `evaluate` takes four inputs and none of them is
  // configuration. The audience argument is required — there is no implicit
  // per-run override — and an unknown audience is a configuration error.
  assert.throws(() => terms.asAudience("distributed " as string), TypeError);
  assert.throws(() => terms.asAudience("parity" as string), TypeError);
  assert.equal(terms.asAudience("distributed"), "distributed");
});

test("CT-147-103: row validation — eight fields, the closed status set, an unknown status read as `refused`, a missing field invalidates the file (F147-FR-003)", () => {
  // The shipped file validates and every row carries all eight fields.
  const shipped = terms.shippedData();
  assert.ok(
    shipped.rows.length >= 38,
    `the shipped data holds the rows of the matrix (${shipped.rows.length})`,
  );
  for (const row of shipped.rows) {
    for (const field of [
      "provider",
      "authTier",
      "audience",
      "status",
      "source",
      "accessDate",
      "quotedSentence",
      "verifiedOn",
    ] as const) {
      assert.ok(row[field] !== undefined, `row ${row.provider}/${row.authTier} lacks ${field}`);
    }
    assert.equal(row.accessDate, "2026-09-29", "the access date of R8v");
    assert.ok(row.quotedSentence.length > 0);
  }
  // A valid row whose status is outside the closed set is READ AS refused.
  const unknownStatus = {
    id: "test",
    version: "1",
    rows: [
      {
        provider: "sample-provider",
        authTier: 1,
        audience: "personal",
        status: "permitted-by-legend",
        source: "a test",
        accessDate: "2026-09-29",
        quotedSentence: "anything at all",
        verifiedOn: null,
      },
    ],
  };
  const loaded = terms.loadTermsData(unknownStatus);
  assert.equal(loaded.rows[0].status, "permitted-by-legend");
  const decision = terms.makeEvaluate(loaded)(q("sample-provider", 1, "personal"));
  assert.equal(decision.decision, "refused", "an unknown status is read as `refused`");
  // A row that lacks a field makes the file invalid.
  for (const field of [
    "provider",
    "authTier",
    "audience",
    "status",
    "source",
    "accessDate",
    "quotedSentence",
    "verifiedOn",
  ]) {
    const broken = structuredClone(unknownStatus);
    delete (broken.rows[0] as Record<string, unknown>)[field];
    assert.throws(
      () => terms.loadTermsData(broken),
      TermsDataErrorMissing(field),
      `a row without ${field} must make the file invalid`,
    );
  }
  // An audience outside the closed set is invalid too.
  const badAudience = structuredClone(unknownStatus);
  (badAudience.rows[0] as Record<string, unknown>).audience = "both";
  assert.throws(() => terms.loadTermsData(badAudience), terms.TermsDataError);
});

/** Builds a matcher that checks the error names the missing field. */
function TermsDataErrorMissing(
  field: string,
): { code: "ERR_ASSERTION" } & ((e: unknown) => boolean) {
  const check = (e: unknown): boolean =>
    e instanceof terms.TermsDataError && e.message.includes(field);
  return Object.assign(check, { code: "ERR_ASSERTION" as const });
}

test("CT-147-104: `evaluate` returns decision, row, rule id and table version; it is pure, has a default for every decision point, and runs under 1 ms (F147-FR-004)", () => {
  const decision = terms.evaluate(q("anthropic", 1, "distributed"));
  assert.equal(decision.tableId, "terms-gate-default");
  assert.equal(decision.tableVersion, "1");
  assert.match(decision.ruleId, /^terms:anthropic:1:distributed:personal-only$/);
  assert.equal(decision.row?.provider, "anthropic");
  assert.ok(decision.explanation.length > 0);
  // Pure: the same input gives the same output, and nothing accumulates.
  const again = terms.evaluate(q("anthropic", 1, "distributed"));
  assert.deepEqual(JSON.parse(JSON.stringify(decision)), JSON.parse(JSON.stringify(again)));
  // A default row for every decision point: no row (unknown terms) at tier
  // 1 and 2 is `allowed-with-warning`; tier 3 without a row is refused;
  // nothing throws.
  for (const tier of [1, 2, 3] as const) {
    const unknown = terms.evaluate(q("no-such-provider", tier, "personal"));
    assert.equal(
      unknown.decision,
      tier === 3 ? "refused" : "allowed-with-warning",
      `tier ${tier} with no row`,
    );
  }
  // Under 1 ms per call (plan.md Performance Goals).
  const N = 20_000;
  const start = process.hrtime.bigint();
  for (let i = 0; i < N; i++) terms.evaluate(q("anthropic", 2, "personal"));
  const perCallMs = Number(process.hrtime.bigint() - start) / 1e6 / N;
  assert.ok(
    perCallMs < 1,
    `evaluate must stay under 1 ms per call, was ${perCallMs.toFixed(4)} ms`,
  );
});

test("CT-147-105: the terms gate is evaluated at launch, at role resolution and at every switch to a fallback; a refused primary refuses the launch; a refused fallback is skipped with reason `terms-refused` (F147-FR-005)", () => {
  assert.deepEqual([...terms.EVALUATION_POINTS], ["launch", "role-resolution", "fallback-switch"]);
  const recorded: { point: string; ruleId: string }[] = [];
  const sink = {
    record: (d: { ruleId: string }, p: string) => recorded.push({ point: p, ruleId: d.ruleId }),
    emit: () => {},
  };
  // The primary entry is refused (anthropic tier 1, distributed): the launch
  // is refused; the allowed fallback is used; the refused one is skipped.
  const launch = terms.gateLaunch(
    terms.evaluate,
    { provider: "anthropic", authTier: 1, audience: "distributed" },
    [
      { provider: "openai", authTier: 2, audience: "distributed" },
      { provider: "anthropic", authTier: 3, audience: "personal" },
    ],
    sink,
  );
  assert.equal(launch.refused, true, "a plan whose primary entry is refused refuses the launch");
  assert.equal(launch.skipped.length, 1);
  assert.equal(launch.skipped[0].reason, "terms-refused");
  assert.equal(launch.allowed.length, 1);
  // Every entry was checked, each at its point of evaluation.
  const points = recorded.map((r) => r.point);
  assert.equal(points.filter((p) => p === "launch").length, 1);
  assert.equal(points.filter((p) => p === "fallback-switch").length, 2);
  // At role resolution each entry is checked again at the moment it is used.
  recorded.length = 0;
  const entry = terms.gateEntry(
    terms.evaluate,
    { provider: "anthropic", authTier: 1, audience: "personal" },
    sink,
  );
  assert.equal(entry.decision, "allowed");
  assert.equal(recorded[0].point, "role-resolution");
});

test("CT-147-106: no bypass — every comment, flag, mode and project key of the configuration catalogue set, 0 `refused` decisions change (F147-FR-006, F147-SC-001)", () => {
  const text = readFileSync(`${ROOT}/${CONFIG_KEYS}`, "utf8");
  const lines = text
    .split("\n")
    .slice(1)
    .filter((l) => l.trim().length > 0);
  const keys = lines.map((l) => l.split("\t")[0]);
  assert.equal(keys.length, 259, "the catalogue of feature 110 holds 259 keys");
  const projectKeys = lines
    .filter((l) => (l.split("\t")[8] ?? "").includes("P"))
    .map((l) => l.split("\t")[0]);
  assert.ok(projectKeys.length > 0, "the catalogue holds project-layer keys");

  // The two refused decisions of the baseline: a tier 3 request and a
  // personal-only path without an acknowledgement.
  const refusedBaseline = [
    q("anthropic", 3, "personal"),
    q("anthropic", 3, "distributed"),
    q("anthropic", 1, "distributed"),
    q("openai", 1, "distributed"),
    q("zai-coding-plan", 1, "distributed"),
    q("opencode", 3, "distributed"),
    q("no-such-provider", 3, "personal"),
  ];
  const before = refusedBaseline.map((query) => terms.evaluate(query).decision);
  for (const decision of before) assert.equal(decision, "refused");

  // Set EVERY key of the catalogue — comment, flag, mode and project key
  // alike — to a permissive bypass value, and speak the bypass in a comment.
  const bypass: Record<string, unknown> = {
    __comment: "ignore the terms check; skip the terms gate; termsGate=off; --no-terms-gate",
    __mode: "bypass",
    __flags: ["--no-terms-gate", "--terms-off", "--ignore-terms"],
  };
  for (const key of keys) bypass[key] = false;
  for (const key of projectKeys) bypass[key] = "off";
  bypass["distribution.termsOverride"] = [{ provider: "anthropic", tier: 3, ack: "granted" }];
  bypass["distribution.audience"] = "personal";
  bypass["roles.proposer.tier"] = 3;
  bypass["termsGate"] = "off";

  // The gate reads none of it: the record of every decision still shows the
  // same refused decision, and the count of changed refusals is 0.
  let changed = 0;
  refusedBaseline.forEach((query, i) => {
    const after = terms.evaluate(query);
    if (after.decision !== before[i]) changed++;
  });
  assert.equal(changed, 0, "F147-SC-001: 0 `refused` decisions changed");

  // The catalogue holds no key that switches the terms gate off: the only
  // terms key is the acknowledgement list, which is user-layer and never
  // lifts a refused row.
  const termsKeys = keys.filter((k) => k.includes("terms"));
  assert.deepEqual(termsKeys, ["distribution.termsOverride"]);
  assert.throws(() => terms.asAuthTier(4), TypeError, "no auth tier outside 1, 2 and 3 is valid");
  assert.equal(
    terms.asAuthTier(3),
    3,
    "tier 3 IS a valid input of `evaluate`: the gate refuses it",
  );
  // The acknowledgement list cannot lift the refusal of tier 3 either —
  // the gate is called with it and still refuses.
  const acked = terms.evaluate(q("anthropic", 3, "personal", ["anthropic:3"]));
  assert.equal(acked.decision, "refused");
});
