/**
 * T003 of feature 103 — the three schemas of the pass loop, validated in the
 * build, and the two internal copies compared against the design record
 * (`specs/103-proposer-pass/tasks.md`, T003; F103-FR-001, F103-FR-041).
 *
 * Where each schema lives, and why:
 *
 * | Schema | Place | Why |
 * |---|---|---|
 * | the request of the pass loop | `packages/core/src/pass-loop/pass-loop-request.schema.json` | internal: the pass loop is a CALL, not a command (F100-FR-171), so the record crosses no process and no file boundary |
 * | the result of the pass loop | `packages/core/src/pass-loop/pass-loop-result.schema.json` | internal, as the request |
 * | the handoff | `packages/contracts/schemas/handoff.schema.json` | a FILE boundary: the engine writes it, the proposer reads it through its prompt (F103-FR-041) |
 *
 * The copies in `specs/103-proposer-pass/contracts/` are the design record;
 * this test compares the two internal copies against them byte for byte, so a
 * change to one and not the other fails the build. The handoff is delivered
 * into `@specstride/contracts` by `specs/103-proposer-pass/contracts/
 * deliver.json` (T299 of feature 100), and this test compares the delivered
 * copy against its source the same way.
 *
 * "Validated in the build" is this test: each of the three is compiled by the
 * one schema validator of the product (Ajv 8.20.0, draft 2020-12, the choice
 * of feature 100's research.md D-2), a record that satisfies it is accepted,
 * and a record that breaks one named rule of it is refused. The handoff is
 * compiled a second time THROUGH `@specstride/contracts`, by its schema id, so
 * that the delivery into the package is proved to have reached the file map the
 * lazy validator resolves ids through.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";
import { validatorFor } from "@specstride/contracts/records/compile";
import { SCHEMA_FILES, DIRECTORY, OWNER } from "../src/pass-loop/module.ts";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = resolve(PACKAGE_ROOT, "../..");

/** The design record of the feature: the authority the copies are compared to. */
const DESIGN = "specs/103-proposer-pass/contracts";

/** The three schemas, each with the copy it must equal byte for byte. */
const THE_THREE = [
  {
    what: "the request of the pass loop",
    file: "packages/core/src/pass-loop/pass-loop-request.schema.json",
    source: `${DESIGN}/pass-loop-request.schema.json`,
    id: "urn:specstride:schema:internal:103:pass-loop-request/1",
    internal: true,
    requirement: "F103-FR-001",
  },
  {
    what: "the result of the pass loop",
    file: "packages/core/src/pass-loop/pass-loop-result.schema.json",
    source: `${DESIGN}/pass-loop-result.schema.json`,
    id: "urn:specstride:schema:internal:103:pass-loop-result/1",
    internal: true,
    requirement: "F103-FR-001",
  },
  {
    what: "the handoff",
    file: "packages/contracts/schemas/handoff.schema.json",
    source: `${DESIGN}/schemas/handoff.schema.json`,
    id: "urn:specstride:schema:specstride.handoff/1",
    internal: false,
    requirement: "F103-FR-041",
  },
] as const;

const sha256 = (path: string): string =>
  createHash("sha256")
    .update(readFileSync(join(ROOT, path)))
    .digest("hex");

const schemaOf = (path: string): Record<string, unknown> =>
  JSON.parse(readFileSync(join(ROOT, path), "utf8")) as Record<string, unknown>;

/** A fresh compiler per schema: the formats of the product are recorded, not asserted. */
function compile(schema: Record<string, unknown>): (value: unknown) => boolean {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  for (const format of ["date-time", "uri"]) ajv.addFormat(format, true);
  return ajv.compile(schema) as (value: unknown) => boolean;
}

test("T003: the module group names its two schema files, and they are where it says", () => {
  assert.equal(DIRECTORY, "packages/core/src/pass-loop");
  assert.equal(OWNER, "103");
  assert.deepEqual(
    [...SCHEMA_FILES],
    ["pass-loop-request.schema.json", "pass-loop-result.schema.json"],
  );
  for (const name of SCHEMA_FILES) {
    const schema = schemaOf(`${DIRECTORY}/${name}`);
    assert.equal(schema["$schema"], "https://json-schema.org/draft/2020-12/schema", name);
    assert.match(String(schema["$id"]), /^urn:specstride:schema:internal:103:/, name);
  }
});

test("T003: all three schemas compile with the one validator of the product", () => {
  for (const entry of THE_THREE) {
    const schema = schemaOf(entry.file);
    assert.equal(schema["$id"], entry.id, `${entry.what}: the $id of ${entry.file}`);
    assert.doesNotThrow(() => compile(schema), `${entry.what} compiles (${entry.requirement})`);
  }
});

test("T003: the two internal copies equal the design record byte for byte", () => {
  for (const entry of THE_THREE.filter((e) => e.internal)) {
    assert.equal(
      sha256(entry.file),
      sha256(entry.source),
      `${entry.file} is a byte-for-byte copy of ${entry.source}`,
    );
  }
});

test("T003: the delivered handoff schema equals its source byte for byte", () => {
  const handoff = THE_THREE.find((e) => e.what === "the handoff");
  assert.ok(handoff !== undefined);
  assert.equal(
    sha256(handoff.file),
    sha256(handoff.source),
    `${handoff.file} is the delivered copy of ${handoff.source}`,
  );
  // The delivery itself: `deliver.json` of the feature names the target and
  // the source, and the sync script of feature 100 copies it (its T299).
  const deliver = JSON.parse(readFileSync(join(ROOT, DESIGN, "deliver.json"), "utf8")) as {
    owner: string;
    data: Record<string, string>;
    schemas: Record<string, string>;
  };
  assert.equal(deliver.owner, "103");
  assert.equal(deliver.schemas["handoff.schema.json"], "schemas/handoff.schema.json");
  assert.equal(deliver.data["closed-sets-103.json"], "closed-sets.json");
  // Neither schema of the pass loop is delivered: they cross no boundary.
  for (const name of Object.values(deliver.schemas)) {
    assert.doesNotMatch(name, /pass-loop-(request|result)/);
  }
});

test("T003: the request schema accepts a request and refuses what F103-FR-002 refuses", () => {
  const validate = compile(schemaOf("packages/core/src/pass-loop/pass-loop-request.schema.json"));
  const request = {
    workdir: "/w",
    evidence: "gates/GATE1-EVIDENCE.md",
    standingPrompt: "do the phase",
    harness: "a-harness",
    role: "proposer",
  };
  assert.equal(validate(request), true, "the five required fields are enough");
  assert.equal(validate({ ...request, passLimit: 30, pauseSec: 2, help: false }), true);
  // The five the schema requires.
  for (const key of ["workdir", "evidence", "standingPrompt", "harness", "role"]) {
    const without = { ...request } as Record<string, unknown>;
    delete without[key];
    assert.equal(validate(without), false, `a request without \`${key}\` is refused`);
  }
  // An empty working directory and an empty evidence path (F103-FR-002).
  assert.equal(validate({ ...request, workdir: "" }), false, "an empty workdir is refused");
  assert.equal(validate({ ...request, evidence: "" }), false, "an empty evidence path is refused");
  // A role outside the two, and a field the pass loop does not know.
  assert.equal(validate({ ...request, role: "critic" }), false, "an unknown role is refused");
  assert.equal(
    validate({ ...request, unknownArg: 1 }),
    false,
    "a field the pass loop does not know is refused (`unknown arg: <name>`, F103-FR-002)",
  );
});

test("T003: the result schema holds the code table of annex E §E.4 and the two blocked reasons", () => {
  const schema = schemaOf("packages/core/src/pass-loop/pass-loop-result.schema.json");
  const validate = compile(schema);
  const codes = (schema.properties as { exit_code: { enum: number[] } }).exit_code.enum;
  assert.deepEqual([...codes], [0, 1, 3, 4, 6, 7, 8, 9, 10, 130, 143]);
  for (const code of codes) {
    assert.equal(validate({ exit_code: code }), true, `exit_code ${code} is a result of the loop`);
  }
  // 124 and 127 are statuses of a PASS, not results of the loop.
  for (const code of [124, 127, 2, 5]) {
    assert.equal(
      validate({ exit_code: code }),
      false,
      `exit_code ${code} is no result of the loop`,
    );
  }
  assert.equal(validate({}), false, "a result without `exit_code` is refused");
  // The blocked record: the two reasons the loop itself can report.
  assert.equal(
    validate({ exit_code: 9, blocked: { reason: "source-changed", file: "tasks" } }),
    true,
  );
  assert.equal(validate({ exit_code: 9, blocked: { reason: "declared-block" } }), true);
  assert.equal(
    validate({ exit_code: 9, blocked: { reason: "quota-exhausted" } }),
    false,
    "a blocked reason the engine reports is not a blocked reason of the loop",
  );
  assert.equal(
    validate({ exit_code: 9, blocked: { reason: "source-changed", file: "notebook" } }),
    false,
    "the file of a source change is one of spec, plan and tasks (F103-FR-021)",
  );
  // The usage text and the first line of an as-is message (F103-FR-002).
  assert.equal(validate({ exit_code: 0, usage: "usage: ..." }), true);
  assert.equal(
    validate({ exit_code: 1, message: "unknown arg: --nope", usage: "usage: ..." }),
    true,
  );
});

test("T003: the handoff schema holds what F103-FR-041 requires, and refuses a record without it", () => {
  const validate = compile(schemaOf("packages/contracts/schemas/handoff.schema.json"));
  const handoff = {
    schema: "specstride.handoff/1",
    phase: 1,
    phaseAttempt: 1,
    counters: { pass: 2, yield: 0, error: 0, cap: 0, noProgress: 0, shortPass: 0 },
    ledgerTail: ["attempt-open", "pass-closed"],
    remainingUnits: [{ id: "T005", title: "the claim check of the exercise map" }],
    feedbackPointers: ["attempt:1:1:1:feedback"],
    treeFingerprint: "a".repeat(64),
    treeWins: "where this file and the tree disagree, the tree wins",
  };
  assert.equal(validate(handoff), true, "the parts F103-FR-041 requires are enough");
  for (const key of Object.keys(handoff)) {
    const without = { ...handoff } as Record<string, unknown>;
    delete without[key];
    assert.equal(validate(without), false, `a handoff without \`${key}\` is refused`);
  }
  // The kill note, the detached job and the ceiling are optional parts.
  assert.equal(
    validate({
      ...handoff,
      killNote: { reason: "idle", class: "watchdog", unitInProgress: "U-1" },
      detachedJob: { onResume: "read the exit code", exitCode: 0 },
      maxBytes: 6144,
      truncated: false,
    }),
    true,
  );
  assert.equal(
    validate({ ...handoff, schema: "specstride.handoff/2" }),
    false,
    "a record of another major is refused",
  );
  assert.equal(
    validate({ ...handoff, notebook: "the proposer's notebook" }),
    false,
    "the handoff holds nothing the schema does not name",
  );
});

test("T003: the delivery reached the file map `@specstride/contracts` resolves ids through", () => {
  // The lazy validator of the package resolves `specstride.handoff/1` only
  // because the delivery placed the schema in `packages/contracts/schemas/`
  // and the generator of the package wrote it into `src/records/schema-map.ts`.
  const compiled = validatorFor("specstride.handoff/1");
  assert.equal(compiled.schemaId, "specstride.handoff/1");
  const ok = compiled.validate({
    schema: "specstride.handoff/1",
    phase: 7,
    phaseAttempt: 2,
    counters: { pass: 1 },
    ledgerTail: [],
    remainingUnits: [],
    feedbackPointers: [],
    treeFingerprint: "b".repeat(64),
    treeWins: "the tree wins",
  });
  assert.equal(ok, true, "the handoff validates through its schema id");
  assert.equal(
    compiled.validate({ schema: "specstride.handoff/1", phase: 7 }),
    false,
    "and an incomplete handoff is refused through its schema id",
  );
});
