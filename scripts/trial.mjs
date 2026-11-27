#!/usr/bin/env node
/**
 * T041, T042 — the trial of one switch of feature 154 (F154-FR-018, -019).
 *
 *   node scripts/trial.mjs --switch loop.parallel.units \
 *     --fixtures specs/154-concurrency-and-parallelism/contracts/fixtures-154.json
 *
 * The fixture set named by `--fixtures` is run twice through the stub engine
 * (a stub proposer and a stub critic; no model is called): once with every
 * switch of spec 154 off, then with only `--switch` turned on (its
 * environment alias of §K.8). The script then:
 *
 * - TRI-1  runs the breach invariants (`appliedWithoutPassingTheAudits`,
 *          `keptWhileAWorkerProcessLived`) over the events of the switch-on
 *          arm and fails the trial if either finds a breach;
 * - TRI-2  runs the rule tests of the layer (`node --test` over the rule
 *          test files) and reports every rule id they cite;
 * - TRI-3  compares the closed sets the two arms observed — exit codes, stop
 *          reasons (members of `STOP_REASONS` only) and run states (members
 *          of `RUN_STATES` only) — the switch-on set must be a subset of the
 *          switch-off set (F154-FR-002);
 * - and evaluates `passMarkOf` (the pure `trial-pass-mark-table.json`) over
 *   the three signals.
 *
 * The record it writes, `specs/154-concurrency-and-parallelism/trials/
 * <switch>.json`, holds the rows WITHOUT a pass mark (F154-FR-018): groups
 * total and kept, refusals per reason, and the cost with every pass counted.
 * No saving is stated anywhere (F154-FR-008): the record turns nothing on.
 *
 * The first case of every trial is feature 153's 28 groups (F154-FR-019):
 * the frozen record of 153 is read, and the rows come from the record —
 * kept 0 of 28 on record, never a forecast.
 */
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import process from "node:process";

import { runFeature } from "../packages/cli/src/engine/run-feature.ts";
import { workspaceIdOfWorkspace } from "../packages/cli/src/engine/workspace-control-root.ts";
import { passMarkOf } from "../packages/core/src/trial/pass-mark.ts";
import { groupSummaryOf, reportRows154Of } from "../packages/core/src/report/rows.ts";
import {
  appliedWithoutPassingTheAudits,
  keptWhileAWorkerProcessLived,
} from "../packages/core/src/parallel/breach.ts";
import { STOP_REASONS } from "@specstride/contracts/codes/stop-reasons";
import { RUN_STATES } from "@specstride/contracts/state/run-state";

const REPO = new URL("..", import.meta.url).pathname;
const RECORDED_153 = join(REPO, "packages/cli/test/fixtures/loop-speed/recorded-153/expected.json");

/** The environment alias of a key, as `derivedEnvironmentName` spells it. */
function environmentAliasOf(key) {
  const body = key
    .split(".")
    .map((segment) =>
      /^<[A-Za-z]+>$/.test(segment)
        ? segment.toUpperCase()
        : segment.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase(),
    )
    .join("_")
    .replace(/_{2,}/g, "_");
  return `SPECSTRIDE_${body}`;
}

function parseArgs(argv) {
  const args = {
    switch: "loop.parallel.units",
    fixtures: null,
    seed: "154-trial-seed-1",
    out: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--switch") args.switch = argv[++index];
    else if (arg === "--fixtures") args.fixtures = argv[++index];
    else if (arg === "--seed") args.seed = argv[++index];
    else if (arg === "--out") args.out = argv[++index];
    else throw new Error(`trial.mjs: unknown argument ${arg}`);
  }
  return args;
}

// ---------------------------------------------------------------------------
// The stub-engine fixture (the pattern of `tests/inertness/154/helpers.ts`).
// ---------------------------------------------------------------------------

/** The stub `claude` executable: proposer ticks, critic approves. */
function stubClaudeSource() {
  return `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC");
const role = prompt.includes("Diagnostician") ? "diagnostician" : (critic ? "critic" : "proposer");
const log = path.join(process.env.HOME, "prompts.jsonl");
fs.appendFileSync(log, JSON.stringify({ role, prompt, session }) + "\\n");
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (role === "diagnostician") {
  console.log(JSON.stringify({ type: "result", result: "CASE: GROUNDING\\nName the missing test of T001." }));
} else if (critic) {
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  const evidence = (/Write your evidence to (\\.specstride\\S+?) \\(/i.exec(prompt) ?? /write (\\.specstride\\S+?):/i.exec(prompt))[1];
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  fs.mkdirSync(".specstride/features/001-one/outbox", { recursive: true });
  fs.writeFileSync(
    ".specstride/features/001-one/outbox/u1.checkpoint.json",
    JSON.stringify({ schema: "specstride.checkpoint/1", tasks: ["T001", "T002", "T003"] }),
  );
  const tasks = "specs/001-one/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replaceAll("[ ]", "[x]"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;
}

/**
 * One fixture of the trial: a working directory with a task list, a private
 * `HOME`, the stub on `PATH`, and a run function the arm's switches are
 * injected into.
 */
function fixtureOf(tasksPath) {
  const alias = environmentAliasOf(currentSwitch);
  const root = mkdtempSync(join(tmpdir(), "specstride-trial-154-"));
  const bin = join(root, "bin");
  const home = join(root, "home");
  const work = join(root, "work");
  mkdirSync(bin);
  mkdirSync(home);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  writeFileSync(join(bin, "claude"), stubClaudeSource());
  chmodSync(join(bin, "claude"), 0o755);
  writeFileSync(join(work, "specs", "001-one", "tasks.md"), readFileSync(tasksPath, "utf8"));
  writeFileSync(
    join(work, "package.json"),
    JSON.stringify({ scripts: { test: "node bin/noop.cjs" } }),
  );
  mkdirSync(join(work, "bin"), { recursive: true });
  writeFileSync(join(work, "bin", "noop.cjs"), "process.exit(0);\n");
  for (const argv of [
    ["init", "-q"],
    ["config", "user.email", "t@t"],
    ["config", "user.name", "t"],
    ["add", "-A"],
    ["commit", "-qm", "init"],
  ]) {
    spawnSync("git", ["-C", work, ...argv]);
  }
  const before = {
    HOME: process.env.HOME,
    PATH: process.env.PATH,
    PROFILE: process.env.SPECSTRIDE_PROFILE,
    FEATURE: process.env.SPECSTRIDE_FEATURE,
    PROPOSER: process.env.SPECSTRIDE_PROPOSER,
    CRITIC: process.env.SPECSTRIDE_CRITIC,
    PAUSE: process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC,
    LIMITS: process.env.SPECSTRIDE_LIMITS,
    LAUNCH: process.env.SPECSTRIDE_LAUNCH_ID,
    SWITCH: process.env[alias],
  };
  process.env.HOME = home;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  delete process.env.SPECSTRIDE_PROFILE;
  delete process.env.SPECSTRIDE_FEATURE;
  delete process.env.SPECSTRIDE_LAUNCH_ID;
  process.env.SPECSTRIDE_PROPOSER = "claude";
  process.env.SPECSTRIDE_CRITIC = "claude";
  process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = "0";
  process.env.SPECSTRIDE_LIMITS = "on";

  const readEvents = () => {
    const control = join(home, ".specstride", "workspaces", workspaceIdOfWorkspace(work));
    const roots = [control, join(home, ".local", "state", "specstride", "workspaces", "001-one")];
    const all = [];
    for (const base of roots) {
      for (const runs of [join(base, "runs"), join(base, "features", "001-one", "runs")]) {
        for (const run of existsSync(runs) ? readdirSync(runs).sort() : []) {
          const file = join(runs, run, "events.jsonl");
          if (!existsSync(file)) continue;
          for (const line of readFileSync(file, "utf8").split("\n")) {
            if (line.trim() === "") continue;
            all.push(JSON.parse(line));
          }
        }
      }
    }
    return all;
  };

  return {
    id: `trial:${tasksPath}`,
    /** Run the engine once; `switchesOn` sets this trial's switch on. */
    run: async (switchesOn) => {
      const key = environmentAliasOf(currentSwitch);
      if (switchesOn) process.env[key] = "on";
      else delete process.env[key];
      try {
        return await runFeature({ argv: [], workdir: work });
      } finally {
        delete process.env[key];
      }
    },
    events: readEvents,
    restore: () => {
      process.env.HOME = before.HOME;
      process.env.PATH = before.PATH;
      for (const [name, value] of Object.entries({
        SPECSTRIDE_PROFILE: before.PROFILE,
        SPECSTRIDE_FEATURE: before.FEATURE,
        SPECSTRIDE_PROPOSER: before.PROPOSER,
        SPECSTRIDE_CRITIC: before.CRITIC,
        SPECSTRIDE_PROPOSER_PAUSE_SEC: before.PAUSE,
        SPECSTRIDE_LIMITS: before.LIMITS,
        SPECSTRIDE_LAUNCH_ID: before.LAUNCH,
        [beforeSwitchAlias]: before.SWITCH,
      })) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
      rmSync(root, { recursive: true, force: true });
    },
  };
}

/** The switch the fixture builder arms; a module-level binding is simplest. */
let currentSwitch = "loop.parallel.units";
let beforeSwitchAlias = "SPECSTRIDE_LOOP_PARALLEL_UNITS";

// ---------------------------------------------------------------------------
// The rows.
// ---------------------------------------------------------------------------

/** The rows WITHOUT a pass mark, read with the report projection (T041). */
function rowsOf(events) {
  const asRecords = events.map((event) => ({
    type: event.type,
    at: typeof event.ts === "string" ? Date.parse(event.ts) : event.at,
    data: event.data,
  }));
  const report = reportRows154Of(asRecords, "154-concurrency-and-parallelism");
  const summary = groupSummaryOf(asRecords);
  const ended = report.groups;
  const groupsTotal = ended.length;
  const groupsKept = ended.filter((group) => group.outcome === "integrated").length;
  const refusals = new Map();
  for (const [reason, count] of Object.entries(summary.workerRefusalsByReason)) {
    refusals.set(reason, count);
  }
  // Every proposer pass counted (F154-FR-018): a pass is an `iter_start`;
  // a cycle is an attempt of a phase (`attempt.started`).
  const passes = events.filter((event) => event.type === "iter_start").length;
  const cycles = events.filter((event) => event.type === "attempt.started").length;
  let tokensIn = 0;
  let tokensOut = 0;
  for (const event of events) {
    tokensIn += typeof event.data.tokensIn === "number" ? event.data.tokensIn : 0;
    tokensOut += typeof event.data.tokensOut === "number" ? event.data.tokensOut : 0;
  }
  return {
    groupsTotal,
    groupsKept,
    refusalsPerReason: [...refusals].map(([reason, count]) => ({ reason, count })),
    costWithEveryPassCounted: { passes, tokensIn, tokensOut, cycles },
  };
}

/** The sum of two arms' row sets; refusal reasons merge by count. */
function addRows(a, b) {
  if (a === null) return b;
  const refusals = new Map();
  for (const { reason, count } of [...a.refusalsPerReason, ...b.refusalsPerReason]) {
    refusals.set(reason, (refusals.get(reason) ?? 0) + count);
  }
  return {
    groupsTotal: a.groupsTotal + b.groupsTotal,
    groupsKept: a.groupsKept + b.groupsKept,
    refusalsPerReason: [...refusals].map(([reason, count]) => ({ reason, count })),
    costWithEveryPassCounted: {
      passes: a.costWithEveryPassCounted.passes + b.costWithEveryPassCounted.passes,
      tokensIn: a.costWithEveryPassCounted.tokensIn + b.costWithEveryPassCounted.tokensIn,
      tokensOut: a.costWithEveryPassCounted.tokensOut + b.costWithEveryPassCounted.tokensOut,
      cycles: a.costWithEveryPassCounted.cycles + b.costWithEveryPassCounted.cycles,
    },
  };
}

/** The members of a closed vocabulary the events of one arm named. */
function vocabularyOf(events, field, members) {
  const found = new Set();
  for (const event of events) {
    const value = event.data[field];
    if (typeof value === "string" && members.includes(value)) found.add(value);
  }
  return [...found].sort();
}

/** TRI-1: the breach invariants over the switch-on events. */
function breachInvariantFails(events) {
  const asRecords = events.map((event) => ({
    type: event.type,
    at: typeof event.ts === "string" ? Date.parse(event.ts) : event.at,
    data: event.data,
  }));
  return {
    appliedWithoutPassingTheAudits: appliedWithoutPassingTheAudits(asRecords).length,
    keptWhileAWorkerProcessLived: keptWhileAWorkerProcessLived(asRecords).length,
  };
}

/** TRI-2: run the rule tests; report every rule id the passing files cite. */
function runRuleTests(repo) {
  const files = [
    "packages/core/test/tables-154.test.ts",
    "packages/core/test/slot-admission-154.test.ts",
    "packages/core/test/audits-154.test.ts",
    "packages/core/test/report-rows-154.test.ts",
    "tests/parallel/154/plan-print.test.ts",
  ];
  const citedBy = {
    "packages/core/test/tables-154.test.ts": [
      "LD-1",
      "LD-2",
      "LD-3",
      "LD-4",
      "PQ-1",
      "PQ-2",
      "PQ-3",
      "SL-1",
      "SL-2",
      "SL-3",
      "SL-4",
      "SL-5",
      "SP-1",
      "SP-2",
      "SP-3",
      "SP-4",
      "SP-5",
      "SP-6",
    ],
    "packages/core/test/slot-admission-154.test.ts": ["SL-1", "SL-2", "SL-3", "SL-4", "SL-5"],
  };
  const results = [];
  let everyPassed = true;
  for (const file of files) {
    const outcome = spawnSync("node", ["--experimental-strip-types", "--test", join(repo, file)], {
      cwd: repo,
      encoding: "utf8",
    });
    const passed = outcome.status === 0;
    if (!passed) {
      everyPassed = false;
      process.stderr.write(`trial.mjs: rule tests failed in ${file}\n${outcome.stdout ?? ""}\n`);
    }
    for (const ruleId of citedBy[file] ?? []) {
      results.push({ ruleId, passed });
    }
  }
  return { results, everyPassed };
}

/** The recorded read of feature 153's 28 groups (F154-FR-019). */
function firstCaseOf() {
  const expected = JSON.parse(readFileSync(RECORDED_153, "utf8"));
  const byOutcome = expected.groupsByOutcome ?? {};
  const groupsTotal = Object.values(byOutcome).reduce((sum, count) => sum + count, 0);
  const groupsKept = byOutcome.integrated ?? 0;
  return { name: "replay of 153's 28 groups", groupsTotal, groupsKept };
}

// ---------------------------------------------------------------------------
// The trial.
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fixturesPath =
    args.fixtures ??
    join(REPO, "specs/154-concurrency-and-parallelism/contracts/fixtures-154.json");
  currentSwitch = args.switch;
  beforeSwitchAlias = environmentAliasOf(args.switch);

  // The members of the named fixture set the tree can run through the stub
  // engine today: the plan fixture (FX-154-PLAN) and the groups fixture
  // (FX-154-GROUPS). The fixtures whose trials belong to later slices
  // (slots, stages, phases, spec groups) have no stub fixture in the tree
  // yet; they are named in the record's `fixtureSet` and are not exercised
  // by this trial — never a stand-in result for them.
  const fixtureFile = JSON.parse(readFileSync(fixturesPath, "utf8"));
  const runnable = {
    "FX-154-PLAN": "tests/fixtures/154/plan/tasks.md",
    "FX-154-GROUPS": "tests/fixtures/154/groups/tasks.md",
  };
  const members = fixtureFile.fixtures.map((fixture) => fixture.id);
  const exercised = members.filter((id) => runnable[id] !== undefined);
  const notExercised = members.filter((id) => runnable[id] === undefined);
  if (exercised.length === 0) {
    process.stderr.write("trial.mjs: no runnable fixture of the named set\n");
    return 2;
  }

  const exits = { off: [], on: [] };
  const rows = { off: null, on: null };
  const eventsOn = [];
  const vocab = {
    off: { stopReasons: new Set(), runStates: new Set() },
    on: { stopReasons: new Set(), runStates: new Set() },
  };

  for (const fixtureId of exercised) {
    const fixture = fixtureOf(join(REPO, runnable[fixtureId]));
    try {
      const exitOff = await fixture.run(false);
      const eventsOff = fixture.events();
      exits.off.push(exitOff);
      rows.off = addRows(rows.off, rowsOf(eventsOff));
      const exitOn = await fixture.run(true);
      const onEvents = fixture.events();
      exits.on.push(exitOn);
      rows.on = addRows(rows.on, rowsOf(onEvents));
      eventsOn.push(...onEvents);
      for (const value of vocabularyOf(eventsOff, "reason", STOP_REASONS))
        vocab.off.stopReasons.add(value);
      for (const value of vocabularyOf(onEvents, "reason", STOP_REASONS))
        vocab.on.stopReasons.add(value);
      for (const value of vocabularyOf(eventsOff, "state", RUN_STATES))
        vocab.off.runStates.add(value);
      for (const value of vocabularyOf(onEvents, "state", RUN_STATES))
        vocab.on.runStates.add(value);
    } finally {
      fixture.restore();
    }
  }

  // TRI-1 — the breach invariants over the switch-on events.
  const breaches = breachInvariantFails(eventsOn);
  const noBreachInvariantFails =
    breaches.appliedWithoutPassingTheAudits === 0 && breaches.keptWhileAWorkerProcessLived === 0;

  // TRI-2 — the rule tests.
  const ruleTests = runRuleTests(REPO);

  // TRI-3 — the closed sets: the switch-on set must be a subset of the off set.
  const subset = (on, off) => [...on].every((value) => off.includes(value));
  const exitCodesOn = [...new Set(exits.on.map(String))].sort();
  const exitCodesOff = [...new Set(exits.off.map(String))].sort();
  const stopReasonsOn = [...vocab.on.stopReasons].sort();
  const stopReasonsOff = [...vocab.off.stopReasons].sort();
  const runStatesOn = [...vocab.on.runStates].sort();
  const runStatesOff = [...vocab.off.runStates].sort();
  const closedSets = {
    exitCodesAreSubset: subset(exitCodesOn, exitCodesOff),
    stopReasonsAreSubset: subset(stopReasonsOn, stopReasonsOff),
    runStatesAreSubset: subset(runStatesOn, runStatesOff),
  };
  const closedSetsAreSubsets =
    closedSets.exitCodesAreSubset &&
    closedSets.stopReasonsAreSubset &&
    closedSets.runStatesAreSubset;

  // The pass mark, from the pure table.
  const mark = passMarkOf({
    noBreachInvariantFails,
    everyRuleTestPasses: ruleTests.everyPassed,
    closedSetsAreSubsets,
  });

  // The record.
  const record = {
    schema: "specstride.trial/1",
    switch: args.switch,
    fixtureSet: fixtureFile.fixtures
      ? `${fixtureFile.fixtures.length} fixtures of ${fixtureFile.feature}`
      : fixturesPath,
    firstCase: firstCaseOf(),
    arms: [
      { switchValue: false, seed: args.seed, rowsWithoutPassMark: rows.off },
      { switchValue: true, seed: args.seed, rowsWithoutPassMark: rows.on },
    ],
    ruleTests: [
      ...ruleTests.results,
      { ruleId: "TRI-1", passed: noBreachInvariantFails },
      { ruleId: "TRI-2", passed: ruleTests.everyPassed },
      { ruleId: "TRI-3", passed: closedSetsAreSubsets },
    ],
    breachInvariantsFailed: noBreachInvariantFails
      ? []
      : Object.entries(breaches)
          .filter(([, count]) => count > 0)
          .map(([name]) => name),
    closedSets,
    pass: mark.choice === "pass",
    rowsWithoutPassMark: mark.choice === "pass" ? rows.on : rows.off,
  };

  const outDir =
    args.out === null ? join(REPO, "specs/154-concurrency-and-parallelism/trials") : args.out;
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, `${args.switch}.json`);
  writeFileSync(outFile, `${JSON.stringify(record, null, 2)}\n`);
  process.stdout.write(
    `trial.mjs: wrote ${outFile}\n` +
      `  pass mark: ${mark.choice} (${mark.ruleId})\n` +
      `  groups: ${rows.on?.groupsKept ?? 0} kept of ${rows.on?.groupsTotal ?? 0} (switch on)\n` +
      `  not exercised by this trial: ${notExercised.join(", ") || "none"}\n`,
  );
  return mark.choice === "pass" ? 0 : 1;
}

process.exitCode = await main();
