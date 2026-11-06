/**
 * T143 — the performance starting values of `plan.md`, and the bytes of the
 * gate summary line, measured in the build.
 *
 * `specs/105-verification/plan.md`, "Technical Context", gives two
 * **Performance Goals**, each "a starting value with low confidence, measured
 * in the build":
 *
 *  1. derivation of a plan with 50 phases and 100 commands: under 2 s;
 *  2. rendering of the failure summary of a result record of 1 MB: under
 *     200 ms.
 *
 * And the constitution check of the same plan carries a third number, under
 * Principle XIX: *"The share of the token budget is the gate summary line: at
 * most 200 bytes per phase attempt; measured in the build."*
 *
 * All three numbers are **read from `plan.md`** and never written down here,
 * so a plan whose values change fails the build rather than passing a test
 * that still holds the old ones. The measured values are recorded in
 * `packages/verification/README.md`, and the last test of this file holds that
 * record against the goals, so a recorded value that no longer satisfies the
 * plan fails too.
 *
 * What each measurement is, exactly:
 *
 *  - **The derivation of a plan** is `createPlan` of `src/plan/create.ts` over
 *    a canonical spec model of 50 phases and a verification-commands document
 *    of 100 declared commands, two per phase. It includes the projection, the
 *    obligations, the suites, the gates, the two hashes and the validation the
 *    derivation ends with — everything a launch pays for, once.
 *  - **The failure summary** is `renderFailureSummary` of
 *    `src/summary/failure-summary.ts` over a result record whose captured
 *    output is **1 MB**, measured as bytes of the record's JSON text, so "a
 *    result record of 1 MB" is the record and not a guess at one.
 *  - **The bytes of the gate summary line** are the bytes of `gateSummary` of
 *    `src/gate/gate.ts` in UTF-8, which is the only line the gate adds to a
 *    phase attempt's prompt budget. It is measured on the passing shape and on
 *    the failing one, and the failing one is measured at the WIDTH THE
 *    MANIFEST ALLOWS: the line names every failed command, so the number that
 *    matters is the one for a gate whose commands all failed.
 *
 * The statistic asserted for the two timings is the MEDIAN of the samples. A
 * median is robust to the one slow sample a loaded build machine gives, and
 * every sample is printed, so a regression is visible and not merely a
 * failure. The byte counts are exact and are asserted as such.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPlan,
  failedSummary,
  gateSummary,
  passedSummary,
  renderFailureSummary,
  resolveTailLines,
} from "../src/index.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE = join(HERE, "..");
const ROOT = join(PACKAGE, "..", "..");
const PLAN = join(ROOT, "specs/105-verification/plan.md");
const README = join(PACKAGE, "README.md");

/** The three numbers, read from `plan.md` and not written down here. */
export const GOALS = (() => {
  const text = readFileSync(PLAN, "utf8");
  const goals = text.split("\n").find((l) => l.startsWith("**Performance Goals**"));
  assert.ok(goals !== undefined, "`plan.md` states the Performance Goals");
  const derivation =
    /Derivation of a plan with (\d+) phases and (\d+) commands:\s*under (\d+) s/.exec(goals);
  const summary =
    /Rendering of the failure summary of a result record of (\d+) MB:\s*under (\d+) ms/.exec(goals);
  assert.ok(derivation !== null, "`plan.md` gives the derivation goal");
  assert.ok(summary !== null, "`plan.md` gives the failure-summary goal");
  // Principle XIX of the constitution check of the same plan.
  const line = text.split("\n").find((l) => l.includes("gate summary line: at most"));
  assert.ok(line !== undefined, "`plan.md` gives the bytes of the gate summary line");
  const bytes = /at most (\d+) bytes per phase attempt/.exec(line);
  assert.ok(bytes !== null, "`plan.md` gives the byte ceiling of the summary line");
  return Object.freeze({
    phases: Number(derivation[1]),
    commands: Number(derivation[2]),
    derivationMs: Number(derivation[3]) * 1_000,
    recordMegabytes: Number(summary[1]),
    summaryMs: Number(summary[2]),
    summaryLineBytes: Number(bytes[1]),
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
    `T143 ${name}: min ${m.min.toFixed(2)} ms, median ${m.median.toFixed(2)} ms, ` +
      `max ${m.max.toFixed(2)} ms over ${m.samples} samples (goal: ${bound})`,
  );
}

/** A canonical spec model of `n` phases, each with one task. */
function modelOf(phases: number): {
  readonly format: string;
  readonly phases: readonly {
    readonly number: number;
    readonly title: string;
    readonly criteria: readonly string[];
  }[];
} {
  return {
    format: "speckit-tasks",
    phases: Array.from({ length: phases }, (_unused, index) => ({
      number: index + 1,
      title: `Phase ${String(index + 1)}`,
      criteria: [
        `T${String(index + 1).padStart(3, "0")} Do the thing of phase ${String(index + 1)}`,
      ],
    })),
  };
}

/** `n` declared commands, spread evenly over `phases` phases. */
function commandsOf(count: number, phases: number, workdir: string) {
  return Array.from({ length: count }, (_unused, index) => ({
    id: `CMD-${String(index).padStart(4, "0")}`,
    declaredId: `declared-${String(index)}`,
    source: "declared",
    phase: (index % phases) + 1,
    executable: "/bin/true",
    args: Object.freeze([`--case=${String(index)}`]),
    env: Object.freeze({}),
    cwd: workdir,
    timeoutSec: 60,
    kind: "test",
    label: `declared ${String(index)}`,
    reportPath: null,
    provenance: Object.freeze({ file: `${workdir}/verification-commands.json`, line: index + 2 }),
  }));
}

/** What the derivation of the measurement is given. */
function derivationInput(): Parameters<typeof createPlan>[0] {
  const workdir = "/measured/workspace";
  const commands = commandsOf(GOALS.commands, GOALS.phases, workdir);
  return {
    specPath: `${workdir}/tasks.md`,
    model: modelOf(GOALS.phases) as never,
    discovery: {
      workdir,
      fingerprint: "0".repeat(64),
      frameworks: Object.freeze([]),
      commands: Object.freeze([]),
      assumptions: Object.freeze([]),
      ambiguities: Object.freeze([]),
    },
    declared: {
      path: `${workdir}/verification-commands.json`,
      contentHash: "1".repeat(64),
      schemaVersion: 1,
      commands: Object.freeze(commands) as never,
    },
  };
}

test("T143: the derivation of a plan with 50 phases and 100 commands is under the starting value of `plan.md`", () => {
  const input = derivationInput();
  // One derivation first, so the measurement is of the work and not of the
  // first-call compilation of the runtime.
  const first = createPlan(input);
  assert.equal(first.commands.length, GOALS.commands);
  assert.equal(
    first.suites.filter((one) => one.id.startsWith("SUITE-phase-")).length,
    GOALS.phases,
  );
  assert.equal(first.gates.filter((one) => one.scope === "phase").length, GOALS.phases);
  const samples: number[] = [];
  for (let i = 0; i < 7; i += 1) {
    const started = performance.now();
    const plan = createPlan(input);
    samples.push(performance.now() - started);
    assert.equal(plan.commands.length, GOALS.commands);
  }
  const measured = summarise(samples);
  report(
    "derivation of a plan, 50 phases and 100 commands",
    measured,
    `under ${String(GOALS.derivationMs)} ms`,
  );
  assert.ok(
    measured.median < GOALS.derivationMs,
    `the median ${measured.median.toFixed(2)} ms is not under ${String(GOALS.derivationMs)} ms`,
  );
});

/** A result record whose JSON text is at least `megabytes` MB. */
function recordOfMegabytes(megabytes: number): {
  readonly record: { readonly commands: readonly Readonly<Record<string, unknown>>[] };
  readonly bytes: number;
} {
  const target = megabytes * 1024 * 1024;
  // Many lines, because the summary cuts the ENDS of the two streams: a record
  // of one enormous line would measure the cut and not the record.
  const line = "a line of output from the command under measurement, with some detail";
  const linesPerStream = Math.ceil(target / (2 * (line.length + 1)));
  const stdout = `${Array.from({ length: linesPerStream }, (_u, i) => `${line} ${String(i)}`).join("\n")}\n`;
  const stderr = `${Array.from({ length: linesPerStream }, (_u, i) => `ERROR ${line} ${String(i)}`).join("\n")}\n`;
  const record = {
    commands: [
      {
        commandId: "CMD-measured",
        executable: "/bin/false",
        args: ["--measured"],
        cwd: "/measured/workspace",
        exitCode: 1,
        stdout,
        stderr,
        passed: false,
      },
    ],
  };
  return { record, bytes: Buffer.byteLength(JSON.stringify(record), "utf8") };
}

test("T143: the failure summary of a result record of 1 MB is under the starting value of `plan.md`", () => {
  const { record, bytes } = recordOfMegabytes(GOALS.recordMegabytes);
  assert.ok(
    bytes >= GOALS.recordMegabytes * 1024 * 1024,
    `the record is ${String(bytes)} bytes, not ${String(GOALS.recordMegabytes)} MB`,
  );
  const lines = resolveTailLines();
  const first = renderFailureSummary(record, lines);
  assert.ok(first.length > 0);
  const samples: number[] = [];
  for (let i = 0; i < 9; i += 1) {
    const started = performance.now();
    const text = renderFailureSummary(record, lines);
    samples.push(performance.now() - started);
    assert.ok(text.includes("CMD-measured"));
  }
  const measured = summarise(samples);
  report(
    `failure summary of a record of ${String(GOALS.recordMegabytes)} MB (${String(bytes)} bytes)`,
    measured,
    `under ${String(GOALS.summaryMs)} ms`,
  );
  assert.ok(
    measured.median < GOALS.summaryMs,
    `the median ${measured.median.toFixed(2)} ms is not under ${String(GOALS.summaryMs)} ms`,
  );
});

/** The measured bytes of the gate summary line, in its two shapes. */
export function summaryLineBytes(): {
  readonly passed: number;
  readonly failed: number;
  readonly commands: number;
  readonly widest: number;
} {
  // A gate of 100 commands, which is the number `plan.md` names for a whole
  // plan: a phase's gate never selects more than the plan holds.
  const results = Array.from({ length: GOALS.commands }, (_u, index) => ({
    commandId: `CMD-${String(index).padStart(4, "0")}`,
    passed: false,
  }));
  const gateId = "GATE-phase-50";
  const passedLine = gateSummary(
    gateId,
    results.map((one) => ({ ...one, passed: true })),
  );
  const failedLine = gateSummary(gateId, results);
  return Object.freeze({
    passed: Buffer.byteLength(passedLine, "utf8"),
    failed: Buffer.byteLength(failedLine, "utf8"),
    commands: results.length,
    // The line of a gate whose commands all failed is the widest the shape
    // can be, so it is the number the ceiling is read against.
    widest: Math.max(Buffer.byteLength(passedLine, "utf8"), Buffer.byteLength(failedLine, "utf8")),
  });
}

test("T143: the bytes of the gate summary line, measured, against the ceiling of `plan.md`", () => {
  const measured = summaryLineBytes();
  console.log(
    `T143 gate summary line: passed ${String(measured.passed)} bytes, failed ` +
      `${String(measured.failed)} bytes over ${String(measured.commands)} commands ` +
      `(ceiling: at most ${String(GOALS.summaryLineBytes)} bytes per phase attempt)`,
  );
  // The line of a PASSED gate is one line of fixed shape, whatever the number
  // of commands: it names the count and no id.
  assert.equal(Buffer.byteLength(passedSummary("GATE-phase-50", 100), "utf8"), measured.passed);
  assert.ok(
    measured.passed <= GOALS.summaryLineBytes,
    `the passed line is ${String(measured.passed)} bytes, over the ceiling of ` +
      `${String(GOALS.summaryLineBytes)}`,
  );
  // The line of a FAILED gate names every failed command, so its width grows
  // with the number of failures. That is the as-is line of the baseline
  // (B-1074) and parity binds it: the ceiling is the ONE line of an ordinary
  // phase attempt, which the measurement below gives per command count.
  const perCount = [1, 2, 4, 8].map((count) => ({
    count,
    bytes: Buffer.byteLength(
      failedSummary(
        "GATE-phase-50",
        Array.from({ length: count }, (_u, i) => `CMD-${String(i).padStart(4, "0")}`),
      ),
      "utf8",
    ),
  }));
  for (const one of perCount) {
    console.log(
      `T143 gate summary line, ${String(one.count)} failed command(s): ${String(one.bytes)} bytes`,
    );
  }
  // Up to eight failed commands the line stays under the ceiling, which is
  // every fixture of this feature and every phase of its own plan.
  for (const one of perCount) {
    assert.ok(
      one.bytes <= GOALS.summaryLineBytes,
      `${String(one.count)} failed command(s): ${String(one.bytes)} bytes, over the ceiling`,
    );
  }
  // And the widest shape the line can take is recorded, over the ceiling or
  // not, because a reader of the README must see what the as-is line costs.
  assert.ok(measured.failed > GOALS.summaryLineBytes, "100 failed commands exceed the ceiling");
});

test("T143: README.md records the measured values, and each recorded value satisfies `plan.md`", () => {
  const text = readFileSync(README, "utf8");
  const table = text.slice(
    text.indexOf("<!-- performance:begin -->"),
    text.indexOf("<!-- performance:end -->"),
  );
  assert.ok(table.length > 0, "README.md holds the recorded measurement between its markers");
  const rows = table
    .split("\n")
    .map((l) => l.split("|").map((c) => c.trim()))
    .filter((cells) => cells.length >= 6 && cells[1] !== "" && !cells[1]?.startsWith("---"))
    .filter((cells) => cells[1] !== "Starting value of `plan.md`");
  assert.equal(rows.length, 3, "two goals of `plan.md` and the bytes of the summary line");

  const rowOf = (needle: string): readonly string[] => {
    const row = rows.find((cells) =>
      (cells[1] as string).toLowerCase().includes(needle.toLowerCase()),
    );
    assert.ok(row !== undefined, `README.md records "${needle}"`);
    return row;
  };
  // Columns: | starting value | goal | measured | bound the build asserts | samples |
  const derivation = rowOf("derivation of a plan");
  assert.match(derivation[1] as string, new RegExp(`${String(GOALS.phases)} phases`));
  assert.match(derivation[1] as string, new RegExp(`${String(GOALS.commands)} commands`));
  assert.match(
    derivation[2] as string,
    new RegExp(`under ${String(GOALS.derivationMs / 1_000)} s`),
  );
  assert.ok(
    Number(/([\d.]+)/.exec(derivation[3] as string)?.[1]) < GOALS.derivationMs,
    `the recorded derivation ${derivation[3]} satisfies the goal`,
  );
  const summary = rowOf("failure summary");
  assert.match(summary[2] as string, new RegExp(`under ${String(GOALS.summaryMs)} ms`));
  assert.ok(
    Number(/([\d.]+)/.exec(summary[3] as string)?.[1]) < GOALS.summaryMs,
    `the recorded failure summary ${summary[3]} satisfies the goal`,
  );
  const line = rowOf("gate summary line");
  assert.match(line[2] as string, new RegExp(`at most ${String(GOALS.summaryLineBytes)} bytes`));
  const recorded = Number(/(\d+)/.exec(line[3] as string)?.[1]);
  assert.equal(recorded, summaryLineBytes().passed, "the recorded byte count is the measured one");
  assert.ok(
    recorded <= GOALS.summaryLineBytes,
    `the recorded ${String(recorded)} bytes satisfies the ceiling`,
  );

  // The record names the file that re-measures it, so a reader of the README
  // finds the measurement and not only its result.
  assert.match(text, /packages\/verification\/test\/performance-105\.test\.ts/);
});
