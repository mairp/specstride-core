/**
 * T014 — own test CT-126-1: a sample reader given as data only, held in the
 * test tree of the test kit, passes the conformance suite of EP-02 with no
 * core file changed (F126-FR-007).
 *
 * The sample is `src/samples/EP-02/stream-format-sample.json`: the descriptor
 * of the format, the mapping of its documents, and its recorded sample
 * streams — data, no code. The test registers that data into a fresh
 * registry, runs the conformance cases of `src/conformance/EP-02/` over the
 * seam, and hashes every file of the core packages (`@specstride/contracts`,
 * `@specstride/kernel`, `@specstride/harness`) before and after: a data-only
 * reader needs no change of a core file.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { StreamFormatRegistry } from "../../../packages/harness/src/stream/registry.ts";
import { cases, replaySample } from "../src/conformance/EP-02/stream-readers.test.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../../..");
const CORE_DIRS = [
  join(ROOT, "packages/contracts/src"),
  join(ROOT, "packages/kernel/src"),
  join(ROOT, "packages/harness/src"),
];

/** Every file under a directory, in a stable order. */
function filesUnder(dir: string, out: string[] = []): readonly string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) filesUnder(full, out);
    else out.push(full);
  }
  return out;
}

/** One digest over every core file, in a stable order. */
function coreDigest(): string {
  const hash = createHash("sha256");
  for (const dir of CORE_DIRS) {
    for (const file of filesUnder(dir)) {
      hash.update(file);
      hash.update(createHash("sha256").update(readFileSync(file)).digest());
    }
  }
  return hash.digest("hex");
}

test("CT-126-1: the sample reader of the test tree is data only", () => {
  const sample = JSON.parse(
    readFileSync(
      join(ROOT, "packages/testkit/src/samples/EP-02/stream-format-sample.json"),
      "utf8",
    ),
  ) as Record<string, unknown>;
  assert.equal(sample["sampleId"], "sample-ep02-stream-format");
  assert.ok(sample["format"], "the format descriptor is data");
  assert.ok(sample["mapping"], "the mapping is data");
  assert.ok(Array.isArray(sample["recordedStreams"]), "the recorded sample streams are data");
});

test("CT-126-1: the sample replays into the six kinds through the generic mapping reader", () => {
  const records = replaySample(new StreamFormatRegistry());
  const kinds = records.map((r) => r.kind);
  for (const kind of ["init", "text", "usage", "terminal"]) {
    assert.ok(kinds.includes(kind), `the sample replay yields '${kind}'`);
  }
  for (const record of records) {
    assert.ok(
      ["init", "text", "tool", "usage", "error", "terminal"].includes(record.kind),
      `${record.kind} is a kind of row 38`,
    );
  }
});

test("CT-126-1: the conformance cases of EP-02 over the stream seam pass", async () => {
  for (const one of cases) {
    await one.run({ id: "sample-ep02", implementationClass: "sample", major: 1 } as never);
  }
  assert.ok(cases.length >= 3, "the replay, the observability and the data-only cases ran");
});

test("CT-126-1: no core file differs", () => {
  const before = coreDigest();
  replaySample(new StreamFormatRegistry());
  const after = coreDigest();
  assert.equal(
    after,
    before,
    "registering and replaying the data-only sample changes no core file",
  );
});
