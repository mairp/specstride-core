/**
 * T056 of feature 103 — CHARACTERIZATION TESTS CT-103-126 and CT-103-129
 * (F103-FR-026, F103-FR-029).
 *
 * CT-103-126 — THE EXECUTION AND ACCOUNTING OF THE ELEVEN DIRECTIVES. Each of
 * the eleven is issued, executed by the ENGINE and accounted for, and each is
 * checked against the one sentence of F103-FR-026 that is about it:
 *
 *  | directive | what the engine does |
 *  |---|---|
 *  | `keep`, `repair`, `unresolved` | one record in the LAYER's namespace, with the unit it names; no counter; no other action |
 *  | `layerOffForAttempt`, `layerOffForRun` | the layer goes off for the scope named |
 *  | `giveIterationBack` | the pass number is handed back, as a yield does |
 *  | `exemptShortPass` | the short-pass counter is left as it was |
 *  | `exemptRepeatCounter` | the EXACT argument lists of the inner check set are exempt |
 *  | `requestPass` | one pass with the prompt block, directory, session, time limit and worker id it names, outside the iteration loop |
 *  | `requestPassGroup`, `integrateGroup` | carried out by the services of another feature, refused where there is none |
 *
 * CT-103-129 — THE TREE-STORE SERVICE IS RESERVED. The interface of §D.2 exists
 * in `@specstride/contracts`, this feature builds nothing of it, and a layer
 * that declares it is refused at registration while no implementation is
 * registered.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { DIRECTIVES, directiveRows } from "@specstride/contracts/ep/loop-layer";
import type { PassRequest } from "@specstride/contracts/ep/loop-layer";
import {
  TREE_STORE_OPERATIONS,
  offersExactlyTheSevenOperations,
} from "@specstride/contracts/ep/tree-store";
import {
  A_DIRECTIVE_CHANGES_A_COUNTER_OF_THE_OUTER_LOOP,
  AN_OUTCOME_TAKES_ANY_OTHER_ACTION,
  A_REQUESTED_PASS_IS_INSIDE_THE_ITERATION_LOOP,
  THE_ELEVEN_DIRECTIVES,
  UNDECLARED_DIRECTIVE_IS_REFUSED,
  UNITS_OFF_ISSUES_NO_GROUP_DIRECTIVE,
  UNIT_OUTCOMES,
  directivesTheEngineExecutes,
  executeDirectives,
  isUnitOutcome,
  unitOf,
  type ExecutableDirective,
} from "../../../../core/src/layers/directives.ts";
import { LoopLayerStack } from "../../../../core/src/layers/call-points.ts";
import {
  LoopLayerRegistry,
  TREE_STORE_SERVICE,
  THIS_FEATURE_BUILDS_THE_TREE_STORE,
  offeredServices,
} from "../../../../core/src/layers/registry.ts";
import { ZERO_COUNTERS } from "../../../../core/src/pass-loop/accounting.ts";
import { sampleTreeStore } from "../../samples/EP-04/index.ts";
import { stubIntegration, stubPass, stubPassGroup } from "../../samples/EP-04/stacked.ts";
import { DECLARES_CONCURRENT_SESSIONS, probe } from "./layer-probe.ts";

/** A layer registered with EVERY directive declared, so each can be issued. */
function layerWithEveryDirective(): {
  registry: LoopLayerRegistry;
  stack: LoopLayerStack;
  held: NonNullable<ReturnType<LoopLayerRegistry["find"]>>;
} {
  const registry = new LoopLayerRegistry();
  const all = probe("all-directives", {
    registration: { directives: [...DIRECTIVES], ledgerNamespace: "all-directives" },
  });
  assert.equal(registry.register(all.layer, { layerClass: "first-party" }).accepted, true);
  const held = registry.find("all-directives");
  assert.ok(held !== undefined);
  return { registry, stack: new LoopLayerStack(registry), held };
}

/* ------------------------------------------------------------------ *
 * CT-103-126 — the eleven directives.
 * ------------------------------------------------------------------ */

test("CT-103-126 (F103-FR-026): the closed set is the eleven of annex D §D.1, and the engine executes exactly those eleven", () => {
  assert.equal(THE_ELEVEN_DIRECTIVES.length, 11);
  assert.deepEqual(
    [...THE_ELEVEN_DIRECTIVES],
    [
      "keep",
      "repair",
      "unresolved",
      "layerOffForAttempt",
      "layerOffForRun",
      "giveIterationBack",
      "exemptShortPass",
      "exemptRepeatCounter",
      "requestPass",
      "requestPassGroup",
      "integrateGroup",
    ],
  );
  assert.deepEqual([...THE_ELEVEN_DIRECTIVES], [...DIRECTIVES]);
  assert.deepEqual(
    directiveRows.map((row) => row.directive),
    [...THE_ELEVEN_DIRECTIVES],
  );
  // One entry of the engine's table per directive, and no twelfth.
  assert.deepEqual([...directivesTheEngineExecutes()].sort(), [...THE_ELEVEN_DIRECTIVES].sort());
  assert.equal(directivesTheEngineExecutes().length, 11);
  // A directive outside the set is refused, named, and never executed.
  const { held } = layerWithEveryDirective();
  const outside = executeDirectives(
    [{ directive: "rewriteTheGate" } as unknown as ExecutableDirective],
    { layer: held, counters: ZERO_COUNTERS },
  );
  assert.equal(outside.accounts[0]?.executed, false);
  assert.match(String(outside.accounts[0]?.refusedBecause), /outside the closed set of the eleven/);
  assert.equal(UNDECLARED_DIRECTIVE_IS_REFUSED, true);
});

test("CT-103-126 (F103-FR-026): `keep`, `repair` and `unresolved` are recorded in the layer's namespace with the unit they name, change no counter and take no other action", () => {
  assert.deepEqual([...UNIT_OUTCOMES], ["keep", "repair", "unresolved"]);
  for (const outcome of UNIT_OUTCOMES) assert.equal(isUnitOutcome(outcome), true);
  assert.equal(isUnitOutcome("requestPass"), false);
  assert.equal(A_DIRECTIVE_CHANGES_A_COUNTER_OF_THE_OUTER_LOOP, false);
  assert.equal(AN_OUTCOME_TAKES_ANY_OTHER_ACTION, false);

  const { stack, held } = layerWithEveryDirective();
  const calls: readonly ExecutableDirective[] = Object.freeze([
    { directive: "keep", unit: "unit-1" },
    { directive: "repair", unit: "unit-2" },
    { directive: "unresolved", unit: "unit-3" },
  ]);
  let passesStarted = 0;
  const execution = executeDirectives(calls, {
    layer: held,
    counters: ZERO_COUNTERS,
    stack,
    runPass: () => void (passesStarted += 1),
  });

  // One record per outcome, in the LAYER's namespace, naming its unit.
  assert.deepEqual(
    [...execution.records],
    [
      { namespace: "all-directives", kind: "keep", unit: "unit-1" },
      { namespace: "all-directives", kind: "repair", unit: "unit-2" },
      { namespace: "all-directives", kind: "unresolved", unit: "unit-3" },
    ],
  );
  for (const record of execution.records) {
    assert.equal(record.namespace, held.ledgerNamespace);
    assert.notEqual(record.namespace, "core");
  }
  assert.deepEqual(
    execution.accounts.map((a) => [a.directive, a.executed, a.unit]),
    [
      ["keep", true, "unit-1"],
      ["repair", true, "unit-2"],
      ["unresolved", true, "unit-3"],
    ],
  );
  // NO COUNTER CHANGED: the very object that went in came back.
  assert.equal(execution.counters, ZERO_COUNTERS);
  assert.deepEqual(execution.counters, { errorCount: 0, capCount: 0, noProgressCount: 0 });
  // NO OTHER ACTION: no pass, no group, no exemption, nothing switched off.
  assert.equal(passesStarted, 0);
  assert.deepEqual([...execution.passesRun], []);
  assert.deepEqual([...execution.groupsRun], []);
  assert.deepEqual([...execution.integrations], []);
  assert.deepEqual([...execution.switchedOff], []);
  assert.deepEqual([...execution.repeatCounterExemptions], []);
  assert.equal(execution.passGivenBack, false);
  assert.equal(execution.shortPassCounterLeftAsItWas, false);
  assert.equal(stack.isOn("all-directives"), true);

  // An outcome that names NO unit is refused: the engine records the outcome
  // WITH the unit it names, so there is nothing to record without one.
  const noUnit = executeDirectives([{ directive: "keep" } as ExecutableDirective], {
    layer: held,
    counters: ZERO_COUNTERS,
  });
  assert.equal(noUnit.accounts[0]?.executed, false);
  assert.match(String(noUnit.accounts[0]?.refusedBecause), /names no unit of work/);
  assert.deepEqual([...noUnit.records], []);
  assert.equal(unitOf({ directive: "keep", unit: "u" }), "u");
  assert.equal(unitOf({ directive: "giveIterationBack" }), undefined);
});

test("CT-103-126 (F103-FR-026): `layerOffForAttempt` and `layerOffForRun` switch the layer off for the scope they name", () => {
  const forAttempt = layerWithEveryDirective();
  const off1 = executeDirectives([{ directive: "layerOffForAttempt" }], {
    layer: forAttempt.held,
    counters: ZERO_COUNTERS,
    stack: forAttempt.stack,
  });
  assert.equal(off1.accounts[0]?.executed, true);
  assert.equal(off1.switchedOff[0]?.scope, "phase-attempt");
  assert.equal(off1.switchedOff[0]?.reason, "layerOffForAttempt");
  assert.equal(forAttempt.stack.isOn("all-directives"), false);
  forAttempt.stack.newPhaseAttempt();
  assert.equal(forAttempt.stack.isOn("all-directives"), true);

  const forRun = layerWithEveryDirective();
  const off2 = executeDirectives([{ directive: "layerOffForRun" }], {
    layer: forRun.held,
    counters: ZERO_COUNTERS,
    stack: forRun.stack,
  });
  assert.equal(off2.switchedOff[0]?.scope, "run");
  assert.equal(forRun.stack.isOn("all-directives"), false);
  forRun.stack.newPhaseAttempt();
  assert.equal(forRun.stack.isOn("all-directives"), false);
  // Neither produced an exit code or a stop reason.
  for (const execution of [off1, off2]) {
    assert.equal(execution.counters, ZERO_COUNTERS);
    assert.equal("exit_code" in execution, false);
  }
});

test("CT-103-126 (F103-FR-026): `giveIterationBack` hands the pass number back, `exemptShortPass` leaves the short-pass counter as it was, and `exemptRepeatCounter` exempts the exact argument lists of the inner check set", () => {
  const { held } = layerWithEveryDirective();
  const innerCheckSet = Object.freeze([
    Object.freeze(["node", "--test", "a.test.ts"]),
    Object.freeze(["npm", "run", "lint"]),
  ]);
  const execution = executeDirectives(
    [
      { directive: "giveIterationBack" },
      { directive: "exemptShortPass" },
      { directive: "exemptRepeatCounter" },
    ],
    { layer: held, counters: ZERO_COUNTERS, innerCheckSet },
  );
  assert.deepEqual(
    execution.accounts.map((a) => [a.directive, a.executed]),
    [
      ["giveIterationBack", true],
      ["exemptShortPass", true],
      ["exemptRepeatCounter", true],
    ],
  );
  assert.equal(execution.passGivenBack, true);
  assert.equal(execution.shortPassCounterLeftAsItWas, true);
  // The EXACT argument lists, copied so a later change cannot reach them.
  assert.deepEqual(
    execution.repeatCounterExemptions.map((argv) => [...argv]),
    [
      ["node", "--test", "a.test.ts"],
      ["npm", "run", "lint"],
    ],
  );
  assert.notEqual(execution.repeatCounterExemptions[0], innerCheckSet[0]);
  // And no counter of the loop moved for any of the three.
  assert.equal(execution.counters, ZERO_COUNTERS);
  // With no inner check set the exemption is empty and still executed.
  const none = executeDirectives([{ directive: "exemptRepeatCounter" }], {
    layer: held,
    counters: ZERO_COUNTERS,
  });
  assert.equal(none.accounts[0]?.executed, true);
  assert.deepEqual([...none.repeatCounterExemptions], []);
});

test("CT-103-126 (F103-FR-026): `requestPass` runs one pass with the prompt block, directory, session, time limit and worker id it names, outside the iteration loop", () => {
  assert.equal(A_REQUESTED_PASS_IS_INSIDE_THE_ITERATION_LOOP, false);
  const { held } = layerWithEveryDirective();
  const ran: PassRequest[] = [];
  const request = stubPass("worker-7", "/w/worker-7");
  const execution = executeDirectives([{ directive: "requestPass", request }], {
    layer: held,
    counters: ZERO_COUNTERS,
    runPass: (given) => void ran.push(given),
  });
  assert.equal(execution.accounts[0]?.executed, true);
  assert.equal(ran.length, 1);
  assert.equal(ran[0]?.workerId, "worker-7");
  assert.equal(ran[0]?.workingDirectory, "/w/worker-7");
  assert.equal(ran[0]?.session, "fresh");
  assert.equal(ran[0]?.timeLimitMs, 1_000);
  assert.match(String(ran[0]?.promptBlock.text), /stub pass of worker-7/);
  assert.deepEqual([...execution.passesRun], [request]);
  // Outside the iteration loop: no counter of the loop moved.
  assert.equal(execution.counters, ZERO_COUNTERS);

  // A `requestPass` with no request is refused rather than guessed at.
  const empty = executeDirectives([{ directive: "requestPass" } as ExecutableDirective], {
    layer: held,
    counters: ZERO_COUNTERS,
  });
  assert.equal(empty.accounts[0]?.executed, false);
  assert.match(String(empty.accounts[0]?.refusedBecause), /carries no pass request/);
});

test("CT-103-126 (F103-FR-026): `requestPassGroup` and `integrateGroup` are carried out by the services of another feature, and are refused where none is registered", () => {
  assert.equal(UNITS_OFF_ISSUES_NO_GROUP_DIRECTIVE, true);
  const { held } = layerWithEveryDirective();

  // No service registered: both are refused, and the engine builds neither.
  const refused = executeDirectives(
    [
      { directive: "requestPassGroup", request: stubPassGroup() },
      { directive: "integrateGroup", request: stubIntegration() },
    ],
    { layer: held, counters: ZERO_COUNTERS, capabilities: DECLARES_CONCURRENT_SESSIONS },
  );
  assert.deepEqual(
    refused.accounts.map((a) => [a.directive, a.executed]),
    [
      ["requestPassGroup", false],
      ["integrateGroup", false],
    ],
  );
  for (const refusal of refused.refusals) assert.match(refusal, /no service of a group/);
  assert.deepEqual([...refused.groupsRun], []);
  assert.deepEqual([...refused.integrations], []);

  // With the services present both are executed and accounted for.
  let groups = 0;
  let integrations = 0;
  const executed = executeDirectives(
    [
      { directive: "requestPassGroup", request: stubPassGroup() },
      { directive: "integrateGroup", request: stubIntegration() },
    ],
    {
      layer: held,
      counters: ZERO_COUNTERS,
      capabilities: DECLARES_CONCURRENT_SESSIONS,
      groupServices: {
        runGroup: () => void (groups += 1),
        integrateGroup: () => void (integrations += 1),
      },
    },
  );
  assert.equal(groups, 1);
  assert.equal(integrations, 1);
  assert.equal(executed.groupsRun[0]?.passes.length, 2);
  assert.deepEqual([...executed.refusals], []);
  assert.equal(executed.counters, ZERO_COUNTERS);
});

test("CT-103-126 (F103-FR-026): every one of the eleven is accounted for in the order the layer issued them, and none changes a counter", () => {
  const { stack, held } = layerWithEveryDirective();
  const calls: readonly ExecutableDirective[] = Object.freeze([
    { directive: "keep", unit: "u1" },
    { directive: "repair", unit: "u2" },
    { directive: "unresolved", unit: "u3" },
    { directive: "giveIterationBack" },
    { directive: "exemptShortPass" },
    { directive: "exemptRepeatCounter" },
    { directive: "requestPass", request: stubPass("w", "/w") },
    { directive: "requestPassGroup", request: stubPassGroup() },
    { directive: "integrateGroup", request: stubIntegration() },
    { directive: "layerOffForAttempt" },
    { directive: "layerOffForRun" },
  ]);
  const execution = executeDirectives(calls, {
    layer: held,
    counters: ZERO_COUNTERS,
    stack,
    capabilities: DECLARES_CONCURRENT_SESSIONS,
    innerCheckSet: Object.freeze([Object.freeze(["node", "--test"])]),
    runPass: () => undefined,
    groupServices: { runGroup: () => undefined, integrateGroup: () => undefined },
  });
  // One account per directive, in the order issued, and all eleven executed.
  assert.equal(execution.accounts.length, 11);
  assert.deepEqual(
    execution.accounts.map((a) => a.directive),
    calls.map((c) => c.directive),
  );
  assert.deepEqual(
    [...new Set(execution.accounts.map((a) => a.directive))].sort(),
    [...THE_ELEVEN_DIRECTIVES].sort(),
  );
  for (const account of execution.accounts) {
    assert.equal(account.executed, true, `${account.directive}: ${String(account.refusedBecause)}`);
  }
  assert.deepEqual([...execution.refusals], []);
  // And after all eleven, not one counter moved.
  assert.equal(execution.counters, ZERO_COUNTERS);
  assert.deepEqual(execution.counters, { errorCount: 0, capCount: 0, noProgressCount: 0 });
});

/* ------------------------------------------------------------------ *
 * CT-103-129 — the tree-store service, reserved.
 * ------------------------------------------------------------------ */

test("CT-103-129 (F103-FR-029): the tree-store service of annex D §D.2 is reserved in the interface, this feature builds nothing of it, and a layer that declares it is refused while no implementation is registered", () => {
  // Reserved: the interface exists, with exactly the seven operations.
  assert.deepEqual(
    [...TREE_STORE_OPERATIONS],
    ["snapshot", "materialize", "changed", "compose", "apply", "release", "sweep"],
  );
  assert.equal(THIS_FEATURE_BUILDS_THE_TREE_STORE, false);
  assert.equal(TREE_STORE_SERVICE, "treeStore");

  // Offered only where an implementation is registered.
  assert.deepEqual([...offeredServices()], []);
  assert.deepEqual([...offeredServices({ treeStore: null })], []);
  const store = sampleTreeStore();
  assert.equal(offersExactlyTheSevenOperations(store), true);
  assert.deepEqual([...offeredServices({ treeStore: store })], ["treeStore"]);

  const wants = probe("wants-the-store", { registration: { services: ["treeStore"] } });

  const without = new LoopLayerRegistry();
  const refused = without.register(wants.layer, { layerClass: "first-party" });
  assert.equal(refused.accepted, false);
  if (!refused.accepted) {
    assert.match(refused.message, /wants-the-store/);
    assert.match(refused.message, /treeStore/);
  }
  assert.equal(without.isEmpty(), true);

  const with_ = new LoopLayerRegistry();
  const accepted = with_.register(wants.layer, {
    layerClass: "first-party",
    services: { treeStore: store },
  });
  assert.equal(accepted.accepted, true);
  assert.deepEqual([...(with_.find("wants-the-store")?.services ?? [])], ["treeStore"]);
});
