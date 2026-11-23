/**
 * Phase 5 of feature 153, US1a — the red-gate notice the engine builds on a
 * failed verification gate (F153-FR-016 to F153-FR-019).
 *
 * The engine does not re-specify the text: the frame is feature 105's
 * F105-FR-006 renderer and the failure digest is feature 105's F105-FR-037
 * summary, both existing library code of `@specstride/verification` that this
 * module calls. What the engine owns here is the CAPTURE: the failed command
 * as `runVerificationGate` observed it, and the two streams — which reach the
 * renderers only AFTER the ONE ingress, on the document path (F153-FR-017,
 * F100-FR-009). No redaction of its own: whatever the ingress returns is what
 * a renderer sees, and a stream the redactor could not clear arrives as a
 * drop note, never as text.
 *
 * The notice is written beside the hashed verification record and never into
 * it (F153-FR-018), and it reaches no critic-class input (F153-FR-019).
 */
import { renderFeedback } from "../../../verification/src/gate/feedback.ts";
import { renderFailureSummary } from "../../../verification/src/summary/failure-summary.ts";
import {
  CHECK_OUTPUT_CLASS,
  throughTheIngress,
  writtenText,
  type CommandOutputIngress,
} from "../../../verification/src/gate/ingress.ts";

/** The engine ingress, as `createIngress` of `@specstride/observability` builds it. */
export type EngineIngress = {
  /** A whole document with the caller's cap; fails closed (F100-FR-009). */
  readonly document: (
    text: string,
    capBytes: number,
  ) => { readonly text: string; readonly dropped: boolean };
};

/** One command the verification gate ran and that failed, as captured. */
export type FailedGateCommand = {
  readonly commandId: string;
  readonly executable: string;
  readonly args: readonly string[];
  readonly cwd: string;
  /** The exit code, or `null` where the command was ended at its limit. */
  readonly exitCode: number | null;
  readonly signal: string | null;
  /** The FULL captured streams, before the ingress sees them. */
  readonly stdout: string;
  readonly stderr: string;
};

/** What the engine hands to the notice builder (schema `specstride.red-gate-notice/1`). */
export type RedGateFeedbackInput = {
  readonly phase: number;
  /** The code of the gate itself: 10 a command failed, 3 the gate could not run. */
  readonly gateResultCode: 3 | 10;
  /** The failed commands, in plan order, read at call time. */
  readonly commands: () => readonly FailedGateCommand[];
  /** The logical name of the verification plan. */
  readonly plan: string;
  /** The logical name of the gate result record of this attempt. */
  readonly record: string;
  /**
   * The phase evidence, named as the notice's fourth line spells it. The
   * engine leaves this undefined, so the notice names the logical name
   * `gate:<N>:evidence` of the layout table — EXCEPT under the `parity`
   * profile, where the as-is notice named the file by its workspace path
   * (`gates/GATE<N>-EVIDENCE.md` under the feature directory, F153-FR-061):
   * the caller passes the path there and only there.
   */
  readonly phaseEvidence?: string | undefined;
  /** The ONE ingress, as the engine holds it. */
  readonly ingress: CommandOutputIngress;
};

/** Row 90's mark for a redactor that cannot run (annex X §X.6). */
export const REDACTOR_UNAVAILABLE_MARK = "redactor-unavailable" as const;

/**
 * The port the engine's own ingress becomes: every command stream goes
 * through `document` — the DOCUMENT path, with the CALLER'S cap, never the
 * class path whose 1,024-byte cap would keep only a stream's head. A text
 * the redactor could not clear gives the refused outcome, with row 90's mark
 * of a redactor that cannot run and the original byte count; an accepted
 * text gives it as it came back. This port defines no redaction of its own.
 */
export function checkOutputPortOf(ingress: EngineIngress, capBytes: number): CommandOutputIngress {
  return (text: string, ingressClass: string = CHECK_OUTPUT_CLASS) => {
    const bytes = Buffer.byteLength(text, "utf8");
    // The document cap keeps a text's HEAD. The output of a failed check is
    // read from its END — the failing lines and the tails the summary prints
    // are last — so where the stream exceeds the cap, the port hands the
    // document path the stream's LAST capBytes and the end survives. The
    // original byte count the port reports is always the whole stream's.
    const whole = Buffer.from(text, "utf8");
    const handed = bytes > capBytes ? whole.subarray(bytes - capBytes).toString("utf8") : text;
    const result = ingress.document(handed, capBytes);
    if (result.dropped) {
      return Object.freeze({
        ok: false as const,
        ingressClass,
        dropped: true as const,
        mark: REDACTOR_UNAVAILABLE_MARK,
        original_bytes: bytes,
      });
    }
    const retained = Buffer.byteLength(result.text, "utf8");
    return Object.freeze({
      ok: true as const,
      ingressClass,
      text: result.text,
      truncated: bytes > capBytes || retained < Buffer.byteLength(handed, "utf8"),
      original_bytes: bytes,
      retained_bytes: retained,
    });
  };
}

/**
 * One command with each stream replaced by what the ingress wrote back: the
 * text on the accepted branch, the drop note on the refused one. The renderers
 * never see a stream that did not pass the port.
 */
export function ingressedCommandOf(
  command: FailedGateCommand,
  ingress: CommandOutputIngress,
): FailedGateCommand {
  return {
    ...command,
    stdout: writtenText(throughTheIngress(ingress, command.stdout)),
    stderr: writtenText(throughTheIngress(ingress, command.stderr)),
  };
}

/**
 * The F105-FR-037 failure summary of the failed commands, or `undefined`
 * where reading the commands or rendering throws — the notice then carries
 * the placeholder of B-1145 instead, and the frame stays intact.
 */
export function failureSummaryOf(input: RedGateFeedbackInput): string | undefined {
  try {
    const commands = input.commands().map((command) => ({
      ...ingressedCommandOf(command, input.ingress),
      passed: false,
    }));
    return renderFailureSummary({ commands });
  } catch {
    return undefined;
  }
}

/**
 * The red-gate notice: feature 105's F105-FR-006 frame, with the gate's own
 * result code, the failure summary of the failed commands, and the plan and
 * record named under `## References`.
 */
export function redGateFeedbackOf(input: RedGateFeedbackInput): string {
  return renderFeedback({
    phase: input.phase,
    gateResultCode: input.gateResultCode,
    // A gate that COULD NOT RUN ran no command, so no failure digest exists
    // to render: the section holds the placeholder of B-1145, and the frame
    // stays intact (feature 153, T225).
    failureSummary: input.gateResultCode === 3 ? undefined : failureSummaryOf(input),
    plan: input.plan,
    record: input.record,
    // F153-FR-061 — under `parity` the caller names the phase evidence by its
    // workspace path, as the as-is notice did; undefined keeps the logical
    // name of the layout table everywhere else.
    phaseEvidence: input.phaseEvidence,
  });
}
