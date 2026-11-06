/**
 * T068 of feature 103 — the SAMPLE BLOCK PROVIDERS of EP-15, outside the core
 * (F103-FR-030; annex A §A.4, F100-FR-018; annex X §X.10, F100-FR-222).
 *
 * Two providers, which are the two halves of §D.5's "Proving test" and of the
 * conformance test CT-103-130
 * (`../../conformance/EP-15/prompt-provider.test.ts`):
 *
 *  1. `volatileBlockProvider` — adds ONE block that is VOLATILE and NOT
 *     PROTECTED, so the block shows up in `prompt.built` and is a block the
 *     budget is allowed to drop. Being unprotected is the point: a sample that
 *     protected its block could not demonstrate the ordinary path.
 *  2. `failingBlockProvider` — FAILS when it is called. Under §D.5 and
 *     F103-FR-030 that leaves its block out, records the omission in
 *     `prompt.built`, and lets the pass run. The same function, marked
 *     protected, is the third case: a failing provider of a protected block is
 *     an ERROR OF THE PASS.
 *
 * Both live in the test tree, OUTSIDE `@specstride/core`, and are registered
 * by the conformance suite only — never by a core file (F100-FR-018). Both are
 * PURE FUNCTIONS of the context of the pass, as F103-FR-030 requires, and the
 * first frames its text as DATA.
 */
import { cutToDeclaredSize } from "@specstride/contracts/ep/prompt-block";
import type {
  Block,
  PassContext,
  PromptBlockProvider,
} from "@specstride/contracts/ep/prompt-block";

/** The id of the volatile sample block; block ids are an open set. */
export const VOLATILE_BLOCK_ID = "sample.volatile" as const;

/** The id of the block the failing sample would have contributed. */
export const FAILING_BLOCK_ID = "sample.failing" as const;

/** The writer both samples declare. */
export const SAMPLE_WRITER = "testkit/samples/EP-15" as const;

/** The size the volatile sample declares; a longer block is cut and recorded. */
export const VOLATILE_DECLARED_SIZE = 200 as const;

/** The message the failing sample throws, which `prompt.built` records. */
export const FAILURE_MESSAGE = "the sample provider of EP-15 failed on purpose" as const;

/** The sample block is volatile and NOT protected. */
export const VOLATILE_BLOCK_IS_PROTECTED = false as const;
export const VOLATILE_BLOCK_STABILITY = "volatile" as const;

/**
 * A simple, stable hash for the sample. It is NOT the canonical hasher: a
 * sample in the test tree may not import `@specstride/kernel`, and what the
 * conformance suite checks of the field is that it is 64 hexadecimal
 * characters and that the same text always gives the same value.
 */
export function sampleHash(text: string): string {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash.toString(16).padStart(64, "0");
}

/** The text of the volatile sample block, framed as DATA (F103-FR-030). */
export function volatileBlockText(context: PassContext): string {
  return (
    `<data name="sample-volatile">pass ${context.passOrdinal} of phase ` +
    `${context.phase} attempt ${context.attempt}, strategy ${context.strategy}</data>`
  );
}

/**
 * The sample that ADDS a volatile, unprotected block. It is a pure function of
 * the context: the same context always gives the same bytes and the same hash.
 */
export const volatileBlockProvider: PromptBlockProvider & {
  readonly id: typeof VOLATILE_BLOCK_ID;
  readonly writer: typeof SAMPLE_WRITER;
} = Object.freeze({
  id: VOLATILE_BLOCK_ID,
  writer: SAMPLE_WRITER,
  declaredSize: VOLATILE_DECLARED_SIZE,
  blocks(context: PassContext): readonly Block[] {
    const text = volatileBlockText(context);
    const block: Block = Object.freeze({
      id: VOLATILE_BLOCK_ID,
      bytes: Buffer.byteLength(text, "utf8"),
      hash: sampleHash(text),
      writer: SAMPLE_WRITER,
      protected: VOLATILE_BLOCK_IS_PROTECTED,
      stability: VOLATILE_BLOCK_STABILITY,
      text,
    });
    return Object.freeze([cutToDeclaredSize(block, VOLATILE_DECLARED_SIZE).block]);
  },
});

/**
 * The VARIANT THAT FAILS. `blocks` throws, which is the failure §D.5 means by
 * "Failure of an implementation". The assembler leaves the block out and
 * records the omission; the pass runs.
 */
export const failingBlockProvider: PromptBlockProvider & {
  readonly id: typeof FAILING_BLOCK_ID;
  readonly writer: typeof SAMPLE_WRITER;
} = Object.freeze({
  id: FAILING_BLOCK_ID,
  writer: SAMPLE_WRITER,
  declaredSize: VOLATILE_DECLARED_SIZE,
  blocks(_context: PassContext): readonly Block[] {
    throw new Error(FAILURE_MESSAGE);
  },
});

/**
 * The same failing provider, marked PROTECTED. F103-FR-030: "a failure of the
 * provider of a protected block MUST be an error of the pass, by the existing
 * breakers". It is a separate export rather than a flag, so that a suite
 * cannot reach the third case by accident.
 */
export const failingProtectedBlockProvider: PromptBlockProvider & {
  readonly id: typeof FAILING_BLOCK_ID;
  readonly writer: typeof SAMPLE_WRITER;
  readonly protected: true;
} = Object.freeze({
  id: FAILING_BLOCK_ID,
  writer: SAMPLE_WRITER,
  declaredSize: VOLATILE_DECLARED_SIZE,
  protected: true as const,
  blocks(_context: PassContext): readonly Block[] {
    throw new Error(FAILURE_MESSAGE);
  },
});
