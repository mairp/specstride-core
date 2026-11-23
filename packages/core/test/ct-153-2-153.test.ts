/**
 * Phase 1 of feature 153, T316 — the guard: the record and the verdict are
 * bound as before.
 *
 * Feature 153 changes the SPEED of the loop's feedback, not what an approval
 * binds. Two things must survive the feature exactly as they were at `main`
 * @ `efe8897f`:
 *
 * 1. The FIELD LIST of the approval record (`specstride.approval/1`, annex B
 *    §B.14): the schema of the record
 *    (`packages/contracts/src/records/schema-map.ts`), the verifier of the
 *    record (`packages/core/src/approval/verify.ts`, which validates the
 *    record against that schema) and the writer of the record
 *    (`packages/core/src/approval/record.ts`, `FIELDS_OF_THE_APPROVAL_RECORD`)
 *    all hold ONE list, and it is the list this test holds. A field that
 *    appears in one and not in another breaks the binding between the verdict
 *    the approval rests on and the record that pins it.
 *
 * 2. The CRITIC CALL of the engine (`packages/cli/src/engine/run-feature.ts`)
 *    still passes NO TOOL to the critic harness: the proposer's
 *    `buildProposerArgv` carries `allowedTools`, the critic's
 *    `buildCriticArgv` carries none (F125-FR-023 — a critic-class call has no
 *    tool, one turn, and never a resume).
 *
 * Parts of this are a guard of the SOURCE TEXT, not of behaviour: they read
 * the files and do not import the engine (a 3,650-line composition root must
 * not be pulled into a unit test to guard two lines of it).
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { schemaMap } from "../../contracts/src/records/schema-map.ts";

/** The directory of this test file (`packages/core/test/`). */
const HERE = fileURLToPath(new URL(".", import.meta.url));

/** The repository root, as seen from `packages/core/test/`. */
const REPO = join(HERE, "..", "..", "..");

/** The schema id of the approval record. */
const SCHEMA_ID = "specstride.approval/1";

/**
 * The field list of the approval record as this test holds it — annex B
 * §B.14, in order, as of `efe8897f`. `sig` is the signature over every field
 * above it, so it is last and is never part of what is signed.
 */
const FIELDS_HELD_BY_THIS_TEST: readonly string[] = [
  "schema",
  "feature",
  "phase",
  "runId",
  "engineStartId",
  "attemptId",
  "verdictId",
  "nonceHash",
  "critic",
  "evidenceHash",
  "verification",
  "treeFingerprint",
  "approvedAt",
  "keyId",
  "sig",
];

/** The source of a repository file; a file the tree has not yet is `null`. */
function sourceOf(relative: string): string | null {
  const path = join(REPO, relative);
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8");
}

/**
 * The field list the WRITER of the record holds: the strings of the
 * `FIELDS_OF_THE_APPROVAL_RECORD` array, read from its source text. The read
 * is textual on purpose — importing the record module would drag the kernel
 * dependency in behind it, and the field list is a frozen literal that a
 * source read pins as firmly.
 */
function fieldsOfTheWriter(): readonly string[] {
  const record = sourceOf("packages/core/src/approval/record.ts");
  assert.ok(record !== null, "packages/core/src/approval/record.ts exists");
  const head = "FIELDS_OF_THE_APPROVAL_RECORD = Object.freeze([";
  const start = record.indexOf(head);
  assert.notEqual(start, -1, "record.ts holds FIELDS_OF_THE_APPROVAL_RECORD");
  const end = record.indexOf("]);", start);
  assert.notEqual(end, -1, "the field list of the writer closes");
  const held = [...record.slice(start + head.length, end).matchAll(/"([A-Za-z]+)"/gu)].map(
    (m) => m[1],
  );
  assert.ok(held.length > 0, "the writer's field list holds fields");
  return held;
}

/**
 * The text of the ONE balanced call that starts at `text.indexOf(head)`:
 * from the `(` that opens the argument list to the `)` that closes it.
 */
function balancedCall(text: string, head: string): string {
  const start = text.indexOf(head);
  assert.notEqual(start, -1, `${head} appears in the source at all`);
  const open = text.indexOf("(", start);
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  assert.fail(`${head}: its argument list never closes`);
}

test("the record and the verdict are bound as before", () => {
  // ---- 1. one field list, held by the schema, the verifier and the writer.

  // The writer's list (the list the engine builds the record from) is the
  // list this test holds, in order.
  assert.deepEqual(
    [...fieldsOfTheWriter()],
    FIELDS_HELD_BY_THIS_TEST,
    "FIELDS_OF_THE_APPROVAL_RECORD is the field list of annex B §B.14",
  );

  // The schema of the record holds the same fields as its properties, in the
  // same order, and requires every one of them.
  const schema = schemaMap[SCHEMA_ID] as {
    readonly properties: Readonly<Record<string, unknown>>;
    readonly required: readonly string[];
  };
  assert.ok(schema, `schemaMap holds ${SCHEMA_ID}`);
  assert.deepEqual(
    Object.keys(schema.properties),
    FIELDS_HELD_BY_THIS_TEST,
    "the properties of specstride.approval/1 are the field list, in order",
  );
  assert.deepEqual(
    [...schema.required],
    FIELDS_HELD_BY_THIS_TEST,
    "the schema requires every field of §B.14",
  );

  // The verifier of the record takes its field list from that schema: it
  // validates the record against `specstride.approval/1` itself, so it holds
  // no field list of its own that could drift away from the schema's.
  const verifier = sourceOf("packages/core/src/approval/verify.ts");
  assert.ok(verifier !== null, "packages/core/src/approval/verify.ts exists");
  assert.ok(
    verifier.includes("validate(APPROVAL_SCHEMA_ID"),
    "the verifier validates the record against specstride.approval/1",
  );

  // ---- 2. the engine's critic call passes no tool to the critic harness.

  const engine = sourceOf("packages/cli/src/engine/run-feature.ts");
  assert.ok(engine !== null, "packages/cli/src/engine/run-feature.ts exists");

  // The critic-class argv builds of the engine — the critic's own call, the
  // diagnostician's (critic-class too) and, since phase 27 (T380, F153-FR-056),
  // the review of a completed task group — carry no `allowedTools`. The group
  // review is a critic-class call by the spec, so the guard holds the same
  // property over all of them rather than pinning a count the spec moved.
  const criticCallHeads = [...engine.matchAll(/buildCriticArgv\(/g)].map((m) => m.index ?? 0);
  assert.equal(
    criticCallHeads.length,
    3,
    "the engine builds a critic-class argv three times: the critic, the diagnostician and the group review",
  );
  for (const at of criticCallHeads) {
    const call = balancedCall(engine.slice(at), "buildCriticArgv(");
    assert.ok(
      !call.includes("allowedTools"),
      "the critic-class call passes no tool to the critic harness",
    );
  }

  // The contrast that makes the guard mean something: the PROPOSER's argv of
  // the same engine does carry its tool list, so a critic call that grew one
  // would be caught by the same read.
  const proposerCall = balancedCall(engine, "buildProposerArgv(");
  assert.ok(
    proposerCall.includes("allowedTools"),
    "the proposer's call carries its tool list (the guard's contrast)",
  );
});
