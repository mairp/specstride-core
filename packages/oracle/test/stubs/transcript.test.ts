/**
 * CT-141-111 — the transcript (T030, T045; F141-FR-011).
 *
 * What the test proves.
 *
 * - **the fields**: a record carries the role, the harness, the call index, the
 *   argument list, the names of the variables, the prompt, and the channel the
 *   prompt arrived on; the fields are written in a fixed order, so two runs of one
 *   script leave byte-identical files, and a record the schema of the oracle
 *   refuses is NOT written;
 * - **names of variables and never values**: `environmentNames` gives the names
 *   sorted, no value of any variable reaches the record, and a record that tried
 *   to carry one is refused by the schema;
 * - **the transport-neutral form of a critic call**: for a critic (and for the
 *   diagnostician, which is a critic call) the channel AND the argument list are
 *   left out, so the same prompt answered over HTTP on one side and over a command
 *   line on the other gives the same record; for every other role the argument
 *   list IS the behaviour and stays;
 * - **no argument that continues a session**: every as-is resume, continue and
 *   session argument is named, a record that carries one is found, and the
 *   assertion FAILS the comparison before anything is normalized.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  TRANSCRIPT_RECORD_SCHEMA,
  TRANSCRIPT_ROLES,
  TranscriptError,
  environmentNames,
  readTranscript,
  recordAsLine,
  transportNeutral,
  writeTranscriptRecord,
  type TranscriptRecord,
} from "../../stubs/lib/transcript.ts";
import {
  ARGUMENTS_THAT_CONTINUE_A_SESSION,
  ARGUMENT_THAT_REFUSES_A_SESSION,
  TRANSCRIPT_SURFACE_ROLES,
  TranscriptSurfaceError,
  assertNoSessionWasContinued,
  captureTranscript,
  recordsOfRole,
  sessionContinuations,
  transportNeutralRecord,
  transportNeutralTranscript,
} from "../../src/capture/transcript.ts";

const RECORD: TranscriptRecord = {
  role: "proposer",
  harness: "dsh",
  call: 1,
  argv: ["--profile", "headless", "the prompt"],
  envNames: ["HOME", "PATH", "SPECSTRIDE_FEATURE"],
  prompt: "the prompt",
  promptChannel: "argument",
  step: { verbs: ["write", "evidence"] },
};

test("CT-141-111: the fields of a record, in a fixed order", () => {
  const line = recordAsLine(RECORD);
  assert.deepEqual(Object.keys(JSON.parse(line) as Record<string, unknown>), [
    "role",
    "harness",
    "call",
    "argv",
    "envNames",
    "prompt",
    "promptChannel",
    "step",
  ]);
  // The schema of the oracle names the roles a transcript records.
  assert.deepEqual([...TRANSCRIPT_ROLES].sort(), [
    "critic",
    "diagnostician",
    "engine",
    "installer",
    "proposer",
    "verification",
  ]);
  assert.deepEqual([...TRANSCRIPT_SURFACE_ROLES].sort(), [...TRANSCRIPT_ROLES].sort());
  assert.equal(
    (TRANSCRIPT_RECORD_SCHEMA as Record<string, unknown>)["additionalProperties"],
    false,
  );
});

test("CT-141-111: a record is written once per call and two runs agree byte for byte", () => {
  const a = join(mkdtempSync(join(tmpdir(), "oracle-transcript-")), "transcript.jsonl");
  const b = join(mkdtempSync(join(tmpdir(), "oracle-transcript-")), "transcript.jsonl");
  for (const file of [a, b]) {
    writeTranscriptRecord(file, RECORD);
    writeTranscriptRecord(file, { ...RECORD, call: 2 });
    writeTranscriptRecord(file, { ...RECORD, call: 3, overrun: true });
  }
  assert.equal(readFileSync(a, "utf8"), readFileSync(b, "utf8"));
  const records = readTranscript(a);
  assert.deepEqual(
    records.map((r) => r.call),
    [1, 2, 3],
  );
  assert.equal(records[2]?.overrun, true);
});

test("CT-141-111: the names of the variables, never a value", () => {
  assert.deepEqual(
    [...environmentNames({ PATH: "/usr/bin", HOME: "/home/x", EMPTY: undefined })],
    ["HOME", "PATH"],
  );
  const file = join(mkdtempSync(join(tmpdir(), "oracle-transcript-")), "transcript.jsonl");
  writeTranscriptRecord(file, RECORD);
  const text = readFileSync(file, "utf8");
  assert.ok(text.includes('"envNames":["HOME","PATH","SPECSTRIDE_FEATURE"]'));
  assert.ok(!text.includes("/usr/bin"));
  // A record that tried to carry a value of a variable is refused and not written.
  assert.throws(
    () =>
      writeTranscriptRecord(file, {
        ...RECORD,
        call: 2,
        ...({ env: { PATH: "/usr/bin" } } as unknown as Record<string, never>),
      }),
    (error: unknown) =>
      error instanceof TranscriptError && /refused and was not written/.test(error.message),
  );
  assert.equal(readTranscript(file).length, 1);
});

test("CT-141-111: the transport-neutral form of a critic call", () => {
  const overHttp: TranscriptRecord = {
    role: "critic",
    harness: "claude",
    call: 1,
    argv: ["POST", "messages"],
    envNames: ["OPENAI_BASE_URL"],
    prompt: "VERDICT 0123456789abcdef: APPROVED",
    promptChannel: "request-body",
    step: { verbs: ["approve"] },
  };
  const overACommandLine: TranscriptRecord = {
    ...overHttp,
    harness: "dsh",
    argv: ["--profile", "headless", "VERDICT 0123456789abcdef: APPROVED"],
    envNames: ["OPENAI_BASE_URL"],
    promptChannel: "argument",
  };
  // The same prompt over the two transports gives the SAME record.
  assert.deepEqual(
    { ...transportNeutralRecord(overHttp), harness: undefined },
    { ...transportNeutralRecord(overACommandLine), harness: undefined },
  );
  assert.equal(transportNeutralRecord(overHttp).argv, undefined);
  assert.equal("promptChannel" in transportNeutralRecord(overHttp), false);
  // The diagnostician is a critic call and is treated the same way.
  assert.equal(transportNeutralRecord({ ...overHttp, role: "diagnostician" }).argv, undefined);
  // For every other role the argument list IS the behaviour and stays.
  assert.deepEqual([...(transportNeutralRecord(RECORD).argv ?? [])], [...RECORD.argv]);
  // `transportNeutral` of the writer leaves the channel out and nothing else.
  assert.equal("promptChannel" in transportNeutral(RECORD), false);
  assert.deepEqual([...transportNeutral(RECORD).argv], [...RECORD.argv]);
});

test("CT-141-111: the whole transcript is sorted by role and call", () => {
  const neutral = transportNeutralTranscript([
    { ...RECORD, call: 2 },
    { ...RECORD, role: "critic", call: 1 },
    { ...RECORD, call: 1 },
    { ...RECORD, role: "critic", call: 2 },
  ]);
  assert.deepEqual(
    neutral.map((r) => `${r.role}#${String(r.call)}`),
    ["critic#1", "critic#2", "proposer#1", "proposer#2"],
  );
  assert.deepEqual(
    recordsOfRole([RECORD, { ...RECORD, role: "critic", call: 1 }], "critic").map((r) => r.role),
    ["critic"],
  );
});

test("CT-141-111: no argument that continues a session", () => {
  assert.deepEqual(
    [...ARGUMENTS_THAT_CONTINUE_A_SESSION],
    [
      "--continue",
      "-c",
      "--resume",
      "--session",
      "--session-id",
      "--conversation",
      "--conversation-id",
      "--thread",
      "--thread-id",
    ],
  );
  assert.equal(ARGUMENT_THAT_REFUSES_A_SESSION, "--no-session");
  // A clean transcript holds none of them, and the argument that REFUSES a session
  // is not one of them.
  assert.deepEqual([...sessionContinuations([RECORD])], []);
  assert.deepEqual(
    [...sessionContinuations([{ ...RECORD, argv: [ARGUMENT_THAT_REFUSES_A_SESSION] }])],
    [],
  );
  assertNoSessionWasContinued([RECORD]);
  // One such argument, in either form, is found and fails the comparison.
  for (const argument of ["--resume", "--session-id=abc"]) {
    const found = sessionContinuations([{ ...RECORD, argv: [argument] }]);
    assert.equal(found.length, 1, argument);
    assert.equal(found[0]?.argument, argument);
    assert.throws(
      () => assertNoSessionWasContinued([{ ...RECORD, argv: [argument] }]),
      (error: unknown) =>
        error instanceof TranscriptSurfaceError &&
        /session continuation is off in the oracle \(F141-FR-011, DV-010\)/.test(error.message),
    );
  }
});

test("CT-141-111: the surface `transcript` is the neutral form, and the assertion runs first", () => {
  const file = join(mkdtempSync(join(tmpdir(), "oracle-transcript-")), "transcript.jsonl");
  writeTranscriptRecord(file, RECORD);
  writeTranscriptRecord(file, {
    ...RECORD,
    role: "critic",
    call: 1,
    promptChannel: "request-body",
  });
  const captured = captureTranscript(file);
  assert.equal(captured.records.length, 2);
  assert.deepEqual(
    captured.neutral.map((r) => `${r.role}#${String(r.call)}`),
    ["critic#1", "proposer#1"],
  );
  // The critic record carries no argument list; the proposer record does.
  assert.equal(captured.neutral[0]?.argv, undefined);
  assert.deepEqual([...(captured.neutral[1]?.argv ?? [])], [...RECORD.argv]);

  // A transcript that continued a session is refused when the surface is captured,
  // before any rule has replaced anything.
  const bad = join(mkdtempSync(join(tmpdir(), "oracle-transcript-")), "transcript.jsonl");
  writeFileSync(bad, recordAsLine({ ...RECORD, argv: ["--continue"] }), "utf8");
  assert.throws(() => captureTranscript(bad), TranscriptSurfaceError);
});
