/**
 * T132 — the driver of a pseudo-terminal of fixed size (F141-FR-014).
 *
 * What the test proves, each time by running a real command on a real device:
 *
 * - the command sees a terminal. `isatty` of standard output and of standard
 *   error are both true, which is what every scenario of FX-40 is about: the
 *   presenter, the banner and the theme tool of the reference all branch on it
 *   (`lib/theme.py:93`, `lib/banner.py:416` at `9cab15d`);
 * - the size is FIXED and is the one the caller named: the command reads its own
 *   window size with `TIOCGWINSZ` and gets exactly those rows and columns, so a
 *   width tier is a property of the fixture and not of the host's terminal;
 * - the two streams come back APART, each from a device of its own. A capture
 *   compares `stdout` and `stderr` as two surfaces (S-02, S-03), so a driver
 *   that merged them would make every FX-40 scenario unverifiable;
 * - the terminal has a TYPE and the oracle fixes it, because the allow-list's
 *   `TERM=dumb` is the value of a run with no device at all;
 * - the exit code and a signal come back, and a bound ends a command that never
 *   ends by itself;
 * - escape sequences reach the capture as written: the device is raw enough that
 *   output post-processing does not rewrite them.
 *
 * Nothing here calls a model, opens a socket or needs a credential.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PseudoTerminalError,
  TERMINAL_COLUMNS,
  TERMINAL_ROWS,
  TERMINAL_TYPE,
  pseudoTerminalIsAvailable,
  runOnPseudoTerminal,
} from "../../src/run/pty.ts";

/** The environment of a run on a device: nothing of this process. */
const ENV = Object.freeze({
  PATH: "/usr/local/bin:/usr/bin:/bin",
  LC_ALL: "C.UTF-8",
  // The allow-list's value for a run with NO terminal. The driver replaces it,
  // which is the point of `TERMINAL_TYPE`.
  TERM: "dumb",
});

const text = (bytes: Uint8Array): string => Buffer.from(bytes).toString("utf8");

test("T132: a command on a pseudo-terminal sees a terminal on both streams", () => {
  const result = runOnPseudoTerminal({
    argv: [
      "python3",
      "-c",
      "import sys; sys.stdout.write('out %s\\n' % sys.stdout.isatty());" +
        "sys.stderr.write('err %s\\n' % sys.stderr.isatty())",
    ],
    cwd: process.cwd(),
    env: ENV,
  });
  assert.equal(result.exitCode, 0);
  assert.match(text(result.stdout), /out True/);
  assert.match(text(result.stderr), /err True/);
});

test("T132: the size of the terminal is the one the caller named, and the default is fixed", () => {
  const read =
    "import fcntl, struct, sys, termios;" +
    "r, c = struct.unpack('HHHH', fcntl.ioctl(sys.stdout.fileno(), termios.TIOCGWINSZ, " +
    "struct.pack('HHHH', 0, 0, 0, 0)))[:2];" +
    "print('%d %d' % (r, c))";
  const fixed = runOnPseudoTerminal({
    argv: ["python3", "-c", read],
    cwd: process.cwd(),
    env: ENV,
  });
  assert.equal(text(fixed.stdout).trim(), `${TERMINAL_ROWS} ${TERMINAL_COLUMNS}`);
  assert.equal(fixed.columns, TERMINAL_COLUMNS);
  assert.equal(fixed.rows, TERMINAL_ROWS);

  const named = runOnPseudoTerminal({
    argv: ["python3", "-c", read],
    cwd: process.cwd(),
    env: ENV,
    columns: 40,
    rows: 12,
  });
  assert.equal(text(named.stdout).trim(), "12 40");
  assert.equal(named.columns, 40);
  assert.equal(named.rows, 12);
});

test("T132: the two streams come back apart", () => {
  const result = runOnPseudoTerminal({
    argv: [
      "python3",
      "-c",
      "import sys; sys.stdout.write('only-out\\n'); sys.stdout.flush();" +
        "sys.stderr.write('only-err\\n')",
    ],
    cwd: process.cwd(),
    env: ENV,
  });
  const out = text(result.stdout);
  const err = text(result.stderr);
  assert.match(out, /only-out/);
  assert.doesNotMatch(out, /only-err/, "standard error never reaches the standard-output device");
  assert.match(err, /only-err/);
  assert.doesNotMatch(err, /only-out/);
});

test("T132: the terminal has a type, and the oracle fixes it", () => {
  assert.equal(TERMINAL_TYPE, "xterm-256color");
  const result = runOnPseudoTerminal({
    argv: ["python3", "-c", "import os; print(os.environ.get('TERM', '<unset>'))"],
    cwd: process.cwd(),
    // The fixture's own environment says `dumb`, which is the value of a run
    // with no device; the driver of the device sets the type.
    env: ENV,
  });
  assert.equal(text(result.stdout).trim(), TERMINAL_TYPE);
  assert.equal(result.terminalType, TERMINAL_TYPE);

  const named = runOnPseudoTerminal({
    argv: ["python3", "-c", "import os; print(os.environ.get('TERM', '<unset>'))"],
    cwd: process.cwd(),
    env: ENV,
    terminalType: "xterm",
  });
  assert.equal(text(named.stdout).trim(), "xterm");
  assert.equal(named.terminalType, "xterm");
});

test("T132: escape sequences reach the capture as written", () => {
  const result = runOnPseudoTerminal({
    argv: ["python3", "-c", "import sys; sys.stdout.write('\\x1b[31mred\\x1b[0m\\n')"],
    cwd: process.cwd(),
    env: ENV,
  });
  assert.equal(text(result.stdout).includes("\u001b[31mred\u001b[0m"), true);
});

test("T132: the exit code comes back, and a bound ends a command that never ends", () => {
  const failed = runOnPseudoTerminal({
    argv: ["python3", "-c", "import sys; sys.exit(7)"],
    cwd: process.cwd(),
    env: ENV,
  });
  assert.equal(failed.exitCode, 7);
  assert.equal(failed.bounded, false);

  const bounded = runOnPseudoTerminal({
    argv: ["python3", "-c", "import time; print('alive', flush=True); time.sleep(600)"],
    cwd: process.cwd(),
    env: ENV,
    boundedSeconds: 2,
  });
  assert.equal(bounded.bounded, true, "the bound ended the command");
  assert.match(text(bounded.stdout), /alive/, "what it printed before the bound is captured");
});

test("T132: the driver says why a host cannot give a terminal, and refuses rather than guesses", () => {
  const available = pseudoTerminalIsAvailable();
  assert.equal(available.available, true, "this host has python3 with pty, termios and fcntl");
  assert.equal(available.reason, undefined);
  // The refusal is an error of its own, which the tier turns into a skip with a
  // reason (F141-FR-037) instead of a silent pass.
  assert.equal(new PseudoTerminalError("no device").name, "PseudoTerminalError");
  assert.ok(new PseudoTerminalError("no device") instanceof Error);
});
