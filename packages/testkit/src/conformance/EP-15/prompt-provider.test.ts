/**
 * T061 of feature 103 — CONFORMANCE TEST CT-103-130
 * (F103-FR-030, F103-FR-034).
 *
 * Three things, in the words of the task, each driven through the real
 * assembler of `packages/core/src/prompt/assembler.ts` with the real sample
 * providers of `packages/testkit/src/samples/EP-15/` — nothing here is
 * asserted from prose, and no stub stands in for either side:
 *
 *  1. **A sample provider adds a block that shows in `prompt.built`.** The
 *     block's id, bytes, hash, writer, `protected` and `stable` all appear in
 *     the record, and they are the sample's own values.
 *  2. **A failing provider leaves its block out** — and the omission is
 *     RECORDED, with its reason and the provider's message, and the assembly
 *     still produces a prompt. The two halves are one case because either
 *     alone would be a false green: a block left out and not recorded is
 *     exactly what F103-FR-034 forbids.
 *  3. **A failing provider of a PROTECTED block is an ERROR OF THE PASS.**
 *     `ProtectedProviderFailedError` is thrown, it carries the block id, and
 *     it declares itself an error of the pass so the existing breakers count
 *     it.
 *
 * Two further cases guard the two unknown-value rules of §D.5 that the three
 * above would pass without exercising, and one guards F103-SC-003 — that NO
 * block is dropped or left out without an entry — over all of the above at
 * once.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  EVENT_OF_THE_ASSEMBLY,
  OPERATIONS,
  STABILITIES,
  readProtected,
  readStability,
} from "@specstride/contracts/ep/prompt-block";
import type { PassContext } from "@specstride/contracts/ep/prompt-block";
import {
  PROMPT_BUILT,
  ProtectedProviderFailedError,
  assemblePrompt,
  everyOmissionIsRecorded,
  type AssemblerEvent,
  type RegisteredProvider,
} from "../../../../core/src/prompt/assembler.ts";
import {
  FAILING_BLOCK_ID,
  FAILURE_MESSAGE,
  SAMPLE_WRITER,
  VOLATILE_BLOCK_ID,
  VOLATILE_BLOCK_IS_PROTECTED,
  VOLATILE_BLOCK_STABILITY,
  failingBlockProvider,
  failingProtectedBlockProvider,
  sampleHash,
  volatileBlockProvider,
  volatileBlockText,
} from "../../samples/EP-15/index.ts";

const CONTEXT: PassContext = Object.freeze({
  phase: 4,
  attempt: 2,
  passOrdinal: 3,
  strategy: "classic",
  changedSinceThePassBefore: Object.freeze(["tasks.md"]),
});

/** A provider of a block that is always present, so a prompt is never empty. */
const ANCHOR: RegisteredProvider = Object.freeze({
  id: "anchor",
  declaredSize: 1_000,
  writer: "conformance/EP-15",
  blocks: () =>
    Object.freeze([
      Object.freeze({
        id: "anchor",
        bytes: 6,
        hash: "a".repeat(64),
        writer: "conformance/EP-15",
        protected: false,
        stability: "stable" as const,
        text: "anchor",
      }),
    ]),
});

function assemble(
  providers: readonly RegisteredProvider[],
): ReturnType<typeof assemblePrompt> & { readonly emitted: readonly AssemblerEvent[] } {
  const emitted: AssemblerEvent[] = [];
  const result = assemblePrompt({
    context: CONTEXT,
    promptRef: "pass:p3:prompt",
    blockSet: "current",
    providers,
    stableFirst: true,
    emit: (event) => emitted.push(event),
  });
  return Object.assign({}, result, { emitted: Object.freeze(emitted) }) as never;
}

test("CT-103-130 (F103-FR-030, F103-FR-034): a sample provider adds a block, and that block shows in `prompt.built` with every field of annex D §D.5", () => {
  // The one operation of the point, and the one event of the assembly.
  assert.deepEqual([...OPERATIONS], ["blocks"]);
  assert.equal(PROMPT_BUILT.catalogueType, EVENT_OF_THE_ASSEMBLY);

  const result = assemble([ANCHOR, volatileBlockProvider as unknown as RegisteredProvider]);

  // The block is in the prompt.
  const text = volatileBlockText(CONTEXT);
  assert.ok(result.text.includes(text), "the sample's block is in the assembled prompt");

  // And it SHOWS IN `prompt.built`, with the sample's own values.
  const entry = result.built.blocks.find((block) => block.id === VOLATILE_BLOCK_ID);
  assert.ok(entry !== undefined, "`prompt.built` names the sample's block");
  assert.equal(entry.bytes, Buffer.byteLength(text, "utf8"));
  assert.equal(entry.hash, sampleHash(text));
  assert.equal(entry.writer, SAMPLE_WRITER);
  assert.equal(entry.protected, VOLATILE_BLOCK_IS_PROTECTED);
  assert.equal(entry.stable, VOLATILE_BLOCK_STABILITY);
  assert.ok((STABILITIES as readonly string[]).includes(entry.stable));

  // The record really was emitted, and it is the one the fields came from.
  const built = result.emitted.filter((event) => event.type === EVENT_OF_THE_ASSEMBLY);
  assert.equal(built.length, 1, "every pass emits `prompt.built` exactly once");
  assert.deepEqual(built[0]?.fields, result.built);

  // Non-vacuity: the sample is volatile, so it stands AFTER the stable anchor.
  assert.ok(
    result.text.indexOf("anchor") < result.text.indexOf(text),
    "the volatile sample block stands after the stable one (F103-FR-036)",
  );
});

test("CT-103-130 (F103-FR-030, F103-FR-034): a failing provider leaves its block out, the omission is recorded in `prompt.built`, and the pass runs", () => {
  const result = assemble([ANCHOR, failingBlockProvider as unknown as RegisteredProvider]);

  // Left out.
  assert.equal(
    result.built.blocks.find((block) => block.id === FAILING_BLOCK_ID),
    undefined,
    "the block of a failing provider is not in the prompt",
  );
  assert.ok(!result.text.includes(FAILING_BLOCK_ID));

  // RECORDED — which is the half that makes "left out" acceptable at all.
  const omission = result.built.omitted.find((entry) => entry.id === FAILING_BLOCK_ID);
  assert.ok(omission !== undefined, "`prompt.built` records the omission");
  assert.equal(omission.reason, "provider-failed");
  assert.equal(omission.kept, false);
  assert.equal(omission.message, FAILURE_MESSAGE);
  assert.equal(omission.writer, SAMPLE_WRITER);

  // And the pass runs: there is a prompt, and it is the rest of the blocks.
  assert.equal(result.text, "anchor");
});

test("CT-103-130 (F103-FR-030): a failing provider of a PROTECTED block is an error of the pass, by the existing breakers", () => {
  assert.throws(
    () => assemble([ANCHOR, failingProtectedBlockProvider as unknown as RegisteredProvider]),
    (error: unknown) => {
      assert.ok(error instanceof ProtectedProviderFailedError);
      assert.equal(error.blockId, FAILING_BLOCK_ID);
      assert.equal(error.isAnErrorOfThePass, true);
      assert.ok(error.message.includes(FAILING_BLOCK_ID));
      assert.ok(error.message.includes(FAILURE_MESSAGE));
      return true;
    },
  );

  // The same provider is protected the OTHER way too — by the configured set
  // `loop.promptProtectedBlocks` rather than by the provider's own flag — and
  // the outcome is the same, so neither route can be the only one that works.
  assert.throws(
    () =>
      assemblePrompt({
        context: CONTEXT,
        promptRef: "pass:p3:prompt",
        blockSet: "current",
        providers: [ANCHOR, failingBlockProvider as unknown as RegisteredProvider],
        protectedBlocks: [FAILING_BLOCK_ID],
      }),
    ProtectedProviderFailedError,
  );
});

test("CT-103-130 (F103-FR-030): the unknown-value rules of §D.5 — `protected` unknown is not protected, `stable` unknown is volatile, and an unknown block id is accepted", () => {
  assert.equal(readProtected("yes"), false);
  assert.equal(readProtected(undefined), false);
  assert.equal(readProtected(true), true);
  assert.equal(readStability("sticky"), "volatile");
  assert.equal(readStability(undefined), "volatile");
  assert.equal(readStability("stable"), "stable");

  // The same rules through the assembler, on a provider that returns raw
  // values of the wrong shape, with an id no closed set holds.
  const odd: RegisteredProvider = Object.freeze({
    id: "an.id.no.set.declares",
    declaredSize: 1_000,
    writer: "conformance/EP-15",
    blocks: () =>
      Object.freeze([
        { id: "an.id.no.set.declares", protected: "yes", stability: "sticky", text: "odd" },
      ]) as never,
  });
  const result = assemble([ANCHOR, odd]);
  const entry = result.built.blocks.find((block) => block.id === "an.id.no.set.declares");
  assert.ok(entry !== undefined, "an unknown block id is accepted: ids are an open set");
  assert.equal(entry.protected, false);
  assert.equal(entry.stable, "volatile");
});

test("CT-103-130 (F103-FR-034, F103-SC-003): no block is dropped or left out without an entry in `prompt.built`, over every path of this suite at once", () => {
  const over: RegisteredProvider = Object.freeze({
    id: "over.budget",
    declaredSize: 10_000,
    writer: "conformance/EP-15",
    blocks: () =>
      Object.freeze([
        Object.freeze({
          id: "over.budget",
          bytes: 400,
          hash: "b".repeat(64),
          writer: "conformance/EP-15",
          protected: false,
          stability: "volatile" as const,
          text: "x".repeat(400),
        }),
      ]),
  });
  const empty: RegisteredProvider = Object.freeze({
    id: "empty.block",
    declaredSize: 10,
    writer: "conformance/EP-15",
    blocks: () =>
      Object.freeze([
        Object.freeze({
          id: "empty.block",
          bytes: 0,
          hash: "c".repeat(64),
          writer: "conformance/EP-15",
          protected: false,
          stability: "volatile" as const,
          text: "",
        }),
      ]),
  });

  const emitted: AssemblerEvent[] = [];
  const result = assemblePrompt({
    context: CONTEXT,
    promptRef: "pass:p3:prompt",
    blockSet: "current",
    providers: [
      ANCHOR,
      volatileBlockProvider as unknown as RegisteredProvider,
      failingBlockProvider as unknown as RegisteredProvider,
      empty,
      over,
    ],
    budgetBytes: 100,
    stableFirst: true,
    emit: (event) => emitted.push(event),
  });

  const offered = [ANCHOR.id, VOLATILE_BLOCK_ID, FAILING_BLOCK_ID, "empty.block", "over.budget"];
  assert.equal(everyOmissionIsRecorded(result.built, offered), true);

  // The four reasons really are distinguished, so the check above is not
  // satisfied by one catch-all entry.
  const reasons = new Set(result.built.omitted.map((entry) => entry.reason));
  assert.deepEqual([...reasons].sort(), ["empty", "over-budget", "provider-failed"]);

  // And the two events of F103-FR-033 are DERIVED from the same record: the
  // dropped block that produced the event has its entry in `omitted`.
  const dropped = emitted.filter((event) => event.type === "prompt.block_dropped");
  assert.equal(dropped.length, 1);
  assert.equal(dropped[0]?.fields.block, "over.budget");
  assert.ok(
    result.built.omitted.some(
      (entry) => entry.id === "over.budget" && entry.reason === "over-budget" && !entry.kept,
    ),
  );
});
