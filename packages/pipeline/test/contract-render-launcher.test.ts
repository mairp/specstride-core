/**
 * The launcher template of `contract render` must survive a detached start
 * outside the launch command: the integrity module resolves through the
 * package's own exports map (never a `/src/` deep path `exports` refuses),
 * and a missing `SPECSTRIDE_PIPELINE_ENTRY` is a one-line refusal (exit 1),
 * not an unresolved-import stack from Node.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { createRequire } from "node:module";

import { launcherBody } from "../src/contract/render/launcher.ts";

const body = launcherBody({
  pipelineId: "example-pipeline",
  contractHash: "a".repeat(64),
  bundleHash: "b".repeat(64),
  mode: "run",
});

test("the integrity module fallback is an exported package subpath", () => {
  assert.match(
    body,
    /require_\(process\.env\.SPECSTRIDE_LAUNCH_INTEGRITY_MODULE\s*\?\?\s*"@specstride\/pipeline\/contract\/launch\/integrity"\)/,
  );
  assert.ok(!body.includes("@specstride/pipeline/src/"));
});

test("the exported integrity subpath resolves from the workspace", () => {
  const require_ = createRequire(import.meta.url);
  const integrity = require_("@specstride/pipeline/contract/launch/integrity");
  assert.equal(typeof integrity.launcherStartRefusal, "function");
});

test("a missing SPECSTRIDE_PIPELINE_ENTRY is a one-line refusal, not a stack", () => {
  assert.ok(
    body.includes("process.env.SPECSTRIDE_PIPELINE_ENTRY === undefined"),
    "the launcher checks the entry env before requiring it",
  );
  assert.match(
    body,
    /launcher: SPECSTRIDE_PIPELINE_ENTRY is not set/,
    "the refusal line names the fix",
  );
  assert.ok(
    body.includes("process.exit(1);"),
    "the refusal exits 1 before the unresolved require_",
  );
  assert.ok(
    !body.includes('?? "@specstride/pipeline/src/'),
    "no unresolvable /src/ fallback specifier remains",
  );
});
