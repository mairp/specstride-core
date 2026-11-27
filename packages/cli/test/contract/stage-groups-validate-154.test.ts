/**
 * T116 — the CLI refusals of the wide stage graph (F154-FR-048, F154-FR-002):
 * `contract validate` (the verb `contract`, the handler `validateContract` of
 * `packages/pipeline/src/contract/commands/validate.ts`) refuses a contract
 * whose `depends_on` holds a cycle, one that names an unknown stage, and one
 * whose `configuration.stageGroups.never_together` lists a stage outside the
 * declared stages — each with exit 20 and its one-line reason — and in none
 * of the three does a run start: no execution artifact is written.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { derive, type DeriveArgs } from "../../../pipeline/src/contract/commands/derive.ts";
import { validateContract } from "../../../pipeline/src/contract/commands/validate.ts";

/** A repository with one feature, as Spec Kit lays it out (two tasks). */
function aRepository(): string {
  const repo = mkdtempSync(join(tmpdir(), "cli-stage-groups-154-"));
  const feature = join(repo, "specs", "001-made");
  mkdirSync(feature, { recursive: true });
  execFileSync("git", ["init", "-q"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "# made\n", "utf8");
  writeFileSync(
    join(feature, "spec.md"),
    "# Feature Specification: Made\n\n- **FR-001**: it makes.\n",
    "utf8",
  );
  writeFileSync(
    join(feature, "plan.md"),
    [
      "# Implementation Plan: Made",
      "",
      "## Verification",
      "",
      "```bash",
      "python3 -m unittest discover -s tests -v",
      "```",
      "",
    ].join("\n"),
    "utf8",
  );
  writeFileSync(
    join(feature, "tasks.md"),
    [
      "# Tasks: Made",
      "",
      "## Phase 1: Setup",
      "- [ ] T001 Stage A",
      "- [ ] T002 [P] Stage B",
      "",
    ].join("\n"),
    "utf8",
  );
  return repo;
}

/** Derive the draft once and hand its record back, with the file path. */
function aDraft(repo: string): { file: string; record: Record<string, unknown> } {
  const file = join(repo, "contract.json");
  const args: DeriveArgs = { repo, feature: ["specs/001-made"], output: file };
  const derived = derive(args);
  assert.equal(derived.exitCode, 0, `${derived.stdout}${derived.stderr}`);
  const record = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
  return { file, record };
}

/** The declared stages of the fixture: {A, B}, B after A (`depends_on: [A]`). */
const FIXTURE_STAGES = [
  {
    id: "A",
    kind: "specstride",
    depends_on: [],
    cwd: ".",
    preconditions: [],
    postconditions: [{ check: "file_exists", timing: "stage", params: { path: "README.md" } }],
    evidence: [],
  },
  {
    id: "B",
    kind: "specstride",
    depends_on: ["A"],
    cwd: ".",
    preconditions: [],
    postconditions: [{ check: "file_exists", timing: "stage", params: { path: "README.md" } }],
    evidence: [],
  },
];

/** The stage ids of a derived draft, in declared order. */
function stageIdsOf(record: Record<string, unknown>): string[] {
  return (record.stages as { id: string }[]).map((stage) => stage.id);
}

/** A listing of every file of the repository, relative, for the no-run check. */
function inventoryOf(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(full.slice(root.length + 1));
    }
  };
  walk(root);
  return out.sort();
}

test("a derived draft without a stageGroups declaration still validates", () => {
  const repo = aRepository();
  try {
    const { file, record } = aDraft(repo);
    record.stages = structuredClone(FIXTURE_STAGES);
    writeFileSync(file, JSON.stringify(record, null, 2), "utf8");
    const result = validateContract({ file, root: repo, allowDraft: true });
    assert.equal(result.exitCode, 0, `${result.stdout}${result.stderr}`);
  } finally {
    repo && existsSync(repo) && execFileSync("rm", ["-rf", repo]);
  }
});

test("a depends_on cycle is refused with exit 20 and no run starts", () => {
  const repo = aRepository();
  try {
    const { file, record } = aDraft(repo);
    record.stages = structuredClone(FIXTURE_STAGES);
    const stages = record.stages as { id: string; depends_on: string[] }[];
    stages[0]!.depends_on = [stages[stages.length - 1]!.id];
    writeFileSync(file, JSON.stringify(record, null, 2), "utf8");
    const before = inventoryOf(repo).join("\n");
    const result = validateContract({ file, root: repo, allowDraft: true });
    assert.equal(result.exitCode, 20);
    assert.match(result.stderr, /cycle/);
    assert.match(result.stderr, /depends_on/);
    // No run starts: the repository holds exactly the files it held before
    // the refusal — no state, no launcher, no execution artifact.
    assert.equal(inventoryOf(repo).join("\n"), before);
  } finally {
    execFileSync("rm", ["-rf", repo]);
  }
});

test("an unknown stage in depends_on is refused with exit 20", () => {
  const repo = aRepository();
  try {
    const { file, record } = aDraft(repo);
    record.stages = structuredClone(FIXTURE_STAGES);
    const stages = record.stages as { id: string; depends_on: string[] }[];
    stages[stages.length - 1]!.depends_on = ["not-a-declared-stage"];
    writeFileSync(file, JSON.stringify(record, null, 2), "utf8");
    const before = inventoryOf(repo).join("\n");
    const result = validateContract({ file, root: repo, allowDraft: true });
    assert.equal(result.exitCode, 20);
    assert.match(result.stderr, /unknown stage/);
    assert.match(result.stderr, /not-a-declared-stage/);
    assert.equal(inventoryOf(repo).join("\n"), before);
  } finally {
    execFileSync("rm", ["-rf", repo]);
  }
});

test("a never_together pair naming an unknown stage is refused with exit 20", () => {
  const repo = aRepository();
  try {
    const { file, record } = aDraft(repo);
    record.stages = structuredClone(FIXTURE_STAGES);
    const ids = stageIdsOf(record);
    record.configuration = {
      ...(record.configuration as Record<string, unknown>),
      stageGroups: {
        width: 2,
        never_together: [{ stages: [ids[0]!, "ghost-stage"], why: "one lock" }],
      },
    };
    writeFileSync(file, JSON.stringify(record, null, 2), "utf8");
    const before = inventoryOf(repo).join("\n");
    const result = validateContract({ file, root: repo, allowDraft: true });
    assert.equal(result.exitCode, 20);
    assert.match(result.stderr, /never_together/);
    assert.match(result.stderr, /ghost-stage/);
    assert.ok(result.stderr.includes(ids[0]!), "the reason names the offending pair");
    assert.equal(inventoryOf(repo).join("\n"), before);
  } finally {
    execFileSync("rm", ["-rf", repo]);
  }
});
