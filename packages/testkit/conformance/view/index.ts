/**
 * T065 — the folder `packages/testkit/conformance/view/`: the conformance
 * suite of EP-09 at the path `tasks.md` T065 names. The suite itself lives in
 * `src/conformance/view/suite.ts` (the package ships `src/`); this file
 * re-exports it so the named path exists and holds the same exports.
 */
export {
  runViewConformance,
  shippedViewImplementation,
  secondReadModelImplementation,
  type SuiteInputs,
  type ViewImplementation,
  type CheckResult,
  type SuiteResult,
} from "../../src/conformance/view/suite.ts";
