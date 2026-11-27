/**
 * A quota line is not a verdict (feature 127, F127-FR-010; the critic call of
 * `run-feature.ts`).
 *
 * On 2026-11-25 the critic of spec 154's run answered, in place of a reply:
 *
 *   You've hit your 5-hour limit · resets 1:10am (Asia/Dubai)
 *
 * Read as a verdict that is MALFORMED, and the phase was rejected for the
 * harness's sake while the proposer spent a full pass per attempt. The text
 * classifier of feature 127 (`@specstride/policy/quota`, EP-12) knows the
 * phrase as a `quota_window` once the pattern set carries it; what was
 * missing is a caller. `callTheCriticThroughQuota` is that caller: on a
 * quota window it waits for the reset and calls the critic again, and never
 * counts the line as a verdict. A pause for quota is not a stop and spends
 * no budget of any kind (Principle XVI): the wait spends nothing, and the
 * attempt's counters are not touched here.
 *
 * Pure functions first; the one with a dependency takes it (`now`, `sleep`).
 */
import { classify } from "@specstride/policy/quota";

/** A quota window read from a critic's reply, and how long to wait for it. */
export type CriticQuotaWindow = {
  readonly quotaClass: string;
  /** The reset as an epoch instant, or null when the harness gave none. */
  readonly resetsAt: number | null;
  readonly waitMs: number;
};

/** The wait when the harness names a window but no reset: half an hour. */
export const QUOTA_FALLBACK_WAIT_MS = 30 * 60_000;

/**
 * The reset a harness writes in text: `resets 1:10am (Asia/Dubai)`. The next
 * occurrence of that clock time in that zone; null when the text has no such
 * time or the zone is not one `Intl` knows.
 */
export function resetsAtOf(text: string, now: number): number | null {
  const match = /resets\s+(\d{1,2}):(\d{2})\s*(am|pm)\s*\(([^)]+)\)/i.exec(text);
  if (match === null) return null;
  const zone = (match[4] ?? "").trim();
  const minute = Number(match[2]);
  const hour = (Number(match[1]) % 12) + ((match[3] ?? "").toLowerCase() === "pm" ? 12 : 0);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  let zonedNow: number;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).formatToParts(new Date(now));
    const of = (type: string): number =>
      Number((parts.find((part) => part.type === type) ?? { value: "0" }).value);
    zonedNow = Date.UTC(
      of("year"),
      of("month") - 1,
      of("day"),
      of("hour"),
      of("minute"),
      of("second"),
    );
  } catch {
    return null;
  }
  const date = new Date(zonedNow);
  const atClock = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hour,
    minute,
    0,
  );
  // A wall time in the zone, as an instant: the zone's offset now.
  let resetsAt = atClock - (zonedNow - Math.floor(now / 1000) * 1000);
  if (resetsAt <= now) resetsAt += 24 * 60 * 60_000;
  return resetsAt;
}

/**
 * The quota window a critic's reply names, or null when the reply is not a
 * quota line (it is a verdict, or any other text).
 */
export function criticQuotaWindowOf(
  reply: string,
  now: number,
  fallbackWaitMs: number = QUOTA_FALLBACK_WAIT_MS,
): CriticQuotaWindow | null {
  const classification = classify({ errorText: reply });
  if (classification.failed || classification.quotaClass !== "quota_window") return null;
  const resetsAt = resetsAtOf(reply, now);
  const waitMs = resetsAt === null ? fallbackWaitMs : Math.max(0, resetsAt - now);
  return { quotaClass: classification.quotaClass, resetsAt, waitMs };
}

/** What the wait needs: a clock and a sleeper, both injected for the tests. */
export type QuotaWaitDeps = {
  readonly now: () => number;
  readonly sleep: (ms: number) => Promise<void>;
  readonly say: (line: string) => void;
  /** Waits at most this many times; then the last reply stands as it is. */
  readonly maxWaits: number;
  /**
   * T107 (F154-FR-041) — the hooks of the pause the wait is: called once per
   * wait, before the sleep and after it. The composition root binds them to
   * `enterPause`/`resume` of feature 127, so the wait for the window's reset
   * is the state `paused-quota` and a `quota_window` with a non-null reset
   * writes the hold of the account while `host.limits` is on. Absent hooks
   * change nothing: the plain sleep stands, as before this field existed.
   */
  readonly onWaitStart?: (window: CriticQuotaWindow) => void;
  readonly onWaitEnd?: (window: CriticQuotaWindow) => void;
};

/**
 * Calls the critic until it replies something that is not a quota line: on a
 * quota window, says so, waits for the reset and calls again. The prompt and
 * its nonce are the caller's; a second call carries the same prompt, so the
 * verdict stays bound to the nonce the critic was asked with.
 */
export async function callTheCriticThroughQuota<T>(
  call: () => Promise<T>,
  replyOf: (outcome: T) => string,
  deps: QuotaWaitDeps,
): Promise<T> {
  let waits = 0;
  for (;;) {
    const outcome = await call();
    const window = criticQuotaWindowOf(replyOf(outcome), deps.now());
    if (window === null || waits >= deps.maxWaits) return outcome;
    waits += 1;
    const until =
      window.resetsAt === null ? "" : ` until ${new Date(window.resetsAt).toISOString()}`;
    deps.say(
      `critic not reached: ${window.quotaClass}; waiting ${String(Math.round(window.waitMs / 1000))}s${until} (attempt ${String(waits)}/${String(deps.maxWaits)})`,
    );
    deps.onWaitStart?.(window);
    try {
      await deps.sleep(window.waitMs);
    } finally {
      deps.onWaitEnd?.(window);
    }
  }
}
