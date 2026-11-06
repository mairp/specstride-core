/**
 * CT-141-124 — a line that only the port prints (T036, T059; F141-FR-024,
 * DV-034).
 *
 * What the test proves.
 *
 * - **a line that only the port prints gives `different`**: a compared stream of
 *   the port that holds a line the reference has no equivalent for makes the
 *   surface `different`, and the line itself is in the report under the selector
 *   `a line that only the port prints`;
 * - **no rule removes it**: the line is carried through every rule of feature 100
 *   unchanged — the test runs all 29 over it — so no normalization can hide it;
 * - **no waiver removes it**: a waiver that names the fixture, the surface and the
 *   line is consulted AFTER the line was found, and the surface is still
 *   `different`;
 * - **the first suite compares compatibility output**: the comparison is of the
 *   compatibility output of the port, which is the first suite, and a line the port
 *   adds to it is therefore a difference and not a new feature of a second layer.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  COMPARED_STREAMS,
  compare,
  portOnlyLines,
  resultOf,
} from "../../src/compare/comparator.ts";
import { RULES, normalize } from "../../src/normalize/index.ts";
import type { Waiver } from "../../src/waivers/waivers.ts";

const NEW_LINE = "the port says something the reference never said";

const CONTEXT = {
  scenario: "FX-01/three-phases",
  side: "reference" as const,
  roots: [],
  statePaths: {},
  durationsUnderTest: [],
  slug: "three-phases",
};

const captureOf = (text: string, side: "reference" | "port") => ({
  scenario: "FX-01/three-phases",
  side,
  suite: "first" as const,
  layer: "off" as const,
  surfaces: { stdout: { text } },
  missing: {},
});

const compareStreams = (reference: string, port: string, waivers: readonly Waiver[] = []) =>
  compare(captureOf(reference, "reference"), captureOf(port, "port"), {
    fixture: "FX-01/three-phases",
    suite: "first",
    referenceContext: CONTEXT,
    portContext: { ...CONTEXT, side: "port" as const },
    waivers,
  });

test("CT-141-124: the lines a compared stream of the port adds are found", () => {
  assert.deepEqual([...COMPARED_STREAMS], ["stdout", "stderr"]);
  assert.deepEqual(
    [...portOnlyLines({ text: "one\ntwo\n" }, { text: `one\ntwo\n${NEW_LINE}\n` })],
    [NEW_LINE],
  );
  // A line the reference prints too is no port-only line, whatever its position.
  assert.deepEqual([...portOnlyLines({ text: "one\ntwo\n" }, { text: "two\none\n" })], []);
  // A stream that is shorter on the port side holds no port-only line: a MISSING
  // line is an ordinary difference and is found by the comparator.
  assert.deepEqual([...portOnlyLines({ text: "one\ntwo\n" }, { text: "one\n" })], []);
});

test("CT-141-124: a line that only the port prints gives `different`", () => {
  const comparison = compareStreams("one\ntwo\n", `one\ntwo\n${NEW_LINE}\n`);
  assert.equal(resultOf(comparison.report, "stdout"), "different");
  const differences = comparison.report.results["stdout"]?.differences ?? [];
  assert.ok(
    differences.some(
      (d) =>
        d.selector === "a line that only the port prints" &&
        d.port === NEW_LINE &&
        d.reference === null,
    ),
    `the report holds ${JSON.stringify(differences)}`,
  );
});

test("CT-141-124: no rule of feature 100 removes the line", () => {
  const capture = {
    scenario: "FX-01/three-phases",
    side: "port" as const,
    suite: "first" as const,
    layer: "off" as const,
    surfaces: { stdout: { text: `one\n${NEW_LINE}\n` } },
    missing: {},
  };
  const normalized = normalize(capture, { ...CONTEXT, side: "port" });
  const text = (normalized.surfaces["stdout"] as { text: string }).text;
  assert.ok(text.includes(NEW_LINE), `the line survived normalization: ${text}`);
  // Rule by rule, so that the one that removed it would be named.
  assert.equal(RULES.length, 29);
  for (const rule of RULES) {
    const one = {
      ...capture,
      surfaces: { stdout: { text: `one\n${NEW_LINE}\n` } } as Record<string, unknown>,
      findings: [] as string[],
    };
    rule.apply(one, { ...CONTEXT, side: "port" });
    assert.ok(
      JSON.stringify(one.surfaces).includes(NEW_LINE),
      `${rule.id} removed the line that only the port prints`,
    );
  }
});

test("CT-141-124: no waiver removes the line", () => {
  // A waiver that names the fixture, the surface and exactly that line.
  const waiver: Waiver = {
    fixture: "FX-01/three-phases",
    surface: "stdout",
    row: "DV-004",
    difference: { selector: "a line that only the port prints", reference: null, port: NEW_LINE },
  };
  const comparison = compareStreams("one\ntwo\n", `one\ntwo\n${NEW_LINE}\n`, [waiver]);
  assert.equal(
    resultOf(comparison.report, "stdout"),
    "different",
    "a line that only the port prints is found before the waivers are consulted",
  );
  // A waiver that names the ordinary text difference does not help either.
  const onTheText: Waiver = {
    ...waiver,
    difference: { selector: "text", reference: "one\ntwo\n", port: `one\ntwo\n${NEW_LINE}\n` },
  };
  assert.equal(
    resultOf(compareStreams("one\ntwo\n", `one\ntwo\n${NEW_LINE}\n`, [onTheText]).report, "stdout"),
    "different",
  );
});

test("CT-141-124: the first suite is what is compared, and it is the compatibility output", () => {
  const comparison = compareStreams("one\n", `one\n${NEW_LINE}\n`);
  assert.equal(comparison.report.suite, "first");
  // The layer of both captures is `off`: the first suite compares the
  // compatibility output of the port and not a second layer of its own.
  assert.equal(comparison.normalized.reference.layer, "off");
  assert.equal(comparison.normalized.port.layer, "off");
});

test("CT-141-124: the same line on both sides is `equal`", () => {
  const comparison = compareStreams(`one\n${NEW_LINE}\n`, `one\n${NEW_LINE}\n`);
  assert.equal(resultOf(comparison.report, "stdout"), "equal");
});
