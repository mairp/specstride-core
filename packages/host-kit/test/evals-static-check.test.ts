/**
 * The static check of a host's suite files and of its build configuration
 * (`src/evals/static-check.ts`). The sample hosts here are deliberately NOT
 * the host the module moved out of, and neither of them is the other: one
 * checks six positive and six negative cases per skill against its pack tool,
 * the other three and two against a scan script. The point of the move is
 * that the kit runs the check and takes every rule — the case minimums, the
 * confusable pair, the suite-runner markers, the requirement ids the failing
 * reasons name — as the one required `StaticCheckRules` input, with no
 * default anywhere, and that the kit source names no host and no requirement
 * of one.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  MODEL_ID_KEYS,
  type StaticCheckRules,
  type TriggerSuiteFile,
  containsModelId,
  staticCheckCallsAModel,
  staticCheckOf,
  staticCheckPasses,
} from "../src/evals/index.ts";

const PACK_RULES: StaticCheckRules = {
  positiveCasesPerSkill: 6,
  negativeCasesPerSkill: 6,
  confusablePair: "pack-build",
  suiteRunnerMarkers: [/\bpacktool\b[^|;&]*\beval\b/],
  requirementIds: {
    suiteCases: "KIT-FR-20",
    noModelId: "KIT-FR-21",
    buildNoSuiteRunner: "KIT-FR-22",
  },
};

const SCAN_RULES: StaticCheckRules = {
  positiveCasesPerSkill: 3,
  negativeCasesPerSkill: 2,
  confusablePair: "scan-diff",
  suiteRunnerMarkers: [/node\s+scan\.mjs/],
  requirementIds: {
    suiteCases: "KIT-FR-23",
    noModelId: "KIT-FR-24",
    buildNoSuiteRunner: "KIT-FR-25",
  },
};

const PACK = staticCheckOf(PACK_RULES);
const SCAN = staticCheckOf(SCAN_RULES);

/** A suite file of the sample host, with `positive` and `negative` cases. */
function aSuite(overrides?: {
  readonly skill?: string;
  readonly positive?: number;
  readonly negative?: number;
  readonly pair?: string;
  readonly modelId?: boolean;
}): TriggerSuiteFile {
  const skill = overrides?.skill ?? "a-pack-skill";
  const positive = overrides?.positive ?? 6;
  const negative = overrides?.negative ?? 6;
  const pair = overrides?.pair ?? PACK_RULES.confusablePair;
  const cases = [
    ...Array.from({ length: positive }, (_, index) => ({
      id: `pos-${index + 1}`,
      kind: "positive" as const,
      prompt: `a prompt of the case ${index + 1}`,
      expected: skill,
      ...(index === 0 ? { confusablePair: pair } : {}),
    })),
    ...Array.from({ length: negative }, (_, index) => ({
      id: `neg-${index + 1}`,
      kind: "negative" as const,
      prompt: `a prompt of the other case ${index + 1}`,
      expected: null,
      ...(index === 1 ? { confusablePair: pair } : {}),
    })),
  ];
  return {
    skill,
    cases,
    ...(overrides?.modelId
      ? (Object.fromEntries([
          // Built here, never written into a file of any repository: the
          // pieces are joined so no model id is a literal of the kit.
          ["model", ["a", "model", "of", "a", "suite"].join("-")],
        ]) as Record<string, unknown>)
      : {}),
  } as TriggerSuiteFile;
}

/** The graders file of the sample host: free graders and restricted tools. */
function gradersOf(overrides?: { readonly modelId?: boolean; readonly openTools?: boolean }) {
  const restriction = overrides?.openTools
    ? { allowedTools: ["a-tool"], launchImpossible: false }
    : { allowedTools: [], launchImpossible: true };
  return {
    toolRestriction: { ...restriction, reason: "no run of a suite may launch" },
    graders: {
      "invoked-skill": {
        kind: "free" as const,
        method: "compare",
        reads: "the recorded skill",
        passes: "it is the expected one",
        modelJudge: false as const,
      },
    },
    ...(overrides?.modelId
      ? (Object.fromEntries([["judgeModel", ["a", "judge", "model"].join("-")]]) as Record<
          string,
          unknown
        >)
      : {}),
  };
}

test("no default anywhere: one suite passes under one host's rules and fails under the other's", () => {
  const small = aSuite({ positive: 3, negative: 2, pair: SCAN_RULES.confusablePair });
  // Under the scanner's own rules the small suite is complete; under the pack
  // rules it is not, and each failing reason names ITS OWN requirement id.
  assert.equal(staticCheckPasses(SCAN.checkSuiteFiles([small], gradersOf())), true);
  const underPack = PACK.checkSuiteFiles([small], gradersOf());
  assert.equal(staticCheckPasses(underPack), false);
  const failed = underPack.filter((finding) => !finding.ok);
  assert.deepEqual(
    failed.map((finding) => finding.check),
    ["case-counts-positive", "case-counts-negative", "confusable-pair"],
  );
  assert.equal(
    failed[0]?.detail,
    "a-pack-skill holds 3 positive cases; KIT-FR-20 needs at least 6",
  );
  assert.equal(
    failed[1]?.detail,
    "a-pack-skill holds 2 negative cases; KIT-FR-20 needs at least 6",
  );
});

test("the findings read as the host's requirement words them, byte for byte", () => {
  const poor = aSuite({ positive: 2, negative: 1, pair: "no-such-pair" });
  const [positive, negative, confusable, noModelId] = PACK.checkOneSuite(poor);
  assert.equal(positive?.ok, false);
  assert.equal(positive?.detail, "a-pack-skill holds 2 positive cases; KIT-FR-20 needs at least 6");
  assert.equal(negative?.detail, "a-pack-skill holds 1 negative cases; KIT-FR-20 needs at least 6");
  assert.equal(confusable?.ok, false);
  assert.equal(confusable?.detail, "no case carries the confusable pair pack-build");
  assert.equal(noModelId?.ok, true);
  assert.equal(noModelId?.detail, "a-pack-skill: no model id in the suite file");

  const good = aSuite();
  const [p, n, c, m] = PACK.checkOneSuite(good);
  assert.equal(p?.detail, "6 positive cases of a-pack-skill");
  assert.equal(n?.detail, "6 negative cases of a-pack-skill");
  assert.equal(c?.detail, "the confusable pair pack-build is among the cases");
  assert.equal(m?.ok, true);

  const withModel = aSuite({ modelId: true });
  const model = PACK.checkOneSuite(withModel).find((finding) => finding.check === "no-model-id");
  assert.equal(model?.ok, false);
  assert.equal(model?.detail, "a-pack-skill: the suite file holds a model id (KIT-FR-21)");
});

test("the graders check: free graders, the restriction of tools, and the host's ids", () => {
  const closed = PACK.checkGraders(gradersOf());
  assert.deepEqual(
    closed.map((finding) => [finding.check, finding.ok]),
    [
      ["free-graders", true],
      ["tool-restriction", true],
      ["no-model-id", true],
    ],
  );
  assert.equal(closed[0]?.detail, "1 free graders, none with a model judge");
  assert.equal(
    closed[1]?.detail,
    "allowedTools is empty and launch is impossible: no run can launch",
  );
  const open = PACK.checkGraders(gradersOf({ openTools: true }));
  const tools = open.find((finding) => finding.check === "tool-restriction");
  assert.equal(tools?.ok, false);
  assert.equal(
    tools?.detail,
    "the tools of a run are not restricted: a run could launch (KIT-FR-20)",
  );
  const judged = PACK.checkGraders({ graders: {} });
  assert.equal(
    judged.find((finding) => finding.check === "free-graders")?.detail,
    "a grader uses a model judge, or the graders file holds none",
  );
  const withModel = PACK.checkGraders(gradersOf({ modelId: true }));
  const model = withModel.find((finding) => finding.check === "no-model-id");
  assert.equal(model?.ok, false);
  assert.equal(model?.detail, "the graders file holds a model id (KIT-FR-21)");
});

test("containsModelId walks the generic keys, and MODEL_ID_KEYS is the kit's", () => {
  assert.deepEqual(
    [...MODEL_ID_KEYS],
    ["model", "modelId", "modelIds", "judgeModel", "judgeModelId", "judgeModelIds"],
  );
  const hidden = { a: { modelIds: [["one", "two"].join("-")] }, b: [{ judgeModel: "x" }] };
  assert.equal(containsModelId(hidden), true);
  assert.equal(containsModelId({ model: "   " }), false, "an empty value hides nothing");
  assert.equal(containsModelId({ notAKey: "a-model" }), false);
  assert.equal(containsModelId({ model: null }), false);
  assert.equal(containsModelId({ judgeModelId: 7 }), true);
});

test("the build-configuration half honours the host's own suite-runner markers", () => {
  const packJob = { declaredIn: `package.json script "eval"`, command: `packtool plugin eval` };
  const scanJob = { declaredIn: `ci.yml step`, command: `node scan.mjs out.jsonl` };
  assert.deepEqual([...PACK.jobsThatStartTheSuiteRunner([packJob, scanJob])], [packJob]);
  assert.deepEqual([...SCAN.jobsThatStartTheSuiteRunner([packJob, scanJob])], [scanJob]);
  assert.throws(
    () => PACK.assertNoJobStartsTheSuiteRunner([packJob]),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match((error as Error).name, /^SuiteRunnerInBuildError$/);
      assert.equal(
        (error as Error).message,
        `the build fails: 1 job(s) would start the host's suite runner (KIT-FR-22): ` +
          `package.json script "eval" → packtool plugin eval`,
      );
      return true;
    },
  );
  assert.throws(
    () => SCAN.assertNoJobStartsTheSuiteRunner([scanJob]),
    (error: unknown) => {
      assert.match((error as Error).message, /\(KIT-FR-25\)/);
      return true;
    },
  );
  assert.deepEqual(
    PACK.jobsThatStartTheSuiteRunner([{ declaredIn: "x", command: "npm test" }]),
    [],
  );
  assert.doesNotThrow(() => PACK.assertNoJobStartsTheSuiteRunner([]));
});

test("staticCheckOf refuses incomplete rules: no default anywhere", () => {
  const base = PACK_RULES;
  assert.throws(
    () => staticCheckOf({ ...base, positiveCasesPerSkill: 0 }),
    /the least number of positive cases 0 is not a positive whole number/,
  );
  assert.throws(
    () => staticCheckOf({ ...base, negativeCasesPerSkill: 1.5 }),
    /the least number of negative cases 1\.5 is not a positive whole number/,
  );
  assert.throws(
    () => staticCheckOf({ ...base, confusablePair: "" }),
    /the confusable pair is empty/,
  );
  assert.throws(
    () => staticCheckOf({ ...base, suiteRunnerMarkers: [] }),
    /the suite-runner markers hold no marker/,
  );
  assert.throws(
    () =>
      staticCheckOf({
        ...base,
        requirementIds: { ...base.requirementIds, buildNoSuiteRunner: "" },
      }),
    /a requirement id of the rules is empty/,
  );
});

test("checkSuiteFiles aggregates every suite and the graders; the check calls no model", () => {
  const findings = PACK.checkSuiteFiles(
    [aSuite({ skill: "one" }), aSuite({ skill: "two" })],
    gradersOf(),
  );
  assert.equal(findings.length, 2 * 4 + 3);
  assert.equal(Object.isFrozen(findings), true);
  assert.equal(staticCheckPasses(findings), true);
  assert.equal(staticCheckCallsAModel(), false);
});

/* ------------------------------------------------------------- neutrality */

test("the kit source names no host, no task of one and no requirement of one", () => {
  const files = [
    "index.ts",
    "log.ts",
    "release-check.ts",
    "suite-file.ts",
    "static-check.ts",
    "eval-driver.ts",
    "stub-runner.ts",
  ];
  const sources = files.map(
    (file) =>
      [file, readFileSync(new URL(`../src/evals/${file}`, import.meta.url), "utf8")] as const,
  );
  for (const [file, src] of sources) {
    for (const foreign of [
      "CLAUDE",
      "Claude",
      "claude plugin",
      ".claude-plugin",
      "/specstride:",
      "specstride-",
      "F113-FR",
      "R3v",
      "trigger-suite",
      "behaviour-smoke",
      "with-and-without-report",
      "T033",
      "T035",
      "T037",
      "run-reverse",
    ]) {
      assert.equal(src.includes(foreign), false, `src/evals/${file} must not hold ${foreign}`);
    }
  }
});
