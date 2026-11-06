/**
 * T059 — CT-138-43: the prime adapter PASSES the conformance suite of the
 * harness port (feature 109, EP-02) with the fake binary (F138-FR-043).
 *
 * The whole suite runs — every case HC-01 to HC-17 of
 * `contracts/conformance-cases.json` (read as data by the suite) — on the
 * target that `./prime-target.ts` composes: the adapter's own allow-list,
 * environment filtering, telemetry switches (both names of the dialect row
 * `prime`), free detection and version read with prime's flag `-v`, over the
 * fake binary of EP-02. No paid and no external service: the suite reports
 * `externalCalls: 0` and `paidCalls: 0`, and this file asserts both.
 *
 * The second test pins the facts that make this THE PRIME ADAPTER's run and
 * not the sample's: the target's id, the two telemetry switches read from
 * the dialect row as data, the allow-list the adapter builds
 * (F138-FR-005), the version flag `-v` probed on the agent executable and
 * never on the launcher (F138-FR-002), prime's own tested range and date,
 * and the range warning the adapter raises for the fake binary's version —
 * which lies outside prime's range on purpose (see `./prime-target.ts`).
 *
 * Hermetic: only the fake binary of EP-02 runs; no model, no key, no
 * network beyond the suite's own refused loopback probe of HC-09.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { runConformanceSuite } from "../../../../packages/testkit/src/conformance/EP-02/suite.ts";
import {
  AGENT_VERSION_FLAG,
  RANGE_VERIFIED_ON,
  TESTED_VERSION_RANGE,
  versionRangeWarning,
} from "../../src/detect/index.ts";
import { PRIME_LAUNCHER_ALIAS_ORDER } from "../../src/proposer/names.ts";
import { PRIME_TELEMETRY_SWITCHES } from "../../src/environment/index.ts";
import { primeDescriptor } from "../../src/descriptor/index.ts";
import { primeDialectRow } from "../../src/index.ts";
import {
  createPrimeConformanceTarget,
  PRIME_CONFORMANCE_CREDENTIAL_VAR,
  PRIME_CONFORMANCE_DESCRIPTOR,
  PRIME_CONFORMANCE_FAKE_VERSION,
  PRIME_CONFORMANCE_TARGET_ID,
} from "./prime-target.ts";

test("CT-138-43: the prime adapter passes every case of the EP-02 conformance suite with the fake binary", async () => {
  const target = createPrimeConformanceTarget();
  try {
    const result = await runConformanceSuite(target);
    assert.equal(result.target, PRIME_CONFORMANCE_TARGET_ID);
    const failed = result.cases.filter((outcome) => !outcome.passed);
    assert.deepEqual(
      failed.map((outcome) => `${outcome.id}: ${outcome.detail ?? ""}`),
      [],
      "the cases of the suite that failed",
    );
    assert.equal(result.cases.length, 17, "every case of the contract ran");
    assert.equal(result.passed, true);
    assert.equal(result.externalCalls, 0, "the suite reached no external service");
    assert.equal(result.paidCalls, 0, "the suite made no paid call");
  } finally {
    target.dispose();
  }
});

test("CT-138-43: the target is the prime adapter — its allow-list, telemetry switches, detection and range come from the adapter's code", async () => {
  const target = createPrimeConformanceTarget();
  try {
    // The identity and the row this adapter is the tested adapter for.
    assert.equal(target.id, "prime");
    assert.equal(primeDialectRow.dialect, "prime");
    assert.deepEqual(primeDescriptor.stream, { format: "jsonl", dialect: "prime" });

    // The telemetry switch is the DIALECT ROW's, both names (F138-FR-041).
    const telemetry = target.telemetrySwitch();
    assert.equal(telemetry.declared, true);
    assert.deepEqual(telemetry.env, PRIME_TELEMETRY_SWITCHES.env);
    assert.equal(telemetry.env.DO_NOT_TRACK, "1");
    assert.equal(telemetry.env.PRIME_AGENT_TELEMETRY, "0");

    // The allow-list is the adapter's (F138-FR-005): the fixed names, HOME,
    // the provider's variable, the session directory variable when set, and
    // the two telemetry names. The critic's credential stays off the
    // proposer's list.
    const allowed = target.allowList({
      role: "proposer",
      credentialVars: {
        proposer: [PRIME_CONFORMANCE_CREDENTIAL_VAR],
        critic: ["OTHER_TOKEN"],
      },
    }) as readonly string[];
    for (const name of [
      "PATH",
      "LANG",
      "LC_*",
      "HOME",
      PRIME_CONFORMANCE_CREDENTIAL_VAR,
      "PRIME_AGENT_TELEMETRY",
      "DO_NOT_TRACK",
    ]) {
      assert.ok(allowed.includes(name), `the allow-list carries ${name}`);
    }
    assert.ok(!allowed.includes("OTHER_TOKEN"), "the critic's credential leaked onto the list");
    const built = target.buildEnvironment({
      role: "proposer",
      credentialVars: { proposer: [PRIME_CONFORMANCE_CREDENTIAL_VAR], critic: ["OTHER_TOKEN"] },
      processEnv: {
        PATH: "/usr/bin",
        HOME: "/srv/home",
        LANG: "C.UTF-8",
        LC_ALL: "C",
        SAMPLE_TOKEN: "s",
        UNRELATED: "must not travel",
      },
    });
    assert.equal(built.UNRELATED, undefined);
    assert.equal(built.OTHER_TOKEN, undefined);

    // Detection probes the agent executable with prime's own flag, never
    // the launcher (F138-FR-002); the launcher variables keep their order
    // (F138-FR-003) and are never version-probed.
    assert.equal(AGENT_VERSION_FLAG, "-v");
    assert.deepEqual(PRIME_LAUNCHER_ALIAS_ORDER, [
      "SPECSTRIDE_PRIME_FLEET_BIN",
      "SPECSTRIDE_PRIME_BIN",
    ]);

    // Prime's own tested range and date, and the warning the adapter raises
    // for the fake binary's version — outside the range on purpose.
    assert.equal(TESTED_VERSION_RANGE, ">=0.7.3 <0.8");
    assert.equal(primeDescriptor.versionRange, TESTED_VERSION_RANGE);
    assert.equal(primeDescriptor.verifiedOn, RANGE_VERIFIED_ON);
    assert.equal(versionRangeWarning(PRIME_CONFORMANCE_FAKE_VERSION).kind, "version-range");

    // The conformance reading stays a reading: prime's as-is flags live in
    // the argument-table contract, pinned by the parity tests, not here.
    const descriptorFacts = PRIME_CONFORMANCE_DESCRIPTOR as {
      containment: { ceiling: string };
    };
    assert.equal(descriptorFacts.containment.ceiling, "C0");
  } finally {
    target.dispose();
  }
});
