/**
 * The judgment exchange END TO END (F107-FR-009 .. F107-FR-041): derive a
 * draft, answer every judgment item the batches offer — including one
 * prerequisite kept `keep-blocker`, whose answer writes a finding with the
 * answer's provenance — and then run the strict validation and the promote
 * on the SAME completed draft file.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { derive, type DeriveArgs } from "../src/contract/commands/derive.ts";
import { validateContract } from "../src/contract/commands/validate.ts";

type BatchRecord = {
  id: string;
  items: readonly { id: string; anchor: string; kind: string; choices: readonly string[] }[];
  remaining: number;
};

function aRepository(): string {
  const repo = mkdtempSync(join(tmpdir(), "judgment-exchange-"));
  const feature = join(repo, "specs", "001-made");
  mkdirSync(feature, { recursive: true });
  execFileSync("git", ["init", "-q"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "# made\n", "utf8");
  writeFileSync(
    join(feature, "spec.md"),
    "# Feature Specification: Made\n\n- **FR-001**: it makes.\n",
    "utf8",
  );
  writeFileSync(
    join(feature, "plan.md"),
    [
      "# Implementation Plan: Made",
      "",
      "## Verification",
      "",
      "```bash",
      "python3 -m unittest discover -s tests -v",
      "```",
      "",
      "## Prerequisites",
      "",
      "- PRE-001: the approval `approvals/release-approval.json` must exist.",
      "- PRE-002: `tools/provision.sh` must be present (kept open on purpose).",
      "",
    ].join("\n"),
    "utf8",
  );
  writeFileSync(
    join(feature, "tasks.md"),
    [
      "# Tasks: Made",
      "",
      "## Phase 1: Setup",
      "- [ ] T001 Create `src/made.py`",
      "",
      "## Phase 2: Verify",
      "- [x] T002 [P] [US1] Add `tests/test_made.py`",
      "",
    ].join("\n"),
    "utf8",
  );
  return repo;
}

test("a fully answered draft with no kept blocker validates and promotes", () => {
  const repo = aRepository();
  const draftPath = join(repo, "contract.json");
  try {
    // 1. Plain derive: the draft holds exactly the bootstrap finding, open.
    const base: DeriveArgs = { repo, feature: ["specs/001-made"], output: draftPath };
    const derived = derive(base);
    assert.equal(derived.exitCode, 0, `${derived.stdout}${derived.stderr}`);
    assert.ok(existsSync(draftPath), "the draft file was written");
    const first = JSON.parse(readFileSync(draftPath, "utf8")) as {
      findings: { id: string; status: string }[];
    };
    assert.deepEqual(
      first.findings.map((one) => [one.id, one.status]),
      [["semantic-derivation-required", "open"]],
    );

    // 2. Serve batches, answer EVERY item until none remain. PRE-002 stays
    //    `keep-blocker` on purpose: its answer writes a finding that carries
    //    the answer's provenance (F107-FR-010).
    for (let round = 0; round < 32; round += 1) {
      const served = derive({
        repo,
        feature: ["specs/001-made"],
        output: draftPath,
        nextBatch: true,
      });
      assert.equal(served.exitCode, 0, `${served.stdout}${served.stderr}`);
      const batch = JSON.parse(served.stdout) as BatchRecord;
      if (batch.items.length === 0) break;
      const picks = batch.items.map((item) => ({
        item: item.id,
        choice:
          item.kind === "settle-prerequisite"
            ? "optional"
            : item.kind === "resolve-blocker"
              ? "accepted"
              : "specstride-phase:1",
      }));
      const answered = derive({
        repo,
        feature: ["specs/001-made"],
        output: draftPath,
        answer: { batch: batch.id, picks },
      });
      assert.equal(answered.exitCode, 0, `${answered.stdout}${answered.stderr}`);
    }

    // 3. The completed draft on disk: the bootstrap finding is RESOLVED and
    //    the kept blocker carries the answer provenance.
    const done = JSON.parse(readFileSync(draftPath, "utf8")) as {
      findings: { id: string; status: string; provenance?: Record<string, unknown> }[];
    };
    const bootstrap = done.findings.find((one) => one.id === "semantic-derivation-required");
    assert.ok(bootstrap, "the bootstrap finding is present");
    assert.equal(bootstrap.status, "resolved", "the completion resolved the bootstrap finding");

    // 4. Strict validation passes: as a draft (allowDraft), the answer
    //    provenance is schema-clean, and no open blocker remains.
    const validated = validateContract({ file: draftPath, root: repo, allowDraft: true });
    assert.equal(
      validated.exitCode,
      0,
      `validation refused the fully answered draft: ${JSON.stringify(validated, null, 2)}`,
    );

    // 5. Promote settles the status: exit 0, and the file on disk is stamped.
    const promoted = validateContract({ file: draftPath, root: repo, promote: true });
    assert.equal(promoted.exitCode, 0, `promote refused: ${JSON.stringify(promoted, null, 2)}`);
    const stamped = JSON.parse(readFileSync(draftPath, "utf8")) as { status?: string };
    assert.equal(stamped.status, "validated", "promote stamped the contract");

    // 6. Strict plain validation of the validated contract passes.
    const strict = validateContract({ file: draftPath, root: repo });
    assert.equal(
      strict.exitCode,
      0,
      `strict validation refused: ${JSON.stringify(strict, null, 2)}
`,
    );
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("a kept blocker carries the answer provenance, schema-clean, and strict validation names it", () => {
  const repo = aRepository();
  const draftPath = join(repo, "contract.json");
  try {
    const base: DeriveArgs = { repo, feature: ["specs/001-made"], output: draftPath };
    assert.equal(derive(base).exitCode, 0);
    for (let round = 0; round < 32; round += 1) {
      const served = derive({
        repo,
        feature: ["specs/001-made"],
        output: draftPath,
        nextBatch: true,
      });
      assert.equal(served.exitCode, 0, `${served.stdout}${served.stderr}`);
      const batch = JSON.parse(served.stdout) as BatchRecord;
      if (batch.items.length === 0) break;
      const picks = batch.items.map((item) => ({
        item: item.id,
        choice:
          item.kind === "settle-prerequisite" && item.anchor.includes("PRE-002")
            ? "keep-blocker"
            : item.kind === "settle-prerequisite"
              ? "optional"
              : item.kind === "resolve-blocker"
                ? "accepted"
                : "specstride-phase:1",
      }));
      const answered = derive({
        repo,
        feature: ["specs/001-made"],
        output: draftPath,
        answer: { batch: batch.id, picks },
      });
      assert.equal(answered.exitCode, 0, `${answered.stdout}${answered.stderr}`);
    }

    // The kept blocker is an OPEN blocker finding (F107-FR-041e), with the
    // provenance of the answer that kept it.
    const done = JSON.parse(readFileSync(draftPath, "utf8")) as {
      findings: {
        id: string;
        status: string;
        provenance?: { who?: string; route?: string; batch?: string; harness?: unknown };
      }[];
    };
    const kept = done.findings.find((one) => one.id === "missing-prerequisite-pre-002");
    assert.ok(kept, "the kept prerequisite is a finding");
    assert.equal(kept.status, "open");
    assert.ok(kept.provenance, "the kept finding carries provenance");
    assert.equal(kept.provenance!.batch, "001-made-1");
    assert.ok(kept.provenance!.who && kept.provenance!.route, "who and route recorded");

    // Strict validation refuses it AS AN OPEN BLOCKER — and no longer as a
    // provenance schema error (the old deadlock: `batch_id` required, extra
    // `batch` refused).
    const validated = validateContract({ file: draftPath, root: repo });
    assert.equal(
      validated.exitCode,
      20,
      `validation accepted an open blocker: ${JSON.stringify(validated, null, 2)}`,
    );
    assert.ok(validated.stderr.includes("is an open blocker"), validated.stderr);
    assert.ok(
      !validated.stderr.includes("provenance"),
      `provenance schema noise: ${validated.stderr}`,
    );
    assert.ok(!validated.stderr.includes("additional properties"), validated.stderr);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
