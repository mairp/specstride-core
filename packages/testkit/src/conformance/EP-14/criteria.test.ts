/**
 * T062 (feature 112) — CT-112-203 (F112-SC-003) and CT-112-201
 * (F112-SC-001) at contract level, beside the other behaviour cases of EP-14.
 *
 * CT-112-203: a set-up in which the critic and the proposer are the same model
 * gets the critic-diversity warning — a `warn` finding of `critic.diversity`
 * carrying the result `same-model` — and exits 0, because only a `fail` (or a
 * `warn` under `--strict`) escalates (F112-FR-027, research D-2, DV-041). The
 * warning is never launch-blocking: the check carries no `lb` flag
 * (F112-FR-031).
 *
 * CT-112-201: on the descriptor-only fixture — a resolved registry whose
 * harness entries carry a descriptor but no verified conformance run, state
 * `declared` — the doctor names each declared harness with the state
 * `unverified`, in text and in `--json`, in 100 per cent of runs.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  criticChecks,
  harnessChecksOf,
  runDoctorChecks,
  exitCodeForRun,
  renderText,
  renderJson,
  makeProbeBag,
  type Check,
  type HarnessEntry,
  type ProbeBag,
} from "../../../../doctor/src/index.ts";

/** The subject the text renderer names. */
const SUBJECT = {
  host: "claude-code",
  audience: "personal",
  proposer: "proposer-harness",
  critic: "critic-harness",
};

/** The bag of the fixture: resolved configuration from the entries. */
function bagOf(entries: readonly [string, unknown][], overrides?: Partial<ProbeBag>): ProbeBag {
  return makeProbeBag({ ...overrides, config: { values: new Map(entries) } });
}

test("CT-112-203: same-model gives the critic-diversity warning and exit 0, in every run", async () => {
  const entries: readonly [string, unknown][] = [
    ["critic.diversity.result", "same-model"],
    ["critic.pick", "proposer-harness model"],
  ];
  const bag = bagOf(entries);
  // 100 per cent of runs: the same fixture, five runs.
  for (let run = 0; run < 5; run += 1) {
    const result = await runDoctorChecks({ checks: criticChecks, bag });
    const finding = result.findings.find((f) => f.id === "critic.diversity");
    assert.ok(finding !== undefined, "the critic-diversity warning is present");
    assert.equal(finding.severity, "warn");
    assert.ok(finding.message.includes("same-model"), "the warning names the result same-model");
    // Exit 0: only a `fail` escalates (a warning exits 0 without --strict).
    assert.equal(exitCodeForRun(result), 0);
    assert.equal(exitCodeForRun(result, { strict: false }), 0);
    // And the warning is never launch-blocking (F112-FR-031).
    assert.equal(finding.lb, false);
  }
});

test("CT-112-203: the warning is printed in the text output and stays exit 0", async () => {
  const entries: readonly [string, unknown][] = [["critic.diversity.result", "same-model"]];
  const result = await runDoctorChecks({ checks: criticChecks, bag: bagOf(entries) });
  const exit = exitCodeForRun(result);
  const text = renderText(result.findings, SUBJECT, exit);
  assert.equal(exit, 0);
  assert.ok(text.includes("critic.diversity"), "the text output names the check");
  assert.ok(text.includes("same-model"));
  // The healthy one-line form leads: a warning never fails the run.
  assert.ok(text.startsWith("specstride doctor: host="));
});

test("CT-112-201: the descriptor-only fixture names every declared harness unverified", async () => {
  // Descriptor-only: a descriptor in the registry, no verified conformance run.
  const declared: readonly HarnessEntry[] = [
    { id: "alpha-harness", state: "declared", roles: ["proposer"] },
    { id: "beta-harness", state: "declared", roles: ["critic"] },
  ];
  const checks: readonly Check[] = harnessChecksOf(declared);
  const bag = bagOf([], registryOf(declared));
  for (let run = 0; run < 5; run += 1) {
    const result = await runDoctorChecks({ checks, bag });
    const exit = exitCodeForRun(result);
    const text = renderText(result.findings, SUBJECT, exit);
    const json = renderJson({
      at: new Date(0).toISOString(),
      host: SUBJECT.host,
      audience: "personal",
      exit,
      findings: result.findings,
    });
    for (const entry of declared) {
      const words = `unverified (${entry.state})`;
      // A finding names the harness with the state `unverified`.
      const finding = result.findings.find((f) => f.id === `harness.state.${entry.id}`);
      assert.ok(finding !== undefined, `${entry.id}: a harness.state finding exists`);
      assert.ok(finding.message.includes(words), `${entry.id}: named ${words}`);
      assert.ok(text.includes(`${entry.id} ${words}`), `${entry.id}: named in the text output`);
      assert.ok(
        json.includes(`${entry.id} ${words}`) ||
          (json.includes(entry.id) && json.includes("unverified")),
        `${entry.id}: named in the --json output`,
      );
      // An unverified harness selected for a role is a warning (F112-FR-013).
      assert.equal(finding.severity, "warn");
    }
  }
});

test("CT-112-201: on the same fixture the listing names the state in --json too", () => {
  const declared: readonly HarnessEntry[] = [
    { id: "alpha-harness", state: "declared", roles: ["proposer"] },
  ];
  const checks: readonly Check[] = harnessChecksOf(declared);
  const bag = bagOf([], registryOf(declared));
  return runDoctorChecks({ checks, bag }).then((result) => {
    const json = renderJson({
      at: new Date(0).toISOString(),
      host: SUBJECT.host,
      audience: "personal",
      exit: exitCodeForRun(result),
      findings: result.findings,
    });
    const record = JSON.parse(json) as { findings: { id: string; message: string }[] };
    const listing = record.findings.find((f) => f.id === "harness.discovered");
    assert.ok(listing !== undefined, "the listing finding is in --json");
    assert.ok(listing.message.includes("alpha-harness unverified (declared)"));
  });
});

/** A bag override carrying the resolved registry with the given entries. */
function registryOf(entries: readonly HarnessEntry[]): Partial<ProbeBag> {
  return { registry: { ids: entries.map((e) => e.id), harnesses: entries } };
}
