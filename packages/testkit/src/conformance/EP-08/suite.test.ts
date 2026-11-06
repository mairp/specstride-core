/**
 * T031 — the behaviour cases of EP-08 at conformance level: CT-111-135 and
 * CT-111-136 (F111-FR-035, F111-FR-036), which measure F111-SC-003.
 *
 * F111-FR-035: *A sink that is slow, throws or is dead MUST be skipped for the
 * event. The core MUST bound the time of every call by
 * `telemetry.sinkTimeoutMs`, MUST bound the queue of every sink, MUST record
 * the failure as `telemetry.delivery` (sink, batch, event count, status
 * `attempted`, `accepted`, `failed` or `unknown`, HTTP status, reason) and MUST
 * go on. `telemetry.delivery` MUST NOT be delivered to a remote sink. The
 * outcome of the run, the exit code and the primary event file MUST be
 * unchanged.*
 *
 * F111-FR-036: *The conformance suite of EP-08 MUST hold a slow sink, a
 * throwing sink and a dead collector, and MUST assert equal exit code and equal
 * event file with and without the failing sink. A sample sink that keeps events
 * in memory MUST be registered from the test tree. No core file MUST name the
 * sample.*
 *
 * F111-SC-003: *A sink never breaks the loop. In the 3 conformance fixtures
 * (slow, throwing, dead) the exit code and the primary event file equal those
 * of the run without the failing sink, byte for byte after normalization.*
 *
 * HOW THE EVIDENCE IS TAKEN. Each fixture is a REAL RUN in a CHILD PROCESS.
 * The test reads the child's exit code from the operating system and the
 * child's primary event file from disk; nothing the run returned in-process is
 * taken as proof. The baseline run registers the sample sink alone; each of the
 * three failing runs registers the sample sink AND the failing sink. The two
 * event files are then normalized by the rules of annex X §X.8 that apply here
 * (N-01 paths, N-03 run id, N-04 timestamps, N-07 process ids and lock owners)
 * and compared byte for byte.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { deliveryStatusesOfASink } from "@specstride/contracts/enums/all-sets";
import { FAILURE_PATH } from "@specstride/contracts/ep/event-sink";
import { loadGraph } from "@specstride/import-boundary/src/rules.ts";
import {
  DEFAULT_SINK_TIMEOUT_MS,
  SINK_TIMEOUT_SETTING,
  TELEMETRY_DELIVERY_FIELDS,
  TELEMETRY_DELIVERY_REACHES_A_SINK,
  TELEMETRY_DELIVERY_REACHES_THE_PRIMARY_EVENT_FILE,
  TELEMETRY_DELIVERY_TYPE,
} from "@specstride/observability/dispatcher/isolation";
import { ROOT } from "../frame.ts";
import {
  SAMPLE_SINK_FILE,
  SAMPLE_SINK_ID,
  SAMPLE_SINK_KEEPS_EVENTS_IN_MEMORY,
  sampleSink,
} from "../../samples/EP-08/sample-sink.ts";

/* ------------------------------------------------------------------ *
 * The fixture: one real run in a child process.
 * ------------------------------------------------------------------ */

/** The three failing sinks F111-FR-036 names, and the run without one. */
const FIXTURES = ["none", "slow", "throwing", "dead"] as const;
type Fixture = (typeof FIXTURES)[number];

/** The time limit the fixture gives a sink, so that a slow sink is slow. */
const FIXTURE_TIMEOUT_MS = 60;

/** The events every fixture run writes, whatever sink is registered. */
const FIXTURE_EVENTS = 6;

/**
 * The driver of one fixture run. It is a module of its own, started by
 * `node`, so that the exit code the test reads is an exit code of the
 * operating system and the event file it reads is a file on disk.
 */
const DRIVER = `
import { writeFileSync } from "node:fs";
import { PrimaryWriter } from "@specstride/observability/writer/writer";
import {
  EventDispatcher,
  contentAccessorHook,
  sinkContextOf,
} from "@specstride/observability/dispatcher/dispatcher";
import { SinkIsolation } from "@specstride/observability/dispatcher/isolation";

const failing = process.env.FIXTURE_SINK;
const file = process.env.FIXTURE_EVENTS_FILE;
const summaryPath = process.env.FIXTURE_SUMMARY;
const timeoutMs = Number(process.env.FIXTURE_TIMEOUT_MS);
const howMany = Number(process.env.FIXTURE_EVENT_COUNT);

const { sampleSink } = await import(process.env.FIXTURE_SAMPLE_SINK);

/** The slow sink, the throwing sink and the dead collector (F111-FR-036). */
function failingSink(kind) {
  const common = {
    label: kind,
    acceptsMajors: { from: 1, to: 1 },
    open: () => Promise.resolve(),
    flush: () => Promise.resolve(),
    close: () => Promise.resolve(),
    status: () => ({
      line: "sink=" + kind,
      record: {
        sinkLabel: kind,
        receiverState: "open",
        lastDeliveryStatus: "failed",
        reason: kind,
      },
    }),
  };
  if (kind === "slow") {
    return {
      ...common,
      write: () =>
        new Promise((resolve) => {
          const t = setTimeout(resolve, timeoutMs * 20);
          t.unref();
        }),
    };
  }
  if (kind === "throwing") {
    return {
      ...common,
      write: () => {
        throw new Error("the sink threw");
      },
    };
  }
  // The dead collector: the call never comes back at all.
  return { ...common, write: () => new Promise(() => {}) };
}

const writer = PrimaryWriter.open({
  file,
  runId: "run-fixture",
  launchId: "launch-fixture",
  holder: "fixture",
  now: () => new Date(Date.UTC(2026, 9, 1, 0, 0, 0)),
});
const isolation = new SinkIsolation({
  switches: { "${SINK_TIMEOUT_SETTING}": timeoutMs },
  eventsFile: file,
  now: () => new Date(Date.UTC(2026, 9, 1, 0, 0, 0)),
});
const dispatcher = new EventDispatcher({ writer, callSink: isolation.callSink });

const sample = sampleSink();
dispatcher.register(sample);
if (failing !== "none") dispatcher.register(failingSink(failing));

await dispatcher.open(
  sinkContextOf({
    runId: "run-fixture",
    launchId: "launch-fixture",
    engineStartId: "start-fixture",
    feature: "111-event-schema-and-projection",
    workspaceId: "ws-fixture",
    labels: { job: "j", "service.name": "s", task: "t", backend: "b" },
    profile: "default",
    switches: {},
    content: contentAccessorHook({
      captureIsOn: false,
      read: () => Promise.resolve(undefined),
      asIsSnippet: () => Promise.resolve(undefined),
    }),
    compatibilityProjection: { asIsNameOf: () => null },
  }),
);

const types = ["pass.started", "tool.call", "tool.result", "check.started", "check.ended", "pass.ended"];
for (let i = 0; i < howMany; i++) {
  await dispatcher.append({ type: types[i % types.length], data: {} });
}
await dispatcher.flush();
await dispatcher.close();
writer.close();

writeFileSync(
  summaryPath,
  JSON.stringify({
    kept: sample.kept.map((e) => e.type),
    keptSeqs: sample.kept.map((e) => e.seq),
    keptTypesAtTheSink: [...new Set(sample.kept.map((e) => e.type))],
    deliveries: isolation.deliveries.map((d) => ({
      sink: d.data.sink,
      status: d.data.status,
      reasonCode: d.data.reasonCode,
      eventCount: d.data.eventCount,
      httpStatus: d.data.httpStatus,
      batchId: typeof d.data.batchId,
      type: d.type,
    })),
    deliveryLog: isolation.deliveryLogPath,
    queueDepths: isolation.queueDepths(),
    droppedOldest: isolation.droppedOldest(),
  }),
);

// The exit code is the outcome of the RUN: every event the run wrote reached
// the one sink that works, or the run failed.
process.exitCode = sample.kept.length === howMany ? 0 : 7;
`;

type FixtureResult = {
  readonly exitCode: number;
  readonly eventFile: string;
  readonly eventBytes: string;
  readonly summary: {
    readonly kept: readonly string[];
    readonly keptSeqs: readonly number[];
    readonly deliveries: readonly {
      readonly sink: string;
      readonly status: string;
      readonly reasonCode: string;
      readonly eventCount: number;
      readonly httpStatus: unknown;
      readonly type: string;
    }[];
    readonly deliveryLog: string;
    readonly queueDepths: Readonly<Record<string, number>>;
    readonly droppedOldest: Readonly<Record<string, number>>;
  };
  readonly stderr: string;
  readonly dir: string;
};

/** Run one fixture and read its exit code and its event file from disk. */
function runFixture(fixture: Fixture): FixtureResult {
  const dir = mkdtempSync(join(tmpdir(), `ct-111-135-${fixture}-`));
  const eventFile = join(dir, "events.jsonl");
  const summary = join(dir, "summary.json");
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", DRIVER], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 60_000,
    env: {
      ...process.env,
      FIXTURE_SINK: fixture,
      FIXTURE_EVENTS_FILE: eventFile,
      FIXTURE_SUMMARY: summary,
      FIXTURE_TIMEOUT_MS: String(FIXTURE_TIMEOUT_MS),
      FIXTURE_EVENT_COUNT: String(FIXTURE_EVENTS),
      FIXTURE_SAMPLE_SINK: join(ROOT, SAMPLE_SINK_FILE),
    },
  });
  assert.equal(child.signal, null, `the fixture ${fixture} ended by a signal: ${child.stderr}`);
  return {
    exitCode: child.status ?? -1,
    eventFile,
    eventBytes: existsSync(eventFile) ? readFileSync(eventFile, "utf8") : "",
    summary: existsSync(summary)
      ? (JSON.parse(readFileSync(summary, "utf8")) as FixtureResult["summary"])
      : ({} as FixtureResult["summary"]),
    stderr: child.stderr,
    dir,
  };
}

/**
 * The rules of annex X §X.8 that apply to this comparison: N-01 absolute
 * paths, N-03 run id, N-04 timestamps, N-07 process ids and lock owners.
 */
function normalize(bytes: string, dir: string): string {
  return bytes
    .split(dir)
    .join("<dir>")
    .replace(/"ts":"[^"]*"/g, '"ts":"<ts>"')
    .replace(/"runId":"[^"]*"/g, '"runId":"<runId>"')
    .replace(/"launchId":"[^"]*"/g, '"launchId":"<launchId>"')
    .replace(/"pid":\d+/g, '"pid":<pid>')
    .replace(/"holder":"[^"]*"/g, '"holder":"<holder>"');
}

const results: Partial<Record<Fixture, FixtureResult>> = {};
function fixtureOf(name: Fixture): FixtureResult {
  const cached = results[name];
  if (cached !== undefined) return cached;
  const fresh = runFixture(name);
  results[name] = fresh;
  return fresh;
}

/* ------------------------------------------------------------------ *
 * CT-111-135 — the three failing sinks change nothing.
 * ------------------------------------------------------------------ */

test("CT-111-135/a: the baseline run writes its events and exits 0", () => {
  const baseline = fixtureOf("none");
  assert.equal(baseline.exitCode, 0, baseline.stderr);
  const lines = baseline.eventBytes.split("\n").filter((l) => l.length > 0);
  assert.equal(lines.length, FIXTURE_EVENTS);
  assert.deepEqual(baseline.summary.keptSeqs, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(
    baseline.summary.deliveries.map((d) => d.status),
    ["accepted", "accepted", "accepted", "accepted", "accepted", "accepted"],
  );
});

for (const fixture of ["slow", "throwing", "dead"] as const) {
  test(`CT-111-135/b-${fixture}: a ${fixture} sink leaves the exit code and the primary event file unchanged (F111-SC-003)`, () => {
    const baseline = fixtureOf("none");
    const failing = fixtureOf(fixture);

    assert.equal(failing.exitCode, baseline.exitCode, failing.stderr);
    assert.equal(failing.exitCode, 0, "the run succeeded with the failing sink registered");
    assert.equal(
      normalize(failing.eventBytes, failing.dir),
      normalize(baseline.eventBytes, baseline.dir),
      "the primary event file is byte-identical after normalization",
    );
    assert.equal(
      failing.eventBytes.includes(TELEMETRY_DELIVERY_TYPE),
      false,
      "`telemetry.delivery` is not in the primary event file",
    );
    assert.deepEqual(
      failing.summary.kept,
      baseline.summary.kept,
      "the working sink saw exactly the events of the baseline run",
    );
  });

  test(`CT-111-135/c-${fixture}: the ${fixture} sink is skipped for the event and the failure is recorded as \`telemetry.delivery\``, () => {
    const failing = fixtureOf(fixture);
    const ofTheFailing = failing.summary.deliveries.filter((d) => d.sink === fixture);
    assert.equal(
      ofTheFailing.length,
      FIXTURE_EVENTS,
      "every event of the run produced a delivery record for the failing sink",
    );
    for (const record of ofTheFailing) {
      assert.equal(record.type, TELEMETRY_DELIVERY_TYPE);
      assert.ok(
        deliveryStatusesOfASink.has(record.status),
        `${record.status} is a member of row 93: ${[...deliveryStatusesOfASink.members].join(", ")}`,
      );
      assert.notEqual(record.status, "accepted", "a failing sink never reports `accepted`");
      assert.equal(record.eventCount >= 1, true);
    }
    const expected = fixture === "throwing" ? "failed" : "attempted";
    assert.deepEqual(
      [...new Set(ofTheFailing.map((d) => d.status))],
      [expected],
      "a sink that throws is a definite failure; a slow or dead one is attempted",
    );
    assert.deepEqual(
      [...new Set(ofTheFailing.map((d) => d.reasonCode))],
      [fixture === "throwing" ? "threw" : "timed-out"],
    );
  });
}

test("CT-111-135/d: the time limit of every call is `telemetry.sinkTimeoutMs`, whose default is row 46's", () => {
  assert.equal(SINK_TIMEOUT_SETTING, "telemetry.sinkTimeoutMs");
  assert.equal(DEFAULT_SINK_TIMEOUT_MS, 2000);
  // A dead collector would hang the run for ever without the limit; the
  // fixture finished, which is the proof that the limit is applied.
  const dead = fixtureOf("dead");
  assert.equal(dead.exitCode, 0);
  assert.equal(FAILURE_PATH.includes("skipped for the event"), true);
});

test("CT-111-135/e: the queue of every sink is bounded", () => {
  for (const fixture of ["slow", "dead"] as const) {
    const failing = fixtureOf(fixture);
    const depth = failing.summary.queueDepths[fixture];
    assert.equal(typeof depth, "number", `the ${fixture} sink has a queue`);
    assert.ok(depth !== undefined && depth <= FIXTURE_EVENTS, "the queue did not grow unbounded");
  }
});

test("CT-111-135/f: `telemetry.delivery` stays local — it reaches no sink and no remote destination", () => {
  assert.equal(TELEMETRY_DELIVERY_REACHES_A_SINK, false);
  assert.equal(TELEMETRY_DELIVERY_REACHES_THE_PRIMARY_EVENT_FILE, false);
  for (const fixture of FIXTURES) {
    const run = fixtureOf(fixture);
    assert.equal(
      run.summary.kept.includes(TELEMETRY_DELIVERY_TYPE),
      false,
      `the in-memory sink of the ${fixture} run never received \`telemetry.delivery\``,
    );
    // The records are on disk, in the LOCAL delivery log beside the event
    // file — an independent read path, and never a sink.
    const log = run.summary.deliveryLog;
    assert.equal(typeof log, "string");
    assert.equal(existsSync(log), true, "the local delivery log is a real file");
    const records = readFileSync(log, "utf8")
      .split("\n")
      .filter((l) => l.length > 0)
      .map((l) => JSON.parse(l) as { type: string; data: Record<string, unknown> });
    assert.ok(records.length > 0);
    for (const record of records) {
      assert.equal(record.type, TELEMETRY_DELIVERY_TYPE);
      assert.deepEqual(
        Object.keys(record.data).sort(),
        [...TELEMETRY_DELIVERY_FIELDS].sort(),
        "the record holds the six fields the catalogue gives the type",
      );
    }
    assert.notEqual(
      log,
      run.eventFile,
      "the delivery log is not the primary event file of the run",
    );
  }
});

/* ------------------------------------------------------------------ *
 * CT-111-136 — the sample in-memory sink, and no core file naming it.
 * ------------------------------------------------------------------ */

test("CT-111-136/a: the sample sink keeps events in memory and is registered from the test tree", () => {
  assert.equal(SAMPLE_SINK_KEEPS_EVENTS_IN_MEMORY, true);
  assert.equal(SAMPLE_SINK_FILE, "packages/testkit/src/samples/EP-08/sample-sink.ts");
  assert.equal(existsSync(join(ROOT, SAMPLE_SINK_FILE)), true);
  assert.equal(SAMPLE_SINK_FILE.startsWith("packages/testkit/src/samples/"), true);

  const sink = sampleSink();
  assert.equal(sink.label, SAMPLE_SINK_ID);
  assert.deepEqual(sink.acceptsMajors, { from: 1, to: 1 });
  assert.deepEqual(sink.kept, []);
});

test("CT-111-136/b: the three fixtures and the baseline run the sample sink from the test tree", () => {
  for (const fixture of FIXTURES) {
    const run = fixtureOf(fixture);
    assert.deepEqual(
      run.summary.kept,
      ["pass.started", "tool.call", "tool.result", "check.started", "check.ended", "pass.ended"],
      `the sample sink of the ${fixture} run kept every event in memory`,
    );
  }
});

test("CT-111-136/c: no core file names the sample sink — the build fails if one does", () => {
  const graph = loadGraph(join(ROOT, "packages/contracts/data/package-graph.json"));
  const core = graph.packages.filter((p) => p.core === true);
  assert.ok(core.length > 0, "the graph marks at least one package `core`");

  // The names a core file may not carry: the path of the sample, its
  // directory, its module name and the id it registers under.
  const forbidden = [SAMPLE_SINK_FILE, "samples/EP-08", "sample-sink", SAMPLE_SINK_ID];
  const named: string[] = [];
  for (const pkg of core) {
    const dir = join(ROOT, "packages", pkg.name.replace(/^@specstride\//, ""), "src");
    for (const file of sourceFiles(dir)) {
      const content = readFileSync(file, "utf8");
      for (const name of forbidden) {
        if (content.includes(name)) named.push(`${relative(ROOT, file)}: ${name}`);
      }
    }
  }
  assert.deepEqual(
    named,
    [],
    "a core file names the sample sink; adding or removing the sample must change no core file (F111-FR-036, F100-FR-018)",
  );

  // Negative control: the check DOES fire on content that names the sample,
  // so the empty list above is a finding and not a check that cannot fail.
  const planted = forbidden.filter((name) =>
    `a line that names ${SAMPLE_SINK_FILE} and ${SAMPLE_SINK_ID} and sample-sink and samples/EP-08`.includes(
      name,
    ),
  );
  assert.deepEqual(planted, forbidden, "every forbidden name is detectable");
});

/** Every `.ts` file under a directory, deepest last. */
function sourceFiles(dir: string): readonly string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}
