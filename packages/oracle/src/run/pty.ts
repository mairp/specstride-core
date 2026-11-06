/**
 * T132 — the driver of a pseudo-terminal of fixed size (F141-FR-014).
 *
 * FX-40 "MUST run the front door on a pseudo-terminal, and MUST drive the
 * presenter, the banner and the theme tool where the front door does not reach a
 * behaviour". Every other family runs with no terminal and colour off (N-21), so
 * this is the one place the oracle gives a command a terminal — and it has to be
 * a terminal that two runs of one side cannot tell apart:
 *
 * - **fixed size.** The size is an argument of the run, never the size of the
 *   terminal this process happens to have, and it is set on the device with
 *   `TIOCSWINSZ` before the command starts. `banner-width-full`,
 *   `banner-width-compact` and `banner-width-line` differ only in it.
 * - **standard output and standard error apart.** Each gets a pseudo-terminal of
 *   its own, so `isatty` is true for both and the two surfaces stay separate
 *   surfaces (§O.4, S-02 and S-03; CT-141-119).
 * - **the bytes the command wrote, and nothing the line discipline added.** Echo
 *   is off and output post-processing is off, so a newline stays one byte and the
 *   capture holds the escape sequences as the command wrote them, which is what
 *   FX-40 compares (N-21 keeps them where a fixture tests colour).
 * - **a controlling terminal.** The child is a session leader and the input
 *   device is its controlling terminal, so a command that opens `/dev/tty`
 *   (the theme tool's background query) finds one.
 *
 * Node has no pseudo-terminal of its own and the oracle takes no native
 * dependency (decision 1 of phase 2), so the device is opened by `python3`, which
 * every scenario of the reference tier already declares as a prerequisite. The
 * helper below is the whole of it: it is data of this module, it reads its
 * instruction as JSON on standard input, and it writes the two streams and the
 * status into files of the run. It has no clock of its own: the only span it
 * knows is the bound the caller gives it.
 *
 * status: unverified on macOS (T132). `openpty`, `TIOCSWINSZ` and `TIOCSCTTY` are
 * POSIX and present on Darwin, but no run of this module on macOS is recorded;
 * the per-OS expectations of F141-FR-035 carry the row.
 */
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** The size of the terminal a scenario gets when it names none. */
export const TERMINAL_COLUMNS = 80 as const;
export const TERMINAL_ROWS = 24 as const;

/**
 * The terminal type of a run on a pseudo-terminal. The allow-list of the empty
 * environment sets `TERM=dumb`, which is how a run with NO terminal is told
 * apart from one with a terminal (`lib/theme.py:93`, `lib/banner.py:415` at
 * `9cab15d` both read it). A scenario that runs ON a device therefore needs a
 * terminal type, and the ORACLE fixes it — never the fixture — so the device is
 * the same on every host and in every scenario. The baseline reads the value as
 * a string and looks nothing up in terminfo, so no capability database is a
 * prerequisite of a scenario of FX-40.
 */
export const TERMINAL_TYPE = "xterm-256color" as const;

/** The interpreter that opens the device. */
export const PSEUDO_TERMINAL_INTERPRETER = "python3" as const;

/** A run on a pseudo-terminal that could not be made. */
export class PseudoTerminalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PseudoTerminalError";
  }
}

/** What to run on a terminal. */
export type PseudoTerminalRun = {
  readonly argv: readonly string[];
  readonly cwd: string;
  /** The whole environment of the child; nothing of this process is added. */
  readonly env: Readonly<Record<string, string>>;
  readonly columns?: number;
  readonly rows?: number;
  /** Bytes written into the terminal, for a command that waits for a key. */
  readonly input?: Uint8Array | string;
  /** How long the command is let to run before it is ended with SIGTERM. */
  readonly boundedSeconds?: number;
  /** Where the helper keeps its three files; a directory of the run by default. */
  readonly workRoot?: string;
  /** The terminal type the child sees; `TERMINAL_TYPE` by default. */
  readonly terminalType?: string;
};

/** What the command left on the terminal. */
export type PseudoTerminalResult = {
  readonly exitCode: number;
  readonly signal?: string;
  readonly stdout: Uint8Array;
  readonly stderr: Uint8Array;
  readonly columns: number;
  readonly rows: number;
  /** The terminal type the child saw. */
  readonly terminalType: string;
  /** True where the bound ended the command. */
  readonly bounded: boolean;
};

/**
 * The helper. Two pseudo-terminals of the given size, echo and output
 * post-processing off, the child a session leader with the input device as its
 * controlling terminal, and the two streams read to the end.
 */
export const PSEUDO_TERMINAL_HELPER = `
import base64, errno, fcntl, json, os, pty, select, signal, struct, sys, termios

spec = json.loads(sys.stdin.read())
rows, cols = int(spec["rows"]), int(spec["columns"])

def device():
    master, slave = pty.openpty()
    fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))
    mode = termios.tcgetattr(slave)
    # Echo off, so what the caller writes in is not written out again; output
    # post-processing off, so a newline stays one byte and an escape sequence
    # reaches the capture exactly as the command wrote it.
    mode[3] = mode[3] & ~termios.ECHO & ~termios.ECHONL
    mode[1] = mode[1] & ~termios.OPOST
    termios.tcsetattr(slave, termios.TCSANOW, mode)
    return master, slave

in_master, in_slave = device()
out_master, out_slave = device()
err_master, err_slave = device()

def child():
    os.setsid()
    fcntl.ioctl(in_slave, termios.TIOCSCTTY, 0)
    os.dup2(in_slave, 0)
    os.dup2(out_slave, 1)
    os.dup2(err_slave, 2)
    for fd in (in_master, out_master, err_master, in_slave, out_slave, err_slave):
        if fd > 2:
            try:
                os.close(fd)
            except OSError:
                pass
    os.chdir(spec["cwd"])
    os.execvpe(spec["argv"][0], spec["argv"], spec["env"])

pid = os.fork()
if pid == 0:
    try:
        child()
    except Exception as exc:  # the child could not be started
        os.write(2, ("pty: %s\\n" % exc).encode())
        os._exit(127)

for fd in (in_slave, out_slave, err_slave):
    os.close(fd)

payload = base64.b64decode(spec.get("input", ""))
if payload:
    os.write(in_master, payload)

out, err = bytearray(), bytearray()
open_fds = {out_master: out, err_master: err}
bound = float(spec.get("seconds") or 0)
started = os.times()[4]
bounded = False
while open_fds:
    timeout = None
    if bound > 0:
        left = bound - (os.times()[4] - started)
        if left <= 0:
            bounded = True
            os.killpg(os.getpgid(pid), signal.SIGTERM)
            break
        timeout = left
    ready, _, _ = select.select(list(open_fds), [], [], timeout)
    if not ready:
        continue
    for fd in ready:
        try:
            chunk = os.read(fd, 65536)
        except OSError as exc:
            if exc.errno != errno.EIO:
                raise
            chunk = b""
        if chunk:
            open_fds[fd].extend(chunk)
        else:
            os.close(fd)
            del open_fds[fd]

_, status = os.waitpid(pid, 0)
if bounded:
    # Drain what the command wrote before the bound ended it.
    for fd in list(open_fds):
        try:
            while True:
                chunk = os.read(fd, 65536)
                if not chunk:
                    break
                open_fds[fd].extend(chunk)
        except OSError:
            pass
with open(spec["out"], "wb") as fh:
    fh.write(bytes(out))
with open(spec["err"], "wb") as fh:
    fh.write(bytes(err))
result = {
    "exitCode": os.waitstatus_to_exitcode(status) if not os.WIFSIGNALED(status) else 128 + os.WTERMSIG(status),
    "signal": signal.Signals(os.WTERMSIG(status)).name if os.WIFSIGNALED(status) else None,
    "bounded": bounded,
    "columns": cols,
    "rows": rows,
}
with open(spec["status"], "w") as fh:
    json.dump(result, fh)
`;

/** Is a pseudo-terminal of fixed size available on this host? */
export function pseudoTerminalIsAvailable(): {
  readonly available: boolean;
  readonly reason?: string;
} {
  const probe = spawnSync(PSEUDO_TERMINAL_INTERPRETER, ["-c", "import pty, termios, fcntl"], {
    encoding: "utf8",
  });
  if (probe.error !== undefined || probe.status !== 0) {
    return {
      available: false,
      reason:
        `${PSEUDO_TERMINAL_INTERPRETER} with the modules pty, termios and fcntl opens the ` +
        `pseudo-terminal of a scenario of FX-40 (T132); it is a declared prerequisite of the ` +
        `scenario and a missing one is a skip with its reason (F141-FR-037)`,
    };
  }
  return { available: true };
}

/**
 * Run one command on a pseudo-terminal of fixed size. The two streams come back
 * apart, each from a device of its own.
 */
export function runOnPseudoTerminal(run: PseudoTerminalRun): PseudoTerminalResult {
  const available = pseudoTerminalIsAvailable();
  if (!available.available) throw new PseudoTerminalError(available.reason as string);
  const root = run.workRoot ?? mkdtempSync(join(tmpdir(), "oracle-pty-"));
  const out = join(root, "pty.stdout");
  const err = join(root, "pty.stderr");
  const status = join(root, "pty.status.json");
  const input =
    run.input === undefined
      ? ""
      : Buffer.from(
          typeof run.input === "string" ? Buffer.from(run.input, "utf8") : run.input,
        ).toString("base64");
  // A run on a device has a terminal type; the allow-list's `TERM=dumb` is the
  // value of a run with NO device and would make the device unobservable.
  const terminalType = run.terminalType ?? TERMINAL_TYPE;
  const spec = {
    argv: [...run.argv],
    cwd: run.cwd,
    env: { ...run.env, TERM: terminalType },
    columns: run.columns ?? TERMINAL_COLUMNS,
    rows: run.rows ?? TERMINAL_ROWS,
    input,
    out,
    err,
    status,
    ...(run.boundedSeconds === undefined ? {} : { seconds: run.boundedSeconds }),
  };
  writeFileSync(join(root, "pty.spec.json"), `${JSON.stringify(spec)}\n`, "utf8");
  const helper = spawnSync(PSEUDO_TERMINAL_INTERPRETER, ["-c", PSEUDO_TERMINAL_HELPER], {
    input: JSON.stringify(spec),
    // The helper is the oracle's own instrument: it gets the environment of the
    // oracle, and the CHILD gets the hermetic environment of the scenario, which
    // `spec.env` is and which `execvpe` applies in full.
    maxBuffer: 16 * 1024 * 1024,
    ...(run.boundedSeconds === undefined
      ? {}
      : { timeout: Math.trunc((run.boundedSeconds + 10) * 1000) }),
  });
  if (!existsSync(status)) {
    throw new PseudoTerminalError(
      `the pseudo-terminal helper left no status: ` +
        `${Buffer.from(helper.stderr ?? Buffer.alloc(0)).toString("utf8") || "no output"}`,
    );
  }
  const reported = JSON.parse(readFileSync(status, "utf8")) as {
    exitCode: number;
    signal: string | null;
    bounded: boolean;
    columns: number;
    rows: number;
  };
  return Object.freeze({
    exitCode: reported.exitCode,
    ...(reported.signal === null ? {} : { signal: reported.signal }),
    stdout: new Uint8Array(readFileSync(out)),
    stderr: new Uint8Array(readFileSync(err)),
    columns: reported.columns,
    rows: reported.rows,
    terminalType,
    bounded: reported.bounded,
  });
}
