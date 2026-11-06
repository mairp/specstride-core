#!/usr/bin/env node
/**
 * The fake binary of the conformance suite of the harness port (EP-02).
 *
 * F109-FR-042 — the suite asserts, for every operation, the argument list,
 * standard input, the names and values of the environment, the working
 * directory, the process group and the clean-up of the call. This binary is
 * the observed side of that assertion: it records everything it was given,
 * then plays the script it was handed, and never calls anything beyond the
 * files it is told to touch.
 *
 * Recording. The observer passes the directory of the recording in the
 * environment variable `FAKE_BINARY_RECORD_DIR`; the binary appends one JSON
 * line to `record.jsonl` there with:
 *
 *   { "argv": [...], "cwd": "...", "pgid": N, "pid": N,
 *     "env": {name: value, ...}, "stdin": "..." }
 *
 * The record line is flushed before the script plays, so an observation is
 * durable even when the script ends the process. Without the variable the
 * binary still plays its script, but records nothing (a caller that only
 * wants the play passes no directory).
 *
 * Script. The environment variable `FAKE_BINARY_SCRIPT` holds a JSON array of
 * steps, played in order:
 *
 *   {"stdout": "text"}            write text to standard output
 *   {"stderr": "text"}            write text to standard error
 *   {"write": {"path": p, "content": c}}   write a file (a stand-in for the
 *                                 files an overlay or a session store leaves)
 *   {"mkdir": p}                  create a directory
 *   {"exit": N}                   end the process with code N
 *   {"signal": "SIGKILL"}         end the process by a signal to itself
 *   {"hang": ms}                  stop reacting for ms milliseconds (0 or a
 *                                 negative number: forever, until killed)
 *   {"read": p}                   try to read the path p; the result (ok,
 *                                 with the byte length, or refused, with the
 *                                 error code) is written to standard output
 *                                 as one JSON line — the second form of the
 *                                 completion level uses it to prove that a
 *                                 withheld path cannot be read
 *   {"net": {"host": h, "port": n}}  try one TCP connection; the outcome is
 *                                 written to standard output as one JSON
 *                                 line — the suite reads it to prove that
 *                                 the network is off
 *
 * Without a script the binary writes nothing and exits 0.
 */
import { appendFileSync, mkdirSync, readFileSync, readSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { connect } from "node:net";

function readStdinSync() {
  // Read standard input to end of stream, synchronously, from the fd; a pipe
  // that delivers in pieces is read to the end.
  const chunks = [];
  for (;;) {
    const chunk = Buffer.alloc(65536);
    let read = 0;
    try {
      read = readSync(0, chunk, 0, chunk.length);
    } catch (error) {
      if (error && error.code === "EAGAIN") break; // no input piped in
      if (error && error.code === "EINTR") continue;
      break;
    }
    if (read <= 0) break;
    chunks.push(chunk.subarray(0, read));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function processGroupId() {
  if (typeof process.getpgid === "function") {
    try {
      return process.getpgid(process.pid);
    } catch {
      /* fall through to /proc */
    }
  }
  try {
    const stat = readFileSync("/proc/self/stat", "utf8");
    // Field 5 of /proc/<pid>/stat is the process group id; field 2 (comm) may
    // contain spaces and parentheses, so cut from the last ")".
    const after = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
    return Number(after[2]);
  } catch {
    return null;
  }
}

function record(stdin) {
  const dir = process.env.FAKE_BINARY_RECORD_DIR;
  if (!dir) return;
  const line = {
    argv: process.argv.slice(2),
    cwd: process.cwd(),
    pid: process.pid,
    pgid: processGroupId(),
    env: { ...process.env },
    stdin,
    at: new Date().toISOString(),
  };
  mkdirSync(dir, { recursive: true });
  appendFileSync(`${dir}/record.jsonl`, `${JSON.stringify(line)}\n`);
}

function tryRead(step) {
  try {
    const bytes = readFileSync(step.read);
    return { action: "read", path: step.read, ok: true, bytes: bytes.length };
  } catch (error) {
    return {
      action: "read",
      path: step.read,
      ok: false,
      code: error && error.code !== undefined ? error.code : String(error),
    };
  }
}

function tryNet(step, done) {
  const { host, port } = step.net;
  const socket = connect({ host, port });
  const finish = (outcome) => {
    process.stdout.write(`${JSON.stringify({ action: "net", host, port, ...outcome })}\n`);
    socket.destroy();
    done();
  };
  socket.setTimeout(2000);
  socket.once("connect", () => finish({ ok: true }));
  socket.once("timeout", () => finish({ ok: false, reason: "timeout" }));
  socket.once("error", (error) => finish({ ok: false, code: error.code ?? String(error) }));
}

function play(stdin) {
  const raw = process.env.FAKE_BINARY_SCRIPT;
  if (!raw) {
    process.exitCode = 0;
    return;
  }
  const steps = JSON.parse(raw);
  let index = 0;
  const next = () => {
    if (index >= steps.length) return;
    const step = steps[index++];
    if (step.stdout !== undefined) process.stdout.write(step.stdout);
    if (step.stderr !== undefined) process.stderr.write(step.stderr);
    if (step.write !== undefined) {
      mkdirSync(dirname(step.write.path), { recursive: true });
      writeFileSync(step.write.path, step.write.content ?? "");
    }
    if (step.mkdir !== undefined) mkdirSync(step.mkdir, { recursive: true });
    if (step.read !== undefined) process.stdout.write(`${JSON.stringify(tryRead(step))}\n`);
    if (step.net !== undefined) {
      tryNet(step, next);
      return;
    }
    if (step.hang !== undefined) {
      const ms = Number(step.hang);
      if (!Number.isFinite(ms) || ms <= 0) return; // forever: the caller ends us
      setTimeout(next, ms);
      return;
    }
    if (step.signal !== undefined) {
      process.kill(process.pid, step.signal);
      return;
    }
    if (step.exit !== undefined) {
      process.exit(Number(step.exit));
    }
    next();
  };
  void stdin;
  next();
}

const stdin = readStdinSync();
record(stdin);
play(stdin);
