/**
 * CT-152-14 — the void of an approval (feature 152, user story 3):
 *
 *  - the void marker (T114): `voidApproval` writes
 *    `commit-gate/phase<N>.void.json` with the `verdictId` of the record it
 *    voids, and the reader of F101-FR-031 reports the record as
 *    `{approved: false, failed: "voided"}`, with the integrity note
 *    `kind: "approval-invalid"`;
 *  - the pre-tick copy (T115): `savePreTick` then `restorePreTick` gives back
 *    the exact bytes and the file mode;
 *  - the resume predicate (T170): `mustReScanOnResume` is true only when all
 *    six flags hold, and false when any one of them does not.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { atomicWrite } from "@specstride/kernel/atomic-write";
import { canonicalRecordHash } from "@specstride/kernel/hasher";

import {
  preTickPath,
  restorePreTick,
  savePreTick,
  onlyTicksChanged,
  voidApproval,
  voidMarkerPath,
  type PreTickPorts,
} from "../src/post-approval/commit-gate.ts";
import {
  INTEGRITY_EVENT_KIND,
  INTEGRITY_EVENT_TYPE,
  verifyApprovalRecord,
  type ApprovalVerificationInputs,
} from "../src/approval/verify.ts";
import { mustReScanOnResume } from "../src/approval/commit-gate-resume.ts";
import {
  APPROVAL_SCHEMA_ID,
  unsignedApprovalRecord,
  type ApprovalRecordOfThePhase,
} from "../src/approval/record.ts";
import {
  signWithTheApprovalKey,
  newApprovalKey,
  type ApprovalKeyRecord,
} from "../src/approval/key.ts";

/* ------------------------------------------------------------------ *
 * T114 — an honest signed record, and the void marker beside it.
 * ------------------------------------------------------------------ */

const KEY: ApprovalKeyRecord = newApprovalKey(
  "152-commit-backpressure",
  "2026-11-09T00:00:00.000Z",
);
const EVIDENCE_HASH = createHash("sha256").update("the phase evidence", "utf8").digest("hex");
const VERIFICATION_HASH = createHash("sha256").update("the stored result", "utf8").digest("hex");
const NONCE_HASH = createHash("sha256").update("a".repeat(16)).digest("hex");

function honestRecord(): ApprovalRecordOfThePhase {
  const unsigned = unsignedApprovalRecord(
    {
      schema: APPROVAL_SCHEMA_ID,
      feature: "152-commit-backpressure",
      phase: 1,
      runId: "run-honest",
      engineStartId: "e1",
      attemptId: "e1-a1",
      verdictId: "v-approved-1",
      nonceHash: NONCE_HASH,
      critic: {
        harness: "stub",
        provider: "stub",
        model: "stub-critic",
        form: "tool-less",
        proof: "not-made",
      },
      evidenceHash: EVIDENCE_HASH,
      verification: { mode: "required", hash: VERIFICATION_HASH },
      treeFingerprint: "tree-1",
      approvedAt: "2026-11-09T00:00:00.000Z",
    } as ApprovalRecordOfThePhase,
    KEY.keyId,
  );
  return Object.freeze({
    ...unsigned,
    sig: signWithTheApprovalKey(KEY, canonicalRecordHash(unsigned)),
  }) as ApprovalRecordOfThePhase;
}

function honestInputs(): ApprovalVerificationInputs {
  return {
    phase: 1,
    record: honestRecord(),
    key: KEY,
    verdictRecord: { verdictId: "v-approved-1", verdict: "APPROVED", nonceHash: NONCE_HASH },
    evidenceHashSetAside: EVIDENCE_HASH,
    storedVerificationHash: VERIFICATION_HASH,
    canonicalRecordHash,
  };
}

test("the void marker: voidApproval writes it with the verdictId, and the record reads as voided (T114)", async () => {
  const root = mkdtempSync(join(tmpdir(), "ct-152-14-"));
  const tasks = join(root, "tasks.md");
  try {
    writeFileSync(tasks, "# Tasks\n\n## Phase 1: One\n\n- [ ] T001 Do it\n");
    const ports: PreTickPorts = {
      tasksPath: () => tasks,
      readTasksText: () => readFileSync(tasks, "utf8"),
      inControl: (path) => join(root, path),
      readControlText: (file) => (existsSync(file) ? readFileSync(file, "utf8") : null),
      writeAtomic: (file, text, mode) =>
        void atomicWrite(file, text, { createDirectory: true, mode }),
      modeOf: (file) => statSync(file).mode & 0o7777,
      chmod: (file, mode) => chmodSync(file, mode),
    };
    // The control: the honest record verifies while nothing is voided.
    assert.equal(verifyApprovalRecord(honestInputs()).approved, true);

    const result = await voidApproval(
      { phase: 1, verdictId: "v-approved-1", ordinal: 1, path: "resume" },
      ports,
    );
    assert.equal(result.halt, undefined, "a ticks-only change never halts");

    // E4 — the marker stands at the top level of `commit-gate/` with the
    // verdictId of the record it voids.
    const markerFile = join(root, voidMarkerPath(1));
    assert.equal(existsSync(markerFile), true);
    const marker = JSON.parse(readFileSync(markerFile, "utf8")) as { verdictId?: string };
    assert.equal(marker.verdictId, "v-approved-1");

    // The reader reports the record NOT approved, with the failure `voided`,
    // and raises the integrity note `approval-invalid`, naming the phase.
    const read = verifyApprovalRecord({ ...honestInputs(), voidMarkerVerdictId: marker.verdictId });
    assert.deepEqual(
      { approved: read.approved, failed: read.failed },
      { approved: false, failed: "voided" },
    );
    assert.ok(read.integrityEvent !== undefined);
    assert.equal(read.integrityEvent.kind, INTEGRITY_EVENT_KIND);
    assert.equal(read.integrityEvent.type, INTEGRITY_EVENT_TYPE);
    assert.equal(read.integrityEvent.phase, 1);
    assert.equal(read.integrityEvent.failed, "voided");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------------ *
 * T115 — the pre-tick copy round-trips: bytes and mode.
 * ------------------------------------------------------------------ */

test("the pre-tick copy round-trips: restorePreTick gives back the exact bytes and the file mode (T115)", async () => {
  const root = mkdtempSync(join(tmpdir(), "ct-152-14-"));
  const tasks = join(root, "tasks.md");
  try {
    writeFileSync(tasks, "# Tasks\n\n## Phase 2: Two\n\n- [ ] T001 Do it\n");
    chmodSync(tasks, 0o640);
    const ports: PreTickPorts = {
      tasksPath: () => tasks,
      readTasksText: () => readFileSync(tasks, "utf8"),
      inControl: (path) => join(root, path),
      readControlText: (file) => (existsSync(file) ? readFileSync(file, "utf8") : null),
      writeAtomic: (file, text, mode) =>
        void atomicWrite(file, text, { createDirectory: true, mode }),
      modeOf: (file) => statSync(file).mode & 0o7777,
      chmod: (file, mode) => chmodSync(file, mode),
    };
    await savePreTick(2, ports);
    assert.equal(existsSync(join(root, preTickPath(2))), true, "the copy exists");

    // The tick moves the file: the mark goes in AND the mode is lost.
    writeFileSync(tasks, "# Tasks\n\n## Phase 2: Two\n\n- [x] T001 Do it\n");
    chmodSync(tasks, 0o604);

    const restored = await restorePreTick(2, ports);
    assert.equal(restored, true);
    assert.equal(
      readFileSync(tasks, "utf8"),
      "# Tasks\n\n## Phase 2: Two\n\n- [ ] T001 Do it\n",
      "the bytes are the pre-tick bytes",
    );
    assert.equal(statSync(tasks).mode & 0o7777, 0o640, "the mode is the pre-tick mode");

    // Where no copy exists, nothing is restored.
    assert.equal(await restorePreTick(3, ports), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("onlyTicksChanged: ticks only, never a human edit (T119, the rule the void leans on)", () => {
  const before =
    "# Tasks\n\n## Phase 1: One\n\n- [ ] T001 Do it\n- [ ] T002 Also\n\n## Phase 2: Two\n\n- [ ] T003 Later\n";
  const ticked =
    "# Tasks\n\n## Phase 1: One\n\n- [x] T001 Do it\n- [x] T002 Also\n\n## Phase 2: Two\n\n- [ ] T003 Later\n";
  assert.equal(onlyTicksChanged(before, ticked, 1), true, "ticks of the phase are allowed");
  assert.equal(
    onlyTicksChanged(before, ticked, 2),
    false,
    "the ticks of ANOTHER phase are not this phase's ticks",
  );
  assert.equal(
    onlyTicksChanged(before, before.replace("Do it", "Do it NOW"), 1),
    false,
    "a human edit of the task text is not ticks-only",
  );
  assert.equal(
    onlyTicksChanged(before, `${before}- [ ] T004 Added\n`, 1),
    false,
    "a line added is not ticks-only",
  );
});

/* ------------------------------------------------------------------ *
 * T170 — the resume predicate: true only when all six hold.
 * ------------------------------------------------------------------ */

test("mustReScanOnResume: true only when all six flags hold (T170)", () => {
  const all = {
    approved: true,
    boundCommit: true,
    switchOn: true,
    commits: true,
    insideAWorkTree: true,
    changed: true,
  };
  assert.equal(mustReScanOnResume(all), true, "the control: all six hold");
  for (const flag of Object.keys(all) as readonly (keyof typeof all)[]) {
    const without = { ...all, [flag]: false } as typeof all;
    assert.equal(mustReScanOnResume(without), false, `false when ${flag} does not hold`);
  }
});
