/**
 * T082 — line tracing of the Python parts of the reference (F141-FR-031).
 *
 * The Python parts of the two baselines are the modules under `lib/` of the
 * Specstride baseline and under `skills/mixture-of-loops/scripts/` of the
 * mixture-of-loops baseline. They are started as `python3 <file>` by the shell
 * parts, so the tracer cannot be a flag of the command line: it has to be
 * something every interpreter of the run installs for itself.
 *
 * `site` imports a module named `sitecustomize` at startup if it can be
 * imported. The tracer is therefore a `sitecustomize.py` in a directory of the
 * capture job that is put on `PYTHONPATH`: every `python3` of the run imports it,
 * installs `sys.settrace` (and `threading.settrace`, so a thread is traced too),
 * records the file and the line of every `line` and `call` event, and writes the
 * set it collected to one file per process when the interpreter exits.
 *
 * Nothing of this reaches a compared surface. The trace file is written under the
 * directory of the capture job, never under the working directory and never into
 * the reference tree, which is read-only (F141-FR-002). `PYTHONDONTWRITEBYTECODE`
 * is already 1 in the hermetic environment, so the tracer leaves no cache in the
 * tree either.
 *
 * Three limits, named rather than hidden:
 *
 * - The tracer writes at exit. A process killed with SIGKILL writes nothing; a
 *   process ended by SIGTERM or SIGINT does, because the tracer installs a
 *   handler for both that flushes and then re-raises the signal with the default
 *   handler, so the exit status the oracle compares does not change.
 * - A program that installs a tracer of its own replaces this one. No Python part
 *   of either baseline calls `sys.settrace`; `UNTRACED_FORMS` records the limit.
 * - An interpreter started with `-S`, or with `-E`, ignores `sitecustomize` or
 *   `PYTHONPATH`. No shell part of either baseline starts `python3` with either
 *   flag; the capture job asserts it with `assertNoInterpreterFlagThatSkipsSite`.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { type ExecutedLines, TRACE_DIRECTORY_VARIABLE } from "./shell.ts";

/** A fault of the Python tracer. */
export class PythonTraceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PythonTraceError";
  }
}

/** The variable through which the interpreter finds the tracer. */
export const PYTHON_PATH_VARIABLE = "PYTHONPATH" as const;

/** The name the interpreter imports the tracer under. */
export const PYTHON_TRACER_FILE = "sitecustomize.py" as const;

/** The forms of the interpreter that this tracer does not reach. */
export const UNTRACED_FORMS = [
  "python3 -S / python3 -E: an interpreter that skips site or the environment " +
    "imports no sitecustomize. assertNoInterpreterFlagThatSkipsSite reads the shell " +
    "parts of the reference and fails the capture job if one appears",
  "sys.settrace in the traced program itself: a program that installs a tracer of " +
    "its own replaces this one. No Python part of either baseline calls it",
] as const;

/** The text of `sitecustomize.py`. Standard library only, and no clock. */
export function pythonTracerText(): string {
  return `# T082 — the Python tracer of the parity oracle (F141-FR-031).
# Imported by site in every python3 of a traced run. It records the file and the
# line of every line and call event and writes them, one file per process, under
# the directory of the capture job. Nothing of it reaches a compared surface.
import os
import sys

_dir = os.environ.get(${JSON.stringify(TRACE_DIRECTORY_VARIABLE)})
if _dir and os.path.isdir(_dir):
    _seen = set()
    _out = os.path.join(_dir, "python.%d.trace" % os.getpid())

    def _line(frame, event, arg):
        if event == "line" or event == "call":
            _seen.add((frame.f_code.co_filename, frame.f_lineno))
        return _line

    def _call(frame, event, arg):
        if event == "call":
            _seen.add((frame.f_code.co_filename, frame.f_lineno))
            return _line
        return None

    def _flush():
        if not _seen:
            return
        try:
            with open(_out, "a", encoding="utf-8") as handle:
                for name, number in sorted(_seen):
                    handle.write("%s:%d\\n" % (name, number))
        except OSError:
            # Tracing never fails a run (F141-FR-031: no compared surface changes).
            pass

    def _on_signal(number, frame):
        _flush()
        import signal as _signal

        _signal.signal(number, _signal.SIG_DFL)
        os.kill(os.getpid(), number)

    import atexit
    import signal
    import threading

    atexit.register(_flush)
    for _number in (signal.SIGTERM, signal.SIGINT):
        try:
            signal.signal(_number, _on_signal)
        except (ValueError, OSError):
            pass
    threading.settrace(_call)
    sys.settrace(_call)
`;
}

/** What `installPythonTracer` returns. */
export type PythonTracer = {
  readonly traceDir: string;
  readonly tracerFile: string;
  /** The variables the run needs on top of the hermetic environment. */
  readonly env: Readonly<Record<string, string>>;
};

/**
 * Write `sitecustomize.py` and say which variables switch it on. The directory
 * holds nothing but the tracer, so no module of the machine is put on the path
 * of the interpreter with it.
 */
export function installPythonTracer(options: { readonly traceDir: string }): PythonTracer {
  const traceDir = resolve(options.traceDir);
  const tracerDir = join(traceDir, "python-tracer");
  mkdirSync(tracerDir, { recursive: true });
  const tracerFile = join(tracerDir, PYTHON_TRACER_FILE);
  writeFileSync(tracerFile, pythonTracerText(), "utf8");
  return Object.freeze({
    traceDir,
    tracerFile,
    env: Object.freeze({
      [TRACE_DIRECTORY_VARIABLE]: traceDir,
      [PYTHON_PATH_VARIABLE]: tracerDir,
    }),
  });
}

/** Parse one trace file of the Python tracer. */
export function parsePythonTrace(text: string, referenceRoot: string): ExecutedLines {
  const root = resolve(referenceRoot);
  const out = new Map<string, Set<number>>();
  for (const line of text.split("\n")) {
    const at = line.lastIndexOf(":");
    if (at <= 0) continue;
    const file = line.slice(0, at);
    const number = Number(line.slice(at + 1));
    if (!Number.isInteger(number) || number <= 0) continue;
    const absolute = resolve(file);
    if (absolute !== root && !absolute.startsWith(`${root}/`)) continue;
    const key = absolute.slice(root.length + 1);
    let lines = out.get(key);
    if (lines === undefined) {
      lines = new Set<number>();
      out.set(key, lines);
    }
    lines.add(number);
  }
  return out;
}

/** Merge the per-process trace files of the interpreter into one set of lines. */
export function readPythonTrace(traceDir: string, referenceRoot: string): ExecutedLines {
  const dir = resolve(traceDir);
  const out = new Map<string, Set<number>>();
  let names: readonly string[];
  try {
    names = readdirSync(dir);
  } catch (cause) {
    throw new PythonTraceError(`the trace directory ${dir} cannot be read: ${String(cause)}`);
  }
  for (const name of names) {
    if (!/^python\.\d+\.trace$/.test(name)) continue;
    const parsed = parsePythonTrace(readFileSync(join(dir, name), "utf8"), referenceRoot);
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

/**
 * The capture job refuses a reference tree whose shell parts start the
 * interpreter in a way that skips `site` or the environment: such a process
 * would import no tracer and its lines would silently be missing from the map.
 */
export function assertNoInterpreterFlagThatSkipsSite(
  shellFiles: readonly { readonly path: string; readonly text: string }[],
): void {
  const bad: string[] = [];
  for (const file of shellFiles) {
    const lines = file.text.split("\n");
    for (const [index, line] of lines.entries()) {
      // `python3 -S`, `python3 -E`, and the combined short forms such as `-SE`.
      if (/\bpython3?\s+-[A-Za-z]*[SE]/.test(line)) bad.push(`${file.path}:${index + 1}`);
    }
  }
  if (bad.length > 0) {
    throw new PythonTraceError(
      `the reference starts the interpreter in a form that imports no sitecustomize, so its ` +
        `lines would be missing from the exercise map (F141-FR-031): ${bad.join(", ")}`,
    );
  }
}
