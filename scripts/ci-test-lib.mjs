/**
 * The library behind scripts/ci-test.mjs: argument parsing, the per-workspace
 * command, an asynchronous single-workspace run, a bounded parallel pool and
 * the per-workspace output block. The serial path of ci-test.mjs keeps its own
 * synchronous spawn, but it builds the same command as `commandOf` here.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/** The output cap of a workspace run, per stream, as the serial loop's maxBuffer. */
export const OUTPUT_CAP_BYTES = 1 << 30;

const USAGE =
  "usage: node scripts/ci-test.mjs [--parallel <n>]   (<n> is an integer >= 1; default 1)";

/**
 * Parse the command line of scripts/ci-test.mjs. `--parallel <n>` with `n` an
 * integer >= 1; the default is 1. Anything else throws an error whose message
 * is the usage line.
 */
export function parseArgs(argv) {
  const parsed = { parallel: 1 };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] !== "--parallel") throw new Error(USAGE);
    const value = argv[i + 1];
    if (value === undefined || !/^\d+$/.test(value) || Number(value) < 1) {
      throw new Error(USAGE);
    }
    parsed.parallel = Number(value);
    i += 1;
  }
  return parsed;
}

/**
 * The executable and the argument list the serial loop builds for a workspace:
 * the tests/isolate.ts prefix when that file exists, `--test`, then the files.
 */
export function commandOf(root, workspace, files) {
  const isolate = join(root, "tests/isolate.ts");
  const prefix = existsSync(isolate) ? [isolate, process.execPath] : [];
  return { file: process.execPath, args: [...prefix, "--test", ...files] };
}

/**
 * Collect one stream up to `cap` bytes. Returns the bytes seen and whether the
 * cap was crossed. The first time the cap is crossed it calls `onOver` — from
 * the `data` handler, so the caller can end the child at that moment — and
 * stops buffering from then on; it does not wait for the stream's `end`.
 */
function collect(stream, cap, onOver) {
  const chunks = [];
  let size = 0;
  let over = false;
  stream.on("data", (chunk) => {
    if (over) return;
    size += chunk.length;
    if (size > cap) {
      over = true;
      onOver();
      return;
    }
    chunks.push(chunk);
  });
  return {
    get over() {
      return over;
    },
    text: () => Buffer.concat(chunks).toString("utf8"),
  };
}

function runOneWithCap(root, workspace, files, cap, onCommand) {
  return new Promise((resolve) => {
    const cwd = join(root, workspace);
    const { file, args } = commandOf(root, workspace, files);
    if (onCommand !== undefined) onCommand({ file, args, cwd });
    // The child leads its own process group, so the kill below reaches the
    // grandchildren of the tests/isolate.ts prefix (unshare forks one), which
    // hold the pipes open: killing only the direct child would leave `close`
    // unresolved while a runaway grandchild keeps writing.
    const child = spawn(file, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: envForWorkspaceRun(),
      detached: true,
    });
    let ended = false;
    // Crossed the cap: end the whole process group now and resolve — the
    // result does not wait for `close`, which a killed group's pipes may
    // delay (153 phase 19 attempt 3: the SIGKILL waited for stream `end`,
    // so a child that never exits kept running past the cap).
    const endAtCap = () => {
      if (ended) return;
      ended = true;
      if (child.pid !== undefined) {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {
          try {
            child.kill("SIGKILL");
          } catch {
            // already gone
          }
        }
      }
      resolve({
        workspace,
        files: files.length,
        status: 1,
        stdout: stdout.text(),
        stderr: `output exceeded ${cap} bytes\n`,
        signal: "SIGKILL",
      });
    };
    const stdout = collect(child.stdout, cap, endAtCap);
    const stderr = collect(child.stderr, cap, endAtCap);
    child.on("close", (code, signal) => {
      if (ended) return;
      ended = true;
      const over = stdout.over || stderr.over;
      resolve({
        workspace,
        files: files.length,
        status: over ? 1 : code === null ? (signal === null ? 1 : null) : code,
        stdout: stdout.text(),
        stderr: over ? `output exceeded ${cap} bytes\n` : stderr.text(),
        signal,
      });
    });
  });
}

/**
 * The environment of a workspace run: the caller's environment without
 * NODE_TEST_CONTEXT, so a workspace's own `node --test` tree reports on its
 * own standard output instead of an enclosing test runner's channel.
 */
function envForWorkspaceRun() {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  return env;
}

/**
 * Run one workspace with an explicit output cap (runOne uses OUTPUT_CAP_BYTES).
 * Exported so the cap path is testable without a 1 GiB stream.
 */
export function runOneCapped(root, workspace, files, cap, onCommand) {
  return runOneWithCap(root, workspace, files, cap, onCommand);
}

/**
 * Run one workspace asynchronously: `commandOf`'s command, cwd the workspace,
 * standard input ignored, each stream collected up to OUTPUT_CAP_BYTES bytes;
 * beyond the cap the child is ended and the run resolves with a non-zero
 * status. Resolves with {workspace, files, status, stdout, stderr}.
 */
export function runOne(root, workspace, files, onCommand) {
  return runOneWithCap(root, workspace, files, OUTPUT_CAP_BYTES, onCommand);
}

/**
 * A pool over `items` in order: at most `parallel` calls of `runOne(item)` run
 * at a time, and the resolved results come back in the order of `items`.
 */
export async function runWorkspaces(items, runOneItem, parallel) {
  const degree = Math.max(1, Number(parallel) || 1);
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await runOneItem(items[index]);
    }
  }
  const workers = [];
  for (let i = 0; i < Math.min(degree, items.length); i += 1) workers.push(worker());
  await Promise.all(workers);
  return results;
}

/**
 * The lines the serial loop prints for a workspace —
 * `<workspace>: <n> files, exit <status>` and its `not ok` lines — and, when
 * `parallel` is above 1, the workspace's standard error after them.
 */
export function blockOf(result, parallel) {
  const lines = [`${result.workspace}: ${result.files} files, exit ${String(result.status)}`];
  for (const line of String(result.stdout).split("\n")) {
    if (/^not ok/.test(line)) lines.push(`  ${line}`);
  }
  if (parallel > 1 && result.stderr !== "") {
    for (const line of String(result.stderr).split("\n")) {
      if (line !== "") lines.push(line);
    }
  }
  return lines;
}
