/**
 * T033 — the eval driver of EP-01 (`evalDriver.run`, contract
 * `specs/113-host-claude-code/contracts/host-package.md`), as the build runs
 * it: ON A STUB of the host's suite runner, with recorded results (F113-FR-041
 * (b)). On the host's own runner the driver calls a model and is started by a
 * person, as a paid task (F113-FR-038, assumption CQ-188) — never here.
 *
 * The DRIVER moved to `@specstride/host-kit` (`src/evals/eval-driver.ts`
 * there, the split of the monorepo, U-1): it holds no fact of any host — the
 * suite and the runner are its inputs, and a recorded interrupted run or a run
 * ended by a usage limit is reported as NOT SCORED, never as a failure
 * (F113-FR-039). This module keeps the old path, so every import of it reads
 * the same driver as before the move.
 */
export {
  type RecordedCaseResult,
  type SuiteRunner,
  type CaseReport,
  evalDriverRun,
  evalDriverCallsAModel,
} from "@specstride/host-kit/evals";
