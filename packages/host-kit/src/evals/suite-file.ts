/**
 * The types of the suite files of a host's trigger suite, read back from the
 * JSON on disk. Moved once out of
 * `packages/host-claude-code/src/evals/suite-file.ts` (the split of the
 * monorepo, U-1 and U-2 of `specs/120-host-dsh`), which keeps the old path and
 * re-exports these types. The files themselves are a host's own data — its
 * suite files and its graders file, read from its package; the static check
 * (`./static-check.ts`) takes the parsed values.
 */
/** One trigger case of a suite file (the port's data model, "Trigger case"). */
export type TriggerCase = {
  readonly id: string;
  readonly kind: "positive" | "negative" | "cross-skill";
  readonly prompt: string;
  /** The expected skill, or null where no skill of this host may fire. */
  readonly expected: string | null;
  /** The confusable pair the case belongs to, where it is one. */
  readonly confusablePair?: string;
};

/** One suite file: the cases of one skill. */
export type TriggerSuiteFile = {
  readonly skill: string;
  readonly cases: readonly TriggerCase[];
};

/** One free grader: deterministic, reading recorded behaviour only. */
export type FreeGrader = {
  readonly kind: "free";
  readonly method: string;
  readonly reads: string;
  readonly passes: string;
  /** Always false: no grader of a suite uses a model judge. */
  readonly modelJudge: false;
};

/** The restriction of tools: no run of a suite can launch. */
export type ToolRestriction = {
  readonly allowedTools: readonly string[];
  readonly deniedTools?: readonly string[];
  readonly launchImpossible?: boolean;
  readonly reason?: string;
};

/** The graders file. */
export type FreeGraderFile = {
  readonly toolRestriction?: ToolRestriction;
  readonly graders?: Readonly<Record<string, FreeGrader>>;
};
