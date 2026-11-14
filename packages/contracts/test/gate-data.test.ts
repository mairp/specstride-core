/**
 * T004 of feature 101 — the table "Halts of the phase gate" as data in the
 * package, and the validation AT LOAD that every stop reason and every exit
 * code in it is a member of a closed set of feature 100
 * (`packages/contracts/data/gate-halts-101.json`,
 * `packages/contracts/src/engine/gate-halts.ts`; F101-FR-010, F101-FR-037).
 *
 * The closed sets of feature 100 the table is read against:
 *
 * | Row of annex X §X.6 | Set | What is read against it |
 * |---|---|---|
 * | 3 | Stop reasons (the 16 literals of annex E §E.3) | `stopReason` of every row |
 * | 6 | Engine exit codes (annex E §E.4) | `exitCode` of every row |
 *
 * The copy in the package is asserted byte for byte against the contract file
 * of the feature, by content hash, through a second read path (the file system)
 * from the one the module uses (the JSON import of the package).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import gateHaltsData from "../data/gate-halts-101.json" with { type: "json" };
import { closedSets } from "../src/enums/all-sets.ts";
import { ENGINE_EXIT_CODES, isEngineExitCode, stopReasonsOf } from "../src/codes/engine.ts";
import { STOP_REASONS, engineExitOf, isStopReason } from "../src/codes/stop-reasons.ts";
import {
  CONTRACT_FILE,
  DATA_FILE,
  EXIT_CODE_SET_ROW,
  GATE_HALTS,
  GateHaltsError,
  SCHEMA_ID,
  STOP_REASON_SET_ROW,
  exitCodesOfTheTable,
  gateHalt,
  haltsOfFixture,
  loadGateHalts,
  stopReasonsOfTheTable,
} from "../src/engine/gate-halts.ts";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = resolve(PKG, "../..");

const sha256 = (path: string): string =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

test("T004: data/gate-halts.json is a byte-for-byte copy of the contract file of feature 101", () => {
  const source = join(ROOT, CONTRACT_FILE);
  const copy = join(ROOT, DATA_FILE);
  assert.equal(CONTRACT_FILE, "specs/101-gate-and-verdict/contracts/gate-halts.json");
  assert.equal(DATA_FILE, "packages/contracts/data/gate-halts-101.json");
  assert.equal(existsSync(source), true, `${CONTRACT_FILE} exists`);
  assert.equal(existsSync(copy), true, `${DATA_FILE} exists`);
  const hash = sha256(copy);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.equal(hash, sha256(source), `${DATA_FILE} is byte-identical to ${CONTRACT_FILE}`);
  // And the bytes on disk are the bytes the module reads through its JSON import.
  assert.deepEqual(JSON.parse(readFileSync(copy, "utf8")), gateHaltsData);
  assert.equal((gateHaltsData as { schema: string }).schema, SCHEMA_ID);
});

test("T004: every stop reason of the table is a member of row 3 of annex X §X.6", () => {
  const set = closedSets.get(STOP_REASON_SET_ROW);
  assert.ok(set !== undefined, "row 3 of §X.6 is a closed set of the package");
  assert.equal(set.name, "Stop reasons");
  assert.equal(STOP_REASON_SET_ROW, 3);

  const named = stopReasonsOfTheTable();
  assert.ok(named.length > 0, "the table names stop reasons");
  for (const literal of named) {
    assert.equal(isStopReason(literal), true, `\`${literal}\` is a member of the closed set`);
    assert.ok(
      (STOP_REASONS as readonly string[]).includes(literal),
      `\`${literal}\` is one of the 15 literals of annex E §E.3`,
    );
  }
  // The six the table of halts names.
  assert.deepEqual([...named].sort(), [
    "critic_config",
    "critic_unavailable",
    "gate_oscillation",
    "max_rejects",
    "release_verification",
    "stop_flag",
  ]);
});

test("T004: every exit code of the table is a member of row 6 of annex X §X.6", () => {
  const set = closedSets.get(EXIT_CODE_SET_ROW);
  assert.ok(set !== undefined, "row 6 of §X.6 is a closed set of the package");
  assert.equal(EXIT_CODE_SET_ROW, 6);

  const codes = exitCodesOfTheTable();
  assert.ok(codes.length > 0, "the table names exit codes");
  for (const code of codes) {
    assert.equal(isEngineExitCode(code), true, `${code} is a member of the closed set`);
    assert.equal(set.has(String(code)), true, `${code} is a member of row 6 by its literal`);
    assert.ok((ENGINE_EXIT_CODES as readonly number[]).includes(code));
  }
  assert.deepEqual([...codes], [0, 1, 2, 3, 6]);
});

test("T004: each row agrees with annex E on the exit code of its stop reason", () => {
  assert.equal(GATE_HALTS.length, 7, "the table holds seven rows");
  for (const halt of GATE_HALTS) {
    if (halt.stopReason === null) {
      // F100-FR-148 — an exit without a member of §E.3 is not retryable.
      assert.equal(halt.retryable, false, `the row "${halt.cause}" is not retryable`);
      continue;
    }
    assert.equal(
      engineExitOf(halt.stopReason),
      halt.exitCode,
      `the row "${halt.cause}" pairs \`${halt.stopReason}\` with ${halt.exitCode}`,
    );
    assert.ok(
      stopReasonsOf(halt.exitCode).includes(halt.stopReason),
      `annex E §E.4 gives the code ${halt.exitCode} the stop reason \`${halt.stopReason}\``,
    );
  }
  // The row the specification calls out: a missing credential of the critic is
  // in the row `malformed-limit` under the `parity` profile (F101-FR-010, CQ-187).
  const malformedLimit = gateHalt("malformed-limit");
  assert.ok(malformedLimit !== undefined);
  assert.equal(malformedLimit.stopReason, "critic_unavailable");
  assert.equal(malformedLimit.exitCode, 1);
  assert.ok(malformedLimit.fixtures.includes("FX-07/missing-key"));
  assert.deepEqual(
    haltsOfFixture("FX-07/missing-key").map((h) => h.cause),
    ["malformed-limit"],
  );
  // And the row where the scenarios of one family end differently.
  assert.deepEqual(
    haltsOfFixture("FX-07/phase-not-found").map((h) => h.cause),
    ["critic-config"],
  );
});

test("T004: the validation is AT LOAD — a non-member refuses the table, naming row and set", () => {
  const table = structuredClone(gateHaltsData) as {
    schema: string;
    halts: Record<string, unknown>[];
  };

  // A stop reason outside row 3 of §X.6.
  const badReason = structuredClone(table);
  badReason.halts[0] = { ...badReason.halts[0], stopReason: "gate_wobble", exitCode: 2 };
  assert.throws(
    () => loadGateHalts(badReason),
    (error: unknown) => {
      assert.ok(error instanceof GateHaltsError);
      assert.equal(error.value, "gate_wobble");
      assert.equal(error.set, "Stop reasons");
      assert.match(error.message, /gate_wobble/);
      assert.match(error.message, /Stop reasons/);
      return true;
    },
  );

  // An exit code outside row 6 of §X.6.
  const badCode = structuredClone(table);
  badCode.halts[0] = { ...badCode.halts[0], exitCode: 42 };
  assert.throws(
    () => loadGateHalts(badCode),
    (error: unknown) => {
      assert.ok(error instanceof GateHaltsError);
      assert.equal(error.value, "42");
      assert.equal(error.set, "Engine exit codes");
      assert.match(error.message, /42/);
      return true;
    },
  );

  // A pairing that disagrees with annex E §E.3.
  const badPair = structuredClone(table);
  badPair.halts[2] = { ...badPair.halts[2], exitCode: 2 };
  assert.throws(() => loadGateHalts(badPair), /annex E/);

  // A row without a stop reason that claims to be retryable (F100-FR-148).
  const badRetryable = structuredClone(table);
  badRetryable.halts[0] = { ...badRetryable.halts[0], retryable: true };
  assert.throws(() => loadGateHalts(badRetryable), /F100-FR-148/);

  // A wrong schema id, and a file of the wrong shape.
  assert.throws(() => loadGateHalts({ schema: "specstride.other/1", halts: [] }), /schema id/);
  assert.throws(() => loadGateHalts({ schema: SCHEMA_ID }), /a list of rows/);

  // The real table still loads, which is what the import of this module proved.
  assert.deepEqual(
    loadGateHalts().map((h) => h.cause),
    GATE_HALTS.map((h) => h.cause),
  );
});
