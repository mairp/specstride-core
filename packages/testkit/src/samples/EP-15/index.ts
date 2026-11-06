/**
 * T134 — the sample implementation of EP-15, the prompt block provider,
 * outside the core, registered from the test tree (annex A, §A.4,
 * F100-FR-018; annex X, §X.10, F100-FR-222).
 *
 * A sample provider that adds one block, which §D.5 "Proving test" names: the
 * block shows up in `prompt.built`. The provider is a pure function of the
 * context of the pass, and it frames text from outside the runtime as data.
 */
import { cutToDeclaredSize } from "@specstride/contracts/ep/prompt-block";
import type { Block, PassContext } from "@specstride/contracts/ep/prompt-block";
import type { Implementation } from "../../conformance/frame.ts";

/** The size the provider declares for its block; a longer block is cut. */
export const DECLARED_SIZE = 160 as const;

/** The id of the block the sample contributes; block ids are an open set. */
export const BLOCK_ID = "sample.block" as const;

function hashOf(text: string): string {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash.toString(16).padStart(64, "0");
}

export const operations = Object.freeze({
  blocks(context: PassContext): readonly Block[] {
    // Text from outside the runtime is framed as data, never as instruction.
    const text =
      `<data name="sample-block">phase ${context.phase}, attempt ${context.attempt}, ` +
      `pass ${context.passOrdinal}, strategy ${context.strategy}</data>`;
    const block: Block = Object.freeze({
      id: BLOCK_ID,
      bytes: Buffer.byteLength(text, "utf8"),
      hash: hashOf(text),
      writer: "sample-prompt-block",
      protected: false,
      stability: "stable",
      text,
    });
    return Object.freeze([cutToDeclaredSize(block, DECLARED_SIZE).block]);
  },
});

export const implementation: Implementation = Object.freeze({
  ep: "EP-15",
  pointId: "specstride.prompt-block/1",
  id: "sample-prompt-block",
  implementationClass: "first-party",
  majors: [1],
  provenance: "default",
  operations,
});

/* ------------------------------------------------------------------ *
 * T068 of feature 103 — the two SAMPLE BLOCK PROVIDERS of §D.5's
 * "Proving test": one that adds a VOLATILE, UNPROTECTED block, and a VARIANT
 * THAT FAILS (with its protected form, the third case of CT-103-130).
 *
 * They live beside this file, outside `@specstride/core`, and are re-exported
 * here so that the conformance suite of EP-15 has one module to import. The
 * `implementation` object above, which the frame of the test kit registers, is
 * exactly what T134 of feature 100 made it and is not touched.
 * ------------------------------------------------------------------ */
export {
  FAILING_BLOCK_ID,
  FAILURE_MESSAGE,
  SAMPLE_WRITER,
  VOLATILE_BLOCK_ID,
  VOLATILE_BLOCK_IS_PROTECTED,
  VOLATILE_BLOCK_STABILITY,
  VOLATILE_DECLARED_SIZE,
  failingBlockProvider,
  failingProtectedBlockProvider,
  sampleHash,
  volatileBlockProvider,
  volatileBlockText,
} from "./volatile-block.ts";
