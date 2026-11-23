/**
 * THE LAUNCH READS OF THE TWO ENGINE-CALL DOCUMENT FLAGS (phase 23 of
 * feature `153-loop-feedback-speed`, T324's ingress).
 *
 * The reference engine call carries two value flags the port's front door did
 * not read, so the two sides could not even run the same scenario (F141's
 * `parity` comparisons of F153-FR-061):
 *
 *  - `-s SPEC` / `--specs SPEC` — the spec document the phases are read from
 *    when the feature keeps no task list of its own (F119-FR-007, F119-FR-008;
 *    the as-is workspaces carry one `SPECS.md` and no `tasks.md`);
 *  - `--verification-commands FILE` — the declared document of the verification
 *    commands, a plan source of F105-FR-015 (F153-FR-010), beside the document
 *    the control plane holds (the caller's explicit declaration wins).
 *
 * Both reads are of the launch argv only: the router accepted the flags as
 * engine flags with a value (`ENGINE_FLAGS_WITH_VALUE`), and every OTHER
 * argument still ends `unknown arg` (F119-FR-005) — that refusal is the
 * router's own test, not this one's.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  specsPathOfTheLaunch,
  verificationCommandsPathOfTheLaunch,
} from "../../src/engine/run-feature.ts";

test("the launch reads `-s`/`--specs` as the document the phases are read from", () => {
  assert.equal(specsPathOfTheLaunch(["run", "-s", "SPECS.md"]), "SPECS.md");
  assert.equal(specsPathOfTheLaunch(["run", "--specs", "/w/SPECS.md"]), "/w/SPECS.md");
  assert.equal(specsPathOfTheLaunch(["run", "--specs=/w/SPECS.md"]), "/w/SPECS.md");
  assert.equal(specsPathOfTheLaunch(["run", "-w", "/ws", "-s", "/ws/SPECS.md"]), "/ws/SPECS.md");
  assert.equal(specsPathOfTheLaunch(["run"]), undefined);
  assert.equal(specsPathOfTheLaunch([]), undefined);
  // A value flag with no value behind it is not a document.
  assert.equal(specsPathOfTheLaunch(["run", "-s"]), undefined);
  assert.equal(specsPathOfTheLaunch(["run", "--specs="]), undefined);
});

test("the launch reads `--verification-commands` as the declared commands document", () => {
  assert.equal(
    verificationCommandsPathOfTheLaunch(["run", "--verification-commands", "v.json"]),
    "v.json",
  );
  assert.equal(
    verificationCommandsPathOfTheLaunch(["run", "--verification-commands=/w/v.json"]),
    "/w/v.json",
  );
  assert.equal(verificationCommandsPathOfTheLaunch(["run", "-w", "/ws"]), undefined);
  assert.equal(verificationCommandsPathOfTheLaunch([]), undefined);
  assert.equal(verificationCommandsPathOfTheLaunch(["run", "--verification-commands"]), undefined);
});

test("the first spelling on the launch argv wins, as the router's own parse does", () => {
  assert.equal(specsPathOfTheLaunch(["run", "-s", "first.md", "--specs", "second.md"]), "first.md");
  assert.equal(
    verificationCommandsPathOfTheLaunch([
      "run",
      "--verification-commands=first.json",
      "--verification-commands",
      "second.json",
    ]),
    "first.json",
  );
});
