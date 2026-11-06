/**
 * CT-138-43 (T029) — the replay suite of the one-reader requirement
 * (F138-FR-043): one reader serves the family. The ten as-is streams of the
 * dialect replay equal to the evidence the baseline reader generated (the
 * `expected/` records, lines and projected events); the same suite replays
 * with the row of the other harness of the family, `pi`, over the streams of
 * feature 134.
 *
 * Capture pending: feature 134's own recorded streams do not exist yet (its
 * paid capture T003 is still open, and the `<captured>` fields of its
 * dialect row — the provider format string and the usage names — are settled
 * by that capture). Until they are recorded, the `pi` leg replays the
 * family-format placeholder streams under
 * `tests/fixtures/streams/pi-family/` with the `pi` row built as data at
 * test time, and asserts the reader produces the same projected events for
 * both rows — which is the property F138-FR-043 states. See the README in
 * that directory.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PrimeStreamReader,
  dialectRowFor,
  parseDialectRow,
  type DialectRow,
  type PrimeStreamResult,
} from "../../src/index.ts";

// the file's own directory, so the suite runs from any working directory
const HERE = dirname(fileURLToPath(import.meta.url));
const ASIS = `${HERE}/../fixtures/streams/asis`;
const PI_FAMILY = `${HERE}/../fixtures/streams/pi-family`;
const EXPECTED = `${HERE}/expected`;
const PRIME_ROW = dialectRowFor("prime");
if (PRIME_ROW === undefined) throw new Error("the dialect table holds no row prime");

const EVIDENCE = "/work/project/.wiggum/features/fixture-feature/gates/GATE1-EVIDENCE.md";

/**
 * The two parsers word their JSON errors differently; the code is what the
 * diagnostics contract holds, so the message tail and the byte counts of a
 * malformed_json diagnostic are normalized on both sides, and keys are
 * compared in a stable order.
 */
function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const entries = Object.entries(record)
      .map(([k, v]) => [k, normalize(v)] as [string, unknown])
      .sort(([a], [b]) => (a < b ? -1 : 1));
    if (record["code"] === "malformed_json") {
      entries.push(["original_bytes", 0], ["retained_bytes", 0]);
    }
    return Object.fromEntries(entries);
  }
  return typeof value === "string"
    ? value.replace(/Malformed Prime JSON: [\s\S]*/, "Malformed Prime JSON: <e>")
    : value;
}

function replay(row: DialectRow, dir: string, file: string): PrimeStreamResult {
  const reader = new PrimeStreamReader({ row, expectedEvidence: EVIDENCE });
  for (const line of readFileSync(`${dir}/${file}`, "utf8").split("\n")) {
    if (line.trim()) reader.feed(line);
  }
  return reader.finish();
}

test("CT-138-43: the ten as-is streams replay equal to the generated evidence", () => {
  const files = readdirSync(ASIS)
    .filter((f) => f.endsWith(".jsonl"))
    .sort();
  assert.equal(files.length, 10);
  for (const file of files) {
    const name = file.replace(".jsonl", "");
    const golden = JSON.parse(readFileSync(`${EXPECTED}/${name}.json`, "utf8"));
    const r = replay(PRIME_ROW, ASIS, file);
    assert.deepEqual(
      normalize(r.events.map((e) => [e.name, e.fields])),
      normalize(golden.events),
      `${name}: projected events`,
    );
    assert.deepEqual(normalize(r.display), normalize(golden.output), `${name}: display lines`);

    assert.deepEqual(r.terminal, golden.terminal, `${name}: terminal`);
    assert.deepEqual(r.usage, golden.usage, `${name}: usage`);
    assert.equal(r.turns, golden.turns, `${name}: turns`);
    assert.deepEqual(r.evidenceTools, golden.evidence_tools, `${name}: evidence tools`);
    assert.equal(r.schemaVersion, golden.schema_version, `${name}: schema version`);
    // the normalized records are the six kinds only (checked in depth by
    // CT-138-37); an empty stream legitimately holds no record at all
    if (name !== "empty") {
      assert.ok(r.records.length > 0, `${name}: records`);
    }
  }
});

test("CT-138-43: the reader accepts a session that names its version either way", () => {
  // the recorded fixtures carry `version`; the frame contract names `schemaVersion`
  for (const key of ["version", "schemaVersion"]) {
    const reader: PrimeStreamReader = new PrimeStreamReader({ row: PRIME_ROW });
    reader.feed(JSON.stringify({ type: "session", [key]: 3, id: "s" }));
    reader.finish();
    assert.equal(reader.partial.schemaVersion, 3, key);
  }
});

/** The `pi` row of feature 134, built as data with the captured-pending fields. */
function piRow(): DialectRow {
  const contract = JSON.parse(
    readFileSync(`${HERE}/../../../../specs/134-adapter-pi/contracts/dialect-row.pi.json`, "utf8"),
  ) as Record<string, unknown>;
  const placeholders = Object.values(contract).some(
    (v) => typeof v === "string" && v.includes("<captured"),
  );
  assert.equal(placeholders, true, "the pi contract still marks its capture-pending fields");
  // The provider format string and the usage names of the row are settled by
  // capture 2 of feature 134; until then the family values stand in, as data.
  const row = parseDialectRow({
    ...contract,
    providerFormat: "pi-v3",
    usageNames: {
      input: ["inputTokens", "input_tokens"],
      output: ["outputTokens", "output_tokens"],
      cacheRead: ["cacheReadTokens", "cache_read_tokens"],
      cacheWrite: ["cacheWriteTokens", "cache_write_tokens"],
      total: ["totalTokens", "total_tokens"],
      cost: ["cost", "totalCost"],
    },
  });
  assert.equal(row.dialect, "pi");
  return row;
}

test("CT-138-43: the pi row of feature 134 replays the family streams with the same events", () => {
  const row = piRow();
  const files = readdirSync(PI_FAMILY)
    .filter((f) => f.endsWith(".jsonl"))
    .sort();
  assert.equal(files.length, 10);
  for (const file of files) {
    const asPrime = replay(PRIME_ROW, ASIS, file);
    const asPi = replay(row, PI_FAMILY, file);
    // the events are the family's; only the init line names the row's format
    assert.deepEqual(asPi.events, asPrime.events, `${file}: events under the pi row`);
    assert.deepEqual(asPi.terminal, asPrime.terminal, `${file}: terminal under the pi row`);
    assert.deepEqual(asPi.usage, asPrime.usage, `${file}: usage under the pi row`);
    assert.equal(asPi.dialect, "pi");
    if (asPi.display.length > 0) {
      // the init line names the row's own provider format
      assert.notEqual(asPi.display[0], asPrime.display[0]);
    }
  }
});
