/**
 * T062 — the performance starting values of `plan.md`, measured in the build.
 *
 * `specs/148-check-runner/plan.md`, "Technical Context", gives three
 * **Performance Goals**, each "a starting value with low confidence, measured
 * in the build":
 *
 *  1. the overhead of the runner per command, without the fingerprint
 *     readings: under 50 ms;
 *  2. batch formation for 100 entries: under 10 ms;
 *  3. the end of a process group after a time limit: within 5 s.
 *
 * The three numbers are **read from `plan.md`** and never written down here,
 * so a plan whose values change fails the build rather than passing a test
 * that still holds the old ones. The measured values are recorded in
 * `packages/check-runner/README.md`, and the last test of this file holds that
 * record against the goals, so a recorded value that no longer satisfies the
 * plan fails too.
 *
 * What each measurement is, exactly:
 *
 *  - **The overhead per command** is the wall time of `start` + `result` less
 *    the duration the result reports for the child itself. `pin` is NOT in it:
 *    `pin` runs at launch, once per entry of the manifest (F148-FR-001), and
 *    its cost is the sha256 of the executable — 124.8 MB for `node` itself.
 *    That cost is measured and recorded separately, on a large and on a small
 *    executable, because it is the one number of this feature that is
 *    dominated by the size of what it pins rather than by the runner.
 *  - **Batch formation** is `formBatches`, which is a pure function of the
 *    manifest and the parallelism (`research.md` D-3), so it is measured
 *    without running a command.
 *  - **The end of a process group** is read from the OPERATING SYSTEM, not
 *    from the runner's own record: the time from the result of a command ended
 *    by its time limit to `kill(-group, 0)` reporting `ESRCH`.
 *
 * The statistic asserted is the MEDIAN of the samples. A median is robust to
 * the one slow sample a loaded build machine gives, and every sample is
 * printed, so a regression is visible and not merely a failure.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { formBatches, theCheckRunner } from "../src/index.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE = join(HERE, "..");
const ROOT = join(PACKAGE, "..", "..");
const PLAN = join(ROOT, "specs/148-check-runner/plan.md");
const README = join(PACKAGE, "README.md");
const COMMANDS = join(ROOT, "tests/fixtures/148/commands");

/** The three starting values, read from `plan.md` and not written down here. */
export const GOALS = (() => {
  const line = readFileSync(PLAN, "utf8")
    .split("\n")
    .find((l) => l.startsWith("**Performance Goals**"));
  assert.ok(line !== undefined, "`plan.md` states the Performance Goals");
  const overhead = /Overhead of the runner per command[^:]*:\s*under (\d+) ms/.exec(line);
  const formation = /Batch formation for (\d+) entries:\s*under (\d+) ms/.exec(line);
  const group = /End of a process group after a time limit:\s*within (\d+) s/.exec(line);
  assert.ok(overhead !== null, "`plan.md` gives the overhead per command");
  assert.ok(formation !== null, "`plan.md` gives the batch formation value");
  assert.ok(group !== null, "`plan.md` gives the end of a process group");
  return Object.freeze({
    overheadMs: Number(overhead[1]),
    formationEntries: Number(formation[1]),
    formationMs: Number(formation[2]),
    groupMs: Number(group[1]) * 1_000,
  });
})();

/** The median of the samples: robust to the one slow sample of a loaded host. */
function median(samples: readonly number[]): number {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] as number;
}

/** One measurement, as the README records it. */
type Measurement = {
  readonly min: number;
  readonly median: number;
  readonly max: number;
  readonly samples: number;
};

function summarise(samples: readonly number[]): Measurement {
  return Object.freeze({
    min: Math.min(...samples),
    median: median(samples),
    max: Math.max(...samples),
    samples: samples.length,
  });
}

function report(name: string, m: Measurement, bound: string): void {
  // The numbers are printed so a regression is read from the log and not
  // guessed from a failure.
  console.log(
    `T062 ${name}: min ${m.min.toFixed(2)} ms, median ${m.median.toFixed(2)} ms, ` +
      `max ${m.max.toFixed(2)} ms over ${m.samples} samples (goal: ${bound})`,
  );
}

test("T062: the overhead of the runner per command is under the starting value of `plan.md`", async () => {
  const argv = [process.execPath, join(COMMANDS, "pass.ts")];
  const overhead: number[] = [];
  for (let i = 0; i < 9; i++) {
    const identity = await theCheckRunner.pin({
      id: `t062-run-${i}`,
      kind: "command",
      argv,
      phase: 1,
      timeLimitMs: 30_000,
    });
    const started = performance.now();
    const handle = await theCheckRunner.start({
      identity,
      workingDirectory: ROOT,
      environmentAllowList: [],
      timeLimitMs: 30_000,
      containment: "C0",
    });
    const result = await theCheckRunner.result(handle);
    const wall = performance.now() - started;
    assert.equal(result.passed, true, "the command of the measurement passed");
    // No fingerprint reading was taken: `start` was called with no protected
    // set port, so this is the overhead "without the fingerprint readings".
    assert.equal(result.tainted, false, "no bracket was taken around the measurement");
    overhead.push(Math.max(0, wall - result.durationMs));
  }
  const m = summarise(overhead);
  report("overhead per command", m, `under ${GOALS.overheadMs} ms`);
  assert.ok(
    m.median < GOALS.overheadMs,
    `the median overhead ${m.median.toFixed(2)} ms is under ${GOALS.overheadMs} ms`,
  );
});

test("T062: `pin` is a launch cost dominated by the size of the executable it hashes", async () => {
  const of = async (executable: string): Promise<Measurement> => {
    const samples: number[] = [];
    for (let i = 0; i < 7; i++) {
      const started = performance.now();
      const identity = await theCheckRunner.pin({
        id: `t062-pin-${i}-${executable}`,
        kind: "command",
        argv: [executable],
        phase: 1,
        timeLimitMs: 1_000,
      });
      samples.push(performance.now() - started);
      assert.equal(identity.hash?.length, 64, "pin records a sha256 of the executable");
    }
    return summarise(samples);
  };
  const large = await of(process.execPath);
  const small = await of("/bin/true");
  report(
    `pin, ${(statSync(process.execPath).size / 1e6).toFixed(1)} MB executable`,
    large,
    "no goal: a launch cost, once per entry",
  );
  report(
    `pin, ${(statSync("/bin/true").size / 1e3).toFixed(0)} kB executable`,
    small,
    "no goal: a launch cost, once per entry",
  );
  // The claim this test records: the cost is the hash of the executable, so a
  // small executable is pinned in well under the per-command starting value,
  // and the large one is slower by about the ratio of their sizes.
  assert.ok(
    small.median < GOALS.overheadMs,
    `a small executable is pinned in ${small.median.toFixed(2)} ms`,
  );
  assert.ok(
    large.median > small.median,
    "hashing a 124.8 MB executable costs more than hashing a 43 kB one",
  );
  assert.ok(large.median < 5_000, `pinning \`node\` took ${large.median.toFixed(0)} ms`);
});

test("T062: batch formation for the number of entries `plan.md` names is under its starting value", () => {
  const entries = Array.from({ length: GOALS.formationEntries }, (_, i) => ({
    id: `t062-e${i}`,
    kind: "command" as const,
    argv: ["/bin/true"],
    phase: 1,
    timeLimitMs: 1_000,
    reads: [`src/${i}`],
    writes: [`out/${i}`],
  }));
  const samples: number[] = [];
  let batches = 0;
  for (let i = 0; i < 25; i++) {
    const started = performance.now();
    const plan = formBatches(entries, { parallelism: 4 });
    samples.push(performance.now() - started);
    batches = plan.batches.length;
  }
  const m = summarise(samples);
  report(`batch formation, ${GOALS.formationEntries} entries`, m, `under ${GOALS.formationMs} ms`);
  // The formation did real work: 100 entries at parallelism 4 give 25 batches.
  assert.equal(batches, 25, "the 100 entries formed 25 batches of 4");
  assert.ok(
    m.median < GOALS.formationMs,
    `the median formation ${m.median.toFixed(2)} ms is under ${GOALS.formationMs} ms`,
  );
});

test("T062: a process group is gone within the starting value of `plan.md` after a time limit", async () => {
  const samples: number[] = [];
  for (let i = 0; i < 3; i++) {
    const identity = await theCheckRunner.pin({
      id: `t062-ne-${i}`,
      kind: "command",
      argv: [process.execPath, join(COMMANDS, "never-ending.ts")],
      phase: 1,
      timeLimitMs: 1_000,
    });
    const handle = await theCheckRunner.start({
      identity,
      workingDirectory: ROOT,
      environmentAllowList: [],
      timeLimitMs: 1_000,
      containment: "C0",
    });
    const group = theCheckRunner.processGroupOf(handle);
    assert.ok(typeof group === "number" && group > 0, "a process group was created");
    assert.equal(groupIsGone(group), false, "the group lives while the command runs");
    const result = await theCheckRunner.result(handle);
    assert.equal(result.exitCode, null, "the command ended by its time limit");
    // The measurement: from the result of the time limit to the OPERATING
    // SYSTEM reporting the group gone.
    const started = performance.now();
    while (!groupIsGone(group)) {
      if (performance.now() - started > GOALS.groupMs * 2) break;
      await new Promise((resolve) => setTimeout(resolve, 2));
    }
    samples.push(performance.now() - started);
    assert.equal(groupIsGone(group), true, `the process group ${group} no longer exists`);
  }
  const m = summarise(samples);
  report("end of a process group after a time limit", m, `within ${GOALS.groupMs} ms`);
  assert.ok(
    m.max < GOALS.groupMs,
    `every sample ended the group within ${GOALS.groupMs} ms (slowest ${m.max.toFixed(2)} ms)`,
  );
});

test("T062: README.md records the measured starting values, and each recorded value satisfies `plan.md`", () => {
  const text = readFileSync(README, "utf8");
  const table = text.slice(
    text.indexOf("<!-- performance:begin -->"),
    text.indexOf("<!-- performance:end -->"),
  );
  assert.ok(table.length > 0, "README.md holds the recorded measurement between its markers");

  // Each of the three goals of `plan.md` is a row of the record, and the
  // number the row records satisfies the goal the plan states.
  const rows = table
    .split("\n")
    .map((l) => l.split("|").map((c) => c.trim()))
    .filter((cells) => cells.length >= 6 && cells[1] !== "" && !cells[1]?.startsWith("---"))
    .filter((cells) => cells[1] !== "Starting value of `plan.md`");
  assert.equal(rows.length, 4, "three goals of `plan.md` and the launch cost of `pin`");

  const goalOf = (needle: string): readonly string[] => {
    const row = rows.find((cells) =>
      (cells[1] as string).toLowerCase().includes(needle.toLowerCase()),
    );
    assert.ok(row !== undefined, `README.md records "${needle}"`);
    return row;
  };
  // Columns: | starting value | goal | measured (median) | bound the build asserts | ... |
  const overhead = goalOf("overhead of the runner per command");
  assert.match(overhead[2] as string, new RegExp(`under ${GOALS.overheadMs} ms`));
  assert.ok(
    Number(/([\d.]+)/.exec(overhead[3] as string)?.[1]) < GOALS.overheadMs,
    `the recorded overhead ${overhead[3]} satisfies the goal`,
  );
  const formation = goalOf("batch formation");
  assert.match(formation[2] as string, new RegExp(`under ${GOALS.formationMs} ms`));
  assert.ok(
    Number(/([\d.]+)/.exec(formation[3] as string)?.[1]) < GOALS.formationMs,
    `the recorded formation ${formation[3]} satisfies the goal`,
  );
  const group = goalOf("process group");
  assert.match(group[2] as string, new RegExp(`within ${GOALS.groupMs / 1_000} s`));
  assert.ok(
    Number(/([\d.]+)/.exec(group[3] as string)?.[1]) < GOALS.groupMs,
    `the recorded end of a group ${group[3]} satisfies the goal`,
  );
  const pin = goalOf("`pin`");
  assert.match(pin[2] as string, /no goal/, "`pin` is a launch cost with no goal of its own");

  // The record names the file that re-measures it, so a reader of the README
  // finds the measurement and not only its result.
  assert.match(text, /packages\/check-runner\/test\/performance-148\.test\.ts/);
});

/** Ask the operating system whether a process group still exists. */
function groupIsGone(group: number): boolean {
  try {
    process.kill(-group, 0);
    return false;
  } catch (thrown) {
    // `ESRCH`: no such process group. `EPERM` would mean it exists and is not
    // ours, which is not a pass here.
    return (thrown as { code?: string }).code === "ESRCH";
  }
}
