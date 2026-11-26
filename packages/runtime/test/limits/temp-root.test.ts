/**
 * T023 — the temporary root of one run (F154-FR-043): a made root exists
 * under the system temporary area with the run prefix, two made roots are
 * never the same path, `removeTempRoot` removes the root it is given, and
 * a DEAD path is ignored — the removal never throws.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { makeTempRoot, removeTempRoot, TEMP_ROOT_PREFIX } from "../../src/limits/temp-root.ts";

test("a made temp root exists, under the system temporary area, with the run prefix", () => {
  const root = makeTempRoot();
  try {
    assert.ok(root.startsWith(tmpdir()), `root ${root} is not under ${tmpdir()}`);
    assert.ok(
      join(root, "..").startsWith(tmpdir()) && root.includes(TEMP_ROOT_PREFIX),
      `root ${root} carries no "${TEMP_ROOT_PREFIX}" prefix`,
    );
    assert.ok(existsSync(root), "the made root does not exist");
  } finally {
    removeTempRoot(root);
  }
});

test("two made roots are two different paths", () => {
  const one = makeTempRoot();
  const two = makeTempRoot();
  try {
    assert.notEqual(one, two, "two runs must not share one temporary root");
    assert.ok(existsSync(one) && existsSync(two));
  } finally {
    removeTempRoot(one);
    removeTempRoot(two);
  }
});

test("removeTempRoot removes a made root", () => {
  const root = makeTempRoot();
  assert.ok(existsSync(root));
  removeTempRoot(root);
  assert.equal(existsSync(root), false, "the removed root still exists");
});

test("removeTempRoot ignores a dead path and never throws", () => {
  const root = makeTempRoot();
  removeTempRoot(root);
  // The path is dead now; the removal of it again must be silence.
  assert.doesNotThrow(() => removeTempRoot(root));
  assert.doesNotThrow(() => removeTempRoot(join(root, "never", "existed")));
  assert.equal(existsSync(root), false);
});
