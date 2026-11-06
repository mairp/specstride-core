/**
 * T038 (feature 112) — CT-112-130, the launch subset (F112-FR-030; annex G
 * §G.4). Over the test set of launch fixtures (./launch-fixtures.ts):
 *
 * - the launch checks are exactly the checks whose flag `lb` is set, in their
 *   fixed order, and they are the same functions the doctor runs;
 * - the ten flags of F112-FR-030, with `budget.caps` in the subset only for an
 *   automatically picked metered critic;
 * - a launch is refused exactly on a `fail` of an `lb` check — never for a
 *   warning, an `info`, or a `fail` of a check without the flag;
 * - no flag, mode or project key switches an `lb` check off;
 * - `--launch-checks` (`evaluateLaunchChecks`) evaluates the same subset
 *   without launching, exits 2 on an `lb` `fail`, and is the form a host hook
 *   calls (annex G §G.4).
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateLaunchChecks,
  launchRefusal,
  launchSubset,
} from "../../../../doctor/src/registry/launch-subset.ts";
import { runDoctorChecks, orderFindings, makeProbeBag } from "../../../../doctor/src/runner/run.ts";
import type { ProbeBag } from "../../../../doctor/src/registry/types.ts";
import { launchFixtures, healthyLaunchChecks } from "./launch-fixtures.ts";

/** The bag of a fixture: resolved configuration from its entries, nothing real. */
function bagOf(entries: readonly [string, unknown][], overrides?: Partial<ProbeBag>): ProbeBag {
  return makeProbeBag({ ...overrides, config: { values: new Map(entries) } });
}

function fixtureEntries(id: string): readonly [string, unknown][] {
  const fixture = launchFixtures.find((f) => f.id === id);
  assert.ok(fixture !== undefined, `the fixture set holds ${id}`);
  return fixture.entries;
}

const TEN_LB_IDS = Object.freeze([
  "bin.codex",
  "auth.codex.critic",
  "model.reach.critic",
  "critic.independence",
  "terms.gate",
  "budget.caps",
  "config.schema",
  "secret.inline",
  "secret.file",
  "sandbox.critic",
]);

test("CT-112-130: the launch checks are exactly the lb subset, in the fixed order (F112-FR-030)", () => {
  const checks = healthyLaunchChecks();
  const subset = launchSubset(checks, { autopickMeteredCritic: true });
  assert.deepEqual(
    subset.map((c) => c.id),
    TEN_LB_IDS,
    "the subset holds the ten launch checks of F112-FR-030 and nothing else",
  );
  // Fixed order: the running order of the registry (11, 18, 20, 22, 24, 28, 30, 34, 35, 40).
  assert.deepEqual(
    subset.map((c) => c.order),
    [11, 18, 20, 22, 24, 28, 30, 34, 35, 40],
  );
  // The subset is a view over the same registered check objects: same functions.
  for (const c of subset) {
    assert.ok(checks.includes(c), `${c.id} is the very registered check, not a copy`);
  }
  // Non-launch-blocking checks are never in the subset.
  assert.ok(!subset.some((c) => c.id === "critic.diversity"));
});

test("CT-112-130: budget.caps joins the subset only for an automatically picked metered critic", () => {
  const checks = healthyLaunchChecks();
  const without = launchSubset(checks);
  assert.ok(!without.some((c) => c.id === "budget.caps"));
  const explicitNo = launchSubset(checks, { autopickMeteredCritic: false });
  assert.ok(!explicitNo.some((c) => c.id === "budget.caps"));
  const withAutopick = launchSubset(checks, { autopickMeteredCritic: true });
  assert.ok(withAutopick.some((c) => c.id === "budget.caps"));
  assert.equal(withAutopick.length, without.length + 1);
  // Every other lb check stays in the subset in both cases.
  assert.deepEqual(
    without.map((c) => c.id),
    TEN_LB_IDS.filter((id) => id !== "budget.caps"),
  );
});

test("CT-112-130: the launch runs the same functions the doctor runs", async () => {
  for (const fixture of launchFixtures) {
    const bag = bagOf(fixture.entries);
    const subset = launchSubset(fixture.checks, fixture.context);
    const direct = await runDoctorChecks({ checks: subset, bag });
    const evaluated = await evaluateLaunchChecks({
      checks: fixture.checks,
      bag,
      context: fixture.context,
    });
    assert.deepEqual(
      evaluated.findings,
      orderFindings(direct.findings),
      `${fixture.id}: the evaluation is runDoctorChecks over the lb subset — the same functions`,
    );
    assert.deepEqual(
      evaluated.subset.map((c) => c.id),
      subset.map((c) => c.id),
      `${fixture.id}: the same subset, in the same fixed order`,
    );
  }
});

test("CT-112-130: a launch is refused exactly on a fail of an lb check (F112-FR-030)", async () => {
  let disagreements = 0;
  for (const fixture of launchFixtures) {
    const evaluated = await evaluateLaunchChecks({
      checks: fixture.checks,
      bag: bagOf(fixture.entries),
      context: fixture.context,
    });
    const refusal = launchRefusal(evaluated.findings);
    if (refusal.refused !== fixture.expectRefused) disagreements += 1;
    assert.equal(
      refusal.refused,
      fixture.expectRefused,
      `${fixture.id}: refused=${String(refusal.refused)}, expected ${String(fixture.expectRefused)}`,
    );
    assert.deepEqual(
      refusal.ids,
      fixture.expectLbFailIds,
      `${fixture.id}: the refusal names exactly the lb checks whose fail refuses`,
    );
  }
  assert.equal(disagreements, 0, "0 disagreements over the test set of launch fixtures");
});

test("CT-112-130: a warning or an info of an lb check never refuses a launch", async () => {
  // terms.gate is an lb check whose unknown row reads as a warning.
  const warned = await evaluateLaunchChecks({
    checks: healthyLaunchChecks(),
    bag: bagOf(fixtureEntries("LF-09-unknown-terms")),
  });
  assert.equal(warned.refused, false);
  assert.equal(warned.exit, 0, "a warning exits 0 without --strict (F112-FR-027)");
  // budget.caps reads info on healthy caps, and critic.diversity warns without refusing.
  const info = await evaluateLaunchChecks({
    checks: healthyLaunchChecks(),
    bag: bagOf(fixtureEntries("LF-04-same-model-diversity")),
  });
  assert.equal(info.refused, false, "the critic-diversity warning never blocks a launch");
  assert.equal(info.exit, 0);
});

test("CT-112-130: no flag, mode or project key switches an lb check off", async () => {
  const entries = fixtureEntries("LF-02-inline-secret");
  // A project key, a mode marker and a doctor key that claim to skip the
  // launch checks change nothing: the subset and the refusal are the same.
  const withDisablers = bagOf([
    ...entries,
    ["launch.skipChecks", ["secret.inline"]],
    ["doctor.launch.disable", true],
    ["project.doctor.off", "yes"],
  ]);
  const plain = bagOf(entries);
  for (const [name, bag] of [
    ["plain", plain],
    ["with disablers", withDisablers],
  ] as const) {
    for (const quick of [false, true]) {
      const evaluated = await evaluateLaunchChecks({
        checks: healthyLaunchChecks(),
        bag: quick ? makeProbeBag({ ...bag, quick: true }) : bag,
      });
      assert.equal(
        evaluated.refused,
        true,
        `${name}, quick=${String(quick)}: the lb check still runs and still refuses`,
      );
      assert.deepEqual(evaluated.refusalIds, ["secret.inline"]);
      assert.equal(evaluated.subset.length, 9);
    }
  }
  assert.deepEqual(
    launchSubset(healthyLaunchChecks()).map((c) => c.id),
    TEN_LB_IDS.filter((id) => id !== "budget.caps"),
    "the subset itself depends on no flag, mode or project key",
  );
});

test("CT-112-130: --launch-checks evaluates the same subset without launching, exit 2 on an lb fail", async () => {
  // The evaluation launches nothing: it takes a probe bag and nothing else —
  // no launch id, no run, no supervisor input (annex G §G.4).
  const refused = await evaluateLaunchChecks({
    checks: healthyLaunchChecks(),
    bag: bagOf(fixtureEntries("LF-02-inline-secret")),
  });
  assert.equal(refused.exit, 2, "an lb fail exits 2 (F112-FR-027)");
  assert.equal(refused.refused, true);

  const clean = await evaluateLaunchChecks({
    checks: healthyLaunchChecks(),
    bag: bagOf(fixtureEntries("LF-01-healthy")),
  });
  assert.equal(clean.exit, 0);
  assert.equal(clean.refused, false);
  assert.ok(clean.findings.length > 0, "the ok findings are still computed");

  // A host hook calls exactly this form: the subset, the findings in the
  // doctor's output order, the exit code and the refusal, as one result.
  for (const key of ["subset", "findings", "exit", "refused", "refusalIds"]) {
    assert.ok(key in refused, `the host-hook result holds ${key}`);
  }
});
