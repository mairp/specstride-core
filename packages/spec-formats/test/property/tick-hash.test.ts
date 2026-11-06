/**
 * T034 — THE PROPERTY TEST OF THE TICK SUBSETS (F104-FR-022, F104-FR-024,
 * F104-FR-026), and the ONE measurement this feature reports as information.
 *
 * The property: over a generated task list, for 1,000 different SUBSETS of its
 * task lines — each subset ticked, and the complement cleared — neither the hash
 * that ignores checkboxes nor the hash of the task-list reading changes, while
 * the CONTENT hash does change for every subset that really moved a byte. That
 * is the guarantee "a tick never makes a run stale" (F104-FR-024), stated as a
 * property rather than as a handful of cases.
 *
 * The subsets are generated from a SEEDED generator written in this file, so a
 * failure is reproducible: the test prints the seed and the subset that broke
 * the property. No clock and no `Math.random` enters the generation.
 *
 * The measurement: the time of parse and hash of a generated task list of 500
 * tasks, against the starting value of `specs/104-spec-input/plan.md`
 * ("starting values, low confidence: parse and hash of a task list of 500 tasks
 * under 100 ms"). It is reported as INFORMATION and is NOT a gate: the value is
 * read from `plan.md` itself, the measurement is printed with its margin, and
 * nothing in this file fails because a machine was slow. A performance number
 * that gates a suite is how a correct change gets blamed on a busy build agent;
 * `IS_A_GATE` below is `false` and the one assertion made about the
 * measurement is that it HAPPENED.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contentHash, taskListHashIgnoringCheckboxes } from "@specstride/kernel/hasher";
import { parse } from "../../src/validate.ts";
import { hashOfReadings, readingsOfModel, readingsOfTasks } from "../../src/task-reading.ts";

/* ------------------------------------------------------------------ *
 * A seeded generator: reproducible, and no clock.
 * ------------------------------------------------------------------ */

/** The seed of every run of this file. A failure is reproducible from it. */
export const SEED = 104_022 as const;

/** How many tick-and-clear subsets the property is checked over. */
const SUBSETS = 1_000;

/** mulberry32: a small, deterministic generator. `Math.random` is never used. */
function generator(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ *
 * The generated task list.
 * ------------------------------------------------------------------ */

/** One generated task line, unticked, with its 1-based line number. */
type Generated = { readonly line: number; readonly text: string };

/**
 * A Spec Kit task list of `count` tasks over `phases` phases. Every task line
 * is a `- [ ] T<nnn>` line, some with markers, some with an id and no text, and
 * one in every tenth place is an EMPTY box `[]`, which the mark rule leaves
 * outside (F104-FR-022) — so the property is checked over a list that holds the
 * lines the rule excludes as well as those it covers.
 */
function taskList(count: number, phases: number): { text: string; tasks: readonly Generated[] } {
  const lines: string[] = ["# Tasks", ""];
  const tasks: Generated[] = [];
  const perPhase = Math.ceil(count / phases);
  let made = 0;
  for (let phase = 1; phase <= phases && made < count; phase += 1) {
    lines.push(`## Phase ${phase}: Generated phase ${phase}`, "");
    for (let inPhase = 0; inPhase < perPhase && made < count; inPhase += 1) {
      made += 1;
      const id = `T${String(made).padStart(3, "0")}`;
      const markers = made % 3 === 0 ? "[P] " : made % 7 === 0 ? "[P] [US2] " : "";
      const body = made % 11 === 0 ? "" : `${markers}generated task ${made}`;
      const box = made % 10 === 0 ? "[]" : "[ ]";
      lines.push(`- ${box} ${id}${body === "" ? "" : ` ${body}`}`);
      tasks.push({ line: lines.length, text: lines[lines.length - 1] as string });
    }
    lines.push("");
  }
  return { text: `${lines.join("\n")}\n`, tasks };
}

/** The same text with the lines of `ticked` marked `[x]` and the others `[ ]`. */
function withSubsetTicked(text: string, ticked: ReadonlySet<number>): string {
  const lines = text.split("\n");
  return lines
    .map((line, index) => {
      const number = index + 1;
      // The EMPTY box is never written over, by F104-FR-017; it is left exactly
      // as it is, so this generator produces only the edits a tick may make.
      if (!/^- \[[ x]\] /.test(line)) return line;
      return ticked.has(number)
        ? line.replace(/^- \[ \] /, "- [x] ")
        : line.replace(/^- \[x\] /, "- [ ] ");
    })
    .join("\n");
}

/* ------------------------------------------------------------------ *
 * The property: 1,000 tick and clear subsets.
 * ------------------------------------------------------------------ */

test(`T034: over ${SUBSETS} tick and clear subsets, neither the hash that ignores checkboxes nor the reading's hash moves (seed ${SEED})`, () => {
  const { text, tasks } = taskList(60, 6);
  // Only the lines the MARK RULE covers can be ticked by the generator: a line
  // with an empty box is excluded above, so the subsets are drawn from these.
  const tickable = tasks.filter((t) => /^- \[ \] /.test(t.text)).map((t) => t.line);
  assert.ok(tickable.length >= 40, `enough tickable lines (${tickable.length})`);

  const base = {
    insensitive: taskListHashIgnoringCheckboxes(text),
    content: contentHash(text),
  };
  const model = parse({
    file: "specs/gen/tasks.md",
    text,
    format: "speckit-tasks",
    feature: "gen",
  });
  const baseReadings = readingsOfModel(model).map((r) => [r.phase, r.hash] as const);
  assert.ok(baseReadings.length >= 6, "every generated phase was read");

  const random = generator(SEED);
  const seen = new Set<string>();
  let contentMoved = 0;
  let contentSame = 0;

  for (let round = 0; round < SUBSETS; round += 1) {
    // A subset of the tickable lines, of a size that varies from empty to all.
    const share = random();
    const ticked = new Set<number>(tickable.filter(() => random() < share));
    const key = [...ticked].sort((a, b) => a - b).join(",");
    seen.add(key);
    const after = withSubsetTicked(text, ticked);
    const where = `round ${round}, seed ${SEED}, ticked {${key}}`;

    // THE PROPERTY — the hash that ignores checkboxes is invariant.
    assert.equal(taskListHashIgnoringCheckboxes(after), base.insensitive, where);

    // And so is the hash of the task-list reading of every phase, because
    // `ticked` is not in a reading (F104-FR-026).
    const now = parse({
      file: "specs/gen/tasks.md",
      text: after,
      format: "speckit-tasks",
      feature: "gen",
    });
    assert.deepEqual(
      readingsOfModel(now).map((r) => [r.phase, r.hash] as const),
      baseReadings,
      where,
    );

    // The CONTENT hash, by contrast, moves exactly when a byte moved — which is
    // what makes the invariance above a real statement and not a vacuous one.
    if (after === text) {
      contentSame += 1;
      assert.equal(contentHash(after), base.content, where);
    } else {
      contentMoved += 1;
      assert.notEqual(contentHash(after), base.content, where);
    }
  }

  // The subsets really did vary, and the content hash really did move: a
  // property test that only ever generated the empty subset would pass
  // vacuously.
  assert.ok(seen.size > SUBSETS / 2, `${seen.size} distinct subsets of ${SUBSETS} rounds`);
  assert.ok(contentMoved > 900, `${contentMoved} subsets moved a byte`);
  assert.ok(contentSame >= 0 && contentSame + contentMoved === SUBSETS);
});

test(`T034: the same property over a CLEAR of an already ticked list (seed ${SEED})`, () => {
  // The other direction of F104-FR-022: "Ticking or clearing a box MUST never
  // change it." The starting point is a list in which every tickable box is
  // already `[x]`, and the subsets CLEAR.
  const { text, tasks } = taskList(40, 4);
  const tickable = tasks.filter((t) => /^- \[ \] /.test(t.text)).map((t) => t.line);
  const allTicked = withSubsetTicked(text, new Set(tickable));
  assert.notEqual(allTicked, text, "the starting point really is a ticked list");

  const insensitive = taskListHashIgnoringCheckboxes(allTicked);
  assert.equal(
    insensitive,
    taskListHashIgnoringCheckboxes(text),
    "the fully ticked and the fully clear list have the SAME hash",
  );

  const random = generator(SEED + 1);
  for (let round = 0; round < 200; round += 1) {
    const share = random();
    const keep = new Set<number>(tickable.filter(() => random() < share));
    const after = withSubsetTicked(allTicked, keep);
    assert.equal(
      taskListHashIgnoringCheckboxes(after),
      insensitive,
      `round ${round}, seed ${SEED + 1}, kept {${[...keep].join(",")}}`,
    );
  }
});

/* ------------------------------------------------------------------ *
 * The measurement, as INFORMATION and not as a gate.
 * ------------------------------------------------------------------ */

/** The starting value is read from `plan.md`, never restated here. */
const PLAN = "specs/104-spec-input/plan.md";

/** This measurement is information. It is NOT a gate (the task says so). */
export const IS_A_GATE = false as const;

/** The confidence `plan.md` itself gives the number. */
export const CONFIDENCE = "low" as const;

/** The starting value of `plan.md`, read from the file and not written out. */
function startingValueOfThePlan(): { readonly tasks: number; readonly milliseconds: number } {
  const text = readFileSync(new URL(`../../../../${PLAN}`, import.meta.url), "utf8");
  const line = text.split("\n").find((l) => l.startsWith("**Performance Goals**"));
  assert.ok(line !== undefined, `${PLAN} holds a line \`**Performance Goals**\``);
  assert.match(line, /low confidence/, `${PLAN} states the confidence of the number`);
  const tasks = /task list of (\d+) tasks/.exec(line);
  const milliseconds = /under (\d+) ms/.exec(line);
  assert.ok(tasks !== null && milliseconds !== null, `${PLAN}: ${line}`);
  return Object.freeze({
    tasks: Number(tasks[1]),
    milliseconds: Number(milliseconds[1]),
  });
}

test("T034: the time of parse and hash of a task list of 500 tasks, reported against the starting value of plan.md — INFORMATION, not a gate", () => {
  const goal = startingValueOfThePlan();
  assert.equal(goal.tasks, 500, "the starting value is about a task list of 500 tasks");
  assert.equal(goal.milliseconds, 100, "the starting value is 100 ms");
  assert.equal(CONFIDENCE, "low");
  assert.equal(IS_A_GATE, false);

  const { text } = taskList(goal.tasks, 10);
  const counted = (text.match(/^- \[[ x]?\] T\d+/gm) ?? []).length;

  // One warm round, so the measurement is of the work and not of the first
  // compile of the regular expressions.
  parse({ file: "specs/gen/tasks.md", text, format: "speckit-tasks", feature: "gen" });

  const rounds = 5;
  const samples: number[] = [];
  for (let round = 0; round < rounds; round += 1) {
    const started = performance.now();
    const model = parse({
      file: "specs/gen/tasks.md",
      text,
      format: "speckit-tasks",
      feature: "gen",
    });
    contentHash(text);
    taskListHashIgnoringCheckboxes(text);
    for (const phase of model.phases) hashOfReadings(readingsOfTasks(phase.tasks));
    samples.push(performance.now() - started);
  }
  const best = Math.min(...samples);
  const median = [...samples].sort((a, b) => a - b)[Math.floor(rounds / 2)] as number;
  const tasksRead = parse({
    file: "specs/gen/tasks.md",
    text,
    format: "speckit-tasks",
    feature: "gen",
  }).phases.reduce((n, p) => n + p.tasks.length, 0);

  const report = [
    `T034 measurement — parse and hash of a generated task list:`,
    `  task lines written: ${counted}; tasks read by the model: ${tasksRead}`,
    `  starting value (${PLAN}, ${CONFIDENCE} confidence): under ${goal.milliseconds} ms`,
    `  measured over ${rounds} rounds: best ${best.toFixed(2)} ms, median ${median.toFixed(2)} ms`,
    `  margin against the starting value: ${(goal.milliseconds - median).toFixed(2)} ms`,
    `  verdict: ${median < goal.milliseconds ? "within" : "OVER"} the starting value`,
    `  this is INFORMATION and not a gate: nothing in this file fails on the number`,
  ].join("\n");
  console.log(report);

  // The ONLY assertions about the measurement are that it HAPPENED and that it
  // measured the right thing. The number itself gates nothing.
  assert.equal(tasksRead, goal.tasks, "the model read all 500 generated tasks");
  assert.equal(samples.length, rounds);
  assert.ok(Number.isFinite(median) && median >= 0, "a measurement was taken");
  assert.ok(report.includes("INFORMATION and not a gate"));
});
