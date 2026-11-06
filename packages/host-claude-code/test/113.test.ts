/**
 * T024 of `specs/113-host-claude-code/tasks.md` — the host conformance suite
 * of EP-01 (annex H §H.1) run against THIS PLUGIN and the plain shell, beside
 * the contract-level cases of the testkit (`EP-01/contract.test.ts`,
 * F113-FR-034).
 *
 * The suite is the testkit's frame: `registerHostConformanceCases` of
 * `@specstride/testkit/conformance/EP-01/host-suite` registers the record of
 * the two targets, every case of this host against every target, the
 * `describe` of the six capabilities of §H.1 and the live-host case as a skip
 * with its reason. The targets are recorded by `hostConformanceTargets` of
 * `@specstride/testkit/conformance/EP-01/targets` from THIS host's record
 * (`FIRST_TARGET` of `./113-suite.ts`): this plugin first, the plain shell —
 * the sample of EP-01 — second. The cases themselves are `./113-suite.ts`'s:
 * they are what this host supplies.
 *
 * The case of survival after detaching belongs to the launcher fixture family
 * FX-35; no target of the suite is a LIVE host, so that case is a `test` with
 * a SKIP and the reason of `LIVE_HOST_SKIP_REASON` — never a pass (Principle
 * XVII).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { hostConformanceTargets } from "@specstride/testkit/conformance/EP-01/targets";
import { registerHostConformanceCases } from "@specstride/testkit/conformance/EP-01/host-suite";
import { ROOT } from "@specstride/testkit/conformance/frame";
import { FIRST_TARGET, implementationOfTarget, suiteCases } from "./113-suite.ts";

const targets = hostConformanceTargets(FIRST_TARGET);

const registered = registerHostConformanceCases({
  targets,
  implementationOf: implementationOfTarget,
  cases: suiteCases,
});

test("the suite runs this plugin: its own record is the FIRST target (F113-FR-034)", () => {
  assert.deepEqual(registered, {
    targetCount: 2,
    caseCount: suiteCases.length,
    caseRuns: suiteCases.length * 2,
  });
  // This plugin first, under the id T004 records for it, at the source T002
  // created.
  assert.equal(targets[0]!.implementationId, FIRST_TARGET.implementationId);
  assert.equal(targets[0]!.implementationId, "host-claude-code");
  assert.equal(targets[0]!.source, "packages/host-claude-code");
  assert.equal(targets[0]!.requirement, "F113-FR-034");
  // The package of the first target is in the workspace (T002 created it).
  assert.equal(
    existsSync(join(ROOT, "packages/host-claude-code", "package.json")),
    true,
    "the plugin package of the first target is missing",
  );
  // And the second target is the plain shell, as every host suite holds.
  assert.equal(targets[1]!.implementationId, "sample-host-plain-shell");
});
