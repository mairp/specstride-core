# Repair report — 112-doctor

Date: 2026-09-30. All paths are relative to `/root/specstride-claude`. Line numbers are those of the files after the repair.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-112-01 | repair | low | done, in another way than the item says | `specs/112-doctor/spec.md` (clarification "How does the doctor stay inside 1,500 tokens?"); `research.md` D-8; `data-model.md`, "Limits" | Verified: the spec said "about 700 tokens", the plan of 113 says 800 (`specs/113-host-claude-code/plan.md:135`). By order of the orchestrator the figure of the brief is taken. The brief gives one figure only: the whole doctor skill within 1,500 tokens, with a trimmed body (`docs/ecosystem/feature-briefs.md:5152`, `:5181`, R16 open question 1 in heading 6). No figure of the body is written in 112. 800 was not written, because it does not fit: see "What another feature or the orchestrator must do", point 1. F112-FR-024 is unchanged |
| W-112-02 | repair | low | done | `spec.md`, table "Rows of the `parity` profile" | Verified: five cells in the separator, five in the last two rows. Now six; `doctor.probeOutputBytes` has row 61; the row of the flags has "—" in the row column |
| W-125-01 (pointer) | repair | high | done | `spec.md` F112-FR-015, F112-FR-031, F112-FR-029, F112-SC-003, scenario 4 of User Story 1; `contracts/check-catalogue.tsv` row 21; `data-model.md`; `research.md` D-2, D-14; `tasks.md` T040, T062 | Verified. The rule follows F124-FR-045 as the orchestrator ordered, cited through feature 100 (F100-FR-024; annex E §E.1; row 183 of annex X §X.6): warn for `same-model` and `unverified`, info for `same-provider`, `ok` for `diverse`, no finding for a shared model tier. The worklist names `same-model` only; the table of feature 100 (row 23) and F124-FR-045 add `unverified`, and they stand |
| W-X-02 (pointer) | repair | high | done | `plan.md` "Testing", "Source Code", "Structure Decision"; `tasks.md` T038, T042, T043, T044, T045, T058, T062; `quickstart.md` | Verified: `tests/conformance/doctor/` stood in the plan and in seven tasks. Suite in `packages/testkit/src/conformance/EP-14/`, sample in `packages/testkit/src/samples/EP-14/` |
| W-X-05 (pointer) | repair | medium | done | `spec.md`, "Assumptions" | The register is named without a count |
| W-X-11 (pointer) | repair | medium | done | `spec.md`, "Assumptions", "Closed sets", one clarification | Verified: row 61 of annex X §X.7 exists (`specs/100-specstride/annexes/X-cross-layer.md:526`; the worklist says `:525`) and row 134 of §X.6 (`:305`) |
| W-X-13 (pointer) | repair | medium | done | `spec.md`, table of "Assumptions"; `checklists/requirements.md`; `analyze-report.md` | Verified against `docs/ecosystem/CLARIFY-QUEUE.md:80`: CQ-071 is "How does a host name itself to the doctor?". The first row now cites row 134 of §X.6, the second row 61 of §X.7, the third is CQ-071, the fourth CQ-108 and CQ-150. No `CQ-pending` remains in the directory |
| W-X-22 (pointer) | repair | medium | done | `spec.md`, new section "Threats" | The worklist names T-14 only. Annex X §X.9 names 112 for nine threats (T-07, T-13, T-14, T-15, T-27, T-29, T-32, T-35, T-46); all nine are in the table, each with requirement and test |
| W-X-27 (pointer) | repair | medium | done | `plan.md`, "Primary Dependencies" | The validator of feature 100 (D-2) and the parser that feature 110 uses (D-8 of feature 100); neither is a dependency of the doctor. The dependencies are now those of the package graph |
| W-X-31 (pointer) | repair | low | done | `spec.md` F112-SC-005, F112-SC-009; `plan.md`; `research.md`; `tasks.md` T060 | "golden output check", "startup check" |
| Row 1 of the table of feature 100 (EP-16: owner 116) | — | — | done | `spec.md` F112-FR-021, "Out of scope"; `tasks.md` T051 | The toolchain check is registered by the content owner of EP-16 |
| Order of the orchestrator: place of an owner's check; CQ-189; `script(1)` | — | — | done | `spec.md` F112-FR-033 (new); `plan.md`; `tasks.md` T067, T068; `contracts/README.md`; `data-model.md`; `research.md` D-15 | See below |

## Requirements added or changed in place

| Requirement | Kind | What |
|---|---|---|
| F112-FR-015 | changed in place | The trigger of the warning is cited, not stated; four results of the diversity test mapped to severities; "or model tier" dropped; a `parity:` line added |
| F112-FR-021 | changed in place | Registered by the content owner of EP-16; the code lives in its package |
| F112-FR-029 | changed in place | Name of the warning |
| F112-FR-031 | changed in place | Name of the warning; the result `unverified`; the effect of `--strict` |
| F112-FR-033 | new; test CT-112-133; tasks T067 (`proves:`), T068 | The code of a check lives in the package of the feature that registers it; registration through the call of the kernel package (F100-FR-234); the doctor imports no owner; rows of the core catalogue with a foreign probe keep their data here and their probe there; the doctor renders what is registered. `assumption: CQ-189` |
| F112-SC-003, F112-SC-005, F112-SC-009 | changed in place | Wording only |

Counts now: 33 functional requirements, 9 success criteria, 68 tasks.

## What another feature or the orchestrator must do

1. **Feature 113, orchestrator — the body of the doctor skill.** The budget is 1,500 tokens, 4,200 bytes (F113-FR-036). The plan of 113 gives a body of 800 tokens (2,240 bytes) and a listing of 150 tokens (420 bytes) as upper limits (`specs/113-host-claude-code/plan.md:135`). The worst-case output of the doctor is 1,700 bytes (F112-FR-024). 2,240 + 420 + 1,700 = 4,360 bytes, 160 bytes over. R16 found the same with a listing of 100 tokens (10 tokens over) and proposed a body of 700. After the output, 2,500 bytes remain for listing and body: with the listing of 420 bytes the body is at most 2,080 bytes (742 tokens). Feature 113 should lower its upper limit of the body, or the orchestrator should say that the listing is outside the 1,500. Feature 112 fixes no figure of the body.
2. **Feature 116.** Its task T064 places the toolchain check in `packages/doctor/src/checks/toolchains.ts` (`specs/116-check-integrity-and-unit-evidence/plan.md:139`). By F112-FR-033 and feature 100 (annex G §G.7: "Every package registers its own"; F100-FR-234) the file belongs in `packages/integrity/`. This answers the question of its repair report (`repair-report.md:80`).
3. **Features 130, 131, 134, 138 (harness adapters), 123 (pipeline runtime).** The check for each customisation or native memory that cannot be switched off (CQ-189) and the check for `script(1)` where a stage needs it are theirs: they specify, register and hold the code. Feature 123 has no such check today: its specification names `script(1)` in `plan.md:139` and `research.md:57` and registers no doctor check for it. Ids of an adapter have the form `harness.<id>.<check>` and are confirmed by 112 (CQ-108, CQ-150); none was sent to 112 for confirmation in this repair.
4. **Feature 100 (reported, not edited).** Annex G §G.7, "Wave 1 implementations" (`specs/100-specstride/annexes/G-cli.md`), says "a loop layer its toolchain check": after the change of owner of EP-16 it is the package for the integrity of checks (feature 116). The same paragraph says "The catalogue of 44 checks"; this feature has 45 on the reading of CQ-070.
5. **Worklist.** W-125-01 asks 112 to name the trigger "same model" only. The rule applied is the wider one of F124-FR-045 and of row 23 of the table of feature 100.

## New questions (each with a recommended answer and its source)

| # | Question | Sources | Recommended answer | If answered otherwise |
|---|---|---|---|---|
| 1 | Does the budget of 1,500 tokens of the doctor skill count the resident listing of the skill? | Ruling 65; annex G §G.5; F113-FR-036; R16 F4 and open question 1; `specs/113-host-claude-code/plan.md:135` | Yes, as R16 counts it; the body is then at most 2,080 bytes (742 tokens) beside a listing of 420 bytes. Source of the answer: R16 open question 1, which recommends the trimmed body | If the listing is outside, a body of 800 tokens fits (2,240 + 1,700 = 3,940 bytes) and the plan of 113 stands |

No other new question. CQ-070, CQ-071, CQ-108, CQ-150 and CQ-189 stay open in the queue.

## Register rows needed (with the text)

None.

## Checks

| Check | Result |
|---|---|
| Generator or check in `contracts/tools/` | None exists in this feature |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED, checks a to h |
| Checks of `contracts/README.md`, by hand | 45 rows; ten with `lb`; 0 messages over 200 bytes |
| Every requirement in a task; every test name in a task | Yes (33 of 33; CT-112-133 in T067) |
| `CQ-pending`, `tests/conformance/` in the directory | 0 occurrences outside this report, which quotes the old text |
| Files outside `specs/112-doctor/` | None written. No git command that changes the repository, no subagent, no model call |
