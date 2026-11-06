/**
 * T097 — CT-109-25: the command `harness verify` (F109-FR-025).
 *
 * Exits 0, 2 and 3; refuses without a budget; stores the result at
 * `user:harness-verify:<id>` as the record `specstride.harness-verify/1` with
 * exactly the eight fields of the owner; the record validates against the
 * schema of its owner; a changed version or hash ends the validity.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import {
  VERIFICATION_FIELDS,
  VERIFICATION_SCHEMA_ID,
  VERIFY_EXIT_FAILED,
  VERIFY_EXIT_OK,
  VERIFY_EXIT_USAGE,
  descriptorHashOf,
  parseBudget,
  readVerification,
  runHarnessVerify,
  storeVerification,
  validateVerificationRecord,
  verificationHolds,
  verificationPath,
  type HarnessVerificationRecord,
} from "../../src/verify/verify.ts";

const DESCRIPTOR = Object.freeze({
  descriptorVersion: 1,
  id: "example-cli",
  kind: "cli",
  versionRange: ">=1.0.0 <2.0.0",
  verifiedOn: "2026-10-01",
});

const BUDGET = { modelCalls: 4, timeLimitSeconds: 60 };

function passingSuite() {
  return Promise.resolve({
    cases: [
      { id: "HC-01", passed: true },
      { id: "HC-02", passed: true },
    ],
    used: { modelCalls: 2, seconds: 3 },
  });
}

const OWNER_SCHEMA_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "..",
  "specs",
  "146-harness-discovery",
  "contracts",
  "schemas",
  "harness-verify-result.schema.json",
);

/**
 * Evaluate the owner's schema against a record. The owner schema uses exactly
 * `type`, `required`, `properties.schema.const` and `additionalProperties`;
 * this evaluates those keywords as they are written, from the schema file of
 * the owner itself.
 */
function validateAgainstOwnerSchema(record: unknown): readonly string[] {
  const schema = JSON.parse(readFileSync(OWNER_SCHEMA_PATH, "utf8")) as {
    required?: readonly string[];
    properties?: Record<string, { const?: string }>;
    additionalProperties?: boolean;
  };
  const errors: string[] = [];
  if (typeof record !== "object" || record === null) return ["not an object"];
  const raw = record as Record<string, unknown>;
  for (const name of schema.required ?? []) {
    if (!(name in raw)) errors.push(`missing required field \`${name}\``);
  }
  const schemaConst = schema.properties?.schema?.const;
  if (schemaConst !== undefined && raw.schema !== schemaConst) {
    errors.push(`\`schema\` must carry the constant "${schemaConst}"`);
  }
  if (schema.additionalProperties === false) {
    for (const name of Object.keys(raw)) {
      if (!(name in (schema.properties ?? {}))) {
        errors.push(`unknown field \`${name}\``);
      }
    }
  }
  return errors;
}

test("CT-109-25: exits 0 when the suite passed, 2 when a case failed or the budget ran out", async () => {
  const ok = await runHarnessVerify({
    harness: "example-cli",
    knownHarness: true,
    descriptor: DESCRIPTOR,
    version: "1.4.2",
    at: "2026-10-21T00:00:00.000Z",
    budget: BUDGET,
    runSuite: passingSuite,
  });
  assert.equal(ok.exitCode, VERIFY_EXIT_OK);
  assert.equal(ok.record?.outcome, "passed");

  const failed = await runHarnessVerify({
    harness: "example-cli",
    knownHarness: true,
    descriptor: DESCRIPTOR,
    version: "1.4.2",
    at: "2026-10-21T00:00:00.000Z",
    budget: BUDGET,
    runSuite: () =>
      Promise.resolve({
        cases: [
          { id: "HC-01", passed: true },
          { id: "HC-13", passed: false },
        ],
        used: { modelCalls: 2, seconds: 3 },
      }),
  });
  assert.equal(failed.exitCode, VERIFY_EXIT_FAILED);
  assert.equal(failed.record?.outcome, "failed");
  assert.equal(failed.record?.cases.find((c) => c.id === "HC-13")?.outcome, "failed");

  const overBudget = await runHarnessVerify({
    harness: "example-cli",
    knownHarness: true,
    descriptor: DESCRIPTOR,
    version: "1.4.2",
    at: "2026-10-21T00:00:00.000Z",
    budget: { modelCalls: 1, timeLimitSeconds: 60 },
    runSuite: () =>
      Promise.resolve({
        cases: [{ id: "HC-01", passed: true }],
        used: { modelCalls: 2, seconds: 3 },
      }),
  });
  assert.equal(overBudget.exitCode, VERIFY_EXIT_FAILED);
});

test("CT-109-25: exits 3 for an unknown harness, and refuses without a stated budget", async () => {
  const unknown = await runHarnessVerify({
    harness: "no-such-harness",
    knownHarness: false,
    descriptor: DESCRIPTOR,
    version: null,
    at: "2026-10-21T00:00:00.000Z",
    budget: BUDGET,
    runSuite: passingSuite,
  });
  assert.equal(unknown.exitCode, VERIFY_EXIT_USAGE);
  assert.equal(unknown.record, null);

  // Without a budget the command refuses BEFORE the suite runs (exit 3).
  let suiteRan = false;
  const noBudget = await runHarnessVerify({
    harness: "example-cli",
    knownHarness: true,
    descriptor: DESCRIPTOR,
    version: "1.4.2",
    at: "2026-10-21T00:00:00.000Z",
    budget: undefined,
    runSuite: () => {
      suiteRan = true;
      return passingSuite();
    },
  });
  assert.equal(noBudget.exitCode, VERIFY_EXIT_USAGE);
  assert.equal(suiteRan, false);
  assert.match(noBudget.error ?? "", /without a stated budget/);
  for (const bad of [null, {}, { modelCalls: 2 }, { timeLimitSeconds: 60 }, "60s"]) {
    assert.throws(
      () => parseBudget(bad),
      (error: Error) => error.name === "VerifyUsageError",
    );
  }
  assert.deepEqual(parseBudget({ modelCalls: 2, timeLimit: 30 }), {
    modelCalls: 2,
    timeLimitSeconds: 30,
  });
});

test("CT-109-25: the result is stored at user:harness-verify:<id> with exactly the owner's fields", async () => {
  const userState = mkdtempSync(join(tmpdir(), "ct-109-25-"));
  const outcome = await runHarnessVerify({
    harness: "example-cli",
    knownHarness: true,
    descriptor: DESCRIPTOR,
    version: "1.4.2",
    at: "2026-10-21T00:00:00.000Z",
    budget: BUDGET,
    runSuite: passingSuite,
  });
  assert.equal(outcome.exitCode, VERIFY_EXIT_OK);
  assert.ok(outcome.record);
  const path = await storeVerification(userState, outcome.record!);
  assert.equal(path, verificationPath(userState, "example-cli"));
  assert.match(path, /harness-verify[/\\]example-cli\.json$/);

  const stored = await readVerification(path);
  assert.ok(stored);
  // EXACTLY the eight fields, under no other name.
  assert.deepEqual(Object.keys(stored).sort(), [...VERIFICATION_FIELDS].sort());
  assert.equal(stored.schema, VERIFICATION_SCHEMA_ID);
  assert.equal(stored.harness, "example-cli");
  assert.equal(stored.version, "1.4.2");
  assert.equal(stored.descriptorHash, descriptorHashOf(DESCRIPTOR));
  assert.equal(stored.at, "2026-10-21T00:00:00.000Z");
  assert.equal(stored.outcome, "passed");
  assert.equal(stored.cases.length, 2);
  assert.deepEqual(stored.budget.stated, BUDGET);
});

test("CT-109-25: the record validates against the schema of its owner", async () => {
  const record = {
    schema: "specstride.harness-verify/1",
    harness: "example-cli",
    version: "1.4.2",
    descriptorHash: descriptorHashOf(DESCRIPTOR),
    at: "2026-10-21T00:00:00.000Z",
    outcome: "passed",
    cases: [{ id: "HC-01", outcome: "passed" }],
    budget: { stated: BUDGET, used: { modelCalls: 2, seconds: 3 } },
  } satisfies HarnessVerificationRecord;
  // Validated twice: through the writer-side check of this feature, and
  // directly against the schema file of the owner (feature 146).
  assert.deepEqual(validateVerificationRecord(record), { ok: true, record });
  assert.deepEqual(validateAgainstOwnerSchema(record), []);
  // The owner's schema is loaded and it is the owner's.
  const schema = JSON.parse(readFileSync(OWNER_SCHEMA_PATH, "utf8")) as {
    $id: string;
    properties?: Record<string, { const?: string }>;
  };
  assert.equal(schema.$id, "urn:specstride:schema:specstride.harness-verify/1");
  // A record under another name, or without the constant, refuses.
  assert.equal(validateVerificationRecord({ ...record, extra: 1 }).ok, false);
  assert.equal(validateVerificationRecord({ ...record, schema: "specstride.other/1" }).ok, false);
  const { at: _missing, ...withoutAt } = record;
  void _missing;
  assert.equal(validateVerificationRecord(withoutAt).ok, false);
  assert.match(
    validateVerificationRecord(withoutAt).ok
      ? ""
      : (validateVerificationRecord(withoutAt) as { errors: readonly string[] }).errors.join("; "),
    /`at`/,
  );
});

test("CT-109-25: a changed version or descriptor hash ends the validity", () => {
  const record = {
    schema: "specstride.harness-verify/1",
    harness: "example-cli",
    version: "1.4.2",
    descriptorHash: descriptorHashOf(DESCRIPTOR),
    at: "2026-10-21T00:00:00.000Z",
    outcome: "passed",
    cases: [],
    budget: { stated: BUDGET, used: { modelCalls: 0, seconds: 0 } },
  } satisfies HarnessVerificationRecord;
  assert.equal(
    verificationHolds(record, { version: "1.4.2", descriptorHash: record.descriptorHash }),
    true,
  );
  assert.equal(
    verificationHolds(record, { version: "1.5.0", descriptorHash: record.descriptorHash }),
    false,
  );
  assert.equal(
    verificationHolds(record, {
      version: "1.4.2",
      descriptorHash: descriptorHashOf({ ...DESCRIPTOR, displayName: "Changed" }),
    }),
    false,
  );
});
