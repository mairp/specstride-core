/**
 * T041 — CT-111-123, CT-111-124 and CT-111-129: one ingress, fail closed with a
 * mark, and the widened pattern set (F111-FR-023, F111-FR-024, F111-FR-029).
 *
 * F111-FR-023: *Text from outside the runtime ... MUST enter through one ingress
 * with a class from the closed set ..., where it is redacted first and cut
 * second. `original_bytes` MUST be measured before redaction. Every sink, every
 * prompt and every record MUST receive only the result. No code outside the
 * ingress MUST redact.*
 *
 * F111-FR-024: *The redaction point MUST fail closed. When the redactor cannot
 * run, or its pattern set is invalid, the content MUST be dropped, the record
 * MUST say so by a mark of the closed set ..., and the reference MUST be
 * delivered in its place. A sink MUST never see the unredacted text.*
 *
 * F111-FR-029: *The pattern set of the redactor MUST be wider than the
 * baseline's and MUST contain it. It MUST be versioned data with the fields of
 * annex X §X.4. Key names MUST match as a suffix or a substring ... Value
 * patterns MUST cover private-key blocks, signed tokens, access key ids of
 * clouds, addresses with embedded credentials and the prefixes of provider keys.
 * The version of the set MUST be recorded in the run record and MUST change with
 * every change of the set. On the fixtures of the oracle, no text MUST match a
 * pattern that the baseline set does not match.*
 *
 * "No code outside the ingress redacts" is checked MECHANICALLY and not by
 * reading: `redactionOutsideTheIngress` walks every `src/` of the workspace for
 * the redaction primitives and the placeholder literal, and the test fails on a
 * file that is not the redactor's own folder or the ingress.
 */
import { test } from "node:test";
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
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isRunRecord } from "@specstride/contracts/records/run-record";
import { FIELDS_THE_REQUIREMENT_NAMES } from "@specstride/contracts/records/run-record";
import { closedSet } from "@specstride/contracts/enums/all-sets";
import { isRedactionPatternSet } from "@specstride/contracts/ep/redactor";
import {
  DROP_MARKS,
  REDACTION_PLACEHOLDER,
  SecretRegistry,
  createRedactor,
  type SpecstrideRedactor,
} from "@specstride/kernel";
import {
  BASELINE_SET_FILE,
  WIDENED_SET_FILE,
  compilePattern,
  expectedVersionOf,
  loadBaselinePatternSet,
  loadPatternSetFrom,
  loadWidenedPatternSet,
  patternSetVersionOf,
  readPatternSetFile,
  widenedContainsBaseline,
  widenedOnlyPatterns,
} from "@specstride/kernel/redactor/patterns";
import {
  REDACTION_DROPPED_EVENT_TYPE,
  Ingress,
  REDACTION_ALLOWED_IN,
  REDACTION_PRIMITIVES,
  redactionOutsideTheIngress,
} from "../src/ingress/ingress.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..", "..");

const REFERENCE = Object.freeze({
  logicalName: "pass:p1:transcript",
  hash: "f".repeat(64),
  size: 1234,
});

/* ------------------------------------------------------------------ *
 * CT-111-123 — ONE ingress.
 * ------------------------------------------------------------------ */

test("CT-111-123: the class of a text is a member of the closed set of row 89", () => {
  const members = closedSet(89)?.members ?? [];
  assert.equal(members.length, 9);
  const ingress = new Ingress({ redactor: createRedactor() });
  for (const member of members) {
    const result = ingress.text("plain text", member);
    assert.equal(result.ok, true, member);
    if (result.ok) assert.equal(result.ingressClass, member);
  }
});

test("CT-111-123: a class outside the set is treated as `free-text` (row 89's rule)", () => {
  const ingress = new Ingress({ redactor: createRedactor() });
  const result = ingress.text("plain text", "not-a-class");
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.ingressClass, "free-text");
});

test("CT-111-123: `original_bytes` is measured BEFORE redaction", () => {
  const ingress = new Ingress({ redactor: createRedactor() });
  const text = "bearer abcdefgh12345678";
  const result = ingress.text(text, "stream-text");
  assert.ok(result.ok);
  assert.equal(result.original_bytes, Buffer.byteLength(text, "utf8"));
  assert.equal(result.retained_bytes, Buffer.byteLength(result.text, "utf8"));
  assert.ok(result.original_bytes > result.retained_bytes);
});

test("CT-111-123: redacted FIRST, cut SECOND", () => {
  const ingress = new Ingress({
    redactor: createRedactor(),
    limits: { textMaxBytes: 20 },
  });
  const result = ingress.text("prefix bearer abcdefghIJKLMNOP tail", "stream-text");
  assert.ok(result.ok);
  assert.ok(!result.text.includes("abcdefgh"), result.text);
  assert.ok(result.text.includes(REDACTION_PLACEHOLDER), result.text);
  assert.equal(result.truncated, true);
});

test("CT-111-123: the text is cut to the cap of ITS class, not of another", () => {
  const ingress = new Ingress({ redactor: createRedactor() });
  const long = "a".repeat(5000);
  const stream = ingress.text(long, "stream-text");
  const diagnostic = ingress.text(long, "diagnostic");
  const target = ingress.text(long, "target");
  assert.ok(stream.ok && diagnostic.ok && target.ok);
  assert.equal(stream.retained_bytes, 4096);
  assert.equal(diagnostic.retained_bytes, 1024);
  assert.equal(target.retained_bytes, 512);
});

test("CT-111-123: NO CODE OUTSIDE THE INGRESS REDACTS — checked over every `src/`", () => {
  const findings = redactionOutsideTheIngress(ROOT);
  assert.deepEqual([...findings], [], findings.join("\n"));
  // The check is not vacuous: it names the primitives it looks for, and each
  // of them is found where it IS allowed.
  assert.ok(REDACTION_PRIMITIVES.length >= 4, REDACTION_PRIMITIVES.join(", "));
  assert.ok(REDACTION_ALLOWED_IN.length >= 2, REDACTION_ALLOWED_IN.join(", "));
  const redactorSource = readFileSync(join(ROOT, "packages/kernel/src/redactor/rules.ts"), "utf8");
  assert.ok(redactorSource.includes(REDACTION_PLACEHOLDER));
});

test("CT-111-123: the check FAILS on a file that redacts outside the ingress", () => {
  // The negative control of the check above: a tree whose `src/` holds a file
  // that names a redaction primitive outside the two allowed folders. The tree
  // is built here rather than committed, so that the workspace never carries a
  // file whose whole purpose is to break the rule.
  const tree = mkdtempSync(join(tmpdir(), "ct-111-123-"));
  try {
    const leaky = join(tree, "packages", "leaky", "src");
    mkdirSync(leaky, { recursive: true });
    writeFileSync(join(leaky, "leak.ts"), 'export const mine = "[REDACTED]";\n');
    const findings = redactionOutsideTheIngress(tree);
    assert.equal(findings.length, 1, findings.join("\n"));
    assert.match(findings[0] as string, /redacts outside the ingress/);
    assert.match(findings[0] as string, /leak\.ts/);
  } finally {
    rmSync(tree, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------------ *
 * CT-111-124 — fail closed, with a mark.
 * ------------------------------------------------------------------ */

/** A redactor that cannot run: every call throws. */
const brokenRedactor: SpecstrideRedactor = Object.freeze({
  patternSetVersion: "",
  unavailable: undefined,
  registry: new SecretRegistry(),
  values: Object.freeze([]),
  register(): void {
    throw new Error("the redactor cannot run");
  },
  redact(): never {
    throw new Error("the redactor cannot run");
  },
  redactSource(): never {
    throw new Error("the redactor cannot run");
  },
  redactValue(): never {
    throw new Error("the redactor cannot run");
  },
});

test("CT-111-124: the two marks are the closed set of row 90", () => {
  assert.deepEqual([...DROP_MARKS], ["redactor-unavailable", "pattern-set-invalid"]);
  assert.deepEqual(closedSet(90)?.members, [...DROP_MARKS]);
});

test("CT-111-124: a redactor that cannot run drops the content, with the mark", () => {
  const ingress = new Ingress({ redactor: brokenRedactor });
  const result = ingress.text("bearer abcdefgh12345678", "stream-text", REFERENCE);
  assert.equal(result.ok, false);
  assert.ok(!result.ok);
  assert.equal(result.dropped, true);
  assert.equal(result.mark, "redactor-unavailable");
  // The dropped result has NO `text` field at all: on the failure path there is
  // nothing a caller could mistake for the content.
  assert.equal(Object.hasOwn(result, "text"), false, JSON.stringify(result));
  // THE REFERENCE IS DELIVERED IN ITS PLACE.
  assert.deepEqual(result.reference, REFERENCE);
});

test("CT-111-124: an invalid pattern set is a redactor that cannot run, with its own mark", () => {
  const invalid = createRedactor({ patternSet: { schema: "specstride.redaction/1" } });
  const ingress = new Ingress({ redactor: invalid });
  const result = ingress.text("bearer abcdefgh12345678", "stream-text", REFERENCE);
  assert.ok(!result.ok);
  assert.equal(result.mark, "pattern-set-invalid");
  assert.deepEqual(result.reference, REFERENCE);
});

test("CT-111-124: the record says so — `redaction.dropped` with the class, mark and count", () => {
  const ingress = new Ingress({ redactor: brokenRedactor });
  const first = ingress.text("secret", "critic-reply", REFERENCE);
  assert.ok(!first.ok);
  assert.equal(first.event.type, REDACTION_DROPPED_EVENT_TYPE);
  assert.deepEqual(first.event.data, {
    ingressClass: "critic-reply",
    mark: "redactor-unavailable",
    count: 1,
  });
  const second = ingress.text("more", "comment", REFERENCE);
  assert.ok(!second.ok);
  assert.equal(second.event.data.count, 2, "the count rises with every drop");
});

test("CT-111-124: A SINK NEVER SEES THE UNREDACTED TEXT when the redactor cannot run", () => {
  const ingress = new Ingress({ redactor: brokenRedactor });
  const seen: string[] = [];
  const text = "bearer abcdefgh12345678";
  const result = ingress.text(text, "stream-text", REFERENCE);
  // Whatever the ingress hands on is what a sink can see: nothing else exists.
  if (result.ok) seen.push(result.text);
  else seen.push(JSON.stringify({ reference: result.reference, event: result.event }));
  for (const item of seen) {
    assert.ok(!item.includes("abcdefgh12345678"), item);
    assert.ok(!item.includes("bearer abcdefgh"), item);
  }
});

test("CT-111-124: a value (not text) fails closed in the same way", () => {
  const ingress = new Ingress({ redactor: brokenRedactor });
  const result = ingress.value({ api_key: "sekritvalue" }, "tool-arguments", REFERENCE);
  assert.ok(!result.ok);
  assert.equal(result.mark, "redactor-unavailable");
  assert.ok(!JSON.stringify(result).includes("sekritvalue"));
});

test("CT-111-124: a tool argument fails closed and no summary is produced", () => {
  const ingress = new Ingress({ redactor: brokenRedactor });
  const result = ingress.toolArgument(
    { command: "cat src/a.ts", api_key: "sekritvalue" },
    REFERENCE,
  );
  assert.ok(!result.ok);
  assert.equal(result.mark, "redactor-unavailable");
  assert.ok(!JSON.stringify(result).includes("sekritvalue"));
});

/* ------------------------------------------------------------------ *
 * CT-111-129 — the widened pattern set.
 * ------------------------------------------------------------------ */

test("CT-111-129: both sets are versioned data with the fields of annex X §X.4", () => {
  for (const file of [BASELINE_SET_FILE, WIDENED_SET_FILE]) {
    const read = readPatternSetFile(file);
    assert.ok(read.ok, JSON.stringify(read));
    assert.ok(isRedactionPatternSet(read.loaded.set), file);
    assert.deepEqual(Object.keys(read.loaded.set).sort(), [
      "keyNames",
      "schema",
      "values",
      "version",
    ]);
    assert.equal(read.loaded.set.schema, "specstride.redaction/1");
  }
});

test("CT-111-129: THE WIDENED SET CONTAINS THE BASELINE", () => {
  const contains = widenedContainsBaseline();
  assert.deepEqual([...contains.missing], [], contains.missing.join("\n"));
  assert.equal(contains.contains, true);
  const baseline = loadBaselinePatternSet();
  const widened = loadWidenedPatternSet();
  assert.ok(baseline.ok && widened.ok);
  assert.ok(
    widened.loaded.values.length > baseline.loaded.values.length,
    "the widened set is WIDER than the baseline's",
  );
  assert.ok(widened.loaded.keyNames.length > baseline.loaded.keyNames.length);
});

test("CT-111-129: the value patterns cover the five classes of §X.4", () => {
  const widened = loadWidenedPatternSet();
  assert.ok(widened.ok);
  const covered = new Set(widened.loaded.values.map((entry) => entry.covers));
  for (const klass of [
    "private-key blocks",
    "signed tokens",
    "access key ids of clouds",
    "addresses with embedded credentials",
    "prefixes of provider keys",
  ]) {
    assert.ok(covered.has(klass), `${klass} is covered; covered: ${[...covered].join(", ")}`);
  }
});

test("CT-111-129: key names match as a suffix or a substring", () => {
  const redactor = createRedactor();
  for (const key of ["session_token", "deploy_key", "stripe_secret", "my_password_here"]) {
    const out = redactor.redactValue({ [key]: "a-real-looking-value" });
    assert.equal(
      (out.value as Record<string, unknown>)[key],
      REDACTION_PLACEHOLDER,
      `${key} matched as a suffix or a substring`,
    );
  }
  // Negative control: a key that none of the four forms reaches.
  const kept = redactor.redactValue({ tokenizer: "a-real-looking-value" });
  assert.equal((kept.value as Record<string, unknown>)["tokenizer"], "a-real-looking-value");
});

test("CT-111-129: the version is recorded in the run record", () => {
  const widened = loadWidenedPatternSet();
  assert.ok(widened.ok);
  const version = patternSetVersionOf(widened.loaded);
  assert.equal(typeof version, "string");
  assert.ok(version.length > 0);
  assert.ok((FIELDS_THE_REQUIREMENT_NAMES as readonly string[]).includes("redaction"));
  const record = {
    schema: "specstride.run-state/1",
    runId: "r1",
    workspaceId: "w1",
    feature: "111-event-schema-and-projection",
    state: "created",
    stateSince: "2026-10-01T00:00:00.000Z",
    transition: "T1",
    launchId: "l1",
    engineStartId: "e1",
    startMode: "standalone",
    requestKind: "engine",
    productVersions: ["0.0.0"],
    relaunchOwner: "root",
    loop: {},
    containment: {},
    criticProof: {},
    redaction: version,
    nativeMemory: {},
    caps: {},
  };
  assert.ok(isRunRecord(record), "the record with the version of the set is a valid run record");
  const { redaction: _redaction, ...withoutTheVersion } = record;
  assert.equal(isRunRecord(withoutTheVersion), false, "`redaction` is required");
});

test("CT-111-129: THE VERSION CHANGES WITH EVERY CHANGE OF THE SET", () => {
  const widened = loadWidenedPatternSet();
  assert.ok(widened.ok);
  // The version carries a digest of the two pattern lists, so a set that
  // differs by one pattern cannot keep the version: the loader refuses it.
  const changed = {
    ...widened.loaded.set,
    values: [...widened.loaded.set.values, { name: "added", pattern: "zzz", flags: "" }],
  };
  const reloaded = loadPatternSetFrom(changed);
  assert.equal(reloaded.ok, false, "a set whose version no longer matches its content is refused");
  if (!reloaded.ok) {
    assert.equal(reloaded.mark, "pattern-set-invalid");
    assert.match(reloaded.reason, /version/);
  }
  // And the digest of the changed set is not the digest of the shipped one.
  assert.notEqual(expectedVersionOf(changed), widened.loaded.version);
});

test("CT-111-129: no text of this feature's own corpus matches a widened-only pattern", () => {
  // This is the claim over the corpus this feature itself ships. The FIXTURE
  // texts the requirement names are scanned separately, below.
  const widenedOnly = widenedOnlyPatterns();
  assert.ok(widenedOnly.length > 0, "there are widened-only patterns to test against");
  const corpus = [
    readFileSync(join(ROOT, "packages/observability/data/event-catalogue.tsv"), "utf8"),
    readFileSync(join(ROOT, "specs/111-event-schema-and-projection/data-model.md"), "utf8"),
    readFileSync(join(ROOT, "packages/observability/src/ingress/ingress.ts"), "utf8"),
    readFileSync(join(ROOT, "packages/observability/src/writer/writer.ts"), "utf8"),
  ];
  for (const text of corpus) {
    for (const entry of widenedOnly) {
      const expression = new RegExp(entry.pattern, entry.flags.replace("g", "") + "g");
      const hit = expression.exec(text);
      assert.equal(
        hit,
        null,
        `the widened-only pattern \`${entry.name}\` matched \`${hit?.[0] ?? ""}\``,
      );
    }
  }
});

/* ------------------------------------------------------------------ *
 * CT-111-129 — THE FIXTURES OF THE ORACLE.
 *
 * The last sentence of F111-FR-029 is about the FIXTURES of the oracle, so the
 * fixture texts themselves are scanned here and not only this feature's own
 * corpus. The fixtures come in two layers, and both are covered:
 *
 *   1. Their DECLARATION — feature 141's fixture catalogue,
 *      `specs/141-parity-oracle/contracts/fixture-catalogue.json`, which
 *      carries the text of each family: its name, what it exercises, its
 *      reference, its stubs, its surfaces and the name of every scenario. That
 *      file is in the tree, so the scan over the two families this feature is
 *      listed in (FX-01 and FX-26) RUNS and is never a skip.
 *   2. Their MATERIALIZED trees, which feature 141 builds under
 *      `tests/parity/fixtures` or `tests/parity/reference`. They are not built
 *      here, so that half reports a SKIP with its reason and never a pass (the
 *      constitution, principle XVII).
 * ------------------------------------------------------------------ */

/** The fixture families of the oracle this feature is listed in. */
const ORACLE_FIXTURE_FAMILIES = ["FX-01", "FX-26"] as const;

/** Where the fixtures of the oracle are DECLARED, with their text. */
const FIXTURE_CATALOGUE_FILE = join(
  ROOT,
  "specs",
  "141-parity-oracle",
  "contracts",
  "fixture-catalogue.json",
);

/** Where feature 141 MATERIALIZES the fixtures once it is built. */
const ORACLE_FIXTURE_ROOTS = [
  join("tests", "parity", "fixtures"),
  join("tests", "parity", "reference"),
] as const;

/** One text to scan, with where it came from, so a hit names its source. */
type FixtureText = { readonly where: string; readonly text: string };

/**
 * Every text the fixture catalogue carries for the named families: the whole
 * declared entry of each one, so that no field of it is left unscanned.
 */
function declaredFixtureTexts(file: string = FIXTURE_CATALOGUE_FILE): readonly FixtureText[] {
  const parsed = JSON.parse(readFileSync(file, "utf8")) as {
    families?: readonly { id?: unknown }[];
  };
  const texts: FixtureText[] = [];
  for (const family of parsed.families ?? []) {
    const id = typeof family.id === "string" ? family.id : "";
    if (!ORACLE_FIXTURE_FAMILIES.some((name) => name === id)) continue;
    texts.push({ where: `${file}#${id}`, text: JSON.stringify(family, null, 1) });
  }
  return Object.freeze(texts);
}

/** The first materialized fixture root of the oracle that exists, if any. */
function materializedFixtureRoot(): string | undefined {
  for (const candidate of ORACLE_FIXTURE_ROOTS) {
    const path = join(ROOT, candidate);
    if (existsSync(path)) return path;
  }
  return undefined;
}

/** Every file under a directory, recursively. */
function filesUnder(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) filesUnder(path, found);
    else found.push(path);
  }
  return found;
}

/**
 * The claim itself: no text of the given set matches a VALUE pattern that the
 * widened set has and the baseline's does not.
 */
function assertNoFixtureTextMatchesAWidenedOnlyPattern(texts: readonly FixtureText[]): void {
  const widenedOnly = widenedOnlyPatterns();
  assert.ok(widenedOnly.length > 0, "there are widened-only patterns to test against");
  assert.ok(texts.length > 0, "there is fixture text to scan");
  for (const { where, text } of texts) {
    for (const entry of widenedOnly) {
      const hit = compilePattern(entry, true).exec(text);
      assert.equal(
        hit,
        null,
        `the widened-only pattern \`${entry.name}\` matched \`${hit?.[0] ?? ""}\` in ${where}`,
      );
    }
  }
}

test("CT-111-129: NO FIXTURE TEXT of FX-01 or FX-26 matches a widened-only pattern", () => {
  const texts = declaredFixtureTexts();
  assert.deepEqual(
    texts.map(({ where }) => where.slice(where.lastIndexOf("#") + 1)),
    [...ORACLE_FIXTURE_FAMILIES],
    "both named fixture families were found in the catalogue and are scanned",
  );
  assertNoFixtureTextMatchesAWidenedOnlyPattern(texts);
});

test("CT-111-129: the fixture scan FAILS on a fixture text that carries a widened-only secret", (t) => {
  // The negative control of the scan above: the same function, over a fixture
  // text with one planted token, must refuse it. Without this, a scan that
  // matched nothing could be a scan that looked at nothing.
  const dir = mkdtempSync(join(tmpdir(), "fixture-catalogue-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const planted = join(dir, "fixture-catalogue.json");
  writeFileSync(
    planted,
    JSON.stringify({
      families: [
        {
          id: "FX-01",
          name: "a fixture whose text carries a token",
          token: `xoxb-${"1".repeat(12)}`,
        },
        { id: "FX-26", name: "a clean fixture" },
      ],
    }),
    "utf8",
  );
  assert.throws(
    () => assertNoFixtureTextMatchesAWidenedOnlyPattern(declaredFixtureTexts(planted)),
    /slack-prefix/,
  );
});

function materializedFixturesHalf(): { skip: string | false } {
  const oracle = existsSync(join(ROOT, "packages", "oracle", "src"));
  if (oracle && materializedFixtureRoot() !== undefined) return { skip: false };
  return {
    skip:
      `prerequisite missing: the parity oracle of feature 141 (\`packages/oracle\` and ` +
      `\`tests/parity/reference\`) is not built, so the fixture families ` +
      `${ORACLE_FIXTURE_FAMILIES.join(", ")} cannot be scanned where they are MATERIALIZED. ` +
      `This is a SKIP with its reason and never a pass (the constitution, principle XVII). The ` +
      `DECLARED text of the same two families is scanned by the test above, which does not skip.`,
  };
}

test(
  "CT-111-129: on the materialized fixtures of the oracle, no text matches a widened-only pattern",
  materializedFixturesHalf(),
  () => {
    const root = materializedFixtureRoot();
    assert.ok(root !== undefined, "the fixture root is present: this half is not skipped");
    const texts = filesUnder(root).flatMap((file) =>
      ORACLE_FIXTURE_FAMILIES.some((name) => file.includes(name))
        ? [{ where: file, text: readFileSync(file, "utf8") }]
        : [],
    );
    assertNoFixtureTextMatchesAWidenedOnlyPattern(texts);
  },
);
