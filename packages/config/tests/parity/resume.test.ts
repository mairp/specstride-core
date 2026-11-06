/**
 * T022 — the parity test PT-110-DV024-resume (F110-FR-022; DV-024; fixture
 * family FX-13): pinned keys replay, tunable keys follow the environment.
 *
 * DV-024, as `consolidation.md` records it: "`resume` turns the saved
 * `last-run.conf` into flags, so saved values beat the environment (B-0257);
 * six settings are not saved (B-0260); a failed write is ignored; a saved
 * timeout overrides an exported one (D-35)". The port replaces that with "a run
 * snapshot with provenance per key. On resume: pinned keys rank below flags and
 * above the environment; tunable keys rank below the environment."
 *
 * The test is an integration test and it witnesses the effect through an
 * independent read path. The snapshot is built from a real resolved
 * configuration, written to a file in a throw-away directory under the system
 * temporary directory, and then read back with `node:fs` and `JSON.parse` —
 * never from the object that was written. A SHA-256 hash of the bytes on disk
 * is recorded, which could not exist before the write, and the resume is driven
 * from the re-read record. A record that is not on disk makes the test fail
 * rather than pass on the builder's return value.
 *
 * The reference half — the comparison against the reference trees of the oracle
 * of feature 141 on FX-13 — reports a SKIP with its reason while feature 141 is
 * not built, and never a pass.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after, describe, it } from "node:test";

import { rankOfLayer } from "@specstride/contracts/envelope/config";

import catalogue from "../../../../vendor/specs/141-parity-oracle/contracts/fixture-catalogue.json" with { type: "json" };

import { readConfigFile } from "../../src/load/files.ts";
import { resolveConfiguration } from "../../src/load/merge.ts";
import {
  PINNED_RANK_ON_RESUME,
  SNAPSHOT_CLASSES,
  SNAPSHOT_CLASS_DEFAULT,
  SNAPSHOT_SCHEMA_ID,
  TUNABLE_RANK_ON_RESUME,
  A_KEY_ABSENT_FROM_AN_OLDER_SNAPSHOT_TAKES_THE_RANKS_BELOW,
  buildRunSnapshot,
  keysMissingFromSnapshot,
  keysOfClass,
  snapshotClassOf,
  snapshotRankOf,
  snapshotValues,
  type RunSnapshotRecord,
  type SnapshotKeyRecord,
} from "../../src/load/snapshot.ts";
import { provenanceTable, shadowedEnvironmentValues } from "../../src/load/provenance.ts";
import { referenceHalfFor } from "./oracle.ts";

/** The fixture family of PT-110-DV024-* (`tasks.md`, T022). */
const FAMILIES = ["FX-13"] as const;

type Family = { id: string; status: string; scenarios: { name: string; waiver: string | null }[] };

const FAMILIES_OF_THE_CATALOGUE = (catalogue as { families: Family[] }).families;

/** The pinned key the run replays: its class in the catalogue is `p`. */
const PINNED_KEY = "roles.proposer.harness";
/** Its as-is environment name (§K.8). */
const PINNED_VARIABLE = "SPECSTRIDE_PROPOSER";
/** The tunable key the environment steers: its class in the catalogue is `t`. */
const TUNABLE_KEY = "loop.maxIter";
/** Its as-is environment name (§K.8). */
const TUNABLE_VARIABLE = "SPECSTRIDE_MAX_ITER";
/** A key of the type secret ref, which the snapshot holds as a reference. */
const SECRET_KEY = "roles.critic.credential";

/** The throw-away directory the snapshot is written into. */
const directory = mkdtempSync(join(tmpdir(), "specstride-110-resume-"));
const snapshotPath = join(directory, "snapshot.json");

after(() => {
  rmSync(directory, { recursive: true, force: true });
});

/** The run the snapshot is taken of: the first run, with no resume. */
function firstRun(): ReturnType<typeof resolveConfiguration> {
  return resolveConfiguration({
    argv: [
      "--set",
      `${PINNED_KEY}=dsh`,
      "--set",
      `${TUNABLE_KEY}=12`,
      "--set",
      `${SECRET_KEY}=env:CRITIC_KEY`,
    ],
  });
}

/**
 * Build the snapshot of the first run, write it to disk, and return the bytes'
 * hash. Nothing of the in-memory record is handed back: the resume reads the
 * file.
 */
function writeSnapshot(): { hash: string; bytes: number } {
  const record = buildRunSnapshot({
    runId: "run-110-resume-0001",
    createdAt: "2026-10-01T00:00:00Z",
    values: firstRun().values,
    sourceHashes: { spec: { contentHash: "sha256:0" } },
  });
  const text = `${JSON.stringify(record, null, 2)}\n`;
  writeFileSync(snapshotPath, text, "utf8");
  return {
    hash: `sha256:${createHash("sha256").update(readFileSync(snapshotPath)).digest("hex")}`,
    bytes: statSync(snapshotPath).size,
  };
}

/** Read the snapshot back through `node:fs`, which is the independent path. */
function readSnapshot(): RunSnapshotRecord {
  assert.ok(existsSync(snapshotPath), "the snapshot must be a file on disk before it is read");
  return JSON.parse(readFileSync(snapshotPath, "utf8")) as RunSnapshotRecord;
}

const written = writeSnapshot();

describe("PT-110-DV024-resume: the snapshot as a durable record (F110-FR-022)", () => {
  it("FX-13 is a family of the catalogue of feature 141, with the DV-024 scenarios", () => {
    const family = FAMILIES_OF_THE_CATALOGUE.find((f) => f.id === "FX-13");
    assert.notEqual(family, undefined, "FX-13 is in contracts/fixture-catalogue.json of 141");
    assert.equal(family?.status, "active");
    const waived = (family?.scenarios ?? [])
      .filter((s) => s.waiver === "DV-024")
      .map((s) => s.name);
    assert.deepEqual(waived, [
      "resume-tunable-key-in-environment",
      "resume-unsaved-setting",
      "snapshot-write-fails",
    ]);
    assert.ok(
      (family?.scenarios ?? []).some((s) => s.name === "resume-pinned-keys"),
      "the family carries the scenario `resume-pinned-keys`",
    );
  });

  it("the snapshot exists on disk, with a content hash that could not exist before", () => {
    assert.match(written.hash, /^sha256:[0-9a-f]{64}$/);
    assert.ok(written.bytes > 0);
    assert.ok(existsSync(snapshotPath));
    // Re-hashing the bytes on disk gives the same hash: the record is durable
    // and is not the builder's return value.
    const again = `sha256:${createHash("sha256").update(readFileSync(snapshotPath)).digest("hex")}`;
    assert.equal(again, written.hash);
  });

  it("the record read back from disk carries the identity and schema of §B.12", () => {
    const record = readSnapshot();
    assert.equal(record.schema, SNAPSHOT_SCHEMA_ID);
    assert.equal(record.schema, "specstride.snapshot/1");
    assert.equal(record.runId, "run-110-resume-0001");
    assert.equal(record.createdAt, "2026-10-01T00:00:00Z");
    assert.equal(record.profile, null);
    assert.ok(Object.keys(record.keys).length > 100, "every resolved key is in the snapshot");
  });

  it("every key of the record holds its value, its source rank and its class", () => {
    const record = readSnapshot();
    for (const [key, entry] of Object.entries(record.keys)) {
      assert.ok(Object.hasOwn(entry, "value"), key);
      assert.equal(typeof entry.source, "number", key);
      assert.ok(entry.source >= 1 && entry.source <= 8, `${key} at rank ${entry.source}`);
      assert.ok(SNAPSHOT_CLASSES.includes(entry.class), `${key} is ${entry.class}`);
      // F110-FR-022, third sentence: the class is the catalogue's.
      assert.equal(entry.class, snapshotClassOf(key), key);
    }
    assert.equal(SNAPSHOT_CLASS_DEFAULT, "pinned");
    assert.deepEqual([...SNAPSHOT_CLASSES], ["pinned", "tunable"]);
  });

  it("a secret reference is held as a reference and never as a value", () => {
    const entry = readSnapshot().keys[SECRET_KEY] as SnapshotKeyRecord;
    assert.equal(entry.value, "env:CRITIC_KEY");
    assert.equal(entry.isSecretReference, true);
    assert.equal(entry.class, "pinned");
    // No secret value can be in the file: nothing but the reference is written.
    assert.ok(!readFileSync(snapshotPath, "utf8").includes("CRITIC_KEY_VALUE"));
  });

  it("the two keys the resume is driven with carry the classes the catalogue gives", () => {
    const record = readSnapshot();
    assert.equal(snapshotClassOf(PINNED_KEY), "pinned");
    assert.equal(snapshotClassOf(TUNABLE_KEY), "tunable");
    assert.equal((record.keys[PINNED_KEY] as SnapshotKeyRecord).class, "pinned");
    assert.equal((record.keys[TUNABLE_KEY] as SnapshotKeyRecord).class, "tunable");
    assert.equal((record.keys[PINNED_KEY] as SnapshotKeyRecord).value, "dsh");
    assert.equal((record.keys[TUNABLE_KEY] as SnapshotKeyRecord).value, 12);
    // Both classes are populated across the whole catalogue, so neither branch
    // of the rank rule is dead.
    assert.ok(keysOfClass("pinned").length > 50);
    assert.ok(keysOfClass("tunable").length > 50);
  });
});

describe("PT-110-DV024-resume: DV-024, pinned keys replay (F110-FR-022)", () => {
  it("a pinned key takes the snapshot value and the exported one does not apply", () => {
    const resolved = resolveConfiguration({
      snapshot: snapshotValues(readSnapshot().keys),
      onResume: true,
      environment: { [PINNED_VARIABLE]: "codex" },
      aliasTable: true,
    });
    const merged = resolved.values.get(PINNED_KEY);
    assert.equal(merged?.value, "dsh", "the replayed value, not the exported one");
    assert.equal(merged?.source, "run-snapshot");
    assert.equal(merged?.rank, PINNED_RANK_ON_RESUME);
    assert.equal(PINNED_RANK_ON_RESUME, 3);
    assert.equal(merged?.class, "pinned");
    // The environment value is recorded as shadowed, with both ranks.
    const shadow = merged?.shadowed.find((s) => s.layer === "environment");
    assert.equal(shadow?.value, "codex");
    assert.equal(shadow?.rank, rankOfLayer["environment"]);
    assert.equal(shadow?.place, PINNED_VARIABLE);
  });

  it("a pinned key ranks below flags: a flag on the resume still wins", () => {
    const resolved = resolveConfiguration({
      snapshot: snapshotValues(readSnapshot().keys),
      onResume: true,
      argv: ["--set", `${PINNED_KEY}=codex`],
    });
    const merged = resolved.values.get(PINNED_KEY);
    assert.equal(merged?.value, "codex");
    assert.equal(merged?.source, "flag");
    assert.equal(merged?.rank, rankOfLayer["flag"]);
    assert.ok(rankOfLayer["flag"] < PINNED_RANK_ON_RESUME, "rank 2 beats rank 3");
    assert.equal(merged?.shadowed.find((s) => s.layer === "run-snapshot")?.value, "dsh");
  });

  it("F110-FR-026: the shadowed environment value of a pinned key is reported", () => {
    const resolved = resolveConfiguration({
      snapshot: snapshotValues(readSnapshot().keys),
      onResume: true,
      environment: { [PINNED_VARIABLE]: "codex" },
      aliasTable: true,
    });
    const reports = shadowedEnvironmentValues(provenanceTable(resolved.values), {
      onResume: true,
    }).filter((r) => r.key === PINNED_KEY);
    assert.equal(reports.length, 1);
    assert.equal(reports[0]?.variable, PINNED_VARIABLE);
    assert.equal(reports[0]?.pinnedOnResume, true);
    assert.equal(reports[0]?.shadowedRank, 4);
    assert.equal(reports[0]?.byRank, 3);
    assert.match(reports[0]?.message ?? "", /pinned/);
    assert.match(reports[0]?.message ?? "", new RegExp(PINNED_VARIABLE));
  });
});

describe("PT-110-DV024-resume: DV-024, tunable keys follow the environment", () => {
  it("an exported value of a tunable key applies on a resume", () => {
    const resolved = resolveConfiguration({
      snapshot: snapshotValues(readSnapshot().keys),
      onResume: true,
      environment: { [TUNABLE_VARIABLE]: "7" },
      aliasTable: true,
    });
    const merged = resolved.values.get(TUNABLE_KEY);
    assert.equal(merged?.value, 7, "the exported value, not the replayed one");
    assert.equal(merged?.source, "environment");
    assert.equal(merged?.rank, rankOfLayer["environment"]);
    assert.equal(merged?.class, "tunable");
    // And the snapshot value is the one that is shadowed, at rank 4.5.
    const shadow = merged?.shadowed.find((s) => s.layer === "run-snapshot");
    assert.equal(shadow?.value, 12);
    assert.equal(shadow?.rank, TUNABLE_RANK_ON_RESUME);
    assert.equal(TUNABLE_RANK_ON_RESUME, 4.5);
  });

  it("with nothing exported, the tunable key replays its snapshot value", () => {
    const resolved = resolveConfiguration({
      snapshot: snapshotValues(readSnapshot().keys),
      onResume: true,
    });
    const merged = resolved.values.get(TUNABLE_KEY);
    assert.equal(merged?.value, 12);
    assert.equal(merged?.source, "run-snapshot");
    assert.equal(merged?.rank, TUNABLE_RANK_ON_RESUME);
  });

  it("a tunable key ranks above the project file, so a project value loses", () => {
    // The project file is a real file on disk, read through the loader of T011.
    const projectPath = join(directory, "specstride.yaml");
    writeFileSync(projectPath, `schema: 1\n${TUNABLE_KEY}: 5\n`, "utf8");
    const project = readConfigFile({ logicalName: "project:config", path: projectPath });
    assert.notEqual(project, undefined, "the project file is on disk and was read");
    assert.equal(project?.values.get(TUNABLE_KEY), 5);
    const resolved = resolveConfiguration({
      snapshot: snapshotValues(readSnapshot().keys),
      onResume: true,
      project,
    });
    const merged = resolved.values.get(TUNABLE_KEY);
    assert.equal(merged?.value, 12, "the snapshot at 4.5 beats the project file at 5");
    assert.equal(merged?.source, "run-snapshot");
    assert.ok(TUNABLE_RANK_ON_RESUME < rankOfLayer["project-configuration"]);
  });

  it("the rank of a snapshot value is the class's, for each class", () => {
    assert.equal(snapshotRankOf(PINNED_KEY), PINNED_RANK_ON_RESUME);
    assert.equal(snapshotRankOf(TUNABLE_KEY), TUNABLE_RANK_ON_RESUME);
    // Outside a resume the snapshot stands at rank 3 for a pinned key as well
    // (CQ-075: the same rank at a launch that continues a run).
    assert.equal(snapshotRankOf(PINNED_KEY, false), PINNED_RANK_ON_RESUME);
  });
});

describe("PT-110-DV024-resume: a key the older snapshot does not hold", () => {
  it("takes its value from the ranks below, and nothing is invented for it", () => {
    assert.equal(A_KEY_ABSENT_FROM_AN_OLDER_SNAPSHOT_TAKES_THE_RANKS_BELOW, true);
    // DV-024's "six settings are not saved" case: an older snapshot that holds
    // only one key. It is written to disk and read back the same way.
    const olderPath = join(directory, "older-snapshot.json");
    writeFileSync(
      olderPath,
      `${JSON.stringify({
        schema: SNAPSHOT_SCHEMA_ID,
        runId: "run-110-resume-0000",
        createdAt: "2026-09-30T00:00:00Z",
        profile: null,
        keys: { [PINNED_KEY]: { value: "dsh", source: 2, class: "pinned" } },
        sourceHashes: {},
      })}\n`,
      "utf8",
    );
    const older = JSON.parse(readFileSync(olderPath, "utf8")) as RunSnapshotRecord;
    const missing = keysMissingFromSnapshot(snapshotValues(older.keys), [
      PINNED_KEY,
      TUNABLE_KEY,
      "roles.critic.timeoutSec",
    ]);
    assert.deepEqual([...missing], [TUNABLE_KEY, "roles.critic.timeoutSec"]);

    const resolved = resolveConfiguration({
      snapshot: snapshotValues(older.keys),
      onResume: true,
      environment: { [TUNABLE_VARIABLE]: "7" },
      aliasTable: true,
    });
    // The key the snapshot holds replays; the one it does not takes the ranks
    // below — here the environment, and for the third the built-in default.
    assert.equal(resolved.values.get(PINNED_KEY)?.source, "run-snapshot");
    assert.equal(resolved.values.get(TUNABLE_KEY)?.value, 7);
    assert.equal(resolved.values.get(TUNABLE_KEY)?.source, "environment");
    assert.equal(resolved.values.get("roles.critic.timeoutSec")?.value, 300);
    assert.equal(resolved.values.get("roles.critic.timeoutSec")?.source, "default");
  });
});

test(
  "PT-110-DV024-resume (reference half): the port against the reference trees on FX-13",
  referenceHalfFor(FAMILIES),
  () => {
    assert.fail(
      "the reference half must be written when the oracle of feature 141 is built; " +
        "until then this test skips with its reason and never passes",
    );
  },
);
