/**
 * CT-141-122 — the waivers (T034, T060; F141-FR-022).
 *
 * What the test proves.
 *
 * - **keyed by fixture, surface and row**: a waiver carries all three and the
 *   difference it accepts; the ONE file is `packages/oracle/waivers.json`, held to
 *   `data/schemas/waivers.schema.json`, and a waiver that leaves a key out is
 *   refused by the schema;
 * - **a waiver without a register row that says waiver is refused**: a row the
 *   register does not hold, and a row whose oracle handling is anything other than
 *   "waiver", are both refused by name at load time — before any comparison;
 * - **a waiver that matches nothing fails the suite**: the use of every waiver is
 *   counted over the whole suite and a waiver that matched nothing fails it and is
 *   named (quickstart scenario 8);
 * - **a waiver never reaches another fixture or surface**: the same difference in
 *   another fixture, in another surface, under another selector, with other values,
 *   or on another operating system is not matched.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DV_023_NEEDS_THE_INSTALL_ROOT_LAYER,
  DV_112_NEEDS_THE_PRIME_STUB,
  HANDLING_THAT_ALLOWS_A_WAIVER,
  WAIVER_FILE,
  WAVE_1_WAIVER_ROWS,
  WaiverError,
  assertEveryWaiverMatchedSomething,
  assertWaiverIsAllowed,
  keyOf,
  matches,
  readWaiverFile,
  useOfWaivers,
  waiverFor,
  type Difference,
  type Waiver,
  primeStubIsCalledBy,
} from "../../src/waivers/waivers.ts";
import { registerMap } from "../../src/catalogue/data.ts";

/** `packages/oracle/`, for the declarations the two conditioned rows are judged against. */
const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** A waiver for DV-060, whose register row says waiver and whose family is FX-32. */
const WAIVER: Waiver = {
  fixture: "FX-32/tasks-unreadable-by-old-grammar",
  surface: "stdout",
  row: "DV-060",
  difference: {
    selector: "text",
    reference: "the old parser read no task\n",
    port: "the one grammar read two tasks\n",
  },
};

/** The difference that waiver accepts. */
const DIFFERENCE: Difference = {
  fixture: WAIVER.fixture,
  surface: WAIVER.surface,
  selector: WAIVER.difference.selector,
  reference: WAIVER.difference.reference,
  port: WAIVER.difference.port,
};

test("CT-141-122: the one waiver file is on disk and holds up to its schema", () => {
  const file = readWaiverFile();
  assert.equal(file.schema, "urn:specstride:schema:internal:141:oracle-waivers/1");
  assert.ok(Array.isArray(file.waivers));
  assert.ok(WAIVER_FILE.endsWith(join("packages", "oracle", "waivers.json")));
  // Every waiver the file holds is allowed; an empty file is allowed too, and is
  // what the oracle starts from. The two conditioned rows are judged against the
  // SCENARIO: DV-112 is a waiver only where the prime stub is called, which the
  // declaration of the scenario says (`primeStubIsCalledBy`).
  for (const waiver of file.waivers) {
    const base = waiver.fixture.replace(/@(engine-stub|full-stack)$/, "");
    const declarationFile = join(PACKAGE, "fixtures", base, "fixture.json");
    const declaration = existsSync(declarationFile)
      ? (JSON.parse(readFileSync(declarationFile, "utf8")) as Record<string, unknown>)
      : {};
    assertWaiverIsAllowed(waiver, { primeStubIsCalled: primeStubIsCalledBy(declaration) });
  }
  // The condition is not vacuous: a scenario that names no prime role is refused the
  // row, and a scenario whose prime executable does not exist starts no stub.
  assert.equal(primeStubIsCalledBy({ environment: { SPECSTRIDE_PROPOSER: "dsh" } }), false);
  assert.equal(primeStubIsCalledBy({ environment: { SPECSTRIDE_CRITIC: "prime" } }), true);
  assert.equal(
    primeStubIsCalledBy({
      environment: { SPECSTRIDE_PROPOSER: "prime", SPECSTRIDE_PRIME_AGENT_BIN: "no-such-prime" },
    }),
    false,
  );
});

test("CT-141-122: a waiver is keyed by fixture, surface and register row", () => {
  assert.equal(keyOf(WAIVER), "FX-32/tasks-unreadable-by-old-grammar / stdout / DV-060 / text");
  // A waiver that leaves one of the keys out is refused by the schema of the file.
  const file = join(mkdtempSync(join(tmpdir(), "oracle-waivers-")), "waivers.json");
  for (const missing of ["fixture", "surface", "row", "difference"] as const) {
    const waiver: Record<string, unknown> = { ...WAIVER };
    delete waiver[missing];
    writeFileSync(
      file,
      JSON.stringify({
        schema: "urn:specstride:schema:internal:141:oracle-waivers/1",
        waivers: [waiver],
      }),
      "utf8",
    );
    assert.throws(
      () => readWaiverFile(file),
      (error: unknown) => error instanceof WaiverError && error.message.includes(missing),
      `a waiver without ${missing} is refused`,
    );
  }
});

test("CT-141-122: a waiver whose register row does not exist is refused", () => {
  assert.throws(
    () => assertWaiverIsAllowed({ ...WAIVER, row: "DV-999" }),
    (error: unknown) =>
      error instanceof WaiverError &&
      /names the register row DV-999, which the register does not hold/.test(error.message),
  );
});

test("CT-141-122: a waiver whose row does not say waiver is refused", () => {
  // DV-001 exists and is handled as "not observable".
  const row = registerMap().rows.find((r) => r.row === "DV-001");
  assert.ok(row !== undefined);
  assert.ok(!row.handling.includes(HANDLING_THAT_ALLOWS_A_WAIVER));
  assert.throws(
    () => assertWaiverIsAllowed({ ...WAIVER, row: "DV-001" }),
    (error: unknown) =>
      error instanceof WaiverError &&
      /whose oracle handling is "not observable" and does not say\s+"waiver"/.test(error.message),
  );
  // Every row of the Wave 1 list does say waiver, so every one of them is allowed.
  for (const name of WAVE_1_WAIVER_ROWS) {
    const entry = registerMap().rows.find((r) => r.row === name);
    assert.ok(entry !== undefined, `${name} is a row of the register`);
    assert.ok(
      entry.handling.includes(HANDLING_THAT_ALLOWS_A_WAIVER),
      `${name} is handled by a waiver`,
    );
  }
});

test("CT-141-122: the two rows with a condition of their own", () => {
  assert.throws(
    () => assertWaiverIsAllowed({ ...WAIVER, row: DV_112_NEEDS_THE_PRIME_STUB }),
    (error: unknown) =>
      error instanceof WaiverError && /in which the prime stub is\s+called/.test(error.message),
  );
  assertWaiverIsAllowed(
    { ...WAIVER, row: DV_112_NEEDS_THE_PRIME_STUB },
    { primeStubIsCalled: true },
  );
  assert.throws(
    () => assertWaiverIsAllowed({ ...WAIVER, row: DV_023_NEEDS_THE_INSTALL_ROOT_LAYER }),
    (error: unknown) =>
      error instanceof WaiverError && /a fixture that tests that layer/.test(error.message),
  );
  assertWaiverIsAllowed(
    { ...WAIVER, row: DV_023_NEEDS_THE_INSTALL_ROOT_LAYER },
    { testsTheInstallRootLayer: true },
  );
});

test("CT-141-122: a waiver matches the difference it names, and nothing else", () => {
  assert.ok(matches(WAIVER, DIFFERENCE, "linux"));
  assert.equal(waiverFor([WAIVER], DIFFERENCE), WAIVER);
  // Another fixture.
  assert.ok(!matches(WAIVER, { ...DIFFERENCE, fixture: "FX-32/greeting-ready" }, "linux"));
  // Another surface.
  assert.ok(!matches(WAIVER, { ...DIFFERENCE, surface: "stderr" }, "linux"));
  // Another selector.
  assert.ok(!matches(WAIVER, { ...DIFFERENCE, selector: "bytes" }, "linux"));
  // Other values.
  assert.ok(!matches(WAIVER, { ...DIFFERENCE, port: "something else\n" }, "linux"));
  assert.ok(!matches(WAIVER, { ...DIFFERENCE, reference: "something else\n" }, "linux"));
  // And nothing of it reaches another fixture or surface through `waiverFor`.
  assert.equal(waiverFor([WAIVER], { ...DIFFERENCE, surface: "tree" }), undefined);
  assert.equal(waiverFor([WAIVER], { ...DIFFERENCE, fixture: "FX-01/three-phases" }), undefined);
});

test("CT-141-122: a waiver named for one operating system does not reach the other", () => {
  const macOnly: Waiver = { ...WAIVER, os: ["macos"] };
  assert.ok(matches(macOnly, DIFFERENCE, "macos"));
  assert.ok(!matches(macOnly, DIFFERENCE, "linux"));
});

test("CT-141-122: a waiver that matches nothing fails the suite and is named", () => {
  const used = useOfWaivers([WAIVER], [DIFFERENCE]);
  assert.deepEqual(
    used.map((u) => u.matched),
    [1],
  );
  assertEveryWaiverMatchedSomething(used);

  const idle = useOfWaivers([WAIVER], [{ ...DIFFERENCE, surface: "stderr" }]);
  assert.deepEqual(
    idle.map((u) => u.matched),
    [0],
  );
  assert.throws(
    () => assertEveryWaiverMatchedSomething(idle),
    (error: unknown) =>
      error instanceof WaiverError &&
      /1 waiver\(s\) matched no difference in any fixture of the suite/.test(error.message) &&
      error.message.includes(keyOf(WAIVER)),
  );
  // And over a suite with no difference at all.
  assert.throws(() => assertEveryWaiverMatchedSomething(useOfWaivers([WAIVER], [])), WaiverError);
});
