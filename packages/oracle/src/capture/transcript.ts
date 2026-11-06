/**
 * T045 — the transport-neutral form of a transcript, and the assertion that no
 * invocation continued a session (F141-FR-011).
 *
 * "The transcript MUST be a compared surface. It MUST be compared in a form that
 * is neutral to the transport of the critic, so that a critic reached over HTTP
 * on one side and as a CLI on the other gives the same record for the same
 * prompt. From the transcripts the comparator MUST assert that no invocation
 * carried an argument that continues a session."
 *
 * Two things, therefore:
 *
 * 1. `transportNeutralTranscript` is the form the comparator sees. The channel
 *    the prompt arrived on is dropped, the argument list is dropped from a
 *    CRITIC record — over HTTP there is none, and as a CLI it is the transport —
 *    and the prompt, the role, the call index and the names of the variables
 *    stay. The prompt itself is compared in full (N-24).
 * 2. `assertNoSessionWasContinued` reads every record and fails on an argument
 *    that continues a session. Session continuation is OFF (decision: DV-010,
 *    F141-FR-043), so a side that passed such an argument would be comparing a
 *    different behaviour; the assertion is made before normalization, where
 *    nothing has been replaced yet (F141-FR-021).
 */
import { readTranscript, type TranscriptRecord } from "../../stubs/lib/transcript.ts";

/** The roles a transcript is citable per (§O.4, S-07). */
export const TRANSCRIPT_SURFACE_ROLES = [
  "proposer",
  "critic",
  "diagnostician",
  "engine",
  "verification",
  "installer",
] as const;

/**
 * The arguments that continue a session. Read off the harnesses the oracle
 * drives: the as-is resume and continue flags of the Claude, dsh, Codex and
 * prime command lines, and the session identifier each of them takes. A stub
 * records the argument list it was given, so a side that continued a session is
 * visible here and nowhere else.
 */
export const ARGUMENTS_THAT_CONTINUE_A_SESSION: readonly string[] = Object.freeze([
  "--continue",
  "-c",
  "--resume",
  "--session",
  "--session-id",
  "--conversation",
  "--conversation-id",
  "--thread",
  "--thread-id",
]);

/** The argument that says a session is NOT continued; prime passes it at the baseline. */
export const ARGUMENT_THAT_REFUSES_A_SESSION = "--no-session" as const;

/** A transcript the comparator refuses before it normalizes. */
export class TranscriptSurfaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranscriptSurfaceError";
  }
}

/** One record in the form the comparator sees. */
export type NeutralTranscriptRecord = {
  readonly role: string;
  readonly harness?: string;
  readonly call: number;
  readonly envNames: readonly string[];
  readonly prompt: string;
  readonly argv?: readonly string[];
  readonly given?: Readonly<Record<string, unknown>>;
  readonly step?: Readonly<Record<string, unknown>>;
  readonly overrun?: boolean;
};

/**
 * One record, neutral to the transport. For a critic (and the diagnostician,
 * which is a critic call) the argument list and the channel are the transport
 * and are left out; for every other role the argument list IS the behaviour and
 * stays, compared through the argument table of the harness adapter (§O.4).
 */
export function transportNeutralRecord(record: TranscriptRecord): NeutralTranscriptRecord {
  const neutral: NeutralTranscriptRecord = {
    role: record.role,
    ...(record.harness === undefined ? {} : { harness: record.harness }),
    call: record.call,
    envNames: [...record.envNames],
    prompt: record.prompt,
    ...(record.given === undefined ? {} : { given: record.given }),
    ...(record.step === undefined ? {} : { step: record.step }),
    ...(record.overrun === undefined ? {} : { overrun: record.overrun }),
  };
  if (record.role === "critic" || record.role === "diagnostician") return neutral;
  return { ...neutral, argv: [...record.argv] };
}

/**
 * The whole transcript in the form the comparator sees, sorted by role and call
 * index: the order in which two transports interleave is not a behaviour of
 * either side, the order of the calls of one role is.
 */
export function transportNeutralTranscript(
  records: readonly TranscriptRecord[],
): readonly NeutralTranscriptRecord[] {
  return Object.freeze(
    [...records]
      .sort((a, b) => (a.role === b.role ? a.call - b.call : a.role < b.role ? -1 : 1))
      .map(transportNeutralRecord),
  );
}

/** The records of one role, for a citation of `transcript.<role>`. */
export function recordsOfRole(
  records: readonly TranscriptRecord[],
  role: string,
): readonly TranscriptRecord[] {
  return Object.freeze(records.filter((r) => r.role === role));
}

/** One invocation that carried an argument that continues a session. */
export type SessionContinuation = {
  readonly role: string;
  readonly call: number;
  readonly argument: string;
};

/** Every invocation that carried an argument that continues a session. */
export function sessionContinuations(
  records: readonly TranscriptRecord[],
): readonly SessionContinuation[] {
  const found: SessionContinuation[] = [];
  for (const record of records) {
    for (const argument of record.argv) {
      const name = argument.split("=")[0] as string;
      if (ARGUMENTS_THAT_CONTINUE_A_SESSION.includes(name)) {
        found.push({ role: record.role, call: record.call, argument });
      }
    }
  }
  return Object.freeze(found);
}

/**
 * Assert that no invocation continued a session (F141-FR-011). Session
 * continuation is off in the oracle (DV-010), so a single such argument on
 * either side means the two sides were not compared on the same behaviour.
 */
export function assertNoSessionWasContinued(records: readonly TranscriptRecord[]): void {
  const found = sessionContinuations(records);
  if (found.length > 0) {
    throw new TranscriptSurfaceError(
      `${String(found.length)} invocation(s) carried an argument that continues a session, and ` +
        `session continuation is off in the oracle (F141-FR-011, DV-010): ` +
        `${found.map((f) => `${f.role} call ${String(f.call)} (${f.argument})`).join("; ")}`,
    );
  }
}

/** The surface `transcript` of one side: read the file, assert, and neutralize. */
export function captureTranscript(file: string): {
  readonly records: readonly TranscriptRecord[];
  readonly neutral: readonly NeutralTranscriptRecord[];
} {
  const records = readTranscript(file);
  assertNoSessionWasContinued(records);
  return Object.freeze({ records, neutral: transportNeutralTranscript(records) });
}
