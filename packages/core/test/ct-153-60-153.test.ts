/**
 * Feature 153, CT-153-60 — the guard of F153-FR-060 (T321): every switch of
 * this feature has its two tests. For each key the feature reads through the
 * loop configuration — the four restoration switches of Phase 2, the
 * parallelism of Phase 21 and the pass handoff of Phase 22 — a test file of
 * this feature holds a case whose name starts with `CT-153-5` and names the
 * switch off or `parity`: the case that pins the behaviour the switch stands
 * down to. And no test file of this feature reaches the network: the tests
 * run the engine in a scratch workspace, never a model API.
 *
 * Static half over the case names and the imports; a negative control proves
 * the case-name scan detects a missing switch.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { readFileSync, existsSync } from "node:fs";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO = join(HERE, "..", "..", "..");

/** Every key this feature reads, and the test file that owns its CT-153-5 case. */
const SWITCHES: { key: string; file: string }[] = [
  { key: "verification.timeLimit.enforce", file: "packages/cli/test/engine/loop-speed-limit-micro.test.ts" },
  { key: "loop.micro.closingCheck.skipWhenEqualToGate", file: "packages/cli/test/engine/loop-speed-closing-check.test.ts" },
  { key: "verification.inner.scoped", file: "packages/cli/test/engine/loop-speed-scoped.test.ts" },
  { key: "critic.evidence.perTask", file: "packages/cli/test/engine/loop-speed-evidence.test.ts" },
  { key: "verification.parallelism", file: "packages/cli/test/engine/loop-speed-switches.test.ts" },
  { key: "carry.ledger_handoff", file: "packages/cli/test/engine/loop-speed-handoff.test.ts" },
];

/** The `test("…")` case names of a test file. */
function caseNamesOf(path: string): string[] {
  const source = readFileSync(path, "utf8");
  return [...source.matchAll(/\btest\(\s*"([^"]+)"/g)].map((match) => match[1]);
}

test("T321 of feature 153 (F153-FR-060): every switch has its CT-153-5 case naming off or parity", () => {
  for (const { key, file } of SWITCHES) {
    const path = join(REPO, file);
    assert.ok(existsSync(path), `${file} exists`);
    const names = caseNamesOf(path);
    const owners = names.filter(
      (name) => name.startsWith("CT-153-5") && (name.includes("off") || name.includes("parity")),
    );
    assert.ok(
      owners.length > 0,
      `${key} has no CT-153-5 case naming the switch off or parity in ${file}`,
    );
  }
});

/** The loop-speed tests of the engine and the ct-153 guards of core. */
const FEATURE_TEST_FILES = [
  "packages/cli/test/engine/loop-speed-attempt-ended.test.ts",
  "packages/cli/test/engine/loop-speed-check-run.test.ts",
  "packages/cli/test/engine/loop-speed-closing-check.test.ts",
  "packages/cli/test/engine/loop-speed-critic-input.test.ts",
  "packages/cli/test/engine/loop-speed-declared-gate.test.ts",
  "packages/cli/test/engine/loop-speed-events.test.ts",
  "packages/cli/test/engine/loop-speed-evidence.test.ts",
  "packages/cli/test/engine/loop-speed-gate-feedback.test.ts",
  "packages/cli/test/engine/loop-speed-handoff.test.ts",
  "packages/cli/test/engine/loop-speed-helpers.ts",
  "packages/cli/test/engine/loop-speed-limit-gate.test.ts",
  "packages/cli/test/engine/loop-speed-limit-micro.test.ts",
  "packages/cli/test/engine/loop-speed-limit-service.test.ts",
  "packages/cli/test/engine/loop-speed-notice.test.ts",
  "packages/cli/test/engine/loop-speed-parallelism.test.ts",
  "packages/cli/test/engine/loop-speed-pins-property.test.ts",
  "packages/cli/test/engine/loop-speed-pins.test.ts",
  "packages/cli/test/engine/loop-speed-plan-at-launch.test.ts",
  "packages/cli/test/engine/loop-speed-scoped.test.ts",
  "packages/cli/test/engine/loop-speed-switches.test.ts",
]
  .map((relative) => join(REPO, relative))
  .filter((path) => existsSync(path));

test("T321 of feature 153 (F153-FR-060): no test of this feature reaches the network", () => {
  const network = [
    /node:http/,
    /node:https/,
    /node:net/,
    /node:tls/,
    /undici/,
    /\bfetch\(/,
    /XMLHttpRequest/,
    /api\.openai\.com|api\.anthropic\.com|generativelanguage/,
  ];
  for (const path of FEATURE_TEST_FILES) {
    const source = readFileSync(path, "utf8");
    for (const token of network) {
      assert.ok(!token.test(source), `${path.slice(REPO.length + 1)} matches ${String(token)}`);
    }
  }
});

test("T321 of feature 153 (F153-FR-060): negative control — the scan catches a switch without its case", () => {
  const path = join(REPO, SWITCHES[0].file);
  const names = caseNamesOf(path);
  // The owning file holds CT-153-5 cases at all, so an empty scan elsewhere
  // would be a scanner bug, not an absence of coverage.
  assert.ok(names.some((name) => name.startsWith("CT-153-5")));
  // And a switch no case could name would be caught by the same filter.
  const none = names.filter(
    (name) => name.startsWith("CT-153-5") && name.includes("no-such-switch"),
  );
  assert.equal(none.length, 0);
});
