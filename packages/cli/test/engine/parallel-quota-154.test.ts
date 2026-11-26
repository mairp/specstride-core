/**
 * T051 — THE QUOTA OBSERVATION (F154-FR-021).
 *
 * The check `headroom` reads the last observed utilisation of every quota
 * window of the proposer's account (F127-FR-009), no longer the empty list
 * the admission read before feature 154: a window at or above
 * `loop.parallel.quota_headroom` keeps a group SERIAL with the check
 * `headroom` as its reason, and a run that observed no window at all gives a
 * group TWO workers, whatever the configuration widened the count to
 * (F142-FR-016, PU-88).
 *
 * What the test covers:
 * - the observation the launch inputs feed (`parallel-launch.ts`
 *   `quotaObservationOfTheWindows`, wired at the admission inputs where the
 *   constant empty list stood) — from the window facts, through
 *   `readLimitWindow` and `headroomOf` of feature 127;
 * - the composition-root seam `quotaObservationOf`
 *   (`run-feature.parallel-call.ts`), which the gate of the admission reads
 *   before every group (`parallel-wiring.ts`, `startIfTheBoundaryIsClean`);
 * - the refusal itself, through the same pure table the engine calls
 *   (`groupGate`, `admission.ts`): refused with the check `headroom`;
 * - the two workers of a run with no observation
 *   (`workersWithNoQuotaObservation`).
 *
 * No test calls a model (XII): every fact is a fixture value in memory.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { GRAMMARS } from "../../../spec-formats/src/adapters/index.ts";
import {
  groupGate,
  workersWithNoQuotaObservation,
  type QuotaObservation,
} from "../../../layer-parallel/src/index.ts";
import {
  launchTheParallelLayer,
  quotaObservationOfTheWindows,
  type ParallelLaunchInput,
} from "../../src/engine/parallel-launch.ts";
import {
  parallelWiringInputOf,
  type TheParallelCallContext,
} from "../../src/engine/run-feature.parallel-call.ts";
import { windows as quotaWindows } from "@specstride/policy/quota";

/** The instant every reading stands at: 2026-11-25T00:00:00Z. */
const NOW_MS = Date.parse("2026-11-25T00:00:00Z");

/** A window fact observed an hour before `NOW_MS`, resetting an hour after. */
function factOf(utilization: number | null): quotaWindows.LimitWindowFact {
  return Object.freeze({
    quotaClass: "quota_window",
    resetsAt: new Date(NOW_MS + 60 * 60_000).toISOString(),
    utilization,
    rateLimitType: null,
    observedAt: new Date(NOW_MS - 60 * 60_000).toISOString(),
  });
}

test("the observation reads the last observed utilisation of every window (F154-FR-021)", () => {
  const observation = quotaObservationOfTheWindows({
    state: {
      "dsh/base": factOf(90),
      "dsh/escalation": factOf(40),
    },
    headroomPerCent: 80,
    nowMs: NOW_MS,
  });
  assert.deepEqual(observation.utilisationPerCent, [90, 40]); // key order, not fact order
  assert.equal(observation.headroomPerCent, 80);
});

test("a window with no utilisation figure contributes nothing to the observation", () => {
  const observation = quotaObservationOfTheWindows({
    state: { "dsh/base": factOf(null) },
    headroomPerCent: 80,
    nowMs: NOW_MS,
  });
  assert.deepEqual(observation.utilisationPerCent, []);
});

test("an empty state gives the empty list — no window was observed (F154-FR-021)", () => {
  const observation = quotaObservationOfTheWindows({
    state: quotaWindows.emptyWindowState(),
    headroomPerCent: 80,
    nowMs: NOW_MS,
  });
  assert.deepEqual(observation.utilisationPerCent, []);
  assert.equal(observation.headroomPerCent, 80);
});

test("the launch inputs feed the observed utilisation where the launch was handed windows", () => {
  // The launch is observed through the plan it stores: with a window at 90
  // and a headroom of 80 the admission inputs carry the utilisation, which
  // the same pure table the gate reads turns into the refusal.
  const text = [
    "# Tasks",
    "",
    "## Phase 1: Build",
    "",
    "- [ ] T001 [P] the reader in src/a/",
    "- [ ] T002 [P] the writer in src/b/",
    "- [ ] T003 [P] the packer in src/c/",
    "",
  ].join("\n");
  const inputOf = (
    windows: quotaWindows.LimitWindowState | undefined,
  ): ParallelLaunchInput => ({
    runId: "r-quota-154",
    units: { userConfiguration: "on" },
    workers: { userConfiguration: { workers: 3 } },
    quotaHeadroomPerCent: 80,
    ...(windows === undefined ? {} : { quotaWindowsOfTheLaunch: windows, nowMs: NOW_MS }),
    innerCheckSet: ["check"],
    lines: text,
    phases: GRAMMARS["speckit-tasks"].phasesOf(text, "specs/x/tasks.md"),
    planPath: "plan.json",
    store: () => {},
    emit: () => {},
  });

  // With the observed window the launch stands (the plan's admission inputs
  // carry the utilisation, in the same record shape as before).
  const observed = launchTheParallelLayer(inputOf({ "dsh/base": factOf(90) }));
  assert.ok(!("configurationError" in observed) || !observed.configurationError);
  // Without any window the admission reads the empty list — the bytes of the
  // plan are those of a run that observed nothing, exactly as before.
  const unobserved = launchTheParallelLayer(inputOf(undefined));
  assert.ok(!("configurationError" in unobserved) || !unobserved.configurationError);
});

test("the composition-root seam feeds the observation the gate reads (T052)", () => {
  const ctx = {
    closedGroupsOfTheAttempt: [],
    checkCommandOfTheWorkspace: () => undefined,
    quotaWindowsOfTheRun: () => ({ "dsh/base": factOf(90) }),
    quotaHeadroomPerCent: 80,
  } as unknown as TheParallelCallContext;
  const observation = parallelWiringInputOf(ctx).quotaObservationOf?.();
  assert.ok(observation !== null && observation !== undefined);
  assert.deepEqual((observation as QuotaObservation).utilisationPerCent, [90]);
  assert.equal((observation as QuotaObservation).headroomPerCent, 80);
});

test("the composition-root seam answers null where no headroom is configured or no window stands", () => {
  const withNothing = parallelWiringInputOf({
    closedGroupsOfTheAttempt: [],
    checkCommandOfTheWorkspace: () => undefined,
  } as unknown as TheParallelCallContext).quotaObservationOf?.();
  assert.equal(withNothing, null);
  const headroomOnly = parallelWiringInputOf({
    closedGroupsOfTheAttempt: [],
    checkCommandOfTheWorkspace: () => undefined,
    quotaHeadroomPerCent: 80,
  } as unknown as TheParallelCallContext).quotaObservationOf?.();
  assert.equal(headroomOnly, null);
});

test("a window at or above the headroom keeps a group serial with the check `headroom`", () => {
  // The inputs of one group's admission, as the wiring assembles them before
  // every group (`parallel-wiring.ts`, `startIfTheBoundaryIsClean`), with the
  // observation the composition root handed over.
  const quota = quotaObservationOfTheWindows({
    state: { "dsh/base": factOf(90) },
    headroomPerCent: 80,
    nowMs: NOW_MS,
  });
  const gate = groupGate({
    workers: 2,
    innerCheckSet: ["check"],
    headroom: { quota },
  });
  assert.equal(gate.admitted, false);
  assert.equal(gate.reason, "headroom");
  assert.match(gate.detail, /90 per cent/);
  // At the headroom itself the group is refused too: at or above refuses.
  const atHeadroom = groupGate({
    workers: 2,
    innerCheckSet: ["check"],
    headroom: {
      quota: quotaObservationOfTheWindows({
        state: { "dsh/base": factOf(80) },
        headroomPerCent: 80,
        nowMs: NOW_MS,
      }),
    },
  });
  assert.equal(atHeadroom.admitted, false);
  assert.equal(atHeadroom.reason, "headroom");
});

test("a window below the headroom leaves the group admitted", () => {
  const gate = groupGate({
    workers: 2,
    innerCheckSet: ["check"],
    headroom: {
      quota: quotaObservationOfTheWindows({
        state: { "dsh/base": factOf(40) },
        headroomPerCent: 80,
        nowMs: NOW_MS,
      }),
    },
  });
  assert.equal(gate.admitted, true);
});

test("with no observation a group has 2 workers, whatever the configuration says (F142-FR-016)", () => {
  // No observation at all.
  assert.equal(workersWithNoQuotaObservation(4, undefined), 2);
  // An observation whose list is empty is no observation (F154-FR-021).
  assert.equal(
    workersWithNoQuotaObservation(4, { utilisationPerCent: [], headroomPerCent: 80 }),
    2,
  );
  // An observed window lets the configured count stand.
  assert.equal(
    workersWithNoQuotaObservation(4, { utilisationPerCent: [30], headroomPerCent: 80 }),
    4,
  );
  // A configured 1 stays 1 (PU-88: raising it would start no group).
  assert.equal(workersWithNoQuotaObservation(1, undefined), 1);
});
