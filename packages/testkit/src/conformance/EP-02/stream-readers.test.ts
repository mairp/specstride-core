/**
 * T008, T014 — the stream-reader cases of the conformance suite of EP-02,
 * the harness port (F126-FR-002, F126-FR-006, F126-FR-007).
 *
 * The suite replays the recorded streams of FX-26 through the reader its
 * registry row names (PT-126-C-149-records), checks the capability
 * announcement of the seam (PT-126-C-149-observability), and includes a
 * sample reader given as data only, held in the test tree
 * (`src/samples/EP-02/stream-format-sample.json`), which passes with no core
 * file changed (CT-126-1, F126-FR-007).
 *
 * The cases run against the sample implementation of EP-02, as every suite of
 * this folder does; they read the seam of feature 126 as the implementation
 * under test of the stream sub-point of the port.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { kindsOfNormalizedStreamRecord } from "@specstride/contracts/enums/all-sets";
import {
  StreamFormatRegistry,
  defaultStreamRegistry,
  type StreamFormatRegistry as Registry,
} from "../../../../harness/src/stream/registry.ts";
import { startRowReader } from "../../../../harness/src/stream/start.ts";
import {
  announceCapability,
  announceFailedStart,
  announceRouteFallback,
  modeAfterDiagnostic,
} from "../../../../harness/src/stream/observability.ts";
import { drainDiagnostics } from "../../../../harness/src/stream/closed-sets.ts";
import { POINT_ID } from "@specstride/contracts/ep/harness";
import { implementation } from "../../samples/EP-02/index.ts";
import { casesAsTests } from "../run.ts";
import type { ConformanceCase } from "../run.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const STREAMS = join(HERE, "../../../../../tests/parity/126/streams");
const SAMPLE = join(HERE, "../../samples/EP-02/stream-format-sample.json");

/** The recorded stream cases of FX-26 that carry a stream. */
export function recordedCases(root: string = STREAMS): readonly string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root).filter((name) => existsSync(join(root, name, "stream.json")));
}

/** The format a recorded case reads through, from the case family. */
function formatOf(caseName: string): string | null {
  if (caseName.startsWith("claude-")) return "claude";
  if (caseName.startsWith("prime-v3-")) return "prime-v3";
  return null;
}

/** Replay one recorded stream through the reader of its registry row. */
export function replayRecorded(
  caseName: string,
  registry: Registry = defaultStreamRegistry(),
  root: string = STREAMS,
): readonly { kind: string; synthesized: boolean }[] {
  const format = formatOf(caseName);
  assert.ok(format, `${caseName}: the case family names a format`);
  const row = registry.resolve(format);
  assert.ok(row, `${caseName}: the format '${format}' resolves in the registry`);
  const reader = startRowReader(row, {});
  if (reader === null) return [];
  const out: { kind: string; synthesized: boolean }[] = [];
  for (const line of readFileSync(join(root, caseName, "stream.json"), "utf8").split("\n")) {
    for (const record of reader.push(line))
      out.push({ kind: record.kind, synthesized: record.synthesized });
  }
  for (const record of reader.finish())
    out.push({ kind: record.kind, synthesized: record.synthesized });
  return out;
}

/** The data-only sample of EP-02, as the test tree holds it. */
export function loadSample(): {
  sampleId: string;
  format: Record<string, unknown>;
  mapping: Record<string, unknown>;
  recordedStreams: unknown[][];
  expected: { kinds: readonly string[]; synthesized: readonly string[] };
} {
  return JSON.parse(readFileSync(SAMPLE, "utf8")) as {
    sampleId: string;
    format: Record<string, unknown>;
    mapping: Record<string, unknown>;
    recordedStreams: unknown[][];
    expected: { kinds: readonly string[]; synthesized: readonly string[] };
  };
}

/** Register the data-only sample into a registry and replay its streams. */
export function replaySample(
  registry: Registry = defaultStreamRegistry(),
): readonly { kind: string; synthesized: boolean }[] {
  const sample = loadSample();
  const format = sample.format as Record<string, unknown>;
  const mapping = sample.mapping as Record<string, unknown>;
  const row = registry.register({
    name: (format["name"] as string) ?? "sample-ep02",
    reason: (format["reason"] as string) ?? "the sample format",
    signals: (format["signals"] as string[] | undefined) ?? undefined,
    hasInitRecord: format["hasInitRecord"] === "true" || format["hasInitRecord"] === true,
    synthInit: format["synthInit"] === true,
    synthTerminal: format["synthTerminal"] === true,
    reader: {
      type: "mapping",
      selector: (mapping["selector"] as string) ?? "",
      fields: (mapping["fields"] as Record<string, string>) ?? {},
      usage: (mapping["usage"] as Record<string, string>) ?? undefined,
      tolerate: (mapping["tolerate"] as string[]) ?? undefined,
    },
  });
  const reader = startRowReader(row, {});
  assert.ok(reader, "the data-only reader starts");
  const out: { kind: string; synthesized: boolean }[] = [];
  for (const stream of sample.recordedStreams) {
    for (const document of stream) {
      for (const record of reader.push(JSON.stringify(document))) {
        out.push({ kind: record.kind, synthesized: record.synthesized });
      }
    }
  }
  for (const record of reader.finish())
    out.push({ kind: record.kind, synthesized: record.synthesized });
  return out;
}

/** The stream-reader cases of the EP-02 suite (the behaviour of feature 126). */
export const cases: readonly ConformanceCase[] = Object.freeze([
  {
    id: "CT-126-C-149-records",
    title:
      "every recorded stream of FX-26 replays through the reader its registry row names and only the six kinds of row 38 come out (F126-FR-002)",
    level: "behaviour",
    proves: ["F126-FR-002", "F126-FR-007"],
    run() {
      const claudeCases = recordedCases().filter((c) => formatOf(c) === "claude");
      assert.ok(
        claudeCases.length >= 18,
        `the recorded claude streams are collected (${claudeCases.length})`,
      );
      for (const caseName of claudeCases) {
        for (const record of replayRecorded(caseName)) {
          assert.ok(
            kindsOfNormalizedStreamRecord.has(record.kind),
            `${caseName}: kind '${record.kind}' is inside row 38`,
          );
        }
      }
      const primeCases = recordedCases().filter((c) => formatOf(c) === "prime-v3");
      assert.equal(primeCases.length, 10, "the recorded prime streams are collected");
      const registry = defaultStreamRegistry();
      const row = registry.resolve("prime-v3");
      assert.ok(row, "prime-v3 stays registered");
      assert.equal(
        startRowReader(row, {}),
        null,
        "the JSONL reader of prime-v3 is feature 138's (F126-FR-007): the replay of its streams is that feature's",
      );
      drainDiagnostics();
    },
  },
  {
    id: "CT-126-C-149-observability",
    title:
      "the seam announces the capability of the format at the start of an invocation, and only unsupported_schema and absent_schema degrade the mode (F126-FR-006)",
    level: "behaviour",
    proves: ["F126-FR-006"],
    run() {
      const registry = defaultStreamRegistry();
      const row = registry.resolve("claude");
      assert.ok(row);
      const structured = announceCapability(
        { name: row.name, signals: row.signals },
        { role: "proposer" },
      );
      assert.equal(structured.mode, "structured");
      assert.deepEqual(structured.signals.map(String), [
        "init",
        "text",
        "tool",
        "evidence",
        "result",
      ]);
      const rawText = announceCapability(undefined, { role: "critic", providerFormat: "mystery" });
      assert.equal(rawText.mode, "raw-text");
      assert.equal(rawText.reason, "structured schema unavailable — parsing plain output");
      assert.deepEqual(rawText.signals.map(String), ["text", "result"]);
      const degraded = announceFailedStart("prime-v3", {
        role: "proposer",
        providerFormat: "prime-v3",
      });
      assert.equal(degraded.mode, "degraded");
      assert.equal(
        degraded.reason,
        "stream adapter for 'prime-v3' failed to start — parsing plain output",
      );
      assert.deepEqual(degraded.signals.map(String), ["result"]);
      const fallback = announceRouteFallback("no registered adapter", {
        role: "accelerator",
        providerFormat: "claude",
        format: "claude",
      });
      assert.equal(fallback.mode, "raw-text");
      assert.equal(
        fallback.reason,
        "stream format 'claude' has no registered adapter — parsing plain output",
      );
      assert.equal(modeAfterDiagnostic("structured", "unsupported_schema"), "degraded");
      assert.equal(modeAfterDiagnostic("raw-text", "absent_schema"), "degraded");
      assert.equal(modeAfterDiagnostic("structured", "malformed_json"), "structured");
      drainDiagnostics();
    },
  },
  {
    id: "CT-126-1",
    title:
      "a sample reader given as data only passes: its streams replay into the six kinds with no code and no change of a core file (F126-FR-007)",
    level: "behaviour",
    proves: ["F126-FR-007"],
    run() {
      const sample = loadSample();
      const records = replaySample(new StreamFormatRegistry());
      const kinds = records.map((r) => r.kind);
      for (const kind of sample.expected.kinds) {
        assert.ok(kinds.includes(kind), `the sample replay yields '${kind}'`);
      }
      for (const record of records) {
        assert.ok(
          kindsOfNormalizedStreamRecord.has(record.kind),
          `${record.kind} is inside row 38`,
        );
        if (sample.expected.synthesized.includes(record.kind)) {
          assert.equal(
            record.synthesized,
            true,
            `the ${record.kind} of the sample is marked synthesized`,
          );
        }
      }
      const usage = records.find((r) => r.kind === "usage");
      assert.ok(usage, "the usage paths of the mapping reach the cost record");
      drainDiagnostics();
    },
  },
]);

await casesAsTests(POINT_ID, implementation, cases);
