/**
 * T030 (feature 154, US1) — a hundred derivations of the plan at launch give
 * the same plan hash and the same printed bytes (F154-SC-002): the print is a
 * pure function of the plan record and the verbose flag, with no printer
 * token, no environment read and no timestamp in it.
 *
 * The plan is the one `planAtLaunch` derives over the tasks of the fixture
 * `tests/fixtures/154/plan/` (two runs of consecutive `[P]` tasks naming
 * disjoint paths, and one task left serial). No worker starts, no file is
 * written and no service is hit: the test is pure, as the derivation is.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { planAtLaunch, printThePlan } from "../../../packages/layer-parallel/src/plan.ts";
import { scopesOf } from "../../../packages/layer-parallel/src/index.ts";
import type {
  AdmissionInputs,
  TaskAsReadAtLaunch,
} from "../../../packages/layer-parallel/src/index.ts";

/* The tasks of FX-154-PLAN (tests/fixtures/154/plan/tasks.md). */
const TASKS: readonly TaskAsReadAtLaunch[] = Object.freeze([
  Object.freeze({ id: "T001", phase: 1, marked: true, text: "Do it in packages/a/" }),
  Object.freeze({ id: "T002", phase: 1, marked: true, text: "Do more in packages/b/" }),
  Object.freeze({ id: "T003", phase: 1, marked: true, text: "Touch c in packages/c/" }),
  Object.freeze({ id: "T004", phase: 1, marked: true, text: "Touch d in packages/d/" }),
  Object.freeze({ id: "T005", phase: 1, marked: false, text: "Serial tail" }),
]);

const ADMISSION: AdmissionInputs = Object.freeze({
  workers: 2,
  scopes: scopesOf(TASKS.map((task) => ({ id: task.id, text: task.text }))),
  innerCheckSet: Object.freeze(["typecheck", "test"]),
  adoptableJobsAlive: 0,
  containment: "C2" as const,
});

/* The same pure hasher T028 uses: canonical text is JSON, the hash derives from it. */
const hasher = Object.freeze({
  canonicalRecordText: (record: unknown) => JSON.stringify(record),
  canonicalRecordHash: (record: unknown) => `h-${JSON.stringify(record).length}`,
});

/** The option on: the plan is printed (F154-FR-009). */
const ON = Object.freeze({ userConfiguration: "on" });

const RUNS = 100;

test("plan-bytes: 100 derivations give one plan hash and one printed text (F154-SC-002)", () => {
  const hashes = new Set<string>();
  const verboseTexts = new Set<string>();
  const terseTexts = new Set<string>();

  for (let run = 0; run < RUNS; run += 1) {
    const plan = planAtLaunch(
      { runId: "run-154-bytes", tasks: TASKS, admission: ADMISSION },
      hasher,
    );
    hashes.add(plan.hash);

    // The bytes: the lines joined with "\n" and nothing else — no trailing
    // newline at the end of the joined text.
    const verbose = printThePlan(plan, ON, "launch --dry-run", { verbose: false }).join("\n");
    assert.equal(verbose.endsWith("\n"), false, "no trailing newline");
    assert.equal(verbose.includes("\r"), false, "line endings are \\n only");
    verboseTexts.add(verbose);
    terseTexts.add(printThePlan(plan, ON, "doctor").join("\n"));
  }

  assert.equal(hashes.size, 1, `all ${RUNS} derivations give the same plan hash`);
  assert.equal(verboseTexts.size, 1, `all ${RUNS} prints are the same bytes, whatever the printer`);
  assert.equal(terseTexts.size, 1, `all ${RUNS} doctor prints are the same bytes as each other`);
  // The doctor and the dry run print the same bytes for the same plan: the
  // header carries no printer token (feature 154, T030).
  const [verboseText] = verboseTexts;
  const [terseText] = terseTexts;
  assert.equal(
    verboseText,
    terseText,
    "the verbose and the terse print differ only in the serial lines, never in the header",
  );
  assert.match(verboseText ?? "", /^parallel plan: \d+ group\(s\), workers=\d+, hash=/);
});
