/**
 * T264 — the runner of the static tests (annex X, §X.10; F100-FR-225,
 * F100-FR-226; F100-SC-003; quickstart.md scenario 3).
 *
 * It runs every check of `src/static/` over the feature directories of
 * `specs` and over the `contracts` package, and reports each as one test. It
 * is the script `test:static` of the package.
 *
 * T305 — the run reads `TESTKIT_STATIC_SCOPE` (feature folder names separated
 * by commas; unset or empty means every feature). The checks that read the
 * specifications take the named folders as their SUBJECT and still read every
 * folder of `specs` whose name starts with 1 as REFERENCE; a named folder that
 * does not exist fails the run; the checks of the `contracts` package are not
 * scoped (owner ruling of 2026-09-30; F100-FR-225, F100-FR-226 as amended).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { vocabularyAndRegistryCheck } from "./product-rules.ts";
import { platformAndCriticSessionCheck } from "./product-rules-platform.ts";
import { packagingCheck } from "./product-rules-packaging.ts";
import { licenceLanguageAndLoopLayersCheck } from "./product-rules-vocabulary.ts";
import { profileCheck } from "./profile.ts";
import { closedSetsCheck } from "./closed-sets.ts";
import { schemaFieldCheck } from "./schema-field.ts";
import { logicalNamesCheck } from "./logical-names.ts";
import { physicalPathsCheck } from "./physical-paths.ts";
import { vocabularyCheck } from "./vocabulary.ts";
import { reviewCheck } from "./static-review.ts";
import { threatModelCheck } from "./threat-model.ts";
import { noListenerCheck } from "./no-listener.ts";
import {
  STATIC_SCOPE_VARIABLE,
  UnknownScopeError,
  scopeFromEnvironment,
  scopedSpecDirectories,
} from "./kit.ts";
import type { CheckOptions, Finding, StaticCheck } from "./kit.ts";

export * from "./kit.ts";
export { vocabularyAndRegistryCheck } from "./product-rules.ts";
export { platformAndCriticSessionCheck } from "./product-rules-platform.ts";
export { packagingCheck } from "./product-rules-packaging.ts";
export { licenceLanguageAndLoopLayersCheck } from "./product-rules-vocabulary.ts";
export { profileCheck } from "./profile.ts";
export { closedSetsCheck } from "./closed-sets.ts";
export { schemaFieldCheck } from "./schema-field.ts";
export { logicalNamesCheck } from "./logical-names.ts";
export { physicalPathsCheck } from "./physical-paths.ts";
export { vocabularyCheck } from "./vocabulary.ts";
export { reviewCheck, review } from "./static-review.ts";
export { threatModelCheck, checkThreatModel } from "./threat-model.ts";
export {
  noListenerCheck,
  checkNoListener,
  checkNoListenerAndIngress,
  checkIngressFramesOutsideText,
  absentPackages,
} from "./no-listener.ts";
export * as budget from "./budget.ts";

/**
 * Every check of `src/static/`: the four of the product-wide rules (T018,
 * T239, T240, T241), the profile (T259), the closed sets (T076), the schema
 * field (T260), the logical names (T261), the physical paths (T262), the
 * vocabulary (T263), the review (T265), the threat model (T286) and the
 * listener and ingress checks (T287).
 */
export const CHECKS: readonly StaticCheck[] = Object.freeze([
  vocabularyAndRegistryCheck,
  platformAndCriticSessionCheck,
  packagingCheck,
  licenceLanguageAndLoopLayersCheck,
  profileCheck,
  closedSetsCheck,
  schemaFieldCheck,
  logicalNamesCheck,
  physicalPathsCheck,
  vocabularyCheck,
  reviewCheck,
  threatModelCheck,
  noListenerCheck,
]);

/** The result of one check. */
export type CheckResult = {
  readonly name: string;
  readonly covers: readonly string[];
  readonly findings: readonly Finding[];
};

/**
 * T305 — the checks whose SUBJECT the scope narrows: the physical paths (T262),
 * the vocabulary (T263), the review (T265) and the harness-list check of T018,
 * which `reviewCheck` and `vocabularyAndRegistryCheck` carry. Every other check
 * reads the `contracts` package, or the whole corpus as reference, and is not
 * scoped.
 */
export const SCOPED_CHECKS: readonly string[] = Object.freeze([
  physicalPathsCheck.name,
  vocabularyCheck.name,
  reviewCheck.name,
  vocabularyAndRegistryCheck.name,
]);

/** True where the scope narrows the subject of this check (T305). */
export function isScoped(check: StaticCheck): boolean {
  return SCOPED_CHECKS.includes(check.name);
}

/**
 * T305 — the options of one check under a scope. A check the scope does not
 * narrow is run over every folder; the checks of the `contracts` package never
 * see the scope at all.
 */
export function optionsFor(check: StaticCheck, options: CheckOptions = {}): CheckOptions {
  return isScoped(check) ? options : { ...options, scope: [] };
}

/**
 * T305 — the scope of a run, and the folders it resolves to. A named folder
 * that `specs` does not hold throws `UnknownScopeError`, so the run fails
 * rather than silently check nothing (F100-FR-226).
 */
export function resolveScope(options: CheckOptions = {}): {
  readonly scope: readonly string[];
  readonly directories: readonly string[];
} {
  const scope = options.scope ?? scopeFromEnvironment();
  // Throws UnknownScopeError on a folder that does not exist.
  const directories = scopedSpecDirectories({ ...options, scope });
  return Object.freeze({ scope: Object.freeze([...scope]), directories });
}

/** Run every check and give its result; the runner reports each as one test. */
export function runAll(options: CheckOptions = {}): readonly CheckResult[] {
  const { scope } = resolveScope(options);
  return Object.freeze(
    CHECKS.map((check) =>
      Object.freeze({
        name: check.name,
        covers: check.covers,
        findings: check.run(optionsFor(check, { ...options, scope })),
      }),
    ),
  );
}

/** One finding as a line the runner prints: the file, the line and the value. */
export function formatFinding(f: Finding): string {
  const at = f.line > 0 ? `${f.file}:${f.line}` : f.file;
  return f.value === undefined ? `${at} — ${f.message}` : `${at} — ${f.message} [${f.value}]`;
}

/** The report of a check that failed: every finding, one per line. */
export function report(result: CheckResult): string {
  return [
    `${result.name} (${result.covers.join(", ")}): ${result.findings.length} finding(s)`,
    ...result.findings.map((f) => `  ${formatFinding(f)}`),
  ].join("\n");
}

// The runner: one test per check (T264), under the scope of T305.
// `node --test src/static/index.ts` is the script `test:static` of the package.
const SCOPE = scopeFromEnvironment();

// T305 — a folder the scope names that `specs` does not hold fails the RUN, not
// one check: it is reported as its own test, before the checks.
test(`static: the scope of ${STATIC_SCOPE_VARIABLE} names folders that exist (F100-FR-226)`, () => {
  let directories: readonly string[] = [];
  try {
    directories = resolveScope({ scope: SCOPE }).directories;
  } catch (error) {
    assert.ok(error instanceof UnknownScopeError, String(error));
    assert.fail((error as UnknownScopeError).message);
  }
  assert.ok(
    directories.length > 0,
    `the scope resolves to no folder of \`specs\` (${STATIC_SCOPE_VARIABLE}=${SCOPE.join(",")})`,
  );
});

for (const check of CHECKS) {
  const scoped = isScoped(check) && SCOPE.length > 0;
  const label = scoped ? ` [scope: ${SCOPE.join(", ")}]` : "";
  test(`static: ${check.name} (${check.covers.join(", ")})${label}`, () => {
    const findings = check.run(optionsFor(check, { scope: SCOPE }));
    assert.deepEqual(
      findings.map(formatFinding),
      [],
      report({ name: check.name, covers: check.covers, findings }),
    );
  });
}
