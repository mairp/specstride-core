/**
 * T130 — the conformance suite at contract level for EP-06, the router rule
 * table (annex D, §D.4): CT-100-229, CT-100-230.
 *
 * Before the named cases the suite checks the five things every suite at
 * contract level checks (annex A, §A.4). The behaviour of EP-06 belongs to
 * feature 115; its behaviour cases go in this folder beside this file.
 */
import assert from "node:assert/strict";
import {
  A_DECISION_REACHES_THE_CRITIC,
  A_DECISION_THAT_CHANGES_NOTHING_IS_STILL_AN_EVENT,
  DECISION_POINTS,
  ESCALATION_CAP_PER_PHASE_ATTEMPT,
  ESCALATION_CAP_PER_TASK,
  ESCALATION_DEFAULT_ON,
  ESCALATION_SWITCH,
  EVENT_OF_A_DECISION,
  EXACTLY_ONE_ROW_FIRES,
  IS_DATA,
  NEVER_READ,
  OPERATIONS,
  POINT_ID,
  RULE_ID_WHEN_ROUTING_IS_OFF,
  SIGNAL_TARGET_IS_CRITIC_MODEL,
  SKIP_CHOICE,
  WARNING_ON_A_SHARED_MODEL_AT_ANOTHER_EFFORT,
  decisionPointRows,
  tableIsInvalid,
} from "@specstride/contracts/ep/router-rules";
import { TABLE, implementation, loaded } from "../../samples/EP-06/index.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-06" as const;

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-229",
    title:
      "the router is one pure function over a versioned rule table with the three decision points; it runs nothing, reads no critic prompt, nonce or verdict, and cannot switch a layer on (F100-FR-129)",
    level: "contract",
    proves: ["F100-FR-129"],
    run(impl) {
      assert.deepEqual([...DECISION_POINTS], ["tools", "loop", "escalation"]);
      assert.deepEqual(
        decisionPointRows.map((r) => r.decisionPoint),
        [...DECISION_POINTS],
      );
      assert.equal(IS_DATA, true);
      assert.deepEqual([...OPERATIONS], ["route.decided"]);
      assert.equal(EVENT_OF_A_DECISION, "route.decided");
      const decide = operationOf(impl, EVENT_OF_A_DECISION) as (
        p: string,
        s: Record<string, unknown>,
      ) => { choice: string; ruleId: string; tableVersion: string };
      // One pure function, evaluated twice with the same vector: same answer.
      const a = decide("tools", { failedCommands: 2 });
      const b = decide("tools", { failedCommands: 2 });
      assert.deepEqual(a, b);
      assert.equal(a.choice, "failed-first");
      assert.equal(a.tableVersion, TABLE.version);
      // The default row fires where no row matches.
      assert.equal(decide("tools", { failedCommands: 0 }).ruleId, "sample-tools-default");
      // The decision point `loop` chooses a registered layer or off; it cannot
      // switch a layer on.
      assert.deepEqual([...loaded.points["loop"]!.choices], ["sample-noop", "off"]);
      assert.equal(NEVER_READ.includes("a nonce"), true);
      assert.equal(NEVER_READ.includes("a verdict"), true);
      assert.equal(A_DECISION_REACHES_THE_CRITIC, false);
      assert.equal(A_DECISION_THAT_CHANGES_NOTHING_IS_STILL_AN_EVENT, true);
      assert.equal(EXACTLY_ONE_ROW_FIRES, true);
      // The unknown-value rule of §D.4.
      assert.match(
        tableIsInvalid("no-such-point", [], "x", [], []) ?? "",
        /the decision point `no-such-point` is unknown/,
      );
      assert.match(
        tableIsInvalid("tools", ["noSuchSignal"], "manifest-order", [], ["manifest-order"]) ?? "",
        /the signal `noSuchSignal` is unknown/,
      );
      assert.match(
        tableIsInvalid("tools", [], "no-such-choice", [], ["manifest-order"]) ?? "",
        /outside the choice set/,
      );
      assert.equal(RULE_ID_WHEN_ROUTING_IS_OFF, "config-off");
    },
  },
  {
    id: "CT-100-230",
    title:
      "escalation is its own switch, on by default, capped at 1 per task and 2 per phase attempt, and a rung that equals a critic-class call in model and effort is skipped (F100-FR-130)",
    level: "contract",
    proves: ["F100-FR-130"],
    run(impl) {
      assert.equal(ESCALATION_SWITCH, "loop.escalation");
      assert.equal(ESCALATION_DEFAULT_ON, true);
      assert.equal(ESCALATION_CAP_PER_TASK, 1);
      assert.equal(ESCALATION_CAP_PER_PHASE_ATTEMPT, 2);
      assert.equal(SIGNAL_TARGET_IS_CRITIC_MODEL, "targetIsCriticModel");
      const decide = operationOf(impl, EVENT_OF_A_DECISION) as (
        p: string,
        s: Record<string, unknown>,
      ) => { choice: string; ruleId: string };
      assert.equal(decide("escalation", { targetIsCriticModel: true }).choice, SKIP_CHOICE);
      assert.equal(decide("escalation", { targetIsCriticModel: false }).choice, "next-rung");
      assert.equal(WARNING_ON_A_SHARED_MODEL_AT_ANOTHER_EFFORT, "critic-diversity warning");
      const never = decisionPointRows.find((r) => r.decisionPoint === "escalation")?.never ?? "";
      assert.match(never, /targetIsCriticModel/);
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-06/operations-exist",
      "EP-06/closed-result-sets",
      "EP-06/degradation",
      "EP-06/unknown-value-rule",
      "EP-06/behaviour-cases",
    ],
    {
      resultSets: [
        {
          operation: EVENT_OF_A_DECISION,
          members: [
            (v: unknown) => {
              const d = v as { decisionPoint: string; choice: string };
              return (loaded.points[d.decisionPoint]?.choices ?? []).includes(d.choice);
            },
          ],
          calls: [
            ["tools", { failedCommands: 3 }],
            ["tools", { failedCommands: 0 }],
            ["loop", { layerEngaged: false }],
            ["escalation", { targetIsCriticModel: true }],
          ],
        },
      ],
      throwingOperation: EVENT_OF_A_DECISION,
    },
  ),
  ...named,
]);

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
