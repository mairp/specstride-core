/**
 * T106 (feature 154, US4) — THE PAUSE CLASS IN `status` (F154-FR-045).
 *
 * A `paused-quota` whose pause record names the class feature 154 proposes
 * (`host_slot`, `host.limits` on) prints as `paused-quota (host_slot)`:
 * - through the pure seam of `runStatus` (`displayWithPauseClass`);
 * - through the REAL `specstride status` executable over a seeded control
 *   plane (`SPECSTRIDE_STATE_DIR`).
 *
 * And the GUARD: a quota pause of the closed set (class `quota_window`,
 * feature 127's) and a pause record with no class at all print
 * `paused-quota` exactly as before — the compatibility output of F129-FR-011
 * holds byte for byte for every pause that came before this one.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const BIN = join(import.meta.dirname, "..", "..", "bin", "specstride");
const SLUG = "154-concurrency-and-parallelism";
const RUN = "run-hold-class";

type Place = { readonly root: string; readonly control: string; readonly restore: () => void };

/** A workspace whose control plane holds one paused run and its pause record. */
function seededWorkspace(pauseRecord: Record<string, unknown>): Place {
  const root = mkdtempSync(join(tmpdir(), "specstride-status-pause-"));
  spawnSync("git", ["init", "-q", root]);
  const control = join(root, ".specstride");
  const runDir = join(control, "features", SLUG, "runs", RUN);
  mkdirSync(runDir, { recursive: true });
  writeFileSync(
    join(runDir, "run.json"),
    JSON.stringify({
      schema: "specstride.run-state/1",
      runId: RUN,
      feature: SLUG,
      state: "paused-quota",
      stateSince: "2026-11-26T10:00:00.000Z",
      transition: "T6",
    }),
  );
  writeFileSync(join(runDir, "pause.record"), JSON.stringify(pauseRecord));
  writeFileSync(join(control, "current.json"), JSON.stringify({ runId: RUN, feature: SLUG }));
  // A lock the probe cannot judge (no required field): the liveness reads
  // `unknown` and the run is not `dead`, so the display is the state itself.
  mkdirSync(join(control, "lock"), { recursive: true });
  writeFileSync(join(control, "lock", "owner.json"), JSON.stringify({ pid: 99999999 }));
  return {
    root,
    control,
    restore: (): void => rmSync(root, { recursive: true, force: true }),
  };
}

function runStatus(
  place: Place,
  args: readonly string[] = [],
): { code: number | null; out: string } {
  const r = spawnSync(process.execPath, [BIN, "status", ...args], {
    cwd: place.root,
    encoding: "utf8",
    env: process.env,
    timeout: 30_000,
  });
  return { code: r.status, out: r.stdout };
}

/** One line of the pause record of annex B §B.17, class as given. */
function pauseRecordOf(aClass: string | null): Record<string, unknown> {
  return {
    schema: "specstride.pause/1",
    runId: RUN,
    attemptId: "attempt:1:1:1",
    role: "proposer",
    harness: "claude",
    ...(aClass === null ? {} : { class: aClass }),
    confidence: "host",
    since: "2026-11-26T10:00:00.000Z",
    resetsAt: null,
    resumeAt: null,
    probeIndex: 0,
    ceilingAt: "2026-11-27T10:00:00.000Z",
  };
}

test("a host_slot pause prints as paused-quota (host_slot) through the pure seam", async () => {
  const { displayWithPauseClass } = await import("../../src/status/status.ts");
  assert.equal(
    displayWithPauseClass("paused-quota", pauseRecordOf("host_slot")),
    "paused-quota (host_slot)",
  );
  // Everything else stays exactly as it was printed.
  assert.equal(displayWithPauseClass("running", pauseRecordOf("host_slot")), "running");
});

test("a quota_window pause and a classless pause print paused-quota as before", async () => {
  const { displayWithPauseClass } = await import("../../src/status/status.ts");
  // The pauses feature 127 wrote keep their compatibility output.
  assert.equal(
    displayWithPauseClass("paused-quota", pauseRecordOf("quota_window")),
    "paused-quota",
  );
  assert.equal(
    displayWithPauseClass("paused-quota", pauseRecordOf("provider_other")),
    "paused-quota",
  );
  assert.equal(displayWithPauseClass("paused-quota", pauseRecordOf(null)), "paused-quota");
  assert.equal(displayWithPauseClass("paused-quota", null), "paused-quota");
});

test("specstride status prints `state: paused-quota (host_slot)` over a seeded control plane", () => {
  const place = seededWorkspace(pauseRecordOf("host_slot"));
  try {
    const r = runStatus(place);
    assert.equal(r.code, 0, `status exited ${String(r.code)}`);
    assert.ok(
      r.out.includes("st=paused-quota (host_slot)"),
      `no pause class in the output:\n${r.out}`,
    );
    assert.ok(r.out.includes(`run=${RUN}`), `no run line in the output:\n${r.out}`);
  } finally {
    place.restore();
  }
});

test("specstride status keeps `state: paused-quota` for a quota_window pause", () => {
  const place = seededWorkspace(pauseRecordOf("quota_window"));
  try {
    const r = runStatus(place);
    assert.equal(r.code, 0, `status exited ${String(r.code)}`);
    assert.ok(r.out.includes("st=paused-quota "), `the state line changed:\n${r.out}`);
    assert.ok(
      !r.out.includes("host_slot"),
      `the class leaked into a quota_window pause's output:\n${r.out}`,
    );
  } finally {
    place.restore();
  }
});

test("specstride status keeps `state: paused-quota` when the record names no class", () => {
  const place = seededWorkspace(pauseRecordOf(null));
  try {
    const r = runStatus(place);
    assert.equal(r.code, 0, `status exited ${String(r.code)}`);
    assert.ok(r.out.includes("st=paused-quota "), `the state line changed:\n${r.out}`);
    assert.ok(!r.out.includes("host_slot"), `a classless pause printed a class:\n${r.out}`);
  } finally {
    place.restore();
  }
});
