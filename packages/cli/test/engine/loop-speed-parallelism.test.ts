/**
 * Phase 21 of feature 153, US3 — the concurrent commands of the gate
 * (F153-FR-042), through the batch runner of feature 148:
 *
 *  - T292 CT-153-42 two declared-disjoint commands run in one batch: with
 *    `verification.parallelism: 2` and two gate commands whose reads and
 *    writes the launch record declares disjoint, each sleeping 1 s, the gate
 *    takes less than 1.8 s, both `check.ended` events are flagged
 *    `concurrent` in one batch, and the admissions are recorded;
 *  - T293 CT-153-42 undeclared commands run alone, and the default is 1: the
 *    same two commands with no declared reads and writes and the key unset
 *    run one after the other;
 *  - T294 CT-153-42 a taint lowers the run to 1: a gate command that changes
 *    a tracked file OUTSIDE its declared write while it runs taints its
 *    batch, `check.parallelism_lowered` is in the events, and every later
 *    batch of the run has one member;
 *  - T295 CT-153-42 a failure in a batch is run again alone: a command that
 *    fails only while another holds a lock file is executed twice, the
 *    second time alone, and both executions are stated in its result.
 *
 * No paid or external model API is called (F153-FR-060): the proposer and
 * the critic are a stub `claude` written here, and the commands are `node`.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { runFeature } from "../../src/engine/run-feature.ts";
import { workspaceIdOfWorkspace } from "../../src/engine/workspace-control-root.ts";

/** Sleep, marking its own start and end inside its DECLARED write, so the
 * test can read whether the two spans overlapped; the argv differ, so the
 * runner pins two distinct identities (the identity is the argv). */
function sleeper(ms: number, mark: string): string {
  return (
    `const fs = require("node:fs"); const t0 = Date.now(); ` +
    `fs.appendFileSync("${mark}", "start " + t0 + "\\n"); ` +
    `setTimeout(() => { fs.appendFileSync("${mark}", "end " + Date.now() + "\\n"); process.exit(0); }, ${String(ms)})`
  );
}

/** The task list: a TWO-task phase, so two passes end it. */
const TASKS = "# Tasks\n\n## Phase 1: One\n\n- [ ] T001 Do it\n- [ ] T002 Do more\n";

/**
 * The stub `claude` of this file: a proposer that changes nothing (the
 * counters are written by the GATE commands alone), a critic that approves,
 * and the checkpoint the pass contract asks for.
 */
function quietStub(): string {
  return `#!/usr/bin/env node
const fs = require("node:fs");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns");
if (prompt.includes("Diagnostician")) {
  console.log(JSON.stringify({ type: "result", result: "CASE: GROUNDING\\nName the missing test of T001." }));
  process.exit(0);
}
console.log(JSON.stringify({ type: "system", subtype: "init", tools: [], session_id: session }));
if (critic) {
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  const evidence = /write (\\.specstride\\S+?):/i.exec(prompt)[1];
  fs.mkdirSync(require("node:path").dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, "T001 done\\n");
  const outbox = ".specstride/features/001-one/outbox";
  fs.mkdirSync(outbox, { recursive: true });
  const unit = (/u(\\d+)\\.checkpoint/.exec(prompt) || ["", "1"])[1];
  const list = fs.readFileSync("specs/001-one/tasks.md", "utf8");
  const taskId = (/\\- \\[ \\] (T\\d+)/.exec(list) || ["", "T001"])[1];
  fs.writeFileSync(require("node:path").join(outbox, "u" + unit + ".checkpoint.json"),
    JSON.stringify({ schema: "specstride.checkpoint/1", tasks: [taskId] }));
  fs.writeFileSync("specs/001-one/tasks.md",
    list.replace("- [ ] " + taskId, "- [x] " + taskId));
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;
}

/** One declared gate command of this file's fixtures. */
type GateCommand = {
  readonly id: string;
  /** The body of the `-e` script the command runs, in its workspace. */
  readonly code: string;
  readonly cwd: string;
};

/** The commands document the fixture writes into the control plane. */
function commandsDocument(work: string, commands: readonly GateCommand[]): string {
  return JSON.stringify({
    schema_version: "specstride.verification-commands/1",
    discovery: "none",
    commands: commands
      .map((command) => ({
        id: command.id,
        phase: 1,
        executable: "node",
        args: ["-e", command.code],
        cwd: `WORKDIR/${command.cwd}`,
        timeoutSec: 30,
      }))
      .map((command) => ({
        ...command,
        cwd: command.cwd.startsWith("WORKDIR") ? command.cwd.replace("WORKDIR", work) : command.cwd,
      })),
  });
}

/** The launch record the fixture writes: the declared scopes of row 261. */
function launchRecord(scopes: Record<string, Record<string, unknown>>): string {
  return JSON.stringify({
    schema: "specstride.launch/1",
    id: "fixture",
    configuration: { verification: { mode: "required" }, scopes: { commands: scopes } },
  });
}

type ParallelOptions = {
  /** The gate commands of the fixture, in declaration order. */
  readonly commands: readonly GateCommand[];
  /** `verification.parallelism` in the USER file, where given. */
  readonly parallelism?: number;
  /** The declared scopes of the launch record, by command id. */
  readonly scopes?: Record<string, Record<string, unknown>>;
  /** Extra tracked files the fixture commits beside the workspaces. */
  readonly tracked?: readonly string[];
};

/** The fixture of this file: a git workspace with the stub and the control plane. */
function parallelFixture(options: ParallelOptions): {
  readonly work: string;
  readonly control: string;
  readonly restore: () => void;
} {
  const root = mkdtempSync(join(tmpdir(), "specstride-parallel-"));
  const bin = join(root, "bin");
  const work = join(root, "work");
  mkdirSync(bin);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  writeFileSync(join(bin, "claude"), quietStub());
  chmodSync(join(bin, "claude"), 0o755);
  writeFileSync(join(work, "specs", "001-one", "tasks.md"), TASKS);
  for (const workspace of ["a", "b", "c"]) {
    mkdirSync(join(work, "pkgs", workspace), { recursive: true });
    writeFileSync(
      join(work, "pkgs", workspace, "package.json"),
      JSON.stringify({ name: `@fixture/${workspace}` }),
    );
  }
  for (const file of options.tracked ?? []) {
    mkdirSync(join(work, file, ".."), { recursive: true });
    writeFileSync(join(work, file), "seed\n");
  }
  for (const argv of [
    ["init", "-q"],
    ["config", "user.email", "t@t"],
    ["config", "user.name", "t"],
    ["add", "-A"],
    ["commit", "-qm", "init"],
  ]) {
    spawnSync("git", ["-C", work, ...argv]);
  }
  const homeBefore = process.env.HOME;
  const launchIdBefore = process.env.SPECSTRIDE_LAUNCH_ID;
  process.env.HOME = root;
  const control = join(root, ".specstride", "workspaces", workspaceIdOfWorkspace(work));
  mkdirSync(join(control, "features", "001-one", "verification"), { recursive: true });
  writeFileSync(
    join(control, "features", "001-one", "verification", "verification-commands.json"),
    commandsDocument(work, options.commands),
  );
  if (options.scopes !== undefined) {
    // The run is a child of a launch: the runtime root names the launch
    // through SPECSTRIDE_LAUNCH_ID, and the launch record of the run carries
    // `configuration.scopes` (annex G) — the launch contract wrote it, so
    // provenance `user-config` of row 261 counts (F107-FR-012).
    process.env.SPECSTRIDE_LAUNCH_ID = "l-1";
    mkdirSync(join(control, "launches", "l-1"), { recursive: true });
    writeFileSync(join(control, "launches", "l-1", "launch.json"), launchRecord(options.scopes));
  }
  if (options.parallelism !== undefined) {
    const userConfig = join(root, ".config", "specstride");
    mkdirSync(userConfig, { recursive: true });
    writeFileSync(
      join(userConfig, "config.yaml"),
      `schema: 1\nverification:\n  parallelism: ${options.parallelism}\n`,
    );
  }
  const before = {
    PATH: process.env.PATH,
    PROPOSER: process.env.SPECSTRIDE_PROPOSER,
    CRITIC: process.env.SPECSTRIDE_CRITIC,
    PAUSE: process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC,
    LIMITS: process.env.SPECSTRIDE_LIMITS,
    FEATURE: process.env.SPECSTRIDE_FEATURE,
  };
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  process.env.SPECSTRIDE_PROPOSER = "claude";
  process.env.SPECSTRIDE_CRITIC = "claude";
  process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = "0";
  process.env.SPECSTRIDE_LIMITS = "on";
  delete process.env.SPECSTRIDE_FEATURE;
  return {
    work,
    control,
    restore: () => {
      if (homeBefore === undefined) delete process.env.HOME;
      else process.env.HOME = homeBefore;
      if (launchIdBefore === undefined) delete process.env.SPECSTRIDE_LAUNCH_ID;
      else process.env.SPECSTRIDE_LAUNCH_ID = launchIdBefore;
      process.env.PATH = before.PATH;
      if (before.PROPOSER === undefined) delete process.env.SPECSTRIDE_PROPOSER;
      else process.env.SPECSTRIDE_PROPOSER = before.PROPOSER;
      if (before.CRITIC === undefined) delete process.env.SPECSTRIDE_CRITIC;
      else process.env.SPECSTRIDE_CRITIC = before.CRITIC;
      if (before.PAUSE === undefined) delete process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC;
      else process.env.SPECSTRIDE_PROPOSER_PAUSE_SEC = before.PAUSE;
      if (before.LIMITS === undefined) delete process.env.SPECSTRIDE_LIMITS;
      else process.env.SPECSTRIDE_LIMITS = before.LIMITS;
      if (before.FEATURE === undefined) delete process.env.SPECSTRIDE_FEATURE;
      else process.env.SPECSTRIDE_FEATURE = before.FEATURE;
      if (process.env.SPECSTRIDE_KEEP === undefined) rmSync(root, { recursive: true, force: true });
    },
  };
}

type EventRecord = { type: string; at: string; data: Record<string, unknown> };

/** Every event of the run's control plane, in write order. */
function eventsOf(control: string): readonly EventRecord[] {
  const runs = join(control, "runs");
  const all: EventRecord[] = [];
  for (const name of existsSync(runs) ? readdirSync(runs).sort() : []) {
    const path = join(runs, name, "events.jsonl");
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      if (line.trim() === "") continue;
      all.push(JSON.parse(line) as EventRecord);
    }
  }
  return all;
}

/** The counter file's lines, where it exists; `[]` where it does not. */
function counterLines(work: string, workspace: string): readonly string[] {
  const path = join(work, "pkgs", workspace, `counter-${workspace}.txt`);
  if (!existsSync(path)) return [];
  const text = readFileSync(path, "utf8");
  return text === "" ? [] : text.trim().split("\n");
}

/** One gate `check.started`/`check.ended` pair per command, LAST attempt. */
function gatePairs(
  events: readonly EventRecord[],
): Record<
  string,
  { readonly startedAt: number; readonly endedAt: number; readonly data: Record<string, unknown> }
> {
  const started = new Map<string, number>();
  const pairs: Record<
    string,
    { startedAt: number; endedAt: number; data: Record<string, unknown> }
  > = {};
  for (const event of events) {
    const id = event.data["checkId"];
    if (typeof id !== "string") continue;
    if (event.type === "check.started" && event.data["unitId"] === null) {
      started.set(id, Date.parse(event.at));
    } else if (event.type === "check.ended" && event.data["unitId"] === null) {
      pairs[id] = {
        startedAt: started.get(id) ?? 0,
        endedAt: Date.parse(event.at),
        data: event.data,
      };
    }
  }
  return pairs;
}

/** The start and end wall-clock ms a sleeper recorded in its mark file,
 * which the sleeper wrote in its own workspace (`pkgs/<workspace>`). */
function marksOf(
  work: string,
  workspace: string,
): { readonly start: number; readonly end: number } {
  const path = join(work, "pkgs", workspace, `mark-${workspace}.txt`);
  const lines = readFileSync(path, "utf8")
    .trim()
    .split("\n")
    .map((line) => Number(line.split(" ")[1]));
  return { start: lines[0] ?? 0, end: lines[1] ?? 0 };
}

const TWO_SLEEPERS: readonly GateCommand[] = [
  { id: "verify-a", code: sleeper(1_000, "pkgs/a/mark-a.txt"), cwd: "." },
  { id: "verify-b", code: sleeper(1_050, "pkgs/b/mark-b.txt"), cwd: "." },
];

const DISJOINT_SCOPES = {
  "verify-a": { reads: ["pkgs/a/**"], writes: ["pkgs/a/**"], source: "user-config" },
  "verify-b": { reads: ["pkgs/b/**"], writes: ["pkgs/b/**"], source: "user-config" },
};

test("T292 CT-153-42 two declared-disjoint commands run in one batch", async () => {
  const g = parallelFixture({ commands: TWO_SLEEPERS, parallelism: 2, scopes: DISJOINT_SCOPES });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0, `the run ends approved: ${String(exit)}`);
    const pairs = gatePairs(eventsOf(g.control));
    const a = pairs["verify-a"];
    const b = pairs["verify-b"];
    assert.ok(a !== undefined && b !== undefined, "the gate ran both commands");
    // One batch, two slots, both flagged concurrent (F148-FR-017).
    assert.equal(a.data["batch"], b.data["batch"], "the two ran in one batch");
    assert.equal(a.data["concurrent"], true, "verify-a ran in a batch of more than one");
    assert.equal(b.data["concurrent"], true, "verify-b ran in a batch of more than one");
    assert.notEqual(a.data["slot"], b.data["slot"], "each held its own slot");
    // The stated bound of T292: the GATE takes less than 1.8 s for two
    // commands that sleep 1 s each — measured from the first gate
    // `check.started` to the last gate `check.ended` of the two.
    const gateSpanMs = Math.max(a.endedAt, b.endedAt) - Math.min(a.startedAt, b.startedAt);
    assert.ok(
      gateSpanMs < 1_800,
      `the gate took ${String(gateSpanMs)} ms for two 1 s commands; the bound is 1 800 ms`,
    );
    // And the spans the commands recorded themselves OVERLAP, which serial
    // runs of 1 s cannot give.
    const marksA = marksOf(g.work, "a");
    const marksB = marksOf(g.work, "b");
    const overlap = Math.min(marksA.end, marksB.end) - Math.max(marksA.start, marksB.start);
    assert.ok(
      overlap > 300,
      `the two 1 s commands overlapped for only ${String(overlap)} ms; they did not run side by side`,
    );
    // Every admission is recorded (F148-FR-012) — under the plan's derived
    // ids, one per command, each with its own slot of batch 0.
    const admissions = eventsOf(g.control).filter((event) => event.type === "check.admission");
    const admitted = admissions.filter((event) => event.data["result"] === "admitted");
    const lastBatch = Math.max(...admitted.map((event) => Number(event.data["batch"])));
    const slots = admitted
      .filter((event) => Number(event.data["batch"]) === lastBatch)
      .map((event) => Number(event.data["slot"]))
      .sort();
    assert.deepEqual(slots, [0, 1], "both commands were admitted, each to its own slot");
  } finally {
    g.restore();
  }
});

test("T293 CT-153-42 undeclared commands run alone, and the default is 1", async () => {
  const g = parallelFixture({ commands: TWO_SLEEPERS });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0, `the run ends approved: ${String(exit)}`);
    const pairs = gatePairs(eventsOf(g.control));
    const a = pairs["verify-a"];
    const b = pairs["verify-b"];
    assert.ok(a !== undefined && b !== undefined, "the gate ran both commands");
    // Undeclared means serial: no batch, no concurrency, no overlap.
    assert.equal(a.data["concurrent"], false);
    assert.equal(b.data["concurrent"], false);
    assert.equal(a.data["batch"], null);
    assert.equal(b.data["batch"], null);
    // The spans do NOT overlap: one command ended before the other began.
    const marksA = marksOf(g.work, "a");
    const marksB = marksOf(g.work, "b");
    const gap = marksB.start - marksA.end;
    assert.ok(
      gap >= 0,
      `verify-b began ${String(-gap)} ms before verify-a ended; undeclared commands must run one after the other`,
    );
    assert.equal(
      eventsOf(g.control).filter((event) => event.type === "check.admission").length,
      0,
      "no admission is recorded on the serial path",
    );
  } finally {
    g.restore();
  }
});

test("T294 CT-153-42 a taint lowers the run to 1: every later batch has one member", async () => {
  const g = parallelFixture({
    commands: [
      {
        id: "verify-a",
        // Changes a TRACKED file OUTSIDE its declared write while it runs:
        // F148-FR-014 — the change taints every member of the batch. The
        // commands run from the tree root, so the tracked file is named by
        // its path from there.
        code: `require("node:fs").writeFileSync("pkgs/a/package.json", JSON.stringify({ name: "@fixture/a", touched: true })); setTimeout(() => process.exit(0), 300)`,
        cwd: ".",
      },
      { id: "verify-b", code: `setTimeout(() => process.exit(0), 300)`, cwd: "pkgs/b" },
      { id: "verify-c", code: `setTimeout(() => process.exit(0), 100)`, cwd: "pkgs/c" },
    ],
    parallelism: 2,
    scopes: {
      "verify-a": { reads: ["pkgs/a/**"], writes: ["pkgs/a/counter-a.txt"], source: "user-config" },
      "verify-b": { reads: ["pkgs/b/**"], writes: ["pkgs/b/counter-b.txt"], source: "user-config" },
      "verify-c": { reads: ["pkgs/c/**"], writes: ["pkgs/c/counter-c.txt"], source: "user-config" },
    },
    tracked: ["pkgs/a/package.json"],
  });
  try {
    // The taint makes the gate red on purpose: this case reads the EVENTS,
    // never the exit of the run.
    await runFeature({ argv: [], workdir: g.work });
    const events = eventsOf(g.control);
    const lowerings = events.filter((event) => event.type === "check.parallelism_lowered");
    assert.ok(
      lowerings.length >= 1,
      `check.parallelism_lowered is in the events: ${JSON.stringify(events.map((e) => e.type))}`,
    );
    // The batch the lowering came from held TWO members at the parallelism 2;
    // every batch AFTER it holds one member.
    const loweredBatch = Number(lowerings[0]?.data["batch"]);
    const ends = events
      .filter((event) => event.type === "check.ended" && event.data["unitId"] === null)
      .filter((event) => Number(event.data["batch"]) > loweredBatch);
    assert.ok(ends.length >= 1, "a command ran in a later batch");
    for (const end of ends) {
      assert.equal(end.data["concurrent"], false, "a later batch never runs beside another");
    }
    // The members of the tainted batch ran beside one another.
    const tainted = events
      .filter((event) => event.type === "check.ended" && event.data["unitId"] === null)
      .filter((event) => Number(event.data["batch"]) === loweredBatch);
    assert.ok(
      tainted.every((end) => end.data["concurrent"] === true),
      "the tainted batch held more than one command",
    );
  } finally {
    g.restore();
  }
});

test("T295 CT-153-42 a failure in a batch is run again alone", async () => {
  const g = parallelFixture({
    commands: [
      {
        id: "verify-a",
        // Holds the lock for 700 ms, then lets it go: only beside verify-a
        // does the lock file exist when verify-b looks. The commands run
        // from the tree root, so the lock is `pkgs/a/lock`.
        code: `const fs = require("node:fs"); fs.writeFileSync("pkgs/a/lock", "held"); setTimeout(() => { fs.rmSync("pkgs/a/lock"); process.exit(0); }, 700)`,
        cwd: ".",
      },
      {
        id: "verify-b",
        // Writes its line FIRST, then fails while the lock is held — so two
        // counter lines state two executions: the one beside verify-a, which
        // found the lock and failed, and the rerun alone, which passed.
        code: `const fs = require("node:fs"); setTimeout(() => { fs.appendFileSync("pkgs/b/counter-b.txt", "ran\\n"); if (fs.existsSync("pkgs/a/lock")) process.exit(1); process.exit(0); }, 200)`,
        cwd: ".",
      },
    ],
    parallelism: 2,
    scopes: {
      "verify-a": { reads: ["pkgs/a/**"], writes: ["pkgs/a/**"], source: "user-config" },
      "verify-b": { reads: ["pkgs/b/**"], writes: ["pkgs/b/**"], source: "user-config" },
    },
  });
  try {
    // The first execution of verify-b fails by design; the batch runner runs
    // it once more alone (F148-FR-016), so the gate itself may end red.
    await runFeature({ argv: [], workdir: g.work });
    const events = eventsOf(g.control);
    // Executed exactly twice per attempt: the first beside verify-a, which
    // found the lock and failed, and the rerun alone, which passed (the
    // second line was written with the lock gone). Every attempt adds two.
    const lines = counterLines(g.work, "b").length;
    assert.ok(
      lines >= 2 && lines % 2 === 0,
      `verify-b was executed twice per attempt: ${String(lines)} lines`,
    );
    // The FIRST execution ran beside verify-a: verify-b's own `check.ended`
    // carries the batch fields of the two-member batch (F148-FR-017), and
    // the batch admissions of the run exist beside it (F148-FR-012).
    const ended = events.filter(
      (event) => event.type === "check.ended" && event.data["checkId"] === "verify-b",
    );
    assert.ok(ended.length >= 1, "verify-b ended");
    const last = ended[ended.length - 1] as { data: Record<string, unknown> };
    assert.equal(typeof last.data["batch"], "number", "verify-b ran inside a batch");
    assert.equal(last.data["concurrent"], true, "verify-b ran beside another");
    const admissions = events.filter(
      (event) => event.type === "check.admission" && event.data["result"] === "admitted",
    );
    assert.ok(admissions.length >= 2, "the batch admitted more than one command");
    // BOTH executions are stated IN THE RESULT (F148-FR-016): the gate
    // record of the last attempt names the first — the batch execution,
    // exit 1, failed — and carries the rerun in `rerun` (`at: "alone"`,
    // exit 0, passed, not concurrent), beside the pair of observations the
    // runner stated in `observedResults` (`in the batch`, then `alone`).
    // The runner's own rule (`statedTogether`, run-batch.ts:229) leaves the
    // exit result of the FIRST execution exactly as observed, so the record
    // asserts that choice explicitly: the final verdict on verify-b is the
    // first execution's failure, with the passing rerun stated beside it,
    // never substituted for it.
    const attemptDir = join(g.control, "features", "001-one", "runs");
    let stated = "";
    const walk = (dir: string): void => {
      for (const name of existsSync(dir) ? readdirSync(dir).sort() : []) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (name === "verification.json") stated = readFileSync(path, "utf8");
      }
    };
    walk(attemptDir);
    const record = JSON.parse(stated) as {
      commands: readonly {
        declaredId?: string;
        exitCode: number | null;
        passed?: boolean;
        rerun?: {
          at: string;
          exitCode: number | null;
          passed: boolean;
          concurrent: boolean;
        };
        observedResults?: readonly {
          at: string;
          exitCode: number | null;
          passed: boolean;
        }[];
      }[];
    };
    const b = record.commands.find((command) => command.declaredId === "verify-b");
    assert.ok(b !== undefined, "the gate record names verify-b");
    // The FIRST execution: in the batch, failed with exit 1, and it STANDS
    // as the command's verdict (the runner never substitutes the rerun).
    assert.equal(b.exitCode, 1, "the gate record states the first execution's exit");
    assert.equal(b.passed, false, "the first execution failed, and the verdict is its own");
    // The SECOND execution, stated in the field `rerun` of the entry: run
    // ALONE, it passed with exit 0.
    assert.ok(b.rerun !== undefined, "the gate record states the rerun beside the first execution");
    assert.equal(b.rerun.at, "alone", "the rerun ran alone");
    assert.equal(b.rerun.exitCode, 0, "the rerun passed with exit 0");
    assert.equal(b.rerun.passed, true, "the rerun passed");
    assert.equal(b.rerun.concurrent, false, "the rerun ran beside no other command");
    // Both observations are listed, in order: the batch execution, then the
    // alone rerun.
    assert.ok(Array.isArray(b.observedResults), "both executions are listed as observations");
    assert.equal(b.observedResults.length, 2, "exactly two executions are stated");
    assert.deepEqual(
      b.observedResults.map((one) => one.at),
      ["in the batch", "alone"],
      "the observations name the batch execution first and the alone rerun second",
    );
    assert.deepEqual(
      b.observedResults.map((one) => [one.exitCode, one.passed]),
      [
        [1, false],
        [0, true],
      ],
      "the observations state the batch failure and the alone pass",
    );
  } finally {
    g.restore();
  }
});
