# Constitution grounding: 152-commit-backpressure

**Stage**: 1 of 3 (`docs/prompts/2026-11-08-152-1-constitution.md`): a check only. No
constitution is amended.
**Date**: 2026-11-08
**Feature input**: `docs/huntley-backpressure-prompt.md` (grounded 2026-11-08; ledger
`docs/prompts/2026-11-08-huntley-grounding-ledger.md`). "Behaviour n" below means required
behaviour n (1–8) of that prompt.

## Constitution checked

- **Checked against**: Specstride Constitution **v3.0.3** (ratified 2026-07-27, last amended
  2026-11-08), `/root/specstride-dsh/.specify/memory/constitution.md`. This repository has no
  `.specify/`.
- **Baseline of this repository's specs**: v3.0.1 (spec 100 "Sources"). The plans of the
  specs name v3.0.1 or v3.0.0 in their Constitution Check.
- **Deltas verified** (a diff of the constitution bodies and each Sync Impact Report, read back to
  3.0.1):

| Change | What changed | Touches spec 152? |
|---|---|---|
| 3.0.1 → 3.0.2 (2026-09-30, PATCH, CQ-197) | Principle III adds one sentence: inside an ignored path from which a check executes, a metadata listing is the detection for unpinned files (Wave 1, a residual risk) | Indirectly. It concerns check integrity, not the commit gate. It sets the precedent that a known detection gap is a *recorded residual risk*, which is the form behaviour 8's masking vectors should take |
| 3.0.2 → 3.0.3 (2026-11-08, PATCH) | Licence MIT → Apache-2.0 (Principle VI dependency bullet; Additional Constraints) | No |
| v3.1.1 (specstride-hermes) | v3.0.3 verbatim plus "Host Annex H — Hermes" (H1–H9), which "binds the specstride-hermes repository only" | No. The annex does not bind this repository |
| v3.0.2 (specstride-claude) | Identical to v3.0.3 except for the licence | No |

A diff of the bodies (from "# Specstride Constitution" to the end) shows that claude against dsh
differs on 3 lines (licence, version), and dsh against hermes differs only by the
inserted annex (lines 368–490) and the version line. v3.0.3 is the right engine baseline. No
`CQ-152-01` is raised on the baseline.

## Principle-by-principle check

Verdicts: **applies** (a MUST for spec 152) · **n/a** (read, and nothing binds it) · **tension**
(see "Tensions"). NN = NON-NEGOTIABLE. Governance: "Principles II, III and XVIII cannot be justified
away", so any tension on them must be *resolved by design*, never recorded as a deviation.

| Principle | What it requires of spec 152 (constitution fragment) | Behaviours bound | Tension / conflict | Ruling needed? |
|---|---|---|---|---|
| I. Durable state on disk (NN) | "Resume position is derived from verified records on disk, never from a counter held in memory." "State that the runtime relies on to decide something is kept outside the working tree." The block verdict, its corrective context and "attempt k of m" are control-plane files, written atomically ("temporary file, then rename") **before** the retry. Today `commitsBlocked` is an in-memory counter (`run-feature.ts:1635`), which a decision may not rest on | 6, 2 | **T-a** | No |
| II. Adversarial, non-self-approving gate (NN) | "The phase gate with the independent critic is the **only** source of a verdict." "An approval is a record written by the runtime, bound to the verdict… Resume verifies the record." "The critic… does not see the history of repairs, retries and escalations." "Models propose; the engine disposes." A deterministic gate may *withhold* an approval (dispose) but never *grant* one. After a block, the next attempt goes through the full verification gate and a fresh critic call. No earlier APPROVED carries over. The corrective block reaches the proposer only | 1, 5, 8 | **T-a**, **T-d** | No (by design) |
| III. Grounded, read-only, injection-proof verification (NN) | "Text that originates outside the runtime is data, never instruction: repository content, evidence…" **File names are repository content**, so a planted path is an injection channel, as is match text. "Inner checks are deterministic commands, fixed before work starts, and run by the runtime." "A check run against a changed set is recorded as tainted." "Project configuration may narrow a run but never widen it." The rule set is fixed and pinned at launch. A mid-run change is tainted. Project rule data may add rules, never remove or weaken the engine's | 4, 5, 7 | **T-d**, **T-f** | No (by design) |
| IV. Single source of spec grammar | The tick of tasks.md stays with the canonical model and adapters. Spec 152 adds no parser | — | none | No |
| V. Best-effort observability | "A bad line, a full disk, a dead collector… must never stall or fail a run." "Telemetry… is never the workflow's event bus." `redaction.commit_blocked` and any new event inform; the retry decision must not depend on an event being delivered (it reads the control plane, Principle I) | 1, 6 | none | No |
| VI. Typed core, replaceable edges (NN) | "Data is validated against a schema at every process, file… boundary." Rule-data files need a schema (malformed → refusal). "The core depends on no… host API." "Every extension point has a version, a conformance suite and a sample implementation." The commit checklist behind EP-05 must not name its implementations from core. Logic in core/kernel; wiring only in the composition root | 4, 7 | none | No |
| VII. One open harness registry (NN) | "Shared control flow never tests a harness name." Retry and halt are harness-agnostic | 1, 2 | none | No |
| VIII. Unattended, hermetic passes (NN) | "Fresh session per attempt." The retry is a new attempt, so it starts a fresh session and the corrective block is carried "through files". "A run that is blocked on a human decision says so with a distinct signal; it does not loop." The repeated-signature halt needs a **distinct** signal | 1, 2, 3 | **T-b** | Yes (via T-b) |
| IX. The critic has no tools | Unchanged. Gate evidence reaches the critic only through the grounding snapshot of the *final* state | 8 | none | No |
| X. Recorded harness versions | — | — | n/a | No |
| XI. Truthful stream telemetry | "Prompt and response content… always passes the single redaction point, which fails closed." The corrective block is prompt content, so it is captured in traces when traces are on and passes the ingress like any prompt | 5 | none | No |
| XII. Verifiable here, lawful everywhere (NN) | "Secrets… never appear in prompts, events, evidence, the digest or a UI." This is the **constitutional basis** of the template-only block (no match text). "Tests use fake binaries, stub agents and recorded fixtures" covers planted-secret fixtures and stub proposers, with no paid call | 5 | none | No |
| XIII. Facts and judgment separated | "A routing or classification decision is made by a pure table and recorded with its rule id." The retry-or-halt decision (signature dedup, attempt count) is a pure table with a rule id. The gate result is fact; the critic stays judgment. "The model never writes a status" | 2, 8 | none | No |
| XIV. Declared verification preserved, never invented | "Verification commands come only from an existing verification declaration or from commands literally declared in the plan or tasks." An extensible commit checklist that runs *project* commands must take them from declarations. Engine-owned rules (the secret scan) are not project verification commands | 4, 7 | **T-f** | No (by design) |
| XV. Invocation is consent | "No comment, mode or setting bypasses a launch check, the terms gate or a budget." A mid-run rule-data change cannot be accepted by a comment. It needs the human confirmation of behaviour 7, which is a launch-contract event | 7 | none | No |
| XVI. The supervisor relaunches only classified transients | "A relaunch happens only for a stop that the run's own records classify as transient." The new halt must be non-transient. "Counts and attempt numbers survive a resume or relaunch." Attempt k of m survives | 2, 3, 6 | **T-b** | Yes (via T-b) |
| XVII. Missing prerequisites are skips | A test that needs git or a work tree and has none is a skip with its reason, never a pass (the `not-a-work-tree` path of `approvalCommit`) | — | none | No |
| XX. Deterministic parallelism | "After every parallel group… the full verification gate runs on it before the critic." "Parallel work never produces a verdict, never spends an outer counter, and adds no exit code and no stop reason." The commit gate acts at **phase** level on the merged tree. A unit never spends the reject count | 2, 3 | **T-e** | No |
| XVIII. Parity before capability (NN) | "An intended difference is a row in the divergence register with the owner's ruling. It is never discovered as a test failure." "Documented defects and accidental behaviours are preserved unless a register row fixes them." Today's as-is behaviour (the block is reported, the run goes on; B-0278: a failed commit is silent) is parity behaviour. Block → retry is an intended difference | 1, 3 | **T-c** | Yes |
| XIX. Context is budgeted | It binds host skills. For the engine prompt, the corrective block must be bounded in size (a capped number of triples) | 5 | none | No |
| Additional Constraints | "Exit codes… Codes are part of the interface. Micro-loops and parallel units add no exit code and no stop reason." "Stop reasons: A closed, versioned enumeration, part of the interface." "State: … a control plane per workspace outside the working tree." Config precedence: "Contract pin > flag > …", so pinned rule data outranks every other source | 3, 6, 7 | **T-b**, **T-e** | Yes (via T-b) |
| Development Workflow | "Every code path degrades instead of failing: a failing proposer pass must not kill the run." "Parity tests and characterization tests are required tasks" | 1, 3 | none | No |
| Governance | "A deviation from a non-negotiable principle is recorded in the plan's Complexity Tracking… Principles II, III and XVIII cannot be justified away." "Amendments are made by the owner" | all | none | No |

## Tensions

**T-a. A deferred approval against the signed approval record (I, II; F101-FR-029/031).**
F101-FR-029 writes the signed approval record on APPROVED, and the commit comes after it
(post-approval order F101-FR-033/035). If the commit is then blocked, a valid signed record exists
for a phase whose work is not committed. Resume would honour it (F101-FR-031): the merge-base
binding (`run-feature.ts:1295-1311`) only checks a commit that *was* made, and "Where the approval
committed nothing… there is no commit to check". That is exactly the hole.
**Verdict: resolved by design, given a MUST.** A blocked approval commit voids the approval
*durably*: either the record is written only after the commit gate passes, or a void marker bound
to the record's verdict id is written atomically before the retry, and F101-FR-031 treats a
voided record as not approved. Which of the two is a stage 3 decision. Principle II's "the presence
of a file alone approves nothing" is preserved in both. Anchor: II, I; F101-FR-029, -031, -033,
-035; `recovery-wiring.test.ts:8`.

**T-b. A new stop reason against XVI, VIII and the closed set (F100-FR-148).**
VIII requires a "distinct signal" for a run blocked on a human, and XVI requires that only
classified transients relaunch. The repeated-signature halt must therefore end the run with a
non-transient reason. The Additional Constraints make stop reasons "a closed, versioned
enumeration, part of the interface" (§E.3: 15 members).
**Verdict: needs an owner ruling.** Either (i) a 16th member (proposed name for stage 2, e.g.
`commit_gate_blocked`, `transient = No`, an exit code from §E.4), or (ii) reuse of an existing
non-transient blocked-on-human member, with the cause carried in the `blocked` event's reason
(F100-FR-144 closed set §E.2). This is an interface change, not a constitution change, so no
amendment is needed. Anchor: VIII, XVI, Additional Constraints; F100-FR-144, -148; annex E §E.2–§E.4.

**T-c. Parity: today's behaviour against the new retry (XVIII).**
Under the `parity` profile the oracle compares exit codes, events and output lines with the
baseline. The baseline continues after a blocked commit (B-0278; F101-SC-005 holds FX-27 at
0 `different`). Block → retry changes attempts, events and possibly the exit.
**Verdict: resolved by design, and needs a ruling for the register row.** By F100-FR-212, the
behaviour is a **switch** whose value under `parity` "MUST be the one that reproduces the as-is
behaviour": off (report and continue). Its default is on, and it has a row in §X.7 and a
divergence-register row with the owner's ruling. The 2026-11-04 exit-1 upgrade (commit
`621cd1ff`) is itself a difference from the baseline. Stage 2 must find its register row, or
request one. XVIII cannot be justified away, so a missing register row is a blocker, not a
deviation. Anchor: XVIII; F100-FR-210, -212; F101-SC-005; annex X §X.7.

**T-d. Engine-authored corrective text against "non-self-approving" (II) and "data, never
instruction" (III).**
The corrective block is written by the engine, not by a model, so it is not model output changing
workflow state. II holds as long as the block cannot approve anything and never reaches the critic
(the critic "does not see the history of repairs, retries and escalations"). The risk is III: rule
ids and reasons come from pinned rule data (the runtime's own), but **file paths and line numbers
come from the repository**, so they originate outside the runtime.
**Verdict: resolved by design, given MUSTs.** Paths are rendered as quoted data in a fenced,
engine-labelled block with a per-call nonce; they are length-capped and escaped; and the block
carries no match text, file content or tool output. The prompt states that only the engine
approves. Behaviour 8's routing of "gate evidence to the critic" is limited to the
**final** gate result of the attempt being judged, never the history of earlier blocks. Anchor:
II, III, XII; F111-FR-031.

**T-e. The in-pass micro-layer variant against F100-FR-031, XX and the Additional Constraints.**
The micro layer (and parallel units) "add no exit code and no stop reason" and "never spend an
outer counter".
**Verdict: no conflict if the variant only repairs.** A micro-layer repair block may surface hits
inside the pass, but the block-as-halt, the reject count and the stop reason live at phase level,
and the gate itself runs on the merged tree after the pass. If stage 2 chooses this variant, it
must state that the layer spends no outer counter. Anchor: XX; F100-FR-031; F115-FR-008.

**T-f. An extensible checklist against XIV and III ("narrow, never widen").**
An extensible commit checklist may run project commands (lint, a type check). XIV says those come
only from declarations, and III says project configuration only narrows.
**Verdict: resolved by design.** Engine-owned rules (the secret scan and its carve-out moved to
data) are fixed by the engine. Project-added rules may only **add** blocks, never remove or weaken
an engine rule. Any command they run must be a declared fixed-argv verification command (XIV),
pinned in the launch contract, and changing it mid-run taints the run (III). Anchor: III, XIV, XV;
Additional Constraints (config precedence).

## Constraints carried into stage 2

Spec 152 MUST state each of these as a requirement, a success criterion, or a ruling request:

1. A blocked approval commit voids the phase's approval **durably and before the retry**. Resume
   never honours a signed approval record whose commit was blocked (I, II; T-a).
2. Every retry after a block is a new phase attempt: a fresh session, the full verification gate,
   and a fresh critic call. No earlier APPROVED carries over (II, VIII).
3. Only the critic grants an approval. The commit gate can only withhold one. Neither the gate
   nor the corrective block can produce a verdict (II).
4. The corrective block goes to the proposer only. The critic sees only the final gate result of
   the attempt it judges, never the history of blocks (II; T-d).
5. The corrective block holds no secret, no match text, no file content and no tool output. File
   paths in it are repository data: quoted, escaped, length-capped, inside an engine-labelled,
   nonce-pinned block that says only the engine approves (III, XII; T-d).
6. The block verdict, its corrective context and the attempt count are durable control-plane
   records written atomically before the retry. Nothing that decides rests on an in-memory
   counter (I, XVI).
7. The retry-or-halt decision is a pure table with a rule id, keyed on the block signature (rule
   ids plus files) and the attempt count. It is recorded with that rule id (XIII).
8. Retries are bounded by the existing reject limit. A repeated identical signature halts with a
   **distinct, non-transient** signal that is never auto-relaunched. Counts survive resume and
   relaunch (VIII, XVI; T-b → ruling).
9. The stop reason (a new §E.3 member, or the reuse of one) and any exit code are requested from
   the owner as an interface ruling (Additional Constraints; F100-FR-148; T-b).
10. The behaviour is a configuration switch. Under `parity` its value reproduces the as-is
    behaviour (report and continue), with a §X.7 row and a divergence-register row with the owner's
    ruling. The status of the 2026-11-04 exit-1 upgrade in the register is resolved (XVIII;
    F100-FR-212; T-c → ruling).
11. Rule data is schema-validated (malformed → refusal), pinned in the launch contract, fixed
    before work starts. A mid-run change is tainted and needs human confirmation (III, VI, XV).
12. Project rule data may only add blocks. It never removes or weakens an engine rule, and any
    command it runs is a declared fixed-argv verification command (III, XIV; T-f).
13. The commit gate acts at phase level on the merged tree. Micro-loop and parallel units spend no
    outer counter and add no exit code or stop reason (XX; F100-FR-031; T-e).
14. The retry decision never depends on event delivery. Events about blocks inform only (V).
15. Known masking vectors (line-split secrets, `await import()` indirection, existence-filtered
    paths) are stated as **recorded residual risks** with follow-ups, in the form of the CQ-197
    sentence of Principle III (III; v3.0.2 precedent).
16. Tests use stub proposers, planted-secret fixtures and fake binaries, with no paid call. Parity
    and characterization tests are required tasks (XII, Development Workflow).
17. Shared control flow of the retry tests no harness name (VII).
18. The corrective block is bounded in size (XIX, read for engine prompts).

## Constitution amendments proposed

None. Every tension resolves by design or by an **interface** ruling (stop reason, register row),
and no principle needs new wording. If the owner later wants "deterministic gates may withhold,
never grant, an approval" to be explicit in Principle II, that would be a PATCH (clarification,
no rule added). It is not proposed here, because the current wording ("the **only** source of a
verdict"; "Models propose; the engine disposes") already implies it.
