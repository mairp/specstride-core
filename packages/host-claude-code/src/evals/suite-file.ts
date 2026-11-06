/**
 * T033 — the types of the suite files, read back from the JSON on disk. The
 * files themselves are `evals/trigger-suites.json` and `evals/graders.json`
 * of this package (T027); the static check (`./static-check.ts`) takes the
 * parsed values.
 *
 * The TYPES moved to `@specstride/host-kit` (`src/evals/suite-file.ts` there,
 * the split of the monorepo, U-1): a suite file of any host is one skill and
 * its cases, and its graders file restricts the tools and holds free graders.
 * This module keeps the old path, so every import of it reads the same types
 * as before the move.
 */
export type {
  TriggerCase,
  TriggerSuiteFile,
  FreeGrader,
  ToolRestriction,
  FreeGraderFile,
} from "@specstride/host-kit/evals";
