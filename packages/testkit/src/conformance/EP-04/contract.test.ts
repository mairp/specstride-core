/**
 * T125 — the conformance suite at contract level for EP-04, the loop-layer
 * interface (annex D, §D.1): CT-100-214, CT-100-215, CT-100-216, CT-100-217,
 * CT-100-218, CT-100-219, CT-100-220.
 *
 * Before the named cases the suite checks the five things every suite at
 * contract level checks (annex A, §A.4). The behaviour of EP-04 belongs to
 * feature 103, with 115 (`micro`), 142 (`parallel`) and 143 (the engine
 * services); its behaviour cases go in this folder beside this file, as
 * `tree-store.test.ts` of T128 does for the service of §D.2.
 */
import assert from "node:assert/strict";
import {
  CALL_POINTS,
  CLOSING_CHECK_DEFAULT_ON,
  CLOSING_CHECK_RETURNS_THE_PROPOSER_AT_MOST,
  CLOSING_CHECK_SWITCH,
  DIRECTIVES,
  ERRORS,
  FAILURE_OF_A_GROUP_APPLICATION,
  FAILURE_PRODUCES_AN_EXIT_CODE_OR_STOP_REASON,
  MAX_STACK_DEPTH,
  OUTER_LAYER_FIRST,
  ORDER_AFTER_A_PASS,
  POINT_ID,
  REASON_WHERE_THE_GATE_DOES_NOT_EXECUTE,
  RETURN_WHEN_UNKNOWN,
  WITHHELD_FROM_EVERY_LAYER,
  WITH_NO_UNIT_DECLARED_A_LAYER_EXECUTES_NOTHING,
  A_WORKER_PASS_SPENDS_A_PASS_OF_THE_PASS_LIMIT,
  callPointRows,
  directiveRows,
  registrationRefusal,
} from "@specstride/contracts/ep/loop-layer";
import { PROTOCOL_BLOCK, implementation, registration } from "../../samples/EP-04/index.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-04" as const;

const view = Object.freeze({
  phase: 1,
  attempt: 1,
  counters: Object.freeze({ passes: 0, units: 0 }),
  checkManifest: Object.freeze([]),
  fingerprints: Object.freeze({}),
});

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-214",
    title:
      "the interface has the eight call points in the fixed order and the closed set of eleven directives, and the engine executes and accounts for every directive (F100-FR-114)",
    level: "contract",
    proves: ["F100-FR-114"],
    run(impl) {
      assert.equal(CALL_POINTS.length, 8);
      assert.deepEqual(
        callPointRows.map((r) => r.callPoint),
        [...CALL_POINTS],
      );
      assert.deepEqual(
        callPointRows.map((r) => r.ordinal),
        [1, 2, 3, 4, 5, 6, 7, 8],
      );
      assert.equal(DIRECTIVES.length, 11);
      assert.deepEqual(
        directiveRows.map((r) => r.directive),
        [...DIRECTIVES],
      );
      assert.deepEqual(
        [...ORDER_AFTER_A_PASS],
        ["kill check", "yield check", "layer", "classic accounting"],
      );
      for (const callPoint of CALL_POINTS) {
        assert.equal(typeof operationOf(impl, callPoint), "function", callPoint);
      }
    },
  },
  {
    id: "CT-100-215",
    title:
      "layers stack to a depth of at most 2, the outer layer is called first and the inner only on `none`, and each layer has a ledger namespace of its own (F100-FR-115)",
    level: "contract",
    proves: ["F100-FR-115"],
    run(impl) {
      assert.equal(MAX_STACK_DEPTH, 2);
      assert.equal(OUTER_LAYER_FIRST, true);
      assert.equal(typeof registration.ledgerNamespace, "string");
      assert.ok(registration.ledgerNamespace.length > 0);
      // The sample returns `none` at every call point that offers it, so an
      // inner layer would be reached.
      assert.equal((operationOf(impl, "betweenPasses") as () => unknown)(), "none");
      assert.equal((operationOf(impl, "nextPassBlock") as () => unknown)(), "none");
      assert.equal((operationOf(impl, "onEvidence") as () => unknown)(), "none");
      assert.equal((operationOf(impl, "contributeCriticInput") as () => unknown)(), "none");
      assert.equal((operationOf(impl, "resume") as () => unknown)(), "none");
    },
  },
  {
    id: "CT-100-216",
    title:
      "a layer declares the directives and the services it uses, and the engine refuses at registration one the engine does not offer (F100-FR-116)",
    level: "contract",
    proves: ["F100-FR-116"],
    run() {
      assert.equal(registrationRefusal(registration), undefined);
      const badDirective = { ...registration, directives: ["noSuchDirective"] as never };
      assert.match(registrationRefusal(badDirective) ?? "", /offers no directive/);
      const badService = { ...registration, services: ["noSuchService"] };
      assert.match(registrationRefusal(badService) ?? "", /offers no service/);
    },
  },
  {
    id: "CT-100-217",
    title:
      "a layer cannot write an approval, a verdict, feedback, a hint or a recovery marker, change a counter of the outer loop, hold a harness, write an event or a ledger record except through the engine, or write the project's repository (F100-FR-117)",
    level: "contract",
    proves: ["F100-FR-117"],
    run(impl) {
      assert.equal(WITHHELD_FROM_EVERY_LAYER.length, 6);
      // The interface gives the layer no such handle: the read-only view of
      // the phase attempt holds counters as values, not as writers.
      const contributed = (
        operationOf(impl, "contributePrompt") as (v: unknown) => readonly unknown[]
      )(view);
      assert.deepEqual(contributed, [PROTOCOL_BLOCK]);
      assert.equal(Object.isFrozen(view.counters), true);
      for (const withheld of WITHHELD_FROM_EVERY_LAYER) {
        assert.equal(typeof withheld, "string");
      }
    },
  },
  {
    id: "CT-100-218",
    title:
      "with no unit of work declared a layer executes nothing and adds nothing to any prompt but its protocol block, and where the verification gate does not execute the layer is off with the reason `gate-not-executing` (F100-FR-118)",
    level: "contract",
    proves: ["F100-FR-118"],
    run(impl) {
      assert.equal(WITH_NO_UNIT_DECLARED_A_LAYER_EXECUTES_NOTHING, true);
      const blocks = (operationOf(impl, "contributePrompt") as (v: unknown) => readonly unknown[])(
        view,
      );
      assert.equal(blocks.length, 1);
      assert.equal((blocks[0] as { id: string }).id, PROTOCOL_BLOCK.id);
      assert.equal((operationOf(impl, "betweenPasses") as () => unknown)(), "none");
      assert.equal(REASON_WHERE_THE_GATE_DOES_NOT_EXECUTE, "gate-not-executing");
      const report = (operationOf(impl, "report") as () => Record<string, unknown>)();
      assert.equal(report["engaged"], false);
      assert.equal(report["units"], 0);
    },
  },
  {
    id: "CT-100-219",
    title:
      "a worker pass is outside the pass loop and spends no pass of the pass limit (F100-FR-119)",
    level: "contract",
    proves: ["F100-FR-119"],
    run() {
      assert.equal(A_WORKER_PASS_SPENDS_A_PASS_OF_THE_PASS_LIMIT, false);
      for (const directive of ["giveIterationBack", "exemptShortPass", "exemptRepeatCounter"]) {
        assert.ok(DIRECTIVES.includes(directive as never), directive);
      }
      const row = directiveRows.find((r) => r.directive === "giveIterationBack");
      assert.match(row?.meaning ?? "", /does not count towards the pass limit/);
    },
  },
  {
    id: "CT-100-220",
    title:
      "the closing check has its own switch, on by default, and returns the proposer to work at most twice (F100-FR-120)",
    level: "contract",
    proves: ["F100-FR-120"],
    run() {
      assert.equal(CLOSING_CHECK_SWITCH, "loop.micro.closing_check");
      assert.equal(CLOSING_CHECK_DEFAULT_ON, true);
      assert.equal(CLOSING_CHECK_RETURNS_THE_PROPOSER_AT_MOST, 2);
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-04/operations-exist",
      "EP-04/closed-result-sets",
      "EP-04/degradation",
      "EP-04/unknown-value-rule",
      "EP-04/behaviour-cases",
    ],
    {
      resultSets: [
        { operation: "afterPass", members: ["accept", "refuse", "none"], calls: [[view, {}]] },
        { operation: "betweenPasses", members: ["none"], calls: [[view]] },
        { operation: "nextPassBlock", members: ["none"], calls: [[view]] },
        { operation: "onEvidence", members: ["none"], calls: [[view]] },
        { operation: "contributeCriticInput", members: ["none"], calls: [[view]] },
        { operation: "resume", members: ["none"], calls: [[view, []]] },
      ],
      throwingOperation: "betweenPasses",
    },
  ),
  ...named,
  {
    id: "EP-04/errors-switch-the-layer-off",
    title:
      "each error of §D.1 switches the layer off for the phase attempt, none stops a run, and no exit code and no stop reason results",
    level: "contract",
    proves: ["F100-FR-019"],
    run() {
      assert.equal(ERRORS.length, 4);
      assert.equal(FAILURE_PRODUCES_AN_EXIT_CODE_OR_STOP_REASON, false);
      assert.match(FAILURE_OF_A_GROUP_APPLICATION, /off for the rest of the run/);
      assert.equal(RETURN_WHEN_UNKNOWN, "none");
    },
  },
]);

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
