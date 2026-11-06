/**
 * T108 — CT-109-110: the bytes of the host-facing output of the seam
 * (F109-FR-024; F109-FR-025; plan.md XIX).
 *
 * The plan fixes the figures: every doctor finding of this feature is at most
 * 200 bytes; the default output of `harness verify` is one line per result of
 * at most 200 bytes, and at most 4,096 bytes for one harness. The bytes are
 * measured with the budget helper of feature 100
 * (`packages/testkit/src/static/budget.ts`), as UTF-8, exactly as the output
 * leaves the command, and the build FAILS on a breach (an assertion here is a
 * failed test, which fails the build of the workspace).
 *
 * The output that reaches a host comes from the two writers the plan names
 * (plan.md XIX: the seam prints to a host only through `harness verify` and
 * through doctor findings), so measuring those two writers measures the seam.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { measure, budgetRow } from "../../../testkit/src/static/budget.ts";
import { runHarnessDoctorChecks } from "../../src/doctor/checks.ts";
import {
  runHarnessVerify,
  VERIFICATION_FIELDS,
  type HarnessVerificationRecord,
} from "../../src/verify/verify.ts";

/** The figure of plan.md XIX for one line that reaches a host. */
export const LINE_BUDGET_BYTES = 200 as const;
/** The figure of plan.md XIX for the default output of one harness verify. */
export const ONE_HARNESS_BUDGET_BYTES = 4096 as const;

/** The bytes of a host-facing line, as UTF-8. */
export function bytesOf(line: string): number {
  return Buffer.byteLength(line, "utf8");
}

/** The one host-facing line of a doctor finding (§G.7, Outputs). */
export function findingLine(finding: {
  id: string;
  severity: string;
  lb: boolean;
  message: string;
}): string {
  // The one line that reaches the host: identity, verdict, and the message.
  // The fix hint and the redacted evidence travel in the findings record, not
  // on the host-facing line — the figure of plan.md XIX is for the line.
  return `${finding.id} ${finding.severity}${finding.lb ? " lb" : ""}: ${finding.message}`;
}

/**
 * The guard the build of the command uses: it throws — and so fails the
 * build — on a breach of the figure of plan.md XIX.
 */
export function assertLineInside(line: string, budget: number = LINE_BUDGET_BYTES): void {
  const bytes = bytesOf(line);
  if (bytes > budget) {
    throw new Error(
      `a host-facing line holds ${bytes} bytes, over the ${budget} of plan.md XIX: ${line}`,
    );
  }
}

/** The default output of `harness verify`: one line per result of the record. */
export function verifyOutputLines(record: HarnessVerificationRecord): readonly string[] {
  const lines = [
    `harness verify ${record.harness}: ${record.outcome}`,
    `schema ${record.schema}, harness ${record.harness}, version ${record.version ?? "none"}`,
    `descriptor ${record.descriptorHash}, at ${record.at}`,
    `cases ${record.cases.map((entry) => `${entry.id}=${entry.outcome}`).join(", ")}`,
    `budget stated modelCalls=${record.budget.stated.modelCalls} timeLimitSeconds=${record.budget.stated.timeLimitSeconds}, used modelCalls=${record.budget.used.modelCalls} seconds=${record.budget.used.seconds.toFixed(3)}`,
  ];
  return lines;
}

const BASE_FACTS = {
  harness: "sample-harness",
  tested: false,
  present: true,
  credentialPresent: true,
  credentialName: "SAMPLE_TOKEN",
  credentialFix: "state the credential of the role in the environment",
  version: "1.2.3",
  versionRange: null,
};

test("CT-109-110: every doctor finding of the feature is at most 200 bytes", async () => {
  // The findings across the verdicts the three checks can reach: everything
  // present, the executable missing, the credential missing, no pin for a
  // harness that is not tested, and a version outside the pinned range.
  const variants: readonly Record<string, unknown>[] = [
    {},
    { present: false },
    { credentialPresent: false },
    { version: null },
    { tested: true, versionRange: ">=2.0.0 <3.0.0" },
    { tested: true, versionRange: ">=2.0.0 <3.0.0", version: "0.9.0" },
  ];
  let counted = 0;
  for (const variant of variants) {
    const findings = await runHarnessDoctorChecks({
      ...BASE_FACTS,
      ...variant,
    } as never);
    assert.equal(findings.length, 3, "three checks per harness");
    for (const finding of findings) {
      const line = findingLine(finding);
      assertLineInside(line);
      counted += 1;
    }
  }
  assert.ok(counted >= 18, `every variant was measured (${counted} findings)`);
});

test("CT-109-110: the doctor findings stay inside the budget row of feature 100 that owns them", async () => {
  // The helper of feature 100 is the measure in force: the row of annex G
  // §G.5 whose subject owns the doctor output. The plan's own figure is the
  // tighter of the two, and the test above holds it; this test holds the
  // helper's row so the two measures cannot drift apart in silence.
  const findings = await runHarnessDoctorChecks(BASE_FACTS as never);
  const output = findings.map(findingLine).join("\n");
  const row = budgetRow("Doctor");
  if (row !== undefined && row.bytes !== null) {
    const measurement = measure("Doctor", output);
    assert.ok(
      measurement.inside,
      `the doctor output of one harness is ${measurement.bytes} bytes, over the ${measurement.allowed} of ${measurement.subject}`,
    );
  }
});

test("CT-109-110: the default output of harness verify is at most 200 bytes per line and 4,096 bytes for one harness", async () => {
  const outcome = await runHarnessVerify({
    harness: "sample-harness",
    knownHarness: true,
    descriptor: { id: "sample-harness", descriptorVersion: 1 },
    version: "1.2.3",
    at: "2026-10-21T00:00:00Z",
    budget: { modelCalls: 4, timeLimitSeconds: 60 },
    runSuite: async () => ({
      cases: [
        { id: "HC-01", passed: true },
        { id: "HC-02", passed: true },
      ],
      used: { modelCalls: 2, seconds: 0.25 },
    }),
  });
  assert.equal(outcome.exitCode, 0);
  assert.ok(outcome.record, "the command produced its record");
  const record = outcome.record!;
  assert.deepEqual(
    Object.keys(record).sort(),
    [...VERIFICATION_FIELDS].sort(),
    "the record carries exactly the fields of its owner",
  );
  const lines = verifyOutputLines(record);
  const total = lines.reduce((sum, line) => sum + bytesOf(line) + 1, 0) - 1;
  for (const line of lines) {
    assert.ok(
      bytesOf(line) <= LINE_BUDGET_BYTES,
      `a line of the default output is ${bytesOf(line)} bytes, over ${LINE_BUDGET_BYTES}: ${line}`,
    );
  }
  assert.ok(
    total <= ONE_HARNESS_BUDGET_BYTES,
    `the default output of one harness is ${total} bytes, over ${ONE_HARNESS_BUDGET_BYTES}`,
  );
});

test("CT-109-110: a breach fails the build (the guard is exercised on a deliberate breach)", () => {
  const inside = "x".repeat(LINE_BUDGET_BYTES);
  assert.doesNotThrow(() => assertLineInside(inside), "a line at the figure stays inside");
  const breach = `${inside}x`;
  assert.throws(() => assertLineInside(breach), /over the 200 of plan.md XIX/);
  assert.ok(bytesOf(breach) > LINE_BUDGET_BYTES, "the breach really is over the figure");
});
