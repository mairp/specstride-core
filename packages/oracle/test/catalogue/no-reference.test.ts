/**
 * T019 — CT-141-128: behaviour with no reference (F141-FR-028, §O.7).
 *
 * The subject is the §O.7 half of `packages/oracle/src/catalogue/declarations.ts`:
 *
 * - a parity test of **pi** is refused: pi has no as-is behaviour and no
 *   reference, so no fixture family names its stub;
 * - a parity test of a **harness without a tested harness adapter** is refused:
 *   the reference has no behaviour for it;
 * - a parity test of a **Lisa behaviour** is refused: Lisa has no pin and no
 *   reference run in the oracle;
 * - what is offered instead is named: the generic stub `stub-harness` and the pi
 *   stub `pi`, the characterization tests of feature 134, the conformance suite
 *   of the harness port, and the two scenarios `FX-01/harness-generic` and
 *   `FX-26/generic-text` that prove the registry half.
 *
 * Every list in this test comes out of the data (`data/stub-vocabulary.json`,
 * `reference/pins.json`), so a harness that gains or loses as-is behaviour
 * changes the verdict here with no edit to this file.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  DeclarationError,
  REGISTRY_SCENARIOS,
  SYSTEMS_WITH_NO_REFERENCE,
  assertNotAParityTestOfABehaviourWithNoReference,
  behaviourWithNoReference,
  genericStubName,
  harnessesWithATestedAdapter,
  harnessesWithNoReference,
  noReferenceSubject,
  piStubName,
} from "../../src/catalogue/declarations.ts";
import { citationHoldsUp, resolveCitation, stubsOf } from "../../src/catalogue/catalogue.ts";
import { LISA, SYSTEMS_WITHOUT_A_PIN, hasPin, pins } from "../../src/reference/pins.ts";

test("CT-141-128: which harnesses have a reference, and which have none", () => {
  const tested = harnessesWithATestedAdapter();
  assert.deepEqual([...tested], ["claude", "dsh", "codex", "prime"]);
  const withoutAReference = harnessesWithNoReference();
  assert.deepEqual([...withoutAReference], ["pi"]);
  // The generic stub is not a harness: it is what a declared-only harness is
  // driven with.
  assert.ok(!tested.includes("generic"));
  assert.ok(!withoutAReference.includes("generic"));
  assert.equal(genericStubName(), "stub-harness");
  assert.equal(piStubName(), "pi");

  // No fixture family names the pi stub (§O.3, "Port side only").
  for (const id of ["FX-01", "FX-06", "FX-26", "FX-39"]) {
    assert.ok(!stubsOf(id).includes("pi"), `${id} names no pi stub`);
  }

  // Lisa has no pin and therefore no reference run.
  assert.deepEqual([...SYSTEMS_WITH_NO_REFERENCE], [...SYSTEMS_WITHOUT_A_PIN]);
  assert.ok(SYSTEMS_WITH_NO_REFERENCE.includes(LISA));
  assert.equal(hasPin(LISA), false);
  assert.ok(!pins.some((p) => p.system === LISA));
});

test("CT-141-128: a parity test of pi is refused, and the pi stub is offered", () => {
  const offered = noReferenceSubject("pi");
  assert.ok(offered !== undefined);
  assert.equal(offered.subject, "pi");
  assert.equal(offered.parityTest, false);
  assert.match(offered.why, /no as-is behaviour and no reference/);
  assert.ok(offered.stubs.includes("pi"), "the pi stub is offered");
  assert.ok(offered.stubs.includes("stub-harness"), "the generic stub is offered too");
  assert.ok(
    offered.instead.some((i) => /CT-134-<n>/.test(i)),
    "the characterization tests of feature 134 are named",
  );
  assert.ok(
    offered.instead.some((i) => /conformance suite of the harness port/.test(i)),
    "the conformance suite is named",
  );
  assert.deepEqual([...offered.scenarios], [...REGISTRY_SCENARIOS]);

  // The refusal itself, for a test that declares it is a parity test of pi.
  assert.throws(
    () =>
      assertNotAParityTestOfABehaviourWithNoReference("PT-134-C-001-pi-stream", "the pi harness"),
    (error: unknown) => {
      assert.ok(error instanceof DeclarationError);
      assert.match(
        (error as Error).message,
        /declares itself a parity test of pi, and there is none/,
      );
      assert.match((error as Error).message, /Offered instead/);
      assert.match((error as Error).message, /stub-harness/);
      return true;
    },
  );
  // The word is matched, not a substring: `pipeline` is not pi.
  assert.equal(noReferenceSubject("the pipeline runtime"), undefined);
  assert.equal(noReferenceSubject("api keys"), undefined);
});

test("CT-141-128: a parity test of a harness without a tested harness adapter is refused", () => {
  for (const name of ["aider", "cursor", "gemini"]) {
    const offered = noReferenceSubject(`the harness ${name}`);
    assert.ok(offered !== undefined, name);
    assert.equal(offered.subject, name);
    assert.equal(offered.parityTest, false);
    assert.match(offered.why, /no tested harness adapter/);
    assert.ok(offered.stubs.includes("stub-harness"), "the generic stub is offered");
    assert.ok(
      offered.instead.some((i) => /EP-02/.test(i) && /harness descriptor of the fixture/.test(i)),
      "the conformance suite of the harness port with a descriptor is named",
    );
    assert.deepEqual([...offered.scenarios], [...REGISTRY_SCENARIOS]);
    assert.throws(
      () =>
        assertNotAParityTestOfABehaviourWithNoReference(
          `PT-146-C-001-${name}`,
          `the harness ${name}`,
        ),
      DeclarationError,
    );
  }
  // A harness that DOES have a tested adapter is not refused.
  for (const name of harnessesWithATestedAdapter()) {
    assert.equal(noReferenceSubject(`the harness ${name}`), undefined, name);
    assert.doesNotThrow(() =>
      assertNotAParityTestOfABehaviourWithNoReference(
        `PT-125-C-001-${name}`,
        `the harness ${name}`,
      ),
    );
  }
});

test("CT-141-128: a parity test of a Lisa behaviour is refused", () => {
  const offered = noReferenceSubject(`a kept ${LISA} behaviour`);
  assert.ok(offered !== undefined);
  assert.equal(offered.subject, LISA);
  assert.equal(offered.parityTest, false);
  assert.match(offered.why, /no reference run in the oracle/);
  assert.match(offered.why, /it has no pin/);
  assert.deepEqual(
    [...offered.instead],
    ["a characterization test in the feature that keeps the behaviour"],
  );
  assert.deepEqual([...offered.scenarios], [], "no scenario proves a Lisa behaviour");
  assert.throws(
    () =>
      assertNotAParityTestOfABehaviourWithNoReference(
        "PT-115-C-001-layer",
        `a kept ${LISA} behaviour`,
      ),
    /declares itself a parity test of lisa/i,
  );
});

test("CT-141-128: the two scenarios §O.7 offers are scenarios of the catalogue", () => {
  for (const citation of REGISTRY_SCENARIOS) {
    assert.equal(citationHoldsUp(citation), true, citation);
    const resolved = resolveCitation(citation);
    assert.equal(resolved.scenarios.length, 1);
  }
  assert.deepEqual([...REGISTRY_SCENARIOS], ["FX-01/harness-generic", "FX-26/generic-text"]);
  // Both are driven by the generic stub, which is what makes them the registry
  // half rather than a parity test of a harness.
  assert.ok(stubsOf("FX-26").includes("generic"), "FX-26 drives the generic stub");
});

test("CT-141-128: §O.7 as a whole, as the citing page publishes it", () => {
  const rows = behaviourWithNoReference();
  assert.ok(rows.length >= 3, `${rows.length} rows of §O.7`);
  const subjects = rows.map((r) => r.subject);
  assert.ok(subjects.includes("pi"));
  assert.ok(subjects.includes(LISA));
  for (const row of rows) {
    assert.equal(row.parityTest, false, `${row.subject} has no parity test`);
    assert.ok(row.why.length > 0, `${row.subject} says why`);
    assert.ok(row.instead.length > 0, `${row.subject} names what it has instead`);
    assert.ok(row.stubs.length > 0, `${row.subject} names the stub to use`);
  }
});
