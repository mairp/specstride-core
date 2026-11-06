/**
 * T144 — the expectation for a fixture whose verification gate does not
 * execute (F141-FR-042, DV-053).
 *
 * "For a fixture whose verification gate does not execute (verification mode
 * `plan` or `off`), the second suite MUST expect the classic loop with the
 * announced reason `gate-not-executing`, and the announcement MUST be the only
 * difference."
 *
 * Under the `parity` profile row 1 holds the classic loop, so a fixture of the
 * first suite already runs the classic loop; the second suite sets row 1 to
 * `micro` (capture B). A fixture whose verification gate does not execute has
 * nothing for a micro-loop to close around, so the port ANNOUNCES that it
 * stays on the classic loop: the event `strategy.selected` of the catalogue of
 * feature 111, with `fallbackReason` `gate-not-executing`. That announcement —
 * and nothing else — is what the allowlist of DV-053 removes from capture B;
 * `onlyDifferenceIsTheAnnouncement` is what proves "nothing else".
 *
 * Which fixtures this is about is read off the fixture's own declaration: the
 * verification mode is the as-is variable `SPECSTRIDE_VERIFICATION`, and the
 * modes `plan` and `off` are the two the register row names.
 */
import type { LayerAllowlist } from "../catalogue/data.ts";
import type { AllowlistVerdict, Difference } from "./allowlist.ts";
import { entryMatches } from "./allowlist.ts";

/** The as-is variable that names the verification mode. */
export const VERIFICATION_VARIABLE = "SPECSTRIDE_VERIFICATION" as const;

/** The verification modes in which the gate does not execute (DV-053). */
export const GATE_NOT_EXECUTING_MODES: readonly string[] = ["plan", "off"];

/** The announced reason (F141-FR-042). */
export const GATE_NOT_EXECUTING_REASON = "gate-not-executing" as const;

/** The event type of the announcement (the catalogue of feature 111). */
export const ANNOUNCEMENT_EVENT = "strategy.selected" as const;

/** The verification mode of a fixture, read off its declaration. */
export function verificationModeOf(fixture: {
  readonly environment?: Readonly<Record<string, string>>;
}): string | undefined {
  return fixture.environment?.[VERIFICATION_VARIABLE];
}

/** Whether the fixture's verification gate does not execute. */
export function gateDoesNotExecute(fixture: {
  readonly environment?: Readonly<Record<string, string>>;
}): boolean {
  const mode = verificationModeOf(fixture);
  return mode !== undefined && GATE_NOT_EXECUTING_MODES.includes(mode);
}

/** What the second suite expects of such a fixture. */
export type GateNotExecutingExpectation = {
  readonly applies: true;
  readonly reason: typeof GATE_NOT_EXECUTING_REASON;
  readonly announcement: {
    readonly type: typeof ANNOUNCEMENT_EVENT;
    readonly fallbackReason: typeof GATE_NOT_EXECUTING_REASON;
  };
  /** The mode of the fixture that made the expectation apply. */
  readonly verificationMode: string;
};

/** The expectation for a fixture, or `undefined` when the gate does execute. */
export function gateNotExecutingExpectation(fixture: {
  readonly environment?: Readonly<Record<string, string>>;
}): GateNotExecutingExpectation | undefined {
  const mode = verificationModeOf(fixture);
  if (mode === undefined || !GATE_NOT_EXECUTING_MODES.includes(mode)) return undefined;
  return {
    applies: true,
    reason: GATE_NOT_EXECUTING_REASON,
    announcement: { type: ANNOUNCEMENT_EVENT, fallbackReason: GATE_NOT_EXECUTING_REASON },
    verificationMode: mode,
  };
}

/**
 * The announcement, as the difference the allowlist of DV-053 removes: the
 * event on the primary stream of capture B alone, carrying the reason.
 */
export function announcementDifference(expectation: GateNotExecutingExpectation): Difference {
  return {
    surface: "events-primary",
    where: expectation.announcement.type,
    a: "null",
    b: JSON.stringify({
      type: expectation.announcement.type,
      strategy: "classic",
      fallbackReason: expectation.announcement.fallbackReason,
    }),
  };
}

/**
 * "The announcement MUST be the only difference." Every difference the
 * comparison found must be the announcement and must be removed by the entry
 * of DV-053; anything else breaks F141-FR-042 and is reported with the same
 * words the allowlist uses for a difference it cannot name.
 */
export function onlyDifferenceIsTheAnnouncement(
  verdict: AllowlistVerdict,
  expectation: GateNotExecutingExpectation | undefined,
  file: Pick<LayerAllowlist, "entries">,
): readonly string[] {
  if (expectation === undefined) {
    return verdict.allowed.length === 0 && verdict.breaches.length === 0
      ? []
      : [
          `${verdict.fixture}: the verification gate executes, so the second suite holds no ` +
            `announcement for it, and a difference was allowed anyway (F141-FR-042)`,
        ];
  }
  const failures: string[] = [];
  const entry = file.entries.find((candidate) => candidate.row === "DV-053");
  if (entry === undefined) {
    return [`${verdict.fixture}: the allowlist holds no entry for DV-053 (F141-FR-042)`];
  }
  const announcement = announcementDifference(expectation);
  const differences = [...verdict.allowed.map((row) => row.difference), ...verdict.breaches];
  if (differences.length === 0) {
    failures.push(
      `${verdict.fixture}: the gate does not execute (verification mode ` +
        `${expectation.verificationMode}), and the comparison found no announcement of ` +
        `${GATE_NOT_EXECUTING_REASON}; the second suite expects the classic loop with that ` +
        `announced reason (F141-FR-042)`,
    );
  }
  for (const difference of differences) {
    const isAnnouncement =
      difference.surface === announcement.surface &&
      difference.where === announcement.where &&
      entryMatches(entry, difference, { verificationMode: expectation.verificationMode });
    if (!isAnnouncement) {
      failures.push(
        `${verdict.fixture}: the difference at ${difference.surface}/${difference.where} is not ` +
          `the announcement; the announcement is the only difference (F141-FR-042)`,
      );
    }
  }
  return failures;
}
