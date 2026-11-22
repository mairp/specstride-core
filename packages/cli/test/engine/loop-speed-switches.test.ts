/**
 * The four speed switches of feature 153 (F153-FR-005, F153-FR-012,
 * F153-FR-029, F153-FR-045, F153-FR-051), as `loopConfigurationOf` reads them
 * through the real configuration of feature 110:
 *
 *  - CT-153-5 — the defaults: every switch is on with no configuration file;
 *    under `profile: parity` the three restoration switches are off and the
 *    enforced time limit stays on (CQ-153-13 answered A on 2026-11-13: a
 *    ruled defect fix);
 *  - CT-153-9 — a project file may only narrow: a project file that would
 *    turn `verification.timeLimit.enforce` off is ignored, while the same
 *    value in the user file turns it off.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { loopConfigurationOf } from "../../src/engine/loop-config.ts";

function fixture(input?: {
  readonly userConfig?: string;
  readonly projectFile?: string;
}): { readonly home: string; readonly dir: string; readonly root: string } {
  const root = mkdtempSync(join(tmpdir(), "specstride-loop-speed-"));
  const home = join(root, "home");
  const dir = join(root, "work");
  mkdirSync(home);
  mkdirSync(dir);
  if (input?.userConfig !== undefined) {
    const userConfig = join(home, ".config", "specstride");
    mkdirSync(userConfig, { recursive: true });
    writeFileSync(join(userConfig, "config.yaml"), input.userConfig);
  }
  if (input?.projectFile !== undefined) {
    writeFileSync(join(dir, "specstride.yaml"), input.projectFile);
  }
  return { home, dir, root };
}

const ENV: NodeJS.ProcessEnv = { PATH: process.env.PATH ?? "" };

test("CT-153-5 defaults: the four switches are on with no configuration file", () => {
  const { home, dir, root } = fixture();
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(loop.timeLimitEnforced, true, "F153-FR-029: the time limit is enforced");
    assert.equal(
      loop.closingCheckSkipsWhenEqualToGate,
      true,
      "F153-FR-012: the closing check skips when equal to the gate",
    );
    assert.equal(loop.innerChecksAreScoped, true, "F153-FR-045: the inner checks are scoped");
    assert.equal(
      loop.criticEvidenceIsPerTask,
      true,
      "F153-FR-051: the critic evidence is per task",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("CT-153-5 under parity: the restorations stand down, the defect fix stays on", () => {
  const { home, dir, root } = fixture({ userConfig: "schema: 1\nprofile: parity\n" });
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(loop.closingCheckSkipsWhenEqualToGate, false, "row 136: off under parity");
    assert.equal(loop.innerChecksAreScoped, false, "row 137: off under parity");
    assert.equal(loop.criticEvidenceIsPerTask, false, "row 138: off under parity");
    assert.equal(
      loop.timeLimitEnforced,
      true,
      "row 135: on under parity (CQ-153-13 answered A on 2026-11-13: a ruled defect fix)",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("CT-153-9 a project file only narrows: it cannot turn the enforced time limit off", () => {
  const { home, dir, root } = fixture({
    projectFile: "schema: 1\nverification:\n  timeLimit:\n    enforce: false\n",
  });
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(
      loop.timeLimitEnforced,
      true,
      "F153-FR-005: lifting the limit is not narrowing, so the project-file offer is ignored",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("CT-153-5 under parity verification.parallelism is 1 (F148 row 7, F153-FR-060)", () => {
  const { home, dir, root } = fixture({ userConfig: "schema: 1\nprofile: parity\n" });
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(loop.verificationParallelism, 1, "row 7 of feature 148: 1 under parity");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("CT-153-5 under parity carry.ledger_handoff stands down: every pass is fresh (F153-FR-060)", () => {
  const { home, dir, root } = fixture({
    userConfig: "schema: 1\nprofile: parity\ncarry:\n  ledger_handoff: true\n",
  });
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(
      loop.ledgerHandoff,
      false,
      "F153-FR-059: parity keeps every pass fresh, whatever a source holds",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("CT-153-9 the same value in the user file turns the enforced time limit off", () => {
  const { home, dir, root } = fixture({
    userConfig: "schema: 1\nverification:\n  timeLimit:\n    enforce: false\n",
  });
  try {
    const loop = loopConfigurationOf({ home, workdir: dir, environment: ENV });
    assert.equal(loop.timeLimitEnforced, false, "the user file decides the switch");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("CT-153-9 the parallelism cannot be widened: above the ceiling, and above a lower user value", () => {
  // A value outside 1 to 4 — 9 — is REFUSED by the catalogue (F148-FR-011:
  // the type of the key is `integer 1 to 4`), so the default 1 stands; the
  // value is never widened above the ceiling.
  const above = fixture({ userConfig: "schema: 1\nverification:\n  parallelism: 9\n" });
  try {
    const loop = loopConfigurationOf({ home: above.home, workdir: above.dir, environment: ENV });
    assert.equal(loop.verificationParallelism, 1, "9 is refused; the default 1 stands");
  } finally {
    rmSync(above.root, { recursive: true, force: true });
  }
  // The trust class is `N lo`: the project file cannot raise the value the
  // user file set — the lowest whole value any source held stands.
  const raised = fixture({
    userConfig: "schema: 1\nverification:\n  parallelism: 2\n",
    projectFile: "schema: 1\nverification:\n  parallelism: 4\n",
  });
  try {
    const loop = loopConfigurationOf({ home: raised.home, workdir: raised.dir, environment: ENV });
    assert.equal(loop.verificationParallelism, 2, "the project file cannot raise 2 to 4");
  } finally {
    rmSync(raised.root, { recursive: true, force: true });
  }
});

test("CT-153-5 the red-gate budget: on by default, off under parity, the limit lowest-wins", () => {
  // No source holds a value: the switch is on and the limit is the default 3.
  const plain = fixture();
  try {
    const loop = loopConfigurationOf({ home: plain.home, workdir: plain.dir, environment: ENV });
    assert.equal(loop.redGateOwnBudget, true, "F153-FR-020: the switch is on by default");
    assert.equal(loop.redGateLimit, 3, "F153-FR-021: the default limit is 3 (CQ-153-05 A)");
  } finally {
    rmSync(plain.root, { recursive: true, force: true });
  }
  // Under `parity` the switch stands down whatever a source holds (row 139).
  const parity = fixture({
    userConfig: "schema: 1\nprofile: parity\nverification:\n  redGate:\n    ownBudget: true\n",
  });
  try {
    const loop = loopConfigurationOf({ home: parity.home, workdir: parity.dir, environment: ENV });
    assert.equal(
      loop.redGateOwnBudget,
      false,
      "row 139: under parity a red gate counts toward the reject limit",
    );
    assert.equal(loop.redGateLimit, 3, "the limit reads as default under parity");
  } finally {
    rmSync(parity.root, { recursive: true, force: true });
  }
  // The trust class is `N lo`: the project file may lower the limit the user
  // file set, never raise it — the lowest whole value any source held stands.
  const lowered = fixture({
    userConfig: "schema: 1\nverification:\n  redGate:\n    limit: 5\n",
    projectFile: "schema: 1\nverification:\n  redGate:\n    limit: 2\n",
  });
  try {
    const loop = loopConfigurationOf({ home: lowered.home, workdir: lowered.dir, environment: ENV });
    assert.equal(loop.redGateLimit, 2, "the project file lowers 5 to 2");
  } finally {
    rmSync(lowered.root, { recursive: true, force: true });
  }
  const raised = fixture({
    userConfig: "schema: 1\nverification:\n  redGate:\n    limit: 2\n",
    projectFile: "schema: 1\nverification:\n  redGate:\n    limit: 5\n",
  });
  try {
    const loop = loopConfigurationOf({ home: raised.home, workdir: raised.dir, environment: ENV });
    assert.equal(loop.redGateLimit, 2, "the project file cannot raise 2 to 5");
  } finally {
    rmSync(raised.root, { recursive: true, force: true });
  }
});

test("CT-153-9 a red-gate limit that is not a whole number >= 1 is refused, the default stands", () => {
  // The merge of feature 110 refuses a value outside the catalogue's type
  // (`whole number, at least 1`) at the rank that held it, as it refuses a
  // parallelism of 9 — the value never reaches the reader, and the default 3
  // stands: the limit is never clamped into shape and never widened.
  for (const limit of ["0", "-2", "two", "1.5", "true"]) {
    const bad = fixture({
      userConfig: `schema: 1\nverification:\n  redGate:\n    limit: ${limit}\n`,
    });
    try {
      const loop = loopConfigurationOf({ home: bad.home, workdir: bad.dir, environment: ENV });
      assert.equal(loop.redGateLimit, 3, `the value ${limit} is refused; the default 3 stands`);
    } finally {
      rmSync(bad.root, { recursive: true, force: true });
    }
  }
  // The reader keeps its own refusal for a value a rank hands it that the
  // merge did not check: the guard throws, never guesses (F153-FR-021).
  const bad = fixture({
    userConfig: "schema: 1\nverification:\n  redGate:\n    limit: 2\n",
    projectFile: "schema: 1\nverification:\n  redGate:\n    limit: 4\n",
  });
  try {
    const loop = loopConfigurationOf({ home: bad.home, workdir: bad.dir, environment: ENV });
    assert.equal(loop.redGateLimit, 2, "the lower value stands");
  } finally {
    rmSync(bad.root, { recursive: true, force: true });
  }
});
