/**
 * G8 T163 (feature 154, phase 17) — THE CLOSED-SETS GUARD
 * (F154-SC-001, F154-FR-002).
 *
 * Over EVERY fixture of `tests/fixtures/154/` (plan, groups, slots, stages,
 * phases, spec — `door` is skipped exactly as
 * `tests/parallel/154/one-validator.test.ts` skips it: FX-154-DOOR holds no
 * task that runs under this engine fixture) the stub engine runs TWICE: once
 * with every switch of spec 154 off (the baseline) and once with every
 * switch on (`SPECSTRIDE_LOOP_PHASES_PARALLEL=on`,
 * `SPECSTRIDE_LOOP_SPECULATE=on`, `SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS=on`,
 * `SPECSTRIDE_LOOP_PARALLEL_GROUP_CHECK=on` — the catalogue's environment
 * names of `loop.phases.parallel`, `loop.speculate`,
 * `loop.parallel.groupUnits` and `loop.parallel.groupCheck`, derived by
 * `derivedEnvironmentName` of `packages/config/src/schema/spelling.ts` and
 * read through the merge in `packages/cli/src/engine/loop-config.ts`).
 *
 * In BOTH runs the test collects the closed vocabularies F154-FR-002 names:
 *   - the exit codes (the values `runFeature` returns),
 *   - the stop reasons (`endCause` on `attempt.ended`/`pass.ended`,
 *     `stopReason` on `run.ended`, the non-start `reason` of
 *     `loop.speculation.admission` — `rate`, `depth` or `sweep`),
 *   - the run states (the `state`/`states` letters of `run.started` and the
 *     `outcome` of `run.ended`/`phase.ended`/`attempt.*`).
 * The assertion of F154-SC-001: with the switches ON, each of the three sets
 * is a SUBSET of the corresponding baseline set — the on-runs add no exit
 * code, no stop reason and no run state. Both runs per fixture exit 0.
 *
 * The hermetic harness is the stub fixture of `tests/inertness/154/helpers.ts`
 * (`fixture154`), copied here and parameterised by fixture directory and
 * switch environment: private `HOME`, stub `claude` on `PATH`, the events
 * reader over the control plane, `rmSync` in `finally`. Stub sleeps are 0.
 *
 * Run from the repository root:
 *     node --experimental-strip-types --test tests/inertness/154/closed-sets-154.test.ts
 */
import assert from "node:assert/strict";
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
import test from "node:test";

import { workspaceIdOfWorkspace } from "../../../packages/cli/src/engine/workspace-control-root.ts";
import { runFeature } from "../../../packages/cli/src/engine/run-feature.ts";

/** The fixture directories of T011 under `tests/fixtures/154/`, minus `door`. */
const FIXTURE_DIRS = [
  "plan",
  "groups",
  "slots",
  "stages",
  "phases",
  "spec",
] as const;

/**
 * `door` is dropped from the loop (kept from `phases` and `groups` as the
 * task requires): FX-154-DOOR names the adapter descriptor of the fake-binary
 * test in its stub configuration, so the engine fixture below cannot drive it
 * to exit 0 — the same reason `tests/parallel/154/one-validator.test.ts`
 * skips it.
 */

/** The environment names of the four switches of spec 154, all set to `on`. */
const SWITCH_VARS = [
  "SPECSTRIDE_LOOP_PHASES_PARALLEL",
  "SPECSTRIDE_LOOP_SPECULATE",
  "SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS",
  "SPECSTRIDE_LOOP_PARALLEL_GROUP_CHECK",
] as const;

type Event = { type: string; at?: string; data: Record<string, unknown> };

/** The stub `claude` of `helpers.ts`: proposer ticks, critic approves. */
function stubClaude(): string {
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
  const n = fs.existsSync(log + ".calls") ? Number(fs.readFileSync(log + ".calls", "utf8")) : 0;
  fs.writeFileSync(log + ".calls", String(n + 1));
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

/** One closed-sets fixture: a working directory, a private `HOME`, the stub on `PATH`. */
function fixture154(fixtureDir: string, switches: "off" | "on"): {
  readonly run: () => Promise<number>;
  readonly events: () => readonly Event[];
  readonly restore: () => void;
} {
  const root = mkdtempSync(join(tmpdir(), "specstride-closed-154-"));
  const bin = join(root, "bin");
  const home = join(root, "home");
  const work = join(root, "work");
  mkdirSync(bin);
  mkdirSync(home);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  writeFileSync(join(bin, "claude"), stubClaude());
  chmodSync(join(bin, "claude"), 0o755);
  // The fixture's own task list replaces the helper's default (the pattern of
  // `tests/parallel/154/one-validator.test.ts`).
  writeFileSync(
    join(work, "specs", "001-one", "tasks.md"),
    readFileSync(join(import.meta.dirname, "../../fixtures/154", fixtureDir, "tasks.md"), "utf8"),
  );
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
  const before: Record<string, string | undefined> = {};
  for (const name of ["HOME", "PATH", ...SWITCH_VARS]) before[name] = process.env[name];
  before.SPECSTRIDE_FEATURE = process.env.SPECSTRIDE_FEATURE;
  process.env.HOME = home;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  delete process.env.SPECSTRIDE_FEATURE;
  // The switches: every var deleted on the baseline, every var `on` otherwise.
  for (const name of SWITCH_VARS) {
    if (switches === "on") process.env[name] = "on";
    else delete process.env[name];
  }
  process.env.SPECSTRIDE_PROPOSER = "claude";
  process.env.SPECSTRIDE_CRITIC = "claude";
  process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = "0";
  process.env.SPECSTRIDE_LIMITS = "on";
  const control = join(home, ".specstride", "workspaces", workspaceIdOfWorkspace(work));

  const readEvents = (): Event[] => {
    // The plain run keeps its control plane under `HOME/.specstride`; under
    // the `parity` profile the engine lays the state out where the as-is
    // engine did, so both roots are read (as `helpers.ts` does).
    const roots = [
      control,
      join(home, ".local", "state", "specstride", "workspaces", "001-one"),
    ];
    const all: Event[] = [];
    for (const base of roots) {
      const runDirs: string[] = [];
      for (const runs of [
        join(base, "runs"),
        join(base, "features", "001-one", "runs"),
      ]) {
        for (const run of existsSync(runs) ? readdirSync(runs).sort() : []) {
          runDirs.push(join(runs, run));
        }
      }
      for (const dir of runDirs) {
        const file = join(dir, "events.jsonl");
        if (!existsSync(file)) continue;
        for (const line of readFileSync(file, "utf8").split("\n")) {
          if (line.trim() === "") continue;
          all.push(JSON.parse(line) as Event);
        }
      }
    }
    return all;
  };

  return {
    run: () => runFeature({ argv: [], workdir: work }),
    events: readEvents,
    restore: () => {
      for (const name of ["HOME", "PATH", ...SWITCH_VARS]) {
        if (before[name] === undefined) delete process.env[name];
        else process.env[name] = before[name];
      }
      if (before.SPECSTRIDE_FEATURE === undefined) delete process.env.SPECSTRIDE_FEATURE;
      else process.env.SPECSTRIDE_FEATURE = before.SPECSTRIDE_FEATURE;
      rmSync(root, { recursive: true, force: true });
    },
  };
}

/** The event types whose `outcome` is a run/attempt state of the run. */
const STATE_EVENT_TYPES = new Set([
  "run.started",
  "run.ended",
  "phase.started",
  "phase.ended",
  "attempt.started",
  "attempt.ended",
]);

/**
 * The non-start reasons of a speculative unit, as the spec names them
 * (`rate` F154-FR-066, `depth` F154-FR-062, `sweep` F154-FR-067). The
 * data-model (§"Not here") places them on the admission event
 * `loop.speculation.admission`, NOT in the stop-reason vocabulary of
 * F154-FR-002 — so they are collected and pinned to this closed set, and the
 * subset comparison itself runs over the stop reasons proper.
 */
const SPECULATION_ADMISSION_REASONS = new Set(["rate", "depth", "sweep"]);

/**
 * The stop reasons of one event stream (F154-FR-002's vocabulary): every
 * `endCause` (`attempt.ended`, `pass.ended`), every `stopReason`
 * collected with them (`reason` on `loop.speculation.admission`).
 */
function stopReasons(events: readonly Event[]): {
  readonly reasons: ReadonlySet<string>;
  readonly admissions: ReadonlySet<string>;
} {
  const reasons = new Set<string>();
  const admissions = new Set<string>();
  for (const event of events) {
    for (const key of ["endCause", "stopReason"] as const) {
      const value = event.data[key];
      if (value !== undefined) reasons.add(String(value));
    }
    if (event.type === "loop.speculation.admission") {
      const reason = event.data.reason;
      if (reason === undefined) {
        // `reason` is present only where the decision is `skip`.
        assert.equal(event.data.decision, "start", "an admission without a reason starts");
      } else {
        admissions.add(String(reason));
        assert.ok(
          SPECULATION_ADMISSION_REASONS.has(String(reason)),
          `the admission reason ${String(reason)} is outside the closed set {rate, depth, sweep}`,
        );
      }
    } else {
      const reason = event.data.reason;
      if (reason !== undefined) reasons.add(String(reason));
    }
  }
  return { reasons, admissions };
}

/**
 * The run states of one event stream: the `state`/`states` values the run
 * events carry (the state letters of `run.started`, split on the comma) and
 * the `outcome` of the run/attempt/phase events.
 */
function runStates(events: readonly Event[]): ReadonlySet<string> {
  const out = new Set<string>();
  for (const event of events) {
    const state = event.data.state;
    if (state !== undefined) out.add(String(state));
    const states = event.data.states;
    if (typeof states === "string") {
      for (const letter of states.split(",")) out.add(letter);
    }
    if (STATE_EVENT_TYPES.has(event.type)) {
      const outcome = event.data.outcome;
      if (outcome !== undefined) out.add(String(outcome));
    }
  }
  return out;
}

/** Subset assertion with the witness in the message. */
function assertSubset(on: ReadonlySet<string>, baseline: ReadonlySet<string>, what: string, fixtureDir: string): void {
  const added = [...on].filter((value) => !baseline.has(value));
  assert.deepEqual(
    added,
    [],
    `${fixtureDir}: the on-run added ${what}: ${JSON.stringify(added)}`,
  );
}

/** One fixture, both arms: the closed-set assertions of F154-SC-001. */
async function closedSetsOverFixture(fixtureDir: string): Promise<void> {
  const exitCodes: { off: number; on: number } = { off: -1, on: -1 };
  const reasons: { off: ReadonlySet<string>; on: ReadonlySet<string> } = {
    off: new Set(),
    on: new Set(),
  };
  const states: { off: ReadonlySet<string>; on: ReadonlySet<string> } = {
    off: new Set(),
    on: new Set(),
  };
  for (const switches of ["off", "on"] as const) {
    const f = fixture154(fixtureDir, switches);
    try {
      const exit = await f.run();
      if (switches === "off") exitCodes.off = exit;
      else exitCodes.on = exit;
      const events = f.events();
      assert.ok(events.length > 0, `${fixtureDir} (${switches}): the run wrote events`);
      reasons[switches] = stopReasons(events).reasons;
      states[switches] = runStates(events);
    } finally {
      f.restore();
    }
  }
  // Both arms exit 0 (`door` is the fixture that cannot, hence dropped above).
  assert.equal(exitCodes.off, 0, `${fixtureDir}: the baseline run exits 0`);
  assert.equal(exitCodes.on, 0, `${fixtureDir}: the on-run exits 0`);
  // F154-FR-002 / F154-SC-001: no new exit code, stop reason or run state.
  assertSubset(new Set([exitCodes.on]), new Set([exitCodes.off]), "exit code", fixtureDir);
  assertSubset(reasons.on, reasons.off, "stop reason", fixtureDir);
  assertSubset(states.on, states.off, "run state", fixtureDir);
}

test("G8 T163 every fixture: with every switch on, exit codes, stop reasons and run states are subsets of the baseline sets (F154-SC-001, F154-FR-002)", async () => {
  for (const fixtureDir of FIXTURE_DIRS) {
    await closedSetsOverFixture(fixtureDir);
  }
});
