/**
 * T015 — the `parity` profile run over `tests/fixtures/154/groups/` is
 * byte-identical to the baseline recorded with the feature absent
 * (F154-FR-001, F154-SC-012). The baseline is the recorded run of the same
 * fixture under the same `parity` profile on `main` @ `aafb367f` — the commit
 * the feature branch carries before any behaviour of spec 154 is wired —
 * stored as the raw lines of its `events.jsonl` in
 * `tests/fixtures/154/parity-baseline/events-00.json` and described in
 * `tests/fixtures/154/parity-baseline/README.md`. The run's `events.jsonl`
 * must hold the same bytes, after the run-varying fields are normalised by
 * `normalise` — the one normalisation both sides go through; no event is
 * dropped and no event type is filtered.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

import { fixture154, forbiddenTypes, slotAndHoldFiles } from "./helpers.ts";

const BASELINE_FILE = join(import.meta.dirname, "../../fixtures/154/parity-baseline/events-00.json");

/** The baseline event file: the raw `events.jsonl` lines of the recorded run. */
const BASELINE: { readonly lines: readonly string[] } = JSON.parse(readFileSync(BASELINE_FILE, "utf8"));

/**
 * The run-varying fields of an `events.jsonl` line, each replaced by a fixed
 * token. Verified run-varying by recording the baseline twice on `aafb367f`
 * and diffing: `at` (wall-clock timestamps), `manifestHashes` (content hash
 * of the run's manifest, keyed on the temporary paths of the run), `checkId`
 * (the content hash of `CMD-<hash>`), `durationMs`, `latencyMs`, `planRef`
 * (its content hash and the temporary paths and run id it carries), the
 * temporary root `/tmp/specstride-inert-154-<suffix>` and the run id
 * `<YYYYMMDD>-<HHMMSS>-<pid>` (the as-is form B-0500; the last segment is the
 * PID, whose digit count varies with the host, so one to seven digits fold)
 * inside the paths of `run.started`, `verification.*` and `verdict.recorded`.
 * Nothing else varies.
 */
export function normalise(text: string): string {
  return text
    .replace(/"at":"[^"]*"/g, '"at":"@at"')
    .replace(/"manifestHashes":\[[^\]]*\]/g, '"manifestHashes":["@manifest"]')
    .replace(/CMD-[0-9a-f]{20}/g, "CMD-@id")
    .replace(/"durationMs":\d+/g, '"durationMs":@ms')
    .replace(/"latencyMs":\d+/g, '"latencyMs":@ms')
    .replace(/verification-[0-9a-f]{20}/g, "verification-@ref")
    .replace(/\/tmp\/specstride-inert-154-[A-Za-z0-9_]+/g, "@root")
    .replace(/\d{8}-\d{6}-\d{1,7}/g, "@run");
}

/** Every `events.jsonl` the run wrote under its user-state root, in path order. */
function eventFiles(home: string): readonly string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name === "events.jsonl") out.push(readFileSync(path, "utf8"));
    }
  };
  walk(home);
  return out;
}

test("T015 under `parity` the run's event file is byte-identical to the feature-absent baseline", async () => {
  const f = fixture154();
  try {
    process.env.SPECSTRIDE_PROFILE = "parity";
    const exit = await f.run();
    assert.equal(exit, 0);
    const files = eventFiles(f.home);
    assert.equal(files.length, 1, "the fixture run writes exactly one events.jsonl");
    // Byte-identical after the one normalisation: the same events, in the
    // same order, down to the same bytes. No event type is folded out — a
    // divergence in any type (including a type of spec 154) fails here.
    assert.equal(
      normalise(files[0]!),
      normalise(BASELINE.lines.join("\n") + "\n"),
      "the parity run's events.jsonl has the baseline's exact bytes",
    );
    assert.deepEqual(forbiddenTypes(f.eventTypes()), []);
    assert.deepEqual(slotAndHoldFiles(f.home), []);
  } finally {
    f.restore();
  }
});
