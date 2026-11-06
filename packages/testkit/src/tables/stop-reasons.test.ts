/**
 * T274 — table-level tests generated from `data/stop-reasons.json`: one test
 * per stop reason (15), asserting the literal, the engine exit, `transient`
 * and `retryable` against T080, and the as-is literal against T270
 * (research.md D-9; F100-FR-148; F100-SC-009).
 *
 * A slice of T094. The count of members is read from the data file and every
 * member is turned into a test, so a member the file gains without an export
 * to assert it against fails here.
 */
import test from "node:test";
import assert from "node:assert/strict";
import stopReasonsData from "@specstride/contracts/data/stop-reasons.json" with { type: "json" };
import {
  STOP_REASONS,
  STOP_REASON_COUNT,
  engineExitOf,
  isStopReason,
  isTransient,
  retryableFor,
  stopReasonOfNumber,
  stopReasonRow,
  stopReasonRows,
  stopReasonSet,
} from "@specstride/contracts/codes/stop-reasons";
import {
  MEMBERS_WITH_AN_AS_IS_LITERAL,
  MEMBERS_WITH_TWO_LINES,
  asIsLiteralOf,
  asIsStopLines,
  asIsStopReasons,
} from "@specstride/contracts/codes/stop-reason-literals";
import { engineExitRow } from "@specstride/contracts/codes/engine";

type Raw = {
  number: number;
  literal: string;
  writtenBy: string;
  engineExit: number;
  transient: boolean;
  transientNote: string;
  retryable: string;
  matchedByStringAtBaseline: string;
};

const RAW = (stopReasonsData as { stopReasons: Raw[] }).stopReasons;

let asserted = 0;

for (const raw of RAW) {
  test(`stop-reasons row ${raw.number} \`${raw.literal}\`: T080 and T270 carry the row`, () => {
    asserted += 1;

    // T080 — the literal is a member, and its row is the row of the file.
    assert.ok(isStopReason(raw.literal), `\`${raw.literal}\` is a member`);
    assert.ok(stopReasonSet.has(raw.literal), `\`${raw.literal}\` is in the closed set`);
    const row = stopReasonRow(raw.literal);
    assert.notEqual(row, undefined, raw.literal);
    assert.equal(row?.number, raw.number);
    assert.equal(stopReasonOfNumber(raw.number)?.literal, raw.literal);
    assert.equal(row?.writtenBy, raw.writtenBy);

    // The engine exit.
    assert.equal(row?.engineExit, raw.engineExit);
    assert.equal(engineExitOf(raw.literal), raw.engineExit);
    // And the engine table names the member under that code.
    assert.ok(
      (engineExitRow(raw.engineExit)?.stopReasons as readonly string[] | undefined)?.includes(
        raw.literal,
      ),
      `the engine code ${raw.engineExit} carries \`${raw.literal}\``,
    );

    // `transient`.
    assert.equal(row?.transient, raw.transient);
    assert.equal(isTransient(raw.literal), raw.transient);
    assert.equal(row?.transientNote, raw.transientNote);

    // `retryable`: the cell of the annex, and the value the rule gives.
    assert.equal(row?.retryableRule, raw.retryable);
    if (!raw.transient) {
      assert.equal(
        retryableFor(raw.literal),
        false,
        `\`${raw.literal}\` is not transient, so it is never retryable`,
      );
      assert.match(raw.retryable, /^false/, "the cell of the annex says false");
    } else {
      assert.match(raw.retryable, /^true/, "the cell of the annex says true");
      // A stop blocked on a human is never retryable, whatever the member.
      assert.equal(retryableFor(raw.literal, { blockedReason: "budget-cap" }), false);
    }

    // T270 — the as-is literal for the compatibility projection.
    const asIs = asIsStopReasons.find((r) => r.literal === raw.literal);
    assert.notEqual(asIs, undefined, raw.literal);
    assert.equal(asIs?.matchedByStringAtBaseline, raw.matchedByStringAtBaseline);
    if (raw.number <= 14) {
      assert.equal(asIsLiteralOf(raw.literal), raw.literal, "1 to 14 keep their as-is literal");
      assert.ok(MEMBERS_WITH_AN_AS_IS_LITERAL.includes(raw.literal as never));
      assert.ok(asIsStopLines(raw.literal).length >= 1, "the projection writes a line");
    } else {
      assert.equal(asIsLiteralOf(raw.literal), null, "member 15 is new");
      assert.equal(asIsStopLines(raw.literal).length, 0);
    }
    // The rule of two lines, where the engine and the pass loop both write.
    const bothWrite = row?.writtenByTheEngine === true && row?.writtenByThePassLoop === true;
    assert.equal(asIs?.twoLines, bothWrite);
    assert.equal(MEMBERS_WITH_TWO_LINES.includes(raw.literal as never), bothWrite);
    if (bothWrite) assert.equal(asIsStopLines(raw.literal).length, 2);
  });
}

test("F100-SC-009: every one of the 15 stop reasons has a test of its own", () => {
  assert.equal(RAW.length, 15);
  assert.equal(STOP_REASON_COUNT, RAW.length);
  assert.equal(STOP_REASONS.length, RAW.length);
  assert.equal(stopReasonRows.length, RAW.length);
  assert.equal(asIsStopReasons.length, RAW.length);
  assert.equal(asserted, RAW.length, `${RAW.length} rows, ${RAW.length} tests`);
});
