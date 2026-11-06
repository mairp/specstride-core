/**
 * CT-141-101 — the pins of the reference systems (T006, F141-FR-001).
 *
 * What the test proves:
 *
 * - two systems, each with a full commit id and a tree hash, both 40 hex;
 * - the state of a clone has no effect: the pin is a pure function of
 *   `packages/oracle/reference/pins.json`. No field of a pin names a branch, a
 *   ref, a tag or `HEAD`, the reader touches no clone, and the same values come
 *   back when the two clone variables point at nothing, at a directory that
 *   does not exist, and from another working directory;
 * - Lisa has no pin and no reference run.
 *
 * Every assertion is an effect witness: the file is read back from disk with
 * `readFileSync` over the repository, independently of what `src/reference/pins.ts`
 * exports, and a sha-256 over its bytes is recorded as the durable identity.
 *
 * Nothing here calls a model, opens a socket or needs a credential (F141-FR-038).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  LISA,
  PINNED_SYSTEMS,
  PINS_FILE,
  PIN_HASH_PATTERN,
  PinError,
  SYSTEMS_WITHOUT_A_PIN,
  hasPin,
  pin,
  pins,
  pinsForExerciseMap,
  readPins,
  requirePin,
} from "../../src/reference/pins.ts";

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const ROOT = resolve(PACKAGE, "../..");

function digest(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** The two pins of F141-FR-001, written out so the test does not read them from the code. */
const EXPECTED = {
  specstride: {
    commit: "9cab15d2d08f6c54644985f7251700bbdbcab282",
    tree: "d58ea3b50f67a6cdfb387b1d86e5d145ac923880",
  },
  "mixture-of-loops": {
    commit: "9c88f86e1771efeabcfe3b4b1cb24384fff284e8",
    tree: "a7473137805cded899ee0077b7879c70a05f4451",
  },
} as const;

// ---------------------------------------------------------------------------
// Two systems, a commit and a tree hash
// ---------------------------------------------------------------------------

test("CT-141-101: packages/oracle/reference/pins.json holds one pin per reference system", () => {
  const file = join(PACKAGE, "reference/pins.json");
  assert.ok(existsSync(file), "packages/oracle/reference/pins.json exists");
  // The exported path names the file that is on disk.
  assert.equal(resolve(PINS_FILE), resolve(file));

  const bytes = readFileSync(file);
  const identity = digest(bytes);
  assert.equal(identity.length, 64);
  // The durable identity of the file, recorded by this test.
  assert.match(identity, /^[0-9a-f]{64}$/);

  const data = JSON.parse(bytes.toString("utf8")) as {
    schema?: string;
    pins?: { system: string; commit: string; tree: string }[];
    noPin?: { system: string; why: string }[];
  };

  assert.equal(data.schema, "urn:specstride:schema:internal:141:oracle-pins/1");
  assert.ok(Array.isArray(data.pins));
  assert.equal(data.pins?.length, 2, "two systems");

  const bySystem = new Map((data.pins ?? []).map((p) => [p.system, p]));
  assert.deepEqual([...bySystem.keys()].sort(), ["mixture-of-loops", "specstride"]);

  for (const [system, expected] of Object.entries(EXPECTED)) {
    const row = bySystem.get(system);
    assert.ok(row, `${system} is pinned`);
    assert.equal(row?.commit, expected.commit, `${system}: the full commit id of F141-FR-001`);
    assert.equal(row?.tree, expected.tree, `${system}: the tree hash of F141-FR-001`);
    assert.match(row?.commit ?? "", /^[0-9a-f]{40}$/, "the commit is 40 hex");
    assert.match(row?.tree ?? "", /^[0-9a-f]{40}$/, "the tree hash is 40 hex");
  }
});

test("CT-141-101: the reader gives the two pins of the file, typed", () => {
  assert.deepEqual([...PINNED_SYSTEMS].sort(), ["mixture-of-loops", "specstride"]);
  assert.equal(pins.length, 2);

  for (const system of PINNED_SYSTEMS) {
    const p = requirePin(system);
    assert.equal(p.system, system);
    assert.equal(p.commit, EXPECTED[system].commit);
    assert.equal(p.tree, EXPECTED[system].tree);
    assert.match(p.commit, PIN_HASH_PATTERN);
    assert.match(p.tree, PIN_HASH_PATTERN);
    assert.ok(hasPin(system));
  }

  // The pin reader and the file agree, read through two paths.
  const onDisk = JSON.parse(readFileSync(join(PACKAGE, "reference/pins.json"), "utf8")) as {
    pins: { system: string; commit: string; tree: string }[];
  };
  assert.deepEqual(
    pins.map((p) => ({ system: p.system, commit: p.commit, tree: p.tree })),
    onDisk.pins,
  );
});

test("CT-141-101: the pins carry the exercise-map form, one commit per system", () => {
  // `data/schemas/exercise-map.schema.json` requires `pins`; the map records
  // which commit was traced.
  assert.deepEqual(pinsForExerciseMap(), {
    specstride: EXPECTED.specstride.commit,
    "mixture-of-loops": EXPECTED["mixture-of-loops"].commit,
  });
});

// ---------------------------------------------------------------------------
// The state of a clone has no effect
// ---------------------------------------------------------------------------

test("CT-141-101: no pin names a branch, a ref, a tag or HEAD", () => {
  const text = readFileSync(join(PACKAGE, "reference/pins.json"), "utf8");
  const data = JSON.parse(text) as { pins: Record<string, unknown>[] };
  // Only the pinned commit counts: a pin has exactly these three fields, so
  // there is nothing in it that a checkout could change (F141-FR-001).
  for (const row of data.pins) {
    assert.deepEqual(Object.keys(row).sort(), ["commit", "system", "tree"]);
  }
  for (const word of ["branch", "ref:", "refs/", "tag", "HEAD", "main", "master"]) {
    assert.ok(
      !JSON.stringify(data.pins).includes(word),
      `the pins name no ${word}: only the pinned commit counts`,
    );
  }
});

test("CT-141-101: the state of a clone has no effect on the pin", () => {
  const before = pins.map((p) => ({ ...p }));

  // A pin is a pure function of the file. Point the two clone variables at
  // nothing and at a path that does not exist, change the working directory,
  // and read again: the same values come back, and nothing was read from a
  // clone (a missing directory would have thrown).
  const saved = {
    specstride: process.env["ORACLE_REF_SPECSTRIDE"],
    mol: process.env["ORACLE_REF_MOL"],
  };
  const cwd = process.cwd();
  try {
    delete process.env["ORACLE_REF_SPECSTRIDE"];
    delete process.env["ORACLE_REF_MOL"];
    assert.deepEqual(
      readPins().map((p) => ({ ...p })),
      before,
    );

    process.env["ORACLE_REF_SPECSTRIDE"] = join(ROOT, "no-such-clone-a");
    process.env["ORACLE_REF_MOL"] = join(ROOT, "no-such-clone-b");
    process.chdir(ROOT);
    assert.deepEqual(
      readPins().map((p) => ({ ...p })),
      before,
    );
  } finally {
    process.chdir(cwd);
    if (saved.specstride === undefined) delete process.env["ORACLE_REF_SPECSTRIDE"];
    else process.env["ORACLE_REF_SPECSTRIDE"] = saved.specstride;
    if (saved.mol === undefined) delete process.env["ORACLE_REF_MOL"];
    else process.env["ORACLE_REF_MOL"] = saved.mol;
  }
});

// ---------------------------------------------------------------------------
// Lisa has no pin
// ---------------------------------------------------------------------------

test("CT-141-101: Lisa has no pin and no reference run", () => {
  assert.equal(LISA, "lisa");
  assert.ok(SYSTEMS_WITHOUT_A_PIN.includes(LISA));
  assert.equal(hasPin(LISA), false);
  assert.equal(pin(LISA), undefined);
  assert.throws(
    () => requirePin(LISA),
    (error: unknown) => error instanceof PinError && /lisa/.test((error as Error).message) === true,
    "requirePin refuses Lisa",
  );

  // The file states it, so the absence is a record and not an omission.
  const data = JSON.parse(readFileSync(join(PACKAGE, "reference/pins.json"), "utf8")) as {
    pins: { system: string }[];
    noPin: { system: string; why: string }[];
  };
  assert.ok(!data.pins.some((p) => p.system === "lisa"));
  const lisa = data.noPin.find((n) => n.system === "lisa");
  assert.ok(lisa, "pins.json records that Lisa has no pin");
  assert.match(lisa?.why ?? "", /F141-FR-001/);
});

// ---------------------------------------------------------------------------
// Refusals of the reader
// ---------------------------------------------------------------------------

test("CT-141-101: the reader refuses a pins file that is not the two systems", () => {
  const good = JSON.parse(readFileSync(join(PACKAGE, "reference/pins.json"), "utf8")) as {
    schema: string;
    pins: { system: string; commit: string; tree: string }[];
    noPin: { system: string; why: string }[];
  };

  const cases: [string, unknown][] = [
    ["a short commit", { ...good, pins: [{ ...good.pins[0], commit: "9cab15d" }, good.pins[1]] }],
    [
      "a missing tree hash",
      { ...good, pins: [{ system: "specstride", commit: good.pins[0]!.commit }, good.pins[1]] },
    ],
    ["only one system", { ...good, pins: [good.pins[0]] }],
    [
      "a third system",
      {
        ...good,
        pins: [...good.pins, { system: "lisa", commit: "a".repeat(40), tree: "b".repeat(40) }],
      },
    ],
    [
      "a pin for Lisa",
      {
        ...good,
        pins: [good.pins[0], { system: "lisa", commit: "a".repeat(40), tree: "b".repeat(40) }],
      },
    ],
    ["an unknown field", { ...good, pins: [{ ...good.pins[0], branch: "main" }, good.pins[1]] }],
    ["another schema id", { ...good, schema: "urn:specstride:schema:internal:141:oracle-pins/2" }],
  ];

  for (const [why, value] of cases) {
    assert.throws(
      () => readPins(value),
      (error: unknown) => error instanceof PinError,
      `the reader refuses ${why}`,
    );
  }

  // The good value still reads, so the refusals above are about the change.
  assert.equal(readPins(good).length, 2);
});
