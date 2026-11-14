/**
 * CT-152-23 — the enforcement stays in the engine (F152-FR-023).
 *
 * No file the proposer's tools can write — a git hook, a script, a
 * configuration of the repository — takes part in deciding whether the
 * approval commit is blocked, and the outcome never depends on whether such a
 * file exists. This test pins the negative, statically, over every source file
 * this feature added or changed:
 *
 * - none of them names the git-hook mechanism (`.git/hooks`, `--no-verify`,
 *   `core.hooksPath`), so the gate cannot be disarmed or re-armed by anything
 *   under the repository the agent owns;
 * - the gate module never spawns a process at all: it imports nothing from
 *   `node:child_process`, so the decision is computed from the rule data and
 *   the scan port, never shelled out.
 *
 * The composition root `run-feature.ts` already spawned processes before this
 * feature (the proposer, the critic, git itself); the check that matters is
 * the one over `commit-gate.ts`, which is new code.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
/** The repository root, three levels above `packages/core/test`. */
const ROOT = join(HERE, "..", "..", "..");

/** Every source file feature 152 added or changed (plan, "Change map"). */
const FILES_OF_THE_FEATURE = [
  "packages/core/src/post-approval/commit-gate.ts",
  "packages/core/src/post-approval/order.ts",
  "packages/core/src/gate/feedback.ts",
  "packages/core/src/gate/limits.ts",
  "packages/core/src/gate/events.ts",
  "packages/core/src/engine/phase.ts",
  "packages/core/src/approval/verify.ts",
  "packages/core/src/approval/commit-gate-resume.ts",
  "packages/kernel/src/redactor/commit-gate-rules.ts",
  "packages/kernel/src/redactor/scan.ts",
  "packages/observability/src/ingress/ingress.ts",
  "packages/contracts/src/state/blocked-reasons.ts",
  "packages/cli/src/engine/run-feature.ts",
  "packages/cli/src/engine/loop-config.ts",
  "packages/cli/src/engine/commit-lines.ts",
] as const;

const FORBIDDEN = [".git/hooks", "--no-verify", "core.hooksPath"] as const;

test("no file of the feature names the git-hook mechanism (F152-FR-023)", () => {
  for (const relative of FILES_OF_THE_FEATURE) {
    const text = readFileSync(join(ROOT, relative), "utf8");
    for (const needle of FORBIDDEN) {
      assert.equal(
        text.includes(needle),
        false,
        `${relative} names ${needle}: the gate must never touch the hook mechanism the proposer's tools can write`,
      );
    }
  }
});

test("the commit gate never shells out (F152-FR-023)", () => {
  const gate = readFileSync(join(ROOT, "packages/core/src/post-approval/commit-gate.ts"), "utf8");
  assert.equal(
    gate.includes("node:child_process"),
    false,
    "commit-gate.ts imports node:child_process: the gate's decision must be computed, not spawned",
  );
  assert.equal(gate.includes("spawn("), false);
  assert.equal(gate.includes("spawnSync("), false);
});
