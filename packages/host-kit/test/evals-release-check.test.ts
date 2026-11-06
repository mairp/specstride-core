/**
 * The release check of a host's trigger suite (`src/evals/release-check.ts`).
 * The sample hosts here are deliberately NOT the host the module moved out of,
 * and neither of them is the other: one releases on a launch suite at the
 * threshold 0.75 over two runs, the other on an audit task at 1 over four. The
 * point of the move is that the kit runs the check and takes every rule — the
 * task, the threshold, the number of runs, the requirement id the reasons
 * name, the paid task names — as the one required `ReleaseCheckRules` input,
 * with no default anywhere, and that the kit source names no host and no
 * requirement of one.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  type ReleaseCheckRules,
  releaseCheckCallsAModel,
  releaseCheckOf,
  runUsedAblation,
} from "../src/evals/index.ts";

const LAUNCH_RULES: ReleaseCheckRules = {
  paidTaskNames: ["launch-suite", "launch-smoke"],
  task: "launch-suite",
  threshold: 0.75,
  requiredRuns: 2,
  requirementId: "KIT-FR-12",
};

const AUDIT_RULES: ReleaseCheckRules = {
  paidTaskNames: ["pack-audit"],
  task: "pack-audit",
  threshold: 1,
  requiredRuns: 4,
  requirementId: "KIT-FR-13",
};

/** A recorded run of the launch suite, on the given hash and scores. */
function aRun(overrides?: {
  readonly hash?: string;
  readonly scores?: readonly number[];
  readonly task?: string;
  readonly ablation?: boolean;
}): Record<string, unknown> {
  const record: Record<string, unknown> = {
    date: "2026-11-07",
    task: overrides?.task ?? "launch-suite",
    modelIds: [["a", "model", "of", "its", "configuration"].join("-")],
    calls: 8,
    cost: "0.62",
    skillTextsHash: overrides?.hash ?? "b".repeat(64),
    resultPerSkill: [
      { skill: "a-skill", scores: overrides?.scores ?? [0.8, 0.9], scored: true },
      { skill: "another-skill", scores: overrides?.scores ?? [0.9, 0.8], scored: true },
    ],
    runsNotScored: [],
  };
  if (overrides?.ablation) record.ablation = true;
  return record;
}

test("the check is built over the host's rules and holds them at build time", () => {
  assert.throws(
    () =>
      releaseCheckOf({
        paidTaskNames: ["launch-suite"],
        task: "a-nightly-job",
        threshold: 0.75,
        requiredRuns: 2,
        requirementId: "KIT-FR-12",
      }),
    /is not one of the host's paid tasks/,
    "a task outside the host's paid tasks can never be read",
  );
  assert.throws(
    () => releaseCheckOf({ ...LAUNCH_RULES, threshold: 1.5 }),
    /not a score between 0 and 1/,
  );
  assert.throws(
    () => releaseCheckOf({ ...LAUNCH_RULES, requiredRuns: 0 }),
    /positive whole number/,
  );
});

test("a run at the threshold on the same hash passes, in the host's own words", () => {
  const releaseCheck = releaseCheckOf(LAUNCH_RULES);
  const verdict = releaseCheck([aRun()], { skillTextsHash: "b".repeat(64) });
  assert.equal(verdict.passed, true);
  assert.match(verdict.reason, /threshold 0\.75 over 2 runs/);
  assert.doesNotMatch(verdict.reason, /KIT-FR-12/, "the passing reason names no requirement");
  const audit = releaseCheckOf(AUDIT_RULES)([aRun({ task: "pack-audit", scores: [1, 1, 1, 1] })], {
    skillTextsHash: "b".repeat(64),
  });
  assert.equal(audit.passed, true);
  assert.match(audit.reason, /threshold 1 over 4 runs/);
});

test("no run, another host's task, another hash, or a run under the rules fails", () => {
  const releaseCheck = releaseCheckOf(LAUNCH_RULES);
  const noRun = releaseCheck([], { skillTextsHash: "b".repeat(64) });
  assert.equal(noRun.passed, false);
  assert.match(noRun.reason, /no run of the trigger suite/, "the phrase names the concept");
  assert.doesNotMatch(noRun.reason, /launch-suite/, "the reason names no host's task id");
  assert.match(noRun.reason, /KIT-FR-12/, "the reasons name the host's requirement id");
  // A well-formed record of the same host's OTHER paid task is not a run of
  // the task a release reads.
  const otherTask = releaseCheck([aRun({ task: "launch-smoke" })], {
    skillTextsHash: "b".repeat(64),
  });
  assert.equal(otherTask.passed, false);
  assert.match(otherTask.reason, /no run of the trigger suite/);
  const otherHash = releaseCheck([aRun({ hash: "a".repeat(64) })], {
    skillTextsHash: "b".repeat(64),
  });
  assert.equal(otherHash.passed, false);
  assert.match(otherHash.reason, /no hash in the log matches/);
  const under = releaseCheck([aRun({ scores: [0.5, 0.9] })], { skillTextsHash: "b".repeat(64) });
  assert.equal(under.passed, false);
  assert.match(under.reason, /a-skill/);
  assert.match(under.reason, /threshold 0\.75/);
  const two = releaseCheck([aRun({ scores: [0.9] })], { skillTextsHash: "b".repeat(64) });
  assert.equal(two.passed, false, "fewer runs than the rule pins is under the requirement too");
});

test("a run made with an ablation never passes", () => {
  const releaseCheck = releaseCheckOf(LAUNCH_RULES);
  const verdict = releaseCheck([aRun({ ablation: true })], { skillTextsHash: "b".repeat(64) });
  assert.equal(verdict.passed, false);
  assert.match(verdict.reason, /used an ablation/);
});

test("runs that are not scored are never read as low", () => {
  const releaseCheck = releaseCheckOf(LAUNCH_RULES);
  const interrupted = aRun();
  (interrupted["resultPerSkill"] as unknown[]) = [
    { skill: "a-skill", scores: [], scored: false, notScoredReason: "interrupted" },
  ];
  const verdict = releaseCheck([interrupted, aRun()], { skillTextsHash: "b".repeat(64) });
  assert.equal(verdict.passed, true, "an interrupted run is not a score failure");
});

test("the checks of two hosts do not cross", () => {
  const launch = releaseCheckOf(LAUNCH_RULES);
  const audit = releaseCheckOf(AUDIT_RULES);
  assert.notEqual(launch, audit, "each host gets its own check");
  const auditRun = aRun({ task: "pack-audit", scores: [1, 1, 1, 1] });
  const auditVerdict = audit([auditRun], { skillTextsHash: "b".repeat(64) });
  assert.equal(auditVerdict.passed, true);
  const launchVerdict = launch([auditRun], { skillTextsHash: "b".repeat(64) });
  assert.equal(launchVerdict.passed, false, "the launch check does not read the audit's log");
  assert.match(launchVerdict.reason, /no run of the trigger suite/);
});

test("runUsedAblation is true only for a record that carries one", () => {
  assert.equal(runUsedAblation(aRun() as never), false);
  assert.equal(runUsedAblation(aRun({ ablation: true }) as never), true);
});

test("the release check calls no model", () => {
  assert.equal(releaseCheckCallsAModel(), false);
});

test("the kit exports no threshold and no run count of any host", () => {
  const evals = readFileSync(new URL("../src/evals/index.ts", import.meta.url), "utf8");
  assert.equal(evals.includes("RELEASE_THRESHOLD"), false);
  assert.equal(evals.includes("REQUIRED_RUNS"), false);
  assert.equal(evals.includes("0.8"), false);
});
