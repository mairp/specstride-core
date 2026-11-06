/**
 * T017 — run the behaviour cases of EP-13 (`suite.ts`) under `node:test`.
 *
 * The cases live in `suite.ts` and not here, so that the script
 * `conformance` and `node --test` run the same list. This file is the one
 * line that turns them into tests.
 */
import { casesAsTests } from "../run.ts";
import { POINT_ID, behaviourCases, implementation } from "./suite.ts";

await casesAsTests(POINT_ID, implementation, behaviourCases);
