/**
 * T131 — the sample implementation of EP-06, the router rule table, outside
 * the core, registered from the test tree (annex A, §A.4, F100-FR-018; annex
 * X, §X.10, F100-FR-222).
 *
 * The sample layer of EP-04 contributes the rows of the decision points it
 * consults, and the table is EVALUATED BY THE TABLE EVALUATOR of the kernel
 * (T237, `evaluateTable`): the sample holds the table as data and calls the
 * one evaluator of the graph, so that no second evaluator exists (annex X,
 * §X.3; LR-7).
 */
import { evaluateTable, loadTable } from "@specstride/kernel";
import { EVENT_OF_A_DECISION } from "@specstride/contracts/ep/router-rules";
import type { DecisionPoint, RouteDecision, Signals } from "@specstride/contracts/ep/router-rules";
import type { Implementation } from "../../conformance/frame.ts";

/** The rule table of the sample, as data (`specstride.table/1`). */
export const TABLE = {
  schema: "specstride.table/1",
  id: "sample-router-rules",
  version: "1",
  points: {
    tools: { signals: { failedCommands: "number" }, choices: ["manifest-order", "failed-first"] },
    loop: { signals: { layerEngaged: "boolean" }, choices: ["sample-noop", "off"] },
    escalation: {
      signals: { targetIsCriticModel: "boolean" },
      choices: ["next-rung", "skip"],
    },
  },
  rows: {
    tools: [
      {
        ruleId: "sample-tools-failed-first",
        when: { op: "greater", signal: "failedCommands", value: 0 },
        choice: "failed-first",
      },
      { ruleId: "sample-tools-default", choice: "manifest-order" },
    ],
    loop: [
      {
        ruleId: "sample-loop-off",
        when: { op: "equal", signal: "layerEngaged", value: false },
        choice: "off",
      },
      { ruleId: "sample-loop-default", choice: "sample-noop" },
    ],
    escalation: [
      {
        ruleId: "sample-escalation-critic-model",
        when: { op: "equal", signal: "targetIsCriticModel", value: true },
        choice: "skip",
      },
      { ruleId: "sample-escalation-default", choice: "next-rung" },
    ],
  },
} as const;

/** The table as the one evaluator of the graph loaded it. */
export const loaded = loadTable(TABLE);

export const operations = Object.freeze({
  /** The one operation of the point: the decision, which is also its event. */
  [EVENT_OF_A_DECISION](decisionPoint: DecisionPoint, signals: Signals = {}): RouteDecision {
    const decision = evaluateTable(loaded, decisionPoint, signals);
    return Object.freeze({
      decisionPoint,
      choice: decision.choice,
      ruleId: decision.ruleId,
      signals,
      tableVersion: decision.tableVersion,
    });
  },
});

export const implementation: Implementation = Object.freeze({
  ep: "EP-06",
  pointId: "specstride.router-rules/1",
  id: "sample-router-rules",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});
