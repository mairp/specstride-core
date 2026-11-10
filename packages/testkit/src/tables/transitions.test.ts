/**
 * T275 — table-level tests generated from `data/run-state-machine.json`: one
 * test per transition (18), asserting from, to, trigger, owner and the
 * written record against T078 and `mayWrite`, and one per blocked reason
 * against T268 (research.md D-9; F100-FR-142, F100-FR-144; F100-SC-009).
 *
 * A slice of T094. The counts are read from the data file and every row is
 * turned into a test, so a row the file gains without an export to assert it
 * against fails here.
 */
import test from "node:test";
import assert from "node:assert/strict";
import machine from "@specstride/contracts/data/run-state-machine.json" with { type: "json" };
import {
  DERIVED_RUN_CONDITIONS,
  LIVE_STATES,
  RUN_STATES,
  TRANSITIONS,
  TRANSITIONS_OF_THE_CLI,
  isDerivedRunCondition,
  isRunState,
  mayWrite,
  runStateRows,
  transitionOf,
  whyNotWritable,
  type WritingProcess,
} from "@specstride/contracts/state/run-state";
import {
  BLOCKED_REASONS,
  blockedEvent,
  blockedReasonRow,
  blockedReasonRows,
  blockedReasonSet,
  engineExitOf,
  mayRelaunch,
  stopReasonOf,
} from "@specstride/contracts/state/blocked-reasons";
import { isStopReason } from "@specstride/contracts/codes/stop-reasons";
import { isEngineExitCode } from "@specstride/contracts/codes/engine";

type RawTransition = {
  "#": string;
  From: string;
  To: string;
  Trigger: string;
  Owner: string;
  Written: string;
};

type RawBlocked = {
  "Blocked reason": string;
  When: string;
  "Stop reason": string;
  "Engine exit": string;
  "`retryable`": string;
};

const DATA = machine as {
  states: Record<string, string>[];
  transitions: RawTransition[];
  blockedReasons: RawBlocked[];
};

const bare = (cell: string): string =>
  cell
    .replace(/\(derived\)/gi, "")
    .replace(/`/g, "")
    .trim();

const PROCESSES: readonly WritingProcess[] = ["cli", "root", "engine", "host", "nobody"];

let transitionsAsserted = 0;
let blockedAsserted = 0;

/* ---------------------------------------------------------------- *
 * One test per transition (T078 and `mayWrite`).
 * ---------------------------------------------------------------- */

for (const raw of DATA.transitions) {
  const id = raw["#"];
  test(`run-state-machine transition ${id}: T078 and \`mayWrite\` carry the row`, () => {
    transitionsAsserted += 1;
    const row = transitionOf(id);
    assert.notEqual(row, undefined, `${id} has a row in T078`);
    if (row === undefined) return;

    // From.
    assert.equal(row.fromCell, raw.From);
    const namedFrom = [...raw.From.matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? "");
    if (namedFrom.length > 0) {
      assert.deepEqual([...row.from], namedFrom, `${id}: the states its cell names`);
    } else if (/any live state/i.test(raw.From)) {
      assert.deepEqual([...row.from], [...LIVE_STATES], `${id}: any live state`);
    } else {
      assert.deepEqual([...row.from], [], `${id}: the cell is "—"`);
    }
    for (const state of row.from) {
      assert.ok(isRunState(state) || isDerivedRunCondition(state), `${id}: ${state}`);
    }

    // To.
    assert.equal(row.to, bare(raw.To));
    assert.ok(
      isRunState(row.to) || isDerivedRunCondition(row.to),
      `${id} enters ${row.to}, a state or a derived condition`,
    );

    // Trigger, owner and the written record.
    assert.equal(row.trigger, raw.Trigger);
    assert.notEqual(row.trigger.trim(), "", `${id} has a trigger`);
    assert.equal(row.owner, raw.Owner);
    assert.notEqual(row.owner.trim(), "", `${id} names its owner`);
    assert.equal(row.written, raw.Written);
    assert.notEqual(row.written.trim(), "", `${id} says what it writes`);
    assert.equal(row.derived, /^derived$/i.test(raw.Written.trim()));

    // `mayWrite` follows the cell "Owner", with the two rules of
    // F100-FR-142 on top: a host never, the CLI only T1, T2, T3, T17.
    const owner = raw.Owner.toLowerCase();
    assert.equal(mayWrite(id, "host"), false, `a host may not write ${id}`);
    assert.equal(
      mayWrite(id, "cli"),
      (TRANSITIONS_OF_THE_CLI as readonly string[]).includes(id),
      `the CLI and ${id}`,
    );
    assert.equal(mayWrite(id, "cli"), /\bcli\b/.test(owner), `the cell Owner and the CLI, ${id}`);
    if (row.derived) {
      for (const process of PROCESSES) {
        assert.equal(mayWrite(id, process), false, `${id} is derived: ${process} may not write it`);
      }
    } else {
      assert.equal(mayWrite(id, "root"), /\broot\b/.test(owner), `the root and ${id}`);
      assert.equal(mayWrite(id, "engine"), /\bengine\b/.test(owner), `the engine and ${id}`);
      // In `standalone` the engine owns the transitions of the root too.
      assert.equal(
        mayWrite(id, "engine", "standalone"),
        /\broot\b/.test(owner) || /\bengine\b/.test(owner),
        `the engine in \`standalone\` and ${id}`,
      );
    }
    // A refusal always says why.
    for (const process of PROCESSES) {
      if (mayWrite(id, process)) {
        assert.equal(whyNotWritable(id, process), undefined, `${id}/${process}`);
      } else {
        assert.notEqual(whyNotWritable(id, process), undefined, `${id}/${process} says why`);
      }
    }
  });
}

/* ---------------------------------------------------------------- *
 * One test per blocked reason (T268).
 * ---------------------------------------------------------------- */

for (const raw of DATA.blockedReasons) {
  const reason = bare(raw["Blocked reason"]);
  test(`run-state-machine blocked reason \`${reason}\`: T268 carries the row`, () => {
    blockedAsserted += 1;
    const row = blockedReasonRow(reason);
    assert.notEqual(row, undefined, `${reason} has a row in T268`);
    if (row === undefined) return;
    assert.ok(blockedReasonSet.has(reason), `${reason} is in the closed set of row 4`);
    assert.equal(row.when, raw.When);
    assert.notEqual(row.when.trim(), "", `${reason} says when it happens`);

    // The stop reason and the engine exit of the row.
    assert.equal(row.stopReason, bare(raw["Stop reason"]));
    assert.equal(stopReasonOf(reason), row.stopReason);
    assert.ok(isStopReason(row.stopReason), `${reason}: \`${row.stopReason}\``);
    assert.equal(row.engineExit, Number(bare(raw["Engine exit"])));
    assert.equal(engineExitOf(reason), row.engineExit);
    assert.ok(isEngineExitCode(row.engineExit), `${reason}: ${row.engineExit}`);

    // `retryable` is No for every row of the table (F100-FR-144).
    assert.equal(row.retryableCell, raw["`retryable`"]);
    assert.equal(row.retryable, /^yes$/i.test(bare(raw["`retryable`"])));
    assert.equal(row.retryable, false, `${reason} is not retryable`);

    // The event `blocked` carries the reason, the stop reason and the code,
    // and neither classifier table relaunches the run.
    const event = blockedEvent(reason as never, "what the run needs");
    assert.equal(event.reason, reason);
    assert.equal(event.stopReason, row.stopReason);
    assert.equal(event.engineExit, row.engineExit);
    for (const table of ["relaunch-observe", "relaunch-root"]) {
      assert.equal(mayRelaunch(reason as never, table), false, `${reason}/${table}`);
    }
    // Every blocked reason leads to `blocked-on-human`, which T9 and T8 enter.
    assert.ok(
      [transitionOf("T8")?.to, transitionOf("T9")?.to].includes("blocked-on-human"),
      "T8 and T9 enter `blocked-on-human`",
    );
  });
}

/* ---------------------------------------------------------------- *
 * F100-SC-009 — 100 per cent of the rows are covered.
 * ---------------------------------------------------------------- */

test("F100-SC-009: every transition and every blocked reason has a test of its own", () => {
  assert.equal(DATA.transitions.length, 18);
  assert.equal(TRANSITIONS.length, DATA.transitions.length);
  assert.equal(transitionsAsserted, DATA.transitions.length, "18 transitions, 18 tests");

  assert.equal(DATA.blockedReasons.length, 7);
  assert.equal(BLOCKED_REASONS.length, DATA.blockedReasons.length);
  assert.equal(blockedReasonRows.length, DATA.blockedReasons.length);
  assert.equal(blockedAsserted, DATA.blockedReasons.length, "7 blocked reasons, 7 tests");

  // The states table is covered too: ten written states and `dead`.
  assert.equal(DATA.states.length, 11);
  assert.equal(runStateRows.length, DATA.states.length);
  assert.equal(RUN_STATES.length, 10);
  assert.equal(DERIVED_RUN_CONDITIONS.length, 3);
});
