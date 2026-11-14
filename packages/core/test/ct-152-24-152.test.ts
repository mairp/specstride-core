/**
 * CT-152-24 — shared control flow of this feature tests no harness name
 * (F152-FR-024, Principle VII).
 *
 * Over every module this feature added or changed, EXCEPT the composition
 * root `run-feature.ts` — whose harness adapters (`spawn("claude", …)`, the
 * `dshModel` read) predate this feature and belong to their own features — no
 * string literal names a harness (`claude`, `dsh`, `codex`, `pi`, `prime`),
 * and no branch compares a harness name (`harness ===`). The control flow of
 * the commit gate, its bounds, its feedback, its rule data and its records is
 * the same for every harness; only an adapter table, owned by its own
 * feature, may name one.
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
  "packages/cli/src/engine/loop-config.ts",
  "packages/cli/src/engine/commit-lines.ts",
] as const;

/** The harness names no control-flow file of this feature may name. */
const HARNESS_NAMES = ["claude", "dsh", "codex", "pi", "prime"] as const;

test("no file of the feature names a harness as a literal (F152-FR-024)", () => {
  for (const relative of FILES_OF_THE_FEATURE) {
    const text = readFileSync(join(ROOT, relative), "utf8");
    for (const name of HARNESS_NAMES) {
      // As a STRING LITERAL only: quoted with any of the three quotes. A word
      // that merely contains the letters (for example `pip` inside a longer
      // identifier) is not a harness name.
      const literal = new RegExp(`['"\`]${name}['"\`]`);
      assert.equal(
        literal.test(text),
        false,
        `${relative} holds the string literal "${name}": control flow must not test a harness name`,
      );
    }
    assert.equal(
      text.includes("harness ==="),
      false,
      `${relative} compares a harness name: control flow must not branch on one`,
    );
  }
});
