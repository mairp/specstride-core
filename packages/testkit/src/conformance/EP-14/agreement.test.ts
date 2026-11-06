/**
 * T042 (feature 112) — CT-112-202, the agreement (F112-SC-002): over every
 * fixture of the test set of launch fixtures, a launch is refused exactly when
 * the doctor reports a `fail` finding of a check with the flag `lb` —
 * 0 disagreements. The launch and the doctor run the same functions
 * (`runDoctorChecks`), so the two verdicts cannot come apart.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateLaunchChecks,
  launchRefusal,
} from "../../../../doctor/src/registry/launch-subset.ts";
import { runDoctorChecks, makeProbeBag } from "../../../../doctor/src/runner/run.ts";
import { launchFixtures } from "./launch-fixtures.ts";

test("CT-112-202: the launch refuses exactly when the doctor reports an lb fail, over every fixture", async () => {
  let disagreements = 0;
  const verdicts: string[] = [];
  for (const fixture of launchFixtures) {
    const bag = makeProbeBag({ config: { values: new Map(fixture.entries) } });
    // The doctor, over every registered check of the fixture.
    const doctor = await runDoctorChecks({ checks: fixture.checks, bag });
    const lbFails = doctor.findings
      .filter((f) => f.lb && f.severity === "fail")
      .map((f) => f.id)
      .sort((a, b) => a.localeCompare(b));
    // The launch, over the launch subset through the same functions.
    const launch = await evaluateLaunchChecks({
      checks: fixture.checks,
      bag,
      context: fixture.context,
    });
    const doctorSaysRefuse = lbFails.length > 0;
    const launchRefuses = launchRefusal(doctor.findings).refused;
    assert.equal(
      launchRefuses,
      doctorSaysRefuse,
      `${fixture.id}: the launch verdict follows the doctor's lb fail exactly`,
    );
    assert.equal(
      launch.refused,
      doctorSaysRefuse,
      `${fixture.id}: the --launch-checks evaluation agrees with the doctor`,
    );
    assert.deepEqual(
      launch.refusalIds,
      lbFails,
      `${fixture.id}: the refusal names the same lb checks the doctor failed`,
    );
    if (launchRefuses !== fixture.expectRefused || doctorSaysRefuse !== fixture.expectRefused) {
      disagreements += 1;
    }
    verdicts.push(
      `${fixture.id}: doctor=${String(doctorSaysRefuse)} launch=${String(launchRefuses)}`,
    );
  }
  assert.equal(
    disagreements,
    0,
    `F112-SC-002: 0 disagreements over ${String(launchFixtures.length)} fixtures\n${verdicts.join("\n")}`,
  );
});

test("CT-112-202: a fail of a check without lb is reported by the doctor and refuses nothing", async () => {
  const fixture = launchFixtures.find((f) => f.id === "LF-03-fail-not-lb");
  assert.ok(fixture !== undefined, "the fixture set holds the non-lb fail fixture");
  const bag = makeProbeBag({ config: { values: new Map(fixture.entries) } });
  const doctor = await runDoctorChecks({ checks: fixture.checks, bag });
  const fails = doctor.findings.filter((f) => f.severity === "fail");
  assert.equal(fails.length, 1, "the doctor reports exactly one fail");
  assert.equal(fails[0]?.lb, false, "that fail belongs to a check without the lb flag");
  assert.equal(fails[0]?.id, "quota.state.proposer");
  const launch = await evaluateLaunchChecks({
    checks: fixture.checks,
    bag,
    context: fixture.context,
  });
  assert.equal(launch.refused, false, "a non-lb fail never refuses a launch (F112-FR-030)");
});

test("CT-112-202: the doctor names the same finding the launch refuses on (the secret fixture)", async () => {
  const fixture = launchFixtures.find((f) => f.id === "LF-02-inline-secret");
  assert.ok(fixture !== undefined, "the fixture set holds the inline-secret fixture");
  const bag = makeProbeBag({ config: { values: new Map(fixture.entries) } });
  const doctor = await runDoctorChecks({ checks: fixture.checks, bag });
  const launch = await evaluateLaunchChecks({ checks: fixture.checks, bag });
  assert.equal(launch.refused, true);
  assert.deepEqual(launch.refusalIds, ["secret.inline"]);
  assert.ok(
    doctor.findings.some((f) => f.id === "secret.inline" && f.severity === "fail" && f.lb),
    "the doctor reports the same check as an lb fail",
  );
});
