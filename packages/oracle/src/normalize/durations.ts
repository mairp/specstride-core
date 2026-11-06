/**
 * T052 — rule N-05, durations (F141-FR-020).
 *
 * "Every duration becomes a placeholder, unless the fixture declares the value as
 * the behaviour under test."
 *
 * The exception is the whole point: a scenario of the idle watchdog or of a stage
 * timeout IS about a duration, and a rule that replaced it would make the scenario
 * compare nothing. `durationsUnderTest` of the declaration names those values, and
 * a duration that matches one of them is left exactly as it is.
 */
import { replaceInSurfaces } from "./walk.ts";
import type { MutableCapture, NormalizeContext, Rule } from "./types.ts";

/** The forms of a duration the two baselines write. */
export const DURATION_PATTERNS: readonly RegExp[] = Object.freeze([
  // 12.345s, 0.5 s, 1500ms, 2m3s
  /\b\d+(?:\.\d+)?\s?(?:ms|s|m|h)\b/g,
  // elapsed=12.345 / duration_ms=1500 / took 1.5 seconds, and the same four names
  // as a key of a JSON object, with the value quoted or bare: `"duration_ms": 1500`,
  // `"elapsed":"3"`. A state file of the structured path of the pass loop carries the
  // producer contract, whose `duration_ms` is a real duration and differs run to run;
  // an event line of the pass loop carries `"elapsed":"3"`, which is the SECONDS the
  // pass took and differs by a tick between two runs of one side. Only the NUMBER is
  // replaced, through a lookbehind, so the name of the field stays in the capture and
  // a surface still compares which field carried the duration.
  // The name is a SHAPE, not a list: the baseline writes `duration_ms`, `durationMs`,
  // `duration_api_ms`, `gate_duration_ms`, `job_duration_sec`, `elapsed`, `elapsed_sec`
  // and `proposer_elapsed_sec`, and the verification planner of the reference writes the
  // camelCase form into the plan it leaves in the tree. Enumerating them left
  // `"durationMs": 231` in the capture, so a capture of any scenario that plans
  // verification was not reproducible (found live on `FX-15/release-verification-passes`).
  // `[Ww]aited` is the same shape and was the same defect one rule further on: the pass
  // loop writes how long a yield WAITED as `waited_sec`, a name that holds neither
  // `duration` nor `elapsed`. `A_DURATION_KEY` below reached the projected PAIR of the
  // event and this pattern did not reach the raw line, so `"waited_sec":"0"` stayed in
  // the surface `tree` while the `job_duration_sec` beside it became the placeholder —
  // and a capture of a scenario with a yield differed between two runs of ONE side by
  // one tick (found live on `FX-17/iteration-returned-by-yield`: `waited_sec` 0 against
  // 1, and on `FX-22/yield-timeout`). A name belongs to a shape of this rule only when
  // the value is a span the run MEASURED: `seconds` of the pass ceiling and
  // `sleep_sec_declared` are CONFIGURED, are equal on both sides and are the subject of
  // the watchdog scenarios, so no shape here reaches them in the text of a surface.
  /(?<=\b[A-Za-z_]*(?:[Dd]uration|[Ee]lapsed|[Ww]aited|took)[A-Za-z_]*["']?\s*[=:]\s*["']?)\d+(?:\.\d+)?/g,
  /\b\d+(?:\.\d+)? seconds?\b/g,
]);

/** The placeholder a duration becomes. */
export const DURATION_PLACEHOLDER = "<duration>" as const;

/**
 * A key of an event whose value is a duration, with no unit beside it.
 *
 * The surface `events` is PROJECTED into key/value pairs by N-12 before this rule
 * runs, so the value of `"elapsed":"1"` is the string `1` and nothing in it says it
 * is a span of time. The KEY does. Without this a scenario of the watchdogs or of
 * the short-pass nudge was not reproducible: the same run twice reads `elapsed` one
 * tick apart.
 */
const A_DURATION_KEY =
  /^(?:elapsed|elapsed_sec|elapsed_ms|duration|duration_ms|duration_sec|took|wall_sec|work_sec|seconds|secs|waited_sec|job_duration_sec|sleep_sec_declared|critic_sec)$/;

/**
 * The sidecar a watchdog kill leaves, whose SECOND bar-separated field is the elapsed
 * seconds of the killed pass.
 *
 * `proposer.sh:991` at the pinned commit writes `printf '%s|%s|%s\n' "$reason"
 * "$elapsed" "$detail"` into `$STATE_DIR/.last-watchdog-kill`. No key names the second
 * field, and it is a bare integer with no unit, so neither shape above nor the pair
 * path reaches it: the NAME of the file is what says the field is a span, exactly as
 * the name of a `.pid` file is what says its content is a process id (N-07). A capture
 * of a hard-cap scenario kept it and differed between two runs of ONE side by a tick
 * (found live on `FX-20/cap-exhausted-legacy`: `hard_cap|4|` against `hard_cap|3|`).
 */
const A_WATCHDOG_KILL_SIDECAR = /(?:^|\/)\.last-watchdog-kill$/;

/** `reason|elapsed|detail` with the elapsed seconds replaced, or the content unchanged. */
export function withoutTheKilledPassElapsed(content: string): string {
  const fields = content.split("|");
  if (fields.length < 3 || !/^\d+(?:\.\d+)?$/.test(fields[1] as string)) return content;
  fields[1] = DURATION_PLACEHOLDER;
  return fields.join("|");
}

/** N-05. */
export const N05: Rule = {
  id: "N-05",
  subject: "Durations",
  surfaces: [],
  apply(capture: MutableCapture, context: NormalizeContext): number {
    const underTest = new Set(context.durationsUnderTest);
    let changed = 0;
    // The projected pairs of an event file, by the name of the key.
    for (const key of ["events", "events-primary"]) {
      const records = (capture.surfaces[key] as { records?: unknown[] } | undefined)?.records;
      if (records === undefined) continue;
      for (const record of records as {
        pairs?: { key: string; value: unknown; type: string }[];
      }[]) {
        if (record.pairs === undefined) continue;
        record.pairs = record.pairs.map((pair) => {
          if (!A_DURATION_KEY.test(pair.key)) return pair;
          const text = String(pair.value);
          if (!/^\d+(?:\.\d+)?$/.test(text) || underTest.has(text)) return pair;
          changed += 1;
          return { ...pair, value: DURATION_PLACEHOLDER };
        });
      }
    }
    // The sidecar of a watchdog kill, by the NAME of the file.
    for (const key of ["tree", "home"]) {
      const surface = capture.surfaces[key] as
        (Record<string, unknown> & { entries?: { path: string; content?: string }[] }) | undefined;
      if (surface?.entries === undefined) continue;
      capture.surfaces[key] = {
        ...surface,
        entries: surface.entries.map((entry) => {
          if (!A_WATCHDOG_KILL_SIDECAR.test(entry.path) || entry.content === undefined) {
            return entry;
          }
          const content = withoutTheKilledPassElapsed(entry.content);
          if (content === entry.content) return entry;
          changed += 1;
          return { ...entry, content };
        }),
      };
    }
    return (
      changed +
      replaceInSurfaces(capture.surfaces, [], (value) => {
        let text = value;
        for (const pattern of DURATION_PATTERNS) {
          text = text.replace(new RegExp(pattern.source, "g"), (found) =>
            // The fixture declared this value as the behaviour under test.
            underTest.has(found.trim()) ? found : DURATION_PLACEHOLDER,
          );
        }
        return text;
      })
    );
  },
};
