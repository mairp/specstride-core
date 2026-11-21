/**
 * T315 of feature 153 — the guard: only APPROVED grants.
 *
 * Two halves, one case.
 *
 * 1. The static half: none of the new files of the "Path Conventions" section
 *    of `specs/153-loop-feedback-speed/tasks.md` imports from
 *    `packages/core/src/approval/` (the signed approval record, its key and
 *    its verification — F101-FR-029..031) and none writes a record whose
 *    schema is the approval record's (`specstride.approval/1`, annex B
 *    §B.14). The approval record is the ENGINE's grant, written by
 *    `approval/record.ts` alone after the verdict of the critic; a loop-speed
 *    unit that could write one, or could grant one by importing the group,
 *    would break F101-FR-029 ("only the engine writes an approval record")
 *    and F101-FR-008 (the verdict comes from the reply of a critic call and
 *    from nothing else). The files the phases have not written yet are
 *    skipped, as every guard of the feature does: a file cannot violate the
 *    guard before it exists, and the guard still fails the day one of them
 *    starts granting.
 *
 * 2. The behavioural half: on the fixtures of T043 (the task that made the
 *    approval record and signs it) and of T102 (the own test of F101-SC-008,
 *    whose run sets are the families FX-03 and FX-08), an approval record of
 *    a phase exists only after a critic reply with `APPROVED` for that phase.
 *    The runs go through the real harness of feature 101
 *    (`101/run-harness.ts`) — the same runs T043's record writing and T102's
 *    limits are read over — so the guard judges the runs the feature
 *    actually stands on, not a parallel construction. A phase approved
 *    BEFORE the run (`approvedBefore`, the resume fixtures) holds a record an
 *    earlier run granted, so it is exempt from the reply of THIS run.
 *
 * The last test of the file is the NEGATIVE CONTROL: a fabricated run that
 * holds an approval record of a phase whose only critic reply was REJECTED
 * is judged an offender, so the judgement above is not vacuous.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import * as harness from "./101/run-harness.ts";
import {
  runFixture,
  RUN_SETS_OF_FX_08,
  type RunObservation,
  type RunSet,
} from "./101/run-harness.ts";

/** The directory of this test file (`packages/core/test/`). */
const HERE = fileURLToPath(new URL(".", import.meta.url));

/** The repository root, as seen from `packages/core/test/`. */
const REPO = join(HERE, "..", "..", "..");

/* ------------------------------------------------------------------ *
 * The static half — the files "Path Conventions" names.
 * ------------------------------------------------------------------ */

/**
 * Every new file the "Path Conventions" section of the tasks of feature 153
 * names, in the order of the section: the composition root and its helpers,
 * the read-only verb, and the new pure units of the core. The group
 * `packages/core/src/approval/` itself is NOT on the list — it is the module
 * the guard protects, and it was written by feature 101, not by this one.
 */
const PATH_CONVENTION_FILES: readonly string[] = [
  // Composition root and its helpers — the NEW pure helpers of the engine.
  "packages/cli/src/engine/check-run.ts",
  "packages/cli/src/engine/gate-feedback.ts",
  // Read-only verb.
  "packages/cli/src/inspect/report.ts",
  "packages/cli/src/inspect/index.ts",
  "packages/cli/src/router/verbs.ts",
  // New core units (pure; no `node:child_process`, no `node:fs`).
  "packages/core/src/gate/closing-check-skip.ts",
  "packages/core/src/gate/end-cause.ts",
  "packages/core/src/checks/selection.ts",
  "packages/core/src/critic-input/evidence/per-task.ts",
  "packages/core/src/critic-input/grounding/grounding.ts",
  "packages/core/src/critic-input/grounding/refuse.ts",
  "packages/core/src/critic-input/hide/hide.ts",
  "packages/core/src/critic-input/prompt/fit.ts",
  "packages/core/src/carry/handoff.ts",
  "packages/core/src/carry/module.ts",
  "packages/core/src/report/rows.ts",
];

/**
 * An import that reaches the approval group: by its path inside the core
 * package, by a subpath export of `@specstride/core`, or by a relative path
 * into the directory from a neighbour.
 */
const APPROVAL_IMPORT =
  /from\s+"[^"]*(?:core\/src\/approval|@specstride\/core\/approval|\/approval\/)/u;

/**
 * The schema of the approval record, written or referenced by hand: either
 * the literal of annex B §B.14 or the constant that names it. A file that
 * carries either could build a record the engine would take for its own
 * grant, or could couple its grant to the record's schema.
 */
const APPROVAL_SCHEMA_IN_THE_SOURCE = /specstride\.approval\/1|APPROVAL_SCHEMA_ID/u;

test("only APPROVED grants (static): no new file of Path Conventions imports the approval group or writes the approval record's schema", () => {
  const offenders: string[] = [];
  for (const relative of PATH_CONVENTION_FILES) {
    const path = join(REPO, relative);
    if (!existsSync(path)) continue; // not written yet: nothing to guard
    const text = readFileSync(path, "utf8");
    if (APPROVAL_IMPORT.test(text)) offenders.push(`${relative}: imports packages/core/src/approval/`);
    if (APPROVAL_SCHEMA_IN_THE_SOURCE.test(text))
      offenders.push(`${relative}: writes or references the schema of the approval record (specstride.approval/1)`);
  }
  assert.deepEqual(offenders, []);
});

/* ------------------------------------------------------------------ *
 * The behavioural half — the fixtures of T043 and T102.
 * ------------------------------------------------------------------ */

/**
 * The fixtures of T043: the run sets over which the approval record is made
 * and signed — the three-phase run that approves everything, the run whose
 * first attempt is rejected and whose second approves, the run that rejects
 * twice before it approves, and the resume run that starts after an approved
 * phase.
 */
const FIXTURES_OF_T043: readonly RunSet[] = [
  harness.FX_01_THREE_PHASES,
  harness.FX_02_REJECT_APPROVE,
  harness.FX_02_REJECT_TWICE_APPROVE,
  harness.FX_13_RESUME,
];

/** True for an export of the harness that is a run set. */
function isARunSet(value: unknown): value is RunSet {
  const candidate = value as Partial<RunSet> | null;
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    typeof candidate.family === "string" &&
    typeof candidate.scenario === "string" &&
    typeof candidate.reply === "function"
  );
}

/**
 * The fixtures of T102: every run set of the families FX-03 and FX-08 the
 * harness holds, collected by family the way T102's own test collects them,
 * so a run set added later is judged by this guard without it being touched.
 */
function fixturesOfT102(): readonly RunSet[] {
  const families = ["FX-03", "FX-08"] as const;
  const out: RunSet[] = [];
  for (const value of Object.values(harness as Readonly<Record<string, unknown>>)) {
    if (isARunSet(value) && (families as readonly string[]).includes(value.family)) out.push(value);
  }
  return Object.freeze(out);
}

/** The path of the approval record of a phase, in the control plane. */
const APPROVAL_RECORD_FILE = /^features\/[^/]+\/approvals\/phase-(\d+)\.json$/u;

/**
 * THE JUDGEMENT — the phases whose approval record exists without a critic
 * reply of `APPROVED` for them in the same run. A phase `approvedBefore`
 * holds a record an earlier run granted; it is exempt here.
 */
function approvalsWithoutAnApprovedReply(run: RunObservation): readonly number[] {
  const withARecord = new Set<number>();
  for (const path of run.files.keys()) {
    const found = APPROVAL_RECORD_FILE.exec(path);
    if (found !== null) withARecord.add(Number(found[1]));
  }
  const approvedByAReply = new Set(
    run.parses.filter((p) => p.parsed.result === "APPROVED").map((p) => p.phase),
  );
  const grantedBefore = new Set(run.runSet.approvedBefore ?? []);
  return [...withARecord]
    .filter((phase) => !grantedBefore.has(phase) && !approvedByAReply.has(phase))
    .sort((a, b) => a - b);
}

test("only APPROVED grants (T043): on the fixtures of the approval record, a record of a phase exists only after a critic reply with APPROVED for that phase", async () => {
  const offenders: string[] = [];
  let recordsSeen = 0;
  let approvedReplies = 0;
  for (const set of FIXTURES_OF_T043) {
    const run = await runFixture(set);
    for (const phase of approvalsWithoutAnApprovedReply(run))
      offenders.push(`${set.family}/${set.scenario}: phase ${phase} holds an approval record with no APPROVED reply`);
    for (const path of run.files.keys()) if (APPROVAL_RECORD_FILE.test(path)) recordsSeen += 1;
    approvedReplies += run.parses.filter((p) => p.parsed.result === "APPROVED").length;
  }
  assert.deepEqual(offenders, [], offenders.join("\n"));
  // The claim is not vacuous: these runs really wrote records, and the
  // replies that granted them were really parsed APPROVED.
  assert.ok(recordsSeen > 0, `${recordsSeen} approval records were written across the fixtures of T043`);
  assert.ok(approvedReplies > 0, `${approvedReplies} critic replies were parsed APPROVED across the fixtures of T043`);
});

test("only APPROVED grants (T102): on the fixtures of FX-03 and FX-08, a record of a phase exists only after a critic reply with APPROVED for that phase", async () => {
  const sets = fixturesOfT102();
  const offenders: string[] = [];
  let recordsSeen = 0;
  for (const set of sets) {
    const run = await runFixture(set);
    for (const phase of approvalsWithoutAnApprovedReply(run))
      offenders.push(`${set.family}/${set.scenario}: phase ${phase} holds an approval record with no APPROVED reply`);
    for (const path of run.files.keys()) if (APPROVAL_RECORD_FILE.test(path)) recordsSeen += 1;
  }
  assert.deepEqual(offenders, [], offenders.join("\n"));
  // 100 per cent of the fixtures: the collection really covers the two
  // families, and the catalogue scenarios of FX-08 are among them.
  const byFamily = new Map<string, number>();
  for (const set of sets) byFamily.set(set.family, (byFamily.get(set.family) ?? 0) + 1);
  assert.ok((byFamily.get("FX-03") ?? 0) >= 4, `FX-03 run sets: ${byFamily.get("FX-03") ?? 0}`);
  assert.ok((byFamily.get("FX-08") ?? 0) >= 15, `FX-08 run sets: ${byFamily.get("FX-08") ?? 0}`);
  for (const declared of RUN_SETS_OF_FX_08) {
    assert.ok(
      sets.some((s) => s.scenario === declared.scenario),
      `the catalogue scenario FX-08/${declared.scenario} is collected`,
    );
  }
  // FX-08 rejects before it approves: its runs really wrote records, so the
  // judgement above was read over records, not over empty runs.
  assert.ok(recordsSeen > 0, `${recordsSeen} approval records were written across the fixtures of T102`);
});

test("only APPROVED grants (negative control): a record of a phase whose only critic reply was REJECTED is judged an offender", () => {
  // A fabricated run: the approval record of phase 1 stands, and the one
  // critic call the run made was REJECTED. No fixture of the harness makes
  // this run — the engine never grants without APPROVED — which is exactly
  // why the judgement must reject it when a unit ever tries.
  const forged = {
    files: new Map([["features/101-gate-and-verdict/approvals/phase-1.json", "{}"]]),
    parses: [{ phase: 1, ordinal: 1, parsed: { result: "REJECTED", detail: "ok" } }],
    runSet: { family: "FX-02", scenario: "negative-control", approvedBefore: undefined },
  } as unknown as RunObservation;
  assert.deepEqual(approvalsWithoutAnApprovedReply(forged), [1]);
  // The same run with the reply APPROVED, or with the record held from
  // before, grants: the judgement exempts exactly those two.
  const approved = {
    ...forged,
    parses: [{ phase: 1, ordinal: 2, parsed: { result: "APPROVED", detail: "ok" } }],
  } as unknown as RunObservation;
  assert.deepEqual(approvalsWithoutAnApprovedReply(approved), []);
  const grantedBefore = {
    ...forged,
    runSet: { family: "FX-13", scenario: "resume", approvedBefore: [1] },
  } as unknown as RunObservation;
  assert.deepEqual(approvalsWithoutAnApprovedReply(grantedBefore), []);
});
