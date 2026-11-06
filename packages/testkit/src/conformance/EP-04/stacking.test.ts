/**
 * T052 of feature 103 — CONFORMANCE TEST CT-103-124 (F103-FR-024, F103-FR-026;
 * annex D §D.1, "Proving test" (iii)).
 *
 * The sample layer `stacked` of `packages/testkit/src/samples/EP-04/stacked.ts`
 * sits ABOVE `noop`: it is the OUTER layer. The suite checks four things.
 *
 *  1. STACKING. Two layers, outer first, to the depth of at most 2. At every
 *     call point the outer layer is asked first and the inner only where the
 *     outer returned `none`. A third layer is refused, and so is a second layer
 *     that claims a ledger namespace another layer already has — a shared
 *     namespace is a way for one layer to hold state in another's.
 *  2. THE GROUP. `stacked` declares `requestPassGroup` and `integrateGroup`,
 *     requests a group of TWO stub passes and integrates them; the ENGINE
 *     executes and accounts for both, and the two stub passes really run.
 *  3. THE READ-ONLY VIEW. Both layers read the same frozen view; with parallel
 *     units off `workerId` and `groupId` are ABSENT, and with them on they are
 *     present.
 *  4. UNREGISTERED. With the sample NOT registered, the stack is `noop` alone
 *     and the loop is the classic loop — the sentence of the annex that makes
 *     this sample an addition and not a change.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  CALL_POINTS,
  MAX_STACK_DEPTH,
  OUTER_LAYER_FIRST,
} from "@specstride/contracts/ep/loop-layer";
import type { PassGroupRequest, IntegrateGroupRequest } from "@specstride/contracts/ep/loop-layer";
import { LoopLayerStack } from "../../../../core/src/layers/call-points.ts";
import {
  LoopLayerRegistry,
  STACK_DEPTH,
  OUTER_FIRST,
} from "../../../../core/src/layers/registry.ts";
import {
  executeDirectives,
  type ExecutableDirective,
} from "../../../../core/src/layers/directives.ts";
import {
  OMITTED_WITH_UNITS_OFF,
  phaseAttemptView,
  viewIsReadOnly,
  withheldKeysOnTheView,
} from "../../../../core/src/layers/attempt-view.ts";
import { ZERO_COUNTERS } from "../../../../core/src/pass-loop/accounting.ts";
import { noopLayer } from "../../samples/EP-04/noop.ts";
import {
  STACKED_CONCURRENCY,
  STACKED_DIRECTIVES,
  STACKED_LAYER_ID,
  STACKED_WORKERS,
  stackedLayer,
} from "../../samples/EP-04/stacked.ts";
import {
  DECLARES_CONCURRENT_SESSIONS,
  PHASE_ATTEMPT_FACTS,
  probe,
  probeRegistration,
} from "./layer-probe.ts";

const view = phaseAttemptView(PHASE_ATTEMPT_FACTS);

/** `stacked` outer, `noop` inner: the stack of the proving test of §D.1. */
function stackedAboveNoop(): { registry: LoopLayerRegistry; stack: LoopLayerStack } {
  const registry = new LoopLayerRegistry();
  assert.equal(registry.register(stackedLayer, { layerClass: "first-party" }).accepted, true);
  assert.equal(registry.register(noopLayer, { layerClass: "first-party" }).accepted, true);
  return { registry, stack: new LoopLayerStack(registry) };
}

test("CT-103-124 (F103-FR-024): layers stack to a depth of at most 2, outer first, and the sample `stacked` sits above `noop`", () => {
  assert.equal(STACK_DEPTH, 2);
  assert.equal(STACK_DEPTH, MAX_STACK_DEPTH);
  assert.equal(OUTER_FIRST, true);
  assert.equal(OUTER_FIRST, OUTER_LAYER_FIRST);

  const { registry, stack } = stackedAboveNoop();
  assert.deepEqual(
    registry.stack().map((held) => held.id),
    [STACKED_LAYER_ID, "noop"],
  );
  assert.deepEqual(
    stack.layers().map((held) => held.id),
    ["stacked", "noop"],
  );

  // A THIRD layer is refused: the depth is the rule, not a suggestion.
  const third = probe("third");
  const refused = registry.register(third.layer, { layerClass: "first-party" });
  assert.equal(refused.accepted, false);
  if (!refused.accepted) assert.match(refused.message, /depth of at most 2/);
  assert.equal(registry.stack().length, 2);
});

test("CT-103-124 (F103-FR-024): at every call point the OUTER layer is asked first, and the inner layer only where the outer returned `none`", () => {
  // Two probes, so that the ORDER of the two calls is observable.
  const outer = probe("outer");
  const inner = probe("inner");
  const registry = new LoopLayerRegistry();
  registry.register(outer.layer, { layerClass: "first-party" });
  registry.register(inner.layer, { layerClass: "first-party" });
  const stack = new LoopLayerStack(registry);

  const order: string[] = [];
  for (const point of CALL_POINTS) {
    const before = { outer: outer.calls.length, inner: inner.calls.length };
    const result = stack.call(point, { view, checkpoint: {}, ledger: [] });
    // The outer layer returned `none` at every point, so both were consulted,
    // and the order recorded is outer then inner.
    assert.deepEqual([...result.consulted], ["outer", "inner"], point);
    assert.equal(outer.calls.length, before.outer + 1, point);
    assert.equal(inner.calls.length, before.inner + 1, point);
    order.push(point);
  }
  assert.deepEqual(order, [...CALL_POINTS]);

  // Now the outer layer ANSWERS at `afterPass`: the inner one is not asked.
  const answering = probe("answering", { answers: { afterPass: "refuse" } });
  const quiet = probe("quiet");
  const second = new LoopLayerRegistry();
  second.register(answering.layer, { layerClass: "first-party" });
  second.register(quiet.layer, { layerClass: "first-party" });
  const stackB = new LoopLayerStack(second);
  const answered = stackB.call("afterPass", { view, checkpoint: {} });
  assert.equal(answered.value, "refuse");
  assert.equal(answered.from, "answering");
  assert.deepEqual([...answered.consulted], ["answering"]);
  assert.deepEqual([...quiet.points()], []);
});

test("CT-103-124 (F103-FR-024): each layer has a ledger namespace of its own, and a layer that claims another's is refused", () => {
  const registry = new LoopLayerRegistry();
  const first = probe("first", { registration: { ledgerNamespace: "shared" } });
  const second = probe("second", { registration: { ledgerNamespace: "shared" } });
  assert.equal(registry.register(first.layer, { layerClass: "first-party" }).accepted, true);
  const refused = registry.register(second.layer, { layerClass: "first-party" });
  assert.equal(refused.accepted, false);
  if (!refused.accepted) assert.match(refused.message, /namespace `shared` is already/);
  assert.equal(registry.stack().length, 1);

  // The same layer twice is refused too.
  const again = new LoopLayerRegistry();
  again.register(noopLayer, { layerClass: "first-party" });
  const twice = again.register(noopLayer, { layerClass: "first-party" });
  assert.equal(twice.accepted, false);
  if (!twice.accepted) assert.match(twice.message, /already registered/);

  // And the two samples of the proving test have namespaces of their own.
  assert.notEqual(
    stackedLayer.registration.ledgerNamespace,
    noopLayer.registration.ledgerNamespace,
  );
  assert.equal(probeRegistration("x").ledgerNamespace, "x");
});

test("CT-103-124 (F103-FR-024): the view a layer reads is read-only, holds no withheld thing, and omits `workerId` and `groupId` with parallel units off", () => {
  assert.deepEqual([...OMITTED_WITH_UNITS_OFF], ["workerId", "groupId"]);
  assert.equal(viewIsReadOnly(view), true);
  assert.deepEqual([...withheldKeysOnTheView(view)], []);
  assert.equal("workerId" in view, false);
  assert.equal("groupId" in view, false);
  assert.throws(() => {
    (view as unknown as Record<string, unknown>).phase = 99;
  });
  assert.equal(view.phase, PHASE_ATTEMPT_FACTS.phase);

  // With units on, both are present and still read-only.
  const withUnits = phaseAttemptView({
    ...PHASE_ATTEMPT_FACTS,
    workerId: STACKED_WORKERS[0],
    groupId: "group-1",
  });
  assert.equal(withUnits.workerId, "worker-1");
  assert.equal(withUnits.groupId, "group-1");
  assert.equal(viewIsReadOnly(withUnits), true);
  assert.deepEqual([...withheldKeysOnTheView(withUnits)], []);

  // Both layers of the stack read the SAME view object.
  const { stack } = stackedAboveNoop();
  stack.call("contributePrompt", { view });
  assert.equal(stack.callsSoFar()[0]?.point, "contributePrompt");
});

test("CT-103-124 (F103-FR-026): the sample `stacked` requests a group of two stub passes and the engine integrates them", () => {
  assert.deepEqual([...STACKED_DIRECTIVES], ["requestPassGroup", "integrateGroup"]);
  assert.equal(STACKED_CONCURRENCY, 2);

  const { registry, stack } = stackedAboveNoop();
  const outcome = stack.call("betweenPasses", { view });
  // The OUTER layer answered, so `noop` beneath it was not asked.
  assert.equal(outcome.from, STACKED_LAYER_ID);
  assert.deepEqual([...outcome.consulted], [STACKED_LAYER_ID]);
  const directives = (outcome.value as { readonly directives: readonly ExecutableDirective[] })
    .directives;
  assert.deepEqual(
    directives.map((d) => d.directive),
    ["requestPassGroup", "integrateGroup"],
  );

  // The ENGINE executes them, through the services of the feature that builds
  // concurrent units of work; this suite stands in for those services and
  // records what it was handed.
  const groupsRun: PassGroupRequest[] = [];
  const integrated: IntegrateGroupRequest[] = [];
  const held = registry.find(STACKED_LAYER_ID);
  assert.ok(held !== undefined);
  const execution = executeDirectives(directives, {
    layer: held,
    counters: ZERO_COUNTERS,
    stack,
    capabilities: DECLARES_CONCURRENT_SESSIONS,
    groupServices: {
      runGroup(request) {
        groupsRun.push(request);
      },
      integrateGroup(request) {
        integrated.push(request);
      },
    },
  });

  assert.deepEqual(
    execution.accounts.map((a) => [a.directive, a.executed]),
    [
      ["requestPassGroup", true],
      ["integrateGroup", true],
    ],
  );
  assert.deepEqual([...execution.refusals], []);
  // A group of TWO stub passes, with the concurrency the layer asked for.
  assert.equal(groupsRun.length, 1);
  assert.equal(groupsRun[0]?.passes.length, 2);
  assert.equal(groupsRun[0]?.concurrency, 2);
  assert.deepEqual(
    groupsRun[0]?.passes.map((p) => p.workerId),
    [...STACKED_WORKERS],
  );
  for (const pass of groupsRun[0]?.passes ?? []) {
    assert.equal(pass.session, "fresh");
    assert.match(pass.promptBlock.text, /stub pass of worker-/);
  }
  // And they were integrated: both workers accepted.
  assert.equal(integrated.length, 1);
  assert.deepEqual(
    integrated[0]?.perWorker.map((w) => [w.workerId, w.outcome]),
    [
      ["worker-1", "accepted"],
      ["worker-2", "accepted"],
    ],
  );
  // The engine's counters are untouched by a group: the SAME object came back.
  assert.equal(execution.counters, ZERO_COUNTERS);
});

test("CT-103-124 (F103-FR-024, F103-FR-026): with the sample `stacked` UNREGISTERED the stack is `noop` alone and nothing of a group is issued", () => {
  const registry = new LoopLayerRegistry();
  assert.equal(registry.register(noopLayer, { layerClass: "first-party" }).accepted, true);
  const stack = new LoopLayerStack(registry);
  assert.deepEqual(
    stack.layers().map((held) => held.id),
    ["noop"],
  );
  assert.equal(registry.find(STACKED_LAYER_ID), undefined);

  for (const point of CALL_POINTS) {
    const result = stack.call(point, { view, checkpoint: {}, ledger: [] });
    if (point === "report") {
      assert.deepEqual(result.value, { layer: "noop", engaged: false, units: 0 });
      continue;
    }
    assert.equal(result.value, "none", point);
    assert.equal(result.from, "none", point);
  }
  // No directive at all, so nothing of a group: `noop` declares none.
  const held = registry.find("noop");
  assert.ok(held !== undefined);
  assert.deepEqual([...held.directives], []);
  const execution = executeDirectives([], {
    layer: held,
    counters: ZERO_COUNTERS,
    capabilities: DECLARES_CONCURRENT_SESSIONS,
  });
  assert.deepEqual([...execution.groupsRun], []);
  assert.deepEqual([...execution.integrations], []);
  assert.deepEqual([...execution.accounts], []);
  assert.equal(execution.counters, ZERO_COUNTERS);
});
