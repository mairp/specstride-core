/**
 * T028 of feature 149 — CONFORMANCE TEST CT-149-10 (F149-FR-010; criterion
 * F149-SC-004).
 *
 * The suite of
 * `specs/149-attempt-planner-and-seams/contracts/ep18-seams.md` is run on
 *
 *  - the sample critic strategy, which makes two calls
 *    (`../../samples/EP-18/sample-critic-strategy.ts`);
 *  - the sample attempt planner, in both forms the seam takes
 *    (`../../samples/EP-18/sample-attempt-planner.ts`);
 *  - both planners of Wave 1, `recovery` and `tier-bump`;
 *  - and, for good measure, the critic strategy of Wave 1, `single`.
 *
 * Then the two facts about the samples themselves: the build with and without
 * `packages/testkit/src/samples/` differs in no core file, and the build fails
 * when a core file names a sample. Both are observed on a scratch copy of the
 * workspace, never on the working tree (`./samples-outside-the-core.ts`).
 *
 * Fixtures: FX-01 and FX-02, port side only — the stubs of the harness port, no
 * reference tree and no paid call. The stub critic of the suite is
 * `stubCritic()` of `./seams.ts`; nothing here starts a process of a harness.
 *
 * The suite runs THROUGH THE FRAME of the test kit: every subject is offered to
 * `registryOf("EP-18")` and run by `runSuite` of `../run.ts`, so each report
 * names the point, the implementation, the class and the major and carries the
 * standing `internal-seam`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ATTEMPT_PLANNER_ID, CRITIC_STRATEGY_ID } from "@specstride/contracts/ep/critic-strategy";
import {
  SINGLE_CRITIC_STRATEGY_ID,
  CALLS_OF_THE_SINGLE_STRATEGY,
  singleCriticStrategy,
} from "../../../../core/src/ep18/critic-strategy.ts";
import {
  RECOVERY_PLANNER_ID,
  TIER_BUMP_PLANNER_ID,
  PLANNER_ORDER,
} from "../../../../core/src/ep18/attempt-planner.ts";
import { recoveryCyclePlanner } from "../../../../core/src/ep18/planner-recovery.ts";
import { tierBumpPlanner } from "../../../../core/src/ep18/planner-tier-bump.ts";
import {
  CALLS_OF_THE_SAMPLE_STRATEGY,
  SAMPLE_CRITIC_STRATEGY_ID,
  implementation as sampleStrategyImplementation,
  sampleCriticStrategy,
} from "../../samples/EP-18/sample-critic-strategy.ts";
import {
  SAMPLE_ATTEMPT_PLANNER_ID,
  SAMPLE_NEXT_ONLY_PLANNER_ID,
  implementation as samplePlannerImplementation,
  nextOnlyImplementation as sampleNextOnlyImplementation,
  sampleAttemptPlanner,
  sampleNextOnlyPlanner,
} from "../../samples/EP-18/sample-attempt-planner.ts";
import { ROOT, registryOf } from "../frame.ts";
import {
  CONTRACT_FILE,
  EP,
  SEAM_SUITE_ROWS,
  runSeamSuite,
  seamSuite,
  type PlannerSubject,
  type SeamSubjects,
  type StrategySubject,
} from "./seams.ts";

/* ==================================================================== *
 * The subjects T028 names.
 * ==================================================================== */

/** The sample strategy, and the strategy of Wave 1 beside it. */
const STRATEGIES: readonly StrategySubject[] = Object.freeze([
  Object.freeze({
    id: SAMPLE_CRITIC_STRATEGY_ID,
    strategy: sampleCriticStrategy,
    calls: CALLS_OF_THE_SAMPLE_STRATEGY,
  }),
  Object.freeze({
    id: SINGLE_CRITIC_STRATEGY_ID,
    strategy: singleCriticStrategy,
    calls: CALLS_OF_THE_SINGLE_STRATEGY,
  }),
]);

/** The two sample planners, and both planners of Wave 1. */
const PLANNERS: readonly PlannerSubject[] = Object.freeze([
  Object.freeze({ id: SAMPLE_ATTEMPT_PLANNER_ID, planner: sampleAttemptPlanner }),
  Object.freeze({ id: SAMPLE_NEXT_ONLY_PLANNER_ID, planner: sampleNextOnlyPlanner }),
  Object.freeze({ id: RECOVERY_PLANNER_ID, planner: recoveryCyclePlanner, waveOne: true }),
  Object.freeze({ id: TIER_BUMP_PLANNER_ID, planner: tierBumpPlanner, waveOne: true }),
]);

const SUBJECTS: SeamSubjects = Object.freeze({ strategies: STRATEGIES, planners: PLANNERS });

/* ==================================================================== *
 * 1 — the suite of the contract file, run through the frame.
 * ==================================================================== */

const reports = await runSeamSuite(SUBJECTS);

for (const one of reports) {
  for (const report of one.report.cases) {
    test(`CT-149-10: ${one.subjectId} — ${report.caseId}: ${report.title}`, () => {
      assert.equal(report.passed, true, report.message ?? "the case failed");
    });
  }
}

test("CT-149-10: every subject T028 names was run, and every report names the point, the implementation, the class, the major and the standing", () => {
  const ran = reports.map((r) => r.subjectId);
  for (const id of [
    SAMPLE_CRITIC_STRATEGY_ID,
    SAMPLE_ATTEMPT_PLANNER_ID,
    SAMPLE_NEXT_ONLY_PLANNER_ID,
    RECOVERY_PLANNER_ID,
    TIER_BUMP_PLANNER_ID,
    SINGLE_CRITIC_STRATEGY_ID,
  ]) {
    assert.ok(ran.includes(id), `the suite did not run on \`${id}\``);
  }
  // Both planners of Wave 1, in the order of the seam.
  assert.deepEqual([...PLANNER_ORDER], [RECOVERY_PLANNER_ID, TIER_BUMP_PLANNER_ID]);
  for (const one of reports) {
    assert.equal(one.report.ep, EP);
    assert.equal(one.report.pointId, one.pointId);
    assert.equal(one.report.implementationId, one.subjectId);
    assert.equal(one.report.implementationClass, "first-party");
    assert.equal(one.report.major, 1);
    assert.equal(one.report.standing, "internal-seam");
    assert.equal(one.report.internalSeam, true);
    assert.equal(one.report.passed, true);
    assert.ok(one.report.cases.length > 0, `the suite ran no case on \`${one.subjectId}\``);
  }
});

test("CT-149-10: the suite is registered in the frame of the test kit: both point ids of EP-18 are in one registry, every subject is an accepted implementation of it, and the standing is `internal-seam`", () => {
  const registry = registryOf(EP);
  assert.equal(registry.ep, EP);
  assert.deepEqual([...registry.pointIds], [CRITIC_STRATEGY_ID, ATTEMPT_PLANNER_ID]);
  assert.deepEqual([...registry.operations], ["judge", "next"]);
  assert.equal(registry.standing, "internal-seam");
  const accepted = registry.resolved();
  for (const one of reports) {
    const record = accepted.find((r) => r.implementationId === one.subjectId);
    assert.ok(record !== undefined, `\`${one.subjectId}\` is in no registry of the frame`);
    assert.equal(record.pointId, one.pointId);
    assert.equal(record.standing, "internal-seam");
    assert.equal(record.provenance, "default");
  }
  // The samples offer the frame their own implementation records too, which is
  // how `registerSamples()` of the frame picks a sample up (F100-FR-018).
  for (const implementation of [
    sampleStrategyImplementation,
    samplePlannerImplementation,
    sampleNextOnlyImplementation,
  ]) {
    assert.equal(implementation.ep, EP);
    assert.ok(registry.pointIds.includes(implementation.pointId));
    assert.equal(implementation.implementationClass, "first-party");
    assert.deepEqual([...implementation.majors], [1]);
  }
});

test("CT-149-10: the test kit's `exports` names the suite and the samples of EP-18, so the frame and an author reach them by package path", () => {
  const manifest = JSON.parse(
    readFileSync(join(ROOT, "packages/testkit/package.json"), "utf8"),
  ) as { exports?: Record<string, string> };
  const exports = manifest.exports ?? {};
  for (const [subpath, target] of [
    ["./conformance/EP-18/seams", "./src/conformance/EP-18/seams.ts"],
    ["./samples/EP-18/critic-strategy", "./src/samples/EP-18/sample-critic-strategy.ts"],
    ["./samples/EP-18/attempt-planner", "./src/samples/EP-18/sample-attempt-planner.ts"],
  ] as const) {
    assert.equal(exports[subpath], target, `the test kit does not export \`${subpath}\``);
    assert.equal(
      existsSync(join(ROOT, "packages/testkit", target)),
      true,
      `the export \`${subpath}\` names a file that is not there`,
    );
  }
});

/* ==================================================================== *
 * 2 — the suite is the suite of the contract file, row for row.
 * ==================================================================== */

/** The rows of a markdown table of a section of the contract file. */
function tableRowsOf(text: string, heading: string): readonly (readonly string[])[] {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start < 0) return Object.freeze([]);
  const out: string[][] = [];
  for (const line of lines.slice(start + 1)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) break;
    if (!trimmed.startsWith("|")) continue;
    const cells = trimmed
      .slice(1, trimmed.endsWith("|") ? -1 : undefined)
      .split("|")
      .map((cell) => cell.trim());
    if (cells.every((cell) => /^-+$/.test(cell))) continue;
    out.push(cells);
  }
  return Object.freeze(out.map((cells) => Object.freeze(cells)));
}

test('CT-149-10: every row of the table "Conformance suite" of the contract file has a case of the suite, and the suite has no case without a row', () => {
  const file = join(ROOT, CONTRACT_FILE);
  if (!existsSync(file)) {
    assert.fail(
      `the contract file ${CONTRACT_FILE} is not in this tree, so the suite cannot be ` +
        `checked against it; this is a skip with its reason and never a pass`,
    );
  }
  const rows = tableRowsOf(readFileSync(file, "utf8"), "Conformance suite");
  assert.ok(rows.length > 1, `${CONTRACT_FILE} holds no table under "Conformance suite"`);
  const [header, ...body] = rows;
  assert.deepEqual([...header], ["Case", "Asserts"]);
  assert.equal(
    body.length,
    SEAM_SUITE_ROWS.length,
    `${CONTRACT_FILE} holds ${String(body.length)} rows and the suite declares ` +
      `${String(SEAM_SUITE_ROWS.length)}`,
  );
  body.forEach((cells, index) => {
    const declared = SEAM_SUITE_ROWS[index];
    assert.ok(declared !== undefined);
    assert.equal(cells[0], declared.case, `row ${String(index + 1)}: the "Case" cell differs`);
    assert.equal(
      cells[1],
      declared.asserts,
      `row ${String(index + 1)}: the "Asserts" cell differs`,
    );
  });

  // Every row has a case of the suite, and every case belongs to a row.
  const cases = seamSuite(SUBJECTS);
  const caseIds = new Set(cases.map((one) => one.id));
  for (const row of SEAM_SUITE_ROWS) {
    assert.ok(caseIds.has(row.caseId), `the row "${row.case}" has no case of the suite`);
  }
  for (const id of caseIds) {
    assert.ok(
      SEAM_SUITE_ROWS.some((row) => row.caseId === id),
      `the case \`${id}\` covers no row of ${CONTRACT_FILE}`,
    );
  }
  // And every case of the suite is a behaviour case of the content owner, in
  // the folder of the point (annex A §A.4).
  for (const one of cases) {
    assert.equal(one.level, "behaviour", `the case \`${one.id}\` is not a behaviour case`);
    assert.ok(one.proves.includes("F149-FR-010"), `the case \`${one.id}\` proves no requirement`);
  }
});

test("CT-149-10: the suite covers both seams and runs the nine rows on the subjects, with the samples row exactly once", () => {
  const cases = seamSuite(SUBJECTS);
  const byId = new Map<string, number>();
  for (const one of cases) byId.set(one.id, (byId.get(one.id) ?? 0) + 1);
  // Five rows per strategy subject, two per planner subject.
  for (const row of SEAM_SUITE_ROWS.filter((r) => r.seam === "critic-strategy")) {
    assert.equal(byId.get(row.caseId), STRATEGIES.length, row.case);
  }
  for (const row of SEAM_SUITE_ROWS.filter(
    (r) => r.seam === "attempt-planner" && r.caseId !== "EP-18/seams/both-planners-of-wave-1",
  )) {
    assert.equal(byId.get(row.caseId), PLANNERS.length, row.case);
  }
  assert.equal(byId.get("EP-18/seams/both-planners-of-wave-1"), 1);
  // The samples row is run ONCE: it builds the core packages twice and is the
  // one expensive case of the suite.
  assert.equal(byId.get("EP-18/seams/samples-outside-the-core"), 1);
});
