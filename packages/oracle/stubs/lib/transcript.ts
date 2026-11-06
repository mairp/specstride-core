/**
 * T015 — the transcript writer of a stub (F141-FR-005 rule 4, F141-FR-011).
 *
 * Every stub appends one record per invocation to a transcript OUTSIDE the
 * working directory: the role, the harness, the call index, the argument list,
 * the NAMES of the environment variables it saw — never their values — and the
 * prompt. The transcript is a compared surface (§O.4, S-07), which is where
 * the proposer prompt contract, the critic prompt, the grounding snapshot and
 * session freshness become observable.
 *
 * The record is checked against `packages/oracle/data/schemas/transcript.schema.json`
 * before it is written, so a record with a field the schema does not know — a
 * value of a variable above all — is refused and not written. The file is
 * JSON Lines, one record per line, in the order of the calls.
 *
 * The form is neutral to the transport of the critic (F141-FR-011):
 * `transportNeutral` leaves out `promptChannel`, so a critic reached over HTTP
 * on one side and as a CLI on the other gives the same record for the same
 * prompt.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { check, violationsAsText, type JsonSchema } from "../../src/catalogue/schema.ts";
import { isTraceVariable } from "../../src/trace/shell.ts";

const SCHEMA_FILE = join(
  resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url))))),
  "data/schemas/transcript.schema.json",
);

/** The schema of one transcript record, read from `data/schemas/`. */
export const TRANSCRIPT_RECORD_SCHEMA = JSON.parse(readFileSync(SCHEMA_FILE, "utf8")) as JsonSchema;

/** The roles a transcript records (§O.4). */
export const TRANSCRIPT_ROLES = (
  (TRANSCRIPT_RECORD_SCHEMA["properties"] as JsonSchema)["role"] as JsonSchema
)["enum"] as readonly string[];

/** A record the schema of the oracle refuses. */
export class TranscriptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranscriptError";
  }
}

/** One record of a transcript (`data/schemas/transcript.schema.json`). */
export type TranscriptRecord = {
  readonly role: string;
  readonly harness?: string;
  readonly call: number;
  readonly argv: readonly string[];
  /** The names of the variables the stub saw, and never a value. */
  readonly envNames: readonly string[];
  readonly prompt: string;
  readonly promptChannel?: "stdin" | "argument" | "request-body";
  readonly given?: Readonly<Record<string, unknown>>;
  readonly step?: Readonly<Record<string, unknown>>;
  readonly overrun?: boolean;
};

/** The fields of a record, in the order the file carries them. */
const FIELD_ORDER = [
  "role",
  "harness",
  "call",
  "argv",
  "envNames",
  "prompt",
  "promptChannel",
  "given",
  "step",
  "overrun",
] as const;

/** A record as one line: the fields in a fixed order, so two runs agree byte for byte. */
export function recordAsLine(record: TranscriptRecord): string {
  const ordered: Record<string, unknown> = {};
  for (const field of FIELD_ORDER) {
    const value = (record as unknown as Record<string, unknown>)[field];
    if (value !== undefined) ordered[field] = value;
  }
  return `${JSON.stringify(ordered)}\n`;
}

/**
 * Append one record to the transcript. The record is checked against the
 * schema first; a record the schema refuses is not written, so a value of a
 * variable can never reach the file.
 */
export function writeTranscriptRecord(file: string, record: TranscriptRecord): void {
  const violations = check(TRANSCRIPT_RECORD_SCHEMA, record);
  if (violations.length > 0) {
    throw new TranscriptError(
      `the record of call ${String(record.call)} is refused and was not written: ` +
        `${violationsAsText(violations)}`,
    );
  }
  mkdirSync(dirname(resolve(file)), { recursive: true });
  appendFileSync(file, recordAsLine(record), "utf8");
}

/** Every record of a transcript, in the order of the calls. */
export function readTranscript(file: string): readonly TranscriptRecord[] {
  if (!existsSync(file)) return [];
  const text = readFileSync(file, "utf8");
  if (text.trim() === "") return [];
  return Object.freeze(
    text
      .trimEnd()
      .split("\n")
      .map((line, i) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(line);
        } catch {
          throw new TranscriptError(`${file}: line ${String(i + 1)} is no record`);
        }
        const violations = check(TRANSCRIPT_RECORD_SCHEMA, parsed);
        if (violations.length > 0) {
          throw new TranscriptError(
            `${file}: line ${String(i + 1)}: ${violationsAsText(violations)}`,
          );
        }
        return Object.freeze(parsed as TranscriptRecord);
      }),
  );
}

/**
 * The form in which a transcript is compared (F141-FR-011): the channel the
 * prompt arrived on is left out, so a critic reached over HTTP on one side and
 * as a CLI on the other gives the same record for the same prompt.
 */
export function transportNeutral(
  record: TranscriptRecord,
): Omit<TranscriptRecord, "promptChannel"> {
  const { promptChannel: _channel, ...rest } = record;
  return rest;
}

/**
 * The names of the variables a stub saw, sorted, and never a value
 * (F141-FR-011). Sorted because the order in which a process receives its
 * environment is not a behaviour of either side.
 *
 * The variables of the line tracing of the capture job are left out
 * (`TRACE_OVERLAY_VARIABLES` of `src/trace/shell.ts`): they are the instrument of
 * the oracle and not the environment of the side under test, and a capture taken
 * with tracing must equal one taken without (F141-FR-031).
 */
export function environmentNames(
  env: Readonly<Record<string, string | undefined>>,
): readonly string[] {
  return Object.freeze(
    Object.keys(env)
      .filter((name) => env[name] !== undefined && !isTraceVariable(name))
      .sort(),
  );
}
