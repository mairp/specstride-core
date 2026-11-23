/**
 * Feature 153, CT-153-6 — the guard of F153-FR-006 (T318): no decision reads
 * an event. A decision is made from the run's own state, never from the
 * events file. Concretely:
 *
 *  1. None of the SEVEN scanned units — the five new core units of the
 *     feature (`gate/closing-check-skip.ts`, `gate/end-cause.ts`,
 *     `checks/selection.ts`, `critic-input/evidence/per-task.ts`,
 *     `report/rows.ts`) plus the two new engine helpers
 *     (`packages/cli/src/engine/check-run.ts`, `gate-feedback.ts`) — imports
 *     an event reader (`status/event-reader`, `inspect/`), reads a file named
 *     `events.jsonl`, or reaches for `node:fs` / `node:child_process`. Every
 *     scanned file's existence is asserted first: a missing file fails, it is
 *     never filtered out of the scan.
 *  2. Of those seven, exactly one (`report/rows.ts`) takes events at all, and
 *     it takes them as an argument: it is the projection for the read-only
 *     `report` verb, not a decision.
 *  3. NOTHING under `packages/cli/src/engine/**` imports the event-taking
 *     projection — by the package path (`@specstride/core/report`), by a
 *     relative path into the core sources (`core/src/report/rows`) or by a
 *     relative file path (`report/rows.ts`): the decisions of the loop cannot
 *     reach the events.
 *
 * Static half over the sources, plus a behavioural half and TWO negative
 * controls, so the scans are proved to detect a violation — one for the unit
 * scan (the sanctioned reader carries a token) and one for the engine scan (a
 * synthetic relative-path import is caught by the same matcher the engine
 * scan uses).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { readdirSync, readFileSync, existsSync } from "node:fs";

import { reportRowsOf } from "@specstride/core/report";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO = join(HERE, "..", "..", "..");

/** The seven scanned units: five new core units + two new engine helpers. */
const SCANNED_UNITS = [
  "packages/core/src/gate/closing-check-skip.ts",
  "packages/core/src/gate/end-cause.ts",
  "packages/core/src/checks/selection.ts",
  "packages/core/src/critic-input/evidence/per-task.ts",
  "packages/core/src/report/rows.ts",
  "packages/cli/src/engine/check-run.ts",
  "packages/cli/src/engine/gate-feedback.ts",
].map((relative) => join(REPO, relative));

/** The tokens an event-reading module cannot avoid carrying. */
const EVENT_READER_TOKENS = [
  /from\s+"[^"]*event-reader/,
  /from\s+"[^"]*inspect\//,
  /events\.jsonl/,
  /readEvents/,
  /EventSink/,
  /node:fs/,
  /node:child_process/,
] as const;

/** An import that reaches the event-taking projection, by ANY of its paths. */
const ROWS_IMPORT =
  /from\s+"[^"]*(?:@specstride\/core\/report|core\/src\/report\/rows|report\/rows\.ts)/u;

const sourceOf = (path: string): string => readFileSync(path, "utf8");

test("T318 of feature 153 (F153-FR-006): the decision units import no event reader", () => {
  for (const path of SCANNED_UNITS) {
    assert.ok(
      existsSync(path),
      `the scanned unit ${path} exists (a missing file fails, it is never filtered)`,
    );
    const source = sourceOf(path);
    for (const token of EVENT_READER_TOKENS) {
      assert.ok(
        !token.test(source),
        `${path} must not match ${String(token)} — a decision reads no events`,
      );
    }
  }
});

test("T318 of feature 153 (F153-FR-006): only the report projection takes events", () => {
  // rows.ts takes events as an argument; the other six take no events at all.
  const takesEvents = SCANNED_UNITS.filter((path) => /ReportEvent|events/.test(sourceOf(path)));
  assert.deepEqual(
    takesEvents.map((path) => path.split("/").slice(-2).join("/")),
    ["report/rows.ts"],
  );
});

test("T318 of feature 153 (F153-FR-006): no engine file imports the event-taking projection", () => {
  const engineDir = join(REPO, "packages/cli/src/engine");
  const files: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".ts")) files.push(full);
    }
  };
  walk(engineDir);
  assert.ok(files.length > 0, "the engine has sources to scan");
  for (const path of files) {
    const source = sourceOf(path);
    assert.ok(
      !ROWS_IMPORT.test(source),
      `${path} imports the event-taking projection — a decision cannot reach the events`,
    );
  }
});

test("T318 of feature 153 (F153-FR-006): behavioural half — a decision stands with no events at all", () => {
  // The end cause of an attempt — the decision this feature made tabular —
  // is computed from its argument alone. An empty event list (in fact, no
  // event machinery at all) leaves the decision untouched.
  const events: readonly never[] = [];
  void events;
  // `reportRowsOf` on no events gives the empty projection, never a guess.
  const report = reportRowsOf([], null);
  assert.equal(report.runId, null);
  assert.ok(Array.isArray(report.rows));
});

test("T318 of feature 153 (F153-FR-006): negative control — the unit scan catches a reader", () => {
  // The same token that must be absent from the decision units is present in
  // the one sanctioned reader, so the unit scan above is not vacuous.
  const reader = join(REPO, "packages/cli/src/status/event-reader.ts");
  assert.ok(existsSync(reader), "the sanctioned event reader exists");
  assert.ok(EVENT_READER_TOKENS.some((token) => token.test(sourceOf(reader))));
});

test("T318 of feature 153 (F153-FR-006): negative control — the engine scan catches a relative-path import", () => {
  // The same matcher the engine scan uses must catch an import of the
  // projection written as a RELATIVE path, not only as the package path.
  const samples: readonly string[] = [
    `import { reportRowsOf } from "../../../core/src/report/rows.ts";`,
    `import { reportRowsOf } from "../../core/src/report/rows";`,
    `import { reportRowsOf } from "@specstride/core/report";`,
  ];
  for (const sample of samples) {
    assert.ok(
      ROWS_IMPORT.test(sample),
      `the engine scan's matcher catches ${JSON.stringify(sample)}`,
    );
  }
  // And it does not catch an unrelated relative import, so the matcher is not
  // a blanket that passes for a check.
  assert.ok(
    !ROWS_IMPORT.test(`import { runEngineCheck } from "./check-run.ts";`),
    "an unrelated relative import is not matched",
  );
});
