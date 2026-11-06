/**
 * T209 — the three performance goals of `plan.md`, measured in the build.
 *
 * `specs/100-specstride/plan.md`, "Performance Goals":
 *
 * | Goal | Limit |
 * |---|---|
 * | loading the `contracts` package adds to the start of a command | under 30 ms |
 * | the table evaluator decides for a table of 100 rows | under 1 ms |
 * | the import-boundary check runs on the whole workspace | under 10 s |
 *
 * The plan marks the confidence low: they are starting values, measured in the
 * build. So **a breach is a warning until the values have been measured on
 * three builds**: while `packages/testkit/data/performance-goals.json` holds
 * fewer than three recorded measurements the test reports the breach as a
 * warning and passes; from the third recorded build on, a breach fails.
 *
 * Every measured value is printed as a TAP diagnostic in the form
 * `perf <id> <value> ms (limit <limit> ms)`, so that a build job can record it
 * in the `measurements` list of that file. The test never writes the file: the
 * recorded values are a claim about builds, and a test that writes its own
 * baseline proves nothing.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateTable, loadTable, type LoadedTable } from "@specstride/kernel";
import { run as importBoundary } from "@specstride/import-boundary/src/index.ts";

/** The root of the repository: three levels up from `packages/testkit/test`. */
const ROOT = resolve(dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url))))));

/** Where the goals and the recorded measurements live. */
export const GOALS_FILE = "packages/testkit/data/performance-goals.json";

/** One goal of `plan.md`, as the data file holds it. */
export type PerformanceGoal = {
  readonly id: string;
  readonly subject: string;
  readonly goal: string;
  readonly limitMs: number;
  readonly measures: string;
};

/** One recorded run of this test on a build. */
export type Measurement = {
  readonly build: string;
  readonly date: string;
  readonly platform: string;
  readonly values: Readonly<Record<string, number>>;
};

type GoalsFile = {
  readonly buildsNeededBeforeABreachFails: number;
  readonly goals: readonly PerformanceGoal[];
  readonly measurements: readonly Measurement[];
};

const FILE = JSON.parse(readFileSync(join(ROOT, GOALS_FILE), "utf8")) as GoalsFile;

/** The goal of an id. */
export function goalOf(id: string): PerformanceGoal {
  const goal = FILE.goals.find((g) => g.id === id);
  if (goal === undefined) throw new Error(`${GOALS_FILE} holds no goal \`${id}\``);
  return goal;
}

/** How many builds have recorded a measurement of every goal. */
export function recordedBuilds(): number {
  return FILE.measurements.filter((m) => FILE.goals.every((g) => g.id in m.values)).length;
}

/** True once a breach must fail rather than warn (three recorded builds). */
export function aBreachFails(): boolean {
  return recordedBuilds() >= FILE.buildsNeededBeforeABreachFails;
}

/** The line a build job records, and the diagnostic this test prints. */
export function measuredLine(id: string, valueMs: number): string {
  const goal = goalOf(id);
  return `perf ${id} ${valueMs.toFixed(3)} ms (limit ${goal.limitMs} ms)`;
}

/**
 * Judge one measured value against its goal. A breach is a warning until three
 * builds have recorded the values, and a failure from then on.
 */
export function judge(id: string, valueMs: number, diagnostic: (line: string) => void): void {
  const goal = goalOf(id);
  diagnostic(measuredLine(id, valueMs));
  if (valueMs < goal.limitMs) return;
  const breach =
    `the measured value of \`${id}\` is ${valueMs.toFixed(3)} ms, the goal is under ` +
    `${goal.limitMs} ms (${goal.subject}: ${goal.goal}; plan.md, "Performance Goals")`;
  if (aBreachFails()) assert.fail(breach);
  diagnostic(
    `WARNING: ${breach}. The values have been measured on ${recordedBuilds()} build(s) of ` +
      `${FILE.buildsNeededBeforeABreachFails}, so this is a warning and not a failure ` +
      `(plan.md marks the confidence of the goals low)`,
  );
}

/** A rule table with 100 rows at one decision point, the last one the default. */
export function tableOf100Rows(): LoadedTable {
  const rows: { ruleId: string; when?: unknown; choice: string }[] = [];
  for (let n = 0; n < 99; n++) {
    rows.push({
      ruleId: `R${String(n).padStart(3, "0")}`,
      when: {
        op: "and",
        of: [
          { op: "greater", signal: "count", value: n },
          { op: "member of", signal: "mode", value: ["parity", "default"] },
        ],
      },
      choice: n % 2 === 0 ? "run" : "exclude:flaky",
    });
  }
  rows.push({ ruleId: "R-default", choice: "exclude:slow" });
  return loadTable({
    schema: "specstride.table/1",
    id: "performance-100-rows",
    version: "1",
    points: {
      tools: {
        signals: { count: "Whole number", mode: "Text" },
        choices: ["run", "exclude:flaky", "exclude:slow"],
      },
    },
    rows: { tools: rows },
  });
}

test("T209 goal 1: loading the `contracts` package adds under 30 ms to the start of a command", (t) => {
  // A cold import in a fresh process: the start of a command is what the goal
  // is about, so the measurement may not reuse this process's module cache.
  const entry = join(ROOT, "packages/contracts/src/index.ts");
  // Beside it, the load of one small module of the same package, so that a
  // reader of the value can see how much of it is the module loader of the
  // platform (the package ships TypeScript, which Node strips at load) and
  // how much is the package itself.
  const small = join(ROOT, "packages/contracts/src/ids/roots.ts");
  const script = (target: string): string =>
    `const started = performance.now();` +
    `await import(${JSON.stringify(target)});` +
    `process.stdout.write(String(performance.now() - started));`;
  const measure = (target: string): number => {
    const values: number[] = [];
    for (let k = 0; k < 3; k++) {
      const probe = spawnSync(process.execPath, ["--input-type=module", "-e", script(target)], {
        cwd: ROOT,
        encoding: "utf8",
      });
      assert.equal(probe.status, 0, probe.stderr);
      const value = Number(probe.stdout.trim());
      assert.ok(Number.isFinite(value), probe.stdout);
      values.push(value);
    }
    // The best of three: the goal is about the cost of the load, not about the
    // noise of a shared runner.
    return Math.min(...values);
  };
  const whole = measure(entry);
  const one = measure(small);
  t.diagnostic(`perf contracts-load-one-module ${one.toFixed(3)} ms (not a goal: the loader)`);
  judge("contracts-load", whole, (line) => t.diagnostic(line));
});

test("T209 goal 2: the table evaluator decides in under 1 ms for a table of 100 rows", (t) => {
  const table = tableOf100Rows();
  assert.equal(table.rows.tools.length, 100);
  // Warm the evaluator, then measure the median of 1000 vectors: the goal is
  // about one decision, so the median of many is the honest single value.
  const vectors: Record<string, unknown>[] = [];
  for (let n = 0; n < 1000; n++) {
    vectors.push({ count: n % 120, mode: n % 3 === 0 ? "parity" : "strict" });
  }
  for (const signals of vectors) evaluateTable(table, "tools", signals);
  const durations: number[] = [];
  for (const signals of vectors) {
    const started = performance.now();
    evaluateTable(table, "tools", signals);
    durations.push(performance.now() - started);
  }
  durations.sort((a, b) => a - b);
  const median = durations[Math.floor(durations.length / 2)];
  judge("table-decision", median, (line) => t.diagnostic(line));
});

test("T209 goal 3: the import-boundary check runs in under 10 s on the workspace", (t) => {
  const graph = join(ROOT, "packages/contracts/data/package-graph.json");
  const started = performance.now();
  const report = importBoundary(ROOT, graph, join(ROOT, "tools/import-boundary/rules"));
  const elapsed = performance.now() - started;
  // The measurement is of a real check: it read the whole workspace.
  assert.ok(report.packagesChecked > 0, "the check read the packages of the workspace");
  assert.ok(report.filesChecked > 0, "the check read the source files");
  assert.ok(report.importsChecked > 0, "the check read the imports");
  judge("import-boundary", elapsed, (line) => t.diagnostic(line));
});

test("T209: the three goals of plan.md are the three the test measures, and the rule of the warning", () => {
  assert.deepEqual(
    FILE.goals.map((g) => g.id),
    ["contracts-load", "table-decision", "import-boundary"],
  );
  assert.equal(goalOf("contracts-load").limitMs, 30);
  assert.equal(goalOf("table-decision").limitMs, 1);
  assert.equal(goalOf("import-boundary").limitMs, 10000);
  assert.equal(FILE.buildsNeededBeforeABreachFails, 3);
  // The rule: a breach is a warning until three builds have measured.
  assert.equal(aBreachFails(), recordedBuilds() >= 3);
  // Every recorded measurement names its build, its date and its platform.
  for (const m of FILE.measurements) {
    assert.ok(typeof m.build === "string" && m.build !== "", JSON.stringify(m));
    assert.match(m.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(typeof m.platform === "string" && m.platform !== "");
    for (const [id, value] of Object.entries(m.values)) {
      goalOf(id);
      assert.ok(Number.isFinite(value), `${id}: ${String(value)}`);
    }
  }
  // The measured line a build job records.
  assert.equal(measuredLine("table-decision", 0.0125), "perf table-decision 0.013 ms (limit 1 ms)");
});
