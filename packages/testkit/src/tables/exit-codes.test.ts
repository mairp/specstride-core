/**
 * T094 — table-level tests generated from `data/exit-codes.json`: one test
 * per row of every exit-code table (`engine` with its five sub-tables,
 * `runtimeRootAndPipelineEntry`, `perCommand`, `handshake`, `collisions`),
 * each asserting the row against the exports of T085, T271, T090, T087,
 * T093, T272 and T273 (research.md D-9; quickstart.md scenario 4).
 *
 * The suite checks F100-SC-009: 100 per cent of the rows are covered. The
 * count of rows is read from the data file and every row is turned into a
 * test, so a row the data file gains without an export to assert it against
 * fails here.
 */
import test from "node:test";
import assert from "node:assert/strict";
import exitCodes from "@specstride/contracts/data/exit-codes.json" with { type: "json" };
import {
  ENGINE_EXIT_CODES,
  engineExitRow,
  engineExitRows,
  isEngineExitCode,
  stopReasonsOf,
} from "@specstride/contracts/codes/engine";
import {
  ENGINE_TABLE_NAMES,
  RESULT_RECORD_TABLES,
  criticCallRows,
  criticResultOf,
  internalHelperCodes,
  internalHelperRows,
  passLoopRows,
  verificationGateRows,
} from "@specstride/contracts/codes/result-records";
import {
  SIGNAL_CODE_CELL,
  isPipelineExitCode,
  pipelineExitRow,
  pipelineExitRows,
} from "@specstride/contracts/codes/pipeline";
import { exitOfLaunch, handshakeRow, handshakeRows } from "@specstride/contracts/state/handshake";
import {
  codesOf,
  commandCodeRow,
  commandCodeRows,
  exitCodePerCommandSet,
} from "@specstride/contracts/codes/commands";
import {
  SUPERVISION_OUTCOME_ROWS,
  resumeRow,
  superviseRow,
  supervisionExitCode,
} from "@specstride/contracts/codes/resume-and-supervision";
import {
  DOCTOR_CODE_NUMBERS,
  ROWS_WITHOUT_AN_AS_IS_EQUIVALENT,
  collisionRows,
  collisionsOf,
  doctorRow,
  meaningsOf,
} from "@specstride/contracts/codes/doctor-and-collisions";
import { isStopReason } from "@specstride/contracts/codes/stop-reasons";

type EngineTable = { process: string; rows: Record<string, string>[] };

const DATA = exitCodes as {
  engine: EngineTable[];
  runtimeRootAndPipelineEntry: Record<string, string>[];
  perCommand: Record<string, string>[];
  collisions: Record<string, string>[];
  handshake: Record<string, string>[];
};

const bare = (cell: string): string => cell.replace(/`/g, "").trim();

/** Every row of every table of the file, counted for F100-SC-009. */
const ROWS_OF_THE_FILE =
  DATA.engine.reduce((sum, table) => sum + table.rows.length, 0) +
  DATA.runtimeRootAndPipelineEntry.length +
  DATA.perCommand.length +
  DATA.collisions.length +
  DATA.handshake.length;

let asserted = 0;
const count = (): void => {
  asserted += 1;
};

/* ---------------------------------------------------------------- *
 * The key `engine`, sub-table "Engine" (T085).
 * ---------------------------------------------------------------- */

for (const raw of DATA.engine[0]?.rows ?? []) {
  const code = Number(raw.Code);
  test(`exit-codes.engine[Engine] row ${raw.Code}: T085 carries the row`, () => {
    count();
    const row = engineExitRow(code);
    assert.notEqual(row, undefined, `the code ${raw.Code} has a row in T085`);
    assert.equal(row?.code, code);
    assert.equal(row?.meaning, raw.Meaning);
    assert.equal(row?.stopReasonsCell, raw["Stop reasons"]);
    assert.ok(isEngineExitCode(code));
    assert.ok((ENGINE_EXIT_CODES as readonly number[]).includes(code));
    // The members the cell names are members of §E.3 and are what T085 gives.
    const named = [...(raw["Stop reasons"] ?? "").matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? "");
    assert.deepEqual([...stopReasonsOf(code)], named);
    for (const literal of named) assert.ok(isStopReason(literal), literal);
    assert.equal(row?.noMember, (raw["Stop reasons"] ?? "").trim() === "—");
  });
}

/* ---------------------------------------------------------------- *
 * The four other sub-tables of the key `engine` (T271).
 * ---------------------------------------------------------------- */

for (const raw of DATA.engine[1]?.rows ?? []) {
  const cell = raw["`exit_code`"] ?? "";
  test(`exit-codes.engine[Pass loop] row ${cell}: T271 carries the row`, () => {
    count();
    const row = passLoopRows.find((r) => r.cell === cell);
    assert.notEqual(row, undefined, `the cell ${cell} has a row in T271`);
    assert.equal(row?.meaning, raw.Meaning);
    assert.ok((row?.codes.length ?? 0) > 0, `${cell} names a number`);
    assert.equal(row?.statusOfAPass, /status of a pass/i.test(cell));
  });
}

for (const raw of DATA.engine[2]?.rows ?? []) {
  const cell = raw["`exit_code`"] ?? "";
  test(`exit-codes.engine[Critic call] row ${cell}: T271 carries the row`, () => {
    count();
    const code = Number(bare(cell));
    const row = criticCallRows.find((r) => r.exitCode === code);
    assert.notEqual(row, undefined, `the code ${cell} has a row in T271`);
    assert.equal(row?.meaning, raw.Meaning);
    assert.equal(row?.result, bare(raw["`result`"] ?? ""));
    const named = [...(raw["`result`"] ?? "").matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? "");
    assert.deepEqual([...(criticResultOf(code) ?? [])], named);
  });
}

for (const raw of DATA.engine[3]?.rows ?? []) {
  const cell = raw["`exit_code`"] ?? "";
  test(`exit-codes.engine[Verification gate] row ${cell}: T271 carries the row`, () => {
    count();
    const row = verificationGateRows.find((r) => r.exitCode === Number(bare(cell)));
    assert.notEqual(row, undefined, `the code ${cell} has a row in T271`);
    assert.equal(row?.meaning, raw.Meaning);
  });
}

for (const raw of DATA.engine[4]?.rows ?? []) {
  const component = raw.Component ?? "";
  test(`exit-codes.engine[Internal helpers] row ${component}: T271 carries the row`, () => {
    count();
    const row = internalHelperRows.find((r) => r.component === component);
    assert.notEqual(row, undefined, `${component} has a row in T271`);
    assert.equal(row?.cell, raw["Values kept in its result record"]);
    const named = [...(raw["Values kept in its result record"] ?? "").matchAll(/\d+/g)].map((m) =>
      Number(m[0]),
    );
    assert.deepEqual([...(internalHelperCodes(component) ?? [])], named);
  });
}

test("exit-codes.engine: the five sub-tables of §E.4 are all covered", () => {
  count();
  assert.equal(DATA.engine.length, 5);
  assert.deepEqual(
    [...ENGINE_TABLE_NAMES],
    DATA.engine.map((t) => t.process),
  );
  assert.deepEqual([...ENGINE_TABLE_NAMES].slice(1), [...RESULT_RECORD_TABLES]);
  assert.equal(engineExitRows.length, DATA.engine[0]?.rows.length);
  assert.equal(passLoopRows.length, DATA.engine[1]?.rows.length);
  assert.equal(criticCallRows.length, DATA.engine[2]?.rows.length);
  assert.equal(verificationGateRows.length, DATA.engine[3]?.rows.length);
  assert.equal(internalHelperRows.length, DATA.engine[4]?.rows.length);
});

/* ---------------------------------------------------------------- *
 * The key `runtimeRootAndPipelineEntry` (T090).
 * ---------------------------------------------------------------- */

for (const raw of DATA.runtimeRootAndPipelineEntry) {
  test(`exit-codes.runtimeRootAndPipelineEntry row ${raw.Code}: T090 carries the row`, () => {
    count();
    const cell = raw.Code ?? "";
    const row = pipelineExitRows.find((r) => r.cell === cell);
    assert.notEqual(row, undefined, `the code ${cell} has a row in T090`);
    assert.equal(row?.meaning, raw.Meaning);
    if (cell === SIGNAL_CODE_CELL) {
      assert.equal(row?.signalFamily, true);
      assert.equal(row?.code, undefined);
    } else {
      assert.equal(row?.code, Number(cell));
      assert.ok(isPipelineExitCode(Number(cell)));
      assert.equal(pipelineExitRow(Number(cell))?.meaning, raw.Meaning);
    }
  });
}

/* ---------------------------------------------------------------- *
 * The key `perCommand` (T093, with T272 and T273 for their rows).
 * ---------------------------------------------------------------- */

for (const raw of DATA.perCommand) {
  const command = raw.Command ?? "";
  test(`exit-codes.perCommand row ${command}: T093 carries the row`, () => {
    count();
    const row = commandCodeRows.find((r) => r.command === command);
    assert.notEqual(row, undefined, `${command} has a row in T093`);
    assert.equal(row?.codes, raw.Codes);
    assert.ok((row?.numbers.length ?? 0) > 0, `${command} names a code`);
    // Every number of the row is a member of row 7 of §X.6.
    for (const number of row?.numbers ?? []) {
      assert.ok(exitCodePerCommandSet.has(String(number)), `${command}: ${number}`);
    }
    // A row that names its commands in back-ticks resolves by each of them.
    for (const name of row?.commands ?? []) {
      assert.equal(commandCodeRow(name)?.command, command, name);
      assert.deepEqual([...codesOf(name)], [...(row?.numbers ?? [])]);
    }

    // The rows T272 and T273 slice out are asserted against their exports.
    if (row?.commands.includes("resume") === true) {
      assert.equal(resumeRow?.command, command);
      assert.deepEqual([...(resumeRow?.numbers ?? [])], [...row.numbers]);
    }
    if (command === "`supervise`") {
      assert.equal(superviseRow?.command, command);
      for (const outcome of SUPERVISION_OUTCOME_ROWS) {
        assert.ok(
          row?.numbers.includes(outcome.code),
          `the row of \`supervise\` names ${outcome.code} for \`${outcome.outcome}\``,
        );
        assert.equal(supervisionExitCode(outcome.outcome), outcome.code);
      }
    }
    if (command === "`doctor`") {
      assert.equal(doctorRow?.command, command);
      assert.deepEqual([...DOCTOR_CODE_NUMBERS], [...(row?.numbers ?? [])]);
    }
    const without = ROWS_WITHOUT_AN_AS_IS_EQUIVALENT.filter((r) => r.row.command === command);
    for (const entry of without) {
      assert.deepEqual([...entry.row.numbers], [...(row?.numbers ?? [])], entry.command);
    }
    // The row of `launch` names the codes of the handshake (T087).
    if (command === "`launch`") {
      assert.ok(row?.numbers.includes(exitOfLaunch("started")));
      assert.ok(row?.numbers.includes(exitOfLaunch("attached")));
      assert.ok(row?.numbers.includes(exitOfLaunch("refused")));
      assert.ok(row?.numbers.includes(exitOfLaunch("refused", { refusal: "lock-conflict" })));
    }
  });
}

/* ---------------------------------------------------------------- *
 * The key `handshake` (T087).
 * ---------------------------------------------------------------- */

for (const raw of DATA.handshake) {
  const outcome = bare(raw.Outcome ?? "");
  test(`exit-codes.handshake row ${outcome}: T087 carries the row`, () => {
    count();
    const row = handshakeRow(outcome);
    assert.notEqual(row, undefined, `${outcome} has a row in T087`);
    assert.equal(row?.meaning, raw.Meaning);
    assert.equal(row?.cliPrints, raw["The CLI prints"]);
    assert.equal(row?.exitCell, raw["Exit of `launch`"]);
    // The first number of the cell is the code T087 gives for the outcome.
    assert.equal(exitOfLaunch(outcome as "started" | "attached" | "refused"), row?.exitCode);
  });
}

/* ---------------------------------------------------------------- *
 * The key `collisions` (T273).
 * ---------------------------------------------------------------- */

for (const raw of DATA.collisions) {
  const value = raw.Value ?? "";
  test(`exit-codes.collisions row ${value}: T273 carries the row`, () => {
    count();
    const row = collisionRows.find((r) => r.cell === value);
    assert.notEqual(row, undefined, `the value ${value} has a row in T273`);
    assert.equal(row?.meaningsCell, raw.Meanings);
    const numbers = [...value.matchAll(/\d+/g)].map((m) => Number(m[0]));
    assert.deepEqual([...(row?.values ?? [])], numbers);
    for (const number of numbers) {
      assert.ok(
        collisionsOf(number).some((r) => r.cell === value),
        `${number} finds its row`,
      );
      assert.ok(meaningsOf(number).length > 0, `${number} carries its meanings`);
    }
  });
}

/* ---------------------------------------------------------------- *
 * F100-SC-009 — 100 per cent of the rows are covered.
 * ---------------------------------------------------------------- */

test("F100-SC-009: every row of every exit-code table has a test of its own", () => {
  // One test per row, plus the one that checks the five sub-tables, plus
  // this one.
  assert.equal(
    asserted,
    ROWS_OF_THE_FILE + 1,
    `the file holds ${ROWS_OF_THE_FILE} rows and each one has a test`,
  );
  // The count is read from the file, and the file's shape is pinned as
  // literals, so that a row the file LOSES fails here too and not only in
  // the contract tests: a self-referential count would not catch that.
  const PINNED: readonly [string, number][] = [
    ["engine[Engine]", 8],
    ["engine[Pass loop]", 12],
    ["engine[Critic call]", 5],
    ["engine[Verification gate]", 4],
    ["engine[Internal helpers]", 3],
    ["runtimeRootAndPipelineEntry", 8],
    ["perCommand", 28],
    ["collisions", 8],
    ["handshake", 3],
  ];
  const actual: readonly number[] = [
    ...DATA.engine.map((table) => table.rows.length),
    DATA.runtimeRootAndPipelineEntry.length,
    DATA.perCommand.length,
    DATA.collisions.length,
    DATA.handshake.length,
  ];
  assert.deepEqual(
    actual,
    PINNED.map(([, count_]) => count_),
    `the tables of §E.4, §F.8 and §G.4 hold ${PINNED.map(([name, c]) => `${name} ${c}`).join(", ")}`,
  );
  assert.equal(
    ROWS_OF_THE_FILE,
    PINNED.reduce((sum, [, count_]) => sum + count_, 0),
  );
  assert.equal(ROWS_OF_THE_FILE, 79);

  // Each exported table holds exactly the rows of its key of the file.
  assert.equal(engineExitRows.length, DATA.engine[0]?.rows.length);
  assert.equal(pipelineExitRows.length, DATA.runtimeRootAndPipelineEntry.length);
  assert.equal(commandCodeRows.length, DATA.perCommand.length);
  assert.equal(handshakeRows.length, DATA.handshake.length);
  assert.equal(collisionRows.length, DATA.collisions.length);
  assert.deepEqual(
    handshakeRows.map((row) => row.outcome),
    DATA.handshake.map((raw) => bare(raw.Outcome ?? "")),
  );
});
