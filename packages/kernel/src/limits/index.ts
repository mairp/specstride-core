/**
 * The one switch that lifts every time limit and count limit of a run.
 *
 * `SPECSTRIDE_LIMITS=off` in the environment of the launch: no stage time
 * limit, no pass time limit or pass ceiling (so no cap breaker), no critic or
 * diagnostician time limit, no time limit on the verification command, no
 * pass count, no no-progress halt, no reject limit and no malformed-verdict
 * limit. A run then ends only when its phases are approved, when it is
 * stopped, or when it fails for a reason that is not a limit.
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
