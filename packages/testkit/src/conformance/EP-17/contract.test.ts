/**
 * T142 — the conformance suite at contract level for EP-17, the detach
 * strategy (annex F, §F.6): CT-100-265.
 *
 * Before the named case the suite checks the five things every suite at
 * contract level checks (annex A, §A.4). The behaviour of EP-17 belongs to
 * feature 122; its behaviour cases go in this folder beside this file.
 */
import assert from "node:assert/strict";
import {
  CORE_GUARANTEES,
  DEFAULT_STRATEGY,
  ERRORS,
  FAILURE_OUTCOME,
  IMPLEMENTATION_GUARANTEES,
  OPERATIONS,
  POINT_ID,
  STRATEGY_WITHOUT_DETACHING,
  SURVIVES_A_REBOOT_IN_WAVE_1,
  UNKNOWN_STRATEGY_EXIT_CODE,
  WAVE_1_STRATEGIES,
  unknownStrategyMessage,
} from "@specstride/contracts/ep/detach";
import { STRATEGY_ID, implementation, setAvailable, starts } from "../../samples/EP-17/index.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-17" as const;

const startInput = Object.freeze({
  runtimeEntry: Object.freeze(["/sample/bin/runtime", "--detached"]),
  environmentAllowList: Object.freeze(["PATH", "LC_ALL"]),
  runtimeLogLogicalName: "launch:<launchId>:runtime-log",
  launchNonce: "nonce-1",
});

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-265",
    title:
      "a detach strategy offers `available`, `start` and `describe` as in §F.6, and the product works with the strategy `foreground` where `spawn-detached` does not survive the end of a host session (F100-FR-165)",
    level: "contract",
    proves: ["F100-FR-165"],
    async run(impl) {
      assert.deepEqual([...OPERATIONS], ["available", "start", "describe"]);
      assert.deepEqual([...ERRORS], ["unavailable", "not-ready"]);
      assert.deepEqual([...WAVE_1_STRATEGIES], ["spawn-detached", "foreground"]);
      assert.equal(DEFAULT_STRATEGY, "spawn-detached");
      assert.equal(STRATEGY_WITHOUT_DETACHING, "foreground");
      setAvailable(true);
      const available = (
        operationOf(impl, "available") as () => { available: boolean; reason: string }
      )();
      assert.equal(available.available, true);
      assert.equal(typeof available.reason, "string");
      const before = starts.length;
      const started = await (
        operationOf(impl, "start") as (i: unknown) => Promise<{ sessionLeader: boolean }>
      )(startInput);
      assert.equal(starts.length, before + 1);
      // Standard input closed, output on the runtime log by logical name, the
      // environment allow-list, and the leader of a session of its own.
      assert.equal(started.sessionLeader, true);
      assert.equal(
        starts[starts.length - 1]?.runtimeLogLogicalName,
        startInput.runtimeLogLogicalName,
      );
      assert.deepEqual(
        [...(starts[starts.length - 1]?.environmentAllowList ?? [])],
        ["PATH", "LC_ALL"],
      );
      const described = (
        operationOf(impl, "describe") as () => {
          id: string;
          survives: { endOfTheParent: boolean; endOfTheHostSession: boolean; reboot: boolean };
        }
      )();
      assert.equal(described.id, STRATEGY_ID);
      assert.equal(described.survives.reboot, SURVIVES_A_REBOOT_IN_WAVE_1);
      // A strategy that is unavailable refuses the launch with the outcome
      // `refused`, and the message names `foreground`.
      setAvailable(false);
      const unavailable = (
        operationOf(impl, "available") as () => { available: boolean; reason: string }
      )();
      assert.equal(unavailable.available, false);
      assert.match(unavailable.reason, /foreground/);
      setAvailable(true);
      assert.equal(FAILURE_OUTCOME, "refused");
      assert.equal(UNKNOWN_STRATEGY_EXIT_CODE, 3);
      assert.match(unknownStrategyMessage("no-such-strategy"), /exit 3/);
      assert.equal(CORE_GUARANTEES.length, 3);
      assert.equal(IMPLEMENTATION_GUARANTEES.length, 4);
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-17/operations-exist",
      "EP-17/closed-result-sets",
      "EP-17/degradation",
      "EP-17/unknown-value-rule",
      "EP-17/behaviour-cases",
    ],
    {
      resultSets: [
        {
          operation: "available",
          members: [(v: unknown) => typeof (v as { available: boolean }).available === "boolean"],
          calls: [[]],
        },
        {
          operation: "describe",
          members: [
            (v: unknown) =>
              (WAVE_1_STRATEGIES as readonly string[]).includes((v as { id: string }).id) ||
              typeof (v as { id: string }).id === "string",
          ],
          calls: [[]],
        },
      ],
      throwingOperation: "start",
    },
  ),
  ...named,
]);

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
