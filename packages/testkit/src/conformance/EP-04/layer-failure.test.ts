/**
 * T054 of feature 103 — CONFORMANCE TEST CT-103-127 (F103-FR-027).
 *
 * Four failures, each of which switches the layer off for the phase attempt and
 * does nothing else: A THROWN ERROR, AN INVALID LEDGER, A SPENT CAP and AN
 * UNKNOWN RETURN. A fifth, the failure of the application of a group, switches
 * it off for the RUN.
 *
 * The negative half of the requirement is the half worth proving, and it is
 * proved twice over:
 *
 *  - on the layer side, the record of the switch-off carries no run state, no
 *    exit code and no stop reason, and `offEvent` cannot be read into one;
 *  - on the loop side, the WHOLE PASS LOOP is run with a layer that fails at
 *    every call point it is asked at, and its exit code, its pass number, its
 *    counters, its lines and its events are compared with the classic loop's.
 *    A failure that produced an exit code or a stop reason would change one of
 *    those, so the comparison is the witness: the durable output of the run is
 *    read back through an independent path and is unchanged.
 */
import test from "node:test";
import assert from "node:assert/strict";
import type { PassHandle } from "@specstride/contracts/ep/harness";
import { CALL_POINTS, ERRORS } from "@specstride/contracts/ep/loop-layer";
import {
  ERRORS_OF_A_LAYER,
  FAILURE_OF_A_GROUP,
  FAILURE_PATH_OF_A_LAYER,
  FAILURE_PRODUCES_A_RUN_STATE_AN_EXIT_CODE_OR_A_STOP_REASON,
  LoopLayerStack,
  NO_RUN_STATE_NO_EXIT_CODE_NO_STOP_REASON,
  OFF_REASONS,
  OFF_SCOPES,
  SCOPE_OF_REASON,
  offAnnouncement,
  offEvent,
} from "../../../../core/src/layers/call-points.ts";
import { LoopLayerRegistry } from "../../../../core/src/layers/registry.ts";
import { phaseAttemptView } from "../../../../core/src/layers/attempt-view.ts";
import { ZERO_COUNTERS, type Counters } from "../../../../core/src/pass-loop/accounting.ts";
import { normalizeRequest } from "../../../../core/src/pass-loop/request.ts";
import { runPassLoop, type LoopServices } from "../../../../core/src/pass-loop/loop.ts";
import { PHASE_ATTEMPT_FACTS, probe } from "./layer-probe.ts";

const view = phaseAttemptView(PHASE_ATTEMPT_FACTS);

const NO_STREAM: AsyncIterable<string> = {
  async *[Symbol.asyncIterator]() {
    // A pass of this suite produces no stream record.
  },
};
const HANDLE: PassHandle = Object.freeze({
  pid: 4242,
  startTime: "1970-01-01T00:00:00.000Z",
  stream: NO_STREAM,
  sessionId: "session-1",
});

/** One run of the loop, read back through what the loop produced. */
type Run = {
  readonly exit_code: number;
  readonly passReached: number | undefined;
  readonly counters: Counters | undefined;
  readonly lines: readonly string[];
  readonly events: readonly string[];
  readonly blocked: unknown;
};

function requestOf(passLimit: number) {
  const normalized = normalizeRequest(
    {
      workdir: "/w",
      evidence: "/w/evidence.md",
      standingPrompt: "a standing prompt",
      harness: "stub",
      role: "proposer",
      passLimit,
      pauseSec: 0,
    },
    {
      isDirectory: () => true,
      isRegularFile: () => true,
      canonical: (path: string) => path,
      makeDirectory: () => undefined,
      readText: () => "a standing prompt",
    },
  );
  assert.equal(normalized.ok, true);
  if (!normalized.ok) throw new Error("unreachable");
  return normalized.request;
}

/** Run three passes with no progress, with an optional failing layer attached. */
async function runLoop(stack?: LoopLayerStack): Promise<Run> {
  const lines: string[] = [];
  const events: string[] = [];
  const services: LoopServices = {
    port: {
      startPass: async () => HANDLE,
      betweenPasses: async () => {
        stack?.call("betweenPasses", { view });
        return { outcome: "continue" } as never;
      },
    },
    evidenceExists: () => false,
    runPass: async (pass: number) => {
      stack?.call("contributePrompt", { view });
      return {
        handle: HANDLE,
        result: { pass },
        outcome: { path: "legacy" as const, madeProgress: false },
      };
    },
    now: () => "1970-01-01T00:00:00Z",
    pause: async () => undefined,
    print: (line: string) => lines.push(line),
    emit: (announcement: unknown) => {
      const named = announcement as { asIsName?: string };
      events.push(named.asIsName ?? "?");
    },
    counters: ZERO_COUNTERS,
    hooks: {
      afterPass: () => {
        stack?.call("afterPass", { view, checkpoint: {} });
      },
    },
  };
  const result = await runPassLoop(requestOf(4), services);
  return Object.freeze({
    exit_code: result.exit_code,
    passReached: result.passReached,
    counters: result.counters,
    lines: Object.freeze([...lines]),
    events: Object.freeze([...events]),
    blocked: result.blocked,
  });
}

test("CT-103-127 (F103-FR-027): the four errors of annex D §D.1 each switch the layer off for the phase attempt, and the failure of the application of a group for the run", () => {
  assert.deepEqual(
    [...ERRORS_OF_A_LAYER],
    ["a thrown error", "an invalid ledger", "a spent cap", "a check that cannot start"],
  );
  assert.deepEqual([...ERRORS_OF_A_LAYER], [...ERRORS]);
  assert.deepEqual([...OFF_SCOPES], ["phase-attempt", "run"]);

  // The four errors, and the unknown return of F103-FR-022, are phase-attempt
  // scope; only the group application is run scope.
  for (const reason of [
    "thrown-error",
    "invalid-ledger",
    "spent-cap",
    "check-cannot-start",
    "unknown-return",
  ] as const) {
    assert.equal(SCOPE_OF_REASON[reason], "phase-attempt", reason);
  }
  assert.equal(SCOPE_OF_REASON["group-application-not-completed"], "run");
  assert.equal(SCOPE_OF_REASON.layerOffForRun, "run");
  assert.match(FAILURE_OF_A_GROUP, /off for the rest of the run/);
  assert.match(FAILURE_PATH_OF_A_LAYER, /the classic loop carries on/);
  // Every reason of the closed set has a scope, and no scope is invented.
  assert.deepEqual(Object.keys(SCOPE_OF_REASON).sort(), [...OFF_REASONS].sort());
  for (const scope of Object.values(SCOPE_OF_REASON)) {
    assert.ok((OFF_SCOPES as readonly string[]).includes(scope), scope);
  }
});

test("CT-103-127 (F103-FR-027): a thrown error, an invalid ledger, a spent cap and an unknown return each switch the layer off, announced and recorded", () => {
  // 1. A thrown error, observed through a layer that really throws.
  const thrower = probe("thrower", { throwsAt: [...CALL_POINTS] });
  const registry = new LoopLayerRegistry();
  registry.register(thrower.layer, { layerClass: "first-party" });
  const stack = new LoopLayerStack(registry);
  const thrown = stack.call("betweenPasses", { view });
  assert.equal(thrown.value, "none");
  assert.equal(thrown.from, "none");
  assert.equal(thrown.switchedOff.length, 1);
  assert.equal(thrown.switchedOff[0]?.reason, "thrown-error");
  assert.equal(thrown.switchedOff[0]?.at, "betweenPasses");
  assert.equal(stack.isOn("thrower"), false);
  // Off means off: a later call point does not reach it again.
  const before = thrower.calls.length;
  stack.call("afterPass", { view, checkpoint: {} });
  assert.equal(thrower.calls.length, before);

  // 2, 3. An invalid ledger and a spent cap are reported to the engine, which
  // switches the layer off; both are announced and recorded.
  for (const reason of ["invalid-ledger", "spent-cap", "check-cannot-start"] as const) {
    const second = new LoopLayerRegistry();
    const one = probe(`for-${reason}`);
    second.register(one.layer, { layerClass: "first-party" });
    const itsStack = new LoopLayerStack(second);
    const record = itsStack.switchOff(`for-${reason}`, reason);
    assert.equal(record.reason, reason);
    assert.equal(record.scope, "phase-attempt");
    assert.equal(record.announcement, offAnnouncement(`for-${reason}`, reason, "phase-attempt"));
    assert.match(record.announcement, /^\[LOOP\] layer /);
    assert.equal(itsStack.isOn(`for-${reason}`), false);
    assert.deepEqual([...itsStack.offSoFar()], [record]);
    const event = offEvent(record);
    assert.equal(event.asIsName, "layer.off");
    assert.equal(event.fields.reason, reason);
  }

  // 4. An unknown return at a call point.
  const third = new LoopLayerRegistry();
  const odd = probe("odd", { answers: { afterPass: { verdict: "maybe" } } });
  third.register(odd.layer, { layerClass: "first-party" });
  const oddStack = new LoopLayerStack(third);
  const read = oddStack.call("afterPass", { view, checkpoint: {} });
  assert.equal(read.value, "none");
  assert.equal(read.afterPass?.wasUnknown, true);
  assert.equal(read.switchedOff[0]?.reason, "unknown-return");
  assert.equal(oddStack.isOn("odd"), false);
});

test("CT-103-127 (F103-FR-027): no failure of a layer produces a run state, an exit code or a stop reason", () => {
  assert.equal(FAILURE_PRODUCES_A_RUN_STATE_AN_EXIT_CODE_OR_A_STOP_REASON, false);
  assert.deepEqual(Object.keys(NO_RUN_STATE_NO_EXIT_CODE_NO_STOP_REASON).sort(), [
    "exit_code",
    "runState",
    "stopReason",
  ]);
  for (const value of Object.values(NO_RUN_STATE_NO_EXIT_CODE_NO_STOP_REASON)) {
    assert.equal(value, undefined);
  }
  // The record of a switch-off carries none of the three, under any name.
  const registry = new LoopLayerRegistry();
  const one = probe("no-exit-code");
  registry.register(one.layer, { layerClass: "first-party" });
  const stack = new LoopLayerStack(registry);
  for (const reason of OFF_REASONS) {
    const record = stack.switchOff("no-exit-code", reason);
    const keys = Object.keys(record);
    for (const forbidden of [
      "exit_code",
      "exitCode",
      "stopReason",
      "stop_reason",
      "runState",
      "state",
    ]) {
      assert.equal(keys.includes(forbidden), false, `${reason}: ${forbidden}`);
    }
    const event = offEvent(record);
    const eventKeys = Object.keys(event.fields);
    for (const forbidden of ["exit_code", "exitCode", "stopReason", "stop_reason", "runState"]) {
      assert.equal(eventKeys.includes(forbidden), false, `${reason}: event ${forbidden}`);
    }
  }
});

test("CT-103-127 (F103-FR-027): a layer that fails at every call point changes nothing of the run the classic loop would have produced", async () => {
  const classic = await runLoop();

  const registry = new LoopLayerRegistry();
  const thrower = probe("fails-everywhere", { throwsAt: [...CALL_POINTS] });
  assert.equal(registry.register(thrower.layer, { layerClass: "first-party" }).accepted, true);
  const stack = new LoopLayerStack(registry);
  const withFailure = await runLoop(stack);

  // The layer did fail, and was switched off for the phase attempt.
  assert.equal(stack.offSoFar().length, 1);
  assert.equal(stack.offSoFar()[0]?.reason, "thrown-error");
  assert.equal(stack.offSoFar()[0]?.scope, "phase-attempt");
  assert.equal(stack.isOn("fails-everywhere"), false);

  // And the run is the classic loop's, in every observable field.
  assert.equal(withFailure.exit_code, classic.exit_code);
  assert.equal(withFailure.passReached, classic.passReached);
  assert.deepEqual(withFailure.counters, classic.counters);
  assert.deepEqual([...withFailure.lines], [...classic.lines]);
  assert.deepEqual([...withFailure.events], [...classic.events]);
  assert.deepEqual(withFailure.blocked, classic.blocked);
  // The breaker that ended it is the loop's own, not the layer's.
  assert.equal(classic.exit_code, 8);
  assert.ok(classic.lines.some((line) => /no[-_ ]?progress/i.test(line)));
  // No line of the run names the layer: the announcement of a switch-off is the
  // layer's own output and is not an output of the loop.
  for (const line of withFailure.lines) {
    assert.equal(/fails-everywhere/.test(line), false, line);
  }
});

test("CT-103-127 (F103-FR-027): what is off for the phase attempt comes back at the next phase attempt; what is off for the run does not", () => {
  const registry = new LoopLayerRegistry();
  const one = probe("for-the-attempt");
  const two = probe("for-the-run");
  registry.register(one.layer, { layerClass: "first-party" });
  registry.register(two.layer, { layerClass: "first-party" });
  const stack = new LoopLayerStack(registry);

  stack.switchOff("for-the-attempt", "thrown-error");
  stack.switchOff("for-the-run", "group-application-not-completed");
  assert.equal(stack.isOn("for-the-attempt"), false);
  assert.equal(stack.isOn("for-the-run"), false);
  assert.deepEqual([...stack.layersOn()], []);

  stack.newPhaseAttempt();
  assert.equal(stack.isOn("for-the-attempt"), true);
  assert.equal(stack.isOn("for-the-run"), false);
  assert.deepEqual(
    stack.layersOn().map((held) => held.id),
    ["for-the-attempt"],
  );
});
