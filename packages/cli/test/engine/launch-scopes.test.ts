/**
 * Phase 21 of feature 153 (the unplanned change disclosed in
 * GATE21-EVIDENCE.md) — `launchScopesOf` reads the declared reads and writes
 * of the verification commands from the LAUNCH RECORD and translates the
 * provenance of row 261 onto the provenance the manifest intake counts
 * (`user-config` → `user-configuration`); a declaration of any other
 * provenance never enters, so the command stays undeclared — serial.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { afterEach } from "node:test";

import { launchScopesOf } from "../../src/engine/run-feature.ts";

const savedLaunchId = process.env.SPECSTRIDE_LAUNCH_ID;

afterEach(() => {
  if (savedLaunchId === undefined) delete process.env.SPECSTRIDE_LAUNCH_ID;
  else process.env.SPECSTRIDE_LAUNCH_ID = savedLaunchId;
});

function launchRecordRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "specstride-launch-scopes-"));
  const control = join(root, "control");
  mkdirSync(join(control, "launches", "l-1"), { recursive: true });
  process.env.SPECSTRIDE_LAUNCH_ID = "l-1";
  return control;
}

test("the provenance user-config is translated onto user-configuration", () => {
  const control = launchRecordRoot();
  try {
    writeFileSync(
      join(control, "launches", "l-1", "launch.json"),
      JSON.stringify({
        schema: "specstride.launch/1",
        configuration: {
          scopes: {
            commands: {
              "verify-a": { reads: ["pkgs/a/**"], writes: ["pkgs/a/**"], source: "user-config" },
            },
          },
        },
      }),
    );
    const scopes = launchScopesOf(control);
    assert.ok(scopes !== undefined, "the scopes were read");
    assert.deepEqual(scopes.verificationCommands?.["verify-a"], {
      reads: ["pkgs/a/**"],
      writes: ["pkgs/a/**"],
      source: "user-configuration",
    });
  } finally {
    rmSync(join(control, ".."), { recursive: true, force: true });
  }
});

test("a provenance outside row 261 never enters", () => {
  const control = launchRecordRoot();
  try {
    writeFileSync(
      join(control, "launches", "l-1", "launch.json"),
      JSON.stringify({
        schema: "specstride.launch/1",
        configuration: {
          scopes: {
            commands: {
              "verify-a": { reads: ["src/**"], source: "repository" },
            },
          },
        },
      }),
    );
    assert.equal(launchScopesOf(control), undefined, "no scopes: nothing counts");
  } finally {
    rmSync(join(control, ".."), { recursive: true, force: true });
  }
});
