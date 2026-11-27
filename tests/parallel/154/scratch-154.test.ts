/**
 * T155 (feature 154, phase 17, G8) — THE TEMPORARY-ROOT CONTAINMENT AUDIT
 * (V-08; F154-FR-072 + F154-FR-043).
 *
 * Every temporary file a run makes must sit under the run's temporary root
 * (or a stage workspace); when the run ends — for any cause — that root is
 * removed and ZERO run-created files remain anywhere else:
 *
 *  - A hermetic parallel run over `tests/fixtures/154/groups` (the full
 *    stub-claude / private-HOME harness, every parallel switch on: phases
 *    parallel, group units and group check) exits 0, and the stub proposer
 *    saw the engine's export: a `TMPDIR` under the system temporary area
 *    whose name carries the run prefix `specstride-run-`.
 *  - AFTER the run, that temporary root is GONE (F154-FR-043) and a diff of
 *    the system temporary area, the temporary HOME, the workspace and an
 *    outside marker directory finds 0 run-created files outside the roots
 *    the run is allowed to touch (F154-FR-072).
 *  - The temporary HOME holds no slot or hold record (F154-FR-044) and the
 *    run really ran parallel (its control plane carries `parallel.` events).
 *
 * Run from the repository root:
 *     node --experimental-strip-types --test tests/parallel/154/scratch-154.test.ts
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
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
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import test from "node:test";

import { workspaceIdOfWorkspace } from "../../../packages/cli/src/engine/workspace-control-root.ts";
import { runFeature } from "../../../packages/cli/src/engine/run-feature.ts";
import { pinEngineEnv } from "../../../packages/cli/test/engine/helpers/fixture.ts";
import { sliceThePhase } from "../../../packages/core/src/spec-groups/slicer.ts";
import { slotAndHoldFiles } from "../../inertness/154/helpers.ts";

/** The task list of `tests/fixtures/154/groups/` (three groups, one phase). */
const TASKS_MD = readFileSync(
  join(import.meta.dirname, "../../fixtures/154/groups/tasks.md"),
  "utf8",
);

/** The stub `claude` executable: proposer ticks, critic approves — and it
 * reports every temporary area the engine exported to it, so the test can
 * name the run's temporary root the engine itself chose. */
function stubClaude(): string {
  return `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC");
const role = prompt.includes("Diagnostician") ? "diagnostician" : (critic ? "critic" : "proposer");
const log = path.join(process.env.HOME, "prompts.jsonl");
fs.appendFileSync(log, JSON.stringify({
  role, prompt, session,
  tmp: process.env.SPECSTRIDE_WORKER_TMPDIR ?? process.env.TMPDIR ?? null,
}) + "\\n");
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

/** The stub `dsh` executable: the door of the parallel layer's workers. The
 * `claude` adapter has no worker door (the harness registry holds it as
 * `declared`, F142-FR-020), so the run's implementer must be the dsh
 * harness — the descriptor carries `concurrentSessions` `verified` — for a
 * representative parallel attempt to run. The stub does the proposer's work
 * of the pass (evidence, checkpoint, ticked tasks) and exits 0. */
function stubDsh(): string {
  return `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const prompt = process.argv[process.argv.length - 1] ?? "";
if (prompt.startsWith("--")) process.exit(0); // a --version probe or a flag
const evidence = (/Write your evidence to (\\.specstride\\S+?) \\(/i.exec(prompt) ?? /write (\\.specstride\\S+?):/i.exec(prompt));
if (evidence !== undefined) {
  fs.mkdirSync(path.dirname(evidence[1]), { recursive: true });
  fs.writeFileSync(evidence[1], "T001 done\\n");
  fs.mkdirSync(".specstride/features/001-one/outbox", { recursive: true });
  fs.writeFileSync(
    ".specstride/features/001-one/outbox/u1.checkpoint.json",
    JSON.stringify({ schema: "specstride.checkpoint/1", tasks: ["T001", "T002", "T003"] }),
  );
  const tasks = "specs/001-one/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replaceAll("[ ]", "[x]"));
}
process.exit(0);
`;
}

type Fixture = {
  readonly work: string;
  readonly home: string;
  /** Run the engine once, every parallel switch of spec 154 on. */
  readonly run: () => Promise<number>;
  /** The temporary areas the stub calls saw exported by the engine. */
  readonly tmpExports: () => readonly (string | null)[];
  /** The event types of the run, in file order. */
  readonly eventTypes: () => readonly string[];
  readonly restore: () => void;
};

/** The hermetic fixture: a workspace over FX-154-GROUPS, a private HOME, the
 * stub on PATH — and every parallel switch of spec 154 ON. */
function fixture154Parallel(): Fixture {
  const root = mkdtempSync(join(tmpdir(), "specstride-t155-154-"));
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
    UNITS2: process.env.SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS,
    UNITS: process.env.SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS,
    CHECK: process.env.SPECSTRIDE_LOOP_PARALLEL_GROUP_CHECK,
    LIMITS: process.env.SPECSTRIDE_HOST_LIMITS,
    LAUNCH: process.env.SPECSTRIDE_LAUNCH_ID,
  };
  process.env.HOME = home;
  process.env.PATH = `${bin}:${before.PATH ?? ""}`;
  // The parallel switches (the rank-4 environment aliases of
  // `loop.phases.parallel`, `loop.parallel.units`, `loop.parallel.groupUnits`
  // and `loop.parallel.groupCheck`).
  process.env.SPECSTRIDE_LOOP_PHASES_PARALLEL = "on";
  process.env.SPECSTRIDE_LOOP_PARALLEL_UNITS = "on";
  process.env.SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS = "on";
  process.env.SPECSTRIDE_LOOP_PARALLEL_GROUP_CHECK = "on";
  const restoreEngineEnv = pinEngineEnv({ feature: "001-one" });
  // AFTER the pin: the implementer of the passes is the dsh harness (the
  // alias `dsh`), the only adapter the harness registry holds as `tested`
  // for concurrent sessions — the precondition a representative parallel
  // attempt must pass. The critic stays the stub `claude`.
  process.env.SPECSTRIDE_PROPOSER = "dsh:zai/glm-5.3-flash";
  // AFTER the pin (the pin resets the limits to the engine's defaults, and
  // the default of `host.limits` is OFF): the limits switch puts the run's
  // temporary root in force — the one temporary area the audit covers.
  process.env.SPECSTRIDE_HOST_LIMITS = "on";

  // THE FROZEN GROUPS OF THE LAUNCH RECORD (T379): with
  // `loop.parallel.groupUnits` on, the engine reads the groups from the
  // launch record (`launch:<id>:record`, through `SPECSTRIDE_LAUNCH_ID`)
  // — one worker per group. The record freezes the groups as the pure
  // table slices them, with the declared command as the acceptance check.
  process.env.SPECSTRIDE_LAUNCH_ID = "L1";
  const userDir = join(home, ".config", "specstride");
  mkdirSync(userDir, { recursive: true });
  writeFileSync(
    join(userDir, "config.yaml"),
    // `loop.taskGroups` (row 142) and `loop.parallel.allow_detect` — read
    // from USER configuration alone (F142-FR-003, CQ-183): the descriptor's
    // containment ceiling (C1) is below C2, so the group runs only with the
    // opt-in, protection=detect.
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
  const sliced = sliceThePhase({
    phase: 1,
    tasks: [
      { id: "T001", text: "Do it" },
      { id: "T002", text: "Do more" },
      { id: "T003", text: "Do the rest" },
    ],
    pathsOfTask: () => [],
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

  const readEventTypes = (): string[] => {
    const control = join(home, ".specstride", "workspaces", workspaceIdOfWorkspace(work));
    const all: string[] = [];
    for (const base of [
      control,
      join(home, ".local", "state", "specstride", "workspaces", "001-one"),
    ]) {
      for (const runs of [join(base, "runs"), join(base, "features", "001-one", "runs")]) {
        for (const run of existsSync(runs) ? readdirSync(runs).sort() : []) {
          const file = join(runs, run, "events.jsonl");
          if (!existsSync(file)) continue;
          for (const line of readFileSync(file, "utf8").split("\n")) {
            if (line.trim() === "") continue;
            all.push((JSON.parse(line) as { type: string }).type);
          }
        }
      }
    }
    return all;
  };
  const readTmpExports = (): (string | null)[] => {
    const file = join(home, "prompts.jsonl");
    if (!existsSync(file)) return [];
    return readFileSync(file, "utf8")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => (JSON.parse(line) as { tmp: string | null }).tmp);
  };

  return {
    work,
    home,
    run: () => runFeature({ argv: [], workdir: work }),
    tmpExports: readTmpExports,
    eventTypes: readEventTypes,
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
      put("SPECSTRIDE_LOOP_PARALLEL_GROUP_UNITS", before.UNITS2);
      put("SPECSTRIDE_LOOP_PARALLEL_GROUP_CHECK", before.CHECK);
      put("SPECSTRIDE_HOST_LIMITS", before.LIMITS);
      put("SPECSTRIDE_LAUNCH_ID", before.LAUNCH);
      rmSync(root, { recursive: true, force: true });
    },
  };
}

/** Every file path under `dir`, recursively (empty list when absent). */
function walk(dir: string): readonly string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  const stack = [dir];
  while (stack.length > 0) {
    const at = stack.pop()!;
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const path = join(at, entry.name);
      out.push(path);
      if (entry.isDirectory()) stack.push(path);
    }
  }
  return out;
}

test("G8 T155: every temporary file of the run sits under the run's temporary root and 0 files remain anywhere else when the run ends (V-08, F154-FR-072, F154-FR-043)", async () => {
  const fixture = fixture154Parallel();
  // A marker directory OUTSIDE every root the run may touch: nothing the
  // run creates may ever land in it.
  const outside = join(tmpdir(), `specstride-t155-outside-${randomBytes(6).toString("hex")}`);
  mkdirSync(outside);
  try {
    // BEFORE: snapshot the system temporary area, the temporary HOME and
    // the workspace (the setup is done, so the snapshot is the pre-run
    // state; other processes may share the OS tmpdir, hence the diff).
    const tmpBefore = new Set(readdirSync(tmpdir()));
    const homeBefore = new Set(walk(fixture.home));
    const workBefore = new Set(walk(fixture.work));

    const exit = await fixture.run();
    assert.equal(exit, 0, `the run ended ${String(exit)}`);

    // THE PARALLEL ATTEMPT REALLY RAN: the control plane carries events of
    // the parallel switches.
    const types = fixture.eventTypes();
    assert.ok(
      types.some((type) => type.startsWith("parallel.")),
      `no parallel event in the run: ${types.join(",")}`,
    );

    // THE ENGINE'S OWN TEMPORARY ROOT: the stub calls saw it exported — a
    // directory under the system temporary area, prefix `specstride-run-`
    // (what `makeRunTempRoot`/`exportRunTempRoot` make and export).
    const exports = fixture.tmpExports();
    assert.ok(exports.length > 0, "the stub was never called");
    const roots = new Set(exports.filter((one): one is string => one !== null));
    assert.ok(roots.size > 0, "the engine exported no temporary root to the stub");
    for (const root of roots) {
      assert.ok(
        root.startsWith(tmpdir()),
        `the temporary root is outside the temporary area: ${root}`,
      );
      assert.ok(
        /[/\\]specstride-run-/.test(root),
        `the temporary root lacks the run prefix: ${root}`,
      );
      // F154-FR-043: removed where the run ended, for any cause.
      assert.equal(existsSync(root), false, `the temporary root remained: ${root}`);
    }

    // THE DIFF AFTER THE RUN: no new entry of the system temporary area
    // carries the run prefix (scoped, so concurrent activity elsewhere in
    // the OS tmpdir cannot trip the audit).
    const tmpAfter = new Set(readdirSync(tmpdir()));
    const newly = [...tmpAfter].filter((one) => !tmpBefore.has(one));
    const leaked = newly.filter(
      (one) => one.startsWith("specstride-run-") || one.startsWith("specstride-t155-"),
    );
    assert.deepEqual(
      leaked,
      [],
      `run-created files remain in the temporary area: ${leaked.join(", ")}`,
    );

    // THE ALLOWED ROOTS: the temporary HOME and the workspace hold no path
    // that names the run's temporary area — every temporary file the run
    // made lived under the root that is now gone.
    const homeFiles = walk(fixture.home);
    const workFiles = walk(fixture.work);
    const inHome = homeFiles.filter((one) => one.includes("specstride-run-"));
    const inWork = workFiles.filter((one) => one.includes("specstride-run-"));
    assert.deepEqual(
      inHome,
      [],
      `temporary-area files under the temporary HOME: ${inHome.join(", ")}`,
    );
    assert.deepEqual(inWork, [], `temporary-area files under the workspace: ${inWork.join(", ")}`);

    // NO SLOT OR HOLD RECORD under the temporary HOME (F154-FR-044).
    assert.deepEqual(
      slotAndHoldFiles(fixture.home),
      [],
      "slot or hold files under the temporary HOME",
    );

    // THE OUTSIDE MARKER: untouched — 0 files anywhere the run may not write.
    assert.deepEqual(walk(outside), [], "the run wrote into the outside marker directory");

    // SANITY: the workspace and HOME really did change during the run (the
    // diff above is over a live run, not an empty one).
    assert.ok(
      walk(fixture.work).some((one) => !workBefore.has(one)),
      "the run changed nothing in the workspace",
    );
    assert.ok(
      walk(fixture.home).some((one) => !homeBefore.has(one)),
      "the run changed nothing under the temporary HOME",
    );
  } finally {
    fixture.restore();
    rmSync(outside, { recursive: true, force: true });
  }
});
