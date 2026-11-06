/**
 * T215 — the conformance cases CT-100-330 and CT-100-331 at contract level for
 * the session identity and the context window of a critic (annex C, §C.3;
 * F100-FR-230, F100-FR-231).
 *
 * CT-100-330: the proof of a critic-class call shows that the call ran in a
 * session of its own, in one of the three ways of F100-FR-230, and records
 * which. Case 3 is the weaker proof, for a tested harness adapter only. A proof
 * that fails refuses a configured critic with `critic_not_toolless` and halts
 * the run; it passes over an automatically picked one. Under the `parity`
 * profile no proof is made, as at the baseline.
 *
 * CT-100-331: a critic runs only on a model whose context window is known. A
 * declared window always wins; where a declared and an effective window differ
 * the smaller is used; a model whose window is not known does not qualify for
 * an automatic pick; outside the `parity` profile a configured critic on an
 * unlisted model with no declared window is refused and no fallback window is
 * used; under the `parity` profile the as-is fallback of each harness applies.
 *
 * The cases run against the sample implementation of EP-02 of the test tree, as
 * every suite of this folder does. The behaviour belongs to features 109, 124,
 * 125, 130, 131, 134 and 138; the contract is feature 100's.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  AN_UNKNOWN_WINDOW_QUALIFIES_FOR_AN_AUTOMATIC_PICK,
  AS_IS_FALLBACK_WINDOWS,
  A_DECLARED_WINDOW_ALWAYS_WINS,
  A_FALLBACK_WINDOW_IS_USED_OUTSIDE_PARITY,
  A_CRITIC_NEEDS_A_KNOWN_WINDOW,
  CRITIC_PROOF_KINDS,
  CRITIC_PROVENANCE,
  DECLARED_WINDOW_KEYS,
  FAILURE_OF_A_REFUSED_PROOF,
  PARITY_ROWS_OF_THE_PROOF,
  PARITY_ROWS_OF_THE_WINDOW,
  PROOF_IS_MADE_UNDER_PARITY,
  PROOF_KIND_OF_FORM,
  SESSION_PROOF_CASES,
  SESSION_PROOF_CASE_COUNT,
  SESSION_PROOF_CASE_NUMBERS,
  SESSION_PROOF_CASE_RULES,
  THE_CASE_IS_RECORDED,
  THE_SMALLER_WINDOW_IS_USED,
  WEAKER_PROOF_IS_RECORDED_ON_EVERY_CALL,
  WEAKER_PROOF_IS_TESTED_ADAPTER_ONLY,
  WEAKER_PROOF_RESTS_ON,
  WEAKER_SESSION_PROOF_CASE,
  criticProofKinds,
  judgeProof,
  qualifiesForAnAutomaticPick,
  ruleOfCase,
  windowInForce,
  type SessionProof,
} from "@specstride/contracts/enums/critic-proof";
import { PROOF_IS_RECORDED_FOR_EVERY_CALL } from "@specstride/contracts/enums/completion-forms";
import { POINT_ID } from "@specstride/contracts/ep/harness";
import { closedSetRows } from "@specstride/contracts";
import { loadProfile } from "@specstride/contracts/profile/parity";
import { loadExtensionPointContract } from "../frame.ts";
import { implementation } from "../../samples/EP-02/index.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-02" as const;

/** A proof that passes, as a starting point for the cases that vary one fact. */
function proof(over: Partial<SessionProof> = {}): SessionProof {
  return {
    form: "tool-less",
    kind: "initial-record",
    sessionProofCase: "caller-minted-id",
    weakerProof: false,
    testedHarnessAdapter: true,
    passed: true,
    provenance: "configured",
    underParity: false,
    ...over,
  };
}

export const cases: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-330",
    title:
      "the proof of a critic-class call shows a session of its own in one of three ways and records which; a failed proof refuses a configured critic and passes over an automatically picked one; under `parity` no proof is made (F100-FR-230)",
    level: "contract",
    proves: ["F100-FR-230"],
    run() {
      // The three ways, in the order of F100-FR-230, each with its number.
      assert.equal(SESSION_PROOF_CASE_COUNT, 3);
      assert.equal(SESSION_PROOF_CASES.length, 3);
      assert.deepEqual(
        [...SESSION_PROOF_CASES],
        ["caller-minted-id", "harness-given-id", "no-session-in-the-initial-record"],
      );
      assert.deepEqual(
        SESSION_PROOF_CASE_RULES.map((r) => r.number),
        [1, 2, 3],
      );
      for (const one of SESSION_PROOF_CASES) {
        assert.equal(SESSION_PROOF_CASE_NUMBERS[one], ruleOfCase(one).number);
      }
      // Which way was taken is recorded on every call.
      assert.equal(THE_CASE_IS_RECORDED, true);
      assert.equal(PROOF_IS_RECORDED_FOR_EVERY_CALL, true);
      const accepted = judgeProof(proof());
      assert.equal(accepted.accepted, true);
      assert.equal(
        accepted.accepted === true ? accepted.recorded : undefined,
        "caller-minted-id",
        "the accepted proof records the case it took",
      );

      // Case 3 is the weaker proof, for a tested harness adapter only, and is
      // recorded as the weaker proof on every call that rests on it.
      assert.equal(WEAKER_SESSION_PROOF_CASE, "no-session-in-the-initial-record");
      assert.equal(ruleOfCase(WEAKER_SESSION_PROOF_CASE).weaker, true);
      assert.equal(WEAKER_PROOF_IS_TESTED_ADAPTER_ONLY, true);
      assert.equal(WEAKER_PROOF_IS_RECORDED_ON_EVERY_CALL, true);
      assert.deepEqual([...WEAKER_PROOF_RESTS_ON], ["versionPin", "preflight", "flagSet"]);
      const weaker = judgeProof(
        proof({ sessionProofCase: WEAKER_SESSION_PROOF_CASE, kind: "pinned-configuration" }),
      );
      assert.equal(weaker.accepted, true);
      assert.equal(weaker.accepted === true ? weaker.weakerProof : false, true);
      const untested = judgeProof(
        proof({
          sessionProofCase: WEAKER_SESSION_PROOF_CASE,
          kind: "pinned-configuration",
          testedHarnessAdapter: false,
        }),
      );
      assert.equal(untested.accepted, false, "case 3 by an untested adapter is refused");

      // A proof that fails refuses a configured critic with
      // `critic_not_toolless`, which halts the run, and passes over an
      // automatically picked one.
      assert.deepEqual([...CRITIC_PROVENANCE], ["configured", "automatically-picked"]);
      const configured = judgeProof(proof({ passed: false, provenance: "configured" }));
      assert.equal(configured.accepted, false);
      assert.equal(
        configured.accepted === false ? configured.failure : undefined,
        "critic_not_toolless",
      );
      assert.equal(FAILURE_OF_A_REFUSED_PROOF, "critic_not_toolless");
      assert.equal(
        configured.accepted === false ? configured.consequence : undefined,
        "refuse-and-halt",
      );
      const picked = judgeProof(proof({ passed: false, provenance: "automatically-picked" }));
      assert.equal(picked.accepted, false);
      assert.equal(picked.accepted === false ? picked.consequence : undefined, "pass-over");

      // Under the `parity` profile no proof is made, as at the baseline, so a
      // call that would otherwise be refused is not refused for want of one.
      assert.equal(PROOF_IS_MADE_UNDER_PARITY, false);
      const underParity = judgeProof(proof({ passed: false, underParity: true }));
      assert.equal(underParity.accepted, true);

      // The kinds of proof are the closed set of row 128 of annex X §X.6.
      assert.equal(criticProofKinds.number, 128);
      assert.equal(criticProofKinds.name, "Kinds of proof of the form of a critic");
      const row128 = closedSetRows.find((r) => r.number === 128);
      assert.ok(row128 !== undefined, "the table of annex X §X.6 holds row 128");
      assert.deepEqual([...CRITIC_PROOF_KINDS], [...row128.literals]);
      assert.deepEqual(
        [...CRITIC_PROOF_KINDS],
        ["initial-record", "pinned-configuration", "read-only-sandbox"],
      );
      const unknown = criticProofKinds.onUnknown("whatever");
      assert.equal(unknown.kind, "default");
      assert.equal(
        unknown.treatedAs,
        FAILURE_OF_A_REFUSED_PROOF,
        "an unknown kind of proof is read as `critic_not_toolless` (row 128)",
      );
      // Each form is proved by the kinds §C.3 names for it, and no other.
      assert.deepEqual(
        [...PROOF_KIND_OF_FORM["tool-less"]],
        ["initial-record", "pinned-configuration"],
      );
      assert.deepEqual([...PROOF_KIND_OF_FORM["read-only-tools"]], ["read-only-sandbox"]);
      const wrongKind = judgeProof(proof({ form: "read-only-tools", kind: "initial-record" }));
      assert.equal(wrongKind.accepted, false);

      // The absence of a proof under `parity` rests on rows 28 and 117 of the
      // profile, and both rows exist with the values the requirement cites.
      const profile = loadProfile();
      assert.deepEqual([...PARITY_ROWS_OF_THE_PROOF], [28, 117]);
      const row28 = profile.find((r) => r.number === 28);
      const row117 = profile.find((r) => r.number === 117);
      assert.ok(row28 !== undefined && row117 !== undefined);
      assert.equal(row117.keys[0], "harnesses.dsh.critic.proof");
      assert.match(row117.parity, /none/);
      assert.equal(row28.keys[0], "roles.critic.transport");
      assert.match(row28.parity, /as-is/);

      // F100-FR-230 is a requirement of EP-02, and the point states the
      // guarantees an implementation gives.
      const contract = loadExtensionPointContract(EP);
      assert.ok(
        contract.requirements.includes("F100-FR-230"),
        "EP-02 cites F100-FR-230 (annex C, §C.3)",
      );
      const guarantees = contract.sections["Guarantees of an implementation"];
      assert.ok(Array.isArray(guarantees) && guarantees.length > 0);
      const text = guarantees.join(" ");
      assert.match(
        text,
        /states the permission mode on\s+every call/,
        "the permission mode is stated on every call, which the proof of the form rests on",
      );
      assert.match(
        text,
        /reports unknown values as null and never guesses/,
        "an unknown fact is null, never guessed: a proof is never invented",
      );
    },
  },
  {
    id: "CT-100-331",
    title:
      "a critic runs only on a model whose context window is known; a declared window always wins and the smaller of two is used; an unknown window does not qualify for an automatic pick; outside `parity` no fallback is used (F100-FR-231)",
    level: "contract",
    proves: ["F100-FR-231"],
    run() {
      assert.equal(A_CRITIC_NEEDS_A_KNOWN_WINDOW, true);
      assert.deepEqual(
        [...DECLARED_WINDOW_KEYS],
        ["roles.critic.contextTokens", "harnesses.<id>.contextWindows"],
      );

      // A declared window always wins.
      assert.equal(A_DECLARED_WINDOW_ALWAYS_WINS, true);
      const declaredOnly = windowInForce({
        declared: 120000,
        listed: false,
        underParity: false,
        provenance: "configured",
      });
      assert.equal(declaredOnly.known, true);
      assert.equal(declaredOnly.known === true ? declaredOnly.window : 0, 120000);
      assert.equal(declaredOnly.known === true ? declaredOnly.from : "", "declared");

      // Where a declared and an effective window differ, the smaller is used.
      assert.equal(THE_SMALLER_WINDOW_IS_USED, true);
      for (const [declared, effective, want] of [
        [200000, 100000, 100000],
        [100000, 200000, 100000],
      ] as const) {
        const decision = windowInForce({
          declared,
          effective,
          listed: true,
          underParity: false,
          provenance: "configured",
        });
        assert.equal(decision.known === true ? decision.window : 0, want);
        assert.equal(
          decision.known === true ? decision.from : "",
          "the-smaller-of-both",
          "the smaller window is used and the choice is recorded",
        );
      }

      // A model whose window is not known does not qualify for an automatic pick.
      assert.equal(AN_UNKNOWN_WINDOW_QUALIFIES_FOR_AN_AUTOMATIC_PICK, false);
      assert.equal(
        qualifiesForAnAutomaticPick({
          listed: false,
          underParity: false,
          provenance: "automatically-picked",
        }),
        false,
      );
      assert.equal(
        qualifiesForAnAutomaticPick({
          effective: 200000,
          listed: true,
          underParity: false,
          provenance: "automatically-picked",
        }),
        true,
      );

      // Outside the `parity` profile a configured critic on an unlisted model
      // with no declared window is refused, and no fallback window is used.
      assert.equal(A_FALLBACK_WINDOW_IS_USED_OUTSIDE_PARITY, false);
      const refused = windowInForce({
        listed: false,
        asIsFallback: 128000,
        underParity: false,
        provenance: "configured",
      });
      assert.equal(refused.known, false);
      assert.equal(refused.known === false ? refused.refusal : undefined, "window-unknown");
      assert.equal(refused.known === false ? refused.qualifiesForAnAutomaticPick : true, false);

      // Under the `parity` profile the as-is fallback window of each harness
      // applies to such a critic: 128,000, 200,000 or 98,304 tokens.
      assert.deepEqual([...AS_IS_FALLBACK_WINDOWS], [128000, 200000, 98304]);
      for (const fallback of AS_IS_FALLBACK_WINDOWS) {
        const decision = windowInForce({
          listed: false,
          asIsFallback: fallback,
          underParity: true,
          provenance: "configured",
        });
        assert.equal(decision.known === true ? decision.window : 0, fallback);
        assert.equal(decision.known === true ? decision.from : "", "as-is-fallback");
      }

      // The window rule rests on rows 28, 55 and 57 of annex X §X.7, and each
      // row exists with the key and the value under `parity` it cites.
      const profile = loadProfile();
      assert.deepEqual([...PARITY_ROWS_OF_THE_WINDOW], [28, 55, 57]);
      const row55 = profile.find((r) => r.number === 55);
      const row57 = profile.find((r) => r.number === 57);
      assert.ok(row55 !== undefined && row57 !== undefined);
      assert.equal(row55.keys[0], "roles.critic.contextTokens");
      assert.match(row55.parity, /as-is fallback/);
      assert.equal(row57.keys[0], "prompt.critic.overWindow");
      assert.match(row57.parity, /send/);

      // F100-FR-231 is a requirement of EP-02: the harness adapter refuses the
      // critic, so the rule belongs to the point.
      const contract = loadExtensionPointContract(EP);
      assert.ok(contract.requirements.includes("F100-FR-231"));
    },
  },
]);

export { implementation };

test("T215: the two cases name the point EP-02 of annex C §C.3", () => {
  assert.equal(POINT_ID, "specstride.harness/1");
  assert.deepEqual(
    cases.map((c) => c.id),
    ["CT-100-330", "CT-100-331"],
  );
  for (const one of cases) assert.equal(one.level, "contract");
});

await casesAsTests(POINT_ID, implementation, cases);
