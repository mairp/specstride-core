/**
 * T050 of feature 103 — CONFORMANCE TEST CT-103-122 (F103-FR-022).
 *
 * Four things, each observed through the core side of the interface in
 * `packages/core/src/layers/` and never asserted from prose:
 *
 *  1. THE EIGHT CALL POINTS. `CALL_POINTS_IN_ORDER` is the ordered closed set of
 *     annex D §D.1, `INVOKE_AT` holds exactly one entry per member in both
 *     directions, and every entry really reaches the layer's method — proved by
 *     a probe that records what it was asked.
 *  2. THE FIXED ORDER AFTER A PASS: the kill check, the yield check, the layer,
 *     then the classic accounting. `afterAPass` runs them in that order and
 *     stops at the first that ends the loop, so a step cannot be reordered
 *     without this test failing.
 *  3. THE CLOSED RETURNS OF `afterPass`: `accept`, `refuse` and `none` stand; a
 *     value outside the set is read as `none` AND switches the layer off for the
 *     phase attempt — one branch, both halves.
 *  4. THE ROUTER CONSULTED AT `loop`: the engine takes from the decision only a
 *     registered layer or off, records it in every case, and cannot be made to
 *     switch a layer on.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  AFTER_PASS_RESULTS,
  CALL_POINTS,
  ORDER_AFTER_A_PASS,
  RETURN_WHEN_UNKNOWN,
  callPointRows,
} from "@specstride/contracts/ep/loop-layer";
import type { CallPoint } from "@specstride/contracts/ep/loop-layer";
import type { RouteDecision } from "@specstride/contracts/ep/router-rules";
import {
  AFTER_PASS_RETURNS,
  AFTER_PASS_WHEN_UNKNOWN,
  CALL_POINTS_IN_ORDER,
  INVOKE_AT,
  LoopLayerStack,
  ORDER_OF_THE_STEPS_AFTER_A_PASS,
  afterAPass,
  isNone,
  readAfterPass,
} from "../../../../core/src/layers/call-points.ts";
import {
  A_ROUTER_DECISION_CAN_SWITCH_A_LAYER_ON,
  LoopLayerRegistry,
  ROUTER_DECISION_POINT,
  ROUTER_CHOICE_OFF,
  layerFromRouterAtLoop,
} from "../../../../core/src/layers/registry.ts";
import { phaseAttemptView } from "../../../../core/src/layers/attempt-view.ts";
import { BUILT_IN_LAYER_ID } from "../../../../core/src/layers/none.ts";
import { PHASE_ATTEMPT_FACTS, probe } from "./layer-probe.ts";

const view = phaseAttemptView(PHASE_ATTEMPT_FACTS);

function decisionAt(decisionPoint: string, choice: string): RouteDecision {
  return Object.freeze({
    decisionPoint: decisionPoint as RouteDecision["decisionPoint"],
    choice,
    ruleId: "rule-1",
    signals: Object.freeze({}),
    tableVersion: "1",
  });
}

test("CT-103-122 (F103-FR-022): the interface has the eight call points of annex D §D.1, in the fixed order, and the engine reaches every one of them through one table", () => {
  assert.deepEqual(
    [...CALL_POINTS_IN_ORDER],
    [
      "contributePrompt",
      "afterPass",
      "betweenPasses",
      "nextPassBlock",
      "onEvidence",
      "contributeCriticInput",
      "resume",
      "report",
    ],
  );
  assert.equal(CALL_POINTS_IN_ORDER.length, 8);
  // The core reads the same ordered set as the annex's own table.
  assert.deepEqual([...CALL_POINTS_IN_ORDER], [...CALL_POINTS]);
  assert.deepEqual(
    callPointRows.map((row) => row.callPoint),
    [...CALL_POINTS_IN_ORDER],
  );
  assert.deepEqual(
    callPointRows.map((row) => row.ordinal),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
  // Exactly one entry of the invocation table per call point, both directions.
  assert.deepEqual(Object.keys(INVOKE_AT).sort(), [...CALL_POINTS_IN_ORDER].sort());
  for (const point of CALL_POINTS_IN_ORDER) {
    assert.equal(typeof INVOKE_AT[point], "function", point);
  }
});

test("CT-103-122 (F103-FR-022): every one of the eight call points really reaches the layer, with the read-only view, the checkpoint and the ledger", () => {
  const one = probe("probe-eight");
  const registry = new LoopLayerRegistry();
  assert.equal(registry.register(one.layer, { layerClass: "first-party" }).accepted, true);
  const stack = new LoopLayerStack(registry);
  const ledger = Object.freeze([{ kind: "attempt-open" }]);
  for (const point of CALL_POINTS_IN_ORDER) {
    stack.call(point, { view, checkpoint: { id: "checkpoint-1" }, ledger });
  }
  // The layer was asked at all eight, in the fixed order of the annex.
  assert.deepEqual([...one.points()], [...CALL_POINTS_IN_ORDER]);
  assert.deepEqual([...stack.pointsCalled()], [...CALL_POINTS_IN_ORDER]);
  // Seven of the eight carry the view; `report` carries nothing.
  for (const call of one.calls) {
    if (call.point === "report") assert.equal(call.view, undefined);
    else assert.equal(call.view, view);
  }
  const afterPassCall = one.calls.find((c) => c.point === "afterPass");
  assert.deepEqual(afterPassCall?.checkpoint, { id: "checkpoint-1" });
  const resumeCall = one.calls.find((c) => c.point === "resume");
  assert.equal(resumeCall?.ledger, ledger);
});

test("CT-103-122 (F103-FR-022): after every pass the order is fixed — the kill check, the yield check, the layer, then the classic accounting", () => {
  assert.deepEqual(
    [...ORDER_OF_THE_STEPS_AFTER_A_PASS],
    ["kill check", "yield check", "layer", "classic accounting"],
  );
  assert.deepEqual([...ORDER_OF_THE_STEPS_AFTER_A_PASS], [...ORDER_AFTER_A_PASS]);

  const ran: string[] = [];
  const all = afterAPass({
    killCheck: () => void ran.push("kill check"),
    yieldCheck: () => void ran.push("yield check"),
    layer: () => void ran.push("layer"),
    classicAccounting: () => void ran.push("classic accounting"),
  });
  assert.deepEqual(ran, [...ORDER_OF_THE_STEPS_AFTER_A_PASS]);
  assert.deepEqual([...all.ran], [...ORDER_OF_THE_STEPS_AFTER_A_PASS]);
  assert.equal(all.endedAt, undefined);
  assert.equal(all.exit_code, undefined);

  // The kill check ends the loop: nothing after it runs.
  const stoppedEarly: string[] = [];
  const killed = afterAPass({
    killCheck: () => ({ exit_code: 5 }),
    yieldCheck: () => void stoppedEarly.push("yield check"),
    layer: () => void stoppedEarly.push("layer"),
    classicAccounting: () => void stoppedEarly.push("classic accounting"),
  });
  assert.deepEqual(stoppedEarly, []);
  assert.deepEqual([...killed.ran], ["kill check"]);
  assert.equal(killed.endedAt, "kill check");
  assert.equal(killed.exit_code, 5);

  // The LAYER comes before the classic accounting and after the yield check.
  const order: string[] = [];
  afterAPass({
    yieldCheck: () => void order.push("yield check"),
    layer: () => void order.push("layer"),
    classicAccounting: () => void order.push("classic accounting"),
  });
  assert.ok(order.indexOf("layer") > order.indexOf("yield check"));
  assert.ok(order.indexOf("layer") < order.indexOf("classic accounting"));

  // An absent step is a no-op that keeps its PLACE in the order, so a feature
  // that fills one later does not move the steps around it.
  const sparse = afterAPass({ layer: () => undefined });
  assert.deepEqual([...sparse.ran], [...ORDER_OF_THE_STEPS_AFTER_A_PASS]);
});

test("CT-103-122 (F103-FR-022): the return of `afterPass` is one of `accept`, `refuse` and `none`, and a value outside the set is read as `none` and switches the layer off for the phase attempt", () => {
  assert.deepEqual([...AFTER_PASS_RETURNS], ["accept", "refuse", "none"]);
  assert.deepEqual([...AFTER_PASS_RETURNS], [...AFTER_PASS_RESULTS]);
  assert.equal(AFTER_PASS_WHEN_UNKNOWN, "none");
  assert.equal(AFTER_PASS_WHEN_UNKNOWN, RETURN_WHEN_UNKNOWN);

  for (const member of AFTER_PASS_RETURNS) {
    const read = readAfterPass(member);
    assert.equal(read.result, member);
    assert.equal(read.wasUnknown, false);
    assert.equal(read.switchesTheLayerOff, false);
  }
  for (const outside of ["maybe", "ACCEPT", "", 1, null, undefined, {}, ["accept"]]) {
    const read = readAfterPass(outside);
    assert.equal(read.result, "none", JSON.stringify(outside));
    assert.equal(read.wasUnknown, true, JSON.stringify(outside));
    assert.equal(read.switchesTheLayerOff, true, JSON.stringify(outside));
  }

  // Through the engine: `accept` is taken and the layer stays on.
  const accepting = probe("probe-accept", { answers: { afterPass: "accept" } });
  const registryA = new LoopLayerRegistry();
  registryA.register(accepting.layer, { layerClass: "first-party" });
  const stackA = new LoopLayerStack(registryA);
  const takenA = stackA.call("afterPass", { view, checkpoint: {} });
  assert.equal(takenA.value, "accept");
  assert.equal(takenA.from, "probe-accept");
  assert.deepEqual([...takenA.switchedOff], []);
  assert.equal(stackA.isOn("probe-accept"), true);

  // And an unknown return is read as `none` AND switches the layer off.
  const odd = probe("probe-odd", { answers: { afterPass: "sometimes" } });
  const registryB = new LoopLayerRegistry();
  registryB.register(odd.layer, { layerClass: "first-party" });
  const stackB = new LoopLayerStack(registryB);
  const takenB = stackB.call("afterPass", { view, checkpoint: {} });
  assert.equal(takenB.value, "none");
  assert.equal(takenB.from, BUILT_IN_LAYER_ID);
  assert.equal(takenB.afterPass?.wasUnknown, true);
  assert.equal(takenB.switchedOff.length, 1);
  assert.equal(takenB.switchedOff[0]?.reason, "unknown-return");
  assert.equal(takenB.switchedOff[0]?.scope, "phase-attempt");
  assert.equal(stackB.isOn("probe-odd"), false);
  // The phase attempt ends; the next one has the layer on again.
  stackB.newPhaseAttempt();
  assert.equal(stackB.isOn("probe-odd"), true);
});

test("CT-103-122 (F103-FR-022): before the first pass the engine consults the router at `loop`, records the decision, and takes from it only a registered layer or off", () => {
  assert.equal(ROUTER_DECISION_POINT, "loop");
  assert.equal(A_ROUTER_DECISION_CAN_SWITCH_A_LAYER_ON, false);

  const registry = new LoopLayerRegistry();
  const one = probe("probe-router");
  assert.equal(registry.register(one.layer, { layerClass: "first-party" }).accepted, true);

  // A registered layer: taken, and recorded.
  const taken = layerFromRouterAtLoop(decisionAt("loop", "probe-router"), registry);
  assert.equal(taken.took?.id, "probe-router");
  assert.equal(taken.recorded, "probe-router");
  assert.equal(taken.decision.ruleId, "rule-1");
  assert.equal(taken.refusedBecause, undefined);

  // `off`: nothing taken, and the decision still recorded.
  const off = layerFromRouterAtLoop(decisionAt("loop", ROUTER_CHOICE_OFF), registry);
  assert.equal(off.took, undefined);
  assert.equal(off.recorded, BUILT_IN_LAYER_ID);
  assert.equal(off.decision.choice, ROUTER_CHOICE_OFF);

  // A layer the registry does not hold: the router cannot switch one on.
  const unregistered = layerFromRouterAtLoop(decisionAt("loop", "not-registered"), registry);
  assert.equal(unregistered.took, undefined);
  assert.equal(unregistered.recorded, BUILT_IN_LAYER_ID);
  assert.match(String(unregistered.refusedBecause), /cannot switch a layer on/);
  assert.equal(unregistered.decision.choice, "not-registered");

  // A decision made at another decision point is not this one.
  for (const other of ["tools", "escalation"]) {
    const wrong = layerFromRouterAtLoop(decisionAt(other, "probe-router"), registry);
    assert.equal(wrong.took, undefined);
    assert.equal(wrong.recorded, BUILT_IN_LAYER_ID);
    assert.match(String(wrong.refusedBecause), new RegExp(other));
  }
});

test("CT-103-122 (F103-FR-022): `none` at a call point is the word, nothing at all, an empty list or an empty record", () => {
  for (const value of ["none", undefined, null, [], Object.freeze([]), {}, Object.freeze({})]) {
    assert.equal(isNone(value), true, JSON.stringify(value) ?? "undefined");
  }
  for (const value of ["accept", 0, false, [1], ["none"], { closingCheck: false }]) {
    assert.equal(isNone(value), false, JSON.stringify(value));
  }
  // An empty stack is the built-in layer `none`: `none` from `none`.
  const empty = new LoopLayerStack(new LoopLayerRegistry());
  for (const point of CALL_POINTS_IN_ORDER) {
    const result = empty.call(point as CallPoint, { view });
    assert.equal(result.value, "none", point);
    assert.equal(result.from, BUILT_IN_LAYER_ID, point);
    assert.deepEqual([...result.consulted], []);
  }
});
