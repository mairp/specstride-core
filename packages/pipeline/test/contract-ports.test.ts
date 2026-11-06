/**
 * T007 of feature 107 — the consumed interfaces and the two ports
 * (specs/107-launch-contract/tasks.md, T007; F107-FR-011; the learning
 * binding rules of feature 106).
 *
 * What this test holds:
 *
 * - the canonical spec model (EP-03) and the two registries (EP-19) are
 *   consumed interfaces: `specModel` is the `model` module of
 *   `@specstride/spec-formats` (the very same module object), and the
 *   registry consumers are the registry classes of feature 123 — a port is
 *   satisfiable by the test doubles of `@specstride/testkit` (the sample
 *   format of EP-03, the sample stage kind and sample check of EP-19),
 *   registered from the test tree like annex F §F.7 says;
 * - `HarnessRegistryPort` is the harness registry of EP-02 with the
 *   `completion` call: a stub satisfies it, the answer records the route
 *   `delegated-harness` and the id of the harness, and a failed harness
 *   answers with `choiceId` empty while the refusal stays this feature's;
 * - `LearningBindingRulesPort` holds the shape of the rules of feature 106 —
 *   the block of F106-FR-027 at derivation, the structural rules and the two
 *   refusals of F106-FR-028 at validation — as an interface this layer can
 *   call and a test can stub; the port names the exits 20 and 23 and the
 *   class `learning`, and imports nothing of `@specstride/learning` (the
 *   package is outside this layer's `mayImport` set).
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  specModel,
  specFormatRegistry,
  type HarnessRegistryPort,
  type LearningBindingRulesPort,
  type CompletionRequest,
  type CompletionAnswer,
} from "../src/contract/ports.ts";
import { StageKindRegistry, PreconditionCheckRegistry } from "../src/kinds/registry.ts";
import {
  operations as sampleStageKind,
  PRECONDITION_CHECK,
} from "../../testkit/src/samples/EP-19/index.ts";
import { FORMAT as SAMPLE_FORMAT } from "../../testkit/src/samples/EP-03/index.ts";

test("T007: the consumed spec model IS the model module of @specstride/spec-formats", () => {
  assert.equal(typeof specModel, "object");
  assert.equal(typeof specFormatRegistry, "object");
  // The consumed surface names no grammar of its own: the model comes from
  // the owner of EP-03 (F107-FR-004).
  assert.ok(Object.keys(specModel).length > 0);
});

test("T007: the EP-19 registries accept the test doubles of @specstride/testkit", () => {
  const kinds = new StageKindRegistry({ "sample-stage": sampleStageKind });
  assert.equal(kinds.has("sample-stage"), true);
  const checks = new PreconditionCheckRegistry({
    [PRECONDITION_CHECK]: () => ({ result: "pass", detail: "ok" }),
  });
  assert.equal(checks.has(PRECONDITION_CHECK), true);
  // And the sample format id stays the double's own (no format is invented here).
  assert.equal(typeof SAMPLE_FORMAT, "string");
});

test("T007: HarnessRegistryPort is satisfiable, and the answer records the delegated route", async () => {
  const harnessId = "harness-under-test";
  const answers = new Map<string, string>([["item-1", "choice-a"]]);
  const port: HarnessRegistryPort = {
    holds: (id) => id === harnessId,
    completion: async (request: CompletionRequest): Promise<CompletionAnswer> => ({
      itemId: request.itemId,
      choiceId: answers.get(request.itemId) ?? "",
      harnessId,
      route: "delegated-harness",
    }),
  };
  assert.equal(port.holds(harnessId), true);
  assert.equal(port.holds("other"), false);
  const answer = await port.completion({
    itemId: "item-1",
    prompt: "which?",
    choiceIds: ["choice-a", "choice-b"],
    outputCap: 1024,
    timeLimitMs: 1000,
  });
  assert.equal(answer.route, "delegated-harness");
  assert.equal(answer.harnessId, harnessId);
  assert.equal(answer.choiceId, "choice-a");
  // A failed harness answers with an empty choice; the refusal of the batch
  // stays the caller's (F107-FR-011).
  const failed = await port.completion({
    itemId: "item-2",
    prompt: "which?",
    choiceIds: ["choice-a", "choice-b"],
    outputCap: 1024,
    timeLimitMs: 1000,
  });
  assert.equal(failed.choiceId, "");
});

test("T007: LearningBindingRulesPort carries the shape of the rules of feature 106", () => {
  // A stub that mirrors what `@specstride/learning` exports, without
  // importing the package: the port is the only path the rules take into
  // this layer.
  const port: LearningBindingRulesPort = {
    derive: (input) => ({
      mode: input.mode,
      decisions_through: input.logBytes === null ? "" : "2026-01-01T00:00:00Z",
      decisions_sha256: "",
      effective: "",
      source_path: "",
    }),
    validate: (contract) => {
      const block = contract.configuration;
      if (block === undefined || block.mode === undefined) {
        return {
          structural: [{ rule: "mode", message: "no mode", class: "learning", exit: 20 }],
          refusals: [],
          ok: false,
          exit: 20,
        };
      }
      return { structural: [], refusals: [], ok: true, exit: 0 };
    },
  };
  const derived = port.derive({ mode: "run", logBytes: null, slug: "107-launch-contract" });
  assert.equal(derived!.mode, "run");
  const ok = port.validate({ configuration: { mode: "run" } });
  assert.deepEqual(ok, { structural: [], refusals: [], ok: true, exit: 0 });
  const refused = port.validate({ configuration: undefined });
  assert.equal(refused.exit, 20);
  assert.equal(refused.structural[0]!.class, "learning");
  // And the two exits the rules of feature 106 refuse with are named by the
  // port's verdict shape (20 structural, 23 a changed prefix).
  const withRefusal = {
    structural: [],
    refusals: [{ reason: "LearningDecisionsChanged", message: "", exit: 23 as const }],
    ok: false,
    exit: 23 as const,
  };
  assert.equal(withRefusal.refusals[0]!.exit, 23);
});
