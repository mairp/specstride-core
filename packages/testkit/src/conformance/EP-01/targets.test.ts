/**
 * T004 of `specs/113-host-claude-code/tasks.md` — the plain shell host is
 * recorded as the SECOND target of the host conformance suite (F113-FR-034),
 * and the host's own target is an input of the suite.
 *
 * The record of `targets.ts` is held against two independent read paths: the
 * sample module of EP-01 in the test tree (its own `implementation.id`), and
 * the built-in target the suite's frame holds. Neither is a claim of this
 * file. The facts of a particular host (its id, its source, its package) are
 * held where that host is: its own suite binding.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { POINT_ID as HOST_POINT_ID } from "@specstride/contracts/ep/host";
import { implementation as plainShell } from "../../samples/EP-01/index.ts";
import { ROOT } from "../frame.ts";
import {
  hostConformanceTargets,
  LIVE_HOST_CASE,
  LIVE_HOST_SKIP_REASON,
  PLAIN_SHELL_IMPLEMENTATION_ID,
  PLAIN_SHELL_TARGET,
  SECOND_TARGET,
  TARGET_FIXTURE,
  targetAt,
  type ConformanceTarget,
} from "./targets.ts";

/** A sample first target of this test: no host of the repository is named. */
const aSampleHost: ConformanceTarget = Object.freeze({
  order: 1 as const,
  implementationId: "sample-host-of-the-targets-test",
  host: "a sample host of this test, standing for any host package of the port",
  source: "packages/testkit/src/conformance/EP-01/targets.test.ts",
  live: false as const,
  requirement: "KIT-FR-01",
});

test("T004: a host suite has two targets — the host's own input first, the plain shell SECOND", () => {
  const targets = hostConformanceTargets(aSampleHost);
  assert.equal(targets.length, 2, "F113-FR-034 names two targets");
  assert.deepEqual(
    targets.map((t) => t.order),
    [1, 2],
    "the targets are recorded in order",
  );
  // The second target IS the plain shell (T004), and is the built-in record.
  assert.equal(SECOND_TARGET.order, 2);
  assert.equal(SECOND_TARGET.implementationId, PLAIN_SHELL_IMPLEMENTATION_ID);
  assert.match(SECOND_TARGET.host, /plain shell/);
  assert.equal(PLAIN_SHELL_TARGET, SECOND_TARGET);
  assert.equal(targets[1], SECOND_TARGET);
  assert.equal(targetAt(targets, 2), SECOND_TARGET);
  // The first target is exactly the record the host supplied: the suite adds
  // nothing to it and takes nothing from it.
  assert.deepEqual(targetAt(targets, 1), aSampleHost);
  assert.equal(targetAt(targets, 1)?.implementationId, "sample-host-of-the-targets-test");
  assert.equal(targetAt(targets, 1)?.requirement, "KIT-FR-01");
  assert.equal(targetAt(targets, 3), undefined);
  // The record is frozen: the built-in target cannot be moved through a copy.
  assert.throws(() => {
    (targets[0] as { order: number }).order = 2;
  });
  // Both targets carry a requirement that puts them in the suite.
  for (const target of targets) {
    assert.equal(typeof target.requirement, "string");
    assert.ok(target.requirement.length > 0);
  }
  // The host's own target must claim order 1: the frame refuses anything else.
  assert.throws(() => hostConformanceTargets({ ...aSampleHost, order: 2 }), /must be at order 1/);
});

test("T004: the second target names the sample of EP-01 that the test tree holds", () => {
  // The independent read path: the sample module's own id and point.
  assert.equal(plainShell.id, PLAIN_SHELL_IMPLEMENTATION_ID);
  assert.equal(plainShell.ep, "EP-01");
  assert.equal(plainShell.pointId, HOST_POINT_ID);
  assert.equal(plainShell.implementationClass, "first-party");
  // And the file the record names is on disk.
  assert.equal(
    existsSync(join(ROOT, SECOND_TARGET.source)),
    true,
    `${SECOND_TARGET.source} is missing`,
  );
});

test("T004: neither target is a live host, so the detach-survival case is a skip with its reason", () => {
  for (const target of hostConformanceTargets(aSampleHost)) {
    assert.equal(target.live, false, `${target.implementationId} is recorded as a live host`);
  }
  assert.equal(LIVE_HOST_CASE, "survival after detaching");
  assert.match(LIVE_HOST_SKIP_REASON, /skip with its reason/);
  assert.match(LIVE_HOST_SKIP_REASON, /never as a pass/);
  assert.match(LIVE_HOST_SKIP_REASON, /F113-FR-034/);
  // quickstart.md step 3: both targets run on the same fixture.
  assert.equal(TARGET_FIXTURE, "greeting-ready");
});
