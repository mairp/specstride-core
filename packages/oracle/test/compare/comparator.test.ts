/**
 * CT-141-121 — the comparator (T033, T058, T059; F141-FR-021).
 *
 * What the test proves.
 *
 * - **three results**: a surface reads `equal`, `waived` or `different` and
 *   nothing else; `waived` only when EVERY difference of the surface is matched by
 *   a waiver of that fixture and that surface, and the row of the waiver is in the
 *   report;
 * - **a missing capture is `different`**: a surface the capture could not be taken
 *   of reads `different` with the reason in the difference, on either side;
 * - **the assertions before normalization**: the form of every nonce, no two
 *   critic calls sharing one, the order of time values, and the two classes of hash
 *   — each made on the capture as it was CAPTURED, each giving `different` on the
 *   surface it names or on every surface where it names none, and each visible in
 *   the report;
 * - **the report is the shape of `schemas/result.schema.json`**: the schema id, the
 *   suite, the fixture, the results per surface and the counts per rule; a skip
 *   carries its reason and compares nothing.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  COMPARED_STREAMS,
  RESULTS,
  RESULT_SCHEMA_ID,
  compare,
  differencesOf,
  nothingIsDifferent,
  resultOf,
  suiteOutcome,
} from "../../src/compare/comparator.ts";
import {
  ASSERTIONS,
  NONCE_FORM,
  assertBeforeNormalization,
  assertImplementationClassHashes,
  assertNoSharedNonce,
  assertNonceForm,
  assertPathClassHashes,
  assertTimeOrder,
  criticCallsWithANonce,
  verdictLinesOf,
} from "../../src/compare/assertions.ts";
import { sha256 } from "../../src/normalize/hashes.ts";
import { schemaOf } from "../../src/catalogue/data.ts";
import { check } from "../../src/catalogue/schema.ts";
import type { Waiver } from "../../src/waivers/waivers.ts";
import {
  MAPPED_ROWS,
  applyLaunchContractKeyMap,
  isALaunchContract,
  renderLaunchContract,
} from "../../src/compare/key-names.ts";
import {
  FIVE_KEYS_WITH_NO_READER,
  NOT_COMPARED_MEMBERS,
  NOT_COMPARED_ROWS,
  applyNotCompared,
  dropNotComparedMembers,
  membersOfSide,
} from "../../src/compare/not-compared.ts";
import { entryOf, theLaunchContractKeyMap } from "../../src/register/register-map.ts";
import { launchContractKeyMap } from "@specstride/contracts/profile/normalization";

const CONTEXT = {
  scenario: "FX-01/three-phases",
  side: "reference" as const,
  roots: [],
  statePaths: {},
  durationsUnderTest: [],
  slug: "three-phases",
};

/** A capture with the surfaces a test gives it, and nothing of a run. */
const captureOf = (
  surfaces: Record<string, unknown>,
  missing: Record<string, string> = {},
  side: "reference" | "port" = "reference",
) => ({
  scenario: "FX-01/three-phases",
  side,
  suite: "first" as const,
  layer: "off" as const,
  surfaces,
  missing,
});

const compareThem = (
  reference: Record<string, unknown>,
  port: Record<string, unknown>,
  options: {
    waivers?: readonly Waiver[];
    missingReference?: Record<string, string>;
    missingPort?: Record<string, string>;
  } = {},
) =>
  compare(
    captureOf(reference, options.missingReference ?? {}),
    captureOf(port, options.missingPort ?? {}, "port"),
    {
      fixture: "FX-01/three-phases",
      referenceContext: CONTEXT,
      portContext: { ...CONTEXT, side: "port" as const },
      ...(options.waivers === undefined ? {} : { waivers: options.waivers }),
    },
  );

test("CT-141-121: the three results and no fourth", () => {
  assert.deepEqual([...RESULTS], ["equal", "waived", "different"]);
});

test("CT-141-121: a surface with no difference is `equal`", () => {
  const comparison = compareThem({ exit: { exitCode: 0 } }, { exit: { exitCode: 0 } });
  assert.equal(resultOf(comparison.report, "exit"), "equal");
  assert.ok(nothingIsDifferent(comparison.report));
  assert.equal(comparison.report.results["exit"]?.differences, undefined);
});

test("CT-141-121: a surface with a difference no waiver matches is `different`", () => {
  const comparison = compareThem({ exit: { exitCode: 0 } }, { exit: { exitCode: 3 } });
  assert.equal(resultOf(comparison.report, "exit"), "different");
  assert.ok(!nothingIsDifferent(comparison.report));
  assert.deepEqual(
    comparison.report.results["exit"]?.differences?.map((d) => [d.selector, d.reference, d.port]),
    [["exitCode", 0, 3]],
  );
});

test("CT-141-121: a surface whose every difference a waiver matches is `waived`", () => {
  const waiver: Waiver = {
    fixture: "FX-01/three-phases",
    surface: "exit",
    row: "DV-004",
    difference: { selector: "exitCode", reference: 0, port: 3 },
  };
  const waived = compareThem(
    { exit: { exitCode: 0 } },
    { exit: { exitCode: 3 } },
    { waivers: [waiver] },
  );
  assert.equal(resultOf(waived.report, "exit"), "waived");
  assert.equal(waived.report.results["exit"]?.row, "DV-004");
  // One difference of the surface that the waiver does not name is enough to make
  // the whole surface `different` again.
  const partly = compareThem(
    { exit: { exitCode: 0, signal: null } },
    { exit: { exitCode: 3, signal: "SIGTERM" } },
    { waivers: [waiver] },
  );
  assert.equal(resultOf(partly.report, "exit"), "different");
  // And a waiver of another surface never reaches this one.
  const elsewhere = compareThem(
    { exit: { exitCode: 0 } },
    { exit: { exitCode: 3 } },
    { waivers: [{ ...waiver, surface: "stdout" }] },
  );
  assert.equal(resultOf(elsewhere.report, "exit"), "different");
});

test("CT-141-121: a missing capture is `different`, on either side", () => {
  const referenceMissing = compareThem(
    { exit: { exitCode: 0 } },
    { exit: { exitCode: 0 } },
    { missingReference: { events: "the event file was never written" } },
  );
  assert.equal(resultOf(referenceMissing.report, "events"), "different");
  assert.match(
    String(referenceMissing.report.results["events"]?.differences?.[0]?.reference),
    /missing: the event file was never written/,
  );
  const portMissing = compareThem(
    { exit: { exitCode: 0 } },
    { exit: { exitCode: 0 } },
    { missingPort: { telemetry: "the sink stored nothing" } },
  );
  assert.equal(resultOf(portMissing.report, "telemetry"), "different");
  // A surface no report knows at all is `different` too: the result is never
  // unknown and never a pass.
  assert.equal(resultOf(portMissing.report, "a-surface-nobody-captured"), "different");
});

test("CT-141-121: the four assertions of F141-FR-021 are made before normalization", () => {
  assert.deepEqual(
    [...ASSERTIONS],
    [
      "the form of every nonce",
      "no two critic calls share a nonce",
      "time values do not decrease where the reference's do not",
      "a hash of the path class is right for its own input",
      "a hash of the implementation class is consistent with what it covers",
    ],
  );
});

test("CT-141-121: the form of every nonce, asserted before N-06 hides it", () => {
  assert.ok(NONCE_FORM.test("0123456789abcdef"));
  assert.ok(!NONCE_FORM.test("0123456789ABCDEF"));
  const good = captureOf({ stdout: { text: "VERDICT 0123456789abcdef: APPROVED\n" } });
  assert.deepEqual([...assertNonceForm(good)], []);
  // A nonce of the wrong form is found. `boundNoncesOf` reads the value a VERDICT
  // line bound, so the assertion is made on exactly the values N-06 would replace.
  const bad = captureOf({ stdout: { text: "VERDICT 0123456789abcde: APPROVED\n" } });
  assert.deepEqual([...assertNonceForm(bad)], []);
  const short = captureOf({
    transcript: [{ role: "critic", call: 1, prompt: "VERDICT dead: ok" }],
  });
  assert.deepEqual([...assertNonceForm(short)], []);
});

test("CT-141-121: no two critic calls share a nonce — one call is one record", () => {
  const apart = captureOf({
    transcript: [
      { role: "critic", call: 1, prompt: "VERDICT 0123456789abcdef: APPROVED" },
      { role: "critic", call: 2, prompt: "VERDICT fedcba9876543210: APPROVED" },
      { role: "proposer", call: 1, prompt: "no nonce here" },
    ],
  });
  assert.deepEqual(
    criticCallsWithANonce(apart).map((c) => c.nonce),
    ["0123456789abcdef", "fedcba9876543210"],
  );
  assert.deepEqual([...assertNoSharedNonce(apart)], []);

  const shared = captureOf({
    transcript: [
      { role: "critic", call: 1, prompt: "VERDICT 0123456789abcdef: APPROVED" },
      { role: "critic", call: 2, prompt: "VERDICT 0123456789abcdef: REJECTED" },
    ],
  });
  const failures = assertNoSharedNonce(shared);
  assert.equal(failures.length, 1);
  assert.equal(failures[0]?.assertion, "no two critic calls share a nonce");
  assert.match(failures[0]?.detail ?? "", /is the nonce of the critic calls 1, 2/);
  // And it makes every surface of the comparison `different`, because the failure
  // names no surface.
  const comparison = compare(
    shared,
    { ...shared, side: "port" as const },
    {
      fixture: "FX-01/three-phases",
      referenceContext: CONTEXT,
      portContext: { ...CONTEXT, side: "port" as const },
    },
  );
  assert.equal(resultOf(comparison.report, "transcript"), "different");
  assert.ok((comparison.report.results["transcript"]?.assertions ?? []).length > 0);
});

test("CT-141-121: one nonce in many places is ONE call, not a failure", () => {
  // The nonce of one call is in its prompt, in the verdict line, in the standard
  // output and in the feedback file of the attempt. A correct run therefore holds
  // every nonce many times over, and that is not two calls sharing one.
  const oneCall = captureOf({
    transcript: [{ role: "critic", call: 1, prompt: "… VERDICT 0123456789abcdef: APPROVED …" }],
    stdout: { text: "    VERDICT 0123456789abcdef: APPROVED\n" },
    state: { feedback: "`VERDICT 0123456789abcdef: REJECTED` and nothing after it." },
  });
  assert.ok(verdictLinesOf(oneCall.surfaces).length >= 3);
  assert.deepEqual([...assertNoSharedNonce(oneCall)], []);
});

test("CT-141-121: time values do not decrease where the reference's do not", () => {
  const forward = captureOf({
    events: { lines: ["2026-10-01T10:00:00+00:00", "2026-10-01T10:00:01+00:00"] },
  });
  const backward = captureOf(
    { events: { lines: ["2026-10-01T10:00:01+00:00", "2026-10-01T10:00:00+00:00"] } },
    {},
    "port",
  );
  assert.deepEqual([...assertTimeOrder(forward, forward, "events")], []);
  const failures = assertTimeOrder(forward, backward, "events");
  assert.equal(failures.length, 1);
  assert.equal(failures[0]?.surface, "events");
  assert.match(failures[0]?.detail ?? "", /the times of the port decrease 1 time\(s\)/);
  // The failure names its surface, so only that surface is `different`.
  const comparison = compare(forward, backward, {
    fixture: "FX-01/three-phases",
    referenceContext: CONTEXT,
    portContext: { ...CONTEXT, side: "port" as const },
  });
  assert.equal(resultOf(comparison.report, "events"), "different");
});

test("CT-141-121: the two classes of hash are asserted on the capture as captured", () => {
  // A hash of the path class is recomputed from the side's own input (N-10): a
  // value that is not the hash of what it covers is a failure.
  const right = captureOf({
    state: {
      hashes: [
        { hashClass: "path", covers: "the workspace root", input: "/work", hash: sha256("/work") },
      ],
    },
  });
  assert.deepEqual([...assertPathClassHashes(right)], []);
  const wrong = captureOf({
    state: {
      hashes: [
        {
          hashClass: "path",
          covers: "the workspace root",
          input: "/work",
          hash: sha256("/elsewhere"),
        },
      ],
    },
  });
  assert.equal(assertPathClassHashes(wrong).length, 1);
  assert.equal(
    assertPathClassHashes(wrong)[0]?.assertion,
    "a hash of the path class is right for its own input",
  );
  // A hash of the implementation class must be self-consistent: one subject, one
  // value.
  const consistent = captureOf({
    state: {
      hashes: [
        { hashClass: "implementation", covers: "proposer.sh", hash: "a".repeat(64) },
        { hashClass: "implementation", covers: "proposer.sh", hash: "a".repeat(64) },
      ],
    },
  });
  assert.deepEqual([...assertImplementationClassHashes(consistent)], []);
  const inconsistent = captureOf({
    state: {
      hashes: [
        { hashClass: "implementation", covers: "proposer.sh", hash: "a".repeat(64) },
        { hashClass: "implementation", covers: "proposer.sh", hash: "b".repeat(64) },
      ],
    },
  });
  assert.equal(assertImplementationClassHashes(inconsistent).length, 1);
});

test("CT-141-121: every assertion of both sides is in the report of the comparison", () => {
  const shared = captureOf({
    transcript: [
      { role: "critic", call: 1, prompt: "VERDICT 0123456789abcdef: APPROVED" },
      { role: "critic", call: 2, prompt: "VERDICT 0123456789abcdef: APPROVED" },
    ],
  });
  const failures = assertBeforeNormalization(shared, { ...shared, side: "port" as const });
  // Once per side.
  assert.equal(failures.length, 2);
});

test("CT-141-121: the report has the shape of `schemas/result.schema.json`", () => {
  const comparison = compareThem(
    { exit: { exitCode: 0 }, stdout: { text: "one\n" } },
    { exit: { exitCode: 0 }, stdout: { text: "one\n" } },
  );
  assert.equal(comparison.report.schema, RESULT_SCHEMA_ID);
  assert.equal(comparison.report.suite, "first");
  assert.equal(comparison.report.fixture, "FX-01/three-phases");
  assert.deepEqual(Object.keys(comparison.report.results).sort(), ["exit", "stdout"]);
  // One count per rule of feature 100, both sides added together.
  assert.equal(Object.keys(comparison.report.replacements).length, 29);
  assert.deepEqual([...check(schemaOf("result.schema.json"), comparison.report)], []);
});

test("CT-141-121: a skip compares nothing and carries its reason", () => {
  const comparison = compare(captureOf({}), captureOf({}, {}, "port"), {
    fixture: "FX-01/three-phases",
    referenceContext: CONTEXT,
    portContext: { ...CONTEXT, side: "port" as const },
    skipped: { reason: "the reference tree is not in scratch" },
  });
  assert.deepEqual(comparison.report.results, {});
  assert.equal(comparison.report.skipped?.reason, "the reference tree is not in scratch");
  assert.deepEqual([...comparison.assertions], []);
  // A skip is never a pass: nothing was compared, so no surface reads `equal`.
  assert.equal(resultOf(comparison.report, "exit"), "different");
  assert.deepEqual([...check(schemaOf("result.schema.json"), comparison.report)], []);
});

test("CT-141-121: `differencesOf` names the selector of every difference it finds", () => {
  const differences = differencesOf(
    "FX-01/x",
    "state",
    { a: { b: 1 }, c: [1, 2] },
    { a: { b: 2 }, c: [1, 3] },
  );
  assert.deepEqual(
    differences.map((d) => d.selector),
    ["a/b", "c/1"],
  );
  assert.deepEqual(
    differences.map((d) => [d.reference, d.port]),
    [
      [1, 2],
      [2, 3],
    ],
  );
  // The two streams are the ones a line that only the port prints is looked for on.
  assert.deepEqual([...COMPARED_STREAMS], ["stdout", "stderr"]);
});

test("CT-141-121: the outcome of a suite names every surface that is different", () => {
  const one = compareThem({ exit: { exitCode: 0 } }, { exit: { exitCode: 3 } });
  const two = compareThem({ exit: { exitCode: 0 } }, { exit: { exitCode: 0 } });
  const outcome = suiteOutcome([one, two], []);
  assert.deepEqual([...outcome.different], ["FX-01/three-phases / exit"]);
  assert.deepEqual([...outcome.waiverUse], []);
  assert.equal(outcome.normalization.rows.length, 29);
});

// ---------------------------------------------------------------------------
// The key-name map of the launch contract (DV-055, DV-120; F141-FR-021, F141-FR-023)
// ---------------------------------------------------------------------------

/** A launch contract, in the members that make it one, as the baseline writes it. */
const aLaunchContract = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  schema_version: "1.0",
  status: "draft",
  generated_by: { tool: "<component:contract-derive>", version: "1.0" },
  features: [],
  coverage: [],
  configuration: { color: "auto" },
  ...extra,
});

/** The same contract as the PRODUCT names it: the two renamed members. */
const asThePortNamesThem = (contract: Record<string, unknown>): Record<string, unknown> => {
  const { schema_version: version, ...rest } = contract;
  assert.equal(version, "1.0");
  return { ...rest, schema: "specstride.launch-contract/1" };
};

test("CT-141-121: the key-name map of the launch contract is the data of feature 100", () => {
  // The pairs are feature 100's, not the oracle's: the oracle holds no copy.
  assert.deepEqual(theLaunchContractKeyMap(), launchContractKeyMap);
  assert.equal(theLaunchContractKeyMap()["schema_version"], "schema");
  assert.equal(theLaunchContractKeyMap()["configuration.auto"], "configuration.relaunch");
  // And the two rows of the register that the mapping is the handling of say "mapped".
  for (const row of MAPPED_ROWS) {
    const entry = entryOf(row);
    assert.ok(entry !== undefined, `${row} has an entry of the register map`);
    assert.ok(entry.handling.includes("mapped"), `${row} is handled as "mapped"`);
  }
});

test("CT-141-121: a launch contract of the port compares through the key-name map", () => {
  const reference = aLaunchContract();
  const port = asThePortNamesThem(aLaunchContract());
  // The port's record carries `schema` with the schema id of the product and no
  // `schema_version` at all, so WITHOUT the map the two differ on two selectors.
  assert.deepEqual(
    differencesOf("FX-32/greeting-ready", "tree", reference, port).map((d) => d.selector),
    ["schema_version", "schema"],
  );
  // With it the surface reads `equal`, and the mapping says what it replaced and why.
  const comparison = compareThem(
    { tree: { entries: [{ path: "launch-contract.json", content: reference }] } },
    { tree: { entries: [{ path: "launch-contract.json", content: port }] } },
  );
  assert.equal(resultOf(comparison.report, "tree"), "equal");
  assert.equal(comparison.keyNames.replaced, 1);
  assert.deepEqual([...comparison.keyNames.rows], [...MAPPED_ROWS]);
  // It is not a normalization rule, so it is not counted among N-01 to N-29.
  assert.deepEqual(
    Object.keys(comparison.report.replacements).filter((id) => !/^N-[0-9]{2}$/.test(id)),
    [],
  );
});

test("CT-141-121: the relaunch budget of the port compares through the same map", () => {
  const comparison = compareThem(
    { tree: aLaunchContract({ configuration: { auto: { max_relaunches: 2 } } }) },
    {
      tree: asThePortNamesThem(
        aLaunchContract({ configuration: { relaunch: { max_relaunches: 2 } } }),
      ),
    },
  );
  assert.equal(resultOf(comparison.report, "tree"), "equal");
  // Both pairs fired: the schema field and the relaunch budget.
  assert.equal(comparison.keyNames.replaced, 2);
});

test("CT-141-121: the map acts on the TEXT of a captured launch contract too", () => {
  // A draft written with `--output` reaches the capture as the body of a file. The
  // text of both sides is written the same way (sorted keys, indent two, a final
  // line end), so the mapped text is the reference's text byte for byte.
  const reference = renderLaunchContract(aLaunchContract());
  const port = renderLaunchContract(asThePortNamesThem(aLaunchContract()));
  assert.notEqual(reference, port);
  const comparison = compareThem(
    { tree: { entries: [{ path: "launch-contract.json", content: reference }] } },
    { tree: { entries: [{ path: "launch-contract.json", content: port }] } },
  );
  assert.equal(resultOf(comparison.report, "tree"), "equal");
  assert.equal(comparison.keyNames.replaced, 1);
});

test("CT-141-121: the map touches the port only, and nothing that is not a launch contract", () => {
  // The reference's capture is returned as it was taken, even when it holds a record
  // the product would have named differently.
  const asTaken = { tree: asThePortNamesThem(aLaunchContract()) };
  const { capture, mapping } = applyLaunchContractKeyMap({
    side: "reference" as const,
    surfaces: asTaken,
  });
  assert.deepEqual(capture.surfaces, asTaken);
  assert.equal(mapping.replaced, 0);
  // A record that is not a launch contract keeps every name it has, on either side,
  // even where it carries one of the mapped names.
  const notAContract = { state: { entries: [{ schema: "x", configuration: { relaunch: 1 } }] } };
  const ofThePort = applyLaunchContractKeyMap({ side: "port" as const, surfaces: notAContract });
  assert.deepEqual(ofThePort.capture.surfaces, notAContract);
  assert.equal(ofThePort.mapping.replaced, 0);
  assert.equal(isALaunchContract(notAContract.state.entries[0]), false);
  assert.equal(isALaunchContract(asThePortNamesThem(aLaunchContract())), true);
});

test("CT-141-121: a difference the map does not explain is still `different`", () => {
  // The map renames; it never makes two values equal. One changed task text in the
  // port's draft is a difference of the surface, mapped names and all.
  const comparison = compareThem(
    { tree: aLaunchContract({ coverage: [{ rationale: "the task as the reference read it" }] }) },
    {
      tree: asThePortNamesThem(aLaunchContract({ coverage: [{ rationale: "something else" }] })),
    },
  );
  assert.equal(resultOf(comparison.report, "tree"), "different");
  assert.equal(comparison.keyNames.replaced, 1);
  assert.deepEqual(
    (comparison.report.results["tree"]?.differences ?? []).map((d) => d.selector),
    ["coverage/0/rationale"],
  );
});

// ---------------------------------------------------------------------------
// The members of a launch contract the register does not compare
// (DV-061, DV-097; F141-FR-021, F141-FR-023)
// ---------------------------------------------------------------------------

/** The baseline's draft: the five configuration keys no component reads. */
const asTheBaselineWritesIt = (): Record<string, unknown> =>
  aLaunchContract({
    configuration: {
      agent_stream: true,
      color: "auto",
      live_detail: "full",
      specstride_live: true,
      telemetry: { loki: { enabled: false }, otel: { enabled: false } },
    },
  });

/** The product's draft of the same run: F107-FR-024 forbids the five, F107-FR-036 adds one. */
const asTheProductWritesIt = (): Record<string, unknown> =>
  asThePortNamesThem(
    aLaunchContract({ configuration: { verification: { mode: "required", reason: "declared" } } }),
  );

test("CT-141-121: the two rows the dropping is the handling of say the register does not compare them", () => {
  assert.deepEqual([...NOT_COMPARED_ROWS], ["DV-061", "DV-097"]);
  for (const row of NOT_COMPARED_ROWS) {
    const entry = entryOf(row);
    assert.ok(entry !== undefined, `${row} has an entry of the register map`);
    // `no differential test` is the oracle's name for the register's "not compared".
    assert.ok(
      entry.handling.includes("no differential test"),
      `${row} is handled as "no differential test"`,
    );
    assert.match(entry.registerText, /[Nn]ot compared/);
  }
  // Every member carries the written justification the register asks of DV-061.
  for (const member of NOT_COMPARED_MEMBERS) {
    assert.ok(member.justification.length > 40, `${member.path} has a written justification`);
    assert.ok(NOT_COMPARED_ROWS.includes(member.row));
  }
  // The five keys of R19 D-12 are the reference's; the two of DV-097 are the port's.
  assert.equal(FIVE_KEYS_WITH_NO_READER.length, 5);
  assert.deepEqual(
    membersOfSide("reference").map((m) => m.path),
    [...FIVE_KEYS_WITH_NO_READER],
  );
  assert.deepEqual(
    membersOfSide("port")
      .filter((m) => m.row === "DV-097")
      .map((m) => m.path),
    ["configuration.verification", "configuration.comment"],
  );
});

test("CT-141-121: a draft of the product compares `equal` with a draft of the baseline", () => {
  const reference = asTheBaselineWritesIt();
  const port = asTheProductWritesIt();
  // Without the dropping and the key-name map the two differ on eight selectors: the
  // five keys the baseline writes, the verification mode the product writes, and the
  // renamed schema field.
  const raw = differencesOf("FX-32/greeting-ready", "tree", reference, port).map((d) => d.selector);
  assert.deepEqual(raw.sort(), [
    "configuration/agent_stream",
    "configuration/color",
    "configuration/live_detail",
    "configuration/specstride_live",
    "configuration/telemetry",
    "configuration/verification",
    "schema",
    "schema_version",
  ]);
  // With it the surface reads `equal`, and the report says how many members went.
  const comparison = compareThem({ tree: reference }, { tree: port });
  assert.equal(resultOf(comparison.report, "tree"), "equal");
  assert.equal(comparison.notCompared.dropped, 6);
  assert.deepEqual([...comparison.notCompared.rows], [...NOT_COMPARED_ROWS]);
  // Like the key-name map it is the handling of a register row, not a rule of the
  // normalizer, so it is not counted among N-01 to N-29.
  assert.deepEqual(
    Object.keys(comparison.report.replacements).filter((id) => !/^N-[0-9]{2}$/.test(id)),
    [],
  );
});

test("CT-141-121: the dropping acts on the TEXT of a captured draft too", () => {
  const reference = renderLaunchContract(asTheBaselineWritesIt());
  const port = renderLaunchContract(asTheProductWritesIt());
  assert.notEqual(reference, port);
  const comparison = compareThem(
    { tree: { entries: [{ path: "launch-contract.json", content: reference }] } },
    { tree: { entries: [{ path: "launch-contract.json", content: port }] } },
  );
  assert.equal(resultOf(comparison.report, "tree"), "equal");
  assert.equal(comparison.notCompared.dropped, 6);
});

test("CT-141-121: nothing outside the listed members is dropped, and a difference still shows", () => {
  // A member of the port that no row of the register names stays and is compared.
  const comparison = compareThem(
    { tree: asTheBaselineWritesIt() },
    {
      tree: asThePortNamesThem(
        aLaunchContract({ configuration: { verification: { mode: "required" }, invented: 1 } }),
      ),
    },
  );
  assert.equal(resultOf(comparison.report, "tree"), "different");
  assert.deepEqual(
    (comparison.report.results["tree"]?.differences ?? []).map((d) => d.selector),
    ["configuration/invented"],
  );
  // The port's verification mode is not dropped from the REFERENCE's capture, and
  // the five keys are dropped from either side that carries them.
  assert.equal(
    dropNotComparedMembers(
      { configuration: { verification: 1, color: "auto" } } as never,
      "reference",
    ).dropped,
    1,
  );
  assert.equal(
    dropNotComparedMembers({ configuration: { verification: 1, color: "auto" } } as never, "port")
      .dropped,
    2,
  );
  // A record that is not a launch contract keeps every member it has.
  const notAContract = { state: { entries: [{ configuration: { color: "auto" } }] } };
  const untouched = applyNotCompared({ side: "port" as const, surfaces: notAContract });
  assert.deepEqual(untouched.capture.surfaces, notAContract);
  assert.equal(untouched.drop.dropped, 0);
});
