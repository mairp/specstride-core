/**
 * T083 — one classifier fixture per tested harness that has a captured limit
 * signal, from the captures of T001, with the rest marked `unverified`
 * (F127-FR-002).
 *
 * The captures of T001 are recorded in `./captures.md`: **none of the five
 * Wave 1 harnesses has a captured limit signal**, because every one of the
 * five captures is a paid, live, person-run step that belongs to an adapter
 * feature. So the honest outcome of this task is:
 *
 *  - zero fixtures built from a capture, and all five tested harnesses marked
 *    `unverified` in `./classifier-fixtures/manifest.json`, each naming the
 *    capture that would close it;
 *  - the marking is not a claim but a reading: this test looks at the five
 *    adapter packages, the same way `./captures.test.ts` does, so that the day
 *    a capture lands the test FAILS and asks for the fixture;
 *  - one fixture for the one limit signal that does exist today — the one
 *    DECLARED AS DATA by the fake-harness descriptor of T082 — so the fixture
 *    format is exercised rather than merely described. That harness is
 *    `declared`, never `tested`, and the fixture claims no provider fact.
 *
 * Every case of a fixture is run through the default classifier and every
 * field F127-FR-002 names is checked: the class, the confidence, `resetsAt`,
 * the source of `resetsAt`, `retryable`, the rate-limit type, the utilization
 * and a fragment of the evidence that has passed the redactor — together with
 * the evidence order of §Q.2 and the rule that a time read from text is used
 * only where no structured and no header value exists.
 *
 * It reads no clock and makes no call.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CLASSES, CONFIDENCES } from "@specstride/contracts/ep/quota-classifier";
import { classify, RESET_SOURCES, type QuotaClassifyInput } from "../src/quota/classify.ts";
import { VERIFIED_STATE } from "@specstride/contracts/records/harness-descriptor";
import { testPorts } from "./support/index.ts";

const TEST_ROOT = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(TEST_ROOT, "..");
const REPOSITORY_ROOT = join(PACKAGE_ROOT, "..", "..");
const FIXTURES = join(TEST_ROOT, "classifier-fixtures");

/** A redactor, so that the evidence is proven to have passed one. */
const fakeRedact = (text: string, cap: number) => ({
  text: text.replace(/sk-[A-Za-z0-9]+/g, "[REDACTED]").slice(0, cap),
  replacements: 0,
  patternSetVersion: "test",
});

type ManifestHarness = {
  readonly harness: string;
  readonly adapterFeature: string;
  readonly adapterPackage: string;
  readonly capture: string;
  readonly status: string;
  readonly fixture: string | null;
  readonly reason: string;
};

type ManifestFixture = {
  readonly harness: string;
  readonly file: string;
  readonly harnessState: string;
  readonly signalSource: string;
  readonly capture: string | null;
  readonly note: string;
};

type Manifest = {
  readonly schema: string;
  readonly task: string;
  readonly proves: string;
  readonly capturesRecord: string;
  readonly rule: string;
  readonly testedHarnesses: readonly ManifestHarness[];
  readonly fixtures: readonly ManifestFixture[];
  readonly countOfTestedHarnesses: number;
  readonly countOfTestedHarnessesWithACapture: number;
  readonly countOfFixturesFromACapture: number;
  readonly countOfFixtures: number;
};

type FixtureCase = {
  readonly id: string;
  readonly title: string;
  readonly seen: QuotaClassifyInput;
  readonly expect: {
    readonly quotaClass: string;
    readonly confidence: string;
    readonly ruleId: string;
    readonly resetsAt: string | null;
    readonly resetsAtSource: string | null;
    readonly retryable: boolean;
    readonly rateLimitType: string | null;
    readonly utilization: number | null;
    readonly evidenceIsCarried: boolean;
    readonly evidenceMustNotHold?: string;
  };
};

type Fixture = {
  readonly schema: string;
  readonly harness: string;
  readonly harnessState: string;
  readonly signalSource: string;
  readonly declaredBy: string;
  readonly capture: string | null;
  readonly note: string;
  readonly cases: readonly FixtureCase[];
};

/**
 * Whether a directory holds a LANDED capture: a captured artifact (a
 * `stream*.jsonl` stream or an `exit-code*.txt` record) or a `capture.json`
 * that says the capture was made. A non-empty directory that holds only the
 * scaffolding of a not-yet-made capture (`capture.json` with
 * `status: "unverified"`, `result: "not made"`, plus its procedure and
 * README) is NOT a capture, and must not ask for a fixture.
 */
export function hasLandedCapture(base: string): boolean {
  if (!existsSync(base) || !statSync(base).isDirectory()) return false;
  for (const name of readdirSync(base)) {
    const path = join(base, name);
    const stats = statSync(path);
    if (stats.isFile() && (/^stream.*\.jsonl$/.test(name) || /^exit-code.*\.txt$/.test(name)))
      return true;
    if (stats.isDirectory()) {
      if (hasLandedCapture(path)) return true;
      const meta = join(path, "capture.json");
      if (existsSync(meta)) {
        try {
          const parsed = JSON.parse(readFileSync(meta, "utf8")) as {
            made?: unknown;
            result?: unknown;
          };
          if (parsed.made === true || parsed.result === "made") return true;
        } catch {
          // A malformed record is not proof of a capture.
        }
      }
    }
  }
  return false;
}

/**
 * The capture trees a package holds. An empty list is "no capture exists"; a
 * non-empty one is a capture that now owes a classifier fixture. The negative
 * case below runs this over a tree that DOES hold a capture, so that the
 * `unverified` marking of the manifest is falsifiable and not a tautology.
 */
export function captureTreesUnder(directory: string): readonly string[] {
  return Object.freeze(
    ["fixtures", "captures", "data"].filter((sub) => hasLandedCapture(join(directory, sub))),
  );
}

const manifest = JSON.parse(readFileSync(join(FIXTURES, "manifest.json"), "utf8")) as Manifest;

/** The record of T001 this manifest must agree with. */
const capturesRecord = readFileSync(join(TEST_ROOT, "captures.md"), "utf8");

test("T083: the manifest names the five tested harnesses and the capture of each", () => {
  assert.equal(manifest.schema, "specstride.classifier-fixture-manifest/1-of-T083");
  assert.equal(manifest.task, "T083");
  assert.equal(manifest.proves, "F127-FR-002");
  assert.equal(manifest.capturesRecord, "packages/policy/test/captures.md");
  assert.ok(existsSync(join(REPOSITORY_ROOT, manifest.capturesRecord)));

  assert.deepEqual(
    manifest.testedHarnesses.map((one) => one.harness),
    ["Claude CLI stream", "dsh", "Codex", "pi", "prime"],
  );
  assert.equal(manifest.testedHarnesses.length, manifest.countOfTestedHarnesses);
  for (const one of manifest.testedHarnesses) {
    // The record of T001 names the same harness, feature and capture.
    const line = capturesRecord.split("\n").find((l) => l.startsWith(`| ${one.harness} |`));
    assert.ok(line, `captures.md names the harness ${one.harness}`);
    assert.ok(
      line.includes(`| ${one.adapterFeature} |`),
      `captures.md gives ${one.harness} the adapter feature ${one.adapterFeature}`,
    );
    assert.ok(
      line.includes(one.capture),
      `captures.md names ${one.capture} as the capture of ${one.harness}`,
    );
  }
});

test("T083: every tested harness without a capture is marked `unverified` and has no fixture", () => {
  for (const one of manifest.testedHarnesses) {
    assert.equal(one.status, "unverified", `${one.harness} is marked unverified`);
    assert.equal(one.fixture, null, `${one.harness} has no fixture`);
    assert.ok(one.reason.length > 0, `${one.harness} gives the reason`);
  }
  assert.equal(manifest.countOfTestedHarnessesWithACapture, 0);
  assert.equal(manifest.countOfFixturesFromACapture, 0);
  // And so no fixture of the tree claims a capture.
  for (const one of manifest.fixtures) {
    assert.equal(one.capture, null, `the fixture of ${one.harness} claims no capture`);
    assert.notEqual(
      one.harnessState,
      VERIFIED_STATE,
      `the fixture of ${one.harness} does not claim the state \`${VERIFIED_STATE}\``,
    );
  }
});

test("T083: the marking is read from the adapter packages, not asserted", () => {
  // The same reading as `captures.test.ts`. When a capture lands, this fails
  // and the fixture of that harness is then owed.
  const withACapture: string[] = [];
  for (const one of manifest.testedHarnesses) {
    const directory = join(REPOSITORY_ROOT, one.adapterPackage);
    assert.ok(existsSync(directory), `${one.adapterPackage} exists`);
    const held = captureTreesUnder(directory);
    if (held.length > 0)
      withACapture.push(`${one.harness}: ${one.adapterPackage}/${held.join(", ")}`);
  }
  assert.deepEqual(
    withACapture,
    [],
    "no adapter package holds a capture tree, so the manifest's `unverified` is the fact; " +
      "if a capture has landed, add the classifier fixture of that harness and mark it here",
  );
  assert.equal(
    manifest.countOfTestedHarnessesWithACapture,
    withACapture.length,
    "the count of the manifest is the count that was read",
  );
});

test("T083: the manifest and the fixture files of the tree are the same set", () => {
  const onDisk = readdirSync(FIXTURES)
    .filter((name) => name.endsWith(".fixture.json"))
    .sort();
  assert.deepEqual(
    onDisk,
    manifest.fixtures.map((one) => one.file).sort(),
    "every fixture file of the directory is named in the manifest, and no other",
  );
  assert.equal(manifest.fixtures.length, manifest.countOfFixtures);
});

/* ------------------------------------------------------------------ *
 * F127-FR-002 — every field of a classification, over every fixture.
 * ------------------------------------------------------------------ */

for (const entry of manifest.fixtures) {
  const fixture = JSON.parse(readFileSync(join(FIXTURES, entry.file), "utf8")) as Fixture;

  test(`T083: the fixture of ${entry.harness} declares what it is, and no provider fact`, () => {
    assert.equal(fixture.schema, "specstride.classifier-fixture/1-of-T083");
    assert.equal(fixture.harness, entry.harness);
    assert.equal(fixture.harnessState, entry.harnessState);
    assert.equal(fixture.signalSource, entry.signalSource);
    assert.equal(fixture.capture, null);
    assert.notEqual(fixture.harnessState, VERIFIED_STATE);
    assert.ok(
      existsSync(join(REPOSITORY_ROOT, fixture.declaredBy)),
      `the data that declares the signal exists: ${fixture.declaredBy}`,
    );
    assert.ok(fixture.cases.length >= 10, `${fixture.cases.length} cases`);
  });

  test(`T083: every case of ${entry.harness} carries every field F127-FR-002 names`, () => {
    const ports = testPorts();
    const before = ports.clock.nowMs();
    for (const one of fixture.cases) {
      const got = classify(one.seen, { redact: fakeRedact });

      // The closed sets of the class and the confidence.
      assert.ok(CLASSES.includes(got.quotaClass), `${one.id}: the class is a member of §Q.1`);
      assert.ok(
        CONFIDENCES.includes(got.confidence),
        `${one.id}: the confidence is a member of §Q.2`,
      );

      // Every field the requirement names, against the fixture.
      assert.equal(got.quotaClass, one.expect.quotaClass, `${one.id}: class`);
      assert.equal(got.confidence, one.expect.confidence, `${one.id}: confidence`);
      assert.equal(got.ruleId, one.expect.ruleId, `${one.id}: rule id`);
      assert.equal(got.resetsAt, one.expect.resetsAt, `${one.id}: resetsAt`);
      assert.equal(got.resetsAtSource, one.expect.resetsAtSource, `${one.id}: source of resetsAt`);
      assert.equal(got.retryable, one.expect.retryable, `${one.id}: retryable`);
      assert.equal(got.rateLimitType, one.expect.rateLimitType, `${one.id}: rate-limit type`);
      assert.equal(got.utilization, one.expect.utilization, `${one.id}: utilization`);
      assert.ok(
        got.resetsAtSource === null ||
          (RESET_SOURCES as readonly string[]).includes(got.resetsAtSource),
        `${one.id}: the source of resetsAt is a member of row 207, or null`,
      );
      assert.equal(typeof got.tableVersion, "string", `${one.id}: the table version is recorded`);
      assert.equal(got.failed, false, `${one.id}: the classifier did not fail`);

      // The evidence fragment, and the redactor it passed through.
      if (one.expect.evidenceIsCarried) {
        assert.equal(typeof got.evidence, "string", `${one.id}: an evidence fragment is carried`);
        assert.equal(got.evidenceDropped, null, `${one.id}: the evidence was not dropped`);
        if (one.expect.evidenceMustNotHold !== undefined) {
          assert.ok(
            !(got.evidence ?? "").includes(one.expect.evidenceMustNotHold),
            `${one.id}: the evidence passed the redactor`,
          );
        }
      } else {
        assert.equal(got.evidence, null, `${one.id}: no evidence to carry`);
      }
    }
    // §C.13, IS_PURE: the classifier read no clock while the fixture ran.
    assert.equal(ports.clock.nowMs(), before, "the fixture run moved no clock");
  });

  test(`T083: the evidence order of §Q.2 holds over the fixture of ${entry.harness}`, () => {
    const byId = new Map(fixture.cases.map((one) => [one.id, one]));

    // A structured record outranks a status and a text, and a status outranks
    // a text; the stall watchdog is the weakest.
    const structured = byId.get("FX-127-083-01");
    assert.ok(structured, "the fixture holds the case of a structured record");
    assert.equal(structured.expect.confidence, "structured");
    assert.ok(structured.seen.status !== undefined, "with a status present too");
    assert.ok(structured.seen.errorText !== undefined, "and a text present too");

    const status = byId.get("FX-127-083-02");
    assert.ok(status, "the fixture holds the case of a status");
    assert.equal(status.expect.confidence, "status");
    assert.ok(status.seen.errorText !== undefined, "with a text present too");

    const stall = byId.get("FX-127-083-04");
    assert.ok(stall, "the fixture holds the case of the stall watchdog");
    assert.equal(stall.expect.confidence, "stall");

    // F127-FR-002 — a time read from text is used ONLY where no structured
    // and no header value exists. The three cases prove the three outcomes.
    assert.equal(structured.expect.resetsAtSource, "structured");
    assert.equal(status.expect.resetsAtSource, "header");
    const text = byId.get("FX-127-083-03");
    assert.ok(text, "the fixture holds the case of a time read from text");
    assert.equal(text.expect.resetsAtSource, "parsed_text");
    assert.equal(text.seen.resetsAt?.structured, undefined);
    assert.equal(text.seen.resetsAt?.header, undefined);

    // And the classifier really does what the fixture says, with the stronger
    // candidates removed one at a time from the same input.
    const seen = structured.seen;
    assert.equal(classify(seen, { redact: fakeRedact }).resetsAtSource, "structured");
    assert.equal(
      classify({ ...seen, resetsAt: { header: "H", parsedText: "T" } }, { redact: fakeRedact })
        .resetsAtSource,
      "header",
    );
    assert.equal(
      classify({ ...seen, resetsAt: { parsedText: "T" } }, { redact: fakeRedact }).resetsAtSource,
      "parsed_text",
    );
  });
}

test("T083: the reading that marks a harness `unverified` fires on a capture (negative case)", () => {
  // A tree that holds a capture, built for this case alone. The reading must
  // report it; were it blind, the five `unverified` rows above would be a
  // tautology rather than a fact.
  const tree = mkdtempSync(join(tmpdir(), "specstride-127-capture-"));
  assert.deepEqual([...captureTreesUnder(tree)], [], "an empty package holds no capture");

  mkdirSync(join(tree, "captures"), { recursive: true });
  assert.deepEqual(
    [...captureTreesUnder(tree)],
    [],
    "an empty `captures` directory is still no capture",
  );

  // Scaffolding of a capture that was not made is still no capture.
  writeFileSync(
    join(tree, "captures", "capture.json"),
    JSON.stringify({ status: "unverified", result: "not made", made: false }, null, 2) + "\n",
  );
  writeFileSync(join(tree, "captures", "procedure.sh"), "# not run here\n");
  assert.deepEqual(
    [...captureTreesUnder(tree)],
    [],
    "the scaffolding of a not-made capture is not a capture",
  );

  writeFileSync(
    join(tree, "captures", "stream-a-limit-event.jsonl"),
    '{"type":"limit","scope":"session"}\n',
  );
  assert.deepEqual(
    [...captureTreesUnder(tree)],
    ["captures"],
    "a captured stream in the tree is reported, and a fixture is then owed",
  );
  rmSync(tree, { recursive: true, force: true });
});
