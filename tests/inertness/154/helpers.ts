/**
 * The stub-engine fixture of `tests/inertness/154/`, modelled on
 * `fixture` and `groupsFixture` of
 * `packages/cli/test/engine/loop-speed-helpers.ts` and
 * `loop-speed-groups.test.ts`, with EVERY switch of spec 154 off: the
 * switches-off run that F154-SC-012 measures, and the baseline the parity
 * test compares with.
 *
 * The stub proposer claims the phase's three tasks and ticks them; the stub
 * critic approves. No paid or external model API is called (F154-FR-018).
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

import { workspaceIdOfWorkspace } from "../../../packages/cli/src/engine/workspace-control-root.ts";
import { runFeature } from "../../../packages/cli/src/engine/run-feature.ts";

/** The stub `claude` executable: proposer ticks, critic approves. */
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

export type InertnessFixture = {
  readonly work: string;
  readonly home: string;
  readonly control: string;
  /** Run the engine once with every switch of spec 154 off and return its exit code. */
  readonly run: () => Promise<number>;
  /** Every event of the run's control plane, in file order (with its `at`). */
  readonly events: () => readonly {
    type: string;
    at?: string;
    data: Record<string, unknown>;
  };
  /** The stub's own trace of the calls it answered, in call order. */
  readonly prompts: () => readonly {
    role: string;
    prompt: string;
    session: string;
  };
  /** The event types of the run, in file order, one per line (the normalised form). */
  readonly eventTypes: () => readonly string[];
  readonly restore: () => void;
};

/** The task list of `tests/fixtures/154/groups/`. */
const TASKS_MD = readFileSync(
  join(import.meta.dirname, "../../fixtures/154/groups/tasks.md"),
  "utf8",
);

/** One inertness fixture: a working directory, a private `HOME`, the stub on `PATH`. */
export function fixture154(): InertnessFixture {
  const root = mkdtempSync(join(tmpdir(), "specstride-inert-154-"));
  const bin = join(root, "bin");
  const home = join(root, "home");
  const work = join(root, "work");
  mkdirSync(bin);
  mkdirSync(home);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  writeFileSync(join(bin, "claude"), stubClaude());
  chmodSync(join(bin, "claude"), 0o755);
  writeFileSync(join(work, "specs", "001-one", "tasks.md"), TASKS_MD);
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
  const control = join(home, ".specstride", "workspaces", workspaceIdOfWorkspace(work));

  const readEvents = (): { type: string; data: Record<string, unknown> }[] => {
    // The plain run keeps its control plane under `HOME/.specstride`;
    // under the `parity` profile the engine lays the state out where the
    // as-is engine did (`state.dir` of annex X §X.7), so both are read.
    const roots = [control, join(home, ".local", "state", "specstride", "workspaces", "001-one")];
    const all: { type: string; data: Record<string, unknown> }[] = [];
    for (const base of roots) {
      const runDirs: string[] = [];
      // The plain layout nests runs under `runs/` of the workspace; the
      // parity layout nests them under `features/<feature>/runs/` as well.
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
          all.push(JSON.parse(line) as { type: string; data: Record<string, unknown> });
        }
      }
    }
    return all;
  };

  return {
    work,
    home,
    control,
    run: () => runFeature({ argv: [], workdir: work }),
    events: readEvents,
    prompts: () => {
      const file = join(home, "prompts.jsonl");
      if (!existsSync(file)) return [];
      return readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => JSON.parse(line) as { role: string; prompt: string; session: string });
    },
    eventTypes: () => readEvents().map((event) => event.type),
    restore: () => {
      process.env.HOME = before.HOME;
      process.env.PATH = before.PATH;
      if (before.PROFILE === undefined) delete process.env.SPECSTRIDE_PROFILE;
      else process.env.SPECSTRIDE_PROFILE = before.PROFILE;
      if (before.FEATURE === undefined) delete process.env.SPECSTRIDE_FEATURE;
      else process.env.SPECSTRIDE_FEATURE = before.FEATURE;
      if (before.LAUNCH === undefined) delete process.env.SPECSTRIDE_LAUNCH_ID;
      else process.env.SPECSTRIDE_LAUNCH_ID = before.LAUNCH;
      if (before.PROPOSER === undefined) delete process.env.SPECSTRIDE_PROPOSER;
      else process.env.SPECSTRIDE_PROPOSER = before.PROPOSER;
      if (before.CRITIC === undefined) delete process.env.SPECSTRIDE_CRITIC;
      else process.env.SPECSTRIDE_CRITIC = before.CRITIC;
      if (before.PAUSE === undefined) delete process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC;
      else process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = before.PAUSE;
      if (before.LIMITS === undefined) delete process.env.SPECSTRIDE_LIMITS;
      else process.env.SPECSTRIDE_LIMITS = before.LIMITS;
      rmSync(root, { recursive: true, force: true });
    },
  };
}

/** The event types of the feature that must not exist with the switches off. */
export const FORBIDDEN_EVENT_PREFIXES = [
  "parallel.",
  "host.slot.",
  "pipeline.landing.",
  "loop.speculation.",
] as const;

export function forbiddenTypes(types: readonly string[]): readonly string[] {
  return types.filter((type) => FORBIDDEN_EVENT_PREFIXES.some((prefix) => type.startsWith(prefix)));
}

/** The user-level roots the slot and hold records live under (F154-FR-044). */
export function slotAndHoldFiles(home: string): readonly string[] {
  const out: string[] = [];
  for (const dir of [join(home, "slots"), join(home, "holds")]) {
    if (existsSync(dir)) out.push(...readdirSync(dir));
  }
  return out;
}
