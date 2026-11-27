/**
 * G8 T161 (feature 154, phase 17) — F154-FR-018 TRI-1: THE FIVE BREACH
 * INVARIANTS OF F142-FR-071 HOLD ON THE EVENT FILE.
 *
 * Over EVERY runnable fixture of `tests/fixtures/154/` (plan, groups, slots,
 * stages, phases, spec — `door` is dropped: FX-154-DOOR names the adapter
 * descriptor of the fake-binary test in its stub configuration, so this stub
 * engine fixture cannot drive it to exit 0, the same reason
 * `tests/parallel/154/one-validator.test.ts` skips it), with EVERY switch of
 * spec 154 ON (`SPECSTRIDE_LOOP_PHASES_PARALLEL=on`,
 * `SPECSTRIDE_LOOP_SPECULATE=on`, `SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS=on`,
 * `SPECSTRIDE_LOOP_PARALLEL_GROUP_CHECK=on` — the catalogue's environment
 * names of `loop.phases.parallel`, `loop.speculate`,
 * `loop.parallel.groupUnits` and `loop.parallel.groupCheck`, read through
 * the merge in `packages/cli/src/engine/loop-config.ts`):
 *
 *   - the run exits 0;
 *   - the engine's own breach checker (`breaches` of
 *     `packages/core/src/parallel/breach.ts`, the check the doctor and the
 *     build run on every event file) reports ZERO breaches for EACH of the
 *     five conditions individually;
 *   - and the stream itself holds no breach-kind event.
 *
 * The hermetic harness is the stub fixture of `tests/inertness/154/helpers.ts`
 * (`fixture154`), copied here and parameterised by fixture directory: private
 * `HOME`, stub `claude` on `PATH` (proposer writes evidence, writes the
 * checkpoint, ticks `[ ]`→`[x]`; critic echoes VERDICT nonce APPROVED; sleeps
 * 0), the events reader over the control plane, `rmSync` in `finally`.
 *
 * Run from the repository root:
 *     node --experimental-strip-types --test tests/parallel/154/breach-invariants-154.test.ts
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
import { BREACH_CONDITIONS, CHECKS, breaches } from "../../../packages/core/src/parallel/breach.ts";

/** The fixture directories of T011 under `tests/fixtures/154/`, minus `door`. */
const FIXTURE_DIRS = ["plan", "groups", "slots", "stages", "phases", "spec"] as const;

/** The environment names of the four switches of spec 154, all set to `on`. */
const SWITCH_VARS = [
  "SPECSTRIDE_LOOP_PHASES_PARALLEL",
  "SPECSTRIDE_LOOP_SPECULATE",
  "SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS",
  "SPECSTRIDE_LOOP_PARALLEL_GROUP_CHECK",
] as const;

type Event = { type?: string; kind?: string; seq?: number; data?: Record<string, unknown> };

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

/** One breach fixture: a working directory, a private `HOME`, the stub on
 * `PATH`, every switch of spec 154 ON. */
function fixture154(fixtureDir: string): {
  readonly run: () => Promise<number>;
  readonly events: () => readonly Event[];
  readonly restore: () => void;
} {
  const root = mkdtempSync(join(tmpdir(), "specstride-breach-154-"));
  const bin = join(root, "bin");
  const home = join(root, "home");
  const work = join(root, "work");
  mkdirSync(bin);
  mkdirSync(home);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  writeFileSync(join(bin, "claude"), stubClaude());
  chmodSync(join(bin, "claude"), 0o755);
  // The fixture's own task list (exactly as `helpers.ts` lays tasks.md down).
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
  for (const name of SWITCH_VARS) process.env[name] = "on";
  process.env.SPECSTRIDE_PROPOSER = "claude";
  process.env.SPECSTRIDE_CRITIC = "claude";
  process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = "0";
  process.env.SPECSTRIDE_LIMITS = "on";
  const control = join(home, ".specstride", "workspaces", workspaceIdOfWorkspace(work));

  const readEvents = (): Event[] => {
    // The plain run keeps its control plane under `HOME/.specstride`; under
    // the `parity` profile the engine lays the state out where the as-is
    // engine did, so both roots are read (as `helpers.ts` does).
    const roots = [control, join(home, ".local", "state", "specstride", "workspaces", "001-one")];
    const all: Event[] = [];
    for (const base of roots) {
      const runDirs: string[] = [];
      for (const runs of [join(base, "runs"), join(base, "features", "001-one", "runs")]) {
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

/** One fixture, every switch ON: the five breach invariants of F142-FR-071. */
async function breachInvariantsOverFixture(fixtureDir: string): Promise<void> {
  const f = fixture154(fixtureDir);
  try {
    const exit = await f.run();
    assert.equal(exit, 0, `${fixtureDir}: the on-run exits 0`);
    const events = f.events();
    assert.ok(events.length > 0, `${fixtureDir}: the run wrote an event file`);

    // EACH of the five conditions individually: ZERO breaches.
    for (let i = 0; i < CHECKS.length; i += 1) {
      const found = CHECKS[i]!(events);
      assert.deepEqual(
        found.map((breach) => breach.detail),
        [],
        `${fixtureDir}: condition ${i + 1} (${BREACH_CONDITIONS[i]}) was breached`,
      );
    }
    // The whole checker agrees (the same call the doctor and the build make).
    assert.equal(
      breaches(events).length,
      0,
      `${fixtureDir}: the breach checker found breaches on the event file`,
    );
    // And the stream itself holds no breach-kind event.
    const breachKinded = events
      .map((event) => event.type ?? event.kind ?? "")
      .filter((type) => type.toLowerCase().includes("breach"));
    assert.deepEqual(breachKinded, [], `${fixtureDir}: the event file holds a breach-kind event`);
  } finally {
    f.restore();
  }
}

test("G8 T161 every fixture with every switch on: the five breach invariants of F142-FR-071 hold on the event file (F154-FR-018 TRI-1)", async () => {
  for (const fixtureDir of FIXTURE_DIRS) {
    await breachInvariantsOverFixture(fixtureDir);
  }
});
