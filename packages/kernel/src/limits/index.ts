/**
 * The one switch that lifts every time limit and count limit of a run.
 *
 * `SPECSTRIDE_LIMITS=off` in the environment of the launch: no stage time
 * limit, no pass time limit or pass ceiling (so no cap breaker), no critic or
 * diagnostician time limit, no time limit on the verification command, no
 * pass count, no reject limit and no malformed-verdict limit. The
 * consecutive-error breaker and the no-progress breaker STAY: they bound
 * passes that produce nothing, not passes that take long, so a campaign
 * whose every pass is productive never trips either one, and a run whose
 * every pass is cut by an external wall (a backend session cap) halts with
 * detail instead of retrying the same doomed pass forever (152 phase 1,
 * 2026-11-11: twelve passes × 45 minutes, zero output). A run then ends when
 * its phases are approved, when it is stopped, or when it fails or blocks
 * for a reason that is not a time limit.
 *
 * The owner's ruling (2026-11-09): campaigns run without any ceiling, cap or
 * limit. Absent or any other value: every limit holds as before.
 */
export const LIMITS_SWITCH_VARIABLE = "SPECSTRIDE_LIMITS" as const;

/** Whether the environment lifts every limit. */
export function limitsAreOff(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return (env[LIMITS_SWITCH_VARIABLE] ?? "").trim().toLowerCase() === "off";
}

/** A count limit, or no limit at all when the switch is off. */
export function countLimit(
  limit: number,
  env: Readonly<Record<string, string | undefined>> = process.env,
): number {
  return limitsAreOff(env) ? Number.MAX_SAFE_INTEGER : limit;
}

/** A time limit in milliseconds, or `undefined` (no timer) when the switch is off. */
export function timeLimitMs(
  limitMs: number,
  env: Readonly<Record<string, string | undefined>> = process.env,
): number | undefined {
  return limitsAreOff(env) ? undefined : limitMs;
}
