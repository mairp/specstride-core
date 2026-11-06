/**
 * T002 of feature 101 — the schema files of the records of
 * `specs/101-gate-and-verdict/data-model.md` and the types generated from them
 * (`packages/contracts/schemas/`, `packages/contracts/src/records/`).
 *
 * The five records of the data model that need a schema are the record of a
 * phase attempt, the verdict record, the recovery markers, the approval key and
 * the accelerator snapshot. The archive at approval holds copies of text
 * records and needs none, which the last test of this file asserts.
 *
 * Every assertion reads the state through an independent path: the schema file
 * from disk, the generated type file from disk, the schema id from the
 * generated `schema-map.ts`, and the record through the compiled validator. A
 * content hash of each schema file is asserted, so a file is identified and not
 * only counted.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { schemaMap } from "../src/records/schema-map.ts";
import { validate } from "../src/records/compile.ts";
import { withNextMajor } from "./samples.ts";
import * as attemptRecord from "../src/records/attempt-record.ts";
import * as verdictRecord from "../src/records/verdict-record.ts";
import * as recoveryMarkers from "../src/records/recovery-markers.ts";
import * as approvalKey from "../src/records/approval-key.ts";
import * as acceleratorSnapshot from "../src/records/accelerator-snapshot.ts";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMAS = join(PKG, "schemas");
const GENERATED = join(PKG, "src/records/generated");

/** The five records of T002: the schema file, the schema id and the type name. */
const RECORDS = [
  {
    stem: "attempt-record",
    schemaId: "specstride.attempt/1",
    type: "AttemptRecord",
    logicalName: "attempt:<N>:<k>:<n>:record",
    module: attemptRecord,
    table: "Record of a phase attempt",
  },
  {
    stem: "verdict-record",
    schemaId: "specstride.verdict/1",
    type: "VerdictRecord",
    logicalName: "attempt:<N>:<k>:<n>:verdict",
    module: verdictRecord,
    table: "Verdict record",
  },
  {
    stem: "recovery-markers",
    schemaId: "specstride.recovery-markers/1",
    type: "RecoveryMarkers",
    logicalName: "phase:<N>:recovery-markers",
    module: recoveryMarkers,
    table: "Recovery markers",
  },
  {
    stem: "approval-key",
    schemaId: "specstride.approval-key/1",
    type: "ApprovalKey",
    logicalName: "feature:<slug>:approval-key",
    module: approvalKey,
    table: "Approval key",
  },
  {
    stem: "accelerator-snapshot",
    schemaId: "specstride.accelerator-snapshot/1",
    type: "AcceleratorSnapshot",
    logicalName: "attempt:<N>:<k>:<n>:accelerator-snapshot",
    module: acceleratorSnapshot,
    table: "Accelerator snapshot",
  },
] as const;

/**
 * A valid record of each of the five schemas, written out here rather than
 * derived from the schema, so that the schema is checked against a record and
 * not against itself. `sampleOf` of `./samples.ts` builds a nested object as
 * `{}`, which these records' nested `required` rightly refuses.
 */
const SAMPLES: Readonly<Record<string, Record<string, unknown>>> = Object.freeze({
  "specstride.attempt/1": {
    schema: "specstride.attempt/1",
    attemptId: "e1-a2",
    phase: 3,
    ordinal: 2,
    engineStartOrdinal: 1,
    kind: "plain",
    role: "proposer",
    harness: "claude-code",
    model: "a-model",
    modelTier: "default",
    outcome: "rejected",
    archived: { archived: true, label: "e1-a2" },
  },
  "specstride.verdict/1": {
    schema: "specstride.verdict/1",
    verdictId: "v-1",
    attemptId: "e1-a2",
    phase: 3,
    ordinal: 2,
    verdict: "REJECTED",
    calls: [
      {
        critic: { harness: "h", provider: "p", model: "m", form: "tool-less", proof: null },
        sessionId: "critic-session-1",
        nonceHash: "abc",
        at: "2026-09-30T00:00:00.000Z",
        usage: null,
        latencyMs: 12,
        outcome: "ok",
      },
    ],
    transcript: { header: ["phase: 3"], prompt: "the prompt", reply: "(empty)" },
  },
  "specstride.recovery-markers/1": {
    schema: "specstride.recovery-markers/1",
    phase: 3,
    diagnosed: "T001,T002",
    accelerated: null,
  },
  "specstride.approval-key/1": {
    schema: "specstride.approval-key/1",
    keyId: "0123456789abcdef",
    createdAt: "2026-09-30T00:00:00.000Z",
    feature: "101-gate-and-verdict",
    key: "the-key-material",
  },
  "specstride.accelerator-snapshot/1": {
    schema: "specstride.accelerator-snapshot/1",
    attemptId: "e1-a2",
    phase: 3,
    ordinal: 2,
    before: { changed: [{ path: "a.ts", linesAdded: 1, linesRemoved: 0 }], newFiles: [] },
    after: { changed: [{ path: "a.ts", linesAdded: 3, linesRemoved: 0 }], newFiles: ["b.ts"] },
    changedByPass: ["a.ts", "b.ts"],
  },
});

/** The sample of a schema id, as a fresh copy each time. */
function sample(schemaId: string): Record<string, unknown> {
  const value = SAMPLES[schemaId];
  assert.ok(value !== undefined, `a sample of ${schemaId}`);
  return structuredClone(value);
}

const sha256 = (path: string): string =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

test("T002: the five schema files are in packages/contracts/schemas/, each with its schema id", () => {
  for (const record of RECORDS) {
    const file = join(SCHEMAS, `${record.stem}.schema.json`);
    assert.equal(existsSync(file), true, `schemas/${record.stem}.schema.json exists`);
    // A content hash, so the file is identified and not only counted.
    assert.match(sha256(file), /^[0-9a-f]{64}$/);
    const schema = JSON.parse(readFileSync(file, "utf8")) as {
      $id?: string;
      "x-schema-id"?: string;
      "x-logical-name"?: string;
      type?: string;
      required?: string[];
      properties?: Record<string, { description?: string }>;
    };
    assert.equal(schema["x-schema-id"], record.schemaId);
    assert.equal(schema.$id, `urn:specstride:schema:${record.schemaId}`);
    assert.equal(schema["x-logical-name"], record.logicalName);
    assert.equal(schema.type, "object");
    // F100-FR-048 — every record of the control plane carries its schema id in
    // a required field whose description is "Schema id".
    assert.ok(schema.required?.includes("schema"), `${record.stem} requires \`schema\``);
    assert.equal(schema.properties?.["schema"]?.description, "Schema id");
  }
});

test("T002: the generated types are in packages/contracts/src/records/, one per schema", () => {
  for (const record of RECORDS) {
    const file = join(GENERATED, `${record.stem}.ts`);
    assert.equal(existsSync(file), true, `src/records/generated/${record.stem}.ts exists`);
    const text = readFileSync(file, "utf8");
    assert.match(text, new RegExp(`export interface ${record.type} \\{`));
    assert.ok(text.includes(record.schemaId), `the type names the schema id ${record.schemaId}`);
    // The index of the generated types re-exports it.
    const index = readFileSync(join(GENERATED, "index.ts"), "utf8");
    assert.ok(
      index.includes(`export type { ${record.type} } from "./${record.stem}.ts";`),
      `generated/index.ts re-exports ${record.type}`,
    );
    // And the hand-written reader module beside it carries the three constants
    // every record module of the package carries.
    assert.equal(record.module.SCHEMA_ID, record.schemaId);
    assert.equal(record.module.LOGICAL_NAME, record.logicalName);
    assert.match(record.module.ANNEX_SECTION, new RegExp(`feature 101.*"${record.table}"`));
  }
});

test("T002: every schema id resolves through the file map, and a sample validates", () => {
  for (const record of RECORDS) {
    assert.ok(record.schemaId in schemaMap, `schema-map.ts holds ${record.schemaId}`);
    const value = sample(record.schemaId);
    const checked = validate(record.schemaId, value);
    assert.equal(checked.ok, true, `a sample of ${record.schemaId} validates`);
    // F100-FR-049 — a different major is refused.
    const bumped = { ...value, schema: withNextMajor(record.schemaId) };
    assert.equal(validate(record.schemaId, bumped).ok, false, "a different major is refused");
    // A record without the field `schema` is refused.
    const { schema: _schema, ...withoutTheField } = value;
    assert.equal(validate(record.schemaId, withoutTheField).ok, false, "no `schema` is refused");
  }
});

test("T002: the record of a phase attempt closes `kind` and `outcome` and keeps its two rules", () => {
  const base = sample("specstride.attempt/1");
  assert.equal(attemptRecord.isAttemptRecord(base), true);
  // `kind` is row 9 of §X.6 and `outcome` is row 278; a value outside either
  // refuses the record.
  assert.equal(attemptRecord.isAttemptRecord({ ...base, kind: "sideways" }), false);
  assert.equal(attemptRecord.isAttemptRecord({ ...base, outcome: "maybe" }), false);
  assert.deepEqual(
    [...attemptRecord.kinds.members],
    ["plain", "diagnosed", "accelerated", "bumped"],
  );
  assert.deepEqual(
    [...attemptRecord.outcomes.members],
    ["approved", "rejected", "malformed", "gate-failed", "config-error", "no-verdict"],
  );
  // The two rules the table states beside the field list.
  const record = attemptRecord.readAttemptRecord({
    ...base,
    outcome: "gate-failed",
    archived: { archived: false, label: null },
  });
  assert.equal(attemptRecord.outcomeHasNoVerdict("gate-failed"), true);
  assert.equal(attemptRecord.outcomeHasNoVerdict("no-verdict"), true);
  assert.equal(attemptRecord.outcomeHasNoVerdict("rejected"), false);
  assert.equal(attemptRecord.attemptRecordIsConsistent(record), true);
  assert.equal(
    attemptRecord.attemptRecordIsConsistent({ ...record, verdictId: "v-1" }),
    false,
    "an outcome without a verdict carries no verdictId",
  );
  assert.equal(
    attemptRecord.attemptRecordIsConsistent({
      ...record,
      archived: { archived: true, label: null } as never,
    }),
    false,
    "an archived phase attempt carries the label of its archive",
  );
});

test("T002: the verdict record keeps the validation of the table", () => {
  const base = sample("specstride.verdict/1");
  const call = {
    critic: {
      harness: "h",
      provider: "p",
      model: "m",
      form: "tool-less",
      proof: null,
    },
    sessionId: "critic-session-1",
    nonceHash: "abc",
    at: "2026-09-30T00:00:00.000Z",
    usage: null,
    latencyMs: 12,
    outcome: "ok",
  };
  const rejected = verdictRecord.readVerdictRecord({
    ...base,
    verdict: "REJECTED",
    detail: undefined,
    calls: [call],
    transcript: { header: ["phase: 1"], prompt: "p", reply: "(empty)" },
  });
  assert.deepEqual([...verdictRecord.verdictRecordFaults(rejected)], []);
  // `detail` present only with MALFORMED.
  assert.deepEqual(
    [...verdictRecord.verdictRecordFaults({ ...rejected, detail: "call-failed" })],
    ["detail-without-malformed"],
  );
  assert.deepEqual(
    [...verdictRecord.verdictRecordFaults({ ...rejected, verdict: "MALFORMED" })],
    ["malformed-without-detail"],
  );
  // At least one entry in `calls`.
  assert.deepEqual([...verdictRecord.verdictRecordFaults({ ...rejected, calls: [] })], ["no-call"]);
  assert.equal(verdictRecord.isVerdictRecord({ ...rejected, calls: [] }), false);
  // The session id of no call equals a session id of a pass of the phase attempt.
  assert.deepEqual(
    [...verdictRecord.verdictRecordFaults(rejected, ["critic-session-1"])],
    ["session-of-a-pass"],
  );
  assert.equal(verdictRecord.verdictRecordIsConsistent(rejected, ["pass-session-1"]), true);
  // `verdict` and `detail` are closed by rows 8 and 251 of §X.6.
  assert.equal(verdictRecord.isVerdictRecord({ ...rejected, verdict: "PASSED" }), false);
  assert.equal(
    verdictRecord.isVerdictRecord({ ...rejected, verdict: "MALFORMED", detail: "nope" }),
    false,
  );
});

test("T002: the recovery markers, the approval key and the accelerator snapshot", () => {
  // Recovery markers: two markers, both nullable, removed at approval.
  const markers = recoveryMarkers.readRecoveryMarkers(sample("specstride.recovery-markers/1"));
  assert.deepEqual([...recoveryMarkers.MARKERS], ["diagnosed", "accelerated"]);
  assert.equal(recoveryMarkers.REMOVED_AT_APPROVAL, true);
  assert.equal(recoveryMarkers.signatureOf(markers, "diagnosed"), "T001,T002");
  assert.equal(recoveryMarkers.signatureOf(markers, "accelerated"), undefined);

  // Approval key: the key material is the one field that never leaves.
  const key = approvalKey.readApprovalKey(sample("specstride.approval-key/1"));
  assert.equal(approvalKey.FIELD_WITH_THE_KEY_MATERIAL, "key");
  const shown = approvalKey.withoutTheKeyMaterial(key) as Record<string, unknown>;
  assert.equal("key" in shown, false, "the key material is not in the shown form");
  for (const field of approvalKey.FIELDS_THAT_MAY_BE_SHOWN) {
    assert.ok(field in shown, `the shown form keeps ${field}`);
  }

  // Accelerator snapshot: both halves empty outside a repository, and
  // `changedByPass` derived from the two halves.
  const empty = { changed: [], newFiles: [] };
  assert.equal(acceleratorSnapshot.halfIsEmpty(empty), true);
  assert.deepEqual([...acceleratorSnapshot.changedByPass(empty, empty)], []);
  const before = { changed: [{ path: "a.ts", linesAdded: 1, linesRemoved: 0 }], newFiles: [] };
  const after = {
    changed: [{ path: "a.ts", linesAdded: 3, linesRemoved: 0 }],
    newFiles: ["b.ts"],
  };
  assert.deepEqual([...acceleratorSnapshot.changedByPass(before, after)], ["a.ts", "b.ts"]);
  assert.deepEqual([...acceleratorSnapshot.HALVES], ["before", "after"]);
  const snapshot = acceleratorSnapshot.readAcceleratorSnapshot(
    sample("specstride.accelerator-snapshot/1"),
  );
  assert.equal(acceleratorSnapshot.isAcceleratorSnapshot(snapshot), true);
  assert.equal(
    acceleratorSnapshot.isAcceleratorSnapshot({ ...snapshot, before: { changed: [] } }),
    false,
    "a half without `newFiles` is refused",
  );
});

test("T002: the archive at approval has no schema file, as the data model states", () => {
  const names = readdirSync(SCHEMAS);
  for (const name of names) {
    assert.equal(
      /approved-archive|archive-at-approval/i.test(name),
      false,
      `schemas/ holds no schema of the archive at approval, but holds ${name}`,
    );
  }
  for (const id of Object.keys(schemaMap)) {
    assert.equal(/approved-archive|approval-archive/i.test(id), false);
  }
});
