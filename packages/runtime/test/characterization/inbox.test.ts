/**
 * T059 — CT-122-29 and CT-122-30: the inbox (F122-FR-029, F122-FR-030).
 *
 * *After launch, the inbox MUST be the only place where a process outside the
 * runtime tree writes [...]. The inbox MUST accept exactly the request types of
 * feature 100 annex B §B.11. A request MUST be written to a temporary name and
 * renamed. The runtime MUST validate every request against its schema before it
 * acts on it, MUST ignore and report a request of an unknown type or one that
 * fails validation, and MUST read requests at boundaries and never be
 * interrupted by one. A request found anywhere else, the workspace part
 * included, MUST NOT be read.*
 *
 * *A stop request MUST be accepted when no run is active, and MUST stay in the
 * inbox until it is honoured: the next engine start MUST read it at its first
 * boundary and stop as at the baseline. An empty stop request MUST be valid and
 * MUST mean a clean stop with every default. The process that honours a request
 * MUST remove it.*
 *
 * The baseline scenario is `stop-with-no-run` of the fixture family FX-12 of
 * the catalogue of feature 141, and the first case below asserts that the
 * family really holds it: a test that named a scenario the catalogue does not
 * hold would otherwise look green for ever. The comparison with the reference
 * tree belongs to the parity oracle of feature 141, which is not built yet;
 * what runs here is the PORT side, on a hermetic control root.
 *
 * Every answer is read back through a path that is NOT the module under test:
 *
 *   - "the request is there" / "the request is gone" is `readFileSync` and
 *     `existsSync` on the path that `resolve()` of `@specstride/contracts`
 *     gives for the logical name, resolved in this file from the layout table;
 *   - "it was reported" is the event stream of the run, read off the disk as
 *     text and parsed here, never through `readEvents` of the runtime;
 *   - "the write was atomic" is the directory listing: no temporary name of the
 *     kernel's atomic write is left behind, and the bytes are a whole record;
 *   - "the engine stopped at its first boundary" is the count of passes a stub
 *     engine loop actually ran, kept by the loop itself.
 *
 * No process is started and no group is signalled by this file.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import process from "node:process";
import { isTemporaryName } from "@specstride/kernel";
import { resolve, rootPathsOf, writerOf } from "@specstride/contracts/ids/logical-names";
import catalogue from "../../../../vendor/specs/141-parity-oracle/contracts/fixture-catalogue.json" with { type: "json" };
import {
  A_WATCHER,
  BASELINE_STOP_EXIT,
  BASELINE_STOP_REASON,
  HONOURED_EVENT,
  IGNORED_EVENT,
  INBOX_REQUEST_TYPES,
  INBOX_SCHEMA_ID,
  NEVER_INTERRUPTS_A_PASS,
  READ_AT_BOUNDARIES_ONLY,
  STOP_ACCEPTED_WITH_NO_RUN_ACTIVE,
  InboxRefusedError,
  firstBoundaryOfAnEngineStart,
  honourRequest,
  inboxPathOf,
  readInboxAtBoundary,
  readableInboxPaths,
  readerActsOn,
  readersOfType,
  reportToTheEventStream,
  requestIsNotRead,
  validateRequest,
  writeEmptyStopRequest,
  writeRequest,
  type InboxPlace,
  type ValidRequest,
} from "../../src/inbox/inbox.ts";
import type { RootPlace } from "../../src/root/start.ts";
import { makeScratchControlRoot } from "../helpers/scratch-control-root.ts";

const SLUG = "122-detached-runtime";
const LAUNCH = "launch-inbox";

/** A control root and a workspace of this test alone. */
type Scratch = {
  readonly place: InboxPlace;
  readonly where: RootPlace;
  readonly workspacePart: string;
  readonly dispose: () => void;
};

function scratch(runId = "run-inbox"): Scratch {
  const control = makeScratchControlRoot("inbox");
  const workspace = makeScratchControlRoot("inbox-workspace");
  const place: InboxPlace = Object.freeze({
    controlRoot: control.path,
    workspaceRealPath: workspace.path,
  });
  const workspacePart = `${workspace.path}/.specstride`;
  mkdirSync(workspacePart, { recursive: true, mode: 0o700 });
  return Object.freeze({
    place,
    where: Object.freeze({ place, slug: SLUG, runId }),
    workspacePart,
    dispose: (): void => {
      control.dispose();
      workspace.dispose();
    },
  });
}

/* ------------------------------------------------------------------ *
 * The independent read paths.
 * ------------------------------------------------------------------ */

/** The path of a logical name, resolved HERE from the layout table. */
function pathOfName(
  name: string,
  place: InboxPlace,
  parameters: Record<string, string> = {},
): string {
  const roots = rootPathsOf({
    home: "",
    workspaceRealPath: place.workspaceRealPath,
    workspaceId: "",
    controlRoot: place.controlRoot,
    workerRoot: "",
  });
  return resolve(name, parameters, roots);
}

/** The bytes of an inbox entry, read off the disk. `undefined` where none. */
function bytesOnDisk(
  name: string,
  place: InboxPlace,
  parameters: Record<string, string> = {},
): string | undefined {
  const path = pathOfName(name, place, parameters);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
}

/** The events of the run, read as text and parsed here. */
function eventsOnDisk(where: RootPlace): readonly Record<string, unknown>[] {
  const path = pathOfName("run:<runId>:events", where.place, {
    "<slug>": where.slug,
    "<runId>": where.runId,
  });
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

const eventsOfType = (where: RootPlace, type: string): readonly Record<string, unknown>[] =>
  eventsOnDisk(where).filter((e) => e["type"] === type);

/* ================================================================== *
 * CT-122-29 — the inbox, its three types, its validation and its reach.
 * ================================================================== */

test("CT-122-29: the fixture family FX-12 holds the scenario `stop-with-no-run`", () => {
  const families = (
    catalogue as { families: { id: string; status: string; scenarios: { name: string }[] }[] }
  ).families;
  const family = families.find((f) => f.id === "FX-12");
  assert.ok(family, "the catalogue of feature 141 holds the family FX-12");
  assert.equal(family.status, "active");
  assert.ok(
    family.scenarios.some((s) => s.name === "stop-with-no-run"),
    "FX-12 holds the scenario `stop-with-no-run` that F122-FR-030 is proved on",
  );
});

test("CT-122-29: the inbox accepts exactly the three request types, and the CLI is their writer", () => {
  const s = scratch();
  try {
    assert.deepEqual([...INBOX_REQUEST_TYPES], ["stop", "hold-relaunch", "host-event"]);
    // The table of annex B §B.5 names ONE writer for each entry, and it is the
    // process outside the runtime tree: the CLI (F122-FR-029, F100-FR-003).
    for (const name of ["inbox:stop", "inbox:hold-relaunch", "inbox:host-events:<launchId>"]) {
      assert.match(writerOf(name), /^CLI/);
    }
    // Three entries and no fourth: the inbox is the whole way in.
    const entries = readableInboxPaths(s.place, LAUNCH);
    assert.deepEqual(
      entries.map((e) => e.type),
      ["stop", "hold-relaunch", "host-event"],
    );
    // A type outside the closed set is refused by the writer and lands nowhere.
    const before = readdirSync(s.place.controlRoot);
    assert.throws(
      () => writeRequest({ place: s.place, type: "pause-everything" }),
      (err: unknown) => err instanceof InboxRefusedError && err.reason === "unknown-type",
    );
    assert.deepEqual(readdirSync(s.place.controlRoot), before);
  } finally {
    s.dispose();
  }
});

test("CT-122-29: each of the three types reaches the reader the table names for it", () => {
  const s = scratch();
  try {
    writeRequest({ place: s.place, type: "stop", fields: { now: true, jobs: true } });
    writeRequest({
      place: s.place,
      type: "hold-relaunch",
      fields: { hold: true, reason: "a limit of the host" },
    });
    writeRequest({
      place: s.place,
      type: "host-event",
      launchId: LAUNCH,
      fields: { kind: "host-limit", data: { window: "5h" } },
    });

    // Every one of the three lies on the disk as a whole record of §B.11.
    for (const [name, parameters] of [
      ["inbox:stop", {}],
      ["inbox:hold-relaunch", {}],
      ["inbox:host-events:<launchId>", { "<launchId>": LAUNCH }],
    ] as const) {
      const bytes = bytesOnDisk(name, s.place, parameters);
      assert.ok(bytes !== undefined, `${name} lies on the disk`);
      const record = JSON.parse(bytes.trim().split("\n")[0] as string) as Record<string, unknown>;
      assert.equal(record["schema"], INBOX_SCHEMA_ID);
      assert.ok(typeof record["at"] === "string" && record["at"] !== "");
    }

    // The readers of §B.5: stop is read by both, a hold only by the root, a
    // host event only by the engine.
    assert.deepEqual([...readersOfType("stop")], ["engine", "runtime-root"]);
    assert.deepEqual([...readersOfType("hold-relaunch")], ["runtime-root"]);
    assert.deepEqual([...readersOfType("host-event")], ["engine"]);
    assert.equal(readerActsOn("engine", "hold-relaunch"), false);
    assert.equal(readerActsOn("runtime-root", "host-event"), false);

    const engine = readInboxAtBoundary({ place: s.place, reader: "engine", launchId: LAUNCH });
    assert.deepEqual(
      engine.requests.map((r) => r.request.type),
      ["stop", "host-event"],
    );
    const root = readInboxAtBoundary({ place: s.place, reader: "runtime-root", launchId: LAUNCH });
    assert.deepEqual(
      root.requests.map((r) => r.request.type),
      ["stop", "hold-relaunch"],
    );

    // The fields of each type arrive as §B.11 says they mean.
    const stop = engine.requests[0]?.request;
    assert.equal(stop?.type === "stop" && stop.now, true);
    assert.equal(stop?.type === "stop" && stop.jobs, true);
    const hold = root.requests[1]?.request;
    assert.equal(hold?.type === "hold-relaunch" && hold.hold, true);
    const event = engine.requests[1]?.request;
    assert.equal(event?.type === "host-event" && event.kind, "host-limit");
    assert.equal(event?.type === "host-event" && (event.data as { window?: string }).window, "5h");
  } finally {
    s.dispose();
  }
});

test("CT-122-29: the request is written to a temporary name and renamed, and nothing partial is left", () => {
  const s = scratch();
  try {
    const written = writeRequest({ place: s.place, type: "stop", fields: { now: false } });
    const directory = resolvePath(inboxPathOf("stop", s.place), "..");
    // No temporary name of the kernel's atomic write survives the rename.
    const leftovers = readdirSync(directory).filter((n) => isTemporaryName(n));
    assert.deepEqual(leftovers, [], "no temporary name is left in the inbox");
    // What lies there is a WHOLE record, and it is owner-only.
    const bytes = bytesOnDisk("inbox:stop", s.place);
    assert.equal(bytes, written.bytes);
    assert.doesNotThrow(() => JSON.parse(bytes as string));
    assert.equal(statSync(written.path).mode & 0o777, 0o600);
    // The writer validates BEFORE it renames: a hold without its required
    // field `hold` is refused and the entry stays absent.
    assert.throws(
      () => writeRequest({ place: s.place, type: "hold-relaunch", fields: {} }),
      (err: unknown) => err instanceof InboxRefusedError && err.reason === "missing-required-field",
    );
    assert.equal(bytesOnDisk("inbox:hold-relaunch", s.place), undefined);
    // And it validates against the SCHEMA of feature 100, not only against the
    // list of required fields: a field of the wrong kind is refused, and the
    // entry that was there before the call is left as it was.
    const stopBefore = bytesOnDisk("inbox:stop", s.place);
    assert.throws(
      () => writeRequest({ place: s.place, type: "stop", fields: { at: 42 } }),
      (err: unknown) => err instanceof InboxRefusedError && err.reason === "schema-refused",
    );
    assert.equal(bytesOnDisk("inbox:stop", s.place), stopBefore);
  } finally {
    s.dispose();
  }
});

test("CT-122-29: a request of an unknown type is ignored and reported, and the run goes on", () => {
  const s = scratch();
  try {
    // A request a process outside the tree wrote by hand, with a type that is
    // not a member of the closed set of row 21.
    const path = inboxPathOf("stop", s.place);
    mkdirSync(resolvePath(path, ".."), { recursive: true, mode: 0o700 });
    writeFileSync(
      path,
      JSON.stringify({
        schema: INBOX_SCHEMA_ID,
        type: "pause-everything",
        at: "2026-10-02T00:00:00.000Z",
      }) + "\n",
      { mode: 0o600 },
    );

    const reading = readInboxAtBoundary({
      place: s.place,
      reader: "engine",
      report: reportToTheEventStream(s.where, LAUNCH),
    });
    // Ignored: no request reached a reader, and no stop was decided.
    assert.deepEqual(reading.requests, []);
    assert.equal(reading.stop, undefined);
    assert.equal(reading.ignored.length, 1);
    assert.equal(reading.ignored[0]?.reason, "unknown-type");

    // Reported: the event stream of the run says so, read off the disk here.
    const reported = eventsOfType(s.where, IGNORED_EVENT);
    assert.equal(reported.length, 1);
    const data = reported[0]?.["data"] as Record<string, unknown>;
    assert.equal(data["name"], "inbox:stop");
    assert.equal(data["reason"], "unknown-type");
    assert.equal(data["requestHash"], reading.ignored[0]?.hash);
    // The report names the set and the value it was read against (row 21).
    assert.match(String(data["detail"]), /pause-everything/);
    assert.match(String(data["detail"]), /Inbox request types/);

    // The run goes on: the request was not honoured, so it was not removed,
    // and a later boundary still works and still decides nothing.
    assert.ok(
      bytesOnDisk("inbox:stop", s.place) !== undefined,
      "an ignored request is not removed",
    );
    const again = readInboxAtBoundary({ place: s.place, reader: "engine" });
    assert.equal(again.stop, undefined);
  } finally {
    s.dispose();
  }
});

test("CT-122-29: a malformed request is ignored and reported, and one arrival is reported once", () => {
  const s = scratch();
  try {
    const path = inboxPathOf("stop", s.place);
    mkdirSync(resolvePath(path, ".."), { recursive: true, mode: 0o700 });
    writeFileSync(path, "{ this is not a record", { mode: 0o600 });

    const reported = new Set<string>();
    const input = {
      place: s.place,
      reader: "engine" as const,
      report: reportToTheEventStream(s.where, LAUNCH),
      reported,
    };
    const first = readInboxAtBoundary(input);
    assert.equal(first.ignored[0]?.reason, "malformed");
    assert.equal(first.stop, undefined);
    // A second and a third boundary meet the same request: it is still ignored
    // and the run goes on, and the arrival is reported once.
    readInboxAtBoundary(input);
    readInboxAtBoundary(input);
    assert.equal(eventsOfType(s.where, IGNORED_EVENT).length, 1);

    // A request that fails its SCHEMA is ignored too: a different major is
    // refused by the owning feature before any reader sees a field.
    writeFileSync(
      path,
      JSON.stringify({
        schema: "specstride.inbox/2",
        type: "stop",
        at: "2026-10-02T00:00:00.000Z",
      }) + "\n",
      { mode: 0o600 },
    );
    const second = readInboxAtBoundary(input);
    assert.equal(second.ignored[0]?.reason, "schema-refused");
    assert.equal(second.stop, undefined);
    assert.equal(eventsOfType(s.where, IGNORED_EVENT).length, 2);

    // A request whose `type` is not the type of the entry it lies in is not
    // read as that type: a hold dropped into the stop entry stops nothing.
    writeFileSync(
      path,
      JSON.stringify({
        schema: INBOX_SCHEMA_ID,
        type: "hold-relaunch",
        at: "2026-10-02T00:00:00.000Z",
        hold: true,
      }) + "\n",
      { mode: 0o600 },
    );
    const third = readInboxAtBoundary(input);
    assert.equal(third.ignored[0]?.reason, "wrong-type-for-the-name");
    assert.equal(third.stop, undefined);

    // And a host event that carries no `kind` is ignored for the missing field.
    const stream = inboxPathOf("host-event", s.place, LAUNCH);
    mkdirSync(resolvePath(stream, ".."), { recursive: true, mode: 0o700 });
    writeFileSync(
      stream,
      JSON.stringify({
        schema: INBOX_SCHEMA_ID,
        type: "host-event",
        at: "2026-10-02T00:00:00.000Z",
      }) + "\n",
      { mode: 0o600 },
    );
    const fourth = readInboxAtBoundary({ ...input, launchId: LAUNCH });
    assert.ok(
      fourth.ignored.some((i) => i.reason === "missing-required-field"),
      "a host event without `kind` is ignored",
    );
    assert.deepEqual(fourth.requests, []);
  } finally {
    s.dispose();
  }
});

test("CT-122-29: a request in the workspace part is not read", () => {
  const s = scratch();
  try {
    // The proposer's pass writes a stop request into the workspace part. It is
    // not in the inbox: it is not read, and it is not touched.
    const planted = `${s.workspacePart}/stop.request`;
    const bytes =
      JSON.stringify({
        schema: INBOX_SCHEMA_ID,
        type: "stop",
        at: "2026-10-02T00:00:00.000Z",
        now: true,
      }) + "\n";
    writeFileSync(planted, bytes, { mode: 0o600 });

    assert.equal(requestIsNotRead(planted, s.place, LAUNCH), true);
    assert.equal(
      readableInboxPaths(s.place, LAUNCH).some((e) => resolvePath(e.path) === resolvePath(planted)),
      false,
      "the workspace part is not one of the paths a reader opens",
    );

    const reading = readInboxAtBoundary({
      place: s.place,
      reader: "engine",
      launchId: LAUNCH,
      report: reportToTheEventStream(s.where, LAUNCH),
    });
    assert.deepEqual(reading.requests, []);
    assert.deepEqual(reading.ignored, []);
    assert.equal(reading.stop, undefined);
    // Nothing of it was read, reported or removed.
    assert.equal(readFileSync(planted, "utf8"), bytes);
    assert.deepEqual(eventsOnDisk(s.where), []);

    // The same request, in the inbox, IS read: the difference is the place.
    writeRequest({ place: s.place, type: "stop", fields: { now: true } });
    const inInbox = readInboxAtBoundary({ place: s.place, reader: "engine" });
    assert.equal(inInbox.stop?.request.type, "stop");
    assert.equal(requestIsNotRead(inInbox.stop?.path as string, s.place), false);
  } finally {
    s.dispose();
  }
});

test("CT-122-29: requests are read at boundaries and never interrupt a pass", async () => {
  const s = scratch();
  try {
    assert.equal(A_WATCHER, false);
    assert.equal(READ_AT_BOUNDARIES_ONLY, true);
    assert.equal(NEVER_INTERRUPTS_A_PASS, true);

    const boundaries: number[] = [];
    let interrupted = false;
    let passes = 0;

    // A stub pass loop: it reads the inbox at a boundary, then works. The
    // request arrives DURING the first pass.
    for (let boundary = 1; boundary <= 3; boundary += 1) {
      const reading = readInboxAtBoundary({ place: s.place, reader: "engine" });
      boundaries.push(reading.stop === undefined ? 0 : 1);
      if (reading.stop !== undefined) {
        reading.stop.honour();
        break;
      }
      // The pass. It runs to its end whatever arrives.
      const startedAt = Date.now();
      if (boundary === 1) writeRequest({ place: s.place, type: "stop" });
      await new Promise((done) => setTimeout(done, 30));
      if (Date.now() - startedAt < 25) interrupted = true;
      passes += 1;
    }

    assert.equal(interrupted, false, "no pass was cut short by a request");
    // The request arrived during pass 1 and was seen at boundary 2, not before.
    assert.deepEqual(boundaries, [0, 1]);
    assert.equal(passes, 1);
    // Nothing of this module left a watcher behind.
    const resources = process.getActiveResourcesInfo();
    assert.equal(
      resources.some((r) => r === "FSEventWrap" || r === "StatWatcher" || r === "FSReqCallback"),
      false,
      `no watcher is open: ${resources.join(", ")}`,
    );
  } finally {
    s.dispose();
  }
});

/* ================================================================== *
 * CT-122-30 — a stop request with no run, the empty request, the removal.
 * ================================================================== */

test("CT-122-30: a stop request written with no run active stops the next engine start at its first boundary", () => {
  const s = scratch("run-after-the-stop");
  try {
    assert.equal(STOP_ACCEPTED_WITH_NO_RUN_ACTIVE, true);
    // NO run: the control root holds no lock, no lease and no run record. The
    // only thing in it is the request.
    const written = writeRequest({
      place: s.place,
      type: "stop",
      fields: { causedBy: "operator" },
    });
    assert.deepEqual(readdirSync(s.place.controlRoot), ["inbox"]);
    assert.ok(bytesOnDisk("inbox:stop", s.place) !== undefined);

    // The request STAYS in the inbox until it is honoured: an engine start that
    // never comes leaves it there, and two readings find it.
    assert.ok(readInboxAtBoundary({ place: s.place, reader: "engine" }).stop !== undefined);
    assert.ok(bytesOnDisk("inbox:stop", s.place) !== undefined);

    // The next engine start. Its loop reads the inbox at every boundary; the
    // count of passes it ran is kept by the loop itself.
    let passes = 0;
    let stoppedAt = 0;
    let stopReason: string | undefined;
    let exit: number | undefined;
    let readingOfTheStop: ValidRequest | undefined;
    for (let boundary = 1; boundary <= 3; boundary += 1) {
      const first = firstBoundaryOfAnEngineStart({
        place: s.place,
        reader: "engine",
        report: reportToTheEventStream(s.where, LAUNCH),
      });
      if (first.stops) {
        stoppedAt = boundary;
        stopReason = first.stopReason;
        exit = first.engineExit;
        readingOfTheStop = first.stop?.request;
        assert.equal(first.stop?.honour(), true);
        break;
      }
      passes += 1;
    }

    assert.equal(stoppedAt, 1, "the engine start stopped at its FIRST boundary");
    assert.equal(passes, 0, "no pass ran");
    // Stop as at the baseline: the stop reason and the exit code of annex E §E.3.
    assert.equal(stopReason, BASELINE_STOP_REASON);
    assert.equal(stopReason, "stop_flag");
    // The request carried `causedBy` and nothing else, so it is a CLEAN stop
    // that ends no job: the two defaults are read from the absence of a field
    // and not from the emptiness of the request.
    const asked = readingOfTheStop;
    assert.equal(asked?.type === "stop" && asked.empty, false);
    assert.equal(asked?.type === "stop" && asked.now, false);
    assert.equal(asked?.type === "stop" && asked.jobs, false);
    assert.equal(asked?.type === "stop" && asked.causedBy, "operator");
    assert.equal(exit, BASELINE_STOP_EXIT);
    assert.equal(exit, 6);

    // The process that honoured it removed it, and said so durably.
    assert.equal(bytesOnDisk("inbox:stop", s.place), undefined);
    const honoured = eventsOfType(s.where, HONOURED_EVENT);
    assert.equal(honoured.length, 1);
    const data = honoured[0]?.["data"] as Record<string, unknown>;
    assert.equal(data["name"], "inbox:stop");
    assert.equal(data["requestType"], "stop");
    assert.equal(data["requestHash"], written.hash);
    assert.equal(data["reader"], "engine");

    // A later boundary finds nothing: the next run is not stopped again.
    const after = readInboxAtBoundary({ place: s.place, reader: "engine" });
    assert.equal(after.stop, undefined);
    assert.deepEqual(after.ignored, []);
  } finally {
    s.dispose();
  }
});

test("CT-122-30: a boundary that finds other requests but no stop request decides no stop", () => {
  const s = scratch("run-no-stop");
  try {
    // A hold of a relaunch and a host event, and NO stop request.
    writeRequest({ place: s.place, type: "hold-relaunch", fields: { hold: true } });
    writeRequest({
      place: s.place,
      type: "host-event",
      launchId: LAUNCH,
      fields: { kind: "host-limit" },
    });

    const root = readInboxAtBoundary({ place: s.place, reader: "runtime-root", launchId: LAUNCH });
    assert.deepEqual(
      root.requests.map((r) => r.request.type),
      ["hold-relaunch"],
    );
    assert.equal(root.stop, undefined, "a hold of a relaunch is no stop");

    const first = firstBoundaryOfAnEngineStart({
      place: s.place,
      reader: "engine",
      launchId: LAUNCH,
    });
    assert.deepEqual(
      first.reading.requests.map((r) => r.request.type),
      ["host-event"],
    );
    assert.equal(first.stops, false, "a host event informs only (F100-FR-065)");
    assert.equal(first.stopReason, undefined);
    assert.equal(first.engineExit, undefined);
    // Neither was honoured by the reading, so both are still in the inbox.
    assert.ok(bytesOnDisk("inbox:hold-relaunch", s.place) !== undefined);
    assert.ok(
      bytesOnDisk("inbox:host-events:<launchId>", s.place, { "<launchId>": LAUNCH }) !== undefined,
    );

    // Now the stop arrives beside them: the stop is the stop and not the first
    // request the reading happened to find.
    writeRequest({ place: s.place, type: "stop" });
    const second = firstBoundaryOfAnEngineStart({
      place: s.place,
      reader: "engine",
      launchId: LAUNCH,
    });
    assert.equal(second.stops, true);
    assert.equal(second.stop?.request.type, "stop");
    assert.equal(second.stop?.logicalName, "inbox:stop");
  } finally {
    s.dispose();
  }
});

test("CT-122-30: an empty stop request is valid and means a clean stop with every default", () => {
  const s = scratch("run-empty-stop");
  try {
    const written = writeEmptyStopRequest(s.place);
    // It carries no field at all, `schema` included (F100-FR-065).
    assert.equal(bytesOnDisk("inbox:stop", s.place), "");
    assert.equal(written.bytes, "");

    const validation = validateRequest({ text: "", expected: "stop", path: written.path });
    assert.equal(validation.ok, true);

    const first = firstBoundaryOfAnEngineStart({ place: s.place, reader: "engine" });
    assert.equal(first.stops, true);
    assert.equal(first.stopReason, BASELINE_STOP_REASON);
    const request = first.stop?.request;
    assert.equal(request?.type, "stop");
    assert.equal(request?.type === "stop" && request.empty, true);
    // Every default: a CLEAN stop, no job ended, asked for by the operator.
    assert.equal(request?.type === "stop" && request.now, false);
    assert.equal(request?.type === "stop" && request.jobs, false);
    assert.equal(request?.type === "stop" && request.causedBy, "operator");

    // An empty file at an entry that has a required field is NOT valid: only
    // the stop request may carry no field.
    const hold = inboxPathOf("hold-relaunch", s.place);
    writeFileSync(hold, "", { mode: 0o600 });
    const root = readInboxAtBoundary({ place: s.place, reader: "runtime-root" });
    assert.ok(
      root.ignored.some((i) => i.logicalName === "inbox:hold-relaunch" && i.reason === "malformed"),
      "an empty hold of a relaunch is ignored",
    );
  } finally {
    s.dispose();
  }
});

test("CT-122-30: the honoured request is removed, and only the one that was honoured", () => {
  const s = scratch("run-removal");
  try {
    // Three requests of three types, and two readers.
    writeRequest({ place: s.place, type: "stop" });
    writeRequest({ place: s.place, type: "hold-relaunch", fields: { hold: true } });
    const one = writeRequest({
      place: s.place,
      type: "host-event",
      launchId: LAUNCH,
      fields: { kind: "host-limit" },
    });
    writeRequest({
      place: s.place,
      type: "host-event",
      launchId: LAUNCH,
      fields: { kind: "host-window" },
    });

    // The runtime root honours the hold. The stop and the host events stay.
    const root = readInboxAtBoundary({ place: s.place, reader: "runtime-root", launchId: LAUNCH });
    const hold = root.requests.find((r) => r.request.type === "hold-relaunch");
    assert.equal(hold?.honour(), true);
    assert.equal(bytesOnDisk("inbox:hold-relaunch", s.place), undefined);
    assert.ok(bytesOnDisk("inbox:stop", s.place) !== undefined);

    // The engine honours the FIRST host event. The second one stays, whole.
    const engine = readInboxAtBoundary({ place: s.place, reader: "engine", launchId: LAUNCH });
    const events = engine.requests.filter((r) => r.request.type === "host-event");
    assert.equal(events.length, 2);
    assert.equal(events[0]?.honour(), true);
    const stream = bytesOnDisk("inbox:host-events:<launchId>", s.place, { "<launchId>": LAUNCH });
    assert.ok(stream !== undefined);
    const lines = (stream as string).split("\n").filter((l) => l.trim() !== "");
    assert.equal(lines.length, 1);
    assert.equal((JSON.parse(lines[0] as string) as { kind: string }).kind, "host-window");
    assert.equal((stream as string).includes("host-limit"), false);
    assert.equal(one.bytes.includes("host-limit"), true);

    // Honouring the last one removes the stream itself.
    const again = readInboxAtBoundary({ place: s.place, reader: "engine", launchId: LAUNCH });
    const last = again.requests.find((r) => r.request.type === "host-event");
    assert.equal(last?.honour(), true);
    assert.equal(
      bytesOnDisk("inbox:host-events:<launchId>", s.place, { "<launchId>": LAUNCH }),
      undefined,
    );

    // Honouring a request that is no longer there answers "there was none".
    assert.equal(honourRequest({ place: s.place, type: "hold-relaunch" }), false);
    assert.equal(honourRequest({ place: s.place, type: "stop" }), true);
    assert.equal(bytesOnDisk("inbox:stop", s.place), undefined);
  } finally {
    s.dispose();
  }
});
