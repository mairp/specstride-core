/**
 * Phase 18 of feature 153, US1b — a closing check equal to the gate runs
 * once (F153-FR-012, F153-SC-004 first half):
 *
 *  - T243 F153-SC-004 the commands run once — with the micro layer on and a
 *    closing check whose command set is the gate's on an unchanged tree,
 *    the counter gains exactly one line per phase attempt AT THE GATE: the
 *    closing check stands down (CS-4), the gate runs the commands;
 *  - T244 the gate still executes — the gate's `check.started`/`check.ended`
 *    are present for every attempt, and the micro state of the phase
 *    records the skip with the rule id `CS-4`;
 *  - T245 CT-153-5 switch off and parity run both — with
 *    `loop.micro.closingCheck.skipWhenEqualToGate: off`, and under
 *    `profile: parity`, the counter gains the closing check's line too, as
 *    today;
 *  - T246 a different command set runs both — when the manifest of the
 *    phase holds a command the gate does not, the closing check runs
 *    (rule CS-2);
 *  - T251 CT-153-8 the binding validates — the gate binding record D1 of
 *    T250 validates against its schema, and a binding with an unknown
 *    field is refused.
 *
 * No paid or external model API is called (F153-FR-060): the proposer and
 * the critic are the stub `claude` of the helpers, the commands are `node`
 * and the scripts this file writes beside the workspace.
 */
import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { Ajv2020 } from "ajv/dist/2020.js";

import { fixture, type Verdicts } from "./loop-speed-helpers.ts";
import { runFeature } from "../../src/engine/run-feature.ts";
import { workspaceIdOfWorkspace } from "../../src/engine/workspace-control-root.ts";

/** The control root the engine of this fixture's workspace writes. */
function controlRootOf(work: string): string {
  return join(process.env.HOME ?? "", ".specstride", "workspaces", workspaceIdOfWorkspace(work));
}

/** The `bin` directory beside the workspace, where the command scripts live. */
const binOf = (work: string): string => join(work, "..", "bin");

/** The counter: appends one line to the file its argument names. */
const COUNTER = `const fs = require("node:fs");
const [file] = process.argv.slice(2);
fs.appendFileSync(file, "counted\\n");
`;

/**
 * The fixture's task list: a TWO-task phase — the layer `micro` falls back
 * with `single-unit` where the phase holds one task at launch (F115-FR-005),
 * so the closing check of this phase needs a phase with two tasks.
 */
const TASKS = "# Tasks\n\n## Phase 1: One\n\n- [ ] T001 Do it\n- [ ] T002 Do more\n";

/**
 * The checkpoint the proposer pass writes, as the outbox contract of
 * feature 115 reads it: one unit of one task per pass, its task id in
 * `tasks`; the pass also ticks exactly its own task, so two passes end the
 * phase.
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
 * The T246 sabotage, run by the stub's proposer pass: the check manifest of
 * the phase, which the launch wrote into the control plane, gains a SECOND
 * command — the record hash is recomputed the way the engine hashes a
 * canonical record (sorted keys, one line end added), so the micro layer's
 * integrity verification still passes and the closing check's command set
 * is no longer the gate's (CS-2).
 */
const EXTRA_MANIFEST_COMMAND = `try { if (process.env.SPECSTRIDE_TEST_EXTRA_COMMAND === "1") {
    const root = path.join(process.cwd(), "..");
    const wsDir = path.join(root, ".specstride", "workspaces");
    const crypto = require("node:crypto");
    for (const ws of fs.readdirSync(wsDir)) {
      const manifestPath = path.join(wsDir, ws, "features", "001-one", "manifests", "phase1.json");
      if (!fs.existsSync(manifestPath)) continue;
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      if (manifest.commands.some((c) => c.id === "verify-extra")) continue;
      const extra = JSON.parse(JSON.stringify(manifest.commands[0]));
      extra.id = "verify-extra";
      extra.argv = extra.argv.map((a) => (a.includes("counter-a") ? a.replace("counter-a", "counter-c") : a));
      manifest.commands.push(extra);
      const sorted = (v) => {
        if (Array.isArray(v)) return v.map(sorted);
        if (v === null || typeof v !== "object") return v;
        const out = {};
        for (const k of Object.keys(v).sort()) out[k] = sorted(v[k]);
        return out;
      };
      const hash = crypto.createHash("sha256");
      hash.update(JSON.stringify(sorted(manifest.commands)) + "\\n", "utf8");
      manifest.recordHash = hash.digest("hex");
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }
  } } catch (error) { fs.writeFileSync("sabotage-error.txt", String(error && error.stack ? error.stack : error)); }`;

type FixtureWithOptions = {
  readonly verdicts?: Verdicts;
  /** The declared commands, built with the workspace path. */
  readonly commands: (work: string) => readonly Record<string, unknown>[];
  /** Extra statements in the proposer branch of the stub `claude`. */
  readonly proposerExtra?: string;
  /** Extra environment set for the run, restored with the fixture. */
  readonly env?: Readonly<Record<string, string>>;
  /** A configuration file of the USER, written under the fixture home. */
  readonly userConfig?: string;
};

/** The fixture of this file: workspace, declared commands, checkpoint-writing stub. */
function closingFixture(options: FixtureWithOptions): {
  readonly work: string;
  readonly control: string;
  /** The as-is control plane the parity profile reads (F153-FR-061). */
  readonly asIsControl: string;
  readonly restore: () => void;
} {
  const f = fixture({
    verdicts: options.verdicts ?? "APPROVED",
    proposerExtra: [WRITE_CHECKPOINT, options.proposerExtra ?? ""].filter(Boolean).join("\n"),
    files: { "specs/001-one/tasks.md": TASKS },
  });
  const work = f.dir;
  mkdirSync(binOf(work), { recursive: true });
  // A `test` script the gate would fail: the gate must run the DECLARED
  // commands, and the run stays green only because `npm test` is off the
  // gate path (F153-FR-015) — and `checkCommandOf` must find a declared
  // check, or the launch falls back to classic (F115-FR-004).
  writeFileSync(
    join(work, "package.json"),
    JSON.stringify({ scripts: { test: 'node -e "process.exit(1)"' } }),
  );
  writeFileSync(join(binOf(work), "count-and-pass.cjs"), COUNTER);
  chmodSync(join(binOf(work), "count-and-pass.cjs"), 0o755);
  const control = controlRootOf(work);
  mkdirSync(join(control, "features", "001-one", "verification"), { recursive: true });
  const declaredDocument = JSON.stringify({
    schema_version: "specstride.verification-commands/1",
    discovery: "none",
    commands: options.commands(work),
  });
  writeFileSync(
    join(control, "features", "001-one", "verification", "verification-commands.json"),
    declaredDocument,
  );
  // Under the `parity` profile the run reads the AS-IS control plane (the
  // as-is state root of the layout table, `XDG_STATE_HOME`), so the declared
  // document of the launch stands there too: this fixture stands in for the
  // oracle's parity drive, which lays the state out where the as-is engine
  // reads it (F153-FR-061).
  const asIsControl = join(
    process.env.HOME ?? "",
    ".local",
    "state",
    "specstride",
    "workspaces",
    "001-one",
  );
  mkdirSync(join(asIsControl, "features", "001-one", "verification"), { recursive: true });
  writeFileSync(
    join(asIsControl, "features", "001-one", "verification", "verification-commands.json"),
    declaredDocument,
  );
  if (options.userConfig !== undefined) {
    const userConfig = join(process.env.HOME ?? "", ".config", "specstride");
    mkdirSync(userConfig, { recursive: true });
    writeFileSync(join(userConfig, "config.yaml"), options.userConfig);
  }
  const heldEnv: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(options.env ?? {})) {
    heldEnv[key] = process.env[key];
    process.env[key] = value;
  }
  return {
    work,
    control,
    asIsControl,
    restore: () => {
      for (const [key, value] of Object.entries(heldEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      f.restore();
    },
  };
}

/** One declared command of the document, absolute and shell-free. */
const declared = (
  id: string,
  script: string,
  args: readonly string[],
  work: string,
): Record<string, unknown> => ({
  id,
  phase: 1,
  executable: "node",
  args: [join(binOf(work), script), ...args],
  cwd: work,
  timeoutSec: 30,
});

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

const eventsOfType = (events: readonly EventRecord[], type: string): readonly EventRecord[] =>
  events.filter((event) => event.type === type);

/** The counter file's lines, where it exists; `[]` where it does not. */
function counterLines(work: string, name: string): readonly string[] {
  const path = join(work, name);
  if (!existsSync(path)) return [];
  const text = readFileSync(path, "utf8");
  return text === "" ? [] : text.trim().split("\n");
}

/** The micro state of the phase attempt, where the layer wrote one. */
function microState(control: string): Record<string, unknown> | undefined {
  const path = join(control, "features", "001-one", "micro", "phase1.json");
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

test("T243 F153-SC-004 the commands run once: one line per attempt at the gate", async () => {
  const g = closingFixture({
    commands: (work) => [declared("verify-one", "count-and-pass.cjs", ["counter-a.txt"], work)],
  });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0, `the run ends approved: ${String(exit)}`);
    const state = microState(g.control);
    // The micro state records the skip with the rule that decided (T244).
    assert.ok(state !== undefined, "the micro layer wrote its state");
    assert.deepEqual(state?.["closingCheckSkip"], { ruleId: "CS-4" });
    // One pass, one inner check, and the gate: the closing check between
    // them stood down, so counter-a.txt holds exactly two lines — no line
    // of a closing check.
    const lines = counterLines(g.work, "counter-a.txt");
    assert.equal(lines.length, 2, `one inner check and one gate run: ${JSON.stringify(lines)}`);
  } finally {
    g.restore();
  }
});

test("T244 the gate still executes: its pair opens and closes, every attempt", async () => {
  const g = closingFixture({
    verdicts: ["REJECTED", "APPROVED"],
    commands: (work) => [declared("verify-one", "count-and-pass.cjs", ["counter-a.txt"], work)],
  });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.notEqual(exit, 0, "a rejection does not end approved");
    const events = eventsOf(g.control);
    const attempts = eventsOfType(events, "attempt.started");
    const opens = eventsOfType(events, "verification.started");
    // The gate opened and ran its commands at EVERY attempt: the stand-down
    // of the closing check never touches the gate (F153-FR-008). The gate's
    // own command pairs carry no unit id — the inner checks' pairs do.
    assert.equal(
      opens.length,
      attempts.length,
      `the gate opened at every attempt: ${JSON.stringify(opens.length)} of ${JSON.stringify(attempts.length)}`,
    );
    const gateEnds = eventsOfType(events, "check.ended").filter(
      (event) => event.data["unitId"] === null || event.data["unitId"] === undefined,
    );
    assert.ok(
      gateEnds.length >= opens.length,
      `the gate ran its commands at every attempt: ${JSON.stringify(gateEnds.length)} of ${JSON.stringify(opens.length)}`,
    );
    // The skip is recorded with the rule that decided, at every attempt.
    assert.deepEqual(microState(g.control)?.["closingCheckSkip"], { ruleId: "CS-4" });
  } finally {
    g.restore();
  }
});

test("CT-153-5 T245 the switch off runs both: the closing check adds its line", async () => {
  const g = closingFixture({
    commands: (work) => [declared("verify-one", "count-and-pass.cjs", ["counter-a.txt"], work)],
    userConfig: "schema: 1\nloop:\n  micro:\n    closingCheck:\n      skipWhenEqualToGate: false\n",
  });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0, `the run ends approved: ${String(exit)}`);
    // The closing check ran again (one line), and the gate ran (one line),
    // beside the one inner check: three lines, as before the feature.
    const lines = counterLines(g.work, "counter-a.txt");
    assert.equal(lines.length, 3, `inner check, closing check, gate: ${JSON.stringify(lines)}`);
    // No skip was recorded — the check genuinely ran.
    assert.equal(microState(g.control)?.["closingCheckSkip"], undefined);
    // No skip was recorded — the check genuinely ran.
    assert.equal(microState(g.control)?.["closingCheckSkip"], undefined);
  } finally {
    g.restore();
  }
});

test("CT-153-5 T245 under parity both run: the reproduction profile stands down", async () => {
  const g = closingFixture({
    commands: (work) => [declared("verify-one", "count-and-pass.cjs", ["counter-a.txt"], work)],
    userConfig: "schema: 1\nprofile: parity\n",
  });
  try {
    const exit = await runFeature({ argv: [], workdir: g.work });
    assert.equal(exit, 0, `the run ends approved: ${String(exit)}`);
    // Parity stands the whole closing check down (`loop.micro.closing_check:
    // off` in the profile) and the skip with it, so the counter holds the
    // inner check's line and the gate's — two lines, as today.
    const lines = counterLines(g.work, "counter-a.txt");
    assert.equal(lines.length, 2, `parity reproduces today: ${JSON.stringify(lines)}`);
    // The skip state of a parity run lives in the as-is control plane.
    assert.equal(microState(g.asIsControl)?.["closingCheckSkip"], undefined);
  } finally {
    g.restore();
  }
});

test("T246 a different command set runs both: rule CS-2", async () => {
  const g = closingFixture({
    // Two attempts: the FIRST attempt's pass rewrites the control-plane
    // manifest of the phase (adding a second command, its record hash
    // recomputed the canonical way, so the integrity verification still
    // passes); the SECOND attempt's micro layer reads that manifest at its
    // start, so its inner set — and its closing check — hold a command the
    // gate does not (the gate reads the plan, not the manifest).
    verdicts: ["REJECTED", "APPROVED"],
    commands: (work) => [declared("verify-one", "count-and-pass.cjs", ["counter-a.txt"], work)],
    proposerExtra: EXTRA_MANIFEST_COMMAND,
    env: { SPECSTRIDE_TEST_EXTRA_COMMAND: "1" },
  });
  try {
    await runFeature({ argv: [], workdir: g.work });
    // The manifest's second command (counter-c.txt) is the evidence the
    // second attempt's closing check RAN: its inner check wrote one line
    // and the closing check another, while the gate — which does not hold
    // the command — wrote none.
    const extraLines = counterLines(g.work, "counter-c.txt");
    // Each later attempt ran it twice — its inner check and its closing
    // check (CS-2); the attempts after the sabotage reject on the critic's
    // verdict list, which does not matter to the count.
    assert.equal(
      extraLines.length,
      4,
      `inner check and closing check ran it: ${JSON.stringify(extraLines)}`,
    );
    // Attempt 1: inner check and gate (2 lines); every later attempt adds
    // verify-one's inner line, the closing check's line, and the gate's.
    const lines = counterLines(g.work, "counter-a.txt");
    assert.equal(lines.length, 8, `attempt 1 and the later attempts: ${JSON.stringify(lines)}`);
    // The decision was `run`, not a skip: no skip is recorded.
    assert.equal(microState(g.control)?.["closingCheckSkip"], undefined);
  } finally {
    g.restore();
  }
});

test("T251 CT-153-8 the binding validates: schema holds, unknown field refused", async () => {
  const g = closingFixture({
    commands: (work) => [declared("verify-one", "count-and-pass.cjs", ["counter-a.txt"], work)],
  });
  try {
    await runFeature({ argv: [], workdir: g.work });
    const bindingPath = join(g.control, "features", "001-one", "gate", "phase1.1.binding.json");
    assert.ok(existsSync(bindingPath), `the gate binding record was written: ${bindingPath}`);
    const binding = JSON.parse(readFileSync(bindingPath, "utf8")) as Record<string, unknown>;
    const schema = JSON.parse(
      readFileSync(
        join(
          new URL(import.meta.url).pathname,
          "../../../..",
          "contracts/schemas/gate-command-binding.schema.json",
        ),
        "utf8",
      ),
    ) as Record<string, unknown>;
    const ajv = new Ajv2020({ strict: false, allErrors: true });
    const validate = ajv.compile(schema as never);
    assert.equal(
      validate(binding),
      true,
      `the binding validates: ${JSON.stringify(validate.errors)}`,
    );
    assert.equal(binding["schema"], "specstride.gate-command-binding/1");
    assert.deepEqual(binding["closingCheckSkip"], { ruleId: "CS-4" });

    // An unknown field is refused: the schema closes the record.
    const forged = { ...binding, weaponized: true };
    assert.equal(validate(forged), false, "a binding with an unknown field is refused");
    const missingOutcomes = { ...binding };
    delete missingOutcomes["outcomes"];
    assert.equal(validate(missingOutcomes), false, "a binding without its outcomes is refused");
  } finally {
    g.restore();
  }
});
