/**
 * CT-141-146 — ends on the reference (T150, T161; F141-FR-013).
 *
 * > "For every scenario of FX-06, FX-07 and FX-17 to FX-20 that the catalogue
 * > gives an end, the capture of the reference shows that exit code and that
 * > stop reason. A capture that differs fails the capture job and names the
 * > scenario."
 *
 * What the test proves. The catalogue states each end as prose (`end`,
 * `stopReason`, `entryPoint`); the oracle reads a literal exit code and a
 * literal stop reason out of that prose (`statedExitCode`,
 * `stopReasonLiteral`), reads the end a capture shows off the normalized
 * surfaces (`endOfCapture`), and compares the two
 * (`endDifferencesFromCatalogue`) inside the capture job, where one
 * difference is a FAILURE that names the scenario — never a note.
 *
 * - **every scenario the catalogue gives an end**: the six families of
 *   `FAMILIES_WITH_AN_END_ON_THE_REFERENCE` are exactly FX-06, FX-07 and
 *   FX-17 to FX-20; every scenario of them the catalogue marks `knownBy: run`
 *   yields a literal exit code, and a stop reason wherever the prose names
 *   one; a scenario it marks `knownBy: read` — read out of the code, not run —
 *   is given NO end to compare against, and neither is any scenario of a
 *   family outside the six;
 * - **the capture shows that exit code and that stop reason**: the end of a
 *   capture is the exit code of its `exit` surface and the `reason` of the
 *   LAST `run_stop` event of its events surface — the reason of a pass-level
 *   event (why a pass was launched or killed) is not the run's stop reason,
 *   and a capture of a run that ended shows the run's own stop;
 * - **every committed capture of a stated end shows that end**: each fixture
 *   with a golden capture whose end the catalogue states is read back off
 *   disk and held against the stated end — the captures were made of fresh
 *   runs of the reference, so this is the criterion over everything that has
 *   been captured;
 * - **a capture that differs fails the capture job and names the scenario**:
 *   hermetically, a fresh capture whose end differs from the stated one on
 *   the exit code is reported `different` under the selector
 *   `endOnReference.exitCode`, one that differs on the stop reason under
 *   `endOnReference.stopReason`, and both carry the scenario's `FX-nn/<name>`
 *   — the job fails, its exit code is 1, and the lines it print name the
 *   scenario;
 * - **live**: the reference is driven again for one scenario whose end the
 *   catalogue states out of a run (`FX-07/phase-not-found`: the run starts on
 *   a spec with its phase, the proposer stub rewrites the spec without one,
 *   the critic finds no phase and exits 3, the engine stops with the reason
 *   `critic_config`), and its fresh capture is held against the stated end.
 *   Where no clone of the baseline is found this half is a SKIP WITH ITS
 *   REASON and never a pass.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  FAMILIES_WITH_AN_END_ON_THE_REFERENCE,
  families,
  scenarioNamesOf,
} from "../../src/catalogue/catalogue.ts";
import {
  catalogueEndOf,
  catalogueStatesAnEnd,
  endDifferencesFromCatalogue,
  endOfCapture,
  lastStopReason,
  stopReasonLiteral,
  statedExitCode,
} from "../../src/golden/ends.ts";
import {
  captureJob,
  captureJobLines,
  exitCodeOfCaptureJob,
  freshCaptureOfTheReference,
  isSkipped,
  type FreshCapture,
  type FreshCaptureOptions,
} from "../../src/golden/capture-job.ts";
import type { NormalizedCapture } from "../../src/normalize/index.ts";
import { readGoldenCapture, type GoldenCapture } from "../../src/golden/store.ts";
import { ORACLE_ROOT } from "../../src/index.ts";
import { cloneOf, pinOf, skipReasonFor } from "../reference-tree.ts";

const PACKAGE = resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
const clone = cloneOf("specstride");
const pin = pinOf("specstride");

/** The `endOnReference` row of one fixture, read the way the data layer holds it. */
function endOnReferenceOfFixture(fixtureId: string) {
  const [id, name] = [
    fixtureId.slice(0, fixtureId.indexOf("/")),
    fixtureId.slice(fixtureId.indexOf("/") + 1),
  ];
  return families()
    .find((f) => f.id === id)
    ?.scenarios.find((s) => s.name === name)?.endOnReference;
}

/** Every fixture id with a committed golden capture. */
function fixturesWithGoldens(): readonly string[] {
  const root = join(ORACLE_ROOT, "golden");
  const out: string[] = [];
  for (const family of readdirSync(root)) {
    if (!family.startsWith("FX-")) continue;
    for (const file of readdirSync(join(root, family))) {
      if (file.endsWith(".reference.json"))
        out.push(`${family}/${file.slice(0, -".reference.json".length)}`);
    }
  }
  return out;
}

/** A minimal normalized capture: an exit code and an events surface of run_stop records. */
function captureOf(
  fixtureId: string,
  exitCode: number,
  stopEvents: readonly (string | null)[],
): NormalizedCapture {
  const records = stopEvents.map((reason, index) => ({
    file: "events.jsonl",
    line: index + 1,
    raw: reason === null ? "{}" : JSON.stringify({ event: "run_stop", reason }),
    pairs:
      reason === null
        ? []
        : [
            { key: "event", value: "run_stop" },
            { key: "reason", value: reason },
          ],
  }));
  return {
    scenario: fixtureId,
    side: "reference" as const,
    suite: "first",
    layer: "off",
    surfaces: {
      exit: { exitCode },
      events: { files: ["events.jsonl"], byWriterClass: { orchestrator: records } },
    },
    missing: {},
    counts: {},
    findings: [],
  };
}

/** The end a committed golden capture shows. */
function endOfGolden(fixtureId: string) {
  const golden = readGoldenCapture(fixtureId);
  return endOfCapture({
    scenario: fixtureId,
    side: "reference",
    suite: "first",
    layer: "off",
    surfaces: golden.surfaces,
    missing: {},
    counts: golden.counts,
    findings: [],
  });
}

/** A fresh capture built from the committed one, with `change` applied. */
function freshFrom(
  fixture: string,
  change: (golden: GoldenCapture) => Partial<GoldenCapture> = () => ({}),
): FreshCapture {
  const golden = readGoldenCapture(fixture);
  const held = { ...golden, ...change(golden) };
  return {
    fixture,
    system: held.system,
    commit: held.commit,
    normalized: {
      scenario: fixture,
      side: "reference",
      suite: "first",
      layer: "off",
      surfaces: held.surfaces,
      missing: {},
      counts: held.counts,
      findings: [],
    },
  };
}

// ---------------------------------------------------------------------------
// 1. every scenario the catalogue gives an end
// ---------------------------------------------------------------------------

test("CT-141-146: the families with an end are FX-06, FX-07 and FX-17 to FX-20", () => {
  assert.deepEqual(
    [...FAMILIES_WITH_AN_END_ON_THE_REFERENCE],
    ["FX-06", "FX-07", "FX-17", "FX-18", "FX-19", "FX-20"],
  );
});

test("CT-141-146: every end the catalogue states on a run parses to a literal end", () => {
  let stated = 0;
  for (const id of FAMILIES_WITH_AN_END_ON_THE_REFERENCE) {
    for (const name of scenarioNamesOf(id)) {
      const fixtureId = `${id}/${name}`;
      const end = endOnReferenceOfFixture(fixtureId);
      if (end === undefined || end.knownBy !== "run") continue;
      stated += 1;
      const read = catalogueEndOf(fixtureId);
      assert.notEqual(read, undefined, `${fixtureId}: the stated end parses`);
      assert.equal(
        typeof read?.exitCode,
        "number",
        `${fixtureId}: an exit code out of "${end.end}"`,
      );
      assert.equal(
        read?.stopReason,
        stopReasonLiteral(end.stopReason),
        `${fixtureId}: the stop reason literal of "${end.stopReason}"`,
      );
      assert.ok(catalogueStatesAnEnd(fixtureId), `${fixtureId}: the catalogue states an end`);
      assert.equal(
        statedExitCode(end.end, end.entryPoint),
        read?.exitCode,
        `${fixtureId}: the exit of the entry point the scenario drives`,
      );
    }
  }
  assert.ok(stated >= 20, `${stated} ends stated on a run, not none`);
});

test("CT-141-146: an end known from reading the code is stated and compared the same way", () => {
  let readOnly = 0;
  let readWithAnEnd = 0;
  for (const id of FAMILIES_WITH_AN_END_ON_THE_REFERENCE) {
    for (const name of scenarioNamesOf(id)) {
      const fixtureId = `${id}/${name}`;
      const end = endOnReferenceOfFixture(fixtureId);
      if (end === undefined || end.knownBy !== "read") continue;
      readOnly += 1;
      // How the end was learned does not change what the catalogue states:
      // where the prose names an exit and a stop reason, the same literals,
      // and a capture is held against them the same way; where it names none
      // (the breaker does not fire), no end is given to compare against.
      const read = catalogueEndOf(fixtureId);
      if (read === undefined) continue;
      readWithAnEnd += 1;
      assert.equal(
        read.exitCode,
        statedExitCode(end.end, end.entryPoint),
        `${fixtureId}: the exit of the entry point the scenario drives`,
      );
      assert.ok(catalogueStatesAnEnd(fixtureId), `${fixtureId}: the catalogue states an end`);
    }
  }
  assert.ok(readOnly >= 5, `${readOnly} ends known only from reading the code`);
  assert.ok(readWithAnEnd >= 3, `${readWithAnEnd} of them state an end`);
});

test("CT-141-146: a scenario of a family outside the six is given no end", () => {
  for (const id of ["FX-28", "FX-30", "FX-32", "FX-38", "FX-40"]) {
    for (const name of scenarioNamesOf(id)) {
      assert.equal(
        catalogueStatesAnEnd(`${id}/${name}`),
        false,
        `${id}/${name}: its family states no ends`,
      );
    }
  }
});

// ---------------------------------------------------------------------------
// 2. the capture shows that exit code and that stop reason
// ---------------------------------------------------------------------------

test("CT-141-146: the end of a capture is the exit and the LAST run_stop reason", () => {
  const shown = endOfCapture(
    captureOf("FX-07/phase-not-found", 3, ["proposer_consecutive_errors", "critic_config"]),
  );
  assert.deepEqual(
    { exitCode: shown.exitCode, stopReason: shown.stopReason },
    { exitCode: 3, stopReason: "critic_config" },
  );
  // A run that wrote no run_stop ends with no stop reason.
  assert.equal(lastStopReason(captureOf("FX-07/critic-spec-missing", 3, [null])), null);
});

test("CT-141-146: the reason of a PASS-level event is not the run's stop reason", () => {
  // A run whose passes were killed for a launch failure still stops with the
  // breaker's own reason on its run_stop line.
  const withAPassReason = {
    ...captureOf("FX-18/harness-missing-prime", 4, ["proposer_consecutive_errors"]),
    surfaces: {
      exit: { exitCode: 4 },
      events: {
        files: ["events.jsonl"],
        byWriterClass: {
          orchestrator: [
            {
              file: "events.jsonl",
              line: 2,
              raw: JSON.stringify({
                event: "pass_end",
                reason: "Provider process could not be launched",
              }),
              pairs: [
                { key: "event", value: "pass_end" },
                { key: "reason", value: "Provider process could not be launched" },
              ],
            },
            {
              file: "events.jsonl",
              line: 3,
              raw: JSON.stringify({ event: "run_stop", reason: "proposer_consecutive_errors" }),
              pairs: [
                { key: "event", value: "run_stop" },
                { key: "reason", value: "proposer_consecutive_errors" },
              ],
            },
          ],
        },
      },
    },
  };
  assert.equal(lastStopReason(withAPassReason), "proposer_consecutive_errors");
});

test("CT-141-146: every committed capture of a stated end shows that end", () => {
  const withAnEnd = fixturesWithGoldens().filter((f) => catalogueStatesAnEnd(f));
  assert.ok(withAnEnd.length >= 30, `${withAnEnd.length} captures of stated ends`);
  for (const fixtureId of withAnEnd) {
    const shown = endOfGolden(fixtureId);
    const stated = catalogueEndOf(fixtureId);
    assert.notEqual(stated, undefined);
    assert.equal(shown.exitCode, stated?.exitCode, `${fixtureId}: exit code`);
    assert.equal(shown.stopReason, stated?.stopReason, `${fixtureId}: stop reason`);
  }
});

// ---------------------------------------------------------------------------
// 3. a capture that differs fails the capture job and names the scenario
// ---------------------------------------------------------------------------

test("CT-141-146: a capture whose EXIT differs fails the job and names the scenario", () => {
  const fixtureId = fixturesWithGoldens().find((f) => catalogueStatesAnEnd(f));
  assert.notEqual(fixtureId, undefined);
  const stated = catalogueEndOf(fixtureId as string);
  assert.notEqual(stated, undefined);
  const other = stated?.exitCode === 0 ? 1 : 0;
  const report = captureJob({
    fixtures: [fixtureId as string],
    captureFresh: (held) =>
      freshFrom(held, (golden) => ({
        surfaces: { ...golden.surfaces, exit: { exitCode: other } },
      })),
  });
  assert.equal(report.passed, false, "a different end fails the job");
  assert.deepEqual([...report.failed], [fixtureId]);
  const difference = report.entries[0]?.differences.find(
    (d) => d.selector === "endOnReference.exitCode",
  );
  assert.notEqual(difference, undefined, "the difference names the end");
  assert.equal(difference?.fixture, fixtureId);
  assert.equal(difference?.surface, "exit");
  assert.equal(difference?.reference, String(stated?.exitCode));
  assert.equal(difference?.port, String(other));
  assert.match(captureJobLines(report).join("\n"), new RegExp(fixtureId!.replace("/", "/")));
  assert.equal(exitCodeOfCaptureJob(report), 1);
});

test("CT-141-146: a capture whose STOP REASON differs fails the job on the events surface", () => {
  const fixtureId = fixturesWithGoldens().find(
    (f) => catalogueStatesAnEnd(f) && catalogueEndOf(f)?.stopReason !== null,
  );
  assert.notEqual(fixtureId, undefined, "a stated end with a stop reason");
  const stated = catalogueEndOf(fixtureId as string);
  const report = captureJob({
    fixtures: [fixtureId as string],
    captureFresh: (held) =>
      freshFrom(held, (golden) => {
        const events = golden.surfaces["events"] as {
          byWriterClass?: Record<string, unknown>;
        };
        const rewritten = JSON.parse(JSON.stringify(events ?? {})) as {
          byWriterClass?: Record<string, unknown>;
        };
        for (const writer of Object.values(rewritten.byWriterClass ?? {})) {
          for (const record of Array.isArray(writer) ? (writer as Record<string, unknown>[]) : []) {
            const pairs = (record["pairs"] as { key: string; value: string }[] | undefined) ?? [];
            if (!pairs.some((p) => p.key === "event" && p.value === "run_stop")) continue;
            for (const pair of pairs) {
              if (pair.key === "reason") pair.value = `not-${stated?.stopReason}`;
            }
          }
        }
        return { surfaces: { ...golden.surfaces, events: rewritten } };
      }),
  });
  assert.equal(report.passed, false);
  const difference = report.entries[0]?.differences.find(
    (d) => d.selector === "endOnReference.stopReason",
  );
  assert.notEqual(difference, undefined);
  assert.equal(difference?.fixture, fixtureId);
  assert.equal(difference?.surface, "events");
  assert.equal(difference?.reference, stated?.stopReason);
});

test("CT-141-146: a capture that AGREES with the stated end passes the job", () => {
  const fixtureId = fixturesWithGoldens().find((f) => catalogueStatesAnEnd(f));
  assert.notEqual(fixtureId, undefined);
  const report = captureJob({
    fixtures: [fixtureId as string],
    captureFresh: (held) => freshFrom(held),
  });
  assert.equal(report.passed, true, captureJobLines(report).join("\n"));
  assert.ok(report.entries[0]?.differences.every((d) => !d.selector.startsWith("endOnReference.")));
});

// ---------------------------------------------------------------------------
// 4. live: one stated end, held against a fresh capture of the reference
// ---------------------------------------------------------------------------

test(
  "CT-141-146: live — FX-07/phase-not-found ends as the catalogue states",
  { skip: clone === undefined ? skipReasonFor("specstride") : false },
  () => {
    const fixtureId = "FX-07/phase-not-found";
    const stated = catalogueEndOf(fixtureId);
    assert.notEqual(stated, undefined, "the catalogue states the end of the scenario");
    const runRoot = mkdtempSync(join(tmpdir(), "fx07-end-"));
    const fresh = freshCaptureOfTheReference({
      fixture: fixtureId,
      fixtureDir: join(PACKAGE, "fixtures", fixtureId),
      declaration: JSON.parse(
        readFileSync(join(PACKAGE, "fixtures", fixtureId, "fixture.json"), "utf8"),
      ) as FreshCaptureOptions["declaration"],
      system: "specstride",
      commit: pin.commit,
      referenceRoot: clone,
      runRoot,
      criticStubAddress: "http://127.0.0.1:39999",
    });
    if (isSkipped(fresh)) assert.fail(fresh.skipped);
    const differences = endDifferencesFromCatalogue(fixtureId, fresh.normalized);
    assert.deepEqual(
      differences.map((d) => `${d.fixture} ${d.selector}: ${d.reference} != ${d.port}`),
      [],
      "the fresh capture of the reference ends as the catalogue states",
    );
  },
);
