/**
 * CT-141-119 — the capture of the surfaces (T031, T048, T049, T050;
 * F141-FR-019).
 *
 * What the test proves. Every assertion runs against a real working directory, a
 * real hermetic home, a real temporary directory, a real git repository and real
 * files of state in a scratch tree; nothing is mocked.
 *
 * - **every surface S-01 to S-13**: each of the thirteen is captured, each carries
 *   its id, and the nine of the run set are the ones every scenario compares;
 * - **S-14 to S-16 on the port**: the three surfaces of the port alone are
 *   captured on the port side and REFUSED on the reference side; a scenario that
 *   names one on the reference simply does not get it;
 * - **standard output and standard error apart**: the two streams are captured as
 *   separate surfaces, as bytes, and bytes on one stream never reach the other;
 * - **state by logical name**: the surface `state` is a list keyed by the LOGICAL
 *   name of each file, in the order of the names, and holds no physical path;
 * - **taken after the run ended**: every module refuses a context whose run has
 *   not ended, so a capture can never be read from a live run.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ALL_SURFACES,
  CaptureError,
  PORT_ONLY_SURFACES,
  RUN_SET,
  assertTheRunHasEnded,
  captureSurfaces,
  surfaceId,
  type CaptureContext,
} from "../../src/capture/index.ts";
import { captureExit, mappedResumeExitCode, RESUME_CAUSES } from "../../src/capture/exit.ts";
import { captureStdout, joinStream } from "../../src/capture/stdout.ts";
import { captureStderr } from "../../src/capture/stderr.ts";
import { captureState, captureStateFile } from "../../src/capture/state.ts";
import { captureHome } from "../../src/capture/home.ts";
import { walkTree } from "../../src/capture/tree.ts";
import { captureProcesses } from "../../src/capture/processes.ts";
import { captureRepository } from "../../src/capture/repository.ts";
import { capturePipeline, PIPELINE_LOGS, PIPELINE_RECORDS } from "../../src/capture/pipeline.ts";
import { captureTelemetry } from "../../src/capture/telemetry.ts";
import { captureLauncher } from "../../src/capture/launcher.ts";
import {
  COUNTER_NAMES,
  captureControlRecords,
  captureCounters,
  captureEventsPrimary,
} from "../../src/capture/port-only.ts";
import { writeTranscriptRecord } from "../../stubs/lib/transcript.ts";
import { surfaces as surfacesData } from "../../src/catalogue/data.ts";
import { componentFiles } from "../../src/normalize/text.ts";

/**
 * The as-is file of the pipeline runtime of the mixture-of-loops baseline, read from
 * the component-name table of feature 100 rather than written out here: F100-FR-026
 * reserves that name to `packages/contracts/data/layout-old-side.json`.
 */
const AS_IS_PIPELINE_RUNTIME = (
  componentFiles().find((row) => row.asIs === "The pipeline runtime of mixture-of-loops")?.files ??
  []
).find((file) => !file.includes("/")) as string;

/** A run that has ended, with everything the capture modules read on disk. */
function aFinishedRun(side: "reference" | "port" = "reference"): {
  readonly context: CaptureContext;
  readonly runRoot: string;
} {
  const runRoot = mkdtempSync(join(tmpdir(), "oracle-capture-"));
  const workdir = join(runRoot, "work");
  const home = join(runRoot, "home");
  const temporaryDirectory = join(runRoot, "tmp");
  for (const dir of [workdir, home, temporaryDirectory]) mkdirSync(dir, { recursive: true });
  writeFileSync(join(workdir, "one.txt"), "one\n", "utf8");
  writeFileSync(join(home, ".dsh-settings.json"), '{"mode":"headless"}\n', "utf8");
  writeFileSync(join(temporaryDirectory, "scratch"), "x\n", "utf8");

  // Two files of state, laid out by their logical names.
  const stateDir = join(runRoot, "state");
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(join(stateDir, "a"), "the progress notes\n", "utf8");
  const statePaths = {
    "<workspace-part>/features/<slug>/PROGRESS.md": join(stateDir, "a"),
    "<control>/runs/<run-id>/state.json": join(stateDir, "never-written"),
  };

  // An event file and a transcript.
  const eventFile = join(workdir, "events.jsonl");
  writeFileSync(eventFile, `${JSON.stringify({ event: "run_start", phase: 1 })}\n`, "utf8");
  const transcriptFile = join(runRoot, "transcript", "transcript.jsonl");
  writeTranscriptRecord(transcriptFile, {
    role: "proposer",
    harness: "dsh",
    call: 1,
    argv: ["the prompt"],
    envNames: ["HOME"],
    prompt: "the prompt",
    promptChannel: "argument",
  });

  return {
    runRoot,
    context: {
      scenario: "FX-01/three-phases",
      side,
      suite: "first",
      commands: [
        {
          argv: ["specstride", "run"],
          exitCode: 0,
          stdout: new Uint8Array([111, 110, 101, 10]),
          stderr: new Uint8Array(),
        },
      ],
      workdir,
      home,
      temporaryDirectory,
      statePaths,
      eventFiles: [eventFile],
      transcriptFile,
      processesLeftBehind: [],
      launcherRoot: workdir,
      repositoryRoot: workdir,
      runHasEnded: true,
    },
  };
}

test("CT-141-119: the sixteen surfaces of §O.4, with the three of the port alone apart", () => {
  assert.deepEqual(
    [...ALL_SURFACES],
    surfacesData().surfaces.map((s) => s.name),
  );
  assert.equal(ALL_SURFACES.length, 16);
  assert.deepEqual([...PORT_ONLY_SURFACES], ["events-primary", "control-records", "counters"]);
  assert.deepEqual(
    [...RUN_SET],
    ["exit", "stdout", "stderr", "tree", "state", "events", "transcript", "processes", "home"],
  );
  for (const [index, surface] of surfacesData().surfaces.entries()) {
    assert.equal(surfaceId(surface.name), `S-${String(index + 1).padStart(2, "0")}`);
  }
});

test("CT-141-119: every surface S-01 to S-13 is captured, each with its id", () => {
  const { context } = aFinishedRun();
  const thirteen = ALL_SURFACES.filter((s) => !PORT_ONLY_SURFACES.includes(s));
  assert.equal(thirteen.length, 13);
  const capture = captureSurfaces(context, thirteen);
  assert.deepEqual(Object.keys(capture.surfaces).sort(), [...thirteen].sort());
  assert.deepEqual(capture.missing, {});
  // Each module says which surface of §O.4 it is.
  assert.equal(captureExit(context).id, "S-01");
  assert.equal(captureStdout(context).id, "S-02");
  assert.equal(captureStderr(context).id, "S-03");
  assert.equal(captureState(context).id, "S-05");
  assert.equal(captureProcesses(context).id, "S-08");
  assert.equal(capturePipeline(context).id, "S-09");
  assert.equal(captureTelemetry(context).id, "S-10");
  assert.equal(captureRepository(context).id, "S-11");
  assert.equal(captureLauncher(context).id, "S-12");
  assert.equal(captureHome(context).id, "S-13");
});

test("CT-141-119: a surface that is no surface of §O.4 is MISSING and never empty", () => {
  const { context } = aFinishedRun();
  const capture = captureSurfaces(context, ["exit", "not-a-surface"]);
  assert.equal("not-a-surface" in capture.surfaces, false);
  assert.match(capture.missing["not-a-surface"] ?? "", /is no surface of §O.4/);
});

test("CT-141-119: standard output and standard error are captured apart, as bytes", () => {
  const { context } = aFinishedRun();
  const twoCommands: CaptureContext = {
    ...context,
    commands: [
      {
        argv: ["a"],
        exitCode: 0,
        stdout: new Uint8Array([104, 105, 10]),
        stderr: new Uint8Array(),
      },
      {
        argv: ["b"],
        exitCode: 3,
        stdout: new Uint8Array(),
        stderr: new Uint8Array([98, 97, 100, 10]),
      },
    ],
  };
  const out = captureStdout(twoCommands).value;
  const err = captureStderr(twoCommands).value;
  assert.equal(out.text, "hi\n");
  assert.equal(err.text, "bad\n");
  // Nothing of one stream reaches the other.
  assert.ok(!out.text.includes("bad"));
  assert.ok(!err.text.includes("hi"));
  assert.equal(out.bytes.length, 3);
  assert.equal(err.bytes.length, 4);
  // And per command, so a step's own output is not lost in the join.
  assert.deepEqual([...out.perCommand], ["hi\n", ""]);
  assert.deepEqual([...err.perCommand], ["", "bad\n"]);
  // The streams of the steps are joined in order.
  assert.deepEqual([...joinStream([new Uint8Array([1, 2]), new Uint8Array([3])])], [1, 2, 3]);
});

test("CT-141-119: the surface `state` is keyed by the logical name and holds no path", () => {
  const { context } = aFinishedRun();
  const state = captureState(context).value as {
    entries: { logicalName: string; exists: boolean; content?: string }[];
  };
  // In the order of the names, by logical name.
  assert.deepEqual(
    state.entries.map((e) => e.logicalName),
    ["<control>/runs/<run-id>/state.json", "<workspace-part>/features/<slug>/PROGRESS.md"],
  );
  assert.equal(state.entries[0]?.exists, false);
  assert.equal(state.entries[1]?.exists, true);
  assert.equal(state.entries[1]?.content, "the progress notes\n");
  // No physical path of either side is in the capture.
  const text = JSON.stringify(state);
  assert.ok(!text.includes(context.workdir));
  for (const path of Object.values(context.statePaths)) assert.ok(!text.includes(path));
  // A file that is not there gives `exists: false` and no content: an absent file
  // and an empty file are not the same capture.
  assert.deepEqual(captureStateFile("<x>", join(context.workdir, "nothing")), {
    logicalName: "<x>",
    exists: false,
  });
});

test("CT-141-119: the surface `exit` carries the code of every step and of the run", () => {
  const { context } = aFinishedRun();
  const twoSteps: CaptureContext = {
    ...context,
    commands: [
      { argv: ["a"], exitCode: 0, stdout: new Uint8Array(), stderr: new Uint8Array() },
      { argv: ["b"], exitCode: 4, stdout: new Uint8Array(), stderr: new Uint8Array() },
    ],
  };
  const exit = captureExit(twoSteps).value;
  assert.equal(exit.exitCode, 4);
  assert.deepEqual([...exit.perCommand], [0, 4]);
  // The exit-code map of `resume` is applied on the REFERENCE side, with the cause
  // the scenario declares, and never on the port side.
  assert.ok(RESUME_CAUSES.length > 0);
  const cause = RESUME_CAUSES[0] as string;
  const mapped = captureExit(
    {
      ...twoSteps,
      commands: [
        twoSteps.commands[0] as never,
        { argv: ["b"], exitCode: 1, stdout: new Uint8Array(), stderr: new Uint8Array() },
      ],
    },
    cause,
  ).value;
  assert.equal(mapped.exitCode, mappedResumeExitCode(1, cause));
  assert.equal(mapped.mappedBy?.table, "resumeExitCodeMap");
  const onThePort = captureExit(
    {
      ...twoSteps,
      side: "port",
      commands: [{ argv: ["b"], exitCode: 1, stdout: new Uint8Array(), stderr: new Uint8Array() }],
    },
    cause,
  ).value;
  assert.equal(onThePort.exitCode, 1);
  assert.equal(onThePort.mappedBy, undefined);
});

test("CT-141-119: a tree entry whose content is captured carries no byte count", () => {
  const { context } = aFinishedRun();
  const tree = (
    captureSurfaces(context, ["tree"]).surfaces["tree"] as {
      entries: { path: string; content?: string; size?: number }[];
    }
  ).entries;
  const withContent = tree.filter((e) => e.content !== undefined);
  assert.ok(withContent.length > 0);
  for (const entry of withContent) {
    // The CONTENT is the comparison. The byte count is of the bytes BEFORE the rules
    // of feature 100 replace the run ids, the times and the paths the content holds,
    // so it is the length of the values that were replaced and would make two runs
    // of ONE side differ (F141-SC-005).
    assert.equal(entry.size, undefined, `${entry.path} carries a byte count beside its content`);
  }
  // A directory carries none either; a file whose content is NOT captured keeps it,
  // because then the size is all there is.
  const withoutContent = walkTree(context.workdir, { withContent: false }).filter(
    (e) => e.type === "file",
  );
  assert.ok(withoutContent.length > 0);
  for (const entry of withoutContent) assert.equal(typeof entry.size, "number");
});

test("CT-141-119: the surface `home` is the hermetic home and the temporary directory", () => {
  const { context } = aFinishedRun();
  const home = captureHome(context).value;
  assert.deepEqual(
    home.home.map((e) => e.path),
    [".dsh-settings.json"],
  );
  assert.deepEqual(
    home.temporaryDirectory.map((e) => e.path),
    ["scratch"],
  );
});

test("CT-141-119: the surface `repository` of a working directory with no repository", () => {
  const { context } = aFinishedRun();
  const none = captureRepository(context).value as Record<string, unknown>;
  assert.equal(none["noRepository"], true);
  assert.equal(none["nothingWasPushed"], true);

  // And of a real repository with one commit.
  const root = mkdtempSync(join(tmpdir(), "oracle-repo-"));
  const run = (...argv: string[]): void => {
    const result = spawnSync(argv[0] as string, argv.slice(1), { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, `${argv.join(" ")}: ${result.stderr}`);
  };
  run("git", "init", "-q", "-b", "main");
  run("git", "config", "user.email", "oracle@example.invalid");
  run("git", "config", "user.name", "oracle");
  writeFileSync(join(root, "one.txt"), "one\n", "utf8");
  run("git", "add", "one.txt");
  run("git", "commit", "-q", "-m", "the first commit");
  const captured = captureRepository({ ...context, repositoryRoot: root }).value as {
    commits: { message: string; tree: string[] }[];
    remotes: string[];
    nothingWasPushed: boolean;
  };
  assert.equal(captured.commits.length, 1);
  assert.match(captured.commits[0]?.message ?? "", /the first commit/);
  assert.deepEqual([...(captured.commits[0]?.tree ?? [])], ["one.txt"]);
  assert.deepEqual([...captured.remotes], []);
  assert.equal(captured.nothingWasPushed, true);
});

test("CT-141-119: the surfaces `pipeline`, `telemetry` and `launcher`", () => {
  const { context } = aFinishedRun();
  const pipelineRoot = join(context.workdir, "pipeline");
  mkdirSync(pipelineRoot, { recursive: true });
  writeFileSync(join(pipelineRoot, "state.json"), '{"stages":{}}\n', "utf8");
  writeFileSync(join(pipelineRoot, "run.log"), "[PLAN] implement-feature\n", "utf8");
  const pipeline = capturePipeline(context, { root: pipelineRoot }).value;
  assert.deepEqual(
    pipeline.records.map((r) => [r.name, r.exists]),
    [
      ["state.json", true],
      ["supervisor.json", false],
    ],
  );
  assert.deepEqual(
    pipeline.logs.map((l) => l.name),
    [...PIPELINE_LOGS],
  );
  assert.deepEqual(PIPELINE_RECORDS, ["state.json", "supervisor.json"]);

  // A scenario with no sink says so, and never gives an empty payload list that
  // could compare equal to a real one.
  assert.equal((captureTelemetry(context).value as Record<string, unknown>)["noSink"], true);
  const store = join(context.workdir, "telemetry.jsonl");
  writeFileSync(store, `${JSON.stringify({ path: "/v1/traces", body: '{"a":1}' })}\n`, "utf8");
  const telemetry = captureTelemetry({ ...context, telemetryStore: store }).value;
  assert.equal(telemetry.count, 1);
  assert.deepEqual(telemetry.payloads[0]?.body, { a: 1 });

  // A launcher that is not there, and one that is.
  const absent = captureLauncher(context).value;
  assert.equal(absent.launcher.exists, false);
  writeFileSync(
    join(context.workdir, "launch.sh"),
    [
      "#!/bin/sh",
      "# mixture-of-loops launcher",
      `exec python3 ${AS_IS_PIPELINE_RUNTIME} --contract launch-contract.json --launch-dir . --no-color "$@"`,
      "",
    ].join("\n"),
    "utf8",
  );
  const present = captureLauncher(context).value;
  assert.equal(present.launcher.exists, true);
  assert.equal(present.launcher.markerPresent, true);
  // The arguments the launcher passes through, sorted and without duplicates.
  assert.deepEqual(
    [...present.launcher.argumentsPassedThrough],
    ["--contract", "--launch-dir", "--no-color"],
  );
});

test("CT-141-119: S-14 to S-16 are captured on the port and refused on the reference", () => {
  const port = aFinishedRun("port");
  const primary = join(port.context.workdir, "primary.jsonl");
  writeFileSync(primary, `${JSON.stringify({ event: "run.started", phase: 1 })}\n`, "utf8");
  assert.equal(captureEventsPrimary(port.context, primary).id, "S-14");
  assert.equal(captureControlRecords(port.context, {}).id, "S-15");
  const counters = join(port.context.workdir, "counters.json");
  writeFileSync(
    counters,
    JSON.stringify({
      phases: { "2": { passesUsed: 2 }, "1": { passesUsed: 1, rejectCount: 1 } },
      exitCodes: [3, 0],
      stopReasons: ["approved"],
      runStates: ["done"],
    }),
    "utf8",
  );
  const captured = captureCounters(port.context, counters).value;
  // One row per phase, in the order of the phases, with every counter of
  // F141-FR-041 present — a counter the record leaves out is 0 and not absent.
  assert.deepEqual(
    captured.perPhase.map((p) => p.phase),
    [1, 2],
  );
  assert.deepEqual(
    Object.keys(captured.perPhase[0] ?? {}).sort(),
    ["phase", ...COUNTER_NAMES].sort(),
  );
  assert.equal(captured.perPhase[0]?.rejectCount, 1);
  assert.equal(captured.perPhase[1]?.rejectCount, 0);
  assert.deepEqual([...captured.exitCodes], [0, 3]);
  // A record that is not there gives NO phase, so the assertion of F141-FR-041
  // cannot pass on an absent capture.
  assert.deepEqual(
    [...captureCounters(port.context, join(port.context.workdir, "never")).value.perPhase],
    [],
  );

  const reference = aFinishedRun("reference");
  for (const call of [
    () => captureEventsPrimary(reference.context, primary),
    () => captureControlRecords(reference.context, {}),
    () => captureCounters(reference.context, counters),
  ]) {
    assert.throws(
      call,
      (error: unknown) =>
        error instanceof CaptureError &&
        /exists on the port only \(§O\.4, S-14 to S-16\)/.test(error.message),
    );
  }
  // And a scenario that names one on the reference side simply does not get it.
  const capture = captureSurfaces(reference.context, ["exit", "counters"]);
  assert.deepEqual(Object.keys(capture.surfaces), ["exit"]);
  assert.deepEqual(capture.missing, {});
});

test("CT-141-119: a capture is taken after the run ended, and never before", () => {
  const { context } = aFinishedRun();
  const live: CaptureContext = { ...context, runHasEnded: false };
  assert.throws(
    () => assertTheRunHasEnded(live, "exit"),
    (error: unknown) =>
      error instanceof CaptureError &&
      /after the processes it left\s+behind were listed \(F141-FR-019\)/.test(error.message),
  );
  // Every module of the run set refuses it, so no single surface can slip through.
  for (const surface of RUN_SET) {
    const capture = captureSurfaces(live, [surface]);
    assert.deepEqual(Object.keys(capture.surfaces), [], `${surface} was captured from a live run`);
    assert.match(capture.missing[surface] ?? "", /before the run ended/);
  }
});

test("CT-141-119: the surface `processes` holds only what the RUN left behind, alive", () => {
  // The list the driver hands this surface is read off the machine, so the three
  // kinds of process that are in the run's process group WITHOUT being something
  // the run left behind can only be judged in a real group. The probe below runs
  // as its OWN process-group leader (`detached`), which is the one way the `ps`
  // the oracle spawns to make the list is inside the group it asks about.
  const probeDir = mkdtempSync(join(tmpdir(), "oracle-left-behind-"));
  const probe = join(probeDir, "probe.ts");
  const driver = join(import.meta.dirname, "..", "..", "src", "run", "driver.ts");
  writeFileSync(
    probe,
    [
      `import { spawn, spawnSync } from "node:child_process";`,
      `import { listProcessesLeftBehind, pidsOfTheGroup } from ${JSON.stringify(driver)};`,
      // Alive BEFORE the run: whatever started the oracle, a pipeline of the
      // capture job, a test runner.
      `const before = spawn("sleep", ["30"], { stdio: "ignore" });`,
      `spawnSync("sh", ["-c", "sleep 0.4"]);`,
      `const alreadyThere = pidsOfTheGroup(process.pid);`,
      // The run: it leaks one live process and leaves one ZOMBIE behind (the
      // child of a shell that execs over itself and never waits).
      `const leaked = spawn("sh", ["-c", "/bin/true & exec sleep 30"], { stdio: "ignore" });`,
      `spawnSync("sh", ["-c", "sleep 0.6"]);`,
      `const left = listProcessesLeftBehind(process.pid, alreadyThere);`,
      `const all = listProcessesLeftBehind(process.pid);`,
      `console.log(JSON.stringify({ left, all, before: before.pid, leaked: leaked.pid }));`,
      `before.kill("SIGKILL");`,
      `leaked.kill("SIGKILL");`,
      `process.exit(0);`,
    ].join("\n"),
    "utf8",
  );
  // `setsid` is what makes the probe its own process-group leader; the reference
  // tier already names it a prerequisite and every scenario of the oracle is
  // `os: ["linux"]`.
  const run = spawnSync("setsid", [process.execPath, "--experimental-strip-types", probe], {
    encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr);
  const seen = JSON.parse(run.stdout.trim().split("\n").pop() as string) as {
    left: { pid: number; command: string[] }[];
    all: { pid: number; command: string[] }[];
    before: number;
    leaked: number;
  };
  const commandOf = (entries: { command: string[] }[]): string[] =>
    entries.map((entry) => entry.command.join(" "));

  // What the run DID leak is there: the surface is not simply empty.
  assert.ok(
    seen.left.some((entry) => entry.pid === seen.leaked),
    `the leaked process is missing from ${JSON.stringify(commandOf(seen.left))}`,
  );
  // A zombie is not a process that is still alive, and the zombies of one driver
  // ACCUMULATE: counting them would make the capture of a scenario depend on how
  // many scenarios ran before it in the same process.
  for (const command of commandOf(seen.left)) assert.doesNotMatch(command, /defunct/);
  for (const command of commandOf(seen.all)) assert.doesNotMatch(command, /defunct/);
  // The `ps` the oracle spawns to make the list is a process of the oracle, not
  // of the run, and it IS in the group this probe asked about.
  for (const command of commandOf(seen.all)) assert.doesNotMatch(command, /^ps\b/);
  // A process that was alive before the first command of the scenario is not
  // something the run left behind — and without the set it would be listed.
  assert.ok(!seen.left.some((entry) => entry.pid === seen.before));
  assert.ok(seen.all.some((entry) => entry.pid === seen.before));
});
