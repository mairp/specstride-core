# Repair report — 105-verification

Written on 2026-09-30 from the section "Feature 105" of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`.
Paths are relative to `specs/105-verification/`. Every item was checked against the file first.
No id was renumbered or reused. No file outside this directory was written.

| Item | Class | Severity | State | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-105-01 | repair | high | done | `spec.md` F105-FR-010, row EP-04 of "Extension points", logical names; `plan.md` summary; `tasks.md` T034, T050; `data-model.md`; `quickstart.md` row 9; `research.md` D-19 | Verified: annex E §E.2 gives the run record the writer "runtime root" and no field for the fact; F100-FR-066 puts every resolved key into the run snapshot. The sentence of the worklist was taken. No field of feature 100 is needed and none was invented |
| W-105-02 | repair | medium | done | `plan.md` Primary Dependencies, Constraints, re-check; `tasks.md` T129; `spec.md` F105-FR-035 and row EP-05; `research.md` D-17 | `node:child_process` removed. T129 names the process primitive of `@specstride/kernel` (F100-FR-234). The check runner was not taken, because its `start` has a time limit and the error `timeout`. Two gaps are reported below |
| W-105-03 | queue (CQ-190) | medium | done | `spec.md` F105-FR-016, F105-FR-020, edge cases, Key Entities, Assumptions, Clarifications; `plan.md` rows III and XX; `tasks.md` T068, T145, T148; `data-model.md`; `research.md` D-18 | Both requirements carry `assumption: CQ-190`. `resource` and `steps` stay in the document: the worklist removes three fields only |
| W-100-02 | repair | high | done | `spec.md`, "Out of scope" | Owner 116 |
| W-104-01 | repair | high | done | `plan.md` Primary Dependencies | "the canonical hasher of feature 104 in `@specstride/kernel`" |
| W-X-02 | repair | high | done | `plan.md` source tree; `tasks.md` T053, T054 | `packages/testkit/src/conformance/EP-07/`, `packages/testkit/src/samples/EP-07/` |
| W-100-05 | repair | medium | not applied | — | No change asked; F105-FR-002 is the reference and equals row 124 |
| W-X-05 | repair | medium | done | `spec.md`, Clarifications of 2026-09-29 | The register is named without a count |
| W-X-11 | repair | medium | done | `spec.md` F105-FR-001, F105-FR-002, F105-FR-037, "Rows of the `parity` profile"; `contracts/parity-rows.json`; `contracts/README.md`; `plan.md`; `tasks.md` T009 | Rows 123, 124, 126. The spec said "123 to 126": row 125 is owned by 148. The list `requested` of the contract file is now `owned`, with `row` and `status: confirmed`. A table header with a missing column was repaired |
| W-X-12 | repair | medium | done | `spec.md` "Closed sets"; `contracts/closed-sets.json`; `tasks.md` T008 | Rows 228 to 234. The worklist names line 537 only; all seven lines said "new". Of row 233 this feature owns `DEADLINE` only |
| W-X-18 | repair | medium | done | `spec.md` F105-FR-007 (EP-08), F105-FR-032 (EP-05) | — |
| W-X-22 | repair | medium | done | `spec.md`, new section "Threats" | T-03, T-19, T-21, T-25, each with requirements and tests |
| W-X-23 | repair | medium | done | `spec.md` F105-FR-054; `plan.md`; `tasks.md` T146, T147; `data-model.md` | The requirement cites F100-FR-009 and not F111-FR-023, because a tier 2 feature cites feature 100 only |
| W-X-27 | repair | medium | done | `plan.md` Primary Dependencies | Ajv (research D-2 of feature 100); the package `yaml` (research D-8 of feature 100) |
| W-X-31 | repair | low | done | `spec.md` F105-FR-003, F105-FR-007, F105-FR-008, F105-FR-018, F105-FR-025, F105-FR-032, F105-FR-033, F105-SC-002, user story 4, heading G3 | Literals of the baseline keep the bare word |
| W-X-34 | accept | low | not applied | — | No change asked |

Also checked: no `CQ-pending-*` placeholder, no "same-model warning", no "iteration" and no
"engine invocation" is in this feature.

## Requirements added or changed in place

| Requirement | Kind | Item |
|---|---|---|
| F105-FR-010 | changed | W-105-01 |
| F105-FR-016 | changed; new test CT-105-116 | W-105-03, CQ-190 |
| F105-FR-020 | changed | W-105-03, CQ-190 |
| F105-FR-035 | changed | W-105-02 |
| F105-FR-007, F105-FR-032 | `ep:` line added | W-X-18 |
| F105-FR-001, F105-FR-002, F105-FR-037 | `parity:` line | W-X-11 |
| F105-FR-003, F105-FR-008, F105-FR-018, F105-FR-025, F105-FR-033 | wording | W-X-31 |
| F105-FR-054 | added, test CT-105-154 | W-X-23 |

Now: 37 functional requirements, 7 success criteria, 148 tasks (T145 to T148 appended).

## What another feature or the orchestrator must do

| # | Who | What | Evidence |
|---|---|---|---|
| 1 | Feature 100 | Annex C §C.9 lets a verification-plan source report "optional declared reads and writes" (`annexes/C-ports-and-edges.md:518`). Under the recommended answer of CQ-190 a source that reads repository text reports none. One sentence is needed there; this feature did not edit it | F105-FR-016, F105-FR-020 |
| 2 | Feature 107 | F107-FR-008 still keeps "declared reads and writes when the document gives them" (`specs/107-launch-contract/spec.md:191`); W-105-03 removes that clause | Worklist, W-105-03 |
| 3 | Feature 100 | F100-FR-234 offers "start a process in a group of its own". F105-FR-035 needs a process session of its own with standard input closed (baseline B-1127). The primitive does not say either | `annexes/A-foundations.md:75` |
| 4 | Features 115 and 142 | Their layers take the fallback `gate-not-executing` from the run snapshot, key `verification.mode`, and from no field of the run record | F105-FR-010; F115-FR-004 |
| 5 | Orchestrator | The coverage check fails on feature 126, not on this one (see "Checks") | — |

No field of the run record of feature 100 is asked for.

## New questions (each with a recommended answer and its source)

| # | Question | Sources | Recommended answer | If answered otherwise |
|---|---|---|---|---|
| N-105-1 | Which component starts a detached command staged before, and with which environment? It must never be ended at its deadline, which the check runner cannot promise; started by the kernel primitive it passes by the environment allow-list and the containment of the check runner (threat T-21) | F105-FR-035; F100-FR-234; annex C §C.8; profile row 125; B-1127 | The process primitive of the kernel, in a session of its own with standard input closed, with the environment the check runner would give. Feature 100 states the session and the closed input in F100-FR-234 | EP-05 gains a start option for a detached command without an end at the time limit, owned by 148; F105-FR-035 and T129 then name the check runner |
| N-105-2 | May the verification-commands document declare `resource` and `steps`? CQ-190 names reads, writes and side effects only. An exclusive resource can only make a run more serial; steps change what runs | F105-FR-016; annex D §D.8; ruling 35 | Yes for both: `resource` narrows, and `steps` are commands declared like any other | They leave F105-FR-016 as the three fields did |

## Register rows needed (with the text)

None.

## Checks

| Check | Result |
|---|---|
| Generator or check of this feature in `contracts/tools/` | None exists |
| The two changed JSON files | Parse |
| `python3 docs/ecosystem/check-traceability.py --require-all` | FAILED with 1 error, of another feature: `[h2] F126-FR-016: still cites a register row to be written (DV-new-1)`. Feature 105: 159 of 159 items, no error |
