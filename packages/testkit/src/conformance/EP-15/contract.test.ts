/**
 * T133 — the conformance suite at contract level for EP-15, the prompt block
 * provider (annex D, §D.5): CT-100-231, CT-100-232.
 *
 * Before the named cases the suite checks the five things every suite at
 * contract level checks (annex A, §A.4). The behaviour of EP-15 belongs to
 * feature 103, with 117 for the critic's own assembler; its behaviour cases
 * go in this folder beside this file.
 */
import assert from "node:assert/strict";
import {
  A_PROPOSER_BLOCK_REACHES_THE_CRITIC,
  A_PROTECTED_BLOCK_IS_DROPPED,
  BLOCK_IDS_ARE_AN_OPEN_SET,
  CARRY_OVER_DEFAULT_ON,
  CARRY_OVER_SWITCHES,
  CORE_GUARANTEES,
  EVENT_OF_THE_ASSEMBLY,
  OPERATIONS,
  POINT_ID,
  STABILITIES,
  THE_HANDOFF_IS_READ_BACK,
  cutToDeclaredSize,
  readProtected,
  readStability,
} from "@specstride/contracts/ep/prompt-block";
import { BLOCK_ID, DECLARED_SIZE, implementation } from "../../samples/EP-15/index.ts";
import { standardCases, operationOf } from "../common.ts";
import { casesAsTests, type ConformanceCase } from "../run.ts";

const EP = "EP-15" as const;

const context = Object.freeze({
  phase: 1,
  attempt: 1,
  passOrdinal: 1,
  strategy: "classic",
  changedSinceThePassBefore: Object.freeze([]),
});

const named: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-100-231",
    title:
      "a provider offers the one operation `blocks`, one assembler budgets the whole prompt, and a protected block is never dropped (F100-FR-131)",
    level: "contract",
    proves: ["F100-FR-131"],
    run(impl) {
      assert.deepEqual([...OPERATIONS], ["blocks"]);
      const blocks = (operationOf(impl, "blocks") as (c: unknown) => readonly unknown[])(context);
      assert.equal(blocks.length, 1);
      const block = blocks[0] as {
        id: string;
        bytes: number;
        hash: string;
        writer: string;
        protected: boolean;
        stability: "stable" | "volatile";
        text: string;
      };
      assert.equal(block.id, BLOCK_ID);
      assert.equal(typeof block.hash, "string");
      assert.equal(typeof block.writer, "string");
      assert.equal(typeof block.protected, "boolean");
      assert.ok(STABILITIES.includes(block.stability as never));
      assert.ok(block.bytes <= DECLARED_SIZE, "a block over its declared size is cut");
      // The provider is a pure function of the context of the pass.
      assert.deepEqual(
        (operationOf(impl, "blocks") as (c: unknown) => readonly unknown[])(context),
        blocks,
      );
      assert.equal(EVENT_OF_THE_ASSEMBLY, "prompt.built");
      assert.equal(A_PROTECTED_BLOCK_IS_DROPPED, false);
      assert.equal(A_PROPOSER_BLOCK_REACHES_THE_CRITIC, false);
      assert.ok(CORE_GUARANTEES[0]?.includes("one assembler budgets the whole prompt"));
      // A block over the size its provider declared is cut and recorded.
      const long = { ...block, bytes: DECLARED_SIZE + 10, text: "x".repeat(DECLARED_SIZE + 10) };
      const cut = cutToDeclaredSize(long, DECLARED_SIZE);
      assert.equal(cut.cut, true);
      assert.equal(cut.block.bytes, DECLARED_SIZE);
    },
  },
  {
    id: "CT-100-232",
    title:
      "carry-over is the ledger, a handoff the runtime never reads back, and the obligations index, each with its own switch, on by default (F100-FR-132)",
    level: "contract",
    proves: ["F100-FR-132"],
    run() {
      assert.deepEqual([...CARRY_OVER_SWITCHES], ["carry.ledger_handoff", "carry.index"]);
      assert.equal(CARRY_OVER_DEFAULT_ON, true);
      assert.equal(THE_HANDOFF_IS_READ_BACK, false);
    },
  },
]);

export const cases: readonly ConformanceCase[] = Object.freeze([
  ...standardCases(
    EP,
    [
      "EP-15/operations-exist",
      "EP-15/closed-result-sets",
      "EP-15/degradation",
      "EP-15/unknown-value-rule",
      "EP-15/behaviour-cases",
    ],
    {
      resultSets: [
        {
          operation: "blocks",
          members: [
            (v: unknown) =>
              Array.isArray(v) &&
              v.every((b) => STABILITIES.includes((b as { stability: string }).stability as never)),
          ],
          calls: [[context], [{ ...context, passOrdinal: 2 }]],
        },
      ],
      throwingOperation: "blocks",
    },
  ),
  ...named,
  {
    id: "EP-15/unknown-values-of-protected-and-stable",
    title:
      "an unknown block id is accepted, and an unknown value of `protected` or of `stable` is read as not protected and volatile (the unknown-value rule of §D.5)",
    level: "contract",
    proves: ["F100-FR-021"],
    run() {
      assert.equal(BLOCK_IDS_ARE_AN_OPEN_SET, true);
      assert.equal(readProtected("maybe"), false);
      assert.equal(readProtected(true), true);
      assert.equal(readStability("whatever"), "volatile");
      assert.equal(readStability("stable"), "stable");
    },
  },
]);

export { implementation };
await casesAsTests(POINT_ID, implementation, cases);
