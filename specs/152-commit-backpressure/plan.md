# Implementation Plan: Commit backpressure (feature 152)

**Branch**: `152-commit-backpressure` (a label; the directory is `specs/152-commit-backpressure`) | **Date**: 2026-11-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/152-commit-backpressure/spec.md`; constitution check
`constitution-grounding.md`; stage prompt `docs/prompts/2026-11-08-152-3-plan.md`.

## Summary

Today a hit of the pre-commit scan blocks the approval commit at step 6 of the order after an
approval (F101-FR-033), *after* the approval record was written and the tasks were ticked. The
phase stays approved and the run drifts (`commit.ts:151`, `run-feature.ts:3106-3130`). This
feature moves the decision **in front of the approval record**. On an APPROVED verdict, with the
switch on, the engine first runs the **commit gate** over exactly what the approval commit would
hold, the ticked task list included. A block never writes an approval record. It writes the block
record and a template-only corrective feedback, and returns the attempt outcome `commit-blocked`,
which the existing order after a rejection handles like `gate-failed`. A repeated signature halts
blocked on a human. The carve-out and the rule ids become pinned rule data of the kernel.

| Deliverable | Requirements |
|---|---|
| The commit gate in front of the approval record; the outcome `commit-blocked`; the retry through the rejection path | F152-FR-001 to F152-FR-004 |
| Counting, the signature halt, the bump exclusion, phase level | F152-FR-005 to F152-FR-008 |
| `feedbackOfTheCommitGate`: the template, quoting, nonce, cap | F152-FR-009 to F152-FR-012 |
| Block record before the retry; void marker; resume re-scan; counts | F152-FR-013 to F152-FR-015 |
| Rule data: schema, engine and project files, pin, carve-out as a rule | F152-FR-016 to F152-FR-019 |
| Events, the switch, the safety net, no hook, no harness name | F152-FR-020 to F152-FR-024 |

Approach: there is no as-is code to port. The as-is path stays in place untouched behind the
switch (`parity` off). The proof is 24 characterization tests, CT-152-1 to CT-152-24, plus a
parity test on FX-27 under `parity`. Everything that decides lives in `@specstride/core` and
`@specstride/kernel`; `run-feature.ts` only wires it.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ES modules, Node.js 22 or later

**Primary Dependencies**: `@specstride/kernel` (redactor, scan, the table evaluator,
`atomicWrite`); `@specstride/contracts` (closed sets, schemas, blocked reasons);
`@specstride/spec-formats` (`tickText`, which is pure). No new runtime dependency

**Storage**: the control plane of the workspace (outside the working tree):
`features/<slug>/commit-gate/phase<N>.<ordinal>.block.json` (the block record),
`features/<slug>/feedback/phase<N>.<ordinal>.md` (the corrective block, through the existing
feedback writer), `features/<slug>/commit-gate/phase<N>.void.json` (the void marker, residual
and resume cases only), `features/<slug>/commit-gate/phase<N>.pretick.md` (the pre-tick copy) and,
after a reset of the counts, `features/<slug>/commit-gate/reset-<ISO time>/`. **No new ledger
counter**: the ledger's counters are whole numbers and `CORE_COUNTERS` belongs to feature 100, so
the facts of a block are read from the block records (research D9, data-model E6)

**Testing**: the Node test runner; stub proposers and critics of feature 141 (P, CC); fixtures
with planted secrets; a property test of the corrective block (≥ 1,000 planted secrets, planted
instruction-shaped file names); kill-and-resume tests beside `recovery-wiring.test.ts`; the
parity oracle on FX-27 under `parity`

**Target Platform**: Linux and macOS (macOS `unverified` until a runner passes the oracle)

**Project Type**: changes inside `@specstride/core` (L4), `@specstride/kernel`,
`@specstride/contracts` and the composition root `packages/cli/src/engine/run-feature.ts`

**Performance Goals**: the commit gate decides in under 1 s on the largest fixture
(F152-SC-007), measured by CT-152-12b as the wall time of `commitGate` over the fixture's
change set. The scan is line-based and linear in the bytes of the changed files

**Constraints**: no matched text anywhere; no file the proposer can write takes part; the
switch off gives byte-identical behaviour to today; no harness name in control flow; no new
stop reason, attempt kind or exit code under the recommended rulings

**Scale/Scope**: 24 functional requirements, 8 success criteria; 1 new closed set; 2 new
members of closed sets (blocked reasons; `voided` in the approval failures, row 255); 1 row of the `parity` profile; 6 rulings, all answered A by the owner on 2026-11-09

## Constitution Check

*Gate: must pass before Phase 0 research, and is re-checked after the Phase 1 design.* It is
checked against constitution **v3.0.3** (`/root/specstride-dsh/.specify/memory/constitution.md`),
from `constitution-grounding.md`.

**The gate and the loop (I–V)**

- [x] I. ✅ The block record and the corrective block are written atomically to the control plane before `commit-blocked` is returned. The halt decision reads the block record of the previous ordinal (on disk), never an in-memory count. `commitsBlocked` stays only for the digest line, and `commitsLeftUncommitted` only for the end-of-run exit rule (D11)
- [x] II. ✅ The gate runs *after* APPROVED and only withholds. No approval record exists for a blocked attempt (D1). The next attempt runs the full verification gate and a fresh critic call. The corrective block goes only to `proposerPrompt`, and the critic prompt builder never reads `feedback/` (already true: it reads evidence, the verification result and the tree change). Constraint 4 of `constitution-grounding.md` ("the critic sees only the final gate result of the attempt it judges") means the **verification** gate: the commit gate runs only after APPROVED, so the critic sees no result of it (F152-FR-009)
- [x] III. ✅ File paths enter the block only as quoted, escaped, capped values inside a nonce-bound engine block. The rule data is pinned at launch and is a watched source (D6). Project rules can only add `block` rules
- [x] IV. N/A. The tick goes through `tickText` of the one grammar owner, which is only called earlier and in memory
- [x] V. ✅ The events (`redaction.commit_blocked`, `commit_gate.blocked`) inform only. The decision reads the control plane

**The product and its edges (VI–XII)**

- [x] VI. ✅ The rule data is validated against `contracts/commit-gate-rules.schema.json` at load. The logic is in core/kernel. A new import-boundary rule file `tools/import-boundary/rules/commit-gate-152.json` keeps `run-feature.ts` from deciding
- [x] VII. ✅ No harness name in any new branch (CT-152-24 is a static test)
- [x] VIII. ✅ The retry is a new phase attempt with a fresh session. The halt is a distinct blocked reason
- [x] IX. N/A. The critic is unchanged
- [x] X. N/A
- [x] XI. ✅ The corrective block is prompt content and passes `redacted()` like all feedback (`run-feature.ts:2685`)
- [x] XII. ✅ Tests use stubs and fixtures, with no paid call. No secret appears in prompt, event, evidence or digest (CT-152-10, SC-004)

**The host skill (XIII–XVII, XX)**

- [x] XIII. ✅ Retry or halt is the table `commit-gate-halt` of the kernel evaluator, recorded with its rule id (D4)
- [x] XIV. ✅ No verification command is added. Project commands stay out of scope (L-4)
- [x] XV. ✅ A mid-run change of the rule data halts as `source-changed`, and no comment overrides it
- [x] XVI. ✅ `blocked` → row O-33 refuses relaunch. The counters survive resume (ledger)
- [x] XVII. ✅ No work tree, or git missing: the commit gate is not entered, which is a skip and not a pass (CT-152-1 covers both)
- [x] XX. ✅ The gate runs once, in the approved branch of the phase attempt, on the merged tree. Units never call it

**The rewrite (XVIII, XIX)**

- [x] XVIII. ✅ The switch `commit.backpressure` is off under `parity`. With it off, the as-is path (`stepsAfterAnApproval` step 6, B-0278) runs unchanged, and FX-27 is compared. The switch is register row DV-121 (CQ-152-04 A). The 2026-11-04 exit-1 rule, itself a difference from the baseline, is register row DV-122 with the handling **waiver** (CQ-152-05 A). Both rows and their register-map entries are written in `amendments.md`, so no difference is discovered as a test result (constitution-grounding T-c)
- [x] XIX. ✅ The block is capped (20 hits, 4 KiB)

**Re-check after Phase 1 design**: unchanged. The design adds no state outside the control
plane, no parser, no exit code and no stop reason (under CQ-152-01 A and CQ-152-02 A).

## Change map

| F152-FR | Lands in (file:symbol) | Port / lock consumed | Package | New or changed |
|---|---|---|---|---|
| 001, 002, 004 | `packages/cli/src/engine/run-feature.ts` `runOneAttempt`, approved branch (:2712): call `commitGate` **before** `write(boundPath…)` (:2716) and `writeApprovalRecord` (:2725); on block return `"commit-blocked"` | scan (EP of the kernel), feedback writer | cli | changed (wiring only) |
| 001, 002 | `packages/core/src/post-approval/commit-gate.ts` `commitGate(inputs, deps)`: computes the would-be commit (changed paths, `tasks.md` as `tickText` would leave it), scans it, applies the rule data, returns `{ blocked: false } \| { blocked: true, hits, signature }` | scan port; `tickText` | core | **new** |
| 002 | `packages/core/src/engine/phase.ts` `ATTEMPT_OUTCOMES` (:329): add `"commit-blocked"` | — | core | changed |
| 002, 005 | `packages/core/src/gate/limits.ts` `KINDS_OF_A_REJECTION` (:110): add `"commit-blocked"`; `countsAfterARejection` treats it as `gate-failed` (the reject count rises, the MALFORMED streak goes to 0). No new counter | ledger `LedgerCounts` | core | changed |
| 006 | `packages/core/src/gate/limits.ts` `afterARejection` (:382): new step before the reject-limit step, with the inputs `blockSignature` and `previousBlockSignature` (the signature of the block record of ordinal k−1, read by the engine); table `commit-gate-halt` (CGH-1, CGH-2) | table evaluator (`specstride.table/1`) | core, kernel | changed |
| 006 | `packages/contracts/src/state/blocked-reasons.ts` `BLOCKED_REASONS` (:34) + the machine table + `specs/100-specstride/contracts/data/` annex row (by the owner of 100) | closed set row 4 | contracts | changed (CQ-152-01) |
| 007 | `packages/core/src/ep18/planner-tier-bump.ts` `rejectionCountsTowardsK` (:673): only a verdict REJECTED counts, and a blocked attempt's verdict is APPROVED, so it already does not count. A guard test and a named constant only | EP-18 `attempt-planner/1` | core | test + constant (CQ-152-03) |
| 008 | — (by construction: only `runOneAttempt` calls `commitGate`) + static test | — | — | test only |
| 009–012 | `packages/core/src/gate/feedback.ts` `feedbackOfTheCommitGate` beside `feedbackOfTheVerificationGate` (:404-432) | nonce (`gate/nonce.ts`) | core | **new** |
| 013 | `packages/core/src/post-approval/commit-gate.ts` `writeBlockRecord` via the `atomicWrite` port | control plane | core | **new** |
| 014 | `packages/core/src/approval/verify.ts`: a void marker → not approved, failure `voided`. `packages/core/src/approval/commit-gate-resume.ts` (new): the predicate `mustReScanOnResume` (approved ∧ no bound commit ∧ switch on ∧ commits on ∧ work tree ∧ changes). `run-feature.ts` calls it from one engine-start step before the phase loop, never from `readApproval` (:1268), so a halt there can end the run | approval record `specstride.approval/1` | core, cli | changed |
| 004, 014 | `packages/core/src/post-approval/order.ts` `stepsAfterAnApproval` (:119): with the switch on, a new port `savePreTick(phase)` before step 4; the void path restores it | `atomicWrite` | core | changed |
| 013, 015 | `packages/core/src/post-approval/commit-gate.ts`: `readBlockRecord`, `blocksOfThePhase`, `setAsideBlockRecords` (on a reset of the counts) and `stepsToCompleteABlock` (resume after a kill between the writes). No ledger counter (research D9) | control plane | core, cli | **new** |
| 016–019 | `packages/kernel/data/commit-gate/engine-v1.json` (the rules); `packages/kernel/src/redactor/commit-gate-rules.ts` (loader + validation + merge); `THE_SHAPE_OF_ORDINARY_CODE` (:1630) removed from `run-feature.ts` | schema; pattern set `widened-v1.json` | kernel | **new** / changed |
| 017 | the rule-data hash joins the run record's `sourceHashes` and the watched sources of `pass-loop/source-check.ts` (F103-FR-021) | launch contract (107), run snapshot | core, pipeline | changed |
| 020 | `packages/core/src/gate/events.ts`: the event `commit_gate.blocked` (phase, attempt, rule ids, file count, signature hash); its row in `packages/observability/data/event-catalogue.tsv` beside `redaction.commit_blocked` (:103), and in `packages/view/src/signals/table.ts` (:223) | ingress, `ForbiddenEventContentError` (`gate/events.ts:424`) | core, observability, view | **new** event (amendment row F111) |
| 021, 022 | configuration key `commit.backpressure` (110 confirms). The safety net at :3106-3130 stays, but reads `commitsLeftUncommitted` in place of `commitsBlocked` (D11). With the switch off the two are equal, so the as-is exit is unchanged | config precedence | config, cli | changed |
| 023 | static test: no new code reads `.git/hooks` or passes `--no-verify`; the gate never shells out | — | test | test only |
| 024 | static test over the new modules (harness names) | — | test | test only |

Core purity: `commit-gate.ts`, `feedbackOfTheCommitGate`, the halt table and the rule loader are
pure over ports. `run-feature.ts` passes the ports and adds about 25 lines.

## Crash and resume design

**Write order on a block** (each step uses `atomicWrite`, temporary file then rename):

1. `commit-gate/phase<N>.<k>.block.json`, the block record (data-model E1);
2. `feedback/phase<N>.<k>.md`, the corrective block, through the existing `writeFeedback`;
3. the ledger counts, as for `gate-failed` (`rejectCount` and `phaseAttemptOrdinal`, in
   `countsAfterARejection`, which already writes the counts first). No new counter;
4. return `commit-blocked`, and the order after a rejection runs.

The nonce of the corrective block is drawn once (`newNonce()`) before step 1 and stored in the
block record, so every rendering of the block, the first one and any after a resume, is the same
(research D10).

No approval record and no bound record exist for attempt k. A kill at any point leaves either:
- no block record, so resume re-runs attempt k from the start, as any interrupted attempt does
  today; or
- a block record and no counts. At the next start, `stepsToCompleteABlock` finds the block
  record of the newest ordinal and says which of steps 2 and 3 are missing. The engine renders
  the feedback from the record (its hits and nonce) if it is missing, writes the counts if the
  ledger counts of the phase show `phaseAttemptOrdinal` < k (a ledger record has no ordinal
  field, so this is how "ordinal k is counted" is read; the write is a no-op otherwise), and
  continues at attempt k+1.

**The residual and resume case** (F152-FR-014). The pre-scan includes the ticked task list, so
the step-6 scan can only block if a file changes between the pre-scan and step 6. No pass runs in
between, so this is defensive only. Two paths still need the void marker:
- (a) the step-6 scan blocks anyway: write `commit-gate/phase<N>.void.json` bound to the
  `verdictId`, then return as `commit-blocked`;
- (b) the engine died after the approval record and before step 6. This is the case where
  F101-FR-033 skips the steps.

At the next start, an engine-start step (`reScanPendingApprovals`, before the phase loop; not
inside `readApproval`, which is a reader and cannot end a run) checks (switch on): approved ∧ no `commit` in the
bound record ∧ commits on ∧ inside a work tree ∧ changes present. If all hold, it runs
`commitGate` over the pending tree. A block writes the void marker and the block record, and
the phase is **not approved**. A pass honours the approval (the next phase's commit carries the
work, as at the baseline). The predicate is `mustReScanOnResume` in core; the composition
root only calls it and `commitGate`. Because the pre-scan already passed and no pass runs between it and
step 6, this re-scan can block only if a human edited the tree while the engine was down. A
change of the rule data halts as `source-changed` before it.

**Ticks in the void paths** (F152-FR-004; F101-FR-032). The tick port has no untick
(`TickRequest`, `packages/contracts/src/ep/spec-format.ts:80`). With the switch on, the engine
saves the pre-tick bytes of the task list to `commit-gate/phase<N>.pretick.md` **before** step 4,
atomically. Every void restores them with `atomicWrite` (the mode is copied, as `tickFile` does),
and only then writes the void marker. The restore is skipped if the task list changed since the
tick in bytes other than the ticked checkboxes. In that case the engine halts `commit-gate` and
names the file, and never overwrites a human's edit. The halt ends the run through the same
blocked-halt path as the halt on a repeated signature (`outcome.blocked`, `run-feature.ts:2867`),
with `needs` = "phase <N>: tasks.md changed beyond the ticks; restore it or confirm by hand". It
also adds 1 to `commitsLeftUncommitted`, since the work of the phase stays uncommitted. As a result F101-FR-032's refusal (ticked
without a verified approval) never meets a voided phase. The pre-tick copy is removed with the
set-aside of the next approval of the phase. The verifier of F101-FR-031 counts a record whose `verdictId` has a
void marker as not approved, with the failure `voided` (a new member of annex X §X.6 row 255), and
raises the existing integrity note (`kind: approval-invalid`) with `failed: "voided"`.

**The invariant extended** (`packages/cli/test/engine/recovery-wiring.test.ts:8`): "an approval
counts only while the commit it produced is still part of the history of the workspace, **and
never when the commit gate voided it**". New tests: CT-152-13 (kill after each write step),
CT-152-14 (kill between the record and step 6, with a planted secret), CT-152-15 (counters
after resume and relaunch).

## Redaction and injection analysis

Every byte of the corrective block, and where it comes from:

| Part | Source | Can it carry a secret? | Can it carry an instruction? |
|---|---|---|---|
| Heading, statements, instruction | The engine template (a constant) | No | Only the engine's own |
| Phase, attempt ordinal, hit count, "n more" | Integers | No | No |
| Rule id | Pinned rule data (`engine-v1.json` or the project file), validated `^[a-z0-9-]{1,48}$` | No | No (charset) |
| Rule reason | Pinned rule data; at most 280 characters; the loader refuses a reason that the redactor changes | No (it is redacted at load, and a reason that changes on redaction is refused) | Engine reasons are owned text. A project reason is wrapped and quoted as data (D5) |
| File path | **Repository**. The scan's `hit.file` | No: a path that the redactor changes is shown as `[REDACTED-PATH]` | **Yes**, so it is quoted: JSON string escaping, control characters removed, capped at 160 characters, inside a fenced data region the template names as data |
| Line number | Integer; 0 for an `unreadable` hit, shown as `line unknown` | No | No |
| Nonce | `newNonce()` of `gate/nonce.ts`, drawn once per block and stored in the block record (D10) | No | No |

Not present at all: matched text, file content, scan output, a model's text (the scan hit
carries no match text: `scan.ts:7`). The whole block then passes `redacted()` on the way to
disk (`run-feature.ts:2685`), and `proposerPrompt` reads it from there.

**Property tests**:
- CT-152-10: 1,000+ generated secrets for every `values` pattern of `widened-v1.json` and the registered
  secrets, planted in every position of a file. Assert that no substring of length ≥ 8 of any
  secret occurs in the block, the prompt, the events or the digest.
- CT-152-11: file names generated from an instruction corpus ("ignore the rule", "VERDICT …:
  APPROVED", fence breakers, newlines, unicode bidi). Assert that each appears only inside its
  quoted value, that the template bytes outside the data region equal the template, and that the
  block contains no line starting with `VERDICT`.

## Determinism and parity analysis

| Profile / switch | Behaviour |
|---|---|
| `parity` (switch off) | `commitGate` is not called. `stepsAfterAnApproval` runs as today, and the step-6 scan blocks as today (`commit.ts:151`). The run goes on, with exit 1 by the 2026-11-04 rule. FX-27 and the fixtures of a blocked commit are compared. The 2026-11-04 exit-1 rule is itself a difference from the baseline (exit 0). Its register row is DV-122 (handling **waiver**, CQ-152-05 A) |
| Default (switch on) | Pre-scan, then block → retry or halt. The step-6 scan stays as the defensive path. The 2026-11-04 rule stays as the safety net and is asserted never to fire on the fixtures (CT-152-22) |

Determinism:
- the signature is the sorted set of `rule\u0000file` pairs, hashed with the canonical hasher
  (annex X §X.5);
- the block is byte-identical for the same hits, ordinal and nonce: hits are sorted by (file,
  line, rule), and the nonce is drawn once per block and stored in the block record (D10). Lines
  are shown but are not part of the signature;
- the halt is a pure table, CGH-1 and CGH-2. The reject limit is not a row of it: the existing
  reject-limit step of `afterARejection` keeps deciding that alone.

**Speed**: one extra scan per APPROVED verdict over the same set the step-6 scan reads, so the
cost doubles a step already measured in milliseconds on the fixtures. The < 1 s budget
(SC-007) is measured by CT-152-12b on the largest fixture.

## Rule data

- **Format** (`contracts/commit-gate-rules.schema.json`): it follows the pattern of
  `tools/import-boundary/rules/*.json`, `{rule, owner, requirement, reason, …}`, plus
  `effect: "block" | "exempt"`, `match: {pattern: <a name of the `values` list of widened-v1.json>} |
  {registeredSecret: true} | {unreadable: true} | {unmatched: true}` (the last two for engine rules only; a rule matches
  a hit by its kind `matched`), and a top-level `version`.
- **Engine file**: `packages/kernel/data/commit-gate/engine-v1.json`. Its rules are:
  - `cg-registered-secret` (block);
  - one `cg-<pattern>` (block) per `name` of the `values` list of `widened-v1.json` (15 on
    2026-11-09). Its `keyNames` list is for structured redaction and gives no rule;
  - `cg-unreadable` (block), `match: {unreadable: true}`, owner 152, requirement F152-FR-016,
    reason "a file of the commit could not be read, so it cannot be checked". It keeps the
    scan's fail-closed rule (F111-FR-024): today's filter keeps an `unreadable` hit, so it blocks;
  - `cg-unmatched-hit` (block), `match: {unmatched: true}`, owner 152, requirement
    F152-FR-016, reason "a check matched that the rule data does not name yet, so the commit is
    held back until a rule names it". It is the fallback for a hit no other rule matches (a
    version skew between the pattern set and the rule data), so it fails closed with an honest
    reason;
  - `cg-ordinary-code`: `exempt` of `key-name-then-value`, owner 152, requirement
    F152-FR-019, reason "a key name beside a value is the shape of ordinary code, for example
    `token: "abc"` in a test; only a pattern of a real credential holds a commit back" (the
    wording of `run-feature.ts:1628-1629`).
- **Project file**: `specstride.commit-gate.json` at the project root, optional. **Only
  `block` rules** are allowed, and only for named patterns. An `exempt` rule, a rule id that
  shadows an engine id, or an unknown pattern refuses the launch (exit 3, the refusal names the
  file).
- **Merge**: engine rules, then project rules. Exempt applies only to engine `exempt` rules. A
  hit is blocking if some `block` rule matches it and no engine `exempt` rule does.
- **Pin**: the canonical hash of (the engine file, the project file or `null`) is stored in the
  launch contract's source hashes (feature 107) and in the run record next to the version of the
  redaction pattern set (F100-FR-143). It joins the watched sources of F103-FR-021 (checked at
  launch, at resume and at every pass start). A change halts `source-changed` (exit 3), per
  CQ-152-06 A.
- **The carve-out migrated**: `THE_SHAPE_OF_ORDINARY_CODE` and its filter (`run-feature.ts:1630,
  1640`) are deleted. CT-152-19 replays every fixture of feature 111's scan tests and of
  `run-feature.test.ts` with both and asserts identical block decisions.

## Ruling dependencies

| Ruling | Plan under the recommended answer (A) | Under the other answer |
|---|---|---|
| CQ-152-01 halt | Blocked reason `commit-gate` → `max_rejects`, exit 2, `retryable` false. One row added to §E.2 and to `blocked-reasons.ts`. Nothing changes in §E.3 or §E.4 | B: add a 16th member to `STOP_REASONS` (`packages/contracts/src/codes/stop-reasons.ts:39`) and a row to §E.3, plus an exit-code row; feature 123 is unchanged (O-33). C: drop the halt step from `afterARejection`, and SC-003 changes to "halts at the reject limit" |
| CQ-152-02 kind | `plain`; the corrective block rides the feedback slot. Nothing changes in EP-18 | B: add a member to `ATTEMPT_KINDS` (`packages/contracts/src/ep/critic-strategy.ts:39`) and §E.1 `next`; the recovery planner returns `commit-retry` after `commit-blocked`; the conformance suite of EP-18 is extended |
| CQ-152-03 K | The bump history ignores `commit-blocked` | B: count it, and F149-SC-003 changes |
| CQ-152-04 switch | `commit.backpressure` on by default, `parity` off, DV-121, §X.7 row 134 | Default off: the same code, and CT-152-21 flips the default |
| CQ-152-05 exit-1 rule | Kept as the safety net under both values, reading `commitsLeftUncommitted` (D11; identical to today with the switch off). Its register row is DV-122 | Removed when the switch is on: guard the rule at :3117 with the switch off |
| CQ-152-06 rule-data change | `source-changed` (exit 3) | A separate blocked reason: one more §E.2 row |

## Project Structure

### Documentation (this feature)

```text
specs/152-commit-backpressure/
├── constitution-grounding.md   # stage 1
├── spec.md                     # stage 2
├── checklists/requirements.md  # stage 2
├── plan.md                     # this file
├── research.md                 # learnings (stage 2) + decisions (stage 3)
├── data-model.md
├── quickstart.md
└── contracts/
    ├── README.md
    ├── commit-gate-rules.schema.json
    ├── corrective-block.schema.json
    ├── block-record.schema.json
    └── closed-set-deltas.md    # proposals, not edits of specs/100-specstride/contracts/
```

### Source Code (repository root)

```text
packages/core/src/post-approval/commit-gate.ts      # new: commitGate, writeBlockRecord
packages/core/src/gate/feedback.ts                  # + feedbackOfTheCommitGate
packages/core/src/gate/limits.ts                    # + kind commit-blocked, halt step, counters
packages/core/src/engine/phase.ts                   # + outcome commit-blocked
packages/core/src/approval/                         # void marker in the read path
packages/core/src/gate/events.ts                    # + commit_gate.blocked
packages/kernel/data/commit-gate/engine-v1.json     # new
packages/kernel/src/redactor/commit-gate-rules.ts   # new: load, validate, merge, hash
packages/kernel/src/redactor/scan.ts                # + optional overlay
packages/observability/src/ingress/ingress.ts       # scanCommit passes the overlay
packages/contracts/src/state/blocked-reasons.ts     # + commit-gate (CQ-152-01 A)
packages/cli/src/engine/run-feature.ts              # wiring; carve-out removed
tools/import-boundary/rules/commit-gate-152.json    # new
packages/core/src/approval/commit-gate-resume.ts   # new: mustReScanOnResume
packages/observability/data/event-catalogue.tsv    # + commit_gate.blocked
packages/core/test/ct-152-<n>-152.test.ts           # core CTs (tasks.md, "CT map")
packages/cli/test/engine/commit-gate-retry.test.ts  # CT-152-2, -3, -4, -9 and US1 wiring
packages/cli/test/engine/commit-gate-halt.test.ts   # US2 wiring
packages/cli/test/engine/commit-gate-crash.test.ts  # US3 wiring
packages/cli/test/engine/commit-gate-switch.test.ts # CT-152-22, both switch values
packages/cli/test/engine/commit-gate-parity.test.ts # SC-008
packages/cli/test/engine/recovery-wiring.test.ts    # extended
packages/kernel/test/redactor/commit-gate-rules.test.ts
```

## Technology choices below the specification

- The would-be commit is computed, not staged. Nothing touches the index before the critic's
  approval is durable, and the pre-scan needs no git write.
- The ticked task list is scanned from `tickText`'s output in memory, so that the pre-scan and
  the step-6 scan read the same bytes. Today the scan takes paths only
  (`ingress.scanCommit(files, root)`, `packages/observability/src/ingress/ingress.ts:319`, which
  calls `scanCommitFiles` of `packages/kernel/src/redactor/scan.ts`). The kernel gains an
  optional `overlay: {path → text}` that is read in place of the file. That is one change in
  kernel and one in observability, both additive.
- The halt table uses the kernel's table evaluator (annex X §X.3), the same one as the bump.
  As for the bump table, the core holds a frozen constant of the contract file
  (`contracts/commit-gate-halt-table.json`), and a test asserts the two are equal.
- **The scan input (L-3)**: the would-be commit, that is the changed paths of the tree that
  exist at the time of the gate, plus the task list as `tickText` leaves it. It is not the
  runtime's write list. A file written and removed within the attempt is not in the commit, so
  nothing of it can enter the history through it. This keeps today's existence filter
  (`run-feature.ts:1638`).

## Complexity Tracking

| Item | Why needed | Simpler alternative rejected because |
|---|---|---|
| The exit-1 rule of 2026-11-04 needed a register row (CQ-152-05) | It is a difference from the baseline already in the code, and F152-SC-008 measures parity on the fixtures it touches | It is DV-122, a **waiver** (`amendments.md`), so the oracle reads it as a registered difference and never as a test failure (Principle XVIII) |
| The rulings CQ-152-01 to -06 (answered A, 2026-11-09) | They are owner decisions on closed sets and parity (XVIII cannot be justified away) | They are answered, so no task waits on a ruling any more. The register rows they approve are DV-121 and DV-122, written in `amendments.md` |
| The void marker and the pre-tick copy (residual and resume only) | F101-FR-033 skips the steps after a crash, so a record written before death would be honoured | Re-running the steps on resume changes F101-FR-033 for every run, not just blocked ones |
| A second scan per approval (the pre-scan) | The decision must come before the approval record | Writing the record and voiding it on every block puts the void path on the hot path and touches F101-FR-031 for every block |
