/**
 * The name of the proposer of a run (F124-FR-026): the as-is variable
 * `SPECSTRIDE_PROPOSER` and the row-36 key `roles.proposer.harness` of the
 * user configuration both reach the engine, with the ranks of F110-FR-014
 * deciding — the variable wins over the user file, and a selection in the
 * project file is dropped by the trust filter (F110-FR-017, T019), exactly
 * as it is for the critic. Without either source the engine runs its default.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { proposerNameOf } from "../../src/engine/loop-config.ts";

function fixture(input?: { readonly userConfig?: string; readonly projectFile?: string }): {
  readonly home: string;
  readonly dir: string;
  readonly root: string;
} {
  const root = mkdtempSync(join(tmpdir(), "specstride-proposer-"));
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

const USER_SELECTION = "schema: 1\nroles:\n  proposer:\n    harness: dsh:compass-gpt5-high/gpt-5\n";

test("with no variable and no user configuration the proposer is unnamed (the engine default)", () => {
  const { home, dir, root } = fixture();
  try {
    assert.equal(proposerNameOf({ home, workdir: dir, environment: {} }), undefined);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the user configuration names the proposer (F124-FR-026)", () => {
  const { home, dir, root } = fixture({ userConfig: USER_SELECTION });
  try {
    assert.equal(
      proposerNameOf({ home, workdir: dir, environment: {} }),
      "dsh:compass-gpt5-high/gpt-5",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the as-is variable wins over the user configuration (rank 4 over rank 6)", () => {
  const { home, dir, root } = fixture({ userConfig: USER_SELECTION });
  try {
    assert.equal(
      proposerNameOf({
        home,
        workdir: dir,
        environment: { SPECSTRIDE_PROPOSER: "dsh:other-provider/gpt-5" },
      }),
      "dsh:other-provider/gpt-5",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the project configuration names the proposer: the key's trust class is neutral", () => {
  const { home, dir, root } = fixture({
    projectFile: "schema: 1\nroles:\n  proposer:\n    harness: dsh:compass-gpt5-high/gpt-5\n",
  });
  try {
    assert.equal(
      proposerNameOf({ home, workdir: dir, environment: {} }),
      "dsh:compass-gpt5-high/gpt-5",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("an empty variable is a rank-4 value that shadows the user file (the engine default)", () => {
  const { home, dir, root } = fixture({ userConfig: USER_SELECTION });
  try {
    assert.equal(
      proposerNameOf({ home, workdir: dir, environment: { SPECSTRIDE_PROPOSER: "" } }),
      undefined,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
