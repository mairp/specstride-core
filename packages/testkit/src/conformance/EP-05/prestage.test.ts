/**
 * T217 — the conformance case CT-100-332 at contract level for the reuse of a
 * staged command (annex C, §C.8; F100-FR-232).
 *
 * A command that is staged before the verification gate may be reused by the
 * gate only under the reuse policy its declaration names (`per-attempt`,
 * `per-phase`, `per-run`) and only while the tree is provably the tree of the
 * staged run: the same revision, and a clean working tree in the record of the
 * staged run and at the verification gate, as at the baseline (B-1128). The
 * result of a staged command is kept under `attempt:<N>:<k>:<n>:prestage`. With
 * a loop layer engaged in the phase attempt — that is, with a unit of work
 * declared in it (annex D, F100-FR-118) — the gate reuses nothing. The engine
 * hands that fact to the gate as an input of its call; the gate reads no record
 * of a loop layer.
 *
 * The rules are stated by the owner of the verification gate (F105-FR-033);
 * the contract is feature 100's and the runner is feature 148's.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  ANNEX_SECTION,
  BASELINE_ITEM,
  GATE_READS_A_RECORD_OF_A_LOOP_LAYER,
  LOOP_LAYER_ENGAGED_MEANS,
  LOOP_LAYER_REQUIREMENT,
  PRESTAGE_LOGICAL_NAME,
  PROOF_THAT_THE_TREE_IS_THE_STAGED_TREE,
  REFUSALS_OF_A_REUSE,
  REQUIREMENT,
  REUSE_POLICIES,
  REUSE_POLICY_COUNT,
  REUSE_POLICY_SCOPE,
  RULE_OWNER,
  RULE_REQUIREMENT,
  THE_ENGINE_HANDS_THE_FACT_AS_AN_INPUT,
  isReusePolicy,
  mayReuse,
  policyAdmits,
  type ReusePolicy,
  type StagedResult,
  type TreeAtTheGate,
} from "@specstride/contracts/ep/check-runner-prestage";
import { POINT_ID, type ManifestEntry } from "@specstride/contracts/ep/check-runner";
import { holdsLogicalName, rowOf } from "@specstride/contracts/ids/logical-names";
import { loadExtensionPointContract } from "../frame.ts";
import { implementation } from "../../samples/EP-05/index.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-05" as const;

const ENTRY: ManifestEntry = Object.freeze({
  id: "unit-tests",
  kind: "command",
  argv: ["npm", "test"],
  phase: 9,
  timeLimitMs: 60000,
  reuse: "per-phase",
});

/** A staged result of the attempt `e1-a1` of phase 9 of the run `R1`. */
function staged(over: Partial<StagedResult> = {}): StagedResult {
  return {
    entry: ENTRY,
    reuse: "per-phase",
    result: {
      exitCode: 0,
      durationMs: 1200,
      output: { logicalName: "unit:<unitId>:check:<i>", hash: "sha256:00", size: 12 },
      tainted: false,
      cached: false,
      flaky: false,
      interrupted: false,
      unchecked: false,
    },
    staged: {
      revision: "abc1234",
      workingTreeClean: true,
      attempt: "e1-a1",
      phase: 9,
      runId: "R1",
    },
    logicalName: PRESTAGE_LOGICAL_NAME,
    ...over,
  };
}

function gate(over: Partial<TreeAtTheGate> = {}): TreeAtTheGate {
  return {
    revision: "abc1234",
    workingTreeClean: true,
    attempt: "e1-a1",
    phase: 9,
    runId: "R1",
    ...over,
  };
}

export const cases: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-332",
    title:
      "a staged command is reused only under its declared policy and only while the tree is provably the staged tree; its result is kept under `attempt:<N>:<k>:<n>:prestage`; with a loop layer engaged the gate reuses nothing (F100-FR-232)",
    level: "contract",
    proves: ["F100-FR-232"],
    run() {
      assert.equal(ANNEX_SECTION, "annex C, §C.8");
      assert.equal(REQUIREMENT, "F100-FR-232");
      // The rules are stated by the owner of the verification gate.
      assert.equal(RULE_OWNER, "105");
      assert.equal(RULE_REQUIREMENT, "F105-FR-033");
      assert.equal(BASELINE_ITEM, "B-1128");

      // The three reuse policies, and no fourth.
      assert.equal(REUSE_POLICY_COUNT, 3);
      assert.deepEqual([...REUSE_POLICIES], ["per-attempt", "per-phase", "per-run"]);
      for (const policy of REUSE_POLICIES) {
        assert.equal(isReusePolicy(policy), true, policy);
        assert.notEqual(REUSE_POLICY_SCOPE[policy], undefined, policy);
      }
      assert.equal(isReusePolicy("per-launch"), false);

      // The result of a staged command is kept under this logical name, which
      // is a row of the one table of annex B §B.5.
      assert.equal(PRESTAGE_LOGICAL_NAME, "attempt:<N>:<k>:<n>:prestage");
      assert.equal(
        holdsLogicalName(PRESTAGE_LOGICAL_NAME),
        true,
        "the name is a row of annex B §B.5",
      );
      assert.equal(rowOf(PRESTAGE_LOGICAL_NAME).root, "control");
      assert.equal(staged().logicalName, PRESTAGE_LOGICAL_NAME);

      // A reuse the policy admits, on the staged tree, is a reuse.
      const reused = mayReuse(staged(), gate(), { loopLayerEngaged: false });
      assert.equal(reused.reused, true);
      assert.equal(reused.reused === true ? reused.policy : undefined, "per-phase");

      // Each policy admits exactly its own scope and no wider one.
      const scopes: readonly [ReusePolicy, TreeAtTheGate, boolean][] = [
        ["per-attempt", gate({ attempt: "e1-a2" }), false],
        ["per-attempt", gate(), true],
        ["per-phase", gate({ attempt: "e1-a2" }), true],
        ["per-phase", gate({ phase: 10, attempt: "e1-a1" }), false],
        ["per-run", gate({ phase: 10, attempt: "e2-a1" }), true],
        ["per-run", gate({ runId: "R2" }), false],
      ];
      for (const [policy, atTheGate, want] of scopes) {
        assert.equal(
          policyAdmits(policy, staged().staged, atTheGate),
          want,
          `${policy} at phase ${String(atTheGate.phase)} attempt ${atTheGate.attempt} of ${atTheGate.runId}`,
        );
        assert.equal(
          mayReuse(staged({ reuse: policy }), atTheGate, { loopLayerEngaged: false }).reused,
          want,
        );
      }

      // The tree must be provably the tree of the staged run: the same
      // revision, and a clean working tree in the record of the staged run and
      // at the verification gate.
      assert.equal(PROOF_THAT_THE_TREE_IS_THE_STAGED_TREE.length, 3);
      const refusals: readonly [StagedResult, TreeAtTheGate, string][] = [
        [staged(), gate({ revision: "def5678" }), "revision-differs"],
        [
          staged({ staged: { ...staged().staged, workingTreeClean: false } }),
          gate(),
          "working-tree-dirty-when-staged",
        ],
        [staged(), gate({ workingTreeClean: false }), "working-tree-dirty-at-the-gate"],
        [staged({ reuse: "whenever" as ReusePolicy }), gate(), "no-reuse-policy"],
      ];
      for (const [result, atTheGate, refusal] of refusals) {
        const decision = mayReuse(result, atTheGate, { loopLayerEngaged: false });
        assert.equal(decision.reused, false, refusal);
        assert.equal(decision.reused === false ? decision.refusal : undefined, refusal);
        assert.ok(REFUSALS_OF_A_REUSE.includes(refusal as never));
      }

      // With a loop layer engaged in the phase attempt the gate reuses
      // nothing — whatever the policy, the revision and the tree.
      assert.equal(LOOP_LAYER_ENGAGED_MEANS, "a unit of work declared in the phase attempt");
      assert.equal(LOOP_LAYER_REQUIREMENT, "F100-FR-118");
      for (const policy of REUSE_POLICIES) {
        const decision = mayReuse(staged({ reuse: policy }), gate(), { loopLayerEngaged: true });
        assert.equal(decision.reused, false, policy);
        assert.equal(
          decision.reused === false ? decision.refusal : undefined,
          "loop-layer-engaged",
        );
      }

      // The engine hands the fact as an input of the call; the gate reads no
      // record of a loop layer.
      assert.equal(THE_ENGINE_HANDS_THE_FACT_AS_AN_INPUT, true);
      assert.equal(GATE_READS_A_RECORD_OF_A_LOOP_LAYER, false);

      // The point states the guarantees of the core that a reuse must not
      // break: every command of a set runs in every check, and the
      // fingerprinting of the protected set is around every check.
      const contract = loadExtensionPointContract(EP);
      assert.equal(contract.ids[0], POINT_ID);
      assert.ok(contract.requirements.includes("F100-FR-232"), "EP-05 cites F100-FR-232");
      const core = contract.sections["Guarantees of the core"];
      assert.ok(Array.isArray(core) && core.length > 0);
      const text = core.join(" ");
      assert.match(
        text,
        /protected\s+set is fingerprinted before and after every check/,
        "a reuse never skips the fingerprinting the core guarantees",
      );
      assert.match(
        text,
        /A check is run by the runtime and never by the proposer's harness/,
        "a staged command is the runtime's, as every check is",
      );
      assert.match(
        text,
        /a check run against a changed set is `tainted`\s+and never a pass/,
        "a reuse against a changed tree can never be a pass",
      );
    },
  },
]);

export { implementation };

test("T217: the case names the point EP-05 of annex C §C.8", () => {
  assert.equal(POINT_ID, "specstride.check-runner/1");
  assert.deepEqual(
    cases.map((c) => c.id),
    ["CT-100-332"],
  );
  assert.equal(cases[0]?.level, "contract");
});

await casesAsTests(POINT_ID, implementation, cases);
