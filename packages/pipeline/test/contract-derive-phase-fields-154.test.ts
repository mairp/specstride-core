/**
 * T132 — the phase dependency fields travel through the derivation (feature
 * 154, US6, F154-FR-056).
 *
 * `contract-derive` reads the tasks through the canonical model ONLY
 * (F107-FR-007), and the model's phases carry the specstride dependency line
 * of F154-FR-056 (`dependsOn`, `writeScope`). The coverage entries the draft
 * carries copy those fields per task — `phase_depends_on` (always, the EMPTY
 * list when the phase declares none) and `phase_write_scope` (only when the
 * phase declares one) — so the launch contract is the one place the engine
 * reads the declarations from; an unclassified task carries neither.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { derive, type DeriveArgs } from "../src/contract/commands/derive.ts";
import type { CoverageEntry } from "../src/contract/draft/build.ts";

function aRepository(): string {
  const repo = mkdtempSync(join(tmpdir(), "derive-phase-fields-154-"));
  const feature = join(repo, "specs", "001-phases");
  mkdirSync(join(feature, "packages", "a"), { recursive: true });
  mkdirSync(join(feature, "packages", "b"), { recursive: true });
  execFileSync("git", ["init", "-q"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "# made\n", "utf8");
  writeFileSync(join(feature, "spec.md"), "# Feature Specification: Phases\n");
  writeFileSync(join(feature, "plan.md"), "# Implementation Plan: Phases\n");
  writeFileSync(
    join(feature, "tasks.md"),
    [
      "# Tasks",
      "",
      "## Phase 1: One",
      "",
      "- [ ] T001 Phase 1",
      "",
      "## Phase 2: Two",
      "<!-- specstride: depends-on: [1] scope: packages/a/ -->",
      "",
      "- [ ] T002 Phase 2",
      "",
      "## Phase 3: Three",
      "<!-- specstride: depends-on: [1] scope: packages/b/ -->",
      "",
      "- [ ] T003 Phase 3",
      "",
    ].join("\n"),
    "utf8",
  );
  return repo;
}

type Derived = { coverage?: readonly CoverageEntry[] };

test("the coverage of a phase carries its declared fields", () => {
  const repo = aRepository();
  const draftPath = join(repo, "contract.json");
  try {
    const args: DeriveArgs = { repo, feature: ["specs/001-phases"], output: draftPath };
    const derived = derive(args);
    assert.equal(derived.exitCode, 0, `${derived.stdout}${derived.stderr}`);
    const draft = JSON.parse(readFileSync(draftPath, "utf8")) as Derived;
    const coverage = draft.coverage ?? [];

    const ofTiming = (timing: string): readonly CoverageEntry[] =>
      coverage.filter((one) => one.timing === timing);

    // Phase 2: declared dependency [1], declared scope packages/a/.
    const phase2 = ofTiming("specstride-phase:2");
    assert.ok(phase2.length > 0, "phase 2 has coverage entries");
    for (const entry of phase2) {
      assert.deepEqual(entry.phase_depends_on, [1]);
      assert.deepEqual(entry.phase_write_scope, ["packages/a/"]);
    }

    // Phase 3: declared dependency [1], declared scope packages/b/.
    const phase3 = ofTiming("specstride-phase:3");
    assert.ok(phase3.length > 0, "phase 3 has coverage entries");
    for (const entry of phase3) {
      assert.deepEqual(entry.phase_depends_on, [1]);
      assert.deepEqual(entry.phase_write_scope, ["packages/b/"]);
    }

    // Phase 1: NO line — the EMPTY declared list, and no write scope.
    const phase1 = ofTiming("specstride-phase:1");
    assert.ok(phase1.length > 0, "phase 1 has coverage entries");
    for (const entry of phase1) {
      assert.deepEqual(entry.phase_depends_on, []);
      assert.equal("phase_write_scope" in entry, false);
    }
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
