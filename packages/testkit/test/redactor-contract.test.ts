/**
 * T199 — contract tests CT-100-305 and CT-100-306 for the redactor (annex X,
 * §X.4; F100-FR-205, F100-FR-206), over the key `redactor` of
 * `data/kernel-operations.json` and `schemas/redaction-pattern-set.schema.json`.
 *
 * The interface is the one of T200; the implementation under test is the stub of
 * T284, which is the weakest the interface allows. The redactor itself belongs
 * to feature 111.
 */
import test from "node:test";
import assert from "node:assert/strict";
import kernelOperations from "@specstride/contracts/data/kernel-operations.json" with { type: "json" };
import schema from "@specstride/contracts/schemas/redaction-pattern-set.schema.json" with { type: "json" };
import {
  ANNEX_SECTION,
  A_HIT_BLOCKS_THE_COMMIT,
  CONTENT_OWNER,
  FAILS_CLOSED,
  ONE_POINT_OF_REDACTION,
  OPERATIONS,
  PATTERN_LISTS,
  PRE_COMMIT_EVENT_TYPE,
  REPLACES,
  SCAN_LOOKS_FOR,
  SCAN_SUBJECT,
  SCHEMA_ID,
  SINKS,
  SUBJECT,
  THE_COMMENT_PASSES_THE_REDACTOR,
  VALUE_PATTERNS_COVER,
  VERSION_IS_RECORDED_IN,
  WHEN_IT_CANNOT_RUN,
  isRedactionPatternSet,
  operationOf,
  readRedactionPatternSet,
  redactorOperations,
  tryReadRedactionPatternSet,
} from "@specstride/contracts/ep/redactor";
import { RecordRefusedError } from "@specstride/contracts/records/validate";
import {
  REPLACEMENT,
  STUB_PATTERN_SET_VERSION,
  createStubPreCommitScan,
  createStubRedactor,
} from "../src/canary/stub-redactor.ts";

/** A valid sample of the pattern set: the four required fields of §X.4. */
const sample = Object.freeze({
  schema: SCHEMA_ID,
  version: "2026.10.01",
  keyNames: ["(?i)token", "(?i)secret"],
  values: ["-----BEGIN [A-Z ]*PRIVATE KEY-----"],
});

test("CT-100-305: the two operations of the redactor, from the kernel table (§X.4)", () => {
  assert.equal(ANNEX_SECTION, "annex X, §X.4");
  assert.equal(CONTENT_OWNER, "111");
  const raw = (kernelOperations as { redactor: unknown[] }).redactor;
  assert.equal(redactorOperations.length, raw.length);
  assert.deepEqual([...OPERATIONS], ["register", "redact"]);
  assert.deepEqual(
    redactorOperations.map((o) => o.operation),
    [...OPERATIONS],
  );
  assert.match(operationOf("register")?.input ?? "", /secret value that the runtime resolved/);
  assert.match(operationOf("register")?.output ?? "", /matched exactly from then on/);
  assert.match(operationOf("redact")?.input ?? "", /a size cap/);
  assert.match(operationOf("redact")?.output ?? "", /how many replacements were made/);
  assert.match(operationOf("redact")?.output ?? "", /version of the pattern set/);
  assert.equal(operationOf("scan"), undefined, "the table holds two operations and no more");
});

test("CT-100-305: the pattern set validates, and a different major is refused (§X.4)", () => {
  assert.equal(SCHEMA_ID, "specstride.redaction/1");
  assert.equal((schema as { "x-schema-id": string })["x-schema-id"], SCHEMA_ID);
  assert.ok(isRedactionPatternSet(sample));
  assert.deepEqual(readRedactionPatternSet(sample), sample);
  assert.equal(tryReadRedactionPatternSet(sample).ok, true);

  // Every required field of the table of §X.4.
  const required = (schema as { required?: string[] }).required ?? [];
  assert.deepEqual([...required], ["schema", "version", "keyNames", "values"]);
  for (const field of required) {
    const without: Record<string, unknown> = { ...sample };
    delete without[field];
    assert.equal(isRedactionPatternSet(without), false, `${field} must be required`);
  }
  assert.deepEqual([...PATTERN_LISTS], ["keyNames", "values"]);
  assert.equal(VALUE_PATTERNS_COVER.length, 5);
  assert.equal(VERSION_IS_RECORDED_IN, "the run record");

  // A different major is refused with both majors.
  assert.throws(
    () => readRedactionPatternSet({ ...sample, schema: "specstride.redaction/2" }),
    (err: unknown) => {
      assert.ok(err instanceof RecordRefusedError);
      assert.equal(err.reason, "different-major");
      assert.match(err.message, /the major found is 2/);
      assert.match(err.message, /the major supported is 1/);
      return true;
    },
  );
  assert.equal(SUBJECT, "the redaction pattern set (annex X, §X.4)");
});

test("CT-100-305: F100-FR-205 — one point of redaction, every sink, and failing closed", () => {
  assert.equal(ONE_POINT_OF_REDACTION, "the ingress of annex A, F100-FR-009");
  assert.deepEqual([...SINKS], ["event file", "exporters", "digest", "status", "read model"]);
  assert.equal(REPLACES.length, 2);
  assert.equal(THE_COMMENT_PASSES_THE_REDACTOR, true);
  assert.equal(FAILS_CLOSED, true);
  assert.equal(WHEN_IT_CANNOT_RUN.contentIsDropped, true);
  assert.equal(WHEN_IT_CANNOT_RUN.theRecordSaysSo, true);

  // The stub of T284 against the interface of T200: exact values registered,
  // replaced everywhere they occur, nothing else.
  const redactor = createStubRedactor();
  redactor.register("sk-LIVE-0001");
  redactor.register("second-secret");
  const result = redactor.redact(
    "the key sk-LIVE-0001 and again sk-LIVE-0001, plus second-secret, and a plain word",
    4096,
  );
  assert.ok(!result.text.includes("sk-LIVE-0001"));
  assert.ok(!result.text.includes("second-secret"));
  assert.equal(result.replacements, 3, "every occurrence, not only the first");
  assert.match(result.text, /a plain word/, "nothing else is replaced");
  assert.equal(result.text.split(REPLACEMENT).length - 1, 3);
  assert.equal(result.patternSetVersion, STUB_PATTERN_SET_VERSION);
  assert.deepEqual([...redactor.registered()], ["sk-LIVE-0001", "second-secret"]);

  // The size cap cuts the text.
  const cut = redactor.redact("x".repeat(100), 10);
  assert.equal(cut.text.length, 10);

  // A redactor that cannot run drops the content and says so.
  redactor.breakTheRedactor("the pattern set could not be read");
  const dropped = redactor.redact("the key sk-LIVE-0001", 4096);
  assert.equal(dropped.text, "");
  assert.equal(dropped.dropped, true);
  assert.equal(dropped.reason, "the pattern set could not be read");
  redactor.reset();
  assert.deepEqual([...redactor.registered()], []);
});

test("CT-100-306: the scan before a commit blocks it and raises an event (F100-FR-206)", () => {
  assert.equal(SCAN_SUBJECT, "the files of the commit that the runtime wrote");
  assert.deepEqual([...SCAN_LOOKS_FOR], ["registered secrets", "the patterns"]);
  assert.equal(A_HIT_BLOCKS_THE_COMMIT, true);
  assert.equal(PRE_COMMIT_EVENT_TYPE, "integrity.secret_in_commit");

  const redactor = createStubRedactor();
  redactor.register("sk-LIVE-0002");
  const scan = createStubPreCommitScan({
    redactor,
    files: [
      { path: "src/clean.ts", text: "export const x = 1;\n" },
      { path: "src/dirty.ts", text: "const key = 'sk-LIVE-0002';\n" },
      { path: "src/pattern.ts", text: "-----BEGIN RSA PRIVATE KEY-----\n" },
    ],
    patterns: [{ name: "private-key-block", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ }],
  });

  // A clean commit passes and raises no event.
  const clean = scan.scan(["src/clean.ts"]);
  assert.deepEqual([...clean.hits], []);
  assert.equal(clean.blocked, false);
  assert.equal(clean.event, undefined);

  // A registered secret in a file the runtime wrote blocks the commit.
  const secret = scan.scan(["src/clean.ts", "src/dirty.ts"]);
  assert.equal(secret.blocked, true);
  assert.equal(secret.hits.length, 1);
  assert.equal(secret.hits[0]?.file, "src/dirty.ts");
  assert.equal(secret.hits[0]?.line, 1);
  assert.equal(secret.hits[0]?.matched, "registered-secret");
  assert.equal(secret.event?.type, PRE_COMMIT_EVENT_TYPE);
  assert.equal(secret.event?.fileCount, 1);

  // A pattern of the set blocks it too, and the hit names the pattern.
  const pattern = scan.scan(["src/pattern.ts"]);
  assert.equal(pattern.blocked, true);
  assert.equal(pattern.hits[0]?.matched, "pattern");
  assert.equal(pattern.hits[0]?.pattern, "private-key-block");
  // A file the runtime did not write is not scanned.
  assert.equal(scan.scan(["src/not-written-by-the-runtime.ts"]).blocked, false);
});
