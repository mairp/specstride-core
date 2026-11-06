/**
 * T015 — the overrun of a script (F141-FR-005).
 *
 * "A stub that is called beyond the last step of its script MUST fail the call
 * with one fixed exit code and record it." The code is data of the oracle:
 * `overrunExitCode` of `packages/oracle/data/stub-vocabulary.json`, which
 * `script.ts` reads.
 *
 * The overrun is not an error of the oracle. It is a behaviour the comparison
 * needs: a side that calls a stub more often than the scenario scripted has
 * done something the other side did not, and the fixed code plus the recorded
 * record are how the comparator sees it. So the record is written first and the
 * call fails after.
 */
import process from "node:process";

import { OVERRUN_EXIT_CODE } from "./script.ts";
import { writeTranscriptRecord, type TranscriptRecord } from "./transcript.ts";

export { OVERRUN_EXIT_CODE };

/** A call beyond the last step of a script. */
export class StubOverrunError extends Error {
  readonly call: number;
  readonly steps: number;
  constructor(role: string, call: number, steps: number) {
    super(
      `the ${role} stub was called beyond the last step of its script: call ${String(call)} of a ` +
        `script with ${String(steps)} steps. The call fails with the fixed exit code ` +
        `${String(OVERRUN_EXIT_CODE)} and is recorded (F141-FR-005)`,
    );
    this.name = "StubOverrunError";
    this.call = call;
    this.steps = steps;
  }
}

/** The record an overrun leaves: the call as it came, marked `overrun`. */
export function overrunRecord(
  record: Omit<TranscriptRecord, "overrun" | "step">,
): TranscriptRecord {
  return Object.freeze({ ...record, overrun: true });
}

/**
 * Record the overrun and fail the call with the fixed code. The record is
 * written before the process ends, so the comparator sees the call that was
 * made and not only the code it got.
 */
export function failWithOverrun(
  transcriptFile: string,
  record: Omit<TranscriptRecord, "overrun" | "step">,
  steps: number,
): never {
  writeTranscriptRecord(transcriptFile, overrunRecord(record));
  const error = new StubOverrunError(record.role, record.call, steps);
  process.stderr.write(`${error.message}\n`);
  process.exit(OVERRUN_EXIT_CODE);
}
