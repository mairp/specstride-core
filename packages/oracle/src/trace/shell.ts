/**
 * T081 — line tracing of the shell parts of the reference (F141-FR-031).
 *
 * > "The capture job MUST run the reference with line tracing and MUST record,
 * > per fixture, which file and line of the reference each scenario executed:
 * > the exercise map. The map MUST cover the shell parts and the Python parts of
 * > both baselines. Tracing MUST NOT change any compared surface; a capture made
 * > with tracing MUST equal one made without."
 *
 * The shell parts of both baselines are bash scripts with `#!/usr/bin/env bash`.
 * bash can report the file and the line of every command it runs through `set -x`
 * and `PS4`, and it can write that report to a descriptor of its own rather than
 * to standard error through `BASH_XTRACEFD`. The second half is what makes the
 * tracing invisible: nothing of the trace reaches the surfaces `stdout` and
 * `stderr`, which the oracle compares.
 *
 * The tracer cannot be handed to bash through the environment alone. bash 5.2
 * resets `PS4` to its default at startup, so a `PS4` in the environment is
 * ignored (probed on the host of the capture job, bash 5.2.37), and
 * `BASH_XTRACEFD` needs a descriptor that is already open. Both are therefore set
 * from a file that bash itself sources: `BASH_ENV` names a file that a
 * non-interactive bash reads before the script it was asked to run, and that file
 * opens the trace file of its own process, points `BASH_XTRACEFD` at it, sets
 * `PS4` to a marker that carries `${BASH_SOURCE}` and `${LINENO}`, and switches
 * xtrace on. Every bash of the run — the front door, the engine, the pass loop,
 * every library they source, every subshell — does this for itself, so the trace
 * is one file per process and the reader merges them.
 *
 * Two limits, named rather than hidden:
 *
 * - `BASH_ENV` is read by a bash that runs a SCRIPT. A `bash -c '…'` one-liner
 *   does not read it, so the commands inside such a one-liner are not traced.
 *   The line of the baseline that STARTS the one-liner is traced, and the body of
 *   a one-liner is no file of the baseline, so it carries no evidence line of the
 *   behaviour inventory; `UNTRACED_FORMS` records the limit.
 * - A process killed with SIGKILL writes no further line, so the trace of a pass
 *   that a watchdog killed ends where the kill fell. That is a property of the
 *   scenario, not of the tracer: the lines before the kill are in the trace.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

/** A fault of the shell tracer. */
export class ShellTraceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShellTraceError";
  }
}

/**
 * The marker of `PS4`. bash repeats the FIRST character of `PS4` once per level
 * of subshell, so the marker starts with a character that is not part of what the
 * reader matches, and the reader finds the marker anywhere in the line.
 */
export const SHELL_TRACE_MARKER = "@ss-trace@" as const;

/** The variable through which the tracer finds the directory it writes to. */
export const TRACE_DIRECTORY_VARIABLE = "ORACLE_TRACE_DIR" as const;

/** The variable through which bash finds the file it sources before a script. */
export const BASH_ENV_VARIABLE = "BASH_ENV" as const;

/** The name of the file the tracer is written to. */
export const SHELL_TRACER_FILE = "bash-tracer.sh" as const;

/**
 * Every variable the capture job adds to a run for line tracing: the directory
 * of the trace and the two names through which bash and the interpreter find
 * their tracer (`BASH_ENV`, and `PYTHONPATH` of `src/trace/python.ts`).
 *
 * The list is here, in the module with no dependency of its own, because a stub
 * reads it too: a transcript records the NAMES of the variables a stub saw
 * (F141-FR-011), and the instrument of the oracle is not part of the environment
 * of the side under test. Leaving these three out of a transcript is what makes
 * a capture taken with tracing equal to one taken without (F141-FR-031,
 * CT-141-131).
 */
export const TRACE_OVERLAY_VARIABLES = [
  TRACE_DIRECTORY_VARIABLE,
  BASH_ENV_VARIABLE,
  "PYTHONPATH",
] as const;

/** True for a variable that only exists because the capture job traces lines. */
export function isTraceVariable(name: string): boolean {
  return (TRACE_OVERLAY_VARIABLES as readonly string[]).includes(name);
}

/** The forms of the shell that this tracer does not reach (see the note above). */
export const UNTRACED_FORMS = [
  "bash -c '<command>': a non-interactive bash that runs a command rather than a " +
    "script does not read BASH_ENV. The line of the baseline that starts it is traced; " +
    "the body is no file of the baseline and carries no evidence line",
] as const;

/**
 * The text of the file bash sources. It is written once per capture, outside
 * every reference tree (the trees are read-only, F141-FR-002) and outside the
 * working directory of the scenario (so no compared surface holds it).
 */
export function shellTracerText(): string {
  return [
    "# T081 — the shell tracer of the parity oracle (F141-FR-031).",
    "# bash sources this file before every script of the reference. It sends the",
    "# xtrace of this process to a file of its own, so that no line of the trace",
    "# reaches standard output or standard error, which the oracle compares.",
    `if [ -n "\${${TRACE_DIRECTORY_VARIABLE}:-}" ] && [ -d "\${${TRACE_DIRECTORY_VARIABLE}}" ]; then`,
    `  exec {__oracle_trace_fd}>>"\${${TRACE_DIRECTORY_VARIABLE}}/shell.$$.trace" || true`,
    '  if [ -n "${__oracle_trace_fd:-}" ]; then',
    "    BASH_XTRACEFD=$__oracle_trace_fd",
    `    PS4='+${SHELL_TRACE_MARKER} \${BASH_SOURCE}:\${LINENO} ${SHELL_TRACE_MARKER}`,
    "'",
    "    set -x",
    "  fi",
    "fi",
    "",
  ].join("\n");
}

/** What `installShellTracer` returns: the variables to add, and the file it wrote. */
export type ShellTracer = {
  /** The directory the per-process trace files are written to. */
  readonly traceDir: string;
  /** The file bash sources. */
  readonly tracerFile: string;
  /**
   * The variables the run needs ON TOP of the hermetic environment. They are an
   * overlay and never part of `ENVIRONMENT_ALLOW_LIST`: a run of the suite sees
   * neither of them, and only the capture job adds them (F141-FR-031).
   */
  readonly env: Readonly<Record<string, string>>;
};

/**
 * Write the tracer and say which variables switch it on. `traceDir` is made if
 * it does not exist; it is a directory of the capture job, never of the
 * reference tree and never of the working directory of the scenario.
 */
export function installShellTracer(options: { readonly traceDir: string }): ShellTracer {
  const traceDir = resolve(options.traceDir);
  mkdirSync(traceDir, { recursive: true });
  const tracerFile = join(traceDir, SHELL_TRACER_FILE);
  writeFileSync(tracerFile, shellTracerText(), "utf8");
  return Object.freeze({
    traceDir,
    tracerFile,
    env: Object.freeze({
      [TRACE_DIRECTORY_VARIABLE]: traceDir,
      [BASH_ENV_VARIABLE]: tracerFile,
    }),
  });
}

/** Executed lines, per file of the reference, relative to the root of the tree. */
export type ExecutedLines = ReadonlyMap<string, ReadonlySet<number>>;

/** The pattern the reader matches in one line of the trace. */
const TRACE_LINE = new RegExp(`${SHELL_TRACE_MARKER} (.+?):(\\d+) ${SHELL_TRACE_MARKER}$`);

/**
 * Parse one trace file. Only lines inside `referenceRoot` are kept: a stub, the
 * oracle's own shell and anything of the machine is not a file of the reference
 * and has no place in the exercise map.
 */
export function parseShellTrace(text: string, referenceRoot: string): ExecutedLines {
  const root = resolve(referenceRoot);
  const out = new Map<string, Set<number>>();
  for (const line of text.split("\n")) {
    const match = TRACE_LINE.exec(line);
    if (match === null) continue;
    const file = match[1]!;
    const number = Number(match[2]);
    if (!Number.isInteger(number) || number <= 0) continue;
    const absolute = resolve(file);
    if (absolute !== root && !absolute.startsWith(`${root}/`)) continue;
    const key = relative(root, absolute);
    let lines = out.get(key);
    if (lines === undefined) {
      lines = new Set<number>();
      out.set(key, lines);
    }
    lines.add(number);
  }
  return out;
}

/** Merge the per-process trace files of one scenario into one set of lines. */
export function readShellTrace(traceDir: string, referenceRoot: string): ExecutedLines {
  const dir = resolve(traceDir);
  const out = new Map<string, Set<number>>();
  let names: readonly string[];
  try {
    names = readdirSync(dir);
  } catch (cause) {
    throw new ShellTraceError(`the trace directory ${dir} cannot be read: ${String(cause)}`);
  }
  for (const name of names) {
    if (!/^shell\.\d+\.trace$/.test(name)) continue;
    const parsed = parseShellTrace(readFileSync(join(dir, name), "utf8"), referenceRoot);
    for (const [file, lines] of parsed) {
      let known = out.get(file);
      if (known === undefined) {
        known = new Set<number>();
        out.set(file, known);
      }
      for (const number of lines) known.add(number);
    }
  }
  return out;
}
