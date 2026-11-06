/**
 * The static check of a host's suite files and of its build configuration.
 * Moved once out of `packages/host-claude-code/src/evals/static-check.ts` (the
 * split of the monorepo, U-1 and U-2 of `specs/120-host-dsh`), which keeps the
 * old path and builds this check over its own rules.
 *
 * A per-change build MUST call no model and no paid or external API; the
 * check covers what can be checked WITHOUT a model call:
 *
 *   (a) the suite files: the case counts a host requires per skill, the
 *       host's confusable pair, the restriction of tools so that no run can
 *       launch, and that no file holds a model id (the model comes from the
 *       configuration of the run);
 *   (b) the build configuration: no job of the build starts the host's suite
 *       runner — the build fails when one would.
 *
 * Part (c), the token budget of each host skill, is the static size check and
 * the budget check of the kit's render (`src/render.ts`); this module does not
 * restate it. The eval driver on the stub of a suite runner, the other half
 * of (b), is `./eval-driver.ts` and `./stub-runner.ts`.
 *
 * A HOST SUPPLIES ITS RULES; THE KIT RUNS THE CHECK. The case minimums, the
 * confusable pair, the markers that name a suite-runner command in a build
 * job, and the requirement ids the failing reasons name are facts of ONE host
 * and travel in one required `StaticCheckRules` input of `staticCheckOf`, with
 * no default anywhere, as in `describe`, `render`, `doctor` and the release
 * check: a check that forgot its rules cannot compile into a second host by
 * accident. What the kit fixes is the machinery that must not drift: the walk
 * that finds a model id behind one of the generic `MODEL_ID_KEYS`, the
 * findings shape, the reading of a graders file, and the aggregation.
 *
 * Nothing here calls a model, starts a process or opens a connection: every
 * function takes parsed values (or file contents as text) and returns findings.
 */
import type { FreeGraderFile, TriggerSuiteFile } from "./suite-file.ts";

/** The keys a model id would hide behind (there is none in a suite file). */
export const MODEL_ID_KEYS: readonly string[] = Object.freeze([
  "model",
  "modelId",
  "modelIds",
  "judgeModel",
  "judgeModelId",
  "judgeModelIds",
]);

/** One finding of the static check. */
export type StaticFinding = {
  /** The check the finding is of. */
  readonly check: string;
  /** True when the check passed. */
  readonly ok: boolean;
  /** What was observed, as one line. */
  readonly detail: string;
};

/**
 * The static rules of one host: its requirement's own numbers, its confusable
 * pair, the commands it counts as a suite-runner start, and the ids its
 * failing reasons name. The kit takes no default of any of them and holds
 * every one at build time (`staticCheckOf` refuses a case minimum under one,
 * an empty confusable pair, a marker list without a marker, and an empty
 * requirement id).
 */
export type StaticCheckRules = {
  /** The least number of positive cases per skill the host requires. */
  readonly positiveCasesPerSkill: number;
  /** The least number of negative cases per skill the host requires. */
  readonly negativeCasesPerSkill: number;
  /** The host's confusable pair, as its suite files name it. */
  readonly confusablePair: string;
  /** What marks a build command as one that starts the host's suite runner. */
  readonly suiteRunnerMarkers: readonly RegExp[];
  /** The ids of the host requirements the failing reasons name. */
  readonly requirementIds: {
    /** The rule of the case counts and of the restriction of tools. */
    readonly suiteCases: string;
    /** The rule no suite file or graders file may break: no model id. */
    readonly noModelId: string;
    /** The rule the build fails under when a job starts the suite runner. */
    readonly buildNoSuiteRunner: string;
  };
};

/** One job of the build configuration, as a name and the command it runs. */
export type BuildJob = {
  /** Where the job is declared, e.g. `package.json script "test"`. */
  readonly declaredIn: string;
  /** The command the job runs. */
  readonly command: string;
};

/**
 * The error the build fails with when one of its jobs would start the host's
 * suite runner. The requirement id the message names is the host's own, so it
 * is a required argument and never a constant here.
 */
export class SuiteRunnerInBuildError extends Error {
  override readonly name = "SuiteRunnerInBuildError";
  readonly offenders: readonly BuildJob[];
  constructor(offenders: readonly BuildJob[], requirementId: string) {
    super(
      `the build fails: ${offenders.length} job(s) would start the host's suite runner ` +
        `(${requirementId}): ${offenders.map((job) => `${job.declaredIn} → ${job.command}`).join("; ")}`,
    );
    this.offenders = Object.freeze([...offenders]);
  }
}

const ok = (check: string, detail: string): StaticFinding => ({ check, ok: true, detail });
const bad = (check: string, detail: string): StaticFinding => ({ check, ok: false, detail });

/**
 * True where the parsed suite file (or any value inside it) hides a model id
 * behind one of the `MODEL_ID_KEYS` with a non-empty value.
 */
export function containsModelId(value: unknown, keyPath = ""): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => containsModelId(entry, keyPath));
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value as Record<string, unknown>).some(([key, child]) =>
      containsModelId(child, keyPath.length === 0 ? key : `${keyPath}.${key}`),
    );
  }
  const lastKey = keyPath.split(".").pop() ?? "";
  if (!MODEL_ID_KEYS.includes(lastKey)) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return false; // handled above, one level up
  return value !== null && value !== undefined;
}

/** True where every finding of a static check passed. */
export function staticCheckPasses(findings: readonly StaticFinding[]): boolean {
  return findings.every((finding) => finding.ok);
}

/* -------------------------------------------------------------------------
 * (b) the build configuration: no job starts the host's suite runner
 * ---------------------------------------------------------------------- */

/** The jobs of the build configuration that start the host's suite runner. */
const jobsThatStart = (
  markers: readonly RegExp[],
  jobs: readonly BuildJob[],
): readonly BuildJob[] => jobs.filter((job) => markers.some((marker) => marker.test(job.command)));

/**
 * The static check of ONE host, built over its rules and holding them at
 * build time. The returned functions are the whole of (a) and (b) above.
 */
export function staticCheckOf(rules: StaticCheckRules): {
  readonly checkOneSuite: (suite: TriggerSuiteFile) => readonly StaticFinding[];
  readonly checkGraders: (graders: FreeGraderFile) => readonly StaticFinding[];
  readonly checkSuiteFiles: (
    suites: readonly TriggerSuiteFile[],
    graders: FreeGraderFile,
  ) => readonly StaticFinding[];
  readonly jobsThatStartTheSuiteRunner: (jobs: readonly BuildJob[]) => readonly BuildJob[];
  readonly assertNoJobStartsTheSuiteRunner: (jobs: readonly BuildJob[]) => void;
} {
  const { positiveCasesPerSkill, negativeCasesPerSkill, confusablePair } = rules;
  const { suiteCases, noModelId, buildNoSuiteRunner } = rules.requirementIds;
  if (!Number.isInteger(positiveCasesPerSkill) || positiveCasesPerSkill < 1) {
    throw new Error(
      `staticCheckOf: the least number of positive cases ${positiveCasesPerSkill} is not a ` +
        `positive whole number`,
    );
  }
  if (!Number.isInteger(negativeCasesPerSkill) || negativeCasesPerSkill < 1) {
    throw new Error(
      `staticCheckOf: the least number of negative cases ${negativeCasesPerSkill} is not a ` +
        `positive whole number`,
    );
  }
  if (confusablePair.length === 0) {
    throw new Error("staticCheckOf: the confusable pair is empty");
  }
  if (rules.suiteRunnerMarkers.length === 0) {
    throw new Error("staticCheckOf: the suite-runner markers hold no marker");
  }
  for (const id of [suiteCases, noModelId, buildNoSuiteRunner]) {
    if (id.length === 0) {
      throw new Error("staticCheckOf: a requirement id of the rules is empty");
    }
  }

  const checkOneSuite = (suite: TriggerSuiteFile): readonly StaticFinding[] => {
    const findings: StaticFinding[] = [];
    const cases = suite.cases ?? [];
    const positive = cases.filter((entry) => entry.kind === "positive");
    const negative = cases.filter((entry) => entry.kind !== "positive");
    findings.push(
      positive.length >= positiveCasesPerSkill
        ? ok("case-counts-positive", `${positive.length} positive cases of ${suite.skill}`)
        : bad(
            "case-counts-positive",
            `${suite.skill} holds ${positive.length} positive cases; ${suiteCases} needs at least ` +
              `${positiveCasesPerSkill}`,
          ),
    );
    findings.push(
      negative.length >= negativeCasesPerSkill
        ? ok("case-counts-negative", `${negative.length} negative cases of ${suite.skill}`)
        : bad(
            "case-counts-negative",
            `${suite.skill} holds ${negative.length} negative cases; ${suiteCases} needs at least ` +
              `${negativeCasesPerSkill}`,
          ),
    );
    const confusable = cases.some((entry) => entry.confusablePair === confusablePair);
    findings.push(
      confusable
        ? ok("confusable-pair", `the confusable pair ${confusablePair} is among the cases`)
        : bad("confusable-pair", `no case carries the confusable pair ${confusablePair}`),
    );
    findings.push(
      containsModelId(suite)
        ? bad("no-model-id", `${suite.skill}: the suite file holds a model id (${noModelId})`)
        : ok("no-model-id", `${suite.skill}: no model id in the suite file`),
    );
    return findings;
  };

  const checkGraders = (graders: FreeGraderFile): readonly StaticFinding[] => {
    const findings: StaticFinding[] = [];
    const graders_ = graders.graders ?? {};
    const allFree = Object.values(graders_).every(
      (grader) => (grader as { modelJudge?: unknown }).modelJudge === false,
    );
    findings.push(
      allFree && Object.keys(graders_).length > 0
        ? ok(
            "free-graders",
            `${Object.keys(graders_).length} free graders, none with a model judge`,
          )
        : bad("free-graders", "a grader uses a model judge, or the graders file holds none"),
    );
    const restriction = graders.toolRestriction;
    const restricted =
      restriction !== undefined &&
      Array.isArray(restriction.allowedTools) &&
      restriction.allowedTools.length === 0 &&
      restriction.launchImpossible === true;
    findings.push(
      restricted
        ? ok(
            "tool-restriction",
            `allowedTools is empty and launch is impossible: no run can launch`,
          )
        : bad(
            "tool-restriction",
            `the tools of a run are not restricted: a run could launch (${suiteCases})`,
          ),
    );
    findings.push(
      containsModelId(graders)
        ? bad("no-model-id", `the graders file holds a model id (${noModelId})`)
        : ok("no-model-id", "no model id in the graders file"),
    );
    return findings;
  };

  const checkSuiteFiles = (
    suites: readonly TriggerSuiteFile[],
    graders: FreeGraderFile,
  ): readonly StaticFinding[] =>
    Object.freeze([...suites.flatMap((suite) => checkOneSuite(suite)), ...checkGraders(graders)]);

  const jobsThatStartTheSuiteRunner = (jobs: readonly BuildJob[]): readonly BuildJob[] =>
    jobsThatStart(rules.suiteRunnerMarkers, jobs);

  const assertNoJobStartsTheSuiteRunner = (jobs: readonly BuildJob[]): void => {
    const offenders = jobsThatStartTheSuiteRunner(jobs);
    if (offenders.length > 0) throw new SuiteRunnerInBuildError(offenders, buildNoSuiteRunner);
  };

  return {
    checkOneSuite,
    checkGraders,
    checkSuiteFiles,
    jobsThatStartTheSuiteRunner,
    assertNoJobStartsTheSuiteRunner,
  };
}

/** True where the whole static check would call a model: never. */
export function staticCheckCallsAModel(): boolean {
  return false;
}
