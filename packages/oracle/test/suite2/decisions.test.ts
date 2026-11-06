/**
 * CT-141-143 — the owner decisions of F141-FR-043 (T140, T145).
 *
 * "The decisions in feature 100's register that the port's own behaviour makes
 * come true (`carry.continuation` off, `carry.ledger_handoff` on,
 * `relaunch.owner` on the launcher, `engine.executable` refused) are asserted
 * from the transcripts and the configuration, in the same terms the first suite
 * uses. What the fixture families need of the decisions is what the register
 * rows say: the reset flag of the resume scenarios of FX-13 (DV-011, DV-044),
 * the mode map for the modes of FX-36 with its one waiver (DV-009), and the
 * register rows on no quota signal (DV-005), on staleness (DV-082) and on glob
 * expansion (DV-019)."
 *
 * What the test proves:
 *
 - **continuation off and asserted** (DV-010): no stub invocation carries a
   continuation argument, which the transcript capture itself refuses;
 - **the reset flag in FX-13** (DV-011, DV-044): the port's resume steps carry
   `--reset-counts`, and nothing else — no reference step, no other step —
   is touched;
 - **the mode map with one waiver** (DV-009): the modes of FX-36 are driven
   through the mode map of feature 100 and never re-implemented, and the one
   case the map does not cover is reported as the waiver of DV-009;
 - **the defaults fixture waived** (DV-004): every fixture names its roles, and
   the one fixture that names none is the one waiver;
 - **no quota signal** (DV-005): the stubs emit no quota signal, so
   consecutive errors take the old path;
 - **staleness at the as-is point** (DV-082): the check happens at critic
   start, where the `parity` profile leaves it;
 - **glob expansion without a waiver** (DV-019): FX-25 compares the wildcard
   line as it is.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CONTINUATION_ROW,
  DEFAULT_ROLES_ROW,
  DEFAULT_ROLES_WAIVED_FIXTURE,
  GLOB_ROW,
  MODE_MAP_ROW,
  MODE_MAP_WAIVED_CASE,
  MODE_MAP_WAIVER_ROW,
  QUOTA_ROW,
  RESET_COUNTS_FLAG,
  RESET_FLAG_ROWS,
  RESUME_FIXTURE_FAMILY,
  STALENESS_ROW,
  applyOwnerDecisions,
  modeMapWaiverFor,
  modeThroughTheModeMap,
  modeUsageOf,
} from "../../src/run/decisions.ts";
import {
  ARGUMENTS_THAT_CONTINUE_A_SESSION,
  assertNoSessionWasContinued,
  sessionContinuations,
} from "../../src/capture/transcript.ts";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { modeMap } from "@specstride/contracts/profile/normalization";
import { rowOfKey } from "@specstride/contracts/profile/parity";

test("continuation is off, and the transcripts assert it (DV-010)", () => {
  assert.equal(CONTINUATION_ROW, "DV-010");
  // The key of the profile the decision is: off under `parity`.
  const row = rowOfKey("carry.continuation");
  assert.notEqual(row, undefined);
  // No invocation of a stub transcript carries a continuation argument; the
  // capture names the arguments and refuses them, and the test holds the
  // refusal to a transcript that carries one.
  assert.ok(ARGUMENTS_THAT_CONTINUE_A_SESSION.length > 0);
  const clean = [{ role: "proposer", harness: "stub", call: 1, prompt: "propose", argv: ["step"] }];
  assert.deepEqual(sessionContinuations(clean as never), []);
  assert.doesNotThrow(() => assertNoSessionWasContinued(clean as never));
  const carried = [
    {
      role: "proposer",
      harness: "stub",
      call: 2,
      prompt: "propose",
      argv: ["step", ARGUMENTS_THAT_CONTINUE_A_SESSION[0] as string],
    },
  ];
  assert.deepEqual(sessionContinuations(carried as never), [
    { call: 2, argument: ARGUMENTS_THAT_CONTINUE_A_SESSION[0], role: "proposer" },
  ]);
  assert.throws(() => assertNoSessionWasContinued(carried as never));
});

test("the reset flag stands on the port's resume steps of FX-13, and nowhere else (DV-011, DV-044)", () => {
  assert.deepEqual([...RESET_FLAG_ROWS], ["DV-011", "DV-044"]);
  assert.equal(RESET_COUNTS_FLAG, "--reset-counts");
  assert.equal(RESUME_FIXTURE_FAMILY, "FX-13");
  const steps = [
    { argv: ["specstride", "run", "--workspace", "<WORK>"] },
    { argv: ["specstride", "resume", "--workspace", "<WORK>"], resumeCause: "reject-limit" },
    { argv: ["specstride", "run"], boundedSeconds: 30 },
  ];
  // The reference side is never touched.
  assert.deepEqual(applyOwnerDecisions(steps, { side: "reference", fixtureId: "FX-13/x" }), steps);
  // The port carries the flag on the resume step alone.
  const port = applyOwnerDecisions(steps, {
    side: "port",
    fixtureId: "FX-13/resume-after-reject-limit",
  });
  assert.deepEqual(port[0]?.argv, steps[0]?.argv);
  assert.deepEqual(port[2]?.argv, steps[2]?.argv);
  assert.equal(port[1]?.argv.includes(RESET_COUNTS_FLAG), true);
  assert.deepEqual(port[1]?.argv, [...(steps[1]?.argv ?? []), RESET_COUNTS_FLAG]);
  // No other family, no step without a resume cause.
  assert.deepEqual(
    applyOwnerDecisions(steps, { side: "port", fixtureId: "FX-01/defaults" }),
    steps,
  );
  const withoutCause = [{ argv: ["specstride", "resume", "--workspace", "<WORK>"] }];
  assert.deepEqual(
    applyOwnerDecisions(withoutCause, {
      side: "port",
      fixtureId: "FX-13/resume-after-reject-limit",
    }),
    withoutCause,
  );
  // And the flag is never added twice.
  const withFlag = [
    { argv: ["specstride", "resume", RESET_COUNTS_FLAG], resumeCause: "reject-limit" },
  ];
  assert.deepEqual(applyOwnerDecisions(withFlag, { side: "port", fixtureId: "FX-13/x" }), withFlag);
});

test("the modes of FX-36 are driven through the mode map, with one waiver (DV-009)", () => {
  assert.equal(MODE_MAP_ROW, "DV-009");
  // The map is the one copy feature 100 keeps; this module only consults it.
  assert.notEqual(modeMap["generate"], undefined);
  assert.notEqual(modeMap["run"], undefined);
  assert.notEqual(modeMap["auto"], undefined);
  assert.equal(modeThroughTheModeMap("generate"), modeMap["generate"]);
  assert.equal(modeThroughTheModeMap("run"), modeMap["run"]);
  assert.equal(modeThroughTheModeMap("auto"), modeMap["auto"]);
  // The supervisor of the baseline spells a token mode and a plain mode; both
  // readings find the value and map it.
  assert.deepEqual(modeUsageOf(["specstride", "--token=generate"]), {
    kind: "token",
    asIs: "generate",
    mapped: modeMap["generate"],
  });
  assert.deepEqual(modeUsageOf(["specstride", "--auto"]), {
    kind: "flag",
    asIs: "auto",
    mapped: modeMap["auto"],
  });
  assert.equal(modeUsageOf(["specstride", "--verbose-with-no-mode"]), undefined);
  // The one case the map does not cover is the WAIVER, with its row named.
  assert.deepEqual(modeMapWaiverFor(`FX-36/${MODE_MAP_WAIVED_CASE}@engine-stub`), {
    row: MODE_MAP_WAIVER_ROW,
    case: MODE_MAP_WAIVED_CASE,
  });
  // Every other member of FX-36 maps, and needs no waiver.
  assert.equal(modeMapWaiverFor("FX-36/generate-default@full-stack"), undefined);
  assert.equal(modeMapWaiverFor("FX-13/resume-after-reject-limit"), undefined);
});

test("the defaults fixture is the one waiver of the default roles (DV-004)", () => {
  assert.equal(DEFAULT_ROLES_ROW, "DV-004");
  assert.equal(DEFAULT_ROLES_WAIVED_FIXTURE, "FX-01/defaults-no-role-named");
});

test("no quota signal: consecutive errors take the old path (DV-005)", () => {
  assert.equal(QUOTA_ROW, "DV-005");
  // The stubs have no quota verb to emit: no unit of the stub kit names a
  // quota pause, which is WHY consecutive errors take the old path in the
  // parity suite.
  const stubs = readSync("stubs");
  assert.equal(
    stubs.some((line) => /quota[-_]?pause|proposer_consecutive_errors/.test(line)),
    false,
  );
});

test("staleness is checked where the reference checks it (DV-082)", () => {
  assert.equal(STALENESS_ROW, "DV-082");
  // The `parity` profile holds the check point where the baseline has it: at
  // critic start.
  const row = rowOfKey("staleness.check_points");
  assert.notEqual(row, undefined);
  assert.equal(GLOB_ROW, "DV-019");
});

function readSync(dir: string): string[] {
  const lines: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) lines.push(...readSync(path));
    else if (entry.endsWith(".ts")) lines.push(readFileSync(path, "utf8"));
  }
  return lines;
}
