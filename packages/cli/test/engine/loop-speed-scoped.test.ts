/**
 * Phase 21 of feature 153, US3 — the scoped in-pass check
 * (F153-FR-045 to F153-FR-047):
 *
 *  - T281 CT-153-45 a change under `pkgs/a` runs the reverse-dependency
 *    closure of `a` — the in-pass check writes counter-a, counter-b and
 *    counter-c, and never counter-d;
 *  - T282 CT-153-47 the gate always runs the full set — every counter gains
 *    a line at the gate of every attempt (WS-2);
 *  - T283 CT-153-46 a change under no workspace widens — a change to
 *    `README.md` (under no workspace directory) runs all four in-pass
 *    (WS-5);
 *  - T284 CT-153-46 a graph changed in the pass widens — the proposer
 *    editing `packages/contracts/data/package-graph.json` runs all four
 *    in-pass (WS-4);
 *  - T285 the selection is recorded — every decision of the
 *    `workspace-selection` table is written D15 and validates against
 *    `workspace-selection.schema.json`, with the rule id that decided;
 *  - T286 CT-153-5 the switch off runs the whole inner set — with
 *    `verification.inner.scoped: false`, and under `profile: parity`, the
 *    in-pass check runs all four commands (WS-1).
 *
 * No paid or external model API is called (F153-FR-060): the proposer and
 * the critic are a stub `claude` written here, and the commands are `node`
 * over the counter script of the fixture.
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
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Ajv2020 } from "ajv/dist/2020.js";

import { runFeature } from "../../src/engine/run-feature.ts";
import { workspaceIdOfWorkspace } from "../../src/engine/workspace-control-root.ts";

const HERE = fileURLToPath(new URL(".", import.meta.url));

/** The fixture directory this file copies into every workspace. */
const FIXTURE = resolve(HERE, "../fixtures/loop-speed/four-workspaces");

/** The counter: appends one line to the file its argument names, exits 0. */
const COUNTER = readFileSync(join(FIXTURE, "bin/count-and-pass.ts"), "utf8");

/** The static graph of the fixture: a -> b -> c, with d independent. */
const GRAPH = readFileSync(
  join(FIXTURE, "packages", "contracts", "data", "package-graph.json"),
  "utf8",
);

/**
 * The task list: a TWO-task phase — the layer `micro` falls back with
 * `single-unit` where the phase holds one task at launch (F115-FR-005).
 */
const TASKS = "# Tasks\n\n## Phase 1: One\n\n- [ ] T001 Do it\n- [ ] T002 Do more\n";

/**
 * The checkpoint the proposer pass writes, as the outbox contract of
 * feature 115 reads it; the pass ticks exactly its own task, so two passes
 * end the phase.
 */
const WRITE_CHECKPOINT = `const outbox = ".specstride/features/001-one/outbox";
  fs.mkdirSync(outbox, { recursive: true });
  const unit = (/u(\\d+)\\.checkpoint/.exec(prompt) || ["", "1"])[1];
  const list = fs.readFileSync("specs/001-one/tasks.md", "utf8");
  const taskId = (/\\- \\[ \\] (T\\d+)/.exec(list) || ["", "T001"])[1];
  fs.writeFileSync(path.join(outbox, "u" + unit + ".checkpoint.json"),
    JSON.stringify({ schema: "specstride.checkpoint/1", tasks: [taskId] }));
  fs.writeFileSync("specs/001-one/tasks.md",
    list.replace("- [ ] " + taskId, "- [x] " + taskId));`;

/**
 * The stub `claude` of this file: like `stubClaude` of the helpers, minus
 * the files the baseline stub plants at the root of the workspace
 * (`made.txt`, `newdir/inside.txt`) — those would be changed paths under no
 * workspace, and rule WS-5 would widen every run of this file before the
 * case under test could even fire.
 */
function scopedStub(proposerExtra: string): string {
  return `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path");
const argv = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
const session = argv[argv.indexOf("--session-id") + 1];
const critic = argv.includes("--max-turns") || prompt.startsWith("You are the CRITIC"); // the parity profile argv carries no --max-turns (F125-FR-009)
const role = prompt.includes("Diagnostician") ? "diagnostician" : (critic ? "critic" : "proposer");
fs.appendFileSync("prompts.jsonl", JSON.stringify({ role, prompt }) + "\\n");
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
  ${WRITE_CHECKPOINT}
  ${proposerExtra}
  const tasks = "specs/001-one/tasks.md";
  fs.writeFileSync(tasks, fs.readFileSync(tasks, "utf8").replace("[ ]", "[x]"));
  console.log(JSON.stringify({ type: "result", result: "ok" }));
}
`;
}

/** The declared commands of the fixture, with `WORKDIR` replaced. */
function commandsOf(work: string): readonly Record<string, unknown>[] {
  const raw = JSON.parse(
    readFileSync(join(FIXTURE, "verification/verification-commands.json"), "utf8"),
  ) as { commands: Record<string, unknown>[] };
  return raw.commands.map((command) => ({
    ...command,
    args: (command["args"] as string[]).map((arg) => arg.replaceAll("WORKDIR", work)),
    cwd: (command["cwd"] as string).replaceAll("WORKDIR", work),
  }));
}

type ScopedOptions = {
  /** Extra statements in the proposer branch of the stub `claude`. */
  readonly proposerExtra?: string;
  /** A configuration file of the USER, written under the fixture home. */
  readonly userConfig?: string;
};

/** The fixture of this file: the four-workspaces fixture, git-tracked. */
function scopedFixture(options: ScopedOptions): {
  readonly work: string;
  readonly control: string;
  /** The as-is control plane the parity profile reads (F153-FR-061). */
  readonly asIsControl: string;
  readonly restore: () => void;
} {
  const root = mkdtempSync(join(tmpdir(), "specstride-scoped-"));
  const bin = join(root, "bin");
  const work = join(root, "work");
  mkdirSync(bin);
  mkdirSync(join(work, "specs", "001-one"), { recursive: true });
  writeFileSync(join(bin, "claude"), scopedStub(options.proposerExtra ?? ""));
  chmodSync(join(bin, "claude"), 0o755);
  writeFileSync(join(work, "specs", "001-one", "tasks.md"), TASKS);
  // The fixture: the counter beside the workspaces, the graph, and every
  // workspace's package — all committed, so a proposer change is a real
  // change of tracked paths (and a new file under pkgs/a is untracked).
  mkdirSync(join(work, "bin"), { recursive: true });
  writeFileSync(join(work, "bin", "count-and-pass.ts"), COUNTER);
  // The graph at the path the engine reads under the workdir.
  mkdirSync(join(work, "packages", "contracts", "data"), { recursive: true });
  writeFileSync(
    join(work, "packages", "contracts", "data", "package-graph.json"),
    GRAPH,
  );
  for (const name of ["a", "b", "c", "d"]) {
    mkdirSync(join(work, "pkgs", name), { recursive: true });
    writeFileSync(
      join(work, "pkgs", name, "package.json"),
      JSON.stringify({ name: `@fixture/${name}` }),
    );
  }
  // The `test` script the gate would fail: the gate must run the DECLARED
  // commands, and the run stays green only because `npm test` is off the
  // gate path (F153-FR-015).
  writeFileSync(
    join(work, "package.json"),
    JSON.stringify({ scripts: { test: 'node -e "process.exit(1)"' } }),
  );
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
  process.env.HOME = root;
  const control = join(root, ".specstride", "workspaces", workspaceIdOfWorkspace(work));
  mkdirSync(join(control, "features", "001-one", "verification"), { recursive: true });
  const declaredDocument = JSON.stringify({
    schema_version: "specstride.verification-commands/1",
    discovery: "none",
    commands: commandsOf(work),
  });
  writeFileSync(join(control, "features", "001-one", "verification", "verification-commands.json"), declaredDocument);
  // Under the `parity` profile the run reads the AS-IS control plane (the
  // as-is state root of the layout table, `XDG_STATE_HOME`), so the declared
  // document of the launch stands there too: this fixture stands in for the
  // oracle's parity drive, which lays the state out where the as-is engine
  // reads it (F153-FR-061).
  const asIsControl = join(root, ".local", "state", "specstride", "workspaces", "001-one");
  mkdirSync(join(asIsControl, "features", "001-one", "verification"), { recursive: true });
  writeFileSync(join(asIsControl, "features", "001-one", "verification", "verification-commands.json"), declaredDocument);
  if (options.userConfig !== undefined) {
    const userConfig = join(root, ".config", "specstride");
    mkdirSync(userConfig, { recursive: true });
    writeFileSync(join(userConfig, "config.yaml"), options.userConfig);
  }
  const before = {
    HOME: homeBefore,
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
    asIsControl,
    restore: () => {
      if (before.HOME === undefined) delete process.env.HOME;
      else process.env.HOME = before.HOME;
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

type EventRecord = { type: string; data: Record<string, unknown> };

/** Every event of the run's control plane, in write order. */
function eventsOf(control: string): readonly EventRecord[] {
  const runs = join(control, "runs");
  const all: EventRecord[] = [];
  for (const name of existsSync(runs) ? readdirSync(runs).sort() : []) {
    for (const line of readFileSync(join(runs, name, "events.jsonl"), "utf8").split("\n")) {
      if (line.trim() === "") continue;
      all.push(JSON.parse(line) as EventRecord);
    }
  }
  return all;
}

/** The counter file's lines, where it exists; `[]` where it does not. */
function counterLines(work: string, name: string): readonly string[] {
  const path = join(work, "pkgs", name, `counter-${name}.txt`);
  if (!existsSync(path)) return [];
  const text = readFileSync(path, "utf8");
  return text === "" ? [] : text.trim().split("\n");
}

/** The selection records D15 of the phase, in write order. */
function selectionRecords(control: string): readonly Record<string, unknown>[] {
  const dir = join(control, "features", "001-one", "micro");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.startsWith("phase1.selection."))
    .sort()
    .map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")) as Record<string, unknown>);
}

/** The EXTRA the proposer runs to change one file of the workspace. */
const TOUCH = (file: string, content: string): string =>
  `fs.mkdirSync(path.dirname(${JSON.stringify(file)}), { recursive: true });\n` +
  `  fs.writeFileSync(${JSON.stringify(file)}, ${JSON.stringify(content)});`;

test("T281 CT-153-45 an in-pass check runs the dependents only: d never counts in-pass", async () => {
  const g = scopedFixture({ proposerExtra: TOUCH("pkgs/a/src/x.ts", "export {};\n") });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0, `the run ends approved: ${String(exit)}`);
    // The in-pass check ran the closure of `a` (a, b, c — b imports a, c
    // imports b), the gate ran the full set: two lines in a, b and c, and
    // exactly ONE line in d — the gate's, never an in-pass line.
    assert.deepEqual(
      ["a", "b", "c"].map((name) => counterLines(g.work, name).length),
      [2, 2, 2],
      "the in-pass check ran a, b and c, and the gate ran them again",
    );
    assert.equal(counterLines(g.work, "d").length, 1, "only the gate ran d");
    // The decision the table made is recorded with the rule that decided.
    const records = selectionRecords(g.control);
    assert.ok(records.length >= 1, "the selection was recorded");
    assert.equal(records[0]?.["rule"], "WS-7");
    assert.equal(records[0]?.["choice"], "scoped");
    assert.deepEqual(records[0]?.["selectedCommandIds"], ["verify-a", "verify-b", "verify-c"]);
    assert.deepEqual(records[0]?.["changedWorkspaces"], ["@fixture/a"]);
    assert.deepEqual(records[0]?.["dependentWorkspaces"], ["@fixture/b", "@fixture/c"]);
  } finally {
    g.restore();
  }
});

test("T282 CT-153-47 the gate runs the full set: every counter gains a line, every attempt", async () => {
  const g = scopedFixture({ proposerExtra: TOUCH("pkgs/a/src/x.ts", "export {};\n") });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0, `the run ends approved: ${String(exit)}`);
    // The counters say the same thing the events do: the in-pass check ran
    // the closure of `a` (two lines in a, b, c) and the GATE ran all four —
    // d holds exactly one line, and it can only be the gate's.
    assert.deepEqual(
      ["a", "b", "c"].map((name) => counterLines(g.work, name).length),
      [2, 2, 2],
      "the in-pass check ran a, b and c, and the gate ran them again",
    );
    assert.equal(counterLines(g.work, "d").length, 1, "only the gate ran d");
    // The gate's own command pairs carry no unit id — the inner checks' do.
    const gateEnds = eventsOf(g.control)
      .filter((event) => event.type === "check.ended")
      .filter((event) => event.data["unitId"] === null || event.data["unitId"] === undefined)
      .map((event) => event.data["checkId"]);
    for (const id of ["verify-a", "verify-b", "verify-c", "verify-d"]) {
      assert.ok(gateEnds.includes(id), `the gate ran ${id}: ${JSON.stringify(gateEnds)}`);
    }
  } finally {
    g.restore();
  }
});

test("T283 CT-153-46 a change under no workspace widens the in-pass set", async () => {
  const g = scopedFixture({ proposerExtra: TOUCH("README.md", "changed\n") });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0, `the run ends approved: ${String(exit)}`);
    // `README.md` is under no workspace directory: uncertainty WIDENS, and
    // the in-pass check runs all four — two lines everywhere.
    for (const name of ["a", "b", "c", "d"]) {
      assert.equal(counterLines(g.work, name).length, 2, `counter-${name}`);
    }
    const records = selectionRecords(g.control);
    assert.ok(records.length >= 1, "the selection was recorded");
    assert.equal(records[0]?.["rule"], "WS-5");
    assert.equal(records[0]?.["choice"], "full");
  } finally {
    g.restore();
  }
});

test("T290 CT-153-46 a change under specs/ outside the task list widens the in-pass set", async () => {
  const g = scopedFixture({
    proposerExtra:
      TOUCH("specs/001-one/plan.md", "changed\n") +
      "\n" +
      TOUCH("pkgs/a/src/x.ts", "export {};\n"),
  });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0, `the run ends approved: ${String(exit)}`);
    // `specs/001-one/plan.md` is under no workspace directory: the widening
    // rule WS-5 fires even though the path sits under `specs/` — ONLY the
    // task list the loop itself ticks stays out of the changed paths, never
    // the rest of the spec tree.
    for (const name of ["a", "b", "c", "d"]) {
      assert.equal(counterLines(g.work, name).length, 2, `counter-${name}`);
    }
    const records = selectionRecords(g.control);
    assert.ok(records.length >= 1, "the selection was recorded");
    assert.equal(records[0]?.["rule"], "WS-5");
    assert.equal(records[0]?.["choice"], "full");
  } finally {
    g.restore();
  }
});

test("T284 CT-153-46 a graph changed in the pass widens the in-pass set", async () => {
  const g = scopedFixture({
    proposerExtra:
      TOUCH(
        join("packages", "contracts", "data", "package-graph.json"),
        JSON.stringify({
          schema: "specstride.package-graph/1",
          packages: [{ name: "@fixture/a" }],
        }),
      ) +
      "\n" +
      TOUCH("pkgs/a/src/x.ts", "export {};\n"),
  });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0, `the run ends approved: ${String(exit)}`);
    // The graph the pass left no longer hashes to the one the phase entered
    // with: the entry-time data is stale, and the full set runs in-pass.
    for (const name of ["a", "b", "c", "d"]) {
      assert.equal(counterLines(g.work, name).length, 2, `counter-${name}`);
    }
    // The FIRST in-pass check of the run decided on the change: WS-4.
    const records = selectionRecords(g.control);
    assert.ok(records.length >= 1, "the selection was recorded");
    assert.equal(records[0]?.["rule"], "WS-4");
    assert.equal(records[0]?.["choice"], "full");
  } finally {
    g.restore();
  }
});

test("T285 the selection is recorded: every record validates against the schema", async () => {
  const g = scopedFixture({ proposerExtra: TOUCH("pkgs/a/src/x.ts", "export {};\n") });
  try {
    await runFeature({ argv: [], workdir: g.work });
    const records = selectionRecords(g.control);
    assert.ok(records.length >= 1, "the selection was recorded");
    const schema = JSON.parse(
      readFileSync(resolve(HERE, "../../../contracts/schemas/workspace-selection.schema.json"), "utf8"),
    );
    const validate = new Ajv2020({ strict: false }).compile(schema);
    for (const record of records) {
      assert.ok(validate(record), JSON.stringify(validate.errors));
    }
    // The rule id names a row of the shipped table, and the record names the
    // phase attempt it was made at.
    assert.ok(
      ["WS-1", "WS-2", "WS-3", "WS-4", "WS-5", "WS-6", "WS-7"].includes(
        records[0]?.["rule"] as string,
      ),
    );
    assert.equal(records[0]?.["phase"], 1);
    assert.equal(records[0]?.["attempt"], 1);
  } finally {
    g.restore();
  }
});

test("CT-153-5 T286 the switch off runs the whole inner set: all four in-pass", async () => {
  const g = scopedFixture({
    proposerExtra: TOUCH("pkgs/a/src/x.ts", "export {};\n"),
    userConfig: "schema: 1\nverification:\n  inner:\n    scoped: false\n",
  });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0, `the run ends approved: ${String(exit)}`);
    // WS-1: the whole inner set, in-pass and at the gate — two lines
    // everywhere, exactly as before the feature.
    for (const name of ["a", "b", "c", "d"]) {
      assert.equal(counterLines(g.work, name).length, 2, `counter-${name}`);
    }
    const records = selectionRecords(g.control);
    assert.ok(records.length >= 1, "the selection was recorded even off");
    assert.equal(records[0]?.["rule"], "WS-1");
    assert.equal(records[0]?.["choice"], "full");
  } finally {
    g.restore();
  }
});

test("CT-153-5 T286 under parity the whole inner set runs: the reproduction stands", async () => {
  const g = scopedFixture({
    proposerExtra: TOUCH("pkgs/a/src/x.ts", "export {};\n"),
    userConfig: "schema: 1\nprofile: parity\n",
  });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0, `the run ends approved: ${String(exit)}`);
    for (const name of ["a", "b", "c", "d"]) {
      assert.equal(counterLines(g.work, name).length, 2, `counter-${name}`);
    }
    // Parity folds the switch off before the table: the rule is WS-1. The
    // selection records of a parity run live in the as-is control plane.
    const records = selectionRecords(g.asIsControl);
    assert.ok(records.length >= 1, "the selection was recorded");
    assert.equal(records[0]?.["rule"], "WS-1");
  } finally {
    g.restore();
  }
});
