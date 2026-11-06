/**
 * The entry point of the conformance folder of EP-04, so that
 * `node --test packages/testkit/src/conformance/EP-04/` runs its suite.
 *
 * Why a directory needs an entry point at all, and why it is TypeScript with a
 * `package.json` beside it, is in `../suite-entry.ts`. This file adds nothing
 * of its own: it is not a test file, the glob the repository's scripts use
 * (`*.test.ts`) does not match it, and no test runs twice because of it.
 */
import { runSuiteDirectory } from "../suite-entry.ts";

runSuiteDirectory(import.meta.url);
