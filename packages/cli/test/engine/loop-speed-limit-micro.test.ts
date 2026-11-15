/**
 * Phase 6 of feature 153 — the enforced time limit on the micro path
 * (slice P1e; F153-FR-029 to -032). With
 * `verification.timeLimit.enforce` on, the inner check of the micro layer
 * runs through the one check runner (`runEngineCheck`): the command runs as
 * the leader of its own process group, is ended — the whole group,
 * SIGTERM then SIGKILL after the runner's grace — at its declared limit,
 * and the result has no exit code (so the layer records `exit: 1`), a
 * `check.ended` of result `fail` with a bounded `durationMs` and no output.
 * Nothing of the check stays behind. With the switch off, the baseline
 * `execute` runs exactly as before the feature. The taint
 * `changed-during-check` is still taken on the runner path.
 *
 * Fixture: `packages/cli/test/fixtures/loop-speed/inner-check-hangs/` — the
 * check manifest of phase 1 with one command, the fake of T004
 * (`hang-with-grandchild.mjs`), `timeoutSec: 1`.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  createMicroAttempt,
  writeCheckManifest,
} from "../../src/engine/micro-layer.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const FIXTURE_MANIFEST = join(
  REPO_ROOT,
  "packages/cli/test/fixtures/loop-speed/inner-check-hangs/manifest.json",
);
const FAKE = join(REPO_ROOT, "packages/cli/test/fixtures/loop-speed/bin/hang-with-grandchild.mjs");

/** Process groups are available (the kill tests skip with their reason otherwise, F153-FR-032). */
const GROUPS_AVAILABLE = process.platform !== "win32" && (() => {
  try {
    process.kill(-1, 0);
    return true;
  } catch (thrown) {
    return (thrown as NodeJS.ErrnoException).code !== "ENOSYS";
  }
})();

type Harness = {
  readonly root: string;
  readonly pidFile: string;
  readonly manifestPath: string;
  readonly statePath: string;
  readonly events: { type: string; fields: Record<string, unknown> }[];
  readonly restore: () => void;
};

/**
 * The fixture of T068, materialised into a temporary directory: the
 * declaration of `manifest.json` (the fake of T004, `timeoutSec: 1`), with
 * `<node>` resolved to `process.execPath` and the fake and the pid file
 * resolved to absolute paths in the temporary directory, re-pinned and
 * re-hashed by `writeCheckManifest` — the call the launch makes.
 */
const fixtureOf = (extraArgv?: readonly string[]): Harness => {
  const root = mkdtempSync(join(tmpdir(), "specstride-limit-micro-"));
  const outbox = join(root, "outbox");
  const control = join(root, "control");
  mkdirSync(outbox);
  mkdirSync(control);
  const declared = JSON.parse(readFileSync(FIXTURE_MANIFEST, "utf8")) as {
    readonly commands: readonly {
      readonly id: string;
      readonly argv: readonly string[];
      readonly timeoutSec: number;
    }[];
  };
  const command = declared.commands[0];
  assert.ok(command, "the fixture holds one command");
  assert.equal(command.timeoutSec, 1, "the fixture declares timeoutSec: 1");
  const pidFile = join(root, "pids.txt");
  const argv = command.argv.map((part) =>
    part === "<node>"
      ? process.execPath
      : part.endsWith(".mjs")
        ? FAKE
        : part === "pids.txt"
          ? pidFile
          : part,
  );
  const manifestPath = join(root, "manifest.json");
  writeCheckManifest({
    manifestPath,
    phase: 1,
    commands: [
      {
        id: command.id,
        argv: extraArgv === undefined ? argv : [...argv, ...extraArgv],
        cwd: root,
        timeoutSec: command.timeoutSec,
      },
    ],
    searchPath: process.env.PATH ?? "",
    write: (path, text) => {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, text);
    },
  });
  const events: { type: string; fields: Record<string, unknown> }[] = [];
  return {
    root,
    pidFile,
    manifestPath,
    statePath: join(root, "micro", "phase1.json"),
    events,
    restore: () => rmSync(root, { recursive: true, force: true }),
  };
};

const machineOf = (
  fx: Harness,
  options: {
    readonly timeLimitEnforced: boolean;
    readonly fingerprint?: () => string;
  },
) =>
  createMicroAttempt({
    runId: "run-limit",
    phase: 1,
    attempt: 1,
    outboxPath: join(fx.root, "outbox"),
    controlPlanePath: join(fx.root, "control"),
    statePath: fx.statePath,
    manifestPath: fx.manifestPath,
    phaseTaskIds: ["T001"],
    caps: { repairs: 2, cyclesExtra: 6, cyclesMin: 12, unresolvedUnits: 2 },
    closingCheckOn: true,
    timeLimitEnforced: options.timeLimitEnforced,
    emit: (type, fields) => fx.events.push({ type, fields: { ...fields } }),
    say: () => {},
    fingerprint: options.fingerprint ?? (() => "tree-0"),
  });

/** Drive one pass to its after-pass: a valid checkpoint, then `afterPass`. */
const runOnePass = async (
  fx: Harness,
  machine: ReturnType<typeof machineOf>,
): Promise<{
  readonly outcome: string;
  readonly elapsedMs: number;
  readonly units: readonly {
    readonly results: readonly { readonly id: string; readonly exit: number; readonly conditions: readonly string[] }[];
  }[];
}> => {
  const started = Date.now();
  machine.beforePass("u1");
  machine.nextUnitId();
  writeFileSync(
    join(fx.root, "outbox", "u1.checkpoint.json"),
    JSON.stringify({ schema: "specstride.checkpoint/1", tasks: ["T001"] }),
  );
  const result = await machine.afterPass({
    unitId: "u1",
    passStartedAtMs: 0,
    passKilled: false,
    yieldInPass: false,
  });
  return {
    outcome: result.outcome,
    elapsedMs: Date.now() - started,
    units: machine.units() as unknown as {
      results: { id: string; exit: number; conditions: string[] }[];
    }[],
  };
};

/** Poll until a pid is gone (the kill is asynchronous at the boundary). */
const pidIsGone = async (pid: number): Promise<boolean> => {
  for (let waited = 0; waited < 3_000; waited += 100) {
    try {
      process.kill(pid, 0);
    } catch {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
};

const pidsOf = (fx: Harness): number[] =>
  readFileSync(fx.pidFile, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => Number(line));

test("CT-153-29 the inner check is ended at its limit", { skip: !GROUPS_AVAILABLE && "process groups are unavailable (F153-FR-032)" }, async () => {
  const fx = fixtureOf();
  try {
    const machine = machineOf(fx, { timeLimitEnforced: true });
    const run = await runOnePass(fx, machine);
    // F153-FR-029 — the limit is 1 s, the grace is the runner's 2 s: the
    // check itself ends within 1 s + grace + 1 s — read off the `durationMs`
    // the runner records for the check, not off the wall clock of the pass,
    // which also holds the harness's own work (the manifest pinning, the
    // before-pass, the ledger writes) and so is not a measure of the check.
    const ended = fx.events.find((event) => event.type === "check.ended");
    assert.ok(ended, "a check.ended event was emitted");
    assert.ok(
      typeof ended.fields.durationMs === "number" && ended.fields.durationMs < 4_000,
      `the check ended in ${String(ended.fields.durationMs)} ms`,
    );
    assert.ok(run.elapsedMs >= Number(ended.fields.durationMs));
    assert.equal(run.units.length, 1);
    assert.equal(run.units[0]?.results[0]?.id, "check-1");
    assert.equal(run.units[0]?.results[0]?.exit, 1);
  } finally {
    fx.restore();
  }
});

test("CT-153-30 nothing of the check stays behind", { skip: !GROUPS_AVAILABLE && "process groups are unavailable (F153-FR-032)" }, async () => {
  const fx = fixtureOf();
  try {
    const machine = machineOf(fx, { timeLimitEnforced: true });
    await runOnePass(fx, machine);
    // The fake wrote its pid and the grandchild's pid; neither is alive.
    const pids = pidsOf(fx);
    assert.equal(pids.length, 2, "the fake recorded two pids");
    for (const pid of pids) {
      assert.ok(await pidIsGone(pid), `pid ${String(pid)} is still alive`);
    }
  } finally {
    fx.restore();
  }
});

test("CT-153-29 the event says failed", { skip: !GROUPS_AVAILABLE && "process groups are unavailable (F153-FR-032)" }, async () => {
  const fx = fixtureOf();
  try {
    const machine = machineOf(fx, { timeLimitEnforced: true });
    await runOnePass(fx, machine);
    const ended = fx.events.find((event) => event.type === "check.ended");
    assert.ok(ended, "a check.ended event was emitted");
    assert.equal(ended.fields.result, "fail");
    assert.ok(
      typeof ended.fields.durationMs === "number" && ended.fields.durationMs < 5_000,
      `durationMs ${String(ended.fields.durationMs)} is bounded`,
    );
    // F153-FR-033 — the event holds no content: no stream, no pid file text.
    const serialised = JSON.stringify(ended.fields);
    assert.ok(!("stdout" in ended.fields));
    assert.ok(!("stderr" in ended.fields));
    assert.ok(!("output" in ended.fields));
    assert.ok(!serialised.includes("pids.txt"));
  } finally {
    fx.restore();
  }
});

test("CT-153-5 switch off is today: the baseline execute runs, not a process group", async () => {
  const fx = fixtureOf();
  try {
    // The marker command answers whether it is the leader of its own process
    // group: `execute` (spawnSync, not detached) runs it as a member; the
    // runner (detached) would run it as a leader.
    const marker = join(fx.root, "group.txt");
    // Rebuild the manifest with the marker command through the same call the
    // launch makes, BEFORE the machine reads it.
    writeCheckManifest({
      manifestPath: fx.manifestPath,
      phase: 1,
      commands: [
        {
          id: "check-1",
          argv: [
            process.execPath,
            "-e",
            `const fs = require("node:fs");
             try { process.kill(-process.pid, 0); fs.writeFileSync(${JSON.stringify(marker)}, "leader"); }
             catch { fs.writeFileSync(${JSON.stringify(marker)}, "member"); }
             process.exit(0);`,
          ],
          cwd: fx.root,
          timeoutSec: 5,
        },
      ],
      searchPath: process.env.PATH ?? "",
      write: (path, text) => writeFileSync(path, text),
    });
    const machine = machineOf(fx, { timeLimitEnforced: false });
    const run = await runOnePass(fx, machine);
    // The result is the same as before this feature: exit 0, a kept unit,
    // a passing check.ended.
    assert.equal(run.outcome, "kept");
    assert.equal(run.units[0]?.results[0]?.exit, 0);
    const ended = fx.events.find((event) => event.type === "check.ended");
    assert.ok(ended);
    assert.equal(ended.fields.result, "pass");
    // The baseline path: the command was NOT a process-group leader.
    assert.equal(readFileSync(marker, "utf8"), "member");
  } finally {
    fx.restore();
  }
});

test("the taint is still taken", { skip: !GROUPS_AVAILABLE && "process groups are unavailable (F153-FR-032)" }, async () => {
  const fx = fixtureOf();
  try {
    // A tracked file the command changes while it runs; the fingerprint is
    // the real hash of its content.
    const tracked = join(fx.root, "tracked.txt");
    writeFileSync(tracked, "v0\n");
    const fingerprint = (): string =>
      createHash("sha256").update(readFileSync(tracked)).digest("hex");
    writeCheckManifest({
      manifestPath: fx.manifestPath,
      phase: 1,
      commands: [
        {
          id: "check-1",
          argv: [
            process.execPath,
            "-e",
            `const fs = require("node:fs");
             setTimeout(() => fs.appendFileSync(${JSON.stringify(tracked)}, "x"), 100);
             setTimeout(() => process.exit(0), 300);`,
          ],
          cwd: fx.root,
          timeoutSec: 5,
        },
      ],
      searchPath: process.env.PATH ?? "",
      write: (path, text) => writeFileSync(path, text),
    });
    const machine = machineOf(fx, { timeLimitEnforced: true, fingerprint });
    const run = await runOnePass(fx, machine);
    assert.equal(run.units[0]?.results[0]?.exit, 0);
    assert.ok(
      run.units[0]?.results[0]?.conditions.includes("changed-during-check"),
      "the condition changed-during-check is still taken",
    );
  } finally {
    fx.restore();
  }
});
