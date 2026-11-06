/**
 * T053 of feature 103 — CONFORMANCE TEST CT-103-125 (F103-FR-025, F103-FR-029).
 *
 * Negotiation at registration, in three parts.
 *
 *  1. A DIRECTIVE THE ENGINE DOES NOT OFFER refuses the layer, with a message
 *     that names the layer and the directive. The engine offers the eleven of
 *     the closed set and no twelfth.
 *  2. A SERVICE THE ENGINE DOES NOT OFFER refuses the layer the same way. The
 *     one service there can be is the tree store of annex D §D.2, and the engine
 *     offers it ONLY where an implementation of it is registered (F103-FR-029):
 *     with none, a layer that declared it is refused.
 *  3. A GROUP IS REFUSED where the harness adapter does not declare
 *     `concurrentSessions`. The refusal is of the DIRECTIVE, not of the layer:
 *     a layer may declare `requestPassGroup` on a harness that cannot run one,
 *     and finds out when it issues it.
 *
 * A refused layer is not registered at all, so the loop runs with the built-in
 * layer `none` — which is the second thing each case checks.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { DIRECTIVES, registrationRefusal } from "@specstride/contracts/ep/loop-layer";
import type { Directive } from "@specstride/contracts/ep/loop-layer";
import {
  ACCEPTED_CLASSES,
  DIRECTIVES_OFFERED,
  GROUP_CAPABILITY,
  GROUP_DIRECTIVES,
  LoopLayerRegistry,
  THIS_FEATURE_BUILDS_THE_TREE_STORE,
  TREE_STORE_SERVICE,
  declarationRefusal,
  groupRefusal,
  offeredServices,
  registerLoopLayer,
} from "../../../../core/src/layers/registry.ts";
import { executeDirectives } from "../../../../core/src/layers/directives.ts";
import { ZERO_COUNTERS } from "../../../../core/src/pass-loop/accounting.ts";
import { noopLayer } from "../../samples/EP-04/noop.ts";
import { stackedLayer, stubPassGroup, stubIntegration } from "../../samples/EP-04/stacked.ts";
import { sampleTreeStore } from "../../samples/EP-04/index.ts";
import {
  DECLARES_CONCURRENT_SESSIONS,
  DECLARES_NO_CONCURRENT_SESSIONS,
  probe,
} from "./layer-probe.ts";

test("CT-103-125 (F103-FR-025): the engine offers the eleven directives of the closed set, and a layer that declares one it does not offer is refused by name", () => {
  assert.equal(DIRECTIVES_OFFERED.length, 11);
  assert.deepEqual([...DIRECTIVES_OFFERED], [...DIRECTIVES]);

  const registry = new LoopLayerRegistry();
  const stranger = probe("stranger", {
    registration: { directives: ["summonTheProposer" as Directive] },
  });
  const refused = registry.register(stranger.layer, { layerClass: "first-party" });
  assert.equal(refused.accepted, false);
  if (!refused.accepted) {
    assert.match(refused.message, /stranger/);
    assert.match(refused.message, /summonTheProposer/);
    assert.match(refused.message, /offers no directive/);
  }
  // Refused means not registered: the loop runs with the built-in layer `none`.
  assert.equal(registry.isEmpty(), true);
  assert.equal(registry.find("stranger"), undefined);

  // Every one of the eleven IS accepted, one at a time.
  for (const directive of DIRECTIVES_OFFERED) {
    const one = new LoopLayerRegistry();
    const layer = probe(`declares-${directive}`, { registration: { directives: [directive] } });
    const outcome = one.register(layer.layer, { layerClass: "first-party" });
    assert.equal(outcome.accepted, true, directive);
  }

  // The contract's own refusal function agrees with the engine's.
  assert.equal(
    registrationRefusal({
      id: "stranger",
      directives: ["summonTheProposer" as Directive],
      services: [],
      ledgerNamespace: "stranger",
    }) !== undefined,
    true,
  );
  assert.equal(registrationRefusal(noopLayer.registration), undefined);
});

test("CT-103-125 (F103-FR-025, F103-FR-029): the tree-store service is reserved, and a layer that declares it is refused while no implementation is registered", () => {
  assert.equal(TREE_STORE_SERVICE, "treeStore");
  assert.equal(THIS_FEATURE_BUILDS_THE_TREE_STORE, false);

  // No implementation: the engine offers no service at all.
  assert.deepEqual([...offeredServices()], []);
  assert.deepEqual([...offeredServices({})], []);
  assert.deepEqual([...offeredServices({ treeStore: undefined })], []);

  const wantsTheStore = probe("wants-the-store", {
    registration: { services: [TREE_STORE_SERVICE] },
  });
  const withoutIt = new LoopLayerRegistry();
  const refused = withoutIt.register(wantsTheStore.layer, { layerClass: "first-party" });
  assert.equal(refused.accepted, false);
  if (!refused.accepted) {
    assert.match(refused.message, /wants-the-store/);
    assert.match(refused.message, /treeStore/);
    assert.match(refused.message, /offers no service/);
  }
  assert.equal(withoutIt.isEmpty(), true);

  // With an implementation registered the same layer is accepted.
  assert.deepEqual([...offeredServices({ treeStore: sampleTreeStore() })], ["treeStore"]);
  const withIt = new LoopLayerRegistry();
  const accepted = withIt.register(wantsTheStore.layer, {
    layerClass: "first-party",
    services: { treeStore: sampleTreeStore() },
  });
  assert.equal(accepted.accepted, true);
  assert.equal(withIt.find("wants-the-store")?.services.includes("treeStore"), true);

  // A service that is not the tree store is refused whatever is registered.
  assert.notEqual(
    declarationRefusal(
      { id: "x", directives: [], services: ["searchTheTree"], ledgerNamespace: "x" },
      ["treeStore"],
    ),
    undefined,
  );
});

test("CT-103-125 (F103-FR-025): a layer is accepted only as data or as first-party code", () => {
  assert.deepEqual([...ACCEPTED_CLASSES], ["data", "first-party"]);
  for (const layerClass of ACCEPTED_CLASSES) {
    assert.equal(registerLoopLayer(noopLayer, { layerClass }).accepted, true, layerClass);
  }
  const third = registerLoopLayer(noopLayer, {
    layerClass: "third-party" as unknown as "data",
  });
  assert.equal(third.accepted, false);
  if (!third.accepted) assert.match(third.message, /only as data or as first-party code/);
});

test("CT-103-125 (F103-FR-025): a group is refused where the harness adapter does not declare `concurrentSessions`", () => {
  assert.equal(GROUP_CAPABILITY, "concurrentSessions");
  assert.deepEqual([...GROUP_DIRECTIVES], ["requestPassGroup", "integrateGroup"]);

  // Declared: no refusal.
  assert.equal(groupRefusal(DECLARES_CONCURRENT_SESSIONS), undefined);
  // Not declared, in each of the three ways it can be absent.
  for (const capabilities of [
    undefined,
    DECLARES_NO_CONCURRENT_SESSIONS,
    { concurrentSessions: { value: 4, provenance: null } },
    { concurrentSessions: { value: null, provenance: "probed" as const } },
  ]) {
    const refusal = groupRefusal(capabilities);
    assert.ok(refusal !== undefined, JSON.stringify(capabilities));
    assert.match(refusal, /declares no `concurrentSessions`/);
  }
  // Declared, but one session: a group of two cannot run.
  const one = groupRefusal({ concurrentSessions: { value: 1, provenance: "declared" } });
  assert.match(String(one), /which runs no group/);

  // Through the engine: the sample layer's two group directives are refused,
  // the LAYER stays registered, and the services are never called.
  const registry = new LoopLayerRegistry();
  assert.equal(registry.register(stackedLayer, { layerClass: "first-party" }).accepted, true);
  const held = registry.find("stacked");
  assert.ok(held !== undefined);
  let serviceCalls = 0;
  const execution = executeDirectives(
    [
      { directive: "requestPassGroup", request: stubPassGroup() },
      { directive: "integrateGroup", request: stubIntegration() },
    ],
    {
      layer: held,
      counters: ZERO_COUNTERS,
      capabilities: DECLARES_NO_CONCURRENT_SESSIONS,
      groupServices: {
        runGroup: () => void (serviceCalls += 1),
        integrateGroup: () => void (serviceCalls += 1),
      },
    },
  );
  assert.deepEqual(
    execution.accounts.map((a) => [a.directive, a.executed]),
    [
      ["requestPassGroup", false],
      ["integrateGroup", false],
    ],
  );
  assert.equal(execution.refusals.length, 2);
  for (const refusal of execution.refusals) {
    assert.match(refusal, /declares no `concurrentSessions`/);
  }
  assert.equal(serviceCalls, 0, "a refused group calls no service");
  assert.deepEqual([...execution.groupsRun], []);
  assert.deepEqual([...execution.integrations], []);
  // The refusal is of the directive, not of the layer.
  assert.equal(registry.find("stacked") !== undefined, true);
  assert.equal(execution.counters, ZERO_COUNTERS);
});

test("CT-103-125 (F103-FR-025): a directive the layer did not declare at registration is refused when it is issued", () => {
  const registry = new LoopLayerRegistry();
  registry.register(noopLayer, { layerClass: "first-party" });
  const held = registry.find("noop");
  assert.ok(held !== undefined);
  const execution = executeDirectives([{ directive: "giveIterationBack" }], {
    layer: held,
    counters: ZERO_COUNTERS,
  });
  assert.equal(execution.accounts[0]?.executed, false);
  assert.match(String(execution.accounts[0]?.refusedBecause), /did not declare it at registration/);
  assert.equal(execution.passGivenBack, false);
  assert.equal(execution.counters, ZERO_COUNTERS);
});
