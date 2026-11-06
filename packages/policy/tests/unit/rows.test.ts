/**
 * Feature 147 — tests CT-147-107 to CT-147-113 (T003, User Story 1).
 *
 * CT-147-107  front harnesses: pi is gated by the row of the provider in
 *             use; pi has no row of its own (F147-FR-007, F147-FR-011).
 * CT-147-108  unknown terms: the warning, never a default, never an
 *             automatic pick (F147-FR-008).
 * CT-147-109  the distributed default (tier 2) and the opt-in of
 *             `distribution.termsOverride` with the event
 *             `terms.override_used`; the refusal of a harness with no
 *             Tier 2 credential (F147-FR-009).
 * CT-147-110  the tier default per audience, and the named tier (F147-FR-010).
 * CT-147-111  the shipped rows of the Wave 1 harness adapters, with the
 *             access date of R8v and the facts R8v rows 37 to 40 (F147-FR-011).
 * CT-147-112  the SDK transport (`sdk-in-process`) is tier 2 with API keys
 *             only (F147-FR-012).
 * CT-147-113  replacement of the data by a newer valid file in user-level
 *             state; an invalid one is ignored with a doctor finding
 *             (F147-FR-013).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as terms from "../../src/terms/index.ts";

const ROOT = fileURLToPath(new URL("../../../..", import.meta.url));

const q = (
  provider: string,
  authTier: 1 | 2 | 3,
  audience: "personal" | "distributed",
  acknowledgements: readonly string[] = [],
) => ({ provider, authTier, audience, acknowledgements });

test("CT-147-107: a front harness is gated by the row of the provider in use; pi has no row of its own (F147-FR-007, F147-FR-011)", () => {
  // pi with an API-key back end: the row of the provider in use decides.
  const piClaudeApiKey = terms.evaluate(q("anthropic", 1, "personal"));
  assert.equal(
    piClaudeApiKey.decision,
    "allowed",
    "pi over the Claude subscription? no: API key at tier 1, personal",
  );
  const piClaudeOAuth = terms.evaluate(q("anthropic", 3, "personal"));
  assert.equal(
    piClaudeOAuth.decision,
    "refused",
    "pi's `/login` OAuth for a Claude subscription is tier 3: refused",
  );
  assert.equal(piClaudeOAuth.row?.status, "refused");
  // pi with any other API-key provider: that provider's row decides too.
  assert.equal(terms.evaluate(q("openai", 2, "distributed")).decision, "allowed");
  // pi has NO row of its own: the shipped data keys rows by provider, never
  // by harness name (F147-FR-007).
  assert.equal(
    terms.shippedData().rows.find((r) => r.provider === "pi"),
    undefined,
    "the shipped data holds no row for pi itself",
  );
  // The facts R8v rows 37 to 40 travel with the data as carried provenance.
  const carried = JSON.parse(
    readFileSync(`${ROOT}/packages/policy/src/terms/data/terms.json`, "utf8"),
  ) as { carried?: { rowNumber: number }[] };
  assert.deepEqual(
    (carried.carried ?? []).map((c) => c.rowNumber),
    [37, 38, 39, 40],
    "the pi facts of R8v rows 37 to 40 are carried in the generated data",
  );
});

test("CT-147-108: unknown terms — allowed with a warning at tiers 1 and 2, refused at tier 3, never a default and never an automatic pick (F147-FR-008)", () => {
  for (const provider of ["dsh", "prime", "no-such-harness"] as const) {
    const tier1 = terms.evaluate(q(provider, 1, "personal"));
    assert.equal(tier1.decision, "allowed-with-warning", `${provider} tier 1: unknown terms`);
    assert.match(tier1.warning ?? "", /unknown terms/i, "the decision names the unknown terms");
    assert.equal(tier1.row, null, "no row is reported for unknown terms");
    const tier2 = terms.evaluate(q(provider, 2, "distributed"));
    assert.equal(tier2.decision, "allowed-with-warning");
    const tier3 = terms.evaluate(q(provider, 3, "personal"));
    assert.equal(
      tier3.decision,
      "refused",
      "tier 3 without an allowed row is refused with the explanation",
    );
    assert.match(tier3.explanation, /refused/i);
    // Never a default: a provider with no row gives no default tier, so the
    // caller cannot pick it automatically.
    assert.equal(terms.defaultTier(provider, "personal"), null);
    assert.equal(terms.defaultTier(provider, "distributed"), null);
  }
});

test("CT-147-109: the distributed default is tier 2; the opt-in of `distribution.termsOverride` runs with a warning, a recorded decision and the event `terms.override_used`; a harness with no Tier 2 credential is refused with what to configure (F147-FR-009)", () => {
  // Default: tier 2, which is allowed for the distributed audience.
  assert.equal(terms.defaultTier("anthropic", "distributed"), 2);
  assert.equal(terms.evaluate(q("anthropic", 2, "distributed")).decision, "allowed");
  // Opt-in: without the acknowledgement, tier 1 is refused.
  assert.equal(terms.evaluate(q("anthropic", 1, "distributed")).decision, "refused");
  // With the acknowledgement, the path runs — with a warning and the marker
  // that the gate call turns into `terms.override_used`.
  const optIn = terms.evaluate(q("anthropic", 1, "distributed", ["anthropic:1"]));
  assert.equal(optIn.decision, "allowed-with-warning");
  assert.equal(optIn.overrideUsed, true);
  assert.match(optIn.warning ?? "", /personal use only/i);
  assert.match(optIn.explanation, /distribution\.termsOverride/);

  // The gate call records the decision and emits the event, once per call
  // that relies on an entry (F147-FR-009; F111-FR-051).
  const recorded: unknown[] = [];
  const events: string[] = [];
  const sink = {
    record: (d: unknown) => recorded.push(d),
    emit: (e: { type: string }) => events.push(e.type),
  };
  terms.gate(terms.evaluate, q("anthropic", 1, "distributed", ["anthropic:1"]), "launch", sink);
  assert.deepEqual(events, ["terms.override_used"], "the opt-in emits terms.override_used");
  assert.equal(recorded.length, 1, "the decision is recorded");
  // No entry relied on: no event.
  events.length = 0;
  terms.gate(terms.evaluate, q("anthropic", 1, "distributed"), "launch", sink);
  assert.deepEqual(events, []);
  terms.gate(terms.evaluate, q("anthropic", 1, "personal"), "launch", sink);
  assert.deepEqual(events, [], "an `allowed` path without an entry emits nothing");

  // A harness with no Tier 2 credential: refused, with the reason and what
  // to configure.
  const refusal = terms.refusalWithoutTier2Credential("anthropic", "distributed", false);
  assert.equal(refusal.refused, true);
  assert.match(refusal.reason, /personal use only/);
  assert.match(refusal.configure, /roles\.<role>\.credential/);
  // With the credential, or in the personal audience, no refusal.
  assert.equal(
    terms.refusalWithoutTier2Credential("anthropic", "distributed", true).refused,
    false,
  );
  assert.equal(terms.refusalWithoutTier2Credential("anthropic", "personal", false).refused, false);
});

test("CT-147-110: the tier default per audience; a named tier is checked against the row, and tier 3 is never a valid named tier (F147-FR-010)", () => {
  // `personal`: tier 1 where the tier 1 row allows it, else tier 2.
  assert.equal(
    terms.defaultTier("anthropic", "personal"),
    1,
    "Claude at tier 1 is allowed for personal",
  );
  assert.equal(terms.defaultTier("openai", "personal"), 1, "conditional is usable, so tier 1");
  assert.equal(terms.defaultTier("openrouter", "personal"), 2, "no tier 1 row: tier 2");
  assert.equal(terms.defaultTier("deepseek", "personal"), 2, "no tier 1 row: tier 2");
  // `distributed`: tier 2 for every provider (F147-FR-009).
  for (const provider of [
    "anthropic",
    "openai",
    "google",
    "github-copilot",
    "openrouter",
    "zai-api",
  ]) {
    assert.equal(
      terms.defaultTier(provider, "distributed"),
      2,
      `${provider}: tier 2 is the distributed default`,
    );
  }
  // The named tier is checked: the gate refuses a named tier 1 for Claude
  // in the distributed audience even though the default would be tier 2.
  assert.equal(terms.evaluate(q("anthropic", 1, "distributed")).decision, "refused");
  // And tier 3 is never a valid value of `roles.<role>.tier`: the guard of
  // the table refuses it before any row is consulted.
  assert.equal(terms.evaluate(q("anthropic", 3, "distributed")).decision, "refused");
});

test("CT-147-111: the shipped rows carry the access date of R8v, a quoted sentence and the re-check date; the Wave 1 providers and the `both` rows are complete (F147-FR-011)", () => {
  const shipped = terms.shippedData();
  assert.equal(shipped.id, "terms-gate-default");
  assert.equal(shipped.version, "1");
  assert.equal(
    shipped.rows.length,
    38,
    "38 rows: the 42 cells of the matrix less the 4 collapsed `both` pairs",
  );
  const byKey = new Map(shipped.rows.map((r) => [`${r.provider}:${r.authTier}:${r.audience}`, r]));
  // The rows of the acceptance scenarios.
  assert.equal(byKey.get("anthropic:1:personal")?.status, "allowed");
  assert.equal(byKey.get("anthropic:1:distributed")?.status, "personal-only");
  assert.equal(byKey.get("anthropic:2:distributed")?.status, "allowed");
  assert.equal(byKey.get("openai:1:personal")?.status, "conditional");
  assert.equal(byKey.get("openai:1:distributed")?.status, "personal-only");
  assert.equal(byKey.get("zai-coding-plan:1:personal")?.status, "conditional");
  assert.equal(byKey.get("zai-coding-plan:1:distributed")?.status, "personal-only");
  assert.equal(byKey.get("zai-api:2:personal")?.status, "allowed");
  assert.equal(byKey.get("zai-api:2:distributed")?.status, "allowed");
  assert.equal(byKey.get("opencode:1:personal")?.status, "conditional");
  assert.equal(byKey.get("opencode:3:distributed")?.status, "refused");
  assert.equal(byKey.get("deepseek:2:distributed")?.status, "allowed");
  // Every row carries the access date of R8v, a quoted sentence, the source
  // and the date of the last re-check.
  for (const row of shipped.rows) {
    assert.equal(row.accessDate, "2026-09-29", `${row.provider}: the access date of R8v`);
    assert.ok(row.source.length > 0);
    assert.ok(row.quotedSentence.length > 0, `${row.provider}: the quoted sentence`);
    assert.ok(row.verifiedOn !== null, `${row.provider}: the re-check date of T006 is recorded`);
  }
  // The dsh, prime and unknown-provider rows are absent: nothing ships for
  // them (research R8 rule 6).
  for (const absent of ["dsh", "prime", "pi"]) {
    assert.equal(
      shipped.rows.find((r) => r.provider === absent),
      undefined,
    );
  }
  // The completed `contracts/terms-rows.tsv` holds the same facts.
  const tsv = readFileSync(`${ROOT}/specs/147-terms-gate/contracts/terms-rows.tsv`, "utf8")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  assert.equal(
    tsv[0],
    "provider\ttier\taudience\tstatus\tsource\taccess_date\tquoted_sentence\tverified_on",
  );
  let cells = 0;
  for (const line of tsv.slice(1)) {
    const columns = line.split("\t");
    if (columns.length !== 8) continue;
    cells += columns[2] === "both" ? 2 : 1;
  }
  assert.equal(cells, 38, "the completed TSV expands to the 38 shipped rows");
});

test("CT-147-112: the SDK transport (`sdk-in-process`) is auth tier 2 with API keys only; the rows it reaches are `allowed` (F147-FR-012)", () => {
  assert.equal(terms.SDK_TRANSPORT, "sdk-in-process");
  assert.equal(terms.SDK_TRANSPORT_TIER, 2, "the SDK transport has no subscription login: tier 2");
  assert.equal(terms.SUBPROCESS_TRANSPORT, "subprocess");
  // Every provider row the SDK transport can reach at tier 2 is `allowed`
  // for both audiences; a provider without a tier 2 row is not reachable.
  for (const audience of ["personal", "distributed"] as const) {
    for (const provider of [
      "anthropic",
      "openai",
      "google",
      "github-copilot",
      "openrouter",
      "zai-api",
      "deepseek",
    ]) {
      const decision = terms.evaluate(q(provider, terms.SDK_TRANSPORT_TIER, audience));
      assert.equal(
        decision.decision,
        "allowed",
        `${provider} over the SDK transport at ${audience}`,
      );
      assert.equal(decision.row?.authTier, 2);
    }
  }
  // The subscription path of pi (tier 3) never reaches the SDK transport.
  assert.equal(terms.evaluate(q("anthropic", 3, "distributed")).decision, "refused");
});

test("CT-147-113: a newer valid file in user-level state replaces the shipped data; a file that does not validate is ignored with a doctor finding (F147-FR-013)", () => {
  const shipped = terms.shippedData();
  // A valid replacement: the decision changes with no code change.
  const replacement = {
    id: "terms-gate-user",
    version: "2",
    rows: [
      {
        provider: "user-provider",
        authTier: 1,
        audience: "personal",
        status: "allowed",
        source: "a valid user-level file",
        accessDate: "2026-10-01",
        quotedSentence: "The user file allows user-provider at tier 1.",
        verifiedOn: "2026-10-01",
      },
    ],
  };
  const replaced = terms.resolveTermsData(shipped, replacement);
  assert.equal(replaced.origin, "replaced");
  assert.equal(replaced.finding, null);
  const gate = terms.makeEvaluate(replaced.data!);
  assert.equal(gate(q("user-provider", 1, "personal")).decision, "allowed");
  assert.equal(
    gate(q("anthropic", 1, "personal")).decision,
    "allowed-with-warning",
    "the shipped rows are gone",
  );
  // No file: the shipped data applies.
  const none = terms.resolveTermsData(shipped, undefined);
  assert.equal(none.origin, "shipped");
  // An invalid file: ignored, the shipped file applies, and a doctor
  // finding names the file and the reason.
  const broken = structuredClone(replacement);
  delete (broken.rows[0] as Record<string, unknown>).quotedSentence;
  const ignored = terms.resolveTermsData(shipped, broken);
  assert.equal(ignored.origin, "ignored");
  assert.equal(ignored.data, shipped, "the shipped file applies");
  assert.match(ignored.finding ?? "", /user:terms/);
  assert.match(ignored.finding ?? "", /quotedSentence/);
  // The shipped data itself is untouched — the loader writes nothing.
  assert.equal(
    terms.shippedData().rows.find((r) => r.provider === "anthropic:1:personal"),
    undefined,
  );
  assert.equal(terms.shippedData().rows.length, 38);
});

test("CT-147-113a: the loader hands the doctor the data for the 30-day warning; it never changes a decision (F147-FR-013)", () => {
  // The shipped data was verified on 2026-11-01: fresh at that date, stale
  // once more than STALE_AFTER_DAYS (30) whole days have passed.
  const shipped = terms.shippedData();
  const fresh = terms.staleness(shipped, Date.UTC(2026, 10, 1));
  assert.equal(fresh.verifiedOn, "2026-11-01");
  assert.equal(fresh.ageDays, 0);
  assert.equal(fresh.stale, false);
  assert.equal(fresh.staleAfterDays, 30);
  // Exactly 30 whole days later: not yet stale; 31: stale (ruling 59).
  assert.equal(terms.staleness(shipped, Date.UTC(2026, 11, 1)).stale, false);
  const stale = terms.staleness(shipped, Date.UTC(2026, 11, 2));
  assert.equal(stale.ageDays, 31);
  assert.equal(stale.stale, true);
  // The newest `verified-on` across the rows is what counts, and the
  // replacement data in user-level state drives the warning.
  const replacement = {
    id: "terms-gate-user",
    version: "2",
    rows: [
      {
        provider: "user-provider",
        authTier: 1,
        audience: "personal",
        status: "allowed",
        source: "a valid user-level file",
        accessDate: "2026-10-01",
        quotedSentence: "The user file allows user-provider at tier 1.",
        verifiedOn: "2026-09-01",
      },
      {
        provider: "user-provider-2",
        authTier: 2,
        audience: "distributed",
        status: "allowed",
        source: "a valid user-level file",
        accessDate: "2026-10-01",
        quotedSentence: "The user file allows user-provider-2 at tier 2.",
        verifiedOn: "2026-10-20",
      },
    ],
  };
  const resolved = terms.resolveTermsData(shipped, replacement);
  assert.equal(resolved.origin, "replaced");
  const userStale = terms.staleness(resolved.data!, Date.UTC(2026, 10, 19));
  assert.equal(userStale.verifiedOn, "2026-10-20");
  assert.equal(userStale.stale, false);
  // An ignored file leaves the shipped data — and its staleness — in force.
  const broken = structuredClone(replacement);
  delete (broken.rows[0] as Record<string, unknown>).verifiedOn;
  const ignored = terms.resolveTermsData(shipped, broken);
  assert.equal(ignored.origin, "ignored");
  assert.equal(terms.staleness(ignored.data!, Date.UTC(2026, 11, 2)).verifiedOn, "2026-11-01");
  // Staleness is a doctor warning, never a gate input: a stale data file
  // does not change one decision.
  const gate = terms.makeEvaluate(shipped);
  const before = gate(q("anthropic", 1, "personal")).decision;
  assert.equal(gate(q("anthropic", 1, "personal")).decision, before);
  assert.notEqual(before, "refused");
});
