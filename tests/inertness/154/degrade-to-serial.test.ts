/**
 * T166 — A BROKEN SLOT STORE, AN UNREADABLE DEPENDENCY LINE AND A FAILED
 * LANDING EACH FALL BACK TO SERIAL WITH THE REASON RECORDED, AND NO ERROR
 * STOPS THE RUN (F154-FR-004, F154-FR-002).
 *
 * Three faults, three seams, one invariant per F154-FR-004: every failure of
 * the feature is a fallback with its reason recorded, never an error that
 * stops a run:
 *
 * - THE BROKEN SLOT STORE (the engine run): with `host.limits` on and the
 *   `checks` bound configured, the bound directory of the user-state root
 *   holds a FILE where the store's directory must be (the fault the slot
 *   store's own probe names — a full disk left a file there, say). The store
 *   answers `unbounded` with the reason `the slot store could not be read`,
 *   the `host.slot.admission` event carries the reason, and the run proceeds
 *   without the bound (spec 154 line 210: "the run proceeds unbounded with
 *   the reason recorded, and never stops") — exit 0, the layer's plan still
 *   made, the phase still ended approved.
 * - THE UNREADABLE DEPENDENCY LINE (the engine run): the test fault
 *   `SPECSTRIDE_FAULT_DEPENDENCY_LINE=1` makes the declaration reader of the
 *   frozen record raise the read error a malformed specstride comment line
 *   raises (`SpecstrideLineError`'s message). The wiring reads the
 *   declaration behind a guard: the pair is judged DEPENDENT over PG-0, ONE
 *   `parallel.admission` event records the check `dependency` with the read
 *   failure in its detail, the groups run ONE AFTER THE OTHER, and the run
 *   still reaches its normal end — exit 0 and `phase.ended` approved. No
 *   production path reads the fault variable.
 * - THE FAILED LANDING (the stage loop): stage B's gate is red on the
 *   rebased tree — LD-3 parks B ALONE with the existing exit 22 (F154-FR-052;
 *   F154-FR-002's parked-stage end), home is unchanged by B, the landing
 *   record holds the park, and the remaining stage of the plan carries on in
 *   declared order: A lands, the loop resolves, no error is thrown.
 *
 * The faults name no file-system permission and no model: the store fault is
 * a file where a directory must be (the store's own documented fault), the
 * declaration fault is a test-only environment variable read next to the
 * code path it affects, and the landing fault is a stub gate. Run:
 *     node --experimental-strip-types --test tests/inertness/154/degrade-to-serial.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import process from "node:process";

import { workspaceIdOfWorkspace } from "../../../packages/cli/src/engine/workspace-control-root.ts";
import { runFeature } from "../../../packages/cli/src/engine/run-feature.ts";
import { pinEngineEnv } from "../../../packages/cli/test/engine/helpers/fixture.ts";
import { sliceThePhase } from "../../../packages/core/src/spec-groups/slicer.ts";
import { runWideGroupLandings } from "../../../packages/pipeline/src/executor/stage-loop.ts";
import type {
  LandingApprovalsPort,
  LandingChecksPort,
  LandingGitPort,
} from "../../../packages/pipeline/src/executor/landing-run.ts";
import type { WorktreePort } from "../../../packages/pipeline/src/executor/stage-workspace.ts";
import { approvalCommitStanding } from "../../../packages/cli/src/engine/approval-commit.ts";
import type { Stage } from "../../../packages/pipeline/src/executor/types.ts";

/** The task list of `tests/fixtures/154/groups/` (three tasks, one phase). */
const TASKS_MD = readFileSync(
  join(import.meta.dirname, "../../fixtures/154/groups/tasks.md"),
  "utf8",
);

type RunEvent = { readonly type: string; readonly data: Record<string, unknown> };

type Fixture = {
  readonly run: () => Promise<number>;
  /** Every event of the run's control plane, in file order. */
  readonly events: () => readonly RunEvent[];
  /** The run's `[LOOP]` lines are on the process stream; the run log of the
   * control plane is read here in file order. */
  readonly restore: () => void;
};

/** The stub `claude`: proposer ticks and critic approvals over the JSON
 * protocol (`tests/inertness/154/helpers.ts`), for the main line's gate and
 * for every worker pass (the stub answers one pass, one tick). */
function stubClaude(): string {
  return `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC");
const role = prompt.includes("Diagnostician") ? "diagnostician" : (critic ? "critic" : "proposer");
if (role === "diagnostician") {
  console.log(JSON.stringify({ type: "system", subtype: "init", tools: [], session_id: session }));
  console.log(JSON.stringify({ type: "result", result: "CASE: GROUNDING\\nName the missing test of T001." }));
  process.exit(0);
}
console.log(JSON.stringify({ type: "system", subtype: "init", tools: critic ? [] : ["Read"], session_id: session }));
if (critic) {
  const nonce = /VERDICT ([0-9a-f]+): APPROVED/.exec(prompt)[1];
  console.log(JSON.stringify({ type: "result", result: "T001 judged.\\nVERDICT " + nonce + ": APPROVED" }));
} else {
  const checkpoint = /writing the file (\\S+?\\.checkpoint\\.json) with the exact content \\{"task\\":\\"(T\\d+)\\"\\}/.exec(prompt);
  if (checkpoint !== null) {
    fs.mkdirSync(path.dirname(checkpoint[1]), { recursive: true });
    fs.writeFileSync(checkpoint[1], JSON.stringify({ task: checkpoint[2] }));
  }
  const evidence = (/Write your evidence to (\\.specstride\\S+?) \\(/i.exec(prompt) ?? /write (\\.specstride\\S+?):/i.exec(prompt));
  if (evidence !== null) {
    fs.mkdirSync(path.dirname(evidence[1]), { recursive: true });
    fs.writeFileSync(evidence[1], "T001 done\\n");
    const tasks = "specs/001-one/tasks.md";
    fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replaceAll("[ ]", "[x]"));
  }
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;
}

/** The stub `dsh`: the door of the parallel layer's workers AND the run's
 * proposer (the only adapter the harness registry holds as `tested` for
 * concurrent sessions); it ticks the pass's checkpoint and exits 0. */
function stubDsh(): string {
  return `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = argv.filter((a) => !a.startsWith("--") && a !== "headless").join(" ");
if (prompt === "" || prompt.startsWith("--")) {
  console.log("dsh 1.0.0 (stub)");
  process.exit(0);
}
const checkpoint = /writing the file (\\S+?\\.checkpoint\\.json) with the exact content \\{"task\\":\\"(T\\d+)\\"\\}/.exec(prompt);
const writeCheckpoint = () => {
  if (checkpoint === null) return;
  fs.mkdirSync(path.dirname(checkpoint[1]), { recursive: true });
  fs.writeFileSync(checkpoint[1], JSON.stringify({ task: checkpoint[2] }));
};
const evidence = (/Write your evidence to (\\.specstride\\S+?) \\(/i.exec(prompt) ?? /write (\\.specstride\\S+?):/i.exec(prompt));
if (evidence !== null) {
  fs.mkdirSync(path.dirname(evidence[1]), { recursive: true });
  fs.writeFileSync(evidence[1], "T001 done\\n");
  const tasks = "specs/001-one/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replaceAll("[ ]", "[x]"));
}
writeCheckpoint();
process.exit(0);
`;
}

/**
 * The hermetic fixture of the engine-run subtests: a workspace over
 * `tests/fixtures/154/groups`, a private HOME, the stubs on PATH, every
 * parallel switch of spec 154 ON, `host.limits` on, and the frozen groups of
 * the launch record (the shape `tests/parallel/154/harness-error-154.test.ts`
 * proved). `extraEnv` carries the subtest's fault or bound.
 */
function fixture154(extraEnv: Readonly<Record<string, string>>): Fixture {
  const root = mkdtempSync(join(tmpdir(), "specstride-t166-154-"));
  const bin = join(root, "bin");
  const home = join(root, "home");
  const work = join(root, "work");
  mkdirSync(bin);
  mkdirSync(home);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  writeFileSync(join(bin, "claude"), stubClaude());
  chmodSync(join(bin, "claude"), 0o755);
  writeFileSync(join(bin, "dsh"), stubDsh());
  chmodSync(join(bin, "dsh"), 0o755);
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
    PHASES: process.env.SPECSTRIDE_LOOP_PHASES_PARALLEL,
    UNITS: process.env.SPECSTRIDE_LOOP_PARALLEL_UNITS,
    GUNITS: process.env.SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS,
    CHECK: process.env.SPECSTRIDE_LOOP_PARALLEL_GROUP_CHECK,
    LIMITS: process.env.SPECSTRIDE_HOST_LIMITS,
    BOUND: process.env.SPECSTRIDE_HOST_CHECKS_CONCURRENT,
    FAULT: process.env.SPECSTRIDE_FAULT_DEPENDENCY_LINE,
    LAUNCH: process.env.SPECSTRIDE_LAUNCH_ID,
  };
  process.env.HOME = home;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  process.env.SPECSTRIDE_LOOP_PHASES_PARALLEL = "on";
  process.env.SPECSTRIDE_LOOP_PARALLEL_UNITS = "on";
  process.env.SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS = "on";
  process.env.SPECSTRIDE_LOOP_PARALLEL_GROUP_CHECK = "on";
  const restoreEngineEnv = pinEngineEnv({ feature: "001-one" });
  process.env.SPECSTRIDE_PROPOSER = "dsh:zai/glm-5.3-flash";
  process.env.SPECSTRIDE_HOST_LIMITS = "on";
  process.env.SPECSTRIDE_LAUNCH_ID = "L1";
  for (const [name, value] of Object.entries(extraEnv)) process.env[name] = value;

  const userDir = join(home, ".config", "specstride");
  mkdirSync(userDir, { recursive: true });
  writeFileSync(
    join(userDir, "config.yaml"),
    "schema: 1\nloop:\n  taskGroups: true\n  parallel:\n    allow_detect: true\n",
  );
  const control = join(home, ".specstride", "workspaces", workspaceIdOfWorkspace(work));
  mkdirSync(join(control, "features", "001-one", "verification"), { recursive: true });
  writeFileSync(
    join(control, "features", "001-one", "verification", "verification-commands.json"),
    JSON.stringify({
      schema_version: "specstride.verification-commands/1",
      discovery: "none",
      commands: [
        {
          id: "verify-group-one",
          phase: 1,
          executable: "node",
          args: [join(work, "bin", "noop.cjs"), join(work, "checks.txt")],
          cwd: work,
          timeoutSec: 30,
        },
      ],
    }),
  );
  // THE FROZEN GROUPS of the launch record: the pure table slices the one
  // phase; the record freezes what the engine reads under `groupUnits`, so
  // the groups of the attempt ARE units of a pair decision.
  const sliced = sliceThePhase({
    phase: 1,
    // THREE groups of one task each, with disjoint write scopes — so the
    // attempt's groups ARE units of a pair decision (fromTaskGroup).
    size: 1,
    tasks: [
      { id: "T001", text: "Do it" },
      { id: "T002", text: "Do more" },
      { id: "T003", text: "Do the rest" },
    ],
    pathsOfTask: (taskId) =>
      taskId === "T001" ? ["packages/a/"] : taskId === "T002" ? ["packages/b/"] : ["packages/c/"],
    declaredCommands: [
      {
        id: "verify-group-one",
        argv: ["node", join(work, "bin", "noop.cjs"), join(work, "checks.txt")],
        forTaskIds: ["T001", "T002", "T003"],
      },
    ],
  });
  const recordPath = join(control, "launches", "L1", "launch.json");
  mkdirSync(join(recordPath, ".."), { recursive: true });
  writeFileSync(
    recordPath,
    JSON.stringify({
      schema: "specstride.launch/1",
      configuration: {
        taskGroups: {
          schema: "specstride.task-groups-frozen/1",
          hashes: { phase1: sliced.hash },
          groups: sliced.groups,
        },
      },
    }),
  );

  const readEvents = (): readonly RunEvent[] => {
    const base = join(home, ".specstride", "workspaces", workspaceIdOfWorkspace(work));
    const all: RunEvent[] = [];
    for (const root of [
      base,
      join(home, ".local", "state", "specstride", "workspaces", "001-one"),
    ]) {
      for (const runs of [join(root, "runs"), join(root, "features", "001-one", "runs")]) {
        for (const run of existsSync(runs) ? readdirSync(runs).sort() : []) {
          const file = join(runs, run, "events.jsonl");
          if (!existsSync(file)) continue;
          for (const line of readFileSync(file, "utf8").split("\n")) {
            if (line.trim() === "") continue;
            const parsed = JSON.parse(line) as { type: string; data?: Record<string, unknown> };
            all.push({ type: parsed.type, data: parsed.data ?? {} });
          }
        }
      }
    }
    return all;
  };

  return {
    run: () => runFeature({ argv: [], workdir: work }),
    events: readEvents,
    restore: () => {
      restoreEngineEnv();
      process.env.HOME = before.HOME;
      process.env.PATH = before.PATH;
      const put = (name: string, was: string | undefined): void => {
        if (was === undefined) delete process.env[name];
        else process.env[name] = was;
      };
      put("SPECSTRIDE_LOOP_PHASES_PARALLEL", before.PHASES);
      put("SPECSTRIDE_LOOP_PARALLEL_UNITS", before.UNITS);
      put("SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS", before.GUNITS);
      put("SPECSTRIDE_LOOP_PARALLEL_GROUP_CHECK", before.CHECK);
      put("SPECSTRIDE_HOST_LIMITS", before.LIMITS);
      put("SPECSTRIDE_HOST_CHECKS_CONCURRENT", before.BOUND);
      put("SPECSTRIDE_FAULT_DEPENDENCY_LINE", before.FAULT);
      put("SPECSTRIDE_LAUNCH_ID", before.LAUNCH);
      rmSync(root, { recursive: true, force: true });
    },
  };
}

test("T166: a broken slot store answers unbounded with its reason recorded and the run carries on (exit 0)", async () => {
  const fixture = fixture154({ SPECSTRIDE_HOST_CHECKS_CONCURRENT: "1" });
  try {
    const stateRoot = join(process.env.HOME as string, ".local", "state", "specstride", "user", "slots");
    mkdirSync(stateRoot, { recursive: true });
    writeFileSync(join(stateRoot, "checks"), "a file where the bound directory must be\n");

    const exit = await fixture.run();
    const events = fixture.events();
    const of = (type: string): readonly RunEvent[] => events.filter((one) => one.type === type);

    // NO ERROR STOPS THE RUN (F154-FR-004): exit 0, the normal end.
    assert.equal(exit, 0, `the run ended ${String(exit)}`);

    // THE DEGRADE, WITH ITS REASON: the take of the `checks` slot met the
    // broken store, the store answered `unbounded`, and ONE
    // `host.slot.admission` event carries the reason (verdict `rejected`,
    // slot verdict `unbounded`).
    const admissions = of("host.slot.admission");
    const unbounded = admissions.filter(
      (one) =>
        one.data["rule"] === "checks" &&
        (one.data["slotVerdict"] === "unbounded" ||
          String(one.data["reason"]).includes("the slot store could not be read")),
    );
    assert.ok(
      unbounded.length > 0,
      `no unbounded admission among ${JSON.stringify(admissions.map((one) => one.data))}`,
    );
    for (const one of unbounded) {
      assert.ok(
        String(one.data["reason"]).includes("the slot store could not be read"),
        `the reason is missing: ${JSON.stringify(one.data)}`,
      );
      assert.equal(one.data["verdict"], "rejected");
    }

    // THE RUN CARRIED ON: the layer planned, and the phase attempt reached
    // its approved end exactly as with the limits off.
    assert.ok(of("parallel.plan").length > 0, "no parallel.plan — the layer never planned");
    const phaseEnded = of("phase.ended");
    assert.ok(phaseEnded.length > 0, "no phase.ended — the run never finished the phase");
    assert.equal(phaseEnded[0]?.data["outcome"], "approved");
  } finally {
    fixture.restore();
  }
});

test("T166: an unreadable dependency line degrades the pair to serial with the reason recorded (exit 0)", async () => {
  const fixture = fixture154({ SPECSTRIDE_FAULT_DEPENDENCY_LINE: "1" });
  try {
    const exit = await fixture.run();
    const events = fixture.events();
    const of = (type: string): readonly RunEvent[] => events.filter((one) => one.type === type);

    // NO ERROR STOPS THE RUN (F154-FR-004): the read failure never left the
    // wiring as an exception; the run reached its normal end.
    assert.equal(exit, 0, `the run ended ${String(exit)}`);

    // THE DEGRADE, WITH ITS REASON: the pair was judged DEPENDENT over PG-0,
    // ONE `parallel.admission` event recorded the check `dependency` with
    // the read failure in its detail, and no pair was admitted AT ONCE.
    const dependency = of("parallel.admission").filter(
      (one) =>
        one.data["ruleId"] === "PG-0" &&
        JSON.stringify(one.data["verdicts"]).includes("the dependency declaration could not be read"),
    );
    assert.ok(
      dependency.length > 0,
      `no dependency degrade event among ${JSON.stringify(of("parallel.admission").map((one) => one.data))}`,
    );
    for (const one of dependency) {
      assert.equal(one.data["admitted"], false);
      const verdicts = one.data["verdicts"] as readonly {
        check: string;
        verdict: string;
        detail: string;
      }[];
      assert.equal(verdicts[0]?.check, "dependency");
      assert.equal(verdicts[0]?.verdict, "refused");
    }
    // THE GROUPS RAN ONE AFTER THE OTHER: no pair admission (admitted at
    // once) stands beside the degrade.
    assert.equal(
      of("parallel.admission").filter((one) => one.data["admitted"] === true && one.data["pairWith"] !== undefined)
        .length,
      0,
      "a pair was admitted at once beside an unreadable declaration",
    );

    // THE RUN CARRIED ON to its approved end.
    const phaseEnded = of("phase.ended");
    assert.ok(phaseEnded.length > 0, "no phase.ended — the run never finished the phase");
    assert.equal(phaseEnded[0]?.data["outcome"], "approved");
  } finally {
    fixture.restore();
  }
});

/* ------------------------------------------------------------------ *
 * The failed landing: the stage loop of the pipeline (the seam the
 * landing lives in — `runWideGroupLandings`, T119's glue).
 * ------------------------------------------------------------------ */

/** Hardened git (PU-81): no system or global configuration, no hooks. */
function git(workdir: string, argv: readonly string[]): { exit: number; out: string } {
  const result = spawnSync(
    "git",
    ["-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false", "-C", workdir, ...argv],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_CONFIG_GLOBAL: "/dev/null",
        GIT_CONFIG_SYSTEM: "/dev/null",
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_TERMINAL_PROMPT: "0",
        LEFTHOOK: "0",
      },
    },
  );
  return { exit: result.status ?? 1, out: result.stdout ?? "" };
}

/** A stage entry of the wide group, as the contract's stages reach the glue. */
function stageOf(id: string): Stage {
  return { id, kind: "specstride", dependencies: [], preconditions: [], postconditions: [] };
}

/** A fresh home repository with one base commit. */
function makeHomeAt(home: string): void {
  mkdirSync(home, { recursive: true });
  assert.equal(git(home, ["init", "-q", "-b", "main"]).exit, 0);
  git(home, ["config", "user.email", "t@t"]);
  git(home, ["config", "user.name", "t"]);
  writeFileSync(join(home, "shared.txt"), "line: base\n");
  assert.equal(git(home, ["add", "-A"]).exit, 0);
  assert.equal(git(home, ["commit", "-qm", "base"]).exit, 0);
}

/** A clone of `home` with one commit that sets one line of `shared.txt`. */
function makeStageRepo(home: string, target: string, stage: string, line: string): void {
  mkdirSync(target, { recursive: true });
  assert.equal(git(target, ["clone", "-q", home, target]).exit, 0);
  git(target, ["config", "user.email", "t@t"]);
  git(target, ["config", "user.name", "t"]);
  writeFileSync(join(target, "shared.txt"), `line: ${line}\n`);
  writeFileSync(join(target, `${stage}.txt`), `${stage}\n`);
  assert.equal(git(target, ["add", "-A"]).exit, 0);
  assert.equal(git(target, ["commit", "-qm", stage]).exit, 0);
}

/** HEAD of a repository. */
function headOf(repo: string): string {
  const out = git(repo, ["rev-parse", "HEAD"]);
  assert.equal(out.exit, 0);
  return out.out.trim();
}

/** The test's worktree port: a copy of the stage's prepared repository. */
function worktreePort(prepared: Readonly<Record<string, string>>): WorktreePort {
  return {
    async add(_home, workspace) {
      const source = prepared[basename(workspace)];
      assert.ok(source !== undefined, `no prepared repository for ${workspace}`);
      cpSync(source, workspace, { recursive: true });
    },
    async remove(workspace) {
      rmSync(workspace, { recursive: true, force: true });
    },
  };
}

/** The hardened git port over real repositories (PU-81). */
function gitPort(): LandingGitPort {
  return {
    async rebaseOnto(home, workspace) {
      assert.equal(git(workspace, ["fetch", "-q", "origin", "main"]).exit, 0);
      return git(workspace, ["rebase", "FETCH_HEAD"]).exit === 0 ? "clean" : "conflict";
    },
    async abortRebase(workspace) {
      git(workspace, ["rebase", "--abort"]);
    },
    async mergeFastForward(workspace, home) {
      assert.equal(git(home, ["fetch", "-q", workspace, "main"]).exit, 0);
      assert.equal(git(home, ["merge", "--ff-only", "FETCH_HEAD"]).exit, 0);
    },
  };
}

/** The checks port: the gate of each stage, through the stub. */
function checksPort(green: Readonly<Record<string, boolean>>): LandingChecksPort & { calls: string[] } {
  return {
    calls: [],
    async runGate(_workspace, stage) {
      this.calls.push(stage);
      return green[stage] ?? true;
    },
  };
}

/** The approvals port: the standing of each stage's commit after the landing. */
function approvalsPort(commits: Readonly<Record<string, string>>): LandingApprovalsPort {
  return {
    async noteRewriteAfterFastForward(_workspace, home) {
      return {
        commits: Object.entries(commits).map(([, commit]) => {
          const standing = approvalCommitStanding(home, commit);
          return {
            commit,
            standing: standing.standing,
            equivalent: standing.standing === "rebased" ? standing.equivalent : null,
          };
        }),
      };
    },
  };
}

test("T166: a failed landing parks its stage alone with the recorded reason and the rest of the plan carries on", async () => {
  const root = mkdtempSync(join(tmpdir(), "specstride-t166-landing-"));
  try {
    const home = join(root, "home");
    makeHomeAt(home);
    const base = headOf(home);

    // A and B set the SAME line of one file: A lands first (LD-1), and B's
    // GATE is red on the rebased tree — the stub gate fails B alone (LD-3).
    const repoA = join(root, "repo-a");
    const repoB = join(root, "repo-b");
    makeStageRepo(home, repoA, "A", "by-A");
    makeStageRepo(home, repoB, "B", "by-A");
    const commitA = headOf(repoA);

    // THE FAILED LANDING RESOLVES, IT NEVER THROWS: the loop runs the
    // stages in declared order (serially), parks B, and answers.
    const result = await runWideGroupLandings({
      controlRoot: root,
      home,
      pipelineRunId: "p-t166",
      stages: [stageOf("A"), stageOf("B")],
      ports: {
        worktree: worktreePort({ A: repoA, B: repoB }),
        git: gitPort(),
        checks: checksPort({ A: true, B: false }),
        approvals: approvalsPort({ A: commitA }),
      },
      now: () => new Date("2026-11-25T00:00:00Z"),
    });

    // A landed; B is parked ALONE — the failed landing takes no other stage
    // down (F154-FR-052; the parked-stage end of F154-FR-002).
    assert.deepEqual([...result.landed], ["A"]);
    assert.deepEqual([...result.parked], ["B"]);
    // THE PARKED STAGE'S CODE IS THE EXISTING EXIT 22, and no other code.
    assert.equal(result.exitCode, 22);
    assert.deepEqual(
      result.stages.map((one) => [one.stage, one.exitCode]),
      [
        ["A", null],
        ["B", 22],
      ],
    );
    // THE REASON IS RECORDED, with its rule id: A landed over LD-1, B's
    // park is the red gate LD-3.
    assert.equal(result.stages[0]?.ruleId, "LD-1");
    assert.equal(result.stages[1]?.ruleId, "LD-3");

    // THE REST OF THE PLAN CARRIED ON: home advanced by A alone — B's park
    // changed nothing there — and B's stage workspace was removed.
    assert.equal(headOf(home), commitA);
    assert.equal(readFileSync(join(home, "shared.txt"), "utf8"), "line: by-A\n");
    assert.notEqual(headOf(home), base);
    assert.equal(existsSync(join(root, "stage-workspaces", "p-t166", "B")), false, "B's workspace stands");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
