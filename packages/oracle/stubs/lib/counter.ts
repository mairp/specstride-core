/**
 * T015 — the invocation counter of a stub (F141-FR-005, rule 1).
 *
 * A stub has no clock and no randomness. Its only state is an invocation
 * counter, and the counter is kept OUTSIDE the working directory: a call of a
 * stub must not count as proposer progress and must not trip the reverse guard,
 * and a counter file in the working directory would do both.
 *
 * The counter lives in the state directory of the run, which the hermetic
 * environment names in `ORACLE_STUB_STATE_DIR` and makes under the run's own
 * root. One file per role and harness, holding the count as decimal text: two
 * roles of the same harness count apart, and the reference and the port each
 * get their own state directory, so the same stub serves both unchanged.
 *
 * `nextInvocation` is the only writer. It increments under an exclusive lock
 * so that two calls of the same stub can never take the same index, which is
 * what makes a transcript one record per invocation.
 */
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

/** The name of the counter file of a role and a harness. */
export function counterFile(stateDir: string, role: string, harness = ""): string {
  const name = harness === "" ? role : `${role}.${harness}`;
  return join(resolve(stateDir), `${name.replace(/[^a-z0-9.-]/gi, "_")}.count`);
}

/** The count a role and a harness stand at; zero when the stub was never called. */
export function invocationCount(stateDir: string, role: string, harness = ""): number {
  const file = counterFile(stateDir, role, harness);
  if (!existsSync(file)) return 0;
  const text = readFileSync(file, "utf8").trim();
  const value = Number.parseInt(text, 10);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${file}: the invocation counter holds ${JSON.stringify(text)}`);
  }
  return value;
}

/**
 * Take the next invocation index of a role and a harness, and record it. The
 * first call gives 1. The lock makes two calls take two indices even when they
 * overlap.
 */
export function nextInvocation(stateDir: string, role: string, harness = ""): number {
  const dir = resolve(stateDir);
  mkdirSync(dir, { recursive: true });
  const file = counterFile(dir, role, harness);
  const lock = `${file}.lock`;

  // An exclusive create is the lock: whoever creates it holds it. A stub has
  // no clock, so the wait is a bounded number of tries and no deadline.
  let held = false;
  for (let attempt = 0; attempt < 10_000 && !held; attempt += 1) {
    try {
      closeSync(openSync(lock, "wx"));
      held = true;
    } catch {
      // another call of the same stub holds it; try again
    }
  }
  if (!held) throw new Error(`${lock}: the invocation counter stayed locked`);

  try {
    const next = invocationCount(dir, role, harness) + 1;
    // A temporary name and a rename, so a reader never sees a half number.
    const temporary = `${file}.next`;
    writeFileSync(temporary, `${String(next)}\n`, "utf8");
    renameSync(temporary, file);
    return next;
  } finally {
    rmSync(lock, { force: true });
  }
}
