/**
 * T375 (feature 153, phase 27) — the derivation FREEZES the task groups.
 *
 * Through the REAL derivation entry point — `contractDeriveHandler`, the
 * handler of `specstride contract derive`, which resolves the loop
 * configuration and calls the one production `derive` of the pipeline —
 * the case holds:
 *
 *  - with the switch `loop.taskGroups` ON, the written contract carries
 *    `configuration.taskGroups` (`specstride.task-groups-frozen/1`): the
 *    groups per phase, sliced by the ONE pure table (`sliceThePhase`), with
 *    the slicing hash per phase — and the hash CHANGES when a source (a
 *    task's text) changes (F153-FR-054);
 *  - with the switch OFF (its default, rule TG-1), the contract carries NO
 *    `configuration.taskGroups` at all.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { contractDeriveHandler } from "../src/engine/handlers.ts";

/** A git repository with one feature of three tasks in one phase. */
function repository(): { home: string; repo: string; out: string } {
  const home = mkdtempSync(join(tmpdir(), "derive-groups-home-"));
  const repo = mkdtempSync(join(tmpdir(), "derive-groups-repo-"));
  const feature = join(repo, "specs", "001-made");
  mkdirSync(feature, { recursive: true });
  execFileSync("git", ["init", "-q"], { cwd: repo });
  writeFileSync(
    join(feature, "tasks.md"),
    [
      "# Tasks",
      "",
      "## Phase 1: Create",
      "",
      "- [ ] T001 Create `made.txt`",
      "- [ ] T002 Fill `made.txt`",
      "- [ ] T003 Check `made.txt`",
      "",
    ].join("\n"),
  );
  return { home, repo, out: join(repo, ".specstride", "contract.json") };
}

/** The user configuration that switches the slicing on (row 142). */
function switchOn(home: string): void {
  const dir = join(home, ".config", "specstride");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "config.yaml"), "schema: 1\nloop:\n  taskGroups: true\n");
}

function derive(repo: string, out: string): { exit: number; lines: string[] } {
  const lines: string[] = [];
  const exit = contractDeriveHandler(["--repo", repo, "--output", out], {
    out: (text: string): void => {
      lines.push(text);
    },
    err: (text: string): void => {
      lines.push(text);
    },
  });
  return { exit, lines };
}

const TASKS_MD = () =>
  [
    "# Tasks",
    "",
    "## Phase 1: Create",
    "",
    "- [ ] T001 Create `made.txt`",
    "- [ ] T002 Fill `made.txt`",
    "- [ ] T003 Check `made.txt`",
    "",
  ].join("\n");

test("contract derive freezes the task groups into configuration with the switch on", () => {
  const { home, repo, out } = repository();
  const previousHome = process.env.HOME;
  process.env.HOME = home;
  try {
    switchOn(home);
    writeFileSync(join(repo, "specs", "001-made", "tasks.md"), TASKS_MD());
    const first = derive(repo, out);
    assert.equal(first.exit, 0, first.lines.join("\n"));
    const contract = JSON.parse(
      readFileSync(out, "utf8"),
    ) as {
      configuration?: {
        taskGroups?: {
          schema: string;
          hashes: Record<string, string>;
          groups: readonly {
            groupId: string;
            phase: number;
            taskIds: readonly string[];
          }[];
        };
      };
    };
    const frozen = contract.configuration?.taskGroups;
    assert.ok(frozen !== undefined, "the contract froze the groups under `configuration`");
    assert.equal(frozen.schema, "specstride.task-groups-frozen/1");
    assert.match(frozen.hashes["phase1"] ?? "", /^[0-9a-f]+$/, "a slicing hash per phase");
    assert.equal(frozen.groups.length, 1, "three tasks of the default size 5: one group");
    assert.equal(frozen.groups[0]?.groupId, "phase1-g1");
    assert.deepEqual(frozen.groups[0]?.taskIds, ["T001", "T002", "T003"]);
    // F153-FR-054 — a changed source (a task's text) changes the hash.
    writeFileSync(
      join(repo, "specs", "001-made", "tasks.md"),
      TASKS_MD().replace("Fill `made.txt`", "Extend `made.txt`"),
    );
    const second = derive(repo, out);
    assert.equal(second.exit, 0, second.lines.join("\n"));
    const changed = JSON.parse(
      readFileSync(out, "utf8"),
    ) as typeof contract;
    assert.notEqual(
      changed.configuration?.taskGroups?.hashes["phase1"],
      frozen.hashes["phase1"],
      "the hash changes when a task's text changes",
    );
  } finally {
    process.env.HOME = previousHome;
    rmSync(home, { recursive: true, force: true });
    rmSync(repo, { recursive: true, force: true });
  }
});

test("contract derive with the switch off (the default) freezes nothing", () => {
  const { home, repo, out } = repository();
  const previousHome = process.env.HOME;
  process.env.HOME = home;
  try {
    // No configuration at all: the switch stands at its default, OFF.
    const result = derive(repo, out);
    assert.equal(result.exit, 0, result.lines.join("\n"));
    const contract = JSON.parse(readFileSync(out, "utf8")) as {
      configuration?: { taskGroups?: unknown };
    };
    assert.equal(
      contract.configuration?.taskGroups,
      undefined,
      "rule TG-1: the switch off writes no groups",
    );
  } finally {
    process.env.HOME = previousHome;
    rmSync(home, { recursive: true, force: true });
    rmSync(repo, { recursive: true, force: true });
  }
});
