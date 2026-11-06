/**
 * T151 — the conformance suite at contract level for EP-14, the doctor check
 * registry (annex G, §G.7): CT-100-289.
 *
 * Before the named case the suite checks the five things every suite at
 * contract level checks (annex A, §A.4). The behaviour of EP-14 belongs to
 * feature 112; its behaviour cases go in this folder beside this file.
 */
import assert from "node:assert/strict";
import {
  AS_IS_LAUNCH_CHECKS,
  CATALOGUE_SIZE,
  CORE_GUARANTEES,
  CRITIC_DIVERSITY_WARNING_IS_LB,
  EXIT_WHEN_A_CHECK_THROWS,
  HARNESS_CHECK_ID_FORM,
  IMPLEMENTATION_GUARANTEES,
  MESSAGE_TEMPLATE_CAP_BYTES,
  OPERATIONS,
  POINT_ID,
  PROBE_TIMED_OUT_MESSAGE,
  REGISTRATION_CALL_LIVES_IN,
  SCHEMA_ID,
  SEVERITIES,
  SEVERITY_WHEN_UNKNOWN,
  UNKNOWN_CHECK_ID_IN_A_FILTER_EXIT_CODE,
  launchChecks,
} from "@specstride/contracts/ep/doctor";
import type { DoctorCheck } from "@specstride/contracts/ep/doctor";
import {
  isDoctorFindings,
  readSeverity,
  summaryOf,
} from "@specstride/contracts/records/doctor-findings";
import { SAMPLE_CHECK, implementation } from "../../samples/EP-14/index.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-14" as const;

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-289",
    title:
      "the doctor is a registry of checks with the form of §G.7, its `--json` output follows the schema of §G.7, and the launch checks are exactly the checks whose flag `lb` is set (F100-FR-189)",
    level: "contract",
    proves: ["F100-FR-189"],
    async run(impl) {
      assert.deepEqual([...OPERATIONS], ["run"]);
      assert.deepEqual([...SEVERITIES], ["ok", "info", "warn", "fail"]);
      assert.equal(SEVERITY_WHEN_UNKNOWN, "warn");
      assert.equal(readSeverity("no-such-severity"), "warn");
      assert.equal(readSeverity("fail"), "fail");
      assert.equal(MESSAGE_TEMPLATE_CAP_BYTES, 200);
      assert.ok(Buffer.byteLength(SAMPLE_CHECK.messageTemplate, "utf8") <= 200);
      // A sample check registered from the test tree appears in the output.
      const register = operationOf(impl, "register") as (c: unknown) => void;
      const registered = operationOf(impl, "registered") as () => readonly DoctorCheck[];
      const run = operationOf(impl, "run") as (
        i: unknown,
      ) => Promise<readonly Record<string, unknown>[]>;
      if (!registered().some((c) => c.id === SAMPLE_CHECK.id)) register(SAMPLE_CHECK);
      assert.ok(registered().some((c) => c.id === SAMPLE_CHECK.id));
      const findings = await run({ context: { present: true }, flags: {} });
      const sample = findings.find((f) => f["id"] === SAMPLE_CHECK.id);
      assert.ok(sample !== undefined, "the sample check appears in the output");
      assert.equal(sample["severity"], "ok");
      assert.equal(sample["lb"], true);
      assert.equal(sample["evidence"], "(redacted)");
      // With `lb` set the check is one of the launch checks, which are exactly
      // the `lb` subset, so the doctor and a launch cannot disagree.
      const lb = launchChecks(registered());
      assert.deepEqual(
        lb.map((c) => c.id),
        registered()
          .filter((c) => c.lb)
          .map((c) => c.id),
      );
      assert.ok(lb.some((c) => c.id === SAMPLE_CHECK.id));
      // The `--json` output follows the schema of §G.7.
      const asFindings = findings.map((f) => ({
        id: String(f["id"]),
        severity: readSeverity(f["severity"]),
        lb: f["lb"] === true,
        message: String(f["message"]),
        fix: String(f["fix"]),
        evidence: String(f["evidence"]),
      }));
      const json = {
        schema: SCHEMA_ID,
        at: "2026-10-01T00:00:00.000Z",
        host: "cli",
        audience: "personal",
        exit: 0,
        summary: summaryOf(asFindings),
        findings: asFindings,
      };
      assert.equal(isDoctorFindings(json), true);
      assert.equal(summaryOf(asFindings).ok, 1);
      // A probe that times out gives a warning with the message of §G.7.
      const timedOut = await run({ context: { timeout: true }, flags: {} });
      const warned = timedOut.find((f) => f["id"] === SAMPLE_CHECK.id);
      assert.equal(warned?.["severity"], "warn");
      assert.equal(warned?.["message"], PROBE_TIMED_OUT_MESSAGE);
      assert.equal(EXIT_WHEN_A_CHECK_THROWS, 1);
      assert.equal(CRITIC_DIVERSITY_WARNING_IS_LB, false);
      assert.equal(UNKNOWN_CHECK_ID_IN_A_FILTER_EXIT_CODE, 3);
      assert.equal(CATALOGUE_SIZE, 44);
      assert.equal(AS_IS_LAUNCH_CHECKS.length, 6);
      assert.equal(HARNESS_CHECK_ID_FORM, "harness.<id>.<check>");
      assert.equal(REGISTRATION_CALL_LIVES_IN, "@specstride/kernel");
      assert.equal(CORE_GUARANTEES.length, 4);
      assert.equal(IMPLEMENTATION_GUARANTEES.length, 6);
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-14/operations-exist",
      "EP-14/closed-result-sets",
      "EP-14/degradation",
      "EP-14/unknown-value-rule",
      "EP-14/behaviour-cases",
    ],
    {
      resultSets: [
        {
          operation: "run",
          members: [
            (v: unknown) =>
              Array.isArray(v) &&
              v.every((f) => SEVERITIES.includes((f as { severity: string }).severity as never)),
          ],
          calls: [
            [{ context: { present: true }, flags: {} }],
            [{ context: { present: false }, flags: {} }],
            [{ context: { timeout: true }, flags: {} }],
          ],
        },
      ],
      throwingOperation: "run",
    },
  ),
  ...named,
]);

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
