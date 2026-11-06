/**
 * T033, T035, T036 and T037 (phase 9) — the package-level witness of the
 * static eval path and of the publishing rule:
 *
 *  - the real suite files and graders pass the static check (F113-FR-041 (a));
 *  - the eval driver on the stub gives one result per case (F113-FR-041 (b));
 *  - the release check reads the log of the paid runs and matches the hash of
 *    the skill texts (F113-FR-038, T035);
 *  - the publishing rule holds for the REAL manifest, marketplace entry and
 *    documentation (F113-FR-042, T036);
 *  - the person-run runner of the trigger suite (T037) refuses before any call
 *    when it is not started by a person.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  appendRunRecord,
  readRunLog,
  skillTextsHashOf,
  modelIdsFromConfiguration,
  RunRefusedError,
} from "../src/evals/log.ts";
import { releaseCheck } from "../src/evals/release-check.ts";
import {
  assertNoJobStartsTheSuiteRunner,
  checkSuiteFiles,
  type BuildJob,
} from "../src/evals/static-check.ts";
import { evalDriverRun } from "../src/evals/eval-driver.ts";
import { stubSuiteRunner, RECORDED_STUB_RESULTS } from "../src/evals/stub-runner.ts";
import type { TriggerSuiteFile } from "../src/evals/suite-file.ts";
import {
  assertPluginIsPublishedOnlyInsideThePackage,
  documentationNamesTheExactPackage,
  PLUGIN_PACKAGE_NAME,
  validateMarketplaceEntryExactness,
} from "../src/publishing.ts";
import { packageVersion, renderMarketplaceEntry } from "../src/packaging.ts";
import { renderPluginSkills } from "../src/skills.ts";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const suites: readonly TriggerSuiteFile[] = Object.values(
  (
    JSON.parse(readFileSync(join(PKG, "evals/trigger-suites.json"), "utf8")) as {
      suites: Record<string, TriggerSuiteFile>;
    }
  ).suites,
);
const graders = JSON.parse(readFileSync(join(PKG, "evals/graders.json"), "utf8")) as Parameters<
  typeof checkSuiteFiles
>[1];

test("the static check passes on the real suite files (F113-FR-041 (a))", () => {
  const findings = checkSuiteFiles(suites, graders);
  assert.deepEqual(
    findings.filter((finding) => !finding.ok),
    [],
  );
});

test("the eval driver on the stub gives one result per case (F113-FR-041 (b))", () => {
  const reports = suites.flatMap((suite) => evalDriverRun(suite, stubSuiteRunner()));
  assert.equal(reports.length, Object.keys(RECORDED_STUB_RESULTS).length);
});

test("the release check reads the log and matches the hash of the skill texts (T035)", () => {
  const hash = skillTextsHashOf(renderPluginSkills().map((artifact) => artifact.content));
  const modelIds = modelIdsFromConfiguration({
    modelIds: [["the", "model", "of", "the", "run"].join("-")],
  });
  const record = {
    date: "2026-09-30",
    task: "trigger-suite" as const,
    modelIds,
    calls: 36,
    cost: "recorded by the person who ran it",
    skillTextsHash: hash,
    resultPerSkill: suites.map((suite) => ({
      skill: suite.skill,
      scores: [1, 1, 1],
      scored: true,
    })),
    runsNotScored: [],
  };
  const path = join(PKG, "test/.tmp-run-log.jsonl");
  const line = appendRunRecord(path, record);
  try {
    assert.match(line, new RegExp(hash.slice(0, 8)));
    const verdict = releaseCheck(readRunLog(path), { skillTextsHash: hash });
    assert.equal(verdict.passed, true, verdict.reason);
    const otherHash = skillTextsHashOf(["another", "text"]);
    const failed = releaseCheck(readRunLog(path), { skillTextsHash: otherHash });
    assert.equal(failed.passed, false);
    assert.match(failed.reason, /no hash in the log matches/);
  } finally {
    // The witness log is the test's own temporary file: it is removed again.
    rmSync(path, { force: true });
  }
});

test("a configuration that names no model is refused before any call (F113-FR-039)", () => {
  assert.throws(() => modelIdsFromConfiguration({ modelIds: [] }), RunRefusedError);
});

test("the publishing rule holds for the real package (F113-FR-042, T036)", () => {
  const manifest = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8")) as {
    files: string[];
    scripts?: Record<string, string>;
  };
  assertPluginIsPublishedOnlyInsideThePackage({
    packageFiles: manifest.files,
    publishTargets: Object.entries(manifest.scripts ?? {}).map(([name, command]) => ({
      step: `package.json script "${name}": ${command}`,
    })),
  });
  const entry = renderMarketplaceEntry() as { plugins: { package: string; version: string }[] };
  const own = entry.plugins.find((plugin) => plugin.package === PLUGIN_PACKAGE_NAME);
  assert.ok(own !== undefined);
  assert.deepEqual(
    validateMarketplaceEntryExactness(own, {
      packageName: PLUGIN_PACKAGE_NAME,
      version: packageVersion(),
    }),
    [],
  );
  const doc = readFileSync(join(PKG, "PUBLISHING.md"), "utf8");
  assert.equal(
    documentationNamesTheExactPackage(doc, {
      packageName: PLUGIN_PACKAGE_NAME,
      version: packageVersion(),
    }),
    true,
  );
  const jobs: BuildJob[] = Object.entries(manifest.scripts ?? {}).map(([name, command]) => ({
    declaredIn: `package.json script "${name}"`,
    command,
  }));
  assert.doesNotThrow(() => assertNoJobStartsTheSuiteRunner(jobs));
});

test("the runner of the trigger suite refuses when it is not started by a person (T037)", () => {
  const run = spawnSync(process.execPath, [join(PKG, "evals/trigger-suite.ts")], {
    encoding: "utf8",
    env: { ...process.env, SPECSTRIDE_PAID_RUN: undefined },
  });
  assert.equal(run.status, 3, `exit 3, got ${run.status}`);
  assert.match(run.stderr, /PAID task started by a person/);
  assert.match(run.stderr, /F113-FR-038/);
});
