/**
 * T052 — rule N-07, process ids (F141-FR-020).
 *
 * "Process ids, process group ids and lock owners become numbered placeholders."
 *
 * Numbered, so that the same process stays the same process across the lines that
 * name it: a lock owner that is the process that took the lock reads as one
 * number on both sides, and a lock owner that is a DIFFERENT process is a
 * difference the rule does not hide.
 *
 * The surface `processes` holds its ids as numbers and not as text, so the rule
 * acts on the structure there as well as on the text of every other surface.
 */
import { numberer, replaceInSurfaces } from "./walk.ts";
import type { MutableCapture, Rule } from "./types.ts";

/**
 * Where a process id is named in the text of the two baselines.
 *
 * The separator allows the quote and the spaces of JSON: a process id is written
 * `pid=123` on a log line of the shell parts and `"job_pid":"123"` in an event, and
 * the second form is the one the event surface carries. A key that ENDS in `pid`
 * counts (`job_pid`, `proposerPid`), because every one of them is a number the
 * kernel handed out and no two runs agree on it.
 *
 * A SESSION id counts with them. `proposer.sh:1464-1513` at the pinned commit reads
 * `ps -o sid=` for the pass and for the job of a yield and writes the second as the
 * field `sid` of `yield_job_start`; a session id IS the process id of the session
 * leader, so it is a number of the same class and of the same rule. Every scenario
 * with a yield left it in the capture and differed between two runs of one side.
 * A key that ends in `sid` counts (`job_sid`, `pass_sid`).
 *
 * The third form names NO key: it is the ready-made signal command that the
 * supervisor of mixture-of-loops prints for the operator,
 * `stop="kill -TERM -3472195"` (`supervisor_lib.py:launch_message` at `9c88f86`).
 * The number after the sign is the process GROUP of the launcher it just started,
 * so it is a number of this class, and the two forms above cannot reach it: there
 * is no `pgid=` before it and the word before it is a signal name.
 *
 * The fourth form names no key either: it is the sentence the supervisor of
 * mixture-of-loops writes when the operator asked it to stop a run,
 * `sent SIGTERM to process group 172480` and `cannot signal process group 172480: …`
 * (`supervisor_lib.py:695-696` at `9c88f86`). The number is `record['pgid']`, so it is
 * a number of this class, and the three forms above cannot reach it: the words before
 * it are `process group`, not `pgid=` and not a signal name.
 */
export const PROCESS_ID_PATTERNS: readonly RegExp[] = Object.freeze([
  /\b(?:p?pid|PID|pgid|PGID|sid|SID|[A-Za-z]+_pid|[A-Za-z]+Pid|[A-Za-z]+_sid|[A-Za-z]+Sid|owner|lock_owner|lockOwner)["']?\s*[=:]\s*["']?(\d{2,9})\b/g,
  /\b(?:process|pid|PID) (\d{2,9})\b/g,
  /\bkill\s+-(?:[A-Z]+|\d{1,2})\s+-?(\d{2,9})\b/g,
  /\bprocess group (\d{2,9})\b/g,
]);

/**
 * A file whose whole content is the process id of a job: `<name>.pid`, and the
 * `<name>.pid.launcher` the baseline writes beside it for the launching shell.
 * Nothing inside it names it a process id — the NAME does — so the rule reads the
 * name.
 */
const A_PID_FILE = /\.pid(?:\.|$)/;

/** A key of an event whose value is a process id, a process group id or a session id. */
const A_PID_KEY =
  /^(?:p?pid|pgid|sid|[A-Za-z]+_pid|[A-Za-z]+Pid|[A-Za-z]+_sid|[A-Za-z]+Sid|owner|lock_owner|lockOwner)$/;

/** N-07. */
export const N07: Rule = {
  id: "N-07",
  subject: "Process ids",
  surfaces: [],
  apply(capture: MutableCapture): number {
    const number = numberer("pid");
    let changed = replaceInSurfaces(capture.surfaces, [], (value) => {
      let text = value;
      for (const pattern of PROCESS_ID_PATTERNS) {
        text = text.replace(new RegExp(pattern.source, "g"), (whole, id: string) =>
          whole.replace(id, number(id)),
        );
      }
      return text;
    });
    // The pid FILE of a job: its whole content is the number, and the name is what
    // says so. The two baselines leave one per long job and one per yield, so a
    // capture that kept the number differed between two runs of ONE side.
    for (const key of ["tree", "home"]) {
      const surface = capture.surfaces[key] as
        (Record<string, unknown> & { entries?: { path: string; content?: string }[] }) | undefined;
      if (surface?.entries === undefined) continue;
      capture.surfaces[key] = {
        ...surface,
        entries: surface.entries.map((entry) => {
          if (!A_PID_FILE.test(entry.path) || entry.content === undefined) return entry;
          const trimmed = entry.content.trim();
          if (!/^\d{2,9}$/.test(trimmed)) return entry;
          changed += 1;
          return { ...entry, content: entry.content.replace(trimmed, number(trimmed)) };
        }),
      };
    }

    // The surface `events` is PROJECTED into pairs before this rule runs (N-12), so
    // the key and the value of `"pid":"123"` are two strings and the value on its
    // own carries nothing that names it a process id. The KEY does, so the rule
    // reads the pair and not the text.
    for (const records of [
      (capture.surfaces["events"] as { records?: unknown[] } | undefined)?.records,
      (capture.surfaces["events-primary"] as { records?: unknown[] } | undefined)?.records,
    ]) {
      if (records === undefined) continue;
      for (const record of records as {
        pairs?: { key: string; value: unknown; type: string }[];
      }[]) {
        if (record.pairs === undefined) continue;
        record.pairs = record.pairs.map((pair) => {
          if (!A_PID_KEY.test(pair.key)) return pair;
          const text = String(pair.value);
          if (!/^\d{2,9}$/.test(text)) return pair;
          changed += 1;
          return { ...pair, value: number(text) };
        });
      }
    }

    // The surface `processes` carries its ids as numbers: the same numbering is
    // applied to them, so a leaked process compares by its command and its
    // identity and not by the number the kernel handed out.
    const processes = capture.surfaces["processes"] as
      | (Record<string, unknown> & {
          count: number;
          entries: { pid: number; processGroup: number; command: string[] }[];
        })
      | undefined;
    if (processes !== undefined) {
      // Every other field of the surface is carried over unchanged. A rule
      // replaces what it names and NEVER drops a field it does not touch: a rule
      // that rebuilt the surface from the two fields it knows would delete a real
      // difference along with them.
      capture.surfaces["processes"] = {
        ...processes,
        count: processes.count,
        entries: processes.entries.map((entry) => {
          changed += 2;
          return {
            pid: number(String(entry.pid)),
            processGroup: number(String(entry.processGroup)),
            command: entry.command,
          };
        }),
      };
    }
    return changed;
  },
};
